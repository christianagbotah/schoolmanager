/**
 * Modern Attendance Report JavaScript
 * Handles filtering, data loading, charts, and exports
 */

var AttendanceReport = {
    timestamp: null,
    dataTable: null,
    attendanceChart: null,
    classChart: null,
    currentFilters: {
        dateRange: null,
        status: '',
        class: '',
        gender: '',
        residential: '',
        house: '',
        search: ''
    },

    /**
     * Initialize the attendance report
     */
    init: function(timestamp) {
        this.timestamp = timestamp;
        this.initDateRangePicker();
        this.bindEvents();
        this.loadInitialData();
    },

    /**
     * Initialize date range picker
     */
    initDateRangePicker: function() {
        var self = this;
        $('#date-range').daterangepicker({
            startDate: moment.unix(this.timestamp),
            endDate: moment.unix(this.timestamp),
            maxDate: moment(),
            locale: {
                format: 'DD-MM-YYYY'
            },
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            }
        }, function(start, end) {
            self.currentFilters.dateRange = {
                start: start.format('YYYY-MM-DD'),
                end: end.format('YYYY-MM-DD')
            };
        });

        // Set initial date range
        this.currentFilters.dateRange = {
            start: moment.unix(this.timestamp).format('YYYY-MM-DD'),
            end: moment.unix(this.timestamp).format('YYYY-MM-DD')
        };
    },

    /**
     * Bind event handlers
     */
    bindEvents: function() {
        var self = this;

        // Apply filters button
        $('#apply-filters-btn').on('click', function() {
            self.applyFilters();
        });

        // Reset filters button
        $('#reset-filters-btn').on('click', function() {
            self.resetFilters();
        });

        // Refresh button
        $('#refresh-btn').on('click', function() {
            self.loadInitialData();
        });

        // Export buttons
        $('#export-excel-btn').on('click', function() {
            self.exportToExcel();
        });

        $('#export-pdf-btn').on('click', function() {
            self.exportToPDF();
        });

        $('#print-btn').on('click', function() {
            self.printReport();
        });

        // Header search input with debounce (for DataTable filtering)
        var searchTimeout;
        $('#search-student').on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                if (self.dataTable) {
                    self.dataTable.search($('#search-student').val()).draw();
                }
            }, 300);
        });
    },

    /**
     * Load initial data
     */
    loadInitialData: function() {
        this.showLoadingModal();
        this.fetchAttendanceData();
    },

    /**
     * Apply filters and reload data
     */
    applyFilters: function() {
        // Collect filter values
        this.currentFilters.status = $('#filter-status').val();
        this.currentFilters.class = $('#filter-class').val();
        this.currentFilters.gender = $('#filter-gender').val();
        this.currentFilters.residential = $('#filter-residential').val();
        this.currentFilters.house = $('#filter-house').val();
        this.currentFilters.search = $('#search-student').val();

        // Reload data with filters
        this.showLoadingModal();
        this.fetchAttendanceData();
    },

    /**
     * Reset all filters
     */
    resetFilters: function() {
        // Reset filter inputs
        $('#filter-status').val('');
        $('#filter-class').val('');
        $('#filter-gender').val('');
        $('#filter-residential').val('');
        $('#filter-house').val('');
        $('#search-student').val('');

        // Reset date range to initial timestamp
        $('#date-range').data('daterangepicker').setStartDate(moment.unix(this.timestamp));
        $('#date-range').data('daterangepicker').setEndDate(moment.unix(this.timestamp));

        // Reset current filters
        this.currentFilters = {
            dateRange: {
                start: moment.unix(this.timestamp).format('YYYY-MM-DD'),
                end: moment.unix(this.timestamp).format('YYYY-MM-DD')
            },
            status: '',
            class: '',
            gender: '',
            residential: '',
            house: '',
            search: ''
        };

        // Reload data
        this.loadInitialData();
    },

    /**
     * Fetch attendance data from server
     */
    fetchAttendanceData: function() {
        var self = this;

        $.ajax({
            url: baseUrl + '/admin/getAttendanceReportData',
            type: 'POST',
            data: {
                [csrfTokenName]: csrfToken,
                filters: this.currentFilters
            },
            dataType: 'json',
            success: function(response) {
                self.hideLoadingModal();
                if (response.success) {
                    self.updateSummaryCards(response.summary);
                    self.updateCharts(response.chartData);
                    self.renderDataTable(response.students);
                    self.updateTeacherInfo(response.teacherInfo);
                } else {
                    self.showError(response.message || 'Failed to load attendance data');
                }
            },
            error: function(xhr, status, error) {
                self.hideLoadingModal();
                console.error('Error fetching attendance data:', error);
                self.showError('Failed to load attendance data. Please try again.');
            }
        });
    },

    /**
     * Update summary statistics cards
     */
    updateSummaryCards: function(summary) {
        var total = summary.total || 0;
        var present = summary.present || 0;
        var presentRegular = summary.presentRegular || 0;
        var presentLate = summary.presentLate || 0;
        var absent = summary.absent || 0;
        var absentRegular = summary.absentRegular || 0;
        var absentSickHome = summary.absentSickHome || 0;
        var absentSickClinic = summary.absentSickClinic || 0;
        var notMarked = summary.notMarked || 0;

        // Update counts
        $('#present-count').text(present);
        $('#absent-count').text(absent);
        $('#not-marked-count').text(notMarked);
        $('#total-count').text(total);

        // Update present breakdown
        $('#present-regular-count').text(presentRegular);
        $('#present-late-count').text(presentLate);
        
        // Show present breakdown if there are any present students
        if (present > 0) {
            $('#present-breakdown').show();
        } else {
            $('#present-breakdown').hide();
        }

        // Update absent breakdown
        $('#absent-regular-count').text(absentRegular);
        $('#absent-sick-home-count').text(absentSickHome);
        $('#absent-sick-clinic-count').text(absentSickClinic);
        
        // Show absent breakdown if there are any absent students
        if (absent > 0) {
            $('#absent-breakdown').show();
        } else {
            $('#absent-breakdown').hide();
        }

        // Update percentages
        if (total > 0) {
            $('#present-percentage').text(((present / total) * 100).toFixed(1) + '%');
            $('#absent-percentage').text(((absent / total) * 100).toFixed(1) + '%');
            $('#not-marked-percentage').text(((notMarked / total) * 100).toFixed(1) + '%');
        } else {
            $('#present-percentage').text('0%');
            $('#absent-percentage').text('0%');
            $('#not-marked-percentage').text('0%');
        }
    },

    /**
     * Update teacher information display
     */
    updateTeacherInfo: function(teacherInfo) {
        if (teacherInfo && teacherInfo.name) {
            // Show teacher info section
            $('#teacher-info-section').slideDown(300);
            
            // Update teacher details
            $('#teacher-name').text(teacherInfo.name);
            $('#teacher-phone').text(teacherInfo.phone || 'N/A');
        } else {
            // Hide teacher info section if no teacher data
            $('#teacher-info-section').slideUp(300);
        }
    },

    /**
     * Update charts with new data
     */
    updateCharts: function(chartData) {
        this.updateAttendanceChart(chartData.distribution);
        this.updateClassChart(chartData.byClass);
    },

    /**
     * Update attendance distribution pie chart
     */
    updateAttendanceChart: function(data) {
        var ctx = document.getElementById('attendance-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.attendanceChart) {
            this.attendanceChart.destroy();
        }

        // Create new chart
        this.attendanceChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'Not Marked'],
                datasets: [{
                    data: [data.present || 0, data.absent || 0, data.notMarked || 0],
                    backgroundColor: [
                        '#10b981',
                        '#ef4444',
                        '#f59e0b'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                var label = context.label || '';
                                var value = context.parsed || 0;
                                var total = context.dataset.data.reduce((a, b) => a + b, 0);
                                var percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Update class-wise breakdown bar chart
     */
    updateClassChart: function(data) {
        var ctx = document.getElementById('class-chart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.classChart) {
            this.classChart.destroy();
        }

        // Prepare data
        var labels = data.map(function(item) { return item.className; });
        var presentData = data.map(function(item) { return item.present; });
        var absentData = data.map(function(item) { return item.absent; });
        var notMarkedData = data.map(function(item) { return item.notMarked || 0; });

        // Create new chart
        this.classChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Present',
                        data: presentData,
                        backgroundColor: '#10b981',
                        borderRadius: 6
                    },
                    {
                        label: 'Absent',
                        data: absentData,
                        backgroundColor: '#ef4444',
                        borderRadius: 6
                    },
                    {
                        label: 'Not Marked',
                        data: notMarkedData,
                        backgroundColor: '#f59e0b',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 14,
                                weight: '600'
                            }
                        }
                    }
                }
            }
        });
    },

    /**
     * Render DataTable with student records
     */
    renderDataTable: function(students) {
        var self = this;

        // Build table HTML
        var tableHtml = '<table id="attendance-table" class="table table-striped table-bordered" style="width:100%">';
        tableHtml += '<thead>';
        tableHtml += '<tr>';
        tableHtml += '<th>Photo</th>';
        tableHtml += '<th>ID No</th>';
        tableHtml += '<th>Name</th>';
        tableHtml += '<th>Class</th>';
        tableHtml += '<th>Gender</th>';
        tableHtml += '<th>Status</th>';
        tableHtml += '<th>Parent Name</th>';
        tableHtml += '<th>Contact</th>';
        tableHtml += '</tr>';
        tableHtml += '</thead>';
        tableHtml += '<tbody>';

        if (students && students.length > 0) {
            students.forEach(function(student) {
                var statusClass = '';
                var statusText = '';
                
                // Status values: 1=Present, 2=Absent, 3=Late, 4=Sick-Home, 5=Sick-Clinic, 0=Not Marked
                if (student.status == 1 || student.status == 3) {
                    statusClass = 'status-present';
                    statusText = student.status == 1 ? 'Present' : 'Late';
                } else if (student.status == 2) {
                    statusClass = 'status-absent';
                    statusText = 'Absent';
                } else if (student.status == 4) {
                    statusClass = 'status-absent';
                    statusText = 'Sick - Home';
                } else if (student.status == 5) {
                    statusClass = 'status-absent';
                    statusText = 'Sick - Clinic';
                } else {
                    statusClass = 'status-not-marked';
                    statusText = 'Not Marked';
                }

                tableHtml += '<tr>';
                tableHtml += '<td><img src="' + student.photo + '" class="student-photo" alt="' + student.name + '"></td>';
                tableHtml += '<td>' + student.studentCode + '</td>';
                tableHtml += '<td>' + student.name + '</td>';
                tableHtml += '<td>' + student.className + '</td>';
                tableHtml += '<td>' + student.gender + '</td>';
                tableHtml += '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>';
                tableHtml += '<td>' + student.parentName + '</td>';
                tableHtml += '<td>' + student.parentPhone + '</td>';
                tableHtml += '</tr>';
            });
        }

        tableHtml += '</tbody>';
        tableHtml += '</table>';

        // Replace table container content
        $('#table-container').html(tableHtml);

        // Initialize DataTable
        if (this.dataTable) {
            this.dataTable.destroy();
        }

        this.dataTable = $('#attendance-table').DataTable({
            responsive: true,
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
            language: {
                search: "_INPUT_",
                searchPlaceholder: "Search records...",
                lengthMenu: "Show _MENU_ entries",
                info: "Showing _START_ to _END_ of _TOTAL_ records",
                infoEmpty: "No records available",
                infoFiltered: "(filtered from _MAX_ total records)",
                zeroRecords: "No matching records found"
            },
            order: [[2, 'asc']], // Sort by name
            columnDefs: [
                { orderable: false, targets: [0] } // Disable sorting on photo column
            ]
        });

        // Update showing info
        this.updateShowingInfo();
    },

    /**
     * Update showing info text
     */
    updateShowingInfo: function() {
        if (this.dataTable) {
            var info = this.dataTable.page.info();
            $('#showing-info').text('Showing ' + info.recordsDisplay + ' of ' + info.recordsTotal + ' records');
        }
    },

    /**
     * Show loading state
     */
    showLoading: function() {
        $('#table-container').html(
            '<div class="loading-state">' +
            '<i class="fa fa-spinner fa-spin fa-3x"></i>' +
            '<p>Loading attendance data...</p>' +
            '</div>'
        );
    },

    /**
     * Show loading modal
     */
    showLoadingModal: function() {
        $('#loading-modal').addClass('active');
        $('body').addClass('modal-open');
    },

    /**
     * Hide loading modal
     */
    hideLoadingModal: function() {
        $('#loading-modal').removeClass('active');
        $('body').removeClass('modal-open');
    },

    /**
     * Show error message
     */
    showError: function(message) {
        $('#table-container').html(
            '<div class="loading-state">' +
            '<i class="fa fa-exclamation-triangle fa-3x" style="color: #ef4444;"></i>' +
            '<p style="color: #ef4444;">' + message + '</p>' +
            '</div>'
        );
    },

    /**
     * Export to Excel
     */
    exportToExcel: function() {
        if (this.dataTable) {
            // Trigger DataTables Excel export
            var buttons = new $.fn.dataTable.Buttons(this.dataTable, {
                buttons: [{
                    extend: 'excelHtml5',
                    title: 'Student Attendance Report - ' + moment().format('DD-MM-YYYY'),
                    exportOptions: {
                        columns: ':visible'
                    }
                }]
            });
            
            buttons.container().appendTo($('#table-container'));
            $('.buttons-excel').click();
            buttons.container().remove();
        }
    },

    /**
     * Export to PDF
     */
    exportToPDF: function() {
        if (this.dataTable) {
            // Trigger DataTables PDF export
            var buttons = new $.fn.dataTable.Buttons(this.dataTable, {
                buttons: [{
                    extend: 'pdfHtml5',
                    title: 'Student Attendance Report - ' + moment().format('DD-MM-YYYY'),
                    orientation: 'landscape',
                    pageSize: 'A4',
                    exportOptions: {
                        columns: ':visible'
                    }
                }]
            });
            
            buttons.container().appendTo($('#table-container'));
            $('.buttons-pdf').click();
            buttons.container().remove();
        }
    },

    /**
     * Print report
     */
    printReport: function() {
        window.print();
    }
};
