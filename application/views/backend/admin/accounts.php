<style>
/* Direct UI/UX rebuild — Chart of Accounts */
.accounts-ledger-workspace {
  margin: 0 !important;
  padding: 0 0 32px;
  background: #f8fafc;
  min-height: 100%;
}
.accounts-ledger-workspace > .col-md-12 {
  padding: 0 !important;
}
.accounts-page-head {
  margin: 0 0 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #e2e8f0;
}
.accounts-eyebrow {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.accounts-page-head h1 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -.02em;
}
.accounts-page-head p:last-child {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}
.accounts-ledger-workspace > .col-md-12 > div[style*="border: 2px solid red"] {
  width: 100% !important;
  padding: 0 !important;
  border: 0 !important;
}
.accounts-ledger-workspace .container {
  width: 100% !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 0 16px !important;
}
.accounts-ledger-workspace .container > .row {
  margin: 0 !important;
}
.accounts-ledger-workspace .container > .row > .col-md-12 {
  padding: 0 !important;
}
.accounts-ledger-workspace h5 {
  margin: 0 !important;
  padding: 15px 18px;
  border: 1px solid #e2e8f0;
  border-bottom: 0;
  border-radius: 14px 14px 0 0;
  background: #fff;
  color: #0f172a;
  font-size: 17px;
  line-height: 1.35;
  font-weight: 800;
}
.accounts-ledger-workspace h5 + hr {
  display: none;
}

/* Add-account card */
#create_account_form {
  padding: 16px 18px 18px;
  border: 1px solid #e2e8f0;
  border-radius: 0 0 14px 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15,23,42,.05);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
#create_account_form table {
  min-width: 980px;
  margin: 0 !important;
  border: 0 !important;
}
#create_account_form thead th,
#create_account_form tbody th {
  padding: 8px 9px !important;
  border: 0 !important;
  color: #475569 !important;
  font-size: 13px !important;
  line-height: 1.35;
  font-weight: 800 !important;
  letter-spacing: .02em;
}
#create_account_form td {
  padding: 6px 9px !important;
  border: 0 !important;
  vertical-align: middle !important;
}
#create_account_form .form-control {
  min-height: var(--sm-ui-control-height, 42px);
  height: var(--sm-ui-control-height, 42px);
  padding: 9px 11px;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
}
#create_account_form .form-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,.12);
  outline: none;
}
#create_account_form input[type="radio"],
#create_account_form input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0 6px 0 0;
  vertical-align: middle;
  accent-color: #2563eb;
}
#create_account_form .form-check-inline {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: 10px;
  color: #334155;
  font-size: 14px;
}
#create_account_form button[type="submit"] {
  min-height: var(--sm-ui-control-height, 42px);
  height: var(--sm-ui-control-height, 42px);
  padding: 9px 16px;
  border-radius: 9px;
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}
#create_account_form button[type="submit"]:hover {
  background: #1d4ed8 !important;
  border-color: #1d4ed8 !important;
}

/* Existing accounts card */
#account_update_form {
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 0 0 14px 14px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15,23,42,.05);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
#dataTable {
  width: 100% !important;
  min-width: 1220px;
  margin: 0 !important;
  border: 0 !important;
}
#dataTable thead th {
  padding: 12px 11px !important;
  background: #f8fafc !important;
  color: #475569 !important;
  font-size: 13px !important;
  line-height: 1.35;
  font-weight: 800 !important;
  letter-spacing: .025em;
  border-bottom: 1px solid #e2e8f0 !important;
}
#dataTable tbody td {
  padding: 11px !important;
  color: #334155 !important;
  font-size: 14px !important;
  line-height: 1.45;
  vertical-align: middle !important;
  border-bottom: 1px solid #eef2f7 !important;
}
#dataTable tbody tr:hover td { background: #f8fbff !important; }
#dataTable .form-control {
  min-height: 40px;
  height: 40px;
  padding: 7px 9px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  color: #0f172a;
  font-size: 14px;
  background: #fff;
}
#dataTable input[type="radio"],
#dataTable input[type="checkbox"] {
  width: 18px;
  height: 18px;
  vertical-align: middle;
  accent-color: #2563eb;
}
#dataTable .btn {
  min-height: 36px;
  padding: 7px 10px !important;
  border-radius: 8px !important;
  font-size: 13px !important;
  font-weight: 700 !important;
}
#dataTable .btn-info { background: #0284c7; border-color: #0284c7; }
#dataTable .btn-success { background: #059669; border-color: #059669; }
#dataTable .btn-danger { background: #dc2626; border-color: #dc2626; }

