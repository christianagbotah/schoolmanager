<?php
/**
 * HOD Subject Assignments Management View
 * 
 * Allows admin to assign subjects to HODs for lesson note review.
 * 
 * Requirements: 10.8
 */
defined('BASEPATH') OR exit('No direct script access allowed');
?>
<style>
/* HOD Subject Assignments — enterprise workspace */
body { background: #f8fafc; }
.hod-subject-workspace {
    background: #f8fafc !important; min-height: 100%; padding: 24px 28px 40px !important;
}
.hod-subject-workspace .content-header {
    margin: 0 0 18px; padding: 0 0 18px !important; border-bottom: 1px solid #e2e8f0;
}
.hod-subject-workspace .content-header h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
    font-weight: 800; letter-spacing: -.02em;
}
.hod-subject-workspace .content-header h1 > small {
    display: block; margin-top: 7px; color: #64748b !important;
    font-size: 15px !important; line-height: 1.5; font-weight: 500;
}
.hod-subject-workspace .breadcrumb {
    position: static !important; float: none !important; margin: 10px 0 0 !important;
    padding: 0 !important; background: transparent !important; font-size: 13px;
}
.hod-subject-workspace .content { padding: 0 !important; }

.hod-subject-workspace .alert {
    margin-bottom: 14px; padding: 12px 14px; border-radius: 10px; font-size: 14px;
}
.hod-subject-workspace .row { margin-left: -8px; margin-right: -8px; }
.hod-subject-workspace .col-md-4,
.hod-subject-workspace .col-md-8 { padding-left: 8px; padding-right: 8px; }

.hod-subject-workspace .box {
    margin-bottom: 16px; border: 1px solid #e2e8f0 !important; border-top: 1px solid #e2e8f0 !important;
    border-radius: 14px; box-shadow: 0 1px 2px rgba(15,23,42,.05) !important; overflow: hidden;
    background: #fff;
}
.hod-subject-workspace .box-header {
    padding: 14px 16px !important; border-bottom: 1px solid #eef2f7 !important; background: #fff;
}
.hod-subject-workspace .box-title {
    color: #0f172a; font-size: 17px !important; line-height: 1.35; font-weight: 800 !important;
}
.hod-subject-workspace .box-tools .label {
    min-height: 30px; padding: 6px 10px; display: inline-flex; align-items: center;
    border-radius: 999px; background: #eff6ff !important; color: #1d4ed8 !important;
    font-size: 13px; font-weight: 800;
}
.hod-subject-workspace .box-body { padding: 16px !important; }

.hod-subject-workspace .form-group { margin-bottom: 15px; }
.hod-subject-workspace .form-group label {
    margin-bottom: 7px; color: #334155; font-size: 14px; line-height: 1.35; font-weight: 700;
}
.hod-subject-workspace .form-control,
.hod-subject-workspace .select2-container .select2-selection--single {
    min-height: 46px; height: 46px; border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important; background: #fff; color: #0f172a; font-size: 15px;
}
.hod-subject-workspace .form-control { padding: 9px 12px; }
.hod-subject-workspace .select2-container--default .select2-selection--single .select2-selection__rendered {
    line-height: 44px; padding-left: 12px; font-size: 15px; color: #0f172a;
}
.hod-subject-workspace .select2-container--default .select2-selection--single .select2-selection__arrow { height: 44px; }
.hod-subject-workspace .form-control:focus,
.hod-subject-workspace .select2-container--focus .select2-selection--single {
    border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important; outline: none;
}
.hod-subject-workspace .btn {
    min-height: 40px; padding: 8px 13px; border-radius: 8px; font-size: 14px; line-height: 1.35; font-weight: 700;
}
.hod-subject-workspace .btn-block { min-height: 44px; font-weight: 800; }
.hod-subject-workspace .btn-primary { background: #2563eb; border-color: #2563eb; }
.hod-subject-workspace .btn-danger { background: #dc2626; border-color: #dc2626; }
.hod-subject-workspace .btn-sm { min-height: 36px; min-width: 36px; padding: 7px 10px; }

.hod-subject-workspace .box-info .box-body p,
.hod-subject-workspace .box-info .box-body li {
    color: #475569; font-size: 14px; line-height: 1.5;
}
.hod-subject-workspace .box-info .box-body li { margin-bottom: 7px; }

.hod-subject-workspace .table-responsive {
    border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}
#assignments-table { min-width: 760px; margin-bottom: 0 !important; }
#assignments-table thead th {
    padding: 12px 13px !important; background: #f8fafc; color: #475569;
    font-size: 13px; font-weight: 800; letter-spacing: .035em; border-bottom: 1px solid #e2e8f0 !important;
}
#assignments-table tbody td {
    padding: 12px 13px !important; color: #334155; font-size: 14px; line-height: 1.45; vertical-align: middle;
}
#assignments-table tbody tr:hover td { background: #f8fbff; }
#assignments-table .label {
    min-height: 28px; padding: 5px 9px; display: inline-flex; align-items: center;
    border-radius: 999px; font-size: 13px; font-weight: 700;
}
#assignments-table small { font-size: 13px; color: #64748b; }

