<style>
.settings-card{background:#fff;border-radius:16px;padding:2rem;margin-bottom:1.5rem;box-shadow:0 4px 16px rgba(0,0,0,0.06)}
.settings-header{background:linear-gradient(135deg,#6366f1,#4f46e5);padding:2rem;border-radius:16px;margin-bottom:2rem;color:#fff}
.form-group{margin-bottom:1.5rem}
.form-group label{font-weight:600;margin-bottom:0.5rem;display:block;color:#334155}
.form-control{width:100%;padding:0.75rem;border:2px solid #e2e8f0;border-radius:8px;font-size:1rem}
.form-control:focus{border-color:#6366f1;outline:none}
.btn-save{background:linear-gradient(135deg,#10b981,#059669);color:#fff;padding:0.75rem 2rem;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.3s}
.btn-save:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(16,185,129,0.3)}

/* Direct UI/UX rebuild — Alert Settings */
body { background: #f8fafc; }
.alert-settings-workspace {
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.alert-settings-workspace .settings-header {
    margin-bottom: 18px !important;
    padding: 20px 22px !important;
    border-radius: 14px !important;
    background: #0f172a !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.10) !important;
}
.alert-settings-workspace .settings-header h2 {
    margin: 0;
    color: #fff !important;
    font-size: 24px !important;
    line-height: 1.25;
    font-weight: 800 !important;
}
.alert-settings-workspace .settings-header h2 i {
    margin-right: 8px;
    font-size: 18px;
}
.alert-settings-workspace .settings-header p {
    margin: 6px 0 0;
    color: #cbd5e1 !important;
    font-size: 14px;
    line-height: 1.5;
}
#alert_settings_form {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 14px;
}
.alert-settings-workspace .settings-card {
    margin: 0 !important;
    padding: 17px 18px !important;
    border: 1px solid #e2e8f0;
    border-radius: 12px !important;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.alert-settings-workspace .settings-card h3 {
    margin: 0 0 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eef2f7;
    color: #0f172a;
    font-size: 16px;
    line-height: 1.35;
    font-weight: 800;
}
.alert-settings-workspace .form-group {
    margin-bottom: 14px !important;
}
.alert-settings-workspace .form-group:last-child {
    margin-bottom: 0 !important;
}
.alert-settings-workspace .form-group label {
    margin-bottom: 7px !important;
    color: #334155 !important;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700 !important;
}
.alert-settings-workspace .form-control {
    min-height: 46px;
    height: 46px;
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff;
    color: #0f172a;
    font-size: 15px !important;
}
.alert-settings-workspace .form-control:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
    outline: none;
}
.alert-settings-workspace input[type="checkbox"] {
    width: 18px;
    height: 18px;
    margin: 0 8px 0 0;
    vertical-align: middle;
    accent-color: #2563eb;
}
.alert-settings-workspace .settings-card:last-of-type {
    grid-column: 1 / -1;
}
.alert-settings-workspace .settings-card:last-of-type .form-group:last-child {
    max-width: 760px;
}
.alert-settings-workspace .btn-save {
    grid-column: 1 / -1;
    justify-self: end;
    min-height: 46px;
    padding: 10px 18px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    color: #fff;
    font-size: 15px;
    line-height: 1.35;
    font-weight: 800 !important;
    box-shadow: 0 2px 8px rgba(37,99,235,.18);
    transition: background-color .15s ease, box-shadow .15s ease !important;
}
.alert-settings-workspace .btn-save:hover {
    background: #1d4ed8 !important;
    transform: none !important;
    box-shadow: 0 4px 12px rgba(37,99,235,.20) !important;
}
@media (max-width: 900px) {
    #alert_settings_form { grid-template-columns: 1fr; }
    .alert-settings-workspace .settings-card:last-of-type,
    .alert-settings-workspace .btn-save { grid-column: 1; }
}
@media (max-width: 767px) {
    .alert-settings-workspace { padding: 18px 14px 32px; }
    .alert-settings-workspace .settings-header { padding: 18px !important; }
    .alert-settings-workspace .settings-header h2 { font-size: 21px !important; }
    .alert-settings-workspace .settings-card { padding: 15px !important; }
    .alert-settings-workspace .form-control { font-size: 16px !important; }
    .alert-settings-workspace .btn-save {
        width: 100%;
        justify-self: stretch;
    }
}
</style>

<div class="alert-settings-workspace">
<div class="settings-header">
    <h2><i class="fa fa-cog"></i> Alert Configuration</h2>
    <p>Configure thresholds and notification settings for financial alerts</p>
</div>

<?php echo form_open('admin/alert_settings/update', ['id' => 'alert_settings_form']); ?>
<div class="settings-card">
    <h3>Outstanding Balance Alerts</h3>
    <div class="form-group">
        <label>Amount Threshold (<?php echo $this->db->get_where('settings',['type'=>'currency'])->row()->description; ?>)</label>
        <input type="number" name="outstanding_threshold" class="form-control" value="1000" required>
    </div>
    <div class="form-group">
        <label>Days Overdue Threshold</label>
        <input type="number" name="outstanding_days" class="form-control" value="90" required>
    </div>
</div>

<div class="settings-card">
    <h3>Collection Efficiency Alerts</h3>
    <div class="form-group">
        <label>Daily Collection Target (<?php echo $this->db->get_where('settings',['type'=>'currency'])->row()->description; ?>)</label>
        <input type="number" name="collection_target" class="form-control" value="15000" required>
    </div>
    <div class="form-group">
        <label>Efficiency Threshold (%)</label>
        <input type="number" name="collection_threshold" class="form-control" value="70" min="0" max="100" required>
    </div>
</div>

<div class="settings-card">
    <h3>Reconciliation Alerts</h3>
    <div class="form-group">
        <label>Days Before Alert</label>
        <input type="number" name="reconciliation_days" class="form-control" value="7" required>
    </div>
</div>

<div class="settings-card">
    <h3>Anomaly Detection</h3>
    <div class="form-group">
        <label>Rapid Transaction Count</label>
        <input type="number" name="rapid_transaction_count" class="form-control" value="10" required>
    </div>
    <div class="form-group">
        <label>Time Window (minutes)</label>
        <input type="number" name="rapid_transaction_minutes" class="form-control" value="10" required>
    </div>
</div>

<div class="settings-card">
    <h3>Email Notifications</h3>
    <div class="form-group">
        <label>
            <input type="checkbox" name="email_notifications" value="1"> Enable Email Notifications
        </label>
    </div>
    <div class="form-group">
        <label>Notification Email Addresses (comma-separated)</label>
        <input type="text" name="notification_emails" class="form-control" placeholder="admin@school.com, finance@school.com">
    </div>
</div>

<button type="submit" class="btn-save"><i class="fa fa-save"></i> Save Settings</button>
</form>

</div>

<script>
$('#alert_settings_form').submit(function(e){
    e.preventDefault();
    showAjaxModal_alert('Saving settings...','loading');
    $.ajax({
        url:$(this).attr('action'),
        type:'POST',
        data:new FormData(this),
        cache:false,
        contentType:false,
        processData:false,
        dataType:'json'
    }).done(function(response){
        if(response.status==='success'){
            showAjaxModal_alert(response.message,'success');
        }else{
            showAjaxModal_alert(response.message||'Failed to save settings','error');
        }
    }).fail(function(){
        showAjaxModal_alert('An error occurred','error');
    });
});
</script>
