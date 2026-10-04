<?php
include APPPATH.'views/backend/shared/group_member_picker_data.php';
$group_info = $this->crud_model->get_group_thread_for_current_user($param2);
if(!$group_info){ echo '<div style="padding:18px" class="alert alert-danger">Group unavailable or access denied.</div>'; return; }
$selected_members = array_flip($this->crud_model->group_thread_member_keys($group_info));
?>
<style>
.group-form-modal{padding:18px;color:#334155}.group-form-modal .field{margin-bottom:14px}.group-form-modal label{display:block;margin-bottom:6px;color:#334155;font-size:14px;font-weight:800}.group-form-modal input[type=text]{width:100%;min-height:44px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;font-size:15px}.group-form-modal input[type=text]:focus{border-color:#2563eb;outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.group-member-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.group-member-card{border:1px solid #e2e8f0;border-radius:11px;background:#fff;overflow:hidden}.group-member-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 11px;border-bottom:1px solid #e2e8f0;background:#f8fafc}.group-member-head strong{color:#0f172a;font-size:13px}.group-member-head label{display:flex;align-items:center;gap:5px;margin:0;color:#64748b;font-size:11px;font-weight:800}.group-member-search{padding:8px;border-bottom:1px solid #eef2f7}.group-member-search input{width:100%;min-height:36px!important;padding:7px 8px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;font-size:13px!important}.group-member-list{max-height:230px;overflow-y:auto}.group-member-row{display:grid;grid-template-columns:26px minmax(0,1fr);gap:7px;padding:8px 10px;border-bottom:1px solid #f1f5f9;cursor:pointer}.group-member-row:hover{background:#f8fbff}.group-member-row input{margin-top:3px}.group-member-name{display:block;color:#0f172a;font-size:12px;font-weight:800}.group-member-sub{display:block;margin-top:2px;color:#64748b;font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.group-member-empty{padding:20px 10px;text-align:center;color:#94a3b8;font-size:12px}.group-form-hint{margin:7px 0 0;color:#64748b;font-size:12px;line-height:1.45}.group-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:15px;padding-top:14px;border-top:1px solid #e2e8f0}.group-form-actions .btn{min-height:42px;padding:8px 14px!important;border-radius:8px!important;font-size:14px!important;font-weight:800!important}.group-form-actions .btn-primary{background:#2563eb!important;border-color:#2563eb!important}@media(max-width:900px){.group-member-grid{grid-template-columns:1fr}}@media(max-width:600px){.group-form-modal{padding:14px}.group-form-modal input[type=text]{font-size:16px}.group-form-actions{display:grid;grid-template-columns:1fr}}
</style>
<?php echo form_open(site_url('admin/group_message/edit_group/'.$group_info['group_message_thread_code']), array('id'=>'group_message_edit_form')); ?>
<div class="group-form-modal">
    <div class="field"><label for="group_name_edit">Group name *</label><input id="group_name_edit" type="text" name="group_name" required maxlength="255" value="<?php echo html_escape($group_info['group_name']); ?>"><p class="group-form-hint">Your admin account remains a member automatically.</p></div>
    <div class="group-member-grid">
    <?php foreach($member_groups as $type=>$users): ?>
        <section class="group-member-card" data-member-type="<?php echo $type; ?>">
            <div class="group-member-head"><strong><?php echo html_escape(ucfirst($type)); ?>s · <?php echo count($users); ?></strong><label><input type="checkbox" class="group-check-all"> Select visible</label></div>
            <div class="group-member-search"><input type="search" class="group-member-filter" placeholder="Search <?php echo $type; ?>s…"></div>
            <div class="group-member-list">
                <?php if(!$users): ?><div class="group-member-empty">No eligible <?php echo $type; ?>s found.</div><?php else: foreach($users as $user): $id=(int)$user[$type.'_id']; $key=$type.'-'.$id; ?>
                    <label class="group-member-row" data-member-text="<?php echo html_escape(strtolower(($user['name']??'').' '.($user['phone']??'').' '.($user['email']??''))); ?>"><input type="checkbox" class="group-member-check" name="user[]" value="<?php echo $key; ?>" <?php echo isset($selected_members[$key])?'checked':''; ?>><span><span class="group-member-name"><?php echo html_escape($user['name']??'Unnamed'); ?></span><span class="group-member-sub"><?php echo html_escape(($user['phone']??'') ?: ($user['email']??'')); ?></span></span></label>
                <?php endforeach; endif; ?>
            </div>
        </section>
    <?php endforeach; ?>
    </div>
    <div class="group-form-actions"><button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button><button type="submit" class="btn btn-primary"><i class="fa fa-save"></i> Save Group</button></div>
</div>
<?php echo form_close(); ?>
<script>
$('.group-member-filter').on('input',function(){var card=$(this).closest('.group-member-card'),q=$(this).val().toLowerCase().trim();card.find('.group-member-row').each(function(){$(this).toggle(!q||String($(this).data('member-text')).indexOf(q)!==-1);});});
$('.group-check-all').on('change',function(){var card=$(this).closest('.group-member-card');card.find('.group-member-row:visible .group-member-check').prop('checked',this.checked);});
$('#group_message_edit_form').on('submit',function(e){if($(this).find('.group-member-check:checked').length<1){e.preventDefault();if(typeof showAjaxModal_alert==='function')showAjaxModal_alert('Select at least one group member.','warning');}});
</script>
