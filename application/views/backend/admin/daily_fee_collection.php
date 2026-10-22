<?php
$feeding_enabled = is_fee_module_enabled('feeding');
$breakfast_enabled = is_fee_module_enabled('breakfast');
$classes_enabled = is_fee_module_enabled('classes');
$water_enabled = is_fee_module_enabled('water');
$transport_enabled = is_fee_module_enabled('transport');
?>
<style>
.smart-cashier {
    --sc-primary: #1f4f46;
    --sc-primary-soft: #eef7f4;
    --sc-border: #e5e7eb;
    --sc-muted: #667085;
    --sc-text: #17201e;
    --sc-surface: #ffffff;
    --sc-bg: #f7f9f8;
    --sc-success: #157347;
    --sc-warning: #9a6700;
    color: var(--sc-text);
}
.smart-cashier * { box-sizing: border-box; }
.smart-cashier .sc-shell { background: var(--sc-bg); border: 1px solid var(--sc-border); border-radius: 18px; overflow: hidden; }
.smart-cashier .sc-header { padding: 24px 28px; background: var(--sc-surface); border-bottom: 1px solid var(--sc-border); display: flex; align-items: center; justify-content: space-between; gap: 18px; }
.smart-cashier .sc-header h2 { margin: 0; font-size: 24px; font-weight: 700; }
.smart-cashier .sc-header p { margin: 5px 0 0; color: var(--sc-muted); }
.smart-cashier .sc-date { background: var(--sc-primary-soft); color: var(--sc-primary); border-radius: 999px; padding: 9px 13px; font-weight: 600; white-space: nowrap; }
.smart-cashier .sc-body { padding: 24px; }
.smart-cashier .sc-card { background: var(--sc-surface); border: 1px solid var(--sc-border); border-radius: 16px; padding: 20px; margin-bottom: 18px; box-shadow: 0 4px 14px rgba(16, 24, 40, .04); }
.smart-cashier .sc-card-title { margin: 0 0 14px; font-size: 15px; font-weight: 700; color: var(--sc-text); }
.smart-cashier .sc-label { display: block; margin-bottom: 7px; font-weight: 600; color: #344054; }
.smart-cashier .sc-control { width: 100%; min-height: 46px; border: 1px solid #d0d5dd; border-radius: 10px; padding: 10px 12px; background: #fff; color: var(--sc-text); font-size: 15px; }
.smart-cashier .sc-control:focus { outline: none; border-color: var(--sc-primary); box-shadow: 0 0 0 3px rgba(31, 79, 70, .12); }
.smart-cashier .sc-grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 16px; }
.smart-cashier .sc-col-12 { grid-column: span 12; }
.smart-cashier .sc-col-8 { grid-column: span 8; }
.smart-cashier .sc-col-6 { grid-column: span 6; }
.smart-cashier .sc-col-4 { grid-column: span 4; }
.smart-cashier .sc-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
.smart-cashier .sc-stat { background: #fff; border: 1px solid var(--sc-border); border-radius: 14px; padding: 15px; }
.smart-cashier .sc-stat span { display: block; color: var(--sc-muted); font-size: 12px; margin-bottom: 5px; }
.smart-cashier .sc-stat strong { font-size: 20px; font-weight: 700; }
.smart-cashier .sc-amount-wrap { position: relative; }
.smart-cashier .sc-currency { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 24px; font-weight: 700; color: var(--sc-primary); }
.smart-cashier .sc-amount { height: 62px; padding-left: 46px; font-size: 28px; font-weight: 700; }
.smart-cashier .sc-help { color: var(--sc-muted); font-size: 12px; margin-top: 7px; line-height: 1.45; }
.smart-cashier .sc-allocation { border: 1px solid var(--sc-border); border-radius: 14px; overflow: hidden; }
.smart-cashier .sc-allocation-head, .smart-cashier .sc-allocation-row { display: grid; grid-template-columns: minmax(120px, 1.3fr) 1fr 1fr 1fr; gap: 10px; align-items: center; padding: 12px 14px; }
.smart-cashier .sc-allocation-head { background: #f9fafb; color: var(--sc-muted); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
.smart-cashier .sc-allocation-row { border-top: 1px solid var(--sc-border); }
.smart-cashier .sc-allocation-row:first-of-type { border-top: 0; }
.smart-cashier .sc-fee-name { font-weight: 650; }
.smart-cashier .sc-money { font-variant-numeric: tabular-nums; }
.smart-cashier .sc-allocated { color: var(--sc-success); font-weight: 700; }
.smart-cashier .sc-advance-targets { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 12px; }
.smart-cashier .sc-target { display: inline-flex; align-items: center; gap: 7px; padding: 8px 10px; border: 1px solid var(--sc-border); border-radius: 999px; background: #fff; cursor: pointer; user-select: none; }
.smart-cashier .sc-target input { margin: 0; }
.smart-cashier .sc-total { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 14px; padding: 14px; background: var(--sc-primary-soft); border-radius: 12px; }
.smart-cashier .sc-total strong { color: var(--sc-primary); font-size: 22px; }
.smart-cashier .sc-notice { display: none; margin-top: 10px; color: var(--sc-warning); font-size: 12px; }
.smart-cashier .sc-actions { display: flex; gap: 12px; align-items: center; }
.smart-cashier .sc-button { min-height: 48px; border: 0; border-radius: 11px; padding: 12px 18px; font-weight: 700; cursor: pointer; }
.smart-cashier .sc-button-primary { background: var(--sc-primary); color: #fff; flex: 1; }
.smart-cashier .sc-button-primary:disabled { opacity: .5; cursor: not-allowed; }
.smart-cashier .sc-button-secondary { background: #fff; border: 1px solid var(--sc-border); color: var(--sc-text); }
.smart-cashier .sc-receipt { display: none; margin-top: 15px; padding: 14px; border: 1px solid #abefc6; background: #ecfdf3; border-radius: 12px; }
.smart-cashier .sc-receipt a { font-weight: 700; color: var(--sc-success); }
.smart-cashier .sc-loading { opacity: .65; pointer-events: none; }
@media (max-width: 991px) {
    .smart-cashier .sc-col-8, .smart-cashier .sc-col-6, .smart-cashier .sc-col-4 { grid-column: span 12; }
    .smart-cashier .sc-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
    .smart-cashier .sc-header { padding: 18px; align-items: flex-start; flex-direction: column; }
    .smart-cashier .sc-header h2 { font-size: 20px; }
    .smart-cashier .sc-body { padding: 14px; }
    .smart-cashier .sc-card { padding: 15px; }
    .smart-cashier .sc-summary { grid-template-columns: 1fr 1fr; gap: 8px; }
    .smart-cashier .sc-stat { padding: 12px; }
    .smart-cashier .sc-stat strong { font-size: 17px; }
    .smart-cashier .sc-allocation { overflow-x: auto; }
    .smart-cashier .sc-allocation-head, .smart-cashier .sc-allocation-row { min-width: 570px; }
    .smart-cashier .sc-actions { flex-direction: column; }
    .smart-cashier .sc-button { width: 100%; }
}
</style>

<div class="smart-cashier">
    <div class="sc-shell">
        <div class="sc-header">
            <div>
                <h2><i class="fa fa-money"></i> <?php echo get_phrase('daily_fee_collection'); ?></h2>
                <p>Enter one payment amount. iEduPro will clear arrears first and preview the split before you collect.</p>
            </div>
            <div class="sc-date"><?php echo date('D, d M Y'); ?></div>
        </div>

        <div class="sc-body">
            <div class="sc-card">
                <label class="sc-label" for="student_id"><i class="fa fa-user"></i> <?php echo get_phrase('select_student'); ?></label>
                <select class="sc-control select2" id="student_id">
                    <option value=""><?php echo get_phrase('search_student_by_name_or_code'); ?></option>
                    <?php
                    $students = $this->db->query("
                        SELECT s.student_id, s.name, s.student_code, s.transport_id,
                               c.name as class_name, c.class_id
                        FROM student s
                        JOIN enroll e ON s.student_id = e.student_id
                        JOIN class c ON e.class_id = c.class_id
                        WHERE e.year = ? AND e.term = ? AND e.mute = 0
                        ORDER BY s.name
                    ", [get_settings('running_year'), get_settings('running_term')])->result_array();
                    foreach ($students as $student):
                    ?>
                        <option value="<?php echo $student['student_id']; ?>"
                                data-class="<?php echo $student['class_id']; ?>"
                                data-route="<?php echo $student['transport_id']; ?>">
                            <?php echo $student['student_code'] . ' - ' . $student['name'] . ' (' . $student['class_name'] . ')'; ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div id="collection_form" style="display:none;">
                <div class="sc-summary" aria-live="polite">
                    <div class="sc-stat"><span>Student</span><strong id="summary_student">—</strong></div>
                    <div class="sc-stat"><span>Prepaid balance</span><strong id="summary_balance">₵0.00</strong></div>
                    <div class="sc-stat"><span>Outstanding arrears</span><strong id="summary_arrears">₵0.00</strong></div>
                    <div class="sc-stat"><span>Net position</span><strong id="summary_net">₵0.00</strong></div>
                </div>

                <form id="feeCollectionForm" autocomplete="off">
                    <input type="hidden" name="student_id" id="form_student_id">
                    <input type="hidden" name="payment_type" value="mixed">
                    <input type="hidden" name="feeding_amount" id="feeding_amount_field" value="0">
                    <input type="hidden" name="breakfast_amount" id="breakfast_amount_field" value="0">
                    <input type="hidden" name="classes_amount" id="classes_amount_field" value="0">
                    <input type="hidden" name="water_amount" id="water_amount_field" value="0">
                    <input type="hidden" name="transport_amount" id="transport_amount_field" value="0">

                    <div class="sc-grid">
                        <div class="sc-col-4">
                            <div class="sc-card">
                                <div class="sc-card-title">Amount received</div>
                                <label class="sc-label" for="amount_received">Payment amount</label>
                                <div class="sc-amount-wrap">
                                    <span class="sc-currency">₵</span>
                                    <input class="sc-control sc-amount" type="number" min="0" step="0.01" inputmode="decimal" id="amount_received" name="amount_received" placeholder="0.00" required>
                                </div>
                                <div class="sc-help">Arrears are cleared first. Any remainder becomes prepaid balance across the future-fee buckets you select below.</div>

                                <div class="sc-card-title" style="margin-top:18px;">Future-fee buckets</div>
                                <div class="sc-advance-targets">
                                    <?php if ($feeding_enabled): ?><label class="sc-target"><input class="advance-target" type="checkbox" data-fee="feeding" checked> Feeding</label><?php endif; ?>
                                    <?php if ($classes_enabled): ?><label class="sc-target"><input class="advance-target" type="checkbox" data-fee="classes" checked> Classes</label><?php endif; ?>
                                    <?php if ($water_enabled): ?><label class="sc-target"><input class="advance-target" type="checkbox" data-fee="water" checked> Water</label><?php endif; ?>
                                    <?php if ($transport_enabled): ?><label class="sc-target" id="transport_target_wrap" style="display:none;"><input class="advance-target" type="checkbox" data-fee="transport"> Transport</label><?php endif; ?>
                                    <?php if ($breakfast_enabled): ?><label class="sc-target"><input class="advance-target" type="checkbox" data-fee="breakfast"> Breakfast</label><?php endif; ?>
                                </div>

                                <?php if ($transport_enabled): ?>
                                <div id="transport_options" style="display:none; margin-top:15px;">
                                    <label class="sc-label" for="transport_direction">Transport today</label>
                                    <select class="sc-control" id="transport_direction">
                                        <option value="none">Not using transport today</option>
                                        <option value="in">Morning only</option>
                                        <option value="out">Afternoon only</option>
                                        <option value="both">Both ways</option>
                                    </select>
                                    <div class="sc-help" id="route_description"></div>
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>

                        <div class="sc-col-8">
                            <div class="sc-card">
                                <div class="sc-card-title">Smart allocation preview</div>
                                <div class="sc-allocation" id="allocation_preview" data-smart-allocation="true" aria-live="polite">
                                    <div class="sc-allocation-head"><span>Fee</span><span>Arrears</span><span>Rate / weight</span><span>Allocate</span></div>
                                    <?php if ($feeding_enabled): ?><div class="sc-allocation-row" data-fee-row="feeding"><span class="sc-fee-name">Feeding</span><span class="sc-money" id="feeding_arrears">₵0.00</span><span class="sc-money" id="feeding_rate_display">₵0.00</span><span class="sc-money sc-allocated" id="feeding_allocated">₵0.00</span></div><?php endif; ?>
                                    <?php if ($classes_enabled): ?><div class="sc-allocation-row" data-fee-row="classes"><span class="sc-fee-name">Classes</span><span class="sc-money" id="classes_arrears">₵0.00</span><span class="sc-money" id="classes_rate_display">₵0.00</span><span class="sc-money sc-allocated" id="classes_allocated">₵0.00</span></div><?php endif; ?>
                                    <?php if ($water_enabled): ?><div class="sc-allocation-row" data-fee-row="water"><span class="sc-fee-name">Water</span><span class="sc-money" id="water_arrears">₵0.00</span><span class="sc-money" id="water_rate_display">₵0.00</span><span class="sc-money sc-allocated" id="water_allocated">₵0.00</span></div><?php endif; ?>
                                    <?php if ($transport_enabled): ?><div class="sc-allocation-row" data-fee-row="transport"><span class="sc-fee-name">Transport</span><span class="sc-money" id="transport_arrears">₵0.00</span><span class="sc-money" id="transport_rate_display">₵0.00</span><span class="sc-money sc-allocated" id="transport_allocated">₵0.00</span></div><?php endif; ?>
                                    <?php if ($breakfast_enabled): ?><div class="sc-allocation-row" data-fee-row="breakfast"><span class="sc-fee-name">Breakfast</span><span class="sc-money" id="breakfast_arrears">₵0.00</span><span class="sc-money" id="breakfast_rate_display">₵0.00</span><span class="sc-money sc-allocated" id="breakfast_allocated">₵0.00</span></div><?php endif; ?>
                                </div>
                                <div class="sc-total"><span>Total allocated</span><strong id="total_allocated">₵0.00</strong></div>
                                <div class="sc-notice" id="allocation_notice">The full amount could not be allocated. Select at least one future-fee bucket.</div>
                            </div>
                        </div>

                        <div class="sc-col-6">
                            <div class="sc-card">
                                <label class="sc-label" for="payment_method">Payment method</label>
                                <select class="sc-control" name="payment_method" id="payment_method" required>
                                    <option value="1"><?php echo get_phrase('cash'); ?></option>
                                    <option value="3"><?php echo get_phrase('mobile_money'); ?></option>
                                    <option value="2"><?php echo get_phrase('cheque'); ?></option>
                                    <option value="4"><?php echo get_phrase('bank_transfer'); ?></option>
                                </select>
                            </div>
                        </div>
                        <div class="sc-col-6">
                            <div class="sc-card">
                                <label class="sc-label" for="payment_notes">Notes (optional)</label>
                                <textarea class="sc-control" name="notes" id="payment_notes" rows="2" placeholder="Reference or short note"></textarea>
                            </div>
                        </div>
                    </div>

                    <div class="sc-actions">
                        <button type="button" class="sc-button sc-button-secondary" id="clear_payment">Clear</button>
                        <button type="submit" class="sc-button sc-button-primary" id="collect_payment" disabled><i class="fa fa-check-circle"></i> Collect payment</button>
                    </div>
                    <div class="sc-receipt" id="receipt_result" aria-live="polite"></div>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
var cashierWallet = {};
var cashierRates = {};
var routeFare = 0;
var activeRoute = false;
var feeAllocationPriority = ['feeding', 'classes', 'water', 'transport', 'breakfast'];
var enabledFees = {
    feeding: <?php echo $feeding_enabled ? 'true' : 'false'; ?>,
    breakfast: <?php echo $breakfast_enabled ? 'true' : 'false'; ?>,
    classes: <?php echo $classes_enabled ? 'true' : 'false'; ?>,
    water: <?php echo $water_enabled ? 'true' : 'false'; ?>,
    transport: <?php echo $transport_enabled ? 'true' : 'false'; ?>
};

function money(value) {
    var number = parseFloat(value || 0);
    if (!isFinite(number)) number = 0;
    return '₵' + number.toFixed(2);
}

function roundMoney(value) {
    return Math.round((parseFloat(value || 0) + Number.EPSILON) * 100) / 100;
}

function getFeeArrears(type) {
    return Math.max(0, parseFloat(cashierWallet[type + '_arrears'] || 0));
}

function getFeeWeight(type) {
    if (type === 'transport') {
        var direction = $('#transport_direction').val() || 'none';
        if (direction === 'both') return routeFare * 2;
        if (direction === 'in' || direction === 'out') return routeFare;
        return routeFare;
    }
    return Math.max(0, parseFloat(cashierRates[type + '_rate'] || 0));
}

function isAdvanceTarget(type) {
    if (!enabledFees[type]) return false;
    if (type === 'transport' && !activeRoute) return false;
    return $('.advance-target[data-fee="' + type + '"]').prop('checked') === true;
}

function setAllocation(type, amount) {
    amount = roundMoney(amount);
    $('#' + type + '_amount_field').val(amount.toFixed(2));
    $('#' + type + '_allocated').text(money(amount));
}

function renderWallet() {
    var totalBalance = 0;
    var totalArrears = 0;
    feeAllocationPriority.forEach(function(type) {
        if (!enabledFees[type]) return;
        var balance = Math.max(0, parseFloat(cashierWallet[type + '_balance'] || 0));
        var arrears = getFeeArrears(type);
        totalBalance += balance;
        totalArrears += arrears;
        $('#' + type + '_arrears').text(money(arrears));
        $('#' + type + '_rate_display').text(money(getFeeWeight(type)));
    });
    $('#summary_balance').text(money(totalBalance));
    $('#summary_arrears').text(money(totalArrears));
    $('#summary_net').text(money(totalBalance - totalArrears));
}

function allocateSmartPayment() {
    var received = Math.max(0, parseFloat($('#amount_received').val() || 0));
    var remaining = roundMoney(received);
    var allocations = { feeding: 0, breakfast: 0, classes: 0, water: 0, transport: 0 };

    // First pass: clear real arrears in a deterministic school-friendly order.
    feeAllocationPriority.forEach(function(type) {
        if (!enabledFees[type] || remaining <= 0) return;
        var due = getFeeArrears(type);
        if (due <= 0) return;
        var portion = Math.min(remaining, due);
        allocations[type] = roundMoney(allocations[type] + portion);
        remaining = roundMoney(remaining - portion);
    });

    // Second pass: distribute any remainder as prepaid balance across selected future-fee buckets.
    if (remaining > 0) {
        var targets = feeAllocationPriority.filter(function(type) { return isAdvanceTarget(type); });
        if (targets.length) {
            var weights = {};
            var totalWeight = 0;
            targets.forEach(function(type) {
                var weight = getFeeWeight(type);
                if (weight <= 0) weight = 1;
                weights[type] = weight;
                totalWeight += weight;
            });

            var advancePool = remaining;
            targets.forEach(function(type, index) {
                var portion;
                if (index === targets.length - 1) {
                    portion = remaining;
                } else {
                    portion = roundMoney(advancePool * (weights[type] / totalWeight));
                    portion = Math.min(portion, remaining);
                }
                allocations[type] = roundMoney(allocations[type] + portion);
                remaining = roundMoney(remaining - portion);
            });
        }
    }

    feeAllocationPriority.forEach(function(type) { setAllocation(type, allocations[type] || 0); });
    var allocated = roundMoney(received - remaining);
    $('#total_allocated').text(money(allocated));
    $('#allocation_notice').toggle(remaining > 0.009);
    $('#collect_payment').prop('disabled', received <= 0 || remaining > 0.009 || allocated <= 0);
}

function resetCashierPayment() {
    $('#amount_received').val('');
    $('#payment_notes').val('');
    $('#payment_method').val('1');
    $('#receipt_result').hide().empty();
    allocateSmartPayment();
}

function loadStudentContext(studentId, classId, routeId) {
    $('#collection_form').addClass('sc-loading');
    cashierWallet = {};
    cashierRates = {};
    routeFare = 0;
    activeRoute = !!routeId;

    var rateRequest = $.get('<?php echo site_url('admin/get_class_rates/'); ?>' + classId);
    var walletRequest = $.post('<?php echo site_url('cashier/get_student_wallet_details'); ?>', { student_id: studentId });
    var routeRequest = activeRoute
        ? $.get('<?php echo site_url('admin/get_route_info/'); ?>' + routeId)
        : $.Deferred().resolve({ status: 'none' }).promise();

    $.when(rateRequest, walletRequest, routeRequest).done(function(rateResponse, walletResponse, routeResponse) {
        var rawRates = rateResponse[0] !== undefined ? rateResponse[0] : rateResponse;
        var rawWallet = walletResponse[0] !== undefined ? walletResponse[0] : walletResponse;
        var rawRoute = routeResponse[0] !== undefined ? routeResponse[0] : routeResponse;
        cashierRates = typeof rawRates === 'string' ? JSON.parse(rawRates) : rawRates;
        var walletData = typeof rawWallet === 'string' ? JSON.parse(rawWallet) : rawWallet;
        var routeData = typeof rawRoute === 'string' ? JSON.parse(rawRoute) : rawRoute;

        if (!walletData || walletData.status !== 'success') {
            throw new Error('Unable to load wallet details');
        }
        cashierWallet = walletData.wallet || {};
        $('#summary_student').text(walletData.student && walletData.student.name ? walletData.student.name : $('#student_id option:selected').text());

        if (activeRoute && routeData && routeData.status === 'success') {
            routeFare = parseFloat(routeData.route.route_fare || 0);
            $('#route_description').text(routeData.route.route_name + ' · base fare ' + money(routeFare));
            $('#transport_options, #transport_target_wrap').show();
        } else {
            activeRoute = false;
            $('#transport_options, #transport_target_wrap').hide();
            $('.advance-target[data-fee="transport"]').prop('checked', false);
        }

        feeAllocationPriority.forEach(function(type) {
            $('#' + type + '_rate_display').text(money(getFeeWeight(type)));
        });
        renderWallet();
        resetCashierPayment();
        $('#collection_form').show().removeClass('sc-loading');
    }).fail(function() {
        $('#collection_form').removeClass('sc-loading').hide();
        showAjaxModal_alert('<?php echo get_phrase('an_error_occurred'); ?>', 'error');
    });
}

$('#student_id').on('change', function() {
    var studentId = $(this).val();
    if (!studentId) {
        $('#collection_form').hide();
        return;
    }
    var option = $(this).find(':selected');
    $('#form_student_id').val(studentId);
    loadStudentContext(studentId, option.data('class'), option.data('route'));
});

$('#amount_received').on('input', allocateSmartPayment);
$('.advance-target').on('change', allocateSmartPayment);
$('#transport_direction').on('change', function() {
    $('#transport_rate_display').text(money(getFeeWeight('transport')));
    allocateSmartPayment();
});
$('#clear_payment').on('click', resetCashierPayment);

$('#feeCollectionForm').on('submit', function(e) {
    e.preventDefault();
    allocateSmartPayment();

    var received = Math.max(0, parseFloat($('#amount_received').val() || 0));
    var allocated = 0;
    feeAllocationPriority.forEach(function(type) {
        allocated += parseFloat($('#' + type + '_amount_field').val() || 0);
    });
    allocated = roundMoney(allocated);

    if (received <= 0 || Math.abs(received - allocated) > 0.01) {
        showAjaxModal_alert('Please enter an amount that can be fully allocated.', 'error');
        return;
    }

    var $form = $(this);
    var $button = $('#collect_payment');
    $button.prop('disabled', true).text('Processing…');

    $.ajax({
        url: '<?php echo site_url('cashier/process_daily_fee_payment'); ?>',
        type: 'POST',
        data: $form.serialize(),
        dataType: 'json'
    }).done(function(response) {
        if (response.status === 'success') {
            var transactionCode = response.transaction_code || '';
            var receiptUrl = '<?php echo site_url('cashier/print_daily_fee_receipt/'); ?>' + encodeURIComponent(transactionCode);
            $('#receipt_result').html(
                '<strong>Payment recorded successfully.</strong> ' +
                '<a href="' + receiptUrl + '" target="_blank" rel="noopener">Print receipt</a>'
            ).show();
            showAjaxModal_alert(response.message || '<?php echo get_phrase('payment_processed_successfully'); ?>', 'success');
            $('#amount_received').val('');
            allocateSmartPayment();
            var studentId = $('#form_student_id').val();
            if (studentId) {
                $.post('<?php echo site_url('cashier/get_student_wallet_details'); ?>', { student_id: studentId }, function(data) {
                    var parsed = typeof data === 'string' ? JSON.parse(data) : data;
                    if (parsed && parsed.status === 'success') {
                        cashierWallet = parsed.wallet || {};
                        renderWallet();
                    }
                });
            }
        } else {
            showAjaxModal_alert(response.message || '<?php echo get_phrase('operation_failed'); ?>', 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('<?php echo get_phrase('an_error_occurred'); ?>', 'error');
    }).always(function() {
        $button.text('Collect payment');
        allocateSmartPayment();
    });
});

$(document).ready(function() {
    $('.select2').select2({ width: '100%' });
});
</script>
