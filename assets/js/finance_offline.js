/**
 * Financial Operations Offline Database
 * Handles: Admissions, Invoices, Payments, Daily Fees, Expenses
 */
const FinanceDB = {
    dbName: 'FinanceDB',
    version: 1,
    db: null,
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Admissions
                if (!db.objectStoreNames.contains('admissions')) {
                    const store = db.createObjectStore('admissions', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('student_code', 'student_code', { unique: false });
                }
                
                // Invoices
                if (!db.objectStoreNames.contains('invoices')) {
                    const store = db.createObjectStore('invoices', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('student_id', 'student_id', { unique: false });
                }
                
                // Payments
                if (!db.objectStoreNames.contains('payments')) {
                    const store = db.createObjectStore('payments', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('invoice_id', 'invoice_id', { unique: false });
                }
                
                // Daily Fees
                if (!db.objectStoreNames.contains('daily_fees')) {
                    const store = db.createObjectStore('daily_fees', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                }
                
                // Expenses
                if (!db.objectStoreNames.contains('expenses')) {
                    const store = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
                    store.createIndex('synced', 'synced', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                }
            };
        });
    },
    
    async save(storeName, records) {
        await this.init();
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        
        const recordsArray = Array.isArray(records) ? records : [records];
        
        for (const record of recordsArray) {
            record.synced = false;
            record.offline_timestamp = new Date().toISOString();
            store.add(record);
        }
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve({ status: 'success', count: recordsArray.length });
            tx.onerror = () => reject(tx.error);
        });
    },
    
    async getUnsynced(storeName) {
        await this.init();
        const tx = this.db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index('synced');
        
        return new Promise((resolve, reject) => {
            const request = index.getAll(false);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async markSynced(storeName, ids) {
        await this.init();
        const tx = this.db.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        
        for (const id of ids) {
            const request = store.get(id);
            request.onsuccess = () => {
                const record = request.result;
                if (record) {
                    record.synced = true;
                    record.synced_at = new Date().toISOString();
                    store.put(record);
                }
            };
        }
        
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve({ status: 'success' });
            tx.onerror = () => reject(tx.error);
        });
    },
    
    async syncAll() {
        const stores = ['admissions', 'invoices', 'payments', 'daily_fees', 'expenses'];
        const results = {};
        
        for (const store of stores) {
            const unsynced = await this.getUnsynced(store);
            if (unsynced.length > 0) {
                results[store] = await this.syncStore(store, unsynced);
            }
        }
        
        return results;
    },
    
    async syncStore(storeName, records) {
        const endpoints = {
            admissions: 'admin/sync_admissions',
            invoices: 'admin/sync_invoices',
            payments: 'admin/sync_payments',
            daily_fees: 'admin/sync_daily_fees',
            expenses: 'admin/sync_expenses'
        };
        
        try {
            const response = await fetch('<?php echo site_url(""); ?>' + endpoints[storeName], {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: records })
            });
            
            const result = await response.json();
            
            if (result.status === 'success') {
                const ids = records.map(r => r.id);
                await this.markSynced(storeName, ids);
            }
            
            return result;
        } catch (error) {
            return { status: 'error', message: error.message };
        }
    },
    
    async getStats() {
        await this.init();
        const stats = {};
        const stores = ['admissions', 'invoices', 'payments', 'daily_fees', 'expenses'];
        
        for (const storeName of stores) {
            const unsynced = await this.getUnsynced(storeName);
            stats[storeName] = unsynced.length;
        }
        
        return stats;
    }
};

// Network Monitor
const FinanceNetworkMonitor = {
    isOnline: navigator.onLine,
    syncInProgress: false,
    
    init() {
        this.updateStatus();
        
        window.addEventListener('online', async () => {
            this.isOnline = true;
            this.updateStatus();
            await this.autoSync();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateStatus();
        });
    },
    
    updateStatus() {
        const indicator = document.getElementById('finance_network_status');
        if (!indicator) return;
        
        if (this.isOnline) {
            indicator.innerHTML = '<i class="fa fa-wifi"></i> Online';
            indicator.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else {
            indicator.innerHTML = '<i class="fa fa-wifi-slash"></i> Offline Mode';
            indicator.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
    },
    
    async autoSync() {
        if (this.syncInProgress) return;
        
        this.syncInProgress = true;
        const stats = await FinanceDB.getStats();
        const total = Object.values(stats).reduce((a, b) => a + b, 0);
        
        if (total > 0) {
            showAjaxModal_alert(`Syncing ${total} offline records...`, 'loading');
            const results = await FinanceDB.syncAll();
            showAjaxModal_alert('Sync completed successfully', 'success', false);
        }
        
        this.syncInProgress = false;
    },
    
    async showSyncStatus() {
        const stats = await FinanceDB.getStats();
        let message = 'Offline Records:\n';
        message += `Admissions: ${stats.admissions}\n`;
        message += `Invoices: ${stats.invoices}\n`;
        message += `Payments: ${stats.payments}\n`;
        message += `Daily Fees: ${stats.daily_fees}\n`;
        message += `Expenses: ${stats.expenses}`;
        alert(message);
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    FinanceNetworkMonitor.init();
});
