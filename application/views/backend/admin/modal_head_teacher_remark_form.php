<?php
$is_edit = isset($remark);
$form_id = 'head-teacher-remark-form';
$submit_url = $is_edit ? site_url('admin/head_teacher_remarks/update/' . (int) $remark->id) : site_url('admin/head_teacher_remarks/create');
$modal_title = $is_edit ? get_phrase('edit_remark_range') : get_phrase('add_remark_range');
$remark_id = $is_edit ? (int) $remark->id : 0;
?>

<style>
#<?php echo $form_id; ?> { --hrf-border:#e5e7eb; --hrf-text:#172033; --hrf-muted:#667085; }
#<?php echo $form_id; ?> .hrf-head { padding:18px 20px; border-bottom:1px solid var(--hrf-border); background:#fff; }
#<?php echo $form_id; ?> .hrf-heading { display:flex; align-items:center; gap:12px; padding-right:30px; }
#<?php echo $form_id; ?> .hrf-icon { width:42px; height:42px; flex:0 0 42px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; }
#<?php echo $form_id; ?> .hrf-title { margin:0; color:var(--hrf-text); font-size:20px; font-weight:700; }
#<?php echo $form_id; ?> .hrf-subtitle { margin:4px 0 0; color:var(--hrf-muted); font-size:13px; line-height:1.45; }
#<?php echo $form_id; ?> .hrf-close { position:absolute; top:15px; right:19px; color:#667085; opacity:1; font-size:28px; font-weight:400; }
#<?php echo $form_id; ?> .hrf-body { padding:20px; background:#f8fafc; }
#<?php echo $form_id; ?> .hrf-card { padding:20px; border:1px solid var(--hrf-border); border-radius:14px; background:#fff; }
#<?php echo $form_id; ?> .hrf-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
#<?php echo $form_id; ?> .hrf-field { margin-bottom:16px; }
#<?php echo $form_id; ?> .hrf-field:last-child { margin-bottom:0; }
#<?php echo $form_id; ?> .hrf-label { display:block; margin:0 0 7px; color:#344054; font-size:14px; font-weight:700; }
#<?php echo $form_id; ?> .hrf-required { color:#b42318; }
#<?php echo $form_id; ?> .hrf-control { width:100%; min-height:44px; border:1.5px solid #d0d5dd; border-radius:10px; padding:9px 12px; background:#fff; color:#172033; font-size:14px; outline:none; }
#<?php echo $form_id; ?> textarea.hrf-control { min-height:96px; resize:vertical; }
#<?php echo $form_id; ?> .hrf-control:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
#<?php echo $form_id; ?> .hrf-help { display:block; margin-top:6px; color:var(--hrf-muted); font-size:12px; line-height:1.45; }
#<?php echo $form_id; ?> .hrf-toggle { display:flex; align-items:center; gap:11px; padding:12px 13px; border:1px solid var(--hrf-border); border-radius:10px; background:#f8fafc; cursor:pointer; }
#<?php echo $form_id; ?> .hrf-toggle input { width:20px; height:20px; margin:0; accent-color:#2563eb; }
#<?php echo $form_id; ?> .hrf-toggle strong { display:block; color:#344054; font-size:14px; }
#<?php echo $form_id; ?> .hrf-toggle span { display:block; margin-top:2px; color:var(--hrf-muted); font-size:12px; line-height:1.4; }
#<?php echo $form_id; ?> .hrf-validation { display:none; margin-top:14px; padding:11px 13px; border-radius:10px; font-size:13px; line-height:1.45; }
#<?php echo $form_id; ?> .hrf-validation.is-error { display:block; border:1px solid #fecaca; background:#fef2f2; color:#b42318; }
#<?php echo $form_id; ?> .hrf-validation.is-ok { display:block; border:1px solid #abefc6; background:#ecfdf3; color:#067647; }
#<?php echo $form_id; ?> .hrf-footer { display:flex; justify-content:flex-end; gap:10px; padding:15px 20px; border-top:1px solid var(--hrf-border); background:#fff; }
#<?php echo $form_id; ?> .hrf-btn { min-height:40px; padding:8px 15px; border-radius:9px; font-size:14px; font-weight:700; }
#<?php echo $form_id; ?> .hrf-cancel { border:1px solid #d0d5dd; background:#fff; color:#475467; }
#<?php echo $form_id; ?> .hrf-save { border:1px solid #2563eb; background:#2563eb; color:#fff; }
#<?php echo $form_id; ?> .hrf-save:hover,#<?php echo $form_id; ?> .hrf-save:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
@media (max-width:767px) {
    #<?php echo $form_id; ?> .hrf-grid { grid-template-columns:1fr; gap:0; }
    #<?php echo $form_id; ?> .hrf-body { padding:14px; }
    #<?php echo $form_id; ?> .hrf-card { padding:16px; }
    #<?php echo $form_id; ?> .hrf-footer { flex-direction:column-reverse; }
    #<?php echo $form_id; ?> .hrf-btn { width:100%; }
}
</style>

