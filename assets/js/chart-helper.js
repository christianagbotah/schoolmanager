/**
 * Enterprise-Grade Chart Manager
 * Prevents chart looping with singleton pattern and request management
 */
(function() {
    'use strict';
    
    // Singleton Chart Manager
    window.ChartManager = window.ChartManager || (function() {
        const charts = {};
        const pendingRequests = {};
        const initialized = {};
        
        return {
            /**
             * Create or update chart with duplicate prevention
             */
            createChart: function(canvasId, config) {
                // Return existing if already created
                if (charts[canvasId]) {
                    console.log('Chart exists, destroying first:', canvasId);
                    try {
                        charts[canvasId].destroy();
                    } catch(e) {}
                    delete charts[canvasId];
                }
                
                const canvas = document.getElementById(canvasId);
                if (!canvas) {
                    console.error('Canvas not found:', canvasId);
                    return null;
                }
                
                // Create new chart
                const ctx = canvas.getContext('2d');
                charts[canvasId] = new Chart(ctx, config);
                console.log('Chart created:', canvasId);
                return charts[canvasId];
            },
            
            /**
             * Load chart data with AJAX duplicate prevention
             */
            loadChartData: function(key, url, data, successCallback) {
                // Cancel pending request
                if (pendingRequests[key]) {
                    console.log('Aborting duplicate request:', key);
                    pendingRequests[key].abort();
                }
                
                // Create new request
                pendingRequests[key] = $.ajax({
                    url: url,
                    type: 'GET',
                    data: data || {},
                    dataType: 'json',
                    success: function(response) {
                        delete pendingRequests[key];
                        if (successCallback) successCallback(response);
                    },
                    error: function(xhr) {
                        if (xhr.statusText !== 'abort') {
                            console.error('Chart data load failed:', key);
                        }
                        delete pendingRequests[key];
                    }
                });
            },
            
            /**
             * Initialize dashboard once
             */
            initDashboard: function(dashboardId, initFunction) {
                if (initialized[dashboardId]) {
                    console.log('Dashboard already initialized:', dashboardId);
                    return false;
                }
                initialized[dashboardId] = true;
                console.log('Initializing dashboard:', dashboardId);
                if (initFunction) initFunction();
                return true;
            },
            
            /**
             * Destroy specific chart
             */
            destroyChart: function(canvasId) {
                if (charts[canvasId]) {
                    try {
                        charts[canvasId].destroy();
                    } catch(e) {}
                    delete charts[canvasId];
                }
            },
            
            /**
             * Destroy all charts
             */
            destroyAll: function() {
                Object.keys(charts).forEach(id => this.destroyChart(id));
                Object.keys(pendingRequests).forEach(key => {
                    if (pendingRequests[key]) pendingRequests[key].abort();
                });
            }
        };
    })();
    
    // Legacy compatibility
    window.createOrUpdateChart = function(canvasId, config) {
        return window.ChartManager.createChart(canvasId, config);
    };
    
    window.destroyChart = function(canvasId) {
        return window.ChartManager.destroyChart(canvasId);
    };
    
    window.destroyAllCharts = function() {
        return window.ChartManager.destroyAll();
    };
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
        window.ChartManager.destroyAll();
    });
    
})();
