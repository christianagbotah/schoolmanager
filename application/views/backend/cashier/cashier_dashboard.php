<style>
.cashier-home{max-width:1180px;margin:0 auto;padding:8px 0 32px}.cashier-hero{background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;border-radius:18px;padding:26px;margin-bottom:20px;box-shadow:0 14px 34px rgba(15,23,42,.16)}.cashier-hero h2{margin:0 0 6px;font-size:28px;font-weight:800}.cashier-hero p{margin:0;opacity:.86}.cashier-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.cashier-tile{display:block;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:22px;color:#0f172a;box-shadow:0 6px 18px rgba(15,23,42,.06);transition:.2s}.cashier-tile:hover{transform:translateY(-2px);text-decoration:none;box-shadow:0 10px 24px rgba(15,23,42,.1)}.cashier-tile i{font-size:24px;color:#2563eb}.cashier-tile h3{font-size:17px;font-weight:800;margin:16px 0 6px}.cashier-tile p{color:#64748b;margin:0;line-height:1.5}.cashier-note{margin-top:18px;padding:14px 16px;border-radius:12px;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;font-weight:600}@media(max-width:767px){.cashier-grid{grid-template-columns:1fr}.cashier-hero{padding:20px}.cashier-hero h2{font-size:23px}}
</style>
<div class="cashier-home">
  <div class="cashier-hero">
    <h2><i class="fa fa-cash-register"></i> <?php echo get_phrase('cashier_dashboard'); ?></h2>
    <p><?php echo date('l, d F Y'); ?> · Daily fee collection workspace</p>
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
      <p>Review your receipts, payment breakdown and total amount collected for the selected day.</p>
    </a>
    <a class="cashier-tile" href="<?php echo site_url('cashier/daily_fee_rates'); ?>">
      <i class="fa fa-tags"></i>
      <h3>Daily fee rates</h3>
      <p>Review the configured feeding, classes, breakfast, water and transport fee rates.</p>
    </a>
  </div>
  <div class="cashier-note"><i class="fa fa-info-circle"></i> All monetary amounts in this workspace are shown in Ghana cedis (₵).</div>
</div>
