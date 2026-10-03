<div class="row">
    <div class="col-md-12">
        <div class="panel panel-primary">
            <div class="panel-heading">
                <div class="panel-title">
                    <i class="fa fa-palette"></i> <?php echo get_phrase('theme_customization'); ?>
                </div>
            </div>
            <div class="panel-body">
                
                <!-- Predefined Themes -->
                <h4 class="mb-3"><i class="fa fa-swatchbook"></i> <?php echo get_phrase('predefined_themes'); ?></h4>
                <div class="row theme-grid">
                    <?php
                    $current_theme = $this->db->get_where('settings', array('type' => 'app_theme'))->row()->description ?? 'default';
                    
                    $themes = array(
                        'default' => array('name' => 'Default Blue', 'primary' => '#667eea', 'secondary' => '#764ba2', 'accent' => '#f093fb'),
                        'ocean' => array('name' => 'Ocean Blue', 'primary' => '#2E3192', 'secondary' => '#1BFFFF', 'accent' => '#00d4ff'),
                        'sunset' => array('name' => 'Sunset Orange', 'primary' => '#f12711', 'secondary' => '#f5af19', 'accent' => '#ff6b6b'),
                        'forest' => array('name' => 'Forest Green', 'primary' => '#134E5E', 'secondary' => '#71B280', 'accent' => '#38ef7d'),
                        'purple' => array('name' => 'Royal Purple', 'primary' => '#5f27cd', 'secondary' => '#341f97', 'accent' => '#a29bfe'),
                        'crimson' => array('name' => 'Crimson Red', 'primary' => '#c0392b', 'secondary' => '#e74c3c', 'accent' => '#ff7979'),
                        'teal' => array('name' => 'Teal Mint', 'primary' => '#16a085', 'secondary' => '#1abc9c', 'accent' => '#48c9b0'),
                        'midnight' => array('name' => 'Midnight Blue', 'primary' => '#2c3e50', 'secondary' => '#34495e', 'accent' => '#3498db'),
                    );
                    
                    foreach($themes as $key => $theme):
                        $active = ($current_theme == $key) ? 'active' : '';
                    ?>
                    <div class="col-md-3 col-sm-6 mb-3">
                        <div class="theme-card <?php echo $active; ?>" onclick="applyTheme('<?php echo $key; ?>')">
                            <div class="theme-preview" style="background: linear-gradient(135deg, <?php echo $theme['primary']; ?> 0%, <?php echo $theme['secondary']; ?> 100%);">
                                <div class="theme-accent" style="background: <?php echo $theme['accent']; ?>;"></div>
                            </div>
                            <div class="theme-name">
                                <?php echo $theme['name']; ?>
                                <?php if($active): ?>
                                    <i class="fa fa-check-circle text-success"></i>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                </div>

                <hr class="my-4">

                <!-- Custom Theme -->
                <h4 class="mb-3"><i class="fa fa-paint-brush"></i> <?php echo get_phrase('custom_theme'); ?></h4>
                <?php echo form_open(site_url('admin/theme_settings/save_custom'), array('id' => 'custom_theme_form')); ?>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="form-group">
                                <label><?php echo get_phrase('primary_color'); ?></label>
                                <input type="color" class="form-control" name="primary_color" id="primary_color" 
                                    value="<?php echo $this->db->get_where('settings', array('type' => 'theme_primary'))->row()->description ?? '#667eea'; ?>">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label><?php echo get_phrase('secondary_color'); ?></label>
                                <input type="color" class="form-control" name="secondary_color" id="secondary_color" 
                                    value="<?php echo $this->db->get_where('settings', array('type' => 'theme_secondary'))->row()->description ?? '#764ba2'; ?>">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group">
                                <label><?php echo get_phrase('accent_color'); ?></label>
                                <input type="color" class="form-control" name="accent_color" id="accent_color" 
                                    value="<?php echo $this->db->get_where('settings', array('type' => 'theme_accent'))->row()->description ?? '#f093fb'; ?>">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <button type="submit" class="btn btn-primary">
                                <i class="fa fa-save"></i> <?php echo get_phrase('apply_custom_theme'); ?>
                            </button>
                            <button type="button" class="btn btn-default" onclick="previewCustomTheme()">
                                <i class="fa fa-eye"></i> <?php echo get_phrase('preview'); ?>
                            </button>
                        </div>
                    </div>
                <?php echo form_close(); ?>

            </div>
        </div>
    </div>
</div>

<style>
.theme-grid {
    margin-bottom: 20px;
}

.theme-card {
    border: 3px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    overflow: hidden;
}

.theme-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.theme-card.active {
    border-color: #28a745;
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
}

.theme-preview {
    height: 120px;
    position: relative;
    display: flex;
    align-items: flex-end;
    padding: 10px;
}

.theme-accent {
    width: 100%;
    height: 30px;
    border-radius: 4px;
}

.theme-name {
    padding: 12px;
    text-align: center;
    font-weight: 600;
    background: #f8f9fa;
}

.mb-3 {
    margin-bottom: 1rem;
}

.my-4 {
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
}

input[type="color"] {
    height: 45px;
    cursor: pointer;
}

