<?php
$is_edit = isset($template) && $template;
$form_id = 'teacher-remark-template-form';
$submit_url = $is_edit ? site_url('teacher_remarks_templates/update/' . (int) $template->id) : site_url('teacher_remarks_templates/create');
$modal_title = $is_edit ? get_phrase('edit_remark_template') : get_phrase('add_remark_template');
?>

<style>
#<?php echo $form_id; ?> { --trf-border:#e5e7eb; --trf-text:#172033; --trf-muted:#667085; }
#<?php echo $form_id; ?> .trf-head { padding:18px 20px; border-bottom:1px solid var(--trf-border); background:#fff; }
#<?php echo $form_id; ?> .trf-heading { display:flex; align-items:center; gap:12px; padding-right:30px; }
#<?php echo $form_id; ?> .trf-icon { width:42px; height:42px; flex:0 0 42px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:#fff7ed; border:1px solid #fed7aa; color:#c2410c; }
#<?php echo $form_id; ?> .trf-title { margin:0; color:var(--trf-text); font-size:20px; font-weight:700; }
#<?php echo $form_id; ?> .trf-subtitle { margin:4px 0 0; color:var(--trf-muted); font-size:13px; line-height:1.45; }
#<?php echo $form_id; ?> .trf-close { position:absolute; top:15px; right:19px; color:#667085; opacity:1; font-size:28px; font-weight:400; }
#<?php echo $form_id; ?> .trf-body { padding:20px; background:#f8fafc; }
#<?php echo $form_id; ?> .trf-card { padding:20px; border:1px solid var(--trf-border); border-radius:14px; background:#fff; }
#<?php echo $form_id; ?> .trf-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
#<?php echo $form_id; ?> .trf-field { margin-bottom:16px; }
#<?php echo $form_id; ?> .trf-field:last-child { margin-bottom:0; }
#<?php echo $form_id; ?> .trf-label { display:block; margin:0 0 7px; color:#344054; font-size:14px; font-weight:700; }
#<?php echo $form_id; ?> .trf-required { color:#b42318; }
#<?php echo $form_id; ?> .trf-control { width:100%; min-height:44px; border:1.5px solid #d0d5dd; border-radius:10px; padding:9px 12px; background:#fff; color:#172033; font-size:14px; outline:none; }
#<?php echo $form_id; ?> textarea.trf-control { min-height:110px; resize:vertical; }
#<?php echo $form_id; ?> .trf-control:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
#<?php echo $form_id; ?> .trf-help { display:block; margin-top:6px; color:var(--trf-muted); font-size:12px; line-height:1.45; }
#<?php echo $form_id; ?> .trf-toggle { display:flex; align-items:center; gap:11px; padding:12px 13px; border:1px solid var(--trf-border); border-radius:10px; background:#f8fafc; cursor:pointer; }
#<?php echo $form_id; ?> .trf-toggle input { width:20px; height:20px; margin:0; accent-color:#2563eb; }
#<?php echo $form_id; ?> .trf-toggle strong { display:block; color:#344054; font-size:14px; }
#<?php echo $form_id; ?> .trf-toggle span { display:block; margin-top:2px; color:var(--trf-muted); font-size:12px; line-height:1.4; }
#<?php echo $form_id; ?> .trf-error { display:none; margin-top:14px; padding:11px 13px; border:1px solid #fecaca; border-radius:10px; background:#fef2f2; color:#b42318; font-size:13px; line-height:1.45; }
#<?php echo $form_id; ?> .trf-footer { display:flex; justify-content:flex-end; gap:10px; padding:15px 20px; border-top:1px solid var(--trf-border); background:#fff; }
#<?php echo $form_id; ?> .trf-btn { min-height:40px; padding:8px 15px; border-radius:9px; font-size:14px; font-weight:700; }
#<?php echo $form_id; ?> .trf-cancel { border:1px solid #d0d5dd; background:#fff; color:#475467; }
#<?php echo $form_id; ?> .trf-save { border:1px solid #2563eb; background:#2563eb; color:#fff; }
#<?php echo $form_id; ?> .trf-save:hover,#<?php echo $form_id; ?> .trf-save:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
@media (max-width:767px) {
    #<?php echo $form_id; ?> .trf-grid { grid-template-columns:1fr; gap:0; }
    #<?php echo $form_id; ?> .trf-body { padding:14px; }
    #<?php echo $form_id; ?> .trf-card { padding:16px; }
    #<?php echo $form_id; ?> .trf-footer { flex-direction:column-reverse; }
    #<?php echo $form_id; ?> .trf-btn { width:100%; }
}
</style>

