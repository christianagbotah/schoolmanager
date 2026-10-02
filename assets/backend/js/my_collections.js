let currentTransactions = [];
let currentReportType = 'detailed';

// Initialize Select2 for student filter
$(document).ready(function() {
    $('#student_filter').select2({
        placeholder: 'Search student by name or code',
        allowClear: true,
        ajax: {
            url: base_url + 'index.php/admin/search_students_ajax',
            dataType: 'json',
            delay: 250,
            data: function(params) {
                return {
                    q: params.term,
                    page: params.page || 1
                };
            },
            processResults: function(data) {
                return {
                    results: data.results || [],
                    pagination: {
                        more: data.pagination && data.pagination.more
                    }
                };
            },
            cache: true
        },
        minimumInputLength: 2
    });
});

function toggleReportView() {
    currentReportType = $('#report_type').val();
    if(currentTransactions.length > 0) {
        loadReport();
    }
}

function loadReport() {
    showAjaxModal_alert('Loading report...', 'loading');
    
    var dateFrom = $('#date_from').val();
    var dateTo = $('#date_to').val();
    var dateFromFormatted = formatDateForBackend(dateFrom);
    var dateToFormatted = formatDateForBackend(dateTo);
    var reportType = $('#report_type').val();
    var collectorId = $('#collector_filter_top').length ? $('#collector_filter_top').val() : ($('#collector_filter').length ? $('#collector_filter').val() : '');
    
    console.log('Request data:', {
        report_type: reportType,
        date_from: dateFromFormatted,
        date_to: dateToFormatted,
        class_id: $('#class_filter').val(),
        payment_method: $('#payment_method_filter').val(),
        student_id: $('#student_filter').val(),
        collector_id: collectorId
    });
    
    $.ajax({
        url: base_url + 'index.php/admin/get_collections_data',
        type: 'POST',
        data: {
            report_type: reportType,
            date_from: dateFromFormatted,
            date_to: dateToFormatted,
            class_id: $('#class_filter').val(),
            payment_method: $('#payment_method_filter').val(),
            student_id: $('#student_filter').val(),
            collector_id: collectorId || ''
        },
        dataType: 'json'
    }).done(function(response) {
        $('#modal_alert').modal('hide');
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css('padding-right', '');
        
        console.log('Response:', response);
        console.log('Report Type:', reportType);
        
        if(response.status === 'success') {
            if(reportType === 'class_summary') {
                console.log('Displaying class summary');
                displayClassSummary(response.class_summary, response.totals);
            } else {
                console.log('Displaying detailed transactions');
                currentTransactions = response.transactions;
                displayTransactions(response.transactions, response.totals);
            }
        } else {
            setTimeout(function() {
                showAjaxModal_alert(response.message || 'Failed to load report', 'error');
            }, 300);
        }
    }).fail(function() {
        $('#modal_alert').modal('hide');
        $('.modal-backdrop').remove();
        $('body').removeClass('modal-open').css('padding-right', '');
        setTimeout(function() {
            showAjaxModal_alert('An error occurred', 'error');
        }, 300);
    });
}

