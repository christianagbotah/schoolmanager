        <style>
            @media Print{
                table {
                    width: 130px;
                    border: 1px;
                }
            }
        </style>
            
            <?php 
                $active_sms_service = $this->db->get_where('settings' , array('type' => 'active_sms_service'))->row()->description;

                //feedback
                $display = 'none';
                $alert_type = 'success';
                $feedback = ''; // Initialize feedback variable
                if(isset($_GET['msg'])) {
                    $msg_val = $_GET['msg'];
                    if($msg_val == 1) {
                        $display = 'block';
                        $alert_type = 'danger';
                        $feedback = 'Invalid Parent\'s Email Address';
                    } else if($msg_val == 2) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('parent\'s_data_added_successfully.');
                    } else if($msg_val == 3) {
                        $display = 'block';
                        $alert_type = 'danger';
                        $feedback = get_phrase('this_email_address_is_not_available');
                    } else if($msg_val == 4) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('parent\'s_data_updated_successfully.');
                    } else if($msg_val == 5) {
                        $display = 'block';
                        $alert_type = 'danger';
                        $feedback = 'Could Not Update Your Data. Invalid Email Found!';
                    } else if($msg_val == 6) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = 'Selected Parent Deleted Successfully!';
                    } else if($msg_val == 7) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('user_account_blocked_successfully');
                    } else if($msg_val == 8) {
                        $display = 'block';
                        $alert_type = 'success';
                        $feedback = get_phrase('user_account_unblocked_successfully');
                    }

                }
            ?>
            <style type="text/css">
                /* Parents workspace — modern enterprise presentation layer */
                .parents-workspace { padding: 24px 28px 40px; }
                .parents-page-head {
                    display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;
                    margin: 0 0 20px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
                }
                .parents-eyebrow {
                    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
                    letter-spacing: .08em; text-transform: uppercase;
                }
                .parents-page-title {
                    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
                    font-weight: 800; letter-spacing: -.02em;
                }
                .parents-page-subtitle {
                    margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5;
                }
                .parents-page-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: flex-end; }
                .parents-page-actions a {
                    min-height: 42px; padding: 9px 16px !important; border-radius: 9px !important;
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    font-size: 14px !important; font-weight: 700 !important; text-decoration: none !important;
                }
                .parents-report-btn { background: #7c3aed; color: #fff !important; border: 1px solid #7c3aed; }
                .parents-report-btn:hover { background: #6d28d9; color: #fff !important; }

                .parents-tabs {
                    display: inline-flex; flex-wrap: wrap; gap: 6px; margin: 0 0 16px !important;
                    padding: 5px; border: 1px solid #e2e8f0 !important; border-radius: 12px;
                    background: #fff;
                }
                .parents-tabs > li { margin: 0 !important; }
                .parents-tabs > li > a {
                    min-height: 40px; padding: 9px 14px !important; border: 0 !important;
                    border-radius: 8px !important; background: transparent !important; color: #475569 !important;
                    font-size: 14px !important; line-height: 1.35; font-weight: 700 !important;
                    display: inline-flex; align-items: center; justify-content: center;
                }
                .parents-tabs > li > a:hover { background: #f1f5f9 !important; color: #0f172a !important; }
                .parents-tabs > li.active > a,
                .parents-tabs > li.active > a:hover,
                .parents-tabs > li.active > a:focus {
                    background: #2563eb !important; color: #fff !important; box-shadow: 0 2px 8px rgba(37,99,235,.2);
                }

                .parents-table-card {
                    width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;
                    border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
                    box-shadow: 0 1px 2px rgba(15,23,42,.04);
                }
                .parents-table-card table { min-width: 1040px; margin: 0 !important; }
                .parents-table-card .table > thead > tr > th {
                    padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
                    font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
                    border-bottom: 1px solid #e2e8f0 !important; vertical-align: middle;
                }
                .parents-table-card .table > tbody > tr > td {
                    padding: 12px 13px !important; color: #334155; font-size: 14px !important;
                    line-height: 1.45; vertical-align: middle; border-bottom: 1px solid #eef2f7;
                }
                .parents-table-card .table > tbody > tr:hover > td { background: #f8fbff; }

                .parents-table-card thead tr:first-child th { padding: 12px 14px !important; }
                .parents-table-card thead tr:first-child .grid {
                    display: flex !important; align-items: center; gap: 8px !important;
                    padding: 0 !important; text-transform: none;
                }
                .parents-table-card thead tr:first-child .grid > div {
                    display: inline-flex; align-items: center; gap: 6px; min-height: 34px;
                    padding: 6px 11px; border-radius: 999px; background: #f8fafc;
                    border: 1px solid #e2e8f0; color: #475569; font-size: 13px; font-weight: 700;
                }
                .parents-table-card thead tr:first-child strong {
                    padding: 0 !important; background: transparent !important; border-radius: 0 !important;
                    color: #0f172a; font-size: 14px;
                }

                .tab-content { padding: 0; }
                .dataTables_wrapper { padding: 14px; }
                .dataTables_wrapper .dataTables_length,
                .dataTables_wrapper .dataTables_filter,
                .dataTables_wrapper .dataTables_info,
                .dataTables_wrapper .dataTables_paginate { font-size: 14px; color: #475569; }
                .dataTables_wrapper select,
                .dataTables_wrapper input[type="search"] {
                    min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
                    border-radius: 8px; font-size: 14px; background: #fff; color: #0f172a;
                }
                .dataTables_wrapper input[type="search"]:focus,
                .dataTables_wrapper select:focus {
                    outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12);
                }
                .dataTables_wrapper .dt-paging-button,
                .dataTables_wrapper .paginate_button {
                    min-height: 36px; min-width: 36px; padding: 7px 10px !important;
                    border-radius: 7px !important; font-size: 13px !important;
                }

                .parents-workspace .alert { font-size: 14px; border-radius: 10px; }
                .parents-workspace .btn { min-height: 42px; font-size: 14px; font-weight: 700; border-radius: 9px; }

                @media (max-width: 767px) {
                    .parents-workspace { padding: 18px 14px 32px; }
                    .parents-page-head { align-items: flex-start; flex-direction: column; }
                    .parents-page-actions { width: 100%; justify-content: flex-start; }
                    .parents-page-title { font-size: 26px; }
                    .parents-tabs { width: 100%; }
                    .parents-tabs > li { flex: 1 1 auto; }
                    .parents-tabs > li > a { width: 100%; }
                }
                @media (max-width: 400px) {
                    .parents-page-actions a { width: 100%; }
                    .parents-tabs { display: grid; grid-template-columns: 1fr; }
                }
            </style>
                
                <?php if(validation_errors()) :?>
                <div class="alert alert-danger alert-dismissible" role="alert">
                    <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
                    </button>
                   <strong> <?php echo validation_errors(); ?></strong>
                </div>
                <?php endif;?>
                <div class="parents-workspace">
                <div class="parents-page-head">
                    <div>
                        <p class="parents-eyebrow">People</p>
                        <h1 class="parents-page-title">Parents & Guardians</h1>
                        <p class="parents-page-subtitle">Manage guardian accounts, contact information, access status, and family reporting.</p>
                    </div>
                    <div class="parents-page-actions">
                        <a href="<?= base_url().'admin/parents_gender_report/';?>" target="_blank" class="parents-report-btn">
                            <i class="fa fa-chart-pie"></i> Gender Report
                        </a>
                        <a href="javascript:;" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_parent_add/');?>');" class="btn btn-primary">
                            <i class="entypo-plus-circled"></i>
                            <?php echo get_phrase('add_new_parent');?>
                        </a>
                    </div>
                </div>

               <div class="col-md-12" style="padding:0;">
                   <ul class="nav nav-tabs bordered mb-10 parents-tabs">
                       <li class="active"><a href="#all_parents" data-toggle="tab" class="btn btn-info lit rounded-lg text-xl font-bold content-center">All Parents</a></li> 
                       <li><a href="#active_parents" data-toggle="tab" class="btn btn-success lit rounded-lg text-xl font-bold content-center">Active Parents</a></li>
                       <li><a href="#inactive_parents" data-toggle="tab" class="btn btn-danger lit rounded-lg text-xl font-bold content-center">Inactive Parents</a></li>
                   </ul>
                   <div class="tab-content">

                    <div style="display: <?= $display; ?>; margin-top: 10px" class="alert alert-<?= $alert_type; ?> alert-dismissible" role="alert">
                        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
                        </button>
                       <strong> <?php echo $feedback; ?></strong>
                    </div>

                       <div class="tab-pane active" id="all_parents">

                            <div id="allParentsTable" class="parents-table-card">
                                <table class="table table-hover table-striped table-active w-full text-xl text-left rtl:text-right text-gray-500 dark:text-gray-600 datatable" id="parents_al">
                                  <thead class="text-lg font-bold text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 uppercase">
                                      <tr>
                                        <th colspan="8">
                                            <div class="grid grid-cols-3 gap-2 py-5">
                                                <div>MALES: <strong id="all_parents_male" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                                <div>FEMALES: <strong id="all_parents_female" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                                <div>TOTAL: <strong id="all_parents_total" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                            </div>
                                        </th>
                                      </tr>
                                      <tr>
                                        <th scope="col" class="px-6 py-3">name</th>
                                        <th scope="col" class="px-6 py-3">gender</th>
                                        <th scope="col" class="px-6 py-3">email</th>
                                        <th scope="col" class="px-6 py-3">auth key</th>
                                        <th scope="col" class="px-6 py-3">phone</th>
                                        <th scope="col" class="px-6 py-3">profession</th>
                                        <th scope="col" class="px-6 py-3">account status</th>
                                        <th scope="col" class="px-6 py-3">options</th>
                                      </tr>
                                  </thead>

                                </table>
                            </div>
                       </div>

                       <div class="tab-pane" id="active_parents">
                            <div class="parents-table-card">
                            <table class="table table-hover table-striped table-active w-full text-xl text-left rtl:text-right text-gray-500 dark:text-gray-600 datatable" id="parents_ac">
                              <thead class="text-lg font-bold text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 uppercase">
                                <tr>
                                    <th colspan="8">
                                        <div class="grid grid-cols-3 gap-2 py-5">
                                            <div>MALES: <strong id="active_parents_male" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                            <div>FEMALES: <strong id="active_parents_female" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                            <div>TOTAL: <strong id="active_parents_total" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                        </div>
                                    </th>
                                  </tr>
                                  <tr>
                                    <th scope="col" class="px-6 py-3">name</th>
                                    <th scope="col" class="px-6 py-3">gender</th>
                                    <th scope="col" class="px-6 py-3">email</th>
                                    <th scope="col" class="px-6 py-3">auth key</th>
                                    <th scope="col" class="px-6 py-3">phone</th>
                                    <th scope="col" class="px-6 py-3">profession</th>
                                    <th scope="col" class="px-6 py-3">account status</th>
                                    <th scope="col" class="px-6 py-3">options</th>
                                  </tr>
                              </thead>
                            </table>
                            </div>
                       </div>

                       <div class="tab-pane" id="inactive_parents">
                                <div class="parents-table-card">
                                <table class="table table-hover table-striped table-active w-full text-xl text-left rtl:text-right text-gray-500 dark:text-gray-600 datatable" id="parents_in">
                                  <thead class="text-lg font-bold text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 uppercase">
                                    <tr>
                                        <th colspan="8">
                                            <div class="grid grid-cols-3 gap-2 py-5">
                                                <div>MALES: <strong id="inactive_parents_male" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                                <div>FEMALES: <strong id="inactive_parents_female" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                                <div>TOTAL: <strong id="inactive_parents_total" class="p-3 bg-gray-200 rounded-full"></strong></div>
                                            </div>
                                        </th>
                                      </tr>
                                      <tr>
                                        <th scope="col" class="px-6 py-3">name</th>
                                        <th scope="col" class="px-6 py-3">gender</th>
                                        <th scope="col" class="px-6 py-3">email</th>
                                        <th scope="col" class="px-6 py-3">auth key</th>
                                        <th scope="col" class="px-6 py-3">phone</th>
                                        <th scope="col" class="px-6 py-3">profession</th>
                                        <th scope="col" class="px-6 py-3">account status</th>
                                        <th scope="col" class="px-6 py-3">options</th>
                                      </tr>
                                  </thead>
                            </table>
                                </div>
                       </div>
                   </div>
               </div>
               </div>



<!-----  DATA TABLE EXPORT CONFIGURATIONS ---->
<script type="text/javascript">

    jQuery(document).ready(function($) {
        $('.active a').css({
            'opacity' : '1',
            'color'   : '#ffffff'
        });

        $.fn.dataTable.ext.errMode = 'throw';
        //all parents
        let allParentsTable = $('#parents_al').DataTable({
            "processing": true,
            "serverSide": true,
            /*layout: {
                topStart: {
                    buttons: [
                        'colvis',

                        {
                            extend: 'copyHtml5',
                            exportOptions: {
                                columns: 'visible'
                            }
                        },
                        {
                            extend: 'pdfHtml5',
                            exportOptions: {
                                columns: 'visible'
                            }
                        },
                        {
                            extend: 'excelHtml5',
                            exportOptions: {
                                columns: 'visible'
                            }
                        },
                        
                    ]
                }
            },*/
            ajax:{
                url: "<?php echo site_url('admin/get_parents') ?>",
                dataType: "json",
                type: "POST",

            },
            "columns": [
                { "data": "name" },
                { "data": "gender" },
                { "data": "email" },
                { "data": "auth_key" },
                { "data": "phone" },
                { "data": "profession" },
                { "data": "account_status" },
                { "data": "options" },
            ],
            "columnDefs": [
                {
                    "targets": [5,6],
                    "orderable": false
                },
            ],

        });

        allParentsTable.on('xhr', function(json) {

            var json = allParentsTable.ajax.json();

            $('#all_parents_male').text(json.totalMale);
            $('#all_parents_female').text(json.totalFemale);
            $('#all_parents_total').text(json.grandTotalGender);
        });


        //active parents
        let activeParentsTable = $('#parents_ac').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": "<?php echo site_url('admin/get_active_parents') ?>",
                "dataType": "json",
                "type": "POST",
            },
            "columns": [
                { "data": "name" },
                { "data": "gender" },
                { "data": "email" },
                { "data": "auth_key" },
                { "data": "phone" },
                { "data": "profession" },
                { "data": "account_status" },
                { "data": "options" },
            ],
            "columnDefs": [
                {
                    "targets": [5],
                    "orderable": false
                },
            ],

        });

        activeParentsTable.on('xhr', function(json) {

            var json = activeParentsTable.ajax.json();

            $('#active_parents_male').text(json.totalMale);
            $('#active_parents_female').text(json.totalFemale);
            $('#active_parents_total').text(json.grandTotalGender);
        });

        //inactive parents
        let inActiveParentsTable = $('#parents_in').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": "<?php echo site_url('admin/get_inactive_parents') ?>",
                "dataType": "json",
                "type": "POST",
            },
            "columns": [
                { "data": "name" },
                { "data": "gender" },
                { "data": "email" },
                { "data": "auth_key" },
                { "data": "phone" },
                { "data": "profession" },
                { "data": "account_status" },
                { "data": "options" },
            ],
            "columnDefs": [
                {
                    "targets": [5],
                    "orderable": false
                },
            ]
        });

        inActiveParentsTable.on('xhr', function(json) {

            var json = inActiveParentsTable.ajax.json();

            $('#inactive_parents_male').text(json.totalMale);
            $('#inactive_parents_female').text(json.totalFemale);
            $('#inactive_parents_total').text(json.grandTotalGender);
        });
    });

    function parent_edit_modal(parent_id) {
        showAjaxModal('<?php echo site_url('modal/popup/modal_parent_edit/');?>' + parent_id);
    }

    function parent_delete_confirm(parent_id) {
        showConfirmModal(
            'Confirm Delete Parent',
            'Are you sure you want to delete this parent? This action cannot be undone.',
            function() {
                $('.close').click();
                showAjaxModal_alert('Please wait...<i class="fa fa-3x fa-spinner fa-pulse"></i>.', 'Loading');
                $.ajax({
                    url: '<?php echo site_url('admin/parent/delete/');?>' + parent_id,
                    type: 'POST',
                    dataType: 'json',
                })
                .done(function(response) {
                    if(response.message == 'done') {
                        showAjaxModal_alert('Parent deleted successfully.', 'Success');

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

    function account_block(parent_id) {
        showConfirmModal(
            'Confirm Block Parent',
            'Are you sure you want to block this parent account? They will not be able to log in until unblocked.',
            function() {
                $('.close').click();
                showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

                $.ajax({
                    url: '<?php echo site_url('admin/parent/block/');?>' + parent_id,
                    type: 'POST',
                    dataType: 'html',
                })
                .done(function(response) {
                    showAjaxModal_alert('Account Blocked Successfully', 'Success');

                    setTimeout(() => {
                        navigation('<?php echo site_url('admin/parent');?>');
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

    function account_unblock(parent_id) {
        showConfirmModal(
            'Confirm Unblock Parent',
            'Are you sure you want to unblock this parent account? They will be able to log in again.',
            function() {
                $('.close').click();
                showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder;">Processing Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

                $.ajax({
                    url: '<?php echo site_url('admin/parent/unblock/');?>' + parent_id,
                    type: 'POST',
                    dataType: 'html',
                })
                .done(function(response) {
                    showAjaxModal_alert('Account Unblocked Successfully', 'Success');

                    setTimeout(() => {
                        navigation('<?php echo site_url('admin/parent');?>');
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

    //parent sms
    function parent_sms(parent_id) {
        navigation("<?=site_url('admin/message/sms_send?pi='); ?>" + parent_id)
    }



   
    function PrintElem(elem)
    {
        Popup($(elem).html());
    }

    function Popup(data)
    {
        var mywindow = window.open('', '', '');
        mywindow.document.write('<!doctype html><html><head><title>Parents</title>');
        //mywindow.document.write('<link rel="stylesheet" href="assets/css/chartjs/dist/Chart.min.css" type="text\/css" \/>');
        mywindow.document.write('<link rel="stylesheet" type="text/css" href="<?php echo base_url('assets/css/chartjs/dist/Chart.css');?>" />');
        mywindow.document.write('<script src="<?php echo base_url('assets/css/chartjs/dist/Chart.js');?>" type="text\/javascript"><\/script>');
        mywindow.document.write('<script type="text\/javascript" src="<?php echo base_url('assets/js/jquery-3.3.1.min.js'); ?>"><\/script>');

        mywindow.document.write('<\/head><body style="font-size: 13px">');
        mywindow.document.write(data);

        mywindow.document.write('<\/body><\/html>');
        mywindow.document.close();

        mywindow.onload=function(){
            mywindow.focus();
            mywindow.print();
            mywindow.close();
        }
        
    }
</script>
