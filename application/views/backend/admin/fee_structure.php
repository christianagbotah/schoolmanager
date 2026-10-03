<?php
$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
$currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
?>

<style>
/* Modern Card-Based Fee Structure Design */
* {
    box-sizing: border-box;
}

.fee-structure-wrapper {
    padding: 25px;
    background: #f5f7fa;
    min-height: calc(100vh - 100px);
}

/* Page Header */
.page-header-modern {
    background: #ffffff;
    padding: 24px 28px;
    margin-bottom: 28px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    border-left: 4px solid #3b82f6;
}

.page-header-modern h2 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 6px 0;
}

.page-header-modern p {
    font-size: 1rem;
    color: #64748b;
    margin: 0;
}

/* Filters Section */
.filters-modern {
    background: #ffffff;
    padding: 24px 28px;
    margin-bottom: 28px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.filters-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    align-items: end;
}

.filter-field {
    display: flex;
    flex-direction: column;
}

.filter-field label {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 8px;
}

.filter-field select {
    padding: 11px 14px;
    font-size: 1rem;
    color: #1e293b;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    background: #ffffff;
    transition: border-color .15s ease, box-shadow .15s ease;
}

.filter-field select:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-filter-modern {
    padding: 11px 28px;
    font-size: 1rem;
    font-weight: 600;
    color: #ffffff;
    background: #2563eb;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: background-color .2s ease, box-shadow .2s ease;
    box-shadow: 0 1px 2px rgba(37, 99, 235, 0.35);
}

..btn-filter-modern:hover {
    background: #1d4ed8;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
}

/* Cards Container */
.fee-cards-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 24px;
}

/* Individual Class Card */
.fee-class-card {
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    overflow: hidden;
    transition: box-shadow .2s ease;
}

.fee-class-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.card-header {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    padding: 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.class-name-section {
    flex: 1;
}

.class-name {
    font-size: 1.375rem;
    font-weight: 700;
    color: #ffffff;
    margin: 0 0 6px 0;
}

.residence-badge {
    display: inline-block;
    padding: 4px 12px;
    font-size: 0.875rem;
    font-weight: 600;
    background: rgba(255,255,255,0.25);
    color: #ffffff;
    border-radius: 6px;
    margin-left: 8px;
}

.item-count {
    font-size: 0.875rem;
    color: #cbd5e1;
    font-weight: 500;
}

.historical-badge {
    display: inline-block;
    padding: 3px 10px;
    font-size: 0.75rem;
    font-weight: 600;
    background: #fbbf24;
    color: #78350f;
    border-radius: 4px;
    margin-left: 8px;
}

.total-amount {
    font-size: 1.75rem;
    font-weight: 700;
    color: #10b981;
    background: rgba(255,255,255,0.15);
    padding: 8px 20px;
    border-radius: 8px;
}

.card-body {
    padding: 20px 24px;
}

/* Fee Items List */
.fee-items-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.fee-item {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    transition: all 0.2s;
}

.fee-item:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

/* Display Mode */
.display-mode {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
}

.item-info {
    flex: 1;
}

.item-title {
    font-size: 1.0625rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 6px;
}

.item-desc {
    font-size: 0.9375rem;
    color: #64748b;
    margin-bottom: 8px;
}

.item-category {
    margin-top: 8px;
}

.cat-badge {
    display: inline-block;
    padding: 4px 12px;
    font-size: 0.8125rem;
    font-weight: 500;
    background: #dbeafe;
    color: #1e40af;
    border-radius: 6px;
}

.item-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
}

.item-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #059669;
}

.action-buttons {
    display: flex;
    gap: 8px;
}

.btn-icon {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-size: 1.125rem;
}

..btn-edit {
    background: #2563eb;
    color: #ffffff;
}

..btn-edit:hover {
    background: #1d4ed8;
}

..btn-delete {
    background: #dc2626;
    color: #ffffff;
}

..btn-delete:hover {
    background: #b91c1c;
}

/* Edit Mode */
.edit-mode {
    padding: 12px;
    background: #ffffff;
    border-radius: 8px;
}

.edit-form {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #475569;
    margin-bottom: 6px;
}

.form-input {
    padding: 10px 12px;
    font-size: 0.9375rem;
    color: #1e293b;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    transition: all 0.2s;
}

