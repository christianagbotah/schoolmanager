<?php
$total_conduct_items = is_array($conduct_items) || $conduct_items instanceof Countable ? count($conduct_items) : 0;
$active_conduct_items = 0;
if (!empty($conduct_items)) {
    foreach ($conduct_items as $conduct_item_count) {
        if (!empty($conduct_item_count->is_active)) {
            $active_conduct_items++;
        }
    }
}
$inactive_conduct_items = $total_conduct_items - $active_conduct_items;
?>

<style>
.conduct-page { --cp-border:#e5e7eb; --cp-text:#172033; --cp-muted:#667085; }
.conduct-page .cp-hero,
.conduct-page .cp-stat,
.conduct-page .cp-info,
.conduct-page .cp-card {
    background:#fff;
    border:1px solid var(--cp-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.conduct-page .cp-hero { padding:24px; margin-bottom:16px; }
.conduct-page .cp-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.conduct-page .cp-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.conduct-page .cp-icon {
    width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center;
    border-radius:14px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:22px;
}
.conduct-page .cp-title { margin:0; color:var(--cp-text); font-size:26px; line-height:1.2; font-weight:700; }
.conduct-page .cp-subtitle { margin:6px 0 0; color:var(--cp-muted); font-size:15px; line-height:1.5; }
.conduct-page .cp-add {
    min-height:42px; padding:9px 15px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    border:1px solid #2563eb; border-radius:10px; background:#2563eb; color:#fff; font-size:14px; font-weight:700;
}
.conduct-page .cp-add:hover, .conduct-page .cp-add:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
.conduct-page .cp-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
.conduct-page .cp-stat { padding:15px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.conduct-page .cp-stat span { color:var(--cp-muted); font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; }
.conduct-page .cp-stat strong { color:var(--cp-text); font-size:24px; line-height:1; }
.conduct-page .cp-info { padding:16px 18px; margin-bottom:16px; display:flex; align-items:flex-start; gap:12px; }
.conduct-page .cp-info-icon {
    width:36px; height:36px; flex:0 0 36px; display:flex; align-items:center; justify-content:center;
    border-radius:10px; background:#f0f9ff; border:1px solid #bae6fd; color:#0369a1;
}
.conduct-page .cp-info h4 { margin:0 0 5px; color:var(--cp-text); font-size:15px; font-weight:700; }
.conduct-page .cp-info p { margin:0; color:var(--cp-muted); font-size:14px; line-height:1.55; }
.conduct-page .cp-card { overflow:hidden; }
.conduct-page .cp-card-head { padding:16px 18px; border-bottom:1px solid var(--cp-border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.conduct-page .cp-card-head h3 { margin:0; color:var(--cp-text); font-size:17px; font-weight:700; }
.conduct-page .cp-card-head span { color:var(--cp-muted); font-size:13px; }
.conduct-page .cp-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.conduct-page #conduct-items-table { width:100%; min-width:820px; margin:0; }
.conduct-page #conduct-items-table thead th {
    background:#f8fafc; border-color:var(--cp-border); color:#475467; padding:12px 10px; font-size:13px; font-weight:700; vertical-align:middle;
}
.conduct-page #conduct-items-table tbody td { border-color:var(--cp-border); color:#344054; padding:12px 10px; font-size:14px; vertical-align:middle; }
.conduct-page #conduct-items-table tbody tr[data-id]:hover { background:#f9fbfd; }
.conduct-page .cp-drag { width:42px; text-align:center; cursor:grab; color:#98a2b3; }
.conduct-page .cp-drag:active { cursor:grabbing; }
.conduct-page .cp-order {
    display:inline-flex; align-items:center; justify-content:center; min-width:48px; min-height:32px; padding:5px 10px;
    border-radius:999px; background:#eef4ff; border:1px solid #d7e5ff; color:#1d4ed8; font-size:13px; font-weight:700;
}
.conduct-page .cp-name { color:var(--cp-text); font-size:14px; font-weight:700; }
.conduct-page .cp-status {
    display:inline-flex; align-items:center; gap:6px; min-height:32px; padding:6px 10px; border-radius:999px;
    font-size:12px; font-weight:700; white-space:nowrap;
}
.conduct-page .cp-status.is-active { background:#ecfdf3; border:1px solid #abefc6; color:#067647; }
.conduct-page .cp-status.is-inactive { background:#f8fafc; border:1px solid #d0d5dd; color:#667085; }
.conduct-page .cp-actions { display:flex; align-items:center; justify-content:center; gap:7px; }
.conduct-page .cp-action {
    width:38px; height:38px; padding:0; display:inline-flex; align-items:center; justify-content:center;
    border-radius:9px; background:#fff; border:1px solid #d0d5dd; color:#475467; cursor:pointer;
}
.conduct-page .cp-action:hover, .conduct-page .cp-action:focus { background:#f8fafc; color:#172033; border-color:#98a2b3; }
.conduct-page .cp-action.is-edit { color:#1d4ed8; border-color:#bfdbfe; background:#eff6ff; }
.conduct-page .cp-action.is-delete { color:#b42318; border-color:#fecaca; background:#fef2f2; }
.conduct-page .cp-empty { padding:44px 20px !important; text-align:center; color:var(--cp-muted) !important; }
.conduct-page .cp-empty i { display:block; font-size:38px; color:#cbd5e1; margin-bottom:10px; }
.conduct-page .ui-sortable-helper { background:#fff !important; box-shadow:0 12px 24px rgba(16,24,40,.14) !important; }
.conduct-page .ui-state-highlight { height:58px; background:#eff6ff !important; border:1px dashed #60a5fa !important; }
@media (max-width:767px) {
    .conduct-page .cp-hero { padding:18px; }
    .conduct-page .cp-hero-row { flex-direction:column; align-items:flex-start; }
    .conduct-page .cp-add { width:100%; }
    .conduct-page .cp-title { font-size:22px; }
    .conduct-page .cp-stats { grid-template-columns:1fr; }
    .conduct-page .cp-info { padding:14px; }
}
</style>

<div class="conduct-page">
    <section class="cp-hero" aria-labelledby="conductPageTitle">
        <div class="cp-hero-row">
            <div class="cp-title-wrap">
                <div class="cp-icon" aria-hidden="true"><i class="entypo-list"></i></div>
                <div>
                    <h2 class="cp-title" id="conductPageTitle"><?php echo get_phrase('manage_conduct_items'); ?></h2>
                    <p class="cp-subtitle"><?php echo get_phrase('configure_conduct_items_for_report_cards'); ?></p>
                </div>
            </div>
            <button type="button" class="cp-add" id="add-conduct-item"><i class="entypo-plus"></i><?php echo get_phrase('add_new_item'); ?></button>
        </div>
    </section>

    <div class="cp-stats" id="conductStats">
        <div class="cp-stat"><span><?php echo get_phrase('total_items'); ?></span><strong id="conductTotal"><?php echo (int) $total_conduct_items; ?></strong></div>
        <div class="cp-stat"><span><?php echo get_phrase('active'); ?></span><strong id="conductActive"><?php echo (int) $active_conduct_items; ?></strong></div>
        <div class="cp-stat"><span><?php echo get_phrase('inactive'); ?></span><strong id="conductInactive"><?php echo (int) $inactive_conduct_items; ?></strong></div>
    </div>

    <div class="cp-info">
        <div class="cp-info-icon"><i class="entypo-info"></i></div>
        <div>
            <h4><?php echo get_phrase('how_this_list_works'); ?></h4>
            <p>Drag a row by its handle to reorder it. Active items are available to teachers on report cards; inactive items remain stored but are hidden. Edit, activate/deactivate or delete an item from the action buttons.</p>
        </div>
    </div>

    <section class="cp-card" aria-label="Conduct items list">
        <div class="cp-card-head">
            <h3><?php echo get_phrase('conduct_items'); ?></h3>
            <span><?php echo get_phrase('drag_to_reorder'); ?></span>
        </div>
        <div class="cp-table-wrap">
            <table class="table table-bordered" id="conduct-items-table">
                <thead>
                    <tr>
                        <th style="width:52px;"></th>
                        <th style="width:90px;"><?php echo get_phrase('order'); ?></th>
                        <th><?php echo get_phrase('conduct_item_name'); ?></th>
                        <th style="width:120px;"><?php echo get_phrase('status'); ?></th>
                        <th style="width:130px;" class="text-center"><?php echo get_phrase('created_at'); ?></th>
                        <th style="width:150px;" class="text-center"><?php echo get_phrase('actions'); ?></th>
                    </tr>
                </thead>
                <tbody id="sortable-conduct-items">
                    <?php if (!empty($conduct_items)): ?>
                        <?php foreach ($conduct_items as $item): ?>
                            <tr data-id="<?php echo (int) $item->id; ?>" data-active="<?php echo (int) $item->is_active; ?>">
                                <td class="cp-drag drag-handle" title="<?php echo get_phrase('drag_to_reorder'); ?>"><i class="entypo-menu"></i></td>
                                <td><span class="cp-order order-badge">#<?php echo (int) $item->display_order; ?></span></td>
                                <td><span class="cp-name"><?php echo htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8'); ?></span></td>
                                <td class="status-cell">
                                    <?php if ($item->is_active): ?>
                                        <span class="cp-status is-active"><i class="entypo-check"></i><?php echo get_phrase('active'); ?></span>
                                    <?php else: ?>
                                        <span class="cp-status is-inactive"><i class="entypo-cancel"></i><?php echo get_phrase('inactive'); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center"><?php echo htmlspecialchars(date('d M Y', strtotime($item->created_at)), ENT_QUOTES, 'UTF-8'); ?></td>
                                <td>
                                    <div class="cp-actions">
                                        <button type="button" class="cp-action toggle-conduct-status" data-id="<?php echo (int) $item->id; ?>" data-status="<?php echo (int) $item->is_active; ?>" data-name="<?php echo htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8'); ?>" title="<?php echo $item->is_active ? get_phrase('deactivate') : get_phrase('activate'); ?>"><i class="entypo-<?php echo $item->is_active ? 'eye-off' : 'eye'; ?>"></i></button>
                                        <button type="button" class="cp-action is-edit edit-conduct-item" data-id="<?php echo (int) $item->id; ?>" title="<?php echo get_phrase('edit'); ?>"><i class="entypo-pencil"></i></button>
                                        <button type="button" class="cp-action is-delete delete-conduct-item" data-id="<?php echo (int) $item->id; ?>" data-name="<?php echo htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8'); ?>" title="<?php echo get_phrase('delete'); ?>"><i class="entypo-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr class="empty-row"><td colspan="6" class="cp-empty"><i class="entypo-info"></i><strong><?php echo get_phrase('no_conduct_items_found'); ?></strong><div><?php echo get_phrase('click_add_to_create_first_item'); ?></div></td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </section>
</div>

<script src="<?php echo base_url('assets/js/jquery-ui/js/jquery-ui-1.10.3.custom.min.js'); ?>"></script>
<script type="text/javascript">
(function($) {
    function cleanupModalBackdrop() {
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css('padding-right', '');
    }

    function renderConductEmptyState() {
        if ($('#sortable-conduct-items tr[data-id]').length === 0) {
            $('#sortable-conduct-items').html('<tr class="empty-row"><td colspan="6" class="cp-empty"><i class="entypo-info"></i><strong><?php echo get_phrase('no_conduct_items_found'); ?></strong><div><?php echo get_phrase('click_add_to_create_first_item'); ?></div></td></tr>');
        }
    }

    window.refreshConductStatsFromRows = function() {
        var total = $('#sortable-conduct-items tr[data-id]').length;
        var active = $('#sortable-conduct-items tr[data-id][data-active="1"]').length;
        $('#conductTotal').text(total);
        $('#conductActive').text(active);
        $('#conductInactive').text(total - active);
    };

    window.initConductSortable = function() {
        var $body = $('#sortable-conduct-items');
        if (!$body.length || !$.fn.sortable) return;
        if ($body.hasClass('ui-sortable')) {
            try { $body.sortable('destroy'); } catch (e) {}
        }
        $body.sortable({
            items: 'tr[data-id]',
            handle: '.drag-handle',
            axis: 'y',
            placeholder: 'ui-state-highlight',
            helper: function(e, tr) {
                var $originals = tr.children();
                var $helper = tr.clone();
                $helper.children().each(function(index) { $(this).width($originals.eq(index).width()); });
                return $helper;
            },
            update: function() {
                var orderMap = {};
                $body.find('tr[data-id]').each(function(index) {
                    orderMap[$(this).data('id')] = index + 1;
                    $(this).find('.order-badge').text('#' + (index + 1));
                });
                $.ajax({
                    url: '<?php echo site_url('admin/conduct_items/reorder'); ?>',
                    type: 'POST',
                    data: { order_map: orderMap },
                    dataType: 'json'
                }).done(function(response) {
                    if (response.status === 'success') toastr.success(response.message || '<?php echo get_phrase('order_updated_successfully'); ?>');
                    else toastr.error(response.message || '<?php echo get_phrase('error_updating_order'); ?>');
                }).fail(function() {
                    toastr.error('<?php echo get_phrase('error_updating_order'); ?>');
                });
            }
        });
    };

    function loadConductForm(itemId) {
        $('#modal_ajax .modal-body').html('<div style="padding:36px;text-align:center;color:#667085;"><i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('loading'); ?>...</div>');
        $('#modal_ajax').modal('show', {backdrop: 'static'});
        $.ajax({
            url: '<?php echo site_url('admin/conduct_items/get_form'); ?>',
            type: 'POST',
            data: itemId ? { id: itemId } : {}
        }).done(function(response) {
            $('#modal_ajax .modal-body').html(response);
        }).fail(function() {
            $('#modal_ajax .modal-body').html('<div class="alert alert-danger" style="margin:20px;">Unable to load the form. Please try again.</div>');
        });
    }

    $('#add-conduct-item').on('click', function() { loadConductForm(null); });
    $(document).on('click', '.edit-conduct-item', function() { loadConductForm($(this).data('id')); });

    $(document).on('click', '.toggle-conduct-status', function() {
        var $button = $(this);
        var $row = $button.closest('tr[data-id]');
        var itemId = $button.data('id');
        var itemName = $button.data('name');
        var currentStatus = parseInt($button.data('status'), 10) || 0;
        var actionText = currentStatus === 1 ? '<?php echo get_phrase('deactivate'); ?>' : '<?php echo get_phrase('activate'); ?>';

        showConfirmModal('<?php echo get_phrase('confirm_action'); ?>', '<?php echo get_phrase('are_you_sure_you_want_to'); ?> <strong>' + actionText.toLowerCase() + '</strong> "<strong>' + itemName + '</strong>"?', function() {
            showAjaxModal_alert('<?php echo get_phrase('processing'); ?>...', 'loading', false, false);
            $.ajax({
                url: '<?php echo site_url('admin/conduct_items/toggle'); ?>/' + itemId,
                type: 'POST',
                dataType: 'json'
            }).done(function(response) {
                $('#modal_alert').modal('hide');
                cleanupModalBackdrop();
                if (response.status !== 'success') {
                    toastr.error(response.message || '<?php echo get_phrase('error_toggling_status'); ?>');
                    return;
                }
                var isActive = parseInt(response.new_status, 10) === 1;
                $row.attr('data-active', isActive ? '1' : '0');
                $row.find('.status-cell').html(isActive ? '<span class="cp-status is-active"><i class="entypo-check"></i><?php echo get_phrase('active'); ?></span>' : '<span class="cp-status is-inactive"><i class="entypo-cancel"></i><?php echo get_phrase('inactive'); ?></span>');
                $button.data('status', isActive ? 1 : 0).attr('title', isActive ? '<?php echo get_phrase('deactivate'); ?>' : '<?php echo get_phrase('activate'); ?>');
                $button.find('i').attr('class', isActive ? 'entypo-eye-off' : 'entypo-eye');
                refreshConductStatsFromRows();
                toastr.success(response.message || '<?php echo get_phrase('updated_successfully'); ?>');
            }).fail(function() {
                $('#modal_alert').modal('hide');
                cleanupModalBackdrop();
                toastr.error('<?php echo get_phrase('error_toggling_status'); ?>');
            });
        }, '<?php echo get_phrase('confirm'); ?>', 'warning');
    });

    $(document).on('click', '.delete-conduct-item', function() {
        var $row = $(this).closest('tr[data-id]');
        var itemId = $(this).data('id');
        var itemName = $(this).data('name');
        showConfirmModal('<?php echo get_phrase('delete_confirmation'); ?>', '<?php echo get_phrase('are_you_sure_you_want_to_delete'); ?> "<strong>' + itemName + '</strong>"?<br><br><span style="color:#b42318;"><?php echo get_phrase('this_action_cannot_be_undone'); ?></span>', function() {
            showAjaxModal_alert('<?php echo get_phrase('deleting'); ?>...', 'loading', false, false);
            $.ajax({
                url: '<?php echo site_url('admin/conduct_items/delete'); ?>/' + itemId,
                type: 'POST',
                dataType: 'json'
            }).done(function(response) {
                $('#modal_alert').modal('hide');
                cleanupModalBackdrop();
                if (response.status !== 'success') {
                    toastr.error(response.message || '<?php echo get_phrase('error_deleting_item'); ?>');
                    return;
                }
                $row.fadeOut(180, function() {
                    $(this).remove();
                    renderConductEmptyState();
                    refreshConductStatsFromRows();
                    initConductSortable();
                });
                toastr.success(response.message || '<?php echo get_phrase('item_deleted_successfully'); ?>');
            }).fail(function() {
                $('#modal_alert').modal('hide');
                cleanupModalBackdrop();
                toastr.error('<?php echo get_phrase('error_deleting_item'); ?>');
            });
        }, '<?php echo get_phrase('delete'); ?>', 'danger');
    });

    $(function() {
        initConductSortable();
        refreshConductStatsFromRows();
    });
})(jQuery);
</script>
