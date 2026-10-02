<?php
/**
 * Payment Status Detection Model
 * 
 * Determines FEEDING payment status for students by checking both direct payments
 * and prepaid balance usage for a specific date.
 * 
 * This model specifically tracks FEEDING payments (lunch/dining), not other fee types
 * like classes, transport, water, or breakfast.
 * 
 * @package     Models
 * @author      School Manager System
 */
defined('BASEPATH') OR exit('No direct script access allowed');

class Payment_status_model extends CI_Model {

    /**
     * Check if student has FEEDING payment status for a given date
     * 
     * @param int $student_id Student ID
     * @param string $date Date in YYYY-MM-DD format
     * @return array ['has_payment' => bool, 'payment_type' => string|null]
     */
    public function getPaymentStatus($student_id, $date) {
        // Convert date to Unix timestamp (midnight)
        $timestamp = strtotime($date . ' 00:00:00');
        
        // Check for direct payment
        $has_direct_payment = $this->hasDirectPayment($student_id, $timestamp);
        
        // Check for prepaid usage
        $has_prepaid_usage = $this->hasPrepaidUsage($student_id, $timestamp);
        
        // Determine payment status and type
        if ($has_direct_payment) {
            return [
                'has_payment' => true,
                'payment_type' => 'Direct Payment',
                'payment_date' => $timestamp,
                'source_table' => 'daily_fee_transactions'
            ];
        } elseif ($has_prepaid_usage) {
            return [
                'has_payment' => true,
                'payment_type' => 'Prepaid Balance',
                'payment_date' => $timestamp,
                'source_table' => 'daily_charge_log'
            ];
        } else {
            return [
                'has_payment' => false,
                'payment_type' => null,
                'payment_date' => $timestamp,
                'source_table' => null
            ];
        }
    }

    /**
     * Get payment status for multiple students
     * 
     * @param array $student_ids Array of student IDs
     * @param string $date Date in YYYY-MM-DD format
     * @return array Keyed by student_id with payment status data
     */
    public function getBulkPaymentStatus($student_ids, $date) {
        if (empty($student_ids)) {
            return [];
        }
        
        // Convert date to Unix timestamp (midnight)
        $timestamp = strtotime($date . ' 00:00:00');
        
        // Initialize result array
        $result = [];
        foreach ($student_ids as $student_id) {
            $result[$student_id] = [
                'has_payment' => false,
                'payment_type' => null,
                'payment_date' => $timestamp,
                'source_table' => null
            ];
        }
        
        // Get direct payments for all students
        $direct_payments = $this->getDirectPaymentsBulk($student_ids, $timestamp);
        foreach ($direct_payments as $student_id) {
            $result[$student_id] = [
                'has_payment' => true,
                'payment_type' => 'Direct Payment',
                'payment_date' => $timestamp,
                'source_table' => 'daily_fee_transactions'
            ];
        }
        
        // Get prepaid usage for students without direct payment
        $students_without_direct = array_diff($student_ids, $direct_payments);
        if (!empty($students_without_direct)) {
            $prepaid_usage = $this->getPrepaidUsageBulk($students_without_direct, $timestamp);
            foreach ($prepaid_usage as $student_id) {
                $result[$student_id] = [
                    'has_payment' => true,
                    'payment_type' => 'Prepaid Balance',
                    'payment_date' => $timestamp,
                    'source_table' => 'daily_charge_log'
                ];
            }
        }
        
        return $result;
    }

    /**
     * Check if direct FEEDING payment exists for student on date
     * 
     * @param int $student_id Student ID
     * @param int $timestamp Unix timestamp (midnight)
     * @return bool
     */
    private function hasDirectPayment($student_id, $timestamp) {
        $query = $this->db->select('id')
            ->from('daily_fee_transactions')
            ->where('student_id', $student_id)
            ->where('payment_date', $timestamp)
            ->where('feeding_amount >', 0)
            ->limit(1)
            ->get();
        
        return $query->num_rows() > 0;
    }

