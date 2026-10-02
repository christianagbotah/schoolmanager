/**
 * Discount Modification Helper Functions
 * Quick integration for existing discount management pages
 */

/**
 * Check if user can modify a discount
 * @param {number} discountId 
 * @param {string} table - 'student_discount_assignments' or 'invoice_discounts'
 * @param {function} callback - Called with permission object
 */
function checkDiscountModificationPermission(discountId, table, callback) {
    $.ajax({
        url: base_url + 'discount_modification/check_permission',
        type: 'POST',
        data: {
            discount_id: discountId,
            table: table
        },
        dataType: 'json',
        success: function(response) {
            if(response.status === 'success') {
                callback(response.data);
            } else {
                showAjaxModal_alert(response.message, 'error');
            }
        },
        error: function() {
            showAjaxModal_alert('Failed to check permissions', 'error');
        }
    });
}

/**
 * Request modification approval
 * @param {number} discountId 
 * @param {string} table 
 * @param {string} actionType - 'edit', 'delete', 'activate', 'deactivate'
 * @param {string} reason 
 * @param {object} editData - Optional, for edit operations
 * @param {function} successCallback 
 */
function requestDiscountModification(discountId, table, actionType, reason, editData, successCallback) {
    if(!reason || reason.trim() === '') {
        showAjaxModal_alert('Please provide a reason for this modification', 'warning');
        return;
    }
    
    var data = {
        discount_id: discountId,
        table: table,
        action_type: actionType,
        reason: reason
    };
    
    if(editData) {
        data.edit_data = editData;
    }
    
    showAjaxModal_alert('Sending request...', 'loading');
    
    $.ajax({
        url: base_url + 'discount_modification/request_modification',
        type: 'POST',
        data: data,
        dataType: 'json',
        success: function(response) {
            if(response.status === 'success') {
                showAjaxModal_alert(response.message, 'success');
                if(successCallback) {
                    setTimeout(successCallback, 2000);
                }
            } else {
                showAjaxModal_alert(response.message, 'error');
            }
        },
        error: function() {
            showAjaxModal_alert('Failed to send request', 'error');
        }
    });
}

/**
 * Show modal to request modification approval
 * @param {number} discountId 
 * @param {string} table 
 * @param {string} actionType 
 * @param {object} editData - Optional
 */
function showModificationRequestModal(discountId, table, actionType, editData) {
    var actionText = actionType.charAt(0).toUpperCase() + actionType.slice(1);
    var title = 'Request Permission to ' + actionText + ' Discount';
    
    var content = '<div class="form-group">' +
        '<label>Reason for ' + actionType + ' <span class="text-danger">*</span></label>' +
        '<textarea id="modification_reason" class="form-control" rows="4" required ' +
        'placeholder="Explain why you need to ' + actionType + ' this discount..."></textarea>' +
        '</div>' +
        '<div class="alert alert-info">' +
        '<i class="fa fa-info-circle"></i> ' +
        'Your request will be sent to super admin for approval. ' +
        'Once approved, you will have a limited time to complete the action.' +
        '</div>';
    
    showModalWithContent('createModal', title, content);
    
    // Add submit button handler
    $('#createModal .modal-footer').html(
        '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
        '<button type="button" class="btn btn-primary" onclick="submitModificationRequest(' + 
        discountId + ', \'' + table + '\', \'' + actionType + '\', ' + 
        (editData ? JSON.stringify(editData) : 'null') + ')">Send Request</button>'
    );
}

/**
 * Submit modification request from modal
 */
function submitModificationRequest(discountId, table, actionType, editData) {
    var reason = $('#modification_reason').val();
    
    if(!reason || reason.trim() === '') {
        showAjaxModal_alert('Please provide a reason', 'warning');
        return;
    }
    
    $('.close').click(); // Close modal
    
    requestDiscountModification(discountId, table, actionType, reason, editData, function() {
        location.reload();
    });
}

/**
 * Handle discount edit with permission check
 * @param {number} discountId 
 * @param {string} table 
 * @param {function} editFunction - Function to call if user has permission
 */
function handleDiscountEdit(discountId, table, editFunction) {
    checkDiscountModificationPermission(discountId, table, function(permission) {
        if(permission.can_modify) {
            // User has permission, proceed with edit
            editFunction();
        } else if(permission.requires_approval) {
            // Need to request approval
            showAjaxModal_alert(permission.reason, 'warning', false);
            setTimeout(function() {
                showModificationRequestModal(discountId, table, 'edit');
            }, 2000);
        } else {
            // No permission at all
            showAjaxModal_alert(permission.reason, 'error');
        }
    });
}

/**
 * Handle discount delete with permission check
 * @param {number} discountId 
 * @param {string} table 
 * @param {function} deleteFunction - Function to call if user has permission
 */
function handleDiscountDelete(discountId, table, deleteFunction) {
    checkDiscountModificationPermission(discountId, table, function(permission) {
        if(permission.can_modify) {
            // User has permission, show confirmation
            showConfirmModal(
                'Confirm Delete',
                'Are you sure you want to delete this discount?',
                deleteFunction,
                'Delete',
                'danger'
            );
        } else if(permission.requires_approval) {
            // Need to request approval
            showAjaxModal_alert(permission.reason, 'warning', false);
            setTimeout(function() {
                showModificationRequestModal(discountId, table, 'delete');
            }, 2000);
        } else {
            // No permission at all
            showAjaxModal_alert(permission.reason, 'error');
        }
    });
}