/* Direct UI/UX refinement — Theme Settings */
body { background: #f8fafc; }
.panel.panel-primary {
    margin: 24px 28px 40px !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 14px !important;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
    overflow: hidden;
}
.panel.panel-primary > .panel-heading {
    padding: 17px 20px !important;
    border: 0 !important;
    border-bottom: 1px solid #e2e8f0 !important;
    border-radius: 0 !important;
    background: #0f172a !important;
}
.panel.panel-primary > .panel-heading .panel-title {
    color: #fff !important;
    font-size: 20px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.panel.panel-primary > .panel-heading .panel-title i {
    margin-right: 8px;
    font-size: 16px;
}
.panel.panel-primary > .panel-body {
    padding: 20px !important;
}
.panel.panel-primary > .panel-body > h4 {
    margin: 0 0 13px !important;
    color: #0f172a;
    font-size: 16px;
    line-height: 1.35;
    font-weight: 800;
}
.panel.panel-primary > .panel-body > h4 i {
    margin-right: 7px;
    color: #64748b;
    font-size: 14px;
}
.theme-grid {
    display: grid;
    grid-template-columns: repeat(4,minmax(0,1fr));
    gap: 12px;
    margin: 0 0 18px !important;
}
.theme-grid > [class*="col-"] {
    width: 100% !important;
    float: none !important;
    padding: 0 !important;
    margin: 0 !important;
}
.theme-card {
    border: 1px solid #e2e8f0 !important;
    border-radius: 11px !important;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.04);
    transition: border-color .15s ease, box-shadow .15s ease !important;
}
.theme-card:hover {
    transform: none !important;
    border-color: #93c5fd !important;
    box-shadow: 0 4px 12px rgba(15,23,42,.06) !important;
}
.theme-card.active {
    border: 2px solid #22c55e !important;
    box-shadow: 0 0 0 3px rgba(34,197,94,.12) !important;
}
.theme-preview {
    height: 88px !important;
    padding: 8px !important;
}
.theme-accent {
    height: 18px !important;
    border-radius: 5px !important;
}
.theme-name {
    min-height: 44px;
    padding: 10px 11px !important;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    background: #f8fafc !important;
    color: #334155;
    text-align: left !important;
    font-size: 14px;
    line-height: 1.35;
    font-weight: 700 !important;
}
.theme-name .text-success { color: #16a34a !important; }
.panel.panel-primary hr.my-4 {
    margin: 18px 0 !important;
    border-color: #e2e8f0;
}

#custom_theme_form > .row:first-child {
    display: grid;
    grid-template-columns: repeat(3,minmax(0,1fr));
    gap: 14px;
    margin: 0 0 14px !important;
}
#custom_theme_form > .row:first-child > [class*="col-"] {
    width: 100%;
    float: none;
    padding: 0;
}
#custom_theme_form .form-group { margin: 0; }
#custom_theme_form label {
    display: block;
    margin-bottom: 7px;
    color: #334155;
    font-size: 14px;
    font-weight: 700;
}
#custom_theme_form input[type="color"] {
    width: 100%;
    min-height: 52px !important;
    height: 52px !important;
    padding: 5px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff;
}
#custom_theme_form > .row:last-child {
    margin: 0 !important;
}
#custom_theme_form > .row:last-child > .col-md-12 {
    padding: 0;
    display: flex;
    gap: 8px;
}
#custom_theme_form .btn {
    min-height: 42px;
    padding: 9px 15px;
    border-radius: 9px;
    font-size: 14px;
    font-weight: 700;
}
#custom_theme_form .btn-primary {
    background: #2563eb;
    border-color: #2563eb;
}
#custom_theme_form .btn-primary:hover {
    background: #1d4ed8;
    border-color: #1d4ed8;
}
@media (max-width: 1100px) {
    .theme-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (max-width: 767px) {
    .panel.panel-primary { margin: 18px 14px 32px !important; }
    .panel.panel-primary > .panel-body { padding: 16px !important; }
    .theme-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
    #custom_theme_form > .row:first-child { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
    .panel.panel-primary { margin: 12px 10px 28px !important; }
    .theme-grid { grid-template-columns: 1fr; }
    #custom_theme_form > .row:last-child > .col-md-12 { flex-direction: column; }
    #custom_theme_form .btn { width: 100%; }
}
</style>

<script>
function applyTheme(themeName) {
    showAjaxModal_alert('<?php echo get_phrase('applying_theme'); ?>...', 'loading');
    
    $.ajax({
        url: '<?php echo site_url('admin/theme_settings/apply_theme'); ?>',
        type: 'POST',
        data: {theme: themeName},
        dataType: 'json'
    }).done(function(response) {
        if(response.status === 'success') {
            showAjaxModal_alert(response.message, 'success');
            setTimeout(() => location.reload(), 2000);
        } else {
            showAjaxModal_alert(response.message, 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('<?php echo get_phrase('an_error_occurred'); ?>', 'error');
    });
}

$('#custom_theme_form').submit(function(e) {
    e.preventDefault();
    showAjaxModal_alert('<?php echo get_phrase('applying_custom_theme'); ?>...', 'loading');
    
    $.ajax({
        url: $(this).attr('action'),
        type: 'POST',
        data: $(this).serialize(),
        dataType: 'json'
    }).done(function(response) {
        if(response.status === 'success') {
            showAjaxModal_alert(response.message, 'success');
            setTimeout(() => location.reload(), 2000);
        } else {
            showAjaxModal_alert(response.message, 'error');
        }
    }).fail(function() {
        showAjaxModal_alert('<?php echo get_phrase('an_error_occurred'); ?>', 'error');
    });
});

function previewCustomTheme() {
    const primary = $('#primary_color').val();
    const secondary = $('#secondary_color').val();
    const accent = $('#accent_color').val();
    
    // Apply preview temporarily
    $('<style id="theme-preview">')
        .text(`
            .panel-primary > .panel-heading,
            .btn-primary,
            .modern-modal-header {
                background: linear-gradient(135deg, ${primary} 0%, ${secondary} 100%) !important;
            }
            .btn-primary:hover {
                background: ${accent} !important;
            }
        `)
        .appendTo('head');
    
    showAjaxModal_alert('<?php echo get_phrase('preview_applied'); ?>. <?php echo get_phrase('refresh_to_restore'); ?>', 'success', false);
}
</script>
