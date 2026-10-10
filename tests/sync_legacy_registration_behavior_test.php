<?php

define('BASEPATH', __DIR__);
require __DIR__ . '/../application/libraries/Sync_service.php';

class FakeLegacyResult {
    private $row;
    public function __construct($row) { $this->row = $row; }
    public function row() { return $this->row; }
}

class FakeLegacyDb {
    public $devices = [];
    public $replaceCalls = 0;
    public $insertCalls = 0;
    public $updateCalls = 0;
    private $conditions = [];

    public function where($key, $value = null) {
        if (is_array($key)) {
            foreach ($key as $k => $v) $this->conditions[$k] = $v;
        } else {
            $this->conditions[$key] = $value;
        }
        return $this;
    }

    private function matchedId() {
        $id = $this->conditions['device_id'] ?? null;
        if ($id === null || !isset($this->devices[$id])) return null;
        foreach ($this->conditions as $key => $value) {
            if (!property_exists($this->devices[$id], $key) || $this->devices[$id]->{$key} != $value) return null;
        }
        return $id;
    }

    public function get($table) {
        $id = $table === 'sync_devices' ? $this->matchedId() : null;
        $row = $id !== null ? clone $this->devices[$id] : null;
        $this->conditions = [];
        return new FakeLegacyResult($row);
    }

    public function update($table, $data) {
        $id = $table === 'sync_devices' ? $this->matchedId() : null;
        if ($id === null) { $this->conditions = []; return false; }
        foreach ($data as $key => $value) $this->devices[$id]->{$key} = $value;
        $this->conditions = [];
        $this->updateCalls++;
        return true;
    }

    public function insert($table, $data) {
        if ($table !== 'sync_devices' || isset($this->devices[$data['device_id']])) return false;
        $this->devices[$data['device_id']] = (object)array_merge([
            'auth_token_hash' => null,
            'last_sync_at' => null,
            'school_id' => null,
        ], $data);
        $this->insertCalls++;
        return true;
    }

    public function replace($table, $data) {
        $this->replaceCalls++;
        throw new RuntimeException('REPLACE must never be called');
    }
}

class FakeLegacyCI { public $db; }

function assert_true($condition, $message) {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$reflection = new ReflectionClass(Sync_service::class);
$service = $reflection->newInstanceWithoutConstructor();
$db = new FakeLegacyDb();
$ci = new FakeLegacyCI();
$ci->db = $db;
$prop = $reflection->getProperty('CI');
$prop->setAccessible(true);
$prop->setValue($service, $ci);

$db->devices['legacy-active'] = (object)[
    'device_id' => 'legacy-active',
    'device_name' => 'Old name',
    'status' => 'ACTIVE',
    'auth_token_hash' => 'keep-this-hash',
    'last_sync_at' => '2026-10-10 18:00:00',
    'school_id' => 4,
    'created_at' => '2026-10-01 10:00:00',
];

$id = $service->register_device('legacy-active', 'New name', 9, 'admin');
assert_true($id === 'legacy-active', 'existing registration must preserve device ID');
assert_true($db->devices['legacy-active']->device_name === 'New name', 'existing registration may update the display name');
assert_true($db->devices['legacy-active']->auth_token_hash === 'keep-this-hash', 'existing registration must preserve credential hash');
assert_true($db->devices['legacy-active']->last_sync_at === '2026-10-10 18:00:00', 'existing registration must preserve sync metadata');
assert_true($db->replaceCalls === 0, 'REPLACE must never run');

$db->devices['legacy-blocked'] = (object)[
    'device_id' => 'legacy-blocked',
    'device_name' => 'Blocked',
    'status' => 'BLOCKED',
    'auth_token_hash' => null,
    'last_sync_at' => null,
    'school_id' => 4,
    'created_at' => '2026-10-01 10:00:00',
];
$updatesBefore = $db->updateCalls;
$blocked = false;
try {
    $service->register_device('legacy-blocked', 'Try reactivate', 9, 'admin');
} catch (RuntimeException $e) {
    $blocked = stripos($e->getMessage(), 'blocked') !== false;
}
assert_true($blocked, 'BLOCKED device registration must be rejected');
assert_true($db->updateCalls === $updatesBefore, 'BLOCKED device must not be mutated');

$newId = $service->register_device('legacy-new', 'New legacy device', 9, 'teacher');
assert_true($newId === 'legacy-new', 'new registration must return supplied device ID');
assert_true(isset($db->devices['legacy-new']), 'new device must be inserted');
assert_true($db->devices['legacy-new']->status === 'ACTIVE', 'new legacy device starts ACTIVE');
assert_true($db->devices['legacy-new']->auth_token_hash === null, 'legacy registration must not fabricate a Gen2 token hash');
assert_true(!property_exists($db->devices['legacy-new'], 'user_id'), 'legacy registration must not write removed user_id column');
assert_true(!property_exists($db->devices['legacy-new'], 'user_type'), 'legacy registration must not write removed user_type column');
assert_true(!property_exists($db->devices['legacy-new'], 'updated_at'), 'legacy registration must not write removed updated_at column');
assert_true($db->replaceCalls === 0, 'REPLACE must remain unused');

fwrite(STDOUT, "PASS: legacy registration is schema-safe and non-destructive\n");
