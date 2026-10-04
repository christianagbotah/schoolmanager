<?php
$fee_modules = [
    'feeding' => [
        'label' => 'Feeding Fee',
        'description' => 'Collect daily feeding fees from students.',
        'icon' => 'fa-utensils'
    ],
    'classes' => [
        'label' => 'Classes Fee',
        'description' => 'Collect daily classes or tuition fees from students.',
        'icon' => 'fa-book'
    ],
    'transport' => [
        'label' => 'Transport Fare',
        'description' => 'Collect transport fares from students using school buses.',
        'icon' => 'fa-bus'
    ],
    'breakfast' => [
        'label' => 'Breakfast Fee',
        'description' => 'Collect breakfast fees from participating students.',
        'icon' => 'fa-coffee'
    ],
    'water' => [
        'label' => 'Water Fee',
        'description' => 'Collect water fees from students.',
        'icon' => 'fa-tint'
    ]
];
?>
<style>
.daily-fee-settings-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
    color: #334155;
}
.daily-fee-settings-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.daily-fee-settings-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.daily-fee-settings-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.daily-fee-settings-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.daily-fee-settings-summary {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 40px;
    padding: 8px 11px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #475569;
    font-size: 13px;
    font-weight: 800;
    white-space: nowrap;
}
.daily-fee-settings-card {
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.daily-fee-settings-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}
.daily-fee-module {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 104px;
    padding: 15px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #f8fafc;
    transition: border-color .15s ease, background-color .15s ease;
}
.daily-fee-module:hover {
    border-color: #cbd5e1;
    background: #fff;
}
.daily-fee-module.is-active {
    border-color: #86efac;
    background: #f0fdf4;
}
.daily-fee-module-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    border-radius: 10px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 17px;
}
.daily-fee-module-main {
    flex: 1;
    min-width: 0;
}
.daily-fee-module-title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin: 0 0 5px;
    color: #0f172a;
    font-size: 15px;
    line-height: 1.35;
    font-weight: 800;
}
.daily-fee-module-desc {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
}
.daily-fee-state {
    display: inline-flex;
    align-items: center;
    min-height: 25px;
    padding: 4px 7px;
    border-radius: 999px;
    background: #e2e8f0;
    color: #475569;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .035em;
}
.daily-fee-module.is-active .daily-fee-state {
    background: #dcfce7;
    color: #047857;
}
.daily-fee-toggle {
    position: relative;
    width: 52px;
    height: 28px;
    flex: 0 0 52px;
    margin: 0;
}
.daily-fee-toggle input {
    position: absolute;
    width: 1px;
    height: 1px;
    opacity: 0;
}
.daily-fee-toggle-slider {
    position: absolute;
    inset: 0;
    border-radius: 28px;
    background: #cbd5e1;
    cursor: pointer;
    transition: background-color .2s ease;
}
.daily-fee-toggle-slider:before {
    content: '';
    position: absolute;
    left: 4px;
    bottom: 4px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(15,23,42,.25);
    transition: transform .2s ease;
}
.daily-fee-toggle input:checked + .daily-fee-toggle-slider {
    background: #2563eb;
}
.daily-fee-toggle input:checked + .daily-fee-toggle-slider:before {
    transform: translateX(24px);
}
.daily-fee-toggle input:focus-visible + .daily-fee-toggle-slider {
    box-shadow: 0 0 0 3px rgba(37,99,235,.18);
}
.daily-fee-settings-note {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    background: #eff6ff;
    color: #1e3a8a;
    font-size: 13px;
    line-height: 1.5;
}
.daily-fee-settings-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid #e2e8f0;
}
.daily-fee-settings-actions .btn {
    min-height: 44px;
    padding: 9px 15px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.daily-fee-settings-actions .btn:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}
