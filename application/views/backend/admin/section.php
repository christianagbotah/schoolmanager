<style>
/* Direct UX refinement — Sections workspace */
.section-workspace { padding: 24px 28px 40px !important; }
.section-workspace > .mb-6.flex {
    margin-bottom: 18px !important; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
    align-items: flex-end !important;
}
.section-workspace > .mb-6.flex h2 {
    margin: 0; color: #0f172a !important; font-size: 30px !important; line-height: 1.2;
    font-weight: 800 !important; letter-spacing: -.02em;
}
.section-workspace > .mb-6.flex button {
    min-height: 42px; padding: 9px 16px !important; border-radius: 9px !important;
    font-size: 14px !important; font-weight: 700 !important;
}
.section-workspace > .grid { gap: 18px !important; }
.section-workspace .lg\:col-span-1 > div,
.section-workspace .lg\:col-span-3 > div {
    border-radius: 14px !important; border-color: #e2e8f0 !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.04) !important;
}
.section-workspace .lg\:col-span-1 > div { padding: 14px !important; }
.section-workspace h3 { font-size: 16px !important; font-weight: 800 !important; color: #0f172a !important; }
.section-workspace .class-link {
    min-height: 42px; padding: 9px 11px !important; border-radius: 9px !important;
    font-size: 14px; line-height: 1.4;
}
.section-workspace .class-link.bg-blue-600 { background: #2563eb !important; color: #fff !important; }
.section-workspace .lg\:col-span-3 > div > .p-4.sm\:p-6 {
    padding: 15px 18px !important; border-bottom-color: #eef2f7 !important;
}
#sections-content { padding: 0 !important; overflow-x: auto; -webkit-overflow-scrolling: touch; }
#sections-content table { min-width: 760px; width: 100%; }
#sections-content thead th {
    padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
    font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
}
#sections-content tbody td { padding: 12px 13px !important; color: #334155; font-size: 14px; line-height: 1.45; }
#sections-content tbody tr:hover td { background: #f8fbff; }
#sections-content .dropdown > button {
    width: 40px; height: 40px; min-height: 40px; padding: 0 !important;
    display: inline-flex; align-items: center; justify-content: center; font-size: 18px !important;
}
#sections-content .dropdown-menu { font-size: 14px !important; min-width: 150px !important; }
#sections-content .dropdown-menu a { min-height: 38px; padding: 9px 13px !important; display: flex; align-items: center; gap: 7px; }
.loader-spinner { width: 30px; height: 30px; border-width: 3px; }

@media (max-width: 991px) {
    .section-workspace > .grid { grid-template-columns: 1fr !important; }
    .section-workspace .lg\:col-span-1 ul {
        display: flex; gap: 7px; overflow-x: auto; padding-bottom: 4px;
    }
    .section-workspace .lg\:col-span-1 li { min-width: max-content; }
}
@media (max-width: 767px) {
    .section-workspace { padding: 18px 14px 32px !important; }
    .section-workspace > .mb-6.flex { align-items: flex-start !important; flex-direction: column; gap: 12px; }
    .section-workspace > .mb-6.flex h2 { font-size: 26px !important; }
    .section-workspace > .mb-6.flex button { width: 100%; justify-content: center; }
}
</style>

