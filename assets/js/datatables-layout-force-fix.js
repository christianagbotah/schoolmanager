/**
 * DataTables Layout Force Fix - JavaScript Solution
 * Forces pagination right-alignment after DataTable initialization
 * This runs AFTER DataTables applies its own styles
 * Author: System
 * Date: 2026-07-13
 */

(function($) {
    'use strict';
    
    /**
     * Force DataTables pagination to right-align
     * Runs after DataTable initialization
     * Supports both DataTables 1.x (.dataTables_wrapper) and 2.x (.dt-container)
     */
    function forceDataTablesLayout() {
        console.log('🔧 Forcing DataTables layout alignment...');
        
        // Support both DataTables 1.x and 2.x wrapper classes
        var wrappers = $('.dataTables_wrapper, .dt-container');
        console.log('Found ' + wrappers.length + ' DataTable wrapper(s)');
        
        if (wrappers.length === 0) {
            console.warn('⚠️ No DataTables found! Make sure DataTables has initialized.');
            return;
        }
        
        // Target all DataTables wrappers
        wrappers.each(function() {
            var $wrapper = $(this);
            
            console.log('📊 Processing DataTable wrapper:', $wrapper.attr('id') || 'unnamed');
            
            // Force pagination to right (all possible class combinations)
            // Use setAttribute to add !important styles (jQuery .css() cannot do this)
            $wrapper.find('.dataTables_paginate, .dt-paging, .paging_full_numbers, .dt-paging.paging_full_numbers').each(function() {
                console.log('→ Fixing pagination:', $(this).attr('class'));
                this.setAttribute('style', 'float: right !important; text-align: right !important; margin-left: auto !important; margin-right: 0 !important; display: block !important;');
                
                // Force inner span to right
                $(this).find('span').each(function() {
                    this.setAttribute('style', 'float: right !important; text-align: right !important; justify-content: flex-end !important; display: inline-flex !important;');
                });
            });
            
            // Force info to left
            $wrapper.find('.dataTables_info, .dt-info').each(function() {
                this.setAttribute('style', 'float: left !important; text-align: left !important; margin-right: auto !important; margin-left: 0 !important; display: inline-block !important;');
            });
            
            // Force search box to right (all possible class combinations)
            $wrapper.find('.dataTables_filter, .dt-search').each(function() {
                this.setAttribute('style', 'float: right !important; text-align: right !important;');
            });
            
            // Force length menu to left
            $wrapper.find('.dataTables_length, .dt-length').each(function() {
                this.setAttribute('style', 'float: left !important; text-align: left !important;');
            });
            
            // Force pagination column to right
            $wrapper.find('.col-sm-7, .col-md-7').each(function() {
                if ($(this).find('.dataTables_paginate, .dt-paging').length > 0) {
                    this.setAttribute('style', 'float: right !important; text-align: right !important; width: 55% !important;');
                    
                    // Force all children to right
                    $(this).children().each(function() {
                        this.setAttribute('style', 'float: right !important; text-align: right !important; margin-left: auto !important; margin-right: 0 !important;');
                    });
                }
            });
            
            // Force info column to left
            $wrapper.find('.col-sm-5, .col-md-5').each(function() {
                if ($(this).find('.dataTables_info, .dt-info').length > 0) {
                    this.setAttribute('style', 'float: left !important; text-align: left !important; width: 45% !important;');
                }
            });
        });
        
        console.log('✅ DataTables layout alignment complete!');
    }
    
    /**
     * Initialize the layout fix
     * Supports both DataTables 1.x and 2.x
     */
    var retryCount = 0;
    var maxRetries = 4; // Maximum 4 retries
    var retryDelays = [100, 500, 1000, 2000]; // Delays for each retry
    
    function initLayoutFix() {
        // Check if DataTables exist (support both 1.x and 2.x)
        var wrappers = $('.dataTables_wrapper, .dt-container');
        if (wrappers.length === 0) {
            if (retryCount < maxRetries) {
                console.log('⏳ No DataTables found yet, waiting... (attempt ' + (retryCount + 1) + '/' + maxRetries + ')');
                // Schedule only ONE retry with the appropriate delay
                var delay = retryDelays[retryCount];
                retryCount++;
                setTimeout(initLayoutFix, delay);
            } else {
                console.log('ℹ️ No DataTables found on this page. Script will remain passive for dynamic content.');
            }
            return;
        }
        
        console.log('✅ Found', wrappers.length, 'DataTable(s), applying fix...');
        
        // Run immediately for existing tables
        forceDataTablesLayout();
        
        // Run after short delays to catch late-initializing tables
        setTimeout(forceDataTablesLayout, 100);
        setTimeout(forceDataTablesLayout, 500);
    }
    
    // Hook into DataTables initialization
    if ($.fn.dataTable) {
        // Listen for DataTables draw event
        $(document).on('draw.dt', function(e, settings) {
            setTimeout(forceDataTablesLayout, 50);
        });
        
        // Listen for DataTables page change
        $(document).on('page.dt', function(e, settings) {
            setTimeout(forceDataTablesLayout, 50);
        });
        
        // Listen for DataTables search
        $(document).on('search.dt', function(e, settings) {
            setTimeout(forceDataTablesLayout, 50);
        });
        
        // Listen for DataTables length change
        $(document).on('length.dt', function(e, settings) {
            setTimeout(forceDataTablesLayout, 50);
        });
    }
    
    // Run on document ready
    $(document).ready(function() {
        initLayoutFix();
    });
    
    // Run on window load (for late-loading content)
    $(window).on('load', function() {
        setTimeout(forceDataTablesLayout, 200);
    });
    
    // Watch for DOM changes (for AJAX-loaded tables)
    // Supports both DataTables 1.x and 2.x
    if (window.MutationObserver) {
        var observer = new MutationObserver(function(mutations) {
            var hasDataTable = false;
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    $(mutation.addedNodes).each(function() {
                        if ($(this).hasClass('dataTables_wrapper') || 
                            $(this).hasClass('dt-container') ||
                            $(this).find('.dataTables_wrapper, .dt-container').length > 0) {
                            hasDataTable = true;
                        }
                    });
                }
            });
            
            if (hasDataTable) {
                setTimeout(forceDataTablesLayout, 100);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Expose global function for manual trigger
    window.forceDataTablesLayoutFix = forceDataTablesLayout;
    
})(jQuery);
