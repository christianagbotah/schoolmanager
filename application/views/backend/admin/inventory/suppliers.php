<!-- Suppliers Management -->
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

/* Fix for AdminLTE auto min-height */
.content-wrapper {
    min-height: auto !important;
    height: auto !important;
}

/* Ensure table and containers don't clip the popup menu */
.inventory-content .bg-white,
.inventory-content .overflow-x-auto,
.inventory-content table {
    overflow: visible !important;
}

/* Ensure popup menu floats above all content */
.supplier-action-popup-menu {
    position: fixed !important;
    z-index: 99999 !important;
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
#suppliers_table { min-width: 820px; margin: 0 !important; }
#suppliers_table thead { background: #f8fafc !important; }
#suppliers_table thead th {
    padding: 12px 13px !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    border-bottom: 1px solid #e2e8f0 !important;
}
#suppliers_table tbody td {
    padding: 12px 13px !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle;
    border-bottom: 1px solid #eef2f7 !important;
}
#suppliers_table tbody td * { font-size: inherit !important; }
#suppliers_table tbody button, #suppliers_table tbody a { font-size: 13px !important; }
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
#createModal .modal-dialog { width: min(720px, calc(100vw - 30px)); }
#createModal .modal-content { border-radius: 14px; overflow: hidden; }
#createModal .modal-header { padding: 16px 18px; border-bottom: 1px solid #e2e8f0; }
#createModal .modal-body { padding: 18px; }
#createModal .modal-body label { color: #334155; font-size: 14px !important; font-weight: 800; }
#createModal .modal-body .form-control { min-height: 44px; border: 1px solid #cbd5e1; border-radius: 9px; font-size: 15px !important; }
#createModal .modal-body textarea.form-control { min-height: 94px; }
#createModal .modal-body .btn { min-height: 42px; padding: 8px 14px !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 800 !important; }
#detailsModal .modal-dialog { width: min(720px, calc(100vw - 30px)); }
#detailsModal .modal-content { border-radius: 14px; overflow: hidden; }
#detailsModal .modal-header { padding: 16px 18px; border-bottom: 1px solid #e2e8f0; }
#detailsModal .modal-body { padding: 18px; }
#detailsModal .modal-body label { color: #334155; font-size: 14px !important; font-weight: 800; }
#detailsModal .modal-body .form-control { min-height: 44px; border: 1px solid #cbd5e1; border-radius: 9px; font-size: 15px !important; }
#detailsModal .modal-body textarea.form-control { min-height: 94px; }
#detailsModal .modal-body .btn { min-height: 42px; padding: 8px 14px !important; border-radius: 8px !important; font-size: 14px !important; font-weight: 800 !important; }
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
            <p class="inventory-ops-list-eyebrow">Inventory Purchasing</p>
            <h1>Suppliers</h1>
            <p>Manage vendors, contacts, availability and supplier details used by purchasing workflows.</p>
        </div>
        <button onclick="openAddSupplierModal()" class="btn btn-primary inventory-ops-list-primary">
            <i class="fa fa-plus"></i> Add Supplier
        </button>
    </div>

    <div class="inventory-ops-table-shell">

        <div class="overflow-x-auto">
            <table id="suppliers_table" class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-left font-bold text-gray-700 uppercase tracking-wider">Supplier Name</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-left font-bold text-gray-700 uppercase tracking-wider">Contact Person</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-left font-bold text-gray-700 uppercase tracking-wider">Phone</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-left font-bold text-gray-700 uppercase tracking-wider">Email</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-right font-bold text-gray-700 uppercase tracking-wider">Products</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-center font-bold text-gray-700 uppercase tracking-wider">Status</th>
                        <th style="font-size: 1.25rem !important;" class="px-8 py-5 text-right font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="suppliers_tbody">
                    <tr><td colspan="7" style="font-size: 1.25rem !important;" class="px-8 py-10 text-center text-gray-500">Loading suppliers...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script>
