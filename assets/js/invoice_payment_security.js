/**
 * Invoice & Payment Security System
 * Handles permission checks and approval requests for locked records
 */

/**
 * Check if user can edit/delete a record
 */
function checkRecordPermission(recordType, recordId, action, callback) {
    $.ajax({
        url: base_url + 'approval_requests/check_permission',
        type: 'POST',
        data: {
            record_type: recordType,
            record_id: recordId,
            action: action
        },
        dataType: 'json',
        success: function(response) {
            if(response.status === 'success') {
                callback(response);
            } else {
                showAjaxModal_alert(response.message, 'error');
            }
        },
        error: function() {
            showAjaxModal_alert('Error checking permissions', 'error');
        }
    });
}

/**
 * Request approval for locked record
 */
function requestApproval(recordType, recordId, action) {
    // Show reason input modal
    showConfirmModal(
        'Request Approval',
        '<div class="form-group">' +
        '<label>Please provide a reason for this request:</label>' +
        '<textarea id="approval_reason" class="form-control" rows="3" placeholder="Enter reason..." required></textarea>' +
        '</div>',
        function() {
            var reason = $('#approval_reason').val().trim();
            
            if(!reason) {
                showAjaxModal_alert('Please provide a reason', 'error');
                return;
            }
            
            showAjaxModal_alert('Submitting request...', 'loading');
            
            $.ajax({
                url: base_url + 'approval_requests/request_approval',
                type: 'POST',
                data: {
                    record_type: recordType,
                    record_id: recordId,
                    action: action,
                    reason: reason
                },
                dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        showAjaxModal_alert(response.message, 'success');
                    } else {
                        showAjaxModal_alert(response.message, 'error');
                    }
                },
                error: function() {
                    showAjaxModal_alert('Error submitting request', 'error');
                }
            });
        },
        'Submit Request',
        'primary'
    );
}

/**
 * Handle invoice edit with permission check
 */
function editInvoiceWithCheck(invoiceId) {
    checkRecordPermission('invoice', invoiceId, 'edit', function(response) {
        if(response.can_perform) {
            // Proceed with edit
            window.location.href = base_url + 'admin/invoice/edit/' + invoiceId;
        } else {
            // Show locked message and offer to request approval
            showConfirmModal(
                'Invoice Locked',
                '<div class="alert alert-warning">' +
                '<i class="fa fa-lock"></i> <strong>This invoice is locked:</strong><br>' +
                response.locked_reason +
                '</div>' +
                '<p>Would you like to request approval from a super administrator to edit this invoice?</p>',
                function() {
                    requestApproval('invoice', invoiceId, 'edit');
                },
                'Request Approval',
                'warning'
            );
        }
    });
}

/**
 * Handle invoice delete with permission check
 */
function deleteInvoiceWithCheck(invoiceId) {
    checkRecordPermission('invoice', invoiceId, 'delete', function(response) {
        if(response.can_perform) {
            // Proceed with delete confirmation
            showConfirmModal(
                'Confirm Delete',
                'Are you sure you want to delete this invoice?',
                function() {
                    showAjaxModal_alert('Deleting...', 'loading');
                    $.ajax({
                        url: base_url + 'admin/invoice/delete/' + invoiceId,
                        type: 'GET',
                        dataType: 'json',
                        success: function(response) {
                            if(response.status === 'success') {
                                showAjaxModal_alert(response.message, 'success');
                                setTimeout(() => location.reload(), 2000);
                            } else {
                                showAjaxModal_alert(response.message, 'error');
                            }
                        },
                        error: function() {
                            showAjaxModal_alert('Error deleting invoice', 'error');
                        }
                    });
                },
                'Delete',
                'danger'
            );
        } else {
            // Show locked message and offer to request approval
            showConfirmModal(
                'Invoice Locked',
                '<div class="alert alert-warning">' +
                '<i class="fa fa-lock"></i> <strong>This invoice is locked:</strong><br>' +
                response.locked_reason +
                '</div>' +
                '<p>Would you like to request approval from a super administrator to delete this invoice?</p>',
                function() {
                    requestApproval('invoice', invoiceId, 'delete');
                },
                'Request Approval',
                'warning'
            );
        }
    });
}

