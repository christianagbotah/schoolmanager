<?php
//currency
    $currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
    $fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);

    $un_year = '';
    $un_term = '';
    $un_sem = '';

if($search == 'search') {

  $year;
  $term;
  $sem;

        $un_year = $year;
        $un_term = $term;
        $un_sem = $sem;
        $timestamp = $date;
        $full_date = 'for Year '.$un_year.' | Term '.$un_term; //As at '. date('l M d, Y', $timestamp);
        $full_date2 = 'for Year '.$un_year.' | Term '.$un_term; //'As at '. date('l M d, Y', $timestamp);


$querry_arr = array('year' => $year, 'due >' => '0');
$this->db->select('invoice_code');
$this->db->distinct();
$this->db->from('invoice');
$this->db->where('can_delete !=', 'trash');
$this->db->where($querry_arr);
$this->db->where('term', $term);
$this->db->where('mute', '0');

$this->db->order_by('invoice_code', 'desc');
$unpaid_invoices = $this->db->get()->num_rows();

$this->db->select_sum('due');
$this->db->where('year', $year);
$this->db->where('due >', '0');
$this->db->where('term', $term);
$this->db->where('mute', '0');
$this->db->where('can_delete !=', 'trash');
$unpaid_invoices_amount = $this->db->get('invoice')->result_array();
foreach($unpaid_invoices_amount as $amount)
    $total_unpaid_invoice_amount = $amount['due'];


$payment_arr = array('year' => $year, 'payment_type' => 'income');

$this->db->select('receipt_code');
$this->db->distinct();
$this->db->from('payment');
$this->db->where($payment_arr);
$this->db->where('term', $term);
$this->db->where('can_delete !=', 'trash');
$this->db->order_by('receipt_code', 'desc');
$payment_rows = $this->db->get()->num_rows();

$total_income = 0;

$this->db->where($payment_arr);
$this->db->where('term', $term);
$this->db->where('can_delete !=', 'trash');
$payments = $this->db->get('payment')->result_array();
foreach($payments as $row)
    $total_income += (float) $row['amount'];

$total_expense = 0;
$this->db->where('year', $year);
$this->db->where('payment_type', 'expense');
$this->db->where('term', $term);
$this->db->where('can_delete !=', 'trash');
$payments = $this->db->get('payment')->result_array();
foreach($payments as $row)
    $total_expense += $row['amount'];

    $unpaid_invoices = $unpaid_invoices;
    $total_income = numfmt_format_currency($fmt, $total_income, $currency);
    $total_expense = numfmt_format_currency($fmt, $total_expense, $currency);;
    $total_unpaid_invoice_amount = numfmt_format_currency($fmt, $total_unpaid_invoice_amount, $currency);


    //feeding fee
    $this->db->select('timestamp');
    $this->db->distinct();
    $this->db->where('timestamp <=', $timestamp);
    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $this->db->order_by('timestamp', 'desc');
    $this->db->limit(1);
    $last_timestamp_result = $this->db->get('feeding_fee');
    $last_timestamp = $last_timestamp_result->num_rows() > 0
        ? (int) $last_timestamp_result->row()->timestamp
        : $timestamp;


    $this->db->where('timestamp', $last_timestamp);
    $this->db->where('mute', '0');
    $feeding_owe_now = $this->db->get('feeding_fee')->result_array();

    $total_feeding_owe = 0;
    $total_feeding_paid = 0;

    $total_classes_owe = 0;
    $total_classes_paid = 0;

    foreach($feeding_owe_now as $feeding) {
        if($feeding['due'] > 0) {
            $total_feeding_owe = $total_feeding_owe + $feeding['due'];
        }

        if($feeding['cdue'] > 0) {
            $total_classes_owe = $total_classes_owe + $feeding['cdue'];
        }


    }

    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $this->db->where('mute', '0');
    $feeding_paid_array = $this->db->get('feeding_fee')->result_array();

    foreach($feeding_paid_array as $feeding2) {

        $total_feeding_paid = $total_feeding_paid + $feeding2['feeding_paid'];
        $total_classes_paid = $total_classes_paid + $feeding2['classes_paid'];
    }

//fare
    // Note: transport_fare table uses payment_date (date) and created_at (timestamp), not timestamp
    // Get the latest payment_date on or before the selected date
    $date_str = date('Y-m-d', $timestamp);
    $this->db->select('payment_date');
    $this->db->distinct();
    $this->db->where('payment_date <=', $date_str);
    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $this->db->order_by('payment_date', 'desc');
    $this->db->limit(1);
    $last_payment_result = $this->db->get('transport_fare');
    $last_payment_date = $last_payment_result->num_rows() > 0 ? $last_payment_result->row()->payment_date : null;


    // Note: New transport_fare schema doesn't track 'due' - only tracks payments
    // If you need to track amounts owed, use transport route fare minus payments
    $this->db->where('payment_date', $last_payment_date);
    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $fare_owe_now = $this->db->get('transport_fare')->result_array();

    $total_fare_owe = 0;
    $total_fare_paid = 0;
    foreach($fare_owe_now as $fare) {
        // Note: 'due' field doesn't exist in new schema - calculating based on fare charges
        // This would need to be calculated separately if tracking is needed
    }


    // Note: transport_fare table doesn't have 'mute' field in new schema
    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $fare_paid_array = $this->db->get('transport_fare')->result_array();
    foreach($fare_paid_array as $fare2) {
        $total_fare_paid = $total_fare_paid + $fare2['amount_paid'];
    }
}else{

    $un_year = $running_year;
    $un_term = $running_term;
    $un_sem = $running_sem;
    $timestamp = strtotime(date('M d, Y'));

    //let's select the current date in the tables
    $feeding_timestamp_result = $this->db
                                ->select('timestamp')
                                ->distinct()
                                ->order_by('timestamp', 'desc')
                                ->limit(1)
                                ->get('feeding_fee');
    $feeding_timestamp = $feeding_timestamp_result->num_rows() > 0
        ? (int) $feeding_timestamp_result->row()->timestamp
        : strtotime(date('d-m-Y'));

    // Note: transport_fare uses payment_date instead of timestamp
    $transport_payment_date = $this->db
                                ->select('payment_date')
                                ->distinct()
                                ->order_by('payment_date', 'desc')
                                ->limit(1)
                                ->get('transport_fare');
    $transport_timestamp = $transport_payment_date->num_rows() > 0 && $transport_payment_date->row()->payment_date
                            ? strtotime($transport_payment_date->row()->payment_date)
                            : null;

    $full_date = 'received this term';
    $full_date2 = 'for this term';

    if($feeding_timestamp == NULL) {
        $feeding_timestamp = strtotime(date('d-m-Y'));
    }

    if($transport_timestamp == NULL) {
        $transport_timestamp = strtotime(date('d-m-Y'));
    }




    $querry_arr = array('year' => $running_year, 'due >' => '0');
    $this->db->select('invoice_code');
    $this->db->distinct();
    $this->db->from('invoice');
    $this->db->where($querry_arr);
    $this->db->where('can_delete !=', 'trash');
    $this->db->where('term', $running_term);
    $this->db->where('mute', '0');
    $this->db->order_by('invoice_code', 'desc');
    $unpaid_invoices = $this->db->get()->num_rows();



    $this->db->select_sum('due');
    $this->db->where('due >', '0');
    $this->db->where('mute', '0');
    $this->db->where('can_delete !=', 'trash');
    $unpaid_invoices_amount = $this->db->get_where('invoice', array('year' => $running_year, 'term' => $running_term))->result_array();
    foreach($unpaid_invoices_amount as $amount)
        $total_unpaid_invoice_amount = $amount['due'];

    $payment_arr = array('year' => $running_year, 'payment_type' => 'income');
    $this->db->select('receipt_code');
    $this->db->distinct();
    $this->db->from('payment');
    $this->db->where($payment_arr);
    $this->db->where('term', $running_term);
    $this->db->order_by('receipt_code', 'desc');
    $payment_rows = $this->db->get()->num_rows();


    $total_income = 0;
    $this->db->where('payment_type', 'income');
    $this->db->where('year', $running_year);
    $this->db->where('term', $running_term);
    $this->db->where('can_delete !=', 'trash');
    $payments = $this->db->get('payment')->result_array();
    foreach($payments as $row)
        $total_income += (float) $row['amount'];

    $total_expense = 0;
    $this->db->where('payment_type', 'expense');
    $this->db->where('year', $running_year);
    $this->db->where('term', $running_term);
    $this->db->where('can_delete !=', 'trash');
    $payments = $this->db->get('payment')->result_array();
    foreach($payments as $row)
        $total_expense += $row['amount'];

        $unpaid_invoices = $unpaid_invoices;
        $total_income = numfmt_format_currency($fmt, $total_income, $currency);
        $total_expense = numfmt_format_currency($fmt, $total_expense, $currency);;
        $total_unpaid_invoice_amount = numfmt_format_currency($fmt, $total_unpaid_invoice_amount, $currency);


    //feeding fee

    $this->db->where('timestamp', $feeding_timestamp);
    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $this->db->where('mute', '0');
    $feeding_owe_now = $this->db->get('feeding_fee')->result_array();

    $total_feeding_owe = 0;
    $total_feeding_paid = 0;

    $total_classes_owe = 0;
    $total_classes_paid = 0;

    foreach($feeding_owe_now as $feeding) {

        if($feeding['due'] > 0) {
            $total_feeding_owe = $total_feeding_owe + $feeding['due'];
        }

        if($feeding['cdue'] > 0) {
            $total_classes_owe = $total_classes_owe + $feeding['cdue'];
        }


    }


    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $this->db->where('mute', '0');
    $feeding_paid_array = $this->db->get('feeding_fee')->result_array();

    foreach($feeding_paid_array as $feeding2) {

        $total_feeding_paid = $total_feeding_paid + $feeding2['feeding_paid'];
        $total_classes_paid = $total_classes_paid + $feeding2['classes_paid'];
    }

//fare
    // Note: Using payment_date instead of timestamp, convert timestamp back to date
    $transport_payment_date = date('Y-m-d', $transport_timestamp);
    $this->db->where('payment_date', $transport_payment_date);
    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $fare_owe_now = $this->db->get('transport_fare')->result_array();

    $total_fare_owe = 0;
    $total_fare_paid = 0;
    foreach($fare_owe_now as $fare) {
        // Note: 'due' field doesn't exist in new schema - only tracks payments
        // Amounts owed would need to be calculated separately based on route fares
    }


    // Note: transport_fare table doesn't have 'mute' field in new schema
    $this->db->where('year', $un_year);
    $this->db->where('term', $un_term);
    $fare_paid_array = $this->db->get('transport_fare')->result_array();
    foreach($fare_paid_array as $fare2) {
        $total_fare_paid = $total_fare_paid + $fare2['amount_paid'];
    }
}




    //summary
    $total_feeding_owe = numfmt_format_currency($fmt, $total_feeding_owe, $currency);
    $total_classes_owe = numfmt_format_currency($fmt, $total_classes_owe, $currency);
    $total_fare_owe = numfmt_format_currency($fmt, $total_fare_owe, $currency);

    $total_feeding_paid = numfmt_format_currency($fmt, $total_feeding_paid, $currency);
    $total_classes_paid = numfmt_format_currency($fmt, $total_classes_paid, $currency);
    $total_fare_paid = numfmt_format_currency($fmt, $total_fare_paid, $currency);


    $timestamp = date('l M d, Y', $timestamp);


