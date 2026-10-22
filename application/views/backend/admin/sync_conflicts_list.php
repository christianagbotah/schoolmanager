<?php
$conflicts = $conflicts ?? [];
$counts_by_table = $counts_by_table ?? [];
$stats = $stats ?? ['pending' => 0, 'resolved' => 0, 'ignored' => 0, 'by_table' => []];
$filters = $filters ?? [];
?>

<div class="row">
    <div class="col-lg-12">
        <div class="panel panel-default">
            <div class="panel-heading">
                <div class="panel-title">
                    <i class="fa fa-exclamation-triangle"></i> <?php echo get_phrase('sync_conflicts'); ?>
                    <span class="badge badge-warning"><?php echo (int) ($stats['pending'] ?? 0); ?> pending</span>
                </div>
            </div>
            <div class="panel-body">
                <div class="row" style="margin-bottom: 20px;">
                    <div class="col-sm-4"><div class="well well-sm"><strong>Pending:</strong> <?php echo (int) ($stats['pending'] ?? 0); ?></div></div>
                    <div class="col-sm-4"><div class="well well-sm"><strong>Resolved:</strong> <?php echo (int) ($stats['resolved'] ?? 0); ?></div></div>
                    <div class="col-sm-4"><div class="well well-sm"><strong>Ignored:</strong> <?php echo (int) ($stats['ignored'] ?? 0); ?></div></div>
                </div>

                <form method="get" action="<?php echo site_url('sync_conflicts'); ?>" class="form-inline" style="margin-bottom: 20px;">
                    <div class="form-group">
                        <label for="tableFilter">Table&nbsp;</label>
                        <select id="tableFilter" name="table" class="form-control">
                            <option value="">All tables</option>
                            <?php foreach ($counts_by_table as $table => $count): ?>
                                <option value="<?php echo htmlspecialchars($table); ?>" <?php echo (($filters['table_name'] ?? '') === $table) ? 'selected' : ''; ?>><?php echo htmlspecialchars($table); ?> (<?php echo (int) $count; ?>)</option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <button class="btn btn-default" type="submit"><i class="fa fa-filter"></i> Filter</button>
                </form>

                <?php if (empty($conflicts)): ?>
                    <div class="alert alert-success"><i class="fa fa-check-circle"></i> No pending sync conflicts match the current filter.</div>
                <?php else: ?>
                    <div class="form-inline" style="margin-bottom: 12px;">
                        <label for="bulkResolution">Bulk action&nbsp;</label>
                        <select id="bulkResolution" class="form-control">
                            <option value="">Choose action</option>
                            <option value="local_wins">Keep local</option>
                            <option value="remote_wins">Keep remote</option>
                            <option value="ignore">Ignore</option>
                        </select>
                        <button type="button" class="btn btn-primary" onclick="bulkResolve()"><i class="fa fa-check"></i> Apply to selected</button>
                    </div>

                    <div class="table-responsive">
                        <table class="table table-striped table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th width="35"><input type="checkbox" id="selectAll" aria-label="Select all conflicts"></th>
                                    <th>ID</th><th>Table</th><th>Record</th><th>Local device</th><th>Remote device</th><th>Detected</th><th width="250">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($conflicts as $conflict): $id = (int) ($conflict['id'] ?? 0); ?>
                                    <tr>
                                        <td><input type="checkbox" class="conflict-checkbox" value="<?php echo $id; ?>" aria-label="Select conflict <?php echo $id; ?>"></td>
                                        <td><?php echo $id; ?></td>
                                        <td><code><?php echo htmlspecialchars($conflict['table_name'] ?? ''); ?></code></td>
                                        <td><?php echo htmlspecialchars($conflict['record_id'] ?? ''); ?></td>
                                        <td><?php echo htmlspecialchars($conflict['local_device_id'] ?? ''); ?></td>
                                        <td><?php echo htmlspecialchars($conflict['remote_device_id'] ?? ''); ?></td>
                                        <td><?php echo !empty($conflict['created_at']) ? htmlspecialchars($conflict['created_at']) : ''; ?></td>
                                        <td>
                                            <a class="btn btn-default btn-xs" href="<?php echo site_url('sync_conflicts/view/' . $id); ?>" title="View details"><i class="fa fa-eye"></i></a>
                                            <a class="btn btn-info btn-xs" href="<?php echo site_url('sync_conflicts/merge_view/' . $id); ?>" title="Merge"><i class="fa fa-code-fork"></i></a>
                                            <button type="button" class="btn btn-warning btn-xs" onclick="quickResolve(<?php echo $id; ?>, 'local')" title="Keep local"><i class="fa fa-arrow-left"></i></button>
                                            <button type="button" class="btn btn-primary btn-xs" onclick="quickResolve(<?php echo $id; ?>, 'remote')" title="Keep remote"><i class="fa fa-arrow-right"></i></button>
                                            <button type="button" class="btn btn-default btn-xs" onclick="quickResolve(<?php echo $id; ?>, 'ignore')" title="Ignore"><i class="fa fa-ban"></i></button>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<script>
const csrfTokenName = <?php echo json_encode($csrf_token_name); ?>;
const csrfTokenHash = <?php echo json_encode($csrf_token_hash); ?>;

$('#selectAll').on('change', function () {
    $('.conflict-checkbox').prop('checked', this.checked);
});

function mutationData(extra) {
    var data = extra || {};
    data[csrfTokenName] = csrfTokenHash;
    return data;
}

function quickResolve(id, resolution) {
    var route = resolution === 'local' ? 'keep_local' : (resolution === 'remote' ? 'keep_remote' : 'ignore');
    var label = resolution === 'local' ? 'apply the local version' : (resolution === 'remote' ? 'apply the remote version' : 'ignore this conflict');
    if (!window.confirm('Are you sure you want to ' + label + '?')) return;

    $.ajax({
        url: '<?php echo site_url('sync_conflicts'); ?>/' + route + '/' + id,
        type: 'POST',
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        data: mutationData({}),
        dataType: 'json'
    }).done(function (response) {
        if (response.success) { window.location.reload(); return; }
        window.alert(response.message || 'Conflict resolution failed.');
    }).fail(function (xhr) {
        var response = xhr.responseJSON || {};
        window.alert(response.message || 'Conflict resolution failed.');
    });
}

function bulkResolve() {
    var resolution = $('#bulkResolution').val();
    var ids = $('.conflict-checkbox:checked').map(function () { return $(this).val(); }).get();
    if (!resolution) { window.alert('Choose a bulk action first.'); return; }
    if (!ids.length) { window.alert('Select at least one conflict.'); return; }
    if (!window.confirm('Apply this action to ' + ids.length + ' selected conflict(s)?')) return;

    $.ajax({
        url: '<?php echo site_url('sync_conflicts/bulk_resolve'); ?>',
        type: 'POST',
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        data: mutationData({ids: ids, resolution: resolution}),
        dataType: 'json'
    }).done(function (response) {
        window.alert(response.message || 'Bulk resolution completed.');
        window.location.reload();
    }).fail(function (xhr) {
        var response = xhr.responseJSON || {};
        window.alert(response.message || 'Bulk resolution failed.');
    });
}
</script>
