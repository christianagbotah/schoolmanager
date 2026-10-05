<style>
.settings-container { max-width: 1400px; margin: 0 auto; padding: 0 0 32px; }
.settings-header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.settings-header h1 { margin: 0; font-size: 24px; font-weight: 600; color: white !important; }
.settings-header p { margin: 10px 0 0; opacity: 0.9; }
.settings-tabs { display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap; border-bottom: 2px solid #e5e7eb; position: sticky; top: calc(var(--sm-topbar-height-dynamic, 72px) + 8px); background: white; z-index: 100; padding: 10px 0; }
.settings-tab { padding: 12px 24px; background: transparent; border: none; cursor: pointer; font-size: 15px; font-weight: 500; color: #6b7280; border-bottom: 3px solid transparent; transition: all 0.3s; }
.settings-tab:hover { color: #667eea; }
.settings-tab.active { color: #667eea; border-bottom-color: #667eea; }
.settings-section { display: none; }
.settings-section.active { display: block; }
.settings-card { background: white; border-radius: 12px; padding: 25px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.settings-card-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f3f4f6; }
.settings-container .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
.settings-container .form-group { margin-bottom: 20px; }
.settings-container .form-group label { display: block; font-size: 14px; font-weight: 500; color: #374151; margin-bottom: 8px; }
.settings-container .form-group input, .settings-container .form-group select, .settings-container .form-group textarea { width: 100%; padding: 12px 14px; min-height: var(--sm-ui-control-height, 42px); border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; transition: all 0.3s; }
.settings-container .form-group input:focus, .settings-container .form-group select:focus, .settings-container .form-group textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
.settings-container .upload-card { background: #f9fafb; border: 2px dashed #d1d5db; border-radius: 12px; padding: 30px; text-align: center; transition: all 0.3s; }
.settings-container .upload-card:hover { border-color: #667eea; background: #f3f4f6; }
.settings-container .upload-preview { width: 150px; height: 150px; margin: 0 auto 15px; border-radius: 8px; overflow: hidden; border: 2px solid #e5e7eb; }
.settings-container .upload-preview img { width: 100%; height: 100%; object-fit: contain; }
.settings-container .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s; }
.settings-container .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.settings-container .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
.settings-container .btn-success { background: #10b981; color: white; }
.settings-container .btn-success:hover { background: #059669; }

/* Modern Toggle Switch */
.settings-container .toggle-container { display: flex; align-items: center; gap: 15px; padding: 20px; background: #f9fafb; border-radius: 12px; border: 2px solid #e5e7eb; transition: all 0.3s; }
.settings-container .toggle-container:hover { border-color: #667eea; background: #f3f4f6; }
.settings-container .toggle-switch { position: relative; display: inline-block; width: 60px; height: 34px; }
.settings-container .toggle-switch input { opacity: 0; width: 0; height: 0; }
.settings-container .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 34px; }
.settings-container .toggle-slider:before { position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
.settings-container input:checked + .toggle-slider { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
.settings-container input:checked + .toggle-slider:before { transform: translateX(26px); }
.settings-container .toggle-label { flex: 1; }
.settings-container .toggle-label strong { display: block; font-size: 16px; color: #1f2937; margin-bottom: 5px; }
.settings-container .toggle-label small { display: block; color: #6b7280; line-height: 1.5; }
.settings-container .toggle-status { padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; min-width: 80px; text-align: center; }
.settings-container .toggle-status.enabled { background: #d1fae5; color: #065f46; }
.settings-container .toggle-status.disabled { background: #fee2e2; color: #991b1b; }


@media (max-width: 768px) {
  .settings-header { padding: 20px; }
  .settings-header h1 { font-size: 22px; }
  .settings-tabs { overflow-x: auto; flex-wrap: nowrap; }
  .settings-tab { white-space: nowrap; }
  .settings-container .form-grid { grid-template-columns: 1fr; }
  .settings-card { padding: 15px; }
  .settings-container .save-btn-fixed { bottom: 15px !important; right: 15px !important; }
  .settings-container .save-btn-fixed button { min-width: 150px !important; font-size: 13px !important; }
}

/* Direct UI/UX refinement — System Settings */
.settings-container {
  max-width: 1500px !important;
  padding: 0 0 40px !important;
}
.settings-header {
  margin-bottom: 16px !important;
  padding: 20px 22px !important;
  border-radius: 14px !important;
  background: #0f172a !important;
  box-shadow: 0 1px 2px rgba(15,23,42,.10) !important;
}
.settings-header h1 {
  font-size: 24px !important;
  line-height: 1.25;
  font-weight: 800 !important;
  letter-spacing: -.015em;
}
.settings-header p {
  margin-top: 6px !important;
  color: #cbd5e1 !important;
  font-size: 14px !important;
  line-height: 1.5;
  opacity: 1 !important;
}

.settings-tabs {
  gap: 5px !important;
  margin-bottom: 16px !important;
  padding: 5px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 12px !important;
  background: rgba(255,255,255,.96) !important;
  box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.settings-tab {
  min-height: 40px;
  padding: 9px 13px !important;
  border: 0 !important;
  border-radius: 8px !important;
  color: #475569 !important;
  font-size: 14px !important;
  line-height: 1.35;
  font-weight: 700 !important;
  transition: background-color .15s ease, color .15s ease !important;
}
.settings-tab:hover {
  background: #f1f5f9 !important;
  color: #0f172a !important;
}
.settings-tab.active {
  background: #2563eb !important;
  color: #fff !important;
  border-bottom-color: transparent !important;
  box-shadow: 0 2px 8px rgba(37,99,235,.16);
}

.settings-card {
  margin-bottom: 16px !important;
  padding: 18px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 14px !important;
  background: #fff !important;
  box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
.settings-card-title {
  margin-bottom: 15px !important;
  padding-bottom: 10px !important;
  border-bottom: 1px solid #eef2f7 !important;
  color: #0f172a !important;
  font-size: 17px !important;
  line-height: 1.35;
  font-weight: 800 !important;
}
.settings-card-title i {
  margin-right: 7px;
  color: #64748b;
  font-size: 14px;
}
.settings-container .form-grid {
  grid-template-columns: repeat(auto-fit,minmax(250px,1fr)) !important;
  gap: 14px !important;
}
.settings-container .form-group {
  margin-bottom: 14px !important;
}
.settings-container .form-group label {
  margin-bottom: 7px !important;
  color: #334155 !important;
  font-size: 13px !important;
  line-height: 1.4;
  font-weight: 700 !important;
}
.settings-container .form-group input,
.settings-container .form-group select,
.settings-container .form-group textarea {
  min-height: var(--sm-ui-control-height, 42px) !important;
  padding: 9px 11px !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 9px !important;
  background: #fff;
  color: #0f172a;
  font-size: 14px !important;
  transition: border-color .15s ease, box-shadow .15s ease !important;
}
.settings-container .form-group textarea {
  min-height: 88px !important;
  height: auto !important;
}
.settings-container .form-group input:focus,
.settings-container .form-group select:focus,
.settings-container .form-group textarea:focus {
  border-color: #2563eb !important;
  box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
}
.settings-container .form-group input[disabled],
.settings-container .form-group select[disabled] {
  background: #f8fafc !important;
  color: #64748b !important;
  cursor: not-allowed;
}

.settings-container .upload-card {
  padding: 16px !important;
  border: 1px dashed #cbd5e1 !important;
  border-radius: 11px !important;
  background: #f8fafc !important;
  transition: border-color .15s ease, background-color .15s ease !important;
}
.settings-container .upload-card:hover {
  border-color: #93c5fd !important;
  background: #f8fbff !important;
}
.settings-container .upload-preview {
  width: 110px !important;
  height: 110px !important;
  margin-bottom: 12px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 9px !important;
  background: #fff;
}
.settings-container .upload-card .form-control[type="file"] {
  min-height: var(--sm-ui-control-height, 42px) !important;
  height: auto !important;
  padding: 8px 10px !important;
}
.settings-container .upload-card .btn {
  margin-top: 10px !important;
}

.settings-container .btn {
  min-height: 42px;
  padding: 9px 14px !important;
  border-radius: 9px !important;
  font-size: 14px !important;
  line-height: 1.35;
  font-weight: 700 !important;
  transition: background-color .15s ease, box-shadow .15s ease !important;
}
.settings-container .btn-primary {
  background: #2563eb !important;
  box-shadow: none !important;
}
.settings-container .btn-primary:hover {
  background: #1d4ed8 !important;
  transform: none !important;
  box-shadow: none !important;
}
.settings-container .btn-success { background: #059669 !important; }
.settings-container .btn-success:hover { background: #047857 !important; }

.settings-container .toggle-container {
  gap: 12px !important;
  padding: 14px !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 11px !important;
  background: #f8fafc !important;
  transition: border-color .15s ease, background-color .15s ease !important;
}
.settings-container .toggle-container:hover {
  border-color: #cbd5e1 !important;
  background: #f8fafc !important;
}
.settings-container .toggle-switch {
  width: 52px !important;
  height: 28px !important;
}
.settings-container .toggle-slider {
  border-radius: 28px !important;
  transition: .2s !important;
}
.settings-container .toggle-slider:before {
  width: 20px !important;
  height: 20px !important;
  left: 4px !important;
  bottom: 4px !important;
  transition: .2s !important;
  box-shadow: 0 1px 2px rgba(15,23,42,.22) !important;
}
.settings-container input:checked + .toggle-slider {
  background: #059669 !important;
}
.settings-container input:checked + .toggle-slider:before {
  transform: translateX(24px) !important;
}
.settings-container .toggle-label strong {
  margin-bottom: 3px !important;
  color: #0f172a !important;
  font-size: 14px !important;
  line-height: 1.4;
  font-weight: 800 !important;
}
.settings-container .toggle-label small {
  color: #64748b !important;
  font-size: 13px !important;
  line-height: 1.45 !important;
}
.settings-container .toggle-status {
  min-width: 74px !important;
  padding: 5px 9px !important;
  border-radius: 999px !important;
  font-size: 12px !important;
  font-weight: 800 !important;
}

.settings-section > div[style*="grid-template-columns: repeat(auto-fit, minmax(450px"] {
  grid-template-columns: repeat(2,minmax(0,1fr)) !important;
  gap: 14px !important;
  margin-bottom: 16px !important;
}
.settings-card p[style*="font-size: 14px"],
.settings-card p[style*="font-size: 13px"],
.settings-card div[style*="font-size: 13px"] {
  font-size: 13px !important;
  line-height: 1.5 !important;
}

.settings-container .save-btn-fixed {
  bottom: 22px !important;
  right: 28px !important;
}
.settings-container .save-btn-fixed button {
  min-width: 180px !important;
  min-height: var(--sm-ui-control-height, 42px) !important;
  height: var(--sm-ui-control-height, 42px) !important;
  padding: 9px 16px !important;
  background: #2563eb !important;
  box-shadow: 0 4px 12px rgba(37,99,235,.20) !important;
  font-size: 14px !important;
  font-weight: 800 !important;
}
.settings-container .save-btn-fixed button:hover {
  background: #1d4ed8 !important;
  transform: none !important;
}

@media (max-width: 991px) {
  .settings-section > div[style*="grid-template-columns: repeat(auto-fit, minmax(450px"] {
    grid-template-columns: 1fr !important;
  }
}
@media (max-width: 768px) {
  .settings-container { padding: 0 0 32px !important; }
  .settings-header { padding: 18px !important; }
  .settings-header h1 { font-size: 21px !important; }
  .settings-tabs {
    overflow-x: auto;
    flex-wrap: nowrap !important;
    position: sticky;
  }
  .settings-tab {
    flex: 0 0 auto;
    white-space: nowrap;
  }
  .settings-container .form-grid { grid-template-columns: 1fr !important; }
  .settings-card { padding: 15px !important; }
  .settings-container .form-group input,
  .settings-container .form-group select,
  .settings-container .form-group textarea { font-size: 16px !important; }
  .settings-container .save-btn-fixed {
    left: 14px !important;
    right: 14px !important;
    bottom: 14px !important;
  }
  .settings-container .save-btn-fixed button {
    width: 100% !important;
    min-width: 0 !important;
  }
}
</style>

<div class="settings-container">
  <div class="settings-header">
    <h1><?php echo get_phrase('system_settings'); ?></h1>
    <p>Manage your school's system configuration and preferences</p>
  </div>

  <div class="settings-tabs">
    <button class="settings-tab active" onclick="switchTab('general')">General</button>
    <button class="settings-tab" onclick="switchTab('branding')">Branding</button>
    <button class="settings-tab" onclick="switchTab('academic')">Academic</button>
    <button class="settings-tab" onclick="switchTab('payment')">Payment</button>
    <button class="settings-tab" onclick="switchTab('security')">Security</button>
    <button class="settings-tab" onclick="switchTab('advanced')">Advanced</button>
  </div>

  <!-- Branding Section -->
  <div id="branding" class="settings-section">
    <div class="form-grid">
      <?php echo form_open(site_url('admin/system_settings/upload_logo'), array('enctype' => 'multipart/form-data')); ?>
      <div class="settings-card">
        <div class="settings-card-title">School Logo</div>
        <div class="upload-card">
          <div class="upload-preview">
            <img src="<?php echo base_url(); ?>uploads/school_logo.png" alt="Logo">
          </div>
          <input type="file" name="userfile" accept="image/*" class="form-control" required>
          <button type="submit" class="btn btn-primary" style="margin-top: 15px;">Upload Logo</button>
        </div>
      </div>
      <?php echo form_close(); ?>

      <?php echo form_open(site_url('admin/system_settings/upload_signature'), array('enctype' => 'multipart/form-data')); ?>
      <div class="settings-card">
        <div class="settings-card-title">Head Teacher Signature</div>
        <div class="upload-card">
          <div class="upload-preview" style="height: 100px;">
            <img src="<?php echo base_url(); ?>uploads/signature/admin/head_teacher.png" alt="Signature">
          </div>
          <input type="file" name="signature" accept="image/*" class="form-control" required>
          <button type="submit" class="btn btn-success" style="margin-top: 15px;">Upload Signature</button>
        </div>
      </div>
      <?php echo form_close(); ?>

      <?php echo form_open(site_url('admin/system_settings/upload_ssnit_logo'), array('enctype' => 'multipart/form-data')); ?>
      <div class="settings-card">
        <div class="settings-card-title">SSNIT Logo</div>
        <div class="upload-card">
          <div class="upload-preview">
            <img src="<?php echo base_url(); ?>uploads/ssnit_logo.png" alt="SSNIT Logo">
          </div>
          <input type="file" name="ssnit_logo" accept="image/*" class="form-control" required>
          <button type="submit" class="btn btn-primary" style="margin-top: 15px;">Upload SSNIT Logo</button>
        </div>
      </div>
      <?php echo form_close(); ?>
    </div>
  </div>

  <!-- General Section -->
  <?php echo form_open(site_url('admin/system_settings/do_update'), array('id' => 'system_settings_form')); ?>
  <div id="general" class="settings-section active">
    <div class="settings-card">
      <div class="settings-card-title">School Information</div>
      <div class="form-grid">
        <div class="form-group">
          <label>System Name *</label>
          <input type="text" name="system_name" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'system_name'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>School's Slogan</label>
          <input type="text" name="system_title" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'system_title'))->row()->description; ?>">
        </div>
        <div class="form-group">
          <label>Location *</label>
          <input type="text" name="location" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'location'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>Address *</label>
          <textarea name="address" class="form-control" rows="3" style="resize: vertical; min-height: 80px;" required><?php echo $this->db->get_where('settings', array('type' => 'address'))->row()->description; ?></textarea>
        </div>
        <div class="form-group">
          <label>Box Number</label>
          <input type="text" name="box_number" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'box_number'))->row()->description; ?>">
        </div>
        <div class="form-group">
          <label>Digital Address</label>
          <input type="text" name="digital_address" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'digital_address'))->row()->description; ?>">
        </div>
        <div class="form-group">
          <label>Website Address</label>
          <input type="text" name="website_address" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'website_address'))->row()->description; ?>">
        </div>
        <div class="form-group">
          <label>Phone *</label>
          <input type="tel" name="phone[]" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'phone'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>System Email *</label>
          <input type="email" name="system_email" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'system_email'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>SSNIT Establishment Number</label>
          <input type="text" name="ssnit_number" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'ssnit_number'))->row()->description; ?>">
        </div>
        <div class="form-group">
          <label>Currency *</label>
          <input type="text" name="currency" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'currency'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>Language</label>
          <select name="language" class="form-control">
            <?php
            $fields = $this->db->list_fields('language');
            $current_default_language = $this->db->get_where('settings', array('type' => 'language'))->row()->description;
            foreach ($fields as $field) {
              if ($field == 'phrase_id' || $field == 'phrase') continue;
              ?>
              <option value="<?php echo $field; ?>" <?php if ($current_default_language == $field) echo 'selected'; ?>><?php echo ucfirst($field); ?></option>
            <?php } ?>
          </select>
        </div>
      </div>
    </div>
  </div>

  <!-- Academic Section -->
  <div id="academic" class="settings-section">
    <!-- Two-column grid for Academic cards -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 20px; margin-bottom: 20px;">
      
      <!-- Academic Configuration Card -->
      <div class="settings-card" style="margin-bottom: 0;">
        <div class="settings-card-title"><i class="fa fa-graduation-cap"></i> Academic Configuration</div>
        <div class="form-grid" style="grid-template-columns: 1fr;">
          <div class="form-group">
            <label>Running Session</label>
            <select name="running_year" class="form-control" disabled>
              <?php
              $running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
              // $exp = explode('-', $running_year);
              // $year_display = $exp[1];
              $year_display = $running_year;
              ?>
              <option value="<?= $running_year; ?>"><?php echo $year_display; ?></option>
            </select>
          </div>
          <div class="form-group">
            <label>Running Term</label>
            <select name="running_term" class="form-control" disabled>
              <?php $running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description; ?>
              <option value="<?= $running_term; ?>"><?php echo $running_term; ?></option>
            </select>
          </div>
          <div class="form-group">
            <label>Term Ending *</label>
            <?php 
              $term_ending = $this->db->get_where('settings', array('type' => 'term_ending'))->row()->description;
              // Convert MM/DD/YYYY to YYYY-MM-DD for HTML5 date input
              if ($term_ending && strpos($term_ending, '/') !== false) {
                $date_parts = explode('/', $term_ending);
                if (count($date_parts) == 3) {
                  $term_ending = $date_parts[2] . '-' . str_pad($date_parts[0], 2, '0', STR_PAD_LEFT) . '-' . str_pad($date_parts[1], 2, '0', STR_PAD_LEFT);
                }
              }
            ?>
            <input type="date" name="term_ending" class="form-control" value="<?php echo $term_ending; ?>" required>
          </div>
          <div class="form-group">
            <label>Next Term Begins *</label>
            <?php 
              $next_term_begins = $this->db->get_where('settings', array('type' => 'next_term_begins'))->row()->description;
              // Convert MM/DD/YYYY to YYYY-MM-DD for HTML5 date input
              if ($next_term_begins && strpos($next_term_begins, '/') !== false) {
                $date_parts = explode('/', $next_term_begins);
                if (count($date_parts) == 3) {
                  $next_term_begins = $date_parts[2] . '-' . str_pad($date_parts[0], 2, '0', STR_PAD_LEFT) . '-' . str_pad($date_parts[1], 2, '0', STR_PAD_LEFT);
                }
              }
            ?>
            <input type="date" name="next_term_begins" class="form-control" value="<?php echo $next_term_begins; ?>" required>
          </div>
        </div>
      </div>
      
      <!-- School Days Configuration Card -->
      <div class="settings-card" style="margin-bottom: 0;">
        <div class="settings-card-title"><i class="fa fa-calendar"></i> School Days Configuration</div>
      <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
        Set the total number of school days for the current term/semester. This will be stored with the term record for audit trail and used to auto-calculate student attendance on marksheets.
      </p>
      <div class="form-grid">
        <?php
        // Get current running year and term
        $running_year = get_settings('running_year');
        $running_term = get_settings('running_term');
        
        // Fetch days_opened from terms table for current term
        $term_record = $this->db->get_where('terms', array('year' => $running_year, 'term' => $running_term))->row();
        $current_days_opened = $term_record && isset($term_record->days_opened) ? $term_record->days_opened : '';
        ?>
        
        <div class="form-group" style="grid-column: span 2;">
          <label><i class="fa fa-calendar"></i> Days Opened for Current Term (<?php echo 'Year ' . $running_year . ', Term ' . $running_term; ?>) *</label>
          <input type="number" name="days_opened" class="form-control" 
                 value="<?php echo $current_days_opened; ?>" 
                 min="0" max="200" placeholder="e.g., 60" required>
          <small style="color: #9ca3af; display: block; margin-top: 5px;">
            Total school days for the current term. This value is saved with the term record for audit purposes and used to calculate attendance on student marksheets.
          </small>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <strong style="color: #1e40af; display: block; margin-bottom: 8px;"><i class="fa fa-info-circle"></i> Auto-Attendance Calculation:</strong>
        <p style="color: #1e40af; font-size: 13px; line-height: 1.6; margin: 0;">
          Once set, the system will automatically calculate student attendance on marksheets by:
          <br>• <strong>Days Opened:</strong> Pulled from these settings
          <br>• <strong>Days Present:</strong> Counted from attendance records (Present + Late)
          <br>• <strong>Days Absent:</strong> Automatically calculated (Days Opened - Days Present)
        </p>
      </div>
      </div><!-- Close School Days Configuration Card -->
      
    </div><!-- Close Two-column grid -->
    
    <!-- Grading System Card (Full Width) -->
    <div class="settings-card">
      <div class="settings-card-title">Grading System</div>
      <div class="toggle-container">
        <label class="toggle-switch">
          <?php 
            $waec_grading = $this->db->get_where('settings', array('type' => 'raw_score'))->row(); 
            $is_waec_enabled = ($waec_grading && $waec_grading->description == 'Yes');
          ?>
          <input type="checkbox" name="waec_grading_enabled" value="yes" <?php if ($is_waec_enabled) echo 'checked'; ?> onchange="updateWaecToggleStatus(this)">
          <span class="toggle-slider"></span>
        </label>
        
        <div class="toggle-label">
          <strong><i class="fa fa-graduation-cap"></i> WAEC Standard Grading</strong>
          <small>Use West African Examinations Council (WAEC) grading standards for assessments</small>
        </div>
        
        <div class="toggle-status <?php echo $is_waec_enabled ? 'enabled' : 'disabled'; ?>" id="waecGradingStatus">
          <?php echo $is_waec_enabled ? 'ENABLED' : 'DISABLED'; ?>
        </div>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px;">
        <strong style="color: #0c4a6e; display: block; margin-bottom: 8px;"><i class="fa fa-info-circle"></i> WAEC Grading Scale:</strong>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; color: #0c4a6e; font-size: 13px;">
          <div>A1: 80-100%</div>
          <div>B2: 70-79%</div>
          <div>B3: 65-69%</div>
          <div>C4: 60-64%</div>
          <div>C5: 55-59%</div>
          <div>C6: 50-54%</div>
          <div>D7: 45-49%</div>
          <div>E8: 40-44%</div>
          <div>F9: 0-39%</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Payment Section -->
  <div id="payment" class="settings-section">
    <div class="settings-card">
      <div class="settings-card-title">Payment Settings</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Half Payment Expected By</label>
          <select name="half_payment_week" class="form-control">
            <?php $half_payment = $this->db->get_where('settings', array('type' => 'half_payment_week'))->row()->description; ?>
            <option value="First Week of the Term" <?php if ($half_payment == 'First Week of the Term') echo 'selected'; ?>>First Week</option>
            <option value="Second Week of the Term" <?php if ($half_payment == 'Second Week of the Term') echo 'selected'; ?>>Second Week</option>
            <option value="Third Week of the Term" <?php if ($half_payment == 'Third Week of the Term') echo 'selected'; ?>>Third Week</option>
            <option value="Forth Week of the Term" <?php if ($half_payment == 'Forth Week of the Term') echo 'selected'; ?>>Fourth Week</option>
          </select>
        </div>
        <div class="form-group">
          <label>Full Payment Expected By *</label>
          <?php 
            $full_payment_date = $this->db->get_where('settings', array('type' => 'full_payment_date'))->row()->description;
            // Convert MM/DD/YYYY to YYYY-MM-DD for HTML5 date input
            if ($full_payment_date && strpos($full_payment_date, '/') !== false) {
              $date_parts = explode('/', $full_payment_date);
              if (count($date_parts) == 3) {
                $full_payment_date = $date_parts[2] . '-' . str_pad($date_parts[0], 2, '0', STR_PAD_LEFT) . '-' . str_pad($date_parts[1], 2, '0', STR_PAD_LEFT);
              }
            }
          ?>
          <input type="date" name="full_payment_date" class="form-control" value="<?php echo $full_payment_date; ?>" required>
        </div>
        <div class="form-group">
          <label>Mobile Money Account Name *</label>
          <input type="text" name="mo_account_name" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'mo_account_name'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>Mobile Money Account Number</label>
          <input type="tel" name="mo_account_number" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'mo_account_number'))->row()->description; ?>">
        </div>
      </div>
    </div>
  </div>

  <!-- Security Section -->
  <div id="security" class="settings-section">
    <div class="settings-card">
      <div class="settings-card-title"><i class="fa fa-shield"></i> Financial Security</div>
      
      <div class="toggle-container">
        <label class="toggle-switch">
          <?php 
            $auto_lock = $this->db->get_where('settings', array('type' => 'auto_lock_enabled'))->row(); 
            $is_enabled = ($auto_lock && $auto_lock->description == 'yes');
          ?>
          <input type="checkbox" name="auto_lock_enabled" value="yes" <?php if ($is_enabled) echo 'checked'; ?> onchange="updateToggleStatus(this)">
          <span class="toggle-slider"></span>
        </label>
        
        <div class="toggle-label">
          <strong><i class="fa fa-lock"></i> Auto-Lock Invoices & Payments</strong>
          <small>Automatically lock financial records to prevent unauthorized modifications</small>
        </div>
        
        <div class="toggle-status <?php echo $is_enabled ? 'enabled' : 'disabled'; ?>" id="autoLockStatus">
          <?php echo $is_enabled ? 'ENABLED' : 'DISABLED'; ?>
        </div>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px;">
        <strong style="color: #1e40af; display: block; margin-bottom: 8px;"><i class="fa fa-info-circle"></i> When Auto-Lock is Enabled:</strong>
        <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
          <li>✓ Payments are locked immediately after creation</li>
          <li>✓ Invoices are locked when fully paid</li>
          <li>✓ Locked records require approval to edit</li>
          <li>✓ Maintains financial data integrity</li>
        </ul>
      </div>
    </div>
  </div>

  <!-- Advanced Section -->
  <div id="advanced" class="settings-section">
    <div class="settings-card">
      <div class="settings-card-title">ID & Invoice Configuration</div>
      <div class="form-grid">
        <div class="form-group">
          <label>Staff ID Prefix</label>
          <input type="text" name="teacher_code_prefix" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'teacher_code_prefix'))->row()->description; ?>">
        </div>
        <div class="form-group">
          <label>Staff ID Format *</label>
          <input type="text" name="teacher_code_format" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'teacher_code_format'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>Student ID Prefix</label>
          <input type="text" name="student_code_prefix" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'student_code_prefix'))->row()->description; ?>">
        </div>
        <div class="form-group">
          <label>Student ID Format *</label>
          <input type="text" name="student_code_format" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'student_code_format'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>Invoice Number Format (Numeric Only) *</label>
          <input type="number" name="invoice_number_format" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'invoice_number_format'))->row()->description; ?>" required>
        </div>
        <div class="form-group">
          <label>Receipt Style</label>
          <select name="receipt_style" class="form-control">
            <?php $receipt_style = $this->db->get_where('settings', array('type' => 'receipt_style'))->row()->description; ?>
            <option value="style_1" <?php if ($receipt_style == 'style_1') echo 'selected'; ?>>Style One</option>
            <option value="style_2" <?php if ($receipt_style == 'style_2') echo 'selected'; ?>>Style Two</option>
            <option value="style_3" <?php if ($receipt_style == 'style_3') echo 'selected'; ?>>Style Three</option>
          </select>
        </div>
        <div class="form-group">
          <label>School Has Boarding</label>
          <select name="boarding_system" class="form-control">
            <?php $boarding_system = $this->db->get_where('settings', array('type' => 'boarding_system'))->row()->description; ?>
            <option value="yes" <?php if ($boarding_system == 'yes') echo 'selected'; ?>>Yes</option>
            <option value="no" <?php if ($boarding_system == 'no') echo 'selected'; ?>>No</option>
          </select>
        </div>
        <div class="form-group">
          <label>Purchase Code *</label>
          <input type="text" name="purchase_code" class="form-control" value="<?php echo $this->db->get_where('settings', array('type' => 'purchase_code'))->row()->description; ?>" required>
        </div>
      </div>
    </div>

    <!-- Exam Report Templates -->
    <div class="settings-card">
      <div class="settings-card-title"><i class="fa fa-file-text"></i> Exam Report Templates</div>
      
      <div class="form-grid">
        <div class="form-group">
          <label>Terminal Report Style</label>
          <select name="terminal_report_style" class="form-control">
            <?php $terminal_report_style = $this->db->get_where('settings', array('type' => 'terminal_report_style'))->row()->description; ?>
            <option value="style_1" <?php if ($terminal_report_style == 'style_1') echo 'selected'; ?>>Style One</option>
            <option value="style_2" <?php if ($terminal_report_style == 'style_2') echo 'selected'; ?>>Style Two</option>
            <option value="style_3" <?php if ($terminal_report_style == 'style_3') echo 'selected'; ?>>Style Three</option>
          </select>
          <small style="display: block; margin-top: 8px; color: #6b7280;">
            Select the report card design for general (non-creche) terminal reports.
          </small>
        </div>

        <div class="form-group">
          <label>Creche Exam Report Template *</label>
          <select name="creche_exam_template" class="form-control" required>
            <?php 
              $current_template = $this->db->get_where('settings', array('type' => 'creche_exam_template'))->row();
              $selected_template = $current_template ? $current_template->description : 'template1';
            ?>
            <option value="template1" <?php if ($selected_template === 'template1') echo 'selected'; ?>>
              Template 1 (Booklet - Detailed)
            </option>
            <option value="template2" <?php if ($selected_template === 'template2') echo 'selected'; ?>>
              Template 2 (Single Page - Simple)
            </option>
          </select>
          <small style="display: block; margin-top: 8px; color: #6b7280;">
            Select the report card design for creche terminal reports.
          </small>
        </div>
      </div>
      
      <div style="margin-top: 15px; padding: 15px; background: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 8px;">
        <strong style="color: #0c4a6e; display: block; margin-bottom: 8px;">
          <i class="fa fa-info-circle"></i> Template Information:
        </strong>
        <div style="color: #0c4a6e; font-size: 13px; line-height: 1.8;">
          <strong>Terminal Report Styles:</strong> Controls report card design for primary/secondary students.<br>
          <strong>Creche Template 1:</strong> Multi-page booklet format with detailed assessments and comprehensive feedback sections.<br>
          <strong>Creche Template 2:</strong> Single-page simple format with condensed assessment areas and essential student information.<br>
          <em style="display: block; margin-top: 8px;">Changes take effect immediately on next print.</em>
        </div>
      </div>
    </div>

    <!-- Sync Infrastructure Mode -->
    <div class="settings-card">
      <div class="settings-card-title"><i class="fa fa-refresh"></i> Sync Infrastructure</div>
      
      <div class="toggle-container">
        <label class="toggle-switch">
          <input type="checkbox" name="offline_online_mode" 
            <?php 
              $offline_online_mode = $this->db->get_where('settings', array('type' => 'offline_online_mode'))->row(); 
              if ($offline_online_mode && $offline_online_mode->description == '1') echo 'checked';
            ?> 
            onchange="updateOfflineOnlineModeStatus(this)">
          <span class="toggle-slider"></span>
        </label>
        <div class="toggle-label">
          <strong>Offline/Online Mode</strong>
          <small>Enable full offline + online sync capability. When enabled, adds sync columns, tracking, and sync UI to the system. When disabled, runs as standard online-only application without sync overhead.</small>
        </div>
        <span id="offlineOnlineModeStatus" class="toggle-status <?php echo ($offline_online_mode && $offline_online_mode->description == '1') ? 'enabled' : 'disabled'; ?>">
          <?php echo ($offline_online_mode && $offline_online_mode->description == '1') ? 'ENABLED' : 'DISABLED'; ?>
        </span>
      </div>

      <div style="margin-top: 15px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
        <strong style="color: #92400e; display: block; margin-bottom: 8px;"><i class="fa fa-exclamation-triangle"></i> Important Note:</strong>
        <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.6;">
          • <strong>Enabled (1)</strong>: Full sync infrastructure active - use for clients needing offline/online capability<br>
          • <strong>Disabled (0)</strong>: Online-only mode - standard web application, no sync overhead<br>
          • This controls whether sync infrastructure exists at all (not about automatic vs manual sync)<br>
          • Changes require page refresh to take full effect
        </p>
      </div>
    </div>
  </div>

  <div class="save-btn-fixed" style="position: fixed; bottom: 30px; right: 30px; z-index: 999;">
    <button type="submit" class="btn btn-primary" style="min-width: 200px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">Save All Settings</button>
  </div>
  <?php echo form_close(); ?>
</div>

<script>
function switchTab(tabName) {
  document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.settings-section').forEach(section => section.classList.remove('active'));
  
  // Find and activate the correct tab button
  const tabButtons = document.querySelectorAll('.settings-tab');
  tabButtons.forEach(tab => {
    if (tab.textContent.toLowerCase() === tabName.toLowerCase() || 
        tab.getAttribute('onclick').includes(tabName)) {
      tab.classList.add('active');
    }
  });
  
  document.getElementById(tabName).classList.add('active');
}

function updateToggleStatus(checkbox) {
  const statusEl = document.getElementById('autoLockStatus');
  if (checkbox.checked) {
    statusEl.textContent = 'ENABLED';
    statusEl.classList.remove('disabled');
    statusEl.classList.add('enabled');
  } else {
    statusEl.textContent = 'DISABLED';
    statusEl.classList.remove('enabled');
    statusEl.classList.add('disabled');
  }
}

function updateWaecToggleStatus(checkbox) {
  const statusEl = document.getElementById('waecGradingStatus');
  const rawNavEl = document.getElementById('raw_nav');
  const rawNavTeacherEl = document.getElementById('raw_nav_teacher');
  
  if (checkbox.checked) {
    statusEl.textContent = 'ENABLED';
    statusEl.classList.remove('disabled');
    statusEl.classList.add('enabled');
    // Show WAEC menu items if they exist
    if (rawNavEl) rawNavEl.style.display = 'block';
    if (rawNavTeacherEl) rawNavTeacherEl.style.display = 'block';
  } else {
    statusEl.textContent = 'DISABLED';
    statusEl.classList.remove('enabled');
    statusEl.classList.add('disabled');
    // Hide WAEC menu items if they exist
    if (rawNavEl) rawNavEl.style.display = 'none';
    if (rawNavTeacherEl) rawNavTeacherEl.style.display = 'none';
  }
}

function updateOfflineOnlineModeStatus(checkbox) {
  const statusEl = document.getElementById('offlineOnlineModeStatus');
  if (checkbox.checked) {
    statusEl.textContent = 'ENABLED';
    statusEl.classList.remove('disabled');
    statusEl.classList.add('enabled');
  } else {
    statusEl.textContent = 'DISABLED';
    statusEl.classList.remove('enabled');
    statusEl.classList.add('disabled');
  }
}



$('#system_settings_form').submit(function(e) {
  e.preventDefault();
  
  // Find all validation errors
  let errors = [];
  let firstErrorField = null;
  let firstErrorTab = null;
  
  // Check all required fields
  $(this).find('input[required], select[required], textarea[required]').each(function() {
    let $field = $(this);
    let value = $field.val();
    
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      let label = $field.closest('.form-group').find('label').first().text().replace('*', '').trim();
      let $section = $field.closest('.settings-section');
      let tabId = $section.attr('id');
      
      if (!firstErrorField) {
        firstErrorField = $field;
        firstErrorTab = tabId;
      }
      
      errors.push({
        field: label || $field.attr('name') || 'Unknown field',
        tab: getTabDisplayName(tabId)
      });
    }
  });
  
  // Check email format
  $(this).find('input[type="email"]').each(function() {
    let $field = $(this);
    let value = $field.val();
    
    if (value && value.trim() !== '' && !isValidEmail(value.trim())) {
      let label = $field.closest('.form-group').find('label').first().text().replace('*', '').trim();
      let $section = $field.closest('.settings-section');
      let tabId = $section.attr('id');
      
      if (!firstErrorField) {
        firstErrorField = $field;
        firstErrorTab = tabId;
      }
      
      errors.push({
        field: (label || $field.attr('name') || 'Email field') + ' (invalid format)',
        tab: getTabDisplayName(tabId)
      });
    }
  });
  
  if (errors.length > 0) {
    // Create error message
    let errorMsg = '<div style="text-align: left;">';
    errorMsg += '<h4 style="color: #dc3545; margin-bottom: 15px;"><i class="fa fa-exclamation-triangle"></i> Form Validation Failed</h4>';
    errorMsg += '<p style="color: #721c24; margin: 10px 0;">Please fix the following errors:</p>';
    errorMsg += '<ul style="margin: 10px 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">';
    
    errors.forEach(function(error) {
      errorMsg += '<li style="margin: 5px 0; color: #721c24;">';
      errorMsg += '<strong>' + error.field + '</strong> ';
      errorMsg += '<span style="color: #6b7280; font-size: 12px;">(in ' + error.tab + ' tab)</span>';
      errorMsg += '</li>';
    });
    
    errorMsg += '</ul>';
    errorMsg += '<p style="margin-top: 15px; font-size: 12px; color: #6c757d;">';
    errorMsg += '<i class="fa fa-info-circle"></i> Click OK to navigate to the first error.';
    errorMsg += '</p></div>';
    
    showAjaxModal_alert(errorMsg, 'error');
    
    // Navigate to error tab and highlight field after a short delay
    setTimeout(function() {
      if (firstErrorTab && firstErrorField) {
        // Switch to the error tab
        switchTab(firstErrorTab);
        
        // Scroll to top
        $('html, body').animate({ scrollTop: 0 }, 300);
        
        // Highlight and focus the error field
        setTimeout(function() {
          firstErrorField.focus();
          firstErrorField.css({
            'border': '2px solid #dc3545',
            'background-color': '#fef2f2',
            'box-shadow': '0 0 0 3px rgba(220, 53, 69, 0.2)'
          });
          
          // Remove highlight after 4 seconds
          setTimeout(function() {
            firstErrorField.css({
              'border': '',
              'background-color': '',
              'box-shadow': ''
            });
          }, 4000);
        }, 300);
      }
    }, 1000);
    
    return false;
  }
  
  // If no errors, proceed with submission
  // Handle checkbox values
  const autoLockCheckbox = $('input[name="auto_lock_enabled"]');
  if (!autoLockCheckbox.is(':checked')) {
    $('input[name="auto_lock_enabled"][type="hidden"]').remove();
    $(this).append('<input type="hidden" name="auto_lock_enabled" value="no">');
  }
  
  const waecGradingCheckbox = $('input[name="waec_grading_enabled"]');
  if (!waecGradingCheckbox.is(':checked')) {
    $('input[name="waec_grading_enabled"][type="hidden"]').remove();
    $(this).append('<input type="hidden" name="waec_grading_enabled" value="no">');
  }
  
  $('html, body').animate({ scrollTop: 0 }, 500);
  showAjaxModal_alert('UPDATING SYSTEM SETTINGS, PLEASE WAIT...', 'loading');
  
  // Submit the form
  this.submit();
});

function getTabDisplayName(tabId) {
  const tabNames = {
    'general': 'General',
    'branding': 'Branding', 
    'academic': 'Academic',
    'payment': 'Payment',
    'security': 'Security',
    'advanced': 'Advanced'
  };
  return tabNames[tabId] || tabId;
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
</script>
