/**
 * Sync Locations UI JavaScript
 * 
 * Handles all UI interactions for the location management interface including:
 * - Add/Edit location modal handling
 * - Form submission with AJAX and validation
 * - Search and filter functionality with debouncing
 * - Location activation/deactivation with confirmation
 * - Real-time status updates
 * 
 * Requirements: 4.1, 4.2, 4.8, 4.9, 4.10, 7.6, 19.5
 * Task 4.5: Location management JavaScript
 */

(function($) {
    'use strict';

    // Configuration
    const CONFIG = {
        searchDebounceDelay: 300, // milliseconds
        statusCheckInterval: 60000 // 60 seconds
    };

    // State
    let searchDebounceTimer = null;
    let statusCheckTimer = null;

    /**
     * Initialize the location management UI
     */
    function initLocationManagement() {
        console.log('Initializing Sync Locations UI...');
        
        // Set up event listeners
        setupEventListeners();
        
        // Start status checking
        startStatusChecking();
        
        console.log('Sync Locations UI initialized successfully');
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Add Location button
        $('#add-location-btn, #add-first-location-btn').on('click', function() {
            openAddLocationModal();
        });

        // Edit Location buttons
        $(document).on('click', '.edit-location-btn', function() {
            const locationId = $(this).data('location-id');
            openEditLocationModal(locationId);
        });

        // Deactivate Location buttons
        $(document).on('click', '.deactivate-location-btn', function() {
            const locationId = $(this).data('location-id');
            deactivateLocation(locationId);
        });

        // Activate Location buttons
        $(document).on('click', '.activate-location-btn', function() {
            const locationId = $(this).data('location-id');
            activateLocation(locationId);
        });

        // View Details buttons
        $(document).on('click', '.view-details-btn', function() {
            const locationId = $(this).data('location-id');
            viewLocationDetails(locationId);
        });

        // Search input with debouncing
        $('#location-search-input').on('input', function() {
            const searchTerm = $(this).val();
            debounceSearch(searchTerm);
        });

        // Status filter
        $('#status-filter').on('change', function() {
            applyFilters();
        });

        // Online filter
        $('#online-filter').on('change', function() {
            applyFilters();
        });

        // Add Location form submission
        $(document).on('submit', '#addLocationForm', function(e) {
            e.preventDefault();
            submitAddLocationForm();
        });

        // Edit Location form submission
        $(document).on('submit', '#editLocationForm', function(e) {
            e.preventDefault();
            submitEditLocationForm();
        });
    }

    /**
     * Open Add Location modal
     * Requirements: 4.1, 7.4
     */
    function openAddLocationModal() {
        showAjaxModal(base_url + 'admin/sync_locations/add_modal', 'Add New Location');
    }

    /**
     * Open Edit Location modal
     * Requirements: 4.2, 7.5
     */
    function openEditLocationModal(locationId) {
        if (!locationId) {
            showAjaxModal_alert('Invalid location ID', 'danger');
            return;
        }
        
        showAjaxModal(base_url + 'admin/sync_locations/edit_modal/' + locationId, 'Edit Location');
    }

    /**
     * Submit Add Location form
     * Requirements: 4.8, 4.9, 4.10
     */
    function submitAddLocationForm() {
        const form = $('#addLocationForm');
        const submitBtn = $('#submitAddLocationBtn');
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Validate form
        if (!validateForm(form)) {
            return;
        }
        
        // Get form data
        const formData = form.serialize();
        
        // Disable submit button and show loading state
        submitBtn.prop('disabled', true).addClass('sync-btn-loading');
        
        // Submit via AJAX
        $.ajax({
            url: base_url + 'admin/sync_locations/add',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Close modal
                    $('#addLocationModal').modal('hide');
                    
                    // Show success message
                    showAjaxModal_alert('Location added successfully!', 'success');
                    
                    // Reload page to show new location
                    setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                } else {
                    // Show error message
                    showAjaxModal_alert(response.message || 'Failed to add location. Please try again.', 'danger');
                    
                    // Display field-specific errors if available
                    if (response.errors) {
                        displayFormErrors(form, response.errors);
                    }
                }
            },
            error: function(xhr) {
                let errorMessage = 'Network error. Please check your connection and try again.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                
                showAjaxModal_alert(errorMessage, 'danger');
            },
            complete: function() {
                // Re-enable submit button
                submitBtn.prop('disabled', false).removeClass('sync-btn-loading');
            }
        });
    }

    /**
     * Submit Edit Location form
     * Requirements: 4.8, 4.9, 4.10
     */
    function submitEditLocationForm() {
        const form = $('#editLocationForm');
        const submitBtn = $('#submitEditLocationBtn');
        
        // Clear previous errors
        clearFormErrors(form);
        
        // Validate form
        if (!validateForm(form)) {
            return;
        }
        
        // Get form data
        const formData = form.serialize();
        
        // Disable submit button and show loading state
        submitBtn.prop('disabled', true).addClass('sync-btn-loading');
        
        // Submit via AJAX
        $.ajax({
            url: base_url + 'admin/sync_locations/update',
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Close modal
                    $('#editLocationModal').modal('hide');
                    
                    // Show success message
                    showAjaxModal_alert('Location updated successfully!', 'success');
                    
                    // Reload page to show updated location
                    setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                } else {
                    // Show error message
                    showAjaxModal_alert(response.message || 'Failed to update location. Please try again.', 'danger');
                    
                    // Display field-specific errors if available
                    if (response.errors) {
                        displayFormErrors(form, response.errors);
                    }
                }
            },
            error: function(xhr) {
                let errorMessage = 'Network error. Please check your connection and try again.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage = xhr.responseJSON.message;
                }
                
                showAjaxModal_alert(errorMessage, 'danger');
            },
            complete: function() {
                // Re-enable submit button
                submitBtn.prop('disabled', false).removeClass('sync-btn-loading');
            }
        });
    }

    /**
     * Validate form fields
     * Requirements: 4.8
     */
    function validateForm(form) {
        let isValid = true;
        
        // Check HTML5 validation
        const formElement = form[0];
        if (!formElement.checkValidity()) {
            formElement.reportValidity();
            return false;
        }
        
        // Additional custom validation
        form.find('input[required], select[required], textarea[required]').each(function() {
            const field = $(this);
            const value = field.val().trim();
            
            if (!value) {
                showFieldError(field, 'This field is required');
                isValid = false;
            }
        });
        
        // Validate email format
        form.find('input[type="email"]').each(function() {
            const field = $(this);
            const value = field.val().trim();
            
            if (value && !isValidEmail(value)) {
                showFieldError(field, 'Please enter a valid email address');
                isValid = false;
            }
        });
        
        // Validate URL format
        form.find('input[type="url"]').each(function() {
            const field = $(this);
            const value = field.val().trim();
            
            if (value && !isValidUrl(value)) {
                showFieldError(field, 'Please enter a valid URL (must start with http:// or https://)');
                isValid = false;
            }
        });
        
        return isValid;
    }

    /**
     * Show field error
     */
    function showFieldError(field, message) {
        field.addClass('error');
        const errorId = field.attr('id') + '_error';
        const errorElement = $('#' + errorId);
        
        if (errorElement.length) {
            errorElement.find('span').text(message);
            errorElement.show();
        }
    }

    /**
     * Clear form errors
     */
    function clearFormErrors(form) {
        form.find('.error').removeClass('error');
        form.find('.error-message').hide();
    }

    /**
     * Display form errors from server
     */
    function displayFormErrors(form, errors) {
        Object.keys(errors).forEach(function(fieldName) {
            const field = form.find('[name="' + fieldName + '"]');
            if (field.length) {
                showFieldError(field, errors[fieldName]);
            }
        });
    }

    /**
     * Validate email format
     */
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate URL format
     */
    function isValidUrl(url) {
        const urlRegex = /^https?:\/\/.+/i;
        return urlRegex.test(url);
    }

    /**
     * Deactivate location with confirmation
     * Requirements: 5.3, 5.7, 7.10
     */
    function deactivateLocation(locationId) {
        if (!locationId) {
            showAjaxModal_alert('Invalid location ID', 'danger');
            return;
        }
        
        // Show confirmation modal
        showAjaxModal_alert(
            'Are you sure you want to deactivate this location? Sync operations will be paused until reactivated.',
            'warning',
            function() {
                // User confirmed - proceed with deactivation
                $.ajax({
                    url: base_url + 'admin/sync_locations/deactivate/' + locationId,
                    method: 'POST',
                    dataType: 'json',
                    success: function(response) {
                        if (response.success) {
                            showAjaxModal_alert('Location deactivated successfully', 'success');
                            
                            // Reload page
                            setTimeout(function() {
                                window.location.reload();
                            }, 1500);
                        } else {
                            showAjaxModal_alert(response.message || 'Failed to deactivate location', 'danger');
                        }
                    },
                    error: function() {
                        showAjaxModal_alert('Network error. Please try again.', 'danger');
                    }
                });
            }
        );
    }

    /**
     * Activate location
     * Requirements: 5.3, 5.7, 7.10
     */
    function activateLocation(locationId) {
        if (!locationId) {
            showAjaxModal_alert('Invalid location ID', 'danger');
            return;
        }
        
        $.ajax({
            url: base_url + 'admin/sync_locations/activate/' + locationId,
            method: 'POST',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    showAjaxModal_alert('Location activated successfully', 'success');
                    
                    // Reload page
                    setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                } else {
                    showAjaxModal_alert(response.message || 'Failed to activate location', 'danger');
                }
            },
            error: function() {
                showAjaxModal_alert('Network error. Please try again.', 'danger');
            }
        });
    }

    /**
     * View location details
     */
    function viewLocationDetails(locationId) {
        if (!locationId) {
            showAjaxModal_alert('Invalid location ID', 'danger');
            return;
        }
        
        showAjaxModal(base_url + 'admin/sync_locations/view/' + locationId, 'Location Details');
    }

    /**
     * Debounce search input
     * Requirements: 19.5
     */
    function debounceSearch(searchTerm) {
        // Clear existing timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        // Set new timer
        searchDebounceTimer = setTimeout(function() {
            performSearch(searchTerm);
        }, CONFIG.searchDebounceDelay);
    }

    /**
     * Perform search
     * Requirements: 7.6
     */
    function performSearch(searchTerm) {
        applyFilters();
    }

    /**
     * Apply filters (search + status + online)
     * Requirements: 7.6, 12.3, 12.8
     */
    function applyFilters() {
        const searchTerm = $('#location-search-input').val().toLowerCase();
        const statusFilter = $('#status-filter').val();
        const onlineFilter = $('#online-filter').val();
        
        let visibleCount = 0;
        
        $('.sync-location-card').each(function() {
            const card = $(this);
            const searchText = card.data('search-text') || '';
            const status = card.data('status') || '';
            const online = card.data('online') || '';
            
            let show = true;
            
            // Apply search filter
            if (searchTerm && searchText.indexOf(searchTerm) === -1) {
                show = false;
            }
            
            // Apply status filter
            if (statusFilter && status !== statusFilter) {
                show = false;
            }
            
            // Apply online filter
            if (onlineFilter && online !== onlineFilter) {
                show = false;
            }
            
            if (show) {
                card.show();
                visibleCount++;
            } else {
                card.hide();
            }
        });
        
        // Show/hide no results message
        if (visibleCount === 0) {
            $('#no-results-message').show();
        } else {
            $('#no-results-message').hide();
        }
    }

    /**
     * Start status checking
     * Requirements: 11.3, 11.4
     */
    function startStatusChecking() {
        // Check status periodically
        statusCheckTimer = setInterval(function() {
            checkLocationStatus();
        }, CONFIG.statusCheckInterval);
    }

    /**
     * Check location status
     */
    function checkLocationStatus() {
        $.ajax({
            url: base_url + 'admin/sync_locations/get_status',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success && response.data) {
                    updateLocationStatus(response.data);
                }
            },
            error: function() {
                console.warn('Failed to check location status');
            }
        });
    }

    /**
     * Update location status on cards
     */
    function updateLocationStatus(statusData) {
        Object.keys(statusData).forEach(function(locationId) {
            const status = statusData[locationId];
            const card = $('.sync-location-card[data-location-id="' + locationId + '"]');
            
            if (card.length) {
                const statusBadge = card.find('.sync-location-card-status');
                const isOnline = status.is_online;
                
                // Update online/offline status
                if (isOnline) {
                    statusBadge.removeClass('offline').addClass('online');
                    statusBadge.find('span:last').text('Online');
                    card.attr('data-online', 'online');
                } else {
                    statusBadge.removeClass('online').addClass('offline');
                    statusBadge.find('span:last').text('Offline');
                    card.attr('data-online', 'offline');
                }
                
                // Update last sync time if available
                if (status.last_sync) {
                    card.find('.sync-location-card-info-value:first').text(formatDateTime(status.last_sync));
                }
            }
        });
    }

    /**
     * Format date/time
     */
    function formatDateTime(dateStr) {
        if (!dateStr || dateStr === 'Never') return 'Never';
        
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return month + ' ' + day + ', ' + hours + ':' + minutes;
    }

    /**
     * Clean up on page unload
     */
    $(window).on('beforeunload', function() {
        if (statusCheckTimer) {
            clearInterval(statusCheckTimer);
        }
    });

    // Initialize when document is ready
    $(document).ready(function() {
        initLocationManagement();
    });

})(jQuery);
