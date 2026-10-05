<?php
$section_row = $this->db->get_where('section', array('class_id' => $class_id))->row();
$section = $section_row ? $section_row->section_id : '';
$account_type = $this->session->userdata('login_type');
$class_row = $this->db->get_where('class', array('class_id' => $class_id))->row();
$class_name = $class_row ? $class_row->name : '';
$class_teacher_id = $class_row ? $class_row->teacher_id : '';
$running_year_local = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
$running_term_local = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
$running_sem_local = $this->db->get_where('settings', array('type' => 'running_sem'))->row()->description;

$subject_filter = array('class_id' => $class_id, 'year' => $running_year_local);
if ($class_name == 'JHSS') {
    $subject_filter['sem'] = $running_sem_local;
} else {
    $subject_filter['term'] = $running_term_local;
}
if ($account_type == 'teacher' && $class_teacher_id != $this->session->userdata('teacher_id')) {
    $subject_filter['teacher_id'] = $this->session->userdata('teacher_id');
}
$subjects = $this->db->get_where('subject', $subject_filter)->result_array();
?>
<input type="hidden" name="section_id" id="section_id" value="<?php echo htmlspecialchars($section); ?>">
<div class="pa-field">
    <label for="subject_id"><?php echo get_phrase('subject'); ?></label>
    <select name="subject_id" id="subject_id" class="form-control selectboxit" required>
        <?php if(empty($subjects)): ?>
            <option value=""><?php echo get_phrase('no_subject_found'); ?></option>
        <?php else: ?>
            <option value=""><?php echo get_phrase('select_subject'); ?></option>
            <?php foreach($subjects as $row): ?>
                <option value="<?php echo (int)$row['subject_id']; ?>"><?php echo htmlspecialchars($row['name']); ?></option>
            <?php endforeach; ?>
        <?php endif; ?>
    </select>
</div>
<div class="pa-action">
    <button type="submit" class="btn btn-primary" id="submit" <?php echo empty($subjects) ? 'disabled' : ''; ?>>
        <i class="fa fa-arrow-right"></i> <?php echo get_phrase('manage_assessment'); ?>
    </button>
</div>
<script>
(function(){
    if ($.isFunction($.fn.selectBoxIt)) {
        $('#subject_holder select.selectboxit').each(function(){
            var $this = $(this);
            if ($this.data('selectBox-selectBoxIt')) return;
            $this.addClass('visible').selectBoxIt({
                showFirstOption: attrDefault($this, 'first-option', true),
                'native': attrDefault($this, 'native', false),
                defaultText: attrDefault($this, 'text', '')
            });
        });
    }
})();
</script>
