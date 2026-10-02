/**
 * Billing System Enhancement Functions
 * Handles discount application and SMS reminders
 */

// Show discount modal for an invoice
function showDiscountModal(invoiceId) {
    $('#discount_invoice_id').val(invoiceId);
    $('#discountModal').modal('show');
}

// Send payment reminder SMS
function sendPaymentReminder(invoiceId) {
    showConfirmModal(
        'Send Payment Reminder',
        'Are you sure you want to send an SMS payment reminder to the parent?',
        function() {
            showAjaxModal_alert('Sending SMS...', 'loading');
            $.ajax({
                url: base_url + 'admin/send_payment_reminder/' + invoiceId,
                type: 'POST',
                dataType: 'json'
            }).done(function(response) {
                if(response.status === 'success') {
                    showAjaxModal_alert(response.message, 'success');
                } else {
                    showAjaxModal_alert(response.message || 'Failed to send reminder', 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('An error occurred while sending the reminder', 'error');
            });
        },
        'Send SMS',
        'info'
    );
}

// Apply discount to invoice
$('#applyDiscountForm').submit(function(e) {
    e.preventDefault();
    $('.close')[0].click();
    showAjaxModal_alert('Applying discount...', 'loading');
    
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
            showAjaxModal_alert(response.message, 'success');
            setTimeout(() => location.reload(), 2000);
        } else {
            showAjaxModal_alert(response.message || 'Failed to apply discount', 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('An error occurred while applying discount', 'error');
    });
});

// Calculate discount preview
$('#discount_type_id, #discount_amount').on('change', function() {
    var discountTypeId = $('#discount_type_id').val();
    var discountAmount = parseFloat($('#discount_amount').val()) || 0;
    
    if (discountTypeId && discountAmount > 0) {
        // Get discount type details via AJAX
        $.ajax({
            url: base_url + 'admin/get_discount_type/' + discountTypeId,
            type: 'GET',
            dataType: 'json',
            success: function(discountType) {
                var isPercentage = discountType.is_percentage == 1;
                var maxAmount = parseFloat(discountType.max_amount);
                
                if (isPercentage) {
                    if (discountAmount > 100) {
                        $('#discount_amount').val(100);
                        discountAmount = 100;
                    }
                    $('#discount_preview').html('<small class="text-info">Discount: ' + discountAmount + '%</small>');
                } else {
                    if (maxAmount > 0 && discountAmount > maxAmount) {
                        $('#discount_amount').val(maxAmount);
                        discountAmount = maxAmount;
                    }
                    $('#discount_preview').html('<small class="text-info">Discount: GH₵ ' + discountAmount.toFixed(2) + '</small>');
                }
            }
        });
    } else {
        $('#discount_preview').html('');
    }
});
