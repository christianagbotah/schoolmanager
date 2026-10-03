<hr />
<?php
    $active_payment_service = $this->db->get_where('settings' , array(
        'type' => 'active_payment_service'
    ))->row()->description;
?>

<style>
/* Direct UI/UX rebuild — Payment Gateway Settings */
.payment-settings-workspace {
    margin: 0; padding: 24px 28px 40px; background: #f8fafc; min-height: 100%;
}
.payment-settings-workspace > .col-md-12 { padding: 0; }
.payment-settings-page-head {
    margin: 0 0 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0;
}
.payment-settings-eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
}
.payment-settings-page-head h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2;
    font-weight: 800; letter-spacing: -.02em;
}
.payment-settings-page-head p:last-child {
    margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5;
}

.payment-settings-workspace .tabs-vertical-env {
    display: grid; grid-template-columns: 250px minmax(0,1fr); gap: 18px;
    align-items: start;
}
.payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical {
    margin: 0; padding: 6px; border: 1px solid #e2e8f0; border-radius: 14px;
    background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.04);
}
.payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical > li {
    margin: 0 0 5px;
}
.payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical > li:last-child { margin-bottom: 0; }
.payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical > li > a {
    min-height: 44px; padding: 10px 12px; border: 0 !important; border-radius: 9px;
    color: #475569; background: transparent; font-size: 14px; line-height: 1.4; font-weight: 700;
}
.payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical > li > a:hover {
    background: #f1f5f9; color: #0f172a;
}
.payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical > li.active > a {
    background: #2563eb !important; color: #fff !important;
    box-shadow: 0 2px 8px rgba(37,99,235,.16);
}
.payment-settings-workspace .badge {
    margin-left: 6px; padding: 4px 8px !important; border-radius: 999px;
    font-size: 11px !important; font-weight: 800;
}

.payment-settings-workspace .tab-content {
    padding: 0 !important; border: 1px solid #e2e8f0; border-radius: 14px;
    background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05);
    overflow: hidden;
}
.payment-settings-workspace .tab-pane { padding: 20px 22px !important; }
.payment-settings-workspace .tab-pane h4 {
    margin: 0 0 12px; color: #0f172a !important; font-size: 18px; font-weight: 800;
}
.payment-settings-workspace .tab-pane hr {
    margin: 0 0 18px; border-color: #e2e8f0;
}

.payment-settings-workspace .form-horizontal .form-group {
    margin-left: 0; margin-right: 0; margin-bottom: 16px;
}
.payment-settings-workspace .control-label {
    padding-top: 10px; color: #334155; font-size: 14px; line-height: 1.35; font-weight: 700;
    text-align: left;
}
.payment-settings-workspace .form-control,
.payment-settings-workspace select.form-control {
    min-height: 46px; height: 46px; padding: 9px 12px; border: 1px solid #cbd5e1;
    border-radius: 9px; background: #fff; color: #0f172a; font-size: 15px; line-height: 1.4;
}
.payment-settings-workspace .form-control:focus,
.payment-settings-workspace select.form-control:focus {
    border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,.14); outline: none;
}
.payment-settings-workspace input[type="password"] {
    letter-spacing: .04em;
}
.payment-settings-workspace .btn {
    min-height: 42px; padding: 9px 16px; border-radius: 9px;
    font-size: 14px; font-weight: 800;
}
.payment-settings-workspace .btn-info {
    background: #2563eb; border-color: #2563eb; color: #fff;
}
.payment-settings-workspace .btn-info:hover {
    background: #1d4ed8; border-color: #1d4ed8;
}
#hubtel_form .btn-block { min-height: 46px; font-size: 15px; }

#b-profile .form-group:first-of-type {
    padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 11px; background: #f8fafc;
}
#v-home .form-group:nth-of-type(4),
#v-home .form-group:nth-of-type(5) {
    padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc;
}

