<script src="<?php echo base_url(); ?>assets/cdn/js/tailwindcss.js"></script>

<div class="bg-blue-50 rounded-xl shadow-sm p-6 mb-6 teacher-subject-workspace-head">
    <div class="flex items-center justify-between">
        <div>
            <h2 class="text-3xl font-bold text-gray-800 mb-2"><?php echo get_phrase('my_subjects');?></h2>
            <p class="text-gray-600"><?php echo $class_name.' '.$this->crud_model->get_class_name_numeric($class_id);?> - <?php echo get_phrase('year');?>: <?php echo $year;?> | <?php echo get_phrase($class_name == 'JHSS' ? 'semester' : 'term');?>: <?php echo $class_name == 'JHSS' ? $sem : $term;?></p>
        </div>
        <div class="bg-white rounded-lg p-4 shadow-md">
            <div class="text-center">
                <p class="text-sm text-gray-500 mb-1"><?php echo get_phrase('total_subjects');?></p>
                <p class="text-3xl font-bold text-indigo-600"><?php echo $subjects_rows;?></p>
            </div>
        </div>
    </div>
</div>

<?php if($subjects_rows < 1): ?>
<div class="bg-white rounded-xl shadow-sm p-12 text-center">
    <div class="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
        <i class="entypo-info text-4xl text-red-500"></i>
    </div>
    <h3 class="text-2xl font-bold text-gray-800 mb-2"><?php echo get_phrase('no_subjects_assigned');?></h3>
    <p class="text-gray-600 mb-6"><?php echo get_phrase('you_do_not_have_any_subjects_assigned_for_this_class');?></p>
    <p class="text-sm text-gray-500"><?php echo get_phrase('please_contact_the_administrator_for_assistance');?></p>
</div>
<?php else: ?>

<div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="overflow-x-auto">
        <table class="w-full datatable" id="table_export">
            <thead class="bg-indigo-600 text-white">
                <tr>
                    <th class="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        <i class="entypo-book-open mr-2"></i><?php echo get_phrase('subject_name');?>
                    </th>
                    <th class="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        <i class="entypo-users mr-2"></i><?php echo get_phrase('class');?>
                    </th>
                    <th class="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider">
                        <i class="entypo-user mr-2"></i><?php echo get_phrase('teacher');?>
                    </th>
                    <th class="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider">
                        <i class="entypo-check mr-2"></i><?php echo get_phrase('status');?>
                    </th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
                <?php 
                $count = 1;
                foreach($subjects as $row):
                    $class = $this->db->get_where('class', array('class_id' => $row['class_id']))->result_array();
                    foreach ($class as $c):
                        $section_name = $this->db->get_where('section', array('class_id' => $c['class_id']))->row()->name;
                        $class_has_more_sections = $this->db->get_where('class', array('name' => $c['name'], 'name_numeric' => $c['name_numeric']))->num_rows();
                        $sec_name = '';
                        if($class_has_more_sections > 1) {
                            $sec_name = $section_name;
                        }
                ?>
                <tr class="hover:bg-indigo-50 transition-colors duration-150">
                    <td class="px-6 py-4">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                                <?php echo substr($row['name'], 0, 1);?>
                            </div>
                            <div class="ml-4">
                                <div class="text-sm font-semibold text-gray-900"><?php echo $row['name'];?></div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            <i class="entypo-graduation-cap mr-1"></i>
                            <?php echo $this->crud_model->get_type_name_by_id('class',$row['class_id']).' '.$c['name_numeric'].$sec_name;?>
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <a href="<?php echo site_url($account_type.'/teacher_list'); ?>" class="text-indigo-600 hover:text-indigo-900 font-medium flex items-center">
                            <i class="entypo-user mr-1"></i>
                            <?php echo $this->crud_model->get_type_name_by_id('teacher',$row['teacher_id']);?>
                        </a>
                    </td>
                    <td class="px-6 py-4 text-center">
                        <?php if($row['status'] == 1): ?>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                <?php echo get_phrase('active');?>
                            </span>
                        <?php else: ?>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                <span class="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                                <?php echo get_phrase('inactive');?>
                            </span>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php 
                    endforeach;
                endforeach;
                ?>
            </tbody>
        </table>
    </div>
</div>

<?php endif; ?>

<script type="text/javascript">
jQuery(document).ready(function($) {
    var $result = <?php echo $subjects_rows; ?>;
    if($result < 1) {
        $('#table_export').removeAttr('id');
    } else {
        $("#table_export").dataTable({
            "pageLength": 25,
            "order": [[0, "asc"]],
            "language": {
                "search": "Search subjects:",
                "lengthMenu": "Show _MENU_ subjects per page",
                "info": "Showing _START_ to _END_ of _TOTAL_ subjects",
                "infoEmpty": "No subjects available",
                "infoFiltered": "(filtered from _MAX_ total subjects)"
            }
        });
    }
    
    $(".dataTables_wrapper select").select2({
        minimumResultsForSearch: -1
    });
});
</script>

