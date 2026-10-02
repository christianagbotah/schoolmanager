/**
 * Global Select2 v3.5.2 Initialization Fix
 * Prevents "query function not defined" errors by checking for proper configuration
 * before initializing Select2 on elements
 * OPTIMIZED: Debounced MutationObserver to reduce initialization frequency
 */

(function($) {
    'use strict';
    
    // Store original Select2 method
    var originalSelect2 = $.fn.select2;
    
    // Override Select2 with validation wrapper
    $.fn.select2 = function(options) {
        // Return early if jQuery object is empty
        if (this.length === 0) {
            return this;
        }
        
        // Filter out elements that are already Select2 containers (divs with class select2-container)
        var $validElements = this.filter(function() {
            var $el = $(this);
            
            // Skip if it's a Select2 container div (already initialized)
            if ($el.hasClass('select2-container') || $el.prop('tagName') === 'DIV') {
                // Silently skip - this is normal after root cause fix in main.php/header.php
                return false;
            }
            
            // Skip if it's not a select element
            if ($el.prop('tagName') !== 'SELECT') {
                // Silently skip non-select elements
                return false;
            }
            
            return true;
        });
        
        // If no valid elements, return this to allow chaining
        if ($validElements.length === 0) {
            return this;
        }
        
        // Validate query option if provided
        if (options && options.query !== undefined) {
            if (typeof options.query !== 'function') {
                console.warn('Select2: query option must be a function, removing invalid option');
                delete options.query;
            }
        }
        
        // Validate ajax option if provided
        if (options && options.ajax !== undefined) {
            if (typeof options.ajax !== 'object') {
                console.warn('Select2: ajax option must be an object, removing invalid option');
                delete options.ajax;
            } else if (options.ajax.transport && typeof options.ajax.transport !== 'function') {
                console.warn('Select2: ajax.transport must be a function, removing invalid option');
                delete options.ajax.transport;
            }
        }
        
        // Call original Select2 method with validated options on valid elements only
        try {
            return originalSelect2.call($validElements, options);
        } catch (e) {
            console.error('Select2 initialization error:', e ? (e.message || e) : 'Unknown error', 'Elements:', $validElements.length);
            return this;
        }
    };
    
    // Copy static properties from original Select2
    $.fn.select2.defaults = originalSelect2.defaults;
    $.fn.select2.ajaxDefaults = originalSelect2.ajaxDefaults;
    $.fn.select2.amd = originalSelect2.amd;
    
    /**
     * Safe Select2 initialization wrapper
     * Only initializes if not already initialized and has valid configuration
     */
    function safeInitSelect2(selector, options) {
        options = options || {};
        
        $(selector).each(function() {
            var $el = $(this);
            
            // Skip if already initialized
            if ($el.data('select2')) {
                return;
            }
            
            // Skip if hidden (will be initialized when shown)
            if ($el.is(':hidden') && !options.initHidden) {
                return;
            }
            
            // Default safe configuration for Select2 v3.5.2
            var config = $.extend({}, {
                width: '100%',
                allowClear: false,
                placeholder: $el.attr('placeholder') || 'Select an option',
                minimumResultsForSearch: 10 // Show search box only if > 10 items
            }, options);
            
            // Initialize Select2 (now with built-in validation)
            $el.select2(config);
        });
    }
    
    /**
     * Debounce function to limit frequency of calls
     */
    function debounce(func, wait) {
        var timeout;
        return function executedFunction() {
            var context = this;
            var args = arguments;
            var later = function() {
                timeout = null;
                func.apply(context, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Initialize Select2 on page load
     */
    $(document).ready(function() {
        // Initialize basic select2 elements
        safeInitSelect2('.select2:not([data-ajax])');
        
        // Initialize select2 elements in modals when modal is shown
        $(document).on('shown.bs.modal', '.modal', function() {
            safeInitSelect2($(this).find('.select2:not([data-ajax])'), {
                initHidden: true,
                dropdownParent: $(this)
            });
        });
        
        // Re-initialize Select2 on dynamically added elements with DEBOUNCING
        // Use MutationObserver to watch for new select2 elements
        if (window.MutationObserver) {
            var pendingElements = [];
            
            // Debounced batch initialization - runs max once every 300ms
            var processPendingElements = debounce(function() {
                if (pendingElements.length > 0) {
                    $(pendingElements).each(function() {
                        if (!$(this).data('select2')) {
                            safeInitSelect2($(this));
                        }
                    });
                    pendingElements = [];
                }
            }, 300);
            
            var observer = new MutationObserver(function(mutations) {
                var hasNewElements = false;
                mutations.forEach(function(mutation) {
                    if (mutation.addedNodes && mutation.addedNodes.length > 0) {
                        $(mutation.addedNodes).find('.select2:not([data-ajax])').each(function() {
                            if (pendingElements.indexOf(this) === -1) {
                                pendingElements.push(this);
                                hasNewElements = true;
                            }
                        });
                    }
                });
                if (hasNewElements) {
                    processPendingElements();
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    });
    
    // Expose safe initialization function globally
    window.safeInitSelect2 = safeInitSelect2;
    
})(jQuery);
