/**
 * Notification System JavaScript
 * Handles notification bell, dropdown, and real-time updates
 */

(function($) {
    'use strict';

    var Notifications = {
        updateInterval: 30000, // 30 seconds
        updateTimer: null,
        
        /**
         * Initialize notification system
         */
        init: function() {
            this.bindEvents();
            this.loadNotifications();
            this.startAutoUpdate();
        },
        
        /**
         * Bind event handlers
         */
        bindEvents: function() {
            var self = this;
            
            // Toggle dropdown
            $(document).on('click', '.notification-bell', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.toggleDropdown();
            });
            
            // Mark as read
            $(document).on('click', '.notification-item', function(e) {
                var notificationId = $(this).data('id');
                if (notificationId) {
                    self.markAsRead(notificationId);
                }
            });
            
            // Mark all as read
            $(document).on('click', '.mark-all-read', function(e) {
                e.preventDefault();
                e.stopPropagation();
                self.markAllAsRead();
            });
            
            // Close dropdown when clicking outside
            $(document).on('click', function(e) {
                if (!$(e.target).closest('.notification-wrapper').length) {
                    $('.notification-dropdown').removeClass('show');
                }
            });
            
            // Prevent dropdown from closing when clicking inside
            $(document).on('click', '.notification-dropdown', function(e) {
                e.stopPropagation();
            });
        },
        
        /**
         * Toggle notification dropdown
         */
        toggleDropdown: function() {
            var dropdown = $('.notification-dropdown');
            
            if (dropdown.hasClass('show')) {
                dropdown.removeClass('show');
            } else {
                this.loadNotifications();
                dropdown.addClass('show');
            }
        },
        
        /**
         * Load notifications via AJAX
         */
        loadNotifications: function() {
            var self = this;
            var accountType = $('body').data('account-type') || 'teacher';
            
            $.ajax({
                url: base_url + accountType + '/get_notifications',
                type: 'GET',
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        self.updateBadge(response.unread_count);
                        self.renderNotifications(response.notifications);
                    }
                },
                error: function() {
                    console.error('Failed to load notifications');
                }
            });
        },
        
        /**
         * Update notification badge count
         */
        updateBadge: function(count) {
            var badge = $('.notification-badge');
            
            if (count > 0) {
                badge.text(count > 99 ? '99+' : count).show();
            } else {
                badge.hide();
            }
        },
        
        /**
         * Render notifications in dropdown
         */
        renderNotifications: function(notifications) {
            var container = $('.notification-list');
            
            if (!notifications || notifications.length === 0) {
                container.html('<div class="notification-empty">No notifications</div>');
                return;
            }
            
            var html = '';
            notifications.forEach(function(notification) {
                var unreadClass = notification.is_read == 0 ? 'unread' : '';
                var timeAgo = notification.time_ago || 'Just now';
                
                html += '<a href="' + (notification.link || '#') + '" class="notification-item ' + unreadClass + '" data-id="' + notification.notification_id + '">';
                html += '  <div class="notification-icon">';
                html += '    <i class="' + (notification.icon || 'fa fa-bell') + '"></i>';
                html += '  </div>';
                html += '  <div class="notification-content">';
                html += '    <div class="notification-title">' + notification.title + '</div>';
                html += '    <div class="notification-message">' + notification.message + '</div>';
                html += '    <div class="notification-time">' + timeAgo + '</div>';
                html += '  </div>';
                if (notification.is_read == 0) {
                    html += '  <div class="notification-unread-dot"></div>';
                }
                html += '</a>';
            });
            
            container.html(html);
        },
        
        /**
         * Mark notification as read
         */
        markAsRead: function(notificationId) {
            var self = this;
            var accountType = $('body').data('account-type') || 'teacher';
            
            $.ajax({
                url: base_url + accountType + '/mark_notification_read/' + notificationId,
                type: 'POST',
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        // Update UI
                        $('.notification-item[data-id="' + notificationId + '"]').removeClass('unread');
                        self.loadNotifications(); // Refresh to update count
                    }
                }
            });
        },
        
        /**
         * Mark all notifications as read
         */
        markAllAsRead: function() {
            var self = this;
            var accountType = $('body').data('account-type') || 'teacher';
            
            $.ajax({
                url: base_url + accountType + '/mark_all_notifications_read',
                type: 'POST',
                dataType: 'json',
                success: function(response) {
                    if (response.status === 'success') {
                        self.loadNotifications(); // Refresh
                    }
                }
            });
        },
        
        /**
         * Start auto-update timer
         */
        startAutoUpdate: function() {
            var self = this;
            
            this.updateTimer = setInterval(function() {
                self.loadNotifications();
            }, this.updateInterval);
        },
        
        /**
         * Stop auto-update timer
         */
        stopAutoUpdate: function() {
            if (this.updateTimer) {
                clearInterval(this.updateTimer);
                this.updateTimer = null;
            }
        }
    };
    
    // Initialize on document ready
    $(document).ready(function() {
        if ($('.notification-wrapper').length > 0) {
            Notifications.init();
        }
    });
    
    // Expose to global scope
    window.Notifications = Notifications;
    
})(jQuery);
