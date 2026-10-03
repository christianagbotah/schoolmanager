<?php 
    $currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
    $fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);
?>

<style>
    .dataTables_wrapper .dataTables_length, .dataTables_wrapper .dataTables_filter, .dataTables_wrapper .dataTables_info, .dataTables_wrapper .dataTables_paginate { font-size: 14px !important; }
    .dataTables_wrapper select, .dataTables_wrapper input { font-size: 14px !important; }
    #table_export tbody td { font-size: 14px !important; padding: 12px !important; }
    #table_export thead th { font-size: 15px !important; padding: 12px !important; font-weight: 600; }
    .class-page label { font-size: 15px !important; font-weight: 600; }
    .class-page select, .class-page input { font-size: 15px !important; }
    .class-page option { font-size: 15px !important; }

    /* Direct UX refinement — Classes workspace */
    .structure-workspace { padding: 24px 28px 40px !important; }
    .structure-page-head {
        margin: 0 0 18px; padding: 0 0 18px; border-bottom: 1px solid #e2e8f0;
    }
    .structure-eyebrow {
        margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
        letter-spacing: .08em; text-transform: uppercase;
    }
    .structure-page-head h1 {
        margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
        font-weight: 800; letter-spacing: -.02em;
    }
    .structure-page-head p:last-child { margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5; }

    .structure-workspace > .mb-6.border-b { border: 0 !important; margin-bottom: 16px !important; }
    .structure-workspace > .mb-6.border-b > ul {
        display: inline-flex !important; gap: 5px; margin: 0 !important; padding: 5px !important;
        border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
    }
    .structure-workspace > .mb-6.border-b li { margin: 0 !important; }
    .structure-workspace [data-tabs-target] {
        min-height: 40px; padding: 9px 14px !important; border: 0 !important;
        border-radius: 8px !important; font-size: 14px !important; line-height: 1.35;
        font-weight: 700 !important; color: #475569 !important; background: transparent !important;
    }
    .structure-workspace [data-tabs-target] i { font-size: 16px !important; }
    .structure-workspace [data-tabs-target]:hover { background: #f1f5f9 !important; color: #0f172a !important; }
    .structure-workspace [data-tabs-target].active {
        background: #2563eb !important; color: #fff !important; box-shadow: 0 2px 8px rgba(37,99,235,.18);
    }

    #tabContent > [role="tabpanel"] > div {
        border-radius: 14px !important; border-color: #e2e8f0 !important;
        box-shadow: 0 1px 2px rgba(15,23,42,.04) !important; overflow: hidden;
    }
    #tabContent > [role="tabpanel"] > div > div:first-child {
        padding: 15px 18px !important; background: #fff; border-bottom: 1px solid #eef2f7 !important;
    }
    #tabContent h3 { margin: 0; font-size: 17px !important; font-weight: 800 !important; color: #0f172a !important; }
    #tabContent > [role="tabpanel"] > div > div:last-child { padding: 16px 18px !important; }

    #table_export { min-width: 860px; }
    #table_export thead th {
        padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
        font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
    }
    #table_export tbody td { padding: 12px 13px !important; color: #334155; font-size: 14px !important; line-height: 1.45; }
    #table_export tbody tr:hover td { background: #f8fbff; }
    #table_export .dropdown > button {
        width: 40px; height: 40px; min-height: 40px; padding: 0 !important;
        display: inline-flex; align-items: center; justify-content: center; font-size: 18px !important;
    }

    .class-page label { margin-bottom: 7px !important; font-size: 14px !important; font-weight: 700 !important; color: #334155 !important; }
    .class-page select, .class-page input:not([type="file"]) {
        min-height: 46px !important; padding: 10px 12px !important; border: 1px solid #cbd5e1 !important;
        border-radius: 9px !important; background: #fff !important; color: #0f172a !important; font-size: 15px !important;
    }
    .class-page select:focus, .class-page input:focus {
        border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.14) !important; outline: none;
    }
    #class_form .grid { gap: 16px !important; }
    #class_form button[type="submit"], #uploadBtn {
        min-height: 46px; padding: 10px 18px !important; font-size: 15px !important; font-weight: 800 !important;
        border-radius: 9px !important;
    }

    #bulk .grid.lg\:grid-cols-2 { gap: 16px !important; margin-bottom: 18px !important; }
    #bulk .grid.lg\:grid-cols-2 > div { padding: 18px !important; border-radius: 12px !important; }
    #bulk h4 { font-size: 15px !important; margin-bottom: 10px !important; }
    #bulk p, #bulk li { font-size: 14px !important; line-height: 1.5; }
    #bulk a { min-height: 42px; padding: 9px 14px !important; font-size: 14px !important; border-radius: 9px !important; }
    #uploadZone { height: 190px !important; border-radius: 12px !important; }
    #uploadZone i.text-6xl { font-size: 40px !important; margin-bottom: 10px !important; }

    .class-page .dataTables_wrapper .dataTables_length,
    .class-page .dataTables_wrapper .dataTables_filter,
    .class-page .dataTables_wrapper .dataTables_info,
    .class-page .dataTables_wrapper .dataTables_paginate { font-size: 14px !important; color: #475569; }
    .class-page .dataTables_wrapper select,
    .class-page .dataTables_wrapper input[type="search"] { min-height: 40px !important; font-size: 14px !important; }

    @media (max-width: 767px) {
        .structure-workspace { padding: 18px 14px 32px !important; }
        .structure-page-head h1 { font-size: 26px; }
        .structure-workspace > .mb-6.border-b > ul {
            display: grid !important; grid-template-columns: 1fr; width: 100%;
        }
        .structure-workspace [data-tabs-target] { width: 100%; justify-content: flex-start; }
        #class_form .grid { grid-template-columns: 1fr !important; }
    }
</style>

<div class="class-page p-5 sm:p-6 structure-workspace">
    <div class="structure-page-head">
        <div>
            <p class="structure-eyebrow">School Setup</p>
            <h1>Classes</h1>
            <p>Manage class definitions, assigned sections and teachers, or create multiple classes from a prepared file.</p>
        </div>
    </div>

    <!-- Tabs -->
    <div class="mb-6 border-b border-gray-200">
        <ul class="flex flex-wrap -mb-px text-center" role="tablist">
            <li class="mr-2" role="presentation">
                <button class="inline-flex items-center gap-2 px-6 py-4 border-b-2 border-blue-600 text-blue-600 rounded-t-lg active" id="list-tab" data-tabs-target="#list" type="button" role="tab" >
                    <i class="entypo-list" ></i>
                    <span><?php echo get_phrase('class_list');?></span>
                </button>
            </li>
            <li class="mr-2" role="presentation">
                <button class="inline-flex items-center gap-2 px-6 py-4 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 rounded-t-lg" id="add-tab" data-tabs-target="#add" type="button" role="tab" >
                    <i class="entypo-plus-circled" ></i>
                    <span><?php echo get_phrase('add_class');?></span>
                </button>
            </li>
            <li class="mr-2" role="presentation">
                <button class="inline-flex items-center gap-2 px-6 py-4 border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 rounded-t-lg" id="bulk-tab" data-tabs-target="#bulk" type="button" role="tab" >
                    <i class="entypo-upload" ></i>
                    <span><?php echo get_phrase('bulk_upload');?></span>
                </button>
            </li>
        </ul>
    </div>

    <div id="tabContent">
        <!-- List Tab -->
        <div class="" id="list" role="tabpanel">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="p-6 sm:p-8 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i class="entypo-list text-blue-600"></i>
                        <?php echo get_phrase('all_classes');?>
                    </h3>
                </div>
                <div class="p-4 sm:p-6 overflow-x-auto">
                    <table class="w-full text-left text-gray-500 datatable" id="table_export">
                        <thead class="text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-4 py-3">#</th>
                                <th class="px-4 py-3"><?php echo get_phrase('class_name');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('category');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('numeric_name');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('section');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('teacher');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('options');?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php 
                            $count = 1;
                            $class = getAllClassList();
                            for($i=0; $i < sizeof($class); $i++):
                                $class_row = $this->db->get_where('class', ['class_id' => $class[$i]])->row();
                            ?>
                            <tr class="bg-white border-b hover:bg-gray-50">
                                <td class="px-4 py-3"><?php echo $count++;?></td>
                                <td class="px-4 py-3 font-medium text-gray-900"><?php echo $this->crud_model->get_class_name($class[$i]);?></td>
                                <td class="px-4 py-3"><?php echo $class_row->category;?></td>
                                <td class="px-4 py-3"><strong><?php echo $this->crud_model->get_class_name_numeric($class[$i]);?></strong></td>
                                <td class="px-4 py-3"><?php echo $this->crud_model->get_class_section($class[$i]); ?></td>
                                <td class="px-4 py-3">
                                    <?php
                                        $class_teacher_id = $this->crud_model->get_class_teacher_id($class[$i]);
                                        if($class_teacher_id != '' && $class_teacher_id != 0) {
                                            $teacher_name = $this->crud_model->get_type_name_by_id('teacher', $class_teacher_id);
                                            echo '<a href="'.site_url('admin/teacher_details/'.$class_teacher_id).'" class="text-blue-600 hover:text-blue-800 hover:underline font-medium">'.$teacher_name.'</a>';
                                        }
                                    ?>
                                </td>
                                <td class="px-4 py-3">
                                    <div class="dropdown">
                                        <button class="inline-flex items-center p-2.5 text-xl font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700" type="button" data-toggle="dropdown">
                                            <i class="entypo-dot-3"></i>
                                        </button>
                                        <ul class="dropdown-menu dropdown-menu-right" style="font-size: 15px; min-width: 180px;">
                                            <li>
                                                <a href="<?php echo site_url('admin/student_information/'.$class[$i]);?>" style="color: #2563eb; padding: 10px 16px; display: block;">
                                                    <i class="entypo-users"></i> <?php echo get_phrase('view_students');?>
                                                </a>
                                            </li>
                                            <li class="divider" style="margin: 4px 0; border-top: 1px solid #e5e7eb;"></li>
                                            <li>
                                                <a href="#" onclick="showAjaxModal('<?php echo site_url('modal/popup/modal_edit_class/'.$class[$i]);?>'); return false;" style="color: #16a34a; padding: 10px 16px; display: block;">
                                                    <i class="entypo-pencil"></i> <?php echo get_phrase('edit');?>
                                                </a>
                                            </li>
                                            <li class="divider" style="margin: 4px 0; border-top: 1px solid #e5e7eb;"></li>
                                            <li>
                                                <a href="javascript:void(0)" onclick="confirm_modal('<?php echo site_url('admin/classes/delete/'.$class[$i]);?>')" style="color: #dc2626; padding: 10px 16px; display: block;">
                                                    <i class="entypo-trash"></i> <?php echo get_phrase('delete');?>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                            <?php endfor;?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add Class Tab -->
        <div class="hidden" id="add" role="tabpanel">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="p-4 sm:p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <i class="entypo-plus-circled text-blue-600"></i>
                        <?php echo get_phrase('create_new_class');?>
                    </h3>
                </div>
                <div class="p-4 sm:p-6">
                    <?php echo form_open(site_url('admin/classes/create'), array('id' => 'class_form'));?>
                    <div class="max-w-6xl mx-auto space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label class="block mb-3 text-lg font-semibold text-gray-900"><?php echo get_phrase('name');?></label>
                            <select name="name" id="name" class="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5" required>
                                <option value=""><?php echo get_phrase('select_class_name');?></option>
                                <?php
                                    $class_name = ['CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS']; 
                                    foreach($class_name as $cn) {
                                        echo '<option value="'.$cn.'">'.$cn.'</option>';
                                    }
                                ?>
                            </select>
                        </div>

                        <div>
                            <label class="block mb-3 text-lg font-semibold text-gray-900"><?php echo get_phrase('category');?></label>
                            <select name="category" class="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5" required>
                                <option value="Pre-School">Pre-School</option>
                                <option value="Lower Primary">Lower Primary</option>
                                <option value="Upper Primary">Upper Primary</option>
                                <option value="JHS">JHS</option>
                            </select>
                        </div>

                        <div>
                            <label class="block mb-3 text-lg font-semibold text-gray-900"><?php echo get_phrase('name_numeric');?></label>
                            <input type="text" name="name_numeric" class="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5" placeholder="e.g., 1, 2, 3"/>
                        </div>

                        <div>
                            <label class="block mb-3 text-lg font-semibold text-gray-900"><?php echo get_phrase('section');?></label>
                            <select name="section_id" class="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5" required>
                                <?php 
                                $this->db->select('name');
                                $this->db->distinct();
                                $this->db->from('section');
                                $sections = $this->db->get()->result_array();
                                foreach($sections as $row_s):
                                ?>
                                <option value="<?php echo $row_s['name'];?>"><?php echo $row_s['name'];?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        

                        <div>
                            <label class="block mb-3 text-lg font-semibold text-gray-900"><?php echo get_phrase('teacher');?></label>
                            <select name="teacher_id" id="teacher_select" class="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5">
                                <option value=""><?php echo get_phrase('select_teacher');?></option>
                                <?php 
                                $teachers = $this->db->get('teacher')->result_array();
                                foreach($teachers as $row):
                                ?>
                                <option value="<?php echo $row['teacher_id'];?>"><?php echo $row['name'];?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button type="submit" class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold rounded-lg text-lg px-6 py-4 flex items-center justify-center gap-2">
                                <i class="entypo-check"></i>
                                <?php echo get_phrase('create_class');?>
                            </button>
                        </div>
                        </div>
                    </div>
                    <?php echo form_close();?>
                </div>
            </div>
        </div>

        <!-- Bulk Upload Tab -->
        <div class="hidden" id="bulk" role="tabpanel">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="p-4 sm:p-6 border-b border-gray-200">
                    <h3 class="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <i class="entypo-upload text-blue-600"></i>
                        <?php echo get_phrase('bulk_upload_classes');?>
                    </h3>
                </div>
                <div class="p-4 sm:p-6">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div class="p-6 bg-amber-50 border border-amber-200 rounded-lg">
                            <h4 class="flex items-center gap-2 text-amber-800 font-bold text-lg mb-4">
                                <i class="entypo-info-circled"></i>
                                <?php echo get_phrase('how_it_works');?>
                            </h4>
                            <ol class="space-y-2 text-base text-gray-700 list-decimal list-inside">
                                <li><?php echo get_phrase('download_template');?></li>
                                <li><?php echo get_phrase('fill_class_details');?></li>
                                <li><?php echo get_phrase('upload_completed_file');?></li>
                            </ol>
                        </div>
                        <div class="p-6 bg-green-50 border border-green-200 rounded-lg">
                            <h4 class="flex items-center gap-2 text-green-800 font-bold text-lg mb-4">
                                <i class="entypo-download"></i>
                                <?php echo get_phrase('download_template');?>
                            </h4>
                            <p class="text-base text-gray-700 mb-4"><?php echo get_phrase('get_excel_template');?></p>
                            <a href="<?php echo site_url('admin/download_class_template');?>" class="inline-flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-semibold rounded-lg text-base px-5 py-3">
                                <i class="entypo-download"></i>
                                <?php echo get_phrase('download_excel_template');?>
                            </a>
                        </div>
                    </div>

                    <?php echo form_open_multipart(site_url('admin/bulk_upload_classes'), array('id' => 'bulk_upload_form'));?>
                    <div class="flex items-center justify-center w-full">
                        <label for="bulkFile" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all" id="uploadZone">
                            <div class="flex flex-col items-center justify-center pt-5 pb-6">
                                <i class="entypo-upload text-6xl text-gray-400 mb-4"></i>
                                <p class="mb-2 text-base text-gray-500"><span class="font-semibold"><?php echo get_phrase('click_to_upload');?></span> <?php echo get_phrase('or_drag_and_drop');?></p>
                                <p class="text-sm text-gray-500"><?php echo get_phrase('excel_or_csv_files');?></p>
                                <p id="fileName" class="mt-4 text-base font-medium text-green-600"></p>
                            </div>
                            <input id="bulkFile" name="file" type="file" class="hidden" accept=".xlsx,.xls,.csv" />
                        </label>
                    </div>
                    <div class="mt-6 text-center">
                        <button type="submit" id="uploadBtn" disabled class="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold rounded-lg text-lg px-6 py-4 disabled:opacity-50 disabled:cursor-not-allowed">
                            <i class="entypo-upload"></i>
                            <?php echo get_phrase('upload_and_create_classes');?>
                        </button>
                    </div>
                    <?php echo form_close();?>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function confirm_modal(url) {
    showConfirmModal(
        '<?php echo get_phrase('confirm_delete');?>',
        '<?php echo get_phrase('are_you_sure_delete');?>',
        function() {
            showAjaxModal_alert('<?php echo get_phrase("deleting");?>...', 'loading');
            $.ajax({
                url: url,
                type: 'GET',
                dataType: 'json'
            }).done(function(response) {
                if(response.status === 'success') {
                    showAjaxModal_alert(response.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    showAjaxModal_alert(response.message || '<?php echo get_phrase("delete_failed");?>', 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('<?php echo get_phrase("an_error_occurred");?>', 'error');
            });
        },
        '<?php echo get_phrase('delete');?>',
        'danger'
    );
}

jQuery(document).ready(function($) {
    var datatable = $("#table_export").dataTable();
    $(".dataTables_wrapper select").select2({minimumResultsForSearch: -1});
    
    // Initialize Bootstrap dropdowns
    $('.dropdown-toggle').dropdown();
    
    $('#teacher_select').select2({
        placeholder: '<?php echo get_phrase('select_teacher');?>',
        allowClear: true,
        width: '100%'
    });

    // Tab switching
    $('[data-tabs-target]').on('click', function() {
        const target = $(this).data('tabs-target');
        $('[data-tabs-target]').removeClass('border-blue-600 text-blue-600 active').addClass('border-transparent');
        $(this).addClass('border-blue-600 text-blue-600 active').removeClass('border-transparent');
        $('[role="tabpanel"]').addClass('hidden');
        $(target).removeClass('hidden');
    });

    // File upload
    const uploadZone = $('#uploadZone');
    const fileInput = $('#bulkFile');
    const uploadBtn = $('#uploadBtn');
    const fileName = $('#fileName');

    fileInput.on('change', function() {
        if(this.files.length > 0) {
            fileName.text(this.files[0].name);
            uploadBtn.prop('disabled', false);
        }
    });

    uploadZone.on('dragover', function(e) {
        e.preventDefault();
        $(this).addClass('border-blue-500 bg-blue-50');
    }).on('dragleave', function() {
        $(this).removeClass('border-blue-500 bg-blue-50');
    }).on('drop', function(e) {
        e.preventDefault();
        $(this).removeClass('border-blue-500 bg-blue-50');
        const files = e.originalEvent.dataTransfer.files;
        if(files.length > 0) {
            fileInput[0].files = files;
            fileName.text(files[0].name);
            uploadBtn.prop('disabled', false);
        }
    });



    // Form submission
    $('#class_form').submit(function(e) {
        e.preventDefault();
        showAjaxModal_alert('<?php echo get_phrase("creating_class");?>...', 'loading');
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false
        }).done(function(response) {
            try {
                var data = typeof response === 'string' ? JSON.parse(response) : response;
                if(data.status === 'success') {
                    showAjaxModal_alert(data.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    showAjaxModal_alert(data.message || '<?php echo get_phrase("operation_failed");?>', 'error');
                }
            } catch(e) {
                showAjaxModal_alert('<?php echo get_phrase("operation_failed");?>', 'error');
            }
        }).fail(function(err) {
            showAjaxModal_alert('<?php echo get_phrase("an_error_occurred");?>: ' + err.responseText, 'error');
        });
    });

    $('#bulk_upload_form').submit(function(e) {
        e.preventDefault();
        if(!fileInput[0].files.length) {
            showAjaxModal_alert('<?php echo get_phrase("please_select_file");?>', 'error');
            return;
        }
        showAjaxModal_alert('<?php echo get_phrase("uploading_classes");?>...', 'loading');
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false
        }).done(function(response) {
            try {
                var data = typeof response === 'string' ? JSON.parse(response) : response;
                if(data.status === 'success') {
                    showAjaxModal_alert(data.message, 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                } else {
                    showAjaxModal_alert(data.message || '<?php echo get_phrase("upload_failed");?>', 'error');
                }
            } catch(e) {
                showAjaxModal_alert('<?php echo get_phrase("upload_failed");?>', 'error');
            }
        }).fail(function() {
            showAjaxModal_alert('<?php echo get_phrase("upload_failed");?>', 'error');
        });
    });
});
</script>
