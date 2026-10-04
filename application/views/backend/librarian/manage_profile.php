<style>
/* Direct UI/UX rebuild — Librarian Profile */
.librarian-profile-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.librarian-profile-wrap {
    max-width: 1120px;
    margin: 0 auto;
}
.librarian-profile-head {
    margin-bottom: 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.librarian-profile-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.librarian-profile-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.librarian-profile-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.librarian-profile-card {
    overflow: hidden;
    margin-bottom: 18px;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.librarian-profile-identity {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 22px;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
}
.librarian-profile-avatar {
    width: 86px;
    height: 86px;
    flex: 0 0 86px;
    border: 4px solid #fff;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 0 1px #cbd5e1;
}
.librarian-profile-name {
    margin: 0 0 3px;
    color: #0f172a;
    font-size: 22px;
    line-height: 1.25;
    font-weight: 800;
}
.librarian-profile-role {
    color: #64748b;
    font-size: 14px;
    font-weight: 700;
}
.librarian-profile-body {
    padding: 22px;
}
.librarian-profile-section-title {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 18px;
    color: #0f172a;
    font-size: 18px;
    line-height: 1.3;
    font-weight: 800;
}
.librarian-profile-section-title i {
    color: #2563eb;
}
.librarian-profile-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 18px;
}
.librarian-profile-grid.password-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
}
.librarian-profile-field {
    min-width: 0;
}
.librarian-profile-field label {
    display: block;
    margin-bottom: 7px;
    color: #334155;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 800;
}
.librarian-profile-field input[type="text"],
.librarian-profile-field input[type="email"],
.librarian-profile-field input[type="password"] {
    width: 100%;
    min-height: 46px;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 9px;
    background: #fff;
    color: #0f172a;
    font-size: 15px;
    line-height: 1.4;
}
.librarian-profile-field input:focus {
    border-color: #2563eb;
    outline: none;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.librarian-profile-photo {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 18px;
    padding: 16px;
    border: 1px dashed #cbd5e1;
    border-radius: 11px;
    background: #f8fafc;
}
.librarian-profile-photo-preview {
    width: 82px;
    height: 82px;
    flex: 0 0 82px;
    border: 3px solid #fff;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 0 1px #cbd5e1;
}
.librarian-profile-upload-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 42px;
    padding: 9px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #334155;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
}
.librarian-profile-upload-label:hover {
    border-color: #94a3b8;
    background: #f8fafc;
}
.librarian-profile-upload-label input {
    display: none;
}
.librarian-profile-help {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.4;
}
.librarian-profile-btn {
    min-height: 46px;
    padding: 10px 18px !important;
    border: 1px solid #2563eb !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    color: #fff !important;
    font-size: 15px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
.librarian-profile-btn:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}
.librarian-password-field {
    position: relative;
}
.librarian-password-field input {
    padding-right: 44px !important;
}
.librarian-password-toggle {
    position: absolute;
    top: 50%;
    right: 14px;
    transform: translateY(-50%);
    color: #64748b;
    cursor: pointer;
    font-size: 16px;
}
@media (max-width: 920px) {
    .librarian-profile-grid.password-grid { grid-template-columns: 1fr; }
}
@media (max-width: 767px) {
    .librarian-profile-workspace { padding: 18px 14px 32px; }
    .librarian-profile-head h1 { font-size: 26px; }
    .librarian-profile-identity {
        align-items: flex-start;
        padding: 18px;
    }
    .librarian-profile-avatar {
        width: 72px;
        height: 72px;
        flex-basis: 72px;
    }
    .librarian-profile-body { padding: 18px; }
    .librarian-profile-grid { grid-template-columns: 1fr; gap: 14px; }
    .librarian-profile-photo {
        align-items: flex-start;
        flex-direction: column;
    }
    .librarian-profile-field input[type="text"],
    .librarian-profile-field input[type="email"],
    .librarian-profile-field input[type="password"] {
        font-size: 16px;
    }
    .librarian-profile-btn { width: 100%; }
}
</style>

