<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Hardened Hubtel collection adapter.
 *
 * Inbound school-fee collection is deliberately isolated from payroll payouts.
 * Hubtel callbacks may confirm a server-created intent; they never choose the
 * student, invoice or amount that iEduPro credits.
 */
class Hubtel_payment_model extends CI_Model
{
    private $client_id;
    private $client_secret;
    private $merchant_number;

    public function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->model('Finance_model');

        $this->client_id = (string) get_settings('hubtel_payment_client_id');
        $this->client_secret = (string) get_settings('hubtel_payment_client_secret');
        $this->merchant_number = (string) get_settings('hubtel_payment_merchant_number');
    }

    public function initiate_invoice_payment($student_id, $invoice_code, $requested_amount, array $customer = [])
    {
        $student_id = (int) $student_id;
        $invoice_code = trim((string) $invoice_code);
        $amount = round((float) $requested_amount, 2);

        if ($student_id <= 0 || $invoice_code === '') {
            return $this->failure('invalid_invoice', 'Invalid student or invoice.');
        }

        $invoice_query = $this->db->where('invoice_code', $invoice_code)
            ->where('student_id', $student_id);
        if ($this->db->field_exists('can_delete', 'invoice')) {
            $invoice_query->where('can_delete !=', 'trash');
        }
        $invoice = $invoice_query->get('invoice')->row_array();

        if (!$invoice) {
            return $this->failure('invoice_not_found', 'Invoice was not found for this student.');
        }

        $due = round((float) ($invoice['due'] ?? 0), 2);
        if ($due <= 0) {
            return $this->failure('invoice_paid', 'This invoice has no outstanding balance.');
        }
        if ($amount <= 0 || $amount > $due) {
            return $this->failure('invalid_amount', 'Payment amount must be greater than zero and cannot exceed the invoice balance.');
        }

        if ($this->client_id === '' || $this->client_secret === '' || $this->merchant_number === '') {
            return $this->failure('gateway_not_configured', 'Hubtel payment credentials are not configured.');
        }

        $transaction_ref = $this->generate_transaction_ref();
        $phone = $this->normalise_phone($customer['phone_number'] ?? '');
        if ($phone === '') {
            return $this->failure('invalid_phone', 'A valid mobile number is required.');
        }

        $transaction = [
            'transaction_ref' => $transaction_ref,
            'student_id' => $student_id,
            'invoice_code' => $invoice_code,
            'amount' => $amount,
            'gateway' => 'hubtel',
            'phone_number' => $phone,
            'status' => 'pending'
        ];
        $this->db->insert('payment_transactions', $transaction);
        if (!$this->db->affected_rows()) {
            return $this->failure('intent_not_saved', 'Could not create the payment intent.');
        }

        $url = trim((string) get_settings('hubtel_payment_receive_url'));
        if ($url === '') {
            // Existing Direct Receive Money endpoint retained as a compatibility
            // fallback. Schools can configure the live endpoint issued in their
            // Hubtel developer portal without changing application code.
            $url = 'https://api.hubtel.com/v1/merchantaccount/merchants/' . rawurlencode($this->merchant_number) . '/receive/mobilemoney';
        }

        $callback_token = $this->callback_token_for_reference($transaction_ref);
        $fields = [
            'CustomerName' => trim((string) ($customer['customer_name'] ?? 'School fee payer')),
            'CustomerMsisdn' => $phone,
            'CustomerEmail' => trim((string) ($customer['email'] ?? '')),
            'Channel' => trim((string) ($customer['network'] ?? '')),
            'Amount' => $amount,
            'PrimaryCallbackUrl' => site_url('payment_gateway/hubtel_callback') . '?token=' . rawurlencode($callback_token),
            'Description' => 'School fees payment - ' . $invoice_code,
            'ClientReference' => $transaction_ref
        ];

        $result = $this->post_json($url, $fields);
        $body = is_array($result['body']) ? $result['body'] : [];
        $response_code = (string) ($body['ResponseCode'] ?? $body['responseCode'] ?? $body['code'] ?? '');
        $data = $body['Data'] ?? $body['data'] ?? [];
        $returned_ref = (string) ($data['ClientReference'] ?? $data['clientReference'] ?? $transaction_ref);

        $accepted = $result['http_code'] >= 200 && $result['http_code'] < 300
            && $result['curl_error'] === ''
            && ($returned_ref === '' || hash_equals($transaction_ref, $returned_ref));

        // Direct Receive Money historically returns 0001 for an accepted/pending
        // request; newer Hubtel request-money APIs use HTTP 201 with a data object.
        if ($response_code !== '' && !in_array($response_code, ['0000', '0001', '00', '0', '200', '201'], true)) {
            $accepted = false;
        }

        $gateway_ref = (string) (
            $data['TransactionId'] ?? $data['transactionId'] ??
            $data['PaylinkId'] ?? $data['paylinkId'] ?? ''
        );

        $this->db->where('transaction_ref', $transaction_ref)->update('payment_transactions', [
            'status' => $accepted ? 'pending' : 'failed',
            'gateway_ref' => $gateway_ref,
            'response_data' => json_encode($body ?: ['transport_error' => $result['curl_error']])
        ]);

        if (!$accepted) {
            return $this->failure('hubtel_initiation_failed', (string) ($body['Message'] ?? $body['message'] ?? $body['ResponseText'] ?? 'Hubtel could not start the payment.'));
        }

        return [
            'success' => true,
            'status' => 'pending',
            'transaction_ref' => $transaction_ref,
            'transaction_id' => $gateway_ref,
            'paylink_url' => (string) ($data['PaylinkUrl'] ?? $data['paylinkUrl'] ?? '')
        ];
    }

    public function handle_callback($raw_body, $callback_token = '')
    {
        $payload = json_decode((string) $raw_body, true);
        if (!is_array($payload)) {
            return ['success' => false, 'http_code' => 400, 'code' => 'invalid_json', 'message' => 'Invalid callback payload.'];
        }

        $data = $payload['Data'] ?? $payload['data'] ?? $payload;
        $client_reference = trim((string) ($data['ClientReference'] ?? $data['clientReference'] ?? ''));
        $response_code = trim((string) ($payload['ResponseCode'] ?? $payload['responseCode'] ?? ''));
        $provider_status = strtolower(trim((string) ($data['Status'] ?? $data['status'] ?? '')));
        $gateway_ref = trim((string) ($data['TransactionId'] ?? $data['transactionId'] ?? $data['PaylinkId'] ?? $data['paylinkId'] ?? ''));
        $callback_amount = isset($data['Amount']) ? round((float) $data['Amount'], 2)
            : (isset($data['amount']) ? round((float) $data['amount'], 2) : null);

        if ($client_reference === '') {
            return ['success' => false, 'http_code' => 400, 'code' => 'missing_reference', 'message' => 'Missing client reference.'];
        }

        $expected_callback_token = $this->callback_token_for_reference($client_reference);
        $callback_token = trim((string) $callback_token);
        if ($expected_callback_token === '' || $callback_token === '' || !hash_equals($expected_callback_token, $callback_token)) {
            return ['success' => false, 'http_code' => 403, 'code' => 'invalid_callback_token', 'message' => 'Callback authentication failed.'];
        }

        $transaction = $this->db->where('transaction_ref', $client_reference)
            ->where('gateway', 'hubtel')
            ->get('payment_transactions')->row_array();
        if (!$transaction) {
            return ['success' => false, 'http_code' => 404, 'code' => 'intent_not_found', 'message' => 'Payment intent not found.'];
        }

        $expected_amount = round((float) $transaction['amount'], 2);
        if ($callback_amount === null || abs($callback_amount - $expected_amount) >= 0.005) {
            $this->record_callback_for_review($transaction, $payload, 'amount_mismatch');
            return ['success' => false, 'http_code' => 409, 'code' => 'amount_mismatch', 'message' => 'Callback amount mismatch.'];
        }

        $success_codes = ['0000', '00', '0'];
        $success_statuses = ['success', 'successful', 'completed', 'complete', 'paid'];
        $code_ok = in_array($response_code, $success_codes, true);
        $status_ok = $provider_status === '' || in_array($provider_status, $success_statuses, true);
        if (!$code_ok || !$status_ok) {
            $this->record_callback_for_review($transaction, $payload, 'provider_not_successful');
            return ['success' => true, 'http_code' => 200, 'code' => 'not_successful', 'message' => 'Callback recorded; payment not settled.'];
        }

        return $this->settle_transaction($transaction['transaction_id'], $client_reference, $callback_amount, $gateway_ref, $payload);
    }

    public function get_authorised_status($gateway_or_client_ref, $student_id = null, $allow_admin = false)
    {
        $this->db->group_start()
            ->where('transaction_ref', $gateway_or_client_ref)
            ->or_where('gateway_ref', $gateway_or_client_ref)
            ->group_end()
            ->where('gateway', 'hubtel');
        if (!$allow_admin) {
            $this->db->where('student_id', (int) $student_id);
        }
        $transaction = $this->db->get('payment_transactions')->row_array();

        if (!$transaction) {
            return ['success' => false, 'status' => 'not_found'];
        }
        return [
            'success' => true,
            'status' => (string) $transaction['status'],
            'transaction_ref' => (string) $transaction['transaction_ref']
        ];
    }

    private function settle_transaction($transaction_id, $transaction_ref, $callback_amount, $gateway_ref, array $payload)
    {
        $this->db->trans_begin();
        try {
            $locked = $this->db->query(
                'SELECT * FROM payment_transactions WHERE transaction_id = ? FOR UPDATE',
                [(int) $transaction_id]
            )->row_array();

            if (!$locked || $locked['gateway'] !== 'hubtel' || !hash_equals((string) $locked['transaction_ref'], (string) $transaction_ref)) {
                $this->db->trans_rollback();
                return ['success' => false, 'http_code' => 409, 'code' => 'intent_conflict', 'message' => 'Payment intent conflict.'];
            }

            if (strtolower((string) $locked['status']) === 'success') {
                $this->db->trans_commit();
                return ['success' => true, 'http_code' => 200, 'code' => 'already_settled', 'message' => 'Payment already settled.'];
            }

            $expected_amount = round((float) $locked['amount'], 2);
            if (abs($callback_amount - $expected_amount) >= 0.005) {
                $this->db->trans_rollback();
                return ['success' => false, 'http_code' => 409, 'code' => 'amount_mismatch', 'message' => 'Callback amount mismatch.'];
            }

            $invoice = $this->db->query(
                'SELECT * FROM invoice WHERE invoice_code = ? AND student_id = ? FOR UPDATE',
                [(string) $locked['invoice_code'], (int) $locked['student_id']]
            )->row_array();
            if (!$invoice) {
                $this->db->trans_rollback();
                return ['success' => false, 'http_code' => 409, 'code' => 'invoice_not_found', 'message' => 'Invoice no longer exists.'];
            }

            $due = round((float) ($invoice['due'] ?? 0), 2);
            if ($expected_amount <= 0 || $expected_amount - $due >= 0.005) {
                $this->db->trans_rollback();
                return ['success' => false, 'http_code' => 409, 'code' => 'invoice_balance_conflict', 'message' => 'Invoice balance changed; payment requires review.'];
            }

            $duplicate = $this->db->where('transaction_id', $transaction_ref)->get('payment')->row_array();
            if ($duplicate) {
                $this->db->where('transaction_id', (int) $locked['transaction_id'])->update('payment_transactions', [
                    'status' => 'success',
                    'gateway_ref' => $gateway_ref !== '' ? $gateway_ref : ($locked['gateway_ref'] ?? ''),
                    'response_data' => json_encode($payload)
                ]);
                $this->db->trans_commit();
                return ['success' => true, 'http_code' => 200, 'code' => 'already_settled', 'message' => 'Payment already settled.'];
            }

            $payment_data = $this->only_existing_fields('payment', [
                'student_id' => (int) $locked['student_id'],
                'invoice_id' => (int) ($invoice['invoice_id'] ?? 0),
                'invoice_code' => (string) $locked['invoice_code'],
                'amount' => $expected_amount,
                'payment_method' => 'hubtel',
                'payment_type' => 'income',
                'transaction_id' => $transaction_ref,
                'timestamp' => time(),
                'day_timestamp' => strtotime(date('Y-m-d')),
                'year' => $invoice['year'] ?? get_settings('running_year'),
                'term' => $invoice['term'] ?? get_settings('running_term'),
                'can_delete' => 'no'
            ]);
            $this->db->insert('payment', $payment_data);
            $payment_id = (int) $this->db->insert_id();
            if ($payment_id <= 0) {
                throw new RuntimeException('Payment record could not be created.');
            }

            $new_paid = round((float) ($invoice['amount_paid'] ?? 0) + $expected_amount, 2);
            $new_due = max(0, round($due - $expected_amount, 2));
            $invoice_update = [
                'amount_paid' => $new_paid,
                'due' => $new_due,
                'status' => $new_due <= 0 ? 'paid' : 'due'
            ];
            if ($this->db->field_exists('payment_timestamp', 'invoice')) {
                $invoice_update['payment_timestamp'] = time();
            }
            $this->db->where('invoice_id', $invoice['invoice_id'])->update('invoice', $invoice_update);

            $ledger_result = $this->Finance_model->update_student_ledger_for_payment($payment_id);
            if (is_array($ledger_result) && ($ledger_result['status'] ?? '') === 'error') {
                throw new RuntimeException('Student ledger reconciliation failed.');
            }

            $this->db->where('transaction_id', (int) $locked['transaction_id'])->update('payment_transactions', [
                'status' => 'success',
                'gateway_ref' => $gateway_ref !== '' ? $gateway_ref : ($locked['gateway_ref'] ?? ''),
                'response_data' => json_encode($payload)
            ]);

            if ($this->db->trans_status() === false) {
                throw new RuntimeException('Database transaction failed.');
            }
            $this->db->trans_commit();
            return ['success' => true, 'http_code' => 200, 'code' => 'settled', 'message' => 'Payment settled successfully.'];
        } catch (Throwable $e) {
            $this->db->trans_rollback();
            log_message('error', 'Hubtel collection settlement failed for ' . $transaction_ref . ': ' . $e->getMessage());
            return ['success' => false, 'http_code' => 500, 'code' => 'settlement_failed', 'message' => 'Payment could not be settled safely.'];
        }
    }

    private function record_callback_for_review(array $transaction, array $payload, $reason)
    {
        $body = ['review_reason' => $reason, 'callback' => $payload];
        $this->db->where('transaction_id', (int) $transaction['transaction_id'])->update('payment_transactions', [
            'response_data' => json_encode($body)
        ]);
    }

    private function post_json($url, array $fields)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode($this->client_id . ':' . $this->client_secret),
            'Accept: application/json',
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $raw = curl_exec($ch);
        $curl_error = curl_error($ch);
        $http_code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'http_code' => $http_code,
            'curl_error' => $curl_error,
            'body' => json_decode((string) $raw, true)
        ];
    }

    private function callback_token_for_reference($transaction_ref)
    {
        $transaction_ref = trim((string) $transaction_ref);
        if ($transaction_ref === '' || $this->client_secret === '') {
            return '';
        }

        return hash_hmac(
            'sha256',
            'hubtel-collection|' . $this->merchant_number . '|' . $transaction_ref,
            $this->client_secret
        );
    }

    private function generate_transaction_ref()
    {
        return 'HUB-COL-' . strtoupper(bin2hex(random_bytes(12)));
    }

    private function normalise_phone($phone)
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);
        if (strpos($digits, '0') === 0 && strlen($digits) === 10) {
            $digits = '233' . substr($digits, 1);
        }
        return preg_match('/^233\d{9}$/', $digits) ? $digits : '';
    }

    private function only_existing_fields($table, array $data)
    {
        $result = [];
        foreach ($data as $field => $value) {
            if ($this->db->field_exists($field, $table)) {
                $result[$field] = $value;
            }
        }
        return $result;
    }

    private function failure($code, $message)
    {
        return ['success' => false, 'status' => 'error', 'code' => $code, 'message' => $message];
    }
}
