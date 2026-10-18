<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * One-Time Sync Controller
 *
 * Legacy one-time sync is retained only as an explicit CLI maintenance tool.
 * Browser access is retired because the controller can copy complete arbitrary
 * tables to the configured remote database and is not part of the supported
 * interactive sync workflow.
 */
class One_time_sync extends CI_Controller {

    private $remote_db;
    private $log_file;

    public function __construct() {
        parent::__construct();

        $this->load->database();
        $this->log_file = APPPATH . 'logs/one_time_sync_' . date('Y-m-d') . '.log';

        if (!$this->is_cli()) {
            $this->retired_web_endpoint();
        }

        $this->check_sync_enabled();
    }

    /**
     * Retire every browser/API entry point before controller methods dispatch.
     */
    private function retired_web_endpoint() {
        $message = 'Legacy one-time sync web access has been retired. Use the supported sync administration workflow or deliberate CLI maintenance instead.';

        $this->output
            ->set_status_header(410)
            ->set_content_type('application/json')
            ->set_output(json_encode([
                'status' => 'error',
                'message' => $message
            ]));
        $this->output->_display();
        exit;
    }

    /**
     * Check if sync module is enabled for CLI maintenance.
     */
    private function check_sync_enabled() {
        $this->config->load('sync', TRUE);

        $setting = $this->db->get_where('settings', ['type' => 'offline_online_mode'])->row();

        if ($setting) {
            $sync_enabled = ($setting->description === '1' || $setting->description === 1);
        } else {
            $sync_enabled = $this->config->item('sync_enabled', 'sync') ?? TRUE;
        }

        if (!$sync_enabled) {
            $this->log_message('Sync module is disabled; one-time CLI sync aborted.');
            exit(1);
        }
    }

    /**
     * Check if running in CLI mode.
     */
    private function is_cli() {
        return (php_sapi_name() === 'cli' || defined('STDIN'));
    }