.accounts-ledger-workspace .dataTables_wrapper {
  min-width: 1220px;
  padding: 14px;
}
.accounts-ledger-workspace .dataTables_length,
.accounts-ledger-workspace .dataTables_filter,
.accounts-ledger-workspace .dataTables_info,
.accounts-ledger-workspace .dataTables_paginate {
  color: #475569;
  font-size: 14px;
}
.accounts-ledger-workspace .dataTables_length select,
.accounts-ledger-workspace .dataTables_filter input[type="search"] {
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  color: #0f172a;
  font-size: 14px;
}
#preloader2 {
  min-height: 240px !important;
  top: 0 !important;
  border-radius: 12px;
  background: rgba(255,255,255,.94) !important;
}
.ajax_alert { top: 70px !important; }

@media (max-width: 767px) {
  .accounts-ledger-workspace { padding: 0 0 28px; }
  .accounts-page-head h1 { font-size: 22px; }
  .accounts-ledger-workspace h5 { padding: 14px 15px; }
  #create_account_form { padding: 14px; }
}
</style>


    <div class="row accounts-ledger-workspace">
      <div class="col-md-12">
        <div class="accounts-page-head">
          <p class="accounts-eyebrow">Fees & Finance</p>
          <h1>Chart of Accounts</h1>
          <p>Create and maintain bank, cash, receivable, payable and operating accounts while protecting system-critical accounts.</p>
        </div>

        <div style="border: 2px solid red; width: 100%; padding: 5px">
          <style type="text/css">
  #preloader2{
    width: 100%;
    min-height: 1020px;
    background-color: #fff;
    text-align: center;
    z-index: 99999;
    position: absolute;
    top: 350px;
  }

  .ajax_alert {
      position: relative;
      top: 100px;
  }
</style>
            <!----CATEGORY CREATION FORM STARTS---->
            <?php
//query the account type table
$account_type_array = $this->db->get('account_type')->result_array();
?>
            <div class="container">
                <div class="row">
                  <div class="col-md-12">
                    <h5>Add New Account</h5>
                    <hr>
                    <?php echo form_open(site_url('admin/accounts/account_create'), array('class' => 'form-horizontal form-groups-bordered validate', 'id' => 'create_account_form', 'target' => '_top')); ?>
                      <table class="table table-responsive" id="" style="width:100%; border-collapse:collapse;">
                        <thead>

                            <tr>
                              <th>Bank Name</th>
                              <th>Branch</th>
                              <th>Account Name</th>
                              <th>Account Number</th>
                              <th>Opening Balance</th>
                            </tr>

                            
                        </thead>
                        <tbody>

                          <tr>
                            <td width="300">
                                  <input type="text" class="form-control" id="bank_name" name="bank_name" required="required" data-validate="required" placeholder="Bank Name"/>

                            </td>
                            <td width="300">
                                  <input type="text" class="form-control" id="branch" name="branch" required="required" data-validate="required" placeholder="Branch"/>

                            </td>
                            <td width="300">
                                  <input type="text" class="form-control" id="acc_name" name="acc_name" required="required" data-validate="required" placeholder="Account Name" data-message-required="<?php echo get_phrase('value_required'); ?>"/>

                            </td>
                            <td width="300">
                                  <input type="text" class="form-control" id="acc_number" name="acc_number" required="required" data-validate="required" placeholder="Account Number"/>

                            </td>
                            <td width="150">
                              <input type="number" class="form-control" min="0" size="40" id="acc_balance" name="acc_balance" placeholder="Account Balance"/>
                            </td>
                          </tr>

                          <tr>
                              <th>Type</th>
                              <th style="text-align: right">Bank</th>
                              <th style="text-align: right">Transferrable</th>
                              <th></th>
                            </tr>

                          <tr>
                                <td width="150">
                                  <select class="form-control" name="acc_type" id="acc_type" required="required">
                                    <?php
