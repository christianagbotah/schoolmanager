<?php 
    $currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
    $un_year = $running_year;
    $un_term = $running_term;
    $date_timestamp = strtotime(date('d-m-Y'));
    
    // Get fee mode
    $fee_mode_result = $this->db->get_where('settings', array('type' => 'fee_collection_mode'));
    $fee_mode = ($fee_mode_result->num_rows() > 0) ? $fee_mode_result->row()->description : 'integrated';
    
    // Check enabled modules
    $show_feeding = is_fee_module_enabled('feeding');
    $show_classes = is_fee_module_enabled('classes');
    $show_transport = is_fee_module_enabled('transport');
    $show_breakfast = is_fee_module_enabled('breakfast');
    $show_water = is_fee_module_enabled('water');
    $enabled_count = ($show_feeding ? 1 : 0) + ($show_classes ? 1 : 0) + ($show_transport ? 1 : 0) + ($show_breakfast ? 1 : 0) + ($show_water ? 1 : 0);
    
    if($enabled_count == 1) $col_class = 'col-md-12';
    elseif($enabled_count == 2) $col_class = 'col-md-6';
    elseif($enabled_count == 3) $col_class = 'col-md-4';
    elseif($enabled_count == 4) $col_class = 'col-md-6 col-lg-3';
    else $col_class = 'col-md-6 col-lg-4 col-xl-20';
    
    // Module configurations
    $modules = [
        'feeding' => ['icon' => 'utensils', 'color' => '#3b82f6', 'label' => 'Feeding Fee'],
        'classes' => ['icon' => 'chalkboard-teacher', 'color' => '#10b981', 'label' => 'Classes Fee'],
        'transport' => ['icon' => 'bus', 'color' => '#f59e0b', 'label' => 'Transport Fare'],
        'breakfast' => ['icon' => 'coffee', 'color' => '#ec4899', 'label' => 'Breakfast Fee'],
        'water' => ['icon' => 'tint', 'color' => '#06b6d4', 'label' => 'Water Fee']
    ];
?>

<style>
.fees-container {
    background: #f9fafb;
    min-height: 100vh;
    padding: 2rem 1rem;
}
.modern-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s;
}
.modern-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
    transform: translateY(-2px);
}
.header-card {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: white;
    text-align: center;
    padding: 2rem;
}
.stat-card {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    border-left: 4px solid;
    height: 100%;
}
.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px -6px rgba(0,0,0,0.15);
}
.stat-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    opacity: 0.9;
}
.stat-amount {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0.5rem 0;
    color: #1f2937;
}
.currency-symbol {
    font-size: 0.5em;
    opacity: 0.7;
    vertical-align: super;
    margin-right: 2px;
}
.stat-label {
    font-size: 1rem;
    font-weight: 600;
    color: #6b7280;
    margin-bottom: 0.5rem;
}
.stat-subtitle {
    font-size: 0.875rem;
    color: #9ca3af;
    margin-top: 0.5rem;
}
.section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.badge-mode {
    display: inline-block;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
    margin-left: 1rem;
}
.badge-separated {
    background: #059669;
    color: white;
}
.badge-integrated {
    background: #d97706;
    color: white;
}
.col-xl-20 {
    flex: 0 0 20%;
    max-width: 20%;
}
.d-flex {
    display: flex !important;
}
.align-items-center {
    align-items: center !important;
}
.gap-2 {
    gap: 0.5rem !important;
}
@media (max-width: 1199px) {
    .col-xl-20 {
        flex: 0 0 33.333333%;
        max-width: 33.333333%;
    }
}
@media (max-width: 768px) {
    .stat-amount { font-size: 1.25rem; }
    .stat-icon { font-size: 2rem; }
    .col-xl-20 {
        flex: 0 0 50%;
        max-width: 50%;
    }
    .d-flex.align-items-center {
        flex-direction: column;
        gap: 0.75rem !important;
    }
    .d-flex.align-items-center > * {
        width: 100%;
    }
}

