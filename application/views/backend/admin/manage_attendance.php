<style>
/* Attendance selector — enterprise density and readability */
body { background: #f8fafc; }
.attendance-selector-workspace {
    background: #f8fafc !important; min-height: 100vh; padding: 24px 28px 40px !important;
}
.attendance-selector-workspace > .max-w-7xl { max-width: 1480px !important; }

#filter_card {
    margin-bottom: 16px !important; padding: 18px 20px !important;
    border: 1px solid #e2e8f0 !important; border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important; background: rgba(255,255,255,.98) !important;
}
#filter_card > .flex.items-center {
    gap: 12px !important; margin-bottom: 16px !important;
}
#filter_card > .flex.items-center > .bg-blue-600 {
    width: 44px; height: 44px; padding: 0 !important; border-radius: 11px !important;
    display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto;
}
#filter_card > .flex.items-center > .bg-blue-600 svg {
    width: 22px !important; height: 22px !important;
}
#filter_card h1 {
    margin: 0; color: #0f172a !important; font-size: 28px !important; line-height: 1.2;
    font-weight: 800 !important; letter-spacing: -.02em;
}
#filter_card h1 + p {
    margin-top: 4px !important; color: #64748b !important; font-size: 14px !important; line-height: 1.45;
}
#filter_card form + .grid,
#filter_card .grid.grid-cols-1.md\:grid-cols-4 {
    gap: 14px !important;
}
#filter_card label {
    margin-bottom: 7px !important; color: #334155 !important; font-size: 14px !important;
    line-height: 1.35; font-weight: 700 !important;
}
#filter_card select,
#filter_card input[type="text"] {
    min-height: 46px !important; height: 46px !important; max-height: 46px !important;
    padding: 9px 12px !important; border: 1px solid #cbd5e1 !important; border-radius: 9px !important;
    background: #fff !important; color: #0f172a !important; font-size: 15px !important; line-height: 1.4;
}
#filter_card select:focus,
#filter_card input[type="text"]:focus {
    border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,.14) !important; outline: none;
}
#filter_card #submit {
    min-height: 46px !important; height: 46px !important; padding: 9px 16px !important;
    border-radius: 9px !important; font-size: 14px !important; font-weight: 800 !important; line-height: 1.35;
}
#filter_card #submit svg { width: 18px !important; height: 18px !important; margin-right: 7px !important; }

#students_holder { margin-top: 0 !important; }
#students_holder > div {
    border: 1px solid #e2e8f0 !important; border-radius: 14px !important;
    box-shadow: 0 1px 2px rgba(15,23,42,.05) !important;
}
#student_header {
    border: 1px solid #e2e8f0 !important; border-radius: 12px !important;
    box-shadow: 0 4px 14px rgba(15,23,42,.08) !important; background: rgba(255,255,255,.98) !important;
}
#student_header h2,
#student_header h3 { font-size: 18px !important; font-weight: 800 !important; color: #0f172a !important; }
#student_header label { font-size: 14px !important; font-weight: 700 !important; color: #334155 !important; }
#student_header input[type="search"],
#student_header input[type="text"] {
    min-height: 42px; padding: 8px 11px; border: 1px solid #cbd5e1; border-radius: 8px;
    font-size: 14px; color: #0f172a; background: #fff;
}
#student_header button {
    min-height: 40px !important; padding: 8px 13px !important; border-radius: 8px !important;
    font-size: 14px !important; line-height: 1.35; font-weight: 700 !important;
}
#student_header .text-xs { font-size: 13px !important; }
#student_header .text-sm { font-size: 14px !important; }
#selected_count, #student_count { font-weight: 800; }

#students_holder .student-card {
    border: 1px solid #e2e8f0 !important; border-radius: 12px !important;
    box-shadow: none !important; transition: border-color .15s ease, box-shadow .15s ease !important;
}
#students_holder .student-card:hover {
    border-color: #93c5fd !important; box-shadow: 0 3px 10px rgba(15,23,42,.06) !important;
    transform: none !important;
}
#students_holder .student-card .text-xs { font-size: 13px !important; line-height: 1.4 !important; }
#students_holder .student-card .text-sm { font-size: 14px !important; line-height: 1.45 !important; }
#students_holder .student-card .text-lg,
#students_holder .student-card .text-xl { font-size: 15px !important; line-height: 1.4 !important; }
#students_holder .student-card input[type="checkbox"] {
    width: 18px; height: 18px; accent-color: #2563eb;
}

.attendance-selector-workspace .datepicker-dropdown { font-size: 14px; }

@media (max-width: 991px) {
    #filter_card .grid.grid-cols-1.md\:grid-cols-4 { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
}
@media (max-width: 767px) {
    .attendance-selector-workspace { padding: 18px 14px 32px !important; }
    #filter_card { padding: 16px !important; }
    #filter_card h1 { font-size: 24px !important; }
    #filter_card .grid.grid-cols-1.md\:grid-cols-4 { grid-template-columns: 1fr !important; }
    #filter_card #submit { width: 100%; }
    #student_header { position: relative !important; top: auto !important; left: auto !important; transform: none !important; width: 100% !important; }
}
@media (max-width: 400px) {
    .attendance-selector-workspace { padding: 12px 10px 28px !important; }
    #filter_card > .flex.items-center { align-items: flex-start !important; }
}
</style>

