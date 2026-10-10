-- Hubtel payroll payout ledger.
-- Outbound salary disbursement is intentionally isolated from inbound fee collections.

CREATE TABLE IF NOT EXISTS `payroll_payout_transactions` (
    `payout_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `pay_id` INT NOT NULL,
    `provider` VARCHAR(32) NOT NULL DEFAULT 'hubtel',
    `client_reference` VARCHAR(80) NOT NULL,
    `provider_transaction_id` VARCHAR(128) DEFAULT NULL,
    `recipient_phone` VARCHAR(20) NOT NULL,
    `amount` DECIMAL(14,2) NOT NULL,
    `currency` VARCHAR(8) NOT NULL DEFAULT 'GHS',
    `status` VARCHAR(24) NOT NULL DEFAULT 'pending',
    `initiated_by` INT DEFAULT NULL,
    `initiated_by_role` VARCHAR(32) DEFAULT NULL,
    `request_payload` LONGTEXT DEFAULT NULL,
    `response_payload` LONGTEXT DEFAULT NULL,
    `callback_payload` LONGTEXT DEFAULT NULL,
    `failure_reason` VARCHAR(255) DEFAULT NULL,
    `initiated_at` DATETIME NOT NULL,
    `confirmed_at` DATETIME DEFAULT NULL,
    `failed_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME NOT NULL,
    `updated_at` DATETIME NOT NULL,
    PRIMARY KEY (`payout_id`),
    UNIQUE KEY `uq_payroll_payout_pay_id` (`pay_id`),
    UNIQUE KEY `uq_payroll_payout_client_reference` (`client_reference`),
    KEY `idx_payroll_payout_provider_transaction` (`provider_transaction_id`),
    KEY `idx_payroll_payout_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
