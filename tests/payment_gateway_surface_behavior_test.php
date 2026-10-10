<?php

define('BASEPATH', __DIR__);

$test_settings = [];
function get_settings($key)
{
    global $test_settings;
    return $test_settings[$key] ?? '';
}

class CI_Model {}

require __DIR__ . '/../application/models/Payment_gateway_model.php';

function assert_true($condition, $message)
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$reflection = new ReflectionClass(Payment_gateway_model::class);
$model = $reflection->newInstanceWithoutConstructor();

function set_private($reflection, $model, $name, $value)
{
    $property = $reflection->getProperty($name);
    $property->setAccessible(true);
    $property->setValue($model, $value);
}

set_private($reflection, $model, 'hubtel_client_id', '');
set_private($reflection, $model, 'hubtel_client_secret', '');
set_private($reflection, $model, 'hubtel_merchant_number', '');

$test_settings['hubtel_payment_enabled'] = '0';
assert_true($model->get_active_gateways() === [], 'disabled Hubtel must not be advertised');

$test_settings['hubtel_payment_enabled'] = '1';
assert_true($model->get_active_gateways() === [], 'enabled but unconfigured Hubtel must fail closed');

set_private($reflection, $model, 'hubtel_client_id', 'test-client');
set_private($reflection, $model, 'hubtel_client_secret', 'test-secret');
assert_true($model->get_active_gateways() === [], 'Hubtel without merchant number must remain hidden');

set_private($reflection, $model, 'hubtel_merchant_number', 'TEST-MERCHANT');
$gateways = $model->get_active_gateways();
assert_true(count($gateways) === 1, 'exactly one online gateway should be advertised');
assert_true(($gateways[0]['code'] ?? '') === 'hubtel', 'the advertised gateway must be Hubtel');
assert_true(in_array('mtn-gh', $gateways[0]['networks'] ?? [], true), 'Hubtel option should include MTN network routing');

fwrite(STDOUT, "PASS: payment gateway surface advertises only configured enabled Hubtel\n");
