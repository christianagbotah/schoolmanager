// Inventory System - Utility Functions
// Place in: assets/js/inventory-utils.js

// Currency formatting
function formatCurrency(amount) {
    return 'GH₵ ' + parseFloat(amount || 0).toLocaleString('en-GH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// AJAX error handler
function handleAjaxError(xhr, status, error) {
    console.error('AJAX Error:', status, error);
    showAjaxModal_alert('Network error. Please check your connection and try again.', 'error');
}

// Skeleton loader for tables
function showTableSkeleton(tbody, cols, rows = 5) {
    let html = '';
    for(let i = 0; i < rows; i++) {
        html += '<tr class="animate-pulse">';
        for(let j = 0; j < cols; j++) {
            const width = ['w-3/4', 'w-1/2', 'w-2/3', 'w-16', 'w-20'][j % 5];
            html += `<td class="px-6 py-4"><div class="h-4 bg-gray-200 rounded ${width}"></div></td>`;
        }
        html += '</tr>';
    }
    $(tbody).html(html);
}

// Empty state template
function getEmptyState(title, description, buttonText, buttonAction) {
    return `
        <div class="text-center py-12">
            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
            </svg>
            <h3 class="mt-2 text-sm font-semibold text-gray-900">${title}</h3>
            <p class="mt-1 text-sm text-gray-500">${description}</p>
            ${buttonText ? `
                <div class="mt-6">
                    <button onclick="${buttonAction}" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        ${buttonText}
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// Stock level indicator with icon
function getStockIndicator(quantity, reorderLevel) {
    const isLow = quantity <= reorderLevel;
    const icon = isLow ? `
        <svg class="w-4 h-4 mr-1 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
    ` : '';
    const colorClass = isLow ? 'text-orange-600 font-semibold' : 'text-gray-900';
    return `<span class="inline-flex items-center ${colorClass}">${icon}${quantity}</span>`;
}

// Export to CSV
function exportToCSV(data, filename) {
    const csv = data.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
