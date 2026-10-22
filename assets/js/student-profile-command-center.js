(function () {
    'use strict';

    function bootStudentProfileCommandCenter() {
        var studentSelector = document.getElementById('other_students');
        if (!studentSelector || document.querySelector('[data-student-command-center]')) {
            return;
        }

        var pageRoot = studentSelector.closest('.min-h-screen') || document.getElementById('main_page');
        if (!pageRoot) {
            return;
        }

        var profileCard = pageRoot.querySelector('.lg\\:col-span-1 .profile-card') || pageRoot.querySelector('.profile-card');
        var studentNameNode = profileCard ? profileCard.querySelector('h2') : null;
        var classLink = profileCard ? profileCard.querySelector('a[href*="student_information/"]') : null;
        var statusNode = profileCard ? profileCard.querySelector('span.absolute') : null;
        var editButton = profileCard ? profileCard.querySelector('button[onclick*="destroySelect2"]') : null;
        var profileHeader = pageRoot.querySelector('.mb-6.sticky-header');

        if (!profileHeader) {
            return;
        }

        var studentName = studentNameNode ? studentNameNode.textContent.trim() : 'Student';
        var classLabel = classLink ? classLink.textContent.replace(/\s+/g, ' ').trim() : 'Student record';
        var statusLabel = statusNode ? statusNode.textContent.trim() : '';

        var styles = document.createElement('style');
        styles.setAttribute('data-student-command-center-style', 'true');
        styles.textContent = [
            '.student-command-center{margin:-2px 0 20px;background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 8px 24px rgba(15,23,42,.07);overflow:hidden}',
            '.student-command-summary{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:18px 20px;background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff}',
            '.student-command-copy{min-width:0}.student-command-eyebrow{display:block;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;margin-bottom:4px}',
            '.student-command-name{display:block;font-size:20px;font-weight:900;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
            '.student-command-meta{margin-top:5px;font-size:13px;color:#dbeafe;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
            '.student-command-status{flex:0 0 auto;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.12);border-radius:999px;padding:7px 11px;font-size:11px;font-weight:900;letter-spacing:.04em}',
            '.student-command-actions{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:12px}',
            '.student-command-action{appearance:none;border:1px solid #e2e8f0;background:#fff;color:#0f172a;border-radius:12px;min-height:48px;padding:9px 10px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:13px;text-align:center;text-decoration:none;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s}',
            '.student-command-action:hover,.student-command-action:focus{color:#1d4ed8;border-color:#93c5fd;box-shadow:0 5px 14px rgba(37,99,235,.10);text-decoration:none;transform:translateY(-1px);outline:none}',
            '.student-command-action i{font-size:16px;color:#2563eb}',
            '.student-command-action[hidden]{display:none!important}',
            '.student-command-center + .grid .profile-card{scroll-margin-top:145px}',
            '@media (max-width:767px){.student-command-center{border-radius:14px;margin-bottom:14px}.student-command-summary{padding:14px 15px;align-items:flex-start}.student-command-name{font-size:17px}.student-command-meta{font-size:12px;white-space:normal}.student-command-status{padding:5px 8px}.student-command-actions{display:flex;overflow-x:auto;gap:7px;padding:9px;scrollbar-width:thin}.student-command-action{flex:0 0 auto;min-width:112px;min-height:44px;padding:8px 10px}.tab-modern{white-space:nowrap}.profile-card{scroll-margin-top:120px}}'
        ].join('');
        document.head.appendChild(styles);

        var commandCenter = document.createElement('section');
        commandCenter.setAttribute('data-student-command-center', 'true');
        commandCenter.setAttribute('aria-label', 'Student profile quick actions');
        commandCenter.className = 'student-command-center';
        commandCenter.innerHTML = '' +
            '<div class="student-command-summary">' +
                '<div class="student-command-copy">' +
                    '<span class="student-command-eyebrow">Student command center</span>' +
                    '<span class="student-command-name"></span>' +
                    '<div class="student-command-meta"></div>' +
                '</div>' +
                '<span class="student-command-status" hidden></span>' +
            '</div>' +
            '<div class="student-command-actions">' +
                '<a class="student-command-action" data-command="class" href="#"><i class="fa fa-arrow-left"></i><span>Class List</span></a>' +
                '<button class="student-command-action" data-command="edit" type="button"><i class="entypo-pencil"></i><span>Edit Profile</span></button>' +
                '<button class="student-command-action" data-command-target="parent_info" type="button"><i class="entypo-user"></i><span>Parent</span></button>' +
                '<button class="student-command-action" data-command-target="exams" type="button"><i class="entypo-graduation-cap"></i><span>Exams</span></button>' +
                '<button class="student-command-action" data-command-target="account" type="button"><i class="entypo-credit-card"></i><span>Accounts</span></button>' +
            '</div>';

        commandCenter.querySelector('.student-command-name').textContent = studentName;
        commandCenter.querySelector('.student-command-meta').textContent = classLabel;

        var statusBadge = commandCenter.querySelector('.student-command-status');
        if (statusLabel) {
            statusBadge.textContent = statusLabel;
            statusBadge.hidden = false;
        }

        var classAction = commandCenter.querySelector('[data-command="class"]');
        if (classLink && classLink.href) {
            classAction.href = classLink.href;
        } else {
            classAction.hidden = true;
        }

        var editAction = commandCenter.querySelector('[data-command="edit"]');
        if (editButton) {
            editAction.addEventListener('click', function () {
                editButton.click();
            });
        } else {
            editAction.hidden = true;
        }

        var tabSelectors = {
            parent_info: 'button[data-tab="parent_info"]',
            exams: 'button[data-tab="exams"]',
            account: 'button[data-tab="account"]'
        };

        Object.keys(tabSelectors).forEach(function (tabName) {
            var command = commandCenter.querySelector('[data-command-target="' + tabName + '"]');
            var existingTab = pageRoot.querySelector(tabSelectors[tabName]);
            if (!existingTab) {
                command.hidden = true;
                return;
            }
            command.addEventListener('click', function () {
                existingTab.click();
                window.requestAnimationFrame(function () {
                    var tabs = existingTab.closest('.profile-card');
                    if (tabs && typeof tabs.scrollIntoView === 'function') {
                        tabs.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
        });

        profileHeader.insertAdjacentElement('afterend', commandCenter);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootStudentProfileCommandCenter);
    } else {
        bootStudentProfileCommandCenter();
    }
}());
