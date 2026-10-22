<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Sync Conflicts Controller
 *
 * Privileged review and resolution of multi-location sync conflicts.
 * Conflict decisions can overwrite live business records, therefore the
 * surface is restricted to level-1 super administrators and all mutations
 * are POST/CSRF protected by CodeIgniter.
 */
class Sync_conflicts extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');

        if ($this->session->userdata('admin_login') != 1) {
            if ($this->input->is_ajax_request()) {
                $this->respond_json(false, 'Authentication required.', 401);
                $this->output->_display();
                exit;
            }

            redirect(site_url('login'), 'location', 302);
            exit;
        }

        $admin_id = (int) $this->session->userdata('admin_id');
        $admin = $this->db
            ->select('level')
            ->from('admin')
            ->where('admin_id', $admin_id)
            ->get()
            ->row();

        if (!$admin || (int) $admin->level !== 1) {
            if ($this->input->is_ajax_request()) {
                $this->respond_json(false, 'Super administrator permission required.', 403);
                $this->output->_display();
                exit;
            }

            $this->session->set_flashdata('error_message', 'Super administrator permission required.');
            redirect(site_url('admin/dashboard'), 'location', 302);
            exit;
        }

        $this->load->model('Sync_conflict_model');
        $this->load->model('Location_registry_model');
        $this->load->library('Conflict_resolver');
        $this->load->library('Audit_logger');
    }

    public function index() {
        $filters = [
            'table_name' => $this->input->get('table'),
            'status' => $this->input->get('status') ?: 'pending'
        ];

        $page_data['conflicts'] = $this->Sync_conflict_model->get_pending_conflicts($filters, 100);
        $page_data['counts_by_table'] = $this->Sync_conflict_model->get_conflict_counts_by_table();
        $page_data['stats'] = $this->Sync_conflict_model->get_conflict_stats();
        $page_data['filters'] = $filters;
        $page_data['csrf_token_name'] = $this->security->get_csrf_token_name();
        $page_data['csrf_token_hash'] = $this->security->get_csrf_hash();
        $page_data['page_name'] = 'sync_conflicts_list';
        $page_data['page_title'] = get_phrase('sync_conflicts');

        $this->load->view('backend/index', $page_data);
    }

    public function view($id) {
        $conflict = $this->Sync_conflict_model->get_conflict((int) $id);

        if (!$conflict) {
            $this->session->set_flashdata('error_message', 'Conflict not found');
            redirect(site_url('sync_conflicts'), 'location', 302);
            return;
        }

        $page_data['local_location'] = $this->Location_registry_model->get_location_by_device_id($conflict->local_device_id);
        $page_data['remote_location'] = $this->Location_registry_model->get_location_by_device_id($conflict->remote_device_id);
        $page_data['diff'] = $this->calculate_diff($conflict->local_data, $conflict->remote_data);
        $page_data['conflict'] = $conflict;
        $page_data['csrf_token_name'] = $this->security->get_csrf_token_name();
        $page_data['csrf_token_hash'] = $this->security->get_csrf_hash();
        $page_data['page_name'] = 'sync_conflict_detail';
        $page_data['page_title'] = get_phrase('conflict_detail');

        $this->load->view('backend/index', $page_data);
    }

    public function merge_view($id) {
        $conflict = $this->Sync_conflict_model->get_conflict((int) $id);

        if (!$conflict) {
            $this->session->set_flashdata('error_message', 'Conflict not found');
            redirect(site_url('sync_conflicts'), 'location', 302);
            return;
        }

        if ($conflict->status !== Sync_conflict_model::STATUS_PENDING) {
            $this->session->set_flashdata('error_message', 'This conflict has already been resolved');
            redirect(site_url('sync_conflicts/view/' . (int) $id), 'location', 302);
            return;
        }

        if (!$this->validate_conflict_target($conflict->table_name)) {
            $this->session->set_flashdata('error_message', 'The conflict target is not an enabled sync table.');
            redirect(site_url('sync_conflicts/view/' . (int) $id), 'location', 302);
            return;
        }

        $page_data['local_location'] = $this->Location_registry_model->get_location_by_device_id($conflict->local_device_id);
        $page_data['remote_location'] = $this->Location_registry_model->get_location_by_device_id($conflict->remote_device_id);
        $page_data['diff'] = $this->calculate_diff($conflict->local_data, $conflict->remote_data);
        $page_data['primary_key'] = $this->get_primary_key($conflict->table_name);
        $page_data['conflict'] = $conflict;
        $page_data['csrf_token_name'] = $this->security->get_csrf_token_name();
        $page_data['csrf_token_hash'] = $this->security->get_csrf_hash();
        $page_data['page_name'] = 'sync_conflict_merge';
        $page_data['page_title'] = get_phrase('merge_conflict');

        $this->load->view('backend/index', $page_data);
    }

    public function keep_local($id) {
        $this->require_post();
        $conflict = $this->get_pending_conflict((int) $id);
        if (!$conflict) {
            return;
        }

        $ok = $this->apply_resolution(
            $conflict,
            $conflict->local_data,
            Sync_conflict_model::RESOLUTION_LOCAL_WINS,
            'push',
            $conflict->local_device_id,
            $conflict->remote_device_id,
            $conflict->remote_data
        );

        $this->respond_json($ok, $ok ? 'Local version applied' : 'Unable to apply local version.', $ok ? 200 : 422);
    }

    public function keep_remote($id) {
        $this->require_post();
        $conflict = $this->get_pending_conflict((int) $id);
        if (!$conflict) {
            return;
        }

        $ok = $this->apply_resolution(
            $conflict,
            $conflict->remote_data,
            Sync_conflict_model::RESOLUTION_REMOTE_WINS,
            'pull',
            $conflict->remote_device_id,
            $conflict->local_device_id,
            $conflict->local_data
        );

        $this->respond_json($ok, $ok ? 'Remote version applied' : 'Unable to apply remote version.', $ok ? 200 : 422);
    }

    public function merge($id) {
        $this->require_post();
        $conflict = $this->get_pending_conflict((int) $id);
        if (!$conflict) {
            return;
        }

        $merged_data = json_decode((string) $this->input->post('merged_data'), true);
        if (!is_array($merged_data) || empty($merged_data)) {
            $this->respond_json(false, 'No merged data provided.', 422);
            return;
        }

        $ok = $this->apply_resolution(
            $conflict,
            $merged_data,
            Sync_conflict_model::RESOLUTION_MERGED,
            'push',
            $this->get_device_id(),
            null,
            ['local' => $conflict->local_data, 'remote' => $conflict->remote_data],
            $merged_data
        );

        $this->respond_json($ok, $ok ? 'Merged version applied' : 'Unable to apply merged version.', $ok ? 200 : 422);
    }

    public function ignore($id) {
        $this->require_post();
        $conflict = $this->get_pending_conflict((int) $id);
        if (!$conflict) {
            return;
        }

        $this->db->trans_begin();
        $fresh = $this->lock_pending_conflict($conflict->id);
        if (!$fresh || !$this->Sync_conflict_model->ignore_conflict($conflict->id, (int) $this->session->userdata('admin_id'))) {
            $this->db->trans_rollback();
            $this->respond_json(false, 'Unable to ignore conflict.', 409);
            return;
        }

        if ($this->db->trans_status() === false) {
            $this->db->trans_rollback();
            $this->respond_json(false, 'Unable to ignore conflict.', 500);
            return;
        }

        $this->db->trans_commit();
        $this->respond_json(true, 'Conflict ignored');
    }

    public function bulk_resolve() {
        $this->require_post();
        $ids = $this->input->post('ids');
        $resolution = (string) $this->input->post('resolution');
        $allowed = ['local_wins', 'remote_wins', 'ignore'];

        if (empty($ids) || !is_array($ids)) {
            $this->respond_json(false, 'No conflicts selected.', 422);
            return;
        }

        if (!in_array($resolution, $allowed, true)) {
            $this->respond_json(false, 'Invalid bulk resolution.', 422);
            return;
        }

        $resolved = 0;
        $failed = 0;

        foreach (array_unique(array_map('intval', $ids)) as $id) {
            if ($id <= 0) {
                $failed++;
                continue;
            }

            $conflict = $this->get_pending_conflict($id, false);
            if (!$conflict) {
                $failed++;
                continue;
            }

            if ($resolution === 'ignore') {
                $this->db->trans_begin();
                $fresh = $this->lock_pending_conflict($conflict->id);
                $ok = $fresh && $this->Sync_conflict_model->ignore_conflict($conflict->id, (int) $this->session->userdata('admin_id'));
                if (!$ok || $this->db->trans_status() === false) {
                    $this->db->trans_rollback();
                    $failed++;
                    continue;
                }
                $this->db->trans_commit();
                $resolved++;
                continue;
            }

            if ($resolution === 'local_wins') {
                $ok = $this->apply_resolution(
                    $conflict,
                    $conflict->local_data,
                    Sync_conflict_model::RESOLUTION_LOCAL_WINS,
                    'push',
                    $conflict->local_device_id,
                    $conflict->remote_device_id,
                    $conflict->remote_data
                );
            } else {
                $ok = $this->apply_resolution(
                    $conflict,
                    $conflict->remote_data,
                    Sync_conflict_model::RESOLUTION_REMOTE_WINS,
                    'pull',
                    $conflict->remote_device_id,
                    $conflict->local_device_id,
                    $conflict->local_data
                );
            }

            if ($ok) {
                $resolved++;
            } else {
                $failed++;
            }
        }

        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode([
                'success' => $failed === 0,
                'message' => $resolved . ' conflicts resolved' . ($failed ? '; ' . $failed . ' skipped or failed' : ''),
                'resolved' => $resolved,
                'failed' => $failed
            ]));
    }

    public function stats() {
        $this->output
            ->set_content_type('application/json')
            ->set_output(json_encode($this->Sync_conflict_model->get_conflict_stats()));
    }

    private function require_post() {
        if ($this->input->method(true) !== 'POST') {
            $this->output
                ->set_status_header(405)
                ->set_header('Allow: POST')
                ->set_content_type('application/json')
                ->set_output(json_encode([
                    'success' => false,
                    'message' => 'POST required.'
                ]));
            $this->output->_display();
            exit;
        }
    }

    private function get_pending_conflict($id, $respond = true) {
        $conflict = $this->Sync_conflict_model->get_conflict((int) $id);
        if (!$conflict) {
            if ($respond) {
                $this->respond_json(false, 'Conflict not found.', 404);
            }
            return null;
        }

        if ($conflict->status !== Sync_conflict_model::STATUS_PENDING) {
            if ($respond) {
                $this->respond_json(false, 'This conflict is no longer pending.', 409);
            }
            return null;
        }

        return $conflict;
    }

    private function lock_pending_conflict($id) {
        return $this->db->query(
            'SELECT id, status FROM sync_conflicts WHERE id = ? AND status = ? FOR UPDATE',
            [(int) $id, Sync_conflict_model::STATUS_PENDING]
        )->row();
    }

    private function validate_conflict_target($table) {
        if (!is_string($table) || !preg_match('/^[A-Za-z][A-Za-z0-9_]*$/', $table)) {
            return false;
        }

        if (!$this->db->table_exists($table) || !$this->db->table_exists('sync_metadata')) {
            return false;
        }

        $metadata = $this->db
            ->where('table_name', $table)
            ->where('sync_enabled', 1)
            ->get('sync_metadata')
            ->row();

        if (!$metadata) {
            return false;
        }

        foreach (['sync_status', 'last_modified_at', 'last_modified_by'] as $required_field) {
            if (!$this->db->field_exists($required_field, $table)) {
                return false;
            }
        }

        return true;
    }

    private function apply_version($table, $record_id, $data) {
        if (!$this->validate_conflict_target($table) || !is_array($data)) {
            return false;
        }

        $primary_key = $this->get_primary_key($table);
        if (!$primary_key) {
            return false;
        }

        $fields = $this->db->field_data($table);
        $allowed_fields = [];
        foreach ($fields as $field) {
            $allowed_fields[$field->name] = true;
        }

        $update_data = [];
        foreach ($data as $field => $value) {
            if (isset($allowed_fields[$field]) && $field !== $primary_key) {
                $update_data[$field] = $value;
            }
        }

        unset(
            $update_data['sync_status'],
            $update_data['last_modified_at'],
            $update_data['last_modified_by'],
            $update_data['device_id'],
            $update_data['version'],
            $update_data['retry_count'],
            $update_data['sync_error']
        );

        $update_data['sync_status'] = 'PENDING';
        $update_data['last_modified_at'] = date('Y-m-d H:i:s');
        $update_data['last_modified_by'] = (int) $this->session->userdata('admin_id');

        $exists = $this->db
            ->where($primary_key, $record_id)
            ->count_all_results($table);
        if ($exists !== 1) {
            return false;
        }

        return $this->db
            ->where($primary_key, $record_id)
            ->update($table, $update_data);
    }

    private function apply_resolution($conflict, $data, $resolution, $direction, $source_device, $target_device, $old_value, $merged_data = null) {
        if (!$conflict || !$this->validate_conflict_target($conflict->table_name)) {
            return false;
        }

        $this->db->trans_begin();

        if (!$this->lock_pending_conflict($conflict->id)) {
            $this->db->trans_rollback();
            return false;
        }

        $applied = $this->apply_version($conflict->table_name, $conflict->record_id, $data);
        if ($applied === false) {
            $this->db->trans_rollback();
            return false;
        }

        $resolved = $this->Sync_conflict_model->resolve_conflict(
            $conflict->id,
            $resolution,
            (int) $this->session->userdata('admin_id'),
            $merged_data
        );
        if (!$resolved) {
            $this->db->trans_rollback();
            return false;
        }

        $audit_id = $this->Audit_logger->log(
            $conflict->table_name,
            $conflict->record_id,
            'CONFLICT',
            $source_device,
            $target_device,
            $old_value,
            $data,
            $direction,
            (int) $this->session->userdata('admin_id'),
            0,
            'success'
        );
        if (!$audit_id || $this->db->trans_status() === false) {
            $this->db->trans_rollback();
            return false;
        }

        $this->db->trans_commit();
        return true;
    }

    private function calculate_diff($local, $remote) {
        $local = is_array($local) ? $local : [];
        $remote = is_array($remote) ? $remote : [];
        $diff = [];
        $all_keys = array_unique(array_merge(array_keys($local), array_keys($remote)));

        foreach ($all_keys as $key) {
            if (in_array($key, ['sync_status', 'last_modified_at', 'last_modified_by', 'device_id', 'version', 'retry_count', 'sync_error'], true)) {
                continue;
            }

            $local_val = $local[$key] ?? null;
            $remote_val = $remote[$key] ?? null;
            $diff[$key] = [
                'local' => $local_val,
                'remote' => $remote_val,
                'is_different' => $local_val !== $remote_val
            ];
        }

        return $diff;
    }

    private function get_primary_key($table) {
        if (!$this->validate_conflict_target($table)) {
            return null;
        }

        foreach ($this->db->field_data($table) as $field) {
            if (!empty($field->primary_key)) {
                return $field->name;
            }
        }

        return null;
    }

    private function get_device_id() {
        $setting = $this->db->get_where('settings', ['type' => 'device_id'])->row();
        return $setting ? $setting->description : 'local-server-001';
    }

    private function respond_json($success, $message, $status = 200, array $extra = []) {
        $payload = array_merge([
            'success' => (bool) $success,
            'message' => $message
        ], $extra);

        return $this->output
            ->set_status_header((int) $status)
            ->set_content_type('application/json')
            ->set_output(json_encode($payload));
    }
}
