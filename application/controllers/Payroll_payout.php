<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Payroll payout API boundary.
 *
 * Admins initiate approved salary payouts. Hubtel callbacks are provider-facing
 * and are validated entirely by Hubtel_payroll_payout_model before money state
 * changes are allowed.
 */
class Payroll_payout extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->library('session');
        $this->load->model('Hubtel_payroll_payout_model', 'hubtel_payouts');
    }

    public function initiate($pay_id = 0)
    {
        if ($this->input->method(true) !== 'POST') {
            return $this->respond_json(['success' => false, 'message' => 'POST required.'], 405);
        }
        if ($this->session->userdata('admin_login') != 1) {
            return $this->respond_json(['success' => false, 'message' => 'Authentication required.'], 401);
        }

        if (!$this->can_current_admin_initiate_payout()) {
            return $this->respond_json(['success' => false, 'message' => 'Finance or super administrator permission required.'], 403);
        }

        $actor_id = (int) $this->session->userdata('admin_id');
        $user_level = (int) $this->session->userdata('user_type');
        $actor_role = $user_level === 1 ? 'super_admin' : 'admin';

        $result = $this->hubtel_payouts->initiate_payout((int) $pay_id, $actor_id, $actor_role);
        return $this->respond_json($result, !empty($result['success']) ? 200 : 422);
    }

    public function status($pay_id = 0)
    {
        if ($this->session->userdata('admin_login') != 1) {
            return $this->respond_json(['success' => false, 'message' => 'Authentication required.'], 401);
        }
        if (!$this->can_current_admin_initiate_payout()) {
            return $this->respond_json(['success' => false, 'message' => 'Finance or super administrator permission required.'], 403);
        }

        $row = $this->db->where('pay_id', (int) $pay_id)
            ->get('payroll_payout_transactions')
            ->row_array();
        if (!$row) {
            return $this->respond_json(['success' => false, 'status' => 'not_found'], 404);
        }

        return $this->respond_json([
            'success' => true,
            'status' => $row['status'],
            'client_reference' => $row['client_reference'],
            'provider_transaction_id' => $row['provider_transaction_id'] ?: null,
            'failure_reason' => $row['failure_reason'] ?: null
        ]);
    }

    public function hubtel_callback()
    {
        $result = $this->hubtel_payouts->handle_callback(file_get_contents('php://input'));
        return $this->respond_json([
            'status' => !empty($result['success']) ? 'success' : 'error',
            'code' => $result['code'] ?? '',
            'message' => $result['message'] ?? ''
        ], (int) ($result['http_code'] ?? 200));
    }


    private function can_current_admin_initiate_payout()
    {
        $user_level = (int) $this->session->userdata('user_type');
        $role = strtolower(trim((string) $this->session->userdata('role')));

        return in_array($user_level, [1, 3], true) || strpos($role, 'finance') !== false;
    }

    private function respond_json(array $payload, $status_code = 200)
    {
        return $this->output
            ->set_status_header((int) $status_code)
            ->set_content_type('application/json')
            ->set_output(json_encode($payload));
    }
}
