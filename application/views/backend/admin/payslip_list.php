<style type="text/css">
  .dt-buttons {
    margin-left: 10px !important;
    margin-top: 2px !important;
  }

  /* Action Popup Menu Styles */
  .action-popup-wrapper {
    position: relative;
    display: inline-block;
  }
  
  .action-popup-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .action-popup-btn:hover {
    transform: translateY(-1px) scale(1.05);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  }
  
  .action-popup-menu {
    position: fixed;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05);
    min-width: 180px;
    z-index: 99999;
    display: none;
    transform: scale(0.95) translateY(-5px);
    transition: opacity 0.15s ease, transform 0.15s ease;
    overflow: hidden;
    padding: 8px 0;
  }
  
  .action-popup-menu.show {
    display: block;
    opacity: 1;
    visibility: visible;
    transform: scale(1) translateY(0);
  }
  
  .action-popup-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    text-decoration: none;
    transition: all 0.15s;
    border: none;
    background: none;
    width: 100%;
    cursor: pointer;
    text-align: left;
  }
  
  .action-popup-item:hover {
    background: #f3f4f6;
  }
  
  .action-popup-item i {
    width: 18px;
    text-align: center;
    font-size: 14px;
  }
  
  .action-popup-item.preview i {
    color: #059669;
  }
  
  .action-popup-item.preview:hover {
    background: #d1fae5;
    color: #047857;
  }
  
  .action-popup-item.edit i {
    color: #2563eb;
  }
  
  .action-popup-item.edit:hover {
    background: #dbeafe;
    color: #1d4ed8;
  }
  
  .action-popup-item.delete i {
    color: #dc2626;
  }
  
  .action-popup-item.delete:hover {
    background: #fee2e2;
    color: #b91c1c;
  }
  
  .action-popup-divider {
    height: 1px;
    background: #e5e7eb;
    margin: 6px 0;
  }
  
  /* Approval Status Badge Styles (Task 11.6) */
  .status-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    white-space: nowrap;
  }
  
  .status-badge.draft {
    background: #f3f4f6;
    color: #6b7280;
  }
  
  .status-badge.pending {
    background: #fef3c7;
    color: #92400e;
  }
  
  .status-badge.approved {
    background: #d1fae5;
    color: #065f46;
  }
  
  .status-badge.rejected {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .status-badge.paid {
    background: #dbeafe;
    color: #1e40af;
  }
</style>

<!-- Print Controls -->
<div class="no-print mb-6 text-right" style="margin-top: 80px;">
    <button type="button" onclick="window.open('<?php echo site_url('admin/payroll'); ?>', '_blank')" class="bg-green-500 hover:bg-green-800 text-white  font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300 text-2xl">
        <i class="fas fa-hand-holding-usd fa-2x"></i>
        Pay Salary
    </button>
</div> 

<!-- Payslip Container -->
<div class="bg-white shadow-md p-4 rounded-lg overflow-x-scroll" id="printableDiv">
  
  <table class="text-xl text-left text-gray-600 dark:text-gray-400 datatable" id="payrollTable">
    <thead class="text-sm text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
      <tr>
          <th scope="col" class="px-4 py-3">reference</th>
          <th scope="col" class="px-4 py-3">ID No</th>
          <th scope="col" class="px-4 py-3">Name</th>
          <th scope="col" class="px-4 py-3 whitespace-nowrap">Account #</th>
          <th scope="col" class="px-4 py-3">month</th>
          <th scope="col" class="px-4 py-3">year</th>
          <th scope="col" class="px-4 py-3 text-center">Status</th>
          <th scope="col" class="px-4 py-3 text-right whitespace-nowrap" style="text-align: right !important;">basic salary</th>
          <th scope="col" class="px-4 py-3 text-right whitespace-nowrap" style="text-align: right !important;">total allowances</th>
          <th scope="col" class="px-4 py-3 text-right whitespace-nowrap" style="text-align: right !important;">gross salary</th>
          <th scope="col" class="px-4 py-3 text-right whitespace-nowrap" style="text-align: right !important;">total deductions</th>
          <th scope="col" class="px-4 py-3 text-right whitespace-nowrap" style="text-align: right !important;">net salary</th>
          <th scope="col" class="px-4 py-3 text-center" style="text-align: center !important; width: 120px;">action</th>

      </tr>
    </thead>
    <tbody>

      <?php
        // Task 17.1: Optimize staff selection query with JOIN - Load all staff info in single batch query
        $staff_info_map = $this->crud_model->get_staff_info_batch($payrollData);
        
        foreach($payrollData as $data):

          /*Staff information - Retrieved from batch query to avoid N+1 problem*/
          // FIX: Convert 'administrator' to 'admin' for proper key lookup (model uses 'admin_' format)
          $employment_category_key = ($data['employment_category'] === 'administrator') ? 'admin' : $data['employment_category'];
          $staff_key = $employment_category_key . '_' . $data['employee_code'];
          $staffRow = isset($staff_info_map[$staff_key]) ? $staff_info_map[$staff_key] : null;
          
          // Handle case where staff info not found
          if ($staffRow === null) {
            $staffName = 'Unknown Staff';
            $staffAccountNumber = 'N/A';
          } else {
            $staffName = ucwords(strtolower($staffRow->name));
            $staffAccountNumber = $staffRow->account_number;
          }
          
          // Get approval status (Task 11.6)
          $approval_status = isset($data['approval_status']) ? strtolower($data['approval_status']) : 'draft';
          $status_label = ucfirst($approval_status);
          
          // Map status to badge class
          $badge_class = 'draft'; // default
          if ($approval_status === 'pending_approval' || $approval_status === 'pending') {
            $badge_class = 'pending';
            $status_label = 'Pending';
          } elseif ($approval_status === 'approved') {
            $badge_class = 'approved';
          } elseif ($approval_status === 'rejected') {
            $badge_class = 'rejected';
          } elseif ($approval_status === 'paid') {
            $badge_class = 'paid';
          }
      ?>

      <tr class="border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700" data-payroll-id="<?= $data['pay_id']; ?>">
        <td class="px-4 py-3"><a href="<?= site_url('admin/payslip_preview/'.$data['employee_code'].'/'.$data['month'].'/'.$data['year'].'/'.$data['employment_category']) ?>" target="_blank" class="py-2 px-3 font-medium"><?= $data['reference'];?></a></td>
        <td class="px-4 py-3 whitespace-nowrap"><?= $data['employee_code'];?></td>
        <td class="px-4 py-3 whitespace-nowrap"><?= $staffName;?></td>
        <td class="px-4 py-3"><?= $staffAccountNumber;?></td>
        <td class="px-4 py-3"><?= $data['month'];?></td>
        <td class="px-4 py-3"><?= $data['year'];?></td>
        <td class="px-4 py-3 text-center">
          <span class="status-badge <?= $badge_class; ?>"><?= $status_label; ?></span>
        </td>
        <td class="px-4 py-3 text-right"><?= number_format($data['basic_salary'], 2, '.', ',');?></td>
        <td class="px-4 py-3 text-right"><?= number_format($data['total_allowances'], 2, '.', ',');?></td>
        <td class="px-4 py-3 text-right"><?= number_format($data['gross_salary'], 2, '.', ',');?></td>
        <td class="px-4 py-3 text-right"><?= number_format($data['total_deductions'], 2, '.', ',');?></td>
        <td class="px-4 py-3 text-right"><?= number_format($data['net_salary'], 2, '.', ',');?></td>
        <td class="px-4 py-3 text-center">
          <div class="action-popup-wrapper">
            <button type="button" class="action-popup-btn" onclick="togglePopupMenu(this, event, <?=$data['pay_id']?>)">
              <i class="fa fa-ellipsis-v"></i>
            </button>
          </div>
          <!-- Hidden data attributes for actions -->
          <span class="hidden action-data" 
                data-preview-url="<?= site_url('admin/payslip_preview/'.$data['employee_code'].'/'.$data['month'].'/'.$data['year'].'/'.$data['employment_category']) ?>"
                data-pay-id="<?= $data['pay_id']; ?>"
                data-employee-code="<?= $data['employee_code']; ?>"
                data-month="<?= $data['month']; ?>"
                data-year="<?= $data['year']; ?>"
                data-employment-category="<?= $data['employment_category']; ?>"></span>
        </td>
      </tr>

      <?php
        endforeach;
      ?>
    </tbody>
  </table>
</div>

<!-- Floating Popup Menu (rendered once) -->
<div id="actionPopupMenu" class="action-popup-menu">
  <button id="popupPreviewBtn" class="action-popup-item preview">
    <i class="fa fa-eye"></i> Preview Payslip
  </button>
  <button id="popupEditBtn" class="action-popup-item edit">
    <i class="fa fa-edit"></i> Edit Payroll
  </button>
  <div class="action-popup-divider"></div>
  <button id="popupDeleteBtn" class="action-popup-item delete">
    <i class="fa fa-trash"></i> Delete
  </button>
</div>

<!-- Edit Payroll Modal is now loaded from modal.php via showAjaxModal_payroll_edit() -->

<script>
  var currentPayId = null;
  var currentPreviewUrl = null;
  var $popupMenu = null;
  
  $(function() {
    $popupMenu = $('#actionPopupMenu');
    initPayrollTable();
    initPopupMenuHandlers();
  });
  
  // Initialize DataTable
  function initPayrollTable() {
    if ($.fn.DataTable.isDataTable('#payrollTable')) {
      $('#payrollTable').DataTable().destroy();
    }
    
    $('#payrollTable').dataTable({
      layout: {
        topCenter: {
          buttons: [
            'colvis',
            {
              extend: 'copyHtml5',
              exportOptions: {
                columns: ':visible'
              }
            },
            {
              extend: 'excelHtml5',
              exportOptions: {
                columns: ':visible'
              }
            },
          ]
        }
      }
    });
  }
  
  // Initialize popup menu handlers (use delegated events for AJAX support)
  function initPopupMenuHandlers() {
    // Close popup when clicking outside
    $(document).off('click.payslipPopup').on('click.payslipPopup', function(e) {
      if (!$(e.target).closest('.action-popup-btn, #actionPopupMenu').length) {
        closePopupMenu();
      }
    });
    
    // Handle popup menu actions
    $('#popupPreviewBtn').off('click').on('click', function(e) {
      e.preventDefault();
      if (currentPreviewUrl) {
        window.open(currentPreviewUrl, '_blank');
      }
      closePopupMenu();
    });
    
    $('#popupEditBtn').off('click').on('click', function() {
      if (currentPayId) {
        editPayroll(currentPayId);
      }
      closePopupMenu();
    });
    
    $('#popupDeleteBtn').off('click').on('click', function() {
      if (currentPayId) {
        deletePayroll(currentPayId);
      }
      closePopupMenu();
    });
  }

  function togglePopupMenu(btn, event, payId) {
    event.preventDefault();
    event.stopPropagation();
    
    var $btn = $(btn);
    var $row = $btn.closest('tr');
    var $dataSpan = $row.find('.action-data');
    
    currentPayId = $dataSpan.data('pay-id');
    currentPreviewUrl = $dataSpan.data('preview-url');
    
    // If menu is already open, close it
    if ($popupMenu && $popupMenu.hasClass('show')) {
      closePopupMenu();
      return;
    }
    
    // Position the menu
    var btnRect = btn.getBoundingClientRect();
    var menuWidth = 180;
    var menuHeight = 180;
    
    var left = btnRect.left;
    var top = btnRect.bottom + 5;
    
    // Adjust if menu would go off right edge
    if (left + menuWidth > window.innerWidth) {
      left = btnRect.right - menuWidth;
    }
    
    // Adjust if menu would go off bottom edge
    if (top + menuHeight > window.innerHeight) {
      top = btnRect.top - menuHeight - 5;
    }
    
    $popupMenu.css({
      left: left + 'px',
      top: top + 'px'
    });
    
    // Show menu
    $popupMenu.addClass('show');
    $btn.addClass('active');
  }
  
  function closePopupMenu() {
    if ($popupMenu) {
      $popupMenu.removeClass('show');
    }
    $('.action-popup-btn').removeClass('active');
  }

  function editPayroll(payId) {
    // Get data from the hidden data span
    var $row = $('tr[data-payroll-id="' + payId + '"]');
    var $dataSpan = $row.find('.action-data');
    
    var employeeCode = $dataSpan.data('employee-code');
    var month = $dataSpan.data('month');
    var year = $dataSpan.data('year');
    var employmentCategory = $dataSpan.data('employment-category');
    
    // Build month-year string (YYYY-MM format)
    var monthNumber = getMonthNumber(month);
    var monthYear = year + '-' + monthNumber.padStart(2, '0');
    
    // Convert 'admin' to 'administrator' for proper routing
    if (employmentCategory === 'admin') {
      employmentCategory = 'administrator';
    }
    
    // Redirect to payroll page with all required parameters
    window.location.href = '<?php echo site_url("admin/payroll"); ?>?staff=' + employeeCode + '&period=' + monthYear + '&category=' + employmentCategory;
  }
  
  // Helper function to convert month name to number
  function getMonthNumber(monthName) {
    var months = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    return months[monthName] || '01';
  }

  function deletePayroll(payId) {
    showConfirmModal(
      'Delete Payroll Record',
      'Are you sure you want to permanently delete this payroll record? This action cannot be undone!',
      function() {
        showAjaxModal_alert('Deleting payroll record...', 'loading');
        $.ajax({
          url: '<?php echo site_url('admin/payroll_delete/'); ?>' + payId,
          type: 'POST',
          dataType: 'json'
        }).done(function(response) {
          if(response.status === 'success') {
            showAjaxModal_alert(response.message || 'Payroll record deleted successfully', 'success');
            setTimeout(function() {
              location.reload();
            }, 2000);
          } else {
            showAjaxModal_alert(response.message || 'Failed to delete payroll record', 'error');
          }
        }).fail(function() {
          showAjaxModal_alert('An error occurred while deleting payroll record', 'error');
        });
      },
      'Delete',
      'danger'
    );
  }
  
  // Global function to reload the payslip table via AJAX
  function reloadPayslipTable() {
    $.ajax({
      url: '<?php echo site_url("admin/payslipList"); ?>',
      type: 'GET',
      dataType: 'html'
    }).done(function(response) {
      // Parse the response and extract the table content
      var $response = $(response);
      var $newTable = $response.find('#printableDiv');
      
      if ($newTable.length) {
        // Replace the table container
        $('#printableDiv').replaceWith($newTable);
        
        // Reinitialize the DataTable and popup handlers
        initPayrollTable();
        initPopupMenuHandlers();
      }
    }).fail(function(xhr) {
      // Fallback to page reload if AJAX fails
      location.reload();
    });
  }
</script>