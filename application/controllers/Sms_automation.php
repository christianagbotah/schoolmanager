<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Sms_automation extends CI_Controller {

    private $supported_triggers = [
        'monthly_bill_reminder' => 'Monthly Bill Reminder'
    ];

    function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');
        $this->load->model('Sms_model', 'sms_model');
        $this->output->set_header('Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
        $this->output->set_header('Pragma: no-cache');

        if ($this->session->userdata('admin_login') != 1) {
            redirect(site_url('login'), 'refresh');
            exit;
        }
    }

    public function index() {
        $page_data['page_name'] = 'sms_automation';
        $page_data['page_title'] = get_phrase('sms_automation');
        $this->load->view('backend/index', $page_data);
    }

    public function modal($param1 = '') {
        $page_data['param1'] = (int)$param1;
        $page_data['supported_triggers'] = $this->supported_triggers;
        $this->load->view('backend/modal/sms_automation_form', $page_data);
    }

    public function test_modal($automation_id) {
        $automation = $this->get_automation((int)$automation_id);
        if (!$automation) {
            show_404();
            return;
        }
        $page_data['automation_id'] = (int)$automation_id;
        $page_data['automation'] = $automation;
        $this->load->view('backend/modal/sms_test_form', $page_data);
    }

    public function logs_modal($automation_id) {
        $automation_id = (int)$automation_id;
        $logs = $this->db->select('sal.*, sa.name as automation_name')
            ->from('sms_automation_logs sal')
            ->join('sms_automations sa', 'sal.automation_id = sa.id')
            ->where('sal.automation_id', $automation_id)
            ->order_by('sal.sent_at', 'DESC')
            ->limit(100)
            ->get()->result_array();
        $page_data['logs'] = $logs;
        $this->load->view('backend/modal/sms_logs', $page_data);
    }

    public function save() {
        if (strtoupper($this->input->method()) !== 'POST') {
            return $this->json_response(['status' => 'error', 'message' => 'POST request required'], 405);
        }

        $automation_id = (int)$this->input->post('automation_id');
        $existing = $automation_id ? $this->get_automation($automation_id) : null;
        if ($automation_id && !$existing) {
            return $this->json_response(['status' => 'error', 'message' => 'Automation not found'], 404);
        }

        $name = trim((string)$this->input->post('name'));
        $trigger_event = trim((string)$this->input->post('trigger_event'));
        $message_template = trim((string)$this->input->post('message_template'));
        if ($name === '' || $trigger_event === '' || $message_template === '') {
            return $this->json_response(['status' => 'error', 'message' => 'Name, trigger and message template are required'], 422);
        }

        $is_supported = $this->is_supported_trigger($trigger_event);
        $is_same_legacy_trigger = $existing && !$is_supported && $existing['trigger_event'] === $trigger_event;
        if (!$is_supported && !$is_same_legacy_trigger) {
            return $this->json_response(['status' => 'error', 'message' => 'That trigger is not connected to an execution workflow yet.'], 422);
        }

        $data = [
            'name' => mb_substr($name, 0, 255),
            'trigger_event' => $trigger_event,
            'recipients' => $is_supported ? 'parents' : ($existing['recipients'] ?? 'parents'),
            'message_template' => $message_template,
            'trigger_days' => 0,
            'is_active' => $is_supported && $this->input->post('is_active') ? 1 : 0
        ];

        if ($data['is_active'] && $this->other_active_monthly_exists($automation_id)) {
            return $this->json_response(['status' => 'error', 'message' => 'Only one monthly bill reminder can be active at a time. Deactivate the current rule first.'], 422);
        }

        if ($data['is_active']) {
            $data['next_run'] = date('Y-m-01 08:00:00', strtotime('first day of next month'));
        } else {
            $data['next_run'] = null;
        }

        if ($automation_id) {
            if ($this->db->where('id', $automation_id)->update('sms_automations', $data)) {
                $this->log_audit('sms_automation', 'update', $automation_id, $existing, $data);
                return $this->json_response(['status' => 'success', 'message' => get_phrase('automation_updated_successfully')]);
            }
        } else {
            $data['created_by'] = (int)$this->session->userdata('admin_id');
            $data['created_at'] = date('Y-m-d H:i:s');
            if ($this->db->insert('sms_automations', $data)) {
                $id = $this->db->insert_id();
                $this->log_audit('sms_automation', 'create', $id, null, $data);
                return $this->json_response(['status' => 'success', 'message' => get_phrase('automation_created_successfully')]);
            }
        }

        return $this->json_response(['status' => 'error', 'message' => get_phrase('operation_failed')], 500);
    }

    public function get_automations() {
        $this->db->select("sa.*, SUM(CASE WHEN sal.status = 'sent' THEN 1 ELSE 0 END) as total_sent, COUNT(sal.id) as total_attempts", false);
        $this->db->from('sms_automations sa');
        $this->db->join('sms_automation_logs sal', 'sa.id = sal.automation_id', 'left');
        $this->db->group_by('sa.id');
        $this->db->order_by('sa.created_at', 'DESC');
        $automations = $this->db->get()->result_array();

        foreach ($automations as &$automation) {
            $automation['is_supported'] = $this->is_supported_trigger($automation['trigger_event']) ? 1 : 0;
            $automation['execution_label'] = $automation['is_supported'] ? 'Scheduled monthly · 08:00 GMT' : 'Legacy rule · executor not connected';
        }
        unset($automation);

        return $this->json_response(['status' => 'success', 'data' => $automations]);
    }

    // Backward-compatible endpoint. New UI uses save().
    public function create() {
        return $this->save();
    }

    // Backward-compatible endpoint. New UI uses save().
    public function update($automation_id) {
        $_POST['automation_id'] = (int)$automation_id;
        return $this->save();
    }

    public function toggle_status($automation_id) {
        if (strtoupper($this->input->method()) !== 'POST') {
            return $this->json_response(['status' => 'error', 'message' => 'POST request required'], 405);
        }

        $automation = $this->get_automation((int)$automation_id);
        if (!$automation) {
            return $this->json_response(['status' => 'error', 'message' => 'Automation not found'], 404);
        }

        $new_status = $automation['is_active'] ? 0 : 1;
        if ($new_status === 1 && !$this->is_supported_trigger($automation['trigger_event'])) {
            return $this->json_response([
                'status' => 'error',
                'message' => 'This legacy trigger has no execution workflow yet, so it cannot be activated.'
            ], 422);
        }
        if ($new_status === 1 && $this->other_active_monthly_exists((int)$automation_id)) {
            return $this->json_response(['status' => 'error', 'message' => 'Only one monthly bill reminder can be active at a time. Deactivate the current rule first.'], 422);
        }

        $update = ['is_active' => $new_status];
        $update['next_run'] = $new_status === 1 ? date('Y-m-01 08:00:00', strtotime('first day of next month')) : null;
        if ($this->db->where('id', (int)$automation_id)->update('sms_automations', $update)) {
            $this->log_audit('sms_automation', 'toggle_status', (int)$automation_id, ['is_active' => $automation['is_active']], ['is_active' => $new_status]);
            return $this->json_response(['status' => 'success', 'message' => get_phrase('status_updated_successfully')]);
        }
        return $this->json_response(['status' => 'error', 'message' => get_phrase('operation_failed')], 500);
    }

    public function delete($automation_id) {
        if (strtoupper($this->input->method()) !== 'POST') {
            return $this->json_response(['status' => 'error', 'message' => 'POST request required'], 405);
        }
        $automation_id = (int)$automation_id;
        $old = $this->get_automation($automation_id);
        if (!$old) {
            return $this->json_response(['status' => 'error', 'message' => 'Automation not found'], 404);
        }
        if ($this->db->where('id', $automation_id)->delete('sms_automations')) {
            $this->log_audit('sms_automation', 'delete', $automation_id, $old, null);
            return $this->json_response(['status' => 'success', 'message' => get_phrase('automation_deleted_successfully')]);
        }
        return $this->json_response(['status' => 'error', 'message' => get_phrase('operation_failed')], 500);
    }

    public function get_logs($automation_id = null) {
        $this->db->select('sal.*, sa.name as automation_name');
        $this->db->from('sms_automation_logs sal');
        $this->db->join('sms_automations sa', 'sal.automation_id = sa.id');
        if ($automation_id) $this->db->where('sal.automation_id', (int)$automation_id);
        $this->db->order_by('sal.sent_at', 'DESC')->limit(100);
        return $this->json_response(['status' => 'success', 'data' => $this->db->get()->result_array()]);
    }

    public function get_statistics() {
        $total_automations = $this->db->count_all('sms_automations');
        $this->db->where('trigger_event', 'monthly_bill_reminder')->where('is_active', 1);
        $runnable_active = $this->db->count_all_results('sms_automations');
        $this->db->where('trigger_event !=', 'monthly_bill_reminder')->where('is_active', 1);
        $unsupported_active = $this->db->count_all_results('sms_automations');

        $this->db->select("COUNT(*) as total_attempts, SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful, SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed, SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending", false);
        $log_stats = $this->db->get('sms_automation_logs')->row_array();
        foreach (['total_attempts','successful','failed','pending'] as $key) $log_stats[$key] = (int)($log_stats[$key] ?? 0);

        $this->db->select('DATE(sent_at) as date, SUM(CASE WHEN status = "sent" THEN 1 ELSE 0 END) as count', false);
        $this->db->where('sent_at >=', date('Y-m-d', strtotime('-30 days')));
        $this->db->group_by('DATE(sent_at)')->order_by('date', 'ASC');
        $activity = $this->db->get('sms_automation_logs')->result_array();

        $stats = [
            'total_automations' => $total_automations,
            'active_automations' => $runnable_active,
            'unsupported_active' => $unsupported_active,
            'total_sent' => $log_stats['successful'],
            'failed' => $log_stats['failed'],
            'pending' => $log_stats['pending'],
            'success_rate' => $log_stats['total_attempts'] > 0 ? round(($log_stats['successful'] / $log_stats['total_attempts']) * 100, 2) : 0,
            'activity' => $activity
        ];
        return $this->json_response(['status' => 'success', 'data' => $stats]);
    }

    public function test_automation($automation_id) {
        if (strtoupper($this->input->method()) !== 'POST') {
            return $this->json_response(['status' => 'error', 'message' => 'POST request required'], 405);
        }
        $automation = $this->get_automation((int)$automation_id);
        if (!$automation) {
            return $this->json_response(['status' => 'error', 'message' => get_phrase('automation_not_found')], 404);
        }

        $test_phone = trim((string)$this->input->post('test_phone'));
        if ($test_phone === '' || !preg_match('/^[+0-9\-\s]{9,18}$/', $test_phone)) {
            return $this->json_response(['status' => 'error', 'message' => 'Enter a valid test phone number.'], 422);
        }
        $active_sms_service = (string)get_settings('active_sms_service');
        if ($active_sms_service === '' || $active_sms_service === 'disabled') {
            return $this->json_response(['status' => 'error', 'message' => 'SMS service is not activated.'], 422);
        }

        $test_message = $this->replace_placeholders($automation['message_template'], [
            'parent_name' => 'Test Parent',
            'student_name' => 'Test Student',
            'amount' => get_settings('currency') . ' 500.00',
            'currency' => get_settings('currency'),
            'school_name' => get_settings('system_name'),
            'date' => date('d M Y'),
            'breakdown' => 'Test Student: ' . get_settings('currency') . ' 500.00'
        ]);

        $result = $this->sms_model->send_sms($test_message, [$test_phone], ['Test User']);
        $result_text = trim(strip_tags((string)$result));
        $sent = $result !== null && stripos($result_text, 'failed') === false && stripos($result_text, 'invalid') === false;

        $this->db->insert('sms_automation_logs', [
            'automation_id' => (int)$automation_id,
            'recipient_phone' => $test_phone,
            'recipient_name' => 'Test User',
            'message' => $test_message,
            'status' => $sent ? 'sent' : 'failed',
            'error_message' => $sent ? null : ($result_text ?: 'SMS provider returned no success response'),
            'sent_at' => date('Y-m-d H:i:s')
        ]);

        return $this->json_response([
            'status' => $sent ? 'success' : 'error',
            'message' => $sent ? 'Test SMS sent successfully.' : 'Test SMS failed: ' . ($result_text ?: 'provider did not confirm delivery'),
            'preview' => $test_message
        ], $sent ? 200 : 502);
    }

    public function get_available_placeholders() {
        return $this->json_response(['status' => 'success', 'data' => [
            'parent_name' => 'Parent name',
            'student_name' => 'Student name(s)',
            'amount' => 'Total outstanding amount',
            'currency' => 'School currency symbol',
            'school_name' => 'School name',
            'date' => 'Current date',
            'breakdown' => 'Per-student outstanding balance breakdown'
        ]]);
    }

    public function get_trigger_events() {
        return $this->json_response(['status' => 'success', 'data' => $this->supported_triggers]);
    }

    private function get_automation($id) {
        return $this->db->where('id', (int)$id)->get('sms_automations')->row_array();
    }

    private function is_supported_trigger($trigger_event) {
        return isset($this->supported_triggers[$trigger_event]);
    }

    private function other_active_monthly_exists($exclude_id = 0) {
        $this->db->where('trigger_event', 'monthly_bill_reminder')->where('is_active', 1);
        if ($exclude_id) $this->db->where('id !=', (int)$exclude_id);
        return $this->db->count_all_results('sms_automations') > 0;
    }

    private function replace_placeholders($template, $data) {
        foreach ($data as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }
        return $template;
    }

    private function json_response($payload, $status_code = 200) {
        return $this->output
            ->set_status_header($status_code)
            ->set_content_type('application/json')
            ->set_output(json_encode($payload));
    }

    private function log_audit($module, $action, $record_id, $old_values, $new_values) {
        $this->db->insert('financial_audit_trail', [
            'module' => $module,
            'action' => $action,
            'record_id' => $record_id,
            'old_values' => json_encode($old_values),
            'new_values' => json_encode($new_values),
            'user_id' => (int)$this->session->userdata('admin_id'),
            'user_type' => 'admin',
            'ip_address' => $this->input->ip_address(),
            'user_agent' => $this->input->user_agent()
        ]);
    }
}
