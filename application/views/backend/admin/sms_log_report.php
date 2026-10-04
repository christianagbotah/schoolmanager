<?php
$stats = isset($sms_log_stats) ? $sms_log_stats : ['total'=>0,'sent'=>0,'failed'=>0,'pending'=>0];
$sources = isset($sms_log_sources) ? $sms_log_sources : [];
$types = isset($sms_log_types) ? $sms_log_types : [];
?>
<style>
.sms-log-workspace{margin:0!important;padding:24px 28px 40px!important;background:#f8fafc;min-height:100%;color:#334155}
.sms-log-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e2e8f0}.sms-log-eyebrow{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.sms-log-head h1{margin:0;color:#0f172a;font-size:30px!important;line-height:1.2;font-weight:800;letter-spacing:-.02em}.sms-log-head p:last-child{margin:7px 0 0;color:#64748b;font-size:15px;line-height:1.5}.sms-log-export{min-height:42px;padding:9px 13px!important;border:1px solid #cbd5e1!important;border-radius:9px!important;background:#fff!important;color:#334155!important;font-size:14px!important;font-weight:800!important}
.sms-log-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.sms-log-stat{min-height:108px;padding:16px;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}.sms-log-stat-label{color:#64748b;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.sms-log-stat-value{margin-top:9px;color:#0f172a;font-size:28px;line-height:1.05;font-weight:800}.sms-log-stat-hint{margin-top:6px;color:#64748b;font-size:12px}
.sms-log-filter-card{margin-bottom:16px;padding:14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}.sms-log-filter-row{display:grid;grid-template-columns:minmax(240px,1.35fr) repeat(3,minmax(150px,.72fr)) auto;gap:10px;align-items:end}.sms-log-field label{display:block;margin-bottom:6px;color:#475569;font-size:12px;font-weight:800}.sms-log-field input,.sms-log-field select{width:100%;min-height:42px;padding:8px 10px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0f172a;font-size:14px!important}.sms-log-field input:focus,.sms-log-field select:focus{border-color:#2563eb;outline:0;box-shadow:0 0 0 3px rgba(37,99,235,.1)}.sms-log-reset{min-height:42px;padding:8px 12px!important;border:1px solid #cbd5e1!important;border-radius:8px!important;background:#fff!important;color:#334155!important;font-size:13px!important;font-weight:800!important}
.sms-log-table-card{overflow-x:auto;border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}#smsLogTable{width:100%!important;min-width:1080px;margin:0!important;border-collapse:collapse!important}#smsLogTable thead th{padding:12px 13px!important;border:0!important;border-bottom:1px solid #e2e8f0!important;background:#f8fafc!important;color:#475569!important;font-size:13px!important;font-weight:800!important;letter-spacing:.035em;text-transform:uppercase}#smsLogTable tbody td{padding:12px 13px!important;border-bottom:1px solid #eef2f7!important;color:#334155!important;font-size:13px!important;line-height:1.45;vertical-align:top!important}.sms-log-source,.sms-log-status,.sms-log-type{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap}.sms-log-source{background:#eff6ff;color:#1d4ed8}.sms-log-type{background:#f1f5f9;color:#475569}.sms-log-status.sent{background:#ecfdf5;color:#047857}.sms-log-status.failed{background:#fef2f2;color:#b91c1c}.sms-log-status.pending{background:#fffbeb;color:#b45309}.sms-log-message{max-width:360px;white-space:normal;overflow-wrap:anywhere}.sms-log-error{display:block;margin-top:5px;color:#b91c1c;font-size:11px}.sms-log-workspace .dataTables_wrapper{min-width:1080px;padding:14px}.sms-log-workspace .dataTables_filter{display:none}.sms-log-workspace .dataTables_length,.sms-log-workspace .dataTables_info,.sms-log-workspace .dataTables_paginate{color:#475569;font-size:13px}.sms-log-workspace .dataTables_length select{min-height:38px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px}
@media(max-width:1000px){.sms-log-stats{grid-template-columns:1fr 1fr}.sms-log-filter-row{grid-template-columns:1fr 1fr}.sms-log-field.search{grid-column:1/-1}.sms-log-reset{width:100%}}
@media(max-width:767px){.sms-log-workspace{padding:18px 14px 32px!important}.sms-log-head{display:block}.sms-log-head h1{font-size:26px!important}.sms-log-export{width:100%;margin-top:14px}.sms-log-filter-row{grid-template-columns:1fr}.sms-log-field.search{grid-column:auto}.sms-log-field input,.sms-log-field select{font-size:16px!important}}
@media(max-width:480px){.sms-log-stats{grid-template-columns:1fr}}
</style>

<div class="sms-log-workspace">
    <div class="sms-log-head">
        <div><p class="sms-log-eyebrow">Communication Audit</p><h1>SMS Log Report</h1><p>Review general, historical and automation SMS delivery activity in one audit trail.</p></div>
        <button type="button" class="btn btn-default sms-log-export" onclick="exportSmsLogs()"><i class="fa fa-download"></i> Export Filtered CSV</button>
    </div>

    <div class="sms-log-stats">
        <div class="sms-log-stat"><div class="sms-log-stat-label">Total attempts</div><div class="sms-log-stat-value"><?php echo (int)$stats['total']; ?></div><div class="sms-log-stat-hint">Up to the 1,000 most recent entries</div></div>
        <div class="sms-log-stat"><div class="sms-log-stat-label">Sent</div><div class="sms-log-stat-value"><?php echo (int)$stats['sent']; ?></div><div class="sms-log-stat-hint">Provider-confirmed successes</div></div>
        <div class="sms-log-stat"><div class="sms-log-stat-label">Failed</div><div class="sms-log-stat-value"><?php echo (int)$stats['failed']; ?></div><div class="sms-log-stat-hint">Rejected or failed sends</div></div>
        <div class="sms-log-stat"><div class="sms-log-stat-label">Pending</div><div class="sms-log-stat-value"><?php echo (int)$stats['pending']; ?></div><div class="sms-log-stat-hint">Awaiting final delivery result</div></div>
    </div>

    <div class="sms-log-filter-card">
        <div class="sms-log-filter-row">
            <div class="sms-log-field search"><label for="sms_log_search">Search</label><input id="sms_log_search" type="search" placeholder="Recipient, phone, type or message"></div>
            <div class="sms-log-field"><label for="sms_log_source">Source</label><select id="sms_log_source"><option value="">All sources</option><?php foreach($sources as $source): ?><option value="<?php echo html_escape($source); ?>"><?php echo html_escape($source); ?></option><?php endforeach; ?></select></div>
            <div class="sms-log-field"><label for="sms_log_type">Type</label><select id="sms_log_type"><option value="">All types</option><?php foreach($types as $type): ?><option value="<?php echo html_escape($type); ?>"><?php echo html_escape(str_replace('_',' ',ucwords($type,'_'))); ?></option><?php endforeach; ?></select></div>
            <div class="sms-log-field"><label for="sms_log_status">Status</label><select id="sms_log_status"><option value="">All statuses</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="pending">Pending</option></select></div>
            <button type="button" class="btn btn-default sms-log-reset" onclick="resetSmsLogFilters()">Reset</button>
        </div>
    </div>

    <div class="sms-log-table-card">
        <table id="smsLogTable" class="table">
            <thead><tr><th>Date</th><th>Source</th><th>Recipient</th><th>Phone</th><th>Type</th><th>Message</th><th>Status</th></tr></thead>
            <tbody>
            <?php foreach($sms_logs as $log):
                $status = in_array(strtolower($log['status']), ['sent','failed','pending'], true) ? strtolower($log['status']) : 'pending';
                $message_preview = mb_strimwidth((string)$log['message'], 0, 110, '…', 'UTF-8');
            ?>
                <tr data-source="<?php echo html_escape($log['source']); ?>" data-type="<?php echo html_escape($log['type']); ?>" data-status="<?php echo html_escape($status); ?>">
                    <td data-order="<?php echo (int)$log['timestamp']; ?>"><?php echo html_escape(date('d M Y H:i', (int)$log['timestamp'])); ?></td>
                    <td><span class="sms-log-source"><?php echo html_escape($log['source']); ?></span></td>
                    <td><?php echo html_escape($log['recipient']); ?></td>
                    <td><?php echo html_escape($log['phone']); ?></td>
                    <td><span class="sms-log-type"><?php echo html_escape(str_replace('_',' ',ucwords($log['type'],'_'))); ?></span></td>
                    <td class="sms-log-message" title="<?php echo html_escape($log['message']); ?>"><?php echo html_escape($message_preview); ?><?php if(!empty($log['error_message'])): ?><span class="sms-log-error"><?php echo html_escape(mb_strimwidth($log['error_message'],0,120,'…','UTF-8')); ?></span><?php endif; ?></td>
                    <td><span class="sms-log-status <?php echo $status; ?>"><?php echo html_escape(ucfirst($status)); ?></span></td>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>
<script>
var smsLogTable;
$(function(){
    if($.fn.DataTable){
        $.fn.dataTable.ext.search.push(function(settings,data,dataIndex){
            if(settings.nTable.id!=='smsLogTable') return true;
            var row=(settings.aoData&&settings.aoData[dataIndex])?settings.aoData[dataIndex].nTr:null; if(!row) return true;
            var source=$('#sms_log_source').val(),type=$('#sms_log_type').val(),status=$('#sms_log_status').val();
            return (!source||row.getAttribute('data-source')===source)&&(!type||row.getAttribute('data-type')===type)&&(!status||row.getAttribute('data-status')===status);
        });
        smsLogTable=$('#smsLogTable').DataTable({order:[[0,'desc']],pageLength:25,autoWidth:false});
        $('#sms_log_search').on('input',function(){smsLogTable.search(this.value).draw();});
        $('#sms_log_source,#sms_log_type,#sms_log_status').on('change',function(){smsLogTable.draw();});
    }
});
function resetSmsLogFilters(){
    $('#sms_log_search,#sms_log_source,#sms_log_type,#sms_log_status').val('');
    if(smsLogTable){smsLogTable.search('').draw();}
}
function exportSmsLogs(){
    if(!smsLogTable){return;}
    var rows=[]; rows.push(['Date','Source','Recipient','Phone','Type','Message','Status']);
    smsLogTable.rows({search:'applied'}).nodes().toArray().forEach(function(row){
        var cells=$(row).find('td'); rows.push([0,1,2,3,4,5,6].map(function(i){return $(cells[i]).text().trim().replace(/\s+/g,' ');}));
    });
    var csv=rows.map(function(row){return row.map(function(v){return '"'+String(v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download='sms-log-report-<?php echo date('Y-m-d'); ?>.csv';document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
</script>
