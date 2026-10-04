<!-- Enterprise Categories Management -->
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
/* Direct UI/UX normalization — Inventory operation list */
.inventory-ops-list-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
}
.inventory-ops-list-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.inventory-ops-list-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.inventory-ops-list-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.inventory-ops-list-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px !important;
    line-height: 1.5;
}
.inventory-ops-list-primary {
    min-height: 44px;
    padding: 10px 15px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
    font-weight: 800 !important;
}
.inventory-ops-table-shell {
    overflow-x: auto;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.inventory-ops-table-shell > .overflow-x-auto { overflow-x: visible !important; }
#categories_table { min-width: 820px; margin: 0 !important; }
#categories_table thead { background: #f8fafc !important; }
#categories_table thead th {
    padding: 12px 13px !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    border-bottom: 1px solid #e2e8f0 !important;
}
#categories_table tbody td {
    padding: 12px 13px !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle;
    border-bottom: 1px solid #eef2f7 !important;
}
#categories_table tbody td * { font-size: inherit !important; }
#categories_table tbody button, #categories_table tbody a { font-size: 13px !important; }
.inventory-ops-list-workspace .dataTables_wrapper { padding: 14px; min-width: 820px; }
.inventory-ops-list-workspace .dataTables_length,
.inventory-ops-list-workspace .dataTables_filter,
.inventory-ops-list-workspace .dataTables_info,
.inventory-ops-list-workspace .dataTables_paginate { color: #475569; font-size: 14px; }
.inventory-ops-list-workspace .dataTables_length select,
.inventory-ops-list-workspace .dataTables_filter input {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 14px;
}
.inventory-ops-list-workspace .dt-buttons .btn {
    min-height: 38px;
    padding: 8px 11px !important;
    border-radius: 8px !important;
    box-shadow: none !important;
    transform: none !important;
    font-size: 13px !important;
    font-weight: 800 !important;
}
#category_modal .modal-dialog { width: min(720px, calc(100vw - 30px)); }
#category_modal .modal-content { border-radius: 14px; overflow: hidden; }
#category_modal .modal-header { padding: 16px 18px; border-bottom: 1px solid #e2e8f0; }
#category_modal .modal-body { padding: 18px; }
#category_modal .modal-body label { color: #334155; font-size: 14px !important; font-weight: 800; }
#category_modal .modal-body .form-control { min-height: 44px; border: 1px solid #cbd5e1; border-radius: 9px; font-size: 15px !important; }
#category_modal .modal-body textarea.form-control { min-height: 94px; }
#category_modal .modal-body .btn { min-height: 42px; padding: 8px 14px !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 800 !important; }
@media (max-width: 767px) {
    .inventory-ops-list-workspace { padding: 18px 14px 32px !important; }
    .inventory-ops-list-head { display: block; }
    .inventory-ops-list-head h1 { font-size: 26px !important; }
    .inventory-ops-list-primary { width: 100%; margin-top: 14px; }
    .inventory-ops-list-workspace .dataTables_filter { float: none; text-align: left; margin-top: 10px; }
    .inventory-ops-list-workspace .dataTables_filter input { width: 220px; max-width: calc(100vw - 90px); font-size: 16px; }
}
</style>


<div class="inventory-content inventory-ops-list-workspace">
    <div class="inventory-ops-list-head">
        <div>
            <p class="inventory-ops-list-eyebrow">Inventory Setup</p>
            <h1>Product Categories</h1>
            <p>Organize catalogue items into reusable categories without leaving the inventory workspace.</p>
        </div>
        <button onclick="openAddCategoryModal()" class="btn btn-primary inventory-ops-list-primary">
            <i class="fa fa-plus"></i> Add Category
        </button>
    </div>

    <div class="inventory-ops-table-shell">

        <div class="overflow-x-auto">
            <table id="categories_table" class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-left font-bold text-gray-700 uppercase tracking-wider">Category Name</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-left font-bold text-gray-700 uppercase tracking-wider">Description</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-right font-bold text-gray-700 uppercase tracking-wider">Products</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-right font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="categories_tbody">
                    <tr><td colspan="4" style="font-size: 1.25rem !important;" class="px-8 py-10 text-center text-gray-500">Loading categories...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
var categoriesTable;

$(document).ready(function() {
    loadCategories();
});

function loadCategories() {
    $.get('<?php echo site_url('inventory/get_categories'); ?>', function(response) {
        renderCategoriesTable(JSON.parse(response));
    });
}

function renderCategoriesTable(categories) {
    // Destroy existing DataTable if it exists
    if ($.fn.DataTable.isDataTable('#categories_table')) {
        $('#categories_table').DataTable().destroy();
    }

    let html = '';
    // Don't add "no data" row - let DataTable handle it
    categories.forEach(category => {
        html += `
            <tr class="hover:bg-blue-50 transition-colors">
                <td class="px-8 py-5">
                    <div style="font-size: 1.25rem !important;" class="font-semibold text-gray-900 leading-relaxed">${category.name}</div>
                </td>
                <td style="font-size: 1.25rem !important;" class="px-8 py-5 text-gray-600">${category.description || '-'}</td>
                <td style="font-size: 1.25rem !important;" class="px-8 py-5 text-right text-gray-900 font-medium">${category.product_count || 0}</td>
                <td class="px-8 py-5 text-right">
                    <button onclick="editCategory(${category.id})" style="font-size: 1.25rem !important;" class="font-semibold text-blue-600 hover:text-blue-900 mr-4 transition-colors">Edit</button>
                    <button onclick="deleteCategory(${category.id})" style="font-size: 1.25rem !important;" class="font-semibold text-red-600 hover:text-red-900 transition-colors">Delete</button>
                </td>
            </tr>
        `;
    });

    $('#categories_tbody').html(html);

    // Initialize DataTable
    categoriesTable = $('#categories_table').DataTable({
        "pageLength": 25,
        "ordering": true,
        "searching": true,
        "lengthChange": true,
        "info": true,
        "autoWidth": false,
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
                title: 'Product Categories',
                exportOptions: {
                    columns: [0, 1, 2]
                }
            },
            {
                extend: 'pdf',
                text: '<i class="fa fa-file-pdf mr-2"></i>PDF',
                className: 'btn btn-danger',
                title: 'Product Categories',
                orientation: 'landscape',
                pageSize: 'A4',
                exportOptions: {
                    columns: [0, 1, 2]
                },
                customize: function(doc) {
                    doc.content[1].table.widths = ['30%', '50%', '20%'];
                    doc.styles.tableHeader.fillColor = '#3B82F6';
                    doc.styles.tableHeader.color = '#FFFFFF';
                    // Right align products count column
                    doc.content[1].table.body.forEach(function(row, index) {
                        if(index > 0) { // Skip header row
                            row[2].alignment = 'right'; // Products count column
                        }
                    });
                }
            },
            {
                extend: 'print',
                text: '<i class="fa fa-print mr-2"></i>Print',
                className: 'btn btn-info',
                title: 'Product Categories',
                exportOptions: {
                    columns: [0, 1, 2]
                },
                customize: function(win) {
                    $(win.document.body).css('font-size', '10pt').css('color', '#000000');
                    $(win.document.body).find('table').addClass('compact').css('font-size', 'inherit').css('color', '#000000');
                    $(win.document.body).find('h1').css('color', '#000000');
                    // Right align products count column
                    $(win.document.body).find('table tbody td:nth-child(3)').css('text-align', 'right');
                    $(win.document.body).find('table thead th:nth-child(3)').css('text-align', 'right');
                }
            }
        ],
        "language": {
            "search": "Search categories:",
            "lengthMenu": "Show _MENU_ categories",
            "info": "Showing _START_ to _END_ of _TOTAL_ categories",
            "infoEmpty": "Showing 0 to 0 of 0 categories",
            "infoFiltered": "(filtered from _MAX_ total categories)",
            "zeroRecords": "No categories found",
            "emptyTable": "No categories available",
            "paginate": {
                "first": "First",
                "last": "Last",
                "next": "Next",
                "previous": "Previous"
            }
        },
        "columnDefs": [
            { "orderable": false, "targets": 3 }
        ]
    });
}

function openAddCategoryModal() {
    loadModalContent('category_modal', '<?php echo site_url('inventory/category_form'); ?>', '<i class="fa fa-plus"></i> Add Category');
}

function editCategory(id) {
    loadModalContent('category_modal', '<?php echo site_url('inventory/category_form/'); ?>' + id, '<i class="fa fa-edit"></i> Edit Category');
}

function deleteCategory(id) {
    showConfirmModal('Confirm Delete', 'Are you sure you want to delete this category?', function() {
        showAjaxModal_alert('Deleting...', 'loading');
        $.get('<?php echo site_url('inventory/delete_category/'); ?>' + id, function(response) {
            const data = JSON.parse(response);
            if(data.status === 'success') {
                showAjaxModal_alert(data.message, 'success', false);
                setTimeout(() => loadCategories(), 2000);
            } else {
                showAjaxModal_alert(data.message, 'error');
            }
        });
    }, 'Delete', 'danger');
}
</script>