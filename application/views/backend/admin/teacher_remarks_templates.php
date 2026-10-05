<?php
$can_add = !empty($can_add);
$can_edit = !empty($can_edit);
$can_delete = !empty($can_delete);
$can_manage = !empty($can_manage);
$total_templates = is_array($templates) || $templates instanceof Countable ? count($templates) : 0;
$active_templates = 0;
$categories_present = array();
if (!empty($templates)) {
    foreach ($templates as $template_count) {
        if (!empty($template_count->is_active)) $active_templates++;
        $category_key = $template_count->category ?: 'uncategorized';
        $categories_present[$category_key] = true;
    }
}
$inactive_templates = $total_templates - $active_templates;
?>

<style>
.teacher-remarks-page { --tr-border:#e5e7eb; --tr-text:#172033; --tr-muted:#667085; }
.teacher-remarks-page .tr-hero,.teacher-remarks-page .tr-stat,.teacher-remarks-page .tr-filter-card,.teacher-remarks-page .tr-card { background:#fff; border:1px solid var(--tr-border); border-radius:16px; box-shadow:0 1px 2px rgba(16,24,40,.05); }
.teacher-remarks-page .tr-hero { padding:24px; margin-bottom:16px; }
.teacher-remarks-page .tr-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.teacher-remarks-page .tr-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.teacher-remarks-page .tr-icon { width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center; border-radius:14px; background:#fff7ed; border:1px solid #fed7aa; color:#c2410c; font-size:22px; }
.teacher-remarks-page .tr-title { margin:0; color:var(--tr-text); font-size:26px; line-height:1.2; font-weight:700; }
.teacher-remarks-page .tr-subtitle { margin:6px 0 0; color:var(--tr-muted); font-size:15px; line-height:1.5; }
.teacher-remarks-page .tr-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
.teacher-remarks-page .tr-btn { min-height:40px; padding:8px 13px; display:inline-flex; align-items:center; justify-content:center; gap:7px; border-radius:9px; font-size:13px; font-weight:700; text-decoration:none; cursor:pointer; white-space:nowrap; }
.teacher-remarks-page .tr-btn-primary { border:1px solid #2563eb; background:#2563eb; color:#fff; }
.teacher-remarks-page .tr-btn-primary:hover,.teacher-remarks-page .tr-btn-primary:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; text-decoration:none; }
.teacher-remarks-page .tr-btn-secondary { border:1px solid #d0d5dd; background:#fff; color:#475467; }
.teacher-remarks-page .tr-btn-secondary:hover,.teacher-remarks-page .tr-btn-secondary:focus { background:#f8fafc; color:#172033; text-decoration:none; }
.teacher-remarks-page .tr-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
.teacher-remarks-page .tr-stat { padding:15px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.teacher-remarks-page .tr-stat span { color:var(--tr-muted); font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; }
.teacher-remarks-page .tr-stat strong { color:var(--tr-text); font-size:24px; line-height:1; }
.teacher-remarks-page .tr-filter-card { padding:15px 16px; margin-bottom:16px; }
.teacher-remarks-page .tr-filter-grid { display:grid; grid-template-columns:minmax(190px,1fr) minmax(170px,.7fr) minmax(170px,.7fr) auto; gap:12px; align-items:end; }
.teacher-remarks-page .tr-field label { display:block; margin:0 0 6px; color:#344054; font-size:13px; font-weight:700; }
.teacher-remarks-page .tr-control { width:100%; min-height:40px; border:1.5px solid #d0d5dd; border-radius:9px; padding:7px 10px; background:#fff; color:#172033; font-size:14px; outline:none; }
.teacher-remarks-page .tr-control:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
.teacher-remarks-page .tr-filter-note { min-height:40px; display:flex; align-items:center; color:var(--tr-muted); font-size:12px; line-height:1.4; }
.teacher-remarks-page .tr-card { overflow:hidden; }
.teacher-remarks-page .tr-card-head { padding:15px 18px; border-bottom:1px solid var(--tr-border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.teacher-remarks-page .tr-card-head h3 { margin:0; color:var(--tr-text); font-size:17px; font-weight:700; }
.teacher-remarks-page .tr-card-head span { color:var(--tr-muted); font-size:13px; }
.teacher-remarks-page .tr-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.teacher-remarks-page #remarks-table { width:100%; min-width:920px; margin:0; }
.teacher-remarks-page #remarks-table thead th { background:#f8fafc; border-color:var(--tr-border); color:#475467; padding:12px 10px; font-size:13px; font-weight:700; vertical-align:middle; }
.teacher-remarks-page #remarks-table tbody td { border-color:var(--tr-border); color:#344054; padding:11px 10px; font-size:14px; vertical-align:middle; }
.teacher-remarks-page #remarks-table tbody tr[data-id]:hover { background:#f9fbfd; }
.teacher-remarks-page .tr-drag { width:42px; text-align:center; color:#98a2b3; cursor:grab; }
.teacher-remarks-page .tr-drag.is-disabled { cursor:default; opacity:.4; }
.teacher-remarks-page .tr-text { color:var(--tr-text); font-weight:600; line-height:1.45; }
.teacher-remarks-page .tr-category,.teacher-remarks-page .tr-status,.teacher-remarks-page .tr-order { display:inline-flex; align-items:center; justify-content:center; min-height:30px; padding:5px 9px; border-radius:999px; font-size:12px; font-weight:700; white-space:nowrap; }
.teacher-remarks-page .tr-category.is-positive { background:#ecfdf3; border:1px solid #abefc6; color:#067647; }
.teacher-remarks-page .tr-category.is-neutral { background:#eff6ff; border:1px solid #bfdbfe; color:#1d4ed8; }
.teacher-remarks-page .tr-category.is-negative { background:#fef2f2; border:1px solid #fecaca; color:#b42318; }
.teacher-remarks-page .tr-category.is-none { background:#f8fafc; border:1px solid #d0d5dd; color:#667085; }
.teacher-remarks-page .tr-status.is-active { background:#ecfdf3; border:1px solid #abefc6; color:#067647; }
.teacher-remarks-page .tr-status.is-inactive { background:#f8fafc; border:1px solid #d0d5dd; color:#667085; }
.teacher-remarks-page .tr-order { min-width:42px; background:#eef4ff; border:1px solid #d7e5ff; color:#1d4ed8; }
.teacher-remarks-page .tr-row-actions { display:flex; justify-content:center; gap:7px; }
.teacher-remarks-page .tr-action { width:38px; height:38px; padding:0; display:inline-flex; align-items:center; justify-content:center; border-radius:9px; border:1px solid #d0d5dd; background:#fff; color:#475467; cursor:pointer; }
.teacher-remarks-page .tr-action:hover,.teacher-remarks-page .tr-action:focus { background:#f8fafc; color:#172033; border-color:#98a2b3; }
.teacher-remarks-page .tr-action.is-edit { background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
.teacher-remarks-page .tr-action.is-delete { background:#fef2f2; border-color:#fecaca; color:#b42318; }
.teacher-remarks-page .tr-empty { padding:42px 20px !important; text-align:center; color:#667085 !important; }
.teacher-remarks-page .tr-empty i { display:block; margin-bottom:9px; font-size:36px; color:#cbd5e1; }
.teacher-remarks-page .ui-sortable-helper { background:#fff !important; box-shadow:0 12px 24px rgba(16,24,40,.14) !important; }
.teacher-remarks-page .ui-state-highlight { height:58px; background:#eff6ff !important; border:1px dashed #60a5fa !important; }
@media (max-width:950px) { .teacher-remarks-page .tr-filter-grid { grid-template-columns:1fr 1fr; } .teacher-remarks-page .tr-filter-note { grid-column:1 / -1; } }
@media (max-width:767px) {
    .teacher-remarks-page .tr-hero { padding:18px; }
    .teacher-remarks-page .tr-hero-row { flex-direction:column; align-items:flex-start; }
    .teacher-remarks-page .tr-actions { width:100%; justify-content:flex-start; }
    .teacher-remarks-page .tr-btn { flex:1 1 auto; }
    .teacher-remarks-page .tr-title { font-size:22px; }
    .teacher-remarks-page .tr-stats,.teacher-remarks-page .tr-filter-grid { grid-template-columns:1fr; }
    .teacher-remarks-page .tr-filter-note { grid-column:auto; }
}
</style>

<div class="teacher-remarks-page">
    <section class="tr-hero" aria-labelledby="teacherRemarksTitle">
        <div class="tr-hero-row">
            <div class="tr-title-wrap">
                <div class="tr-icon"><i class="fa fa-comments"></i></div>
                <div>
                    <h2 class="tr-title" id="teacherRemarksTitle"><?php echo get_phrase('teacher_remarks_templates'); ?></h2>
                    <p class="tr-subtitle"><?php echo get_phrase('manage_teacher_remark_templates'); ?></p>
                </div>
            </div>
            <div class="tr-actions">
                <?php if ($can_manage): ?>
                    <a class="tr-btn tr-btn-secondary" href="<?php echo site_url('teacher_remarks_templates/export_json'); ?>"><i class="fa fa-download"></i><?php echo get_phrase('export'); ?></a>
                    <button type="button" class="tr-btn tr-btn-secondary" id="importTeacherRemarksBtn"><i class="fa fa-upload"></i><?php echo get_phrase('import'); ?></button>
                    <button type="button" class="tr-btn tr-btn-secondary" id="initializeTeacherRemarksBtn"><i class="fa fa-magic"></i><?php echo get_phrase('defaults'); ?></button>
                <?php endif; ?>
                <?php if ($can_add): ?>
                    <button type="button" class="tr-btn tr-btn-primary" id="addTeacherRemarkTemplate"><i class="fa fa-plus"></i><?php echo get_phrase('add_new_template'); ?></button>
                <?php endif; ?>
            </div>
        </div>
    </section>

    <div class="tr-stats">
        <div class="tr-stat"><span><?php echo get_phrase('total_templates'); ?></span><strong id="teacherRemarksTotal"><?php echo (int) $total_templates; ?></strong></div>
        <div class="tr-stat"><span><?php echo get_phrase('active'); ?></span><strong id="teacherRemarksActive"><?php echo (int) $active_templates; ?></strong></div>
        <div class="tr-stat"><span><?php echo get_phrase('inactive'); ?></span><strong id="teacherRemarksInactive"><?php echo (int) $inactive_templates; ?></strong></div>
    </div>

    <section class="tr-filter-card" aria-label="Teacher remark filters">
        <div class="tr-filter-grid">
            <div class="tr-field">
                <label for="teacherRemarkSearch"><?php echo get_phrase('search'); ?></label>
                <input type="search" id="teacherRemarkSearch" class="tr-control" placeholder="<?php echo get_phrase('search_remarks'); ?>">
            </div>
            <div class="tr-field">
                <label for="teacherRemarkCategory"><?php echo get_phrase('category'); ?></label>
                <select id="teacherRemarkCategory" class="tr-control">
                    <option value="all"><?php echo get_phrase('all_categories'); ?></option>
                    <?php foreach (array('positive','neutral','negative','uncategorized') as $category): ?>
                        <?php if (isset($categories_present[$category])): ?><option value="<?php echo $category; ?>"><?php echo $category === 'uncategorized' ? get_phrase('no_category') : get_phrase($category); ?></option><?php endif; ?>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="tr-field">
                <label for="teacherRemarkStatus"><?php echo get_phrase('status'); ?></label>
                <select id="teacherRemarkStatus" class="tr-control">
                    <option value="all"><?php echo get_phrase('all_statuses'); ?></option>
                    <option value="1"><?php echo get_phrase('active'); ?></option>
                    <option value="0"><?php echo get_phrase('inactive'); ?></option>
                </select>
            </div>
            <div class="tr-filter-note" id="teacherRemarkReorderNote"><?php echo $can_edit ? 'Drag-to-reorder is available when all filters are cleared.' : get_phrase('view_only'); ?></div>
        </div>
        <?php if ($can_manage): ?><form id="teacherRemarksImportForm" enctype="multipart/form-data" style="display:none;"><input type="file" id="teacherRemarksImportFile" name="json_file" accept="application/json,.json"></form><?php endif; ?>
    </section>

    <section class="tr-card" aria-label="Teacher remark template register">
        <div class="tr-card-head"><h3><?php echo get_phrase('teacher_remarks'); ?></h3><span id="teacherRemarkVisibleCount"><?php echo (int) $total_templates; ?> <?php echo get_phrase('shown'); ?></span></div>
        <div class="tr-table-wrap">
            <table class="table table-bordered" id="remarks-table">
                <thead><tr><th style="width:52px;"></th><th><?php echo get_phrase('remark_text'); ?></th><th style="width:135px;"><?php echo get_phrase('category'); ?></th><th style="width:82px;"><?php echo get_phrase('order'); ?></th><th style="width:112px;"><?php echo get_phrase('status'); ?></th><th style="width:150px;" class="text-center"><?php echo get_phrase('actions'); ?></th></tr></thead>
                <tbody id="sortable-tbody">
                    <?php if (!empty($templates)): ?>
                        <?php foreach ($templates as $template):
                            $category = $template->category ?: 'uncategorized';
                            $category_class = $category === 'positive' ? 'is-positive' : ($category === 'neutral' ? 'is-neutral' : ($category === 'negative' ? 'is-negative' : 'is-none'));
                            $category_label = $category === 'uncategorized' ? get_phrase('no_category') : get_phrase($category);
                        ?>
                            <tr data-id="<?php echo (int) $template->id; ?>" data-active="<?php echo (int) $template->is_active; ?>" data-category="<?php echo htmlspecialchars($category, ENT_QUOTES, 'UTF-8'); ?>" data-text="<?php echo htmlspecialchars(strtolower($template->remark_text), ENT_QUOTES, 'UTF-8'); ?>">
                                <td class="tr-drag drag-handle <?php echo $can_edit ? '' : 'is-disabled'; ?>"><i class="entypo-menu"></i></td>
                                <td><span class="tr-text"><?php echo htmlspecialchars($template->remark_text, ENT_QUOTES, 'UTF-8'); ?></span></td>
                                <td><span class="tr-category <?php echo $category_class; ?>"><?php echo htmlspecialchars($category_label, ENT_QUOTES, 'UTF-8'); ?></span></td>
                                <td><span class="tr-order order-badge">#<?php echo (int) $template->display_order; ?></span></td>
                                <td class="status-cell"><?php echo $template->is_active ? '<span class="tr-status is-active"><i class="entypo-check"></i>'.get_phrase('active').'</span>' : '<span class="tr-status is-inactive"><i class="entypo-cancel"></i>'.get_phrase('inactive').'</span>'; ?></td>
                                <td><div class="tr-row-actions">
                                    <?php if ($can_edit): ?>
                                        <button type="button" class="tr-action toggle-template-status" data-id="<?php echo (int) $template->id; ?>" data-status="<?php echo (int) $template->is_active; ?>" title="<?php echo $template->is_active ? get_phrase('deactivate') : get_phrase('activate'); ?>"><i class="entypo-<?php echo $template->is_active ? 'eye-off' : 'eye'; ?>"></i></button>
                                        <button type="button" class="tr-action is-edit edit-template" data-id="<?php echo (int) $template->id; ?>" title="<?php echo get_phrase('edit'); ?>"><i class="entypo-pencil"></i></button>
                                    <?php endif; ?>
                                    <?php if ($can_delete): ?><button type="button" class="tr-action is-delete delete-template" data-id="<?php echo (int) $template->id; ?>" title="<?php echo get_phrase('delete'); ?>"><i class="entypo-trash"></i></button><?php endif; ?>
                                    <?php if (!$can_edit && !$can_delete): ?><span class="text-muted">—</span><?php endif; ?>
                                </div></td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr class="empty-row"><td colspan="6" class="tr-empty"><i class="fa fa-comments"></i><strong><?php echo get_phrase('no_templates_found'); ?></strong></td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>
</div>

<script src="<?php echo base_url('assets/js/jquery-ui/js/jquery-ui-1.10.3.custom.min.js'); ?>"></script>
<script type="text/javascript">
(function($){
    var canEdit=<?php echo $can_edit ? 'true' : 'false'; ?>;
    function filtersClear(){return $('#teacherRemarkSearch').val().trim()===''&&$('#teacherRemarkCategory').val()==='all'&&$('#teacherRemarkStatus').val()==='all';}
    function renderEmpty(){if($('#sortable-tbody tr[data-id]').length===0)$('#sortable-tbody').html('<tr class="empty-row"><td colspan="6" class="tr-empty"><i class="fa fa-comments"></i><strong><?php echo get_phrase('no_templates_found'); ?></strong></td></tr>');}
    window.refreshTeacherRemarkStats=function(){var total=$('#sortable-tbody tr[data-id]').length,active=$('#sortable-tbody tr[data-id][data-active="1"]').length;$('#teacherRemarksTotal').text(total);$('#teacherRemarksActive').text(active);$('#teacherRemarksInactive').text(total-active);};
    function applyFilters(){
        var q=$('#teacherRemarkSearch').val().trim().toLowerCase(),category=$('#teacherRemarkCategory').val(),status=$('#teacherRemarkStatus').val(),visible=0;
        $('#sortable-tbody tr[data-id]').each(function(){var $r=$(this),show=(!q||String($r.attr('data-text')).indexOf(q)!==-1)&&(category==='all'||$r.attr('data-category')===category)&&(status==='all'||$r.attr('data-active')===status);$r.toggle(show);if(show)visible++;});
        $('#teacherRemarkVisibleCount').text(visible+' <?php echo get_phrase('shown'); ?>');
        if(canEdit){if(filtersClear()){initTeacherRemarkSortable();$('#teacherRemarkReorderNote').text('Drag-to-reorder is available.');}else{destroySortable();$('#teacherRemarkReorderNote').text('Clear filters to reorder templates.');}}
    }
    function destroySortable(){var $b=$('#sortable-tbody');if($b.hasClass('ui-sortable')){try{$b.sortable('destroy');}catch(e){}}}
    window.initTeacherRemarkSortable=function(){
        var $b=$('#sortable-tbody');if(!canEdit||!filtersClear()||!$b.length||!$.fn.sortable)return;destroySortable();
        $b.sortable({items:'tr[data-id]',handle:'.drag-handle',axis:'y',placeholder:'ui-state-highlight',helper:function(e,tr){var $o=tr.children(),$h=tr.clone();$h.children().each(function(i){$(this).width($o.eq(i).width());});return $h;},update:function(){var order=[];$b.find('tr[data-id]').each(function(i){order.push({id:$(this).data('id'),display_order:i+1});$(this).find('.order-badge').text('#'+(i+1));});$.ajax({url:'<?php echo site_url('teacher_remarks_templates/update_order'); ?>',type:'POST',data:{order_data:order},dataType:'json'}).done(function(r){r.success?toastr.success(r.message||'<?php echo get_phrase('order_updated_successfully'); ?>'):toastr.error(r.message||'<?php echo get_phrase('failed_to_update_order'); ?>');}).fail(function(){toastr.error('<?php echo get_phrase('failed_to_update_order'); ?>');});}});
    };
    window.refreshTeacherRemarkTemplatesList=function(){return $.get('<?php echo site_url('admin/teacher_remarks_templates'); ?>').done(function(html){var $html=$('<div>').append($.parseHTML(html,document,true)),$new=$html.find('#sortable-tbody');if($new.length)$('#sortable-tbody').html($new.html());['teacherRemarksTotal','teacherRemarksActive','teacherRemarksInactive'].forEach(function(id){var v=$html.find('#'+id).text();if(v!=='')$('#'+id).text(v);});refreshTeacherRemarkStats();applyFilters();});};
    function loadForm(id){$('#modal_ajax .modal-body').html('<div style="padding:36px;text-align:center;color:#667085;"><i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('loading'); ?>...</div>');$('#modal_ajax').modal('show',{backdrop:'static'});$.ajax({url:'<?php echo site_url('teacher_remarks_templates/get_form'); ?>',type:'POST',data:id?{id:id}:{}}).done(function(r){$('#modal_ajax .modal-body').html(r);}).fail(function(){$('#modal_ajax .modal-body').html('<div class="alert alert-danger" style="margin:20px;">Unable to load the form. Please try again.</div>');});}
    $('#addTeacherRemarkTemplate').on('click',function(){loadForm(null);});$(document).on('click','.edit-template',function(){loadForm($(this).data('id'));});
    $(document).on('click','.toggle-template-status',function(){var $btn=$(this),$row=$btn.closest('tr[data-id]'),id=$btn.data('id');$.ajax({url:'<?php echo site_url('teacher_remarks_templates/toggle_active/'); ?>'+id,type:'POST',dataType:'json'}).done(function(r){if(!r.success){toastr.error(r.message||'<?php echo get_phrase('operation_failed'); ?>');return;}var active=parseInt(r.new_status,10)===1;$row.attr('data-active',active?'1':'0');$row.find('.status-cell').html(active?'<span class="tr-status is-active"><i class="entypo-check"></i><?php echo get_phrase('active'); ?></span>':'<span class="tr-status is-inactive"><i class="entypo-cancel"></i><?php echo get_phrase('inactive'); ?></span>');$btn.data('status',active?1:0).attr('title',active?'<?php echo get_phrase('deactivate'); ?>':'<?php echo get_phrase('activate'); ?>').find('i').attr('class',active?'entypo-eye-off':'entypo-eye');refreshTeacherRemarkStats();applyFilters();toastr.success(r.message||'<?php echo get_phrase('updated_successfully'); ?>');}).fail(function(){toastr.error('<?php echo get_phrase('operation_failed'); ?>');});});
    $(document).on('click','.delete-template',function(){var $row=$(this).closest('tr[data-id]'),id=$(this).data('id');showConfirmModal('<?php echo get_phrase('delete_confirmation'); ?>','<?php echo get_phrase('are_you_sure_you_want_to_delete'); ?>?<br><br><span style="color:#b42318;"><?php echo get_phrase('this_action_cannot_be_undone'); ?></span>',function(){$.ajax({url:'<?php echo site_url('teacher_remarks_templates/delete/'); ?>'+id,type:'POST',dataType:'json'}).done(function(r){if(!r.success){toastr.error(r.message||'<?php echo get_phrase('operation_failed'); ?>');return;}$row.fadeOut(180,function(){$(this).remove();renderEmpty();refreshTeacherRemarkStats();applyFilters();});toastr.success(r.message||'<?php echo get_phrase('deleted_successfully'); ?>');}).fail(function(){toastr.error('<?php echo get_phrase('operation_failed'); ?>');});},'<?php echo get_phrase('delete'); ?>','danger');});
    $('#teacherRemarkSearch,#teacherRemarkCategory,#teacherRemarkStatus').on('input change',applyFilters);
    $('#importTeacherRemarksBtn').on('click',function(){$('#teacherRemarksImportFile').trigger('click');});
    $('#teacherRemarksImportFile').on('change',function(){if(!this.files||!this.files[0])return;var d=new FormData();d.append('json_file',this.files[0]);$.ajax({url:'<?php echo site_url('teacher_remarks_templates/import_json'); ?>',type:'POST',data:d,processData:false,contentType:false,dataType:'json'}).done(function(r){if(r.success){toastr.success('Imported '+r.imported+' of '+r.total+' templates.');refreshTeacherRemarkTemplatesList();}else toastr.error(r.message||'Import failed.');}).fail(function(){toastr.error('Import failed.');}).always(function(){$('#teacherRemarksImportFile').val('');});});
    $('#initializeTeacherRemarksBtn').on('click',function(){showConfirmModal('<?php echo get_phrase('confirm_action'); ?>','Load the default teacher remark templates? Existing templates are preserved by the server rules.',function(){window.location.href='<?php echo site_url('teacher_remarks_templates/initialize_defaults'); ?>';},'<?php echo get_phrase('confirm'); ?>','warning');});
    $(function(){refreshTeacherRemarkStats();applyFilters();});
})(jQuery);
</script>
