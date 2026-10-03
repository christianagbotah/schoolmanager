 <?php           
    //currency
    $currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
    $fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);

    ?>
<style type="text/css">
/* ---- family design-language alignment (presentation only) ---- */
#tinvoices {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    border-collapse: separate;
    overflow: hidden;
}
#tinvoices thead th, #tinvoices thead td {
    background: #f9fafb;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .3px;
    border-bottom: 1px solid #e5e7eb !important;
    vertical-align: middle;
    white-space: nowrap;
}
#tinvoices tbody td {
    border-top: 1px solid #f3f4f6 !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: none !important;
    vertical-align: middle;
    font-size: 13.5px;
    color: #374151;
}
#tinvoices tbody tr:hover td { background: #f8fafc; }
#tinvoices tbody td[colspan="10"] {
    text-align: center;
    padding: 2rem 1rem;
    color: #6b7280;
}
/* numeric + status columns */
#tinvoices th:nth-child(6), #tinvoices th:nth-child(7) { text-align: right; }
#tinvoices td:nth-child(6), #tinvoices td:nth-child(7) { text-align: right; white-space: nowrap; }
#tinvoices th:nth-child(8), #tinvoices td:nth-child(8) { text-align: center; }
#tinvoices tfoot td {
    background: #f9fafb;
    border-top: 2px solid #e5e7eb !important;
    border-left: none !important;
    border-right: none !important;
    border-bottom: none !important;
}
/* action dropdown family */
#tinvoices .dropdown-menu {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(16, 24, 40, .12);
    padding: .25rem 0;
    min-width: 190px;
}
#tinvoices .dropdown-menu > li > a {
    font-size: 13.5px;
    padding: 6px 14px;
    color: #374151;
}
#tinvoices .dropdown-menu > li > a:hover { background: #f3f4f6; color: #111827; }
#tinvoices .dropdown-menu > li > a i { width: 18px; }
#tinvoices .dropdown-menu > .divider { background: #f3f4f6; height: 1px; }
@media (max-width: 640px) {
    #tinvoices { border-radius: 0; border-left: 0; border-right: 0; }
}
</style>
<?php echo form_open(site_url('admin/bulk_invoice_delete/all_invoices'), array('class' => 'form-horizontal form-groups-bordered validate', 'id' => 'checkboxes_form',  'enctype' => 'multipart/form-data'));?>
    <table class="table table-bordered normal_table" id="tinvoices" style="width:100%">
        <thead>
            <tr>
                <td><input type="checkbox" class="checkbox form-control" onclick="boxCheckedAll()" name="all_invoices_sel[]"></td>
                <th><div><?php echo get_phrase('invoice_#');?></div></th>
                <th><div><?php echo get_phrase('student');?></div></th>
                <th><div><?php echo get_phrase('class');?></div></th>
                <th><div><?php echo get_phrase('term');?></div></th>
                <th><div><?php echo get_phrase('total');?></div></th>
                <th><div><?php echo get_phrase('paid');?></div></th>
                <th><div><?php echo get_phrase('status');?></div></th>
                <th><div><?php echo get_phrase('date_created');?></div></th>
                <th><div><?php echo get_phrase('options');?></div></th>
                
            </tr>
        </thead>
        <tbody>
    <?php

