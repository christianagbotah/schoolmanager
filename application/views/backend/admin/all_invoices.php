
<?php 
    $invoice_code_f       = $this->db->get_where('settings', array('type'=>'invoice_number_format'))->row()->description;
    $inv_number_len = strlen($invoice_code_f);

    $admin_level = $this->db->get_where('admin', array('name' => $name))->row()->level;
    $current_user     = $this->session->userdata('login_type') . '-' . $this->session->userdata('login_user_id');

    
    //currency
    $currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
    $fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);


?>
<style type="text/css">
/* ---- family design-language alignment (presentation only) ---- */
.form-group.row { margin-bottom: 1rem; }
#table_holder { overflow-x: auto; }
#table_holder .dataTables_wrapper { padding: 0; }
#table_holder .dataTables_filter, #table_holder .dataTables_length {
    margin-bottom: .5rem;
}
@media (max-width: 480px) {
    .form-group.row > div[class*="col-"] { padding-left: 0; padding-right: 0; }
}

/* Direct UI/UX rebuild — All Invoices */
.all-invoices-workspace { margin: 0; padding: 0 0 32px; background: #f8fafc; }
.all-invoices-workspace > .col-md-12 { padding: 0; }
.all-invoices-page-head { margin: 0 0 18px; padding: 0 0 18px; border-bottom: 1px solid #e2e8f0; }
.all-invoices-eyebrow { margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.all-invoices-page-head h1 { margin: 0; color: #0f172a; font-size: 24px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em; }
.all-invoices-page-head p:last-child { margin: 7px 0 0; color: #64748b; font-size: 14px; line-height: 1.5; }
.all-invoices-filter-card {
    display: flex; align-items: end; justify-content: space-between; gap: 18px;
    margin-bottom: 16px; padding: 15px 17px; border: 1px solid #e2e8f0;
    border-radius: 12px; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.all-invoices-filter-copy strong { display: block; color: #0f172a; font-size: 15px; font-weight: 800; }
.all-invoices-filter-copy span { display: block; margin-top: 3px; color: #64748b; font-size: 13px; line-height: 1.4; }
.all-invoices-year-field { width: min(260px, 100%); }
.all-invoices-year-field .form-control,
.all-invoices-year-field .selectboxit-container { width: 100% !important; }
.all-invoices-year-field .form-control {
    min-height: var(--sm-ui-control-height, 42px); height: var(--sm-ui-control-height, 42px); padding: 9px 11px; border: 1px solid #cbd5e1;
    border-radius: 9px; font-size: 14px; color: #0f172a; background: #fff;
}
#table_holder {
    overflow-x: auto; -webkit-overflow-scrolling: touch; padding: 0 !important;
    border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#table_holder .dataTables_wrapper { padding: 14px !important; min-width: 1080px; }
#table_holder .dataTables_length,
#table_holder .dataTables_filter,
#table_holder .dataTables_info,
#table_holder .dataTables_paginate { font-size: 14px !important; color: #475569; }
#table_holder .dataTables_filter,
#table_holder .dataTables_length { margin-bottom: 12px !important; }
#table_holder .dataTables_length select,
#table_holder .dataTables_filter input[type="search"] {
    min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
    border-radius: 8px; background: #fff; color: #0f172a; font-size: 14px;
}
@media (max-width: 767px) {
    .all-invoices-workspace { padding: 0 0 28px; }
    .all-invoices-page-head h1 { font-size: 22px; }
    .all-invoices-filter-card { align-items: stretch; flex-direction: column; }
    .all-invoices-year-field { width: 100%; }
}
</style>
<div class="row all-invoices-workspace">
		<div class="all-invoices-page-head">
            <div>
                <p class="all-invoices-eyebrow">Fees & Finance</p>
                <h1>All Invoices</h1>
                <p>Review school-wide invoices by academic year, take payments, view receipts, and manage invoice records.</p>
            </div>
        </div>
        <div class="all-invoices-filter-card">
            <div class="all-invoices-filter-copy">
                <strong>Academic Year</strong>
                <span>Choose a year to load its invoice register.</span>
            </div>
            <div class="all-invoices-year-field">
                <select name="year" onchange="getAllInvoicesByYear($(this).val())" class="form-control selectboxit">
          <?php $running_year = $this->db->get_where('settings' , array('type'=>'running_year'))->row()->description;?>
          <option value="" disabled="true"><?php echo get_phrase('select_year');?></option>
          <?php
						echo populate_academic_year('yes', $year);
						?>
          </select>
            </div>
        </div>
    <div class="col-md-12" id="table_holder">
        

                    
                       
                    
        
    </div>

</div>
<script type="text/javascript">
		$(window).on('load', function(e) {
			getAllInvoicesByYear('<?=$running_year;?>');
			$('.modal').css({
				backgroundColor: 'rgba(2, 2, 2, 0.54)',
			});
		})

    $(document).ready(function($) {

    		boxChecked();
    		

    		/*$.fn.dataTable.ext.errMode = 'throw';
        $('#tinvoices').DataTable({
        	//"processing": true,
    			//"serverSide": true,
        	"columnDefs": [
        	{
        		"targets": [0],
        		"orderable": false
        	}]
        });*/
    });

    function getAllInvoicesByYear(year) {

    	showAjaxModal_alert('LOADING INVOICES. PLEASE WAIT...', 'Loading');

    	$.ajax({
    		url: '<?= site_url('admin/all_invoices/');?>' + year + '/yes',
    		type: 'post',
    		dataType: 'html',

    	})
    	.done(function(data) {
    		$('.close').click();
    		$('#table_holder').html(data);
    	})
    	.fail(function(err) {
    		$('#table_holder').html('<div style="text-align="center">' + err.responseText + '</div>');
    	})
    }


    //toggle check all
    function boxCheckedAll(value) {
    		
        let checkboxes = $('#checkboxes_form tbody td input[type="checkbox"]');

       	let thisVal = $('input[name="all_invoices_sel[]"]').filter(':checked').length;
       	
       	if(checkboxes.length)
        $(function(e) {
        	$.each(checkboxes, (index, val) => {

        		if(thisVal > 0) { //check all
        			val.checked = true;
        			$('#tfooter').removeAttr('style');
        		} else { //uncheck all
        			val.checked = false;
        			$('#tfooter').css('display', 'none');
        		}
        		
        	})
        })
    }

    //is any box checked
    function boxChecked() {
        let checkboxes = $('#checkboxes_form tbody input[type="checkbox"]');
        let count_checked_buttons = checkboxes.filter(':checked').length;

        if(count_checked_buttons < 1) {
            $('#tfooter').css('display', 'none');
        } else {
            $('#tfooter').removeAttr('style');
        }
    }

    

    function invoice_pay_modal(student_id, date = '', term = '') {

       /** invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {
            invoice_code = invoice_code;
        } **/
        if(date != '' && term == '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment2/'); ?>' + student_id + '/' + date, 'take_payment');
        } else if(date != '' && term != '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment2/'); ?>' + student_id + '/' + date + '/' + term, 'take_payment');
        }  else {
            showAjaxModal('<?php echo site_url('modal/popup/modal_take_payment2/'); ?>' + student_id, 'take_payment');
        }
    }

    function view_receipts_modal(student_id, date = '', term = '') {

       /** invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {
            invoice_code = invoice_code;
        } **/
        if(date != '' && term == '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_view_receipts/'); ?>' + student_id + '/' + date, 'take_payment');
        } else if(date != '' && term != '') {
            showAjaxModal('<?php echo site_url('modal/popup/modal_view_receipts/'); ?>' + student_id + '/' + date + '/' + term, 'take_payment');
        }  else {
            showAjaxModal('<?php echo site_url('modal/popup/modal_view_receipts/'); ?>' + student_id, 'take_payment');
        }
    }



    function invoice_view_modal(invoice_code) {

        invoice_code = invoice_code.toString();
        let invoice_original_len = '<?php echo $inv_number_len; ?>';
        let current_invoice_len = invoice_code.length;

        if(invoice_code.substring(0, 1) == '_') {
            invoice_code = invoice_code.substring(1);
        } else {
            invoice_code = invoice_code;
        }

        $.ajax({
            url: '<?php echo site_url('admin/get_invoice_term/'); ?>'+ invoice_code,
            cache: false,
            success: function(response) {
              showAjaxModal('<?php echo site_url('modal/popup/modal_view_invoice/'); ?>' + invoice_code + '/' + response, 'take_payment');
            }
        });

    }



    function bulk_invoice_view_modal(student_id) {

        showAjaxModal('<?php echo site_url('modal/popup/modal_view_bulk_invoice/'); ?>' + student_id, 'take_payment');

    }

    //general payment
    function general_payament_modal(class_id) {

        showAjaxModal('<?php echo site_url('modal/popup/modal_take_general_payment/'); ?>' + class_id, 'take_payment');

    }

    function invoice_edit_modal(invoice_code) {
        showAjaxModal_invoice('<?php echo site_url('modal/popup/modal_edit_invoice/'); ?>' + invoice_code);
    }



</script>