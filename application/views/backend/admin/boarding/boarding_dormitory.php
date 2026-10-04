<style>
/* Direct UI/UX rebuild — Boarding Dormitories */
.boarding-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    border-radius: 0 !important;
    background: #f8fafc !important;
    box-shadow: none !important;
    min-height: 100%;
}
.boarding-workspace > .boarding-page-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px !important;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.boarding-page-head h2 {
    margin: 0 !important;
    color: #0f172a !important;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.btn-modern {
    min-height: 40px;
    padding: 8px 13px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    background: #fff !important;
    color: #334155 !important;
    box-shadow: none !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    cursor: pointer;
}
.btn-modern.btn-primary {
    min-height: 44px;
    padding: 10px 15px !important;
    border-color: #2563eb !important;
    background: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
}
.btn-modern:hover { transform: none !important; box-shadow: none !important; }
.boarding-table-shell {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.modern-table {
    width: 100%;
    min-width: 850px;
    margin: 0;
    border-collapse: collapse;
}
.modern-table thead th {
    padding: 12px 13px !important;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    color: #475569;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .035em;
    text-align: left;
}
.modern-table tbody td {
    padding: 12px 13px !important;
    border-bottom: 1px solid #eef2f7;
    color: #334155;
    font-size: 14px;
    line-height: 1.45;
    vertical-align: middle;
}
.modern-table tbody tr:hover { background: #f8fbff; }
.badge { display:inline-flex; min-height:27px; align-items:center; padding:5px 9px; border-radius:999px; font-size:12px; font-weight:800; }
.badge-success { background:#ecfdf5; color:#047857; }
.badge-warning { background:#fffbeb; color:#b45309; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 0; }
.form-group-full { grid-column: 1 / -1; }
.form-group label { display:block; margin-bottom:6px; color:#334155; font-size:14px; font-weight:800; }
.form-control,
.select2-container--default .select2-selection--single {
    width: 100%;
    min-height: 44px !important;
    height: 44px !important;
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 15px !important;
}
textarea.form-control { min-height: 88px !important; height: auto !important; }
.form-control:focus { outline:none; border-color:#2563eb !important; box-shadow:0 0 0 3px rgba(37,99,235,.12); }
.select2-container { z-index:10050!important; }
.select2-dropdown { z-index:10051!important; }
#modal_boarding_dormitory .modal-dialog { width:min(720px,calc(100vw - 30px)); }
#modal_boarding_dormitory .modal-content { overflow:hidden; border-radius:14px; }
#modal_boarding_dormitory .modal-header { padding:15px 18px !important; border-bottom:1px solid #e2e8f0 !important; background:#f8fafc !important; }
#modal_boarding_dormitory .modal-title { color:#0f172a !important; font-size:18px !important; font-weight:800 !important; }
#boarding_dormitory_modal_body { padding:18px !important; }
#boarding_dormitory_modal_body .modal-footer { margin:18px -18px -18px !important; padding:14px 18px !important; }
#boarding_dormitory_modal_body .modal-footer .btn { min-height:40px; padding:8px 13px !important; border-radius:8px !important; font-size:13px !important; font-weight:800 !important; }
@media (max-width:767px) {
    .boarding-workspace { padding:18px 14px 32px !important; }
    .boarding-workspace > .boarding-page-head { display:block; }
    .boarding-page-head h2 { font-size:26px !important; }
    .boarding-page-head .btn-modern { width:100%; margin-top:14px; }
    .form-grid { grid-template-columns:1fr; }
    .form-group-full { grid-column:auto; }
    .form-control { font-size:16px !important; }
}
</style>

<div class="modern-card boarding-workspace">
<div class="boarding-page-head">
<h2 style="margin:0;color:#1e293b">Dormitories</h2>
<button class="btn-modern btn-primary" onclick="openAddModal()"><i class="fa fa-plus"></i> Add Dormitory</button>
</div>

<div class="boarding-table-shell">
<table class="modern-table">
<thead>
<tr>
<th>Dormitory Name</th>
<th>House</th>
<th>Capacity</th>
<th>Type</th>
<th>Floor</th>
<th>Status</th>
<th>Actions</th>
</tr>
</thead>
<tbody>
<?php 
$dorms = $this->db->get('boarding_dormitory')->result_array();
foreach($dorms as $dorm):
?>
<tr>
<td><strong><?php echo $dorm['dormitory_name'];?></strong></td>
<td><?php 
$house = $this->db->get_where('boarding_house',['house_id'=>$dorm['house_id']])->row();
echo $house ? $house->house_name : 'N/A';
?></td>
<td><?php echo isset($dorm['dormitory_capacity']) ? $dorm['dormitory_capacity'] : 'N/A';?></td>
<td><?php echo $dorm['dormitory_type'];?></td>
<td><?php echo $dorm['dormitory_floor'];?></td>
<td><span class="badge <?php echo $dorm['dormitory_status'] === 'Available' ? 'badge-success' : 'badge-warning';?>"><?php echo html_escape($dorm['dormitory_status']);?></span></td>
<td>
<button class="btn-modern" style="background:#f59e0b;color:#fff;padding:8px 16px" onclick='editDorm(<?php echo json_encode($dorm);?>)'><i class="fa fa-edit"></i></button>
<button class="btn-modern" style="background:#ef4444;color:#fff;padding:8px 16px" onclick="deleteDorm(<?php echo $dorm['dormitory_id'];?>)"><i class="fa fa-trash"></i></button>
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
showBoardingDormModal();
}

function editDorm(dorm){
showBoardingDormModal(dorm);
}

function showBoardingDormModal(dorm){
const isEdit=!!dorm;
const formHtml=`
<?php echo form_open('', array('id'=>'dormForm'));?>
<input type="hidden" name="dormitory_id" id="dormitory_id" value="${isEdit?dorm.dormitory_id:''}">
<div class="form-grid">
<div class="form-group form-group-full">
<label>Boarding House *</label>
<select name="house_id" id="house_id" class="form-control select2" required>
<option value="">Select House</option>
<?php $houses=$this->db->get('boarding_house')->result_array();foreach($houses as $h):?>
<option value="<?php echo $h['house_id'];?>"><?php echo $h['house_name'];?></option>
<?php endforeach;?>
</select>
</div>
<div class="form-group">
<label>Dormitory Name *</label>
<input type="text" name="dormitory_name" id="dormitory_name" class="form-control" required value="${isEdit?dorm.dormitory_name:''}">
</div>
<div class="form-group">
<label>Capacity</label>
<input type="number" name="dormitory_capacity" id="dormitory_capacity" class="form-control" value="${isEdit?dorm.dormitory_capacity:''}">
</div>
<div class="form-group">
<label>Type</label>
<select name="dormitory_type" id="dormitory_type" class="form-control">
<option value="Male">Male</option>
<option value="Female">Female</option>
</select>
</div>
<div class="form-group">
<label>Floor</label>
<input type="text" name="dormitory_floor" id="dormitory_floor" class="form-control" value="${isEdit?dorm.dormitory_floor:''}">
</div>
<div class="form-group">
<label>Status</label>
<select name="dormitory_status" id="dormitory_status" class="form-control">
<option value="Available">Available</option>
<option value="Assigned">Assigned</option>
<option value="Maintenance">Maintenance</option>
<option value="Unknown">Unknown</option>
</select>
</div>
<div class="form-group form-group-full">
<label>Description</label>
<textarea name="dormitory_description" id="dormitory_description" class="form-control" rows="3">${isEdit?dorm.dormitory_description:''}</textarea>
</div>
</div>
<div class="modal-footer" style="border-top:1px solid #ecf0f1;padding:20px 30px;background:#f8f9fa;">
<button type="button" class="btn modern-btn modern-btn-cancel" data-dismiss="modal">Cancel</button>
<button type="submit" class="btn modern-btn modern-btn-primary">Save</button>
</div>
<?php echo form_close();?>
`;
$('#boarding_dormitory_modal_title').text(isEdit?'Edit Dormitory':'Add Dormitory');
$('#boarding_dormitory_modal_body').html(formHtml);
if(isEdit){
$('#house_id').val(dorm.house_id);
$('#dormitory_type').val(dorm.dormitory_type);
$('#dormitory_status').val(dorm.dormitory_status || 'Available');
}
$('#modal_boarding_dormitory').modal('show');
setTimeout(function(){
$('.select2').select2({dropdownParent:$('#modal_boarding_dormitory'),width:'100%'});
},100);
}

$(document).on('submit','#dormForm',function(e){
e.preventDefault();
showAjaxModal_alert('Saving...','loading');
const dormId=$('#dormitory_id').val();
const url=dormId?'<?php echo site_url("admin/manageBoardingDormitory/update/");?>'+dormId:'<?php echo site_url("admin/manageBoardingDormitory/create");?>';
const formData=$(this).serialize();
$.ajax({url:url,type:'POST',data:formData,success:function(res){
$('#modal_boarding_dormitory').modal('hide');
showAjaxModal_alert('Dormitory saved successfully!','success');
setTimeout(function(){$('#modal_alert').modal('hide');location.reload();},1500);
},error:function(xhr){
console.log(xhr.responseText);
showAjaxModal_alert('Failed to save dormitory. Please try again.','error');
}});
});

$('#modal_boarding_dormitory').on('hidden.bs.modal',function(){
$('.select2').select2('destroy');
});

function deleteDorm(id){
showConfirmModal('Delete Dormitory','Are you sure you want to delete this dormitory?',function(){
showAjaxModal_alert('Deleting...','loading');
$.post('<?php echo site_url("admin/manageBoardingDormitory/delete/");?>'+id,function(res){
if(typeof res === 'string'){ try { res = JSON.parse(res); } catch(e) { res = {status:'error',message:'Unexpected server response'}; } }
if(res.status === 'success'){ showAjaxModal_alert('Dormitory deleted successfully!','success'); setTimeout(function(){$('#modal_alert').modal('hide');location.reload();},1500); }
else { showAjaxModal_alert(res.message || 'Failed to delete dormitory.','error'); }
}).fail(function(){
showAjaxModal_alert('Failed to delete dormitory.','error');
});
},'Delete','danger');
}
</script>