if(count($page_data) > 0):
    foreach ($page_data as $row) {

                    if($row->invoice_code[0] == 0) {
                            $in_code = '_'.$row->invoice_code;
                    } else {
                        $in_code = $row->invoice_code;
                    }

                    $in_code = trim($in_code);

                    //amount due
                    $this->db->select_sum('due');
                    $a_due = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->due;

                    //total amount
                    $this->db->select_sum('amount');
                    $total_amount = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->amount;

                    //total amount paid
                    $this->db->select_sum('amount_paid');
                    $amount_paid = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->amount_paid;

                    //year and term
                    $invoice_year = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->year;
                    //year and term
                    $invoice_term = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->term;

                    //creation date
                    $creation_timestamp = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->creation_timestamp;

                    //student_id
                    $student_id = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->student_id;

                    //invoice_class_id
                    $invoice_class_id = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->class_id;

                    //current_class id
                    
                    $class_name = $this->db->get_where('class', array('class_id' => $invoice_class_id))->row()->name;
                    $class_name_numeric = $this->db->get_where('class', array('class_id' => $invoice_class_id))->row()->name_numeric;

                    //add section A or B if the class has more than one section
                    $section_name = $this->db->get_where('section', array('class_id' => $invoice_class_id))->row()->name;
                    $class_has_more_sections = $this->db->get_where('class', array('name' => $class_name, 'name_numeric' => $class_name_numeric))->num_rows();
                    $sec_name = '';
                    if($class_has_more_sections > 1) {
                        $sec_name = $section_name;
                    }
                    $student_class = $class_name.' '. $class_name_numeric.$sec_name;

                    //invoice_id
                    $invoice_id = $this->db->get_where('invoice', array('invoice_code' => $row->invoice_code))->row()->invoice_id;
                    

                    if ($a_due == 0) {
                        $status = '<span class="btn btn-success btn-xs">'.get_phrase('paid').'</span>';
                        //$payment_text = 'View Receipts';
                    } elseif ($a_due < 0) {
                        $status = '<span class="btn btn-warning btn-xs">'.get_phrase('over_paid').'</span>';
                        //$payment_text = 'View Receipts';
                    } elseif ($a_due > 0 && $amount_paid > 0) {
                        $status = '<span class="btn btn-info btn-xs">'.get_phrase('Part Payment').'</span>';
                        $payment_text = 'View Receipts';
                    } else if($amount_paid == 0) {
                        $status = '<span class="btn btn-danger btn-xs">'.get_phrase('unpaid').'</span>';
                        
                        //$payment_text = 'Take Payment';
                    }

                    $payment_option = '<li><a href="#" onclick="invoice_pay_modal('.$student_id.')" style="color: #2563eb;"><i class="entypo-bookmarks"></i>&nbsp;Take Payment</a></li><li class="divider"></li><li><a href="#" onclick="view_receipts_modal('.$student_id.')" style="color: #2563eb;"><i class="entypo-eye"></i>&nbsp;View Receipts</a></li><li class="divider"></li>';
                    
                    $bulk_invoice_sel = '
                            <input type="checkbox" class="checkbox" onclick="boxChecked()" name="invoices_sel[]" value="'.$row->invoice_code.'">
                            
                            ';
                        
                    
                    $options = '<div class="btn-group">'.get_action_button().'<ul class="dropdown-menu dropdown-default pull-right" role="menu">'.$payment_option.'<li><a href="#" onclick="invoice_view_modal(\''.$in_code.'\')" style="color: #2563eb;"><i class="entypo-credit-card"></i>&nbsp;'.get_phrase('view_invoice').'</a></li><li class="divider"></li>

                                       <li><a href="#" onclick="invoice_delete_confirm(\''.$in_code.'\')" style="color: #dc2626;"><i class="entypo-trash"></i>&nbsp;'.get_phrase('delete').'</a></li></ul></div>';
                    $nchecked      = $bulk_invoice_sel;
                    $ninvoice_code = $row->invoice_code;
                    $nstudent = $this->crud_model->get_type_name_by_id('student',$student_id);
                    $nclass     = $student_class;
                    $nterm =  '<strong>TERM-'.$invoice_term.'</strong>';
                    $ntotal = '<strong>'.numfmt_format_currency($fmt, $total_amount, $currency).'</strong>';
                    $npaid  = '<strong>'.numfmt_format_currency($fmt, $amount_paid, $currency).'</strong>';
                    $nstatus = $status;
                    $ndate = date('d M, Y', $creation_timestamp);
                    $noptions = $options;
                    //$ninvoice_id = $row->invoice_id;

                    //insert the table data here
                    ?>
                    <tr>
                        <td><?= $nchecked; ?></td>
                        <td><?= $ninvoice_code; ?></td>
                        <td><?= $nstudent; ?></td>
                        <td><?= $nclass; ?></td>
                        <td><?= $nterm; ?></td>
                        <td><?= $ntotal; ?></td>
                        <td><?= $npaid; ?></td>
                        <td><?= $nstatus; ?></td>
                        <td><?= $ndate; ?></td>
                        <td><?= $noptions; ?></td>
                    </tr>
                    <?php
                    
                }
        else:
            echo '<tr><td align="center" colspan="10">No Record Found!</td></tr>';
        endif;

                        ?>
        </tbody>
            <tfoot id="tfooter" style="display: none">
                <tr>
                    <td colspan="10" align="center">
                       <input type="button" name="submit_delete" id="submit_delete" class="btn btn-danger" value="Delete Selected Invoices">
                    </td>
                </tr>
            </tfoot>
        </table>
</form>


<script type="text/javascript">
    $(document).ready(function($) {

            $.fn.dataTable.ext.errMode = 'throw';
        $('#tinvoices').DataTable({
            //"processing": true,
                //"serverSide": true,
            "columnDefs": [
            {
                "targets": [0],
                "orderable": false
            }]
        });
    });

    $('#submit_delete').click(function(event) {

        //Scroll to the top
          $('html, body').animate({
              scrollTop: ($('#top').offset().top )
          }, 1000);


         $('#modal_invoice_delete').modal('show', {backdrop: 'static'});

            $('#delete_invoice_link').click(function(event) {
                /* Act on the event */
                showCustomConfirm('Please Are You Really Sure You Want To Do This?', function() {
                    // On Yes
                    $('.close').click();

                    showAjaxModal_alert('DELETING INVOICE(S). PLEASE WAIT...', 'Loading');
                    //if(admin_level == 1) {

                            $('#checkboxes_form').submit();
                        return true;

                        /*} else {
                            confirm_modal('<?php echo site_url('admin/bulk_invoice_delete'); ?>', 'modal_invoice_warning');
                            return false;
                        }*/
                });
                // On No - nothing happens (modal closes)
            });
    });

    function invoice_delete_confirm(invoice_code) {


         confirm_modal('<?php echo site_url('admin/invoice/delete2/'); ?>' + invoice_code, 'modal_invoice_delete');
      
    }
</script>