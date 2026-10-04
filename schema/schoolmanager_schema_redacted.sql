-- SchoolManager CI3 redacted schema template
-- Generated from the supplied schema dump on 2026-10-02.
-- STRUCTURE ONLY: all INSERT/REPLACE data rows were removed.
-- MySQL DEFINER identities were replaced with CURRENT_USER.
-- Do not add production credentials or personal/student/staff data to this file.

-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Oct 02, 2026 at 04:59 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `schoolmanager_template`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=CURRENT_USER PROCEDURE `add_sync_operation_type_column` (IN `table_name` VARCHAR(64))   BEGIN
    DECLARE column_exists INT;
    DECLARE sync_status_exists INT;
    
    -- Check if table has sync_status column (required prerequisite)
    SELECT COUNT(*) INTO sync_status_exists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = table_name
      AND COLUMN_NAME = 'sync_status';
    
    IF sync_status_exists = 0 THEN
        SELECT CONCAT('⚠️  Table ', table_name, ' does not have sync_status column - SKIPPED') AS message;
    ELSE
        -- Check if sync_operation_type column already exists
        SELECT COUNT(*) INTO column_exists
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = table_name
          AND COLUMN_NAME = 'sync_operation_type';
        
        IF column_exists = 0 THEN
            -- Add the column
            SET @sql = CONCAT('ALTER TABLE `', table_name, '` ',
                            'ADD COLUMN sync_operation_type ENUM(''insert'', ''update'', ''both'') ',
                            'DEFAULT ''insert'' ',
                            'AFTER sync_status');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            -- Backfill existing PENDING records
            SET @sql = CONCAT('UPDATE `', table_name, '` ',
                            'SET sync_operation_type = ''insert'' ',
                            'WHERE sync_status = ''PENDING'' ',
                            '  AND sync_operation_type IS NULL');
            PREPARE stmt FROM @sql;
            EXECUTE stmt;
            DEALLOCATE PREPARE stmt;
            
            SELECT CONCAT('✅ Added sync_operation_type to ', table_name) AS message;
        ELSE
            SELECT CONCAT('ℹ️  sync_operation_type already exists in ', table_name) AS message;
        END IF;
    END IF;
END$$

CREATE DEFINER=CURRENT_USER PROCEDURE `calculate_daily_totals` (IN `target_date` DATE)   BEGIN
    DECLARE target_timestamp INT;
    
    
    SET target_timestamp = UNIX_TIMESTAMP(target_date);
    
    
    SELECT 
        
        COUNT(DISTINCT dcl.student_id) AS students_billed,
        COUNT(DISTINCT dft.student_id) AS students_paid,
        
        
        SUM(dcl.feeding_charged) AS feeding_charged,
        SUM(dft.feeding_amount) AS feeding_collected,
        SUM(dcl.feeding_charged) - IFNULL(SUM(dft.feeding_amount), 0) AS feeding_outstanding,
        
        
        SUM(dcl.breakfast_charged) AS breakfast_charged,
        SUM(dft.breakfast_amount) AS breakfast_collected,
        SUM(dcl.breakfast_charged) - IFNULL(SUM(dft.breakfast_amount), 0) AS breakfast_outstanding,
        
        
        SUM(dcl.classes_charged) AS classes_charged,
        SUM(dft.classes_amount) AS classes_collected,
        SUM(dcl.classes_charged) - IFNULL(SUM(dft.classes_amount), 0) AS classes_outstanding,
        
        
        SUM(dcl.water_charged) AS water_charged,
        SUM(dft.water_amount) AS water_collected,
        SUM(dcl.water_charged) - IFNULL(SUM(dft.water_amount), 0) AS water_outstanding,
        
        
        SUM(dcl.transport_charged) AS transport_charged,
        SUM(dft.transport_amount) AS transport_collected,
        SUM(dcl.transport_charged) - IFNULL(SUM(dft.transport_amount), 0) AS transport_outstanding,
        
        
        SUM(dcl.total_charged) AS total_charged,
        SUM(dft.total_amount) AS total_collected,
        SUM(dcl.total_charged) - IFNULL(SUM(dft.total_amount), 0) AS total_outstanding
        
    FROM daily_charge_log dcl
    LEFT JOIN daily_fee_transactions dft 
        ON dcl.student_id = dft.student_id 
        AND dcl.charge_date = dft.payment_date
    WHERE dcl.charge_date = target_timestamp;
    
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `academic_syllabus`
--