<form id="<?php echo $form_id; ?>" method="post" action="<?php echo $submit_url; ?>">
    <?php if ($this->security->get_csrf_token_name()): ?><input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>"><?php endif; ?>
    <div class="modal-header trf-head">
        <button type="button" class="close trf-close" data-dismiss="modal" aria-label="Close">&times;</button>
        <div class="trf-heading"><div class="trf-icon"><i class="entypo-<?php echo $is_edit ? 'pencil' : 'plus'; ?>"></i></div><div><h4 class="trf-title"><?php echo $modal_title; ?></h4><p class="trf-subtitle"><?php echo $is_edit ? get_phrase('update_remark_template_details') : get_phrase('create_selectable_remark_for_teachers'); ?></p></div></div>
    </div>

    <div class="modal-body trf-body">
        <div class="trf-card">
            <div class="trf-field">
                <label class="trf-label" for="template_remark_text"><?php echo get_phrase('remark_text'); ?> <span class="trf-required">*</span></label>
                <textarea class="trf-control" id="template_remark_text" name="remark_text" maxlength="500" required><?php echo $is_edit ? htmlspecialchars($template->remark_text, ENT_QUOTES, 'UTF-8') : ''; ?></textarea>
                <small class="trf-help"><?php echo get_phrase('teachers_will_select_this_from_dropdown'); ?> · <span id="templateRemarkCharCount"><?php echo $is_edit ? strlen($template->remark_text) : 0; ?></span>/500</small>
            </div>
            <div class="trf-grid">
                <div class="trf-field">
                    <label class="trf-label" for="template_category"><?php echo get_phrase('category'); ?></label>
                    <select class="trf-control" id="template_category" name="category">
                        <option value=""><?php echo get_phrase('no_category'); ?></option>
                        <option value="positive" <?php echo ($is_edit && $template->category === 'positive') ? 'selected' : ''; ?>><?php echo get_phrase('positive'); ?></option>
                        <option value="neutral" <?php echo ($is_edit && $template->category === 'neutral') ? 'selected' : ''; ?>><?php echo get_phrase('neutral'); ?></option>
                        <option value="negative" <?php echo ($is_edit && $template->category === 'negative') ? 'selected' : ''; ?>><?php echo get_phrase('negative'); ?></option>
                    </select>
                    <small class="trf-help"><?php echo get_phrase('helps_organize_templates'); ?></small>
                </div>
                <div class="trf-field">
                    <label class="trf-label" for="template_display_order"><?php echo get_phrase('display_order'); ?></label>
                    <input type="number" class="trf-control" id="template_display_order" name="display_order" min="1" value="<?php echo $is_edit ? (int) $template->display_order : ''; ?>" placeholder="1">
                    <small class="trf-help"><?php echo get_phrase('leave_blank_for_auto'); ?></small>
                </div>
            </div>
            <div class="trf-field">
                <label class="trf-label"><?php echo get_phrase('visibility_status'); ?></label>
                <input type="hidden" name="is_active" value="0">
                <label class="trf-toggle" for="template_is_active">
                    <input type="checkbox" id="template_is_active" name="is_active" value="1" <?php echo ($is_edit && $template->is_active) || !$is_edit ? 'checked' : ''; ?>>
                    <span><strong><?php echo get_phrase('active_template'); ?></strong><span><?php echo get_phrase('inactive_templates_hidden_from_teachers'); ?></span></span>
                </label>
            </div>
        </div>
        <div id="template-form-errors" class="trf-error" role="alert"></div>
    </div>

    <div class="modal-footer trf-footer">
        <button type="button" class="btn trf-btn trf-cancel" data-dismiss="modal"><i class="entypo-cancel"></i> <?php echo get_phrase('cancel'); ?></button>
        <button type="submit" class="btn trf-btn trf-save" id="template-submit-btn"><i class="entypo-<?php echo $is_edit ? 'check' : 'plus'; ?>"></i> <?php echo $is_edit ? get_phrase('update') : get_phrase('save'); ?></button>
    </div>
</form>

<script type="text/javascript">
(function($){
    var $form=$('#<?php echo $form_id; ?>'),$submit=$('#template-submit-btn'),$error=$('#template-form-errors'),defaultSubmit=$submit.html();
    $('#template_remark_text').on('input',function(){$('#templateRemarkCharCount').text($(this).val().length);});
    $form.on('submit',function(e){
        e.preventDefault();$error.hide().empty();
        if($.trim($('#template_remark_text').val())===''){$error.text('<?php echo get_phrase('remark_text_is_required'); ?>').show();return false;}
        $submit.prop('disabled',true).html('<i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('saving'); ?>...');
        $.ajax({url:$form.attr('action'),type:'POST',data:$form.serialize(),dataType:'json'}).done(function(r){
            if(!r.success){$error.html(r.message||'<?php echo get_phrase('error_saving_template'); ?>').show();$submit.prop('disabled',false).html(defaultSubmit);return;}
            $('#modal_ajax').modal('hide');
            var refresh=(typeof window.refreshTeacherRemarkTemplatesList==='function')?window.refreshTeacherRemarkTemplatesList():$.Deferred().resolve().promise();
            refresh.always(function(){toastr.success(r.message||'<?php echo get_phrase('updated_successfully'); ?>');});
        }).fail(function(xhr){var msg='<?php echo get_phrase('error_saving_template'); ?>';try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(ignore){}$error.html(msg).show();$submit.prop('disabled',false).html(defaultSubmit);});
        return false;
    });
    setTimeout(function(){$('#template_remark_text').focus();},150);
})(jQuery);
</script>
