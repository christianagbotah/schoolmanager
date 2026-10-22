<?php
if (!function_exists('sync_conflict_format_value')) {
    function sync_conflict_format_value($value) {
        if ($value === null) {
            return '<span class="text-muted">NULL</span>';
        }
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if (is_array($value) || is_object($value)) {
            return '<code>' . htmlspecialchars(json_encode($value), ENT_QUOTES, 'UTF-8') . '</code>';
        }
        return nl2br(htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8'));
    }
}

$pending = isset($conflict) && $conflict->status === 'pending';
?>

<div class="row conflict-detail-page">
    <div class="col-lg-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                <div class="panel-title">
                    <i class="fa fa-exclamation-triangle"></i> <?php echo get_phrase('conflict_detail'); ?>
                    <a href="<?php echo site_url('sync_conflicts'); ?>" class="btn btn-default btn-sm pull-right"><i class="fa fa-arrow-left"></i> Back</a>
                </div>
            </div>
            <div class="panel-body">
                <div class="row" style="margin-bottom: 20px;">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th width="150">Table</th><td><code><?php echo htmlspecialchars($conflict->table_name); ?></code></td></tr>
                            <tr><th>Record ID</th><td><?php echo htmlspecialchars($conflict->record_id); ?></td></tr>
                            <tr><th>Status</th><td><span class="label label-<?php echo $pending ? 'warning' : 'default'; ?>"><?php echo htmlspecialchars($conflict->status); ?></span></td></tr>
                            <tr><th>Detected</th><td><?php echo htmlspecialchars($conflict->created_at); ?></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th width="150">Local device</th><td><?php echo htmlspecialchars($conflict->local_device_id); ?></td></tr>
                            <tr><th>Remote device</th><td><?php echo htmlspecialchars($conflict->remote_device_id); ?></td></tr>
                            <tr><th>Local modified</th><td><?php echo htmlspecialchars($conflict->local_modified_at); ?></td></tr>
                            <tr><th>Remote modified</th><td><?php echo htmlspecialchars($conflict->remote_modified_at); ?></td></tr>
                        </table>
                    </div>
                </div>

                <h4>Field comparison</h4>
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr><th>Field</th><th>Local value</th><th>Remote value</th><th>Difference</th></tr>
                        </thead>
                        <tbody>
                            <?php foreach (($diff ?? []) as $field => $values): ?>
                                <tr class="<?php echo !empty($values['is_different']) ? 'warning' : ''; ?>">
                                    <td><code><?php echo htmlspecialchars($field); ?></code></td>
                                    <td><?php echo sync_conflict_format_value($values['local'] ?? null); ?></td>
                                    <td><?php echo sync_conflict_format_value($values['remote'] ?? null); ?></td>
                                    <td><?php echo !empty($values['is_different']) ? '<span class="label label-warning">Different</span>' : '<span class="label label-success">Same</span>'; ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <?php if ($pending): ?>
                    <hr>
                    <div class="btn-group" role="group" aria-label="Conflict resolution">
                        <button type="button" class="btn btn-warning" onclick="resolveConflict('local')"><i class="fa fa-arrow-left"></i> Keep local</button>
                        <button type="button" class="btn btn-primary" onclick="resolveConflict('remote')"><i class="fa fa-arrow-right"></i> Keep remote</button>
                        <a class="btn btn-info" href="<?php echo site_url('sync_conflicts/merge_view/' . (int) $conflict->id); ?>"><i class="fa fa-code-fork"></i> Merge</a>
                        <button type="button" class="btn btn-default" onclick="resolveConflict('ignore')"><i class="fa fa-ban"></i> Ignore</button>
                    </div>
                <?php else: ?>
                    <div class="alert alert-info">This conflict has already been processed.</div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<script>
const csrfTokenName = <?php echo json_encode($csrf_token_name); ?>;
const csrfTokenHash = <?php echo json_encode($csrf_token_hash); ?>;
const conflictId = <?php echo (int) $conflict->id; ?>;
const localConflictData = <?php echo json_encode($conflict->local_data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
const remoteConflictData = <?php echo json_encode($conflict->remote_data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;

function resolveConflict(version) {
    var route = version === 'local' ? 'keep_local' : (version === 'remote' ? 'keep_remote' : 'ignore');
    var label = version === 'local' ? 'keep the local version' : (version === 'remote' ? 'keep the remote version' : 'ignore this conflict');
    if (!window.confirm('Are you sure you want to ' + label + '?')) return;

    var data = {};
    data[csrfTokenName] = csrfTokenHash;

    $.ajax({
        url: '<?php echo site_url('sync_conflicts'); ?>/' + route + '/' + conflictId,
        type: 'POST',
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        data: data,
        dataType: 'json'
    }).done(function (response) {
        if (response.success) {
            window.location.href = '<?php echo site_url('sync_conflicts'); ?>';
            return;
        }
        window.alert(response.message || 'Conflict resolution failed.');
    }).fail(function (xhr) {
        var response = xhr.responseJSON || {};
        window.alert(response.message || 'Conflict resolution failed.');
    });
}
</script>
