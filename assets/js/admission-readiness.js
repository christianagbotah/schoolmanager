(function () {
  'use strict';

  var form = document.getElementById('student_single_add_form');
  if (!form) return;

  var style = document.createElement('style');
  style.textContent = [
    '.admission-readiness{position:sticky;top:78px;z-index:30;margin:18px 0 4px;padding:14px 16px;border:1px solid #dbeafe;border-radius:14px;background:rgba(255,255,255,.96);box-shadow:0 8px 24px rgba(15,23,42,.10);backdrop-filter:blur(10px)}',
    '.admission-readiness__top{display:flex;align-items:center;justify-content:space-between;gap:14px}',
    '.admission-readiness__title{margin:0;color:#0f172a;font-size:14px;font-weight:800}',
    '.admission-readiness__meta{margin:3px 0 0;color:#64748b;font-size:12px;font-weight:600}',
    '.admission-readiness__action{border:0;border-radius:9px;background:#2563eb;color:#fff;padding:9px 13px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap}',
    '.admission-readiness__action:hover{background:#1d4ed8}',
    '.admission-readiness__action:focus-visible{outline:3px solid rgba(37,99,235,.25);outline-offset:2px}',
    '.admission-readiness__track{height:8px;margin-top:11px;border-radius:999px;background:#e2e8f0;overflow:hidden}',
    '.admission-readiness__bar{height:100%;width:0;border-radius:999px;background:linear-gradient(90deg,#2563eb,#0ea5e9);transition:width .2s ease}',
    '.admission-readiness__status{margin:8px 0 0;color:#475569;font-size:11px;font-weight:700}',
    '.admission-readiness.is-complete{border-color:#a7f3d0;background:rgba(236,253,245,.97)}',
    '.admission-readiness.is-complete .admission-readiness__bar{background:linear-gradient(90deg,#059669,#10b981)}',
    '.admission-readiness-missing{outline:3px solid rgba(239,68,68,.18)!important;outline-offset:2px!important}',
    '@media (max-width:767px){.admission-readiness{top:8px;margin:10px 0;padding:12px}.admission-readiness__top{align-items:flex-start}.admission-readiness__title{font-size:13px}.admission-readiness__action{padding:8px 10px;font-size:11px;max-width:46%}}'
  ].join('');
  document.head.appendChild(style);

  var panel = document.createElement('section');
  panel.className = 'admission-readiness';
  panel.setAttribute('aria-label', 'Admission form readiness');
  panel.innerHTML = '' +
    '<div class="admission-readiness__top">' +
      '<div>' +
        '<h3 class="admission-readiness__title">Admission readiness</h3>' +
        '<p class="admission-readiness__meta"><span id="admissionReadinessCount">0 of 0</span> required fields complete</p>' +
      '</div>' +
      '<button type="button" id="admissionReadinessReview" class="admission-readiness__action">Review missing field</button>' +
    '</div>' +
    '<div id="admissionReadinessProgress" class="admission-readiness__track" role="progressbar" aria-label="Required admission fields completed" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">' +
      '<div class="admission-readiness__bar"></div>' +
    '</div>' +
    '<p id="admissionReadinessStatus" class="admission-readiness__status" aria-live="polite">Complete the required admission details to continue.</p>';

  form.insertBefore(panel, form.firstChild);

  var countLabel = panel.querySelector('#admissionReadinessCount');
  var progress = panel.querySelector('#admissionReadinessProgress');
  var bar = panel.querySelector('.admission-readiness__bar');
  var status = panel.querySelector('#admissionReadinessStatus');
  var reviewButton = panel.querySelector('#admissionReadinessReview');

  function requiredControls() {
    return Array.prototype.slice.call(form.querySelectorAll('[required]')).filter(function (control) {
      return !control.disabled && control.type !== 'hidden';
    });
  }

  function hasValue(control) {
    if (control.type === 'checkbox' || control.type === 'radio') {
      return control.checked;
    }
    return String(control.value || '').trim() !== '';
  }

  function firstMissingRequired() {
    var controls = requiredControls();
    for (var i = 0; i < controls.length; i += 1) {
      if (!hasValue(controls[i])) return controls[i];
    }
    return null;
  }

  function fieldLabel(control) {
    var field = control.closest ? control.closest('.form-field') : null;
    var label = field ? field.querySelector('label') : null;
    if (label && label.textContent) {
      return label.textContent.replace('*', '').trim();
    }
    return control.getAttribute('aria-label') || control.name || 'required field';
  }

  function updateAdmissionReadiness() {
    var controls = requiredControls();
    var complete = controls.filter(hasValue).length;
    var total = controls.length;
    var percent = total ? Math.round((complete / total) * 100) : 100;
    var missing = firstMissingRequired();

    countLabel.textContent = complete + ' of ' + total;
    progress.setAttribute('aria-valuenow', String(percent));
    bar.style.width = percent + '%';
    panel.classList.toggle('is-complete', !missing);

    if (!missing) {
      status.textContent = 'All required admission fields are complete. You can review and admit the student.';
      reviewButton.textContent = 'Required fields complete';
      reviewButton.disabled = true;
      reviewButton.setAttribute('aria-disabled', 'true');
    } else {
      status.textContent = 'Next required item: ' + fieldLabel(missing) + '.';
      reviewButton.textContent = 'Review missing field';
      reviewButton.disabled = false;
      reviewButton.removeAttribute('aria-disabled');
    }
  }

  function focusMissingControl(control) {
    if (!control) return;

    var oldMissing = form.querySelector('.admission-readiness-missing');
    if (oldMissing) oldMissing.classList.remove('admission-readiness-missing');

    var target = control.closest ? (control.closest('.form-field') || control) : control;
    target.classList.add('admission-readiness-missing');
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    window.setTimeout(function () {
      var select2Container = control.nextElementSibling && control.nextElementSibling.classList && control.nextElementSibling.classList.contains('select2-container')
        ? control.nextElementSibling
        : null;
      if (select2Container) {
        var select2Focus = select2Container.querySelector('.select2-selection');
        if (select2Focus) select2Focus.focus();
      } else if (typeof control.focus === 'function') {
        control.focus({ preventScroll: true });
      }
    }, 280);
  }

  reviewButton.addEventListener('click', function () {
    focusMissingControl(firstMissingRequired());
  });

  form.addEventListener('input', updateAdmissionReadiness, true);
  form.addEventListener('change', updateAdmissionReadiness, true);

  if (window.jQuery) {
    window.jQuery(form).on('select2:select select2:clear', updateAdmissionReadiness);
  }

  var observer = new MutationObserver(function (mutations) {
    var requiredChanged = mutations.some(function (mutation) {
      return mutation.type === 'attributes' && (mutation.attributeName === 'required' || mutation.attributeName === 'disabled');
    });
    if (requiredChanged) updateAdmissionReadiness();
  });
  observer.observe(form, { subtree: true, attributes: true, attributeFilter: ['required', 'disabled'] });

  updateAdmissionReadiness();
})();