/* Direct UI/UX refinement — Daily Fees Management */
.fees-container {
    padding: 24px 28px 40px !important;
    background: #f8fafc !important;
}
.fees-container > .container-fluid {
    max-width: 1600px;
    margin: 0 auto;
    padding: 0 !important;
}
.fees-container .modern-card {
    padding: 18px !important;
    margin-bottom: 16px !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
    transition: border-color .15s ease, box-shadow .15s ease !important;
}
.fees-container .modern-card:hover {
    transform: none !important;
    box-shadow: 0 4px 12px rgba(15,23,42,.06) !important;
}
.fees-container .header-card {
    padding: 20px 22px !important;
    text-align: left !important;
    background: #0f172a !important;
    border: 0 !important;
    border-radius: 14px !important;
}
.fees-container .header-card h1 {
    margin: 0 0 5px !important;
    color: #fff !important;
    font-size: 24px !important;
    line-height: 1.25;
    font-weight: 800 !important;
    letter-spacing: -.015em;
}
.fees-container .header-card p {
    margin: 0 !important;
    color: #cbd5e1 !important;
    font-size: 14px !important;
    line-height: 1.5;
    opacity: 1 !important;
}
.fees-container .badge-mode {
    margin: 12px 0 0 !important;
    padding: 5px 10px !important;
    border-radius: 999px !important;
    font-size: 12px !important;
    font-weight: 800 !important;
}
.fees-container .badge-integrated { background: #b45309 !important; }
.fees-container .badge-separated { background: #047857 !important; }

.fees-container .row.mb-4 {
    margin-left: -7px !important;
    margin-right: -7px !important;
    margin-bottom: 16px !important;
}
.fees-container .row.mb-4 > .col-lg-6 {
    padding-left: 7px !important;
    padding-right: 7px !important;
    margin-bottom: 0 !important;
}
.fees-container .row.mb-4 > .col-lg-6 > div {
    height: 100%;
    padding: 15px 16px !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px !important;
    background: #fff !important;
    color: #334155 !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.04) !important;
}
.fees-container .row.mb-4 > .col-lg-6 > div:hover {
    box-shadow: 0 3px 10px rgba(15,23,42,.06) !important;
    transform: none !important;
}
.fees-container .row.mb-4 h3 {
    margin: 0 0 10px !important;
    color: #0f172a !important;
    font-size: 15px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.fees-container .row.mb-4 .d-flex.align-items-center {
    gap: 9px !important;
}
.fees-container .row.mb-4 .d-flex.align-items-center > div:first-child {
    width: 40px;
    height: 40px;
    padding: 0 !important;
    border-radius: 9px !important;
    background: #eff6ff !important;
    color: #2563eb !important;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
}
.fees-container .row.mb-4 .d-flex.align-items-center > div:first-child i {
    font-size: 16px !important;
}
.fees-container .row.mb-4 .form-control {
    min-height: 44px !important;
    height: 44px !important;
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 8px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 14px !important;
    font-weight: 600 !important;
}
.fees-container .row.mb-4 .form-control:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
    outline: none;
}
.fees-container .row.mb-4 button[type="submit"] {
    min-height: 44px;
    padding: 9px 14px !important;
    border-radius: 8px !important;
    border: 1px solid #2563eb !important;
    background: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.fees-container .row.mb-4 button[type="submit"]:hover {
    background: #1d4ed8 !important;
    transform: none !important;
}

.fees-container .section-title {
    margin: 22px 0 12px !important;
    color: #0f172a !important;
    font-size: 18px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    gap: 8px !important;
}
.fees-container .section-title i {
    color: #64748b;
    font-size: 16px;
}
.fees-container #by_date > .section-title:first-child,
.fees-container #by_term > .section-title:first-child {
    margin-top: 4px !important;
}
.fees-container #by_date .row,
.fees-container #by_term .row {
    row-gap: 12px !important;
    margin-bottom: 8px !important;
}
.fees-container #by_date .row > [class*="col-"],
.fees-container #by_term .row > [class*="col-"] {
    margin-bottom: 0 !important;
}

