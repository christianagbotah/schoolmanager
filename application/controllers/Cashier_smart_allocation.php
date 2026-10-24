<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Server-authoritative Quick payment endpoint for the cashier POS.
 *
 * Manual/advanced allocation remains on Cashier::process_daily_fee_payment().
 * This endpoint is only for the single-amount Quick payment flow, where the
 * server must rebuild the allocation from the latest wallet state.
 */
class Cashier_smart_allocation extends CI_Controller {

    private $authorized = false;

    public function __construct() {
        parent::__construct();

        $is_logged_in = $this->session->userdata('admin_id') != '';
        $is_conductor = $this->session->userdata('login_type') === 'conductor';

        if ($is_logged_in && !$is_conductor) {
            // Mirror the existing Cashier controller authorization boundary so
            // Quick and Advanced payment modes cannot disagree about access.
            $this->authorized = $this->Daily_fee_model->can_collect_daily_fees();
        }
    }

    /**
     * Process one Quick payment amount using the current server-side wallet.
     */
    public function process() {
        if (!$this->authorized) {
            return $this->respond([
                'status' => 'error',
                'message' => get_phrase('permission_denied')
            ], 401);
        }

        if ($this->input->method(TRUE) !== 'POST') {
            return $this->respond([
                'status' => 'error',
                'message' => 'Quick payment requires POST.'
            ], 405);
        }

        $student_id = (int) $this->input->post('student_id');
        $quick_amount_raw = $this->input->post('quick_amount', true);
        $excess_credit_type = (string) $this->input->post('excess_credit_type', true);

        if ($student_id <= 0 || !is_numeric($quick_amount_raw)) {
            return $this->respond([
                'status' => 'error',
                'message' => 'Select a student and enter a valid payment amount.'
            ], 422);
        }

        $quick_amount = round((float) $quick_amount_raw, 2);
        if ($quick_amount <= 0) {
            return $this->respond([
                'status' => 'error',
                'message' => 'Payment amount must be greater than zero.'
            ], 422);
        }

        $fee_types = ['feeding', 'breakfast', 'classes', 'water', 'transport'];
        $fee_priority = ['feeding', 'classes', 'breakfast', 'water', 'transport'];

        if (!in_array($excess_credit_type, $fee_types, true)) {
            return $this->respond([
                'status' => 'error',
                'message' => 'Choose a valid wallet for excess prepaid credit.'
            ], 422);
        }

        if (!$this->db->where('student_id', $student_id)->count_all_results('student')) {
            return $this->respond([
                'status' => 'error',
                'message' => 'Student record was not found.'
            ], 404);
        }

        // Reload immediately before allocation. Browser bucket amounts are not trusted.
        $outstanding = $this->Daily_fee_model->get_student_outstanding($student_id);
        $wallet = $outstanding['wallet'] ?? [];

        // Work in integer pesewas to keep the total exact.
        $remaining = (int) round($quick_amount * 100);
        $allocations_in_cents = array_fill_keys($fee_types, 0);

        foreach ($fee_priority as $type) {
            if ($remaining <= 0) {
                break;
            }

            $arrears = (int) round(max(0, (float) ($wallet[$type . '_arrears'] ?? 0)) * 100);
            $allocated = min($remaining, $arrears);
            $allocations_in_cents[$type] += $allocated;
            $remaining -= $allocated;
        }

        if ($remaining > 0) {
            $allocations_in_cents[$excess_credit_type] += $remaining;
            $remaining = 0;
        }

        $allocations = [];
        foreach ($fee_types as $type) {
            $allocations[$type] = $allocations_in_cents[$type] / 100;
        }

        $payment_method = (int) $this->input->post('payment_method');
        if ($payment_method <= 0) {
            $payment_method = 1;
        }

        $receipt_number = 'DFR' . date('Ymd')
            . str_pad((string) $student_id, 5, '0', STR_PAD_LEFT)
            . substr((string) round(microtime(true) * 1000), -6);

        $payment_data = [
            'student_id' => $student_id,
            'feeding_amount' => $allocations['feeding'],
            'breakfast_amount' => $allocations['breakfast'],
            'classes_amount' => $allocations['classes'],
            'water_amount' => $allocations['water'],
            'transport_amount' => $allocations['transport'],
            'payment_method' => $payment_method,
            'payment_type' => 'mixed',
            'collected_by' => (int) $this->session->userdata('admin_id'),
            'collection_point' => 'office',
            'receipt_number' => $receipt_number,
            'notes' => $this->input->post('notes', true)
        ];

        $breakfast_opted = $this->input->post('breakfast_opted');
        if ($breakfast_opted !== null) {
            $payment_data['breakfast_opted'] = ((int) $breakfast_opted === 1) ? 1 : 0;
        }

        $water_opted = $this->input->post('water_opted');
        if ($water_opted !== null) {
            $payment_data['water_opted'] = ((int) $water_opted === 1) ? 1 : 0;
        }

        $result = $this->Daily_fee_model->process_payment($payment_data);
        if (($result['status'] ?? 'error') !== 'success') {
            return $this->respond([
                'status' => 'error',
                'message' => $result['message'] ?? get_phrase('payment_processing_failed')
            ], 422);
        }

        $result['message'] = get_phrase('payment_processed_successfully');
        $result['allocations'] = $allocations;
        $result['applied_total'] = array_sum($allocations);
        $result['allocation_source'] = 'server';

        return $this->respond($result, 200);
    }

    private function respond(array $payload, $status_code = 200) {
        $this->output
            ->set_status_header($status_code)
            ->set_content_type('application/json', 'utf-8')
            ->set_output(json_encode($payload));

        return null;
    }
}
