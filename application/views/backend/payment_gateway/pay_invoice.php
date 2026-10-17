<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$student = isset($student) && is_array($student) ? $student : [];
$payer = isset($payer) && is_array($payer) ? $payer : [];
$payment_student_id = isset($payment_student_id) ? (int) $payment_student_id : 0;
$return_url = isset($return_url) ? $return_url : site_url();
$currency_symbol = '₵';
$payer_phone = trim((string) ($payer['phone'] ?? ($student['phone'] ?? ($student['student_phone'] ?? ''))));
$student_name = trim((string) ($student['name'] ?? ''));
?>

<div class="row">
    <div class="col-md-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                <div class="panel-title"><i class="fa fa-shield"></i> Secure School Fees Payment</div>
            </div>
            <div class="panel-body">
                <div class="row">
                    <div class="col-md-7">
                        <h4 style="margin-top:0;">Invoice details</h4>
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <tbody>
                                    <tr><th style="width:35%;">Student</th><td><?php echo html_escape($student_name); ?></td></tr>
                                    <tr><th>Invoice #</th><td><strong><?php echo html_escape($invoice['invoice_code']); ?></strong></td></tr>
                                    <tr><th>Description</th><td><?php echo html_escape($invoice['title']); ?></td></tr>
                                    <tr><th>Total amount</th><td><?php echo $currency_symbol . number_format((float) $invoice['amount'], 2); ?></td></tr>
                                    <tr><th>Amount paid</th><td><?php echo $currency_symbol . number_format((float) $invoice['amount_paid'], 2); ?></td></tr>
                                    <tr><th>Balance due</th><td><strong class="text-danger"><?php echo $currency_symbol . number_format((float) $invoice['due'], 2); ?></strong></td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="alert alert-info" style="margin-bottom:0;">
                            <i class="fa fa-info-circle"></i>
                            Payment is credited only after Hubtel confirms the transaction. Refreshing or closing this page cannot mark an invoice paid.
                        </div>
                    </div>

                    <div class="col-md-5">
                        <?php if (empty($gateways)): ?>
                            <div class="alert alert-warning">
                                <strong>Online payment is not configured yet.</strong><br>
                                Please contact the school finance office. No payment will be recorded until the Hubtel payment gateway is configured and confirms a transaction.
                            </div>
                        <?php else: ?>
                            <h4 style="margin-top:0;">Pay with Mobile Money</h4>
                            <p class="text-muted">Enter the mobile number that should receive the payment prompt.</p>

                            <?php echo form_open(site_url('payment_gateway/initiate_hubtel'), ['id' => 'hubtelForm', 'autocomplete' => 'off']); ?>
                                <div class="form-group">
                                    <label for="hubtel_network">Network</label>
                                    <select id="hubtel_network" name="network" class="form-control" required>
                                        <option value="">Select network</option>
                                        <option value="mtn-gh">MTN Mobile Money</option>
                                        <option value="vodafone-gh">Telecel Cash</option>
                                        <option value="airtel-gh">AT Money</option>
                                        <option value="tigo-gh">AT Money (legacy route)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="hubtel_phone">Mobile money number</label>
                                    <input id="hubtel_phone" type="tel" name="phone_number" class="form-control" inputmode="tel" placeholder="0XXXXXXXXX" value="<?php echo html_escape($payer_phone); ?>" required>
                                </div>
                                <div class="form-group">
                                    <label for="hubtel_amount">Amount to pay</label>
                                    <div class="input-group">
                                        <span class="input-group-addon">₵</span>
                                        <input id="hubtel_amount" type="number" name="amount" class="form-control" min="0.01" step="0.01" max="<?php echo html_escape((string) $invoice['due']); ?>" value="<?php echo html_escape(number_format((float) $invoice['due'], 2, '.', '')); ?>" required>
                                    </div>
                                    <p class="help-block">You may make a part payment up to the outstanding balance.</p>
                                </div>
                                <input type="hidden" name="invoice_code" value="<?php echo html_escape($invoice['invoice_code']); ?>">
                                <input type="hidden" name="student_id" value="<?php echo $payment_student_id; ?>">
                                <button type="submit" class="btn btn-primary btn-lg btn-block" id="hubtelPayButton">
                                    <i class="fa fa-lock"></i> Send secure payment prompt
                                </button>
                            <?php echo form_close(); ?>
                            <div id="hubtelPaymentState" class="alert" style="display:none; margin-top:15px;"></div>
                        <?php endif; ?>
                    </div>
                </div>

                <div style="margin-top:20px;">
                    <a href="<?php echo html_escape($return_url); ?>" class="btn btn-default"><i class="fa fa-arrow-left"></i> Back to invoices</a>
                </div>
            </div>
        </div>
    </div>
