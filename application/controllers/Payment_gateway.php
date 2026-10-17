<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Payment_gateway extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->library('session');
        $this->load->model('Payment_gateway_model');
        $this->load->model('Hubtel_payment_model', 'hubtel_payments');
    }

    // ==================== STUDENT / PARENT PORTAL ====================
    public function pay_invoice($invoice_code = '') {
        if (!$this->is_payment_actor_authenticated()) {
            redirect(site_url('login'), 'refresh');
            return;
        }

        $requested_student_id = $this->input->get('student_id', true);
        $student_id = $this->resolve_payment_student_id($requested_student_id);
        if ($student_id <= 0) {
            show_404();
            return;
        }

        $invoice = $this->Payment_gateway_model->get_invoice_details($invoice_code, $student_id);
        if (!$invoice) {
            show_404();
            return;
        }

        $student = $this->db->where('student_id', $student_id)->get('student')->row_array();
        $payer = $this->get_payment_payer($student_id);
        if (!$student || !$payer) {
            show_404();
            return;
        }

        $page_data['invoice'] = $invoice;
        $page_data['student'] = $student;
        $page_data['payer'] = $payer;
        $page_data['payment_student_id'] = $student_id;
        $page_data['gateways'] = $this->Payment_gateway_model->get_active_gateways();
        $page_data['return_url'] = $this->session->userdata('parent_login') == 1
            ? site_url('parents/invoice/' . $student_id)
            : site_url('student/invoice');
        $page_data['page_name'] = 'pay_invoice';
        $page_data['page_title'] = get_phrase('pay_invoice');
        $this->load->view('backend/index', $page_data);
    }

    // ==================== RETIRED LEGACY GATEWAYS ====================
    public function initiate_momo_payment() {
        return $this->legacy_gateway_disabled(true);
    }

    public function momo_callback() {
        return $this->legacy_gateway_disabled(false);
    }

    public function initiate_paystack() {
        return $this->legacy_gateway_disabled(true);
    }

    public function paystack_callback() {
        return $this->legacy_gateway_disabled(false);
    }

    // ==================== HUBTEL ====================
    public function initiate_hubtel() {
        if (!$this->is_payment_actor_authenticated()) {
            return $this->respond_json([
                'success' => false,
                'status' => 'error',
                'message' => 'Authentication required.'
            ], 401);
        }

        $student_id = $this->resolve_payment_student_id($this->input->post('student_id', true));
        if ($student_id <= 0) {
            return $this->respond_json([
                'success' => false,
                'status' => 'error',
                'code' => 'student_not_authorised',
                'message' => 'You are not authorised to pay this student invoice.'
            ], 403);
        }

        $payer = $this->get_payment_payer($student_id);
        if (!$payer) {
            return $this->respond_json([
                'success' => false,
                'status' => 'error',
                'code' => 'payer_not_found',
                'message' => 'The authenticated payer profile could not be loaded.'
            ], 422);
        }

        $network = trim((string) $this->input->post('network', true));
        $allowed_networks = ['mtn-gh', 'vodafone-gh', 'airtel-gh', 'tigo-gh'];
        if (!in_array($network, $allowed_networks, true)) {
            return $this->respond_json([
                'success' => false,
                'status' => 'error',
                'code' => 'invalid_network',
                'message' => 'Select a supported mobile money network.'
            ], 422);
        }

        $result = $this->hubtel_payments->initiate_invoice_payment(
            $student_id,
            $this->input->post('invoice_code', true),
            $this->input->post('amount', true),
            [
                'phone_number' => $this->input->post('phone_number', true),
                'network' => $network,
                'customer_name' => $payer['name'] ?? '',
                'email' => $payer['email'] ?? ''
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
     * Provider callback processing is the only path that may settle money.
     */
    public function verify_hubtel($transaction_id) {
        if (!$this->is_payment_status_actor_authenticated()) {
            return $this->respond_json([
                'status' => 'error',
                'message' => 'Authentication required.'
            ], 401);
        }

        $transaction = $this->get_authorised_hubtel_transaction($transaction_id);
        return $this->respond_json([
            'status' => $transaction ? $transaction['status'] : 'not_found',
            'transaction_ref' => $transaction['transaction_ref'] ?? null
        ], $transaction ? 200 : 404);
    }

    public function check_status($transaction_ref) {
        if (!$this->is_payment_status_actor_authenticated()) {
            return $this->respond_json([
                'status' => 'error',
                'message' => 'Authentication required.'
            ], 401);
        }

        // get_authorised_hubtel_transaction() applies gateway=hubtel and actor ownership.
        $transaction = $this->get_authorised_hubtel_transaction($transaction_ref);
        return $this->respond_json([
            'status' => $transaction ? $transaction['status'] : 'not_found',
            'transaction_ref' => $transaction['transaction_ref'] ?? null
        ], $transaction ? 200 : 404);
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

    private function is_payment_actor_authenticated() {
        return $this->session->userdata('student_login') == 1
            || $this->session->userdata('parent_login') == 1;
    }

    private function is_payment_status_actor_authenticated() {
        return $this->is_payment_actor_authenticated()
            || $this->session->userdata('admin_login') == 1;
    }

    private function resolve_payment_student_id($requested_student_id = null) {
        if ($this->session->userdata('student_login') == 1) {
            return (int) $this->session->userdata('student_id');
        }

        if ($this->session->userdata('parent_login') == 1) {
            $student_id = (int) $requested_student_id;
            $parent_id = (int) $this->session->userdata('parent_id');
            if ($student_id <= 0 || $parent_id <= 0) {
                return 0;
            }

            $child = $this->db
                ->select('student_id')
                ->where('student_id', $student_id)
                ->where('parent_id', $parent_id)
                ->get('student')
                ->row_array();

            return $child ? (int) $child['student_id'] : 0;
        }

        return 0;
    }

    private function is_parent_of_student($student_id) {
        if ($this->session->userdata('parent_login') != 1) {
            return false;
        }

        $parent_id = (int) $this->session->userdata('parent_id');
        if ($parent_id <= 0 || (int) $student_id <= 0) {
            return false;
        }

        return $this->db
            ->where('student_id', (int) $student_id)
            ->where('parent_id', $parent_id)
            ->count_all_results('student') > 0;
    }

    private function get_payment_payer($student_id) {
        if ($this->session->userdata('parent_login') == 1) {
            return $this->db
                ->where('parent_id', (int) $this->session->userdata('parent_id'))
                ->get('parent')
                ->row_array();
        }

        if ($this->session->userdata('student_login') == 1) {
            return $this->db
                ->where('student_id', (int) $student_id)
                ->get('student')
                ->row_array();
        }

        return [];
    }

    private function get_authorised_hubtel_transaction($reference) {
        $this->db
            ->group_start()
                ->where('transaction_ref', $reference)
                ->or_where('gateway_ref', $reference)
            ->group_end()
            ->where('gateway', 'hubtel');

        $transaction = $this->db->get('payment_transactions')->row_array();
        if (!$transaction) {
            return null;
        }

        if ($this->session->userdata('admin_login') == 1) {
            return $transaction;
        }

        if ($this->session->userdata('student_login') == 1) {
            return (int) $transaction['student_id'] === (int) $this->session->userdata('student_id')
                ? $transaction
                : null;
        }

        if ($this->session->userdata('parent_login') == 1 && $this->is_parent_of_student($transaction['student_id'])) {
            return $transaction;
        }

        return null;
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
