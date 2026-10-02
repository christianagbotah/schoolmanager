/**
 * Real-time Payroll Calculation Engine
 * Automatically recalculates all payroll components when any field changes
 * 
 * CRITICAL BUSINESS LOGIC:
 * - SSNIT Tier 1 (13.5%) = Employer contribution, NOT deducted from employee
 * - SSNIT Tier 2 (5%) = Employee contribution, deducted from gross salary
 * - Net Salary = Gross - (Tier 2 + Other Deductions), Tier 1 EXCLUDED
 * - All SSNIT calculations are on BASIC SALARY, not gross
 */
class PayrollCalculator {
    constructor() {
        this.bindEvents();
        this.initializeFields();
    }
    
    /**
     * Initialize all fields with default values
     */
    initializeFields() {
        // Ensure hidden fields exist
        if ($('#totalAllowancesForDb').length === 0) {
            $('<input>').attr({type: 'hidden', id: 'totalAllowancesForDb', name: 'total_allowances'}).appendTo('form');
        }
        if ($('#grossSalaryForDb').length === 0) {
            $('<input>').attr({type: 'hidden', id: 'grossSalaryForDb', name: 'gross_salary'}).appendTo('form');
        }
        if ($('#totalDeductionsForDb').length === 0) {
            $('<input>').attr({type: 'hidden', id: 'totalDeductionsForDb', name: 'total_deductions'}).appendTo('form');
        }
        if ($('#netSalaryForDb').length === 0) {
            $('<input>').attr({type: 'hidden', id: 'netSalaryForDb', name: 'net_salary'}).appendTo('form');
        }
    }
    
    /**
     * Bind change events to all payroll input fields
     */
    bindEvents() {
        const self = this;
        
        // Basic salary triggers full recalculation (includes SSNIT)
        $('#basicSalary, input[name="basic_salary"]').on('input blur', function() {
            self.recalculateAll();
        });
        
        // Toggle switches for GETFund and NHIL - immediately recalculate when toggled
        // CRITICAL: Check if elements exist before binding to prevent jQuery errors
        if ($('#getfundToggle').length > 0) {
            $('#getfundToggle').on('change', function() {
                self.recalculateAll();
            });
        }
        
        if ($('#nhilToggle').length > 0) {
            $('#nhilToggle').on('change', function() {
                self.recalculateAll();
            });
        }
        
        // Allowances trigger gross and net recalculation
        const allowanceFields = [
            '#marketPremium', '#teachingAllowance', '#responsibilityAllowance',
            '#extraClasses', '#ruralAllowance', '#otherAllowances',
            'input[name="market_premium_allowance"]', 'input[name="teaching_allowance"]',
            'input[name="responsibility_allowance"]', 'input[name="extra_class_allowance"]',
            'input[name="rural_allowance"]', 'input[name="other_allowances"]'
        ];
        
        $(allowanceFields.join(', ')).on('input blur', function() {
            self.recalculateGross();
            self.recalculateNet();
            self.highlightChange($(this));
        });
        
        // Deductions trigger net salary recalculation only
        const deductionFields = [
            '#petra', '#incomeTax', '#getfund', '#nhil',
            '#salaryAdvance', '#loans', '#gnat', '#welfare', '#otherDeductions',
            'input[name="tier2_contribution"]', 'input[name="income_tax"]',
            'input[name="get_fund"]', 'input[name="nhil"]',
            'input[name="salary_advance"]', 'input[name="loans"]',
            'input[name="welfare_dues"]', 'input[name="gnat_dues"]',
            'input[name="other_deductions"]'
        ];
        
        $(deductionFields.join(', ')).on('input blur', function() {
            self.recalculateNet();
            self.highlightChange($(this));
        });
        
        // Attendance calculation
        $('#workingDays, #daysPresent, input[name="working_days"], input[name="days_present"]').on('input blur', function() {
            self.calculateAttendance();
        });
    }
    
