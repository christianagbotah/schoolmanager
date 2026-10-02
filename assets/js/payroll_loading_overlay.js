/**
 * Payroll Loading Overlay Integration
 * 
 * Task 17.1-17.5: Loading states and button feedback
 * Integrates loading overlay with form submission and button states
 * 
 * @package SchoolManager
 * @subpackage Assets/JS
 * @version 1.0.0
 */

(function() {
    'use strict';

    // ========================================
    // LOADING OVERLAY CONTROL (Task 17.1-17.2)
    // ========================================

    /**
     * Show loading overlay
     * 
     * @param {string} message - Loading message to display
     */
    window.showPayrollLoadingOverlay = function(message) {
        const overlay = document.getElementById('payrollLoadingOverlay');
        const textElement = overlay ? overlay.querySelector('.payroll-loading-text') : null;
        
        if (overlay) {
            if (message && textElement) {
                textElement.textContent = message;
            }
            overlay.classList.add('active');
        }
    };

    /**
     * Hide loading overlay
     */
    window.hidePayrollLoadingOverlay = function() {
        const overlay = document.getElementById('payrollLoadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    };

    /**
     * Update loading overlay message
     * 
     * @param {string} message - New message to display
     */
    window.updateLoadingMessage = function(message) {
        const overlay = document.getElementById('payrollLoadingOverlay');
        const textElement = overlay ? overlay.querySelector('.payroll-loading-text') : null;
        
        if (textElement) {
            textElement.textContent = message;
        }
    };

    // ========================================
    // BUTTON LOADING STATES (Task 17.5)
    // ========================================

    /**
     * Set button to loading state
     * 
     * @param {HTMLElement|string} button - Button element or ID
     */
    window.setButtonLoading = function(button) {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (btn) {
            btn.classList.add('is-loading');
            btn.disabled = true;
            btn.setAttribute('data-original-text', btn.textContent);
        }
    };

    /**
     * Remove loading state from button
     * 
     * @param {HTMLElement|string} button - Button element or ID
     */
    window.removeButtonLoading = function(button) {
        const btn = typeof button === 'string' ? document.getElementById(button) : button;
        if (btn) {
            btn.classList.remove('is-loading');
            btn.disabled = false;
            const originalText = btn.getAttribute('data-original-text');
            if (originalText) {
                btn.textContent = originalText;
                btn.removeAttribute('data-original-text');
            }
        }
    };

    // ========================================
    // FLASH ANIMATIONS (Task 17.3-17.4)
    // ========================================

    /**
     * Flash element with success animation
     * 
     * @param {HTMLElement|string} element - Element or ID
     */
    window.flashSuccess = function(element) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (el) {
            el.classList.add('payroll-success-flash');
            setTimeout(() => {
                el.classList.remove('payroll-success-flash');
            }, 500);
        }
    };

    /**
     * Shake element with error animation
     * 
     * @param {HTMLElement|string} element - Element or ID
     */
    window.shakeError = function(element) {
        const el = typeof element === 'string' ? document.getElementById(element) : element;
        if (el) {
            el.classList.add('payroll-error-shake');
            setTimeout(() => {
                el.classList.remove('payroll-error-shake');
            }, 500);
        }
    };

    // ========================================
    // INTEGRATION WITH FORM SUBMISSION
    // ========================================

    /**
     * Initialize loading overlay integration
     */
    function initializeLoadingOverlay() {
        // Intercept form submission to show loading
        const form = document.getElementById('payrollForm');
        if (form) {
            // This will be triggered by existing form submission handler
            // We'll hook into the AJAX calls in submitPayrollData
        }

        // Add loading state to calculate button
        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', function() {
                setButtonLoading(calculateBtn);
                setTimeout(() => {
                    removeButtonLoading(calculateBtn);
                    flashSuccess('payrollFormHolder');
                }, 300);
            });
        }

        // Add loading state to auto deduct button
        const autoDeductBtn = document.getElementById('autoDeductBtn');
        if (autoDeductBtn) {
            autoDeductBtn.addEventListener('click', function() {
                setButtonLoading(autoDeductBtn);
                setTimeout(() => {
                    removeButtonLoading(autoDeductBtn);
                    flashSuccess('payrollFormHolder');
                }, 500);
            });
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLoadingOverlay);
    } else {
        initializeLoadingOverlay();
    }

    // Log initialization
    console.log('✓ Payroll loading overlay initialized');

})();
