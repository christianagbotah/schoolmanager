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
</style>
<style>
/* Direct UI/UX normalization — Inventory Products */
.inventory-products-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
}
.inventory-products-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.inventory-products-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.inventory-products-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.inventory-products-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px !important;
    line-height: 1.5;
}
.inventory-products-primary-action,
.inventory-products-filter-actions .btn {
    min-height: 44px;
    padding: 10px 15px !important;
    border-radius: 9px !important;
    font-size: 14px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.inventory-products-primary-action {
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
}
.inventory-products-filter-card {
    margin-bottom: 16px;
    padding: 16px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.inventory-products-filter-row {
    display: grid;
    grid-template-columns: minmax(260px, 1.65fr) minmax(180px, .8fr) minmax(160px, .7fr) auto;
    gap: 12px;
    align-items: end;
}
.inventory-products-filter-field label {
    display: block;
    margin: 0 0 6px;
    color: #475569;
    font-size: 13px;
    line-height: 1.35;
    font-weight: 800;
}
.inventory-products-filter-field input,
.inventory-products-filter-field select {
    width: 100%;
    height: 44px;
    padding: 9px 11px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #0f172a;
    font-size: 15px !important;
    line-height: 1.35;
}
.inventory-products-search-wrap { position: relative; }
.inventory-products-search-wrap > i {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: #94a3b8;
}
.inventory-products-search-wrap input { padding-left: 34px; }
.inventory-products-filter-field input:focus,
.inventory-products-filter-field select:focus {
    border-color: #2563eb;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.inventory-products-filter-actions {
    display: flex;
    gap: 8px;
}
.inventory-products-filter-actions .btn-default {
    border: 1px solid #cbd5e1 !important;
    background: #fff !important;
    color: #334155 !important;
}
.inventory-products-workspace > .bg-white.rounded-xl.shadow-lg.overflow-hidden {
    overflow-x: auto !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
#products_data_table { min-width: 980px; }
#products_data_table thead { background: #f8fafc !important; }
#products_data_table thead th {
    padding: 12px 13px !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    border-bottom: 1px solid #e2e8f0 !important;
}
#products_data_table tbody td {
    padding: 12px 13px !important;
    color: #334155;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle;
    border-bottom: 1px solid #eef2f7 !important;
}
#products_data_table tbody td * { font-size: inherit; }
#products_data_table tbody button {
    min-width: 38px;
    min-height: 36px;
    padding: 7px 10px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
}
.inventory-products-workspace .dataTables_wrapper { padding: 14px; }
.inventory-products-workspace .dataTables_length,
.inventory-products-workspace .dataTables_filter,
.inventory-products-workspace .dataTables_info,
.inventory-products-workspace .dataTables_paginate {
    color: #475569;
    font-size: 14px;
}
.inventory-products-workspace .dataTables_length select,
.inventory-products-workspace .dataTables_filter input {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
}
.inventory-products-workspace .dt-buttons .btn {
    min-height: 38px;
    padding: 8px 11px !important;
    border-radius: 8px !important;
    box-shadow: none !important;
    transform: none !important;
    font-size: 13px !important;
    font-weight: 800 !important;
}
#modal_ajax .modal-dialog { width: min(760px, calc(100vw - 30px)); }
#modal_ajax .modal-content { border-radius: 14px; overflow: hidden; }
#modal_ajax .modal-header { padding: 16px 18px; border-bottom: 1px solid #e2e8f0; }
#modal_ajax .modal-body { padding: 18px; }
#modal_ajax .modal-body label {
    color: #334155 !important;
    font-size: 14px !important;
    font-weight: 800 !important;
}
#modal_ajax .modal-body input,
#modal_ajax .modal-body select,
#modal_ajax .modal-body textarea {
    min-height: 44px;
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    color: #0f172a;
    font-size: 15px !important;
}
#modal_ajax .modal-body textarea { min-height: 94px; }
#modal_ajax .modal-body button {
    min-height: 44px;
    padding: 9px 15px !important;
    border-radius: 9px !important;
    font-size: 14px !important;
    font-weight: 800 !important;
}
@media (max-width: 980px) {
    .inventory-products-filter-row { grid-template-columns: 1fr 1fr; }
    .inventory-products-search-field { grid-column: 1 / -1; }
}
@media (max-width: 767px) {
    .inventory-products-workspace { padding: 18px 14px 32px !important; }
    .inventory-products-head { display: block; }
    .inventory-products-head h1 { font-size: 26px !important; }
    .inventory-products-primary-action { width: 100%; margin-top: 14px; }
    .inventory-products-filter-row { grid-template-columns: 1fr; }
    .inventory-products-search-field { grid-column: auto; }
    .inventory-products-filter-actions { display: grid; grid-template-columns: 1fr 1fr; }
    .inventory-products-filter-field input,
    .inventory-products-filter-field select { font-size: 16px !important; }
    #modal_ajax .modal-body .grid.grid-cols-2 { grid-template-columns: 1fr !important; }
    #modal_ajax .modal-body .col-span-2 { grid-column: auto !important; }
}
</style>

