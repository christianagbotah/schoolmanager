<?php
$automation_id = isset($param1) ? (int)$param1 : 0;
$automation = $automation_id ? $this->db->where('id', $automation_id)->get('sms_automations')->row_array() : [];
$current_trigger = isset($automation['trigger_event']) ? $automation['trigger_event'] : 'monthly_bill_reminder';
$is_supported = isset($supported_triggers[$current_trigger]);
?>
<style>
.sms-auto-modal{padding:18px;color:#334155}.sms-auto-modal .modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.sms-auto-modal .field{margin-bottom:14px}.sms-auto-modal .field.full{grid-column:1/-1}.sms-auto-modal label{display:block;margin-bottom:6px;color:#334155;font-size:14px;font-weight:800}.sms-auto-modal input,.sms-auto-modal select,.sms-auto-modal textarea{width:100%;min-height:44px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;font-size:15px!important}.sms-auto-modal textarea{min-height:130px;resize:vertical}.sms-auto-modal input:focus,.sms-auto-modal select:focus,.sms-auto-modal textarea:focus{border-color:#2563eb;outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.sms-auto-modal .hint{margin:6px 0 0;color:#64748b;font-size:12px;line-height:1.45}.sms-auto-modal .legacy-note{margin-bottom:14px;padding:11px 12px;border:1px solid #fde68a;border-radius:9px;background:#fffbeb;color:#92400e;font-size:13px;font-weight:700}.sms-auto-modal .placeholder-list{display:flex;flex-wrap:wrap;gap:6px}.sms-auto-modal code{padding:4px 6px;border-radius:6px;background:#f1f5f9;color:#334155;font-size:12px}.sms-auto-modal .status-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc}.sms-auto-modal .status-row input{width:20px;min-height:20px;height:20px}.sms-auto-modal .modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:6px;padding-top:14px;border-top:1px solid #e2e8f0}.sms-auto-modal .modal-actions .btn{min-height:42px;padding:8px 14px!important;border-radius:8px!important;font-size:14px!important;font-weight:800!important}.sms-auto-modal .btn-primary{background:#2563eb!important;border-color:#2563eb!important}@media(max-width:700px){.sms-auto-modal{padding:14px}.sms-auto-modal .modal-grid{grid-template-columns:1fr}.sms-auto-modal .field.full{grid-column:auto}.sms-auto-modal input,.sms-auto-modal select,.sms-auto-modal textarea{font-size:16px!important}.sms-auto-modal .modal-actions{display:grid;grid-template-columns:1fr}}
</style>
<?php echo form_open(site_url('sms_automation/save'), array('id'=>'smsAutomationForm')); ?>
<div class="sms-auto-modal">
    <?php if($automation_id && !$is_supported): ?>
        <div class="legacy-note"><i class="fa fa-exclamation-triangle"></i> This is a legacy rule. Its trigger is not connected to an execution workflow, so it will remain inactive until that workflow is implemented.</div>
    <?php endif; ?>
    <?php if($automation_id): ?><input type="hidden" name="automation_id" value="<?php echo $automation_id; ?>"><?php endif; ?>

    <div class="modal-grid">
        <div class="field full">
            <label for="automation_name">Automation name *</label>
            <input id="automation_name" type="text" name="name" required maxlength="255" value="<?php echo html_escape($automation['name'] ?? ''); ?>" placeholder="Monthly outstanding fee reminder">
        </div>
        <div class="field">
            <label for="trigger_event">Trigger *</label>
            <select id="trigger_event" name="trigger_event" required>
                <?php if($automation_id && !$is_supported): ?>
                    <option value="<?php echo html_escape($current_trigger); ?>" selected><?php echo html_escape(str_replace('_',' ',ucwords($current_trigger,'_'))); ?> · legacy</option>
                <?php endif; ?>
                <?php foreach($supported_triggers as $value=>$label): ?>
                    <option value="<?php echo html_escape($value); ?>" <?php echo $current_trigger===$value?'selected':''; ?>><?php echo html_escape($label); ?></option>
                <?php endforeach; ?>
            </select>
            <p class="hint">Connected workflow: first day of each month at 08:00 Ghana time.</p>
        </div>
        <div class="field">
            <label>Recipients</label>
            <input type="text" value="Parents with outstanding balances" disabled>
            <input type="hidden" name="recipients" value="parents">
            <p class="hint">The monthly bill executor groups all children under each parent.</p>
        </div>
        <div class="field full">
            <label for="message_template">Message template *</label>
            <textarea id="message_template" name="message_template" required placeholder="Dear {parent_name}, your outstanding balance at {school_name} is {amount}. Breakdown: {breakdown}"><?php echo html_escape($automation['message_template'] ?? 'Dear {parent_name}, your outstanding balance at {school_name} is {amount}. Breakdown: {breakdown}. Please settle outstanding fees. Thank you.'); ?></textarea>
            <p class="hint">Available placeholders</p>
            <div class="placeholder-list"><code>{parent_name}</code><code>{student_name}</code><code>{amount}</code><code>{currency}</code><code>{school_name}</code><code>{date}</code><code>{breakdown}</code></div>
        </div>
        <div class="field full">
            <div class="status-row">
                <div><strong style="display:block;color:#0f172a;font-size:14px">Automation status</strong><span class="hint">Activate only after reviewing the template and running a test SMS.</span></div>
                <input type="checkbox" name="is_active" value="1" <?php echo ($is_supported && (!isset($automation['is_active']) || (int)$automation['is_active']===1))?'checked':''; ?> <?php echo !$is_supported?'disabled':''; ?>>
            </div>
        </div>
    </div>

    <div class="modal-actions"><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Save Automation</button></div>
</div>
<?php echo form_close(); ?>
<script>
$('#smsAutomationForm').on('submit',function(e){
    e.preventDefault();var form=$(this);var button=form.find('button[type=submit]');button.prop('disabled',true);
    $.ajax({url:form.attr('action'),type:'POST',data:form.serialize(),dataType:'json'})
      .done(function(r){if(typeof smsAutomationCsrfHash!=='undefined'){var token=form.find('input[name="'+smsAutomationCsrfName+'"]');if(token.length)smsAutomationCsrfHash=token.val();}showAjaxModal_alert(r.message,r.status);if(r.status==='success'){setTimeout(function(){location.reload();},800);}})
      .fail(function(xhr){var msg='Operation failed';try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(e){}showAjaxModal_alert(msg,'error');button.prop('disabled',false);});
});
</script>
