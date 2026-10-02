// Bootstrap Modal Fix
(function() {
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof jQuery !== 'undefined') {
            // Store original modal function if it exists
            var originalModal = jQuery.fn.modal;
            
            // Override modal calls to ensure they work
            jQuery.fn.modal = function(option) {
                if (typeof originalModal === 'function') {
                    return originalModal.call(this, option);
                }
                console.warn('Bootstrap modal not loaded yet');
                return this;
            };
        }
    });
})();
