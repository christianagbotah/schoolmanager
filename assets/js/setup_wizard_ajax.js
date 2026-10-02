/**
 * Setup Wizard AJAX Handler
 * Manages form submissions and modal responses for the Setup Wizard
 * 
 * This module provides AJAX-based form submission with modal feedback
 * for the Local WAMP + Cloud Sync Setup Wizard. It enhances user experience
 * by providing immediate feedback without page reloads.
 * 
 * @requires jQuery 3.x
 * @requires Bootstrap modal component
 */

const SetupWizardAjax = {
    
    /**
     * Initialize AJAX form handling
     * Sets up event handlers for form submission and modal interactions
     */
    init: function() {
        this.bindFormSubmit();
    },
    
    /**
     * Bind form submission events
     * Attaches submit event handlers to all forms with the 'ajax-form' class
     */
    bindFormSubmit: function() {
        $('.ajax-form').on('submit', function(e) {
            e.preventDefault();
            SetupWizardAjax.handleFormSubmit($(this));
        });
    },
    
    /**
     * Handle form submission
     * Serializes form data and sends AJAX request to the server
     * 
     * @param {jQuery} $form - Form element to submit
     */
    handleFormSubmit: function($form) {
        let formData = $form.serialize();
        
        // Add the submit button's name and value (jQuery serialize() doesn't include it)
        const $submitBtn = $form.find('button[type="submit"]');
        if ($submitBtn.attr('name')) {
            formData += '&' + encodeURIComponent($submitBtn.attr('name')) + '=' + encodeURIComponent($submitBtn.attr('value') || '1');
        }
        
        // Add ajax=1 parameter to explicitly indicate this is an AJAX request
        formData += '&ajax=1';
        
        const actionUrl = $form.attr('action');
        
        console.log('[Setup Wizard] Form submission started');
        console.log('[Setup Wizard] Action URL:', actionUrl);
        console.log('[Setup Wizard] Form data:', formData);
        
        // Show loading state
        this.showLoadingState($form, $submitBtn);
        
        // Send AJAX request with proper headers for CodeIgniter
        $.ajax({
            url: actionUrl,
            type: 'POST',
            data: formData,
            dataType: 'json',
            timeout: 30000,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            beforeSend: function(xhr) {
                // Ensure AJAX header is set (some browsers/libraries may override)
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            },
            success: function(response) {
                console.log('[Setup Wizard] AJAX success');
                console.log('[Setup Wizard] Response:', response);
                SetupWizardAjax.handleSuccess(response, $form, $submitBtn);
            },
            error: function(xhr, status, error) {
                console.log('[Setup Wizard] AJAX error');
                console.log('[Setup Wizard] XHR status:', xhr.status);
                console.log('[Setup Wizard] Response text:', xhr.responseText.substring(0, 500));
                SetupWizardAjax.handleError(xhr, status, error, $form, $submitBtn);
            }
        });
    },
    
    /**
     * Show loading state
     * Disables form inputs and displays loading indicators
     * 
     * @param {jQuery} $form - Form element
     * @param {jQuery} $submitBtn - Submit button element
     */
    showLoadingState: function($form, $submitBtn) {
        // Disable submit button
        $submitBtn.prop('disabled', true);
        
        // Store original button text
        $submitBtn.data('original-text', $submitBtn.html());
        
        // Update button text with loading indicator
        $submitBtn.html('<i class="fa fa-spinner fa-spin"></i> Processing...');
        
        // Disable all form inputs
        $form.find('input, select, textarea').prop('disabled', true);
        
        // Show loading modal using standardized system
        if (typeof showAjaxModal_alert === 'function') {
            showAjaxModal_alert('Processing your request...', 'Loading');
        }
    },
    
    /**
     * Hide loading state
     * Re-enables form inputs and removes loading indicators
     * 
     * @param {jQuery} $form - Form element
     * @param {jQuery} $submitBtn - Submit button element
     */
    hideLoadingState: function($form, $submitBtn) {
        // Restore button text
        $submitBtn.html($submitBtn.data('original-text'));
        
        // Enable submit button
        $submitBtn.prop('disabled', false);
        
        // Enable all form inputs
        $form.find('input, select, textarea').prop('disabled', false);
        
        // DON'T hide the loading modal here - it will be replaced by success/error modal
        // The standardized modal system handles the transition automatically
    },
    
    /**
     * Handle successful response
     * Processes server response and displays result in modal
     * 
     * @param {Object} response - Server response object
     * @param {jQuery} $form - Form element
     * @param {jQuery} $submitBtn - Submit button element
     */
    handleSuccess: function(response, $form, $submitBtn) {
        this.hideLoadingState($form, $submitBtn);
        
        // Format message with data if present
        let message = response.message || 'Operation completed successfully';
        if (response.data && typeof response.data === 'object') {
            message += '<br><br>' + this.formatDataObject(response.data, 0);
        }
        
        // Use standardized modal system
        // Third parameter = false means don't reload page
        // Fourth parameter = false means don't auto-close modal
        // Hide loading modal first, then show success modal after transition
        $('#modal_alert').modal('hide');
        setTimeout(function() {
            showAjaxModal_alert(message, 'Success', false, false);
        }, 400); // Wait for modal hide animation (300ms) + small buffer
    },
    
    /**
     * Format data object recursively for display
     * Handles nested objects and arrays with proper indentation
     * 
     * @param {Object|Array} data - Data to format
     * @param {Number} level - Nesting level for indentation
     * @returns {String} Formatted HTML string
     */
    formatDataObject: function(data, level) {
        const indent = level * 20; // 20px per level
        let html = '<div style="text-align:left;margin-top:15px;padding:15px;background:#f8f9fa;border-radius:8px;margin-left:' + indent + 'px;">';
        
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                const keyFormatted = this.formatKey(key);
                
                // Check if value is an object or array
                if (value !== null && typeof value === 'object') {
                    // Nested object or array
                    html += '<div style="margin-bottom:12px;">';
                    html += '<strong style="color:#667eea;font-size:14px;">' + keyFormatted + ':</strong>';
                    html += this.formatDataObject(value, level + 1);
                    html += '</div>';
                } else {
                    // Simple value
                    const valueFormatted = this.escapeHtml(String(value));
                    html += '<div style="margin-bottom:8px;">';
                    html += '<strong style="color:#667eea;">' + keyFormatted + ':</strong> ';
                    html += '<span style="color:#2c3e50;">' + valueFormatted + '</span>';
                    html += '</div>';
                }
            }
        }
        
        html += '</div>';
        return html;
    },
    
    /**
     * Format object key for display
     * Replaces underscores with spaces and capitalizes words
     * 
     * @param {String} key - Object key to format
     * @returns {String} Formatted key
     */
    formatKey: function(key) {
        return this.escapeHtml(
            key.replace(/_/g, ' ')
               .replace(/\b\w/g, function(char) { return char.toUpperCase(); })
        );
    },
    
    /**
     * Handle error response
     * Processes error conditions and displays error message in modal
     * 
     * @param {Object} xhr - XMLHttpRequest object
     * @param {String} status - Error status
     * @param {String} error - Error message
     * @param {jQuery} $form - Form element
     * @param {jQuery} $submitBtn - Submit button element
     */
    handleError: function(xhr, status, error, $form, $submitBtn) {
        this.hideLoadingState($form, $submitBtn);
        
        let errorMessage = 'An error occurred while processing your request.';
        
        if (status === 'timeout') {
            errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (xhr.status === 0) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else if (xhr.status === 403) {
            errorMessage = 'Access denied (403). This may be a CSRF token issue. Please refresh the page and try again.';
        } else if (xhr.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
        } else if (xhr.responseJSON && xhr.responseJSON.message) {
            errorMessage = xhr.responseJSON.message;
        } else if (xhr.responseText) {
            // Try to extract meaningful error from HTML response
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = xhr.responseText;
            const h1 = tempDiv.querySelector('h1');
            const p = tempDiv.querySelector('p');
            if (h1 && p) {
                errorMessage = this.escapeHtml(h1.textContent) + ': ' + this.escapeHtml(p.textContent);
            } else {
                errorMessage = this.escapeHtml(xhr.responseText.substring(0, 200)); // First 200 chars
            }
        }
        
        // Use standardized modal system
        // Error modals use default behavior (no auto-close parameter needed)
        // Hide loading modal first, then show error modal after transition
        $('#modal_alert').modal('hide');
        setTimeout(function() {
            showAjaxModal_alert(errorMessage, 'Error', false);
        }, 400); // Wait for modal hide animation (300ms) + small buffer
    },
    
    /**
     * Escape HTML to prevent XSS
     * @param {String} text - Text to escape
     * @returns {String} Escaped text
     */
    escapeHtml: function(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
};

// Initialize on document ready
$(document).ready(function() {
    SetupWizardAjax.init();
});
