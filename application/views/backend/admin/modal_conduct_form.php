<?php
$is_edit = isset($conduct_item);
$form_id = 'conduct-item-form';
$submit_url = $is_edit ? site_url('admin/conduct_items/edit/' . $conduct_item->id) : site_url('admin/conduct_items/create');
$modal_title = $is_edit ? get_phrase('edit_conduct_item') : get_phrase('add_conduct_item');
?>

<style>
#<?php echo $form_id; ?> .catalog-modal-header { padding:20px 24px; border-bottom:1px solid #e5e7eb; background:#fff; }
#<?php echo $form_id; ?> .catalog-modal-heading { display:flex; align-items:center; gap:12px; padding-right:32px; }
#<?php echo $form_id; ?> .catalog-modal-icon {
    width:42px; height:42px; flex:0 0 42px; display:flex; align-items:center; justify-content:center;
    border-radius:11px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:18px;
}
#<?php echo $form_id; ?> .catalog-modal-title { margin:0; color:#172033; font-size:20px; font-weight:700; }
#<?php echo $form_id; ?> .catalog-modal-subtitle { margin:4px 0 0; color:#667085; font-size:13px; line-height:1.45; }
#<?php echo $form_id; ?> .catalog-modal-close { position:absolute; top:17px; right:20px; color:#667085; opacity:1; font-size:28px; font-weight:400; }
#<?php echo $form_id; ?> .catalog-modal-body { padding:22px 24px; background:#f8fafc; }
#<?php echo $form_id; ?> .catalog-form-card { padding:20px; border:1px solid #e5e7eb; border-radius:14px; background:#fff; }
#<?php echo $form_id; ?> .catalog-grid { display:grid; grid-template-columns:minmax(0,1.7fr) minmax(150px,.7fr); gap:16px; }
#<?php echo $form_id; ?> .catalog-field { margin-bottom:18px; }
#<?php echo $form_id; ?> .catalog-field:last-child { margin-bottom:0; }
#<?php echo $form_id; ?> .catalog-label { display:block; margin:0 0 7px; color:#344054; font-size:14px; font-weight:700; }
#<?php echo $form_id; ?> .catalog-required { color:#b42318; }
#<?php echo $form_id; ?> .catalog-input {
    width:100%; height:44px; padding:9px 12px; border:1.5px solid #d0d5dd; border-radius:10px;
    background:#fff; color:#172033; font-size:14px; outline:none;
}
#<?php echo $form_id; ?> .catalog-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
#<?php echo $form_id; ?> .catalog-help { display:block; margin-top:6px; color:#667085; font-size:12px; line-height:1.45; }
#<?php echo $form_id; ?> .catalog-toggle {
    display:flex; align-items:center; gap:12px; padding:13px 14px; border:1px solid #e5e7eb; border-radius:11px; background:#f8fafc; cursor:pointer;
}
#<?php echo $form_id; ?> .catalog-toggle input { width:20px; height:20px; margin:0; accent-color:#2563eb; }
#<?php echo $form_id; ?> .catalog-toggle strong { display:block; color:#344054; font-size:14px; }
#<?php echo $form_id; ?> .catalog-toggle span { display:block; margin-top:2px; color:#667085; font-size:12px; line-height:1.4; }
#<?php echo $form_id; ?> .catalog-error { display:none; margin:16px 0 0; padding:12px 14px; border:1px solid #fecaca; border-radius:10px; background:#fef2f2; color:#b42318; font-size:13px; }
#<?php echo $form_id; ?> .catalog-modal-footer { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px; border-top:1px solid #e5e7eb; background:#fff; }
#<?php echo $form_id; ?> .catalog-btn { min-height:40px; padding:8px 15px; border-radius:9px; font-size:14px; font-weight:700; }
#<?php echo $form_id; ?> .catalog-btn-cancel { border:1px solid #d0d5dd; background:#fff; color:#475467; }
#<?php echo $form_id; ?> .catalog-btn-save { border:1px solid #2563eb; background:#2563eb; color:#fff; }
#<?php echo $form_id; ?> .catalog-btn-save:hover, #<?php echo $form_id; ?> .catalog-btn-save:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
@media (max-width:767px) {
    #<?php echo $form_id; ?> .catalog-grid { grid-template-columns:1fr; gap:0; }
    #<?php echo $form_id; ?> .catalog-modal-header, #<?php echo $form_id; ?> .catalog-modal-body, #<?php echo $form_id; ?> .catalog-modal-footer { padding-left:18px; padding-right:18px; }
    #<?php echo $form_id; ?> .catalog-modal-footer { flex-direction:column-reverse; }
    #<?php echo $form_id; ?> .catalog-btn { width:100%; }
}
</style>

