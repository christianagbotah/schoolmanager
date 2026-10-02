/**
 * Offline/Online Sync Manager
 * Handles automatic synchronization and connection monitoring
 */

class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInterval = 30000; // 30 seconds
        this.syncTimer = null;
        this.baseUrl = (typeof base_url !== 'undefined' ? base_url : window.location.origin + '/');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateConnectionStatus();
        this.startAutoSync();
        this.showSyncIndicator();
    }
    
    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.syncNow();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });
    }
    
    updateConnectionStatus() {
        const indicator = document.getElementById('sync-status-indicator');
        if (!indicator) return;
        
        if (this.isOnline) {
            indicator.className = 'sync-status online';
            indicator.innerHTML = '<i class="fa fa-wifi"></i> Online';
        } else {
            indicator.className = 'sync-status offline';
            indicator.innerHTML = '<i class="fa fa-wifi" style="text-decoration: line-through;"></i> Offline';
        }
    }
    
    showSyncIndicator() {
        if (document.getElementById('sync-status-indicator')) return;
        
        const indicator = document.createElement('div');
        indicator.id = 'sync-status-indicator';
        indicator.className = 'sync-status';
        document.body.appendChild(indicator);
        
        const style = document.createElement('style');
        style.textContent = `
            .sync-status {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
                z-index: 9999;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .sync-status.online {
                background: #27ae60;
                color: white;
            }
            .sync-status.offline {
                background: #e74c3c;
                color: white;
            }
            .sync-status.syncing {
                background: #f39c12;
                color: white;
            }
        `;
        document.head.appendChild(style);
        
        this.updateConnectionStatus();
    }
    
    startAutoSync() {
        if (this.syncTimer) clearInterval(this.syncTimer);
        
        this.syncTimer = setInterval(() => {
            if (this.isOnline) {
                this.syncNow();
            }
        }, this.syncInterval);
    }
    
    async syncNow() {
        if (!this.isOnline) return;
        
        const indicator = document.getElementById('sync-status-indicator');
        if (indicator) {
            indicator.className = 'sync-status syncing';
            indicator.innerHTML = '<i class="fa fa-refresh fa-spin"></i> Syncing...';
        }
        
        try {
            // Push local changes
            const pushResponse = await fetch(this.baseUrl + 'sync/push_changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const pushData = await pushResponse.json();
            
            // Pull remote changes
            const pullResponse = await fetch(this.baseUrl + 'sync/pull_changes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const pullData = await pullResponse.json();
            
            console.log('Sync completed:', { push: pushData, pull: pullData });
            
            if (pushData.conflicts > 0) {
                this.showConflictNotification(pushData.conflicts);
            }
            
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            this.updateConnectionStatus();
        }
    }
    
    showConflictNotification(count) {
        if (typeof toastr !== 'undefined') {
            toastr.warning(`${count} sync conflict(s) detected. Please review.`, 'Sync Conflicts');
        }
    }
    
    // Queue CRUD operation
    queueOperation(table, recordId, operation, data) {
        const queueData = {
            table_name: table,
            record_id: recordId,
            operation: operation,
            data: data,
            timestamp: Date.now()
        };
        
        // Store in localStorage as backup
        const queue = JSON.parse(localStorage.getItem('sync_queue') || '[]');
        queue.push(queueData);
        localStorage.setItem('sync_queue', JSON.stringify(queue));
        
        // Send to server queue
        fetch(this.baseUrl + 'sync/queue_operation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queueData)
        }).catch(err => console.log('Queued locally:', err));
    }
}

// Initialize sync manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.syncManager = new SyncManager();
    });
} else {
    window.syncManager = new SyncManager();
}
