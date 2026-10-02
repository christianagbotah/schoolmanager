<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Attendance Report - <?php echo $system_name; ?></title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif; }
        body { padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
        .header h1 { color: #667eea; font-size: 28px; margin-bottom: 5px; }
        .header h2 { color: #666; font-size: 18px; margin-bottom: 10px; }
        .header p { color: #888; font-size: 14px; }
        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
        .stat-box { border: 2px solid #e5e7eb; padding: 15px; text-align: center; border-radius: 8px; }
        .stat-box.green { border-color: #10b981; }
        .stat-box.red { border-color: #ef4444; }
        .stat-box.orange { border-color: #f59e0b; }
        .stat-box.blue { border-color: #3b82f6; }
        .stat-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .stat-value { font-size: 32px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 600; border: 1px solid #e5e7eb; }
        td { padding: 10px; border: 1px solid #e5e7eb; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; display: inline-block; }
        .badge-success { background: #d1fae5; color: #065f46; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        .badge-warning { background: #fef3c7; color: #92400e; }
        .footer { margin-top: 30px; text-align: center; color: #888; font-size: 12px; }
        .btn-print { margin: 10px 0; padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; }
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1><?php echo $system_name; ?></h1>
        <h2>Attendance Report</h2>
        <p>Period: <strong><?php echo $start_date . ' to ' . $end_date; ?></strong></p>
        <button onclick="window.print()" class="btn-print no-print">ЁЯЦия╕П Print Report</button>
    </div>

    <div class="stats">
        <div class="stat-box blue">
            <div class="stat-label">Total Days</div>
            <div class="stat-value"><?php echo $stats['total_days']; ?></div>
        </div>
        <div class="stat-box green">
            <div class="stat-label">Present</div>
            <div class="stat-value"><?php echo $stats['total_present']; ?></div>
        </div>
        <div class="stat-box red">
            <div class="stat-label">Absent</div>
            <div class="stat-value"><?php echo $stats['total_absent']; ?></div>
        </div>
        <div class="stat-box orange">
            <div class="stat-label">Attendance Rate</div>
            <div class="stat-value"><?php echo $stats['attendance_rate']; ?>%</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Student Name</th>
                <th>Class</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Sick-Home</th>
                <th>Sick-Clinic</th>
                <th>Rate</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach($students as $s): 
                $rate = $s['percentage'];
                $badgeClass = $rate >= 90 ? 'badge-success' : ($rate >= 75 ? 'badge-warning' : 'badge-danger');
            ?>
            <tr>
                <td><strong><?php echo $s['name']; ?></strong></td>
                <td>
                    <strong><?php echo $s['class_name']; ?></strong>
                    <?php if($s['section_name']): ?>
                        <br><small style="color: #6b7280;"><?php echo $s['section_name']; ?></small>
                    <?php endif; ?>
                </td>
                <td><span class="badge badge-success"><?php echo $s['present']; ?></span></td>
                <td><span class="badge badge-danger"><?php echo $s['absent']; ?></span></td>
                <td><span class="badge badge-warning"><?php echo $s['late']; ?></span></td>
                <td><span class="badge" style="background: #fef3c7; color: #92400e;"><?php echo $s['sick_home']; ?></span></td>
                <td><span class="badge" style="background: #dbeafe; color: #1e40af;"><?php echo $s['sick_clinic']; ?></span></td>
                <td><span class="badge <?php echo $badgeClass; ?>"><?php echo $rate; ?>%</span></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

    <div class="footer">
        <p>Generated on <?php echo date('F d, Y \a\t h:i A'); ?></p>
        <p><?php echo $system_name; ?> - Attendance Management System</p>
    </div>
</body>
</html>
