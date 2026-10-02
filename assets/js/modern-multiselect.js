/**
 * Modern Multi-Select Component
 * A lightweight, native JavaScript replacement for Select2
 * No external dependencies required
 * 
 * Features:
 * - Real-time search with highlighting
 * - Grouped options with visual badges
 * - Multi-select with tag display
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Responsive design
 * - Works seamlessly with dynamic DOM updates
 */

class ModernMultiSelect {
    constructor(selectElement, options = {}) {
        this.selectElement = selectElement;
        // Read placeholder from select element's placeholder attribute, or use default
        const elementPlaceholder = selectElement.getAttribute('placeholder') || 'Select items...';
        this.options = {
            placeholder: options.placeholder || elementPlaceholder,
            searchPlaceholder: options.searchPlaceholder || 'Search...',
            noResultsText: options.noResultsText || 'No results found',
            maxHeight: options.maxHeight || '300px',
            ...options
        };
        
        this.selectedValues = [];
        this.isOpen = false;
        this.focusedIndex = -1;
        this.filteredOptions = [];
        
        this.init();
    }
    
    init() {
        // Hide original select
        this.selectElement.style.display = 'none';
        
        // Get initial selected values
        this.syncFromSelect();
        
        // Create custom UI
        this.createUI();
        
        // Bind events
        this.bindEvents();
        
        // Parse options from original select
        this.parseOptions();
    }
    
    syncFromSelect() {
        const selected = Array.from(this.selectElement.selectedOptions);
        this.selectedValues = selected.map(opt => opt.value);
    }
    
    createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.className = 'modern-multiselect';
        
        // Selection display area
        this.selectionBox = document.createElement('div');
        this.selectionBox.className = 'multiselect-selection';
        this.selectionBox.innerHTML = `
            <div class="multiselect-tags" data-tags></div>
            <input type="text" class="multiselect-search" placeholder="${this.options.searchPlaceholder}" data-search>
        `;
        
        // Dropdown
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'multiselect-dropdown';
        this.dropdown.style.maxHeight = this.options.maxHeight;
        this.dropdown.innerHTML = '<div class="multiselect-options" data-options></div>';
        
        this.container.appendChild(this.selectionBox);
        this.container.appendChild(this.dropdown);
        
        // Insert after select element
        this.selectElement.parentNode.insertBefore(this.container, this.selectElement.nextSibling);
        
