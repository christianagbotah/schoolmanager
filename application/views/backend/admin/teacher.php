      <?php 
        $active_sms_service = $this->db->get_where('settings' , array('type' => 'active_sms_service'))->row()->description;
        $loader = '<img src="'.base_url('assets/images/validate.gif').'" width="16px;">';
        $checked_icon = '<i class="glyphicon glyphicon-check" style="color: green;"></i>';

        //feedback
                $display = 'none';
                $alert_type = 'success';
                if(isset($_GET['msg'])) {
                    $msg_val = $_GET['msg'];
                    if($msg_val == 1) {
                        $display = 'block';
                        $alert_type = 'danger';
                        $feedback = 'Invalid Teacher\'s Email Address';
                    } else if($msg_val == 2) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('teacher\'s_data_added_successfully.');
                    } else if($msg_val == 3) {
                        $display = 'block';
                        $alert_type = 'danger';
                        $feedback = get_phrase('this_email_address_is_not_available');
                    } else if($msg_val == 4) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('teacher\'s_data_updated_successfully.');
                    } else if($msg_val == 5) {
                        $display = 'block';
                        $alert_type = 'danger';
                        $feedback = 'Could Not Update Your Data. Invalid Email Found!';
                    } else if($msg_val == 6) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = 'Selected teacher Deleted Successfully!';
                    } else if($msg_val == 7) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('user_account_blocked_successfully');
                    } else if($msg_val == 8) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('user_account_unblocked_successfully');
                    } else {
                        $feedback = '';
                    }

                } else {
                    $feedback = '';
                }
    ?>
       <?php 
            $popover_content = 'This button helps you to automatically generate a CSV file which is just like an Excel file. The generated file will be downloaded automatically into your local disk Download Folder. Open it with Microsoft Excel and fill the columns provided. When you are done, save the file in csv format (NB: please click "Yes" button whenever you see a popup window in excel while saving) and upload it. Make sure the date of birth column is formatted as this: mm-dd-yy.';
       ?>
       <style type="text/css">
           #loader2, #loading_txt2 {
            position: relative;
            top: 150px;
        }

        #loader_logo2 {
            position: relative;
            top: 150px;
          /**  animation-name: logo_translate;
            animation-duration: 2s;
            animation-timing-function: all;
            animation-iteration-count: infinite;**/
        }