<div class="bg-white min-h-screen p-6 attendance-selector-workspace">
	<div class="max-w-7xl mx-auto">
		<!-- Header Card -->
		<div id="filter_card" class="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-6 transition-all duration-300">
			<div class="flex items-center gap-4 mb-8">
				<div class="bg-blue-600 p-4 rounded-xl">
					<svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
					</svg>
				</div>
				<div>
					<h1 class="text-4xl font-bold text-gray-900"><?php echo get_phrase('manage_attendance');?></h1>
					<p class="text-lg text-gray-600 mt-2">Select class and mark student attendance</p>
				</div>
			</div>

			<?php echo form_open(site_url('admin/attendance_selector/'), array('id' => 'att_selector_form'));?>
			<!-- Filter Section -->
			<div class="grid grid-cols-1 md:grid-cols-4 gap-5">
				<div>
					<label class="block text-base font-bold text-gray-800 mb-3"><?php echo get_phrase('class');?></label>
					<select name="class_id" class="bg-white border-2 border-gray-300 text-gray-900 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5" onchange="select_section(this.value); select_students(this.value)" id="class_selection">
						<option value=""><?php echo get_phrase('select_class');?></option>
						<?php getFullClassList(); ?>
					</select>
				</div>

				<div id="section_holder">
					<label class="block text-base font-bold text-gray-800 mb-3"><?php echo get_phrase('section');?></label>
					<select class="bg-white border-2 border-gray-300 text-gray-900 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5" name="section_id">
						<option value=""><?php echo get_phrase('select_class_first') ?></option>
					</select>
				</div>

				<div>
					<label class="block text-base font-bold text-gray-800 mb-3"><?php echo get_phrase('date');?></label>
					<input type="text" class="bg-white border-2 border-gray-300 text-gray-900 text-base rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3.5 datepicker h-14 max-h-14" name="timestamp"  data-end-date="<?= date('d-m-Y');?>"  data-format="dd-mm-yyyy"
					value="<?php echo date("d-m-Y");?>"/>
				</div>

				<div class="flex items-end">
					<button type="submit" id="submit" class="w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-bold rounded-lg text-base px-6 py-3.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
						<svg class="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
						</svg>
						<?php echo get_phrase('manage_attendance');?>
					</button>
				</div>
			</div>

			<input type="hidden" name="year" value="<?php echo $running_year;?>">
			<input type="hidden" name="term" value="<?php echo $running_term;?>">
			<input type="hidden" name="sem" value="<?php echo $running_sem;?>">
		</div>

		<!-- Students Section -->
		<div id="students_holder" style="display: none;">
			<div id="sticky_spacer" style="height: 0px;"></div>
		</div>
		<?php echo form_close();?>
	</div>
</div>

<script type="text/javascript">
var class_selection = "";

jQuery(document).ready(function($) {
	$('#submit').attr('disabled', 'disabled');
});

function select_section(class_id) {
	if(class_id !== ''){
		$.ajax({
			url: '<?php echo site_url('admin/get_section/'); ?>' + class_id,
			success:function (response) {
				jQuery('#section_holder').html(response);
			}
		});
	}
}

function select_students(class_id) {
	if(class_id !== ''){
		$('#students_holder').html(`
			<div class="bg-white rounded-2xl shadow-lg p-8">
				<div class="flex justify-center items-center">
					<div class="text-center">
						<svg class="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
						</svg>
						<p class="text-lg font-semibold text-gray-700">Loading students...</p>
					</div>
				</div>
			</div>
		`).show();

		$.ajax({
			url: '<?php echo site_url('admin/get_multi_select_students/'); ?>' + class_id,
			success:function (response) {
				jQuery('#students_holder').html(response).slideDown('slow');
				initSearchFilter();
			}
		});
	} else {
		jQuery('#students_holder').slideUp('slow');
	}
}

