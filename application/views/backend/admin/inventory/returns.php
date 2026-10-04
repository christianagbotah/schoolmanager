<!-- Sales Returns & Refunds Interface - Modern Enhanced UI -->
<?php include('_readable_header.php'); ?>

<style>
/* DataTables Buttons Styling */
.dt-buttons {
    margin-bottom: 1rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.dt-buttons .btn {
    padding: 0.625rem 1.25rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 0.5rem;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dt-buttons .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dt-buttons .btn-secondary {
    background: linear-gradient(135deg, #6B7280 0%, #4B5563 100%);
    color: white;
}

.dt-buttons .btn-success {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    color: white;
}

.dt-buttons .btn-danger {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
    color: white;
}

.dt-buttons .btn-info {
    background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
    color: white;
}

@keyframes slideInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

@keyframes shimmer {
    0% { background-position: -1000px 0; }
    100% { background-position: 1000px 0; }
}

.animate-slide-up { animation: slideInUp 0.4s ease-out; }
.animate-pulse { animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite; }

.card-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-hover:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.btn-modern {
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
}

.btn-modern::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
}

.btn-modern:hover::before {
    width: 300px;
    height: 300px;
}

.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 1000px 100%;
    animation: shimmer 2s infinite;
}

/* Mobile-first responsive utilities */
@media (max-width: 640px) {
    .mobile-stack { display: block !important; width: 100% !important; }
    .mobile-stack > * { width: 100% !important; margin-bottom: 0.5rem !important; }
}
</style>
<style>
.inventory-returns-workspace { margin:0 !important; padding:24px 28px 40px !important; background:#f8fafc; min-height:100%; }
.inventory-returns-head { display:flex; align-items:flex-end; justify-content:space-between; gap:18px; margin-bottom:18px; padding-bottom:18px; border-bottom:1px solid #e2e8f0; }
.inventory-returns-eyebrow { margin:0 0 4px; color:#2563eb; font-size:13px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
.inventory-returns-head h1 { margin:0; color:#0f172a; font-size:30px !important; line-height:1.2; font-weight:800; letter-spacing:-.02em; }
.inventory-returns-head p:last-child { margin:7px 0 0; color:#64748b; font-size:15px !important; line-height:1.5; }
.inventory-returns-head-actions { display:flex; gap:8px; flex-wrap:wrap; }
.inventory-returns-primary,.inventory-returns-secondary { min-height:44px; padding:10px 15px !important; border-radius:9px !important; font-size:14px !important; font-weight:800 !important; }
.inventory-returns-primary { background:#2563eb !important; border-color:#2563eb !important; color:#fff !important; }
.inventory-returns-secondary { border:1px solid #cbd5e1 !important; background:#fff !important; color:#334155 !important; }
.inventory-returns-workspace .animate-slide-up { animation:none !important; }
.inventory-returns-workspace .card-hover:hover { transform:none !important; box-shadow:0 1px 2px rgba(15,23,42,.05) !important; }
.inventory-returns-workspace > .bg-white.border-2 { padding:16px !important; margin-bottom:16px !important; border:1px solid #e2e8f0 !important; border-radius:14px !important; box-shadow:0 1px 2px rgba(15,23,42,.05) !important; }
.inventory-returns-workspace > .bg-white.border-2 > .flex { margin-bottom:12px !important; }
.inventory-returns-workspace > .bg-white.border-2 > .grid { gap:12px !important; }
.inventory-returns-workspace #filter_start_date,.inventory-returns-workspace #filter_end_date,.inventory-returns-workspace #filter_customer,.inventory-returns-workspace #filter_reason { min-height:44px !important; padding:9px 11px !important; border:1px solid #cbd5e1 !important; border-radius:9px !important; font-size:15px !important; }
.inventory-returns-workspace > .grid.grid-cols-1.gap-4 { gap:12px !important; margin-bottom:16px !important; }
.inventory-returns-workspace > .grid.grid-cols-1.gap-4 > div { min-height:124px; padding:16px !important; border:1px solid #e2e8f0 !important; border-left-width:4px !important; border-radius:14px !important; background:#fff !important; box-shadow:0 1px 2px rgba(15,23,42,.05) !important; }
.inventory-returns-workspace > .grid.grid-cols-1.gap-4 > div .p-5 { padding:10px !important; border-radius:10px !important; }
.inventory-returns-workspace > .bg-white.border-2.rounded-2xl.shadow-xl { overflow-x:auto !important; padding:0 !important; }
.inventory-returns-workspace > .bg-white.border-2.rounded-2xl.shadow-xl > .bg-gradient-to-r { padding:14px 16px !important; background:#f8fafc !important; border-bottom:1px solid #e2e8f0 !important; }
#returns_table { min-width:1050px; margin:0 !important; }
#returns_table thead { background:#f8fafc !important; }
#returns_table thead th { padding:12px 13px !important; color:#475569 !important; font-size:13px !important; font-weight:800 !important; letter-spacing:.035em; border-bottom:1px solid #e2e8f0 !important; }
#returns_table tbody td { padding:12px 13px !important; color:#334155 !important; font-size:14px !important; line-height:1.45; border-bottom:1px solid #eef2f7 !important; }
.inventory-returns-workspace .dataTables_wrapper { min-width:1050px; padding:14px; }
.inventory-returns-workspace .dt-buttons .btn { min-height:38px; padding:8px 11px !important; border-radius:8px !important; box-shadow:none !important; transform:none !important; font-size:13px !important; font-weight:800 !important; }
@media(max-width:767px){.inventory-returns-workspace{padding:18px 14px 32px !important}.inventory-returns-head{display:block}.inventory-returns-head h1{font-size:26px !important}.inventory-returns-head-actions{display:grid;grid-template-columns:1fr;margin-top:14px}.inventory-returns-workspace > .bg-white.border-2 > .grid{grid-template-columns:1fr !important}.inventory-returns-workspace #filter_start_date,.inventory-returns-workspace #filter_end_date,.inventory-returns-workspace #filter_customer,.inventory-returns-workspace #filter_reason{font-size:16px !important}}
</style>

<div class="inventory-content inventory-returns-workspace">
    <div class="inventory-returns-head">
        <div>
            <p class="inventory-returns-eyebrow">Inventory Sales</p>
            <h1>Sales Returns &amp; Refunds</h1>
            <p>Process returns, restore stock and track refunds with clear audit visibility.</p>
        </div>
        <div class="inventory-returns-head-actions">
            <button onclick="openReturnModal()" class="btn btn-primary inventory-returns-primary"><i class="fa fa-undo"></i> Process New Return</button>
            <button onclick="exportReturns()" class="btn btn-default inventory-returns-secondary"><i class="fa fa-download"></i> Export CSV</button>
            <button onclick="window.location.reload()" class="btn btn-default inventory-returns-secondary"><i class="fa fa-refresh"></i> Refresh</button>
        </div>
    </div>

    <!-- Filter Section - Enhanced & Responsive -->
    <div class="bg-white border-2 border-gray-200 rounded-2xl p-6 md:p-8 mb-8 shadow-lg animate-slide-up" style="animation-delay: 0.2s;">
        <div class="flex items-center justify-between mb-6">
            <h3 style="font-size: 16px !important;" class="font-bold text-gray-900 flex items-center">
                <i class="fa fa-filter text-blue-600 mr-3"></i>Filter Returns
            </h3>
            <button onclick="clearFilters()" style="font-size: 13px !important;" class="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                <i class="fa fa-times-circle mr-1"></i>Clear All
            </button>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-5">
            <div class="w-full">
                <label style="font-size: 14px !important;" class="block font-semibold text-gray-700 mb-2">
                    <i class="fa fa-calendar-alt text-gray-500 mr-2"></i>Start Date
                </label>
                <input type="date" id="filter_start_date" style="font-size: 14px !important; min-height: 3.5rem !important;" class="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
            <div class="w-full">
                <label style="font-size: 14px !important;" class="block font-semibold text-gray-700 mb-2">
                    <i class="fa fa-calendar-alt text-gray-500 mr-2"></i>End Date
                </label>
                <input type="date" id="filter_end_date" style="font-size: 14px !important; min-height: 3.5rem !important;" class="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
            <div class="w-full">
                <label style="font-size: 14px !important;" class="block font-semibold text-gray-700 mb-2">
                    <i class="fa fa-user text-gray-500 mr-2"></i>Customer
                </label>
                <input type="text" id="filter_customer" placeholder="Search by name..." style="font-size: 14px !important; min-height: 3.5rem !important;" class="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
            </div>
            <div class="w-full">
                <label style="font-size: 14px !important;" class="block font-semibold text-gray-700 mb-2">
                    <i class="fa fa-tag text-gray-500 mr-2"></i>Return Reason
                </label>
                <select id="filter_reason" style="font-size: 14px !important; min-height: 3.5rem !important;" class="block w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                    <option value="">All Reasons</option>
                    <option value="Defective">Defective/Damaged</option>
                    <option value="Wrong item">Wrong Item</option>
                    <option value="Changed mind">Changed Mind</option>
                    <option value="Expired">Expired Product</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <div class="w-full flex items-end">
                <button onclick="loadReturns()" style="font-size: 14px !important; min-height: 3.5rem !important;" class="btn-modern w-full px-5 py-3 font-semibold rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition-all">
                    <i class="fa fa-search mr-2"></i>Apply Filters
                </button>
            </div>
        </div>
    </div>

    <!-- Summary Cards - Enhanced with animations -->
    <div class="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div class="card-hover bg-gradient-to-br from-red-50 via-red-100 to-red-50 border-l-4 border-red-500 rounded-2xl p-6 sm:p-8 shadow-xl animate-slide-up" style="animation-delay: 0.3s;">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <p style="font-size: 14px !important;" class="font-semibold text-red-700 uppercase tracking-wider mb-3">Total Returns</p>
                    <p style="font-size: 27px !important; line-height: 1.1;" class="font-bold text-red-900" id="total_returns_count">
                        <span class="skeleton inline-block w-20 h-12 rounded"></span>
                    </p>
                    <p style="font-size: 13px !important;" class="text-red-600 mt-3 font-medium">
                        <i class="fa fa-info-circle mr-1"></i>Filtered period
                    </p>
                </div>
                <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 shadow-lg">
                    <i class="fa fa-undo text-white" style="font-size: 20px;"></i>
                </div>
            </div>
        </div>
        <div class="card-hover bg-gradient-to-br from-orange-50 via-orange-100 to-orange-50 border-l-4 border-orange-500 rounded-2xl p-6 sm:p-8 shadow-xl animate-slide-up" style="animation-delay: 0.4s;">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <p style="font-size: 14px !important;" class="font-semibold text-orange-700 uppercase tracking-wider mb-3">Total Refunded</p>
                    <p style="font-size: 27px !important; line-height: 1.1;" class="font-bold text-orange-900" id="total_refund_amount">
                        <span class="skeleton inline-block w-32 h-12 rounded"></span>
                    </p>
                    <p style="font-size: 13px !important;" class="text-orange-600 mt-3 font-medium">
                        <i class="fa fa-coins mr-1"></i>Cash + Credit
                    </p>
                </div>
                <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 shadow-lg">
                    <i class="fa fa-money-bill-wave text-white" style="font-size: 20px;"></i>
                </div>
            </div>
        </div>
        <div class="card-hover bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-50 border-l-4 border-yellow-500 rounded-2xl p-6 sm:p-8 shadow-xl animate-slide-up md:col-span-2 lg:col-span-1" style="animation-delay: 0.5s;">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <p style="font-size: 14px !important;" class="font-semibold text-yellow-700 uppercase tracking-wider mb-3">Items Returned</p>
                    <p style="font-size: 27px !important; line-height: 1.1;" class="font-bold text-yellow-900" id="total_items_returned">
                        <span class="skeleton inline-block w-20 h-12 rounded"></span>
                    </p>
                    <p style="font-size: 13px !important;" class="text-yellow-600 mt-3 font-medium">
                        <i class="fa fa-box-open mr-1"></i>Restocked items
                    </p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl p-5 shadow-lg">
                    <i class="fa fa-cubes text-white" style="font-size: 20px;"></i>
                </div>
            </div>
        </div>
    </div>

    <!-- Returns Table - Enhanced Design -->
    <div class="bg-white border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-slide-up" style="animation-delay: 0.6s;">
        <div class="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 px-6 py-5 border-b-2 border-gray-200">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 style="font-size: 18px !important;" class="font-bold text-gray-900 flex items-center">
                    <i class="fa fa-list text-blue-600 mr-3"></i>Returns History
                </h3>
                <div class="flex items-center gap-2">
                    <span style="font-size: 12px !important;" class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        <i class="fa fa-database mr-1"></i><span id="table_count">Loading...</span>
                    </span>
                </div>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table id="returns_table" class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100">
                    <tr>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-hashtag mr-2 text-gray-500"></i>Return ID
                        </th>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-calendar mr-2 text-gray-500"></i>Date
                        </th>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-receipt mr-2 text-gray-500"></i>Sale ID
                        </th>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-user mr-2 text-gray-500"></i>Customer
                        </th>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-center font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-box mr-2 text-gray-500"></i>Items
                        </th>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-right font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-money-bill mr-2 text-gray-500"></i>Refund
                        </th>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-left font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-tag mr-2 text-gray-500"></i>Reason
                        </th>
                        <th style="font-size: 14px !important;" class="px-6 py-4 text-center font-bold text-gray-700 uppercase tracking-wider">
                            <i class="fa fa-cog mr-2 text-gray-500"></i>Actions
                        </th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="returns_tbody">
                    <tr>
                        <td colspan="8" class="px-8 py-12 text-center">
                            <div class="flex flex-col items-center justify-center">
                                <div class="animate-pulse mb-4">
                                    <i class="fa fa-spinner fa-spin text-blue-600" style="font-size: 3rem;"></i>
                                </div>
                                <p style="font-size: 14px !important;" class="text-gray-500 font-semibold">Loading returns data...</p>
                                <p style="font-size: 13px !important;" class="text-gray-400 mt-2">Please wait a moment</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
let currentSaleData = null;
let isLoading = false;

$(document).ready(function() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    $('#filter_start_date').val(firstDay);
    $('#filter_end_date').val(today);
    loadReturns();
});

function showLoadingState(message = 'Loading...') {
    $('#returns_tbody').html(`
        <tr>
            <td colspan="8" class="px-8 py-12 text-center">
                <div class="flex flex-col items-center justify-center">
                    <div class="animate-pulse mb-4">
                        <i class="fa fa-spinner fa-spin text-blue-600" style="font-size: 3rem;"></i>
                    </div>
                    <p style="font-size: 14px !important;" class="text-gray-500 font-semibold">${message}</p>
                </div>
            </td>
        </tr>
    `);
}

function showErrorState(message) {
    $('#returns_tbody').html(`
        <tr>
            <td colspan="8" class="px-8 py-12 text-center">
                <div class="flex flex-col items-center justify-center">
                    <div class="mb-4">
                        <i class="fa fa-exclamation-triangle text-red-600" style="font-size: 3rem;"></i>
                    </div>
                    <p style="font-size: 14px !important;" class="text-red-600 font-semibold">Error Loading Data</p>
                    <p style="font-size: 13px !important;" class="text-gray-500 mt-2">${message}</p>
                    <button onclick="loadReturns()" class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fa fa-sync-alt mr-2"></i>Retry
                    </button>
                </div>
            </td>
        </tr>
    `);
}

function showEmptyState() {
    $('#returns_tbody').html(`
        <tr>
            <td colspan="8" class="px-8 py-12 text-center">
                <div class="flex flex-col items-center justify-center">
                    <div class="mb-4">
                        <i class="fa fa-inbox text-gray-400" style="font-size: 3rem;"></i>
                    </div>
                    <p style="font-size: 14px !important;" class="text-gray-600 font-semibold">No Returns Found</p>
                    <p style="font-size: 13px !important;" class="text-gray-400 mt-2">Try adjusting your filters or process a new return</p>
                    <button onclick="openReturnModal()" class="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                        <i class="fa fa-plus mr-2"></i>Process New Return
                    </button>
                </div>
            </td>
        </tr>
    `);
}

function loadReturns() {
    if(isLoading) return;
    isLoading = true;
    showLoadingState('Fetching returns data...');
    
    $.ajax({
        url: '<?php echo site_url('inventory/get_returns'); ?>',
        type: 'GET',
        data: {
            start_date: $('#filter_start_date').val(),
            end_date: $('#filter_end_date').val(),
            customer: $('#filter_customer').val(),
            reason: $('#filter_reason').val()
        },
        dataType: 'json',
        timeout: 30000,
        success: function(response) {
            isLoading = false;
            if(response.status === 'success') {
                renderReturnsTable(response.data.returns);
                updateSummary(response.data.summary);
            } else {
                showErrorState(response.message || 'Unknown error occurred');
            }
        },
        error: function(xhr, status, error) {
            isLoading = false;
            let errorMsg = 'Connection error. Please check your internet connection.';
            if(status === 'timeout') {
                errorMsg = 'Request timed out. Please try again.';
            } else if(xhr.status === 403) {
                errorMsg = 'Access denied. You don\'t have permission to view returns.';
            } else if(xhr.status === 500) {
                errorMsg = 'Server error occurred. Please contact administrator.';
            }
            showErrorState(errorMsg);
            console.error('Load returns error:', error);
        }
    });
}

function renderReturnsTable(returns) {
    // Destroy existing DataTable if it exists
    if ($.fn.DataTable.isDataTable('#returns_table')) {
        $('#returns_table').DataTable().destroy();
    }
    
    if(returns.length === 0) {
        showEmptyState();
        $('#table_count').text('0 records');
        return;
    }
    
    let html = '';
    const currency = '<?php echo $currency; ?>';
    
    returns.forEach((ret, index) => {
        const animDelay = Math.min(index * 0.05, 1);
        const reasonClass = {
            'Defective': 'bg-red-100 text-red-800',
            'Wrong item': 'bg-orange-100 text-orange-800',
            'Changed mind': 'bg-blue-100 text-blue-800',
            'Expired': 'bg-purple-100 text-purple-800',
            'Other': 'bg-gray-100 text-gray-800'
        }[ret.return_reason] || 'bg-gray-100 text-gray-800';
        
        html += `
            <tr class="hover:bg-blue-50 transition-all duration-200 animate-slide-up" style="animation-delay: ${animDelay}s;">
                <td style="font-size: 14px !important;" class="px-6 py-4 text-gray-900 font-bold">
                    <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                        #${ret.id}
                    </span>
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4 text-gray-700">
                    <div class="flex flex-col">
                        <span class="font-semibold">${new Date(ret.return_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                        <span class="text-sm text-gray-500">${new Date(ret.return_date).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4 text-gray-900 font-semibold">
                    #${ret.original_sale_id}
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            ${(ret.customer_name || 'W')[0].toUpperCase()}
                        </div>
                        <span class="text-gray-900 font-medium">${ret.customer_name || 'Walk-in Customer'}</span>
                    </div>
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold">
                        ${ret.items_count}
                    </span>
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4 text-right">
                    <span class="font-bold text-gray-900">
                        <sup style="font-size: 0.7em; vertical-align: super;">${currency}</sup> ${parseFloat(ret.total_refund_amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </span>
                </td>
                <td style="font-size: 13px !important;" class="px-6 py-4">
                    <span class="inline-flex items-center px-3 py-1 rounded-full ${reasonClass} font-semibold">
                        ${ret.return_reason}
                    </span>
                </td>
                <td class="px-6 py-4 text-center">
                    <button onclick="viewReturnDetails(${ret.id})" style="font-size: 14px !important;" class="btn-modern px-4 py-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all shadow-md">
                        <i class="fa fa-eye mr-1"></i>View
                    </button>
                </td>
            </tr>
        `;
    });
    
    $('#returns_tbody').html(html);
    $('#table_count').text(`${returns.length} record${returns.length !== 1 ? 's' : ''}`);
    
    // Initialize DataTable after populating tbody
    $('#returns_table').DataTable({
        "pageLength": 25,
        "ordering": true,
        "searching": true,
        "lengthChange": true,
        "info": true,
        "autoWidth": false,
        "responsive": true,
        "order": [[1, 'desc']],
        "dom": '<"row"<"col-sm-6"l><"col-sm-6"f>>Brt<"row"<"col-sm-6"i><"col-sm-6"p>>',
        "buttons": [
            {
                extend: 'colvis',
                text: '<i class="fa fa-columns mr-2"></i>Columns',
                className: 'btn btn-secondary'
            },
            {
                extend: 'excel',
                text: '<i class="fa fa-file-excel mr-2"></i>Excel',
                className: 'btn btn-success',
                title: 'Returns History - ' + $('#filter_start_date').val() + ' to ' + $('#filter_end_date').val(),
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6],
                    format: {
                        body: function(data, row, column, node) {
                            // Remove currency symbol from refund column
                            if(column === 5) {
                                return $(node).text().replace(/GHC|<?php echo $currency; ?>/g, '').trim();
                            }
                            return $(node).text();
                        }
                    }
                }
            },
            {
                extend: 'pdf',
                text: '<i class="fa fa-file-pdf mr-2"></i>PDF',
                className: 'btn btn-danger',
                title: 'Returns History',
                orientation: 'landscape',
                pageSize: 'A4',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6],
                    format: {
                        body: function(data, row, column, node) {
                            // Remove currency symbol from refund column
                            if(column === 5) {
                                return $(node).text().replace(/GHC|<?php echo $currency; ?>/g, '').trim();
                            }
                            return $(node).text();
                        }
                    }
                },
                customize: function(doc) {
                    doc.content[1].table.widths = ['10%', '15%', '10%', '20%', '10%', '15%', '20%'];
                    doc.styles.tableHeader.fillColor = '#EF4444';
                    doc.styles.tableHeader.color = '#FFFFFF';
                    // Right align numeric columns (items and refund)
                    doc.content[1].table.body.forEach(function(row, index) {
                        if(index > 0) { // Skip header row
                            row[4].alignment = 'right'; // Items column
                            row[5].alignment = 'right'; // Refund column
                        }
                    });
                }
            },
            {
                extend: 'print',
                text: '<i class="fa fa-print mr-2"></i>Print',
                className: 'btn btn-info',
                title: 'Returns History',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5, 6],
                    format: {
                        body: function(data, row, column, node) {
                            // Remove currency symbol from refund column
                            if(column === 5) {
                                return $(node).text().replace(/GHC|<?php echo $currency; ?>/g, '').trim();
                            }
                            return $(node).text();
                        }
                    }
                },
                customize: function(win) {
                    $(win.document.body).css('font-size', '10pt').css('color', '#000000');
                    $(win.document.body).find('table').addClass('compact').css('font-size', 'inherit').css('color', '#000000');
                    $(win.document.body).find('h1').css('color', '#000000');
                    // Right align numeric columns
                    $(win.document.body).find('table tbody td:nth-child(5), table tbody td:nth-child(6)').css('text-align', 'right');
                    $(win.document.body).find('table thead th:nth-child(5), table thead th:nth-child(6)').css('text-align', 'right');
                }
            }
        ],
        "language": {
            "search": "<i class='fa fa-search mr-2'></i>Search returns:",
            "lengthMenu": "Show _MENU_ returns per page",
            "info": "Showing _START_ to _END_ of _TOTAL_ returns",
            "infoEmpty": "No returns to display",
            "infoFiltered": "(filtered from _MAX_ total returns)",
            "zeroRecords": "No matching returns found",
            "emptyTable": "No returns available",
            "paginate": {
                "first": "<i class='fa fa-angle-double-left'></i>",
                "last": "<i class='fa fa-angle-double-right'></i>",
                "next": "<i class='fa fa-angle-right'></i>",
                "previous": "<i class='fa fa-angle-left'></i>"
            }
        },
        "columnDefs": [
            { "orderable": false, "targets": [7] },
            { "className": "dt-center", "targets": [4, 7] }
        ]
    });
}

function updateSummary(summary) {
    const currency = '<?php echo $currency; ?>';
    
    // Animate count updates
    animateValue('total_returns_count', 0, summary.total_count || 0, 1000);
    animateValue('total_items_returned', 0, summary.total_items || 0, 1000);
    
    // Update refund amount with currency
    const refundAmount = parseFloat(summary.total_refund || 0);
    $('#total_refund_amount').html(
        '<sup style="font-size: 0.6em; vertical-align: super;">' + currency + '</sup> ' + 
        refundAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
    );
}

function animateValue(id, start, end, duration) {
    const element = document.getElementById(id);
    if(!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(function() {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

function clearFilters() {
    const today = new Date().toISOString().split('T')[0];
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    $('#filter_start_date').val(firstDay);
    $('#filter_end_date').val(today);
    $('#filter_customer').val('');
    $('#filter_reason').val('');
    loadReturns();
}

function openReturnModal() {
    loadModalContent('createModal', '<?php echo site_url('inventory/return_form'); ?>', '<i class="fa fa-undo"></i> Process Return');
}

function viewReturnDetails(returnId) {
    // Load return details in a modal with formatted view
    $.ajax({
        url: '<?php echo site_url('inventory/return_details/'); ?>' + returnId,
        type: 'GET',
        success: function(response) {
            // If response is JSON, we need to render it properly
            if(typeof response === 'object' || (typeof response === 'string' && response.trim().startsWith('{'))) {
                const data = typeof response === 'string' ? JSON.parse(response) : response;
                if(data.status === 'success') {
                    renderReturnDetailsModal(data.return);
                } else {
                    showAjaxModal_alert(data.message || 'Failed to load return details', 'Error');
                }
            } else {
                // HTML response - display in modal
                showModalWithContent('detailsModal', '<i class="fa fa-undo"></i> Return Details #' + returnId, response);
            }
        },
        error: function() {
            showAjaxModal_alert('Error loading return details', 'Error');
        }
    });
}

function renderReturnDetailsModal(returnData) {
    const currency = '<?php echo $currency; ?>';
    const refundMethods = {1: 'Cash', 2: 'Mobile Money', 3: 'Bank Transfer', 4: 'Store Credit'};
    
    let itemsHtml = '';
    returnData.items.forEach(item => {
        itemsHtml += `
            <tr class="hover:bg-blue-50 transition-colors">
                <td style="font-size: 14px !important;" class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                            ${item.product_name[0]}
                        </div>
                        <div>
                            <div class="text-gray-900 font-semibold">${item.product_name}</div>
                            <div class="text-sm text-gray-500">SKU: ${item.sku}</div>
                        </div>
                    </div>
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4 text-center">
                    <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold">
                        ${item.quantity_returned}
                    </span>
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4 text-right text-gray-900 font-semibold">
                    <sup style="font-size: 0.7em;">${currency}</sup> ${parseFloat(item.unit_price).toFixed(2)}
                </td>
                <td style="font-size: 14px !important;" class="px-6 py-4 text-right text-gray-900 font-bold">
                    <sup style="font-size: 0.7em;">${currency}</sup> ${parseFloat(item.refund_amount).toFixed(2)}
                </td>
            </tr>
        `;
    });
    
    let stockMovementsHtml = '';
    if(returnData.stock_movements && returnData.stock_movements.length > 0) {
        returnData.stock_movements.forEach(movement => {
            stockMovementsHtml += `
                <tr class="hover:bg-teal-50 transition-colors">
                    <td style="font-size: 14px !important;" class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold mr-3">
                                ${movement.product_name[0]}
                            </div>
                            <span class="text-gray-900 font-semibold">${movement.product_name}</span>
                        </div>
                    </td>
                    <td style="font-size: 14px !important;" class="px-6 py-4 text-center">
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold">
                            <i class="fa fa-arrow-up mr-1"></i>+${movement.quantity}
                        </span>
                    </td>
                    <td style="font-size: 14px !important;" class="px-6 py-4 text-gray-900">
                        <div class="flex flex-col">
                            <span class="font-semibold">${new Date(movement.movement_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}</span>
                            <span class="text-sm text-gray-500">${new Date(movement.movement_date).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}</span>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    
    const content = `
        <div class="p-4" style="max-height: 80vh; overflow-y: auto;">
            <!-- Return Information Card -->
            <div class="bg-gradient-to-br from-red-50 via-white to-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6 shadow-lg">
                <div class="flex items-center mb-4">
                    <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-3 mr-3">
                        <i class="fa fa-info-circle text-white text-xl"></i>
                    </div>
                    <h3 style="font-size: 16px !important;" class="font-bold text-gray-900">Return Information</h3>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                        <p style="font-size: 12px !important;" class="text-gray-500 uppercase tracking-wide font-semibold mb-2">
                            <i class="fa fa-calendar text-red-500 mr-2"></i>Return Date
                        </p>
                        <p style="font-size: 14px !important;" class="text-gray-900 font-bold">
                            ${new Date(returnData.return_date).toLocaleDateString('en-GB', {day: '2-digit', month: 'long', year: 'numeric'})}
                        </p>
                        <p style="font-size: 12px !important;" class="text-gray-600 mt-1">
                            ${new Date(returnData.return_date).toLocaleTimeString('en-GB', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                    </div>
                    
                    <div class="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                        <p style="font-size: 12px !important;" class="text-gray-500 uppercase tracking-wide font-semibold mb-2">
                            <i class="fa fa-receipt text-blue-500 mr-2"></i>Original Sale ID
                        </p>
                        <p style="font-size: 14px !important;" class="text-gray-900 font-bold">
                            #${returnData.original_sale_id}
                        </p>
                    </div>
                    
                    <div class="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                        <p style="font-size: 12px !important;" class="text-gray-500 uppercase tracking-wide font-semibold mb-2">
                            <i class="fa fa-user text-purple-500 mr-2"></i>Customer
                        </p>
                        <p style="font-size: 14px !important;" class="text-gray-900 font-bold">
                            ${returnData.customer_name || 'Walk-in Customer'}
                        </p>
                    </div>
                    
                    <div class="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                        <p style="font-size: 12px !important;" class="text-gray-500 uppercase tracking-wide font-semibold mb-2">
                            <i class="fa fa-tag text-orange-500 mr-2"></i>Return Reason
                        </p>
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-semibold">
                            ${returnData.return_reason}
                        </span>
                    </div>
                    
                    <div class="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                        <p style="font-size: 12px !important;" class="text-gray-500 uppercase tracking-wide font-semibold mb-2">
                            <i class="fa fa-credit-card text-green-500 mr-2"></i>Refund Method
                        </p>
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 font-semibold">
                            ${refundMethods[returnData.refund_method] || 'Unknown'}
                        </span>
                    </div>
                    
                    <div class="bg-white rounded-xl p-4 border border-red-100 shadow-sm">
                        <p style="font-size: 12px !important;" class="text-gray-500 uppercase tracking-wide font-semibold mb-2">
                            <i class="fa fa-user-shield text-indigo-500 mr-2"></i>Processed By
                        </p>
                        <p style="font-size: 14px !important;" class="text-gray-900 font-bold">
                            ${returnData.processed_by_name}
                        </p>
                    </div>
                </div>
                
                ${returnData.return_notes ? `
                <div class="mt-4 pt-4 border-t-2 border-red-100">
                    <div class="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-4">
                        <p style="font-size: 12px !important;" class="text-yellow-800 uppercase tracking-wide font-semibold mb-2">
                            <i class="fa fa-sticky-note mr-2"></i>Additional Notes
                        </p>
                        <p style="font-size: 14px !important;" class="text-gray-700 leading-relaxed">
                            ${returnData.return_notes}
                        </p>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Returned Items Table -->
            <div class="bg-white border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden mb-6">
                <div class="bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 px-6 py-4 border-b-2 border-blue-200">
                    <div class="flex items-center justify-between">
                        <h3 style="font-size: 16px !important;" class="font-bold text-gray-900 flex items-center">
                            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 mr-3">
                                <i class="fa fa-box-open text-white"></i>
                            </div>
                            Returned Items
                        </h3>
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold">
                            ${returnData.items.length} Item${returnData.items.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th style="font-size: 14px !important;" class="px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">
                                    <i class="fa fa-tag mr-2 text-gray-500"></i>Product
                                </th>
                                <th style="font-size: 14px !important;" class="px-6 py-3 text-center font-bold text-gray-700 uppercase tracking-wider">
                                    <i class="fa fa-boxes mr-2 text-gray-500"></i>Quantity
                                </th>
                                <th style="font-size: 14px !important;" class="px-6 py-3 text-right font-bold text-gray-700 uppercase tracking-wider">
                                    <i class="fa fa-dollar-sign mr-2 text-gray-500"></i>Unit Price
                                </th>
                                <th style="font-size: 14px !important;" class="px-6 py-3 text-right font-bold text-gray-700 uppercase tracking-wider">
                                    <i class="fa fa-money-bill-wave mr-2 text-gray-500"></i>Refund
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${itemsHtml}
                        </tbody>
                        <tfoot class="bg-gradient-to-r from-green-50 via-green-100 to-green-50 border-t-2 border-green-200">
                            <tr>
                                <td colspan="3" style="font-size: 16px !important;" class="px-6 py-4 text-right text-gray-900 font-bold uppercase tracking-wide">
                                    <i class="fa fa-calculator mr-2 text-green-600"></i>Total Refund:
                                </td>
                                <td style="font-size: 16px !important;" class="px-6 py-4 text-right font-bold text-green-700">
                                    <sup style="font-size: 0.6em;">${currency}</sup> ${parseFloat(returnData.total_refund_amount).toFixed(2)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            ${stockMovementsHtml ? `
            <!-- Stock Movements -->
            <div class="bg-white border-2 border-gray-200 rounded-2xl shadow-xl overflow-hidden">
                <div class="bg-gradient-to-r from-teal-50 via-teal-100 to-teal-50 px-6 py-4 border-b-2 border-teal-200">
                    <div class="flex items-center justify-between">
                        <h3 style="font-size: 16px !important;" class="font-bold text-gray-900 flex items-center">
                            <div class="bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg p-2 mr-3">
                                <i class="fa fa-exchange-alt text-white"></i>
                            </div>
                            Stock Adjustments
                        </h3>
                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-teal-100 text-teal-800 font-semibold">
                            <i class="fa fa-check-circle mr-1"></i>Items Restocked
                        </span>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th style="font-size: 14px !important;" class="px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">
                                    <i class="fa fa-tag mr-2 text-gray-500"></i>Product
                                </th>
                                <th style="font-size: 14px !important;" class="px-6 py-3 text-center font-bold text-gray-700 uppercase tracking-wider">
                                    <i class="fa fa-plus-circle mr-2 text-gray-500"></i>Quantity Added
                                </th>
                                <th style="font-size: 14px !important;" class="px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">
                                    <i class="fa fa-clock mr-2 text-gray-500"></i>Date & Time
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${stockMovementsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    showModalWithContent('detailsModal', '<i class="fa fa-undo"></i> Return Details #' + returnData.id, content);
}

function exportReturns() {
    const params = new URLSearchParams({
        start_date: $('#filter_start_date').val(),
        end_date: $('#filter_end_date').val(),
        customer: $('#filter_customer').val(),
        reason: $('#filter_reason').val()
    });
    
    // Show loading notification
    showAjaxModal_alert('Preparing export... Please wait.', 'Info', false, false);
    
    window.location.href = '<?php echo site_url('inventory/export_returns'); ?>?' + params.toString();
    
    // Close notification after delay
    setTimeout(function() {
        $('.close').click();
    }, 2000);
}
</script>
