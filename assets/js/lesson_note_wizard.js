/**
 * GES Lesson Note System - Wizard JavaScript Module
 * Requirements: 7.1, 7.4, 7.5, 7.6, 7.7, 7.8
 * 
 * Features:
 * - Step navigation with validation
 * - Progress indicator updates
 * - Draft saving via AJAX
 * - Form state preservation
 * - Mobile-optimized touch interactions
 */

(function() {
    'use strict';

    // ============================================
    // WIZARD CONFIGURATION
    // ============================================
    const WizardConfig = {
        totalSteps: 4,
        currentStep: 1,
        autoSaveInterval: 30000, // 30 seconds
        debounceDelay: 300,
        storageKey: 'lesson_note_draft'
    };

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Debounce function for performance optimization
     */
    function debounce(func, wait) {
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

    /**
     * Check if device is mobile
     */
    function isMobile() {
        return window.innerWidth < 768 || ('ontouchstart' in window);
    }

    /**
     * Show toast notification
     */
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform translate-y-full opacity-0`;
        
        const colors = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        toast.classList.add(...colors[type].split(' '));
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-y-full', 'opacity-0');
        }, 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-full', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // FORM STATE MANAGEMENT
    // ============================================
    
    const FormState = {
        /**
         * Save form state to localStorage
         */
        save: function() {
            const form = document.getElementById('lesson-note-form');
            if (!form) return;
            
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                if (data[key]) {
                    // Handle multiple values (arrays)
                    if (!Array.isArray(data[key])) {
                        data[key] = [data[key]];
                    }
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            }
            
            // Save timestamp
            data._savedAt = new Date().toISOString();
            
            try {
                localStorage.setItem(WizardConfig.storageKey, JSON.stringify(data));
                return true;
            } catch (e) {
                console.error('Failed to save form state:', e);
                return false;
            }
        },

        /**
         * Restore form state from localStorage
         */
        restore: function() {
            try {
                const saved = localStorage.getItem(WizardConfig.storageKey);
                if (!saved) return false;
                
                const data = JSON.parse(saved);
                
                // Check if data is too old (more than 24 hours)
                const savedAt = new Date(data._savedAt);
                const now = new Date();
                const hoursDiff = (now - savedAt) / (1000 * 60 * 60);
                
                if (hoursDiff > 24) {
                    this.clear();
                    return false;
                }
                
                // Restore form values
                for (let [key, value] of Object.entries(data)) {
                    if (key === '_savedAt') continue;
                    
                    const field = document.querySelector(`[name="${key}"]`);
                    if (!field) continue;
                    
                    if (field.type === 'checkbox' || field.type === 'radio') {
                        const values = Array.isArray(value) ? value : [value];
                        document.querySelectorAll(`[name="${key}"]`).forEach(el => {
                            el.checked = values.includes(el.value);
                        });
                    } else {
                        field.value = value;
                    }
                }
                
                return true;
            } catch (e) {
                console.error('Failed to restore form state:', e);
                return false;
            }
        },

        /**
         * Clear saved form state
         */
        clear: function() {
            try {
                localStorage.removeItem(WizardConfig.storageKey);
                return true;
            } catch (e) {
                console.error('Failed to clear form state:', e);
                return false;
            }
        }
    };

    // ============================================
    // STEP NAVIGATION
    // ============================================
    
    const StepNavigation = {
        /**
         * Go to a specific step
         */
        goTo: function(stepNumber) {
            if (stepNumber < 1 || stepNumber > WizardConfig.totalSteps) return;
            
            // Validate current step before moving forward
            if (stepNumber > WizardConfig.currentStep) {
                if (!this.validateCurrentStep()) {
                    showToast('Please fill in all required fields', 'error');
                    return;
                }
            }
            
            // Hide all steps
            document.querySelectorAll('.wizard-step-content').forEach(el => {
                el.classList.add('hidden');
            });
            
            // Show target step
            const targetStep = document.querySelector(`[data-step="${stepNumber}"]`);
            if (targetStep) {
                targetStep.classList.remove('hidden');
            }
            
            // Update step indicators
            this.updateIndicators(stepNumber);
            
            // Update current step
            WizardConfig.currentStep = stepNumber;
            
            // Scroll to top on mobile
            if (isMobile()) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            // Save state
            FormState.save();
        },

        /**
         * Go to next step
         */
        next: function() {
            this.goTo(WizardConfig.currentStep + 1);
        },

        /**
         * Go to previous step
         */
        previous: function() {
            this.goTo(WizardConfig.currentStep - 1);
        },

        /**
         * Validate current step
         */
        validateCurrentStep: function() {
            const currentStepEl = document.querySelector(`[data-step="${WizardConfig.currentStep}"]`);
            if (!currentStepEl) return true;
            
            const requiredFields = currentStepEl.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('border-red-500');
                    isValid = false;
                } else {
                    field.classList.remove('border-red-500');
                }
            });
            
            return isValid;
        },

        /**
         * Update step indicators
         */
        updateIndicators: function(activeStep) {
            document.querySelectorAll('.wizard-step-indicator').forEach((el, index) => {
                const stepNum = index + 1;
                
                el.classList.remove('active', 'completed');
                
                if (stepNum < activeStep) {
                    el.classList.add('completed');
                } else if (stepNum === activeStep) {
                    el.classList.add('active');
                }
            });
            
            // Update progress bar
            const progressBar = document.querySelector('.wizard-progress-bar');
            if (progressBar) {
                const progress = ((activeStep - 1) / (WizardConfig.totalSteps - 1)) * 100;
                progressBar.style.width = `${progress}%`;
            }
        }
    };

    // ============================================
    // DRAFT SAVING
    // ============================================
    
    const DraftManager = {
        autoSaveTimer: null,

        /**
         * Save draft via AJAX
         */
        save: function() {
            const form = document.getElementById('lesson-note-form');
            if (!form) return;
            
            const formData = new FormData(form);
            formData.append('save_action', 'draft');
            
            fetch(site_url('teacher/lesson_note_save_draft'), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    showToast('Draft saved', 'success');
                    FormState.save();
                } else {
                    showToast('Failed to save draft', 'error');
                }
            })
            .catch(error => {
                console.error('Draft save error:', error);
                showToast('Failed to save draft', 'error');
            });
        },

        /**
         * Start auto-save timer
         */
        startAutoSave: function() {
            this.stopAutoSave();
            this.autoSaveTimer = setInterval(() => {
                FormState.save();
            }, WizardConfig.autoSaveInterval);
        },

        /**
         * Stop auto-save timer
         */
        stopAutoSave: function() {
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
                this.autoSaveTimer = null;
            }
        }
    };

    // ============================================
    // CURRICULUM SELECTOR (with Lazy Loading)
    // ============================================
    
    const CurriculumSelector = {
        cache: {},
        pendingRequests: {},
        lazyLoadQueue: [],

        /**
         * Load curriculum data via AJAX with lazy loading support
         */
        load: function(type, parentId, targetSelect) {
            const cacheKey = `${type}_${parentId}`;
            
            // Check cache first
            if (this.cache[cacheKey]) {
                this.populateSelect(targetSelect, this.cache[cacheKey]);
                return Promise.resolve();
            }
            
            // Check if request is already pending (deduplication)
            if (this.pendingRequests[cacheKey]) {
                return this.pendingRequests[cacheKey];
            }
            
            const url = `teacher/get_curriculum_${type}?${type}_id=${parentId}`;
            
            // Create and store the promise
            const request = fetch(site_url(url), {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    this.cache[cacheKey] = data.data;
                    this.populateSelect(targetSelect, data.data);
                }
            })
            .catch(error => {
                console.error('Curriculum load error:', error);
            })
            .finally(() => {
                // Remove from pending requests
                delete this.pendingRequests[cacheKey];
            });
            
            this.pendingRequests[cacheKey] = request;
            return request;
        },

        /**
         * Lazy load curriculum data when element becomes visible
         */
        lazyLoad: function(element, type, parentId) {
            if (!('IntersectionObserver' in window)) {
                // Fallback for older browsers
                this.load(type, parentId, element);
                return;
            }
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.load(type, parentId, element);
                        observer.unobserve(element);
                    }
                });
            }, { rootMargin: '100px' });
            
            observer.observe(element);
        },

        /**
         * Preload curriculum data for better UX
         */
        preload: function(classId, subjectId) {
            // Preload strands when class/subject selected
            if (classId && subjectId) {
                this.load('strands', `${classId},${subjectId}`, document.querySelector('[name="strand_id"]'));
            }
        },

        /**
         * Clear cache (useful when curriculum data is updated)
         */
        clearCache: function() {
            this.cache = {};
        },

        /**
         * Populate select element with options
         */
        populateSelect: function(select, data) {
            select.innerHTML = '<option value="">-- Select --</option>';
            
            data.forEach(item => {
                const option = document.createElement('option');
                option.value = item.id || item[`${select.name.replace('_id', '')}_id`];
                option.textContent = item.name || item.code;
                select.appendChild(option);
            });
        },

        /**
         * Initialize cascading dropdowns
         */
        init: function() {
            const classSelect = document.querySelector('[name="class_id"]');
            const subjectSelect = document.querySelector('[name="subject_id"]');
            const strandSelect = document.querySelector('[name="strand_id"]');
            const subStrandSelect = document.querySelector('[name="sub_strand_id"]');
            const contentStandardSelect = document.querySelector('[name="content_standard_id"]');
            
            if (classSelect && subjectSelect) {
                classSelect.addEventListener('change', debounce(() => {
                    if (classSelect.value && subjectSelect.value) {
                        this.load('strands', `${classSelect.value},${subjectSelect.value}`, strandSelect);
                    }
                }, WizardConfig.debounceDelay));
                
                subjectSelect.addEventListener('change', debounce(() => {
                    if (classSelect.value && subjectSelect.value) {
                        this.load('strands', `${classSelect.value},${subjectSelect.value}`, strandSelect);
                    }
                }, WizardConfig.debounceDelay));
            }
            
            if (strandSelect) {
                strandSelect.addEventListener('change', debounce(() => {
                    if (strandSelect.value) {
                        this.load('sub_strands', strandSelect.value, subStrandSelect);
                    }
                }, WizardConfig.debounceDelay));
            }
            
            if (subStrandSelect) {
                subStrandSelect.addEventListener('change', debounce(() => {
                    if (subStrandSelect.value) {
                        this.load('content_standards', subStrandSelect.value, contentStandardSelect);
                    }
                }, WizardConfig.debounceDelay));
            }
        }
    };

    // ============================================
    // DYNAMIC FORM ENTRIES
    // ============================================
    
    const DynamicEntries = {
        /**
         * Add a new entry row
         */
        add: function(containerId, templateId) {
            const container = document.getElementById(containerId);
            const template = document.getElementById(templateId);
            
            if (!container || !template) return;
            
            const clone = template.content.cloneNode(true);
            const index = container.children.length;
            
            // Update index in names
            clone.querySelectorAll('[name]').forEach(el => {
                el.name = el.name.replace('__INDEX__', index);
            });
            
            container.appendChild(clone);
            
            // Scroll to new entry on mobile
            if (isMobile()) {
                clone.firstElementChild?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        },

        /**
         * Remove an entry row
         */
        remove: function(button) {
            const entry = button.closest('.dynamic-entry');
            if (entry) {
                entry.remove();
            }
        }
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    
    function init() {
        // Restore form state
        FormState.restore();
        
        // Initialize curriculum selector
        CurriculumSelector.init();
        
        // Start auto-save
        DraftManager.startAutoSave();
        
        // Bind navigation buttons
        document.querySelectorAll('[data-action="next-step"]').forEach(btn => {
            btn.addEventListener('click', () => StepNavigation.next());
        });
        
        document.querySelectorAll('[data-action="prev-step"]').forEach(btn => {
            btn.addEventListener('click', () => StepNavigation.previous());
        });
        
        document.querySelectorAll('[data-action="go-step"]').forEach(btn => {
            btn.addEventListener('click', () => {
                StepNavigation.goTo(parseInt(btn.dataset.step));
            });
        });
        
        // Bind dynamic entry buttons
        document.querySelectorAll('[data-action="add-entry"]').forEach(btn => {
            btn.addEventListener('click', () => {
                DynamicEntries.add(btn.dataset.container, btn.dataset.template);
            });
        });
        
        document.querySelectorAll('[data-action="remove-entry"]').forEach(btn => {
            btn.addEventListener('click', () => DynamicEntries.remove(btn));
        });
        
        // Save draft button
        document.querySelectorAll('[data-action="save-draft"]').forEach(btn => {
            btn.addEventListener('click', () => DraftManager.save());
        });
        
        // Form submission
        const form = document.getElementById('lesson-note-form');
        if (form) {
            form.addEventListener('submit', function(e) {
                const saveAction = document.querySelector('[name="save_action"]');
                if (saveAction && saveAction.value === 'draft') {
                    e.preventDefault();
                    DraftManager.save();
                } else {
                    // Clear saved state on successful submission
                    FormState.clear();
                }
            });
        }
        
        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', function(e) {
            FormState.save();
        });
        
        // Handle visibility change (tab switch)
        document.addEventListener('visibilitychange', function() {
            if (document.visibilityState === 'hidden') {
                FormState.save();
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose to global scope for inline handlers
    window.LessonNoteWizard = {
        goToStep: StepNavigation.goTo.bind(StepNavigation),
        saveDraft: DraftManager.save.bind(DraftManager),
        addEntry: DynamicEntries.add.bind(DynamicEntries),
        removeEntry: DynamicEntries.remove.bind(DynamicEntries)
    };

})();
