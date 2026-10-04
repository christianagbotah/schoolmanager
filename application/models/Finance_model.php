<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Finance Model - Enterprise Grade (Sync-Aware)
 *
 * Extended from MY_Model to automatically track sync status.
 * All INSERT, UPDATE, DELETE operations will automatically set:
 * - sync_status = 'PENDING'
 * - last_modified_at = current timestamp
 * - device_id = configured device ID
 * - last_modified_by = current user ID
 *
 * @property CI_DB_query_builder $db
 * @property CI_Input $input
 * @property CI_Session $session
 */
class Finance_model extends MY_Model {

    public function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');
    }

    // ==================== DASHBOARD ====================
    public function get_dashboard_stats() {
        $year = get_settings('running_year');
        $term = get_settings('running_term');

        // Total revenue from payments
        $revenue = $this->db->select_sum('amount')
            ->where('year', $year)
            ->where('term', $term)
            ->get('payment')->row();

        // Outstanding invoices
        $outstanding = $this->db->select_sum('due')
            ->where('due >', 0)
            ->where('year', $year)
            ->where('term', $term)
            ->get('invoice')->row();

        // Total billed
        $billed = $this->db->select_sum('amount')
            ->where('year', $year)
            ->where('term', $term)
            ->get('invoice')->row();

        // Overdue invoices
        $overdue = $this->db->where('due >', 0)
            ->where('due_date <', date('Y-m-d'))
            ->where('year', $year)
            ->where('term', $term)
            ->count_all_results('invoice');

        // Collection rate
        $total_billed = $billed->amount ?? 0;
        $total_collected = $revenue->amount ?? 0;
        $collection_rate = $total_billed > 0 ? round(($total_collected / $total_billed) * 100, 2) : 0;

        // Top defaulters
        $defaulters = $this->db->select('s.student_id, s.name, s.student_code, c.name as class_name, SUM(i.due) as total_outstanding')
            ->from('invoice i')
            ->join('student s', 's.student_id = i.student_id')
            ->join('enroll e', 'e.student_id = s.student_id')
            ->join('class c', 'c.class_id = e.class_id')
            ->where('i.due >', 0)
            ->where('i.year', $year)
            ->where('i.term', $term)
            ->group_by('s.student_id')
            ->order_by('total_outstanding', 'DESC')
            ->limit(10)
            ->get()->result_array();

        // Recent transactions
        $recent_transactions = $this->db->select('p.*, s.name as student_name, s.student_code, p.timestamp as payment_date')
            ->from('payment p')
            ->join('student s', 's.student_id = p.student_id')
            ->where('p.year', $year)
            ->where('p.term', $term)
            ->order_by('p.timestamp', 'DESC')
            ->limit(10)
            ->get()->result_array();

        // Payment trends (last 30 days)
        $payment_trends = $this->db->select('DATE(FROM_UNIXTIME(timestamp)) as payment_date, SUM(amount) as daily_collection')
            ->where('year', $year)
            ->where('term', $term)
            ->where('timestamp >=', strtotime('-30 days'))
            ->group_by('payment_date')
            ->order_by('payment_date', 'ASC')
            ->get('payment')->result_array();

        // Outstanding analysis
        $low = $this->db->where('due >', 0)->where('due <=', 1000)->where('year', $year)->where('term', $term)->count_all_results('invoice');
        $medium = $this->db->where('due >', 1000)->where('due <=', 5000)->where('year', $year)->where('term', $term)->count_all_results('invoice');
        $high = $this->db->where('due >', 5000)->where('year', $year)->where('term', $term)->count_all_results('invoice');

        return [
            'overview' => [
                'total_billed' => $total_billed,
                'total_collected' => $total_collected,
                'total_outstanding' => $outstanding->due ?? 0,
                'overdue_invoices' => $overdue
            ],
            'collection_rate' => $collection_rate,
            'top_defaulters' => $defaulters,
            'recent_transactions' => $recent_transactions,
            'payment_trends' => $payment_trends,
            'outstanding_analysis' => [
                'low_outstanding' => $low,
                'medium_outstanding' => $medium,
                'high_outstanding' => $high
            ],
            'total_invoices' => $this->db->where('year', $year)->where('term', $term)->count_all_results('invoice'),
            'total_payments' => $this->db->where('year', $year)->where('term', $term)->count_all_results('payment')
        ];
    }

    // ==================== RECEIPTS ====================
    public function get_receipts_datatable() {
        $year = get_settings('running_year');
        $term = get_settings('running_term');

        $this->db->select('p.*, s.name as student_name, s.student_code, i.invoice_number, p.timestamp as received_date')
                 ->from('payment p')
                 ->join('student s', 's.student_id = p.student_id')
                 ->join('invoice i', 'i.invoice_id = p.invoice_id', 'left')
                 ->where('p.year', $year)
                 ->where('p.term', $term)
                 ->order_by('p.payment_id', 'DESC');

        $query = $this->db->get();
        $data = $query->result_array();

        // Add receipt number and format data
        foreach ($data as &$row) {
            $row['receipt_number'] = 'RCP-' . str_pad($row['payment_id'], 6, '0', STR_PAD_LEFT);
            $row['is_printed'] = isset($row['is_printed']) ? $row['is_printed'] : 0;
            $row['is_emailed'] = isset($row['is_emailed']) ? $row['is_emailed'] : 0;
        }

        echo json_encode([
            'draw' => intval($this->input->post('draw')),
            'recordsTotal' => $query->num_rows(),
            'recordsFiltered' => $query->num_rows(),
            'data' => $data
        ]);
    }

    public function generate_receipt() {
        $payment_id = $this->input->post('payment_id');
        $payment = $this->db->get_where('payment', ['payment_id' => $payment_id])->row();

        if (!$payment) {
            echo json_encode(['status' => 'error', 'message' => get_phrase('payment_not_found')]);
            return;
        }

        $receipt_number = 'RCP-' . str_pad($payment_id, 6, '0', STR_PAD_LEFT);
        echo json_encode(['status' => 'success', 'message' => get_phrase('receipt_generated'), 'receipt_id' => $payment_id, 'receipt_number' => $receipt_number]);
    }

    public function get_receipt($receipt_id) {
        return $this->db->select('p.*, s.name as student_name, s.student_code, s.phone, s.email, i.invoice_number, c.name as class_name')
            ->from('payment p')
            ->join('student s', 's.student_id = p.student_id')
            ->join('invoice i', 'i.invoice_id = p.invoice_id', 'left')
            ->join('enroll e', 'e.student_id = s.student_id')
            ->join('class c', 'c.class_id = e.class_id')
            ->where('p.payment_id', $receipt_id)
            ->get()->row_array();
    }

    public function mark_receipt_printed($receipt_id) {
        // Check if column exists before updating
        if ($this->db->field_exists('is_printed', 'payment')) {
            $this->db->where('payment_id', $receipt_id)->update('payment', [
                'is_printed' => 1,
                'printed_at' => time()
            ]);
        }
    }

    public function email_receipt($id) {
        $receipt = $this->get_receipt($id);
        if (!$receipt || empty($receipt['email'])) {
            echo json_encode(['status' => 'error', 'message' => get_phrase('email_not_found')]);
            return;
        }

        // Mark as emailed
        if ($this->db->field_exists('is_emailed', 'payment')) {
            $this->db->where('payment_id', $id)->update('payment', [
                'is_emailed' => 1,
                'emailed_at' => time()
            ]);
        }

        echo json_encode(['status' => 'success', 'message' => get_phrase('receipt_emailed')]);
    }

    public function bulk_generate_receipts() {
        $payment_ids = $this->input->post('payment_ids');
        if (empty($payment_ids)) {
            echo json_encode(['status' => 'error', 'message' => get_phrase('no_payments_selected')]);
            return;
        }

        $count = count($payment_ids);
        echo json_encode(['status' => 'success', 'message' => "$count " . get_phrase('receipts_generated')]);
    }


    // ==================== STUDENT LEDGER ====================

    public function update_student_ledger_for_invoice($invoice_code, $student_id) {
        if(!$this->db->table_exists('student_ledger')) return ['status' => 'skipped'];

        // The invoice table stores the post-discount amount. Add the active approved
        // discount allocations back so the invoice ledger reference represents the
        // base billed amount, while discount references carry their own credits.
        $invoice_total_row = $this->db->select('COALESCE(SUM(amount),0) AS total', false)
            ->where('invoice_code', $invoice_code)
            ->where('student_id', $student_id)
            ->get('invoice')->row_array();
        $invoice_total = (float)($invoice_total_row['total'] ?? 0);

        // Use the approved discount record as the source of truth. Older data may
        // have a valid approved discount whose per-item allocation rows are missing.
        $discount_total_row = $this->db->select('COALESCE(SUM(discount_amount),0) AS total', false)
            ->where('invoice_code', $invoice_code)
            ->where('student_id', $student_id)
            ->where('status', 'approved')
            ->get('invoice_discounts')->row_array();
        $discount_total = (float)($discount_total_row['total'] ?? 0);
        $desired_effect = round($invoice_total + $discount_total, 2);

        return $this->reconcile_ledger_effect(
            (int)$student_id,
            'invoice',
            (string)$invoice_code,
            $desired_effect,
            'invoice',
            'Invoice synchronized: ' . $invoice_code,
            get_settings('running_year'),
            get_settings('running_term')
        );
    }

    public function update_student_ledger_for_payment($payment_id) {
        if(!$this->db->table_exists('student_ledger')) return ['status' => 'skipped'];
        $payment = $this->db->where('payment_id', $payment_id)->get('payment')->row();
        if(!$payment) return ['status' => 'error', 'message' => 'Payment not found'];

        return $this->reconcile_ledger_effect(
            (int)$payment->student_id,
            'payment',
            (string)$payment_id,
            -round((float)$payment->amount, 2),
            'payment',
            'Payment synchronized - ' . (string)$payment->payment_method,
            $payment->year,
            $payment->term
        );
    }

    public function get_student_ledger_balance($student_id) {
        if(!$this->db->table_exists('student_ledger')) return 0;

        $last_entry = $this->db->where('student_id', $student_id)
            ->order_by('ledger_id', 'DESC')
            ->limit(1)
            ->get('student_ledger')->row();
        return $last_entry ? $last_entry->balance : 0;
    }

    public function update_student_ledger_for_discount($invoice_code, $student_id, $discount_amount, $discount_id = null) {
        if(!$this->db->table_exists('student_ledger')) return ['status' => 'skipped'];
        $ledger_reference = $discount_id ? ($invoice_code . ':discount:' . (int)$discount_id) : $invoice_code;
        return $this->reconcile_ledger_effect(
            (int)$student_id,
            'discount',
            (string)$ledger_reference,
            -round(max(0, (float)$discount_amount), 2),
            'discount',
            'Discount synchronized for invoice: ' . $invoice_code . ($discount_id ? ' [discount #' . (int)$discount_id . ']' : ''),
            get_settings('running_year'),
            get_settings('running_term')
        );
    }

    /**
     * Reconcile one ledger reference to a deterministic balance effect.
     * Positive desired_effect = debit / increases student balance.
     * Negative desired_effect = credit / decreases student balance.
     * Repeating the same call is a no-op once the reference is reconciled.
     */
    public function reconcile_ledger_effect($student_id, $reference_type, $reference_id, $desired_effect, $initial_type = 'adjustment', $description = '', $year = null, $term = null) {
        if(!$this->db->table_exists('student_ledger')) return ['status' => 'skipped'];
        $student_id = (int)$student_id;
        $reference_type = (string)$reference_type;
        $reference_id = (string)$reference_id;
        $desired_effect = round((float)$desired_effect, 2);
        if(!$student_id || $reference_id === '') return ['status'=>'error','message'=>'Invalid ledger reference'];

        $this->db->trans_start();
        // Serialize ledger reconciliation per student so concurrent approvals cannot
        // both calculate from the same balance/reference state.
        $this->db->query('SELECT student_id FROM student WHERE student_id = ? FOR UPDATE', [$student_id]);

        $effect_row = $this->db->select('COUNT(*) AS entries, COALESCE(SUM(debit_amount - credit_amount),0) AS net_effect', false)
            ->where('student_id', $student_id)
            ->where('reference_type', $reference_type)
            ->where('reference_id', $reference_id)
            ->get('student_ledger')->row_array();
        $existing_effect = round((float)($effect_row['net_effect'] ?? 0), 2);
        $entries = (int)($effect_row['entries'] ?? 0);
        $delta = round($desired_effect - $existing_effect, 2);

        if(abs($delta) < 0.005) {
            $this->db->trans_complete();
            return ['status'=>'no_change','existing_effect'=>$existing_effect,'desired_effect'=>$desired_effect];
        }

        $current_balance = (float)$this->get_student_ledger_balance($student_id);
        $new_balance = round($current_balance + $delta, 2);
        $transaction_type = $entries === 0 ? $initial_type : 'adjustment';
        $debit = $delta > 0 ? $delta : 0;
        $credit = $delta < 0 ? abs($delta) : 0;
        $ledger_description = $description !== '' ? $description : ucfirst($reference_type) . ' ledger reconciliation';
        if($entries > 0) {
            $ledger_description .= ' · reconciled from ' . number_format($existing_effect,2,'.','') . ' to ' . number_format($desired_effect,2,'.','');
        }

        $this->db->insert('student_ledger', [
            'student_id' => $student_id,
            'transaction_date' => date('Y-m-d'),
            'transaction_type' => $transaction_type,
            'reference_type' => $reference_type,
            'reference_id' => $reference_id,
            'description' => $ledger_description,
            'debit_amount' => $debit,
            'credit_amount' => $credit,
            'balance' => $new_balance,
            'year' => $year ?: get_settings('running_year'),
            'term' => $term ?: get_settings('running_term'),
            'created_by' => $this->session->userdata('admin_id') ?: 1,
            'created_at' => time()
        ]);
        $ledger_id = (int)$this->db->insert_id();
        $this->db->trans_complete();
        if($this->db->trans_status() === FALSE) return ['status'=>'error','message'=>'Ledger reconciliation failed'];
        return ['status'=>'success','ledger_id'=>$ledger_id,'delta'=>$delta,'desired_effect'=>$desired_effect];
    }

    public function get_student_ledger($student_id, $year = null, $term = null) {
        if(!$this->db->table_exists('student_ledger')) return [];

        $this->db->where('student_id', $student_id);
        if($year) $this->db->where('year', $year);
        if($term) $this->db->where('term', $term);
        $this->db->order_by('transaction_date', 'DESC');
        $this->db->order_by('ledger_id', 'DESC');

        return $this->db->get('student_ledger')->result_array();
    }

    // ==================== ACCOUNTS INTEGRATION ====================

    public function sync_payment_to_accounts($payment_id) {
        $this->load->library('Financial_integration_hooks');
        return $this->financial_integration_hooks->sync_invoice_payment($payment_id);
    }

    public function sync_all_unsynced_payments() {
        $this->load->library('Financial_integration_hooks');

        $payments = $this->db->where('synced_to_accounts', 0)
            ->or_where('synced_to_accounts IS NULL', null, false)
            ->get('payment')->result();

        $results = ['synced' => 0, 'failed' => 0, 'total_amount' => 0];

        foreach($payments as $payment) {
            $result = $this->financial_integration_hooks->sync_invoice_payment($payment->payment_id);
            if($result['status'] == 'success') {
                $results['synced']++;
                $results['total_amount'] += $payment->amount;
            } else {
                $results['failed']++;
            }
        }

        return $results;
    }

    // ==================== PAYMENT PLANS ====================
    public function get_payment_plans_datatable() {
        // Check if payment_plans table exists
        if (!$this->db->table_exists('payment_plans')) {
            echo json_encode([
                'draw' => intval($this->input->post('draw')),
                'recordsTotal' => 0,
                'recordsFiltered' => 0,
                'data' => []
            ]);
            return;
        }

        $this->db->select('pp.*, s.name as student_name, s.student_code, i.invoice_number')
                 ->from('payment_plans pp')
                 ->join('student s', 's.student_id = pp.student_id')
                 ->join('invoice i', 'i.invoice_code = pp.invoice_code', 'left')
                 ->order_by('pp.plan_id', 'DESC');

        $query = $this->db->get();

        echo json_encode([
            'draw' => intval($this->input->post('draw')),
            'recordsTotal' => $query->num_rows(),
            'recordsFiltered' => $query->num_rows(),
            'data' => $query->result_array()
        ]);
    }

    public function create_payment_plan() {
        $data = [
            'student_id' => $this->input->post('student_id'),
            'invoice_code' => $this->input->post('invoice_code'),
            'total_amount' => $this->input->post('total_amount'),
            'installments' => $this->input->post('installments'),
            'frequency' => $this->input->post('frequency'),
            'start_date' => $this->input->post('start_date'),
            'status' => 'active',
            'creation_timestamp' => time(),
            'created_by' => $this->session->userdata('admin_id')
        ];

        $this->db->insert('payment_plans', $data);
        echo json_encode(['status' => 'success', 'message' => get_phrase('payment_plan_created')]);
    }

    public function get_installments($id) {
        $plan = $this->db->get_where('payment_plans', ['plan_id' => $id])->row_array();
        if (!$plan) {
            echo json_encode(['status' => 'error', 'message' => get_phrase('plan_not_found')]);
            return;
        }

        $installment_amount = $plan['total_amount'] / $plan['installments'];
        $installments = [];
        $start_date = strtotime($plan['start_date']);

        for ($i = 1; $i <= $plan['installments']; $i++) {
            $due_date = $start_date;
            if ($plan['frequency'] == 'weekly') {
                $due_date = strtotime("+" . ($i - 1) . " weeks", $start_date);
            } elseif ($plan['frequency'] == 'monthly') {
                $due_date = strtotime("+" . ($i - 1) . " months", $start_date);
            } elseif ($plan['frequency'] == 'quarterly') {
                $due_date = strtotime("+" . (($i - 1) * 3) . " months", $start_date);
            }

            $installments[] = [
                'installment_number' => $i,
                'amount' => $installment_amount,
                'due_date' => date('Y-m-d', $due_date),
                'status' => 'pending'
            ];
        }

        echo json_encode(['status' => 'success', 'data' => $installments]);
    }

    public function update_payment_plan_status($id) {
        $status = $this->input->post('status');
        $this->db->where('plan_id', $id)->update('payment_plans', ['status' => $status]);
        echo json_encode(['status' => 'success', 'message' => get_phrase('status_updated')]);
    }

    public function delete_payment_plan($id) {
        $this->db->where('plan_id', $id)->delete('payment_plans');
        echo json_encode(['status' => 'success', 'message' => get_phrase('payment_plan_deleted')]);
    }

    // ==================== CREDIT NOTES ====================
    public function get_credit_notes_datatable() {
        if (!$this->db->table_exists('credit_notes')) {
            echo json_encode([
                'draw' => intval($this->input->post('draw')),
                'recordsTotal' => 0,
                'recordsFiltered' => 0,
                'data' => []
            ]);
            return;
        }

        $this->db->select('cn.*, s.name as student_name, s.student_code, i.invoice_number')
                 ->from('credit_notes cn')
                 ->join('student s', 's.student_id = cn.student_id')
                 ->join('invoice i', 'i.invoice_id = cn.invoice_id', 'left')
                 ->order_by('cn.credit_note_id', 'DESC');

        $query = $this->db->get();

        echo json_encode([
            'draw' => intval($this->input->post('draw')),
            'recordsTotal' => $query->num_rows(),
            'recordsFiltered' => $query->num_rows(),
            'data' => $query->result_array()
        ]);
    }

    public function create_credit_note() {
        $data = [
            'credit_note_number' => 'CN-' . date('Ymd') . '-' . rand(1000, 9999),
            'student_id' => $this->input->post('student_id'),
            'invoice_id' => $this->input->post('invoice_id'),
            'amount' => $this->input->post('amount'),
            'reason' => $this->input->post('reason'),
            'status' => 'pending',
            'creation_timestamp' => time(),
            'created_by' => $this->session->userdata('admin_id')
        ];

        $this->db->insert('credit_notes', $data);
        echo json_encode(['status' => 'success', 'message' => get_phrase('credit_note_created')]);
    }

    public function approve_credit_note($id) {
        $this->db->where('credit_note_id', $id)->update('credit_notes', [
            'status' => 'approved',
            'approved_at' => time(),
            'approved_by' => $this->session->userdata('admin_id')
        ]);
        echo json_encode(['status' => 'success', 'message' => get_phrase('credit_note_approved')]);
    }

    public function apply_credit_note($id) {
        $credit_note = $this->db->get_where('credit_notes', ['credit_note_id' => $id])->row();
        if (!$credit_note || $credit_note->status != 'approved') {
            echo json_encode(['status' => 'error', 'message' => get_phrase('credit_note_not_approved')]);
            return;
        }

        // Apply credit to invoice
        $invoice = $this->db->get_where('invoice', ['invoice_id' => $credit_note->invoice_id])->row();
        if ($invoice) {
            $new_due = max(0, $invoice->due - $credit_note->amount);
            $this->db->where('invoice_id', $credit_note->invoice_id)->update('invoice', ['due' => $new_due]);
        }

        $this->db->where('credit_note_id', $id)->update('credit_notes', [
            'status' => 'applied',
            'applied_at' => time()
        ]);

        echo json_encode(['status' => 'success', 'message' => get_phrase('credit_note_applied')]);
    }

    public function cancel_credit_note($id) {
        $this->db->where('credit_note_id', $id)->update('credit_notes', ['status' => 'cancelled']);
        echo json_encode(['status' => 'success', 'message' => get_phrase('credit_note_cancelled')]);
    }

    // ==================== FEE STRUCTURES ====================
    public function get_fee_structures_datatable() {
        $this->db->select('*')->from('bill_item')->order_by('id', 'DESC');
        $query = $this->db->get();

        echo json_encode([
            'draw' => intval($this->input->post('draw')),
            'recordsTotal' => $query->num_rows(),
            'recordsFiltered' => $query->num_rows(),
            'data' => $query->result_array()
        ]);
    }

    public function create_fee_structure() {
        $data = [
            'title' => $this->input->post('title'),
            'amount' => $this->input->post('amount'),
            'category_id' => $this->input->post('category_id')
        ];
        $this->db->insert('bill_item', $data);
        echo json_encode(['status' => 'success', 'message' => get_phrase('fee_structure_created')]);
    }

    public function update_fee_structure($id) {
        $data = [
            'title' => $this->input->post('title'),
            'amount' => $this->input->post('amount')
        ];
        $this->db->where('id', $id)->update('bill_item', $data);
        echo json_encode(['status' => 'success', 'message' => get_phrase('fee_structure_updated')]);
    }

    public function clone_fee_structure($id) {
        $original = $this->db->where('id', $id)->get('bill_item')->row_array();
        if ($original) {
            unset($original['id']);
            $original['title'] .= ' (Copy)';
            $this->db->insert('bill_item', $original);
        }
        echo json_encode(['status' => 'success', 'message' => get_phrase('fee_structure_cloned')]);
    }

    public function deactivate_fee_structure($id) {
        $this->db->where('id', $id)->update('bill_item', ['status' => 0]);
        echo json_encode(['status' => 'success', 'message' => get_phrase('fee_structure_deactivated')]);
    }

    // ==================== SETTINGS ====================
    public function get_late_payment_settings() {
        return [
            'late_fee_enabled' => get_settings('late_fee_enabled') ?? '0',
            'late_fee_amount' => get_settings('late_fee_amount') ?? '0',
            'late_fee_days' => get_settings('late_fee_days') ?? '30'
        ];
    }

    public function update_late_payment_settings() {
        $settings = [
            'late_fee_enabled' => $this->input->post('late_fee_enabled'),
            'late_fee_amount' => $this->input->post('late_fee_amount'),
            'late_fee_days' => $this->input->post('late_fee_days')
        ];

        foreach ($settings as $key => $value) {
            $exists = $this->db->where('type', $key)->get('settings')->num_rows();
            if ($exists) {
                $this->db->where('type', $key)->update('settings', ['description' => $value]);
            } else {
                $this->db->insert('settings', ['type' => $key, 'description' => $value]);
            }
        }

        echo json_encode(['status' => 'success', 'message' => get_phrase('settings_updated')]);
    }

    // ==================== REPORTS ====================
    public function get_report_data($type) {
        $year = get_settings('running_year');
        $term = get_settings('running_term');

        switch ($type) {
            case 'revenue':
                return $this->db->select('DATE(FROM_UNIXTIME(timestamp)) as date, SUM(amount) as total, COUNT(*) as transactions')
                                ->where('year', $year)
                                ->where('term', $term)
                                ->group_by('date')
                                ->order_by('date', 'ASC')
                                ->get('payment')
                                ->result_array();

            case 'outstanding':
                return $this->db->select('c.name as class_name, COUNT(DISTINCT i.student_id) as students, SUM(i.due) as total')
                                ->from('invoice i')
                                ->join('enroll e', 'e.student_id = i.student_id')
                                ->join('class c', 'c.class_id = e.class_id')
                                ->where('i.due >', 0)
                                ->where('i.year', $year)
                                ->where('i.term', $term)
                                ->group_by('c.class_id')
                                ->order_by('total', 'DESC')
                                ->get()
                                ->result_array();

            case 'collection':
                return $this->db->select('payment_method, COUNT(*) as count, SUM(amount) as total')
                                ->where('year', $year)
                                ->where('term', $term)
                                ->group_by('payment_method')
                                ->get('payment')
                                ->result_array();

            case 'defaulters':
                return $this->db->select('s.name, s.student_code, c.name as class_name, SUM(i.due) as outstanding, MAX(i.due_date) as last_due_date')
                                ->from('invoice i')
                                ->join('student s', 's.student_id = i.student_id')
                                ->join('enroll e', 'e.student_id = s.student_id')
                                ->join('class c', 'c.class_id = e.class_id')
                                ->where('i.due >', 0)
                                ->where('i.year', $year)
                                ->where('i.term', $term)
                                ->group_by('s.student_id')
                                ->order_by('outstanding', 'DESC')
                                ->limit(50)
                                ->get()
                                ->result_array();

            default:
                return [];
        }
    }

    public function export_report($type, $format) {
        $data = $this->get_report_data($type);

        if (empty($data)) {
            echo json_encode(['status' => 'error', 'message' => get_phrase('no_data_to_export')]);
            return;
        }

        if ($format == 'excel') {
            $this->load->helper('export');
            $filename = ucfirst($type) . '_Report_' . date('Y-m-d');
            export_to_excel($data, $filename);
        } else {
            echo json_encode(['status' => 'success', 'message' => get_phrase('report_exported')]);
        }
    }

    // ==================== STUDENT STATEMENTS ====================
    public function get_student_statement($student_id) {
        $year = get_settings('running_year');
        $term = get_settings('running_term');

        // Get student info
        $student = $this->db->select('s.*, c.name as class_name')
            ->from('student s')
            ->join('enroll e', 'e.student_id = s.student_id')
            ->join('class c', 'c.class_id = e.class_id')
            ->where('s.student_id', $student_id)
            ->get()->row_array();

        // Get invoices
        $invoices = $this->db->select('*')
            ->where('student_id', $student_id)
            ->where('year', $year)
            ->where('term', $term)
            ->order_by('created_at', 'DESC')
            ->get('invoice')->result_array();

        // Get payments
        $payments = $this->db->select('*')
            ->where('student_id', $student_id)
            ->where('year', $year)
            ->where('term', $term)
            ->order_by('timestamp', 'DESC')
            ->get('payment')->result_array();

        return [
            'student' => $student,
            'invoices' => $invoices,
            'payments' => $payments,
            'summary' => [
                'total_billed' => array_sum(array_column($invoices, 'total_amount')),
                'total_paid' => array_sum(array_column($payments, 'amount')),
                'total_outstanding' => array_sum(array_column($invoices, 'due'))
            ]
        ];
    }

    public function download_statement($student_id, $format) {
        $data = $this->get_student_statement($student_id);

        if ($format == 'pdf') {
            $this->load->library('pdf');
            $html = $this->load->view('backend/admin/finance/statement_pdf', $data, true);
            $this->pdf->loadHtml($html);
            $this->pdf->render();
            $this->pdf->stream("statement_{$student_id}.pdf");
        }
    }

    // ==================== REVERSAL METHODS ====================

    /**
     * Reverse invoice ledger entry when invoice is deleted
     */
    public function reverse_invoice_ledger($invoice_code, $student_id) {
        return $this->reconcile_ledger_effect(
            (int)$student_id,
            'invoice',
            (string)$invoice_code,
            0,
            'adjustment',
            'Invoice deleted/reversed: ' . $invoice_code,
            get_settings('running_year'),
            get_settings('running_term')
        );
    }

    /**
     * Reverse payment sync when payment is deleted
     */
    public function reverse_payment_sync($payment_id) {
        $payment = $this->db->where('payment_id', $payment_id)->get('payment')->row();
        if(!$payment) return ['status' => 'error', 'message' => 'Payment not found'];

        $ledger_result = $this->reconcile_ledger_effect(
            (int)$payment->student_id,
            'payment',
            (string)$payment_id,
            0,
            'adjustment',
            'Payment deleted/reversed - ' . (string)$payment->payment_method,
            $payment->year,
            $payment->term
        );

        // Reverse journal entry in accounts. The financial hook is responsible for
        // its own journal-side duplicate protection.
        $this->load->library('Financial_integration_hooks');
        $accounts_result = $this->financial_integration_hooks->reverse_invoice_payment($payment_id);
        return ['status' => 'success', 'ledger_reversed' => $ledger_result, 'accounts_reversed' => $accounts_result];
    }

    /**
     * Reverse discount ledger entry when discount is removed
     * IMPORTANT: discount_amount MUST be provided before deleting the discount record
     */
    public function reverse_discount_ledger($invoice_code, $student_id, $discount_amount = null, $discount_id = null) {
        if(!$this->db->table_exists('student_ledger')) return ['status' => 'skipped'];
        $ledger_reference = $discount_id ? ($invoice_code . ':discount:' . (int)$discount_id) : $invoice_code;
        return $this->reconcile_ledger_effect(
            (int)$student_id,
            'discount',
            (string)$ledger_reference,
            0,
            'adjustment',
            'Discount reversed for invoice: ' . $invoice_code . ($discount_id ? ' [discount #' . (int)$discount_id . ']' : ''),
            get_settings('running_year'),
            get_settings('running_term')
        );
    }

    public function get_student_unpaid_invoices($student_id) {
        return $this->db->select('*')
            ->where('student_id', $student_id)
            ->where('due >', 0)
            ->order_by('created_at', 'DESC')
            ->get('invoice')->result_array();
    }

    public function get_invoice_details($invoice_code) {
        return $this->db->select('i.*, s.name as student_name, s.student_code')
            ->from('invoice i')
            ->join('student s', 's.student_id = i.student_id')
            ->where('i.invoice_code', $invoice_code)
            ->get()->row_array();
    }

    public function search_students($term) {
        return $this->db->select('student_id, name, student_code')
            ->like('name', $term)
            ->or_like('student_code', $term)
            ->limit(10)
            ->get('student')->result_array();
    }
}