?>

<style>
.finance-command-center {
    --finance-border: #e5e7eb;
    --finance-muted: #64748b;
    --finance-text: #0f172a;
    --finance-surface: #ffffff;
    --finance-soft: #f8fafc;
    --finance-primary: #1d4ed8;
    --finance-success: #047857;
    --finance-danger: #b91c1c;
    --finance-warning: #b45309;
    display: grid;
    gap: 22px;
    margin-bottom: 24px;
}

.finance-command-center__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    padding: 4px 2px 0;
}

.finance-command-center__title {
    margin: 0;
    color: var(--finance-text);
    font-size: clamp(22px, 2.4vw, 30px);
    font-weight: 700;
    letter-spacing: -0.02em;
}

.finance-command-center__subtitle {
    margin: 7px 0 0;
    color: var(--finance-muted);
    font-size: 14px;
    line-height: 1.55;
}

.finance-period-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 38px;
    padding: 8px 12px;
    border: 1px solid var(--finance-border);
    border-radius: 999px;
    background: var(--finance-surface);
    color: #334155;
    font-size: 13px;
    font-weight: 600;
    white-space: nowrap;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.05);
}

.finance-summary-grid,
.finance-services-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
}

.finance-card {
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 154px;
    padding: 18px;
    border: 1px solid var(--finance-border);
    border-radius: 16px;
    background: var(--finance-surface);
    color: var(--finance-text);
    text-align: left;
    text-decoration: none;
    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06);
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}

