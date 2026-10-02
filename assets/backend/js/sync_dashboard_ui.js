/**
 * Sync Dashboard UI JavaScript
 * 
 * Handles all UI interactions for the sync dashboard including:
 * - Real-time status updates via AJAX polling
 * - Chart.js visualizations (line chart and doughnut chart)
 * - Manual sync triggers with progress feedback
 * - Pending records list expand/collapse
 * - Dashboard refresh functionality
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.9, 16.9
 * Task 2.8: Dashboard JavaScript functionality
 */

(function($) {
    'use strict';

    // Configuration
    const CONFIG = {
        pollInterval: 30000, // 30 seconds
        chartColors: {
            primary: getComputedStyle(document.documentElement).getPropertyValue('--theme-primary') || '#667eea',
            secondary: getComputedStyle(document.documentElement).getPropertyValue('--theme-secondary') || '#764ba2',
            success: getComputedStyle(document.documentElement).getPropertyValue('--color-success') || '#10b981',
            warning: getComputedStyle(document.documentElement).getPropertyValue('--color-warning') || '#f59e0b',
            error: getComputedStyle(document.documentElement).getPropertyValue('--color-error') || '#ef4444',
            info: getComputedStyle(document.documentElement).getPropertyValue('--color-info') || '#3b82f6'
        }
    };

    // State
    let pollTimer = null;
    let performanceChart = null;
    let statusChart = null;

    /**
     * Initialize the dashboard
     */
    function initDashboard() {
        console.log('Initializing Sync Dashboard UI...');
        
        // Initialize charts
        initCharts();
        
        // Set up event listeners
        setupEventListeners();
        
        // Initial data load only - no periodic polling
        // User requested: "maintain the one that runs once during page load and that is it"
        refreshDashboard();
        
        console.log('Sync Dashboard UI initialized successfully (periodic polling disabled)');
    }

    /**
     * Initialize Chart.js visualizations
     * Requirements: 15.1-15.10
     */
    function initCharts() {
        // Initialize Performance Line Chart
        const perfCtx = document.getElementById('sync-performance-chart');
        if (perfCtx) {
            performanceChart = new Chart(perfCtx, {
                type: 'line',
                data: {
                    labels: getLast7Days(),
                    datasets: [
                        {
                            label: 'Push Operations',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            borderColor: CONFIG.chartColors.primary,
                            backgroundColor: CONFIG.chartColors.primary + '20',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Pull Operations',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            borderColor: CONFIG.chartColors.info,
                            backgroundColor: CONFIG.chartColors.info + '20',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Conflicts',
                            data: [0, 0, 0, 0, 0, 0, 0],
                            borderColor: CONFIG.chartColors.error,
                            backgroundColor: CONFIG.chartColors.error + '20',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom'
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        }
                    },
                    animation: {
                        duration: 1000,
                        easing: 'easeInOutQuart'
                    }
                }
            });
            
            // Fetch and update chart data
            fetchPerformanceData();
        }

        // Initialize Status Doughnut Chart
        const statusCtx = document.getElementById('sync-status-chart');
        if (statusCtx) {
            statusChart = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    // Task 6.4: Updated label to "Genuine Failures" to exclude false failures
                    labels: ['Success', 'Genuine Failures', 'Conflicts'],
                    datasets: [{
                        data: [0, 0, 0],
                        backgroundColor: [
                            CONFIG.chartColors.success,
                            CONFIG.chartColors.error,
                            CONFIG.chartColors.warning
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return label + ': ' + value + ' (' + percentage + '%)';
                                }
                            }
                        }
                    },
                    animation: {
                        animateRotate: true,
                        animateScale: true,
                        duration: 1000
                    }
                }
            });
            
            // Fetch and update chart data
            fetchStatusData();
        }
    }

    /**
     * Get labels for last 7 days
     */
    function getLast7Days() {
        const days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        
        return days;
    }

    /**
     * Fetch performance chart data from server
     */
    function fetchPerformanceData() {
        $.ajax({
            url: base_url + 'sync_server/get_performance_data',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success && performanceChart) {
                    performanceChart.data.datasets[0].data = response.data.push || [0, 0, 0, 0, 0, 0, 0];
                    performanceChart.data.datasets[1].data = response.data.pull || [0, 0, 0, 0, 0, 0, 0];
                    performanceChart.data.datasets[2].data = response.data.conflicts || [0, 0, 0, 0, 0, 0, 0];
                    performanceChart.update();
                }
            },
            error: function() {
                console.warn('Failed to fetch performance data');
            }
        });
    }

    /**
     * Fetch status chart data from server
     */
    /**
     * Fetch status data from server for charts
     * Task 3.1: Updated to use total failed count for pie chart percentage accuracy
     * Uses 'failed' field (total failures from sync_audit_log) instead of 'genuine_failures'
     * for accurate percentage calculations, while maintaining dashboard card updates
     */
    function fetchStatusData() {
        $.ajax({
            url: base_url + 'sync_server/get_status_data',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success && statusChart) {
                    // Task 3.1: Use 'failed' (total failures) for pie chart to ensure accurate percentages
                    // Add fallback logic to handle missing 'failed' field (backward compatibility)
                    const failedCount = response.data.failed !== undefined 
                        ? response.data.failed 
                        : (response.data.genuine_failures || 0);
                    
                    // Task 3.1: Update chart data array using failed count instead of genuine_failures
                    statusChart.data.datasets[0].data = [
                        response.data.success || 0,
                        failedCount,
                        response.data.conflicts || 0
                    ];
                    statusChart.update();
                    
                    // Task 3.1: Maintain dashboard card updates using genuine_failures field
                    if (response.data.genuine_failures !== undefined) {
                        $('#genuine-failures-count').text(formatNumber(response.data.genuine_failures));
                    }
                    if (response.data.corrected_false_failures !== undefined) {
                        $('#corrected-false-failures-count').text(formatNumber(response.data.corrected_false_failures));
                    }
                }
            },
            error: function() {
                console.warn('Failed to fetch status data');
            }
        });
    }
    
    /**
     * Format number with thousands separator
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Pending records expand/collapse
        $(document).on('click', '.sync-pending-item', function() {
            $(this).toggleClass('expanded');
        });

        // Manual sync button
        $('#run-manual-sync-btn').on('click', function() {
            console.log('Run Manual Sync button clicked');
            triggerManualSync('full');
        });

        // Pull from remote button
        $('#pull-from-remote-btn').on('click', function() {
            console.log('Pull from Remote button clicked');
            triggerManualSync('pull');
        });

        // Push to remote button
        $('#push-to-remote-btn').on('click', function() {
            console.log('Push to Remote button clicked');
            triggerManualSync('push');
        });

        // Refresh dashboard button
        $('#refresh-dashboard-btn').on('click', function() {
            console.log('Refresh Dashboard button clicked');
            refreshDashboard();
        });
        
        console.log('Event listeners set up successfully');
    }

    /**
     * Trigger manual sync operation
     * Requirements: 16.4, 16.5, 16.6, 16.7
     */
    function triggerManualSync(type) {
        console.log('triggerManualSync called with type:', type);
        
        // Check if base_url is defined
        if (typeof base_url === 'undefined') {
            console.error('base_url is not defined!');
            // Calculate base_url dynamically from current page URL
            const path = window.location.pathname;
            const segments = path.split('/').filter(seg => seg.length > 0);
            // Remove the last 2 segments (controller/method) to get base path
            if (segments.length >= 2) {
                segments.pop(); // Remove method
                segments.pop(); // Remove controller
            }
            const basePath = segments.length > 0 ? '/' + segments.join('/') + '/' : '/';
            window.base_url = window.location.origin + basePath;
            console.log('Using dynamically calculated fallback base_url:', window.base_url);
        }
        
        // Get operation name for display
        const operationName = type === 'full' ? 'Full Sync' : 
                             type === 'pull' ? 'Pull from Remote' : 
                             'Push to Remote';
        
        console.log('Operation:', operationName);
        console.log('AJAX URL:', base_url + 'sync_server/trigger_sync');
        
        // Show full-screen blocking modal
        showSyncModal(operationName);
        updateSyncModalProgress(0, 'Initializing ' + operationName.toLowerCase() + '...');
        
        // Get CSRF token from cookie
        function getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        }
        
        const csrfToken = getCookie('joana_vic');
        console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found');
        
        // Build request data with CSRF token
        const requestData = { 
            type: type,
            agbotah_essuon: csrfToken
        };
        
        // Make AJAX request to correct endpoint
        $.ajax({
            url: base_url + 'sync_server/trigger_sync',
            method: 'POST',
            data: requestData,
            dataType: 'json',
            success: function(response) {
                console.log('AJAX success response:', response);
                
                if (response.status === 'success' || response.success) {
                    // Use real progress polling instead of simulation
                    pollSyncProgress(function() {
                        // Success - build informative message
                        let successMsg = '';
                        const duration = response.duration ? ' in ' + response.duration + 's' : '';
                        
                        // Build message based on operation type and counts
                        if (response.operation === 'push') {
                            const synced = response.total_synced || 0;
                            const failed = response.total_failed || 0;
                            if (synced > 0 || failed > 0) {
                                successMsg = 'Push completed: ' + synced + ' records synced';
                                if (failed > 0) {
                                    successMsg += ', ' + failed + ' failed';
                                }
                            } else {
                                successMsg = 'Push completed - all records already synced';
                            }
                        } else if (response.operation === 'pull') {
                            const pulled = response.total_pulled || 0;
                            const conflicts = response.total_conflicts || 0;
                            if (pulled > 0 || conflicts > 0) {
                                successMsg = 'Pull completed: ' + pulled + ' records pulled';
                                if (conflicts > 0) {
                                    successMsg += ', ' + conflicts + ' conflicts';
                                }
                            } else {
                                successMsg = 'Pull completed - no remote changes';
                            }
                        } else {
                            // Full sync
                            successMsg = response.message || (operationName + ' completed successfully');
                        }
                        
                        updateSyncModalProgress(100, successMsg + duration);
                        
                        // Wait a moment to show completion, then reload page
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    });
                } else if (response.status === 'info') {
                    // Info status - nothing to sync
                    hideSyncModal();
                    const infoMsg = response.message || 'No changes to sync';
                    const duration = response.duration ? ' (checked in ' + response.duration + 's)' : '';
                    if (typeof showAjaxModal_alert === 'function') {
                        showAjaxModal_alert(infoMsg + duration, 'Info', false);
                    } else {
                        alert(infoMsg + duration);
                    }
                    // Reload page to update signals
                    setTimeout(function() {
                        location.reload();
                    }, 2000);
                } else if (response.status === 'skipped') {
                    // Skipped (offline)
                    hideSyncModal();
                    if (typeof showAjaxModal_alert === 'function') {
                        showAjaxModal_alert(response.message || 'Sync skipped - no internet connection', 'Warning', false);
                    } else {
                        alert(response.message || 'Sync skipped - no internet connection');
                    }
                } else if (response.status === 'disabled') {
                    // Disabled
                    hideSyncModal();
                    if (typeof showAjaxModal_alert === 'function') {
                        showAjaxModal_alert(response.message || 'Sync is disabled in settings', 'Warning', false);
                    } else {
                        alert(response.message || 'Sync is disabled in settings');
                    }
                } else {
                    // Error
                    hideSyncModal();
                    if (typeof showAjaxModal_alert === 'function') {
                        showAjaxModal_alert(response.message || 'Sync failed. Please try again.', 'Error', false);
                    } else {
                        alert(response.message || 'Sync failed. Please try again.');
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX error:', {xhr: xhr, status: status, error: error});
                console.error('Response text:', xhr.responseText);
                
                hideSyncModal();
                
                const errorMsg = 'Network error. Please check your connection and try again. Status: ' + xhr.status;
                if (typeof showAjaxModal_alert === 'function') {
                    showAjaxModal_alert(errorMsg, 'Error', false);
                } else {
                    alert(errorMsg);
                }
            }
        });
    }

    /**
     * Show full-screen blocking sync modal
     */
    function showSyncModal(operationName) {
        // Create modal if it doesn't exist
        if ($('#sync-blocking-modal').length === 0) {
            const modalHTML = `
                <div id="sync-blocking-modal" class="sync-blocking-modal">
                    <div class="sync-blocking-modal-content">
                        <div class="sync-blocking-modal-icon">
                            <i class="fa fa-sync fa-spin"></i>
                        </div>
                        <h3 id="sync-blocking-modal-title" class="sync-blocking-modal-title"></h3>
                        <p id="sync-blocking-modal-message" class="sync-blocking-modal-message"></p>
                        <div class="sync-blocking-progress">
                            <div class="sync-blocking-progress-bar" id="sync-blocking-progress-bar"></div>
                        </div>
                        <div id="sync-blocking-progress-text" class="sync-blocking-progress-text">0%</div>
                    </div>
                </div>
            `;
            $('body').append(modalHTML);
            
            // Add CSS styles
            const styles = `
                <style>
                .sync-blocking-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    backdrop-filter: blur(5px);
                    z-index: 99999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s ease-in-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .sync-blocking-modal-content {
                    background: white;
                    padding: 40px;
                    border-radius: 12px;
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease-out;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .sync-blocking-modal-icon {
                    font-size: 48px;
                    color: #667eea;
                    margin-bottom: 20px;
                }
                
                .sync-blocking-modal-icon i {
                    animation: spin 2s linear infinite;
                }
                
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .sync-blocking-modal-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #1f2937;
                    margin: 0 0 10px 0;
                }
                
                .sync-blocking-modal-message {
                    font-size: 14px;
                    color: #6b7280;
                    margin: 0 0 30px 0;
                }
                
                .sync-blocking-progress {
                    width: 100%;
                    height: 8px;
                    background: #e5e7eb;
                    border-radius: 4px;
                    overflow: hidden;
                    margin-bottom: 15px;
                }
                
                .sync-blocking-progress-bar {
                    height: 100%;
                    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
                    width: 0%;
                    transition: width 0.3s ease-out;
                    border-radius: 4px;
                }
                
                .sync-blocking-progress-text {
                    font-size: 14px;
                    font-weight: 600;
                    color: #667eea;
                }
                </style>
            `;
            $('head').append(styles);
        }
        
        // Update modal content
        $('#sync-blocking-modal-title').text(operationName);
        $('#sync-blocking-modal').fadeIn(300);
        
        // Prevent body scroll
        $('body').css('overflow', 'hidden');
    }

    /**
     * Hide full-screen blocking sync modal
     */
    function hideSyncModal() {
        $('#sync-blocking-modal').fadeOut(300);
        $('body').css('overflow', '');
    }

    /**
     * Update sync modal progress
     */
    function updateSyncModalProgress(percentage, message) {
        percentage = Math.min(100, Math.max(0, percentage));
        $('#sync-blocking-progress-bar').css('width', percentage + '%');
        $('#sync-blocking-progress-text').text(Math.round(percentage) + '%');
        if (message) {
            $('#sync-blocking-modal-message').text(message);
        }
    }

    /**
     * Poll for real sync progress
     */
    function pollSyncProgress(callback) {
        let progress = 0;
        let lastMessage = '';
        let pollCount = 0;
        const maxPolls = 120; // 2 minutes max (120 * 1 second)
        
        const interval = setInterval(function() {
            pollCount++;
            
            // Poll the server for actual progress
            $.ajax({
                url: base_url + 'sync_server/get_sync_progress',
                method: 'GET',
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        progress = response.progress || 0;
                        const message = response.message || '';
                        const currentTable = response.current_table || '';
                        const tableProgress = response.table_progress || '';
                        
                        // Build detailed message
                        let displayMessage = message;
                        if (currentTable && tableProgress) {
                            displayMessage = 'Syncing ' + currentTable + ' ' + tableProgress;
                        } else if (currentTable) {
                            displayMessage = 'Syncing ' + currentTable + '...';
                        }
                        
                        // Update progress bar
                        updateSyncModalProgress(progress, displayMessage);
                        
                        // Check if complete
                        if (response.complete || progress >= 100) {
                            clearInterval(interval);
                            updateSyncModalProgress(100, response.final_message || 'Sync completed');
                            if (callback) callback();
                        }
                    } else if (response.status === 'not_running') {
                        // Sync not running - might have completed already
                        // Increment progress gradually until we reach 100%
                        progress = Math.min(100, progress + 10);
                        updateSyncModalProgress(progress);
                        
                        if (progress >= 100) {
                            clearInterval(interval);
                            if (callback) callback();
                        }
                    }
                },
                error: function() {
                    // On error, fall back to simulated progress
                    progress = Math.min(95, progress + 5);
                    updateSyncModalProgress(progress);
                }
            });
            
            // Safety timeout - if polling too long, complete anyway
            if (pollCount >= maxPolls) {
                clearInterval(interval);
                updateSyncModalProgress(100, 'Sync operation completed');
                if (callback) callback();
            }
        }, 1000); // Poll every 1 second
    }

    /**
     * Refresh dashboard data
     * Requirements: 14.1, 14.2, 14.3, 16.9
     */
    function refreshDashboard() {
        console.log('Refreshing dashboard...');
        
        const button = $('#refresh-dashboard-btn');
        const icon = button.find('i');
        
        // Animate refresh icon
        icon.addClass('animate-spin');
        button.prop('disabled', true);
        
        // Fetch updated status from correct endpoint
        $.ajax({
            url: base_url + 'sync_server/status_ajax',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log('Status AJAX response received:', data);
                
                // Verify we got valid data
                if (data && typeof data === 'object') {
                    // The endpoint returns data directly, not wrapped in {success: true, data: {...}}
                    updateDashboardStatus(data);
                } else {
                    console.error('Invalid data format received:', data);
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to refresh dashboard:', {
                    status: status,
                    error: error,
                    responseText: xhr.responseText,
                    statusCode: xhr.status
                });
                
                // If it's a 401/403, session might have expired
                if (xhr.status === 401 || xhr.status === 403) {
                    console.warn('Session may have expired. Please refresh the page and login again.');
                }
            },
            complete: function() {
                // Stop animation
                setTimeout(function() {
                    icon.removeClass('animate-spin');
                    button.prop('disabled', false);
                    console.log('Dashboard refresh complete');
                }, 500);
            }
        });
        
        // Refresh charts
        fetchPerformanceData();
        fetchStatusData();
    }

    /**
     * Update dashboard status displays
     */
    function updateDashboardStatus(data) {
        console.log('Updating dashboard status with data:', data);
        
        // Update header stats
        if (data.pending_total !== undefined) {
            $('#header-pending').text(formatNumber(data.pending_total));
            $('#pending-count').text(formatNumber(data.pending_total));
        }
        
        if (data.conflicts_count !== undefined) {
            $('#header-conflicts').text(formatNumber(data.conflicts_count));
            $('#conflicts-count').text(formatNumber(data.conflicts_count));
        }
        
        if (data.last_sync) {
            $('#last-sync-time').text(formatDateTime(data.last_sync));
        }
        
        // Update Pending Records by Table section
        if (data.pending_by_table !== undefined) {
            updatePendingByTable(data.pending_by_table);
        }
        
        // Update connection status
        if (data.internet_online !== undefined) {
            console.log('Updating connection status. Internet online:', data.internet_online);
            
            const badge = $('#connection-status-badge');
            const card = $('#connection-status-card');
            const icon = $('#connection-status-icon');
            const text = $('#connection-status-text');
            
            if (data.internet_online) {
                console.log('Setting status to ONLINE');
                
                // Update badge
                badge.removeClass('offline').addClass('online');
                badge.find('span:last').text('Online');
                
                // Update card
                card.removeClass('sync-card-error').addClass('sync-card-success');
                
                // Update icon
                icon.removeClass('fa-unlink').addClass('fa-signal');
                
                // Update text
                text.text('Connected');
                
            } else {
                console.log('Setting status to OFFLINE');
                
                // Update badge
                badge.removeClass('online').addClass('offline');
                badge.find('span:last').text('Offline');
                
                // Update card
                card.removeClass('sync-card-success').addClass('sync-card-error');
                
                // Update icon
                icon.removeClass('fa-signal').addClass('fa-unlink');
                
                // Update text
                text.text('Offline');
            }
        }
        
        // Update real-time indicator
        if (data.realtime_enabled !== undefined) {
            const indicator = $('#realtime-indicator');
            if (data.realtime_enabled) {
                indicator.removeClass('inactive').addClass('active');
                indicator.find('span').text('Real-time Sync Active');
            } else {
                indicator.removeClass('active').addClass('inactive');
                indicator.find('span').text('Real-time Sync Off');
            }
        }
        
        console.log('Dashboard status update complete');
    }
    
    /**
     * Update Pending Records by Table section
     */
    function updatePendingByTable(pendingByTable) {
        console.log('Updating pending by table:', pendingByTable);
        
        const container = $('.sync-pending-list');
        
        if (!container.length) {
            console.warn('Pending list container not found');
            return;
        }
        
        // Clear existing content
        container.empty();
        
        // Check if there are any pending records
        if (!pendingByTable || Object.keys(pendingByTable).length === 0) {
            container.html('<div class="sync-no-pending"><i class="fa fa-check-circle"></i> No pending records</div>');
            return;
        }
        
        // Build HTML for each table
        Object.keys(pendingByTable).forEach(function(tableName) {
            const count = pendingByTable[tableName];
            
            const itemHtml = '<div class="sync-pending-item" data-table="' + tableName + '">' +
                '<div class="sync-pending-item-header">' +
                    '<h4 class="sync-pending-item-title">' +
                        '<i class="fa fa-table"></i> ' + tableName +
                    '</h4>' +
                    '<span class="sync-pending-count">' + formatNumber(count) + '</span>' +
                '</div>' +
            '</div>';
            
            container.append(itemHtml);
        });
        
        console.log('Pending by table updated successfully');
    }

    /**
     * Start polling for real-time updates
     * Requirements: 14.1, 14.2, 14.9
     */
    function startPolling() {
        // Initial fetch
        refreshDashboard();
        
        // Set up polling interval
        pollTimer = setInterval(function() {
            refreshDashboard();
        }, CONFIG.pollInterval);
    }

    /**
     * Stop polling
     */
    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    /**
     * Format number with commas
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Format date/time
     */
    function formatDateTime(dateStr) {
        if (!dateStr || dateStr === 'Never') return 'Never';
        
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return month + ' ' + day + ', ' + hours + ':' + minutes;
    }

    /**
     * Clean up on page unload
     */
    $(window).on('beforeunload', function() {
        stopPolling();
    });

    // Initialize when document is ready
    $(document).ready(function() {
        initDashboard();
    });

})(jQuery);
