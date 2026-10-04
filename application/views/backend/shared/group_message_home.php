<div style="display:flex;align-items:center;justify-content:center;min-height:558px;padding:34px;text-align:center">
    <div style="max-width:520px">
        <div style="display:flex;align-items:center;justify-content:center;width:62px;height:62px;margin:0 auto 16px;border-radius:16px;background:#eff6ff;color:#2563eb;font-size:27px"><i class="fa fa-users"></i></div>
        <h3 style="margin:0 0 8px;color:#0f172a;font-size:21px;font-weight:800">Select a group conversation</h3>
        <p style="margin:0;color:#64748b;font-size:14px;line-height:1.6">Choose a group from the list to read and reply. Only members of a group can open its conversation.</p>
        <?php if(!empty($can_manage_groups)): ?><button type="button" class="btn btn-primary" style="margin-top:16px;min-height:42px;padding:9px 14px;border-radius:8px;font-weight:800" onclick="showAjaxModal('<?php echo site_url('modal/popup/create_group'); ?>','big')"><i class="fa fa-plus"></i> Create Group</button><?php endif; ?>
    </div>
</div>