<form id="<?php echo $form_id; ?>" method="post" action="<?php echo $submit_url; ?>">
    <?php if ($this->security->get_csrf_token_name()): ?>
        <input type="hidden" name="<?php echo $this->security->get_csrf_token_name(); ?>" value="<?php echo $this->security->get_csrf_hash(); ?>">
    <?php endif; ?>

    <div class="modal-header catalog-modal-header">
        <button type="button" class="close catalog-modal-close" data-dismiss="modal" aria-label="Close">&times;</button>
        <div class="catalog-modal-heading">
            <div class="catalog-modal-icon"><i class="entypo-<?php echo $is_edit ? 'pencil' : 'plus'; ?>"></i></div>
            <div>
                <h4 class="catalog-modal-title"><?php echo $modal_title; ?></h4>
                <p class="catalog-modal-subtitle"><?php echo $is_edit ? get_phrase('update_conduct_item_details') : get_phrase('create_new_conduct_item_for_report_cards'); ?></p>
            </div>
        </div>
    </div>

    <div class="modal-body catalog-modal-body">
        <div class="catalog-form-card">
            <div class="catalog-grid">
                <div class="catalog-field">
                    <label class="catalog-label" for="conduct_name"><?php echo get_phrase('conduct_item_name'); ?> <span class="catalog-required">*</span></label>
                    <input type="text" class="catalog-input" id="conduct_name" name="name" maxlength="100" required
                           value="<?php echo $is_edit ? htmlspecialchars($conduct_item->name, ENT_QUOTES, 'UTF-8') : ''; ?>"
                           placeholder="<?php echo get_phrase('e_g_punctuality_respect_cooperation'); ?>">
                    <small class="catalog-help" id="conductNameHelp"><?php echo get_phrase('this_will_appear_on_student_report_cards'); ?> · <span id="conductNameCount"><?php echo $is_edit ? strlen($conduct_item->name) : 0; ?></span>/100</small>
                </div>

                <div class="catalog-field">
                    <label class="catalog-label" for="conduct_display_order"><?php echo get_phrase('display_order'); ?></label>
                    <input type="number" class="catalog-input" id="conduct_display_order" name="display_order" min="1"
                           value="<?php echo $is_edit ? (int) $conduct_item->display_order : ''; ?>"
                           placeholder="1">
                    <small class="catalog-help"><?php echo get_phrase('leave_blank_to_add_at_the_end_you_can_reorder_later'); ?></small>
                </div>
            </div>

            <div class="catalog-field">
                <label class="catalog-label"><?php echo get_phrase('visibility_status'); ?></label>
                <label class="catalog-toggle" for="conduct_is_active">
                    <input type="checkbox" id="conduct_is_active" name="is_active" value="1" <?php echo ($is_edit && $conduct_item->is_active) || !$is_edit ? 'checked' : ''; ?>>
                    <div>
                        <strong><?php echo get_phrase('active_item'); ?></strong>
                        <span><?php echo get_phrase('inactive_items_are_hidden_from_teachers_but_retained_in_database'); ?></span>
                    </div>
                </label>
            </div>
        </div>

        <div id="conduct-form-errors" class="catalog-error" role="alert"></div>
    </div>

    <div class="modal-footer catalog-modal-footer">
        <button type="button" class="btn catalog-btn catalog-btn-cancel" data-dismiss="modal"><i class="entypo-cancel"></i> <?php echo get_phrase('cancel'); ?></button>
        <button type="submit" class="btn catalog-btn catalog-btn-save" id="conduct-submit-btn"><i class="entypo-<?php echo $is_edit ? 'check' : 'plus'; ?>"></i> <?php echo $is_edit ? get_phrase('update') : get_phrase('save'); ?></button>
    </div>
</form>

<script type="text/javascript">
(function($) {
    var $form = $('#<?php echo $form_id; ?>');
    var $submit = $('#conduct-submit-btn');
    var $errors = $('#conduct-form-errors');
    var defaultSubmitHtml = $submit.html();

    function restoreSubmit() {
        $submit.prop('disabled', false).html(defaultSubmitHtml);
    }

    function refreshConductList() {
        return $.ajax({ url: '<?php echo site_url('admin/conduct_items'); ?>', type: 'GET' }).done(function(html) {
            var $html = $('<div>').append($.parseHTML(html, document, true));
            var $newBody = $html.find('#sortable-conduct-items');
            if ($newBody.length) $('#sortable-conduct-items').html($newBody.html());
            ['conductTotal','conductActive','conductInactive'].forEach(function(id) {
                var value = $html.find('#' + id).text();
                if (value !== '') $('#' + id).text(value);
            });
            if (window.initConductSortable) window.initConductSortable();
            if (window.refreshConductStatsFromRows) window.refreshConductStatsFromRows();
        });
    }

    $('#conduct_name').on('input', function() {
        $('#conductNameCount').text($(this).val().length);
    });

    $form.on('submit', function(e) {
        e.preventDefault();
        $errors.hide().empty();
        $submit.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('saving'); ?>...');

        $.ajax({
            url: $form.attr('action'),
            type: 'POST',
            data: $form.serialize(),
            dataType: 'json'
        }).done(function(response) {
            if (response.status !== 'success') {
                $errors.html(response.message || '<?php echo get_phrase('error_saving_conduct_item'); ?>').show();
                restoreSubmit();
                return;
            }

            $('#modal_ajax').modal('hide');
            refreshConductList().always(function() {
                toastr.success(response.message || '<?php echo get_phrase('updated_successfully'); ?>');
            });
        }).fail(function(xhr) {
            var message = '<?php echo get_phrase('error_saving_conduct_item'); ?>';
            try {
                var response = JSON.parse(xhr.responseText);
                if (response.message) message = response.message;
            } catch (ignore) {}
            $errors.html(message).show();
            restoreSubmit();
        });
    });

    setTimeout(function() { $('#conduct_name').focus(); }, 150);
})(jQuery);
</script>
