/**
 * Sync Dashboard JavaScript
 * Handles real-time updates, manual sync triggering, error display, and retry functionality
 * 
 * Task 3.11: Error states and real-time progress polling
 * Task 3.12: Error log toggle and retry functionality
 */

let syncInProgress = false;
let autoRefreshInterval = null;
let progressPollInterval = null;

// Initialize on page load
$(document).ready(function() {
    console.log('[Sync Dashboard] Initialized');
    
    // Note: Status updates are handled by sync_dashboard_ui.js via AJAX polling
    // updateOnlineStatus() is called there
    // startAutoRefresh() is called there  
    // refreshStatus() is called there
    // No need to duplicate here to avoid conflicts
    
    // Listen to online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Task 3.12: Error alert dismiss button
    $('#dismiss-error-alert').on('click', function() {
        $('#sync-error-alert').fadeOut();
    });
    
    // Task 3.12: View error log button
    $('#view-error-log-btn').on('click', function(e) {
        e.preventDefault();
        toggleErrorLog();
    });
    
    // Task 3.12: View failed records button
    $('#view-failed-records-btn').on('click', function(e) {
        e.preventDefault();
        toggleFailedRecords();
    });
    
    // Task 3.12: Close error log button
    $('#close-error-log-btn').on('click', function() {
        $('#error-log-section').slideUp();
    });
    
    // Task 3.12: Close failed records button
    $('#close-failed-records-btn').on('click', function() {
        $('#failed-records-section').slideUp();
    });
    
    // Task 3.12: Error type filter change
    $('#error-type-filter').on('change', function() {
        loadErrorLog();
    });
    
    // Task 3.12: Failed records filters change
    $('#failed-table-filter, #failed-error-type-filter').on('change', function() {
        loadFailedRecords();
    });
    
    // Task 3.12: Retry failed records button
    $('#retry-all-failed-btn').on('click', function() {
        retrySelectedFailedRecords();
    });
    
    // Task 6.3: Retry All Failed Records button
    $('#retry-all-failed-records-btn').on('click', function() {
        retryAllFailedRecords();
    });
    
    // Task 3.12: Download error log button
    $('#download-error-log-btn').on('click', function() {
        downloadErrorLog();
    });
});

/**
 * Task 3.12: Toggle error log section
 */
function toggleErrorLog() {
    const section = $('#error-log-section');
    if (section.is(':visible')) {
        section.slideUp();
    } else {
        section.slideDown();
        loadErrorLog();
    }
}

/**
 * Task 3.12: Toggle failed records section
 */
function toggleFailedRecords() {
    const section = $('#failed-records-section');
    if (section.is(':visible')) {
        section.slideUp();
    } else {
        section.slideDown();
        loadFailedRecords();
    }
}

/**
 * Task 6.1: Load failed records via AJAX
 */
let failedRecordsCurrentPage = 1;
const failedRecordsPerPage = 50;

