<style>
@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-50px) scale(0.95);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes modalSlideOut {
    from {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
    to {
        opacity: 0;
        transform: translateY(-50px) scale(0.95);
    }
}

@keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.modal.fade .modal-dialog {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
}

.modal.fade.in .modal-dialog {
    transform: translate(0, 0) scale(1);
}

.modal-backdrop.fade {
    transition: opacity 0.3s ease;
}
</style>

<div class="modal fade" id="confirm_modal" tabindex="-1" role="dialog" style="z-index:999999!important;">
    <div class="modal-dialog modal-sm" role="document" style="margin-top: 15vh;">
        <div class="modal-content" style="border-radius: 16px; border: none; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <div class="modal-header" style="border-bottom: none; padding: 20px 20px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative;">
                <button type="button" class="close" data-dismiss="modal" style="color: white; opacity: 0.9; font-size: 28px; font-weight: 300; text-shadow: none; position: absolute; right: 15px; top: 10px; transition: all 0.3s ease;" onmouseover="this.style.opacity='1'; this.style.transform='rotate(90deg)'" onmouseout="this.style.opacity='0.9'; this.style.transform='rotate(0)'">&times;</button>
            </div>
            <div class="modal-body text-center" style="padding: 30px 30px 20px; background: white;">
                <div id="confirm_modal_icon" style="font-size: 72px; margin-bottom: 20px; animation: iconPulse 2s ease-in-out infinite;">
                    <i class="entypo-help-circled" style="color: #f39c12;"></i>
                </div>
                <h4 id="confirm_modal_title" style="margin-bottom: 15px; font-weight: 700; color: #2c3e50; font-size: 18px;">Confirm Action</h4>
                <p id="confirm_modal_message" style="color: #7f8c8d; margin-bottom: 25px; font-size: 15px; line-height: 1.6;">Are you sure you want to proceed?</p>
            </div>
            <div class="modal-footer" style="border-top: 1px solid #ecf0f1; padding: 20px 30px; background: #f8f9fa; display: flex; justify-content: center; gap: 12px;">
                <button type="button" class="btn btn-default" data-dismiss="modal" style="min-width: 120px; padding: 12px 24px; border-radius: 10px; font-weight: 600; border: 2px solid #bdc3c7; background: white; color: #7f8c8d; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);" onmouseover="this.style.borderColor='#95a5a6'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.1)'" onmouseout="this.style.borderColor='#bdc3c7'; this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'"><?php echo get_phrase('cancel'); ?></button>
                <button type="button" class="btn btn-primary" id="confirm_modal_btn" style="min-width: 120px; padding: 12px 24px; border-radius: 10px; font-weight: 600; border: none; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(0,0,0,0.2)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"><?php echo get_phrase('confirm'); ?></button>
            </div>
        </div>
    </div>
</div>

<script>
var confirmCallback = null;

function showConfirmModal(title, message, callback, btnText, iconType) {
    $('#confirm_modal_title').text(title || 'Confirm Action');
    $('#confirm_modal_message').html(message || 'Are you sure?');
    $('#confirm_modal_btn').text(btnText || '<?php echo get_phrase('confirm'); ?>');
    
    var iconHtml = '';
    var btnClass = 'btn-primary';
    
    var btnStyle = '';
    switch(iconType) {
        case 'warning':
            iconHtml = '<i class="entypo-attention" style="color: #f39c12;"></i>';
            btnStyle = 'background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);';
            break;
        case 'danger':
            iconHtml = '<i class="entypo-cancel-circled" style="color: #e74c3c;"></i>';
            btnStyle = 'background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);';
            break;
        case 'info':
            iconHtml = '<i class="entypo-info-circled" style="color: #3498db;"></i>';
            btnStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
            break;
        case 'success':
            iconHtml = '<i class="entypo-check" style="color: #27ae60;"></i>';
            btnStyle = 'background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);';
            break;
        default:
            iconHtml = '<i class="entypo-help-circled" style="color: #f39c12;"></i>';
            btnStyle = 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);';
    }
    
    $('#confirm_modal_icon').html(iconHtml);
    $('#confirm_modal_btn').attr('style', $('#confirm_modal_btn').attr('style').replace(/background:[^;]+;/, '') + btnStyle);
    
    confirmCallback = callback;
    $('#confirm_modal').modal('show');
}

$('#confirm_modal_btn').click(function() {
    if (confirmCallback && typeof confirmCallback === 'function') {
        confirmCallback();
    }
    $('#confirm_modal').modal('hide');
});

$('#confirm_modal').on('hidden.bs.modal', function() {
    confirmCallback = null;
});
</script>
<style>
#confirm_modal{z-index:999999!important;}
#confirm_modal + .modal-backdrop{z-index:999998!important;}
</style>
