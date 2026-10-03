<?php
$system_name = get_settings('system_name');
$system_currency = get_settings('currency');
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Statutory Deduction Settings - <?= $system_name; ?></title>
    
    <style>
        .settings-container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 20px;
        }
        
        .settings-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }
        
        .settings-header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        
        .settings-header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 14px;
        }
        
        .settings-card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 15px rgba(0,0,0,0.08);
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .settings-card-header {
            background: linear-gradient(to right, #f3f4f6, #e5e7eb);
            padding: 15px 20px;
            border-bottom: 2px solid #667eea;
        }
        
        .settings-card-header h2 {
            margin: 0;
            font-size: 18px;
            color: #1f2937;
            font-weight: 600;
        }
        
        .settings-card-body {
            padding: 20px;
        }
        
        .settings-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .settings-table thead {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .settings-table th {
            padding: 15px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
        }
        
        .settings-table td {
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .settings-table tbody tr:hover {
            background: #f9fafb;
        }
        
        .setting-name {
            font-weight: 600;
            color: #1f2937;
            font-size: 15px;
        }
        
        .setting-description {
            color: #6b7280;
            font-size: 13px;
            margin-top: 5px;
        }
        
        .setting-input {
            width: 100px;
            padding: 8px 12px;
            border: 2px solid #e5e7eb;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s;
        }
        
        .setting-input:focus {
            border-color: #667eea;
            outline: none;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-success {
            background: #10b981;
            color: white;
        }
        
        .btn-success:hover {
            background: #059669;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-active {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-inactive {
            background: #fee2e2;
            color: #991b1b;
        }
        
        .alert {
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .alert-info {
            background: #dbeafe;
            color: #1e40af;
            border-left: 4px solid #3b82f6;
        }
        
        .alert-warning {
            background: #fef3c7;
            color: #92400e;
            border-left: 4px solid #f59e0b;
        }
        
        .alert-success {
            background: #d1fae5;
            color: #065f46;
            border-left: 4px solid #10b981;
        }
        
        .history-link {
            color: #667eea;
            text-decoration: none;
            font-size: 13px;
            font-weight: 500;
        }
        
        .history-link:hover {
            text-decoration: underline;
        }
        
        .action-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
        }
    
/* Direct UI/UX refinement — Payroll Statutory Settings */
.settings-container {
    max-width: 1450px !important;
    margin: 0 auto !important;
    padding: 24px 28px 40px !important;
}
.settings-header {
    margin-bottom: 16px !important;
    padding: 20px 22px !important;
    border-radius: 14px !important;
    background: #0f172a !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.10) !important;
}
.settings-header h1 {
    font-size: 24px !important;
    line-height: 1.25;
    font-weight: 800 !important;
}
.settings-header p {
    margin-top: 6px !important;
    color: #cbd5e1 !important;
    font-size: 14px !important;
    line-height: 1.5;
    opacity: 1 !important;
}
.settings-card {
    margin-bottom: 16px !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.settings-card-header {
    padding: 14px 18px !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #f8fafc !important;
}
.settings-card-header h2 {
    font-size: 17px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    color: #0f172a !important;
}
.settings-card-body {
    padding: 0 !important;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}
.settings-table {
    min-width: 1000px;
    border-collapse: separate !important;
    border-spacing: 0 !important;
}
.settings-table thead {
    background: #f8fafc !important;
    color: #475569 !important;
}
.settings-table th {
    padding: 12px 13px !important;
    border-bottom: 1px solid #e2e8f0;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .03em;
}
.settings-table td {
    padding: 12px 13px !important;
    color: #334155;
    font-size: 14px;
    line-height: 1.45;
    vertical-align: middle;
}
.settings-table tbody tr:hover { background: #f8fbff !important; }
.setting-name {
    color: #0f172a !important;
    font-size: 14px !important;
    line-height: 1.4;
    font-weight: 800 !important;
}
.setting-description {
    margin-top: 3px !important;
    color: #64748b !important;
    font-size: 13px !important;
    line-height: 1.4;
}
.settings-table td strong[style*="font-size"] {
    color: #2563eb !important;
    font-size: 16px !important;
}
.setting-input {
    width: 110px !important;
    min-height: 42px;
    padding: 8px 10px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
}
.setting-input:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
}
.status-badge {
    padding: 5px 9px !important;
    border-radius: 999px !important;
    font-size: 12px !important;
    font-weight: 800 !important;
}
.settings-table small { font-size: 13px !important; }
.btn {
    min-height: 40px;
    padding: 8px 13px !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    font-weight: 700 !important;
    transition: background-color .15s ease, box-shadow .15s ease !important;
}
.btn-primary {
    background: #2563eb !important;
    box-shadow: none !important;
}
.btn-primary:hover {
    background: #1d4ed8 !important;
    transform: none !important;
    box-shadow: none !important;
}
.btn-success { background: #059669 !important; }
.btn-success:hover { background: #047857 !important; }
.btn-sm {
    min-height: 36px;
    padding: 7px 10px !important;
    font-size: 13px !important;
}
.action-buttons {
    gap: 8px !important;
    margin-top: 0 !important;
    padding: 14px 16px !important;
    border-top: 1px solid #e2e8f0 !important;
    background: #f8fafc;
}
.alert {
    margin-bottom: 14px !important;
    padding: 12px 14px !important;
    border-radius: 10px !important;
    font-size: 13px;
    line-height: 1.5;
}
.alert i.fa-2x { font-size: 18px !important; }
.history-link { font-size: 13px !important; color: #2563eb !important; }
@media (max-width: 767px) {
    .settings-container { padding: 18px 14px 32px !important; }
    .settings-header { padding: 18px !important; }
    .settings-header h1 { font-size: 21px !important; }
    .action-buttons { flex-direction: column; }
    .action-buttons .btn { width: 100%; justify-content: center; }
}
</style>
</head>
<body>

<div class="settings-container">
    <!-- Header -->
    <div class="settings-header">
        <h1><i class="fa fa-cog"></i> Payroll Statutory Settings</h1>
        <p>Configure percentage rates for SSNIT, GETFund, NHIL and other statutory deductions</p>
    </div>
    
    <!-- Warning Alert -->
    <div class="alert alert-warning">
        <i class="fa fa-exclamation-triangle fa-2x"></i>
        <div>
            <strong>Important:</strong> Changes to these settings will affect all new payroll calculations.
            Existing payroll records will NOT be modified. Please verify rates with Ghana Revenue Authority before making changes.
        </div>
    </div>
    
    <!-- Success Message -->
    <div id="successMessage" class="alert alert-success" style="display: none;">
        <i class="fa fa-check-circle fa-2x"></i>
        <div>
            <strong>Success!</strong> Statutory settings have been updated successfully.
        </div>
    </div>
    
    <!-- Settings Card -->
    <div class="settings-card">
        <div class="settings-card-header">
            <h2><i class="fa fa-percentage"></i> Statutory Deduction Rates</h2>
        </div>
        <div class="settings-card-body">
            <form id="statutorySettingsForm">
                <table class="settings-table">
                    <thead>
                        <tr>
                            <th style="width: 30%;">Deduction Type</th>
                            <th style="width: 15%;">Current Rate</th>
                            <th style="width: 15%;">New Rate (%)</th>
                            <th style="width: 10%;">Status</th>
                            <th style="width: 15%;">Last Updated</th>
                            <th style="width: 15%;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($settings as $setting): ?>
                        <?php 
                            // Hide ssnit_tier1_employee from display (used internally for PAYE calculation only)
                            if($setting->setting_key === 'ssnit_tier1_employee') continue;
                        ?>
                        <tr id="setting-row-<?= $setting->setting_id; ?>">
                            <td>
                                <div class="setting-name"><?= $setting->setting_name; ?></div>
                                <div class="setting-description"><?= $setting->description; ?></div>
                            </td>
                            <td>
                                <strong style="font-size: 18px; color: #667eea;">
                                    <?= number_format($setting->setting_value, 2); ?>%
                                </strong>
                            </td>
                            <td>
                                <input type="number" 
                                       step="0.01" 
                                       min="0" 
                                       max="100"
                                       class="setting-input" 
                                       id="rate_<?= $setting->setting_id; ?>"
                                       data-setting-id="<?= $setting->setting_id; ?>"
                                       data-current-value="<?= $setting->setting_value; ?>"
                                       value="<?= number_format($setting->setting_value, 2); ?>"
                                       placeholder="0.00">
                            </td>
                            <td>
                                <span class="status-badge <?= $setting->is_active ? 'status-active' : 'status-inactive'; ?>">
                                    <?= $setting->is_active ? 'Active' : 'Inactive'; ?>
                                </span>
                            </td>
                            <td>
                                <small style="color: #6b7280;">
                                    <?= date('M j, Y', strtotime($setting->updated_at)); ?>
                                </small>
                            </td>
                            <td>
                                <button type="button" 
                                        class="btn btn-success btn-sm update-btn" 
                                        data-setting-id="<?= $setting->setting_id; ?>"
                                        onclick="updateSetting(<?= $setting->setting_id; ?>)">
                                    <i class="fa fa-save"></i> Update
                                </button>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <div class="action-buttons">
                    <button type="button" class="btn btn-primary" onclick="updateAllSettings()">
                        <i class="fa fa-save"></i> Save All Changes
                    </button>
                    <button type="button" class="btn" style="background: #6b7280; color: white;" onclick="resetAllFields()">
                        <i class="fa fa-undo"></i> Reset to Current Values
                    </button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Info Alert -->
    <div class="alert alert-info">
        <i class="fa fa-info-circle fa-2x"></i>
        <div>
            <strong>Note:</strong> All percentage values are automatically applied to payroll calculations.
            Changes take effect immediately for new payroll entries.
        </div>
    </div>
</div>

<script src="<?php echo base_url(); ?>assets/js/jquery-1.11.2.min.js"></script>
<script>
$(document).ready(function() {
    // Highlight changed values
    $('.setting-input').on('input', function() {
        const currentValue = parseFloat($(this).data('current-value'));
        const newValue = parseFloat($(this).val());
        
        if(Math.abs(currentValue - newValue) > 0.01) {
            $(this).css('border-color', '#f59e0b');
            $(this).css('background', '#fef3c7');
        } else {
            $(this).css('border-color', '#e5e7eb');
            $(this).css('background', 'white');
        }
    });
});

function updateSetting(settingId) {
    const newValue = parseFloat($('#rate_' + settingId).val());
    const currentValue = parseFloat($('#rate_' + settingId).data('current-value'));
    
    if(isNaN(newValue) || newValue < 0 || newValue > 100) {
        showAjaxModal_alert('Please enter a valid percentage between 0 and 100', 'warning');
        return;
    }
    
    if(Math.abs(currentValue - newValue) < 0.01) {
        showAjaxModal_alert('No changes detected', 'info');
        return;
    }
    
    // Confirm the change
    showConfirmModal(
        'Confirm Rate Change',
        `Are you sure you want to change this rate from <strong>${currentValue.toFixed(2)}%</strong> to <strong>${newValue.toFixed(2)}%</strong>?<br><br>This will affect all future payroll calculations.`,
        function() {
            // Proceed with update
            $.ajax({
                url: '<?= site_url('admin/payroll_statutory_update'); ?>',
                type: 'POST',
                data: {
                    setting_id: settingId,
                    new_value: newValue
                },
                success: function(response) {
                    const data = JSON.parse(response);
                    if(data.status === 'success') {
                        $('#successMessage').fadeIn().delay(3000).fadeOut();
                        
                        // Update current value
                        $('#rate_' + settingId).data('current-value', newValue);
                        $('#rate_' + settingId).css('border-color', '#e5e7eb');
                        $('#rate_' + settingId).css('background', 'white');
                        
                        // Update display
                        $(`#setting-row-${settingId} td:eq(1) strong`).text(newValue.toFixed(2) + '%');
                        $(`#setting-row-${settingId} td:eq(4) small`).text('Just now');
                        
                        showAjaxModal_alert('Setting updated successfully!', 'success');
                    } else {
                        showAjaxModal_alert('Error: ' + data.message, 'error');
                    }
                },
                error: function() {
                    showAjaxModal_alert('Failed to update setting. Please try again.', 'error');
                }
            });
        },
        'Confirm Change',
        'warning'
    );
}

function updateAllSettings() {
    const changes = [];
    
    $('.setting-input').each(function() {
        const settingId = $(this).data('setting-id');
        const currentValue = parseFloat($(this).data('current-value'));
        const newValue = parseFloat($(this).val());
        
        if(Math.abs(currentValue - newValue) > 0.01) {
            changes.push({
                setting_id: settingId,
                new_value: newValue,
                old_value: currentValue
            });
        }
    });
    
    if(changes.length === 0) {
        showAjaxModal_alert('No changes detected', 'info');
        return;
    }
    
    // Confirm bulk update
    showConfirmModal(
        'Confirm Bulk Update',
        `Are you sure you want to update <strong>${changes.length}</strong> statutory rate(s)?<br><br>This will affect all future payroll calculations.`,
        function() {
            // Proceed with bulk update
            $.ajax({
                url: '<?= site_url('admin/payroll_statutory_update_bulk'); ?>',
                type: 'POST',
                data: {
                    changes: JSON.stringify(changes)
                },
                success: function(response) {
                    const data = JSON.parse(response);
                    if(data.status === 'success') {
                        $('#successMessage').fadeIn().delay(3000).fadeOut();
                        showAjaxModal_alert(`Successfully updated ${changes.length} statutory rate(s)!`, 'success', false);
                        setTimeout(function() {
                            location.reload();
                        }, 2000);
                    } else {
                        showAjaxModal_alert('Error: ' + data.message, 'error');
                    }
                },
                error: function() {
                    showAjaxModal_alert('Failed to update settings. Please try again.', 'error');
                }
            });
        },
        'Confirm Bulk Update',
        'warning'
    );
}

function resetAllFields() {
    $('.setting-input').each(function() {
        const currentValue = $(this).data('current-value');
        $(this).val(parseFloat(currentValue).toFixed(2));
        $(this).css('border-color', '#e5e7eb');
        $(this).css('background', 'white');
    });
}
</script>

</body>
</html>
