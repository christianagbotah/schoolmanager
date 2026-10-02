/**
 * Offline CRUD Operations Handler
 * Automatically routes operations to server or local DB
 */

class OfflineCRUD {
    constructor() {
        this.baseUrl = window.location.origin;
    }

    async request(url, method, data) {
        if (navigator.onLine) {
            return await this.serverRequest(url, method, data);
        } else {
            return await this.offlineRequest(url, method, data);
        }
    }

    async serverRequest(url, method, data) {
        const options = {
            method: method,
            headers: {'Content-Type': 'application/json'}
        };

        if (method !== 'GET' && data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Server request failed');
        return response.json();
    }

    async offlineRequest(url, method, data) {
        const table = this.extractTable(url);
        
        switch(method.toUpperCase()) {
            case 'POST':
                return await offlineDB.create(table, data);
            case 'GET':
                return await offlineDB.read(table, data);
            case 'PUT':
                return await offlineDB.update(table, data.id, data);
            case 'DELETE':
                return await offlineDB.delete(table, data.id);
            default:
                throw new Error('Unsupported method');
        }
    }

    extractTable(url) {
        const parts = url.split('/');
        const tableMap = {
            'student': 'students',
            'teacher': 'teachers',
            'class': 'classes',
            'invoice': 'invoices',
            'payment': 'payments'
        };
        
        for (let part of parts) {
            if (tableMap[part]) return tableMap[part];
        }
        return 'general';
    }

    async create(endpoint, data) {
        return await this.request(endpoint, 'POST', data);
    }

    async read(endpoint, filters = {}) {
        return await this.request(endpoint, 'GET', filters);
    }

    async update(endpoint, id, data) {
        return await this.request(endpoint, 'PUT', {...data, id});
    }

    async delete(endpoint, id) {
        return await this.request(endpoint, 'DELETE', {id});
    }
}

window.offlineCRUD = new OfflineCRUD();

// jQuery AJAX interceptor for automatic offline handling
if (typeof jQuery !== 'undefined') {
    const originalAjax = jQuery.ajax;
    
    jQuery.ajax = function(options) {
        // Only intercept if offline AND offlineDB is available
        if (!navigator.onLine && options.type !== 'GET' && window.offlineDB && window.offlineDB.db) {
            return new Promise((resolve, reject) => {
                const table = offlineCRUD.extractTable(options.url);
                const data = typeof options.data === 'string' ? JSON.parse(options.data) : options.data;
                
                offlineDB.create(table, data).then(result => {
                    if (window.syncManager) {
                        syncManager.showNotification('Saved offline. Will sync when online.', 'info');
                    }
                    if (options.success) options.success(result);
                    resolve(result);
                }).catch(error => {
                    if (options.error) options.error(error);
                    reject(error);
                });
            });
        }
        
        return originalAjax.call(jQuery, options);
    };
}