function formatDateForBackend(dateStr) {
    var date = new Date(dateStr);
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function displayTransactions(transactions, totals) {
    $('#detailed_report').show();
    $('#class_summary_report').hide();
    
    $('#total_feeding').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.feeding).toFixed(2));
    $('#total_breakfast').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.breakfast).toFixed(2));
    $('#total_classes').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.classes).toFixed(2));
    $('#total_water').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.water).toFixed(2));
    $('#total_transport').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.transport).toFixed(2));
    $('#grand_total').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.grand_total).toFixed(2));
    $('#transaction_count').text(totals.count);
    
    // Destroy existing DataTable if it exists
    if ($.fn.DataTable.isDataTable('#transactions_table')) {
        $('#transactions_table').DataTable().destroy();
    }
    
    var html = '';
    if(transactions.length === 0) {
        html = '<tr><td colspan="12" style="text-align: center; padding: 40px; color: #9ca3af;"><div style="display: flex; flex-direction: column; align-items: center; gap: 10px;"><i class="fa fa-inbox" style="font-size: 36px;"></i><span>No transactions found</span></div></td></tr>';
        $('#transactions_tbody').html(html);
    } else {
        transactions.forEach(function(t, index) {
            var className = (t.class_name || '') + ' ' + (t.name_numeric || '');
            var sectionName = t.section_name || '';
            var paymentMethod = t.payment_method_name || 'Unknown';
            var methodColor = t.payment_method == 1 ? '#10b981' : (t.payment_method == 2 ? '#3b82f6' : (t.payment_method == 3 ? '#f59e0b' : '#8b5cf6'));
            
            var date = new Date(t.payment_date * 1000);
            var day = String(date.getDate()).padStart(2, '0');
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var year = date.getFullYear();
            var formattedDate = day + '-' + month + '-' + year;
            
            html += '<tr data-transaction-id="' + t.id + '" data-student-id="' + t.student_id + '" data-payment-date="' + t.payment_date + '">';
            html += '<td class="no-print"><input type="checkbox" class="checkbox-modern transaction-checkbox" data-student-id="' + t.student_id + '" data-payment-date="' + t.payment_date + '"></td>';
            html += '<td>' + (index + 1) + '</td>';
            html += '<td>' + formattedDate + '</td>';
            html += '<td><div style="font-weight: 400;">' + t.student_name + '</div><div style="font-size: 11px; color: #6b7280;">' + t.student_code + '</div></td>';
            html += '<td><div>' + className + '</div><div style="font-size: 11px; color: #6b7280;">' + sectionName + '</div></td>';
            html += '<td style="text-align: right;">' + (parseFloat(t.feeding_amount) > 0 ? parseFloat(t.feeding_amount).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right;">' + (parseFloat(t.breakfast_amount) > 0 ? parseFloat(t.breakfast_amount).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right;">' + (parseFloat(t.classes_amount) > 0 ? parseFloat(t.classes_amount).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right;">' + (parseFloat(t.water_amount) > 0 ? parseFloat(t.water_amount).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right;">' + (parseFloat(t.transport_amount) > 0 ? parseFloat(t.transport_amount).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right; font-weight: 700; color: #10b981;">' + parseFloat(t.total_amount).toFixed(2) + '</td>';
            html += '<td style="text-align: center;"><span style="background: ' + methodColor + '20; color: ' + methodColor + '; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 600;">' + paymentMethod + '</span></td>';
            html += '</tr>';
        });
    }
    
    $('#transactions_body').html(html);
    $('#select_all_checkbox').prop('checked', false);
    
    // Initialize DataTables with pagination
    if(transactions.length > 0) {
        $('#transactions_table').DataTable({
            pageLength: 25,
            lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
            order: [[2, 'desc']], // Sort by date column descending
            columnDefs: [
                { orderable: false, targets: 0 } // Disable sorting on checkbox column
            ],
            language: {
                search: "Search transactions:",
                lengthMenu: "Show _MENU_ transactions",
                info: "Showing _START_ to _END_ of _TOTAL_ transactions",
                infoEmpty: "No transactions to show",
                infoFiltered: "(filtered from _MAX_ total transactions)",
                paginate: {
                    first: "First",
                    last: "Last",
                    next: "Next",
                    previous: "Previous"
                }
            }
        });
        
        // Remove inline width style added by DataTables for print compatibility
        $('#transactions_table').css('width', '');
    }
}

function displayClassSummary(classSummary, totals) {
    $('#detailed_report').hide();
    $('#class_summary_report').show();
    
    $('#total_feeding').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.feeding).toFixed(2));
    $('#total_breakfast').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.breakfast).toFixed(2));
    $('#total_classes').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.classes).toFixed(2));
    $('#total_water').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.water).toFixed(2));
    $('#total_transport').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.transport).toFixed(2));
    $('#grand_total').html('<span class="currency">' + currency + '</span> ' + parseFloat(totals.grand_total).toFixed(2));
    
    var html = '';
    if(classSummary.length === 0) {
        html = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #9ca3af;"><div style="display: flex; flex-direction: column; align-items: center; gap: 10px;"><i class="fa fa-inbox" style="font-size: 36px;"></i><span>No data found</span></div></td></tr>';
    } else {
        classSummary.forEach(function(row, index) {
            var rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
            var paymentMethods = [];
            if(parseFloat(row.cash_total) > 0) paymentMethods.push('Cash');
            if(parseFloat(row.momo_total) > 0) paymentMethods.push('MoMo');
            if(parseFloat(row.bank_total) > 0) paymentMethods.push('Bank');
            if(parseFloat(row.cheque_total) > 0) paymentMethods.push('Cheque');
            var paymentMethodText = paymentMethods.length > 0 ? paymentMethods.join(', ') : '-';
            
            var classDisplay = row.class_name + ' ' + row.name_numeric + (row.section_name ? ' - ' + row.section_name : '');
            
            html += '<tr style="background: ' + rowBg + ';">';
            html += '<td><div style="font-weight: 600; color: #1f2937; font-size: 14px;">' + classDisplay + '</div></td>';
            html += '<td style="text-align: center;"><span style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 6px 14px; border-radius: 8px; font-weight: 700; font-size: 13px; display: inline-block; min-width: 40px;">' + row.student_count + '</span></td>';
            html += '<td style="text-align: right; font-weight: 600; color: #ec4899; font-size: 14px;">' + (parseFloat(row.feeding_total) > 0 ? parseFloat(row.feeding_total).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right; font-weight: 600; color: #f59e0b; font-size: 14px;">' + (parseFloat(row.breakfast_total) > 0 ? parseFloat(row.breakfast_total).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right; font-weight: 600; color: #3b82f6; font-size: 14px;">' + (parseFloat(row.classes_total) > 0 ? parseFloat(row.classes_total).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right; font-weight: 600; color: #06b6d4; font-size: 14px;">' + (parseFloat(row.water_total) > 0 ? parseFloat(row.water_total).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: right; font-weight: 600; color: #8b5cf6; font-size: 14px;">' + (parseFloat(row.transport_total) > 0 ? parseFloat(row.transport_total).toFixed(2) : '-') + '</td>';
            html += '<td style="text-align: center; font-weight: 600; color: #6b7280; font-size: 12px;">' + paymentMethodText + '</td>';
            html += '<td style="text-align: right; font-weight: 700; color: #10b981; font-size: 15px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);">' + parseFloat(row.class_total).toFixed(2) + '</td>';
            html += '</tr>';
        });
        
        html += '<tr class="grand-total-row" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; font-weight: 700; border-top: 3px solid #10b981;">';
        html += '<td style="text-align: right; padding: 16px; font-size: 15px; letter-spacing: 0.5px; font-weight: 700; color: white;">GRAND TOTAL</td>';
        html += '<td style="text-align: center; font-size: 15px; padding: 16px; font-weight: 700; color: white;">-</td>';
        html += '<td style="text-align: right; font-size: 15px; padding: 16px; font-weight: 700; color: white;">' + parseFloat(totals.feeding).toFixed(2) + '</td>';
        html += '<td style="text-align: right; font-size: 15px; padding: 16px; font-weight: 700; color: white;">' + parseFloat(totals.breakfast).toFixed(2) + '</td>';
        html += '<td style="text-align: right; font-size: 15px; padding: 16px; font-weight: 700; color: white;">' + parseFloat(totals.classes).toFixed(2) + '</td>';
        html += '<td style="text-align: right; font-size: 15px; padding: 16px; font-weight: 700; color: white;">' + parseFloat(totals.water).toFixed(2) + '</td>';
        html += '<td style="text-align: right; font-size: 15px; padding: 16px; font-weight: 700; color: white;">' + parseFloat(totals.transport).toFixed(2) + '</td>';
        html += '<td style="text-align: center; font-size: 15px; padding: 16px; font-weight: 700; color: white;">-</td>';
        html += '<td style="text-align: right; font-size: 17px; padding: 16px; font-weight: 800; color: white;">' + parseFloat(totals.grand_total).toFixed(2) + '</td>';
        html += '</tr>';
    }
    
    $('#class_summary_body').html(html);
}