foreach ($account_type_array as $ac):
?>
                                    <option value="<?=$ac['account_type_id'];?>"><?=$ac['name'];?></option>
                                  <?php endforeach;?>
                                  </select>
                                </td>
                                <td width="150" align="right">
                                  <div class="form-control-row">
                                    <div class="form-check-inline">
                                    <label class="form-check-label">
                                      <input type="radio" class="form-check-input" value="1" id="bank_yes" name="bank" required>Yes
                                    </label>
                                  </div>
                                  <div class="form-check-inline">
                                    <label class="form-check-label">
                                      <input type="radio" class="form-check-input" value="0" id="bank_no" name="bank" required>No
                                    </label>
                                  </div>
                                  </div>
                                </td>
                                <td align="right">
                                  <div class="form-check-inline">
                                    <label class="form-check-label">
                                      <input type="checkbox" class="form-check-input" value="1" id="transferrable" name="transferrable">
                                    </label>
                                  </div>
                                </td>
                                <td align="right">
                                  <div class="">
                                    <button type="submit" class="btn btn-info"><?php echo get_phrase('add_account'); ?></button>
                                </div>
                                </td>
                            </tr>

                        </tbody>
                      </table>
                      <?php echo form_close(); ?>
                </div>
              </div>
            </div>

                <div class="container">
                      <div><h5>List of Accounts</h5></div>
                    <hr>

                    <div class="row">
                      <div class="col-md-12">
                        <?php echo form_open(site_url('admin/accounts/account_update/'), array('class' => 'form-horizontal form-groups-bordered validate', 'id' => 'account_update_form')); ?>
                        <table class="table table-info table-responsive table-striped table-hover" id="dataTable" width="100%" style="border-collapse:collapse;">
                        <thead>
                            <tr>
                                <th>Bank</th>
                                <th>Branch</th>
                                <th>Account Name</th>
                                <th>Account No.</th>
                                <th id="balance_th" style="text-align: right;">Balance</th>
                                <th>Type</th>
                                <th>Bank</th>
                                <th>Transferrable</th>
                                <th></th>
                                <th>Edit</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                $this->db->order_by('account_id', 'desc');
$all_accounts = $this->db->get('accounts')->result_array();
$sn = 1;
foreach ($all_accounts as $row):
?>
                              <tr <?php if ($row['account_name'] == 'Accounts Payable' || $row['account_name'] == 'Accounts Receivable' || $row['name'] == 'General Products Purchased' || $row['account_name'] == 'General Sales' || $row['account_name'] == 'General Office Expenses') {
	echo 'ondblclick="showAjaxModal_alert(\'This account is not editable\', \'Warning\', false, true)" onclick="showAjaxModal_alert(\'This account is not editable\', \'Warning\', false, true)"';
}
?>>
                                <td width="350">
                                    <div class="raw_<?=$row['account_id'];?>"><?=$row['bank_name'];?></div>
                                      <input type="text" class="form-control edit_<?=$row['account_id'];?>" style="display: none;" size="40" id="edit_bank_name_<?=$row['account_id'];?>" name="bank_name_<?=$row['account_id'];?>" value="<?php echo $row['bank_name']; ?>" required/>

                                </td>
                                <td width="350">
                                    <div class="raw_<?=$row['account_id'];?>"><?=$row['branch'];?></div>
                                      <input type="text" class="form-control edit_<?=$row['account_id'];?>" style="display: none;" size="40" id="edit_branch_<?=$row['account_id'];?>" name="branch_<?=$row['account_id'];?>" value="<?php echo $row['branch']; ?>" required/>

                                </td>
                                <td width="350">
                                    <div class="raw_<?=$row['account_id'];?>"><?=$row['account_name'];?></div>
                                      <input type="text" class="form-control edit_<?=$row['account_id'];?>" style="display: none;" size="40" id="edit_account_name_<?=$row['account_id'];?>" name="acc_name_<?=$row['account_id'];?>" value="<?php echo $row['account_name']; ?>" required/>

                                </td>
                                <td width="350">
                                    <div class="raw_<?=$row['account_id'];?>"><?=$row['account_number'];?></div>
                                      <input type="text" class="form-control edit_<?=$row['account_id'];?>" style="display: none;" size="40" id="edit_account_number_<?=$row['account_id'];?>" name="acc_number_<?=$row['account_id'];?>" value="<?php echo $row['account_number']; ?>" required/>

                                </td>
                                <td width="150" align="right">
                                  <div class="raw_<?=$row['account_id'];?>"><?=number_format($row['current_balance'], 2, '.', ',');?></div>
                                  <input type="number" class="form-control edit_<?=$row['account_id'];?>" style="display: none;" size="40" id="edit_account_balance_<?=$row['account_id'];?>" name="acc_balance_<?=$row['account_id'];?>" value="<?php echo $row['opening_balance']; ?>" required/>
                                </td>
                                <td width="120">
                                  <div class="raw_<?=$row['account_id'];?>"><?=$this->db->get_where('account_type', array('account_type_id' => $row['account_type']))->row()->name;?></div>
                                  <select class="form-control edit_<?=$row['account_id'];?>" style="display: none;" id="edit_account_type_<?=$row['account_id'];?>" name="acc_type_<?=$row['account_id'];?>" required>
                                    <?php
