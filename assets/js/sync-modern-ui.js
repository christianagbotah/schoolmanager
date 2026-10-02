/**
 * Modern Sync UI Enhancements
 * JavaScript utilities for enhanced UX/UI patterns
 */

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
const SyncToast = {
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 5000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Info'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="SyncToast.close(this)">
                <i class="fa fa-times"></i>
            </button>
        `;
        
        this.container.appendChild(toast);
        
        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                this.close(toast.querySelector('.toast-close'));
            }, duration);
        }
        
        return toast;
    },
    
    close(button) {
        const toast = button.closest('.toast');
        if (toast) {
            toast.classList.add('removing');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }
    },
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration) {
        return this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// ============================================================================
// SKELETON LOADERS
// ============================================================================
const SkeletonLoader = {
    createCard() {
        return `
            <div class="skeleton-card">
                <div class="skeleton skeleton-line short"></div>
                <div class="skeleton skeleton-line medium"></div>
                <div class="skeleton skeleton-line long"></div>
            </div>
        `;
    },
    
    createStat() {
        return `<div class="skeleton skeleton-stat"></div>`;
    },
    
    createTable(rows = 5) {
        let html = '';
        for (let i = 0; i < rows; i++) {
            html += `
                <div class="table-row">
                    <div class="skeleton skeleton-line"></div>
                </div>
            `;
        }
        return html;
    },
    
    show(container, type = 'card', count = 1) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        if (!element) return;
        
        let html = '';
        for (let i = 0; i < count; i++) {
            if (type === 'card') html += this.createCard();
            else if (type === 'stat') html += this.createStat();
            else if (type === 'table') html += this.createTable();
        }
        
        element.innerHTML = html;
    }
};

// ============================================================================
// LOADING OVERLAY
// ============================================================================
const LoadingOverlay = {
    overlay: null,
    
    show(message = 'Loading...') {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div style="text-align: center;">
                    <div class="loading-spinner"></div>
                    <div style="margin-top: 16px; color: #6b7280; font-weight: 600;">${message}</div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
        this.overlay.style.display = 'flex';
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.style.display = 'none';
        }
    }
};

// ============================================================================
// ENHANCED AJAX HELPERS
// ============================================================================
const SyncAjax = {
    request(url, options = {}) {
        const defaults = {
            method: 'GET',
            showLoading: false,
            showToast: true,
            successMessage: null,
            errorMessage: 'An error occurred'
        };
        
        const config = { ...defaults, ...options };
        
        if (config.showLoading) {
            LoadingOverlay.show(config.loadingMessage);
        }
        
        return $.ajax({
            url: url,
            type: config.method,
            data: config.data,
            dataType: 'json'
        })
        .done(response => {
            if (config.showLoading) {
                LoadingOverlay.hide();
            }
            
            if (config.showToast && response.status === 'success') {
                const message = config.successMessage || response.message || 'Operation completed successfully';
                SyncToast.success(message);
            }
            
            if (config.onSuccess) {
                config.onSuccess(response);
            }
        })
        .fail((xhr, status, error) => {
            if (config.showLoading) {
                LoadingOverlay.hide();
            }
            
            // Check for session expiration
            if (xhr.status === 401 || xhr.status === 403) {
                SyncToast.error('Session expired. Redirecting to login...');
                setTimeout(() => {
                    window.location.href = base_url + 'login';
                }, 2000);
                return;
            }
            
            if (config.showToast) {
                const message = xhr.responseJSON?.message || config.errorMessage;
                SyncToast.error(message);
            }
            
            if (config.onError) {
                config.onError(xhr, status, error);
            }
        });
    },
    
    get(url, options = {}) {
        return this.request(url, { ...options, method: 'GET' });
    },
    
    post(url, data, options = {}) {
        return this.request(url, { ...options, method: 'POST', data });
    }
};

// ============================================================================
// DEBOUNCE UTILITY
// ============================================================================
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================================================
// COPY TO CLIPBOARD
// ============================================================================
function copyToClipboard(text, successMessage = 'Copied to clipboard!') {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            SyncToast.success(successMessage, 2000);
        }).catch(() => {
            fallbackCopyToClipboard(text, successMessage);
        });
    } else {
        fallbackCopyToClipboard(text, successMessage);
    }
}

function fallbackCopyToClipboard(text, successMessage) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        document.execCommand('copy');
        SyncToast.success(successMessage, 2000);
    } catch (err) {
        SyncToast.error('Failed to copy to clipboard');
    }
    
    document.body.removeChild(textArea);
}

// ============================================================================
// FORMAT NUMBERS
// ============================================================================
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// ============================================================================
// FORMAT DATES
// ============================================================================
function formatDate(date, format = 'relative') {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (format === 'relative') {
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return d.toLocaleDateString();
    }
    
    return d.toLocaleString();
}

// ============================================================================
// TREND INDICATOR
// ============================================================================
function createTrendIndicator(current, previous) {
    if (current === previous) {
        return '<span class="trend-indicator neutral"><i class="fa fa-minus"></i> 0%</span>';
    }
    
    const change = ((current - previous) / previous * 100).toFixed(1);
    const isUp = current > previous;
    const icon = isUp ? 'fa-arrow-up' : 'fa-arrow-down';
    const className = isUp ? 'up' : 'down';
    
    return `<span class="trend-indicator ${className}"><i class="fa ${icon}"></i> ${Math.abs(change)}%</span>`;
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================
const KeyboardShortcuts = {
    shortcuts: {},
    
    register(key, callback, description = '') {
        this.shortcuts[key] = { callback, description };
    },
    
    init() {
        document.addEventListener('keydown', (e) => {
            // Build key combination string
            let key = '';
            if (e.ctrlKey || e.metaKey) key += 'ctrl+';
            if (e.shiftKey) key += 'shift+';
            if (e.altKey) key += 'alt+';
            key += e.key.toLowerCase();
            
            if (this.shortcuts[key]) {
                e.preventDefault();
                this.shortcuts[key].callback(e);
            }
        });
    },
    
    showHelp() {
        let html = '<div style="padding: 20px;"><h3 style="margin-top: 0;">Keyboard Shortcuts</h3><table style="width: 100%;">';
        
        for (const [key, data] of Object.entries(this.shortcuts)) {
            if (data.description) {
                html += `
                    <tr>
                        <td style="padding: 8px; font-family: monospace; background: #f3f4f6; border-radius: 4px; width: 150px;">
                            ${key.replace('ctrl+', '⌘ ').replace('shift+', '⇧ ').replace('alt+', '⌥ ')}
                        </td>
                        <td style="padding: 8px;">${data.description}</td>
                    </tr>
                `;
            }
        }
        
        html += '</table></div>';
        
        showAjaxModal_alert(html, 'Keyboard Shortcuts', false);
    }
};

// ============================================================================
// ENHANCED EMPTY STATES
// ============================================================================
function createEmptyState(options = {}) {
    const defaults = {
        icon: 'fa-inbox',
        title: 'No data available',
        description: 'There are no items to display at this time.',
        actions: []
    };
    
    const config = { ...defaults, ...options };
    
    let actionsHtml = '';
    if (config.actions.length > 0) {
        actionsHtml = '<div class="empty-state-actions">';
        config.actions.forEach(action => {
            actionsHtml += `
                <button class="btn-modern btn-primary-modern" onclick="${action.onclick}">
                    <i class="fa ${action.icon}"></i>
                    <span>${action.label}</span>
                </button>
            `;
        });
        actionsHtml += '</div>';
    }
    
    return `
        <div class="empty-state-modern">
            <div class="empty-state-icon">
                <i class="fa ${config.icon}"></i>
            </div>
            <div class="empty-state-title">${config.title}</div>
            <div class="empty-state-description">${config.description}</div>
            ${actionsHtml}
        </div>
    `;
}

// ============================================================================
// INITIALIZE ON PAGE LOAD
// ============================================================================
$(document).ready(function() {
    // Initialize keyboard shortcuts
    KeyboardShortcuts.init();
    
    // Register common shortcuts
    KeyboardShortcuts.register('ctrl+k', () => {
        // Command palette (future feature)
        SyncToast.info('Command palette coming soon!');
    }, 'Open command palette');
    
    KeyboardShortcuts.register('shift+?', () => {
        KeyboardShortcuts.showHelp();
    }, 'Show keyboard shortcuts');
    
    // Add smooth scroll to all anchor links
    $('a[href^="#"]').on('click', function(e) {
        const target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').stop().animate({
                scrollTop: target.offset().top - 80
            }, 500);
        }
    });
    
    // Add loading state to all forms
    $('form').on('submit', function() {
        const submitBtn = $(this).find('button[type="submit"]');
        if (submitBtn.length && !submitBtn.hasClass('btn-loading')) {
            submitBtn.addClass('btn-loading');
            submitBtn.prop('disabled', true);
        }
    });
    
    // Auto-hide alerts after 10 seconds
    $('.alert-modern').each(function() {
        const alert = $(this);
        setTimeout(() => {
            alert.fadeOut(300, function() {
                $(this).remove();
            });
        }, 10000);
    });
});

// ============================================================================
// EXPORT FOR GLOBAL USE
// ============================================================================
window.SyncToast = SyncToast;
window.SkeletonLoader = SkeletonLoader;
window.LoadingOverlay = LoadingOverlay;
window.SyncAjax = SyncAjax;
window.debounce = debounce;
window.copyToClipboard = copyToClipboard;
window.formatNumber = formatNumber;
window.formatDate = formatDate;
window.createTrendIndicator = createTrendIndicator;
window.KeyboardShortcuts = KeyboardShortcuts;
window.createEmptyState = createEmptyState;

