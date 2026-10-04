<style>
/* Direct UI/UX refinement — year/term invoice selector */
#view_single_bulk_invoice_form {
    margin: 0;
}
#view_single_bulk_invoice_form > .grid {
    display: grid !important;
    grid-template-columns: repeat(3,minmax(0,1fr)) !important;
    gap: 12px !important;
    align-items: end !important;
    margin-top: 0 !important;
}
#view_single_bulk_invoice_form .flex.gap-5 {
    display: block !important;
}
#view_single_bulk_invoice_form .control-label {
    display: block;
    margin: 0 0 7px;
    color: #334155;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700;
}
#view_single_bulk_invoice_form select,
#view_single_bulk_invoice_form .select2-container .select2-selection--single,
#view_single_bulk_invoice_form .select2-container .select2-choice {
    width: 100% !important;
    min-height: 46px !important;
    height: 46px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 15px !important;
    font-weight: 600 !important;
}
#view_single_bulk_invoice_form .select2-container {
    width: 100% !important;
}
#view_single_bulk_invoice_form .select2-container .select2-selection__rendered,
#view_single_bulk_invoice_form .select2-container .select2-choice > span:first-child {
    line-height: 44px !important;
    padding-left: 11px !important;
    color: #0f172a !important;
    font-size: 15px !important;
}
#view_single_bulk_invoice_form .select2-container .select2-selection__arrow {
    height: 44px !important;
}
#view_single_bulk_invoice_form input[type="submit"] {
    width: 100%;
    min-height: 46px !important;
    height: 46px !important;
    padding: 9px 16px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    font-size: 14px !important;
    line-height: 1.35;
    font-weight: 800 !important;
}
#view_single_bulk_invoice_form input[type="submit"]:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}
@media (max-width: 767px) {
    #view_single_bulk_invoice_form > .grid {
        grid-template-columns: 1fr !important;
    }
    #view_single_bulk_invoice_form select,
    #view_single_bulk_invoice_form .select2-container .select2-selection__rendered {
        font-size: 16px !important;
    }
}
</style>

<?php 

  $un_year = $param2;
  $un_term = $param3;
  $class_id = $param4;
  $un_sem = $param5;

?>

    <?php echo form_open(site_url('admin/view_single_bulk_invoice/'.$class_id), array('class' => 'form-horizontal form-group-bordered', 'id' => 'view_single_bulk_invoice_form')); ?>
      <div class="grid grid-cols-3 gap-4" style="margin-top: 5px;">
        <div class="w-full">
          <div class="flex gap-5">
              <label  class="control-label"><?php echo get_phrase('term');?></label>
              <select name="term" class="select2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg text-xl focus:ring-primary-500 focus:border-primary-500 block w-full h-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" id="term">
                  <option value="" disabled="true"><?php echo get_phrase('term');?></option>
                  <?php for($i = 1; $i <= 3; $i++):?>
                      <option value="<?php echo $i;?>"
                        <?php if($un_term == $i) echo 'selected';?>>
                          <?php echo $i;?>
                      </option>
                  <?php endfor;?>
              </select>
          </div>
        </div>

        <div class="w-full">
            <div class="flex gap-5">
              <label  class="control-label"><?php echo get_phrase('year');?></label>
              <select name="year" class="select2 bg-gray-50 border border-gray-300 text-gray-900 rounded-lg text-xl focus:ring-primary-500 focus:border-primary-500 block w-full h-16 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" id="year">
              <option value="" disabled="true"><?php echo get_phrase('year');?></option>
              <?php
                      echo populate_academic_year('yes');
                    ?>
              </select>
            </div>
        </div>
        <div class="w-full self-end">
            <input type="submit" formTarget="_blank" name="search" value="<?=$param6 == 'bill' ? 'View Bills' : 'View Invoices';?>" class="btn btn-info btn-sm rounded-lg h-16 text-xl font-bold">
        </div>
      </div>

      <input type="hidden" name="bills" value="<?=$param6;?>">
    <?php echo form_close();?>


<script type="text/javascript">
  $('select').select2();
  /*$('#view_single_bulk_invoice_form').submit(function(e) {
    e.preventDefault();


    $('.close').click();
   
    
    showAjaxModal_alert('<center><div style="font-size: 16px; font-weight: bolder; margin-top: 0px; ">Generating Invoices...<br><i class="fa fa-3x fa-spinner fa-pulse"></i><br/><small style="color: #fff">This might take sometime</small></div></center>', 'Loading');
    $('#modal_alert .modal-dialog').css('marginTop', '20vh');

    $.ajax({
      url: '<?php //echo site_url('admin/view_single_bulk_invoice/'.$class_id); ?>',
      type: 'POST',
      dataType: 'html',
      cache: false,
      contentType: false,
      processData: false,
      data: new FormData(this),
    })
    .done(function(response) {
      $('.close').click();

      var w = window.open('about:blank');
      w.document.open();
      w.document.write(response);
      w.document.close();
      //showAjaxModal(response, 'take_payment'); 
    });
    
  });*/
</script>