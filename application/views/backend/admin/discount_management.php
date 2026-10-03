<style>
.stat-card {
    background: #2563eb;
    color: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
}
.stat-card h3 { margin: 0; font-size: 36px; }
.stat-card p { margin: 5px 0 0 0; opacity: 0.9; }
</style>

<style>
@media screen {
  body { background: #f8fafc; }

  .discount-management-head {
    margin: 0 0 18px; padding: 0 0 18px; border-bottom: 1px solid #e2e8f0;
  }
  .discount-management-head .eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
  }
  .discount-management-head h1 {
    margin: 0; color: #0f172a; font-size: 28px; line-height: 1.2;
    font-weight: 800; letter-spacing: -.02em;
  }
  .discount-management-head p {
    margin: 6px 0 0; color: #64748b; font-size: 14px; line-height: 1.5;
  }

  .discount-management-stats {
    display: grid; grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 12px; margin: 0 0 16px;
  }
  .discount-management-stats > .col-md-3 {
    width: auto; float: none; padding: 0;
  }
  .discount-management-stats .stat-card {
    min-height: 104px; margin: 0; padding: 15px 16px;
    border: 1px solid #e2e8f0; border-left: 4px solid #2563eb;
    border-radius: 12px; background: #fff !important; color: #0f172a;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
  }
  .discount-management-stats > .col-md-3:nth-child(2) .stat-card { border-left-color: #059669; }
  .discount-management-stats > .col-md-3:nth-child(3) .stat-card { border-left-color: #ea580c; }
  .discount-management-stats > .col-md-3:nth-child(4) .stat-card { border-left-color: #7c3aed; }
  .discount-management-stats .stat-card h3 {
    margin: 0 0 5px; color: #0f172a; font-size: 28px; line-height: 1.2; font-weight: 800;
  }
  .discount-management-stats .stat-card p {
    margin: 0; color: #64748b; font-size: 13px; line-height: 1.4; font-weight: 700;
  }

  .discount-management-panel {
    margin: 0; border: 1px solid #e2e8f0; border-radius: 14px;
    overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,.05); background: #fff;
  }
  .discount-management-panel > .panel-heading {
    padding: 14px 18px; border: 0; border-bottom: 1px solid #eef2f7;
    background: #fff !important;
  }
  .discount-management-panel > .panel-heading .panel-title {
    margin: 0; color: #0f172a; font-size: 17px; font-weight: 800;
  }
  .discount-management-panel > .panel-body { padding: 16px 18px; }

  .discount-filter-row {
    display: grid; grid-template-columns: repeat(3,minmax(150px,1fr)) minmax(120px,.65fr);
    gap: 12px; margin: 0 0 12px !important;
  }
  .discount-filter-row > div { width: auto; float: none; padding: 0; }
  .discount-filter-row .form-control {
    min-height: 44px; height: 44px; padding: 9px 11px;
    border: 1px solid #cbd5e1; border-radius: 9px;
    background: #fff; color: #0f172a; font-size: 14px;
  }
  .discount-filter-row .form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
  }
  .discount-filter-row .btn {
    min-height: 44px; height: 44px; padding: 9px 14px;
    border-radius: 9px; font-size: 14px; font-weight: 800;
  }

  .discount-actions-row { margin: 0 0 14px !important; }
  .discount-actions-row > .col-md-12 {
    padding: 0; display: flex; flex-wrap: wrap; gap: 8px;
  }
  .discount-actions-row .btn {
    min-height: 40px; padding: 8px 13px; border-radius: 8px;
    font-size: 14px; font-weight: 700;
  }

  .discount-table-wrap {
    width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
    border: 1px solid #e2e8f0; border-radius: 11px;
  }
  #assignmentsTable {
    min-width: 900px; margin: 0 !important; border: 0 !important;
  }
  #assignmentsTable thead th {
    padding: 11px 12px; background: #f8fafc; color: #475569;
    font-size: 13px; line-height: 1.35; font-weight: 800;
    letter-spacing: .03em; border-bottom: 1px solid #e2e8f0;
  }
  #assignmentsTable tbody td {
    padding: 11px 12px; color: #334155; font-size: 14px; line-height: 1.45;
    vertical-align: middle; border-color: #eef2f7;
  }
  #assignmentsTable tbody tr:hover td { background: #f8fbff; }
  #assignmentsTable .label,
  #assignmentsTable .badge {
    padding: 4px 8px; border-radius: 999px; font-size: 12.5px; font-weight: 700;
  }
  #assignmentsTable .btn-xs {
    min-width: 34px; min-height: 34px; padding: 6px 8px; border-radius: 7px; font-size: 13px;
  }

  @media (max-width: 900px) {
    .discount-management-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .discount-filter-row { grid-template-columns: repeat(2,minmax(0,1fr)); }
  }
  @media (max-width: 560px) {
    .discount-management-head h1 { font-size: 24px; }
    .discount-management-stats { grid-template-columns: 1fr; }
    .discount-filter-row { grid-template-columns: 1fr; }
    .discount-actions-row > .col-md-12 { flex-direction: column; }
    .discount-actions-row .btn { width: 100%; justify-content: center; }
  }
}
</style>