.fees-container .stat-card {
    min-height: 150px;
    padding: 15px 14px !important;
    border: 1px solid #e2e8f0;
    border-left: 4px solid !important;
    border-radius: 12px !important;
    background: #fff !important;
    text-align: left !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.04) !important;
    transition: border-color .15s ease, box-shadow .15s ease !important;
}
.fees-container .stat-card:hover {
    transform: none !important;
    box-shadow: 0 4px 12px rgba(15,23,42,.06) !important;
}
.fees-container .stat-icon {
    margin: 0 0 9px !important;
    font-size: 20px !important;
    line-height: 1;
}
.fees-container .stat-label {
    margin: 0 0 6px !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 700 !important;
}
.fees-container .stat-amount {
    margin: 0 !important;
    color: #0f172a !important;
    font-size: 21px !important;
    line-height: 1.25;
    font-weight: 800 !important;
}
.fees-container .currency-symbol {
    margin-right: 3px;
    color: #64748b;
    font-size: .58em !important;
}
.fees-container .stat-subtitle {
    margin-top: 7px !important;
    color: #94a3b8 !important;
    font-size: 12.5px !important;
    line-height: 1.4;
}
.fees-container a.text-decoration-none {
    color: inherit !important;
    text-decoration: none !important;
}
.fees-container a.text-decoration-none:focus-visible .stat-card {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37,99,235,.18) !important;
}

@media (max-width: 991px) {
    .fees-container .row.mb-4 > .col-lg-6 + .col-lg-6 {
        margin-top: 12px !important;
    }
    .fees-container .col-xl-20 {
        flex: 0 0 50% !important;
        max-width: 50% !important;
    }
}
@media (max-width: 767px) {
    .fees-container { padding: 18px 14px 32px !important; }
    .fees-container .header-card { padding: 18px !important; }
    .fees-container .header-card h1 { font-size: 21px !important; }
    .fees-container .row.mb-4 .d-flex.align-items-center {
        align-items: stretch !important;
        flex-direction: column !important;
    }
    .fees-container .row.mb-4 .d-flex.align-items-center > div:first-child {
        display: none !important;
    }
    .fees-container .row.mb-4 button[type="submit"] {
        width: 100%;
    }
    .fees-container .col-xl-20,
    .fees-container #by_date .row > [class*="col-"],
    .fees-container #by_term .row > [class*="col-"] {
        flex: 0 0 50% !important;
        max-width: 50% !important;
    }
}
@media (max-width: 480px) {
    .fees-container { padding: 12px 10px 28px !important; }
    .fees-container .col-xl-20,
    .fees-container #by_date .row > [class*="col-"],
    .fees-container #by_term .row > [class*="col-"] {
        flex: 0 0 100% !important;
        max-width: 100% !important;
    }
    .fees-container .stat-card { min-height: 132px; }
}
</style>

