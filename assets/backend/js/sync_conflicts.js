/**
 * Sync Conflicts JavaScript
 * 
 * Handles AJAX operations, bulk actions, diff highlighting, and UI interactions
 * for the conflict resolution interface.
 * 
 * @package    School Manager
 * @subpackage Assets
 * @category   Sync
 * @version    1.0.0
 */

(function($) {
    'use strict';

    // Configuration
    var config = {
        baseUrl: window.location.origin + '/',
        refreshInterval: 30000, // 30 seconds
        autoRefresh: false
    };

    // State management
    var state = {
        selectedConflicts: [],
        isProcessing: false,
        stats: {}
    };

    /**
     * Initialize conflict resolution interface
     */
    function init() {
        bindEvents();
        initDiffHighlighting();
        loadStats();
        
        if (config.autoRefresh) {
            startAutoRefresh();
        }
    }

    /**
     * Bind event handlers
     */
    function bindEvents() {
        // Select all checkbox
        $(document).on('change', '#select_all', function() {
            toggleSelectAll(this.checked);
        });

        // Individual conflict checkboxes
        $(document).on('change', '.conflict-checkbox', function() {
            updateSelectedConflicts();
        });

        // Quick resolve buttons
        $(document).on('click', '[data-action="quick-resolve"]', function(e) {
            e.preventDefault();
            var conflictId = $(this).data('conflict-id');
            var version = $(this).data('version');
            quickResolve(conflictId, version);
        });

        // Bulk resolve buttons
        $(document).on('click', '[data-action="bulk-resolve"]', function(e) {
            e.preventDefault();
            var resolution = $(this).data('resolution');
            bulkResolve(resolution);
        });

        // Refresh button
        $(document).on('click', '[data-action="refresh"]', function(e) {
            e.preventDefault();
            refreshConflictList();
        });

        // Filter form
        $(document).on('submit', '#conflict-filter-form', function(e) {
            e.preventDefault();
            applyFilters();
        });

        // Diff toggle
        $(document).on('click', '.diff-toggle', function() {
            $(this).closest('tr').find('.diff-details').slideToggle();
        });
    }

    /**
     * Toggle select all conflicts
     */
    function toggleSelectAll(checked) {
        $('.conflict-checkbox').prop('checked', checked);
        updateSelectedConflicts();
    }

    /**
     * Update selected conflicts array
     */
    function updateSelectedConflicts() {
        state.selectedConflicts = [];
        $('.conflict-checkbox:checked').each(function() {
            state.selectedConflicts.push($(this).val());
        });
        
        updateBulkActionButtons();
    }

    /**
     * Update bulk action button states
     */
    function updateBulkActionButtons() {
        var count = state.selectedConflicts.length;
        var $buttons = $('[data-action="bulk-resolve"]');
        
        if (count > 0) {
            $buttons.prop('disabled', false);
            $buttons.find('.count').text('(' + count + ')');
        } else {
            $buttons.prop('disabled', true);
            $buttons.find('.count').text('');
        }
    }

    /**
     * Quick resolve a single conflict
     */
    function quickResolve(conflictId, version) {
        if (state.isProcessing) {
            showNotification('Please wait for current operation to complete', 'warning');
            return;
        }

        var action = version === 'local' ? 'keep_local' : 'keep_remote';
        var confirmMsg = 'Keep ' + version + ' version for this conflict?';
        
        showCustomConfirm(confirmMsg, function() {
            state.isProcessing = true;
            showLoadingIndicator();

            $.ajax({
                url: config.baseUrl + 'sync_conflicts/' + action + '/' + conflictId,
                type: 'GET',
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        showNotification(response.message, 'success');
                        removeConflictRow(conflictId);
                        updateStats();
                    } else {
                        showNotification(response.message, 'error');
                    }
                },
                error: function(xhr, status, error) {
                    showNotification('Error resolving conflict: ' + error, 'error');
                },
                complete: function() {
                    state.isProcessing = false;
                    hideLoadingIndicator();
                }
            });
        });
    }

    /**
     * Bulk resolve multiple conflicts
     */
    function bulkResolve(resolution) {
        if (state.isProcessing) {
            showNotification('Please wait for current operation to complete', 'warning');
            return;
        }

        if (state.selectedConflicts.length === 0) {
            showNotification('Please select at least one conflict', 'warning');
            return;
        }

        var resolutionText = resolution.replace('_', ' ');
        var confirmMsg = 'Apply "' + resolutionText + '" to ' + state.selectedConflicts.length + ' conflicts?';
        
        showCustomConfirm(confirmMsg, function() {
            state.isProcessing = true;
            showLoadingIndicator();

            $.ajax({
                url: config.baseUrl + 'sync_conflicts/bulk_resolve',
                type: 'POST',
                data: {
                    ids: state.selectedConflicts,
                    resolution: resolution
                },
                dataType: 'json',
                success: function(response) {
                if (response.success) {
                    showNotification(response.message, 'success');
                    
                    // Remove resolved conflicts from UI
                    state.selectedConflicts.forEach(function(id) {
                        removeConflictRow(id);
                    });
                    
                    state.selectedConflicts = [];
                    updateBulkActionButtons();
                    updateStats();
                } else {
                    showNotification(response.message, 'error');
                }
            },
            error: function(xhr, status, error) {
                showNotification('Error resolving conflicts: ' + error, 'error');
            },
            complete: function() {
                state.isProcessing = false;
                hideLoadingIndicator();
            }
        });
        }); // Close showCustomConfirm callback
    }

    /**
     * Remove conflict row from table
     */
    function removeConflictRow(conflictId) {
        var $row = $('.conflict-checkbox[value="' + conflictId + '"]').closest('tr');
        $row.fadeOut(300, function() {
            $(this).remove();
            
            // Check if table is empty
            if ($('.conflict-checkbox').length === 0) {
                showEmptyState();
            }
        });
    }

    /**
     * Show empty state message
     */
    function showEmptyState() {
        var $tbody = $('.conflict-checkbox').closest('tbody');
        $tbody.html(
            '<tr>' +
            '<td colspan="10" class="text-center text-muted" style="padding: 40px;">' +
            '<i class="fa fa-check-circle" style="font-size: 48px; color: #5cb85c;"></i>' +
            '<h4>No Pending Conflicts</h4>' +
            '<p>All conflicts have been resolved!</p>' +
            '</td>' +
            '</tr>'
        );
    }

    /**
     * Initialize diff highlighting
     */
    function initDiffHighlighting() {
        $('.diff-field').each(function() {
            var $field = $(this);
            var localVal = $field.data('local');
            var remoteVal = $field.data('remote');
            
            if (localVal !== remoteVal) {
                $field.addClass('diff-highlight');
                highlightDifferences($field, localVal, remoteVal);
            }
        });
    }

    /**
     * Highlight differences between two values
     */
    function highlightDifferences($element, localVal, remoteVal) {
        // Simple character-level diff highlighting
        var localStr = String(localVal || '');
        var remoteStr = String(remoteVal || '');
        
        if (localStr.length < 200 && remoteStr.length < 200) {
            // For short strings, show character-level diff
            var diff = diffChars(localStr, remoteStr);
            $element.html(formatDiff(diff));
        } else {
            // For long strings, just highlight the entire field
            $element.addClass('diff-long');
        }
    }

    /**
     * Simple character diff (basic implementation)
     */
    function diffChars(str1, str2) {
        var result = [];
        var maxLen = Math.max(str1.length, str2.length);
        
        for (var i = 0; i < maxLen; i++) {
            var char1 = str1[i] || '';
            var char2 = str2[i] || '';
            
            if (char1 === char2) {
                result.push({ type: 'equal', value: char1 });
            } else {
                if (char1) result.push({ type: 'removed', value: char1 });
                if (char2) result.push({ type: 'added', value: char2 });
            }
        }
        
        return result;
    }

    /**
     * Format diff for display
     */
    function formatDiff(diff) {
        var html = '';
        
        diff.forEach(function(part) {
            if (part.type === 'equal') {
                html += part.value;
            } else if (part.type === 'removed') {
                html += '<span class="diff-removed">' + part.value + '</span>';
            } else if (part.type === 'added') {
                html += '<span class="diff-added">' + part.value + '</span>';
            }
        });
        
        return html;
    }

    /**
     * Load conflict statistics
     */
    function loadStats() {
        $.ajax({
            url: config.baseUrl + 'sync_conflicts/stats',
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                state.stats = data;
                updateStatsDisplay();
            },
            error: function() {
                console.error('Failed to load conflict statistics');
            }
        });
    }

    /**
     * Update statistics display
     */
    function updateStatsDisplay() {
        if (state.stats.pending !== undefined) {
            $('.stat-pending').text(state.stats.pending);
        }
        if (state.stats.resolved !== undefined) {
            $('.stat-resolved').text(state.stats.resolved);
        }
        if (state.stats.ignored !== undefined) {
            $('.stat-ignored').text(state.stats.ignored);
        }
    }

    /**
     * Update stats after resolution
     */
    function updateStats() {
        loadStats();
    }

    /**
     * Refresh conflict list
     */
    function refreshConflictList() {
        window.location.reload();
    }

    /**
     * Apply filters
     */
    function applyFilters() {
        var $form = $('#conflict-filter-form');
        var formData = $form.serialize();
        window.location.href = config.baseUrl + 'sync_conflicts?' + formData;
    }

    /**
     * Start auto-refresh
     */
    function startAutoRefresh() {
        setInterval(function() {
            if (!state.isProcessing) {
                loadStats();
            }
        }, config.refreshInterval);
    }

    /**
     * Show loading indicator
     */
    function showLoadingIndicator() {
        if ($('#conflict-loading').length === 0) {
            $('body').append(
                '<div id="conflict-loading" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; ' +
                'background: rgba(0,0,0,0.3); z-index: 9999; display: flex; align-items: center; justify-content: center;">' +
                '<div style="background: white; padding: 20px 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">' +
                '<i class="fa fa-spinner fa-spin fa-2x"></i>' +
                '<p style="margin: 10px 0 0 0;">Processing...</p>' +
                '</div>' +
                '</div>'
            );
        }
    }

    /**
     * Hide loading indicator
     */
    function hideLoadingIndicator() {
        $('#conflict-loading').fadeOut(300, function() {
            $(this).remove();
        });
    }

    /**
     * Show notification
     */
    function showNotification(message, type) {
        var bgColor = {
            'success': '#5cb85c',
            'error': '#d9534f',
            'warning': '#f0ad4e',
            'info': '#5bc0de'
        }[type] || '#5bc0de';

        var icon = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        }[type] || 'info-circle';

        var $notification = $(
            '<div class="conflict-notification" style="position: fixed; top: 20px; right: 20px; z-index: 10000; ' +
            'background: ' + bgColor + '; color: white; padding: 15px 20px; border-radius: 4px; ' +
            'box-shadow: 0 2px 8px rgba(0,0,0,0.2); min-width: 250px; animation: slideInRight 0.3s;">' +
            '<i class="fa fa-' + icon + '"></i> ' + message +
            '<button type="button" class="close" style="color: white; opacity: 0.8; margin-left: 10px;">&times;</button>' +
            '</div>'
        );

        $('body').append($notification);

        // Auto-dismiss after 5 seconds
        setTimeout(function() {
            $notification.fadeOut(300, function() {
                $(this).remove();
            });
        }, 5000);

        // Manual dismiss
        $notification.find('.close').on('click', function() {
            $notification.fadeOut(300, function() {
                $(this).remove();
            });
        });
    }

    /**
     * Export functions for global access
     */
    window.SyncConflicts = {
        init: init,
        quickResolve: quickResolve,
        bulkResolve: bulkResolve,
        refreshConflictList: refreshConflictList,
        showNotification: showNotification
    };

    // Auto-initialize on document ready
    $(document).ready(function() {
        if ($('.sync-conflicts-page').length > 0 || $('.conflict-detail-page').length > 0) {
            init();
        }
    });

})(jQuery);

// Add CSS animations
var style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .diff-highlight {
        background-color: #fff3cd;
        border-left: 3px solid #ffc107;
        padding-left: 8px;
    }

    .diff-long {
        background-color: #f8d7da;
        border-left: 3px solid #dc3545;
        padding-left: 8px;
    }

    .diff-removed {
        background-color: #f8d7da;
        text-decoration: line-through;
        color: #721c24;
    }

    .diff-added {
        background-color: #d4edda;
        color: #155724;
        font-weight: bold;
    }

    .conflict-notification {
        animation: slideInRight 0.3s ease-out;
    }

    .conflict-checkbox:checked + label {
        font-weight: bold;
    }

    .bulk-action-bar {
        position: sticky;
        top: 0;
        z-index: 100;
        background: white;
        padding: 10px;
        border-bottom: 2px solid #ddd;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .conflict-row:hover {
        background-color: #f5f5f5;
    }

    .conflict-row.selected {
        background-color: #e3f2fd;
    }
`;
document.head.appendChild(style);
