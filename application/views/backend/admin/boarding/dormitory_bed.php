<style>
/* Direct UI/UX rebuild — Dormitory Beds */
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
    box-shadow:none !important; font-size:13px !important; font-weight:800 !important; cursor:pointer;
}
.btn-modern.btn-primary { min-height:44px; padding:10px 15px !important; border-color:#2563eb !important; background:#2563eb !important; color:#fff !important; font-size:14px !important; }
.boarding-table-shell { overflow-x:auto; border:1px solid #e2e8f0; border-radius:14px; background:#fff; box-shadow:0 1px 2px rgba(15,23,42,.05); }
.modern-table { width:100%; min-width:820px; margin:0; border-collapse:collapse; }
.modern-table thead th { padding:12px 13px !important; border-bottom:1px solid #e2e8f0; background:#f8fafc; color:#475569; font-size:13px; font-weight:800; letter-spacing:.035em; text-align:left; }
.modern-table tbody td { padding:12px 13px !important; border-bottom:1px solid #eef2f7; color:#334155; font-size:14px; line-height:1.45; vertical-align:middle; }
.modern-table tbody tr:hover { background:#f8fbff; }
.badge { display:inline-flex; min-height:27px; align-items:center; padding:5px 9px; border-radius:999px; font-size:12px; font-weight:800; }
.badge-success { background:#ecfdf5; color:#047857; }
.badge-danger { background:#fef2f2; color:#b91c1c; }
.form-group { margin-bottom:14px; }
.form-group label { display:block; margin-bottom:6px; color:#334155; font-size:14px; font-weight:800; }
.form-control,.select2-container--default .select2-selection--single { width:100%; min-height:44px !important; height:44px !important; padding:9px 11px !important; border:1px solid #cbd5e1 !important; border-radius:9px !important; background:#fff !important; color:#0f172a !important; font-size:15px !important; }
textarea.form-control { min-height:88px !important; height:auto !important; }
.form-control:focus { outline:none; border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
.select2-container{z-index:10050!important}.select2-dropdown{z-index:10051!important}
#modal_ajax .modal-dialog { width:min(680px,calc(100vw - 30px)); }
#modal_ajax .modal-content { overflow:hidden; border-radius:14px; }
#modal_ajax .modal-header { padding:15px 18px !important; border-bottom:1px solid #e2e8f0 !important; }
#modal_ajax .modal-body { padding:18px !important; }
#modal_ajax .modal-footer { margin:18px -18px -18px !important; padding:14px 18px !important; }
#modal_ajax .modal-footer .btn { min-height:40px; padding:8px 13px !important; border-radius:8px !important; font-size:13px !important; font-weight:800 !important; }
@media(max-width:767px){.boarding-workspace{padding:18px 14px 32px !important}.boarding-page-head{display:block}.boarding-page-head h2{font-size:26px !important}.boarding-page-head .btn-modern{width:100%;margin-top:14px}.form-control{font-size:16px !important}}
</style>

<div class="modern-card boarding-workspace">
<div class="boarding-page-head">
<h2 style="margin:0;color:#1e293b">Dormitory Beds</h2>
<button class="btn-modern btn-primary" onclick="openAddModal()"><i class="fa fa-plus"></i> Add Bed</button>
</div>

<div class="boarding-table-shell">
<table class="modern-table">
<thead>
<tr>
<th>Bed Code</th>
<th>Dormitory</th>
<th>Bed Number</th>
<th>Type</th>
<th>Status</th>
<th>Actions</th>
</tr>
</thead>
<tbody>
<?php 
$beds = $this->db->get('boarding_bed')->result_array();
foreach($beds as $bed):
?>
<tr>
<td><strong><?php echo $bed['bed_code'];?></strong></td>
<td><?php 
$dorm = $this->db->get_where('boarding_dormitory',['dormitory_id'=>$bed['dormitory_id']])->row();
echo $dorm ? $dorm->dormitory_name : 'N/A';
?></td>
<td><?php echo $bed['bed_number'];?></td>
<td><?php echo $bed['bed_type'];?></td>
<td><span class="badge <?php echo strcasecmp($bed['bed_status'],'Available')===0?'badge-success':'badge-danger';?>"><?php echo ucfirst($bed['bed_status']);?></span></td>
<td>
<button class="btn-modern" style="background:#f59e0b;color:#fff;padding:8px 16px" onclick='editBed(<?php echo json_encode($bed);?>)'><i class="fa fa-edit"></i></button>
<button class="btn-modern" style="background:#ef4444;color:#fff;padding:8px 16px" onclick="deleteBed(<?php echo $bed['bed_id'];?>)"><i class="fa fa-trash"></i></button>
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
showBedModal();
}

function editBed(bed){
showBedModal(bed);
}

function showBedModal(bed){
const isEdit=!!bed;
const formHtml=`
<?php echo form_open('', array('id'=>'bedForm'));?>
<input type="hidden" name="bed_id" id="bed_id" value="${isEdit?bed.bed_id:''}">
<div class="form-group">
<label>Dormitory *</label>
<select name="dormitory_id" id="dormitory_id" class="form-control select2" required>
<option value="">Select Dormitory</option>
<?php $dorms=$this->db->get('boarding_dormitory')->result_array();foreach($dorms as $d):?>
<option value="<?php echo $d['dormitory_id'];?>"><?php echo $d['dormitory_name'];?></option>
<?php endforeach;?>
</select>
</div>
<div class="form-group">
<label>Bed Code *</label>
<input type="text" name="bed_code" id="bed_code" class="form-control" required value="${isEdit?bed.bed_code:''}">
</div>
<div class="form-group">
<label>Bed Number</label>
<input type="text" name="bed_number" id="bed_number" class="form-control" value="${isEdit?bed.bed_number:''}">
</div>
<div class="form-group">
<label>Bed Type</label>
<select name="bed_type" id="bed_type" class="form-control">
<option value="Single">Single</option>
<option value="Bunk">Bunk</option>
</select>
</div>
<div class="form-group">
<label>Status</label>
<select name="bed_status" id="bed_status" class="form-control">
<option value="Available">Available</option>
<option value="Assigned">Assigned</option>
<option value="Maintenance">Maintenance</option>
<option value="Unknown">Unknown</option>
</select>
</div>
<div class="form-group">
<label>Description</label>
<textarea name="bed_description" id="bed_description" class="form-control" rows="3">${isEdit?bed.bed_description:''}</textarea>
</div>
<div class="modal-footer" style="border-top:1px solid #ecf0f1;padding:20px 30px;background:#f8f9fa;">
<button type="button" class="btn modern-btn modern-btn-cancel" data-dismiss="modal">Cancel</button>
<button type="submit" class="btn modern-btn modern-btn-primary">Save</button>
</div>
<?php echo form_close();?>
`;
$('#modal_ajax .modal-title').text(isEdit?'Edit Bed':'Add Bed');
$('#modal_ajax .modal-body').html(formHtml);
if(isEdit){
$('#dormitory_id').val(bed.dormitory_id);
$('#bed_type').val(bed.bed_type);
$('#bed_status').val(bed.bed_status);
}
$('#modal_ajax').modal('show');
setTimeout(function(){
$('.select2').select2({dropdownParent:$('#modal_ajax'),width:'100%'});
},100);
}

$(document).on('submit','#bedForm',function(e){
e.preventDefault();
showAjaxModal_alert('Saving...','loading');
const bedId=$('#bed_id').val();
const url=bedId?'<?php echo site_url("admin/manageDormitoryBed/update/");?>'+bedId:'<?php echo site_url("admin/manageDormitoryBed/create");?>';
const formData=$(this).serialize();
$.ajax({url:url,type:'POST',data:formData,success:function(res){
$('#modal_ajax').modal('hide');
showAjaxModal_alert('Bed saved successfully!','success');
setTimeout(function(){$('#modal_alert').modal('hide');location.reload();},1500);
},error:function(xhr){
console.log(xhr.responseText);
showAjaxModal_alert('Failed to save bed. Please try again.','error');
}});
});

$('#modal_ajax').on('hidden.bs.modal',function(){
$('.select2').select2('destroy');
});

function deleteBed(id){
showConfirmModal('Delete Bed','Are you sure you want to delete this bed?',function(){
showAjaxModal_alert('Deleting...','loading');
$.post('<?php echo site_url("admin/manageDormitoryBed/delete/");?>'+id,function(res){
if(typeof res === 'string'){ try { res = JSON.parse(res); } catch(e) { res = {status:'error',message:'Unexpected server response'}; } }
if(res.status === 'success'){ showAjaxModal_alert('Bed deleted successfully!','success'); setTimeout(function(){$('#modal_alert').modal('hide');location.reload();},1500); }
else { showAjaxModal_alert(res.message || 'Failed to delete bed.','error'); }
}).fail(function(){
showAjaxModal_alert('Failed to delete bed.','error');
});
},'Delete','danger');
}
</script>