<div class="fees-container">
    <div class="container-fluid">
        <!-- Header -->
        <div class="modern-card header-card">
            <h1 class="mb-2" style="font-size: 2rem; font-weight: 800;">
                <i class="fa fa-money-bill-wave"></i> Daily Fees Management
            </h1>
            <p style="font-size: 1.1rem; opacity: 0.9;">Comprehensive management of all daily fee collections</p>
            <span class="badge-mode <?php echo $fee_mode == 'separated' ? 'badge-separated' : 'badge-integrated'; ?>">
                <i class="fa fa-cog"></i> <?php echo ucfirst($fee_mode); ?> Mode
            </span>
        </div>

        <!-- Search Filters -->
        <div class="row mb-4">
            <div class="col-lg-6 mb-3">
                <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all" style="background: #2563eb; border-radius: 16px; color: white;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 700; color: white;">Search by Date</h3>
                    <?php echo form_open('', array('id' => 'by_date_form')); ?>
                    <div class="d-flex align-items-center gap-2">
                        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px;">
                            <i class="fa fa-calendar" style="font-size: 1.25rem;"></i>
                        </div>
                        <input type="text" name="date_sel" id="date_sel" class="form-control datepicker" value="<?php echo date('d-m-Y'); ?>" placeholder="Select date" style="flex: 1; border-radius: 10px; border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.95); font-weight: 500;">
                        <button type="submit" class="btn text-white" style="background: rgba(255,255,255,0.2); white-space: nowrap; border-radius: 10px; padding: 0.5rem 1.25rem; font-weight: 600; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fa fa-search"></i> Search
                        </button>
                    </div>
                    <?php echo form_close(); ?>
                </div>
            </div>

            <div class="col-lg-6 mb-3">
                <div class="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all" style="background: #2563eb; border-radius: 16px; color: white;">
                    <h3 style="margin: 0 0 1rem 0; font-size: 1.125rem; font-weight: 700; color: white;">Search by Term/Year</h3>
                    <?php echo form_open('', array('id' => 'byterm_form')); ?>
                    <div class="d-flex align-items-center gap-2">
                        <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 10px;">
                            <i class="fa fa-graduation-cap" style="font-size: 1.25rem;"></i>
                        </div>
                        <select name="term" id="term" class="form-control" style="border-radius: 10px; border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.95); font-weight: 500;">
                            <option value="">Select Term</option>
                            <?php for($i = 1; $i <= 3; $i++): ?>
                                <option value="<?php echo $i; ?>" <?php if($un_term == $i) echo 'selected'; ?>>Term <?php echo $i; ?></option>
                            <?php endfor; ?>
                        </select>
                        <select name="year" id="year" class="form-control" style="border-radius: 10px; border: 2px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.95); font-weight: 500;">
                            <option value="">Select Year</option>
                            <?php echo populate_academic_year(); ?>
                        </select>
                        <button type="submit" class="btn text-white" style="background: rgba(255,255,255,0.2); white-space: nowrap; border-radius: 10px; padding: 0.5rem 1.25rem; font-weight: 600; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
                            <i class="fa fa-search"></i> Search
                        </button>
                    </div>
                    <?php echo form_close(); ?>
                </div>
            </div>
        </div>

        <!-- By Date Stats -->
        <div id="by_date">
            <div class="section-title">
                <i class="fa fa-chart-line"></i> Fees Collected (By Date)
            </div>
            <div class="row" style="row-gap: 1.5rem; margin-bottom: 2rem;">
                <?php foreach($modules as $key => $module): ?>
                    <?php if(${'show_' . $key}): ?>
                    <div class="<?php echo $col_class; ?> mb-4">
                        <a href="javascript:;" onclick="show_payments_modal('<?php echo $key; ?>')" class="text-decoration-none">
                            <div class="stat-card" style="border-color: <?php echo $module['color']; ?>;">
                                <div class="stat-icon" style="color: <?php echo $module['color']; ?>;"><i class="fa fa-<?php echo $module['icon']; ?>"></i></div>
                                <div class="stat-label"><?php echo $module['label']; ?> Collected</div>
                                <div class="stat-amount" id="<?php echo $key; ?>_fee_tile"><sup class="currency-symbol"><?php echo $currency; ?></sup>0.00</div>
                                <div class="stat-subtitle" id="<?php echo $key[0]; ?>date">Select date to view</div>
                            </div>
                        </a>
                    </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>

            <div class="section-title" style="margin-top: 2rem;">
                <i class="fa fa-exclamation-triangle"></i> Outstanding Fees
            </div>
            <div class="row" style="row-gap: 1.5rem; margin-bottom: 2rem;">
                <?php foreach($modules as $key => $module): ?>
                    <?php if(${'show_' . $key}): ?>
                    <div class="<?php echo $col_class; ?> mb-4">
                        <a href="javascript:;" onclick="show_outstanding_modal('<?php echo $key; ?>')" class="text-decoration-none">
                            <div class="stat-card" style="border-color: #ef4444;">
                                <div class="stat-icon" style="color: #ef4444;"><i class="fa fa-exclamation-circle"></i></div>
                                <div class="stat-label"><?php echo $module['label']; ?> Outstanding</div>
                                <div class="stat-amount" id="<?php echo $key; ?>_fee_tile_owe"><sup class="currency-symbol"><?php echo $currency; ?></sup>0.00</div>
                                <div class="stat-subtitle" id="<?php echo $key[0]; ?>date_owe">Click to view debtors</div>
                            </div>
                        </a>
                    </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>

            <div class="section-title" style="margin-top: 2rem;">
                <i class="fa fa-hand-holding-usd"></i> Advance Payments (Payables)
            </div>
            <div class="row" style="row-gap: 1.5rem; margin-bottom: 2rem;">
                <?php foreach($modules as $key => $module): ?>
                    <?php if(${'show_' . $key}): ?>
                    <div class="<?php echo $col_class; ?> mb-4">
                        <a href="javascript:;" onclick="show_payables_modal('<?php echo $key; ?>')" class="text-decoration-none">
                            <div class="stat-card" style="border-color: #06b6d4;">
                                <div class="stat-icon" style="color: #06b6d4;"><i class="fa fa-coins"></i></div>
                                <div class="stat-label"><?php echo $module['label']; ?> Payables</div>
                                <div class="stat-amount" id="<?php echo $key; ?>_fee_tile_payable"><sup class="currency-symbol"><?php echo $currency; ?></sup>0.00</div>
                                <div class="stat-subtitle" id="<?php echo $key[0]; ?>date_payable">Students paid in advance</div>
                            </div>
                        </a>
                    </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>

        <!-- By Term Stats -->
        <div id="by_term" style="display: none;">
            <div class="section-title">
                <i class="fa fa-chart-bar"></i> Fees Collected (By Term)
            </div>
            <div class="row" style="row-gap: 1.5rem; margin-bottom: 2rem;">
                <?php foreach($modules as $key => $module): ?>
                    <?php if(${'show_' . $key}): ?>
                    <div class="<?php echo $col_class; ?> mb-4">
                        <a href="javascript:;" onclick="show_payments_modal_term('<?php echo $key; ?>')" class="text-decoration-none">
                            <div class="stat-card" style="border-color: <?php echo $module['color']; ?>;">
                                <div class="stat-icon" style="color: <?php echo $module['color']; ?>;"><i class="fa fa-<?php echo $module['icon']; ?>"></i></div>
                                <div class="stat-label"><?php echo $module['label']; ?> Collected</div>
                                <div class="stat-amount" id="<?php echo $key; ?>_fee_tile_term"><sup class="currency-symbol"><?php echo $currency; ?></sup>0.00</div>
                                <div class="stat-subtitle" id="<?php echo $key[0]; ?>date2">Select term to view</div>
                            </div>
                        </a>
                    </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>

            <div class="section-title" style="margin-top: 2rem;">
                <i class="fa fa-exclamation-triangle"></i> Outstanding Fees
            </div>
            <div class="row" style="row-gap: 1.5rem; margin-bottom: 2rem;">
                <?php foreach($modules as $key => $module): ?>
                    <?php if(${'show_' . $key}): ?>
                    <div class="<?php echo $col_class; ?> mb-4">
                        <a href="javascript:;" onclick="show_outstanding_modal_term('<?php echo $key; ?>')" class="text-decoration-none">
                            <div class="stat-card" style="border-color: #ef4444;">
                                <div class="stat-icon" style="color: #ef4444;"><i class="fa fa-exclamation-circle"></i></div>
                                <div class="stat-label"><?php echo $module['label']; ?> Outstanding</div>
                                <div class="stat-amount" id="<?php echo $key; ?>_fee_tile_owe_term"><sup class="currency-symbol"><?php echo $currency; ?></sup>0.00</div>
                                <div class="stat-subtitle" id="<?php echo $key[0]; ?>date_owe2">Click to view debtors</div>
                            </div>
                        </a>
                    </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>

            <div class="section-title" style="margin-top: 2rem;">
                <i class="fa fa-hand-holding-usd"></i> Advance Payments (Payables)
            </div>
            <div class="row" style="row-gap: 1.5rem; margin-bottom: 2rem;">
                <?php foreach($modules as $key => $module): ?>
                    <?php if(${'show_' . $key}): ?>
                    <div class="<?php echo $col_class; ?> mb-4">
                        <a href="javascript:;" onclick="show_payables_modal_term('<?php echo $key; ?>')" class="text-decoration-none">
                            <div class="stat-card" style="border-color: #06b6d4;">
                                <div class="stat-icon" style="color: #06b6d4;"><i class="fa fa-coins"></i></div>
                                <div class="stat-label"><?php echo $module['label']; ?> Payables</div>
                                <div class="stat-amount" id="<?php echo $key; ?>_fee_tile_payable_term"><sup class="currency-symbol"><?php echo $currency; ?></sup>0.00</div>
                                <div class="stat-subtitle" id="<?php echo $key[0]; ?>date_payable2">Students paid in advance</div>
                            </div>
                        </a>
                    </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>