/**
 * Handle payment edit with permission check
 */
function editPaymentWithCheck(paymentId) {
    checkRecordPermission('payment', paymentId, 'edit', function(response) {
        if(response.can_perform) {
            // Proceed with edit
            window.location.href = base_url + 'admin/payment/edit/' + paymentId;
        } else {
            // Show locked message and offer to request approval
            showConfirmModal(
                'Receipt Locked',
                '<div class="alert alert-warning">' +
                '<i class="fa fa-lock"></i> <strong>This receipt is locked:</strong><br>' +
                response.locked_reason +
                '</div>' +
                '<p>Would you like to request approval from a super administrator to edit this receipt?</p>',
                function() {
                    requestApproval('payment', paymentId, 'edit');
                },
                'Request Approval',
                'warning'
            );
        }
    });
}

/**
 * Handle payment delete with permission check
 */
function deletePaymentWithCheck(paymentId) {
    checkRecordPermission('payment', paymentId, 'delete', function(response) {
        if(response.can_perform) {
            // Proceed with delete confirmation
            showConfirmModal(
                'Confirm Delete',
                'Are you sure you want to delete this receipt?',
                function() {
                    showAjaxModal_alert('Deleting...', 'loading');
                    $.ajax({
                        url: base_url + 'admin/payment/delete/' + paymentId,
                        type: 'GET',
                        dataType: 'json',
                        success: function(response) {
                            if(response.status === 'success') {
                                showAjaxModal_alert(response.message, 'success');
                                setTimeout(() => location.reload(), 2000);
                            } else {
                                showAjaxModal_alert(response.message, 'error');
                            }
                        },
                        error: function() {
                            showAjaxModal_alert('Error deleting receipt', 'error');
                        }
                    });
                },
                'Delete',
                'danger'
            );
        } else {
            // Show locked message and offer to request approval
            showConfirmModal(
                'Receipt Locked',
                '<div class="alert alert-warning">' +
                '<i class="fa fa-lock"></i> <strong>This receipt is locked:</strong><br>' +
                response.locked_reason +
                '</div>' +
                '<p>Would you like to request approval from a super administrator to delete this receipt?</p>',
                function() {
                    requestApproval('payment', paymentId, 'delete');
                },
                'Request Approval',
                'warning'
            );
        }
    });
}

/**
 * Add lock indicators to invoice/payment rows
 */
function addLockIndicators() {
    // Add lock icons to locked records
    $('[data-locked="true"]').each(function() {
        $(this).prepend('<i class="fa fa-lock text-warning" title="Locked"></i> ');
    });
}

/**
 * Initialize security system on page load
 */
$(document).ready(function() {
    addLockIndicators();
    
    // Override default edit/delete handlers
    $('.edit-invoice-btn').off('click').on('click', function(e) {
        e.preventDefault();
        var invoiceId = $(this).data('invoice-id');
        editInvoiceWithCheck(invoiceId);
    });
    
    $('.delete-invoice-btn').off('click').on('click', function(e) {
        e.preventDefault();
        var invoiceId = $(this).data('invoice-id');
        deleteInvoiceWithCheck(invoiceId);
    });
    
    $('.edit-payment-btn').off('click').on('click', function(e) {
        e.preventDefault();
        var paymentId = $(this).data('payment-id');
        editPaymentWithCheck(paymentId);
    });
    
    $('.delete-payment-btn').off('click').on('click', function(e) {
        e.preventDefault();
        var paymentId = $(this).data('payment-id');
        deletePaymentWithCheck(paymentId);
    });
});