    /**
     * Recalculate all payroll components (SSNIT, statutory, gross, net)
     * Uses dynamic rates from STATUTORY_RATES global variable (loaded from database)
     */
    recalculateAll() {
        const basicSalary = this.getFieldValue('#basicSalary, input[name="basic_salary"]');
        
        // Step 1: Calculate SSNIT on basic salary ONLY using dynamic rates
        // Check if STATUTORY_RATES is defined (loaded from database)
        if (typeof STATUTORY_RATES === 'undefined') {
            console.error('STATUTORY_RATES not defined! Cannot calculate payroll.');
            return;
        }
        
        // Get dynamic rates from database (no fallbacks)
        const tier1Rate = STATUTORY_RATES.ssnit_tier1_employer / 100;
        const tier2Rate = STATUTORY_RATES.ssnit_tier2 / 100;
        const getfundRate = STATUTORY_RATES.getfund / 100;
        const nhilRate = STATUTORY_RATES.nhil / 100;
        
        const tier1 = basicSalary * tier1Rate;  // Employer contribution
        const tier2 = basicSalary * tier2Rate;  // Employee contribution
        
        this.setFieldValue('#ssnit, input[name="ssnit"]', tier1);
        this.setFieldValue('#petra, input[name="tier2_contribution"]', tier2);
        
        // Step 2: Calculate statutory deductions ONLY if toggle switches are ON
        const getfundToggle = document.getElementById('getfundToggle');
        const nhilToggle = document.getElementById('nhilToggle');
        
        // Only write to field if toggle is ON
        if (getfundToggle && getfundToggle.checked) {
            const getfund = basicSalary * getfundRate;  // Dynamic GETFund rate
            this.setFieldValue('#getfund, input[name="get_fund"]', getfund);
        }
        
        // Only write to field if toggle is ON  
        if (nhilToggle && nhilToggle.checked) {
            const nhil = basicSalary * nhilRate;  // Dynamic NHIL rate
            this.setFieldValue('#nhil, input[name="nhil"]', nhil);
        }
        
        // Step 3: Calculate gross salary
        this.recalculateGross();
        
        // Step 4: Calculate net salary (CRITICAL: Tier 1 NOT deducted)
        this.recalculateNet();
    }
    
    /**
     * Calculate gross salary (Basic + All Allowances)
     * Task 15.4: Update Quick Stats in real-time
     */
    recalculateGross() {
        const basic = this.getFieldValue('#basicSalary, input[name="basic_salary"]');
        
        const marketPremium = this.getFieldValue('#marketPremium, input[name="market_premium_allowance"]');
        const teaching = this.getFieldValue('#teachingAllowance, input[name="teaching_allowance"]');
        const responsibility = this.getFieldValue('#responsibilityAllowance, input[name="responsibility_allowance"]');
        const extraClasses = this.getFieldValue('#extraClasses, input[name="extra_class_allowance"]');
        const rural = this.getFieldValue('#ruralAllowance, input[name="rural_allowance"]');
        const other = this.getFieldValue('#otherAllowances, input[name="other_allowances"]');
        
        const totalAllowances = marketPremium + teaching + responsibility + extraClasses + rural + other;
        const gross = basic + totalAllowances;
        
        // Update display elements (multiple possible selectors)
        this.updateDisplay('#summaryBasic, .summary-basic, [data-field="basic"]', basic);
        this.updateDisplay('#summaryAllowances, .summary-allowances, [data-field="allowances"]', totalAllowances);
        this.updateDisplay('#grossSalary, .gross-salary, [data-field="gross"]', gross);
        
        // Task 15.4: Update Quick Stats - Gross Salary in sidebar
        this.updateDisplay('#quickGrossSalary', gross);
        
        // Update hidden fields for database storage
        $('#totalAllowancesForDb').val(totalAllowances.toFixed(2));
        $('#grossSalaryForDb').val(gross.toFixed(2));
        
        return gross;
    }
    
    /**
     * Calculate net salary (Gross - Tier2 - Other Deductions)
     * CRITICAL: Tier 1 is NOT deducted from employee pay
     * Task 15.4: Update Quick Stats - Net Salary and Deductions in sidebar
     */
    recalculateNet() {
        const gross = parseFloat($('#grossSalaryForDb').val()) || this.recalculateGross();
        
        // CRITICAL: Only Tier 2 is deducted, NOT Tier 1
        const tier2 = this.getFieldValue('#petra, input[name="tier2_contribution"]');
        const incomeTax = this.getFieldValue('#incomeTax, input[name="income_tax"]');
        const getfund = this.getFieldValue('#getfund, input[name="get_fund"]');
        const nhil = this.getFieldValue('#nhil, input[name="nhil"]');
        const salaryAdvance = this.getFieldValue('#salaryAdvance, input[name="salary_advance"]');
        const loans = this.getFieldValue('#loans, input[name="loans"]');
        const welfare = this.getFieldValue('#welfare, input[name="welfare_dues"]');
        const gnat = this.getFieldValue('#gnat, input[name="gnat_dues"]');
        const otherDeductions = this.getFieldValue('#otherDeductions, input[name="other_deductions"]');
        
        // Statutory deductions (includes Tier 2)
        const statutoryDeductions = tier2 + incomeTax + getfund + nhil;
        
        // Other deductions
        const otherDeds = salaryAdvance + loans + welfare + gnat + otherDeductions;
        
        // Total deductions (Tier 1 NOT included)
        const totalDeductions = statutoryDeductions + otherDeds;
        
        // Net salary
        const net = gross - totalDeductions;
        
        // Update display elements
        this.updateDisplay('#summaryStatutory, .summary-statutory, [data-field="statutory"]', statutoryDeductions);
        this.updateDisplay('#summaryOther, .summary-other, [data-field="other-deductions"]', otherDeds);
        this.updateDisplay('#netSalary, .net-salary, [data-field="net"]', net);
        
        // Task 15.4: Update Quick Stats - Total Deductions and Net Salary in sidebar
        this.updateDisplay('#quickDeductions', totalDeductions);
        this.updateDisplay('#quickNetSalary', net);
        
        // Update hidden fields for database storage
        $('#totalDeductionsForDb').val(totalDeductions.toFixed(2));
        $('#netSalaryForDb').val(net.toFixed(2));
        
        // Warn if negative net salary
        if (net < 0) {
            this.showNegativeNetWarning(gross, totalDeductions, net);
        }
    }
    
