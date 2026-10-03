<?php
/**
 * GES Lesson Note System - Lesson Note Review/Detail View
 * Requirements: 9.3, 9.4, 9.5, 9.6
 */
$status_class = '';
switch ($lesson_note->status) {
    case 'pending':
        $status_class = 'label-warning';
        break;
    case 'hod_reviewed':
        $status_class = 'label-info';
        break;
    case 'approved':
        $status_class = 'label-success';
        break;
    case 'declined':
        $status_class = 'label-danger';
        break;
    default:
        $status_class = 'label-default';
}
?>

<style>
/* Lesson Note Review — direct enterprise UX refinement */
body { background: #f8fafc; }
.lesson-review-workspace {
    margin: 0 !important; padding: 24px 28px 40px;
}
.lesson-review-workspace > .col-md-12 { padding: 0 !important; }

.lesson-review-workspace > .col-md-12 > .panel-primary {
    border: 0 !important; border-radius: 0 !important; background: transparent;
    box-shadow: none !important;
}
.lesson-review-workspace > .col-md-12 > .panel-primary > .panel-heading {
    padding: 20px 24px !important; border: 1px solid #1e293b !important;
    border-radius: 14px !important; background: #0f172a !important;
    box-shadow: 0 8px 22px rgba(15,23,42,.15);
}
.lesson-review-workspace > .col-md-12 > .panel-primary > .panel-heading .panel-title {
    min-height: 32px; display: flex; align-items: center; gap: 9px;
    color: #fff !important; font-size: 24px !important; line-height: 1.25; font-weight: 800 !important;
}
.lesson-review-workspace .panel-title > .label {
    min-height: 30px; padding: 6px 10px !important; display: inline-flex; align-items: center;
    border-radius: 999px !important; font-size: 13px !important; font-weight: 800 !important;
}
.lesson-review-workspace > .col-md-12 > .panel-primary > .panel-body {
    padding: 18px 0 0 !important; background: transparent;
}

.lesson-review-workspace > .col-md-12 > .panel-primary > .panel-body > .row:first-child {
    margin: 0 0 14px !important; padding: 12px 14px; border: 1px solid #e2e8f0;
    border-radius: 12px; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.lesson-review-workspace .btn {
    min-height: 40px; padding: 8px 13px; border-radius: 8px;
    font-size: 14px; line-height: 1.35; font-weight: 700;
}
.lesson-review-workspace .btn-success { background: #059669; border-color: #059669; }
.lesson-review-workspace .btn-danger { background: #dc2626; border-color: #dc2626; }
.lesson-review-workspace .btn-info { background: #0284c7; border-color: #0284c7; }

.lesson-review-workspace .panel-default {
    margin-bottom: 14px; border: 1px solid #e2e8f0 !important; border-radius: 14px;
    overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.lesson-review-workspace .panel-default > .panel-heading {
    padding: 13px 16px !important; border-bottom: 1px solid #eef2f7 !important;
    background: #f8fafc !important;
}
.lesson-review-workspace .panel-default > .panel-heading .panel-title {
    color: #0f172a !important; font-size: 17px !important; line-height: 1.35; font-weight: 800 !important;
}
.lesson-review-workspace .panel-default > .panel-body {
    padding: 16px 18px !important; background: #fff;
    color: #334155; font-size: 14px; line-height: 1.6;
}
.lesson-review-workspace .panel-default p {
    margin: 0 0 8px; color: #334155; font-size: 14px; line-height: 1.55;
}
.lesson-review-workspace .panel-default p strong { color: #0f172a; font-weight: 800; }
.lesson-review-workspace .panel-default h5 {
    margin: 14px 0 8px; color: #0f172a; font-size: 15px; line-height: 1.4; font-weight: 800;
}
.lesson-review-workspace .panel-default ul {
    margin: 0; padding-left: 20px;
}
.lesson-review-workspace .panel-default li {
    margin-bottom: 6px; color: #334155; font-size: 14px; line-height: 1.5;
}
.lesson-review-workspace .panel-default a:not(.btn) {
    color: #2563eb; word-break: break-word;
}

.lesson-review-workspace .table-responsive,
.lesson-review-workspace .panel-body:has(> table) {
    overflow-x: auto; -webkit-overflow-scrolling: touch;
}
.lesson-review-workspace table.table {
    min-width: 720px; margin-bottom: 0; border-color: #e2e8f0;
}
.lesson-review-workspace table.table thead th {
    padding: 11px 12px; background: #f8fafc; color: #475569;
    font-size: 13px; font-weight: 800; letter-spacing: .035em;
}
.lesson-review-workspace table.table tbody td {
    padding: 11px 12px; color: #334155; font-size: 14px; line-height: 1.45;
}

#declineModal .modal-content {
    border: 0; border-radius: 14px; overflow: hidden;
    box-shadow: 0 18px 50px rgba(15,23,42,.22);
}
#declineModal .modal-header {
    padding: 15px 18px; border-bottom: 1px solid #e2e8f0; background: #fff;
}
#declineModal .modal-title {
    color: #0f172a; font-size: 18px; font-weight: 800;
}
#declineModal .modal-body { padding: 18px; }
#declineModal label { margin-bottom: 7px; color: #334155; font-size: 14px; font-weight: 700; }
#declineModal textarea.form-control {
    min-height: 110px; padding: 10px 12px; border: 1px solid #cbd5e1;
    border-radius: 9px; font-size: 15px; line-height: 1.5;
}
#declineModal textarea.form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}
#declineModal .help-block { font-size: 13px; line-height: 1.45; color: #64748b; }
#declineModal .modal-footer { padding: 12px 18px; border-top: 1px solid #e2e8f0; }
#declineModal .btn { min-height: 40px; padding: 8px 13px; font-size: 14px; font-weight: 700; }

@media (max-width: 767px) {
    .lesson-review-workspace { padding: 18px 14px 32px; }
    .lesson-review-workspace > .col-md-12 > .panel-primary > .panel-heading { padding: 18px !important; }
    .lesson-review-workspace > .col-md-12 > .panel-primary > .panel-heading .panel-title {
        align-items: flex-start; flex-wrap: wrap; font-size: 21px !important;
    }
    .lesson-review-workspace > .col-md-12 > .panel-primary > .panel-body > .row:first-child .btn {
        width: 100%; margin-bottom: 7px; justify-content: center;
    }
    .lesson-review-workspace .panel-default > .panel-body { padding: 14px !important; }
}
</style>


<div class="row lesson-review-workspace">
    <div class="col-md-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                <div class="panel-title">
                    <i class="entypo-doc-text"></i> <?php echo get_phrase('review_lesson_note'); ?>
                    <span class="label <?php echo $status_class; ?>" style="margin-left: 10px;">
                        <?php echo ucfirst(str_replace('_', ' ', $lesson_note->status)); ?>
                    </span>
                </div>
            </div>
            <div class="panel-body">
                <!-- Action Buttons -->
                <?php if (in_array($lesson_note->status, array('pending', 'hod_reviewed'))): ?>
                    <div class="row" style="margin-bottom: 20px;">
                        <div class="col-md-12">
                            <a href="<?php echo site_url('admin/lesson_note_approve/' . $lesson_note->id); ?>" 
                               class="btn btn-success" 
                               onclick="event.preventDefault(); showCustomConfirm('<?php echo get_phrase('are_you_sure_approve'); ?>', function() { window.location.href = '<?php echo site_url('admin/lesson_note_approve/' . $lesson_note->id); ?>'; });">
                                <i class="entypo-check"></i> <?php echo get_phrase('approve'); ?>
                            </a>
                            <button class="btn btn-danger" onclick="showDeclineModal()">
                                <i class="entypo-cancel"></i> <?php echo get_phrase('decline'); ?>
                            </button>
                            <a href="<?php echo site_url('admin/lesson_notes_pending'); ?>" class="btn btn-default">
                                <i class="entypo-back"></i> <?php echo get_phrase('back_to_list'); ?>
                            </a>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Basic Information -->
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title"><?php echo get_phrase('basic_information'); ?></h4>
                    </div>
                    <div class="panel-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong><?php echo get_phrase('teacher'); ?>:</strong> <?php echo $lesson_note->teacher_name; ?></p>
                                <p><strong><?php echo get_phrase('subject'); ?>:</strong> <?php echo $lesson_note->subject_name; ?></p>
                                <p><strong><?php echo get_phrase('class'); ?>:</strong> <?php echo $lesson_note->class_name . ' ' . $lesson_note->class_numeric; ?></p>
                            </div>
                            <div class="col-md-6">
                                <p><strong><?php echo get_phrase('title'); ?>:</strong> <?php echo $lesson_note->title; ?></p>
                                <p><strong><?php echo get_phrase('week'); ?>:</strong> <?php echo $lesson_note->week_number; ?></p>
                                <p><strong><?php echo get_phrase('term'); ?>:</strong> <?php echo $lesson_note->term; ?></p>
                                <p><strong><?php echo get_phrase('lesson_date'); ?>:</strong> <?php echo date('d M Y', strtotime($lesson_note->lesson_date)); ?></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Curriculum Details -->
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title"><?php echo get_phrase('curriculum_details'); ?></h4>
                    </div>
                    <div class="panel-body">
                        <?php if (!empty($lesson_note->strand_name)): ?>
                            <p><strong><?php echo get_phrase('strand'); ?>:</strong> <?php echo $lesson_note->strand_name; ?></p>
                            <p><strong><?php echo get_phrase('sub_strand'); ?>:</strong> <?php echo $lesson_note->sub_strand_name; ?></p>
                            <p><strong><?php echo get_phrase('content_standard'); ?>:</strong> <?php echo $lesson_note->content_standard_code . ' - ' . $lesson_note->content_standard_description; ?></p>
                        <?php endif; ?>

                        <h5><?php echo get_phrase('learning_indicators'); ?>:</h5>
                        <?php if (!empty($learning_indicators)): ?>
                            <ul>
                                <?php foreach ($learning_indicators as $indicator): ?>
                                    <li><?php echo $indicator->code . ' - ' . $indicator->description; ?></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <p><?php echo get_phrase('no_learning_indicators'); ?></p>
                        <?php endif; ?>

                        <h5><?php echo get_phrase('core_competencies'); ?>:</h5>
                        <?php if (!empty($core_competencies)): ?>
                            <ul>
                                <?php foreach ($core_competencies as $competency): ?>
                                    <li><?php echo $competency->name . ' - ' . $competency->description; ?></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <p><?php echo get_phrase('no_core_competencies'); ?></p>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Lesson Content -->
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title"><?php echo get_phrase('lesson_content'); ?></h4>
                    </div>
                    <div class="panel-body">
                        <h5><?php echo get_phrase('lesson_objectives'); ?>:</h5>
                        <div><?php echo $lesson_note->lesson_objectives; ?></div>

                        <h5 style="margin-top: 20px;"><?php echo get_phrase('lesson_activities'); ?>:</h5>
                        <div><?php echo $lesson_note->lesson_activities; ?></div>

                        <?php if (!empty($lesson_note->lesson_content)): ?>
                            <h5 style="margin-top: 20px;"><?php echo get_phrase('additional_content'); ?>:</h5>
                            <div><?php echo $lesson_note->lesson_content; ?></div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Teaching Resources -->
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title"><?php echo get_phrase('teaching_learning_resources'); ?></h4>
                    </div>
                    <div class="panel-body">
                        <?php if (!empty($teaching_resources)): ?>
                            <ul>
                                <?php foreach ($teaching_resources as $resource): ?>
                                    <li><?php echo $resource->resource_name; ?></li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <p><?php echo get_phrase('no_teaching_resources'); ?></p>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Assessment Methods -->
                <div class="panel panel-default">
                    <div class="panel-heading">
                        <h4 class="panel-title"><?php echo get_phrase('assessment_methods'); ?></h4>
                    </div>
                    <div class="panel-body">
                        <?php if (!empty($assessment_methods)): ?>
                            <ul>
                                <?php foreach ($assessment_methods as $method): ?>
                                    <li>
                                        <?php echo $method->method_name; ?>
                                        <?php if (!empty($method->notes)): ?>
                                            <br><em><?php echo $method->notes; ?></em>
                                        <?php endif; ?>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php else: ?>
                            <p><?php echo get_phrase('no_assessment_methods'); ?></p>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Reference Materials -->
                <?php if (!empty($references)): ?>
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h4 class="panel-title"><?php echo get_phrase('reference_materials'); ?></h4>
                        </div>
                        <div class="panel-body">
                            <ul>
                                <?php foreach ($references as $reference): ?>
                                    <li>
                                        <?php echo $reference->title; ?>
                                        <?php if (!empty($reference->author)): ?>
                                            by <?php echo $reference->author; ?>
                                        <?php endif; ?>
                                        <?php if (!empty($reference->publisher)): ?>
                                            (<?php echo $reference->publisher; ?>
                                            <?php if (!empty($reference->year)): ?>
                                                , <?php echo $reference->year; ?>
                                            <?php endif; ?>)
                                        <?php endif; ?>
                                        <?php if (!empty($reference->url)): ?>
                                            <br><a href="<?php echo $reference->url; ?>" target="_blank"><?php echo $reference->url; ?></a>
                                        <?php endif; ?>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Attached File -->
                <?php if (!empty($lesson_note->file_path)): ?>
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h4 class="panel-title"><?php echo get_phrase('attached_file'); ?></h4>
                        </div>
                        <div class="panel-body">
                            <p>
                                <a href="<?php echo base_url('uploads/lesson_notes/' . $lesson_note->file_path); ?>" 
                                   target="_blank" 
                                   class="btn btn-info">
                                    <i class="entypo-download"></i> <?php echo $lesson_note->file_name; ?>
                                </a>
                            </p>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Revision History -->
                <?php if (!empty($revision_history)): ?>
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h4 class="panel-title"><?php echo get_phrase('revision_history'); ?></h4>
                        </div>
                        <div class="panel-body">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th><?php echo get_phrase('date'); ?></th>
                                        <th><?php echo get_phrase('action'); ?></th>
                                        <th><?php echo get_phrase('user'); ?></th>
                                        <th><?php echo get_phrase('feedback'); ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($revision_history as $revision): ?>
                                        <tr>
                                            <td><?php echo date('d M Y H:i', strtotime($revision->created_at)); ?></td>
                                            <td><?php echo ucfirst(str_replace('_', ' ', $revision->action)); ?></td>
                                            <td><?php echo $revision->user_name; ?></td>
                                            <td><?php echo $revision->feedback; ?></td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<!-- Decline Modal -->
<div class="modal fade" id="declineModal" tabindex="-1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title"><?php echo get_phrase('decline_lesson_note'); ?></h4>
            </div>
            <form method="post" action="<?php echo site_url('admin/lesson_note_decline/' . $lesson_note->id); ?>">
                <div class="modal-body">
                    <div class="form-group">
                        <label><?php echo get_phrase('feedback'); ?> *</label>
                        <textarea name="feedback" class="form-control" rows="4" required></textarea>
                        <p class="help-block"><?php echo get_phrase('please_provide_reason_for_decline'); ?></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal"><?php echo get_phrase('cancel'); ?></button>
                    <button type="submit" class="btn btn-danger"><?php echo get_phrase('decline'); ?></button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
function showDeclineModal() {
    $('#declineModal').modal('show');
}
</script>