<div class="librarian-profile-workspace">
    <div class="librarian-profile-wrap">
        <div class="librarian-profile-head">
            <p class="librarian-profile-eyebrow">Account</p>
            <h1><?php echo get_phrase('manage_profile'); ?></h1>
            <p>Keep your librarian profile details, photo and account password up to date.</p>
        </div>

        <?php foreach($edit_data as $row): ?>
            <div class="librarian-profile-card">
                <div class="librarian-profile-identity">
                    <img src="<?php echo $this->crud_model->get_image_url('librarian', $row['librarian_id']);?>"
                         alt="Profile"
                         class="librarian-profile-avatar">
                    <div>
                        <h2 class="librarian-profile-name"><?php echo $row['name'];?></h2>
                        <div class="librarian-profile-role">Librarian</div>
                    </div>
                </div>

                <div class="librarian-profile-body">
                    <div class="librarian-profile-section-title">
                        <i class="fas fa-user-circle"></i>
                        <?php echo get_phrase('personal_information');?>
                    </div>

                    <?php echo form_open_multipart(site_url('librarian/manage_profile/update_profile_info'), array('id' => 'profile_form'));?>
                        <div class="librarian-profile-grid">
                            <div class="librarian-profile-field">
                                <label><?php echo get_phrase('name');?></label>
                                <input type="text" name="name" value="<?php echo $row['name'];?>" required>
                            </div>
                            <div class="librarian-profile-field">
                                <label><?php echo get_phrase('email');?></label>
                                <input type="email" name="email" value="<?php echo $row['email'];?>" required>
                            </div>
                        </div>

                        <div class="librarian-profile-field">
                            <label><?php echo get_phrase('photo');?></label>
                            <div class="librarian-profile-photo">
                                <img src="<?php echo $this->crud_model->get_image_url('librarian', $row['librarian_id']);?>"
                                     alt="Preview"
                                     class="librarian-profile-photo-preview"
                                     id="photo_preview">
                                <div>
                                    <label class="librarian-profile-upload-label">
                                        <i class="fas fa-camera"></i> <?php echo get_phrase('choose_photo');?>
                                        <input type="file" name="userfile" accept="image/*" onchange="previewPhoto(this)">
                                    </label>
                                    <p class="librarian-profile-help">JPG, PNG or GIF (Max 2MB)</p>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn librarian-profile-btn">
                            <i class="fas fa-save"></i> <?php echo get_phrase('update_profile');?>
                        </button>
                    </form>
                </div>
            </div>

            <div class="librarian-profile-card">
                <div class="librarian-profile-body">
                    <div class="librarian-profile-section-title">
                        <i class="fas fa-lock"></i>
                        <?php echo get_phrase('change_password');?>
                    </div>

                    <?php echo form_open(site_url('librarian/manage_profile/change_password'), array('id' => 'password_form'));?>
                        <div class="librarian-profile-grid password-grid">
                            <div class="librarian-profile-field">
                                <label><?php echo get_phrase('current_password');?></label>
                                <div class="librarian-password-field">
                                    <input type="password" name="password" id="current_password" required>
                                    <i class="fas fa-eye librarian-password-toggle" onclick="togglePassword('current_password')"></i>
                                </div>
                            </div>
                            <div class="librarian-profile-field">
                                <label><?php echo get_phrase('new_password');?></label>
                                <div class="librarian-password-field">
                                    <input type="password" name="new_password" id="new_password" required>
                                    <i class="fas fa-eye librarian-password-toggle" onclick="togglePassword('new_password')"></i>
                                </div>
                            </div>
                            <div class="librarian-profile-field">
                                <label><?php echo get_phrase('confirm_new_password');?></label>
                                <div class="librarian-password-field">
                                    <input type="password" name="confirm_new_password" id="confirm_password" required>
                                    <i class="fas fa-eye librarian-password-toggle" onclick="togglePassword('confirm_password')"></i>
                                </div>
                            </div>
                        </div>

                        <button type="submit" class="btn librarian-profile-btn">
                            <i class="fas fa-key"></i> <?php echo get_phrase('update_password');?>
                        </button>
                    </form>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<script>
function previewPhoto(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('photo_preview').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function togglePassword(fieldId) {
    var field = document.getElementById(fieldId);
    var icon = field.nextElementSibling;
    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}
</script>