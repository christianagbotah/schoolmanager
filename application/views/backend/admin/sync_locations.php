<?php
$locations = $locations ?? [];
$stats = $stats ?? [
    'total' => 0,
    'active' => 0,
    'stale' => 0,
    'inactive' => 0,
    'suspended' => 0
];
?>

<style>
.sync-locations-container {
    padding: 24px 20px;
    margin-top: 20px;
    background: #f8f9fa;
    min-height: 100vh;
}
.sync-locations-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 8px 24px rgba(102,126,234,.18);
}
.sync-locations-header-content,
.sync-locations-actions,
.location-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}
.sync-locations-header-content { justify-content: space-between; flex-wrap: wrap; }
.sync-locations-title h1 { margin: 0 0 6px; color: #fff; font-size: 28px; font-weight: 700; }
.sync-locations-title p { margin: 0; opacity: .9; }
.sync-btn {
    border: 0;
    border-radius: 9px;
    padding: 10px 16px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 7px;
}
.sync-btn-primary { background: #fff; color: #667eea; }
.sync-btn-secondary { background: rgba(255,255,255,.18); color: #fff; border: 1px solid rgba(255,255,255,.28); }
.sync-btn-primary:hover, .sync-btn-secondary:hover { text-decoration: none; }
.sync-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}
.sync-stat-card {
    background: #fff;
    border-radius: 12px;
    padding: 18px;
    box-shadow: 0 2px 8px rgba(0,0,0,.06);
    border-left: 4px solid #667eea;
}
.sync-stat-card.active { border-left-color: #10b981; }
.sync-stat-card.stale { border-left-color: #f59e0b; }
.sync-stat-card.inactive { border-left-color: #ef4444; }
.sync-stat-value { font-size: 28px; line-height: 1; font-weight: 700; color: #1f2937; margin-bottom: 6px; }
.sync-stat-label { color: #6b7280; font-size: 13px; font-weight: 600; }
.sync-locations-table-container {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,.06);
    overflow: hidden;
}
.sync-locations-table-header { padding: 22px 24px; border-bottom: 1px solid #e5e7eb; }
.sync-locations-table-header h2 { margin: 0; font-size: 20px; color: #1f2937; }
.sync-table-wrap { overflow-x: auto; }
.sync-table { width: 100%; border-collapse: collapse; min-width: 860px; }
.sync-table th { background: #f9fafb; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; }
.sync-table th, .sync-table td { padding: 15px 16px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; text-align: left; }
.location-name { font-weight: 700; color: #1f2937; }
.location-description { color: #6b7280; font-size: 12px; margin-top: 3px; }
.device-id-badge { font-family: monospace; background: #f3f4f6; border-radius: 6px; padding: 5px 9px; }
.status-badge { display: inline-block; border-radius: 999px; padding: 4px 9px; font-size: 11px; font-weight: 700; margin: 2px 2px 2px 0; background: #f3f4f6; color: #4b5563; }
.status-badge.active, .status-badge.success, .status-badge.sync-on { background: #d1fae5; color: #065f46; }
.status-badge.inactive, .status-badge.sync-off, .status-badge.pending { background: #f3f4f6; color: #6b7280; }
.status-badge.suspended, .status-badge.partial { background: #fef3c7; color: #92400e; }
.status-badge.failed { background: #fee2e2; color: #991b1b; }
.priority-badge { background: #667eea; color: #fff; border-radius: 999px; padding: 4px 9px; font-size: 12px; font-weight: 700; }
.action-btn { border: 0; border-radius: 7px; padding: 7px 9px; cursor: pointer; background: #f3f4f6; color: #374151; }
.action-btn:hover { background: #e5e7eb; }
.action-btn.danger { color: #b91c1c; }
.action-btn.success { color: #047857; }
.action-btn.warning { color: #b45309; }
.sync-empty-state { text-align: center; padding: 56px 20px; color: #6b7280; }
.sync-empty-state h3 { color: #1f2937; margin-bottom: 8px; }
@media (max-width: 900px) {
    .sync-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 600px) {
    .sync-locations-container { padding: 14px 10px; }
    .sync-locations-header { padding: 22px 18px; }
    .sync-locations-header-content { align-items: flex-start; flex-direction: column; }
    .sync-stats-grid { grid-template-columns: 1fr; }
}
</style>

<div class="sync-locations-container">
    <div class="sync-locations-header">
        <div class="sync-locations-header-content">
            <div class="sync-locations-title">
                <h1><i class="fa fa-building"></i> Sync Locations</h1>
                <p>Manage the trusted endpoints and status of your school sync locations.</p>
            </div>
            <div class="sync-locations-actions">
                <button type="button" onclick="showAjaxModal('<?php echo site_url('admin/sync_locations/modal_add'); ?>')" class="sync-btn sync-btn-primary">
                    <i class="fa fa-plus"></i> Add Location
                </button>
                <a href="<?php echo site_url('sync_server/dashboard'); ?>" class="sync-btn sync-btn-secondary">
                    <i class="fa fa-tachometer"></i> Sync Dashboard
                </a>
            </div>
        </div>
    </div>

    <div class="sync-stats-grid">
        <div class="sync-stat-card">
            <div class="sync-stat-value"><?php echo (int) ($stats['total'] ?? 0); ?></div>
            <div class="sync-stat-label">Total Locations</div>
        </div>
        <div class="sync-stat-card active">
            <div class="sync-stat-value"><?php echo (int) ($stats['active'] ?? 0); ?></div>
            <div class="sync-stat-label">Active &amp; Syncing</div>
        </div>
        <div class="sync-stat-card stale">
            <div class="sync-stat-value"><?php echo (int) ($stats['stale'] ?? 0); ?></div>
            <div class="sync-stat-label">Stale (24h+)</div>
        </div>
        <div class="sync-stat-card inactive">
            <div class="sync-stat-value"><?php echo (int) ($stats['inactive'] ?? 0) + (int) ($stats['suspended'] ?? 0); ?></div>
            <div class="sync-stat-label">Inactive / Suspended</div>
        </div>
    </div>

    <div class="sync-locations-table-container">
        <div class="sync-locations-table-header">
            <h2><i class="fa fa-list"></i> Registered Locations</h2>
        </div>

        <?php if (empty($locations)): ?>
            <div class="sync-empty-state">
                <h3>No Locations Registered</h3>
                <p>Add the first trusted location to enable multi-location synchronization.</p>
                <button type="button" onclick="showAjaxModal('<?php echo site_url('admin/sync_locations/modal_add'); ?>')" class="sync-btn sync-btn-primary" style="background:#667eea;color:#fff;">
                    <i class="fa fa-plus"></i> Add Location
                </button>
            </div>
        <?php else: ?>
            <div class="sync-table-wrap">
                <table class="sync-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Location</th>
                            <th>Device ID</th>
                            <th>Status</th>
                            <th>Last Sync</th>
                            <th>Sync Result</th>
                            <th>Priority</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($locations as $index => $location): ?>
                            <tr>
                                <td><?php echo $index + 1; ?></td>
                                <td>
                                    <div class="location-name"><?php echo htmlspecialchars($location['location_name']); ?></div>
                                    <?php if (!empty($location['description'])): ?>
                                        <div class="location-description"><?php echo htmlspecialchars($location['description']); ?></div>
                                    <?php endif; ?>
                                </td>
                                <td><span class="device-id-badge"><?php echo htmlspecialchars($location['device_id']); ?></span></td>
                                <td>
                                    <span class="status-badge <?php echo htmlspecialchars($location['status']); ?>"><?php echo ucfirst($location['status']); ?></span>
                                    <span class="status-badge <?php echo $location['sync_enabled'] ? 'sync-on' : 'sync-off'; ?>"><?php echo $location['sync_enabled'] ? 'Sync ON' : 'Sync OFF'; ?></span>
                                </td>
                                <td>
                                    <?php if (!empty($location['last_sync_at'])): ?>
                                        <?php echo date('M d, Y H:i', strtotime($location['last_sync_at'])); ?>
                                    <?php else: ?>
                                        <span style="color:#9ca3af;">Never</span>
                                    <?php endif; ?>
                                </td>
                                <td><span class="status-badge <?php echo htmlspecialchars($location['last_sync_status'] ?: 'pending'); ?>"><?php echo ucfirst($location['last_sync_status'] ?: 'pending'); ?></span></td>
                                <td><span class="priority-badge"><?php echo (int) $location['priority']; ?></span></td>
                                <td>
                                    <div class="location-actions">
                                        <button type="button" class="action-btn" title="View" onclick="window.location.href='<?php echo site_url('admin/sync_locations/view/' . $location['id']); ?>'">
                                            <i class="fa fa-eye"></i>
                                        </button>
                                        <button type="button" class="action-btn" title="Edit" onclick="showAjaxModal('<?php echo site_url('admin/sync_locations/modal_edit/' . $location['id']); ?>')">
                                            <i class="fa fa-edit"></i>
                                        </button>
                                        <?php if ($location['status'] === 'active'): ?>
                                            <button type="button" class="action-btn warning" title="Deactivate" onclick="postLocationAction('<?php echo site_url('admin/sync_locations/deactivate/' . $location['id']); ?>', 'Deactivate this location?')">
                                                <i class="fa fa-pause"></i>
                                            </button>
                                        <?php else: ?>
                                            <button type="button" class="action-btn success" title="Activate" onclick="postLocationAction('<?php echo site_url('admin/sync_locations/activate/' . $location['id']); ?>', 'Activate this location?')">
                                                <i class="fa fa-play"></i>
                                            </button>
                                        <?php endif; ?>
                                        <button type="button" class="action-btn danger" title="Delete" onclick="postLocationAction('<?php echo site_url('admin/sync_locations/delete/' . $location['id']); ?>', 'Delete this location? This cannot be undone.')">
                                            <i class="fa fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<script>
const csrfTokenName = <?php echo json_encode($csrf_token_name); ?>;
const csrfTokenHash = <?php echo json_encode($csrf_token_hash); ?>;

function postLocationAction(url, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) {
        return;
    }

    const formData = new FormData();
    formData.append(csrfTokenName, csrfTokenHash);

    fetch(url, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    })
    .then(async function(response) {
        let data = {};
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('The server returned an invalid response.');
        }

        if (!response.ok) {
            throw new Error(data.message || 'The action could not be completed.');
        }
        return data;
    })
    .then(function(data) {
        if (data.status === 'success') {
            window.location.reload();
            return;
        }
        window.alert(data.message || 'The action could not be completed.');
    })
    .catch(function(error) {
        window.alert(error.message || 'The action could not be completed.');
    });
}
</script>
