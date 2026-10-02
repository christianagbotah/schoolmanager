/**
 * Complete Offline Sync - All Fields Mapped
 * Based on actual database structures
 */
const CompleteSync = {
    dbName: 'SchoolDB',
    version: 1,
    
    // Field mappings for each table
    fieldMaps: {
        student: ['student_code', 'name', 'first_name', 'middle_name', 'last_name', 'birthday', 'sex', 'religion', 'blood_group', 'nationality', 'ghana_card_id', 'address', 'admission_date', 'phone', 'email', 'parent_id', 'class_id', 'section_id'],
        
        invoice: ['student_id', 'title', 'description', 'amount', 'discount', 'amount_paid', 'due', 'due_date', 'status', 'residence_type', 'year', 'term', 'sem', 'class_id'],
        
        payment: ['student_id', 'invoice_id', 'amount', 'payment_method', 'description', 'timestamp', 'year', 'term', 'sem', 'class_id', 'issuer_id'],
        
        daily_fee_transactions: ['student_id', 'feeding_amount', 'breakfast_amount', 'classes_amount', 'water_amount', 'transport_amount', 'total_amount', 'payment_type', 'payment_method', 'collected_by', 'collection_point', 'year', 'term'],
        
        invoice_items: ['invoice_id', 'item_name', 'item_description', 'amount', 'quantity', 'total']
    },
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                Object.keys(this.fieldMaps).forEach(table => {
                    if (!db.objectStoreNames.contains(table)) {
                        const store = db.createObjectStore(table, {keyPath: 'id', autoIncrement: true});
                        store.createIndex('synced', 'synced', {unique: false});
                    }
                });
            };
        });
    },
    
    async save(table, data) {
        const db = await this.init();
        const tx = db.transaction([table], 'readwrite');
        const store = tx.objectStore(table);
        
        // Only save mapped fields
        const record = {synced: false, timestamp: Date.now()};
        this.fieldMaps[table].forEach(field => {
            if (data[field] !== undefined) record[field] = data[field];
        });
        
        return new Promise((resolve, reject) => {
            const req = store.add(record);
            req.onsuccess = () => resolve({status: 'success', id: req.result});
            req.onerror = () => reject(req.error);
        });
    },
    
    async getUnsynced(table) {
        const db = await this.init();
        const tx = db.transaction([table], 'readonly');
        const index = tx.objectStore(table).index('synced');
        return new Promise((resolve, reject) => {
            const req = index.getAll(false);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },
    
    async syncAll() {
        const tables = Object.keys(this.fieldMaps);
        const results = {};
        
        for (const table of tables) {
            const unsynced = await this.getUnsynced(table);
            if (unsynced.length > 0) {
                results[table] = await this.syncTable(table, unsynced);
            }
        }
        
        return results;
    },
    
    async syncTable(table, records) {
        try {
            const response = await fetch(`<?php echo site_url("admin/sync_"); ?>${table}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({records})
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                await this.markSynced(table, records.map(r => r.id));
            }
            
            return result;
        } catch (error) {
            return {status: 'error', message: error.message};
        }
    },
    
    async markSynced(table, ids) {
        const db = await this.init();
        const tx = db.transaction([table], 'readwrite');
        const store = tx.objectStore(table);
        
        for (const id of ids) {
            const req = store.get(id);
            req.onsuccess = () => {
                const record = req.result;
                if (record) {
                    record.synced = true;
                    store.put(record);
                }
            };
        }
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve({status: 'success'});
            tx.onerror = () => reject(tx.error);
        });
    }
};

// Auto-sync
window.addEventListener('online', () => CompleteSync.syncAll());
document.addEventListener('DOMContentLoaded', () => CompleteSync.init());