<form id="<?php echo $form_id; ?>" method="post" action="<?php echo $submit_url; ?>">
    <?php if ($this->security->get_csrf_token_name()): ?>
        <input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>">
    <?php endif; ?>
    <div class="modal-header hrf-head">
        <button type="button" class="close hrf-close" data-dismiss="modal" aria-label="Close">&times;</button>
        <div class="hrf-heading">
            <div class="hrf-icon"><i class="entypo-<?php echo $is_edit ? 'pencil' : 'plus'; ?>"></i></div>
            <div>
                <h4 class="hrf-title"><?php echo $modal_title; ?></h4>
                <p class="hrf-subtitle"><?php echo $is_edit ? get_phrase('update_remark_range_details') : get_phrase('create_percentage_based_remark_for_report_cards'); ?></p>
            </div>
        </div>
    </div>

    <div class="modal-body hrf-body">
        <div class="hrf-card">
            <div class="hrf-grid">
                <div class="hrf-field">
                    <label class="hrf-label" for="min_percentage"><?php echo get_phrase('min_percentage'); ?> <span class="hrf-required">*</span></label>
                    <input type="number" class="hrf-control" id="min_percentage" name="min_percentage" min="0" max="100" step="0.01" required value="<?php echo $is_edit ? htmlspecialchars($remark->min_percentage, ENT_QUOTES, 'UTF-8') : ''; ?>">
                    <small class="hrf-help"><?php echo get_phrase('range_0_to_100'); ?></small>
                </div>
                <div class="hrf-field">
                    <label class="hrf-label" for="max_percentage"><?php echo get_phrase('max_percentage'); ?> <span class="hrf-required">*</span></label>
                    <input type="number" class="hrf-control" id="max_percentage" name="max_percentage" min="0" max="100" step="0.01" required value="<?php echo $is_edit ? htmlspecialchars($remark->max_percentage, ENT_QUOTES, 'UTF-8') : ''; ?>">
                    <small class="hrf-help"><?php echo get_phrase('range_0_to_100'); ?></small>
                </div>
            </div>

            <div class="hrf-field">
                <label class="hrf-label" for="remark_text"><?php echo get_phrase('remark_text'); ?> <span class="hrf-required">*</span></label>
                <textarea class="hrf-control" id="remark_text" name="remark_text" maxlength="255" required><?php echo $is_edit ? htmlspecialchars($remark->remark_text, ENT_QUOTES, 'UTF-8') : ''; ?></textarea>
                <small class="hrf-help"><?php echo get_phrase('this_will_appear_on_student_report_cards'); ?> · <span id="headRemarkCharCount"><?php echo $is_edit ? strlen($remark->remark_text) : 0; ?></span>/255</small>
            </div>

            <div class="hrf-grid">
                <div class="hrf-field">
                    <label class="hrf-label" for="display_order"><?php echo get_phrase('display_order'); ?></label>
                    <input type="number" class="hrf-control" id="display_order" name="display_order" min="1" value="<?php echo $is_edit ? (int) $remark->display_order : ''; ?>" placeholder="1">
                    <small class="hrf-help"><?php echo get_phrase('leave_blank_to_add_at_the_end_you_can_reorder_later'); ?></small>
                </div>
                <div class="hrf-field">
                    <label class="hrf-label"><?php echo get_phrase('visibility_status'); ?></label>
                    <input type="hidden" name="is_active" value="0">
                    <label class="hrf-toggle" for="is_active">
                        <input type="checkbox" id="is_active" name="is_active" value="1" <?php echo ($is_edit && $remark->is_active) || !$is_edit ? 'checked' : ''; ?>>
                        <span><strong><?php echo get_phrase('active_range'); ?></strong><span><?php echo get_phrase('inactive_ranges_are_not_used_for_automatic_remark_assignment'); ?></span></span>
                    </label>
                </div>
            </div>
        </div>
        <div id="remark-form-validation" class="hrf-validation" role="alert"></div>
    </div>

    <div class="modal-footer hrf-footer">
        <button type="button" class="btn hrf-btn hrf-cancel" data-dismiss="modal"><i class="entypo-cancel"></i> <?php echo get_phrase('cancel'); ?></button>
        <button type="submit" class="btn hrf-btn hrf-save" id="remark-submit-btn"><i class="entypo-<?php echo $is_edit ? 'check' : 'plus'; ?>"></i> <?php echo $is_edit ? get_phrase('update') : get_phrase('save'); ?></button>
    </div>