foreach ($account_type_array as $act):
?>
                                    <option value="<?=$act['account_type_id'];?>" <?php if ($row['account_type'] == $act['account_type_id']) {
	echo 'selected';
}
?>><?=$act['name'];?></option>
                                    <?php endforeach;?>
                                  </select>
                                </td>
                                <td width="150">
                                  <div class="raw_<?=$row['account_id'];?>"><?Php echo $row['account_is_bank'] == 1 ? 'Yes' : 'No'; ?></div>
                                  <div class="form-check-inline edit_<?=$row['account_id'];?>" style="display: none;" >
                                    <label class="form-check-label">
                                      <input type="radio" class="form-check-input" value="1" <?php if ($row['account_is_bank'] == 1) {
	echo 'checked';
}
?> id="edit_account_bank_yes_<?=$row['account_id'];?>" name="bank_<?=$row['account_id'];?>" required>Yes
                                    </label>
                                  </div>
                                  <div class="form-check-inline edit_<?=$row['account_id'];?>" style="display: none;" >
                                    <label class="form-check-label">
                                      <input type="radio" class="form-check-input" value="0" <?php if ($row['account_is_bank'] == 0) {
	echo 'checked';
}
?> id="edit_account_bank_no_<?=$row['account_id'];?>" name="bank_<?=$row['account_id'];?>" required>No
                                    </label>
                                  </div>
                                </td>
                                <td align="right">
                                  <div class="form-check-inline">
                                    <label class="form-check-label">
                                      <input type="checkbox" class="form-check-input" value="1" <?php if ($row['account_is_transferrable'] == 1) {
	echo 'checked';
}
if ($row['account_name'] == "Accounts Receivable" || $row['account_name'] == "Accounts Payable" || $row['account_name'] == 'General Products Purchased' || $row['account_name'] == 'General Sales' || $row['account_name'] == 'General Office Expenses') {
	echo 'disabled="disabled"';
}
?> id="transferrable_<?=$row['account_id'];?>" name="transferrable_<?=$row['account_id'];?>">
                                    </label>
                                  </div>
                                </td>

                                <input type="hidden" value="<?=$row['account_id'];?>" name="cat_id_<?=$row['account_id'];?>" id="cat_id_<?=$row['account_id'];?>">
                                <td>
                                <a href="javascript:void(0);" class="btn btn-info update_holder_<?=$row['account_id'];?>" style="display: none" onclick="edit_category('<?=$row['account_id'];?>')">Update</a>
                                </td>
                                </form>
                                <td>
                                  <!--DISABLE THE EDIT BUTTON ON VITAL ACCOUNTS-->
                                  <?php if ($row['account_name'] == 'Accounts Payable' || $row['account_name'] == 'Accounts Receivable' || $row['account_name'] == 'General Products Purchased' || $row['account_name'] == 'General Sales' || $row['account_name'] == 'General Office Expenses'): ?>
                                  <a href="javascript:;" disabled="disabled" class="btn btn-success btn-sm"><i class="entypo-pencil"></i></a>
                                <?php