<div class="discount-management-head">
    <p class="eyebrow">Finance</p>
    <h1>Discount Management</h1>
    <p>Monitor active discount profiles, student assignments and applied discount rules from one workspace.</p>
</div>

<div class="row discount-management-stats">
    <div class="col-md-3">
        <div class="stat-card">
            <h3 id="totalProfiles">0</h3>
            <p><i class="fa fa-tags"></i> <?php echo get_phrase('active_profiles'); ?></p>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card" style="background: #059669;">
            <h3 id="totalAssignments">0</h3>
            <p><i class="fa fa-users"></i> <?php echo get_phrase('total_assignments'); ?></p>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card" style="background: #ea580c;">
            <h3 id="totalStudents">0</h3>
            <p><i class="fa fa-user"></i> <?php echo get_phrase('students_with_discounts'); ?></p>
        </div>
    </div>
    <div class="col-md-3">
        <div class="stat-card" style="background: #3b5998;">
            <h3 id="totalRules">0</h3>
            <p><i class="fa fa-cog"></i> <?php echo get_phrase('total_rules'); ?></p>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="panel panel-primary discount-management-panel">
            <div class="panel-heading" style="background: #2563eb;">
                <h3 class="panel-title"><i class="fa fa-list"></i> <?php echo get_phrase('student_discount_assignments'); ?></h3>
            </div>
            <div class="panel-body">
                <div class="row mb-3 discount-filter-row">
                    <div class="col-md-3">
                        <select id="filterYear" class="form-control">
                            <option value=""><?php echo get_phrase('all_years'); ?></option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="filterTerm" class="form-control">
                            <option value=""><?php echo get_phrase('all_terms'); ?></option>
                            <option value="1">Term 1</option>
                            <option value="2">Term 2</option>
                            <option value="3">Term 3</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <select id="filterProfile" class="form-control">
                            <option value=""><?php echo get_phrase('all_profiles'); ?></option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <button class="btn btn-primary btn-block" onclick="loadAssignments()">
                            <i class="fa fa-filter"></i> <?php echo get_phrase('filter'); ?>
                        </button>
                    </div>
                </div>

                <div class="row mb-3 discount-actions-row">
                    <div class="col-md-12">
                        <a href="<?php echo site_url('admin/discount_profiles'); ?>" class="btn btn-success">
                            <i class="fa fa-tags"></i> <?php echo get_phrase('manage_profiles'); ?>
                        </a>
                        <a href="<?php echo site_url('admin/assign_student_discount'); ?>" class="btn btn-primary">
                            <i class="fa fa-user-plus"></i> <?php echo get_phrase('assign_students'); ?>
                        </a>
                        <button class="btn btn-info" onclick="showBulkAssignModal()">
                            <i class="fa fa-users"></i> <?php echo get_phrase('bulk_assign'); ?>
                        </button>
                    </div>
                </div>

                <div class="discount-table-wrap">
                <table id="assignmentsTable" class="table table-striped table-bordered">
                    <thead>
                        <tr>
                            <th><?php echo get_phrase('student'); ?></th>
                            <th><?php echo get_phrase('student_code'); ?></th>
                            <th><?php echo get_phrase('profile'); ?></th>
                            <th><?php echo get_phrase('type'); ?></th>
                            <th><?php echo get_phrase('year'); ?></th>
                            <th><?php echo get_phrase('term'); ?></th>
                            <th><?php echo get_phrase('assigned_by'); ?></th>
                            <th><?php echo get_phrase('actions'); ?></th>
                        </tr>
                    </thead>
                    <tbody id="assignmentsBody">
                        <tr>
                            <td colspan="8" class="text-center">
                                <i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase('loading'); ?>...
                            </td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
