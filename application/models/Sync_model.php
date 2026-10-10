<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Sync_model extends CI_Model {
    
    public function verify_device($device_id, $auth_token) {
        // Device authentication must fail closed until the token-hash migration
        // has been applied. Falling back to device_id-only verification would
        // silently preserve the impersonation vulnerability this method closes.
        if (!$this->db->field_exists('auth_token_hash', 'sync_devices')) {
            log_message('error', 'Sync_model::verify_device blocked: sync_devices.auth_token_hash is missing');
            return null;
        }

        if (!is_string($auth_token) || $auth_token === '') {
            return null;
        }

        $device = $this->db->where([
            'device_id' => $device_id,
            'status' => 'ACTIVE'
        ])->get('sync_devices')->row();

        if (!$device || empty($device->auth_token_hash)) {
            return null;
        }

        $provided_hash = hash('sha256', $auth_token);
        if (!hash_equals((string)$device->auth_token_hash, $provided_hash)) {
            return null;
        }

        return $device;
    }
    
    public function register_device($device_name, $school_id) {
        // Never issue a token that cannot subsequently be verified. Existing
        // installations must run the migration before enrolling/re-enrolling
        // Gen2 sync devices.
        if (!$this->db->field_exists('auth_token_hash', 'sync_devices')) {
            log_message('error', 'Sync_model::register_device blocked: sync_devices.auth_token_hash is missing');
            return [
                'status' => 'error',
                'message' => 'Device authentication storage is not configured'
            ];
        }

        $device_id = uniqid('device_', true);
        $auth_token = bin2hex(random_bytes(32));
        
        $inserted = $this->db->insert('sync_devices', [
            'device_id' => $device_id,
            'auth_token_hash' => hash('sha256', $auth_token),
            'device_name' => $device_name,
            'school_id' => $school_id,
            'status' => 'ACTIVE'
        ]);

        if (!$inserted) {
            log_message('error', 'Sync_model::register_device failed to persist device ' . $device_id);
            return [
                'status' => 'error',
                'message' => 'Device registration failed'
            ];
        }
        
        // The plaintext bearer token is intentionally returned once and never
        // stored. The caller must persist it in the protected client credential
        // store; server-side verification uses only auth_token_hash.
        return [
            'status' => 'success',
            'device_id' => $device_id,
            'auth_token' => $auth_token
        ];
    }
    
    /**
     * Return device registry metadata for the admin lifecycle screen.
     * Deliberately omits auth_token_hash and any bearer credential material.
     */
    public function list_devices_for_admin() {
        return $this->db
            ->select('device_id, device_name, school_id, last_sync_at, status, created_at')
            ->from('sync_devices')
            ->order_by('created_at', 'DESC')
            ->get()
            ->result_array();
    }

    /**
     * Rotate the bearer token for an ACTIVE device. The plaintext token is
     * returned once; only its SHA-256 hash is persisted.
     */
    public function rotate_device_token($device_id) {
        if (!$this->db->field_exists('auth_token_hash', 'sync_devices')) {
            return ['status' => 'error', 'message' => 'Device authentication storage is not configured'];
        }

        $device = $this->db->where([
            'device_id' => $device_id,
            'status' => 'ACTIVE'
        ])->get('sync_devices')->row();

        if (!$device) {
            return ['status' => 'error', 'message' => 'Only an active device can rotate its token'];
        }

        $auth_token = bin2hex(random_bytes(32));
        $updated = $this->db
            ->where('device_id', $device_id)
            ->where('status', 'ACTIVE')
            ->update('sync_devices', [
                'auth_token_hash' => hash('sha256', $auth_token)
            ]);

        if (!$updated) {
            return ['status' => 'error', 'message' => 'Token rotation failed'];
        }

        return [
            'status' => 'success',
            'device_id' => $device_id,
            'auth_token' => $auth_token
        ];
    }

    /**
     * Permanently revoke current device credentials. Reactivation requires a
     * fresh enrollment; a blocked device cannot regain access with its old token.
     */
    public function revoke_device($device_id) {
        if (!$this->db->field_exists('auth_token_hash', 'sync_devices')) {
            return ['status' => 'error', 'message' => 'Device authentication storage is not configured'];
        }

        $device = $this->db->where('device_id', $device_id)->get('sync_devices')->row();
        if (!$device) {
            return ['status' => 'error', 'message' => 'Device not found'];
        }

        if ($device->status === 'BLOCKED' && empty($device->auth_token_hash)) {
            return ['status' => 'success', 'device_id' => $device_id, 'already_revoked' => true];
        }

        $updated = $this->db
            ->where('device_id', $device_id)
            ->update('sync_devices', [
                'status' => 'BLOCKED',
                'auth_token_hash' => null
            ]);

        if (!$updated) {
            return ['status' => 'error', 'message' => 'Device revocation failed'];
        }

        return ['status' => 'success', 'device_id' => $device_id];
    }

    public function process_push_item($item, $device_id) {
        $table = $item['table_name'];
        $operation = $item['operation'];
        $data = json_decode($item['data'], true);
        $record_id = $item['record_id'];
        
        // Check for conflicts
        $conflict = $this->check_conflict($table, $record_id, $data, $device_id);
        if($conflict) {
            return [
                'id' => $item['id'],
                'status' => 'conflict',
                'conflict_id' => $conflict['id']
            ];
        }
        
        // Apply operation
        switch($operation) {
            case 'INSERT':
                $this->db->insert($table, $data);
                break;
            case 'UPDATE':
                $this->db->where($this->get_primary_key($table), $record_id)->update($table, $data);
                break;
            case 'DELETE':
                // Gen2 pull does not yet consume sync_deletions tombstones.
                // Fail closed instead of creating a deletion that other devices
                // cannot reliably observe and replay.
                throw new RuntimeException(
                    'DELETE is disabled on Gen2 sync until tombstone propagation is unified'
                );
        }
        
        return [
            'id' => $item['id'],
            'status' => 'success'
        ];
    }
    
    public function get_changes_since($table, $last_sync, $device_id) {
        $primary_key = $this->get_primary_key($table);
        
        $query = $this->db->select('*')
            ->from($table)
            ->where('last_modified_at >', $last_sync)
            ->where('device_id !=', $device_id)
            ->get();
        
        return $query->result_array();
    }
    
    public function get_syncable_tables() {
        return $this->db->select('table_name')
            ->where('sync_enabled', TRUE)
            ->get('sync_metadata')
            ->result_array();
    }
    
    public function update_device_sync($device_id) {
        $this->db->where('device_id', $device_id)
            ->update('sync_devices', ['last_sync_at' => date('Y-m-d H:i:s')]);
    }
    
    public function check_conflict($table, $record_id, $local_data, $device_id) {
        $primary_key = $this->get_primary_key($table);
        $server_record = $this->db->where($primary_key, $record_id)->get($table)->row_array();
        
        if(!$server_record) return null;
        
        $local_timestamp = strtotime($local_data['last_modified_at']);
        $server_timestamp = strtotime($server_record['last_modified_at']);
        
        if($server_timestamp > $local_timestamp && $server_record['device_id'] != $device_id) {
            // Conflict detected
            $this->db->insert('sync_conflicts', [
                'table_name' => $table,
                'record_id' => $record_id,
                'local_data' => json_encode($local_data),
                'server_data' => json_encode($server_record),
                'local_timestamp' => date('Y-m-d H:i:s', $local_timestamp),
                'server_timestamp' => date('Y-m-d H:i:s', $server_timestamp)
            ]);
            
            return ['id' => $this->db->insert_id()];
        }
        
        return null;
    }
    
    public function resolve_conflict($conflict_id, $resolution, $merged_data = null) {
        $conflict = $this->db->where('id', $conflict_id)->get('sync_conflicts')->row();
        
        if(!$conflict) {
            return ['status' => 'error', 'message' => 'Conflict not found'];
        }
        
        $data_to_apply = null;
        
        switch($resolution) {
            case 'LOCAL_WINS':
                $data_to_apply = json_decode($conflict->local_data, true);
                break;
            case 'SERVER_WINS':
                $data_to_apply = json_decode($conflict->server_data, true);
                break;
            case 'MERGED':
                $data_to_apply = $merged_data;
                break;
        }
        
        if($data_to_apply) {
            $primary_key = $this->get_primary_key($conflict->table_name);
            $this->db->where($primary_key, $conflict->record_id)
                ->update($conflict->table_name, $data_to_apply);
        }
        
        $this->db->where('id', $conflict_id)->update('sync_conflicts', [
            'resolution' => $resolution,
            'resolved_at' => date('Y-m-d H:i:s')
        ]);
        
        return ['status' => 'success'];
    }
    
    public function get_sync_status($device_id) {
        $pending = $this->db->where('synced', FALSE)->count_all_results('sync_queue');
        $conflicts = $this->db->where('resolution', 'PENDING')->count_all_results('sync_conflicts');
        $last_sync = $this->db->select('last_sync_at')->where('device_id', $device_id)->get('sync_devices')->row();
        
        return [
            'pending_sync' => $pending,
            'conflicts' => $conflicts,
            'last_sync' => $last_sync->last_sync_at ?? null
        ];
    }
    
    private function get_primary_key($table) {
        $keys = [
            'student' => 'student_id',
            'class' => 'class_id',
            'subject' => 'subject_id',
            'teacher' => 'teacher_id',
            'admin' => 'admin_id',
            'attendance' => 'attendance_id',
            'invoice' => 'invoice_id',
            'payment' => 'payment_id'
        ];
        
        return $keys[$table] ?? 'id';
    }
}