function loadFailedRecords(page = 1) {
    failedRecordsCurrentPage = page;
    const tableFilter = $('#failed-table-filter').val() || 'all';
    const errorTypeFilter = $('#failed-error-type-filter').val() || 'all';
    const offset = (page - 1) * failedRecordsPerPage;
    
    // Show loading state
    $('#failed-records-tbody').html(`
        <tr>
            <td colspan="8" style="text-align: center; padding: var(--spacing-2xl); color: var(--color-gray-500);">
                <i class="fa fa-spinner fa-spin" style="font-size: 24px;"></i>
                <p>Loading failed records...</p>
            </td>
        </tr>
    `);
    
    // AJAX call to load failed records
    $.ajax({
        url: base_url + 'sync_server/get_failed_records',
        type: 'GET',
        data: {
            limit: failedRecordsPerPage,
            offset: offset,
            table: tableFilter !== 'all' ? tableFilter : null,
            error_type: errorTypeFilter !== 'all' ? errorTypeFilter : null
        },
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                renderFailedRecordsTable(response.data);
                updateFailedRecordsPagination(response.pagination);
                updateFailedRecordsSummary(response.summary);
                populateFailedTableFilter(response.tables);
            } else {
                $('#failed-records-tbody').html(`
                    <tr>
                        <td colspan="8" style="text-align: center; padding: var(--spacing-2xl); color: var(--color-error);">
                            <i class="fa fa-exclamation-circle" style="font-size: 24px;"></i>
                            <p>${response.message || 'Failed to load records'}</p>
                        </td>
                    </tr>
                `);
            }
        },
        error: function(xhr, status, error) {
            console.error('Failed to load failed records:', error);
            $('#failed-records-tbody').html(`
                <tr>
                    <td colspan="8" style="text-align: center; padding: var(--spacing-2xl); color: var(--color-error);">
                        <i class="fa fa-exclamation-circle" style="font-size: 24px;"></i>
                        <p>Error loading failed records. Please try again.</p>
                    </td>
                </tr>
            `);
        }
    });
}

/**
 * Task 6.1: Render failed records table
 */
