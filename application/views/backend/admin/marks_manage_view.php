<style type="text/css">
	table.table-bordered.dataTable th:last-child, table.table-bordered.dataTable th:last-child {
		border-right-width: 1px !important;
	}

	th {
		padding-bottom: 20px !important;
	}

	.form-inline .form-control {
		width: 50px !important;
	}

	.transf {
		transform: rotate(-90deg);
	}

	.form-inline .form-control {
		width: 60px !important;
	}
	@media 
only screen and (min-width: 1530px),
  {
  	.lgt {
  		margin-bottom: 10px;
  	}
  }

/* Mobile-responsive fixes for marks management filters */
@media (max-width: 640px) {
    .form-group label {
        font-size: 14px !important;
    }
    
    .form-group select {
        font-size: 16px !important;
        height: auto !important;
        min-height: 50px !important;
        padding: 12px !important;
    }
    
    #subject_holder {
        margin-top: 0 !important;
    }
    
    #submit {
        width: 100% !important;
        padding: 15px !important;
        font-size: 16px !important;
    }
}

@media (min-width: 641px) and (max-width: 768px) {
    .form-group select {
        font-size: 18px !important;
        height: 60px !important;
    }
}

</style>
<hr />
<?php echo form_open(site_url('admin/marks_selector'), array('id' => 'subject_loader_form'));?>
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	<div class="flex flex-col sm:flex-row gap-4 w-full">

		<div class="w-full">
			<div class="form-group">
			<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('exam');?></label>
				<select name="exam_id" class="select2 visible bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase" required>
					<?php
						$class_name = $this->crud_model->get_class_name($class_id);
						
						if($class_name == 'JHSS') {
							$this->db->where('year', $running_year);
							$this->db->where('category_id !=', '1');
							$this->db->where('sem', $running_sem);
						} else {
							$this->db->where('year', $running_year);
							$this->db->where('category_id !=', '1');
							$this->db->where('term', $running_term);
						}
						$exams = $this->db->get_where('exam')->result_array();
						foreach($exams as $row):
					?>
					<option value="<?php echo $row['exam_id'];?>"
						<?php if($exam_id == $row['exam_id']) echo 'selected';?>><?php echo $row['name'];?></option>
					<?php endforeach;?>
				</select>
			</div>
		</div>

		<?php
			if($account_type == 'teacher') {
				?>
					<div class="w-full">
						<div class="form-group">
						<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('class');?></label>
							<select name="class_id" class="select2 visible bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase" onchange="get_class_subject(this.value)">
								<option value=""><?php echo get_phrase('select_class');?></option>
								<?php
								// Track added class IDs to prevent duplicates
								$added_class_ids = array();
								
								// First, add classes where teacher is the class teacher (creche)
								foreach($class_ids_creche as $subj):
									// Skip if already added
									if(in_array($subj['class_id'], $added_class_ids)) continue;
									
									$classes = $this->db->get_where('class', array('class_id' => $subj['class_id']))->result_array();
									foreach($classes as $row):
									 
									 //add section A or B if the class has more than one section
				                    $section_name = $this->db->get_where('section', array('class_id' => $row['class_id']))->row()->name;
				                    $class_has_more_sections = $this->db->get_where('class', array('name' => $row['name'], 'name_numeric' => $row['name_numeric']))->num_rows();
				                    $sec_name = '';
				                    if($class_has_more_sections > 1) {
				                        $sec_name = ' '.$section_name;
				                    }
								?>
								<option value="<?php echo $row['class_id'];?>" <?php if($class_id == $row['class_id']) echo 'selected';?>><?php echo $row['name'].' '.$row['name_numeric'].$sec_name;?></option>
								<?php 
									// Mark this class as added
									$added_class_ids[] = $subj['class_id'];
									endforeach; 
								endforeach; //FOR CRECHE ?> 
				                
				                <?php
								// Second, add classes where teacher teaches subjects
								foreach($class_ids as $subj):
									// Skip if already added
									if(in_array($subj['class_id'], $added_class_ids)) continue;
									
									$classes = $this->db->get_where('class', array('class_id' => $subj['class_id']))->result_array();
									foreach($classes as $row):
									
									//add section A or B if the class has more than one section
				                    $section_name = $this->db->get_where('section', array('class_id' => $row['class_id']))->row()->name;
				                    $class_has_more_sections = $this->db->get_where('class', array('name' => $row['name'], 'name_numeric' => $row['name_numeric']))->num_rows();
				                    $sec_name = '';
				                    if($class_has_more_sections > 1) {
				                        $sec_name = ' '.$section_name;
				                    }
								?>
								<option value="<?php echo $row['class_id'];?>" <?php if($class_id == $row['class_id']) echo 'selected';?>><?php echo $row['name'].' '.$row['name_numeric'].$sec_name;?></option>
								<?php 
									// Mark this class as added
									$added_class_ids[] = $subj['class_id'];
									endforeach; 
								endforeach; ?>
							</select>
						</div>
					</div>
				<?php
			} else {
				?>
					<div class="w-full">
						<div class="form-group">
						<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('class');?></label>
							<select name="class_id" class="select2 visible bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase" onchange="get_class_subject(this.value)">
								<option value=""><?php echo get_phrase('select_class');?></option>
								<?php
											$teacher_id = '';
	                    getFullClassList($teacher_id, $class_id);
	                ?>
							</select>
						</div>
					</div>
				<?php
			}
		?>
		</div>
		<div id="subject_holder" class="w-full flex flex-col sm:flex-row gap-4">
			<!-- Hidden section selector - value still submitted but not visible -->
			<div class="w-full" style="display: none;">
				<div class="form-group">
				<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('section');?></label>
					<select name="section_id" id="section_id" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase">
						<?php 
							$sections = $this->db->get_where('section' , array(
								'class_id' => $class_id 
							))->result_array();
							foreach($sections as $row):
						?>
						<option value="<?php echo $row['section_id'];?>" 
							<?php if($section_id == $row['section_id']) echo 'selected';?>>
								<?php echo $row['name'];?>
						</option>
						<?php endforeach;?>
					</select>
				</div>
			</div>
			<div class="w-full">
				<div class="form-group">
				<label class="control-label" style="margin-bottom: 5px;"><?php echo get_phrase('subject');?></label>
					<select name="subject_id" onchange="load_subjects()" id="subject_id" class="select2 visible bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-xl font-bold block w-full max-w-full h-20 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 uppercase">
						<?php 

							if($account_type == 'teacher') {

								if($class_name == 'JHSS') { 

									//if this is a class master or class teacher, grant full access to all the subjects
									if($class_teacher == $this->session->userdata('teacher_id')) {
										$subjects = $this->db->get_where('subject' , array(
										'class_id' => $class_id , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'sem' => $this->db->get_where('settings' , array('type' => 'running_sem'))->row()->description))->result_array();
									} else {
										$subjects = $this->db->get_where('subject' , array(
										'class_id' => $class_id , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'sem' => $this->db->get_where('settings' , array('type' => 'running_sem'))->row()->description, 'teacher_id' => $this->session->userdata('teacher_id')
										))->result_array();
									}

								} else {
									//if this is a class master or class teacher, grant full access to all the subjects
									if($class_teacher == $this->session->userdata('teacher_id')) {
										$subjects = $this->db->get_where('subject' , array(
										'class_id' => $class_id , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description))->result_array();
									} else {
										$subjects = $this->db->get_where('subject' , array(
										'class_id' => $class_id , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description, 'teacher_id' => $this->session->userdata('teacher_id')
										))->result_array();
									}

								}

							} else {

								if($class_name == 'JHSS') { 

									$subjects = $this->db->get_where('subject' , array(
									'class_id' => $class_id , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'sem' => $this->db->get_where('settings' , array('type' => 'running_sem'))->row()->description
									))->result_array();

								} else {
									$subjects = $this->db->get_where('subject' , array(
									'class_id' => $class_id , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description
								))->result_array();

								}
							}
							
							foreach($subjects as $row):
						?>
						<option value="<?php echo $row['subject_id'];?>"
							<?php if($subject_id == $row['subject_id']) echo 'selected';?>>
								<?php echo $row['name'];?>
						</option>
						<?php endforeach;?>
					</select>
				</div>
			</div>
			<div class="w-full" style="margin-top: 20px">

				<?php
					echo get_button('submit', "Manage Marks", '', 'btn_marks')
				?>
			</div>
			
			<!-- View Marksheet Button - Admin sees without restrictions -->
			<?php
				// Get first enrolled student in this class for current academic session
				$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
				
				if($class_name == 'JHSS') {
					$running_sem = $this->db->get_where('settings', array('type' => 'running_sem'))->row()->description;
					$first_student = $this->db->select('student_id')
						->from('enroll')
						->where('class_id', $class_id)
						->where('year', $running_year)
						->where('sem', $running_sem)
						->where('mute', '0')
						->order_by('student_id', 'ASC')
						->limit(1)
						->get()
						->row();
				} else {
					$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
					$first_student = $this->db->select('student_id')
						->from('enroll')
						->where('class_id', $class_id)
						->where('year', $running_year)
						->where('term', $running_term)
						->where('mute', '0')
						->order_by('student_id', 'ASC')
						->limit(1)
						->get()
						->row();
				}
				
				if($first_student):
					$marksheet_url = site_url('admin/student_marksheet/'.$first_student->student_id);
			?>
			<div class="w-full" style="margin-top: 20px">
				<a href="<?php echo $marksheet_url; ?>" class="btn btn-primary btn-lg" style="width: 100%; padding: 15px; font-size: 16px; text-align: center; display: inline-block;">
					<i class="entypo-doc-text"></i> View Marksheet
				</a>
			</div>
			<?php endif; ?>
			
		</div>
	</div>
