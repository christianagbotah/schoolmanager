<?php
$total_interest_items = is_array($interest_items) || $interest_items instanceof Countable ? count($interest_items) : 0;
$active_interest_items = 0;
if (!empty($interest_items)) {
    foreach ($interest_items as $interest_item_count) {
        if (!empty($interest_item_count->is_active)) {
            $active_interest_items++;
        }
    }
}
$inactive_interest_items = $total_interest_items - $active_interest_items;
?>

<style>
.interest-page { --ip-border:#e5e7eb; --ip-text:#172033; --ip-muted:#667085; }
.interest-page .ip-hero,
.interest-page .ip-stat,
.interest-page .ip-info,
.interest-page .ip-card {
    background:#fff;
    border:1px solid var(--ip-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.interest-page .ip-hero { padding:24px; margin-bottom:16px; }
.interest-page .ip-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.interest-page .ip-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.interest-page .ip-icon {
    width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center;
    border-radius:14px; background:#fff7ed; border:1px solid #fed7aa; color:#c2410c; font-size:22px;
}
.interest-page .ip-title { margin:0; color:var(--ip-text); font-size:26px; line-height:1.2; font-weight:700; }
.interest-page .ip-subtitle { margin:6px 0 0; color:var(--ip-muted); font-size:15px; line-height:1.5; }
.interest-page .ip-add {
    min-height:42px; padding:9px 15px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    border:1px solid #2563eb; border-radius:10px; background:#2563eb; color:#fff; font-size:14px; font-weight:700;
}
.interest-page .ip-add:hover, .interest-page .ip-add:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
.interest-page .ip-stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-bottom:16px; }
.interest-page .ip-stat { padding:15px 16px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
.interest-page .ip-stat span { color:var(--ip-muted); font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.02em; }
.interest-page .ip-stat strong { color:var(--ip-text); font-size:24px; line-height:1; }
.interest-page .ip-info { padding:16px 18px; margin-bottom:16px; display:flex; align-items:flex-start; gap:12px; }
.interest-page .ip-info-icon {
    width:36px; height:36px; flex:0 0 36px; display:flex; align-items:center; justify-content:center;
    border-radius:10px; background:#fff7ed; border:1px solid #fed7aa; color:#c2410c;
}
.interest-page .ip-info h4 { margin:0 0 5px; color:var(--ip-text); font-size:15px; font-weight:700; }
.interest-page .ip-info p { margin:0; color:var(--ip-muted); font-size:14px; line-height:1.55; }
.interest-page .ip-card { overflow:hidden; }
.interest-page .ip-card-head { padding:16px 18px; border-bottom:1px solid var(--ip-border); display:flex; align-items:center; justify-content:space-between; gap:12px; }
.interest-page .ip-card-head h3 { margin:0; color:var(--ip-text); font-size:17px; font-weight:700; }
.interest-page .ip-card-head span { color:var(--ip-muted); font-size:13px; }
.interest-page .ip-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.interest-page #interest-items-table { width:100%; min-width:820px; margin:0; }
.interest-page #interest-items-table thead th {
    background:#f8fafc; border-color:var(--ip-border); color:#475467; padding:12px 10px; font-size:13px; font-weight:700; vertical-align:middle;
}
.interest-page #interest-items-table tbody td { border-color:var(--ip-border); color:#344054; padding:12px 10px; font-size:14px; vertical-align:middle; }
.interest-page #interest-items-table tbody tr[data-id]:hover { background:#f9fbfd; }
.interest-page .ip-drag { width:42px; text-align:center; cursor:grab; color:#98a2b3; }
.interest-page .ip-drag:active { cursor:grabbing; }
.interest-page .ip-order {
    display:inline-flex; align-items:center; justify-content:center; min-width:48px; min-height:32px; padding:5px 10px;
    border-radius:999px; background:#eef4ff; border:1px solid #d7e5ff; color:#1d4ed8; font-size:13px; font-weight:700;
}
.interest-page .ip-name { color:var(--ip-text); font-size:14px; font-weight:700; }
.interest-page .ip-status {
    display:inline-flex; align-items:center; gap:6px; min-height:32px; padding:6px 10px; border-radius:999px;
    font-size:12px; font-weight:700; white-space:nowrap;
}
.interest-page .ip-status.is-active { background:#ecfdf3; border:1px solid #abefc6; color:#067647; }
.interest-page .ip-status.is-inactive { background:#f8fafc; border:1px solid #d0d5dd; color:#667085; }
.interest-page .ip-actions { display:flex; align-items:center; justify-content:center; gap:7px; }
.interest-page .ip-action {
    width:38px; height:38px; padding:0; display:inline-flex; align-items:center; justify-content:center;
    border-radius:9px; background:#fff; border:1px solid #d0d5dd; color:#475467; cursor:pointer;
}
.interest-page .ip-action:hover, .interest-page .ip-action:focus { background:#f8fafc; color:#172033; border-color:#98a2b3; }
.interest-page .ip-action.is-edit { color:#1d4ed8; border-color:#bfdbfe; background:#eff6ff; }
.interest-page .ip-action.is-delete { color:#b42318; border-color:#fecaca; background:#fef2f2; }
.interest-page .ip-empty { padding:44px 20px !important; text-align:center; color:var(--ip-muted) !important; }
.interest-page .ip-empty i { display:block; font-size:38px; color:#cbd5e1; margin-bottom:10px; }
.interest-page .ui-sortable-helper { background:#fff !important; box-shadow:0 12px 24px rgba(16,24,40,.14) !important; }
.interest-page .ui-state-highlight { height:58px; background:#eff6ff !important; border:1px dashed #60a5fa !important; }
@media (max-width:767px) {
    .interest-page .ip-hero { padding:18px; }
    .interest-page .ip-hero-row { flex-direction:column; align-items:flex-start; }
    .interest-page .ip-add { width:100%; }
    .interest-page .ip-title { font-size:22px; }
    .interest-page .ip-stats { grid-template-columns:1fr; }
    .interest-page .ip-info { padding:14px; }
}
</style>

<div class="interest-page">
    <section class="ip-hero" aria-labelledby="interestPageTitle">
        <div class="ip-hero-row">
            <div class="ip-title-wrap">
                <div class="ip-icon" aria-hidden="true"><i class="entypo-star"></i></div>
                <div>
                    <h2 class="ip-title" id="interestPageTitle"><?php echo get_phrase('manage_interest_items'); ?></h2>
                    <p class="ip-subtitle"><?php echo get_phrase('configure_interest_items_for_report_cards'); ?></p>
                </div>
            </div>
            <button type="button" class="ip-add" id="add-interest-item"><i class="entypo-plus"></i><?php echo get_phrase('add_new_interest_item'); ?></button>
        </div>
    </section>

    <div class="ip-stats" id="interestStats">
        <div class="ip-stat"><span><?php echo get_phrase('total_items'); ?></span><strong id="interestTotal"><?php echo (int) $total_interest_items; ?></strong></div>
        <div class="ip-stat"><span><?php echo get_phrase('active'); ?></span><strong id="interestActive"><?php echo (int) $active_interest_items; ?></strong></div>
        <div class="ip-stat"><span><?php echo get_phrase('inactive'); ?></span><strong id="interestInactive"><?php echo (int) $inactive_interest_items; ?></strong></div>
    </div>

    <div class="ip-info">
        <div class="ip-info-icon"><i class="entypo-info"></i></div>
        <div>
            <h4><?php echo get_phrase('how_this_list_works'); ?></h4>
            <p>Drag a row by its handle to reorder it. Active interests are available to teachers when completing report cards; inactive items remain stored but hidden. A student can have a maximum of five interests selected.</p>
        </div>
    </div>

    <section class="ip-card" aria-label="Interest items list">
        <div class="ip-card-head">
            <h3><?php echo get_phrase('interest_items'); ?></h3>
            <span><?php echo get_phrase('drag_to_reorder'); ?></span>
        </div>
        <div class="ip-table-wrap">
            <table class="table table-bordered" id="interest-items-table">
                <thead>
                    <tr>
                        <th style="width:52px;"></th>
                        <th style="width:90px;"><?php echo get_phrase('order'); ?></th>
                        <th><?php echo get_phrase('interest_item_name'); ?></th>
                        <th style="width:120px;"><?php echo get_phrase('status'); ?></th>
                        <th style="width:130px;" class="text-center"><?php echo get_phrase('created_at'); ?></th>
                        <th style="width:150px;" class="text-center"><?php echo get_phrase('actions'); ?></th>
                    </tr>
                </thead>
                <tbody id="sortable-interest-items">
                    <?php if (!empty($interest_items)): ?>
                        <?php foreach ($interest_items as $item): ?>
                            <tr data-id="<?php echo (int) $item->id; ?>" data-active="<?php echo (int) $item->is_active; ?>">
                                <td class="ip-drag drag-handle" title="<?php echo get_phrase('drag_to_reorder'); ?>"><i class="entypo-menu"></i></td>
                                <td><span class="ip-order order-badge">#<?php echo (int) $item->display_order; ?></span></td>
                                <td><span class="ip-name"><?php echo htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8'); ?></span></td>
                                <td class="status-cell">
                                    <?php if ($item->is_active): ?>
                                        <span class="ip-status is-active"><i class="entypo-check"></i><?php echo get_phrase('active'); ?></span>
                                    <?php else: ?>
                                        <span class="ip-status is-inactive"><i class="entypo-cancel"></i><?php echo get_phrase('inactive'); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center"><?php echo htmlspecialchars(date('d M Y', strtotime($item->created_at)), ENT_QUOTES, 'UTF-8'); ?></td>
                                <td>
                                    <div class="ip-actions">
                                        <button type="button" class="ip-action toggle-interest-status" data-id="<?php echo (int) $item->id; ?>" data-status="<?php echo (int) $item->is_active; ?>" data-name="<?php echo htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8'); ?>" title="<?php echo $item->is_active ? get_phrase('deactivate') : get_phrase('activate'); ?>"><i class="entypo-<?php echo $item->is_active ? 'eye-off' : 'eye'; ?>"></i></button>
                                        <button type="button" class="ip-action is-edit edit-interest-item" data-id="<?php echo (int) $item->id; ?>" title="<?php echo get_phrase('edit'); ?>"><i class="entypo-pencil"></i></button>
                                        <button type="button" class="ip-action is-delete delete-interest-item" data-id="<?php echo (int) $item->id; ?>" data-name="<?php echo htmlspecialchars($item->name, ENT_QUOTES, 'UTF-8'); ?>" title="<?php echo get_phrase('delete'); ?>"><i class="entypo-trash"></i></button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr class="empty-row"><td colspan="6" class="ip-empty"><i class="entypo-info"></i><strong><?php echo get_phrase('no_interest_items_found'); ?></strong><div><?php echo get_phrase('click_add_to_create_first_item'); ?></div></td></tr>
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

    function renderInterestEmptyState() {
        if ($('#sortable-interest-items tr[data-id]').length === 0) {
            $('#sortable-interest-items').html('<tr class="empty-row"><td colspan="6" class="ip-empty"><i class="entypo-info"></i><strong><?php echo get_phrase('no_interest_items_found'); ?></strong><div><?php echo get_phrase('click_add_to_create_first_item'); ?></div></td></tr>');
        }
    }

    window.refreshInterestStatsFromRows = function() {
        var total = $('#sortable-interest-items tr[data-id]').length;
        var active = $('#sortable-interest-items tr[data-id][data-active="1"]').length;
        $('#interestTotal').text(total);
        $('#interestActive').text(active);
        $('#interestInactive').text(total - active);
    };

    window.initInterestSortable = function() {
        var $body = $('#sortable-interest-items');
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
                    url: '<?php echo site_url('admin/interest_items/reorder'); ?>',
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

    function loadInterestForm(itemId) {
        $('#modal_ajax .modal-body').html('<div style="padding:36px;text-align:center;color:#667085;"><i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('loading'); ?>...</div>');
        $('#modal_ajax').modal('show', {backdrop: 'static'});
        $.ajax({
            url: '<?php echo site_url('admin/interest_items/get_form'); ?>',
            type: 'POST',
            data: itemId ? { id: itemId } : {}
        }).done(function(response) {
            $('#modal_ajax .modal-body').html(response);
        }).fail(function() {
            $('#modal_ajax .modal-body').html('<div class="alert alert-danger" style="margin:20px;">Unable to load the form. Please try again.</div>');
        });
    }

    $('#add-interest-item').on('click', function() { loadInterestForm(null); });
    $(document).on('click', '.edit-interest-item', function() { loadInterestForm($(this).data('id')); });

    $(document).on('click', '.toggle-interest-status', function() {
        var $button = $(this);
        var $row = $button.closest('tr[data-id]');
        var itemId = $button.data('id');
        var itemName = $button.data('name');
        var currentStatus = parseInt($button.data('status'), 10) || 0;
        var actionText = currentStatus === 1 ? '<?php echo get_phrase('deactivate'); ?>' : '<?php echo get_phrase('activate'); ?>';

        showConfirmModal('<?php echo get_phrase('confirm_action'); ?>', '<?php echo get_phrase('are_you_sure_you_want_to'); ?> <strong>' + actionText.toLowerCase() + '</strong> "<strong>' + itemName + '</strong>"?', function() {
            showAjaxModal_alert('<?php echo get_phrase('processing'); ?>...', 'loading', false, false);
            $.ajax({
                url: '<?php echo site_url('admin/interest_items/toggle'); ?>/' + itemId,
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
                $row.find('.status-cell').html(isActive ? '<span class="ip-status is-active"><i class="entypo-check"></i><?php echo get_phrase('active'); ?></span>' : '<span class="ip-status is-inactive"><i class="entypo-cancel"></i><?php echo get_phrase('inactive'); ?></span>');
                $button.data('status', isActive ? 1 : 0).attr('title', isActive ? '<?php echo get_phrase('deactivate'); ?>' : '<?php echo get_phrase('activate'); ?>');
                $button.find('i').attr('class', isActive ? 'entypo-eye-off' : 'entypo-eye');
                refreshInterestStatsFromRows();
                toastr.success(response.message || '<?php echo get_phrase('updated_successfully'); ?>');
            }).fail(function() {
                $('#modal_alert').modal('hide');
                cleanupModalBackdrop();
                toastr.error('<?php echo get_phrase('error_toggling_status'); ?>');
            });
        }, '<?php echo get_phrase('confirm'); ?>', 'warning');
    });

    $(document).on('click', '.delete-interest-item', function() {
        var $row = $(this).closest('tr[data-id]');
        var itemId = $(this).data('id');
        var itemName = $(this).data('name');
        showConfirmModal('<?php echo get_phrase('delete_confirmation'); ?>', '<?php echo get_phrase('are_you_sure_you_want_to_delete'); ?> "<strong>' + itemName + '</strong>"?<br><br><span style="color:#b42318;"><?php echo get_phrase('this_action_cannot_be_undone'); ?></span>', function() {
            showAjaxModal_alert('<?php echo get_phrase('deleting'); ?>...', 'loading', false, false);
            $.ajax({
                url: '<?php echo site_url('admin/interest_items/delete'); ?>/' + itemId,
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
                    renderInterestEmptyState();
                    refreshInterestStatsFromRows();
                    initInterestSortable();
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
        initInterestSortable();
        refreshInterestStatsFromRows();
    });
})(jQuery);
</script>
