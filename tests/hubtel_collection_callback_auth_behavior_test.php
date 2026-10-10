<?php

define('BASEPATH', __DIR__);

class CI_Model {}

require __DIR__ . '/../application/models/Hubtel_payment_model.php';

function assert_true($condition, $message)
{
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$reflection = new ReflectionClass(Hubtel_payment_model::class);
$model = $reflection->newInstanceWithoutConstructor();

foreach ([
    'client_secret' => 'test-only-payment-secret',
    'merchant_number' => 'TEST-MERCHANT-001',
    'client_id' => 'test-client'
] as $name => $value) {
    $prop = $reflection->getProperty($name);
    $prop->setAccessible(true);
    $prop->setValue($model, $value);
}

$tokenMethod = $reflection->getMethod('callback_token_for_reference');
$tokenMethod->setAccessible(true);

$refA = 'HUB-COL-AAAAAAAAAAAAAAAAAAAAAAAA';
$refB = 'HUB-COL-BBBBBBBBBBBBBBBBBBBBBBBB';
$tokenA = $tokenMethod->invoke($model, $refA);
$tokenB = $tokenMethod->invoke($model, $refB);
$expected = hash_hmac('sha256', 'hubtel-collection|TEST-MERCHANT-001|' . $refA, 'test-only-payment-secret');

assert_true($tokenA === $expected, 'callback token must be HMAC-bound to merchant and transaction reference');
assert_true($tokenA !== $tokenB, 'different transaction references must produce different callback tokens');
assert_true(strlen($tokenA) === 64, 'callback token must be a SHA-256 hex digest');

$payload = json_encode([
    'ResponseCode' => '0000',
    'Data' => [
        'ClientReference' => $refA,
        'Amount' => 25.00,
        'Status' => 'Success',
        'TransactionId' => 'provider-test-001'
    ]
]);

$missing = $model->handle_callback($payload, '');
assert_true(($missing['http_code'] ?? 0) === 403, 'missing token must be rejected before settlement');
assert_true(($missing['code'] ?? '') === 'invalid_callback_token', 'missing token must use callback-auth error code');

$invalid = $model->handle_callback($payload, str_repeat('0', 64));
assert_true(($invalid['http_code'] ?? 0) === 403, 'invalid token must be rejected before settlement');
assert_true(($invalid['code'] ?? '') === 'invalid_callback_token', 'invalid token must use callback-auth error code');

fwrite(STDOUT, "PASS: Hubtel collection callback token is bound and enforced before DB settlement\n");