.hod-subject-workspace .dataTables_wrapper { padding: 12px; }
.hod-subject-workspace .dataTables_filter,
.hod-subject-workspace .dataTables_length,
.hod-subject-workspace .dataTables_info,
.hod-subject-workspace .dataTables_paginate { font-size: 14px; color: #475569; }
.hod-subject-workspace .dataTables_filter input,
.hod-subject-workspace .dataTables_length select {
    min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
    border-radius: 8px; font-size: 14px;
}

#modal-delete .modal-content { border-radius: 14px; overflow: hidden; }
#modal-delete .modal-header { padding: 15px 18px; border-bottom: 1px solid #e2e8f0; }
#modal-delete .modal-title { font-size: 18px; font-weight: 800; color: #0f172a; }
#modal-delete .modal-body { padding: 18px; font-size: 14px; line-height: 1.5; }
#modal-delete .modal-footer { padding: 12px 18px; border-top: 1px solid #e2e8f0; }

@media (max-width: 991px) {
    .hod-subject-workspace .col-md-4,
    .hod-subject-workspace .col-md-8 { width: 100%; }
}
@media (max-width: 767px) {
    .hod-subject-workspace { padding: 18px 14px 32px !important; }
    .hod-subject-workspace .content-header h1 { font-size: 26px; }
    .hod-subject-workspace .row { margin-left: 0; margin-right: 0; }
    .hod-subject-workspace .col-md-4,
    .hod-subject-workspace .col-md-8 { padding-left: 0; padding-right: 0; }
    .hod-subject-workspace input,
    .hod-subject-workspace select { font-size: 16px; }
}
</style>


<div class="content-wrapper hod-subject-workspace">
    <section class="content-header">
        <h1>
            <i class="fa fa-user-plus"></i> <?php echo get_phrase('hod_subject_assignments'); ?>
            <small><?php echo get_phrase('assign_subjects_to_heads_of_department'); ?></small>
        </h1>
        <ol class="breadcrumb">
            <li><a href="<?php echo base_url(); ?>admin/dashboard"><i class="fa fa-dashboard"></i> <?php echo get_phrase('home'); ?></a></li>
            <li><a href="#"><?php echo get_phrase('academic'); ?></a></li>
            <li class="active"><?php echo get_phrase('hod_subject_assignments'); ?></li>
        </ol>
    </section>

    <section class="content">
        <!-- Flash Messages -->
        <?php if ($this->session->flashdata('flash_message')): ?>
            <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?php echo $this->session->flashdata('flash_message'); ?>
            </div>
        <?php endif; ?>
        
        <?php if ($this->session->flashdata('error_message')): ?>
            <div class="alert alert-danger alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-ban"></i> <?php echo $this->session->flashdata('error_message'); ?>
            </div>
        <?php endif; ?>

        <div class="row">
            <!-- Add Assignment Form -->
            <div class="col-md-4">
                <div class="box box-primary">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-plus"></i> <?php echo get_phrase('add_assignment'); ?></h3>
                    </div>
                    <div class="box-body">
                        <form action="<?php echo base_url(); ?>admin/hod_subject_assignments/create" method="POST">
                            <div class="form-group">
                                <label><?php echo get_phrase('select_hod'); ?> <span class="text-red">*</span></label>
                                <select name="hod_id" class="form-control select2" required style="width: 100%;">
                                    <option value=""><?php echo get_phrase('select_hod'); ?></option>
                                    <?php foreach ($hods as $hod): ?>
                                        <option value="<?php echo $hod->teacher_id; ?>">
                                            <?php echo $hod->name; ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div class="form-group">
                                <label><?php echo get_phrase('select_subject'); ?> <span class="text-red">*</span></label>
                                <select name="subject_id" class="form-control select2" required style="width: 100%;">
                                    <option value=""><?php echo get_phrase('select_subject'); ?></option>
                                    <?php 
                                    $current_class = '';
                                    foreach ($subjects as $subject): 
                                        $class_name = $this->db->get_where('class', array('class_id' => $subject->class_id))->row()->name ?? '';
                                        if ($current_class != $class_name):
                                            if ($current_class != '') echo '</optgroup>';
                                            echo '<optgroup label="' . $class_name . '">';
                                            $current_class = $class_name;
                                        endif;
                                    ?>
                                        <option value="<?php echo $subject->subject_id; ?>">
                                            <?php echo $subject->name; ?> (<?php echo $subject->year; ?>)
                                        </option>
                                    <?php endforeach; ?>
                                    </optgroup>
                                </select>
                            </div>

                            <button type="submit" class="btn btn-primary btn-block">
                                <i class="fa fa-plus"></i> <?php echo get_phrase('add_assignment'); ?>
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Help Box -->
                <div class="box box-info">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-info-circle"></i> <?php echo get_phrase('information'); ?></h3>
                    </div>
                    <div class="box-body">
                        <p><strong><?php echo get_phrase('what_does_this_do'); ?></strong></p>
                        <ul class="list-unstyled">
                            <li><i class="fa fa-check text-green"></i> <?php echo get_phrase('assigns_subjects_to_hods_for_review'); ?></li>
                            <li><i class="fa fa-check text-green"></i> <?php echo get_phrase('hods_can_only_see_their_assigned_subjects'); ?></li>
                            <li><i class="fa fa-check text-green"></i> <?php echo get_phrase('multiple_subjects_can_be_assigned_to_one_hod'); ?></li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Current Assignments -->
            <div class="col-md-8">
                <div class="box box-success">
                    <div class="box-header with-border">
                        <h3 class="box-title"><i class="fa fa-list"></i> <?php echo get_phrase('current_assignments'); ?></h3>
                        <div class="box-tools pull-right">
                            <span class="label label-primary"><?php echo count($assignments); ?> <?php echo get_phrase('assignments'); ?></span>
                        </div>
                    </div>
                    <div class="box-body table-responsive">
                        <?php if (empty($assignments)): ?>
                            <div class="alert alert-info">
                                <i class="fa fa-info-circle"></i> <?php echo get_phrase('no_hod_subject_assignments_found'); ?>
                            </div>
                        <?php else: ?>
                            <table class="table table-bordered table-striped table-hover" id="assignments-table">
                                <thead>
                                    <tr>
                                        <th style="width: 40px;">#</th>
                                        <th><?php echo get_phrase('hod_name'); ?></th>
                                        <th><?php echo get_phrase('subject'); ?></th>
                                        <th><?php echo get_phrase('assigned_date'); ?></th>
                                        <th style="width: 100px;"><?php echo get_phrase('actions'); ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php $count = 1; foreach ($assignments as $assignment): ?>
                                        <tr>
                                            <td><?php echo $count++; ?></td>
                                            <td>
                                                <span class="label label-info"><?php echo $assignment->hod_name; ?></span>
                                            </td>
                                            <td><?php echo $assignment->subject_name; ?></td>
                                            <td>
                                                <small><?php echo date('M d, Y', strtotime($assignment->created_at)); ?></small>
                                            </td>
                                            <td>
                                                <button type="button" class="btn btn-danger btn-sm btn-delete" 
                                                        data-id="<?php echo $assignment->id; ?>"
                                                        data-hod="<?php echo $assignment->hod_name; ?>"
                                                        data-subject="<?php echo $assignment->subject_name; ?>"
                                                        title="<?php echo get_phrase('remove'); ?>">
                                                    <i class="fa fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </section>
</div>

<!-- Delete Confirmation Modal -->
<div class="modal fade" id="modal-delete" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                <h4 class="modal-title"><?php echo get_phrase('remove_assignment'); ?></h4>
            </div>
            <div class="modal-body">
                <p><?php echo get_phrase('are_you_sure_you_want_to_remove_this_assignment'); ?></p>
                <p><strong id="delete-hod"></strong> - <strong id="delete-subject"></strong></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo get_phrase('cancel'); ?></button>
                <a href="#" id="btn-confirm-delete" class="btn btn-danger">
                    <i class="fa fa-trash"></i> <?php echo get_phrase('remove'); ?>
                </a>
            </div>
        </div>
    </div>
</div>

<script>
$(document).ready(function() {
    // Initialize DataTable
    $('#assignments-table').DataTable({
        "order": [[1, "asc"], [2, "asc"]],
        "pageLength": 25
    });

    // Initialize Select2
    $('.select2').select2();

    // Delete button click
    $('.btn-delete').on('click', function() {
        var id = $(this).data('id');
        var hod = $(this).data('hod');
        var subject = $(this).data('subject');
        
        $('#delete-hod').text(hod);
        $('#delete-subject').text(subject);
        $('#btn-confirm-delete').attr('href', '<?php echo base_url(); ?>admin/hod_subject_assignments/delete/' + id);
        $('#modal-delete').modal('show');
    });
});
</script>
