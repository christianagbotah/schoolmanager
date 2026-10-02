/**
 * Offline Sync Client
 * Handles automatic sync for offline devices
 */

class OfflineSyncClient {
    constructor(apiUrl, deviceId, userId, userType) {
        this.apiUrl = apiUrl;
        this.deviceId = deviceId;
        this.userId = userId;
        this.userType = userType;
        this.syncInterval = 60000; // 1 minute
        this.isOnline = navigator.onLine;
        this.init();
    }
    
    init() {
        // Register device
        this.registerDevice();
        
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.sync();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        
        // Auto-sync when online
        setInterval(() => {
            if(this.isOnline) {
                this.sync();
            }
        }, this.syncInterval);
    }
    
    registerDevice() {
        $.post(this.apiUrl + '/sync_api/register', {
            device_id: this.deviceId,
            device_name: navigator.userAgent,
            user_id: this.userId,
            user_type: this.userType
        });
    }
    
    sync() {
        this.push().then(() => {
            this.pull();
        });
    }
    
    push() {
        return $.post(this.apiUrl + '/sync_api/push', {
            device_id: this.deviceId
        }).done(response => {
            console.log('Pushed ' + response.synced + ' records');
        });
    }
    
    pull() {
        const lastSync = localStorage.getItem('last_sync') || '2000-01-01 00:00:00';
        
        $.post(this.apiUrl + '/sync_api/pull', {
            device_id: this.deviceId,
            last_sync: lastSync
        }).done(response => {
            if(response.changes) {
                this.applyChanges(response.changes);
                localStorage.setItem('last_sync', new Date().toISOString());
            }
        });
    }
    
    applyChanges(changes) {
        // Apply changes to local database
        for(let table in changes) {
            console.log('Applying ' + changes[table].length + ' changes to ' + table);
            // Implementation depends on local storage strategy
        }
    }
    
    queueChange(table, recordId, operation, data) {
        // Add to sync queue
        $.post(this.apiUrl + '/sync_api/queue', {
            device_id: this.deviceId,
            table_name: table,
            record_id: recordId,
            operation: operation,
            data: JSON.stringify(data)
        });
    }
}

// Initialize on page load
$(document).ready(function() {
    if(typeof SYNC_CONFIG !== 'undefined') {
        window.syncClient = new OfflineSyncClient(
            SYNC_CONFIG.apiUrl,
            SYNC_CONFIG.deviceId,
            SYNC_CONFIG.userId,
            SYNC_CONFIG.userType
        );
    }
});
