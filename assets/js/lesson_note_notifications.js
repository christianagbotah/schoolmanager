/**
 * Lesson Note Notifications JavaScript Module
 * Handles notification bell, dropdown, and real-time updates
 * 
 * Requirements: 17.6, 17.7, 20.4
 */

var LessonNoteNotifications = (function() {
    'use strict';
    
    var config = {
        checkInterval: 30000, // Check every 30 seconds
        maxDisplayed: 10,     // Max notifications in dropdown
        fadeDelay: 3000       // Toast notification fade delay
    };
    
    var state = {
        unreadCount: 0,
        notifications: [],
        lastCheck: null,
        intervalId: null,
        initialized: false,  // Track initialization state
        isLoading: false     // Track if AJAX request is in progress
    };
    
    /**
     * Initialize notification system
     */
    function init(userType) {
        // Prevent multiple initializations
        if (state.initialized) {
            console.warn('Lesson Note Notifications already initialized');
            return;
        }
        
        if (!userType) {
            console.error('User type required for notifications');
            return;
        }
        
        config.userType = userType;
        state.initialized = true;  // Mark as initialized
        
        // Load initial notifications once at page load
        loadNotifications();
        
        // Periodic checking disabled - run once at page load only
        // state.intervalId = setInterval(loadNotifications, config.checkInterval);
        
        // Bind event handlers
        bindEvents();
        
        console.log('Lesson Note Notifications initialized for ' + userType + ' (load once mode)');
    }
    
    /**
     * Load notifications from server
     */
    function loadNotifications() {
        // Prevent concurrent AJAX requests
        if (state.isLoading) {
            console.log('Notification request already in progress, skipping...');
            return;
        }
        
        state.isLoading = true;  // Mark as loading
        
        // Use different endpoint names for teacher to match controller methods
        var endpoint = (config.userType === 'teacher') 
            ? 'get_lesson_note_notifications' 
            : 'get_lesson_note_notifications';
            
        $.ajax({
            url: base_url + config.userType + '/' + endpoint,
            type: 'GET',
            dataType: 'json',
            data: {
                limit: config.maxDisplayed
            },
            success: function(response) {
                if (response.status === 'success') {
                    state.notifications = response.notifications || [];
                    state.unreadCount = response.unread_count || 0;
                    updateUI();
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load notifications:', error);
            },
            complete: function() {
                state.isLoading = false;  // Reset loading flag
            }
        });
    }
    
    /**
     * Update UI with current notification state
     */
    function updateUI() {
        // Update badge count
        var $badge = $('#lesson-note-notification-badge');
        if (state.unreadCount > 0) {
            $badge.text(state.unreadCount > 99 ? '99+' : state.unreadCount);
            $badge.show();
        } else {
            $badge.hide();
        }
        
        // Update dropdown content
        updateDropdown();
    }
    
    /**
     * Update notification dropdown
     */
    function updateDropdown() {
        var $dropdown = $('#lesson-note-notification-dropdown');
        
        if (state.notifications.length === 0) {
            $dropdown.html(
                '<li class="notification-item text-center" style="padding: 20px;">' +
                '<i class="fa fa-inbox" style="font-size: 48px; color: #ccc;"></i>' +
                '<p style="margin-top: 10px; color: #999;">No notifications</p>' +
                '</li>'
            );
            return;
        }
        
        var html = '';
        
        $.each(state.notifications, function(index, notification) {
            var isUnread = notification.is_read == 0;
            var unreadClass = isUnread ? 'notification-unread' : '';
            var icon = getNotificationIcon(notification.reference_type);
            var timeAgo = formatTimeAgo(notification.created_at);
            
            html += '<li class="notification-item ' + unreadClass + '" data-id="' + notification.notification_id + '">';
            html += '  <a href="#" class="notification-link" data-url="' + notification.url + '">';
            html += '    <div class="notification-icon">';
            html += '      <i class="' + icon + '"></i>';
            html += '    </div>';
            html += '    <div class="notification-content">';
            html += '      <div class="notification-title">' + escapeHtml(notification.title) + '</div>';
            html += '      <div class="notification-message">' + escapeHtml(notification.message) + '</div>';
            html += '      <div class="notification-time">' + timeAgo + '</div>';
            html += '    </div>';
            if (isUnread) {
                html += '    <div class="notification-unread-dot"></div>';
            }
            html += '  </a>';
            html += '</li>';
        });
        
        // Add "View All" link
        var notificationsUrl = (config.userType === 'admin') 
            ? base_url + config.userType + '/lesson_note_notifications'
            : base_url + config.userType + '/notifications';
            
        html += '<li class="notification-footer">';
        html += '  <a href="' + notificationsUrl + '" class="btn btn-sm btn-block">';
        html += '    View All Notifications';
        html += '  </a>';
        html += '</li>';
        
        $dropdown.html(html);
    }
    
    /**
     * Get icon for notification type
     */
    function getNotificationIcon(type) {
        var icons = {
            'lesson_note_approved': 'fa fa-check-circle text-success',
            'lesson_note_declined': 'fa fa-times-circle text-danger',
            'lesson_note_revision': 'fa fa-edit text-warning',
            'lesson_note_submitted': 'fa fa-file-text text-info',
            'lesson_note_endorsed': 'fa fa-thumbs-up text-primary',
            'default': 'fa fa-bell text-muted'
        };
        
        return icons[type] || icons['default'];
    }
    
    /**
     * Format timestamp as time ago
     */
    function formatTimeAgo(timestamp) {
        var now = new Date();
        var time = new Date(timestamp);
        var diff = Math.floor((now - time) / 1000); // seconds
        
        if (diff < 60) return 'Just now';
        if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
        if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
        if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
        
        return time.toLocaleDateString();
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    /**
     * Mark notification as read
     */
    function markAsRead(notificationId, callback) {
        // Use different endpoint names for admin to avoid conflicts
        var endpoint = (config.userType === 'admin') 
            ? 'mark_lesson_note_notification_read' 
            : 'mark_notification_read';
            
        $.ajax({
            url: base_url + config.userType + '/' + endpoint,
            type: 'POST',
            dataType: 'json',
            data: {
                notification_id: notificationId
            },
            success: function(response) {
                if (response.status === 'success') {
                    // Update local state
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                    
                    // Update notification in array
                    $.each(state.notifications, function(index, notif) {
                        if (notif.notification_id == notificationId) {
                            notif.is_read = 1;
                            return false;
                        }
                    });
                    
                    updateUI();
                    
                    if (callback) callback();
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to mark notification as read:', error);
            }
        });
    }
    
    /**
     * Mark all notifications as read
     */
    function markAllAsRead() {
        // Use different endpoint names for admin to avoid conflicts
        var endpoint = (config.userType === 'admin') 
            ? 'mark_all_lesson_note_notifications_read' 
            : 'mark_all_notifications_read';
            
        $.ajax({
            url: base_url + config.userType + '/' + endpoint,
            type: 'POST',
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    // Update local state
                    state.unreadCount = 0;
                    $.each(state.notifications, function(index, notif) {
                        notif.is_read = 1;
                    });
                    updateUI();
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to mark all as read:', error);
            }
        });
    }
    
    /**
     * Bind event handlers
     */
    function bindEvents() {
        // Notification bell click - toggle dropdown
        $(document).on('click', '#lesson-note-notification-bell', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $dropdown = $('#lesson-note-notification-menu');
            $dropdown.toggleClass('open');
        });
        
        // Click outside to close dropdown
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#lesson-note-notification-container').length) {
                $('#lesson-note-notification-menu').removeClass('open');
            }
        });
        
        // Notification item click
        $(document).on('click', '.notification-link', function(e) {
            e.preventDefault();
            
            var $item = $(this).closest('.notification-item');
            var notificationId = $item.data('id');
            var url = $(this).data('url');
            
            // Mark as read
            markAsRead(notificationId, function() {
                // Navigate to URL
                if (url) {
                    window.location.href = url;
                }
            });
        });
        
        // Mark all as read button
        $(document).on('click', '#mark-all-notifications-read', function(e) {
            e.preventDefault();
            markAllAsRead();
        });
    }
    
    /**
     * Show toast notification
     */
    function showToast(title, message, type) {
        type = type || 'info';
        
        var iconClass = {
            'success': 'fa-check-circle',
            'error': 'fa-times-circle',
            'warning': 'fa-exclamation-triangle',
            'info': 'fa-info-circle'
        }[type] || 'fa-info-circle';
        
        var bgClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';
        
        var $toast = $('<div class="lesson-note-toast alert ' + bgClass + '" style="display:none;">')
            .html(
                '<i class="fa ' + iconClass + '"></i> ' +
                '<strong>' + escapeHtml(title) + '</strong> ' +
                escapeHtml(message)
            );
        
        // Add to container
        var $container = $('#lesson-note-toast-container');
        if ($container.length === 0) {
            $container = $('<div id="lesson-note-toast-container"></div>').appendTo('body');
        }
        
        $container.append($toast);
        $toast.fadeIn(300);
        
        // Auto-hide after delay
        setTimeout(function() {
            $toast.fadeOut(300, function() {
                $(this).remove();
            });
        }, config.fadeDelay);
    }
    
    /**
     * Cleanup on page unload
     */
    function destroy() {
        if (state.intervalId) {
            clearInterval(state.intervalId);
        }
    }
    
    // Public API
    return {
        init: init,
        loadNotifications: loadNotifications,
        markAsRead: markAsRead,
        markAllAsRead: markAllAsRead,
        showToast: showToast,
        destroy: destroy
    };
})();

// Auto-initialize on document ready if user type is set
$(document).ready(function() {
    if (typeof lesson_note_user_type !== 'undefined') {
        LessonNoteNotifications.init(lesson_note_user_type);
    }
});
