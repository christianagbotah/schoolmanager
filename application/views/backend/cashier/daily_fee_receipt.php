<?php
$money = function($value) { return '₵' . number_format((float)$value, 2); };
$method_map = [1 => 'Cash', 2 => 'Cheque', 3 => 'Mobile Money', 4 => 'Bank Transfer'];
$school_logo = trim((string)($school_logo ?? ''));
if ($school_logo === '') {
    $school_logo_url = base_url('uploads/school_logo.png');
} elseif (preg_match('#^https?://#i', $school_logo)) {
    $school_logo_url = $school_logo;
} elseif (strpos($school_logo, 'uploads/') === 0) {
    $school_logo_url = base_url($school_logo);
} else {
    $school_logo_url = base_url('uploads/' . ltrim($school_logo, '/'));
}
$receipt_number = $transaction['receipt_number'] ?? $transaction['transaction_code'] ?? '';
$receipt_time = (int)($transaction['created_at'] ?? $transaction['payment_date'] ?? time());
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Daily Fee Receipt - <?php echo html_escape($receipt_number); ?></title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,Helvetica,sans-serif}.receipt-shell{max-width:820px;margin:26px auto;padding:0 14px}.receipt-card{position:relative;overflow:hidden;background:#fff;border:1px solid #dbe3ee;border-radius:18px;padding:30px 34px;box-shadow:0 16px 44px rgba(15,23,42,.12)}.paid-watermark{position:absolute;left:50%;top:53%;transform:translate(-50%,-50%) rotate(-25deg);font-size:112px;font-weight:900;letter-spacing:.12em;color:rgba(5,150,105,.055);pointer-events:none;white-space:nowrap}.school-head{position:relative;display:flex;align-items:center;gap:16px;padding-bottom:18px;border-bottom:2px solid #0f766e}.school-logo{width:76px;height:76px;object-fit:contain;flex:0 0 76px}.school-copy{min-width:0}.school-copy h1{font-size:23px;line-height:1.15;margin:0 0 6px;font-weight:900;text-transform:uppercase}.school-contact{font-size:12px;line-height:1.55;color:#64748b}.receipt-band{position:relative;display:flex;justify-content:space-between;gap:20px;align-items:center;margin:18px 0;padding:13px 16px;border-radius:12px;background:#0f172a;color:#fff}.receipt-band h2{margin:0;font-size:16px;letter-spacing:.08em}.receipt-band .number{text-align:right;font-size:12px}.receipt-band .number strong{display:block;font-size:14px}.receipt-grid{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:13px 26px;margin-bottom:18px}.receipt-field{padding:9px 0;border-bottom:1px solid #e2e8f0}.receipt-field strong{display:block;margin-bottom:4px;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.07em}.receipt-field span{font-size:14px;font-weight:700}.receipt-table{position:relative;width:100%;border-collapse:collapse;margin:18px 0}.receipt-table th,.receipt-table td{padding:11px 12px;border-bottom:1px solid #e2e8f0}.receipt-table th{background:#f8fafc;text-align:left;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.05em}.receipt-table th:last-child,.receipt-table td:last-child{text-align:right}.receipt-total{position:relative;display:flex;justify-content:space-between;align-items:center;padding:16px 18px;border-radius:12px;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46}.receipt-total span:first-child{font-size:12px;text-transform:uppercase;font-weight:800;letter-spacing:.05em}.receipt-total span:last-child{font-size:27px;font-weight:900}.receipt-note{position:relative;margin-top:14px;padding:11px 13px;border-radius:10px;background:#f8fafc;color:#475569;font-size:12px}.receipt-footer{position:relative;margin-top:24px;padding-top:16px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;gap:22px;align-items:flex-end}.receipt-footer p{margin:0;color:#64748b;font-size:11px;line-height:1.55}.cashier-block{text-align:right;color:#334155;font-size:12px}.cashier-block strong{display:block;color:#0f172a;margin-top:4px}.receipt-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px}.receipt-actions button,.receipt-actions a{border:0;border-radius:9px;padding:10px 15px;font-size:13px;font-weight:800;text-decoration:none;cursor:pointer}.receipt-actions button{background:#0f766e;color:#fff}.receipt-actions a{background:#e2e8f0;color:#0f172a}@media(max-width:640px){.receipt-shell{margin:10px auto;padding:0 7px}.receipt-card{padding:20px 16px;border-radius:12px}.school-head{align-items:flex-start}.school-logo{width:58px;height:58px;flex-basis:58px}.school-copy h1{font-size:18px}.receipt-band{display:block}.receipt-band .number{text-align:left;margin-top:8px}.receipt-grid{grid-template-columns:1fr}.receipt-footer{display:block}.cashier-block{text-align:left;margin-top:12px}.receipt-actions{flex-direction:column}.receipt-actions button,.receipt-actions a{text-align:center;width:100%}.paid-watermark{font-size:70px}}@media print{@page{margin:10mm}body{background:#fff}.receipt-shell{max-width:none;margin:0;padding:0}.receipt-card{border:0;border-radius:0;padding:0;box-shadow:none}.receipt-actions{display:none!important}.paid-watermark{color:rgba(5,150,105,.045)}.receipt-band,.receipt-total{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="receipt-shell">
  <article class="receipt-card">
    <div class="paid-watermark">PAID</div>
    <header class="school-head">
      <img class="school-logo" src="<?php echo html_escape($school_logo_url); ?>" alt="<?php echo html_escape($school_name); ?> logo">
      <div class="school-copy">
        <h1><?php echo html_escape($school_name); ?></h1>
        <div class="school-contact">
          <?php if (!empty($school_address)): ?><div><?php echo html_escape($school_address); ?></div><?php endif; ?>
          <?php if (!empty($school_phone) || !empty($school_email)): ?><div><?php if (!empty($school_phone)): ?>Tel: <?php echo html_escape($school_phone); ?><?php endif; ?><?php if (!empty($school_phone) && !empty($school_email)): ?> &nbsp;•&nbsp; <?php endif; ?><?php if (!empty($school_email)): ?>Email: <?php echo html_escape($school_email); ?><?php endif; ?></div><?php endif; ?>
        </div>
      </div>
    </header>

    <section class="receipt-band">
      <h2>OFFICIAL DAILY FEE RECEIPT</h2>
      <div class="number"><strong><?php echo html_escape($receipt_number); ?></strong><?php echo date('d M Y, h:i A', $receipt_time); ?></div>
    </section>

    <section class="receipt-grid">
      <div class="receipt-field"><strong>Student</strong><span><?php echo html_escape($student['name'] ?? ''); ?></span></div>
      <div class="receipt-field"><strong>Student code</strong><span><?php echo html_escape($student['student_code'] ?? ''); ?></span></div>
      <div class="receipt-field"><strong>Class</strong><span><?php echo html_escape($student['class_name'] ?? ''); ?></span></div>
      <div class="receipt-field"><strong>Payment method</strong><span><?php echo html_escape($method_map[(int)($transaction['payment_method'] ?? 0)] ?? 'Other'); ?></span></div>
      <div class="receipt-field"><strong>Payment type</strong><span><?php echo html_escape(ucfirst($transaction['payment_type'] ?? 'mixed')); ?></span></div>
      <div class="receipt-field"><strong>Transaction code</strong><span><?php echo html_escape($transaction['transaction_code'] ?? ''); ?></span></div>
    </section>

    <table class="receipt-table">
      <thead><tr><th>Fee item</th><th>Amount</th></tr></thead>
      <tbody>
      <?php foreach (['feeding'=>'Feeding','breakfast'=>'Breakfast','classes'=>'Classes','water'=>'Water','transport'=>'Transport'] as $key=>$label): $amount=(float)($transaction[$key.'_amount'] ?? 0); if($amount<=0) continue; ?>
        <tr><td><?php echo html_escape($label); ?></td><td><?php echo $money($amount); ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>

    <div class="receipt-total"><span>Total paid</span><span><?php echo $money($transaction['total_amount'] ?? 0); ?></span></div>
    <?php if (!empty($transaction['notes'])): ?><div class="receipt-note"><strong>Note:</strong> <?php echo nl2br(html_escape($transaction['notes'])); ?></div><?php endif; ?>

    <footer class="receipt-footer">
      <p>This is a computer-generated receipt and is valid without a handwritten signature.<br>Keep this receipt for payment verification and school records.</p>
      <div class="cashier-block">Received by<strong><?php echo html_escape($cashier['name'] ?? $cashier['email'] ?? 'Cashier'); ?></strong></div>
    </footer>

    <div class="receipt-actions"><button type="button" onclick="window.print()">Print receipt</button><a href="<?php echo site_url('cashier/daily_fee_collection'); ?>">Collect another payment</a></div>
  </article>
</div>
</body>
</html>
