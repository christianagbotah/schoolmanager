<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Payment_gateway extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('session');
        $this->load->model('Payment_gateway_model');
        $this->load->model('Hubtel_payment_model', 'hubtel_payments');
    }

    // ==================== STUDENT PORTAL ====================
    public function pay_invoice($invoice_code = '') {
        if ($this->session->userdata('student_login') != 1) {
            redirect(site_url('login'), 'refresh');
            return;
        }

        $student_id = (int) $this->session->userdata('student_id');
        $page_data['invoice'] = $this->Payment_gateway_model->get_invoice_details($invoice_code, $student_id);
        if (!$page_data['invoice']) {
            show_404();
            return;
        }

        $page_data['gateways'] = $this->Payment_gateway_model->get_active_gateways();
        $page_data['page_name'] = 'pay_invoice';
        $page_data['page_title'] = get_phrase('pay_invoice');
        $this->load->view('backend/index', $page_data);
    }

    // ==================== MOBILE MONEY ====================
    public function initiate_momo_payment() {
        return $this->legacy_gateway_disabled(true);
    }

    public function momo_callback() {
        return $this->legacy_gateway_disabled(false);
    }

    // ==================== PAYSTACK ====================
    public function initiate_paystack() {
        return $this->legacy_gateway_disabled(true);
    }

    public function paystack_callback() {
        return $this->legacy_gateway_disabled(false);
    }

    // ==================== HUBTEL ====================
    public function initiate_hubtel() {
        if ($this->session->userdata('student_login') != 1) {
            return $this->respond_json([
                'success' => false,
                'status' => 'error',
                'message' => 'Authentication required.'
            ], 401);
        }

        $result = $this->hubtel_payments->initiate_invoice_payment(
            (int) $this->session->userdata('student_id'),
            $this->input->post('invoice_code'),
            $this->input->post('amount'),
            [
                'phone_number' => $this->input->post('phone_number'),
                'network' => $this->input->post('network'),
                'customer_name' => $this->input->post('customer_name'),
                'email' => $this->input->post('email')
            ]
        );

        return $this->respond_json($result, !empty($result['success']) ? 200 : 422);
    }

    public function hubtel_callback() {
        $result = $this->hubtel_payments->handle_callback(
            file_get_contents('php://input'),
            (string) $this->input->get('token', true)
        );
        return $this->respond_json([
            'status' => !empty($result['success']) ? 'success' : 'error',
            'code' => $result['code'] ?? '',
            'message' => $result['message'] ?? ''
        ], (int) ($result['http_code'] ?? 200));
    }

    /**
     * Read-only Hubtel status endpoint.
     *
     * Provider verification/callback processing is the only path that may settle
     * money. A browser request must never credit an invoice as a side effect.
     */
    public function verify_hubtel($transaction_id) {
        $is_student = $this->session->userdata('student_login') == 1;
        $is_admin = $this->session->userdata('admin_login') == 1;
        if (!$is_student && !$is_admin) {
            return $this->respond_json([
                'status' => 'error',
                'message' => 'Authentication required.'
            ], 401);
        }

        $result = $this->hubtel_payments->get_authorised_status(
            $transaction_id,
            $is_student ? (int) $this->session->userdata('student_id') : null,
            $is_admin
        );

        return $this->respond_json([
            'status' => $result['status'] ?? 'not_found',
            'transaction_ref' => $result['transaction_ref'] ?? null
        ], !empty($result['success']) ? 200 : 404);
    }

    public function check_status($transaction_ref) {
        $is_student = $this->session->userdata('student_login') == 1;
        $is_admin = $this->session->userdata('admin_login') == 1;
        if (!$is_student && !$is_admin) {
            return $this->respond_json(['status' => 'error', 'message' => 'Authentication required.'], 401);
        }

        $this->db->where('transaction_ref', $transaction_ref);
        if ($is_student) {
            $this->db->where('student_id', (int) $this->session->userdata('student_id'));
        }
        $transaction = $this->db->get('payment_transactions')->row_array();
        return $this->respond_json(['status' => $transaction ? $transaction['status'] : 'not_found']);
    }

    // ==================== ADMIN - TRANSACTIONS ====================
    public function transactions($action = '', $id = '') {
        if ($this->session->userdata('admin_login') != 1) {
            redirect(site_url('login'), 'refresh');
        }

        if ($action == 'list' || $action == '') {
            $page_data['page_name'] = 'payment_gateway/transactions';
            $page_data['page_title'] = get_phrase('payment_transactions');
            $this->load->view('backend/index', $page_data);
        } elseif ($action == 'get_data') {
            $this->Payment_gateway_model->get_transactions_datatable();
        } elseif ($action == 'verify') {
            $this->Payment_gateway_model->manual_verify_transaction($id);
        }
    }

    // ==================== WEBHOOK HANDLERS ====================
    public function webhook_mtn() {
        return $this->legacy_gateway_disabled(false);
    }

    public function webhook_vodafone() {
        return $this->legacy_gateway_disabled(false);
    }

    public function webhook_paystack() {
        return $this->legacy_gateway_disabled(false);
    }

    public function webhook_hubtel() {
        return $this->hubtel_callback();
    }

    private function legacy_gateway_disabled($require_student = false) {
        if ($require_student && $this->session->userdata('student_login') != 1) {
            return $this->respond_json([
                'status' => 'error',
                'code' => 'authentication_required',
                'message' => 'Authentication required.'
            ], 401);
        }

        return $this->respond_json([
            'status' => 'error',
            'code' => 'legacy_gateway_disabled',
            'message' => 'This legacy payment gateway is disabled. Use the configured Hubtel payment option.'
        ], 410);
    }

    private function respond_json(array $payload, $status_code = 200) {
        return $this->output
            ->set_status_header((int) $status_code)
            ->set_content_type('application/json')
            ->set_output(json_encode($payload));
    }
}
