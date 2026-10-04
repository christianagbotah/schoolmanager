<style>
/* Direct UI/UX rebuild — Boarding Houses */
.boarding-workspace {
    margin:0 !important; padding:24px 28px 40px !important; border-radius:0 !important;
    background:#f8fafc !important; box-shadow:none !important; min-height:100%;
}
.boarding-page-head {
    display:flex; align-items:flex-end; justify-content:space-between; gap:16px;
    margin-bottom:18px !important; padding-bottom:18px; border-bottom:1px solid #e2e8f0;
}
.boarding-page-head h2 { margin:0 !important; color:#0f172a !important; font-size:30px !important; line-height:1.2; font-weight:800; letter-spacing:-.02em; }
.btn-modern {
    min-height:40px; padding:8px 13px !important; border:1px solid #cbd5e1 !important;
    border-radius:8px !important; background:#fff !important; color:#334155 !important;
    box-shadow:none !important; font-size:13px !important; line-height:1.35; font-weight:800 !important; cursor:pointer;
}
.btn-modern.btn-primary { min-height:44px; padding:10px 15px !important; border-color:#2563eb !important; background:#2563eb !important; color:#fff !important; font-size:14px !important; }
.btn-modern:hover { transform:none !important; box-shadow:none !important; }
.boarding-table-shell { overflow-x:auto; border:1px solid #e2e8f0; border-radius:14px; background:#fff; box-shadow:0 1px 2px rgba(15,23,42,.05); }
.modern-table { width:100%; min-width:900px; margin:0; border-collapse:collapse; }
.modern-table thead th { padding:12px 13px !important; border-bottom:1px solid #e2e8f0; background:#f8fafc; color:#475569; font-size:13px; font-weight:800; letter-spacing:.035em; text-align:left; }
.modern-table tbody td { padding:12px 13px !important; border-bottom:1px solid #eef2f7; color:#334155; font-size:14px; line-height:1.45; vertical-align:middle; }
.modern-table tbody tr:hover { background:#f8fbff; }
.badge { display:inline-flex; min-height:27px; align-items:center; padding:5px 9px; border-radius:999px; font-size:12px; font-weight:800; }
.badge-success { background:#ecfdf5; color:#047857; }
.badge-warning { background:#fffbeb; color:#b45309; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-group { margin-bottom:0; }
.form-group-full { grid-column:1 / -1; }
.form-group label { display:block; margin-bottom:6px; color:#334155; font-size:14px; font-weight:800; }
.form-control,.select2-container--default .select2-selection--single { width:100%; min-height:44px !important; height:44px !important; padding:9px 11px !important; border:1px solid #cbd5e1 !important; border-radius:9px !important; background:#fff !important; color:#0f172a !important; font-size:15px !important; }
textarea.form-control { min-height:88px !important; height:auto !important; }
input[type="file"].form-control { padding:8px 10px !important; }
.form-control:focus { outline:none; border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
.select2-container{z-index:10050!important}.select2-dropdown{z-index:10051!important}
#modal_boarding_house .modal-dialog { width:min(760px,calc(100vw - 30px)); }
#modal_boarding_house .modal-content { overflow:hidden; border-radius:14px; }
#modal_boarding_house .modal-header { padding:15px 18px !important; border-bottom:1px solid #e2e8f0 !important; background:#f8fafc !important; }
#modal_boarding_house .modal-title { color:#0f172a !important; font-size:18px !important; font-weight:800 !important; }
#boarding_house_modal_body { padding:18px !important; }
#boarding_house_modal_body .modal-footer { margin:18px -18px -18px !important; padding:14px 18px !important; }
#boarding_house_modal_body .modal-footer .btn { min-height:40px; padding:8px 13px !important; border-radius:8px !important; font-size:13px !important; font-weight:800 !important; }
@media(max-width:767px){.boarding-workspace{padding:18px 14px 32px !important}.boarding-page-head{display:block}.boarding-page-head h2{font-size:26px !important}.boarding-page-head .btn-modern{width:100%;margin-top:14px}.form-grid{grid-template-columns:1fr}.form-group-full{grid-column:auto}.form-control{font-size:16px !important}}
</style>

<div class="modern-card boarding-workspace">
<div class="boarding-page-head">
<h2 style="margin:0;color:#1e293b">Boarding Houses</h2>
<button class="btn-modern btn-primary" onclick="openAddModal()"><i class="fa fa-plus"></i> Add House</button>
</div>

<div class="boarding-table-shell">
<table class="modern-table">
<thead>
<tr>
<th>House Name</th>
<th>Capacity</th>
<th>House Fee</th>
<th>House Master</th>
<th>Year Established</th>
<th>Status</th>
<th>Actions</th>
</tr>
</thead>
<tbody>
<?php 
$houses = $this->db->get('boarding_house')->result_array();
foreach($houses as $house):
?>
<tr>
<td><strong><?php echo $house['house_name'];?></strong></td>
<td><?php echo $house['house_capacity'];?></td>
<td><?php echo get_settings('currency').' '.number_format((float)$house['house_user_fee'],2);?></td>
<td><?php 
$teacher = $this->db->get_where('teacher',['teacher_id'=>$house['house_master_id']])->row();
echo $teacher ? $teacher->name : 'N/A';
?></td>
<td><?php echo $house['house_year_established'];?></td>
<td><span class="badge <?php echo $house['house_status'] === 'Available' ? 'badge-success' : 'badge-warning';?>"><?php echo html_escape($house['house_status']);?></span></td>
<td>
<button class="btn-modern" style="background:#f59e0b;color:#fff;padding:8px 16px" onclick='editHouse(<?php echo json_encode($house);?>)'><i class="fa fa-edit"></i></button>
<button class="btn-modern" style="background:#ef4444;color:#fff;padding:8px 16px" onclick="deleteHouse(<?php echo $house['house_id'];?>)"><i class="fa fa-trash"></i></button>
</td>
</tr>
<?php endforeach;?>
</tbody>
</table>
</div>
</div>



<link rel="stylesheet" href="<?php echo base_url('assets/select2/css/select2.min.css');?>">
<script src="<?php echo base_url('assets/select2/js/select2.min.js');?>"></script>

<script>
function openAddModal(){
showBoardingHouseModal();
}

function editHouse(house){
showBoardingHouseModal(house);
}

function showBoardingHouseModal(house){
const isEdit=!!house;
const formHtml=`
<?php echo form_open_multipart('', array('id'=>'houseForm'));?>
<input type="hidden" name="house_id" id="house_id" value="${isEdit?house.house_id:''}">
<div class="form-grid">
<div class="form-group">
<label>House Name *</label>
<input type="text" name="house_name" id="house_name" class="form-control" required value="${isEdit?house.house_name:''}">
</div>
<div class="form-group">
<label>Capacity</label>
<input type="number" name="house_capacity" id="house_capacity" class="form-control" value="${isEdit?house.house_capacity:''}">
</div>
<div class="form-group">
<label>House Fee (<?php echo get_settings('currency'); ?>)</label>
<input type="number" step="0.01" min="0" name="house_user_fee" id="house_user_fee" class="form-control" value="${isEdit?house.house_user_fee:'0.00'}">
</div>
<div class="form-group">
<label>House Master</label>
<select name="house_master_id" id="house_master_id" class="form-control select2">
<option value="">Select Teacher</option>
<?php $teachers=$this->db->get('teacher')->result_array();foreach($teachers as $t):?>
<option value="<?php echo $t['teacher_id'];?>"><?php echo $t['name'];?></option>
<?php endforeach;?>
</select>
</div>
<div class="form-group">
<label>House Prefect</label>
<select name="house_prefect_id" id="house_prefect_id" class="form-control select2">
<option value="">Select Student</option>
<?php $students=$this->db->where('mute',0)->order_by('name','ASC')->get('student')->result_array();foreach($students as $student):?>
<option value="<?php echo $student['student_id'];?>"><?php echo html_escape($student['name']);?></option>
<?php endforeach;?>
</select>
</div>
<div class="form-group">
<label>Year Established</label>
<input type="number" name="house_year_established" id="house_year_established" class="form-control" value="${isEdit?house.house_year_established:''}">
</div>
<div class="form-group">
<label>Status</label>
<select name="house_status" id="house_status" class="form-control">
<option value="Available">Available</option>
<option value="Assigned">Assigned</option>
<option value="Maintenance">Maintenance</option>
<option value="Unknown">Unknown</option>
</select>
</div>
<div class="form-group form-group-full">
<label>GPS Code</label>
<input type="text" name="house_gps_code" id="house_gps_code" class="form-control" value="${isEdit?house.house_gps_code:''}">
</div>
<div class="form-group form-group-full">
<label>Description</label>
<textarea name="house_description" id="house_description" class="form-control" rows="3">${isEdit?house.house_description:''}</textarea>
</div>
<div class="form-group form-group-full">
<label>House Image</label>
<input type="file" name="house_image_link" class="form-control">
</div>
</div>
<div class="modal-footer" style="border-top:1px solid #ecf0f1;padding:20px 30px;background:#f8f9fa;">
<button type="button" class="btn modern-btn modern-btn-cancel" data-dismiss="modal">Cancel</button>
<button type="submit" class="btn modern-btn modern-btn-primary">Save</button>
</div>
<?php echo form_close();?>
`;
$('#boarding_house_modal_title').text(isEdit?'Edit Boarding House':'Add Boarding House');
$('#boarding_house_modal_body').html(formHtml);
if(isEdit){
$('#house_master_id').val(house.house_master_id);
$('#house_prefect_id').val(house.house_prefect_id);
$('#house_status').val(house.house_status || 'Available');
}
$('#modal_boarding_house').modal('show');
setTimeout(function(){
$('.select2').select2({dropdownParent:$('#modal_boarding_house'),width:'100%'});
},100);
}

$(document).on('submit','#houseForm',function(e){
e.preventDefault();
showAjaxModal_alert('Saving...','loading');
const formData=new FormData(this);
const houseId=$('#house_id').val();
const url=houseId?'<?php echo site_url("admin/manageBoardingHouse/update/");?>'+houseId:'<?php echo site_url("admin/manageBoardingHouse/create");?>';
$.ajax({url:url,type:'POST',data:formData,processData:false,contentType:false,success:function(res){
$('#modal_boarding_house').modal('hide');
showAjaxModal_alert('Boarding house saved successfully!','success');
setTimeout(function(){$('#modal_alert').modal('hide');location.reload();},1500);
},error:function(){
showAjaxModal_alert('Failed to save boarding house. Please try again.','error');
}});
});

$('#modal_boarding_house').on('hidden.bs.modal',function(){
$('.select2').select2('destroy');
});

function deleteHouse(id){
showConfirmModal('Delete Boarding House','Are you sure you want to delete this boarding house?',function(){
showAjaxModal_alert('Deleting...','loading');
$.post('<?php echo site_url("admin/manageBoardingHouse/delete/");?>'+id,function(res){
if(typeof res === 'string'){ try { res = JSON.parse(res); } catch(e) { res = {status:'error',message:'Unexpected server response'}; } }
if(res.status === 'success'){ showAjaxModal_alert('Boarding house deleted successfully!','success'); setTimeout(function(){$('#modal_alert').modal('hide');location.reload();},1500); }
else { showAjaxModal_alert(res.message || 'Failed to delete boarding house.','error'); }
}).fail(function(){
showAjaxModal_alert('Failed to delete boarding house.','error');
});
},'Delete','danger');
}
</script>
