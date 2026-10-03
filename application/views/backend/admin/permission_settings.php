<hr />

<style>
/* Direct UI/UX rebuild — Permission Settings */
.permission-workspace {
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.permission-page-head {
    margin: 0 0 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.permission-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.permission-page-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.permission-page-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.permission-grid {
    display: grid;
    grid-template-columns: repeat(2,minmax(0,1fr));
    gap: 18px;
}
.permission-card {
    min-width: 0;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
    overflow: hidden;
}
.permission-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 16px 18px;
    border-bottom: 1px solid #eef2f7;
}
.permission-card-head-main {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 0;
}
.permission-card-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    font-size: 16px;
}
.permission-card.admin-card .permission-card-icon { background: #eff6ff; color: #2563eb; }
.permission-card.teacher-card .permission-card-icon { background: #f0fdf4; color: #059669; }
.permission-card-head h2 {
    margin: 0;
    color: #0f172a;
    font-size: 17px;
    line-height: 1.35;
    font-weight: 800;
}
.permission-card-head p {
    margin: 2px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.4;
}
.permission-count {
    min-height: 30px;
    padding: 5px 9px;
    border: 1px solid #e2e8f0;
    border-radius: 999px;
    background: #f8fafc;
    color: #475569;
    font-size: 12.5px;
    font-weight: 800;
    white-space: nowrap;
}
.permission-list {
    margin: 0;
    padding: 0;
    list-style: none;
}
.permission-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    min-height: 58px;
    padding: 11px 18px;
    border: 0;
    border-bottom: 1px solid #eef2f7;
    background: #fff;
}
.permission-row:last-child { border-bottom: 0; }
.permission-row:hover { background: #f8fbff; }
.permission-row .control-label {
    margin: 0;
    color: #334155;
    font-size: 14px;
    line-height: 1.45;
    font-weight: 700;
    cursor: pointer;
}
.permission-row .control-label.text-muted {
    color: #94a3b8 !important;
}
.permission-row .switch-button {
    float: none !important;
    flex: 0 0 auto;
    margin: 0;
}
.permission-row input[type="checkbox"]:focus-visible + label {
    outline: none;
    box-shadow: 0 0 0 3px rgba(37,99,235,.18);
}
.permission-note {
    margin-top: 14px;
    padding: 12px 14px;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    background: #eff6ff;
    color: #1e3a8a;
    font-size: 13px;
    line-height: 1.5;
}
@media (max-width: 900px) {
    .permission-grid { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
    .permission-workspace { padding: 18px 14px 32px; }
    .permission-page-head h1 { font-size: 26px; }
}
@media (max-width: 400px) {
    .permission-workspace { padding: 12px 10px 28px; }
    .permission-card-head {
        align-items: flex-start;
        flex-direction: column;
    }
    .permission-row { padding: 11px 14px; }
}
</style>

<div class="permission-workspace">
    <div class="permission-page-head">
        <p class="permission-eyebrow">Administration</p>
        <h1>Permission Settings</h1>
        <p>Control which protected functions are available to administrators and teachers. Changes are applied immediately when a toggle is switched.</p>
    </div>

    <?php echo form_open(site_url('admin/permission_settings/do_update'),
        array('class' => 'form-horizontal form-groups-bordered','target'=>'_top', 'id' => 'permission_settings_form'));?>

    <div class="permission-grid">
        <section class="permission-card admin-card">
            <div class="permission-card-head">
                <div class="permission-card-head-main">
                    <span class="permission-card-icon"><i class="fa fa-user-shield"></i></span>
                    <div>
                        <h2><?php echo get_phrase('Permission settings for Administrator');?></h2>
                        <p>Administrator-level access controls</p>
                    </div>
                </div>
                <span class="permission-count"><?php echo count($admin_permissions); ?> permissions</span>
            </div>
            <ul class="permission-list">
                <?php foreach($admin_permissions as $ap): ?>
                <li class="permission-row">
                    <label for="admin_permission_<?=$ap['permission_id'] ?>" id="admin_<?=$ap['permission_id'];?>" class="control-label <?=$ap['permission_status'] == '0' ? 'text-muted' : '';?>"><?=get_phrase($ap['permission_title']) ?></label>
                    <div class="switch-button showcase-switch-button">
                        <input type="checkbox" value="<?=$ap['permission_status'] ?>" <?=$ap['permission_status'] == '0' ? '' : 'checked';?> name="admin_permission_<?=$ap['permission_id'] ?>" id="admin_permission_<?=$ap['permission_id'] ?>" onchange="updatePermission('admin', <?=$ap['permission_id'] ?>)">
                        <label for="admin_permission_<?=$ap['permission_id'] ?>"></label>
                    </div>
                </li>
                <?php endforeach; ?>
            </ul>
        </section>

        <section class="permission-card teacher-card">
            <div class="permission-card-head">
                <div class="permission-card-head-main">
                    <span class="permission-card-icon"><i class="fa fa-chalkboard-teacher"></i></span>
                    <div>
                        <h2><?php echo get_phrase('Permission settings for Teacher');?></h2>
                        <p>Teacher-level access controls</p>
                    </div>
                </div>
                <span class="permission-count"><?php echo count($teacher_permissions); ?> permissions</span>
            </div>
            <ul class="permission-list">
                <?php foreach($teacher_permissions as $tp): ?>
                <li class="permission-row">
                    <label for="teacher_permission_<?=$tp['permission_id'] ?>" id="teacher_<?=$tp['permission_id'];?>" class="control-label <?=$tp['permission_status'] == '0' ? 'text-muted' : '';?>"><?=$tp['permission_title'] ?></label>
                    <div class="switch-button showcase-switch-button">
                        <input type="checkbox" value="<?=$tp['permission_status'] ?>" <?=$tp['permission_status'] == '0' ? '' : 'checked';?> name="teacher_permission_<?=$tp['permission_id'] ?>" id="teacher_permission_<?=$tp['permission_id'] ?>" onchange="updatePermission('teacher', <?=$tp['permission_id'] ?>)">
                        <label for="teacher_permission_<?=$tp['permission_id'] ?>"></label>
                    </div>
                </li>
                <?php endforeach; ?>
            </ul>
        </section>
    </div>

    <div class="permission-note">
        <i class="fa fa-info-circle"></i>
        Permission switches save immediately. Disabled labels appear muted so restricted capabilities are easy to identify.
    </div>

    <?php echo form_close();?>
</div>

<script type="text/javascript">
  
    //updating the permission on a change event
    function updatePermission(user, id) {

      let formUrl = $('#permission_settings_form').attr('action');


        $.ajax({
          url: formUrl + '/' + id,
          type: 'post',
          dataType: 'json',
          cache: false
        })
        .done(function(response) {

          updateFontColor(user, id, response.updatedVal);

          //console.log('Success: ' + response.message);
        })
        .fail(function(err) {
          //console.warn('Failed: ' + err.responseText);
        })
    }
    

    //update font color
    function updateFontColor(user, id, val) {

      if(val == 1) {
        //active
        $('#' + user + '_' + id).removeClass('text-muted');

      } else {

        $('#' + user + '_' + id).addClass('text-muted');
      }
    }
  
</script>

