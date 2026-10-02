<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sales Receipt - <?php echo $receipt_code; ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            background: #f5f5f5;
            padding: 20px;
        }

        .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }

        .receipt-header {
            text-align: center;
            border-bottom: 2px dashed #333;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .school-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .school-address {
            font-size: 12px;
            color: #666;
            margin-bottom: 3px;
        }

        .school-phone {
            font-size: 12px;
            color: #666;
        }

        .receipt-title {
            font-size: 20px;
            font-weight: bold;
            margin-top: 15px;
            text-transform: uppercase;
        }

        .receipt-code {
            font-size: 14px;
            color: #666;
            margin-top: 5px;
        }

        .receipt-meta {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #ddd;
        }

        .meta-item {
            font-size: 13px;
        }

        .meta-label {
            color: #666;
            display: inline-block;
            min-width: 100px;
        }

        .meta-value {
            font-weight: bold;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .items-table th {
            background: #333;
            color: white;
            padding: 10px;
            text-align: left;
            font-size: 13px;
        }

        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
        }

        .items-table tr:last-child td {
            border-bottom: 2px solid #333;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .customers-section {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-left: 4px solid #667eea;
        }

        .customers-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }

        .customer-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 8px;
            font-size: 12px;
        }

        .customer-item {
            padding: 5px;
            background: white;
            border: 1px solid #ddd;
        }

        .totals-section {
            margin-top: 20px;
            padding-top: 15px;
            border-top: 2px dashed #333;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
        }

        .total-row.grand {
            font-size: 18px;
            font-weight: bold;
            border-top: 2px solid #333;
            padding-top: 15px;
            margin-top: 10px;
        }

        .receipt-footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px dashed #333;
            text-align: center;
            font-size: 12px;
            color: #666;
        }

        .thank-you {
            font-size: 16px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }

        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-family: Arial, sans-serif;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        }

        .print-button:hover {
            background: #5568d3;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .receipt-container {
                box-shadow: none;
                padding: 20px;
            }

            .print-button {
                display: none;
            }

            .page-break {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <button class="print-button" onclick="window.print()">
        <i class="fa fa-print"></i> Print Receipt
    </button>

    <div class="receipt-container">
        <!-- Header -->
        <div class="receipt-header">
            <div class="school-name"><?php echo $school_name; ?></div>
            <div class="school-address"><?php echo $school_address; ?></div>
            <div class="school-phone">Tel: <?php echo $school_phone; ?></div>
            <div class="receipt-title">Sales Receipt</div>
            <div class="receipt-code">Receipt No: <?php echo $receipt_code; ?></div>
        </div>

        <!-- Meta Information -->
        <div class="receipt-meta">
            <div>
                <div class="meta-item">
                    <span class="meta-label">Sale ID:</span>
                    <span class="meta-value"><?php echo '#' . $sales[0]->id; ?></span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Date:</span>
                    <span class="meta-value"><?php echo date('d M Y, g:i A', strtotime($sales[0]->sale_date)); ?></span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Served By:</span>
                    <span class="meta-value"><?php echo $served_by; ?></span>
                </div>
            </div>
            <div>
                <div class="meta-item">
                    <span class="meta-label">No. of Customers:</span>
                    <span class="meta-value"><?php echo count($sales); ?></span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Transaction Type:</span>
                    <span class="meta-value"><?php echo count($sales) > 1 ? 'Batch Sale' : 'Single Sale'; ?></span>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th class="text-center">Qty</th>
                    <th class="text-right">Unit Price</th>
                    <th class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                <?php 
                $subtotal = 0;
                foreach($items as $item): 
                    $item_total = $item->unit_price * $item->quantity;
                    $subtotal += $item_total;
                ?>
                <tr>
                    <td><?php echo $item->product_name; ?></td>
                    <td><?php echo $item->sku; ?></td>
                    <td class="text-center"><?php echo $item->quantity; ?></td>
                    <td class="text-right"><?php echo $currency; ?> <?php echo number_format($item->unit_price, 2); ?></td>
                    <td class="text-right"><?php echo $currency; ?> <?php echo number_format($item_total, 2); ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <!-- Customers Section -->
        <?php if(count($sales) > 1): ?>
        <div class="customers-section">
            <div class="customers-title">Customers in this Transaction (<?php echo count($sales); ?>):</div>
            <div class="customer-list">
                <?php foreach($sales as $sale): ?>
                <div class="customer-item">
                    <?php 
                    $customer_name = $sale->student_name ?: 'Walk-in Customer';
                    $class_info = '';
                    if($sale->class_name) {
                        $class_info = ' - ' . trim($sale->class_name . ' ' . $sale->name_numeric);
                    }
                    echo $customer_name . $class_info;
                    ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php else: ?>
        <div class="customers-section">
            <div class="customers-title">Customer:</div>
            <div style="font-size: 14px; font-weight: bold;">
                <?php 
                $sale = $sales[0];
                $customer_name = $sale->student_name ?: 'Walk-in Customer';
                $class_info = '';
                if($sale->class_name) {
                    $class_info = ' - ' . trim($sale->class_name . ' ' . $sale->name_numeric);
                }
                echo $customer_name . $class_info;
                ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Totals -->
        <div class="totals-section">
            <div class="total-row">
                <span>Subtotal (per customer):</span>
                <span><?php echo $currency; ?> <?php echo number_format($subtotal, 2); ?></span>
            </div>
            <div class="total-row">
                <span>Number of Customers:</span>
                <span>× <?php echo count($sales); ?></span>
            </div>
            <div class="total-row grand">
                <span>GRAND TOTAL:</span>
                <span><?php echo $currency; ?> <?php echo number_format($subtotal * count($sales), 2); ?></span>
            </div>
        </div>

        <!-- Footer -->
        <div class="receipt-footer">
            <div class="thank-you">Thank You for Your Purchase!</div>
            <div>This is a computer-generated receipt</div>
            <div style="margin-top: 10px;">For inquiries, please contact us at <?php echo $school_phone; ?></div>
            <div style="margin-top: 20px; font-size: 10px;">
                Printed on: <?php echo date('d M Y, g:i A'); ?>
            </div>
        </div>
    </div>

    <script>
        // Auto-print on load (optional - can remove if not desired)
        // window.onload = function() { window.print(); };
    </script>
</body>
</html>