<script>
$(function() {
    $('.datepicker').datepicker({
        format: 'dd-mm-yyyy',
        autoclose: true,
        todayHighlight: true
    });
    
    get_fct_by_date();
});

$('#by_date_form').submit(function(e) {
    e.preventDefault();
    get_fct_by_date();
    $('#by_date').show();
    $('#by_term').hide();
});

$('#byterm_form').submit(function(e) {
    e.preventDefault();
    
    let year = $('#year').val();
    let term = $('#term').val();
    
    if(!year || !term) {
        showAjaxModal_alert('Please select both year and term', 'error');
        return;
    }
    
    get_fct_by_term();
    $('#by_term').show();
    $('#by_date').hide();
});

function get_fct_by_date() {
    let date = $('#date_sel').val();
    $.ajax({
        url: '<?php echo site_url('admin/get_fct_bydate/search/'); ?>' + date,
        type: 'POST',
        dataType: 'json',
        success: function(r) {
            // Update all module tiles with smaller currency symbols
            $('#feeding_fee_tile').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_feeding_paid || '0.00'));
            $('#classes_fee_tile').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_classes_paid || '0.00'));
            $('#transport_fee_tile').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_fare_paid || '0.00'));
            $('#breakfast_fee_tile').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_breakfast_paid || '0.00'));
            $('#water_fee_tile').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_water_paid || '0.00'));
            $('#fdate, #cdate, #tdate, #bdate, #wdate').text(r[0].date_chosen);
            
            $('#feeding_fee_tile_owe').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_feeding_owe || '0.00'));
            $('#classes_fee_tile_owe').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_classes_owe || '0.00'));
            $('#transport_fee_tile_owe').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_fare_owe || '0.00'));
            $('#breakfast_fee_tile_owe').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_breakfast_owe || '0.00'));
            $('#water_fee_tile_owe').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_water_owe || '0.00'));
            $('#fdate_owe, #cdate_owe, #tdate_owe, #bdate_owe, #wdate_owe').text(r[0].date_chosen);
            
            $('#feeding_fee_tile_payable').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_feeding_payable || '0.00'));
            $('#classes_fee_tile_payable').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_classes_payable || '0.00'));
            $('#transport_fee_tile_payable').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_transport_payable || '0.00'));
            $('#breakfast_fee_tile_payable').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_breakfast_payable || '0.00'));
            $('#water_fee_tile_payable').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_water_payable || '0.00'));
            $('#fdate_payable, #cdate_payable, #tdate_payable, #bdate_payable, #wdate_payable').text(r[0].date_chosen);
        }
    });
}

