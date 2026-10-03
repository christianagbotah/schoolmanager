<style>
/* Direct UI/UX rebuild — Student-specific Payment History */
.student-payment-history-workspace { padding: 24px 28px 40px; background: #f8fafc; min-height: 100%; }
.student-payment-history-head { margin: 0 0 18px; padding-bottom: 18px; border-bottom: 1px solid #e2e8f0; }
.student-payment-history-eyebrow {
    margin: 0 0 4px; color: #2563eb; font-size: 13px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
}
.student-payment-history-head h1 {
    margin: 0; color: #0f172a; font-size: 30px; line-height: 1.2; font-weight: 800; letter-spacing: -.02em;
}
.student-payment-history-head p:last-child { margin: 7px 0 0; color: #64748b; font-size: 15px; line-height: 1.5; }

.student-payment-history-nav {
    display: inline-flex; flex-wrap: wrap; gap: 5px; margin-bottom: 16px; padding: 5px;
    border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;
}
.student-payment-history-nav .btn {
    min-height: 40px; padding: 9px 14px; border: 0 !important; border-radius: 8px !important;
    background: transparent !important; color: #475569 !important; font-size: 14px; font-weight: 700;
}
.student-payment-history-nav .btn-success {
    background: #2563eb !important; color: #fff !important; box-shadow: 0 2px 8px rgba(37,99,235,.18);
}
.student-payment-history-nav .btn-info:hover { background: #f1f5f9 !important; color: #0f172a !important; }

.student-payment-filter-card {
    display: grid; grid-template-columns: repeat(3,minmax(0,1fr)) auto; gap: 14px; align-items: end;
    margin-bottom: 16px; padding: 16px 18px; border: 1px solid #e2e8f0;
    border-radius: 14px; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
.student-payment-filter-card label {
    display: block; margin: 0 0 7px; color: #334155; font-size: 14px; font-weight: 700;
}
.student-payment-filter-card select,
.student-payment-filter-card .select2-container .select2-selection--single,
.student-payment-filter-card .select2-container .select2-choice {
    min-height: 46px !important; height: 46px !important; width: 100% !important;
    border: 1px solid #cbd5e1 !important; border-radius: 9px !important;
    background: #fff !important; color: #0f172a !important; font-size: 15px !important;
}
.student-payment-filter-card .select2-container { width: 100% !important; }
.student-payment-filter-card .select2-container .select2-selection__rendered,
.student-payment-filter-card .select2-container .select2-choice > span:first-child {
    line-height: 44px !important; padding-left: 12px !important; font-size: 15px !important; color: #0f172a !important;
}
.student-payment-filter-card .select2-container .select2-selection__arrow { height: 44px !important; }
.student-payment-filter-card #find {
    min-height: 46px; padding: 10px 18px; border-radius: 9px;
    background: #2563eb; border-color: #2563eb; font-size: 14px; font-weight: 800;
}
.student-payment-filter-card #find:hover { background: #1d4ed8; border-color: #1d4ed8; }

.student-payment-results-card {
    min-height: 120px; padding: 16px 18px; border: 1px solid #e2e8f0;
    border-radius: 14px; background: #fff; box-shadow: 0 1px 2px rgba(15,23,42,.05);
    overflow-x: auto; -webkit-overflow-scrolling: touch;
}
.student-payment-results-card #data { min-width: 0; }
.student-payment-results-card table { min-width: 820px; width: 100%; }
.student-payment-results-card table thead th {
    padding: 12px 13px !important; background: #f8fafc !important; color: #475569 !important;
    font-size: 13px !important; font-weight: 800 !important; letter-spacing: .035em;
}
.student-payment-results-card table tbody td {
    padding: 12px 13px !important; color: #334155 !important; font-size: 14px !important; line-height: 1.45;
}
.student-payment-results-card .btn {
    min-height: 38px; padding: 7px 11px; border-radius: 8px; font-size: 13px; font-weight: 700;
}

@media (max-width: 991px) {
    .student-payment-filter-card { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (max-width: 767px) {
    .student-payment-history-workspace { padding: 18px 14px 32px; }
    .student-payment-history-head h1 { font-size: 26px; }
    .student-payment-history-nav { display: grid; grid-template-columns: 1fr; width: 100%; }
    .student-payment-history-nav .btn { width: 100%; text-align: left; }
    .student-payment-filter-card { grid-template-columns: 1fr; }
    .student-payment-filter-card #find { width: 100%; }
}
</style>

<div class="student-payment-history-workspace">
    <div class="student-payment-history-head">
        <p class="student-payment-history-eyebrow">Fees & Finance</p>
        <h1>Student Payment History</h1>
        <p>Select a class, section, and student to review that learner's payment history.</p>
    </div>
    <div class="student-payment-history-nav">
        <a href="#" onclick="navigation('<?php echo site_url('admin/invoices_show'); ?>')" class="btn btn-<?php if($page_name == 'invoices' || $page_name == 'invoices_loaded') { echo 'success'; } else { echo 'info'; }; ?>">
            <?php echo get_phrase('invoices');?>
        </a>
        <a href="#" onclick="navigation('<?php echo site_url('admin/income/payment_history');?>')" class="btn btn-<?php echo $page_name == 'payment_history' ? 'success' : 'info'; ?>">
            <?php echo get_phrase('payment_history');?>
        </a>
        <a href="#" onclick="navigation('<?php echo site_url('admin/income/student_specific_payment_history');?>')" class="btn btn-<?php echo $page_name == 'student_specific_payment_history' ? 'success' : 'info'; ?>">
            <?php echo get_phrase('student_specific_payment_history');?>
        </a>
    </div>

<?php 
	$class_id = isset($class_id) ? $class_id : '';
	$section_id = isset($section_id) ? $section_id : '';
	$student_id = isset($student_id) ? $student_id : '';
?>
<div class="student-payment-filter-card">
	<div>
		<label><?php echo get_phrase('class');?></label>
		<select class="" name="class_id" id="class_id">
			<option value=""><?php echo get_phrase('select_a_class');?></option>
			<?php 
				$classes = $this->db->get('class')->result_array();
				foreach ($classes as $row):
			?>
			<option value="<?php echo $row['class_id'];?>">
				<?php echo $row['name'].' '.$row['name_numeric'];?>
			</option>
		<?php endforeach;?>
		</select>
	</div>
	<div>
		<label><?php echo get_phrase('section');?></label>
		<div id="section_holder">
			<select class="" name="section_id" id="section_id" disabled>
			    <option value=""><?php echo get_phrase('select_a_class_first');?></option>
		    </select>
		</div>
	</div>
	<div>
		<label><?php echo get_phrase('student');?></label>
		<div id="student_holder">
			<select class="" name="student_id" id="student_id" disabled>
			    <option value=""><?php echo get_phrase('select_a_class_and_section');?></option>
		    </select>
		</div>
	</div>
	<div>
		<label></label>
		<button type="button" class="btn btn-info btn-block" id="find">
			<?php echo get_phrase('find_payments');?>
		</button>
	</div>
</div>

<div class="student-payment-results-card">
        <div id="data">
            <?php include 'student_specific_payment_history_table.php'; ?>
        </div>
    </div>
</div>

<script type="text/javascript">
	$(document).ready(function() {

		$('#class_id').select2();
		$('#section_id').select2();
		$('#student_id').select2();

		$('#class_id').on('change', function() {
			var class_id = $(this).val();
			$.ajax({
				url: '<?php echo site_url('admin/get_sections_for_ssph/');?>' + class_id
			}).done(function(response) {
				$('#section_holder').html(response);
				$('#section_id').select2();
				var section_id = $('#section_id').val();
				$.ajax({
					url: '<?php echo site_url('admin/get_students_for_ssph/');?>' + class_id + '/' + section_id
				}).done(function(response) {
					$('#student_holder').html(response);
					$('#student_id').select2();
				});
			});
		});

		$('#section_id').on('change', function() {
			var section_id = $(this).val();
			var class_id = $('#class_id').val();
			$.ajax({
				url: '<?php echo site_url('admin/get_students_for_ssph/');?>' + class_id + '/' + section_id
			}).done(function(response) {
				$('#student_holder').html(response);
				$('#student_id').select2();
			});
		});

		$('#find').on('click', function() {
			
			var student_id = $('#student_id').val();

			if(student_id == '') {
				$('#data').html('<center><div style="font-size: 16px; font-weight: bolder; margin-top: 10px; color: red">No student was selected!</div></center>');

				return false;
			}

			$('#data').html('<center><div style="font-size: 16px; font-weight: bolder; margin-top: 10px; ">Fetching Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>');
			$.ajax({
				url: '<?php echo site_url('admin/get_payment_history_for_ssph/');?>' + student_id
			}).done(function(response) {
				$('#data').html(response);
			});
		});

	});
</script>