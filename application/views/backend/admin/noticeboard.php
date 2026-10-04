<?php
$running_notice_count = $this->db->where('status', 1)->count_all_results('noticeboard');
$archived_notice_count = $this->db->where('status', 0)->count_all_results('noticeboard');
$sms_is_active = !empty($active_sms_service) && $active_sms_service !== 'disabled';
?>
<style>
.noticeboard-workspace{margin:0!important;padding:24px 28px 40px!important;background:#f8fafc;min-height:100%;color:#334155}
.noticeboard-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e2e8f0}
.noticeboard-eyebrow{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.noticeboard-head h1{margin:0;color:#0f172a;font-size:30px!important;line-height:1.2;font-weight:800;letter-spacing:-.02em}
.noticeboard-head p:last-child{margin:7px 0 0;color:#64748b;font-size:15px;line-height:1.5}
.noticeboard-primary{min-height:44px;padding:10px 15px!important;border-radius:9px!important;background:#2563eb!important;border-color:#2563eb!important;color:#fff!important;font-size:14px!important;font-weight:800!important}
.noticeboard-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;padding:12px 14px;border:1px solid #a7f3d0;border-radius:11px;background:#ecfdf5;color:#047857;font-size:14px;font-weight:700}
.noticeboard-alert .close{position:static!important;float:none!important;margin:0;color:#047857;opacity:.8;font-size:20px}
.noticeboard-tabs,.noticeboard-status-tabs{display:flex;gap:4px;margin:0 0 14px!important;padding:0;border-bottom:1px solid #e2e8f0!important;list-style:none}
.noticeboard-tabs>li,.noticeboard-status-tabs>li{margin:0 0 -1px!important}
.noticeboard-tabs>li>a,.noticeboard-status-tabs>li>a{display:flex;align-items:center;gap:7px;margin:0!important;padding:10px 14px!important;border:0!important;border-bottom:2px solid transparent!important;border-radius:0!important;background:transparent!important;color:#64748b!important;font-size:14px;font-weight:800}
.noticeboard-tabs>li.active>a,.noticeboard-status-tabs>li.active>a{border-bottom-color:#2563eb!important;color:#2563eb!important}
.noticeboard-status-tabs .notice-count{display:inline-flex;align-items:center;justify-content:center;min-width:23px;height:23px;padding:0 7px;border-radius:999px;background:#e2e8f0;color:#475569;font-size:12px;font-weight:800}
.noticeboard-status-tabs>li.active .notice-count{background:#dbeafe;color:#1d4ed8}
.noticeboard-card{padding:16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}
.noticeboard-list-card{padding:0;overflow:hidden}
.noticeboard-list-card>.noticeboard-status-tabs{padding:0 16px;margin-bottom:0!important;background:#fff}
.noticeboard-list-card>.tab-content{padding:14px}
.noticeboard-form{max-width:980px;margin:0 auto}
.noticeboard-form-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(200px,.6fr);gap:14px}
.noticeboard-field{margin-bottom:14px}
.noticeboard-field-full{grid-column:1/-1}
.noticeboard-field label{display:block;margin:0 0 6px;color:#334155;font-size:13px;font-weight:800}
.noticeboard-field input[type="text"],.noticeboard-field input[type="date"],.noticeboard-field select,.noticeboard-field textarea{width:100%;min-height:44px;padding:9px 11px;border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#0f172a;font-size:15px!important;line-height:1.4}
.noticeboard-field textarea{min-height:145px;resize:vertical}
.noticeboard-field input:focus,.noticeboard-field select:focus,.noticeboard-field textarea:focus{border-color:#2563eb;outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
.noticeboard-media-box{display:grid;grid-template-columns:minmax(0,1fr) 180px;gap:14px;align-items:start;padding:14px;border:1px dashed #cbd5e1;border-radius:11px;background:#f8fafc}
.noticeboard-media-box input[type=file]{width:100%;padding:9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:14px}
.noticeboard-image-preview{display:none;width:180px;height:110px;object-fit:cover;border:1px solid #e2e8f0;border-radius:9px;background:#fff}
.noticeboard-delivery{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:14px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}
.noticeboard-service-state{display:inline-flex;align-items:center;gap:6px;margin-top:7px;padding:5px 8px;border-radius:999px;font-size:12px;font-weight:800}
.noticeboard-service-state.is-active{background:#ecfdf5;color:#047857}.noticeboard-service-state.is-disabled{background:#fef2f2;color:#b91c1c}
.noticeboard-form-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:4px;padding-top:14px;border-top:1px solid #e2e8f0}
.noticeboard-form-actions .btn{min-height:44px;padding:9px 15px!important;border-radius:9px!important;font-size:14px!important;font-weight:800!important}
.noticeboard-table-shell{overflow-x:auto}
.noticeboard-table{width:100%!important;min-width:700px;margin:0!important;border-collapse:collapse!important}
.noticeboard-table thead th{padding:11px 12px!important;border:0!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important;color:#475569!important;font-size:13px!important;font-weight:800!important;letter-spacing:.035em;text-transform:uppercase}
.noticeboard-table tbody td{padding:11px 12px!important;border-bottom:1px solid #eef2f7!important;color:#334155!important;font-size:14px!important;line-height:1.45;vertical-align:middle!important}
.noticeboard-title-cell{font-weight:800;color:#0f172a}
.noticeboard-row-actions{display:flex;gap:6px;justify-content:flex-end;white-space:nowrap}
.noticeboard-row-actions .btn{min-width:36px;min-height:34px;padding:6px 9px!important;border-radius:7px!important;font-size:12px!important;box-shadow:none!important}
.noticeboard-workspace .dataTables_wrapper{padding:0!important}.noticeboard-workspace .dataTables_length,.noticeboard-workspace .dataTables_filter,.noticeboard-workspace .dataTables_info,.noticeboard-workspace .dataTables_paginate{color:#475569;font-size:13px}.noticeboard-workspace .dataTables_length select,.noticeboard-workspace .dataTables_filter input{min-height:38px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:14px}
@media(max-width:767px){.noticeboard-workspace{padding:18px 14px 32px!important}.noticeboard-head{display:block}.noticeboard-head h1{font-size:26px!important}.noticeboard-primary{width:100%;margin-top:14px}.noticeboard-form-grid,.noticeboard-delivery,.noticeboard-media-box{grid-template-columns:1fr}.noticeboard-image-preview{width:100%;height:180px}.noticeboard-field input[type="text"],.noticeboard-field select,.noticeboard-field textarea{font-size:16px!important}.noticeboard-form-actions{display:grid;grid-template-columns:1fr}.noticeboard-tabs,.noticeboard-status-tabs{overflow-x:auto;white-space:nowrap}}
</style>

<div class="noticeboard-workspace">
    <div class="noticeboard-head">
        <div>
            <p class="noticeboard-eyebrow">Communication</p>
            <h1><?php echo get_phrase('noticeboard'); ?></h1>
            <p>Publish announcements, manage active and archived notices, and optionally notify the school community by SMS or email.</p>
        </div>
        <button type="button" class="btn btn-primary noticeboard-primary" onclick="openNoticeComposer()"><i class="fa fa-plus"></i> Add Notice</button>
    </div>

    <?php if(isset($_GET['suc']) && $_GET['suc'] == 1): ?>
        <div class="noticeboard-alert" role="alert"><span><i class="fa fa-check-circle"></i> Notice created successfully and selected notifications were processed.</span><button type="button" class="close" data-dismiss="alert">&times;</button></div>
    <?php elseif(isset($_GET['up']) && $_GET['up'] == 1): ?>
        <div class="noticeboard-alert" role="alert"><span><i class="fa fa-check-circle"></i> Notice updated successfully and selected notifications were processed.</span><button type="button" class="close" data-dismiss="alert">&times;</button></div>
    <?php endif; ?>

    <ul class="nav nav-tabs noticeboard-tabs" role="tablist">
        <li class="active"><a href="#list" data-toggle="tab"><i class="fa fa-list"></i> <?php echo get_phrase('noticeboard_list'); ?></a></li>
        <li><a href="#add" data-toggle="tab"><i class="fa fa-plus-circle"></i> <?php echo get_phrase('add_noticeboard'); ?></a></li>
    </ul>

    <div class="tab-content">
        <div class="tab-pane active" id="list">
            <div class="noticeboard-card noticeboard-list-card">
                <ul class="nav nav-tabs noticeboard-status-tabs">
                    <li class="active"><a href="#running" data-toggle="tab"><i class="fa fa-bullhorn"></i> <?php echo get_phrase('running'); ?> <span class="notice-count"><?php echo $running_notice_count; ?></span></a></li>
                    <li><a href="#archived" data-toggle="tab"><i class="fa fa-archive"></i> <?php echo get_phrase('archived'); ?> <span class="notice-count"><?php echo $archived_notice_count; ?></span></a></li>
                </ul>
                <div class="tab-content">
                    <div class="tab-pane active" id="running"><?php include 'running_noticeboard.php'; ?></div>
                    <div class="tab-pane" id="archived"><?php include 'archived_noticeboard.php'; ?></div>
                </div>
            </div>
        </div>

        <div class="tab-pane" id="add">
            <div class="noticeboard-card">
                <?php echo form_open(site_url('admin/noticeboard/create'), array('class'=>'noticeboard-form validate','enctype'=>'multipart/form-data','target'=>'_top')); ?>
                    <div class="noticeboard-form-grid">
                        <div class="noticeboard-field">
                            <label for="notice_title"><?php echo get_phrase('title'); ?> *</label>
                            <input id="notice_title" type="text" name="notice_title" required placeholder="Announcement title">
                        </div>
                        <div class="noticeboard-field">
                            <label for="create_timestamp"><?php echo get_phrase('event_date'); ?> *</label>
                            <input id="create_timestamp" type="text" class="datepicker" name="create_timestamp" value="<?php echo date('d M, Y'); ?>" required>
                        </div>
                        <div class="noticeboard-field noticeboard-field-full">
                            <label for="notice_body"><?php echo get_phrase('notice'); ?> *</label>
                            <textarea id="notice_body" name="notice" required placeholder="Write the announcement here..."></textarea>
                        </div>
                        <div class="noticeboard-field noticeboard-field-full">
                            <label for="notice_image">Image <span style="font-weight:600;color:#64748b">(optional)</span></label>
                            <div class="noticeboard-media-box">
                                <div>
                                    <input id="notice_image" type="file" name="image" accept="image/jpeg,image/png,image/gif,image/webp">
                                    <p style="margin:7px 0 0;color:#64748b;font-size:12px">JPG, PNG, GIF or WebP. The image is stored only after server-side image validation.</p>
                                </div>
                                <img id="notice_image_preview" class="noticeboard-image-preview" alt="Selected notice image preview">
                            </div>
                        </div>
                        <div class="noticeboard-field noticeboard-field-full">
                            <label>Delivery options</label>
                            <div class="noticeboard-delivery">
                                <div>
                                    <label for="check_sms">Send SMS</label>
                                    <select name="check_sms" id="check_sms" <?php echo $sms_is_active ? '' : 'disabled'; ?>>
                                        <option value="1">Yes</option><option value="2" <?php echo $sms_is_active ? '' : 'selected'; ?>>No</option>
                                    </select>
                                    <span class="noticeboard-service-state <?php echo $sms_is_active ? 'is-active' : 'is-disabled'; ?>" id="sms_active"><i class="fa fa-circle"></i> <?php echo $sms_is_active ? html_escape(ucfirst($active_sms_service)).' SMS active' : 'SMS service not activated'; ?></span>
                                </div>
                                <div id="sms_target_holder">
                                    <label for="sms_target"><?php echo get_phrase('send_sMS_to...'); ?></label>
                                    <select name="sms_target" id="sms_target">
                                        <option value="1">Parents, teachers &amp; students</option><option value="2">Parents only</option><option value="3">Teachers only</option><option value="4">Students only</option>
                                    </select>
                                </div>
                                <div>
                                    <label for="check_email"><?php echo get_phrase('send_email-_alert_to_all'); ?></label>
                                    <select name="check_email" id="check_email"><option value="1">Yes</option><option value="2">No</option></select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <input type="hidden" name="notice_timestamp" value="<?php echo date('d-M-Y, H:i:s'); ?>">
                    <div class="noticeboard-form-actions"><button type="submit" id="submit_button" class="btn btn-primary noticeboard-primary"><i class="fa fa-paper-plane"></i> <?php echo get_phrase('add_notice'); ?></button></div>
                <?php echo form_close(); ?>
            </div>
        </div>
    </div>
</div>

<script>
function openNoticeComposer(){ $('.noticeboard-tabs a[href="#add"]').tab('show'); setTimeout(function(){ $('#notice_title').focus(); },150); }
function show_sms_target(){ var enabled = $('#check_sms').val() === '1' && !$('#check_sms').prop('disabled'); $('#sms_target_holder').toggle(enabled); }
$(function(){
    show_sms_target();
    $('#check_sms').on('change', show_sms_target);
    if($.fn.DataTable){
        ['#running_notice_table','#archived_notice_table'].forEach(function(selector){
            if($(selector).length && !$.fn.DataTable.isDataTable(selector)){
                $(selector).DataTable({pageLength:25,order:[[2,'desc']],autoWidth:false});
            }
        });
    }
    $('#notice_image').on('change', function(){
        var input=this, preview=document.getElementById('notice_image_preview');
        if(input.files && input.files[0]){ var reader=new FileReader(); reader.onload=function(e){ preview.src=e.target.result; preview.style.display='block'; }; reader.readAsDataURL(input.files[0]); }
        else { preview.removeAttribute('src'); preview.style.display='none'; }
    });
});
</script>
