<?php
$can_add = !empty($can_add);
$can_edit = !empty($can_edit);
$can_delete = !empty($can_delete);
$can_manage = !empty($can_manage);
$total_remarks = is_array($remarks) || $remarks instanceof Countable ? count($remarks) : 0;
$active_remarks = 0;
if (!empty($remarks)) {
    foreach ($remarks as $remark_count) {
        if (!empty($remark_count->is_active)) $active_remarks++;
    }
}
$inactive_remarks = $total_remarks - $active_remarks;
?>

<style>
.head-remarks-page { --hr-border:#e5e7eb; --hr-text:#172033; --hr-muted:#667085; }
.head-remarks-page .hr-hero,.head-remarks-page .hr-stat,.head-remarks-page .hr-info,.head-remarks-page .hr-card,.head-remarks-page .hr-test { background:#fff; border:1px solid var(--hr-border); border-radius:16px; box-shadow:0 1px 2px rgba(16,24,40,.05); }
.head-remarks-page .hr-hero { padding:24px; margin-bottom:16px; }
.head-remarks-page .hr-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.head-remarks-page .hr-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.head-remarks-page .hr-icon { width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center; border-radius:14px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:22px; }
.head-remarks-page .hr-title { margin:0; color:var(--hr-text); font-size:26px; line-height:1.2; font-weight:700; }
.head-remarks-page .hr-subtitle { margin:6px 0 0; color:var(--hr-muted); font-size:15px; line-height:1.5; }
.head-remarks-page .hr-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
.head-remarks-page .hr-btn { min-height:40px; padding:8px 13px; display:inline-flex; align-items:center; justify-content:center; gap:7px; border-radius:9px; font-size:13px; font-weight:700; text-decoration:none; cursor:pointer; white-space:nowrap; }
.head-remarks-page .hr-btn-primary { border:1px solid #2563eb; background:#2563eb; color:#fff; }
.head-remarks-page .hr-btn-primary:hover,.head-remarks-page .hr-btn-primary:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; text-decoration:none; }
.head-remarks-page .hr-btn-secondary { border:1px solid #d0d5dd; background:#fff; color:#475467; }
.head-remarks-page .hr-btn-secondary:hover,.head-remarks-page .hr-btn-secondary:focus { background:#f8fafc; color:#172033; text-decoration:none; }
.head-remarks-page .hr-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
.head-remarks-page .hr-stat { padding:15px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.head-remarks-page .hr-stat span { color:var(--hr-muted); font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; }
.head-remarks-page .hr-stat strong { color:var(--hr-text); font-size:24px; line-height:1; }
.head-remarks-page .hr-info { padding:15px 17px; margin-bottom:16px; display:flex; gap:12px; align-items:flex-start; }
.head-remarks-page .hr-info-icon { width:36px; height:36px; flex:0 0 36px; display:flex; align-items:center; justify-content:center; border-radius:10px; background:#f0f9ff; border:1px solid #bae6fd; color:#0369a1; }
.head-remarks-page .hr-info h4 { margin:0 0 4px; color:var(--hr-text); font-size:15px; font-weight:700; }
.head-remarks-page .hr-info p { margin:0; color:var(--hr-muted); font-size:13px; line-height:1.5; }
.head-remarks-page .hr-test { padding:16px 18px; margin-bottom:16px; }
.head-remarks-page .hr-test-row { display:grid; grid-template-columns:minmax(180px,240px) auto minmax(220px,1fr); gap:12px; align-items:end; }
.head-remarks-page .hr-field label { display:block; margin:0 0 6px; color:#344054; font-size:13px; font-weight:700; }
.head-remarks-page .hr-control { width:100%; min-height:40px; border:1.5px solid #d0d5dd; border-radius:9px; padding:7px 10px; background:#fff; color:#172033; font-size:14px; outline:none; }
.head-remarks-page .hr-control:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
.head-remarks-page .hr-test-result { min-height:40px; padding:9px 12px; border:1px solid #e5e7eb; border-radius:9px; background:#f8fafc; color:#667085; font-size:13px; display:flex; align-items:center; }
.head-remarks-page .hr-test-result.is-success { border-color:#abefc6; background:#ecfdf3; color:#067647; }
.head-remarks-page .hr-test-result.is-warning { border-color:#fed7aa; background:#fff7ed; color:#9a3412; }
.head-remarks-page .hr-card { overflow:hidden; }
.head-remarks-page .hr-card-head { padding:15px 18px; border-bottom:1px solid var(--hr-border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.head-remarks-page .hr-card-head h3 { margin:0; color:var(--hr-text); font-size:17px; font-weight:700; }
.head-remarks-page .hr-card-head span { color:var(--hr-muted); font-size:13px; }
.head-remarks-page .hr-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.head-remarks-page #remarks-table { width:100%; min-width:930px; margin:0; }
.head-remarks-page #remarks-table thead th { background:#f8fafc; border-color:var(--hr-border); color:#475467; padding:12px 10px; font-size:13px; font-weight:700; vertical-align:middle; }
.head-remarks-page #remarks-table tbody td { border-color:var(--hr-border); color:#344054; padding:11px 10px; font-size:14px; vertical-align:middle; }
.head-remarks-page #remarks-table tbody tr[data-id]:hover { background:#f9fbfd; }
.head-remarks-page .hr-drag { width:42px; text-align:center; color:#98a2b3; cursor:grab; }
.head-remarks-page .hr-drag.is-disabled { cursor:default; opacity:.45; }
.head-remarks-page .hr-order { display:inline-flex; min-width:46px; min-height:31px; align-items:center; justify-content:center; padding:5px 9px; border-radius:999px; background:#eef4ff; border:1px solid #d7e5ff; color:#1d4ed8; font-size:12px; font-weight:700; }
.head-remarks-page .hr-range { font-weight:700; color:#172033; white-space:nowrap; }
.head-remarks-page .hr-status { display:inline-flex; align-items:center; gap:6px; min-height:31px; padding:5px 9px; border-radius:999px; font-size:12px; font-weight:700; white-space:nowrap; }
.head-remarks-page .hr-status.is-active { background:#ecfdf3; border:1px solid #abefc6; color:#067647; }
.head-remarks-page .hr-status.is-inactive { background:#f8fafc; border:1px solid #d0d5dd; color:#667085; }
.head-remarks-page .hr-row-actions { display:flex; justify-content:center; gap:7px; }
.head-remarks-page .hr-action { width:38px; height:38px; padding:0; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; border:1px solid #d0d5dd; background:#fff; color:#475467; cursor:pointer; }
.head-remarks-page .hr-action:hover,.head-remarks-page .hr-action:focus { background:#f8fafc; color:#172033; border-color:#98a2b3; }
.head-remarks-page .hr-action.is-edit { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
.head-remarks-page .hr-action.is-delete { background:#fef2f2; border-color:#fecaca; color:#b42318; }
.head-remarks-page .hr-empty { padding:42px 20px !important; text-align:center; color:#667085 !important; }
.head-remarks-page .hr-empty i { display:block; margin-bottom:9px; font-size:36px; color:#cbd5e1; }
.head-remarks-page .ui-sortable-helper { background:#fff !important; box-shadow:0 12px 24px rgba(16,24,40,.14) !important; }
.head-remarks-page .ui-state-highlight { height:58px; background:#eff6ff !important; border:1px dashed #60a5fa !important; }
@media (max-width:900px) { .head-remarks-page .hr-test-row { grid-template-columns:1fr auto; } .head-remarks-page .hr-test-result { grid-column:1 / -1; } }
@media (max-width:767px) {
    .head-remarks-page .hr-hero { padding:18px; }
    .head-remarks-page .hr-hero-row { flex-direction:column; align-items:flex-start; }
    .head-remarks-page .hr-actions { width:100%; justify-content:flex-start; }
    .head-remarks-page .hr-btn { flex:1 1 auto; }
    .head-remarks-page .hr-title { font-size:22px; }
    .head-remarks-page .hr-stats { grid-template-columns:1fr; }
    .head-remarks-page .hr-test-row { grid-template-columns:1fr; }
    .head-remarks-page .hr-test-result { grid-column:auto; }
}
</style>

<div class="head-remarks-page">
    <section class="hr-hero" aria-labelledby="headRemarksTitle">
        <div class="hr-hero-row">
            <div class="hr-title-wrap">
                <div class="hr-icon"><i class="entypo-graduation-cap"></i></div>
                <div>
                    <h2 class="hr-title" id="headRemarksTitle"><?php echo get_phrase('head_teacher_remarks_ranges'); ?></h2>
                    <p class="hr-subtitle"><?php echo get_phrase('configure_percentage_based_remarks_for_report_cards'); ?></p>
                </div>
            </div>
            <div class="hr-actions">
                <?php if ($can_manage): ?>
                    <a class="hr-btn hr-btn-secondary" href="<?php echo site_url('admin/head_teacher_remarks/export_json'); ?>"><i class="fa fa-download"></i><?php echo get_phrase('export'); ?></a>
                    <button type="button" class="hr-btn hr-btn-secondary" id="importHeadRemarksBtn"><i class="fa fa-upload"></i><?php echo get_phrase('import'); ?></button>
                    <button type="button" class="hr-btn hr-btn-secondary" id="initializeHeadRemarksBtn"><i class="fa fa-magic"></i><?php echo get_phrase('defaults'); ?></button>
                <?php endif; ?>
                <?php if ($can_add): ?>
                    <button type="button" class="hr-btn hr-btn-primary" id="add-remark-range"><i class="entypo-plus"></i><?php echo get_phrase('add_new_range'); ?></button>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <div class="hr-stats">
        <div class="hr-stat"><span><?php echo get_phrase('total_ranges'); ?></span><strong id="headRemarksTotal"><?php echo (int) $total_remarks; ?></strong></div>
        <div class="hr-stat"><span><?php echo get_phrase('active'); ?></span><strong id="headRemarksActive"><?php echo (int) $active_remarks; ?></strong></div>
        <div class="hr-stat"><span><?php echo get_phrase('inactive'); ?></span><strong id="headRemarksInactive"><?php echo (int) $inactive_remarks; ?></strong></div>
    </div>

    <div class="hr-info">
        <div class="hr-info-icon"><i class="fa fa-info-circle"></i></div>
        <div>
            <h4><?php echo get_phrase('automatic_assignment'); ?></h4>
            <p>Each active percentage range maps a student average to one head-teacher remark. Active ranges cannot overlap; inactive ranges stay stored but are not used for automatic assignment.</p>
        </div>
    </div>

    <?php if ($can_manage): ?>
        <section class="hr-test" aria-label="Test percentage assignment">
            <div class="hr-test-row">
                <div class="hr-field">
                    <label for="headRemarkTestPercentage"><?php echo get_phrase('test_percentage'); ?></label>
                    <input type="number" id="headRemarkTestPercentage" class="hr-control" min="0" max="100" step="0.01" placeholder="e.g. 72.5">
                </div>
                <button type="button" class="hr-btn hr-btn-secondary" id="testHeadRemarkBtn"><i class="fa fa-flask"></i><?php echo get_phrase('test'); ?></button>
                <div class="hr-test-result" id="headRemarkTestResult">Enter a percentage to verify which active remark will be assigned.</div>
            </div>
        </section>
        <form id="headRemarksImportForm" enctype="multipart/form-data" style="display:none;">
            <input type="file" id="headRemarksImportFile" name="json_file" accept="application/json,.json">
        </form>
    <?php endif; ?>

    <section class="hr-card" aria-label="Head teacher remark ranges">
        <div class="hr-card-head">
            <h3><?php echo get_phrase('remark_ranges'); ?></h3>
            <span><?php echo $can_edit ? get_phrase('drag_to_reorder') : get_phrase('view_only'); ?></span>
        </div>
        <div class="hr-table-wrap">
            <table class="table table-bordered" id="remarks-table">
                <thead>
                    <tr>
                        <th style="width:52px;"></th>
                        <th style="width:84px;"><?php echo get_phrase('order'); ?></th>
                        <th style="width:150px;"><?php echo get_phrase('percentage_range'); ?></th>
                        <th><?php echo get_phrase('remark_text'); ?></th>
                        <th style="width:120px;"><?php echo get_phrase('status'); ?></th>
                        <th style="width:150px;" class="text-center"><?php echo get_phrase('actions'); ?></th>
                    </tr>
                </thead>
                <tbody id="sortable-remarks">
                    <?php if (!empty($remarks)): ?>
                        <?php foreach ($remarks as $remark): ?>
                            <tr data-id="<?php echo (int) $remark->id; ?>" data-active="<?php echo (int) $remark->is_active; ?>">
                                <td class="hr-drag drag-handle <?php echo $can_edit ? '' : 'is-disabled'; ?>"><i class="entypo-menu"></i></td>
                                <td><span class="hr-order order-badge">#<?php echo (int) $remark->display_order; ?></span></td>
                                <td><span class="hr-range"><?php echo number_format((float) $remark->min_percentage, 2); ?>% – <?php echo number_format((float) $remark->max_percentage, 2); ?>%</span></td>
                                <td><?php echo htmlspecialchars($remark->remark_text, ENT_QUOTES, 'UTF-8'); ?></td>
                                <td class="status-cell">
                                    <?php if ($remark->is_active): ?>
                                        <span class="hr-status is-active"><i class="entypo-check"></i><?php echo get_phrase('active'); ?></span>
                                    <?php else: ?>
                                        <span class="hr-status is-inactive"><i class="entypo-cancel"></i><?php echo get_phrase('inactive'); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div class="hr-row-actions">
                                        <?php if ($can_edit): ?>
                                            <button type="button" class="hr-action toggle-remark-status" data-id="<?php echo (int) $remark->id; ?>" data-status="<?php echo (int) $remark->is_active; ?>" data-range="<?php echo htmlspecialchars(number_format((float) $remark->min_percentage, 2) . '% - ' . number_format((float) $remark->max_percentage, 2) . '%', ENT_QUOTES, 'UTF-8'); ?>" title="<?php echo $remark->is_active ? get_phrase('deactivate') : get_phrase('activate'); ?>"><i class="entypo-<?php echo $remark->is_active ? 'eye-off' : 'eye'; ?>"></i></button>
                                            <button type="button" class="hr-action is-edit edit-remark" data-id="<?php echo (int) $remark->id; ?>" title="<?php echo get_phrase('edit'); ?>"><i class="entypo-pencil"></i></button>
                                        <?php endif; ?>
                                        <?php if ($can_delete): ?>
                                            <button type="button" class="hr-action is-delete delete-remark" data-id="<?php echo (int) $remark->id; ?>" data-range="<?php echo htmlspecialchars(number_format((float) $remark->min_percentage, 2) . '% - ' . number_format((float) $remark->max_percentage, 2) . '%', ENT_QUOTES, 'UTF-8'); ?>" title="<?php echo get_phrase('delete'); ?>"><i class="entypo-trash"></i></button>
                                        <?php endif; ?>
                                        <?php if (!$can_edit && !$can_delete): ?><span class="text-muted">—</span><?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr class="empty-row"><td colspan="6" class="hr-empty"><i class="entypo-info"></i><strong><?php echo get_phrase('no_remark_ranges_found'); ?></strong><div><?php echo get_phrase('click_add_to_create_first_range'); ?></div></td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>
</div>

<script src="<?php echo base_url('assets/js/jquery-ui/js/jquery-ui-1.10.3.custom.min.js'); ?>"></script>
<script type="text/javascript">
(function($) {
    var canEdit = <?php echo $can_edit ? 'true' : 'false'; ?>;

    function cleanupModalBackdrop() { $('.modal-backdrop').remove(); $('body').removeClass('modal-open').css('padding-right',''); }
    function renderEmptyState() {
        if ($('#sortable-remarks tr[data-id]').length === 0) {
            $('#sortable-remarks').html('<tr class="empty-row"><td colspan="6" class="hr-empty"><i class="entypo-info"></i><strong><?php echo get_phrase('no_remark_ranges_found'); ?></strong><div><?php echo get_phrase('click_add_to_create_first_range'); ?></div></td></tr>');
        }
    }
    window.refreshHeadRemarkStats = function() {
        var total = $('#sortable-remarks tr[data-id]').length;
        var active = $('#sortable-remarks tr[data-id][data-active="1"]').length;
        $('#headRemarksTotal').text(total); $('#headRemarksActive').text(active); $('#headRemarksInactive').text(total-active);
    };
    window.initHeadRemarkSortable = function() {
        var $body = $('#sortable-remarks');
        if (!canEdit || !$body.length || !$.fn.sortable) return;
        if ($body.hasClass('ui-sortable')) { try { $body.sortable('destroy'); } catch(e) {} }
        $body.sortable({
            items:'tr[data-id]', handle:'.drag-handle', axis:'y', placeholder:'ui-state-highlight',
            helper:function(e,tr){ var $o=tr.children(),$h=tr.clone(); $h.children().each(function(i){$(this).width($o.eq(i).width());}); return $h; },
            update:function(){
                var orderData=[];
                $body.find('tr[data-id]').each(function(index){ orderData.push({id:$(this).data('id'),display_order:index+1}); $(this).find('.order-badge').text('#'+(index+1)); });
                $.ajax({url:'<?php echo site_url('admin/head_teacher_remarks/update_order'); ?>',type:'POST',data:{order_data:orderData},dataType:'json'})
                    .done(function(r){ r.success ? toastr.success(r.message || '<?php echo get_phrase('order_updated_successfully'); ?>') : toastr.error(r.message || '<?php echo get_phrase('error_updating_order'); ?>'); })
                    .fail(function(){ toastr.error('<?php echo get_phrase('error_updating_order'); ?>'); });
            }
        });
    };
    window.refreshHeadRemarksList = function() {
        return $.get('<?php echo site_url('admin/head_teacher_remarks'); ?>').done(function(html){
            var $html=$('<div>').append($.parseHTML(html,document,true));
            var $newBody=$html.find('#sortable-remarks');
            if($newBody.length) $('#sortable-remarks').html($newBody.html());
            ['headRemarksTotal','headRemarksActive','headRemarksInactive'].forEach(function(id){ var v=$html.find('#'+id).text(); if(v!=='') $('#'+id).text(v); });
            initHeadRemarkSortable(); refreshHeadRemarkStats();
        });
    };
    function loadForm(id) {
        $('#modal_ajax .modal-body').html('<div style="padding:36px;text-align:center;color:#667085;"><i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('loading'); ?>...</div>');
        $('#modal_ajax').modal('show',{backdrop:'static'});
        $.ajax({url:'<?php echo site_url('admin/head_teacher_remarks/get_form'); ?>',type:'POST',data:id?{id:id}:{}})
            .done(function(r){ $('#modal_ajax .modal-body').html(r); })
            .fail(function(){ $('#modal_ajax .modal-body').html('<div class="alert alert-danger" style="margin:20px;">Unable to load the form. Please try again.</div>'); });
    }
    $('#add-remark-range').on('click',function(){loadForm(null);});
    $(document).on('click','.edit-remark',function(){loadForm($(this).data('id'));});

    $(document).on('click','.toggle-remark-status',function(){
        var $btn=$(this),$row=$btn.closest('tr[data-id]'),id=$btn.data('id'),range=$btn.data('range'),status=parseInt($btn.data('status'),10)||0;
        var action=status===1?'<?php echo get_phrase('deactivate'); ?>':'<?php echo get_phrase('activate'); ?>';
        showConfirmModal('<?php echo get_phrase('confirm_action'); ?>','<?php echo get_phrase('are_you_sure_you_want_to'); ?> <strong>'+action.toLowerCase()+'</strong> range "<strong>'+range+'</strong>"?',function(){
            showAjaxModal_alert('<?php echo get_phrase('processing'); ?>...','loading',false,false);
            $.ajax({url:'<?php echo site_url('admin/head_teacher_remarks/toggle_active'); ?>/'+id,type:'POST',dataType:'json'}).done(function(r){
                $('#modal_alert').modal('hide'); cleanupModalBackdrop();
                if(!r.success){toastr.error(r.message||'<?php echo get_phrase('operation_failed'); ?>');return;}
                var active=parseInt(r.new_status,10)===1;
                $row.attr('data-active',active?'1':'0');
                $row.find('.status-cell').html(active?'<span class="hr-status is-active"><i class="entypo-check"></i><?php echo get_phrase('active'); ?></span>':'<span class="hr-status is-inactive"><i class="entypo-cancel"></i><?php echo get_phrase('inactive'); ?></span>');
                $btn.data('status',active?1:0).attr('title',active?'<?php echo get_phrase('deactivate'); ?>':'<?php echo get_phrase('activate'); ?>');
                $btn.find('i').attr('class',active?'entypo-eye-off':'entypo-eye'); refreshHeadRemarkStats(); toastr.success(r.message||'<?php echo get_phrase('updated_successfully'); ?>');
            }).fail(function(){ $('#modal_alert').modal('hide'); cleanupModalBackdrop(); toastr.error('<?php echo get_phrase('operation_failed'); ?>'); });
        },'<?php echo get_phrase('confirm'); ?>','warning');
    });

    $(document).on('click','.delete-remark',function(){
        var $row=$(this).closest('tr[data-id]'),id=$(this).data('id'),range=$(this).data('range');
        showConfirmModal('<?php echo get_phrase('delete_confirmation'); ?>','<?php echo get_phrase('are_you_sure_you_want_to_delete'); ?> range "<strong>'+range+'</strong>"?<br><br><span style="color:#b42318;"><?php echo get_phrase('this_action_cannot_be_undone'); ?></span>',function(){
            $.ajax({url:'<?php echo site_url('admin/head_teacher_remarks/delete'); ?>/'+id,type:'POST',dataType:'json'}).done(function(r){
                if(!r.success){toastr.error(r.message||'<?php echo get_phrase('operation_failed'); ?>');return;}
                $row.fadeOut(180,function(){$(this).remove();renderEmptyState();refreshHeadRemarkStats();initHeadRemarkSortable();}); toastr.success(r.message||'<?php echo get_phrase('deleted_successfully'); ?>');
            }).fail(function(){toastr.error('<?php echo get_phrase('operation_failed'); ?>');});
        },'<?php echo get_phrase('delete'); ?>','danger');
    });

    $('#testHeadRemarkBtn').on('click',function(){
        var value=$('#headRemarkTestPercentage').val(),$result=$('#headRemarkTestResult');
        if(value===''||parseFloat(value)<0||parseFloat(value)>100){$result.removeClass('is-success').addClass('is-warning').text('Enter a percentage between 0 and 100.');return;}
        $result.removeClass('is-success is-warning').text('<?php echo get_phrase('loading'); ?>...');
        $.ajax({url:'<?php echo site_url('admin/head_teacher_remarks/test_percentage'); ?>',type:'POST',data:{percentage:value},dataType:'json'}).done(function(r){
            if(!r.success){$result.addClass('is-warning').text(r.message||'Unable to test this percentage.');return;}
            if(r.is_gap){$result.addClass('is-warning').text(r.percentage+'% · '+r.remark_text);}
            else{$result.addClass('is-success').text(r.percentage+'% · '+r.remark_text);}
        }).fail(function(){$result.addClass('is-warning').text('Unable to test this percentage.');});
    });

    $('#importHeadRemarksBtn').on('click',function(){$('#headRemarksImportFile').trigger('click');});
    $('#headRemarksImportFile').on('change',function(){
        if(!this.files||!this.files[0])return;
        var data=new FormData(); data.append('json_file',this.files[0]);
        $.ajax({url:'<?php echo site_url('admin/head_teacher_remarks/import_json'); ?>',type:'POST',data:data,processData:false,contentType:false,dataType:'json'}).done(function(r){
            if(r.success){toastr.success('Imported '+r.imported+' of '+r.total+' remark ranges.');refreshHeadRemarksList();}else toastr.error(r.message||'Import failed.');
        }).fail(function(){toastr.error('Import failed.');}).always(function(){$('#headRemarksImportFile').val('');});
    });
    $('#initializeHeadRemarksBtn').on('click',function(){
        showConfirmModal('<?php echo get_phrase('confirm_action'); ?>','Load the default head-teacher remark ranges? Existing configured ranges are preserved by the server rules.',function(){window.location.href='<?php echo site_url('admin/head_teacher_remarks/initialize_defaults'); ?>';},'<?php echo get_phrase('confirm'); ?>','warning');
    });

    $(function(){initHeadRemarkSortable();refreshHeadRemarkStats();});
})(jQuery);
</script>
