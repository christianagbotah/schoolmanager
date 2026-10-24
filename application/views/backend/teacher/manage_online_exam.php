<?php
$teacher_id = (int) $this->session->userdata('teacher_id');
$visible_exams = [];
$displayed_exam_ids = [];
$exam_counts = [
    'total' => 0,
    'published' => 0,
    'pending' => 0,
    'expired' => 0,
];

foreach ($online_exams as $row) {
    $exam_id = (int) ($row['online_exam_id'] ?? 0);
    if ($exam_id <= 0 || isset($displayed_exam_ids[$exam_id])) {
        continue;
    }

    $class = $this->db->get_where('class', ['class_id' => $row['class_id']])->row();
    $subject = $this->db->get_where('subject', [
        'subject_id' => $row['subject_id'],
        'year' => $running_year,
    ])->row();
    $section = $this->db->get_where('section', ['section_id' => $row['section_id']])->row();

    // Fail closed for stale academic references instead of dereferencing a
    // missing record or accidentally showing an exam we cannot authorise.
    if (!$class || !$subject || !$section) {
        continue;
    }

    $class_teacher_id = (int) ($class->teacher_id ?? 0);
    $subject_teacher_id = (int) ($subject->teacher_id ?? 0);
    if ($class_teacher_id !== $teacher_id && $subject_teacher_id !== $teacher_id) {
        continue;
    }

    $displayed_exam_ids[$exam_id] = true;
    $row['class_display'] = trim((string) ($class->name ?? '') . ' ' . (string) ($class->name_numeric ?? ''));
    $row['section_display'] = (string) ($section->name ?? $section->section_name ?? '');
    $row['subject_display'] = (string) ($subject->name ?? '');
    $visible_exams[] = $row;

    $exam_counts['total']++;
    $row_status = strtolower((string) ($row['status'] ?? ''));
    if (array_key_exists($row_status, $exam_counts)) {
        $exam_counts[$row_status]++;
    }
}
?>

<script src="<?php echo base_url(); ?>assets/cdn/js/tailwindcss.js"></script>

<style>
.online-exam-command{max-width:1440px;margin:0 auto}.exam-command-hero{background:#0f172a;color:#fff;border-radius:18px;padding:24px;margin-bottom:16px;box-shadow:0 12px 30px rgba(15,23,42,.12)}.exam-command-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap}.exam-command-copy h2{margin:0 0 6px;font-size:28px;font-weight:800;color:#fff}.exam-command-copy p{margin:0;color:#cbd5e1}.exam-command-actions{display:flex;gap:9px;flex-wrap:wrap}.exam-command-actions a{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 15px;border-radius:10px;font-weight:800;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease}.exam-command-actions a:hover{transform:translateY(-1px);text-decoration:none}.exam-action-create{background:#2563eb;color:#fff;box-shadow:0 7px 18px rgba(37,99,235,.28)}.exam-action-filter{background:#fff;color:#334155;border:1px solid #cbd5e1}.exam-action-filter.is-active{background:#059669;color:#fff;border-color:#059669}.exam-action-filter.is-expired{background:#dc2626;color:#fff;border-color:#dc2626}.exam-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:11px;margin-bottom:16px}.exam-kpi{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;box-shadow:0 3px 12px rgba(15,23,42,.04)}.exam-kpi span{display:block;color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.exam-kpi strong{display:block;margin-top:5px;color:#0f172a;font-size:25px;line-height:1}.exam-table-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 5px 18px rgba(15,23,42,.05)}.exam-table-card .exam-table-wrap{overflow-x:auto}.exam-table-card table{margin:0}.exam-table-card thead{background:#0f172a;color:#fff}.exam-table-card tbody tr{border-bottom:1px solid #e2e8f0}.exam-table-card tbody tr:hover{background:#f8fafc}.exam-name-link{color:#0e7490;font-weight:800;display:flex;align-items:center;text-decoration:none}.exam-name-link:hover{color:#155e75;text-decoration:none}.exam-icon-chip{flex:0 0 40px;height:40px;border-radius:10px;background:#0891b2;color:#fff;display:flex;align-items:center;justify-content:center;margin-right:10px}.exam-action-list{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}.exam-action-form{display:inline-flex;margin:0}.exam-action-list a,.exam-action-list button{display:inline-flex;align-items:center;gap:4px;border:0;border-radius:8px;padding:6px 9px;color:#fff;font-family:inherit;font-size:11px;font-weight:800;line-height:1.4;text-decoration:none;cursor:pointer}.exam-action-list a:hover,.exam-action-list button:hover{color:#fff;text-decoration:none;filter:brightness(.94)}.exam-action-questions{background:#2563eb}.exam-action-edit{background:#059669}.exam-action-publish{background:#047857}.exam-action-cancel,.exam-action-delete{background:#dc2626}.exam-action-results{background:#7c3aed}
@media(max-width:900px){.exam-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.exam-command-head{align-items:stretch}.exam-command-actions{width:100%}.exam-command-actions a{flex:1 1 180px}}
@media(max-width:767px){.exam-command-hero{padding:18px;border-radius:14px}.exam-command-copy h2{font-size:22px}.exam-command-actions{display:grid;grid-template-columns:1fr 1fr}.exam-command-actions .exam-action-create{grid-column:1/-1}.exam-kpi-grid{grid-template-columns:1fr 1fr}.exam-kpi{padding:12px}.exam-kpi strong{font-size:21px}.exam-table-card{border-radius:12px}.exam-table-card th,.exam-table-card td{white-space:nowrap;padding-left:12px!important;padding-right:12px!important}.exam-action-list{min-width:250px;justify-content:flex-start}}
@media(max-width:420px){.exam-command-actions{grid-template-columns:1fr}.exam-command-actions .exam-action-create{grid-column:auto}.exam-kpi-grid{grid-template-columns:1fr 1fr}}
@media(prefers-reduced-motion:reduce){.exam-command-actions a{transition:none}.animate-pulse{animation:none!important}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}.animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}
</style>

