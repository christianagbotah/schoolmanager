<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Legacy approval endpoint compatibility controller.
 *
 * The application now uses the canonical finance approval workflow under
 * Admin::manageRequestApproval plus the dedicated invoice/receipt modification
 * workflows. The former generic approval engine duplicated those state machines
 * and interpreted enum workflow fields as booleans, so its mutating endpoints
 * are intentionally retired.
 */
class Approval_requests extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');

        if ($this->session->userdata('admin_login') != 1) {
            redirect(site_url('login'), 'refresh');
            exit;
        }
    }

    public function index() {
        redirect(site_url('admin/manageRequestApproval'), 'refresh');
    }

    public function request_approval() {
        return $this->retired_endpoint();
    }

    public function get_pending_requests() {
        return $this->retired_endpoint();
    }

    public function handle_request() {
        return $this->retired_endpoint();
    }

    public function check_permission() {
        return $this->retired_endpoint();
    }

    public function auto_lock_records() {
        return $this->retired_endpoint();
    }

    private function retired_endpoint() {
        return $this->output
            ->set_status_header(410)
            ->set_content_type('application/json')
            ->set_output(json_encode([
                'status' => 'error',
                'message' => 'This legacy approval endpoint has been retired. Use the current Finance approval workflow.'
            ]));
    }
}
