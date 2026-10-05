<?php
$active_sms_service = (string)get_settings('active_sms_service');
$sms_service_ready = $active_sms_service !== '' && $active_sms_service !== 'disabled';
$csrf_name = $this->security->get_csrf_token_name();
$csrf_hash = $this->security->get_csrf_hash();
?>
<style>
.sms-auto-workspace{margin:0!important;padding:0 0 32px!important;background:#f8fafc;min-height:100%;color:#334155}
.sms-auto-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #e2e8f0}
.sms-auto-eyebrow{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.sms-auto-head h1{margin:0;color:#0f172a;font-size:24px!important;line-height:1.2;font-weight:800;letter-spacing:-.02em}.sms-auto-head p:last-child{margin:7px 0 0;color:#64748b;font-size:14px;line-height:1.5}
.sms-auto-create{min-height:var(--sm-ui-control-height,42px);height:var(--sm-ui-control-height,42px);padding:9px 14px!important;border-radius:9px!important;background:#2563eb!important;border-color:#2563eb!important;color:#fff!important;font-size:14px!important;font-weight:800!important;box-shadow:none!important}
.sms-auto-service{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;padding:12px 14px;border:1px solid <?php echo $sms_service_ready?'#a7f3d0':'#fecaca'; ?>;border-radius:11px;background:<?php echo $sms_service_ready?'#ecfdf5':'#fef2f2'; ?>;color:<?php echo $sms_service_ready?'#047857':'#b91c1c'; ?>;font-size:14px;font-weight:700}.sms-auto-service span{display:flex;align-items:center;gap:7px}
.sms-auto-warning{display:none;margin-bottom:16px;padding:12px 14px;border:1px solid #fde68a;border-radius:11px;background:#fffbeb;color:#92400e;font-size:14px;font-weight:700}
.sms-auto-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:16px}.sms-auto-stat{min-height:112px;padding:16px;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05)}.sms-auto-stat-label{color:#64748b;font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.sms-auto-stat-value{margin-top:9px;color:#0f172a;font-size:28px;line-height:1.05;font-weight:800;letter-spacing:-.02em}.sms-auto-stat-hint{margin-top:7px;color:#64748b;font-size:12px;line-height:1.4}
.sms-auto-panel{margin-bottom:16px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.05);overflow:hidden}.sms-auto-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc}.sms-auto-panel-head h3{margin:0;color:#0f172a;font-size:17px;font-weight:800}.sms-auto-panel-body{padding:14px}
.sms-auto-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.sms-rule-card{display:flex;flex-direction:column;min-height:255px;padding:16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff}.sms-rule-card.legacy{border-color:#fde68a;background:#fffdf7}.sms-rule-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.sms-rule-title{color:#0f172a;font-size:16px;font-weight:800;line-height:1.35}.sms-rule-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:800;white-space:nowrap}.sms-rule-badge.active{background:#ecfdf5;color:#047857}.sms-rule-badge.inactive{background:#f1f5f9;color:#475569}.sms-rule-badge.legacy{background:#fffbeb;color:#b45309}.sms-rule-meta{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0}.sms-rule-meta span{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:7px;background:#f1f5f9;color:#475569;font-size:12px;font-weight:700}.sms-rule-message{flex:1;margin:0 0 13px;padding:11px;border-left:3px solid #93c5fd;border-radius:8px;background:#f8fafc;color:#475569;font-size:13px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere}.sms-rule-execution{margin-bottom:12px;color:#64748b;font-size:12px;font-weight:700}.sms-rule-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}.sms-rule-actions button{min-height:38px;padding:7px 8px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#334155;font-size:12px;font-weight:800}.sms-rule-actions button:hover{background:#f8fafc}.sms-rule-actions button.primary{border-color:#2563eb;background:#2563eb;color:#fff}.sms-rule-actions button[disabled]{opacity:.45;cursor:not-allowed}
.sms-auto-empty{padding:34px 18px;text-align:center;color:#64748b;font-size:14px}.sms-auto-chart-wrap{height:260px;position:relative}.sms-auto-chart-wrap canvas{max-height:260px}
@media(max-width:980px){.sms-auto-stats{grid-template-columns:1fr 1fr}.sms-auto-grid{grid-template-columns:1fr}}
@media(max-width:767px){.sms-auto-workspace{padding:0 0 28px!important}.sms-auto-head{display:block}.sms-auto-head h1{font-size:22px!important}.sms-auto-create{width:100%;margin-top:14px}.sms-auto-stats{grid-template-columns:1fr 1fr}.sms-rule-actions{grid-template-columns:1fr 1fr}}
@media(max-width:480px){.sms-auto-stats{grid-template-columns:1fr}.sms-rule-actions{grid-template-columns:1fr}}
</style>

<div class="sms-auto-workspace">
    <div class="sms-auto-head">
        <div><p class="sms-auto-eyebrow">Communication Automation</p><h1>SMS Automation</h1><p>Manage scheduled SMS rules with real execution status, delivery logs and explicit provider testing.</p></div>
        <button type="button" class="btn btn-primary sms-auto-create" onclick="showAjaxModal('<?php echo site_url('sms_automation/modal'); ?>')"><i class="fa fa-plus"></i> Create Automation</button>
    </div>

    <div class="sms-auto-service"><span><i class="fa <?php echo $sms_service_ready?'fa-check-circle':'fa-exclamation-circle'; ?>"></i> SMS provider: <?php echo $sms_service_ready?html_escape(ucfirst($active_sms_service)).' active':'not configured'; ?></span><span>Scheduled executor: CLI-only</span></div>
    <div class="sms-auto-warning" id="legacyRuleWarning"></div>

    <div class="sms-auto-stats">
        <div class="sms-auto-stat"><div class="sms-auto-stat-label">Configured rules</div><div class="sms-auto-stat-value" id="totalAutomations">—</div><div class="sms-auto-stat-hint">All saved automation definitions</div></div>
        <div class="sms-auto-stat"><div class="sms-auto-stat-label">Runnable active</div><div class="sms-auto-stat-value" id="activeAutomations">—</div><div class="sms-auto-stat-hint">Rules connected to an executor and enabled</div></div>
        <div class="sms-auto-stat"><div class="sms-auto-stat-label">Messages sent</div><div class="sms-auto-stat-value" id="totalSent">—</div><div class="sms-auto-stat-hint">Confirmed successful automation log entries</div></div>
        <div class="sms-auto-stat"><div class="sms-auto-stat-label">Success rate</div><div class="sms-auto-stat-value" id="successRate">—</div><div class="sms-auto-stat-hint">Successful sends ÷ all attempts</div></div>
    </div>

    <div class="sms-auto-panel">
        <div class="sms-auto-panel-head"><h3>Automation Rules</h3><span style="color:#64748b;font-size:12px;font-weight:700">Monthly bill reminders are the currently connected scheduled workflow.</span></div>
        <div class="sms-auto-panel-body"><div id="automationsContainer" class="sms-auto-grid"><div class="sms-auto-empty">Loading automations…</div></div></div>
    </div>

    <div class="sms-auto-panel">
        <div class="sms-auto-panel-head"><h3>Successful sends · last 30 days</h3><span style="color:#64748b;font-size:12px;font-weight:700">Based on automation delivery logs</span></div>
        <div class="sms-auto-panel-body"><div class="sms-auto-chart-wrap"><canvas id="activityChart"></canvas></div></div>
    </div>
</div>

<script src="<?php echo base_url(); ?>assets/cdn/js/chart-3.9.1.min.js"></script>
<script>
var automationsData=[];
var activityChart=null;
var smsAutomationCsrfName=<?php echo json_encode($csrf_name); ?>;
var smsAutomationCsrfHash=<?php echo json_encode($csrf_hash); ?>;

function escapeHtml(value){return $('<div>').text(value==null?'':String(value)).html();}
function postData(extra){var data=extra||{};data[smsAutomationCsrfName]=smsAutomationCsrfHash;return data;}
function automationRequestError(xhr,fallback){var msg=fallback||'Operation failed';try{var r=JSON.parse(xhr.responseText);if(r.message)msg=r.message;}catch(e){}showAjaxModal_alert(msg,'error');}

$(function(){loadAutomations();loadStatistics();});

function loadAutomations(){
    $.getJSON('<?php echo site_url('sms_automation/get_automations'); ?>').done(function(response){
        if(response.status==='success'){automationsData=response.data||[];renderAutomations(automationsData);}
    }).fail(function(xhr){automationRequestError(xhr,'Could not load SMS automations.');});
}

function renderAutomations(automations){
    var container=$('#automationsContainer');container.empty();
    if(!automations.length){container.html('<div class="sms-auto-empty">No automation rules have been created yet.</div>');return;}
    automations.forEach(function(auto){
        var supported=Number(auto.is_supported)===1;
        var active=supported&&Number(auto.is_active)===1;
        var badgeClass=supported?(active?'active':'inactive'):'legacy';
        var badgeText=supported?(active?'Active':'Inactive'):'Not executable';
        var trigger=String(auto.trigger_event||'').replace(/_/g,' ');
        var toggleLabel=active?'Deactivate':'Activate';
        var card=$('<div class="sms-rule-card">').toggleClass('legacy',!supported);
        card.html(
            '<div class="sms-rule-top"><div class="sms-rule-title">'+escapeHtml(auto.name)+'</div><span class="sms-rule-badge '+badgeClass+'">'+escapeHtml(badgeText)+'</span></div>'+
            '<div class="sms-rule-meta"><span><i class="fa fa-bolt"></i>'+escapeHtml(trigger)+'</span><span><i class="fa fa-users"></i>'+escapeHtml(auto.recipients)+'</span><span><i class="fa fa-paper-plane"></i>'+escapeHtml(auto.total_sent||0)+' sent</span></div>'+
            '<div class="sms-rule-message">'+escapeHtml(auto.message_template)+'</div>'+
            '<div class="sms-rule-execution"><i class="fa fa-clock-o"></i> '+escapeHtml(auto.execution_label)+'</div>'+
            '<div class="sms-rule-actions">'+
                '<button type="button" class="primary" data-action="test"><i class="fa fa-paper-plane"></i> Test</button>'+
                '<button type="button" data-action="logs"><i class="fa fa-list"></i> Logs</button>'+
                '<button type="button" data-action="edit"><i class="fa fa-edit"></i> Edit</button>'+
                '<button type="button" data-action="toggle" '+(!supported?'disabled':'')+'><i class="fa fa-power-off"></i> '+escapeHtml(toggleLabel)+'</button>'+
            '</div>'
        );
        card.find('[data-action="test"]').on('click',function(){showTestModal(auto.id);});
        card.find('[data-action="logs"]').on('click',function(){showLogs(auto.id);});
        card.find('[data-action="edit"]').on('click',function(){showAjaxModal('<?php echo site_url('sms_automation/modal/'); ?>'+auto.id);});
        card.find('[data-action="toggle"]').on('click',function(){toggleStatus(auto.id);});
        container.append(card);
    });
}

function loadStatistics(){
    $.getJSON('<?php echo site_url('sms_automation/get_statistics'); ?>').done(function(response){
        if(response.status!=='success')return;
        var stats=response.data||{};
        $('#totalAutomations').text(stats.total_automations||0);
        $('#activeAutomations').text(stats.active_automations||0);
        $('#totalSent').text(stats.total_sent||0);
        $('#successRate').text((stats.success_rate||0)+'%');
        var legacy=Number(stats.unsupported_active||0);
        $('#legacyRuleWarning').toggle(legacy>0).text(legacy+' legacy rule'+(legacy===1?' is':'s are')+' marked active in the database but have no connected executor. They will not run until a real trigger workflow is implemented.');
        renderActivityChart(stats.activity||[]);
    }).fail(function(xhr){automationRequestError(xhr,'Could not load SMS automation statistics.');});
}

function renderActivityChart(activity){
    var canvas=document.getElementById('activityChart');if(!canvas||typeof Chart==='undefined')return;
    if(activityChart)activityChart.destroy();
    activityChart=new Chart(canvas.getContext('2d'),{type:'line',data:{labels:activity.map(function(a){return a.date;}),datasets:[{label:'Successful sends',data:activity.map(function(a){return Number(a.count)||0;}),borderColor:'#2563eb',backgroundColor:'rgba(37,99,235,.08)',tension:.28,fill:true}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}});
}

function toggleStatus(id){
    showAjaxModal_alert('Updating…','loading');
    $.ajax({url:'<?php echo site_url('sms_automation/toggle_status/'); ?>'+id,type:'POST',data:postData({}),dataType:'json'})
        .done(function(r){showAjaxModal_alert(r.message,r.status);if(r.status==='success'){loadAutomations();loadStatistics();}})
        .fail(function(xhr){automationRequestError(xhr,'Could not update automation status.');});
}
function showTestModal(id){showAjaxModal('<?php echo site_url('sms_automation/test_modal/'); ?>'+id);}
function showLogs(id){showAjaxModal('<?php echo site_url('sms_automation/logs_modal/'); ?>'+id,'big');}
</script>