</div>
<?php echo form_close();?>

<hr />
<div class="row" style="text-align: center;">
	<div class="col-sm-4"></div>
	<div class="col-sm-4">
		<div class="tile-stats tile-gray">
			<div class="icon"><i class="entypo-chart-bar" style="color: #8082ec"></i></div>

			<?php
				

			?>
			
			
			<?php
				if($class_name == 'JHSS') {
					?>
						<h4><?php echo get_phrase('marks_for');?> <?php echo $this->db->get_where('exam' , array('exam_id' => $exam_id, 'year' => $running_year, 'sem' => $running_sem))->row()->name;?></h4>
						<h4>
							<?php echo get_phrase('semester:').' '.$running_sem.' | '. get_phrase('sessional_year:').' '.explode('-', $running_year)[1];?>
						</h4>
					<?php
				} else {
					?>

						<h4><?php echo get_phrase('marks_for');?> <?php echo $this->db->get_where('exam' , array('exam_id' => $exam_id, 'year' => $running_year, 'term' => $running_term))->row()->name;?></h4>
						<h4>
							<?php echo get_phrase('term:').' '.$running_term.' | '. get_phrase('sessional_year:').' '.explode('-', $running_year)[1];?>
						</h4>
					<?php
				}
			?>
			<h4 style="color: #696969;">
				<?php echo $this->db->get_where('class' , array('class_id' => $class_id))->row()->name.' '.$this->db->get_where('class' , array('class_id' => $class_id))->row()->name_numeric;?> : 
				<?php echo get_phrase('section');?> <?php echo $this->db->get_where('section' , array('section_id' => $section_id))->row()->name;?> 
			</h4>

			<?php
				if($class_name == 'JHSS') {
					$subject_row = $this->db->get_where('subject' , array('subject_id' => $subject_id, 'year' => $running_year, 'sem' => $running_sem))->row();
					?>
					<h4 style="color: #696969;">
						<?php echo get_phrase('subject');?> : <?php echo $subject_row ? $subject_row->name : 'N/A';?>
					</h4>
					<?php
				} else {
					$subject_row = $this->db->get_where('subject' , array('subject_id' => $subject_id, 'year' => $running_year, 'term' => $running_term))->row();
					?>
					<h4 style="color: #696969;">
						<?php echo get_phrase('subject');?> : <?php echo $subject_row ? $subject_row->name : 'N/A';?>
					</h4>
					<?php
				} ?>
			
		</div>
	</div>
	<div class="col-sm-4"></div>
