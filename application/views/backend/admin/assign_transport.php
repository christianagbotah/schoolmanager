<style>
/* Direct UI/UX rebuild — Transport Assignment */
.assign-transport-page {
    margin: 0 !important;
    padding: 0 0 32px;
    background: #f8fafc;
    min-height: 100%;
}
.assign-transport-page > div:first-of-type {
    margin: 0 0 18px !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}
.assign-header {
    padding: 0 0 18px !important;
    border-bottom: 1px solid #e2e8f0;
    border-radius: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}
.assign-header h2 {
    margin: 0;
    color: #0f172a !important;
    font-size: 24px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.assign-header h2 i { margin-right: 7px; color: #2563eb; }
.sticky-wrapper {
    position: sticky;
    top: calc(var(--sm-topbar-height-dynamic, 72px) + 8px);
    z-index: 50;
    margin: 0 0 16px;
    padding: 14px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: rgba(255,255,255,.97);
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
    backdrop-filter: blur(8px);
}
.sticky-wrapper.scrolled { box-shadow: 0 8px 22px rgba(15,23,42,.1); }
.assign-controls {
    display: grid;
    grid-template-columns: minmax(220px,.8fr) minmax(280px,1.35fr) auto;
    gap: 10px;
    align-items: end;
}
.assign-controls select,
#student_search {
    width: 100%;
    min-width: 0 !important;
    height: var(--sm-ui-control-height, 42px);
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff;
    color: #0f172a;
    font-size: 14px !important;
    line-height: 1.35;
    transition: border-color .2s ease, box-shadow .2s ease;
}
.assign-controls select:focus,
#student_search:focus {
    border-color: #2563eb !important;
    outline: 0;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
}
.action-button {
    min-height: var(--sm-ui-control-height, 42px);
    padding: 9px 15px !important;
    border: 1px solid #2563eb !important;
    border-radius: 9px;
    background: #2563eb !important;
    color: #fff !important;
    box-shadow: none !important;
    font-size: 14px;
    line-height: 1.35;
    font-weight: 800;
    white-space: nowrap;
    cursor: pointer;
}
.action-button:hover { background: #1d4ed8 !important; transform: none; box-shadow: none !important; }
.action-button:disabled { opacity: .5; cursor: not-allowed; }
.assign-transport-page > div[style*="background: white"][style*="padding: 20px"] {
    overflow-x: auto;
    margin-top: 0 !important;
    padding: 0 !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px !important;
    background: #fff !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
#assign_transport_table {
    width: 100% !important;
    min-width: 900px;
    margin: 0 !important;
    border: 0 !important;
}
#assign_transport_table thead th {
    padding: 12px 13px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    text-transform: uppercase;
}
#assign_transport_table tbody td {
    padding: 12px 13px !important;
    border-bottom: 1px solid #eef2f7 !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle;
}
#assign_transport_table tbody tr { background: #fff; cursor: pointer; }
#assign_transport_table tbody tr:hover { background: #f8fbff !important; box-shadow: none; }
#assign_transport_table tbody tr.selected { background: #eff6ff !important; }
#assign_transport_table input[type="checkbox"] { accent-color: #2563eb; }
.assign-transport-page .dataTables_wrapper { min-width: 900px; padding: 14px; }
.assign-transport-page .dataTables_filter { display: none; }
.assign-transport-page .dataTables_length,
.assign-transport-page .dataTables_info,
.assign-transport-page .dataTables_paginate { color: #475569; font-size: 14px; }
.assign-transport-page .dataTables_length select {
    min-height: 40px;
    padding: 7px 9px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    font-size: 14px;
}
@media (max-width: 900px) {
    .assign-controls { grid-template-columns: 1fr 1fr; }
    .assign-controls .action-button { grid-column: 1 / -1; }
}
@media (max-width: 767px) {
    .assign-transport-page { padding: 0 0 28px; }
    .assign-header h2 { font-size: 22px; }
    .sticky-wrapper { position: static; padding: 12px; }
    .assign-controls { grid-template-columns: 1fr; }
    .assign-controls .action-button { grid-column: auto; width: 100%; }
    #student_search, .assign-controls select { font-size: 16px !important; }
}
</style>

<div class="assign-transport-page">
    <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <div class="assign-header">
            <h2><i class="fa fa-user-plus"></i> <?php echo get_phrase('assign_transport_to_students'); ?></h2>
        </div>
    </div>
    
    <!-- Sticky Controls Bar -->
    <div class="sticky-wrapper">
        <?php echo form_open('', array('id' => 'bulk_assign_form')); ?>
        <div class="assign-controls">
            <select name="transport_id" id="bulk_transport_id">
                <option value="">-- <?php echo get_phrase('select_route'); ?> --</option>
                <option value="0" style="color: #dc2626; font-weight: 600;"><?php echo get_phrase('unassign_transport'); ?></option>
                <?php foreach ($transports as $transport): ?>
                <option value="<?php echo $transport['transport_id']; ?>">
                    <?php echo $transport['route_name']; ?>
                </option>
                <?php endforeach; ?>
            </select>
            
            <input type="text" id="student_search" placeholder="<?php echo get_phrase('search_student_name_or_code'); ?>">
            
            <button type="submit" id="bulk_assign_btn" disabled class="action-button" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                <i class="fa fa-check"></i> <?php echo get_phrase('assign_selected'); ?>
            </button>
        </div>
        <?php echo form_close(); ?>
    </div>
    
    <!-- Table container -->
    <div style="background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 20px; margin-top: 20px;">
        <table id="assign_transport_table" class="table table-bordered" style="width:100%; margin-bottom: 0;">
            <thead>
                <tr>
                    <th style="width: 50px; text-align: center;">
                        <input id="select_all_checkbox" type="checkbox" style="width: 18px; height: 18px; cursor: pointer;">
                    </th>
                    <th style="width: 120px;"><?php echo get_phrase('student_code'); ?></th>
                    <th><?php echo get_phrase('name'); ?></th>
                    <th style="width: 150px;"><?php echo get_phrase('class'); ?></th>
                    <th style="width: 200px;"><?php echo get_phrase('current_transport'); ?></th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
</div>

<script>
$(document).ready(function() {
    // Store selected student IDs across pagination
    var selectedStudents = new Set();
    
    // Add scroll effect for sticky controls
    $(window).on('scroll', function() {
        if ($(window).scrollTop() > 100) {
            $('.sticky-wrapper').addClass('scrolled');
        } else {
            $('.sticky-wrapper').removeClass('scrolled');
        }
    });
    
    var table = $('#assign_transport_table').DataTable({
        ajax: {
            url: '<?php echo site_url("admin/get_assign_transport_students"); ?>',
            dataSrc: 'data'
        },
        columns: [
            {
                data: null,
                orderable: false,
                className: 'text-center',
                render: function(data) {
                    var checked = selectedStudents.has(data.student_id) ? 'checked' : '';
                    return '<input type="checkbox" class="student_checkbox" name="student_ids[]" value="' + data.student_id + '" form="bulk_assign_form" style="width: 18px; height: 18px; cursor: pointer;" ' + checked + '>';
                }
            },
            {
                data: 'student_code',
                className: 'font-semibold'
            },
            {
                data: 'name'
            },
            {
                data: 'class'
            },
            {
                data: 'current_transport',
                render: function(data) {
                    return data ? '<span style="background: #dbeafe; color: #1e40af; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">' + data + '</span>' : '<span style="background: #f3f4f6; color: #6b7280; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;"><?php echo get_phrase('not_assigned'); ?></span>';
                }
            }
        ],
        pageLength: 25,
        lengthMenu: [[25, 50, 100, 500, -1], [25, 50, 100, 500, "<?php echo get_phrase('all'); ?>"]],
        order: [[2, 'asc']],
        language: {
            search: "<?php echo get_phrase('search'); ?>:",
            lengthMenu: "<?php echo get_phrase('show'); ?> _MENU_ <?php echo get_phrase('entries'); ?>",
            info: "<?php echo get_phrase('showing'); ?> _START_ <?php echo get_phrase('to'); ?> _END_ <?php echo get_phrase('of'); ?> _TOTAL_ <?php echo get_phrase('entries'); ?>",
            paginate: {
                first: "<?php echo get_phrase('first'); ?>",
                last: "<?php echo get_phrase('last'); ?>",
                next: "<?php echo get_phrase('next'); ?>",
                previous: "<?php echo get_phrase('previous'); ?>"
            }
        },
        drawCallback: function() {
            // After table is drawn, restore selected state for visible rows
            $('.student_checkbox').each(function() {
                var studentId = parseInt($(this).val());
                if (selectedStudents.has(studentId)) {
                    $(this).prop('checked', true).closest('tr').addClass('selected');
                }
            });
            updateSelectAllCheckbox();
            updateBulkButton();
        }
    });

    // Select all visible on current page
    $('#select_all_checkbox').on('change', function() {
        var isChecked = this.checked;
        $('.student_checkbox:visible').each(function() {
            var studentId = parseInt($(this).val());
            $(this).prop('checked', isChecked).closest('tr').toggleClass('selected', isChecked);
            if (isChecked) {
                selectedStudents.add(studentId);
            } else {
                selectedStudents.delete(studentId);
            }
        });
        updateBulkButton();
    });

    // Custom search input
    $('#student_search').on('keyup', function() {
        table.search(this.value).draw();
    });
    
    // Add focus style to search input
    $('#student_search').on('focus', function() {
        $(this).css({
            'border-color': '#3b82f6',
            'box-shadow': '0 0 0 3px rgba(59,130,246,0.1)'
        });
    }).on('blur', function() {
        $(this).css({
            'border-color': '#e5e7eb',
            'box-shadow': 'none'
        });
    });

    // Handle individual checkbox change
    $('#assign_transport_table').on('change', '.student_checkbox', function() {
        var studentId = parseInt($(this).val());
        var isChecked = this.checked;
        
        $(this).closest('tr').toggleClass('selected', isChecked);
        
        if (isChecked) {
            selectedStudents.add(studentId);
        } else {
            selectedStudents.delete(studentId);
        }
        
        updateSelectAllCheckbox();
        updateBulkButton();
    });

    // Handle row click
    $('#assign_transport_table').on('click', 'tbody tr', function(e) {
        if (!$(e.target).is('input[type="checkbox"]')) {
            var checkbox = $(this).find('.student_checkbox');
            checkbox.prop('checked', !checkbox.prop('checked')).trigger('change');
        }
    });

    function updateSelectAllCheckbox() {
        var totalVisible = $('.student_checkbox:visible').length;
        var totalCheckedVisible = $('.student_checkbox:visible:checked').length;
        $('#select_all_checkbox').prop('checked', totalVisible === totalCheckedVisible && totalVisible > 0);
    }

    function updateBulkButton() {
        var checkedCount = selectedStudents.size;
        if (checkedCount > 0) {
            $('#bulk_assign_btn').prop('disabled', false).removeClass('opacity-50').addClass('shadow-lg');
            $('#bulk_assign_btn').html('<i class="entypo-check"></i> <?php echo get_phrase('assign'); ?> ' + checkedCount + ' <?php echo get_phrase('student'); ?>(s)');
        } else {
            $('#bulk_assign_btn').prop('disabled', true).addClass('opacity-50').removeClass('shadow-lg');
            $('#bulk_assign_btn').html('<i class="entypo-check"></i> <?php echo get_phrase('assign_selected'); ?>');
        }
    }

    $('#bulk_assign_form').on('submit', function(e) {
        e.preventDefault();
        
        if (selectedStudents.size === 0) {
            showAjaxModal_alert('<?php echo get_phrase('please_select_at_least_one_student'); ?>', 'error');
            return false;
        }
        var transport = $('#bulk_transport_id').val();
        if (transport === '') {
            showAjaxModal_alert('<?php echo get_phrase('please_select_transport_route'); ?>', 'error');
            return false;
        }
        
        showAjaxModal_alert('<?php echo get_phrase('assigning_transport_please_wait'); ?>...', 'loading');
        
        // Build form data with CSRF token
        var formData = new FormData();
        
        // Add CSRF token (CodeIgniter csrf token)
        var csrfName = '<?php echo $this->security->get_csrf_token_name(); ?>';
        var csrfHash = '<?php echo $this->security->get_csrf_hash(); ?>';
        formData.append(csrfName, csrfHash);
        
        // Add student IDs
        var studentIdsArray = Array.from(selectedStudents);
        studentIdsArray.forEach(function(id) {
            formData.append('student_ids[]', id);
        });
        
        // Add transport ID
        formData.append('transport_id', transport);
        
        $.ajax({
            url: '<?php echo site_url("admin/assign_transport/create"); ?>',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json'
        }).done(function(response) {
            if (response.status === 'success') {
                // Reload table without page refresh
                table.ajax.reload(null, false);
                // Reset form and selections
                $('#bulk_transport_id').val('');
                selectedStudents.clear();
                $('.student_checkbox:visible').prop('checked', false).closest('tr').removeClass('selected');
                $('#select_all_checkbox').prop('checked', false);
                updateBulkButton();
                // Show success message
                showAjaxModal_alert(response.message + ' (' + response.count + ' students)', 'success', false);
            } else {
                showAjaxModal_alert(response.message || 'An error occurred', 'error');
            }
        }).fail(function(xhr, status, error) {
            console.error('Error:', xhr.responseText);
            showAjaxModal_alert('Failed to assign transport. Please try again. ' + error, 'error');
        });
    });
});
</script>