/**
 * Handle discount activate/deactivate with permission check
 * @param {number} discountId 
 * @param {string} table 
 * @param {boolean} activate - true to activate, false to deactivate
 * @param {function} toggleFunction - Function to call if user has permission
 */
function handleDiscountToggle(discountId, table, activate, toggleFunction) {
    var actionType = activate ? 'activate' : 'deactivate';
    
    checkDiscountModificationPermission(discountId, table, function(permission) {
        if(permission.can_modify) {
            // User has permission, proceed
            toggleFunction();
        } else if(permission.requires_approval) {
            // Need to request approval
            showAjaxModal_alert(permission.reason, 'warning', false);
            setTimeout(function() {
                showModificationRequestModal(discountId, table, actionType);
            }, 2000);
        } else {
            // No permission at all
            showAjaxModal_alert(permission.reason, 'error');
        }
    });
}

/**
 * Execute an approved modification
 * @param {number} requestId 
 * @param {number} discountId 
 * @param {string} table 
 * @param {string} actionType 
 * @param {function} successCallback 
 */
function executeApprovedModification(requestId, discountId, table, actionType, successCallback) {
    showConfirmModal(
        'Execute ' + actionType.toUpperCase(),
        'Are you sure you want to execute this action? This cannot be undone.',
        function() {
            showAjaxModal_alert('Executing...', 'loading');
            
            $.ajax({
                url: base_url + 'discount_modification/execute_modification',
                type: 'POST',
                data: {
                    request_id: requestId,
                    discount_id: discountId,
                    table: table,
                    action_type: actionType
                },
                dataType: 'json',
                success: function(response) {
                    if(response.status === 'success') {
                        showAjaxModal_alert(response.message, 'success');
                        if(successCallback) {
                            setTimeout(successCallback, 2000);
                        }
                    } else {
                        showAjaxModal_alert(response.message, 'error');
                    }
                },
                error: function() {
                    showAjaxModal_alert('Failed to execute action', 'error');
                }
            });
        },
        'Execute',
        'danger'
    );
}

/**
 * Add permission indicator to discount row
 * @param {number} discountId 
 * @param {string} table 
 * @param {string} rowSelector - jQuery selector for the row
 */
function addPermissionIndicator(discountId, table, rowSelector) {
    checkDiscountModificationPermission(discountId, table, function(permission) {
        var indicator = '';
        
        if(permission.can_modify && !permission.requires_approval) {
            if(permission.request_id) {
                // Has active approval
                var hoursRemaining = Math.round((permission.expires_at - Math.floor(Date.now() / 1000)) / 3600);
                indicator = '<span class="label label-success" title="You have active approval">' +
                    '<i class="fa fa-unlock"></i> Unlocked (' + hoursRemaining + 'h)' +
                    '</span>';
            } else {
                // Super admin or creator
                indicator = '<span class="label label-primary" title="You can modify this">' +
                    '<i class="fa fa-key"></i> Full Access' +
                    '</span>';
            }
        } else if(permission.requires_approval) {
            // Locked, needs approval
            indicator = '<span class="label label-warning" title="' + permission.reason + '">' +
                '<i class="fa fa-lock"></i> Locked' +
                '</span>';
        }
        
        $(rowSelector).find('.permission-indicator').html(indicator);
    });
}

// Example usage in your discount list page:
/*
$(document).ready(function() {
    // Add permission indicators to all discount rows
    $('.discount-row').each(function() {
        var discountId = $(this).data('discount-id');
        var table = $(this).data('table');
        addPermissionIndicator(discountId, table, '#discount-row-' + discountId);
    });
});

// Example edit button handler
function editDiscount(discountId) {
    handleDiscountEdit(discountId, 'student_discount_assignments', function() {
        // This function is called if user has permission
        loadModalContent('createModal', 'discount/edit/' + discountId, 'Edit Discount');
    });
}

// Example delete button handler
function deleteDiscount(discountId) {
    handleDiscountDelete(discountId, 'student_discount_assignments', function() {
        // This function is called if user has permission
        $.ajax({
            url: 'discount/delete/' + discountId,
            type: 'POST',
            success: function(response) {
                showAjaxModal_alert('Discount deleted', 'success');
                setTimeout(function() { location.reload(); }, 2000);
            }
        });
    });
}

// Example activate/deactivate handler
function toggleDiscount(discountId, activate) {
    handleDiscountToggle(discountId, 'student_discount_assignments', activate, function() {
        // This function is called if user has permission
        $.ajax({
            url: 'discount/toggle/' + discountId,
            type: 'POST',
            data: { activate: activate },
            success: function(response) {
                showAjaxModal_alert('Discount ' + (activate ? 'activated' : 'deactivated'), 'success');
                setTimeout(function() { location.reload(); }, 2000);
            }
        });
    });
}
*/
