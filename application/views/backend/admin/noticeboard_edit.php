<?php
$row = $this->db->get_where('noticeboard', array('notice_id' => $notice_id))->row_array();
if (!$row) {
    echo '<div class="notice-edit-workspace"><div class="alert alert-danger">Notice not found.</div></div>';
    return;
}
$sms_is_active = !empty($active_sms_service) && $active_sms_service !== 'disabled';
$image_path = !empty($row['image']) ? FCPATH . 'uploads/frontend/noticeboard/' . basename($row['image']) : '';
$has_image = $image_path && is_file($image_path);
?>
<style>
.notice-edit-workspace{margin:0!important;padding:24px 28px 40px!important;background:#f8fafc;min-height:100%;color:#334155}
.notice-edit-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e2e8f0}
.notice-edit-eyebrow{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.notice-edit-head h1{margin:0;color:#0f172a;font-size:30px!important;line-height:1.2;font-weight:800;letter-spacing:-.02em}
.notice-edit-head p:last-child{margin:7px 0 0;color:#64748b;font-size:15px;line-height:1.5}
.notice-edit-back{min-height:42px;padding:9px 13px!important;border:1px solid #cbd5e1!important;border-radius:9px!important;background:#fff!important;color:#334155!important;font-size:14px!important;font-weight:800!important}
.notice-edit-card{max-width:980px;margin:0 auto;padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}
.notice-edit-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(200px,.6fr);gap:14px}
.notice-edit-field{margin-bottom:14px}.notice-edit-field-full{grid-column:1/-1}
.notice-edit-field label{display:block;margin:0 0 6px;color:#334155;font-size:13px;font-weight:800}
.notice-edit-field input[type="text"],.notice-edit-field select,.notice-edit-field textarea{width:100%;min-height:44px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;font-size:15px!important;line-height:1.4}
.notice-edit-field textarea{min-height:145px;resize:vertical}.notice-edit-field input:focus,.notice-edit-field select:focus,.notice-edit-field textarea:focus{border-color:#2563eb;outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.notice-edit-media{display:grid;grid-template-columns:minmax(0,1fr) 200px;gap:14px;align-items:start;padding:14px;border:1px dashed #cbd5e1;border-radius:11px;background:#f8fafc}
.notice-edit-media input[type=file]{width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:14px}.notice-edit-preview{display:block;width:200px;height:120px;object-fit:cover;border:1px solid #e2e8f0;border-radius:9px;background:#fff}.notice-edit-preview.is-empty{display:none}
.notice-edit-delivery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:14px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}.notice-edit-service{display:inline-flex;align-items:center;gap:6px;margin-top:7px;padding:5px 8px;border-radius:999px;font-size:12px;font-weight:800}.notice-edit-service.active{background:#ecfdf5;color:#047857}.notice-edit-service.disabled{background:#fef2f2;color:#b91c1c}
.notice-edit-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:4px;padding-top:14px;border-top:1px solid #e2e8f0}.notice-edit-actions .btn{min-height:44px;padding:9px 15px!important;border-radius:9px!important;font-size:14px!important;font-weight:800!important}.notice-edit-actions .btn-primary{background:#2563eb!important;border-color:#2563eb!important}
@media(max-width:767px){.notice-edit-workspace{padding:18px 14px 32px!important}.notice-edit-head{display:block}.notice-edit-head h1{font-size:26px!important}.notice-edit-back{width:100%;margin-top:14px}.notice-edit-grid,.notice-edit-media,.notice-edit-delivery{grid-template-columns:1fr}.notice-edit-preview{width:100%;height:180px}.notice-edit-field input[type="text"],.notice-edit-field select,.notice-edit-field textarea{font-size:16px!important}.notice-edit-actions{display:grid;grid-template-columns:1fr}}
</style>
<div class="notice-edit-workspace">
    <div class="notice-edit-head">
        <div><p class="notice-edit-eyebrow">Communication</p><h1>Edit Notice</h1><p>Update the announcement content, event date, image and delivery options.</p></div>
        <a href="<?php echo site_url('admin/noticeboard'); ?>" class="btn btn-default notice-edit-back"><i class="fa fa-arrow-left"></i> Back to Noticeboard</a>
    </div>
    <div class="notice-edit-card">
    <?php echo form_open(site_url('admin/noticeboard/do_update/'.$row['notice_id']), array('class'=>'validate','enctype'=>'multipart/form-data','target'=>'_top')); ?>
        <div class="notice-edit-grid">
            <div class="notice-edit-field"><label for="edit_notice_title"><?php echo get_phrase('title'); ?> *</label><input id="edit_notice_title" type="text" name="notice_title" value="<?php echo html_escape($row['notice_title']); ?>" required></div>
            <div class="notice-edit-field"><label for="edit_notice_date"><?php echo get_phrase('event_date'); ?> *</label><input id="edit_notice_date" type="text" class="datepicker" name="create_timestamp" value="<?php echo date('d M, Y',(int)$row['create_timestamp']); ?>" required></div>
            <div class="notice-edit-field notice-edit-field-full"><label for="edit_notice_body"><?php echo get_phrase('notice'); ?> *</label><textarea id="edit_notice_body" name="notice" required><?php echo html_escape($row['notice']); ?></textarea></div>
            <div class="notice-edit-field notice-edit-field-full">
                <label for="edit_notice_image">Image <span style="font-weight:600;color:#64748b">(optional)</span></label>
                <div class="notice-edit-media"><div><input id="edit_notice_image" type="file" name="image" accept="image/jpeg,image/png,image/gif,image/webp"><p style="margin:7px 0 0;color:#64748b;font-size:12px">Choose a new image only when you want to replace the current one.</p></div>
                <img id="edit_notice_preview" class="notice-edit-preview <?php echo $has_image ? '' : 'is-empty'; ?>" <?php if($has_image): ?>src="<?php echo base_url('uploads/frontend/noticeboard/'.rawurlencode(basename($row['image']))); ?>"<?php endif; ?> alt="Notice image preview"></div>
            </div>
            <div class="notice-edit-field notice-edit-field-full"><label>Delivery options</label>
                <div class="notice-edit-delivery">
                    <div><label for="check_sms">Send SMS</label><select name="check_sms" id="check_sms" <?php echo $sms_is_active?'':'disabled'; ?>><option value="1">Yes</option><option value="2" <?php echo $sms_is_active?'':'selected'; ?>>No</option></select><span class="notice-edit-service <?php echo $sms_is_active?'active':'disabled'; ?>"><i class="fa fa-circle"></i> <?php echo $sms_is_active?html_escape(ucfirst($active_sms_service)).' SMS active':'SMS service not activated'; ?></span></div>
                    <div id="sms_target_holder"><label for="sms_target"><?php echo get_phrase('send_sMS_to...'); ?></label><select name="sms_target" id="sms_target"><option value="1">Parents, teachers &amp; students</option><option value="2">Parents only</option><option value="3">Teachers only</option><option value="4">Students only</option></select></div>
                    <div><label for="check_email"><?php echo get_phrase('send_email-_alert_to_all'); ?></label><select name="check_email" id="check_email"><option value="1">Yes</option><option value="2">No</option></select></div>
                </div>
            </div>
        </div>
        <input type="hidden" name="notice_timestamp" value="<?php echo date('d-M-Y, H:i:s'); ?>">
        <div class="notice-edit-actions"><a href="<?php echo site_url('admin/noticeboard'); ?>" class="btn btn-default">Cancel</a><button type="submit" id="submit_button" class="btn btn-primary"><i class="fa fa-save"></i> Update Notice</button></div>
    <?php echo form_close(); ?>
    </div>
</div>
<script>
function show_sms_target(){var enabled=$('#check_sms').val()==='1'&&!$('#check_sms').prop('disabled');$('#sms_target_holder').toggle(enabled)}
$(function(){show_sms_target();$('#check_sms').on('change',show_sms_target);$('#edit_notice_image').on('change',function(){var input=this,preview=document.getElementById('edit_notice_preview');if(input.files&&input.files[0]){var reader=new FileReader();reader.onload=function(e){preview.src=e.target.result;preview.classList.remove('is-empty')};reader.readAsDataURL(input.files[0])}})});
</script>
