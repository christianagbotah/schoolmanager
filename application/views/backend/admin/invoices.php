<?php
$currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
$fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);

$user_id = $this->session->userdata('login_user_id');
$admin_level = $this->db->get_where('admin', array('admin_id' => $user_id))->row()->level;

//check if this is coming from a submitted payment page (take payment)
if (isset($_GET['id'])) {
    $imported_id = $_GET['id'];
}

$un_year = $running_year;
$forYear = 'yes';

if ($search == 'search') {

    $year;
    $term;
    //$sem;

    $un_year = $year;
    $un_term = $term;
    //$un_sem  = $sem;

    $date_timestamp = $date;
    $feeding_timestamp = $date;
    $transport_timestamp = $date;

} else {

    $un_year = $running_year;
    $un_term = $running_term;
    //$un_sem = $running_sem;

    $date_timestamp = strtotime(date('d-m-Y'));

}

$date_timestamp = date('l M d, Y', $date_timestamp);

?>

<style>
/* ---- Invoice Management — SchoolManager family design-language alignment (presentation only) ----
   Contract: class names, ids, DOM structure, PHP, JS untouched. This block restyles the
   page-local component classes (.modern-card, .search-card, .stats-card, .form-input-modern,
   .btn-modern, .tab-btn, ...) to the family tokens (flat cards, ink hero bands, blue accent,
   10-16px radii, 42-48px controls, focus rings, 360px support). */

.invoices-container {
    background: transparent;
    padding: 0 0 .25rem;
}

/* Family card */
.modern-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: box-shadow .2s ease, border-color .2s ease;
}

.modern-card:hover {
    box-shadow: 0 4px 12px rgba(16, 24, 40, 0.08);
    border-color: #d5dbe7;
}

/* Table holder specific styling - reduced padding for better table display */
#table_holder.modern-card {
    padding: 1rem;
    overflow-x: auto;
}

/* Ensure tables display properly */
#table_holder table {
    width: 100%;
    min-width: 100%;
    table-layout: auto;
}

#table_holder .dataTables_wrapper {
    overflow-x: auto;
}

#table_holder .dataTables_scrollBody {
    overflow-x: auto !important;
}

/* Family ink hero card - search band */
.search-card {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: #ffffff;
    border: 1px solid #0f172a;
    border-radius: 16px;
}

.search-card .form-input-modern {
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    color: #111827;
    font-size: .95rem;
    font-weight: 500;
}

.search-card .form-input-modern::placeholder {
    color: #9ca3af;
}

.search-card .form-input-modern:focus {
    background: #ffffff;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
    color: #111827;
}

.search-card select.form-input-modern {
    background: #ffffff;
    color: #111827;
}

.search-card select.form-input-modern option {
    background: #ffffff;
    color: #111827;
    padding: 6px 10px;
    font-size: .9rem;
    font-weight: 500;
}

.search-card label {
    color: #ffffff;
    font-size: .8rem;
    font-weight: 600;
}

/* KPI statistics cards - family ink with accent edge (yellow "No Data" state stays legible) */
.stats-card {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    color: #ffffff;
    text-align: center;
    cursor: pointer;
    transition: box-shadow .2s ease, border-color .2s ease;
    position: relative;
    overflow: hidden;
    border: 1px solid #0f172a;
}

.stats-card:hover {
    box-shadow: 0 8px 20px rgba(15, 23, 42, 0.25);
}

.stats-card.blue {
    border-top: 3px solid #3b82f6;
}

.stats-card.green {
    border-top: 3px solid #10b981;
}

.stats-icon {
    font-size: 2rem;
    margin-bottom: .75rem;
    opacity: .85;
}

.stats-amount {
    font-size: 1.9rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: .25rem 0;
}

.stats-label {
    font-size: .9rem;
    font-weight: 600;
    opacity: .85;
    margin-bottom: .5rem;
}

.stats-subtitle {
    font-size: .85rem;
    opacity: .75;
    margin-top: .5rem;
}

/* Family inputs */
.form-input-modern {
    padding: .7rem 1rem;
    border: 1.5px solid #e5e7eb;
    border-radius: 10px;
    font-size: .95rem;
    font-weight: 500;
    transition: border-color .15s ease, box-shadow .15s ease;
    background: #ffffff;
    color: #111827;
    width: 100%;
}

.form-input-modern:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.form-input-modern::placeholder {
    color: #9ca3af;
    font-weight: 400;
}

/* keep the calendar icon clear of input text */
.form-input-modern.ps-10 {
    padding-left: 2.5rem;
}

/* Family flat buttons */
.btn-modern {
    padding: .7rem 1.25rem;
    border-radius: 10px;
    font-weight: 600;
    font-size: .95rem;
    transition: background-color .2s ease, box-shadow .2s ease, border-color .2s ease;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: .5rem;
    text-decoration: none;
    min-height: 2.75rem;
}

.btn-modern:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
}

.btn-modern-primary {
    background: #2563eb;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.35);
}