<div class="online-exam-command">
    <section class="exam-command-hero" aria-labelledby="onlineExamHeading">
        <div class="exam-command-head">
            <div class="exam-command-copy">
                <h2 id="onlineExamHeading"><i class="entypo-doc-text"></i> <?php echo get_phrase('manage_online_exams');?></h2>
                <p><?php echo get_phrase('create_and_manage_online_examinations');?> · <?php echo html_escape($running_year); ?></p>
            </div>
            <div class="exam-command-actions" aria-label="Online exam actions">
                <a href="<?php echo site_url('teacher/create_online_exam');?>" class="exam-action-create">
                    <i class="entypo-plus"></i> <?php echo get_phrase('add_an_online_exam'); ?>
                </a>
                <a href="<?php echo site_url('teacher/manage_online_exam');?>" class="exam-action-filter <?php echo $status == 'active' ? 'is-active' : ''; ?>">
                    <i class="entypo-check"></i> <?php echo get_phrase('active_exams');?>
                </a>
                <a href="<?php echo site_url('teacher/manage_online_exam/expired');?>" class="exam-action-filter <?php echo $status == 'expired' ? 'is-expired' : ''; ?>">
                    <i class="entypo-clock"></i> <?php echo get_phrase('expired_exams');?>
                </a>
            </div>
        </div>
    </section>

    <section class="exam-kpi-grid" aria-label="Exam status summary">
        <div class="exam-kpi"><span><?php echo get_phrase('total_exams'); ?></span><strong><?php echo (int) $exam_counts['total']; ?></strong></div>
        <div class="exam-kpi"><span><?php echo get_phrase('published'); ?></span><strong><?php echo (int) $exam_counts['published']; ?></strong></div>
        <div class="exam-kpi"><span><?php echo get_phrase('pending'); ?></span><strong><?php echo (int) $exam_counts['pending']; ?></strong></div>
        <div class="exam-kpi"><span><?php echo get_phrase('expired'); ?></span><strong><?php echo (int) $exam_counts['expired']; ?></strong></div>
    </section>

    <section class="exam-table-card">
        <div class="exam-table-wrap">
            <table class="w-full datatable" id="table_export">
                <thead>
                    <tr>
                        <th class="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"><i class="entypo-book-open mr-2"></i><?php echo get_phrase('exam_name');?></th>
                        <th class="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"><i class="entypo-users mr-2"></i><?php echo get_phrase('class_and_section');?></th>
                        <th class="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"><i class="entypo-graduation-cap mr-2"></i><?php echo get_phrase('subject');?></th>
                        <th class="px-6 py-4 text-left text-sm font-semibold uppercase tracking-wider"><i class="entypo-calendar mr-2"></i><?php echo get_phrase('exam_date');?></th>
                        <th class="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider"><i class="entypo-info mr-2"></i><?php echo get_phrase('status');?></th>
                        <th class="px-6 py-4 text-center text-sm font-semibold uppercase tracking-wider"><i class="entypo-cog mr-2"></i><?php echo get_phrase('actions');?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($visible_exams as $row): ?>
                    <tr>
                        <td class="px-6 py-4">
                            <a href="<?php echo site_url('teacher/manage_online_exam_question/').$row['online_exam_id']; ?>" class="exam-name-link">
                                <span class="exam-icon-chip"><i class="entypo-doc-text"></i></span>
                                <span><?php echo html_escape($row['title']); ?></span>
                            </a>
                        </td>
                        <td class="px-6 py-4">
                            <div class="text-sm">
                                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 mb-1"><i class="entypo-graduation-cap mr-1"></i><?php echo html_escape($row['class_display']); ?></span>
                                <br>
                                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800"><i class="entypo-users mr-1"></i><?php echo html_escape($row['section_display']); ?></span>
                            </div>
                        </td>
                        <td class="px-6 py-4"><span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"><?php echo html_escape($row['subject_display']); ?></span></td>
                        <td class="px-6 py-4">
                            <div class="text-sm">
                                <div class="font-semibold text-gray-900 mb-1"><i class="entypo-calendar text-cyan-500 mr-1"></i><?php echo date('M d, Y', (int) $row['exam_date']);?></div>
                                <div class="text-gray-600"><i class="entypo-clock text-cyan-500 mr-1"></i><?php echo html_escape($row['time_start'].' - '.$row['time_end']);?></div>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <?php if($row['status'] == 'published'): ?>
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"><span class="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span><?php echo get_phrase('published');?></span>
                            <?php elseif($row['status'] == 'pending'): ?>
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"><span class="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span><?php echo get_phrase('pending');?></span>
                            <?php else: ?>
                                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"><span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span><?php echo get_phrase('expired');?></span>
                            <?php endif; ?>
                        </td>
                        <td class="px-6 py-4">
                            <div class="exam-action-list">
                                <a href="<?php echo site_url('teacher/manage_online_exam_question/').$row['online_exam_id']; ?>" class="exam-action-questions"><i class="entypo-cog"></i><?php echo get_phrase('questions');?></a>
                                <a href="<?php echo site_url('teacher/update_online_exam/').$row['online_exam_id']; ?>" class="exam-action-edit"><i class="entypo-pencil"></i><?php echo get_phrase('edit');?></a>
                                <?php if ($row['status'] == 'pending'): ?>
                                    <?php echo form_open(site_url('teacher/manage_online_exam_status/'.$row['online_exam_id'].'/published'), ['class' => 'exam-action-form', 'onsubmit' => 'return confirmOnlineExamMutation(this);']); ?>
                                        <button type="submit" class="exam-action-publish"><i class="entypo-share"></i><?php echo get_phrase('publish');?></button>
                                    </form>
                                <?php elseif ($row['status'] == 'published'): ?>
                                    <?php echo form_open(site_url('teacher/manage_online_exam_status/'.$row['online_exam_id'].'/expired'), ['class' => 'exam-action-form', 'onsubmit' => 'return confirmOnlineExamMutation(this);']); ?>
                                        <button type="submit" class="exam-action-cancel"><i class="entypo-cancel"></i><?php echo get_phrase('cancel');?></button>
                                    </form>
                                <?php endif; ?>
                                <a href="<?php echo site_url('teacher/view_online_exam_result/'.$row['online_exam_id']); ?>" class="exam-action-results"><i class="entypo-eye"></i><?php echo get_phrase('results');?></a>
                                <?php echo form_open(site_url('teacher/manage_online_exam/delete/'.$row['online_exam_id']), ['class' => 'exam-action-form', 'onsubmit' => 'return confirmOnlineExamMutation(this);']); ?>
                                    <button type="submit" class="exam-action-delete"><i class="entypo-trash"></i><?php echo get_phrase('delete');?></button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </section>
</div>

<script type="text/javascript">
function confirmOnlineExamMutation(form) {
    var message = <?php echo json_encode(get_phrase('are_you_sure')); ?>;
    if (window.Swal && typeof window.Swal.fire === 'function') {
        window.Swal.fire({
            title: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: <?php echo json_encode(get_phrase('yes')); ?>,
            cancelButtonText: <?php echo json_encode(get_phrase('cancel')); ?>
        }).then(function(result) {
            if (result.isConfirmed) {
                form.submit();
            }
        });
        return false;
    }

    return window.confirm(message);
}

jQuery(document).ready(function($) {
    $('#table_export').dataTable({
        "pageLength": 25,
        "order": [[3, "desc"]],
        "language": {
            "search": "Search exams:",
            "lengthMenu": "Show _MENU_ exams per page",
            "info": "Showing _START_ to _END_ of _TOTAL_ exams",
            "infoEmpty": "No exams available",
            "infoFiltered": "(filtered from _MAX_ total exams)"
        }
    });
});
</script>
