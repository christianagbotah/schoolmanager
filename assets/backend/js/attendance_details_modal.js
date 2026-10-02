/**
 * Attendance Details Modal JavaScript
 * Handles modal display, data loading, and interactions for attendance summary cards
 */

const AttendanceDetailsModal = {
    currentType: null,
    currentTimestamp: null,
    dataTable: null,
    
    /**
     * Initialize the modal functionality
     */
    init: function() {
        this.bindCardClicks();
        this.initModalHandlers();
    },
    
    /**
     * Bind click events to attendance summary cards
     */
    bindCardClicks: function() {
        const self = this;
        
        // Find all attendance summary cards with data-type attribute
        $('.attendance-summary-card, [data-attendance-type]').on('click', function(e) {
            e.preventDefault();
            
            // Get type from data attribute
            const type = $(this).data('type') || $(this).data('attendance-type');
            
            if (type && typeof initialTimestamp !== 'undefined') {
                self.showModal(type, initialTimestamp);
            } else {
                console.error('Missing type or timestamp');
            }
        });
    },
    
    /**
     * Show the modal with specified type and timestamp
     * @param {string} type - present, absent, not_marked, or total
     * @param {number} timestamp - Unix timestamp
     */
    showModal: function(type, timestamp) {
        this.currentType = type;
        this.currentTimestamp = timestamp;
        
        // Update modal title based on type
        const titles = {
            'present': 'Present Students',
            'absent': 'Absent Students',
            'not_marked': 'Not Marked Students',
            'total': 'All Students'
        };
        
        $('#modal-title-text').text(titles[type] || 'Student Details');
        
        // Reset total count to prevent showing stale data
        $('#modal-total-count').text('0');
        
        // Reset filters to default values
        $('#modal-search').val('');
        $('#modal-class-filter').val('');
        $('#modal-gender-filter').val('');
        $('#modal-residential-filter').val('');
        
        // Show modal
        $('#attendanceDetailsModal').modal('show');
        
        // Load data
        this.loadData();
    },
    
    /**
     * Load attendance data via AJAX
     */
    loadData: function() {
        const self = this;
        
        // Show loading indicator
        $('#modal-loading').show();
        $('#modal-table-container').hide();
        
        // Destroy existing DataTable if it exists using proper check
        if ($.fn.DataTable.isDataTable('#attendance-details-table')) {
            $('#attendance-details-table').DataTable().destroy();
            this.dataTable = null;
        }
        
        // Get filter values
        const filters = {
            type: this.currentType,
            timestamp: this.currentTimestamp,
            class_id: $('#modal-class-filter').val(),
            gender: $('#modal-gender-filter').val(),
            residential_status: $('#modal-residential-filter').val(),
            search: $('#modal-search').val()
        };
        
        // Add CSRF token if available
        if (typeof csrf_token_name !== 'undefined' && typeof csrf_token_value !== 'undefined') {
            filters[csrf_token_name] = csrf_token_value;
        }
        
        // Make AJAX request
        $.ajax({
            url: base_url + 'admin/get_attendance_details',
            type: 'POST',
            data: filters,
            dataType: 'json',
            success: function(response) {
                $('#modal-loading').hide();
                $('#modal-table-container').show();
                
                if (response.status === 'success') {
                    self.initDataTable(response.data);
                    $('#modal-total-count').text(response.total);
                } else {
                    self.showError(response.message || 'Failed to load data');
                }
            },
            error: function(xhr, status, error) {
                $('#modal-loading').hide();
                $('#modal-table-container').show();
                console.error('AJAX Error:', error);
                self.showError('Failed to load attendance data. Please try again.');
            }
        });
    },
    
    /**
     * Initialize DataTable with loaded data
     * @param {Array} data - Student attendance data
     */
    initDataTable: function(data) {
        const self = this;
        
        // Check if DataTable already exists and destroy it properly
        if ($.fn.DataTable.isDataTable('#attendance-details-table')) {
            $('#attendance-details-table').DataTable().destroy();
        }
        
        // Clear existing table body
        $('#attendance-details-table tbody').empty();
        
        // Prepare data for DataTables
        const tableData = [];
        if (data && data.length > 0) {
            data.forEach(function(student) {
                const statusBadge = self.getStatusBadge(student.attendance_status_text);
                const className = student.class_name + ' ' + student.class_numeric + 
                                (student.section_name ? ' - ' + student.section_name : '');
                
                tableData.push([
                    self.escapeHtml(student.student_code || ''),
                    self.escapeHtml(student.name || ''),
                    self.escapeHtml(className),
                    self.escapeHtml(student.gender || ''),
                    self.escapeHtml(student.residential_status || ''),
                    statusBadge
                ]);
            });
        }
        
        // Initialize DataTable with data option
        this.dataTable = $('#attendance-details-table').DataTable({
            data: tableData,
            responsive: true,
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            dom: '<"row"<"col-sm-6"l><"col-sm-6"f>>' +
                 '<"row"<"col-sm-12"B>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-5"i><"col-sm-7"p>>',
            buttons: [
                {
                    extend: 'copy',
                    className: 'btn btn-sm btn-primary'
                },
                {
                    extend: 'excel',
                    className: 'btn btn-sm btn-success',
                    title: 'Attendance Details - ' + this.currentType
                },
                {
                    extend: 'pdf',
                    className: 'btn btn-sm btn-danger',
                    title: 'Attendance Details - ' + this.currentType
                }
                // Print button temporarily removed due to library loading issue
                // Will be re-enabled once buttons.print.min.js loads correctly
            ],
            columns: [
                { title: "Student Code" },
                { title: "Name" },
                { title: "Class" },
                { title: "Gender" },
                { title: "Residential Status" },
                { title: "Status" }
            ],
            language: {
                search: "Search:",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ students",
                infoEmpty: "No students to show",
                infoFiltered: "(filtered from _MAX_ total students)",
                zeroRecords: "No matching students found",
                emptyTable: "No students available"
            },
            order: [[1, 'asc']] // Sort by name by default
        });
    },
    
    /**
     * Initialize modal event handlers
     */
    initModalHandlers: function() {
        const self = this;
        
        // Filter change handlers
        $('#modal-class-filter, #modal-gender-filter, #modal-residential-filter').on('change', function() {
            self.loadData();
        });
        
        // Search handler with debounce
        let searchTimeout;
        $('#modal-search').on('keyup', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                self.loadData();
            }, 500); // 500ms debounce
        });
        
        // Export Excel button
        $('#modal-export-excel').on('click', function() {
            if (self.dataTable) {
                self.dataTable.button('.buttons-excel').trigger();
            }
        });
        
        // Print button
        $('#modal-print-btn').on('click', function() {
            if (self.dataTable) {
                self.dataTable.button('.buttons-print').trigger();
            }
        });
        
        // Reset filters when modal is closed
        $('#attendanceDetailsModal').on('hidden.bs.modal', function() {
            $('#modal-search').val('');
            $('#modal-class-filter').val('');
            $('#modal-gender-filter').val('');
            $('#modal-residential-filter').val('');
        });
    },
    
    /**
     * Get status badge HTML
     * @param {string} status - Status text
     * @returns {string} HTML badge
     */
    getStatusBadge: function(status) {
        const statusLower = (status || '').toLowerCase();
        
        if (statusLower === 'present') {
            return '<span class="badge badge-present">' + this.escapeHtml(status) + '</span>';
        } else if (statusLower === 'absent') {
            return '<span class="badge badge-absent">' + this.escapeHtml(status) + '</span>';
        } else {
            return '<span class="badge badge-not-marked">' + this.escapeHtml(status) + '</span>';
        }
    },
    
    /**
     * Show error message
     * @param {string} message - Error message
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
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
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

// Initialize when document is ready
$(document).ready(function() {
    // Check if we're on the attendance page
    if (typeof initialTimestamp !== 'undefined') {
        AttendanceDetailsModal.init();
    }
});