<div class="inventory-content inventory-products-workspace">
    <div class="inventory-products-head">
        <div>
            <p class="inventory-products-eyebrow">Inventory</p>
            <h1>Products</h1>
            <p>Manage catalogue items, pricing, stock thresholds and product availability from one workspace.</p>
        </div>
        <button onclick="showAddModal()" class="btn btn-primary inventory-products-primary-action">
            <i class="fa fa-plus"></i> Add Product
        </button>
    </div>

    <!-- Filters -->
    <div class="inventory-products-filter-card">
        <div class="inventory-products-filter-row">
            <div class="inventory-products-filter-field inventory-products-search-field">
                <label for="search">Search products</label>
                <div class="inventory-products-search-wrap">
                    <i class="fa fa-search"></i>
                    <input id="search" type="search" placeholder="Name, SKU or product keyword">
                </div>
            </div>
            <div class="inventory-products-filter-field">
                <label for="category_filter">Category</label>
                <select id="category_filter">
                    <option value="">All Categories</option>
                    <?php foreach($categories as $cat): ?>
                    <option value="<?php echo $cat->id; ?>"><?php echo $cat->name; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="inventory-products-filter-field">
                <label for="status_filter">Status</label>
                <select id="status_filter">
                    <option value="">All Status</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                </select>
            </div>
            <div class="inventory-products-filter-actions">
                <button type="button" onclick="loadProducts()" class="btn btn-primary">
                    <i class="fa fa-search"></i> Apply
                </button>
                <button type="button" onclick="$('#search').val(''); $('#category_filter, #status_filter').val(''); loadProducts();" class="btn btn-default">
                    Reset
                </button>
            </div>
        </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white rounded-xl shadow-lg overflow-hidden">
        <table id="products_data_table" class="min-w-full divide-y divide-gray-200">
            <thead style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);">
                <tr>
                    <th style="font-size: 1.25rem !important; font-weight: 900 !important; color: #1a1a1a !important;" class="px-6 py-4 text-left">Product</th>
                    <th style="font-size: 1.25rem !important; font-weight: 900 !important; color: #1a1a1a !important;" class="px-6 py-4 text-left">SKU</th>
                    <th style="font-size: 1.25rem !important; font-weight: 900 !important; color: #1a1a1a !important;" class="px-6 py-4 text-left">Category</th>
                    <th style="font-size: 1.25rem !important; font-weight: 900 !important; color: #1a1a1a !important;" class="px-6 py-4 text-right">Stock</th>
                    <th style="font-size: 1.25rem !important; font-weight: 900 !important; color: #1a1a1a !important;" class="px-6 py-4 text-right">Price</th>
                    <th style="font-size: 1.25rem !important; font-weight: 900 !important; color: #1a1a1a !important;" class="px-6 py-4 text-center">Status</th>
                    <th style="font-size: 1.25rem !important; font-weight: 900 !important; color: #1a1a1a !important;" class="px-6 py-4 text-center">Actions</th>
                </tr>
            </thead>
            <tbody id="products_table" class="divide-y divide-gray-200">
                <tr><td colspan="7" class="px-6 py-8 text-center text-gray-500" style="font-size: 1.25rem !important;">Loading...</td></tr>
            </tbody>
        </table>
    </div>
</div>

