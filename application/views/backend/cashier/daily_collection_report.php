<?php
$money = function($value) { return '₵' . number_format((float)$value, 2); };
$method_map = [1 => 'Cash', 2 => 'Cheque', 3 => 'Mobile Money', 4 => 'Bank Transfer'];
?>
<style>
.cashier-report{max-width:1250px;margin:0 auto;padding:8px 0 32px}.report-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:18px}.report-head h2{margin:0;font-size:25px;font-weight:800;color:#0f172a}.report-head p{margin:5px 0 0;color:#64748b}.report-filter{display:flex;gap:8px}.report-filter input,.report-filter button{height:40px;border-radius:8px}.report-filter input{border:1px solid #cbd5e1;padding:0 10px}.report-filter button{border:0;background:#2563eb;color:#fff;padding:0 16px;font-weight:700}.report-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:18px}.report-stat{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px}.report-stat span{display:block;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase}.report-stat strong{display:block;margin-top:6px;font-size:23px;color:#0f172a}.tender-section{margin:4px 0 18px}.tender-head{display:flex;justify-content:space-between;gap:12px;align-items:end;margin-bottom:10px}.tender-head h3{margin:0;color:#0f172a;font-size:16px;font-weight:800}.tender-head p{margin:0;color:#64748b;font-size:12px}.tender-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.tender-stat{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:13px}.tender-stat span{color:#64748b;font-size:12px;font-weight:700}.tender-stat strong{color:#0f172a;font-size:17px}.cash-closeout{margin:4px 0 18px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px;box-shadow:0 4px 14px rgba(15,23,42,.04)}.cash-closeout-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:13px}.cash-closeout-head h3{margin:0;color:#0f172a;font-size:16px;font-weight:800}.cash-closeout-head p{margin:4px 0 0;color:#64748b;font-size:12px}.cash-closeout-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 9px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:11px;font-weight:800;white-space:nowrap}.cash-closeout-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;align-items:stretch}.cash-closeout-field{border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;padding:13px}.cash-closeout-field label,.cash-closeout-field span{display:block;color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.03em}.cash-closeout-field strong{display:block;margin-top:7px;color:#0f172a;font-size:20px}.cash-closeout-field input{width:100%;height:42px;margin-top:7px;border:1px solid #cbd5e1;border-radius:9px;padding:0 10px;background:#fff;color:#0f172a;font-size:16px;font-weight:800;box-sizing:border-box}.cash-closeout-field input:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.cash-closeout-field.variance{background:#eff6ff;border-color:#bfdbfe}.cash-closeout-field.variance strong{color:#1d4ed8}.cash-closeout-field.variance.is-balanced{background:#ecfdf5;border-color:#a7f3d0}.cash-closeout-field.variance.is-balanced strong{color:#047857}.cash-closeout-field.variance.is-over{background:#fffbeb;border-color:#fde68a}.cash-closeout-field.variance.is-over strong{color:#b45309}.cash-closeout-field.variance.is-short{background:#fef2f2;border-color:#fecaca}.cash-closeout-field.variance.is-short strong{color:#b91c1c}.cash-variance-status{margin:10px 0 0;color:#475569;font-size:12px;font-weight:700}.cash-closeout-note{margin:5px 0 0;color:#64748b;font-size:11px}.report-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:auto}.report-table{width:100%;border-collapse:collapse;min-width:920px}.report-table th,.report-table td{padding:12px 14px;border-bottom:1px solid #e2e8f0;text-align:left}.report-table th{background:#f8fafc;color:#475569;font-size:12px;text-transform:uppercase;letter-spacing:.03em}.report-table td.amount{text-align:right;font-weight:700}.report-table a{font-weight:700}.payment-method{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;background:#f1f5f9;color:#334155;font-size:11px;font-weight:800;white-space:nowrap}.empty-report{text-align:center;padding:36px!important;color:#64748b}@media(max-width:767px){.report-head{display:block}.report-filter{margin-top:12px}.report-stats,.tender-grid{grid-template-columns:1fr 1fr}.report-stat strong{font-size:19px}.tender-head,.cash-closeout-head{display:block}.tender-head p,.cash-closeout-head p{margin-top:4px}.cash-closeout-badge{margin-top:9px}.cash-closeout-grid{grid-template-columns:1fr}.cash-closeout{padding:14px}}@media(max-width:420px){.report-stats,.tender-grid{grid-template-columns:1fr}}
</style>
<style>
.report-tools{display:flex;align-items:flex-end;gap:8px}.report-actions{display:flex;gap:7px}.report-action{display:inline-flex;align-items:center;justify-content:center;height:40px;border:0;border-radius:8px;padding:0 13px;background:#e2e8f0;color:#0f172a;font-weight:800;text-decoration:none;cursor:pointer}.report-action.export{background:#0f766e;color:#fff}@media(max-width:767px){.report-tools{align-items:stretch;flex-direction:column}.report-actions{display:grid;grid-template-columns:1fr 1fr}.report-action{width:100%}}@media print{@page{margin:10mm}.report-tools,.main-menu,.sidebar-menu,.topbar,.navbar,.page-title,.cash-closeout{display:none!important}.cashier-report{max-width:none;padding:0}.report-stats,.tender-grid{grid-template-columns:repeat(4,1fr)!important}.report-table-wrap{overflow:visible;border-color:#cbd5e1}.report-table{min-width:0;font-size:10px}.report-table th,.report-table td{padding:6px}.report-stat,.tender-stat{box-shadow:none;break-inside:avoid}}
</style>
<div class="cashier-report">
  <div class="report-head">
    <div><h2><i class="fa fa-chart-line"></i> Daily collection report</h2><p>Review your cashier collections, tender mix and receipt trail.</p></div>
    <div class="report-tools">
      <form class="report-filter" method="get" action="<?php echo site_url('cashier/daily_collection_report'); ?>"><input type="date" name="date" value="<?php echo html_escape($date); ?>"><button type="submit">View day</button></form>
      <div class="report-actions"><button type="button" class="report-action" onclick="window.print()">Print summary</button><a class="report-action export" href="<?php echo site_url('cashier/export_daily_collection_csv') . '?date=' . rawurlencode($date); ?>">Export CSV</a></div>
    </div>
  </div>
  <div class="report-stats">
    <div class="report-stat"><span>Total collected</span><strong><?php echo $money($totals['total'] ?? 0); ?></strong></div>
    <div class="report-stat"><span>Transactions</span><strong><?php echo (int)($totals['count'] ?? 0); ?></strong></div>
    <div class="report-stat"><span>Feeding + classes</span><strong><?php echo $money(($totals['feeding'] ?? 0)+($totals['classes'] ?? 0)); ?></strong></div>
    <div class="report-stat"><span>Other daily fees</span><strong><?php echo $money(($totals['breakfast'] ?? 0)+($totals['water'] ?? 0)+($totals['transport'] ?? 0)); ?></strong></div>
  </div>
  <section class="tender-section" aria-labelledby="tender-reconciliation-title">
    <div class="tender-head"><div><h3 id="tender-reconciliation-title">Tender reconciliation</h3><p>Match the day’s system collections against cash, MoMo and banking records before close.</p></div></div>
    <div class="tender-grid">
      <div class="tender-stat"><span><i class="fa fa-money-bill-wave"></i> Cash</span><strong><?php echo $money($totals['cash'] ?? 0); ?></strong></div>
      <div class="tender-stat"><span><i class="fa fa-mobile-alt"></i> Mobile Money</span><strong><?php echo $money($totals['mobile_money'] ?? 0); ?></strong></div>
      <div class="tender-stat"><span><i class="fa fa-university"></i> Bank transfer</span><strong><?php echo $money($totals['bank_transfer'] ?? 0); ?></strong></div>
      <div class="tender-stat"><span><i class="fa fa-file-invoice-dollar"></i> Cheque</span><strong><?php echo $money($totals['cheque'] ?? 0); ?></strong></div>
    </div>
  </section>
  <section id="cashCloseout" class="cash-closeout" aria-labelledby="cash-closeout-title" data-system-cash="<?php echo html_escape(number_format((float)($totals['cash'] ?? 0), 2, '.', '')); ?>">
    <div class="cash-closeout-head">
      <div><h3 id="cash-closeout-title"><i class="fa fa-cash-register"></i> Cash drawer closeout</h3><p>Count the physical cash in the drawer and compare it with the system cash total for this day.</p></div>
      <span class="cash-closeout-badge"><i class="fa fa-calculator"></i> Display-only helper</span>
    </div>
    <div class="cash-closeout-grid">
      <div class="cash-closeout-field"><span>System cash</span><strong id="systemCash"><?php echo $money($totals['cash'] ?? 0); ?></strong></div>
      <div class="cash-closeout-field"><label for="countedCash">Counted drawer cash</label><input id="countedCash" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" autocomplete="off"></div>
      <div id="cashVarianceCard" class="cash-closeout-field variance"><span>Over / short</span><strong id="cashVariance">₵0.00</strong></div>
    </div>
    <p id="cashVarianceStatus" class="cash-variance-status" aria-live="polite">Enter counted drawer cash to reconcile this day.</p>
    <p class="cash-closeout-note">Variance = counted cash minus system cash. This helper does not post, save or alter the ledger.</p>
  </section>
  <div class="report-table-wrap"><table class="report-table"><thead><tr><th>Time</th><th>Student</th><th>Code</th><th>Payment type</th><th>Method</th><th>Receipt</th><th style="text-align:right">Amount</th></tr></thead><tbody>
    <?php if(empty($collections)): ?><tr><td colspan="7" class="empty-report">No collections recorded for this date.</td></tr><?php else: foreach($collections as $row): ?>
      <tr><td><?php echo date('h:i A',(int)($row['created_at'] ?? $row['payment_date'])); ?></td><td><?php echo html_escape($row['student_name'] ?? ''); ?></td><td><?php echo html_escape($row['student_code'] ?? ''); ?></td><td><?php echo html_escape(ucfirst($row['payment_type'] ?? 'mixed')); ?></td><td><span class="payment-method"><?php echo html_escape($method_map[(int)($row['payment_method'] ?? 0)] ?? 'Other'); ?></span></td><td><?php if(!empty($row['transaction_code'])): ?><a target="_blank" href="<?php echo site_url('cashier/print_daily_fee_receipt/'.$row['transaction_code']); ?>"><?php echo html_escape($row['receipt_number'] ?? $row['transaction_code']); ?></a><?php endif; ?></td><td class="amount"><?php echo $money($row['total_amount'] ?? 0); ?></td></tr>
    <?php endforeach; endif; ?>
  </tbody></table></div>
</div>
<script>
(function () {
  var panel = document.getElementById('cashCloseout');
  var countedInput = document.getElementById('countedCash');
  var varianceValue = document.getElementById('cashVariance');
  var varianceCard = document.getElementById('cashVarianceCard');
  var status = document.getElementById('cashVarianceStatus');
  if (!panel || !countedInput || !varianceValue || !varianceCard || !status) return;

  var expected = parseFloat(panel.getAttribute('data-system-cash')) || 0;

  function formatVariance(value) {
    var sign = value < -0.004 ? '-' : (value > 0.004 ? '+' : '');
    return sign + '₵' + Math.abs(value).toFixed(2);
  }

  function updateCashVariance() {
    varianceCard.classList.remove('is-balanced', 'is-over', 'is-short');
    var raw = countedInput.value.trim();
    if (raw === '') {
      varianceValue.textContent = '₵0.00';
      status.textContent = 'Enter counted drawer cash to reconcile this day.';
      return;
    }

    var counted = parseFloat(raw);
    if (!Number.isFinite(counted) || counted < 0) {
      varianceValue.textContent = '₵0.00';
      status.textContent = 'Enter a valid non-negative counted cash amount.';
      return;
    }

    var difference = counted - expected;
    varianceValue.textContent = formatVariance(difference);

    if (Math.abs(difference) < 0.005) {
      varianceCard.classList.add('is-balanced');
      status.textContent = 'Balanced: counted cash matches system cash.';
    } else if (difference > 0) {
      varianceCard.classList.add('is-over');
      status.textContent = 'Cash is over by ₵' + Math.abs(difference).toFixed(2) + '. Recheck the drawer and receipts before close.';
    } else {
      varianceCard.classList.add('is-short');
      status.textContent = 'Cash is short by ₵' + Math.abs(difference).toFixed(2) + '. Recheck the drawer and receipts before close.';
    }
  }

  countedInput.addEventListener('input', updateCashVariance);
})();
</script>
