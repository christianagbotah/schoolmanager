<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Server-authoritative Hubtel salary payout adapter.
 *
 * A payroll record remains approved while its outbound payout is processing.
 * Only a callback that matches the stored payout intent may transition payroll
 * to paid. Outbound transactions never reuse the inbound fee payment ledger.
 */
class Hubtel_payroll_payout_model extends CI_Model
{
    private $client_id;
    private $client_secret;
    private $send_url;

    public function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->model('Payroll_approval_model');

        $this->client_id = trim((string) get_settings('hubtel_payment_client_id'));
        $this->client_secret = trim((string) get_settings('hubtel_payment_client_secret'));
        $this->send_url = trim((string) get_settings('hubtel_payroll_send_url'));
    }

    public function initiate_payout($pay_id, $actor_id, $actor_role)
    {
        $pay_id = (int) $pay_id;
        $actor_id = (int) $actor_id;
        $actor_role = in_array($actor_role, ['admin', 'super_admin'], true) ? $actor_role : 'admin';

        if ($pay_id <= 0 || $actor_id <= 0) {
            return $this->failure('invalid_request', 'Invalid payroll or administrator.');
        }
        if (!$this->db->table_exists('payroll_payout_transactions')) {
            return $this->failure('migration_required', 'Payroll payout ledger has not been installed.');
        }
        if ($this->client_id === '' || $this->client_secret === '') {
            return $this->failure('gateway_not_configured', 'Hubtel payout credentials are not configured.');
        }
        if ($this->send_url === '' || strpos($this->send_url, '{mobileNumber}') === false) {
            return $this->failure('send_url_not_configured', 'Configure hubtel_payroll_send_url from the Hubtel developer portal with a {mobileNumber} placeholder.');
        }

        $payroll_data = $this->Payroll_approval_model->get_payroll_with_staff($pay_id);
        if (!$payroll_data) {
            return $this->failure('payroll_not_found', 'Payroll record not found.');
        }
        if (($payroll_data['approval_status'] ?? '') !== 'approved') {
            return $this->failure('payroll_not_approved', 'Payroll must be approved before payout.');
        }

        $amount = round((float) ($payroll_data['net_salary'] ?? 0), 2);
        $phone = $this->normalise_phone($payroll_data['employee_phone'] ?? '');
        if ($amount <= 0) {
            return $this->failure('invalid_amount', 'Payroll net salary must be greater than zero.');
        }
        if ($phone === '') {
            return $this->failure('invalid_phone', 'Employee requires a valid Ghana mobile number for Hubtel payout.');
        }

        $this->db->trans_begin();
        try {
            $locked_payroll = $this->db->query(
                'SELECT * FROM pay_salary WHERE pay_id = ? FOR UPDATE',
                [$pay_id]
            )->row_array();
            if (!$locked_payroll || ($locked_payroll['approval_status'] ?? '') !== 'approved') {
                $this->db->trans_rollback();
                return $this->failure('payroll_state_changed', 'Payroll is no longer approved for payout.');
            }

            $existing = $this->db->query(
                'SELECT * FROM payroll_payout_transactions WHERE pay_id = ? FOR UPDATE',
                [$pay_id]
            )->row_array();
            if ($existing) {
                $this->db->trans_commit();
                return [
                    'success' => in_array($existing['status'], ['pending', 'processing', 'success'], true),
                    'status' => $existing['status'],
                    'code' => $existing['status'] === 'failed' ? 'manual_review_required' : 'existing_payout',
                    'message' => $existing['status'] === 'failed'
                        ? 'A failed payout already exists; review it before another transfer is attempted.'
                        : 'A payout already exists for this payroll.',
                    'client_reference' => $existing['client_reference']
                ];
            }

            $client_reference = 'HUB-PAY-' . strtoupper(bin2hex(random_bytes(12)));
            $now = date('Y-m-d H:i:s');
            $request_payload = [
                'amount' => $amount,
                'title' => 'Salary payment',
                'description' => 'Salary payout for payroll #' . $pay_id,
                'clientReference' => $client_reference,
                'callbackUrl' => site_url('payroll_payout/hubtel_callback')
            ];

            $this->db->insert('payroll_payout_transactions', [
                'pay_id' => $pay_id,
                'provider' => 'hubtel',
                'client_reference' => $client_reference,
                'recipient_phone' => $phone,
                'amount' => $amount,
                'currency' => get_settings('currency') ?: 'GHS',
                'status' => 'pending',
                'initiated_by' => $actor_id,
                'initiated_by_role' => $actor_role,
                'request_payload' => json_encode($request_payload),
                'initiated_at' => $now,
                'created_at' => $now,
                'updated_at' => $now
            ]);
            $payout_id = (int) $this->db->insert_id();
            if ($payout_id <= 0 || $this->db->trans_status() === false) {
                throw new RuntimeException('Could not create payout intent.');
            }
            $this->db->trans_commit();
        } catch (Throwable $e) {
            $this->db->trans_rollback();
            log_message('error', 'Payroll payout intent failed for pay_id ' . $pay_id . ': ' . $e->getMessage());
            return $this->failure('intent_failed', 'Could not create payout intent safely.');
        }

        $url = str_replace('{mobileNumber}', rawurlencode($phone), $this->send_url);
        $result = $this->post_json($url, $request_payload);
        $body = is_array($result['body']) ? $result['body'] : [];
        $data = $body['data'] ?? $body['Data'] ?? [];
        $provider_transaction_id = trim((string) ($data['transactionId'] ?? $data['TransactionId'] ?? ''));
        $returned_reference = trim((string) ($data['clientReference'] ?? $data['ClientReference'] ?? $client_reference));
        $accepted = $result['http_code'] >= 200 && $result['http_code'] < 300
            && $result['curl_error'] === ''
            && ($returned_reference === '' || hash_equals($client_reference, $returned_reference));

        $update = [
            'status' => $accepted ? 'processing' : 'failed',
            'provider_transaction_id' => $provider_transaction_id !== '' ? $provider_transaction_id : null,
            'response_payload' => json_encode($body ?: ['transport_error' => $result['curl_error']]),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        if (!$accepted) {
            $update['failure_reason'] = (string) ($body['message'] ?? $body['Message'] ?? $result['curl_error'] ?: 'Hubtel rejected payout initiation.');
            $update['failed_at'] = date('Y-m-d H:i:s');
        }
        $this->db->where('payout_id', $payout_id)->update('payroll_payout_transactions', $update);

        if (!$accepted) {
            return $this->failure('hubtel_payout_failed', $update['failure_reason']);
        }

        return [
            'success' => true,
            'status' => 'processing',
            'client_reference' => $client_reference,
            'provider_transaction_id' => $provider_transaction_id
        ];
    }

    public function handle_callback($raw_body)
    {
        $payload = json_decode((string) $raw_body, true);
        if (!is_array($payload)) {
            return $this->callback_result(false, 400, 'invalid_json', 'Invalid callback payload.');
        }

        $data = $payload['data'] ?? $payload['Data'] ?? $payload;
        $client_reference = trim((string) ($data['clientReference'] ?? $data['ClientReference'] ?? ''));
        $provider_transaction_id = trim((string) ($data['transactionId'] ?? $data['TransactionId'] ?? ''));
        $callback_phone = $this->normalise_phone($data['mobileNumber'] ?? $data['MobileNumber'] ?? '');
        $callback_amount = isset($data['amount']) ? round((float) $data['amount'], 2)
            : (isset($data['Amount']) ? round((float) $data['Amount'], 2) : null);
        $provider_status = strtolower(trim((string) ($data['status'] ?? $data['Status'] ?? '')));

        if ($client_reference === '' || $provider_transaction_id === '' || $callback_amount === null || $callback_phone === '') {
            return $this->callback_result(false, 400, 'missing_binding', 'Callback is missing required payout binding data.');
        }
        if ($provider_status !== '' && !in_array($provider_status, ['success', 'successful', 'completed', 'complete', 'paid'], true)) {
            return $this->callback_result(true, 200, 'provider_not_successful', 'Callback recorded without marking payroll paid.');
        }

        $this->db->trans_begin();
        try {
            $payout = $this->db->query(
                'SELECT * FROM payroll_payout_transactions WHERE client_reference = ? FOR UPDATE',
                [$client_reference]
            )->row_array();
            if (!$payout) {
                $this->db->trans_rollback();
                return $this->callback_result(false, 404, 'payout_not_found', 'Payout intent not found.');
            }

            if ($payout['status'] === 'success') {
                $this->db->trans_commit();
                return $this->callback_result(true, 200, 'already_confirmed', 'Payout already confirmed.');
            }

            if (abs($callback_amount - round((float) $payout['amount'], 2)) >= 0.005) {
                $this->record_callback_review($payout, $payload, 'amount_mismatch');
                $this->db->trans_commit();
                return $this->callback_result(false, 409, 'amount_mismatch', 'Payout amount mismatch.');
            }
            if (!hash_equals((string) $payout['recipient_phone'], $callback_phone)) {
                $this->record_callback_review($payout, $payload, 'recipient_mismatch');
                $this->db->trans_commit();
                return $this->callback_result(false, 409, 'recipient_mismatch', 'Payout recipient mismatch.');
            }
            if (!empty($payout['provider_transaction_id']) && !hash_equals((string) $payout['provider_transaction_id'], $provider_transaction_id)) {
                $this->record_callback_review($payout, $payload, 'provider_transaction_mismatch');
                $this->db->trans_commit();
                return $this->callback_result(false, 409, 'provider_transaction_mismatch', 'Provider transaction mismatch.');
            }

            $transition = $this->mark_payroll_paid_from_provider($payout, $provider_transaction_id);
            if (!$transition['success']) {
                $this->db->trans_rollback();
                return $this->callback_result(false, 409, $transition['code'], $transition['message']);
            }

            $this->db->where('payout_id', (int) $payout['payout_id'])->update('payroll_payout_transactions', [
                'status' => 'success',
                'provider_transaction_id' => $provider_transaction_id,
                'callback_payload' => json_encode($payload),
                'confirmed_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
                'failure_reason' => null
            ]);

            if ($this->db->trans_status() === false) {
                throw new RuntimeException('Payout confirmation transaction failed.');
            }
            $this->db->trans_commit();
            $this->send_payment_notification((int) $payout['pay_id'], (int) $payout['initiated_by'], $provider_transaction_id);
            return $this->callback_result(true, 200, 'confirmed', 'Payroll payout confirmed.');
        } catch (Throwable $e) {
            $this->db->trans_rollback();
            log_message('error', 'Hubtel payroll callback failed for ' . $client_reference . ': ' . $e->getMessage());
            return $this->callback_result(false, 500, 'confirmation_failed', 'Payout confirmation failed safely.');
        }
    }

    private function mark_payroll_paid_from_provider(array $payout, $provider_transaction_id)
    {
        $payroll = $this->db->query(
            'SELECT * FROM pay_salary WHERE pay_id = ? FOR UPDATE',
            [(int) $payout['pay_id']]
        )->row_array();
        if (!$payroll) {
            return $this->failure('payroll_not_found', 'Payroll record no longer exists.');
        }
        if (($payroll['approval_status'] ?? '') === 'paid') {
            return ['success' => true, 'code' => 'already_paid', 'message' => 'Payroll already paid.'];
        }
        if (($payroll['approval_status'] ?? '') !== 'approved') {
            return $this->failure('payroll_not_approved', 'Payroll is no longer approved.');
        }

        $now = date('Y-m-d H:i:s');
        $update = [
            'approval_status' => 'paid',
            'status' => 'paid',
            'updated_at' => $now
        ];
        if ($this->db->field_exists('paid_at', 'pay_salary')) {
            $update['paid_at'] = $now;
        }
        $this->db->where('pay_id', (int) $payout['pay_id'])->update('pay_salary', $update);

        $this->db->insert('payroll_approvals', [
            'pay_id' => (int) $payout['pay_id'],
            'approver_user_id' => (int) $payout['initiated_by'],
            'approver_role' => in_array($payout['initiated_by_role'], ['admin', 'super_admin'], true) ? $payout['initiated_by_role'] : 'admin',
            'action' => 'paid',
            'comments' => 'Hubtel payout confirmed: ' . $provider_transaction_id,
            'action_date' => $now
        ]);

        if ($this->db->table_exists('payroll_audit_enhanced')) {
            $this->db->insert('payroll_audit_enhanced', [
                'pay_id' => (int) $payout['pay_id'],
                'user_id' => (int) $payout['initiated_by'],
                'action' => 'provider_payment',
                'field_changed' => 'approval_status',
                'old_value' => 'approved',
                'new_value' => 'paid',
                'ip_address' => $this->input->ip_address(),
                'user_agent' => substr((string) $this->input->user_agent(), 0, 500),
                'created_at' => $now
            ]);
        }

        return ['success' => true, 'code' => 'paid', 'message' => 'Payroll marked paid from provider confirmation.'];
    }

    private function record_callback_review(array $payout, array $payload, $reason)
    {
        $this->db->where('payout_id', (int) $payout['payout_id'])->update('payroll_payout_transactions', [
            'callback_payload' => json_encode($payload),
            'failure_reason' => $reason,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }

    private function send_payment_notification($pay_id, $actor_id, $provider_transaction_id)
    {
        try {
            $this->load->library('Notification_dispatcher');
            $payroll_data = $this->Payroll_approval_model->get_payroll_with_staff($pay_id);
            $this->notification_dispatcher->dispatch_notification('payment', $payroll_data, [
                'marked_paid_by' => $actor_id,
                'provider' => 'hubtel',
                'provider_transaction_id' => $provider_transaction_id
            ]);
        } catch (Throwable $e) {
            log_message('error', 'Payroll payout notification failed for pay_id ' . $pay_id . ': ' . $e->getMessage());
        }
    }

    private function post_json($url, array $payload)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Basic ' . base64_encode($this->client_id . ':' . $this->client_secret),
            'Accept: application/json',
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        $raw = curl_exec($ch);
        $error = curl_error($ch);
        $http_code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'http_code' => $http_code,
            'curl_error' => $error,
            'body' => json_decode((string) $raw, true)
        ];
    }

    private function normalise_phone($phone)
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);
        if (strlen($digits) === 10 && strpos($digits, '0') === 0) {
            $digits = '233' . substr($digits, 1);
        }
        return preg_match('/^233\d{9}$/', $digits) ? $digits : '';
    }

    private function callback_result($success, $http_code, $code, $message)
    {
        return [
            'success' => (bool) $success,
            'http_code' => (int) $http_code,
            'code' => $code,
            'message' => $message
        ];
    }

    private function failure($code, $message)
    {
        return ['success' => false, 'status' => 'error', 'code' => $code, 'message' => $message];
    }
}
