/**
 * Toast Notification System for Payroll Module
 * Provides non-intrusive notifications with auto-dismiss and stacking
 * 
 * Usage:
 *   toast.show('Payroll saved successfully', 'success');
 *   toast.show('An error occurred', 'error');
 */

class ToastNotification {
    constructor() {
        this.container = this.createContainer();
        this.maxToasts = 5;
        this.toastCount = 0;
    }
    
    /**
     * Create toast container in top-right corner
     */
    createContainer() {
        const containerId = 'toast-container';
        
        if ($(`#${containerId}`).length === 0) {
            $('body').append(`
                <div id="${containerId}" style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    width: 350px;
                    max-width: 90vw;
                "></div>
            `);
        }
        
        return $(`#${containerId}`);
    }
    
    /**
     * Show toast notification
     * 
     * @param {string} message Message text (HTML supported)
     * @param {string} type 'success'|'error'|'info'|'warning'
     * @param {number} duration Duration in ms (0 = persistent, default: auto)
     */
    show(message, type = 'info', duration = null) {
        // Enforce max toast limit
        if (this.toastCount >= this.maxToasts) {
            this.removeOldestToast();
        }
        
        // Auto-set duration based on type if not provided
        if (duration === null) {
            duration = (type === 'error') ? 0 : 4000; // Errors persist, others 4s
            if (type === 'warning') duration = 6000; // Warnings 6s
        }
        
        const toastId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let bgColor, icon, iconColor;
        
        switch (type) {
            case 'success':
                bgColor = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
                icon = 'fa-check-circle';
                iconColor = '#fff';
                break;
            case 'error':
                bgColor = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
                icon = 'fa-exclamation-circle';
                iconColor = '#fff';
                break;
            case 'warning':
                bgColor = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
                icon = 'fa-exclamation-triangle';
                iconColor = '#fff';
                break;
            default:
                bgColor = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                icon = 'fa-info-circle';
                iconColor = '#fff';
        }
        
        const toastHtml = `
            <div id="${toastId}" class="toast-notification" style="
                background: ${bgColor};
                color: white;
                padding: 16px 20px;
                border-radius: 10px;
                margin-bottom: 10px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                animation: slideInRight 0.3s ease;
                position: relative;
                cursor: pointer;
            ">
                <i class="fa ${icon}" style="
                    font-size: 24px;
                    margin-right: 12px;
                    color: ${iconColor};
                    flex-shrink: 0;
                "></i>
                <div style="flex: 1; word-wrap: break-word; font-size: 14px;">
                    ${message}
                </div>
                <button class="toast-close" style="
                    background: transparent;
                    border: none;
                    color: white;
                    font-size: 22px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 12px;
                    line-height: 1;
                    opacity: 0.8;
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                ">&times;</button>
            </div>
        `;
        
        this.container.append(toastHtml);
        this.toastCount++;
        
        const $toast = $(`#${toastId}`);
        
        // Close button handler
        $toast.find('.toast-close').on('click', (e) => {
            e.stopPropagation();
            this.hide(toastId);
        });
        
        // Click toast to dismiss (optional)
        $toast.on('click', () => {
            this.hide(toastId);
        });
        
        // Hover effects
        $toast.hover(
            function() { $(this).css('opacity', '0.95'); },
            function() { $(this).css('opacity', '1'); }
        );
        
        // Auto-hide if duration > 0
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toastId);
            }, duration);
        }
        
        return toastId;
    }
    
    /**
     * Hide and remove specific toast
     * 
     * @param {string} toastId Toast ID to hide
     */
    hide(toastId) {
        const $toast = $(`#${toastId}`);
        
        if ($toast.length === 0) return;
        
        $toast.css({
            animation: 'fadeOut 0.3s ease',
            pointerEvents: 'none'
        });
        
        setTimeout(() => {
            $toast.remove();
            this.toastCount--;
        }, 300);
    }
    
    /**
     * Remove oldest toast to maintain max limit
     */
    removeOldestToast() {
        const $oldestToast = this.container.find('.toast-notification').first();
        if ($oldestToast.length > 0) {
            this.hide($oldestToast.attr('id'));
        }
    }
    
    /**
     * Clear all toasts
     */
    clearAll() {
        this.container.find('.toast-notification').each((index, element) => {
            this.hide($(element).attr('id'));
        });
    }
    
    /**
     * Convenience methods for specific types
     */
    success(message, duration) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Create global instance
window.toast = new ToastNotification();

// Add CSS animations
$(document).ready(function() {
    if (!$('#toast-animations').length) {
        $('head').append(`
            <style id="toast-animations">
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes fadeOut {
                    from {
                        opacity: 1;
                        transform: scale(1);
                    }
                    to {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                }
                
                .toast-notification {
                    transition: opacity 0.3s ease;
                }
                
                .toast-close:hover {
                    opacity: 1 !important;
                    transform: scale(1.1);
                }
                
                /* Responsive adjustments */
                @media (max-width: 640px) {
                    #toast-container {
                        width: calc(100% - 40px);
                        right: 20px;
                        left: 20px;
                    }
                }
            </style>
        `);
    }
});
