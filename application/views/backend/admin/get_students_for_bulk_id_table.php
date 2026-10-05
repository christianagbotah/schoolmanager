<?php
$class_ids = $this->db->get_where('enroll', array('class_id' => $class_id, 'mute' => '0', 'year' => $year))->result_array();
$class_row = $this->db->get_where('class', array('class_id' => $class_id))->row();
$class_label = $class_row ? trim($class_row->name . ' ' . $class_row->name_numeric) : get_phrase('selected_class');
?>

<style>
.bulk-id-results .bir-summary {
    position:sticky; top:0; z-index:8; display:flex; align-items:center; justify-content:space-between; gap:14px;
    padding:14px 16px; margin:-2px 0 16px; background:#f8fafc; border:1px solid #e5e7eb; border-radius:12px;
}
.bulk-id-results .bir-summary h3 { margin:0; color:#172033; font-size:17px; font-weight:700; }
.bulk-id-results .bir-summary p { margin:4px 0 0; color:#667085; font-size:13px; }
.bulk-id-results .bir-counter {
    min-width:155px; min-height:42px; display:flex; align-items:center; justify-content:center; gap:7px;
    border-radius:10px; padding:8px 12px; background:#fff; border:1px solid #d0d5dd; color:#344054; font-size:14px; font-weight:700;
}
.bulk-id-results .bir-counter.is-limit { background:#fff7ed; border-color:#fdba74; color:#9a3412; }
.bulk-id-results .bir-table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
.bulk-id-results #id_table { width:100% !important; min-width:650px; }
.bulk-id-results #id_table thead th {
    background:#f8fafc; color:#475467; border-color:#e5e7eb; padding:12px 10px; font-size:13px; font-weight:700; vertical-align:middle;
}
.bulk-id-results #id_table tbody td { padding:11px 10px; border-color:#e5e7eb; color:#344054; font-size:14px; vertical-align:middle; }
.bulk-id-results #id_table tbody tr:hover { background:#f9fbfd; }
.bulk-id-results .bir-student-label { margin:0; color:#172033; font-size:14px; font-weight:600; cursor:pointer; }
.bulk-id-results .bir-check { width:21px; height:21px; margin:0; cursor:pointer; accent-color:#2563eb; }
.bulk-id-results .bir-check:disabled { cursor:not-allowed; opacity:.45; }
.bulk-id-results .bir-actions { display:flex; justify-content:center; padding:18px 0 2px; }
.bulk-id-results .bir-print-btn {
    min-height:44px; padding:10px 18px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    border-radius:10px; border:1px solid #059669; background:#059669; color:#fff; font-size:14px; font-weight:700;
}
.bulk-id-results .bir-print-btn:hover, .bulk-id-results .bir-print-btn:focus { background:#047857; border-color:#047857; color:#fff; }
.bulk-id-results .bir-print-btn:disabled { opacity:.55; cursor:not-allowed; }
.bulk-id-results .bir-empty { padding:42px 20px; text-align:center; border:1px dashed #d0d5dd; border-radius:12px; background:#f8fafc; color:#667085; }
.bulk-id-results .bir-empty i { display:block; margin-bottom:10px; color:#98a2b3; font-size:34px; }
.bulk-id-results .dataTables_wrapper .dataTables_filter input,
.bulk-id-results .dataTables_wrapper .dataTables_length select { min-height:38px; border:1.5px solid #e5e7eb; border-radius:9px; padding:6px 9px; }
@media (max-width:767px) {
    .bulk-id-results .bir-summary { align-items:flex-start; flex-direction:column; }
    .bulk-id-results .bir-counter { width:100%; justify-content:flex-start; }
    .bulk-id-results .bir-print-btn { width:100%; }
}
</style>

<div class="bulk-id-results">
    <div class="bir-summary">
        <div>
            <h3><?php echo get_phrase('students_of'); ?> <?php echo htmlspecialchars($class_label, ENT_QUOTES, 'UTF-8'); ?></h3>
            <p><?php echo htmlspecialchars($year, ENT_QUOTES, 'UTF-8'); ?> · Select up to six students for the next A4 print sheet.</p>
        </div>
        <div class="bir-counter" id="bulkSelectionCounter"><i class="fa fa-check-square"></i><span id="bulkSelectionText">0 of 6 selected</span></div>
    </div>

    <?php if (!empty($class_ids)): ?>
        <div class="bir-table-wrap">
            <table class="table table-bordered table-hover" id="id_table">
                <thead>
                    <tr>
                        <th style="width:70px;">#</th>
                        <th style="width:160px;">ID No.</th>
                        <th><?php echo get_phrase('student_name'); ?></th>
                        <th style="width:130px; text-align:center;"><?php echo get_phrase('selection'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php $i = 1; foreach ($class_ids as $cl_id):
                        $student_row = $this->db->get_where('student', array('student_id' => $cl_id['student_id']))->row();
                        if (!$student_row) continue;
                    ?>
                        <tr>
                            <td><?php echo $i; ?></td>
                            <td><?php echo htmlspecialchars($student_row->student_code, ENT_QUOTES, 'UTF-8'); ?></td>
                            <td><label class="bir-student-label" for="bulk_ids_<?php echo (int) $cl_id['student_id']; ?>"><?php echo htmlspecialchars($student_row->name, ENT_QUOTES, 'UTF-8'); ?></label></td>
                            <td style="text-align:center;">
                                <input type="checkbox" name="bulk_ids[]" value="<?php echo (int) $cl_id['student_id']; ?>"
                                       id="bulk_ids_<?php echo (int) $cl_id['student_id']; ?>" class="bir-check bulk-id-checkbox">
                            </td>
                        </tr>
                    <?php $i++; endforeach; ?>
                </tbody>
            </table>
        </div>

        <div class="bir-actions">
            <button type="submit" id="submit" class="bir-print-btn" disabled>
                <i class="entypo-print"></i><?php echo get_phrase('print_iDs_for_the_selected_students'); ?>
            </button>
        </div>
    <?php else: ?>
        <div class="bir-empty">
            <i class="fa fa-users"></i>
            <strong><?php echo get_phrase('no_record_found'); ?></strong>
            <div>No active students were found in this class for the selected academic year.</div>
        </div>
    <?php endif; ?>
</div>

<script type="text/javascript">
(function($) {
    var maximumSelection = 6;

    if ($.fn.DataTable && $('#id_table').length) {
        $('#id_table').DataTable({
            paging: false,
            info: false,
            autoWidth: false,
            order: [[2, 'asc']]
        });
    }

    function selectedCount() {
        return $('.bulk-id-checkbox:checked').length;
    }

    function updateSelectionState() {
        var count = selectedCount();
        var atLimit = count >= maximumSelection;
        $('#bulkSelectionText').text(count + ' of ' + maximumSelection + ' selected');
        $('#bulkSelectionCounter').toggleClass('is-limit', atLimit);
        $('.bulk-id-checkbox:not(:checked)').prop('disabled', atLimit);
        $('#submit').prop('disabled', count === 0);
    }

    $(document).off('change.bulkStudentIds', '.bulk-id-checkbox').on('change.bulkStudentIds', '.bulk-id-checkbox', function() {
        var count = selectedCount();
        if (count > maximumSelection) {
            $(this).prop('checked', false);
            toastr.error('<?php echo get_phrase("you_have_reached_the_maximum_selection_of_six_(6)_students._please_print_these_before_you_proceed."); ?>');
        } else if (count === maximumSelection) {
            toastr.info('<?php echo get_phrase("you_have_reached_the_maximum_selection_of_six_(6)_students._please_print_these_before_you_proceed."); ?>');
        }
        updateSelectionState();
    });

    $('#checkboxes_form').off('submit.bulkStudentIds').on('submit.bulkStudentIds', function(event) {
        var count = selectedCount();
        if (count === 0) {
            event.preventDefault();
            toastr.error('<?php echo get_phrase("no_student_was_selected!"); ?>');
            updateSelectionState();
            return false;
        }
        if (count > maximumSelection) {
            event.preventDefault();
            toastr.error('<?php echo get_phrase("you_have_reached_the_maximum_selection_of_six_(6)_students._please_print_these_before_you_proceed."); ?>');
            return false;
        }
    });

    updateSelectionState();
})(jQuery);
</script>
