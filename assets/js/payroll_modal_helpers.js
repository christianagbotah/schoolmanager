/**
 * Payroll Modal Helper Functions
 * Uses existing modal.php system for standardized modal dialogs
 * 
 * Provides modern alert and confirm dialogs with color-coded headers
 * and keyboard navigation support
 */

/**
 * Show modern alert modal using modal.php system
 * 
 * @param {string} message Message content (HTML supported)
 * @param {string} title Modal title
 * @param {string} type 'success'|'error'|'warning'|'info'
 */
function showModalAlert(message, title, type = 'info') {
    const modalId = 'modal_payroll_alert';
    let headerClass = 'modern-modal-header';
    let icon = 'fa-info-circle';
    let headerColor = '#667eea'; // Default blue
    
    if (type === 'success') {
        headerClass += ' modern-modal-header-success';
        icon = 'fa-check-circle';
        headerColor = '#11998e';
    } else if (type === 'error') {
        headerClass += ' modern-modal-header-danger';
        icon = 'fa-exclamation-circle';
        headerColor = '#f5576c';
    } else if (type === 'warning') {
        headerClass += ' modern-modal-header-warning';
        icon = 'fa-exclamation-triangle';
        headerColor = '#f39c12';
    }
    
    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${modalId}Title">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content modern-modal-content" style="border-radius: 10px; overflow: hidden; border: none;">
                    <div class="modal-header ${headerClass}" style="background: linear-gradient(135deg, ${headerColor} 0%, ${adjustColor(headerColor, 20)} 100%); border: none; color: white;">
                        <button type="button" class="close modern-close" data-dismiss="modal" aria-label="Close" style="color: white; opacity: 1; text-shadow: none;">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 class="modal-title" id="${modalId}Title" style="color: white; font-weight: 600;">
                            <i class="fa ${icon}"></i> ${title}
                        </h4>
                    </div>
                    <div class="modal-body" style="padding: 30px; font-size: 14px;">
                        ${message}
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid #e9ecef; padding: 15px 30px;">
                        <button type="button" class="btn modern-btn modern-btn-primary" data-dismiss="modal" style="min-width: 100px;">OK</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    $(`#${modalId}`).remove();
    
    // Add new modal
    $('body').append(modalHtml);
    
    // Show modal with keyboard support
    const $modal = $(`#${modalId}`);
    $modal.modal({backdrop: 'static', keyboard: true});
    
    // Focus OK button for accessibility
    $modal.on('shown.bs.modal', function() {
        $(this).find('.modern-btn-primary').focus();
    });
    
    // Handle Enter key
    $modal.on('keydown', function(e) {
        if (e.key === 'Enter') {
            $modal.modal('hide');
        }
    });
}

/**
 * Show modern confirm modal using modal.php system
 * 
 * @param {string} message Confirmation message (HTML supported)
 * @param {string} title Modal title
 * @param {function} onConfirm Callback when confirmed
 * @param {function} onCancel Callback when cancelled (optional)
 */
function showModalConfirm(message, title, onConfirm, onCancel = null) {
    const modalId = 'modal_payroll_confirm';
    
    const modalHtml = `
        <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-labelledby="${modalId}Title">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content modern-modal-content" style="border-radius: 10px; overflow: hidden; border: none;">
                    <div class="modal-header modern-modal-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white;">
                        <button type="button" class="close modern-close" data-dismiss="modal" aria-label="Close" style="color: white; opacity: 1; text-shadow: none;">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 class="modal-title" id="${modalId}Title" style="color: white; font-weight: 600;">
                            <i class="fa fa-question-circle"></i> ${title}
                        </h4>
                    </div>
                    <div class="modal-body" style="padding: 30px; font-size: 14px;">
                        ${message}
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid #e9ecef; padding: 15px 30px;">
                        <button type="button" class="btn modern-btn modern-btn-cancel" data-dismiss="modal" style="min-width: 100px;">Cancel</button>
                        <button type="button" class="btn modern-btn modern-btn-primary" id="confirmBtn" style="min-width: 100px;">Confirm</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal
    $(`#${modalId}`).remove();
    
    // Add new modal
    $('body').append(modalHtml);
    
    const $modal = $(`#${modalId}`);
    let confirmed = false;
    
    // Bind confirm button
    $modal.find('#confirmBtn').on('click', function() {
        confirmed = true;
        $modal.modal('hide');
        if (onConfirm) {
            setTimeout(onConfirm, 100); // Slight delay to allow modal to hide
        }
    });
    
    // Handle modal close
    $modal.on('hidden.bs.modal', function() {
        if (!confirmed && onCancel) {
            onCancel();
        }
        $modal.remove(); // Clean up
    });
    
    // Show modal
    $modal.modal({backdrop: 'static', keyboard: true});
    
    // Focus confirm button for accessibility
    $modal.on('shown.bs.modal', function() {
        $(this).find('#confirmBtn').focus();
    });
    
    // Handle Enter key (confirm) and ESC key (cancel)
    $modal.on('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            $modal.find('#confirmBtn').click();
        }
    });
}

/**
 * Helper function to adjust color brightness
 * @param {string} color Hex color
 * @param {number} percent Brightness adjustment (-100 to 100)
 * @returns {string} Adjusted hex color
 */
function adjustColor(color, percent) {
    // Remove # if present
    color = color.replace('#', '');
    
    // Convert to RGB
    let r = parseInt(color.substr(0, 2), 16);
    let g = parseInt(color.substr(2, 2), 16);
    let b = parseInt(color.substr(4, 2), 16);
    
    // Adjust brightness
    r = Math.min(255, Math.max(0, r + (r * percent / 100)));
    g = Math.min(255, Math.max(0, g + (g * percent / 100)));
    b = Math.min(255, Math.max(0, b + (b * percent / 100)));
    
    // Convert back to hex
    return '#' + 
        Math.round(r).toString(16).padStart(2, '0') +
        Math.round(g).toString(16).padStart(2, '0') +
        Math.round(b).toString(16).padStart(2, '0');
}

/**
 * Add modern button styles if not already present
 */
$(document).ready(function() {
    if (!$('#payroll-modal-styles').length) {
        $('head').append(`
            <style id="payroll-modal-styles">
                .modern-modal-content {
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    animation: modalSlideIn 0.3s ease;
                }
                
                @keyframes modalSlideIn {
                    from {
                        transform: translateY(-50px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .modern-btn {
                    padding: 10px 24px;
                    border-radius: 6px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    border: none;
                }
                
                .modern-btn-primary {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .modern-btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                    color: white;
                }
                
                .modern-btn-cancel {
                    background: #f8f9fa;
                    color: #6c757d;
                    border: 1px solid #dee2e6;
                }
                
                .modern-btn-cancel:hover {
                    background: #e9ecef;
                    color: #495057;
                }
                
                .modern-close {
                    font-size: 28px;
                    font-weight: 300;
                    line-height: 1;
                }
                
                .modern-close:hover {
                    opacity: 0.8;
                }
            </style>
        `);
    }
});