/**
        @keyframes logo_translate {
            50% {
                position: absolute;
                transform: translate3d(20px, 20px, 20px);
            }

            100% {
                position: absolute;
                transform: translate3d(-20px, -20px, -20px);
                width: 50px;
            }
        }**/

        /**Animate the dot. in front of the wait...**/
        #dot12 {
            position: relative;

            animation-name: blink12;
            animation-duration: 2s;
            animation-iteration-count: infinite;
            animation-timing-function: all;

        }

        @keyframes blink12 {

            50% {
                opacity: 1.0;
            }

            100% {
                opacity: 0.0
            }
        }

        #dot22 {
            position: relative;

            animation-name: blink22;
            animation-duration: 2s;
            animation-iteration-count: infinite;
            animation-timing-function: all;

        }

        @keyframes blink22 {

            50% {
                opacity: 1.0;
            }

            100% {
                opacity: 0.0
            }
        }

        #dot32 {
            position: relative;

            animation-name: blink32;
            animation-duration: 2s;
            animation-iteration-count: infinite;
            animation-timing-function: all;

        }

        @keyframes blink32 {

            50% {
                opacity: 0.0;
            }

            100% {
                opacity: 1.0
            }
        }
       

        /* ---- Teachers workspace — modern enterprise presentation layer ---- */
        .teachers-workspace { padding: 24px 28px 40px; }
        .teachers-page-head {
            display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;
            margin: 0 0 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
        }
        .teachers-eyebrow {
            margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
            letter-spacing: .08em; text-transform: uppercase;
        }
        .teachers-page-title {
            margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
            font-weight: 800; letter-spacing: -.02em;
        }
        .teachers-page-subtitle { margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5; }
        .teachers-page-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
        .teachers-page-actions a {
            min-height: 42px; padding: 9px 16px !important; border-radius: 9px !important;
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            font-size: 14px !important; font-weight: 700 !important; text-decoration: none !important;
        }
        .teachers-report-btn { background: #7c3aed; color: #fff !important; border: 1px solid #7c3aed; }
        .teachers-report-btn:hover { background: #6d28d9; color: #fff !important; }

        .teachers-bulk-row { margin: 0 0 16px !important; padding: 0 !important; }
        .teachers-bulk-row > div { width: 100%; padding: 0; }
        .teachers-bulk-toggle {
            float: none !important; min-height: 42px !important; padding: 9px 16px !important;
            border: 1px solid #ddd6fe !important; border-radius: 9px !important;
            background: #f5f3ff !important; color: #6d28d9 !important;
            font-size: 14px !important; font-weight: 800 !important; box-shadow: none !important;
        }
        .teachers-bulk-toggle:hover { background: #ede9fe !important; color: #5b21b6 !important; transform: none !important; }

        #add_bulk_teacher {
            margin-top: 12px !important; border: 1px solid #e2e8f0; border-radius: 14px;
            overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,.04); background: #fff;
        }
        #add_bulk_teacher > .bg-white { border: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        #add_bulk_teacher .bg-gradient-to-r { background-image: none !important; }
        #add_bulk_teacher .from-purple-600 { background-color: #6d28d9 !important; }
        #generate_csv { min-height: 46px; background: #2563eb !important; font-size: 14px !important; transform: none !important; }
        #import_csv { min-height: 46px; background: #7c3aed !important; font-size: 14px !important; transform: none !important; }
        #add_bulk_teacher label.w-full {
            min-height: 46px; background: #059669 !important; font-size: 14px !important;
            transform: none !important; display: inline-flex !important; align-items: center; justify-content: center;
        }
        #add_bulk_teacher .text-sm { font-size: 13px !important; line-height: 1.45 !important; }
        #add_bulk_teacher .text-lg { font-size: 16px !important; }
        #add_bulk_teacher .text-2xl { font-size: 19px !important; }

        .teachers-table-card {
            width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
            border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
            box-shadow: 0 1px 2px rgba(15,23,42,.04);
        }
        .teachers-table-card #teachers { min-width: 1180px; margin: 0 !important; font-size: 14px !important; }
        .teachers-table-card #teachers > thead > tr > th {
            padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
            font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
            border-bottom: 1px solid #e2e8f0 !important; vertical-align: middle;
        }
        .teachers-table-card #teachers > tbody > tr > td {
            padding: 12px 13px !important; color: #334155; font-size: 14px !important;
            line-height: 1.45; vertical-align: middle; border-bottom: 1px solid #eef2f7;
        }
        .teachers-table-card #teachers > tbody > tr:hover > td { background: #f8fbff; }
        .teachers-table-card #teachers thead tr:first-child th { padding: 12px 14px !important; }
        .teachers-table-card #teachers thead tr:first-child .grid {
            display: flex !important; align-items: center; gap: 8px !important; padding: 0 !important; text-transform: none;
        }
        .teachers-table-card #teachers thead tr:first-child .grid > div {
            display: inline-flex; align-items: center; gap: 6px; min-height: 34px;
            padding: 6px 11px; border-radius: 999px; background: #f8fafc;
            border: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 700;
        }
        .teachers-table-card #teachers thead tr:first-child strong {
            padding: 0 !important; background: transparent !important; border-radius: 0 !important;
            color: #0f172a; font-size: 14px;
        }

        .teachers-workspace .dataTables_wrapper { padding: 14px; }
        .teachers-workspace .dataTables_wrapper .dataTables_length,
        .teachers-workspace .dataTables_wrapper .dataTables_filter,
        .teachers-workspace .dataTables_wrapper .dataTables_info,
        .teachers-workspace .dataTables_wrapper .dataTables_paginate { font-size: 14px; color: #475569; }
        .teachers-workspace .dataTables_wrapper select,
        .teachers-workspace .dataTables_wrapper input[type="search"] {
            min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
            border-radius: 8px; font-size: 14px; background: #fff; color: #0f172a;
        }
        .teachers-workspace .dataTables_wrapper input[type="search"]:focus,
        .teachers-workspace .dataTables_wrapper select:focus {
            outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12);
        }
        .teachers-workspace .alert { font-size: 14px; border-radius: 10px; }
        .teachers-workspace .btn { min-height: 42px; font-size: 14px; font-weight: 700; border-radius: 9px; }

        @media (max-width: 767px) {
            .teachers-workspace { padding: 18px 14px 32px; }
            .teachers-page-head { align-items: flex-start; flex-direction: column; }
            .teachers-page-actions { width: 100%; justify-content: flex-start; }
            .teachers-page-title { font-size: 26px; }
            #add_bulk_teacher .p-8 { padding: 18px !important; }
        }
        @media (max-width: 400px) {
            .teachers-page-actions a { width: 100%; }
            .teachers-bulk-toggle { width: 100%; }
        }
