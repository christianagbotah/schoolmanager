<?php
$currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
$fee_type = $param2;
$date = $param3;
$timestamp = strtotime($date);

$fee_labels = [
    'feeding' => 'Feeding Fee',
    'classes' => 'Classes Fee',
    'transport' => 'Transport Fare'
];

$table_map = [
    'feeding' => 'feeding_fee_payment',
    'classes' => 'classes_fee_payment',
    'transport' => 'transport_fare_payment'
];

$table = $table_map[$fee_type];
$label = $fee_labels[$fee_type];

// Get payments for this date
$this->db->select('student_id, amount, issuer_id');
$this->db->where('can_delete !=', 'trash');
$this->db->where('amount >', 0);
$this->db->where('day_timestamp', $timestamp);
$this->db->order_by('amount', 'DESC');
$payments = $this->db->get($table)->result_array();

// Get unique issuers
$issuers = [];
foreach ($payments as $payment) {
    if (!in_array($payment['issuer_id'], $issuers)) {
        $issuers[] = $payment['issuer_id'];
    }
}

// Get unique classes
$classes_list = $this->db->get('class')->result_array();
?>


<style>
/* Direct UI/UX refinement — payment detail modal */
.payment-details-modal { padding: 18px 20px 20px !important; color: #334155; }
.payment-details-modal .mb-3 > .row {
    display: flex; align-items: center; justify-content: space-between; gap: 14px;
    margin-left: 0; margin-right: 0;
}
.payment-details-modal .mb-3 > .row > [class*="col-"] { padding-left: 0; padding-right: 0; }
.payment-details-modal .mb-3 { margin-bottom: 14px !important; font-size: 14px; line-height: 1.55; }
.payment-details-modal .btn-group { display: flex; flex-wrap: wrap; gap: 7px; }
.payment-details-modal .btn-group .btn {
    min-height: 38px; padding: 8px 12px; border-radius: 8px !important;
    font-size: 13px; font-weight: 700;
}
.payment-details-modal .card {
    margin-bottom: 16px !important; padding: 14px !important; border: 1px solid #e2e8f0 !important;
    border-radius: 11px !important; background: #f8fafc !important;
}
.payment-details-modal .card > .row:first-child {
    display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 14px; margin: 0;
}
.payment-details-modal .card > .row:first-child > [class*="col-"] { width: 100%; padding: 0; }
.payment-details-modal .card label {
    display: block; margin-bottom: 7px !important; color: #334155; font-size: 14px; font-weight: 700 !important;
}
.payment-details-modal .card .form-control {
    min-height: 44px; height: 44px; padding: 9px 11px; border: 1px solid #cbd5e1;
    border-radius: 8px !important; background: #fff; color: #0f172a; font-size: 14px;
}
.payment-details-modal .card .form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.12); outline: none;
}
.payment-details-modal .card > .row[style*="margin-top"] {
    margin: 12px 0 0 !important;
}
.payment-details-modal .card > .row[style*="margin-top"] > .col-md-12 {
    padding: 0;
}
.payment-details-modal .card > .row[style*="margin-top"] > .col-md-12 > div {
    padding: 10px 12px !important; border-radius: 8px !important; font-size: 14px;
}
.payment-details-modal .table-responsive {
    margin: 0; border: 1px solid #e2e8f0; border-radius: 11px; overflow-x: auto;
}
#payments_table { min-width: 840px; margin: 0 !important; }
#payments_table thead { background: #f8fafc !important; }
#payments_table thead th {
    padding: 11px 12px !important; border: 0 !important; border-bottom: 1px solid #e2e8f0 !important;
    color: #475569 !important; font-size: 13px !important; line-height: 1.35; font-weight: 800 !important;
    letter-spacing: .03em;
}
#payments_table tbody td {
    padding: 11px 12px !important; color: #334155 !important; font-size: 14px !important;
    line-height: 1.45; border-bottom: 1px solid #eef2f7 !important; vertical-align: middle;
}
#payments_table tbody tr:hover td { background: #f8fbff; }
#payments_table .badge { padding: 5px 8px !important; border-radius: 999px !important; font-size: 12px; font-weight: 700; }
#payments_table tfoot { background: #eff6ff !important; border-top: 1px solid #bfdbfe !important; }
#payments_table tfoot td { padding: 11px 12px !important; font-size: 14px !important; }
.payment-details-modal .dataTables_wrapper { padding-top: 12px; font-size: 14px; }
.payment-details-modal .dataTables_wrapper select,
.payment-details-modal .dataTables_wrapper input[type="search"] {
    min-height: 38px; padding: 7px 9px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px;
}
@media (max-width: 767px) {
    .payment-details-modal { padding: 14px !important; }
    .payment-details-modal .mb-3 > .row { align-items: flex-start; flex-direction: column; }
    .payment-details-modal .btn-group { width: 100%; }
    .payment-details-modal .btn-group .btn { flex: 1 1 auto; }
    .payment-details-modal .card > .row:first-child { grid-template-columns: 1fr; }
}
</style>


