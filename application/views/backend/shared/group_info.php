<?php
$thread = $this->crud_model->get_group_thread_for_current_user($param2);
$members = $thread ? $this->crud_model->get_group_member_profiles($param2) : array();
?>
<style>
.group-info-modal{padding:18px;color:#334155}.group-info-title{margin:0 0 14px;color:#0f172a;font-size:20px;font-weight:800}.group-info-shell{overflow-x:auto;border:1px solid #e2e8f0;border-radius:11px}.group-info-table{width:100%;min-width:620px;margin:0;border-collapse:collapse}.group-info-table th{padding:10px 11px;border-bottom:1px solid #e2e8f0;background:#f8fafc;color:#475569;font-size:12px;font-weight:800;text-transform:uppercase}.group-info-table td{padding:10px 11px;border-bottom:1px solid #eef2f7;color:#334155;font-size:13px;vertical-align:middle}.group-info-user{display:flex;align-items:center;gap:9px}.group-info-user img{width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid #e2e8f0}.group-info-empty{padding:28px;text-align:center;color:#64748b}.group-info-close{display:flex;justify-content:flex-end;margin-top:14px}.group-info-close .btn{min-height:40px;padding:8px 13px!important;border-radius:8px!important;font-size:13px!important;font-weight:800!important}
</style>
<div class="group-info-modal">
<?php if(!$thread): ?><div class="group-info-empty">This group is unavailable or you do not have access to it.</div><?php else: ?>
    <h3 class="group-info-title"><?php echo html_escape($thread['group_name']); ?> · Members</h3>
    <div class="group-info-shell"><table class="group-info-table"><thead><tr><th>Member</th><th>Role</th><th>Email</th></tr></thead><tbody>
    <?php foreach($members as $member): ?><tr><td><div class="group-info-user"><img src="<?php echo html_escape($member['image_url']); ?>" alt=""><strong><?php echo html_escape($member['name']); ?></strong></div></td><td><?php echo html_escape(ucfirst($member['type'])); ?></td><td><?php echo html_escape($member['email'] ?: '—'); ?></td></tr><?php endforeach; ?>
    </tbody></table></div>
<?php endif; ?>
<div class="group-info-close"><button type="button" class="btn btn-default" data-dismiss="modal">Close</button></div>
</div>
