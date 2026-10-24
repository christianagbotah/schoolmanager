(function ($, window) {
    'use strict';

    var config = window.iEduProCashierSmartAllocation || null;
    if (!config || !config.processUrl || !config.smartProcessUrl || typeof $.ajaxPrefilter !== 'function') {
        return;
    }

    function normalizeUrl(url) {
        return String(url || '').replace(/\/+$/, '');
    }

    $.ajaxPrefilter(function (options, originalOptions) {
        var requestedUrl = normalizeUrl((originalOptions && originalOptions.url) || options.url);
        if (requestedUrl !== normalizeUrl(config.processUrl)) {
            return;
        }

        var amount = Math.max(0, parseFloat($('#quickPaymentAmount').val()) || 0);

        // Quick payment blank/zero means Advanced/manual allocation is active.
        // Keep the existing endpoint and exact manual bucket values untouched.
        if (amount <= 0) {
            return;
        }

        options.url = config.smartProcessUrl;

        var extraData = {
            quick_amount: amount.toFixed(2),
            excess_credit_type: $('#excessCreditType').val() || 'feeding'
        };

        if (typeof options.data === 'string') {
            var extraQuery = $.param(extraData);
            options.data = options.data ? options.data + '&' + extraQuery : extraQuery;
        } else {
            options.data = $.extend({}, options.data || {}, extraData);
        }
    });
})(jQuery, window);
