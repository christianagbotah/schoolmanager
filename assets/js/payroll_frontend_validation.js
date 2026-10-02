/**
 * Payroll Frontend Validation
 * 
 * Task 16.1-16.4: Real-time field validation with visual feedback
 * Implements validation rules and error display for payroll forms
 * 
 * @package SchoolManager
 * @subpackage Assets/JS
 * @version 1.0.0
 */

(function() {
    'use strict';

    // ========================================
    // VALIDATION RULES (Task 16.1)
    // ========================================
    window.validationRules = {
        basicSalary: {
            required: true,
            min: 0,
            message: 'Basic salary must be a positive number'
        },
        marketPremium: {
            required: false,
            min: 0,
            message: 'Market premium must be a positive number'
        },
        teachingAllowance: {
            required: false,
            min: 0,
            message: 'Teaching allowance must be a positive number'
        },
        responsibilityAllowance: {
            required: false,
            min: 0,
            message: 'Responsibility allowance must be a positive number'
        },
        extraClasses: {
            required: false,
            min: 0,
            message: 'Extra classes must be a positive number'
        },
        ruralAllowance: {
            required: false,
            min: 0,
            message: 'Rural allowance must be a positive number'
        },
        otherAllowances: {
            required: false,
            min: 0,
            message: 'Other allowances must be a positive number'
        },
        ssnit: {
            required: false,
            min: 0,
            message: 'SSNIT must be a positive number'
        },
        incomeTax: {
            required: false,
            min: 0,
            message: 'Income tax must be a positive number'
        },
        petra: {
            required: false,
            min: 0,
            message: 'Tier 2 must be a positive number'
        },
        getfund: {
            required: false,
            min: 0,
            message: 'GETFund must be a positive number'
        },
        salaryAdvance: {
            required: false,
            min: 0,
            message: 'Salary advance must be a positive number'
        },
        nhil: {
            required: false,
            min: 0,
            message: 'NHIL must be a positive number'
        },
        loans: {
            required: false,
            min: 0,
            message: 'Loan deductions must be a positive number'
        },
        welfare: {
            required: false,
            min: 0,
            message: 'Welfare dues must be a positive number'
        },
        gnat: {
            required: false,
            min: 0,
            message: 'GNAT dues must be a positive number'
        },
        otherDeductions: {
            required: false,
            min: 0,
            message: 'Other deductions must be a positive number'
        },
        workingDays: {
            required: true,
            min: 1,
            max: 31,
            message: 'Working days must be between 1 and 31'
        },
        daysPresent: {
            required: true,
            min: 0,
            max: 31,
            message: 'Days present must be between 0 and 31'
        },
        daysAbsent: {
            required: false,
            min: 0,
            max: 31,
            message: 'Days absent must be between 0 and 31'
        }
    };

    // ========================================
    // VALIDATION FUNCTIONS (Task 16.1)
    // ========================================

    /**
     * Validate a single field
     * 
     * @param {string} fieldId - Field ID to validate
     * @returns {boolean} - True if valid, false otherwise
     */
    window.validateField = function(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return true; // Field doesn't exist

        const rules = validationRules[fieldId];
        if (!rules) return true; // No rules for this field

        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field check
        if (rules.required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Numeric validation
        if (value && isNaN(value)) {
            isValid = false;
            errorMessage = 'Must be a valid number';
        }

        // Min value check
        if (value && rules.min !== undefined && parseFloat(value) < rules.min) {
            isValid = false;
            errorMessage = `Must be at least ${rules.min}`;
        }

        // Max value check
        if (value && rules.max !== undefined && parseFloat(value) > rules.max) {
            isValid = false;
            errorMessage = `Must not exceed ${rules.max}`;
        }

        // Update field UI
        if (isValid) {
            showFieldValid(fieldId);
        } else {
            showFieldError(fieldId, errorMessage || rules.message);
        }

        // Task 16.4: Check all fields and update submit button state
        checkAllFieldsAndUpdateButton();

        return isValid;
    };

    /**
     * Show field as valid (Task 16.3)
     * Applies green checkmark icon and green border when validation passes
     * 
     * @param {string} fieldId - Field ID
     */
    window.showFieldValid = function(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Remove error classes
        field.classList.remove('is-invalid', 'payroll-input-error', 'border-red-500', 'bg-red-50');
        
        // Add valid classes (if field has value) - Task 16.3
        if (field.value.trim()) {
            // Add success indicator classes
            field.classList.add('is-valid', 'payroll-input-valid');
            
            // The CSS will automatically show:
            // - Green border (border-color: #10b981)
            // - Green checkmark icon (background-image with SVG checkmark)
        } else {
            // Remove success indicators if field is empty
            field.classList.remove('is-valid', 'payroll-input-valid');
        }

        // Hide error message
        hideFieldError(fieldId);
    };

    /**
     * Show field error (Task 16.2)
     * 
     * @param {string} fieldId - Field ID
     * @param {string} message - Error message
     */
    window.showFieldError = function(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        // Remove valid classes
        field.classList.remove('is-valid', 'payroll-input-valid');
        
        // Add error classes
        field.classList.add('is-invalid', 'payroll-input-error', 'border-red-500', 'bg-red-50');

        // Show error message
        let errorDiv = field.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('payroll-error-message')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'payroll-error-message';
            field.parentNode.insertBefore(errorDiv, field.nextSibling);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    };

    /**
     * Hide field error
     * 
     * @param {string} fieldId - Field ID
     */
    function hideFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;

        const errorDiv = field.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('payroll-error-message')) {
            errorDiv.style.display = 'none';
        }
    }

    // ========================================
    // EVENT LISTENERS (Task 16.1)
    // ========================================

    /**
     * Initialize validation on DOM ready
     */
    document.addEventListener('DOMContentLoaded', function() {
        // Attach blur event to all validated fields
        Object.keys(validationRules).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                // Validate on blur
                field.addEventListener('blur', function() {
                    validateField(fieldId);
                });

                // Clear error on focus
                field.addEventListener('focus', function() {
                    field.classList.remove('border-red-500', 'bg-red-50');
                });

                // Validate on input (for positive number check)
                field.addEventListener('input', function() {
                    if (field.value.trim()) {
                        validateField(fieldId);
                    }
                });
            }
        });
    });

    // ========================================
    // FORM VALIDATION (Task 16.4)
    // ========================================

    /**
     * Validate entire form
     * Task 16.4: Update validation summary when errors found
     * 
     * @returns {boolean} - True if form is valid
     */
    window.validatePayrollForm = function() {
        let isValid = true;
        let firstErrorField = null;
        let errors = [];

        Object.keys(validationRules).forEach(fieldId => {
            if (!validateField(fieldId)) {
                isValid = false;
                if (!firstErrorField) {
                    firstErrorField = document.getElementById(fieldId);
                }
                
                // Collect error for summary
                const field = document.getElementById(fieldId);
                const rules = validationRules[fieldId];
                if (field && rules) {
                    const fieldLabel = field.previousElementSibling?.textContent || fieldId;
                    const errorMessage = field.nextElementSibling?.textContent || rules.message;
                    errors.push(`${fieldLabel}: ${errorMessage}`);
                }
            }
        });

        // Task 16.4: Show or hide validation summary
        if (errors.length > 0) {
            showValidationSummary(errors);
            updateSubmitButtonState(false); // Disable submit button
        } else {
            clearValidationSummary();
            updateSubmitButtonState(true); // Enable submit button
        }

        // Scroll to first error or validation summary
        if (firstErrorField) {
            const summaryDiv = document.getElementById('validationSummary');
            if (summaryDiv && summaryDiv.style.display !== 'none') {
                summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            firstErrorField.focus();
        }

        return isValid;
    };

    /**
     * Show form-level validation summary (Task 16.4 - CONNECTED)
     * 
     * @param {Array} errors - Array of error messages
     */
    window.showValidationSummary = function(errors) {
        const summaryDiv = document.getElementById('validationSummary');
        const errorList = document.getElementById('validationErrorList');
        
        if (!summaryDiv || !errorList) {
            console.warn('Validation summary elements not found in DOM');
            return;
        }

        if (errors.length > 0) {
            // Clear existing errors
            errorList.innerHTML = '';
            
            // Add each error to the list
            errors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = error;
                errorList.appendChild(li);
            });
            
            // Show the summary
            summaryDiv.classList.remove('hidden');
            summaryDiv.style.display = 'block';
            
            // Scroll to summary
            summaryDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            summaryDiv.classList.add('hidden');
            summaryDiv.style.display = 'none';
        }
    };

    /**
     * Clear validation summary (Task 16.4 - CONNECTED)
     */
    window.clearValidationSummary = function() {
        const summaryDiv = document.getElementById('validationSummary');
        if (summaryDiv) {
            summaryDiv.classList.add('hidden');
            summaryDiv.style.display = 'none';
            
            // Clear error list
            const errorList = document.getElementById('validationErrorList');
            if (errorList) {
                errorList.innerHTML = '';
            }
        }
    };

    /**
     * Update submit button state based on validation (Task 16.4)
     * 
     * @param {boolean} isValid - True to enable button, false to disable
     */
    window.updateSubmitButtonState = function(isValid) {
        const submitButton = document.querySelector('#payrollForm button[type="submit"]');
        if (!submitButton) return;

        if (isValid) {
            // Enable button
            submitButton.disabled = false;
            submitButton.classList.remove('opacity-50', 'cursor-not-allowed');
            submitButton.classList.add('cursor-pointer');
        } else {
            // Disable button
            submitButton.disabled = true;
            submitButton.classList.add('opacity-50', 'cursor-not-allowed');
            submitButton.classList.remove('cursor-pointer');
        }
    };

    /**
     * Check all fields for validation without showing summary (Task 16.4)
     * Used for real-time submit button state updates
     */
    function checkAllFieldsAndUpdateButton() {
        let hasErrors = false;

        // Check only required fields for submit button state
        Object.keys(validationRules).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const rules = validationRules[fieldId];
            
            if (field && rules && rules.required) {
                const value = field.value.trim();
                
                // Check required field
                if (!value) {
                    hasErrors = true;
                    return;
                }
                
                // Check numeric validation
                if (value && isNaN(value)) {
                    hasErrors = true;
                    return;
                }
                
                // Check min/max
                if (value && rules.min !== undefined && parseFloat(value) < rules.min) {
                    hasErrors = true;
                    return;
                }
                
                if (value && rules.max !== undefined && parseFloat(value) > rules.max) {
                    hasErrors = true;
                    return;
                }
            }
        });

        // Update submit button state
        updateSubmitButtonState(!hasErrors);
    }

    // ========================================
    // CUSTOM VALIDATION RULES
    // ========================================

    /**
     * Validate that days present <= working days
     */
    function validateDaysPresent() {
        const workingDays = parseInt(document.getElementById('workingDays')?.value || 22);
        const daysPresent = parseInt(document.getElementById('daysPresent')?.value || 0);

        if (daysPresent > workingDays) {
            showFieldError('daysPresent', `Days present cannot exceed ${workingDays} working days`);
            return false;
        }

        return true;
    }

    /**
     * Validate that net salary is not negative (Task 8.7)
     */
    window.validateNetSalary = function() {
        const netSalaryElement = document.getElementById('netSalaryForDb');
        if (!netSalaryElement) return true;

        const netSalary = parseFloat(netSalaryElement.value || 0);

        if (netSalary < 0) {
            // Show warning modal (integrated with modal system)
            if (typeof showModalAlert === 'function') {
                const grossSalary = parseFloat(document.getElementById('grossSalaryForDb')?.value || 0);
                const totalDeductions = parseFloat(document.getElementById('totalDeductionsForDb')?.value || 0);

                showModalAlert(
                    `<div class="text-left">
                        <p class="mb-3 text-sm text-gray-600">The calculated net salary is negative. Please review the deductions.</p>
                        <div class="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Gross Salary:</span>
                                <span class="font-medium">GH₵ ${grossSalary.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Total Deductions:</span>
                                <span class="font-medium text-red-600">GH₵ ${totalDeductions.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between border-t border-gray-200 pt-2">
                                <span class="font-semibold">Net Salary:</span>
                                <span class="font-bold text-red-600">GH₵ ${netSalary.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>`,
                    'Negative Net Salary Warning',
                    'warning'
                );
            }
            return false;
        }

        return true;
    };

    // Add custom validation to days present field
    const daysPresentField = document.getElementById('daysPresent');
    if (daysPresentField) {
        daysPresentField.addEventListener('blur', validateDaysPresent);
    }

    // Log initialization
    console.log('✓ Payroll frontend validation initialized');

})();