CREATE TABLE `academic_syllabus` (
  `academic_syllabus_id` int NOT NULL,
  `academic_syllabus_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `title` longtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` int DEFAULT NULL,
  `uploader_type` longtext COLLATE utf8mb4_unicode_520_ci,
  `uploader_id` int DEFAULT NULL,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `file_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `subject_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `accountant`
--

CREATE TABLE `accountant` (
  `accountant_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `email` longtext COLLATE utf8mb4_unicode_520_ci,
  `password` longtext COLLATE utf8mb4_unicode_520_ci,
  `authentication_key` longtext COLLATE utf8mb4_unicode_520_ci,
  `read_notice_ids` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `block_limit` int DEFAULT '0',
  `active_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `online_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `account_id` int NOT NULL,
  `bank_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `branch` longtext COLLATE utf8mb4_unicode_520_ci,
  `account_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `account_number` longtext COLLATE utf8mb4_unicode_520_ci,
  `account_type` int NOT NULL,
  `opening_balance` double DEFAULT '0',
  `current_balance` double DEFAULT '0',
  `account_is_bank` int NOT NULL DEFAULT '0',
  `account_is_transferrable` int NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `accounts_payable`
--

CREATE TABLE `accounts_payable` (
  `accounts_payable_id` int NOT NULL,
  `supplier_id` int DEFAULT NULL,
  `po_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `amount` double DEFAULT '0',
  `amount_paid` double DEFAULT '0',
  `amount_due` double DEFAULT '0',
  `creation_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `payment_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `date` longtext COLLATE utf8mb4_unicode_520_ci,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `payment_method` longtext COLLATE utf8mb4_unicode_520_ci,
  `payment_details` longtext COLLATE utf8mb4_unicode_520_ci,
  `account_id` int DEFAULT NULL,
  `status` longtext COLLATE utf8mb4_unicode_520_ci,
  `track_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `p_prev_paid` double NOT NULL DEFAULT '0',
  `prev_paid` double NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `account_type`
--

CREATE TABLE `account_type` (
  `account_type_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `addition`
--

CREATE TABLE `addition` (
  `addi_id` int NOT NULL,
  `salary_id` int NOT NULL,
  `basic` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `medical` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `house_rent` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `conveyance` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `admin_id` int NOT NULL,
  `admin_code` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `other_name` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `ssnit_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `ghana_card_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `email` longtext COLLATE utf8mb4_unicode_520_ci,
  `password` longtext COLLATE utf8mb4_unicode_520_ci,
  `level` longtext COLLATE utf8mb4_unicode_520_ci,
  `authentication_key` longtext COLLATE utf8mb4_unicode_520_ci,
  `read_notice_ids` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `block_limit` int DEFAULT '0',
  `active_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `online_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `account_number` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `tier2_provider_id` int DEFAULT NULL COMMENT 'FK to pension_tier2_providers',
  `tier2_member_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Employee ID with Tier 2 provider',
  `account_details` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `can_collect_daily_fees` tinyint(1) DEFAULT '0' COMMENT '1=can collect fees, 0=cannot',
  `collection_point` enum('classroom','office','bus') COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `transport_only` tinyint(1) DEFAULT '0' COMMENT '1=can only collect transport fare, 0=can collect all fees',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `sync_operation_type` enum('insert','update','both') COLLATE utf8mb4_unicode_520_ci DEFAULT 'insert',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `admin`
--


-- --------------------------------------------------------

--
-- Table structure for table `admission_category`
--

CREATE TABLE `admission_category` (
  `admission_category_id` int NOT NULL,
  `admission_category_name` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `admission_category`
--


-- --------------------------------------------------------

--
-- Table structure for table `admission_logs`
--

CREATE TABLE `admission_logs` (
  `log_id` int NOT NULL,
  `student_id` int NOT NULL,
  `admitted_by` int NOT NULL COMMENT 'Admin ID who admitted the student',
  `class_id` int NOT NULL,
  `section_id` int NOT NULL,
  `residence_type` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `bill_items` text COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'JSON array of bill items with amounts',
  `total_bill_amount` decimal(10,2) NOT NULL,
  `admission_date` int NOT NULL,
  `created_at` int NOT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `aggregation`
--

CREATE TABLE `aggregation` (
  `aggregate_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `exam_id` int DEFAULT NULL,
  `aggregate_mark` double DEFAULT NULL,
  `raw_score` double DEFAULT NULL,
  `grand_total` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `attitude` longtext COLLATE utf8mb4_unicode_520_ci,
  `conduct` longtext COLLATE utf8mb4_unicode_520_ci,
  `interest` longtext COLLATE utf8mb4_unicode_520_ci,
  `c1` longtext COLLATE utf8mb4_unicode_520_ci,
  `c2` longtext COLLATE utf8mb4_unicode_520_ci,
  `c3` longtext COLLATE utf8mb4_unicode_520_ci,
  `c4` longtext COLLATE utf8mb4_unicode_520_ci,
  `c5` longtext COLLATE utf8mb4_unicode_520_ci,
  `c6` longtext COLLATE utf8mb4_unicode_520_ci,
  `c7` longtext COLLATE utf8mb4_unicode_520_ci,
  `c8` longtext COLLATE utf8mb4_unicode_520_ci,
  `c9` longtext COLLATE utf8mb4_unicode_520_ci,
  `c10` longtext COLLATE utf8mb4_unicode_520_ci,
  `c11` longtext COLLATE utf8mb4_unicode_520_ci,
  `c12` longtext COLLATE utf8mb4_unicode_520_ci,
  `c13` longtext COLLATE utf8mb4_unicode_520_ci,
  `c14` longtext COLLATE utf8mb4_unicode_520_ci,
  `c15` longtext COLLATE utf8mb4_unicode_520_ci,
  `remarks` longtext COLLATE utf8mb4_unicode_520_ci,
  `head_teacher_remarks` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_teacher_remarks` longtext COLLATE utf8mb4_unicode_520_ci,
  `days_opened` int DEFAULT '0',
  `days_present` int DEFAULT '0',
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `aggregation`
--


-- --------------------------------------------------------

--
-- Table structure for table `aging_report_snapshots`
--

CREATE TABLE `aging_report_snapshots` (
  `id` int NOT NULL,
  `snapshot_date` date NOT NULL COMMENT 'Date of snapshot',
  `student_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `invoice_code` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `amount_due` decimal(10,2) NOT NULL,
  `days_outstanding` int NOT NULL,
  `age_category` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'current, 30days, 60days, 90days',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Historical aging report snapshots';

-- --------------------------------------------------------

--
-- Table structure for table `alumni`
--

CREATE TABLE `alumni` (
  `alumni_id` int NOT NULL,
  `student_id` int NOT NULL,
  `year_batch` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` int NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Alumni, list of completed students';

--
-- Dumping data for table `alumni`
--


-- --------------------------------------------------------

--
-- Table structure for table `approval_requests`
--

CREATE TABLE `approval_requests` (
  `id` int NOT NULL,
  `request_type` enum('invoice_edit','invoice_delete','payment_edit','payment_delete') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `record_id` int NOT NULL COMMENT 'ID of invoice or payment',
  `record_type` enum('invoice','payment') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `requested_by` int NOT NULL,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `handled_by` int DEFAULT NULL,
  `handled_at` timestamp NULL DEFAULT NULL,
  `handler_notes` text COLLATE utf8mb4_unicode_520_ci,
  `record_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Snapshot of record at request time',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assessment_methods_master`
--

CREATE TABLE `assessment_methods_master` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `display_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `assessment_methods_master`
--


-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `ass_id` int NOT NULL,
  `catid` varchar(14) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `ass_name` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `ass_brand` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `ass_model` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `ass_code` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `configuration` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `purchasing_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `ass_price` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `ass_qty` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `in_stock` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assets_category`
--

CREATE TABLE `assets_category` (
  `cat_id` int NOT NULL,
  `cat_status` enum('ASSETS','LOGISTIC') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'ASSETS',
  `cat_name` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assign_leave`
--

CREATE TABLE `assign_leave` (
  `id` int NOT NULL,
  `app_id` varchar(11) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `emp_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `type_id` int NOT NULL,
  `day` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `hour` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `total_day` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `dateyear` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `assign_task`
--

CREATE TABLE `assign_task` (
  `id` int NOT NULL,
  `task_id` int NOT NULL,
  `project_id` int NOT NULL,
  `assign_user` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `user_type` enum('Team Head','Collaborators') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Collaborators',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `attendance_id` int NOT NULL,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `student_id` int NOT NULL,
  `class_routine_id` int DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0',
  `checked_in` int NOT NULL DEFAULT '0',
  `checked_in_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `checked_out` int NOT NULL DEFAULT '0',
  `checked_out_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `mute` enum('0','1') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `feeding_charged` decimal(10,2) DEFAULT '0.00' COMMENT 'Feeding amount charged for this day',
  `breakfast_charged` decimal(10,2) DEFAULT '0.00' COMMENT 'Breakfast amount charged for this day',
  `classes_charged` decimal(10,2) DEFAULT '0.00' COMMENT 'Classes amount charged for this day',
  `water_charged` decimal(10,2) DEFAULT '0.00' COMMENT 'Water amount charged for this day',
  `transport_charged` decimal(10,2) DEFAULT '0.00' COMMENT 'Transport amount charged for this day',
  `transport_status` enum('none','in','out','both') COLLATE utf8mb4_unicode_520_ci DEFAULT 'none' COMMENT 'Transport usage for the day',
  `breakfast_opted` tinyint(1) DEFAULT '0' COMMENT '1=student took breakfast, 0=did not take',
  `payment_status` enum('paid','unpaid','partial','advance') COLLATE utf8mb4_unicode_520_ci DEFAULT 'unpaid',
  `marked_by` int DEFAULT NULL COMMENT 'User ID who marked attendance',
  `marked_by_role` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'teacher, cashier, conductor',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `attendance`
--


-- --------------------------------------------------------

--
-- Table structure for table `attendance_billing_log`
--

CREATE TABLE `attendance_billing_log` (
  `id` int NOT NULL,
  `operation_type` enum('auto_bill','payment','bulk_payment','adjustment') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `student_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `performed_by` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `log_id` bigint NOT NULL COMMENT 'Primary key for audit log entries',
  `user_id` int NOT NULL COMMENT 'User who performed the action',
  `module` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Module name (e.g., payroll, staff, student)',
  `action` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Action performed (create, update, delete, view)',
  `record_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Identifier of the affected record',
  `before_data` text COLLATE utf8mb4_general_ci COMMENT 'JSON snapshot of data before change',
  `after_data` text COLLATE utf8mb4_general_ci COMMENT 'JSON snapshot of data after change',
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'IP address of the user (supports IPv6)',
  `user_agent` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Browser/device user agent string',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when action occurred'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Immutable audit trail for all payroll operations';

-- --------------------------------------------------------

--
-- Table structure for table `audit_trail`
--

CREATE TABLE `audit_trail` (
  `audit_id` int NOT NULL,
  `record_type` enum('invoice','payment','journal','budget','expense','account','discount','other') COLLATE utf8mb4_general_ci NOT NULL,
  `record_id` int NOT NULL,
  `action` enum('create','update','delete','lock','unlock','post','void','approve','reject') COLLATE utf8mb4_general_ci NOT NULL,
  `old_values` text COLLATE utf8mb4_general_ci COMMENT 'JSON encoded old values',
  `new_values` text COLLATE utf8mb4_general_ci COMMENT 'JSON encoded new values',
  `performed_by` int NOT NULL,
  `performed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `audit_trail`
--


-- --------------------------------------------------------

--
-- Table structure for table `bank_accounts`
--

CREATE TABLE `bank_accounts` (
  `bank_account_id` int NOT NULL,
  `account_name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `account_type` enum('checking','savings','credit_card','mobile_money') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `currency` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT 'GHS',
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `chart_account_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `branch` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `swift_code` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bank_reconciliations`
--

CREATE TABLE `bank_reconciliations` (
  `id` int NOT NULL,
  `bank_account_id` int NOT NULL COMMENT 'Reference to bank account',
  `reconciliation_date` date NOT NULL COMMENT 'Date of reconciliation',
  `statement_date` date NOT NULL COMMENT 'Bank statement date',
  `statement_balance` decimal(12,2) NOT NULL COMMENT 'Balance per bank statement',
  `book_balance` decimal(12,2) NOT NULL COMMENT 'Balance per books',
  `difference` decimal(12,2) NOT NULL COMMENT 'Difference amount',
  `reconciled_items_count` int DEFAULT '0' COMMENT 'Number of items reconciled',
  `reconciled_amount` decimal(12,2) DEFAULT '0.00' COMMENT 'Total reconciled amount',
  `status` enum('pending','completed','reviewed') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending' COMMENT 'Reconciliation status',
  `notes` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Reconciliation notes',
  `reconciled_by` int NOT NULL COMMENT 'User who performed reconciliation',
  `reviewed_by` int DEFAULT NULL COMMENT 'User who reviewed',
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Bank reconciliation records';

-- --------------------------------------------------------

--
-- Table structure for table `bank_transactions`
--

CREATE TABLE `bank_transactions` (
  `transaction_id` int NOT NULL,
  `bank_account_id` int NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('deposit','withdrawal','transfer','fee','interest') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `payee_payer` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `journal_entry_id` int DEFAULT NULL,
  `is_reconciled` tinyint(1) DEFAULT '0',
  `reconciled_by` int DEFAULT NULL,
  `reconciled_at` datetime DEFAULT NULL,
  `reconciled_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `beneficiary_list`
--

CREATE TABLE `beneficiary_list` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `term` varchar(5) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `categories` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `created_at` int NOT NULL,
  `updated_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `beneficiary_list`
--


-- --------------------------------------------------------

--
-- Table structure for table `benefit_category`
--

CREATE TABLE `benefit_category` (
  `category_id` int NOT NULL,
  `discount_type_id` int DEFAULT NULL COMMENT 'Optional reference to discount_types for governance',
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `icon` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Visual icon (emoji) for category',
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Active status flag',
  `created_by` int DEFAULT NULL COMMENT 'Admin ID who created this category',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `benefit_category`
--


-- --------------------------------------------------------

--
-- Table structure for table `billing_history`
--

CREATE TABLE `billing_history` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `billing_date` date NOT NULL,
  `billing_type` enum('feeding','classes','transport') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `amount_charged` decimal(10,2) DEFAULT '0.00',
  `amount_paid` decimal(10,2) DEFAULT '0.00',
  `balance` decimal(10,2) DEFAULT '0.00',
  `benefit_category_id` int DEFAULT NULL,
  `discount_applied` decimal(10,2) DEFAULT '0.00',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bill_category`
--

CREATE TABLE `bill_category` (
  `bill_category_id` int NOT NULL,
  `bill_category_name` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `bill_category`
--


-- --------------------------------------------------------

--
-- Table structure for table `bill_item`
--

CREATE TABLE `bill_item` (
  `id` int NOT NULL,
  `title` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `description` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `bill_category_id` int NOT NULL,
  `class_category` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Class category: Pre-School, Lower Primary, Upper Primary, JHS',
  `specific_class_ids` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Comma-separated class IDs for granular filtering (e.g., "1,2,3")',
  `amount` double NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `bill_item`
--


-- --------------------------------------------------------

--
-- Table structure for table `bill_item_history`
--

CREATE TABLE `bill_item_history` (
  `id` int NOT NULL,
  `bill_item_id` int NOT NULL,
  `class_id` int NOT NULL,
  `term` int NOT NULL,
  `year` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `bill_item_amount` double NOT NULL DEFAULT '0',
  `timestamp` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `residence_type` enum('Day','Boarding','Both') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Day',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `bill_item_history`
--


-- --------------------------------------------------------

--
-- Table structure for table `blood_group`
--

CREATE TABLE `blood_group` (
  `id` int NOT NULL,
  `blood_group` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT '',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `blood_group`
--


-- --------------------------------------------------------

--
-- Table structure for table `boarding_bed`
--

CREATE TABLE `boarding_bed` (
  `bed_id` int NOT NULL,
  `bed_code` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `bed_number` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `bed_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `bed_description` text COLLATE utf8mb4_unicode_520_ci,
  `dormitory_id` int NOT NULL,
  `bed_status` enum('Available','Assigned','Maintenance','Unknown') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Available',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `boarding_dormitory`
--

CREATE TABLE `boarding_dormitory` (
  `dormitory_id` int NOT NULL,
  `dormitory_name` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `dormitory_capacity` int DEFAULT NULL,
  `dormitory_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `dormitory_floor` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `dormitory_description` longtext COLLATE utf8mb4_unicode_520_ci,
  `house_id` int NOT NULL,
  `dormitory_prefect_id` int DEFAULT NULL,
  `dormitory_bed_capacity` bigint NOT NULL DEFAULT '0',
  `dormitory_status` enum('Available','Assigned','Maintenance','Unknown') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Available',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `boarding_house`
--

CREATE TABLE `boarding_house` (
  `house_id` int NOT NULL,
  `house_name` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `house_description` longtext COLLATE utf8mb4_unicode_520_ci,
  `house_image_link` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `house_master_id` int DEFAULT NULL,
  `house_gps_code` text COLLATE utf8mb4_unicode_520_ci,
  `house_prefect_id` int DEFAULT NULL,
  `house_capacity` bigint NOT NULL DEFAULT '0',
  `house_year_established` text COLLATE utf8mb4_unicode_520_ci,
  `house_user_fee` double NOT NULL DEFAULT '0',
  `house_status` enum('Available','Assigned','Maintenance','Unknown') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Available',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `book`
--

CREATE TABLE `book` (
  `book_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `author` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` longtext COLLATE utf8mb4_unicode_520_ci,
  `price` longtext COLLATE utf8mb4_unicode_520_ci,
  `total_copies` int DEFAULT NULL,
  `issued_copies` int DEFAULT NULL,
  `status` longtext COLLATE utf8mb4_unicode_520_ci,
  `file_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `book_request`
--

CREATE TABLE `book_request` (
  `book_request_id` int NOT NULL,
  `book_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `issue_start_date` longtext COLLATE utf8mb4_unicode_520_ci,
  `issue_end_date` longtext COLLATE utf8mb4_unicode_520_ci,
  `status` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `budget_id` int NOT NULL,
  `budget_name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `fiscal_year` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `status` enum('draft','approved','active','closed') COLLATE utf8mb4_unicode_520_ci DEFAULT 'draft',
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `budget_lines`
--

CREATE TABLE `budget_lines` (
  `budget_line_id` int NOT NULL,
  `budget_id` int NOT NULL,
  `account_id` int NOT NULL,
  `budgeted_amount` decimal(15,2) NOT NULL,
  `actual_amount` decimal(15,2) DEFAULT '0.00',
  `variance` decimal(15,2) DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `utilized_amount` decimal(10,2) DEFAULT '0.00',
  `utilization_percentage` decimal(5,2) DEFAULT '0.00',
  `remaining_amount` decimal(10,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `budget_utilization_log`
--

CREATE TABLE `budget_utilization_log` (
  `id` int NOT NULL,
  `budget_id` int NOT NULL,
  `budget_line_id` int NOT NULL,
  `expense_id` int DEFAULT NULL COMMENT 'Reference to expense',
  `amount` decimal(10,2) NOT NULL COMMENT 'Amount utilized',
  `description` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `recorded_by` int NOT NULL,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Budget utilization tracking';

-- --------------------------------------------------------

--
-- Table structure for table `bus_attendance`
--

CREATE TABLE `bus_attendance` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `route_id` int DEFAULT NULL,
  `attendance_date` int NOT NULL,
  `transport_direction` varchar(10) DEFAULT 'none',
  `boarded_in` tinyint(1) DEFAULT '0',
  `boarded_out` tinyint(1) DEFAULT '0',
  `in_time` varchar(10) DEFAULT NULL,
  `out_time` varchar(10) DEFAULT NULL,
  `in_fare` decimal(10,2) DEFAULT '0.00',
  `out_fare` decimal(10,2) DEFAULT '0.00',
  `total_fare` decimal(10,2) DEFAULT '0.00',
  `amount_charged` decimal(10,2) DEFAULT '0.00',
  `payment_status` varchar(20) DEFAULT 'pending',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `payment_time` int DEFAULT NULL,
  `payment_source` varchar(20) DEFAULT NULL,
  `cash_collected` decimal(10,2) DEFAULT '0.00',
  `prepaid_deducted` decimal(10,2) DEFAULT '0.00',
  `collected_by` int DEFAULT NULL,
  `collected_by_role` varchar(20) DEFAULT NULL,
  `collection_point` varchar(20) DEFAULT 'office',
  `conductor_id` int DEFAULT NULL,
  `year` varchar(10) DEFAULT NULL,
  `term` varchar(10) DEFAULT NULL,
  `sem` varchar(10) DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Dumping data for table `bus_attendance`
--


-- --------------------------------------------------------

--
-- Table structure for table `chart_of_accounts`
--

CREATE TABLE `chart_of_accounts` (
  `account_id` int NOT NULL,
  `account_code` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `account_name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `account_type` enum('asset','liability','equity','revenue','expense') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `account_category` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `parent_account_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `chart_of_accounts`
--


-- --------------------------------------------------------

--
-- Table structure for table `ci_sessions`
--

CREATE TABLE `ci_sessions` (
  `id` varchar(40) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `timestamp` int UNSIGNED NOT NULL DEFAULT '0',
  `data` blob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `ci_sessions`
--


-- --------------------------------------------------------

--
-- Table structure for table `class`
--

CREATE TABLE `class` (
  `class_id` int NOT NULL,
  `name` varchar(11) COLLATE utf8mb4_unicode_520_ci DEFAULT '',
  `category` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'Pre-School',
  `name_numeric` varchar(3) COLLATE utf8mb4_unicode_520_ci DEFAULT '',
  `teacher_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `class`
--


-- --------------------------------------------------------

--
-- Table structure for table `class_routine`
--

CREATE TABLE `class_routine` (
  `class_routine_id` int NOT NULL,
  `class_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `time_start` int DEFAULT NULL,
  `time_end` int DEFAULT NULL,
  `time_start_min` int DEFAULT NULL,
  `time_end_min` int DEFAULT NULL,
  `day` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conduct_items`
--

CREATE TABLE `conduct_items` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Stores configurable conduct items for student report cards';

--
-- Dumping data for table `conduct_items`
--


-- --------------------------------------------------------

--
-- Table structure for table `core_competencies`
--

CREATE TABLE `core_competencies` (
  `competency_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `core_competencies`
--


-- --------------------------------------------------------

--
-- Table structure for table `credit_applications`
--

CREATE TABLE `credit_applications` (
  `application_id` int NOT NULL,
  `credit_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `invoice_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `applied_amount` decimal(10,2) NOT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `applied_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `credit_applications`
--


-- --------------------------------------------------------

--
-- Table structure for table `credit_notes`
--

CREATE TABLE `credit_notes` (
  `credit_note_id` int NOT NULL,
  `credit_note_number` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `student_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` enum('pending','approved','applied','cancelled') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `created_at` int NOT NULL,
  `created_by` int NOT NULL,
  `approved_at` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `applied_at` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `credit_system_logs`
--

CREATE TABLE `credit_system_logs` (
  `log_id` int NOT NULL,
  `student_id` int NOT NULL,
  `action` enum('credit_created','credit_applied','credit_adjusted','credit_expired') COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` enum('payment','invoice','adjustment') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `performed_by` int DEFAULT NULL,
  `details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., B4.1.1.1',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_strand_id` int NOT NULL,
  `display_order` int DEFAULT '0',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `credit_system_logs`
--


-- --------------------------------------------------------

--
-- Table structure for table `curriculum_content_standards`
--

CREATE TABLE `curriculum_content_standards` (
  `content_standard_id` int NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., B4.1.1.1',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `sub_strand_id` int NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `curriculum_indicators`
--

CREATE TABLE `curriculum_indicators` (
  `indicator_id` int NOT NULL,
  `sub_strand_id` int NOT NULL COMMENT 'Reference to parent sub-strand',
  `indicator_code` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Unique code for the indicator (e.g., B1.1.1.1)',
  `indicator_text` text COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Full text description of the learning indicator',
  `display_order` int DEFAULT '0' COMMENT 'Order for displaying indicators within sub-strand',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='GES Curriculum Learning Indicators - specific learning outcomes';

-- --------------------------------------------------------

--
-- Table structure for table `curriculum_learning_indicators`
--

CREATE TABLE `curriculum_learning_indicators` (
  `indicator_id` int NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'e.g., B4.1.1.1.1',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_standard_id` int NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `curriculum_strands`
--

CREATE TABLE `curriculum_strands` (
  `strand_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `subject_id` int NOT NULL COMMENT 'References subject.subject_id',
  `class_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Class level this strand applies to',
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `curriculum_sub_strands`
--

CREATE TABLE `curriculum_sub_strands` (
  `sub_strand_id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `strand_id` int NOT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `daily_charge_log`
--

CREATE TABLE `daily_charge_log` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `charge_date` int NOT NULL COMMENT 'Midnight timestamp of the day',
  `feeding_charged` decimal(10,2) DEFAULT '0.00',
  `breakfast_charged` decimal(10,2) DEFAULT '0.00',
  `classes_charged` decimal(10,2) DEFAULT '0.00',
  `water_charged` decimal(10,2) DEFAULT '0.00',
  `transport_charged` decimal(10,2) DEFAULT '0.00',
  `total_charged` decimal(10,2) DEFAULT '0.00',
  `charged_at` int NOT NULL,
  `synced_to_ledger` tinyint(1) DEFAULT '0' COMMENT 'Whether synced to student ledger',
  `ledger_entry_id` int DEFAULT NULL COMMENT 'Reference to student_ledger table',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `daily_charge_log`
--


-- --------------------------------------------------------

--
-- Table structure for table `daily_fee_audit_log`
--

CREATE TABLE `daily_fee_audit_log` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'charge, payment, adjustment, refund',
  `fee_type` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'feeding, breakfast, classes, water, transport',
  `amount` decimal(10,2) NOT NULL,
  `balance_before` decimal(10,2) DEFAULT '0.00',
  `balance_after` decimal(10,2) DEFAULT '0.00',
  `arrears_before` decimal(10,2) DEFAULT '0.00',
  `arrears_after` decimal(10,2) DEFAULT '0.00',
  `performed_by` int NOT NULL,
  `performed_by_role` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `reference_id` int DEFAULT NULL COMMENT 'Reference to transaction or attendance ID',
  `notes` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `created_at` int NOT NULL,
  `modified_at` int NOT NULL,
  `modified_by` int NOT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `daily_fee_audit_log`
--


-- --------------------------------------------------------

--
-- Table structure for table `daily_fee_rates`
--

CREATE TABLE `daily_fee_rates` (
  `id` int NOT NULL,
  `class_id` int NOT NULL,
  `feeding_rate` decimal(10,2) DEFAULT '0.00' COMMENT 'Daily feeding/lunch charge',
  `breakfast_rate` decimal(10,2) DEFAULT '0.00' COMMENT 'Daily breakfast charge',
  `classes_rate` decimal(10,2) DEFAULT '0.00' COMMENT 'Daily classes charge',
  `water_rate` decimal(10,2) DEFAULT '0.00' COMMENT 'Weekly water charge',
  `breakfast_enabled` tinyint(1) DEFAULT '0' COMMENT '1=breakfast available, 0=not available',
  `water_enabled` tinyint(1) DEFAULT '0' COMMENT '1=water charge enabled, 0=disabled',
  `year` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `term` int DEFAULT NULL,
  `sem` int DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `updated_at` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `daily_fee_rates`
--


-- --------------------------------------------------------

--
-- Table structure for table `daily_fee_transactions`
--

CREATE TABLE `daily_fee_transactions` (
  `id` int NOT NULL,
  `transaction_code` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `student_id` int NOT NULL,
  `payment_date` int NOT NULL,
  `feeding_amount` decimal(10,2) DEFAULT '0.00',
  `breakfast_amount` decimal(10,2) DEFAULT '0.00',
  `classes_amount` decimal(10,2) DEFAULT '0.00',
  `water_amount` decimal(10,2) DEFAULT '0.00',
  `transport_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_type` enum('arrears','current','advance','mixed') COLLATE utf8mb4_unicode_520_ci DEFAULT 'current',
  `payment_method` int DEFAULT '1' COMMENT '1=cash, 2=cheque, 3=momo, 4=bank',
  `collected_by` int NOT NULL COMMENT 'User ID who collected payment',
  `collection_point` enum('classroom','office','bus') COLLATE utf8mb4_unicode_520_ci DEFAULT 'office',
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `year` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `term` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `residence_type` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Day or Boarding - captured at payment time',
  `notes` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `synced_to_accounts` tinyint(1) DEFAULT '0',
  `journal_entry_id` int DEFAULT NULL,
  `synced_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `modified_at` int NOT NULL,
  `modified_by` int NOT NULL,
  `modification_count` int NOT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `daily_fee_transactions`
--


-- --------------------------------------------------------

--
-- Table structure for table `daily_fee_wallet`
--

CREATE TABLE `daily_fee_wallet` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `term` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `feeding_balance` decimal(10,2) DEFAULT '0.00' COMMENT 'Prepaid balance for feeding/lunch',
  `breakfast_balance` decimal(10,2) DEFAULT '0.00' COMMENT 'Prepaid balance for breakfast',
  `classes_balance` decimal(10,2) DEFAULT '0.00' COMMENT 'Prepaid balance for classes',
  `water_balance` decimal(10,2) DEFAULT '0.00' COMMENT 'Prepaid balance for water',
  `transport_balance` decimal(10,2) DEFAULT '0.00' COMMENT 'Prepaid balance for transport',
  `feeding_arrears` decimal(10,2) DEFAULT '0.00' COMMENT 'Outstanding feeding debt',
  `breakfast_arrears` decimal(10,2) DEFAULT '0.00' COMMENT 'Outstanding breakfast debt',
  `classes_arrears` decimal(10,2) DEFAULT '0.00' COMMENT 'Outstanding classes debt',
  `water_arrears` decimal(10,2) DEFAULT '0.00' COMMENT 'Outstanding water debt',
  `transport_arrears` decimal(10,2) DEFAULT '0.00' COMMENT 'Outstanding transport debt',
  `last_updated` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `daily_fee_wallet`
--


-- --------------------------------------------------------

--
-- Table structure for table `daily_transport_choices`
--

CREATE TABLE `daily_transport_choices` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `choice_date` int NOT NULL COMMENT 'Date for which choice is made',
  `transport_direction` enum('none','in','out','both') COLLATE utf8mb4_unicode_520_ci DEFAULT 'none',
  `choice_made_at` int NOT NULL COMMENT 'When parent made the choice',
  `choice_made_by` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'parent, teacher, admin',
  `notes` mediumtext COLLATE utf8mb4_unicode_520_ci COMMENT 'Optional reason/note',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `department`
--

CREATE TABLE `department` (
  `id` int NOT NULL,
  `dep_name` varchar(64) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `desciplinary`
--

CREATE TABLE `desciplinary` (
  `id` int NOT NULL,
  `em_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `action` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `title` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `description` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `designation`
--

CREATE TABLE `designation` (
  `id` int NOT NULL,
  `des_name` varchar(64) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discount_applications`
--

CREATE TABLE `discount_applications` (
  `application_id` bigint UNSIGNED NOT NULL,
  `student_id` int NOT NULL,
  `profile_id` int NOT NULL,
  `discount_category` enum('invoice','daily_fees') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'invoice, daily_fee_transaction',
  `reference_id` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'invoice_code or transaction_id',
  `bill_item_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'school_fees, feeding, classes, etc',
  `original_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `discount_percentage` decimal(5,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `final_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `year` int NOT NULL,
  `term` int DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `applied_by` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Enterprise discount application ledger';

--
-- Dumping data for table `discount_applications`
--


-- --------------------------------------------------------

--
-- Table structure for table `discount_approvals`
--

CREATE TABLE `discount_approvals` (
  `approval_id` int NOT NULL,
  `discount_type_id` int NOT NULL,
  `requested_by` int NOT NULL,
  `requested_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `reason` text COLLATE utf8mb4_unicode_520_ci,
  `approval_notes` text COLLATE utf8mb4_unicode_520_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discount_audit_log`
--

CREATE TABLE `discount_audit_log` (
  `audit_id` bigint UNSIGNED NOT NULL,
  `application_id` bigint UNSIGNED DEFAULT NULL,
  `action` enum('created','modified','reversed','approved','rejected') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `entity_id` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `performed_by` int NOT NULL,
  `performed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_520_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Comprehensive audit trail for discount operations';

-- --------------------------------------------------------

--
-- Table structure for table `discount_audit_trail`
--

CREATE TABLE `discount_audit_trail` (
  `audit_id` int NOT NULL,
  `entity_type` enum('discount_type','benefit_category','student_assignment') COLLATE utf8mb4_unicode_520_ci DEFAULT 'discount_type' COMMENT 'Type of entity being audited',
  `entity_id` int NOT NULL COMMENT 'ID of discount_type or benefit_category',
  `action` enum('created','updated','deleted','activated','deactivated') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `old_values` text COLLATE utf8mb4_unicode_520_ci,
  `new_values` text COLLATE utf8mb4_unicode_520_ci,
  `changed_by` int NOT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `discount_categories`
--

CREATE TABLE `discount_categories` (
  `category_id` tinyint NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `discount_categories`
--


-- --------------------------------------------------------

--
-- Table structure for table `discount_profiles`
--

CREATE TABLE `discount_profiles` (
  `profile_id` int NOT NULL,
  `profile_name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `discount_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `bill_item_ids` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `discount_category` enum('invoice','daily_fees') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'invoice',
  `discount_method` enum('percentage','fixed') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'percentage',
  `discount_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `discount_profiles`
--


-- --------------------------------------------------------

--
-- Table structure for table `discount_profile_rules`
--

CREATE TABLE `discount_profile_rules` (
  `rule_id` int NOT NULL,
  `profile_id` int NOT NULL,
  `class_id` int DEFAULT NULL COMMENT 'NULL or 0 means all classes',
  `bill_category_id` int DEFAULT NULL COMMENT 'NULL means all bill categories',
  `discount_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `discount_profile_rules`
--


-- --------------------------------------------------------

--
-- Table structure for table `discount_summary_cache`
--

CREATE TABLE `discount_summary_cache` (
  `cache_id` int UNSIGNED NOT NULL,
  `discount_category` enum('invoice','daily_fees') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `year` int NOT NULL,
  `term` int DEFAULT NULL,
  `profile_id` int DEFAULT NULL,
  `total_applications` int NOT NULL DEFAULT '0',
  `total_original_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_discount_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_final_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `unique_students` int NOT NULL DEFAULT '0',
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Aggregated discount statistics cache';

-- --------------------------------------------------------

--
-- Table structure for table `document`
--

CREATE TABLE `document` (
  `document_id` int NOT NULL,
  `title` longtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `file_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `file_path` longtext COLLATE utf8mb4_unicode_520_ci,
  `file_type` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` longtext COLLATE utf8mb4_unicode_520_ci,
  `teacher_id` int DEFAULT NULL,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `start_date` longtext COLLATE utf8mb4_unicode_520_ci,
  `end_date` longtext COLLATE utf8mb4_unicode_520_ci,
  `subject_id` int DEFAULT NULL,
  `status` enum('Approved','Declined','Pending') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Pending',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `document`
--


-- --------------------------------------------------------

--
-- Table structure for table `dormitory`
--

CREATE TABLE `dormitory` (
  `dormitory_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `number_of_room` longtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `dormitory`
--


-- --------------------------------------------------------

--
-- Table structure for table `earned_leave`
--

CREATE TABLE `earned_leave` (
  `id` int NOT NULL,
  `em_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `present_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `hour` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `education`
--

CREATE TABLE `education` (
  `id` int NOT NULL,
  `emp_id` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `edu_type` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `institute` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `result` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `year` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_log`
--

CREATE TABLE `email_log` (
  `log_id` int NOT NULL,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `type` enum('invoice','receipt','notification','other') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `reference_id` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sent_at` int NOT NULL,
  `status` enum('sent','failed','pending') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `error_message` text COLLATE utf8mb4_unicode_520_ci,
  `sent_by` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` int NOT NULL,
  `recipient` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` enum('sent','failed') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'sent',
  `sent_at` datetime NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee`
--

CREATE TABLE `employee` (
  `id` int NOT NULL,
  `em_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_code` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `des_id` int DEFAULT NULL,
  `dep_id` int DEFAULT NULL,
  `first_name` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `last_name` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_email` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_password` varchar(512) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `em_role` enum('ADMIN','EMPLOYEE','SUPER ADMIN') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'EMPLOYEE',
  `em_address` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'ACTIVE',
  `em_gender` enum('Male','Female') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Male',
  `em_phone` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_phone2` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_birthday` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_blood_group` enum('O+','O-','A+','A-','B+','B-','AB+','OB+') COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_joining_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_contact_end` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_image` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `em_nid` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employee_file`
--

CREATE TABLE `employee_file` (
  `id` int NOT NULL,
  `em_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `file_title` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `file_url` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_address`
--

CREATE TABLE `emp_address` (
  `id` int NOT NULL,
  `emp_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `city` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `country` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `address` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `type` enum('Present','Permanent') COLLATE utf8mb4_unicode_520_ci DEFAULT 'Present',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_assets`
--

CREATE TABLE `emp_assets` (
  `id` int NOT NULL,
  `emp_id` int NOT NULL,
  `assets_id` int NOT NULL,
  `given_date` date NOT NULL,
  `return_date` date NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_attendance`
--

CREATE TABLE `emp_attendance` (
  `id` int NOT NULL,
  `emp_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `atten_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `signin_time` time DEFAULT NULL,
  `signout_time` time DEFAULT NULL,
  `working_hour` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `place` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `absence` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `overtime` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `earnleave` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_bank_info`
--

CREATE TABLE `emp_bank_info` (
  `id` int NOT NULL,
  `em_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `holder_name` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `bank_name` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `branch_name` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `account_number` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `account_type` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_experience`
--

CREATE TABLE `emp_experience` (
  `id` int NOT NULL,
  `emp_id` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `exp_company` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `exp_com_position` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `exp_com_address` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `exp_workduration` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_leave`
--

CREATE TABLE `emp_leave` (
  `id` int NOT NULL,
  `em_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `typeid` int NOT NULL,
  `leave_type` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `start_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `end_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `leave_duration` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `apply_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `reason` varchar(1024) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `leave_status` enum('Approve','Not Approve','Rejected') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Not Approve',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_penalty`
--

CREATE TABLE `emp_penalty` (
  `id` int NOT NULL,
  `emp_id` int NOT NULL,
  `penalty_id` int NOT NULL,
  `penalty_desc` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_salary`
--

CREATE TABLE `emp_salary` (
  `id` int NOT NULL,
  `emp_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `type_id` int NOT NULL,
  `total` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `emp_training`
--

CREATE TABLE `emp_training` (
  `id` int NOT NULL,
  `trainig_id` int NOT NULL,
  `emp_id` int NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enroll`
--

CREATE TABLE `enroll` (
  `enroll_id` int NOT NULL,
  `enroll_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `student_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `transport_id` int DEFAULT NULL,
  `roll` int DEFAULT NULL,
  `date_added` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `status` enum('open','close') COLLATE utf8mb4_unicode_520_ci DEFAULT 'open',
  `status_attendance` enum('open','close') COLLATE utf8mb4_unicode_520_ci DEFAULT 'open',
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `mute` enum('0','1','2') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `residence_type` enum('Day','Boarding') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Day',
  `house_id` int DEFAULT NULL,
  `dormitory_id` int DEFAULT NULL,
  `bed_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `enroll`
--


-- --------------------------------------------------------

--
-- Table structure for table `enterprise_exams`
--

CREATE TABLE `enterprise_exams` (
  `exam_id` int NOT NULL,
  `exam_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `exam_type` enum('mid_term','end_term','mock','waec') COLLATE utf8mb4_general_ci NOT NULL,
  `class_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('draft','active','completed','published') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enterprise_exam_subjects`
--

CREATE TABLE `enterprise_exam_subjects` (
  `id` int NOT NULL,
  `exam_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `total_marks` int DEFAULT '100',
  `pass_mark` int DEFAULT '50',
  `weight_percentage` decimal(5,2) DEFAULT '100.00',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enterprise_student_marks`
--

CREATE TABLE `enterprise_student_marks` (
  `mark_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `class_score` decimal(5,2) DEFAULT '0.00',
  `exam_score` decimal(5,2) DEFAULT '0.00',
  `total_score` decimal(5,2) GENERATED ALWAYS AS ((`class_score` + `exam_score`)) STORED,
  `grade` varchar(2) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `remark` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `position` int DEFAULT NULL,
  `recorded_by` int DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `enterprise_terminal_reports`
--

CREATE TABLE `enterprise_terminal_reports` (
  `report_id` int NOT NULL,
  `student_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `class_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `total_score` decimal(8,2) DEFAULT NULL,
  `average_score` decimal(5,2) DEFAULT NULL,
  `aggregate` decimal(5,2) DEFAULT NULL,
  `position` int DEFAULT NULL,
  `out_of` int DEFAULT NULL,
  `attendance_present` int DEFAULT '0',
  `attendance_total` int DEFAULT '0',
  `conduct` text COLLATE utf8mb4_general_ci,
  `interest` text COLLATE utf8mb4_general_ci,
  `head_teacher_remarks` text COLLATE utf8mb4_general_ci,
  `status` enum('draft','published') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `exam`
--

CREATE TABLE `exam` (
  `exam_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `date` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `category_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `exam`
--


-- --------------------------------------------------------

--
-- Table structure for table `exam_category`
--

CREATE TABLE `exam_category` (
  `category_id` int NOT NULL,
  `category_name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `exam_category`
--


-- --------------------------------------------------------

--
-- Table structure for table `exam_marks`
--

CREATE TABLE `exam_marks` (
  `mark_id` int NOT NULL,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `class_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `total_score` decimal(5,2) DEFAULT '0.00',
  `grade` varchar(2) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `expenses_enhanced`
--

CREATE TABLE `expenses_enhanced` (
  `id` int NOT NULL,
  `expense_date` date NOT NULL COMMENT 'Date of expense',
  `description` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Expense description',
  `category_id` int NOT NULL COMMENT 'Expense category',
  `budget_line_id` int DEFAULT NULL,
  `vendor` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Vendor/Supplier name',
  `amount` decimal(10,2) NOT NULL COMMENT 'Expense amount',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'cash, bank_transfer, cheque, mobile_money',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Payment reference',
  `attachment` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Receipt/invoice file path',
  `notes` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Additional notes',
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending' COMMENT 'Approval status',
  `requested_by` int NOT NULL COMMENT 'User who submitted',
  `approved_by` int DEFAULT NULL COMMENT 'User who approved/rejected',
  `approved_at` timestamp NULL DEFAULT NULL COMMENT 'Approval timestamp',
  `rejection_reason` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Reason for rejection',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `linked_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Enhanced expense tracking with approval workflow';

-- --------------------------------------------------------

--
-- Table structure for table `expense_categories_enhanced`
--

CREATE TABLE `expense_categories_enhanced` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Category name',
  `description` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Category description',
  `budget_code` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Budget account code',
  `requires_approval` tinyint(1) DEFAULT '1' COMMENT 'Requires approval flag',
  `approval_threshold` decimal(10,2) DEFAULT NULL COMMENT 'Auto-approve below this amount',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Expense categories';

--
-- Dumping data for table `expense_categories_enhanced`
--


-- --------------------------------------------------------

--
-- Table structure for table `expense_category`
--

CREATE TABLE `expense_category` (
  `expense_category_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `icon` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'folder',
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `expense_category`
--


-- --------------------------------------------------------

--
-- Table structure for table `fee_collection_assignments`
--

CREATE TABLE `fee_collection_assignments` (
  `id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `class_id` int NOT NULL,
  `can_collect_feeding` tinyint(1) DEFAULT '0',
  `can_collect_classes` tinyint(1) DEFAULT '0',
  `can_collect_transport` tinyint(1) DEFAULT '0',
  `can_collect_breakfast` tinyint(1) NOT NULL DEFAULT '0',
  `can_collect_water` tinyint(1) NOT NULL DEFAULT '0',
  `year` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `term` varchar(10) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `created_at` int NOT NULL,
  `updated_at` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `fee_collection_assignments`
--


-- --------------------------------------------------------

--
-- Table structure for table `fee_collection_modes`
--

CREATE TABLE `fee_collection_modes` (
  `id` int NOT NULL,
  `mode_name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `fee_collection_modes`
--


-- --------------------------------------------------------

--
-- Table structure for table `fee_structures`
--

CREATE TABLE `fee_structures` (
  `structure_id` int NOT NULL,
  `class_id` int NOT NULL,
  `academic_year` int NOT NULL,
  `term` int NOT NULL,
  `fee_items` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'JSON array of fee items',
  `total_amount` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `field_visit`
--

CREATE TABLE `field_visit` (
  `id` int NOT NULL,
  `project_id` varchar(256) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `emp_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `field_location` varchar(512) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `start_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `approx_end_date` varchar(28) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `total_days` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `notes` varchar(500) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `actual_return_date` varchar(28) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` enum('Approved','Not Approve','Rejected') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Not Approve',
  `attendance_updated` varchar(11) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_audit_trail`
--

CREATE TABLE `finance_audit_trail` (
  `audit_id` int NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `record_id` int NOT NULL,
  `action` enum('create','update','delete','post','void') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `old_values` text COLLATE utf8mb4_unicode_520_ci,
  `new_values` text COLLATE utf8mb4_unicode_520_ci,
  `user_id` int NOT NULL,
  `user_type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance_dashboard_cache`
--

CREATE TABLE `finance_dashboard_cache` (
  `cache_id` int NOT NULL,
  `cache_key` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cache_data` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `year` int NOT NULL,
  `term` int NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_alert_resolutions`
--

CREATE TABLE `financial_alert_resolutions` (
  `id` int NOT NULL,
  `alert_key` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `resolved_by` int NOT NULL,
  `resolved_at` int NOT NULL,
  `notes` mediumtext COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_analytics_cache`
--

CREATE TABLE `financial_analytics_cache` (
  `cache_id` int NOT NULL,
  `cache_key` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `cache_data` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `period` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `created_at` int NOT NULL,
  `expires_at` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `financial_audit_trail`
--

CREATE TABLE `financial_audit_trail` (
  `id` int NOT NULL,
  `module` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Module name (expense, budget, reconciliation, etc)',
  `action` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Action performed (create, update, delete, approve, etc)',
  `record_id` int NOT NULL COMMENT 'ID of affected record',
  `old_values` text COLLATE utf8mb4_unicode_520_ci COMMENT 'JSON of old values',
  `new_values` text COLLATE utf8mb4_unicode_520_ci COMMENT 'JSON of new values',
  `user_id` int NOT NULL COMMENT 'User who performed action',
  `user_type` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'admin, teacher, etc',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Audit trail for financial operations';

-- --------------------------------------------------------

--
-- Table structure for table `financial_integration_log`
--

CREATE TABLE `financial_integration_log` (
  `log_id` int NOT NULL,
  `integration_type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'fee_to_accounts, invoice_to_accounts, etc',
  `source_table` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `source_id` int NOT NULL,
  `target_table` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `target_id` int DEFAULT NULL,
  `status` enum('pending','success','failed') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `error_message` text COLLATE utf8mb4_unicode_520_ci,
  `created_at` int NOT NULL,
  `processed_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `financial_integration_log`
--


-- --------------------------------------------------------

--
-- Table structure for table `financial_reports_cache`
--

CREATE TABLE `financial_reports_cache` (
  `cache_id` int NOT NULL,
  `report_type` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `report_parameters` text COLLATE utf8mb4_unicode_520_ci,
  `report_data` longtext COLLATE utf8mb4_unicode_520_ci,
  `generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fiscal_periods`
--

CREATE TABLE `fiscal_periods` (
  `period_id` int NOT NULL,
  `fiscal_year_id` int NOT NULL,
  `period_name` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `period_number` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('open','closed','locked') COLLATE utf8mb4_unicode_520_ci DEFAULT 'open',
  `closed_by` int DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fiscal_years`
--

CREATE TABLE `fiscal_years` (
  `fiscal_year_id` int NOT NULL,
  `year_name` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('open','closed','locked') COLLATE utf8mb4_unicode_520_ci DEFAULT 'open',
  `is_current` tinyint(1) DEFAULT '0',
  `closed_by` int DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `flutter_user`
--

CREATE TABLE `flutter_user` (
  `flutter_id` int NOT NULL,
  `flutter_name` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `flutter_phone` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `flutter_email` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `flutter_password` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_field_preferences`
--

CREATE TABLE `form_field_preferences` (
  `id` int NOT NULL,
  `field_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `is_visible` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `form_field_preferences`
--


-- --------------------------------------------------------

--
-- Table structure for table `frontend_events`
--

CREATE TABLE `frontend_events` (
  `frontend_events_id` int NOT NULL,
  `title` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `timestamp` int DEFAULT NULL,
  `status` int NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `frontend_gallery`
--

CREATE TABLE `frontend_gallery` (
  `frontend_gallery_id` int NOT NULL,
  `title` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `date_added` int DEFAULT NULL,
  `image` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `show_on_website` int NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `frontend_gallery_image`
--

CREATE TABLE `frontend_gallery_image` (
  `frontend_gallery_image_id` int NOT NULL,
  `frontend_gallery_id` int DEFAULT NULL,
  `title` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `image` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `frontend_general_settings`
--

CREATE TABLE `frontend_general_settings` (
  `frontend_general_settings_id` int NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `frontend_news`
--

CREATE TABLE `frontend_news` (
  `frontend_news_id` int NOT NULL,
  `title` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `date_added` int DEFAULT NULL,
  `image` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grade`
--

CREATE TABLE `grade` (
  `grade_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `grade_point` longtext COLLATE utf8mb4_unicode_520_ci,
  `grade_point_numeric` double NOT NULL DEFAULT '0',
  `mark_from` double DEFAULT NULL,
  `mark_upto` double DEFAULT NULL,
  `comment` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `grade`
--


-- --------------------------------------------------------

--
-- Table structure for table `grade_2`
--

CREATE TABLE `grade_2` (
  `grade_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `grade_point` longtext COLLATE utf8mb4_unicode_520_ci,
  `grade_point_numeric` double NOT NULL DEFAULT '0',
  `mark_from` double DEFAULT NULL,
  `mark_upto` double DEFAULT NULL,
  `comment` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `grade_2`
--


-- --------------------------------------------------------

--
-- Table structure for table `grade_creche`
--

CREATE TABLE `grade_creche` (
  `grade_id` int NOT NULL,
  `full_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `abbrev` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `grade_creche`
--


-- --------------------------------------------------------

--
-- Table structure for table `group_message`
--

CREATE TABLE `group_message` (
  `group_message_id` int NOT NULL,
  `group_message_thread_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `sender` longtext COLLATE utf8mb4_unicode_520_ci,
  `message` longtext COLLATE utf8mb4_unicode_520_ci,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `read_status` int DEFAULT NULL,
  `attached_file_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_message_other`
--

CREATE TABLE `group_message_other` (
  `member_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `phone` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `group_message_thread` int NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_message_thread`
--

CREATE TABLE `group_message_thread` (
  `group_message_thread_id` int NOT NULL,
  `group_message_thread_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `members` longtext COLLATE utf8mb4_unicode_520_ci,
  `group_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `last_message_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `created_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `head_teacher_remarks_ranges`
--

CREATE TABLE `head_teacher_remarks_ranges` (
  `id` int NOT NULL,
  `min_percentage` decimal(5,2) NOT NULL COMMENT 'Minimum score percentage (0.00-100.00)',
  `max_percentage` decimal(5,2) NOT NULL COMMENT 'Maximum score percentage (0.00-100.00)',
  `remark_text` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Remark text to display for this range',
  `display_order` int NOT NULL DEFAULT '0' COMMENT 'Display order for admin interface',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Active status (1=active, 0=inactive)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `head_teacher_remarks_ranges`
--


-- --------------------------------------------------------

--
-- Table structure for table `hod_subjects`
--

CREATE TABLE `hod_subjects` (
  `id` int NOT NULL,
  `teacher_id` int NOT NULL COMMENT 'HOD teacher ID - references teacher.teacher_id',
  `subject_id` int NOT NULL COMMENT 'References subject.subject_id',
  `assigned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_by` int NOT NULL COMMENT 'Admin user ID - references admin.admin_id'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `holiday`
--

CREATE TABLE `holiday` (
  `id` int NOT NULL,
  `holiday_name` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `from_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `to_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `number_of_days` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `year` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hubtel_transaction_logs`
--

CREATE TABLE `hubtel_transaction_logs` (
  `log_id` int NOT NULL,
  `transaction_ref` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `request_data` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `response_data` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `response_code` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `incomplete_fee_transactions`
--

CREATE TABLE `incomplete_fee_transactions` (
  `id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `fees` text COLLATE utf8mb4_unicode_520_ci,
  `tendered` decimal(10,2) DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `payment_date` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `created_at` int DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `interest_items`
--

CREATE TABLE `interest_items` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Stores configurable interest items for student report cards';

--
-- Dumping data for table `interest_items`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_audit_log`
--

CREATE TABLE `inventory_audit_log` (
  `id` int NOT NULL,
  `action_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int NOT NULL,
  `old_values` text COLLATE utf8mb4_unicode_ci,
  `new_values` text COLLATE utf8mb4_unicode_ci,
  `performed_by` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','EXCLUDED') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `last_sync_attempt` datetime DEFAULT NULL,
  `sync_error_message` text COLLATE utf8mb4_unicode_ci,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_audit_log`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_categories`
--

CREATE TABLE `inventory_categories` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_categories`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_locations`
--

CREATE TABLE `inventory_locations` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `manager_id` int DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_locations`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_products`
--

CREATE TABLE `inventory_products` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `barcode` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `supplier_id` int DEFAULT NULL,
  `last_restocked` date DEFAULT NULL,
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_asset` tinyint(1) DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `selling_price` decimal(10,2) DEFAULT '0.00',
  `quantity` int DEFAULT '0',
  `unit_of_measure` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'pieces',
  `reorder_level` int DEFAULT '10',
  `location` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1' COMMENT '1=Active, 0=Inactive',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_products`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_purchases`
--

CREATE TABLE `inventory_purchases` (
  `id` int NOT NULL,
  `po_code` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `supplier_id` int DEFAULT NULL COMMENT 'FK to inventory_suppliers',
  `purchase_date` date NOT NULL,
  `expected_delivery_date` date DEFAULT NULL,
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Invoice/PO number',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Final total after discount (same as final_total, kept for compatibility)',
  `amount_paid` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Total amount paid so far',
  `payment_status` enum('unpaid','partially_paid','fully_paid') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'unpaid' COMMENT 'Current payment status',
  `last_payment_date` date DEFAULT NULL COMMENT 'Date of most recent payment',
  `status` enum('pending','received','cancelled') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `created_by` int NOT NULL COMMENT 'FK to admin',
  `received_by` int DEFAULT NULL COMMENT 'FK to admin',
  `received_date` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `discount_type` enum('percentage','fixed') COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Type of discount applied',
  `discount_value` decimal(10,2) DEFAULT '0.00' COMMENT 'Discount value (percentage or fixed amount)',
  `discount_amount` decimal(10,2) DEFAULT '0.00' COMMENT 'Calculated discount amount in currency',
  `subtotal` decimal(10,2) DEFAULT '0.00' COMMENT 'Total before discount',
  `final_total` decimal(10,2) DEFAULT '0.00' COMMENT 'Total after discount (subtotal - discount_amount)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `inventory_purchases`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_purchase_items`
--

CREATE TABLE `inventory_purchase_items` (
  `id` int NOT NULL,
  `purchase_id` int NOT NULL COMMENT 'FK to inventory_purchases',
  `product_id` int NOT NULL COMMENT 'FK to inventory_products',
  `quantity` int NOT NULL,
  `cost_price` decimal(10,2) NOT NULL COMMENT 'Cost per unit',
  `total_cost` decimal(10,2) NOT NULL COMMENT 'cost_price * quantity'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `inventory_purchase_items`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_purchase_payments`
--

CREATE TABLE `inventory_purchase_payments` (
  `id` int NOT NULL,
  `purchase_id` int NOT NULL COMMENT 'FK to inventory_purchases',
  `payment_date` date NOT NULL COMMENT 'Date payment was made',
  `amount` decimal(10,2) NOT NULL COMMENT 'Payment amount',
  `payment_method_id` int NOT NULL COMMENT 'FK to payment_methods',
  `reference_number` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Transaction/cheque reference',
  `notes` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Payment notes',
  `recorded_by` int NOT NULL COMMENT 'FK to admin who recorded payment',
  `expenditure_payment_id` int DEFAULT NULL COMMENT 'FK to payment table entry',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `inventory_purchase_payments`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_returns`
--

CREATE TABLE `inventory_returns` (
  `id` int NOT NULL,
  `original_sale_id` int NOT NULL COMMENT 'FK to inventory_sales',
  `return_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_refund_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `return_reason` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Defective, Wrong item, Changed mind, Expired, Other',
  `return_notes` text COLLATE utf8mb4_unicode_520_ci,
  `refund_method` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Cash, 2=Account Credit, 3=Original Method',
  `processed_by` int NOT NULL COMMENT 'FK to admin',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `inventory_returns`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_return_items`
--

CREATE TABLE `inventory_return_items` (
  `id` int NOT NULL,
  `return_id` int NOT NULL COMMENT 'FK to inventory_returns',
  `sale_item_id` int NOT NULL COMMENT 'FK to inventory_sale_items',
  `product_id` int NOT NULL COMMENT 'FK to inventory_products',
  `quantity_returned` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL COMMENT 'Original unit price',
  `refund_amount` decimal(10,2) NOT NULL COMMENT 'unit_price * quantity_returned'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `inventory_return_items`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_sales`
--

CREATE TABLE `inventory_sales` (
  `id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_method` tinyint(1) DEFAULT '1' COMMENT '1=Cash, 2=Bank, 3=Mobile Money',
  `served_by` int DEFAULT NULL,
  `sale_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `receipt_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_sales`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_sale_items`
--

CREATE TABLE `inventory_sale_items` (
  `id` int NOT NULL,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `inventory_sale_items`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_stock_movements`
--

CREATE TABLE `inventory_stock_movements` (
  `id` int NOT NULL,
  `product_id` int NOT NULL,
  `movement_type` enum('in','out','adjustment','transfer') COLLATE utf8mb4_general_ci NOT NULL,
  `quantity` int NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `performed_by` int NOT NULL,
  `movement_date` datetime DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_stock_movements`
--


-- --------------------------------------------------------

--
-- Table structure for table `inventory_suppliers`
--

CREATE TABLE `inventory_suppliers` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_general_ci,
  `status` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_suppliers`
--


-- --------------------------------------------------------

--
-- Table structure for table `invoice`
--

CREATE TABLE `invoice` (
  `invoice_id` int NOT NULL,
  `invoice_code` bigint DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `description` varchar(225) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `amount` double DEFAULT NULL,
  `discount` double NOT NULL DEFAULT '0',
  `amount_paid` double DEFAULT NULL,
  `credit_applied` decimal(10,2) DEFAULT '0.00',
  `original_due` decimal(10,2) GENERATED ALWAYS AS ((`amount` - `amount_paid`)) STORED,
  `net_due` decimal(10,2) GENERATED ALWAYS AS (((`amount` - `amount_paid`) - `credit_applied`)) STORED,
  `due` double DEFAULT NULL,
  `due_date` date DEFAULT NULL COMMENT 'Payment due date',
  `discount_applied` tinyint(1) DEFAULT '0',
  `benefit_category_id` int DEFAULT NULL,
  `benefit_category_name` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `benefit_discount_type` enum('percentage','fixed') COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `benefit_feeding_amount` decimal(10,2) DEFAULT '0.00',
  `benefit_classes_amount` decimal(10,2) DEFAULT '0.00',
  `benefit_tuition_amount` decimal(10,2) DEFAULT '0.00',
  `benefit_total_discount` decimal(10,2) DEFAULT '0.00',
  `creation_timestamp` int DEFAULT NULL,
  `payment_timestamp` int DEFAULT NULL,
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `payment_details` varchar(225) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `residence_type` enum('Day','Boarding') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Day',
  `year` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `term` int DEFAULT NULL,
  `sem` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `mute` enum('0','1') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `can_delete` enum('default','request','approved','declined','trash') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'default',
  `can_edit` enum('default','request','approved','declined') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'default',
  `delete_request_issuer_id` int DEFAULT NULL,
  `edit_request_issuer_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `locked_at` timestamp NULL DEFAULT NULL COMMENT 'When the record was locked',
  `locked_reason` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Why the record was locked',
  `approval_status` enum('none','pending','approved','rejected') COLLATE utf8mb4_unicode_520_ci DEFAULT 'none',
  `approval_requested_by` int DEFAULT NULL,
  `approval_requested_at` timestamp NULL DEFAULT NULL,
  `approval_handled_by` int DEFAULT NULL,
  `approval_handled_at` timestamp NULL DEFAULT NULL,
  `approval_notes` text COLLATE utf8mb4_unicode_520_ci,
  `synced_to_ledger` tinyint(1) DEFAULT '0',
  `ledger_entry_id` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `invoice`
--


-- --------------------------------------------------------

--
-- Table structure for table `invoice_access_tokens`
--

CREATE TABLE `invoice_access_tokens` (
  `id` int NOT NULL,
  `invoice_code` varchar(50) COLLATE utf8mb3_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb3_unicode_ci NOT NULL,
  `expires_at` int NOT NULL,
  `created_at` int NOT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb3_unicode_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb3_unicode_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_discounts`
--

CREATE TABLE `invoice_discounts` (
  `discount_id` int NOT NULL,
  `student_id` int NOT NULL,
  `invoice_code` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `discount_category` enum('invoice','daily_fees') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'invoice',
  `profile_id` int DEFAULT NULL,
  `discount_method` enum('percentage','fixed') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `discount_value` decimal(10,2) NOT NULL,
  `discount_amount` decimal(10,2) NOT NULL,
  `reason` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `applied_by` int NOT NULL,
  `created_by` int DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `status` enum('pending','approved','rejected','pending_removal') COLLATE utf8mb4_unicode_520_ci DEFAULT 'approved',
  `rejection_reason` text COLLATE utf8mb4_unicode_520_ci,
  `year` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `term` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `invoice_discounts`
--


-- --------------------------------------------------------

--
-- Table structure for table `invoice_discount_items`
--

CREATE TABLE `invoice_discount_items` (
  `id` int NOT NULL,
  `discount_id` int NOT NULL COMMENT 'FK to invoice_discounts.id',
  `invoice_id` int NOT NULL COMMENT 'FK to invoice.invoice_id',
  `invoice_code` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `student_id` int NOT NULL,
  `item_title` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `original_amount` decimal(10,2) NOT NULL COMMENT 'Original item amount before discount',
  `discount_amount` decimal(10,2) NOT NULL COMMENT 'Exact discount applied to this item',
  `discounted_amount` decimal(10,2) NOT NULL COMMENT 'Final amount after discount',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `invoice_discount_items`
--


-- --------------------------------------------------------

--
-- Table structure for table `invoice_modification_requests`
--

CREATE TABLE `invoice_modification_requests` (
  `request_id` int NOT NULL,
  `invoice_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `student_id` int NOT NULL,
  `request_type` enum('edit','delete') COLLATE utf8mb4_general_ci NOT NULL,
  `requested_by` int NOT NULL,
  `request_reason` text COLLATE utf8mb4_general_ci NOT NULL,
  `old_data` text COLLATE utf8mb4_general_ci NOT NULL COMMENT 'JSON of original invoice items',
  `new_data` text COLLATE utf8mb4_general_ci COMMENT 'JSON of new invoice items for edit',
  `status` enum('pending','approved','declined') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `reviewed_by` int DEFAULT NULL,
  `review_comment` text COLLATE utf8mb4_general_ci,
  `reviewed_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice_modification_requests`
--


-- --------------------------------------------------------

--
-- Table structure for table `invoice_payment_audit_log`
--

CREATE TABLE `invoice_payment_audit_log` (
  `id` int NOT NULL,
  `record_type` enum('invoice','payment') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `record_id` int NOT NULL,
  `action` enum('create','edit','delete','lock','unlock','approve','reject') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `performed_by` int NOT NULL,
  `performed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `old_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `new_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_payment_links`
--

CREATE TABLE `invoice_payment_links` (
  `id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `linked_at` datetime NOT NULL,
  `linked_by` int NOT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_sms_log`
--

CREATE TABLE `invoice_sms_log` (
  `id` int NOT NULL,
  `recipient` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb3_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `reference_id` varchar(100) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `sent_at` int NOT NULL,
  `status` varchar(20) COLLATE utf8mb3_unicode_ci NOT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb3_unicode_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb3_unicode_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `invoice_summary`
-- (See below for the actual view)
--
CREATE TABLE `invoice_summary` (
`student_id` int
,`invoice_code` bigint
,`year` varchar(20)
,`term` int
,`student_name` longtext
,`student_code` longtext
,`class_name` varchar(11)
,`total_amount` double
,`total_paid` double
,`total_due` double
,`total_discount` decimal(10,2)
,`item_count` bigint
,`invoice_date` int
,`last_payment_date` int
,`payment_status` varchar(7)
);

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `entry_id` int NOT NULL,
  `entry_number` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `entry_date` date NOT NULL,
  `entry_type` enum('general','adjustment','closing','opening','reversal') COLLATE utf8mb4_unicode_520_ci DEFAULT 'general',
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'invoice, payment, expense, etc',
  `reference_id` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `source_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `source_id` int DEFAULT NULL,
  `total_debit` decimal(15,2) DEFAULT '0.00',
  `total_credit` decimal(15,2) DEFAULT '0.00',
  `status` enum('draft','posted','void') COLLATE utf8mb4_unicode_520_ci DEFAULT 'draft',
  `posted_by` int DEFAULT NULL,
  `posted_at` timestamp NULL DEFAULT NULL,
  `fiscal_year` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `fiscal_period` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `journal_entries`
--


-- --------------------------------------------------------

--
-- Table structure for table `journal_entry_lines`
--

CREATE TABLE `journal_entry_lines` (
  `line_id` int NOT NULL,
  `entry_id` int NOT NULL,
  `account_id` int NOT NULL,
  `debit_amount` decimal(15,2) DEFAULT '0.00',
  `credit_amount` decimal(15,2) DEFAULT '0.00',
  `description` text COLLATE utf8mb4_unicode_520_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `journal_entry_lines`
--


-- --------------------------------------------------------

--
-- Table structure for table `language`
--

CREATE TABLE `language` (
  `phrase_id` int NOT NULL,
  `phrase` longtext COLLATE utf8mb4_unicode_520_ci,
  `english` longtext COLLATE utf8mb4_unicode_520_ci,
  `bengali` longtext COLLATE utf8mb4_unicode_520_ci,
  `spanish` longtext COLLATE utf8mb4_unicode_520_ci,
  `arabic` longtext COLLATE utf8mb4_unicode_520_ci,
  `dutch` longtext COLLATE utf8mb4_unicode_520_ci,
  `russian` longtext COLLATE utf8mb4_unicode_520_ci,
  `chinese` longtext COLLATE utf8mb4_unicode_520_ci,
  `turkish` longtext COLLATE utf8mb4_unicode_520_ci,
  `portuguese` longtext COLLATE utf8mb4_unicode_520_ci,
  `hungarian` longtext COLLATE utf8mb4_unicode_520_ci,
  `french` longtext COLLATE utf8mb4_unicode_520_ci,
  `greek` longtext COLLATE utf8mb4_unicode_520_ci,
  `german` longtext COLLATE utf8mb4_unicode_520_ci,
  `italian` longtext COLLATE utf8mb4_unicode_520_ci,
  `thai` longtext COLLATE utf8mb4_unicode_520_ci,
  `urdu` longtext COLLATE utf8mb4_unicode_520_ci,
  `hindi` longtext COLLATE utf8mb4_unicode_520_ci,
  `latin` longtext COLLATE utf8mb4_unicode_520_ci,
  `indonesian` longtext COLLATE utf8mb4_unicode_520_ci,
  `japanese` longtext COLLATE utf8mb4_unicode_520_ci,
  `korean` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `language`
--


-- --------------------------------------------------------

--
-- Table structure for table `late_payment_settings`
--

CREATE TABLE `late_payment_settings` (
  `setting_id` int NOT NULL,
  `grace_period_days` int DEFAULT '7',
  `late_fee_type` enum('fixed','percentage') COLLATE utf8mb4_unicode_520_ci DEFAULT 'fixed',
  `late_fee_value` decimal(10,2) DEFAULT '0.00',
  `reminder_days` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT '7,14,21',
  `restrict_exams` tinyint(1) DEFAULT '0',
  `restrict_reports` tinyint(1) DEFAULT '0',
  `updated_by` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `late_payment_settings`
--


-- --------------------------------------------------------

--
-- Table structure for table `leave_types`
--

CREATE TABLE `leave_types` (
  `type_id` int NOT NULL,
  `name` varchar(64) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `leave_day` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_notes`
--

CREATE TABLE `lesson_notes` (
  `lesson_note_id` int NOT NULL,
  `teacher_id` int NOT NULL COMMENT 'References teacher.teacher_id',
  `class_id` int NOT NULL COMMENT 'References class.class_id',
  `subject_id` int NOT NULL COMMENT 'References subject.subject_id',
  `strand_id` int DEFAULT NULL COMMENT 'References curriculum_strands.strand_id',
  `sub_strand_id` int DEFAULT NULL COMMENT 'References curriculum_sub_strands.sub_strand_id',
  `content_standard_id` int DEFAULT NULL COMMENT 'References curriculum_content_standards.content_standard_id',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `week_number` tinyint NOT NULL COMMENT '1-12',
  `term` tinyint NOT NULL COMMENT '1-3',
  `lesson_date` date NOT NULL,
  `lesson_objectives` text COLLATE utf8mb4_unicode_ci,
  `lesson_activities` text COLLATE utf8mb4_unicode_ci,
  `lesson_content` longtext COLLATE utf8mb4_unicode_ci,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('draft','pending','hod_reviewed','revision_requested','approved','declined') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `feedback` text COLLATE utf8mb4_unicode_ci COMMENT 'Feedback from admin/HOD',
  `hod_id` int DEFAULT NULL COMMENT 'References teacher.teacher_id (HOD)',
  `hod_review_date` datetime DEFAULT NULL,
  `hod_feedback` text COLLATE utf8mb4_unicode_ci,
  `admin_id` int DEFAULT NULL COMMENT 'References admin.admin_id',
  `admin_review_date` datetime DEFAULT NULL,
  `source_lesson_note_id` int DEFAULT NULL COMMENT 'Reference to original if copied',
  `version` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_note_assessments`
--

CREATE TABLE `lesson_note_assessments` (
  `id` int NOT NULL,
  `lesson_note_id` int NOT NULL,
  `method_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `is_custom` tinyint DEFAULT '0' COMMENT '1 if custom entry, 0 if from predefined list'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_note_competencies`
--

CREATE TABLE `lesson_note_competencies` (
  `id` int NOT NULL,
  `lesson_note_id` int NOT NULL,
  `competency_id` int NOT NULL COMMENT 'References core_competencies.competency_id'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_note_indicators`
--

CREATE TABLE `lesson_note_indicators` (
  `id` int NOT NULL,
  `lesson_note_id` int NOT NULL,
  `indicator_id` int NOT NULL COMMENT 'References curriculum_learning_indicators.indicator_id'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_note_notifications`
--

CREATE TABLE `lesson_note_notifications` (
  `notification_id` int NOT NULL,
  `user_id` int NOT NULL COMMENT 'References teacher.teacher_id or admin.admin_id based on user_type',
  `user_type` enum('teacher','hod','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'lesson_note',
  `reference_id` int NOT NULL COMMENT 'lesson_note_id',
  `is_read` tinyint DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_note_references`
--

CREATE TABLE `lesson_note_references` (
  `id` int NOT NULL,
  `lesson_note_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `author` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `publisher` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` int DEFAULT NULL,
  `page_numbers` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_type` enum('primary','supplementary') COLLATE utf8mb4_unicode_ci DEFAULT 'supplementary'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_note_resources`
--

CREATE TABLE `lesson_note_resources` (
  `id` int NOT NULL,
  `lesson_note_id` int NOT NULL,
  `resource_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_details` text COLLATE utf8mb4_unicode_ci,
  `quantity` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_custom` tinyint DEFAULT '0' COMMENT '1 if custom entry, 0 if from predefined list'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lesson_note_revisions`
--

CREATE TABLE `lesson_note_revisions` (
  `revision_id` int NOT NULL,
  `lesson_note_id` int NOT NULL,
  `user_id` int NOT NULL COMMENT 'References teacher.teacher_id or admin.admin_id based on user_type',
  `user_type` enum('teacher','hod','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'create, update, submit, endorse, approve, decline, request_revision',
  `changed_fields` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'JSON object of changed fields',
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `previous_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci,
  `phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci,
  `email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci,
  `password` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci,
  `authentication_key` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci,
  `read_notice_ids` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `block_limit` int DEFAULT '0',
  `active_status` enum('1','0') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `online_status` enum('1','0') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0'
) ;

-- --------------------------------------------------------

--
-- Table structure for table `librarian`
--

CREATE TABLE `librarian` (
  `librarian_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `email` longtext COLLATE utf8mb4_unicode_520_ci,
  `password` longtext COLLATE utf8mb4_unicode_520_ci,
  `authentication_key` longtext COLLATE utf8mb4_unicode_520_ci,
  `read_notice_ids` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `block_limit` int DEFAULT '0',
  `active_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `online_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loan`
--

CREATE TABLE `loan` (
  `id` int NOT NULL,
  `emp_id` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `amount` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `interest_percentage` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `total_amount` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `total_pay` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `total_due` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `installment` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `loan_number` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `loan_details` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `approve_date` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `install_period` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` enum('Granted','Deny','Pause','Done') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Pause',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `loan_installment`
--

CREATE TABLE `loan_installment` (
  `id` int NOT NULL,
  `loan_id` int NOT NULL,
  `emp_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `loan_number` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `install_amount` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `pay_amount` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `app_date` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `receiver` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `install_no` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `notes` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `location_registry`
--

CREATE TABLE `location_registry` (
  `id` int NOT NULL,
  `location_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_endpoint` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','suspended') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `priority` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `last_sync_at` timestamp NULL DEFAULT NULL,
  `last_sync_status` enum('success','failed','partial','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `contact_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'UTC',
  `sync_enabled` tinyint(1) DEFAULT '1',
  `sync_interval` int DEFAULT '15' COMMENT 'Sync interval in minutes',
  `description` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `location_registry`
--


-- --------------------------------------------------------

--
-- Table structure for table `logistic_asset`
--

CREATE TABLE `logistic_asset` (
  `log_id` int NOT NULL,
  `name` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `qty` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `entry_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `logistic_assign`
--

CREATE TABLE `logistic_assign` (
  `ass_id` int NOT NULL,
  `asset_id` int NOT NULL,
  `assign_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `project_id` int NOT NULL,
  `task_id` int NOT NULL,
  `log_qty` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `start_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `end_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `back_date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `back_qty` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `remarks` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mark`
--

CREATE TABLE `mark` (
  `mark_id` int NOT NULL,
  `student_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `exam_id` int DEFAULT NULL,
  `test1` double DEFAULT NULL,
  `group_work` double DEFAULT NULL,
  `test2` double DEFAULT NULL,
  `project` double DEFAULT NULL,
  `sub_total` double DEFAULT NULL,
  `term_exam` double DEFAULT NULL,
  `class_score` double DEFAULT NULL,
  `exam_score` double DEFAULT NULL,
  `mark_obtained` double DEFAULT NULL,
  `status` enum('1','0') COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `mark_total` double DEFAULT NULL,
  `comment` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `mute` enum('0','1') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `mark`
--


-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE `message` (
  `message_id` int NOT NULL,
  `message_thread_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `message` longtext COLLATE utf8mb4_unicode_520_ci,
  `sender` longtext COLLATE utf8mb4_unicode_520_ci,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `read_status` int DEFAULT NULL,
  `attached_file_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_thread`
--

CREATE TABLE `message_thread` (
  `message_thread_id` int NOT NULL,
  `message_thread_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `sender` longtext COLLATE utf8mb4_unicode_520_ci,
  `reciever` longtext COLLATE utf8mb4_unicode_520_ci,
  `last_message_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mobile_money_payment`
--

CREATE TABLE `mobile_money_payment` (
  `mo_id` int NOT NULL,
  `expense_category_id` int DEFAULT NULL,
  `title` longtext COLLATE utf8mb4_unicode_520_ci,
  `payment_type` longtext COLLATE utf8mb4_unicode_520_ci,
  `invoice_id` int DEFAULT NULL,
  `invoice_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `student_id` int DEFAULT NULL,
  `method` longtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `mo_a_paid` double DEFAULT NULL,
  `t_id` longtext COLLATE utf8mb4_unicode_520_ci,
  `date_time` longtext COLLATE utf8mb4_unicode_520_ci,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `non_teaching_staff`
--

CREATE TABLE `non_teaching_staff` (
  `staff_id` int NOT NULL COMMENT 'Primary key for non-teaching staff',
  `staff_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Unique staff code for identification',
  `name` longtext COLLATE utf8mb4_general_ci COMMENT 'Full name (legacy field)',
  `first_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'First name',
  `other_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Middle name',
  `last_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Last name',
  `birthday` longtext COLLATE utf8mb4_general_ci COMMENT 'Date of birth',
  `sex` longtext COLLATE utf8mb4_general_ci COMMENT 'Gender',
  `religion` longtext COLLATE utf8mb4_general_ci COMMENT 'Religion',
  `blood_group` longtext COLLATE utf8mb4_general_ci COMMENT 'Blood group',
  `address` longtext COLLATE utf8mb4_general_ci COMMENT 'Physical address',
  `phone` longtext COLLATE utf8mb4_general_ci COMMENT 'Phone number',
  `email` longtext COLLATE utf8mb4_general_ci COMMENT 'Email address',
  `password` longtext COLLATE utf8mb4_general_ci COMMENT 'Hashed password for portal access',
  `ssnit_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'SSNIT number for pension',
  `ghana_card_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Ghana Card ID',
  `petra_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'PETRA ID',
  `tin` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Tax Identification Number',
  `account_number` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Bank account number',
  `tier2_provider_id` int DEFAULT NULL COMMENT 'FK to pension_tier2_providers',
  `tier2_member_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Employee ID with Tier 2 provider',
  `account_details` longtext COLLATE utf8mb4_general_ci COMMENT 'Bank account details (JSON)',
  `authentication_key` longtext COLLATE utf8mb4_general_ci COMMENT 'Authentication key for sessions',
  `designation` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Job title/designation',
  `department` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Department (e.g., Maintenance, Kitchen, Security)',
  `employment_date` date DEFAULT NULL COMMENT 'Date of employment',
  `employment_type` enum('permanent','contract','casual') COLLATE utf8mb4_general_ci DEFAULT 'permanent' COMMENT 'Type of employment',
  `social_links` mediumtext COLLATE utf8mb4_general_ci COMMENT 'Social media links (JSON)',
  `show_on_website` int DEFAULT '0' COMMENT 'Show on school website',
  `read_notice_ids` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Read notice IDs',
  `block_limit` int DEFAULT '0' COMMENT 'Block limit for portal access',
  `active_status` enum('1','0') COLLATE utf8mb4_general_ci DEFAULT '1' COMMENT 'Active status',
  `online_status` enum('1','0') COLLATE utf8mb4_general_ci DEFAULT '0' COMMENT 'Online status',
  `employment_category` enum('teacher','administrator','non_teaching_staff') COLLATE utf8mb4_general_ci DEFAULT 'non_teaching_staff' COMMENT 'Employment category - always non_teaching_staff for this table',
  `sync` enum('yes','no') COLLATE utf8mb4_general_ci DEFAULT 'yes' COMMENT 'Include in sync',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'SYNCED' COMMENT 'Sync status',
  `last_modified_at` timestamp NULL DEFAULT NULL COMMENT 'Last modification timestamp',
  `last_modified_by` int DEFAULT NULL COMMENT 'User ID who last modified',
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Device ID for sync tracking',
  `version` int DEFAULT '0' COMMENT 'Version number for conflict resolution',
  `retry_count` int DEFAULT '0' COMMENT 'Sync retry count',
  `sync_error` text COLLATE utf8mb4_general_ci COMMENT 'Last sync error message',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record update timestamp',
  `position` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Staff position/role (Driver, Cook, Cleaner, etc.)',
  `qualification` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Educational qualifications'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Non-teaching staff records for payroll and HR management';

-- --------------------------------------------------------

--
-- Table structure for table `notice`
--

CREATE TABLE `notice` (
  `id` int NOT NULL,
  `title` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `file_url` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `date` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `noticeboard`
--

CREATE TABLE `noticeboard` (
  `notice_id` int NOT NULL,
  `notice_title` longtext COLLATE utf8mb4_unicode_520_ci,
  `notice` longtext COLLATE utf8mb4_unicode_520_ci,
  `create_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `created_on` longtext COLLATE utf8mb4_unicode_520_ci,
  `status` int DEFAULT '1',
  `show_on_website` int DEFAULT '0',
  `image` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `notification_id` int NOT NULL,
  `user_id` int NOT NULL COMMENT 'Admin ID who will receive the notification',
  `user_type` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'admin, teacher, student, parent',
  `type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Type: admission, payment, etc',
  `title` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `data` text COLLATE utf8mb4_unicode_520_ci COMMENT 'JSON data with additional details',
  `icon` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `notifications`
--


-- --------------------------------------------------------

--
-- Table structure for table `notification_delivery_log`
--

CREATE TABLE `notification_delivery_log` (
  `log_id` bigint UNSIGNED NOT NULL,
  `notification_id` int NOT NULL COMMENT 'Related notification ID (references notifications.notification_id)',
  `channel` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Delivery channel (sms, email, in_app)',
  `recipient` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Recipient identifier (phone number, email, or user_id)',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Delivery status (sent, failed, pending)',
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Delivery attempt timestamp',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT 'Error details if delivery failed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for notification delivery attempts across all channels';

-- --------------------------------------------------------

--
-- Table structure for table `online_exam`
--

CREATE TABLE `online_exam` (
  `online_exam_id` int UNSIGNED NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '',
  `title` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` int DEFAULT NULL,
  `section_id` int DEFAULT NULL,
  `subject_id` int DEFAULT NULL,
  `exam_date` int DEFAULT NULL,
  `time_start` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `time_end` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `duration` mediumtext COLLATE utf8mb4_unicode_520_ci COMMENT 'duration in second',
  `minimum_percentage` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `instruction` longtext COLLATE utf8mb4_unicode_520_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `running_year` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '',
  `term` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '',
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `online_exam_result`
--

CREATE TABLE `online_exam_result` (
  `online_exam_result_id` int UNSIGNED NOT NULL,
  `online_exam_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `answer_script` longtext COLLATE utf8mb4_unicode_520_ci,
  `obtained_mark` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `status` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `exam_started_timestamp` longtext COLLATE utf8mb4_unicode_520_ci,
  `result` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `owner`
--

CREATE TABLE `owner` (
  `id` int NOT NULL,
  `owner_name` varchar(64) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `owner_position` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `note` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `parent`
--

CREATE TABLE `parent` (
  `parent_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `guardian_gender` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `guardian_is_the` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `email` longtext COLLATE utf8mb4_unicode_520_ci,
  `password` longtext COLLATE utf8mb4_unicode_520_ci,
  `phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `address` longtext COLLATE utf8mb4_unicode_520_ci,
  `profession` longtext COLLATE utf8mb4_unicode_520_ci,
  `designation` longtext COLLATE utf8mb4_unicode_520_ci,
  `authentication_key` longtext COLLATE utf8mb4_unicode_520_ci,
  `read_notice_ids` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `block_limit` int DEFAULT '0',
  `active_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `online_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `father_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `father_phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `father_occupation` longtext COLLATE utf8mb4_unicode_520_ci,
  `mother_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `mother_phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `mother_occupation` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `parent`
--


-- --------------------------------------------------------

--
-- Table structure for table `payment`
--

CREATE TABLE `payment` (
  `payment_id` int NOT NULL,
  `expense_category_id` int DEFAULT NULL,
  `title` longtext COLLATE utf8mb4_unicode_520_ci,
  `payment_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `invoice_id` int DEFAULT NULL,
  `account_id` int DEFAULT NULL,
  `journal_id` int DEFAULT NULL,
  `invoice_code` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `receipt_code` bigint DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `payment_method` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `is_printed` tinyint(1) DEFAULT '0' COMMENT 'Receipt printed status',
  `is_emailed` tinyint(1) DEFAULT '0' COMMENT 'Receipt emailed status',
  `printed_at` int DEFAULT NULL COMMENT 'Timestamp when printed',
  `emailed_at` int DEFAULT NULL COMMENT 'Timestamp when emailed',
  `synced_to_accounts` tinyint(1) DEFAULT '0',
  `journal_entry_id` int DEFAULT NULL,
  `synced_at` int DEFAULT NULL,
  `receipt_id` int DEFAULT NULL,
  `installment_id` int DEFAULT NULL,
  `transaction_id` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `bank_name` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `cheque_number` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `amount` double DEFAULT NULL,
  `issuer_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `account_type` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `due` double NOT NULL DEFAULT '0',
  `timestamp` int DEFAULT NULL,
  `day_timestamp` int DEFAULT NULL,
  `residence_type` enum('Day','Boarding') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Day',
  `year` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `term` int DEFAULT NULL,
  `sem` int DEFAULT NULL,
  `can_delete` enum('default','request','approved','declined','trash') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'default',
  `can_edit` enum('default','request','approved','declined') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'default',
  `delete_request_issuer_id` int DEFAULT NULL,
  `edit_request_issuer_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `locked_at` timestamp NULL DEFAULT NULL COMMENT 'When the record was locked',
  `locked_reason` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Why the record was locked',
  `approval_status` enum('none','pending','approved','rejected') COLLATE utf8mb4_unicode_520_ci DEFAULT 'none',
  `approval_requested_by` int DEFAULT NULL,
  `approval_requested_at` timestamp NULL DEFAULT NULL,
  `approval_handled_by` int DEFAULT NULL,
  `approval_handled_at` timestamp NULL DEFAULT NULL,
  `approval_notes` text COLLATE utf8mb4_unicode_520_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `payment`
--


-- --------------------------------------------------------

--
-- Table structure for table `payment_installments`
--

CREATE TABLE `payment_installments` (
  `installment_id` int NOT NULL,
  `plan_id` int NOT NULL,
  `installment_number` int NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `due_date` date NOT NULL,
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `paid_date` datetime DEFAULT NULL,
  `status` enum('pending','paid','overdue','partial') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `late_fee` decimal(10,2) DEFAULT '0.00',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_methods`
--

CREATE TABLE `payment_methods` (
  `id` int NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `icon` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '0',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_methods`
--


-- --------------------------------------------------------

--
-- Table structure for table `payment_plans`
--

CREATE TABLE `payment_plans` (
  `plan_id` int NOT NULL,
  `student_id` int NOT NULL,
  `invoice_code` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `installments` int NOT NULL,
  `paid_installments` int DEFAULT '0',
  `frequency` enum('weekly','monthly','quarterly') COLLATE utf8mb4_unicode_520_ci DEFAULT 'monthly',
  `start_date` date NOT NULL,
  `status` enum('active','completed','cancelled') COLLATE utf8mb4_unicode_520_ci DEFAULT 'active',
  `created_at` int NOT NULL,
  `created_by` int NOT NULL,
  `updated_at` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payment_transactions`
--

CREATE TABLE `payment_transactions` (
  `transaction_id` int NOT NULL,
  `transaction_ref` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `student_id` int NOT NULL,
  `invoice_code` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `gateway` enum('hubtel','mtn_momo','vodafone_cash','airteltigo_money','paystack','stripe','flutterwave') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `gateway_ref` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `network` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `status` enum('pending','success','failed','cancelled') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `response_data` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_approvals`
--

CREATE TABLE `payroll_approvals` (
  `approval_id` int NOT NULL COMMENT 'Primary key for approval records',
  `pay_id` int NOT NULL COMMENT 'Foreign key to pay_salary table',
  `approver_user_id` int NOT NULL COMMENT 'User ID of the approver',
  `approver_role` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Role of the approver at time of action',
  `action` enum('approved','rejected','submitted') COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Approval action taken',
  `comments` text COLLATE utf8mb4_general_ci COMMENT 'Optional comments or rejection reason',
  `action_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when action was taken'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks approval workflow history for payroll records';

-- --------------------------------------------------------

--
-- Table structure for table `payroll_audit_enhanced`
--

CREATE TABLE `payroll_audit_enhanced` (
  `audit_id` bigint NOT NULL,
  `pay_id` int NOT NULL,
  `user_id` int NOT NULL,
  `action` enum('create','update','delete','approve','reject','submit','reopen') COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_changed` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Field name that was changed (null for whole record actions)',
  `old_value` text COLLATE utf8mb4_unicode_ci COMMENT 'Previous value before change',
  `new_value` text COLLATE utf8mb4_unicode_ci COMMENT 'New value after change',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP address of user making the change',
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Browser user agent string',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Enhanced audit log for all payroll changes with field-level tracking';

--
-- Dumping data for table `payroll_audit_enhanced`
--


--
-- Triggers `payroll_audit_enhanced`
--
DELIMITER $$
CREATE TRIGGER `prevent_audit_log_delete` BEFORE DELETE ON `payroll_audit_enhanced` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit log records cannot be deleted. This is a security violation.';
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `prevent_audit_log_update` BEFORE UPDATE ON `payroll_audit_enhanced` FOR EACH ROW BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Audit log records cannot be modified. This is a security violation.';
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_form_field_preferences`
--

CREATE TABLE `payroll_form_field_preferences` (
  `id` int NOT NULL,
  `field_name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `is_visible` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_statutory_settings`
--

CREATE TABLE `payroll_statutory_settings` (
  `setting_id` int NOT NULL,
  `setting_key` varchar(50) NOT NULL COMMENT 'Unique identifier for setting',
  `setting_name` varchar(100) NOT NULL COMMENT 'Display name',
  `setting_value` decimal(5,2) NOT NULL COMMENT 'Percentage value (e.g., 13.50 for 13.5%)',
  `setting_type` enum('percentage','fixed') DEFAULT 'percentage',
  `description` text COMMENT 'What this setting controls',
  `is_active` tinyint(1) DEFAULT '1',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` int DEFAULT NULL COMMENT 'Admin user ID who last updated'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='Configurable statutory deduction percentages';

--
-- Dumping data for table `payroll_statutory_settings`
--


-- --------------------------------------------------------

--
-- Table structure for table `payroll_statutory_settings_log`
--

CREATE TABLE `payroll_statutory_settings_log` (
  `log_id` int NOT NULL,
  `setting_id` int NOT NULL,
  `setting_key` varchar(50) NOT NULL,
  `old_value` decimal(5,2) NOT NULL,
  `new_value` decimal(5,2) NOT NULL,
  `changed_by` int NOT NULL COMMENT 'Admin user ID',
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reason` text COMMENT 'Reason for change'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COMMENT='Audit trail for statutory settings changes';

--
-- Dumping data for table `payroll_statutory_settings_log`
--


-- --------------------------------------------------------

--
-- Table structure for table `pay_salary`
--

CREATE TABLE `pay_salary` (
  `pay_id` int NOT NULL,
  `employee_code` varchar(25) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `month` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Payroll month name',
  `year` int NOT NULL COMMENT 'Payroll year',
  `paid_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_days` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `basic_salary` double NOT NULL COMMENT 'Basic monthly salary (base for SSNIT calculations)',
  `market_premium_allowance` double NOT NULL DEFAULT '0',
  `teaching_allowance` double NOT NULL DEFAULT '0',
  `responsibility_allowance` double NOT NULL DEFAULT '0',
  `rural_allowance` double NOT NULL DEFAULT '0',
  `extra_class_allowance` double NOT NULL DEFAULT '0',
  `other_allowances` double NOT NULL DEFAULT '0',
  `total_allowances` double DEFAULT '0',
  `gross_salary` double DEFAULT '0' COMMENT 'Gross Salary = Basic Salary + All Allowances',
  `ssnit` double DEFAULT '0' COMMENT 'SSNIT Tier 1 (13.5% of basic salary) - Employer contribution, NOT deducted from employee',
  `tier2_contribution` double DEFAULT '0' COMMENT 'SSNIT Tier 2 (5% of basic salary) - Employee contribution, deducted from gross salary',
  `tier2_provider_id` int DEFAULT NULL COMMENT 'FK to pension_tier2_providers',
  `loan` double DEFAULT '0',
  `income_tax` double NOT NULL DEFAULT '0',
  `get_fund` double NOT NULL DEFAULT '0',
  `gnat_dues` double NOT NULL DEFAULT '0',
  `salary_advance` double NOT NULL DEFAULT '0',
  `nhil` double NOT NULL DEFAULT '0',
  `welfare_dues` double NOT NULL DEFAULT '0',
  `other_deductions` double DEFAULT '0' COMMENT 'Other deductions amount',
  `total_deductions` double NOT NULL DEFAULT '0',
  `total_deductions_without_ssnit` double NOT NULL DEFAULT '0',
  `net_salary` double DEFAULT '0' COMMENT 'Net Salary = Gross - (Tier 2 + Other Deductions). Tier 1 is NOT subtracted',
  `rate_ssnit_tier1_employer` decimal(5,2) DEFAULT NULL COMMENT 'SSNIT Tier 1 employer rate at time of creation (%)',
  `rate_ssnit_tier1_employee` decimal(5,2) DEFAULT NULL COMMENT 'SSNIT Tier 1 employee rate at time of creation (%)',
  `rate_ssnit_tier2` decimal(5,2) DEFAULT NULL COMMENT 'SSNIT Tier 2 rate at time of creation (%)',
  `rate_getfund` decimal(5,2) DEFAULT NULL COMMENT 'GETFund rate at time of creation (%)',
  `rate_nhil` decimal(5,2) DEFAULT NULL COMMENT 'NHIL rate at time of creation (%)',
  `working_days` int NOT NULL DEFAULT '0',
  `days_present` int NOT NULL DEFAULT '0',
  `days_absent` int NOT NULL DEFAULT '0',
  `status` enum('Paid','Process') COLLATE utf8mb4_unicode_520_ci DEFAULT 'Paid',
  `approval_status` enum('draft','pending_approval','approved','rejected','paid') COLLATE utf8mb4_unicode_520_ci DEFAULT 'paid' COMMENT 'Approval workflow status for payroll records',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Record last update timestamp',
  `sync_status` enum('synced','pending','conflict') COLLATE utf8mb4_unicode_520_ci DEFAULT 'synced' COMMENT 'Offline sync status',
  `last_modified_at` timestamp NULL DEFAULT NULL COMMENT 'Last modification timestamp for sync',
  `device_id` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Device identifier for sync tracking',
  `last_modified_by` int DEFAULT NULL COMMENT 'User ID who last modified the record',
  `paid_type` enum('Hand Cash','Bank') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Bank',
  `employment_category` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `paid_by` int NOT NULL,
  `reference` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `pay_salary`
--


-- --------------------------------------------------------

--
-- Table structure for table `penalty`
--

CREATE TABLE `penalty` (
  `id` int NOT NULL,
  `penalty_name` varchar(64) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `pending_approvals_view`
-- (See below for the actual view)
--
CREATE TABLE `pending_approvals_view` (
`id` int
,`request_type` enum('invoice_edit','invoice_delete','payment_edit','payment_delete')
,`record_type` enum('invoice','payment')
,`record_id` int
,`requested_at` timestamp
,`reason` text
,`status` enum('pending','approved','rejected')
,`requested_by_name` longtext
,`record_code` bigint
,`student_name` longtext
);

-- --------------------------------------------------------

--
-- Table structure for table `pension_tier2_providers`
--

CREATE TABLE `pension_tier2_providers` (
  `provider_id` int NOT NULL,
  `provider_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name of Tier 2 pension provider',
  `provider_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Short code for provider',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Provider description',
  `provider_address` text COLLATE utf8mb4_unicode_ci,
  `provider_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tier 2 pension provider companies';

--
-- Dumping data for table `pension_tier2_providers`
--


-- --------------------------------------------------------

--
-- Table structure for table `permission_modules`
--

CREATE TABLE `permission_modules` (
  `module_id` int UNSIGNED NOT NULL,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Unique module identifier',
  `module_display_name` varchar(150) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Human-readable module name',
  `module_description` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Description of the module',
  `available_permissions` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'view,add,edit,delete' COMMENT 'Comma-separated list of available permission types',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Whether the module is active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Registry of available modules and their permissions';

--
-- Dumping data for table `permission_modules`
--


-- --------------------------------------------------------

--
-- Table structure for table `portfolio_aggregates`
--

CREATE TABLE `portfolio_aggregates` (
  `aggregate_id` bigint NOT NULL,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `class_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` enum('1','2','3') COLLATE utf8mb4_general_ci NOT NULL,
  `semester` enum('1','2') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `weekly_average` decimal(5,2) DEFAULT NULL COMMENT 'Average for specific week',
  `term_average` decimal(5,2) DEFAULT NULL COMMENT 'Overall term portfolio average',
  `total_assessments` int DEFAULT '0',
  `computed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portfolio_assessment`
--

CREATE TABLE `portfolio_assessment` (
  `assessment_id` int NOT NULL,
  `exam_id` int NOT NULL,
  `student_id` int NOT NULL,
  `class_id` int NOT NULL,
  `section_id` int DEFAULT NULL,
  `code` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `subject_id` int NOT NULL,
  `strand_score` double DEFAULT NULL,
  `week` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `timestamp` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `year` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `term` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sem` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portfolio_audit_trail`
--

CREATE TABLE `portfolio_audit_trail` (
  `audit_id` bigint NOT NULL,
  `action_type` enum('create','update','delete','compute','sync_sba') COLLATE utf8mb4_general_ci NOT NULL,
  `entity_type` enum('header','score','aggregate','sba') COLLATE utf8mb4_general_ci NOT NULL,
  `entity_id` bigint NOT NULL,
  `old_value` text COLLATE utf8mb4_general_ci,
  `new_value` text COLLATE utf8mb4_general_ci,
  `user_id` int NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `portfolio_headers`
--

CREATE TABLE `portfolio_headers` (
  `header_id` int NOT NULL,
  `class_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` enum('1','2','3') COLLATE utf8mb4_general_ci NOT NULL,
  `semester` enum('1','2') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `week_number` tinyint NOT NULL,
  `strand_topic` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `strand_id` int DEFAULT NULL,
  `sub_strand_id` int DEFAULT NULL,
  `indicator_id` int DEFAULT NULL,
  `assessment_date` date NOT NULL,
  `max_score` decimal(5,2) DEFAULT '10.00',
  `status` enum('draft','published','locked') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `portfolio_headers_with_curriculum`
-- (See below for the actual view)
--
CREATE TABLE `portfolio_headers_with_curriculum` (
`header_id` int
,`class_id` int
,`subject_id` int
,`teacher_id` int
,`year` varchar(10)
,`term` enum('1','2','3')
,`semester` enum('1','2')
,`week_number` tinyint
,`strand_topic` varchar(200)
,`strand_id` int
,`sub_strand_id` int
,`indicator_id` int
,`assessment_date` date
,`max_score` decimal(5,2)
,`status` enum('draft','published','locked')
,`created_by` int
,`created_at` timestamp
,`updated_at` timestamp
,`deleted_at` timestamp
,`strand_name` varchar(255)
,`sub_strand_name` varchar(255)
,`indicator_text` text
,`full_curriculum_path` text
);

-- --------------------------------------------------------

--
-- Table structure for table `portfolio_scores`
--

CREATE TABLE `portfolio_scores` (
  `score_id` bigint NOT NULL,
  `header_id` int NOT NULL,
  `student_id` int NOT NULL,
  `score` decimal(5,2) NOT NULL,
  `remarks` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `recorded_by` int NOT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `id` int NOT NULL,
  `pro_name` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `pro_start_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `pro_end_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `pro_description` varchar(1024) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `pro_summary` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `pro_status` enum('upcoming','complete','running') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'running',
  `progress` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `project_file`
--

CREATE TABLE `project_file` (
  `id` int NOT NULL,
  `pro_id` int NOT NULL,
  `file_details` varchar(1028) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `file_url` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `assigned_to` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pro_expenses`
--

CREATE TABLE `pro_expenses` (
  `id` int NOT NULL,
  `pro_id` int NOT NULL,
  `assign_to` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `details` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `amount` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pro_notes`
--

CREATE TABLE `pro_notes` (
  `id` int NOT NULL,
  `assign_to` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `pro_id` int NOT NULL,
  `details` varchar(1024) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pro_task`
--

CREATE TABLE `pro_task` (
  `id` int NOT NULL,
  `pro_id` int NOT NULL,
  `task_title` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `start_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `end_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `image` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `description` varchar(2048) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `task_type` enum('Office','Field') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Office',
  `status` enum('running','complete','cancel') COLLATE utf8mb4_unicode_520_ci DEFAULT 'running',
  `location` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `return_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `total_days` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `create_date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `approve_status` enum('Approved','Not Approve','Rejected') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Not Approve',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pro_task_assets`
--

CREATE TABLE `pro_task_assets` (
  `id` int NOT NULL,
  `pro_task_id` int NOT NULL,
  `assign_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_bank`
--

CREATE TABLE `question_bank` (
  `question_bank_id` int UNSIGNED NOT NULL,
  `online_exam_id` int DEFAULT NULL,
  `question_title` longtext COLLATE utf8mb4_unicode_520_ci,
  `type` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `number_of_options` int DEFAULT NULL,
  `options` longtext COLLATE utf8mb4_unicode_520_ci,
  `correct_answers` longtext COLLATE utf8mb4_unicode_520_ci,
  `mark` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `question_paper`
--

CREATE TABLE `question_paper` (
  `question_paper_id` int NOT NULL,
  `title` longtext COLLATE utf8mb4_unicode_520_ci,
  `question_paper` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` int DEFAULT NULL,
  `exam_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `raw_score_grade`
--

CREATE TABLE `raw_score_grade` (
  `grade_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `grade_point` longtext COLLATE utf8mb4_unicode_520_ci,
  `grade_point_numeric` double NOT NULL DEFAULT '0',
  `mark_from` double DEFAULT NULL,
  `mark_upto` double DEFAULT NULL,
  `comment` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipts`
--

CREATE TABLE `receipts` (
  `receipt_id` int NOT NULL,
  `receipt_number` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `student_id` int NOT NULL,
  `invoice_code` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('cash','bank_transfer','mobile_money','card','cheque') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `payment_reference` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `received_by` int NOT NULL,
  `received_date` datetime NOT NULL,
  `notes` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `is_printed` tinyint(1) DEFAULT '0',
  `is_emailed` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipt_modification_audit`
--

CREATE TABLE `receipt_modification_audit` (
  `audit_id` int NOT NULL,
  `receipt_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `request_id` int NOT NULL,
  `payment_id` int NOT NULL,
  `action` enum('edit','delete') COLLATE utf8mb4_general_ci NOT NULL,
  `performed_by` int NOT NULL,
  `performed_at` int NOT NULL,
  `before_data` text COLLATE utf8mb4_general_ci,
  `after_data` text COLLATE utf8mb4_general_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `receipt_modification_requests`
--

CREATE TABLE `receipt_modification_requests` (
  `request_id` int NOT NULL,
  `receipt_code` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `payment_id` int NOT NULL COMMENT 'FK to payment table',
  `request_type` enum('edit','delete') COLLATE utf8mb4_general_ci NOT NULL,
  `requested_by` int NOT NULL COMMENT 'User who requested',
  `requested_at` int NOT NULL,
  `reason` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('pending','approved','rejected','revoked') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `approved_by` int DEFAULT NULL,
  `approved_at` int DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_general_ci,
  `revoked_by` int DEFAULT NULL,
  `revoked_at` int DEFAULT NULL,
  `original_data` text COLLATE utf8mb4_general_ci COMMENT 'JSON of original payment data',
  `new_data` text COLLATE utf8mb4_general_ci COMMENT 'JSON of new payment data (for edits)',
  `notification_sent` tinyint(1) DEFAULT '0',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `receipt_modification_requests`
--


-- --------------------------------------------------------

--
-- Table structure for table `reconciliation_items`
--

CREATE TABLE `reconciliation_items` (
  `id` int NOT NULL,
  `reconciliation_id` int NOT NULL COMMENT 'Reference to reconciliation',
  `transaction_id` int NOT NULL COMMENT 'Transaction ID',
  `transaction_type` enum('book','bank') COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Source of transaction',
  `transaction_date` date NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `debit` decimal(10,2) DEFAULT '0.00',
  `credit` decimal(10,2) DEFAULT '0.00',
  `amount` decimal(10,2) NOT NULL COMMENT 'Transaction amount',
  `matched` tinyint(1) DEFAULT '0' COMMENT 'Whether matched with counterpart',
  `matched_with_id` int DEFAULT NULL COMMENT 'ID of matched item'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Reconciliation line items';

-- --------------------------------------------------------

--
-- Table structure for table `religion`
--

CREATE TABLE `religion` (
  `id` int NOT NULL,
  `religion` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT '',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `religion`
--


-- --------------------------------------------------------

--
-- Table structure for table `request`
--

CREATE TABLE `request` (
  `request_id` int NOT NULL,
  `request_description` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `request_issuer_id` int NOT NULL,
  `request_table` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `request_ids` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'this should be string of ids since we can have more than one id',
  `request_created_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `request_modified_timestamp` datetime DEFAULT NULL,
  `response_timestamp` datetime DEFAULT NULL,
  `approved_by_id` int DEFAULT NULL,
  `approval_status` enum('Pending','Approved','Declined') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Pending',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `result_approval_audit`
--

CREATE TABLE `result_approval_audit` (
  `id` int NOT NULL,
  `approval_status_id` int NOT NULL,
  `action` enum('submit','approve','lock','unlock','reject') COLLATE utf8mb4_general_ci NOT NULL,
  `previous_status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `performed_by` int NOT NULL,
  `reason` text COLLATE utf8mb4_general_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `performed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `result_approval_status`
--

CREATE TABLE `result_approval_status` (
  `id` int NOT NULL,
  `class_id` int NOT NULL,
  `academic_year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('draft','submitted','approved','locked') COLLATE utf8mb4_general_ci DEFAULT 'draft',
  `submitted_by` int DEFAULT NULL,
  `submitted_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `locked_by` int DEFAULT NULL,
  `locked_at` datetime DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salary_type`
--

CREATE TABLE `salary_type` (
  `id` int NOT NULL,
  `salary_type` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `create_date` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sba_components`
--

CREATE TABLE `sba_components` (
  `component_id` int NOT NULL,
  `student_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `class_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` enum('1','2','3') COLLATE utf8mb4_general_ci NOT NULL,
  `semester` enum('1','2') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `class_test` decimal(5,2) DEFAULT NULL COMMENT 'Auto-filled from portfolio',
  `applied_class_test_weight` decimal(5,2) DEFAULT NULL,
  `project_work` decimal(5,2) DEFAULT NULL,
  `applied_project_weight` decimal(5,2) DEFAULT NULL,
  `homework` decimal(5,2) DEFAULT NULL,
  `group_work` decimal(5,2) DEFAULT NULL,
  `applied_exam_weight` decimal(5,2) DEFAULT NULL,
  `total_sba` decimal(5,2) GENERATED ALWAYS AS ((((coalesce(`class_test`,0) + coalesce(`project_work`,0)) + coalesce(`homework`,0)) + coalesce(`group_work`,0))) STORED,
  `auto_filled` tinyint(1) DEFAULT '0' COMMENT 'True if class_test auto-filled from portfolio',
  `last_sync_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `weight_config_id` int DEFAULT NULL COMMENT 'Reference to sba_weight_config used'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sba_score_sources`
--

CREATE TABLE `sba_score_sources` (
  `id` bigint NOT NULL,
  `sba_component_id` int NOT NULL,
  `component_type` enum('class_test','project_work','homework','group_work') COLLATE utf8mb4_general_ci NOT NULL,
  `source_type` enum('portfolio','manual_entry','import','migration') COLLATE utf8mb4_general_ci NOT NULL,
  `source_reference_id` bigint DEFAULT NULL COMMENT 'portfolio_aggregates.id or import batch id',
  `original_value` decimal(5,2) DEFAULT NULL,
  `computed_value` decimal(5,2) NOT NULL,
  `computation_formula` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `computed_by` int NOT NULL,
  `computed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sba_weight_config`
--

CREATE TABLE `sba_weight_config` (
  `id` int NOT NULL,
  `academic_year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` enum('1','2','3') COLLATE utf8mb4_general_ci NOT NULL,
  `class_category` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'JHS, Upper Primary, SHS, etc',
  `class_test_weight` decimal(5,2) NOT NULL DEFAULT '30.00',
  `project_weight` decimal(5,2) NOT NULL DEFAULT '10.00',
  `exam_weight` decimal(5,2) NOT NULL DEFAULT '60.00',
  `portfolio_as_class_test` tinyint(1) DEFAULT '1' COMMENT 'Use portfolio for class test',
  `created_by` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sba_weight_config`
--


-- --------------------------------------------------------

--
-- Table structure for table `section`
--

CREATE TABLE `section` (
  `section_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `nick_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `section`
--


-- --------------------------------------------------------

--
-- Table structure for table `sems`
--

CREATE TABLE `sems` (
  `sem_id` int NOT NULL,
  `sem_ending` longtext COLLATE utf8mb4_unicode_520_ci,
  `next_sem_begins` longtext COLLATE utf8mb4_unicode_520_ci,
  `full_payment_date` longtext COLLATE utf8mb4_unicode_520_ci,
  `days_opened` int DEFAULT NULL COMMENT 'Total number of days school was open during this semester',
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `settings_id` int NOT NULL,
  `type` longtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `settings`
--


-- --------------------------------------------------------

--
-- Table structure for table `settings_audit`
--

CREATE TABLE `settings_audit` (
  `id` int NOT NULL,
  `setting_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `old_value` text COLLATE utf8mb4_unicode_ci,
  `new_value` text COLLATE utf8mb4_unicode_ci,
  `changed_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING',
  `sync_operation_type` enum('insert','update','both') COLLATE utf8mb4_unicode_ci DEFAULT 'insert',
  `last_modified_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_automations`
--

CREATE TABLE `sms_automations` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Automation name',
  `trigger_event` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Event that triggers SMS',
  `recipients` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Target recipients (parents, students, teachers, all)',
  `message_template` text COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'SMS template with placeholders',
  `is_active` tinyint(1) DEFAULT '1' COMMENT '1=Active, 0=Inactive',
  `created_by` int DEFAULT NULL COMMENT 'Admin who created',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `trigger_days` int DEFAULT '0' COMMENT 'Days before/after event (negative for after)',
  `last_run` datetime DEFAULT NULL,
  `next_run` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='SMS automation rules';

--
-- Dumping data for table `sms_automations`
--


-- --------------------------------------------------------

--
-- Table structure for table `sms_automation_logs`
--

CREATE TABLE `sms_automation_logs` (
  `id` int NOT NULL,
  `automation_id` int NOT NULL COMMENT 'Reference to automation',
  `recipient_phone` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Phone number',
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Recipient name',
  `message` text COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Actual message sent',
  `status` enum('sent','failed','pending') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'pending',
  `error_message` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Error details if failed',
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='SMS automation execution logs';

-- --------------------------------------------------------

--
-- Table structure for table `sms_log`
--

CREATE TABLE `sms_log` (
  `sms_id` int NOT NULL,
  `student_id` int NOT NULL,
  `parent_id` int DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `message` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `type` enum('payment_reminder','receipt','statement','general') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `sent_at` int NOT NULL,
  `status` enum('pending','sent','failed') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `response` mediumtext COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_logs`
--

CREATE TABLE `sms_logs` (
  `id` int NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `status` enum('sent','failed') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'sent',
  `sent_at` datetime NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_schedules`
--

CREATE TABLE `sms_schedules` (
  `schedule_id` int NOT NULL,
  `template_code` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `schedule_type` enum('daily','weekly','monthly','once') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `schedule_time` time NOT NULL,
  `schedule_day` int DEFAULT NULL COMMENT 'Day of week (1-7) or day of month (1-31)',
  `target_criteria` text COLLATE utf8mb4_unicode_520_ci COMMENT 'JSON criteria for selecting recipients',
  `is_active` tinyint(1) DEFAULT '1',
  `last_run` timestamp NULL DEFAULT NULL,
  `next_run` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sms_templates`
--

CREATE TABLE `sms_templates` (
  `template_id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `variables` text COLLATE utf8mb4_unicode_520_ci COMMENT 'JSON array of available variables',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `sms_templates`
--


-- --------------------------------------------------------

--
-- Table structure for table `social_media`
--

CREATE TABLE `social_media` (
  `id` int NOT NULL,
  `emp_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `facebook` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `twitter` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `google_plus` varchar(512) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `skype_id` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `student`
--

CREATE TABLE `student` (
  `student_id` int NOT NULL,
  `student_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `name` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `birthday` longtext COLLATE utf8mb4_unicode_520_ci,
  `sex` longtext COLLATE utf8mb4_unicode_520_ci,
  `religion` longtext COLLATE utf8mb4_unicode_520_ci,
  `blood_group` longtext COLLATE utf8mb4_unicode_520_ci,
  `nationality` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'Ghanaian',
  `ghana_card_id` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `address` longtext COLLATE utf8mb4_unicode_520_ci,
  `admission_date` date DEFAULT NULL,
  `allergies` text COLLATE utf8mb4_unicode_520_ci,
  `medical_conditions` text COLLATE utf8mb4_unicode_520_ci,
  `emergency_contact` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `parent_email` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `student_phone` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `username` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `email` longtext COLLATE utf8mb4_unicode_520_ci,
  `password` longtext COLLATE utf8mb4_unicode_520_ci,
  `parent_id` int DEFAULT NULL,
  `dormitory_room_number` longtext COLLATE utf8mb4_unicode_520_ci,
  `authentication_key` longtext COLLATE utf8mb4_unicode_520_ci,
  `read_notice_ids` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `block_limit` int DEFAULT '0',
  `active_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `mute` enum('0','1') COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `online_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `special_diet` enum('0','1') COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `tribe` longtext COLLATE utf8mb4_unicode_520_ci,
  `former_school` longtext COLLATE utf8mb4_unicode_520_ci,
  `student_health` longtext COLLATE utf8mb4_unicode_520_ci,
  `student_special_diet_details` longtext COLLATE utf8mb4_unicode_520_ci,
  `class_reached` longtext COLLATE utf8mb4_unicode_520_ci,
  `can_delete` enum('default','request','approved','declined','trash') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'default',
  `can_edit` enum('default','request','approved','declined') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'default',
  `delete_request_issuer_id` int DEFAULT NULL,
  `edit_request_issuer_id` int DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `place_of_birth` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `hometown` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `nhis_number` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `nhis_status` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `disability_status` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `learning_support` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `digital_literacy` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `home_technology_access` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `special_needs` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync_status` enum('SYNCED','PENDING','CONFLICT') COLLATE utf8mb4_unicode_520_ci DEFAULT 'SYNCED',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(100) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `student`
--


-- --------------------------------------------------------

--
-- Stand-in structure for view `student_account_summary`
-- (See below for the actual view)
--
CREATE TABLE `student_account_summary` (
`student_id` int
,`student_name` longtext
,`parent_id` int
,`class_name` varchar(11)
,`total_billed` double
,`total_paid` double
,`total_outstanding` double
,`fully_paid_amount` double
,`unpaid_amount` double
,`total_invoices` bigint
,`year` varchar(20)
,`term` int
);

-- --------------------------------------------------------

--
-- Table structure for table `student_credits`
--

CREATE TABLE `student_credits` (
  `credit_id` int NOT NULL,
  `student_id` int NOT NULL,
  `credit_amount` decimal(10,2) NOT NULL,
  `source_payment_id` int DEFAULT NULL,
  `source_receipt_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `source_invoice_code` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `applied_amount` decimal(10,2) DEFAULT '0.00',
  `remaining_amount` decimal(10,2) GENERATED ALWAYS AS ((`credit_amount` - `applied_amount`)) STORED,
  `status` enum('active','fully_applied','expired','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_general_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_credits`
--


-- --------------------------------------------------------

--
-- Stand-in structure for view `student_credit_summary`
-- (See below for the actual view)
--
CREATE TABLE `student_credit_summary` (
`student_id` int
,`student_name` longtext
,`total_available_credit` decimal(32,2)
,`total_credits_earned` decimal(32,2)
,`total_credits_used` decimal(32,2)
,`total_credit_records` bigint
,`last_credit_date` timestamp
);

-- --------------------------------------------------------

--
-- Table structure for table `student_daily_fee_preferences`
--

CREATE TABLE `student_daily_fee_preferences` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `breakfast_subscribed` tinyint(1) DEFAULT '0' COMMENT '1=parent subscribed to breakfast, 0=not subscribed',
  `water_subscribed` tinyint(1) DEFAULT '1' COMMENT '1=subscribed to water, 0=not subscribed',
  `auto_deduct_enabled` tinyint(1) DEFAULT '1' COMMENT '1=auto-deduct from balance, 0=manual payment',
  `notes` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `updated_at` int DEFAULT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `student_daily_fee_preferences`
--


-- --------------------------------------------------------

--
-- Table structure for table `student_discount_assignments`
--

CREATE TABLE `student_discount_assignments` (
  `assignment_id` int NOT NULL,
  `student_id` int NOT NULL,
  `profile_id` int NOT NULL,
  `discount_category` enum('invoice','daily_fees') COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `discount_method` enum('percentage','fixed') COLLATE utf8mb4_unicode_520_ci DEFAULT 'percentage',
  `discount_value` decimal(10,2) DEFAULT '0.00',
  `discount_type` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'For daily_fees: feeding,classes,water,etc',
  `bill_item_ids` text COLLATE utf8mb4_unicode_520_ci COMMENT 'For invoice: comma-separated IDs or *',
  `year` varchar(30) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `term` int DEFAULT NULL,
  `sem` int DEFAULT NULL,
  `assigned_by` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected','pending_removal') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'pending',
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_520_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `deactivated_at` int DEFAULT NULL,
  `deactivated_by` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_520_ci,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `student_discount_assignments`
--


-- --------------------------------------------------------

--
-- Table structure for table `student_ledger`
--

CREATE TABLE `student_ledger` (
  `ledger_id` int NOT NULL,
  `student_id` int NOT NULL,
  `transaction_date` date NOT NULL,
  `transaction_type` enum('invoice','payment','discount','credit_note','adjustment','refund') COLLATE utf8mb4_general_ci NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `reference_id` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `debit_amount` decimal(10,2) DEFAULT '0.00',
  `credit_amount` decimal(10,2) DEFAULT '0.00',
  `balance` decimal(10,2) NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` int NOT NULL,
  `created_by` int NOT NULL,
  `created_at` int NOT NULL,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `student_ledger`
--


-- --------------------------------------------------------

--
-- Table structure for table `subject`
--

CREATE TABLE `subject` (
  `subject_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `subject_type` enum('core','elective') COLLATE utf8mb4_unicode_520_ci DEFAULT 'elective',
  `status` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sem` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `subject`
--


-- --------------------------------------------------------

--
-- Table structure for table `subject_category_creche`
--

CREATE TABLE `subject_category_creche` (
  `category_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `subject_category_creche`
--


-- --------------------------------------------------------

--
-- Table structure for table `subject_creche`
--

CREATE TABLE `subject_creche` (
  `subject_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `category_id` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `class_id` int DEFAULT '0',
  `teacher_id` int DEFAULT NULL,
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_audit_log`
--

CREATE TABLE `sync_audit_log` (
  `id` bigint NOT NULL,
  `table_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int NOT NULL,
  `operation` enum('INSERT','UPDATE','DELETE','CONFLICT','REVERT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `source_device_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_device_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `sync_direction` enum('push','pull') COLLATE utf8mb4_unicode_ci NOT NULL,
  `synced_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `synced_by` int DEFAULT NULL,
  `duration_ms` int DEFAULT NULL,
  `status` enum('success','failed','conflict') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `config_key` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Configuration key identifier',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `sync_audit_log`
--


-- --------------------------------------------------------

--
-- Table structure for table `sync_config`
--

CREATE TABLE `sync_config` (
  `id` int NOT NULL,
  `config_key` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `config_value` text COLLATE utf8mb4_general_ci,
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sync_config`
--


-- --------------------------------------------------------

--
-- Table structure for table `sync_conflicts`
--

CREATE TABLE `sync_conflicts` (
  `id` int NOT NULL,
  `table_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int NOT NULL,
  `local_device_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remote_device_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `local_version` int NOT NULL,
  `remote_version` int NOT NULL,
  `local_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `remote_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `local_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `remote_modified_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `conflict_strategy` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','resolved','ignored') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `resolution` enum('local_wins','remote_wins','merged','ignored') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `resolved_by` int DEFAULT NULL,
  `merged_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime NOT NULL COMMENT 'Timestamp when record was deleted',
  `deleted_by` int UNSIGNED DEFAULT NULL COMMENT 'User ID who performed deletion (NULL for system)',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT 'Error message if sync failed'
) ;

-- --------------------------------------------------------

--
-- Table structure for table `sync_deletions`
--

CREATE TABLE `sync_deletions` (
  `id` int UNSIGNED NOT NULL COMMENT 'Primary key',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name of the table where deletion occurred',
  `record_id` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'JSON-encoded primary key(s) of deleted record',
  `deleted_at` datetime NOT NULL COMMENT 'Timestamp when record was deleted',
  `deleted_by` int UNSIGNED DEFAULT NULL COMMENT 'User ID who performed deletion (NULL for system)',
  `device_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Device that performed the deletion',
  `sync_status` enum('PENDING','SYNCED','FAILED','FAILED_PERMANENT') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING' COMMENT 'Sync status of this deletion',
  `last_modified_at` datetime NOT NULL COMMENT 'Last modification timestamp',
  `version` int NOT NULL DEFAULT '1' COMMENT 'Version for optimistic locking',
  `retry_count` int NOT NULL DEFAULT '0' COMMENT 'Number of sync retry attempts',
  `error_message` text COLLATE utf8mb4_unicode_ci COMMENT 'Error message if sync failed'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracks DELETE operations for synchronization';

-- --------------------------------------------------------

--
-- Table structure for table `sync_devices`
--

CREATE TABLE `sync_devices` (
  `id` int NOT NULL,
  `device_id` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `device_name` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `school_id` int DEFAULT NULL,
  `last_sync_at` timestamp NULL DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE','BLOCKED') COLLATE utf8mb4_general_ci DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_failures`
--

CREATE TABLE `sync_failures` (
  `id` int NOT NULL,
  `record_id` int NOT NULL COMMENT 'ID of the record that failed to sync',
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Name of the table containing the failed record',
  `operation` enum('push','pull') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Sync operation type that failed',
  `error_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Category of error (foreign_key, duplicate, constraint, network, etc.)',
  `error_message` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Detailed error message from the database or sync process',
  `error_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT 'Additional error context in JSON format (e.g., constraint names, field values)',
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP COMMENT 'When the failure occurred',
  `retry_count` int DEFAULT '0' COMMENT 'Number of times retry has been attempted for this record',
  `resolved` tinyint(1) DEFAULT '0' COMMENT 'Whether the failure has been resolved (0=unresolved, 1=resolved)'
) ;

-- --------------------------------------------------------

--
-- Table structure for table `sync_log`
--

CREATE TABLE `sync_log` (
  `id` bigint NOT NULL,
  `sync_type` enum('PUSH','PULL') COLLATE utf8mb4_general_ci NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `records_count` int DEFAULT '0',
  `status` enum('SUCCESS','FAILED','PARTIAL') COLLATE utf8mb4_general_ci NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `completed_at` timestamp NULL DEFAULT NULL,
  `error_details` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_metadata`
--

CREATE TABLE `sync_metadata` (
  `id` int NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `sync_order` int DEFAULT '999',
  `last_pull_at` timestamp NULL DEFAULT NULL,
  `last_push_at` timestamp NULL DEFAULT NULL,
  `last_record_id` bigint DEFAULT '0',
  `sync_enabled` tinyint(1) DEFAULT '1',
  `conflict_strategy` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'timestamp',
  `real_time_sync` tinyint(1) DEFAULT '0',
  `data_scope` enum('GLOBAL','LOCATION_LOCAL','LOCATION_SHARED') COLLATE utf8mb4_general_ci DEFAULT 'GLOBAL',
  `sync_targets` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `priority` int DEFAULT '0',
  `batch_size` int DEFAULT '100',
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT '',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `sync_metadata`
--


-- --------------------------------------------------------

--
-- Table structure for table `sync_metrics`
--

CREATE TABLE `sync_metrics` (
  `id` bigint NOT NULL,
  `metric_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metric_value` decimal(10,2) NOT NULL,
  `records_synced` int UNSIGNED NOT NULL DEFAULT '0' COMMENT 'Number of records synced in this metric entry',
  `location_id` int DEFAULT NULL,
  `table_name` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recorded_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ;

--
-- Dumping data for table `sync_metrics`
--


-- --------------------------------------------------------

--
-- Table structure for table `sync_notifications`
--

CREATE TABLE `sync_notifications` (
  `id` int UNSIGNED NOT NULL,
  `type` enum('conflict','location_offline','sync_failure','sync_success') COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `action_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ;

--
-- Dumping data for table `sync_notifications`
--


-- --------------------------------------------------------

--
-- Table structure for table `sync_queue`
--

CREATE TABLE `sync_queue` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `record_id` int DEFAULT NULL COMMENT 'Primary key value of the record',
  `operation` enum('insert','update','delete') COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `record_data` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `data` text COLLATE utf8mb4_unicode_520_ci COMMENT 'JSON encoded record data (new format)',
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `synced` tinyint(1) NOT NULL DEFAULT '0',
  `synced_at` timestamp NULL DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Error message if sync failed',
  `retry_count` int DEFAULT '0' COMMENT 'Number of retry attempts',
  `created_at` timestamp NULL DEFAULT NULL COMMENT 'When the queue entry was created'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sync_settings`
--

CREATE TABLE `sync_settings` (
  `id` int UNSIGNED NOT NULL,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sync_settings`
--


-- --------------------------------------------------------

--
-- Table structure for table `tax_brackets`
--

CREATE TABLE `tax_brackets` (
  `bracket_id` int NOT NULL COMMENT 'Primary key for tax bracket records',
  `country` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'Ghana' COMMENT 'Country for which tax bracket applies',
  `bracket_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Descriptive name for the tax bracket',
  `min_income` decimal(15,2) NOT NULL COMMENT 'Minimum annual income for this bracket',
  `max_income` decimal(15,2) DEFAULT NULL COMMENT 'Maximum annual income for this bracket (NULL = no upper limit)',
  `tax_rate` decimal(5,2) NOT NULL COMMENT 'Tax rate as percentage (e.g., 17.5 for 17.5%)',
  `fixed_amount` decimal(15,2) DEFAULT '0.00' COMMENT 'Fixed tax amount from previous brackets',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Whether this bracket is currently active',
  `effective_from` date NOT NULL COMMENT 'Date when this bracket becomes effective',
  `effective_to` date DEFAULT NULL COMMENT 'Date when this bracket expires (NULL = no expiry)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Record creation timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Progressive tax brackets for automated PAYE calculation';

--
-- Dumping data for table `tax_brackets`
--


-- --------------------------------------------------------

--
-- Table structure for table `teacher`
--

CREATE TABLE `teacher` (
  `teacher_id` int NOT NULL,
  `name` longtext COLLATE utf8mb4_unicode_520_ci,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `other_name` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `teacher_code` longtext COLLATE utf8mb4_unicode_520_ci,
  `birthday` longtext COLLATE utf8mb4_unicode_520_ci,
  `sex` longtext COLLATE utf8mb4_unicode_520_ci,
  `religion` longtext COLLATE utf8mb4_unicode_520_ci,
  `blood_group` longtext COLLATE utf8mb4_unicode_520_ci,
  `address` longtext COLLATE utf8mb4_unicode_520_ci,
  `phone` longtext COLLATE utf8mb4_unicode_520_ci,
  `email` longtext COLLATE utf8mb4_unicode_520_ci,
  `password` longtext COLLATE utf8mb4_unicode_520_ci,
  `ssnit_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `ghana_card_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `account_number` varchar(30) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `tier2_provider_id` int DEFAULT NULL COMMENT 'FK to pension_tier2_providers',
  `tier2_member_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Employee ID with Tier 2 provider',
  `account_details` longtext COLLATE utf8mb4_unicode_520_ci,
  `authentication_key` longtext COLLATE utf8mb4_unicode_520_ci,
  `designation` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `social_links` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `show_on_website` int DEFAULT '0',
  `read_notice_ids` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT '0',
  `block_limit` int DEFAULT '0',
  `active_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `online_status` enum('1','0') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `can_collect_daily_fees` tinyint(1) DEFAULT '0' COMMENT '1=can collect fees, 0=cannot',
  `collection_point` enum('classroom','office','bus') COLLATE utf8mb4_unicode_520_ci DEFAULT 'classroom',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `teacher`
--


-- --------------------------------------------------------

--
-- Table structure for table `teacher_privileges`
--

CREATE TABLE `teacher_privileges` (
  `id` int NOT NULL,
  `teacher_id` int NOT NULL COMMENT 'Foreign key to teacher table',
  `privilege_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'attendance_monitoring' COMMENT 'Type of privilege granted',
  `granted_by` int NOT NULL COMMENT 'Admin ID who granted the privilege',
  `granted_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp when privilege was granted',
  `status` enum('active','revoked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active' COMMENT 'Current status of the privilege',
  `revoked_by` int DEFAULT NULL COMMENT 'Admin ID who revoked the privilege',
  `revoked_at` datetime DEFAULT NULL COMMENT 'Timestamp when privilege was revoked',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT 'Additional notes about the privilege'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores teacher privileges for various system features';

--
-- Dumping data for table `teacher_privileges`
--


-- --------------------------------------------------------

--
-- Table structure for table `teacher_remarks_templates`
--

CREATE TABLE `teacher_remarks_templates` (
  `id` int NOT NULL,
  `remark_text` text COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Template remark text',
  `display_order` int NOT NULL DEFAULT '0' COMMENT 'Display order for dropdown',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT 'Active status (1=active, 0=inactive)',
  `category` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL COMMENT 'Optional category (positive, neutral, negative)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Predefined teacher remark templates for quick selection';

--
-- Dumping data for table `teacher_remarks_templates`
--


-- --------------------------------------------------------

--
-- Table structure for table `teaching_resources_master`
--

CREATE TABLE `teaching_resources_master` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'visual, audio, manipulative, digital, etc.',
  `display_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teaching_resources_master`
--


-- --------------------------------------------------------

--
-- Table structure for table `terminal_reports`
--

CREATE TABLE `terminal_reports` (
  `report_id` int NOT NULL,
  `student_id` int NOT NULL,
  `year` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `term` varchar(10) COLLATE utf8mb4_general_ci NOT NULL,
  `attendance_present` int DEFAULT '0',
  `attendance_total` int DEFAULT '0',
  `conduct` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `attitude` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `interest` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `teacher_remark` text COLLATE utf8mb4_general_ci,
  `headmaster_remark` text COLLATE utf8mb4_general_ci,
  `generated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_general_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_general_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `terms`
--

CREATE TABLE `terms` (
  `term_id` int NOT NULL,
  `term_ending` longtext COLLATE utf8mb4_unicode_520_ci,
  `next_term_begins` longtext COLLATE utf8mb4_unicode_520_ci,
  `full_payment_date` longtext COLLATE utf8mb4_unicode_520_ci,
  `days_opened` int DEFAULT NULL COMMENT 'Total number of days school was open during this term',
  `year` longtext COLLATE utf8mb4_unicode_520_ci,
  `term` longtext COLLATE utf8mb4_unicode_520_ci,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `terms`
--


-- --------------------------------------------------------

--
-- Table structure for table `tier2_providers`
--

CREATE TABLE `tier2_providers` (
  `provider_id` int NOT NULL,
  `provider_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_person` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SSNIT Tier 2 pension providers for employee contribution tracking';

-- --------------------------------------------------------

--
-- Table structure for table `to_do_list`
--

CREATE TABLE `to_do_list` (
  `id` int NOT NULL,
  `user_id` varchar(64) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `to_dodata` varchar(256) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `date` varchar(128) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `value` varchar(14) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transport`
--

CREATE TABLE `transport` (
  `transport_id` int NOT NULL,
  `route_name` longtext COLLATE utf8mb4_unicode_520_ci,
  `number_of_vehicle` longtext COLLATE utf8mb4_unicode_520_ci,
  `description` longtext COLLATE utf8mb4_unicode_520_ci,
  `route_fare` longtext COLLATE utf8mb4_unicode_520_ci,
  `driver_id` int DEFAULT NULL COMMENT 'Foreign key to non_teaching_staff.staff_id for driver assignment',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no',
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `transport`
--


-- --------------------------------------------------------

--
-- Table structure for table `transport_auto_billing`
--

CREATE TABLE `transport_auto_billing` (
  `billing_id` int NOT NULL,
  `student_id` int NOT NULL,
  `transport_id` int NOT NULL,
  `billing_date` date NOT NULL,
  `fare_amount` decimal(10,2) NOT NULL,
  `was_present` enum('yes','no') COLLATE utf8mb4_unicode_520_ci DEFAULT 'no',
  `boarded_bus` enum('yes','no') COLLATE utf8mb4_unicode_520_ci DEFAULT 'no',
  `billing_status` enum('pending','confirmed','reversed') COLLATE utf8mb4_unicode_520_ci DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transport_daily_log`
--

CREATE TABLE `transport_daily_log` (
  `log_id` int NOT NULL,
  `student_id` int NOT NULL,
  `transport_id` int NOT NULL,
  `log_date` date NOT NULL,
  `boarded_bus` enum('yes','no') COLLATE utf8mb4_unicode_520_ci DEFAULT 'no',
  `paid_fare` enum('yes','no') COLLATE utf8mb4_unicode_520_ci DEFAULT 'no',
  `conductor_id` int DEFAULT NULL,
  `remarks` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `logged_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `sync_status` enum('PENDING','SYNCED','FAILED','MANUAL_REVIEW') COLLATE utf8mb4_unicode_520_ci DEFAULT 'PENDING',
  `last_modified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` int DEFAULT NULL,
  `device_id` varchar(50) COLLATE utf8mb4_unicode_520_ci DEFAULT 'local-server-001',
  `version` int DEFAULT '1',
  `retry_count` int DEFAULT '0',
  `sync_error` text COLLATE utf8mb4_unicode_520_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_notification_preferences`
--

CREATE TABLE `user_notification_preferences` (
  `preference_id` int UNSIGNED NOT NULL,
  `user_id` int NOT NULL COMMENT 'User ID (references admin.admin_id - INT signed)',
  `sms_enabled` tinyint(1) NOT NULL DEFAULT '0' COMMENT '0 = SMS disabled (opt-out), 1 = SMS enabled (opt-in)',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last preference update timestamp'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User SMS notification preferences (default: opt-out)';

-- --------------------------------------------------------

--
-- Table structure for table `user_permission`
--

CREATE TABLE `user_permission` (
  `permission_id` int NOT NULL,
  `permission_title` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `user_type` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `user_level` int DEFAULT NULL,
  `permission_status` enum('0','1') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '0',
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Dumping data for table `user_permission`
--


-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `permission_id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL COMMENT 'ID of the user (teacher_id, admin_id, etc.)',
  `user_type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Type of user: teacher, admin, accountant, etc.',
  `module_name` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Module name: head_teacher_remarks, teacher_remarks_templates, etc.',
  `permission_type` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL COMMENT 'Permission type: view, add, edit, delete, manage',
  `status` enum('active','revoked') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'active' COMMENT 'Permission status',
  `granted_by` int UNSIGNED NOT NULL COMMENT 'Admin ID who granted the permission',
  `granted_at` datetime NOT NULL COMMENT 'When the permission was granted',
  `revoked_by` int UNSIGNED DEFAULT NULL COMMENT 'Admin ID who revoked the permission',
  `revoked_at` datetime DEFAULT NULL COMMENT 'When the permission was revoked',
  `notes` text COLLATE utf8mb4_unicode_520_ci COMMENT 'Additional notes about the permission',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci COMMENT='Stores user permissions for modules';

--
-- Dumping data for table `user_permissions`
--


-- --------------------------------------------------------

--
-- Table structure for table `visitor_tracker`
--

CREATE TABLE `visitor_tracker` (
  `id` int NOT NULL,
  `ip` varchar(15) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `page_view` mediumtext COLLATE utf8mb4_unicode_520_ci,
  `date` int NOT NULL,
  `sync` enum('yes','no') COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'no'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

-- --------------------------------------------------------

--
-- Table structure for table `v_discount_audit_summary`
--

CREATE TABLE `v_discount_audit_summary` (
  `audit_id` int DEFAULT NULL,
  `entity_type` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `entity_id` int DEFAULT NULL,
  `action` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `entity_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `changed_by_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `changed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ip_address` varchar(45) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `formatted_date` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Stand-in structure for view `v_expense_summary_by_category`
-- (See below for the actual view)
--
CREATE TABLE `v_expense_summary_by_category` (
`category_name` varchar(100)
,`expense_count` bigint
,`pending_amount` decimal(32,2)
,`approved_amount` decimal(32,2)
,`rejected_amount` decimal(32,2)
,`total_amount` decimal(32,2)
);

-- --------------------------------------------------------

--
-- Table structure for table `v_invoice_discounts_detailed`
--

CREATE TABLE `v_invoice_discounts_detailed` (
  `discount_id` int DEFAULT NULL,
  `student_id` int DEFAULT NULL,
  `student_name` longtext COLLATE utf8mb3_unicode_ci,
  `student_code` longtext COLLATE utf8mb3_unicode_ci,
  `invoice_code` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `discount_type_id` int DEFAULT NULL,
  `discount_type_name` varchar(255) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `discount_type_icon` varchar(10) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `category_id` tinyint DEFAULT NULL,
  `category_code` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `category_name` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `discount_method` varchar(20) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT NULL,
  `reason` mediumtext COLLATE utf8mb3_unicode_ci,
  `status` varchar(50) COLLATE utf8mb3_unicode_ci DEFAULT NULL,
  `applied_by` int DEFAULT NULL,
  `applied_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `waec_grading_scale`
--

CREATE TABLE `waec_grading_scale` (
  `id` int NOT NULL,
  `grade` varchar(2) COLLATE utf8mb4_general_ci NOT NULL,
  `min_score` int NOT NULL,
  `max_score` int NOT NULL,
  `grade_point` decimal(3,2) DEFAULT NULL,
  `remark` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_pass` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `waec_grading_scale`
--


-- --------------------------------------------------------

--
-- Table structure for table `water_charge_log`
--

CREATE TABLE `water_charge_log` (
  `id` int NOT NULL,
  `student_id` int NOT NULL,
  `week_start_date` int NOT NULL,
  `week_end_date` int NOT NULL,
  `amount_charged` decimal(10,2) NOT NULL,
  `payment_status` enum('paid','unpaid') COLLATE utf8mb4_unicode_520_ci DEFAULT 'unpaid',
  `year` int NOT NULL,
  `term` int DEFAULT NULL,
  `sem` int DEFAULT NULL,
  `charged_at` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `academic_syllabus`
--
ALTER TABLE `academic_syllabus`
  ADD PRIMARY KEY (`academic_syllabus_id`);

--
-- Indexes for table `accountant`
--
ALTER TABLE `accountant`
  ADD PRIMARY KEY (`accountant_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`account_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `accounts_payable`
--
ALTER TABLE `accounts_payable`
  ADD PRIMARY KEY (`accounts_payable_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `account_type`
--
ALTER TABLE `account_type`
  ADD PRIMARY KEY (`account_type_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `addition`
--
ALTER TABLE `addition`
  ADD PRIMARY KEY (`addi_id`);

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `tier2_provider_id` (`tier2_provider_id`);

--
-- Indexes for table `admission_category`
--
ALTER TABLE `admission_category`
  ADD PRIMARY KEY (`admission_category_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `admission_logs`
--
ALTER TABLE `admission_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `admitted_by` (`admitted_by`),
  ADD KEY `admission_date` (`admission_date`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `aggregation`
--
ALTER TABLE `aggregation`
  ADD PRIMARY KEY (`aggregate_id`);

--
-- Indexes for table `aging_report_snapshots`
--
ALTER TABLE `aging_report_snapshots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `snapshot_date` (`snapshot_date`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `age_category` (`age_category`);

--
-- Indexes for table `alumni`
--
ALTER TABLE `alumni`
  ADD PRIMARY KEY (`alumni_id`),
  ADD UNIQUE KEY `student_id` (`student_id`);

--
-- Indexes for table `approval_requests`
--
ALTER TABLE `approval_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_record` (`record_type`,`record_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_requested_by` (`requested_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `assessment_methods_master`
--
ALTER TABLE `assessment_methods_master`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`ass_id`);

--
-- Indexes for table `assets_category`
--
ALTER TABLE `assets_category`
  ADD PRIMARY KEY (`cat_id`);

--
-- Indexes for table `assign_leave`
--
ALTER TABLE `assign_leave`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `assign_task`
--
ALTER TABLE `assign_task`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`attendance_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_attendance_student_id` (`student_id`),
  ADD KEY `idx_attendance_timestamp` (`timestamp`(20)),
  ADD KEY `idx_attendance_class_section_timestamp` (`class_id`,`section_id`,`timestamp`(20)),
  ADD KEY `idx_attendance_student_timestamp` (`student_id`,`timestamp`(20)),
  ADD KEY `idx_attendance_full_lookup` (`class_id`,`section_id`,`student_id`,`timestamp`(20)),
  ADD KEY `idx_attendance_class_timestamp` (`class_id`,`timestamp`(20));

--
-- Indexes for table `attendance_billing_log`
--
ALTER TABLE `attendance_billing_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_operation_date` (`operation_type`,`created_at`),
  ADD KEY `idx_student_log` (`student_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_module_action` (`module`,`action`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_user_id_created` (`user_id`,`created_at`),
  ADD KEY `idx_module_created_at` (`module`,`created_at`),
  ADD KEY `idx_module_created` (`module`,`created_at`),
  ADD KEY `idx_user_created` (`user_id`,`created_at`),
  ADD KEY `idx_module_record_created` (`module`,`record_id`,`created_at`),
  ADD KEY `idx_record_id` (`record_id`),
  ADD KEY `idx_created_module_action` (`created_at`,`module`,`action`);

--
-- Indexes for table `audit_trail`
--
ALTER TABLE `audit_trail`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_record_type` (`record_type`),
  ADD KEY `idx_record_id` (`record_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_performed_by` (`performed_by`),
  ADD KEY `idx_performed_at` (`performed_at`),
  ADD KEY `idx_composite` (`record_type`,`record_id`,`performed_at`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  ADD PRIMARY KEY (`bank_account_id`),
  ADD KEY `chart_account_id` (`chart_account_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `bank_reconciliations`
--
ALTER TABLE `bank_reconciliations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bank_account_id` (`bank_account_id`),
  ADD KEY `reconciliation_date` (`reconciliation_date`),
  ADD KEY `status` (`status`),
  ADD KEY `idx_account_date` (`bank_account_id`,`reconciliation_date`);

--
-- Indexes for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `bank_account_id` (`bank_account_id`),
  ADD KEY `transaction_date` (`transaction_date`),
  ADD KEY `journal_entry_id` (`journal_entry_id`);

--
-- Indexes for table `beneficiary_list`
--
ALTER TABLE `beneficiary_list`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `year_term` (`year`,`term`);

--
-- Indexes for table `benefit_category`
--
ALTER TABLE `benefit_category`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `idx_discount_type` (`discount_type_id`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_created_by` (`created_by`);

--
-- Indexes for table `billing_history`
--
ALTER TABLE `billing_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student_billing` (`student_id`,`billing_date`,`billing_type`),
  ADD KEY `idx_billing_date` (`billing_date`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `bill_category`
--
ALTER TABLE `bill_category`
  ADD PRIMARY KEY (`bill_category_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `bill_item`
--
ALTER TABLE `bill_item`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `title` (`title`),
  ADD UNIQUE KEY `description` (`description`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_class_category` (`class_category`);
ALTER TABLE `bill_item` ADD FULLTEXT KEY `idx_specific_class_ids` (`specific_class_ids`);

--
-- Indexes for table `bill_item_history`
--
ALTER TABLE `bill_item_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `blood_group`
--
ALTER TABLE `blood_group`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `boarding_bed`
--
ALTER TABLE `boarding_bed`
  ADD PRIMARY KEY (`bed_id`);

--
-- Indexes for table `boarding_dormitory`
--
ALTER TABLE `boarding_dormitory`
  ADD PRIMARY KEY (`dormitory_id`);

--
-- Indexes for table `boarding_house`
--
ALTER TABLE `boarding_house`
  ADD PRIMARY KEY (`house_id`);

--
-- Indexes for table `book`
--
ALTER TABLE `book`
  ADD PRIMARY KEY (`book_id`);

--
-- Indexes for table `book_request`
--
ALTER TABLE `book_request`
  ADD PRIMARY KEY (`book_request_id`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`budget_id`),
  ADD KEY `fiscal_year` (`fiscal_year`),
  ADD KEY `status` (`status`),
  ADD KEY `idx_year_status` (`fiscal_year`,`status`);

--
-- Indexes for table `budget_lines`
--
ALTER TABLE `budget_lines`
  ADD PRIMARY KEY (`budget_line_id`),
  ADD KEY `budget_id` (`budget_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `budget_utilization_log`
--
ALTER TABLE `budget_utilization_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `budget_id` (`budget_id`),
  ADD KEY `budget_line_id` (`budget_line_id`),
  ADD KEY `expense_id` (`expense_id`);

--
-- Indexes for table `bus_attendance`
--
ALTER TABLE `bus_attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `attendance_date` (`attendance_date`),
  ADD KEY `route_id` (`route_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  ADD PRIMARY KEY (`account_id`),
  ADD UNIQUE KEY `account_code` (`account_code`),
  ADD KEY `parent_account_id` (`parent_account_id`),
  ADD KEY `account_type` (`account_type`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `ci_sessions`
--
ALTER TABLE `ci_sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ci_sessions_timestamp` (`timestamp`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `class`
--
ALTER TABLE `class`
  ADD PRIMARY KEY (`class_id`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_class_lookup` (`class_id`,`name`,`name_numeric`);

--
-- Indexes for table `class_routine`
--
ALTER TABLE `class_routine`
  ADD PRIMARY KEY (`class_routine_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `conduct_items`
--
ALTER TABLE `conduct_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `display_order` (`display_order`),
  ADD KEY `is_active` (`is_active`);

--
-- Indexes for table `core_competencies`
--
ALTER TABLE `core_competencies`
  ADD PRIMARY KEY (`competency_id`);

--
-- Indexes for table `credit_applications`
--
ALTER TABLE `credit_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `idx_credit_id` (`credit_id`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_applied_at` (`applied_at`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `credit_notes`
--
ALTER TABLE `credit_notes`
  ADD PRIMARY KEY (`credit_note_id`),
  ADD UNIQUE KEY `unique_credit_note_number` (`credit_note_number`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_invoice` (`invoice_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `credit_system_logs`
--
ALTER TABLE `credit_system_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_student_action` (`student_id`,`action`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `curriculum_content_standards`
--
ALTER TABLE `curriculum_content_standards`
  ADD PRIMARY KEY (`content_standard_id`),
  ADD UNIQUE KEY `unique_standard` (`code`,`sub_strand_id`),
  ADD KEY `idx_sub_strand` (`sub_strand_id`);

--
-- Indexes for table `curriculum_indicators`
--
ALTER TABLE `curriculum_indicators`
  ADD PRIMARY KEY (`indicator_id`),
  ADD UNIQUE KEY `unique_indicator` (`indicator_code`,`sub_strand_id`),
  ADD KEY `idx_sub_strand` (`sub_strand_id`);

--
-- Indexes for table `curriculum_learning_indicators`
--
ALTER TABLE `curriculum_learning_indicators`
  ADD PRIMARY KEY (`indicator_id`),
  ADD UNIQUE KEY `unique_indicator` (`code`,`content_standard_id`),
  ADD KEY `idx_content_standard` (`content_standard_id`);

--
-- Indexes for table `curriculum_strands`
--
ALTER TABLE `curriculum_strands`
  ADD PRIMARY KEY (`strand_id`),
  ADD UNIQUE KEY `unique_strand_subject` (`name`,`subject_id`,`class_level`),
  ADD KEY `idx_subject_class` (`subject_id`,`class_level`);

--
-- Indexes for table `curriculum_sub_strands`
--
ALTER TABLE `curriculum_sub_strands`
  ADD PRIMARY KEY (`sub_strand_id`),
  ADD UNIQUE KEY `unique_sub_strand` (`name`,`strand_id`),
  ADD KEY `idx_strand` (`strand_id`);

--
-- Indexes for table `daily_charge_log`
--
ALTER TABLE `daily_charge_log`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_date` (`student_id`,`charge_date`),
  ADD KEY `charge_date` (`charge_date`),
  ADD KEY `idx_charge_sync` (`synced_to_ledger`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `daily_fee_audit_log`
--
ALTER TABLE `daily_fee_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`,`created_at`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `daily_fee_rates`
--
ALTER TABLE `daily_fee_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `class_id` (`class_id`,`year`,`term`,`sem`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_class_year_term` (`class_id`,`year`(10),`term`),
  ADD KEY `idx_year_term_lookup` (`year`(10),`term`);

--
-- Indexes for table `daily_fee_transactions`
--
ALTER TABLE `daily_fee_transactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transaction_code` (`transaction_code`),
  ADD KEY `student_id` (`student_id`,`payment_date`),
  ADD KEY `idx_year_term` (`year`,`term`),
  ADD KEY `idx_synced` (`synced_to_accounts`),
  ADD KEY `idx_journal_entry` (`journal_entry_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_residence_type` (`residence_type`),
  ADD KEY `idx_student_payment_date` (`student_id`,`payment_date`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_year_term_student` (`year`,`term`,`student_id`);

--
-- Indexes for table `daily_fee_wallet`
--
ALTER TABLE `daily_fee_wallet`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `idx_year_term` (`year`,`term`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_student_year_term` (`student_id`,`year`,`term`);

--
-- Indexes for table `daily_transport_choices`
--
ALTER TABLE `daily_transport_choices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_date` (`student_id`,`choice_date`),
  ADD KEY `student_id` (`student_id`,`choice_date`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `department`
--
ALTER TABLE `department`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `desciplinary`
--
ALTER TABLE `desciplinary`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `designation`
--
ALTER TABLE `designation`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `discount_applications`
--
ALTER TABLE `discount_applications`
  ADD PRIMARY KEY (`application_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_profile` (`profile_id`),
  ADD KEY `idx_category` (`discount_category`),
  ADD KEY `idx_year_term` (`year`,`term`),
  ADD KEY `idx_applied_at` (`applied_at`),
  ADD KEY `idx_reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_reporting` (`discount_category`,`year`,`term`,`applied_at`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `discount_approvals`
--
ALTER TABLE `discount_approvals`
  ADD PRIMARY KEY (`approval_id`),
  ADD KEY `discount_type_id` (`discount_type_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_requested_by` (`requested_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `discount_audit_log`
--
ALTER TABLE `discount_audit_log`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_application` (`application_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_performed_at` (`performed_at`),
  ADD KEY `idx_performed_by` (`performed_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `discount_audit_trail`
--
ALTER TABLE `discount_audit_trail`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_discount_type` (`entity_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_changed_at` (`changed_at`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_changed_by` (`changed_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `discount_categories`
--
ALTER TABLE `discount_categories`
  ADD PRIMARY KEY (`category_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `discount_profiles`
--
ALTER TABLE `discount_profiles`
  ADD PRIMARY KEY (`profile_id`),
  ADD UNIQUE KEY `profile_name` (`profile_name`),
  ADD KEY `idx_discount_category` (`discount_category`,`is_active`),
  ADD KEY `idx_bill_item_ids` (`bill_item_ids`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `discount_profile_rules`
--
ALTER TABLE `discount_profile_rules`
  ADD PRIMARY KEY (`rule_id`),
  ADD KEY `profile_id` (`profile_id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `bill_category_id` (`bill_category_id`),
  ADD KEY `idx_profile_class` (`profile_id`,`class_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `discount_summary_cache`
--
ALTER TABLE `discount_summary_cache`
  ADD PRIMARY KEY (`cache_id`),
  ADD UNIQUE KEY `idx_unique_summary` (`discount_category`,`year`,`term`,`profile_id`),
  ADD KEY `idx_category_period` (`discount_category`,`year`,`term`);

--
-- Indexes for table `document`
--
ALTER TABLE `document`
  ADD PRIMARY KEY (`document_id`);

--
-- Indexes for table `dormitory`
--
ALTER TABLE `dormitory`
  ADD PRIMARY KEY (`dormitory_id`);

--
-- Indexes for table `earned_leave`
--
ALTER TABLE `earned_leave`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `education`
--
ALTER TABLE `education`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `email_log`
--
ALTER TABLE `email_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_recipient` (`recipient`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_reference` (`reference_id`),
  ADD KEY `idx_sent_at` (`sent_at`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recipient` (`recipient`),
  ADD KEY `status` (`status`),
  ADD KEY `sent_at` (`sent_at`);

--
-- Indexes for table `employee`
--
ALTER TABLE `employee`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `employee_file`
--
ALTER TABLE `employee_file`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `emp_address`
--
ALTER TABLE `emp_address`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `emp_assets`
--
ALTER TABLE `emp_assets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `emp_attendance`
--
ALTER TABLE `emp_attendance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `emp_bank_info`
--
ALTER TABLE `emp_bank_info`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `emp_experience`
--
ALTER TABLE `emp_experience`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `emp_leave`
--
ALTER TABLE `emp_leave`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `emp_penalty`
--
ALTER TABLE `emp_penalty`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `emp_salary`
--
ALTER TABLE `emp_salary`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `enroll`
--
ALTER TABLE `enroll`
  ADD PRIMARY KEY (`enroll_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_enroll_class_filter` (`student_id`,`year`(10),`term`(5),`class_id`),
  ADD KEY `idx_enroll_class_year_term` (`class_id`,`year`(20),`term`(10)),
  ADD KEY `idx_enroll_student_year_term` (`student_id`,`year`(20),`term`(10)),
  ADD KEY `idx_enroll_year_term` (`year`(20),`term`(10)),
  ADD KEY `idx_enroll_student_year` (`student_id`,`year`(10)),
  ADD KEY `idx_enroll_class_section_year` (`class_id`,`section_id`,`year`(10)),
  ADD KEY `idx_enroll_term_sem` (`term`(10),`sem`(10));

--
-- Indexes for table `enterprise_exams`
--
ALTER TABLE `enterprise_exams`
  ADD PRIMARY KEY (`exam_id`),
  ADD KEY `idx_class_year_term` (`class_id`,`year`,`term`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `enterprise_exam_subjects`
--
ALTER TABLE `enterprise_exam_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_exam_subject` (`exam_id`,`subject_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `enterprise_student_marks`
--
ALTER TABLE `enterprise_student_marks`
  ADD PRIMARY KEY (`mark_id`),
  ADD UNIQUE KEY `unique_student_exam_subject` (`exam_id`,`student_id`,`subject_id`),
  ADD KEY `idx_student_exam` (`student_id`,`exam_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `enterprise_terminal_reports`
--
ALTER TABLE `enterprise_terminal_reports`
  ADD PRIMARY KEY (`report_id`),
  ADD UNIQUE KEY `unique_student_exam` (`student_id`,`exam_id`),
  ADD KEY `idx_class_year_term` (`class_id`,`year`,`term`);

--
-- Indexes for table `exam`
--
ALTER TABLE `exam`
  ADD PRIMARY KEY (`exam_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_exam_lookup` (`year`(10),`term`(10),`sem`(10),`category_id`),
  ADD KEY `idx_exam_date` (`date`(10));

--
-- Indexes for table `exam_category`
--
ALTER TABLE `exam_category`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `exam_marks`
--
ALTER TABLE `exam_marks`
  ADD PRIMARY KEY (`mark_id`),
  ADD UNIQUE KEY `unique_student_subject` (`student_id`,`subject_id`,`year`,`term`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_subject` (`subject_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `expenses_enhanced`
--
ALTER TABLE `expenses_enhanced`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expense_date` (`expense_date`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `status` (`status`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_date_status` (`expense_date`,`status`),
  ADD KEY `budget_line_id` (`budget_line_id`);

--
-- Indexes for table `expense_categories_enhanced`
--
ALTER TABLE `expense_categories_enhanced`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `expense_category`
--
ALTER TABLE `expense_category`
  ADD PRIMARY KEY (`expense_category_id`);

--
-- Indexes for table `fee_collection_assignments`
--
ALTER TABLE `fee_collection_assignments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_assignment` (`teacher_id`,`class_id`,`year`,`term`),
  ADD KEY `teacher_id` (`teacher_id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `fee_collection_modes`
--
ALTER TABLE `fee_collection_modes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `fee_structures`
--
ALTER TABLE `fee_structures`
  ADD PRIMARY KEY (`structure_id`),
  ADD KEY `class_id` (`class_id`),
  ADD KEY `academic_year` (`academic_year`,`term`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `field_visit`
--
ALTER TABLE `field_visit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `finance_audit_trail`
--
ALTER TABLE `finance_audit_trail`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `table_record` (`table_name`,`record_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `finance_dashboard_cache`
--
ALTER TABLE `finance_dashboard_cache`
  ADD PRIMARY KEY (`cache_id`),
  ADD UNIQUE KEY `cache_key_year_term` (`cache_key`,`year`,`term`);

--
-- Indexes for table `financial_alert_resolutions`
--
ALTER TABLE `financial_alert_resolutions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `alert_key` (`alert_key`),
  ADD KEY `resolved_at` (`resolved_at`);

--
-- Indexes for table `financial_analytics_cache`
--
ALTER TABLE `financial_analytics_cache`
  ADD PRIMARY KEY (`cache_id`),
  ADD UNIQUE KEY `unique_cache_key` (`cache_key`,`period`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indexes for table `financial_audit_trail`
--
ALTER TABLE `financial_audit_trail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `module` (`module`),
  ADD KEY `action` (`action`),
  ADD KEY `record_id` (`record_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `financial_integration_log`
--
ALTER TABLE `financial_integration_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_integration_type` (`integration_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_source` (`source_table`,`source_id`);

--
-- Indexes for table `financial_reports_cache`
--
ALTER TABLE `financial_reports_cache`
  ADD PRIMARY KEY (`cache_id`),
  ADD KEY `report_type` (`report_type`),
  ADD KEY `expires_at` (`expires_at`);

--
-- Indexes for table `fiscal_periods`
--
ALTER TABLE `fiscal_periods`
  ADD PRIMARY KEY (`period_id`),
  ADD KEY `fiscal_year_id` (`fiscal_year_id`);

--
-- Indexes for table `fiscal_years`
--
ALTER TABLE `fiscal_years`
  ADD PRIMARY KEY (`fiscal_year_id`),
  ADD UNIQUE KEY `year_name` (`year_name`);

--
-- Indexes for table `flutter_user`
--
ALTER TABLE `flutter_user`
  ADD PRIMARY KEY (`flutter_id`);

--
-- Indexes for table `form_field_preferences`
--
ALTER TABLE `form_field_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_field` (`field_name`);

--
-- Indexes for table `frontend_events`
--
ALTER TABLE `frontend_events`
  ADD PRIMARY KEY (`frontend_events_id`);

--
-- Indexes for table `frontend_gallery`
--
ALTER TABLE `frontend_gallery`
  ADD PRIMARY KEY (`frontend_gallery_id`);

--
-- Indexes for table `frontend_gallery_image`
--
ALTER TABLE `frontend_gallery_image`
  ADD PRIMARY KEY (`frontend_gallery_image_id`);

--
-- Indexes for table `frontend_general_settings`
--
ALTER TABLE `frontend_general_settings`
  ADD PRIMARY KEY (`frontend_general_settings_id`);

--
-- Indexes for table `frontend_news`
--
ALTER TABLE `frontend_news`
  ADD PRIMARY KEY (`frontend_news_id`);

--
-- Indexes for table `grade`
--
ALTER TABLE `grade`
  ADD PRIMARY KEY (`grade_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_grade_lookup` (`grade_point_numeric`,`mark_from`,`mark_upto`);

--
-- Indexes for table `grade_2`
--
ALTER TABLE `grade_2`
  ADD PRIMARY KEY (`grade_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `grade_creche`
--
ALTER TABLE `grade_creche`
  ADD PRIMARY KEY (`grade_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `group_message`
--
ALTER TABLE `group_message`
  ADD PRIMARY KEY (`group_message_id`);

--
-- Indexes for table `group_message_other`
--
ALTER TABLE `group_message_other`
  ADD PRIMARY KEY (`member_id`);

--
-- Indexes for table `group_message_thread`
--
ALTER TABLE `group_message_thread`
  ADD PRIMARY KEY (`group_message_thread_id`);

--
-- Indexes for table `head_teacher_remarks_ranges`
--
ALTER TABLE `head_teacher_remarks_ranges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active_percentage` (`is_active`,`min_percentage`,`max_percentage`),
  ADD KEY `idx_display_order` (`display_order`);

--
-- Indexes for table `hod_subjects`
--
ALTER TABLE `hod_subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_hod_subject` (`teacher_id`,`subject_id`),
  ADD KEY `idx_teacher` (`teacher_id`),
  ADD KEY `idx_subject` (`subject_id`),
  ADD KEY `idx_assigned_by` (`assigned_by`);

--
-- Indexes for table `holiday`
--
ALTER TABLE `holiday`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `hubtel_transaction_logs`
--
ALTER TABLE `hubtel_transaction_logs`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `transaction_ref` (`transaction_ref`);

--
-- Indexes for table `incomplete_fee_transactions`
--
ALTER TABLE `incomplete_fee_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `interest_items`
--
ALTER TABLE `interest_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `display_order` (`display_order`),
  ADD KEY `is_active` (`is_active`);

--
-- Indexes for table `inventory_audit_log`
--
ALTER TABLE `inventory_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_record` (`table_name`,`record_id`),
  ADD KEY `idx_date` (`created_at`),
  ADD KEY `idx_action` (`action_type`),
  ADD KEY `idx_performed_by` (`performed_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_sync` (`last_sync_attempt`),
  ADD KEY `idx_device` (`device_id`);

--
-- Indexes for table `inventory_categories`
--
ALTER TABLE `inventory_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_name` (`name`);

--
-- Indexes for table `inventory_locations`
--
ALTER TABLE `inventory_locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `inventory_products`
--
ALTER TABLE `inventory_products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sku` (`sku`),
  ADD KEY `idx_category` (`category_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_quantity` (`quantity`),
  ADD KEY `idx_barcode` (`barcode`),
  ADD KEY `idx_supplier` (`supplier_id`);

--
-- Indexes for table `inventory_purchases`
--
ALTER TABLE `inventory_purchases`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_po_code` (`po_code`),
  ADD KEY `idx_supplier` (`supplier_id`),
  ADD KEY `idx_purchase_date` (`purchase_date`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_reference` (`reference_number`),
  ADD KEY `idx_purchase_status_date` (`status`,`purchase_date`),
  ADD KEY `fk_purchase_receiver` (`received_by`),
  ADD KEY `idx_payment_status` (`payment_status`),
  ADD KEY `idx_last_payment_date` (`last_payment_date`),
  ADD KEY `idx_payment_status_date` (`payment_status`,`last_payment_date`);

--
-- Indexes for table `inventory_purchase_items`
--
ALTER TABLE `inventory_purchase_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase` (`purchase_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Indexes for table `inventory_purchase_payments`
--
ALTER TABLE `inventory_purchase_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_purchase` (`purchase_id`),
  ADD KEY `idx_payment_date` (`payment_date`),
  ADD KEY `idx_payment_method` (`payment_method_id`),
  ADD KEY `idx_recorded_by` (`recorded_by`),
  ADD KEY `idx_expenditure_payment` (`expenditure_payment_id`),
  ADD KEY `idx_purchase_payment_date` (`purchase_id`,`payment_date`);

--
-- Indexes for table `inventory_returns`
--
ALTER TABLE `inventory_returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_original_sale` (`original_sale_id`),
  ADD KEY `idx_return_date` (`return_date`),
  ADD KEY `idx_processed_by` (`processed_by`),
  ADD KEY `idx_return_reason` (`return_reason`),
  ADD KEY `idx_return_date_reason` (`return_date`,`return_reason`);

--
-- Indexes for table `inventory_return_items`
--
ALTER TABLE `inventory_return_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_return` (`return_id`),
  ADD KEY `idx_sale_item` (`sale_item_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Indexes for table `inventory_sales`
--
ALTER TABLE `inventory_sales`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_sale_date` (`sale_date`),
  ADD KEY `idx_served_by` (`served_by`),
  ADD KEY `idx_date` (`sale_date`),
  ADD KEY `idx_receipt_code` (`receipt_code`),
  ADD KEY `idx_customer_name` (`customer_name`);

--
-- Indexes for table `inventory_sale_items`
--
ALTER TABLE `inventory_sale_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sale` (`sale_id`),
  ADD KEY `idx_product` (`product_id`);

--
-- Indexes for table `inventory_stock_movements`
--
ALTER TABLE `inventory_stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_date` (`movement_date`),
  ADD KEY `idx_type` (`movement_type`);

--
-- Indexes for table `inventory_suppliers`
--
ALTER TABLE `inventory_suppliers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_name` (`name`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `invoice`
--
ALTER TABLE `invoice`
  ADD PRIMARY KEY (`invoice_id`),
  ADD KEY `idx_student_term` (`student_id`,`year`,`term`),
  ADD KEY `idx_invoice_code` (`invoice_code`),
  ADD KEY `idx_status_year_term` (`status`,`year`,`term`),
  ADD KEY `idx_student_invoice_code` (`student_id`,`invoice_code`),
  ADD KEY `idx_benefit_category` (`benefit_category_id`),
  ADD KEY `idx_invoice_credit` (`credit_applied`),
  ADD KEY `idx_invoice_net_due` (`net_due`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_bulk_invoice_lookup` (`mute`,`can_delete`,`year`,`term`,`invoice_code`),
  ADD KEY `idx_invoice_grouping` (`invoice_code`,`student_id`,`mute`,`can_delete`),
  ADD KEY `idx_invoice_student_term_year` (`student_id`,`term`,`year`,`mute`,`can_delete`);

--
-- Indexes for table `invoice_access_tokens`
--
ALTER TABLE `invoice_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `invoice_code` (`invoice_code`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `invoice_discounts`
--
ALTER TABLE `invoice_discounts`
  ADD PRIMARY KEY (`discount_id`),
  ADD KEY `idx_invoice` (`invoice_code`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_student_category_status` (`student_id`,`status`),
  ADD KEY `idx_category_status` (`status`),
  ADD KEY `idx_type_status` (`status`),
  ADD KEY `idx_year_term` (`year`,`term`),
  ADD KEY `idx_status_post` (`status`),
  ADD KEY `idx_created_by_post` (`created_by`),
  ADD KEY `idx_discount_category` (`discount_category`,`status`),
  ADD KEY `idx_profile_category` (`profile_id`,`discount_category`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `invoice_discount_items`
--
ALTER TABLE `invoice_discount_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_discount_id` (`discount_id`),
  ADD KEY `idx_invoice_id` (`invoice_id`),
  ADD KEY `idx_invoice_code` (`invoice_code`),
  ADD KEY `idx_student_id` (`student_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `invoice_modification_requests`
--
ALTER TABLE `invoice_modification_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `invoice_code` (`invoice_code`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `status` (`status`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `invoice_payment_audit_log`
--
ALTER TABLE `invoice_payment_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_record` (`record_type`,`record_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_performed_by` (`performed_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `invoice_payment_links`
--
ALTER TABLE `invoice_payment_links`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoice_id` (`invoice_id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `linked_by` (`linked_by`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `invoice_sms_log`
--
ALTER TABLE `invoice_sms_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`entry_id`),
  ADD UNIQUE KEY `entry_number` (`entry_number`),
  ADD KEY `entry_date` (`entry_date`),
  ADD KEY `status` (`status`),
  ADD KEY `reference` (`reference_type`,`reference_id`),
  ADD KEY `idx_source` (`source_type`,`source_id`);

--
-- Indexes for table `journal_entry_lines`
--
ALTER TABLE `journal_entry_lines`
  ADD PRIMARY KEY (`line_id`),
  ADD KEY `entry_id` (`entry_id`),
  ADD KEY `account_id` (`account_id`);

--
-- Indexes for table `language`
--
ALTER TABLE `language`
  ADD PRIMARY KEY (`phrase_id`);

--
-- Indexes for table `late_payment_settings`
--
ALTER TABLE `late_payment_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `leave_types`
--
ALTER TABLE `leave_types`
  ADD PRIMARY KEY (`type_id`);

--
-- Indexes for table `lesson_notes`
--
ALTER TABLE `lesson_notes`
  ADD PRIMARY KEY (`lesson_note_id`),
  ADD KEY `idx_teacher` (`teacher_id`),
  ADD KEY `idx_class_subject` (`class_id`,`subject_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_week_term` (`week_number`,`term`),
  ADD KEY `idx_date` (`lesson_date`),
  ADD KEY `idx_strand` (`strand_id`),
  ADD KEY `idx_sub_strand` (`sub_strand_id`),
  ADD KEY `idx_content_standard` (`content_standard_id`),
  ADD KEY `idx_hod` (`hod_id`),
  ADD KEY `idx_admin` (`admin_id`),
  ADD KEY `fk_ln_subject` (`subject_id`),
  ADD KEY `fk_ln_source` (`source_lesson_note_id`);

--
-- Indexes for table `lesson_note_assessments`
--
ALTER TABLE `lesson_note_assessments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_note` (`lesson_note_id`);

--
-- Indexes for table `lesson_note_competencies`
--
ALTER TABLE `lesson_note_competencies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_note_competency` (`lesson_note_id`,`competency_id`),
  ADD KEY `idx_lesson_note` (`lesson_note_id`),
  ADD KEY `idx_competency` (`competency_id`);

--
-- Indexes for table `lesson_note_indicators`
--
ALTER TABLE `lesson_note_indicators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_note_indicator` (`lesson_note_id`,`indicator_id`),
  ADD KEY `idx_lesson_note` (`lesson_note_id`),
  ADD KEY `idx_indicator` (`indicator_id`);

--
-- Indexes for table `lesson_note_notifications`
--
ALTER TABLE `lesson_note_notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_user` (`user_id`,`user_type`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `lesson_note_references`
--
ALTER TABLE `lesson_note_references`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_note` (`lesson_note_id`);

--
-- Indexes for table `lesson_note_resources`
--
ALTER TABLE `lesson_note_resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_lesson_note` (`lesson_note_id`);

--
-- Indexes for table `lesson_note_revisions`
--
ALTER TABLE `lesson_note_revisions`
  ADD PRIMARY KEY (`revision_id`),
  ADD KEY `idx_lesson_note` (`lesson_note_id`),
  ADD KEY `idx_user` (`user_id`,`user_type`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `librarian`
--
ALTER TABLE `librarian`
  ADD PRIMARY KEY (`librarian_id`);

--
-- Indexes for table `loan`
--
ALTER TABLE `loan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `loan_installment`
--
ALTER TABLE `loan_installment`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `location_registry`
--
ALTER TABLE `location_registry`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `device_id` (`device_id`),
  ADD KEY `idx_device_id` (`device_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_last_sync` (`last_sync_at`),
  ADD KEY `idx_priority` (`priority`);

--
-- Indexes for table `logistic_asset`
--
ALTER TABLE `logistic_asset`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `logistic_assign`
--
ALTER TABLE `logistic_assign`
  ADD PRIMARY KEY (`ass_id`);

--
-- Indexes for table `mark`
--
ALTER TABLE `mark`
  ADD PRIMARY KEY (`mark_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_mark_student_exam` (`student_id`,`exam_id`),
  ADD KEY `idx_mark_subject_exam` (`subject_id`,`exam_id`),
  ADD KEY `idx_mark_class_section` (`class_id`,`section_id`),
  ADD KEY `idx_mark_year` (`year`(10)),
  ADD KEY `idx_exam_marks_student` (`student_id`,`mark_id`),
  ADD KEY `idx_exam_marks_exam` (`exam_id`);

--
-- Indexes for table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `idx_message_thread_code` (`message_thread_code`(64)),
  ADD KEY `idx_message_sender` (`sender`(64)),
  ADD KEY `idx_message_read_status` (`read_status`);

--
-- Indexes for table `message_thread`
--
ALTER TABLE `message_thread`
  ADD PRIMARY KEY (`message_thread_id`),
  ADD UNIQUE KEY `uq_message_thread_code` (`message_thread_code`(64)),
  ADD KEY `idx_message_thread_sender` (`sender`(64)),
  ADD KEY `idx_message_thread_receiver` (`reciever`(64)),
  ADD KEY `idx_message_thread_last_timestamp` (`last_message_timestamp`(32));

--
-- Indexes for table `mobile_money_payment`
--
ALTER TABLE `mobile_money_payment`
  ADD PRIMARY KEY (`mo_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `non_teaching_staff`
--
ALTER TABLE `non_teaching_staff`
  ADD PRIMARY KEY (`staff_id`),
  ADD UNIQUE KEY `staff_code` (`staff_code`),
  ADD KEY `idx_staff_code` (`staff_code`),
  ADD KEY `idx_active_status` (`active_status`),
  ADD KEY `idx_employment_category` (`employment_category`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_department` (`department`),
  ADD KEY `tier2_provider_id` (`tier2_provider_id`),
  ADD KEY `idx_position` (`position`);

--
-- Indexes for table `notice`
--
ALTER TABLE `notice`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `noticeboard`
--
ALTER TABLE `noticeboard`
  ADD PRIMARY KEY (`notice_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `type` (`type`),
  ADD KEY `is_read` (`is_read`),
  ADD KEY `user_type` (`user_type`);

--
-- Indexes for table `notification_delivery_log`
--
ALTER TABLE `notification_delivery_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_notification_id` (`notification_id`),
  ADD KEY `idx_channel` (`channel`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_sent_at` (`sent_at`);

--
-- Indexes for table `online_exam`
--
ALTER TABLE `online_exam`
  ADD PRIMARY KEY (`online_exam_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `online_exam_result`
--
ALTER TABLE `online_exam_result`
  ADD PRIMARY KEY (`online_exam_result_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `parent`
--
ALTER TABLE `parent`
  ADD PRIMARY KEY (`parent_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `payment`
--
ALTER TABLE `payment`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `idx_student_term` (`student_id`,`year`,`term`),
  ADD KEY `idx_student_day_timestamp` (`student_id`,`day_timestamp`),
  ADD KEY `idx_receipt_id` (`receipt_id`),
  ADD KEY `idx_installment_id` (`installment_id`),
  ADD KEY `idx_printed` (`is_printed`),
  ADD KEY `idx_emailed` (`is_emailed`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `payment_installments`
--
ALTER TABLE `payment_installments`
  ADD PRIMARY KEY (`installment_id`),
  ADD KEY `plan_id` (`plan_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `payment_methods`
--
ALTER TABLE `payment_methods`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `payment_plans`
--
ALTER TABLE `payment_plans`
  ADD PRIMARY KEY (`plan_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_invoice` (`invoice_code`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  ADD PRIMARY KEY (`transaction_id`),
  ADD UNIQUE KEY `transaction_ref` (`transaction_ref`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `gateway_ref` (`gateway_ref`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `payroll_approvals`
--
ALTER TABLE `payroll_approvals`
  ADD PRIMARY KEY (`approval_id`),
  ADD KEY `idx_pay_id` (`pay_id`),
  ADD KEY `idx_action_date` (`action_date`);

--
-- Indexes for table `payroll_audit_enhanced`
--
ALTER TABLE `payroll_audit_enhanced`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_pay_id` (`pay_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_field_changed` (`field_changed`);

--
-- Indexes for table `payroll_form_field_preferences`
--
ALTER TABLE `payroll_form_field_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_field` (`field_name`);

--
-- Indexes for table `payroll_statutory_settings`
--
ALTER TABLE `payroll_statutory_settings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `idx_setting_key` (`setting_key`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `payroll_statutory_settings_log`
--
ALTER TABLE `payroll_statutory_settings_log`
  ADD PRIMARY KEY (`log_id`),
  ADD KEY `idx_setting_id` (`setting_id`),
  ADD KEY `idx_changed_by` (`changed_by`),
  ADD KEY `idx_changed_at` (`changed_at`);

--
-- Indexes for table `pay_salary`
--
ALTER TABLE `pay_salary`
  ADD PRIMARY KEY (`pay_id`),
  ADD UNIQUE KEY `uk_employee_month_year` (`employee_code`,`month`,`year`),
  ADD KEY `idx_employee_month_year` (`employee_code`,`month`,`year`),
  ADD KEY `idx_approval_status` (`approval_status`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `tier2_provider_id` (`tier2_provider_id`),
  ADD KEY `idx_employment_category` (`employment_category`),
  ADD KEY `idx_tier2_provider` (`tier2_provider_id`),
  ADD KEY `idx_payroll_rates` (`rate_ssnit_tier1_employer`,`rate_ssnit_tier2`,`rate_getfund`,`rate_nhil`);

--
-- Indexes for table `pension_tier2_providers`
--
ALTER TABLE `pension_tier2_providers`
  ADD PRIMARY KEY (`provider_id`),
  ADD UNIQUE KEY `provider_code` (`provider_code`),
  ADD KEY `is_active` (`is_active`);

--
-- Indexes for table `permission_modules`
--
ALTER TABLE `permission_modules`
  ADD PRIMARY KEY (`module_id`),
  ADD UNIQUE KEY `unique_module_name` (`module_name`);

--
-- Indexes for table `portfolio_aggregates`
--
ALTER TABLE `portfolio_aggregates`
  ADD PRIMARY KEY (`aggregate_id`),
  ADD UNIQUE KEY `unique_student_subject_term` (`student_id`,`subject_id`,`year`,`term`,`semester`),
  ADD KEY `idx_student_term` (`student_id`,`year`,`term`),
  ADD KEY `idx_subject` (`subject_id`),
  ADD KEY `idx_aggregate_class_year_term` (`class_id`,`year`,`term`);

--
-- Indexes for table `portfolio_assessment`
--
ALTER TABLE `portfolio_assessment`
  ADD PRIMARY KEY (`assessment_id`),
  ADD UNIQUE KEY `assessment_id` (`assessment_id`);

--
-- Indexes for table `portfolio_audit_trail`
--
ALTER TABLE `portfolio_audit_trail`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_action` (`action_type`,`created_at`);

--
-- Indexes for table `portfolio_headers`
--
ALTER TABLE `portfolio_headers`
  ADD PRIMARY KEY (`header_id`),
  ADD KEY `idx_class_subject` (`class_id`,`subject_id`,`year`,`term`),
  ADD KEY `idx_teacher` (`teacher_id`),
  ADD KEY `idx_week` (`week_number`,`term`,`year`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `idx_strand` (`strand_id`),
  ADD KEY `idx_sub_strand` (`sub_strand_id`),
  ADD KEY `idx_indicator` (`indicator_id`),
  ADD KEY `idx_portfolio_class_year_term` (`class_id`,`year`,`term`);

--
-- Indexes for table `portfolio_scores`
--
ALTER TABLE `portfolio_scores`
  ADD PRIMARY KEY (`score_id`),
  ADD UNIQUE KEY `unique_student_header` (`header_id`,`student_id`,`deleted_at`),
  ADD KEY `idx_student` (`student_id`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `project_file`
--
ALTER TABLE `project_file`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pro_expenses`
--
ALTER TABLE `pro_expenses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pro_notes`
--
ALTER TABLE `pro_notes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pro_task`
--
ALTER TABLE `pro_task`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pro_task_assets`
--
ALTER TABLE `pro_task_assets`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `question_bank`
--
ALTER TABLE `question_bank`
  ADD PRIMARY KEY (`question_bank_id`);

--
-- Indexes for table `question_paper`
--
ALTER TABLE `question_paper`
  ADD PRIMARY KEY (`question_paper_id`);

--
-- Indexes for table `raw_score_grade`
--
ALTER TABLE `raw_score_grade`
  ADD PRIMARY KEY (`grade_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `receipts`
--
ALTER TABLE `receipts`
  ADD PRIMARY KEY (`receipt_id`),
  ADD UNIQUE KEY `receipt_number` (`receipt_number`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `receipt_modification_audit`
--
ALTER TABLE `receipt_modification_audit`
  ADD PRIMARY KEY (`audit_id`),
  ADD KEY `idx_request` (`request_id`),
  ADD KEY `idx_payment` (`payment_id`),
  ADD KEY `idx_audit_date` (`performed_at`),
  ADD KEY `idx_audit_receipt_code` (`receipt_code`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `receipt_modification_requests`
--
ALTER TABLE `receipt_modification_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `idx_payment` (`payment_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_requested_by` (`requested_by`),
  ADD KEY `idx_pending_requests` (`status`,`requested_at`),
  ADD KEY `idx_status_revoked` (`status`,`revoked_at`),
  ADD KEY `idx_receipt_code` (`receipt_code`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `reconciliation_items`
--
ALTER TABLE `reconciliation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reconciliation_id` (`reconciliation_id`),
  ADD KEY `transaction_type` (`transaction_type`),
  ADD KEY `matched` (`matched`);

--
-- Indexes for table `religion`
--
ALTER TABLE `religion`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `request`
--
ALTER TABLE `request`
  ADD PRIMARY KEY (`request_id`);

--
-- Indexes for table `result_approval_audit`
--
ALTER TABLE `result_approval_audit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_approval_status` (`approval_status_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_performed_by` (`performed_by`);

--
-- Indexes for table `result_approval_status`
--
ALTER TABLE `result_approval_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_class_year_term` (`class_id`,`academic_year`,`term`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_class_year_term` (`class_id`,`academic_year`,`term`);

--
-- Indexes for table `salary_type`
--
ALTER TABLE `salary_type`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sba_components`
--
ALTER TABLE `sba_components`
  ADD PRIMARY KEY (`component_id`),
  ADD UNIQUE KEY `unique_student_subject_sba` (`student_id`,`subject_id`,`year`,`term`,`semester`),
  ADD KEY `idx_student_sba` (`student_id`,`year`,`term`),
  ADD KEY `subject_id` (`subject_id`),
  ADD KEY `idx_weight_config` (`weight_config_id`),
  ADD KEY `idx_sba_class_year_term` (`class_id`,`year`,`term`);

--
-- Indexes for table `sba_score_sources`
--
ALTER TABLE `sba_score_sources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sba_component` (`sba_component_id`),
  ADD KEY `idx_source_type` (`source_type`),
  ADD KEY `idx_computed_by` (`computed_by`);

--
-- Indexes for table `sba_weight_config`
--
ALTER TABLE `sba_weight_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_config` (`academic_year`,`term`,`class_category`,`deleted_at`),
  ADD KEY `idx_year_term` (`academic_year`,`term`),
  ADD KEY `idx_category` (`class_category`);

--
-- Indexes for table `section`
--
ALTER TABLE `section`
  ADD PRIMARY KEY (`section_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `sems`
--
ALTER TABLE `sems`
  ADD PRIMARY KEY (`sem_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`settings_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `settings_audit`
--
ALTER TABLE `settings_audit`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_setting_type` (`setting_type`),
  ADD KEY `idx_changed_at` (`changed_at`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `sms_automations`
--
ALTER TABLE `sms_automations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `trigger_event` (`trigger_event`),
  ADD KEY `is_active` (`is_active`);

--
-- Indexes for table `sms_automation_logs`
--
ALTER TABLE `sms_automation_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `automation_id` (`automation_id`),
  ADD KEY `status` (`status`),
  ADD KEY `sent_at` (`sent_at`),
  ADD KEY `idx_automation_date` (`automation_id`,`sent_at`);

--
-- Indexes for table `sms_log`
--
ALTER TABLE `sms_log`
  ADD PRIMARY KEY (`sms_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `sms_logs`
--
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `phone` (`phone`),
  ADD KEY `type` (`type`),
  ADD KEY `status` (`status`),
  ADD KEY `sent_at` (`sent_at`);

--
-- Indexes for table `sms_schedules`
--
ALTER TABLE `sms_schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `idx_next_run` (`next_run`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `sms_templates`
--
ALTER TABLE `sms_templates`
  ADD PRIMARY KEY (`template_id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD KEY `idx_code` (`code`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `social_media`
--
ALTER TABLE `social_media`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `student`
--
ALTER TABLE `student`
  ADD PRIMARY KEY (`student_id`),
  ADD KEY `idx_first_name` (`first_name`),
  ADD KEY `idx_last_name` (`last_name`),
  ADD KEY `idx_ghana_card` (`ghana_card_id`),
  ADD KEY `idx_admission_date` (`admission_date`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_student_lookup` (`student_id`,`name`(100),`student_code`(50)),
  ADD KEY `idx_student_active_status` (`active_status`),
  ADD KEY `idx_student_mute` (`mute`),
  ADD KEY `idx_student_name` (`name`(50)),
  ADD KEY `idx_student_code` (`student_code`(20));

--
-- Indexes for table `student_credits`
--
ALTER TABLE `student_credits`
  ADD PRIMARY KEY (`credit_id`),
  ADD KEY `idx_student_active` (`student_id`,`status`),
  ADD KEY `idx_remaining` (`remaining_amount`),
  ADD KEY `idx_source_receipt` (`source_receipt_code`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `student_daily_fee_preferences`
--
ALTER TABLE `student_daily_fee_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `student_id` (`student_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `student_discount_assignments`
--
ALTER TABLE `student_discount_assignments`
  ADD PRIMARY KEY (`assignment_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `profile_id` (`profile_id`),
  ADD KEY `year_term` (`year`,`term`),
  ADD KEY `idx_student_year_term` (`student_id`,`year`,`term`,`is_active`),
  ADD KEY `idx_discount_method` (`discount_method`),
  ADD KEY `idx_status_pre` (`status`),
  ADD KEY `idx_created_by_pre` (`created_by`),
  ADD KEY `idx_profile_year_term` (`profile_id`,`year`,`term`,`is_active`),
  ADD KEY `idx_category_status` (`discount_category`,`status`,`is_active`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `student_ledger`
--
ALTER TABLE `student_ledger`
  ADD PRIMARY KEY (`ledger_id`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_date` (`transaction_date`),
  ADD KEY `idx_type` (`transaction_type`),
  ADD KEY `idx_year_term` (`year`,`term`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `subject`
--
ALTER TABLE `subject`
  ADD PRIMARY KEY (`subject_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_subject_class` (`class_id`);

--
-- Indexes for table `subject_category_creche`
--
ALTER TABLE `subject_category_creche`
  ADD PRIMARY KEY (`category_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `subject_creche`
--
ALTER TABLE `subject_creche`
  ADD PRIMARY KEY (`subject_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `sync_audit_log`
--
ALTER TABLE `sync_audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_table_record` (`table_name`,`record_id`),
  ADD KEY `idx_device` (`source_device_id`),
  ADD KEY `idx_synced_at` (`synced_at`),
  ADD KEY `idx_operation` (`operation`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_direction` (`sync_direction`),
  ADD KEY `idx_config_key` (`config_key`);

--
-- Indexes for table `sync_config`
--
ALTER TABLE `sync_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `config_key` (`config_key`);

--
-- Indexes for table `sync_conflicts`
--
ALTER TABLE `sync_conflicts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_table_record` (`table_name`,`record_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_local_device` (`local_device_id`),
  ADD KEY `idx_remote_device` (`remote_device_id`);

--
-- Indexes for table `sync_deletions`
--
ALTER TABLE `sync_deletions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_status_table` (`sync_status`,`table_name`),
  ADD KEY `idx_table_deleted_at` (`table_name`,`deleted_at`),
  ADD KEY `idx_device_id` (`device_id`),
  ADD KEY `idx_deleted_at` (`deleted_at`);

--
-- Indexes for table `sync_devices`
--
ALTER TABLE `sync_devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `device_id` (`device_id`),
  ADD KEY `idx_device_id` (`device_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `sync_failures`
--
ALTER TABLE `sync_failures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_table_operation` (`table_name`,`operation`) COMMENT 'Query failures by table and operation type',
  ADD KEY `idx_timestamp` (`timestamp`) COMMENT 'Query recent failures by time',
  ADD KEY `idx_resolved` (`resolved`) COMMENT 'Filter unresolved failures for retry';

--
-- Indexes for table `sync_log`
--
ALTER TABLE `sync_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sync_type` (`sync_type`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `sync_metadata`
--
ALTER TABLE `sync_metadata`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `table_name` (`table_name`),
  ADD KEY `idx_sync_order` (`sync_order`);

--
-- Indexes for table `sync_metrics`
--
ALTER TABLE `sync_metrics`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_metric_name` (`metric_name`),
  ADD KEY `idx_recorded_at` (`recorded_at`),
  ADD KEY `idx_location` (`location_id`),
  ADD KEY `idx_table` (`table_name`),
  ADD KEY `idx_records_synced` (`records_synced`);

--
-- Indexes for table `sync_notifications`
--
ALTER TABLE `sync_notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `sync_queue`
--
ALTER TABLE `sync_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `synced` (`synced`),
  ADD KEY `timestamp` (`timestamp`);

--
-- Indexes for table `sync_settings`
--
ALTER TABLE `sync_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_setting_key` (`setting_key`);

--
-- Indexes for table `tax_brackets`
--
ALTER TABLE `tax_brackets`
  ADD PRIMARY KEY (`bracket_id`),
  ADD KEY `idx_effective_dates` (`effective_from`,`effective_to`),
  ADD KEY `idx_active` (`is_active`);

--
-- Indexes for table `teacher`
--
ALTER TABLE `teacher`
  ADD PRIMARY KEY (`teacher_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `tier2_provider_id` (`tier2_provider_id`);

--
-- Indexes for table `teacher_privileges`
--
ALTER TABLE `teacher_privileges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_active_privilege` (`teacher_id`,`privilege_type`,`status`),
  ADD KEY `idx_teacher_id` (`teacher_id`),
  ADD KEY `idx_privilege_type` (`privilege_type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_granted_at` (`granted_at`),
  ADD KEY `fk_teacher_privileges_granted_by` (`granted_by`),
  ADD KEY `fk_teacher_privileges_revoked_by` (`revoked_by`);

--
-- Indexes for table `teacher_remarks_templates`
--
ALTER TABLE `teacher_remarks_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_active_order` (`is_active`,`display_order`),
  ADD KEY `idx_category` (`category`);

--
-- Indexes for table `teaching_resources_master`
--
ALTER TABLE `teaching_resources_master`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `terminal_reports`
--
ALTER TABLE `terminal_reports`
  ADD PRIMARY KEY (`report_id`),
  ADD UNIQUE KEY `unique_student_year_term` (`student_id`,`year`,`term`),
  ADD KEY `idx_student` (`student_id`),
  ADD KEY `idx_year_term` (`year`,`term`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `terms`
--
ALTER TABLE `terms`
  ADD PRIMARY KEY (`term_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `tier2_providers`
--
ALTER TABLE `tier2_providers`
  ADD PRIMARY KEY (`provider_id`),
  ADD UNIQUE KEY `provider_code` (`provider_code`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_provider_code` (`provider_code`);

--
-- Indexes for table `to_do_list`
--
ALTER TABLE `to_do_list`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transport`
--
ALTER TABLE `transport`
  ADD PRIMARY KEY (`transport_id`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`),
  ADD KEY `idx_driver_id` (`driver_id`);

--
-- Indexes for table `transport_auto_billing`
--
ALTER TABLE `transport_auto_billing`
  ADD PRIMARY KEY (`billing_id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `billing_date` (`billing_date`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `transport_daily_log`
--
ALTER TABLE `transport_daily_log`
  ADD PRIMARY KEY (`log_id`),
  ADD UNIQUE KEY `student_date` (`student_id`,`log_date`),
  ADD KEY `log_date` (`log_date`),
  ADD KEY `idx_sync_status` (`sync_status`),
  ADD KEY `idx_last_modified` (`last_modified_at`);

--
-- Indexes for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD PRIMARY KEY (`preference_id`),
  ADD UNIQUE KEY `uk_user_id` (`user_id`);

--
-- Indexes for table `user_permission`
--
ALTER TABLE `user_permission`
  ADD PRIMARY KEY (`permission_id`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`permission_id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `user_type` (`user_type`),
  ADD KEY `module_name` (`module_name`),
  ADD KEY `status` (`status`),
  ADD KEY `idx_user_module_permission` (`user_id`,`user_type`,`module_name`,`permission_type`,`status`);

--
-- Indexes for table `visitor_tracker`
--
ALTER TABLE `visitor_tracker`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `waec_grading_scale`
--
ALTER TABLE `waec_grading_scale`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `water_charge_log`
--
ALTER TABLE `water_charge_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`,`week_start_date`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `academic_syllabus`
--
ALTER TABLE `academic_syllabus`
  MODIFY `academic_syllabus_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `accountant`
--
ALTER TABLE `accountant`
  MODIFY `accountant_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `account_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `accounts_payable`
--
ALTER TABLE `accounts_payable`
  MODIFY `accounts_payable_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `account_type`
--
ALTER TABLE `account_type`
  MODIFY `account_type_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `addition`
--
ALTER TABLE `addition`
  MODIFY `addi_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `admin_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `admission_category`
--
ALTER TABLE `admission_category`
  MODIFY `admission_category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `admission_logs`
--
ALTER TABLE `admission_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `aggregation`
--
ALTER TABLE `aggregation`
  MODIFY `aggregate_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=485;

--
-- AUTO_INCREMENT for table `aging_report_snapshots`
--
ALTER TABLE `aging_report_snapshots`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `alumni`
--
ALTER TABLE `alumni`
  MODIFY `alumni_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `approval_requests`
--
ALTER TABLE `approval_requests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assessment_methods_master`
--
ALTER TABLE `assessment_methods_master`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `ass_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assets_category`
--
ALTER TABLE `assets_category`
  MODIFY `cat_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assign_leave`
--
ALTER TABLE `assign_leave`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `assign_task`
--
ALTER TABLE `assign_task`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `attendance_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=46011;

--
-- AUTO_INCREMENT for table `attendance_billing_log`
--
ALTER TABLE `attendance_billing_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `log_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'Primary key for audit log entries';

--
-- AUTO_INCREMENT for table `audit_trail`
--
ALTER TABLE `audit_trail`
  MODIFY `audit_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=551;

--
-- AUTO_INCREMENT for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  MODIFY `bank_account_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_reconciliations`
--
ALTER TABLE `bank_reconciliations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  MODIFY `transaction_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `beneficiary_list`
--
ALTER TABLE `beneficiary_list`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `benefit_category`
--
ALTER TABLE `benefit_category`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `billing_history`
--
ALTER TABLE `billing_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bill_category`
--
ALTER TABLE `bill_category`
  MODIFY `bill_category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `bill_item`
--
ALTER TABLE `bill_item`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `bill_item_history`
--
ALTER TABLE `bill_item_history`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=161;

--
-- AUTO_INCREMENT for table `blood_group`
--
ALTER TABLE `blood_group`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `boarding_bed`
--
ALTER TABLE `boarding_bed`
  MODIFY `bed_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `boarding_dormitory`
--
ALTER TABLE `boarding_dormitory`
  MODIFY `dormitory_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `boarding_house`
--
ALTER TABLE `boarding_house`
  MODIFY `house_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `book`
--
ALTER TABLE `book`
  MODIFY `book_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `book_request`
--
ALTER TABLE `book_request`
  MODIFY `book_request_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `budget_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `budget_lines`
--
ALTER TABLE `budget_lines`
  MODIFY `budget_line_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `budget_utilization_log`
--
ALTER TABLE `budget_utilization_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `bus_attendance`
--
ALTER TABLE `bus_attendance`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `chart_of_accounts`
--
ALTER TABLE `chart_of_accounts`
  MODIFY `account_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=111;

--
-- AUTO_INCREMENT for table `class`
--
ALTER TABLE `class`
  MODIFY `class_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `class_routine`
--
ALTER TABLE `class_routine`
  MODIFY `class_routine_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conduct_items`
--
ALTER TABLE `conduct_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `core_competencies`
--
ALTER TABLE `core_competencies`
  MODIFY `competency_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `credit_applications`
--
ALTER TABLE `credit_applications`
  MODIFY `application_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `credit_notes`
--
ALTER TABLE `credit_notes`
  MODIFY `credit_note_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `credit_system_logs`
--
ALTER TABLE `credit_system_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `curriculum_content_standards`
--
ALTER TABLE `curriculum_content_standards`
  MODIFY `content_standard_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `curriculum_indicators`
--
ALTER TABLE `curriculum_indicators`
  MODIFY `indicator_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `curriculum_learning_indicators`
--
ALTER TABLE `curriculum_learning_indicators`
  MODIFY `indicator_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `curriculum_strands`
--
ALTER TABLE `curriculum_strands`
  MODIFY `strand_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `curriculum_sub_strands`
--
ALTER TABLE `curriculum_sub_strands`
  MODIFY `sub_strand_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `daily_charge_log`
--
ALTER TABLE `daily_charge_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `daily_fee_audit_log`
--
ALTER TABLE `daily_fee_audit_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=148;

--
-- AUTO_INCREMENT for table `daily_fee_rates`
--
ALTER TABLE `daily_fee_rates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- AUTO_INCREMENT for table `daily_fee_transactions`
--
ALTER TABLE `daily_fee_transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `daily_fee_wallet`
--
ALTER TABLE `daily_fee_wallet`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `daily_transport_choices`
--
ALTER TABLE `daily_transport_choices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `department`
--
ALTER TABLE `department`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `desciplinary`
--
ALTER TABLE `desciplinary`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `designation`
--
ALTER TABLE `designation`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discount_applications`
--
ALTER TABLE `discount_applications`
  MODIFY `application_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1258;

--
-- AUTO_INCREMENT for table `discount_approvals`
--
ALTER TABLE `discount_approvals`
  MODIFY `approval_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discount_audit_log`
--
ALTER TABLE `discount_audit_log`
  MODIFY `audit_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discount_audit_trail`
--
ALTER TABLE `discount_audit_trail`
  MODIFY `audit_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `discount_categories`
--
ALTER TABLE `discount_categories`
  MODIFY `category_id` tinyint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `discount_profiles`
--
ALTER TABLE `discount_profiles`
  MODIFY `profile_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `discount_profile_rules`
--
ALTER TABLE `discount_profile_rules`
  MODIFY `rule_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `discount_summary_cache`
--
ALTER TABLE `discount_summary_cache`
  MODIFY `cache_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document`
--
ALTER TABLE `document`
  MODIFY `document_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=255;

--
-- AUTO_INCREMENT for table `dormitory`
--
ALTER TABLE `dormitory`
  MODIFY `dormitory_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `earned_leave`
--
ALTER TABLE `earned_leave`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `education`
--
ALTER TABLE `education`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `email_log`
--
ALTER TABLE `email_log`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee`
--
ALTER TABLE `employee`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `employee_file`
--
ALTER TABLE `employee_file`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_address`
--
ALTER TABLE `emp_address`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_assets`
--
ALTER TABLE `emp_assets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_attendance`
--
ALTER TABLE `emp_attendance`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_bank_info`
--
ALTER TABLE `emp_bank_info`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_experience`
--
ALTER TABLE `emp_experience`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_leave`
--
ALTER TABLE `emp_leave`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_penalty`
--
ALTER TABLE `emp_penalty`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `emp_salary`
--
ALTER TABLE `emp_salary`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enroll`
--
ALTER TABLE `enroll`
  MODIFY `enroll_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2778;

--
-- AUTO_INCREMENT for table `enterprise_exams`
--
ALTER TABLE `enterprise_exams`
  MODIFY `exam_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enterprise_exam_subjects`
--
ALTER TABLE `enterprise_exam_subjects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enterprise_student_marks`
--
ALTER TABLE `enterprise_student_marks`
  MODIFY `mark_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `enterprise_terminal_reports`
--
ALTER TABLE `enterprise_terminal_reports`
  MODIFY `report_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `exam`
--
ALTER TABLE `exam`
  MODIFY `exam_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `exam_category`
--
ALTER TABLE `exam_category`
  MODIFY `category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `exam_marks`
--
ALTER TABLE `exam_marks`
  MODIFY `mark_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expenses_enhanced`
--
ALTER TABLE `expenses_enhanced`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `expense_categories_enhanced`
--
ALTER TABLE `expense_categories_enhanced`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `expense_category`
--
ALTER TABLE `expense_category`
  MODIFY `expense_category_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `fee_collection_assignments`
--
ALTER TABLE `fee_collection_assignments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `fee_collection_modes`
--
ALTER TABLE `fee_collection_modes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `fee_structures`
--
ALTER TABLE `fee_structures`
  MODIFY `structure_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `field_visit`
--
ALTER TABLE `field_visit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `finance_audit_trail`
--
ALTER TABLE `finance_audit_trail`
  MODIFY `audit_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `finance_dashboard_cache`
--
ALTER TABLE `finance_dashboard_cache`
  MODIFY `cache_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_alert_resolutions`
--
ALTER TABLE `financial_alert_resolutions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_analytics_cache`
--
ALTER TABLE `financial_analytics_cache`
  MODIFY `cache_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_audit_trail`
--
ALTER TABLE `financial_audit_trail`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `financial_integration_log`
--
ALTER TABLE `financial_integration_log`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19844;

--
-- AUTO_INCREMENT for table `financial_reports_cache`
--
ALTER TABLE `financial_reports_cache`
  MODIFY `cache_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fiscal_periods`
--
ALTER TABLE `fiscal_periods`
  MODIFY `period_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fiscal_years`
--
ALTER TABLE `fiscal_years`
  MODIFY `fiscal_year_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `flutter_user`
--
ALTER TABLE `flutter_user`
  MODIFY `flutter_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `form_field_preferences`
--
ALTER TABLE `form_field_preferences`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `frontend_events`
--
ALTER TABLE `frontend_events`
  MODIFY `frontend_events_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `frontend_gallery`
--
ALTER TABLE `frontend_gallery`
  MODIFY `frontend_gallery_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `frontend_gallery_image`
--
ALTER TABLE `frontend_gallery_image`
  MODIFY `frontend_gallery_image_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `frontend_general_settings`
--
ALTER TABLE `frontend_general_settings`
  MODIFY `frontend_general_settings_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `frontend_news`
--
ALTER TABLE `frontend_news`
  MODIFY `frontend_news_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grade`
--
ALTER TABLE `grade`
  MODIFY `grade_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `grade_2`
--
ALTER TABLE `grade_2`
  MODIFY `grade_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `grade_creche`
--
ALTER TABLE `grade_creche`
  MODIFY `grade_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `group_message`
--
ALTER TABLE `group_message`
  MODIFY `group_message_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_message_other`
--
ALTER TABLE `group_message_other`
  MODIFY `member_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_message_thread`
--
ALTER TABLE `group_message_thread`
  MODIFY `group_message_thread_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `head_teacher_remarks_ranges`
--
ALTER TABLE `head_teacher_remarks_ranges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `hod_subjects`
--
ALTER TABLE `hod_subjects`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `holiday`
--
ALTER TABLE `holiday`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hubtel_transaction_logs`
--
ALTER TABLE `hubtel_transaction_logs`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `incomplete_fee_transactions`
--
ALTER TABLE `incomplete_fee_transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `interest_items`
--
ALTER TABLE `interest_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `inventory_audit_log`
--
ALTER TABLE `inventory_audit_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `inventory_categories`
--
ALTER TABLE `inventory_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `inventory_locations`
--
ALTER TABLE `inventory_locations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inventory_products`
--
ALTER TABLE `inventory_products`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `inventory_purchases`
--
ALTER TABLE `inventory_purchases`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory_purchase_items`
--
ALTER TABLE `inventory_purchase_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `inventory_purchase_payments`
--
ALTER TABLE `inventory_purchase_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `inventory_returns`
--
ALTER TABLE `inventory_returns`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inventory_return_items`
--
ALTER TABLE `inventory_return_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `inventory_sales`
--
ALTER TABLE `inventory_sales`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inventory_sale_items`
--
ALTER TABLE `inventory_sale_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `inventory_stock_movements`
--
ALTER TABLE `inventory_stock_movements`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=105;

--
-- AUTO_INCREMENT for table `inventory_suppliers`
--
ALTER TABLE `inventory_suppliers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `invoice`
--
ALTER TABLE `invoice`
  MODIFY `invoice_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4540;

--
-- AUTO_INCREMENT for table `invoice_access_tokens`
--
ALTER TABLE `invoice_access_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_discounts`
--
ALTER TABLE `invoice_discounts`
  MODIFY `discount_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=230;

--
-- AUTO_INCREMENT for table `invoice_discount_items`
--
ALTER TABLE `invoice_discount_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=286;

--
-- AUTO_INCREMENT for table `invoice_modification_requests`
--
ALTER TABLE `invoice_modification_requests`
  MODIFY `request_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `invoice_payment_audit_log`
--
ALTER TABLE `invoice_payment_audit_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_payment_links`
--
ALTER TABLE `invoice_payment_links`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_sms_log`
--
ALTER TABLE `invoice_sms_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `entry_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142016;

--
-- AUTO_INCREMENT for table `journal_entry_lines`
--
ALTER TABLE `journal_entry_lines`
  MODIFY `line_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=284023;

--
-- AUTO_INCREMENT for table `language`
--
ALTER TABLE `language`
  MODIFY `phrase_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=578;

--
-- AUTO_INCREMENT for table `late_payment_settings`
--
ALTER TABLE `late_payment_settings`
  MODIFY `setting_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `leave_types`
--
ALTER TABLE `leave_types`
  MODIFY `type_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_notes`
--
ALTER TABLE `lesson_notes`
  MODIFY `lesson_note_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_note_assessments`
--
ALTER TABLE `lesson_note_assessments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_note_competencies`
--
ALTER TABLE `lesson_note_competencies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_note_indicators`
--
ALTER TABLE `lesson_note_indicators`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_note_notifications`
--
ALTER TABLE `lesson_note_notifications`
  MODIFY `notification_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_note_references`
--
ALTER TABLE `lesson_note_references`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_note_resources`
--
ALTER TABLE `lesson_note_resources`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lesson_note_revisions`
--
ALTER TABLE `lesson_note_revisions`
  MODIFY `revision_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `librarian`
--
ALTER TABLE `librarian`
  MODIFY `librarian_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `loan`
--
ALTER TABLE `loan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `loan_installment`
--
ALTER TABLE `loan_installment`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `location_registry`
--
ALTER TABLE `location_registry`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `logistic_asset`
--
ALTER TABLE `logistic_asset`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `logistic_assign`
--
ALTER TABLE `logistic_assign`
  MODIFY `ass_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mark`
--
ALTER TABLE `mark`
  MODIFY `mark_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3736;

--
-- AUTO_INCREMENT for table `message`
--
ALTER TABLE `message`
  MODIFY `message_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `message_thread`
--
ALTER TABLE `message_thread`
  MODIFY `message_thread_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `mobile_money_payment`
--
ALTER TABLE `mobile_money_payment`
  MODIFY `mo_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `non_teaching_staff`
--
ALTER TABLE `non_teaching_staff`
  MODIFY `staff_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key for non-teaching staff';

--
-- AUTO_INCREMENT for table `notice`
--
ALTER TABLE `notice`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `noticeboard`
--
ALTER TABLE `noticeboard`
  MODIFY `notice_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `notification_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=680;

--
-- AUTO_INCREMENT for table `notification_delivery_log`
--
ALTER TABLE `notification_delivery_log`
  MODIFY `log_id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `online_exam`
--
ALTER TABLE `online_exam`
  MODIFY `online_exam_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `online_exam_result`
--
ALTER TABLE `online_exam_result`
  MODIFY `online_exam_result_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `parent`
--
ALTER TABLE `parent`
  MODIFY `parent_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=852;

--
-- AUTO_INCREMENT for table `payment`
--
ALTER TABLE `payment`
  MODIFY `payment_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2166;

--
-- AUTO_INCREMENT for table `payment_installments`
--
ALTER TABLE `payment_installments`
  MODIFY `installment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_methods`
--
ALTER TABLE `payment_methods`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `payment_plans`
--
ALTER TABLE `payment_plans`
  MODIFY `plan_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payment_transactions`
--
ALTER TABLE `payment_transactions`
  MODIFY `transaction_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll_approvals`
--
ALTER TABLE `payroll_approvals`
  MODIFY `approval_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key for approval records';

--
-- AUTO_INCREMENT for table `payroll_audit_enhanced`
--
ALTER TABLE `payroll_audit_enhanced`
  MODIFY `audit_id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `payroll_form_field_preferences`
--
ALTER TABLE `payroll_form_field_preferences`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll_statutory_settings`
--
ALTER TABLE `payroll_statutory_settings`
  MODIFY `setting_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `payroll_statutory_settings_log`
--
ALTER TABLE `payroll_statutory_settings_log`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `pay_salary`
--
ALTER TABLE `pay_salary`
  MODIFY `pay_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `pension_tier2_providers`
--
ALTER TABLE `pension_tier2_providers`
  MODIFY `provider_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `permission_modules`
--
ALTER TABLE `permission_modules`
  MODIFY `module_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `portfolio_aggregates`
--
ALTER TABLE `portfolio_aggregates`
  MODIFY `aggregate_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portfolio_assessment`
--
ALTER TABLE `portfolio_assessment`
  MODIFY `assessment_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portfolio_audit_trail`
--
ALTER TABLE `portfolio_audit_trail`
  MODIFY `audit_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portfolio_headers`
--
ALTER TABLE `portfolio_headers`
  MODIFY `header_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `portfolio_scores`
--
ALTER TABLE `portfolio_scores`
  MODIFY `score_id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `project_file`
--
ALTER TABLE `project_file`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pro_expenses`
--
ALTER TABLE `pro_expenses`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pro_notes`
--
ALTER TABLE `pro_notes`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pro_task`
--
ALTER TABLE `pro_task`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pro_task_assets`
--
ALTER TABLE `pro_task_assets`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_bank`
--
ALTER TABLE `question_bank`
  MODIFY `question_bank_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `question_paper`
--
ALTER TABLE `question_paper`
  MODIFY `question_paper_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `raw_score_grade`
--
ALTER TABLE `raw_score_grade`
  MODIFY `grade_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `receipts`
--
ALTER TABLE `receipts`
  MODIFY `receipt_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `receipt_modification_audit`
--
ALTER TABLE `receipt_modification_audit`
  MODIFY `audit_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `receipt_modification_requests`
--
ALTER TABLE `receipt_modification_requests`
  MODIFY `request_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `reconciliation_items`
--
ALTER TABLE `reconciliation_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `religion`
--
ALTER TABLE `religion`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `request`
--
ALTER TABLE `request`
  MODIFY `request_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `result_approval_audit`
--
ALTER TABLE `result_approval_audit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `result_approval_status`
--
ALTER TABLE `result_approval_status`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `salary_type`
--
ALTER TABLE `salary_type`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sba_components`
--
ALTER TABLE `sba_components`
  MODIFY `component_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sba_score_sources`
--
ALTER TABLE `sba_score_sources`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sba_weight_config`
--
ALTER TABLE `sba_weight_config`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `section`
--
ALTER TABLE `section`
  MODIFY `section_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `settings_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=456;

--
-- AUTO_INCREMENT for table `settings_audit`
--
ALTER TABLE `settings_audit`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_automations`
--
ALTER TABLE `sms_automations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `sms_automation_logs`
--
ALTER TABLE `sms_automation_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_log`
--
ALTER TABLE `sms_log`
  MODIFY `sms_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_logs`
--
ALTER TABLE `sms_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_schedules`
--
ALTER TABLE `sms_schedules`
  MODIFY `schedule_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sms_templates`
--
ALTER TABLE `sms_templates`
  MODIFY `template_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student`
--
ALTER TABLE `student`
  MODIFY `student_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=769;

--
-- AUTO_INCREMENT for table `student_credits`
--
ALTER TABLE `student_credits`
  MODIFY `credit_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `student_daily_fee_preferences`
--
ALTER TABLE `student_daily_fee_preferences`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `student_discount_assignments`
--
ALTER TABLE `student_discount_assignments`
  MODIFY `assignment_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=180;

--
-- AUTO_INCREMENT for table `student_ledger`
--
ALTER TABLE `student_ledger`
  MODIFY `ledger_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5011;

--
-- AUTO_INCREMENT for table `subject`
--
ALTER TABLE `subject`
  MODIFY `subject_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=351;

--
-- AUTO_INCREMENT for table `subject_creche`
--
ALTER TABLE `subject_creche`
  MODIFY `subject_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_audit_log`
--
ALTER TABLE `sync_audit_log`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_config`
--
ALTER TABLE `sync_config`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `sync_conflicts`
--
ALTER TABLE `sync_conflicts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_deletions`
--
ALTER TABLE `sync_deletions`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key';

--
-- AUTO_INCREMENT for table `sync_devices`
--
ALTER TABLE `sync_devices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_failures`
--
ALTER TABLE `sync_failures`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_log`
--
ALTER TABLE `sync_log`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_metadata`
--
ALTER TABLE `sync_metadata`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_metrics`
--
ALTER TABLE `sync_metrics`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_notifications`
--
ALTER TABLE `sync_notifications`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_queue`
--
ALTER TABLE `sync_queue`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sync_settings`
--
ALTER TABLE `sync_settings`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `tax_brackets`
--
ALTER TABLE `tax_brackets`
  MODIFY `bracket_id` int NOT NULL AUTO_INCREMENT COMMENT 'Primary key for tax bracket records', AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `teacher`
--
ALTER TABLE `teacher`
  MODIFY `teacher_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `teacher_privileges`
--
ALTER TABLE `teacher_privileges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `teacher_remarks_templates`
--
ALTER TABLE `teacher_remarks_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `teaching_resources_master`
--
ALTER TABLE `teaching_resources_master`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `terminal_reports`
--
ALTER TABLE `terminal_reports`
  MODIFY `report_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `terms`
--
ALTER TABLE `terms`
  MODIFY `term_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tier2_providers`
--
ALTER TABLE `tier2_providers`
  MODIFY `provider_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transport`
--
ALTER TABLE `transport`
  MODIFY `transport_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `transport_auto_billing`
--
ALTER TABLE `transport_auto_billing`
  MODIFY `billing_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `transport_daily_log`
--
ALTER TABLE `transport_daily_log`
  MODIFY `log_id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  MODIFY `preference_id` int UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_permission`
--
ALTER TABLE `user_permission`
  MODIFY `permission_id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `permission_id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `waec_grading_scale`
--
ALTER TABLE `waec_grading_scale`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `water_charge_log`
--
ALTER TABLE `water_charge_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

-- --------------------------------------------------------

--
-- Structure for view `invoice_summary`
--
DROP TABLE IF EXISTS `invoice_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=CURRENT_USER SQL SECURITY DEFINER VIEW `invoice_summary`  AS SELECT `i`.`student_id` AS `student_id`, `i`.`invoice_code` AS `invoice_code`, `i`.`year` AS `year`, `i`.`term` AS `term`, `s`.`name` AS `student_name`, `s`.`student_code` AS `student_code`, `c`.`name` AS `class_name`, sum(`i`.`amount`) AS `total_amount`, sum(`i`.`amount_paid`) AS `total_paid`, sum(`i`.`due`) AS `total_due`, coalesce((select `d`.`discount_amount` from `invoice_discounts` `d` where ((`d`.`student_id` = `i`.`student_id`) and (`d`.`invoice_code` = `i`.`invoice_code`) and (`d`.`status` = 'approved')) limit 1),0) AS `total_discount`, count(distinct `i`.`invoice_id`) AS `item_count`, min(`i`.`creation_timestamp`) AS `invoice_date`, max(`i`.`payment_timestamp`) AS `last_payment_date`, (case when (sum(`i`.`due`) = 0) then 'paid' when sum(`i`.`amount_paid`) then 'partial' else 'unpaid' end) AS `payment_status` FROM (((`invoice` `i` left join `student` `s` on((`i`.`student_id` = `s`.`student_id`))) left join `enroll` `e` on(((`s`.`student_id` = `e`.`student_id`) and (`i`.`year` = `e`.`year`) and (`i`.`term` = `e`.`term`)))) left join `class` `c` on((`e`.`class_id` = `c`.`class_id`))) GROUP BY `i`.`student_id`, `i`.`invoice_code`, `i`.`year`, `i`.`term`, `s`.`name`, `s`.`student_code`, `c`.`name` ;

-- --------------------------------------------------------

--
-- Structure for view `pending_approvals_view`
--
DROP TABLE IF EXISTS `pending_approvals_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=CURRENT_USER SQL SECURITY DEFINER VIEW `pending_approvals_view`  AS SELECT `ar`.`id` AS `id`, `ar`.`request_type` AS `request_type`, `ar`.`record_type` AS `record_type`, `ar`.`record_id` AS `record_id`, `ar`.`requested_at` AS `requested_at`, `ar`.`reason` AS `reason`, `ar`.`status` AS `status`, (case when `ar`.`requested_by` in (select `admin`.`admin_id` from `admin`) then (select `admin`.`name` from `admin` where (`admin`.`admin_id` = `ar`.`requested_by`)) when `ar`.`requested_by` in (select `teacher`.`teacher_id` from `teacher`) then (select `teacher`.`name` from `teacher` where (`teacher`.`teacher_id` = `ar`.`requested_by`)) else 'Unknown' end) AS `requested_by_name`, (case when (`ar`.`record_type` = 'invoice') then (select `invoice`.`invoice_code` from `invoice` where (`invoice`.`invoice_id` = `ar`.`record_id`)) when (`ar`.`record_type` = 'payment') then (select `payment`.`receipt_code` from `payment` where (`payment`.`payment_id` = `ar`.`record_id`)) end) AS `record_code`, (case when (`ar`.`record_type` = 'invoice') then (select `s`.`name` from (`invoice` `i` join `student` `s` on((`i`.`student_id` = `s`.`student_id`))) where (`i`.`invoice_id` = `ar`.`record_id`)) when (`ar`.`record_type` = 'payment') then (select `s`.`name` from (`payment` `p` join `student` `s` on((`p`.`student_id` = `s`.`student_id`))) where (`p`.`payment_id` = `ar`.`record_id`)) end) AS `student_name` FROM `approval_requests` AS `ar` WHERE (`ar`.`status` = 'pending') ORDER BY `ar`.`requested_at` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `portfolio_headers_with_curriculum`
--
DROP TABLE IF EXISTS `portfolio_headers_with_curriculum`;

CREATE ALGORITHM=UNDEFINED DEFINER=CURRENT_USER SQL SECURITY DEFINER VIEW `portfolio_headers_with_curriculum`  AS SELECT `ph`.`header_id` AS `header_id`, `ph`.`class_id` AS `class_id`, `ph`.`subject_id` AS `subject_id`, `ph`.`teacher_id` AS `teacher_id`, `ph`.`year` AS `year`, `ph`.`term` AS `term`, `ph`.`semester` AS `semester`, `ph`.`week_number` AS `week_number`, `ph`.`strand_topic` AS `strand_topic`, `ph`.`strand_id` AS `strand_id`, `ph`.`sub_strand_id` AS `sub_strand_id`, `ph`.`indicator_id` AS `indicator_id`, `ph`.`assessment_date` AS `assessment_date`, `ph`.`max_score` AS `max_score`, `ph`.`status` AS `status`, `ph`.`created_by` AS `created_by`, `ph`.`created_at` AS `created_at`, `ph`.`updated_at` AS `updated_at`, `ph`.`deleted_at` AS `deleted_at`, `cs`.`name` AS `strand_name`, `css`.`name` AS `sub_strand_name`, `ci`.`indicator_text` AS `indicator_text`, coalesce(concat(`cs`.`name`,' - ',`css`.`name`),`ph`.`strand_topic`) AS `full_curriculum_path` FROM (((`portfolio_headers` `ph` left join `curriculum_strands` `cs` on((`cs`.`strand_id` = `ph`.`strand_id`))) left join `curriculum_sub_strands` `css` on((`css`.`sub_strand_id` = `ph`.`sub_strand_id`))) left join `curriculum_indicators` `ci` on((`ci`.`indicator_id` = `ph`.`indicator_id`))) ;

-- --------------------------------------------------------

--
-- Structure for view `student_account_summary`
--
DROP TABLE IF EXISTS `student_account_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=CURRENT_USER SQL SECURITY DEFINER VIEW `student_account_summary`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`name` AS `student_name`, `s`.`parent_id` AS `parent_id`, `c`.`name` AS `class_name`, coalesce(sum(`i`.`amount`),0) AS `total_billed`, coalesce(sum(`i`.`amount_paid`),0) AS `total_paid`, coalesce(sum(`i`.`due`),0) AS `total_outstanding`, coalesce(sum((case when (`i`.`status` = 'paid') then `i`.`amount` else 0 end)),0) AS `fully_paid_amount`, coalesce(sum((case when (`i`.`status` = 'due') then `i`.`amount` else 0 end)),0) AS `unpaid_amount`, count(distinct `i`.`invoice_id`) AS `total_invoices`, `i`.`year` AS `year`, `i`.`term` AS `term` FROM (((`student` `s` left join `enroll` `e` on((`s`.`student_id` = `e`.`student_id`))) left join `class` `c` on((`e`.`class_id` = `c`.`class_id`))) left join `invoice` `i` on((`s`.`student_id` = `i`.`student_id`))) GROUP BY `s`.`student_id`, `i`.`year`, `i`.`term` ;

-- --------------------------------------------------------

--
-- Structure for view `student_credit_summary`
--
DROP TABLE IF EXISTS `student_credit_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=CURRENT_USER SQL SECURITY DEFINER VIEW `student_credit_summary`  AS SELECT `s`.`student_id` AS `student_id`, `s`.`name` AS `student_name`, coalesce(sum(`sc`.`remaining_amount`),0) AS `total_available_credit`, coalesce(sum(`sc`.`credit_amount`),0) AS `total_credits_earned`, coalesce(sum(`sc`.`applied_amount`),0) AS `total_credits_used`, count(`sc`.`credit_id`) AS `total_credit_records`, max(`sc`.`created_at`) AS `last_credit_date` FROM (`student` `s` left join `student_credits` `sc` on(((`s`.`student_id` = `sc`.`student_id`) and (`sc`.`status` = 'active')))) GROUP BY `s`.`student_id`, `s`.`name` ;

-- --------------------------------------------------------

--
-- Structure for view `v_expense_summary_by_category`
--
DROP TABLE IF EXISTS `v_expense_summary_by_category`;

CREATE ALGORITHM=UNDEFINED DEFINER=CURRENT_USER SQL SECURITY DEFINER VIEW `v_expense_summary_by_category`  AS SELECT `ec`.`name` AS `category_name`, count(`e`.`id`) AS `expense_count`, sum((case when (`e`.`status` = 'pending') then `e`.`amount` else 0 end)) AS `pending_amount`, sum((case when (`e`.`status` = 'approved') then `e`.`amount` else 0 end)) AS `approved_amount`, sum((case when (`e`.`status` = 'rejected') then `e`.`amount` else 0 end)) AS `rejected_amount`, sum(`e`.`amount`) AS `total_amount` FROM (`expense_categories_enhanced` `ec` left join `expenses_enhanced` `e` on((`ec`.`id` = `e`.`category_id`))) GROUP BY `ec`.`id`, `ec`.`name` ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admin`
--
ALTER TABLE `admin`
  ADD CONSTRAINT `admin_tier2_provider_fk` FOREIGN KEY (`tier2_provider_id`) REFERENCES `pension_tier2_providers` (`provider_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `bank_accounts`
--
ALTER TABLE `bank_accounts`
  ADD CONSTRAINT `fk_bank_accounts_chart` FOREIGN KEY (`chart_account_id`) REFERENCES `chart_of_accounts` (`account_id`);

--
-- Constraints for table `bank_reconciliations`
--
ALTER TABLE `bank_reconciliations`
  ADD CONSTRAINT `fk_reconciliation_account` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`bank_account_id`) ON DELETE CASCADE;

--
-- Constraints for table `bank_transactions`
--
ALTER TABLE `bank_transactions`
  ADD CONSTRAINT `fk_bank_trans_account` FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts` (`bank_account_id`),
  ADD CONSTRAINT `fk_bank_trans_journal` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`entry_id`);

--
-- Constraints for table `budget_lines`
--
ALTER TABLE `budget_lines`
  ADD CONSTRAINT `fk_budget_line_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`budget_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_budget_lines_account` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`account_id`),
  ADD CONSTRAINT `fk_budget_lines_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`budget_id`) ON DELETE CASCADE;

--
-- Constraints for table `budget_utilization_log`
--
ALTER TABLE `budget_utilization_log`
  ADD CONSTRAINT `fk_budget_util_budget` FOREIGN KEY (`budget_id`) REFERENCES `budgets` (`budget_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_budget_util_line` FOREIGN KEY (`budget_line_id`) REFERENCES `budget_lines` (`budget_line_id`) ON DELETE CASCADE;

--
-- Constraints for table `credit_applications`
--
ALTER TABLE `credit_applications`
  ADD CONSTRAINT `credit_applications_ibfk_1` FOREIGN KEY (`credit_id`) REFERENCES `student_credits` (`credit_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `credit_applications_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `invoice` (`invoice_id`) ON DELETE CASCADE;

--
-- Constraints for table `credit_system_logs`
--
ALTER TABLE `credit_system_logs`
  ADD CONSTRAINT `credit_system_logs_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `curriculum_content_standards`
--
ALTER TABLE `curriculum_content_standards`
  ADD CONSTRAINT `fk_ccs_sub_strand` FOREIGN KEY (`sub_strand_id`) REFERENCES `curriculum_sub_strands` (`sub_strand_id`) ON DELETE CASCADE;

--
-- Constraints for table `curriculum_indicators`
--
ALTER TABLE `curriculum_indicators`
  ADD CONSTRAINT `curriculum_indicators_ibfk_1` FOREIGN KEY (`sub_strand_id`) REFERENCES `curriculum_sub_strands` (`sub_strand_id`) ON DELETE CASCADE;

--
-- Constraints for table `curriculum_learning_indicators`
--
ALTER TABLE `curriculum_learning_indicators`
  ADD CONSTRAINT `fk_cli_content_standard` FOREIGN KEY (`content_standard_id`) REFERENCES `curriculum_content_standards` (`content_standard_id`) ON DELETE CASCADE;

--
-- Constraints for table `curriculum_strands`
--
ALTER TABLE `curriculum_strands`
  ADD CONSTRAINT `fk_cs_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `curriculum_sub_strands`
--
ALTER TABLE `curriculum_sub_strands`
  ADD CONSTRAINT `fk_css_strand` FOREIGN KEY (`strand_id`) REFERENCES `curriculum_strands` (`strand_id`) ON DELETE CASCADE;

--
-- Constraints for table `discount_applications`
--
ALTER TABLE `discount_applications`
  ADD CONSTRAINT `fk_discount_app_profile` FOREIGN KEY (`profile_id`) REFERENCES `discount_profiles` (`profile_id`),
  ADD CONSTRAINT `fk_discount_app_student` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `enterprise_exam_subjects`
--
ALTER TABLE `enterprise_exam_subjects`
  ADD CONSTRAINT `enterprise_exam_subjects_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `enterprise_exams` (`exam_id`) ON DELETE CASCADE;

--
-- Constraints for table `enterprise_student_marks`
--
ALTER TABLE `enterprise_student_marks`
  ADD CONSTRAINT `enterprise_student_marks_ibfk_1` FOREIGN KEY (`exam_id`) REFERENCES `enterprise_exams` (`exam_id`) ON DELETE CASCADE;

--
-- Constraints for table `exam_marks`
--
ALTER TABLE `exam_marks`
  ADD CONSTRAINT `exam_marks_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `exam_marks_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `fiscal_periods`
--
ALTER TABLE `fiscal_periods`
  ADD CONSTRAINT `fk_periods_year` FOREIGN KEY (`fiscal_year_id`) REFERENCES `fiscal_years` (`fiscal_year_id`) ON DELETE CASCADE;

--
-- Constraints for table `hod_subjects`
--
ALTER TABLE `hod_subjects`
  ADD CONSTRAINT `fk_hs_admin` FOREIGN KEY (`assigned_by`) REFERENCES `admin` (`admin_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hs_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_hs_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_products`
--
ALTER TABLE `inventory_products`
  ADD CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `inventory_categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_purchases`
--
ALTER TABLE `inventory_purchases`
  ADD CONSTRAINT `fk_purchase_creator` FOREIGN KEY (`created_by`) REFERENCES `admin` (`admin_id`),
  ADD CONSTRAINT `fk_purchase_receiver` FOREIGN KEY (`received_by`) REFERENCES `admin` (`admin_id`),
  ADD CONSTRAINT `fk_purchase_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `inventory_suppliers` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_purchase_items`
--
ALTER TABLE `inventory_purchase_items`
  ADD CONSTRAINT `fk_purchase_item_product` FOREIGN KEY (`product_id`) REFERENCES `inventory_products` (`id`),
  ADD CONSTRAINT `fk_purchase_item_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `inventory_purchases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_purchase_payments`
--
ALTER TABLE `inventory_purchase_payments`
  ADD CONSTRAINT `fk_purchase_payment_admin` FOREIGN KEY (`recorded_by`) REFERENCES `admin` (`admin_id`),
  ADD CONSTRAINT `fk_purchase_payment_expenditure` FOREIGN KEY (`expenditure_payment_id`) REFERENCES `payment` (`payment_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_purchase_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`),
  ADD CONSTRAINT `fk_purchase_payment_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `inventory_purchases` (`id`);

--
-- Constraints for table `inventory_returns`
--
ALTER TABLE `inventory_returns`
  ADD CONSTRAINT `fk_return_admin` FOREIGN KEY (`processed_by`) REFERENCES `admin` (`admin_id`),
  ADD CONSTRAINT `fk_return_sale` FOREIGN KEY (`original_sale_id`) REFERENCES `inventory_sales` (`id`);

--
-- Constraints for table `inventory_return_items`
--
ALTER TABLE `inventory_return_items`
  ADD CONSTRAINT `fk_return_item_product` FOREIGN KEY (`product_id`) REFERENCES `inventory_products` (`id`),
  ADD CONSTRAINT `fk_return_item_return` FOREIGN KEY (`return_id`) REFERENCES `inventory_returns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_return_item_sale_item` FOREIGN KEY (`sale_item_id`) REFERENCES `inventory_sale_items` (`id`);

--
-- Constraints for table `inventory_sale_items`
--
ALTER TABLE `inventory_sale_items`
  ADD CONSTRAINT `fk_sale_item_product` FOREIGN KEY (`product_id`) REFERENCES `inventory_products` (`id`),
  ADD CONSTRAINT `fk_sale_item_sale` FOREIGN KEY (`sale_id`) REFERENCES `inventory_sales` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_stock_movements`
--
ALTER TABLE `inventory_stock_movements`
  ADD CONSTRAINT `inventory_stock_movements_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `inventory_products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `journal_entry_lines`
--
ALTER TABLE `journal_entry_lines`
  ADD CONSTRAINT `fk_journal_lines_account` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`account_id`),
  ADD CONSTRAINT `fk_journal_lines_entry` FOREIGN KEY (`entry_id`) REFERENCES `journal_entries` (`entry_id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_notes`
--
ALTER TABLE `lesson_notes`
  ADD CONSTRAINT `fk_ln_admin` FOREIGN KEY (`admin_id`) REFERENCES `admin` (`admin_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ln_class` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ln_content_standard` FOREIGN KEY (`content_standard_id`) REFERENCES `curriculum_content_standards` (`content_standard_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ln_hod` FOREIGN KEY (`hod_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ln_source` FOREIGN KEY (`source_lesson_note_id`) REFERENCES `lesson_notes` (`lesson_note_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ln_strand` FOREIGN KEY (`strand_id`) REFERENCES `curriculum_strands` (`strand_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ln_sub_strand` FOREIGN KEY (`sub_strand_id`) REFERENCES `curriculum_sub_strands` (`sub_strand_id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ln_subject` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ln_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_note_assessments`
--
ALTER TABLE `lesson_note_assessments`
  ADD CONSTRAINT `fk_lna_lesson_note` FOREIGN KEY (`lesson_note_id`) REFERENCES `lesson_notes` (`lesson_note_id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_note_competencies`
--
ALTER TABLE `lesson_note_competencies`
  ADD CONSTRAINT `fk_lnc_competency` FOREIGN KEY (`competency_id`) REFERENCES `core_competencies` (`competency_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lnc_lesson_note` FOREIGN KEY (`lesson_note_id`) REFERENCES `lesson_notes` (`lesson_note_id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_note_indicators`
--
ALTER TABLE `lesson_note_indicators`
  ADD CONSTRAINT `fk_lni_indicator` FOREIGN KEY (`indicator_id`) REFERENCES `curriculum_learning_indicators` (`indicator_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lni_lesson_note` FOREIGN KEY (`lesson_note_id`) REFERENCES `lesson_notes` (`lesson_note_id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_note_references`
--
ALTER TABLE `lesson_note_references`
  ADD CONSTRAINT `fk_lnref_lesson_note` FOREIGN KEY (`lesson_note_id`) REFERENCES `lesson_notes` (`lesson_note_id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_note_resources`
--
ALTER TABLE `lesson_note_resources`
  ADD CONSTRAINT `fk_lnr_lesson_note` FOREIGN KEY (`lesson_note_id`) REFERENCES `lesson_notes` (`lesson_note_id`) ON DELETE CASCADE;

--
-- Constraints for table `lesson_note_revisions`
--
ALTER TABLE `lesson_note_revisions`
  ADD CONSTRAINT `fk_lnrrev_lesson_note` FOREIGN KEY (`lesson_note_id`) REFERENCES `lesson_notes` (`lesson_note_id`) ON DELETE CASCADE;

--
-- Constraints for table `non_teaching_staff`
--
ALTER TABLE `non_teaching_staff`
  ADD CONSTRAINT `non_teaching_staff_tier2_provider_fk` FOREIGN KEY (`tier2_provider_id`) REFERENCES `pension_tier2_providers` (`provider_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `notification_delivery_log`
--
ALTER TABLE `notification_delivery_log`
  ADD CONSTRAINT `fk_notification_delivery_log_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`notification_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payroll_approvals`
--
ALTER TABLE `payroll_approvals`
  ADD CONSTRAINT `payroll_approvals_ibfk_1` FOREIGN KEY (`pay_id`) REFERENCES `pay_salary` (`pay_id`) ON DELETE CASCADE;

--
-- Constraints for table `portfolio_aggregates`
--
ALTER TABLE `portfolio_aggregates`
  ADD CONSTRAINT `portfolio_aggregates_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portfolio_aggregates_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `portfolio_headers`
--
ALTER TABLE `portfolio_headers`
  ADD CONSTRAINT `portfolio_headers_ibfk_1` FOREIGN KEY (`class_id`) REFERENCES `class` (`class_id`),
  ADD CONSTRAINT `portfolio_headers_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`);

--
-- Constraints for table `portfolio_scores`
--
ALTER TABLE `portfolio_scores`
  ADD CONSTRAINT `portfolio_scores_ibfk_1` FOREIGN KEY (`header_id`) REFERENCES `portfolio_headers` (`header_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `portfolio_scores_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `reconciliation_items`
--
ALTER TABLE `reconciliation_items`
  ADD CONSTRAINT `fk_recon_item_reconciliation` FOREIGN KEY (`reconciliation_id`) REFERENCES `bank_reconciliations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `result_approval_audit`
--
ALTER TABLE `result_approval_audit`
  ADD CONSTRAINT `result_approval_audit_ibfk_1` FOREIGN KEY (`approval_status_id`) REFERENCES `result_approval_status` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `sba_components`
--
ALTER TABLE `sba_components`
  ADD CONSTRAINT `sba_components_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `sba_components_ibfk_2` FOREIGN KEY (`subject_id`) REFERENCES `subject` (`subject_id`) ON DELETE CASCADE;

--
-- Constraints for table `sba_score_sources`
--
ALTER TABLE `sba_score_sources`
  ADD CONSTRAINT `sba_score_sources_ibfk_1` FOREIGN KEY (`sba_component_id`) REFERENCES `sba_components` (`component_id`) ON DELETE CASCADE;

--
-- Constraints for table `sms_automation_logs`
--
ALTER TABLE `sms_automation_logs`
  ADD CONSTRAINT `fk_sms_log_automation` FOREIGN KEY (`automation_id`) REFERENCES `sms_automations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `student_credits`
--
ALTER TABLE `student_credits`
  ADD CONSTRAINT `student_credits_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_discount_assignments`
--
ALTER TABLE `student_discount_assignments`
  ADD CONSTRAINT `fk_student_discount_profile` FOREIGN KEY (`profile_id`) REFERENCES `discount_profiles` (`profile_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `student_discount_assignments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `student_ledger`
--
ALTER TABLE `student_ledger`
  ADD CONSTRAINT `student_ledger_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher`
--
ALTER TABLE `teacher`
  ADD CONSTRAINT `teacher_tier2_provider_fk` FOREIGN KEY (`tier2_provider_id`) REFERENCES `pension_tier2_providers` (`provider_id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `teacher_privileges`
--
ALTER TABLE `teacher_privileges`
  ADD CONSTRAINT `fk_teacher_privileges_granted_by` FOREIGN KEY (`granted_by`) REFERENCES `admin` (`admin_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_teacher_privileges_revoked_by` FOREIGN KEY (`revoked_by`) REFERENCES `admin` (`admin_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_teacher_privileges_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teacher` (`teacher_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `terminal_reports`
--
ALTER TABLE `terminal_reports`
  ADD CONSTRAINT `terminal_reports_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `student` (`student_id`) ON DELETE CASCADE;

--
-- Constraints for table `user_notification_preferences`
--
ALTER TABLE `user_notification_preferences`
  ADD CONSTRAINT `fk_user_notification_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `admin` (`admin_id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
