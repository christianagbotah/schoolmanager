<?php
$classes = isset($classes) && is_array($classes) ? $classes : [];
$class_groups = [];
foreach ($classes as $class) {
    $group = trim((string)($class['name'] ?? 'Other')) ?: 'Other';
    if (!isset($class_groups[$group])) {
        $class_groups[$group] = [];
    }
    $class_groups[$group][] = $class;
}
$running_year = get_settings('running_year');
?>
<style>
.student-class-picker{max-width:1240px;margin:0 auto;padding:8px 0 40px}.student-picker-hero{position:relative;overflow:hidden;border-radius:20px;padding:26px 28px;margin-bottom:20px;background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);color:#fff;box-shadow:0 16px 38px rgba(15,23,42,.16)}.student-picker-hero:after{content:'';position:absolute;width:230px;height:230px;border-radius:50%;right:-75px;top:-115px;background:rgba(255,255,255,.1)}.student-picker-hero h2{position:relative;margin:0 0 6px;font-size:27px;font-weight:900}.student-picker-hero p{position:relative;margin:0;max-width:720px;color:rgba(255,255,255,.82)}.student-picker-meta{position:relative;display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.14);font-size:12px;font-weight:800}.student-group{margin:0 0 22px}.student-group-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.student-group-head h3{margin:0;color:#0f172a;font-size:16px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.student-group-head span{color:#64748b;font-size:12px;font-weight:700}.student-class-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.student-class-card{display:flex;align-items:center;justify-content:space-between;gap:14px;min-height:104px;padding:16px 17px;border:1px solid #e2e8f0;border-radius:15px;background:#fff;color:#0f172a;text-decoration:none;box-shadow:0 5px 16px rgba(15,23,42,.04);transition:transform .16s ease,border-color .16s ease,box-shadow .16s ease}.student-class-card:hover,.student-class-card:focus{transform:translateY(-2px);border-color:#93c5fd;box-shadow:0 11px 25px rgba(37,99,235,.11);color:#0f172a;text-decoration:none;outline:none}.student-class-main{min-width:0}.student-class-name{font-size:18px;font-weight:900}.student-class-sections{margin-top:5px;color:#64748b;font-size:12px;white-space:normal}.student-class-open{display:flex;width:38px;height:38px;flex:0 0 38px;border-radius:11px;align-items:center;justify-content:center;background:#eff6ff;color:#2563eb;font-size:16px}.student-empty{padding:38px 20px;border:1px dashed #cbd5e1;border-radius:16px;background:#fff;text-align:center;color:#64748b}.student-empty i{display:block;margin-bottom:10px;font-size:30px;color:#94a3b8}.student-empty strong{display:block;margin-bottom:5px;color:#334155;font-size:16px}@media(max-width:960px){.student-class-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:640px){.student-class-picker{padding-bottom:24px}.student-picker-hero{padding:20px 18px;border-radius:15px}.student-picker-hero h2{font-size:22px}.student-class-grid{grid-template-columns:1fr}.student-class-card{min-height:88px}.student-group-head{align-items:flex-start;flex-direction:column;gap:3px}}
</style>

<div class="student-class-picker">
    <section class="student-picker-hero">
        <h2><i class="fa fa-user-graduate"></i> Choose a class</h2>
        <p>Open a class to view students, profiles, account status, marksheets and the actions available to your role.</p>
        <?php if (!empty($running_year)): ?><div class="student-picker-meta"><i class="fa fa-calendar-alt"></i> Academic year <?php echo html_escape($running_year); ?></div><?php endif; ?>
    </section>

    <?php if (empty($class_groups)): ?>
        <div class="student-empty"><i class="fa fa-school"></i><strong>No classes have been configured yet.</strong><span>Add a class before opening Student Information.</span></div>
    <?php else: ?>
        <?php foreach ($class_groups as $group => $group_classes): ?>
            <section class="student-group">
                <div class="student-group-head"><h3><?php echo html_escape($group); ?></h3><span><?php echo count($group_classes); ?> class<?php echo count($group_classes) === 1 ? '' : 'es'; ?></span></div>
                <div class="student-class-grid">
                    <?php foreach ($group_classes as $class):
                        $class_id = (int)($class['class_id'] ?? 0);
                        $this->db->order_by('name', 'ASC');
                        $sections = $this->db->get_where('section', ['class_id' => $class_id])->result_array();
                        $section_names = [];
                        foreach ($sections as $section) {
                            if (!empty($section['name'])) $section_names[] = $section['name'];
                        }
                        $label = trim($group . ' ' . ($class['name_numeric'] ?? ''));
                        $target = site_url('admin/student_information/' . $class_id);
                    ?>
                    <a class="student-class-card" href="<?php echo html_escape($target); ?>" onclick="event.preventDefault(); navigation('<?php echo html_escape($target); ?>')">
                        <div class="student-class-main">
                            <div class="student-class-name"><?php echo html_escape($label); ?></div>
                            <div class="student-class-sections"><?php echo $section_names ? 'Sections: ' . html_escape(implode(', ', $section_names)) : 'No section assigned'; ?></div>
                        </div>
                        <span class="student-class-open" aria-hidden="true"><i class="fa fa-arrow-right"></i></span>
                    </a>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endforeach; ?>
    <?php endif; ?>
</div>