</div>
<div class="row">
	<div class="col-md-12">

		<?php echo form_open(site_url('admin/marks_update/'.$exam_id.'/'.$class_id.'/'.$section_id.'/'.$subject_id), array('id' => 'mark_sheet_form'));?>
			<table class="table-hover table-striped table-active w-full text-xl text-left rtl:text-right text-gray-500 dark:text-gray-700" id="mark_sheet">
				<thead class="text-lg font-bold text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-gray-400 uppercase pb-5">
					<tr>
						<th rowspan="2" class="hidden-xs hidden-sm">#</th>
						<th rowspan="2" class="hidden-xs hidden-sm"><?php echo get_phrase('id');?></th>
						<th rowspan="2"><?php echo get_phrase('name');?></th>
						<th colspan="4" style="text-align: center; padding-top: 20px;">TASKS</th>
						
						<th rowspan="2" style="text-align: center;"><div class="transf lgt">Sub Total<br>(60)</div></th>
						<th rowspan="2" style="text-align: center;">50%<br>(A)</th>
						<th rowspan="2" style="text-align: center; "><div class="transf lgt whitespace-nowrap">Term Exam</div></th>
						<th rowspan="2" style="text-align: center;">50%<br>(B)</th>
						<th rowspan="2" style="text-align: center;">Total<br>(A+B)</th>
					</tr>
					<tr>						
						<th style="text-align: center; "><div class="transf whitespace-pre-wrap">Class Test<br>(20)</div></th>
						<th style="text-align: center; "><div class="transf lgt whitespace-pre-wrap">Group Work<br>(10)</div></th>
						<th style="text-align: center; "><div class="transf">Test 2<br>(20)</div></th>
						<th style="text-align: center; "><div class="transf">Project<br>(10)</div></th>
					</tr>
				</thead>
				<tbody>
				<?php
					$count = 1;
					$marks_of_students = $this->db->get_where('mark' , array(
						'class_id' => $class_id, 
							'section_id' => $section_id ,
								'year' => $running_year,
									 'term' => $running_term,
										'subject_id' => $subject_id,
											'exam_id' => $exam_id
					))->result_array();

					$students_counter = 0;

					foreach($marks_of_students as $row):
				?>
					<tr>
						<td class="hidden-xs hidden-sm"><?php echo $count++;?></td>

            <td class="hidden-xs hidden-sm whitespace-nowrap"><?php echo $this->db->get_where('student',array('student_id'=>$row['student_id']))->row()->student_code;?></td>

						<td class="whitespace-nowrap">
							<?php echo $this->db->get_where('student' , array('student_id' => $row['student_id']))->row()->name;?>
						</td>

						
							
							<td style="text-align: center">
								<input type="text" id="test1_<?php echo $row['student_id']; ?>" class="bg-gray-50 border border-gray-400 shadow-lg border-t-2 border-t-green-500 text-gray-900 rounded-lg focus:ring-primary-600 text-xl focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" name="test1_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['test1'];?>" max="20" onkeyup="update_sub_total()" onchange="update_sub_total()">
							</td>
							<td style="text-align: center">
								<input type="text" id="group_work_<?php echo $row['student_id']; ?>" class="bg-gray-50 border border-gray-400 shadow-lg border-t-2 border-t-green-500 text-gray-900 rounded-lg text-xl focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" name="group_work_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['group_work'];?>" max="10" onkeyup="update_sub_total()" onchange="update_sub_total()">
							</td>
							<td style="text-align: center">
								<input type="text" id="test2_<?php echo $row['student_id']; ?>" class="bg-gray-50 border border-gray-400 text-xl shadow-lg border-t-2 border-t-green-500 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" name="test2_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['test2'];?>" max="20" onkeyup="update_sub_total()" onchange="update_sub_total()">
							</td>
							<td style="text-align: center">
								<input type="text" id="project_<?php echo $row['student_id']; ?>" class="bg-gray-50 border border-gray-400 text-xl shadow-lg border-t-2 border-t-green-500 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" name="project_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['project'];?>" max="10" onkeyup="update_sub_total()" onchange="update_sub_total()">
							</td>
						

						<td style="text-align: center">
							<input type="text" id="sub_total_<?php echo $row['student_id']; ?>" class="bg-gray-300 border border-gray-400 shadow-lg border-t-2 border-t-gray-500 text-xl text-gray-600 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 cursor-not-allowed" name="sub_total_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['sub_total'];?>" onkeyup="update_total_score()" readonly>
						</td>

						<td style="text-align: center">
							<input type="text" id="class_score_<?php echo $row['student_id']; ?>" class="bg-gray-300 border border-gray-400 shadow-lg border-t-2 border-t-gray-500 text-xl text-gray-600 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 cursor-not-allowed class_score" name="class_score_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['class_score'];?>" max="50" readonly>
						</td>

						<td style="text-align: center">
							<input type="text" id="term_exam_<?php echo $row['student_id']; ?>" class="bg-gray-50 border border-gray-400 text-xl shadow-lg border-t-2 border-t-green-500 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500" name="term_exam_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['term_exam'];?>" onkeyup="update_exam_score()" onchange="update_exam_score()">
						</td>

						<td style="text-align: center">
							<input type="text" id="exam_score_<?php echo $row['student_id']; ?>"  class="bg-gray-300 border border-gray-400 shadow-lg border-t-2 border-t-gray-500 text-xl text-gray-600 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 cursor-not-allowed exam_score" name="exam_score_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['exam_score'];?>" max="50" readonly>
						</td>
						<td style="text-align: center">
							<span style="font-weight: bold";><input type="text" id="total_score_<?php echo $row['student_id']; ?>" class="bg-gray-300 border border-gray-400 shadow-lg border-t-2 border-t-gray-500 text-xl text-gray-600 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500 cursor-not-allowed" name="marks_obtained_<?php echo $row['mark_id'];?>"
								value="<?php echo $row['mark_obtained'];?>" readonly></span>	
						</td>

					</tr>


				<?php
				$students_counter++;
				 endforeach;?>
				</tbody>
			</table>

		<div class="flex justify-end p-10 sticky bottom-2 end-6  right-10" id="save_button">

			<?php
				echo get_button('submit', '<i class="entypo-floppy"></i> SAVE CHANGES', 'shadow-lg', 'submit_button', 'bg-green-500', 'bg-green-600');
			?>
		</div>
		<?php echo form_close();?>
		
	</div>
