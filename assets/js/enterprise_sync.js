/**
 * Enterprise-Grade Offline/Online Sync System
 * Handles: Conflict Resolution, Version Control, Transaction Safety
 */
const EnterpriseSync = {
    dbName: 'SchoolFinanceDB',
    version: 2,
    db: null,
    deviceId: null,
    
    async init() {
        this.deviceId = this.getDeviceId();
        
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                const stores = ['students', 'invoices', 'payments', 'daily_fees', 'invoice_items'];
                
                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, {keyPath: 'local_id', autoIncrement: true});
                        store.createIndex('sync_status', 'sync_status', {unique: false});
                        store.createIndex('server_id', 'server_id', {unique: false});
                        store.createIndex('version', 'version', {unique: false});
                        store.createIndex('device_id', 'device_id', {unique: false});
                    }
                });
            };
        });
    },
    
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    },
    
    async save(storeName, data) {
        await this.init();
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        
        const record = {
            ...data,
            sync_status: 'PENDING',
            device_id: this.deviceId,
            version: 1,
            created_at: Date.now(),
            modified_at: Date.now()
        };
        
        return new Promise((resolve, reject) => {
            const request = store.add(record);
            request.onsuccess = () => resolve({status: 'success', local_id: request.result});
            request.onerror = () => reject(request.error);
        });
    },
    
    async update(storeName, localId, data) {
        await this.init();
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        
        return new Promise((resolve, reject) => {
            const getRequest = store.get(localId);
            getRequest.onsuccess = () => {
                const record = getRequest.result;
                if (record) {
                    Object.assign(record, data);
                    record.version++;
                    record.modified_at = Date.now();
                    record.sync_status = 'PENDING';
                    
                    const updateRequest = store.put(record);
                    updateRequest.onsuccess = () => resolve({status: 'success'});
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    reject(new Error('Record not found'));
                }
            };
        });
    },
    
    async getPending(storeName) {
        await this.init();
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index('sync_status');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll('PENDING');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async syncToServer() {
        const stores = ['students', 'invoices', 'payments', 'daily_fees', 'invoice_items'];
        const results = {};
        
        for (const store of stores) {
            const pending = await this.getPending(store);
            if (pending.length > 0) {
                results[store] = await this.syncStore(store, pending);
            }
        }
        
        return results;
    },
    
    async syncStore(storeName, records) {
        const endpoints = {
            students: 'admin/sync_students',
            invoices: 'admin/sync_invoices',
            payments: 'admin/sync_payments',
            daily_fees: 'admin/sync_daily_fees',
            invoice_items: 'admin/sync_invoice_items'
        };
        
        try {
            const response = await fetch('<?php echo site_url(""); ?>' + endpoints[storeName], {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    records: records,
                    device_id: this.deviceId
                })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                await this.markSynced(storeName, records, result.server_ids || []);
            } else if (result.status === 'conflict') {
                await this.handleConflicts(storeName, result.conflicts);
            }
            
            return result;
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    },
    
    async markSynced(storeName, records, serverIds) {
        await this.init();
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        
        records.forEach((record, index) => {
            record.sync_status = 'SYNCED';
            record.server_id = serverIds[index] || null;
            record.synced_at = Date.now();
            store.put(record);
        });
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve({status: 'success'});
            tx.onerror = () => reject(tx.error);
        });
    },
    
    async handleConflicts(storeName, conflicts) {
        // Conflict resolution: Server wins by default
        await this.init();
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        
        conflicts.forEach(conflict => {
            const record = conflict.local_record;
            record.sync_status = 'CONFLICT';
            record.server_version = conflict.server_record;
            store.put(record);
        });
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve({status: 'conflicts_marked'});
            tx.onerror = () => reject(tx.error);
        });
    },
    
    async getStats() {
        const stores = ['students', 'invoices', 'payments', 'daily_fees', 'invoice_items'];
        const stats = {};
        
        for (const store of stores) {
            const pending = await this.getPending(store);
            stats[store] = pending.length;
        }
        
        return stats;
    }
};

// Auto-sync on network reconnection
window.addEventListener('online', async () => {
    console.log('Network restored. Starting auto-sync...');
    const results = await EnterpriseSync.syncToServer();
    console.log('Sync results:', results);
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    EnterpriseSync.init();
});
