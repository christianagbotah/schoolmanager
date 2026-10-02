<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Sync Controller
 * Handles sync API endpoints
 *
 * SECURITY (sync hardening P0):
 * All methods now require an authenticated user session. The browser offline
 * layer (offline-cache.js / offline-sync.js / offline-crud.js) only runs inside
 * the authenticated backend shell, so legitimate offline flows keep working
 * while anonymous access to student/invoice/payment data is blocked.
 * push()/batch_push() also enforce a server-side table allowlist per the
 * "dynamic table safety" requirement.
 */
class Sync extends CI_Controller {

    /**
     * Tables that may be written/read through the browser offline sync surface.
     * Mirrors the offline client surface (offline-db.js stores + offline-crud.js map).
     * Extend deliberately — never accept arbitrary client-supplied table names.
     */
    const ALLOWED_SYNC_TABLES = [
        'student', 'teacher', 'class', 'invoice', 'payment',
        // plural aliases used by the IndexedDB store names
        'students', 'teachers', 'classes', 'invoices', 'payments'
    ];

    public function __construct() {
        parent::__construct();
        $this->load->library('sync_manager');
        $this->load->library('session');
    }

    /**
     * Require an authenticated backend session (any role).
     * Uses the session keys this application actually sets (login_type / login_user_id).
     * Returns TRUE when authenticated; otherwise emits a JSON 401 and returns FALSE.
     */
    private function require_authenticated_session() {
        $login_type = $this->session->userdata('login_type');
        $login_user_id = $this->session->userdata('login_user_id');
        if (empty($login_type) || empty($login_user_id)) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Unauthorized']);
            return false;
        }
        return true;
    }

    /**
     * Normalize and validate a client-supplied table name against the allowlist.
     * Returns the normalized (singular) table name, or NULL when not allowed.
     */
    private function resolve_allowed_table($table) {
        if (!is_string($table) || $table === '') {
            return null;
        }
        $table = strtolower(trim($table));
        if (!in_array($table, self::ALLOWED_SYNC_TABLES, true)) {
            return null;
        }
        // plural alias -> real table name
        $plural_map = [
            'students' => 'student', 'teachers' => 'teacher', 'classes' => 'class',
            'invoices' => 'invoice', 'payments' => 'payment'
        ];
        return $plural_map[$table] ?? $table;
    }

    /**
     * Sync endpoint for client data (batch support)
     */
    public function push() {
        header('Content-Type: application/json');

        if (!$this->require_authenticated_session()) {
            return;
        }

        if ($this->input->method() !== 'post') {
            echo json_encode(['success' => false, 'message' => 'Invalid request method']);
            return;
        }
        
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        
        if (!$data) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            return;
        }

        // Handle batch sync
        if (isset($data['batch']) && is_array($data['batch'])) {
            $results = [];
            foreach ($data['batch'] as $item) {
                $item = $this->guard_sync_item($item);
                if ($item === null) {
                    $results[] = ['success' => false, 'message' => 'Invalid data'];
                    continue;
                }
                $results[] = $this->sync_manager->process_sync_data($item);
            }
            echo json_encode(['success' => true, 'results' => $results]);
            return;
        }

        $data = $this->guard_sync_item($data);
        if ($data === null) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            return;
        }
        $result = $this->sync_manager->process_sync_data($data);
        echo json_encode($result);
    }

    /**
     * Apply table allowlist to a sync payload before it reaches the manager.
     * Returns the (possibly normalized) payload, or NULL when rejected.
     */
    private function guard_sync_item($item) {
        if (!is_array($item)) {
            return null;
        }
        $table = $item['table'] ?? $item['table_name'] ?? null;
        $resolved = $this->resolve_allowed_table($table);
        if ($resolved === null) {
            log_message('error', 'Sync::push blocked disallowed table: ' . var_export($table, true));
            return null;
        }
        // write back the normalized singular table name
        $item['table'] = $resolved;
        unset($item['table_name']);
        return $item;
    }
    
    /**
     * Get pending syncs for current user
     */
    public function pull() {
        header('Content-Type: application/json');

        if (!$this->require_authenticated_session()) {
            return;
        }

        // NOTE: fixed session key — this application sets login_user_id (not user_id),
        // which is why the previous check always failed.
        $user_id = $this->session->userdata('login_user_id');

        $pending = $this->sync_manager->get_pending_syncs($user_id);
        echo json_encode(['success' => true, 'data' => $pending]);
    }

    /**
     * Mark sync as completed
     */
    public function complete() {
        header('Content-Type: application/json');

        if (!$this->require_authenticated_session()) {
            return;
        }

        $sync_id = $this->input->post('sync_id');
        if (!$sync_id) {
            echo json_encode(['success' => false, 'message' => 'Sync ID required']);
            return;
        }
        
        $result = $this->sync_manager->mark_synced($sync_id);
        echo json_encode(['success' => $result]);
    }
    
    /**
     * Check connection status
     */
    public function ping() {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'timestamp' => time(), 'server_time' => date('Y-m-d H:i:s')]);
    }

    /**
     * Get server data for offline cache
     *
     * SECURITY: authentication is required. The client that calls this
     * (assets/js/offline-cache.js) is loaded only inside the authenticated
     * backend shell, so it always sends the session cookie. The previously
     * commented-out check used the wrong session key ('user_id'); the app
     * actually sets 'login_type' / 'login_user_id'.
     */
    public function cache_data() {
        @ini_set('display_errors', 0);
        header('Content-Type: application/json');

        if (!$this->require_authenticated_session()) {
            return;
        }

        try {

        $table = $this->input->get('table');
        $limit = (int)($this->input->get('limit') ?? 100);

        if (!$table) {
            echo json_encode(['success' => false, 'message' => 'Table required']);
            return;
        }

        $table_map = [
            'student' => 'student',
            'teacher' => 'teacher',
            'class' => 'class',
            'invoice' => 'invoice',
            'payment' => 'payment'
        ];
        
        if (!isset($table_map[$table])) {
            echo json_encode(['success' => false, 'message' => 'Invalid table']);
            return;
        }

        $actual_table = $table_map[$table];

            $this->db->limit($limit);
            $query = @$this->db->get($actual_table);
            
            if (!$query) {
                echo json_encode(['success' => true, 'data' => [], 'count' => 0]);
                return;
            }
            
            $data = $query->result_array();
            echo json_encode(['success' => true, 'data' => $data, 'count' => count($data)]);
        } catch (Throwable $e) {
            echo json_encode(['success' => true, 'data' => [], 'count' => 0]);
        }
    }
}
