<style>
.settings-card {
    background: #fff;
    border-radius: 16px;
    padding: 2rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.settings-header {
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    padding: 2rem;
    border-radius: 16px;
    margin-bottom: 2rem;
    color: #fff;
}

.settings-header h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.75rem;
    font-weight: 600;
}

.settings-header p {
    margin: 0;
    opacity: 0.9;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    font-weight: 600;
    margin-bottom: 0.5rem;
    display: block;
    color: #334155;
}

.phone-display {
    padding: 0.75rem;
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    color: #64748b;
    font-size: 1rem;
    display: inline-block;
    min-width: 250px;
}

.phone-display i {
    margin-right: 0.5rem;
    color: #6366f1;
}

.warning-message {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    color: #92400e;
}

.warning-message i {
    margin-right: 0.5rem;
    color: #f59e0b;
}

.switch-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.switch {
    position: relative;
    display: inline-block;
    width: 60px;
    height: 34px;
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.4s;
    border-radius: 34px;
}

.slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .slider {
    background-color: #10b981;
}

input:focus + .slider {
    box-shadow: 0 0 1px #10b981;
}

input:checked + .slider:before {
    transform: translateX(26px);
}

.switch-label {
    font-weight: 500;
    color: #475569;
    font-size: 1rem;
}

.btn-save {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    font-size: 1rem;
}

.btn-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save i {
    margin-right: 0.5rem;
}

.info-text {
    color: #64748b;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    line-height: 1.5;
}

.phone-edit-link {
    margin-left: 1rem;
    color: #6366f1;
    text-decoration: none;
    font-size: 0.875rem;
}

.phone-edit-link:hover {
    text-decoration: underline;
}