function toggleSelectAll() {
    var checked = $('#select_all_checkbox').is(':checked');
    $('.transaction-checkbox').prop('checked', checked);
    if(checked) {
        $('.transaction-checkbox').closest('tr').addClass('selected');
    } else {
        $('.transaction-checkbox').closest('tr').removeClass('selected');
    }
}

function selectAll() {
    $('#select_all_checkbox').prop('checked', true);
    toggleSelectAll();
}

$(document).on('change', '.transaction-checkbox', function() {
    if($(this).is(':checked')) {
        $(this).closest('tr').addClass('selected');
    } else {
        $(this).closest('tr').removeClass('selected');
    }
});

function printSelectedReceipts() {
    var receipts = [];
    $('.transaction-checkbox:checked').each(function() {
        receipts.push({
            student_id: $(this).data('student-id'),
            payment_date: $(this).data('payment-date')
        });
    });
    
    if(receipts.length === 0) {
        showAjaxModal_alert('Please select transactions', 'warning');
        return;
    }
    
    receipts.forEach(function(receipt) {
        window.open(base_url + 'index.php/admin/print_fee_receipt/' + receipt.student_id + '/' + receipt.payment_date, '_blank');
    });
}



function printReport() {
    var reportType = $('#report_type').val();
    var selectedCollectorName = $('#collector_filter_top option:selected').text();
    var collectorDisplayName = selectedCollectorName && selectedCollectorName !== "<?php echo get_phrase('all_collectors'); ?>" ? selectedCollectorName : collectorName;
    
    if(reportType === 'class_summary') {
        var summaryTable = document.getElementById('class_summary_table');
        if(!summaryTable || $('#class_summary_body tr').length === 0) {
            showAjaxModal_alert('No data to print', 'warning');
            return;
        }
        
        var printWindow = window.open('', '_blank');
        var html = '<html><head><title>Class Summary Report</title>';
        html += '<style>';
        html += 'body{font-family:Arial;padding:20px;}';
        html += 'table{width:100%;border-collapse:collapse;}';
        html += 'th,td{border:1px solid #ddd;padding:10px;}';
        html += 'th{background:#f3f4f6;font-weight:600;text-align:left;}';
        html += 'td{font-size:13px;}';
        html += 'tr:nth-child(even){background:#f9fafb;}';
        html += '.text-right{text-align:right;}';
        html += '.text-center{text-align:center;}';
        html += '.student-count{background:#3b82f6;color:white;padding:6px 14px;border-radius:8px;font-weight:700;display:inline-block;}';
        html += '.feeding-col{color:#ec4899;font-weight:600;}';
        html += '.breakfast-col{color:#f59e0b;font-weight:600;}';
        html += '.classes-col{color:#3b82f6;font-weight:600;}';
        html += '.water-col{color:#06b6d4;font-weight:600;}';
        html += '.transport-col{color:#8b5cf6;font-weight:600;}';
        html += '.method-col{color:#6b7280;font-weight:600;}';
        html += '.total-col{color:#10b981;font-weight:700;background:#f0fdf4;}';
        html += '.grand-total-row{background:#e5e7eb !important;}';
        html += '.grand-total-row td{font-weight:700 !important;color:#1f2937 !important;padding:16px !important;}';
        html += '</style>';
        html += '</head><body>';
        html += '<h2 style="text-align:center;">CLASS SUMMARY REPORT - DAILY FEES</h2>';
        html += '<p><strong>Collector:</strong> ' + collectorDisplayName + '</p>';
        html += '<p><strong>Date Range:</strong> ' + $('#date_from').val() + ' to ' + $('#date_to').val() + '</p>';
        
        var paymentMethodFilter = $('#payment_method_filter').val();
        var paymentMethodText = $('#payment_method_filter option:selected').text();
        html += '<p><strong>Payment Method:</strong> ' + paymentMethodText + '</p>';
        
        html += '<table><thead><tr>';
        html += '<th>Class</th><th class="text-center">Students</th><th class="text-right">Feeding</th><th class="text-right">Breakfast</th><th class="text-right">Classes</th><th class="text-right">Water</th><th class="text-right">Transport</th><th class="text-center">Method</th><th class="text-right">Total</th>';
        html += '</tr></thead><tbody>';
        
        var summaryData = $('#class_summary_body tr').not('.grand-total-row');
        summaryData.each(function() {
            var cells = $(this).find('td');
            if(cells.length > 1) {
                html += '<tr>';
                html += '<td>' + $(cells[0]).text() + '</td>';
                html += '<td class="text-center"><span class="student-count">' + $(cells[1]).text() + '</span></td>';
                html += '<td class="text-right feeding-col">' + $(cells[2]).text() + '</td>';
                html += '<td class="text-right breakfast-col">' + $(cells[3]).text() + '</td>';
                html += '<td class="text-right classes-col">' + $(cells[4]).text() + '</td>';
                html += '<td class="text-right water-col">' + $(cells[5]).text() + '</td>';
                html += '<td class="text-right transport-col">' + $(cells[6]).text() + '</td>';
                html += '<td class="text-center method-col">' + $(cells[7]).text() + '</td>';
                html += '<td class="text-right total-col">' + $(cells[8]).text() + '</td>';
                html += '</tr>';
            }
        });
        
        var grandTotalRow = $('#class_summary_body tr.grand-total-row td');
        if(grandTotalRow.length > 0) {
            html += '<tr class="grand-total-row">';
            html += '<td class="text-right">GRAND TOTAL</td>';
            html += '<td class="text-center">-</td>';
            html += '<td class="text-right">' + $(grandTotalRow[2]).text() + '</td>';
            html += '<td class="text-right">' + $(grandTotalRow[3]).text() + '</td>';
            html += '<td class="text-right">' + $(grandTotalRow[4]).text() + '</td>';
            html += '<td class="text-right">' + $(grandTotalRow[5]).text() + '</td>';
            html += '<td class="text-right">' + $(grandTotalRow[6]).text() + '</td>';
            html += '<td class="text-center">-</td>';
            html += '<td class="text-right">' + $(grandTotalRow[8]).text() + '</td>';
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        html += '</body></html>';
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(function() { printWindow.print(); }, 500);
        return;
    }
    
    if(currentTransactions.length === 0) {
        showAjaxModal_alert('No data to print', 'warning');
        return;
    }
    
    var totals = {
        feeding: parseFloat($('#total_feeding').text().replace(currency, '').trim()),
        breakfast: parseFloat($('#total_breakfast').text().replace(currency, '').trim()),
        classes: parseFloat($('#total_classes').text().replace(currency, '').trim()),
        water: parseFloat($('#total_water').text().replace(currency, '').trim()),
        transport: parseFloat($('#total_transport').text().replace(currency, '').trim()),
        grand: parseFloat($('#grand_total').text().replace(currency, '').trim())
    };
    
    var printWindow = window.open('', '_blank');
    var html = '<html><head><title>My Collections Report</title>';
    html += '<style>body{font-family:Arial;padding:20px;margin:0;} .header{border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:20px;} .header h2{margin:0 0 10px 0;text-align:center;} .collector-info{background:#f3f4f6;padding:15px;border-radius:8px;margin-bottom:20px;} .collector-info p{margin:5px 0;} table{width:100%;border-collapse:collapse;margin-bottom:20px;} th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px;} th{background:#f3f4f6;font-weight:600;} .no-print{display:none;} .totals-row{background:#e5e7eb;font-weight:700;} .text-right{text-align:right;} .date-col{display:none;}</style>';
    html += '</head><body>';
    html += '<div class="header"><h2>MY COLLECTIONS REPORT</h2></div>';
    html += '<div class="collector-info">';
    html += '<p><strong>Collector:</strong> ' + collectorDisplayName + '</p>';
    html += '<p><strong>Date Range:</strong> ' + $('#date_from').val() + ' to ' + $('#date_to').val() + '</p>';
    
    var now = new Date();
    var options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    html += '<p><strong>Report Generated:</strong> ' + now.toLocaleDateString('en-US', options) + '</p>';
    html += '</div>';
    
    var tableClone = document.getElementById('transactions_table').cloneNode(true);
    var dateHeader = tableClone.querySelector('thead tr th:nth-child(3)');
    if(dateHeader) dateHeader.classList.add('date-col');
    var dateRows = tableClone.querySelectorAll('tbody tr td:nth-child(3)');
    dateRows.forEach(function(td) { td.classList.add('date-col'); });
    
    var tbody = tableClone.querySelector('tbody');
    var totalsRow = tbody.insertRow();
    totalsRow.className = 'totals-row';
    totalsRow.innerHTML = '<td></td><td colspan="2"><strong>TOTALS:</strong></td>' +
        '<td style="text-align:right;"><strong>' + totals.feeding.toFixed(2) + '</strong></td>' +
        '<td style="text-align:right;"><strong>' + totals.breakfast.toFixed(2) + '</strong></td>' +
        '<td style="text-align:right;"><strong>' + totals.classes.toFixed(2) + '</strong></td>' +
        '<td style="text-align:right;"><strong>' + totals.water.toFixed(2) + '</strong></td>' +
        '<td style="text-align:right;"><strong>' + totals.transport.toFixed(2) + '</strong></td>' +
        '<td style="text-align:right;"><strong>' + totals.grand.toFixed(2) + '</strong></td>' +
        '<td></td>';
    
    html += tableClone.outerHTML;
    html += '</body></html>';
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(function() { printWindow.print(); }, 500);
}

function exportToExcel() {
    if(currentTransactions.length === 0) {
        showAjaxModal_alert('No data to export', 'warning');
        return;
    }
    
    var table = document.getElementById('transactions_table').cloneNode(true);
    $(table).find('.no-print').remove();
    $(table).find('th:first, td:first').remove();
    
    var html = table.outerHTML;
    var url = 'data:application/vnd.ms-excel,' + encodeURIComponent(html);
    var downloadLink = document.createElement("a");
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    var dateFrom = formatDateForBackend($('#date_from').val());
    var dateTo = formatDateForBackend($('#date_to').val());
    downloadLink.download = 'my_collections_' + dateFrom + '_to_' + dateTo + '.xls';
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


$(document).ready(function() {
    $('.datepicker').datepicker({
        format: 'dd M, yyyy',
        autoclose: true,
        todayHighlight: true,
        orientation: 'bottom'
    });
    
    $('#report_type').on('change', function() {
        var reportType = $(this).val();
        if($('#transactions_body tr').length > 1 || $('#class_summary_body tr').length > 1) {
            loadReport();
        }
    });
    
    $('#collector_filter_top').on('change', function() {
        if($('#transactions_body tr').length > 1 || $('#class_summary_body tr').length > 1) {
            loadReport();
        }
    });
    
    loadReport();
});
