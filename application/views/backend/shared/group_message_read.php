<?php
$thread = $this->crud_model->get_group_thread_for_current_user($current_message_thread_code);
$messages = $thread ? $this->crud_model->get_group_messages_for_current_user($current_message_thread_code) : array();
$members = $thread ? $this->crud_model->get_group_member_profiles($current_message_thread_code) : array();
?>
<style>
.group-thread{display:flex;flex-direction:column;min-height:558px}.group-thread-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc}.group-thread-head h3{margin:0;color:#0f172a;font-size:17px;font-weight:800}.group-thread-head p{margin:4px 0 0;color:#64748b;font-size:12px}.group-thread-messages{flex:1;max-height:430px;overflow-y:auto;padding:16px;background:#fff}.group-message-entry{display:grid;grid-template-columns:38px minmax(0,1fr);gap:10px;margin-bottom:14px}.group-message-avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid #e2e8f0}.group-message-bubble{padding:11px 12px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}.group-message-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px}.group-message-name{color:#0f172a;font-size:13px;font-weight:800}.group-message-date{color:#94a3b8;font-size:11px}.group-message-text{color:#334155;font-size:14px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}.group-message-file{display:inline-flex;align-items:center;gap:7px;margin-top:9px;padding:7px 9px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;color:#1d4ed8!important;font-size:12px;font-weight:800;text-decoration:none!important}.group-thread-empty{padding:50px 16px;text-align:center;color:#64748b;font-size:13px}.group-thread-reply{padding:14px 16px;border-top:1px solid #e2e8f0;background:#f8fafc}.group-thread-reply textarea{width:100%;min-height:88px;padding:10px 11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;font-size:15px;resize:vertical}.group-thread-reply textarea:focus{border-color:#2563eb;outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.group-thread-reply-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px}.group-thread-reply input[type=file]{max-width:420px;font-size:13px}.group-thread-reply .btn{min-height:40px;padding:8px 14px!important;border-radius:8px!important;font-size:13px!important;font-weight:800!important}.group-thread-reply .btn-primary{background:#2563eb!important;border-color:#2563eb!important}@media(max-width:650px){.group-thread-head{display:block}.group-msg-thread-actions{margin-top:10px}.group-thread-reply-row{display:grid;grid-template-columns:1fr}.group-thread-reply input[type=file]{max-width:100%;width:100%}.group-thread-reply .btn{width:100%}}
</style>
<?php if(!$thread): ?>
<div class="group-thread-empty">This group is unavailable or you no longer have access to it.</div>
<?php else: ?>
<div class="group-thread">
    <div class="group-thread-head">
        <div><h3><?php echo html_escape($thread['group_name']); ?></h3><p><?php echo count($members); ?> member<?php echo count($members)===1?'':'s'; ?></p></div>
        <div class="group-msg-thread-actions">
            <button type="button" class="btn btn-default" onclick="showAjaxModal('<?php echo site_url('modal/popup/group_info/'.$thread['group_message_thread_code']); ?>','big')"><i class="fa fa-users"></i> Members</button>
            <?php if(!empty($can_manage_groups)): ?>
                <button type="button" class="btn btn-default" onclick="showAjaxModal('<?php echo site_url('modal/popup/edit_group/'.$thread['group_message_thread_code']); ?>','big')"><i class="fa fa-edit"></i> Edit</button>
                <button type="button" class="btn btn-danger" onclick="groupPostAction('<?php echo site_url($group_route_prefix.'/group_message/delete/'.$thread['group_message_thread_code']); ?>','<?php echo site_url($group_route_prefix.'/group_message'); ?>','Delete this group and all of its messages?')"><i class="fa fa-trash"></i> Delete</button>
            <?php else: ?>
                <button type="button" class="btn btn-default" onclick="groupPostAction('<?php echo site_url($group_route_prefix.'/group_message/leave/'.$thread['group_message_thread_code']); ?>','<?php echo site_url($group_route_prefix.'/group_message'); ?>','Leave this group?')"><i class="fa fa-sign-out"></i> Leave</button>
            <?php endif; ?>
        </div>
    </div>
    <div class="group-thread-messages" id="group_thread_messages">
        <?php if(empty($messages)): ?><div class="group-thread-empty">No messages yet. Start the conversation below.</div><?php else: foreach($messages as $message):
            $profile = $this->crud_model->get_group_user_profile($message['sender']);
            $display_name = $profile ? $profile['name'] : 'Unknown user';
            $image_url = $profile ? $profile['image_url'] : base_url('uploads/user.jpg');
            $attachment = !empty($message['attached_file_name']) ? basename($message['attached_file_name']) : '';
        ?>
            <div class="group-message-entry">
                <img class="group-message-avatar" src="<?php echo html_escape($image_url); ?>" alt="">
                <div class="group-message-bubble">
                    <div class="group-message-meta"><span class="group-message-name"><?php echo html_escape($display_name); ?></span><span class="group-message-date"><?php echo !empty($message['timestamp'])?date('d M Y · H:i',(int)$message['timestamp']):''; ?></span></div>
                    <?php if(trim((string)$message['message'])!==''): ?><div class="group-message-text"><?php echo html_escape($message['message']); ?></div><?php endif; ?>
                    <?php if($attachment!==''): ?><a class="group-message-file" href="<?php echo base_url('uploads/group_messaging_attached_file/'.rawurlencode($attachment)); ?>" target="_blank" rel="noopener"><i class="fa fa-paperclip"></i> <?php echo html_escape($attachment); ?></a><?php endif; ?>
                </div>
            </div>
        <?php endforeach; endif; ?>
    </div>
    <?php echo form_open(site_url($group_route_prefix.'/group_message/send_reply/'.$thread['group_message_thread_code']), array('enctype'=>'multipart/form-data','id'=>'group_reply_form')); ?>
    <div class="group-thread-reply">
        <textarea name="message" id="group_reply_message" placeholder="Write a reply…"></textarea>
        <div class="group-thread-reply-row"><div><input type="file" id="group_reply_attachment" name="attached_file_on_messaging" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"><div style="margin-top:4px;color:#64748b;font-size:11px">PDF, DOC, DOCX, JPG or PNG · maximum 4 MB</div></div><button type="submit" class="btn btn-primary"><i class="fa fa-paper-plane"></i> Send Reply</button></div>
    </div>
    <?php echo form_close(); ?>
</div>
<script>
(function(){var box=document.getElementById('group_thread_messages');if(box)box.scrollTop=box.scrollHeight;})();
$('#group_reply_form').on('submit',function(e){
    var text=$.trim($('#group_reply_message').val()),file=$('#group_reply_attachment')[0];
    if(!text&&(!file||!file.files||!file.files.length)){e.preventDefault();if(typeof showAjaxModal_alert==='function')showAjaxModal_alert('Write a message or choose an attachment.','warning');return false;}
    <?php if($group_route_prefix==='teacher'): ?>
    e.preventDefault();var form=this;var button=$(form).find('button[type=submit]').prop('disabled',true);
    $.ajax({url:form.action,type:'POST',data:new FormData(form),contentType:false,processData:false,dataType:'json'}).done(function(r){if(typeof showAjaxModal_alert==='function')showAjaxModal_alert(r.message,r.status);if(r.status==='success')setTimeout(function(){location.reload();},650);}).fail(function(xhr){var msg='Message could not be sent.';try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(e){}if(typeof showAjaxModal_alert==='function')showAjaxModal_alert(msg,'error');}).always(function(){button.prop('disabled',false);});
    <?php endif; ?>
});
</script>
<?php endif; ?>