/* Direct UI/UX rebuild — Notification Settings */
body { background: #f8fafc; }
.notification-settings-workspace {
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.notification-settings-workspace .settings-header {
    margin-bottom: 18px !important;
    padding: 20px 22px !important;
    border-radius: 14px !important;
    background: #0f172a !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.10) !important;
}
.notification-settings-workspace .settings-header h2 {
    margin: 0 !important;
    color: #fff !important;
    font-size: 24px !important;
    line-height: 1.25;
    font-weight: 800 !important;
}
.notification-settings-workspace .settings-header h2 i {
    margin-right: 8px;
    font-size: 18px;
}
.notification-settings-workspace .settings-header p {
    margin-top: 6px !important;
    color: #cbd5e1 !important;
    font-size: 14px !important;
    line-height: 1.5;
    opacity: 1 !important;
}
.notification-settings-workspace .settings-card {
    max-width: 900px;
    margin: 0 !important;
    padding: 18px 20px !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px !important;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.notification-settings-workspace .settings-card h3 {
    margin: 0 0 6px;
    color: #0f172a;
    font-size: 17px;
    line-height: 1.35;
    font-weight: 800;
}
.notification-settings-workspace .settings-card h3 i {
    margin-right: 7px;
    color: #2563eb !important;
    font-size: 15px;
}
.notification-settings-workspace .info-text {
    margin: 4px 0 0 !important;
    color: #64748b !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
}
.notification-settings-workspace .form-group {
    margin-bottom: 16px !important;
}
.notification-settings-workspace .form-group[style*="margin-top"] {
    margin-top: 18px !important;
}
.notification-settings-workspace .form-group label {
    margin-bottom: 7px !important;
    color: #334155 !important;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700 !important;
}
.notification-settings-workspace .switch-container {
    gap: 10px !important;
    min-height: 42px;
}
.notification-settings-workspace .switch {
    width: 52px !important;
    height: 28px !important;
}
.notification-settings-workspace .slider {
    border-radius: 28px !important;
    transition: .2s !important;
}
.notification-settings-workspace .slider:before {
    width: 20px !important;
    height: 20px !important;
    left: 4px !important;
    bottom: 4px !important;
    transition: .2s !important;
}
.notification-settings-workspace input:checked + .slider:before {
    transform: translateX(24px) !important;
}
.notification-settings-workspace .switch-label {
    color: #334155 !important;
    font-size: 14px !important;
    font-weight: 700 !important;
}
.notification-settings-workspace .phone-display {
    min-width: 0 !important;
    padding: 10px 12px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #f8fafc !important;
    color: #0f172a !important;
    font-size: 14px !important;
}
.notification-settings-workspace .phone-display i {
    color: #2563eb !important;
}
.notification-settings-workspace .phone-edit-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 38px;
    margin-left: 10px !important;
    color: #2563eb !important;
    font-size: 13px !important;
    font-weight: 700;
}
.notification-settings-workspace .warning-message {
    margin-top: 0 !important;
    padding: 12px 14px !important;
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b !important;
    border-radius: 9px !important;
    background: #fffbeb !important;
    color: #78350f !important;
    font-size: 13px;
    line-height: 1.5;
}
.notification-settings-workspace .btn-save {
    min-height: 46px;
    padding: 10px 18px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    color: #fff;
    font-size: 15px !important;
    font-weight: 800 !important;
    box-shadow: 0 2px 8px rgba(37,99,235,.18);
    transition: background-color .15s ease, box-shadow .15s ease !important;
}
.notification-settings-workspace .btn-save:hover {
    background: #1d4ed8 !important;
    transform: none !important;
    box-shadow: 0 4px 12px rgba(37,99,235,.20) !important;
}
@media (max-width: 767px) {
    .notification-settings-workspace { padding: 18px 14px 32px; }
    .notification-settings-workspace .settings-header { padding: 18px !important; }
    .notification-settings-workspace .settings-header h2 { font-size: 21px !important; }
    .notification-settings-workspace .settings-card { padding: 15px !important; }
    .notification-settings-workspace .phone-display { display: block; width: 100%; }
    .notification-settings-workspace .phone-edit-link {
        margin: 8px 0 0 !important;
    }
    .notification-settings-workspace .btn-save { width: 100%; }
}
</style>

<div class="notification-settings-workspace">
<div class="settings-header">
    <h2><i class="fa fa-bell"></i> Notification Settings</h2>
    <p>Manage your notification preferences for payroll approval notifications</p>
</div>

<?php 
// Get current user's phone number and SMS preference
$user_id = $this->session->userdata('admin_id');

// Load the User_notification_preferences model
$this->load->model('User_notification_preferences');

// Get phone number from admin table
$this->db->select('phone');
$this->db->where('admin_id', $user_id);
$user = $this->db->get('admin')->row();
$phone_number = ($user && !empty($user->phone)) ? $user->phone : null;

// Get SMS preference
$sms_enabled = $this->User_notification_preferences->get_user_sms_preference($user_id);
?>

<?php echo form_open('admin/update_notification_preferences', ['id' => 'notification_settings_form']); ?>

<div class="settings-card">
    <h3><i class="fa fa-mobile" style="color: #6366f1;"></i> SMS Notifications</h3>
    <p class="info-text">
        Receive SMS notifications for payroll approval events including submissions, approvals, rejections, and payment confirmations.
    </p>
    
    <div class="form-group" style="margin-top: 1.5rem;">
        <label>SMS Notification Status</label>
        <div class="switch-container">
            <label class="switch">
                <input type="checkbox" 
                       name="sms_enabled" 
                       id="sms_enabled_toggle" 
                       value="1" 
                       <?php echo $sms_enabled ? 'checked' : ''; ?>
                       <?php echo empty($phone_number) ? 'disabled' : ''; ?>>
                <span class="slider"></span>
            </label>
            <span class="switch-label" id="switch_label">
                <?php echo $sms_enabled ? 'Enabled' : 'Disabled'; ?>
            </span>
        </div>
    </div>
    
    <div class="form-group">
        <label>Your Phone Number</label>
        <div>
            <?php if (!empty($phone_number)): ?>
                <div class="phone-display">
                    <i class="fa fa-phone"></i>
                    <strong><?php echo htmlspecialchars($phone_number); ?></strong>
                </div>
                <a href="<?php echo site_url('admin/manage_profile'); ?>" class="phone-edit-link">
                    <i class="fa fa-edit"></i> Edit Phone Number
                </a>
            <?php else: ?>
                <div class="warning-message">
                    <i class="fa fa-exclamation-triangle"></i>
                    <strong>Add a phone number to your profile to enable SMS notifications.</strong>
                    <br>
                    <a href="<?php echo site_url('admin/manage_profile'); ?>" style="color: #92400e; text-decoration: underline;">
                        Click here to update your profile
                    </a>
                </div>
            <?php endif; ?>
        </div>
        <p class="info-text">
            SMS notifications will be sent to this number. Make sure it's a valid mobile number.
        </p>
    </div>
    
    <?php if (!empty($phone_number)): ?>
    <div class="form-group" style="margin-top: 2rem;">
        <button type="submit" class="btn-save">
            <i class="fa fa-save"></i> Save Preferences
        </button>
    </div>
    <?php endif; ?>
</div>

<?php echo form_close(); ?>

</div>

<script>
$(document).ready(function() {
    // Toggle label text when switch changes
    $('#sms_enabled_toggle').change(function() {
        if ($(this).is(':checked')) {
            $('#switch_label').text('Enabled');
        } else {
            $('#switch_label').text('Disabled');
        }
    });
    
    // Form submission
    $('#notification_settings_form').submit(function(e) {
        e.preventDefault();
        
        // Show loading message
        showAjaxModal_alert('Saving preferences...', 'loading');
        
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function(response) {
            if (response.success === true) {
                showAjaxModal_alert(response.message, 'success');
            } else {
                showAjaxModal_alert(response.message || 'Failed to save preferences', 'error');
            }
        }).fail(function() {
            showAjaxModal_alert('An error occurred while saving preferences', 'error');
        });
    });
});
</script>
