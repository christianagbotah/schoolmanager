/**
 * Advanced Offline Database Manager
 * Full CRUD operations with IndexedDB
 */

class OfflineDB {
    constructor() {
        this.dbName = 'schoolmanager_offline';
        this.dbVersion = 2;
        this.db = null;
        this.userId = null;
        this.stores = ['students', 'teachers', 'classes', 'invoices', 'payments', 'sync_queue'];
    }

    async init(userId) {
        this.userId = userId;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                
                this.stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { keyPath: 'local_id', autoIncrement: true });
                        store.createIndex('id', 'id', { unique: false });
                        store.createIndex('user_id', 'user_id', { unique: false });
                        store.createIndex('synced', 'synced', { unique: false });
                        store.createIndex('timestamp', 'timestamp', { unique: false });
                        store.createIndex('operation', 'operation', { unique: false });
                    }
                });
            };
        });
    }

    async create(table, data) {
        // Check if database is initialized
        if (!this.db) {
            console.warn('OfflineDB not initialized. Skipping create operation.');
            return Promise.resolve(null);
        }
        
        const record = {
            ...data,
            user_id: this.userId,
            synced: false,
            operation: 'create',
            timestamp: Date.now(),
            local_id: `local_${Date.now()}_${Math.random()}`
        };

        await this.save(table, record);
        await this.queueSync(table, 'insert', record);
        return record;
    }

    async read(table, filters = {}) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([table], 'readonly');
            const store = tx.objectStore(table);
            const request = store.getAll();
            
            request.onsuccess = () => {
                let results = request.result.filter(r => r.user_id === this.userId);
                
                Object.keys(filters).forEach(key => {
                    results = results.filter(r => r[key] == filters[key]);
                });
                
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async update(table, id, data) {
        const existing = await this.getById(table, id);
        if (!existing) throw new Error('Record not found');

        const updated = {
            ...existing,
            ...data,
            synced: false,
            operation: 'update',
            timestamp: Date.now()
        };

        await this.save(table, updated);
        await this.queueSync(table, 'update', updated);
        return updated;
    }

    async delete(table, id) {
        const existing = await this.getById(table, id);
        if (!existing) throw new Error('Record not found');

        existing.synced = false;
        existing.operation = 'delete';
        existing.timestamp = Date.now();

        await this.save(table, existing);
        await this.queueSync(table, 'delete', existing);
        return true;
    }

    async save(table, record) {
        // Check if database is initialized
        if (!this.db) {
            console.warn('OfflineDB not initialized. Skipping save operation.');
            return Promise.resolve(null);
        }
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([table], 'readwrite');
            const store = tx.objectStore(table);
            const request = store.put(record);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(table, id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([table], 'readonly');
            const store = tx.objectStore(table);
            const index = store.index('id');
            const request = index.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async queueSync(table, operation, record) {
        // Check if database is initialized
        if (!this.db) {
            console.warn('OfflineDB not initialized. Skipping queue sync operation.');
            return Promise.resolve(null);
        }
        
        const syncRecord = {
            table_name: table,
            operation: operation,
            record_data: record,
            user_id: this.userId,
            timestamp: Date.now(),
            synced: false
        };

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['sync_queue'], 'readwrite');
            const store = tx.objectStore('sync_queue');
            const request = store.add(syncRecord);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPendingSync() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['sync_queue'], 'readonly');
            const store = tx.objectStore('sync_queue');
            const index = store.index('synced');
            const request = index.getAll(false);
            
            request.onsuccess = () => resolve(request.result.filter(r => r.user_id === this.userId));
            request.onerror = () => reject(request.error);
        });
    }

    async clearSynced(localId) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(['sync_queue'], 'readwrite');
            const store = tx.objectStore('sync_queue');
            const request = store.delete(localId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

window.offlineDB = new OfflineDB();
