<?php
$currency = get_settings('currency');
$student = $this->db->where('student_id', $this->session->userdata('student_id'))->get('student')->row_array();
?>

<div class="row">
    <div class="col-12">
        <div class="page-title-box">
            <h4 class="mb-0 font-size-18"><?php echo get_phrase('pay_invoice'); ?></h4>
        </div>
    </div>
</div>

<div class="row">
    <!-- Invoice Details -->
    <div class="col-lg-8">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title mb-4"><?php echo get_phrase('invoice_details'); ?></h4>
                
                <div class="table-responsive">
                    <table class="table table-borderless">
                        <tr>
                            <th width="30%"><?php echo get_phrase('invoice_code'); ?>:</th>
                            <td><strong><?php echo $invoice['invoice_code']; ?></strong></td>
                        </tr>
                        <tr>
                            <th><?php echo get_phrase('description'); ?>:</th>
                            <td><?php echo $invoice['title']; ?></td>
                        </tr>
                        <tr>
                            <th><?php echo get_phrase('total_amount'); ?>:</th>
                            <td><?php echo $currency . number_format($invoice['amount'], 2); ?></td>
                        </tr>
                        <tr>
                            <th><?php echo get_phrase('amount_paid'); ?>:</th>
                            <td class="text-success"><?php echo $currency . number_format($invoice['amount_paid'], 2); ?></td>
                        </tr>
                        <tr>
                            <th><?php echo get_phrase('balance_due'); ?>:</th>
                            <td class="text-danger"><h4><?php echo $currency . number_format($invoice['due'], 2); ?></h4></td>
                        </tr>
                    </table>
                </div>

                <hr>

                <h5 class="mb-3"><?php echo get_phrase('select_payment_method'); ?></h5>

                <div class="row">
                    <?php if (empty($gateways)): ?>
                    <div class="col-12">
                        <div class="alert alert-warning mb-0">
                            <i class="mdi mdi-alert-circle-outline"></i>
                            Online payment is not configured yet. Please contact the school finance office.
                        </div>
                    </div>
                    <?php else: ?>
                    <?php foreach ($gateways as $gateway): ?>
                    <div class="col-md-6 mb-3">
                        <div class="card gateway-card" onclick="selectGateway('<?php echo $gateway['code']; ?>', event)">
                            <div class="card-body text-center">
                                <img src="<?php echo base_url('assets/images/gateways/' . $gateway['icon']); ?>"
                                     alt="<?php echo $gateway['name']; ?>"
                                     style="height: 50px; margin-bottom: 10px;"
                                     onerror="this.src='<?php echo base_url('assets/images/default-gateway.png'); ?>'">
                                <h6><?php echo $gateway['name']; ?></h6>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Payment Form -->
    <div class="col-lg-4">
        <div class="card">
            <div class="card-body">
                <h4 class="card-title mb-4"><?php echo get_phrase('payment_information'); ?></h4>

                <!-- Hubtel Payment Form -->
                <form id="hubtelForm" style="display:none;">
                    <div class="form-group">
                        <label><?php echo get_phrase('select_network'); ?></label>
                        <select name="network" class="form-control" required>
                            <option value="mtn-gh">MTN Mobile Money</option>
                            <option value="vodafone-gh">Vodafone Cash</option>
                            <option value="airtel-gh">AirtelTigo Money</option>
                            <option value="tigo-gh">Tigo Cash</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label><?php echo get_phrase('phone_number'); ?></label>
                        <input type="tel" name="phone_number" class="form-control" 
                               placeholder="0XXXXXXXXX" value="<?php echo $student['phone']; ?>" required>
                    </div>
                    <div class="form-group">
                        <label><?php echo get_phrase('amount'); ?></label>
                        <input type="number" step="0.01" name="amount" class="form-control" 
                               value="<?php echo $invoice['due']; ?>" max="<?php echo $invoice['due']; ?>" required>
                    </div>
                    <input type="hidden" name="invoice_code" value="<?php echo $invoice['invoice_code']; ?>">
                    <input type="hidden" name="customer_name" value="<?php echo $student['name']; ?>">
                    <input type="hidden" name="email" value="<?php echo $student['email']; ?>">
                    <button type="submit" class="btn btn-primary btn-block btn-lg">
                        <i class="mdi mdi-lock"></i> <?php echo get_phrase('pay_now'); ?>
                    </button>
                </form>

                <div id="payment-info" class="text-center text-muted">
                    <i class="mdi mdi-information-outline" style="font-size: 48px;"></i>
                    <p class="mt-3"><?php echo get_phrase('select_payment_method_to_continue'); ?></p>
                </div>

                <div class="mt-4">
                    <div class="alert alert-info">
                        <i class="mdi mdi-shield-check"></i> <?php echo get_phrase('secure_payment_info'); ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
let selectedGateway = null;

function selectGateway(gateway, event) {
    selectedGateway = gateway;
    $('.gateway-card').removeClass('border-primary');
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('border-primary');
    }
    $('#hubtelForm, #payment-info').hide();
    if (gateway === 'hubtel') {
        $('#hubtelForm').show();
    }
}

// Hubtel Payment
$('#hubtelForm').submit(function(e) {
    e.preventDefault();
    showAjaxModal_alert('<?php echo get_phrase('initiating_payment'); ?>...', 'loading');
    
    $.ajax({
        url: '<?php echo site_url('payment_gateway/initiate_hubtel'); ?>',
        type: 'POST',
        data: new FormData(this),
        cache: false,
        contentType: false,
        processData: false
    }).done(function(response) {
        var data = typeof response === 'string' ? JSON.parse(response) : response;
        if(data.status === 'success') {
            showAjaxModal_alert('<?php echo get_phrase('payment_initiated'); ?><br><small><?php echo get_phrase('check_phone_for_prompt'); ?></small>', 'success');
            checkPaymentStatus(data.transaction_ref);
        } else {
            showAjaxModal_alert(data.message, 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('<?php echo get_phrase('an_error_occurred'); ?>', 'error');
    });
});

function checkPaymentStatus(ref) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes
    
    const interval = setInterval(function() {
        attempts++;
        
        $.get('<?php echo site_url('payment_gateway/check_status/'); ?>' + ref, function(response) {
            var data = typeof response === 'string' ? JSON.parse(response) : response;
            
            if (data.status === 'success') {
                clearInterval(interval);
                $('.close')[0].click();
                showAjaxModal_alert('<?php echo get_phrase('payment_successful'); ?>', 'success');
                setTimeout(() => location.reload(), 2000);
            } else if (data.status === 'failed') {
                clearInterval(interval);
                showAjaxModal_alert('<?php echo get_phrase('payment_failed'); ?>', 'error');
            }
        });
        
        if (attempts >= maxAttempts) {
            clearInterval(interval);
            showAjaxModal_alert('<?php echo get_phrase('payment_timeout'); ?>', 'warning');
        }
    }, 5000);
}
</script>

<style>
.gateway-card {
    cursor: pointer;
    transition: all 0.3s;
    border: 2px solid transparent;
}
.gateway-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}
.gateway-card.border-primary {
    border-color: #007bff !important;
    box-shadow: 0 4px 15px rgba(0,123,255,0.3);
}
</style>