<style>
/* Teacher Subjects — unified enterprise scale */
body { background: #f8fafc; }
.teacher-subject-workspace-head {
    margin: 0 0 18px !important; padding: 20px 24px !important;
    border: 1px solid #e2e8f0; border-radius: 14px !important;
    background: #fff !important; box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.teacher-subject-workspace-head > .flex { gap: 18px; }
.teacher-subject-workspace-head h2 {
    margin-bottom: 4px !important; color: #0f172a !important;
    font-size: 28px !important; line-height: 1.2; font-weight: 800 !important; letter-spacing: -.02em;
}
.teacher-subject-workspace-head p { color: #64748b !important; font-size: 14px !important; line-height: 1.5; }
.teacher-subject-workspace-head .bg-white {
    min-width: 120px; padding: 12px 16px !important; border: 1px solid #e2e8f0;
    box-shadow: none !important;
}
.teacher-subject-workspace-head .bg-white .text-sm { font-size: 13px !important; }
.teacher-subject-workspace-head .bg-white .text-3xl { font-size: 24px !important; line-height: 1.2; }

.teacher-subject-workspace-head + .bg-white,
.teacher-subject-workspace-head ~ .bg-white.rounded-xl {
    border: 1px solid #e2e8f0; border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.teacher-subject-workspace-head ~ .bg-white.rounded-xl .overflow-x-auto { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.teacher-subject-workspace-head ~ .bg-white.rounded-xl table { min-width: 820px; }
.teacher-subject-workspace-head ~ .bg-white.rounded-xl thead {
    background: #0f172a !important; color: #fff;
}
.teacher-subject-workspace-head ~ .bg-white.rounded-xl thead th {
    padding: 12px 13px !important; font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
}
.teacher-subject-workspace-head ~ .bg-white.rounded-xl tbody td {
    padding: 12px 13px !important; color: #334155; font-size: 14px !important; line-height: 1.45;
}
.teacher-subject-workspace-head ~ .bg-white.rounded-xl tbody tr:hover { background: #f8fbff !important; }
.teacher-subject-workspace-head ~ .bg-white.rounded-xl tbody .h-10.w-10 {
    width: 38px !important; height: 38px !important; border-radius: 9px !important;
}
.teacher-subject-workspace-head ~ .bg-white.rounded-xl tbody .text-sm { font-size: 14px !important; line-height: 1.4 !important; }
.teacher-subject-workspace-head ~ .bg-white.rounded-xl tbody .text-xs { font-size: 13px !important; line-height: 1.35 !important; }
.teacher-subject-workspace-head ~ .bg-white.rounded-xl tbody span.rounded-full {
    min-height: 30px; padding: 6px 10px !important; display: inline-flex; align-items: center;
    font-size: 13px !important; font-weight: 700 !important;
}

.dataTables_wrapper { padding: 14px; }
.dataTables_wrapper .dataTables_filter,
.dataTables_wrapper .dataTables_length,
.dataTables_wrapper .dataTables_info,
.dataTables_wrapper .dataTables_paginate { color: #475569; font-size: 14px; }
.dataTables_wrapper .dataTables_filter input,
.dataTables_wrapper .dataTables_length select {
    min-height: 40px; border: 1px solid #cbd5e1 !important; border-radius: 8px !important;
    padding: 8px 10px !important; font-size: 14px; background: #fff; color: #0f172a;
}
.dataTables_wrapper .dataTables_filter input:focus,
.dataTables_wrapper .dataTables_length select:focus {
    border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}
.dataTables_wrapper .dataTables_paginate .paginate_button {
    min-height: 36px; min-width: 36px; padding: 7px 10px !important; margin: 0 2px !important;
    border-radius: 7px !important; border: 1px solid #e2e8f0 !important;
    background: #fff !important; color: #475569 !important; font-size: 13px;
}
.dataTables_wrapper .dataTables_paginate .paginate_button:hover,
.dataTables_wrapper .dataTables_paginate .paginate_button.current {
    background: #2563eb !important; color: #fff !important; border-color: #2563eb !important;
}

@media (max-width: 767px) {
    .teacher-subject-workspace-head { padding: 18px 16px !important; }
    .teacher-subject-workspace-head > .flex { align-items: flex-start !important; flex-direction: column !important; }
    .teacher-subject-workspace-head h2 { font-size: 24px !important; }
    .teacher-subject-workspace-head .bg-white { width: 100%; }
}
</style>

<style>
.dataTables_wrapper .dataTables_paginate .paginate_button {
    padding: 0.5rem 1rem;
    margin: 0 0.25rem;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    background: white;
    color: #4b5563;
    transition: all 0.2s;
}

.dataTables_wrapper .dataTables_paginate .paginate_button:hover {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
}

.dataTables_wrapper .dataTables_paginate .paginate_button.current {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
}

.dataTables_wrapper .dataTables_filter input {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    margin-left: 0.5rem;
}

.dataTables_wrapper .dataTables_length select {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 0.5rem 2rem 0.5rem 1rem;
}
</style>
