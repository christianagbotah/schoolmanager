<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Read-only preference endpoint for the cashier POS.
 *
 * Keeps optional-service subscription state separate from payment amounts so
 * collecting arrears or prepaid credit can never opt a student in or out.
 */
class Cashier_preferences extends CI_Controller {

    public function __construct() {
        parent::__construct();

        if ($this->session->userdata('admin_id') == '') {
            redirect(site_url('login'), 'refresh');
        }

        if (!$this->Daily_fee_model->can_collect_daily_fees()) {
            redirect(site_url('login'), 'refresh');
        }

        if ($this->session->userdata('login_type') == 'conductor') {
            redirect(site_url('login'), 'refresh');
        }
    }

    /**
     * Return the current optional daily-fee preferences for one student.
     */
    public function student() {
        $student_id = (int) $this->input->post('student_id');

        if ($student_id <= 0) {
            $this->output->set_status_header(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Invalid student'
            ]);
            return;
        }

        $preferences = $this->Daily_fee_model->get_student_preferences($student_id);

        echo json_encode([
            'status' => 'success',
            'preferences' => $preferences
        ]);
    }
}
