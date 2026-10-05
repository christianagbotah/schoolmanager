<style>
.privileges-container { max-width: 1400px; margin: 0 auto; padding: 0 0 32px; }
.privileges-header { background: #764ba2; color: white; padding: 18px 20px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.privileges-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: white !important; }
.privileges-header p { margin: 7px 0 0; opacity: 0.9; font-size: 14px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
.stat-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #667eea; }
.stat-card h3 { margin: 0 0 10px; font-size: 32px; font-weight: 700; color: #1f2937; }
.stat-card p { margin: 0; color: #6b7280; font-size: 14px; }
.privileges-card { background: white; border-radius: 12px; padding: 25px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.privileges-card-title { font-size: 20px; font-weight: 600; color: #1f2937; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f3f4f6; display: flex; justify-content: space-between; align-items: center; }
.privileges-container .btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.privileges-container .btn-primary { background: #764ba2; color: white; }
.privileges-container .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.privileges-container .btn-success { background: #10b981; color: white; }
.privileges-container .btn-success:hover { background: #059669; }
.privileges-container .btn-danger { background: #ef4444; color: white; }
.privileges-container .btn-danger:hover { background: #dc2626; }
.privileges-container .btn-secondary { background: #6b7280; color: white; }
.privileges-container .btn-secondary:hover { background: #4b5563; }
.privileges-container .badge { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
.privileges-container .badge-success { background: #d1fae5; color: #065f46; }
.privileges-container .badge-danger { background: #fee2e2; color: #991b1b; }
.search-filter-bar { display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap; }
.search-filter-bar input, .search-filter-bar select { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
.search-filter-bar input { flex: 1; min-width: 250px; }
.bulk-actions { display: flex; gap: 10px; align-items: center; padding: 15px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px; }
.bulk-actions select { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; }
.privileges-container table { width: 100%; border-collapse: collapse; }
.privileges-container table thead { background: #f9fafb; }
.privileges-container table th { padding: 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
.privileges-container table td { padding: 12px; border-bottom: 1px solid #f3f4f6; }
.privileges-container table tbody tr:hover { background: #f9fafb; }
.checkbox-cell { width: 40px; text-align: center; }
.checkbox-cell input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
.teacher-info { display: flex; align-items: center; gap: 12px; }
.teacher-avatar { width: 40px; height: 40px; border-radius: 50%; background: #764ba2; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 16px; }
.teacher-details h4 { margin: 0; font-size: 14px; font-weight: 600; color: #1f2937; }
.teacher-details p { margin: 0; font-size: 12px; color: #6b7280; }
.action-buttons { display: flex; gap: 8px; }
.action-buttons button { padding: 6px 12px; font-size: 13px; }
@media (max-width: 768px) {
  .privileges-header { padding: 20px; }
  .privileges-header h1 { font-size: 22px; }
  .stats-grid { grid-template-columns: 1fr; }
  .search-filter-bar { flex-direction: column; }
  .search-filter-bar input { min-width: 100%; }
  .bulk-actions { flex-direction: column; align-items: stretch; }
  .privileges-container table { font-size: 13px; }
  .privileges-container table th, .privileges-container table td { padding: 8px; }
}

/* Direct UX refinement — Teacher Attendance Privileges */
.privileges-container { padding: 0 0 32px; }
.privileges-header {
    margin-bottom: 18px !important; padding: 20px 24px !important;
    border-radius: 14px !important; background: #0f172a !important;
    box-shadow: 0 8px 22px rgba(15,23,42,.16) !important;
}
.privileges-header h1 {
    font-size: 24px !important; line-height: 1.2; font-weight: 800 !important; letter-spacing: -.02em;
}
.privileges-header p { margin-top: 5px !important; font-size: 14px !important; color: #cbd5e1 !important; }

.stats-grid { gap: 14px !important; margin-bottom: 18px !important; }
.stat-card {
    padding: 17px 18px !important; border-radius: 12px !important;
    border: 1px solid #e2e8f0; border-left: 4px solid #2563eb !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.stat-card h3 { margin-bottom: 4px !important; font-size: 27px !important; line-height: 1.2; }
.stat-card p { font-size: 14px !important; line-height: 1.4; }

.privileges-card {
    padding: 18px !important; border: 1px solid #e2e8f0;
    border-radius: 14px !important; box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.privileges-card-title {
    margin-bottom: 14px !important; padding-bottom: 12px !important;
    border-bottom: 1px solid #e5e7eb !important; font-size: 18px !important; font-weight: 800 !important;
}
.privileges-card-title .btn { min-height: 40px; }

.search-filter-bar { gap: 10px !important; margin-bottom: 14px !important; }
.search-filter-bar input,
.search-filter-bar select {
    min-height: 42px; padding: 8px 11px !important; border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important; font-size: 14px !important; color: #0f172a;
}
.search-filter-bar input:focus,
.search-filter-bar select:focus {
    border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}

.bulk-actions {
    gap: 10px !important; margin-bottom: 14px !important; padding: 10px 12px !important;
    border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
}
.bulk-actions label, .bulk-actions span { font-size: 14px !important; }
.bulk-actions select {
    min-height: 40px; padding: 7px 10px !important; border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important; font-size: 14px !important;
}

.privileges-container .btn {
    min-height: 40px; padding: 8px 13px !important; border-radius: 8px !important;
    font-size: 14px !important; line-height: 1.35; font-weight: 700 !important;
}
.privileges-container .btn-primary { background: #2563eb !important; }
.privileges-container .btn-primary:hover { background: #1d4ed8 !important; transform: translateY(-1px) !important; box-shadow: 0 3px 10px rgba(37,99,235,.16) !important; }
.privileges-container .btn-sm { min-height: 36px; padding: 7px 11px !important; font-size: 13px !important; }
.privileges-container .badge {
    min-height: 30px; padding: 6px 10px !important; border-radius: 999px !important;
    display: inline-flex; align-items: center; font-size: 13px !important; font-weight: 700 !important;
}

.privileges-card > div[style*="overflow-x"] { border: 1px solid #e2e8f0; border-radius: 12px; }
#teachers-table { min-width: 920px; }
#teachers-table th {
    padding: 12px 13px !important; background: #f8fafc; color: #475569 !important;
    font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
    border-bottom: 1px solid #e2e8f0 !important;
}
#teachers-table td {
    padding: 12px 13px !important; color: #334155; font-size: 14px !important;
    line-height: 1.45; vertical-align: middle;
}
#teachers-table tbody tr:hover { background: #f8fbff !important; }
.teacher-avatar { width: 42px; height: 42px; background: #2563eb !important; font-size: 15px !important; }
.teacher-details h4 { font-size: 14px !important; font-weight: 800 !important; color: #0f172a !important; }
.teacher-details p { margin-top: 2px !important; font-size: 13px !important; color: #64748b !important; }
#teachers-table td div[style*="font-size: 12px"] { font-size: 13px !important; }
.action-buttons { gap: 7px !important; }
.action-buttons button { min-height: 36px; padding: 7px 10px !important; font-size: 13px !important; }

#modal_ajax .form-control { min-height: var(--sm-ui-control-height, 42px); font-size: 14px; border-radius: 8px; }
#modal_ajax textarea.form-control { min-height: 96px; }

@media (max-width: 768px) {
    .privileges-container { padding: 0 0 28px; }
    .privileges-header { padding: 18px !important; }
    .privileges-header h1 { font-size: 22px !important; }
    .stats-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; gap: 10px !important; }
    .stat-card { padding: 14px !important; }
    .stat-card h3 { font-size: 24px !important; }
    .search-filter-bar { flex-direction: column; }
    .search-filter-bar input { min-width: 100% !important; width: 100%; }
    .search-filter-bar select { width: 100%; }
    .bulk-actions { align-items: stretch !important; flex-direction: column; }
    .bulk-actions .btn { width: 100%; justify-content: center; }
    #teachers-table { font-size: 14px !important; }
    #teachers-table th { padding: 9px 10px !important; font-size: 13px !important; }
    #teachers-table td { padding: 10px !important; font-size: 14px !important; }
}
@media (max-width: 400px) {
    .stats-grid { grid-template-columns: 1fr !important; }
}
</style>

<div class="privileges-container">
  <div class="privileges-header">
    <h1><?php echo get_phrase('teacher_attendance_privileges'); ?></h1>
    <p>Manage teacher access to school-wide attendance monitoring</p>
  </div>

  <!-- Statistics Cards -->
  <div class="stats-grid">
    <div class="stat-card">
      <h3 id="total-teachers">0</h3>
      <p>Total Teachers</p>
    </div>
    <div class="stat-card" style="border-left-color: #10b981;">
      <h3 id="active-privileges">0</h3>
      <p>Active Privileges</p>
    </div>
    <div class="stat-card" style="border-left-color: #f59e0b;">
      <h3 id="pending-teachers">0</h3>
      <p>Without Privilege</p>
    </div>
    <div class="stat-card" style="border-left-color: #ef4444;">
      <h3 id="revoked-privileges">0</h3>
      <p>Revoked Privileges</p>
    </div>
  </div>

  <!-- Main Card -->
  <div class="privileges-card">
    <div class="privileges-card-title">
      <span>Teacher List</span>
      <button class="btn btn-primary" onclick="refreshTable()">
        <i class="mdi mdi-refresh"></i> Refresh
      </button>
    </div>

    <!-- Search and Filter Bar -->
    <div class="search-filter-bar">
      <input type="text" id="search-input" placeholder="Search by name, email, or phone..." onkeyup="filterTable()">
      <select id="status-filter" onchange="filterTable()">
        <option value="">All Status</option>
        <option value="active">With Privilege</option>
        <option value="no-privilege">Without Privilege</option>
      </select>
    </div>

    <!-- Bulk Actions -->
    <div class="bulk-actions">
      <input type="checkbox" id="select-all" onchange="toggleSelectAll()">
      <label for="select-all" style="margin: 0;">Select All</label>
      <span style="flex: 1; color: #6b7280; font-size: 14px;" id="selected-count">0 selected</span>
      <button class="btn btn-success" onclick="bulkGrantPrivileges()" id="bulk-grant-btn" disabled>
        <i class="mdi mdi-check-circle"></i> Grant Privilege
      </button>
      <button class="btn btn-danger" onclick="bulkRevokePrivileges()" id="bulk-revoke-btn" disabled>
        <i class="mdi mdi-close-circle"></i> Revoke Privilege
      </button>
    </div>

    <!-- Teachers Table -->
    <div style="overflow-x: auto;">
      <table id="teachers-table">
        <thead>
          <tr>
            <th class="checkbox-cell"><input type="checkbox" id="header-checkbox" onchange="toggleSelectAll()"></th>
            <th>Teacher</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Granted By</th>
            <th>Granted Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="teachers-tbody">
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
              <i class="mdi mdi-loading mdi-spin" style="font-size: 32px;"></i><br>
              Loading teachers...
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

<script>
let teachersData = [];
let selectedTeachers = new Set();
let bulkActionType = ''; // 'grant' or 'revoke'

// Load teachers on page load
$(document).ready(function() {
  loadTeachers();
});

function loadTeachers() {
  $.ajax({
    url: '<?php echo site_url("admin/get_teachers_privilege_list"); ?>',
    type: 'POST',
    dataType: 'json',
    success: function(response) {
      if (response.status === 'success') {
        teachersData = response.data;
        updateStatistics(response.statistics);
        renderTable();
      } else {
        showAjaxModal_alert(response.message || 'Failed to load teachers', 'Error');
      }
    },
    error: function() {
      showAjaxModal_alert('Failed to connect to server', 'Error');
    }
  });
}

function updateStatistics(stats) {
  $('#total-teachers').text(stats.total_teachers || 0);
  $('#active-privileges').text(stats.active_privileges || 0);
  $('#pending-teachers').text((stats.total_teachers - stats.active_privileges) || 0);
  $('#revoked-privileges').text(stats.revoked_privileges || 0);
}

function renderTable() {
  const tbody = $('#teachers-tbody');
  tbody.empty();

  if (teachersData.length === 0) {
    tbody.append(`
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #6b7280;">
          No teachers found
        </td>
      </tr>
    `);
    return;
  }

  teachersData.forEach(teacher => {
    const initials = teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const hasPrivilege = teacher.has_privilege;
    const statusBadge = hasPrivilege 
      ? '<span class="badge badge-success">Active</span>' 
      : '<span class="badge badge-danger">No Privilege</span>';
    
    const grantedBy = hasPrivilege && teacher.granted_by_name ? teacher.granted_by_name : '-';
    
    // Format date as "Jan 14, 2026"
    let grantedDate = '-';
    if (hasPrivilege && teacher.privilege_granted_at) {
      const date = new Date(teacher.privilege_granted_at);
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      grantedDate = date.toLocaleDateString('en-US', options);
    }

    const actionButton = hasPrivilege
      ? `<button class="btn btn-danger btn-sm" onclick="showRevokeModal(${teacher.teacher_id}, '${teacher.name.replace(/'/g, "\\'")}')">
           <i class="mdi mdi-close-circle"></i> Revoke
         </button>`
      : `<button class="btn btn-success btn-sm" onclick="showGrantModal(${teacher.teacher_id}, '${teacher.name.replace(/'/g, "\\'")}')">
           <i class="mdi mdi-check-circle"></i> Grant
         </button>`;

    tbody.append(`
      <tr data-teacher-id="${teacher.teacher_id}" data-has-privilege="${hasPrivilege}">
        <td class="checkbox-cell">
          <input type="checkbox" class="teacher-checkbox" value="${teacher.teacher_id}" onchange="updateSelection()">
        </td>
        <td>
          <div class="teacher-info">
            <div class="teacher-avatar">${initials}</div>
            <div class="teacher-details">
              <h4>${teacher.name}</h4>
              <p>Code: ${teacher.teacher_code || 'N/A'}</p>
            </div>
          </div>
        </td>
        <td>
          <div>${teacher.email || '-'}</div>
          <div style="font-size: 12px; color: #6b7280;">${teacher.phone || '-'}</div>
        </td>
        <td>${statusBadge}</td>
        <td>${grantedBy}</td>
        <td>${grantedDate}</td>
        <td>
          <div class="action-buttons">
            ${actionButton}
          </div>
        </td>
      </tr>
    `);
  });
}

function filterTable() {
  const searchTerm = $('#search-input').val().toLowerCase();
  const statusFilter = $('#status-filter').val();

  $('#teachers-tbody tr').each(function() {
    const row = $(this);
    const teacherName = row.find('.teacher-details h4').text().toLowerCase();
    const teacherEmail = row.find('td:eq(2) div:first').text().toLowerCase();
    const teacherPhone = row.find('td:eq(2) div:last').text().toLowerCase();
    const hasPrivilege = row.data('has-privilege');

    const matchesSearch = teacherName.includes(searchTerm) || 
                         teacherEmail.includes(searchTerm) || 
                         teacherPhone.includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = hasPrivilege === true;
    } else if (statusFilter === 'no-privilege') {
      matchesStatus = hasPrivilege === false;
    }

    row.toggle(matchesSearch && matchesStatus);
  });
}

function toggleSelectAll() {
  const isChecked = $('#select-all').is(':checked') || $('#header-checkbox').is(':checked');
  $('.teacher-checkbox:visible').prop('checked', isChecked);
  updateSelection();
}

function updateSelection() {
  selectedTeachers.clear();
  $('.teacher-checkbox:checked').each(function() {
    selectedTeachers.add(parseInt($(this).val()));
  });

  const count = selectedTeachers.size;
  $('#selected-count').text(`${count} selected`);
  $('#bulk-grant-btn').prop('disabled', count === 0);
  $('#bulk-revoke-btn').prop('disabled', count === 0);
}

function showGrantModal(teacherId, teacherName) {
  // Use modal_ajax from modal.php to show grant form
  const modalContent = `
    <div style="padding: 20px;">
      <h4 style="margin-bottom: 20px;">Grant Attendance Privilege</h4>
      <p>Grant attendance monitoring privilege to <strong>${teacherName}</strong>?</p>
      <div class="form-group" style="margin-top: 16px;">
        <label>Notes (Optional)</label>
        <textarea id="grant-notes-input" class="form-control" rows="3" placeholder="Add notes for this privilege grant..."></textarea>
      </div>
      <div style="margin-top: 16px; text-align: right;">
        <button type="button" class="btn btn-secondary" onclick="$('#modal_ajax').modal('hide')">Cancel</button>
        <button type="button" class="btn btn-success" onclick="executeGrantPrivilege(${teacherId})" style="margin-left: 10px;">Grant Privilege</button>
      </div>
    </div>
  `;
  
  $('#modal_ajax .modal-body').html(modalContent);
  $('#modal_ajax').modal('show');
}

function showRevokeModal(teacherId, teacherName) {
  // Use modal_ajax from modal.php to show revoke confirmation
  const modalContent = `
    <div style="padding: 20px;">
      <h4 style="margin-bottom: 20px; color: #ef4444;">Revoke Attendance Privilege</h4>
      <div class="alert alert-warning" style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <i class="mdi mdi-alert"></i> Warning: This will revoke attendance monitoring access.
      </div>
      <p>Revoke attendance monitoring privilege from <strong>${teacherName}</strong>?</p>
      <div class="form-group" style="margin-top: 16px;">
        <label>Reason for Revocation (Optional)</label>
        <textarea id="revoke-notes-input" class="form-control" rows="3" placeholder="Add reason for revocation..."></textarea>
      </div>
      <div style="margin-top: 16px; text-align: right;">
        <button type="button" class="btn btn-secondary" onclick="$('#modal_ajax').modal('hide')">Cancel</button>
        <button type="button" class="btn btn-danger" onclick="executeRevokePrivilege(${teacherId})" style="margin-left: 10px;">Revoke Privilege</button>
      </div>
    </div>
  `;
  
  $('#modal_ajax .modal-body').html(modalContent);
  $('#modal_ajax').modal('show');
}

function executeGrantPrivilege(teacherId) {
  const notes = $('#grant-notes-input').val();
  
  $('#modal_ajax').modal('hide');
  showAjaxModal_alert('Granting privilege...', 'Loading');

  $.ajax({
    url: '<?php echo site_url("admin/grant_privilege"); ?>',
    type: 'POST',
    data: {
      teacher_id: teacherId,
      notes: notes
    },
    dataType: 'json',
    success: function(response) {
      if (response.status === 'success') {
        showAjaxModal_alert(response.message || 'Privilege granted successfully', 'Success');
        setTimeout(function() {
          loadTeachers();
        }, 2000);
      } else {
        showAjaxModal_alert(response.message || 'Failed to grant privilege', 'Error');
      }
    },
    error: function() {
      showAjaxModal_alert('Failed to connect to server', 'Error');
    }
  });
}

function executeRevokePrivilege(teacherId) {
  const notes = $('#revoke-notes-input').val();
  
  $('#modal_ajax').modal('hide');
  showAjaxModal_alert('Revoking privilege...', 'Loading');

  $.ajax({
    url: '<?php echo site_url("admin/revoke_privilege"); ?>',
    type: 'POST',
    data: {
      teacher_id: teacherId,
      notes: notes
    },
    dataType: 'json',
    success: function(response) {
      if (response.status === 'success') {
        showAjaxModal_alert(response.message || 'Privilege revoked successfully', 'Success');
        setTimeout(function() {
          loadTeachers();
        }, 2000);
      } else {
        showAjaxModal_alert(response.message || 'Failed to revoke privilege', 'Error');
      }
    },
    error: function() {
      showAjaxModal_alert('Failed to connect to server', 'Error');
    }
  });
}

function bulkGrantPrivileges() {
  if (selectedTeachers.size === 0) return;

  bulkActionType = 'grant';
  
  // Use modal_ajax from modal.php to show bulk grant form
  const modalContent = `
    <div style="padding: 20px;">
      <h4 style="margin-bottom: 20px;">Bulk Grant Privileges</h4>
      <p>You are about to grant privileges to <strong>${selectedTeachers.size}</strong> teacher(s).</p>
      <div class="form-group" style="margin-top: 16px;">
        <label>Notes (Optional)</label>
        <textarea id="bulk-notes-input" class="form-control" rows="3" placeholder="Add notes for this bulk grant..."></textarea>
      </div>
      <div style="margin-top: 16px; text-align: right;">
        <button type="button" class="btn btn-secondary" onclick="$('#modal_ajax').modal('hide')">Cancel</button>
        <button type="button" class="btn btn-success" onclick="executeBulkAction()" style="margin-left: 10px;">Grant Privileges</button>
      </div>
    </div>
  `;
  
  $('#modal_ajax .modal-body').html(modalContent);
  $('#modal_ajax').modal('show');
}

function bulkRevokePrivileges() {
  if (selectedTeachers.size === 0) return;

  bulkActionType = 'revoke';
  
  // Use modal_ajax from modal.php to show bulk revoke confirmation
  const modalContent = `
    <div style="padding: 20px;">
      <h4 style="margin-bottom: 20px; color: #ef4444;">Confirm Bulk Revoke</h4>
      <div class="alert alert-warning" style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <i class="mdi mdi-alert"></i> Warning: This action will revoke privileges from multiple teachers.
      </div>
      <p>You are about to revoke privileges from <strong>${selectedTeachers.size}</strong> teacher(s).</p>
      <div class="form-group" style="margin-top: 16px;">
        <label>Reason for Revocation (Optional)</label>
        <textarea id="bulk-notes-input" class="form-control" rows="3" placeholder="Add reason for revocation..."></textarea>
      </div>
      <div style="margin-top: 16px; text-align: right;">
        <button type="button" class="btn btn-secondary" onclick="$('#modal_ajax').modal('hide')">Cancel</button>
        <button type="button" class="btn btn-danger" onclick="executeBulkAction()" style="margin-left: 10px;">Revoke Privileges</button>
      </div>
    </div>
  `;
  
  $('#modal_ajax .modal-body').html(modalContent);
  $('#modal_ajax').modal('show');
}

function executeBulkAction() {
  const notes = $('#bulk-notes-input').val();
  const url = bulkActionType === 'grant' 
    ? '<?php echo site_url("admin/bulk_grant_privileges"); ?>'
    : '<?php echo site_url("admin/bulk_revoke_privileges"); ?>';
  
  $('#modal_ajax').modal('hide');
  showAjaxModal_alert('Processing bulk ' + bulkActionType + '...', 'Loading');

  $.ajax({
    url: url,
    type: 'POST',
    data: {
      teacher_ids: Array.from(selectedTeachers),
      notes: notes
    },
    dataType: 'json',
    success: function(response) {
      if (response.status === 'success') {
        const message = bulkActionType === 'grant'
          ? `Granted privileges to ${response.success_count || response.revoked_count} teacher(s)`
          : `Revoked privileges from ${response.revoked_count || response.success_count} teacher(s)`;
        
        showAjaxModal_alert(message, 'Success');
        
        if (bulkActionType === 'grant' && response.failed_count > 0) {
          setTimeout(function() {
            showAjaxModal_alert(`${response.failed_count} teacher(s) already have privileges`, 'Warning');
          }, 2500);
        }
        
        selectedTeachers.clear();
        setTimeout(function() {
          loadTeachers();
        }, 3000);
      } else {
        showAjaxModal_alert(response.message || 'Failed to ' + bulkActionType + ' privileges', 'Error');
      }
    },
    error: function() {
      showAjaxModal_alert('Failed to connect to server', 'Error');
    }
  });
}

function refreshTable() {
  selectedTeachers.clear();
  $('#select-all').prop('checked', false);
  $('#header-checkbox').prop('checked', false);
  updateSelection();
  loadTeachers();
}
</script>