        // Cache elements
        this.searchInput = this.container.querySelector('[data-search]');
        this.tagsContainer = this.container.querySelector('[data-tags]');
        this.optionsContainer = this.container.querySelector('[data-options]');
    }
    
    parseOptions() {
        this.groups = [];
        const optgroups = this.selectElement.querySelectorAll('optgroup');
        
        if (optgroups.length > 0) {
            optgroups.forEach(group => {
                const groupData = {
                    label: group.label,
                    options: []
                };
                
                Array.from(group.querySelectorAll('option')).forEach(opt => {
                    groupData.options.push({
                        value: opt.value,
                        text: opt.textContent.trim(),
                        category: opt.dataset.category || '',
                        selected: this.selectedValues.includes(opt.value)
                    });
                });
                
                this.groups.push(groupData);
            });
        } else {
            // No groups
            const groupData = {
                label: '',
                options: []
            };
            
            Array.from(this.selectElement.querySelectorAll('option')).forEach(opt => {
                groupData.options.push({
                    value: opt.value,
                    text: opt.textContent.trim(),
                    category: opt.dataset.category || '',
                    selected: this.selectedValues.includes(opt.value)
                });
            });
            
            this.groups.push(groupData);
        }
        
        this.renderTags();
        this.renderOptions();
    }
    
    renderTags() {
        this.tagsContainer.innerHTML = '';
        
        this.selectedValues.forEach(value => {
            const option = this.findOptionByValue(value);
            if (!option) return;
            
            const tag = document.createElement('span');
            tag.className = 'multiselect-tag';
            tag.dataset.value = value;
            
            const badge = this.getBadgeHTML(option.category);
            
            tag.innerHTML = `
                <span class="tag-text">${this.escapeHtml(option.text)} ${badge}</span>
                <button type="button" class="tag-remove" data-remove="${value}" aria-label="Remove ${option.text}">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            `;
            
            this.tagsContainer.appendChild(tag);
        });
        
        // Update placeholder visibility
        if (this.selectedValues.length === 0) {
            this.searchInput.placeholder = this.options.placeholder;
        } else {
            this.searchInput.placeholder = this.options.searchPlaceholder;
        }
    }
    
    renderOptions(searchTerm = '') {
        this.optionsContainer.innerHTML = '';
        this.filteredOptions = [];
        let optionIndex = 0;
        
        this.groups.forEach(group => {
            const filteredGroupOptions = group.options.filter(opt => {
                if (searchTerm) {
                    return opt.text.toLowerCase().includes(searchTerm.toLowerCase());
                }
                return true;
            });
            
            if (filteredGroupOptions.length === 0) return;
            
            // Add group header if label exists
            if (group.label) {
                const groupHeader = document.createElement('div');
                groupHeader.className = 'multiselect-group-header';
                groupHeader.textContent = group.label;
                this.optionsContainer.appendChild(groupHeader);
            }
            
            // Add options
            filteredGroupOptions.forEach(opt => {
                const optionEl = document.createElement('div');
                optionEl.className = 'multiselect-option';
                optionEl.dataset.value = opt.value;
                optionEl.dataset.index = optionIndex;
                
                if (this.selectedValues.includes(opt.value)) {
                    optionEl.classList.add('selected');
                }
                
                const badge = this.getBadgeHTML(opt.category);
                const highlightedText = this.highlightSearch(opt.text, searchTerm);
                
                optionEl.innerHTML = `
                    <div class="option-checkbox">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="check-icon">
                            <path d="M13.3333 4L6 11.3333L2.66667 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div class="option-text">${highlightedText} ${badge}</div>
                `;
                
                this.optionsContainer.appendChild(optionEl);
                this.filteredOptions.push({ element: optionEl, value: opt.value });
                optionIndex++;
            });
        });
        
        // Show no results message
        if (this.filteredOptions.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'multiselect-no-results';
            noResults.textContent = this.options.noResultsText;
            this.optionsContainer.appendChild(noResults);
        }
        
        this.focusedIndex = -1;
    }
    
    highlightSearch(text, searchTerm) {
        if (!searchTerm) return this.escapeHtml(text);
        
        const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
        return this.escapeHtml(text).replace(regex, '<mark>$1</mark>');
    }
    
    getBadgeHTML(category) {
        if (!category) return '';
        
        const badgeClass = `badge-${category}`;
        const badgeText = category.replace('_', '-');
        return `<span class="${badgeClass}">${badgeText}</span>`;
    }
    
    findOptionByValue(value) {
        for (const group of this.groups) {
            const option = group.options.find(opt => opt.value === value);
            if (option) return option;
        }
        return null;
    }
    
    bindEvents() {
        // Click on selection box to toggle dropdown
        this.selectionBox.addEventListener('click', (e) => {
            if (e.target.closest('[data-remove]')) return;
            this.toggleDropdown();
        });
        
        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.renderOptions(e.target.value);
        });
        
        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        // Option selection
        this.optionsContainer.addEventListener('click', (e) => {
            const option = e.target.closest('.multiselect-option');
            if (!option) return;
            
            const value = option.dataset.value;
            this.toggleSelection(value);
        });
        
        // Tag removal
        this.tagsContainer.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-remove]');
            if (!removeBtn) return;
            
            const value = removeBtn.dataset.remove;
            this.toggleSelection(value);
            e.stopPropagation();
        });
        
        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target)) {
                this.closeDropdown();
            }
        });
    }
    
    handleKeyboard(e) {
        if (!this.isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault();
            this.openDropdown();
            return;
        }
        
        if (!this.isOpen) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusPrevious();
                break;
            case 'Enter':
                e.preventDefault();
                this.selectFocused();
                break;
            case 'Escape':
                e.preventDefault();
                this.closeDropdown();
                break;
        }
    }
    
    focusNext() {
        if (this.filteredOptions.length === 0) return;
        
        this.focusedIndex = Math.min(this.focusedIndex + 1, this.filteredOptions.length - 1);
        this.updateFocus();
    }
    
    focusPrevious() {
        if (this.filteredOptions.length === 0) return;
        
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.updateFocus();
    }
    
    updateFocus() {
        this.filteredOptions.forEach((opt, index) => {
            if (index === this.focusedIndex) {
                opt.element.classList.add('focused');
                opt.element.scrollIntoView({ block: 'nearest' });
            } else {
                opt.element.classList.remove('focused');
            }
        });
    }
    
    selectFocused() {
        if (this.focusedIndex < 0 || this.focusedIndex >= this.filteredOptions.length) return;
        
        const focusedOption = this.filteredOptions[this.focusedIndex];
        this.toggleSelection(focusedOption.value);
    }
    
    toggleSelection(value) {
        const index = this.selectedValues.indexOf(value);
        
        if (index > -1) {
            this.selectedValues.splice(index, 1);
        } else {
            this.selectedValues.push(value);
        }
        
        this.updateSelect();
        this.renderTags();
        this.renderOptions(this.searchInput.value);
        
        // Trigger change event
        this.selectElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    updateSelect() {
        Array.from(this.selectElement.options).forEach(opt => {
            opt.selected = this.selectedValues.includes(opt.value);
        });
    }
    
    toggleDropdown() {
        if (this.isOpen) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }
    
    openDropdown() {
        this.isOpen = true;
        this.container.classList.add('open');
        this.searchInput.focus();
        this.renderOptions(this.searchInput.value);
    }
    
    closeDropdown() {
        this.isOpen = false;
        this.container.classList.remove('open');
        this.searchInput.value = '';
        this.searchInput.blur();
        this.focusedIndex = -1;
    }
    
    getValue() {
        return this.selectedValues;
    }
    
    setValue(values) {
        this.selectedValues = Array.isArray(values) ? values : [values];
        this.updateSelect();
        this.renderTags();
        this.renderOptions();
    }
    
    destroy() {
        this.container.remove();
        this.selectElement.style.display = '';
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Auto-initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance storage if it doesn't exist
    if (!window.modernMultiSelectInstances) {
        window.modernMultiSelectInstances = {};
    }
    
    document.querySelectorAll('.modern-multiselect-auto').forEach(select => {
        const instance = new ModernMultiSelect(select);
        
        // Store instance by element ID for easy access
        if (select.id) {
            window.modernMultiSelectInstances[select.id] = instance;
        }
    });
});