<script>
const CURRENCY = '<?php echo $currency; ?>';
let currentPage = 1;
let totalPages = 1;

$(document).ready(function() {
    loadProducts();

    // Trigger search as you type (with debounce to avoid too many requests)
    let searchTimeout;
    $('#search').on('keyup', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
            loadProducts();
        }, 500); // Wait 500ms after user stops typing
    });

    // Also trigger on filter changes
    $('#category_filter, #status_filter').on('change', function() {
        loadProducts();
    });
});

function loadProducts() {
    // Destroy existing DataTable if it exists
    if ($.fn.DataTable.isDataTable('#products_data_table')) {
        $('#products_data_table').DataTable().destroy();
    }

    const search = $('#search').val();
    const category = $('#category_filter').val();
    const status = $('#status_filter').val();

    $.get('<?php echo site_url('inventory/get_products_ajax'); ?>', {search, category, status, page: 1, limit: 10000}, function(response) {
        const data = JSON.parse(response);

        let html = '';

        // Don't add "no data" row - let DataTable handle it
        data.data.forEach(p => {
            const statusBadge = p.status == 1
                ? '<span class="px-3 py-1 bg-green-100 text-green-800 rounded-full font-semibold" style="font-size: 1rem !important;">Active</span>'
                : '<span class="px-3 py-1 bg-red-100 text-red-800 rounded-full font-semibold" style="font-size: 1rem !important;">Inactive</span>';

            const stockClass = p.quantity <= p.reorder_level ? 'text-red-600 font-bold' : 'text-gray-900';

            // Status toggle button
            const toggleBtn = p.status == 1
                ? `<button onclick="toggleProductStatus(${p.id})" class="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 mr-2" style="font-size: 1.125rem !important;" title="Deactivate"><i class="fa fa-toggle-on"></i></button>`
                : `<button onclick="toggleProductStatus(${p.id})" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2" style="font-size: 1.125rem !important;" title="Activate"><i class="fa fa-toggle-off"></i></button>`;

            html += `<tr class="hover:bg-gray-50">
                <td class="px-6 py-4" style="font-size: 1.25rem !important;">${p.name}</td>
                <td class="px-6 py-4 text-gray-600" style="font-size: 1.25rem !important;">${p.sku || '-'}</td>
                <td class="px-6 py-4 text-gray-600" style="font-size: 1.25rem !important;">${p.category_name || 'Uncategorized'}</td>
                <td class="px-6 py-4 text-right ${stockClass}" style="font-size: 1.25rem !important;">${p.quantity}</td>
                <td class="px-6 py-4 text-right font-semibold" style="font-size: 1.25rem !important;"><sup style="font-size: 0.7em;">${CURRENCY}</sup> ${parseFloat(p.selling_price).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td class="px-6 py-4 text-center">${statusBadge}</td>
                <td class="px-6 py-4 text-center">
                    ${toggleBtn}
                    <button onclick="showEditModal(${p.id})" class="btn btn-primary px-4 py-2 text-white rounded mr-2" style="font-size: 1.125rem !important;"><i class="fa fa-edit"></i></button>
                    <button onclick="deleteProduct(${p.id})" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" style="font-size: 1.125rem !important;"><i class="fa fa-trash"></i></button>
                </td>
            </tr>`;
        });

        $('#products_table').html(html);

        // Initialize DataTable
        $('#products_data_table').DataTable({
            "pageLength": 25,
            "ordering": true,
            "searching": true,
            "lengthChange": true,
            "info": true,
            "autoWidth": false,
            "order": [[0, 'asc']],
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
                    title: 'Products Inventory',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5],
                        format: {
                            body: function(data, row, column, node) {
                                // Remove currency symbol from price column (3)
                                if(column === 3) {
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
                    title: 'Products Inventory',
                    orientation: 'landscape',
                    pageSize: 'A4',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5],
                        format: {
                            body: function(data, row, column, node) {
                                // Remove currency symbol from price column (3)
                                if(column === 3) {
                                    return $(node).text().replace(/GHC|<?php echo $currency; ?>/g, '').trim();
                                }
                                return $(node).text();
                            }
                        }
                    },
                    customize: function(doc) {
                        doc.content[1].table.widths = ['20%', '15%', '15%', '15%', '15%', '20%'];
                        doc.styles.tableHeader.fillColor = '#10B981';
                        doc.styles.tableHeader.color = '#FFFFFF';
                        // Right align numeric columns (price and stock)
                        doc.content[1].table.body.forEach(function(row, index) {
                            if(index > 0) { // Skip header row
                                row[3].alignment = 'right'; // Price column
                                row[4].alignment = 'right'; // Stock column
                            }
                        });
                    }
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print mr-2"></i>Print',
                    className: 'btn btn-info',
                    title: 'Products Inventory',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5],
                        format: {
                            body: function(data, row, column, node) {
                                // Remove currency symbol from price column (3)
                                if(column === 3) {
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
                        $(win.document.body).find('table tbody td:nth-child(4), table tbody td:nth-child(5)').css('text-align', 'right');
                        $(win.document.body).find('table thead th:nth-child(4), table thead th:nth-child(5)').css('text-align', 'right');
                    }
                }
            ],
            "language": {
                "search": "Search products:",
                "lengthMenu": "Show _MENU_ products",
                "info": "Showing _START_ to _END_ of _TOTAL_ products",
                "infoEmpty": "Showing 0 to 0 of 0 products",
                "infoFiltered": "(filtered from _MAX_ total products)",
                "zeroRecords": "No products found",
                "emptyTable": "No products available"
            },
            "columnDefs": [
                { "orderable": false, "targets": [6] }
            ]
        });
    });
}