</div>





<script type="text/javascript">

	$(document).ready(function() {
		$('#mark_sheet').DataTable({
			pageLength: 100,
		});

		set_val();
		update_sub_total();
		//submit_form();

	});


		$('#mark_sheet_form').submit(function(event) {
			/* Act on the event */
			event.preventDefault();

			//Scroll to the top
      $('html, body').animate({
          scrollTop: ($('#top').offset().top )
      }, 1000);

      showAjaxModal_alert('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 0px; ">Please wait...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');

			$.ajax({
        url: '<?php echo site_url('admin/marks_update/'.$exam_id.'/'.$class_id.'/'.$section_id.'/'.$subject_id); ?>',
        type: 'POST',
	      dataType: 'html',
	      data: new FormData(this),
	      cache: false,
	      contentType: false,
	      processData: false
      })
      .done(function() {

          // Don't auto-close modal and don't auto-reload - we'll reload manually
          showAjaxModal_alert('Marks updated successfully. Please wait while page reloads...', 'Success', false, false);
          
          // Reload after 2 seconds - modal will stay visible
          setTimeout(() => {
              $('#subject_loader_form').submit();           
              //window.location.reload();
          }, 2000);
      })
      .fail(function(err) {
          showAjaxModal_alert(err.responseText, 'Error');
      });
			
		});


	function load_subjects() {
		$('#btn_marks').text('Loading...');
		$('#subject_loader_form').submit();
	}


	function set_val() {
		let students_counter = <?php echo $students_counter; ?>;

		let val1 = students_counter;
		$('#mark_sheet_length select').attr('id', 'show_val');
		$('#mark_sheet_length select').append('<option value="' + val1 + '"></option>');
		$('#mark_sheet_length select option[value=' + val1 + ']').attr('selected', 'selected').change();

		$('#mark_sheet_length select').attr('disabled', 'disabled');
		$('#mark_sheet_length select').change(function(event) {
			return false;
		});
	}

	function get_class_subject(class_id) {
	if (class_id !== '') {
	$.ajax({
            url: '<?php echo site_url('admin/marks_get_subject/');?>' + class_id ,
            cache: false,
            dataType: 'json',
            type: 'post',
            success: function(response)
            {
                if(response.section == 'creche') {
	            		jQuery('#subject_holder').html(response.subject);
	            	} else {

	            		$('#category_holder').slideUp('slow');
            			$('#category_holder').css('display', 'none');
            			$('#subject_holder2').removeClass('col-span-2');
            			jQuery('#section_id').html(response.section);
	                jQuery('#subject_id').html(response.subject);
	                $('#subject_id').select2();
	            	}
            }
        });
	  }
	}


	//update subtotal area on onkeydown event
	function update_sub_total(){
		
		var max_student_id = <?php echo $this->crud_model->get_max_student_id($class_id, $subject_id); ?>;
		

		for(var i = 1; i <= max_student_id; i++){
			var exam_score =  Number($("#exam_score_"+i).val());

			var test1       =  Number($("#test1_"+i).val());
			var group_work  =  Number($("#group_work_"+i).val());
			var test2       =  Number($("#test2_"+i).val());
			var project     =  Number($("#project_"+i).val());

			$("#sub_total_"+i).val(test1 + group_work + test2 + project);

			var sub_total = Number($("#sub_total_"+i).val());
			$("#class_score_"+i).val(Number(sub_total * 50 / 60).toFixed(2));

			var class_score =  Number($("#class_score_"+i).val());
			$("#total_score_" + i).val(class_score + exam_score);
		}
		
	}


	//update exam score area on onkeydown event
	function update_exam_score(){
		
		var max_student_id = <?php echo $this->crud_model->get_max_student_id($class_id, $subject_id); ?>;
		

		for(var i = 1; i <= max_student_id; i++){
			var class_score =  $("#class_score_"+i).val();
			class_score = Number(class_score);

			var term_exam = $("#term_exam_"+i).val();
				
				term_exam = Number(term_exam);
			
			$("#exam_score_" + i).val(term_exam / 2);

			var exam_score =  $("#exam_score_"+i).val();
			exam_score = Number(exam_score);

			$("#total_score_" + i).val(class_score + exam_score);
		}
		
	}

	//update total score area on onkeydown event
	function update_total_score(){
		
		var max_student_id = <?php echo $this->crud_model->get_max_student_id($class_id, $subject_id); ?>;

		for(var i = 1; i <= max_student_id; i++){
			var cs = $("#class_score_"+i).val();
			var es = $("#exam_score_"+i).val();
				cs = Number(cs);
				es = Number(es);
			
			$("#total_score_" + i).val(cs + es);
		}
		
	}

	$('#submit_button').click(function() {
		var max_student_id = <?php echo $this->crud_model->get_max_student_id($class_id, $subject_id); ?>;

		for (var i = 1; i <= max_student_id; i++) {

			//for column A
			if($('#class_score_'+i).val() > 50) {
				toastr.error('Each mark in column (A) must not be greater than 50.');
				showAjaxModal_alert('Each mark in column (A) must not be greater than 50.', 'Error');
				return false;
			}

			//for column project, group work and test 2
			if($('#project_'+i).val() > 10 || $('#group_work_'+i).val() > 10) {
				toastr.error('Each mark in columns (Project Work, Test 2 and Group Work) must not be greater than 10.');

				showAjaxModal_alert('Each mark in columns (Project Work, Test 2 and Group Work) must not be greater than 10.', 'Error');
				return false;
			}

			//for column class work
			if($('#test1_'+i).val() > 20 || $('#test2_'+i).val() > 20) {
				toastr.error('Each mark in column (Class Work and Test 2) must not be greater than 20.');
				showAjaxModal_alert('Each mark in column (Class Work and Test 2) must not be greater than 20.', 'Error');
				return false;
			}

			//for column B
			if($('#exam_score_'+i).val() > 50) {
				toastr.error('Each mark in column (B) must not be greater than 50.');
				showAjaxModal_alert('Each mark in column (B) must not be greater than 50.', 'Error');
				return false;
			}
		}
	})

	//ajax
