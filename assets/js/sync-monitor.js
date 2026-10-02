/**
 * Sync Monitor Dashboard
 * Real-time monitoring of sync operations
 */

class SyncMonitor {
    constructor() {
        this.stats = {
            totalSynced: 0,
            totalFailed: 0,
            avgSyncTime: 0,
            lastSyncTime: null
        };
        this.init();
    }

    init() {
        this.startMonitoring();
    }

    startMonitoring() {
        setInterval(() => this.updateStats(), 5000);
    }

    async updateStats() {
        if (!syncManager) return;

        const pending = await syncManager.getPendingCount();
        const status = {
            online: syncManager.isOnline,
            pending: pending,
            syncing: syncManager.syncInProgress,
            timestamp: new Date().toISOString()
        };

        this.logStatus(status);
        return status;
    }

    logStatus(status) {
        console.log('[Sync Monitor]', status);
    }

    async getDetailedStats() {
        const db = syncManager.db;
        const tx = db.transaction(['pending_requests'], 'readonly');
        const store = tx.objectStore('pending_requests');
        const all = await store.getAll();

        return {
            total: all.length,
            oldest: all.length > 0 ? new Date(Math.min(...all.map(r => r.timestamp))) : null,
            newest: all.length > 0 ? new Date(Math.max(...all.map(r => r.timestamp))) : null
        };
    }
}

// Auto-initialize if syncManager exists
if (typeof syncManager !== 'undefined') {
    window.syncMonitor = new SyncMonitor();
}
