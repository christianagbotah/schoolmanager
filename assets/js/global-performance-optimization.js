/**
 * Global Performance Optimization Script
 * Reduces unnecessary AJAX requests and resource loading across the entire system
 * 
 * OPTIMIZATIONS INCLUDED:
 * 1. Session-based caching for settings
 * 2. Debounced event handlers
 * 3. Lazy initialization of heavy components
 * 4. Request coalescing
 * 5. Conditional resource loading
 */

(function($, window) {
    'use strict';
    
    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    
    /**
     * Debounce function to limit call frequency
     */
    window.debounce = function(func, wait, immediate) {
        var timeout;
        return function executedFunction() {
            var context = this;
            var args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };
    
    /**
     * Throttle function to limit execution rate
     */
    window.throttle = function(func, limit) {
        var inThrottle;
        return function() {
            var args = arguments;
            var context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(function() { inThrottle = false; }, limit);
            }
        };
    };
    
    /**
     * Session storage cache with expiration
     */
    window.CachedAjax = {
        get: function(key) {
            var cached = sessionStorage.getItem(key);
            var timestamp = sessionStorage.getItem(key + '_timestamp');
            var now = new Date().getTime();
            
            // Cache valid for 5 minutes (300000ms)
            if (cached && timestamp && (now - timestamp < 300000)) {
                return cached;
            }
            return null;
        },
        
        set: function(key, value) {
            sessionStorage.setItem(key, value);
            sessionStorage.setItem(key + '_timestamp', new Date().getTime());
        },
        
        clear: function(key) {
            sessionStorage.removeItem(key);
            sessionStorage.removeItem(key + '_timestamp');
        },
        
        clearAll: function() {
            var keys = [];
            for (var i = 0; i < sessionStorage.length; i++) {
                var key = sessionStorage.key(i);
                if (key && !key.endsWith('_timestamp')) {
                    keys.push(key);
                }
            }
            keys.forEach(function(key) {
                sessionStorage.removeItem(key);
                sessionStorage.removeItem(key + '_timestamp');
            });
        }
    };
    
    // ========================================
    // LAZY INITIALIZATION MANAGER
    // ========================================
    
    window.LazyInit = {
        components: {},
        
        register: function(name, initFunc, condition) {
            this.components[name] = {
                init: initFunc,
                condition: condition || function() { return true; },
                initialized: false
            };
        },
        
        initialize: function(name) {
            var component = this.components[name];
            if (component && !component.initialized && component.condition()) {
                component.init();
                component.initialized = true;
            }
        },
        
        initializeAll: function() {
            var self = this;
            Object.keys(this.components).forEach(function(name) {
                self.initialize(name);
            });
        }
    };
    
    // ========================================
    // SELECT2 OPTIMIZATION
    // ========================================
    
    // Debounced batch Select2 initialization
    var select2Queue = [];
    var processSelect2Queue = debounce(function() {
        if (select2Queue.length > 0) {
            select2Queue.forEach(function($el) {
                if (!$el.data('select2') && $el.is(':visible')) {
                    try {
                        $el.select2({
                            width: '100%',
                            allowClear: false,
                            minimumResultsForSearch: 10
                        });
                    } catch(e) {
                        console.warn('Select2 init failed:', e);
                    }
                }
            });
            select2Queue = [];
        }
    }, 300);
    
    window.queueSelect2Init = function($elements) {
        $elements.each(function() {
            var $el = $(this);
            if (select2Queue.indexOf($el[0]) === -1) {
                select2Queue.push($el);
            }
        });
        processSelect2Queue();
    };
    
    // ========================================
    // DATATABLE OPTIMIZATION
    // ========================================
    
    window.LazyDataTable = {
        tables: {},
        
        register: function(selector, options) {
            this.tables[selector] = {
                options: options,
                initialized: false
            };
        },
        
        init: function(selector) {
            var table = this.tables[selector];
            if (table && !table.initialized && $(selector).length > 0) {
                try {
                    if (typeof $.fn.DataTable !== 'undefined') {
                        $(selector).DataTable(table.options);
                        table.initialized = true;
                    }
                } catch(e) {
                    console.warn('DataTable init failed:', e);
                }
            }
        },
        
        initVisible: function() {
            var self = this;
            Object.keys(this.tables).forEach(function(selector) {
                if ($(selector).is(':visible')) {
                    self.init(selector);
                }
            });
        }
    };
    
    // ========================================
    // AJAX REQUEST COALESCING
    // ========================================
    
    var pendingRequests = {};
    
    window.coalescedAjax = function(key, ajaxOptions) {
        // Check cache first
        var cached = CachedAjax.get(key);
        if (cached !== null) {
            var deferred = $.Deferred();
            deferred.resolve(cached);
            return deferred.promise();
        }
        
        // Check if same request is pending
        if (pendingRequests[key]) {
            return pendingRequests[key];
        }
        
        // Make request and cache result
        var request = $.ajax(ajaxOptions).done(function(response) {
            CachedAjax.set(key, response);
            delete pendingRequests[key];
        }).fail(function() {
            delete pendingRequests[key];
        });
        
        pendingRequests[key] = request;
        return request;
    };
    
    // ========================================
    // TAB LAZY LOADING
    // ========================================
    
    window.LazyTabs = {
        tabs: {},
        
        register: function(tabSelector, contentSelector, loadFunc) {
            this.tabs[tabSelector] = {
                content: contentSelector,
                load: loadFunc,
                loaded: false
            };
        },
        
        init: function() {
            var self = this;
            
            // Listen for tab shown events
            $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
                var targetTab = $(e.target).attr('href');
                
                Object.keys(self.tabs).forEach(function(selector) {
                    if ($(e.target).is(selector) || $(e.target).attr('href') === selector) {
                        var tab = self.tabs[selector];
                        if (!tab.loaded) {
                            tab.load();
                            tab.loaded = true;
                        }
                    }
                });
            });
        }
    };
    
    // ========================================
    // GLOBAL INITIALIZATION
    // ========================================
    
    $(document).ready(function() {
        
        // Initialize lazy tabs
        LazyTabs.init();
        
        // Debounce scroll events
        if (window.addEventListener) {
            var scrollHandler = throttle(function() {
                $(window).trigger('scroll.optimized');
            }, 100);
            window.addEventListener('scroll', scrollHandler, { passive: true });
        }
        
        // Debounce resize events
        if (window.addEventListener) {
            var resizeHandler = debounce(function() {
                $(window).trigger('resize.optimized');
            }, 150);
            window.addEventListener('resize', resizeHandler);
        }
        
        // Initialize visible DataTables after page load
        setTimeout(function() {
            LazyDataTable.initVisible();
        }, 500);
        
        // Clear cache on logout (if logout button exists)
        $('a[href*="logout"]').on('click', function() {
            CachedAjax.clearAll();
        });
        
        console.log('Global Performance Optimizations Loaded');
    });
    
    // ========================================
    // PAGE VISIBILITY API - PAUSE WHEN HIDDEN
    // ========================================
    
    var pageHidden = false;
    
    if (typeof document.hidden !== "undefined") {
        document.addEventListener("visibilitychange", function() {
            pageHidden = document.hidden;
            if (!pageHidden) {
                // Page became visible, refresh stale data if needed
                $(document).trigger('page.visible');
            }
        });
    }
    
    window.isPageHidden = function() {
        return pageHidden;
    };
    
})(jQuery, window);
