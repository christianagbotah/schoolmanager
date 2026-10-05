<?php
$running_year_query = $this->db->get_where('settings', array('type' => 'running_year'));
$running_year = $running_year_query->num_rows() > 0 ? $running_year_query->row()->description : date('Y');

$this->db->select('s.student_id, s.name, s.student_code, s.sex, s.address, e.class_id, c.name as class_name');
$this->db->from('student s');
$this->db->join('enroll e', 's.student_id = e.student_id', 'left');
$this->db->join('class c', 'e.class_id = c.class_id', 'left');
$this->db->where('s.special_diet', '1');
if ($running_year) {
    $this->db->where('e.year', $running_year);
}
$this->db->group_by('s.student_id');
$this->db->order_by('s.name', 'ASC');
$students = $this->db->get()->result_array();
$total_students = count($students);
?>

<style>
.special-diet-page { --sd-border:#e5e7eb; --sd-text:#172033; --sd-muted:#667085; --sd-accent:#b7791f; }
.special-diet-page .sd-hero,
.special-diet-page .sd-toolbar,
.special-diet-page .sd-student-card,
.special-diet-page .sd-empty {
    background:#fff;
    border:1px solid var(--sd-border);
    border-radius:16px;
    box-shadow:0 1px 2px rgba(16,24,40,.05);
}
.special-diet-page .sd-hero { padding:24px; margin-bottom:18px; }
.special-diet-page .sd-hero-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.special-diet-page .sd-title-wrap { display:flex; align-items:center; gap:14px; min-width:0; }
.special-diet-page .sd-icon {
    width:52px; height:52px; border-radius:14px; display:flex; align-items:center; justify-content:center;
    flex:0 0 52px; background:#fff7e6; color:var(--sd-accent); font-size:22px; border:1px solid #f7dfad;
}
.special-diet-page .sd-title { margin:0; color:var(--sd-text); font-size:26px; line-height:1.2; font-weight:700; }
.special-diet-page .sd-subtitle { margin:6px 0 0; color:var(--sd-muted); font-size:15px; line-height:1.5; }
.special-diet-page .sd-total {
    min-width:145px; padding:12px 16px; border-radius:12px; background:#f8fafc; border:1px solid var(--sd-border); text-align:right;
}
.special-diet-page .sd-total strong { display:block; color:var(--sd-text); font-size:26px; line-height:1; }
.special-diet-page .sd-total span { display:block; margin-top:5px; color:var(--sd-muted); font-size:14px; font-weight:600; }
.special-diet-page .sd-toolbar { padding:16px; margin-bottom:18px; }
.special-diet-page .sd-search-wrap { position:relative; max-width:640px; }
.special-diet-page .sd-search-wrap i { position:absolute; left:15px; top:50%; transform:translateY(-50%); color:#98a2b3; }
.special-diet-page .sd-search {
    width:100%; height:44px; padding:10px 14px 10px 42px; border:1.5px solid var(--sd-border); border-radius:10px;
    font-size:14px; color:var(--sd-text); background:#fff; transition:border-color .15s, box-shadow .15s;
}
.special-diet-page .sd-search:focus { outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.14); }
.special-diet-page .sd-student-card { padding:16px 18px; margin-bottom:12px; }
.special-diet-page .sd-student-row { display:flex; align-items:center; justify-content:space-between; gap:18px; }
.special-diet-page .sd-person { display:flex; align-items:center; gap:14px; min-width:0; }
.special-diet-page .sd-avatar { width:58px; height:58px; border-radius:12px; object-fit:cover; border:1px solid var(--sd-border); background:#f8fafc; }
.special-diet-page .sd-name { margin:0 0 7px; color:var(--sd-text); font-size:16px; font-weight:700; }
.special-diet-page .sd-meta { display:flex; flex-wrap:wrap; gap:7px 14px; color:var(--sd-muted); font-size:14px; }
.special-diet-page .sd-meta span { display:inline-flex; align-items:center; gap:6px; }
.special-diet-page .sd-meta i { color:#7c8799; }
.special-diet-page .sd-actions { display:flex; align-items:center; justify-content:flex-end; gap:9px; flex-wrap:wrap; }
.special-diet-page .sd-badge {
    min-height:36px; padding:8px 12px; display:inline-flex; align-items:center; gap:7px; border-radius:999px;
    background:#fff7e6; color:#8a5b12; border:1px solid #f7dfad; font-size:13px; font-weight:700;
}
.special-diet-page .sd-view {
    min-height:40px; padding:9px 14px; display:inline-flex; align-items:center; gap:7px; border-radius:10px;
    background:#2563eb; border:1px solid #2563eb; color:#fff; font-size:14px; font-weight:700; text-decoration:none;
}
.special-diet-page .sd-view:hover, .special-diet-page .sd-view:focus { background:#1d4ed8; border-color:#1d4ed8; color:#fff; text-decoration:none; }
.special-diet-page .sd-empty { padding:48px 24px; text-align:center; color:var(--sd-muted); }
.special-diet-page .sd-empty i { font-size:44px; color:#cbd5e1; margin-bottom:12px; }
.special-diet-page .sd-empty h3 { margin:0 0 8px; color:var(--sd-text); font-size:20px; }
.special-diet-page .sd-empty p { margin:0; font-size:14px; }
@media (max-width:767px) {
    .special-diet-page .sd-hero { padding:18px; }
    .special-diet-page .sd-hero-row, .special-diet-page .sd-student-row { align-items:flex-start; flex-direction:column; }
    .special-diet-page .sd-total { width:100%; text-align:left; }
    .special-diet-page .sd-actions { width:100%; justify-content:flex-start; }
    .special-diet-page .sd-view { flex:1 1 auto; justify-content:center; }
    .special-diet-page .sd-title { font-size:22px; }
}
</style>

<div class="special-diet-page">
    <section class="sd-hero" aria-labelledby="specialDietTitle">
        <div class="sd-hero-row">
            <div class="sd-title-wrap">
                <div class="sd-icon" aria-hidden="true"><i class="fa fa-cutlery"></i></div>
                <div>
                    <h2 class="sd-title" id="specialDietTitle"><?php echo get_phrase('students_on_special_diet'); ?></h2>
                    <p class="sd-subtitle">Students requiring special dietary consideration in <?php echo htmlspecialchars($running_year, ENT_QUOTES, 'UTF-8'); ?>.</p>
                </div>
            </div>
            <div class="sd-total" aria-label="Total special diet students">
                <strong><?php echo (int) $total_students; ?></strong>
                <span><?php echo get_phrase('total_students'); ?></span>
            </div>
        </div>
    </section>

    <div class="sd-toolbar">
        <div class="sd-search-wrap">
            <i class="fa fa-search" aria-hidden="true"></i>
            <input type="search" id="searchInput" class="sd-search" autocomplete="off" placeholder="Search by name, ID, class or address" aria-label="Search special diet students">
        </div>
    </div>

    <div id="studentsContainer">
        <?php if ($total_students > 0): ?>
            <?php foreach ($students as $student):
                $student_name = isset($student['name']) ? $student['name'] : '';
                $student_code = isset($student['student_code']) ? $student['student_code'] : '';
                $class_name = isset($student['class_name']) ? $student['class_name'] : '';
                $address = isset($student['address']) ? $student['address'] : '';
                $search_data = strtolower($student_name . ' ' . $student_code . ' ' . $class_name . ' ' . $address);
            ?>
                <article class="sd-student-card" data-search="<?php echo htmlspecialchars($search_data, ENT_QUOTES, 'UTF-8'); ?>">
                    <div class="sd-student-row">
                        <div class="sd-person">
                            <img src="<?php echo htmlspecialchars($this->crud_model->get_image_url('student', $student['student_id'], $student['sex']), ENT_QUOTES, 'UTF-8'); ?>"
                                 class="sd-avatar"
                                 alt="<?php echo htmlspecialchars($student_name, ENT_QUOTES, 'UTF-8'); ?>">
                            <div>
                                <h3 class="sd-name"><?php echo htmlspecialchars($student_name, ENT_QUOTES, 'UTF-8'); ?></h3>
                                <div class="sd-meta">
                                    <span><i class="fa fa-id-card"></i><?php echo htmlspecialchars($student_code ?: '-', ENT_QUOTES, 'UTF-8'); ?></span>
                                    <?php if ($class_name !== ''): ?><span><i class="fa fa-graduation-cap"></i><?php echo htmlspecialchars($class_name, ENT_QUOTES, 'UTF-8'); ?></span><?php endif; ?>
                                    <?php if ($address !== ''): ?><span><i class="fa fa-map-marker"></i><?php echo htmlspecialchars($address, ENT_QUOTES, 'UTF-8'); ?></span><?php endif; ?>
                                </div>
                            </div>
                        </div>
                        <div class="sd-actions">
                            <span class="sd-badge"><i class="fa fa-cutlery"></i><?php echo get_phrase('special_diet'); ?></span>
                            <a href="<?php echo site_url('admin/student_profile/' . $student['student_id']); ?>" class="sd-view">
                                <i class="fa fa-eye"></i><?php echo get_phrase('view_profile'); ?>
                            </a>
                        </div>
                    </div>
                </article>
            <?php endforeach; ?>
        <?php else: ?>
            <div class="sd-empty">
                <i class="fa fa-cutlery" aria-hidden="true"></i>
                <h3><?php echo get_phrase('no_students_on_special_diet'); ?></h3>
                <p>There are currently no students marked as requiring special dietary consideration for this academic year.</p>
            </div>
        <?php endif; ?>
    </div>

    <div id="noResults" style="display:none;">
        <div class="sd-empty">
            <i class="fa fa-search" aria-hidden="true"></i>
            <h3><?php echo get_phrase('no_results_found'); ?></h3>
            <p>Try a different name, student ID, class or address.</p>
        </div>
    </div>
</div>

<script type="text/javascript">
$(document).ready(function() {
    $('#searchInput').on('input', function() {
        var searchTerm = $.trim($(this).val().toLowerCase());
        var visibleCount = 0;

        $('.sd-student-card').each(function() {
            var searchData = String($(this).attr('data-search') || '');
            var matches = searchData.indexOf(searchTerm) !== -1;
            $(this).toggle(matches);
            if (matches) visibleCount++;
        });

        $('#noResults').toggle(searchTerm !== '' && visibleCount === 0);
    });
});
</script>