    /**
     * Calculate attendance percentage and days absent
     */
    calculateAttendance() {
        const workingDays = this.getFieldValue('#workingDays, input[name="working_days"]');
        const daysPresent = this.getFieldValue('#daysPresent, input[name="days_present"]');
        
        if (workingDays > 0) {
            const daysAbsent = workingDays - daysPresent;
            const percentage = (daysPresent / workingDays * 100).toFixed(1);
            
            this.setFieldValue('#daysAbsent, input[name="days_absent"]', daysAbsent);
            this.updateDisplay('#attendancePercentage, .attendance-percentage', percentage, '%');
            
            // Highlight if attendance is low
            if (percentage < 80) {
                $('#attendancePercentage, .attendance-percentage').addClass('text-danger');
            } else {
                $('#attendancePercentage, .attendance-percentage').removeClass('text-danger');
            }
        }
    }
    
    /**
     * Get numeric value from field, defaulting to 0
     */
    getFieldValue(selector) {
        const $field = $(selector).first();
        return parseFloat($field.val()) || 0;
    }
    
    /**
     * Set field value with proper formatting
     */
    setFieldValue(selector, value) {
        $(selector).val(value.toFixed(2));
    }
    
    /**
     * Update display elements with currency formatting
     */
    updateDisplay(selector, value, suffix = '') {
        const formatted = suffix ? value.toFixed(1) + suffix : 'GH₵ ' + value.toFixed(2);
        $(selector).text(formatted);
    }
    
    /**
     * Highlight field change with visual feedback
     */
    highlightChange($field) {
        $field.css('transition', 'background-color 0.3s ease');
        $field.css('background-color', '#ffffcc');
        
        setTimeout(function() {
            $field.css('background-color', '');
        }, 500);
    }
    
    /**
     * Show warning modal when net salary is negative
     */
    showNegativeNetWarning(gross, deductions, net) {
        const message = `
            <div class="alert alert-danger" style="margin: 0;">
                <h5><i class="fa fa-exclamation-triangle"></i> Warning: Negative Net Salary!</h5>
                <hr>
                <table class="table table-sm" style="margin: 0; background: white;">
                    <tr>
                        <td><strong>Gross Salary:</strong></td>
                        <td class="text-right">GH₵ ${gross.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td><strong>Total Deductions:</strong></td>
                        <td class="text-right text-danger">GH₵ ${deductions.toFixed(2)}</td>
                    </tr>
                    <tr style="border-top: 2px solid #000;">
                        <td><strong>Net Salary:</strong></td>
                        <td class="text-right text-danger"><strong>GH₵ ${net.toFixed(2)}</strong></td>
                    </tr>
                </table>
                <hr>
                <p style="margin: 0;"><small>Deductions exceed gross salary. Please review the payroll data.</small></p>
            </div>
        `;
        
        // Use modern modal if available, otherwise use alert
        if (typeof showModalAlert === 'function') {
            showModalAlert(message, 'Validation Error', 'warning');
        } else {
            showAjaxModal_alert('Warning: Net salary is negative! Gross: GH₵' + gross.toFixed(2) + ', Deductions: GH₵' + deductions.toFixed(2), 'Warning');
        }
    }
}

// Initialize on document ready
$(document).ready(function() {
    window.payrollCalculator = new PayrollCalculator();
});