function initSearchFilter() {
	const searchInput = document.getElementById('student_search');
	const selectAllBtn = document.getElementById('select_all_btn');
	const deselectAllBtn = document.getElementById('deselect_all_btn');
	const studentHeader = document.getElementById('student_header');
	let headerOffset = 0;
	let headerSticky = false;
	
	// Sticky student header
	const mainHeaderHeight = 60;
	window.addEventListener('scroll', function() {
		if(!studentHeader) return;
		
		if(headerOffset === 0) {
			headerOffset = studentHeader.offsetTop;
		}
		
		const filterCardHeight = document.getElementById('filter_card').offsetHeight;
		const stickyTop = mainHeaderHeight + filterCardHeight + 10;
		
		if(window.pageYOffset > headerOffset - stickyTop) {
			if(!headerSticky) {
				studentHeader.style.position = 'fixed';
				studentHeader.style.top = stickyTop + 'px';
				studentHeader.style.left = '50%';
				studentHeader.style.transform = 'translateX(-50%)';
				studentHeader.style.width = 'calc(100% - 3rem)';
				studentHeader.style.maxWidth = '80rem';
				studentHeader.style.zIndex = '99';
				headerSticky = true;
			}
		} else {
			if(headerSticky) {
				studentHeader.style.position = 'relative';
				studentHeader.style.top = 'auto';
				studentHeader.style.left = 'auto';
				studentHeader.style.transform = 'none';
				studentHeader.style.width = 'auto';
				headerSticky = false;
			}
		}
	});
	
	
	if(searchInput) {
		searchInput.addEventListener('input', function(e) {
			const searchTerm = e.target.value.toLowerCase();
			const studentCards = document.querySelectorAll('.student-card');
			let visibleCount = 0;
			
			studentCards.forEach(card => {
				const studentName = card.dataset.studentName.toLowerCase();
				if(studentName.includes(searchTerm)) {
					card.style.display = '';
					visibleCount++;
				} else {
					card.style.display = 'none';
				}
			});
			
			document.getElementById('student_count').textContent = visibleCount;
		});
	}
	
	if(selectAllBtn) {
		selectAllBtn.addEventListener('click', function() {
			document.querySelectorAll('.student-card:not([style*="display: none"]) .check').forEach(cb => cb.checked = true);
			updateSelectedCount();
		});
	}
	
	if(deselectAllBtn) {
		deselectAllBtn.addEventListener('click', function() {
			document.querySelectorAll('.check').forEach(cb => cb.checked = false);
			updateSelectedCount();
		});
	}
	
	document.querySelectorAll('.check').forEach(checkbox => {
		checkbox.addEventListener('change', updateSelectedCount);
	});
}

function updateSelectedCount() {
	const selectedCount = document.querySelectorAll('.check:checked').length;
	document.getElementById('selected_count').textContent = selectedCount;
}

function check_validation(){
	if(class_selection !== ''){
		$('#submit').removeAttr('disabled');
	} else {
		$('#submit').attr('disabled', 'disabled');
	}
}

$('#class_selection').change(function(){
	class_selection = $('#class_selection').val();
	check_validation();
});

// Sticky header functionality
let filterCard = document.getElementById('filter_card');
let filterCardOffset = 0;
let isSticky = false;
const mainHeaderHeight = 60; // Main page header height

window.addEventListener('scroll', function() {
	if(!filterCard) return;
	
	if(filterCardOffset === 0) {
		filterCardOffset = filterCard.offsetTop;
	}
	
	if(window.pageYOffset > filterCardOffset - mainHeaderHeight) {
		if(!isSticky) {
			filterCard.style.position = 'fixed';
			filterCard.style.top = mainHeaderHeight + 'px';
			filterCard.style.left = '50%';
			filterCard.style.transform = 'translateX(-50%)';
			filterCard.style.width = 'calc(100% - 3rem)';
			filterCard.style.maxWidth = '80rem';
			filterCard.style.zIndex = '100';
			document.getElementById('sticky_spacer').style.height = filterCard.offsetHeight + 'px';
			isSticky = true;
		}
	} else {
		if(isSticky) {
			filterCard.style.position = 'relative';
			filterCard.style.top = 'auto';
			filterCard.style.left = 'auto';
			filterCard.style.transform = 'none';
			filterCard.style.width = 'auto';
			document.getElementById('sticky_spacer').style.height = '0px';
			isSticky = false;
		}
	}
});

$('#att_selector_form').submit(function(event) {
	event.preventDefault();

	let item_checked = $('.check').filter(':checked').length;
	if(item_checked < 1) {
		showAjaxModal_alert('No student was selected!', 'Error');
		return false;
	}

	let student_ids = [];
	$('.check:checked').each(function() {
		student_ids.push($(this).val());
	});

	$('#main_page').html(`
		<div class="flex justify-center items-center h-screen">
			<div class="text-center">
				<svg class="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				<p class="text-xl font-semibold text-gray-700">Fetching Data...</p>
			</div>
		</div>
	`);

	let formData = new FormData(this);
	student_ids.forEach(id => formData.append('students_ids[]', id));

	$.ajax({
		url: '<?php echo site_url('admin/attendance_selector/'); ?>',
		type: 'POST',
		dataType: 'html',
		data: formData,
		cache: false,
		contentType: false,
		processData: false
	})
	.done(function(data) {
		
		if(data == 'promotion error term') {
			showAjaxModal_confirm('Make sure students were promoted during the previous term. For further assistance, kindly contact the system administrator.', 'Error');
			navigation('<?php echo site_url('admin/manage_attendance'); ?>');
		} else if(data == 'promotion error sem') {
			showAjaxModal_confirm('Make sure students were promoted during the previous semester. For further assistance, kindly contact the system administrator.', 'Error');
			navigation('<?php echo site_url('admin/manage_attendance'); ?>');
		} else {
			$('#main_page').empty();
			navigation(data);
			$('#pre_notice').fadeOut('400', function() {
				$('#pre_notice').remove();
			}); 
		}
	});
});

$(document).ready(function() {
	$('.datepicker').datepicker({
		format: 'dd-mm-yyyy',
		autoclose: true,
		todayHighlight: true,
		orientation: 'bottom',
		endDate: new Date()
	});
});
</script>

