// ENTERPRISE-GRADE: Bulk Invoice Management - AJAX Refresh System
// Implements event delegation and optimized refresh without full page reload

(function() {
    'use strict';
    
    // Global state management
    window.bulkInvoiceState = {
        term: null,
        year: null,
        filter: null,
        class_id: null,
        isLoaded: false
    };

    // Refresh bulk invoices without page reload
    window.refreshBulkInvoices = function() {
        if(!window.bulkInvoiceState.isLoaded) return;
        
        const data = {
            term: window.bulkInvoiceState.term,
            year: window.bulkInvoiceState.year,
            filter: window.bulkInvoiceState.filter,
            class_id: window.bulkInvoiceState.class_id
        };
        
        $.ajax({
            url: '<?php echo site_url('admin/get_bulk_invoices'); ?>',
            type: 'POST',
            dataType: 'json',
            data: data,
            success: function(response) {
                if(response.status === 'success') {
                    initBulkInvoiceTable(response.data);
                    updateBulkStats(response.stats);
                    toastr.success('Invoices refreshed successfully');
                }
            }
        });
    };

    // Store state when invoices are loaded
    const originalLoadBulkInvoices = window.loadBulkInvoices;
    window.loadBulkInvoices = function() {
        window.bulkInvoiceState.term = $('#bulk_term').val();
        window.bulkInvoiceState.year = $('#bulk_year').val();
        window.bulkInvoiceState.filter = $('#bulk_filter').val();
        window.bulkInvoiceState.class_id = $('#bulk_class').val();
        window.bulkInvoiceState.isLoaded = true;
        
        if(originalLoadBulkInvoices) {
            originalLoadBulkInvoices();
        }
    };

    // Event delegation for modification requests
    $(document).on('click', '[data-action="approve-receipt"]', function(e) {
        e.preventDefault();
        const requestId = $(this).data('request-id');
        approveReceiptWithRefresh(requestId);
    });

    $(document).on('click', '[data-action="approve-invoice"]', function(e) {
        e.preventDefault();
        const requestId = $(this).data('request-id');
        approveInvoiceWithRefresh(requestId);
    });

    function approveReceiptWithRefresh(requestId) {
        showConfirmModal(
            'Confirm Approval',
            'Approve this receipt modification?',
            function() {
                showAjaxModal_alert('Processing...', 'loading');
                $.ajax({
                    url: '<?php echo site_url("admin/approve_receipt_modification"); ?>',
                    type: 'POST',
                    data: { request_id: requestId },
                    dataType: 'json'
                }).done(function(response) {
                    if(response.status === 'success') {
                        showAjaxModal_alert(response.message, 'success', false);
                        setTimeout(() => {
                            $('.close').click();
                            refreshBulkInvoices();
                        }, 1500);
                    } else {
                        showAjaxModal_alert(response.message, 'error');
                    }
                }).fail(function() {
                    showAjaxModal_alert('An error occurred', 'error');
                });
            },
            'Approve',
            'success'
        );
    }

    function approveInvoiceWithRefresh(requestId) {
        showConfirmModal(
            'Confirm Approval',
            'Approve this invoice modification?',
            function() {
                showAjaxModal_alert('Processing...', 'loading');
                $.ajax({
                    url: '<?php echo site_url("admin/review_invoice_modification/"); ?>' + requestId + '/approve',
                    type: 'GET',
                    dataType: 'json'
                }).done(function(response) {
                    if(response.status === 'success') {
                        showAjaxModal_alert(response.message, 'success', false);
                        setTimeout(() => {
                            $('.close').click();
                            refreshBulkInvoices();
                        }, 1500);
                    } else {
                        showAjaxModal_alert(response.message, 'error');
                    }
                }).fail(function() {
                    showAjaxModal_alert('An error occurred', 'error');
                });
            },
            'Approve',
            'success'
        );
    }

})();
