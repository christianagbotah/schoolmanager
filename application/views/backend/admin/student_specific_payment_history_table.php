<?php 
	$running_year = $this->db->get_where('settings',array('type'=>'running_year'))->row()->description;
	$running_term = $this->db->get_where('settings',array('type'=>'running_term'))->row()->description;
?>


<style>
/* Direct UI/UX refinement — student payment history table */
#student_payments {
    width: 100% !important; min-width: 820px; margin: 0 !important;
    border: 1px solid #e2e8f0 !important; border-radius: 11px; overflow: hidden;
}
#student_payments thead th {
    padding: 11px 12px !important; background: #f8fafc !important; color: #475569 !important;
    font-size: 13px !important; line-height: 1.35; font-weight: 800 !important;
    letter-spacing: .03em; border-bottom: 1px solid #e2e8f0 !important;
}
#student_payments tbody td {
    padding: 11px 12px !important; color: #334155 !important; font-size: 14px !important;
    line-height: 1.45; vertical-align: middle; border-bottom: 1px solid #eef2f7 !important;
}
#student_payments tbody tr:hover td { background: #f8fbff !important; }
#student_payments .btn-sm {
    min-height: 36px; padding: 7px 10px; border-radius: 8px; font-size: 13px; font-weight: 700;
}
#student_payments_wrapper { min-width: 820px; padding-top: 10px; }
#student_payments_wrapper .dataTables_length,
#student_payments_wrapper .dataTables_filter,
#student_payments_wrapper .dataTables_info,
#student_payments_wrapper .dataTables_paginate { font-size: 14px; color: #475569; }
#student_payments_wrapper select,
#student_payments_wrapper input[type="search"] {
    min-height: 38px; padding: 7px 9px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;
}
h4.text-muted {
    margin: 0 0 14px !important; color: #0f172a !important; font-size: 17px !important;
    line-height: 1.4; font-weight: 800 !important;
}
</style>

<?php 
    $invoice_code_f       = $this->db->get_where('settings', array('type'=>'invoice_number_format'))->row()->description;
    $inv_number_len = strlen($invoice_code_f);
?>
<?php if ($student_id != ''): ?>
<h4 class="text-muted" style="margin-bottom: 20px;">
	<?php echo get_phrase('payment_history_for'); ?> <?php echo $this->db->get_where('student', array('student_id' => $student_id))->row()->name; ?>
</h4>
<?php endif; ?>
<table class="table table-bordered" id="student_payments">
	<thead>
        <tr>
            <th><div><?php echo get_phrase('title');?></div></th>
            <th><div><?php echo get_phrase('description');?></div></th>
            <th><div><?php echo get_phrase('method');?></div></th>
            <th><div><?php echo get_phrase('amount');?></div></th>
            <th><div><?php echo get_phrase('date');?></div></th>
            <th><div><?php echo get_phrase('options');?></div></th>
        </tr>
    </thead>
    <tbody>
        <?php
    		$this->db->where('student_id', $student_id);
    		$this->db->where('payment_type' , 'income');
    		$this->db->order_by('timestamp' , 'desc');
            $this->db->where('can_delete !=', 'trash');
    		$payments = $this->db->get('payment')->result_array();
    		foreach ($payments as $row): ?>

                <?php 
                    //filter the invoice code
                    if($row['invoice_code'][0] == 0 && $row['invoice_code'] != null ) {
                        $in_code = '_'.$row['invoice_code'];
                    } else if($row['invoice_code'] == '' || $row['invoice_code'] == null){
                        $no_invoice = 1;
                    } else if($row['invoice_code'] == 0){
                        $in_code = 900000000 + $row['invoice_id'];
                    }else {
                        $in_code = $row['invoice_code'];
                    }

                    if($no_invoice != 1):
                ?>
	        <tr>
	            <td><?php echo $row['title'];?></td>
	            <td><?php echo $row['description'];?></td>
	            <td>
	            	<?php
	            		if ($row['method'] == 1)
	            			echo get_phrase('cash');
	            		if ($row['method'] == 2)
	            			echo get_phrase('check');
	            		if ($row['method'] == 3)
	            			echo get_phrase('card');
	                    if ($row['method'] == 4)
	                    	echo 'Mobile Money';
	            	?>
	            </td>
	            <td><?php echo $row['amount'];?></td>
	            <td><?php echo date('d M,Y', $row['timestamp']);?></td>

                
	            <td align="center">


	            	<a href="#" class="btn btn-primary btn-sm" onclick="invoice_view_modal('<?php echo $in_code;?>')">
                            <i class="entypo-credit-card"></i>&nbsp;<?php echo get_phrase('view_invoice');?>
                    </a> &nbsp;
                    <a href="#" class="btn btn-danger btn-sm" onclick="bulk_invoice_view_modal('<?php echo $student_id;?>')">
                            <i class="entypo-credit-card"></i>&nbsp;<?php echo get_phrase('view_bulk_invoice');?>
                    </a>
	            </td>
            
	        </tr>
            <?php endif; ?>
        <?php endforeach; ?>
    </tbody>
</table>

<script type="text/javascript">
	$(document).ready(function() {
		$('#student_payments').dataTable();
	});

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
            success: function(response) {
              showAjaxModal('<?php echo site_url('modal/popup/modal_view_invoice/');?>' + invoice_code + '/' + response);  
            }
        });
    }

   function bulk_invoice_view_modal(student_id) {

        showAjaxModal('<?php echo site_url('modal/popup/modal_view_bulk_invoice/');?>' + student_id);  
        
    }
</script>
