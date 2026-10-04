<?php
$group_messages = isset($group_messages) && is_array($group_messages) ? $group_messages : $this->crud_model->get_group_threads_for_current_user();
$current_thread = isset($current_message_thread_code) ? trim((string)$current_message_thread_code) : '';
$group_route_prefix = isset($group_route_prefix) ? trim($group_route_prefix, '/') : 'admin';
$group_private_message_url = isset($group_private_message_url) ? $group_private_message_url : site_url($group_route_prefix.'/message');
$can_manage_groups = !empty($can_manage_groups);
$csrf_name = $this->security->get_csrf_token_name();
$csrf_hash = $this->security->get_csrf_hash();
?>
<style>
.group-msg-workspace{margin:0!important;padding:24px 28px 40px!important;background:#f8fafc;min-height:100%;color:#334155}
.group-msg-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e2e8f0}.group-msg-eyebrow{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.group-msg-head h1{margin:0;color:#0f172a;font-size:30px!important;line-height:1.2;font-weight:800;letter-spacing:-.02em}.group-msg-head p:last-child{margin:7px 0 0;color:#64748b;font-size:15px;line-height:1.5}.group-msg-head-actions{display:flex;gap:8px;flex-wrap:wrap}.group-msg-head-actions .btn{min-height:42px;padding:9px 13px!important;border-radius:9px!important;font-size:13px!important;font-weight:800!important}.group-msg-head-actions .btn-primary{background:#2563eb!important;border-color:#2563eb!important}
.group-msg-layout{display:grid;grid-template-columns:320px minmax(0,1fr);gap:14px;align-items:start}.group-msg-sidebar,.group-msg-main{border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05);overflow:hidden}.group-msg-sidebar-head{padding:13px 14px;border-bottom:1px solid #e2e8f0;background:#f8fafc}.group-msg-sidebar-head input{width:100%;min-height:40px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-size:14px}.group-msg-list{max-height:620px;overflow-y:auto}.group-msg-item{display:block;padding:12px 14px;border-bottom:1px solid #eef2f7;color:#334155!important;text-decoration:none!important}.group-msg-item:hover{background:#f8fbff}.group-msg-item.active{background:#eff6ff;border-left:3px solid #2563eb;padding-left:11px}.group-msg-item-title{display:flex;align-items:center;justify-content:space-between;gap:8px}.group-msg-item-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#0f172a;font-size:14px;font-weight:800}.group-msg-member-count{flex:0 0 auto;padding:4px 7px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:11px;font-weight:800}.group-msg-item-meta{display:flex;justify-content:space-between;gap:8px;margin-top:5px;color:#64748b;font-size:11px}.group-msg-sidebar-empty{padding:28px 16px;text-align:center;color:#64748b;font-size:13px}.group-msg-main{min-height:560px}.group-msg-thread-actions{display:flex;gap:6px;flex-wrap:wrap}.group-msg-thread-actions .btn{min-height:36px;padding:6px 9px!important;border-radius:7px!important;font-size:12px!important;font-weight:800!important}
@media(max-width:900px){.group-msg-layout{grid-template-columns:1fr}.group-msg-list{max-height:270px}.group-msg-main{min-height:420px}}
@media(max-width:767px){.group-msg-workspace{padding:18px 14px 32px!important}.group-msg-head{display:block}.group-msg-head h1{font-size:26px!important}.group-msg-head-actions{display:grid;grid-template-columns:1fr;margin-top:14px}.group-msg-head-actions .btn{width:100%}}
</style>
<div class="group-msg-workspace">
    <div class="group-msg-head">
        <div><p class="group-msg-eyebrow">Communication</p><h1><?php echo get_phrase('group_messaging'); ?></h1><p>Private group conversations for selected school users, with validated membership and attachments.</p></div>
        <div class="group-msg-head-actions">
            <a href="<?php echo $group_private_message_url; ?>" class="btn btn-default"><i class="fa fa-comment"></i> <?php echo get_phrase('private_message'); ?></a>
            <?php if($can_manage_groups): ?><button type="button" class="btn btn-primary" onclick="showAjaxModal('<?php echo site_url('modal/popup/create_group'); ?>','big')"><i class="fa fa-plus"></i> Create Group</button><?php endif; ?>
        </div>
    </div>

    <div class="group-msg-layout">
        <aside class="group-msg-sidebar">
            <div class="group-msg-sidebar-head"><input type="search" id="group_message_search" placeholder="Search groups…" autocomplete="off"></div>
            <div class="group-msg-list" id="group_message_list">
                <?php if(empty($group_messages)): ?>
                    <div class="group-msg-sidebar-empty">No groups are available for your account.</div>
                <?php else: foreach($group_messages as $group):
                    $member_count = count($this->crud_model->group_thread_member_keys($group));
                    $last_ts = !empty($group['last_message_timestamp']) ? (int)$group['last_message_timestamp'] : (int)$group['created_timestamp'];
                    $is_active = $current_thread !== '' && hash_equals((string)$current_thread, (string)$group['group_message_thread_code']);
                ?>
                    <a class="group-msg-item <?php echo $is_active?'active':''; ?>" data-group-name="<?php echo html_escape(strtolower($group['group_name'])); ?>" href="<?php echo site_url($group_route_prefix.'/group_message/group_message_read/'.$group['group_message_thread_code']); ?>">
                        <div class="group-msg-item-title"><span class="group-msg-item-name"><?php echo html_escape($group['group_name']); ?></span><span class="group-msg-member-count"><?php echo $member_count; ?></span></div>
                        <div class="group-msg-item-meta"><span><?php echo $member_count===1?'1 member':$member_count.' members'; ?></span><span><?php echo $last_ts?date('d M', $last_ts):''; ?></span></div>
                    </a>
                <?php endforeach; endif; ?>
            </div>
        </aside>

        <main class="group-msg-main">
            <?php
            if ($message_inner_page_name === 'group_message_read' && $current_thread !== '') {
                include APPPATH.'views/backend/shared/group_message_read.php';
            } else {
                include APPPATH.'views/backend/shared/group_message_home.php';
            }
            ?>
        </main>
    </div>
</div>
<script>
$('#group_message_search').on('input',function(){var q=$(this).val().toLowerCase().trim();$('#group_message_list .group-msg-item').each(function(){$(this).toggle(!q||String($(this).data('group-name')).indexOf(q)!==-1);});});
function groupPostAction(url,successRedirect,confirmText){
    if(confirmText&&!window.confirm(confirmText))return;
    var data={};data[<?php echo json_encode($csrf_name); ?>]=<?php echo json_encode($csrf_hash); ?>;
    $.ajax({url:url,type:'POST',data:data,dataType:'json'}).done(function(r){if(r.status==='success'){if(typeof showAjaxModal_alert==='function')showAjaxModal_alert(r.message,'success');setTimeout(function(){window.location.href=successRedirect;},650);}else if(typeof showAjaxModal_alert==='function')showAjaxModal_alert(r.message||'Operation failed','error');}).fail(function(xhr){var msg='Operation failed';try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(e){}if(typeof showAjaxModal_alert==='function')showAjaxModal_alert(msg,'error');});
}
</script>