.btn-modern-primary:hover {
    background: #1d4ed8;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}

.btn-modern-success {
    background: #059669;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(5, 150, 105, 0.3);
}

.btn-modern-success:hover {
    background: #047857;
    box-shadow: 0 4px 10px rgba(5, 150, 105, 0.3);
}

.btn-modern-danger {
    background: #dc2626;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(220, 38, 38, 0.3);
}

.btn-modern-danger:hover {
    background: #b91c1c;
    box-shadow: 0 4px 10px rgba(220, 38, 38, 0.3);
}

.btn-modern-info {
    background: #0284c7;
    color: #ffffff;
    box-shadow: 0 1px 2px rgba(2, 132, 199, 0.3);
}

.btn-modern-info:hover {
    background: #0369a1;
    box-shadow: 0 4px 10px rgba(2, 132, 199, 0.3);
}

.btn-modern:active {
    box-shadow: none;
}

.btn-modern:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

/* Filter panel (kept for compatibility) */
.filter-section {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 1.5rem;
    margin: 1.5rem 0;
}

/* Family ink hero card - class selection band */
.class-selection-card {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: #ffffff;
    border: 1px solid #0f172a;
    border-radius: 16px;
    padding: 1.75rem;
    text-align: center;
    margin: 0 0 1.5rem;
}

.class-selection-card .form-input-modern {
    background: rgba(255, 255, 255, 0.08);
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    color: #ffffff;
    font-size: 1rem;
    padding: .8rem 1rem;
}

.class-selection-card .form-input-modern::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.class-selection-card .form-input-modern:focus {
    background: rgba(255, 255, 255, 0.14);
    border-color: rgba(255, 255, 255, 0.55);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
}

/* Loading */
.loading-spinner {
    display: inline-block;
    width: 1.75rem;
    height: 1.75rem;
    border: 3px solid rgba(148, 163, 184, 0.35);
    border-radius: 50%;
    border-top-color: #2563eb;
    animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 768px) {
    .modern-card {
        padding: 1rem;
        margin-bottom: 1rem;
    }

    #table_holder.modern-card {
        padding: 0.5rem;
    }

    .stats-amount {
        font-size: 1.5rem;
    }

    .stats-icon {
        font-size: 1.75rem;
    }

    .btn-modern {
        padding: .65rem 1rem;
        font-size: .9rem;
    }

    .form-input-modern {
        padding: .65rem .85rem;
        font-size: .9rem;
    }

    #receipts-tab .row.mb-4 > div {
        margin-bottom: .75rem;
    }

    .tab-btn {
        font-size: .95rem;
        padding: 0.6rem 0.9rem;
    }

    .tab-navigation {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
}

@media (max-width: 640px) {
    .modern-card {
        padding: 0.85rem;
        border-radius: 12px;
    }

    .stats-card {
        margin-bottom: 1rem;
    }

    .stats-card .flex {
        flex-direction: column;
        gap: .75rem;
    }

    .filter-section {
        padding: 1rem;
    }

    .class-selection-card {
        padding: 1rem;
    }

    h1.display-4 {
        font-size: 1.5rem;
    }

    h2.text-3xl {
        font-size: 1.15rem;
    }

    .btn-modern {
        width: 100%;
    }

    .tab-btn {
        font-size: .9rem;
        padding: 0.5rem 0.75rem;
    }
}

@media (max-width: 400px) {
    .modern-card {
        padding: 0.65rem;
    }

    .stats-amount {
        font-size: 1.25rem;
    }

    .stats-icon {
        font-size: 1.5rem;
    }

    .tab-navigation {
        gap: 0;
    }

    .tab-btn {
        padding: 0.5rem 0.6rem;
        font-size: .85rem;
    }

    h3.text-2xl {
        font-size: 1.05rem;
    }
}

/* Custom selection styles */
::selection {
    background: rgba(59, 130, 246, 0.2);
    color: #1e40af;
}

/* DataTables - family treatment */
.dataTables_wrapper {
    background: transparent;
    padding: 0;
}

.dataTables_wrapper .dataTables_length,
.dataTables_wrapper .dataTables_filter,
.dataTables_wrapper .dataTables_info,
.dataTables_wrapper .dataTables_paginate {
    margin: .75rem 0;
}

.dataTables_wrapper .dataTables_paginate .paginate_button {
    padding: 0.375rem 0.75rem;
    margin: 0 0.125rem;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
    background: #ffffff;
    color: #374151;
    transition: all 0.15s ease;
}

.dataTables_wrapper .dataTables_paginate .paginate_button:hover {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
}

.dataTables_wrapper .dataTables_paginate .paginate_button.current {
    background: #2563eb;
    color: #ffffff;
    border-color: #2563eb;
}

/* Smooth scrolling enhancement */
html {
    scroll-behavior: smooth;
}

#table_holder {
    transition: box-shadow .2s ease;
}

/* Tab Navigation - family segmented tabs */
.tab-navigation {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #e5e7eb;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.tab-btn {
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #6b7280;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    margin-bottom: -2px;
    transition: color .15s ease, border-color .15s ease, background-color .15s ease;
}

