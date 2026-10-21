<?php
$money = function($value) { return '₵' . number_format((float)$value, 2); };
$method_map = [1 => 'Cash', 2 => 'Cheque', 3 => 'Mobile Money', 4 => 'Bank Transfer'];
?>
<style>
.receipt-shell{max-width:760px;margin:0 auto;padding:18px}.receipt-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:28px;box-shadow:0 10px 30px rgba(15,23,42,.08)}.receipt-head{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #e2e8f0;padding-bottom:18px;margin-bottom:18px}.receipt-head h2{margin:0 0 5px;font-size:24px}.receipt-muted{color:#64748b}.receipt-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:18px}.receipt-grid strong{display:block;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}.receipt-table{width:100%;border-collapse:collapse;margin:18px 0}.receipt-table th,.receipt-table td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}.receipt-table th:last-child,.receipt-table td:last-child{text-align:right}.receipt-total{display:flex;justify-content:space-between;padding:15px 18px;border-radius:12px;background:#0f172a;color:#fff;font-size:21px;font-weight:800}.receipt-actions{display:flex;gap:10px;margin-top:18px}.receipt-actions button,.receipt-actions a{border:0;border-radius:9px;padding:10px 16px;font-weight:700}.receipt-actions button{background:#2563eb;color:#fff}.receipt-actions a{background:#f1f5f9;color:#0f172a;text-decoration:none}@media(max-width:767px){.receipt-shell{padding:8px}.receipt-card{padding:18px}.receipt-head{display:block}.receipt-grid{grid-template-columns:1fr}.receipt-actions{flex-direction:column}}@media print{.receipt-actions,.main-menu,.page-container .sidebar-menu{display:none!important}.receipt-card{box-shadow:none;border:0}.receipt-shell{max-width:none;padding:0}}
</style>
<div class="receipt-shell">
  <div class="receipt-card">
    <div class="receipt-head">
      <div><h2><?php echo html_escape($school_name); ?></h2><div class="receipt-muted">Daily Fee Receipt</div></div>
      <div><strong><?php echo html_escape($transaction['receipt_number'] ?? $transaction['transaction_code']); ?></strong><div class="receipt-muted"><?php echo date('d M Y, h:i A', (int)($transaction['created_at'] ?? $transaction['payment_date'] ?? time())); ?></div></div>
    </div>
    <div class="receipt-grid">
      <div><strong>Student</strong><?php echo html_escape($student['name'] ?? ''); ?></div>
      <div><strong>Student code</strong><?php echo html_escape($student['student_code'] ?? ''); ?></div>
      <div><strong>Class</strong><?php echo html_escape($student['class_name'] ?? ''); ?></div>
      <div><strong>Payment method</strong><?php echo html_escape($method_map[(int)($transaction['payment_method'] ?? 0)] ?? 'Other'); ?></div>
      <div><strong>Payment type</strong><?php echo html_escape(ucfirst($transaction['payment_type'] ?? 'mixed')); ?></div>
      <div><strong>Cashier</strong><?php echo html_escape($cashier['name'] ?? $cashier['email'] ?? 'Cashier'); ?></div>
    </div>
    <table class="receipt-table">
      <thead><tr><th>Fee item</th><th>Amount</th></tr></thead>
      <tbody>
      <?php foreach (['feeding'=>'Feeding','breakfast'=>'Breakfast','classes'=>'Classes','water'=>'Water','transport'=>'Transport'] as $key=>$label): $amount=(float)($transaction[$key.'_amount'] ?? 0); if($amount<=0) continue; ?>
        <tr><td><?php echo $label; ?></td><td><?php echo $money($amount); ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <div class="receipt-total"><span>Total paid</span><span><?php echo $money($transaction['total_amount'] ?? 0); ?></span></div>
    <div class="receipt-actions"><button type="button" onclick="window.print()"><i class="fa fa-print"></i> Print receipt</button><a href="<?php echo site_url('cashier/daily_fee_collection'); ?>">Collect another payment</a></div>
  </div>
</div>