</form>

<script type="text/javascript">
(function($) {
    var $form=$('#<?php echo $form_id; ?>'),$submit=$('#remark-submit-btn'),$validation=$('#remark-form-validation');
    var defaultSubmit=$submit.html(), overlapRequest=null, excludeId=<?php echo $remark_id; ?>;
    function setValidation(message,type){$validation.removeClass('is-error is-ok').addClass(type==='ok'?'is-ok':'is-error').html(message);}
    function clearValidation(){$validation.removeClass('is-error is-ok').hide().empty();}
    function basicRangeValid(){
        var min=parseFloat($('#min_percentage').val()),max=parseFloat($('#max_percentage').val());
        if(isNaN(min)||isNaN(max))return false;
        if(min<0||max>100){setValidation('Percentages must be between 0 and 100.','error');return false;}
        if(min>max){setValidation('<?php echo get_phrase('minimum_percentage_cannot_be_greater_than_maximum'); ?>','error');return false;}
        return true;
    }
    function checkOverlap(showSuccess){
        var deferred=$.Deferred();
        if(!basicRangeValid()){deferred.resolve(false);return deferred.promise();}
        if(!$('#is_active').is(':checked')){if(showSuccess)setValidation('Inactive ranges may overlap because they are not used for automatic assignment.','ok');deferred.resolve(true);return deferred.promise();}
        if(overlapRequest)overlapRequest.abort();
        overlapRequest=$.ajax({url:'<?php echo site_url('admin/head_teacher_remarks/check_overlap'); ?>',type:'POST',dataType:'json',data:{min_percentage:$('#min_percentage').val(),max_percentage:$('#max_percentage').val(),exclude_id:excludeId||''}})
            .done(function(r){
                if(r.has_overlap){var o=r.overlapping_range||{};setValidation('This active range overlaps '+(o.min_percentage||'?')+'% – '+(o.max_percentage||'?')+'%.','error');deferred.resolve(false);}
                else{if(showSuccess)setValidation('No overlap detected. This range is available.','ok');else clearValidation();deferred.resolve(true);}
            }).fail(function(xhr,status){if(status==='abort')return;setValidation('Unable to verify range overlap. The server will still validate on save.','error');deferred.resolve(true);});
        return deferred.promise();
    }
    $('#remark_text').on('input',function(){$('#headRemarkCharCount').text($(this).val().length);});
    $('#min_percentage,#max_percentage,#is_active').on('change blur',function(){if($('#min_percentage').val()!==''&&$('#max_percentage').val()!=='')checkOverlap(true);});
    $form.on('submit',function(e){
        e.preventDefault(); clearValidation();
        if(!basicRangeValid())return false;
        checkOverlap(false).done(function(ok){
            if(!ok)return;
            $submit.prop('disabled',true).html('<i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('saving'); ?>...');
            $.ajax({url:$form.attr('action'),type:'POST',data:$form.serialize(),dataType:'json'}).done(function(r){
                if(!r.success){setValidation(r.message||'<?php echo get_phrase('error_saving_remark_range'); ?>','error');$submit.prop('disabled',false).html(defaultSubmit);return;}
                $('#modal_ajax').modal('hide');
                var refresh=(typeof window.refreshHeadRemarksList==='function')?window.refreshHeadRemarksList():$.Deferred().resolve().promise();
                refresh.always(function(){toastr.success(r.message||'<?php echo get_phrase('updated_successfully'); ?>');});
            }).fail(function(xhr){
                var msg='<?php echo get_phrase('error_saving_remark_range'); ?>'; try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(ignore){}
                setValidation(msg,'error');$submit.prop('disabled',false).html(defaultSubmit);
            });
        });
        return false;
    });
    setTimeout(function(){$('#min_percentage').focus();},150);
})(jQuery);
</script>
