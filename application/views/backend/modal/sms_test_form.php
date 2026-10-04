<style>
.sms-test-modal{padding:18px;color:#334155}.sms-test-warning{margin-bottom:14px;padding:11px 12px;border:1px solid #fde68a;border-radius:9px;background:#fffbeb;color:#92400e;font-size:13px;line-height:1.5}.sms-test-modal label{display:block;margin-bottom:6px;color:#334155;font-size:14px;font-weight:800}.sms-test-modal input{width:100%;min-height:44px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;font-size:15px!important}.sms-test-modal input:focus{border-color:#2563eb;outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.sms-test-modal .hint{margin:6px 0 0;color:#64748b;font-size:12px}.sms-test-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0}.sms-test-actions .btn{min-height:42px;padding:8px 14px!important;border-radius:8px!important;font-size:14px!important;font-weight:800!important}.sms-test-actions .btn-primary{background:#2563eb!important;border-color:#2563eb!important}@media(max-width:600px){.sms-test-modal{padding:14px}.sms-test-modal input{font-size:16px!important}.sms-test-actions{display:grid;grid-template-columns:1fr}}
</style>
<?php echo form_open(site_url('sms_automation/test_automation/'.$automation_id), array('id'=>'testForm')); ?>
<div class="sms-test-modal">
    <div class="sms-test-warning"><i class="fa fa-exclamation-triangle"></i> <strong>This sends a real SMS through the active provider and may consume SMS credit.</strong> It tests the template only; it does not prove that a legacy trigger has an execution workflow.</div>
    <label for="test_phone">Test phone number *</label>
    <input id="test_phone" type="tel" name="test_phone" required placeholder="0241234567 or +233241234567" autocomplete="tel">
    <p class="hint">Automation: <?php echo html_escape($automation['name'] ?? ''); ?></p>
    <div class="sms-test-actions"><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><button type="submit" class="btn btn-primary"><i class="fa fa-paper-plane"></i> Send Real Test SMS</button></div>
</div>
<?php echo form_close(); ?>
<script>
$('#testForm').on('submit',function(e){
    e.preventDefault();var form=$(this);var button=form.find('button[type=submit]');button.prop('disabled',true);
    $.ajax({url:form.attr('action'),type:'POST',data:form.serialize(),dataType:'json'})
      .done(function(r){showAjaxModal_alert(r.message,r.status);if(r.status==='success'&&typeof loadStatistics==='function'){loadStatistics();loadAutomations();}})
      .fail(function(xhr){var msg='Test SMS failed';try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(e){}showAjaxModal_alert(msg,'error');})
      .always(function(){button.prop('disabled',false);});
});
</script>
