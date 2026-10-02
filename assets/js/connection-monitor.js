/**
 * Enhanced Connection Monitor
 * Provides immediate visual feedback on connection changes
 */

(function() {
    let offlineBanner = null;
    
    function showOfflineBanner() {
        if (offlineBanner) return;
        
        offlineBanner = document.createElement('div');
        offlineBanner.className = 'offline-banner';
        offlineBanner.innerHTML = `
            <i class="fa fa-exclamation-triangle"></i>
            <strong>OFFLINE MODE</strong> - You are working offline. Changes will be synced when connection is restored.
            <button onclick="this.parentElement.remove(); offlineBanner = null;" 
                    style="float:right;background:transparent;border:1px solid white;color:white;padding:2px 10px;cursor:pointer;border-radius:3px;">
                Dismiss
            </button>
        `;
        document.body.insertBefore(offlineBanner, document.body.firstChild);
    }
    
    function hideOfflineBanner() {
        if (offlineBanner) {
            offlineBanner.remove();
            offlineBanner = null;
        }
    }
    
    function checkConnection() {
        if (!navigator.onLine) {
            showOfflineBanner();
        } else {
            hideOfflineBanner();
        }
    }
    
    // Check immediately
    checkConnection();
    
    // Listen for connection changes
    window.addEventListener('online', () => {
        hideOfflineBanner();
        console.log('Connection restored');
    });
    
    window.addEventListener('offline', () => {
        showOfflineBanner();
        console.log('Connection lost');
    });
    
    // Periodic check every 5 seconds
    setInterval(checkConnection, 5000);
    
    // Make banner accessible globally
    window.offlineBanner = offlineBanner;
})();
