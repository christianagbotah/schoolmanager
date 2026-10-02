/**
 * Sync Conflicts UI JavaScript
 * 
 * Handles UI interactions for the conflict resolution interface including:
 * - Expand/collapse conflict cards
 * - Bulk selection and resolution
 * - Filter and search functionality
 * - Resolution actions (Keep Local, Keep Remote, Merge, Ignore)
 * - Pagination
 * 
 * Requirements: 8.6, 8.7, 8.8, 4.9, 4.10, 14.4, 14.5
 * Task: 5.1 - Conflict resolution layout JavaScript
 */

(function($) {
    'use strict';

    // ========================================================================
    // STATE MANAGEMENT
    // ========================================================================
    
    let selectedConflicts = new Set();
    let currentPage = 1;
    let pageSize = 25;
    let totalConflicts = 0;
    let filteredConflicts = [];

    // ========================================================================
    // INITIALIZATION
    // ========================================================================
    
    $(document).ready(function() {
        initializeEventHandlers();
        initializeFilters();
        initializePagination();
        updateBulkActionsVisibility();
        applySyntaxHighlighting();
    });

    // ========================================================================
    // EVENT HANDLERS
    // ========================================================================
    
    function initializeEventHandlers() {
        // Expand/collapse conflict cards
        $(document).on('click', '.sync-expand-btn', function(e) {
            e.stopPropagation();
            const conflictId = $(this).data('conflict-id');
            toggleConflictCard(conflictId);
        });

        // Click on card header to expand/collapse
        $(document).on('click', '.sync-conflict-card-header', function(e) {
            // Don't expand if clicking checkbox or action buttons
            if ($(e.target).is('input[type="checkbox"]') || $(e.target).closest('.sync-expand-btn').length) {
                return;
            }
            const conflictId = $(this).closest('.sync-conflict-card').data('conflict-id');
            toggleConflictCard(conflictId);
        });

        // Checkbox selection
        $(document).on('change', '.conflict-checkbox', function() {
            const conflictId = parseInt($(this).val());
            if ($(this).is(':checked')) {
                selectedConflicts.add(conflictId);
            } else {
                selectedConflicts.delete(conflictId);
            }
            updateBulkActionsVisibility();
            updateSelectedCount();
        });

        // Select all button
        $('#select-all-btn').on('click', function() {
            $('.conflict-checkbox:visible').prop('checked', true).trigger('change');
        });

        // Deselect all button
        $('#deselect-all-btn').on('click', function() {
            $('.conflict-checkbox').prop('checked', false).trigger('change');
        });

        // Bulk resolve dropdown toggle
        $('#resolve-selected-btn').on('click', function(e) {
            e.stopPropagation();
            $('#bulk-resolve-menu').toggleClass('active');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('.sync-bulk-resolve-dropdown').length) {
                $('#bulk-resolve-menu').removeClass('active');
            }
        });

        // Bulk resolve options
        $(document).on('click', '.sync-bulk-resolve-option', function() {
            const strategy = $(this).data('strategy');
            bulkResolveConflicts(strategy);
            $('#bulk-resolve-menu').removeClass('active');
        });

        // Refresh button
        $('#refresh-conflicts-btn').on('click', function() {
            refreshConflicts();
        });

        // Pagination buttons
        $('#prev-page-btn').on('click', function() {
            if (currentPage > 1) {
                currentPage--;
                loadPage(currentPage);
            }
        });

        $('#next-page-btn').on('click', function() {
            const totalPages = Math.ceil(totalConflicts / pageSize);
            if (currentPage < totalPages) {
                currentPage++;
                loadPage(currentPage);
            }
        });
    }

    // ========================================================================
    // FILTER AND SEARCH
    // ========================================================================
    
    function initializeFilters() {
        // Table filter
        $('#filter-table').on('change', function() {
            applyFilters();
        });

        // Status filter
        $('#filter-status').on('change', function() {
            applyFilters();
        });

        // Search input with debouncing
        let searchTimeout;
        $('#search-conflicts').on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function() {
                applyFilters();
            }, 300);
        });
    }

    function applyFilters() {
        const tableFilter = $('#filter-table').val().toLowerCase();
        const statusFilter = $('#filter-status').val().toLowerCase();
        const searchQuery = $('#search-conflicts').val().toLowerCase();

        $('.sync-conflict-card').each(function() {
            const $card = $(this);
            const table = $card.data('table').toLowerCase();
            const status = $card.data('status').toLowerCase();
            const cardText = $card.text().toLowerCase();

            let visible = true;

            // Apply table filter
            if (tableFilter && table !== tableFilter) {
                visible = false;
            }

            // Apply status filter
            if (statusFilter && status !== statusFilter) {
                visible = false;
            }

            // Apply search filter
            if (searchQuery && !cardText.includes(searchQuery)) {
                visible = false;
            }

            $card.toggle(visible);
        });

        // Update counts
        updateVisibleCounts();
    }

    function updateVisibleCounts() {
        const visibleCount = $('.sync-conflict-card:visible').length;
        $('#showing-to').text(Math.min(visibleCount, pageSize));
        $('#showing-from').text(visibleCount > 0 ? 1 : 0);
    }

    // ========================================================================
    // CONFLICT CARD EXPANSION
    // ========================================================================
    
    function toggleConflictCard(conflictId) {
        const $card = $(`.sync-conflict-card[data-conflict-id="${conflictId}"]`);
        const $body = $card.find('.sync-conflict-card-body');
        
        if ($card.hasClass('expanded')) {
            // Collapse
            $body.slideUp(300, function() {
                $card.removeClass('expanded');
            });
        } else {
            // Expand
            $card.addClass('expanded');
            $body.slideDown(300, function() {
                // Apply syntax highlighting to JSON content when expanded
                $body.find('.sync-json-pre').each(function() {
                    const $pre = $(this);
                    if (!$pre.data('highlighted')) {
                        const jsonText = $pre.text();
                        try {
                            const highlighted = highlightJSON(jsonText);
                            $pre.html(highlighted);
                            $pre.data('highlighted', true);
                        } catch (e) {
                            console.warn('Failed to highlight JSON:', e);
                        }
                    }
                });
            });
        }
    }

    // ========================================================================
    // BULK ACTIONS
    // ========================================================================
    
    function updateBulkActionsVisibility() {
        if (selectedConflicts.size > 0) {
            $('#bulk-actions-container').slideDown(300);
        } else {
            $('#bulk-actions-container').slideUp(300);
        }
    }

    function updateSelectedCount() {
        $('#selected-count').text(selectedConflicts.size);
    }

    function bulkResolveConflicts(strategy) {
        if (selectedConflicts.size === 0) {
            showAlert('Please select at least one conflict to resolve.', 'warning');
            return;
        }

        const conflictIds = Array.from(selectedConflicts);
        const strategyText = getStrategyText(strategy);

        // Show confirmation modal
        showConfirmation(
            `Are you sure you want to ${strategyText} for ${conflictIds.length} selected conflict(s)?`,
            'warning',
            function() {
                performBulkResolution(conflictIds, strategy);
            }
        );
    }

    function performBulkResolution(conflictIds, strategy) {
        // Show loading state
        $('#resolve-selected-btn').prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Resolving...');

        $.ajax({
            url: base_url + 'admin/sync_conflicts/bulk_resolve',
            method: 'POST',
            data: {
                conflict_ids: conflictIds,
                strategy: strategy
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showAlert(`Successfully resolved ${conflictIds.length} conflict(s).`, 'success');
                    
                    // Remove resolved conflicts from UI
                    conflictIds.forEach(function(id) {
                        $(`.sync-conflict-card[data-conflict-id="${id}"]`).fadeOut(300, function() {
                            $(this).remove();
                            updateVisibleCounts();
                        });
                    });

                    // Clear selection
                    selectedConflicts.clear();
                    updateBulkActionsVisibility();
                    updateSelectedCount();

                    // Update summary counts
                    updateSummaryCounts();
                } else {
                    showAlert(response.message || 'Failed to resolve conflicts.', 'danger');
                }
            },
            error: function() {
                showAlert('An error occurred while resolving conflicts. Please try again.', 'danger');
            },
            complete: function() {
                $('#resolve-selected-btn').prop('disabled', false).html('<i class="fa fa-check"></i> Resolve Selected <i class="fa fa-caret-down"></i>');
            }
        });
    }

    // ========================================================================
    // INDIVIDUAL CONFLICT RESOLUTION
    // ========================================================================
    
    window.resolveConflict = function(conflictId, strategy) {
        const strategyText = getStrategyText(strategy);

        // Show confirmation modal
        showConfirmation(
            `Are you sure you want to ${strategyText}?`,
            strategy === 'ignore' ? 'warning' : 'info',
            function() {
                performResolution(conflictId, strategy);
            }
        );
    };

    function performResolution(conflictId, strategy) {
        const $card = $(`.sync-conflict-card[data-conflict-id="${conflictId}"]`);
        const $actions = $card.find('.sync-conflict-actions');

        // Show loading state
        $actions.find('.sync-btn').prop('disabled', true);
        $actions.prepend('<div class="sync-spinner"></div>');

        $.ajax({
            url: base_url + 'admin/sync_conflicts/resolve',
            method: 'POST',
            data: {
                conflict_id: conflictId,
                strategy: strategy
            },
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showAlert('Conflict resolved successfully.', 'success');
                    
                    // Update card status
                    $card.attr('data-status', 'resolved');
                    $card.find('.sync-badge').removeClass('sync-badge-warning').addClass('sync-badge-success').text('Resolved');
                    
                    // Collapse and fade out
                    $card.find('.sync-conflict-card-body').slideUp(300);
                    setTimeout(function() {
                        $card.fadeOut(300, function() {
                            $(this).remove();
                            updateVisibleCounts();
                        });
                    }, 500);

                    // Update summary counts
                    updateSummaryCounts();
                } else {
                    showAlert(response.message || 'Failed to resolve conflict.', 'danger');
                    $actions.find('.sync-spinner').remove();
                    $actions.find('.sync-btn').prop('disabled', false);
                }
            },
            error: function() {
                showAlert('An error occurred while resolving the conflict. Please try again.', 'danger');
                $actions.find('.sync-spinner').remove();
                $actions.find('.sync-btn').prop('disabled', false);
            }
        });
    };

    // ========================================================================
    // MANUAL MERGE MODAL
    // ========================================================================
    
    window.openMergeModal = function(conflictId) {
        // This will be implemented in Task 5.4
        showAjaxModal(base_url + 'admin/sync_conflicts/merge_modal/' + conflictId, 'Merge Conflict Manually');
    };

    // ========================================================================
    // PAGINATION
    // ========================================================================
    
    function initializePagination() {
        totalConflicts = parseInt($('#total-count').text()) || 0;
        generatePageNumbers();
    }

    function loadPage(page) {
        // This would typically load data via AJAX
        // For now, we'll just update the UI
        currentPage = page;
        updatePaginationUI();
    }

    function updatePaginationUI() {
        const totalPages = Math.ceil(totalConflicts / pageSize);
        
        // Update prev/next buttons
        $('#prev-page-btn').prop('disabled', currentPage === 1);
        $('#next-page-btn').prop('disabled', currentPage === totalPages);
        
        // Update page numbers
        generatePageNumbers();
        
        // Update showing info
        const from = (currentPage - 1) * pageSize + 1;
        const to = Math.min(currentPage * pageSize, totalConflicts);
        $('#showing-from').text(from);
        $('#showing-to').text(to);
    }

    function generatePageNumbers() {
        const totalPages = Math.ceil(totalConflicts / pageSize);
        const $pagesContainer = $('#pagination-pages');
        $pagesContainer.empty();

        if (totalPages <= 1) return;

        // Show max 5 page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const $pageBtn = $('<button>')
                .addClass('sync-page-btn')
                .text(i)
                .toggleClass('active', i === currentPage)
                .on('click', function() {
                    currentPage = i;
                    loadPage(i);
                });
            $pagesContainer.append($pageBtn);
        }
    }

    // ========================================================================
    // REFRESH FUNCTIONALITY
    // ========================================================================
    
    function refreshConflicts() {
        const $btn = $('#refresh-conflicts-btn');
        $btn.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> Refreshing...');

        // Reload the page to get fresh data
        setTimeout(function() {
            location.reload();
        }, 500);
    }

    // ========================================================================
    // SUMMARY COUNTS UPDATE
    // ========================================================================
    
    function updateSummaryCounts() {
        $.ajax({
            url: base_url + 'admin/sync_conflicts/get_summary',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    $('#total-conflicts-count').text(response.data.total_conflicts || 0);
                    $('#pending-conflicts-count').text(response.data.pending_conflicts || 0);
                    $('#resolved-today-count').text(response.data.resolved_today || 0);
                }
            }
        });
    }

    // ========================================================================
    // UTILITY FUNCTIONS
    // ========================================================================
    
    function getStrategyText(strategy) {
        const strategies = {
            'keep-local': 'keep the local version',
            'keep-remote': 'keep the remote version',
            'ignore': 'ignore this conflict'
        };
        return strategies[strategy] || 'resolve this conflict';
    }

    function showAlert(message, type) {
        // Use existing modal system
        if (typeof showAjaxModal_alert === 'function') {
            showAjaxModal_alert(message, type);
        } else {
            alert(message);
        }
    }

    function showConfirmation(message, type, callback) {
        // Use existing modal system
        if (typeof showCustomConfirm === 'function') {
            showCustomConfirm(message, callback);
        } else if (confirm(message)) {
            callback();
        }
    }

    /**
     * Highlight JSON syntax with color coding
     * Requirement: 8.5 - Add syntax highlighting for JSON data
     */
    function highlightJSON(json) {
        // Simple JSON syntax highlighting
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return json
            // Strings (values)
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, function(match) {
                if (/:$/.test(match)) {
                    // Property names
                    return '<span style="color: #0066cc; font-weight: 600;">' + match + '</span>';
                } else {
                    // String values
                    return '<span style="color: #008000;">' + match + '</span>';
                }
            })
            // Numbers
            .replace(/\b(-?\d+\.?\d*)\b/g, '<span style="color: #0000ff;">$1</span>')
            // Booleans
            .replace(/\b(true|false)\b/g, '<span style="color: #ff6600; font-weight: 600;">$1</span>')
            // Null
            .replace(/\b(null)\b/g, '<span style="color: #999999; font-style: italic;">$1</span>')
            // Brackets and braces
            .replace(/([{}[\]])/g, '<span style="color: #666666; font-weight: bold;">$1</span>');
    }

    // ========================================================================
    // JSON SYNTAX HIGHLIGHTING
    // Requirement: 8.5 - Add syntax highlighting for JSON data
    // ========================================================================
    
    function applySyntaxHighlighting() {
        $('.sync-json-pre').each(function() {
            const $pre = $(this);
            const jsonText = $pre.text();
            
            try {
                // Apply basic syntax highlighting
                const highlighted = highlightJSON(jsonText);
                $pre.html(highlighted);
                $pre.data('highlighted', true);
            } catch (e) {
                // If highlighting fails, leave as is
                console.warn('Failed to highlight JSON:', e);
            }
        });
    }

})(jQuery);
