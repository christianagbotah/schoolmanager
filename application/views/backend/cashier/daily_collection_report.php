<?php $money = function($value) { return '₵' . number_format((float)$value, 2); }; ?>
<style>
.cashier-report{max-width:1250px;margin:0 auto;padding:8px 0 32px}.report-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:18px}.report-head h2{margin:0;font-size:25px;font-weight:800;color:#0f172a}.report-head p{margin:5px 0 0;color:#64748b}.report-filter{display:flex;gap:8px}.report-filter input,.report-filter button{height:40px;border-radius:8px}.report-filter input{border:1px solid #cbd5e1;padding:0 10px}.report-filter button{border:0;background:#2563eb;color:#fff;padding:0 16px;font-weight:700}.report-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.report-stat{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px}.report-stat span{display:block;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase}.report-stat strong{display:block;margin-top:6px;font-size:23px;color:#0f172a}.report-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:auto}.report-table{width:100%;border-collapse:collapse;min-width:820px}.report-table th,.report-table td{padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:left}.report-table th{background:#f8fafc;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.03em}.report-table td.amount{text-align:right;font-weight:700}.report-table a{font-weight:700}.empty-report{text-align:center;padding:36px!important;color:#64748b}@media(max-width:767px){.report-head{display:block}.report-filter{margin-top:12px}.report-stats{grid-template-columns:1fr 1fr}.report-stat strong{font-size:19px}} 
</style>
<div class="cashier-report">
  <div class="report-head">
    <div><h2><i class="fa fa-chart-line"></i> Daily collection report</h2><p>Review your cashier collections and receipt trail.</p></div>
    <form class="report-filter" method="get" action="<?php echo site_url('cashier/daily_collection_report'); ?>"><input type="date" name="date" value="<?php echo html_escape($date); ?>"><button type="submit">View day</button></form>
  </div>
  <div class="report-stats">
    <div class="report-stat"><span>Total collected</span><strong><?php echo $money($totals['total'] ?? 0); ?></strong></div>
    <div class="report-stat"><span>Transactions</span><strong><?php echo (int)($totals['count'] ?? 0); ?></strong></div>
    <div class="report-stat"><span>Feeding + classes</span><strong><?php echo $money(($totals['feeding'] ?? 0)+($totals['classes'] ?? 0)); ?></strong></div>
    <div class="report-stat"><span>Other daily fees</span><strong><?php echo $money(($totals['breakfast'] ?? 0)+($totals['water'] ?? 0)+($totals['transport'] ?? 0)); ?></strong></div>
  </div>
  <div class="report-table-wrap"><table class="report-table"><thead><tr><th>Time</th><th>Student</th><th>Code</th><th>Payment type</th><th>Receipt</th><th style="text-align:right">Amount</th></tr></thead><tbody>
    <?php if(empty($collections)): ?><tr><td colspan="6" class="empty-report">No collections recorded for this date.</td></tr><?php else: foreach($collections as $row): ?>
      <tr><td><?php echo date('h:i A',(int)($row['created_at'] ?? $row['payment_date'])); ?></td><td><?php echo html_escape($row['student_name'] ?? ''); ?></td><td><?php echo html_escape($row['student_code'] ?? ''); ?></td><td><?php echo html_escape(ucfirst($row['payment_type'] ?? 'mixed')); ?></td><td><?php if(!empty($row['transaction_code'])): ?><a target="_blank" href="<?php echo site_url('cashier/print_daily_fee_receipt/'.$row['transaction_code']); ?>"><?php echo html_escape($row['receipt_number'] ?? $row['transaction_code']); ?></a><?php endif; ?></td><td class="amount"><?php echo $money($row['total_amount'] ?? 0); ?></td></tr>
    <?php endforeach; endif; ?>
  </tbody></table></div>
</div>