.form-input:focus {
    border-color: #3b82f6;
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input[type="textarea"],
textarea.form-input {
    min-height: 70px;
    resize: vertical;
    font-family: inherit;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
}

.btn-save {
    flex: 1;
    padding: 10px 20px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #ffffff;
    background: #10b981;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-save:hover {
    background: #059669;
}

.btn-cancel {
    flex: 1;
    padding: 10px 20px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #475569;
    background: #f1f5f9;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-cancel:hover {
    background: #e2e8f0;
}

/* No Items State */
.no-items {
    text-align: center;
    padding: 32px;
    color: #94a3b8;
    font-size: 1rem;
}

/* Alerts */
.alert-box {
    padding: 16px 20px;
    border-radius: 8px;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 12px;
}

.alert-info {
    background: #e0f2fe;
    color: #075985;
    border-left: 4px solid #0ea5e9;
}

.alert-warning {
    background: #fef3c7;
    color: #92400e;
    border-left: 4px solid #f59e0b;
}

/* Loading State */
.loading-state {
    text-align: center;
    padding: 48px;
    color: #64748b;
    font-size: 1.125rem;
}

/* Responsive */
@media (max-width: 768px) {
    .fee-cards-container {
        grid-template-columns: 1fr;
    }
    
    .filters-row {
        grid-template-columns: 1fr;
    }
    
    .display-mode {
        flex-direction: column;
    }
    
    .item-actions {
        width: 100%;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
}

/* ---- family focus + motion ---- */
.btn-filter-modern:focus-visible,
.btn-edit:focus-visible,
.btn-delete:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
    .btn-filter-modern, .fee-class-card, .btn-edit, .btn-delete { transition: none; }
}
</style>

<style>
@media screen {
  .fee-structure-wrapper {
    max-width: 1600px; margin: 0 auto; padding: 24px 28px 40px;
    color: #334155;
  }
  .fee-structure-wrapper .page-header,
  .fee-structure-wrapper > div:first-child {
    margin-bottom: 18px;
  }
  .fee-structure-wrapper h2 {
    margin: 0; color: #0f172a !important; font-size: 28px !important;
    line-height: 1.2; font-weight: 800 !important; letter-spacing: -.02em;
  }
  .fee-structure-wrapper h2 + p {
    margin-top: 6px; color: #64748b !important; font-size: 14px !important; line-height: 1.5;
  }

  .fee-structure-wrapper .filter-section,
  .fee-structure-wrapper .filters-card {
    padding: 16px 18px !important; margin-bottom: 16px !important;
    border: 1px solid #e2e8f0 !important; border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important; background: #fff !important;
  }
  .fee-structure-wrapper .filter-grid {
    gap: 12px !important; grid-template-columns: repeat(4,minmax(0,1fr)) !important;
  }
  .fee-structure-wrapper .filter-field label {
    margin-bottom: 7px !important; color: #334155 !important; font-size: 14px !important; font-weight: 700 !important;
  }
  .fee-structure-wrapper .filter-field select,
  .fee-structure-wrapper .select2-container .select2-selection--single {
    min-height: 44px !important; height: 44px !important; border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important; background: #fff !important; color: #0f172a !important; font-size: 14px !important;
  }
  .fee-structure-wrapper .select2-container .select2-selection__rendered {
    line-height: 42px !important; font-size: 14px !important; color: #0f172a !important;
  }
  .fee-structure-wrapper .btn-filter-modern {
    min-height: 44px; height: 44px; padding: 9px 15px;
    border-radius: 9px; background: #2563eb; color: #fff;
    font-size: 14px; font-weight: 800; box-shadow: none;
  }
  .fee-structure-wrapper .btn-filter-modern:hover { background: #1d4ed8; transform: none; box-shadow: 0 3px 9px rgba(37,99,235,.16); }

  .fee-cards-container {
    grid-template-columns: repeat(auto-fill,minmax(340px,1fr)) !important;
    gap: 14px !important;
  }
  .fee-class-card {
    border: 1px solid #e2e8f0 !important; border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important; overflow: hidden;
  }
  .fee-class-card:hover { transform: none !important; border-color: #cbd5e1 !important; box-shadow: 0 5px 14px rgba(15,23,42,.07) !important; }
  .fee-class-card .card-header {
    padding: 14px 16px !important; background: #f8fafc !important; border-bottom: 1px solid #e2e8f0 !important;
  }
  .fee-class-card .card-header h3,
  .fee-class-card .class-name {
    color: #0f172a !important; font-size: 17px !important; line-height: 1.35; font-weight: 800 !important;
  }
  .fee-class-card .card-header .badge,
  .fee-class-card .status-badge {
    padding: 5px 9px !important; border-radius: 999px !important; font-size: 13px !important; font-weight: 700 !important;
  }
  .fee-class-card .card-body { padding: 14px 16px !important; }
  .fee-items-list { gap: 8px !important; }
  .fee-item {
    min-height: 52px; padding: 10px 11px !important; border: 1px solid #eef2f7 !important;
    border-radius: 9px !important; background: #fff !important;
  }
  .fee-item:hover { background: #f8fbff !important; transform: none !important; }
  .fee-item .fee-name, .fee-item h4 { color: #0f172a !important; font-size: 14px !important; font-weight: 700 !important; }
  .fee-item .fee-meta, .fee-item p { color: #64748b !important; font-size: 13px !important; line-height: 1.4; }
  .fee-item .fee-amount { color: #047857 !important; font-size: 18px !important; font-weight: 800 !important; }

  .fee-structure-wrapper .action-buttons { gap: 7px !important; }
  .fee-structure-wrapper .btn-icon,
  .fee-structure-wrapper .btn-edit,
  .fee-structure-wrapper .btn-delete {
    width: 38px; height: 38px; min-height: 38px; border-radius: 8px !important;
    display: inline-flex; align-items: center; justify-content: center; font-size: 14px !important;
  }

  .fee-structure-wrapper .edit-form,
  .fee-structure-wrapper .inline-edit-form {
    gap: 12px !important;
  }
  .fee-structure-wrapper .form-label { font-size: 14px !important; font-weight: 700 !important; color: #334155 !important; }
  .fee-structure-wrapper .form-input {
    min-height: 44px; padding: 9px 11px; border: 1px solid #cbd5e1;
    border-radius: 9px; font-size: 14px; color: #0f172a;
  }
  .fee-structure-wrapper textarea.form-input { min-height: 80px; resize: vertical; }
  .fee-structure-wrapper .btn-save,
  .fee-structure-wrapper .btn-cancel {
    min-height: 40px; padding: 8px 13px; border-radius: 8px; font-size: 14px; font-weight: 700;
  }

  .fee-structure-wrapper .loading-state,
  .fee-structure-wrapper .empty-state,
  .fee-structure-wrapper .alert-box { font-size: 14px !important; line-height: 1.5; }

  @media (max-width: 900px) {
    .fee-structure-wrapper { padding: 18px 14px 32px; }
    .fee-structure-wrapper .filter-grid { grid-template-columns: repeat(2,minmax(0,1fr)) !important; }
  }
  @media (max-width: 560px) {
    .fee-structure-wrapper { padding: 12px 10px 28px; }
    .fee-structure-wrapper h2 { font-size: 24px !important; }
    .fee-structure-wrapper .filter-grid { grid-template-columns: 1fr !important; }
    .fee-cards-container { grid-template-columns: 1fr !important; }
  }
}
</style>


<div class="fee-structure-wrapper">
    
    <!-- Page Header -->
    <div class="page-header-modern">
        <h2><i class="entypo-doc-text"></i> <?php echo get_phrase('fee_structure'); ?></h2>
        <p><?php echo get_phrase('view_and_manage_fee_items_by_class'); ?></p>
    </div>

    <!-- Filters -->
    <div class="filters-modern">
        <div class="filters-row">
            <div class="filter-field">
                <label for="filter_class"><?php echo get_phrase('class'); ?></label>
                <select id="filter_class" name="filter_class" class="select2">
                    <option value=""><?php echo get_phrase('all_classes'); ?></option>
                    <?php echo getFullClassList('', ''); ?>
                </select>
            </div>
            
            <div class="filter-field">
                <label for="filter_term"><?php echo get_phrase('term'); ?></label>
                <select id="filter_term" name="filter_term" class="select2">
                    <option value=""><?php echo get_phrase('all_terms'); ?></option>
                    <option value="1" <?php if($running_term == 1) echo 'selected'; ?>><?php echo get_phrase('term'); ?> 1</option>
                    <option value="2" <?php if($running_term == 2) echo 'selected'; ?>><?php echo get_phrase('term'); ?> 2</option>
                    <option value="3" <?php if($running_term == 3) echo 'selected'; ?>><?php echo get_phrase('term'); ?> 3</option>
                </select>
            </div>
            
            <div class="filter-field">
                <label for="filter_year"><?php echo get_phrase('academic_year'); ?></label>
                <select id="filter_year" name="filter_year" class="select2">
                    <option value=""><?php echo get_phrase('all_years'); ?></option>
                    <?php echo populate_academic_year('yes', $running_year); ?>
                </select>
            </div>
            
            <div class="filter-field">
                <button type="button" onclick="loadFeeStructure()" class="btn-filter-modern">
                    <i class="entypo-search"></i> <?php echo get_phrase('view_structure'); ?>
                </button>
            </div>
        </div>
    </div>

    <!-- Results -->
    <div id="fee_structure_results">
        <div class="alert-box alert-info">
            <i class="entypo-info"></i>
            <span><?php echo get_phrase('select_filters_to_view_fee_structure'); ?></span>
        </div>
    </div>

</div>

<script>
$(document).ready(function() {
    $('.select2').select2({
        minimumResultsForSearch: 10,
        width: '100%'
    });
    
    // Auto-load
    loadFeeStructure();
});

function loadFeeStructure() {
    var class_id = $('#filter_class').val();
    var term = $('#filter_term').val();
    var year = $('#filter_year').val();
    
    $('#fee_structure_results').html('<div class="loading-state"><i class="entypo-arrows-ccw"></i> <?php echo get_phrase('loading'); ?>...</div>');
    
    $.ajax({
        url: '<?php echo site_url('admin/get_fee_structure'); ?>',
        type: 'POST',
        data: {
            class_id: class_id,
            term: term,
            year: year
        },
        success: function(response) {
            $('#fee_structure_results').html(response);
            
            // Initialize select2 for edit mode dropdowns
            $('.form-input[multiple]').select2({
                width: '100%',
                placeholder: '<?php echo get_phrase('select_classes'); ?>'
            });
        },
        error: function() {
            $('#fee_structure_results').html('<div class="alert-box" style="background:#fee2e2;color:#991b1b;border-left-color:#ef4444;"><i class="entypo-cancel"></i><span><?php echo get_phrase('error_loading_data'); ?></span></div>');
        }
    });
}

function enableEdit(id) {
    $('#display_mode_' + id).hide();
    $('#edit_mode_' + id).show();
    
    // Re-init select2
    $('#edit_specific_classes_' + id).select2({
        width: '100%',
        placeholder: '<?php echo get_phrase('select_classes'); ?>'
    });
}

function cancelEdit(id) {
    $('#display_mode_' + id).show();
    $('#edit_mode_' + id).hide();
    
    // Reset to original values
    $('#edit_title_' + id).val($('#orig_title_' + id).val());
    $('#edit_desc_' + id).val($('#orig_desc_' + id).val());
    $('#edit_amount_' + id).val($('#orig_amount_' + id).val());
    $('#edit_class_category_' + id).val($('#orig_class_category_' + id).val());
    
    var orig_classes = $('#orig_specific_classes_' + id).val();
    var classes_array = orig_classes ? orig_classes.split(',') : [];
    $('#edit_specific_classes_' + id).val(classes_array).trigger('change');
}

function saveItem(id) {
    var title = $('#edit_title_' + id).val();
    var desc = $('#edit_desc_' + id).val();
    var amount = $('#edit_amount_' + id).val();
    var class_category = $('#edit_class_category_' + id).val();
    var specific_class_ids = $('#edit_specific_classes_' + id).val();
    
    if(!title || !amount) {
        alert('<?php echo get_phrase('title_and_amount_required'); ?>');
        return;
    }
    
    var specific_ids_str = specific_class_ids ? specific_class_ids.join(',') : '';
    
    $.ajax({
        url: '<?php echo site_url('admin/invoice/update_bill_item/'); ?>' + id,
        type: 'POST',
        dataType: 'json',
        data: {
            title: title,
            desc: desc,
            amount: amount,
            class_category: class_category,
            specific_class_ids: specific_ids_str,
            id: id
        },
        success: function(response) {
            if(response.success == 1) {
                alert('<?php echo get_phrase('updated_successfully'); ?>');
                loadFeeStructure();
            } else {
                alert(response.message || '<?php echo get_phrase('update_failed'); ?>');
            }
        },
        error: function() {
            alert('<?php echo get_phrase('error_occurred'); ?>');
        }
    });
}

function deleteItem(id, title) {
    if(!confirm('<?php echo get_phrase('confirm_delete'); ?> "' + title + '"?')) {
        return;
    }
    
    $.ajax({
        url: '<?php echo site_url('admin/invoice/delete_bill_item/'); ?>' + id,
        type: 'POST',
        dataType: 'json',
        success: function(response) {
            if(response.success == 1) {
                alert('<?php echo get_phrase('deleted_successfully'); ?>');
                loadFeeStructure();
            } else if(response.success == 2) {
                alert('<?php echo get_phrase('cannot_delete_item_in_use'); ?>');
            } else {
                alert(response.message || '<?php echo get_phrase('delete_failed'); ?>');
            }
        },
        error: function() {
            alert('<?php echo get_phrase('error_occurred'); ?>');
        }
    });
}
</script>
