/**
 * Sync Audit Trail UI JavaScript
 * 
 * Handles UI interactions for the audit trail interface including:
 * - Expand/collapse functionality for audit entries
 * - Filter change handlers with AJAX data fetching
 * - Pagination click handlers
 * - Search functionality with debouncing
 * - Revert operation with confirmation modal
 * - Export to CSV functionality
 * 
 * Requirements: 9.4, 9.6, 9.7, 9.8, 9.9, 19.5
 * Task: 7.6 - Audit trail JavaScript implementation
 */

(function($) {
    'use strict';

    // ========================================================================
    // CONFIGURATION
    // ========================================================================
    
    const CONFIG = {
        baseUrl: typeof base_url !== 'undefined' ? base_url() : '',
        debounceDelay: 300, // milliseconds
        animationDuration: 300, // milliseconds
        endpoints: {
            fetchAudit: 'admin/sync_audit_trail/fetch_audit',
            revertEntry: 'admin/sync_audit_trail/revert_entry',
            exportCsv: 'admin/sync_audit_trail/export_csv'
        }
    };

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    let currentFilters = {
        dateFrom: $('#filter-date-from').val(),
        dateTo: $('#filter-date-to').val(),
        table: '',
        location: '',
        operation: '',
        search: ''
    };
    
    let currentPage = 1;
    let pageSize = parseInt($('#page-size-select').val()) || 50;
    let isLoading = false;
    let searchTimeout = null;

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    $(document).ready(function() {
        initializeEventHandlers();
        initializeExpandCollapse();
        initializeFilters();
        initializePagination();
        initializeSearch();
        initializeRevert();
        initializeExport();
    });

    // ========================================================================
    // EVENT HANDLERS INITIALIZATION
    // ========================================================================
    
    function initializeEventHandlers() {
        // Refresh button
        $('#refresh-audit-btn').on('click', function() {
            refreshAuditTrail();
        });
        
        // Apply filters button
        $('#apply-filters-btn').on('click', function() {
            applyFilters();
        });
        
        // Page size change
        $('#page-size-select').on('change', function() {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            applyFilters();
        });
    }

    // ========================================================================
    // EXPAND/COLLAPSE FUNCTIONALITY
    // ========================================================================
    
    function initializeExpandCollapse() {
        // Expand/collapse entry details
        $(document).on('click', '.expand-entry-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const entryId = $(this).data('entry-id');
            toggleEntryDetails(entryId);
        });
        
        // Click on card header to expand/collapse
        $(document).on('click', '.sync-timeline-card-header', function(e) {
            // Don't expand if clicking on action buttons
            if ($(e.target).closest('.sync-timeline-card-actions').length) {
                return;
            }
            
            const entryId = $(this).closest('.sync-timeline-entry').data('entry-id');
            toggleEntryDetails(entryId);
        });
    }
    
    function toggleEntryDetails(entryId) {
        const $entry = $(`.sync-timeline-entry[data-entry-id="${entryId}"]`);
        const $details = $entry.find('.sync-timeline-card-details');
        const $expandBtn = $entry.find('.expand-entry-btn');
        const $icon = $expandBtn.find('i');
        
        if ($details.is(':visible')) {
            // Collapse
            $details.slideUp(CONFIG.animationDuration, function() {
                $entry.removeClass('expanded');
            });
            $icon.removeClass('fa-chevron-up').addClass('fa-chevron-down');
            $expandBtn.find('span').text('Details');
        } else {
            // Expand
            $details.slideDown(CONFIG.animationDuration, function() {
                $entry.addClass('expanded');
            });
            $icon.removeClass('fa-chevron-down').addClass('fa-chevron-up');
            $expandBtn.find('span').text('Hide');
        }
    }

    // ========================================================================
    // FILTER FUNCTIONALITY
    // ========================================================================
    
    function initializeFilters() {
        // Date range filters
        $('#filter-date-from, #filter-date-to').on('change', function() {
            currentFilters.dateFrom = $('#filter-date-from').val();
            currentFilters.dateTo = $('#filter-date-to').val();
        });
        
        // Table filter
        $('#filter-table').on('change', function() {
            currentFilters.table = $(this).val();
        });
        
        // Location filter
        $('#filter-location').on('change', function() {
            currentFilters.location = $(this).val();
        });
        
        // Operation filter
        $('#filter-operation').on('change', function() {
            currentFilters.operation = $(this).val();
        });
    }
    
    function applyFilters() {
        if (isLoading) {
            return;
        }
        
        currentPage = 1;
        fetchAuditData();
    }

    // ========================================================================
    // SEARCH FUNCTIONALITY WITH DEBOUNCING
    // ========================================================================
    
    function initializeSearch() {
        $('#search-audit').on('input', function() {
            const searchValue = $(this).val();
            
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Set new timeout for debouncing
            searchTimeout = setTimeout(function() {
                currentFilters.search = searchValue;
                currentPage = 1;
                fetchAuditData();
            }, CONFIG.debounceDelay);
        });
    }

    // ========================================================================
    // PAGINATION FUNCTIONALITY
    // ========================================================================
    
    function initializePagination() {
        // Previous page button
        $(document).on('click', '#prev-page-btn', function() {
            if ($(this).hasClass('disabled') || isLoading) {
                return;
            }
            
            const page = parseInt($(this).data('page'));
            if (page > 0) {
                currentPage = page;
                fetchAuditData();
            }
        });
        
        // Next page button
        $(document).on('click', '#next-page-btn', function() {
            if ($(this).hasClass('disabled') || isLoading) {
                return;
            }
            
            const page = parseInt($(this).data('page'));
            currentPage = page;
            fetchAuditData();
        });
        
        // Page number buttons
        $(document).on('click', '.sync-pagination-page', function() {
            if ($(this).hasClass('active') || isLoading) {
                return;
            }
            
            const page = parseInt($(this).data('page'));
            currentPage = page;
            fetchAuditData();
        });
    }

    // ========================================================================
    // REVERT FUNCTIONALITY
    // ========================================================================
    
    function initializeRevert() {
        $(document).on('click', '.revert-entry-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const entryId = $(this).data('entry-id');
            const tableName = $(this).data('table');
            const recordId = $(this).data('record-id');
            
            showRevertConfirmation(entryId, tableName, recordId);
        });
    }
    
    function showRevertConfirmation(entryId, tableName, recordId) {
        const message = `Are you sure you want to revert this operation?<br><br>` +
                       `<strong>Table:</strong> ${tableName}<br>` +
                       `<strong>Record ID:</strong> ${recordId}<br><br>` +
                       `This will restore the data to its previous state.`;
        
        // Use existing modal system
        if (typeof showCustomConfirm === 'function') {
            showCustomConfirm('Are you sure you want to revert this operation?', function() {
                executeRevert(entryId, tableName, recordId);
            });
        } else if (typeof showAjaxModal_alert === 'function') {
            showAjaxModal_alert('Are you sure you want to revert this operation?', 'warning', function() {
                executeRevert(entryId, tableName, recordId);
            });
        } else {
            // Fallback to native confirm
            if (confirm('Are you sure you want to revert this operation?')) {
                executeRevert(entryId, tableName, recordId);
            }
        }
    }
    
    function executeRevert(entryId, tableName, recordId) {
        // Show loading state
        const $btn = $(`.revert-entry-btn[data-entry-id="${entryId}"]`);
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Reverting...');
        
        $.ajax({
            url: CONFIG.baseUrl + CONFIG.endpoints.revertEntry,
            type: 'POST',
            data: {
                entry_id: entryId,
                table_name: tableName,
                record_id: recordId
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Show success message
                    if (typeof showAjaxModal_alert === 'function') {
                        showAjaxModal_alert('Operation reverted successfully!', 'success');
                    } else {
                        alert('Operation reverted successfully!');
                    }
                    
                    // Refresh audit trail
                    refreshAuditTrail();
                } else {
                    // Show error message
                    const errorMsg = response.message || 'Failed to revert operation. Please try again.';
                    if (typeof showAjaxModal_alert === 'function') {
                        showAjaxModal_alert(errorMsg, 'danger');
                    } else {
                        alert(errorMsg);
                    }
                    
                    // Restore button
                    $btn.prop('disabled', false).html(originalHtml);
                }
            },
            error: function(xhr, status, error) {
                console.error('Revert error:', error);
                
                // Show error message
                const errorMsg = 'An error occurred while reverting the operation. Please try again.';
                if (typeof showAjaxModal_alert === 'function') {
                    showAjaxModal_alert(errorMsg, 'danger');
                } else {
                    alert(errorMsg);
                }
                
                // Restore button
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    // ========================================================================
    // EXPORT FUNCTIONALITY
    // ========================================================================
    
    function initializeExport() {
        $('#export-audit-btn').on('click', function() {
            exportToCsv();
        });
    }
    
    function exportToCsv() {
        // Show loading state
        const $btn = $('#export-audit-btn');
        const originalHtml = $btn.html();
        $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Exporting...');
        
        // Build query parameters
        const params = new URLSearchParams({
            date_from: currentFilters.dateFrom,
            date_to: currentFilters.dateTo,
            table: currentFilters.table,
            location: currentFilters.location,
            operation: currentFilters.operation,
            search: currentFilters.search
        });
        
        // Trigger download
        const url = CONFIG.baseUrl + CONFIG.endpoints.exportCsv + '?' + params.toString();
        window.location.href = url;
        
        // Restore button after delay
        setTimeout(function() {
            $btn.prop('disabled', false).html(originalHtml);
        }, 2000);
    }

    // ========================================================================
    // AJAX DATA FETCHING
    // ========================================================================
    
    function fetchAuditData() {
        if (isLoading) {
            return;
        }
        
        isLoading = true;
        showLoadingState();
        
        $.ajax({
            url: CONFIG.baseUrl + CONFIG.endpoints.fetchAudit,
            type: 'GET',
            data: {
                page: currentPage,
                per_page: pageSize,
                date_from: currentFilters.dateFrom,
                date_to: currentFilters.dateTo,
                table: currentFilters.table,
                location: currentFilters.location,
                operation: currentFilters.operation,
                search: currentFilters.search
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    updateAuditTimeline(response.data);
                    updatePagination(response.pagination);
                    updateSummary(response.summary);
                } else {
                    showError(response.message || 'Failed to load audit data.');
                }
            },
            error: function(xhr, status, error) {
                console.error('Fetch audit error:', error);
                showError('An error occurred while loading audit data. Please try again.');
            },
            complete: function() {
                isLoading = false;
                hideLoadingState();
            }
        });
    }
    
    function refreshAuditTrail() {
        // Show refresh animation
        const $icon = $('#refresh-audit-btn i');
        $icon.addClass('fa-spin');
        
        fetchAuditData();
        
        // Remove spin after animation
        setTimeout(function() {
            $icon.removeClass('fa-spin');
        }, 1000);
    }

    // ========================================================================
    // UI UPDATE FUNCTIONS
    // ========================================================================
    
    function updateAuditTimeline(html) {
        $('#audit-timeline').html(html);
        
        // Scroll to top of timeline
        $('html, body').animate({
            scrollTop: $('#audit-timeline').offset().top - 100
        }, 300);
    }
    
    function updatePagination(paginationData) {
        // Update pagination info
        $('.sync-pagination-info').html(
            `Showing ${paginationData.from} to ${paginationData.to} of ${paginationData.total.toLocaleString()} entries`
        );
        
        // Update page buttons
        const $paginationPages = $('.sync-pagination-pages');
        $paginationPages.empty();
        
        const currentPage = paginationData.current_page;
        const totalPages = paginationData.total_pages;
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);
        
        // First page
        if (startPage > 1) {
            $paginationPages.append(`<button class="sync-pagination-page" data-page="1">1</button>`);
            if (startPage > 2) {
                $paginationPages.append('<span class="sync-pagination-ellipsis">...</span>');
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === currentPage ? 'active' : '';
            $paginationPages.append(`<button class="sync-pagination-page ${activeClass}" data-page="${i}">${i}</button>`);
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                $paginationPages.append('<span class="sync-pagination-ellipsis">...</span>');
            }
            $paginationPages.append(`<button class="sync-pagination-page" data-page="${totalPages}">${totalPages}</button>`);
        }
        
        // Update prev/next buttons
        $('#prev-page-btn')
            .prop('disabled', currentPage <= 1)
            .toggleClass('disabled', currentPage <= 1)
            .data('page', currentPage - 1);
        
        $('#next-page-btn')
            .prop('disabled', currentPage >= totalPages)
            .toggleClass('disabled', currentPage >= totalPages)
            .data('page', currentPage + 1);
    }
    
    function updateSummary(summaryData) {
        $('#total-entries-count').text(summaryData.total_entries.toLocaleString());
    }
    
    function showLoadingState() {
        // Add loading overlay to timeline
        if ($('#audit-timeline-loading').length === 0) {
            $('#audit-timeline').append(
                '<div id="audit-timeline-loading" class="sync-loading-overlay">' +
                '<div class="sync-loading-spinner">' +
                '<i class="fa fa-spinner fa-spin fa-3x"></i>' +
                '<p>Loading audit data...</p>' +
                '</div>' +
                '</div>'
            );
        }
    }
    
    function hideLoadingState() {
        $('#audit-timeline-loading').remove();
    }
    
    function showError(message) {
        const errorHtml = `
            <div class="sync-empty-state">
                <div class="sync-empty-icon sync-error-icon">
                    <i class="fa fa-exclamation-triangle"></i>
                </div>
                <h3>Error Loading Data</h3>
                <p>${message}</p>
                <button class="sync-btn sync-btn-primary" onclick="location.reload()">
                    <i class="fa fa-sync-alt"></i> Reload Page
                </button>
            </div>
        `;
        $('#audit-timeline').html(errorHtml);
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    /**
     * Get base URL for AJAX requests
     * Supports both CodeIgniter base_url() function and fallback
     */
    function getBaseUrl() {
        if (typeof base_url === 'function') {
            return base_url();
        }
        // Fallback: construct from current location
        const path = window.location.pathname;
        const parts = path.split('/');
        return window.location.origin + '/' + (parts[1] || '') + '/';
    }

})(jQuery);
