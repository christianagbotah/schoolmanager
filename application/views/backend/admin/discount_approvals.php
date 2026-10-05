<?php
$csrf_name = $this->security->get_csrf_token_name();
$csrf_hash = $this->security->get_csrf_hash();
$currency = '₵';
?>
<style>
.discount-approval-workspace{margin:0!important;padding:0 0 32px!important;background:#f8fafc;min-height:100%;color:#334155}
.discount-approval-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e2e8f0}
.discount-approval-eyebrow{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.discount-approval-head h1{margin:0;color:#0f172a;font-size:24px!important;line-height:1.2;font-weight:800;letter-spacing:-.02em}
.discount-approval-head p:last-child{margin:7px 0 0;color:#64748b;font-size:14px;line-height:1.5}
.discount-reconciliation-note{display:none;margin-bottom:16px;padding:12px 14px;border:1px solid #fecaca;border-radius:11px;background:#fef2f2;color:#991b1b;font-size:13px;line-height:1.5;font-weight:700}.discount-reconciliation-note.active{display:block}.discount-risk-note{display:flex;align-items:flex-start;gap:9px;max-width:470px;padding:11px 13px;border:1px solid #fde68a;border-radius:10px;background:#fffbeb;color:#92400e;font-size:13px;line-height:1.45;font-weight:700}
.discount-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}
.discount-stat{min-height:106px;padding:15px 16px;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:13px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}
.discount-stat[data-tone="pending"]{border-left-color:#d97706}.discount-stat[data-tone="approved"]{border-left-color:#059669}.discount-stat[data-tone="rejected"]{border-left-color:#dc2626}
.discount-stat-label{color:#64748b;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.discount-stat-value{margin-top:9px;color:#0f172a;font-size:28px;line-height:1;font-weight:800}.discount-stat-hint{margin-top:7px;color:#64748b;font-size:12px}
.discount-panel{border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05);overflow:hidden}
.discount-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 14px;border-bottom:1px solid #e2e8f0;background:#f8fafc}
.discount-filters{display:flex;gap:7px;flex-wrap:wrap}.discount-filter{min-height:40px;padding:8px 12px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#475569;font-size:13px;font-weight:800;cursor:pointer}.discount-filter.active{border-color:#2563eb;background:#eff6ff;color:#1d4ed8}
.discount-bulk{display:none;align-items:center;gap:8px;padding:11px 14px;border-bottom:1px solid #bfdbfe;background:#eff6ff}.discount-bulk.active{display:flex}.discount-bulk strong{margin-right:auto;color:#1e3a8a;font-size:13px}.discount-bulk .btn{min-height:38px;padding:7px 11px!important;border-radius:8px!important;font-size:13px!important;font-weight:800!important}
.discount-table-shell{overflow-x:auto;padding:0}.discount-table{width:100%!important;min-width:940px;margin:0!important;border-collapse:collapse}.discount-table thead th{padding:11px 12px!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important;color:#475569!important;font-size:13px!important;font-weight:800!important;letter-spacing:.03em}.discount-table tbody td{padding:11px 12px!important;border-bottom:1px solid #eef2f7!important;color:#334155!important;font-size:14px!important;line-height:1.45;vertical-align:middle!important}.discount-student{color:#0f172a;font-weight:800}.discount-sub{display:block;margin-top:3px;color:#64748b;font-size:12px}.discount-kind{display:inline-flex;align-items:center;gap:5px;margin-top:6px;padding:4px 7px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:800}.discount-status{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:800}.discount-status.pending{background:#fffbeb;color:#b45309}.discount-status.approved{background:#ecfdf5;color:#047857}.discount-status.rejected{background:#fef2f2;color:#b91c1c}.discount-status.pending_removal{background:#f1f5f9;color:#475569}.discount-actions{display:flex;gap:6px;white-space:nowrap}.discount-actions .btn{min-width:36px;min-height:35px;padding:6px 9px!important;border-radius:7px!important;font-size:12px!important;box-shadow:none!important}.discount-actions .btn-primary{background:#2563eb!important;border-color:#2563eb!important}.discount-table input[type=checkbox]{width:18px;height:18px;cursor:pointer;accent-color:#2563eb}
.discount-approval-workspace .dataTables_wrapper{padding:14px}.discount-approval-workspace .dataTables_length,.discount-approval-workspace .dataTables_filter,.discount-approval-workspace .dataTables_info,.discount-approval-workspace .dataTables_paginate{color:#475569;font-size:13px}.discount-approval-workspace .dataTables_length select,.discount-approval-workspace .dataTables_filter input{min-height:38px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:14px}
@media(max-width:920px){.discount-stats{grid-template-columns:1fr 1fr}.discount-approval-head{align-items:flex-start}}
@media(max-width:767px){.discount-approval-workspace{padding:0 0 28px!important}.discount-approval-head{display:block}.discount-approval-head h1{font-size:22px!important}.discount-risk-note{max-width:none;margin-top:14px}.discount-toolbar{display:block}.discount-filters{overflow-x:auto;flex-wrap:nowrap}.discount-filter{white-space:nowrap}.discount-bulk{align-items:stretch;flex-direction:column}.discount-bulk strong{margin-right:0}.discount-bulk .btn{width:100%}}
@media(max-width:480px){.discount-stats{grid-template-columns:1fr}}
</style>

<div class="discount-approval-workspace">
    <div class="discount-approval-head">
        <div>
            <p class="discount-approval-eyebrow">Financial Controls</p>
            <h1>Discount Approvals</h1>
            <p>Review student discount assignments and invoice discounts before they affect balances.</p>
        </div>
        <div class="discount-risk-note"><i class="fa fa-shield-alt"></i><span>Approvals are financial mutations. Revoke restores recorded invoice allocations; unsafe historical reversals are blocked rather than guessed.</span></div>
    </div>

    <div id="discount_reconciliation_note" class="discount-reconciliation-note"><i class="fa fa-exclamation-triangle"></i> <span id="discount_reconciliation_text"></span></div>

    <div class="discount-stats">
        <div class="discount-stat" data-tone="pending"><div class="discount-stat-label">Pending</div><div class="discount-stat-value" id="pending_count">—</div><div class="discount-stat-hint">Awaiting super-admin decision</div></div>
        <div class="discount-stat" data-tone="approved"><div class="discount-stat-label">Approved</div><div class="discount-stat-value" id="approved_count">—</div><div class="discount-stat-hint">Currently approved records</div></div>
        <div class="discount-stat" data-tone="rejected"><div class="discount-stat-label">Rejected</div><div class="discount-stat-value" id="rejected_count">—</div><div class="discount-stat-hint">Rejected or safely revoked</div></div>
        <div class="discount-stat"><div class="discount-stat-label">Total</div><div class="discount-stat-value" id="total_count">—</div><div class="discount-stat-hint">All approval records</div></div>
    </div>

    <div class="discount-panel">
        <div class="discount-toolbar">
            <div class="discount-filters" role="group" aria-label="Discount status filter">
                <button type="button" class="discount-filter active" data-status="all">All</button>
                <button type="button" class="discount-filter" data-status="pending">Pending</button>
                <button type="button" class="discount-filter" data-status="approved">Approved</button>
                <button type="button" class="discount-filter" data-status="rejected">Rejected</button>
                <button type="button" class="discount-filter" data-status="pending_removal">Pending Removal</button>
            </div>
            <span style="color:#64748b;font-size:12px;font-weight:700">Bulk actions apply only to pending records.</span>
        </div>
        <div class="discount-bulk" id="bulk_actions">
            <strong><span id="selected_count">0</span> pending record(s) selected</strong>
            <button type="button" class="btn btn-success" id="bulkApproveBtn"><i class="fa fa-check"></i> Approve Selected</button>
            <button type="button" class="btn btn-danger" id="bulkRejectBtn"><i class="fa fa-times"></i> Reject Selected</button>
            <button type="button" class="btn btn-default" id="clearSelectionBtn">Clear</button>
        </div>
        <div class="discount-table-shell">
            <table id="approvals_table" class="table discount-table">
                <thead><tr><th style="width:42px"><input type="checkbox" id="select_all" aria-label="Select all pending visible rows"></th><th style="width:155px">Date</th><th>Description</th><th style="width:135px">Status</th><th style="width:170px">Actions</th></tr></thead>
                <tbody></tbody>
            </table>
        </div>
    </div>
</div>

<script>
var currentStatus='all';
var approvalTable=null;
var approvalBusy=false;
var approvalCsrfName=<?php echo json_encode($csrf_name); ?>;
var approvalCsrfHash=<?php echo json_encode($csrf_hash); ?>;
var approvalCurrency=<?php echo json_encode($currency); ?>;

function escapeApproval(value){return $('<div>').text(value==null?'':String(value)).html();}
function approvalPost(data){data=data||{};data[approvalCsrfName]=approvalCsrfHash;return data;}
function approvalError(xhr,fallback){var msg=fallback||'Operation failed';try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(e){}showAjaxModal_alert(msg,'error');}
function statusLabel(status){var labels={pending:'Pending',approved:'Approved',rejected:'Rejected',pending_removal:'Pending Removal'};return labels[status]||status;}

$(function(){
    approvalTable=$('#approvals_table').DataTable({pageLength:25,order:[[1,'desc']],autoWidth:false,columnDefs:[{orderable:false,targets:[0,4]}]});
    $('.discount-filter').on('click',function(){currentStatus=$(this).data('status');$('.discount-filter').removeClass('active');$(this).addClass('active');loadApprovals(currentStatus);});
    $('#select_all').on('change',function(){var checked=this.checked;$('.row-checkbox:visible').prop('checked',checked);updateBulkActions();});
    $(document).on('change','.row-checkbox',updateBulkActions);
    $('#clearSelectionBtn').on('click',clearSelection);
    $('#bulkApproveBtn').on('click',function(){bulkDecision('bulk_approve');});
    $('#bulkRejectBtn').on('click',function(){bulkDecision('bulk_reject');});
    $(document).on('click','.js-discount-view',function(){viewDetails($(this).data('id'),$(this).data('source'));});
    $(document).on('click','.js-discount-approve',function(){singleDecision('approve',$(this).data('id'),$(this).data('source'));});
    $(document).on('click','.js-discount-reject',function(){singleDecision('reject',$(this).data('id'),$(this).data('source'));});
    $(document).on('click','.js-discount-revoke',function(){singleDecision('revoke',$(this).data('id'),$(this).data('source'));});
    updateStats();loadReconciliationDiagnostics();loadApprovals('all');
});

function updateStats(){
    $.getJSON('<?php echo site_url('admin/discount_approvals/get_data'); ?>?status=all').done(function(r){if(r.status!=='success')return;var data=r.data||[];$('#pending_count').text(data.filter(function(x){return x.status==='pending';}).length);$('#approved_count').text(data.filter(function(x){return x.status==='approved';}).length);$('#rejected_count').text(data.filter(function(x){return x.status==='rejected';}).length);$('#total_count').text(data.length);});
}

function loadReconciliationDiagnostics(){
    $.getJSON('<?php echo site_url('admin/discount_approvals/diagnostics'); ?>').done(function(r){
        if(r.status!=='success')return;var d=r.data||{};
        var values=[Number(d.negative_invoice_rows||0),Number(d.settled_over_amount||0),Number(d.discount_item_drift||0),Number(d.invoice_ledger_drift||0)];
        if(values.some(function(v){return v>0;})){
            $('#discount_reconciliation_text').text('Historical reconciliation exceptions detected: '+values[0]+' negative invoice row(s), '+values[1]+' settled-over-final row(s), '+values[2]+' discount item drift row(s), and '+values[3]+' invoice ledger reference(s) out of alignment. New approvals are protected; historical records have not been auto-modified.');
            $('#discount_reconciliation_note').addClass('active');
        }
    });
}

function loadApprovals(status){
    clearSelection();
    $.getJSON('<?php echo site_url('admin/discount_approvals/get_data'); ?>?status='+encodeURIComponent(status)).done(function(r){
        if(r.status!=='success')return;
        approvalTable.clear();
        (r.data||[]).forEach(function(item){
            var id=parseInt(item.id,10)||0,source=item.source==='profile_assignment'?'profile_assignment':'invoice_discount';
            var checkbox=item.status==='pending'?'<input type="checkbox" class="row-checkbox" data-id="'+id+'" data-source="'+source+'" aria-label="Select record '+id+'">':'';
            var created=escapeApproval(item.created_at||'');
            var student=escapeApproval(item.student_name||'Unknown student');
            var code=escapeApproval(item.student_code||'');
            var profile=escapeApproval(item.profile_name||'');
            var category=escapeApproval(String(item.discount_category||'').replace(/_/g,' '));
            var invoice=item.invoice_code?' · Invoice '+escapeApproval(item.invoice_code):'';
            var value='';
            if(item.discount_method==='percentage') value=(parseFloat(item.discount_value)||0).toFixed(2)+'%';
            else value=approvalCurrency+' '+(parseFloat(item.discount_amount||item.discount_value)||0).toFixed(2);
            var kind=source==='profile_assignment'?'Student assignment':'Invoice discount';
            var description='<span class="discount-student">'+student+'</span><span class="discount-sub">'+code+invoice+'</span><span class="discount-kind">'+escapeApproval(kind)+' · '+escapeApproval(profile||value)+' · '+category+'</span>';
            var status='<span class="discount-status '+escapeApproval(item.status)+'">'+escapeApproval(statusLabel(item.status))+'</span>';
            var actions='<div class="discount-actions"><button type="button" class="btn btn-primary js-discount-view" data-id="'+id+'" data-source="'+source+'" title="View details"><i class="fa fa-eye"></i></button>';
            if(item.status==='pending') actions+='<button type="button" class="btn btn-success js-discount-approve" data-id="'+id+'" data-source="'+source+'" title="Approve"><i class="fa fa-check"></i></button><button type="button" class="btn btn-danger js-discount-reject" data-id="'+id+'" data-source="'+source+'" title="Reject"><i class="fa fa-times"></i></button>';
            else if(item.status==='approved') actions+='<button type="button" class="btn btn-danger js-discount-revoke" data-id="'+id+'" data-source="'+source+'" title="Revoke and restore financial effect"><i class="fa fa-undo"></i></button>';
            else if(item.status==='rejected') actions+='<button type="button" class="btn btn-success js-discount-approve" data-id="'+id+'" data-source="'+source+'" title="Approve"><i class="fa fa-check"></i></button>';
            actions+='</div>';
            approvalTable.row.add([checkbox,created,description,status,actions]);
        });
        approvalTable.draw();
        updateBulkActions();
    }).fail(function(xhr){approvalError(xhr,'Could not load discount approvals.');});
}

function updateBulkActions(){var count=$('.row-checkbox:checked').length;$('#selected_count').text(count);$('#bulk_actions').toggleClass('active',count>0);var total=$('.row-checkbox').length;$('#select_all').prop('checked',total>0&&count===total);}
function clearSelection(){$('.row-checkbox,#select_all').prop('checked',false);updateBulkActions();}
function selectedItems(){var items=[];$('.row-checkbox:checked').each(function(){items.push({id:parseInt($(this).data('id'),10),source:String($(this).data('source'))});});return items;}

function singleDecision(action,id,source){
    if(approvalBusy)return;
    var copy=action==='approve'?'Approve this discount?':(action==='revoke'?'Revoke this approved discount and restore its recorded invoice allocation?':'Reject this discount?');
    var tone=action==='approve'?'success':'danger';
    showConfirmModal(action==='revoke'?'Confirm Revoke':'Confirm '+action.charAt(0).toUpperCase()+action.slice(1),copy,function(){
        if(approvalBusy)return;approvalBusy=true;showAjaxModal_alert('Processing…','loading');
        $.ajax({url:'<?php echo site_url('admin/discount_approvals/'); ?>'+action,type:'POST',data:approvalPost({id:id,source:source}),dataType:'json'})
          .done(function(r){if(r.status==='success'||r.status==='already'){showAjaxModal_alert(r.message,r.status==='success'?'success':'info');loadApprovals(currentStatus);updateStats();}else showAjaxModal_alert(r.message||'Operation failed','error');})
          .fail(function(xhr){approvalError(xhr,'Approval action failed.');})
          .always(function(){approvalBusy=false;});
    },action==='revoke'?'Revoke':action.charAt(0).toUpperCase()+action.slice(1),tone);
}

function bulkDecision(action){
    var items=selectedItems();if(!items.length){showAjaxModal_alert('Select at least one pending record.','warning');return;}if(approvalBusy)return;
    var approving=action==='bulk_approve';showConfirmModal(approving?'Confirm Bulk Approval':'Confirm Bulk Rejection',(approving?'Approve ':'Reject ')+items.length+' selected pending record(s)?',function(){
        if(approvalBusy)return;approvalBusy=true;showAjaxModal_alert('Processing…','loading');
        $.ajax({url:'<?php echo site_url('admin/discount_approvals/'); ?>'+action,type:'POST',data:approvalPost({items:items}),dataType:'json'})
          .done(function(r){showAjaxModal_alert(r.message,r.status==='success'?'success':'error');loadApprovals(currentStatus);updateStats();})
          .fail(function(xhr){approvalError(xhr,'Bulk approval action failed.');})
          .always(function(){approvalBusy=false;});
    },approving?'Approve':'Reject',approving?'success':'danger');
}

function viewDetails(id,source){
    showAjaxModal_alert('Loading…','loading');
    $.ajax({url:'<?php echo site_url('admin/get_details'); ?>',type:'POST',data:approvalPost({assignment_id:id,source:source}),dataType:'json'})
      .done(function(r){$('.close').click();if(r.status==='success')showModalWithContent('detailsModal','<i class="fa fa-info-circle"></i> Discount Approval Details',r.html);else showAjaxModal_alert(r.message||'Details not found','error');})
      .fail(function(xhr){approvalError(xhr,'Could not load discount details.');});
}
</script>
