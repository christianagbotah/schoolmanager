<?php
$running_year = get_settings('running_year');
$running_term = get_settings('running_term');
$running_sem = get_settings('running_sem');
$this->db->select('student_id')->from('enroll')->where('mute','0')->where('year',$running_year);
$this->db->group_start()->where('term',$running_term);
if ($running_sem !== null && $running_sem !== '') $this->db->or_where('sem',$running_sem);
$this->db->group_end();
$active_enrollments = $this->db->get()->result_array();
$student_ids = array_values(array_unique(array_map(function($row){ return (int)$row['student_id']; }, $active_enrollments)));
$students = array();
$parents = array();
if ($student_ids) {
    $students = $this->db->where_in('student_id',$student_ids)->order_by('name','ASC')->get('student')->result_array();
    $parent_ids = array_values(array_unique(array_filter(array_map(function($row){ return isset($row['parent_id']) ? (int)$row['parent_id'] : 0; }, $students))));
    if ($parent_ids) $parents = $this->db->where_in('parent_id',$parent_ids)->order_by('name','ASC')->get('parent')->result_array();
}
$teachers = $this->db->order_by('name','ASC')->get('teacher')->result_array();
$member_groups = array('student'=>$students,'teacher'=>$teachers,'parent'=>$parents);
?>