$('#subject_loader_form').submit(function(event) {
	/* Act on the event */

	event.preventDefault();

	//Scroll to the top
  $('html, body').animate({
      scrollTop: ($('#top').offset().top )
  }, 1000);

	$('#main_page').empty();

	//SHOW LOADER
  $('#main_page').html('<center><div style="font-size: 20px; font-weight: bolder; margin-top: 200px; ">Fetching Data...<br><i class="fa fa-3x fa-spinner fa-pulse"></i></div></center>', 'Loading');


	$.ajax({
      url: '<?php echo site_url('admin/marks_selector/'); ?>',
      type: 'POST',
      dataType: 'html',
      data: new FormData(this),
      cache: false,
      contentType: false,
      processData: false
  })
  .done(function(data) {
  	if(data == 'no subject') {
  		showAjaxModal_alert('Please select subject for this class.', 'Error');


  		setTimeout(() => {
  			navigation('<?php echo site_url('admin/marks_selector'); ?>')
  		}, 5000);
      
  	} else if(data == 'no enrollment') {
  		showAjaxModal_alert('Make sure students were enrolled before proceeding. Try marking attendance first and try again.', 'Error');

  		

  		setTimeout(() => {
  			navigation('<?php echo site_url('admin/marks_selector'); ?>')
  		}, 5000);
      
  	} else {
  		$('#main_page').empty();
  		
  		navigation(data);
  	}
  });
});

	
</script>