    /**
     * Get remote database connection using the active sync configuration keys.
     */
    private function get_remote_db() {
        if ($this->remote_db) {
            return $this->remote_db;
        }

        $remote_host = $this->get_setting('remote_db_host');
        $remote_port = $this->get_setting('remote_db_port', '3306');
        $remote_user = $this->get_setting('remote_db_user');
        $remote_pass = $this->get_setting('remote_db_pass');
        $remote_database = $this->get_setting('remote_db_name');

        if (!$remote_host || !$remote_user || !$remote_database) {
            $this->log_message('Remote database not configured');
            return false;
        }

        $config = [
            'dsn'      => '',
            'hostname' => $remote_host . ':' . $remote_port,
            'username' => $remote_user,
            'password' => $remote_pass,
            'database' => $remote_database,
            'dbdriver' => 'mysqli',
            'dbprefix' => '',
            'pconnect' => FALSE,
            'db_debug' => FALSE,
            'cache_on' => FALSE,
            'cachedir' => '',
            'char_set' => 'utf8',
            'dbcollat' => 'utf8_general_ci',
            'swap_pre' => '',
            'encrypt'  => FALSE,
            'compress' => FALSE,
            'stricton' => FALSE,
            'failover' => []
        ];

        try {
            $this->remote_db = $this->load->database($config, TRUE);
            return $this->remote_db;
        } catch (Exception $e) {
            $this->log_message('Failed to connect to remote database: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Get setting value.
     */
    private function get_setting($key, $default = null) {
        $setting = $this->db->get_where('settings', ['type' => $key])->row();
        return $setting ? $setting->description : $default;
    }

    /**
     * Log message to file and CLI output.
     */
    private function log_message($message) {
        $timestamp = date('Y-m-d H:i:s');
        $log_entry = "[$timestamp] $message\n";
        file_put_contents($this->log_file, $log_entry, FILE_APPEND);

        if ($this->is_cli()) {
            echo $log_entry;
        }
    }

    /**
     * Get list of tables without sync columns.
     */
    public function get_tables_without_sync() {
        $tables = $this->db->list_tables();
        $without_sync = [];

        foreach ($tables as $table) {
            if (strpos($table, 'sync_') === 0) {
                continue;
            }

            $fields = $this->db->list_fields($table);
            if (!in_array('sync_status', $fields)) {
                $without_sync[] = $table;
            }
        }

        return $without_sync;
    }

    /**
     * Sync a specific table from local to remote in CLI maintenance mode.
     */
    public function sync_table($table, $dry_run = false) {
        $this->log_message("=== Starting one-time sync for table: $table ===");

        if (!$this->db->table_exists($table)) {
            $this->log_message("ERROR: Table $table does not exist");
            return ['status' => 'error', 'message' => 'Table does not exist'];
        }

        $records = $this->db->get($table)->result_array();
        $total_records = count($records);

        $this->log_message("Found $total_records records in $table");

        if ($total_records == 0) {
            $this->log_message('No records to sync');
            return ['status' => 'success', 'synced' => 0, 'failed' => 0];
        }

        if ($dry_run) {
            $this->log_message("DRY RUN: Would sync $total_records records");
            return ['status' => 'dry_run', 'would_sync' => $total_records];
        }

        $remote_db = $this->get_remote_db();
        if (!$remote_db) {
            $this->log_message('ERROR: Failed to connect to remote database');
            return ['status' => 'error', 'message' => 'Remote connection failed'];
        }

        if (!$remote_db->table_exists($table)) {
            $this->log_message("ERROR: Remote table $table does not exist");
            return ['status' => 'error', 'message' => 'Remote table does not exist'];
        }

        $batch_size = 100;
        $batches = array_chunk($records, $batch_size);
        $synced = 0;
        $failed = 0;

        foreach ($batches as $batch_num => $batch) {
            $this->log_message('Processing batch ' . ($batch_num + 1) . ' of ' . count($batches));

            foreach ($batch as $record) {
                try {
                    $remote_db->replace($table, $record);
                    $synced++;
                } catch (Exception $e) {
                    $failed++;
                    $this->log_message('ERROR syncing record: ' . $e->getMessage());
                }
            }
        }

        $this->log_message("=== Sync complete: $synced synced, $failed failed ===");

        return [
            'status' => $failed > 0 ? 'partial' : 'success',
            'synced' => $synced,
            'failed' => $failed,
            'total' => $total_records
        ];
    }

    /**
     * Sync multiple tables.
     */
    public function sync_multiple_tables($tables, $dry_run = false) {
        $results = [];

        foreach ($tables as $table) {
            $results[$table] = $this->sync_table($table, $dry_run);
        }

        return $results;
    }

    /**
     * Sync all local tables that do not carry continuous sync columns.
     */
    public function sync_all_without_sync_columns($dry_run = false) {
        $this->log_message('=== ONE-TIME SYNC: All tables without sync columns ===');

        $tables = $this->get_tables_without_sync();
        $this->log_message('Found ' . count($tables) . ' tables without sync columns');

        if ($dry_run) {
            $this->log_message('DRY RUN MODE - No data will be synced');
        }

        $results = $this->sync_multiple_tables($tables, $dry_run);

        $total_synced = 0;
        $total_failed = 0;

        foreach ($results as $result) {
            if (isset($result['synced'])) {
                $total_synced += $result['synced'];
            }
            if (isset($result['failed'])) {
                $total_failed += $result['failed'];
            }
        }

        $this->log_message('=== SUMMARY ===');
        $this->log_message('Tables processed: ' . count($tables));
        $this->log_message("Total records synced: $total_synced");
        $this->log_message("Total records failed: $total_failed");

        return [
            'results' => $results,
            'total_synced' => $total_synced,
            'total_failed' => $total_failed,
            'tables_processed' => count($tables)
        ];
    }

    /**
     * CLI entry point. Browser requests never reach this method because the
     * constructor returns HTTP 410 first.
     */
    public function index() {
        if (!$this->is_cli()) {
            $this->retired_web_endpoint();
        }

        $tables = $this->get_tables_without_sync();
        $this->log_message('Legacy one-time sync is available only through CLI maintenance.');
        $this->log_message('Tables without sync columns: ' . count($tables));

        foreach ($tables as $table) {
            $this->log_message(' - ' . $table);
        }

        return $tables;
    }
}