</div>

<?php if (!empty($gateways)): ?>
<script>
(function($) {
    'use strict';

    var returnUrl = <?php echo json_encode($return_url, JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
    var statusUrl = <?php echo json_encode(site_url('payment_gateway/check_status/'), JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT); ?>;
    var pollTimer = null;

    function setPaymentState(type, message) {
        $('#hubtelPaymentState')
            .removeClass('alert-info alert-success alert-danger alert-warning')
            .addClass('alert-' + type)
            .html(message)
            .show();
    }

    function stopPolling() {
        if (pollTimer) {
            clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    function pollPaymentStatus(reference) {
        var attempts = 0;
        var maxAttempts = 60;

        function check() {
            attempts += 1;
            $.getJSON(statusUrl + encodeURIComponent(reference))
                .done(function(data) {
                    if (data.status === 'success') {
                        stopPolling();
                        setPaymentState('success', '<strong>Payment confirmed.</strong> Your invoice is being refreshed.');
                        setTimeout(function() { window.location.href = returnUrl; }, 1200);
                        return;
                    }
                    if (data.status === 'failed') {
                        stopPolling();
                        $('#hubtelPayButton').prop('disabled', false);
                        setPaymentState('danger', '<strong>Payment failed.</strong> No payment was credited. You can try again.');
                    }
                })
                .fail(function(xhr) {
                    if (xhr.status === 401 || xhr.status === 403 || xhr.status === 404) {
                        stopPolling();
                        $('#hubtelPayButton').prop('disabled', false);
                        setPaymentState('danger', 'Payment status could not be verified. Refresh the page before trying again.');
                    }
                });

            if (attempts >= maxAttempts) {
                stopPolling();
                $('#hubtelPayButton').prop('disabled', false);
                setPaymentState('warning', 'The payment is still awaiting confirmation. No money has been credited yet. Refresh this page to check again.');
            }
        }

        check();
        pollTimer = setInterval(check, 5000);
    }

    $('#hubtelForm').on('submit', function(event) {
        event.preventDefault();
        stopPolling();
        $('#hubtelPayButton').prop('disabled', true);
        setPaymentState('info', 'Sending a secure payment prompt to your phone…');

        $.ajax({
            url: this.action,
            type: 'POST',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false,
            dataType: 'json'
        }).done(function(data) {
            if (data.success === true && data.transaction_ref) {
                setPaymentState('info', '<strong>Prompt sent.</strong> Approve it on your phone. The invoice remains unpaid until Hubtel confirms the transaction.');
                pollPaymentStatus(data.transaction_ref);
                return;
            }
            $('#hubtelPayButton').prop('disabled', false);
            setPaymentState('danger', data.message || 'The payment request could not be started.');
        }).fail(function(xhr) {
            $('#hubtelPayButton').prop('disabled', false);
            var message = 'The payment request could not be started.';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                message = xhr.responseJSON.message;
            }
            setPaymentState('danger', message);
        });
    });
})(jQuery);
</script>
<?php endif; ?>
