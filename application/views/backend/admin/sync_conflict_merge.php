<?php
if (!function_exists('sync_merge_display_value')) {
    function sync_merge_display_value($value) {
        if ($value === null) return 'NULL';
        if (is_bool($value)) return $value ? 'true' : 'false';
        if (is_array($value) || is_object($value)) return json_encode($value);
        return (string) $value;
    }
}

$primary_key = $primary_key ?? null;
$diff = $diff ?? [];
?>

<div class="row">
    <div class="col-lg-12">
        <div class="panel panel-success">
            <div class="panel-heading">
                <div class="panel-title">
                    <i class="fa fa-code-fork"></i> <?php echo get_phrase('merge_conflict'); ?>
                    <a href="<?php echo site_url('sync_conflicts/view/' . (int) $conflict->id); ?>" class="btn btn-default btn-sm pull-right"><i class="fa fa-arrow-left"></i> Back</a>
                </div>
            </div>
            <div class="panel-body">
                <div class="alert alert-info">
                    Choose the source for each field. Local and remote choices preserve the original value type; use Custom only when you intentionally need a new value.
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead>
                            <tr><th>Field</th><th>Local</th><th>Remote</th><th width="220">Choice</th><th>Custom value</th></tr>
                        </thead>
                        <tbody>
                            <?php foreach ($diff as $field => $values): ?>
                                <?php if ($field === $primary_key) continue; ?>
                                <tr class="<?php echo !empty($values['is_different']) ? 'warning' : ''; ?>">
                                    <td><code><?php echo htmlspecialchars($field); ?></code></td>
                                    <td><pre style="white-space:pre-wrap;max-width:280px;"><?php echo htmlspecialchars(sync_merge_display_value($values['local'] ?? null)); ?></pre></td>
                                    <td><pre style="white-space:pre-wrap;max-width:280px;"><?php echo htmlspecialchars(sync_merge_display_value($values['remote'] ?? null)); ?></pre></td>
                                    <td>
                                        <select class="form-control merge-choice" data-field="<?php echo htmlspecialchars($field, ENT_QUOTES, 'UTF-8'); ?>">
                                            <option value="local">Local</option>
                                            <option value="remote">Remote</option>
                                            <option value="custom">Custom</option>
                                        </select>
                                    </td>
                                    <td>
                                        <textarea class="form-control merge-custom" rows="2" data-field="<?php echo htmlspecialchars($field, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars(sync_merge_display_value($values['local'] ?? null)); ?></textarea>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <div id="validationMessages" class="alert alert-danger" style="display:none;"></div>
                <button type="button" id="applyMergeButton" class="btn btn-success" onclick="validateAndSubmit(this)">
                    <i class="fa fa-check"></i> <?php echo get_phrase('apply_merged_version'); ?>
                </button>
            </div>
        </div>
    </div>
</div>

<script>
const csrfTokenName = <?php echo json_encode($csrf_token_name); ?>;
const csrfTokenHash = <?php echo json_encode($csrf_token_hash); ?>;
const conflictId = <?php echo (int) $conflict->id; ?>;
const localData = <?php echo json_encode($conflict->local_data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;
const remoteData = <?php echo json_encode($conflict->remote_data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT); ?>;

function getFormData() {
    var merged = {};
    $('.merge-choice').each(function () {
        var field = $(this).data('field');
        var choice = $(this).val();
        if (choice === 'local') {
            merged[field] = Object.prototype.hasOwnProperty.call(localData, field) ? localData[field] : null;
        } else if (choice === 'remote') {
            merged[field] = Object.prototype.hasOwnProperty.call(remoteData, field) ? remoteData[field] : null;
        } else {
            merged[field] = $('.merge-custom[data-field="' + cssEscape(field) + '"]').val();
        }
    });
    return merged;
}

function cssEscape(value) {
    if (window.CSS && window.CSS.escape) return window.CSS.escape(String(value));
    return String(value).replace(/(["\\.#:[\],=])/g, '\\$1');
}

function validateAndSubmit(button) {
    var mergedData = getFormData();
    if (!Object.keys(mergedData).length) {
        $('#validationMessages').text('No merge fields are available.').show();
        return;
    }
    if (!window.confirm('Apply this merged version? This will resolve the conflict and update the live record.')) return;

    var $btn = $(button);
    $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Applying...');

    var data = {merged_data: JSON.stringify(mergedData)};
    data[csrfTokenName] = csrfTokenHash;

    $.ajax({
        url: '<?php echo site_url('sync_conflicts/merge/'); ?>' + conflictId,
        type: 'POST',
        headers: {'X-Requested-With': 'XMLHttpRequest'},
        data: data,
        dataType: 'json'
    }).done(function (response) {
        if (response.success) {
            window.location.href = '<?php echo site_url('sync_conflicts'); ?>';
            return;
        }
        $('#validationMessages').text(response.message || 'Unable to apply merged version.').show();
        $btn.prop('disabled', false).html('<i class="fa fa-check"></i> <?php echo get_phrase('apply_merged_version'); ?>');
    }).fail(function (xhr) {
        var response = xhr.responseJSON || {};
        $('#validationMessages').text(response.message || 'Unable to apply merged version.').show();
        $btn.prop('disabled', false).html('<i class="fa fa-check"></i> <?php echo get_phrase('apply_merged_version'); ?>');
    });
}
</script>