function renderFailedRecordsTable(records) {
    if (!records || records.length === 0) {
        $('#failed-records-tbody').html(`
            <tr>
                <td colspan="8" style="text-align: center; padding: var(--spacing-3xl); color: var(--color-gray-500);">
                    <i class="fa fa-check-circle" style="font-size: 48px; color: var(--color-success); margin-bottom: var(--spacing-lg);"></i>
                    <h3 style="color: var(--color-gray-600);">No Failed Records</h3>
                    <p>All sync operations are successful!</p>
                </td>
            </tr>
        `);
        return;
    }
    
    let html = '';
    records.forEach(function(record) {
        // Format error type
        const errorType = record.error_type || 'unknown';
        const errorTypeBadge = getErrorTypeBadge(errorType);
        
        // Format verification status
        const verificationStatus = record.verification_status || 'not_verified';
        const verificationBadge = getVerificationStatusBadge(verificationStatus);
        
        // Format timestamp
        const failedAt = record.failed_at ? formatTimestamp(record.failed_at) : 'Unknown';
        
        // Truncate error message
        const errorMessage = record.error_message || 'No error message';
        const truncatedMessage = errorMessage.length > 100 
            ? errorMessage.substring(0, 100) + '...' 
            : errorMessage;
        
        html += `
            <tr data-record-id="${record.record_id}" data-table="${record.table_name}">
                <td><strong>${record.table_name}</strong></td>
                <td>${record.record_id}</td>
                <td>${errorTypeBadge}</td>
                <td title="${escapeHtml(errorMessage)}">
                    <span style="font-size: var(--font-size-sm);">${escapeHtml(truncatedMessage)}</span>
                </td>
                <td>${verificationBadge}</td>
                <td style="text-align: center;">
                    <span class="badge badge-secondary">${record.retry_count || 0}</span>
                </td>
                <td style="font-size: var(--font-size-sm);">${failedAt}</td>
                <td>
                    <button class="sync-btn sync-btn-primary sync-btn-sm retry-failed-record-btn" 
                            data-record-id="${record.record_id}" 
                            data-table="${record.table_name}"
                            title="Retry this record">
                        <i class="fa fa-redo"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    $('#failed-records-tbody').html(html);
}

/**
 * Task 6.1: Update pagination controls
 */
function updateFailedRecordsPagination(pagination) {
    const { total, limit, offset, current_page, total_pages } = pagination;
    
    $('#failed-total-records').text(total);
    $('#failed-showing-from').text(total > 0 ? offset + 1 : 0);
    $('#failed-showing-to').text(Math.min(offset + limit, total));
    $('#failed-current-page').text(current_page);
    $('#failed-total-pages').text(total_pages);
    
    // Enable/disable pagination buttons
    $('#failed-prev-page').prop('disabled', current_page <= 1);
    $('#failed-next-page').prop('disabled', current_page >= total_pages);
}

/**
 * Task 6.1: Update failed records summary
 */
function updateFailedRecordsSummary(summary) {
    if (!summary) return;
    
    $('#total-failed-count').text(summary.total || 0);
    $('#foreign-key-count').text(summary.foreign_key || 0);
    $('#duplicate-count').text(summary.duplicate || 0);
    $('#constraint-count').text(summary.constraint || 0);
}

/**
 * Task 6.1: Populate table filter dropdown
 */
function populateFailedTableFilter(tables) {
    if (!tables || tables.length === 0) return;
    
    const currentValue = $('#failed-table-filter').val();
    let html = '<option value="all">All Tables</option>';
    
    tables.forEach(function(table) {
        html += `<option value="${table}">${table}</option>`;
    });
    
    $('#failed-table-filter').html(html);
    $('#failed-table-filter').val(currentValue);
}

/**
 * Helper: Get error type badge HTML
 */
function getErrorTypeBadge(errorType) {
    const badges = {
        'remote_failure': '<span class="badge badge-danger">Remote Failure</span>',
        'local_status_failure': '<span class="badge badge-warning">Local Status</span>',
        'genuine_failure': '<span class="badge badge-danger">Genuine Failure</span>',
        'verification_error': '<span class="badge badge-warning">Verification Error</span>',
        'foreign_key': '<span class="badge badge-danger">Foreign Key</span>',
        'duplicate': '<span class="badge badge-warning">Duplicate</span>',
        'constraint': '<span class="badge badge-danger">Constraint</span>',
        'unknown': '<span class="badge badge-secondary">Unknown</span>'
    };
    
    return badges[errorType] || badges['unknown'];
}

/**
 * Helper: Get verification status badge HTML
 */
function getVerificationStatusBadge(status) {
    const badges = {
        'not_verified': '<span class="badge badge-secondary">Not Verified</span>',
        'verified_exists': '<span class="badge badge-success">Exists on Remote</span>',
        'verified_not_exists': '<span class="badge badge-danger">Not on Remote</span>',
        'verification_failed': '<span class="badge badge-warning">Verification Failed</span>'
    };
    
    return badges[status] || badges['not_verified'];
}

/**
 * Helper: Format timestamp
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    return `${month} ${day}, ${year} ${time}`;
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

/**
 * Task 6.1: Pagination button handlers
 */
$(document).on('click', '#failed-prev-page', function() {
    if (failedRecordsCurrentPage > 1) {
        loadFailedRecords(failedRecordsCurrentPage - 1);
    }
});

$(document).on('click', '#failed-next-page', function() {
    const totalPages = parseInt($('#failed-total-pages').text());
    if (failedRecordsCurrentPage < totalPages) {
        loadFailedRecords(failedRecordsCurrentPage + 1);
    }
});

/**
 * Task 6.2: Individual retry button click handler
 */
$(document).on('click', '.retry-failed-record-btn', function() {
    const $button = $(this);
    const recordId = $button.data('record-id');
    const tableName = $button.data('table');
    const $row = $button.closest('tr');
    
    // Disable button and show loading state
    $button.prop('disabled', true);
    const originalHtml = $button.html();
    $button.html('<i class="fa fa-spinner fa-spin"></i>');
    
    // Show toastr notification
    toastr.info('Retrying sync operation...', 'Processing');
    
    // Call retry endpoint via AJAX
    $.ajax({
        url: base_url + 'sync_server/retry_single_failed_record',
        type: 'POST',
        data: {
            table: tableName,
            record_id: recordId
        },
        dataType: 'json',
        success: function(response) {
            if (response.status === 'success') {
                // Show success notification
                toastr.success(response.message || 'Record synced successfully!', 'Success');
                
                // Update row visual state - change to green
                $row.removeClass('sync-status-failed');
                $row.addClass('sync-status-synced');
                $row.css('background-color', 'rgba(34, 197, 94, 0.1)');
                
                // Update sync_status display in the row (if there's a status column)
                const $statusCell = $row.find('td:first');
                $statusCell.html('<span class="badge badge-success">SYNCED</span>');
                
                // Optionally fade out and remove the row after a delay
                setTimeout(function() {
                    $row.fadeOut(400, function() {
                        $(this).remove();
                        
                        // Check if table is now empty
                        if ($('#failed-records-tbody tr').length === 0) {
                            loadFailedRecords(); // Reload to show "no failed records" message
                        }
                    });
                }, 1500);
                
            } else {
                // Show error notification
                toastr.error(response.message || 'Failed to retry sync operation', 'Error');
                
                // Re-enable button
                $button.prop('disabled', false);
                $button.html(originalHtml);
            }
        },
        error: function(xhr, status, error) {
            console.error('Retry failed:', error);
            
            // Show error notification
            toastr.error('Network error while retrying. Please try again.', 'Error');
            
            // Re-enable button
            $button.prop('disabled', false);
            $button.html(originalHtml);
        }
    });
});

/**
 * Task 6.3: Retry All Failed Records functionality
 * Shows confirmation dialog, executes bulk retry with progress bar, displays summary statistics
 */
function retryAllFailedRecords() {
    // Get current table filter (if filtering by specific table)
    const tableFilter = $('#failed-table-filter').val() || 'all';
    const totalFailed = parseInt($('#total-failed-count').text()) || 0;
    
    if (totalFailed === 0) {
        toastr.warning('No failed records to retry.', 'No Records');
        return;
    }
    
    // Confirmation dialog
    const tableText = tableFilter !== 'all' ? ` in table "${tableFilter}"` : '';
    const confirmMessage = `Are you sure you want to retry all ${totalFailed} failed record${totalFailed > 1 ? 's' : ''}${tableText}?\n\nThis will attempt to re-sync all failed records. Records that succeed will be removed from the failed list.`;
    
    showCustomConfirm(confirmMessage, function() {
    
    // Disable retry button and show loading state
    const $button = $('#retry-all-failed-records-btn');
    $button.prop('disabled', true);
    const originalButtonHtml = $button.html();
    $button.html('<i class="fa fa-spinner fa-spin"></i> Retrying...');
    
    // Show progress bar container
    showBulkRetryProgress();
    
    // Show initial toastr notification
    toastr.info('Starting bulk retry operation...', 'Processing', { timeOut: 3000 });
    
    // Call retry_all_failed_records endpoint via AJAX
    $.ajax({
        url: base_url + 'sync_server/retry_all_failed_records',
        type: 'POST',
        data: {
            table: tableFilter !== 'all' ? tableFilter : null
        },
        dataType: 'json',
        timeout: 300000, // 5 minute timeout for bulk operations
        success: function(response) {
            // Hide progress bar
            hideBulkRetryProgress();
            
            // Re-enable button
            $button.prop('disabled', false);
            $button.html(originalButtonHtml);
            
            if (response.status === 'success') {
                const stats = response.statistics || {};
                const totalRetried = stats.total_retried || 0;
                const succeeded = stats.succeeded || 0;
                const stillFailed = stats.still_failed || 0;
                
                // Show summary statistics in modal/alert
                showBulkRetrySummary(totalRetried, succeeded, stillFailed);
                
                // Show success toastr
                toastr.success(`Bulk retry completed. ${succeeded} of ${totalRetried} records synced successfully.`, 'Success', { timeOut: 5000 });
                
                // Refresh failed records table to show updated list
                loadFailedRecords(1);
                
                // Refresh dashboard status to update metrics
                refreshStatus();
                
            } else {
                // Show error notification
                toastr.error(response.message || 'Bulk retry operation failed', 'Error');
            }
        },
        error: function(xhr, status, error) {
            console.error('Bulk retry failed:', error);
            
            // Hide progress bar
            hideBulkRetryProgress();
            
            // Re-enable button
            $button.prop('disabled', false);
            $button.html(originalButtonHtml);
            
            // Show error notification
            const errorMessage = status === 'timeout' 
                ? 'Bulk retry operation timed out. Some records may have been retried. Please refresh the page.'
                : 'Network error during bulk retry. Please try again.';
            
            toastr.error(errorMessage, 'Error');
        }
    });
    }); // Close showCustomConfirm callback
}

/**
 * Task 6.3: Show bulk retry progress bar
 */
function showBulkRetryProgress() {
    // Check if progress container exists, if not create it
    if ($('#bulk-retry-progress-container').length === 0) {
        const progressHtml = `
            <div id="bulk-retry-progress-container" style="margin-top: var(--spacing-xl); padding: var(--spacing-xl); background: var(--color-gray-50); border-radius: var(--radius-md); border-left: 4px solid var(--color-info);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-sm);">
                    <span id="bulk-retry-progress-text" style="font-size: var(--font-size-sm); color: var(--color-gray-700); font-weight: var(--font-weight-medium);">
                        <i class="fa fa-sync-alt fa-spin"></i> Retrying failed records...
                    </span>
                    <span id="bulk-retry-progress-percentage" style="font-size: var(--font-size-sm); color: var(--color-gray-700); font-weight: var(--font-weight-bold);">
                        Processing...
                    </span>
                </div>
                <div style="background: white; border-radius: var(--radius-md); height: 24px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);">
                    <div id="bulk-retry-progress-bar" style="height: 100%; background: linear-gradient(90deg, var(--color-info), var(--color-success)); transition: width 0.3s ease; width: 0%; display: flex; align-items: center; justify-content: center;">
                        <span style="color: white; font-size: var(--font-size-xs); font-weight: var(--font-weight-bold);"></span>
                    </div>
                </div>
                <div style="margin-top: var(--spacing-sm); font-size: var(--font-size-xs); color: var(--color-gray-600);">
                    <i class="fa fa-info-circle"></i> This may take several minutes for large datasets. Please wait...
                </div>
            </div>
        `;
        
        // Insert after the failed records summary
        $('#failed-records-summary').after(progressHtml);
    }
    
    // Show and animate progress bar
    $('#bulk-retry-progress-container').slideDown();
    
    // Simulate progress animation (since we don't have real-time progress from server)
    animateBulkRetryProgress();
}

/**
 * Task 6.3: Hide bulk retry progress bar
 */
function hideBulkRetryProgress() {
    $('#bulk-retry-progress-container').slideUp(function() {
        // Reset progress bar
        $('#bulk-retry-progress-bar').css('width', '0%');
        $('#bulk-retry-progress-percentage').text('Processing...');
    });
}

/**
 * Task 6.3: Animate bulk retry progress bar (simulated progress)
 */
let bulkRetryProgressInterval = null;
function animateBulkRetryProgress() {
    // Clear any existing interval
    if (bulkRetryProgressInterval) {
        clearInterval(bulkRetryProgressInterval);
    }
    
    let progress = 0;
    const increment = 1; // Increment by 1% every 500ms
    
    bulkRetryProgressInterval = setInterval(function() {
        if (progress < 90) { // Stop at 90% until actual completion
            progress += increment;
            $('#bulk-retry-progress-bar').css('width', progress + '%');
            $('#bulk-retry-progress-percentage').text(progress + '%');
        }
    }, 500);
}

/**
 * Task 6.3: Show bulk retry summary modal/alert
 */
function showBulkRetrySummary(totalRetried, succeeded, stillFailed) {
    // Clear progress animation
    if (bulkRetryProgressInterval) {
        clearInterval(bulkRetryProgressInterval);
    }
    
    // Set progress to 100%
    $('#bulk-retry-progress-bar').css('width', '100%');
    $('#bulk-retry-progress-percentage').text('100%');
    
    // Create summary HTML
    const successRate = totalRetried > 0 ? Math.round((succeeded / totalRetried) * 100) : 0;
    const summaryHtml = `
        <div id="bulk-retry-summary-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
            <div style="background: white; border-radius: var(--radius-xl); padding: var(--spacing-3xl); max-width: 500px; width: 90%; box-shadow: var(--shadow-2xl);">
                <div style="text-align: center; margin-bottom: var(--spacing-2xl);">
                    <div style="width: 80px; height: 80px; margin: 0 auto var(--spacing-lg); border-radius: 50%; background: linear-gradient(135deg, var(--color-success), var(--color-info)); display: flex; align-items: center; justify-content: center;">
                        <i class="fa fa-check" style="font-size: 40px; color: white;"></i>
                    </div>
                    <h2 style="margin: 0 0 var(--spacing-sm) 0; color: var(--color-gray-900);">Bulk Retry Complete</h2>
                    <p style="margin: 0; color: var(--color-gray-600);">Summary of retry operation</p>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-lg); margin-bottom: var(--spacing-2xl);">
                    <div style="text-align: center; padding: var(--spacing-lg); background: var(--color-gray-50); border-radius: var(--radius-md);">
                        <div style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-info);">${totalRetried}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--color-gray-600); margin-top: var(--spacing-xs);">Total Retried</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); background: rgba(34, 197, 94, 0.1); border-radius: var(--radius-md);">
                        <div style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-success);">${succeeded}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--color-gray-600); margin-top: var(--spacing-xs);">Succeeded</div>
                    </div>
                    <div style="text-align: center; padding: var(--spacing-lg); background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md);">
                        <div style="font-size: var(--font-size-3xl); font-weight: var(--font-weight-bold); color: var(--color-error);">${stillFailed}</div>
                        <div style="font-size: var(--font-size-xs); color: var(--color-gray-600); margin-top: var(--spacing-xs);">Still Failed</div>
                    </div>
                </div>
                
                <div style="padding: var(--spacing-lg); background: var(--color-info-light); border-radius: var(--radius-md); margin-bottom: var(--spacing-2xl); text-align: center;">
                    <div style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-info);">${successRate}%</div>
                    <div style="font-size: var(--font-size-xs); color: var(--color-gray-700);">Success Rate</div>
                </div>
                
                <button class="sync-btn sync-btn-primary" style="width: 100%;" onclick="closeBulkRetrySummary()">
                    <i class="fa fa-check"></i> Close
                </button>
            </div>
        </div>
    `;
    
    // Append to body
    $('body').append(summaryHtml);
    
    // Add click outside to close
    $('#bulk-retry-summary-modal').on('click', function(e) {
        if (e.target === this) {
            closeBulkRetrySummary();
        }
    });
}

/**
 * Task 6.3: Close bulk retry summary modal
 */
function closeBulkRetrySummary() {
    $('#bulk-retry-summary-modal').fadeOut(function() {
        $(this).remove();
    });
}

/**
 * Helper functions that may be needed
 */
function refreshStatus() {
    // Use the AJAX refresh from sync_dashboard_ui.js if available
    // Don't reload the entire page - it causes loops
    console.log('[refreshStatus] Skipping refresh - handled by sync_dashboard_ui.js polling');
    // The sync_dashboard_ui.js already handles dashboard updates via AJAX polling
    // No need to do anything here
}

function startAutoRefresh() {
    // Auto-refresh functionality is handled by sync_dashboard_ui.js
    // No action needed here
    console.log('[startAutoRefresh] Auto-refresh handled by sync_dashboard_ui.js');
}

function updateOnlineStatus() {
    // Online/offline status updates are handled by sync_dashboard_ui.js
    // No action needed here
    console.log('[updateOnlineStatus] Status updates handled by sync_dashboard_ui.js');
}