.tab-btn:hover {
    color: #2563eb;
    background: rgba(59, 130, 246, 0.06);
}

.tab-btn.active {
    color: #111827;
    border-bottom-color: #2563eb;
}

.tab-btn:focus-visible {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
    border-radius: 8px 8px 0 0;
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

/* Fix select2 height to match input fields */
#receipts-tab .select2-container .select2-selection--single {

    padding: 0.6rem 1rem !important;
}

#receipts-tab .select2-container--default .select2-selection--single .select2-selection__rendered {
    line-height: 2.6rem !important;
}


#receipts-tab .select2 a {
    margin-top: -11px !important;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    html {
        scroll-behavior: auto;
    }

    .modern-card,
    .btn-modern,
    .tab-btn,
    .form-input-modern,
    .stats-card,
    .dataTables_wrapper .dataTables_paginate .paginate_button {
        transition: none;
    }
}
</style>


<div class="invoices-container">
    <div class="container-fluid">
        <!-- Page Header -->
        <div class="row mb-4">
            <div class="col-12">
                <div class="modern-card text-center">
                    <h1 class="display-4 font-bold text-gray-900 mb-3">
                        <i class="fa-solid fa-receipt text-blue-600 mr-3"></i>
                        Invoice Management
                    </h1>
                    <p class="text-lg text-gray-600">Search and manage student invoices with advanced filtering options</p>
                    </div>
                </div>
            </div>

        <!-- Search Cards Row -->
        <div class="row">
            <!-- Date Search Card -->
            <div class="col-lg-6 col-md-12 mb-4">
                <div class="modern-card search-card">
                    <div class="text-center mb-4">
                        <i class="fa-solid fa-calendar-days stats-icon"></i>
                        <h3 class="text-2xl font-bold mb-2">Search by Date</h3>
                        <p class="opacity-90">Filter invoices by specific date</p>
        </div>

                    <?php echo form_open(site_url('admin/get_receipts_bydate/search'), array('class' => 'form-horizontal', 'id' => 'receipt_bydate_form')); ?>
                    <div class="space-y-4">
                        <div>
                            <label for="date_sel" class="block text-sm font-semibold mb-2">Select Date</label>
                        </div>
                        
                        <div class="flex gap-3 items-end">
                            <div class="flex-1">
                                <div class="relative">
                                    <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                        <i class="fa-solid fa-calendar text-white opacity-70"></i>
                                    </div>
                                    <input id="date_sel" data-format="dd-mm-yyyy" value="<?php echo date('d-m-Y', strtotime($date_timestamp)); ?>" 
                                           placeholder="Select date" name="date_sel" type="text" 
                                           class="form-input-modern ps-10 datepicker" placeholder="Select date">
                                </div>
                            </div>
                            
                            <div class="flex-shrink-0">
                                <button type="submit" class="btn-modern btn-modern-primary">
                                    <i class="fa-solid fa-search"></i>
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                    <?php echo form_close(); ?>
                </div>
            </div>

            <!-- Term/Year Search Card -->
            <div class="col-lg-6 col-md-12 mb-4">
                <div class="modern-card search-card">
                    <div class="text-center mb-4">
                        <i class="fa-solid fa-graduation-cap stats-icon"></i>
                        <h3 class="text-2xl font-bold mb-2">Search by Term/Year</h3>
                        <p class="opacity-90">Filter invoices by academic term and year</p>
                    </div>
                    
                    <?php echo form_open(site_url('admin/get_receipts_byterm/search'), array('class' => 'form-horizontal', 'id' => 'receipts_byterm_form')); ?>
                    <div class="space-y-4">
                        <div class="flex gap-3 items-end">
                            <div class="flex-1">
                                <label for="term" class="block text-sm font-semibold mb-2">Term</label>
                                <select id="term" name="term" class="form-input-modern">
                                    <option value="" disabled="true"><?php echo get_phrase('term'); ?></option>
                                    <option value="0">All</option>
                                    <?php for ($i = 1; $i <= 3; $i++): ?>
                                        <option value="<?php echo $i; ?>" <?php if ($un_term == $i) echo 'selected'; ?>>
                                            <?php echo $i; ?>
                                        </option>
                                    <?php endfor; ?>
                                </select>
                            </div>
                            
                            <div class="flex-1">
                                <label for="year" class="block text-sm font-semibold mb-2">Year</label>
                                <select id="year" name="year" class="form-input-modern">
                                    <option value="" disabled="true"><?php echo get_phrase('year'); ?></option>
                                    <option value="0">All</option>
                                    <?php echo populate_academic_year($forYear, $un_year); ?>
                                </select>
                            </div>
                            
                            <div class="flex-shrink-0">
                                <label class="block text-sm font-semibold mb-2">&nbsp;</label>
                                <button type="submit" class="btn-modern btn-modern-primary">
                                    <i class="fa-solid fa-search"></i>
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                    <?php echo form_close(); ?>
                </div>
            </div>
        </div>

        <!-- Statistics Cards Row -->
            <div class="row">
            <!-- Date Statistics Card -->
            <div class="col-lg-6 col-md-12 mb-4">
                <a href="javascript:;" onclick="receipt_issued_bydate_modal()" id="date_rec_link" class="text-decoration-none">
                    <div class="modern-card stats-card blue">
                        <div class="stats-icon">
                            <i class="fa-solid fa-dollar-sign"></i>
                        </div>
                        <div class="stats-amount" id="date_rec">0</div>
                        <div class="stats-label">Total Amount</div>
                        <div class="flex justify-between items-center mt-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold" id="date_rec_qty">0</div>
                                <div class="text-sm opacity-80">Quantity</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-semibold"><?php echo get_phrase('total_receipts_for_issued_invoices'); ?></div>
                                <div class="text-sm opacity-80" id="date_rec_date">Select a date</div>
                            </div>
                        </div>
                    </div>
                </a>
                    </div>

            <!-- Term Statistics Card -->
            <div class="col-lg-6 col-md-12 mb-4">
                <a href="javascript:;" onclick="receipt_issued_byterm_modal()" id="term_rec_link" class="text-decoration-none">
                    <div class="modern-card stats-card green">
                        <div class="stats-icon">
                            <i class="fa-solid fa-chart-line"></i>
                        </div>
                        <div class="stats-amount" id="term_rec">0</div>
                        <div class="stats-label">Total Amount</div>
                        <div class="flex justify-between items-center mt-4">
                            <div class="text-center">
                                <div class="text-2xl font-bold" id="term_rec_qty">0</div>
                                <div class="text-sm opacity-80">Quantity</div>
                            </div>
                            <div class="text-right">
                                <div class="text-lg font-semibold"><?php echo get_phrase('total_receipts_for_issued_invoices'); ?></div>
                                <div class="text-sm opacity-80" id="term_rec_date">Select term/year</div>
                            </div>
                </div>
            </div>
            </a>
        </div>
    </div>
    </div>
