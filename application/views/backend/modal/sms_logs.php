<style>
.sms-log-modal{padding:18px;color:#334155}.sms-log-shell{overflow-x:auto;border:1px solid #e2e8f0;border-radius:11px}.sms-log-table{width:100%;min-width:820px;margin:0;border-collapse:collapse}.sms-log-table th{padding:11px 12px;border-bottom:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:13px;font-weight:800;text-align:left}.sms-log-table td{padding:11px 12px;border-bottom:1px solid #eef2f7;color:#334155;font-size:13px;line-height:1.45;vertical-align:top}.sms-log-status{display:inline-flex;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:800}.sms-log-status.sent{background:#ecfdf5;color:#047857}.sms-log-status.failed{background:#fef2f2;color:#b91c1c}.sms-log-status.pending{background:#fffbeb;color:#b45309}.sms-log-message{max-width:360px;white-space:normal;overflow-wrap:anywhere}.sms-log-error{display:block;margin-top:4px;color:#b91c1c;font-size:11px}.sms-log-close{display:flex;justify-content:flex-end;margin-top:14px}.sms-log-close .btn{min-height:40px;padding:8px 13px!important;border-radius:8px!important;font-size:13px!important;font-weight:800!important}
</style>
<div class="sms-log-modal">
    <div class="sms-log-shell"><table class="sms-log-table"><thead><tr><th>Date</th><th>Recipient</th><th>Phone</th><th>Status</th><th>Message</th></tr></thead><tbody>
    <?php if(empty($logs)): ?>
        <tr><td colspan="5" style="padding:28px;text-align:center;color:#64748b">No delivery logs found for this automation.</td></tr>
    <?php else: foreach($logs as $log): ?>
        <tr>
            <td><?php echo html_escape(date('d M Y H:i', strtotime($log['sent_at']))); ?></td>
            <td><?php echo html_escape($log['recipient_name'] ?: '—'); ?></td>
            <td><?php echo html_escape($log['recipient_phone']); ?></td>
            <td><span class="sms-log-status <?php echo in_array($log['status'],['sent','failed','pending'],true)?$log['status']:'pending'; ?>"><?php echo html_escape(ucfirst($log['status'])); ?></span></td>
            <td class="sms-log-message"><?php echo html_escape($log['message']); ?><?php if(!empty($log['error_message'])): ?><span class="sms-log-error"><?php echo html_escape($log['error_message']); ?></span><?php endif; ?></td>
        </tr>
    <?php endforeach; endif; ?>
    </tbody></table></div>
    <div class="sms-log-close"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>
</div>
