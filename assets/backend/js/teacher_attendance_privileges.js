/**
 * Teacher Attendance Privileges Management JavaScript
 * Handles privilege grant/revoke operations and UI interactions
 */

const TeacherPrivilegesManager = {
    dataTable: null,
    selectedTeachers: [],
    
    /**
     * Initialize the privilege management system
     */
    init: function() {
        this.loadTeachersList();
        this.loadStatistics();
        this.loadAuditLog();
        this.bindEvents();
    },
    
    /**
     * Load teachers list with privilege status
     */
    loadTeachersList: function() {
        const self = this;
        
        $.ajax({
            url: base_url + '/admin/get_teachers_privilege_list',
            type: 'POST',
            data: {
                [csrf_token_name]: csrf_token_value
            },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    self.initDataTable(response.data);
                } else {
                    self.showError(response.message || 'Failed to load teachers list');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', error);
                self.showError('Failed to load teachers list');
            }
        });
    },
    
    /**
     * Initialize DataTable with teachers data
     */
    initDataTable: function(data) {
        const self = this;
        
        // Clear existing table
        $('#teachers-privileges-table tbody').empty();
        
        // Populate table
        if (data && data.length > 0) {
            data.forEach(function(teacher) {
                const hasPrivilege = teacher.has_privilege;
                const statusBadge = hasPrivilege ? 
                    '<span class="badge badge-active">Active</span>' : 
                    '<span class="badge badge-inactive">No Access</span>';
                
                const grantedDate = teacher.privilege_granted_at ? 
                    new Date(teacher.privilege_granted_at).toLocaleDateString() : 
                    '-';
                
                const toggleChecked = hasPrivilege ? 'checked' : '';
                
                const row = '<tr data-teacher-id="' + teacher.teacher_id + '">' +
                    '<td><input type="checkbox" class="teacher-checkbox" value="' + teacher.teacher_id + '"></td>' +
                    '<td>' + self.escapeHtml(teacher.name) + '</td>' +
                    '<td>' + self.escapeHtml(teacher.email || '-') + '</td>' +
                    '<td>' + self.escapeHtml(teacher.phone || '-') + '</td>' +
                    '<td>' + statusBadge + '</td>' +
                    '<td>' + grantedDate + '</td>' +
                    '<td>' +
                        '<label class="privilege-toggle">' +
                            '<input type="checkbox" class="privilege-toggle-input" data-teacher-id="' + teacher.teacher_id + '" ' + toggleChecked + '>' +
                            '<span class="toggle-slider"></span>' +
                        '</label>' +
                    '</td>' +
                    '</tr>';
                
                $('#teachers-privileges-table tbody').append(row);
            });
        }
        
        // Initialize DataTable
        if (this.dataTable) {
            this.dataTable.destroy();
        }
        
        this.dataTable = $('#teachers-privileges-table').DataTable({
            responsive: true,
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            order: [[1, 'asc']], // Sort by name
            columnDefs: [
                { orderable: false, targets: [0, 6] } // Disable sorting for checkbox and actions columns
            ],
            language: {
                search: "Search:",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ teachers",
                infoEmpty: "No teachers to show",
                infoFiltered: "(filtered from _MAX_ total teachers)",
                zeroRecords: "No matching teachers found"
            }
        });
    },
    
    /**
     * Load statistics
     */
    loadStatistics: function() {
        $.ajax({
            url: base_url + '/admin/get_teachers_privilege_list',
            type: 'POST',
            data: {
                [csrf_token_name]: csrf_token_value
            },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    const data = response.data;
                    const total = data.length;
                    const active = data.filter(t => t.has_privilege).length;
                    const percentage = total > 0 ? Math.round((active / total) * 100) : 0;
                    
                    $('#stat-total-teachers').text(total);
                    $('#stat-active-privileges').text(active);
                    $('#stat-percentage').text(percentage + '%');
                    $('#stat-revoked').text(0); // Will be updated from audit log
                }
            }
        });
    },
    
    /**
     * Load audit log
     */
    loadAuditLog: function() {
        const self = this;
        
        $.ajax({
            url: base_url + '/admin/get_teachers_privilege_list',
            type: 'POST',
            data: {
                [csrf_token_name]: csrf_token_value
            },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    // For now, show recent grants
                    const recentGrants = response.data.filter(t => t.has_privilege).slice(0, 10);
                    
                    $('#audit-log-body').empty();
                    
                    if (recentGrants.length > 0) {
                        recentGrants.forEach(function(teacher) {
                            const row = '<tr>' +
                                '<td>' + self.escapeHtml(teacher.name) + '</td>' +
                                '<td>Privilege Granted</td>' +
                                '<td>Admin</td>' +
                                '<td>' + (teacher.privilege_granted_at ? new Date(teacher.privilege_granted_at).toLocaleString() : '-') + '</td>' +
                                '<td><span class="badge badge-success">Active</span></td>' +
                                '</tr>';
                            $('#audit-log-body').append(row);
                        });
                    } else {
                        $('#audit-log-body').append('<tr><td colspan="5" class="text-center">No audit records found</td></tr>');
                    }
                }
            }
        });
    },
    
    /**
     * Bind event handlers
     */
    bindEvents: function() {
        const self = this;
        
        // Select all checkbox
        $('#select-all-checkbox').on('change', function() {
            const isChecked = $(this).is(':checked');
            $('.teacher-checkbox').prop('checked', isChecked);
            self.updateBulkActionsBar();
        });
        
        // Individual checkboxes
        $(document).on('change', '.teacher-checkbox', function() {
            self.updateBulkActionsBar();
        });
        
        // Toggle switches
        $(document).on('change', '.privilege-toggle-input', function() {
            const teacherId = $(this).data('teacher-id');
            const isGranting = $(this).is(':checked');
            
            // Revert toggle state temporarily
            $(this).prop('checked', !isGranting);
            
            // Show notes modal
            self.showNotesModal(teacherId, isGranting ? 'grant' : 'revoke');
        });
        
        // Bulk grant button
        $('#bulk-grant-btn').on('click', function() {
            const selectedIds = self.getSelectedTeacherIds();
            if (selectedIds.length > 0) {
                self.showNotesModal(selectedIds, 'bulk_grant');
            }
        });
        
        // Bulk revoke button
        $('#bulk-revoke-btn').on('click', function() {
            const selectedIds = self.getSelectedTeacherIds();
            if (selectedIds.length > 0) {
                self.confirmBulkRevoke(selectedIds);
            }
        });
        
        // Clear selection button
        $('#clear-selection-btn').on('click', function() {
            $('.teacher-checkbox').prop('checked', false);
            $('#select-all-checkbox').prop('checked', false);
            self.updateBulkActionsBar();
        });
        
        // Confirm action button in modal
        $('#confirm-action-btn').on('click', function() {
            self.executeAction();
        });
    },
    
    /**
     * Update bulk actions bar visibility
     */
    updateBulkActionsBar: function() {
        const selectedCount = $('.teacher-checkbox:checked').length;
        $('#selected-count').text(selectedCount);
        
        if (selectedCount > 0) {
            $('#bulk-actions-bar').slideDown();
        } else {
            $('#bulk-actions-bar').slideUp();
        }
    },
    
    /**
     * Get selected teacher IDs
     */
    getSelectedTeacherIds: function() {
        const ids = [];
        $('.teacher-checkbox:checked').each(function() {
            ids.push($(this).val());
        });
        return ids;
    },
    
    /**
     * Show notes modal
     */
    showNotesModal: function(teacherId, actionType) {
        $('#action-teacher-id').val(Array.isArray(teacherId) ? teacherId.join(',') : teacherId);
        $('#action-type').val(actionType);
        $('#privilege-notes').val('');
        
        const titles = {
            'grant': 'Grant Privilege - Add Notes',
            'revoke': 'Revoke Privilege - Add Notes',
            'bulk_grant': 'Bulk Grant Privileges - Add Notes',
            'bulk_revoke': 'Bulk Revoke Privileges - Add Notes'
        };
        
        $('#notes-modal-title').text(titles[actionType] || 'Add Notes');
        $('#notesModal').modal('show');
    },
    
    /**
     * Confirm bulk revoke with dialog
     */
    confirmBulkRevoke: function(teacherIds) {
        showCustomConfirm('Are you sure you want to revoke privileges from ' + teacherIds.length + ' teacher(s)?', function() {
            this.showNotesModal(teacherIds, 'bulk_revoke');
        }.bind(this));
    },
    
    /**
     * Execute the privilege action
     */
    executeAction: function() {
        const self = this;
        const teacherId = $('#action-teacher-id').val();
        const actionType = $('#action-type').val();
        const notes = $('#privilege-notes').val();
        
        let url, data;
        
        if (actionType === 'grant') {
            url = base_url + '/admin/grant_attendance_privilege';
            data = {
                teacher_id: teacherId,
                notes: notes,
                [csrf_token_name]: csrf_token_value
            };
        } else if (actionType === 'revoke') {
            url = base_url + '/admin/revoke_attendance_privilege';
            data = {
                teacher_id: teacherId,
                notes: notes,
                [csrf_token_name]: csrf_token_value
            };
        } else if (actionType === 'bulk_grant') {
            url = base_url + '/admin/bulk_grant_privileges';
            data = {
                teacher_ids: teacherId.split(','),
                notes: notes,
                [csrf_token_name]: csrf_token_value
            };
        } else if (actionType === 'bulk_revoke') {
            url = base_url + '/admin/bulk_revoke_privileges';
            data = {
                teacher_ids: teacherId.split(','),
                notes: notes,
                [csrf_token_name]: csrf_token_value
            };
        }
        
        // Show loading
        $('#confirm-action-btn').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Processing...');
        
        $.ajax({
            url: url,
            type: 'POST',
            data: data,
            dataType: 'json',
            success: function(response) {
                $('#notesModal').modal('hide');
                $('#confirm-action-btn').prop('disabled', false).html('<i class="fa fa-check"></i> Confirm');
                
                if (response.status === 'success') {
                    self.showSuccess(response.message);
                    self.loadTeachersList();
                    self.loadStatistics();
                    self.loadAuditLog();
                    $('.teacher-checkbox').prop('checked', false);
                    $('#select-all-checkbox').prop('checked', false);
                    self.updateBulkActionsBar();
                } else {
                    self.showError(response.message);
                }
            },
            error: function(xhr, status, error) {
                $('#notesModal').modal('hide');
                $('#confirm-action-btn').prop('disabled', false).html('<i class="fa fa-check"></i> Confirm');
                console.error('AJAX Error:', error);
                self.showError('Operation failed. Please try again.');
            }
        });
    },
    
    /**
     * Show success message
     */
    showSuccess: function(message) {
        if (typeof toastr !== 'undefined') {
            toastr.success(message);
        } else {
            alert(message);
        }
    },
    
    /**
     * Show error message
     */
    showError: function(message) {
        if (typeof toastr !== 'undefined') {
            toastr.error(message);
        } else {
            alert(message);
        }
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }
};