<div class="modal-header" style="background:#ffffff; border-bottom:1px solid #e2e8f0; padding:16px 20px;">
    <button type="button" class="close" data-dismiss="modal" style="opacity: 0.6;">&times;</button>
    <h4 class="modal-title" style="color:#0f172a; font-size:18px; font-weight:800; line-height:1.35;"><i class="fa fa-money-bill-wave"></i> <?php echo $label; ?> - Payments Collected</h4>
</div>

<div class="modal-body payment-details-modal">
    <div class="mb-3" style="margin-bottom: 15px;">
        <div class="row">
            <div class="col-md-6">
                <strong>Date:</strong> <?php echo date('l, F d, Y', $timestamp); ?>
                <br><strong>Total Payments:</strong> <span id="total_count"><?php echo count($payments); ?></span>
            </div>
            <div class="col-md-6 text-right">
                <div class="btn-group">
                    <button onclick="export_payments_excel('<?php echo $fee_type; ?>')" class="btn btn-success btn-sm">
                        <i class="fa fa-file-excel"></i> Export Excel
                    </button>
                    <button onclick="export_payments_pdf('<?php echo $fee_type; ?>')" class="btn btn-danger btn-sm">
                        <i class="fa fa-file-pdf"></i> Export PDF
                    </button>
                    <button onclick="print_payments('<?php echo $fee_type; ?>')" class="btn btn-primary btn-sm">
                        <i class="fa fa-print"></i> Print
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Filters -->
    <div class="card" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
        <div class="row">
            <div class="col-md-6">
                <label style="font-weight: 600; margin-bottom: 5px;"><i class="fa fa-user"></i> Filter by Collector:</label>
                <select id="filter_issuer" class="form-control" style="border-radius: 6px;">
                    <option value="">All Collectors</option>
                    <?php foreach ($issuers as $issuer_id): 
                        if (substr($issuer_id, 0, 1) == 't') {
                            $tid = substr($issuer_id, 1);
                            $issuer = $this->db->get_where('teacher', ['teacher_id' => $tid])->row();
                            $issuer_name = $issuer->name . ' (Teacher)';
                        } else {
                            $issuer = $this->db->get_where('admin', ['admin_id' => $issuer_id])->row();
                            $issuer_name = $issuer->name . ' (Admin)';
                        }
                    ?>
                        <option value="<?php echo $issuer_id; ?>"><?php echo $issuer_name; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div class="col-md-6">
                <label style="font-weight: 600; margin-bottom: 5px;"><i class="fa fa-school"></i> Filter by Class:</label>
                <select id="filter_class" class="form-control" style="border-radius: 6px;">
                    <option value="">All Classes</option>
                    <?php getFullClassList(); ?>
                </select>
            </div>
        </div>
        <div class="row" style="margin-top: 15px;">
            <div class="col-md-12">
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0;">
                    <strong>Filtered Total:</strong> <span id="filtered_total" style="color: #3b82f6; font-size: 1.2em; font-weight: bold;"><?php echo $currency; ?>0.00</span>
                    <span style="margin-left: 20px;"><strong>Count:</strong> <span id="filtered_count" style="color: #3b82f6; font-weight: bold;">0</span></span>
                </div>
            </div>
        </div>
    </div>

    <?php if (empty($payments)): ?>
        <div class="alert alert-info text-center">
            <i class="fa fa-info-circle"></i> No payments collected on this date.
        </div>
    <?php else: ?>
        <div class="table-responsive">
            <table class="table table-hover" id="payments_table" style="width:100%">
                <thead style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">
                    <tr>
                        <th style="border: none; color: #ffffff !important;">#</th>
                        <th style="border: none; color: #ffffff !important;">Student Code</th>
                        <th style="border: none; color: #ffffff !important;">Student Name</th>
                        <th style="border: none; color: #ffffff !important;">Class</th>
                        <th style="border: none; color: #ffffff !important;">Collected By</th>
                        <th style="border: none; text-align: right; color: #ffffff !important;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $total = 0;
                    foreach ($payments as $index => $row): 
                        $student = $this->db->get_where('student', ['student_id' => $row['student_id']])->row();
                        $enroll = $this->db->get_where('enroll', ['student_id' => $row['student_id'], 'mute' => '0'])->row();
                        $class = $this->db->get_where('class', ['class_id' => $enroll->class_id])->row();
                        
                        if (substr($row['issuer_id'], 0, 1) == 't') {
                            $tid = substr($row['issuer_id'], 1);
                            $issuer = $this->db->get_where('teacher', ['teacher_id' => $tid])->row();
                            $issuer_name = $issuer->name;
                            $issuer_type = 'Teacher';
                        } else {
                            $issuer = $this->db->get_where('admin', ['admin_id' => $row['issuer_id']])->row();
                            $issuer_name = $issuer->name;
                            $issuer_type = 'Admin';
                        }
                        
                        $amount = $row['amount'];
                        $total += $amount;
                    ?>
                    <tr style="border-bottom: 1px solid #e5e7eb;" 
                        data-issuer="<?php echo $row['issuer_id']; ?>" 
                        data-class="<?php echo $enroll->class_id; ?>"
                        data-amount="<?php echo $amount; ?>">
                        <td style="padding: 12px 8px;"><?php echo $index + 1; ?></td>
                        <td style="padding: 12px 8px;"><strong><?php echo $student->student_code; ?></strong></td>
                        <td style="padding: 12px 8px;"><?php echo $student->name; ?></td>
                        <td style="padding: 12px 8px;"><span class="badge" style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px;"><?php echo $class->name . ' ' . $class->name_numeric; ?></span></td>
                        <td style="padding: 12px 8px;">
                            <span style="color: #64748b;"><?php echo $issuer_name; ?></span>
                            <br><small style="color: #94a3b8;"><?php echo $issuer_type; ?></small>
                        </td>
                        <td style="text-align: right; color: #3b82f6; font-weight: bold; font-size: 1.05em; padding: 12px 8px;">
                            <?php echo $currency . number_format($amount, 2); ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
                <tfoot style="background: #eff6ff; font-weight: bold; border-top: 2px solid #3b82f6;">
                    <tr>
                        <td colspan="5" style="text-align: right; padding: 12px; font-size: 1.1em;">TOTAL:</td>
                        <td style="text-align: right; color: #3b82f6; font-size: 1.2em; padding: 12px;" id="table_total">
                            <?php echo $currency . number_format($total, 2); ?>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <script>
        (function() {
            if ($.fn.DataTable.isDataTable('#payments_table')) {
                $('#payments_table').DataTable().destroy();
            }
            
            while ($.fn.dataTable.ext.search.length > 0) {
                $.fn.dataTable.ext.search.pop();
            }
            
            var table = $('#payments_table').DataTable({
                "pageLength": 25,
                "order": [[5, "desc"]],
                "language": {
                    "search": "Search payments:",
                    "lengthMenu": "Show _MENU_ payments"
                }
            });

            function updateFilteredTotal() {
                var issuer = $('#filter_issuer').val();
                var classId = $('#filter_class').val();
                var total = 0;
                var count = 0;

                table.rows({search: 'applied'}).every(function() {
                    var row = $(this.node());
                    var rowIssuer = row.attr('data-issuer');
                    var rowClass = row.attr('data-class');
                    var show = true;

                    if (issuer && rowIssuer != issuer) show = false;
                    if (classId && rowClass != classId) show = false;

                    if (show) {
                        total += parseFloat(row.attr('data-amount'));
                        count++;
                    }
                });

                $('#filtered_total').text('<?php echo $currency; ?>' + total.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,'));
                $('#filtered_count').text(count);
            }
            
            var customFilter = function(settings, data, dataIndex) {
                if (settings.nTable.id !== 'payments_table') return true;
                
                var issuer = $('#filter_issuer').val();
                var classId = $('#filter_class').val();
                var row = table.row(dataIndex).node();
                var $row = $(row);
                
                if (issuer && $row.attr('data-issuer') != issuer) return false;
                if (classId && $row.attr('data-class') != classId) return false;
                
                return true;
            };
            
            $.fn.dataTable.ext.search.push(customFilter);

            $('#filter_issuer, #filter_class').off('change').on('change', function() {
                table.draw();
                updateFilteredTotal();
            });

            table.on('draw', function() {
                updateFilteredTotal();
            });
            
            setTimeout(function() {
                updateFilteredTotal();
            }, 100);
        })();
        </script>
    <?php endif; ?>
</div>

<div class="modal-footer">
    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
</div>

<script>
$('#modal_ajax').one('hidden.bs.modal', function() {
    location.reload();
});
</script>
