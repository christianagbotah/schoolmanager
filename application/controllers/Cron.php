<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Cron extends CI_Controller {

    function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->model('Sms_model', 'sms_model');

        if (php_sapi_name() !== 'cli' && !defined('STDIN')) {
            $this->output->set_status_header(403)->set_content_type('application/json')->set_output(json_encode([
                'status' => 'error',
                'message' => 'Cron execution is CLI-only.'
            ]));
            $this->output->_display();
            exit;
        }
    }

    public function monthly_bill_reminders($force = '') {
        $automation = $this->db->where('trigger_event', 'monthly_bill_reminder')
            ->where('is_active', 1)
            ->order_by('id', 'ASC')
            ->get('sms_automations')->row_array();

        if (!$automation) return $this->respond(['status' => 'skipped', 'message' => 'No active monthly bill reminder automation found']);

        if ($force !== 'force' && !empty($automation['last_run']) && date('Y-m', strtotime($automation['last_run'])) === date('Y-m')) {
            return $this->respond(['status' => 'skipped', 'message' => 'Monthly bill reminder already ran this month']);
        }

        $active_sms_service = (string)get_settings('active_sms_service');
        if ($active_sms_service === '' || $active_sms_service === 'disabled') {
            return $this->respond(['status' => 'error', 'message' => 'SMS service is disabled or not configured'], 1);
        }

        $running_year = get_settings('running_year');
        $running_term = get_settings('running_term');
        $currency = get_settings('currency');
        $school_name = get_settings('system_name');

        $parents_data = [];
        $students = $this->db->select('s.student_id, s.name, s.parent_id, p.phone, p.name as parent_name')
            ->from('student s')
            ->join('parent p', 's.parent_id = p.parent_id')
            ->join('enroll e', 's.student_id = e.student_id')
            ->where('e.year', $running_year)
            ->where('e.term', $running_term)
            ->where('e.mute', '0')
            ->where('p.phone !=', '')
            ->get()->result_array();

        foreach ($students as $student) {
            $balance = $this->db->select('SUM(due) as total_due')->where('student_id', $student['student_id'])->where('due >', 0)->get('invoice')->row();
            $owing = $balance ? (float)$balance->total_due : 0;
            if ($owing <= 0) continue;
            $parent_id = $student['parent_id'];
            if (!isset($parents_data[$parent_id])) {
                $parents_data[$parent_id] = ['phone'=>$student['phone'], 'parent_name'=>$student['parent_name'], 'students'=>[]];
            }
            $parents_data[$parent_id]['students'][] = ['name'=>$student['name'], 'owing'=>$owing];
        }

        if (!$parents_data) return $this->respond(['status' => 'skipped', 'message' => 'No outstanding balances found']);

        $personalized = [];
        $log_ids = [];
        foreach ($parents_data as $data) {
            $breakdown = [];
            $student_names = [];
            $total_owing = 0;
            foreach ($data['students'] as $student) {
                $student_names[] = $student['name'];
                $breakdown[] = $student['name'] . ': ' . $currency . ' ' . number_format($student['owing'], 2);
                $total_owing += $student['owing'];
            }
            $message = $this->replace_placeholders($automation['message_template'], [
                'parent_name' => $data['parent_name'],
                'student_name' => implode(', ', $student_names),
                'amount' => $currency . ' ' . number_format($total_owing, 2),
                'currency' => $currency,
                'school_name' => $school_name,
                'date' => date('d M Y'),
                'breakdown' => implode(', ', $breakdown)
            ]);

            $personalized[] = ['Recipient'=>$data['phone'], 'Content'=>$message];
            $this->db->insert('sms_automation_logs', [
                'automation_id' => $automation['id'],
                'recipient_phone' => $data['phone'],
                'recipient_name' => $data['parent_name'],
                'message' => $message,
                'status' => 'pending',
                'sent_at' => date('Y-m-d H:i:s')
            ]);
            $log_ids[] = $this->db->insert_id();
        }

        $result = $this->sms_model->send_sms_batch_personalized($personalized);
        $sent = ($result === 0);
        if ($log_ids) {
            $this->db->where_in('id', $log_ids)->update('sms_automation_logs', [
                'status' => $sent ? 'sent' : 'failed',
                'error_message' => $sent ? null : $this->provider_error($result)
            ]);
        }

        $next_run = date('Y-m-01 08:00:00', strtotime('first day of next month'));
        $this->db->where('id', $automation['id'])->update('sms_automations', [
            'last_run' => date('Y-m-d H:i:s'),
            'next_run' => $next_run
        ]);

        return $this->respond([
            'status' => $sent ? 'success' : 'error',
            'message' => $sent ? 'Bill reminders sent to '.count($personalized).' parent(s)' : 'SMS provider rejected the batch: '.$this->provider_error($result),
            'count' => count($personalized)
        ], $sent ? 0 : 1);
    }

    private function replace_placeholders($template, $data) {
        foreach ($data as $key => $value) $template = str_replace('{'.$key.'}', $value, $template);
        return $template;
    }

    private function provider_error($result) {
        if ($result === null) return 'SMS service disabled or not configured';
        if ((int)$result === 100) return 'No valid recipient phone numbers';
        return 'Hubtel status '.(string)$result;
    }

    private function respond($payload, $exit_code = 0) {
        echo json_encode($payload) . PHP_EOL;
        exit($exit_code);
    }
}
