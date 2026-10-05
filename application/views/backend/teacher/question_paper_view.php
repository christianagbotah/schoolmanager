<?php
$question_paper = $this->db->get_where('question_paper', array('question_paper_id' => $param2))->row_array();
$title = $question_paper ? $question_paper['title'] : get_phrase('question_paper');
?>

<style>
.teacher-qpaper-modal { color:#172033; }
.teacher-qpaper-modal .tqm-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:18px 20px; border-bottom:1px solid #e5e7eb; background:#fff; }
.teacher-qpaper-modal .tqm-title-wrap { display:flex; align-items:center; gap:12px; min-width:0; padding-right:24px; }
.teacher-qpaper-modal .tqm-icon { width:42px; height:42px; flex:0 0 42px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; }
.teacher-qpaper-modal .tqm-title { margin:0; color:#172033; font-size:19px; font-weight:700; overflow-wrap:anywhere; }
.teacher-qpaper-modal .tqm-subtitle { margin:4px 0 0; color:#667085; font-size:13px; }
.teacher-qpaper-modal .tqm-body { padding:20px; background:#f8fafc; }
.teacher-qpaper-modal .tqm-paper { min-height:180px; padding:24px; border:1px solid #e5e7eb; border-radius:14px; background:#fff; color:#344054; font-size:14px; line-height:1.65; overflow-wrap:anywhere; }
.teacher-qpaper-modal .tqm-paper img { max-width:100%; height:auto; }
.teacher-qpaper-modal .tqm-paper table { max-width:100%; border-collapse:collapse; }
.teacher-qpaper-modal .tqm-footer { display:flex; align-items:center; justify-content:flex-end; gap:10px; padding:15px 20px; border-top:1px solid #e5e7eb; background:#fff; }
.teacher-qpaper-modal .tqm-btn { min-height:40px; padding:8px 14px; display:inline-flex; align-items:center; justify-content:center; gap:7px; border-radius:9px; font-size:14px; font-weight:700; text-decoration:none; cursor:pointer; }
.teacher-qpaper-modal .tqm-close { border:1px solid #d0d5dd; background:#fff; color:#475467; }
.teacher-qpaper-modal .tqm-print { border:1px solid #2563eb; background:#2563eb; color:#fff; }
.teacher-qpaper-modal .tqm-print:hover, .teacher-qpaper-modal .tqm-print:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; text-decoration:none; }
.teacher-qpaper-modal .tqm-empty { padding:42px 20px; text-align:center; color:#667085; }
@media (max-width:767px) {
    .teacher-qpaper-modal .tqm-body { padding:14px; }
    .teacher-qpaper-modal .tqm-paper { padding:18px; }
    .teacher-qpaper-modal .tqm-footer { flex-direction:column-reverse; }
    .teacher-qpaper-modal .tqm-btn { width:100%; }
}
</style>

<div class="teacher-qpaper-modal">
    <?php if ($question_paper): ?>
        <div class="modal-header tqm-head">
            <div class="tqm-title-wrap">
                <div class="tqm-icon"><i class="fa fa-file-alt"></i></div>
                <div>
                    <h4 class="tqm-title"><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h4>
                    <p class="tqm-subtitle"><?php echo get_phrase('question_paper_details'); ?></p>
                </div>
            </div>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">&times;</button>
        </div>

        <div class="modal-body tqm-body">
            <div id="teacher_qp_print" class="tqm-paper">
                <?php echo $question_paper['question_paper']; ?>
            </div>
        </div>

        <div class="modal-footer tqm-footer hidden-print">
            <button type="button" class="tqm-btn tqm-close" data-dismiss="modal"><i class="fa fa-times"></i><?php echo get_phrase('close'); ?></button>
            <button type="button" class="tqm-btn tqm-print" onclick="TeacherPrintQuestionPaper('#teacher_qp_print')"><i class="entypo-doc-text"></i><?php echo get_phrase('print_question_paper'); ?></button>
        </div>
    <?php else: ?>
        <div class="tqm-empty">
            <i class="fa fa-file-alt" style="display:block;font-size:36px;color:#cbd5e1;margin-bottom:10px;"></i>
            <strong style="display:block;color:#172033;margin-bottom:5px;"><?php echo get_phrase('question_paper_not_found'); ?></strong>
            <?php echo get_phrase('no_record_found'); ?>
        </div>
    <?php endif; ?>
</div>

<script type="text/javascript">
function TeacherPrintQuestionPaper(selector) {
    var $source = jQuery(selector);
    if (!$source.length) return false;

    var printWindow = window.open('', 'Question Paper', 'height=700,width=900');
    if (!printWindow) {
        toastr.error('Unable to open the print window. Please allow pop-ups and try again.');
        return false;
    }

    var title = <?php echo json_encode((string) $title); ?>;
    var safeTitle = jQuery('<div>').text(title).html();
    printWindow.document.open();
    printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + safeTitle + '</title>');
    printWindow.document.write('<meta name="viewport" content="width=device-width,initial-scale=1">');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;color:#111827;padding:28px;line-height:1.6}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}td,th{padding:6px}</style>');
    printWindow.document.write('</head><body>' + $source.html() + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() {
        printWindow.print();
        printWindow.close();
    }, 250);
    return false;
}
</script>