button.finance-card {
    width: 100%;
    font: inherit;
    cursor: pointer;
}

.finance-card:hover {
    transform: translateY(-2px);
    border-color: #cbd5e1;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.09);
    color: var(--finance-text);
    text-decoration: none;
}

.finance-card:focus-visible {
    outline: 3px solid rgba(29, 78, 216, 0.22);
    outline-offset: 3px;
}

.finance-card__topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.finance-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--finance-soft);
    color: var(--finance-primary);
    font-size: 17px;
}

.finance-card__eyebrow {
    color: var(--finance-muted);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
}

.finance-card__value {
    margin-top: 16px;
    overflow-wrap: anywhere;
    color: var(--finance-text);
    font-size: clamp(22px, 2.1vw, 30px);
    font-weight: 750;
    line-height: 1.1;
}

.finance-card__label {
    margin-top: 7px;
    color: #334155;
    font-size: 14px;
    font-weight: 650;
}

.finance-card__meta {
    margin-top: auto;
    padding-top: 13px;
    color: var(--finance-muted);
    font-size: 12px;
    line-height: 1.4;
}

.finance-card__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 30px;
    min-height: 28px;
    padding: 4px 9px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 700;
}

.finance-card--receivable .finance-card__icon,
.finance-debt-card .finance-card__icon {
    background: #fef2f2;
    color: var(--finance-danger);
}

