<style>
/* Direct UI/UX rebuild — Boarding Student Assignment */
.boarding-assignment-workspace {
    margin:0 !important; padding:24px 28px 40px !important; background:#f8fafc; min-height:100%;
}
.boarding-assignment-workspace > .col-md-12 { padding:0 !important; }
.boarding-assignment-workspace .panel.panel-primary { margin:0 !important; border:0 !important; background:transparent !important; box-shadow:none !important; }
.boarding-assignment-workspace .panel-heading { margin-bottom:18px; padding:0 0 18px !important; border:0 !important; border-bottom:1px solid #e2e8f0 !important; background:transparent !important; }
.boarding-assignment-workspace .panel-title { margin:0 !important; color:#0f172a !important; font-size:30px !important; line-height:1.2; font-weight:800 !important; letter-spacing:-.02em; }
.boarding-assignment-workspace .panel-title i { margin-right:7px; color:#2563eb; }
.boarding-assignment-workspace .panel-body { padding:0 !important; background:transparent !important; }
.boarding-assignment-workspace .nav-tabs { display:flex; gap:4px; margin-bottom:14px; border-bottom:1px solid #e2e8f0; }
.boarding-assignment-workspace .nav-tabs > li { margin:0 0 -1px; }
.boarding-assignment-workspace .nav-tabs > li > a { margin:0; padding:10px 14px; border:0 !important; border-bottom:2px solid transparent !important; border-radius:0 !important; color:#64748b; font-size:14px; font-weight:800; }
.boarding-assignment-workspace .nav-tabs > li.active > a { border-bottom-color:#2563eb !important; background:transparent !important; color:#2563eb !important; }
.boarding-assignment-workspace .tab-content { padding:18px; border:1px solid #e2e8f0; border-radius:14px; background:#fff; box-shadow:0 1px 2px rgba(15,23,42,.05); }
.boarding-assignment-workspace .form-horizontal { max-width:900px; margin:0 auto; }
.boarding-assignment-workspace .form-group { display:grid; grid-template-columns:minmax(180px,.45fr) minmax(0,1fr); gap:14px; align-items:center; margin:0 0 14px !important; }
.boarding-assignment-workspace .control-label { width:auto !important; padding:0 !important; color:#334155; font-size:14px; font-weight:800; text-align:left !important; }
.boarding-assignment-workspace .form-group > .col-sm-7,
.boarding-assignment-workspace .form-group > .col-sm-offset-3 { width:auto !important; margin-left:0 !important; padding:0 !important; float:none !important; }
.boarding-assignment-workspace .form-control,
.boarding-assignment-workspace .select2-container--default .select2-selection--single,
.boarding-assignment-workspace .select2-container--default .select2-selection--multiple { width:100%; min-height:44px !important; border:1px solid #cbd5e1 !important; border-radius:9px !important; background:#fff !important; color:#0f172a; font-size:15px !important; }
.boarding-assignment-workspace .form-control { padding:9px 11px !important; }
.boarding-assignment-workspace .select2-container { width:100% !important; }
.boarding-assignment-workspace .select2-selection--single .select2-selection__rendered { line-height:42px !important; padding-left:11px !important; font-size:15px !important; }
.boarding-assignment-workspace .select2-selection--single .select2-selection__arrow { height:42px !important; }
.boarding-assignment-workspace .select2-selection--multiple { padding:4px 7px !important; }
.boarding-assignment-workspace .btn-primary { min-height:44px; padding:9px 15px !important; border-radius:9px !important; background:#2563eb !important; border-color:#2563eb !important; font-size:14px !important; font-weight:800 !important; }
.boarding-assignment-workspace .help-block { margin:7px 0 0; color:#64748b; font-size:13px; }
@media(max-width:767px){.boarding-assignment-workspace{padding:18px 14px 32px !important}.boarding-assignment-workspace .panel-title{font-size:26px !important}.boarding-assignment-workspace .form-group{grid-template-columns:1fr;gap:6px}.boarding-assignment-workspace .form-control{font-size:16px !important}.boarding-assignment-workspace .nav-tabs{overflow-x:auto;white-space:nowrap}.boarding-assignment-workspace .tab-content{padding:14px}}
</style>

<div class="row boarding-assignment-workspace">
    <div class="col-md-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                <h3 class="panel-title"><i class="entypo-users"></i> <?php echo get_phrase('assign_boarding_to_students'); ?></h3>
            </div>
            
            <div class="panel-body">
                <ul class="nav nav-tabs">
                    <li class="active"><a href="#single" data-toggle="tab"><i class="entypo-user"></i> <?php echo get_phrase('single_student'); ?></a></li>
                    <li><a href="#bulk" data-toggle="tab"><i class="entypo-users"></i> <?php echo get_phrase('bulk_assignment'); ?></a></li>
                </ul>

                <div class="tab-content">
                    <div class="tab-pane active" id="single">
                        <?php echo form_open(site_url('admin/assign_boarding/single'), array('class' => 'form-horizontal')); ?>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('select_student'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="student_id" class="form-control select2" required>
                                    <option value=""><?php echo get_phrase('select'); ?></option>
                                    <?php
                                    $students = $this->db->get_where('student', array('mute' => 0))->result_array();
                                    foreach($students as $student):
                                    ?>
                                    <option value="<?php echo $student['student_id']; ?>"><?php echo $student['name']; ?> (<?php echo $student['student_code']; ?>)</option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('house'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="house_id" id="house_id_single" class="form-control" required>
                                    <option value=""><?php echo get_phrase('select'); ?></option>
                                    <?php
                                    $houses = $this->db->where('house_status', 'Available')->order_by('house_name', 'ASC')->get('boarding_house')->result_array();
                                    foreach($houses as $house):
                                    ?>
                                    <option value="<?php echo $house['house_id']; ?>"><?php echo $house['house_name']; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('dormitory'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="dormitory_id" id="dormitory_id_single" class="form-control" required>
                                    <option value=""><?php echo get_phrase('select_house_first'); ?></option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('bed'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="bed_id" id="bed_id_single" class="form-control" required>
                                    <option value=""><?php echo get_phrase('select_dormitory_first'); ?></option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="col-sm-offset-3 col-sm-7">
                                <button type="submit" class="btn btn-primary"><i class="entypo-check"></i> <?php echo get_phrase('assign'); ?></button>
                            </div>
                        </div>
                        </form>
                    </div>

                    <div class="tab-pane" id="bulk">
                        <?php echo form_open(site_url('admin/assign_boarding/bulk'), array('class' => 'form-horizontal')); ?>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('select_class'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="class_id" id="class_id_bulk" class="form-control" required>
                                    <option value=""><?php echo get_phrase('select'); ?></option>
                                    <?php
                                    $classes = $this->db->get('class')->result_array();
                                    foreach($classes as $class):
                                    ?>
                                    <option value="<?php echo $class['class_id']; ?>"><?php echo $class['name']; ?> <?php echo $class['name_numeric']; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('select_students'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="student_ids[]" id="students_bulk" class="form-control select2" multiple required>
                                    <option value=""><?php echo get_phrase('select_class_first'); ?></option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('house'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="house_id" id="house_id_bulk" class="form-control" required>
                                    <option value=""><?php echo get_phrase('select'); ?></option>
                                    <?php foreach($houses as $house): ?>
                                    <option value="<?php echo $house['house_id']; ?>"><?php echo $house['house_name']; ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 control-label"><?php echo get_phrase('dormitory'); ?> <span class="text-danger">*</span></label>
                            <div class="col-sm-7">
                                <select name="dormitory_id" id="dormitory_id_bulk" class="form-control" required>
                                    <option value=""><?php echo get_phrase('select_house_first'); ?></option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <div class="col-sm-offset-3 col-sm-7">
                                <button type="submit" class="btn btn-primary"><i class="entypo-check"></i> <?php echo get_phrase('assign_bulk'); ?></button>
                                <p class="help-block"><?php echo get_phrase('beds_will_be_auto_assigned'); ?></p>
                            </div>
                        </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
$(document).ready(function() {
    $('.select2').select2();

    $('#house_id_single').change(function() {
        loadDormitories($(this).val(), 'single');
    });

    $('#dormitory_id_single').change(function() {
        loadBeds($(this).val(), 'single');
    });

    $('#house_id_bulk').change(function() {
        loadDormitories($(this).val(), 'bulk');
    });

    $('#class_id_bulk').change(function() {
        loadStudentsByClass($(this).val());
    });
});

function loadDormitories(house_id, type) {
    $.ajax({
        url: '<?php echo site_url('admin/get_dormitories_by_house'); ?>',
        type: 'POST',
        data: {house_id: house_id},
        success: function(response) {
            $('#dormitory_id_' + type).html(response);
        }
    });
}

function loadBeds(dormitory_id, type) {
    $.ajax({
        url: '<?php echo site_url('admin/get_beds_by_dormitory'); ?>',
        type: 'POST',
        data: {dormitory_id: dormitory_id},
        success: function(response) {
            $('#bed_id_' + type).html(response);
        }
    });
}

function loadStudentsByClass(class_id) {
    $.ajax({
        url: '<?php echo site_url('admin/get_students_by_class'); ?>',
        type: 'POST',
        data: {class_id: class_id},
        success: function(response) {
            $('#students_bulk').html(response);
        }
    });
}
</script>
