<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Sync API Controller
 * Handles bidirectional sync between local and server databases
 *
 * SECURITY (sync hardening P0):
 * - Device identity alone is not authentication. All requests must additionally
 *   present the global sync API key (X-API-Key header), resolved from
 *   config/sync.php → settings table → SYNC_API_KEY env var (same chain used by
 *   Sync_api controller). If no key is configured, this API fails CLOSED.
 * - push()/batch_push() enforce a server-side table allowlist ("dynamic table
 *   safety"); client-supplied table names are never passed through unchecked.
 * - Device bearer tokens are verified against SHA-256 hashes stored in
 *   sync_devices.auth_token_hash. Registration is the only API-key-only
 *   bootstrap path; all data/sync methods require device credentials as well.
 */
class Sync extends CI_Controller {

    private $device_id;
    private $auth_token;

    public function __construct() {
        parent::__construct();
        $this->load->library('Offline_sync');
        $this->load->database();

        // Authenticate device
        $this->authenticate();
    }

    /**
     * Authenticate the sync API. Every request requires the global API key.
     * Device enrollment bootstraps from that key; all other methods additionally
     * require an active device ID and its bearer token.
     */
    private function authenticate() {
        // Global API key gate always runs first and fails closed when unconfigured.
        $api_key = $this->resolve_api_key();
        $provided_key = $this->input->get_request_header('X-API-Key');
        if(empty($api_key) || !is_string($provided_key) || !hash_equals((string)$api_key, (string)$provided_key)) {
            log_message('error', 'api/Sync: request rejected — missing or invalid X-API-Key');
            $this->output->set_status_header(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }

        // A new device cannot already possess valid device credentials. Enrollment
        // is therefore the sole API-key-only bootstrap path. The plaintext token
        // returned by register_device() is one-time and only its hash is stored.
        $method = $this->router->fetch_method();
        if($method === 'register_device') {
            return;
        }

        $this->device_id = $this->input->get_request_header('X-Device-ID');
        $this->auth_token = $this->input->get_request_header('X-Auth-Token');
        if(!$this->device_id || !$this->auth_token) {
            $this->output->set_status_header(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }

        $device = $this->Sync_model->verify_device($this->device_id, $this->auth_token);
        if(!$device) {
            $this->output->set_status_header(403);
            echo json_encode(['error' => 'Invalid device']);
            exit;
        }
    }

    /**
     * PUSH: Upload local changes to server
     */
    public function push() {
        $data = json_decode($this->input->raw_input_stream, true);

        if(!$data || !isset($data['queue'])) {
            echo json_encode(['status' => 'error', 'message' => 'Invalid data']);
            return;
        }

        $this->db->trans_start();

        $results = [];
        foreach($data['queue'] as $item) {
            try {
                $result = $this->Sync_model->process_push_item($item, $this->device_id);
                $results[] = $result;
            } catch(Exception $e) {
                $results[] = [
                    'id' => $item['id'],
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }
        }

        $this->db->trans_complete();

        // Update device last sync
        $this->Sync_model->update_device_sync($this->device_id);

        echo json_encode([
            'status' => 'success',
            'results' => $results,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * PULL: Download server changes to local
     */
    public function pull() {
        $last_sync = $this->input->post('last_sync');
        $tables = $this->input->post('tables') ?: [];

        if(empty($tables)) {
            $tables = $this->Sync_model->get_syncable_tables();
        }

        $changes = [];
        foreach($tables as $table) {
            $records = $this->Sync_model->get_changes_since($table, $last_sync, $this->device_id);
            if(!empty($records)) {
                $changes[$table] = $records;
            }
        }

        echo json_encode([
            'status' => 'success',
            'changes' => $changes,
            'timestamp' => date('Y-m-d H:i:s')
        ]);
    }

    /**
     * Register new device
     */
    public function register_device() {
        $device_name = $this->input->post('device_name');
        $school_id = $this->input->post('school_id');

        $result = $this->Sync_model->register_device($device_name, $school_id);

        echo json_encode($result);
    }

    /**
     * Get sync status
     */
    public function status() {
        $status = $this->Sync_model->get_sync_status($this->device_id);
        echo json_encode($status);
    }

    /**
     * Resolve conflict
     */
    public function resolve_conflict() {
        $conflict_id = $this->input->post('conflict_id');
        $resolution = $this->input->post('resolution');
        $merged_data = $this->input->post('merged_data');

        $result = $this->Sync_model->resolve_conflict($conflict_id, $resolution, $merged_data);

        echo json_encode($result);
    }

    /**
     * BATCH_PUSH: Upload multiple records at once with atomic insert/update handling
     *
     * This method handles the critical edge case where a record is inserted offline
     * and updated (one or more times) before the first sync occurs.
     *
     * Uses an FK-safe primary-key upsert: existing rows are updated in place and
     * new rows are inserted without DELETE+INSERT/REPLACE semantics.
     *
     * @return JSON response with per-record success/failure status
     *
     * Validates Requirements 2.3, 2.4
     */
    public function batch_push() {
        // Get input data
        $data = json_decode($this->input->raw_input_stream, true);

        // Validate input
        if(!$data || !isset($data['records']) || !is_array($data['records'])) {
            $this->output
                ->set_status_header(400)
                ->set_content_type('application/json')
                ->set_output(json_encode([
                    'status' => 'error',
                    'message' => 'Invalid data format. Expected {records: [...]}'
                ]));
            return;
        }

        // Start transaction for atomicity
        $this->db->trans_start();

        $results = [];
        $success_count = 0;
        $failed_count = 0;

        // Process each record
        foreach($data['records'] as $record) {
            try {
                // Validate record structure
                if(!isset($record['table_name']) || !isset($record['data'])) {
                    $results[] = [
                        'table' => $record['table_name'] ?? 'unknown',
                        'record_id' => $record['record_id'] ?? null,
                        'status' => 'failed',
                        'error' => 'Missing required fields (table_name, data)'
                    ];
                    $failed_count++;
                    continue;
                }

                $table = $record['table_name'];
                $record_data = $record['data'];
                $record_id = $record['record_id'] ?? null;

                // Enforce server-side table allowlist before any write
                $resolved_table = $this->resolve_allowed_table($table);
                if($resolved_table === null) {
                    log_message('error', 'api/Sync batch_push blocked disallowed table: ' . var_export($table, true));
                    $results[] = [
                        'table' => $table,
                        'record_id' => $record_id,
                        'status' => 'failed',
                        'error' => 'Table not allowed'
                    ];
                    $failed_count++;
                    continue;
                }
                $table = $resolved_table;

                // FK-safe insert-or-update. Existing rows keep their identity and
                // dependent foreign-key/audit relationships; new offline rows retain
                // the supplied primary key on first sync.
                $result = $this->process_batch_record($table, $record_data, $record_id);

                $results[] = [
                    'table' => $table,
                    'record_id' => $record_id,
                    'status' => 'success',
                    'operation' => $result['operation']
                ];
                $success_count++;

            } catch(Exception $e) {
                // Log error
                log_message('error', "Batch push failed for {$table}:{$record_id} - {$e->getMessage()}");

                $results[] = [
                    'table' => $record['table_name'] ?? 'unknown',
                    'record_id' => $record['record_id'] ?? null,
                    'status' => 'failed',
                    'error' => $e->getMessage()
                ];
                $failed_count++;
            }
        }

        // Complete transaction
        $this->db->trans_complete();

        // Check if transaction succeeded
        if ($this->db->trans_status() === FALSE) {
            // Transaction failed - rollback occurred
            $this->output
                ->set_status_header(500)
                ->set_content_type('application/json')
                ->set_output(json_encode([
                    'status' => 'error',
                    'message' => 'Transaction failed - all changes rolled back',
                    'results' => $results
                ]));
            return;
        }

        // Update device last sync timestamp
        $this->Sync_model->update_device_sync($this->device_id);

        // Return results
        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode([
                'status' => $failed_count === 0 ? 'success' : 'partial',
                'message' => sprintf(
                    'Processed %d records: %d succeeded, %d failed',
                    count($data['records']),
                    $success_count,
                    $failed_count
                ),
                'summary' => [
                    'total' => count($data['records']),
                    'success' => $success_count,
                    'failed' => $failed_count
                ],
                'results' => $results,
                'timestamp' => date('Y-m-d H:i:s')
            ]));
    }

    /**
     * Process one batch record without destructive REPLACE semantics.
     *
     * Existing records are updated in place by primary key so foreign-key and
     * audit relationships are preserved. New offline records are inserted and,
     * when record_id is supplied separately, retain that identifier on first sync.
     *
     * @param string $table Table name
     * @param array $data Record data
     * @param mixed $record_id Primary key value
     * @return array Result with operation type
     */
    private function process_batch_record($table, $data, $record_id) {
        $primary_key = $this->get_table_primary_key($table);

        // A batch item has one authoritative identity. Reject conflicting IDs
        // instead of inserting/updating a different row than record_id names.
        if ($record_id !== null && array_key_exists($primary_key, $data)
            && (string)$data[$primary_key] !== (string)$record_id) {
            throw new InvalidArgumentException('record_id does not match payload primary key');
        }

        // Some clients provide the primary key inside data, others use record_id.
        $lookup_id = $record_id;
        if ($lookup_id === null && array_key_exists($primary_key, $data)) {
            $lookup_id = $data[$primary_key];
        }

        $exists = false;
        if ($lookup_id !== null) {
            $exists = $this->db->where($primary_key, $lookup_id)
                ->count_all_results($table) > 0;
        }

        if ($exists) {
            // Never attempt to mutate the primary key of an existing row.
            $update_data = $data;
            unset($update_data[$primary_key]);

            if (!empty($update_data)) {
                $this->db->where($primary_key, $lookup_id)
                    ->update($table, $update_data);
            }

            return ['operation' => 'updated'];
        }

        // Preserve the offline-created identity when the ID arrived separately.
        if ($record_id !== null && !array_key_exists($primary_key, $data)) {
            $data[$primary_key] = $record_id;
        }

        $this->db->insert($table, $data);
        return ['operation' => 'inserted'];
    }

    /**
     * Get primary key column name for a table
     *
     * @param string $table Table name
     * @return string Primary key column name
     */
    private function get_table_primary_key($table) {
        // Common primary key patterns in this codebase
        $primary_keys = [
            'student' => 'student_id',
            'enroll' => 'enroll_id',
            'parent' => 'parent_id',
            'class' => 'class_id',
            'section' => 'section_id',
            'subject' => 'subject_id',
            'teacher' => 'teacher_id',
            'admin' => 'admin_id',
            'invoice' => 'invoice_id',
            'payment' => 'payment_id',
            'daily_fee_transactions' => 'transaction_id',
            'daily_fee_wallet' => 'wallet_id',
            'discount_profiles' => 'profile_id',
            'student_discount_assignments' => 'assignment_id',
            'attendance' => 'attendance_id',
            'exam' => 'exam_id',
            'exam_marks' => 'mark_id',
            'grade' => 'grade_id'
        ];

        // Return mapped primary key or default to 'id'
        return $primary_keys[$table] ?? 'id';
    }
}