else:
?>
                                    <a href="javascript:;" class="btn btn-success btn-sm" id="btn_<?=$row['account_id'];?>" onclick="show_cat_edit('<?=$row['account_id'];?>')"><i class="entypo-pencil"></i></a>
                                  <?php
endif;?>
                                </td>
                                <td>
                                  <!--HIDE THE DELETE BUTTON ON VITAL ACCOUNTS-->
                                  <?php if ($row['account_name'] != 'Accounts Payable' && $row['account_name'] != 'Accounts Receivable' && $row['account_name'] != 'General Products Purchased' && $row['account_name'] != 'General Sales' && $row['account_name'] != 'General Office Expenses'): ?>
                                  <a href="javascript:;" class="btn btn-danger btn-sm" onclick="delete_cat('<?=$row['account_id'];?>')"><i class="entypo-trash"></i></a>
                                <?php endif;?>
                                </td>
                            </tr>
                            <?php
$sn++;
endforeach;?>

                            </tbody>
                        </table>
                      </div>
                    </div>
      <!----ACCOUNT CREATION FORM ENDS-->

<script type="text/javascript">

  jQuery(document).ready(function($)
  {
    $('#dataTable').dataTable();
    var datatable = $("#table_export").dataTable();
    $('#category_tbl').dataTable();

        var class_name = '<?php echo $class_name; ?>';
        var raw_score = '<?php echo $raw_score; ?>';
        if(class_name === 'FORM' && raw_score == 'Yes') {
            $('#status').css('display', 'block');
        }else{
            $('#status').css('display', 'none');
        }
  });
  //delete category
  function delete_cat(id) {
      showCustomConfirm('If you delete this account, all records such as transactions with this account will be deleted permanently. Are you sure you really want to delete it?\nClick CANCEL if you are not sure.', function() {
          $.ajax({
            url: '<?php echo site_url('admin/accounts/account_delete/') ?>' + id,
            type: 'POST',
            dataType: 'json',
            })
            .done(function(data) {
              if(data.success) {
                $('.close').click();
                showAjaxModal_confirm2('Account Deleted Successfully.', 'Success');

                setTimeout(() => {
                  $('#modal_confirm .close').click(); //window.location.reload();
                }, 3000);

              } else {
               // $('.close').click();
                showAjaxModal_confirm2('Account Could Not Be Deleted Successfully Because It Is Used In A Number Of Transactions.', 'Error');
              }
          });
      }); // Close showCustomConfirm callback

  }

  //show edit field

  function show_cat_edit(id) {
    if($('.edit_' + id).attr('style') == 'display: none;') {
        $('table #balance_th').text('');
        $('table #balance_th').text('Opening Balance');
        $('.raw_' + id).css('display', 'none');
        $('.raw_' + id).fadeOut('slow');
        $('.edit_' + id).css('display', 'inline-flex');
        $('.update_holder_' + id).fadeIn('slow');
    } else {
        $('table #balance_th').text('');
        $('table #balance_th').text('Balance');
        $('.edit_' + id).css('display', 'none');
        $('.edit_' + id).fadeOut('slow');
        $('.raw_' + id).css('display', 'block');
        $('.update_holder_' + id).fadeOut('slow');
    }



      //remove the onclick on the button
     // $('#btn_' + id).removeAtrr('onclick');
      //$('#btn_' + id i).text('Update');
  }


  //sms_setup_popup
  function sms_setup_popup() {
    showAjaxModal_payments_sales('<?php echo site_url('modal/popup/sms_settings/'); ?>', 'Setup SMS');
  }

  //company tab settings form submitted
  $('#company_settings_form').submit(function(event) {
    /* Act on the event */
    event.preventDefault();
    //get form data
    let form_data = $('#company_settings_form').serialize();

    //send data via ajax
    $.ajax({
      url: '<?php echo site_url('admin/accounts/update') ?>',
      type: 'POST',
      dataType: 'json',
      data: form_data
    })
    .done(function(data) {
      if(data.success == true) {
        $('.close').click();
        showAjaxModal_confirm2('Company Settings Updated Successfully.', 'Success');

        setTimeout(() => {
          $('#modal_confirm .close').click(); //window.location.reload();
        }, 3000);
      }
    });

  });

  //accounts tab settings form submitted
  $('#create_account_form').submit(function(event) {
    /* Act on the event */
    event.preventDefault();
    let form_data = $('#create_account_form').serialize();

    //send data via ajax
    $.ajax({
      url: '<?php echo site_url('admin/accounts/account_create') ?>',
      type: 'POST',
      dataType: 'json',
      data: form_data
    })
    .done(function(data) {
      if(data.success == true) {
        $('.close').click();
        showAjaxModal_confirm2('Account Created Successfully.', 'Success');

        setTimeout(() => {
          $('#modal_confirm .close').click(); window.location.reload();
        }, 3000);
      } else if(data.success == 'duplicate') {
        showAjaxModal_confirm2('The same account\'s name already exists', 'Error');
      } else {
        $(function(){
          $.each(data, function(index, val) {
          $('#list_err').append('<li>' + val + '</li>');
        }); })

        //$('.close').click();
        showAjaxModal_confirm2('<ul id="list_err"></ul>', 'Error');
      }
    });
  });

   //Update Accounts
  function edit_category(id) {


    let form_data = $('#account_update_form').serialize();

    //send data via ajax
    $.ajax({
      url: '<?php echo site_url('admin/accounts/account_update/') ?>' + id,
      type: 'POST',
      dataType: 'json',
      data: form_data
    })
    .done(function(data) {

      if(data.success == true) {
        
        $('.close').click();
        showAjaxModal_confirm2('Account Updated Successfully.', 'Success');

        setTimeout(() => {
          $('#modal_confirm .close').click(); window.location.reload();
        }, 3000);
      } else if(data.success == 'duplicate') {

        showAjaxModal_confirm2('The same account\'s name already exists', 'Error');
      } else {

        $(function(){
          $.each(data, function(index, val) {
          $('#list_err').append('<li>' + val + '</li>');
        }); })

        //$('.close').click();
        showAjaxModal_confirm2('<ul id="list_err"></ul>', 'Error');
      }
    })
    .fail(function(err) {
      $(function(){
          $.each(data, function(index, val) {
          $('#list_err').append('<li>' + val + '</li>');
        }); })

        //$('.close').click();
        //showAjaxModal_confirm2('<ul id="list_err"></ul>', 'Error');
    });
  }

  //Upload logo
  $('#logo_upload_form').submit(function(event) {
    /* Act on the event */
    event.preventDefault();
    let file_data = $('#userfile').prop('files')[0];
    let form_data = new FormData();
    form_data.append('userfile', file_data);
    form_data.append('<?php echo $this->security->get_csrf_token_name(); ?>', '<?php echo $this->security->get_csrf_hash(); ?>');

    //send data via ajax
    $.ajax({
      url: '<?php echo site_url('admin/accounts/upload_logo') ?>',
      type: 'POST',
      data: form_data,
        dataType: 'text',
        cache: false,
        contentType: false,
        processData: false,
    })
    .done(function(data) {
      if(data == true) {
        $('.close').click();
        showAjaxModal_confirm2('Logo Uploaded Successfully.', 'Success');

        setTimeout(() => {
          $('#modal_confirm .close').click(); //window.location.reload();
        }, 3000);
      } else {
          $('.close').click();
          showAjaxModal_confirm2('Failed to upload Logo, please try again!', 'Error');

          setTimeout(() => {
            $('#modal_confirm .close').click();
          }, 3000);
      }
    });
  });

</script>