$(document).ready(function() {
    loadStats();
    loadFilters();
    loadAssignments();
});

function loadStats() {
    $.get('<?php echo site_url("admin/get_discount_stats"); ?>', function(data) {
        $('#totalProfiles').text(data.profiles || 0);
        $('#totalAssignments').text(data.assignments || 0);
        $('#totalStudents').text(data.students || 0);
        $('#totalRules').text(data.rules || 0);
    }, 'json');
}

function loadFilters() {
    $.get('<?php echo site_url("admin/get_discount_filters"); ?>', function(data) {
        data.years.forEach(function(year) {
            $('#filterYear').append('<option value="'+year+'">'+year+'</option>');
        });
        data.profiles.forEach(function(profile) {
            $('#filterProfile').append('<option value="'+profile.profile_id+'">'+profile.profile_name+'</option>');
        });
        $('#filterYear').val('<?php echo get_settings("running_year"); ?>');
        $('#filterTerm').val('<?php echo get_settings("running_term"); ?>');
    }, 'json');
}

function loadAssignments() {
    var year = $('#filterYear').val();
    var term = $('#filterTerm').val();
    var profile = $('#filterProfile').val();
    
    $('#assignmentsBody').html('<tr><td colspan="8" class="text-center"><i class="fa fa-spinner fa-spin"></i> Loading...</td></tr>');
    
    $.get('<?php echo site_url("admin/get_discount_assignments"); ?>', {
        year: year,
        term: term,
        profile_id: profile
    }, function(data) {
        if(data.length === 0) {
            $('#assignmentsBody').html('<tr><td colspan="8" class="text-center">No assignments found</td></tr>');
            return;
        }
        
        var html = '';
        data.forEach(function(row) {
            html += '<tr>';
            html += '<td>'+row.student_name+'</td>';
            html += '<td>'+row.student_code+'</td>';
            html += '<td><span class="label label-primary">'+row.profile_name+'</span></td>';
            html += '<td><span class="badge badge-info">'+row.discount_type+'</span></td>';
            html += '<td>'+row.year+'</td>';
            html += '<td>'+row.term+'</td>';
            html += '<td>'+row.assigned_by_name+'</td>';
            html += '<td><button class="btn btn-danger btn-xs" onclick="unassign('+row.assignment_id+')"><i class="fa fa-trash"></i></button></td>';
            html += '</tr>';
        });
        $('#assignmentsBody').html(html);
    }, 'json');
}

function unassign(id) {
    showConfirmModal(
        '<?php echo get_phrase("confirm_unassign"); ?>',
        '<?php echo get_phrase("are_you_sure"); ?>',
        function() {
            showAjaxModal_alert('<?php echo get_phrase("removing"); ?>...', 'loading');
            $.post('<?php echo site_url("admin/unassign_discount"); ?>', {assignment_id: id}, function(response) {
                if(response.status === 'success') {
                    showAjaxModal_alert(response.message, 'success');
                    setTimeout(() => loadAssignments(), 2000);
                } else {
                    showAjaxModal_alert(response.message, 'error');
                }
            }, 'json');
        },
        '<?php echo get_phrase("unassign"); ?>',
        'danger'
    );
}

function showBulkAssignModal() {
    loadModalContent('detailsModal', '<?php echo site_url("admin/assign_student_discount_modal"); ?>', '<i class="fa fa-users"></i> <?php echo get_phrase("bulk_assign_discounts"); ?>');
    $('#detailsModal').on('shown.bs.modal', function() {
        if(typeof initModalData === 'function') {
            initModalData();
        }
    });
}

function loadData() {
    loadStats();
    loadAssignments();
}
</script>