// Pagination now handled by DataTable

function showAddModal() {
    const form = `
        <?php echo form_open('inventory/create_product', ['id' => 'product_form']); ?>
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">Product Name *</label>
                    <input type="text" name="name" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">SKU</label>
                    <input type="text" name="sku" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">Category</label>
                    <select name="category_id" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;">
                        <option value="">Select Category</option>
                        <?php foreach($categories as $cat): ?>
                        <option value="<?php echo $cat->id; ?>"><?php echo $cat->name; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">Cost Price *</label>
                    <input type="number" name="cost_price" step="0.01" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">Selling Price *</label>
                    <input type="number" name="selling_price" step="0.01" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">Quantity *</label>
                    <input type="number" name="quantity" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;">
                </div>
                <div>
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">Reorder Level</label>
                    <input type="number" name="reorder_level" value="10" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;">
                </div>
                <div class="col-span-2">
                    <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.375rem !important;">Description</label>
                    <textarea name="description" rows="3" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.375rem !important;"></textarea>
                </div>
            </div>
            <div class="mt-6 flex justify-end space-x-3">
                <button type="button" onclick="$('#modal_ajax').modal('hide')" class="px-6 py-3 border rounded-lg" style="font-size: 1.375rem !important;">Cancel</button>
                <button type="submit" class="btn btn-primary px-6 py-3 text-white rounded-lg" style="font-size: 1.375rem !important;">Save Product</button>
            </div>
        <?php echo form_close(); ?>
    `;

    showModalWithContent('modal_ajax', '<i class="fa fa-plus"></i> Add Product', form);

    $('#product_form').submit(function(e) {
        e.preventDefault();
        $('.close')[0].click();
        showAjaxModal_alert('Saving...', 'loading');

        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function(response) {
            if(response.status === 'success') {
                showAjaxModal_alert(response.message, 'success', false);
                setTimeout(() => {
                        loadProducts();
                        $('.close').click();
                    }, 2000);
            } else {
                showAjaxModal_alert(response.message, 'error');
            }
        }).fail(function() {
            showAjaxModal_alert('An error occurred', 'error');
        });
    });
}