</div>



    <!-- Tab Navigation -->
    <div class="container-fluid">
        <div class="tab-navigation">
            <button class="tab-btn active text-2xl" data-tab="invoices-tab">
                <i class="fa-solid fa-file-invoice mr-2"></i>
                Invoices
            </button>
            <button class="tab-btn text-2xl" data-tab="receipts-tab">
                <i class="fa-solid fa-receipt mr-2"></i>
                All Receipts
            </button>
        </div>
    </div>

    <!-- Invoices Tab Content -->
    <div id="invoices-tab" class="tab-content active">
    <div class="container-fluid">
        <div class="class-selection-card">
            <div class="text-center mb-6">
                <i class="fa-solid fa-users stats-icon"></i>
                <h2 class="text-3xl font-bold mb-2">Class Selection</h2>
                <p class="text-lg opacity-90">Select a class to view and manage student invoices</p>
            </div>
            
            <?php echo form_open(site_url('admin/invoices_show/invoice_search'), array('class' => 'w-full', 'id' => 'invoices_reload_form')); ?>
            <div class="max-w-2xl mx-auto">
                <label for="class_selection" class="block text-lg font-semibold mb-4">Choose Class</label>
                <select id="class_selection" name="class_id" class="form-input-modern select2">
            <option value=""><?php echo get_phrase('select_class'); ?></option>
            <?php
                $teacher_id = '';
                getFullClassList($teacher_id, $_GET['id']);
            ?>
            </select>
        </div>
        <?php echo form_close(); ?>
            
            <div class="text-center mt-6">
                <button class="btn-modern btn-modern-success" style="display: none" id="return_to_class_list">
                    <i class="fa-solid fa-arrow-left"></i>
                    Return to Class List
                </button>
        </div>
    </div>

        <!-- Class Selection Status -->
        <div id="class_holder" class="text-center mb-6"></div>

        <!-- Content Area -->
        <div id="table_holder" class="modern-card">
            <div id="class_list" style="display: none;"></div>
            <div id="loader" style="display: none; position: relative; top: 0px;" class="text-center py-8">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-lg text-gray-600">Loading data, please wait...</p>
            </div>
            <div id="per_invoice_loaded" style="display: none; position: relative; top: 0px;"></div>
        </div>
        
    <div><a href="#table_holder" id="anchor_a"></a></div>
    </div>
    </div>
    </div>

    <!-- All Receipts Tab Content -->
    <div id="receipts-tab" class="tab-content">
    <div class="container-fluid">
        <div class="modern-card">
            <div class="text-center mb-6">
                <i class="fa-solid fa-receipt stats-icon text-blue-600"></i>
                <h2 class="text-3xl font-bold mb-2">All Receipts</h2>
                <p class="text-lg opacity-90">Search and filter all payment receipts</p>
            </div>
            
            <!-- Filters -->
            <div class="row mb-4 items-center">
                <div class="col-md-2">
                    <label for="filter_start_date" class="block text-sm font-semibold mb-2">Start Date</label>
                    <input type="text" id="filter_start_date" class="form-input-modern datepicker" placeholder="Start date">
                </div>
                <div class="col-md-2">
                    <label for="filter_end_date" class="block text-sm font-semibold mb-2">End Date</label>
                    <input type="text" id="filter_end_date" class="form-input-modern datepicker" placeholder="End date">
                </div>
                <div class="col-md-2">
                    <label for="filter_receipt_code" class="block text-sm font-semibold mb-2">Receipt Code</label>
                    <input type="text" id="filter_receipt_code" class="form-input-modern" placeholder="Receipt code">
                </div>
                <div class="col-md-2">
                    <label for="filter_class" class="block text-sm font-semibold mb-2">Class</label>
                    <select id="filter_class" class="form-input-modern select2 border-none h-16 max-h-16">
                        <option value="">All Classes</option>
                        <?php
                            $teacher_id = '';
                            getFullClassList($teacher_id, '');
                        ?>
                    </select>
                </div>
                <div class="col-md-2">
                    <label for="filter_student" class="block text-sm font-semibold mb-2">Student</label>
                    <select id="filter_student" class="form-input-modern select2 border-none h-16 max-h-16" disabled>
                        <option value="">Select class first</option>
                    </select>
                </div>
                <div class="col-md-2">
                    <label class="block text-sm font-semibold mb-2">&nbsp;</label>
                    <button class="btn-modern btn-modern-primary" id="load_receipts_btn">
                        <i class="fa-solid fa-search"></i>
                        Load
                    </button>
                </div>
            </div>
        </div>

        <!-- Receipts Table Area -->
        <div id="receipts_table_holder" class="modern-card" style="display: none;">
            <div id="receipts_list"></div>
            <div id="receipts_loader" style="display: none;" class="text-center py-8">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-lg text-gray-600">Loading receipts, please wait...</p>
            </div>
        </div>
    </div>
    </div>