.finance-card--income .finance-card__icon,
.finance-card--feeding .finance-card__icon,
.finance-card--classes .finance-card__icon {
    background: #ecfdf5;
    color: var(--finance-success);
}

.finance-card--expense .finance-card__icon {
    background: #fff7ed;
    color: var(--finance-warning);
}

.finance-section {
    display: grid;
    gap: 14px;
}

.finance-section__heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 16px;
}

.finance-section__heading h3 {
    margin: 0;
    color: var(--finance-text);
    font-size: 17px;
    font-weight: 700;
}

.finance-section__heading p {
    margin: 4px 0 0;
    color: var(--finance-muted);
    font-size: 13px;
}

.finance-services-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(280px, 1.2fr);
}

.finance-debt-card {
    min-height: 154px;
}

.finance-debt-list {
    display: grid;
    gap: 9px;
    margin: 15px 0 0;
    padding: 0;
    list-style: none;
}

.finance-debt-list li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #475569;
    font-size: 13px;
}

.finance-debt-list strong {
    color: var(--finance-text);
    font-size: 14px;
}

.finance-card__action {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    margin-top: 14px;
    color: var(--finance-primary);
    font-size: 12px;
    font-weight: 700;
}

@media (max-width: 1199px) {
    .finance-summary-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .finance-services-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 767px) {
    .finance-command-center {
        gap: 18px;
    }

    .finance-command-center__header,
    .finance-section__heading {
        align-items: stretch;
        flex-direction: column;
    }

    .finance-period-chip {
        align-self: flex-start;
        white-space: normal;
    }

    .finance-summary-grid,
    .finance-services-grid {
        grid-template-columns: 1fr;
    }

    .finance-card {
        min-height: 138px;
        padding: 16px;
        border-radius: 14px;
    }
}
</style>

