/**
 * IndexedDB Handler for Offline Attendance
 */
const AttendanceDB = {
    dbName: 'AttendanceDB',
    version: 1,
    db: null,
    
    /**
     * Initialize IndexedDB
     */
    init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('attendance')) {
                    const store = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('student_id', 'student_id', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                    store.createIndex('synced', 'synced', { unique: false });
                }
            };
        });
    },
    
    /**
     * Save attendance records
     */
    async save(records) {
        await this.init();
        const tx = this.db.transaction(['attendance'], 'readwrite');
        const store = tx.objectStore('attendance');
        
        for (const record of records) {
            record.synced = false;
            record.timestamp = new Date().toISOString();
            store.add(record);
        }
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve({ status: 'success' });
            tx.onerror = () => reject(tx.error);
        });
    },
    
    /**
     * Get unsynced records
     */
    async getUnsynced() {
        await this.init();
        const tx = this.db.transaction(['attendance'], 'readonly');
        const store = tx.objectStore('attendance');
        const index = store.index('synced');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(false);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    /**
     * Mark records as synced
     */
    async markSynced(ids) {
        await this.init();
        const tx = this.db.transaction(['attendance'], 'readwrite');
        const store = tx.objectStore('attendance');
        
        for (const id of ids) {
            const request = store.get(id);
            request.onsuccess = () => {
                const record = request.result;
                if (record) {
                    record.synced = true;
                    store.put(record);
                }
            };
        }
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve({ status: 'success' });
            tx.onerror = () => reject(tx.error);
        });
    },
    
    /**
     * Sync to server
     */
    async syncToServer(url) {
        const unsynced = await this.getUnsynced();
        
        if (unsynced.length === 0) {
            return { status: 'success', message: 'Nothing to sync' };
        }
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: unsynced })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                const ids = unsynced.map(r => r.id);
                await this.markSynced(ids);
            }
            
            return result;
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    }
};

/**
 * Network status monitor
 */
const NetworkMonitor = {
    isOnline: navigator.onLine,
    
    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.onStatusChange('online');
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.onStatusChange('offline');
        });
    },
    
    onStatusChange(status) {
        console.log('Network status:', status);
        
        if (status === 'online') {
            // Auto-sync when back online
            AttendanceDB.syncToServer('<?php echo site_url("attendance_enterprise/sync"); ?>');
        }
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    NetworkMonitor.init();
});