</style>
    <div id="preloader2" style="display: none; width: 100%; min-height: 1920px; background-color: #fff; text-align: center; z-index: 99999; position: absolute;">
       <center>
            <img id="loader_logo2" src="<?php echo base_url();?>assets/images/lightworldtech.png" width="80px">
            <img id="loader2" src="<?php echo base_url();?>assets/images/validate.gif" width="54px">
            <p id="loading_txt2" style="padding-top: 15px; font-weight: bold;">Entering your data, please wait<span id="dot12">.</span><span id="dot22">.</span><span id="dot32">.</span></p>
       </center>
    </div>

        <div class="teachers-workspace">
        <div class="teachers-page-head">
            <div>
                <p class="teachers-eyebrow">People</p>
                <h1 class="teachers-page-title">Teachers</h1>
                <p class="teachers-page-subtitle">Manage teaching staff, account access, contact details, and staff onboarding.</p>
            </div>
            <div class="teachers-page-actions">
                <a href="<?= base_url().'admin/teachers_gender_report/';?>" target="_blank" class="teachers-report-btn">
                    <i class="fa fa-chart-pie"></i> Gender Report
                </a>
                <a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_teacher_add/');?>');" class="btn btn-primary">
                    <i class="fa-solid fa-user-plus"></i>
                    <?php echo get_phrase('add_new_teacher');?>
                </a>
            </div>
        </div>

        <div class="row mb-10 p-5 teachers-bulk-row">
            <div class="col-sm-8 col-md-8">
                <button class="btn bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white pull-right h-16 rounded-lg text-xl font-bold content-center shadow-lg transition-all teachers-bulk-toggle" data-toggle="collapse" data-target="#add_bulk_teacher">
                    <i class="fa fa-users"></i><sup><i class="fa fa-plus text-xs"></i></sup> Bulk Add Teachers
                </button>

                <div class="panel collapse" id="add_bulk_teacher" style="margin-top: 20px;">
                    <div class="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
                        <div class="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                            <h4 class="text-2xl font-bold text-white flex items-center gap-2">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                Add Teachers in Bulk
                            </h4>
                        </div>
                        <div class="p-8">
                            <?php echo form_open(site_url('admin/bulk_teacher_add_using_csv/import'), array('class' => 'validate', 'id' => 'upload_form', 'name' => 'upload_form', 'enctype' => 'multipart/form-data'));?>

                            <!-- Instructions Card -->
                            <div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
                                <div class="flex items-start">
                                    <svg class="w-6 h-6 text-blue-500 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
                                    </svg>
                                    <div>
                                        <h5 class="text-lg font-bold text-blue-900 mb-2">How to Use Bulk Upload</h5>
                                        <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                            <li>Click "Generate CSV Template" to download the template file</li>
                                            <li>Open the file with Microsoft Excel or Google Sheets</li>
                                            <li>Fill in teacher information in the provided columns</li>
                                            <li>Save the file in CSV format (click "Yes" when Excel prompts)</li>
                                            <li>Upload the completed CSV file below</li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            <!-- Warning Card -->
                            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
                                <div class="flex items-center">
                                    <svg class="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span class="text-sm font-semibold text-red-800">Birthday format must be <span class="text-blue-600">YYYY-MM-DD</span> (e.g: 1987-05-25)</span>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div class="text-center">
                                    <button type="button" class="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105 pop-over" data-content="<?php echo $popover_content; ?>" data-placement="top" data-title="CSV Template Guide" name="generate_csv" id="generate_csv">
                                        <svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        Generate CSV Template
                                    </button>
                                    <p class="text-sm text-gray-600 mt-2 font-semibold">Step 1: Download template</p>
                                </div>

                                <div class="text-center">
                                    <label class="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105 cursor-pointer inline-block">
                                        <svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                                        </svg>
                                        <span id="file_label">Choose CSV File</span>
                                        <input type="file" name="userfile" id="userfile" onchange="check_loaded_csvfile()" class="hidden" data-validate="required" data-message-required="<?php echo get_phrase('required'); ?>" accept="text/csv, .csv">
                                    </label>
                                    <p class="text-sm text-gray-600 mt-2 font-semibold">Step 2: Select filled CSV</p>
                                </div>

                                <div class="text-center">
                                    <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all transform hover:scale-105" name="import_csv" id="import_csv" disabled>
                                        <svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                        </svg>
                                        Import Teachers
                                    </button>
                                    <p class="text-sm text-gray-600 mt-2 font-semibold">Step 3: Upload & import</p>
                                </div>
                            </div>

                            <?php echo form_close();?>
                            <a href="" download="bulk_teacher.csv" style="display: none;" id="bulk">Download</a>
                        </div>
                    </div>
                </div>
            </div>
            </div>

                <?php if(validation_errors()) :?>
                <div class="alert alert-danger alert-dismissible" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
                    </button>
                   <strong> <?php echo validation_errors(); ?></strong>
                </div>

                <?php endif;?>

                 <div style="display: <?= $display; ?>; margin-top: 10px" class="alert alert-<?= $alert_type; ?> alert-dismissible" role="alert">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
                        </button>
                       <strong> <?php echo $feedback; ?></strong>
                    </div>

                    <caption></caption>
                    <div class="teachers-table-card">
                    <table class="table table-hover table-striped table-active w-full text-xl text-left rtl:text-right text-gray-500 dark:text-gray-600 datatable" id="teachers">
                      <thead class="text-lg font-bold text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                          <tr>
                            <th colspan="10">
                                <div class="grid grid-cols-3 gap-2 py-5">
                                    <div>MALES: <strong id="males" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                    <div>FEMALES: <strong id="females" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                    <div>TOTAL: <strong id="total" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                </div>
                            </th>
                          </tr>
                          <tr>
                            <th scope="col" class="px-6 py-3">photo</th>
                            <th scope="col" class="px-6 py-3">staff iD</th>
                            <th scope="col" class="px-6 py-3">name</th>
                            <th scope="col" class="px-6 py-3">gender</th>
                            <th scope="col" class="px-6 py-3">form master</th>
                            <th scope="col" class="px-6 py-3">email</th>
                            <th scope="col" class="px-6 py-3">auth key</th>
                            <th scope="col" class="px-6 py-3">phone</th>
                            <th scope="col" class="px-6 py-3">account status</th>
                            <th scope="col" class="px-6 py-3">options</th>
                          </tr>
                      </thead>
                </table>
                    </div>
        </div>


