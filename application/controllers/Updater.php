<?php
if (!defined('BASEPATH')) {
    exit('No direct script access allowed');
}

/**
 * Legacy Web Updater Compatibility Controller
 *
 * Executable update packages are no longer accepted through the web
 * application. SchoolManager releases are deployed through the approved
 * version-controlled release pipeline and VPS pull deployer.
 */
class Updater extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');

        $this->output->set_header('Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
        $this->output->set_header('Pragma: no-cache');

        if ($this->session->userdata('admin_login') != 1) {
            if ($this->input->is_ajax_request()) {
                $this->output
                    ->set_status_header(401)
                    ->set_content_type('application/json')
                    ->set_output(json_encode([
                        'status' => 'error',
                        'message' => 'Authentication required.'
                    ]));
                $this->output->_display();
                exit;
            }

            redirect(site_url('login'), 'location', 302);
            exit;
        }
    }

    /**
     * Preserve the legacy route without exposing package execution.
     */
    public function index()
    {
        return $this->retired_endpoint();
    }

    /**
     * Legacy update endpoint retained only for compatibility.
     */
    public function update($task = '', $purchase_code = '')
    {
        return $this->retired_endpoint();
    }

    /**
     * Explain the supported release path without processing an upload.
     */
    private function retired_endpoint()
    {
        $message = 'The legacy web updater has been retired. Deploy SchoolManager only through the approved version-controlled release pipeline and VPS deployment process.';

        if ($this->input->is_ajax_request()) {
            return $this->output
                ->set_status_header(410)
                ->set_content_type('application/json')
                ->set_output(json_encode([
                    'status' => 'error',
                    'message' => $message
                ]));
        }

        $this->session->set_flashdata('error_message', $message);
        redirect(site_url('admin/system_settings'), 'location', 302);
        exit;
    }
}