.daily-fee-settings-actions .btn:disabled {
    opacity: .6;
    cursor: wait;
}
@media (max-width: 900px) {
    .daily-fee-settings-grid { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
    .daily-fee-settings-workspace { padding: 18px 14px 32px !important; }
    .daily-fee-settings-head { display: block; }
    .daily-fee-settings-head h1 { font-size: 26px !important; }
    .daily-fee-settings-summary { margin-top: 14px; }
    .daily-fee-settings-card { padding: 14px; }
    .daily-fee-module { min-height: 98px; padding: 13px; }
    .daily-fee-settings-actions .btn { width: 100%; }
}
@media (max-width: 420px) {
    .daily-fee-module {
        display: grid;
        grid-template-columns: 42px minmax(0,1fr);
    }
    .daily-fee-toggle {
        grid-column: 1 / -1;
        justify-self: end;
    }
}
</style>

<div class="daily-fee-settings-workspace">
    <div class="daily-fee-settings-head">
        <div>
            <p class="daily-fee-settings-eyebrow">Daily Fees</p>
            <h1>Daily Fee Module Settings</h1>
            <p>Enable only the fee modules your school collects. Disabled modules remain hidden from the daily collection workflow.</p>
        </div>
        <span class="daily-fee-settings-summary"><i class="fa fa-sliders-h"></i> 5 configurable modules</span>
    </div>

    <div class="daily-fee-settings-card">
        <?php echo form_open('admin/daily_fee_module_settings/update', ['id' => 'module_settings_form']); ?>
            <div class="daily-fee-settings-grid">
                <?php foreach ($fee_modules as $module_key => $module):
                    $enabled = is_fee_module_enabled($module_key);
                ?>
                <div class="daily-fee-module <?php echo $enabled ? 'is-active' : ''; ?>" data-module="<?php echo html_escape($module_key); ?>">
                    <span class="daily-fee-module-icon"><i class="fa <?php echo html_escape($module['icon']); ?>"></i></span>
                    <div class="daily-fee-module-main">
                        <h2 class="daily-fee-module-title">
                            <?php echo html_escape($module['label']); ?>
                            <span class="daily-fee-state"><?php echo $enabled ? 'Active' : 'Disabled'; ?></span>
                        </h2>
                        <p class="daily-fee-module-desc"><?php echo html_escape($module['description']); ?></p>
                    </div>
                    <label class="daily-fee-toggle" aria-label="Toggle <?php echo html_escape($module['label']); ?>">
                        <input type="checkbox" name="fee_module_<?php echo html_escape($module_key); ?>" value="1" <?php echo $enabled ? 'checked' : ''; ?>>
                        <span class="daily-fee-toggle-slider"></span>
                    </label>
                </div>
                <?php endforeach; ?>
            </div>

            <div class="daily-fee-settings-note">
                <i class="fa fa-info-circle"></i>
                Saving changes updates module availability for future daily-fee collection screens. Existing payment and wallet history is not deleted by disabling a module.
            </div>

            <div class="daily-fee-settings-actions">
                <button type="submit" class="btn btn-primary" id="save_module_settings">
                    <i class="fa fa-save"></i> Save Module Settings
                </button>
            </div>
        <?php echo form_close(); ?>
    </div>
</div>

<script>
(function($) {
    function syncCardState(input) {
        var card = $(input).closest('.daily-fee-module');
        var enabled = $(input).is(':checked');
        card.toggleClass('is-active', enabled);
        card.find('.daily-fee-state').text(enabled ? 'Active' : 'Disabled');
    }

    $('.daily-fee-toggle input').on('change', function() {
        syncCardState(this);
    });

    $('#module_settings_form').on('submit', function(e) {
        e.preventDefault();
        var form = $(this);
        var button = $('#save_module_settings');
        button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Saving...');
        showAjaxModal_alert('Saving...', 'loading');

        $.ajax({
            url: form.attr('action'),
            type: 'POST',
            data: form.serialize(),
            dataType: 'json'
        }).done(function(response) {
            if (response.status === 'success') {
                showAjaxModal_alert(response.message || 'Module settings saved successfully.', 'success');
                setTimeout(function() { location.reload(); }, 900);
                return;
            }
            showAjaxModal_alert(response.message || 'Operation failed', 'error');
            button.prop('disabled', false).html('<i class="fa fa-save"></i> Save Module Settings');
        }).fail(function(xhr) {
            var message = 'Could not save module settings.';
            try {
                var response = JSON.parse(xhr.responseText);
                if (response.message) message = response.message;
            } catch (ignore) {}
            showAjaxModal_alert(message, 'error');
            button.prop('disabled', false).html('<i class="fa fa-save"></i> Save Module Settings');
        });
    });
})(jQuery);
</script>
