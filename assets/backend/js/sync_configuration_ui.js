/**
 * Sync Configuration UI JavaScript
 * Handles table-level sync configuration interactions
 * 
 * Requirements: 10.2, 10.3, 10.4, 10.9
 * Task 8.1: Sync configuration layout structure
 */

(function() {
    'use strict';
    
    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeTooltips();
        initializeTableSorting();
    });
    
    /**
     * Initialize tooltips for conflict strategies
     */
    function initializeTooltips() {
        var tooltips = document.querySelectorAll('.strategy-tooltip');
        
        tooltips.forEach(function(tooltip) {
            tooltip.addEventListener('mouseenter', function() {
                var select = this.previousElementSibling;
                var selectedOption = select.options[select.selectedIndex];
                var strategyText = selectedOption.textContent;
                
                // Get strategy description
                var descriptions = {
                    'REMOTE_WINS': 'Remote changes always take precedence over local changes',
                    'LOCAL_WINS': 'Local changes always take precedence over remote changes',
                    'TIMESTAMP_WINS': 'Most recent change wins based on timestamp',
                    'VERSION_WINS': 'Higher version number wins',
                    'MANUAL_REVIEW': 'Conflicts require manual resolution'
                };
                
                var strategy = selectedOption.value;
                var description = descriptions[strategy] || 'No description available';
                
                showTooltip(this, strategyText + ': ' + description);
            });
            
            tooltip.addEventListener('mouseleave', function() {
                hideTooltip();
            });
        });
    }
    
    /**
     * Show tooltip
     */
    function showTooltip(element, text) {
        var existingTooltip = document.querySelector('.strategy-tooltip-popup');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        var tooltip = document.createElement('div');
        tooltip.className = 'strategy-tooltip-popup';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: #1f2937;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            max-width: 250px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        var rect = element.getBoundingClientRect();
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
        tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
    }
    
    /**
     * Hide tooltip
     */
    function hideTooltip() {
        var tooltip = document.querySelector('.strategy-tooltip-popup');
        if (tooltip) {
            tooltip.remove();
        }
    }
    
    /**
     * Initialize table sorting
     */
    function initializeTableSorting() {
        var tableNameHeader = document.querySelector('.col-table-name');
        if (!tableNameHeader) return;
        
        var sortAscending = true;
        
        tableNameHeader.style.cursor = 'pointer';
        tableNameHeader.addEventListener('click', function() {
            var tbody = document.getElementById('config-table-body');
            var rows = Array.from(tbody.querySelectorAll('.config-row'));
            
            rows.sort(function(a, b) {
                var aName = a.querySelector('.table-name-text').textContent;
                var bName = b.querySelector('.table-name-text').textContent;
                
                if (sortAscending) {
                    return aName.localeCompare(bName);
                } else {
                    return bName.localeCompare(aName);
                }
            });
            
            // Update sort icon
            var sortIcon = this.querySelector('.sort-icon');
            sortIcon.className = 'fa sort-icon ' + (sortAscending ? 'fa-sort-up' : 'fa-sort-down');
            
            // Re-append rows in sorted order
            rows.forEach(function(row) {
                tbody.appendChild(row);
            });
            
            sortAscending = !sortAscending;
        });
    }
    
    /**
     * Export configuration as JSON
     */
    window.exportConfiguration = function() {
        var rows = document.querySelectorAll('.config-row');
        var config = [];
        
        rows.forEach(function(row) {
            var tableName = row.getAttribute('data-table');
            var syncEnabled = row.querySelector('.sync-enabled-toggle').checked;
            var conflictStrategy = row.querySelector('.conflict-strategy-select').value;
            var realtimeSync = row.querySelector('.realtime-toggle').checked;
            var dataScope = row.querySelector('.data-scope-select').value;
            
            config.push({
                table_name: tableName,
                sync_enabled: syncEnabled,
                conflict_strategy: conflictStrategy,
                real_time_sync: realtimeSync,
                data_scope: dataScope
            });
        });
        
        var dataStr = JSON.stringify(config, null, 2);
        var dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        var exportFileDefaultName = 'sync_configuration_' + new Date().toISOString().split('T')[0] + '.json';
        
        var linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };
    
    /**
     * Highlight unsaved changes
     */
    function trackChanges() {
        var inputs = document.querySelectorAll('.sync-enabled-toggle, .conflict-strategy-select, .realtime-toggle, .data-scope-select');
        
        inputs.forEach(function(input) {
            input.addEventListener('change', function() {
                var row = this.closest('.config-row');
                if (!row.classList.contains('has-changes')) {
                    row.classList.add('has-changes');
                    row.style.backgroundColor = '#fef3c7';
                }
            });
        });
    }
    
    // Initialize change tracking
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', trackChanges);
    } else {
        trackChanges();
    }
    
})();
