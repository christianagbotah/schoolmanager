<?php
$display = 'none';
$alert_type = 'success';
$feedback = '';
if (isset($_GET['msg'])) {
    $msg_val = $_GET['msg'];
    if ($msg_val == 1) {
        $display = 'block';
        $alert_type = 'danger';
        $feedback = get_phrase('message_not_sent:_parent\'s_phone_number_not_found');
    } elseif ($msg_val == 2) {
        $display = 'block';
        $alert_type = 'success';
        $feedback = get_phrase('messages_sent');
    } elseif ($msg_val == 3) {
        $display = 'block';
        $alert_type = 'danger';
        $feedback = get_phrase('your_sMS_menu_has_been_disabled._please_enable_it_on_the_sYSTEM_sETTINGS_menu_and_try_again!');
    }
}

$active_sms_row = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row();
$active_sms_service = $active_sms_row ? $active_sms_row->description : 'disabled';
$sms_enabled = $active_sms_service !== 'disabled';
$exams = $this->db->get_where('exam', array('category_id !=' => '1'))->result_array();
$classes = $this->db->get('class')->result_array();
?>

<style>
.exam-sms-page { --es-border:#e5e7eb; --es-text:#172033; --es-muted:#667085; }
.exam-sms-page .es-hero,
.exam-sms-page .es-status,
.exam-sms-page .es-card {
    background:#fff;
    border:1px solid var(--es-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.exam-sms-page .es-hero { padding:24px; margin-bottom:16px; }
.exam-sms-page .es-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.exam-sms-page .es-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.exam-sms-page .es-icon {
    width:52px; height:52px; flex:0 0 52px; display:flex; align-items:center; justify-content:center;
    border-radius:14px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; font-size:22px;
}
.exam-sms-page .es-title { margin:0; color:var(--es-text); font-size:26px; line-height:1.2; font-weight:700; }
.exam-sms-page .es-subtitle { margin:6px 0 0; color:var(--es-muted); font-size:15px; line-height:1.5; }
.exam-sms-page .es-service {
    display:inline-flex; align-items:center; gap:7px; min-height:38px; padding:8px 12px; border-radius:999px;
    font-size:13px; font-weight:700; white-space:nowrap;
}
.exam-sms-page .es-service.is-on { background:#ecfdf3; border:1px solid #abefc6; color:#067647; }
.exam-sms-page .es-service.is-off { background:#fef2f2; border:1px solid #fecaca; color:#b42318; }
.exam-sms-page .alert { border-radius:12px; font-size:14px; line-height:1.5; margin-bottom:16px; }
.exam-sms-page .es-status { padding:14px 16px; margin-bottom:16px; display:flex; align-items:flex-start; gap:11px; }
.exam-sms-page .es-status i { margin-top:2px; color:<?php echo $sms_enabled ? '#067647' : '#b42318'; ?>; }
.exam-sms-page .es-status strong { display:block; color:var(--es-text); font-size:14px; margin-bottom:3px; }
.exam-sms-page .es-status span { color:var(--es-muted); font-size:13px; line-height:1.45; }
.exam-sms-page .es-card { padding:20px; }
.exam-sms-page .es-card-head { margin-bottom:18px; }
.exam-sms-page .es-card-head h3 { margin:0; color:var(--es-text); font-size:18px; font-weight:700; }
.exam-sms-page .es-card-head p { margin:5px 0 0; color:var(--es-muted); font-size:13px; line-height:1.5; }
.exam-sms-page .es-grid { display:grid; grid-template-columns:minmax(200px,1.3fr) minmax(170px,.8fr) minmax(210px,1fr) auto; gap:14px; align-items:end; }
.exam-sms-page .es-field label { display:block; margin:0 0 7px; color:#344054; font-size:14px; font-weight:700; }
.exam-sms-page .es-field .form-control,
.exam-sms-page .es-field select { min-height:44px; border:1.5px solid #d0d5dd; border-radius:10px; font-size:14px; background:#fff; }
.exam-sms-page .es-field .form-control:focus,
.exam-sms-page .es-field select:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); outline:none; }
.exam-sms-page .es-student-row { display:none; margin-top:14px; padding-top:14px; border-top:1px solid var(--es-border); }
.exam-sms-page .es-student-row.is-visible { display:grid; grid-template-columns:minmax(260px,1fr) auto; gap:14px; align-items:end; }
.exam-sms-page .es-send {
    min-height:44px; padding:9px 17px; display:inline-flex; align-items:center; justify-content:center; gap:8px;
    border:1px solid #2563eb; border-radius:10px; background:#2563eb; color:#fff; font-size:14px; font-weight:700; white-space:nowrap;
}
.exam-sms-page .es-send:hover, .exam-sms-page .es-send:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; }
.exam-sms-page .es-send:disabled { opacity:.55; cursor:not-allowed; }
.exam-sms-page .es-inline-message { display:none; margin-top:14px; padding:11px 13px; border:1px solid #fecaca; border-radius:10px; background:#fef2f2; color:#b42318; font-size:13px; }
@media (max-width:1050px) {
    .exam-sms-page .es-grid { grid-template-columns:1fr 1fr; }
    .exam-sms-page .es-send { width:100%; }
}
@media (max-width:767px) {
    .exam-sms-page .es-hero { padding:18px; }
    .exam-sms-page .es-hero-row { flex-direction:column; align-items:flex-start; }
    .exam-sms-page .es-title { font-size:22px; }
    .exam-sms-page .es-grid, .exam-sms-page .es-student-row.is-visible { grid-template-columns:1fr; }
    .exam-sms-page .es-card { padding:16px; }
}
</style>

<div class="exam-sms-page">
    <section class="es-hero" aria-labelledby="examSmsTitle">
        <div class="es-hero-row">
            <div class="es-title-wrap">
                <div class="es-icon" aria-hidden="true"><i class="fa fa-paper-plane"></i></div>
                <div>
                    <h2 class="es-title" id="examSmsTitle"><?php echo get_phrase('send_marks_by_sms'); ?></h2>
                    <p class="es-subtitle">Send published exam marks to students, parents, or one selected parent using the existing SMS and email delivery workflow.</p>
                </div>
            </div>
            <span class="es-service <?php echo $sms_enabled ? 'is-on' : 'is-off'; ?>">
                <i class="fa <?php echo $sms_enabled ? 'fa-check-circle' : 'fa-exclamation-circle'; ?>"></i>
                <?php echo $sms_enabled ? 'SMS service enabled' : 'SMS service disabled'; ?>
            </span>
        </div>
    </section>

    <?php if ($display === 'block' && $feedback !== ''): ?>
        <div class="alert alert-<?php echo htmlspecialchars($alert_type, ENT_QUOTES, 'UTF-8'); ?> alert-dismissible" role="alert">
            <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <strong><?php echo htmlspecialchars($feedback, ENT_QUOTES, 'UTF-8'); ?></strong>
        </div>
    <?php endif; ?>

    <div class="es-status">
        <i class="fa <?php echo $sms_enabled ? 'fa-info-circle' : 'fa-exclamation-triangle'; ?>"></i>
        <div>
            <strong><?php echo $sms_enabled ? 'Delivery is available' : 'Delivery is currently blocked'; ?></strong>
            <span><?php echo $sms_enabled ? 'The server will send SMS and, where available, email copies using the existing exam-results workflow.' : 'The backend does not send exam results while the SMS service is disabled. Enable SMS in System Settings before sending.'; ?></span>
        </div>
    </div>

    <section class="es-card">
        <div class="es-card-head">
            <h3><?php echo get_phrase('select_delivery_scope'); ?></h3>
            <p>Select the exam, class and intended receiver. Choosing one parent will reveal a student selector.</p>
        </div>

        <?php echo form_open(site_url('admin/exam_marks_sms/send_sms'), array('id' => 'examMarksSmsForm')); ?>
            <div class="es-grid">
                <div class="es-field">
                    <label for="exam_id"><?php echo get_phrase('exam'); ?></label>
                    <select name="exam_id" class="form-control select2" id="exam_id" required>
                        <?php foreach ($exams as $row): ?>
                            <option value="<?php echo (int) $row['exam_id']; ?>"><?php echo htmlspecialchars($row['name'], ENT_QUOTES, 'UTF-8'); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="es-field">
                    <label for="class_id"><?php echo get_phrase('class'); ?></label>
                    <select name="class_id" class="form-control select2" id="class_id" required>
                        <?php foreach ($classes as $row):
                            $class_id2 = $row['class_id'];
                            $class_record = $this->db->get_where('class', array('class_id' => $class_id2))->row();
                            if (!$class_record) continue;
                            $class_name = $class_record->name;
                            $class_name_numeric = $class_record->name_numeric;
                            $section_record = $this->db->get_where('section', array('class_id' => $class_id2))->row();
                            $section_name = $section_record ? $section_record->name : '';
                            $class_has_more_sections = $this->db->get_where('class', array('name' => $class_name, 'name_numeric' => $class_name_numeric))->num_rows();
                            $sec_name = $class_has_more_sections > 1 ? $section_name : '';
                            $class_label = $class_name == 'CRECHE' ? $class_name : trim($class_name . ' ' . $class_name_numeric . $sec_name);
                        ?>
                            <option value="<?php echo (int) $class_id2; ?>"><?php echo htmlspecialchars($class_label, ENT_QUOTES, 'UTF-8'); ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="es-field">
                    <label for="receiver"><?php echo get_phrase('receiver'); ?></label>
                    <select name="receiver" class="form-control select2" id="receiver" required>
                        <option value=""><?php echo get_phrase('select_receiver'); ?></option>
                        <option value="student"><?php echo get_phrase('students'); ?></option>
                        <option value="parent"><?php echo get_phrase('parents'); ?></option>
                        <option value="single_parent"><?php echo get_phrase('one_parent_at_a_time'); ?></option>
                    </select>
                </div>

                <button type="submit" class="es-send" id="examSmsSubmit" <?php echo $sms_enabled ? '' : 'disabled'; ?>>
                    <i class="fa fa-paper-plane"></i><?php echo get_phrase('send_marks'); ?> via SMS / Email
                </button>
            </div>

            <div class="es-student-row" id="singleParentRow">
                <div class="es-field">
                    <label for="student_id"><?php echo get_phrase('select_student'); ?></label>
                    <select name="student_id" id="student_id" class="form-control select2">
                        <option value=""><?php echo get_phrase('choose_student'); ?></option>
                    </select>
                </div>
                <button type="submit" class="es-send" id="singleParentSubmit" <?php echo $sms_enabled ? '' : 'disabled'; ?>>
                    <i class="fa fa-paper-plane"></i><?php echo get_phrase('send_marks'); ?> via SMS / Email
                </button>
            </div>

            <div class="es-inline-message" id="examSmsMessage" role="alert"></div>
        <?php echo form_close(); ?>
    </section>
</div>

<script type="text/javascript">
(function($) {
    var smsEnabled = <?php echo $sms_enabled ? 'true' : 'false'; ?>;
    var $form = $('#examMarksSmsForm');
    var $receiver = $('#receiver');
    var $student = $('#student_id');
    var $singleRow = $('#singleParentRow');
    var $message = $('#examSmsMessage');
    var $mainSubmit = $('#examSmsSubmit');

    function showMessage(message) {
        $message.text(message).show();
    }

    function clearMessage() {
        $message.hide().text('');
    }

    function refreshStudents() {
        var classId = $('#class_id').val();
        if (!classId) {
            $student.html('<option value=""><?php echo get_phrase('choose_student'); ?></option>');
            return;
        }
        $student.prop('disabled', true).html('<option value=""><?php echo get_phrase('loading'); ?>...</option>');
        $.ajax({
            url: '<?php echo site_url('admin/get_students_for_exam/'); ?>' + encodeURIComponent(classId),
            type: 'GET'
        }).done(function(response) {
            $student.html(response);
        }).fail(function() {
            $student.html('<option value=""><?php echo get_phrase('no_record_found'); ?></option>');
            toastr.error('Unable to load students for the selected class.');
        }).always(function() {
            $student.prop('disabled', false);
        });
    }

    function syncReceiverUi() {
        var isSingleParent = $receiver.val() === 'single_parent';
        $singleRow.toggleClass('is-visible', isSingleParent);
        $mainSubmit.toggle(!isSingleParent);
        $student.prop('required', isSingleParent);
        clearMessage();
        if (isSingleParent) refreshStudents();
    }

    $('#class_id').on('change', function() {
        if ($receiver.val() === 'single_parent') refreshStudents();
    });
    $receiver.on('change', syncReceiverUi);

    $form.on('submit', function(event) {
        clearMessage();
        if (!smsEnabled) {
            event.preventDefault();
            showMessage('Your SMS service is disabled. Enable it in System Settings before sending exam marks.');
            toastr.error('<?php echo get_phrase('SMS_NOT_ACTIVE._ENABLE_IT_AT_THE_SYSTEM_SETTINGS_MENU_AND_TRY_AGAIN!'); ?>');
            return false;
        }
        if (!$receiver.val()) {
            event.preventDefault();
            showMessage('Please select the target receiver before you proceed.');
            toastr.error('<?php echo get_phrase('please_select_receiver'); ?>');
            return false;
        }
        if ($receiver.val() === 'single_parent' && !$student.val()) {
            event.preventDefault();
            showMessage('Please select the student whose parent should receive the result.');
            toastr.error('<?php echo get_phrase('select_student'); ?>');
            return false;
        }
        return true;
    });

    syncReceiverUi();
})(jQuery);
</script>