function get_fct_by_term() {
    let year = $('#year').val();
    let term = $('#term').val();
    
    $.ajax({
        url: '<?php echo site_url('admin/get_fct_byterm/search/'); ?>' + year + '/' + term,
        type: 'POST',
        dataType: 'json',
        success: function(r) {
            if(r && r[0]) {
                $('#feeding_fee_tile_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_feeding_paid || '0.00'));
                $('#classes_fee_tile_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_classes_paid || '0.00'));
                $('#transport_fee_tile_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_fare_paid || '0.00'));
                $('#breakfast_fee_tile_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_breakfast_paid || '0.00'));
                $('#water_fee_tile_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_water_paid || '0.00'));
                $('#fdate2, #cdate2, #tdate2, #bdate2, #wdate2').text(r[0].duration_chosen || 'No data');
                
                $('#feeding_fee_tile_owe_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_feeding_owe || '0.00'));
                $('#classes_fee_tile_owe_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_classes_owe || '0.00'));
                $('#transport_fee_tile_owe_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_fare_owe || '0.00'));
                $('#breakfast_fee_tile_owe_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_breakfast_owe || '0.00'));
                $('#water_fee_tile_owe_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_water_owe || '0.00'));
                $('#fdate_owe2, #cdate_owe2, #tdate_owe2, #bdate_owe2, #wdate_owe2').text(r[0].duration_chosen || 'No data');
                
                $('#feeding_fee_tile_payable_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_feeding_payable || '0.00'));
                $('#classes_fee_tile_payable_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_classes_payable || '0.00'));
                $('#transport_fee_tile_payable_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_transport_payable || '0.00'));
                $('#breakfast_fee_tile_payable_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_breakfast_payable || '0.00'));
                $('#water_fee_tile_payable_term').html('<sup class="currency-symbol"><?php echo $currency; ?></sup>' + (r[0].total_water_payable || '0.00'));
                $('#fdate_payable2, #cdate_payable2, #tdate_payable2, #bdate_payable2, #wdate_payable2').text(r[0].duration_chosen || 'No data');
            }
        }
    });
}

let current_date = '';

function show_payables_modal(fee_type) {
    let date = $('#date_sel').val();
    current_date = date;
    $.ajax({
        url: '<?php echo site_url('modal/popup/payables_details/'); ?>' + fee_type + '/' + date,
        success: function(response) {
            $('#modal_ajax .modal-dialog').css('max-width', '90%');
            $('#modal_ajax').modal('show', {backdrop: 'static'});
            $('#modal_ajax .modal-body').html(response);
        }
    });
}

function show_outstanding_modal(fee_type) {
    let date = $('#date_sel').val();
    current_date = date;
    $.ajax({
        url: '<?php echo site_url('modal/popup/outstanding_details/'); ?>' + fee_type + '/' + date,
        success: function(response) {
            $('#modal_ajax .modal-dialog').css('max-width', '90%');
            $('#modal_ajax').modal('show', {backdrop: 'static'});
            $('#modal_ajax .modal-body').html(response);
        }
    });
}

function show_payments_modal(fee_type) {
    let date = $('#date_sel').val();
    current_date = date;
    $.ajax({
        url: '<?php echo site_url('modal/popup/payments_details/'); ?>' + fee_type + '/' + date,
        success: function(response) {
            $('#modal_ajax .modal-dialog').css('max-width', '90%');
            $('#modal_ajax').modal('show', {backdrop: 'static'});
            $('#modal_ajax .modal-body').html(response);
        }
    });
}

function show_payments_modal_term(fee_type) {
    let year = $('#year').val();
    let term = $('#term').val();
    
    if(!year || !term) {
        showAjaxModal_alert('Please search by term first', 'error');
        return;
    }
    
    $.ajax({
        url: '<?php echo site_url('modal/popup/payments_details_term/'); ?>' + fee_type + '/' + year + '/' + term,
        success: function(response) {
            $('#modal_ajax .modal-dialog').css('max-width', '90%');
            $('#modal_ajax').modal('show', {backdrop: 'static'});
            $('#modal_ajax .modal-body').html(response);
        }
    });
}

function show_outstanding_modal_term(fee_type) {
    let year = $('#year').val();
    let term = $('#term').val();
    
    if(!year || !term) {
        showAjaxModal_alert('Please search by term first', 'error');
        return;
    }
    
    $.ajax({
        url: '<?php echo site_url('modal/popup/outstanding_details_term/'); ?>' + fee_type + '/' + year + '/' + term,
        success: function(response) {
            $('#modal_ajax .modal-dialog').css('max-width', '90%');
            $('#modal_ajax').modal('show', {backdrop: 'static'});
            $('#modal_ajax .modal-body').html(response);
        }
    });
}

function show_payables_modal_term(fee_type) {
    let year = $('#year').val();
    let term = $('#term').val();
    
    if(!year || !term) {
        showAjaxModal_alert('Please search by term first', 'error');
        return;
    }
    
    $.ajax({
        url: '<?php echo site_url('modal/popup/payables_details_term/'); ?>' + fee_type + '/' + year + '/' + term,
        success: function(response) {
            $('#modal_ajax .modal-dialog').css('max-width', '90%');
            $('#modal_ajax').modal('show', {backdrop: 'static'});
            $('#modal_ajax .modal-body').html(response);
        }
    });
}
</script>