<div class="p-4 sm:p-6 section-workspace">
    <div class="mb-6 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900"><?php echo get_phrase('manage_sections');?></h2>
        <button onclick="showAjaxModal('<?php echo site_url('modal/popup/section_add/');?>')" class="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-semibold rounded-lg text-base px-5 py-3">
            <i class="entypo-plus-circled"></i>
            <?php echo get_phrase('add_new_section');?>
        </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Class List Sidebar -->
        <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-4"><?php echo get_phrase('classes');?></h3>
                <ul class="space-y-2">
                    <?php 
                        $classes = $this->db->get('class')->result_array();
                        foreach ($classes as $row):
                    ?>
                        <li>
                            <a href="javascript:void(0)" onclick="loadSections(<?php echo $row['class_id'];?>)" 
                               class="class-link flex items-center gap-2 px-4 py-3 rounded-lg transition-all <?php if ($row['class_id'] == $class_id) echo 'bg-blue-600 text-gray-100 font-semibold'; else echo 'text-gray-900 hover:bg-gray-100';?>" 
                               data-class-id="<?php echo $row['class_id'];?>">
                                <i class="entypo-dot"></i>
                                <span class="font-medium"><?php echo $row['name'].' '.$row['name_numeric'];?></span>
                            </a>
                        </li>
                    <?php endforeach;?>
                </ul>
            </div>
        </div>

        <!-- Sections Content -->
        <div class="lg:col-span-3">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200">
                <div class="p-4 sm:p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <i class="entypo-list text-blue-600"></i>
                        <span id="section-title"><?php echo get_phrase('sections');?></span>
                    </h3>
                </div>
                <div class="p-4 sm:p-6" id="sections-content">
                    <table class="w-full text-left text-gray-500">
                        <thead class="text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th class="px-4 py-3">#</th>
                                <th class="px-4 py-3"><?php echo get_phrase('section_name');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('nick_name');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('teacher');?></th>
                                <th class="px-4 py-3"><?php echo get_phrase('options');?></th>
                            </tr>
                        </thead>
                        <tbody id="sections-tbody">
                            <?php
                                $count = 1;
                                $sections = $this->db->get_where('section', array('class_id' => $class_id))->result_array();
                                foreach ($sections as $row):
                            ?>
                                <tr class="bg-white border-b hover:bg-gray-50">
                                    <td class="px-4 py-3"><?php echo $count++;?></td>
                                    <td class="px-4 py-3 font-medium text-gray-900"><?php echo $row['name'];?></td>
                                    <td class="px-4 py-3"><?php echo $row['nick_name'];?></td>
                                    <td class="px-4 py-3">
                                        <?php 
                                            if ($row['teacher_id'] != '' && $row['teacher_id'] != 0) {
                                                $teacher = $this->db->get_where('teacher', array('teacher_id' => $row['teacher_id']))->row();
                                                if($teacher) echo $teacher->name;
                                            }
                                        ?>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="dropdown">
                                            <button class="inline-flex items-center p-2.5 text-xl font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700" type="button" data-toggle="dropdown">
                                                <i class="entypo-dot-3"></i>
                                            </button>
                                            <ul class="dropdown-menu dropdown-menu-right" style="font-size: 15px; min-width: 120px;">
                                                <li>
                                                    <a href="javascript:void(0)" onclick="showAjaxModal('<?php echo site_url('modal/popup/section_edit/'.$row['section_id']);?>')" style="color: #3c763d;">
                                                        <i class="entypo-pencil"></i> <?php echo get_phrase('edit');?>
                                                    </a>
                                                </li>
                                                <li>
                                                    <a href="javascript:void(0)" onclick="confirmDelete(<?php echo $row['section_id'];?>)" style="color: #d9534f;">
                                                        <i class="entypo-trash"></i> <?php echo get_phrase('delete');?>
                                                    </a>
                                                </li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach;?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function loadSections(classId) {
    $('.class-link').each(function() {
        $(this).removeClass('bg-blue-600 text-gray-100 font-semibold').addClass('text-gray-900');
    });
    $('[data-class-id="'+classId+'"]').removeClass('text-gray-900').addClass('bg-blue-600 text-gray-100 font-semibold');
    
    $('#sections-tbody').html('<tr><td colspan="5" class="text-center py-8"><div class="loader-spinner mx-auto"></div></td></tr>');
    
    $.ajax({
        url: '<?php echo site_url('admin/get_sections_ajax/');?>' + classId,
        type: 'GET',
        dataType: 'json'
    }).done(function(response) {
        if(response.status === 'success') {
            $('#sections-tbody').html(response.html);
            $('.dropdown-toggle').dropdown();
        } else {
            $('#sections-tbody').html('<tr><td colspan="5" class="text-center py-8 text-red-600">'+response.message+'</td></tr>');
        }
    }).fail(function() {
        $('#sections-tbody').html('<tr><td colspan="5" class="text-center py-8 text-red-600"><?php echo get_phrase('an_error_occurred');?></td></tr>');
    });
}

function confirmDelete(sectionId) {
    showConfirmModal(
        '<?php echo get_phrase('confirm_delete');?>',
        '<?php echo get_phrase('are_you_sure_delete');?>',
        function() {
            showAjaxModal_alert('<?php echo get_phrase("deleting");?>...', 'loading');
            $.ajax({
                url: '<?php echo site_url('admin/sections/delete/');?>' + sectionId,
                type: 'GET',
                dataType: 'json'
            }).done(function(response) {
                if(response.message === 'done') {
                    showAjaxModal_alert('<?php echo get_phrase('data_deleted');?>', 'success');
                    setTimeout(() => location.reload(), 2000);
                } else {
                    showAjaxModal_alert('<?php echo get_phrase('delete_failed');?>', 'error');
                }
            }).fail(function() {
                showAjaxModal_alert('<?php echo get_phrase('an_error_occurred');?>', 'error');
            });
        },
        '<?php echo get_phrase('delete');?>',
        'danger'
    );
}

$(document).ready(function() {
    $('.dropdown-toggle').dropdown();
});
</script>
