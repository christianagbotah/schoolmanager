/**
 * Helper functions for sync operations
 */

// Sync specific form data
async function syncFormData(formElement) {
    if (!syncManager) return false;
    await syncManager.queueFormData(formElement);
    return true;
}

// Sync custom data
async function syncCustomData(url, method, data) {
    if (!syncManager) return false;
    await syncManager.addToQueue({
        url: url,
        method: method,
        data: data,
        timestamp: Date.now(),
        synced: false
    });
    return true;
}

// Check if online
function isOnline() {
    return syncManager ? syncManager.isOnline : navigator.onLine;
}

// Get sync status
async function getSyncStatus() {
    if (!syncManager) return null;
    const pending = await syncManager.getPendingCount();
    return {
        online: syncManager.isOnline,
        pending: pending,
        syncing: syncManager.syncInProgress
    };
}

// Force sync now
function forceSyncNow() {
    if (syncManager && syncManager.isOnline) {
        syncManager.syncPendingData();
    }
}