$(document).ready(function() {
    loadSuppliers();

    // Force remove AdminLTE auto-calculated min-height
    function removeAutoMinHeight() {
        $('.content-wrapper').css('min-height', '');
        $('.content-wrapper').attr('style', function(i, style) {
            if (style) {
                return style.replace(/min-height\s*:\s*[^;]+;?/gi, '');
            }
        });
    }

    // Run immediately and on window resize
    removeAutoMinHeight();
    $(window).on('resize', removeAutoMinHeight);

});

function loadSuppliers() {
    $.get('<?php echo site_url('inventory/get_suppliers'); ?>', function(response) {
        renderSuppliersTable(JSON.parse(response));
    });
}

function renderSuppliersTable(suppliers) {
    // Destroy existing DataTable if it exists
    if ($.fn.DataTable.isDataTable('#suppliers_table')) {
        $('#suppliers_table').DataTable().destroy();
    }

    let html = '';
    // Don't add "no data" row - let DataTable handle it
    suppliers.forEach(supplier => {
        const statusBadge = supplier.status == 1
            ? '<span style="font-size: 1rem !important;" class="inline-flex px-3 py-1.5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>'
            : '<span style="font-size: 1rem !important;" class="inline-flex px-3 py-1.5 font-semibold rounded-full bg-gray-100 text-gray-800">Inactive</span>';

        html += `
            <tr class="hover:bg-blue-50 transition-colors">
                <td style="font-size: 1.25rem !important;" class="px-8 py-5 font-semibold text-gray-900 leading-relaxed">${supplier.name}</td>
                <td style="font-size: 1.25rem !important;" class="px-8 py-5 text-gray-600">${supplier.contact_person || '-'}</td>
                <td style="font-size: 1.25rem !important;" class="px-8 py-5 text-gray-600">${supplier.phone || '-'}</td>
                <td style="font-size: 1.25rem !important;" class="px-8 py-5 text-gray-600">${supplier.email || '-'}</td>
                <td style="font-size: 1.25rem !important;" class="px-8 py-5 text-right text-gray-900 font-medium">${supplier.product_count || 0}</td>
                <td class="px-8 py-5 text-center">${statusBadge}</td>
                <td class="px-8 py-5 text-center">
                    <div class="btn-group">
                        <button type="button" class="btn btn-sm btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style="font-size: 1.125rem; padding: 0.5rem 1rem;">
                            <i class="fa fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-right" style="font-size: 1.125rem;">
                            <li><a href="javascript:void(0);" onclick="viewSupplierDetails(${supplier.id})" style="padding: 0.5rem 1.5rem; display: block;"><i class="fa fa-eye text-primary"></i> View Details</a></li>
                            <li role="separator" class="divider" style="height: 1px; margin: 0.5rem 0; background-color: #e5e7eb;"></li>
                            <li><a href="javascript:void(0);" onclick="editSupplier(${supplier.id})" style="padding: 0.5rem 1.5rem; display: block;"><i class="fa fa-edit text-info"></i> Edit Supplier</a></li>
                            <li role="separator" class="divider" style="height: 1px; margin: 0.5rem 0; background-color: #e5e7eb;"></li>
                            ${supplier.status == 1 ?
                                '<li><a href="javascript:void(0);" onclick="toggleSupplierStatus(' + supplier.id + ', 1)" style="padding: 0.5rem 1.5rem; display: block;"><i class="fa fa-ban text-warning"></i> Deactivate</a></li>' :
                                '<li><a href="javascript:void(0);" onclick="toggleSupplierStatus(' + supplier.id + ', 0)" style="padding: 0.5rem 1.5rem; display: block;"><i class="fa fa-check-circle text-success"></i> Activate</a></li>'
                            }
                            <li role="separator" class="divider" style="height: 1px; margin: 0.5rem 0; background-color: #e5e7eb;"></li>
                            <li><a href="javascript:void(0);" onclick="deleteSupplier(${supplier.id})" style="padding: 0.5rem 1.5rem; display: block; color: #dc2626;"><i class="fa fa-trash"></i> Delete</a></li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
    });

    $('#suppliers_tbody').html(html);

    // Initialize DataTable
    $('#suppliers_table').DataTable({
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
                extend: 'excel',
                text: '<i class="fa fa-file-excel mr-2"></i>Excel',
                className: 'btn btn-success',
                title: 'Suppliers',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5],
                    format: {
                        body: function(data, row, column, node) {
                            // Clean status badges - extract text only
                            if(column === 5) {
                                return $(node).text().trim();
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
                title: 'Suppliers',
                orientation: 'landscape',
                pageSize: 'A4',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5],
                    format: {
                        body: function(data, row, column, node) {
                            // Clean status badges
                            if(column === 5) {
                                return $(node).text().trim();
                            }
                            return $(node).text();
                        }
                    }
                },
                customize: function(doc) {
                    doc.content[1].table.widths = ['20%', '15%', '20%', '15%', '15%', '15%'];
                    doc.styles.tableHeader.fillColor = '#3B82F6';
                    doc.styles.tableHeader.color = '#FFFFFF';
                }
            },
            {
                extend: 'print',
                text: '<i class="fa fa-print mr-2"></i>Print',
                className: 'btn btn-info',
                title: 'Suppliers',
                exportOptions: {
                    columns: [0, 1, 2, 3, 4, 5],
                    format: {
                        body: function(data, row, column, node) {
                            // Clean status badges
                            if(column === 5) {
                                return $(node).text().trim();
                            }
                            return $(node).text();
                        }
                    }
                },
                customize: function(win) {
                    $(win.document.body).css('font-size', '10pt').css('color', '#000000');
                    $(win.document.body).find('table').addClass('compact').css('font-size', 'inherit').css('color', '#000000');
                    $(win.document.body).find('h1').css('color', '#000000');
                }
            }
        ],
        "language": {
            "search": "Search suppliers:",
            "lengthMenu": "Show _MENU_ suppliers",
            "info": "Showing _START_ to _END_ of _TOTAL_ suppliers",
            "infoEmpty": "Showing 0 to 0 of 0 suppliers",
            "infoFiltered": "(filtered from _MAX_ total suppliers)",
            "zeroRecords": "No suppliers found",
            "emptyTable": "No suppliers available"
        },
        "columnDefs": [
            { "orderable": false, "targets": [6] }
        ]
    });
}

function openAddSupplierModal() {
    loadModalContent('createModal', '<?php echo site_url('inventory/supplier_form'); ?>', '<i class="fa fa-plus"></i> Add Supplier');
}

function editSupplier(id) {
    // Clean up any existing modals first
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open');
    $('#createModal').modal('hide');

    loadModalContent('createModal', '<?php echo site_url('inventory/supplier_form/'); ?>' + id, '<i class="fa fa-edit"></i> Edit Supplier');
}

function viewSupplierDetails(id) {
    loadModalContent('detailsModal', '<?php echo site_url('inventory/supplier_details/'); ?>' + id, '<i class="fa fa-info-circle"></i> Supplier Details');
}

function toggleSupplierStatus(id, currentStatus) {
    const action = currentStatus == 1 ? 'deactivate' : 'activate';
    const actionText = currentStatus == 1 ? 'Deactivate' : 'Activate';

    showConfirmModal('Confirm ' + actionText, 'Are you sure you want to ' + action + ' this supplier?', function() {
        showAjaxModal_alert(actionText + 'ing...', 'loading');
        $.post('<?php echo site_url('inventory/toggle_supplier_status'); ?>', { supplier_id: id }, function(response) {
            const data = JSON.parse(response);
            if(data.status === 'success') {
                showAjaxModal_alert(data.message, 'success');
                setTimeout(() => loadSuppliers(), 2000);
            } else {
                showAjaxModal_alert(data.message, 'error');
            }
        }).fail(function() {
            showAjaxModal_alert('An error occurred', 'error');
        });
    }, actionText, currentStatus == 1 ? 'warning' : 'success');
}

function deleteSupplier(id) {
    showConfirmModal('Confirm Delete', 'Are you sure you want to delete this supplier?', function() {
        showAjaxModal_alert('Deleting...', 'loading');
        $.get('<?php echo site_url('inventory/delete_supplier/'); ?>' + id, function(response) {
            const data = JSON.parse(response);
            if(data.status === 'success') {
                showAjaxModal_alert(data.message, 'success');
                setTimeout(() => loadSuppliers(), 2000);
            } else {
                showAjaxModal_alert(data.message, 'error');
            }
        });
    }, 'Delete', 'danger');
}

// ============================================
// SUPPLIER ACTION POPUP MENU FUNCTIONALITY
// ============================================

var currentSupplierId = null;
var currentSupplierData = null;
var $supplierActionPopupMenu = null;

$(function() {
    $supplierActionPopupMenu = $('#supplierActionPopupMenu');
    initSupplierPopupMenus();
});

function initSupplierPopupMenus() {
    // Close popup when clicking outside
    $(document).off('click.supplierPopup').on('click.supplierPopup', function(e) {
        if (!$(e.target).closest('.supplier-action-popup-btn, .supplier-action-popup-menu').length) {
            closeSupplierPopupMenus();
        }
    });

    // Bind action buttons
    $('#supplierActionViewBtn').off('click').on('click', function() {
        closeSupplierPopupMenus();
        viewSupplierDetails(currentSupplierId);
    });

    $('#supplierActionEditBtn').off('click').on('click', function() {
        closeSupplierPopupMenus();
        editSupplier(currentSupplierId);
    });

    $('#supplierActionActivateBtn').off('click').on('click', function() {
        closeSupplierPopupMenus();
        toggleSupplierStatus(currentSupplierId, 0);
    });

    $('#supplierActionDeactivateBtn').off('click').on('click', function() {
        closeSupplierPopupMenus();
        toggleSupplierStatus(currentSupplierId, 1);
    });

    $('#supplierActionDeleteBtn').off('click').on('click', function() {
        closeSupplierPopupMenus();
        deleteSupplier(currentSupplierId);
    });
}

function closeSupplierPopupMenus() {
    if ($supplierActionPopupMenu) $supplierActionPopupMenu.removeClass('show');
    $('.supplier-action-popup-btn').removeClass('active');
}

function toggleSupplierActionMenu(btn, event, supplierId) {
    event.stopPropagation();
    event.preventDefault();

    var btnElement = btn instanceof jQuery ? btn[0] : btn;
    var $btn = $(btnElement);
    var $row = $btn.closest('tr');
    var $dataSpan = $row.find('.supplier-action-data');

    currentSupplierId = $dataSpan.data('supplier-id');
    currentSupplierData = {
        name: $dataSpan.data('supplier-name'),
        status: $dataSpan.data('status')
    };

    // Show/hide activate/deactivate buttons based on status
    if (currentSupplierData.status == 1) {
        $('#supplierActionActivateBtn').hide();
        $('#supplierActionDeactivateBtn').show();
    } else {
        $('#supplierActionActivateBtn').show();
        $('#supplierActionDeactivateBtn').hide();
    }

    // If menu is already open, close it
    if ($supplierActionPopupMenu && $supplierActionPopupMenu.hasClass('show')) {
        closeSupplierPopupMenus();
        return;
    }

    closeSupplierPopupMenus();

    // Position the menu
    var btnRect = btnElement.getBoundingClientRect();

    // Use fixed values for menu dimensions
    var menuWidth = 200;
    var menuHeight = 240;

    // Calculate position relative to viewport (using fixed positioning)
    var left = btnRect.right + 5;
    var top = btnRect.top;

    // Adjust if menu would go off right edge - show on left side instead
    if (left + menuWidth > window.innerWidth) {
        left = btnRect.left - menuWidth - 5;
    }

    // Adjust if menu would go off bottom edge - position above or at top of visible area
    if (top + menuHeight > window.innerHeight) {
        // Try positioning above the button
        var topAbove = btnRect.top - menuHeight - 5;
        if (topAbove >= 0) {
            top = topAbove;
        } else {
            // If can't fit above, position at top of viewport with small margin
            top = 10;
        }
    }

    // Ensure left position is within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - menuWidth - 10));

    // Ensure top position is within viewport
    top = Math.max(10, Math.min(top, window.innerHeight - menuHeight - 10));

    $supplierActionPopupMenu.css({
        left: left + 'px',
        top: top + 'px'
    }).addClass('show');

    $btn.addClass('active');
}

</script>