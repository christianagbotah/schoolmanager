<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Sync Locations Controller
 *
 * Privileged administration of the multi-location sync registry.
 */
class Sync_locations extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');

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

        $admin_id = (int) $this->session->userdata('admin_id');
        $admin = $this->db
            ->select('level')
            ->from('admin')
            ->where('admin_id', $admin_id)
            ->get()
            ->row();

        if (!$admin || (int) $admin->level !== 1) {
            if ($this->input->is_ajax_request()) {
                $this->output
                    ->set_status_header(403)
                    ->set_content_type('application/json')
                    ->set_output(json_encode([
                        'status' => 'error',
                        'message' => 'Super administrator permission required.'
                    ]));
                $this->output->_display();
                exit;
            }

            $this->session->set_flashdata('error_message', 'Super administrator permission required.');
            redirect(site_url('admin/dashboard'), 'location', 302);
            exit;
        }

        $this->check_sync_enabled();
        $this->load->model('Location_registry_model');
    }

    private function check_sync_enabled() {
        $this->config->load('sync', TRUE);
        $setting = $this->db->get_where('settings', ['type' => 'offline_online_mode'])->row();

        if ($setting) {
            $sync_enabled = ($setting->description === '1' || $setting->description === 1);
        } else {
            $sync_enabled = $this->config->item('sync_enabled', 'sync') ?? TRUE;
        }

        if (!$sync_enabled) {
            $this->session->set_flashdata('error_message', get_phrase('sync_module_disabled'));
            redirect(site_url('admin/dashboard'), 'location', 302);
            exit;
        }
    }

    private function require_post() {
        if ($this->input->method(true) !== 'POST') {
            $this->output
                ->set_status_header(405)
                ->set_header('Allow: POST')
                ->set_content_type('application/json')
                ->set_output(json_encode([
                    'status' => 'error',
                    'message' => 'POST required.'
                ]));
            $this->output->_display();
            exit;
        }
    }

    /**
     * Validate a location API endpoint before it is stored or requested.
     * Only public HTTPS endpoints are allowed. Resolving the host here also
     * allows the connection test to pin curl to the validated public address.
     */
    private function validate_api_endpoint($endpoint, &$normalized = null, &$resolved_ips = [], &$error = null) {
        $endpoint = trim((string) $endpoint);
        $normalized = $endpoint;
        $resolved_ips = [];
        $error = null;

        if ($endpoint === '') {
            return true;
        }

        if (!filter_var($endpoint, FILTER_VALIDATE_URL)) {
            $error = 'API endpoint must be a valid URL.';
            return false;
        }

        $parts = parse_url($endpoint);
        if (!$parts || strtolower($parts['scheme'] ?? '') !== 'https' || empty($parts['host'])) {
            $error = 'API endpoint must use HTTPS.';
            return false;
        }

        if (isset($parts['user']) || isset($parts['pass']) || isset($parts['fragment'])) {
            $error = 'API endpoint must not contain credentials or a URL fragment.';
            return false;
        }

        $host = strtolower($parts['host']);
        if ($host === 'localhost' || substr($host, -6) === '.local') {
            $error = 'API endpoint must resolve to a public network address.';
            return false;
        }

        if (filter_var($host, FILTER_VALIDATE_IP)) {
            $resolved_ips = [$host];
        } else {
            $resolved_ips = gethostbynamel($host) ?: [];
        }

        if (empty($resolved_ips)) {
            $error = 'API endpoint hostname could not be resolved.';
            return false;
        }

        foreach ($resolved_ips as $ip) {
            if (!filter_var(
                $ip,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
            )) {
                $error = 'API endpoint must resolve only to public network addresses.';
                return false;
            }
        }

        $normalized = rtrim($endpoint, '/');
        return true;
    }

    public function index() {
        $locations = $this->db->order_by('priority', 'DESC')
                             ->order_by('created_at', 'DESC')
                             ->get('location_registry')
                             ->result_array();

        $page_data['locations'] = $locations;
        $page_data['stats'] = $this->Location_registry_model->get_location_stats();
        $page_data['csrf_token_name'] = $this->security->get_csrf_token_name();
        $page_data['csrf_token_hash'] = $this->security->get_csrf_hash();
        $page_data['page_name'] = 'sync_locations';
        $page_data['page_title'] = get_phrase('sync_locations');

        $this->load->view('backend/main', $page_data);
    }

    public function add() {
        $this->load->view('backend/admin/modal_sync_location_add');
    }

    public function modal_add() {
        $this->load->view('backend/admin/modal_sync_location_add');
    }

    public function create() {
        $this->require_post();
        $this->load->library('form_validation');

        $this->form_validation->set_rules('location_name', 'Location Name', 'required|trim');
        $this->form_validation->set_rules('device_id', 'Device ID', 'required|trim|is_unique[location_registry.device_id]');
        $this->form_validation->set_rules('status', 'Status', 'required|in_list[active,inactive,suspended]');
        $this->form_validation->set_rules('priority', 'Priority', 'required|integer|greater_than[0]|less_than_equal_to[100]');
        $this->form_validation->set_rules('sync_enabled', 'Sync Enabled', 'required|in_list[0,1]');

        if ($this->form_validation->run() == FALSE) {
            return $this->respond_error(validation_errors(), 'admin/sync_locations');
        }

        $endpoint = $this->input->post('api_endpoint', TRUE);
        $normalized_endpoint = '';
        $resolved_ips = [];
        $endpoint_error = null;
        if (!$this->validate_api_endpoint($endpoint, $normalized_endpoint, $resolved_ips, $endpoint_error)) {
            return $this->respond_error($endpoint_error, 'admin/sync_locations');
        }

        $data = [
            'location_name' => $this->input->post('location_name', TRUE),
            'device_id' => $this->input->post('device_id', TRUE),
            'description' => $this->input->post('description', TRUE),
            'api_endpoint' => $normalized_endpoint,
            'status' => $this->input->post('status', TRUE),
            'priority' => (int) $this->input->post('priority', TRUE),
            'sync_enabled' => (int) $this->input->post('sync_enabled', TRUE),
            'sync_interval' => $this->input->post('sync_interval', TRUE) ? (int) $this->input->post('sync_interval', TRUE) : 15,
            'contact_email' => $this->input->post('contact_email', TRUE),
            'contact_phone' => $this->input->post('contact_phone', TRUE),
            'timezone' => $this->input->post('timezone', TRUE) ?: 'UTC',
            'created_at' => date('Y-m-d H:i:s')
        ];

        $result = $this->Location_registry_model->insert($data);
        return $this->respond_result($result, 'Location added successfully', 'Failed to add location. Please try again.');
    }

    public function edit($location_id = null) {
        if (!$location_id) {
            return $this->redirect_error('Invalid location ID');
        }

        $location = $this->Location_registry_model->get_location($location_id);
        if (!$location) {
            return $this->redirect_error('Location not found');
        }

        $page_data['location'] = $location;
        $page_data['page_name'] = 'sync_location_edit';
        $page_data['page_title'] = get_phrase('edit_location');
        $this->load->view('backend/main', $page_data);
    }

    public function modal_edit($location_id = null) {
        if (!$location_id) {
            echo '<div class="alert alert-danger">Invalid location ID</div>';
            return;
        }

        $location = $this->Location_registry_model->get_location($location_id);
        if (!$location) {
            echo '<div class="alert alert-danger">Location not found</div>';
            return;
        }

        $data['location'] = $location;
        $this->load->view('backend/admin/modal_sync_location_edit', $data);
    }

    public function update($location_id = null) {
        $this->require_post();
        if (!$location_id) {
            return $this->respond_error('Invalid location ID', 'admin/sync_locations');
        }

        $this->load->library('form_validation');
        $this->form_validation->set_rules('location_name', 'Location Name', 'required|trim');
        if ($this->form_validation->run() == FALSE) {
            return $this->respond_error(validation_errors(), 'admin/sync_locations/edit/' . $location_id);
        }

        $endpoint = $this->input->post('api_endpoint', TRUE);
        $normalized_endpoint = '';
        $resolved_ips = [];
        $endpoint_error = null;
        if (!$this->validate_api_endpoint($endpoint, $normalized_endpoint, $resolved_ips, $endpoint_error)) {
            return $this->respond_error($endpoint_error, 'admin/sync_locations/edit/' . $location_id);
        }

        $data = [
            'location_name' => $this->input->post('location_name', TRUE),
            'api_endpoint' => $normalized_endpoint,
            'status' => $this->input->post('status', TRUE),
            'priority' => (int) $this->input->post('priority', TRUE),
            'contact_email' => $this->input->post('contact_email', TRUE),
            'contact_phone' => $this->input->post('contact_phone', TRUE),
            'timezone' => $this->input->post('timezone', TRUE),
            'sync_enabled' => $this->input->post('sync_enabled') ? 1 : 0,
            'sync_interval' => $this->input->post('sync_interval', TRUE) ? (int) $this->input->post('sync_interval', TRUE) : 15,
            'description' => $this->input->post('description', TRUE)
        ];

        $result = $this->Location_registry_model->update($location_id, $data);
        return $this->respond_result($result, 'Location updated successfully', 'Failed to update location');
    }

    public function view($location_id = null) {
        if (!$location_id) {
            return $this->redirect_error('Invalid location ID');
        }

        $location = $this->Location_registry_model->get_location($location_id);
        if (!$location) {
            return $this->redirect_error('Location not found');
        }

        $sync_history = [];
        if (!empty($location->device_id)) {
            $sync_history = $this->db->group_start()
                                     ->where('source_device_id', $location->device_id)
                                     ->or_where('target_device_id', $location->device_id)
                                     ->group_end()
                                     ->order_by('synced_at', 'DESC')
                                     ->limit(50)
                                     ->get('sync_audit_log')
                                     ->result_array();
        }

        $conflicts = [];
        if ($this->db->field_exists('location_id', 'sync_conflicts')) {
            $conflicts = $this->db->where('location_id', $location_id)
                                 ->where('status', 'pending')
                                 ->order_by('detected_at', 'DESC')
                                 ->get('sync_conflicts')
                                 ->result_array();
        }

        $page_data['location'] = $location;
        $page_data['sync_history'] = $sync_history;
        $page_data['conflicts'] = $conflicts;
        $page_data['page_name'] = 'sync_location_view';
        $page_data['page_title'] = $location->location_name;
        $this->load->view('backend/main', $page_data);
    }

    public function delete($location_id = null) {
        $this->require_post();
        if (!$location_id) {
            return $this->respond_error('Invalid location ID', 'admin/sync_locations');
        }

        $current_location = $this->Location_registry_model->get_current_location();
        if ($current_location && $current_location->id == $location_id) {
            return $this->respond_error('Cannot delete the current location', 'admin/sync_locations');
        }

        $result = $this->db->where('id', $location_id)->delete('location_registry');
        return $this->respond_result($result, 'Location deleted successfully', 'Failed to delete location');
    }

    public function activate($location_id = null) {
        $this->require_post();
        if (!$location_id) {
            return $this->respond_error('Invalid location ID', 'admin/sync_locations');
        }

        $result = $this->Location_registry_model->activate_location($location_id);
        return $this->respond_result($result, 'Location activated successfully', 'Failed to activate location');
    }

    public function deactivate($location_id = null) {
        $this->require_post();
        if (!$location_id) {
            return $this->respond_error('Invalid location ID', 'admin/sync_locations');
        }

        $current_location = $this->Location_registry_model->get_current_location();
        if ($current_location && $current_location->id == $location_id) {
            return $this->respond_error('Cannot deactivate the current location', 'admin/sync_locations');
        }

        $result = $this->Location_registry_model->deactivate_location($location_id);
        return $this->respond_result($result, 'Location deactivated successfully', 'Failed to deactivate location');
    }

    public function test_connection($location_id = null) {
        $this->require_post();
        $this->output->set_content_type('application/json');

        if (!$location_id) {
            return $this->output->set_output(json_encode(['success' => false, 'message' => 'Invalid location ID']));
        }

        $location = $this->Location_registry_model->get_location($location_id);
        if (!$location) {
            return $this->output->set_output(json_encode(['success' => false, 'message' => 'Location not found']));
        }

        if (empty($location->api_endpoint)) {
            return $this->output->set_output(json_encode(['success' => false, 'message' => 'No API endpoint configured']));
        }

        $endpoint = '';
        $resolved_ips = [];
        $endpoint_error = null;
        if (!$this->validate_api_endpoint($location->api_endpoint, $endpoint, $resolved_ips, $endpoint_error)) {
            return $this->output
                ->set_status_header(422)
                ->set_output(json_encode(['success' => false, 'message' => $endpoint_error]));
        }

        $parts = parse_url($endpoint);
        $host = $parts['host'];
        $port = isset($parts['port']) ? (int) $parts['port'] : 443;
        $health_url = $endpoint . '/sync_server/health_check';
        $resolve_entry = $host . ':' . $port . ':' . $resolved_ips[0];

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $health_url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
        curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTPS);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        curl_setopt($ch, CURLOPT_RESOLVE, [$resolve_entry]);

        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);

        if ($response !== false && $http_code == 200) {
            return $this->output->set_output(json_encode([
                'success' => true,
                'message' => 'Connection successful'
            ]));
        }

        log_message('warning', '[Sync Locations] Connection test failed for location ' . $location_id . ': ' . $curl_error . ' HTTP ' . $http_code);
        return $this->output->set_output(json_encode([
            'success' => false,
            'message' => 'Connection failed (HTTP ' . $http_code . ')'
        ]));
    }

    private function respond_result($result, $success_message, $error_message) {
        if ($this->input->is_ajax_request()) {
            $this->output->set_content_type('application/json');
            return $this->output->set_output(json_encode([
                'status' => $result ? 'success' : 'error',
                'message' => $result ? $success_message : $error_message
            ]));
        }

        $this->session->set_flashdata($result ? 'flash_message' : 'error_message', $result ? $success_message : $error_message);
        redirect(site_url('admin/sync_locations'), 'location', 302);
    }

    private function respond_error($message, $redirect_path) {
        if ($this->input->is_ajax_request()) {
            $this->output->set_content_type('application/json');
            return $this->output->set_output(json_encode([
                'status' => 'error',
                'message' => $message
            ]));
        }

        $this->session->set_flashdata('error_message', $message);
        redirect(site_url($redirect_path), 'location', 302);
    }

    private function redirect_error($message) {
        $this->session->set_flashdata('error_message', $message);
        redirect(site_url('admin/sync_locations'), 'location', 302);
    }
}
