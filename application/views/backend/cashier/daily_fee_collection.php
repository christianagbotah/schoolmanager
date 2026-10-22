<?php
$csrf_name = $this->security->get_csrf_token_name();
$csrf_hash = $this->security->get_csrf_hash();
?>
<style>
.cashier-pos{max-width:1280px;margin:0 auto;padding:6px 0 110px}.pos-hero{background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;border-radius:18px;padding:24px;margin-bottom:18px;box-shadow:0 14px 36px rgba(15,23,42,.14)}.pos-hero h2{margin:0 0 5px;font-size:26px;font-weight:800}.pos-hero p{margin:0;opacity:.84}.pos-search{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;margin-bottom:16px}.pos-search-row{display:flex;gap:10px}.pos-search input{flex:1;height:44px;border:1px solid #cbd5e1;border-radius:10px;padding:0 13px;font-size:14px}.pos-search button,.pos-btn{border:0;border-radius:10px;padding:0 17px;height:44px;font-weight:800}.pos-search button{background:#2563eb;color:#fff}.search-results{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.student-result{border:1px solid #e2e8f0;border-radius:11px;padding:12px;background:#f8fafc;cursor:pointer;text-align:left}.student-result:hover{border-color:#93c5fd;background:#eff6ff}.student-result strong{display:block;color:#0f172a}.student-result span{display:block;color:#64748b;font-size:12px;margin-top:3px}.pos-layout{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.75fr);gap:16px}.pos-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px;box-shadow:0 5px 18px rgba(15,23,42,.04)}.student-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:15px}.student-head h3{margin:0;font-size:20px;font-weight:800;color:#0f172a}.student-head p{margin:4px 0 0;color:#64748b}.student-code{background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800}.preference-row{display:flex;gap:7px;flex-wrap:wrap;margin:-4px 0 14px}.preference-chip{border-radius:999px;padding:6px 9px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:11px;font-weight:800}.preference-chip.on{background:#ecfdf5;border-color:#a7f3d0;color:#047857}.money-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:16px}.money-box{border-radius:12px;padding:13px;background:#f8fafc;border:1px solid #e2e8f0}.money-box span{display:block;color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase}.money-box strong{display:block;margin-top:5px;font-size:20px;color:#0f172a}.money-box.arrears strong{color:#b91c1c}.money-box.net strong{color:#1d4ed8}.quick-payment{border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:15px;margin-bottom:16px}.quick-payment h4{margin:0 0 4px;color:#1e3a8a;font-size:15px;font-weight:900}.quick-payment p{margin:0 0 12px;color:#475569;font-size:12px}.quick-payment-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(180px,.9fr) auto;gap:9px;align-items:end}.quick-payment label{display:block;color:#475569;font-size:11px;font-weight:900;margin-bottom:5px}.quick-payment input,.quick-payment select{width:100%;height:42px;border:1px solid #93c5fd;border-radius:9px;padding:0 10px;background:#fff}.quick-payment button{height:42px;border:0;border-radius:9px;padding:0 15px;background:#2563eb;color:#fff;font-weight:900}.allocation-preview{margin-top:10px;padding:9px 10px;border-radius:9px;background:#fff;color:#334155;font-size:12px;border:1px solid #dbeafe}.allocation-preview strong{color:#0f172a}.advanced-allocation{border:1px solid #e2e8f0;border-radius:12px;margin-top:2px}.advanced-allocation summary{cursor:pointer;padding:12px 14px;font-weight:900;color:#334155;list-style:none}.advanced-allocation summary::-webkit-details-marker{display:none}.advanced-allocation summary:after{content:'+';float:right;color:#64748b}.advanced-allocation[open] summary:after{content:'−'}.advanced-body{padding:0 12px 12px}.fee-table{width:100%;border-collapse:collapse}.fee-table th,.fee-table td{padding:10px 8px;border-bottom:1px solid #e2e8f0}.fee-table th{font-size:11px;text-transform:uppercase;color:#64748b;text-align:left}.fee-table th:nth-child(n+2),.fee-table td:nth-child(n+2){text-align:right}.fee-label{font-weight:800;color:#0f172a}.fee-input{width:112px;height:38px;border:1px solid #cbd5e1;border-radius:8px;padding:0 9px;text-align:right}.quick-actions{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}.pos-btn{height:38px;padding:0 13px;background:#e2e8f0;color:#0f172a}.pos-btn.primary{background:#2563eb;color:#fff}.pos-form label{display:block;color:#475569;font-size:12px;font-weight:800;margin:0 0 6px}.pos-form select,.pos-form textarea{width:100%;border:1px solid #cbd5e1;border-radius:9px;padding:9px 10px}.pos-form select{height:42px}.pos-form textarea{min-height:78px;resize:vertical}.field{margin-bottom:13px}.total-panel{background:#0f172a;color:#fff;border-radius:14px;padding:16px;margin-bottom:14px}.total-panel span{display:block;font-size:12px;opacity:.72;text-transform:uppercase;font-weight:800}.total-panel strong{display:block;font-size:31px;margin-top:3px}.collect-btn{width:100%;height:46px;border:0;border-radius:10px;background:#059669;color:#fff;font-weight:900;font-size:15px}.collect-btn:disabled{opacity:.55;cursor:not-allowed}.receipt-success{display:none;margin-top:13px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:11px;padding:13px;color:#166534}.receipt-success a{display:inline-block;margin-top:8px;font-weight:900;color:#166534}.empty-state{padding:36px 18px;text-align:center;color:#64748b}.empty-state i{font-size:30px;color:#94a3b8}.empty-state strong{display:block;color:#334155;margin-top:8px}.pos-sticky-total{display:none}.loading-note{padding:10px;color:#64748b;font-size:13px}.error-note{padding:10px;color:#b91c1c;font-size:13px}.recent-title{font-size:13px;font-weight:900;color:#334155;margin:18px 0 8px}.recent-list{display:grid;gap:7px}.recent-item{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #e2e8f0;font-size:12px}.recent-item strong{color:#0f172a}
@media(max-width:900px){.pos-layout{grid-template-columns:1fr}.search-results{grid-template-columns:1fr}.pos-side{order:-1}.quick-payment-grid{grid-template-columns:1fr 1fr}.quick-payment button{grid-column:1/-1}}
@media(max-width:767px){.cashier-pos{padding-bottom:95px}.pos-hero{padding:18px}.pos-hero h2{font-size:22px}.pos-search-row{display:block}.pos-search input,.pos-search button{width:100%}.pos-search button{margin-top:8px}.money-summary{grid-template-columns:1fr 1fr}.money-box.net{grid-column:1/-1}.pos-card{padding:14px}.quick-payment-grid{grid-template-columns:1fr}.quick-payment button{grid-column:auto}.fee-table th:nth-child(2),.fee-table td:nth-child(2){display:none}.fee-input{width:94px}.pos-sticky-total{display:flex;position:sticky;bottom:0;z-index:20;align-items:center;justify-content:space-between;gap:12px;background:#0f172a;color:#fff;padding:12px 14px;border-radius:14px 14px 0 0;box-shadow:0 -8px 26px rgba(15,23,42,.2)}.pos-sticky-total strong{font-size:20px}.pos-sticky-total button{border:0;border-radius:9px;background:#059669;color:#fff;padding:10px 14px;font-weight:900}}
</style>

<div class="cashier-pos">
  <div class="pos-hero">
    <h2><i class="fa fa-cash-register"></i> Daily Fee Collection</h2>
    <p>Search a student, enter one amount and let iEduPro allocate it safely across daily-fee arrears.</p>
  </div>

  <div class="pos-search">
    <form id="studentSearchForm" class="pos-search-row">
      <input id="studentSearch" autocomplete="off" placeholder="Search by student name or code" aria-label="Search student">
      <button type="submit"><i class="fa fa-search"></i> Find student</button>
    </form>
    <div id="searchResults" class="search-results"></div>
  </div>

  <div id="emptyState" class="pos-card empty-state"><i class="fa fa-user-graduate"></i><strong>Select a student to begin</strong><div>The student’s prepaid balances, arrears, service preferences and recent payments will appear here.</div></div>

  <div id="workspace" class="pos-layout" style="display:none">
    <div class="pos-card">
      <div class="student-head"><div><h3 id="studentName"></h3><p id="studentClass"></p></div><span id="studentCode" class="student-code"></span></div>
      <div class="preference-row"><span id="breakfastPreference" class="preference-chip">Breakfast preference loading…</span><span id="waterPreference" class="preference-chip">Water preference loading…</span></div>
      <div class="money-summary">
        <div class="money-box"><span>Prepaid balance</span><strong id="total_balance">₵0.00</strong></div>
        <div class="money-box arrears"><span>Total arrears</span><strong id="total_arrears">₵0.00</strong></div>
        <div class="money-box net"><span>Net position</span><strong id="netPosition">₵0.00</strong></div>
      </div>

      <div class="quick-payment">
        <h4><i class="fa fa-bolt"></i> Quick payment</h4>
        <p>Enter the amount received once. Smart allocation applies it to arrears first in the order Feeding → Classes → Breakfast → Water → Transport. Any excess becomes prepaid credit in the fee wallet you choose.</p>
        <div class="quick-payment-grid">
          <div><label for="quickPaymentAmount">Amount received</label><input id="quickPaymentAmount" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00"></div>
          <div><label for="excessCreditType">Excess prepaid credit to</label><select id="excessCreditType"><option value="feeding">Feeding</option><option value="classes">Classes</option><option value="breakfast">Breakfast</option><option value="water">Water</option><option value="transport">Transport</option></select></div>
          <button id="smartAllocate" type="button"><i class="fa fa-magic"></i> Smart allocate</button>
        </div>
        <div id="allocationPreview" class="allocation-preview">Enter an amount to preview the allocation. Arrears are settled first; excess is kept as prepaid credit.</div>
      </div>

      <details class="advanced-allocation">
        <summary>Advanced allocation</summary>
        <div class="advanced-body">
          <table class="fee-table">
            <thead><tr><th>Fee item</th><th>Prepaid</th><th>Arrears</th><th>Collect now</th></tr></thead>
            <tbody>
              <tr><td class="fee-label">Feeding</td><td id="feeding_balance">₵0.00</td><td id="feeding_arrears">₵0.00</td><td><input class="fee-input payment-amount" type="number" min="0" step="0.01" name="feeding_amount" form="paymentForm" value="0.00"></td></tr>
              <tr><td class="fee-label">Breakfast</td><td id="breakfast_balance">₵0.00</td><td id="breakfast_arrears">₵0.00</td><td><input class="fee-input payment-amount" type="number" min="0" step="0.01" name="breakfast_amount" form="paymentForm" value="0.00"></td></tr>
              <tr><td class="fee-label">Classes</td><td id="classes_balance">₵0.00</td><td id="classes_arrears">₵0.00</td><td><input class="fee-input payment-amount" type="number" min="0" step="0.01" name="classes_amount" form="paymentForm" value="0.00"></td></tr>
              <tr><td class="fee-label">Water</td><td id="water_balance">₵0.00</td><td id="water_arrears">₵0.00</td><td><input class="fee-input payment-amount" type="number" min="0" step="0.01" name="water_amount" form="paymentForm" value="0.00"></td></tr>
              <tr><td class="fee-label">Transport</td><td id="transport_balance">₵0.00</td><td id="transport_arrears">₵0.00</td><td><input class="fee-input payment-amount" type="number" min="0" step="0.01" name="transport_amount" form="paymentForm" value="0.00"></td></tr>
            </tbody>
          </table>
        </div>
      </details>
      <div class="quick-actions"><button type="button" id="settleArrears" class="pos-btn primary"><i class="fa fa-bolt"></i> Settle all arrears</button><button type="button" id="clearAmounts" class="pos-btn">Clear amounts</button></div>
      <div class="recent-title">Recent payments</div><div id="recentPayments" class="recent-list"><div class="loading-note">No student selected.</div></div>
    </div>

    <div class="pos-card pos-side">
      <form id="paymentForm" class="pos-form">
        <input type="hidden" name="student_id" id="paymentStudentId">
        <input type="hidden" name="breakfast_opted" id="breakfastOpted" value="0">
        <input type="hidden" name="water_opted" id="waterOpted" value="0">
        <input type="hidden" name="<?php echo html_escape($csrf_name); ?>" value="<?php echo html_escape($csrf_hash); ?>">
        <div class="total-panel"><span>Payment total</span><strong id="paymentTotal">₵0.00</strong></div>
        <div class="field"><label>Payment type</label><select name="payment_type"><option value="mixed">Smart / mixed allocation</option><option value="arrears">Arrears payment</option><option value="current">Current fees</option><option value="advance">Advance / prepaid</option></select></div>
        <div class="field"><label>Payment method</label><select name="payment_method"><option value="1">Cash</option><option value="3">Mobile Money</option><option value="4">Bank transfer</option><option value="2">Cheque</option></select></div>
        <div class="field"><label>Notes (optional)</label><textarea name="notes" placeholder="Reference, payer or collection note"></textarea></div>
        <button id="collectPayment" class="collect-btn" type="submit" disabled><i class="fa fa-check-circle"></i> Collect payment</button>
        <div id="receiptSuccess" class="receipt-success"></div>
      </form>
    </div>
  </div>

  <div id="mobileTotal" class="pos-sticky-total"><div><small>Payment total</small><strong id="mobilePaymentTotal">₵0.00</strong></div><button type="button" onclick="$('#paymentForm').trigger('submit')">Collect</button></div>
</div>

<script>
(function($){
  var csrfName = <?php echo json_encode($csrf_name); ?>;
  var csrfHash = <?php echo json_encode($csrf_hash); ?>;
  var selectedWallet = {};
  var selectedStudentId = null;
  var preferencesLoaded = false;
  var feeTypes = ['feeding','breakfast','classes','water','transport'];
  var feePriority = ['feeding','classes','breakfast','water','transport'];
  var feeLabels = {feeding:'Feeding',classes:'Classes',breakfast:'Breakfast',water:'Water',transport:'Transport'};

  function money(value){ return '₵' + (parseFloat(value || 0)).toFixed(2); }
  function escapeHtml(value){ return $('<div>').text(value == null ? '' : String(value)).html(); }
  function withCsrf(data){ data = data || {}; data[csrfName] = csrfHash; return data; }
  function amountInput(type){ return $('.payment-amount[name="' + type + '_amount"]'); }

  function recalc(){
    var total = 0;
    $('.payment-amount').each(function(){ total += Math.max(0, parseFloat($(this).val()) || 0); });
    $('#paymentTotal,#mobilePaymentTotal').text(money(total));
    return total;
  }

  function renderSearch(students){
    var box = $('#searchResults').empty();
    if(!students || !students.length){ box.html('<div class="loading-note">No matching students found.</div>'); return; }
    students.forEach(function(student){
      var button = $('<button type="button" class="student-result">').attr('data-id', student.student_id);
      button.html('<strong>' + escapeHtml(student.name) + '</strong><span>' + escapeHtml(student.student_code) + ' · ' + escapeHtml(student.class_name) + ' · Arrears ' + money(student.total_arrears) + '</span>');
      box.append(button);
    });
  }

  function searchStudents(){
    var term = $.trim($('#studentSearch').val());
    if(term.length < 2){ $('#searchResults').html('<div class="loading-note">Enter at least two characters.</div>'); return; }
    $('#searchResults').html('<div class="loading-note"><i class="fa fa-spinner fa-spin"></i> Searching…</div>');
    $.ajax({url:'<?php echo site_url('cashier/search_student_for_daily_fees'); ?>',type:'POST',dataType:'json',data:withCsrf({search_term:term})})
      .done(function(res){ if(res.status === 'success') renderSearch(res.students); else $('#searchResults').html('<div class="error-note">Unable to search students.</div>'); })
      .fail(function(){ $('#searchResults').html('<div class="error-note">Student search failed. Please retry.</div>'); });
  }

  function renderRecent(history){
    var box = $('#recentPayments').empty();
    if(!history || !history.length){ box.html('<div class="loading-note">No recent daily-fee payments.</div>'); return; }
    history.slice(0,5).forEach(function(row){
      var when = row.payment_date ? new Date(parseInt(row.payment_date,10)*1000).toLocaleDateString() : '';
      box.append('<div class="recent-item"><span>' + escapeHtml(when) + ' · ' + escapeHtml(row.receipt_number || row.transaction_code || '') + '</span><strong>' + money(row.total_amount) + '</strong></div>');
    });
  }

  function renderPreferences(preferences){
    preferences = preferences || {};
    var breakfastOn = parseInt(preferences.breakfast_subscribed,10) === 1;
    var waterOn = parseInt(preferences.water_subscribed,10) === 1;
    $('#breakfastOpted').val(breakfastOn ? '1' : '0');
    $('#waterOpted').val(waterOn ? '1' : '0');
    $('#breakfastPreference').toggleClass('on', breakfastOn).text('Breakfast: ' + (breakfastOn ? 'Subscribed' : 'Not subscribed'));
    $('#waterPreference').toggleClass('on', waterOn).text('Water: ' + (waterOn ? 'Subscribed' : 'Not subscribed'));
    preferencesLoaded = true;
    $('#collectPayment').prop('disabled', false);
  }

  function loadPreferences(studentId){
    preferencesLoaded = false;
    $('#collectPayment').prop('disabled', true);
    return $.ajax({url:'<?php echo site_url('cashier_preferences/student'); ?>',type:'POST',dataType:'json',data:withCsrf({student_id:studentId})})
      .done(function(prefRes){
        if(prefRes.status === 'success' && prefRes.preferences){ renderPreferences(prefRes.preferences); }
        else { $('#breakfastPreference,#waterPreference').text('Preference status unavailable'); }
      })
      .fail(function(){ $('#breakfastPreference,#waterPreference').text('Preference status unavailable'); });
  }

  function loadStudent(studentId, preserveReceipt){
    selectedStudentId = studentId;
    preferencesLoaded = false;
    $('#collectPayment').prop('disabled', true);
    $('#searchResults').html('<div class="loading-note"><i class="fa fa-spinner fa-spin"></i> Loading wallet…</div>');
    $.ajax({url:'<?php echo site_url('cashier/get_student_wallet_details'); ?>',type:'POST',dataType:'json',data:withCsrf({student_id:studentId})})
      .done(function(res){
        if(res.status !== 'success' || !res.student){ $('#searchResults').html('<div class="error-note">Student details could not be loaded.</div>'); return; }
        selectedWallet = res.wallet || {};
        $('#studentName').text(res.student.name || 'Student');
        $('#studentCode').text(res.student.student_code || '');
        $('#studentClass').text((res.student.class_name || '') + (res.student.section_name ? ' · ' + res.student.section_name : ''));
        $('#paymentStudentId').val(studentId);
        $('#total_balance').text(money(res.total_balance));
        $('#total_arrears').text(money(res.total_arrears));
        $('#netPosition').text(money(res.net_position));
        feeTypes.forEach(function(type){ $('#' + type + '_balance').text(money(selectedWallet[type + '_balance'])); $('#' + type + '_arrears').text(money(selectedWallet[type + '_arrears'])); amountInput(type).val('0.00'); });
        $('#quickPaymentAmount').val('');
        $('#allocationPreview').text('Enter an amount to preview the allocation. Arrears are settled first; excess is kept as prepaid credit.');
        renderRecent(res.payment_history || []);
        $('#emptyState').hide(); $('#workspace').show(); $('#searchResults').empty();
        if(!preserveReceipt){ $('#receiptSuccess').hide().empty(); }
        recalc();
        loadPreferences(studentId);
      })
      .fail(function(){ $('#searchResults').html('<div class="error-note">Wallet details failed to load.</div>'); });
  }

  function allocateSmartPayment(){
    if(!selectedStudentId){ return 0; }
    var remaining = Math.max(0, parseFloat($('#quickPaymentAmount').val()) || 0);
    var received = remaining;
    var allocations = {};
    var preview = [];
    feeTypes.forEach(function(type){ allocations[type] = 0; amountInput(type).val('0.00'); });

    if(received <= 0){
      $('#allocationPreview').text('Enter an amount greater than zero. Arrears are settled first; excess is kept as prepaid credit.');
      recalc();
      return 0;
    }

    feePriority.forEach(function(type){
      if(remaining <= 0){ return; }
      var arrears = Math.max(0, parseFloat(selectedWallet[type + '_arrears']) || 0);
      var allocated = Math.min(remaining, arrears);
      if(allocated > 0){
        allocations[type] += allocated;
        remaining -= allocated;
        preview.push(feeLabels[type] + ' arrears ' + money(allocated));
      }
    });

    if(remaining > 0){
      var creditType = $('#excessCreditType').val() || 'feeding';
      allocations[creditType] += remaining;
      preview.push(feeLabels[creditType] + ' prepaid ' + money(remaining));
      remaining = 0;
    }

    feeTypes.forEach(function(type){ amountInput(type).val(allocations[type].toFixed(2)); });
    $('select[name="payment_type"]').val('mixed');
    $('#allocationPreview').html('<strong>Smart allocation:</strong> ' + escapeHtml(preview.length ? preview.join(' · ') : 'No arrears; amount placed in selected prepaid wallet.') + '<br>Arrears first, then excess prepaid credit.');
    return recalc();
  }

  $('#studentSearchForm').on('submit',function(e){ e.preventDefault(); searchStudents(); });
  $('#searchResults').on('click','.student-result',function(){ loadStudent($(this).data('id')); });
  $('#smartAllocate').on('click',allocateSmartPayment);
  $('#quickPaymentAmount').on('keydown',function(e){ if(e.key === 'Enter'){ e.preventDefault(); allocateSmartPayment(); } });
  $('#excessCreditType').on('change',function(){ if((parseFloat($('#quickPaymentAmount').val()) || 0) > 0){ allocateSmartPayment(); } });
  $(document).on('input','.payment-amount',function(){
    $('#quickPaymentAmount').val('');
    $('#allocationPreview').text('Manual allocation active. Advanced allocation values will be collected exactly as entered.');
    recalc();
  });
  $('#clearAmounts').on('click',function(){ $('.payment-amount').val('0.00'); $('#quickPaymentAmount').val(''); $('#allocationPreview').text('Enter an amount to preview the allocation. Arrears are settled first; excess is kept as prepaid credit.'); recalc(); });
  $('#settleArrears').on('click',function(){ $('#quickPaymentAmount').val((feePriority.reduce(function(total,type){ return total + Math.max(0,parseFloat(selectedWallet[type + '_arrears']) || 0); },0)).toFixed(2)); allocateSmartPayment(); });

  $('#paymentForm').on('submit',function(e){
    e.preventDefault();
    if(!selectedStudentId){ return; }
    if(!preferencesLoaded){ showAjaxModal_alert('Student fee preferences are still loading. Please retry.', 'error'); return; }
    if((parseFloat($('#quickPaymentAmount').val()) || 0) > 0){ allocateSmartPayment(); }
    var total = recalc();
    if(total <= 0){ showAjaxModal_alert('Enter a payment amount or use Advanced allocation.', 'error'); return; }
    var button = $('#collectPayment').prop('disabled',true).html('<i class="fa fa-spinner fa-spin"></i> Processing…');
    $.ajax({url:'<?php echo site_url('cashier/process_daily_fee_payment'); ?>',type:'POST',dataType:'json',data:$(this).serialize()})
      .done(function(res){
        if(res.status === 'success'){
          var receiptUrl = '<?php echo site_url('cashier/print_daily_fee_receipt/'); ?>' + encodeURIComponent(res.transaction_code);
          $('#receiptSuccess').html('<strong>Payment recorded successfully.</strong><br>Receipt: ' + escapeHtml(res.receipt_number || '') + '<br><a target="_blank" href="' + receiptUrl + '"><i class="fa fa-print"></i> Print receipt</a>').show();
          showAjaxModal_alert(res.message || 'Payment processed successfully.', 'success');
          loadStudent(selectedStudentId, true);
        } else { showAjaxModal_alert(res.message || 'Payment could not be processed.', 'error'); }
      })
      .fail(function(){ showAjaxModal_alert('Payment request failed. Please retry.', 'error'); })
      .always(function(){ if(preferencesLoaded){ button.prop('disabled',false); } button.html('<i class="fa fa-check-circle"></i> Collect payment'); });
  });
})(jQuery);
</script>