<section class="finance-command-center" aria-label="Finance overview">
    <header class="finance-command-center__header">
        <div>
            <h2 class="finance-command-center__title"><?php echo get_phrase('finance_overview'); ?></h2>
            <p class="finance-command-center__subtitle">
                <?php echo get_phrase('income_expenses_receivables_and_daily_services_at_a_glance'); ?>
            </p>
        </div>
        <div class="finance-period-chip">
            <i class="fa fa-calendar" aria-hidden="true"></i>
            <span><?php echo html_escape($un_year); ?> &middot; <?php echo get_phrase('term'); ?> <?php echo html_escape($un_term); ?></span>
        </div>
    </header>

    <div class="finance-summary-grid">
        <button type="button" class="finance-card finance-card--receivable"
                onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_unpaid_invoices/'.$un_term .'/'. $un_year.'/'. $un_sem);?>', 'modal_unpaid_invoices');"
                aria-label="<?php echo get_phrase('open_unpaid_invoices'); ?>">
            <div class="finance-card__topline">
                <span class="finance-card__icon"><i class="fa fa-credit-card" aria-hidden="true"></i></span>
                <span class="finance-card__badge"><?php echo $unpaid_invoices ? $unpaid_invoices : 0; ?></span>
            </div>
            <div class="finance-card__value"><?php echo $total_unpaid_invoice_amount ? $total_unpaid_invoice_amount : 0; ?></div>
            <div class="finance-card__label"><?php echo get_phrase('outstanding_invoices'); ?></div>
            <div class="finance-card__meta"><?php echo $full_date2; ?> &middot; <?php echo get_phrase('select_to_review'); ?></div>
        </button>

        <div class="finance-card finance-card--income">
            <div class="finance-card__topline">
                <span class="finance-card__icon"><i class="fa fa-money" aria-hidden="true"></i></span>
                <span class="finance-card__eyebrow"><?php echo get_phrase('income'); ?></span>
            </div>
            <div class="finance-card__value"><?php echo $total_income ? $total_income : 0; ?></div>
            <div class="finance-card__label"><?php echo get_phrase('total_income'); ?></div>
            <div class="finance-card__meta"><?php echo $full_date; ?></div>
        </div>

        <a class="finance-card finance-card--expense"
           href="<?php echo site_url('admin/expense'); ?>"
           onclick="navigation('<?php echo site_url('admin/expense'); ?>'); return false;">
            <div class="finance-card__topline">
                <span class="finance-card__icon"><i class="fa fa-tags" aria-hidden="true"></i></span>
                <span class="finance-card__eyebrow"><?php echo get_phrase('expenses'); ?></span>
            </div>
            <div class="finance-card__value"><?php echo $total_expense ? $total_expense : 0; ?></div>
            <div class="finance-card__label"><?php echo get_phrase('total_expenses'); ?></div>
            <div class="finance-card__meta"><?php echo get_phrase('select_to_open_expense_management'); ?></div>
        </a>

        <div class="finance-card">
            <div class="finance-card__topline">
                <span class="finance-card__icon"><i class="fa fa-file-text-o" aria-hidden="true"></i></span>
                <span class="finance-card__eyebrow"><?php echo get_phrase('receipts'); ?></span>
            </div>
            <div class="finance-card__value"><?php echo $payment_rows ? $payment_rows : 0; ?></div>
            <div class="finance-card__label"><?php echo get_phrase('income_receipts'); ?></div>
            <div class="finance-card__meta"><?php echo $full_date; ?></div>
        </div>
    </div>

    <div class="finance-section">
        <div class="finance-section__heading">
            <div>
                <h3><?php echo get_phrase('daily_services_collection'); ?></h3>
                <p><?php echo get_phrase('feeding_classes_transport_and_outstanding_balances'); ?></p>
            </div>
            <span class="finance-card__eyebrow"><?php echo html_escape($timestamp); ?></span>
        </div>

        <div class="finance-services-grid">
            <a class="finance-card finance-card--feeding"
               href="<?php echo site_url($this->session->userdata('login_type').'/cft_student_receipt'); ?>"
               onclick="navigation('<?php echo site_url($this->session->userdata('login_type').'/cft_student_receipt'); ?>'); return false;">
                <div class="finance-card__topline">
                    <span class="finance-card__icon"><i class="fa fa-cutlery" aria-hidden="true"></i></span>
                    <span class="finance-card__eyebrow"><?php echo get_phrase('collected'); ?></span>
                </div>
                <div class="finance-card__value"><?php echo $total_feeding_paid ? $total_feeding_paid : 0; ?></div>
                <div class="finance-card__label"><?php echo get_phrase('feeding_fees'); ?></div>
                <div class="finance-card__meta"><?php echo html_escape($un_year); ?> &middot; <?php echo get_phrase('term'); ?> <?php echo html_escape($un_term); ?></div>
            </a>

            <a class="finance-card finance-card--classes"
               href="<?php echo site_url($this->session->userdata('login_type').'/cft_student_receipt'); ?>"
               onclick="navigation('<?php echo site_url($this->session->userdata('login_type').'/cft_student_receipt'); ?>'); return false;">
                <div class="finance-card__topline">
                    <span class="finance-card__icon"><i class="fa fa-graduation-cap" aria-hidden="true"></i></span>
                    <span class="finance-card__eyebrow"><?php echo get_phrase('collected'); ?></span>
                </div>
                <div class="finance-card__value"><?php echo $total_classes_paid ? $total_classes_paid : 0; ?></div>
                <div class="finance-card__label"><?php echo get_phrase('classes_fees'); ?></div>
                <div class="finance-card__meta"><?php echo html_escape($un_year); ?> &middot; <?php echo get_phrase('term'); ?> <?php echo html_escape($un_term); ?></div>
            </a>

            <a class="finance-card"
               href="<?php echo site_url($this->session->userdata('login_type').'/cft_student_receipt'); ?>"
               onclick="navigation('<?php echo site_url($this->session->userdata('login_type').'/cft_student_receipt'); ?>'); return false;">
                <div class="finance-card__topline">
                    <span class="finance-card__icon"><i class="fa fa-bus" aria-hidden="true"></i></span>
                    <span class="finance-card__eyebrow"><?php echo get_phrase('collected'); ?></span>
                </div>
                <div class="finance-card__value"><?php echo $total_fare_paid ? $total_fare_paid : 0; ?></div>
                <div class="finance-card__label"><?php echo get_phrase('transport_fare'); ?></div>
                <div class="finance-card__meta"><?php echo html_escape($un_year); ?> &middot; <?php echo get_phrase('term'); ?> <?php echo html_escape($un_term); ?></div>
            </a>

            <a class="finance-card finance-debt-card"
               href="<?php echo site_url($this->session->userdata('login_type').'/fct_debtors/'.strtotime($timestamp)); ?>"
               target="_blank" rel="noopener"
               aria-label="<?php echo get_phrase('open_debtors_list'); ?>">
                <div class="finance-card__topline">
                    <span class="finance-card__icon"><i class="fa fa-line-chart" aria-hidden="true"></i></span>
                    <span class="finance-card__eyebrow"><?php echo get_phrase('outstanding'); ?></span>
                </div>
                <div class="finance-card__label"><?php echo get_phrase('unpaid_balances'); ?></div>
                <ul class="finance-debt-list">
                    <li><span><?php echo get_phrase('feeding'); ?></span><strong><?php echo $total_feeding_owe ? $total_feeding_owe : 0; ?></strong></li>
                    <li><span><?php echo get_phrase('classes'); ?></span><strong><?php echo $total_classes_owe ? $total_classes_owe : 0; ?></strong></li>
                    <li><span><?php echo get_phrase('transport'); ?></span><strong><?php echo $total_fare_owe ? $total_fare_owe : 0; ?></strong></li>
                </ul>
                <span class="finance-card__action"><?php echo get_phrase('open_debtors_list'); ?> <i class="fa fa-arrow-right" aria-hidden="true"></i></span>
            </a>
        </div>
    </div>
</section>