<!-----  DATA TABLE EXPORT CONFIGURATIONS ---->
<script type="text/javascript">


	jQuery(document).ready(function($) {
        $('#preloader2').css('display', 'none');
        $('#submit_button').attr('disabled', 'disabled');
        $('#import_csv').attr('disabled', 'disabled');

        $('#generate_csv').mouseover(function() {
            $('#generate_csv').popover('show');
        });

        $('#generate_csv').mouseout(function() {
            $('#generate_csv').popover('hide');
        });


        $.fn.dataTable.ext.errMode = 'throw';
        let allTeachers = $('#teachers').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": "<?php echo site_url('admin/get_teachers') ?>",
                "dataType": "json",
                "type": "POST",
            },
            "columns": [
                { "data": "photo" },
                { "data": "staff_id" },
                { "data": "name" },
                { "data": "gender" },
                { "data": "form_master" },
                { "data": "email" },
                { "data": "auth_key" },
                { "data": "phone" },
                { "data": "account_status" },
                { "data": "options" },
            ],
            "columnDefs": [
                {
                    "targets": [0,4,5,6,7,8,9],
                    "orderable": false
                },
            ]
        });

        allTeachers.on('xhr', function(json) {

            var json = allTeachers.ajax.json();

            $('#males').text(json.totalMale);
            $('#females').text(json.totalFemale);
            $('#total').text(json.grandTotalGender);
        });

        $(document).on('hidden.bs.modal', '#modal_confirm_staff', function() {
                //reload the page
                toastr.error('Closed!');
                location.reload();
            });
	});

    function teacher_edit_modal(teacher_id) {
        showAjaxModal('<?php echo site_url('modal/popup/modal_teacher_edit/');?>' + teacher_id);
    }

    function teacher_delete_confirm(teacher_id) {
        showConfirmModal(
            'Confirm Delete Teacher',
            'Are you sure you want to delete this teacher? This action cannot be undone.',
            function() {
                $('.close').click();
                showAjaxModal_alert('Please wait...<i class="fa fa-3x fa-spinner fa-pulse"></i>.', 'Loading');
                $.ajax({
                    url: '<?php echo site_url('admin/teacher/delete/');?>' + teacher_id,
                    type: 'POST',
                    dataType: 'json',
                })
                .done(function(response) {
                    if(response.message == 'done') {
                        showAjaxModal_alert('Teacher deleted successfully.', 'Success');

                        setTimeout(() => {
                            $('.close').click();
                            navigation('<?php echo site_url('admin/'); ?>' + response.route);
                        }, 3000);
                    } else {
                        showAjaxModal_alert('Deletion failed!', 'Error');
                    }
                })
                .fail(function(err) {
                    showAjaxModal_alert(err.responseText, 'Error');
                });
            },
            '<?php echo get_phrase('delete'); ?>',
            'danger'
        );
    }

    function account_block(teacher_id) {
        showConfirmModal(
            'Confirm Block Teacher',
            'Are you sure you want to block this teacher account? They will not be able to log in until unblocked.',
            function() {
                $('.close').click();
                showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

                $.ajax({
                    url: '<?php echo site_url('admin/teacher/block/');?>' + teacher_id,
                    type: 'POST',
                    dataType: 'html',
                })
                .done(function(response) {
                    showAjaxModal_alert('Account Blocked Successfully', 'Success');

                    setTimeout(() => {
                        navigation('<?php echo site_url('admin/teacher');?>');
                        $('.modal').removeClass('modal-backdrop');
                        $('.modal').removeClass('fade');
                        $('.modal').removeClass('in');
                        $('.close').click();
                    }, 3000);
                })
                .fail(function(err) {
                    showAjaxModal_alert('Error: ' + err.responseText, 'Error');
                });
            },
            '<?php echo get_phrase('block'); ?>',
            'danger'
        );
    }

    function account_unblock(teacher_id) {
        showConfirmModal(
            'Confirm Unblock Teacher',
            'Are you sure you want to unblock this teacher account? They will be able to log in again.',
            function() {
                $('.close').click();
                showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

                $.ajax({
                    url: '<?php echo site_url('admin/teacher/unblock/');?>' + teacher_id,
                    type: 'POST',
                    dataType: 'html',
                })
                .done(function(response) {
                    showAjaxModal_alert('Account Unblocked Successfully', 'Success');

                    setTimeout(() => {
                        navigation('<?php echo site_url('admin/teacher');?>');
                        $('.modal').removeClass('modal-backdrop');
                        $('.modal').removeClass('fade');
                        $('.modal').removeClass('in');
                        $('.close').click();
                    }, 3000);
                })
                .fail(function(err) {
                    showAjaxModal_alert('Error: ' + err.responseText, 'Error');
                });
            },
            '<?php echo get_phrase('unblock'); ?>',
            'success'
        );
    }

    function check_sms_status() {
        var active_sms_service = '<?php echo $active_sms_service; ?>';
        if(active_sms_service == '' || active_sms_service == 'disabled' || active_sms_service == null) {
            alert('No active SMS service found. Please go to System Settings and activate SMS service and try again');
            toastr.error('No active SMS service found. Please go to System Settings and activate SMS service and try again');
            $('.pt_link').removeAttr('href');
            $('.pt_link').attr({href: '#'});
            return false;

        }
    }

    $("#generate_csv").click(function(){
            $.ajax({
                url: '<?php echo site_url('admin/generate_bulk_teacher_csv');?>',
                success: function(response) {
                    $("#bulk").attr('href', response);
                        jQuery('#bulk')[0].click();
                    alert("<?php echo get_phrase('file_generated_and_downloaded_successfully._please_check_your_download_folder_for_the_file_'); ?>(bulk_teacher.csv)");
                    toastr.success("<?php echo get_phrase('file_generated_and_downloaded_successfully._please_check_your_download_folder_for_the_file_'); ?>(bulk_teacher.csv)");
                        
                    //document.location = response;
                }
            });
    });

    //check loaded file
    function check_loaded_csvfile() {
        // Update file label
        var fileName = $('#userfile').prop('files')[0].name;
        $('#file_label').html('<svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>' + fileName);
        
        //send file path to php to upload the file and validate
        var loader = '<?php echo $loader;?>';
        var checked_icon = '<?php echo $checked_icon; ?>';

        //get the file
        var upload_file = $('#userfile').prop('files')[0];
        var form_data = new FormData();
        form_data.append('userfile', upload_file);
        form_data.append('<?php echo $this->security->get_csrf_token_name(); ?>', '<?php echo $this->security->get_csrf_hash(); ?>');

            //first disable the upload button
            var import_btn = $('#import_csv').attr('disabled', 'disabled');
            //change the btn text to 'please wait. Validating file...'
            import_btn.html('<svg class="w-5 h-5 inline-block mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>Validating...');

            //let's send the file path to php now for upload and validation
            $.ajax({
                url: '<?php echo site_url('admin/uploaded_csvfile_teacher_validate/');?>',
                type: 'post',
                data: form_data,
                dataType: 'text',
                cache: false,
                contentType: false,
                processData: false,
                success: function(response) {
                    if(response.length > 0) {
                        showAjaxModal_confirm_staff('<?php echo site_url('modal/popup_2/upload_validate_staff/');?>' + response);
                        $('#modal_confirm_staff .modal-content').css('margin-top', '10px');

                        $('#modal_confirm_staff').modal({
                            backdrop: 'static',
                            keyboard: 'false'
                        });
                    }else{
                        //enable the upload button
                        var import_btn = $('#import_csv').removeAttr('disabled');
                        //change the btn text to 'parent validation successful
                        import_btn.html('<svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Validation Successful');

                        setTimeout(() => {
                          _click();
                        }, 3000);

                        function _click() {
                            $('#import_csv').click();

                            //show the preloader while data entry goes on
                            $('#preloader2').css('display', 'block');
                            $('body').css('cursor', 'wait');
                        }
                    }
                    
                }

            });
    }

    //call this when user is done confirming the modal



</script>