</div>


<script type="text/javascript">
    $(function() {

        $('#tinvoices').DataTable();
        boxChecked();
        get_receipts_by_term();
        get_receipts_by_date();
        
        // Check if returning from payment edit
        if(sessionStorage.getItem('return_to_receipts') === 'true') {
            sessionStorage.removeItem('return_to_receipts');
            
            // Switch to receipts tab
            $('.tab-btn').removeClass('active');
            $('.tab-btn[data-tab="receipts-tab"]').addClass('active');
            $('.tab-content').removeClass('active');
            $('#receipts-tab').addClass('active');
            
            // Restore filters
            const filters = JSON.parse(sessionStorage.getItem('receipt_filters') || '{}');
            if(filters.start_date) $('#filter_start_date').val(filters.start_date);
            if(filters.end_date) $('#filter_end_date').val(filters.end_date);
            if(filters.receipt_code) $('#filter_receipt_code').val(filters.receipt_code);
            if(filters.class_id) {
                $('#filter_class').val(filters.class_id).trigger('change');
                if(filters.student_id) {
                    setTimeout(function() {
                        $('#filter_student').val(filters.student_id);
                    }, 500);
                }
            }
            
            // Auto-load receipts
            setTimeout(function() {
                loadAllReceipts();
                setTimeout(function() {
                    $('html, body').animate({
                        scrollTop: $('#receipts_table_holder').offset().top - 100
                    }, 800);
                }, 1000);
            }, 600);
        }
        
        // Tab navigation
        $('.tab-btn').click(function() {
            const tabId = $(this).data('tab');
            $('.tab-btn').removeClass('active');
            $(this).addClass('active');
            $('.tab-content').removeClass('active');
            $('#' + tabId).addClass('active');
        });
        
        // Load receipts button
        $('#load_receipts_btn').click(function() {
            loadAllReceipts();
        });
        
        // Load students when class is selected
        $('#filter_class').change(function() {
            const class_id = $(this).val();
            if(class_id) {
                loadStudentsByClass(class_id);
            } else {
                $('#filter_student').html('<option value="">Select a class first</option>').prop('disabled', true);
            }
        });

        const isset = '<?php echo isset($_GET['id']); ?>';

        if(isset) {
            $('#class_selection').change();

            setTimeout(() => {
               $('html, body').animate({
                  scrollTop: ($('#table_holder').height())
                }, 1000);
             }, 1000)
        }

    });

    $('#reload_btn').click(function(event) {
        /* Act on the event */
        $('#reload_btn').val('Loading, please wait...');
        $('#reload_btn').removeClass('btn-success');
        $('#reload_btn').addClass('btn-danger');
    });

    ///Search by date form submitted
    $('#receipt_bydate_form').submit(function(event) {
        /* Act on the event */
        event.preventDefault();
        get_receipts_by_date();

    });

    ///Search by date form submitted
    $('#receipts_byterm_form').submit(function(event) {
        /* Act on the event */
        event.preventDefault();

        get_receipts_by_term();
        loadInvoices(); //load invoice list

    });

    function get_receipts_by_term() {
        let term = $('#term').val();
        //let sem = $('#sem').val();
        let year = $('#year').val();

        $.ajax({
            url: '<?php echo site_url('admin/get_receipt_byterm/search/'); ?>' + year + '/' + term,
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                $('#term_rec').text(response[0].total_amount);
                $('#term_rec_date').text('Received In: ' + response[0].duration);
                $('#term_rec_qty').text(response[0].total_number);

                if(response[0].total_amount == 'No Data') {
                    $('#term_rec_link').removeAttr('onclick');
                        /* Act on the event */
                        $('#term_rec').css('color', '#f3d60d');
                } else {
                    $('#term_rec_link').attr('onclick', 'receipt_issued_byterm_modal()');
                        /* Act on the event */
                        $('#term_rec').css('color', '#ffffff');
                }
            }
        });
    }

    //call the get_receipts
    function get_receipts_by_date() {
        let selected_date = $('#date_sel').val();


        $.ajax({
            url: '<?php echo site_url('admin/get_receipt_bydate/search/'); ?>' + selected_date,
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                $('#date_rec').text(response[0].total_amount);
                $('#date_rec_date').text('Received On: ' + response[0].date_chosen);
                $('#date_rec_qty').text(response[0].total_number);

                if(response[0].total_amount == 'No Data') {
                    $('#date_rec_link').removeAttr('onclick');
                        /* Act on the event */
                        $('#date_rec').css('color', '#f3d60d');
                } else {
                    $('#date_rec_link').attr('onclick', 'receipt_issued_bydate_modal()');
                        /* Act on the event */
                        $('#date_rec').css('color', '#ffffff');
                }
            }
        });
    }

     function receipt_issued_bydate_modal() {
        let selected_date = $('#date_sel').val();

        showAjaxModal('<?php echo site_url('modal/popup/receipts_issued_bydate/'); ?>' + selected_date, 'take_payment');

    }

    function receipt_issued_byterm_modal() {
        let term = $('#term').val();
        //let sem = $('#sem').val();
        let year = $('#year').val();

        showAjaxModal('<?php echo site_url('modal/popup/receipts_issued_byterm/'); ?>' + year + '/' + term, 'take_payment');
    }


    $('#class_selection').change(function(event) {
        /* Act on the event */
        loadInvoices();
    });

    function scrollToContentArea() {
        if ($('#table_holder').length) {
            $('html, body').animate({
                scrollTop: $('#table_holder').offset().top - 100
            }, 800);
        }
    }

    function loadInvoices() {

        //event.preventDefault();
        $('#anchor_a').click();

        let year = $('#year').val();
        let term = $('#term').val();
        // let sem = $('#sem').val();

        let class_id = $('#class_selection').val();
        let class_selected = $('#class_selection').children('option:selected').text();

        if(class_selected == '') {

            class_selected = 'No class selected';
        }

        $('#class_holder').html(`
            <div class="modern-card text-center">
                <div class="flex items-center justify-center mb-4">
                    <i class="fa-solid fa-check-circle text-green-500 text-2xl mr-3"></i>
                    <h3 class="text-2xl font-bold text-gray-900">Class Selected: ${class_selected}</h3>
                </div>
                <div class="flex flex-wrap gap-4 justify-center">
                    <button class="btn-modern btn-modern-info" id="bulk_invoice">
                        <i class="fa-solid fa-file-invoice"></i>
                        View Bulk Invoice
                    </button>
                    <button class="btn-modern btn-modern-danger" id="bulk_bill">
                        <i class="fa-solid fa-receipt"></i>
                        View Bulk Bill
                    </button>
                </div>
            </div>
        `);

        $.ajax({
        url: '<?php echo site_url('admin/invoices_show/invoice_search/'); ?>' + class_id + '/' + year + '/' + term,
        //cache: false,
        beforeSend: function() {
            $('#table_holder #loader').fadeIn('slow');
            $('#return_to_class_list').fadeOut('slow');
            $('#table_holder #per_invoice_loaded').fadeOut('slow');
            $('#table_holder #class_list').fadeOut('slow');
            $('#table_holder #loader').html(`
                <div class="text-center py-8">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-lg text-gray-600">Loading data, please wait...</p>
                </div>
            `);

            setTimeout(() => {
               $('#table_holder #loader').html(`
                   <div class="text-center py-8">
                       <div class="loading-spinner mx-auto mb-4"></div>
                       <p class="text-lg text-gray-600">Thanks for your patience. I'm almost done.</p>
                   </div>
               `);
            }, 30000)
        },
        success: function(response) {
            $('#table_holder #loader').fadeOut('slow');
            $('#table_holder #per_invoice_loaded').fadeOut('slow');
            $('#table_holder #class_list').fadeIn('slow');
            $('#table_holder #class_list').html(response);
            
            // Initialize DataTable and then scroll
            $('.datatable').DataTable({
                "initComplete": function(settings, json) {
                    scrollToContentArea();
                }
            });
            
            // Fallback scroll in case DataTable doesn't initialize
            setTimeout(() => {
                scrollToContentArea();
            }, 1000);
        }

      });
    }


    //call class changed function
    function class_selected_load(class_id) {
        $('#anchor_a').click();

        let year = $('#year').val();
        let term = $('#term').val();
        //let sem = $('#sem').val();

        $('#class_selection').val(class_id).change();
        let class_selected = $('#class_selection').children('option:selected').text();

        if(class_selected == '') {

            class_selected = 'No class selected';
        }
        $('#class_holder').html(`
            <div class="modern-card text-center">
                <div class="flex items-center justify-center mb-4">
                    <i class="fa-solid fa-check-circle text-green-500 text-2xl mr-3"></i>
                    <h3 class="text-2xl font-bold text-gray-900">Class Selected: ${class_selected}</h3>
                </div>
                <div class="flex flex-wrap gap-4 justify-center">
                    <button class="btn-modern btn-modern-info" id="bulk_invoice">
                        <i class="fa-solid fa-file-invoice"></i>
                        View Bulk Invoice
                    </button>
                    <button class="btn-modern btn-modern-danger" id="bulk_bill">
                        <i class="fa-solid fa-receipt"></i>
                        View Bulk Bill
                    </button>
                </div>
            </div>
        `);

        $.ajax({
        url: '<?php echo site_url('admin/invoices_show/invoice_search/'); ?>' + class_id + '/' + year + '/' + term,
        //cache: false,
        beforeSend: function() {
            $('#table_holder #loader').fadeIn('slow');
            $('#return_to_class_list').fadeOut('slow');
            $('#table_holder #per_invoice_loaded').fadeOut('slow');
            $('#table_holder #class_list').fadeOut('slow');
            $('#table_holder #loader').html(`
                <div class="text-center py-8">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-lg text-gray-600">Loading data, please wait...</p>
                </div>
            `);

            setTimeout(() => {
               $('#table_holder #loader').html(`
                   <div class="text-center py-8">
                       <div class="loading-spinner mx-auto mb-4"></div>
                       <p class="text-lg text-gray-600">Thanks for your patience. I'm almost done.</p>
                   </div>
               `);
            }, 30000)
        },
        success: function(response) {
            $('#table_holder #loader').fadeOut('slow');
            $('#table_holder #per_invoice_loaded').fadeOut('slow');
            $('#table_holder #class_list').fadeIn('slow');
            $('#table_holder #class_list').html(response);
            $('.datatable').DataTable();
        }

      });
    }


    function invoice_load(student_id) {
        let class_id = $('#class_selection').val();

        $.ajax({
        url: '<?php echo site_url('admin/invoices_show/invoice_load/'); ?>' + student_id,
        cache: false,
        beforeSend: function() {
            $('#table_holder #class_list').fadeOut('slow');
            $('#table_holder #loader').fadeIn('slow');
            $('#table_holder #loader').html(`
                <div class="text-center py-8">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-lg text-gray-600">Loading invoice details, please wait...</p>
                </div>
            `);

            setTimeout(() => {
               $('#table_holder #loader').html(`
                   <div class="text-center py-8">
                       <div class="loading-spinner mx-auto mb-4"></div>
                       <p class="text-lg text-gray-600">Thanks for your patience. I'm almost done.</p>
                   </div>
               `);
            }, 5000)
        },
        success: function(response) {
            $('#table_holder #loader').fadeOut('slow');
            $('#table_holder #per_invoice_loaded').fadeIn('slow');
            $('#table_holder #per_invoice_loaded').html(response);
            $('#return_to_class_list').fadeIn('slow');


            //change load button text and color
            $('#reload_btn').val('Reload Invoices');
            $('#reload_btn').removeClass('btn-danger');
            $('#reload_btn').addClass('btn-success');
        }

      });
    }

    //toggle return to class list button
    $('#return_to_class_list').click(function(event) {
        /* Act on the event */
        /*$('html, body').animate({
          scrollTop: ($('#table_holder').offset().top )
        }, 1000);*/

        $('#per_invoice_loaded').fadeOut('slow');
        $('#class_list').fadeIn('slow');
        $('#return_to_class_list').fadeOut('slow');

    });

    $('button #take_payment').click(function(event) {
        /* Act on the event */
        $('#per_invoice_loaded').fadeOut('slow');
        $('#class_list').fadeIn('slow');
        $('#return_to_class_list').fadeOut('slow');

    });

     function invoice_pay_modal(student_id, date = '', term = '') {

       /** invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {
            invoice_code = invoice_code;
        } **/
        if(date != '' && term == '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment/'); ?>' + student_id + '/' + date, 'take_payment');
        } else if(date != '' && term != '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment/'); ?>' + student_id + '/' + date + '/' + term, 'take_payment');
        }  else {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment/'); ?>' + student_id, 'take_payment');
        }
    }

    function invoice_pay_modal(student_id, date = '', term = '') {

       /** invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {
            invoice_code = invoice_code;
        } **/
        if(date != '' && term == '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment/'); ?>' + student_id + '/' + date, 'take_payment');
        } else if(date != '' && term != '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment/'); ?>' + student_id + '/' + date + '/' + term, 'take_payment');
        }  else {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment/'); ?>' + student_id, 'take_payment');
        }
    }

    function view_receipts_modal(student_id, date = '', term = '') {

       /** invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {
            invoice_code = invoice_code;
        } **/
        if(date != '' && term == '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_view_receipts/'); ?>' + student_id + '/' + date, 'take_payment');
        } else if(date != '' && term != '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_view_receipts/'); ?>' + student_id + '/' + date + '/' + term, 'take_payment');
        }  else {
            showAjaxModal('<?php echo site_url('modal/popup/modal_view_receipts/'); ?>' + student_id, 'take_payment');
        }
    }



    function invoice_view_modal(invoice_code) {

        invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {
            invoice_code = invoice_code;
        }

        showAjaxModal('<?php echo site_url('modal/popup_professional/modal_view_invoice_professional/'); ?>' + invoice_code, 'large');

    }



    function bulk_invoice_view_modal(student_id) {

        showAjaxModal('<?php echo site_url('modal/popup/modal_view_bulk_invoice/'); ?>' + student_id, 'take_payment');

    }

    //general payment
    function general_payament_modal(class_id) {

        showAjaxModal('<?php echo site_url('modal/popup/modal_take_general_payment/'); ?>' + class_id, 'take_payment');

    }

    function invoice_edit_modal(invoice_code) {
        showAjaxModal_invoice('<?php echo site_url('modal/popup/modal_edit_invoice/'); ?>' + invoice_code);
    }

    function invoice_delete_confirm(invoice_code) {
        let admin_level = <?php echo $admin_level; ?>;

        invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        /*if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {*/
           // invoice_code = invoice_code;
        //}

        if(admin_level == 1) {
            confirm_modal('<?php echo site_url('admin/invoice/delete/'); ?>' + invoice_code, 'modal_invoice_delete', 'checkboxes_form');
        } else {
           confirm_modal('<?php echo site_url('admin/invoice/delete/'); ?>' + invoice_code, 'modal_delete_warning');
            return false;
        }
    }

   

    //is any box checked
    function boxChecked(approvedCounter=0, firstLoad=false) {
        console.log(approvedCounter);

        if(approvedCounter > 0 && !firstLoad) {
            showAjaxModal_alert('Please proceed to process the approved requests before selecting new ones.', 'Error');
            return;
        }
        let checkboxes = $('#checkboxes_form td input[type="checkbox"]');
        let count_checked_buttons = checkboxes.filter(':checked').length;


        if(count_checked_buttons < 1) {
            $('#tfooter').css('display', 'none');
        } else {
            $('#tfooter').removeAttr('style');
        }
    }



     function allStudentsBoxChecked() {
        let checkboxes = $('#all_students_invoices td input[type="checkbox"]');
        let count_checked_buttons = checkboxes.filter(':checked').length;

        if(count_checked_buttons < 1) {
            $('#stfooter').css('display', 'none');
        } else {
            $('#stfooter').removeAttr('style');
        }
    }

    function loadStudentsByClass(class_id) {
        $.ajax({
            url: '<?php echo site_url('admin/get_students_by_class/'); ?>' + class_id,
            type: 'GET',
            dataType: 'json',
            success: function(response) {
                let options = '<option value="">All Students</option>';
                response.forEach(function(student) {
                    options += '<option value="' + student.student_id + '">' + student.name + '</option>';
                });
                $('#filter_student').html(options).prop('disabled', false);
            }
        });
    }

    function loadAllReceipts() {
        let start_date = $('#filter_start_date').val();
        let end_date = $('#filter_end_date').val();
        let receipt_code = $('#filter_receipt_code').val();
        let class_id = $('#filter_class').val();
        let student_id = $('#filter_student').val();

        $.ajax({
            url: '<?php echo site_url('admin/get_all_receipts/'); ?>',
            type: 'POST',
            data: {
                start_date: start_date,
                end_date: end_date,
                receipt_code: receipt_code,
                class_id: class_id,
                student_id: student_id
            },
            beforeSend: function() {
                $('#receipts_table_holder').show();
                $('#receipts_loader').show();
                $('#receipts_list').hide();
            },
            success: function(response) {
                $('#receipts_loader').hide();
                $('#receipts_list').show();
                $('#receipts_list').html(response);
                $('#receipts_list .datatable').DataTable();
                setTimeout(function() {
                    $('html, body').animate({
                        scrollTop: $('#receipts_table_holder').offset().top - 100
                    }, 800);
                }, 300);
            },
            error: function() {
                $('#receipts_loader').hide();
                $('#receipts_list').show();
                $('#receipts_list').html('<div class="alert alert-danger">Error loading receipts. Please try again.</div>');
            }
        });
    }

    function saveFiltersAndEdit(receipt_code) {
        const filters = {
            start_date: $('#filter_start_date').val(),
            end_date: $('#filter_end_date').val(),
            receipt_code: $('#filter_receipt_code').val(),
            class_id: $('#filter_class').val(),
            student_id: $('#filter_student').val()
        };
        sessionStorage.setItem('receipt_filters', JSON.stringify(filters));
        showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment_edit/'); ?>/' + receipt_code, 'large');
    }

</script>




