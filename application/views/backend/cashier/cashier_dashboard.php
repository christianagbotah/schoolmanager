<?php
$cashier_id = (int) $this->session->userdata('admin_id');
$today_start = strtotime(date('Y-m-d 00:00:00'));
$tomorrow_start = strtotime('+1 day', $today_start);

$today_transactions = $this->db
    ->select('payment_method, total_amount')
    ->from('daily_fee_transactions')
    ->where('collected_by', $cashier_id)
    ->where('payment_date >=', $today_start)
    ->where('payment_date <', $tomorrow_start)
    ->get()
    ->result_array();

$today_kpis = [
    'total' => 0.0,
    'receipts' => count($today_transactions),
    'cash' => 0.0,
    'momo' => 0.0,
    'bank' => 0.0,
    'cheque' => 0.0,
];

foreach ($today_transactions as $transaction) {
    $amount = (float) ($transaction['total_amount'] ?? 0);
    $today_kpis['total'] += $amount;

    switch ((int) ($transaction['payment_method'] ?? 0)) {
        case 1:
            $today_kpis['cash'] += $amount;
            break;
        case 2:
            $today_kpis['cheque'] += $amount;
            break;
        case 3:
            $today_kpis['momo'] += $amount;
            break;
        case 4:
            $today_kpis['bank'] += $amount;
            break;
    }
}
?>
<style>
.cashier-home{max-width:1180px;margin:0 auto;padding:8px 0 32px}.cashier-hero{background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;border-radius:18px;padding:26px;margin-bottom:18px;box-shadow:0 14px 34px rgba(15,23,42,.16)}.cashier-hero h2{margin:0 0 6px;font-size:28px;font-weight:800}.cashier-hero p{margin:0;opacity:.86}.cashier-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px}.cashier-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:15px;padding:17px;box-shadow:0 5px 16px rgba(15,23,42,.05)}.cashier-kpi-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.cashier-kpi-label{color:#64748b;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.cashier-kpi-icon{display:grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#eff6ff;color:#2563eb}.cashier-kpi strong{display:block;margin-top:10px;color:#0f172a;font-size:24px;font-weight:900;font-variant-numeric:tabular-nums}.cashier-kpi.primary{background:#0f172a;border-color:#0f172a}.cashier-kpi.primary .cashier-kpi-label{color:#cbd5e1}.cashier-kpi.primary .cashier-kpi-icon{background:rgba(255,255,255,.12);color:#fff}.cashier-kpi.primary strong{color:#fff}.cashier-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.cashier-tile{display:block;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;color:#0f172a;box-shadow:0 6px 18px rgba(15,23,42,.06);transition:.2s}.cashier-tile:hover{transform:translateY(-2px);text-decoration:none;box-shadow:0 10px 24px rgba(15,23,42,.1)}.cashier-tile i{font-size:24px;color:#2563eb}.cashier-tile h3{font-size:17px;font-weight:800;margin:16px 0 6px}.cashier-tile p{color:#64748b;margin:0;line-height:1.5}.cashier-note{margin-top:18px;padding:14px 16px;border-radius:12px;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;font-weight:600}@media(max-width:900px){.cashier-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:767px){.cashier-grid{grid-template-columns:1fr}.cashier-hero{padding:20px}.cashier-hero h2{font-size:23px}.cashier-kpis{grid-template-columns:1fr 1fr;gap:9px}.cashier-kpi{padding:14px}.cashier-kpi strong{font-size:19px}.cashier-kpi-icon{width:30px;height:30px}}@media(max-width:420px){.cashier-kpis{grid-template-columns:1fr}}
</style>
<div class="cashier-home">
  <div class="cashier-hero">
    <h2><i class="fa fa-cash-register"></i> <?php echo get_phrase('cashier_dashboard'); ?></h2>
    <p><?php echo date('l, d F Y'); ?> · Your daily fee collection action center</p>
  </div>

  <div class="cashier-kpis" aria-label="Today's cashier collection summary">
    <div class="cashier-kpi primary" data-cashier-kpi="today-total">
      <div class="cashier-kpi-head"><span class="cashier-kpi-label">Collected today</span><span class="cashier-kpi-icon"><i class="fa fa-coins"></i></span></div>
      <strong>₵<?php echo number_format($today_kpis['total'], 2); ?></strong>
    </div>
    <div class="cashier-kpi" data-cashier-kpi="receipt-count">
      <div class="cashier-kpi-head"><span class="cashier-kpi-label">Receipts today</span><span class="cashier-kpi-icon"><i class="fa fa-receipt"></i></span></div>
      <strong><?php echo number_format($today_kpis['receipts']); ?></strong>
    </div>
    <div class="cashier-kpi" data-cashier-kpi="cash-total">
      <div class="cashier-kpi-head"><span class="cashier-kpi-label">Cash</span><span class="cashier-kpi-icon"><i class="fa fa-money-bill-wave"></i></span></div>
      <strong>₵<?php echo number_format($today_kpis['cash'], 2); ?></strong>
    </div>
    <div class="cashier-kpi" data-cashier-kpi="momo-total">
      <div class="cashier-kpi-head"><span class="cashier-kpi-label">Mobile Money</span><span class="cashier-kpi-icon"><i class="fa fa-mobile-alt"></i></span></div>
      <strong>₵<?php echo number_format($today_kpis['momo'], 2); ?></strong>
    </div>
    <div class="cashier-kpi" data-cashier-kpi="bank-total">
      <div class="cashier-kpi-head"><span class="cashier-kpi-label">Bank transfer</span><span class="cashier-kpi-icon"><i class="fa fa-university"></i></span></div>
      <strong>₵<?php echo number_format($today_kpis['bank'], 2); ?></strong>
    </div>
    <div class="cashier-kpi" data-cashier-kpi="cheque-total">
      <div class="cashier-kpi-head"><span class="cashier-kpi-label">Cheque</span><span class="cashier-kpi-icon"><i class="fa fa-file-invoice-dollar"></i></span></div>
      <strong>₵<?php echo number_format($today_kpis['cheque'], 2); ?></strong>
    </div>
  </div>

  <div class="cashier-grid">
    <a class="cashier-tile" href="<?php echo site_url('cashier/daily_fee_collection'); ?>">
      <i class="fa fa-hand-holding-usd"></i>
      <h3>Collect daily fees</h3>
      <p>Find a student, review prepaid balances and arrears, allocate the payment and issue a receipt.</p>
    </a>
    <a class="cashier-tile" href="<?php echo site_url('cashier/daily_collection_report'); ?>">
      <i class="fa fa-chart-line"></i>
      <h3>Today's collections</h3>
      <p>Review receipts, tender breakdowns, totals and the day-close report for your own collections.</p>
    </a>
    <a class="cashier-tile" href="<?php echo site_url('cashier/daily_fee_rates'); ?>">
      <i class="fa fa-tags"></i>
      <h3>Daily fee rates</h3>
      <p>Review the configured feeding, classes, breakfast, water and transport fee rates.</p>
    </a>
  </div>
  <div class="cashier-note"><i class="fa fa-info-circle"></i> Today’s figures are limited to transactions collected by your signed-in cashier account. All monetary amounts are shown in Ghana cedis (₵).</div>
</div>
