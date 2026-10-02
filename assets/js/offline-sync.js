/**
 * Offline/Online Sync System
 * Handles data synchronization when connection is lost/restored
 */

class OfflineSyncManager {
    constructor() {
        this.dbName = 'schoolmanager_offline';
        this.dbVersion = 1;
        this.db = null;
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.userId = null;
        this.syncInterval = null;
        this.init();
    }

    async init() {
        await this.initDB();
        this.setupEventListeners();
        this.updateConnectionStatus();
        this.startAutoSync();
        if (this.isOnline) {
            this.syncPendingData();
        }
    }

    setUserId(userId) {
        this.userId = userId;
        if (window.offlineDB) {
            window.offlineDB.init(userId);
        }
    }

    startAutoSync() {
        this.syncInterval = setInterval(() => {
            if (this.isOnline && !this.syncInProgress) {
                this.syncPendingData();
            }
        }, 30000);
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('pending_requests')) {
                    const store = db.createObjectStore('pending_requests', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('synced', 'synced', { unique: false });
                }
            };
        });
    }

    setupEventListeners() {
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Intercept form submissions
        document.addEventListener('submit', (e) => {
            if (!this.isOnline && e.target.matches('form[data-sync]')) {
                e.preventDefault();
                this.queueFormData(e.target);
            }
        });
    }

    handleOnline() {
        this.isOnline = true;
        this.updateConnectionStatus();
        // Remove any offline notification first
        this.removeOfflineNotification();
        // Disabled connection restored notification
        // this.showNotification('✅ Connection restored. System is online and ready to work.', 'success', 60000);
        setTimeout(() => this.syncPendingData(), 1000);
    }

    handleOffline() {
        this.isOnline = false;
        this.updateConnectionStatus();
        // Disabled offline notification
        // this.showNotification('⚠️ You are offline. System might not respond now until connection is restored.', 'warning', null);
    }

    updateConnectionStatus() {
        let indicator = document.getElementById('connection-status');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'connection-status';
            indicator.style.cssText = 'position:fixed;top:10px;right:10px;padding:8px 16px;border-radius:20px;font-size:12px;font-weight:bold;z-index:9999;transition:all 0.3s ease;';
            document.body.appendChild(indicator);
        }
        
        indicator.className = this.isOnline ? 'online' : 'offline';
        indicator.textContent = this.isOnline ? '🟢 Online' : '🔴 Offline';
        indicator.style.backgroundColor = this.isOnline ? '#28a745' : '#dc3545';
        indicator.style.color = 'white';
        
        if (!this.isOnline) {
            indicator.style.animation = 'pulse 2s infinite';
        } else {
            indicator.style.animation = 'none';
        }
    }

    async queueFormData(form) {
        const formData = new FormData(form);
        const data = {
            url: form.action,
            method: form.method || 'POST',
            data: Object.fromEntries(formData),
            timestamp: Date.now(),
            synced: false
        };

        await this.addToQueue(data);
        this.showNotification('Data saved locally. Will sync when online.', 'info');
    }

    async addToQueue(data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pending_requests'], 'readwrite');
            const store = transaction.objectStore('pending_requests');
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async syncPendingData() {
        if (this.syncInProgress || !this.isOnline) return;
        
        this.syncInProgress = true;
        const pending = await this.getPendingRequests();
        
        if (pending.length === 0) {
            this.syncInProgress = false;
            return;
        }

        let synced = 0;
        for (const item of pending) {
            try {
                await this.syncRequest(item);
                await this.markAsSynced(item.id);
                synced++;
            } catch (error) {
                console.error('Sync failed for item:', item.id, error);
            }
        }

        this.syncInProgress = false;
        if (synced > 0) {
            this.showNotification(`Successfully synced ${synced} item(s)`, 'success');
        }
    }

    async getPendingRequests() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pending_requests'], 'readonly');
            const store = transaction.objectStore('pending_requests');
            const request = store.getAll();
            
            request.onsuccess = () => {
                const results = request.result.filter(item => item.synced === false || item.synced === 0);
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async syncRequest(item) {
        const payload = {
            table: item.table_name || item.data.table,
            operation: item.operation || item.data.operation,
            record: item.record_data || item.data,
            user_id: this.userId,
            timestamp: item.timestamp
        };

        // Build proper absolute URL - use global base_url if available
        const baseUrlValue = (typeof base_url !== 'undefined' ? base_url : window.location.origin + '/');
        const syncUrl = baseUrlValue + 'sync/push';

        const response = await fetch(item.url || syncUrl, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Sync failed');
        return response.json();
    }

    async markAsSynced(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['pending_requests'], 'readwrite');
            const store = transaction.objectStore('pending_requests');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    showNotification(message, type = 'info', duration = 8000) {
        let container = document.getElementById('sync-notifications');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sync-notifications';
            container.style.cssText = 'position:fixed;top:60px;right:10px;width:350px;z-index:9998;';
            document.body.appendChild(container);
        }

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show`;
        notification.style.cssText = 'margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.15);';
        
        // Add a data attribute to identify offline notifications
        if (type === 'warning' && message.includes('offline')) {
            notification.setAttribute('data-offline-notification', 'true');
        }
        
        notification.innerHTML = `
            ${message}
            <button type="button" class="close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Only auto-remove if duration is set (not null)
        if (duration !== null) {
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, duration);
        }
    }

    removeOfflineNotification() {
        const offlineNotif = document.querySelector('[data-offline-notification="true"]');
        if (offlineNotif) {
            offlineNotif.remove();
        }
    }

    async getPendingCount() {
        const pending = await this.getPendingRequests();
        return pending.length;
    }
}

// Initialize on page load
let syncManager;
document.addEventListener('DOMContentLoaded', () => {
    syncManager = new OfflineSyncManager();
});