@media (max-width: 900px) {
    .payment-settings-workspace .tabs-vertical-env {
        grid-template-columns: 1fr;
    }
    .payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical {
        display: flex; gap: 6px; overflow-x: auto;
    }
    .payment-settings-workspace .tabs-vertical-env > .nav.tabs-vertical > li {
        margin: 0; min-width: max-content;
    }
}
@media (max-width: 767px) {
    .payment-settings-workspace { padding: 18px 14px 32px; }
    .payment-settings-page-head h1 { font-size: 26px; }
    .payment-settings-workspace .tab-pane { padding: 16px !important; }
    .payment-settings-workspace .control-label {
        padding-top: 0; margin-bottom: 7px;
    }
    .payment-settings-workspace .form-group > .col-sm-3,
    .payment-settings-workspace .form-group > .col-sm-5,
    .payment-settings-workspace .form-group > .col-sm-offset-3 {
        width: 100%; float: none; margin-left: 0; padding-left: 0; padding-right: 0;
    }
    .payment-settings-workspace .form-control,
    .payment-settings-workspace select.form-control { font-size: 16px; }
}
</style>
<div class="row payment-settings-workspace">
    <div class="col-md-12"><div class="payment-settings-page-head">
        <p class="payment-settings-eyebrow">Fees & Finance</p>
        <h1>Payment Gateway Settings</h1>
        <p>Choose the active payment provider and manage Hubtel credentials, gateway availability, and test/live mode.</p>
    </div>

    

        <div class="tabs-vertical-env">

            <ul class="nav tabs-vertical">
            <li class="active" id="defa_ult"><a href="#b-profile" data-toggle="tab">Select A Payment Service</a></li>
                <li id="hub_tel">
                    <a href="#v-home" data-toggle="tab">
                        Hubtel Payment Settings
                        <?php if ($active_payment_service == 'hubtel'):?>
                            <span class="badge badge-info" style="background-color: green;"><?php echo get_phrase('active');?></span>
                        <?php endif;?>
                    </a>
                </li>
                <!--
                <li>
                    <a href="#v-home" data-toggle="tab">
                        Clickatell Settings
                        <?php if ($active_payment_service == 'clickatell'):?>
                            <span class="badge badge-success"><?php echo get_phrase('active');?></span>
                        <?php endif;?>
                    </a>
                </li>
                <li>
                    <a href="#v-profile" data-toggle="tab">
                        Twilio Settings
                        <?php if ($active_payment_service == 'twilio'):?>
                            <span class="badge badge-success"><?php echo get_phrase('active');?></span>
                        <?php endif;?>
                    </a>
                </li>
                <li>
                    <a href="#v-msg91-profile" data-toggle="tab">
                        MSG91 Settings
                        <?php if ($active_payment_service == 'msg91'):?>
                            <span class="badge badge-success"><?php echo get_phrase('active');?></span>
                        <?php endif;?>
                    </a>
                </li>//-->
            </ul>

            <div class="tab-content">

                <div class="tab-pane active" id="b-profile">

                    <?php echo form_open(site_url('admin/payment_settings/active_service') ,
                        array('class' => 'form-horizontal form-groups-bordered validate','target'=>'_top'));?>

                    <div class="form-group">
                        <label class="col-sm-3 control-label"><?php echo get_phrase('select_a_service');?></label>
                        <div class="col-sm-5">
                            <select name="active_payment_service" class="form-control selectboxit">
                                <option value="hubtel"
                                    <?php if ($active_payment_service == 'hubtel') echo 'selected';?>>
                                        Hubtel-Payment
                                </option>
                                <!--<option value="clickatell"
                                    <?php if ($active_payment_service == 'clickatell') echo 'selected';?>>
                                        Clickatell
                                </option>
                                <option value="twilio"
                                    <?php if ($active_payment_service == 'twilio') echo 'selected';?>>
                                        Twilio
                                </option>
                                                        <option value="msg91"
                                    <?php if ($active_payment_service == 'msg91') echo 'selected';?>>
                                        MSG91
                                </option>
                                --//-->
                                <option value="disabled"<?php if ($active_payment_service == 'disabled' || $active_payment_service == '' || $active_payment_service == null) echo 'selected';?>>
                                    <?php echo get_phrase('disabled');?>
                                </option>
                          </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <div class="col-sm-offset-3 col-sm-5">
                            <button type="submit" class="btn btn-info"><?php echo get_phrase('save');?></button>
                        </div>
                    </div>
                <?php echo form_close();?>
                </div>

                <div class="tab-pane" id="v-home">
                    <?php echo form_open(site_url('admin/payment_settings/hubtel_payment') ,
                        array('class' => 'form-horizontal form-groups-bordered validate','target'=>'_top', 'id' => 'hubtel_form'));?>
                        
                        <h4 class="text-primary">Payment Gateway Credentials</h4>
                        <hr>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">Client ID</label>
                            <div class="col-sm-5">
                                <input type="text" class="form-control" name="hubtel_payment_client_id" 
                                    value="<?php echo $this->db->get_where('settings' , array('type' =>'hubtel_payment_client_id'))->row()->description;?>" 
                                    placeholder="Enter Hubtel Client ID" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">Client Secret</label>
                            <div class="col-sm-5">
                                <input type="password" class="form-control" name="hubtel_payment_client_secret"
                                    value="<?php echo $this->db->get_where('settings' , array('type' =>'hubtel_payment_client_secret'))->row()->description;?>" 
                                    placeholder="Enter Hubtel Client Secret" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="col-sm-3 control-label">Merchant Number</label>
                            <div class="col-sm-5">
                                <input type="text" class="form-control" name="hubtel_payment_merchant_number" 
                                    value="<?php echo $this->db->get_where('settings' , array('type' =>'hubtel_payment_merchant_number'))->row()->description;?>" 
                                    placeholder="HM0000000" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">Enable Gateway</label>
                            <div class="col-sm-5">
                                <select name="hubtel_payment_enabled" class="form-control">
                                    <?php $enabled = $this->db->get_where('settings', array('type'=>'hubtel_payment_enabled'))->row(); ?>
                                    <option value="1" <?php if($enabled && $enabled->description == '1') echo 'selected';?>>Enabled</option>
                                    <option value="0" <?php if(!$enabled || $enabled->description == '0') echo 'selected';?>>Disabled</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="col-sm-3 control-label">Test Mode</label>
                            <div class="col-sm-5">
                                <select name="hubtel_payment_test_mode" class="form-control">
                                    <?php $test_mode = $this->db->get_where('settings', array('type'=>'hubtel_payment_test_mode'))->row(); ?>
                                    <option value="1" <?php if($test_mode && $test_mode->description == '1') echo 'selected';?>>Test Mode</option>
                                    <option value="0" <?php if(!$test_mode || $test_mode->description == '0') echo 'selected';?>>Live Mode</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <div class="col-sm-offset-3 col-sm-5">
                                <button type="submit" class="btn btn-info btn-block"><?php echo get_phrase('save');?></button>
                            </div>
                        </div>
                    <?php echo form_close();?>
                </div>

            </div>

        </div>

    </div>
</div>
<?php
    if(isset($_GET['cid']) && $_GET['cid'] == 1) { ?>
        <script type="text/javascript">
            $(function() {
               $('#defa_ult').removeClass('active');
               $('#b-profile').removeClass('active');
               $('#hub_tel').addClass('active');
               $('#v-home').addClass('active');
              // $('#hub_tel').click();
            });
        </script>
    <?php
    

    }
?>


<script type="text/javascript">
    $('#hubtel_form').submit(function(e) {
        e.preventDefault();
        showAjaxModal_alert('Saving...', 'loading');
        
        $.ajax({
            url: $(this).attr('action'),
            type: 'POST',
            data: new FormData(this),
            cache: false,
            contentType: false,
            processData: false
        }).done(function(response) {
            var data = typeof response === 'string' ? JSON.parse(response) : response;
            if(data.status === 'success') {
                showAjaxModal_alert(data.message, 'success');
                setTimeout(() => location.reload(), 2000);
            } else {
                showAjaxModal_alert(data.message || 'Operation failed', 'error');
            }
        }).fail(function() {
            showAjaxModal_alert('An error occurred', 'error');
        });
    });
</script>