    /**
     * Check if prepaid FEEDING usage exists for student on date
     * 
     * A student has "prepaid usage" only if:
     * 1. They have a charge log entry for feeding on that date
     * 2. They had sufficient prepaid balance to cover it (not added to arrears)
     * 
     * @param int $student_id Student ID
     * @param int $timestamp Unix timestamp (midnight)
     * @return bool
     */
    private function hasPrepaidUsage($student_id, $timestamp) {
        // Get the charge log entry
        $charge_log = $this->db->select('feeding_charged')
            ->from('daily_charge_log')
            ->where('student_id', $student_id)
            ->where('charge_date', $timestamp)
            ->where('feeding_charged >', 0)
            ->limit(1)
            ->get();
        
        if ($charge_log->num_rows() == 0) {
            return false;
        }
        
        $feeding_charged = $charge_log->row()->feeding_charged;
        
        // Check if student had sufficient prepaid balance BEFORE this charge
        // by looking at wallet transactions or checking if arrears increased
        // 
        // Simple approach: Check if the student has any feeding_arrears that include this charge
        // If feeding_arrears > 0 and no direct payment, they likely didn't have enough prepaid
        //
        // Better approach: Check wallet balance history or use a prepaid_usage tracking table
        // For now, we check if there's a direct payment that covers the charge
        // If no direct payment and charge exists, check if prepaid was sufficient
        
        // Get the wallet to check current arrears
        $wallet = $this->db->select('feeding_balance, feeding_arrears')
            ->from('daily_fee_wallet')
            ->where('student_id', $student_id)
            ->get();
        
        if ($wallet->num_rows() == 0) {
            // No wallet = no prepaid balance = couldn't have paid with prepaid
            return false;
        }
        
        $wallet_row = $wallet->row();
        
        // If student has feeding_arrears > 0, they may not have had enough prepaid
        // But we need to check if this specific charge was covered by prepaid
        // 
        // The safest check: If they have a charge log AND no arrears (or arrears < charge),
        // they must have had prepaid to cover it
        //
        // However, this is complex. Let's use a simpler approach:
        // Check if there's a record in daily_fee_transactions with feeding_amount > 0
        // OR check if the charge was deducted from prepaid balance
        //
        // For now, we'll check if the student had prepaid balance before the charge
        // by looking at the wallet balance minus any payments after this date
        
        // SIMPLER APPROACH: Check if there's a payment record for this date
        // If feeding_charged > 0 and no direct payment, check wallet balance
        // If wallet had sufficient balance at charge time, it was prepaid usage
        
        // Get all payments BEFORE this date to calculate what the balance was
        $previous_payments = $this->db->select_sum('feeding_amount')
            ->from('daily_fee_transactions')
            ->where('student_id', $student_id)
            ->where('payment_date <', $timestamp)
            ->get()
            ->row()
            ->feeding_amount ?? 0;
        
        // Get all charges BEFORE this date
        $previous_charges = $this->db->select_sum('feeding_charged')
            ->from('daily_charge_log')
            ->where('student_id', $student_id)
            ->where('charge_date <', $timestamp)
            ->get()
            ->row()
            ->feeding_charged ?? 0;
        
        // Calculate balance before this charge
        $balance_before = $previous_payments - $previous_charges;
        
        // If balance was sufficient to cover the charge, it was prepaid usage
        return $balance_before >= $feeding_charged;
    }

    /**
     * Get students with direct FEEDING payments (bulk query)
     * 
     * @param array $student_ids Array of student IDs
     * @param int $timestamp Unix timestamp (midnight)
     * @return array Array of student IDs with direct feeding payments
     */
    private function getDirectPaymentsBulk($student_ids, $timestamp) {
        $query = $this->db->select('student_id')
            ->from('daily_fee_transactions')
            ->where_in('student_id', $student_ids)
            ->where('payment_date', $timestamp)
            ->where('feeding_amount >', 0)
            ->get();
        
        $result = [];
        foreach ($query->result() as $row) {
            $result[] = $row->student_id;
        }
        
        return $result;
    }

    /**
     * Get students with prepaid FEEDING usage (bulk query)
     * 
     * This checks if students had sufficient prepaid balance to cover their feeding charge.
     * 
     * @param array $student_ids Array of student IDs
     * @param int $timestamp Unix timestamp (midnight)
     * @return array Array of student IDs with prepaid feeding usage
     */
    private function getPrepaidUsageBulk($student_ids, $timestamp) {
        // Get all charge logs for these students on this date
        $charge_logs = $this->db->select('student_id, feeding_charged')
            ->from('daily_charge_log')
            ->where_in('student_id', $student_ids)
            ->where('charge_date', $timestamp)
            ->where('feeding_charged >', 0)
            ->get();
        
        $result = [];
        
        foreach ($charge_logs->result() as $charge) {
            // For each student with a charge, check if they had sufficient prepaid balance
            // Get all payments BEFORE this date
            $previous_payments = $this->db->select_sum('feeding_amount')
                ->from('daily_fee_transactions')
                ->where('student_id', $charge->student_id)
                ->where('payment_date <', $timestamp)
                ->get()
                ->row()
                ->feeding_amount ?? 0;
            
            // Get all charges BEFORE this date
            $previous_charges = $this->db->select_sum('feeding_charged')
                ->from('daily_charge_log')
                ->where('student_id', $charge->student_id)
                ->where('charge_date <', $timestamp)
                ->get()
                ->row()
                ->feeding_charged ?? 0;
            
            // Calculate balance before this charge
            $balance_before = $previous_payments - $previous_charges;
            
            // If balance was sufficient to cover the charge, it was prepaid usage
            if ($balance_before >= $charge->feeding_charged) {
                $result[] = $charge->student_id;
            }
        }
        
        return $result;
    }
}
