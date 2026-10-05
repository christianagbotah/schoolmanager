<?php
$question_paper = $this->db->get_where('question_paper', array('question_paper_id' => $param2))->row_array();
$title = $question_paper ? $question_paper['title'] : get_phrase('question_paper');
?>

<style>
.question-paper-modal { color:#172033; }
.question-paper-modal .qpm-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:18px 20px; border-bottom:1px solid #e5e7eb; background:#fff; }
.question-paper-modal .qpm-title-wrap { display:flex; align-items:center; gap:12px; min-width:0; }
.question-paper-modal .qpm-icon { width:42px; height:42px; flex:0 0 42px; display:flex; align-items:center; justify-content:center; border-radius:11px; background:#eef4ff; border:1px solid #d7e5ff; color:#2563eb; }
.question-paper-modal .qpm-title { margin:0; font-size:19px; font-weight:700; color:#172033; }
.question-paper-modal .qpm-subtitle { margin:4px 0 0; color:#667085; font-size:13px; }
.question-paper-modal .qpm-body { padding:20px; background:#f8fafc; }
.question-paper-modal .qpm-paper { background:#fff; border:1px solid #e5e7eb; border-radius:14px; padding:24px; min-height:180px; color:#344054; font-size:14px; line-height:1.65; overflow-wrap:anywhere; }
.question-paper-modal .qpm-paper img { max-width:100%; height:auto; }
.question-paper-modal .qpm-paper table { max-width:100%; }
.question-paper-modal .qpm-footer { display:flex; align-items:center; justify-content:flex-end; gap:10px; padding:15px 20px; border-top:1px solid #e5e7eb; background:#fff; }
.question-paper-modal .qpm-btn { min-height:40px; padding:8px 14px; display:inline-flex; align-items:center; justify-content:center; gap:7px; border-radius:9px; font-size:14px; font-weight:700; text-decoration:none; cursor:pointer; }
.question-paper-modal .qpm-close { border:1px solid #d0d5dd; background:#fff; color:#475467; }
.question-paper-modal .qpm-print { border:1px solid #2563eb; background:#2563eb; color:#fff; }
.question-paper-modal .qpm-print:hover, .question-paper-modal .qpm-print:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; text-decoration:none; }
.question-paper-modal .qpm-empty { padding:42px 20px; text-align:center; color:#667085; }
@media (max-width:767px) {
    .question-paper-modal .qpm-body { padding:14px; }
    .question-paper-modal .qpm-paper { padding:18px; }
    .question-paper-modal .qpm-footer { flex-direction:column-reverse; }
    .question-paper-modal .qpm-btn { width:100%; }
}
</style>

<div class="question-paper-modal">
    <?php if ($question_paper): ?>
        <div class="qpm-head">
            <div class="qpm-title-wrap">
                <div class="qpm-icon"><i class="fa fa-file-alt"></i></div>
                <div>
                    <h4 class="qpm-title"><?php echo htmlspecialchars($title, ENT_QUOTES, 'UTF-8'); ?></h4>
                    <p class="qpm-subtitle"><?php echo get_phrase('question_paper_details'); ?></p>
                </div>
            </div>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">&times;</button>
        </div>

        <div class="qpm-body">
            <div id="qp_print" class="qpm-paper">
                <?php echo $question_paper['question_paper']; ?>
            </div>
        </div>

        <div class="qpm-footer hidden-print">
            <button type="button" class="qpm-btn qpm-close" data-dismiss="modal"><i class="fa fa-times"></i><?php echo get_phrase('close'); ?></button>
            <button type="button" onclick="PrintElem('#qp_print')" class="qpm-btn qpm-print"><i class="entypo-doc-text"></i><?php echo get_phrase('print_question_paper'); ?></button>
        </div>
    <?php else: ?>
        <div class="qpm-empty">
            <i class="fa fa-file-alt" style="font-size:36px;color:#cbd5e1;margin-bottom:10px;"></i>
            <h4 style="margin:0 0 6px;color:#172033;"><?php echo get_phrase('question_paper_not_found'); ?></h4>
            <p style="margin:0;"><?php echo get_phrase('no_record_found'); ?></p>
        </div>
    <?php endif; ?>
</div>

<script type="text/javascript">
function PrintElem(elem) {
    var $source = jQuery(elem);
    if (!$source.length) return false;

    var printWindow = window.open('', 'Question Paper', 'height=700,width=900');
    if (!printWindow) {
        toastr.error('Unable to open the print window. Please allow pop-ups and try again.');
        return false;
    }

    var title = <?php echo json_encode((string) $title); ?>;
    printWindow.document.open();
    printWindow.document.write('<!doctype html><html><head><meta charset="utf-8"><title>' + jQuery('<div>').text(title).html() + '</title>');
    printWindow.document.write('<meta name="viewport" content="width=device-width,initial-scale=1">');
    printWindow.document.write('<style>body{font-family:Arial,sans-serif;color:#111827;padding:28px;line-height:1.6}img{max-width:100%;height:auto}table{max-width:100%;border-collapse:collapse}td,th{padding:6px}</style>');
    printWindow.document.write('</head><body>' + $source.html() + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() {
        printWindow.print();
        printWindow.close();
    }, 250);
    return true;
}
</script>
