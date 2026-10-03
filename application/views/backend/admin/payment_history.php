<style>
/* Direct UI/UX rebuild — Payment History */
.payment-history-workspace { padding: 24px 28px 40px; background: #f8fafc; min-height: 100%; }
.payment-history-page-head {
    margin: 0 0 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
}
.payment-history-eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
}
.payment-history-page-head h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
    font-weight: 800; letter-spacing: -.02em;
}
.payment-history-page-head p:last-child {
    margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5;
}
.finance-section-nav {
    display: inline-flex; flex-wrap: wrap; gap: 5px; margin: 0 0 16px; padding: 5px;
    border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
}
.finance-section-nav .btn {
    min-height: 40px; padding: 9px 14px; border: 0 !important; border-radius: 8px !important;
    background: transparent !important; color: #475569 !important;
    font-size: 14px; line-height: 1.35; font-weight: 700;
}
.finance-section-nav .btn-success {
    background: #2563eb !important; color: #fff !important;
    box-shadow: 0 2px 8px rgba(37,99,235,.18);
}
.finance-section-nav .btn-info:hover { background: #f1f5f9 !important; color: #0f172a !important; }

.payment-history-table-card {
    overflow-x: auto; -webkit-overflow-scrolling: touch;
    border: 1px solid #e2e8f0; border-radius: 14px; background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#histories {
    width: 100% !important; min-width: 900px; margin: 0 !important;
    border: 0 !important; border-radius: 0;
}
#histories thead th {
    padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
    font-size: 13px !important; line-height: 1.35; font-weight: 800 !important;
    letter-spacing: .035em; border-bottom: 1px solid #e2e8f0 !important;
}
#histories tbody td {
    padding: 12px 13px !important; color: #334155 !important; font-size: 14px !important;
    line-height: 1.45; vertical-align: middle; border-bottom: 1px solid #eef2f7 !important;
}
#histories tbody tr:hover td { background: #f8fbff !important; }
.payment-history-table-card .dataTables_wrapper { min-width: 900px; padding: 14px; }
.payment-history-table-card .dataTables_length,
.payment-history-table-card .dataTables_filter,
.payment-history-table-card .dataTables_info,
.payment-history-table-card .dataTables_paginate { font-size: 14px; color: #475569; }
.payment-history-table-card .dataTables_length select,
.payment-history-table-card .dataTables_filter input[type="search"] {
    min-height: 40px; padding: 8px 10px; border: 1px solid #cbd5e1;
    border-radius: 8px; background: #fff; color: #0f172a; font-size: 14px;
}
.payment-history-table-card .dataTables_paginate .paginate_button {
    min-height: 36px; min-width: 36px; padding: 7px 10px !important;
    border-radius: 7px !important; font-size: 13px !important;
}
@media (max-width: 767px) {
    .payment-history-workspace { padding: 18px 14px 32px; }
    .payment-history-page-head h1 { font-size: 26px; }
    .finance-section-nav { display: grid; grid-template-columns: 1fr; width: 100%; }
    .finance-section-nav .btn { width: 100%; text-align: left; }
}
</style>

<div class="payment-history-workspace">
    <div class="payment-history-page-head">
        <p class="payment-history-eyebrow">Fees & Finance</p>
        <h1>Payment History</h1>
        <p>Review payment transactions, inspect invoices, and move between finance views from one workspace.</p>
    </div>
    <div class="finance-section-nav">
        <a href="#" onclick="navigation('<?php echo site_url('admin/invoices_show'); ?>')" class="btn btn-<?php if($page_name == 'invoices' || $page_name == 'invoices_loaded') { echo 'success'; } else { echo 'info'; }; ?>">
            <?php echo get_phrase('invoices');?>
        </a>
        <a href="#" onclick="navigation('<?php echo site_url('admin/income/payment_history');?>')" class="btn btn-<?php echo $page_name == 'payment_history' ? 'success' : 'info'; ?>">
            <?php echo get_phrase('payment_history');?>
        </a>
        <a href="#" onclick="navigation('<?php echo site_url('admin/income/student_specific_payment_history');?>')" class="btn btn-<?php echo $page_name == 'student_specific_payment_history' ? 'success' : 'info'; ?>">
            <?php echo get_phrase('student_specific_payment_history');?>
        </a>
    </div>

<?php 
    $invoice_code_f       = $this->db->get_where('settings', array('type'=>'invoice_number_format'))->row()->description;
    $inv_number_len = strlen($invoice_code_f);
?>
<div class="payment-history-table-card">
		<table class="table table-bordered" id="histories">
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
		</table>
    </div>
</div>

<script type="text/javascript">
    $(document).ready(function() {
        $.fn.dataTable.ext.errMode = 'throw';
        $('#histories').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": "<?php echo site_url('admin/get_payments'); ?>",
                "dataType": "json",
                "type": "POST",
            },
            "columns": [
               // { "data": "payment_id" },
                { "data": "title" },
                { "data": "description" },
                { "data": "method" },
                { "data": "amount" },
                { "data": "date" },
                { "data": "options" },
            ],
            "columnDefs": [
                {
                    "targets": [2,5],
                    "orderable": false
                },
            ]
        });
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
