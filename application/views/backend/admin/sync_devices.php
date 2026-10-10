<?php
$devices = isset($devices) && is_array($devices) ? $devices : [];
$one_time_token = $this->session->flashdata('sync_device_token_once');
$one_time_device = $this->session->flashdata('sync_device_token_id');

$counts = ['ACTIVE' => 0, 'INACTIVE' => 0, 'BLOCKED' => 0];
foreach ($devices as $device) {
    $status = strtoupper($device['status'] ?? 'INACTIVE');
    if (isset($counts[$status])) {
        $counts[$status]++;
    }
}
?>

<link rel="stylesheet" href="<?php echo base_url(); ?>assets/css/sync-design-system.css?v=<?php echo time(); ?>">

<style>
.device-security-page { padding: 24px; max-width: 1440px; margin: 0 auto; }
.device-security-hero { background: linear-gradient(135deg, #172554, #3730a3 56%, #4f46e5); color: #fff; border-radius: 18px; padding: 28px; margin-bottom: 22px; box-shadow: 0 14px 36px rgba(30, 41, 59, .18); }
.device-security-hero h1 { color: #fff !important; margin: 0 0 7px; font-size: 26px !important; }
.device-security-hero p { color: rgba(255,255,255,.84); margin: 0; max-width: 800px; }
.device-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 22px; }
.device-stat { background: rgba(255,255,255,.11); border: 1px solid rgba(255,255,255,.15); border-radius: 13px; padding: 14px 16px; }
.device-stat strong { display: block; font-size: 26px; line-height: 1; margin-bottom: 5px; }
.device-stat span { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; opacity: .78; }
.one-time-token { border: 1px solid #f59e0b; background: #fffbeb; border-radius: 14px; padding: 18px; margin-bottom: 20px; }
.one-time-token h3 { color: #92400e; margin: 0 0 7px; font-size: 17px !important; }
.one-time-token p { color: #78350f; margin: 0 0 12px; }
.token-row { display: flex; gap: 10px; align-items: stretch; }
.token-row input { flex: 1; min-width: 0; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; background: #fff; border: 1px solid #fcd34d; border-radius: 9px; padding: 10px 12px; }
.device-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(15,23,42,.05); }
.device-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 18px 20px; border-bottom: 1px solid #e5e7eb; }
.device-panel-head h2 { font-size: 19px !important; margin: 0; color: #111827; }
.device-panel-head p { margin: 3px 0 0; color: #6b7280; font-size: 13px; }
.device-list { display: grid; grid-template-columns: 1fr; }
.device-row { display: grid; grid-template-columns: minmax(220px, 1.4fr) minmax(120px, .7fr) minmax(150px, .8fr) minmax(180px, 1fr); gap: 16px; align-items: center; padding: 17px 20px; border-bottom: 1px solid #f1f5f9; }
.device-row:last-child { border-bottom: 0; }
.device-name { font-weight: 700; color: #111827; margin-bottom: 4px; }
.device-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #64748b; font-size: 12px; overflow-wrap: anywhere; }
.device-meta-label { color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; }
.device-meta-value { color: #334155; font-size: 13px; }
.device-status { display: inline-flex; align-items: center; border-radius: 999px; padding: 5px 10px; font-size: 11px; font-weight: 800; letter-spacing: .04em; }
.device-status.active { background: #dcfce7; color: #166534; }
.device-status.inactive { background: #f1f5f9; color: #475569; }
.device-status.blocked { background: #fee2e2; color: #991b1b; }
.device-actions { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
.device-actions form { margin: 0; }
.device-btn { border: 0; border-radius: 9px; padding: 9px 12px; min-height: 36px; font-weight: 700; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.device-btn.rotate { background: #eef2ff; color: #3730a3; }
.device-btn.revoke { background: #fff1f2; color: #be123c; }
.device-btn.copy { background: #92400e; color: #fff; white-space: nowrap; }
.device-empty { text-align: center; padding: 54px 20px; color: #64748b; }
.device-empty i { font-size: 34px; margin-bottom: 12px; color: #94a3b8; }
.device-empty strong { display: block; color: #334155; margin-bottom: 5px; }
.device-note { margin-top: 16px; padding: 14px 16px; border-radius: 12px; background: #f8fafc; color: #475569; font-size: 13px; border: 1px solid #e2e8f0; }
@media (max-width: 900px) { .device-row { grid-template-columns: 1fr 1fr; } .device-actions { justify-content: flex-start; } }
@media (max-width: 600px) { .device-security-page { padding: 14px; } .device-stat-grid { grid-template-columns: 1fr; } .device-row { grid-template-columns: 1fr; } .token-row { flex-direction: column; } }
</style>

<div class="device-security-page">
    <section class="device-security-hero">
        <h1><i class="fa fa-shield-alt"></i> Sync Device Security</h1>
        <p>Manage credentials for devices using the hardened Gen2 offline sync API. Token hashes are never displayed, and revoked credentials cannot be reused.</p>
        <div class="device-stat-grid">
            <div class="device-stat"><strong><?php echo (int)$counts['ACTIVE']; ?></strong><span>Active</span></div>
            <div class="device-stat"><strong><?php echo (int)$counts['INACTIVE']; ?></strong><span>Inactive</span></div>
            <div class="device-stat"><strong><?php echo (int)$counts['BLOCKED']; ?></strong><span>Blocked</span></div>
        </div>
    </section>

    <?php if (!empty($one_time_token)): ?>
    <section class="one-time-token" role="alert">
        <h3><i class="fa fa-key"></i> New token for <?php echo html_escape($one_time_device); ?></h3>
        <p>This credential is shown only once. Copy it now and update the protected credential store on the device before leaving this page.</p>
        <div class="token-row">
            <input id="sync-device-one-time-token" type="text" readonly value="<?php echo html_escape($one_time_token); ?>" aria-label="One-time device token">
            <button type="button" class="device-btn copy" onclick="copySyncDeviceToken()"><i class="fa fa-copy"></i> Copy token</button>
        </div>
    </section>
    <?php endif; ?>

    <section class="device-panel">
        <div class="device-panel-head">
            <div>
                <h2>Registered devices</h2>
                <p>Only ACTIVE devices can rotate credentials. Revocation is permanent for the current credential.</p>
            </div>
            <span class="device-status active"><?php echo count($devices); ?> total</span>
        </div>

        <?php if (empty($devices)): ?>
        <div class="device-empty">
            <i class="fa fa-laptop"></i>
            <strong>No Gen2 sync devices registered yet</strong>
            <span>Devices will appear here after secure API-key bootstrap enrollment.</span>
        </div>
        <?php else: ?>
        <div class="device-list">
            <?php foreach ($devices as $device):
                $status = strtoupper($device['status'] ?? 'INACTIVE');
                $status_class = strtolower(in_array($status, ['ACTIVE', 'INACTIVE', 'BLOCKED'], true) ? $status : 'inactive');
            ?>
            <div class="device-row">
                <div>
                    <div class="device-name"><?php echo html_escape($device['device_name'] ?: 'Unnamed device'); ?></div>
                    <div class="device-id"><?php echo html_escape($device['device_id']); ?></div>
                </div>
                <div>
                    <div class="device-meta-label">Status</div>
                    <span class="device-status <?php echo $status_class; ?>"><?php echo html_escape($status); ?></span>
                </div>
                <div>
                    <div class="device-meta-label">Last sync</div>
                    <div class="device-meta-value"><?php echo !empty($device['last_sync_at']) ? html_escape(date('M j, Y g:i A', strtotime($device['last_sync_at']))) : 'Never'; ?></div>
                    <div class="device-meta-label" style="margin-top:7px;">Created</div>
                    <div class="device-meta-value"><?php echo !empty($device['created_at']) ? html_escape(date('M j, Y', strtotime($device['created_at']))) : '—'; ?></div>
                </div>
                <div class="device-actions">
                    <?php if ($status === 'ACTIVE'): ?>
                        <?php echo form_open(site_url('sync_server/rotate_device_token')); ?>
                            <input type="hidden" name="device_id" value="<?php echo html_escape($device['device_id']); ?>">
                            <button type="submit" class="device-btn rotate" title="Invalidate the old token and issue a new one">
                                <i class="fa fa-sync-alt"></i> Rotate token
                            </button>
                        <?php echo form_close(); ?>
                    <?php endif; ?>

                    <?php if ($status !== 'BLOCKED'): ?>
                        <?php echo form_open(site_url('sync_server/revoke_device'), ['onsubmit' => "return confirm('Revoke this device? Its current token will stop working immediately.');"]); ?>
                            <input type="hidden" name="device_id" value="<?php echo html_escape($device['device_id']); ?>">
                            <button type="submit" class="device-btn revoke">
                                <i class="fa fa-ban"></i> Revoke
                            </button>
                        <?php echo form_close(); ?>
                    <?php else: ?>
                        <span class="device-meta-value">Fresh enrollment required</span>
                    <?php endif; ?>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>
    </section>

    <div class="device-note">
        <i class="fa fa-info-circle"></i>
        A rotated token invalidates the previous token immediately. A revoked device is BLOCKED and its stored credential is destroyed; enroll it again as a new device if access is needed later.
    </div>
</div>

<script>
function copySyncDeviceToken() {
    var field = document.getElementById('sync-device-one-time-token');
    if (!field) return;
    var value = field.value;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(function () {
            if (window.toastr) toastr.success('Device token copied');
        });
        return;
    }
    field.focus();
    field.select();
    document.execCommand('copy');
    if (window.toastr) toastr.success('Device token copied');
}
</script>
