<div class="bg-white min-h-screen p-6">
        <div class="max-w-7xl mx-auto">
                <!-- Header Card -->
                <div class="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-6">
                        <div class="flex items-center gap-4 mb-8">
                                <div class="bg-blue-600 p-4 rounded-xl">
                                        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                                        </svg>
                                </div>
                                <div>
                                        <h1 class="text-4xl font-bold text-gray-900"><?php echo get_phrase('manage_attendance');?></h1>
                                        <p class="text-lg text-gray-600 mt-2">Select section and mark student attendance</p>
                                </div>
                        </div>

                        <?php echo form_open(site_url('admin/attendance_selector/'), array('id' => 'att_selector_form'));?>
                        <!-- Filter Section -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                        <label class="block text-base font-bold text-gray-800 mb-3"><?php echo get_phrase('date');?></label>
                                        <input type="text" class="bg-white border-2 border-gray-300 text-gray-900 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5 datepicker h-14 max-h-14" data-end-date="<?= date('d-m-Y');?>" name="timestamp" data-format="dd-mm-yyyy"
                                                value="<?php echo date("d-m-Y");?>"/>
                                </div>

	<?php
		$query = $this->db->get_where('section' , array('class_id' => $class_id,'teacher_id'=>$this->session->userdata('teacher_id')));
		if($query->num_rows() > 0):
			$sections = $query->result_array();
	?>

                                <div>
                                        <label class="block text-base font-bold text-gray-800 mb-3"><?php echo get_phrase('section');?></label>
                                        <select class="bg-white border-2 border-gray-300 text-gray-900 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5 h-[50px]" name="section_id">
                                                <?php foreach($sections as $row):?>
                                                <option value="<?php echo $row['section_id'];?>"><?php echo $row['name'];?></option>
                                        <?php endforeach;?>
                                        </select>
                                </div>
                                <?php endif;?>
                                <input type="hidden" name="class_id" value="<?php echo $class_id;?>">
                                <input type="hidden" name="year" value="<?php echo $running_year;?>">
                                <input type="hidden" name="term" value="<?php echo $running_term;?>">
                                <input type="hidden" name="sem" value="<?php echo $running_sem;?>">

                                <div class="flex items-end">
                                        <button type="submit" class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-bold rounded-lg text-base px-6 py-3.5 transition-all duration-200">
                                                <svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                                </svg>
                                                <?php echo get_phrase('manage_attendance');?>
                                        </button>
                                </div>
                        </div>
                </div>

                <!-- Students Section -->
                <div id="students_holder" style="display: none" class="row col-md-12"></div>

        </div>
<?php echo form_close();?>
</div>

<script type="text/javascript">

jQuery(document).ready(function($) {
        select_students(<?=$class_id ?>);
});


function select_students(class_id) {
        if(class_id !== ''){

                $.ajax({
                        url: '<?php echo site_url('admin/get_multi_select_students/'); ?>' + class_id,
                        success:function (response)
                        {

                        jQuery('#students_holder').slideDown('slow');
                        jQuery('#students_holder').html(response);
                        }
                });

        }       else {
                jQuery('#students_holder').slideUp('slow');
        }
}


//ajax
$('#att_selector_form').submit(function(event) {
        /* Act on the event */

        event.preventDefault();

        let item_checked = $('.check').filter(':checked').length;
        if(item_checked < 1) {
                showAjaxModal_alert('No student was selected!', 'Error');
                return false;
        }

        $('#main_page').empty();

        //SHOW LOADER
  $('#main_page').html('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 200px; ">Fetching Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>');


        $.ajax({
      url: '<?php echo site_url('admin/attendance_selector/'); ?>',
      type: 'POST',
      dataType: 'html',
      data: new FormData(this),
      cache: false,
      contentType: false,
      processData: false
  })
  .done(function(data) {
        if(data == 'promotion error term') {
                showAjaxModal_confirm('Make sure students were promoted during the previous term. For further assistance, kindly contact the system administrator.', 'Error');

                setTimeout(() => {
                        navigation('<?php echo site_url('admin/manage_attendance'); ?>')
                }, 5000);

        } else if(data == 'promotion error sem') {
                showAjaxModal_confirm('Make sure students were promoted during the previous semester. For further assistance, kindly contact the system administrator.', 'Error');



                setTimeout(() => {
                        navigation('<?php echo site_url('admin/manage_attendance'); ?>')
                }, 5000);

        } else {
                $('#main_page').empty();

                navigation(data);

                $('#pre_notice').fadeOut('400', function() {
            $('#pre_notice').remove();
            $('#pre_notice').css('display', 'none');
        });

        }
  });
});
</script>
