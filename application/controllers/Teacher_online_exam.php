<?php
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

require_once APPPATH . 'controllers/Teacher.php';

/**
 * Ownership boundary for teacher Online Exam routes.
 *
 * The legacy Teacher controller remains the source of business logic. This
 * controller validates that the authenticated teacher owns the referenced
 * class/subject/exam before delegating to the existing methods.
 */
class Teacher_online_exam extends Teacher
{
    private function teacher_id()
    {
        return (int) $this->session->userdata('teacher_id');
    }

    private function require_post($json = false)
    {
        if ($this->input->method(true) !== 'POST') {
            $this->output
                ->set_status_header(405)
                ->set_header('Allow: POST');

            if ($json) {
                $this->output
                    ->set_content_type('application/json')
                    ->set_output(json_encode([
                        'status' => 'error',
                        'message' => 'POST required.',
                    ]));
                return false;
            }

            $this->output
                ->set_content_type('text/plain')
                ->set_output('POST required.');
            return false;
        }

        return true;
    }

    private function deny_access($json = false)
    {
        $this->output->set_status_header(403);

        if ($json) {
            $this->output
                ->set_content_type('application/json')
                ->set_output(json_encode([
                    'status' => 'error',
                    'message' => get_phrase('access_denied'),
                ]));
            return false;
        }

        show_error(get_phrase('access_denied'), 403);
        return false;
    }

    private function can_manage_exam($online_exam_id)
    {
        $online_exam_id = (int) $online_exam_id;
        $teacher_id = $this->teacher_id();
        if ($online_exam_id <= 0 || $teacher_id <= 0) {
            return false;
        }

        $exam = $this->db->get_where('online_exam', ['online_exam_id' => $online_exam_id])->row_array();
        if (!$exam) {
            return false;
        }

        $class_id = (int) ($exam['class_id'] ?? 0);
        $subject_id = (int) ($exam['subject_id'] ?? 0);
        $section_id = (int) ($exam['section_id'] ?? 0);
        if ($class_id <= 0 || $subject_id <= 0 || $section_id <= 0) {
            return false;
        }

        $class = $this->db->get_where('class', ['class_id' => $class_id])->row_array();
        $subject = $this->db->get_where('subject', [
            'subject_id' => $subject_id,
            'class_id' => $class_id,
        ])->row_array();
        $section = $this->db->get_where('section', [
            'section_id' => $section_id,
            'class_id' => $class_id,
        ])->row_array();

        if (!$class || !$subject || !$section) {
            return false;
        }

        $class_teacher_id = (int) ($class['teacher_id'] ?? 0);
        $subject_teacher_id = (int) ($subject['teacher_id'] ?? 0);

        return $class_teacher_id === $teacher_id || $subject_teacher_id === $teacher_id;
    }

    private function can_manage_selection($class_id, $section_id, $subject_id)
    {
        $class_id = (int) $class_id;
        $section_id = (int) $section_id;
        $subject_id = (int) $subject_id;
        $teacher_id = $this->teacher_id();

        if ($class_id <= 0 || $section_id <= 0 || $subject_id <= 0 || $teacher_id <= 0) {
            return false;
        }

        $class = $this->db->get_where('class', ['class_id' => $class_id])->row_array();
        $section = $this->db->get_where('section', [
            'section_id' => $section_id,
            'class_id' => $class_id,
        ])->row_array();
        $subject = $this->db->get_where('subject', [
            'subject_id' => $subject_id,
            'class_id' => $class_id,
        ])->row_array();

        if (!$class || !$section || !$subject) {
            return false;
        }

        $class_teacher_id = (int) ($class['teacher_id'] ?? 0);
        $subject_teacher_id = (int) ($subject['teacher_id'] ?? 0);

        return $class_teacher_id === $teacher_id || $subject_teacher_id === $teacher_id;
    }

    private function question_exam_id($question_id)
    {
        $question = $this->db->get_where('question_bank', [
            'question_bank_id' => (int) $question_id,
        ])->row_array();

        return $question ? (int) ($question['online_exam_id'] ?? 0) : 0;
    }

    public function manage_online_exam($param1 = '', $param2 = '')
    {
        if ($param1 === 'create') {
            if (!$this->can_manage_selection(
                $this->input->post('class_id'),
                $this->input->post('section_id'),
                $this->input->post('subject_id')
            )) {
                $this->deny_access(true);
                return;
            }
        }

        if ($param1 === 'edit') {
            $online_exam_id = (int) $this->input->post('online_exam_id');
            if (!$this->can_manage_exam($online_exam_id) || !$this->can_manage_selection(
                $this->input->post('class_id'),
                $this->input->post('section_id'),
                $this->input->post('subject_id')
            )) {
                $this->deny_access(true);
                return;
            }
        }

        if ($param1 === 'delete') {
            if (!$this->require_post()) {
                return;
            }

            if (!$this->can_manage_exam($param2)) {
                $this->deny_access();
                return;
            }
        }

        parent::manage_online_exam($param1, $param2);
    }

    public function update_online_exam($param1 = '')
    {
        if (!$this->can_manage_exam($param1)) {
            $this->deny_access();
            return;
        }

        parent::update_online_exam($param1);
    }

    public function manage_online_exam_status($online_exam_id = '', $status = '')
    {
        if (!$this->require_post()) {
            return;
        }

        $allowed_statuses = ['published', 'expired'];
        if (!in_array($status, $allowed_statuses, true)) {
            show_error(get_phrase('invalid_status'), 400);
            return;
        }

        if (!$this->can_manage_exam($online_exam_id)) {
            $this->deny_access();
            return;
        }

        parent::manage_online_exam_status($online_exam_id, $status);
    }

    public function load_question_type($type, $online_exam_id)
    {
        if (!$this->can_manage_exam($online_exam_id)) {
            $this->deny_access();
            return;
        }

        parent::load_question_type($type, $online_exam_id);
    }

    public function manage_online_exam_question($online_exam_id = '', $task = '', $type = '')
    {
        if (!$this->can_manage_exam($online_exam_id)) {
            $this->deny_access();
            return;
        }

        parent::manage_online_exam_question($online_exam_id, $task, $type);
    }

    public function update_online_exam_question($question_id = '', $task = '', $online_exam_id = '')
    {
        $parent_exam_id = $this->question_exam_id($question_id);
        if ($parent_exam_id <= 0 || !$this->can_manage_exam($parent_exam_id)) {
            $this->deny_access();
            return;
        }

        parent::update_online_exam_question($question_id, $task, $parent_exam_id);
    }

    public function delete_question_from_online_exam($question_id)
    {
        if (!$this->require_post()) {
            return;
        }

        $parent_exam_id = $this->question_exam_id($question_id);
        if ($parent_exam_id <= 0 || !$this->can_manage_exam($parent_exam_id)) {
            $this->deny_access();
            return;
        }

        parent::delete_question_from_online_exam($question_id);
    }

    public function view_online_exam_result($online_exam_id)
    {
        if (!$this->can_manage_exam($online_exam_id)) {
            $this->deny_access();
            return;
        }

        parent::view_online_exam_result($online_exam_id);
    }
}