function showEditModal(id) {
    $.ajax({
        url: '<?php echo site_url('inventory/get_products_ajax'); ?>',
        type: 'GET',
        data: {search: '', category: '', status: '', page: 1, limit: 1000},
        dataType: 'json'
    }).done(function(data) {
        const product = data.data.find(p => p.id == id);

        if(!product) {
            showAjaxModal_alert('Product not found', 'error');
            return;
        }

        const categoryOptions = <?php echo json_encode(array_map(function($c) { return ['id' => $c->id, 'name' => $c->name]; }, $categories)); ?>;
        let categorySelect = '<option value="">Select Category</option>';
        categoryOptions.forEach(cat => {
            categorySelect += `<option value="${cat.id}" ${product.category_id == cat.id ? 'selected' : ''}>${cat.name}</option>`;
        });

        const form = `
            <?php echo form_open('inventory/update_product', ['id' => 'product_form']); ?>
                <input type="hidden" name="id" value="${product.id}">
                <div class="grid grid-cols-2 gap-4">
                    <div class="col-span-2">
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">Product Name *</label>
                        <input type="text" name="name" value="${product.name}" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">SKU</label>
                        <input type="text" name="sku" value="${product.sku || ''}" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">Category</label>
                        <select name="category_id" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">
                            ${categorySelect}
                        </select>
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">Cost Price *</label>
                        <input type="number" name="cost_price" value="${product.cost_price}" step="0.01" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">Selling Price *</label>
                        <input type="number" name="selling_price" value="${product.selling_price}" step="0.01" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">Quantity *</label>
                        <input type="number" name="quantity" value="${product.quantity}" required class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">
                    </div>
                    <div>
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">Reorder Level</label>
                        <input type="number" name="reorder_level" value="${product.reorder_level}" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">
                    </div>
                    <div class="col-span-2">
                        <label class="block text-gray-700 font-semibold mb-2" style="font-size: 1.125rem !important;">Description</label>
                        <textarea name="description" rows="3" class="w-full px-4 py-3 border rounded-lg" style="font-size: 1.125rem !important;">${product.description || ''}</textarea>
                    </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                    <button type="button" onclick="$('#modal_ajax').modal('hide')" class="px-6 py-3 border rounded-lg" style="font-size: 1.375rem !important;">Cancel</button>
                    <button type="submit" class="btn btn-primary px-6 py-3 text-white rounded-lg" style="font-size: 1.375rem !important;">Update Product</button>
                </div>
            <?php echo form_close(); ?>
        `;

        showModalWithContent('modal_ajax', '<i class="fa fa-edit"></i> Edit Product', form);

        $('#product_form').submit(function(e) {
            e.preventDefault();
            $('.close')[0].click();
            showAjaxModal_alert('Updating...', 'loading');

            $.ajax({
                url: $(this).attr('action'),
                type: 'POST',
                data: new FormData(this),
                cache: false,
                contentType: false,
                processData: false,
                dataType: 'json'
            }).done(function(response) {
                if(response.status === 'success') {
                    showAjaxModal_alert(response.message, 'success', false);

                    setTimeout(() => {
                        loadProducts();
                        $('.close').click();
                    }, 2000);
                } else {
                    showAjaxModal_alert(response.message, 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('An error occurred', 'error');
            });
        });
    }).fail(function() {
        showAjaxModal_alert('Failed to load product data', 'error');
    });
}

function deleteProduct(id) {
    showConfirmModal(
        'Confirm Delete',
        'Are you sure you want to delete this product?',
        function() {
            showAjaxModal_alert('Deleting...', 'loading');
            $.ajax({
                url: '<?php echo site_url('inventory/delete_product/'); ?>' + id,
                type: 'GET',
                dataType: 'json'
            }).done(function(response) {
                if(response.status === 'success' || response.status === 'warning') {
                    showAjaxModal_alert(response.message, response.status === 'success' ? 'success' : 'warning', false);
                    setTimeout(() => {
                        loadProducts();
                        $('.close').click();
                    }, 3000);
                } else {
                    showAjaxModal_alert(response.message, 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('An error occurred', 'error');
            });
        },
        'Delete',
        'danger'
    );
}

function toggleProductStatus(id) {
    showAjaxModal_alert('Processing...', 'loading');
    $.ajax({
        url: '<?php echo site_url('inventory/toggle_product_status/'); ?>' + id,
        type: 'GET',
        dataType: 'json'
    }).done(function(response) {
        if(response.status === 'success') {
            showAjaxModal_alert(response.message, 'success', false);
            setTimeout(() => {
                loadProducts();
                $('.close').click();
            }, 2000);
        } else {
            showAjaxModal_alert(response.message, 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('An error occurred', 'error');
    });
}
</script>