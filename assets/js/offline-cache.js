/**
 * Offline Data Cache Manager
 * Pre-caches essential data for offline use
 */

class OfflineCache {
    constructor() {
        this.tables = ['student', 'teacher', 'class', 'invoice', 'payment'];
        this.cacheInterval = null;
    }

    async cacheAll() {
        if (!navigator.onLine) return;

        for (const table of this.tables) {
            try {
                await this.cacheTable(table);
            } catch (error) {
                console.warn(`Failed to cache ${table}:`, error.message);
            }
        }
    }

    async cacheTable(table) {
        // Build proper absolute URL - use global base_url if available
        const baseUrlValue = (typeof base_url !== 'undefined' ? base_url : window.location.origin + '/');
        const syncUrl = baseUrlValue + 'sync/cache_data';
        
        // Debug logging
        console.log('Cache URL built:', syncUrl);
        console.log('Current pathname:', window.location.pathname);
        
        const response = await fetch(`${syncUrl}?table=${table}&limit=500`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error(`Expected JSON, got ${contentType}`);
        }

        let result;
        try {
            result = await response.json();
        } catch (e) {
            throw new Error('Invalid JSON response');
        }

        if (result.success && result.data) {
            await this.saveToIndexedDB(table, result.data);
            console.log(`Cached ${result.count} records from ${table}`);
        }
    }

    async saveToIndexedDB(table, records) {
        if (typeof offlineDB === 'undefined' || !offlineDB.db) return;

        try {
            const tx = offlineDB.db.transaction([table], 'readwrite');
            const store = tx.objectStore(table);

            for (const record of records) {
                record.synced = true;
                record.cached = true;
                record.cache_timestamp = Date.now();
                await store.put(record);
            }
        } catch (error) {
            console.warn(`Failed to save ${table} to IndexedDB:`, error.message);
        }
    }

    startAutoCache() {
        this.cacheInterval = setInterval(() => {
            if (navigator.onLine) {
                this.cacheAll();
            }
        }, 300000); // Every 5 minutes
    }

    stopAutoCache() {
        if (this.cacheInterval) {
            clearInterval(this.cacheInterval);
        }
    }
}

window.offlineCache = new OfflineCache();

// Auto-cache DISABLED - endpoint returning 500 errors
// Re-enable when sync system is fully operational
// document.addEventListener('DOMContentLoaded', () => {
//     if (navigator.onLine && typeof offlineDB !== 'undefined') {
//         setTimeout(() => offlineCache.cacheAll(), 2000);
//         offlineCache.startAutoCache();
//     }
// });
