<?php
$classes = $this->db->order_by('name_numeric', 'ASC')->get('class')->result_array();
$current_class = null;
foreach ($classes as $class_row) {
    if ((int)$class_row['class_id'] === (int)$class_id) {
        $current_class = $class_row;
        break;
    }
}

$syllabus = $this->db
    ->order_by('timestamp', 'DESC')
    ->get_where('academic_syllabus', [
        'class_id' => $class_id,
        'year' => $running_year
    ])->result_array();
?>
<style>
.syllabus-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px !important;
    background: #f8fafc;
    min-height: 100%;
    color: #334155;
}
.syllabus-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.syllabus-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.syllabus-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px !important;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.syllabus-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.syllabus-add-btn {
    min-height: 44px;
    padding: 10px 15px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
    font-weight: 800 !important;
    box-shadow: none !important;
}
.syllabus-layout {
    display: grid;
    grid-template-columns: 235px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
}
.syllabus-class-panel,
.syllabus-table-card {
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.syllabus-class-panel {
    padding: 8px;
    position: sticky;
    top: 74px;
}
.syllabus-class-panel-title {
    padding: 9px 10px 7px;
    color: #64748b;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .05em;
    text-transform: uppercase;
}
.syllabus-class-list {
    margin: 0;
    padding: 0;
    list-style: none;
}
.syllabus-class-list li { margin: 0 0 4px; }
.syllabus-class-list li:last-child { margin-bottom: 0; }
.syllabus-class-list a {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 8px 10px;
    border-radius: 8px;
    color: #475569;
    font-size: 13px;
    line-height: 1.35;
    font-weight: 700;
    text-decoration: none;
}
.syllabus-class-list a:hover {
    background: #f1f5f9;
    color: #0f172a;
}
.syllabus-class-list li.active a {
    background: #eff6ff;
    color: #1d4ed8;
}
.syllabus-class-dot {
    width: 8px;
    height: 8px;
    flex: 0 0 8px;
    border-radius: 50%;
    background: #cbd5e1;
}
.syllabus-class-list li.active .syllabus-class-dot { background: #2563eb; }
.syllabus-table-card { overflow: hidden; }
.syllabus-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
}
.syllabus-table-head h2 {
    margin: 0;
    color: #0f172a;
    font-size: 17px;
    line-height: 1.35;
    font-weight: 800;
}
.syllabus-count {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 5px 8px;
    border-radius: 999px;
    background: #e2e8f0;
    color: #475569;
    font-size: 12px;
    font-weight: 800;
}
.syllabus-table-shell {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}
.syllabus-table {
    width: 100% !important;
    min-width: 1030px;
    margin: 0 !important;
    border-collapse: collapse !important;
}
.syllabus-table thead th {
    padding: 11px 12px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    background: #fff !important;
    color: #475569 !important;
    font-size: 12px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    text-transform: uppercase;
}
.syllabus-table tbody td {
    padding: 12px !important;
    border-bottom: 1px solid #eef2f7 !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle !important;
}
.syllabus-table tbody tr:hover { background: #f8fbff; }
.syllabus-title-cell {
    color: #0f172a;
    font-weight: 800;
}
.syllabus-description {
    max-width: 280px;
    color: #64748b;
    white-space: normal;
}
.syllabus-file-name {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 180px;
    color: #475569;
    font-size: 13px;
}
.syllabus-file-name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.syllabus-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
    white-space: nowrap;
}
.syllabus-actions .btn {
    min-width: 36px;
    min-height: 34px;
    padding: 6px 9px !important;
    border-radius: 7px !important;
    font-size: 12px !important;
    box-shadow: none !important;
}
.syllabus-empty {
    padding: 40px 18px !important;
    text-align: center;
    color: #64748b !important;
}
@media (max-width: 900px) {
    .syllabus-layout { grid-template-columns: 1fr; }
    .syllabus-class-panel { position: static; overflow-x: auto; }
    .syllabus-class-panel-title { display: none; }
    .syllabus-class-list {
        display: flex;
        gap: 5px;
        min-width: max-content;
    }
    .syllabus-class-list li { margin: 0; }
}
@media (max-width: 767px) {
    .syllabus-workspace { padding: 18px 14px 32px !important; }
    .syllabus-head { display: block; }
    .syllabus-head h1 { font-size: 26px !important; }
    .syllabus-add-btn { width: 100%; margin-top: 14px; }
}
</style>

<div class="syllabus-workspace">
    <div class="syllabus-head">
        <div>
            <p class="syllabus-eyebrow">Academics</p>
            <h1>Academic Syllabus</h1>
            <p>Upload and manage syllabus resources by class and subject for <?php echo html_escape($running_year); ?>.</p>
        </div>
        <button type="button" class="btn btn-primary syllabus-add-btn" onclick="showAjaxModal('<?php echo site_url('modal/popup/academic_syllabus_add'); ?>');">
            <i class="fa fa-plus"></i> <?php echo get_phrase('add_academic_syllabus'); ?>
        </button>
    </div>

    <div class="syllabus-layout">
        <aside class="syllabus-class-panel">
            <div class="syllabus-class-panel-title">Classes</div>
            <ul class="syllabus-class-list">
                <?php foreach ($classes as $class_row):
                    $section = $this->db->get_where('section', ['class_id' => $class_row['class_id']])->row_array();
                    $same_name_count = $this->db->get_where('class', [
                        'name' => $class_row['name'],
                        'name_numeric' => $class_row['name_numeric']
                    ])->num_rows();
                    $section_suffix = ($same_name_count > 1 && !empty($section['name'])) ? ' ' . $section['name'] : '';
                    $class_label = trim($class_row['name'] . ' ' . $class_row['name_numeric'] . $section_suffix);
                ?>
                <li class="<?php echo ((int)$class_row['class_id'] === (int)$class_id) ? 'active' : ''; ?>">
                    <a href="<?php echo site_url('admin/academic_syllabus/' . (int)$class_row['class_id']); ?>">
                        <span class="syllabus-class-dot"></span>
                        <span><?php echo get_phrase('class'); ?> <?php echo html_escape($class_label); ?></span>
                    </a>
                </li>
                <?php endforeach; ?>
            </ul>
        </aside>

        <section class="syllabus-table-card">
            <div class="syllabus-table-head">
                <h2>
                    <?php
                    if ($current_class) {
                        echo 'Class ' . html_escape(trim($current_class['name'] . ' ' . $current_class['name_numeric']));
                    } else {
                        echo 'Syllabus Resources';
                    }
                    ?>
                </h2>
                <span class="syllabus-count"><?php echo count($syllabus); ?> file<?php echo count($syllabus) === 1 ? '' : 's'; ?></span>
            </div>
            <div class="syllabus-table-shell">
                <table class="table syllabus-table">
                    <thead>
                        <tr>
                            <th style="width:55px">#</th>
                            <th><?php echo get_phrase('title'); ?></th>
                            <th><?php echo get_phrase('description'); ?></th>
                            <th><?php echo get_phrase('subject'); ?></th>
                            <th><?php echo get_phrase('uploader'); ?></th>
                            <th style="width:105px"><?php echo get_phrase('date'); ?></th>
                            <th><?php echo get_phrase('file'); ?></th>
                            <th style="width:100px;text-align:right"><?php echo get_phrase('options'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                    <?php if (empty($syllabus)): ?>
                        <tr><td colspan="8" class="syllabus-empty"><i class="fa fa-folder-open"></i> No syllabus files have been uploaded for this class and academic year.</td></tr>
                    <?php else: $count = 1; foreach ($syllabus as $row):
                        $subject = $this->db->get_where('subject', ['subject_id' => $row['subject_id']])->row_array();
                        $uploader = [];
                        if (!empty($row['uploader_type']) && in_array($row['uploader_type'], ['admin','teacher'], true)) {
                            $uploader = $this->db->get_where($row['uploader_type'], [
                                $row['uploader_type'] . '_id' => $row['uploader_id']
                            ])->row_array();
                        }
                    ?>
                        <tr>
                            <td><?php echo $count++; ?></td>
                            <td class="syllabus-title-cell"><?php echo html_escape($row['title']); ?></td>
                            <td class="syllabus-description"><?php echo html_escape($row['description']); ?></td>
                            <td><?php echo html_escape($subject['name'] ?? '—'); ?></td>
                            <td><?php echo html_escape($uploader['name'] ?? ucfirst((string)$row['uploader_type'])); ?></td>
                            <td><?php echo date('d M Y', (int)$row['timestamp']); ?></td>
                            <td>
                                <span class="syllabus-file-name" title="<?php echo html_escape($row['file_name']); ?>">
                                    <i class="fa fa-file"></i><span><?php echo html_escape($row['file_name']); ?></span>
                                </span>
                            </td>
                            <td>
                                <div class="syllabus-actions">
                                    <a class="btn btn-default" title="Download" href="<?php echo site_url('admin/download_academic_syllabus/' . rawurlencode($row['academic_syllabus_code'])); ?>"><i class="fa fa-download"></i></a>
                                    <button type="button" class="btn btn-danger" title="Delete" onclick="confirm_modal('<?php echo site_url('admin/delete_academic_syllabus/' . rawurlencode($row['academic_syllabus_code'])); ?>');"><i class="fa fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; endif; ?>
                    </tbody>
                </table>
            </div>
        </section>
    </div>
</div>
