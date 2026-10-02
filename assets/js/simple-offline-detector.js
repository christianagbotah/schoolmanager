// Simple Offline Detector - Run once at page load
(function() {
    console.log('[Offline Detector] Script loaded');
    
    let isOnline = navigator.onLine;
    
    function updateBadge(online) {
        const badge = document.getElementById('offline-status-badge');
        
        if (!badge) {
            // Badge doesn't exist on this page, skip
            return;
        }
        
        const statusDot = badge.querySelector('.status-dot');
        const statusText = badge.querySelector('span:last-child');
        
        // Update badge classes
        if (online) {
            badge.classList.remove('offline');
            badge.classList.add('online');
            if (statusDot) {
                statusDot.classList.remove('offline');
                statusDot.classList.add('online');
            }
            if (statusText) {
                statusText.textContent = 'Online';
            }
        } else {
            badge.classList.remove('online');
            badge.classList.add('offline');
            if (statusDot) {
                statusDot.classList.remove('online');
                statusDot.classList.add('offline');
            }
            if (statusText) {
                statusText.textContent = 'Offline';
            }
        }
    }
    
    // Test real connectivity by trying to fetch base_url
    function checkConnectivity() {
        // Use base_url if available, otherwise use current origin
        const testUrl = (typeof base_url !== 'undefined' ? base_url : window.location.origin) + '?_=' + Date.now();
        
        fetch(testUrl, {
            method: 'HEAD',
            cache: 'no-cache'
        })
        .then(function() {
            // Success - we're online
            console.log('[Offline Detector] ONLINE (server reachable)');
            isOnline = true;
            updateBadge(true);
        })
        .catch(function() {
            // Failed - we're offline
            console.log('[Offline Detector] OFFLINE (server unreachable)');
            isOnline = false;
            updateBadge(false);
        });
    }
    
    // Run once at page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            checkConnectivity();
        });
    } else {
        checkConnectivity();
    }
    
    // Listen for browser online/offline events only
    window.addEventListener('online', function() {
        console.log('[Offline Detector] Browser reports ONLINE');
        isOnline = true;
        updateBadge(true);
    });
    
    window.addEventListener('offline', function() {
        console.log('[Offline Detector] Browser reports OFFLINE');
        isOnline = false;
        updateBadge(false);
    });
    
    console.log('[Offline Detector] Initialized. Checks once at page load only.');
})();
