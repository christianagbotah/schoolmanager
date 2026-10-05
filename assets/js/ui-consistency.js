(function () {
    'use strict';

    var scheduled = false;

    function syncTopbarHeight() {
        scheduled = false;
        var topbar = document.getElementById('top');
        if (!topbar) return;
        var height = Math.ceil(topbar.getBoundingClientRect().height || topbar.offsetHeight || 0);
        if (height > 0) {
            document.documentElement.style.setProperty('--sm-topbar-height-dynamic', height + 'px');
        }
    }

    function scheduleSync() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(syncTopbarHeight);
    }

    document.addEventListener('DOMContentLoaded', scheduleSync);
    window.addEventListener('load', scheduleSync);
    window.addEventListener('resize', scheduleSync, { passive: true });

    if (window.ResizeObserver) {
        document.addEventListener('DOMContentLoaded', function () {
            var topbar = document.getElementById('top');
            if (!topbar) return;
            var observer = new ResizeObserver(scheduleSync);
            observer.observe(topbar);
        });
    }

    // AJAX navigation replaces #main_page contents but not the shell; re-measure
    // after common jQuery ajax completions in case header actions wrap differently.
    if (window.jQuery) {
        window.jQuery(document).ajaxComplete(scheduleSync);
    }
})();
