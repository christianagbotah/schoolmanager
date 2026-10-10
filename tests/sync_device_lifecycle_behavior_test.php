<?php

define('BASEPATH', __DIR__);
class CI_Model {}
function log_message($level, $message) {}
require __DIR__ . '/../application/models/Sync_model.php';

class FakeLifecycleResult {
    private $row;
    public function __construct($row) { $this->row = $row; }
    public function row() { return $this->row; }
}

class FakeLifecycleDb {
    public $device;
    public $updates = 0;
    private $conditions = [];

    public function __construct() {
        $this->device = (object)[
            'id' => 1,
            'device_id' => 'device-test',
            'device_name' => 'Test Device',
            'school_id' => 1,
            'status' => 'ACTIVE',
            'auth_token_hash' => hash('sha256', 'old-token'),
            'last_sync_at' => null,
        ];
    }

    public function field_exists($field, $table) {
        return $table === 'sync_devices' && $field === 'auth_token_hash';
    }

    public function where($key, $value = null) {
        if (is_array($key)) {
            foreach ($key as $k => $v) $this->conditions[$k] = $v;
        } else {
            $this->conditions[$key] = $value;
        }
        return $this;
    }

    private function matches() {
        foreach ($this->conditions as $key => $value) {
            if (!property_exists($this->device, $key) || $this->device->{$key} != $value) return false;
        }
        return true;
    }

    public function get($table) {
        $row = ($table === 'sync_devices' && $this->matches()) ? clone $this->device : null;
        $this->conditions = [];
        return new FakeLifecycleResult($row);
    }

    public function update($table, $data) {
        $matches = $table === 'sync_devices' && $this->matches();
        if ($matches) {
            foreach ($data as $key => $value) $this->device->{$key} = $value;
            $this->updates++;
        }
        $this->conditions = [];
        return $matches;
    }
}

function assert_true($condition, $message) {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$reflection = new ReflectionClass(Sync_model::class);
$model = $reflection->newInstanceWithoutConstructor();
$db = new FakeLifecycleDb();
$model->db = $db;

$oldHash = $db->device->auth_token_hash;
$rotated = $model->rotate_device_token('device-test');
assert_true(($rotated['status'] ?? null) === 'success', 'ACTIVE device token rotation must succeed');
assert_true(isset($rotated['auth_token']) && preg_match('/^[a-f0-9]{64}$/', $rotated['auth_token']) === 1, 'rotation must return one 256-bit token as hex');
assert_true($db->device->auth_token_hash !== $oldHash, 'rotation must invalidate the previous stored hash');
assert_true($db->device->auth_token_hash === hash('sha256', $rotated['auth_token']), 'stored hash must match the returned one-time token');
assert_true($model->verify_device('device-test', 'old-token') === null, 'old token must fail immediately after rotation');
assert_true($model->verify_device('device-test', $rotated['auth_token']) !== null, 'rotated token must verify while device is ACTIVE');

$revoked = $model->revoke_device('device-test');
assert_true(($revoked['status'] ?? null) === 'success', 'revocation must succeed');
assert_true($db->device->status === 'BLOCKED', 'revocation must set BLOCKED status');
assert_true($db->device->auth_token_hash === null, 'revocation must destroy the token hash');
assert_true($model->verify_device('device-test', $rotated['auth_token']) === null, 'revoked token must not verify');

$updatesBefore = $db->updates;
$blockedRotate = $model->rotate_device_token('device-test');
assert_true(($blockedRotate['status'] ?? null) === 'error', 'BLOCKED device must not be silently rotated/reactivated');
assert_true($db->updates === $updatesBefore, 'blocked rotation must not mutate device state');

fwrite(STDOUT, "PASS: device rotation and revocation are fail-safe\n");
