<?php
$running_year_query = $this->db->get_where('settings', array('type' => 'running_year'));
$running_year = $running_year_query->num_rows() > 0 ? $running_year_query->row()->description : '';
?>

<style>
.bulk-id-page { --bi-border:#e5e7eb; --bi-text:#172033; --bi-muted:#667085; }
.bulk-id-page .bi-hero,
.bulk-id-page .bi-filter-card,
.bulk-id-page .bi-holder-card {
    background:#fff;
    border:1px solid var(--bi-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.bulk-id-page .bi-hero { padding:24px; margin-bottom:18px; }
.bulk-id-page .bi-hero-row { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; }
.bulk-id-page .bi-title-wrap { display:flex; gap:14px; align-items:flex-start; }
.bulk-id-page .bi-icon {
    width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center;
    border-radius:14px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:22px;
}
.bulk-id-page .bi-title { margin:0; color:var(--bi-text); font-size:26px; line-height:1.2; font-weight:700; }
.bulk-id-page .bi-subtitle { margin:6px 0 0; color:var(--bi-muted); font-size:15px; line-height:1.55; max-width:840px; }
.bulk-id-page .bi-limit {
    min-width:124px; padding:11px 14px; border-radius:12px; text-align:center;
    background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; font-size:13px; font-weight:700;
}
.bulk-id-page .bi-limit strong { display:block; font-size:24px; line-height:1; margin-bottom:4px; }
.bulk-id-page .bi-filter-card { padding:18px; margin-bottom:18px; }
.bulk-id-page .bi-filter-grid { display:grid; grid-template-columns:minmax(190px,1fr) minmax(250px,1.45fr) auto; gap:14px; align-items:end; }
.bulk-id-page .bi-field label { display:block; margin:0 0 7px; color:#344054; font-size:14px; font-weight:700; }
.bulk-id-page .bi-field .form-control,
.bulk-id-page .bi-field select { height:44px; border:1.5px solid var(--bi-border); border-radius:10px; font-size:14px; background:#fff; }
.bulk-id-page .bi-field .form-control:focus,
.bulk-id-page .bi-field select:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); outline:none; }
.bulk-id-page .bi-load-btn {
    height:44px; padding:0 18px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    border:1px solid #2563eb; border-radius:10px; background:#2563eb; color:#fff; font-size:14px; font-weight:700; white-space:nowrap;
}
.bulk-id-page .bi-load-btn:hover, .bulk-id-page .bi-load-btn:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
.bulk-id-page .bi-holder-card { display:none; padding:18px; }
.bulk-id-page .bi-holder-card.has-content { display:block; }
.bulk-id-page .bi-loading { padding:34px 20px; text-align:center; color:var(--bi-muted); font-size:14px; }
.bulk-id-page .bi-loading i { margin-right:7px; }
@media (max-width:900px) {
    .bulk-id-page .bi-filter-grid { grid-template-columns:1fr 1fr; }
    .bulk-id-page .bi-load-btn { width:100%; grid-column:1 / -1; }
}
@media (max-width:767px) {
    .bulk-id-page .bi-hero { padding:18px; }
    .bulk-id-page .bi-hero-row { flex-direction:column; }
    .bulk-id-page .bi-title { font-size:22px; }
    .bulk-id-page .bi-limit { width:100%; text-align:left; }
    .bulk-id-page .bi-filter-grid { grid-template-columns:1fr; }
    .bulk-id-page .bi-load-btn { grid-column:auto; }
}
</style>

<div class="bulk-id-page">
    <section class="bi-hero" aria-labelledby="bulkIdTitle">
        <div class="bi-hero-row">
            <div class="bi-title-wrap">
                <div class="bi-icon" aria-hidden="true"><i class="fa fa-id-card"></i></div>
                <div>
                    <h2 class="bi-title" id="bulkIdTitle"><?php echo get_phrase('bulk_student_iD_cards'); ?></h2>
                    <p class="bi-subtitle">Choose an academic year and class, then select up to six students per print batch. The six-card limit preserves the A4 ID-card layout.</p>
                </div>
            </div>
            <div class="bi-limit"><strong>6</strong>students per sheet</div>
        </div>
    </section>

    <?php echo form_open(site_url('admin/bulk_student_id/generate'), array('id' => 'checkboxes_form')); ?>
        <section class="bi-filter-card" aria-label="Bulk ID filters">
            <div class="bi-filter-grid">
                <div class="bi-field">
                    <label for="year"><?php echo get_phrase('year'); ?></label>
                    <select name="year" class="form-control selectboxit" id="year">
                        <option value="" disabled="true"><?php echo get_phrase('select_running_session'); ?></option>
                        <?php echo populate_academic_year(); ?>
                    </select>
                </div>

                <div class="bi-field">
                    <label for="class_id"><?php echo get_phrase('class'); ?></label>
                    <select name="class_id" class="form-control selectboxit" data-validate="required" id="class_id"
                            data-message-required="<?php echo get_phrase('value_required'); ?>" required>
                        <option value=""><?php echo get_phrase('select_class'); ?></option>
                        <?php getFullClassList(); ?>
                    </select>
                </div>

                <button class="bi-load-btn" type="button" id="loadClassDataBtn" onclick="get_students_for_bulk_id()">
                    <i class="fa fa-users"></i><?php echo get_phrase('load_class_data'); ?>
                </button>
            </div>
        </section>

        <section class="bi-holder-card" id="bulkStudentCard" aria-live="polite">
            <div id="bulk_student_holder"></div>
        </section>
    <?php echo form_close(); ?>
</div>

<script type="text/javascript">
function get_students_for_bulk_id() {
    var year = $('#year').val();
    var class_id = $('#class_id').val();

    if (!class_id) {
        toastr.error('<?php echo get_phrase("you_must_select_a_class"); ?>');
        $('#class_id').focus();
        return false;
    }
    if (!year) {
        toastr.error('<?php echo get_phrase("you_must_select_a_year"); ?>');
        $('#year').focus();
        return false;
    }

    var $button = $('#loadClassDataBtn');
    var originalHtml = $button.html();
    $button.prop('disabled', true).html('<i class="fa fa-spinner fa-spin"></i> <?php echo get_phrase("loading"); ?>...');
    $('#bulkStudentCard').addClass('has-content');
    $('#bulk_student_holder').html('<div class="bi-loading"><i class="fa fa-spinner fa-spin"></i><?php echo get_phrase("loading"); ?>...</div>');

    $.ajax({
        url: '<?php echo site_url('admin/get_students_for_bulk_id/'); ?>' + encodeURIComponent(year) + '/' + encodeURIComponent(class_id),
        success: function(response) {
            $('#bulk_student_holder').html(response);
        },
        error: function() {
            $('#bulk_student_holder').html('<div class="alert alert-danger" style="margin:0;">Unable to load students for this class. Please try again.</div>');
        },
        complete: function() {
            $button.prop('disabled', false).html(originalHtml);
        }
    });
}
</script>
