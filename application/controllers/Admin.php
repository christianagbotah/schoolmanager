->update('user_permission');

			$updatedVal = $this->db->get_where('user_permission', ['permission_id' => $param2])->row()->permission_status;
			$ajaxData['updatedVal'] = $updatedVal;
			$ajaxData['message'] = 'Permission failed';

			if($updated) {
				$ajaxData['message'] = 'Permission successfully updated';
			}

			echo json_encode($ajaxData);
			return;
		}

		$page_data['page_name'] = 'permission_settings';
		$page_data['page_title'] = get_phrase('permission_settings');
		$page_data['admin_permissions'] = $this->db->get_where('user_permission', ['user_type' => 'admin'])->result_array();
		$page_data['teacher_permissions'] = $this->db->get_where('user_permission', ['user_type' => 'teacher'])->result_array();
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);

	}

	// update default controller
	function update_default_controller() {
		$status = $this->db->get_where('settings', array('type' => 'disable_frontend'))->row()->description;
		if ($status == 1) {
			$default_controller = 'login';
			$previous_default_controller = 'login';
		} else {
			$default_controller = 'login';
			$previous_default_controller = 'login';
		}
		// write routes.php
		$data = file_get_contents('./application/config/routes.php');
		$data = str_replace($previous_default_controller, $default_controller, $data);
		file_put_contents('./application/config/routes.php', $data);
	}

	//Payment settings
	function payment_settings($param1 = '', $param2 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$json_data = array();

		$this->load->library('form_validation');
		if ($param1 == 'hubtel_payment') {
			$fields = ['hubtel_payment_client_id', 'hubtel_payment_client_secret', 'hubtel_payment_merchant_number', 'hubtel_payment_enabled', 'hubtel_payment_test_mode'];
			
			foreach ($fields as $field) {
				$value = $this->input->post($field);
				if ($value !== null) {
					$this->db->where('type', $field)->update('settings', ['description' => $value]);
				}
			}
			
			$this->db->cache_delete();
			echo json_encode(['status' => 'success', 'message' => get_phrase('hubtel_payment_settings_updated')]);
			return;
		}

		if ($param1 == 'active_service') {

			$data['description'] = $this->input->post('active_payment_service');
			$this->db->where('type', 'active_payment_service');
			$this->db->update('settings', $data);

			$this->session->set_flashdata('flash_message', get_phrase('payment_settings_updated'));
			redirect(site_url('admin/payment_settings'));
		}

		$page_data['page_name'] = 'payment_settings';
		$page_data['page_title'] = get_phrase('payment_settings');
		$page_data['settings'] = $this->db->get('settings')->result_array();
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}
	/*function payment_settings($param1 = "") {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		if ($param1 == 'update_stripe_keys') {
			$this->crud_model->update_stripe_keys();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('payment_settings_updated'));
			redirect(site_url('admin/payment_settings'));
		}

		if ($param1 == 'update_paypal_keys') {
			$this->crud_model->update_paypal_keys();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('payment_settings_updated'));
			redirect(site_url('admin/payment_settings'));
		}
		if ($param1 == 'update_payumoney_keys') {
			$this->crud_model->update_payumoney_keys();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('payment_settings_updated'));
			redirect(site_url('admin/payment_settings'));
		}
		$page_data['page_name'] = 'payment_settings';
		$page_data['page_title'] = get_phrase('payment_settings');
		$page_data['settings'] = $this->db->get('settings')->result_array();
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}*/
	// FRONTEND

	function frontend_pages($param1 = '', $param2 = '', $param3 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}
		if ($param1 == 'events') {
			$page_data['page_content'] = 'frontend_events';
		}
		if ($param1 == 'gallery') {
			$page_data['page_content'] = 'frontend_gallery';
		}
		if ($param1 == 'privacy_policy') {
			$page_data['page_content'] = 'frontend_privacy_policy';
		}
		if ($param1 == 'about_us') {
			$page_data['page_content'] = 'frontend_about_us';
		}
		if ($param1 == 'terms_conditions') {
			$page_data['page_content'] = 'frontend_terms_conditions';
		}
		if ($param1 == 'homepage_slider') {
			$page_data['page_content'] = 'frontend_slider';
		}
		if ($param1 == '' || $param1 == 'general') {
			$page_data['page_content'] = 'frontend_general_settings';
		}
		if ($param1 == 'gallery_image') {
			$page_data['page_content'] = 'frontend_gallery_image';
			$page_data['gallery_id'] = $param2;
		}
		$page_data['page_name'] = 'frontend_pages';
		$page_data['page_title'] = get_phrase('pages');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function frontend_events($param1 = '', $param2 = '') {
		if ($param1 == 'add_event') {
			$this->frontend_model->add_event();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('event_added_successfully'));
			redirect(site_url('admin/frontend_pages/events'));
		}
		if ($param1 == 'edit_event') {
			$this->frontend_model->edit_event($param2);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('event_updated_successfully'));
			redirect(site_url('admin/frontend_pages/events'));
		}
		if ($param1 == 'delete') {
			$this->frontend_model->delete_event($param2);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('event_deleted'));
			redirect(site_url('admin/frontend_pages/events'));
		}
	}

	function frontend_gallery($param1 = '', $param2 = '', $param3 = '') {
		if ($param1 == 'add_gallery') {
			$this->frontend_model->add_gallery();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('gallery_added_successfully'));
			redirect(site_url('admin/frontend_pages/gallery'));
		}
		if ($param1 == 'edit_gallery') {
			$this->frontend_model->edit_gallery($param2);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('gallery_updated_successfully'));
			redirect(site_url('admin/frontend_pages/gallery'));
		}
		if ($param1 == 'upload_images') {
			$this->frontend_model->add_gallery_images($param2);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('images_uploaded'));
			redirect(site_url('admin/frontend_pages/gallery_image/' . $param2));
		}
		if ($param1 == 'delete_image') {
			$this->frontend_model->delete_gallery_image($param2);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('images_deleted'));
			redirect(site_url('admin/frontend_pages/gallery_image/' . $param3));
		}

	}

	function frontend_news($param1 = '', $param2 = '') {
		if ($param1 == 'add_news') {
			$this->frontend_model->add_news();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('news_added_successfully'));
			redirect(site_url('admin/frontend_pages/news'));
		}
		if ($param1 == 'edit_news') {

		}
		if ($param1 == 'delete') {
			$this->frontend_model->delete_news($param2);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('news_was_deleted'));
			redirect(site_url('admin/frontend_pages/news'));
		}
	}

	function frontend_settings($task) {
		if ($task == 'update_terms_conditions') {
			$this->frontend_model->update_terms_conditions();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('terms_updated'));
			redirect(site_url('admin/frontend_pages/terms_conditions'));
		}
		if ($task == 'update_about_us') {
			$this->frontend_model->update_about_us();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('about_us_updated'));
			redirect(site_url('admin/frontend_pages/about_us'));
		}
		if ($task == 'update_privacy_policy') {
			$this->frontend_model->update_privacy_policy();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('privacy_policy_updated'));
			redirect(site_url('admin/frontend_pages/privacy_policy'));
		}
		if ($task == 'update_general_settings') {
			$this->frontend_model->update_frontend_general_settings();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('general_settings_updated'));
			redirect(site_url('admin/frontend_pages/general'));
		}
		if ($task == 'update_slider_images') {
			$this->frontend_model->update_slider_images();

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('slider_images_updated'));
			redirect(site_url('admin/frontend_pages/homepage_slider'));
		}
	}

	function frontend_themes() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}
		$page_data['page_name'] = 'frontend_themes';
		$page_data['page_title'] = get_phrase('themes');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// FRONTEND

	function get_session_changer() {
		$this->load->view('backend/admin/change_session');
	}

	function get_term_changer() {
		$this->load->view('backend/admin/change_term');
	}

	function get_sem_changer() {
		$this->load->view('backend/admin/change_sem');
	}

	function change_session($from_term='', $enroll='', $confirm='no') {

		$ajax_data = [];
		set_time_limit(0);
		ob_implicit_flush(true);
		ob_end_flush();

		if($from_term == 'yes') {

			$running_year = explode('-', get_settings('running_year'));
			$next_year1 = $running_year[0] + 1;
			$next_year2 = $running_year[1] + 1;
			$data['description'] = $next_year1 .'-'. $next_year2;

			if($enroll == 'enroll') {
				//user wants a new enrollment into Academic year and term
				//let's find out if students were promoted from the third term, else we deny
				
				//if use wants to still proceed anyway or not
				if($confirm == 'no') {
					$students_enrolled = $this->crud_model->students_enrolled($data['description'], $this->input->post('running_term')); //if false, it returns array of those classes ids
				} else {
					$students_enrolled = true;
				}


				if(is_array($students_enrolled)) {

					for($i = 0; $i < sizeof($students_enrolled); $i++) {
						$sectionId = $this->crud_model->get_class_section($students_enrolled[$i]);
						$className[] = getFullClassName($students_enrolled[$i], $sectionId);
					}
					//terminate the code
					$ajax_data['success'] = false;
					$ajax_data['message'] = 'Operation failed. Promotion not done yet. Make sure promotion is done to all the classes.<br/>Check the following classe(s):<br/><hr><p class="mt-3">'.implode(', ', $className).'</p> <div class="p-5 row"><button type="button" class="btn btn-sm btn-success pull-right mr-4" onclick="startWork(1, \''.site_url('admin/change_session/yes/enroll/yes').'\')">Proceed anyway</button></div>';
					echo json_encode($ajax_data);
					return false;
				}

				//we do the work now
				$this->db->where('year', $data['description']);//we generate new year
			} else {
				$this->db->where('year', get_settings('running_year')); //we use the current year
			}
			
			$this->db->where('term', $this->input->post('running_term'));
      $term_row = $this->db->get('enroll')->num_rows();

      if($term_row > 0) {
      	$ajax_data['message'] = 'Changing term from Term '. get_settings('running_term'). ' to Term '. $this->input->post('running_term');
				echo json_encode($ajax_data);
				sleep(3);

				
      	$data_term['description'] = $this->input->post('running_term');
      	$this->db->where('type', 'running_term');
        $this->db->update('settings', $data_term);

        $ajax_data['success'] = true;
				$ajax_data['message'] = 'Term changed successfully';
				echo json_encode($ajax_data);
				return false;
      }
		} else {
			$data['description'] = $this->input->post('running_year');
		}

		
		$selected_academic_year = $data['description'];
		$prev_academic_year = get_settings('running_year');
		$ajax_data['message'] = 'Changing Academic Year from '.$prev_academic_year.' to '. $selected_academic_year;
		echo json_encode($ajax_data);
		sleep(3);
		

		//try to update the term as well - compare the ending years
		$selected_year_parts = explode('-', $selected_academic_year);
		$prev_year_parts = explode('-', $prev_academic_year);
		if(intval($prev_year_parts[1]) > intval($selected_year_parts[1])) {
			//if the previous year is greater than the selected year, then the user is just 
			//trying to go back to old records, so no need to do any other updates

			//but let's also check if the selected year ever exists in the database
			$this->db->where('year', $data['description']);
      $year_row_query = $this->db->get('enroll');
      $year_row = $year_row_query->num_rows();

      if($year_row > 0) {

      	$update_term = false; //update update the year
      	
      } else {
      	$update_term = 'year not found'; //year selected never exists, no update will be effected
      }	
			
		} else {

			$update_term = $this->crud_model->automateNextTerm($data['description'], $confirm);
		}

		 if($update_term == false) {
			$this->db->where('type', 'running_year');
			$this->db->update('settings', $data);

			//check if the current term and year exist in the enroll table
			$num_rows = year_term_exist(get_settings('running_year'), get_settings('running_term'));
			if($num_rows < 1) {
				$data_term['description'] = $this->db->get_where('enroll', ['year' => get_settings('running_year')])->last_row()->term;
				$this->db->where('type', 'running_term');
				$this->db->update('settings', $data_term);
			}
			//clear the cached database
			$this->db->cache_delete();


			$ajax_data['success'] = 1;
			$ajax_data['message'] = 'Academic year changed successfully';
			echo json_encode($ajax_data);
			return false;

			// $this->session->set_flashdata("error_message", "Invalid year selected! You cannot change year in this term");
			// redirect(site_url('admin/dashboard'));
		} else if($update_term == 'not_enrolled') {

			

			$students_enrolled = $this->crud_model->students_enrolled($data['description'], 1); //if false, it returns array of those classes ids

				for($i = 0; $i < sizeof($students_enrolled); $i++) {
					$sectionId = $this->crud_model->get_class_section($students_enrolled[$i]);
					$className[] = getFullClassName($students_enrolled[$i], $sectionId);
				}

				
				$yes = 'yes';
				//terminate the code
				$ajax_data['success'] = false;
				$ajax_data['message'] = 'Operation failed. Promotion not done yet. Make sure promotion is done to all the classes.<br/>Check the following classe(s):<br/><hr><p class="mt-3">'.implode(', ', $className).'</p> <div class="p-5 row"><input type="hidden" name="running_year" value="'.$data['description'].'"><button type="button" onclick="formSubmitted(\''.$yes.'\')" class="btn btn-sm btn-success pull-right mr-4">Proceed anyway</button>
				</div>
				';

				echo json_encode($ajax_data);
				return false;
				

		} else if($update_term == 'invalid year') {

			$this->db->cache_delete();

			$ajax_data['success'] = false;
			$ajax_data['message'] = 'Invalid year selected! The selected year is not consecutive with previous year. Select the year next to the last academic you ran!';
			echo json_encode($ajax_data);
			return false;

			// $this->session->set_flashdata("error_message", "Invalid year selected! You cannot change year in this term");
			// redirect(site_url('admin/dashboard'));
 
		} else if($update_term == 'year not found') {

			$this->db->cache_delete();

			$ajax_data['success'] = false;
			$ajax_data['message'] = 'Invalid year selected! Your selected year does not exist in your database!';
			echo json_encode($ajax_data);
			return false;

			// $this->session->set_flashdata("error_message", "Invalid year selected! You cannot change year in this term");
			// redirect(site_url('admin/dashboard'));

		} else if($update_term == 'year not allowed') {

			$this->db->cache_delete();

			$ajax_data['success'] = false;
			$ajax_data['message'] = 'Operation terminated! You cannot change year in this term';
			echo json_encode($ajax_data);
			return false;

			// $this->session->set_flashdata("error_message", "Invalid year selected! You cannot change year in this term");
			// redirect(site_url('admin/dashboard'));

		} else { //doing update only if a valid year is selected
			$this->db->where('type', 'running_year');
			$this->db->update('settings', $data);

			$ajax_data['message'] = 'Academic year updated successfully';
			echo json_encode($ajax_data);
			sleep(3);

			$ajax_data['message'] = 'Trying to update the term';
			echo json_encode($ajax_data);
			sleep(3);

			$ajax_data['message'] = 'Academic term updated successfully';
			echo json_encode($ajax_data);
			sleep(3);

			$ajax_data['message'] = 'System is attempting to enroll students for the term';
			echo json_encode($ajax_data);
			sleep(3);
		

			//we do few entries for this year and this term
			//enroll students for this term
			$enrollment_is_done = $this->crud_model->termlyEnrollment($update_term, $data['description']);

			if($enrollment_is_done == true){
				$ajax_data['message'] = 'Students enrollment successful';
				echo json_encode($ajax_data);
				sleep(3);
				
			}else if($enrollment_is_done == false) {

				$ajax_data['message'] = 'Students enrollment failed. Students already enrolled for this term.';
				echo json_encode($ajax_data);
				sleep(3);

			} else {
				$ajax_data['message'] = 'Students enrollment failed. Not allowed for the selected term.';
				echo json_encode($ajax_data);
				sleep(3);

			} 

			$ajax_data['message'] = 'System attempting to enroll subjects';
			echo json_encode($ajax_data);
			sleep(1);

			//add subjects for this year
			$creche_subject = $this->crud_model->do_subjects_import_mass_creche(); //for creche
			$all_subjects = $this->crud_model->do_subjects_import_mass(); //for the other classes

			if($all_subjects != 'error') {
				$ajax_data['message'] = 'Subjects were successfully enrolled';
				echo json_encode($ajax_data);
				sleep(3);

			} else {
				$ajax_data['message'] = 'Unable to enroll subjects. They may have already been enrolled for this year';
				echo json_encode($ajax_data);
				sleep(3);
			}

			$addExams = $this->crud_model->addExams($update_term, $data['description']); //for the other classes

			if($addExams) {
				$ajax_data['message'] = 'Examinations were successfully added';
				echo json_encode($ajax_data);
				sleep(3);

			} else {
				$ajax_data['message'] = 'Unable to add exams. They may have already been added for this term';
				echo json_encode($ajax_data);
				sleep(3);
			}

			// Copy daily fee rates from previous year/term if not exists
			$ajax_data['message'] = 'Checking daily fee rates for the new academic year';
			echo json_encode($ajax_data);
			sleep(2);
			
			$new_year = $data['description'];
			$new_term = $update_term;
			
			// Check if rates exist for new year/term
			$rates_exist = $this->db->where('year', $new_year)
				->where('term', $new_term)
				->count_all_results('daily_fee_rates');
			
			if($rates_exist == 0) {
				$ajax_data['message'] = 'Daily fee rates not found. Copying from previous session...';
				echo json_encode($ajax_data);
				sleep(2);
				
				// Get previous year and term (term 3 of previous year)
				$prev_year_parts = explode('-', $new_year);
				$prev_year = ($prev_year_parts[0] - 1) . '-' . ($prev_year_parts[1] - 1);
				$prev_term = 3; // Always copy from term 3 when changing year
				
				$previous_rates = $this->db->where('year', $prev_year)
					->where('term', $prev_term)
					->get('daily_fee_rates')
					->result_array();
				
				if(!empty($previous_rates)) {
					$copied = 0;
					foreach($previous_rates as $rate) {
						$new_rate = [
							'class_id' => $rate['class_id'],
							'feeding_rate' => $rate['feeding_rate'],
							'breakfast_rate' => $rate['breakfast_rate'],
							'classes_rate' => $rate['classes_rate'],
							'water_rate' => $rate['water_rate'],
							'breakfast_enabled' => $rate['breakfast_enabled'],
							'water_enabled' => $rate['water_enabled'],
							'year' => $new_year,
							'term' => $new_term,
							'created_at' => time(),
							'updated_at' => time()
						];
						$this->db->insert('daily_fee_rates', $new_rate);
						$copied++;
					}
					
					$ajax_data['message'] = "Daily fee rates copied successfully ($copied classes)";
					echo json_encode($ajax_data);
					sleep(2);
				} else {
					$ajax_data['message'] = 'No previous rates found to copy. Please set rates manually.';
					echo json_encode($ajax_data);
					sleep(2);
				}
			} else {
				$ajax_data['message'] = 'Daily fee rates already exist for this session';
				echo json_encode($ajax_data);
				sleep(2);
			}

			//clear the cached database
			$this->db->cache_delete();
			
			$ajax_data['success'] = true;
			$ajax_data['message'] = 'Current Academic year is set to '.$data['description'].' and Term is '.$update_term;
			echo json_encode($ajax_data);
			return false;

			// $this->session->set_flashdata('flash_message', get_phrase('session_year_changed_successfully'));
			// redirect(site_url('admin/dashboard'));
		}

	}

	function year_term_exist($year, $term) {
		echo year_term_exist($year, $term);
	}

	function change_term($enroll = '') {
		$ajax_data = [];
		set_time_limit(0);
		ob_implicit_flush(true);
		ob_end_flush();

		$data['description'] = $this->input->post('running_term');
		$ajax_data['message'] = 'Changing term from Term '. get_settings('running_term'). ' to Term '. $data['description'];
		echo json_encode($ajax_data);
		sleep(3);

		//direct change of term for new academic term
		if($enroll == 'yes') {

			//if we are currently running in term one and the user mistakenly selects term 3 for enrollment, let's reject it
			if($data['description'] == 3) {
				$last_term = $this->db->get_where('enroll', ['year' => get_settings('running_year'), 'mute' => '0'])->last_row()->term;

				if($last_term != 2) {
					$ajax_data['message'] = 'Operation terminated. You are currently running term '.$last_term.' so change term to 2 instead of 3.';
	        $ajax_data['success'] = false;
					echo json_encode($ajax_data);
					return false;
				}
			}
			/*before we proceed, let's compare the current date with the vacation date for the running term and see if user is allowed to change the term, maybe the user made a mistake by selecting this option*/
			$running_term_ending = get_settings('term_ending');
			$running_term_ending_timestamp = strtotime($running_term_ending);
			$today_timestamp = strtotime('today');

      if($today_timestamp < $running_term_ending_timestamp) {
        //ooopz, this term seems not to have ended yet, so reject update
        $ajax_data['message'] = 'Operation terminated. Term '.get_settings('running_term').' is still in progress. Wait till the end of the term before you change it to a new term!';
        $ajax_data['success'] = false;
				echo json_encode($ajax_data);
				return false;
      } 

			$this->db->where('type', 'running_term');
			$this->db->update('settings', $data);

			$ajax_data['success'] = true;
			$ajax_data['message'] = 'Term updated successfully';
			echo json_encode($ajax_data);

			sleep(2);



			$ajax_data['message'] = 'System attempting to enroll students for this term';
			echo json_encode($ajax_data);
			sleep(2);
			//enroll students for this term
			$enrollment_is_done = $this->crud_model->termlyEnrollment($data['description'], get_settings('running_year'));

			if($enrollment_is_done == true){
				$ajax_data['message'] = 'Students enrollment successful';
				echo json_encode($ajax_data);
				sleep(3);
				
			}else if($enrollment_is_done == false) {

				$ajax_data['message'] = 'Students enrollment failed. Students already enrolled for this term.';
				echo json_encode($ajax_data);
				sleep(3);

			} else {
				$ajax_data['message'] = 'Students enrollment failed. Not allowed for the selected term.';
				echo json_encode($ajax_data);
				sleep(3);

			} 

			$ajax_data['message'] = 'System attempting to enroll subjects';
			echo json_encode($ajax_data);
			sleep(1);

			//add subjects for this year
			$creche_subject = $this->crud_model->do_subjects_import_mass_creche('yes'); //for creche
			$all_subjects = $this->crud_model->do_subjects_import_mass('yes'); //for the other classes

			if($all_subjects != 'error') {
				$ajax_data['message'] = 'Subjects were successfully enrolled';
				echo json_encode($ajax_data);
				sleep(3);

			} else {
				$ajax_data['message'] = 'Unable to enroll some subjects. They may have already been enrolled for this year';
				echo json_encode($ajax_data);
				sleep(3);
			}

			$ajax_data['message'] = 'System attempting to add examinations for the term';
				echo json_encode($ajax_data);
				sleep(2);
			$addExams = $this->crud_model->addExams($data['description'], get_settings('running_year')); //for the other classes

			if($addExams) {
				$ajax_data['message'] = 'Examinations were successfully added';
				echo json_encode($ajax_data);
				sleep(3);

			} else {
				$ajax_data['message'] = 'Unable to add exams. They may have already been added for this term';
				echo json_encode($ajax_data);
				sleep(3);
			}

			// Copy daily fee rates from previous term if not exists
			$ajax_data['message'] = 'Checking daily fee rates for the new term';
			echo json_encode($ajax_data);
			sleep(2);
			
			$new_term = $data['description'];
			$running_year = get_settings('running_year');
			
			// Check if rates exist for new term
			$rates_exist = $this->db->where('year', $running_year)
				->where('term', $new_term)
				->count_all_results('daily_fee_rates');
			
			if($rates_exist == 0) {
				$ajax_data['message'] = 'Daily fee rates not found for new term. Copying from previous term...';
				echo json_encode($ajax_data);
				sleep(2);
				
				// Get previous term
				$prev_term = $new_term - 1;
				if($prev_term < 1) {
					// If new term is 1, get from term 3 of previous year
					$prev_year_parts = explode('-', $running_year);
					$prev_year = ($prev_year_parts[0] - 1) . '-' . ($prev_year_parts[1] - 1);
					$prev_term = 3;
					
					$previous_rates = $this->db->where('year', $prev_year)
						->where('term', $prev_term)
						->get('daily_fee_rates')
						->result_array();
				} else {
					$previous_rates = $this->db->where('year', $running_year)
						->where('term', $prev_term)
						->get('daily_fee_rates')
						->result_array();
				}
				
				if(!empty($previous_rates)) {
					$copied = 0;
					foreach($previous_rates as $rate) {
						$new_rate = [
							'class_id' => $rate['class_id'],
							'feeding_rate' => $rate['feeding_rate'],
							'breakfast_rate' => $rate['breakfast_rate'],
							'classes_rate' => $rate['classes_rate'],
							'water_rate' => $rate['water_rate'],
							'breakfast_enabled' => $rate['breakfast_enabled'],
							'water_enabled' => $rate['water_enabled'],
							'year' => $running_year,
							'term' => $new_term,
							'created_at' => time(),
							'updated_at' => time()
						];
						$this->db->insert('daily_fee_rates', $new_rate);
						$copied++;
					}
					
					$ajax_data['message'] = "Daily fee rates copied successfully ($copied classes)";
					echo json_encode($ajax_data);
					sleep(2);
				} else {
					$ajax_data['message'] = 'No previous rates found to copy. Please set rates manually.';
					echo json_encode($ajax_data);
					sleep(2);
				}
			} else {
				$ajax_data['message'] = 'Daily fee rates already exist for this term';
				echo json_encode($ajax_data);
				sleep(2);
			}

		} else {
			//user moving to previous records
				$term_exists_row = $this->db->get_where('enroll', ['term' => $data['description'], 'year' => get_settings('running_year')])->num_rows();

				if($term_exists_row > 0) {

					$this->db->where('type', 'running_term');
					$this->db->update('settings', $data);

					$ajax_data['success'] = true;
					$ajax_data['message'] = 'Term updated successfully';
					echo json_encode($ajax_data);
					return false;
				} else {

					$this->db->where('type', 'running_term');
					$this->db->update('settings', $data);

					$ajax_data['success'] = true;
					$ajax_data['message'] = 'Term updated successfully';
					echo json_encode($ajax_data);
					sleep(2);
				}
			}

		//clear the cached database
		$this->db->cache_delete();
		
		$ajax_data['success'] = true;
		$ajax_data['message'] = 'Term updated successfully';
		echo json_encode($ajax_data);
		return false;

		
	}

	function change_sem() {
		$data['description'] = $this->input->post('running_sem');
		$this->db->where('type', 'running_sem');
		$this->db->update('settings', $data);

		//clear the cached database
		$this->db->cache_delete();

		$this->session->set_flashdata('flash_message', get_phrase('semester_changed_successfully'));
		redirect(site_url('admin/dashboard'));
	}

	/***** UPDATE PRODUCT *****/

	function update($task = '', $purchase_code = '') {

		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		// Create update directory.
		$dir = 'update';
		if (!is_dir($dir)) {
			mkdir($dir, 0777, true);
		}

		$zipped_file_name = $_FILES["file_name"]["name"];
		$path = 'update/' . $zipped_file_name;

		move_uploaded_file($_FILES["file_name"]["tmp_name"], $path);

		// Unzip uploaded update file and remove zip file.
		$zip = new ZipArchive;
		$res = $zip->open($path);
		if ($res === TRUE) {
			$zip->extractTo('update');
			$zip->close();
			unlink($path);
		}

		$unzipped_file_name = substr($zipped_file_name, 0, -4);
		$str = file_get_contents('./update/' . $unzipped_file_name . '/update_config.json');
		$json = json_decode($str, true);

		// Run php modifications
		require './update/' . $unzipped_file_name . '/update_script.php';

		// Create new directories.
		if (!empty($json['directory'])) {
			foreach ($json['directory'] as $directory) {
				if (!is_dir($directory['name'])) {
					mkdir($directory['name'], 0777, true);
				}

			}
		}

		// Create/Replace new files.
		if (!empty($json['files'])) {
			foreach ($json['files'] as $file) {
				copy($file['root_directory'], $file['update_directory']);
			}

		}

		$this->session->set_flashdata('flash_message', get_phrase('product_updated_successfully'));
		redirect(site_url('admin/system_settings'));
	}

	/*****SMS SETTINGS*********/
	function sms_settings($param1 = '', $param2 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$json_data = array();

		$this->load->library('form_validation');
		if ($param1 == 'hubtel-sms') {

			$this->form_validation->set_rules('hubtel_sender', 'Hubtel Sender ID', 'required|max_length[11]');
			$this->form_validation->set_rules('hubtel_client_id', 'Hubtel Client ID', 'required');
			$this->form_validation->set_rules('hubtel_client_secret', 'Hubtel Client Secret', 'required');

			if ($this->form_validation->run() === FALSE) {
				//redirect(site_url('admin/sms_settings'));
				$json_data['message'] = 'Some fields were not filled properly.';

				echo json_encode($json_data);
				return false;
			} else {
				$data['description'] = $this->input->post('hubtel_sender');
				$this->db->where('type', 'hubtel_sender');
				$this->db->update('settings', $data);

				$data['description'] = $this->input->post('hubtel_client_id');
				$this->db->where('type', 'hubtel_client_id');
				$this->db->update('settings', $data);

				$data['description'] = $this->input->post('hubtel_client_secret');
				$this->db->where('type', 'hubtel_client_secret');
				$this->db->update('settings', $data);

				//clear the cached database
				$this->db->cache_delete();

				$json_data['message'] = 1; //success

				echo json_encode($json_data);
				return false;

			}

		}

		if ($param1 == 'twilio') {

			$data['description'] = $this->input->post('twilio_account_sid');
			$this->db->where('type', 'twilio_account_sid');
			$this->db->update('settings', $data);

			$data['description'] = $this->input->post('twilio_auth_token');
			$this->db->where('type', 'twilio_auth_token');
			$this->db->update('settings', $data);

			$data['description'] = $this->input->post('twilio_sender_phone_number');
			$this->db->where('type', 'twilio_sender_phone_number');
			$this->db->update('settings', $data);

			$this->session->set_flashdata('flash_message', get_phrase('data_updated'));
			redirect(site_url('admin/sms_settings'));
		}
		if ($param1 == 'msg91') {

			$data['description'] = $this->input->post('authentication_key');
			$this->db->where('type', 'msg91_authentication_key');
			$this->db->update('settings', $data);

			$data['description'] = $this->input->post('sender_ID');
			$this->db->where('type', 'msg91_sender_ID');
			$this->db->update('settings', $data);

			$data['description'] = $this->input->post('msg91_route');
			$this->db->where('type', 'msg91_route');
			$this->db->update('settings', $data);

			$data['description'] = $this->input->post('msg91_country_code');
			$this->db->where('type', 'msg91_country_code');
			$this->db->update('settings', $data);

			$this->session->set_flashdata('flash_message', get_phrase('data_updated'));
			redirect(site_url('admin/sms_settings'));
		}

		if ($param1 == 'active_service') {

			$data['description'] = $this->input->post('active_sms_service');
			$this->db->where('type', 'active_sms_service');
			$this->db->update('settings', $data);

			$this->session->set_flashdata('flash_message', get_phrase('data_updated'));
			redirect(site_url('admin/sms_settings'));
		}
		
		if ($param1 == 'attendance_sms') {
			$value = $this->input->post('send_attendance_sms');
			$exists = $this->db->get_where('settings', ['type' => 'send_attendance_sms'])->num_rows();
			if($exists) {
				$this->db->where('type', 'send_attendance_sms');
				$this->db->update('settings', ['description' => $value]);
			} else {
				$this->db->insert('settings', ['type' => 'send_attendance_sms', 'description' => $value]);
			}
			echo json_encode(['status' => 'success', 'message' => get_phrase('data_updated')]);
			return;
		}

		$page_data['page_name'] = 'sms_settings';
		$page_data['page_title'] = get_phrase('sms_settings');
		$page_data['settings'] = $this->db->get('settings')->result_array();
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	/*****LANGUAGE SETTINGS*********/
	function manage_language($param1 = '', $param2 = '', $param3 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if ($param1 == 'edit_phrase') {
			$page_data['edit_profile'] = $param2;
		}
		if ($param1 == 'update_phrase') {
			$language = $param2;
			$total_phrase = $this->input->post('total_phrase');
			for ($i = 1; $i < $total_phrase; $i++) {
				//$data[$language]  =   $this->input->post('phrase').$i;
				$this->db->where('phrase_id', $i);
				$this->db->update('language', array($language => $this->input->post('phrase' . $i)));
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/manage_language/edit_phrase/' . $language));
		}
		if ($param1 == 'do_update') {
			$language = $this->input->post('language');
			$data[$language] = $this->input->post('phrase');
			$this->db->where('phrase_id', $param2);
			$this->db->update('language', $data);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('settings_updated'));
			redirect(site_url('admin/manage_language'));
		}
		if ($param1 == 'add_phrase') {
			$data['phrase'] = $this->input->post('phrase');
			$this->db->insert('language', $data);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('settings_updated'));
			redirect(site_url('admin/manage_language'));
		}
		if ($param1 == 'add_language') {
			$language = $this->input->post('language');
			$this->load->dbforge();
			$fields = array(
				$language => array(
					'type' => 'LONGTEXT',
				),
			);
			$this->dbforge->add_column('language', $fields);

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('settings_updated'));
			redirect(site_url('admin/manage_language'));
		}
		if ($param1 == 'delete_language') {
			$language = $param2;
			$this->load->dbforge();

			//clear the cached database
			$this->db->cache_delete();

			$this->dbforge->drop_column('language', $language);
			$this->session->set_flashdata('flash_message', get_phrase('settings_updated'));

			redirect(site_url('admin/manage_language'));
		}
		$page_data['page_name'] = 'manage_language';
		$page_data['page_title'] = get_phrase('manage_language');
		//$page_data['language_phrases'] = $this->db->get('language')->result_array();
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	/******MANAGE OWN PROFILE AND CHANGE PASSWORD***/
	function manage_profile($param1 = '', $param2 = '', $param3 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));
		
		// Handle form submissions
		if ($param1 == 'update_profile_info') {
			$data['name'] = strtoupper($this->input->post('name'));
			$data['email'] = strtolower($this->input->post('email'));

			$this->load->helper('email');
			if (!valid_email($data['email'])) {
				$this->session->set_flashdata('error_message', 'Invalid Email Found!');
				redirect(site_url('admin/manage_profile'));
				return;
			}

			$admin_id = $param2;

			$validation = email_validation_for_edit($data['email'], $admin_id, 'admin');
			if ($validation == 1) {
				$this->db->where('admin_id', $this->session->userdata('admin_id'));
				$this->db->update('admin', $data);
				move_uploaded_file($_FILES['userfile']['tmp_name'], 'uploads/admin_image/' . $this->session->userdata('admin_id') . '.jpg');
				$this->session->set_flashdata('flash_message', get_phrase('account_updated'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('this_email_id_is_not_available'));
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/manage_profile'));
			return;
		}
		if ($param1 == 'change_password') {
			$data['password'] = $this->input->post('password');
			$data['new_password'] = password_hash($this->input->post('new_password'), PASSWORD_BCRYPT);
			$data['confirm_new_password'] = $this->input->post('confirm_new_password');

			$current_password = $this->db->get_where('admin', array(
				'admin_id' => $this->session->userdata('admin_id'),
			))->row()->password;
			if (password_verify($data['password'], $current_password) == 1 && password_verify($data['confirm_new_password'], $data['new_password']) == 1) {

				$this->db->where('admin_id', $this->session->userdata('admin_id'));
				$this->db->update('admin', array(
					'password' => $data['new_password'],
				));

				$message = 'You have changed your password. Your current password is: ' . $this->input->post('new_password');

				$phone = $this->db->get_where('admin', array(
					'admin_id' => $this->session->userdata('admin_id'),
				))->row()->phone;
				$data_sms['phone'] = $phone;

				$email = $this->db->get_where('admin', array(
					'admin_id' => $this->session->userdata('admin_id'),
				))->row()->email;

				//send sms first
				$active_sms_service = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row()->description;
				if ($active_sms_service != 'disabled') {
					//$this->sms_model->send_sms($message, $data_sms['phone']);
				}

				//send email now
				$this->email_model->password_changed_email($this->input->post('new_password'), 'admin', $email);

				$this->session->set_flashdata('flash_message', get_phrase('password_updated_successfully'));

				//destroy current session
				$this->session->sess_destroy();
				redirect(site_url('login')); //redirect to the login portal
			} else {
				$this->session->set_flashdata('error_message', get_phrase('password_mismatch!'));
			}
			return;
		}
		
		// Get admin code from session and redirect to unified staff details page
		$admin_id = $this->session->userdata('admin_id');
		$admin_data = $this->db->get_where('admin', array('admin_id' => $admin_id))->row();
		
		if (empty($admin_data)) {
			$this->session->set_flashdata('error_message', get_phrase('admin_not_found'));
			redirect(site_url('admin/dashboard'));
			return;
		}
		
		// Redirect to unified staff details page using ID
		redirect(site_url('admin/admin_details/'.$admin_data->admin_id));
	}

	/******VIEW ADMIN PROFILE***/
	function admin_profile($admin_id = '') {
		// Validate admin_id parameter
		if (empty($admin_id) || !is_numeric($admin_id)) {
			$this->session->set_flashdata('error_message', get_phrase('invalid_admin_id'));
			redirect(site_url('admin/admins'));
			return;
		}

		// Redirect to new ID-based admin details page
		redirect(site_url('admin/admin_details/'.$admin_id));
	}

	// VIEW QUESTION PAPERS
	function question_paper($param1 = "", $param2 = "") {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$data['page_name'] = 'question_paper';
		$data['page_title'] = get_phrase('question_paper');
		$this->load->view('backend/main', $data);
	}

	// MANAGE LIBRARIANS
	function librarian($param1 = '', $param2 = '', $param3 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if ($param1 == 'create') {
			$data['name'] = trim(strtoupper($this->input->post('name')));
			$data['email'] = trim(strtolower($this->input->post('email')));
			$data['phone'] = trim($this->input->post('phone')[0]);
			$data['password'] = password_hash($this->input->post('password'), PASSWORD_BCRYPT);

			$this->form_validation->set_rules('password', 'Password', 'trim|min_length[6]');
			$this->form_validation->set_rules('phone', 'Phone', 'trim|min_length[10]');
			$this->form_validation->set_rules('address', 'Name', 'trim|required');

			if ($this->form_validation->run() === FALSE) {
				$this->load->view('backend/admin/librarian');
			}

			$data['authentication_key'] = substr(sha1(md5(mt_rand(1004200000, 1009999999))), 0, 5);

			$this->load->helper('email');
			if (!valid_email($data['email'])) {
				$this->session->set_flashdata('error_message', 'Invalid Email Found!');
				redirect(site_url('admin/librarian'));
			}

			$validation = email_validation($data['email']);
			if ($validation == 1) {
				$this->db->insert('librarian', $data);
				$this->session->set_flashdata('flash_message', get_phrase('data_added_successfully'));
				$this->email_model->account_opening_email('librarian', $data['email'], $this->input->post('password'), $data['authentication_key']); //SEND EMAIL ACCOUNT OPENING EMAIL

				//send sms
				$system_name = $this->db->get_where('settings', array('type' => 'system_name'))->row()->description;
				$active_sms_service = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row()->description;
				if ($active_sms_service != 'disabled') {
					$account_opening_sms = 'Welcome to ' . $system_name . '. Your account type is Librarian. Here are your login credentials; Your Username: ' . $data['email'] . ', Password: ' . $this->input->post('password') . ' and Authentication Key: ' . $data['authentication_key'] . '. Thank you.';

					$this->sms_model->send_sms($account_opening_sms, $data['phone']);
				} //SEND SMS ENDED
			} else {
				$this->session->set_flashdata('error_message', get_phrase('this_email_id_is_not_available'));
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/librarian'));
		}

		if ($param1 == 'edit') {

			$data['name'] = trim(strtoupper($this->input->post('name')));
			$data['phone'] = trim($this->input->post('phone')[0]);
			$data['email'] = trim(strtolower($this->input->post('email')));

			$this->form_validation->set_rules('password', 'Password', 'trim|min_length[6]');
			$this->form_validation->set_rules('phone', 'Phone', 'trim|min_length[10]');
			$this->form_validation->set_rules('address', 'Name', 'trim|required');

			if ($this->form_validation->run() === FALSE) {
				$this->load->view('backend/admin/librarian');
			}

			$this->load->helper('email');
			if (!valid_email($data['email'])) {
				$this->session->set_flashdata('error_message', 'Could Not Update Your Data. Invalid Email Found!');
				redirect(site_url('admin/librarian'));
			}

			$validation = email_validation_for_edit($data['email'], $param2, 'librarian');
			if ($validation == 1) {
				$this->db->where('librarian_id', $param2);
				$this->db->update('librarian', $data);
				$this->session->set_flashdata('flash_message', get_phrase('data_updated'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('this_email_id_is_not_available'));
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/librarian'));
		}

		if ($param1 == 'delete') {
			$this->db->where('librarian_id', $param2);
			$this->db->delete('librarian');

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('data_deleted'));
			redirect(site_url('admin/librarian'));
		}

		if ($param1 == 'block') {
			$this->db->where('librarian_id', $param2);
			$this->db->set('block_limit', 3);
			$this->db->update('librarian');

			//clear the cached database
			$this->db->cache_delete();

			echo 'done';
			return false;

		} else if ($param1 == 'unblock') {
			$this->db->where('librarian_id', $param2);
			$this->db->set('block_limit', 0);
			$this->db->update('librarian');

			//clear the cached database
			$this->db->cache_delete();

			//send authentication code via sms and email
			$owner_email = $this->db->get_where('settings', array('type' => 'system_email'))->row()->description;
			$active_sms_service = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row()->description;

			$user_rows = $this->db->get_where('librarian', array('librarian_id' => $param2))->row();
			$user_name = $user_rows->name;
			$user_mail = $user_rows->email;
			$user_phone = $user_rows->phone;
			$user_auth_key = $user_rows->authentication_key;

			$phone_num = array();
			$phone_num[] = $user_phone;

			//prepare the message
			$message_sms = 'Hello ' . $user_name . ', thank you for your request to unblock your account. Your account has been unblocked successfully. Use this authentication key to login: ' . $user_auth_key . '.';

			$message_email = 'Hello ' . $user_name . ', thank you for your request to unblock your account. Your account has been unblocked successfully. Use this authentication key to login: <strong>' . $user_auth_key . '.</strong>';

			//sms first
			if ($active_sms_service != 'disabled') {
				// send sms
				$result = $this->sms_model->send_sms($message_sms, $phone_num);
			}

			//send email
			$this->email_model->do_email($message_email, 'Account Status', $user_mail, $owner_email);

			echo 'done';
			return false;
		}

		$page_data['page_title'] = get_phrase('all_librarians');
		$page_data['page_name'] = 'librarian';
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// MANAGE ACCOUNTANTS
	function accountant($param1 = '', $param2 = '', $param3 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if ($param1 == 'create') {
			$data['name'] = trim(strtoupper($this->input->post('name')));
			$data['phone'] = trim($this->input->post('phone')[0]);
			$data['email'] = trim(strtolower($this->input->post('email')));
			$data['password'] = password_hash($this->input->post('password'), PASSWORD_BCRYPT);

			$this->form_validation->set_rules('password', 'Password', 'trim|min_length[6]');
			$this->form_validation->set_rules('phone', 'Phone', 'trim|min_length[10]');
			$this->form_validation->set_rules('address', 'Name', 'trim|required');

			if ($this->form_validation->run() === FALSE) {
				$this->load->view('backend/admin/accountant');
			}

			$data['authentication_key'] = substr(sha1(md5(mt_rand(1014200000, 1019999999))), 0, 5);

			$this->load->helper('email');
			if (!valid_email($data['email'])) {
				$this->session->set_flashdata('error_message', 'Invalid Email Found!');
				redirect(site_url('admin/accountant'));
			}

			$validation = email_validation($data['email']);
			if ($validation == 1) {
				$this->db->insert('accountant', $data);
				$this->session->set_flashdata('flash_message', get_phrase('data_added_successfully'));
				$this->email_model->account_opening_email('accountant', $data['email'], $this->input->post('password'), $data['authentication_key']); //SEND EMAIL ACCOUNT OPENING EMAIL

				//send sms
				$system_name = $this->db->get_where('settings', array('type' => 'system_name'))->row()->description;
				$active_sms_service = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row()->description;
				if ($active_sms_service != 'disabled') {
					$account_opening_sms = 'Welcome to ' . $system_name . '. Your account type is Accountant. Here are your login credentials; Your Username: ' . $data['email'] . ', Password: ' . $this->input->post('password') . ' and Authentication Key: ' . $data['authentication_key'] . '. Thank you.';

					$this->sms_model->send_sms($account_opening_sms, $data['phone']);
				} //SEND SMS ENDED
			} else {
				$this->session->set_flashdata('error_message', get_phrase('this_email_id_is_not_available'));
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/accountant'));
		}

		if ($param1 == 'edit') {
			$data['name'] = trim(strtoupper($this->input->post('name')));
			$data['phone'] = trim($this->input->post('phone')[0]);
			$data['email'] = trim(strtolower($this->input->post('email')));

			$this->form_validation->set_rules('password', 'Password', 'trim|min_length[6]');
			$this->form_validation->set_rules('phone', 'Phone', 'trim|min_length[10]');
			$this->form_validation->set_rules('address', 'Name', 'trim|required');

			if ($this->form_validation->run() === FALSE) {
				$this->load->view('backend/admin/accountant');
			}

			$this->load->helper('email');
			if (!valid_email($data['email'])) {
				$this->session->set_flashdata('error_message', 'Could Not Update Your Data. Invalid Email Found!');
				redirect(site_url('admin/accountant'));
			}

			$validation = email_validation_for_edit($data['email'], $param2, 'accountant');
			if ($validation == 1) {
				$this->db->where('accountant_id', $param2);
				$this->db->update('accountant', $data);
				$this->session->set_flashdata('flash_message', get_phrase('data_updated'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('this_email_id_is_not_available'));
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/accountant'));
		}

		if ($param1 == 'delete') {
			$this->db->where('accountant_id', $param2);
			$this->db->delete('accountant');

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('data_deleted'));
			redirect(site_url('admin/accountant'));
		}

		if ($param1 == 'block') {
			$this->db->where('accountant_id', $param2);
			$this->db->set('block_limit', 3);
			$this->db->update('accountant');

			//clear the cached database
			$this->db->cache_delete();

			echo 'done';
			return false;

		} else if ($param1 == 'unblock') {
			$this->db->where('accountant_id', $param2);
			$this->db->set('block_limit', 0);
			$this->db->update('accountant');

			//clear the cached database
			$this->db->cache_delete();

			//send authentication code via sms and email
			$owner_email = $this->db->get_where('settings', array('type' => 'system_email'))->row()->description;
			$active_sms_service = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row()->description;

			$user_rows = $this->db->get_where('accountant', array('accountant_id' => $param2))->row();
			$user_name = $user_rows->name;
			$user_mail = $user_rows->email;
			$user_phone = $user_rows->phone;
			$user_auth_key = $user_rows->authentication_key;

			$phone_num = array();
			$phone_num[] = $user_phone;

			//prepare the message
			$message_sms = 'Hello ' . $user_name . ', thank you for your request to unblock your account. Your account has been unblocked successfully. Use this authentication key to login: ' . $user_auth_key . '.';

			$message_email = 'Hello ' . $user_name . ', thank you for your request to unblock your account. Your account has been unblocked successfully. Use this authentication key to login: <strong>' . $user_auth_key . '.</strong>';

			//sms first
			if ($active_sms_service != 'disabled') {
				// send sms
				$result = $this->sms_model->send_sms($message_sms, $phone_num);
			}

			//send email
			$this->email_model->do_email($message_email, 'Account Status', $user_mail, $owner_email);

			echo 'done';
			return false;
		}

		$page_data['page_title'] = get_phrase('all_accountants');
		$page_data['page_name'] = 'accountant';
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}


	// bulk invoice bulk upload using CSV
	function generate_bulk_invoice_csv($class_id = '', $section_id = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		//to be bult later
		return false;

		$data['class_id'] = $class_id;
		$data['section_id'] = $section_id;
		$data['year'] = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$data['term'] = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;

		//add section A or B if the class has more than one section
		$class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
		$class_name_numeric = $this->db->get_where('class', array('class_id' => $class_id))->row()->name_numeric;
		$section_name = $this->db->get_where('section', array('section_id' => $section_id, 'class_id' => $class_id))->row()->name;
		$class_has_more_sections = $this->db->get_where('class', array('name' => $class_name, 'name_numeric' => $class_name_numeric))->num_rows();
		$sec_name = '';
		if ($class_has_more_sections > 1) {
			$sec_name = $section_name;
		}

		//FILTER CRECHE SINCE WE DON'T HAVE CRECHE 1,2 ETC
		if ($class_name == 'CRECHE') {
			$full_class_name = ucwords(strtolower($class_name)) . $sec_name;
		} else {
			$full_class_name = ucwords(strtolower($class_name)) . ' ' . $class_name_numeric . $sec_name;
		}

		$file = fopen("uploads/" . $full_class_name . "_bulk_student.csv", "w");
		$line = array('Student Name', 'ID No.', 'Gender', 'Religion', 'Birthday', 'Blood Group', 'Student Email', 'Password', 'Student Phone', 'Student Address', 'Guardian Name', 'Guardian Phone', 'Address', 'Guardian Email', 'Guardian Password', 'Guardian Profession', 'PTA Executive Position');

		fputcsv($file, $line, ',');
		$file_data['file_path'] = base_url() . 'uploads/' . $full_class_name . '_bulk_student.csv';
		$file_data['file_name'] = $full_class_name . '_bulk_student.csv';

		echo json_encode($file_data);
	}


	// CSV TEMPLATE GENERATION FOR BULK STUDENT ADMISSION
	function generate_bulk_student_csv($class_id = '', $section_id = '') {
		header('Content-Type: application/json');
		
		$class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
		$class_numeric = $this->db->get_where('class', array('class_id' => $class_id))->row()->name_numeric;
		$section_name = $this->db->get_where('section', array('section_id' => $section_id))->row()->name;
		
		$filename = 'Bulk_Student_' . $class_name . $class_numeric . $section_name . '_' . date('Y-m-d') . '.xls';
		
		$excel_content = $this->generate_excel_template();
		
		echo json_encode(array(
			'file' => base64_encode($excel_content),
			'filename' => $filename
		));
	}
	
	private function generate_excel_template() {
		$html = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
		$html .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40">';
		
		$html .= '<Styles>';
		$html .= '<Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/></Borders><Font ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/><Interior ss:Color="#4472C4" ss:Pattern="Solid"/></Style>';
		$html .= '<Style ss:ID="Data"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/></Borders></Style>';
		$html .= '<Style ss:ID="DateFormat"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/><Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/><Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/><Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D0D0D0"/></Borders><NumberFormat ss:Format="yyyy-mm-dd"/></Style>';
		$html .= '</Styles>';
		
		$html .= '<Worksheet ss:Name="Student Data"><Table>';
		
		$columns = [100, 100, 80, 100, 60, 90, 70, 90, 120, 100, 90, 70, 90, 100, 150, 150, 90, 120, 90, 100, 150, 100, 100, 100, 100, 100, 100, 100, 120, 120, 100, 80, 80, 120, 120, 100, 100, 80, 150];
		foreach($columns as $width) {
			$html .= '<Column ss:Width="' . $width . '"/>';
		}
		
		$headers = ['Student Code', 'First Name*', 'Middle Name', 'Last Name*', 'Gender*', 'Date of Birth (YYYY-MM-DD)*', 'Blood Group', 'Nationality', 'Ghana Card ID', 'Place of Birth', 'Hometown', 'Tribe', 'Religion', 'Student Phone', 'Email', 'Address', 'Admission Date', 'Former School', 'Class Reached', 'Guardian Name*', 'Guardian Phone*', 'Parent Email', 'Emergency Contact', 'Father Name', 'Father Phone', 'Father Occupation', 'Mother Name', 'Mother Phone', 'Mother Occupation', 'Allergies', 'Medical Conditions', 'NHIS Number', 'NHIS Status', 'Disability Status', 'Special Needs', 'Learning Support', 'Digital Literacy', 'Home Technology Access', 'Special Diet', 'Special Diet Details'];
		
		$html .= '<Row ss:Height="40">';
		foreach($headers as $header) {
			$html .= '<Cell ss:StyleID="Header"><Data ss:Type="String">' . htmlspecialchars($header) . '</Data></Cell>';
		}
		$html .= '</Row>';
		
		for($i = 0; $i < 60; $i++) {
			$html .= '<Row ss:Height="25">';
			foreach($headers as $index => $header) {
				if($index == 5 || $index == 16) {
					$html .= '<Cell ss:StyleID="DateFormat"><Data ss:Type="String"></Data></Cell>';
				} else {
					$html .= '<Cell ss:StyleID="Data"><Data ss:Type="String"></Data></Cell>';
				}
			}
			$html .= '</Row>';
		}
		
		$html .= '</Table></Worksheet></Workbook>';
		return $html;
	}


	//csv parent info validation
	function uploaded_csvfile_parent_validate() {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if (isset($_FILES['userfile']['name'])) {

			move_uploaded_file($_FILES['userfile']['tmp_name'], 'uploads/tmp/' . $_FILES['userfile']['name']);
			$csv = array_map('str_getcsv', file('uploads/tmp/' . $_FILES['userfile']['name']));
			$count = 1;
			$array_size = sizeof($csv);

			$i = 0;
			$email_val_counter = 0;
			$email_corr = true;
			$data = array();
			foreach ($csv as $row) {
				if ($count == 1) {
					$count++;
					continue;
				}

				//parent's name and phone numbers
				$data3['name'] = ucwords(strtolower(trim($row[19])));
				$data3['email'] = strtolower(trim($row[21]));

				if (strlen($row[20]) == 9) {
					$data3['phone'] = '0' . trim($row[20]);
				} else {
					$data3['phone'] = trim($row[20]);
				}

				$parent_validation = parent_full_validation_insert($data3['name'], $data3['phone']);

				//$g_validation = email_validation($data3['email']); //validate email duplication
				if ($data3['email'] != '' || $data3['email'] != null) { //check if email is correct only if email column is not empty
					$email_corr = valid_email($data3['email']); //validate email correct format
				} else {
					$data3['email'] = $data3['phone'];
				}

				if (!$email_corr) {
					$email_val_counter++;
					//echo 'email_error';
					break;
				}

				if (!$parent_validation) {
					//if name and phone altoghether validation fails
					//check if the name has & in it e.g Mr & Mrs Agbotah
					$p_name = $data3['name'];
					for ($n = 0; $n < strlen($p_name); $n++) {
						if ($p_name[$n] == '&') {
							$data3['name'] = str_replace('&', '-', $p_name);
						}
					}
					$data[$i] = $data3['name'] . ' ' . $data3['phone'] . ' ';
					$i++;
				}
			}

			if ($email_val_counter > 0) {
				echo 'email_error';
			} else {
				for ($ij = 0; $ij < count($data); $ij++) {
					echo $data[$ij];
				}
			}

		}

	}
	// CSV IMPORT STUDENT
	function bulk_student_add_using_csv($param1 = '') {

		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$this->load->library('form_validation');

		$student_code_prefix = $this->db->get_where('settings', array('type' => 'student_code_prefix'))->row()->description;
		$student_code = $this->db->get_where('settings', array('type' => 'student_code_format'))->row()->description;
		$st_phone = array();
		$p_phone = array();

		if ($param1 == 'import') {
			if ($this->input->post('class_id') != '' && $this->input->post('section_id') != '') {

				$class_id = $this->input->post('class_id');
				$section_id = $this->input->post('section_id');

				$class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
				$class_name_numeric = $this->db->get_where('class', array('class_id' => $class_id))->row()->name_numeric;

				$section_name = $this->db->get_where('section', array('section_id' => $section_id, 'class_id' => $class_id))->row()->name;
				$class_has_more_sections = $this->db->get_where('class', array('name' => $class_name, 'name_numeric' => $class_name_numeric))->num_rows();
				$sec_name = '';

				if ($class_has_more_sections > 1) {
					$sec_name = $section_name;
				}

				$class = ucwords(strtolower($class_name)) . '-' . $class_name_numeric . $sec_name;

				move_uploaded_file($_FILES['userfile']['tmp_name'], 'uploads/' . $_FILES['userfile']['name']);
				$csv = array_map('str_getcsv', file('uploads/' . $_FILES['userfile']['name']));
				// Filter out empty rows
				$csv = array_filter($csv, function($row) {
					return !empty(array_filter($row, function($value) {
						return trim($value) !== '';
					}));
				});
				$count = 1;
				$array_size = sizeof($csv);

				foreach ($csv as $row) {
					if ($count == 1) {
						$count++;
						continue;
					}

					//set Default password for student and guardian
					$s_password = '123456';
					$g_password = '123456';

					//set guardian email to phone number if email is empty
					if (!empty($row[21]) || $row[21] != '' || $row[21] == null) {
						$row[21] = trim($row[21]);

					} else {
						$row[21] = '0' . trim($row[20]);
					}

					//student id (code) validation
					if (!empty(trim($row[0]))) {
						$code_validation = code_validation_insert(trim($row[0]));
						if (!$code_validation) {
							$this->session->set_flashdata('error_message', 'Student ID(s) ' . $row[0] . ', Already Exist(s)');
							redirect(site_url('admin/student_bulk_add'));
						}
					} else {

						//student code with Alpha-numric
						//generate student id
						$this->db->select('student_code');
						$this->db->order_by('student_code', 'desc');
						$this->db->limit(1);
						$st_query = $this->db->get('student');
						$st_id = $st_query->row()->student_code;

						if ($st_query->num_rows() > 0) {
							//extract the numeric out and increase it by 1
							$first_num = ''; //the first occurence of a number after the string STAFF-....
							$position_of_first_num = ''; //the position of the first number

							$i = 0;
							for ($i = 0; $i < strlen($st_id); $i++) {
								if (is_numeric($st_id[$i])) {
									$first_num = $st_id[$i];
									break;
								}
							}

							//find the position
							$position_of_first_num = strpos($st_id, $first_num);

							//now let's do the extraction
							$n_stid = substr($st_id, $position_of_first_num, strlen($st_id) - $i);

							$row[0] = $n_stid + 1;

							//checking if the first 4digits of the id equals the current year, if not, we create a new ID using the current year format
		                        
						if(intval(date('Y')) != intval(substr($row[0], 0, 4))) {
								//new year so the student ID format has to change
								//e.g in 2021, it will start with 2021001
								//while in 2022, it will start with 2022001 etc
								$row[0] = $student_code_prefix . $student_code;
							}	else {
								//we are in same year this student ID was generated
								if($first_num == 0) {
									$old_len = strlen($st_id);
									$new_len = strlen($row[0]);
									$act_len = ($old_len - $new_len);
									$row[0] = substr($st_id, 0, $act_len) . $row[0];
									
								} else {
									$row[0] = $row[0];
								}

							}


						} else {
							$row[0] = $student_code_prefix . $student_code;
						}

					}

					//students data
					$data['student_code'] = trim($row[0]);
					$data['first_name'] = trim($row[1]);
					$data['middle_name'] = trim($row[2]);
					$data['last_name'] = trim($row[3]);
					$data['name'] = trim($row[1] . ' ' . $row[2] . ' ' . $row[3]);
					$data['sex'] = trim($row[4]);
					$data['birthday'] = (!empty(trim($row[5]))) ? date_format_converter(trim($row[5])) : '';
					$data['blood_group'] = trim($row[6]);
					$data['nationality'] = trim($row[7]);
					$data['ghana_card_id'] = trim($row[8]);
					$data['place_of_birth'] = trim($row[9]);
					$data['hometown'] = trim($row[10]);
					$data['tribe'] = trim($row[11]);
					$data['religion'] = trim($row[12]);
					$data['student_phone'] = trim($row[13]);
					$data['phone'] = trim($row[13]);
					$data['email'] = trim($row[14]);
					$data['address'] = trim($row[15]);
					$data['admission_date'] = date('Y-m-d', strtotime(trim($row[16])));
					$data['former_school'] = trim($row[17]);
					$data['class_reached'] = trim($row[18]);
					$data['emergency_contact'] = trim($row[22]);
					//$data['parent_email'] = trim($row[21]);
					$data['allergies'] = trim($row[29]);
					$data['medical_conditions'] = trim($row[30]);
					$data['nhis_number'] = trim($row[31]);
					$data['nhis_status'] = trim($row[32]);
					$data['disability_status'] = trim($row[33]);
					$data['special_needs'] = trim($row[34]);
					$data['learning_support'] = trim($row[35]);
					$data['digital_literacy'] = trim($row[36]);
					$data['home_technology_access'] = trim($row[37]);
					$data['special_diet'] = trim($row[38]);
					$data['student_special_diet_details'] = trim($row[39]);
					$data['password'] = password_hash(trim($s_password), PASSWORD_BCRYPT);
					$data['authentication_key'] = substr(sha1(md5(mt_rand(1034200000, 1039999999))), 0, 5);

					//guardian/parent data
					$data3['name'] = trim($row[19]);
					$data3['phone'] = (strlen(trim($row[20])) == 9) ? '0' . trim($row[20]) : trim($row[20]);
					$data3['email'] = (!empty(trim($row[21]))) ? trim($row[21]) : $data3['phone'];
					$data3['address'] = trim($row[15]);
					$data3['father_name'] = trim($row[23]);
					$data3['father_phone'] = trim($row[24]);
					$data3['father_occupation'] = trim($row[25]);
					$data3['mother_name'] = trim($row[26]);
					$data3['mother_phone'] = trim($row[27]);
					$data3['mother_occupation'] = trim($row[28]);
					$g_password = (!empty(trim($g_password))) ? trim($g_password) : $data3['phone'];
					$data3['password'] = password_hash(trim($g_password), PASSWORD_BCRYPT);
					$data3['authentication_key'] = substr(sha1(md5(mt_rand(1024200000, 1029999999))), 0, 5);

					//student auth (key) validation
					$auth_validation = auth_validation_insert($data['authentication_key']);
					while (!$auth_validation) {
						$data['authentication_key'] = substr(sha1(md5(mt_rand(1034200000, 1039999999))), 0, 5);
						$auth_validation = auth_validation_insert($data['authentication_key']);
					}

					//guardian auth (key) validation
					$g_auth_validation = g_auth_validation_insert($data3['authentication_key']);
					while (!$g_auth_validation) {
						$data3['authentication_key'] = substr(sha1(md5(mt_rand(1024200000, 1029999999))), 0, 5);
						$g_auth_validation = g_auth_validation_insert($data3['authentication_key']);
					}

					$this->load->helper('email');

					//student id (code) validation
					$code_validation = code_validation_insert($data['student_code']);
					while (!$code_validation) {
						//$this->session->set_flashdata('error_message' , 'This ID No Is Not Available');
						$this->db->select('student_code');
						$this->db->order_by('student_code', 'desc');
						$this->db->limit(1);
						$st_query = $this->db->get('student');
						$st_id = $st_query->row()->student_code;

						if ($st_query->num_rows() > 0) {
							//extract the numeric out and increase it by 1
							$first_num = ''; //the first occurence of a number after the string STAFF-....
							$position_of_first_num = ''; //the position of the first number

							$i = 0;
							for ($i = 0; $i < strlen($st_id); $i++) {
								if (is_numeric($st_id[$i])) {
									$first_num = $st_id[$i];
									break;
								}
							}

							//find the position
							$position_of_first_num = strpos($st_id, $first_num);

							//now let's do the extraction
							$n_stid = substr($st_id, $position_of_first_num, strlen($st_id) - $i);

							$data['student_code'] = $n_stid + 1;

							if ($first_num == 0) {
								$old_len = strlen($st_id);
								$new_len = strlen($data['student_code']);
								$act_len = ($old_len - $new_len);
								$data['student_code'] = substr($st_id, 0, $act_len) . $data['student_code'];
							} else {
								$data['student_code'] = $data['student_code'];
							}
						}
						$code_validation = code_validation_insert($data['student_code']);
					}

					if ($first_num == 0) {
						$data['student_code'] = $data['student_code'];
					} else {
						$data['student_code'] = $student_code_prefix . $data['student_code'];
					}
					//student code validation ends

					$data['username'] = $data['student_code'];
					$validation = email_validation($data['email']);
					$g_validation = email_validation($data3['email']);

					if ($data['email'] == '' || $data['email'] == null || empty($data['email']) || $data3['email'] == '' || $data3['email'] == null || empty($data3['email'])) {

						$this->db->insert('student', $data);
						$student_id = $this->db->insert_id();

						$data2['student_id'] = $student_id;
						$data2['class_id'] = $this->input->post('class_id');
						$data2['section_id'] = $this->input->post('section_id');
						//$data2['roll']        = $row[1];
						$data2['enroll_code'] = substr(md5(rand(0, 1000000)), 0, 7);
						$data2['date_added'] = strtotime(date("Y-m-d H:i:s"));
						$data2['year'] = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;

						if ($class_name == 'JHSS') {
							$data2['sem'] = $this->db->get_where('settings', array('type' => 'running_sem'))->row()->description;

						} else {
							$data2['term'] = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
						}

						$this->db->insert('enroll', $data2);

						//generate student id barcode and store it in uploads/barcodes/students
						$this->barcode_model->save_barcode($data['student_code']);

						$this->email_model->account_opening_email('student', $data['email'], $row[6], $data['authentication_key'], $data['student_code']); //SEND EMAIL ACCOUNT OPENING EMAIL TO STUDENT

					} elseif ($data['email'] != '' && $validation == 1 || $data3['email'] != '' && $g_validation == 1) {

						if (valid_email($data['email'])) {
						//email format validation
							$this->db->insert('student', $data);
							$student_id = $this->db->insert_id();

							$data2['student_id'] = $student_id;
							$data2['class_id'] = $this->input->post('class_id');
							$data2['section_id'] = $this->input->post('section_id');
							//                    $data2['roll']        = $row[1];
							$data2['enroll_code'] = substr(md5(rand(0, 1000000)), 0, 7);
							$data2['date_added'] = strtotime(date("Y-m-d H:i:s"));
							$data2['year'] = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
							$data2['term'] = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;

							$this->db->insert('enroll', $data2);

							//generate student id barcode and store it in uploads/barcodes/students
							$this->barcode_model->save_barcode($data['student_code']);

							$this->email_model->account_opening_email('student', $data['email'], $row[6], $data['authentication_key'], $data['student_code'], $data['username']); //SEND EMAIL ACCOUNT OPENING EMAIL TO STUDENT

						} else {

							

							$this->session->set_flashdata('error_message', 'Invalid Email(s) Found!');
							redirect(site_url('admin/student_bulk_add?error=1&email=' . $data['email']));
						}

					} else {
						if ($array_size == 2) {

							

							$this->session->set_flashdata('error_message', get_phrase('this_email_id_"') . $data['email'] . get_phrase('"_is_not_available'));

							redirect(site_url('admin/student_bulk_add?error=2&email=' . $data['email']));
						} elseif ($array_size > 2) {

							

							$this->session->set_flashdata('error_message', get_phrase('some_of_the_emails_already_exist!'));
							redirect(site_url('admin/student_bulk_add?error=3&email=' . $data['email']));
						}
					}

					$parent_validation = parent_full_validation_insert($data3['name'], $data3['phone']);

					if (!$parent_validation) {

						//update student table with the parent's id
						$data4['parent_id'] = $this->db->get_where('parent', array('name' => $data3['name']))->row()->parent_id;
						$this->db->where('name', $data['name']);
						$this->db->where('student_code', $data['student_code']);
						$this->db->where('student_id', $student_id);
						$this->db->update('student', $data4);

					} else {
						if ($data3['email'] == '' || empty($data3['email'])) {
							$data3['email'] = $data3['phone'];
						}
						//insert new parent's information into parent table
						$this->db->insert('parent', $data3);

						$this->email_model->account_opening_email('parent', $data3['email'], $row[13], $data3['authentication_key']); //SEND EMAIL ACCOUNT OPENING EMAIL TO PARENT

						//update student table now with the parent's id
						$data4['parent_id'] = $this->db->get_where('parent', array('name' => $data3['name']))->row()->parent_id;
						$this->db->where('name', $data['name']);
						$this->db->where('student_code', $data['student_code']);
						$this->db->where('student_id', $student_id);
						$this->db->update('student', $data4);
					} //parent validation ends
				}

				

				$this->session->set_flashdata('flash_message', get_phrase('students_admitted_successfully!'));
				redirect(site_url('admin/student_bulk_add?success=1'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('please_make_sure_class_and_section_are_selected'));
				redirect(site_url('admin/student_bulk_add'));
			}
		}
		$page_data['page_name'] = 'student_bulk_add';
		$page_data['page_title'] = get_phrase('admit_bulk_student');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function study_material($task = "", $document_id = "") {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if($task == 'load') {
			// Get filter parameters
			$filters = array(
				'class_id' => $this->input->post('class_id'),
				'teacher_id' => $this->input->post('teacher_id'),
				'start_date' => $this->input->post('start_date'),
				'end_date' => $this->input->post('end_date')
			);

			$page_data['study_material_info'] = $this->crud_model->select_study_material_info($filters);
			$page_data['filters'] = $filters;

			$this->load->view('backend/admin/get_study_material_table', $page_data);
			return;
		}

		if ($task == "create") {
			try {
				$this->crud_model->save_study_material_info();

				//clear the cached database
				$this->db->cache_delete();

				// Return JSON response for AJAX
				if ($this->input->is_ajax_request()) {
					echo json_encode(['status' => 'success', 'message' => get_phrase('study_material_info_saved_successfuly')]);
					return;
				}

				$this->session->set_flashdata('flash_message', get_phrase('study_material_info_saved_successfuly'));
				redirect(site_url('admin/study_material'));
			} catch (Exception $e) {
				if ($this->input->is_ajax_request()) {
					echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
					return;
				}
				$this->session->set_flashdata('error_message', $e->getMessage());
				redirect(site_url('admin/study_material'));
			}
		}

		if ($task == "update") {
			try {
				$this->crud_model->update_study_material_info($document_id);

				//clear the cached database
				$this->db->cache_delete();

				// Return JSON response for AJAX
				if ($this->input->is_ajax_request()) {
					echo json_encode(['status' => 'success', 'message' => get_phrase('study_material_info_updated_successfuly')]);
					return;
				}

				$this->session->set_flashdata('flash_message', get_phrase('study_material_info_updated_successfuly'));
				redirect(site_url('admin/study_material'));
			} catch (Exception $e) {
				if ($this->input->is_ajax_request()) {
					echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
					return;
				}
				$this->session->set_flashdata('error_message', $e->getMessage());
				redirect(site_url('admin/study_material'));
			}
		}

		if($task == 'update_status') {

			echo $this->crud_model->update_study_material_status();

			return;
		}
		
		if($task == 'bulk_update_status') {
			$ids = $this->input->post('ids');
			$status = $this->input->post('status');
			
			if(empty($ids) || empty($status)) {
				echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
				return;
			}
			
			$updated_count = 0;
			foreach($ids as $id) {
				$data = array('status' => $status);
				$this->db->where('document_id', $id);
				if($this->db->update('document', $data)) {
					$updated_count++;
				}
			}
			
			//clear the cached database
			$this->db->cache_delete();
			
			echo json_encode([
				'status' => 'success', 
				'message' => $updated_count . ' material(s) updated successfully'
			]);
			return;
		}

		if ($task == "delete") {
			$this->crud_model->delete_study_material_info($document_id);

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/study_material'));
		}

		$data['study_material_info'] = $this->crud_model->select_study_material_info();
		$data['page_name'] = 'study_material';
		$data['page_title'] = get_phrase('study_material');
		$this->load->view('backend/main', $data);
	}

	//new code
	function print_id($id) {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));
		$data['id'] = $id;
		$this->load->view('backend/admin/print_id', $data);
	}

	function create_barcode($student_id) {

		return $this->Barcode_model->create_barcode($student_id);

	}

	// Details of searched student
	function student_details($param1 = "") {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		$student_identifier = $this->input->post('student_identifier');
		$query_by_code = $this->db->get_where('student', array('student_code' => $student_identifier));

		if ($query_by_code->num_rows() == 0) {
			$this->db->like('name', $student_identifier);
			$query_by_name = $this->db->get('student');
			if ($query_by_name->num_rows() == 0) {
				$this->session->set_flashdata('error_message', get_phrase('no_student_found'));
				redirect(site_url('admin/dashboard'));
			} else {
				$page_data['student_information'] = $query_by_name->result_array();
			}
		} else {
			$page_data['student_information'] = $query_by_code->result_array();
		}
		$page_data['page_name'] = 'search_result';
		$page_data['page_title'] = get_phrase('search_result');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}


	function get_invoice_details() {
		$invoice_code = $this->input->post('invoice_code');
		$student_id = $this->input->post('student_id');
		$currency = get_settings('currency');
		
		$invoices = $this->db->where('invoice_code', $invoice_code)
			->where('student_id', $student_id)
			->where('can_delete !=', 'trash')
			->get('invoice')->result_array();
		
		$total_amount = 0;
		$total_due = 0;
		
		foreach($invoices as $invoice) {
			$total_amount += $invoice['amount'];
			$total_due += $invoice['due'];
		}
		
		echo '<div style="margin-bottom: 20px;">';
		foreach($invoices as $invoice) {
			echo '<div style="background: white; border-radius: 8px; padding: 15px; margin-bottom: 10px; border-left: 4px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">';
			echo '<div style="display: flex; justify-content: space-between; align-items: center;">';
			echo '<div style="font-weight: 600; color: #047857; font-size: 15px;">' . strtoupper($invoice['title']) . '</div>';
			echo '<div style="display: flex; gap: 30px;">';
			echo '<div><span style="color: #6b7280; font-size: 13px;">Amount:</span> <span style="font-weight: 600; color: #1f2937;">' . $currency . ' ' . number_format($invoice['amount'], 2) . '</span></div>';
			echo '<div><span style="color: #6b7280; font-size: 13px;">Due:</span> <span style="font-weight: 700; color: #dc2626;">' . $currency . ' ' . number_format($invoice['due'], 2) . '</span></div>';
			echo '</div></div></div>';
		}
		echo '<div style="background: #f3f4f6; border-radius: 8px; padding: 15px; border-left: 4px solid #dc2626; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">';
		echo '<div style="display: flex; justify-content: space-between; align-items: center;">';
		echo '<div style="font-weight: 700; color: #1f2937; font-size: 16px;">Total</div>';
		echo '<div style="display: flex; gap: 30px;">';
		echo '<div style="font-weight: 700; color: #1f2937; font-size: 16px;">' . $currency . ' ' . number_format($total_amount, 2) . '</div>';
		echo '<div style="font-weight: 700; color: #dc2626; font-size: 16px;">' . $currency . ' ' . number_format($total_due, 2) . '</div>';
		echo '</div></div></div>';
		echo '</div>';
	}
	
	function get_discount_profile_form() {
		$student_id = $this->input->post('student_id');
		$invoice_code = $this->input->post('invoice_code');
		$currency = get_settings('currency');

		$this->db->where('invoice_code', $invoice_code);
		$this->db->where('student_id', $student_id);
		$invoices = $this->db->get('invoice')->result_array();

		$this->db->select_sum('amount');
		$this->db->where('invoice_code', $invoice_code);
		$total_amount = $this->db->get('invoice')->row()->amount;

		$this->db->select_sum('due');
		$this->db->where('invoice_code', $invoice_code);
		$total_due = $this->db->get('invoice')->row()->due;

		// Get approved discount info
		$discount_query = $this->db->where('invoice_code', $invoice_code)->where('status', 'approved')->get('invoice_discounts');
		$total_discount = 0;
		$discount_details = array();
		if($discount_query->num_rows() > 0) {
			foreach($discount_query->result_array() as $disc) {
				$total_discount += $disc['discount_amount'];
				$discount_details[] = $disc;
			}
		}
		
		// Get pending discount info
		$pending_discount_query = $this->db->where('invoice_code', $invoice_code)->where('status', 'pending')->get('invoice_discounts');
		$total_pending_discount = 0;
		$pending_discount_details = array();
		if($pending_discount_query->num_rows() > 0) {
			foreach($pending_discount_query->result_array() as $disc) {
				$total_pending_discount += $disc['discount_amount'];
				$pending_discount_details[] = $disc;
			}
		}
		
		// Calculate total before discount (round to avoid floating-point errors)
		$total_before_discount = round(floatval($total_amount) + floatval($total_discount), 2);
		
		// Display summary if discount exists
		if($total_discount > 0) {
			echo '<div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-5 rounded">';
			echo '<div class="flex justify-between items-center">';
			echo '<div><p class="text-sm font-semibold text-gray-600">Total Before Discount:</p><p class="text-2xl font-bold text-gray-800">'.$currency.' '.number_format($total_before_discount, 2).'</p></div>';
			echo '<div class="text-center"><p class="text-sm font-semibold text-red-600">Discount Applied:</p><p class="text-2xl font-bold text-red-600">- '.$currency.' '.number_format($total_discount, 2).'</p></div>';
			echo '<div class="text-right"><p class="text-sm font-semibold text-green-600">Total After Discount:</p><p class="text-2xl font-bold text-green-600">'.$currency.' '.number_format($total_amount, 2).'</p></div>';
			echo '</div></div>';
		}

		foreach ($invoices as $inv) {
			echo '<div class="bill-item-card"><div class="row" style="align-items: center;"><div class="col-md-6"><strong style="color: #2c3e50; font-size: 15px;">'.$inv['title'].'</strong></div><div class="col-md-3 text-right"><span style="color: #95a5a6; font-size: 12px;">'.get_phrase('amount').':</span> <strong style="font-size: 14px;">'.$currency.' '.number_format($inv['amount'], 2).'</strong></div><div class="col-md-3 text-right"><span style="color: #95a5a6; font-size: 12px;">'.get_phrase('due').':</span> <strong style="color: #e74c3c; font-size: 14px;">'.$currency.' '.number_format($inv['due'], 2).'</strong></div></div></div>';
		}
		echo '<div class="bill-item-card bill-total-card"><div class="row" style="align-items: center;"><div class="col-md-6"><strong style="font-size: 16px;">'.get_phrase('total').'</strong></div><div class="col-md-3 text-right"><strong style="font-size: 15px;">'.$currency.' '.number_format($total_amount, 2).'</strong></div><div class="col-md-3 text-right"><strong style="font-size: 15px; color: #e74c3c;">'.$currency.' '.number_format($total_due, 2).'</strong></div></div></div>';
		
		if($total_discount > 0) {
			echo '<div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-top: 15px; border-radius: 8px;">';
			echo '<div style="font-weight: 700; color: #155724; margin-bottom: 10px; font-size: 15px;"><i class="fa fa-tag"></i> '.get_phrase('discount_details').'</div>';
			foreach($discount_details as $disc) {
				echo '<div style="font-size: 13px; color: #155724; margin: 5px 0;">? '.ucwords(str_replace('_', ' ', $disc['discount_type'])).': ';
				echo ($disc['discount_method'] == 'percentage' ? $disc['discount_value'].'%' : $currency.' '.number_format($disc['discount_value'], 2));
				echo ' = <strong>'.$currency.' '.number_format($disc['discount_amount'], 2).'</strong>';
				$reason = !empty($disc['reason']) ? $disc['reason'] : ucwords(str_replace('_', ' ', $disc['discount_type']));
				echo '<br>&nbsp;&nbsp;<em style="font-size: 12px;">Reason: '.$reason.'</em>';
				echo '</div>';
			}
			echo '</div>';
		}
		
		// Display pending discount in warning/yellow color
		if($total_pending_discount > 0) {
			echo '<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-top: 15px; border-radius: 8px;">';
			echo '<div style="font-weight: 700; color: #856404; margin-bottom: 10px; font-size: 15px;"><i class="fa fa-clock"></i> '.get_phrase('pending_discount_approval').'</div>';
			foreach($pending_discount_details as $disc) {
				echo '<div style="font-size: 13px; color: #856404; margin: 5px 0;">? '.ucwords(str_replace('_', ' ', $disc['discount_type'])).': ';
				echo ($disc['discount_method'] == 'percentage' ? $disc['discount_value'].'%' : $currency.' '.number_format($disc['discount_value'], 2));
				echo ' = <strong>'.$currency.' '.number_format($disc['discount_amount'], 2).'</strong>';
				$reason = !empty($disc['reason']) ? $disc['reason'] : ucwords(str_replace('_', ' ', $disc['discount_type']));
				echo '<br>&nbsp;&nbsp;<em style="font-size: 12px;">Reason: '.$reason.'</em>';
				echo '<br>&nbsp;&nbsp;<em style="font-size: 11px; color: #d39e00;"><i class="fa fa-info-circle"></i> Awaiting approval</em>';
				echo '</div>';
			}
			echo '</div>';
		}
	}

	function update_invoice_discount() {
		if ($this->session->userdata('admin_login') != 1) {
			echo json_encode(array('status' => 'error', 'message' => 'Unauthorized'));
			return;
		}

		$invoice_code = $this->input->post('invoice_code');
		$discount = $this->input->post('discount');
		$student_id = $this->input->post('student_id');

		if (!empty($invoice_code) && !empty($discount)) {
			$this->db->where('invoice_code', $invoice_code);
			$this->db->order_by('invoice_id', 'asc');
			$invoices = $this->db->get('invoice')->result_array();

			$remaining_discount = $discount;

			foreach ($invoices as $invoice) {
				if ($remaining_discount <= 0) break;

				if ($invoice['amount'] >= $remaining_discount) {
					$new_amount = $invoice['amount'] - $remaining_discount;
					$new_due = $invoice['due'] - $remaining_discount;
					$remaining_discount = 0;
				} else {
					$remaining_discount -= $invoice['amount'];
					$new_amount = 0;
					$new_due = $invoice['due'] - $invoice['amount'];
				}

				$this->db->where('invoice_id', $invoice['invoice_id']);
				$this->db->update('invoice', array(
					'amount' => $new_amount,
					'due' => $new_due
				));
			}

			$this->db->where('invoice_code', $invoice_code);
			$this->db->update('invoice', array(
				'discount' => $discount
			));

			$this->db->cache_delete();
			echo json_encode(array('status' => 'success', 'message' => get_phrase('discount_applied_successfully')));
		} else {
			echo json_encode(array('status' => 'error', 'message' => get_phrase('invalid_discount_amount')));
		}
	}

	// online exam
	function manage_online_exam($param1 = "", $param2 = "") {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$running_sem = get_settings('running_sem');

		if ($param1 == '') {
			$match = array('status !=' => 'expired', 'running_year' => $running_year);
			$page_data['status'] = 'active';
			$this->db->order_by("exam_date", "desc");
			$page_data['online_exams'] = $this->db->where($match)->get('online_exam')->result_array();
		}

		if ($param1 == 'expired') {
			$match = array('status' => 'expired', 'running_year' => $running_year);
			$page_data['status'] = 'expired';
			$this->db->order_by("exam_date", "desc");
			$page_data['online_exams'] = $this->db->where($match)->get('online_exam')->result_array();
		}

		if ($param1 == 'create') {
			if ($this->input->post('class_id') > 0 && $this->input->post('section_id') > 0 && $this->input->post('subject_id') > 0) {
				$this->crud_model->create_online_exam();

				//clear the cached database
				$this->db->cache_delete();

				$this->session->set_flashdata('flash_message', get_phrase('data_added_successfully'));
				redirect(site_url('admin/manage_online_exam'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('make_sure_to_select_valid_class_') . ',' . get_phrase('_section_and_subject'));
				redirect(site_url('admin/manage_online_exam'));
			}
		}
		if ($param1 == 'edit') {
			if ($this->input->post('class_id') > 0 && $this->input->post('section_id') > 0 && $this->input->post('subject_id') > 0) {
				$this->crud_model->update_online_exam();

				//clear the cached database
				$this->db->cache_delete();

				$this->session->set_flashdata('flash_message', get_phrase('data_updated_successfully'));
				redirect(site_url('admin/manage_online_exam'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('make_sure_to_select_valid_class_') . ',' . get_phrase('_section_and_subject'));
				redirect(site_url('admin/manage_online_exam'));
			}
		}
		if ($param1 == 'delete') {
			$this->db->where('online_exam_id', $param2);
			$queryExecuted = $this->db->delete('online_exam');

			//clear the cached database
			$this->db->cache_delete();

			$this->session->set_flashdata('flash_message', get_phrase('data_deleted'));


			if($queryExecuted) {
				$ajaxData['message'] = 'done';
			} else {
				$ajaxData['message'] = 'failed';
			}

			$ajaxData['route'] = 'manage_online_exam';
			
			echo json_encode($ajaxData);
			return;
		}
		$page_data['page_name'] = 'manage_online_exam';
		$page_data['page_title'] = get_phrase('manage_online_exam');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function online_exam_questions_print_view($online_exam_id, $answers) {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$page_data['online_exam_id'] = $online_exam_id;
		$page_data['answers'] = $answers;
		$page_data['page_title'] = get_phrase('questions_print');
		$this->load->view('backend/admin/online_exam_questions_print_view', $page_data);
	}

	function create_online_exam() {
		$page_data['page_name'] = 'add_online_exam';
		$page_data['page_title'] = get_phrase('add_an_online_exam');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function update_online_exam($param1 = "") {
		$page_data['online_exam_id'] = $param1;
		$page_data['page_name'] = 'edit_online_exam';
		$page_data['page_title'] = get_phrase('update_online_exam');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function manage_online_exam_status($online_exam_id = "", $status = "") {
		$this->crud_model->manage_online_exam_status($online_exam_id, $status);

		//clear the cached database
		$this->db->cache_delete();

		redirect(site_url('admin/manage_online_exam'));
	}

	function load_question_type($type, $online_exam_id) {
		$page_data['question_type'] = $type;
		$page_data['online_exam_id'] = $online_exam_id;
		$this->load->view('backend/admin/online_exam_add_' . $type, $page_data);
	}

	function manage_online_exam_question($online_exam_id = "", $task = "", $type = "") {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if ($task == 'add') {
			if ($type == 'multiple_choice') {
				$this->crud_model->add_multiple_choice_question_to_online_exam($online_exam_id);
			} elseif ($type == 'true_false') {
				$this->crud_model->add_true_false_question_to_online_exam($online_exam_id);
			} elseif ($type == 'fill_in_the_blanks') {
				$this->crud_model->add_fill_in_the_blanks_question_to_online_exam($online_exam_id);
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/manage_online_exam_question/' . $online_exam_id));
		}

		$page_data['online_exam_id'] = $online_exam_id;
		$page_data['page_name'] = 'manage_online_exam_question';
		$page_data['page_title'] = $this->db->get_where('online_exam', array('online_exam_id' => $online_exam_id))->row()->title;
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function update_online_exam_question($question_id = "", $task = "", $online_exam_id = "") {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));
		$online_exam_id = $this->db->get_where('question_bank', array('question_bank_id' => $question_id))->row()->online_exam_id;
		$type = $this->db->get_where('question_bank', array('question_bank_id' => $question_id))->row()->type;
		if ($task == "update") {
			if ($type == 'multiple_choice') {
				$this->crud_model->update_multiple_choice_question($question_id);
			} elseif ($type == 'true_false') {
				$this->crud_model->update_true_false_question($question_id);
			} elseif ($type == 'fill_in_the_blanks') {
				$this->crud_model->update_fill_in_the_blanks_question($question_id);
			}

			//clear the cached database
			$this->db->cache_delete();

			redirect(site_url('admin/manage_online_exam_question/' . $online_exam_id));
		}
		$page_data['question_id'] = $question_id;
		$page_data['page_name'] = 'update_online_exam_question';
		$page_data['page_title'] = get_phrase('update_question');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function delete_question_from_online_exam($question_id) {
		$online_exam_id = $this->db->get_where('question_bank', array('question_bank_id' => $question_id))->row()->online_exam_id;
		$queryExecuted = $this->crud_model->delete_question_from_online_exam($question_id);

		//clear the cached database
		$this->db->cache_delete();

		

		if($queryExecuted) {
				$this->session->set_flashdata('flash_message', get_phrase('question_deleted'));
				$ajaxData['message'] = 'done';
			} else {
				$ajaxData['message'] = 'failed';
			}

			$ajaxData['route'] = 'manage_online_exam_question/' . $online_exam_id;
			
			echo json_encode($ajaxData);
			return;

	}

	function manage_multiple_choices_options() {
		$page_data['number_of_options'] = $this->input->post('number_of_options');
		$this->load->view('backend/admin/manage_multiple_choices_options', $page_data);
	}

	function get_sections_for_ssph($class_id) {
		$sections = $this->db->get_where('section', array('class_id' => $class_id))->result_array();
		$options = '';
		foreach ($sections as $row) {
			$options .= '<option value="' . $row['section_id'] . '">' . $row['name'] . '</option>';
		}
		echo '<select class="" name="section_id" id="section_id">' . $options . '</select>';
	}

	function get_students_for_ssph($class_id, $section_id) {
		$enrolls = $this->db->get_where('enroll', array('class_id' => $class_id, 'mute' => '0', 'section_id' => $section_id))->result_array();
		$options = '';
		foreach ($enrolls as $row) {
			$name = $this->db->get_where('student', array('student_id' => $row['student_id']))->row()->name;
			$options .= '<option value="' . $row['student_id'] . '">' . $name . '</option>';
		}
		echo '<select class="" name="student_id" id="student_id">' . $options . '</select>';
	}

	function get_payment_history_for_ssph($student_id) {
		$page_data['student_id'] = $student_id;
		$this->load->view('backend/admin/student_specific_payment_history_table', $page_data);
	}

	function view_online_exam_result($online_exam_id) {
		$page_data['page_name'] = 'view_online_exam_results';
		$page_data['page_title'] = get_phrase('result');
		$page_data['online_exam_id'] = $online_exam_id;
		$this->load->view('backend/main', $page_data);
	}

	//MANAGING BULK STUDENTS ID CARDS VIEW
	function bulk_student_id($param1 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		if ($param1 == 'generate') {
			$data['ids_selected'] = $this->input->post('bulk_ids');

			$this->load->view('backend/admin/print_bulk_id', $data);

		} else {

			$page_data['page_title'] = get_phrase('bulk_student_iD_cards');
			$page_data['page_name'] = 'bulk_student_id';

			$page_data['account_type'] = $this->session->userdata('login_type');
			$this->load->view('backend/main', $page_data);
		}

	}

	//bulk student id cards
	function get_students_for_bulk_id($year, $class_id) {
		$data['year'] = $year;
		$data['class_id'] = $class_id;

		$this->load->view('backend/admin/get_students_for_bulk_id_table', $data);
	}

	//MANAGING BULK STUDENTS RECEIPTS VIEW
	function cft_student_receipt($param1 = '', $param2 = '', $param3 = '', $param4 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		if ($param1 == 'find') {
			$data['ids_selected'] = $this->input->post('bulk_ids');
			$data['class_id'] = $this->input->post('class_id');
			$data['timestamp'] = strtotime($this->input->post('att_date'));

			$this->load->view('backend/admin/print_bulk_receipts', $data);

		} else if ($param1 == 'ajax') {
			$st_id = array();
			array_push($st_id, $param2);
			$data['ids_selected'] = $st_id;
			$data['class_id'] = $param3;
			$data['timestamp'] = $param4;

			$this->load->view('backend/admin/print_bulk_receipts', $data);

		} else {

			$page_data['page_title'] = get_phrase('print_classes,_feeding_fee_payments_and_transport_fare_receipts');
			$page_data['page_name'] = 'classes_feeding_trs_fees';

			//$this->load->view('backend/admin/classes_feeding_trs_fees', $page_data);

			$page_data['account_type'] = $this->session->userdata('login_type');
			$this->load->view('backend/main', $page_data);
		}

	}

	//classes, feeding fee and transport fare receipt
	function get_students_for_bulk_receipt($date, $class_id) {
		$data['date'] = strtotime($date);
		$data['class_id'] = $class_id;

		$this->load->view('backend/admin/get_students_for_bulk_receipt_table', $data);
	}

	//get exam types
	function get_exam_type($term, $year) {
		$exams = $this->db->get_where('exam', array('term' => $term, 'category_id !=' => '1', 'year' => $year));
		$exams_array = $exams->result_array();

		if ($exams->num_rows() < 1) {
			echo ' <option value="">' . get_phrase('no_record_found!') . '</option>';
		} else {
			foreach ($exams_array as $row) {
				echo ' <option value="' . $row["exam_id"] . '">' . $row["name"] . '</option>';
			}
		}
	}

	function get_exam_type_sem($sem, $year) {
		$exams = $this->db->get_where('exam', array('sem' => $sem, 'category_id !=' => '1', 'year' => $year));
		$exams_array = $exams->result_array();

		if ($exams->num_rows() < 1) {
			echo ' <option value="">' . get_phrase('no_record_found!') . '</option>';
		} else {
			foreach ($exams_array as $row) {
				echo ' <option value="' . $row["exam_id"] . '">' . $row["name"] . '</option>';
			}
		}
	}

	//students currently online taking a particular exam
	function get_students_taking_exam($online_exam_id) {
		$data['online_exam_id'] = $online_exam_id;
		$this->load->view('backend/student/online_exam_take', $data);
	}

	//load invoices based on selected year
	function reload_year($invoice_title, $year, $term) {
		$page_data['invoice_title'] = $invoice_title;
		$page_data['year'] = $year;
		$page_data['term'] = $term;
		$this->load->view('backend/admin/invoices_reload', $page_data);
	}

	//load invoices based on selected term
	function reload_term($invoice_title, $year, $term) {
		$page_data['invoice_title'] = $invoice_title;
		$page_data['year'] = $year;
		$page_data['term'] = $term;
		$this->load->view('backend/admin/invoices_reload', $page_data);
	}

	//load invoices based on selected invoice_title
	function reload_invoice_title($student_id, $year, $term, $invoice_title) {
		$page_data['student_id'] = $student_id;
		$page_data['year'] = $year;
		$page_data['term'] = $term;
		$page_data['invoice_title'] = $invoice_title;
		$this->load->view('backend/admin/invoices_reload', $page_data);
	}

	//check if raw_score status is Yes or No
	function get_raw_score_status() {
		$raw_score = $this->db->get_where('settings', array('type' => 'raw_score'))->row()->description;

		if ($raw_score == 'Yes') {
			echo 'Yes';
		}
	}

	//print students info
	function student_information_print($class_id, $running_year, $running_term_sem) {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$page_data['class_id'] = $class_id;
		$page_data['running_year'] = $running_year;
		$page_data['running_term_sem'] = $running_term_sem;
		$page_data['page_name'] = 'student_information_print';
		$this->load->view('backend/admin/student_information_print', $page_data);

	}

	//mobile money payment alert
	function mobile_money_payment_alert_rows() {
		$this->crud_model->mobile_money_payment_alert_rows();

		//clear the cached database
		$this->db->cache_delete();

	}

	function mobile_money_payment_alert_show($page_name) {
		$this->crud_model->mobile_money_payment_alert_show($page_name);

		//clear the cached database
		$this->db->cache_delete();

	}

	function modal_mobile_money_checkout($param = '', $invoice_id, $student_id = '', $page_name = '', $timestamp = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		$currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
		$fmt = new NumberFormatter('en_US', NumberFormatter::CURRENCY);

		if ($param == 'view') {
			$page_data['student_id'] = $student_id;
			$page_data['invoice_id'] = $invoice_id;
			$page_data['page_name'] = $page_name;
			$page_data['timestamp'] = $timestamp;
			$this->load->view('backend/admin/modal_mobile_money_payment', $page_data);
		}

		if ($param == 'confirm_t_id') {

			$this->form_validation->set_rules('confirm_t_id', 'Transaction ID', 'required|trim|max_length[10]|min_length[10]');
			if ($this->form_validation->run() === FALSE) {
				$this->load->view('backend/admin/modal_mobile_money_payment', $page_data);
			} else {
				//do payment
				$active_sms_service = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row()->description;

				$data['invoice_id'] = $this->input->post('invoice_id');
				$data['invoice_code'] = $this->input->post('invoice_code');
				$data['student_id'] = $this->input->post('student_id');
				$data['term'] = $this->input->post('term');
				$data['title'] = strtoupper($this->input->post('title'));
				$data['description'] = $this->input->post('description');
				$data['payment_type'] = 'income';
				$data['payment_method'] = 4;
				$data['amount'] = $this->input->post('amount_paid');
				$data['timestamp'] = $this->input->post('timestamp');
				$data['year'] = $this->input->post('year');
				$this->db->insert('payment', $data);

				$status['status'] = strtolower($this->input->post('status'));
				$this->db->where('invoice_id', $invoice_id);
				$this->db->update('invoice', array('status' => $status['status'], 'payment_timestamp' => $data['timestamp'], 'payment_method' => $data['payment_method']));

				$data2['amount_paid'] = $this->input->post('amount_paid');
				$data2['status'] = strtolower($this->input->post('status'));
				$this->db->where('invoice_id', $invoice_id);
				$this->db->set('amount_paid', 'amount_paid + ' . $data2['amount_paid'], FALSE);
				$this->db->set('due', 'due - ' . $data2['amount_paid'], FALSE);
				$this->db->update('invoice');

				//prepare a text message and send to the parent of the child about the payment
				// sms sending configurations
				$payment_details = $this->db->get_where('invoice', array('student_id' => $data['student_id'], 'invoice_id' => $data['invoice_id'], 'invoice_code' => $data['invoice_code']))->row();

				//get total balance for this invoice code
				$this->db->select_sum('amount');
				$this->db->from('invoice');
				$this->db->where('can_delete !=', 'trash');
				$this->db->where('invoice_code', $data['invoice_code']);
				$this->db->where('student_id', $data['student_id']);
				$this->db->where('term', $data['term']);
				$this->db->where('year', $data['year']);
				$amount_total_array = $this->db->get()->result_array();

				$amount_counter = 0;
				foreach ($amount_total_array as $arow) {
					$amount_counter += $arow['amount'];
				}

				//get total balance for this invoice code
				$this->db->select_sum('amount_paid');
				$this->db->from('invoice');
				$this->db->where('can_delete !=', 'trash');
				$this->db->where('invoice_code', $data['invoice_code']);
				$this->db->where('student_id', $data['student_id']);
				$this->db->where('term', $data['term']);
				$this->db->where('year', $data['year']);
				$amount_due_array = $this->db->get()->result_array();

				$due_counter = 0;
				foreach ($amount_due_array as $arow) {
					$due_counter += $arow['amount_paid'];
				}

				$balance = $payment_details->due;
				$balance_msg = '';
				$title = $data['title'];
				$student_name = $this->db->get_where('student', array('student_id' => $data['student_id']))->row()->name;

				if ($balance == 0) {
					$balance_msg = 'full payment';
				} elseif ($balance > 0) {
					$balance_msg = 'part payment';
				} elseif ($balance < 0) {
					$balance_msg = 'over payment';
				}

				$date = date('d M, Y ');
				// $time     = $this->input->post('payment_time');

				$message = 'Payment of ' . $currency . ' ' . number_format($data['amount'], 2, '.', ',') . ' was received on ' . $date . ' as ' . $balance_msg . ' of ' . $student_name . '\'s ' . $title . ' for term ' . $data['term'] . '. Balance for ' . $title . ' is ' . $currency . ' ' . number_format($balance, 2, '.', ',') . ' and total balance for INVOICE#: ' . $data['invoice_code'] . ' is ' . $currency . ' ' . number_format($amount_counter - $due_counter, 2, '.', ',');

				if ($active_sms_service != 'disabled') {

					$parent_id = $this->db->get_where('student', array('student_id' => $data['student_id']))->row()->parent_id;
					$parent_name = $this->db->get_where('parent', array('parent_id' => $parent_id))->row()->name;
					if ($parent_id != null && $parent_id != 0) {
						$receiver_phone = $this->db->get_where('parent', array('parent_id' => $parent_id))->row()->phone;
						if ($receiver_phone != '' || $receiver_phone != null) {
							$this->sms_model->send_sms($message, $receiver_phone);
							$this->session->set_flashdata('flash_message', get_phrase('payment_notification_was_sent_to_' . $parent_name . '_successfully.'));
						} else {
							$this->session->set_flashdata('error_message', get_phrase('parent\'s_phone_number_is_not_found._it_seems_you_did_not_add_phone_numbers_to_some_parents\'_details'));
						}
					} else {
						$this->session->set_flashdata('error_message', get_phrase('no_parent_was_registered_for_this_student.'));
					}
				} //End of SMS

				//prepare an email message and send to the parent of the child about the payment
				// email sending configurations
				//school's info
				$owner_email = $this->db->get_where('settings', array('type' => 'system_email'))->row()->description;

				$student_name = $this->db->get_where('student', array('student_id' => $data['student_id']))->row()->name;
				$parent_id = $this->db->get_where('student', array('student_id' => $data['student_id']))->row()->parent_id;
				$parent_name = $this->db->get_where('parent', array('parent_id' => $parent_id))->row()->name;

				if ($parent_id != null && $parent_id != 0) {
					$receiver_email = $this->db->get_where('parent', array('parent_id' => $parent_id))->row()->email;
					if ($receiver_email != '' || $receiver_email != null) {
						$this->email_model->do_email($message, 'Payment Notification', $receiver_email, $owner_email);
						$this->session->set_flashdata('flash_message', get_phrase('payment_notification_was_sent_to_' . $parent_name . '_successfully.'));
					} else {
						$this->session->set_flashdata('error_message', get_phrase('parent\'s_email_not_found._it_seems_you_did_not_add_phone_numbers_to_some_parents\'_details'));
					}
				} else {
					$this->session->set_flashdata('error_message', get_phrase('no_parent_was_not_found_for_some_students.'));
				} //End of Email

				//delete the payment request from mobile_money_payment table
				$this->db->where('invoice_id', $invoice_id);
				$this->db->where('timestamp', $data['timestamp']);
				$queryExecuted = $this->db->delete('mobile_money_payment');

				//clear the cached database
				$this->db->cache_delete();

				$this->session->set_flashdata('flash_message', get_phrase('payment_successful'));

				if($queryExecuted) {
					$ajaxData['message'] = 'done';
				} else {
					$ajaxData['message'] = 'failed';
				}

				$ajaxData['route'] = $page_name;
				
				echo json_encode($ajaxData);
				return;

			}

		}
	}

	//Transaction ID confirmation via ajax
	function confirm_transaction($student_id, $invoice_id, $parent_t_id, $admin_t_id) {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		$this->crud_model->confirm_transaction($student_id, $invoice_id, $parent_t_id, $admin_t_id);

		//clear the cached database
		$this->db->cache_delete();

	}

	function all_students($running_year, $running_term, $running_sem = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$page_data['page_name'] = 'all_students';
		$page_data['running_year'] = $running_year;
		$page_data['running_term'] = $running_term;
		$page_data['running_sem'] = $running_sem;
		$this->load->view('backend/admin/all_students', $page_data);
	}

	// AJAX endpoint for filtered students table
	function get_filtered_students() {
		// Allow AJAX requests
		header('Content-Type: application/json');
		
		$running_year = $this->input->post('year');
		$running_term = $this->input->post('term');
		$filter_residence = $this->input->post('residence');
		$filter_class = $this->input->post('class');
		$filter_gender = $this->input->post('gender');

		$allClassesIds = getAllClassList();
		$grand_total = 0;
		$n_female = 0;
		$n_male = 0;
		$n_unknown = 0;

		$html = '';

		foreach($allClassesIds as $class_id) {
			// Check class filter first - skip if class doesn't match
			if (!empty($filter_class)) {
				$current_class_name = getFullClassName($class_id);
				if ($current_class_name !== $filter_class) {
					continue; // Skip this class entirely
				}
			}

			$class_female = 0;
			$class_male = 0;
			$class_unknown = 0;

			// Build query with filters
			$this->db->select('enroll.student_id, name');
			$this->db->distinct();
			$this->db->from('enroll');
			$this->db->where('class_id', $class_id);
			$this->db->where('year', $running_year);
			$this->db->where('term', $running_term);
			$this->db->where('enroll.mute', '0');
			$this->db->order_by('sex', 'desc');
			$this->db->order_by('name', 'asc');
			$this->db->join('student', 'student.student_id = enroll.student_id');

			// Apply filters at database level
			if (!empty($filter_residence)) {
				$this->db->where('enroll.residence_type', $filter_residence);
			}
			if (!empty($filter_gender)) {
				$this->db->where('student.sex', $filter_gender);
			}

			$students_ids = $this->db->get()->result_array();

			// Only show class if it has matching students
			if(count($students_ids) > 0) {
				// Class header
				$html .= '<tr>';
				$html .= '<td colspan="10">';
				$html .= '<h4 style="color: #000">'.getFullClassName($class_id).'</h4>';
				$html .= '<span class="text-muted">Male:</span> <span class="ml-5 text-muted">##MALE##</span> | ';
				$html .= '<span class="text-muted">Female:</span> <span class="ml-5 text-muted">##FEMALE##</span> | ';
				$html .= '<span class="text-muted">Unknown:</span> <span class="ml-5 text-muted">##UNKNOWN##</span>';
				$html .= '</td>';
				$html .= '</tr>';

				$sn = 1;
				foreach ($students_ids as $row) {
					$section_id = $this->db->get_where('enroll', array('student_id'=>$row['student_id'], 'class_id' => $class_id))->row()->section_id;
					$student_info = $this->db->get_where('student', array('student_id' => $row['student_id']))->row();
					$gender = $student_info->sex;
					$sGender = strtolower($gender);

					if($sGender == 'female') {
						$n_female++;
						$class_female++;
					} else if($sGender == 'male') {
						$n_male++;
						$class_male++;
					} else {
						$n_unknown++;
						$class_unknown++;
					}

					$residence_type = $this->crud_model->getStudentCurrentEnrollmentStatusRow($row['student_id'])->residence_type;

					$html .= '<tr class="student-row">';
					$html .= '<td>'.$sn.'</td>';
					$html .= '<td style="white-space: nowrap;">'.$student_info->student_code.'</td>';
					$html .= '<td class="photo-column"><img src="'.$this->crud_model->get_image_url('student',$row['student_id'], $gender).'" class="img-circle" width="40" height="40" /></td>';
					$html .= '<td class="al">'.$row['name'].'</td>';
					$html .= '<td class="al">'.$gender.'</td>';
					$html .= '<td class="al" width="110">'.$student_info->address.'</td>';
					$html .= '<td class="al">'.$residence_type.'</td>';

					// Date of birth
					$bdate = $student_info->birthday;
					$bdate_formatted = '';
					if(!empty($bdate) && $bdate != '0000-00-00') {
						$bdate_create = date_create($bdate);
						if($bdate_create !== false) {
							$bdate_formatted = date_format($bdate_create, 'M d, Y');
						}
					}
					$html .= '<td>'.$bdate_formatted.'</td>';

					// Parent info
					$parent_id = $student_info->parent_id;
					$parent_info = $this->db->get_where('parent', array('parent_id' => $parent_id))->row();
					$html .= '<td class="al">'.($parent_info ? $parent_info->name : '').'</td>';
					$html .= '<td class="al" width="50">'.($parent_info ? $parent_info->phone : '').'</td>';
					$html .= '</tr>';

					$sn++;
					$grand_total++;
				}

				// Replace placeholders with actual counts
				$html = str_replace('##MALE##', number_format($class_male, 0, '.', ','), $html);
				$html = str_replace('##FEMALE##', number_format($class_female, 0, '.', ','), $html);
				$html = str_replace('##UNKNOWN##', number_format($class_unknown, 0, '.', ','), $html);
			}
		}

		// Total row
		$html .= '<tr>';
		$html .= '<td><strong>Total:</strong></td>';
		$html .= '<td colspan="9" style="text-align: left"><strong>'.$grand_total.' Students currently enrolled.</strong></td>';
		$html .= '</tr>';

		echo json_encode(array(
			'status' => 'success',
			'html' => $html,
			'total' => $grand_total,
			'male' => $n_male,
			'female' => $n_female,
			'unknown' => $n_unknown
		));
	}

	function students_gender_report() {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$page_data['page_name'] = 'students_gender_report';
		// Get filter parameters from GET request
		$year = $this->input->get('year');
		$term = $this->input->get('term');
		
		// Use filtered values or default to running year/term
		$page_data['running_year'] = !empty($year) ? $year : get_settings('running_year');
		$page_data['running_term'] = !empty($term) ? $term : get_settings('running_term');
		$this->load->view('backend/admin/students_gender_report', $page_data);
	}


function parents_gender_report() {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));
	
		$this->load->view('backend/admin/parents_gender_report');
	}

	function teachers_gender_report() {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$this->load->view('backend/admin/teachers_gender_report');
	}

	function notifications($page_name, $marked_read = '', $user_id = '', $logged_in_id = '') {
		$this->crud_model->notifications($page_name, $marked_read, $user_id, $logged_in_id);

		//clear the cached database
		$this->db->cache_delete();

	}

	function notifications_rows($marked_read = '', $user_id = '', $logged_in_id = '') {
		$this->crud_model->notifications_rows($marked_read, $user_id, $logged_in_id);

		//clear the cached database
		$this->db->cache_delete();

	}

	function deleted_messages_id($message_id) {
		/** $file_name = '_al01i/v_l02i/backend/admin/deleted_messages_id.php';**/
		$message_id = $message_id;


		if(file_exists($file_name)) {
		file_put_contents($file_name, $message_id, FILE_APPEND);
		}else {
		file_put_contents($file_name, $message_id);
		} 
	}

	function get_deleted_messages_id() {
		$file_name = '_al01i/v_l02i/backend/admin/deleted_messages_id.php';
		$ids = file_get_contents($file_name);
		$ids_explode = explode(',', $ids);

		echo $ids;
	}

	function auth_update() {
		$students = $this->db->get('student')->result_array();
		foreach ($students as $row) {
			//student auth (key) validation

			for ($i = 1; $i <= 10; $i++) {
				$authentication_key = substr(sha1(md5(mt_rand(1034200000, 1039999999))), 0, 5);
				$auth_validation = auth_validation_insert($authentication_key);
				while (!$auth_validation) {
					$authentication_key = substr(sha1(md5(mt_rand(1034200000, 1039999999))), 0, 5);
					$auth_validation = auth_validation_insert($authentication_key);
				}

				$this->db->set('authentication_key', $authentication_key);
				$this->db->where('student_id', $i);
				$this->db->update('student');
			}

		}

		//clear the cached database
		$this->db->cache_delete();

		redirect(site_url('admin/dashboard'));

	}

	//check internal messaging alert
	function check_internal_m($current_user) {
		$this->crud_model->check_internal_m($current_user);

		//clear the cached database
		$this->db->cache_delete();

	}

	//check internal messaging alert2
	function internal_m($current_user) {
		$this->crud_model->internal_m($current_user);

		//clear the cached database
		$this->db->cache_delete();

	}

	//add invoice item to the list
	function add_invoice_item($type = '') {
		$data['type'] = $type;
		$data['bill_item'] = $this->input->get('bill_items_array');
		$this->load->view('backend/admin/add_invoice_item', $data);

		//clear the cached database
		$this->db->cache_delete();

	}

	//add invoice item to the list for mass invoice
	function add_mass_invoice_item($type = '') {
		$data['type'] = $type;
		$data['bill_item'] = $this->input->get('bill_items_array');
		$data['class_ids'] = $this->input->get('class_ids'); // Pass class IDs for filtering
		$this->load->view('backend/admin/add_mass_invoice_item', $data);

		//clear the cached database
		$this->db->cache_delete();

	}

	//add invoice item to the list for mass invoice modification
	function add_list_invoice_item($type = '') {
		$data['type'] = $type;
		$data['bill_item'] = $this->input->get('bill_items_array');
		$this->load->view('backend/admin/add_invoice_item_list', $data);

		//clear the cached database
		$this->db->cache_delete();

	}

	function clone_previous_bill_dummy($type='') {
		//$data['class_id'] = $class_id;
		$data['class_ids_array'] = $this->input->get('class_data');
		$data['type'] = $type;
		$this->load->view('backend/admin/clone_previous_bill', $data);

		//clear the cached database
		$this->db->cache_delete();

	}

	/**function backup() {
		        //if ($this->session->userdata('admin_login') != 1)
		            //redirect(site_url('login'));

		        $this->session->set_userdata('top_menu', 'System Settings');
		        $this->session->set_userdata('sub_menu', 'admin/backup');
		        $data['title'] = 'Backup History';
		        if ($this->input->server('REQUEST_METHOD') == "POST") {
		            if ($this->input->post('backup') == "upload") {
		                $this->form_validation->set_rules('file', 'Image', 'callback_handle_upload');
		                if ($this->form_validation->run() == FALSE) {

		                } else {
		                    if (isset($_FILES["file"]) && !empty($_FILES['file']['name'])) {
		                        $fileInfo = pathinfo($_FILES["file"]["name"]);
		                        $file_name = "db-" . date("Y-m-d_H-i-s") . ".sql";
		                        move_uploaded_file($_FILES["file"]["tmp_name"], "./backup/temp_uploaded/" . $file_name);
		                        $folder_name = 'temp_uploaded';
		                        $path = './backup/';
		                        $file_restore = $this->load->file($path . $folder_name . '/' . $file_name, true);
		                        $file_array = explode(';', $file_restore);
		                        foreach ($file_array as $query) {
		                            $trimQuery1 = trim($query);
		                            if (!empty($trimQuery1)) {
		                                $this->db->query("SET FOREIGN_KEY_CHECKS = 0");
		                                $this->db->query($query);
		                                $this->db->query("SET FOREIGN_KEY_CHECKS = 1");
		                            }
		                        }
		                        $this->session->set_flashdata('msg', '<div class="alert alert-success text-left">Backup restored successfully!</div>');
		                        redirect('admin/backup');
		                    }
		                }
		            }
		            if ($this->input->post('backup') == "backup") {
		                $this->session->set_flashdata('msg', '<div class="alert alert-success text-left">Backup created successfully!</div>');
		                $this->load->dbutil();
		                $filename = "db-" . date("Y-m-d_H-i-s") . ".sql";
		                $prefs = array(
		                    'ignore' => array(),
		                    'format' => 'txt',
		                    'filename' => 'mybackup.sql',
		                    'add_drop' => TRUE,
		                    'add_insert' => TRUE,
		                    'newline' => "\n"
		                );
		                $backup = $this->dbutil->backup($prefs);
		                write_file('./backup/database_backup/' . $filename, $backup);
		                redirect('admin/backup');
		                force_download($filename, $backup);
		                $this->session->set_flashdata('feedback', 'Success message for client to see');
		                redirect('admin/backup');
		            } else if ($this->input->post('backup') == "restore") {
		                $folder_name = 'database_backup';
		                $file_name = $this->input->post('filename');
		                $path = './backup/';
		                $filePath = $path . $folder_name . '/' . $file_name;
		                $file_restore = $this->load->file($path . $folder_name . '/' . $file_name, true);
		                $db = (array) get_instance()->db;
		                $conn = mysqli_connect('localhost', $db['username'], $db['password'], $db['database']);

		                $sql = '';
		                $error = '';

		                if (file_exists($filePath)) {
		                    $lines = file($filePath);

		                    foreach ($lines as $line) {

		                        // Ignoring comments from the SQL script
		                        if (substr($line, 0, 2) == '--' || $line == '') {
		                            continue;
		                        }

		                        $sql .= $line;

		                        if (substr(trim($line), - 1, 1) == ';') {
		                            $result = mysqli_query($conn, $sql);
		                            if (!$result) {
		                                $error .= mysqli_error($conn) . "\n";
		                            }
		                            $sql = '';
		                        }
		                    } // end foreach
		                    // if ($error) {
		                    //    $msg=$error;
		                    // } else {
		                    $msg = "Backup restored successfully!";

		                    // }
		                } // end if file exists
		                $this->session->set_flashdata('msg', '<div class="alert alert-success text-left">' . $msg . '</div>');
		                redirect('admin/backup');
		            }
		        }
		        $dir = "./backup/database_backup/";
		        $result = array();
		        $cdir = scandir($dir);
		        foreach ($cdir as $key => $value) {
		            if (!in_array($value, array(".", ".."))) {
		                if (is_dir($dir . DIRECTORY_SEPARATOR . $value)) {
		                    $result[$value] = dirToArray($dir . DIRECTORY_SEPARATOR . $value);
		                } else {
		                    $result[] = $value;
		                }
		            }
		        }
		        $data['dbfileList'] = $result;
		       // $setting_result = $this->setting_model->get();
		        //$data['settinglist'] = $setting_result;
		        $data['page_name'] = 'backup';
		        $data['page_title'] = 'Backup / Restore';
		        $this->load->view('backend/main', $data);

	*/

	//students for exam to send sms to parent
	function get_students_for_exam($class_id) {

		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;

		$students_info = $this->db->get_where('enroll', array('year' => $running_year, 'mute' => '0', 'term' => $running_term, 'class_id' => $class_id))->result_array();

		if ($class_id != '') {
			foreach ($students_info as $row):

				echo '<option value="' . $row['student_id'] . '">' . $this->db->get_where('student', array('student_id' => $row['student_id']))->row()->name . '</option>';
			endforeach;
		}
	}

	//for importing subjects
	function do_subjects_import($new_class_id, $old_class_id, $year, $term, $class_name = '') {
		$this->crud_model->do_subjects_import($new_class_id, $old_class_id, $year, $term, $class_name);
	}

	//for importing subjects mass
	function do_subjects_import_mass($fromTem='') {
		$this->crud_model->do_subjects_import_mass($fromTem);
	}

	//for importing subjects creche
	function do_subjects_import_creche($new_class_id, $old_class_id, $year, $term) {
		$this->crud_model->do_subjects_import_creche($new_class_id, $old_class_id, $year, $term);
	}

	//for importing subjects mass creche
	function do_subjects_import_mass_creche($fromTem='') {
		$this->crud_model->do_subjects_import_mass_creche($fromTem);
	}

	//for creche subject update according to category
	function update_subjects_creche($cat_id, $class_id) {
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;

		$subjects = $this->db->get_where('subject_creche', array('category_id' => $cat_id, 'class_id' => $class_id, 'year' => $running_year, 'term' => $running_term))->result_array();

		foreach ($subjects as $row) {
			echo '<option value="' . $row['subject_id'] . '">' . $row['name'] . '</option>';
		}
	}

	//receipt
	function receipt($receipt_code, $student_id, $total_amount_paid, $date_time, $total_amount_payable=0) {
		$data['receipt_code'] = $receipt_code;
		//$data['invoice_code'] = $invoice_code;
		$data['student_id'] = $student_id;
		//$data['year'] = $year;
		//$data['term'] = $term;
		$data['total_amount_paid'] = $total_amount_paid;
		$data['date'] = $date_time;
		$data['total_amount_payable'] = $total_amount_payable;

		$receipt_style = $this->db->get_where('settings' , array('type'=>'receipt_style'))->row()->description;

		if($receipt_style == 'style_1') {
			$this->load->view('backend/admin/receipt', $data);

		} else if($receipt_style == 'style_2') {
			$this->load->view('backend/admin/receipt_2', $data);

		} else if($receipt_style == 'style_3') {
			$this->load->view('backend/admin/receipt_3', $data);
		}

	}

	//fct receipt
	function fct_receipt($receipt_code, $student_id, $total_amount_paid, $date_time) {
		$data['receipt_code'] = $receipt_code;
		//$data['invoice_code'] = $invoice_code;
		$data['student_id'] = $student_id;
		//$data['year'] = $year;
		//$data['term'] = $term;
		$data['total_amount_paid'] = $total_amount_paid;
		$data['date'] = $date_time;


		$this->load->view('backend/admin/fct_receipt', $data);
		
	}

	function pos_rec() {
		$this->receipt_model->print_in_thermal();
	}

	function beneficiary_checker($id) {
		$benefit_status = $this->db->get_where('student', array(
			'student_id' => $id))->row()->benefit_status;


		if ($benefit_status == 0) {
			echo 'no';
		} else {
			echo 'yes';
		}
	}


	

	//view the ips of those who visited the site
	function visitor_tracker() {
		$page_data['page_name'] = 'tracker';
		$page_data['page_title'] = 'Visitor Tracker';
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	private function get_student_fee($student_id, $fee_type) {
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		// Check beneficiary_list first (if table exists)
		if($this->db->table_exists('beneficiary_list')) {
			$beneficiary = $this->db->get_where('beneficiary_list', array(
				'student_id' => $student_id,
				'year' => $running_year,
				'term' => $running_term
			))->row();
			
			if ($beneficiary) {
				$categories = json_decode($beneficiary->categories, true);
				$total_amount = 0;
				foreach($categories as $cat) {
					$total_amount += $fee_type == 'feeding' ? $cat['feeding_amount'] : $cat['classes_amount'];
				}
				return $total_amount > 0 ? $total_amount : null;
			}
		}
		
		// Fallback to old method for backward compatibility
		$student = $this->db->get_where('student', array('student_id' => $student_id))->row();
		if ($student->benefit_status != 0) {
			$category = $this->db->get_where('benefit_category', array('category_id' => $student->benefit_status))->row();
			return $fee_type == 'feeding' ? $category->feeding_charge : $category->classes_charge;
		}
		return null;
	}

	function beneficiary($param1 = '') {

		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		$running_sem = $this->db->get_where('settings', array('type' => 'running_sem'))->row()->description;

		// Migration endpoint
		if($param1 == 'migrate_to_new_system') {
			$this->migrate_beneficiaries_to_new_table();
			return;
		}

		// Check if beneficiary_list table exists
		if(!$this->db->table_exists('beneficiary_list')) {
			// Fallback to old system
			$page_data['beneficiaries'] = $this->db->get_where('student', array('benefit_status !=' => 0))->result_array();
		} else {
			$this->db->select('beneficiary_list.*, student.name, student.student_code');
			$this->db->from('beneficiary_list');
			$this->db->join('student', 'student.student_id = beneficiary_list.student_id');
			$this->db->where('beneficiary_list.year', $running_year);
			$this->db->where('beneficiary_list.term', $running_term);
			$page_data['beneficiaries'] = $this->db->get()->result_array();
		}

		$page_data['running_year'] = $running_year;
		$page_data['running_term'] = $running_term;
		$page_data['running_sem'] = $running_sem;
		$page_data['page_name'] = 'benefit_categories';
		$page_data['page_title'] = 'BENEFICIARIES';

		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Migration function to move existing beneficiaries to new table
	private function migrate_beneficiaries_to_new_table() {
		// Create table if not exists
		if(!$this->db->table_exists('beneficiary_list')) {
			$this->db->query("CREATE TABLE IF NOT EXISTS `beneficiary_list` (
				`id` int(11) NOT NULL AUTO_INCREMENT,
				`student_id` int(11) NOT NULL,
				`class_id` int(11) NOT NULL,
				`year` varchar(10) NOT NULL,
					erm` varchar(5) NOT NULL,
				`categories` text NOT NULL,
				`created_at` int(11) NOT NULL,
				`updated_at` int(11) DEFAULT NULL,
				PRIMARY KEY (`id`),
				KEY `student_id` (`student_id`),
				KEY `year_term` (`year`,	erm`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8");
		}
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		// Get all students with benefit_status
		$students = $this->db->get_where('student', array('benefit_status !=' => 0))->result_array();
		$migrated = 0;
		$skipped = 0;
		
		foreach($students as $student) {
			// Get student's current class
			$enroll = $this->db->get_where('enroll', array(
				'student_id' => $student['student_id'],
				'year' => $running_year,
				'term' => $running_term,
				'mute' => '0'
			))->row();
			
			if(!$enroll) continue;
			
			// Check if already migrated
			$exists = $this->db->get_where('beneficiary_list', array(
				'student_id' => $student['student_id'],
				'year' => $running_year,
				'term' => $running_term
			))->row();
			
			if($exists) {
				$skipped++;
				continue;
			}
			
			// Build categories data
			$category_ids = explode(',', $student['benefit_status']);
			$categories_data = array();
			
			foreach($category_ids as $cat_id) {
				if(empty($cat_id)) continue;
				$category = $this->db->get_where('benefit_category', array('category_id' => $cat_id))->row();
				if($category) {
					$categories_data[] = array(
						'category_id' => $cat_id,
						'feeding_amount' => $category->feeding_charge,
						'classes_amount' => $category->classes_charge,
						'tuition_amount' => isset($category->tuition_charge) ? $category->tuition_charge : 0
					);
				}
			}
			
			if(empty($categories_data)) continue;
			
			// Insert into beneficiary_list
			$this->db->insert('beneficiary_list', array(
				'student_id' => $student['student_id'],
				'class_id' => $enroll->class_id,
				'year' => $running_year,
				'term' => $running_term,
				'categories' => json_encode($categories_data),
				'created_at' => time()
			));
			
			$migrated++;
		}
		
		$this->session->set_flashdata('flash_message', "Migration completed: {$migrated} beneficiaries migrated, {$skipped} skipped (already exists)");
		redirect(site_url('admin/beneficiary'));
	}

	function benefit_category($param1 = '', $param2 = '', $param3 = '', $param4 = '', $param5 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));
		if ($param1 == 'create') {
			$data['name'] = strtoupper($this->input->post('cat_name'));
			
			$discount_type = $this->input->post('discount_type') ?: 'percentage';
			$class_ids = $this->input->post('class_ids');
			$feeding_charges = $this->input->post('feeding_charges');
			$classes_charges = $this->input->post('classes_charges');
			$tuition_charges = $this->input->post('tuition_charges');
			
			$details = array(
				'discount_type' => $discount_type,
				'classes' => array()
			);
			
			if($class_ids && is_array($class_ids)) {
				foreach($class_ids as $index => $class_id) {
					$key = ($class_id === '0' || $class_id === 0) ? 'a' : $class_id;
					$details['classes'][$key] = array(
						'feeding_charged' => floatval($feeding_charges[$index] ?? 0),
						'classes_charged' => floatval($classes_charges[$index] ?? 0),
						'tuition_charged' => floatval($tuition_charges[$index] ?? 0)
					);
				}
			}
			
			$data['details'] = json_encode($details);
			$data['created_by'] = $this->session->userdata('admin_id');
			$data['created_at'] = time();
			$this->db->insert('benefit_category', $data);
			$new_id = $this->db->insert_id();

			// ADD AUDIT TRAIL
			$this->log_benefit_category_audit($new_id, 'created', null, $data);

			echo 'done';
			return;
		}
		if ($param1 == 'do_update') {
			// Get old values for audit
			$old = $this->db->get_where('benefit_category', array('category_id' => $param2))->row_array();

			$data['name'] = strtoupper($this->input->post('cat_name'));
			
			$discount_type = $this->input->post('discount_type') ?: 'percentage';
			$class_ids = $this->input->post('class_ids');
			$feeding_charges = $this->input->post('feeding_charges');
			$classes_charges = $this->input->post('classes_charges');
			$tuition_charges = $this->input->post('tuition_charges');
			
			$details = array(
				'discount_type' => $discount_type,
				'classes' => array()
			);
			
			if($class_ids && is_array($class_ids)) {
				foreach($class_ids as $index => $class_id) {
					$key = ($class_id === '0' || $class_id === 0) ? 'a' : $class_id;
					$details['classes'][$key] = array(
						'feeding_charged' => floatval($feeding_charges[$index] ?? 0),
						'classes_charged' => floatval($classes_charges[$index] ?? 0),
						'tuition_charged' => floatval($tuition_charges[$index] ?? 0)
					);
				}
			}
			
			$data['details'] = json_encode($details);
			$data['updated_at'] = time();
			$this->db->where('category_id', $param2);
			$this->db->update('benefit_category', $data);

			// ADD AUDIT TRAIL
			$this->log_benefit_category_audit($param2, 'updated', $old, $data);

			// Update amounts in beneficiary_list for current term
			if($this->db->table_exists('beneficiary_list') && !empty($details['classes'])) {
				$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
				$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
				
				$beneficiaries = $this->db->get_where('beneficiary_list', array(
					'year' => $running_year,
					'term' => $running_term
				))->result_array();
			
				foreach($beneficiaries as $ben) {
					$categories = json_decode($ben['categories'], true);
					$updated = false;
					
					foreach($categories as &$cat) {
						if($cat['category_id'] == $param2) {
							$class_id = $ben['class_id'];
							$class_data = isset($details['classes'][$class_id]) ? $details['classes'][$class_id] : (isset($details['classes']['a']) ? $details['classes']['a'] : null);
							if($class_data) {
								$cat['feeding_amount'] = $class_data['feeding_charged'];
								$cat['classes_amount'] = $class_data['classes_charged'];
								$cat['tuition_amount'] = $class_data['tuition_charged'];
								$updated = true;
							}
						}
					}
					
					if($updated) {
						$this->db->where('id', $ben['id']);
						$this->db->update('beneficiary_list', array(
							'categories' => json_encode($categories),
							'updated_at' => time()
						));
					}
				}
			}

			echo 'done';
			return;
		}
		if ($param1 == 'delete') {
			// Get old values for audit
			$old = $this->db->get_where('benefit_category', array('category_id' => $param2))->row_array();

			$this->db->where('category_id', $param2);
			$this->db->delete('benefit_category');

			// ADD AUDIT TRAIL
			$this->log_benefit_category_audit($param2, 'deleted', $old, null);

			echo 'done';
			return;
		}
		if ($param1 == 'get_edit_form') {
			$category = $this->db->get_where('benefit_category', array('category_id' => $param2))->row_array();
			if(!$category) {
				echo 'Category not found';
				return;
			}
			
			$details_json = isset($category['details']) && !empty($category['details']) ? json_decode($category['details'], true) : [];
			$all_classes = $this->db->get('class')->result_array();
			
			// Convert new JSON structure to array format
			$details = [];
			if(isset($details_json['classes'])) {
				foreach($details_json['classes'] as $class_id => $charges) {
					$details[] = array(
						'class_id' => $class_id,
						'feeding_charge' => $charges['feeding_charged'] ?? 0,
						'classes_charge' => $charges['classes_charged'] ?? 0,
						'tuition_charge' => $charges['tuition_charged'] ?? 0
					);
				}
			}
			
			if(empty($details)) {
				$details = [['class_id' => '0', 'feeding_charge' => 0, 'classes_charge' => 0, 'tuition_charge' => 0]];
			}
			
			$any_feeding = false;
			$any_classes = false;
			$any_tuition = false;
			foreach($details as $detail) {
				if(isset($detail['feeding_charge']) && $detail['feeding_charge'] > 0) $any_feeding = true;
				if(isset($detail['classes_charge']) && $detail['classes_charge'] > 0) $any_classes = true;
				if(isset($detail['tuition_charge']) && $detail['tuition_charge'] > 0) $any_tuition = true;
			}
			
			$discount_type = isset($details_json['discount_type']) ? $details_json['discount_type'] : 'percentage';
			
			$html = '<div id="edit_details_'.$param2.'" style="min-width: 600px; width: 100%;">';
			$html .= '<div class="row mb-3">';
			$html .= '<div class="col-md-12"><label class="font-semibold">Discount Type</label>';
			$html .= '<select class="form-input-modern" id="edit_discount_type_'.$param2.'" style="max-width: 200px;">';
			$html .= '<option value="percentage" '.($discount_type == 'percentage' ? 'selected' : '').'>Percentage (%)</option>';
			$html .= '<option value="fixed" '.($discount_type == 'fixed' ? 'selected' : '').'>Fixed Amount</option>';
			$html .= '</select></div></div>';
			$html .= '<div class="row mb-3">';
			$html .= '<div class="col-md-3"><label class="font-semibold">Class</label></div>';
			$html .= '<div class="col-md-3"><input type="checkbox" id="edit_feeding_master_'.$param2.'" onchange="toggle_edit_column_fees(\'feeding\', '.$param2.')" '.($any_feeding ? 'checked' : '').'> <label class="font-semibold">Feeding Fee</label></div>';
			$html .= '<div class="col-md-2"><input type="checkbox" id="edit_classes_master_'.$param2.'" onchange="toggle_edit_column_fees(\'classes\', '.$param2.')" '.($any_classes ? 'checked' : '').'> <label class="font-semibold">Classes Fee</label></div>';
			$html .= '<div class="col-md-2"><input type="checkbox" id="edit_tuition_master_'.$param2.'" onchange="toggle_edit_column_fees(\'tuition\', '.$param2.')" '.($any_tuition ? 'checked' : '').'> <label class="font-semibold">Tuition Fee</label></div>';
			$html .= '<div class="col-md-2"></div>';
			$html .= '</div>';
			
			foreach($details as $index => $detail) {
				$has_feeding = isset($detail['feeding_charge']);
				$has_classes = isset($detail['classes_charge']);
				$has_tuition = isset($detail['tuition_charge']);
				
				$html .= '<div class="row mb-2 edit-class-row">';
				$html .= '<div class="col-md-3">';
				$html .= '<select class="form-input-modern edit-class-select" style="min-width: 150px;" required>';
				$html .= '<option value="">Select Class</option>';
				$html .= '<option value="0" '.($detail['class_id'] == 0 ? 'selected' : '').'>All Classes</option>';
				foreach($all_classes as $class) {
					$selected = ($detail['class_id'] == $class['class_id']) ? 'selected' : '';
					$html .= '<option value="'.$class['class_id'].'" '.$selected.'>'.$class['name'].' '.$class['name_numeric'].'</option>';
				}
				$html .= '</select></div>';
				
				$html .= '<div class="col-md-3">';
				$html .= '<input type="number" step="0.01" class="form-input-modern edit-feeding-input edit-feeding-input-'.$param2.'" style="min-width: 120px;" placeholder="0.00" value="'.($has_feeding ? $detail['feeding_charge'] : '0.00').'" '.($has_feeding ? '' : 'disabled').'>';
				$html .= '</div>';
				
				$html .= '<div class="col-md-2">';
				$html .= '<input type="number" step="0.01" class="form-input-modern edit-classes-input edit-classes-input-'.$param2.'" style="min-width: 100px;" placeholder="0.00" value="'.($has_classes ? $detail['classes_charge'] : '0.00').'" '.($has_classes ? '' : 'disabled').'>';
				$html .= '</div>';
				
				$html .= '<div class="col-md-2">';
				$html .= '<input type="number" step="0.01" class="form-input-modern edit-tuition-input edit-tuition-input-'.$param2.'" style="min-width: 100px;" placeholder="0.00" value="'.($has_tuition ? $detail['tuition_charge'] : '0.00').'" '.($has_tuition ? '' : 'disabled').'>';
				$html .= '</div>';
				
				$html .= '<div class="col-md-2">';
				$html .= '<button type="button" class="btn btn-sm btn-danger w-100" onclick="$(this).closest(\'.edit-class-row\').remove()" style="border-radius: 8px;"><i class="fa fa-trash"></i></button>';
				$html .= '</div></div>';
			}
			
			$html .= '<div class="row mt-3">';
			$html .= '<div class="col-md-12">';
			$html .= '<button type="button" id="add_btn_'.$param2.'" class="btn btn-success" onclick="add_edit_class_row_'.$param2.'()" style="border-radius: 8px;"><i class="fa fa-plus"></i> Add Class</button>';
			$html .= '</div></div>';
			$html .= '</div>';
			
			$classes_json = json_encode($all_classes);
			$html .= '<script>';
			$html .= '(function(){';
			$html .= 'var allClasses = '.$classes_json.';';
			$html .= 'var catId = '.$param2.';';
			$html .= 'window.add_edit_class_row_'.$param2.' = function() {';
			$html .= '  var feedingEnabled = $("#edit_feeding_master_" + catId).prop("checked");';
			$html .= '  var classesEnabled = $("#edit_classes_master_" + catId).prop("checked");';
			$html .= '  var tuitionEnabled = $("#edit_tuition_master_" + catId).prop("checked");';
			$html .= '  var selectedClasses = [];';
			$html .= '  $("#edit_details_" + catId + " .edit-class-select").each(function(){ var v = $(this).val(); if(v) selectedClasses.push(v); });';
			$html .= '  var newRow = $("<div>").addClass("row mb-2 edit-class-row");';
			$html .= '  var selectCol = $("<div>").addClass("col-md-3");';
			$html .= '  var select = $("<select>").addClass("form-input-modern edit-class-select").attr({"style":"min-width:150px","required":true});';
			$html .= '  select.append($("<option>").val("").text("Select Class"));';
			$html .= '  if(selectedClasses.indexOf("0") === -1) select.append($("<option>").val("0").text("All Classes"));';
			$html .= '  $.each(allClasses, function(i, cls) {';
			$html .= '    if(selectedClasses.indexOf(cls.class_id.toString()) === -1) select.append($("<option>").val(cls.class_id).text(cls.name + " " + cls.name_numeric));';
			$html .= '  });';
			$html .= '  select.on("change", function(){ $("button[onclick*=\"add_edit_class_row_" + catId + "\"]").prop("disabled", false); });';
			$html .= '  selectCol.append(select);';
			$html .= '  var feedingCol = $("<div>").addClass("col-md-3").append($("<input>").attr({"type":"number","step":"0.01","placeholder":"0.00","value":"0.00","style":"min-width:120px","disabled":!feedingEnabled}).addClass("form-input-modern edit-feeding-input edit-feeding-input-" + catId));';
			$html .= '  var classesCol = $("<div>").addClass("col-md-2").append($("<input>").attr({"type":"number","step":"0.01","placeholder":"0.00","value":"0.00","style":"min-width:100px","disabled":!classesEnabled}).addClass("form-input-modern edit-classes-input edit-classes-input-" + catId));';
			$html .= '  var tuitionCol = $("<div>").addClass("col-md-2").append($("<input>").attr({"type":"number","step":"0.01","placeholder":"0.00","value":"0.00","style":"min-width:100px","disabled":!tuitionEnabled}).addClass("form-input-modern edit-tuition-input edit-tuition-input-" + catId));';
			$html .= '  var btnCol = $("<div>").addClass("col-md-2").append($("<button>").attr({"type":"button","style":"border-radius:8px"}).addClass("btn btn-sm btn-danger w-100").html("<i class=\"fa fa-trash\"></i>").click(function(){$(this).closest(".edit-class-row").remove();}));';
			$html .= '  newRow.append(selectCol).append(feedingCol).append(classesCol).append(tuitionCol).append(btnCol);';
			$html .= '  $("#edit_details_" + catId + " .row.mt-3").before(newRow);';
			$html .= '  $("button[onclick*=\"add_edit_class_row_" + catId + "\"]").prop("disabled", true);';
			$html .= '};';
			$html .= 'window.toggle_edit_column_fees = function(type, cid) {';
			$html .= '  var checked = $("#edit_" + type + "_master_" + cid).prop("checked");';
			$html .= '  $(".edit-" + type + "-input-" + cid).prop("disabled", !checked).val(checked ? $(".edit-" + type + "-input-" + cid).val() : "0.00");';
			$html .= '};';
			$html .= '})();';
			$html .= '</script>';
			
			echo $html;
			return;
		}
	} // END OF CATEGORY CREATION, UPDATING AND DELETION

	function get_category_edit_form($category_id) {
		$this->benefit_category('get_edit_form', $category_id);
	}

	//get benefit categories by class
	function get_benefit_categories_by_class($class_id) {
		$categories = $this->db->get('benefit_category')->result_array();
		
		foreach($categories as $row) {
			$show = false;
			if(isset($row['details']) && !empty($row['details'])) {
				$details = json_decode($row['details'], true);
				if($details && is_array($details)) {
					foreach($details as $detail) {
						if(isset($detail['class_id']) && ($detail['class_id'] == 0 || $detail['class_id'] == $class_id)) {
							$show = true;
							break;
						}
					}
				} else if(isset($row['class_id'])) {
					$show = ($row['class_id'] == 0 || $row['class_id'] == $class_id);
				}
			} else if(isset($row['class_id'])) {
				$show = ($row['class_id'] == 0 || $row['class_id'] == $class_id);
			}
			
			if($show) {
				echo '<option value="'.$row['category_id'].'">'.$row['name'].'</option>';
			}
		}
	}

	//get benefit categories excluding already assigned ones for selected students
	function get_benefit_categories_for_students() {
		$class_id = $this->input->post('class_id');
		$student_ids = $this->input->post('student_ids');
		
		if(empty($student_ids)) {
			$all_categories = $this->db->get('benefit_category')->result_array();
			foreach($all_categories as $row) {
				$show = false;
				if(isset($row['details']) && !empty($row['details'])) {
					$details = json_decode($row['details'], true);
					if($details && isset($details['classes'])) {
						if(isset($details['classes'][$class_id]) || isset($details['classes']['a'])) {
							$show = true;
						}
					}
				}
				if($show) {
					echo '<option value="'.$row['category_id'].'">'.$row['name'].'</option>';
				}
			}
			return;
		}
		
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		$assigned_category_ids = array();
		if($this->db->table_exists('beneficiary_list')) {
			foreach($student_ids as $student_id) {
				$beneficiary = $this->db->get_where('beneficiary_list', array(
					'student_id' => $student_id,
					'year' => $running_year,
					'term' => $running_term
				))->row();
				
				if($beneficiary) {
					$categories = json_decode($beneficiary->categories, true);
					if($categories) {
						foreach($categories as $cat) {
							$assigned_category_ids[] = $cat['category_id'];
						}
					}
				}
			}
		}
		
		$assigned_category_ids = array_unique($assigned_category_ids);
		
		$all_categories = $this->db->get('benefit_category')->result_array();
		$filtered_categories = array();
		
		foreach($all_categories as $row) {
			if(!empty($assigned_category_ids) && in_array($row['category_id'], $assigned_category_ids)) continue;
			
			$show = false;
			if(isset($row['details']) && !empty($row['details'])) {
				$details = json_decode($row['details'], true);
				if($details && isset($details['classes'])) {
					if(isset($details['classes'][$class_id]) || isset($details['classes']['a'])) {
						$show = true;
					}
				}
			}
			
			if($show) {
				$filtered_categories[] = $row;
			}
		}
		
		if(empty($filtered_categories)) {
			if(!empty($assigned_category_ids)) {
				echo '<option value="">All categories already assigned</option>';
			}
		} else {
			foreach($filtered_categories as $row) {
				echo '<option value="'.$row['category_id'].'">'.$row['name'].'</option>';
			}
		}
	}

	//load students for the benefit category
	function select_student($class_id) {

		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		$running_sem = $this->db->get_where('settings', array('type' => 'running_sem'))->row()->description;

		$enrolled_st_row = $this->db->get_where('enroll', array('class_id' => $class_id, 'mute' => '0', 'year' => $running_year, 'term' => $running_term));

		$class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;

		if ($class_name == 'JHSS') {
			$enrolled_st_row = $this->db->get_where('enroll', array('class_id' => $class_id, 'mute' => '0', 'year' => $running_year, 'sem' => $running_sem));
		}

		$enrolled_st = $enrolled_st_row->result_array();

		if ($enrolled_st_row->num_rows() < 1) {
			// echo '<option>No Record Found '.$class_id.'</option>';
		} else {

			$data_array = array();
			$i = 0;
			foreach ($enrolled_st as $row) {
				$data_array[$i] = $row['student_id'];

				$i++;
			}

			for ($j = 0; $j < sizeof($data_array); $j++) {
				$student = $this->db->get_where('student', array('student_id' => $data_array[$j]))->row();
				echo '<option value="' . $data_array[$j] . '" data-code="' . $student->student_code . '">' . $student->name . '</option>';
			}
		}
	}

	//bulk invoice deletion
	function bulk_invoice_delete($location = '', $isRequest=false) {
		$counter = 0;
		$invoice_array = array();
		$invoice_array = $this->input->post('invoices_sel');

		$ajaxData = array();

		$ajaxData['student_id'] = $this->db->get_where('invoice', ['invoice_code' => $invoice_array[0]])->row()->student_id;

		// Check if user is super admin
		$user_level = $this->session->userdata('user_type');
		$is_super_admin = ($user_level == 1);

		//echo count($invoice_array);

		if(!$isRequest || $is_super_admin) {

			$this->db->where_in('invoice_code', $invoice_array);
			$this->db->set('can_delete', 'trash');
			$this->db->set('delete_request_issuer_id', $this->session->userdata('login_user_id'));
			$this->db->update('invoice');

			//delete from payment table as well
			$this->db->where_in('invoice_code', $invoice_array);
			$this->db->set('can_delete', 'trash');
			$this->db->set('delete_request_issuer_id', $this->session->userdata('login_user_id'));
			$this->db->update('payment');

			//clear the cached database
			$this->db->cache_delete();

			//$counter++;

			//}

			$this->session->set_flashdata('flash_message', get_phrase(count($invoice_array) . ' invoices_deleted'));

			

			if($location == '') {
				$ajaxData['url'] = site_url('admin/income');
			} else {
				$ajaxData['url'] = site_url('admin/'.$location);
			}

			$ajaxData['status'] = 'success';
			$ajaxData['message'] = 'The selected invoices were moved to the trash bin successfuly!';
			echo json_encode($ajaxData);

		} else {

			/*this is a request*/
			$this->db->select('student_id, invoice_code');
			$this->db->distinct();
			$this->db->where_in('invoice_code', $invoice_array);
			$invoice_data_array = $this->db->get('invoice')->result_array();

			$invoice_details_array = [];
			foreach($invoice_data_array as $inv) {

				$student_name = ucwords(strtolower($this->crud_model->getStudentInfoById($inv['student_id'])->name));
				$invoice_details_array[] = $inv['invoice_code'].'-'.$student_name;
			}

			$requestData['request_description'] = 'To delete the following invoices: '. implode(', ', $invoice_details_array);
			$requestData['request_issuer_id'] = $this->session->userdata('login_user_id'); 
			$requestData['request_table'] = 'invoice';
			$requestData['request_ids'] = implode(',', $invoice_array);

			$result = $this->crud_model->createRequest($requestData);

			if($result) {
				/*update can delete column in the invoice table*/
				$this->db->where_in('invoice_code', $invoice_array);
				$this->db->set('can_delete', 'request');
				$this->db->set('delete_request_issuer_id', $requestData['request_issuer_id']);
				$this->db->update('invoice');

				// Notify super admins
				$requester = $this->db->where('admin_id', $this->session->userdata('login_user_id'))->get('admin')->row();
				$school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
				$super_admins = $this->db->where('level', 1)->get('admin')->result();

				foreach($super_admins as $admin) {
					$this->db->insert('notifications', [
						'user_id' => $admin->admin_id,
						'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
						'title' => 'Bulk Invoice Delete Approval Required',
						'message' => $requester->name . ' requested to delete ' . count($invoice_array) . ' invoices',
						'type' => 'invoice_delete_approval',
						'created_at' => date('Y-m-d H:i:s')
					]);

					$active_sms = $this->db->get_where('settings', ['type' => 'active_sms_service'])->row();
					if($active_sms && $active_sms->description != 'disabled' && !empty($admin->phone)) {
						$sms_message = "[$school_name] Bulk invoice delete approval needed: {$requester->name} wants to delete " . count($invoice_array) . " invoices. Review at: " . site_url('admin/manageRequestApproval');
						$this->sms_model->send_sms($sms_message, [$admin->phone]);
					}
				}

				$ajaxData['status'] = 'success';
				$ajaxData['message'] = 'Your request has been submitted successfuly. You will be notified on it\'s status after the administrator takes action.';
			} else {

				$ajaxData['status'] = 'fail';
				$ajaxData['message'] = 'Sorry! Something happened and your request could not be submitted. Please try again later.';
			}

			echo json_encode($ajaxData);

		} /*end of request submission*/
		
	}

	//bulk invoice deletion
	function bulk_students_delete($class_id) {
		$student_array = $this->input->post('students_sel');
		
		if (empty($student_array)) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('no_students_selected')]);
			return;
		}

		$this->db->trans_start();
		$deleted_count = 0;

		foreach ($student_array as $student_id) {
			$student = $this->db->get_where('student', ['student_id' => $student_id])->row();
			if (!$student) continue;

			$tables_to_delete = array(
				'enroll', 'attendance', 'mark', 'aggregation',
				'invoice', 'payment', 'student_discount_assignments',
				'invoice_discounts', 'invoice_discount_items',
				'daily_fee_wallet', 'daily_fee_transactions',
				'online_exam_result', 'book_request',
				'beneficiary_list', 'admission_logs', 'student_ledger'
			);

			foreach ($tables_to_delete as $table) {
				if ($this->db->table_exists($table)) {
					$this->db->where('student_id', $student_id);
					$this->db->delete($table);
				}
			}

			$threads = $this->db->get('message_thread')->result_array();
			foreach ($threads as $row) {
				$sender = explode('-', $row['sender']);
				$receiver = explode('-', $row['reciever']);
				if (($sender[0] == 'student' && $sender[1] == $student_id) || 
					($receiver[0] == 'student' && $receiver[1] == $student_id)) {
					$this->db->delete('message', ['message_thread_code' => $row['message_thread_code']]);
					$this->db->delete('message_thread', ['message_thread_code' => $row['message_thread_code']]);
				}
			}

			@unlink('uploads/student_image/' . $student_id . '.jpg');
			@unlink('uploads/barcodes/students/' . $student->student_code . '.png');

			$this->db->where('student_id', $student_id);
			$this->db->delete('student');

			$deleted_count++;
		}

		$this->db->trans_complete();

		if ($this->db->trans_status() === FALSE) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('deletion_failed')]);
		} else {
			echo json_encode(['status' => 'success', 'message' => $deleted_count . ' ' . get_phrase('students_deleted_successfully')]);
		}
	}

	//search for student's invoice details under invoices and receipts
	function invoice_student_search($search) {
		$this->crud_model->find_student($search);
	}

	//MANAGING FINANCIAL REPORTS VIEW
	function financial_reports($param1 = '', $param2 = '', $param3 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		$boarding_system = $this->input->post('boarding_system');

		if ($param1 == 'payables') {
			if ($param2 == 'load') {

				//Load data now
				$start_date = strtotime($this->input->post('start_date'));
				$end_date = strtotime($this->input->post('end_date'));
				$type = $this->input->post('search_by_type');
				$category = $this->input->post('search_by_category');
				$class_id = $this->input->post('search_by_class');
				$student = $this->input->post('search_by_student');

				//prepare data to send to the page
				$page_data['start_date'] = $start_date;
				$page_data['end_date'] = $end_date;
				$page_data['class_id'] = $class_id;
				$page_data['report_data'] = $this->financial_report_model->accountsPayables($start_date, $end_date, $type, $category, $class_id, $student);

				//LOAD THE PAGE NOW
				if ($type == 1) {
					//billed invoices selected
					$this->load->view('backend/admin/reports/get_payables', $page_data);
				} else {
					//fct selected
					$this->load->view('backend/admin/reports/get_fct_payables', $page_data);
				}

			} else {
				//leads to the main page
				$data['date_start'] = strtotime($param2);
				$data['date_end'] = strtotime($param3);

				if ($param2 == '') {
					$data['date_start'] = strtotime(date('d-m-Y'));
				}

				if ($param3 == '') {
					$data['date_end'] = strtotime(date('d-m-Y'));
				}

				$this->load->view('backend/admin/reports/payables', $data);
			}

		} else if ($param1 == 'receivables') {
			if ($param2 == 'load') {
				//Load data now
				$all_customize = $this->input->post('all_customize');

				if($all_customize == '0') {

					$term = 0;
					$year = 0;

				} else {

					$term = $this->input->post('term');
					$year = $this->input->post('year');
				}
				
				$type = $this->input->post('search_by_type');
				$category = $this->input->post('search_by_category');
				$class_id = $this->input->post('search_by_class');
				$student = $this->input->post('search_by_student');

				$page_data['boarding_system'] = $boarding_system;

				//prepare data to send to the page
				$page_data['term'] = $term;
				$page_data['year'] = $year;
				$page_data['class_id'] = $class_id;
				$page_data['all_customize'] = $all_customize;
				

				if($boarding_system == 'yes') {

					$residence_type = $this->input->post('search_by_residence_type'); 
					$page_data['residence_type'] = $residence_type;

					$page_data['report_data'] = $this->financial_report_model->accountsReceivables($term, $year, $type, $category, $class_id, $student, $all_customize, $residence_type);

				} else {

					$page_data['report_data'] = $this->financial_report_model->accountsReceivables($term, $year, $type, $category, $class_id, $student, $all_customize);
				}

				//LOAD THE PAGE NOW
				if ($type == 1) {
					//if param3 is export, load a different file
					if ($param3 == 'export') {
						//billed invoices selected
						$this->load->view('backend/admin/reports/get_receivables_to_export', $page_data);
					} else {
						//billed invoices selected
						$this->load->view('backend/admin/reports/get_receivables', $page_data);
					}

				} else {
					//fct selected
					$this->load->view('backend/admin/reports/get_fct_receivables', $page_data);
				}

			} else {
				//leads to the main page
				$data = [];
				$this->load->view('backend/admin/reports/receivables', $data);
			}

		} else if ($param1 == 'income-expenditure') {
			if ($param2 == 'load') {

				//Load data now
				$start_date = strtotime($this->input->post('start_date'));
				$end_date = strtotime($this->input->post('end_date'));
				//$type = $this->input->post('search_by_type');
				/*$category = $this->input->post('search_by_category');
					$class_id = $this->input->post('search_by_class');
				*/

				//prepare data to send to the page
				$page_data['start_date'] = $start_date;
				$page_data['end_date'] = $end_date;
				//$page_data['report_data'] = $this->financial_report_model->incomeExpenditure($start_date, $end_date);

				//LOAD THE PAGE NOW
				$this->load->view('backend/admin/reports/get_income_expenditure', $page_data);

			} else {
				//leads to the main page
				$data['date_start'] = strtotime($param2);
				$data['date_end'] = strtotime($param3);

				if ($param2 == '') {
					$data['date_start'] = strtotime(date('d-m-Y'));
				}

				if ($param3 == '') {
					$data['date_end'] = strtotime(date('d-m-Y'));
				}

				$this->load->view('backend/admin/reports/income_expenditure', $data);
			}

		} else if ($param1 == 'statement') {
			$data['date_start'] = strtotime($param2);
			$data['date_end'] = strtotime($param3);

			if ($param2 == '') {
				$data['date_start'] = strtotime(date('d-m-Y'));
			}

			if ($param3 == '') {
				$data['date_end'] = strtotime(date('d-m-Y'));
			}

			$this->load->view('backend/admin/reports/statement', $data);

		} else if ($param1 == 'payments') {
			if ($param2 == 'load') {

				//Load data now
				$start_date = strtotime($this->input->post('start_date'));
				$end_date = strtotime($this->input->post('end_date'));
				$type = $this->input->post('search_by_type');
				$category = $this->input->post('search_by_category');
				$class_id = $this->input->post('search_by_class');
				$student = $this->input->post('search_by_student');
				$bill_item = $this->input->post('search_by_bill_item');
				$fct_type = $this->input->post('search_by_report_type');
				$payment_method = $this->input->post('search_by_payment_method');
				


				//prepare data to send to the page
				$page_data['start_date'] = $start_date;
				$page_data['end_date'] = $end_date;
				$page_data['class_id'] = $class_id;
				$page_data['student_id'] = $student;
				$page_data['$type'] = $type;
				$page_data['$category'] = $category;
				$page_data['boarding_system'] = $boarding_system;
				$page_data['bill_item'] = $bill_item;
				$page_data['fct_type'] = $fct_type;
				$page_data['payment_method'] = $payment_method;
				
				if ($param3 == 'load_pivot' && ($class_id == 0 || $class_id == '0')) {



					if($boarding_system == 'yes') {

						//LOAD THE PAGE NOW

						$this->load->view('backend/admin/reports/get_payments_pivot', $page_data);

						// $residence_type = $this->input->post('search_by_residence_type'); 
						// $page_data['residence_type'] = $residence_type;
	
						// $page_data['report_data'] = $this->financial_report_model->paymentsReport($start_date, $end_date, $type, $category, $class_id, $student, $residence_type, $bill_item);
	
					} else {
						
						$this->load->view('backend/admin/reports/get_payments_pivot', $page_data);
						// $page_data['report_data'] = $this->financial_report_model->paymentsReport($start_date, $end_date, $type, $category, $class_id, $student, '0', $bill_item);
					}

					return;
					
				} else {

					if($boarding_system == 'yes') {

						$residence_type = $this->input->post('search_by_residence_type'); 
						$page_data['residence_type'] = $residence_type;

						$page_data['report_data'] = $this->financial_report_model->paymentsReport($start_date, $end_date, $type, $category, $class_id, $student, $residence_type, $bill_item, $payment_method);

					} else {

						$page_data['report_data'] = $this->financial_report_model->paymentsReport($start_date, $end_date, $type, $category, $class_id, $student, '0', $bill_item, $payment_method);
					}
				}

				

				

				//LOAD THE PAGE NOW
				if ($type == 1) {
					//billed invoices selected
					$this->load->view('backend/admin/reports/get_payments', $page_data);
				} else {
					//fct selected
					if($fct_type == 1) {
						$this->load->view('backend/admin/reports/get_fct_payments', $page_data); //normal date

					} else {

						$this->load->view('backend/admin/reports/get_fct_weekly_payments', $page_data); //weekly
					}
					
				}

			} else {
				//leads to the main page
				$data['date_start'] = strtotime($param2);
				$data['date_end'] = strtotime($param3);

				if ($param2 == '') {
					$data['date_start'] = strtotime(date('d-m-Y'));
				}

				if ($param3 == '') {
					$data['date_end'] = strtotime(date('d-m-Y'));
				}

				$this->load->view('backend/admin/reports/payments', $data);
			}

		} else if ($param1 == 'monthly-payment-by-item') {
			// Restrict access to super admin (level 1) only
			$admin_level = $this->db->get_where('admin', array('admin_id' => $this->session->userdata('admin_id')))->row()->level;
			if ($admin_level != 1) {
				$this->session->set_flashdata('error_message', get_phrase('access_denied_super_admin_only'));
				redirect(site_url('admin/dashboard'), 'refresh');
				return;
			}
			
			if ($param2 == 'load') {
				// Log report access attempt with timestamp
				$user_id = $this->session->userdata('admin_id');
				$username = $this->session->userdata('name');
				$timestamp = date('Y-m-d H:i:s');
				log_message('info', "Monthly Payment Report accessed by user ID: {$user_id}, Name: {$username}, Timestamp: {$timestamp}");
				
				// Sanitize and retrieve input data
				// Using intval() to ensure month values are integers and prevent SQL injection
				$start_month = intval($this->input->post('start_month', TRUE));  // TRUE enables XSS filtering
				$end_month = intval($this->input->post('end_month', TRUE));
				// Using xss_clean for academic year to sanitize string input
				$academic_year = $this->security->xss_clean($this->input->post('academic_year', TRUE));
				
				// Validate inputs - check for missing parameters
				if (!$start_month || !$end_month || !$academic_year) {
					log_message('info', "Monthly Payment Report: Missing parameters by user ID: {$user_id}, Timestamp: {$timestamp}");
					echo json_encode(['error' => 'Missing required parameters']);
					return;
				}
				
				// Validate month range (1-12) - prevent invalid month values
				if ($start_month < 1 || $start_month > 12 || $end_month < 1 || $end_month > 12) {
					log_message('info', "Monthly Payment Report: Invalid month range ({$start_month}-{$end_month}) by user ID: {$user_id}, Timestamp: {$timestamp}");
					echo json_encode(['error' => 'Invalid month range. Months must be between 1 and 12']);
					return;
				}
				
				// Validate start month <= end month - ensure logical date range
				if ($start_month > $end_month) {
					log_message('info', "Monthly Payment Report: Start month > end month ({$start_month} > {$end_month}) by user ID: {$user_id}, Timestamp: {$timestamp}");
					echo json_encode(['error' => 'Start month cannot be after end month']);
					return;
				}
				
				// Validate academic year format (YYYY-YYYY) - prevent SQL injection through year parameter
				if (!preg_match('/^\d{4}-\d{4}$/', $academic_year)) {
					log_message('info', "Monthly Payment Report: Invalid academic year format ({$academic_year}) by user ID: {$user_id}, Timestamp: {$timestamp}");
					echo json_encode(['error' => 'Invalid academic year format. Expected format: YYYY-YYYY']);
					return;
				}
				
				// Additional validation: Ensure academic year is reasonable (not in distant past/future)
				$year_parts = explode('-', $academic_year);
				$start_year = intval($year_parts[0]);
				$end_year = intval($year_parts[1]);
				$current_year = intval(date('Y'));
				
				if ($start_year < 2000 || $start_year > ($current_year + 5) || $end_year != ($start_year + 1)) {
					log_message('info', "Monthly Payment Report: Unreasonable academic year ({$academic_year}) by user ID: {$user_id}, Timestamp: {$timestamp}");
					echo json_encode(['error' => 'Invalid academic year. Please select a valid academic year.']);
					return;
				}
				
				// Log successful report generation with all parameters
				log_message('info', "Monthly Payment Report generated successfully: Period {$start_month}-{$end_month}, Year: {$academic_year}, User ID: {$user_id}, Timestamp: {$timestamp}");
				
				// Prepare sanitized data to send to the view
				// Data is already sanitized above, safe to pass to view
				$page_data['start_month'] = $start_month;
				$page_data['end_month'] = $end_month;
				$page_data['academic_year'] = $academic_year;
				
				// Load the data view (uses parameterized queries for SQL injection prevention)
				$this->load->view('backend/admin/reports/get_monthly_payment_by_invoice_item', $page_data);
			} else {
				// Log main page access with timestamp
				$user_id = $this->session->userdata('admin_id');
				$username = $this->session->userdata('name');
				$timestamp = date('Y-m-d H:i:s');
				log_message('info', "Monthly Payment Report page accessed by user ID: {$user_id}, Name: {$username}, Timestamp: {$timestamp}");
				
				// Leads to the main page
				$data['academic_years'] = $this->get_academic_years();
				$data['page_name'] = 'monthly_payment_by_item';
				$data['page_title'] = get_phrase('monthly_payment_by_invoice_item');
				$this->load->view('backend/admin/reports/monthly_payment_by_invoice_item', $data);
			}

		} else {

			$page_data['page_title'] = get_phrase('fINANCIAL_rEPORTS');
			$page_data['page_name'] = 'financial_reports';

			$page_data['account_type'] = $this->session->userdata('login_type');
			$this->load->view('backend/main', $page_data);
		}

	}

	//get sms step on receivables page
	function getReceivablesSMSStep($step, $students='') {

		$pageData['students'] = $students;
		
		if($step == 1) {
			$this->load->view('backend/admin/reports/includes/sms_step1.php', $pageData);

		} else if($step == 2) {
			$this->load->view('backend/admin/reports/includes/sms_step2.php');

		} else if($step == 3) {
			$this->load->view('backend/admin/reports/includes/sms_step3.php');

		} else {
			echo 'Not found!';
		}
	}

	//get date
	function getDate($param = '', $term = '', $year = '') {

		if($param == 0) {
			//all dates
			echo 'All';

		} else if($param == 1 && $term != '') {
			//custome date

			$ajax_data['term'] = $term;
			$ajax_data['year'] = $year;

			echo json_encode($ajax_data);

		} else {

			echo $param;
		}
		
	}

	//get the selected caption for the report
	function getReportCaption($class_id = '', $student_id = '') {

		if($student_id == 0) {
			//all students in the class were selected
			$className = getFullClassName($class_id);

			$data = $className;

		} else {
			//only a particular student selected
			$studentData = $this->crud_model->getStudentInfoById($student_id);
			$studentName = $studentData->name;

			$data = $studentName .' - '.getStudentCurrentClassByStudentId($student_id);

		}

		echo $data;
	}

	//get all students
	function getAllStudents($class_id = '') {
		getAllStudents($class_id);
	}

	//get academic years for monthly payment report
	private function get_academic_years() {
		$this->db->distinct();
		$this->db->select('year');
		$this->db->from('payment');
		$this->db->where('year IS NOT NULL');
		$this->db->where('year !=', '');
		// Sort by the first year in the format "YYYY-YYYY" (e.g., 2025 in "2025-2026")
		// Use FALSE as second parameter to prevent CodeIgniter from escaping the expression
		$this->db->order_by('CAST(SUBSTRING(year, 1, 4) AS UNSIGNED) DESC', '', FALSE);
		$query = $this->db->get();
		return $query->result_array();
	}

	//sort out all students that were present and absent on a particular day
	function students_att($timestamp = '', $param2 = '') {
		// Access control check - only admin level 1, 2, or teachers with privilege can access
		$user_type = $this->session->userdata('login_type');
		$user_id = $this->session->userdata('login_user_id');
		
		if (!can_access_attendance_monitoring($user_type, $user_id)) {
			$this->session->set_flashdata('error_message', get_phrase('access_denied_attendance_monitoring'));
			redirect(site_url($user_type), 'refresh');
			return;
		}
		
		if ($timestamp != '' || $timestamp != null) {
			if ($param2 == 'search' && $timestamp == 't') {
				$page_data['timestamp'] = strtotime($this->input->post('date_sel'));
				$timestamp = $page_data['timestamp'];
			} else {
				$page_data['timestamp'] = $timestamp;
			}
			$page_data['page_title'] = get_phrase('STUDENTS\' ATTENDANCE ON ') . date('l F d, Y', $timestamp);
			$page_data['page_name'] = 'students_daily_attendance_modern';

			$this->load->view('backend/admin/students_daily_attendance_modern', $page_data);
		}
	}

	/**
	 * Get attendance details for modal display
	 * AJAX endpoint that returns student attendance data based on type and filters
	 */
	function get_attendance_details() {
		// Access control check
		$user_type = $this->session->userdata('login_type');
		$user_id = $this->session->userdata('login_user_id');
		
		if (!can_access_attendance_monitoring($user_type, $user_id)) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('access_denied')
			]);
			return;
		}
		
		// Get parameters
		$type = $this->input->post('type'); // present, absent, not_marked, total
		$timestamp = $this->input->post('timestamp');
		$class_id = $this->input->post('class_id');
		$gender = $this->input->post('gender');
		$residential_status = $this->input->post('residential_status');
		$search = $this->input->post('search');
		
		// Validate required parameters
		if (empty($type) || empty($timestamp)) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('invalid_parameters')
			]);
			return;
		}
		
		try {
			// Get running year and term for enrollment lookup
			$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
			$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
			
			// Build base query - get residence_type from enroll table
			// CRITICAL FIX: Use INNER JOIN for enroll to ensure only enrolled students are included
			// Also exclude muted students to match the summary card logic
			$this->db->select('s.student_id, s.name, s.student_code, s.sex as gender, 
			                   c.name as class_name, c.name_numeric as class_numeric, 
			                   sec.name as section_name, 
			                   COALESCE(e.residence_type, "Day") as residential_status,
			                   a.status as attendance_status');
			$this->db->from('student s');
			$this->db->join('enroll e', 'e.student_id = s.student_id AND e.year = ' . $this->db->escape($running_year) . ' AND e.term = ' . $this->db->escape($running_term) . ' AND e.mute = "0"', 'inner');
			$this->db->join('class c', 'c.class_id = e.class_id', 'left');
			$this->db->join('section sec', 'sec.section_id = e.section_id', 'left');
			$this->db->join('attendance a', 'a.student_id = s.student_id AND a.timestamp = ' . $this->db->escape($timestamp), 'left');
			
			// Exclude muted students at the student level as well
			$this->db->where('s.mute', '0');
			
			// Apply type filter
			switch ($type) {
				case 'present':
					$this->db->where('a.status', 1);
					break;
				case 'absent':
					$this->db->where('a.status', 2);
					break;
				case 'not_marked':
					$this->db->group_start();
					$this->db->where('a.status IS NULL', null, false);
					$this->db->or_where('a.status', 0);
					$this->db->group_end();
					break;
				case 'total':
					// No filter - show all students
					break;
				default:
					echo json_encode([
						'status' => 'error',
						'message' => get_phrase('invalid_type')
					]);
					return;
			}
			
			// Apply additional filters
			if (!empty($class_id)) {
				$this->db->where('e.class_id', $class_id);
			}
			
			if (!empty($gender)) {
				$this->db->where('s.sex', $gender);
			}
			
			if (!empty($residential_status)) {
				// Filter by residence_type from enroll table
				$this->db->where('e.residence_type', ucfirst($residential_status));
			}
			
			if (!empty($search)) {
				$this->db->group_start();
				$this->db->like('s.name', $search);
				$this->db->or_like('s.student_code', $search);
				$this->db->group_end();
			}
			
			// Order by name
			$this->db->order_by('s.name', 'ASC');
			
			// Execute query
			$students = $this->db->get()->result_array();
			
			// Format attendance status text
			foreach ($students as &$student) {
				if ($student['attendance_status'] == 1) {
					$student['attendance_status_text'] = get_phrase('present');
				} elseif ($student['attendance_status'] == 2) {
					$student['attendance_status_text'] = get_phrase('absent');
				} else {
					$student['attendance_status_text'] = get_phrase('not_marked');
				}
				
				// Format gender
				$student['gender'] = ucfirst($student['gender']);
				
				// Format residential status
				$student['residential_status'] = ucfirst($student['residential_status']);
			}
			
			// Return success response
			echo json_encode([
				'status' => 'success',
				'data' => $students,
				'total' => count($students),
				'filtered' => count($students)
			]);
			
		} catch (Exception $e) {
			log_message('error', 'Error in get_attendance_details: ' . $e->getMessage());
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('operation_failed')
			]);
		}
	}

	/**
	 * Display teacher attendance privileges management page
	 */
	function teacher_attendance_privileges() {
		// Access control - only admin level 1
		$admin_level = $this->db->get_where('admin', ['admin_id' => $this->session->userdata('login_user_id')])->row()->level;
		
		if ($admin_level != 1) {
			$this->session->set_flashdata('error_message', get_phrase('access_denied'));
			redirect(site_url('admin'), 'refresh');
			return;
		}
		
		$page_data['page_name'] = 'teacher_attendance_privileges';
		$page_data['page_title'] = get_phrase('teacher_attendance_privileges');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	/**
	 * Get teachers list with privilege status
	 * AJAX endpoint for DataTable
	 */
	function get_teachers_privilege_list() {
		// Access control - only admin level 1
		$admin_level = $this->db->get_where('admin', ['admin_id' => $this->session->userdata('login_user_id')])->row()->level;
		
		if ($admin_level != 1) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('access_denied')
			]);
			return;
		}
		
		try {
			$teachers = get_teachers_with_privilege_status('attendance_monitoring');
			$statistics = get_privilege_statistics('attendance_monitoring');
			
			echo json_encode([
				'status' => 'success',
				'data' => $teachers,
				'statistics' => $statistics
			]);
			
		} catch (Exception $e) {
			log_message('error', 'Error getting teachers list: ' . $e->getMessage());
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('operation_failed')
			]);
		}
	}

	/**
	 * Bulk grant privileges to multiple teachers
	 * AJAX endpoint
	 */
	function bulk_grant_privileges() {
		// Access control - only admin level 1
		$admin_level = $this->db->get_where('admin', ['admin_id' => $this->session->userdata('login_user_id')])->row()->level;
		
		if ($admin_level != 1) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('access_denied')
			]);
			return;
		}
		
		$teacher_ids = $this->input->post('teacher_ids');
		$notes = $this->input->post('notes');
		$granted_by = $this->session->userdata('login_user_id');
		
		if (empty($teacher_ids) || !is_array($teacher_ids)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'No teachers selected'
			]);
			return;
		}
		
		$success_count = 0;
		$failed_count = 0;
		
		foreach ($teacher_ids as $teacher_id) {
			// Check if teacher already has privilege
			$existing = $this->db->get_where('teacher_privileges', [
				'teacher_id' => $teacher_id,
				'privilege_type' => 'attendance_monitoring',
				'status' => 'active'
			])->row();
			
			if ($existing) {
				$failed_count++;
				continue;
			}
			
			// Grant privilege
			$data = [
				'teacher_id' => $teacher_id,
				'privilege_type' => 'attendance_monitoring',
				'granted_by' => $granted_by,
				'granted_at' => date('Y-m-d H:i:s'),
				'status' => 'active',
				'notes' => $notes
			];
			
			if ($this->db->insert('teacher_privileges', $data)) {
				$success_count++;
			} else {
				$failed_count++;
			}
		}
		
		echo json_encode([
			'status' => 'success',
			'message' => "Granted privileges to $success_count teacher(s)",
			'success_count' => $success_count,
			'failed_count' => $failed_count
		]);
	}

	/**
	 * Bulk revoke privileges from multiple teachers
	 * AJAX endpoint
	 */
	function bulk_revoke_privileges() {
		// Access control - only admin level 1
		$admin_level = $this->db->get_where('admin', ['admin_id' => $this->session->userdata('login_user_id')])->row()->level;
		
		if ($admin_level != 1) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('access_denied')
			]);
			return;
		}
		
		$teacher_ids = $this->input->post('teacher_ids');
		$notes = $this->input->post('notes');
		$revoked_by = $this->session->userdata('login_user_id');
		
		if (empty($teacher_ids) || !is_array($teacher_ids)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'No teachers selected'
			]);
			return;
		}
		
		$revoked_count = 0;
		
		foreach ($teacher_ids as $teacher_id) {
			// Update active privileges to revoked
			$this->db->where('teacher_id', $teacher_id);
			$this->db->where('privilege_type', 'attendance_monitoring');
			$this->db->where('status', 'active');
			
			$update_data = [
				'status' => 'revoked',
				'revoked_by' => $revoked_by,
				'revoked_at' => date('Y-m-d H:i:s')
			];
			
			// Add notes if provided
			if (!empty($notes)) {
				$update_data['notes'] = $notes;
			}
			
			if ($this->db->update('teacher_privileges', $update_data)) {
				$revoked_count++;
			}
		}
		
		echo json_encode([
			'status' => 'success',
			'message' => "Revoked privileges from $revoked_count teacher(s)",
			'revoked_count' => $revoked_count
		]);
	}

	/**
	 * Grant privilege to a single teacher
	 * AJAX endpoint
	 */
	function grant_privilege() {
		// Access control - only admin level 1
		$admin_level = $this->db->get_where('admin', ['admin_id' => $this->session->userdata('login_user_id')])->row()->level;
		
		if ($admin_level != 1) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('access_denied')
			]);
			return;
		}
		
		$teacher_id = $this->input->post('teacher_id');
		$notes = $this->input->post('notes');
		$granted_by = $this->session->userdata('login_user_id');
		
		if (empty($teacher_id)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Teacher ID is required'
			]);
			return;
		}
		
		// Check if teacher already has privilege
		$existing = $this->db->get_where('teacher_privileges', [
			'teacher_id' => $teacher_id,
			'privilege_type' => 'attendance_monitoring',
			'status' => 'active'
		])->row();
		
		if ($existing) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Teacher already has this privilege'
			]);
			return;
		}
		
		// Grant privilege
		$data = [
			'teacher_id' => $teacher_id,
			'privilege_type' => 'attendance_monitoring',
			'granted_by' => $granted_by,
			'granted_at' => date('Y-m-d H:i:s'),
			'status' => 'active',
			'notes' => $notes
		];
		
		if ($this->db->insert('teacher_privileges', $data)) {
			echo json_encode([
				'status' => 'success',
				'message' => 'Privilege granted successfully'
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Failed to grant privilege'
			]);
		}
	}

	/**
	 * Revoke privilege from a single teacher
	 * AJAX endpoint
	 */
	function revoke_privilege() {
		// Access control - only admin level 1
		$admin_level = $this->db->get_where('admin', ['admin_id' => $this->session->userdata('login_user_id')])->row()->level;
		
		if ($admin_level != 1) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('access_denied')
			]);
			return;
		}
		
		$teacher_id = $this->input->post('teacher_id');
		$notes = $this->input->post('notes');
		$revoked_by = $this->session->userdata('login_user_id');
		
		if (empty($teacher_id)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Teacher ID is required'
			]);
			return;
		}
		
		// Update active privileges to revoked
		$this->db->where('teacher_id', $teacher_id);
		$this->db->where('privilege_type', 'attendance_monitoring');
		$this->db->where('status', 'active');
		
		$update_data = [
			'status' => 'revoked',
			'revoked_by' => $revoked_by,
			'revoked_at' => date('Y-m-d H:i:s')
		];
		
		// Add notes if provided
		if (!empty($notes)) {
			$update_data['notes'] = $notes;
		}
		
		if ($this->db->update('teacher_privileges', $update_data)) {
			echo json_encode([
				'status' => 'success',
				'message' => 'Privilege revoked successfully'
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Failed to revoke privilege'
			]);
		}
	}

	//check whether attendance was taken or not
	function att_update() {
		$this->db->select('class_id');
		$class_ids_arr = $this->db->get('class')->result_array();
		$unmarked = array();

		$timestamp_today = strtotime(date('d-m-Y'));
		$timestamp_today = strtotime(date('d-m-Y'));
		$day_date = date('l', $timestamp_today);

		if ($day_date != 'Sunday' && $day_date != 'Saturday') {

			foreach ($class_ids_arr as $row) {
				$rows_ck = $this->db->get_where('attendance', array('class_id' => $row['class_id'], 'timestamp' => $timestamp_today));

				$null_marked = $this->db->get_where('attendance', array('class_id' => $row['class_id'], 'timestamp' => $timestamp_today, 'status' => 0));

				if ($rows_ck->num_rows() < 1) {
					array_push($unmarked, $row['class_id']);
				}

				if ($null_marked->num_rows() > 0) {
					array_push($unmarked, $row['class_id']);
				}

			}

			if (count($unmarked) > 0) {
				echo 1;
			}

		} else {
			echo 0;
		}

	}

	//check whether attendance was taken or not
	function att_update_show() {
		$this->db->select('class_id');
		$class_ids_arr = $this->db->get('class')->result_array();
		$unmarked = array();

		foreach ($class_ids_arr as $row) {
			$rows_ck = $this->db->get_where('attendance', array('class_id' => $row['class_id'], 'timestamp' => $timestamp_today));

			$null_marked = $this->db->get_where('attendance', array('class_id' => $row['class_id'], 'timestamp' => $timestamp_today, 'status' => 0));

			if ($rows_ck->num_rows() < 1) {
				array_push($unmarked, $row['class_id']);
			}

			if ($null_marked->num_rows() > 0) {
				array_push($unmarked, $row['class_id']);
			}

		}

		if (count($unmarked) > 0) {
			for ($ri = 0; $ri < count($unmarked); $ri++) {
				//teacher's name and contact
				$tid = $this->db->get_where('class', array('class_id' => $unmarked[$ri]))->row()->teacher_id;
				$tname = $this->db->get_where('teacher', array('teacher_id' => $tid))->row()->name;
				$tphone = $this->db->get_where('teacher', array('teacher_id' => $tid))->row()->phone;

				//add section A or B if the class has more than one section
				$section_name = $this->db->get_where('section', array('class_id' => $unmarked[$ri]))->row()->name;
				$class_has_more_sections = $this->db->get_where('class', array('name' => $this->db->get_where('class', array('class_id' => $unmarked[$ri]))->row()->name, 'name_numeric' => $this->db->get_where('class', array('class_id' => $unmarked[$ri]))->row()->name_numeric))->num_rows();
				$sec_name = '';
				if ($class_has_more_sections > 1) {
					$sec_name = $section_name;
				}
				$class_name = $this->db->get_where('class', array('class_id' => $unmarked[$ri]))->row()->name . ' ' . $this->db->get_where('class', array('class_id' => $unmarked[$ri]))->row()->name_numeric . $sec_name;

				if (empty($tphone) && $tphone == null) {
					$phone_info = 'No Contact Found';
					$action_info = '<button class="btn btn-danger btn-sm">Can\'t Send</button>';
				} else {
					$phone_info = '<a href="' . site_url('admin/message/sms_send?ti=' . $tid) . '" class="pt_link" onclick="check_sms_status()" style="color: green;">' . $tphone . '</a>';
					$action_info = '<a href="' . site_url('admin/message/sms_send?ti=' . $tid) . '" class="pt_link" onclick="check_sms_status()" style="color: green;"><button class="btn btn-success btn-sm">Send SMS</button></a>';
				}

				echo '<tr>
                      <td>' . $class_name . '</td>
                      <td>' . $tname . '</td>
                      <td>' . $phone_info . '</td>
                      <td>' . $action_info . '</td>
                    </tr>';
			}
		}
	}

	function invoices_show($param1 = '', $param2 = '', $param3 = '', $param4 = '', $param5 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$page_data['page_title'] = get_phrase('student_payments');

		if ($param1 == 'invoice_search') {
			//$page_data['page_name'] = 'students_invoice_info';
			$class_id = $param2;
			$year = $param3;
			$term = $param4;
			$sem = $param5;

			$page_data['year'] = $year;
			$page_data['term'] = $term;
			$page_data['students'] = $this->ajaxload->load_invoice($class_id, $year, $term, $sem);
			$page_data['class_id'] = $class_id;
			$this->load->view('backend/admin/students_invoice_info', $page_data);

		} else if ($param1 == 'invoice_load') {
			$student_id = $param2;
			$page_data['invoices'] = $this->ajaxload->load_invoice_per_student($student_id);
			$page_data['student_id'] = $student_id;
			$this->load->view('backend/admin/invoices_loaded', $page_data);

		} else {
			$page_data['page_name'] = 'invoices';
			//$page_data['inner'] = 'invoices';
			$page_data['account_type'] = $this->session->userdata('login_type');
			$this->load->view('backend/main', $page_data);
		}
	}

	//for showing single bulk invoices for each class
	function view_single_bulk_invoice($param1 = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$page_data['class_id'] = $param1;
		$page_data['page_title'] = get_phrase('student_invoices');
		$page_data['term'] = $this->input->post('term');
		//$page_data['sem'] = $this->input->post('sem');
		$page_data['year'] = $this->input->post('year');

		$this->load->view('backend/admin/single_bulk_invoice', $page_data);
	}

	function get_receipt_bydate($search = '', $date = '') {
		$this->ajaxload->get_receipt_bydate($search, $date);
	}

	function get_feeding_fee_payment_receipt_bydate($search = '', $date = '') {
		$this->ajaxload->get_feeding_fee_payment_receipt_bydate($search, $date);
	}

	function get_classes_fee_receipt_bydate($search = '', $date = '') {
		$this->ajaxload->get_classes_fee_receipt_bydate($search, $date);
	}

	function get_transport_fare_receipt_bydate($search = '', $date = '') {
		$this->ajaxload->get_transport_fare_receipt_bydate($search, $date);
	}

	function issuer_update($date = '', $issuer_id = '') {
		$this->ajaxload->issuer_update($date, $issuer_id);
	}

	function feeding_fee_payment_issuer_update($date = '', $issuer_id = '') {
		$this->ajaxload->feeding_fee_payment_issuer_update($date, $issuer_id);
	}

	function classes_fee_issuer_update($date = '', $issuer_id = '') {
		$this->ajaxload->classes_fee_issuer_update($date, $issuer_id);
	}

	function transport_farre_issuer_update($date = '', $issuer_id = '') {
		$this->ajaxload->transport_farre_issuer_update($date, $issuer_id);
	}

	function class_update($date = '', $class_id = '') {
		$this->ajaxload->class_update($date, $class_id);
	}

	function feeding_fee_payment_class_update($date = '', $class_id = '') {
		$this->ajaxload->feeding_fee_payment_class_update($date, $class_id);
	}

	function classes_fee_class_update($date = '', $class_id = '') {
		$this->ajaxload->classes_fee_class_update($date, $class_id);
	}

	function transport_fare_class_update($date = '', $class_id = '') {
		$this->ajaxload->transport_fare_class_update($date, $class_id);
	}

	function issuer_update_term($issuer_id = '', $year = '', $term = '') {
		$this->ajaxload->issuer_update_term($issuer_id, $year, $term);
	}

	function class_update_term($class_id = '', $year = '', $term = '') {
		$this->ajaxload->class_update_term($class_id, $year, $term);
	}

	function get_receipt_byterm($search = '', $year = '', $term = '') {
		$this->ajaxload->get_receipt_byterm($search, $year, $term);
	}

	function get_fct_bydate($search = '', $date = '') {

		$this->ajaxload->get_fct_bydate($search, $date);
	}

	function get_fct_byterm($search = '', $year = '', $term = '') {

		$this->ajaxload->get_fct_byterm($search, $year, $term);
	}

	function get_receipt_bydate_modal($param2) {
		$this->ajaxload->get_receipt_bydate_modal($param2);
	}

	function get_feeding_fee_payment_receipt_bydate_modal($param2) {
		$this->ajaxload->get_feeding_fee_payment_receipt_bydate_modal($param2);
	}

	function get_classes_fee_receipt_bydate_modal($param2) {
		$this->ajaxload->get_classes_fee_receipt_bydate_modal($param2);
	}

	function get_transport_fare_receipt_bydate_modal($param2) {
		$this->ajaxload->get_transport_fare_receipt_bydate_modal($param2);
	}

	function get_receipt_byterm_modal($param2, $param3, $param4) {
		$this->ajaxload->get_receipt_byterm_modal($param2, $param3, $param4);
	}


	/**************************************************************
		    BARCODE
		    ***************************************************************
	*/
	function barcode_scanner($param1 = '', $param2 = '', $check_in_out = '', $approve = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if ($param1 == 'init') {
			//for accessing the barcode scanner page only
			$page_data['page_name'] = 'barcode_scanner_attendance';
			$page_data['page_title'] = 'Barcode Scanner Attendance';
			$page_data['account_type'] = $this->session->userdata('login_type');
			$this->load->view('backend/main', $page_data);
		}

		//hand scanned data for clock-in and out
		if ($param1 == 'attendance') {
		//either clocking in or out
			//get student id no
			$student_code = $param2;

			//is it a valid barcode?
			$barcode_is_valid = $this->db->get_where('student', array('student_code' => $student_code))->num_rows();

			if ($barcode_is_valid > 0) {
				//this barcode exists
				//get student's database id
				$student_id = $this->db->get_where('student', array('student_code' => $student_code))->row()->student_id;
				$student_full_name = $this->db->get_where('student', array('student_code' => $student_code))->row()->name;

				//get running year and term
				$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
				$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
				$running_sem = $this->db->get_where('settings', array('type' => 'running_sem'))->row()->description;

				//get class and section ids from the enroll table
				$class_id = $this->db->get_where('enroll', array('student_id' => $student_id, 'mute' => '0', 'year' => $running_year, 'term' => $running_term))->row()->class_id;
				if ($class_id == '') {
					$class_id = $this->db->get_where('enroll', array('student_id' => $student_id, 'mute' => '0', 'year' => $running_year, 'sem' => $running_sem))->row()->class_id;
				}
				$section_id = $this->db->get_where('enroll', array('student_id' => $student_id, 'mute' => '0', 'year' => $running_year, 'term' => $running_term))->row()->section_id;

				if ($section_id == '') {
					$section_id = $this->db->get_where('enroll', array('student_id' => $student_id, 'year' => $running_year, 'mute' => '0', 'sem' => $running_sem))->row()->section_id;
				}

				//getting class info
				$class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
				$class_name_numeric = $this->db->get_where('class', array('class_id' => $class_id))->row()->name_numeric;

				//add section A or B if the class has more than one section
				$section_name = $this->db->get_where('section', array('section_id' => $section_id, 'class_id' => $class_id))->row()->name;
				$class_has_more_sections = $this->db->get_where('class', array('name' => $class_name, 'name_numeric' => $class_name_numeric))->num_rows();
				$sec_name = '';
				if ($class_has_more_sections > 1) {
					$sec_name = $section_name;
				}

				$full_class_name = $class_name . ' ' . $class_name_numeric . ' ' . $sec_name;

				//first, let's see if this student is checking in or out
				$checked_in_today = $this->db->get_where('attendance', array('timestamp' => strtotime(date('d-m-Y')), 'class_id' => $class_id, 'section_id' => $section_id, 'student_id' => $student_id))->row()->checked_in;

				$checked_out_today = $this->db->get_where('attendance', array('timestamp' => strtotime(date('d-m-Y')), 'class_id' => $class_id, 'section_id' => $section_id, 'student_id' => $student_id))->row()->checked_out;

				//if student has already checked-in
				if ($checked_in_today == 1 && $check_in_out == 'check_in') {
					$feedback['already_checked_in'] = 1;
					$feedback['student_name'] = $student_full_name;

					echo json_encode($feedback);
					return false;
				}

				//if student has already checked-out
				if ($checked_out_today == 1 && $check_in_out == 'check_out') {
					$feedback['already_checked_out'] = 1;
					$feedback['student_name'] = $student_full_name;

					echo json_encode($feedback);
					return false;
				}

				if ($checked_in_today == 0 && $check_in_out == 'check_in') {
					//student is now checking in

					//check if this class members have already been entered into the attendance table today
					$att_rows = $this->db->get_where('attendance', array('timestamp' => strtotime(date('d-m-Y')), 'class_id' => $class_id, 'section_id' => $section_id))->num_rows();
					if ($att_rows < 1) {
						//not done so run this
						//call the attendance_selector function to add the class to the attendance table in the database
						$this->crud_model->attendance_selector($class_id, $section_id, $running_year, $running_term, $running_sem);
					}

					//incase admin approves this student to be checked in without considering owings
					if ($approve == 'approve') {
						//special consideration for this student
						//let us check this student in since there is no owing
						$this->db
							->where('student_id', $student_id)
							->where('class_id', $class_id)
							->where('section_id', $section_id)
							->where('timestamp', strtotime(date('d-m-Y')))
							->set('checked_in', 1)
							->set('checked_in_timestamp', strtotime(date('d-m-Y H:i:s')))
							->update('attendance');

						//student does not owe any school fees
						$feedback['school_fees_access'] = 'granted';
						$feedback['student_name'] = $student_full_name;

					} else {
						//normal way
						//now let us see if this student is owing any school fees
						$this->db->where('can_delete !=', 'trash');
						$query = $this->db->get_where('invoice', array('student_id' => $student_id, 'due >' => 0));
						$num_rows = $query->num_rows();
						if ($num_rows > 0) {
							//student owes school fees
							//find amount
							
							$amount = $this->db
								->select_sum('due')
								->where('student_id', $student_id)
								->where('can_delete !=', 'trash')
								->get('invoice')->row()->due;

							$feedback['amount'] = $amount;
							$feedback['school_fees_access'] = 'denied';
							$feedback['student_name'] = ucwords(strtolower($student_full_name));

						} else {
							//let us check this student in since there is no owing
							$this->db
								->where('student_id', $student_id)
								->where('class_id', $class_id)
								->where('section_id', $section_id)
								->where('timestamp', strtotime(date('d-m-Y')))
								->set('checked_in', 1)
								->set('checked_in_timestamp', strtotime(date('d-m-Y H:i:s')))
								->update('attendance');

							//student does not owe any school fees
							$feedback['school_fees_access'] = 'granted';
							$feedback['student_name'] = $student_full_name;
						} //done checking this student in
					}

				} elseif ($check_in_out == 'check_out') {

					if ($checked_in_today == 1) {
						//GO AHEAD SINCE STUDENT WAS CHECKED-IN EARLIER
						//student is checking out
						$this->db
							->where('student_id', $student_id)
							->where('class_id', $class_id)
							->where('section_id', $section_id)
							->where('timestamp', strtotime(date('d-m-Y')))
							->set('checked_out', 1)
							->set('checked_out_timestamp', strtotime(date('d-m-Y H:i:s')))
							->update('attendance');

						//student does not owe any school fees
						$feedback['student_checked_out'] = 'checked_out';
						$feedback['student_name'] = $student_full_name;

					} else {
						//reject this since student seems not to have checked-in earlier
						$feedback['check_out_error'] = 1;
					}

				} //done checking student out

				//FOR FEEDING
				if ($check_in_out == 'feeding') {

					//check if student is owing feeding fee
					$feeding_query = $this->db
						->where('student_id', $student_id)
						->order_by('timestamp', 'desc')
						->limit(1)
						->get('daily_fee_wallet');

					$is_present_today_query = $this->db
						->where('student_id', $student_id)
						->where('timestamp', strtotime(date('d-m-Y')))
						->get('daily_fee_wallet');
					$feeding_status = $is_present_today_query->row()->feeding_status;

					if ($feeding_status == 1) {
						//has checked in for food already
						$feedback['duplicate'] = 1;
						$feedback['student_name'] = ucwords(strtolower($student_full_name));
					} else {
						//now checking in for food
						$feeding_owe = $feeding_query->row()->due;
						$att_status = $is_present_today_query->row()->att_status;
						$feeding_timestamp = $feeding_query->row()->timestamp;

						if ($att_status == 1) {
							//student is present
							if ($feeding_owe > 0) {
								//student owes
								//check if this student has been approved to eat
								if ($approve == 'approve') {

									//update feeding_status
									$this->db->where('student_id', $student_id);
									$this->db->where('timestamp', $feeding_timestamp);
									//$this->db->set('feeding_status', 1);
									$this->db->update('daily_fee_wallet');

									$feedback['fees_status'] = 'granted';
									$feedback['fees_type'] = 'Feeding';
									$feedback['student_name'] = ucwords(strtolower($student_full_name));

								} else {
									$feedback['fees_status'] = 'denied';
									$feedback['fees_type'] = 'Feeding';
									$feedback['amount'] = $feeding_owe;
									$feedback['student_name'] = ucwords(strtolower($student_full_name));
								}
							} else {

								//update feeding_status
								$this->db->where('student_id', $student_id);
								$this->db->where('timestamp', $feeding_timestamp);
								//$this->db->set('feeding_status', 1);
								$this->db->update('daily_fee_wallet');

								$feedback['fees_status'] = 'granted';
								$feedback['fees_type'] = 'Feeding';
								$feedback['student_name'] = ucwords(strtolower($student_full_name));
							}
						} else {
							//student is absent
							$feedback['att_status'] = 'absent';
							$feedback['student_name'] = ucwords(strtolower($student_full_name));
							$feedback['class_name'] = ucwords(strtolower($full_class_name));

						}
					}

					echo json_encode($feedback);
					return false;
				} //end of feeding

				//FOR CLASSES
				if ($check_in_out == 'classes') {

					//check if student is owing classes fee
					$classes_query = $this->db
						->where('student_id', $student_id)
						->order_by('timestamp', 'desc')
						->limit(1)
						->get('daily_fee_wallet');

					// $is_present_today_query = $this->db
					// 	->where('student_id', $student_id)
					// 	->where('timestamp', strtotime(date('d-m-Y')))
					// 	->get('daily_fee_wallet');
					// $classes_status = $is_present_today_query->row()->classes_status;

					// if ($classes_status == 1) {
					// 	//has checked in for classes already
					// 	$feedback['duplicate'] = 1;
					// 	$feedback['student_name'] = ucwords(strtolower($student_full_name));
					// } else {
						//now checking in for classes
						$classes_owe = $classes_query->row()->cdue;
						$att_status = $is_present_today_query->row()->att_status;
						$classes_timestamp = $classes_query->row()->timestamp;

						if ($att_status == 1) {
							//student is present
							if ($classes_owe > 0) {
								//student owes
								//check if this student has been approved to eat
								if ($approve == 'approve') {

									//update feeding_status
									// $this->db->where('student_id', $student_id);
									// $this->db->where('timestamp', $classes_timestamp);
									// $this->db->set('classes_status', 1);
									// $this->db->update('daily_fee_wallet');

									$feedback['fees_status'] = 'granted';
									$feedback['fees_type'] = 'Classes';
									$feedback['student_name'] = ucwords(strtolower($student_full_name));

								} else {
									$feedback['fees_status'] = 'denied';
									$feedback['fees_type'] = 'Classes';
									$feedback['amount'] = $classes_owe;
									$feedback['student_name'] = ucwords(strtolower($student_full_name));
								}
							} else {

								//update classes_status
								// $this->db->where('student_id', $student_id);
								// $this->db->where('timestamp', $classes_timestamp);
								// $this->db->set('classes_status', 1);
								// $this->db->update('daily_fee_wallet');

								$feedback['fees_status'] = 'granted';
								$feedback['fees_type'] = 'Classes';
								$feedback['student_name'] = ucwords(strtolower($student_full_name));
							}
						} else {
							//student is absent
							$feedback['att_status'] = 'absent';
							$feedback['student_name'] = ucwords(strtolower($student_full_name));
							$feedback['class_name'] = ucwords(strtolower($full_class_name));
						}
					//}

					echo json_encode($feedback);
					return false;
				} //end of classes

				//FOR TRANSPORT
				if ($check_in_out == 'transport') {

					//check if student is owing transport fare
					$transport_query = $this->db
						->where('student_id', $student_id)
						->order_by('timestamp', 'desc')
						->limit(1)
						->get('daily_fee_wallet');

					// $is_present_today_query = $this->db
					// 	->where('student_id', $student_id)
					// 	->where('timestamp', strtotime(date('d-m-Y')))
					// 	->get('daily_fee_wallet');
					// $transport_status = $is_present_today_query->row()->transport_status;

					// if ($transport_status == 1) {
					// 	//has checked in for transport already
					// 	$feedback['duplicate'] = 1;
					// 	$feedback['student_name'] = ucwords(strtolower($student_full_name));
					// } else {
						//now checking in for transport
						$transport_owe = $transport_query->row()->due;
						$att_status = $is_present_today_query->row()->att_status;
						$transport_timestamp = $transport_query->row()->timestamp;

						if ($att_status == 1) {
							//student is present
							if ($transport_owe > 0) {
								//student owes
								//check if this student has been approved to eat
								if ($approve == 'approve') {

									//update feeding_status
									// $this->db->where('student_id', $student_id);
									// $this->db->where('timestamp', $transport_timestamp);
									// $this->db->set('transport_status', 1);
									// $this->db->update('daily_fee_wallet');

									$feedback['fees_status'] = 'granted';
									$feedback['fees_type'] = 'Transport';
									$feedback['student_name'] = ucwords(strtolower($student_full_name));

								} else {
									$feedback['fees_status'] = 'denied';
									$feedback['fees_type'] = 'Transport';
									$feedback['amount'] = $transport_owe;
									$feedback['student_name'] = ucwords(strtolower($student_full_name));
								}
							} else {

								//update classes_status
								// $this->db->where('student_id', $student_id);
								// $this->db->where('timestamp', $transport_timestamp);
								// $this->db->set('transport_status', 1);
								// $this->db->update('transport_fare');

								$feedback['fees_status'] = 'granted';
								$feedback['fees_type'] = 'Transport';
								$feedback['student_name'] = ucwords(strtolower($student_full_name));
							}
						} else {
							//student is absent
							$feedback['att_status'] = 'absent';
							$feedback['student_name'] = ucwords(strtolower($student_full_name));
							$feedback['class_name'] = ucwords(strtolower($full_class_name));
						}
					//}

					echo json_encode($feedback);
					return false;
				} //end of transport

			} else {
				//this barcode is invalid
				$feedback['invalid_barcode'] = 'invalid';
			}

			//send back the request for action to be taken
			echo json_encode($feedback);
		}

		//incase admin wants to cancel any of the scanned info of a student
		else if ($param1 == 'cancel') {
			$student_id = $param2;
			$timestamp_cancel = $approve;

			$student_full_name = $this->db->get_where('student', array('student_id' => $student_id))->row()->name;

			if ($check_in_out == 'check_in') {
				//cancel student's check-in

				$this->db
					->where('student_id', $student_id)
					->where('timestamp', $timestamp_cancel)
					->set('checked_in', 0)
					->set('checked_in_timestamp', NULL)
					->update('attendance');

				//cancel student's check-out
				$this->db
					->where('student_id', $student_id)
					->where('timestamp', $timestamp_cancel)
					->set('checked_out', 0)
					->set('checked_out_timestamp', NULL)
					->update('attendance');

				$feedback_cancel['student_name'] = $student_full_name;

				//send feedback
				echo json_encode($feedback_cancel);
			}

			if ($check_in_out == 'check_out') {
				//cancel student's check-out

				//cancel student's check-out
				$this->db
					->where('student_id', $student_id)
					->where('timestamp', $timestamp_cancel)
					->set('checked_out', 0)
					->set('checked_out_timestamp', NULL)
					->update('attendance');

				$feedback_cancel['student_name'] = $student_full_name;

				//send feedback
				echo json_encode($feedback_cancel);
			}

			if ($check_in_out == 'feeding') {
				//cancel student's feeding fee marking

				// $this->db
				// 	->where('student_id', $student_id)
				// 	->where('timestamp', $timestamp_cancel)
				// 	->set('feeding_status', 0)
				// 	->update('daily_fee_wallet');

				$feedback_cancel['student_name'] = $student_full_name;

				//send feedback
				echo json_encode($feedback_cancel);
			}

			if ($check_in_out == 'classes') {
				//cancel student's classes fee marking

				// $this->db
				// 	->where('student_id', $student_id)
				// 	->where('timestamp', $timestamp_cancel)
				// 	->set('classes_status', 0)
				// 	->update('daily_fee_wallet');

				$feedback_cancel['student_name'] = $student_full_name;

				//send feedback
				echo json_encode($feedback_cancel);
			}

			if ($check_in_out == 'transport') {
				//cancel student's transport fare marking

				// $this->db
				// 	->where('student_id', $student_id)
				// 	->where('timestamp', $timestamp_cancel)
				// 	->set('transport_status', 0)
				// 	->update('daily_fee_wallet');

				$feedback_cancel['student_name'] = $student_full_name;

				//send feedback
				echo json_encode($feedback_cancel);
			}
		}
	}

	//mass barcode generator for all students in the school.
	//this is helpful if all students were admitted before the introduction of the barcode system
	function mass_barcode_generator() {
		//select all the students codes in the school
		$this->db->select('student_code');
		$this->db->from('student');
		$query = $this->db->get();
		$results = $query->result_array();

		foreach ($results as $code) {
			$this->barcode_model->save_barcode($code['student_code']);
		}

		//  redirect(site_url('admin/dashboard'));//done, redirect to dashboard
	}

	//get student image
	function get_student_image($student_code = '') {
		if ($student_code != '') {

			$student_id = $this->db->get_where('student', array('student_code' => $student_code))->row()->student_id;
			$gender = $this->db->get_where('student', array('student_id' => $student_id))->row()->sex;
			$student_full_name = ucwords(strtolower($this->db->get_where('student', array('student_id' => $student_id))->row()->name));

			$image = $this->crud_model->get_image_url('student', $student_id, $gender);

			$data['image'] = $image;
			$data['student_name'] = $student_full_name;

			echo json_encode($data);
		}
	}

	//getting all the students scanned by the barcode scanner for each category
	function barcode_scanner_view($category = '') {

		$page_data['page_name'] = 'barcode_scanner_view';
		$page_data['category'] = $category;
		$page_data['timestamp'] = strtotime(date('d-m-Y'));

		if ($category == 'check_in') {
			$text = 'CHECKED-IN';

		} else if ($category == 'check_out') {
			$text = 'CHECKED-OUT';

		} else if ($category == 'feeding') {
			$text = 'FEEDING FEE';

		} else if ($category == 'classes') {
			$text = 'CLASSES FEE';

		} else if ($category == 'transport') {
			$text = 'TRANSPORT FARE';

		}

		$page_data['modal_title'] = 'View All Students: ' . $text;
		$page_data['category'] = $category;

		$this->load->view('backend/admin/barcode_scanner_view', $page_data);

	}

	//scanned view updator function here
	function scanned_view_updator($category = '', $timestamp = '', $selected = '') {
		//for all
		if ($category != '' && $timestamp != '') {

			if ($selected == 'selected') {
				$timestamp = strtotime($timestamp); //helps to convert the date to timestamp
			}

			$this->crud_model->get_all_barcode_scanned_students($category, $timestamp);
		}
	}

	//verifying check-in status for each student when a teacher takes attendance
	//call this function on the manage_attendance_view page with ajax
	function verify_check_in($class_id = '', $timestamp = '') {

		/*$attendance_of_students = $this->db->get_where('attendance' , array(
			            'class_id'=>$class_id,'timestamp'=>$timestamp
			        ))->result_array();

			        $students_ids1 = array(); //holds all student who did not check-in yet marked as present by class teacher
			        $students_ids2 = array(); //holds all student who did checked-in yet marked as absent by class teacher

			        $message1 = 0; //increases by 1 if a student didn't check-in yet marked present in class
			        $message2 = 0; //increases by 1 if a student checked-in yet marked absent in class

			        foreach($attendance_of_students as $row) {
			            $attendance_status = $this->input->post('status_'.$row['attendance_id']);

			            if($row['checked_in'] == 0 && $attendance_status == 1) {
			                //didn't check-in yet marked as present in class
			                array_push($students_ids1, $row['student_id']);
			                $message1++;
			            }

			            if($row['checked_in'] == 1 && $attendance_status == 2) {
			                //checked-in yet marked as absent in class
			                array_push($students_ids2, $row['student_id']);
			                $message2++;
			            }
			        } //end of loop

			        if($message1 > 0) {
			            //first error found
			            $m = $message1 == 1 ? 'Student' : 'Students';
			            $sex1 = '';
			            if($m == 'Student') {
			                $gender = $this->db->get_where('student', array('student_id' => $students_ids1[0]))->row()->sex;

			                if($gender == 'Female') {
			                    $sex1 = 'her';

			                } if($gender == 'Male') {
			                    $sex1 = 'him';
			                }

			            } else {
			                $sex1 = 'them';
			            }

			            echo '<em>The following '.$m.' did not check-in today, yet you are trying to mark '.$sex1.' present in class. Kindly confirm with the administrator before proceeding.</em><br/><br/>
			                <ol>';

			            for($i = 0; $i < count($students_ids1); $i++) {
			                $student_name = $this->db->get_where('student', array('student_id' => $students_ids1[$i]))->row()->name;
			                $student_code = $this->db->get_where('student', array('student_id' => $students_ids1[$i]))->row()->student_code;

			                echo '<li>'.$student_name. '-'.$student_code.'</li>';
			            }

			            echo '</ol><hr/>';

			           // return false; //end the execution here if this error occurs
			        }

			        if($message2 > 0) {
			            //second error found
			            $m2 = $message2 == 1 ? 'Student' : 'Students';
			            $sex2 = '';
			            if($m2 == 'Student') {
			                $gender = $this->db->get_where('student', array('student_id' => $students_ids2[0]))->row()->sex;

			                if($gender == 'Female') {
			                    $sex2 = 'her';

			                } if($gender == 'Male') {
			                    $sex2 = 'him';
			                }

			            } else {
			                $sex2 = 'them';
			            }
			            echo '<em>The following '.$m2.' checked-in today, yet you are trying to mark '.$sex2.' absent in class. Kindly confirm with the administrator before proceeding.</em><br/><br/>
			                <ol>';

			            for($j = 0; $j < count($students_ids2); $j++) {
			                $student_name = $this->db->get_where('student', array('student_id' => $students_ids2[$j]))->row()->name;
			                $student_code = $this->db->get_where('student', array('student_id' => $students_ids2[$j]))->row()->student_code;

			                echo '<li>'.$student_name. '-'.$student_code.'</li>';
			            }

			            echo '</ol>';
		*/
		echo '';
	}

	function get_class_name_numeric($class_id) {
		$class_name = $this->crud_model->get_class_name($class_id);
		$data['class_name'] = $class_name;
		$data['class_numeric'] = $class_name . ' ' . $this->crud_model->get_class_name_numeric($class_id);

		echo json_encode($data);
	}

	//generates students' code Or ID format based on the current year
	function update_student_code_format() {
		$current_year = date('Y');
		$data['description'] = $current_year . '001';

		$this->db->where('type', 'student_code_format');
		$this->db->update('settings', $data);

		// Mark as SYNCED immediately using direct SQL to bypass MY_DB_mysqli_driver
		$this->db->query("UPDATE settings SET sync_status = 'SYNCED' WHERE type = 'student_code_format'");

		echo 'success';
	}

	//cummulative reports
	function cummulative_reports($student_id) {
		$this->db->select('year, class_id');
		$this->db->where('class_id IS NOT NULL');
		$this->db->distinct();
		$data['all_years'] = $this->db->get_where('enroll', array('student_id' => $student_id))->result_array();
		$data['student_id'] = $student_id;

		$this->load->view('backend/admin/cummulative_reports', $data);
	}

	// bulk cummulative reports
	function bulk_cummulative_reports($class_id) {
		$data['selected_class_id'] = $class_id;

		$this->load->view('backend/admin/cummulative_reports_bulk', $data);
	}

	//move student(s) from one class to the other
	function student_move_to_another_class($from_class_id = '', $to_class_id = '', $students_ids = array()) {

		//get the current class's section id
		$section_id = $this->db->get_where('section', array('class_id' => $to_class_id))->row()->section_id;

		//getting current sessions
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');

		//explode students_ids from - to ,
		$students_ids = explode('-', $students_ids);

		//affected tables
		$tables = array(
			'enroll',
			'aggregation',
			'attendance',
			'invoice',
			'mark',
			'payment',
			'portfolio_assessment',
		);

		/*Before we move this student, let us check his/her bill for the current term and academic year*/

		/*get bill items for the from class*/
		$fromClassBillsForDay = $this->financial_report_model->getTermlyClassBillsForStudent($from_class_id, $running_year, $running_term, 'Day');
		$fromClassBillsForBoarding = $this->financial_report_model->getTermlyClassBillsForStudent($from_class_id, $running_year, $running_term, 'Boarding');

		/*get bill items for the to class*/
		$toClassBillsForDay = $this->financial_report_model->getTermlyClassBillsForStudent($to_class_id, $running_year, $running_term, 'Day');
		$toClassBillsForBoarding = $this->financial_report_model->getTermlyClassBillsForStudent($to_class_id, $running_year, $running_term, 'Boarding');

		//*we find bill items not in the to class but are in the from class*/
		$fromClassItemsIds = array_column($fromClassBillsForDay, 'bill_item_id');
		$toClassItemsIds = array_column($toClassBillsForDay, 'bill_item_id');

		$dayFromBillItemsNotInToBills = array_diff($fromClassItemsIds, $toClassItemsIds);

		$boardingFromBillItemsNotInToBills = array_diff(array_column($fromClassBillsForBoarding, 'bill_item_id'), array_column($toClassBillsForBoarding, 'bill_item_id'));

		/*We get all the bill items title from the previous class*/
		$fromAllItemsTitles = []; // Initialize to empty array
		if(count($fromClassItemsIds) > 0):

			$this->db->select('title');
			$this->db->where_in('id', $fromClassItemsIds);
			$fromClassAllItemsQuery = $this->db->get('bill_item')->result_array();

			$fromAllItemsTitles = array_column($fromClassAllItemsQuery, 'title');
			
			// Ensure it's always an array, never null
			if(!is_array($fromAllItemsTitles)) {
				$fromAllItemsTitles = [];
			}

		endif;

		//for each student
		$invoice_adder = 1;

		for ($i = 0; $i < sizeof($students_ids); $i++) {

			/*get current class invoice details*/
			$this->db->where('student_id', $students_ids[$i]);
			$this->db->where('class_id', $from_class_id);
			$this->db->where('term', $running_term);
			$this->db->where('year', $running_year);
			$from_invoice_query = $this->db->get('invoice');
			
			// Check if invoice exists before accessing properties
			if($from_invoice_query->num_rows() > 0) {
				$from_invoice_code = $from_invoice_query->row()->invoice_code;
				$from_invoice_creation_timestamp = $from_invoice_query->row()->creation_timestamp;
			} else {
				$from_invoice_code = null;
				$from_invoice_creation_timestamp = null;
			}

			if($from_invoice_query->num_rows() < 1) {
				/*it doesn't exist*/
				/*We generate a new invoice code and creation timestamp*/
				//generate sequential invoice number;
					$this->db->select('invoice_code');
					$this->db->order_by('invoice_code', 'desc');
					$this->db->limit(1);
					$inv_query = $this->db->get('invoice');

					if ($inv_query->num_rows() > 0) {
						$inv_id = $inv_query->row()->invoice_code;
						$ndata['invoice_code'] = (floatval($inv_id) + floatval($invoice_adder));

						if (substr($inv_id, 0, 1) == 0) {

							$old_len = strlen($inv_id);
							$new_len = strlen($ndata['invoice_code']);
							$act_len = ($old_len - $new_len);
							$ndata['invoice_code'] = substr($inv_id, 0, $act_len) . $ndata['invoice_code'];

						} else {
							$ndata['invoice_code'] = $ndata['invoice_code'];
						}
					} else {
						$inv_id = $invoice_code_f;

						$ndata['invoice_code'] = (floatval($inv_id) + floatval($invoice_adder));

						if (substr($inv_id, 0, 1) == 0) {
							$old_len = strlen($inv_id);
							$new_len = strlen($ndata['invoice_code']);
							$act_len = ($old_len - $new_len);
							$ndata['invoice_code'] = substr($inv_id, 0, $act_len) . $ndata['invoice_code'];

						} else {
							$ndata['invoice_code'] = $ndata['invoice_code'];
						}
					}

					//invoice (code) validation for duplicate
					$code_validation = invoice_code_validation_insert($ndata['invoice_code']);
					while (!$code_validation) {
						//while invoice code validation fails, keep generating different ones
						$this->db->select('invoice_code');
						$this->db->order_by('invoice_code', 'desc');
						$this->db->limit(1);
						$inv_query = $this->db->get('invoice');
						
						if ($inv_query->num_rows() > 0) {
							$inv_id = $inv_query->row()->invoice_code;
							$ndata['invoice_code'] = $inv_id + 1;

							if (substr($inv_id, 0, 1) == 0) {
								$old_len = strlen($inv_id);
								$new_len = strlen($ndata['invoice_code']);
								$act_len = ($old_len - $new_len);
								$ndata['invoice_code'] = substr($inv_id, 0, $act_len) . $ndata['invoice_code'];

							} else {
								$ndata['invoice_code'] = $ndata['invoice_code'];
							}
						} else {
							// No invoices exist, break the loop
							break;
						}

						$code_validation = invoice_code_validation_insert($ndata['invoice_code']);
					}


					$from_invoice_code = $ndata['invoice_code'];
					$from_invoice_creation_timestamp = strtotime('today');
			}

			/*current residential status*/
			$residence_type = $this->boarding_model->get_residence_type($students_ids[$i]);

			if($residence_type == 'Day') {

				$invoiceIdsFound = array();
				$batchInsertArray = array();


				/*items to be deleted*/
				$fromDeleteItemsTitles = array();
				if(count($dayFromBillItemsNotInToBills) > 0):
					$this->db->select('title');
					$this->db->where_in('id', $dayFromBillItemsNotInToBills);
					$fromDeleteItemsQuery = $this->db->get('bill_item')->result_array();

					$fromDeleteItemsTitles = array_column($fromDeleteItemsQuery, 'title');

				endif;

				/*we check if any payment were made for the previous bill. If so, we sum up the amount and deduct it from the current bill*/
				$studentPaid = false;

				if(is_array($fromAllItemsTitles) && count($fromAllItemsTitles) > 0):

					$this->db->select_sum('amount_paid');
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('class_id', $from_class_id);
					$this->db->where('term', $running_term);
					$this->db->where('year', $running_year);
					$this->db->where_in('title', $fromAllItemsTitles);
					$amountPaidForThePreviousInvoiceItems = $this->db->get('invoice')->row()->amount_paid;

				endif;


				foreach($toClassBillsForDay as $to) {

					$bill_item = $this->crud_model->getBillItemRowById($to['bill_item_id'])->title;
					$bill_item_desc = $this->crud_model->getBillItemRowById($to['bill_item_id'])->description;

					/*check if this bill item already exists for this student in the invoice table*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('class_id', $from_class_id);
					$this->db->where('title', $bill_item);
					$this->db->where('term', $running_term);
					$this->db->where('year', $running_year);
					$bill_item_exists_query = $this->db->get('invoice');


					$bill_item_exists_rows = $bill_item_exists_query ->num_rows();

					if($bill_item_exists_rows > 0) {

						$from_amount = $bill_item_exists_query ->row()->amount;
						$to_amount = $to['bill_item_amount'];
						$diff = (floatval($to_amount) - floatval($from_amount));
						$invoice_id = $bill_item_exists_query ->row()->invoice_id;

						/*exists so we do update*/
						$this->db->where('invoice_id', $invoice_id);
						$this->db->set('amount', $to_amount);
						$this->db->set('amount_paid', '0');/*we intentionally reset all amount_paid columns to zero since we are doing a fresh billing. However, we will take account of all paymemts made to this billing and effect it accordingly later*/
						$this->db->set('due', $to_amount);
						$this->db->update('invoice');

						$invoiceIdsFound[] = $invoice_id;

					} else {

						/*does not exist, so we do new entry*/
						$bill_data['student_id'] = $students_ids[$i];
						$bill_data['class_id'] = $to_class_id;
						$bill_data['invoice_code'] = $from_invoice_code;
						$bill_data['title'] = strtoupper(strtolower($bill_item));
						$bill_data['description'] = $bill_item_desc;
						$bill_data['amount'] = $to['bill_item_amount'];
						$bill_data['amount_paid'] = 0;
						$bill_data['due'] = $bill_data['amount'];
						$bill_data['status'] = 'unpaid';
						$bill_data['term'] = $running_term;
						$bill_data['year'] = $running_year;
						$bill_data['creation_timestamp'] = $from_invoice_creation_timestamp;

						$batchInsertArray[] = $bill_data;
            
					}
 
				}

				/*batch insert for this student*/
				if(count($batchInsertArray) > 0) {

					$this->db->insert_batch('invoice', $batchInsertArray); /*we insert now*/
				}

				

				if(count($fromDeleteItemsTitles) > 0):

					/*We delete those bill items not found in the current class bills*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('class_id', $from_class_id);
					$this->db->where('term', $running_term);
					$this->db->where('year', $running_year);
					$this->db->where_in('title', $fromDeleteItemsTitles);
					$this->db->delete('invoice');

				endif;

				if($amountPaidForThePreviousInvoiceItems > 0) { /*only if there is any*/

					$studentPaid = true;

					/*we find those invoice items that he is owing so we clear them with this balance*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('due >', '0');
					$owingsQuery = $this->db->get('invoice')->result_array();

					if(count($owingsQuery) > 0) {

						foreach($owingsQuery as $ow) {

							/*break off point*/
							if($amountPaidForThePreviousInvoiceItems < 1) break;

							if($amountPaidForThePreviousInvoiceItems <= $ow['due']) {
								/*if amount balance is less than the owing for this item in this row, we settle part and exit the loop*/

								$this->db->where('invoice_id', $ow['invoice_id']);
								$this->db->set('amount_paid', 'amount_paid + '. $amountPaidForThePreviousInvoiceItems, false);
								$this->db->set('due', 'due - '. $amountPaidForThePreviousInvoiceItems, false);
								$this->db->update('invoice');

								/*set it to 0 because it has been exhausted*/
								$amountPaidForThePreviousInvoiceItems = 0;

							} else {

								/*if amount balance is greater than the owing for this item in this row, we settle all and move to the next row and do another settlement untill this condition is not met*/

								$this->db->where('invoice_id', $ow['invoice_id']);
								$this->db->set('amount_paid', 'amount_paid + '. $ow['due'], false);
								$this->db->set('due', 'due - '. $ow['due'], false);
								$this->db->update('invoice');

								/*reduce it by the amount owe on this row*/
								$amountPaidForThePreviousInvoiceItems -= $ow['due'];

							}

						} /*END OF EACH OWING ROW LOOP*/

					} else {

						/*we effect this to one of the invoice ids. It might end up being an overdraft for the student*/
						$this->db->where('invoice_id', $invoiceIdsFound[0]);
						$this->db->set('amount_paid', 'amount_paid + '. $amountPaidForThePreviousInvoiceItems, false);
						$this->db->set('due', 'due - '. $amountPaidForThePreviousInvoiceItems, false);
						$this->db->update('invoice');
					}


				} /*END CHECKING IF THERE IS ANY PAYMENT ITEMS THAT MUST BE DELETED*/
				
				/*END OF UPDATES FOR DAY STUDENT*/


			} else if($residence_type == 'Boarding') {

				$invoiceIdsFound = array();
				$batchInsertArray = array();


				/*items to be deleted*/
				$fromDeleteItemsTitles = array();
				if(count($boardingFromBillItemsNotInToBills) > 0):

					$this->db->select('title');
					$this->db->where_in('id', $boardingFromBillItemsNotInToBills);
					$fromDeleteItemsQuery = $this->db->get('bill_item')->result_array();

					$fromDeleteItemsTitles = array_column($fromDeleteItemsQuery, 'title');

				endif;


				/*we check if any payment were made for the previous bill. If so, we sum up the amount and deduct it from the current bill*/
				$studentPaid = false;
				if(is_array($fromAllItemsTitles) && count($fromAllItemsTitles) > 0):

					$this->db->select_sum('amount_paid');
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('class_id', $from_class_id);
					$this->db->where('term', $running_term);
					$this->db->where('year', $running_year);
					$this->db->where_in('title', $fromAllItemsTitles);
					$amountPaidForThePreviousInvoiceItems = $this->db->get('invoice')->row()->amount_paid;

				endif;


				foreach($toClassBillsForBoarding as $to) {

					$bill_item = $this->crud_model->getBillItemRowById($to['bill_item_id'])->title;
					$bill_item_desc = $this->crud_model->getBillItemRowById($to['bill_item_id'])->description;

					/*check if this bill item already exists for this student in the invoice table*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('class_id', $from_class_id);
					$this->db->where('title', $bill_item);
					$this->db->where('term', $running_term);
					$this->db->where('year', $running_year);
					$bill_item_exists_query = $this->db->get('invoice');


					$bill_item_exists_rows = $bill_item_exists_query ->num_rows();

					if($bill_item_exists_rows > 0) {

						$from_amount = $bill_item_exists_query ->row()->amount;
						$to_amount = $to['bill_item_amount'];
						$diff = (floatval($to_amount) - floatval($from_amount));
						$invoice_id = $bill_item_exists_query ->row()->invoice_id;

						/*exists so we do update*/
						$this->db->where('invoice_id', $invoice_id);
						$this->db->set('amount', $to_amount);
						$this->db->set('amount_paid', '0');/*we intentionally reset all amount_paid columns to zero since we are doing a fresh billing. However, we will take account of all paymemts made to this billing and effect it accordingly later*/
						$this->db->set('due', $to_amount);
						$this->db->update('invoice');

						$invoiceIdsFound[] = $invoice_id;

					} else {

						/*does not exist, so we do new entry*/
						$bill_data['student_id'] = $students_ids[$i];
						$bill_data['class_id'] = $to_class_id;
						$bill_data['invoice_code'] = $from_invoice_code;
						$bill_data['title'] = strtoupper(strtolower($bill_item));
						$bill_data['description'] = $bill_item_desc;
						$bill_data['amount'] = $to['bill_item_amount'];
						$bill_data['amount_paid'] = 0;
						$bill_data['due'] = $bill_data['amount'];
						$bill_data['status'] = 'unpaid';
						$bill_data['term'] = $running_term;
						$bill_data['year'] = $running_year;
						$bill_data['creation_timestamp'] = $from_invoice_creation_timestamp;

						$batchInsertArray[] = $bill_data;
            
					}
 
				}

				/*batch insert for this student*/
				if(count($batchInsertArray) > 0) {

					$this->db->insert_batch('invoice', $batchInsertArray); /*we insert now*/
				}


				if(count($fromDeleteItemsTitles) > 0):
					
					/*We delete those bill items not found in the current class bills*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('class_id', $from_class_id);
					$this->db->where('term', $running_term);
					$this->db->where('year', $running_year);
					$this->db->where_in('title', $fromDeleteItemsTitles);
					$this->db->delete('invoice');

				endif;

				if($amountPaidForThePreviousInvoiceItems > 0) { /*only if there is any*/

					$studentPaid = true;

					/*we find those invoice items that he is owing so we clear them with this balance*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('due >', '0');
					$owingsQuery = $this->db->get('invoice')->result_array();

					if(count($owingsQuery) > 0) {

						foreach($owingsQuery as $ow) {

							/*break off point*/
							if($amountPaidForThePreviousInvoiceItems < 1) break;

							if($amountPaidForThePreviousInvoiceItems <= $ow['due']) {
								/*if amount balance is less than the owing for this item in this row, we settle part and exit the loop*/

								$this->db->where('invoice_id', $ow['invoice_id']);
								$this->db->set('amount_paid', 'amount_paid + '. $amountPaidForThePreviousInvoiceItems, false);
								$this->db->set('due', 'due - '. $amountPaidForThePreviousInvoiceItems, false);
								$this->db->update('invoice');

								/*set it to 0 because it has been exhausted*/
								$amountPaidForThePreviousInvoiceItems = 0;

							} else {

								/*if amount balance is greater than the owing for this item in this row, we settle all and move to the next row and do another settlement untill this condition is not met*/

								$this->db->where('invoice_id', $ow['invoice_id']);
								$this->db->set('amount_paid', 'amount_paid + '. $ow['due'], false);
								$this->db->set('due', 'due - '. $ow['due'], false);
								$this->db->update('invoice');

								/*reduce it by the amount owe on this row*/
								$amountPaidForThePreviousInvoiceItems -= $ow['due'];

							}

						} /*END OF EACH OWING ROW LOOP*/

					} else {

						/*we effect this to one of the invoice ids. It might end up being an overdraft for the student*/
						$this->db->where('invoice_id', $invoiceIdsFound[0]);
						$this->db->set('amount_paid', 'amount_paid + '. $amountPaidForThePreviousInvoiceItems, false);
						$this->db->set('due', 'due - '. $amountPaidForThePreviousInvoiceItems, false);
						$this->db->update('invoice');
					}


				} /*END CHECKING IF THERE IS ANY PAYMENT ITEMS THAT MUST BE DELETED*/
				
				/*END OF UPDATES FOR BOARDING STUDENT*/

			}

			/*END OF UPDATES FOR BOARDING STUDENT*/

			/*WE ALSO NEED TO UPDATE THE PAYMENT TABLE WITH THE NEW OWING BALANCE*/
			if($studentPaid):

				$this->db->select_sum('due');
				$this->db->where('student_id', $students_ids[$i]);
				$this->db->where('due >', 0);
				$studentTotalOwing = $this->db->get('invoice')->row()->due;

				$this->db->select_max('payment_id');
				$this->db->where('student_id', $students_ids[$i]);
				$this->db->where('invoice_id IS NOT NULL');
				$this->db->where('invoice_code IS NOT NULL');
				$lastPaymentId = $this->db->get('payment')->row()->payment_id;

				/*update now*/
				$this->db->where('payment_id', $lastPaymentId);
				$this->db->set('due', $studentTotalOwing);
				$this->db->update('payment');

				/*we also update the invoice status here*/
				if($studentTotalOwing == 0) {
					/*paid*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('status !=', 'paid');
					$this->db->where('due', 0);
					$this->db->set('status', 'paid');
					$this->db->update('invoice');

				} if($studentTotalOwing < 0) {
					/*overpaid*/
					$this->db->select('invoice_code');
					$this->db->distinct();
					$this->db->from('invoice');
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('due <', '0');
					$invCodesArray = $this->db->get()->result_array();

					$invCodes = array_column($invCodesArray, 'invoice_code');

					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where_in('invoice_code', $invCodes);
					$this->db->set('status', 'overpaid');

				}
				/*END OF STATUS UPDATE*/

			endif;

			//for tables - UPDATE CLASS_ID FIRST
			for ($j = 0; $j < sizeof($tables); $j++) {
				$this->db->where('student_id', $students_ids[$i]);
				$this->db->where('year', $running_year);
				$this->db->where('term', $running_term);
				$this->db->set('class_id', $to_class_id);
				if ($tables[$j] != 'payment' && $tables[$j] != 'invoice') {
					$this->db->set('section_id', $section_id);
				}
				$this->db->update($tables[$j]);
			}

			// DISCOUNT RECALCULATION FOR CLASS MOVEMENT
			// First, check and clean up existing discount records for this invoice
			$existing_discounts = $this->db->where('invoice_code', $from_invoice_code)
				->where('student_id', $students_ids[$i])
				->where('term', $running_term)
				->where('year', $running_year)
				->get('invoice_discounts')->result();
			
			if(count($existing_discounts) > 0) {
				// Delete existing discount items first
				foreach($existing_discounts as $existing) {
					$this->db->where('discount_id', $existing->discount_id)
						->delete('invoice_discount_items');
				}
				// Then delete the discount records
				$this->db->where('invoice_code', $from_invoice_code)
					->where('student_id', $students_ids[$i])
					->where('term', $running_term)
					->where('year', $running_year)
					->delete('invoice_discounts');
			}
			
			$this->db->where('student_id', $students_ids[$i]);
			$this->db->where('status', 'approved');
			$this->db->where('is_active', 1);
			$this->db->where('discount_category', 'invoice');
			$assigned_discounts = $this->db->get('student_discount_assignments')->result();

			if(count($assigned_discounts) > 0) {
				foreach($assigned_discounts as $assignment) {
					$profile = $this->db->where('profile_id', $assignment->profile_id)
						->where('is_active', 1)
						->get('discount_profiles')->row();
					
					if($profile) {
						// Get ALL invoice items for student in new class
						$this->db->where('student_id', $students_ids[$i]);
						$this->db->where('class_id', $to_class_id);
						$this->db->where('term', $running_term);
						$this->db->where('year', $running_year);
						$new_invoices = $this->db->get('invoice')->result_array();
						
						$applicable_total = 0;
						$applicable_invoices = array();
						
						if($profile->bill_item_ids === '*') {
							// Wildcard: apply to ALL items
							foreach($new_invoices as $inv) {
								$applicable_total += $inv['amount'];
								$applicable_invoices[] = $inv;
							}
						} else {
							// Specific items: check bill_item_ids
							$profile_bill_items = explode(',', $profile->bill_item_ids);
							foreach($new_invoices as $inv) {
								$bill_item_row = $this->db->get_where('bill_item', array('title' => $inv['title']))->row();
								if($bill_item_row && in_array($bill_item_row->id, $profile_bill_items)) {
									$applicable_total += $inv['amount'];
									$applicable_invoices[] = $inv;
								}
							}
						}
						
						if(count($applicable_invoices) > 0) {
							$total_discount = $profile->discount_method == 'percentage' 
								? ($applicable_total * $profile->discount_value) / 100 
								: min($profile->discount_value, $applicable_total);
							
							$this->db->insert('invoice_discounts', array(
								'invoice_code' => $from_invoice_code,
								'student_id' => $students_ids[$i],
								'profile_id' => $profile->profile_id,
								'discount_category' => 'invoice',
								'discount_method' => $profile->discount_method,
								'discount_value' => $profile->discount_value,
								'discount_amount' => $total_discount,
								'reason' => 'Profile: ' . $profile->profile_name . ' (Class Move)',
								'status' => 'approved',
								'applied_by' => $this->session->userdata('login_user_id'),
								'approved_by' => $this->session->userdata('login_user_id'),
								'approved_at' => date('Y-m-d H:i:s'),
								'year' => $running_year,
								'term' => $running_term
							));
							$discount_id = $this->db->insert_id();
							
							foreach($applicable_invoices as $inv) {
								$item_discount = ($profile->discount_method == 'percentage')
									? ($inv['amount'] * $profile->discount_value / 100)
									: (($inv['amount'] / $applicable_total) * $total_discount);
								
								$this->db->insert('invoice_discount_items', [
									'discount_id' => $discount_id,
									'invoice_id' => $inv['invoice_id'],
									'invoice_code' => $inv['invoice_code'],
									'student_id' => $students_ids[$i],
									'item_title' => $inv['title'],
									'original_amount' => $inv['amount'],
									'discount_amount' => $item_discount,
									'discounted_amount' => $inv['amount'] - $item_discount
								]);
								
								$this->db->where('invoice_id', $inv['invoice_id'])
									->update('invoice', array(
										'amount' => $inv['amount'] - $item_discount,
										'due' => ($inv['amount'] - $item_discount) - $inv['amount_paid']
									));
							}
						}
					}
				}
			}
			// END DISCOUNT RECALCULATION
			
			// FINANCIAL SYNC: Sync updated invoices to ledger
			sync_invoice_to_ledger($from_invoice_code, $students_ids[$i]);

			$invoice_adder++;

		} /*end of each student*/

		echo 'moved';

	}

	//graduate student(s) from one class to the other
	function graduate_students($from_class_id = '', $year_batch = '', $students_ids = array()) {

		//explode students_ids from - to ,
		$students_ids = explode('-', $students_ids);

		$batchInsert = array();
		$batchUpdate = array();

		$data['class_id'] = $from_class_id;
		$data['year_batch'] = $year_batch;

		//for each student
		for ($i = 0; $i < sizeof($students_ids); $i++) {

			$this->db->select_max('enroll_id');
			$enroll_id = $this->db->get_where('enroll', ['student_id' => $students_ids[$i]])->row()->enroll_id;

			$enroll_data['enroll_id'] = $enroll_id;
			$enroll_data['mute'] = 2;


			$data['student_id'] = $students_ids[$i];

			$batchInsert[] = $data;
			$batchUpdate[] = $enroll_data;
		}

		$this->db->insert_batch('alumni', $batchInsert);
		$this->db->update_batch('enroll', $batchUpdate, 'enroll_id');

		echo 'graduated';

	}


	//update/change student(s) residential status
	function update_students_residence_status($class_id, $term, $year, $students_ids = array()) {

		//explode students_ids from - to ,
		$students_ids = explode('-', $students_ids);

		$batchUpdate = array();


		$data['term'] = $term;
		$data['year'] = $year;


		

		//for each student
		for ($i = 0; $i < sizeof($students_ids); $i++) {

			$this->db->where('term', $term);
			$this->db->where('year', $year);
			$this->db->where('class_id', $class_id);
			$this->db->order_by('enroll_id', 'desc');
			$this->db->limit(1);
			$enroll_query = $this->db->get_where('enroll', ['student_id' => $students_ids[$i]])->row();

			$current_residence_type = $enroll_query->residence_type;


			if($current_residence_type == 'Day') {

				$enroll_data['residence_type'] = 'Boarding';


			} else {

				$enroll_data['residence_type'] = 'Day';
			}

			$new_residence_type = $enroll_data['residence_type'];/*new residential status*/


			$student_enroll_id = $enroll_query->enroll_id;

			/*update invoice and payment*/
			/*WE NEED TO UPDATE THE INVOICE OR BILLS FOR THIS STUDENT*/
			/*get current class invoice details*/
			$this->db->where('student_id', $students_ids[$i]);
			$this->db->where('class_id', $class_id);
			$this->db->where('term', $term);
			$this->db->where('year', $year);
			$old_invoice_query = $this->db->get('invoice');
			
			// Check if invoice exists before accessing properties
			if($old_invoice_query->num_rows() > 0) {
				$old_invoice_code = $old_invoice_query->row()->invoice_code;
				$old_invoice_creation_timestamp = $old_invoice_query->row()->creation_timestamp;
			} else {
				$old_invoice_code = null;
				$old_invoice_creation_timestamp = null;
			}

			$invoiceIdsFound = array();
			$batchInsertArray = array();


			/*get bill items for the old and new residence_type*/
			$oldResidenceClassBills = $this->financial_report_model->getTermlyClassBillsForStudent($class_id, $year, $term, $current_residence_type);
			$newResidenceClassBills = $this->financial_report_model->getTermlyClassBillsForStudent($class_id, $year, $term, $new_residence_type);
			
			$oldResidenceItemsIds = array_column($oldResidenceClassBills, 'bill_item_id');
			$oldResidenceAllItemsTitles = array();
			if(count($oldResidenceItemsIds) > 0) {
				$this->db->select('title');
				$this->db->where_in('id', $oldResidenceItemsIds);
				$oldResidenceAllItemsQuery = $this->db->get('bill_item')->result_array();
				$oldResidenceAllItemsTitles = array_column($oldResidenceAllItemsQuery, 'title');
			}
			
			/*we check if any payment were made for the previous bill. If so, we sum up the amount and deduct it from the current bill*/
			$studentPaid = false;
			$amountPaidForThePreviousInvoiceItems = 0;

			if(count($oldResidenceAllItemsTitles) > 0):

				$this->db->select_sum('amount_paid');
				$this->db->where('student_id', $students_ids[$i]);
				$this->db->where('class_id', $class_id);
				$this->db->where('term', $term);
				$this->db->where('year', $year);
				$this->db->where_in('title', $oldResidenceAllItemsTitles);
				$amountPaidForThePreviousInvoiceItems = $this->db->get('invoice')->row()->amount_paid;

			endif;


			/*we need to find out if this is a new admission so we update the admissio fee as well*/
			if($current_residence_type == 'Day') {
				$bill_item_id = 9;

			} else if($current_residence_type == 'Boarding') {
				$bill_item_id = 8;
			}

			$newAdmissionItemTitle = $this->crud_model->getBillItemRowById($bill_item_id)->title;
			$this->db->where('student_id', $students_ids[$i]);
			$this->db->where('class_id', $class_id);
			$this->db->where('term', $term);
			$this->db->where('year', $year);
			$this->db->where('title', $newAdmissionItemTitle);
			$newAdmissionRow = $this->db->get('invoice')->num_rows();

			if($newAdmissionRow > 0) {
				/*student was admitted in the selected period*/
				/*get the details*/
				if($bill_item_id == 9) {
					$newAdmissionItemTitleRow = $this->crud_model->getBillItemRowById(8);

				} else {
					$newAdmissionItemTitleRow = $this->crud_model->getBillItemRowById(9);
				}


				/*new admission fee entry*/
				$bill_data['student_id'] = $students_ids[$i];
				$bill_data['class_id'] = $class_id;
				$bill_data['invoice_code'] = $old_invoice_code;
				$bill_data['title'] = strtoupper(strtolower($newAdmissionItemTitleRow->title));
				$bill_data['description'] = $newAdmissionItemTitleRow->description;
				$bill_data['amount'] = $newAdmissionItemTitleRow->amount;
				$bill_data['amount_paid'] = 0;
				$bill_data['due'] = $bill_data['amount'];
				$bill_data['status'] = 'unpaid';
				$bill_data['term'] = $term;
				$bill_data['year'] = $year;
				$bill_data['residence_type'] = $new_residence_type;
				$bill_data['creation_timestamp'] = $old_invoice_creation_timestamp;

	      		$batchInsertArray[] = $bill_data;

			}


			/*We delete the old bill items*/
			$this->db->where('student_id', $students_ids[$i]);
			$this->db->where('class_id', $class_id);
			$this->db->where('term', $term);
			$this->db->where('year', $year);
			$this->db->delete('invoice');


			foreach($newResidenceClassBills as $new) {

				$bill_item = $this->crud_model->getBillItemRowById($new['bill_item_id'])->title;
				$bill_item_desc = $this->crud_model->getBillItemRowById($new['bill_item_id'])->description;

				/*we do new entry*/
				$bill_data['student_id'] = $students_ids[$i];
				$bill_data['class_id'] = $class_id;
				$bill_data['invoice_code'] = $old_invoice_code;
				$bill_data['title'] = strtoupper(strtolower($bill_item));
				$bill_data['description'] = $bill_item_desc;
				$bill_data['amount'] = $new['bill_item_amount'];
				$bill_data['amount_paid'] = 0;
				$bill_data['due'] = $bill_data['amount'];
				$bill_data['status'] = 'unpaid';
				$bill_data['term'] = $term;
				$bill_data['year'] = $year;
				$bill_data['residence_type'] = $new_residence_type;
				$bill_data['creation_timestamp'] = $old_invoice_creation_timestamp;

				$batchInsertArray[] = $bill_data;

			}

			

			/*batch insert for this student*/
			if(count($batchInsertArray) > 0) {

				$this->db->insert_batch('invoice', $batchInsertArray); /*we insert now*/
			}

			if($amountPaidForThePreviousInvoiceItems > 0) { /*only if there is any*/

				$studentPaid = true;

				/*we find those invoice items that he is owing so we clear them with this balance*/
				$this->db->where('student_id', $students_ids[$i]);
				$this->db->where('due >', '0');
				$owingsQuery = $this->db->get('invoice')->result_array();

				if(count($owingsQuery) > 0) {

					foreach($owingsQuery as $ow) {

						/*break off point*/
						if($amountPaidForThePreviousInvoiceItems < 1) break;

						if($amountPaidForThePreviousInvoiceItems <= $ow['due']) {
							/*if amount balance is less than the owing for this item in this row, we settle part and exit the loop*/

							$this->db->where('invoice_id', $ow['invoice_id']);
							$this->db->set('amount_paid', 'amount_paid + '. $amountPaidForThePreviousInvoiceItems, false);
							$this->db->set('due', 'due - '. $amountPaidForThePreviousInvoiceItems, false);
							$this->db->update('invoice');

							/*set it to 0 because it has been exhausted*/
							$amountPaidForThePreviousInvoiceItems = 0;

						} else {

							/*if amount balance is greater than the owing for this item in this row, we settle all and move to the next row and do another settlement untill this condition is not met*/

							$this->db->where('invoice_id', $ow['invoice_id']);
							$this->db->set('amount_paid', 'amount_paid + '. $ow['due'], false);
							$this->db->set('due', 'due - '. $ow['due'], false);
							$this->db->update('invoice');

							/*reduce it by the amount owe on this row*/
							$amountPaidForThePreviousInvoiceItems -= $ow['due'];

						}

					} /*END OF EACH OWING ROW LOOP*/

				} else {

					/*we effect this to one of the invoice ids. It might end up being an overdraft for the student*/
					$this->db->where('invoice_id', $invoiceIdsFound[0]);
					$this->db->set('amount_paid', 'amount_paid + '. $amountPaidForThePreviousInvoiceItems, false);
					$this->db->set('due', 'due - '. $amountPaidForThePreviousInvoiceItems, false);
					$this->db->update('invoice');
				}


			} /*END CHECKING IF THERE IS ANY PAYMENT ITEMS THAT MUST BE DELETED*/
				


			/*WE ALSO NEED TO UPDATE THE PAYMENT TABLE WITH THE NEW OWING BALANCE*/
			if($studentPaid):

				$this->db->select_sum('due');
				$this->db->where('student_id', $students_ids[$i]);
				$this->db->where('due >', 0);
				$studentTotalOwing = $this->db->get('invoice')->row()->due;

				$this->db->select_max('payment_id');
				$this->db->where('student_id', $students_ids[$i]);
				$this->db->where('invoice_id IS NOT NULL');
				$this->db->where('invoice_code IS NOT NULL');
				$lastPaymentId = $this->db->get('payment')->row()->payment_id;

				/*update now*/
				$this->db->where('payment_id', $lastPaymentId);
				$this->db->set('due', $studentTotalOwing);
				$this->db->update('payment');

				/*we also update the invoice status here*/
				if($studentTotalOwing == 0) {
					/*paid*/
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('status !=', 'paid');
					$this->db->where('due', 0);
					$this->db->set('status', 'paid');
					$this->db->update('invoice');

				} if($studentTotalOwing < 0) {
					/*overpaid*/
					$this->db->select('invoice_code');
					$this->db->distinct();
					$this->db->from('invoice');
					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where('due <', '0');
					$invCodesArray = $this->db->get()->result_array();

					$invCodes = array_column($invCodesArray, 'invoice_code');

					$this->db->where('student_id', $students_ids[$i]);
					$this->db->where_in('invoice_code', $invCodes);
					$this->db->set('status', 'overpaid');

				}
				/*END OF STATUS UPDATE*/

			endif;

			/*END OF EACH STUDENT*/
			
			// DISCOUNT RECALCULATION FOR RESIDENCE STATUS CHANGE
			$existing_discounts = $this->db->where('invoice_code', $old_invoice_code)
				->where('student_id', $students_ids[$i])
				->where('term', $term)
				->where('year', $year)
				->get('invoice_discounts')->result();
			
			if(count($existing_discounts) > 0) {
				foreach($existing_discounts as $existing) {
					$this->db->where('discount_id', $existing->discount_id)->delete('invoice_discount_items');
				}
				$this->db->where('invoice_code', $old_invoice_code)
					->where('student_id', $students_ids[$i])
					->where('term', $term)
					->where('year', $year)
					->delete('invoice_discounts');
			}
			
			$this->db->where('student_id', $students_ids[$i]);
			$this->db->where('status', 'approved');
			$this->db->where('is_active', 1);
			$this->db->where('discount_category', 'invoice');
			$assigned_discounts = $this->db->get('student_discount_assignments')->result();

			if(count($assigned_discounts) > 0) {
				foreach($assigned_discounts as $assignment) {
					$profile = $this->db->where('profile_id', $assignment->profile_id)
						->where('is_active', 1)
						->get('discount_profiles')->row();
					
					if($profile) {
						$this->db->where('student_id', $students_ids[$i]);
						$this->db->where('class_id', $class_id);
						$this->db->where('term', $term);
						$this->db->where('year', $year);
						$new_invoices = $this->db->get('invoice')->result_array();
						
						$applicable_total = 0;
						$applicable_invoices = array();
						
						if($profile->bill_item_ids === '*') {
							foreach($new_invoices as $inv) {
								$applicable_total += $inv['amount'];
								$applicable_invoices[] = $inv;
							}
						} else {
							$profile_bill_items = explode(',', $profile->bill_item_ids);
							foreach($new_invoices as $inv) {
								$bill_item_row = $this->db->get_where('bill_item', array('title' => $inv['title']))->row();
								if($bill_item_row && in_array($bill_item_row->id, $profile_bill_items)) {
									$applicable_total += $inv['amount'];
									$applicable_invoices[] = $inv;
								}
							}
						}
						
						if(count($applicable_invoices) > 0) {
							$total_discount = $profile->discount_method == 'percentage' 
								? ($applicable_total * $profile->discount_value) / 100 
								: min($profile->discount_value, $applicable_total);
							
							$this->db->insert('invoice_discounts', array(
								'invoice_code' => $old_invoice_code,
								'student_id' => $students_ids[$i],
								'profile_id' => $profile->profile_id,
								'discount_category' => 'invoice',
								'discount_method' => $profile->discount_method,
								'discount_value' => $profile->discount_value,
								'discount_amount' => $total_discount,
								'reason' => 'Profile: ' . $profile->profile_name . ' (Residence Change)',
								'status' => 'approved',
								'applied_by' => $this->session->userdata('login_user_id'),
								'approved_by' => $this->session->userdata('login_user_id'),
								'approved_at' => date('Y-m-d H:i:s'),
								'year' => $year,
								'term' => $term
							));
							$discount_id = $this->db->insert_id();
							
							foreach($applicable_invoices as $inv) {
								$item_discount = ($profile->discount_method == 'percentage')
									? ($inv['amount'] * $profile->discount_value / 100)
									: (($inv['amount'] / $applicable_total) * $total_discount);
								
								$this->db->insert('invoice_discount_items', [
									'discount_id' => $discount_id,
									'invoice_id' => $inv['invoice_id'],
									'invoice_code' => $inv['invoice_code'],
									'student_id' => $students_ids[$i],
									'item_title' => $inv['title'],
									'original_amount' => $inv['amount'],
									'discount_amount' => $item_discount,
									'discounted_amount' => $inv['amount'] - $item_discount
								]);
								
								$this->db->where('invoice_id', $inv['invoice_id'])
									->update('invoice', array(
										'amount' => $inv['amount'] - $item_discount,
										'due' => ($inv['amount'] - $item_discount) - $inv['amount_paid']
									));
							}
						}
					}
				}
			}
			// END DISCOUNT RECALCULATION
			
			sync_invoice_to_ledger($old_invoice_code, $students_ids[$i]);
			
			/*update both invoice and payment tables with the residence type of the student*/


			//for invoice
			$this->db->where('student_id', $students_ids[$i]);
			$this->db->where('class_id', $class_id);
			$this->db->where('term', $term);
			$this->db->where('year', $year);
			$this->db->set('residence_type', $new_residence_type);
			$this->db->update('payment');

			$this->db->where('enroll_id', $student_enroll_id);
			$this->db->set('residence_type', $new_residence_type);
			$this->db->update('enroll');

		}

		

		echo 'success';

	}

	//
	function muteAll() {
		$this->db->select('student_id');
		$this->db->from('student');
		$this->db->where('mute', '1');
		$students_ids = $this->db->get()->result();

		$row_counter = 0;
		$row_result = false;

		foreach ($students_ids as $st) {
			$tables = array(
				'attendance', 'daily_fee_wallet', 'invoice', 'mark', 'daily_fee_wallet',
			);

			for ($i = 0; $i < sizeof($tables); $i++) {

				$this->db->where('student_id', $st->student_id);
				$this->db->set('mute', '1');
				$row_result = $this->db->update($tables[$i]);

				if ($row_result) {
					$row_counter++;
				} else {
					$row_counter--;
				}

			}
		}

		if ($row_counter == (sizeof($tables) * sizeof($students_ids))) {
			echo 'All';
		} else {
			echo 'Some';
		}

	}

	function get_hubtel_data() {
		$page_data['running_year'] = $this->crud_model->get_settings('running_year');
		$page_data['running_term'] = $this->crud_model->get_settings('running_term');

		$this->load->view('backend/admin/hubtel_rising_app', $page_data);
	}




	function updateStudentEdit($parent_id) {

		$data = $this->crud_model->get_guardian_data($parent_id);
		$ajax_data['phone'] = $data->phone;
		$ajax_data['address'] = $data->address;

		echo json_encode($ajax_data);

	}

	//get all students' attendance
	function getStudentsAttendance($timestamp = '', $att_status = '') {
		$page_data['timestamp'] = strtotime($timestamp);
		$page_data['att_status'] = $att_status;
		$ajax_data['table'] = $this->load->view('backend/admin/get_students_attendance', $page_data, true);

		echo json_encode($ajax_data);
	}

	/**
	 * Get attendance report data with advanced filtering
	 * Supports date range, class, gender, residential status, boarding house filters
	 */
	function getAttendanceReportData() {
		// Get filters from POST
		$filters = $this->input->post('filters');
		
		$dateRange = isset($filters['dateRange']) ? $filters['dateRange'] : null;
		$status = isset($filters['status']) ? $filters['status'] : '';
		$classId = isset($filters['class']) ? $filters['class'] : '';
		$gender = isset($filters['gender']) ? $filters['gender'] : '';
		$residential = isset($filters['residential']) ? $filters['residential'] : '';
		$houseId = isset($filters['house']) ? $filters['house'] : '';
		
		// OPTIMIZATION 1: Fetch all settings in one query and cache them
		$settings = $this->db->where_in('type', array('running_year', 'running_term', 'running_sem', 'boarding_enabled'))
			->get('settings')
			->result_array();
		
		$settings_map = array();
		foreach ($settings as $setting) {
			$settings_map[$setting['type']] = $setting['description'];
		}
		
		$running_year = $settings_map['running_year'];
		$running_term = $settings_map['running_term'];
		$running_sem = $settings_map['running_sem'];
		$is_boarding = (isset($settings_map['boarding_enabled']) && $settings_map['boarding_enabled'] == '1');
		
		// Build query for students - Use DISTINCT to prevent duplicates from enroll table
		$this->db->distinct();
		$this->db->select('s.student_id, s.student_code, s.name, s.sex, s.parent_id, e.class_id, e.section_id, p.name as parent_name, p.phone as parent_phone');
		$this->db->from('student s');
		$this->db->join('enroll e', 's.student_id = e.student_id', 'left');
		$this->db->join('parent p', 's.parent_id = p.parent_id', 'left');
		$this->db->where('e.year', $running_year);
		$this->db->where('e.term', $running_term);
		$this->db->where('s.mute', '0');
		
		// Apply class filter
		if (!empty($classId)) {
			$this->db->where('e.class_id', $classId);
		}
		
		// Apply gender filter
		if (!empty($gender)) {
			$this->db->where('s.sex', $gender);
		}
		
		// Apply residential status filter (if boarding enabled)
		if ($is_boarding && !empty($residential)) {
			if ($residential == 'boarding') {
				$this->db->where('s.residence_type', 'boarding');
			} else if ($residential == 'day') {
				$this->db->where('s.residence_type', 'day');
			}
		}
		
		// Apply boarding house filter (if boarding enabled)
		if ($is_boarding && !empty($houseId)) {
			$this->db->where('s.boarding_house_id', $houseId);
		}
		
		// Group by student_id to ensure uniqueness
		$this->db->group_by('s.student_id');
		$this->db->order_by('s.name', 'ASC');
		
		$students_query = $this->db->get();
		$students = $students_query->result_array();
		
		// OPTIMIZATION 2: Batch-fetch all class and section info in one query each
		$class_ids = array_unique(array_filter(array_column($students, 'class_id')));
		$section_ids = array_unique(array_filter(array_column($students, 'section_id')));
		
		$classes_map = array();
		if (!empty($class_ids)) {
			$classes = $this->db->where_in('class_id', $class_ids)->get('class')->result_array();
			foreach ($classes as $class) {
				$classes_map[$class['class_id']] = $class;
			}
		}
		
		$sections_map = array();
		if (!empty($section_ids)) {
			$sections = $this->db->where_in('section_id', $section_ids)->get('section')->result_array();
			foreach ($sections as $section) {
				$sections_map[$section['section_id']] = $section;
			}
		}
		
		// OPTIMIZATION 3: Batch-fetch all attendance records in one query
		$student_ids = array_column($students, 'student_id');
		$attendance_map = array();
		
		// Process date range
		$startDate = null;
		$endDate = null;
		if ($dateRange && isset($dateRange['start']) && isset($dateRange['end'])) {
			$startDate = strtotime($dateRange['start']);
			$endDate = strtotime($dateRange['end']);
		}
		
		// If single date (start == end), use that date
		$isSingleDate = ($startDate == $endDate);
		
		if (!empty($student_ids)) {
			if ($isSingleDate) {
				// Single date - get attendance for that specific date
				$attendance_records = $this->db->select('student_id, status')
					->where_in('student_id', $student_ids)
					->where('timestamp', $startDate)
					->where('year', $running_year)
					->get('attendance')
					->result_array();
				
				foreach ($attendance_records as $record) {
					$attendance_map[$record['student_id']] = $record['status'];
				}
			} else {
				// Date range - get most recent attendance status for each student
				// Use subquery to get max timestamp per student, then join to get status
				$subquery = $this->db->select('student_id, MAX(timestamp) as max_timestamp')
					->where_in('student_id', $student_ids)
					->where('timestamp >=', $startDate)
					->where('timestamp <=', $endDate)
					->where('year', $running_year)
					->group_by('student_id')
					->get_compiled_select('attendance');
				
				$attendance_records = $this->db->select('a.student_id, a.status')
					->from('attendance a')
					->join("($subquery) latest", 'a.student_id = latest.student_id AND a.timestamp = latest.max_timestamp', 'inner')
					->get()
					->result_array();
				
				foreach ($attendance_records as $record) {
					$attendance_map[$record['student_id']] = $record['status'];
				}
			}
		}
		
		// Initialize counters
		$summary = array(
			'total' => 0,
			'present' => 0,
			'presentRegular' => 0,
			'presentLate' => 0,
			'absent' => 0,
			'absentRegular' => 0,
			'absentSickHome' => 0,
			'absentSickClinic' => 0,
			'notMarked' => 0
		);
		
		$chartData = array(
			'distribution' => array(
				'present' => 0,
				'presentRegular' => 0,
				'presentLate' => 0,
				'absent' => 0,
				'absentRegular' => 0,
				'absentSickHome' => 0,
				'absentSickClinic' => 0,
				'notMarked' => 0
			),
			'byClass' => array()
		);
		
		$studentRecords = array();
		$processedStudents = array(); // Track processed students to prevent duplicates
		
		// Process each student
		foreach ($students as $student) {
			$student_id = $student['student_id'];
			
			// Skip if already processed (extra safety check)
			if (isset($processedStudents[$student_id])) {
				continue;
			}
			$processedStudents[$student_id] = true;
			
			$class_id = $student['class_id'];
			$section_id = $student['section_id'];
			
			// OPTIMIZATION 4: Use pre-fetched class and section data
			$class_name = '';
			if ($class_id && isset($classes_map[$class_id])) {
				$class_info = $classes_map[$class_id];
				$class_name = $class_info['name'] . ' ' . $class_info['name_numeric'];
				if ($section_id && isset($sections_map[$section_id])) {
					$class_name .= ' ' . $sections_map[$section_id]['name'];
				}
			}
			
			// OPTIMIZATION 5: Use pre-fetched attendance data
			$att_status = isset($attendance_map[$student_id]) ? $attendance_map[$student_id] : 0; // Default: Not Marked
			
			// Apply status filter
			// Status filter values: 1=Present (includes 1 and 3), 2=Absent (includes 2, 4, 5), 0=Not Marked
			if ($status !== '' && $status !== null) {
				$matchesFilter = false;
				
				if ($status == '1') {
					// Present filter: includes Present (1) and Late (3)
					$matchesFilter = ($att_status == 1 || $att_status == 3);
				} else if ($status == '2') {
					// Absent filter: includes Absent (2), Sick-Home (4), Sick-Clinic (5)
					$matchesFilter = ($att_status == 2 || $att_status == 4 || $att_status == 5);
				} else if ($status == '0') {
					// Not Marked filter
					$matchesFilter = ($att_status == 0);
				}
				
				if (!$matchesFilter) {
					continue; // Skip this student if status doesn't match filter
				}
			}
			
			// Update summary counters
			// Status values: 1=Present, 2=Absent, 3=Late, 4=Sick-Home, 5=Sick-Clinic, 0=Not Marked
			$summary['total']++;
			if ($att_status == 1) {
				// Regular Present
				$summary['present']++;
				$summary['presentRegular']++;
				$chartData['distribution']['present']++;
				$chartData['distribution']['presentRegular']++;
			} else if ($att_status == 3) {
				// Late (counts as Present)
				$summary['present']++;
				$summary['presentLate']++;
				$chartData['distribution']['present']++;
				$chartData['distribution']['presentLate']++;
			} else if ($att_status == 2) {
				// Regular Absent
				$summary['absent']++;
				$summary['absentRegular']++;
				$chartData['distribution']['absent']++;
				$chartData['distribution']['absentRegular']++;
			} else if ($att_status == 4) {
				// Sick at Home
				$summary['absent']++;
				$summary['absentSickHome']++;
				$chartData['distribution']['absent']++;
				$chartData['distribution']['absentSickHome']++;
			} else if ($att_status == 5) {
				// Sick at Clinic
				$summary['absent']++;
				$summary['absentSickClinic']++;
				$chartData['distribution']['absent']++;
				$chartData['distribution']['absentSickClinic']++;
			} else {
				// Not Marked
				$summary['notMarked']++;
				$chartData['distribution']['notMarked']++;
			}
			
			// Update class-wise chart data
			$classKey = $class_name;
			if (!isset($chartData['byClass'][$classKey])) {
				$chartData['byClass'][$classKey] = array(
					'className' => $class_name,
					'present' => 0,
					'absent' => 0,
					'notMarked' => 0
				);
			}
			
			if ($att_status == 1 || $att_status == 3) {
				// Present or Late
				$chartData['byClass'][$classKey]['present']++;
			} else if ($att_status == 2 || $att_status == 4 || $att_status == 5) {
				// Absent (Regular, Sick-Home, or Sick-Clinic)
				$chartData['byClass'][$classKey]['absent']++;
			} else {
				// Not Marked
				$chartData['byClass'][$classKey]['notMarked']++;
			}
			
			// Get student photo
			$photo_url = $this->crud_model->get_image_url('student', $student_id, $student['sex']);
			
			// Build student record
			$studentRecords[] = array(
				'studentId' => $student_id,
				'studentCode' => $student['student_code'],
				'name' => $student['name'],
				'className' => $class_name,
				'gender' => ucfirst($student['sex']),
				'status' => $att_status,
				'parentName' => $student['parent_name'],
				'parentPhone' => $student['parent_phone'],
				'photo' => $photo_url
			);
		}
		
		// Convert byClass associative array to indexed array and sort by class order
		// Use the same ordering as getFullClassList helper (CRECHE, NURSERY, KG, BASIC, JHS)
		$class_order = array('CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS');
		$sorted_by_class = array();
		
		// First, organize by class name and numeric
		foreach ($chartData['byClass'] as $classData) {
			$className = $classData['className'];
			// Extract class name (first word) for ordering
			$parts = explode(' ', trim($className));
			$mainClassName = $parts[0];
			$numeric = isset($parts[1]) ? intval($parts[1]) : 0;
			
			// Find order index
			$orderIndex = array_search($mainClassName, $class_order);
			if ($orderIndex === false) {
				$orderIndex = 999; // Put unknown classes at the end
			}
			
			$sorted_by_class[] = array(
				'orderIndex' => $orderIndex,
				'numeric' => $numeric,
				'data' => $classData
			);
		}
		
		// Sort by order index first, then by numeric
		usort($sorted_by_class, function($a, $b) {
			if ($a['orderIndex'] != $b['orderIndex']) {
				return $a['orderIndex'] - $b['orderIndex'];
			}
			return $a['numeric'] - $b['numeric'];
		});
		
		// Extract just the data
		$chartData['byClass'] = array_map(function($item) {
			return $item['data'];
		}, $sorted_by_class);
		
		// Get teacher information if class filter is applied
		$teacherInfo = null;
		if (!empty($classId)) {
			$teacher_id = $this->crud_model->get_class_teacher_id($classId);
			if ($teacher_id) {
				$teacher = $this->db->select('name, phone')
					->where('teacher_id', $teacher_id)
					->get('teacher')
					->row();
				
				if ($teacher) {
					$teacherInfo = array(
						'name' => $teacher->name,
						'phone' => $teacher->phone
					);
				}
			}
		}
		
		// Return JSON response
		$response = array(
			'success' => true,
			'summary' => $summary,
			'chartData' => $chartData,
			'students' => $studentRecords,
			'teacherInfo' => $teacherInfo
		);
		
		echo json_encode($response);
	}


	//send birthday messages to students
	function sendBirthdayMessages($to) {
		if ($active_sms_service != 'disabled') {
							$student_name = $this->db->get_where('student', array('student_id' => $row['student_id']))->row()->name;
							$parent_id = $this->db->get_where('student', array('student_id' => $row['student_id']))->row()->parent_id;
							$receiver_phone = $this->db->get_where('parent', array('parent_id' => $parent_id))->row()->phone;
							$message = 'Your child' . ' ' . $student_name . 'is absent today.';

							$receiver_phone_array = array();
							$receiver_phone_array[] = $receiver_phone;

							$result = $this->sms_model->send_sms($message, $receiver_phone_array);
						}
	}


	/*FOR EVERYTHING ABOUT BOARDING SYSTEM MANAGEMENT*/
	/*create, update and delete boarding house*/
	function manageBoardingHouse($param="", $param2="", $param3="") {
		if ($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'));

		if($param == 'create' || $param == 'update') {
			$current = $param == 'update' ? $this->db->get_where('boarding_house', ['house_id' => $param2])->row_array() : [];
			$status_input = strtolower(trim((string)$this->input->post('house_status')));
			$status_map = ['available'=>'Available','assigned'=>'Assigned','maintenance'=>'Maintenance','unknown'=>'Unknown'];
			$houseData = [
				'house_name' => trim((string)$this->input->post('house_name')),
				'house_user_fee' => $this->input->post('house_user_fee'),
				'house_capacity' => $this->input->post('house_capacity'),
				'house_year_established' => $this->input->post('house_year_established'),
				'house_gps_code' => $this->input->post('house_gps_code'),
				'house_master_id' => $this->input->post('house_master_id') ?: null,
				'house_prefect_id' => $this->input->post('house_prefect_id') ?: null,
				'house_description' => $this->input->post('house_description'),
				'house_status' => isset($status_map[$status_input]) ? $status_map[$status_input] : ($current['house_status'] ?? 'Available')
			];

			if($houseData['house_name'] === '') {
				$this->session->set_flashdata('error_message', 'House name is required');
				redirect(site_url('admin/manageBoardingHouse'));
				return;
			}

			if($param == 'create') {
				$this->db->insert('boarding_house', $houseData);
				$house_id = $this->db->insert_id();
			} else {
				$house_id = (int)$param2;
				$this->db->where('house_id', $house_id)->update('boarding_house', $houseData);
			}

			if(!empty($_FILES['house_image_link']['name'])) {
				$config = [
					'upload_path' => './uploads/boarding/',
					'allowed_types' => 'jpg|jpeg|png',
					'file_name' => 'house_'.$house_id,
					'max_size' => 2048,
					'overwrite' => true
				];
				$this->load->library('upload');
				$this->upload->initialize($config);
				if($this->upload->do_upload('house_image_link')) {
					$upload = $this->upload->data();
					$this->db->where('house_id', $house_id)->update('boarding_house', ['house_image_link' => 'uploads/boarding/'.$upload['file_name']]);
				}
			}

			$this->session->set_flashdata('flash_message', $param == 'create' ? 'Boarding house added successfully' : 'Boarding house updated successfully');
			redirect(site_url('admin/manageBoardingHouse'));
			return;
		}

		if($param == 'delete') {
			$child_count = $this->db->where('house_id', $param2)->count_all_results('boarding_dormitory');
			if($child_count > 0) {
				echo json_encode(['status' => 'error', 'message' => 'Remove or reassign this house\'s dormitories before deleting it.']);
				return;
			}
			$this->db->where('house_id', $param2)->delete('boarding_house');
			$this->session->set_flashdata('flash_message', 'Boarding house deleted successfully');
			echo json_encode(['status' => 'success']);
			return;
		}

		$page_data['page_name'] = '/boarding/boarding_house';
		$page_data['page_title'] = get_phrase('manage_boarding_house');
		$this->load->view('backend/main', $page_data);
	}

	/*create, update and delete boarding dormitory*/
	function manageBoardingDormitory($param="", $param2="", $param3="") {

		if ($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'));

		if($param == 'create') {
			$dormData['house_id'] = $this->input->post('house_id');
			$dormData['dormitory_name'] = trim($this->input->post('dormitory_name'));
			$dormData['dormitory_capacity'] = $this->input->post('dormitory_capacity');
			$dormData['dormitory_type'] = $this->input->post('dormitory_type');
			$dormData['dormitory_floor'] = $this->input->post('dormitory_floor');
			$dormData['dormitory_description'] = $this->input->post('dormitory_description');
			$dorm_status = strtolower(trim((string)$this->input->post('dormitory_status')));
			$dorm_status_map = ['available'=>'Available','assigned'=>'Assigned','maintenance'=>'Maintenance','unknown'=>'Unknown'];
			$dormData['dormitory_status'] = isset($dorm_status_map[$dorm_status]) ? $dorm_status_map[$dorm_status] : 'Available';

			if(empty($dormData['dormitory_name'])) {
				$this->session->set_flashdata('error_message', 'Dormitory name is required');
				redirect(site_url('admin/manageBoardingDormitory'));
				return;
			}

			$this->db->insert('boarding_dormitory', $dormData);
			$this->session->set_flashdata('flash_message', 'Dormitory added successfully');
			redirect(site_url('admin/manageBoardingDormitory'));
			return;
		}

		if($param == 'update') {
			$dormData['house_id'] = $this->input->post('house_id');
			$dormData['dormitory_name'] = trim($this->input->post('dormitory_name'));
			$dormData['dormitory_capacity'] = $this->input->post('dormitory_capacity');
			$dormData['dormitory_type'] = $this->input->post('dormitory_type');
			$dormData['dormitory_floor'] = $this->input->post('dormitory_floor');
			$dormData['dormitory_description'] = $this->input->post('dormitory_description');
			$dorm_status = strtolower(trim((string)$this->input->post('dormitory_status')));
			$dorm_status_map = ['available'=>'Available','assigned'=>'Assigned','maintenance'=>'Maintenance','unknown'=>'Unknown'];
			$dormData['dormitory_status'] = isset($dorm_status_map[$dorm_status]) ? $dorm_status_map[$dorm_status] : 'Available';

			$this->db->where('dormitory_id', $param2);
			$this->db->update('boarding_dormitory', $dormData);
			$this->session->set_flashdata('flash_message', 'Dormitory updated successfully');
			redirect(site_url('admin/manageBoardingDormitory'));
			return;
		}

		if($param == 'delete') {
			$bed_count = $this->db->where('dormitory_id', $param2)->count_all_results('boarding_bed');
			if($bed_count > 0) {
				echo json_encode(['status' => 'error', 'message' => 'Remove or reassign this dormitory\'s beds before deleting it.']);
				return;
			}
			$this->db->where('dormitory_id', $param2)->delete('boarding_dormitory');
			$this->session->set_flashdata('flash_message', 'Dormitory deleted successfully');
			echo json_encode(['status' => 'success']);
			return;
		}

		$page_data['page_name'] = '/boarding/boarding_dormitory';
		$page_data['page_title'] = get_phrase('manage_dormitory');
		$this->load->view('backend/main', $page_data);
	}

	/*create, update and delete dormitory bed*/
	function manageDormitoryBed($param="", $param2="", $param3="") {

		if ($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'));

		if($param == 'create') {
			$bedData['dormitory_id'] = $this->input->post('dormitory_id');
			$bedData['bed_code'] = trim($this->input->post('bed_code'));
			$bedData['bed_number'] = $this->input->post('bed_number');
			$status_input = strtolower(trim((string)$this->input->post('bed_status')));
			$status_map = ['available' => 'Available', 'assigned' => 'Assigned', 'occupied' => 'Assigned', 'maintenance' => 'Maintenance', 'unknown' => 'Unknown'];
			$bedData['bed_status'] = isset($status_map[$status_input]) ? $status_map[$status_input] : 'Available';
			$bedData['bed_type'] = $this->input->post('bed_type');
			$bedData['bed_description'] = $this->input->post('bed_description');

			if(empty($bedData['bed_code'])) {
				$this->session->set_flashdata('error_message', 'Bed code is required');
				redirect(site_url('admin/manageDormitoryBed'));
				return;
			}

			$this->db->insert('boarding_bed', $bedData);
			$this->session->set_flashdata('flash_message', 'Bed added successfully');
			redirect(site_url('admin/manageDormitoryBed'));
			return;
		}

		if($param == 'update') {
			$bedData['dormitory_id'] = $this->input->post('dormitory_id');
			$bedData['bed_code'] = trim($this->input->post('bed_code'));
			$bedData['bed_number'] = $this->input->post('bed_number');
			$status_input = strtolower(trim((string)$this->input->post('bed_status')));
			$status_map = ['available' => 'Available', 'assigned' => 'Assigned', 'occupied' => 'Assigned', 'maintenance' => 'Maintenance', 'unknown' => 'Unknown'];
			$bedData['bed_status'] = isset($status_map[$status_input]) ? $status_map[$status_input] : 'Available';
			$bedData['bed_type'] = $this->input->post('bed_type');
			$bedData['bed_description'] = $this->input->post('bed_description');

			$this->db->where('bed_id', $param2);
			$this->db->update('boarding_bed', $bedData);
			$this->session->set_flashdata('flash_message', 'Bed updated successfully');
			redirect(site_url('admin/manageDormitoryBed'));
			return;
		}

		if($param == 'delete') {
			$bed = $this->db->get_where('boarding_bed', ['bed_id' => $param2])->row_array();
			$in_use = $this->db->where('bed_id', $param2)->count_all_results('enroll');
			if(($bed && $bed['bed_status'] === 'Assigned') || $in_use > 0) {
				echo json_encode(['status' => 'error', 'message' => 'Release or reassign the student using this bed before deleting it.']);
				return;
			}
			$this->db->where('bed_id', $param2)->delete('boarding_bed');
			$this->session->set_flashdata('flash_message', 'Bed deleted successfully');
			echo json_encode(['status' => 'success']);
			return;
		}

		$page_data['page_name'] = '/boarding/dormitory_bed';
		$page_data['page_title'] = get_phrase('manage_bed');
		$this->load->view('backend/main', $page_data);
	}

	/*get admission fee*/
	function getAdmissionFee($val) {

		$amount =  $this->boarding_model->getAdmissionFeeByResidentialStatus($val);
		$jsonData['text'] = 'ADMISSION FEE: ' . number_format($amount, 2, '.', ',');
		$jsonData['amount'] = $amount;
		$jsonData['item_id'] = $this->boarding_model->getAdmissionItemIdByResidentialStatus($val);

		echo json_encode($jsonData);
	}

	// Get admission bill preview for new student
	function getAdmissionBillPreview() {
		$class_id = $this->input->post('class_id');
		$residence_type = $this->input->post('residence_type');
		
		if(empty($class_id)) {
			echo json_encode(['status' => 'error', 'message' => 'Class ID is required']);
			return;
		}
		
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		try {
			// Get class category for filtering
			$class_row = $this->db->get_where('class', ['class_id' => $class_id])->row();
			$class_category = isset($class_row->category) ? $class_row->category : null;
			
			// Get all bill items
			$this->db->select('id, title, description, amount, class_category, specific_class_ids');
			$this->db->from('bill_item');
			$all_bill_items = $this->db->get()->result_array();
			
			$billsArray = array();
			
			// Filter bill items using 3-tier logic
			foreach($all_bill_items as $item) {
				$specific_class_ids = isset($item['specific_class_ids']) ? $item['specific_class_ids'] : null;
				$bill_class_category = isset($item['class_category']) ? $item['class_category'] : null;
				$item_title = strtoupper($item['title']);
				
				// Skip residence-specific items that don't match
				if($residence_type == 'Day') {
					// Skip boarding-specific items
					if(stripos($item_title, 'BOARDING') !== false && stripos($item_title, 'ADMISSION') !== false) {
						continue; // Skip "BOARDING ADMISSION FEE" when Day
					}
				} elseif($residence_type == 'Boarding') {
					// Skip day-specific admission fees (generic "ADMISSION FEE" without "BOARDING")
					if(stripos($item_title, 'ADMISSION FEE') !== false && stripos($item_title, 'BOARDING') === false) {
						continue; // Skip generic "ADMISSION FEE" when Boarding
					}
				}
				
				$applies = false;
				
				if(!empty($specific_class_ids)) {
					// Priority 1: Check specific class IDs
					$specific_classes = array_map('trim', explode(',', $specific_class_ids));
					if(in_array($class_id, $specific_classes)) {
						$applies = true;
					}
				} elseif(!empty($bill_class_category)) {
					// Priority 2: Check class category
					if($bill_class_category == $class_category) {
						$applies = true;
					}
				} else {
					// Priority 3: Global item (both NULL/empty)
					$applies = true;
				}
				
				if($applies) {
					$billsArray[] = array(
						'title' => $item_title,
						'description' => $item['description'],
						'amount' => $item['amount']
					);
				}
			}
			
			// Get admission fee
			$admission_fee = $this->boarding_model->getAdmissionFeeByResidentialStatus($residence_type);
			
			echo json_encode([
				'status' => 'success',
				'bills' => $billsArray,
				'admission_fee' => $admission_fee,
				'residence_type' => $residence_type
			]);
		} catch(Exception $e) {
			echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
		}
	}

	/*get all dorms by house id*/
    function getAllAvailableDormitoriesByHouseId($house_id) {
        $array = $this->boarding_model->getAllAvailableDormitoriesByHouseId($house_id);
        foreach($array as $dorm) {
        	echo '<option value="'.$dorm['dormitory_id'].'">'.$dorm['dormitory_name'].'</option>';
        }
    }

    /*get all beds by dorm id*/
    function getAllAvailableBedsByDormitoryId($dormitory_id) {
        $array = $this->boarding_model->getAllAvailableBedsByDormitoryId($dormitory_id);
        foreach($array as $bed) {
        	echo '<option value="'.$bed['bed_id'].'">'.$bed['bed_code'].'</option>';
        }
    }

	/*assign student to bed*/
	function assignStudentToBed($param='') {
		if($param !== 'assign') {
			echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
			return;
		}

		$student_id = (int)$this->input->post('student_id');
		$bed_id = (int)$this->input->post('bed_id');
		$bed = $this->db->get_where('boarding_bed', ['bed_id' => $bed_id])->row_array();
		if(!$student_id || !$bed) {
			echo json_encode(['status' => 'error', 'message' => 'Student or bed not found']);
			return;
		}
		$dorm = $this->db->get_where('boarding_dormitory', ['dormitory_id' => $bed['dormitory_id']])->row_array();
		if(!$dorm) {
			echo json_encode(['status' => 'error', 'message' => 'Dormitory not found']);
			return;
		}

		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$current = $this->db->get_where('enroll', ['student_id' => $student_id, 'year' => $running_year, 'term' => $running_term])->row_array();
		if(!$current) {
			echo json_encode(['status' => 'error', 'message' => 'Active enrollment not found']);
			return;
		}
		if($bed['bed_status'] !== 'Available' && (int)$current['bed_id'] !== $bed_id) {
			echo json_encode(['status' => 'error', 'message' => 'Bed is no longer available']);
			return;
		}

		$this->db->trans_start();
		if(!empty($current['bed_id']) && (int)$current['bed_id'] !== $bed_id) {
			$this->db->where('bed_id', $current['bed_id'])->update('boarding_bed', ['bed_status' => 'Available']);
		}
		$this->db->where('enroll_id', $current['enroll_id'])->update('enroll', [
			'house_id' => $dorm['house_id'],
			'dormitory_id' => $dorm['dormitory_id'],
			'bed_id' => $bed_id,
			'residence_type' => 'Boarding'
		]);
		$this->db->where('bed_id', $bed_id)->update('boarding_bed', ['bed_status' => 'Assigned']);
		$this->db->trans_complete();

		echo json_encode($this->db->trans_status()
			? ['status' => 'success', 'message' => 'Student assigned successfully']
			: ['status' => 'error', 'message' => 'Unable to assign student']);
	}

	function releaseBed($bed_id='') {
		$bed_id = (int)$bed_id;
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$this->db->trans_start();
		$enrollment = $this->db->get_where('enroll', ['bed_id' => $bed_id, 'year' => $running_year, 'term' => $running_term])->row_array();
		if($enrollment) {
			$this->db->where('enroll_id', $enrollment['enroll_id'])->update('enroll', [
				'house_id' => null,
				'dormitory_id' => null,
				'bed_id' => null,
				'residence_type' => 'Day'
			]);
		}
		$this->db->where('bed_id', $bed_id)->update('boarding_bed', ['bed_status' => 'Available']);
		$this->db->trans_complete();
		echo json_encode($this->db->trans_status()
			? ['status' => 'success', 'message' => 'Bed released successfully']
			: ['status' => 'error', 'message' => 'Unable to release bed']);
	}

	function getBoardingHouseDetails($house_id='') {
		$data = $this->db->get_where('boarding_house', ['house_id' => $house_id])->row_array();
		echo json_encode($data);
	}

	/*get dormitory details*/
	function getDormitoryDetails($dormitory_id='') {
		$data = $this->db->get_where('boarding_dormitory', ['dormitory_id' => $dormitory_id])->row_array();
		echo json_encode($data);
	}

	/*get bed details*/
	function getBedDetails($bed_id='') {
		$data = $this->db->get_where('boarding_bed', ['bed_id' => $bed_id])->row_array();
		echo json_encode($data);
	}

	/*boarding house reports*/
	function boardingHouseReports($param='') {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'));
		if($param !== '') {
			return $this->boarding_reports($param);
		}
		$page_data['page_name'] = '/boarding/boarding_reports';
		$page_data['page_title'] = get_phrase('boarding_house_reports');
		$this->load->view('backend/main', $page_data);
	}

	function boarding_reports($param='') {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'));

		if($param === '') {
			$page_data['page_name'] = '/boarding/boarding_reports';
			$page_data['page_title'] = get_phrase('boarding_reports');
			$this->load->view('backend/main', $page_data);
			return;
		}

		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$html = '<div class="boarding-report-result">';

		if($param === 'occupancy') {
			$rows = $this->db->query("SELECT h.house_name, COUNT(DISTINCT d.dormitory_id) dormitories, COUNT(b.bed_id) total_beds, SUM(CASE WHEN b.bed_status = 'Assigned' THEN 1 ELSE 0 END) assigned_beds FROM boarding_house h LEFT JOIN boarding_dormitory d ON d.house_id=h.house_id LEFT JOIN boarding_bed b ON b.dormitory_id=d.dormitory_id GROUP BY h.house_id,h.house_name ORDER BY h.house_name")->result_array();
			$html .= '<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>House</th><th>Dormitories</th><th>Total Beds</th><th>Assigned</th><th>Available</th><th>Occupancy</th></tr></thead><tbody>';
			foreach($rows as $row) {
				$total=(int)$row['total_beds']; $assigned=(int)$row['assigned_beds']; $available=max(0,$total-$assigned); $rate=$total ? round(($assigned/$total)*100,1) : 0;
				$html .= '<tr><td>'.html_escape($row['house_name']).'</td><td>'.(int)$row['dormitories'].'</td><td>'.$total.'</td><td>'.$assigned.'</td><td>'.$available.'</td><td>'.$rate.'%</td></tr>';
			}
			if(!$rows) $html .= '<tr><td colspan="6" class="text-center text-muted">No boarding houses have been created yet.</td></tr>';
			$html .= '</tbody></table></div>';
		} elseif($param === 'students') {
			$this->db->select('s.student_code,s.name,h.house_name,d.dormitory_name,b.bed_code');
			$this->db->from('enroll e')->join('student s','s.student_id=e.student_id')->join('boarding_house h','h.house_id=e.house_id','left')->join('boarding_dormitory d','d.dormitory_id=e.dormitory_id','left')->join('boarding_bed b','b.bed_id=e.bed_id','left');
			$this->db->where(['e.year'=>$running_year,'e.term'=>$running_term,'e.mute'=>'0','e.residence_type'=>'Boarding'])->order_by('s.name','ASC');
			$rows=$this->db->get()->result_array();
			$html .= '<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Student Code</th><th>Student</th><th>House</th><th>Dormitory</th><th>Bed</th></tr></thead><tbody>';
			foreach($rows as $row) $html .= '<tr><td>'.html_escape($row['student_code']).'</td><td>'.html_escape($row['name']).'</td><td>'.html_escape($row['house_name'] ?: '-').'</td><td>'.html_escape($row['dormitory_name'] ?: '-').'</td><td>'.html_escape($row['bed_code'] ?: '-').'</td></tr>';
			if(!$rows) $html .= '<tr><td colspan="5" class="text-center text-muted">No boarding students found for the current term.</td></tr>';
			$html .= '</tbody></table></div>';
		} elseif($param === 'available') {
			$this->db->select('b.bed_code,d.dormitory_name,h.house_name')->from('boarding_bed b')->join('boarding_dormitory d','d.dormitory_id=b.dormitory_id')->join('boarding_house h','h.house_id=d.house_id')->where('b.bed_status','Available')->order_by('h.house_name,d.dormitory_name,b.bed_code');
			$rows=$this->db->get()->result_array();
			$html .= '<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Bed Code</th><th>Dormitory</th><th>House</th><th>Status</th></tr></thead><tbody>';
			foreach($rows as $row) $html .= '<tr><td>'.html_escape($row['bed_code']).'</td><td>'.html_escape($row['dormitory_name']).'</td><td>'.html_escape($row['house_name']).'</td><td><span class="label label-success">Available</span></td></tr>';
			if(!$rows) $html .= '<tr><td colspan="4" class="text-center text-muted">No available beds found.</td></tr>';
			$html .= '</tbody></table></div>';
		} elseif($param === 'summary') {
			$houses=$this->db->count_all('boarding_house'); $dorms=$this->db->count_all('boarding_dormitory'); $beds=$this->db->count_all('boarding_bed');
			$assigned=$this->db->where('bed_status','Assigned')->count_all_results('boarding_bed');
			$available=$this->db->where('bed_status','Available')->count_all_results('boarding_bed');
			$boarders=$this->db->where(['year'=>$running_year,'term'=>$running_term,'mute'=>'0','residence_type'=>'Boarding'])->count_all_results('enroll');
			$html .= '<div class="boarding-summary-grid"><div><strong>'.$houses.'</strong><span>Houses</span></div><div><strong>'.$dorms.'</strong><span>Dormitories</span></div><div><strong>'.$beds.'</strong><span>Total Beds</span></div><div><strong>'.$assigned.'</strong><span>Assigned Beds</span></div><div><strong>'.$available.'</strong><span>Available Beds</span></div><div><strong>'.$boarders.'</strong><span>Boarding Students</span></div></div>';
		} else {
			show_404(); return;
		}

		$html .= '</div>';
		echo $html;
	}


	function assign_boarding($param='') {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'));

		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');

		if($param == 'single') {
			$student_id = (int)$this->input->post('student_id');
			$house_id = (int)$this->input->post('house_id');
			$dormitory_id = (int)$this->input->post('dormitory_id');
			$bed_id = (int)$this->input->post('bed_id');

			$dorm = $this->db->get_where('boarding_dormitory', ['dormitory_id'=>$dormitory_id,'house_id'=>$house_id])->row_array();
			$bed = $this->db->get_where('boarding_bed', ['bed_id'=>$bed_id,'dormitory_id'=>$dormitory_id])->row_array();
			$enrollment = $this->db->get_where('enroll', ['student_id'=>$student_id,'year'=>$running_year,'term'=>$running_term])->row_array();
			if(!$dorm || !$bed || !$enrollment) {
				$this->session->set_flashdata('error_message', 'Invalid boarding assignment selection');
				redirect(site_url('admin/assign_boarding')); return;
			}
			if($bed['bed_status'] !== 'Available' && (int)$enrollment['bed_id'] !== $bed_id) {
				$this->session->set_flashdata('error_message', 'The selected bed is no longer available');
				redirect(site_url('admin/assign_boarding')); return;
			}

			$this->db->trans_start();
			if(!empty($enrollment['bed_id']) && (int)$enrollment['bed_id'] !== $bed_id) {
				$this->db->where('bed_id',$enrollment['bed_id'])->update('boarding_bed',['bed_status'=>'Available']);
			}
			$this->db->where('enroll_id',$enrollment['enroll_id'])->update('enroll',['house_id'=>$house_id,'dormitory_id'=>$dormitory_id,'bed_id'=>$bed_id,'residence_type'=>'Boarding']);
			$this->db->where('bed_id',$bed_id)->update('boarding_bed',['bed_status'=>'Assigned']);
			$this->db->trans_complete();

			$this->session->set_flashdata($this->db->trans_status() ? 'flash_message' : 'error_message', $this->db->trans_status() ? get_phrase('boarding_assigned_successfully') : 'Boarding assignment failed');
			redirect(site_url('admin/assign_boarding')); return;
		}

		if($param == 'bulk') {
			$student_ids = array_values(array_filter(array_map('intval',(array)$this->input->post('student_ids'))));
			$house_id = (int)$this->input->post('house_id');
			$dormitory_id = (int)$this->input->post('dormitory_id');
			$dorm = $this->db->get_where('boarding_dormitory',['dormitory_id'=>$dormitory_id,'house_id'=>$house_id])->row_array();
			if(!$student_ids || !$dorm) {
				$this->session->set_flashdata('error_message','Select students and a valid dormitory');
				redirect(site_url('admin/assign_boarding')); return;
			}

			$available_beds=$this->db->where(['dormitory_id'=>$dormitory_id,'bed_status'=>'Available'])->order_by('bed_code','ASC')->get('boarding_bed')->result_array();
			$assigned_count=0;
			$this->db->trans_start();
			foreach($student_ids as $student_id) {
				if(!isset($available_beds[$assigned_count])) break;
				$enrollment=$this->db->get_where('enroll',['student_id'=>$student_id,'year'=>$running_year,'term'=>$running_term])->row_array();
				if(!$enrollment) continue;
				$new_bed_id=(int)$available_beds[$assigned_count]['bed_id'];
				if(!empty($enrollment['bed_id']) && (int)$enrollment['bed_id'] !== $new_bed_id) $this->db->where('bed_id',$enrollment['bed_id'])->update('boarding_bed',['bed_status'=>'Available']);
				$this->db->where('enroll_id',$enrollment['enroll_id'])->update('enroll',['house_id'=>$house_id,'dormitory_id'=>$dormitory_id,'bed_id'=>$new_bed_id,'residence_type'=>'Boarding']);
				$this->db->where('bed_id',$new_bed_id)->update('boarding_bed',['bed_status'=>'Assigned']);
				$assigned_count++;
			}
			$this->db->trans_complete();

			if(!$this->db->trans_status()) $this->session->set_flashdata('error_message','Bulk boarding assignment failed');
			elseif($assigned_count < count($student_ids)) $this->session->set_flashdata('error_message',$assigned_count.' student(s) assigned; remaining students could not be assigned because there are not enough available beds.');
			else $this->session->set_flashdata('flash_message',get_phrase('bulk_boarding_assigned_successfully'));
			redirect(site_url('admin/assign_boarding')); return;
		}

		$page_data['page_name'] = '/boarding/student_assignment';
		$page_data['page_title'] = get_phrase('assign_boarding');
		$this->load->view('backend/main', $page_data);
	}

	function get_dormitories_by_house() {
		$house_id = (int)$this->input->post('house_id');
		$dormitories = $this->db->where(['house_id'=>$house_id,'dormitory_status'=>'Available'])->order_by('dormitory_name','ASC')->get('boarding_dormitory')->result_array();
		echo '<option value="">'.get_phrase('select').'</option>';
		foreach($dormitories as $dorm) echo '<option value="'.$dorm['dormitory_id'].'">'.html_escape($dorm['dormitory_name']).'</option>';
	}

	function get_beds_by_dormitory() {
		$dormitory_id = (int)$this->input->post('dormitory_id');
		$beds = $this->db->where(['dormitory_id'=>$dormitory_id,'bed_status'=>'Available'])->order_by('bed_code','ASC')->get('boarding_bed')->result_array();
		echo '<option value="">'.get_phrase('select').'</option>';
		foreach($beds as $bed) echo '<option value="'.$bed['bed_id'].'">'.html_escape($bed['bed_code']).'</option>';
	}

	function get_students_by_class() {
		$class_id = (int)$this->input->post('class_id');
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$enrolls = $this->db->get_where('enroll',['class_id'=>$class_id,'year'=>$running_year,'term'=>$running_term,'mute'=>'0'])->result_array();
		echo '<option value="">'.get_phrase('select').'</option>';
		foreach($enrolls as $enroll) {
			$student=$this->db->get_where('student',['student_id'=>$enroll['student_id']])->row();
			if($student) echo '<option value="'.$student->student_id.'">'.html_escape($student->name).' ('.html_escape($student->student_code).')</option>';
		}
	}


	function get_exams_by_class() {
		$class_id = $this->input->post('class_id');
		
		// Get all exams with marks for this class, ordered by date descending
		$this->db->select('exam.exam_id, exam.name, exam.year, exam.term, exam.date');
		$this->db->from('exam');
		$this->db->join('mark', 'mark.exam_id = exam.exam_id', 'inner');
		$this->db->where('mark.class_id', $class_id);
		$this->db->group_by('exam.exam_id');
		$this->db->order_by('exam.year', 'DESC');
		$this->db->order_by('exam.term', 'DESC');
		$this->db->order_by('exam.date', 'DESC');
		$exams = $this->db->get()->result_array();
		
		echo '<option value="">'.get_phrase('select_exam').'</option>';
		foreach($exams as $exam) {
			$exam_label = $exam['name'] . ' - ' . $exam['year'] . ' Term ' . $exam['term'];
			echo '<option value="'.$exam['exam_id'].'">'.$exam_label.'</option>';
		}
	}

	function get_class_name_ajax() {
		$class_id = $this->input->post('class_id');
		if($class_id) {
			$class_name = $this->crud_model->get_class_name($class_id);
			echo $class_name;
		} else {
			echo '';
		}
	}

	function generate_bulk_marksheet($class_id = '', $exam_id = '') {
		if(empty($class_id) || empty($exam_id)) {
			show_error('Class ID and Exam ID are required');
			return;
		}
		
		// Get exam details to determine year/term
		$exam_record = $this->db->get_where('exam', array('exam_id' => $exam_id))->row();
		$year = $exam_record->year;
		$term = isset($exam_record->term) ? $exam_record->term : null;
		$sem = isset($exam_record->sem) ? $exam_record->sem : null;
		
		// Get all students in this class for this year/term
		if($sem) {
			$enrolls = $this->db->get_where('enroll', array(
				'class_id' => $class_id,
				'year' => $year,
				'sem' => $sem,
				'mute' => '0'
			))->result_array();
		} else {
			$enrolls = $this->db->get_where('enroll', array(
				'class_id' => $class_id,
				'year' => $year,
				'term' => $term,
				'mute' => '0'
			))->result_array();
		}
		
		// Get class name to determine report style
		$class_name = $this->crud_model->get_class_name($class_id);
		$raw_score = $this->db->get_where('settings', array('type' => 'raw_score'))->row()->description;
		$terminal_report_style = $this->db->get_where('settings', array('type' => 'terminal_report_style'))->row()->description;
		
		// Determine which bulk print view to use
		if ($class_name == 'CRECHE') {
			$page_name = 'student_marksheet_bulk_print_view_creche';
		} elseif ($raw_score == 'Yes') {
			if ($class_name == 'JHSS') {
				$page_name = 'student_raw_score_marksheet_bulk_print_view';
			} else {
				$page_name = ($terminal_report_style == 'style_2') ? 'student_marksheet_bulk_print_view_2' : 'student_marksheet_bulk_print_view';
			}
		} else {
			$page_name = ($terminal_report_style == 'style_2') ? 'student_marksheet_bulk_print_view_2' : 'student_marksheet_bulk_print_view';
		}
		
		// Prepare page data
		$page_data['enrolls'] = $enrolls;
		$page_data['class_id'] = $class_id;
		$page_data['exam_id'] = $exam_id;
		$page_data['year'] = $year;
		$page_data['term'] = $term;
		$page_data['sem'] = $sem;
		$page_data['page_name'] = $page_name;
		
		// Also need section_id for the bulk print views
		// Get first section for this class (most schools have one section per class)
		$section_row = $this->db->get_where('section', array('class_id' => $class_id))->row();
		$page_data['section_id'] = $section_row ? $section_row->section_id : 0;
		
		// Load the bulk print view
		$this->load->view('backend/admin/'.$page_name, $page_data);
	}

	function load_marksheet_content() {
		$student_id = $this->input->post('student_id');
		$exam_id = $this->input->post('exam_id');
		$class_id = $this->input->post('class_id');
		
		// Pass exam_id to student_marksheet so it can fetch the correct year/term
		$this->student_marksheet($student_id, 'yes');
	}

	/*REQUEST APPROVAL*/
	function manageRequestApproval($param='', $request_id='', $status='') {
		// Only super admins can access approval page
		$user_level = $this->session->userdata('user_type');
		if($user_level != 1 && $param == '') {
			$this->session->set_flashdata('error_message', 'Access denied. Only super administrators can manage approvals.');
			redirect(site_url('admin/dashboard'));
			return;
		}

		if($param == 'manage') {
			// Verify super admin
			if($user_level != 1) {
				echo json_encode(['status' => 'error', 'message' => 'Access denied']);
				return;
			}

			$result = $this->crud_model->updateSingleInvoiceRequest($request_id, $status);

			if($result) {
				// Get request details
				$request = $this->db->where('request_id', $request_id)->get('invoice_requests')->row();
				
				if($request) {
					// Notify requester
					$requester = $this->db->where('admin_id', $request->request_issuer_id)->get('admin')->row();
					$approver_name = $this->session->userdata('name');
					$school_name = $this->db->get_where('settings', array('type' => 'system_name'))->row()->description;
					
					// In-app notification
					$this->db->insert('notifications', [
						'user_id' => $request->request_issuer_id,
						'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
						'title' => 'Request ' . $status,
						'message' => 'Your ' . $request->request_type . ' request has been ' . strtolower($status) . ' by ' . $approver_name,
						'type' => 'request_' . strtolower($status),
						'created_at' => date('Y-m-d H:i:s')
					]);
					
					// SMS notification
					$active_sms = $this->db->get_where('settings', array('type' => 'active_sms_service'))->row();
					if($active_sms && $active_sms->description != 'disabled' && !empty($requester->phone)) {
						$sms_message = "[$school_name] Your {$request->request_type} request has been {$status} by {$approver_name}.";
						$this->sms_model->send_sms($sms_message, [$requester->phone]);
					}
					
					// Email notification
					if(!empty($requester->email)) {
						$status_color = $status == 'Approved' ? '#10b981' : '#ef4444';
						$subject = 'Request ' . $status;
						$message = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
							<div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;'>
								<h2 style='color: white; margin: 0;'>Request {$status}</h2>
							</div>
							<div style='padding: 30px; background: #f9fafb;'>
								<p style='font-size: 16px; color: #374151;'>Dear {$requester->name},</p>
								<p style='font-size: 16px; color: #374151;'>Your <strong>{$request->request_type}</strong> request has been <span style='color: {$status_color}; font-weight: bold;'>{$status}</span> by {$approver_name}.</p>
								<div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'>
									<p style='margin: 5px 0; color: #6b7280;'><strong>Request ID:</strong> {$request->request_id}</p>
									<p style='margin: 5px 0; color: #6b7280;'><strong>Description:</strong> {$request->request_description}</p>
									<p style='margin: 5px 0; color: #6b7280;'><strong>Date:</strong> " . date('F j, Y g:i A', strtotime($request->request_created_timestamp)) . "</p>
								</div>
								<p style='font-size: 14px; color: #6b7280; margin-top: 30px;'>Best regards,<br>{$school_name}</p>
							</div>
						</div>";
						$this->email_model->do_email($message, $subject, $requester->email, $school_name);
					}
				}

				$ajaxData['status'] = 'success';
				$ajaxData['message'] = 'Request ' . $status . ' successfully';
			} else {
				$ajaxData['status'] = 'error';
				$ajaxData['message'] = 'Error occurred! Please try again later.';
			}

			echo json_encode($ajaxData);
			return;
		}

		// Quick approve/decline from email/SMS link
		if($param == 'quick_action' && !empty($request_id) && !empty($status)) {
			// Verify token for security
			$token = $this->input->get('token');
			$request = $this->db->where('request_id', $request_id)->get('invoice_requests')->row();
			
			if(!$request) {
				$this->session->set_flashdata('error_message', 'Request not found');
				redirect(site_url('admin/manageRequestApproval'));
				return;
			}
			
			// Verify token
			$expected_token = md5($request->request_id . $request->request_created_timestamp . 'approval_secret');
			if($token !== $expected_token) {
				$this->session->set_flashdata('error_message', 'Invalid approval link');
				redirect(site_url('admin/manageRequestApproval'));
				return;
			}
			
			// Process approval
			$result = $this->crud_model->updateSingleInvoiceRequest($request_id, $status);
			
			if($result) {
				// Send notifications (same as above)
				$requester = $this->db->where('admin_id', $request->request_issuer_id)->get('admin')->row();
				$approver_name = $this->session->userdata('name');
				$school_name = $this->db->get_where('settings', array('type' => 'system_name'))->row()->description;
				
				$this->db->insert('notifications', [
					'user_id' => $request->request_issuer_id,
					'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
					'title' => 'Request ' . $status,
					'message' => 'Your ' . $request->request_type . ' request has been ' . strtolower($status) . ' by ' . $approver_name,
					'type' => 'request_' . strtolower($status),
					'created_at' => date('Y-m-d H:i:s')
				]);
				
				$this->session->set_flashdata('flash_message', 'Request ' . $status . ' successfully');
			} else {
				$this->session->set_flashdata('error_message', 'Error processing request');
			}
			
			redirect(site_url('admin/manageRequestApproval'));
			return;
		}

		/*general routing to the page*/
		// Fetch receipt modification requests
		$page_data['requests'] = $this->db->order_by('request_id', 'DESC')->get('receipt_modification_requests')->result_array();
		
		// Fetch invoice modification requests
		$page_data['invoice_requests'] = $this->db->order_by('request_id', 'DESC')->get('invoice_modification_requests')->result_array();
		
		$page_data['page_name'] = 'receipt_invoice_modification_requests';
		$page_data['page_title'] = get_phrase('invoice_&_receipt_approvals');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Alias for navigation
	function modification_requests($param='', $request_id='', $status='') {
		return $this->manageRequestApproval($param, $request_id, $status);
	}

	/*function resetReceiptCode() {
		$json_data['result'] = $this->crud_model->resetReceiptCodes();

		echo json_encode($json_data);
	}*/

	function updateEnroll() {

		$result = $this->crud_model->updateEnrollment();

		echo $result;
	}

	/*delete duplicated bill items from the invoice table*/
	function deleteDuplicateBillItemFromInvoiceTable() {
		$class_ids =  array(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26);
		$bill_item = 'EXAMINATION FEES';
		$year = '2025-2026';
		$term = 1;


		echo $this->crud_model->deleteDuplicateBillItemFromInvoiceTable($class_ids, $bill_item, $year, $term);
	}

	function payroll($param1 = '', $payroll_id = '') {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		if($param1 == 'create') {

			$result = $this->payroll_model->store($payroll_id);

			// Handle different return types from payroll model
			if (is_array($result)) {
				// Validation errors or detailed error response
				header('Content-Type: application/json');
				echo json_encode($result);
			} else if ($result === true) {
				// Simple success
				header('Content-Type: application/json');
				echo json_encode(['success' => true, 'message' => 'Payroll processed successfully']);
			} else {
				// String error message or false
				header('Content-Type: application/json');
				echo json_encode(['success' => false, 'message' => is_string($result) ? $result : 'Failed to process payroll']);
			}
			
			return;

		}

		// Load dynamic statutory rates
		$this->load->model('Payroll_statutory_model');
		$page_data['statutory_rates'] = $this->Payroll_statutory_model->get_all_settings();
		$page_data['statutory_rates_json'] = $this->Payroll_statutory_model->get_rates_json();

		$page_data['page_name'] = 'payroll_system';
		$page_data['page_title'] = get_phrase('Employee_Monthly_payroll_system');

		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/admin/payroll_system', $page_data);
		

	}

	/**
	 * Wave 8 - Task 11.1: Payroll Approvals Page
	 * 
	 * Displays the payroll approval workflow interface
	 * Shows pending, approved, and rejected payrolls with filtering
	 */
	function payroll_approvals() {
		// Check if user is logged in
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
			return;
		}

		// Load models
		$this->load->model('Payroll_approval_model', 'payroll_approval');

		// Get user information for permission checks
		$page_data['user_id'] = $this->session->userdata('admin_id');
		$page_data['user_level'] = $this->session->userdata('user_type');
		$page_data['user_role'] = $this->session->userdata('role');
		
		// Check permissions
		// HR (level 1 or has HR role): can create and submit
		// Manager/Principal (level 2): can approve/reject
		// Finance (level 3 or has Finance role): can mark as paid
		$page_data['can_submit'] = ($page_data['user_level'] == 1 || strpos(strtolower($page_data['user_role']), 'hr') !== false);
		$page_data['can_approve'] = ($page_data['user_level'] == 2 || strpos(strtolower($page_data['user_role']), 'manager') !== false || strpos(strtolower($page_data['user_role']), 'principal') !== false);
		$page_data['can_mark_paid'] = ($page_data['user_level'] == 3 || strpos(strtolower($page_data['user_role']), 'finance') !== false);

		// Page metadata
		$page_data['page_name'] = 'payroll_approvals';
		$page_data['page_title'] = get_phrase('payroll_approvals');
		$page_data['account_type'] = $this->session->userdata('login_type');
		
		// Load the view directly (not through backend/main)
		$this->load->view('backend/admin/payroll_approvals', $page_data);
	}

	// payroll reports
	function ssnit_tier1_report() {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$this->load->model('payroll_statutory_model');
		$page_data['statutory_rates'] = $this->payroll_statutory_model->get_all_settings();
		$page_data['page_title'] = 'SSNIT REPORT - TIER 1';
		$this->load->view('backend/admin/payroll_report_ssnit_tier1', $page_data);
		

	}

	function ssnit_tier2_report() {
		//if ($this->session->userdata('admin_login') != 1)
		//redirect(site_url('login'));

		$this->load->model('payroll_statutory_model');
		$page_data['statutory_rates'] = $this->payroll_statutory_model->get_all_settings();
		$page_data['page_title'] = 'SSNIT REPORT - TIER 2';
		$this->load->view('backend/admin/payroll_report_ssnit_tier2', $page_data);
		

	}

	function getStaffDetails() {

		$pageData['ids'] = $this->input->post('staffData');
		
		// Load dynamic statutory rates
		$this->load->model('Payroll_statutory_model');
		$pageData['statutory_rates'] = $this->Payroll_statutory_model->get_all_settings();
		$pageData['statutory_rates_json'] = $this->Payroll_statutory_model->get_rates_json();
		
		$this->load->view('backend/admin/getStaffDetailsForPayroll', $pageData);

	}

	function getPayrollFormByStaffCode() {

		$staff_code = $this->input->post('staffCode');

		$stringPos = strpos($staff_code, '_');
    	$staffCode = substr($staff_code, $stringPos + 1);

		$payrollMonthYear = $this->input->post('payrollMonthYear');
		$payrollMonthYearArray = explode('-', $payrollMonthYear);

		$payrollYear = $payrollMonthYearArray[0];
		$payrollMonth = getMonthInWords($payrollMonthYearArray[1]);



		if(!empty($staffCode) || $staffCode != '') {

			$staffData = $this->payroll_model->getPayrollFormByStaffCode($staffCode, $payrollMonth, $payrollYear);
			$pageData['staffPayrollData'] = $staffData;
			$pageData['payrollMonthYear'] = $payrollMonthYear;

		} else {
			echo 'Not found';
			return;
		}
		
		// Query field preferences (system-wide, not user-specific)
		$field_preferences = $this->db->get('form_field_preferences')->result_array();
		
		// Build array of hidden field names
		$hidden_fields = [];
		foreach ($field_preferences as $pref) {
			if ($pref['is_visible'] == 0) {
				$hidden_fields[] = $pref['field_name'];
			}
		}
		$pageData['hidden_fields'] = $hidden_fields;
		
		// ============================================
		// Load dynamic statutory rates
		// ============================================
		$this->load->model('Payroll_statutory_model');
		$pageData['statutory_rates'] = $this->Payroll_statutory_model->get_all_settings();
		$pageData['statutory_rates_json'] = $this->Payroll_statutory_model->get_rates_json();
		
		// Load Tier 2 provider (get first active provider)
		$pageData['tier2_provider'] = null;
		if ($this->db->table_exists('pension_tier2_providers')) {
			$pageData['tier2_provider'] = $this->db->get_where('pension_tier2_providers', ['is_active' => 1])->row();
		}
		// ============================================

		if(count($staffData) > 0) {

			$this->load->view('backend/admin/getPayrollForm', $pageData);

		} else {

			$this->load->view('backend/admin/getPayrollFormWithoutData', $pageData);
		}
	}

	function payslip_preview($staffCode, $month, $year, $employment_category) {
		// Load required models
		$this->load->model('payroll_statutory_model');
		
		// Get payroll data
		$staffData = $this->payroll_model->getPayrollFormByStaffCode($staffCode, $month, $year);
		
		// Debug log
		log_message('debug', 'Payslip Preview - Staff Code: ' . $staffCode . ', Month: ' . $month . ', Year: ' . $year);
		log_message('debug', 'Payslip Preview - Staff Data Count: ' . count($staffData));
		
		// Validate that payroll data exists (check count, not empty)
		if (count($staffData) === 0) {
			// Redirect back with error message
			$this->session->set_flashdata('error_message', 'Payroll record not found for the specified staff and period.');
			redirect(site_url('admin/payroll'));
			return;
		}
		
		// Prepare page data
		$pageData['staffPayrollData'] = $staffData;
		$pageData['staffCode'] = $staffCode;
		$pageData['payMonth'] = $month;
		$pageData['payYear'] = $year;
		$pageData['employmentCategory'] = $employment_category;
		$pageData['statutory_rates'] = $this->payroll_statutory_model->get_all_settings();

		$this->load->view('backend/admin/payslip_preview', $pageData);
	}

	function staffDetails($staffCode, $table) {

		$staffPayrollData = $this->payroll_model->getStaffPayroll($staffCode);
			;
		$staffInfoData = $this->crud_model->getStaffInfo($table, $staffCode);
			;
		$pageData['staffPayrollData'] = $staffPayrollData;
		$pageData['staffInfoData'] = $staffInfoData;
		
		// Route to appropriate view based on staff type and set correct page_name for navigation
		if ($table === 'admin') {
			$pageData['page_name'] = 'admin_list';  // Matches navigation menu for Administrators
			$pageData['page_title'] = 'Admin Profile';
		} elseif ($table === 'teacher') {
			$pageData['page_name'] = 'teacher';  // Matches navigation menu for Teachers
			$pageData['page_title'] = 'Teacher Profile';
		} elseif ($table === 'non_teaching_staff') {
			$pageData['page_name'] = 'non_teaching_staff';  // Matches navigation menu for Non-Teaching Staff
			$pageData['page_title'] = 'Staff Profile';
		} else {
			// Fallback to teacher view
			$pageData['page_name'] = 'teacher';
			$pageData['page_title'] = 'Staff Profile';
		}

		$this->load->view('backend/main', $pageData);

	}

	// New ID-based routing methods
	function admin_details($admin_id) {
		// Validate admin_id parameter
		if (empty($admin_id) || !is_numeric($admin_id)) {
			$this->session->set_flashdata('error_message', get_phrase('invalid_admin_id'));
			redirect(site_url('admin/admins'));
			return;
		}

		$staffInfoData = $this->crud_model->getStaffInfoById('admin', $admin_id);
		
		// Check if admin exists
		if (empty($staffInfoData)) {
			$this->session->set_flashdata('error_message', get_phrase('admin_not_found'));
			redirect(site_url('admin/admins'));
			return;
		}
		
		// Get payroll data using admin_code
		$staffPayrollData = $this->payroll_model->getStaffPayroll($staffInfoData->admin_code);
		
		$pageData['staffPayrollData'] = $staffPayrollData;
		$pageData['staffInfoData'] = $staffInfoData;
		$pageData['page_name'] = 'admin_details';
		$pageData['page_title'] = 'Admin Profile';
		
		$this->load->view('backend/main', $pageData);
	}

	function teacher_details($teacher_id) {
		// Validate teacher_id parameter
		if (empty($teacher_id) || !is_numeric($teacher_id)) {
			$this->session->set_flashdata('error_message', get_phrase('invalid_teacher_id'));
			redirect(site_url('admin/teacher'));
			return;
		}

		$staffInfoData = $this->crud_model->getStaffInfoById('teacher', $teacher_id);
		
		// Check if teacher exists
		if (empty($staffInfoData)) {
			$this->session->set_flashdata('error_message', get_phrase('teacher_not_found'));
			redirect(site_url('admin/teacher'));
			return;
		}
		
		// Get payroll data using teacher_code
		$staffPayrollData = $this->payroll_model->getStaffPayroll($staffInfoData->teacher_code);
		
		$pageData['staffPayrollData'] = $staffPayrollData;
		$pageData['staffInfoData'] = $staffInfoData;
		$pageData['page_name'] = 'teacher_details';
		$pageData['page_title'] = 'Teacher Profile';
		
		$this->load->view('backend/main', $pageData);
	}

	function non_teaching_staff_details($staff_id) {
		// Validate staff_id parameter
		if (empty($staff_id) || !is_numeric($staff_id)) {
			$this->session->set_flashdata('error_message', get_phrase('invalid_staff_id'));
			redirect(site_url('admin/non_teaching_staff'));
			return;
		}

		$staffInfoData = $this->crud_model->getStaffInfoById('non_teaching_staff', $staff_id);
		
		// Check if staff exists
		if (empty($staffInfoData)) {
			$this->session->set_flashdata('error_message', get_phrase('staff_not_found'));
			redirect(site_url('admin/non_teaching_staff'));
			return;
		}
		
		// Get payroll data using staff_code
		$staffPayrollData = $this->payroll_model->getStaffPayroll($staffInfoData->staff_code);
		
		$pageData['staffPayrollData'] = $staffPayrollData;
		$pageData['staffInfoData'] = $staffInfoData;
		$pageData['page_name'] = 'non_teaching_staff_details';
		$pageData['page_title'] = 'Staff Profile';
		
		$this->load->view('backend/main', $pageData);
	}

	function payslipList($staffCode = '') {

		if(!empty($staffCode) || $staffCode != '') {
			/*specific*/
			$pageData['payrollData'] = $this->payroll_model->getStaffPayroll($teacher_code);

		} else {
			/*all*/
			$pageData['payrollData'] = $this->payroll_model->getAllPayroll();
		}
		
		$pageData['page_name'] = 'payslip_list';
		$pageData['page_title'] = 'Staffs Payslip List';
		$this->load->view('backend/main', $pageData);

	}

	// Payroll Edit Form - AJAX
	function payroll_edit_form($pay_id) {
		$data['pay_id'] = $pay_id;
		
		// Load statutory rates
		$this->load->model('payroll_statutory_model');
		$data['statutory_rates'] = $this->payroll_statutory_model->get_all_settings();
		$data['statutory_rates_json'] = $this->payroll_statutory_model->get_rates_json();
		
		$this->load->view('backend/admin/payroll_edit_form', $data);
	}

	// Payroll Update - AJAX
	function payroll_update_ajax() {
		$pay_id = $this->input->post('pay_id');
		
		// Get current payroll data for cache invalidation
		$payroll = $this->db->get_where('pay_salary', ['pay_id' => $pay_id])->row();
		
		$data['basic_salary'] = $this->input->post('basic_salary');
		$data['market_premium_allowance'] = $this->input->post('market_premium_allowance') ?: 0;
		$data['teaching_allowance'] = $this->input->post('teaching_allowance') ?: 0;
		$data['responsibility_allowance'] = $this->input->post('responsibility_allowance') ?: 0;
		$data['extra_class_allowance'] = $this->input->post('extra_class_allowance') ?: 0;
		$data['rural_allowance'] = $this->input->post('rural_allowance') ?: 0;
		$data['other_allowances'] = $this->input->post('other_allowances') ?: 0;
		$data['ssnit'] = $this->input->post('ssnit') ?: 0;
		$data['income_tax'] = $this->input->post('income_tax') ?: 0;
		$data['tier2_contribution'] = $this->input->post('petra') ?: 0;  // Input field named 'petra' for backward compatibility
		$data['get_fund'] = $this->input->post('get_fund') ?: 0;
		$data['nhil'] = $this->input->post('nhil') ?: 0;
		$data['salary_advance'] = $this->input->post('salary_advance') ?: 0;
		$data['loan'] = $this->input->post('loan') ?: 0;
		$data['welfare_dues'] = $this->input->post('welfare_dues') ?: 0;
		$data['gnat_dues'] = $this->input->post('gnat_dues') ?: 0;
		$data['other_deductions'] = $this->input->post('other_deductions') ?: 0;
		$data['working_days'] = $this->input->post('working_days') ?: 22;
		$data['days_present'] = $this->input->post('days_present') ?: 22;
		$data['days_absent'] = $this->input->post('days_absent') ?: 0;
		$data['total_allowances'] = $this->input->post('total_allowances') ?: 0;
		$data['total_deductions'] = $this->input->post('total_deductions') ?: 0;
		$data['gross_salary'] = $this->input->post('gross_salary') ?: 0;
		$data['net_salary'] = $this->input->post('net_salary') ?: 0;
		
		$this->db->where('pay_id', $pay_id);
		$result = $this->db->update('pay_salary', $data);
		
		if($result) {
			// Task 17.2: Invalidate dashboard cache after payroll update
			if ($payroll) {
				$this->load->driver('cache', array('adapter' => 'file'));
				$cache_key = "payroll_dashboard_" . $payroll->month . "_" . $payroll->year;
				$this->cache->delete($cache_key);
			}
			
			echo json_encode([
				'status' => 'success',
				'message' => get_phrase('payroll_updated_successfully')
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('failed_to_update_payroll')
			]);
		}
	}

	// Payroll Delete - AJAX
	function payroll_delete($pay_id) {
		// Get current payroll data for cache invalidation
		$payroll = $this->db->get_where('pay_salary', ['pay_id' => $pay_id])->row();
		
		$this->db->where('pay_id', $pay_id);
		$result = $this->db->delete('pay_salary');
		
		if($result) {
			// Task 17.2: Invalidate dashboard cache after payroll delete
			if ($payroll) {
				$this->load->driver('cache', array('adapter' => 'file'));
				// Convert month name to month number for cache key
				$month_number = $this->get_month_number_from_name($payroll->month);
				$cache_key = "payroll_dashboard_{$month_number}_{$payroll->year}";
				$this->cache->delete($cache_key);
			}
			
			echo json_encode([
				'status' => 'success',
				'message' => get_phrase('payroll_deleted_successfully')
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('failed_to_delete_payroll')
			]);
		}
	}

	/**
	 * PAYROLL SYSTEM ENHANCEMENTS - AJAX ENDPOINTS (Tasks 8.1-8.5)
	 */
	
	/**
	 * Task 8.1: Validate payroll data via AJAX
	 * 
	 * Endpoint: POST /admin/payroll/validate
	 * 
	 * Performs server-side validation of payroll form data before submission
	 * Returns detailed validation errors or success status
	 */
	public function payroll_validate() {
		// Verify AJAX request and CSRF token
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Load Payroll_validator library
		$this->load->library('Payroll_validator');
		
		// Collect all payroll data from POST
		$payroll_data = [
			'employee_code' => $this->input->post('employee_code'),
			'year' => $this->input->post('year'),
			'month' => $this->input->post('month'),
			'basic_salary' => $this->input->post('basic_salary'),
			'market_premium_allowance' => $this->input->post('market_premium_allowance'),
			'teaching_allowance' => $this->input->post('teaching_allowance'),
			'responsibility_allowance' => $this->input->post('responsibility_allowance'),
			'extra_class_allowance' => $this->input->post('extra_class_allowance'),
			'rural_allowance' => $this->input->post('rural_allowance'),
			'other_allowances' => $this->input->post('other_allowances'),
			'ssnit' => $this->input->post('ssnit'),
			'income_tax' => $this->input->post('income_tax'),
			'tier2_contribution' => $this->input->post('petra'),  // Input field named 'petra' for backward compatibility
			'get_fund' => $this->input->post('get_fund'),
			'salary_advance' => $this->input->post('salary_advance'),
			'nhil' => $this->input->post('nhil'),
			'loan' => $this->input->post('loan'),
			'welfare_dues' => $this->input->post('welfare_dues'),
			'gnat_dues' => $this->input->post('gnat_dues'),
			'other_deductions' => $this->input->post('other_deductions'),
			'working_days' => $this->input->post('working_days'),
			'days_present' => $this->input->post('days_present'),
			'days_absent' => $this->input->post('days_absent'),
			'total_allowances' => $this->input->post('total_allowances'),
			'total_deductions' => $this->input->post('total_deductions'),
			'gross_salary' => $this->input->post('gross_salary'),
			'net_salary' => $this->input->post('net_salary'),
			'employment_category' => $this->input->post('employment_category')
		];
		
		// Run validation
		$validation_errors = $this->payroll_validator->validate_payroll_data($payroll_data);
		
		// Return JSON response
		if (empty($validation_errors)) {
			echo json_encode([
				'status' => 'success',
				'message' => 'Validation passed',
				'valid' => true
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Validation failed',
				'valid' => false,
				'errors' => $validation_errors
			]);
		}
	}
	
	/**
	 * Task 8.2: Calculate PAYE via AJAX
	 * 
	 * Endpoint: POST /admin/payroll/calculate_paye
	 * 
	 * Calculates Ghana PAYE based on monthly gross salary and SSNIT deductions
	 * Returns monthly PAYE amount and detailed tax bracket breakdown
	 */
	public function payroll_calculate_paye() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Clear tax calculator cache to ensure latest brackets are used
		$this->load->library('Tax_calculator');
		$this->tax_calculator->clear_cache();
		
		// Get input parameters
		$monthly_gross = floatval($this->input->post('monthly_gross'));
		$monthly_ssnit = floatval($this->input->post('monthly_ssnit'));
		
		// DEBUG: Log what brackets are being loaded
		$brackets = $this->tax_calculator->load_active_tax_brackets();
		log_message('debug', 'PAYE Calculation - Active brackets count: ' . count($brackets));
		log_message('debug', 'PAYE Calculation - First bracket: ' . json_encode($brackets[0]));
		log_message('debug', 'PAYE Calculation - Gross: ' . $monthly_gross . ', SSNIT: ' . $monthly_ssnit);
		
		// Validate inputs
		if ($monthly_gross <= 0) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Invalid gross salary amount'
			]);
			return;
		}
		
		if ($monthly_ssnit < 0) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Invalid SSNIT deduction amount'
			]);
			return;
		}
		
		// Load Payroll_model and calculate PAYE
		$result = $this->payroll_model->calculate_paye_for_payroll($monthly_gross, $monthly_ssnit);
		
		// DEBUG: Log result
		log_message('debug', 'PAYE Calculation Result: ' . json_encode($result));
		
		// Return JSON response
		if ($result['success']) {
			echo json_encode([
				'status' => 'success',
				'monthly_paye' => $result['monthly_paye'],
				'monthly_paye_formatted' => number_format($result['monthly_paye'], 2),
				'breakdown' => $result['breakdown'],
				'message' => 'PAYE calculated successfully',
				'debug_first_bracket' => $brackets[0]['max_income'] // Add for debugging
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => $result['message']
			]);
		}
	}
	
	/**
	 * Task 8.3: Submit payroll for approval
	 * 
	 * Endpoint: POST /admin/payroll/submit_for_approval/{pay_id}
	 * 
	 * Submits a payroll record for approval workflow
	 * Transitions status from 'draft' to 'pending_approval'
	 */
	public function payroll_submit_for_approval($pay_id) {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Get current user ID
		$user_id = $this->session->userdata('admin_id');
		
		if (!$user_id) {
			echo json_encode([
				'status' => 'error',
				'message' => 'User not authenticated'
			]);
			return;
		}
		
		// Load Payroll_approval_model
		$this->load->model('Payroll_approval_model', 'payroll_approval');
		
		// Submit for approval
		$result = $this->payroll_approval->submit_for_approval($pay_id, $user_id);
		
		// Return JSON response
		if ($result['success']) {
			echo json_encode([
				'status' => 'success',
				'message' => $result['message']
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => $result['message'],
				'errors' => isset($result['errors']) ? $result['errors'] : null
			]);
		}
	}
	
	/**
	 * Task 8.4: Approve payroll
	 * 
	 * Endpoint: POST /admin/payroll/approve/{pay_id}
	 * 
	 * Approves a pending payroll record
	 * Requires user to have approval permissions
	 * Transitions status from 'pending_approval' to 'approved'
	 */
	public function payroll_approve($pay_id) {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Get current user ID and comments
		$user_id = $this->session->userdata('admin_id');
		$comments = $this->input->post('comments') ?: '';
		
		if (!$user_id) {
			echo json_encode([
				'status' => 'error',
				'message' => 'User not authenticated'
			]);
			return;
		}
		
		// Load Payroll_approval_model
		$this->load->model('Payroll_approval_model', 'payroll_approval');
		
		// Approve payroll
		$result = $this->payroll_approval->approve_payroll($pay_id, $user_id, $comments);
		
		// Return JSON response
		if ($result['success']) {
			echo json_encode([
				'status' => 'success',
				'message' => $result['message']
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => $result['message']
			]);
		}
	}
	
	/**
	 * Task 8.5: Reject payroll
	 * 
	 * Endpoint: POST /admin/payroll/reject/{pay_id}
	 * 
	 * Rejects a pending or approved payroll record
	 * Requires user to have approval permissions
	 * Requires rejection reason (minimum 10 characters)
	 * Transitions status to 'rejected'
	 */
	public function payroll_reject($pay_id) {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Get current user ID and rejection reason
		$user_id = $this->session->userdata('admin_id');
		$reason = $this->input->post('reason');
		
		if (!$user_id) {
			echo json_encode([
				'status' => 'error',
				'message' => 'User not authenticated'
			]);
			return;
		}
		
		// Validate rejection reason
		if (empty($reason)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Rejection reason is required'
			]);
			return;
		}
		
		if (strlen($reason) < 10) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Rejection reason must be at least 10 characters'
			]);
			return;
		}
		
		// Load Payroll_approval_model
		$this->load->model('Payroll_approval_model', 'payroll_approval');
		
		// Reject payroll
		$result = $this->payroll_approval->reject_payroll($pay_id, $user_id, $reason);
		
		// Return JSON response
		if ($result['success']) {
			echo json_encode([
				'status' => 'success',
				'message' => $result['message']
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => $result['message']
			]);
		}
	}
	
	/**
	 * Wave 8 - Task 11.3: Mark payroll as paid
	 * 
	 * Endpoint: POST /admin/payroll_mark_paid/{pay_id}
	 * 
	 * Marks an approved payroll as paid
	 * Requires user to have finance permissions
	 * Transitions status from 'approved' to 'paid'
	 */
	public function payroll_mark_paid($pay_id) {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Get current user ID
		$user_id = $this->session->userdata('admin_id');
		
		if (!$user_id) {
			echo json_encode([
				'status' => 'error',
				'message' => 'User not authenticated'
			]);
			return;
		}
		
		// Load Payroll_model
		
		// Check if payroll is in approved status
		$payroll = $this->db->get_where('payroll', ['pay_id' => $pay_id])->row_array();
		
		if (!$payroll) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Payroll not found'
			]);
			return;
		}
		
		if ($payroll['approval_status'] !== 'approved') {
			echo json_encode([
				'status' => 'error',
				'message' => 'Only approved payrolls can be marked as paid'
			]);
			return;
		}
		
		// Update status to paid
		$update_data = [
			'approval_status' => 'paid',
			'payment_date' => date('Y-m-d H:i:s')
		];
		
		$this->db->where('pay_id', $pay_id);
		$updated = $this->db->update('payroll', $update_data);
		
		if ($updated) {
			// Log the action in audit log
			$audit_data = [
				'pay_id' => $pay_id,
				'action' => 'marked_paid',
				'user_id' => $user_id,
				'timestamp' => date('Y-m-d H:i:s'),
				'comments' => 'Payment processed'
			];
			$this->db->insert('payroll_audit_log', $audit_data);
			
			echo json_encode([
				'status' => 'success',
				'message' => 'Payroll marked as paid successfully'
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Failed to update payroll status'
			]);
		}
	}
	
	/**
	 * Get payslip preview HTML for modal display
	 * 
	 * Endpoint: GET /admin/get_payslip_preview/{pay_id}
	 * 
	 * Returns the HTML content of a payslip for display in a modal
	 */
	public function get_payslip_preview($pay_id) {
		// Check if user is logged in
		if ($this->session->userdata('admin_login') != 1) {
			echo '<p class="text-red-600">Unauthorized access</p>';
			return;
		}
		
		// Load models and statutory rates
		$this->load->model('payroll_statutory_model');
		
		// Get payroll data
		$payroll = $this->db->get_where('pay_salary', ['pay_id' => $pay_id])->row_array();
		
		if (!$payroll) {
			echo '<div class="text-center py-12">
				<svg class="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<h3 class="mt-4 text-lg font-medium text-gray-900">Payroll record not found</h3>
			</div>';
			return;
		}
		
		// Set the required variables that payslip_preview.php expects
		$staffCode = $payroll['employee_code'];
		$payMonth = $payroll['month'];
		$payYear = $payroll['year'];
		$employmentCategory = $payroll['employment_category'];
		
		// Pass variables to the view with statutory rates
		$page_data = [
			'staffCode' => $staffCode,
			'payMonth' => $payMonth,
			'payYear' => $payYear,
			'employmentCategory' => $employmentCategory,
			'modal_view' => true,  // Flag to indicate this is for modal display
			'statutory_rates' => $this->payroll_statutory_model->get_all_settings()
		];
		
		// Extract variables for the view
		extract($page_data);
		
		// Load the payslip preview view
		$this->load->view('backend/admin/payslip_preview', $page_data);
	}
	
	/**
	 * BONUS: Get pending payroll approvals (for dashboard/notification system)
	 * 
	 * Endpoint: GET /admin/payroll/pending_approvals
	 * 
	 * Returns list of all payrolls awaiting approval
	 */
	public function payroll_pending_approvals() {
		// Load Payroll_approval_model
		$this->load->model('Payroll_approval_model', 'payroll_approval');
		
		// Get pending approvals
		$pending = $this->payroll_approval->get_pending_approvals();
		
		// Return JSON response
		echo json_encode([
			'status' => 'success',
			'count' => count($pending),
			'data' => $pending
		]);
	}
	
	/**
	 * BONUS: Get payroll approval history
	 * 
	 * Endpoint: GET /admin/payroll/approval_history/{pay_id}
	 * 
	 * Returns complete approval workflow history for a payroll record
	 */
	public function payroll_approval_history($pay_id) {
		// Load Payroll_approval_model
		$this->load->model('Payroll_approval_model', 'payroll_approval');
		
		// Get approval history
		$history = $this->payroll_approval->get_approval_history($pay_id);
		
		// Return JSON response
		echo json_encode([
			'status' => 'success',
			'count' => count($history),
			'data' => $history
		]);
	}
	
	/**
	 * BONUS: Copy payroll from last month (for form pre-filling)
	 * 
	 * Endpoint: GET /admin/payroll/copy_last_month/{employee_code}
	 * 
	 * Returns previous month's payroll data for an employee
	 */
	public function payroll_copy_last_month($employee_code) {
		// Load Payroll_model
		
		// Get last month's data
		$last_month_data = $this->payroll_model->copy_from_last_month($employee_code);
		
		// Return JSON response
		if ($last_month_data) {
			echo json_encode([
				'status' => 'success',
				'data' => $last_month_data,
				'message' => 'Last month payroll data loaded'
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'No previous payroll data found for this employee'
			]);
		}
	}

	/**
	 * Task 12.1: Detect duplicate payroll attempt
	 * 
	 * Endpoint: POST /admin/payroll/check_duplicate
	 * 
	 * Checks if a payroll record already exists for the given employee, month, and year
	 * before submission. Returns existing payroll details if found.
	 * 
	 * Used by the frontend to show a warning modal before attempting to create a duplicate
	 * 
	 * Request POST params:
	 * - employee_code: string
	 * - month: string (month name like "January", "February", etc.)
	 * - year: string/int
	 * 
	 * Response JSON:
	 * - exists: boolean
	 * - record: object|null (existing payroll details if found)
	 * 
	 * Requirements: 25.1 (Requirement 26.1-26.3)
	 */
	public function payroll_check_duplicate() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Invalid request'
			]);
			return;
		}
		
		// Get POST parameters
		$employee_code = $this->input->post('employee_code');
		$month = $this->input->post('month'); // This comes as "06" from frontend
		$year = $this->input->post('year');
		
		// Validate required parameters
		if (empty($employee_code) || empty($month) || empty($year)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Missing required parameters: employee_code, month, year'
			]);
			return;
		}
		
		// BUGFIX: Convert numeric month (06) to month name (June) for database query
		// The pay_salary table stores month as full month name, not numeric
		$month_names = [
			'01' => 'January', '02' => 'February', '03' => 'March', '04' => 'April',
			'05' => 'May', '06' => 'June', '07' => 'July', '08' => 'August',
			'09' => 'September', '10' => 'October', '11' => 'November', '12' => 'December'
		];
		
		// Convert numeric month to month name
		$month_name = isset($month_names[$month]) ? $month_names[$month] : $month;
		
		// Load Payroll_model
		
		// Check for duplicate using month name
		$duplicate_check = $this->payroll_model->check_duplicate_payroll($employee_code, $month_name, $year);
		
		if ($duplicate_check['exists']) {
			// Duplicate found - fetch full details including staff info
			$existing_record = $duplicate_check['record'];
			
			// Get staff information based on employment category
			$employment_category = $existing_record['employment_category'];
			$staff_info = null;
			
			if ($employment_category == 'teacher') {
				$staff_info = $this->db->get_where('teacher', ['teacher_code' => $employee_code])->row_array();
			} elseif ($employment_category == 'administrator') {
				$staff_info = $this->db->get_where('admin', ['admin_code' => $employee_code])->row_array();
			}
			
			// Format the response with full details
			echo json_encode([
				'success' => false, // BUGFIX: Use 'success' => false to indicate duplicate found
				'status' => 'duplicate_found',
				'exists' => true,
				'record' => [
					'pay_id' => $existing_record['pay_id'],
					'employee_code' => $existing_record['employee_code'],
					'staff_name' => $staff_info['name'] ?? 'Unknown',
					'month' => $existing_record['month'],
					'year' => $existing_record['year'],
					'basic_salary' => $existing_record['basic_salary'],
					'gross_salary' => $existing_record['gross_salary'],
					'total_deductions' => $existing_record['total_deductions'],
					'net_salary' => $existing_record['net_salary'],
					'status' => $existing_record['status'] ?? 'Process',
					'approval_status' => $existing_record['approval_status'] ?? 'draft',
					'created_at' => $existing_record['created_at'] ?? null,
					'reference' => $existing_record['reference'] ?? null,
					'employment_category' => $existing_record['employment_category']
				],
				'message' => 'A payroll record already exists for this employee and period'
			]);
		} else {
			// No duplicate - safe to proceed
			echo json_encode([
				'success' => true, // BUGFIX: Use 'success' => true for no duplicate
				'status' => 'success',
				'exists' => false,
				'message' => 'No duplicate found. Safe to create payroll.'
			]);
		}
	}

	/**
	 * Task 12.3: Overwrite Existing Payroll Record
	 * 
	 * Deletes the existing payroll record and allows creation of a new one.
	 * Requires explicit user confirmation and logs the overwrite action in audit_logs.
	 * 
	 * POST parameters:
	 * - pay_id: int (required) - ID of existing payroll to overwrite
	 * 
	 * Returns JSON:
	 * - status: string ('success' or 'error')
	 * - message: string (descriptive message)
	 * 
	 * Requirements: 25.1 (Requirement 26.5-26.6)
	 */
	public function payroll_overwrite_existing() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Invalid request'
			]);
			return;
		}
		
		// Get POST parameters
		$pay_id = $this->input->post('pay_id');
		
		// Validate required parameter
		if (empty($pay_id)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Missing required parameter: pay_id'
			]);
			return;
		}
		
		// Load required models
		$this->load->model('Audit_log_model', 'audit_log');
		
		// Get current user ID
		$current_user_id = $this->session->userdata('login_user_id') ?? $this->session->userdata('admin_id');
		
		// Start database transaction
		$this->db->trans_start();
		
		try {
			// Fetch the existing record before deletion (for audit log)
			$this->db->where('pay_id', $pay_id);
			$existing_record = $this->db->get('pay_salary')->row_array();
			
			if (!$existing_record) {
				echo json_encode([
					'status' => 'error',
					'message' => 'Payroll record not found'
				]);
				return;
			}
			
			// Delete the existing payroll record
			$this->db->where('pay_id', $pay_id);
			$delete_result = $this->db->delete('pay_salary');
			
			if (!$delete_result) {
				throw new Exception('Failed to delete existing payroll record');
			}
			
			// Task 17.2: Invalidate dashboard cache after payroll deletion
			$this->load->driver('cache', array('adapter' => 'file'));
			$month_number = $this->get_month_number_from_name($existing_record['month']);
			$cache_key = "payroll_dashboard_{$month_number}_{$existing_record['year']}";
			$this->cache->delete($cache_key);
			
			// Log the overwrite action in audit_logs
			$this->audit_log->log_action('payroll', 'overwrite_delete', $pay_id, $existing_record, null);
			
			// Complete transaction
			$this->db->trans_complete();
			
			// Check transaction status
			if ($this->db->trans_status() === FALSE) {
				throw new Exception('Database transaction failed');
			}
			
			// Return success response
			echo json_encode([
				'status' => 'success',
				'message' => 'Existing payroll record has been deleted. You can now submit the new payroll.',
				'deleted_record' => [
					'pay_id' => $existing_record['pay_id'],
					'employee_code' => $existing_record['employee_code'],
					'month' => $existing_record['month'],
					'year' => $existing_record['year'],
					'net_salary' => $existing_record['net_salary']
				]
			]);
			
		} catch (Exception $e) {
			// Rollback transaction on error
			$this->db->trans_rollback();
			
			// Log error
			log_message('error', 'Payroll overwrite failed: ' . $e->getMessage());
			
			// Return error response
			echo json_encode([
				'status' => 'error',
				'message' => 'Failed to overwrite payroll: ' . $e->getMessage()
			]);
		}
	}

	/**
	 * Task 10.2: Payroll Dashboard Controller Method
	 * 
	 * Displays the payroll dashboard with analytics and visualizations
	 */
	public function payroll_dashboard() {
		// Set page data
		$page_data['page_name'] = 'payroll_dashboard';
		$page_data['page_title'] = get_phrase('payroll_dashboard');
		$page_data['account_type'] = $this->session->userdata('login_type');
		
		// Set default month and year
		$page_data['current_month'] = date('n');
		$page_data['current_year'] = date('Y');
		
		// Load the dashboard view
		$this->load->view('backend/admin/payroll_dashboard', $page_data);
	}
	
	/**
	 * Task 10.3-10.11: Payroll Dashboard Data AJAX Endpoint
	 * 
	 * Returns dashboard data for specified month/year including:
	 * - Summary cards (gross, deductions, net, staff count)
	 * - Payment status (paid, pending, overdue)
	 * - Category breakdown
	 * - Month comparison data
	 * - Category distribution for donut chart
	 * - 12-month trend data
	 * - Top 10 earners
	 */
	public function payroll_dashboard_data() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Get month and year from POST
		$month = $this->input->post('month') ?: date('n');
		$year = $this->input->post('year') ?: date('Y');
		
		// Task 10.10: Check cache first (1 hour expiration)
		$cache_key = "payroll_dashboard_{$month}_{$year}";
		$this->load->driver('cache', array('adapter' => 'file'));
		
		$cached_data = $this->cache->get($cache_key);
		if ($cached_data !== FALSE) {
			echo json_encode([
				'success' => true,
				'data' => $cached_data,
				'cached' => true
			]);
			return;
		}
		
		// Load Payroll_model
		
		// Task 10.3: Get summary card data
		$summary = $this->get_payroll_summary($month, $year);
		
		// Task 10.11: Get payment status data
		$payment_status = $this->get_payment_status($month, $year);
		
		// Task 10.4: Get employment category breakdown
		$category_breakdown = $this->get_payroll_category_breakdown($month, $year);
		
		// Task 10.6: Get month-over-month comparison (current month vs previous month)
		$month_comparison = $this->get_month_comparison($month, $year);
		
		// Task 10.7: Get category distribution for donut chart
		$category_distribution = $this->get_category_distribution($month, $year);
		
		// Task 10.8: Get 12-month payroll trend
		$payroll_trend = $this->get_payroll_trend($year);
		
		// Task 10.9: Get top 10 earners
		$top_earners = $this->get_top_earners($month, $year);
		
		// Prepare response data
		$dashboard_data = [
			'summary' => $summary,
			'payment_status' => $payment_status,
			'category_breakdown' => $category_breakdown,
			'month_comparison' => $month_comparison,
			'category_distribution' => $category_distribution,
			'payroll_trend' => $payroll_trend,
			'top_earners' => $top_earners
		];
		
		// Task 10.10: Cache for 1 hour (3600 seconds)
		$this->cache->save($cache_key, $dashboard_data, 3600);
		
		// Return JSON response
		echo json_encode([
			'success' => true,
			'data' => $dashboard_data,
			'cached' => false
		]);
	}
	
	/**
	 * Helper: Get payroll summary for a month
	 */
	private function get_payroll_summary($month, $year) {
		$this->db->select('
			COUNT(*) as staff_count,
			SUM(gross_salary) as total_gross,
			SUM(total_deductions) as total_deductions,
			SUM(net_salary) as total_net
		');
		$this->db->from('pay_salary');
		$this->db->where('month', $month);
		$this->db->where('year', $year);
		
		$result = $this->db->get()->row();
		
		return [
			'staff_count' => $result->staff_count ?? 0,
			'total_gross' => $result->total_gross ?? 0,
			'total_deductions' => $result->total_deductions ?? 0,
			'total_net' => $result->total_net ?? 0
		];
	}
	
	/**
	 * Helper: Get payment status breakdown
	 */
	private function get_payment_status($month, $year) {
		// Count paid
		$paid = $this->db->where('month', $month)
			->where('year', $year)
			->where('approval_status', 'paid')
			->count_all_results('pay_salary');
		
		// Count pending (pending_approval or approved but not paid)
		$this->db->where('month', $month);
		$this->db->where('year', $year);
		$this->db->group_start();
		$this->db->where('approval_status', 'pending_approval');
		$this->db->or_where('approval_status', 'approved');
		$this->db->group_end();
		$pending = $this->db->count_all_results('pay_salary');
		
		// Count overdue (approved more than 5 days ago but not paid)
		$five_days_ago = date('Y-m-d H:i:s', strtotime('-5 days'));
		$this->db->where('month', $month);
		$this->db->where('year', $year);
		$this->db->where('approval_status', 'approved');
		$this->db->where('updated_at <', $five_days_ago);
		$overdue = $this->db->count_all_results('pay_salary');
		
		return [
			'paid' => $paid,
			'pending' => $pending,
			'overdue' => $overdue
		];
	}
	
	/**
	 * Wave 7 - Task 10.7: Helper for payroll category breakdown chart
	 */
	private function get_payroll_category_breakdown($month, $year) {
		$this->db->select('
			employment_category as category,
			COUNT(*) as staff_count,
			SUM(gross_salary) as gross_salary,
			SUM(total_deductions) as deductions,
			SUM(net_salary) as net_salary
		');
		$this->db->from('pay_salary');
		$this->db->where('month', $month);
		$this->db->where('year', $year);
		$this->db->group_by('employment_category');
		
		$results = $this->db->get()->result_array();
		
		// Format category names
		foreach ($results as &$row) {
			$row['category'] = ucwords(str_replace('_', ' ', $row['category']));
		}
		
		return $results;
	}
	
	/**
	 * Helper: Get month-over-month comparison
	 */
	private function get_month_comparison($month, $year) {
		// Current month
		$this->db->select('
			SUM(gross_salary) as gross,
			SUM(total_deductions) as deductions,
			SUM(net_salary) as net
		');
		$this->db->from('pay_salary');
		$this->db->where('month', $month);
		$this->db->where('year', $year);
		$current = $this->db->get()->row();
		
		// Previous month
		$prev_month = $month - 1;
		$prev_year = $year;
		if ($prev_month < 1) {
			$prev_month = 12;
			$prev_year--;
		}
		
		$this->db->select('
			SUM(gross_salary) as gross,
			SUM(total_deductions) as deductions,
			SUM(net_salary) as net
		');
		$this->db->from('pay_salary');
		$this->db->where('month', $prev_month);
		$this->db->where('year', $prev_year);
		$previous = $this->db->get()->row();
		
		return [
			'labels' => [
				date('F Y', mktime(0, 0, 0, $prev_month, 1, $prev_year)),
				date('F Y', mktime(0, 0, 0, $month, 1, $year))
			],
			'gross' => [
				$previous->gross ?? 0,
				$current->gross ?? 0
			],
			'deductions' => [
				$previous->deductions ?? 0,
				$current->deductions ?? 0
			],
			'net' => [
				$previous->net ?? 0,
				$current->net ?? 0
			]
		];
	}
	
	/**
	 * Helper: Get category distribution for donut chart
	 */
	private function get_category_distribution($month, $year) {
		$this->db->select('
			employment_category,
			SUM(gross_salary) as total
		');
		$this->db->from('pay_salary');
		$this->db->where('month', $month);
		$this->db->where('year', $year);
		$this->db->group_by('employment_category');
		
		$results = $this->db->get()->result();
		
		$labels = [];
		$values = [];
		
		foreach ($results as $row) {
			$labels[] = ucwords(str_replace('_', ' ', $row->employment_category));
			$values[] = floatval($row->total);
		}
		
		return [
			'labels' => $labels,
			'values' => $values
		];
	}
	
	/**
	 * Helper: Get 12-month payroll trend
	 */
	private function get_payroll_trend($year) {
		$labels = [];
		$values = [];
		
		// Get last 12 months
		for ($i = 11; $i >= 0; $i--) {
			$target_month = date('n', strtotime("-$i months"));
			$target_year = date('Y', strtotime("-$i months"));
			
			$this->db->select('SUM(net_salary) as total');
			$this->db->from('pay_salary');
			$this->db->where('month', $target_month);
			$this->db->where('year', $target_year);
			$result = $this->db->get()->row();
			
			$labels[] = date('M Y', strtotime("-$i months"));
			$values[] = $result->total ?? 0;
		}
		
		return [
			'labels' => $labels,
			'values' => $values
		];
	}
	
	/**
	 * Helper: Get top 10 earners
	 */
	private function get_top_earners($month, $year) {
		$this->db->select('ps.*, 
			COALESCE(t.name, a.name, nts.name) as name,
			ps.employee_code as code,
			ps.employment_category as category,
			ps.net_salary
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		$this->db->order_by('ps.net_salary', 'DESC');
		$this->db->limit(10);
		
		$results = $this->db->get()->result();
		
		$earners = [];
		foreach ($results as $row) {
			$earners[] = [
				'name' => $row->name,
				'code' => $row->code,
				'category' => ucwords(str_replace('_', ' ', $row->category)),
				'net_salary' => floatval($row->net_salary)
			];
		}
		
		return $earners;
	}
	
	/**
	 * Task 17.2: Helper method to convert month name to number
	 * 
	 * Converts month names like "January", "February" to numbers "01", "02", etc.
	 * Used for cache key generation in payroll operations
	 * 
	 * @param string $month_name Month name (e.g., "January")
	 * @return string Month number with leading zero (e.g., "01")
	 */
	private function get_month_number_from_name($month_name) {
		$months = [
			'January' => '01', 'February' => '02', 'March' => '03', 'April' => '04',
			'May' => '05', 'June' => '06', 'July' => '07', 'August' => '08',
			'September' => '09', 'October' => '10', 'November' => '11', 'December' => '12'
		];
		
		return isset($months[$month_name]) ? $months[$month_name] : '01';
	}

	/**
	 * Task 13.1-13.2: Audit Log Viewer
	 * 
	 * Main audit log viewer page with filters
	 * Requirements: 8.7, 8.9
	 */
	public function audit_logs() {
		// Restrict access to admin users only
		if ($this->session->userdata('login_type') !== 'admin') {
			$this->session->set_flashdata('error_message', get_phrase('access_denied'));
			redirect(site_url('login'), 'refresh');
			return;
		}
		
		// Set page data
		$page_data['page_name'] = 'audit_log_viewer';
		$page_data['page_title'] = get_phrase('audit_logs');
		$page_data['account_type'] = $this->session->userdata('login_type');
		
		// Load Audit_log_model
		$this->load->model('Audit_log_model', 'audit_log');
		
		// Get filter parameters
		$module = $this->input->get('module');
		$user_id = $this->input->get('user_id');
		$date_from = $this->input->get('date_from');
		$date_to = $this->input->get('date_to');
		
		// Get filtered logs
		$page_data['logs'] = $this->audit_log->get_logs_filtered($module, $user_id, $date_from, $date_to);
		
		// Get unique modules for filter dropdown
		$page_data['modules'] = $this->audit_log->get_all_modules();
		
		// Get all users for filter dropdown
		$page_data['users'] = $this->get_all_users_for_audit();
		
		// Load the audit log viewer view
		$this->load->view('backend/admin/audit_log_viewer', $page_data);
	}
	
	/**
	 * Task 13.2: Get filtered audit logs (AJAX endpoint)
	 * 
	 * Returns filtered audit logs for DataTables
	 * Requirements: 8.7
	 */
	public function get_audit_logs_ajax() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Restrict access to admin users only
		if ($this->session->userdata('login_type') !== 'admin') {
			echo json_encode([
				'status' => 'error',
				'message' => 'Access denied'
			]);
			return;
		}
		
		// Load Audit_log_model
		$this->load->model('Audit_log_model', 'audit_log');
		
		// Get filter parameters
		$module = $this->input->post('module');
		$user_id = $this->input->post('user_id');
		$date_from = $this->input->post('date_from');
		$date_to = $this->input->post('date_to');
		
		// Get pagination parameters for DataTables
		$start = $this->input->post('start') ?? 0;
		$length = $this->input->post('length') ?? 50;
		$search = $this->input->post('search')['value'] ?? '';
		
		// Get filtered logs with pagination
		$logs = $this->audit_log->get_logs_filtered($module, $user_id, $date_from, $date_to, $start, $length, $search);
		$total = $this->audit_log->get_logs_count($module, $user_id, $date_from, $date_to, $search);
		
		// Format logs for DataTables
		$data = [];
		foreach ($logs as $log) {
			$data[] = [
				'log_id' => $log['log_id'],
				'module' => ucwords($log['module']),
				'action' => ucwords(str_replace('_', ' ', $log['action'])),
				'user_name' => $log['user_name'] ?? 'System',
				'record_id' => $log['record_id'],
				'ip_address' => $log['ip_address'],
				'created_at' => date('Y-m-d H:i:s', strtotime($log['created_at'])),
				'actions' => '<button class="btn btn-sm btn-primary view-details-btn" data-log-id="' . $log['log_id'] . '"><i class="fas fa-eye"></i> View Details</button>'
			];
		}
		
		// Return JSON response
		echo json_encode([
			'draw' => intval($this->input->post('draw')),
			'recordsTotal' => $total,
			'recordsFiltered' => $total,
			'data' => $data
		]);
	}
	
	/**
	 * Task 13.4: Get audit log details (AJAX endpoint)
	 * 
	 * Returns detailed audit log information including before/after data
	 * Requirements: 8.2, 8.9
	 */
	public function get_audit_log_details() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Restrict access to admin users only
		if ($this->session->userdata('login_type') !== 'admin') {
			echo json_encode([
				'status' => 'error',
				'message' => 'Access denied'
			]);
			return;
		}
		
		// Get log ID
		$log_id = $this->input->post('log_id');
		
		if (empty($log_id)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Missing log ID'
			]);
			return;
		}
		
		// Load Audit_log_model
		$this->load->model('Audit_log_model', 'audit_log');
		
		// Get log details
		$log = $this->audit_log->get_log_by_id($log_id);
		
		if (!$log) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Log not found'
			]);
			return;
		}
		
		// Parse JSON data
		$before_data = json_decode($log['before_data'], true);
		$after_data = json_decode($log['after_data'], true);
		
		// Return log details
		echo json_encode([
			'status' => 'success',
			'log' => [
				'log_id' => $log['log_id'],
				'module' => ucwords($log['module']),
				'action' => ucwords(str_replace('_', ' ', $log['action'])),
				'user_name' => $log['user_name'] ?? 'System',
				'record_id' => $log['record_id'],
				'before_data' => $before_data,
				'after_data' => $after_data,
				'ip_address' => $log['ip_address'],
				'user_agent' => $log['user_agent'],
				'created_at' => date('Y-m-d H:i:s', strtotime($log['created_at']))
			]
		]);
	}
	
	/**
	 * Task 13.5: Export audit logs to CSV
	 * 
	 * Exports filtered audit logs to CSV file
	 * Requirements: 8.7
	 */
	public function export_audit_logs_csv() {
		// Restrict access to admin users only
		if ($this->session->userdata('login_type') !== 'admin') {
			$this->session->set_flashdata('error_message', get_phrase('access_denied'));
			redirect(site_url('admin/audit_logs'), 'refresh');
			return;
		}
		
		// Load Audit_log_model
		$this->load->model('Audit_log_model', 'audit_log');
		
		// Get filter parameters
		$module = $this->input->get('module');
		$user_id = $this->input->get('user_id');
		$date_from = $this->input->get('date_from');
		$date_to = $this->input->get('date_to');
		
		// Get all filtered logs (no pagination)
		$logs = $this->audit_log->get_logs_filtered($module, $user_id, $date_from, $date_to, 0, 999999);
		
		// Set CSV headers
		header('Content-Type: text/csv');
		header('Content-Disposition: attachment; filename="audit_logs_' . date('Y-m-d_His') . '.csv"');
		
		// Open output stream
		$output = fopen('php://output', 'w');
		
		// Write CSV header row
		fputcsv($output, ['Log ID', 'Module', 'Action', 'User', 'Record ID', 'IP Address', 'Date/Time']);
		
		// Write data rows
		foreach ($logs as $log) {
			fputcsv($output, [
				$log['log_id'],
				ucwords($log['module']),
				ucwords(str_replace('_', ' ', $log['action'])),
				$log['user_name'] ?? 'System',
				$log['record_id'],
				$log['ip_address'],
				date('Y-m-d H:i:s', strtotime($log['created_at']))
			]);
		}
		
		fclose($output);
		exit;
	}
	
	/**
	 * Helper: Get all users for audit log filter
	 */
	private function get_all_users_for_audit() {
		$users = [];
		
		// Get admins
		$this->db->select('admin_id as id, name');
		$this->db->from('admin');
		$admins = $this->db->get()->result_array();
		
		foreach ($admins as $admin) {
			$users[] = [
				'id' => $admin['id'],
				'name' => $admin['name'] . ' (Admin)'
			];
		}
		
		// Get teachers
		$this->db->select('teacher_id as id, name');
		$this->db->from('teacher');
		$teachers = $this->db->get()->result_array();
		
		foreach ($teachers as $teacher) {
			$users[] = [
				'id' => $teacher['id'],
				'name' => $teacher['name'] . ' (Teacher)'
			];
		}
		
		return $users;
	}

	/**
	 * Task 14.1-14.2: Payroll Register Report
	 * 
	 * Displays payroll register with filters
	 * Requirements: 15.1, 15.2
	 */
	public function payroll_register() {
		// Set page data
		$page_data['page_name'] = 'payroll_register';
		$page_data['page_title'] = get_phrase('payroll_register');
		$page_data['account_type'] = $this->session->userdata('login_type');
		
		// Load the payroll register view
		$this->load->view('backend/main', $page_data);
	}
	
	/**
	 * Task 14.2: Get payroll register data (AJAX endpoint)
	 * 
	 * Returns filtered payroll data for DataTables
	 * Requirements: 15.3, 15.4, 15.5, 15.6, 15.7, 15.9
	 */
	public function get_payroll_register_data() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			show_404();
			return;
		}
		
		// Get filter parameters
		$month = $this->input->post('month');
		$year = $this->input->post('year');
		$category = $this->input->post('category');
		$status = $this->input->post('status');
		
		// Get pagination parameters for DataTables
		$start = $this->input->post('start') ?? 0;
		$length = $this->input->post('length') ?? 50;
		$search = $this->input->post('search')['value'] ?? '';
		
		// Build query
		$this->db->select('ps.*, 
			COALESCE(t.name, a.name, nts.name) as staff_name,
			ps.employee_code as staff_code,
			ps.employment_category as category,
			ps.gross_salary,
			ps.total_deductions,
			ps.net_salary,
			ps.approval_status as status,
			CASE 
				WHEN ps.payment_method = 1 THEN "Cash"
				WHEN ps.payment_method = 2 THEN "Bank Transfer"
				WHEN ps.payment_method = 3 THEN "Mobile Money"
				WHEN ps.payment_method = 4 THEN "Cheque"
				ELSE "Not Specified"
			END as payment_method
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		
		// Apply filters
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		
		if (!empty($category)) {
			$this->db->where('ps.employment_category', $category);
		}
		
		if (!empty($status)) {
			$this->db->where('ps.approval_status', $status);
		}
		
		// Apply search
		if (!empty($search)) {
			$this->db->group_start();
			$this->db->like('COALESCE(t.name, a.name, nts.name)', $search);
			$this->db->or_like('ps.employee_code', $search);
			$this->db->group_end();
		}
		
		// Get total count before pagination
		$total_query = clone $this->db;
		$total = $total_query->count_all_results();
		
		// Get totals for footer
		$this->db->select('SUM(ps.gross_salary) as total_gross, SUM(ps.total_deductions) as total_deductions, SUM(ps.net_salary) as total_net');
		$totals_result = $this->db->get()->row();
		
		// Reset query for data fetch
		$this->db->select('ps.*, 
			COALESCE(t.name, a.name, nts.name) as staff_name,
			ps.employee_code as staff_code,
			ps.employment_category as category,
			ps.gross_salary,
			ps.total_deductions,
			ps.net_salary,
			ps.approval_status as status,
			CASE 
				WHEN ps.payment_method = 1 THEN "Cash"
				WHEN ps.payment_method = 2 THEN "Bank Transfer"
				WHEN ps.payment_method = 3 THEN "Mobile Money"
				WHEN ps.payment_method = 4 THEN "Cheque"
				ELSE "Not Specified"
			END as payment_method
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		
		// Apply same filters
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		
		if (!empty($category)) {
			$this->db->where('ps.employment_category', $category);
		}
		
		if (!empty($status)) {
			$this->db->where('ps.approval_status', $status);
		}
		
		// Apply search again
		if (!empty($search)) {
			$this->db->group_start();
			$this->db->like('COALESCE(t.name, a.name, nts.name)', $search);
			$this->db->or_like('ps.employee_code', $search);
			$this->db->group_end();
		}
		
		// Apply pagination
		$this->db->order_by('staff_name', 'ASC');
		$this->db->limit($length, $start);
		
		$results = $this->db->get()->result_array();
		
		// Format data for DataTables
		$data = [];
		foreach ($results as $row) {
			$data[] = [
				'staff_name' => $row['staff_name'],
				'staff_code' => $row['staff_code'],
				'category' => ucwords(str_replace('_', ' ', $row['category'])),
				'gross_salary' => floatval($row['gross_salary']),
				'total_deductions' => floatval($row['total_deductions']),
				'net_salary' => floatval($row['net_salary']),
				'status' => $row['status'],
				'payment_method' => $row['payment_method']
			];
		}
		
		// Return JSON response
		echo json_encode([
			'draw' => intval($this->input->post('draw')),
			'recordsTotal' => $total,
			'recordsFiltered' => $total,
			'data' => $data,
			'totals' => [
				'gross' => floatval($totals_result->total_gross),
				'deductions' => floatval($totals_result->total_deductions),
				'net' => floatval($totals_result->total_net)
			]
		]);
	}
	
	/**
	 * Task 14.3: Export payroll register to Excel
	 * 
	 * Exports filtered payroll data to Excel file
	 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
	 */
	public function export_payroll_register_excel() {
		// Get filter parameters
		$month = $this->input->get('month');
		$year = $this->input->get('year');
		$category = $this->input->get('category');
		$status = $this->input->get('status');
		
		// Build query
		$this->db->select('ps.*, 
			COALESCE(t.name, a.name, nts.name) as staff_name,
			ps.employee_code as staff_code,
			ps.employment_category as category,
			ps.gross_salary,
			ps.total_deductions,
			ps.net_salary,
			ps.approval_status as status,
			CASE 
				WHEN ps.payment_method = 1 THEN "Cash"
				WHEN ps.payment_method = 2 THEN "Bank Transfer"
				WHEN ps.payment_method = 3 THEN "Mobile Money"
				WHEN ps.payment_method = 4 THEN "Cheque"
				ELSE "Not Specified"
			END as payment_method
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		
		// Apply filters
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		
		if (!empty($category)) {
			$this->db->where('ps.employment_category', $category);
		}
		
		if (!empty($status)) {
			$this->db->where('ps.approval_status', $status);
		}
		
		$this->db->order_by('staff_name', 'ASC');
		$results = $this->db->get()->result_array();
		
		// Calculate totals
		$total_gross = 0;
		$total_deductions = 0;
		$total_net = 0;
		
		foreach ($results as $row) {
			$total_gross += $row['gross_salary'];
			$total_deductions += $row['total_deductions'];
			$total_net += $row['net_salary'];
		}
		
		// Set CSV headers (simpler than Excel for now)
		$month_name = date('F', mktime(0, 0, 0, $month, 1));
		header('Content-Type: text/csv');
		header('Content-Disposition: attachment; filename="Payroll_Report_' . $month_name . '_' . $year . '_' . date('YmdHis') . '.csv"');
		
		// Open output stream
		$output = fopen('php://output', 'w');
		
		// Write header
		fputcsv($output, ['Payroll Register - ' . $month_name . ' ' . $year]);
		fputcsv($output, []); // Empty line
		
		// Write column headers
		fputcsv($output, ['Staff Name', 'Staff Code', 'Category', 'Gross Salary (GH¢)', 'Total Deductions (GH¢)', 'Net Salary (GH¢)', 'Status', 'Payment Method']);
		
		// Write data rows
		foreach ($results as $row) {
			fputcsv($output, [
				$row['staff_name'],
				$row['staff_code'],
				ucwords(str_replace('_', ' ', $row['category'])),
				number_format($row['gross_salary'], 2),
				number_format($row['total_deductions'], 2),
				number_format($row['net_salary'], 2),
				ucwords(str_replace('_', ' ', $row['status'])),
				$row['payment_method']
			]);
		}
		
		// Write totals row
		fputcsv($output, []); // Empty line
		fputcsv($output, ['TOTALS', '', '', number_format($total_gross, 2), number_format($total_deductions, 2), number_format($total_net, 2), '', '']);
		
		fclose($output);
		exit;
	}
	
	/**
	 * Task 14.4: Export payroll register to PDF
	 * 
	 * Exports filtered payroll data to PDF file
	 * Requirements: 16.7, 16.8, 16.9
	 */
	public function export_payroll_register_pdf() {
		// This is a placeholder - full PDF implementation would require TCPDF or mPDF library
		// For now, we'll create a simple HTML-based PDF using print CSS
		
		// Get filter parameters
		$month = $this->input->get('month');
		$year = $this->input->get('year');
		$category = $this->input->get('category');
		$status = $this->input->get('status');
		
		// Build query (same as Excel)
		$this->db->select('ps.*, 
			COALESCE(t.name, a.name, nts.name) as staff_name,
			ps.employee_code as staff_code,
			ps.employment_category as category,
			ps.gross_salary,
			ps.total_deductions,
			ps.net_salary,
			ps.approval_status as status,
			CASE 
				WHEN ps.payment_method = 1 THEN "Cash"
				WHEN ps.payment_method = 2 THEN "Bank Transfer"
				WHEN ps.payment_method = 3 THEN "Mobile Money"
				WHEN ps.payment_method = 4 THEN "Cheque"
				ELSE "Not Specified"
			END as payment_method
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		
		// Apply filters
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		
		if (!empty($category)) {
			$this->db->where('ps.employment_category', $category);
		}
		
		if (!empty($status)) {
			$this->db->where('ps.approval_status', $status);
		}
		
		$this->db->order_by('staff_name', 'ASC');
		$results = $this->db->get()->result_array();
		
		// Calculate totals
		$total_gross = 0;
		$total_deductions = 0;
		$total_net = 0;
		
		foreach ($results as $row) {
			$total_gross += $row['gross_salary'];
			$total_deductions += $row['total_deductions'];
			$total_net += $row['net_salary'];
		}
		
		// Pass data to view
		$month_name = date('F', mktime(0, 0, 0, $month, 1));
		$page_data['month_name'] = $month_name;
		$page_data['year'] = $year;
		$page_data['results'] = $results;
		$page_data['total_gross'] = $total_gross;
		$page_data['total_deductions'] = $total_deductions;
		$page_data['total_net'] = $total_net;
		
		$this->load->view('backend/admin/reports/payroll_register_pdf', $page_data);
	}

	/**
	 * Task 14.5: Department-wise payroll report view
	 * 
	 * Display department-wise payroll report interface
	 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8
	 */
	public function department_payroll() {
		$page_data['page_name'] = 'department_payroll';
		$page_data['page_title'] = get_phrase('department_wise_payroll_report');
		$this->load->view('backend/index', $page_data);
	}
	
	/**
	 * Task 14.5: Get department payroll data (AJAX)
	 * 
	 * Returns payroll data grouped by department with totals and percentages
	 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
	 */
	public function get_department_payroll_data() {
		$month = $this->input->post('month');
		$year = $this->input->post('year');
		
		// Validate inputs
		if (empty($month) || empty($year)) {
			echo json_encode(['success' => false, 'message' => 'Month and year are required']);
			return;
		}
		
		// Query to get department-wise totals
		// First, get all departments with staff
		$this->db->select('d.department_id, d.name as department_name');
		$this->db->from('department d');
		$this->db->join('teacher t', 'd.department_id = t.department_id', 'left');
		$this->db->group_by('d.department_id');
		$departments = $this->db->get()->result_array();
		
		$department_data = [];
		$grand_total_net = 0;
		
		foreach ($departments as $dept) {
			$dept_id = $dept['department_id'];
			$dept_name = $dept['department_name'];
			
			// Get staff in this department with payroll for selected month/year
			$this->db->select('
				COUNT(ps.pay_id) as staff_count,
				SUM(ps.gross_salary) as total_gross,
				SUM(ps.total_deductions) as total_deductions,
				SUM(ps.net_salary) as total_net
			');
			$this->db->from('pay_salary ps');
			$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
			$this->db->where('ps.month', $month);
			$this->db->where('ps.year', $year);
			$this->db->where('t.department_id', $dept_id);
			
			$result = $this->db->get()->row_array();
			
			if ($result && $result['staff_count'] > 0) {
				$grand_total_net += $result['total_net'];
				
				$department_data[] = [
					'department_id' => $dept_id,
					'department_name' => $dept_name,
					'staff_count' => $result['staff_count'],
					'total_gross' => number_format($result['total_gross'], 2, '.', ''),
					'total_deductions' => number_format($result['total_deductions'], 2, '.', ''),
					'total_net' => number_format($result['total_net'], 2, '.', ''),
					'percentage' => '0.00' // Will calculate after we have grand total
				];
			}
		}
		
		// Calculate percentages
		foreach ($department_data as &$dept) {
			if ($grand_total_net > 0) {
				$percentage = ($dept['total_net'] / $grand_total_net) * 100;
				$dept['percentage'] = number_format($percentage, 2, '.', '');
			}
		}
		
		echo json_encode([
			'success' => true,
			'data' => [
				'departments' => $department_data,
				'grand_total_net' => number_format($grand_total_net, 2, '.', '')
			]
		]);
	}
	
	/**
	 * Task 14.5: Get staff details for a department (AJAX)
	 * 
	 * Returns individual staff payroll details for a specific department
	 * Requirements: 17.3, 17.4
	 */
	public function get_department_staff_details() {
		$department_id = $this->input->post('department_id');
		$month = $this->input->post('month');
		$year = $this->input->post('year');
		
		// Validate inputs
		if (empty($department_id) || empty($month) || empty($year)) {
			echo json_encode(['success' => false, 'message' => 'Department ID, month and year are required']);
			return;
		}
		
		// Query staff payroll details for this department
		$this->db->select('
			t.name as staff_name,
			t.teacher_code as staff_code,
			ps.employment_category as category,
			ps.basic_salary,
			(ps.house_rent + ps.transport + ps.medical + ps.bonus + ps.other_allowances) as total_allowances,
			ps.gross_salary,
			ps.total_deductions,
			ps.net_salary
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'inner');
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		$this->db->where('t.department_id', $department_id);
		$this->db->order_by('t.name', 'ASC');
		
		$results = $this->db->get()->result_array();
		
		// Format results
		$staff_details = [];
		foreach ($results as $row) {
			$staff_details[] = [
				'staff_name' => $row['staff_name'],
				'staff_code' => $row['staff_code'],
				'category' => ucwords(str_replace('_', ' ', $row['category'])),
				'basic_salary' => number_format($row['basic_salary'], 2, '.', ''),
				'total_allowances' => number_format($row['total_allowances'], 2, '.', ''),
				'gross_salary' => number_format($row['gross_salary'], 2, '.', ''),
				'total_deductions' => number_format($row['total_deductions'], 2, '.', ''),
				'net_salary' => number_format($row['net_salary'], 2, '.', '')
			];
		}
		
		echo json_encode([
			'success' => true,
			'data' => $staff_details
		]);
	}
	
	/**
	 * Task 14.5: Export department payroll to Excel
	 * 
	 * Exports department-wise payroll summary to CSV file
	 * Requirements: 17.7, 17.8
	 */
	public function export_department_payroll_excel() {
		$month = $this->input->get('month');
		$year = $this->input->get('year');
		
		// Get department data (reuse logic from get_department_payroll_data)
		$this->db->select('d.department_id, d.name as department_name');
		$this->db->from('department d');
		$this->db->join('teacher t', 'd.department_id = t.department_id', 'left');
		$this->db->group_by('d.department_id');
		$departments = $this->db->get()->result_array();
		
		$department_data = [];
		$grand_total = [
			'staff_count' => 0,
			'gross' => 0,
			'deductions' => 0,
			'net' => 0
		];
		
		foreach ($departments as $dept) {
			$dept_id = $dept['department_id'];
			$dept_name = $dept['department_name'];
			
			$this->db->select('
				COUNT(ps.pay_id) as staff_count,
				SUM(ps.gross_salary) as total_gross,
				SUM(ps.total_deductions) as total_deductions,
				SUM(ps.net_salary) as total_net
			');
			$this->db->from('pay_salary ps');
			$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
			$this->db->where('ps.month', $month);
			$this->db->where('ps.year', $year);
			$this->db->where('t.department_id', $dept_id);
			
			$result = $this->db->get()->row_array();
			
			if ($result && $result['staff_count'] > 0) {
				$department_data[] = [
					'department_name' => $dept_name,
					'staff_count' => $result['staff_count'],
					'total_gross' => $result['total_gross'],
					'total_deductions' => $result['total_deductions'],
					'total_net' => $result['total_net']
				];
				
				$grand_total['staff_count'] += $result['staff_count'];
				$grand_total['gross'] += $result['total_gross'];
				$grand_total['deductions'] += $result['total_deductions'];
				$grand_total['net'] += $result['total_net'];
			}
		}
		
		// Calculate percentages
		foreach ($department_data as &$dept) {
			if ($grand_total['net'] > 0) {
				$dept['percentage'] = ($dept['total_net'] / $grand_total['net']) * 100;
				$dept['avg_per_staff'] = $dept['total_net'] / $dept['staff_count'];
			}
		}
		
		// Set CSV headers
		$month_name = date('F', mktime(0, 0, 0, $month, 1));
		header('Content-Type: text/csv');
		header('Content-Disposition: attachment; filename="Department_Payroll_' . $month_name . '_' . $year . '_' . date('YmdHis') . '.csv"');
		
		$output = fopen('php://output', 'w');
		
		// Write header
		fputcsv($output, ['Department-wise Payroll Report - ' . $month_name . ' ' . $year]);
		fputcsv($output, []);
		
		// Write column headers
		fputcsv($output, ['Department', 'Staff Count', 'Total Gross (GH¢)', 'Total Deductions (GH¢)', 'Total Net (GH¢)', '% of Total', 'Avg per Staff (GH¢)']);
		
		// Write data rows
		foreach ($department_data as $dept) {
			fputcsv($output, [
				$dept['department_name'],
				$dept['staff_count'],
				number_format($dept['total_gross'], 2),
				number_format($dept['total_deductions'], 2),
				number_format($dept['total_net'], 2),
				number_format($dept['percentage'], 2) . '%',
				number_format($dept['avg_per_staff'], 2)
			]);
		}
		
		// Write grand totals
		fputcsv($output, []);
		fputcsv($output, [
			'GRAND TOTAL',
			$grand_total['staff_count'],
			number_format($grand_total['gross'], 2),
			number_format($grand_total['deductions'], 2),
			number_format($grand_total['net'], 2),
			'100.00%',
			''
		]);
		
		fclose($output);
		exit;
	}

	// Get all receipts with filters
	public function get_all_receipts() {
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/admin/get_all_receipts', $page_data);
	}

	/**
	 * Task 14.6: Statutory compliance reports view
	 * 
	 * Display statutory reports interface
	 * Requirements: 18.1, 18.2, 18.3, 18.4, 18.5
	 */
	public function statutory_reports() {
		$page_data['page_name'] = 'statutory_reports';
		$page_data['page_title'] = get_phrase('statutory_compliance_reports');
		$this->load->view('backend/index', $page_data);
	}
	
	/**
	 * Task 14.6: Validate staff for statutory reporting (AJAX)
	 * 
	 * Validates that all staff have required identifiers (SSNIT number, TIN)
	 * Requirements: 18.7
	 */
	public function validate_statutory_staff() {
		$month = $this->input->post('month');
		$year = $this->input->post('year');
		
		// Get all staff with payroll for this period
		$this->db->select('ps.employee_code, ps.employment_category, 
			COALESCE(t.name, a.name, nts.name) as staff_name,
			t.ssnit_number as teacher_ssnit, t.tin as teacher_tin,
			a.ssnit_number as admin_ssnit, a.tin as admin_tin,
			nts.ssnit_number as nts_ssnit, nts.tin as nts_tin
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		$results = $this->db->get()->result_array();
		
		$missing_data = [];
		
		foreach ($results as $row) {
			$ssnit = $row['teacher_ssnit'] ?: ($row['admin_ssnit'] ?: $row['nts_ssnit']);
			$tin = $row['teacher_tin'] ?: ($row['admin_tin'] ?: $row['nts_tin']);
			
			$missing = [];
			if (empty($ssnit)) {
				$missing[] = 'SSNIT Number';
			}
			if (empty($tin)) {
				$missing[] = 'TIN';
			}
			
			if (!empty($missing)) {
				$missing_data[] = [
					'name' => $row['staff_name'],
					'missing' => $missing
				];
			}
		}
		
		if (empty($missing_data)) {
			echo json_encode([
				'valid' => true,
				'staff_count' => count($results)
			]);
		} else {
			echo json_encode([
				'valid' => false,
				'missing_data' => $missing_data
			]);
		}
	}
	
	/**
	 * Task 14.6: Generate statutory reports (AJAX)
	 * 
	 * Generates SSNIT Tier 1, Tier 2, and PAYE reports
	 * Requirements: 18.2, 18.3, 18.4, 18.5, 18.6, 18.8
	 */
	public function generate_statutory_reports() {
		$month = $this->input->post('month');
		$year = $this->input->post('year');
		
		// Get school information
		$school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
		$school_ssnit = $this->db->get_where('settings', ['type' => 'school_ssnit_number'])->row()->description ?? 'N/A';
		$school_tin = $this->db->get_where('settings', ['type' => 'school_tin'])->row()->description ?? 'N/A';
		
		// Get payroll data with staff details
		$this->db->select('
			COALESCE(t.name, a.name, nts.name) as staff_name,
			COALESCE(t.ssnit_number, a.ssnit_number, nts.ssnit_number) as ssnit_number,
			COALESCE(t.tin, a.tin, nts.tin) as tin,
			ps.basic_salary,
			ps.gross_salary,
			ps.ssnit_1,
			ps.ssnit_2,
			ps.income_tax
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		$this->db->order_by('staff_name', 'ASC');
		$results = $this->db->get()->result_array();
		
		// Generate SSNIT Tier 1 data (13.5% of BASIC salary, NOT gross)
		$tier1_data = [];
		foreach ($results as $row) {
			$tier1_contribution = $row['basic_salary'] * 0.135;
			$tier1_data[] = [
				'staff_name' => $row['staff_name'],
				'ssnit_number' => $row['ssnit_number'],
				'basic_salary' => number_format($row['basic_salary'], 2, '.', ''),
				'tier1_contribution' => number_format($tier1_contribution, 2, '.', '')
			];
		}
		
		// Generate SSNIT Tier 2 data (5% of BASIC salary, NOT gross)
		$tier2_data = [];
		foreach ($results as $row) {
			$tier2_contribution = $row['basic_salary'] * 0.05;
			$tier2_data[] = [
				'staff_name' => $row['staff_name'],
				'ssnit_number' => $row['ssnit_number'],
				'basic_salary' => number_format($row['basic_salary'], 2, '.', ''),
				'tier2_contribution' => number_format($tier2_contribution, 2, '.', '')
			];
		}
		
		// Generate PAYE data
		$paye_data = [];
		foreach ($results as $row) {
			// Taxable income = Gross - SSNIT Tier 1 - SSNIT Tier 2 (based on BASIC salary, NOT gross)
			$ssnit_total = ($row['basic_salary'] * 0.135) + ($row['basic_salary'] * 0.05);
			$taxable_income = $row['gross_salary'] - $ssnit_total;
			
			$paye_data[] = [
				'staff_name' => $row['staff_name'],
				'tin' => $row['tin'],
				'gross_salary' => number_format($row['gross_salary'], 2, '.', ''),
				'taxable_income' => number_format($taxable_income, 2, '.', ''),
				'paye_tax' => number_format($row['income_tax'], 2, '.', '')
			];
		}
		
		echo json_encode([
			'success' => true,
			'data' => [
				'tier1' => $tier1_data,
				'tier2' => $tier2_data,
				'paye' => $paye_data,
				'school_info' => [
					'name' => $school_name,
					'ssnit_number' => $school_ssnit,
					'tin' => $school_tin
				]
			]
		]);
	}
	
	/**
	 * Task 14.6: Export statutory report to Excel
	 * 
	 * Exports selected statutory report to CSV/Excel
	 * Requirements: 18.9, 18.10
	 */
	public function export_statutory_report_excel() {
		$type = $this->input->get('type'); // tier1, tier2, or paye
		$month = $this->input->get('month');
		$year = $this->input->get('year');
		
		// Get school information
		$school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
		$school_ssnit = $this->db->get_where('settings', ['type' => 'school_ssnit_number'])->row()->description ?? 'N/A';
		$school_tin = $this->db->get_where('settings', ['type' => 'school_tin'])->row()->description ?? 'N/A';
		
		// Get payroll data
		$this->db->select('
			COALESCE(t.name, a.name, nts.name) as staff_name,
			COALESCE(t.ssnit_number, a.ssnit_number, nts.ssnit_number) as ssnit_number,
			COALESCE(t.tin, a.tin, nts.tin) as tin,
			ps.basic_salary,
			ps.gross_salary,
			ps.income_tax
		');
		$this->db->from('pay_salary ps');
		$this->db->join('teacher t', 'ps.employee_code = t.teacher_code AND ps.employment_category = "teacher"', 'left');
		$this->db->join('admin a', 'ps.employee_code = a.admin_code AND ps.employment_category = "administrator"', 'left');
		$this->db->join('non_teaching_staff nts', 'ps.employee_code = nts.staff_code AND ps.employment_category = "non_teaching_staff"', 'left');
		$this->db->where('ps.month', $month);
		$this->db->where('ps.year', $year);
		$this->db->order_by('staff_name', 'ASC');
		$results = $this->db->get()->result_array();
		
		$month_name = date('F', mktime(0, 0, 0, $month, 1));
		
		// Set headers
		header('Content-Type: text/csv');
		
		if ($type === 'tier1') {
			header('Content-Disposition: attachment; filename="SSNIT_Tier1_' . $month_name . '_' . $year . '.csv"');
			$output = fopen('php://output', 'w');
			
			// School info
			fputcsv($output, ['SSNIT Tier 1 Contribution Report (13.5%)']);
			fputcsv($output, ['School Name:', $school_name]);
			fputcsv($output, ['SSNIT Number:', $school_ssnit]);
			fputcsv($output, ['Period:', $month_name . ' ' . $year]);
			fputcsv($output, []);
			
			// Headers
			fputcsv($output, ['Staff Name', 'SSNIT Number', 'Basic Salary (GH¢)', 'Tier 1 Contribution (GH¢)']);
			
			// Data (FIXED: Tier 1 calculated on BASIC salary, NOT gross)
			$total_basic = 0;
			$total_contribution = 0;
			foreach ($results as $row) {
				$contribution = $row['basic_salary'] * 0.135;
				$total_basic += $row['basic_salary'];
				$total_contribution += $contribution;
				
				fputcsv($output, [
					$row['staff_name'],
					$row['ssnit_number'],
					number_format($row['basic_salary'], 2),
					number_format($contribution, 2)
				]);
			}
			
			// Totals
			fputcsv($output, []);
			fputcsv($output, ['TOTAL', '', number_format($total_basic, 2), number_format($total_contribution, 2)]);
			
		} else if ($type === 'tier2') {
			header('Content-Disposition: attachment; filename="SSNIT_Tier2_' . $month_name . '_' . $year . '.csv"');
			$output = fopen('php://output', 'w');
			
			// School info
			fputcsv($output, ['SSNIT Tier 2 Contribution Report (5%)']);
			fputcsv($output, ['School Name:', $school_name]);
			fputcsv($output, ['SSNIT Number:', $school_ssnit]);
			fputcsv($output, ['Period:', $month_name . ' ' . $year]);
			fputcsv($output, []);
			
			// Headers
			fputcsv($output, ['Staff Name', 'SSNIT Number', 'Basic Salary (GH¢)', 'Tier 2 Contribution (GH¢)']);
			
			// Data (FIXED: Tier 2 calculated on BASIC salary, NOT gross)
			$total_basic = 0;
			$total_contribution = 0;
			foreach ($results as $row) {
				$contribution = $row['basic_salary'] * 0.05;
				$total_basic += $row['basic_salary'];
				$total_contribution += $contribution;
				
				fputcsv($output, [
					$row['staff_name'],
					$row['ssnit_number'],
					number_format($row['basic_salary'], 2),
					number_format($contribution, 2)
				]);
			}
			
			// Totals
			fputcsv($output, []);
			fputcsv($output, ['TOTAL', '', number_format($total_basic, 2), number_format($total_contribution, 2)]);
			
		} else if ($type === 'paye') {
			header('Content-Disposition: attachment; filename="PAYE_Report_' . $month_name . '_' . $year . '.csv"');
			$output = fopen('php://output', 'w');
			
			// School info
			fputcsv($output, ['PAYE Tax Report']);
			fputcsv($output, ['School Name:', $school_name]);
			fputcsv($output, ['TIN:', $school_tin]);
			fputcsv($output, ['Period:', $month_name . ' ' . $year]);
			fputcsv($output, []);
			
			// Headers
			fputcsv($output, ['Staff Name', 'TIN', 'Gross Salary (GH¢)', 'Taxable Income (GH¢)', 'PAYE Tax (GH¢)']);
			
			// Data (FIXED: SSNIT calculated on BASIC salary, NOT gross)
			$total_gross = 0;
			$total_taxable = 0;
			$total_tax = 0;
			foreach ($results as $row) {
				$ssnit_total = ($row['basic_salary'] * 0.135) + ($row['basic_salary'] * 0.05);
				$taxable_income = $row['gross_salary'] - $ssnit_total;
				
				$total_gross += $row['gross_salary'];
				$total_taxable += $taxable_income;
				$total_tax += $row['income_tax'];
				
				fputcsv($output, [
					$row['staff_name'],
					$row['tin'],
					number_format($row['gross_salary'], 2),
					number_format($taxable_income, 2),
					number_format($row['income_tax'], 2)
				]);
			}
			
			// Totals
			fputcsv($output, []);
			fputcsv($output, ['TOTAL', '', number_format($total_gross, 2), number_format($total_taxable, 2), number_format($total_tax, 2)]);
		}
		
		fclose($output);
		exit;
	}

	// Get students by class for receipts filter
	public function get_students_by_class_json($class_id = '') {
		if (empty($class_id)) {
			echo json_encode(array());
			return;
		}
		$this->load->view('backend/admin/get_students_by_class_json', true);
	}

	function transport_student_unassign($transport_id, $student_id) {
		 $running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		 $running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		 $this->db->where('student_id', $student_id);
		 $this->db->where('year', $running_year);
		 $this->db->where('term', $running_term);
		 $this->db->update('enroll', array('transport_id' => NULL));
		
		echo json_encode(array('status' => 'success', 'message' => get_phrase('student_unassigned_successfully')));
	}
	
	function transport_student_reassign($from_transport_id, $student_id, $to_transport_id) {
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		$this->db->where('student_id', $student_id);
		$this->db->where('year', $running_year);
		$this->db->where('term', $running_term);
		$this->db->update('enroll', array('transport_id' => $to_transport_id));

		echo json_encode(array('status' => 'success', 'message' => get_phrase('student_reassigned_successfully')));
	}

	///////ATTENDANCE BILLING CONTROLLER METHODS////////

	// Process bulk payment
	public function process_bulk_payment() {
		$student_ids = $this->input->post('student_ids'); // array
		$feeding_amount = $this->input->post('feeding_amount');
		$classes_amount = $this->input->post('classes_amount');
		// Transport is now recorded in daily_fee_transactions table
		$timestamp = $this->input->post('timestamp');
		$class_id = $this->input->post('class_id');
		$section_id = $this->input->post('section_id');

		foreach($student_ids as $student_id) {
			// Update feeding_fee_payment table
			$this->db->where('student_id', $student_id);
			$this->db->where('timestamp', $timestamp);
			$this->db->where('class_id', $class_id);

			$current = $this->db->get('daily_fee_wallet')->row();

			$new_feeding_due = $current->due - $feeding_amount;
			$new_classes_due = $current->cdue - $classes_amount;

			$this->db->where('student_id', $student_id);
			$this->db->where('timestamp', $timestamp);
			$this->db->update('daily_fee_wallet', array(
				'feeding_paid' => $current->feeding_paid + $feeding_amount,
				'classes_paid' => $current->classes_paid + $classes_amount,
				'due' => $new_feeding_due,
				'cdue' => $new_classes_due
			));

			// Legacy transport_fare_payment table update - DISABLED (using daily_fee_transactions now)
			/*
			if($transport_amount > 0) {
				$this->db->where('student_id', $student_id);
				$this->db->where('timestamp', $timestamp);
				$transport_current = $this->db->get('daily_fee_wallet')->row();

				if($transport_current) {
					$new_transport_due = $transport_current->due - $transport_amount;
					$this->db->where('student_id', $student_id);
					$this->db->where('timestamp', $timestamp);
					$this->db->update('daily_fee_wallet', array(
						'paid' => $transport_current->paid + $transport_amount,
						'due' => $new_transport_due
					));
				}
			}
			*/
		}

		echo json_encode(array('status' => 'success', 'message' => 'Bulk payment processed successfully'));
	}



	// Get student billing info for display
	public function get_student_billing_info() {
		$student_id = $this->input->post('student_id');
		$timestamp = $this->input->post('timestamp');
		$class_id = $this->input->post('class_id');

		$billing = $this->db->get_where('daily_fee_wallet', array(
			'student_id' => $student_id,
			'timestamp' => $timestamp,
			'class_id' => $class_id
		))->row();

		if($billing) {
			$benefit = $this->crud_model->get_student_benefit_category($student_id);
			$benefit_name = $benefit ? $benefit->category_name : 'None';

			echo json_encode(array(
				'status' => 'success',
				'feeding_charged' => $billing->feeding_charged,
				'classes_charged' => $billing->classes_charged,
				'feeding_due' => $billing->due,
				'classes_due' => $billing->cdue,
				'benefit_category' => $benefit_name
			));
		} else {
			echo json_encode(array('status' => 'error', 'message' => 'No billing record found'));
		}
	}


	// Drive List - Get students owing by type
	public function get_drive_list($type = '') {
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		$class_filter = $this->input->get('class_filter');
		
		$html = '';
		$classes_data = array();
		
		if($type == 'invoices') {
			$this->db->select('SUM(invoice.amount) as total_amount, student.student_id, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('invoice');
			$this->db->join('student', 'student.student_id = invoice.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = "' . $running_year . '" AND enroll.term = "' . $running_term . '"');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('invoice.status', 'unpaid');
			
			// Add class filter if provided
			if(!empty($class_filter)) {
				$this->db->where('class.class_id', $class_filter);
			}
			
			$this->db->group_by('student.student_id, class.class_id, section.section_id');
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$invoices = $this->db->get()->result_array();
			
			foreach($invoices as $invoice) {
				$class_key = $invoice['class_name'] . ' ' . $invoice['name_numeric'] . $invoice['section_name'];
				if(!isset($classes_data[$class_key])) {
					$classes_data[$class_key] = array('students' => array(), 'total' => 0);
				}
				$classes_data[$class_key]['students'][] = array(
					'name' => $invoice['student_name'],
					'amount' => $invoice['total_amount']
				);
				$classes_data[$class_key]['total'] += $invoice['total_amount'];
			}
			$title = 'Billed Invoices';
			$color = 'blue';
			
		} elseif($type == 'feeding') {
			$this->db->select('daily_fee_wallet.feeding_arrears as total_amount, student.student_id, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = daily_fee_wallet.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = "' . $running_year . '" AND enroll.term = "' . $running_term . '"');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('daily_fee_wallet.feeding_arrears >', 0);
			$this->db->where('daily_fee_wallet.year', $running_year);
			$this->db->where('daily_fee_wallet.term', $running_term);
			
			// Add class filter if provided
			if(!empty($class_filter)) {
				$this->db->where('class.class_id', $class_filter);
			}
			
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) {
					$classes_data[$class_key] = array('students' => array(), 'total' => 0);
				}
				$classes_data[$class_key]['students'][] = array(
					'name' => $fee['student_name'],
					'amount' => $fee['total_amount']
				);
				$classes_data[$class_key]['total'] += $fee['total_amount'];
			}
			$title = 'Feeding Fee';
			$color = 'green';
			
		} elseif($type == 'classes') {
			$this->db->select('daily_fee_wallet.classes_arrears as total_amount, student.student_id, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = daily_fee_wallet.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = "' . $running_year . '" AND enroll.term = "' . $running_term . '"');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('daily_fee_wallet.classes_arrears >', 0);
			$this->db->where('daily_fee_wallet.year', $running_year);
			$this->db->where('daily_fee_wallet.term', $running_term);
			
			// Add class filter if provided
			if(!empty($class_filter)) {
				$this->db->where('class.class_id', $class_filter);
			}
			
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) {
					$classes_data[$class_key] = array('students' => array(), 'total' => 0);
				}
				$classes_data[$class_key]['students'][] = array(
					'name' => $fee['student_name'],
					'amount' => $fee['total_amount']
				);
				$classes_data[$class_key]['total'] += $fee['total_amount'];
			}
			$title = 'Classes Fee';
			$color = 'purple';
			
		} elseif($type == 'transport') {
			$this->db->select('daily_fee_wallet.transport_arrears as total_amount, student.student_id, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = daily_fee_wallet.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = "' . $running_year . '" AND enroll.term = "' . $running_term . '"');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('daily_fee_wallet.transport_arrears >', 0);
			$this->db->where('daily_fee_wallet.year', $running_year);
			$this->db->where('daily_fee_wallet.term', $running_term);
			
			// Add class filter if provided
			if(!empty($class_filter)) {
				$this->db->where('class.class_id', $class_filter);
			}
			
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) {
					$classes_data[$class_key] = array('students' => array(), 'total' => 0);
				}
				$classes_data[$class_key]['students'][] = array(
					'name' => $fee['student_name'],
					'amount' => $fee['total_amount']
				);
				$classes_data[$class_key]['total'] += $fee['total_amount'];
			}
			$title = 'Transport Fare';
			$color = 'orange';
			
		} elseif($type == 'water') {
			$this->db->select('daily_fee_wallet.water_arrears as total_amount, student.student_id, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = daily_fee_wallet.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = "' . $running_year . '" AND enroll.term = "' . $running_term . '"');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('daily_fee_wallet.water_arrears >', 0);
			$this->db->where('daily_fee_wallet.year', $running_year);
			$this->db->where('daily_fee_wallet.term', $running_term);
			
			// Add class filter if provided
			if(!empty($class_filter)) {
				$this->db->where('class.class_id', $class_filter);
			}
			
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) {
					$classes_data[$class_key] = array('students' => array(), 'total' => 0);
				}
				$classes_data[$class_key]['students'][] = array(
					'name' => $fee['student_name'],
					'amount' => $fee['total_amount']
				);
				$classes_data[$class_key]['total'] += $fee['total_amount'];
			}
			$title = 'Water Fee';
			$color = 'cyan';
			
		} elseif($type == 'breakfast') {
			$this->db->select('daily_fee_wallet.breakfast_arrears as total_amount, student.student_id, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = daily_fee_wallet.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = "' . $running_year . '" AND enroll.term = "' . $running_term . '"');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('daily_fee_wallet.breakfast_arrears >', 0);
			$this->db->where('daily_fee_wallet.year', $running_year);
			$this->db->where('daily_fee_wallet.term', $running_term);
			
			// Add class filter if provided
			if(!empty($class_filter)) {
				$this->db->where('class.class_id', $class_filter);
			}
			
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) {
					$classes_data[$class_key] = array('students' => array(), 'total' => 0);
				}
				$classes_data[$class_key]['students'][] = array(
					'name' => $fee['student_name'],
					'amount' => $fee['total_amount']
				);
				$classes_data[$class_key]['total'] += $fee['total_amount'];
			}
			$title = 'Breakfast Fee';
			$color = 'yellow';
			
		} else {
			echo json_encode(array('status' => 'error', 'message' => 'Invalid type'));
			return;
		}
		
		if(empty($classes_data)) {
			$html = '<div class="text-center py-8"><div class="text-gray-500 text-lg"><i class="fa fa-check-circle text-green-500 text-4xl mb-3"></i><p>' . get_phrase('no_students_owing') . '</p></div></div>';
		} else {
			$html .= '<div class="mt-6"><h4 class="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-' . $color . '-500">' . get_phrase($title) . ' - ' . get_phrase('class_based_list') . '</h4>';
			
			foreach($classes_data as $class_name => $data) {
				$html .= '<div class="mb-6 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">';
				$html .= '<div class="bg-gradient-to-r from-' . $color . '-500 to-' . $color . '-600 px-4 py-3 flex justify-between items-center">';
				$html .= '<h5 class="text-lg font-bold text-white">' . $class_name . '</h5>';
				$html .= '<span class="bg-white text-' . $color . '-700 px-3 py-1 rounded-full text-sm font-bold">' . count($data['students']) . ' ' . get_phrase('students') . '</span>';
				$html .= '</div>';
				$html .= '<div class="p-4"><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200">';
				$html .= '<thead class="bg-gray-50"><tr><th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">#</th><th class="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">' . get_phrase('student_name') . '</th><th class="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">' . get_phrase('amount_owed') . '</th></tr></thead>';
				$html .= '<tbody class="bg-white divide-y divide-gray-200">';
				
				$counter = 1;
				foreach($data['students'] as $student) {
					$html .= '<tr class="hover:bg-gray-50">';
					$html .= '<td class="px-4 py-3 text-sm text-gray-600">' . $counter++ . '</td>';
					$html .= '<td class="px-4 py-3 text-sm font-medium text-gray-900">' . $student['name'] . '</td>';
					$html .= '<td class="px-4 py-3 text-sm font-bold text-right text-red-600">GHC ' . number_format($student['amount'], 2) . '</td>';
					$html .= '</tr>';
				}
				
				$html .= '<tr class="bg-' . $color . '-50 font-bold"><td colspan="2" class="px-4 py-3 text-sm text-gray-900 text-right">' . get_phrase('total') . ':</td><td class="px-4 py-3 text-sm text-right text-' . $color . '-700">GHC ' . number_format($data['total'], 2) . '</td></tr>';
				$html .= '</tbody></table></div></div></div>';
			}
			
			$html .= '</div>';
		}
		
		echo json_encode(array('status' => 'success', 'html' => $html, 'has_data' => !empty($classes_data)));
	}

	public function export_drive_list($type = '', $format = 'excel') {
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		$classes_data = array();
		
		if($type == 'invoices') {
			$this->db->select('invoice.*, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('invoice');
			$this->db->join('student', 'student.student_id = invoice.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = invoice.year');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('invoice.status', 'unpaid');
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$invoices = $this->db->get()->result_array();
			foreach($invoices as $invoice) {
				$class_key = $invoice['class_name'] . ' ' . $invoice['name_numeric'] . $invoice['section_name'];
				if(!isset($classes_data[$class_key])) $classes_data[$class_key] = array('students' => array(), 'total' => 0);
				$classes_data[$class_key]['students'][] = array('name' => $invoice['student_name'], 'amount' => $invoice['amount']);
				$classes_data[$class_key]['total'] += $invoice['amount'];
			}
			$title = 'Billed Invoices';
		} elseif($type == 'feeding') {
			$this->db->select('feeding_fee_payment.*, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = feeding_fee_payment.student_id');
			$this->db->join('class', 'class.class_id = feeding_fee_payment.class_id');
			$this->db->join('section', 'section.section_id = feeding_fee_payment.section_id');
			$this->db->where('feeding_fee_payment.year', $running_year);
			$this->db->where('feeding_fee_payment.term', $running_term);
			$this->db->where('feeding_fee_payment.due >', 0);
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) $classes_data[$class_key] = array('students' => array(), 'total' => 0);
				$classes_data[$class_key]['students'][] = array('name' => $fee['student_name'], 'amount' => $fee['due']);
				$classes_data[$class_key]['total'] += $fee['due'];
			}
			$title = 'Feeding Fee';
		} elseif($type == 'classes') {
			$this->db->select('feeding_fee_payment.*, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = feeding_fee_payment.student_id');
			$this->db->join('class', 'class.class_id = feeding_fee_payment.class_id');
			$this->db->join('section', 'section.section_id = feeding_fee_payment.section_id');
			$this->db->where('feeding_fee_payment.year', $running_year);
			$this->db->where('feeding_fee_payment.term', $running_term);
			$this->db->where('feeding_fee_payment.cdue >', 0);
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) $classes_data[$class_key] = array('students' => array(), 'total' => 0);
				$classes_data[$class_key]['students'][] = array('name' => $fee['student_name'], 'amount' => $fee['cdue']);
				$classes_data[$class_key]['total'] += $fee['cdue'];
			}
			$title = 'Classes Fee';
		} elseif($type == 'transport') {
			$this->db->select('amount.*, student.name as student_name, class.name as class_name, class.name_numeric, section.name as section_name');
			$this->db->from('daily_fee_wallet');
			$this->db->join('student', 'student.student_id = transport_fare_payment.student_id');
			$this->db->join('enroll', 'enroll.student_id = student.student_id AND enroll.year = transport_fare_payment.year AND enroll.term = transport_fare_payment.term');
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->join('section', 'section.section_id = enroll.section_id');
			$this->db->where('transport_fare_payment.year', $running_year);
			$this->db->where('transport_fare_payment.term', $running_term);
			$this->db->where('transport_fare_payment.due >', 0);
			$this->db->order_by('class.name', 'ASC');
			$this->db->order_by('class.name_numeric', 'ASC');
			$fees = $this->db->get()->result_array();
			foreach($fees as $fee) {
				$class_key = $fee['class_name'] . ' ' . $fee['name_numeric'] . $fee['section_name'];
				if(!isset($classes_data[$class_key])) $classes_data[$class_key] = array('students' => array(), 'total' => 0);
				$classes_data[$class_key]['students'][] = array('name' => $fee['student_name'], 'amount' => $fee['due']);
				$classes_data[$class_key]['total'] += $fee['due'];
			}
			$title = 'Transport Fare';
		}

		if($format == 'excel') {
			header('Content-Type: application/vnd.ms-excel');
			header('Content-Disposition: attachment;filename="drive_list_' . $type . '_' . date('Y-m-d') . '.xls"');
			echo '<html><head><meta charset="UTF-8"></head><body>';
			echo '<h2>' . $title . ' - Students Owing</h2>';
			echo '<p>Year: ' . $running_year . ' | Term: ' . $running_term . '</p>';
			foreach($classes_data as $class_name => $data) {
				echo '<h3>' . $class_name . '</h3>';
				echo '<table border="1" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">';
				echo '<tr style="background-color: #667eea; color: white; font-weight: bold;"><th style="padding: 10px;">#</th><th style="padding: 10px;">Student Name</th><th style="padding: 10px;">Amount Owed</th></tr>';
				$counter = 1;
				foreach($data['students'] as $student) {
					echo '<tr><td style="padding: 8px;">' . $counter++ . '</td><td style="padding: 8px;">' . $student['name'] . '</td><td style="padding: 8px; text-align: right;">GH? ' . number_format($student['amount'], 2) . '</td></tr>';
				}
				echo '<tr style="background-color: #f0f0f0; font-weight: bold;"><td colspan="2" style="padding: 8px; text-align: right;">Total:</td><td style="padding: 8px; text-align: right;">GH? ' . number_format($data['total'], 2) . '</td></tr>';
				echo '</table>';
			}
			echo '</body></html>';
		} elseif($format == 'pdf') {
			$this->load->library('pdf');
			$html = '<h2>' . $title . ' - Students Owing</h2>';
			$html .= '<p>Year: ' . $running_year . ' | Term: ' . $running_term . '</p>';
			foreach($classes_data as $class_name => $data) {
				$html .= '<h3>' . $class_name . '</h3>';
				$html .= '<table border="1" cellpadding="5" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">';
				$html .= '<tr style="background-color: #667eea; color: white;"><th>#</th><th>Student Name</th><th>Amount Owed</th></tr>';
				$counter = 1;
				foreach($data['students'] as $student) {
					$html .= '<tr><td>' . $counter++ . '</td><td>' . $student['name'] . '</td><td style="text-align: right;">GH? ' . number_format($student['amount'], 2) . '</td></tr>';
				}
				$html .= '<tr style="background-color: #f0f0f0; font-weight: bold;"><td colspan="2" style="text-align: right;">Total:</td><td style="text-align: right;">GH? ' . number_format($data['total'], 2) . '</td></tr>';
				$html .= '</table>';
			}
			$this->pdf->loadHtml($html);
			$this->pdf->render();
			$this->pdf->stream('drive_list_' . $type . '_' . date('Y-m-d') . '.pdf');
		}
	}

	public function drive_list_page() {
		$page_data['page_name'] = 'drive_list_page';
		$page_data['page_title'] = get_phrase('drive_list_-_students_owing');
		$this->load->view('backend/main', $page_data);
	}

	//assessment graph
	function assessment_graph($param1 = "") {

		if ($param1 == 'generate') {
			$errors = [];
			$ajaxMessage = [];

			$pageData['class_id'] = $this->input->post('search_by_class');
			$pageData['student_id'] = $this->input->post('search_by_student');
			$pageData['graph_type'] = $this->input->post('search_by_type');
			$pageData['view_type'] = $this->input->post('search_by_view');
			$pageData['subject_id'] = $this->input->post('search_by_subject');

			if ($pageData['class_id'] == '') {
				$errors['class_error'] = "Class is required";
			}
			if ($pageData['student_id'] == '') {
				$errors['student_error'] = "Student is required";
			}
			if ($pageData['subject_id'] == '') {
				$errors['subject_error'] = "subject is required";
			}

			if (!empty($errors)) {
				//error occured
				echo json_encode($errors);
				return false;

			} else {
				//no error occured
				$pageData['data_source'] = $this->input->post('search_by_data_source');
				if ($pageData['data_source'] == 1) {
					//portfolio assessment selected so get start and end weeks
					$pageData['start_week'] = $this->input->post('start_week');
					$pageData['end_week'] = $this->input->post('end_week');

					if ($pageData['student_id'] == '0' && $pageData['subject_id'] != '0') {
						//all students for a single subject
						$pageData['data'] = $this->graphassessment_model->getPortfolioAssessmentData(
							$pageData['class_id'],
							$pageData['student_id'],
							$pageData['subject_id'],
							$pageData['start_week'],
							$pageData['end_week'],
							'student_name'
						);

						$pageData['page_name'] = 'assessment_graph/assessment_graph_view_all_students_single_subject';

					} else if ($pageData['subject_id'] == '0' && $pageData['student_id'] != '0') {
						//all subjects for a single student
						$pageData['data'] = $this->graphassessment_model->getPortfolioAssessmentData(
							$pageData['class_id'],
							$pageData['student_id'],
							$pageData['subject_id'],
							$pageData['start_week'],
							$pageData['end_week'],
							'subject_name',
						);

						$pageData['page_name'] = 'assessment_graph/assessment_graph_view_all_subjects_single_student';

					} else if ($pageData['student_id'] == '0' && $pageData['subject_id'] == '0') {

						/*//all subjects for all student
							$pageData['data'] = $this->graphassessment_model->getPortfolioAssessmentData(
								$pageData['class_id'],
								$pageData['student_id'],
								$pageData['subject_id'],
								$pageData['start_week'],
								$pageData['end_week'],
								'',
								'no'
						*/

						$pageData['page_name'] = 'assessment_graph/assessment_graph_view_all_subjects_all_student';

					} else {
						//single subject for single student
						$pageData['data'] = $this->graphassessment_model->getPortfolioAssessmentData(
							$pageData['class_id'],
							$pageData['student_id'],
							$pageData['subject_id'],
							$pageData['start_week'],
							$pageData['end_week'],
							'',
							'yes'
						);

						$pageData['page_name'] = 'assessment_graph/assessment_graph_view_single_subject_single_student';

					}

				} else {
					//terminal exams selected so get the term and year
					$pageData['term'] = $this->input->post('search_by_term');
					$pageData['year'] = $this->input->post('search_by_year');
				}

				$ajaxMessage['data'] = $this->load->view('backend/admin/' . $pageData['page_name'], $pageData, true);

				$ajaxMessage['message'] = 'success';
				echo json_encode($ajaxMessage);
				return false;
			}

		} else {

			$pageData['page_title'] = 'ASSESSMENT GRAPH VIEW';
			$pageData['page_name'] = 'assessment_graph/assessment_graph';
			$this->load->view('backend/main', $pageData);
		}

	}

	function getAllPortfolioAssessmentStudentsData($class_id = '', $week = '') {

		$this->graphassessment_model->getAllStudentsData($class_id, $week);
	}

	function fee_collection() {
		if ($this->session->userdata('admin_login') != 1) redirect(site_url('login'), 'refresh');
		$page_data['page_name'] = 'fee_collection';
		$page_data['page_title'] = get_phrase('fee_collection');
		$this->load->view('backend/main', $page_data);
	}

	function search_student_for_fees() {
		$search_term = $this->input->post('search_term');
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		
		// Get students with their latest enrollment and outstanding fees
		$sql = "SELECT 
					s.student_id, 
					s.name, 
					s.student_code, 
					e.class_id,
					(SELECT SUM(i.due) 
					 FROM invoice i 
					 WHERE i.student_id = s.student_id 
					 AND i.due > 0 
					 AND i.can_delete != 'trash') as total_due
				FROM student s
				INNER JOIN enroll e ON s.student_id = e.student_id
				WHERE e.year = ?
				AND e.mute = '0'
				AND e.enroll_id = (
					SELECT MAX(enroll_id) 
					FROM enroll 
					WHERE student_id = s.student_id 
					AND year = ?
					AND mute = '0'
				)
				AND (s.name LIKE ? OR s.student_code LIKE ?)
				AND EXISTS (
					SELECT 1 FROM invoice i2 
					WHERE i2.student_id = s.student_id 
					AND i2.due > 0 
					AND i2.can_delete != 'trash'
				)
				LIMIT 10";
		
		$search_pattern = '%' . $search_term . '%';
		$query = $this->db->query($sql, array($running_year, $running_year, $search_pattern, $search_pattern));
		$students = $query->result_array();
		
		foreach($students as &$student) {
			$student['class_name'] = $this->crud_model->getFullClassName($student['class_id']);
			$student['total_due'] = number_format($student['total_due'], 2, '.', '');
		}
		
		echo json_encode(['success' => true, 'students' => $students]);
	}

	function search_all_students() {
		$search_term = $this->input->post('search_term');
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		
		// Search ALL students (not just those with outstanding fees) - for student ledger
		$sql = "SELECT 
					s.student_id, 
					s.name, 
					s.student_code, 
					e.class_id,
					(SELECT SUM(i.due) 
					 FROM invoice i 
					 WHERE i.student_id = s.student_id 
					 AND i.due > 0 
					 AND i.can_delete != 'trash') as total_due
				FROM student s
				INNER JOIN enroll e ON s.student_id = e.student_id
				WHERE e.year = ?
				AND e.mute = '0'
				AND e.enroll_id = (
					SELECT MAX(enroll_id) 
					FROM enroll 
					WHERE student_id = s.student_id 
					AND year = ?
					AND mute = '0'
				)
				AND (s.name LIKE ? OR s.student_code LIKE ?)
				LIMIT 10";
		
		$search_pattern = '%' . $search_term . '%';
		$query = $this->db->query($sql, array($running_year, $running_year, $search_pattern, $search_pattern));
		$students = $query->result_array();
		
		foreach($students as &$student) {
			$student['class_name'] = $this->crud_model->getFullClassName($student['class_id']);
			$student['total_due'] = $student['total_due'] ? number_format($student['total_due'], 2, '.', '') : '0.00';
		}
		
		echo json_encode(['status' => 'success', 'students' => $students]);
	}

	function get_student_outstanding_fees() {
		$student_id = $this->input->post('student_id');
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		$student = $this->db->get_where('student', array('student_id' => $student_id))->row();
		$enroll = $this->db->get_where('enroll', array('student_id' => $student_id, 'year' => $running_year))->row();
		
		$class_info = $this->db->get_where('class', array('class_id' => $enroll->class_id))->row();
		$feeding_fee = $class_info->feeding_fee ?? 0;
		$classes_fee = $class_info->classes_fee ?? 0;
		
		$this->db->select_sum('due');
		$this->db->where('student_id', $student_id);
		$this->db->where('year', $running_year);
		$this->db->where('term', $running_term);
		$feeding_owing_base = $this->db->get('daily_fee_wallet')->row()->due ?? 0;
		
		$this->db->select_sum('due');
		$this->db->where('student_id', $student_id);
		$this->db->where('year', $running_year);
		$this->db->where('term', $running_term);
		$classes_owing_base = $this->db->get('daily_fee_wallet')->row()->due ?? 0;
		
		$this->db->select_sum('due');
		$this->db->where('student_id', $student_id);
		$this->db->where('year', $running_year);
		$this->db->where('term', $running_term);
		$transport_owing_base = $this->db->get('daily_fee_wallet')->row()->due ?? 0;
		
		// NEW: Use discount system instead of benefit system
		
		// Get bill category IDs
		$feeding_cat = $this->db->select('category_id')->like('name', 'feeding', 'both')->get('bill_category')->row();
		$feeding_cat_id = $feeding_cat ? $feeding_cat->category_id : NULL;
		
		$classes_cat = $this->db->select('category_id')->like('name', 'class', 'both')->get('bill_category')->row();
		$classes_cat_id = $classes_cat ? $classes_cat->category_id : NULL;
		
		// Calculate discounts using new discount system
		$feeding_discount = $this->discount_model->calculate_discount(
			$student_id,
			$enroll->class_id,
			$feeding_cat_id,
			$feeding_fee,
			$running_year,
			$running_term
		);
		
		$classes_discount = $this->discount_model->calculate_discount(
			$student_id,
			$enroll->class_id,
			$classes_cat_id,
			$classes_fee,
			$running_year,
			$running_term
		);
		
		// Get breakfast and water categories
		$breakfast_cat = $this->db->select('category_id')->like('name', 'breakfast', 'both')->get('bill_category')->row();
		$breakfast_cat_id = $breakfast_cat ? $breakfast_cat->category_id : NULL;
		
		$water_cat = $this->db->select('category_id')->like('name', 'water', 'both')->get('bill_category')->row();
		$water_cat_id = $water_cat ? $water_cat->category_id : NULL;
		
		$breakfast_fee = $class_info->breakfast_fee ?? 0;
		$water_fee = $class_info->water_fee ?? 0;
		
		// Calculate breakfast and water discounts
		$breakfast_discount = $this->discount_model->calculate_discount(
			$student_id,
			$enroll->class_id,
			$breakfast_cat_id,
			$breakfast_fee,
			$running_year,
			$running_term
		);
		
		$water_discount = $this->discount_model->calculate_discount(
			$student_id,
			$enroll->class_id,
			$water_cat_id,
			$water_fee,
			$running_year,
			$running_term
		);
		
		// Update is_beneficiary check
		$is_beneficiary = ($feeding_discount > 0 || $classes_discount > 0 || $breakfast_discount > 0 || $water_discount > 0);
		
		$feeding_fee_today = max(0, $feeding_fee - $feeding_discount);
		$classes_fee_today = max(0, $classes_fee - $classes_discount);
		$breakfast_fee_today = max(0, $breakfast_fee - $breakfast_discount);
		$water_fee_today = max(0, $water_fee - $water_discount);
		
		$transport_fee_today = 0;
		$transport_id = $enroll->transport_id ?? 0;
		if($transport_id > 0) {
			$transport_info = $this->db->get_where('transport', array('transport_id' => $transport_id))->row();
			$transport_fee_today = $transport_info->route_fare ?? 0;
		}
		
		$feeding_due = (floatval($feeding_owing_base) + floatval($feeding_fee_today));
		$classes_due = (floatval($classes_owing_base) + floatval($classes_fee_today));
		$transport_due = (floatval($transport_owing_base) + floatval($transport_fee_today));
		
		// Check if fees should be hidden (100% discount or no transport or module disabled)
		$hide_feeding = ($feeding_discount >= $feeding_fee) || !is_fee_module_enabled('feeding');
		$hide_classes = ($classes_discount >= $classes_fee) || !is_fee_module_enabled('classes');
		$hide_transport = ($transport_id == 0) || !is_fee_module_enabled('transport');
		
		$payment_date = $this->input->post('payment_date');
		$selected_timestamp = $payment_date ? strtotime($payment_date) : strtotime(date('d-m-Y'));
		$feeding_paid_today = 0;
		$classes_paid_today = 0;
		$transport_paid_today = 0;
		$feeding_owing_on_date = $feeding_due;
		$classes_owing_on_date = $classes_due;
		$transport_owing_on_date = $transport_due;
		
		$existing_feeding = $this->db->get_where('daily_fee_wallet', ['student_id' => $student_id, 'day_timestamp' => $selected_timestamp, 'year' => $running_year, 'term' => $running_term])->row();
		if($existing_feeding) {
			$feeding_paid_today = $existing_feeding->amount;
			$feeding_owing_on_date = $existing_feeding->due;
		}
		
		$existing_classes = $this->db->get_where('daily_fee_wallet', ['student_id' => $student_id, 'day_timestamp' => $selected_timestamp, 'year' => $running_year, 'term' => $running_term])->row();
		if($existing_classes) {
			$classes_paid_today = $existing_classes->amount;
			$classes_owing_on_date = $existing_classes->due;
		}
		
		$existing_transport = $this->db->get_where('daily_fee_wallet', ['student_id' => $student_id, 'day_timestamp' => $selected_timestamp, 'year' => $running_year, 'term' => $running_term])->row();
		if($existing_transport) {
			$transport_paid_today = $existing_transport->amount;
			$transport_owing_on_date = $existing_transport->due;
		}
		
		echo json_encode([
			'status' => 'success', 
			'student' => $student, 
			'class_name' => $class_info->name, 
			'class_numeric' => $class_info->name_numeric, 
			'section' => $this->db->get_where('section', array('section_id' => $enroll->section_id))->row()->name ?? '', 
			'feeding_due' => $feeding_owing_on_date, 
			'classes_due' => $classes_owing_on_date, 
			'transport_due' => $transport_owing_on_date, 
			'total_due' => $feeding_owing_on_date + $classes_owing_on_date + $transport_owing_on_date,
			'is_beneficiary' => $is_beneficiary,
			'feeding_discount' => $feeding_discount,
			'classes_discount' => $classes_discount,
			'breakfast_discount' => $breakfast_discount,
			'water_discount' => $water_discount,
			'hide_feeding' => $hide_feeding,
			'hide_classes' => $hide_classes,
			'hide_transport' => $hide_transport,
			'transport_id' => $transport_id,
			'route_fare' => $transport_fee_today,
			'feeding_paid_today' => $feeding_paid_today,
			'classes_paid_today' => $classes_paid_today,
			'transport_paid_today' => $transport_paid_today
		]);
	}

	function check_today_payment() {
		$student_id = $this->input->post('student_id');
		$payment_date = $this->input->post('payment_date');
		$timestamp = strtotime($payment_date);
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		$exists = $this->db->where('student_id', $student_id)
			->where('day_timestamp', $timestamp)
			->where('year', $running_year)
			->where('term', $running_term)
			->get('daily_fee_wallet')->num_rows() > 0;
		
		echo json_encode(['exists' => $exists]);
	}

	function save_fee_transaction() {
		$data = array(
			'student_id' => $this->input->post('student_id'),
			'fees' => json_encode($this->input->post('fees')),
			'tendered' => $this->input->post('tendered'),
			'payment_method' => $this->input->post('payment_method'),
			'payment_date' => $this->input->post('payment_date'),
			'status' => 'pending',
			'created_at' => time(),
			'created_by' => $this->session->userdata('admin_id') ?? $this->session->userdata('login_user_id')
		);
		
		if(!$this->db->table_exists('incomplete_fee_transactions')) {
			$this->db->query("CREATE TABLE incomplete_fee_transactions (
				id INT AUTO_INCREMENT PRIMARY KEY,
				student_id INT,
				fees TEXT,
				tendered DECIMAL(10,2),
				payment_method VARCHAR(50),
				payment_date VARCHAR(50),
				status VARCHAR(20),
				created_at INT,
				created_by INT
			)");
		}
		
		$this->db->insert('incomplete_fee_transactions', $data);
		echo json_encode(['status' => 'success', 'message' => get_phrase('transaction_saved_successfully')]);
	}

	function get_saved_transactions() {
		if(!$this->db->table_exists('incomplete_fee_transactions')) {
			echo json_encode(['transactions' => []]);
			return;
		}
		
		$this->db->select('incomplete_fee_transactions.*, student.name as student_name');
		$this->db->from('incomplete_fee_transactions');
		$this->db->join('student', 'student.student_id = incomplete_fee_transactions.student_id');
		$this->db->where('incomplete_fee_transactions.status', 'pending');
		$this->db->order_by('incomplete_fee_transactions.created_at', 'DESC');
		$transactions = $this->db->get()->result_array();
		
		$result = array();
		foreach($transactions as $t) {
			$fees = json_decode($t['fees'], true);
			$total = 0;
			foreach($fees as $fee) $total += $fee['amount'];
			$result[] = array(
				'id' => $t['id'],
				'student_name' => $t['student_name'],
				'date' => $t['payment_date'],
				'total' => number_format($total, 2)
			);
		}
		
		echo json_encode(['transactions' => $result]);
	}

	function load_saved_transaction() {
		$id = $this->input->post('id');
		$txn = $this->db->get_where('incomplete_fee_transactions', array('id' => $id))->row();
		
		if($txn) {
			$student_id = $txn->student_id;
			$fees = json_decode($txn->fees, true);
			
			$this->db->where('id', $id);
			$this->db->delete('incomplete_fee_transactions');
			
			$_POST['student_id'] = $student_id;
			$this->get_student_outstanding_fees();
		}
	}

	function auto_bill_students() {
		$class_id = $this->input->post('class_id');
		$section_id = $this->input->post('section_id');
		$timestamp = $this->input->post('timestamp');
		$year = $this->input->post('year');
		$term = $this->input->post('term');
		$single_student = $this->input->post('single_student');
		$class_data = $this->db->get_where('class', array('class_id' => $class_id))->row();
		$feeding_fee_payment = $class_data->feeding_fee_payment;
		$classes_fee = $class_data->classes_fee;
		if ($single_student) {
			$students = array(array('student_id' => $single_student));
		} else {
			$this->db->where('class_id', $class_id);
			$this->db->where('section_id', $section_id);
			$this->db->where('year', $year);
			$this->db->where('term', $term);
			$this->db->where('day_timestamp', $timestamp);
			$this->db->where('status', 1);
			$students = $this->db->get('attendance')->result_array();
		}
		foreach ($students as $student) {
			$student_id = $student['student_id'];
			$existing = $this->db->get_where('daily_fee_wallet', array('student_id' => $student_id, 'timestamp' => $timestamp))->num_rows();
			if ($existing == 0) {
				$this->db->where('student_id', $student_id);
				$this->db->where('day_timestamp <', $timestamp);
				$this->db->order_by('day_timestamp', 'DESC');
				$this->db->limit(1);
				$prev = $this->db->get('daily_fee_wallet')->row();
				$prev_feeding_due = $prev->due ?? 0;
				$this->db->insert('daily_fee_wallet', array('student_id' => $student_id, 'class_id' => $class_id, 'section_id' => $section_id, 'year' => $year, 'term' => $term, 'day_timestamp' => $timestamp, 'amount' => 0, 'due' => $prev_feeding_due + $feeding_fee_payment));
				
				$this->db->where('student_id', $student_id);
				$this->db->where('day_timestamp <', $timestamp);
				$this->db->order_by('day_timestamp', 'DESC');
				$this->db->limit(1);
				$prev_classes = $this->db->get('daily_fee_wallet')->row();
				$prev_classes_due = $prev_classes->due ?? 0;
				$this->db->insert('daily_fee_wallet', array('student_id' => $student_id, 'class_id' => $class_id, 'section_id' => $section_id, 'year' => $year, 'term' => $term, 'day_timestamp' => $timestamp, 'amount' => 0, 'due' => $prev_classes_due + $classes_fee));
			}
		}
		echo json_encode(['status' => 'success', 'message' => get_phrase('students_billed_successfully')]);
	}

/**
 * ENTERPRISE-GRADE: Attendance Update Method
 * Refactored to use Daily_fee_model for all fee calculations and accounting
 * 
 * Replace the existing attendance_update method in Admin.php (line 23520) with this code
 */

function attendance_update($class_id, $section_id, $timestamp) {

	$students_ids = $this->input->post('students_ids');
	$students_array = explode('-', $students_ids);
	$collect_feeding = $this->input->post('collect_feeding');
	$collect_breakfast = $this->input->post('collect_breakfast');
	$collect_classes = $this->input->post('collect_classes');
	$collect_water = $this->input->post('collect_water');
	$collect_transport = $this->input->post('collect_transport');
	
	$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
	$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
	$issuer_id = $this->session->userdata('login_user_id');
	
	// Load Daily_fee_model for enterprise-grade processing
	$counter = 0;
	foreach($students_array as $student_id) {
		// Get attendance record
		$attendance = $this->db->get_where('attendance', [
			'student_id' => $student_id, 
			'timestamp' => $timestamp, 
			'class_id' => $class_id
		])->row();
		
		if(!$attendance) continue;
		
		// Get status from form
		$status = $this->input->post('status_' . $attendance->attendance_id);
		if(!$status) continue;
		
		// Get transport status from form (in/out/both/none/pending)
		$transport_status = $this->input->post('transport_' . $attendance->attendance_id) ?? 'pending';
		
		// Update attendance status first
		$this->db->where('attendance_id', $attendance->attendance_id);
		$this->db->update('attendance', ['status' => $status]);
		
		// CRITICAL: Always process daily charges when student is marked PRESENT
		// Breakfast/water subscription handled via student preferences in database
		if($status == 1) {
			$options = ['transport_status' => $transport_status];
			
			// ALWAYS process charges - this deducts from prepaid or adds to arrears
			// This runs whether payment collection is enabled or not
			$charges = $this->Daily_fee_model->process_daily_charges(
				$student_id, 
				$timestamp, 
				$class_id, 
				$running_year, 
				$running_term, 
				null, // sem
				$options
			);
			
			// Update attendance record with calculated charges
			if($charges) {
				$this->db->where('attendance_id', $attendance->attendance_id);
				$this->db->update('attendance', [
					'feeding_charged' => $charges['feeding_charged'] ?? 0,
					'breakfast_charged' => $charges['breakfast_charged'] ?? 0,
					'classes_charged' => $charges['classes_charged'] ?? 0,
					'water_charged' => $charges['water_charged'] ?? 0,
					'transport_charged' => $charges['transport_charged'] ?? 0
				]);
			}
		}
		
		// ENTERPRISE-GRADE: Process payments with update/create logic
		if($collect_feeding || $collect_breakfast || $collect_classes || $collect_water || $collect_transport) {
			$feeding_paid = floatval($this->input->post('feeding_' . $student_id) ?? 0);
			$breakfast_paid = floatval($this->input->post('breakfast_' . $student_id) ?? 0);
			$classes_paid = floatval($this->input->post('classes_' . $student_id) ?? 0);
			$water_paid = floatval($this->input->post('water_' . $student_id) ?? 0);
			$transport_paid = floatval($this->input->post('transport_' . $student_id) ?? 0);
			$total_paid = $feeding_paid + $breakfast_paid + $classes_paid + (floatval($water_paid) + floatval($transport_paid));
			
			if($total_paid > 0) {
				// Get wallet and auto-determine payment type
				$wallet_data = $this->Daily_fee_model->get_student_wallet($student_id);
				$payment_type = $this->determine_payment_type(
					$wallet_data, 
					$feeding_paid, 
					$breakfast_paid, 
					$classes_paid, 
					$water_paid, 
					$transport_paid
				);
				
				$payment_data = [
					'student_id' => $student_id,
					'payment_date' => $timestamp,
					'feeding_amount' => $feeding_paid,
					'breakfast_amount' => $breakfast_paid,
					'classes_amount' => $classes_paid,
					'water_amount' => $water_paid,
					'transport_amount' => $transport_paid,
					'payment_type' => $payment_type,
					'payment_method' => 1, // Cash
					'collected_by' => $issuer_id,
					'collection_point' => 'attendance_portal',
					'modified_by' => $issuer_id
				];
				
				// ENTERPRISE: Check if payment already exists for this date (PREVENT DUPLICATES)
				$existing_payment = $this->db->get_where('daily_fee_transactions', [
					'student_id' => $student_id,
					'payment_date' => $timestamp
				])->row();
				
				if($existing_payment) {
					// UPDATE existing payment (editing mode)
					$result = $this->Daily_fee_model->update_payment($existing_payment->transaction_id, $payment_data);
				} else {
					// CREATE new payment
					$result = $this->Daily_fee_model->process_payment($payment_data);
				}
			}
		}
	}
	
	echo json_encode([
		'status' => 'success', 
		'message' => get_phrase('attendance_and_fees_saved_successfully')
	]);
}

// Auto-determine payment type based on wallet status
private function determine_payment_type($wallet, $feeding, $breakfast, $classes, $water, $transport) {
	$has_arrears = ($wallet['feeding_arrears'] + $wallet['breakfast_arrears'] + 
				   $wallet['classes_arrears'] + $wallet['water_arrears'] + 
				   $wallet['transport_arrears']) > 0;
	
	$total_payment = $feeding + $breakfast + $classes + (floatval($water) + floatval($transport));
	$total_arrears = $wallet['feeding_arrears'] + $wallet['breakfast_arrears'] + 
					$wallet['classes_arrears'] + $wallet['water_arrears'] + 
					$wallet['transport_arrears'];
	
	// If has arrears and payment covers or exceeds arrears, it's mixed
	if ($has_arrears && $total_payment >= $total_arrears) {
		return 'mixed';
	}
	
	// If has arrears and payment is less than arrears, it's arrears only
	if ($has_arrears && $total_payment < $total_arrears) {
		return 'arrears';
	}
	
	// If no arrears, it's advance payment
	return 'advance';
}

	function print_receipts() {
		$page_data['page_name'] = 'print_receipts';
		$page_data['page_title'] = get_phrase('print_payment_receipts');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$page_data['currency'] = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
		$this->load->view('backend/main', $page_data);
	}

	function get_print_receipts() {
		try {
			$date = $this->input->post('date');
			$item_type = $this->input->post('item_type');
			$class_id = $this->input->post('class_id');
			$student_name = $this->input->post('student_name');
			
			if(empty($date)) {
				echo json_encode(['status' => 'error', 'message' => 'Please select a date']);
				return;
			}
			
			$date_parts = explode('-', $date);
			if(count($date_parts) != 3) {
				echo json_encode(['status' => 'error', 'message' => 'Invalid date format. Please use dd-mm-yyyy']);
				return;
			}
			
			$date_timestamp = strtotime($date_parts[2].'-'.$date_parts[1].'-'.$date_parts[0]);
			if($date_timestamp === false) {
				echo json_encode(['status' => 'error', 'message' => 'Invalid date provided']);
				return;
			}
			
			$currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
			$payments = array();
			
			// Query daily fee transactions
			$this->db->select('t.*, student.name as student_name, student.student_code, enroll.class_id');
			$this->db->from('daily_fee_transactions t');
			$this->db->join('student', 'student.student_id = t.student_id');
			$this->db->join('enroll', 'enroll.student_id = t.student_id AND enroll.year = ' . $this->db->escape($this->db->get_where('settings', ['type' => 'running_year'])->row()->description));
			$this->db->join('class', 'class.class_id = enroll.class_id');
			$this->db->where('t.payment_date >=', $date_timestamp);
			$this->db->where('t.payment_date <', $date_timestamp + 86400);
			if(!empty($class_id)) $this->db->where('enroll.class_id', $class_id);
			if(!empty($student_name)) $this->db->like('student.name', $student_name);
			
			$transactions = $this->db->get()->result_array();
			
			// Expand transactions into individual fee items
			foreach($transactions as $trans) {
				if($trans['feeding_amount'] > 0 && ($item_type == 'all' || $item_type == 'Feeding Fee')) {
					$payments[] = array_merge($trans, ['title' => 'Feeding Fee', 'amount' => $trans['feeding_amount'], 'class_name' => $trans['name'], 'class_numeric' => $trans['name_numeric']]);
				}
				if($trans['classes_amount'] > 0 && ($item_type == 'all' || $item_type == 'Classes Fee')) {
					$payments[] = array_merge($trans, ['title' => 'Classes Fee', 'amount' => $trans['classes_amount'], 'class_name' => $trans['name'], 'class_numeric' => $trans['name_numeric']]);
				}
				// Transport is in daily_fee_transactions
				if($trans['breakfast_amount'] > 0 && ($item_type == 'all' || $item_type == 'Breakfast')) {
					$payments[] = array_merge($trans, ['title' => 'Breakfast', 'amount' => $trans['breakfast_amount'], 'class_name' => $trans['name'], 'class_numeric' => $trans['name_numeric']]);
				}
				if($trans['water_amount'] > 0 && ($item_type == 'all' || $item_type == 'Water')) {
					$payments[] = array_merge($trans, ['title' => 'Water', 'amount' => $trans['water_amount'], 'class_name' => $trans['name'], 'class_numeric' => $trans['name_numeric']]);
				}
			}
			
			// Sort by student name and title
			usort($payments, function($a, $b) {
				$cmp = strcmp($a['student_name'], $b['student_name']);
				return $cmp != 0 ? $cmp : strcmp($a['title'], $b['title']);
			});
			
			if(empty($payments)) {
				$filter_info = 'on '.date('l, F d, Y', $date_timestamp);
				if($item_type != 'all') $filter_info .= ' for '.$item_type;
				if(!empty($class_id)) {
					$class_info = $this->db->get_where('class', array('class_id' => $class_id))->row();
					$filter_info .= ' in '.$class_info->name.' '.$class_info->name_numeric;
				}
				if(!empty($student_name)) $filter_info .= ' for student "'.$student_name.'"';
				echo json_encode(['status' => 'warning', 'message' => 'No payment receipts found '.$filter_info]);
				return;
			}
		} catch(Exception $e) {
			echo json_encode(['status' => 'error', 'message' => 'An error occurred while loading receipts. Please try again.']);
			return;
		}
		
		$html = '<div style="font-family: Arial, sans-serif;">';
		$html .= '<div style="text-align: center; margin-bottom: 20px; border-bottom: 3px solid #3b82f6; padding-bottom: 15px;">';
		$html .= '<h2 style="margin: 0; color: #1f2937;">Payment Receipts</h2>';
		$html .= '<p style="margin: 5px 0; color: #6b7280;">Date: '.date('l, F d, Y', $date_timestamp).'</p>';
		$html .= '</div>';
		
		$current_student = '';
		foreach($payments as $payment) {
			if($current_student != $payment['student_id']) {
				if($current_student != '') $html .= '</div>';
				$current_student = $payment['student_id'];
				$html .= '<div class="student-receipt-group" style="margin-bottom: 25px; page-break-inside: avoid;" id="student_receipt_'.$payment['student_id'].'">';
				$html .= '<div style="background: #f3f4f6; padding: 10px; border-radius: 8px 8px 0 0; border-left: 4px solid #3b82f6; display: flex; justify-content: space-between; align-items: center;">';
				$html .= '<div>';
				$html .= '<h3 style="margin: 0; color: #1f2937;">'.$payment['student_name'].'</h3>';
				$html .= '<p style="margin: 5px 0; color: #6b7280; font-size: 13px;">ID: '.$payment['student_code'].' | Class: '.$payment['class_name'].' '.$payment['name_numeric'].'</p>';
				$html .= '</div>';
				$html .= '<button onclick="printStudentReceipt('.$payment['student_id'].')" class="btn-modern btn-print-student no-print" style="margin-left: 10px;" data-no-print="true"><i class="fa fa-print"></i> Print</button>';
				$html .= '</div>';
			}
			
			$balance = $payment['due'];
			$balance_color = $balance > 0 ? '#ef4444' : '#10b981';
			$balance_text = $balance > 0 ? 'Balance: '.$currency.number_format($balance, 2) : ($balance < 0 ? 'Paid In Advance' : 'Paid in Full');
			$method_map = array(1 => 'Cash', 2 => 'Cheque', 3 => 'Mobile Money', 4 => 'Bank Transfer');
			$method = isset($method_map[$payment['payment_method']]) ? $method_map[$payment['payment_method']] : 'Cash';
			
			$html .= '<div class="receipt-item" style="border: 1px solid #e5e7eb; border-top: none; padding: 15px; background: white;">';
			$html .= '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">';
			$html .= '<div><strong style="color: #3b82f6; font-size: 14px;">Receipt: '.$payment['receipt_number'].'</strong></div>';
			$html .= '<div><span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">'.$payment['title'].'</span></div>';
			$html .= '</div>';
			$html .= '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 13px;">';
			$html .= '<div><span style="color: #6b7280;">Amount Paid:</span> <strong>'.$currency.number_format($payment['amount'], 2).'</strong></div>';
			$html .= '<div><span style="color: #6b7280;">Payment Method:</span> <strong>'.$method.'</strong></div>';
			$html .= '<div><span style="color: #6b7280;">Payment Time:</span> <strong>'.date('M d, Y g:i A', $payment['payment_date']).'</strong></div>';
			$html .= '<div><span style="color: '.$balance_color.';">'.$balance_text.'</span></div>';
			$html .= '</div>';
			$html .= '</div>';
		}
		
		if($current_student != '') $html .= '</div>';
		$html .= '</div>';
		
		echo json_encode(['status' => 'success', 'html' => $html]);
	}

	function get_thermal_receipts() {
		try {
			$date = $this->input->post('date');
			$item_type = $this->input->post('item_type');
			$class_id = $this->input->post('class_id');
			$student_name = $this->input->post('student_name');
			
			log_message('debug', 'Received date: ' . $date);
			
			if(empty($date)) {
				echo json_encode(['status' => 'error', 'message' => 'Please select a date', 'debug' => 'Date received: ' . var_export($date, true)]);
				return;
			}
			
			$date_parts = explode('-', $date);
			$date_timestamp = strtotime($date_parts[2].'-'.$date_parts[1].'-'.$date_parts[0]);
			$currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
			$school_name = $this->db->get_where('settings', array('type' => 'system_name'))->row()->description;
			
			$this->db->select('t.transaction_code, t.student_id, t.payment_date, t.feeding_amount, t.breakfast_amount, t.classes_amount, t.water_amount, t.transport_amount, t.total_amount, t.receipt_number, s.name as student_name, s.student_code, c.name as class_name, c.name_numeric, sec.name as section_name, e.class_id');
			$this->db->from('daily_fee_transactions t');
			$this->db->join('student s', 's.student_id = t.student_id');
			$this->db->join('enroll e', 'e.student_id = t.student_id');
			$this->db->join('class c', 'c.class_id = e.class_id');
			$this->db->join('section sec', 'sec.section_id = e.section_id', 'left');
			$this->db->where('t.payment_date', $date_timestamp);
			if(!empty($class_id)) $this->db->where('e.class_id', $class_id);
			if(!empty($student_name)) $this->db->like('s.name', $student_name);
			$this->db->order_by('s.name', 'ASC');
			$transactions = $this->db->get()->result_array();
			
			if(empty($transactions)) {
				echo json_encode(['status' => 'warning', 'message' => 'No payment receipts found']);
				return;
			}
			
			$payments = array();
			foreach($transactions as $trans) {
				$fee_map = [
					'Feeding Fee' => $trans['feeding_amount'],
					'Breakfast Fee' => $trans['breakfast_amount'],
					'Classes Fee' => $trans['classes_amount'],
					'Water Fee' => $trans['water_amount'],
					'Transport Fare' => $trans['transport_amount']
				];
				
				foreach($fee_map as $fee_type => $amount) {
					if($amount > 0 && ($item_type == 'all' || $item_type == $fee_type)) {
						$wallet = $this->db->get_where('daily_fee_wallet', ['student_id' => $trans['student_id']])->row();
						$due_map = [
							'Feeding Fee' => $wallet ? $wallet->feeding_arrears : 0,
							'Breakfast Fee' => $wallet ? $wallet->breakfast_arrears : 0,
							'Classes Fee' => $wallet ? $wallet->classes_arrears : 0,
							'Water Fee' => $wallet ? $wallet->water_arrears : 0,
							'Transport Fare' => $wallet ? $wallet->transport_arrears : 0
						];
						
						$payments[] = [
							'student_id' => $trans['student_id'],
							'student_name' => $trans['student_name'],
							'student_code' => $trans['student_code'],
							'class_name' => $trans['class_name'],
							'name_numeric' => $trans['name_numeric'],
							'section_name' => $trans['section_name'],
							'receipt_code' => $trans['receipt_number'],
							'amount' => $amount,
							'due' => $due_map[$fee_type],
							'title' => $fee_type,
							'class_id' => $trans['class_id']
						];
					}
				}
			}
			
			usort($payments, function($a, $b) {
				$cmp = strcmp($a['student_name'], $b['student_name']);
				return $cmp != 0 ? $cmp : strcmp($a['title'], $b['title']);
			});
			
			$html = '';
			$current_student = '';
			$student_payments = array();
			$student_total = 0;
			
			foreach($payments as $payment) {
				if($current_student != $payment['student_id']) {
					if($current_student != '') {
						$html .= $this->generate_thermal_receipt($current_student_data, $student_payments, $student_total, $currency, $school_name, $date_timestamp);
					}
					$current_student = $payment['student_id'];
					$current_student_data = $payment;
					$student_payments = array();
					$student_total = 0;
				}
				$student_payments[] = $payment;
				$student_total += $payment['amount'];
			}
			
			if($current_student != '') {
				$html .= $this->generate_thermal_receipt($current_student_data, $student_payments, $student_total, $currency, $school_name, $date_timestamp);
			}
			
			echo json_encode(['status' => 'success', 'html' => $html]);
		} catch(Exception $e) {
			echo json_encode(['status' => 'error', 'message' => 'An error occurred: ' .$e->getMessage()]);
		}
	}
	
	private function generate_thermal_receipt($student_data, $payments, $total, $currency, $school_name, $date_timestamp) {
		$html = '<div class="receipt" id="student_receipt_'.$student_data['student_id'].'" style="width: 80mm; margin: 20px auto; font-family: \'Courier New\', monospace; font-size: 12px; page-break-after: always;">';
		$html .= '<div class="header" style="text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 8px;">';
		$html .= '<img src="'.base_url('uploads/school_logo.png').'" alt="School Logo" style="display: block; margin: 0 auto 5px auto; max-height: 40px;">';
		$html .= '<h3 style="font-size: 16px; margin: 3px 0;">'.strtoupper($school_name).'</h3>';
		$html .= '<p style="font-size: 10px; margin: 2px 0;">FEE PAYMENT RECEIPT</p>';
		$html .= '</div>';
		$html .= '<div class="info" style="margin: 8px 0; font-size: 11px;">';
		$html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;"><span>Date:</span><span>'.date('d M Y', $date_timestamp).'</span></div>';
		$html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;"><span>Student:</span><span>'.$student_data['student_name'].'</span></div>';
		$html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;"><span>ID:</span><span>'.$student_data['student_code'].'</span></div>';
		$html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;"><span>Class:</span><span>'.$student_data['class_name'].' '.$student_data['name_numeric'].(!empty($student_data['section_name']) ? ' - '.$student_data['section_name'] : '').'</span></div>';
		$html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;"><span>Receipt#:</span><span>'.$payments[0]['receipt_code'].'</span></div>';
		$html .= '<div style="display: flex; justify-content: space-between; margin: 3px 0;"><span>Method:</span><span>Cash</span></div>';
		$html .= '</div>';
		$html .= '<div class="divider" style="border-top: 1px dashed #000; margin: 8px 0;"></div>';
		$html .= '<div class="items" style="margin: 8px 0;">';
		foreach($payments as $p) {
			$html .= '<div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 11px;"><span>'.$p['title'].'</span><span>'.$currency.' '.number_format($p['amount'], 2).'</span></div>';
			if($p['due'] > 0) {
				$html .= '<div style="display: flex; justify-content: space-between; margin: 4px 0; font-size: 10px; color: #666;"><span>&nbsp;&nbsp;Balance Due ('.$p['title'].'):</span><span>'.$currency.' '.number_format($p['due'], 2).'</span></div>';
			}
		}
		$html .= '</div>';
		$html .= '<div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 5px;"><span>TOTAL PAID:</span><span>'.$currency.' '.number_format($total, 2).'</span></div>';
		$html .= '<div class="footer" style="text-align: center; font-size: 9px; margin-top: 10px; border-top: 1px dashed #000; padding: 8px; background: #f9fafb; border-radius: 6px;">';
		$html .= '<p>Thank you for your payment</p>';
		$html .= '<p style="color: #6b7280;">Printed: '.date('d M Y H:i').'</p>';
		$html .= '</div>';
		$html .= '</div>';
		return $html;
	}

	function export_payables_excel($fee_type, $date) {
		
		$currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		$fee_labels = ['feeding' => 'Feeding Fee', 'breakfast' => 'Breakfast Fee', 'classes' => 'Classes Fee', 'water' => 'Water Fee', 'transport' => 'Transport Fare'];
		$arrears_field = ['feeding' => 'feeding_arrears', 'breakfast' => 'breakfast_arrears', 'classes' => 'classes_arrears', 'water' => 'water_arrears', 'transport' => 'transport_arrears'];
		$field = $arrears_field[$fee_type];
		$label = $fee_labels[$fee_type];
		
		// Get students with negative arrears (advance payments)
		$this->db->select('student_id, ' . $field . ' as arrears');
		$this->db->where($field . ' <', 0);
		$this->db->order_by($field, 'ASC');
		$payables = $this->db->get('daily_fee_wallet')->result_array();

		require_once FCPATH . 'vendor/autoload.php';
		
		$spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
		$spreadsheet->setActiveSheetIndex(0);
		$sheet = $spreadsheet->getActiveSheet();
		$sheet->setCellValue('A1', $label . ' - Advance Payments')->mergeCells('A1:E1');
		$sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
		$sheet->setCellValue('A2', 'Date: ' . date('l, F d, Y', strtotime($date)))->mergeCells('A2:E2');
		$sheet->setCellValue('A4', '#')->setCellValue('B4', 'Student Code')->setCellValue('C4', 'Student Name')->setCellValue('D4', 'Class')->setCellValue('E4', 'Advance Amount');
		$sheet->getStyle('A4:E4')->getFont()->setBold(true);
		$row = 5; $total = 0;
		foreach ($payables as $index => $data) {
			$student = $this->db->get_where('student', ['student_id' => $data['student_id']])->row();
			$enroll = $this->db->get_where('enroll', ['student_id' => $data['student_id'], 'mute' => '0'])->row();
			if(!$enroll) continue;
			$class = $this->db->get_where('class', ['class_id' => $enroll->class_id])->row();
			$advance = abs($data['arrears']); $total += $advance;
			$sheet->setCellValue('A' . $row, $index + 1)->setCellValue('B' . $row, $student->student_code)->setCellValue('C' . $row, $student->name)->setCellValue('D' . $row, $class->name . ' ' . $class->name_numeric)->setCellValue('E' . $row, $currency . number_format($advance, 2));
			$row++;
		}
		$sheet->setCellValue('D' . $row, 'TOTAL:')->setCellValue('E' . $row, $currency . number_format($total, 2));
		$sheet->getStyle('D' . $row . ':E' . $row)->getFont()->setBold(true);
		foreach (range('A', 'E') as $col) $sheet->getColumnDimension($col)->setAutoSize(true);
		$filename = $label . '_Payables_' . date('Y-m-d', strtotime($date)) . '.xlsx';
		header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		header('Content-Disposition: attachment;filename="' . $filename . '"');
		header('Cache-Control: max-age=0');
		$objWriter = PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Excel2007');
		$objWriter->save('php://output');
	}

	function export_payables_pdf($fee_type, $date) { $this->print_payables($fee_type, $date); }

	function print_payables($fee_type, $date) {
		$currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		$school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
		$fee_labels = ['feeding' => 'Feeding Fee', 'breakfast' => 'Breakfast Fee', 'classes' => 'Classes Fee', 'water' => 'Water Fee', 'transport' => 'Transport Fare'];
		$arrears_field = ['feeding' => 'feeding_arrears', 'breakfast' => 'breakfast_arrears', 'classes' => 'classes_arrears', 'water' => 'water_arrears', 'transport' => 'transport_arrears'];
		$field = $arrears_field[$fee_type];
		$label = $fee_labels[$fee_type];
		
		// Get students with negative arrears (advance payments)
		$this->db->select('student_id, ' . $field . ' as arrears');
		$this->db->where($field . ' <', 0);
		$this->db->order_by($field, 'ASC');
		$payables = $this->db->get('daily_fee_wallet')->result_array();
		
		$page_data = ['school_name' => $school_name, 'label' => $label, 'date' => date('l, F d, Y', strtotime($date)), 'payables' => $payables, 'currency' => $currency, 'arrears_field' => 'arrears'];
		$this->load->view('backend/admin/payables_print', $page_data);
	}

	function export_outstanding_excel($fee_type, $date) {
		
		$currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		$fee_labels = ['feeding' => 'Feeding Fee', 'classes' => 'Classes Fee', 'transport' => 'Transport Fare'];
		$table_map = ['feeding' => 'daily_fee_wallet', 'classes' => 'daily_fee_wallet', 'transport' => 'daily_fee_wallet'];
		$table = $table_map[$fee_type]; $label = $fee_labels[$fee_type]; $timestamp = strtotime($date);
		$this->db->select('day_timestamp')->where('can_delete !=', 'trash')->where('day_timestamp <=', $timestamp)->order_by('day_timestamp', 'DESC')->limit(1);
		$latest_date = $this->db->get($table)->row();
		$latest_timestamp = $latest_date ? $latest_date->day_timestamp : $timestamp;
		$this->db->select('student_id, due, amount')->where('can_delete !=', 'trash')->where('due >', 0)->where('day_timestamp', $latest_timestamp)->order_by('due', 'DESC');
		$outstanding = $this->db->get($table)->result_array();

		require_once FCPATH . 'vendor/autoload.php';

		$spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet(); $spreadsheet->setActiveSheetIndex(0); $sheet = $spreadsheet->getActiveSheet();
		$sheet->setCellValue('A1', $label . ' - Outstanding Fees')->mergeCells('A1:E1');
		$sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
		$sheet->setCellValue('A2', 'Date: ' . date('l, F d, Y', $latest_timestamp))->mergeCells('A2:E2');
		$sheet->setCellValue('A4', '#')->setCellValue('B4', 'Student Code')->setCellValue('C4', 'Student Name')->setCellValue('D4', 'Class')->setCellValue('E4', 'Outstanding Amount');
		$sheet->getStyle('A4:E4')->getFont()->setBold(true);
		$row = 5; $total = 0;
		foreach ($outstanding as $index => $data) {
			$student = $this->db->get_where('student', ['student_id' => $data['student_id']])->row();
			$enroll = $this->db->get_where('enroll', ['student_id' => $data['student_id'], 'mute' => '0'])->row();
			$class = $this->db->get_where('class', ['class_id' => $enroll->class_id])->row();
			$owe = $data['due']; $total += $owe;
			$sheet->setCellValue('A' . $row, $index + 1)->setCellValue('B' . $row, $student->student_code)->setCellValue('C' . $row, $student->name)->setCellValue('D' . $row, $class->name . ' ' . $class->name_numeric)->setCellValue('E' . $row, $currency . number_format($owe, 2));
			$row++;
		}
		$sheet->setCellValue('D' . $row, 'TOTAL:')->setCellValue('E' . $row, $currency . number_format($total, 2));
		$sheet->getStyle('D' . $row . ':E' . $row)->getFont()->setBold(true);
		foreach (range('A', 'E') as $col) $sheet->getColumnDimension($col)->setAutoSize(true);
		$filename = $label . '_Outstanding_' . date('Y-m-d', $latest_timestamp) . '.xlsx';
		header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		header('Content-Disposition: attachment;filename="' . $filename . '"');
		header('Cache-Control: max-age=0');
		$objWriter = PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Excel2007');
		$objWriter->save('php://output');
	}


	function search_students_by_class() {
		$class_id = $this->input->post('class_id');
		$search = $this->input->post('search');
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		$this->db->select('student.student_id, student.name, student.student_code');
		$this->db->join('enroll', 'student.student_id = enroll.student_id');
		$this->db->where('enroll.class_id', $class_id);
		$this->db->where('enroll.year', $running_year);
		$this->db->where('enroll.term', $running_term);
		$this->db->where('enroll.mute', '0');
		if(!empty($search)) {
			$this->db->group_start();
			$this->db->like('student.name', $search);
			$this->db->or_like('student.student_code', $search);
			$this->db->group_end();
		}
		$this->db->order_by('student.name', 'ASC');
		$students = $this->db->get('student')->result_array();
		echo json_encode(['status' => 'success', 'students' => $students]);
	}

	function get_student_payment_history() {
		$student_id = $this->input->post('student_id');
		$currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		$daily_payments = [];
		$tables = ['daily_fee_wallet', 'daily_fee_wallet', 'daily_fee_wallet'];
		$labels = ['Feeding', 'Classes', 'Transport'];
		foreach($tables as $i => $table) {
			$this->db->select('day_timestamp, amount, payment_method');
			$this->db->where('student_id', $student_id);
			$this->db->where('amount >', 0);
			$this->db->where('can_delete !=', 'trash');
			$this->db->order_by('day_timestamp', 'DESC');
			$this->db->limit(20);
			$payments = $this->db->get($table)->result_array();
			foreach($payments as $p) {
				$date_key = date('Y-m-d', $p['day_timestamp']);
				if(!isset($daily_payments[$date_key])) {
					$daily_payments[$date_key] = ['date' => date('d M Y', $p['day_timestamp']), 'timestamp' => $p['day_timestamp'], 'fees' => [], 'total' => 0];
				}
				$daily_payments[$date_key]['fees'][] = ['type' => $labels[$i], 'amount' => $p['amount']];
				$daily_payments[$date_key]['total'] += $p['amount'];
			}
		}
		krsort($daily_payments);
		$history = [];
		foreach($daily_payments as $payment) {
			$history[] = ['date' => $payment['date'], 'timestamp' => $payment['timestamp'], 'total' => $currency . ' ' . number_format($payment['total'], 2), 'total_raw' => $payment['total'], 'fees' => $payment['fees']];
		}
		echo json_encode(['status' => 'success', 'history' => array_slice($history, 0, 10)]);
	}

	// AJAX endpoint for Select2 student search
	function search_students_ajax() {
		$search = $this->input->get('q');
		$page = $this->input->get('page') ?: 1;
		$per_page = 20;
		$offset = ($page - 1) * $per_page;
		
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$this->db->select('s.student_id as id, CONCAT(s.student_code, " - ", s.name) as text');
		$this->db->from('student s');
		$this->db->join('enroll e', 's.student_id = e.student_id');
		$this->db->where('e.year', $running_year);
		$this->db->where('e.term', $running_term);
		
		if(!empty($search)) {
			$this->db->group_start();
			$this->db->like('s.name', $search);
			$this->db->or_like('s.student_code', $search);
			$this->db->group_end();
		}
		
		$this->db->order_by('s.name', 'ASC');
		$this->db->limit($per_page, $offset);
		
		$students = $this->db->get()->result_array();
		
		// Check if there are more results
		$this->db->from('student s');
		$this->db->join('enroll e', 's.student_id = e.student_id');
		$this->db->where('e.year', $running_year);
		$this->db->where('e.term', $running_term);
		if(!empty($search)) {
			$this->db->group_start();
			$this->db->like('s.name', $search);
			$this->db->or_like('s.student_code', $search);
			$this->db->group_end();
		}
		$total = $this->db->count_all_results();
		
		echo json_encode([
			'results' => $students,
			'pagination' => [
				'more' => ($offset + $per_page) < $total
			]
		]);
	}

	function fct_debtors($timestamp = '', $fee_type = '') {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'));
		
		$page_data['timestamp'] = $timestamp;
		$page_data['fee_type'] = $fee_type;
		$page_data['page_name'] = 'fct_debtors';
		$page_data['page_title'] = get_phrase('debtors_list');
		$this->load->view('backend/main', $page_data);
	}

	// Modal popup methods for dashboard fee cards
	function modal_feeding_payments($term, $year) {
		$page_data['term'] = $term;
		$page_data['year'] = $year;
		$this->load->view('backend/admin/modal_feeding_payments', $page_data);
	}

	function modal_classes_payments($term, $year) {
		$page_data['term'] = $term;
		$page_data['year'] = $year;
		$this->load->view('backend/admin/modal_classes_payments', $page_data);
	}

	function modal_transport_payments($term, $year) {
		$page_data['term'] = $term;
		$page_data['year'] = $year;
		$this->load->view('backend/admin/modal_transport_payments', $page_data);
	}

	function modal_unpaid_balances($term, $year) {
		$page_data['term'] = $term;
		$page_data['year'] = $year;
		$this->load->view('backend/admin/modal_unpaid_balances', $page_data);
	}

	function print_fee_receipt($student_id, $timestamp) {
		$currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		$school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
		$student = $this->db->get_where('student', ['student_id' => $student_id])->row();
		
		if(!$student) {
			die('Student not found');
		}
		
		$enroll = $this->db->get_where('enroll', ['student_id' => $student_id])->row();
		if(!$enroll) {
			die('Enrollment not found');
		}
		
		$class = $this->db->get_where('class', ['class_id' => $enroll->class_id])->row();
		$section = $enroll->section_id ? $this->db->get_where('section', ['section_id' => $enroll->section_id])->row() : null;
		
		// Find transaction - try both payment_date and created_at
		if($timestamp) {
			// First try payment_date
			$this->db->where('student_id', $student_id);
			$this->db->where('payment_date', $timestamp);
			$transaction = $this->db->get('daily_fee_transactions', 1)->row();
			
		}
		
		if(!$transaction) {
			die('Transaction not found for student ID: ' . $student_id . ' on: ' . date('d-m-Y', $timestamp));
		}
		
		$wallet = $this->db->get_where('daily_fee_wallet', ['student_id' => $student_id])->row();
		$payments = [];
		$total = 0;
		
		if($transaction->feeding_amount > 0) {
			$payments[] = ['label' => 'Feeding Fee', 'amount' => $transaction->feeding_amount, 'owing' => $wallet ? $wallet->feeding_arrears : 0];
			$total += $transaction->feeding_amount;
		}
		if($transaction->breakfast_amount > 0) {
			$payments[] = ['label' => 'Breakfast Fee', 'amount' => $transaction->breakfast_amount, 'owing' => $wallet ? $wallet->breakfast_arrears : 0];
			$total += $transaction->breakfast_amount;
		}
		if($transaction->classes_amount > 0) {
			$payments[] = ['label' => 'Classes Fee', 'amount' => $transaction->classes_amount, 'owing' => $wallet ? $wallet->classes_arrears : 0];
			$total += $transaction->classes_amount;
		}
		if($transaction->water_amount > 0) {
			$payments[] = ['label' => 'Water Fee', 'amount' => $transaction->water_amount, 'owing' => $wallet ? $wallet->water_arrears : 0];
			$total += $transaction->water_amount;
		}

		if($transaction->transport_amount > 0) {
			$payments[] = [
				'label' => 'Transport Fee', 'amount' => $transaction->transport_amount, 'owing' => $wallet ? $wallet->transport_arrears : 0
			];
			$total += $transaction->transport_amount;
			}
		$receipt_code = $transaction->receipt_number ?? $transaction->transaction_code ?? 'N/A';
		$payment_datetime = $transaction->created_at;
		$payment_method = get_payment_method_name($transaction->payment_method);
		
		$page_data = [
			'school_name' => $school_name,
			'student' => $student,
			'class' => $class,
			'section' => $section,
			'payments' => $payments,
			'total' => $total,
			'currency' => $currency,
			'receipt_code' => $receipt_code,
			'payment_method' => $payment_method,
			'date' => date('d M Y H:i:s', $payment_datetime)
		];

		$this->load->view('backend/admin/fee_receipt_print', $page_data);
	}

	/****DAILY FEE RATES MANAGEMENT*****/
	function daily_fee_rates($param1 = '', $param2 = '') {
		if ($param1 == 'create') {
			$data = [
				'class_id' => $this->input->post('class_id'),
				'feeding_rate' => $this->input->post('feeding_rate') ?: 0,
				'breakfast_rate' => $this->input->post('breakfast_rate') ?: 0,
				'classes_rate' => $this->input->post('classes_rate') ?: 0,
				'water_rate' => $this->input->post('water_rate') ?: 0,
				'breakfast_enabled' => $this->input->post('breakfast_enabled') ?: 0,
				'water_enabled' => $this->input->post('water_enabled') ?: 1,
				'year' => get_settings('running_year'),
				'term' => get_settings('running_term'),
				'created_at' => time()
			];
			$this->db->insert('daily_fee_rates', $data);
			echo json_encode(['status' => 'success', 'message' => get_phrase('rates_saved_successfully')]);
			return;
		}
		if ($param1 == 'do_update') {
			$data = [
				'feeding_rate' => $this->input->post('feeding_rate') ?: 0,
				'breakfast_rate' => $this->input->post('breakfast_rate') ?: 0,
				'classes_rate' => $this->input->post('classes_rate') ?: 0,
				'water_rate' => $this->input->post('water_rate') ?: 0,
				'breakfast_enabled' => $this->input->post('breakfast_enabled') ?: 0,
				'water_enabled' => $this->input->post('water_enabled') ?: 1,
				'updated_at' => time()
			];
			$this->db->where('id', $param2);
			$this->db->update('daily_fee_rates', $data);
			echo json_encode(['status' => 'success', 'message' => get_phrase('rates_updated_successfully')]);
			return;
		}
		$page_data['page_name'] = 'daily_fee_rates';
		$page_data['page_title'] = get_phrase('daily_fee_rates');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function get_rate_data($rate_id) {
		$rate = $this->db->get_where('daily_fee_rates', ['id' => $rate_id])->row();
		echo json_encode($rate);
	}


	function daily_fee_rates_bulk_save() {
		$class_ids = $this->input->post('class_ids');
		$rate_ids = $this->input->post('rate_ids');
		$feeding_rates = $this->input->post('feeding_rates');
		$breakfast_rates = $this->input->post('breakfast_rates');
		$classes_rates = $this->input->post('classes_rates');
		$water_rates = $this->input->post('water_rates');
		
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$updated = 0;
		$created = 0;
		
		for ($i = 0; $i < count($class_ids); $i++) {
			if (empty($feeding_rates[$i]) && empty($breakfast_rates[$i]) && empty($classes_rates[$i]) && empty($water_rates[$i])) {
				continue;
			}
			
			$data = [
				'feeding_rate' => $feeding_rates[$i] ?: 0,
				'breakfast_rate' => $breakfast_rates[$i] ?: 0,
				'classes_rate' => $classes_rates[$i] ?: 0,
				'water_rate' => $water_rates[$i] ?: 0,
				'breakfast_enabled' => !empty($breakfast_rates[$i]) ? 1 : 0,
				'water_enabled' => !empty($water_rates[$i]) ? 1 : 0
			];
			
			if ($rate_ids[$i] > 0) {
				$data['updated_at'] = time();
				$this->db->where('id', $rate_ids[$i]);
				$this->db->update('daily_fee_rates', $data);
				$updated++;
			} else {
				$data['class_id'] = $class_ids[$i];
				$data['year'] = $running_year;
				$data['term'] = $running_term;
				$data['created_at'] = time();
				$this->db->insert('daily_fee_rates', $data);
				$created++;
			}
		}
		
		echo json_encode(['status' => 'success', 'message' => get_phrase('rates_saved_successfully') . " ($created created, $updated updated)"]);
	}

	/**
	 * Get rates from a previous term for import preview
	 */
	public function get_previous_term_rates() {
		$year = $this->input->post('year');
		$term = $this->input->post('term');
		
		// Get all rates for the selected term
		$rates = $this->db->select('r.*, c.name as class_name, c.name_numeric')
			->from('daily_fee_rates r')
			->join('class c', 'c.class_id = r.class_id')
			->where('r.year', $year)
			->where('r.term', $term)
			->order_by('c.name', 'ASC')
			->order_by('c.name_numeric', 'ASC')
			->get()
			->result_array();
		
		if (empty($rates)) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('no_rates_found_for_selected_term')]);
			return;
		}
		
		// Generate HTML for preview
		$html = '<div style="overflow-x: auto;">';
		$html .= '<table class="table table-bordered table-hover" style="margin: 0;">';
		$html .= '<thead style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">';
		$html .= '<tr>';
		$html .= '<th style="font-weight: 600; padding: 12px;">Class</th>';
		$html .= '<th style="font-weight: 600; padding: 12px; text-align: center;"><i class="fa fa-utensils"></i> Feeding (GHS)</th>';
		$html .= '<th style="font-weight: 600; padding: 12px; text-align: center;"><i class="fa fa-coffee"></i> Breakfast (GHS)</th>';
		$html .= '<th style="font-weight: 600; padding: 12px; text-align: center;"><i class="fa fa-book"></i> Classes (GHS)</th>';
		$html .= '<th style="font-weight: 600; padding: 12px; text-align: center;"><i class="fa fa-tint"></i> Water (GHS)</th>';
		$html .= '</tr>';
		$html .= '</thead>';
		$html .= '<tbody>';
		
		foreach ($rates as $rate) {
			$html .= '<tr class="import-rate-row" data-class-id="' . $rate['class_id'] . '">';
			$html .= '<td style="font-weight: 600; padding: 12px;">' . $rate['class_name'] . ' ' . $rate['name_numeric'] . '</td>';
			$html .= '<td style="padding: 8px;"><input type="number" class="form-control feeding-rate" value="' . $rate['feeding_rate'] . '" step="0.01" min="0" style="text-align: center; font-size: 16px; padding: 10px;"></td>';
			$html .= '<td style="padding: 8px;"><input type="number" class="form-control breakfast-rate" value="' . $rate['breakfast_rate'] . '" step="0.01" min="0" style="text-align: center; font-size: 16px; padding: 10px;"></td>';
			$html .= '<td style="padding: 8px;"><input type="number" class="form-control classes-rate" value="' . $rate['classes_rate'] . '" step="0.01" min="0" style="text-align: center; font-size: 16px; padding: 10px;"></td>';
			$html .= '<td style="padding: 8px;"><input type="number" class="form-control water-rate" value="' . $rate['water_rate'] . '" step="0.01" min="0" style="text-align: center; font-size: 16px; padding: 10px;"></td>';
			$html .= '</tr>';
		}
		
		$html .= '</tbody>';
		$html .= '</table>';
		$html .= '</div>';
		
		echo json_encode(['status' => 'success', 'rates' => $rates, 'html' => $html]);
	}

	/**
	 * Import daily fee rates from previous term (after user approval/edits)
	 */
	public function import_daily_fee_rates() {
		$rates_json = $this->input->post('rates');
		$rates = json_decode($rates_json, true);
		
		if (empty($rates)) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('no_rates_to_import')]);
			return;
		}
		
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$created = 0;
		$updated = 0;
		$skipped = 0;
		
		foreach ($rates as $rate) {
			// Check if rate already exists for this class in current term
			$existing = $this->db->get_where('daily_fee_rates', [
				'class_id' => $rate['class_id'],
				'year' => $running_year,
				'term' => $running_term
			])->row();
			
			$data = [
				'feeding_rate' => $rate['feeding_rate'],
				'breakfast_rate' => $rate['breakfast_rate'],
				'classes_rate' => $rate['classes_rate'],
				'water_rate' => $rate['water_rate'],
				'updated_at' => time()
			];
			
			if ($existing) {
				// Update existing rate
				$this->db->where('id', $existing->id);
				$this->db->update('daily_fee_rates', $data);
				$updated++;
			} else {
				// Create new rate
				$data['class_id'] = $rate['class_id'];
				$data['year'] = $running_year;
				$data['term'] = $running_term;
				$data['created_at'] = time();
				$this->db->insert('daily_fee_rates', $data);
				$created++;
			}
		}
		
		$message = get_phrase('rates_imported_successfully') . ": $created " . get_phrase('created') . ", $updated " . get_phrase('updated');
		echo json_encode(['status' => 'success', 'message' => $message]);
	}


	function get_route_info($route_id) {
		$route = $this->db->get_where('transport_routes', ['route_id' => $route_id])->row();
		if ($route) {
			echo json_encode(['status' => 'success', 'route' => $route]);
		} else {
			echo json_encode(['status' => 'error', 'message' => 'Route not found']);
		}
	}

	function morning_transport_collection() {
		$page_data['page_name'] = 'morning_transport_collection';
		$page_data['page_title'] = get_phrase('morning_transport_collection');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// ========== PHASE 2: DAILY FEES STATISTICS (NEW SYSTEM) ==========


	// Modal: Payment details by date
	function modal_popup_payments_details($fee_type, $date) {
		$date_parts = explode('-', $date);
		$date_timestamp = strtotime($date_parts[2] . '-' . $date_parts[1] . '-' . $date_parts[0]);
		
		$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
		$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
		
		$amount_field = $fee_type . '_amount';
		
		$this->db->select("t.*, student.name as student_name, student.student_code, 
						   class.name as class_name, class.name_numeric, section.name as section_name,
						   t.$amount_field as amount");
		$this->db->from('daily_fee_transactions t');
		$this->db->join('student', 'student.student_id = t.student_id');
		$this->db->join('enroll', 'enroll.student_id = t.student_id AND enroll.year = ' . $this->db->escape($running_year));
		$this->db->join('class', 'class.class_id = enroll.class_id');
		$this->db->join('section', 'section.section_id = enroll.section_id');
		$this->db->where('t.payment_date >=', $date_timestamp);
		$this->db->where('t.payment_date <', $date_timestamp + 86400);
		$this->db->where("t.$amount_field >", 0);
		$this->db->order_by('student.name', 'ASC');
		
		$page_data['payments'] = $this->db->get()->result_array();
		$page_data['fee_type'] = ucfirst($fee_type);
		$page_data['date'] = date('l, F d, Y', $date_timestamp);
		$page_data['currency'] = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		
		$this->load->view('backend/admin/modal_payments_details', $page_data);
	}

	// Modal: Outstanding details by date
	function modal_popup_outstanding_details($fee_type, $date) {
		$date_parts = explode('-', $date);
		$date_timestamp = strtotime($date_parts[2] . '-' . $date_parts[1] . '-' . $date_parts[0]);
		
		$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
		$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
		
		$charge_field = $fee_type . '_charged';
		
		$this->db->select("a.*, student.name as student_name, student.student_code,
						   class.name as class_name, class.name_numeric, section.name as section_name,
						   a.$charge_field as amount_owed");
		$this->db->from('attendance a');
		$this->db->join('student', 'student.student_id = a.student_id');
		$this->db->join('enroll', 'enroll.student_id = a.student_id AND enroll.year = ' . $this->db->escape($running_year));
		$this->db->join('class', 'class.class_id = enroll.class_id');
		$this->db->join('section', 'section.section_id = enroll.section_id');
		$this->db->where('a.attendance_date', $date_timestamp);
		$this->db->where('a.payment_status', 'unpaid');
		$this->db->where("a.$charge_field >", 0);
		$this->db->order_by('student.name', 'ASC');
		
		$page_data['outstanding'] = $this->db->get()->result_array();
		$page_data['fee_type'] = ucfirst($fee_type);
		$page_data['date'] = date('l, F d, Y', $date_timestamp);
		$page_data['currency'] = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		
		$this->load->view('backend/admin/modal_outstanding_details', $page_data);
	}

	// Modal: Payables details by date
	function modal_popup_payables_details($fee_type, $date) {
		$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
		$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
		
		$balance_field = $fee_type . '_balance';
		
		$this->db->select("w.*, student.name as student_name, student.student_code,
						   class.name as class_name, class.name_numeric, section.name as section_name,
						   w.$balance_field as prepaid_balance");
		$this->db->from('daily_fee_wallet w');
		$this->db->join('student', 'student.student_id = w.student_id');
		$this->db->join('enroll', 'enroll.student_id = w.student_id AND enroll.year = ' . $this->db->escape($running_year));
		$this->db->join('class', 'class.class_id = enroll.class_id');
		$this->db->join('section', 'section.section_id = enroll.section_id');
		$this->db->where("w.$balance_field >", 0);
		$this->db->order_by('student.name', 'ASC');
		
		$page_data['payables'] = $this->db->get()->result_array();
		$page_data['fee_type'] = ucfirst($fee_type);
		$page_data['currency'] = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		
		$this->load->view('backend/admin/modal_payables_details', $page_data);
	}

	// Term-based versions
	function modal_popup_payments_details_term($fee_type, $year, $term) {
		$year_start = strtotime($year . '-01-01');
		$year_end = strtotime($year . '-12-31 23:59:59');
		
		$amount_field = $fee_type . '_amount';
		
		$this->db->select("t.*, student.name as student_name, student.student_code,
						   class.name as class_name, class.name_numeric, section.name as section_name,
						   SUM(t.$amount_field) as total_amount");
		$this->db->from('daily_fee_transactions t');
		$this->db->join('student', 'student.student_id = t.student_id');
		$this->db->join('enroll', 'enroll.student_id = t.student_id AND enroll.year = ' . $this->db->escape($year));
		$this->db->join('class', 'class.class_id = enroll.class_id');
		$this->db->join('section', 'section.section_id = enroll.section_id');
		$this->db->where('t.payment_date >=', $year_start);
		$this->db->where('t.payment_date <=', $year_end);
		$this->db->where("t.$amount_field >", 0);
		$this->db->group_by('t.student_id');
		$this->db->order_by('student.name', 'ASC');
		
		$page_data['payments'] = $this->db->get()->result_array();
		$page_data['fee_type'] = ucfirst($fee_type);
		$page_data['period'] = 'Term ' . $term . ', ' . $year;
		$page_data['currency'] = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		
		$this->load->view('backend/admin/modal_payments_details', $page_data);
	}

	function modal_popup_outstanding_details_term($fee_type, $year, $term) {
		$arrears_field = $fee_type . '_arrears';
		
		$this->db->select("w.*, student.name as student_name, student.student_code,
						   class.name as class_name, class.name_numeric, section.name as section_name,
						   w.$arrears_field as amount_owed");
		$this->db->from('daily_fee_wallet w');
		$this->db->join('student', 'student.student_id = w.student_id');
		$this->db->join('enroll', 'enroll.student_id = w.student_id AND enroll.year = ' . $this->db->escape($year));
		$this->db->join('class', 'class.class_id = enroll.class_id');
		$this->db->join('section', 'section.section_id = enroll.section_id');
		$this->db->where('enroll.term', $term);
		$this->db->where("w.$arrears_field >", 0);
		$this->db->order_by('student.name', 'ASC');
		
		$page_data['outstanding'] = $this->db->get()->result_array();
		$page_data['fee_type'] = ucfirst($fee_type);
		$page_data['period'] = 'Term ' . $term . ', ' . $year;
		$page_data['currency'] = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		
		$this->load->view('backend/admin/modal_outstanding_details', $page_data);
	}

	function modal_popup_payables_details_term($fee_type, $year, $term) {
		$balance_field = $fee_type . '_balance';
		
		$this->db->select("w.*, student.name as student_name, student.student_code,
						   class.name as class_name, class.name_numeric, section.name as section_name,
						   w.$balance_field as prepaid_balance");
		$this->db->from('daily_fee_wallet w');
		$this->db->join('student', 'student.student_id = w.student_id');
		$this->db->join('enroll', 'enroll.student_id = w.student_id AND enroll.year = ' . $this->db->escape($year));
		$this->db->join('class', 'class.class_id = enroll.class_id');
		$this->db->join('section', 'section.section_id = enroll.section_id');
		$this->db->where('enroll.term', $term);
		$this->db->where("w.$balance_field >", 0);
		$this->db->order_by('student.name', 'ASC');
		
		$page_data['payables'] = $this->db->get()->result_array();
		$page_data['fee_type'] = ucfirst($fee_type);
		$page_data['period'] = 'Term ' . $term . ', ' . $year;
		$page_data['currency'] = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		
		$this->load->view('backend/admin/modal_payables_details', $page_data);
	}

	
	// Student Payment Behavior Analysis
	function student_payment_behavior($student_id) {
		$analysis = get_payment_behavior_analysis($student_id);
		echo json_encode($analysis);
	}

	// Consolidated Fee Collection Settings
	function fee_collection_settings($param1 = '') {
		if ($param1 == 'update') {
			// 1. Update school-wide collection mode
			$daily_mode = $this->input->post('daily_fee_collection_mode');
			if ($daily_mode) {
				$exists = $this->db->get_where('settings', ['type' => 'daily_fee_collection_mode'])->row();
				if ($exists) {
					$this->db->where('type', 'daily_fee_collection_mode');
					$this->db->update('settings', ['description' => $daily_mode]);
				} else {
					$this->db->insert('settings', ['type' => 'daily_fee_collection_mode', 'description' => $daily_mode]);
				}
			}
			
			// 2. Update teacher fee collection mode
			$teacher_mode = $this->input->post('teacher_fee_collection_mode');
			if ($teacher_mode) {
				$exists = $this->db->get_where('settings', ['type' => 'teacher_fee_collection_mode'])->row();
				if ($exists) {
					$this->db->where('type', 'teacher_fee_collection_mode');
					$this->db->update('settings', ['description' => $teacher_mode]);
				} else {
					$this->db->insert('settings', ['type' => 'teacher_fee_collection_mode', 'description' => $teacher_mode]);
				}
			}
			
			// 3. Update fee module toggles
			$modules = ['feeding', 'classes', 'transport', 'breakfast', 'water'];
			foreach ($modules as $module) {
				$value = $this->input->post('fee_module_' . $module) ? '1' : '0';
				$exists = $this->db->get_where('settings', ['type' => 'fee_module_' . $module])->row();
				if ($exists) {
					$this->db->where('type', 'fee_module_' . $module);
					$this->db->update('settings', ['description' => $value]);
				} else {
					$this->db->insert('settings', ['type' => 'fee_module_' . $module, 'description' => $value]);
				}
			}
			
			echo json_encode(['status' => 'success', 'message' => get_phrase('settings_updated_successfully')]);
			return;
		}
		
		$page_data['page_name'] = 'fee_collection_settings';
		$page_data['page_title'] = get_phrase('fee_collection_settings');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}
	
	// Daily Fee Module Settings (redirects to consolidated page)
	function daily_fee_module_settings($param1 = '') {
		// Redirect to the new consolidated page
		redirect(site_url('admin/fee_collection_settings'));
	}

	// Apply discount to invoice
	function apply_discount($student_id = '', $invoice_code = '') {
		$page_data['student_id'] = $student_id;
		$page_data['invoice_code'] = $invoice_code;
		$page_data['page_name'] = 'apply_discount';
		$page_data['page_title'] = get_phrase('apply_discount');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}
	
	// Get students with unpaid invoices
	function get_students_with_unpaid_invoices() {
		$year = $this->input->post('year');
		$term = $this->input->post('term');
		
		$this->db->select('s.student_id, s.name, s.student_code');
		$this->db->from('student s');
		$this->db->join('invoice i', 'i.student_id = s.student_id');
		$this->db->where('i.year', $year);
		$this->db->where('i.term', $term);
		$this->db->where('i.due >', 0);
		$this->db->where('i.can_delete !=', 'trash');
		$this->db->group_by('s.student_id');
		$this->db->order_by('s.name', 'ASC');
		$students = $this->db->get()->result_array();
		
		$html = '<option value="">'.get_phrase('select_student').'</option>';
		foreach($students as $student) {
			$html .= '<option value="'.$student['student_id'].'">'.$student['name'].' ('.$student['student_code'].')</option>';
		}
		
		echo $html;
	}
	
	// Get unpaid invoice codes for a student
	function get_student_unpaid_invoices() {
		$student_id = $this->input->post('student_id');
		$year = $this->input->post('year');
		$term = $this->input->post('term');
		
		$this->db->select('invoice_code, SUM(due) as total_due');
		$this->db->from('invoice');
		$this->db->where('student_id', $student_id);
		$this->db->where('year', $year);
		$this->db->where('term', $term);
		$this->db->where('due >', 0);
		$this->db->where('can_delete !=', 'trash');
		$this->db->group_by('invoice_code');
		$this->db->order_by('invoice_code', 'ASC');
		$invoices = $this->db->get()->result_array();
		
		$currency = get_settings('currency');
		$html = '<option value="">'.get_phrase('select_invoice').'</option>';
		foreach($invoices as $invoice) {
			$html .= '<option value="'.$invoice['invoice_code'].'">'.$invoice['invoice_code'].' (Due: '.$currency.' '.number_format($invoice['total_due'], 2).')</option>';
		}
		
		echo $html;
	}
	
	// Get invoice discount types only (category_id = 1)
	function get_invoice_discount_types() {
		$types = $this->db
			->select('discount_type_id, name, icon, description')
			->where('category_id', 1)
			->where('is_active', 1)
			->order_by('name', 'ASC')
			->get('discount_types')
			->result_array();
		echo json_encode($types);
	}

	// Get invoice discount summary
	function get_invoice_discount_summary() {
		$invoice_code = $this->input->post('invoice_code');
		$currency = get_settings('currency');
		
		$discounts = $this->db->where('invoice_code', $invoice_code)
			->where_in('status', ['approved', 'pending'])
			->get('invoice_discounts')->result_array();
		
		$result = ['has_discount' => false, 'approved_amount' => 0, 'pending_amount' => 0, 'details' => []];
		
		foreach($discounts as $disc) {
			$result['has_discount'] = true;
			if($disc['status'] == 'approved') $result['approved_amount'] += $disc['discount_amount'];
			if($disc['status'] == 'pending') $result['pending_amount'] += $disc['discount_amount'];
			
			$profile = $this->db->where('profile_id', $disc['profile_id'])->get('discount_profiles')->row();
			$applies_to = 'All Bill Items';
			if($profile && $profile->bill_item_ids !== '*') {
				$bill_items = $this->db->where_in('id', explode(',', $profile->bill_item_ids))->get('bill_item')->result_array();
				$applies_to = implode(', ', array_column($bill_items, 'title'));
			}
			
			$result['details'][] = [
				'profile_name' => $profile ? $profile->profile_name : 'Unknown',
				'method' => $profile ? $profile->discount_method : '',
				'value' => $profile ? $profile->discount_value : 0,
				'amount' => $disc['discount_amount'],
				'applies_to' => $applies_to,
				'status' => $disc['status'],
				'currency' => $currency
			];
		}
		
		echo json_encode($result);
	}

	// Discount management page
	function assign_student_discount($param1 = '') {
		if($param1 == 'create') {
			$student_ids = $this->input->post('student_id');
			$profile_ids = $this->input->post('profile_id');
			$confirm = $this->input->post('confirm');
			$year = get_settings('running_year');
			$term = get_settings('running_term');
			$assigned_by = $this->session->userdata('admin_id');
			
			if(empty($student_ids) || !is_array($student_ids)) {
				echo json_encode(['status' => 'error', 'message' => 'No students selected']);
				return;
			}
			if(empty($profile_ids) || !is_array($profile_ids)) {
				echo json_encode(['status' => 'error', 'message' => 'No profiles selected']);
				return;
			}
			
			// Check for duplicates
			if(!$confirm) {
				$duplicates = [];
				foreach($student_ids as $student_id) {
					foreach($profile_ids as $profile_id) {
						$exists = $this->db->where('student_id', $student_id)
							->where('profile_id', $profile_id)
							->where('is_active', 1)
							->get('student_discount_assignments')->row();
						
						if($exists) {
							$student = $this->db->where('student_id', $student_id)->get('student')->row();
							$profile = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row();
							$duplicates[] = ['student' => $student->name, 'profile' => $profile->profile_name];
						}
					}
				}
				
				if(!empty($duplicates)) {
					echo json_encode(['status' => 'confirm', 'message' => 'Some assignments already exist', 'duplicates' => $duplicates]);
					return;
				}
			}
			
			// Process assignments
			$current_user_id = $this->session->userdata('login_user_id');
			$user = $this->db->get_where('admin', ['admin_id' => $current_user_id])->row();
			$is_super_admin = ($user && ($user->level == 1 || $user->level == '1'));
			
			foreach($student_ids as $student_id) {
				foreach($profile_ids as $profile_id) {
					// Get profile details
					$profile = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row();
					if(!$profile) continue;
					
					$exists = $this->db->where('student_id', $student_id)
						->where('profile_id', $profile_id)
						->where('is_active', 1)
						->get('student_discount_assignments')->row();
					
					$data = [
						'discount_category' => $profile->discount_category,
						'discount_method' => $profile->discount_method,
						'discount_value' => $profile->discount_value,
						'discount_type' => $profile->discount_type,
						'bill_item_ids' => $profile->bill_item_ids,
						'year' => $year,
						'term' => $term,
						'assigned_by' => $assigned_by,
						'is_active' => $is_super_admin ? 1 : 0,
						'status' => $is_super_admin ? 'approved' : 'pending',
						'approved_by' => $is_super_admin ? $assigned_by : null,
						'approved_at' => $is_super_admin ? date('Y-m-d H:i:s') : null
					];
					
					if($exists) {
						$this->db->where('student_id', $student_id)
							->where('profile_id', $profile_id)
							->update('student_discount_assignments', $data);
					} else {
						$data['student_id'] = $student_id;
						$data['profile_id'] = $profile_id;
						$data['created_by'] = $assigned_by;
						$this->db->insert('student_discount_assignments', $data);
					}
				}
			}
			
			// Notify super admins if assignment requires approval
			if(!$is_super_admin) {
				$this->notify_super_admins_discount_approval($student_ids, $profile_ids, $assigned_by);
			}
			
			$success_message = $is_super_admin ? 
				get_phrase('discount_assigned_successfully') : 
				get_phrase('discount_assignment_submitted_for_approval');
			
			echo json_encode(['status' => 'success', 'message' => $success_message, 'requires_approval' => !$is_super_admin]);
			return;
		}
		
		// Filter profiles based on user role
		$user_level = $this->session->userdata('user_type');
		$this->db->where('is_active', 1);
		if($user_level == 4) { // Cashier
			$this->db->where('discount_category', 'daily_fees');
		}
		$page_data['profiles'] = $this->db->get('discount_profiles')->result_array();
		$page_data['page_name'] = 'assign_student_discount';
		$page_data['page_title'] = get_phrase('assign_student_discount');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Modal version for AJAX loading
	function assign_student_discount_modal() {
		// Fetch active discount profiles with their default values
		// Rules are applied during discount calculation based on student's class
		
		// Filter by daily_fees category only for cashier role (level = 4)
		$user_level = $this->session->userdata('user_type'); // Correct session key is 'user_type'
		
		$this->db->select('profile_id, profile_name, discount_type, discount_category, discount_method, discount_value, bill_item_ids, description');
		$this->db->from('discount_profiles');
		$this->db->where('is_active', 1);
		
		if($user_level == 4) {
			$this->db->where('discount_category', 'daily_fees');
		}
		
		$this->db->order_by('profile_name', 'ASC');
		$page_data['profiles'] = $this->db->get()->result_array();
		
		$bill_items = $this->db->select('id, title')->from('bill_item')->get()->result_array();
		$page_data['bill_items_map'] = array_column($bill_items, 'title', 'id');
		
		$this->load->view('backend/admin/assign_student_discount_modal', $page_data);
	}
	
	function edit_student_discount_modal($assignment_id) {
		$assignment = $this->db->where('assignment_id', $assignment_id)->get('student_discount_assignments')->row();
		if(!$assignment) {
			echo '<div class="alert alert-danger">Assignment not found</div>';
			return;
		}
		
		$this->db->select('profile_id, profile_name, discount_type, discount_category, discount_method, discount_value, bill_item_ids, description');
		$this->db->from('discount_profiles');
		$this->db->where('is_active', 1);
		
		// Filter by daily_fees category only for cashier role (level = 4)
		$user_level = $this->session->userdata('user_type');
		if($user_level == 4) {
			$this->db->where('discount_category', 'daily_fees');
		}
		
		$this->db->order_by('profile_name', 'ASC');
		$page_data['profiles'] = $this->db->get()->result_array();
		
		$bill_items = $this->db->select('id, title')->from('bill_item')->get()->result_array();
		$page_data['bill_items_map'] = array_column($bill_items, 'title', 'id');
		
		$assigned_profiles = $this->db->select('profile_id')
			->from('student_discount_assignments')
			->where('student_id', $assignment->student_id)
			->where('assignment_id !=', $assignment_id)
			->where('is_active', 1)
			->get()->result_array();
		$page_data['assigned_profile_ids'] = array_column($assigned_profiles, 'profile_id');
		
		$page_data['assignment'] = $assignment;
		$this->load->view('backend/admin/edit_student_discount_modal', $page_data);
	}
	

	function get_discount_categories() {
		$categories = $this->db->get('discount_categories')->result_array();
		echo json_encode($categories);
	}
	
	function get_discount_types_by_category($category_id) {
		$types = $this->db->select('discount_type_id, name, icon, description, is_active, category_id, default_method, default_value')
			->where('category_id', $category_id)
			->order_by('name', 'ASC')
			->get('discount_types')->result_array();
		echo json_encode($types);
	}
	
	function get_students_for_discount() {
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$query = "SELECT DISTINCT s.student_id, s.name, s.student_code, 
				  CONCAT(c.name, ' ', c.name_numeric, ' ', sec.name) as class_name 
				  FROM student s 
				  JOIN enroll e ON s.student_id = e.student_id 
				  JOIN class c ON e.class_id = c.class_id 
				  JOIN section sec ON e.section_id = sec.section_id
				  WHERE e.year = ? AND e.term = ? AND e.mute = '0'
				  ORDER BY s.name ASC";
		
		$students = $this->db->query($query, array($running_year, $running_term))->result_array();
		echo json_encode(array('status' => 'success', 'data' => $students));
	}
	
	function get_student_assigned_profiles() {
		$student_id = $this->input->get('student_id');
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$query = "SELECT sda.profile_id, dp.profile_name 
				  FROM student_discount_assignments sda
				  JOIN discount_profiles dp ON sda.profile_id = dp.profile_id
				  WHERE sda.student_id = ? AND sda.year = ? AND sda.term = ? AND sda.is_active = 1";
		
		$profiles = $this->db->query($query, array($student_id, $running_year, $running_term))->result_array();
		echo json_encode(array('status' => 'success', 'data' => $profiles));
	}
	
	function get_invoice_discounts($student_id) {
		$query = "SELECT sda.*, dp.profile_name, dp.discount_type
				  FROM student_discount_assignments sda
				  JOIN discount_profiles dp ON sda.profile_id = dp.profile_id
				  WHERE sda.student_id = ? AND sda.is_active = 1
				  ORDER BY sda.year DESC, sda.term DESC";
		return $this->db->query($query, array($student_id))->result_array();
	}
	

	function bulk_assign_by_class_modal() {
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$class_order = array('CRECHE', 'NURSERY', 'KG', 'BASIC', 'JHS');
		$classes_data = array();
		
		foreach($class_order as $class_name) {
			$query = "SELECT c.class_id, c.name, c.name_numeric, sec.name as section_name,
					  COUNT(DISTINCT e.student_id) as student_count
					  FROM class c
					  JOIN section sec ON c.class_id = sec.class_id
					  LEFT JOIN enroll e ON c.class_id = e.class_id AND e.section_id = sec.section_id 
							AND e.year = ? AND e.term = ? AND e.mute = '0'
					  WHERE c.name = ?
					  GROUP BY c.class_id, sec.section_id
					  ORDER BY c.name_numeric, sec.name";
			
			$result = $this->db->query($query, array($running_year, $running_term, $class_name))->result_array();
			$classes_data = array_merge($classes_data, $result);
		}
		
		$profiles_query = $this->db->query("
			SELECT dp.profile_id, dp.profile_name, dp.discount_type, dp.discount_category, GROUP_CONCAT(DISTINCT dpr.discount_value ORDER BY dpr.discount_value SEPARATOR ', ') as discount_values
			FROM discount_profiles dp
			LEFT JOIN discount_profile_rules dpr ON dp.profile_id = dpr.profile_id
			WHERE dp.is_active = 1
			GROUP BY dp.profile_id
		");
		
		$page_data['classes'] = $classes_data;
		$page_data['profiles'] = $profiles_query->result_array();
		$this->load->view('backend/admin/bulk_assign_by_class_modal', $page_data);
	}
	function discount_reports($param1 = '') {
		if($param1 == 'get_data') {
			$type = $this->input->get('type');
			$year = $this->input->get('year') ?: get_settings('running_year');
			$term = $this->input->get('term') ?: get_settings('running_term');
			
			if($type == 'by_class') {
				$query = "SELECT c.name as class_name, c.name_numeric, 
						  COUNT(DISTINCT id.student_id) as student_count,
						  AVG(id.discount_value) as avg_discount, 
						  SUM(id.discount_value) as total_discount,
						  SUM(id.discount_amount) as total_amount
						  FROM invoice_discounts id
						  JOIN enroll e ON id.student_id = e.student_id AND e.year = ? AND e.term = ?
						  JOIN class c ON e.class_id = c.class_id
						  WHERE id.status = 'approved' AND id.year = ? AND id.term = ?
						  GROUP BY c.class_id
						  ORDER BY c.name, c.name_numeric";
				$data = $this->db->query($query, [$year, $term, $year, $term])->result_array();
			} elseif($type == 'by_profile') {
				$query = "SELECT 
						  COALESCE(dp.profile_name, 'Direct Discount') as profile_name,
						  COALESCE(dp.discount_category, id.discount_category) as discount_category,
						  COALESCE(dp.discount_type, '-') as discount_type,
						  COALESCE(dp.discount_method, id.discount_method) as discount_method,
						  AVG(COALESCE(dp.discount_value, id.discount_value)) as discount_value,
						  COUNT(id.discount_id) as assignment_count,
						  COUNT(DISTINCT id.student_id) as student_count,
						  SUM(id.discount_amount) as total_amount
						  FROM invoice_discounts id
						  LEFT JOIN student_discount_assignments sda ON id.student_id = sda.student_id AND sda.is_active = 1
						  LEFT JOIN discount_profiles dp ON sda.profile_id = dp.profile_id
						  WHERE id.status = 'approved' AND id.year = ? AND id.term = ?
						  GROUP BY COALESCE(dp.profile_id, 0), COALESCE(dp.discount_category, id.discount_category), COALESCE(dp.discount_method, id.discount_method)
						  ORDER BY student_count DESC";
				$data = $this->db->query($query, [$year, $term])->result_array();
			} elseif($type == 'by_student') {
				$query = "SELECT s.student_id, s.name as student_name, s.student_code,
						  CONCAT(c.name, ' ', c.name_numeric) as class_name,
						  COALESCE(dp.profile_name, 'Direct Discount') as profile_name,
						  COALESCE(dp.discount_type, '-') as discount_type,
						  dp.discount_category as discount_category,
						  COALESCE(dp.discount_method, id.discount_method) as discount_method,
						  COALESCE(dp.discount_value, AVG(id.discount_value)) as discount_value,
						  SUM(id.discount_amount) as total_benefit_amount,
						  COUNT(id.discount_id) as discount_count
						  FROM invoice_discounts id
						  JOIN student s ON id.student_id = s.student_id
						  JOIN enroll e ON s.student_id = e.student_id AND e.year = ? AND e.term = ?
						  JOIN class c ON e.class_id = c.class_id
						  LEFT JOIN student_discount_assignments sda ON id.student_id = sda.student_id AND sda.is_active = 1
						  LEFT JOIN discount_profiles dp ON sda.profile_id = dp.profile_id
						  WHERE id.status = 'approved' AND id.year = ? AND id.term = ?
						  GROUP BY s.student_id, COALESCE(dp.profile_id, 0)
						  ORDER BY s.name";
				$data = $this->db->query($query, [$year, $term, $year, $term])->result_array();
			} else {
				$data = [];
			}
			
			echo json_encode(['status' => 'success', 'data' => $data]);
			return;
		}
		
		$page_data['page_name'] = 'discount_reports';
		$page_data['page_title'] = get_phrase('discount_reports');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	function discount_reports_export() {
		
		$type = $this->input->post('type');
		$data = json_decode($this->input->post('data'), true);
		$year = $this->input->post('year');
		$term = $this->input->post('term');
		
		require_once FCPATH . 'vendor/autoload.php';
		
		$spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
		$spreadsheet->setActiveSheetIndex(0);
		$sheet = $spreadsheet->getActiveSheet();
		
		$sheet->getStyle('A1:Z1')->getFont()->setBold(true);
		$sheet->getStyle('A1:Z1')->getFill()->setFillType(PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)->getStartColor()->setRGB('667eea');
		$sheet->getStyle('A1:Z1')->getFont()->getColor()->setRGB('FFFFFF');
		
		if($type === 'by_class') {
			$sheet->setCellValue('A1', 'Class');
			$sheet->setCellValue('B1', 'Students');
			$sheet->setCellValue('C1', 'Avg Discount (%)');
			$sheet->setCellValue('D1', 'Total Discount (%)');
			$row = 2;
			foreach($data as $item) {
				$sheet->setCellValue('A'.$row, $item['class_name'].' '.$item['name_numeric']);
				$sheet->setCellValue('B'.$row, $item['student_count']);
				$sheet->setCellValue('C'.$row, number_format($item['avg_discount'], 1));
				$sheet->setCellValue('D'.$row, number_format($item['total_discount'], 0));
				$row++;
			}
		} elseif($type === 'by_profile') {
			$sheet->setCellValue('A1', 'Profile');
			$sheet->setCellValue('B1', 'Type');
			$sheet->setCellValue('C1', 'Category');
			$sheet->setCellValue('D1', 'Value (%)');
			$sheet->setCellValue('E1', 'Students');
			$sheet->setCellValue('F1', 'Assignments');
			$row = 2;
			foreach($data as $item) {
				$sheet->setCellValue('A'.$row, $item['profile_name']);
				$sheet->setCellValue('B'.$row, $item['discount_type']);
				$sheet->setCellValue('C'.$row, $item['discount_category'] ?? 'N/A');
				$sheet->setCellValue('D'.$row, $item['discount_value']);
				$sheet->setCellValue('E'.$row, $item['student_count'] ?? 0);
				$sheet->setCellValue('F'.$row, $item['assignment_count'] ?? 0);
				$row++;
			}
		} else {
			$sheet->setCellValue('A1', '#');
			$sheet->setCellValue('B1', 'Student');
			$sheet->setCellValue('C1', 'Code');
			$sheet->setCellValue('D1', 'Class');
			$sheet->setCellValue('E1', 'Profile');
			$sheet->setCellValue('F1', 'Category');
			$sheet->setCellValue('G1', 'Discount (%)');
			$row = 2;
			$index = 1;
			foreach($data as $item) {
				$sheet->setCellValue('A'.$row, $index++);
				$sheet->setCellValue('B'.$row, $item['student_name']);
				$sheet->setCellValue('C'.$row, $item['student_code']);
				$sheet->setCellValue('D'.$row, $item['class_name']);
				$sheet->setCellValue('E'.$row, $item['profile_name']);
				$sheet->setCellValue('F'.$row, $item['discount_category'] ?? 'N/A');
				$sheet->setCellValue('G'.$row, $item['discount_value']);
				$row++;
			}
		}
		
		foreach(range('A','G') as $col) {
			$sheet->getColumnDimension($col)->setAutoSize(true);
		}
		
		$filename = 'discount_report_'.$type.'_'.date('Y-m-d').'.xlsx';
		header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		header('Content-Disposition: attachment;filename="'.$filename.'"');
		header('Cache-Control: max-age=0');
		
		$objWriter = PhpOffice\PhpSpreadsheet\IOFactory::createWriter($spreadsheet, 'Excel2007');
		$objWriter->save('php://output');
	}
	
	function get_discount_report_data() {
		$type = $this->input->get('type');
		$year = $this->input->get('year') ?: get_settings('running_year');
		$term = $this->input->get('term') ?: get_settings('running_term');
		
		if($type == 'by_class') {
			$query = "SELECT c.name as class_name, COUNT(DISTINCT sda.student_id) as student_count,
					  AVG(sda.discount_value) as avg_discount
					  FROM student_discount_assignments sda
					  JOIN enroll e ON sda.student_id = e.student_id
					  JOIN class c ON e.class_id = c.class_id
					  WHERE e.year = ? AND e.term = ? AND sda.is_active = 1
					  GROUP BY c.class_id
					  ORDER BY c.name_numeric";
			$data = $this->db->query($query, [$year, $term])->result_array();
		} elseif($type == 'by_profile') {
			$query = "SELECT dp.profile_name, dp.discount_type, COUNT(sda.assignment_id) as assignment_count,
					  AVG(sda.discount_value) as avg_discount
					  FROM student_discount_assignments sda
					  JOIN discount_profiles dp ON sda.profile_id = dp.profile_id
					  WHERE sda.is_active = 1
					  GROUP BY dp.profile_id";
			$data = $this->db->query($query)->result_array();
		} else {
			$data = [];
		}
		
		echo json_encode(['status' => 'success', 'data' => $data]);
	}
	
	function discount_management() {
		$page_data['page_name'] = 'discount_management';
		$page_data['page_title'] = get_phrase('discount_management');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}
	
	function manage_discount_assignments($param1 = '') {
		if($param1 == 'get_data') {
			// Check if user is cashier (level 4)
			$admin_id = $this->session->userdata('admin_id');
			$admin_level = $this->db->get_where('admin', ['admin_id' => $admin_id])->row()->level;
			$is_cashier = ($admin_level == 4);
			
			// Build query with category filter for cashiers - filter by discount_profiles.discount_category
			$category_filter = $is_cashier ? "AND dp.discount_category = 'daily_fees'" : "";
			
			// Get all assignments first
			$query = "SELECT sda.*, s.name as student_name, s.student_code, 
					  dp.profile_name, dp.discount_category, sda.discount_type, sda.discount_method, sda.discount_value, sda.bill_item_ids, sda.status,
					  CONCAT(c.name, ' ', c.name_numeric, ' ', sec.name) as class_name,
					  admin.name as assigned_by_name
					  FROM student_discount_assignments sda
					  JOIN student s ON sda.student_id = s.student_id
					  JOIN discount_profiles dp ON sda.profile_id = dp.profile_id
					  JOIN enroll e ON s.student_id = e.student_id AND e.year = ? AND e.term = ?
					  JOIN class c ON e.class_id = c.class_id
					  JOIN section sec ON e.section_id = sec.section_id
					  JOIN admin ON sda.assigned_by = admin.admin_id
					  WHERE s.active_status = 1
					  $category_filter
					  ORDER BY sda.is_active DESC, s.name ASC";
			$all_data = $this->db->query($query, [get_settings('running_year'), get_settings('running_term')])->result_array();
			
			// Filter by enabled modules
			$filtered_data = [];
			foreach($all_data as $row) {
				$include = true;
				
				// Check if it's a daily fees discount
				if($row['discount_category'] === 'daily_fees' && !empty($row['discount_type'])) {
					$types = explode(',', $row['discount_type']);
					$enabled_types = [];
					
					foreach($types as $type) {
						$type = trim($type);
						// Check if this fee module is enabled
						if(is_fee_module_enabled($type)) {
							$enabled_types[] = $type;
						}
					}
					
					// Only include if at least one type is enabled
					if(empty($enabled_types)) {
						$include = false;
					} else {
						// Update discount_type to only show enabled ones
						$row['discount_type'] = implode(',', $enabled_types);
					}
				}
				
				// Check if it's an invoice discount with specific bill items
				if($row['discount_category'] === 'invoice' && !empty($row['bill_item_ids']) && $row['bill_item_ids'] !== '*') {
					$bill_ids = explode(',', $row['bill_item_ids']);
					$valid_bills = [];
					
					foreach($bill_ids as $bill_id) {
						$bill_id = trim($bill_id);
						// Check if this bill item exists
						$exists = $this->db->where('id', $bill_id)->count_all_results('bill_item') > 0;
						if($exists) {
							$valid_bills[] = $bill_id;
						}
					}
					
					// Only include if at least one bill item exists
					if(empty($valid_bills)) {
						$include = false;
					} else {
						// Update bill_item_ids to only show valid ones
						$row['bill_item_ids'] = implode(',', $valid_bills);
					}
				}
				
				if($include) {
					$filtered_data[] = $row;
				}
			}
			
			echo json_encode(['status' => 'success', 'data' => $filtered_data]);
			return;
		}
		
		if($param1 == 'toggle_status') {
			$assignment_id = $this->input->post('assignment_id');
			$current_status = $this->db->where('assignment_id', $assignment_id)->get('student_discount_assignments')->row()->is_active;
			$new_status = $current_status ? 0 : 1;
			$this->db->where('assignment_id', $assignment_id)->update('student_discount_assignments', ['is_active' => $new_status]);
			echo json_encode(['status' => 'success', 'message' => $new_status ? get_phrase('discount_activated') : get_phrase('discount_deactivated')]);
			return;
		}
		
		if($param1 == 'delete') {
			$assignment_id = $this->input->post('assignment_id');
			$assignment = $this->db->where('assignment_id', $assignment_id)->get('student_discount_assignments')->row();
			
			$this->db->where('assignment_id', $assignment_id)->delete('student_discount_assignments');
			echo json_encode(['status' => 'success', 'message' => get_phrase('assignment_deleted')]);
			return;
		}
		
		if($param1 == 'approve') {
			$assignment_id = $this->input->post('assignment_id');
			$admin_id = $this->session->userdata('admin_id');
			$login_type = $this->session->userdata('login_type');
			$admin_level = $this->session->userdata('user_type');
			
			if($admin_level != 1 && $admin_level != '1') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_approve')]);
				return;
			}
			
			$this->db->where('assignment_id', $assignment_id)->update('student_discount_assignments', [
				'status' => 'approved',
				'is_active' => 1,
				'approved_by' => $admin_id,
				'approved_at' => date('Y-m-d H:i:s')
			]);
			
			echo json_encode(['status' => 'success', 'message' => get_phrase('assignment_approved')]);
			return;
		}
		
		if($param1 == 'reject') {
			$assignment_id = $this->input->post('assignment_id');
			$admin_id = $this->session->userdata('admin_id');
			$login_type = $this->session->userdata('login_type');
			$admin_level = $this->session->userdata('user_type');
			
			if($admin_level != 1 && $admin_level != '1') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_reject')]);
				return;
			}
			
			$this->db->where('assignment_id', $assignment_id)->update('student_discount_assignments', [
				'status' => 'rejected',
				'is_active' => 0
			]);
			
			echo json_encode(['status' => 'success', 'message' => get_phrase('assignment_rejected')]);
			return;
		}
		
		if($param1 == 'update') {
			$assignment_id = $this->input->post('assignment_id');
			$profile_id = $this->input->post('profile_id');
			$action = $this->input->post('action');
			
			if(empty($assignment_id) || empty($profile_id)) {
				echo json_encode(['status' => 'error', 'message' => get_phrase('invalid_data')]);
				return;
			}
			
			$profile = $this->db->where('profile_id', $profile_id)->where('is_active', 1)->get('discount_profiles')->row();
			if(!$profile) {
				echo json_encode(['status' => 'error', 'message' => get_phrase('invalid_profile')]);
				return;
			}
			
			$rule = $this->db->where('profile_id', $profile_id)->get('discount_profile_rules')->row();
			$this->db->where('assignment_id', $assignment_id)->update('student_discount_assignments', [
				'profile_id' => $profile_id,
				'discount_value' => $rule ? $rule->discount_value : $profile->discount_value
			]);
			
			echo json_encode(['status' => 'success', 'message' => get_phrase('assignment_updated')]);
			return;
		}
		
		if($param1 == 'bulk_deactivate') {
			$ids = $this->input->post('ids');
			if(!empty($ids)) {
				$this->db->where_in('assignment_id', $ids)->update('student_discount_assignments', ['is_active' => 0]);
				echo json_encode(['status' => 'success', 'message' => get_phrase('bulk_deactivation_successful')]);
			} else {
				echo json_encode(['status' => 'error', 'message' => get_phrase('no_items_selected')]);
			}
			return;
		}
		
		$page_data['classes'] = $this->db->get('class')->result_array();
		
		// Filter profiles based on user role
		$user_level = $this->session->userdata('user_type');
		$this->db->where('is_active', 1);
		if($user_level == 4) { // Cashier
			$this->db->where('discount_category', 'daily_fees');
		}
		$page_data['profiles'] = $this->db->get('discount_profiles')->result_array();
		
		$bill_items = $this->db->select('id, title')->from('bill_item')->get()->result_array();
		$page_data['bill_items_map'] = array_column($bill_items, 'title', 'id');
		
		$page_data['page_name'] = 'manage_discount_assignments';
		$page_data['page_title'] = get_phrase('manage_discount_assignments');

		if($param1 == 'bulk_toggle') {
			$ids = $this->input->post('ids');
			if(!empty($ids)) {
				foreach($ids as $id) {
					$current = $this->db->where('assignment_id', $id)->get('student_discount_assignments')->row();
					$this->db->where('assignment_id', $id)->update('student_discount_assignments', ['is_active' => $current->is_active ? 0 : 1]);
				}
				echo json_encode(['status' => 'success', 'message' => get_phrase('bulk_toggle_successful')]);
			} else {
				echo json_encode(['status' => 'error', 'message' => get_phrase('no_items_selected')]);
			}
			return;
		}

		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}
	
	function discount_profiles($param1 = '') {
		// Check if user is cashier (level 4)
		$user_level = $this->session->userdata('user_type');
		$is_cashier = ($user_level == 4);
		
		if($param1 == 'stats') {
			$this->db->select('*');
			if($is_cashier) {
				$this->db->where('discount_category', 'daily_fees');
			}
			$total = $this->db->count_all_results('discount_profiles');
			
			$this->db->where('is_active', 1);
			if($is_cashier) {
				$this->db->where('discount_category', 'daily_fees');
			}
			$active = $this->db->count_all_results('discount_profiles');
			
			$this->db->where('is_active', 0);
			if($is_cashier) {
				$this->db->where('discount_category', 'daily_fees');
			}
			$inactive = $this->db->count_all_results('discount_profiles');
			
			// For cashier, only show daily_fees counts
			if($is_cashier) {
				$invoice = 0;
				$daily = $total;
			} else {
				$invoice = $this->db->where('discount_category', 'invoice')->count_all_results('discount_profiles');
				$daily = $this->db->where('discount_category', 'daily_fees')->count_all_results('discount_profiles');
			}
			
			echo json_encode([
				'status' => 'success', 
				'data' => [
					'total' => $total, 
					'active' => $active, 
					'inactive' => $inactive, 
					'invoice' => $invoice, 
					'daily_fees' => $daily
				]
			]);
			return;
		}
		
		if($this->input->get('ajax')) {
			if($is_cashier) {
				$profiles = $this->db->where('discount_category', 'daily_fees')->get('discount_profiles')->result_array();
			} else {
				$profiles = $this->db->get('discount_profiles')->result_array();
			}
			echo json_encode(['status' => 'success', 'profiles' => $profiles]);
			return;
		}
		
		if($param1 == 'get_data') {
			$profile_id = $this->input->get('profile_id');
			$profile = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row_array();
			echo json_encode($profile);
			return;
		}
		
		if($param1 == 'create') {
			// Check if cashier is trying to create invoice discount
			$category = $this->input->post('discount_category');
			$user_level = $this->session->userdata('user_type');
			if($user_level == 4 && $category != 'daily_fees') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('you_can_only_create_daily_fees_discounts')]);
				return;
			}
			
			$discount_types = $this->input->post('discount_type');
			
			// Handle array or string
			if (is_array($discount_types)) {
				$discount_types = array_filter($discount_types);
				$discount_type_str = implode(',', $discount_types);
			} else {
				$discount_type_str = trim($discount_types);
			}
			
			$category = $this->input->post('discount_category');
			
			$data = [
				'profile_name' => $this->input->post('profile_name'),
				'discount_category' => $category,
				'discount_method' => $this->input->post('discount_method') ?: 'percentage',
				'discount_value' => $this->input->post('discount_value') ?: 0,
				'description' => $this->input->post('description'),
				'is_active' => 1,
				'created_by' => $this->session->userdata('login_user_id')
			];
			
			// Store IDs for invoice, names for daily_fees
			if ($category == 'invoice') {
				if ($discount_type_str == 'all_invoice_items' || strpos($discount_type_str, 'all_invoice_items') !== false) {
					$data['bill_item_ids'] = '*';
				} else {
					$data['bill_item_ids'] = $discount_type_str ?: NULL;
				}
				$data['discount_type'] = NULL;
			} elseif ($category == 'daily_fees') {
				$data['discount_type'] = $discount_type_str ?: NULL;
				$data['bill_item_ids'] = NULL;
			}
			
			try {
				$this->db->insert('discount_profiles', $data);
				echo json_encode(['status' => 'success', 'message' => get_phrase('profile_created_successfully')]);
			} catch (Exception $e) {
				$error = $this->db->error();
				if($error['code'] == 1062) {
					echo json_encode(['status' => 'error', 'message' => 'A profile with this name already exists. Please use a different name.']);
				} else {
					echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $error['message']]);
				}
			}
			return;
		}
		
		if($param1 == 'update') {
			// Check if cashier is trying to update to invoice discount
			$category = $this->input->post('discount_category');
			$user_level = $this->session->userdata('user_type');
			if($user_level == 4 && $category != 'daily_fees') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('you_can_only_update_daily_fees_discounts')]);
				return;
			}
			
			$profile_id = $this->input->post('profile_id');
			$action = $this->input->post('action');
			$discount_types = $this->input->post('discount_type');
			
			// Handle array or string
			if (is_array($discount_types)) {
				$discount_types = array_filter($discount_types);
				$discount_type_str = implode(',', $discount_types);
			} else {
				$discount_type_str = trim($discount_types);
			}
			
			$category = $this->input->post('discount_category');
			
			$data = [
				'profile_name' => $this->input->post('profile_name'),
				'discount_category' => $category,
				'discount_method' => $this->input->post('discount_method') ?: 'percentage',
				'discount_value' => $this->input->post('discount_value') ?: 0,
				'description' => $this->input->post('description')
			];
			
			// Store IDs for invoice, names for daily_fees
			if ($category == 'invoice') {
				if ($discount_type_str == 'all_invoice_items' || strpos($discount_type_str, 'all_invoice_items') !== false) {
					$data['bill_item_ids'] = '*';
				} else {
					$data['bill_item_ids'] = $discount_type_str ?: NULL;
				}
				$data['discount_type'] = NULL;
			} elseif ($category == 'daily_fees') {
				$data['discount_type'] = $discount_type_str ?: NULL;
				$data['bill_item_ids'] = NULL;
			}
			
			try {
				$this->db->where('profile_id', $profile_id)->update('discount_profiles', $data);
				echo json_encode(['status' => 'success', 'message' => get_phrase('profile_updated_successfully')]);
			} catch (Exception $e) {
				$error = $this->db->error();
				if($error['code'] == 1062) {
					echo json_encode(['status' => 'error', 'message' => 'A profile with this name already exists. Please use a different name.']);
				} else {
					echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $error['message']]);
				}
			}
			return;
		}
		
		if($param1 == 'delete') {
			$profile_id = $this->input->post('profile_id');
			$action = $this->input->post('action');
			$this->db->where('profile_id', $profile_id)->update('discount_profiles', ['is_active' => 0]);
			echo json_encode(['status' => 'success', 'message' => get_phrase('profile_deleted_successfully')]);
			return;
		}
		
		if($param1 == 'toggle_status') {
			$profile_id = $this->input->post('profile_id');
			$action = $this->input->post('action');
			$current = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row();
			$new_status = $current->is_active ? 0 : 1;
			$this->db->where('profile_id', $profile_id)->update('discount_profiles', ['is_active' => $new_status]);
			echo json_encode(['status' => 'success', 'message' => $new_status ? get_phrase('profile_activated') : get_phrase('profile_deactivated')]);
			return;
		}
		
		$page_data['profiles'] = $is_cashier 
			? $this->db->where('discount_category', 'daily_fees')->get('discount_profiles')->result_array()
			: $this->db->get('discount_profiles')->result_array();
		
		// Build bill_items_map for JavaScript
		$bill_items = $this->db->get('bill_item')->result_array();
		$bill_items_map = [];
		foreach($bill_items as $item) {
			$bill_items_map[$item['id']] = $item['title'];
		}
		$page_data['bill_items_map'] = $bill_items_map;
		
		$page_data['page_name'] = 'discount_profiles';
		$page_data['page_title'] = get_phrase('discount_profiles');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}
	
	function discount_profile_rules($profile_id, $param1 = '') {
		if($param1 == 'create') {
			$class_ids = $this->input->post('class_ids');
			$bill_category_id = $this->input->post('bill_category_id') ?: NULL;
			$discount_value = $this->input->post('discount_value');
			
			if(empty($class_ids)) {
				$data = [
					'profile_id' => $profile_id,
					'class_id' => NULL,
					'bill_category_id' => $bill_category_id,
					'discount_value' => $discount_value
				];
				$this->db->insert('discount_profile_rules', $data);
			} else {
				foreach($class_ids as $class_id) {
					$data = [
						'profile_id' => $profile_id,
						'class_id' => $class_id ?: NULL,
						'bill_category_id' => $bill_category_id,
						'discount_value' => $discount_value
					];
					$this->db->insert('discount_profile_rules', $data);
				}
			}
			echo json_encode(['status' => 'success', 'message' => get_phrase('rule_created_successfully')]);
			return;
		}
		
		if($param1 == 'update') {
			$rule_id = $this->input->post('rule_id');
			$data = [
				'class_id' => $this->input->post('class_id') ?: NULL,
				'bill_category_id' => $this->input->post('bill_category_id') ?: NULL,
				'discount_value' => $this->input->post('discount_value')
			];
			$this->db->where('rule_id', $rule_id)->update('discount_profile_rules', $data);
			echo json_encode(['status' => 'success', 'message' => get_phrase('rule_updated_successfully')]);
			return;
		}
		
		if($param1 == 'delete') {
			$rule_id = $this->input->post('rule_id');
			$this->db->where('rule_id', $rule_id)->delete('discount_profile_rules');
			echo json_encode(['status' => 'success', 'message' => get_phrase('rule_deleted_successfully')]);
			return;
		}
		
		$page_data['profile'] = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row_array();
		$page_data['rules'] = $this->db->where('profile_id', $profile_id)->get('discount_profile_rules')->result_array();
		$page_data['classes'] = $this->db->get('class')->result_array();
		
		// Get categories based on profile's discount_category
		if($page_data['profile']['discount_category'] == 'invoice') {
			$items = $this->db->get('bill_item')->result_array();
			$page_data['categories'] = [];
			foreach($items as $item) {
				$page_data['categories'][] = [
					'category_id' => $item['bill_item_id'],
					'name' => $item['title']
				];
			}
		} else {
			// For daily_fees, create manual categories
			$page_data['categories'] = [
				['category_id' => 'feeding', 'name' => 'Feeding'],
				['category_id' => 'classes', 'name' => 'Classes'],
				['category_id' => 'water', 'name' => 'Water'],
				['category_id' => 'breakfast', 'name' => 'Breakfast'],
				['category_id' => 'transport', 'name' => 'Transport']
			];
		}
		
		echo $this->load->view('backend/admin/discount_profile_rules', $page_data, TRUE);
	}
	
	// Get all discounts (pre-assigned + post-assigned)
	function get_all_discounts() {
		header('Content-Type: application/json');
		
		$year = $this->input->get('year');
		$term = $this->input->get('term');
		$category = $this->input->get('category');
		
		if(!$year) $year = get_settings('running_year');
		if(!$term) $term = get_settings('running_term');
		
		$result = [];
		
		// Get pre-assigned discounts
		$query = "SELECT sda.assignment_id as id, s.name as student_name, s.student_code, 
				dp.profile_name, dp.discount_type,
				a.name as assigned_by_name, sda.year, sda.term, 
				'pre-assigned' as discount_source, 'Active' as status
				FROM student_discount_assignments sda
				JOIN student s ON s.student_id = sda.student_id
				JOIN discount_profiles dp ON dp.profile_id = sda.profile_id
				JOIN admin a ON a.admin_id = sda.assigned_by
				WHERE sda.year = ? AND sda.term = ? AND sda.is_active = 1";
		
		$result = $this->db->query($query, [$year, $term])->result_array();
		
		foreach($result as &$row) {
			$row['rules'] = $this->db->where('profile_id', $row['id'])->get('discount_profile_rules')->result_array();
		}
		
		echo json_encode($result);
		exit;
	}
	
	function get_discount_stats() {
		// Get total count
		$total = $this->db->count_all('discount_profiles');
		
		// Get active count
		$active = $this->db->where('is_active', 1)->count_all_results('discount_profiles');
		
		// Get inactive count
		$inactive = $this->db->where('is_active', 0)->count_all_results('discount_profiles');
		
		// Get invoice count
		$invoice = $this->db->where('discount_category', 'invoice')->count_all_results('discount_profiles');
		
		// Get daily_fees count
		$daily_fees = $this->db->where('discount_category', 'daily_fees')->count_all_results('discount_profiles');
		
		// Debug: Get actual daily_fees records
		$daily_records = $this->db->where('discount_category', 'daily_fees')->get('discount_profiles')->result_array();
		
		echo json_encode([
			'status' => 'success',
			'data' => [
				'total' => $total,
				'active' => $active,
				'inactive' => $inactive,
				'invoice' => $invoice,
				'daily_fees' => $daily_fees
			],
			'debug' => [
				'daily_records_count' => count($daily_records),
				'daily_records' => $daily_records
			]
		]);
	}
	
	function create_discount_profile_modal() {
		// Load the create form modal
		$page_data['bill_items'] = $this->db->get('bill_item')->result_array();
		$page_data['classes'] = $this->db->get('class')->result_array();
		echo $this->load->view('backend/admin/create_discount_profile_modal', $page_data, TRUE);
	}
	
	function edit_discount_profile_modal($profile_id) {
		// Load the edit form modal with profile data
		$page_data['profile'] = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row_array();
		$page_data['bill_items'] = $this->db->get('bill_item')->result_array();
		$page_data['classes'] = $this->db->get('class')->result_array();
		echo $this->load->view('backend/admin/edit_discount_profile_modal', $page_data, TRUE);
	}
	
	function assign_students_to_profile_modal($profile_id) {
		// Load the assign students modal
		$profile = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row_array();
		
		// Filter by daily_fees category only for cashier role (level 4)
		$user_level = $this->session->userdata('user_type');
		if($user_level == 4 && $profile['discount_category'] != 'daily_fees') {
			echo json_encode(['status' => 'error', 'message' => get_phrase('you_do_not_have_permission_to_assign_this_profile')]);
			return;
		}
		
		$page_data['profile'] = $profile;
		$page_data['students'] = $this->db->select('s.*, c.name as class_name, sec.name as section_name')
			->from('student s')
			->join('enroll e', 's.student_id = e.student_id')
			->join('class c', 'e.class_id = c.class_id')
			->join('section sec', 'e.section_id = sec.section_id')
			->where('e.year', get_settings('running_year'))
			->where('e.term', get_settings('running_term'))
			->order_by('s.name', 'ASC')
			->get()->result_array();
		echo $this->load->view('backend/admin/assign_student_discount_modal', $page_data, TRUE);
	}
	
	function toggle_discount_profile_status() {
		$profile_id = $this->input->post('profile_id');
		$current = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row();
		
		if($current) {
			$new_status = $current->is_active ? 0 : 1;
			$this->db->where('profile_id', $profile_id)->update('discount_profiles', ['is_active' => $new_status]);
			echo json_encode([
				'status' => 'success',
				'message' => $new_status ? get_phrase('profile_activated') : get_phrase('profile_deactivated')
			]);
		} else {
			echo json_encode(['status' => 'error', 'message' => get_phrase('profile_not_found')]);
		}
	}
	
	function delete_discount_profile() {
		$profile_id = $this->input->post('profile_id');
		
		// Check if profile exists
		$profile = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row();
		
		if($profile) {
			// Soft delete: set is_active to 0
			$this->db->where('profile_id', $profile_id)->update('discount_profiles', ['is_active' => 0]);
			echo json_encode(['status' => 'success', 'message' => get_phrase('profile_deleted_successfully')]);
		} else {
			echo json_encode(['status' => 'error', 'message' => get_phrase('profile_not_found')]);
		}
	}
	
	function get_discount_filters() {
		$years = $this->db->select('DISTINCT year')->order_by('year', 'DESC')->get('student_discount_assignments')->result_array();
		$profiles = $this->db->where('is_active', 1)->get('discount_profiles')->result_array();
		echo json_encode(['years' => array_column($years, 'year'), 'profiles' => $profiles]);
	}
	
	function get_discount_assignments() {
		$year = $this->input->get('year');
		$term = $this->input->get('term');
		$profile_id = $this->input->get('profile_id');
		
		$this->db->select('sda.*, s.name as student_name, s.student_code, dp.profile_name, dp.discount_type, a.name as assigned_by_name')
			->from('student_discount_assignments sda')
			->join('student s', 's.student_id = sda.student_id')
			->join('discount_profiles dp', 'dp.profile_id = sda.profile_id')
			->join('admin a', 'a.admin_id = sda.assigned_by')
			->where('sda.is_active', 1);
		
		if($year) $this->db->where('sda.year', $year);
		if($term) $this->db->where('sda.term', $term);
		if($profile_id) $this->db->where('sda.profile_id', $profile_id);
		
		$result = $this->db->order_by('s.name', 'ASC')->get()->result_array();
		echo json_encode($result);
	}
	
	function unassign_discount() {
		$assignment_id = $this->input->post('assignment_id');
		$this->db->where('assignment_id', $assignment_id)->update('student_discount_assignments', ['is_active' => 0]);
		echo json_encode(['status' => 'success', 'message' => get_phrase('discount_unassigned_successfully')]);
	}
	
	// Unassign student from discount
	function unassign_student_discount() {
		$source = $this->input->post('source');
		$id = $this->input->post('id');
		
		if($source == 'pre-assigned') {
			$this->db->where('assignment_id', $id);
			$this->db->update('student_discount_assignments', ['is_active' => 0]);
		} else {
			$this->db->where('discount_id', $id);
			$this->db->delete('invoice_discounts');
		}
		
		echo json_encode(['status' => 'success', 'message' => get_phrase('discount_unassigned_successfully')]);
	}

	// Get discounts for DataTable
	function get_discounts() {
		$year = $this->input->post('year');
		$term = $this->input->post('term');
		$type = $this->input->post('discount_type');

		$this->db->select('d.*, s.name as student_name, a.name as applied_by_name');
		$this->db->from('invoice_discounts d');
		$this->db->join('student s', 's.student_id = d.student_id');
		$this->db->join('admin a', 'a.admin_id = d.applied_by');
		$this->db->join('invoice i', 'i.student_id = d.student_id AND i.invoice_code = d.invoice_code', 'left');
		$this->db->where('i.year', $year);
		$this->db->where('i.term', $term);
		
		if ($type) {
			$this->db->where('d.discount_type', $type);
		}

		$query = $this->db->get();
		$data = [];

		foreach ($query->result_array() as $row) {
			$data[] = [
				'applied_at' => date('Y-m-d H:i', strtotime($row['applied_at'])),
				'student_name' => $row['student_name'],
				'invoice_code' => $row['invoice_code'],
				'discount_type' => ucfirst(str_replace('_', ' ', $row['discount_type'])),
				'discount_method' => ucfirst($row['discount_method']),
				'discount_value' => $row['discount_value'] . ($row['discount_method'] == 'percentage' ? '%' : ''),
				'discount_amount' => number_format($row['discount_amount'], 2),
				'applied_by_name' => $row['applied_by_name'],
				'status' => '<span class="label label-' . ($row['status'] == 'approved' ? 'success' : 'warning') . '">' . ucfirst($row['status']) . '</span>'
			];
		}

		echo json_encode([
			'draw' => intval($this->input->post('draw')),
			'recordsTotal' => count($data),
			'recordsFiltered' => count($data),
			'data' => $data
		]);
	}

	// Get invoice summary with discounts
	function get_invoice_summary($student_id, $invoice_code) {
		$summary = $this->db->query(
			"SELECT * FROM invoice_summary 
			 WHERE student_id = ? AND invoice_code = ?",
			[$student_id, $invoice_code]
		)->row();

		echo json_encode($summary);
	}

	// Send payment reminder SMS
	function send_payment_reminder() {
		$student_id = $this->input->post('student_id');
		$invoice_code = $this->input->post('invoice_code');

		// Get student and parent info
		$student = $this->db->get_where('student', ['student_id' => $student_id])->row();
		$parent = $this->db->get_where('parent', ['parent_id' => $student->parent_id])->row();

		// Get invoice balance
		$balance = $this->db->select_sum('due')
			->where('student_id', $student_id)
			->where('invoice_code', $invoice_code)
			->get('invoice')->row()->due;

		$system_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
		$message = "Dear Parent, this is a reminder that {$student->name} has an outstanding balance of GHS {$balance} for invoice {$invoice_code}. Please make payment at your earliest convenience. - {$system_name}";

		$phones = [$parent->phone];
		$result = $this->sms_model->send_sms($message, $phones);

		// Log SMS
		$log_data = [
			'student_id' => $student_id,
			'parent_id' => $student->parent_id,
			'phone' => $parent->phone,
			'message' => $message,
			'type' => 'payment_reminder',
			'sent_at' => time(),
			'status' => $result ? 'sent' : 'failed'
		];
		$this->db->insert('sms_log', $log_data);

		echo json_encode(['status' => 'success', 'message' => get_phrase('reminder_sent_successfully')]);
	}



	// Apply invoice discount
	function apply_invoice_discount() {
		$student_id = $this->input->post('student_id');
		$invoice_code = $this->input->post('invoice_code');
		$discount_type = $this->input->post('discount_type');
		$discount_method = $this->input->post('discount_method');
		$discount_value = $this->input->post('discount_value');
		$reason = $this->input->post('reason');

		// Calculate total invoice amount
		$this->db->select_sum('amount');
		$this->db->where('student_id', $student_id);
		$this->db->where('invoice_code', $invoice_code);
		$total_query = $this->db->get('invoice');
		$total_amount = $total_query->row()->amount;

		if (!$total_amount || $total_amount <= 0) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('invalid_invoice')]);
			return;
		}

		// Calculate discount amount
		if ($discount_method == 'percentage') {
			$discount_amount = ($total_amount * $discount_value) / 100;
		} else {
			$discount_amount = $discount_value;
		}

		// Validate discount amount
		if ($discount_amount > $total_amount) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('discount_exceeds_total')]);
			return;
		}

		// Get invoice year and term
		$invoice_info = $this->db->select('year, term')
			->where('student_id', $student_id)
			->where('invoice_code', $invoice_code)
			->get('invoice')->row();
		
		// Insert discount record
		$discount_data = array(
			'student_id' => $student_id,
			'invoice_code' => $invoice_code,
			'year' => $invoice_info->year,
			'term' => $invoice_info->term,
			'discount_type' => $discount_type,
			'discount_method' => $discount_method,
			'discount_value' => $discount_value,
			'discount_amount' => $discount_amount,
			'reason' => $reason,
			'applied_by' => $this->session->userdata('login_user_id'),
			'applied_at' => date('Y-m-d H:i:s'),
			'status' => 'approved'
		);

		$this->db->insert('invoice_discounts', $discount_data);

		// Get count of invoice items
		$this->db->where('student_id', $student_id);
		$this->db->where('invoice_code', $invoice_code);
		$item_count = $this->db->count_all_results('invoice');

		if ($item_count > 0) {
			$discount_per_item = (floatval($discount_amount) / floatval($item_count));

			// Update invoice amounts
			$this->db->where('student_id', $student_id);
			$this->db->where('invoice_code', $invoice_code);
			$this->db->set('amount', 'amount - ' . $discount_per_item, FALSE);
			$this->db->set('due', 'due - ' . $discount_per_item, FALSE);
			$this->db->update('invoice');
		}

		echo json_encode(['status' => 'success', 'message' => get_phrase('discount_applied_successfully')]);
	}

	// Discount types list modal
	function discount_type_form($id = '') {
		$category_id = $this->input->get('category_id');
		if($id === 'add') {
			$page_data['discount_type'] = null;
			$page_data['category_id'] = $category_id;
			$this->load->view('backend/admin/modal_discount_type_form', $page_data);
		} elseif(!empty($id) && is_numeric($id)) {
			$page_data['discount_type'] = $this->db->get_where('discount_types', ['discount_type_id' => $id])->row();
			$page_data['category_id'] = $category_id;
			$this->load->view('backend/admin/modal_discount_type_form', $page_data);
		} else {
			$page_data['category_id'] = $category_id;
			$this->load->view('backend/admin/modal_discount_types_list', $page_data);
		}
	}

	// Save discount type
	function save_discount_type() {
		try {
			$id = $this->input->post('id');
			$name = trim($this->input->post('name'));
			$category_id = $this->input->post('category_id');

			// Validate name is not empty
			if (empty($name)) {
				echo json_encode(['status' => 'error', 'message' => 'Discount type name is required']);
				return;
			}

			// Validate category_id is not empty
			if (empty($category_id)) {
				echo json_encode(['status' => 'error', 'message' => 'Discount category is required']);
				return;
			}

			$code = strtolower(str_replace(' ', '_', $name));

			// Check for duplicate code
			if ($id) {
				$duplicate = $this->db->where('code', $code)
					->where('discount_type_id !=', $id)
					->get('discount_types')
					->row();
			} else {
				$duplicate = $this->db->where('code', $code)
					->get('discount_types')
					->row();
			}

			if ($duplicate) {
				echo json_encode(['status' => 'error', 'message' => 'A discount type with this name already exists']);
				return;
			}

			$data = [
				'name' => $name,
				'code' => $code,
				'category_id' => $category_id,
				'icon' => $this->input->post('icon'),
				'description' => $this->input->post('description'),
				'default_method' => $this->input->post('discount_method'),
				'default_value' => $this->input->post('discount_value'),
				'is_active' => $this->input->post('is_active') ? 1 : 0
			];

			if ($id) {
				$this->db->where('discount_type_id', $id);
				$this->db->update('discount_types', $data);
				$message = 'Discount type updated successfully';
			} else {
				$this->db->insert('discount_types', $data);
				$message = 'Discount type added successfully';
			}

			echo json_encode(['status' => 'success', 'message' => $message]);
		} catch (Exception $e) {
			log_message('error', 'save_discount_type error: ' . $e->getMessage());
			echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
		}
	}

	// Delete discount type
	function delete_discount_type() {
		try {
			$id = $this->input->post('id');
			
			if (empty($id)) {
				echo json_encode(['status' => 'error', 'message' => 'Discount type ID is required']);
				return;
			}
			
			$this->db->where('id', $id);
			$this->db->delete('discount_types');
			
			if ($this->db->affected_rows() > 0) {
				echo json_encode(['status' => 'success', 'message' => 'Discount type deleted successfully']);
			} else {
				echo json_encode(['status' => 'error', 'message' => 'Discount type not found or already deleted']);
			}
		} catch (Exception $e) {
			log_message('error', 'delete_discount_type error: ' . $e->getMessage());
			echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
		}
	}

	// SMS log report
	function sms_log_report() {
		$page_data['sms_logs'] = $this->db->order_by('sent_at', 'DESC')
			->limit(100)
			->get('sms_log')
			->result_array();
		$page_data['page_name'] = 'sms_log_report';
		$page_data['page_title'] = get_phrase('sms_log_report');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Request discount type approval
	function request_discount_approval() {
		$discount_type_id = $this->input->post('discount_type_id');
		$reason = $this->input->post('reason');
		$this->db->insert('discount_approvals', [
			'discount_type_id' => $discount_type_id,
			'requested_by' => $this->session->userdata('admin_id'),
			'reason' => $reason,
			'status' => 'pending'
		]);
		echo json_encode(['status' => 'success', 'message' => get_phrase('approval_request_submitted')]);
	}

	// Approve discount type
	function approve_discount_type() {
		if($this->session->userdata('admin_role') != '1') {
			echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_approve')]);
			return;
		}
		$approval_id = $this->input->post('approval_id');
		$notes = $this->input->post('notes');
		$this->db->where('approval_id', $approval_id);
		$this->db->update('discount_approvals', [
			'status' => 'approved',
			'approved_by' => $this->session->userdata('admin_id'),
			'approved_at' => date('Y-m-d H:i:s'),
			'approval_notes' => $notes
		]);
		echo json_encode(['status' => 'success', 'message' => get_phrase('discount_type_approved')]);
	}

	// Reject discount type
	function reject_discount_type() {
		if($this->session->userdata('admin_role') != '1') {
			echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_reject')]);
			return;
		}
		$approval_id = $this->input->post('approval_id');
		$notes = $this->input->post('notes');
		$this->db->where('approval_id', $approval_id);
		$this->db->update('discount_approvals', [
			'status' => 'rejected',
			'rejected_by' => $this->session->userdata('admin_id'),
			'rejected_at' => date('Y-m-d H:i:s'),
			'approval_notes' => $notes
		]);
		echo json_encode(['status' => 'success', 'message' => get_phrase('discount_type_rejected')]);
	}

	function get_details() {
		$assignment_id = $this->input->post('assignment_id');
		$source = $this->input->post('source');
		$currency = get_settings('currency');
		
		if($source == 'profile_assignment') {
			$this->db->select('sda.*, s.name as student_name, s.student_code, dp.profile_name, dp.discount_category, dp.discount_method, dp.discount_value, dp.bill_item_ids, dp.discount_type, c.name as class_name, c.name_numeric, sec.name as section_name, a.name as assigned_by_name, e.residence_type');
			$this->db->from('student_discount_assignments sda');
			$this->db->join('student s', 's.student_id = sda.student_id');
			$this->db->join('discount_profiles dp', 'dp.profile_id = sda.profile_id');
			$this->db->join('enroll e', 'e.student_id = sda.student_id AND e.year = sda.year AND e.term = sda.term');
			$this->db->join('class c', 'c.class_id = e.class_id');
			$this->db->join('section sec', 'sec.section_id = e.section_id');
			$this->db->join('admin a', 'a.admin_id = sda.assigned_by');
			$this->db->where('sda.assignment_id', $assignment_id);
			$details = $this->db->get()->row();
		} else {
			$this->db->select('id.*, s.name as student_name, s.student_code, c.name as class_name, c.name_numeric, sec.name as section_name, a.name as applied_by_name, dp.profile_name, dp.discount_category, dp.discount_method, dp.discount_value, dp.bill_item_ids, dp.discount_type, e.residence_type');
			$this->db->from('invoice_discounts id');
			$this->db->join('student s', 's.student_id = id.student_id');
			$this->db->join('enroll e', 'e.student_id = id.student_id AND e.year = id.year AND e.term = id.term');
			$this->db->join('class c', 'c.class_id = e.class_id');
			$this->db->join('section sec', 'sec.section_id = e.section_id');
			$this->db->join('admin a', 'a.admin_id = id.applied_by');
			$this->db->join('discount_profiles dp', 'dp.profile_id = id.profile_id', 'left');
			$this->db->where('id.discount_id', $assignment_id);
			$details = $this->db->get()->row();
		}
		
		if($details) {
			$method_text = $details->discount_method == 'percentage' ? $details->discount_value . '%' : $currency . number_format($details->discount_value, 2);
			$full_class_name = $details->class_name . ' ' . $details->name_numeric . ' ' . $details->section_name;
			
			// Get bill items for invoice category only
			$bill_items_text = '';
			if($details->discount_category == 'invoice') {
				if(empty($details->bill_item_ids) || $details->bill_item_ids == '[]' || $details->bill_item_ids == 'null') {
					$bill_items_text = 'All bill items';
				} else {
					$item_ids = json_decode($details->bill_item_ids, true);
					if(is_array($item_ids) && count($item_ids) > 0) {
						$items = $this->db->where_in('bill_item_id', $item_ids)->get('bill_items')->result_array();
						if(count($items) > 0) {
							$item_names = array_column($items, 'title');
							$bill_items_text = implode(', ', $item_names);
						} else {
							$bill_items_text = 'All bill items';
						}
					} else {
						$bill_items_text = 'All bill items';
					}
				}
			}
			
			// Get invoice totals if invoice discount
			$invoice_section = '';
			if($source == 'invoice_discount' && !empty($details->invoice_code)) {
				$invoice_query = $this->db->select_sum('amount')->where('invoice_code', $details->invoice_code)->get('invoice');
				$current_total = $invoice_query->row()->amount ?? 0;
				
				// Use the specific discount amount from this discount record
				$this_discount_amount = $details->discount_amount ?? 0;
				
				// Calculate original total (current + this discount if approved, or just current if pending)
				$original_total = $details->status == 'approved' ? ($current_total + $this_discount_amount) : $current_total;
				$new_total = $details->status == 'approved' ? $current_total : ($current_total - $this_discount_amount);
				
				$invoice_section = '
				<div class="col-12 mt-4">
					<div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 20px; border: 2px solid #0ea5e9;">
						<h6 style="color: #0c4a6e; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px;">
							<i class="fa fa-file-invoice" style="color: #0ea5e9;"></i> Invoice Summary
						</h6>
						<div class="row">
							<div class="col-md-4">
								<div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
									<div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Original Total</div>
									<div style="font-size: 24px; font-weight: 700; color: #475569; margin-top: 8px;">'.$currency.' '.number_format($original_total, 2).'</div>
								</div>
							</div>
							<div class="col-md-4">
								<div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
									<div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Discount</div>
									<div style="font-size: 24px; font-weight: 700; color: #ef4444; margin-top: 8px;">- '.$currency.' '.number_format($this_discount_amount, 2).'</div>
								</div>
							</div>
							<div class="col-md-4">
								<div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
									<div style="font-size: 12px; color: rgba(255,255,255,0.9); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">New Total</div>
									<div style="font-size: 24px; font-weight: 700; color: white; margin-top: 8px;">'.$currency.' '.number_format($new_total, 2).'</div>
								</div>
							</div>
						</div>
					</div>
				</div>';
			}
			
			$html = '
			<style>
				.detail-card { background: #f8fafc; border-radius: 8px; padding: 15px; margin-bottom: 12px; border-left: 4px solid #3b82f6; }
				.detail-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
				.detail-value { font-size: 15px; color: #1e293b; font-weight: 600; }
				.badge-modern { padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; }
			</style>
			<div class="row">
				<div class="col-md-6">
					<div class="detail-card">
						<div class="detail-label"><i class="fa fa-user"></i> Student</div>
						<div class="detail-value">'.$details->student_name.'</div>
						<div style="font-size: 13px; color: #64748b; margin-top: 4px;">'.$details->student_code.'</div>
					</div>
				</div>
				<div class="col-md-6">
					<div class="detail-card">
						<div class="detail-label"><i class="fa fa-school"></i> Class</div>
						<div class="detail-value">'.$full_class_name.'</div>
						<div style="font-size: 13px; color: #64748b; margin-top: 4px;">'.ucfirst($details->residence_type).'</div>
					</div>
				</div>
				<div class="col-md-6 mt-2">
					<div class="detail-card" style="border-left-color: #8b5cf6;">
						<div class="detail-label"><i class="fa fa-tag"></i> Discount Profile</div>
						<div class="detail-value">'.($details->profile_name ?: 'N/A').'</div>
						<div style="margin-top: 8px;">
							<span class="badge-modern" style="background: #ddd6fe; color: #6b21a8;">'.ucwords(str_replace('_', ' ', $details->discount_category)).'</span>
						</div>
					</div>
				</div>
				<div class="col-md-6 mt-2">
					<div class="detail-card" style="border-left-color: #10b981;">
						<div class="detail-label"><i class="fa fa-percent"></i> Discount Value</div>
						<div class="detail-value">'.$method_text.'</div>
						<div style="margin-top: 8px;">
							<span class="badge-modern" style="background: #d1fae5; color: #065f46;">'.ucfirst($details->discount_method).'</span>
							<span class="badge-modern" style="background: #fef3c7; color: #92400e;">Term '.$details->term.' / '.$details->year.'</span>
						</div>
					</div>
				</div>';
			
			if($bill_items_text) {
				$html .= '
				<div class="col-12 mt-2">
					<div class="detail-card" style="border-left-color: #f59e0b;">
						<div class="detail-label"><i class="fa fa-list"></i> Bill Items Covered</div>
						<div class="detail-value">'.$bill_items_text.'</div>
					</div>
				</div>';
			}
			
			$html .= $invoice_section;
			
			$html .= '
				<div class="col-12 mt-2">
					<div class="detail-card" style="border-left-color: #6366f1;">
						<div class="detail-label"><i class="fa fa-user-shield"></i> Assigned By</div>
						<div class="detail-value">'.($details->assigned_by_name ?: $details->applied_by_name).'</div>
					</div>
				</div>
			</div>';
			
			echo json_encode(['status' => 'success', 'html' => $html]);
		} else {
			echo json_encode(['status' => 'error', 'message' => 'Details not found']);
		}
	}

	// View and apply action to pending discounts and profile assignment approvals
	function discount_approvals($param1 = '') {
		if($param1 == 'get_data') {
			$year = get_settings('running_year');
			$term = get_settings('running_term');
			$status_filter = $this->input->get('status') ?: 'all';
			
			// Query for profile assignments
			$this->db->select("'profile_assignment' as source, sda.assignment_id as id, sda.student_id, 
					COALESCE(sda.status, 'pending') as status,
					s.name as student_name, s.student_code, sda.discount_type, sda.discount_category, sda.discount_value, sda.discount_method, NULL as discount_amount,
					CONCAT(c.name, ' ', c.name_numeric, ' ', sec.name) as class_name,
					dp.profile_name, admin.name as assigned_by_name, NULL as invoice_code, 
					sda.assigned_at as created_at", FALSE);
			$this->db->from('student_discount_assignments sda');
			$this->db->join('student s', 'sda.student_id = s.student_id');
			$this->db->join('discount_profiles dp', 'sda.profile_id = dp.profile_id');
			$this->db->join('enroll e', "s.student_id = e.student_id AND e.year = '$year' AND e.term = '$term'");
			$this->db->join('class c', 'e.class_id = c.class_id');
			$this->db->join('section sec', 'e.section_id = sec.section_id');
			$this->db->join('admin', 'sda.assigned_by = admin.admin_id');
			if($status_filter !== 'all') {
				$this->db->where('sda.status', $status_filter);
			}
			$query1 = $this->db->get_compiled_select();
			
			// Query for invoice discounts
			$this->db->select("'invoice_discount' as source, id.discount_id as id, id.student_id, 
					COALESCE(id.status, 'pending') as status,
					s.name as student_name, s.student_code, NULL as discount_type, id.discount_category, id.discount_value, id.discount_method, id.discount_amount,
					CONCAT(c.name, ' ', c.name_numeric, ' ', sec.name) as class_name,
					dp.profile_name, admin.name as assigned_by_name, id.invoice_code, 
					id.applied_at as created_at", FALSE);
			$this->db->from('invoice_discounts id');
			$this->db->join('student s', 'id.student_id = s.student_id');
			$this->db->join('enroll e', "s.student_id = e.student_id AND e.year = '$year' AND e.term = '$term'");
			$this->db->join('class c', 'e.class_id = c.class_id');
			$this->db->join('section sec', 'e.section_id = sec.section_id');
			$this->db->join('admin', 'id.applied_by = admin.admin_id', 'left');
			$this->db->join('discount_profiles dp', 'id.profile_id = dp.profile_id', 'left');
			if($status_filter !== 'all') {
				$this->db->where('id.status', $status_filter);
			}
			$query2 = $this->db->get_compiled_select();
			
			$final_query = "$query1 UNION ALL $query2 ORDER BY created_at DESC";
			$data = $this->db->query($final_query)->result_array();
			
			echo json_encode(['status' => 'success', 'data' => $data]);
			return;
		}
		
		if($param1 == 'approve') {
			$id = $this->input->post('id');
			$source = $this->input->post('source');
			$admin_id = $this->session->userdata('admin_id');
			$admin_level = $this->session->userdata('user_type');
			
			if($admin_level != 1 && $admin_level != '1') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_approve')]);
				return;
			}
			
			if($source === 'profile_assignment') {
				$this->db->where('assignment_id', $id)->update('student_discount_assignments', [
					'status' => 'approved',
					'is_active' => 1,
					'approved_by' => $admin_id,
					'approved_at' => date('Y-m-d H:i:s')
				]);
			} else {
				// Get discount details
				$discount = $this->db->where('discount_id', $id)->get('invoice_discounts')->row();
				
				if($discount) {
					// Update status
					$this->db->where('discount_id', $id)->update('invoice_discounts', [
						'status' => 'approved',
						'approved_by' => $admin_id,
						'approved_at' => date('Y-m-d H:i:s')
					]);
					
					// Apply discount to invoice items
					$invoice_items = $this->db->where('invoice_code', $discount->invoice_code)
						->where('student_id', $discount->student_id)
						->get('invoice')->result_array();
					
					$profile = $this->db->where('profile_id', $discount->profile_id)->get('discount_profiles')->row();
					
					// Get applicable bill items from profile
					$applicable_total = 0;
					$applicable_items = array();
					
					if($profile->bill_item_ids === '*') {
						// Wildcard: apply to ALL invoice items
						foreach($invoice_items as $idx => $item) {
							$applicable_total += $item['amount'];
							$applicable_items[] = $idx;
						}
					} else {
						// Specific items: match by bill_item_id
						$profile_bill_items = explode(',', $profile->bill_item_ids);
						foreach($invoice_items as $idx => $item) {
							// Get bill item details to match by title
							if(isset($item['bill_item_id'])) {
								if(in_array($item['bill_item_id'], $profile_bill_items)) {
									$applicable_total += $item['amount'];
									$applicable_items[] = $idx;
								}
							} else {
								// Match by title if bill_item_id not available
								foreach($profile_bill_items as $bill_item_id) {
									$bill_item = $this->db->where('id', trim($bill_item_id))->get('bill_item')->row();
									if($bill_item && strtolower(trim($item['title'])) == strtolower(trim($bill_item->title))) {
										$applicable_total += $item['amount'];
										$applicable_items[] = $idx;
										break;
									}
								}
							}
						}
					}
					
					if(count($applicable_items) > 0) {
						if($discount->discount_method == 'percentage') {
							// Percentage: each item gets percentage off its own amount
							foreach($applicable_items as $idx) {
								$item = $invoice_items[$idx];
								$item_discount = ($item['amount'] * $discount->discount_value) / 100;
								
								// $this->db->insert('invoice_discount_items', [
								// 	'discount_id' => $discount->discount_id,
								// 	'invoice_id' => $item['invoice_id'],
								// 	'invoice_code' => $discount->invoice_code,
								// 	'student_id' => $discount->student_id,
								// 	'item_title' => $item['title'],
								// 	'original_amount' => $item['amount'],
								// 	'discount_amount' => $item_discount,
								// 	'discounted_amount' => $item['amount'] - $item_discount
								// ]);
								
								$this->db->where('invoice_id', $item['invoice_id'])
									->update('invoice', [
										'amount' => $item['amount'] - $item_discount,
										'due' => $item['due'] - $item_discount
									]);
							}
						} else {
							// Fixed amount: proportionate distribution
							foreach($applicable_items as $idx) {
								$item = $invoice_items[$idx];
								$item_discount = ($item['amount'] / $applicable_total) * $discount->discount_amount;
								
								// $this->db->insert('invoice_discount_items', [
								// 	'discount_id' => $discount->discount_id,
								// 	'invoice_id' => $item['invoice_id'],
								// 	'invoice_code' => $discount->invoice_code,
								// 	'student_id' => $discount->student_id,
								// 	'item_title' => $item['title'],
								// 	'original_amount' => $item['amount'],
								// 	'discount_amount' => $item_discount,
								// 	'discounted_amount' => $item['amount'] - $item_discount
								// ]);
								
								$this->db->where('invoice_id', $item['invoice_id'])
									->update('invoice', [
										'amount' => $item['amount'] - $item_discount,
										'due' => $item['due'] - $item_discount
									]);
							}
						}
					}
				}
			}
			echo json_encode(['status' => 'success', 'message' => get_phrase('discount_approved')]);
			return;
		}
		
		if($param1 == 'reject') {
			$id = $this->input->post('id');
			$source = $this->input->post('source');
			$admin_level = $this->session->userdata('user_type');
			
			if($admin_level != 1 && $admin_level != '1') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_reject')]);
				return;
			}
			
			if($source === 'profile_assignment') {
				$this->db->where('assignment_id', $id)->update('student_discount_assignments', [
					'status' => 'rejected',
					'is_active' => 0
				]);
			} else {
				$this->db->where('discount_id', $id)->update('invoice_discounts', [
					'status' => 'rejected'
				]);
			}
			echo json_encode(['status' => 'success', 'message' => get_phrase('discount_rejected')]);
			return;
		}
		
		if($param1 == 'bulk_approve') {
			$items = $this->input->post('items');
			$admin_id = $this->session->userdata('admin_id');
			$admin_level = $this->session->userdata('user_type');
			
			if($admin_level != 1 && $admin_level != '1') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_approve')]);
				return;
			}
			
			if(empty($items)) {
				echo json_encode(['status' => 'error', 'message' => 'No items selected']);
				return;
			}
			
			$profile_ids = [];
			$invoice_ids = [];
			
			foreach($items as $item) {
				if($item['source'] === 'profile_assignment') {
					$profile_ids[] = $item['id'];
				} else {
					$invoice_ids[] = $item['id'];
				}
			}
			
			$total_count = count($items);
			
			if(!empty($profile_ids)) {
				$this->db->where_in('assignment_id', $profile_ids)
					->update('student_discount_assignments', [
						'status' => 'approved',
						'is_active' => 1,
						'approved_by' => $admin_id,
						'approved_at' => date('Y-m-d H:i:s')
					]);
			}
			
			if(!empty($invoice_ids)) {
				$this->db->where_in('discount_id', $invoice_ids)
					->update('invoice_discounts', [
						'status' => 'approved',
						'approved_by' => $admin_id,
						'approved_at' => date('Y-m-d H:i:s')
					]);
				
				// Apply each invoice discount
				foreach($invoice_ids as $discount_id) {
					$discount = $this->db->where('discount_id', $discount_id)->get('invoice_discounts')->row();
					
					if($discount) {
						$invoice_items = $this->db->where('invoice_code', $discount->invoice_code)
							->where('student_id', $discount->student_id)
							->get('invoice')->result_array();
						
						$profile = $this->db->where('profile_id', $discount->profile_id)->get('discount_profiles')->row();
						
						// Get applicable bill items from profile
						$applicable_total = 0;
						$applicable_items = array();
						
						if($profile->bill_item_ids === '*') {
							// Wildcard: apply to ALL invoice items
							foreach($invoice_items as $idx => $item) {
								$applicable_total += $item['amount'];
								$applicable_items[] = $idx;
							}
						} else {
							// Specific items: match by bill_item_id
							$profile_bill_items = explode(',', $profile->bill_item_ids);
							foreach($invoice_items as $idx => $item) {
								// Get bill item details to match by title
								if(isset($item['bill_item_id'])) {
									if(in_array($item['bill_item_id'], $profile_bill_items)) {
										$applicable_total += $item['amount'];
										$applicable_items[] = $idx;
									}
								} else {
									// Match by title if bill_item_id not available
									foreach($profile_bill_items as $bill_item_id) {
										$bill_item = $this->db->where('id', trim($bill_item_id))->get('bill_item')->row();
										if($bill_item && strtolower(trim($item['title'])) == strtolower(trim($bill_item->title))) {
											$applicable_total += $item['amount'];
											$applicable_items[] = $idx;
											break;
										}
									}
								}
							}
						}
						
						if(count($applicable_items) > 0) {
							foreach($applicable_items as $idx) {
								$item = $invoice_items[$idx];
								$item_discount = ($item['amount'] / $applicable_total) * $discount->discount_amount;
								
								$this->db->insert('invoice_discount_items', [
									'discount_id' => $discount->discount_id,
									'invoice_id' => $item['invoice_id'],
									'invoice_code' => $discount->invoice_code,
									'student_id' => $discount->student_id,
									'item_title' => $item['title'],
									'original_amount' => $item['amount'],
									'discount_amount' => $item_discount,
									'discounted_amount' => $item['amount'] - $item_discount
								]);
								
								$this->db->where('invoice_id', $item['invoice_id'])
									->update('invoice', [
										'amount' => $item['amount'] - $item_discount,
										'due' => $item['due'] - $item_discount
									]);
							}
						}
					}
				}
			}
			
			echo json_encode(['status' => 'success', 'message' => "$total_count discount(s) approved successfully"]);
			return;
		}
		
		if($param1 == 'bulk_reject') {
			$items = $this->input->post('items');
			$admin_level = $this->session->userdata('user_type');
			
			if($admin_level != 1 && $admin_level != '1') {
				echo json_encode(['status' => 'error', 'message' => get_phrase('only_super_admin_can_reject')]);
				return;
			}
			
			if(empty($items)) {
				echo json_encode(['status' => 'error', 'message' => 'No items selected']);
				return;
			}
			
			$profile_ids = [];
			$invoice_ids = [];
			
			foreach($items as $item) {
				if($item['source'] === 'profile_assignment') {
					$profile_ids[] = $item['id'];
				} else {
					$invoice_ids[] = $item['id'];
				}
			}
			
			$total_count = count($items);
			
			if(!empty($profile_ids)) {
				$this->db->where_in('assignment_id', $profile_ids)
					->update('student_discount_assignments', [
						'status' => 'rejected',
						'is_active' => 0
					]);
			}
			
			if(!empty($invoice_ids)) {
				$this->db->where_in('discount_id', $invoice_ids)
					->update('invoice_discounts', [
						'status' => 'rejected'
					]);
			}
			
			echo json_encode(['status' => 'success', 'message' => "$total_count discount(s) rejected successfully"]);
			return;
		}
		
		$page_data['page_name'] = 'discount_approvals';
		$page_data['page_title'] = get_phrase('discount_approvals');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Invoice summary view
	function invoice_summary($student_id = '', $invoice_code = '') {
		$page_data['page_name'] = 'invoice_summary';
		$page_data['page_title'] = get_phrase('invoice_summary');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Print invoice in new window
	function print_invoice($invoice_code = '') {
		$page_data['param2'] = $invoice_code;
		$this->load->view('backend/admin/print_invoice', $page_data);
	}

	// Student ledger report
	function student_ledger() {
		$page_data['page_name'] = 'student_ledger';
		$page_data['page_title'] = get_phrase('student_ledger');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Aging report
	function aging_report() {
		$page_data['page_name'] = 'aging_report';
		$page_data['page_title'] = get_phrase('aging_report');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Get student ledger data
	function get_student_ledger() {
		$student_id = $this->input->post('student_id');
		$year = $this->input->post('year');
		$term = $this->input->post('term');
		
		// Group by invoice_code and sum amounts
		$this->db->select('i.invoice_code, MIN(i.creation_timestamp) as creation_timestamp, MIN(s.name) as student_name, MIN(s.student_code) as student_code, MIN(i.year) as year, MIN(i.term) as term, 
						   SUM(i.amount) as total_amount, SUM(i.amount_paid) as total_paid, 
						   GROUP_CONCAT(DISTINCT i.title SEPARATOR ", ") as descriptions');
		$this->db->from('invoice i');
		$this->db->join('student s', 's.student_id = i.student_id');
		if($student_id) $this->db->where('i.student_id', $student_id);
		if($year) $this->db->where('i.year', $year);
		if($term) $this->db->where('i.term', $term);
		$this->db->group_by('i.invoice_code');
		$this->db->order_by('i.creation_timestamp', 'DESC');
		$transactions = $this->db->get()->result_array();
		
		$html = '<div class="data-card">';
		$html .= '<table id="ledgerTable" class="table-modern" style="width:100%"><thead><tr>';
		$html .= '<th>Date</th><th>Student</th><th>Description</th><th>Invoice Code</th>';
		$html .= '<th style="text-align:right">Debit</th><th style="text-align:right">Credit</th><th style="text-align:right">Balance</th></tr></thead><tbody>';
		
		$balance = 0;
		foreach($transactions as $t) {
			$balance += $t['total_amount'] - $t['total_paid'];
			$html .= '<tr>';
			$html .= '<td>'.date('M d, Y', $t['creation_timestamp']).'</td>';
			$html .= '<td>'.$t['student_name'].'</td>';
			$html .= '<td>'.$t['descriptions'].'</td>';
			$html .= '<td>'.$t['invoice_code'].'</td>';
			$html .= '<td class="debit" style="text-align:right"><sup class="currency">GHS</sup> '.number_format($t['total_amount'], 2).'</td>';
			$html .= '<td class="credit" style="text-align:right"><sup class="currency">GHS</sup> '.number_format($t['total_paid'], 2).'</td>';
			$html .= '<td class="balance" style="text-align:right"><sup class="currency">GHS</sup> '.number_format($balance, 2).'</td>';
			$html .= '</tr>';
		}
		$html .= '</tbody></table></div>';
		
		echo json_encode(['status' => 'success', 'html' => $html]);
	}

	// Get aging report data
	function get_aging_report() {
		// Group by invoice_code and sum amounts
		$this->db->select('MIN(i.student_id) as student_id, i.invoice_code, MIN(i.creation_timestamp) as creation_timestamp, SUM(i.due) as total_due, MIN(s.name) as student_name, MIN(e.class_id) as class_id');
		$this->db->from('invoice i');
		$this->db->join('student s', 's.student_id = i.student_id');
		$this->db->join('enroll e', 'e.student_id = i.student_id AND e.year = i.year AND e.term = i.term');
		$this->db->where('i.due >', 0);
		$this->db->group_by('i.invoice_code');
		$invoices = $this->db->get()->result_array();
		
		$summary = ['current' => 0, 'current_count' => 0, 'days30' => 0, 'days30_count' => 0, 'days60' => 0, 'days60_count' => 0, 'days90' => 0, 'days90_count' => 0];
		$details = [];
		
		foreach($invoices as $inv) {
			$days = floor((time() - $inv['creation_timestamp']) / 86400);
			$category = $days <= 30 ? 'Current' : ($days <= 60 ? '31-60 Days' : ($days <= 90 ? '61-90 Days' : 'Over 90 Days'));
			
			if($days <= 30) { $summary['current'] += $inv['total_due']; $summary['current_count']++; }
			elseif($days <= 60) { $summary['days30'] += $inv['total_due']; $summary['days30_count']++; }
			elseif($days <= 90) { $summary['days60'] += $inv['total_due']; $summary['days60_count']++; }
			else { $summary['days90'] += $inv['total_due']; $summary['days90_count']++; }
			
			$details[] = [
				'student_name' => $inv['student_name'],
				'class_name' => $this->crud_model->getFullClassName($inv['class_id']),
				'invoice_code' => $inv['invoice_code'],
				'invoice_date' => date('M d, Y', $inv['creation_timestamp']),
				'days_outstanding' => $days,
				'amount_due' => $inv['total_due'],
				'age_category' => $category
			];
		}
		
		echo json_encode(['status' => 'success', 'summary' => $summary, 'details' => $details]);
	}

	// Export student ledger
	function export_student_ledger() {
		$student_id = $this->input->get('student_id');
		$year = $this->input->get('year');
		$term = $this->input->get('term');
		
		$this->db->select('i.*, s.name as student_name');
		$this->db->from('invoice i');
		$this->db->join('student s', 's.student_id = i.student_id');
		if($student_id) $this->db->where('i.student_id', $student_id);
		if($year) $this->db->where('i.year', $year);
		if($term) $this->db->where('i.term', $term);
		$this->db->order_by('i.creation_timestamp', 'DESC');
		$transactions = $this->db->get()->result_array();
		
		header('Content-Type: text/csv');
		header('Content-Disposition: attachment; filename="student_ledger_'.date('Y-m-d').'.csv"');
		
		$output = fopen('php://output', 'w');
		fputcsv($output, ['Date', 'Student', 'Description', 'Invoice Code', 'Debit', 'Credit', 'Balance']);
		
		$balance = 0;
		foreach($transactions as $t) {
			$balance += $t['amount'] - $t['amount_paid'];
			fputcsv($output, [
				date('M d, Y', $t['creation_timestamp']),
				$t['student_name'],
				$t['title'],
				$t['invoice_code'],
				number_format($t['amount'], 2),
				number_format($t['amount_paid'], 2),
				number_format($balance, 2)
			]);
		}
		fclose($output);
	}

	// Export aging report
	function export_aging_report() {
		$this->db->select('i.student_id, i.invoice_code, i.creation_timestamp, i.due, s.name as student_name, c.name as class_name');
		$this->db->from('invoice i');
		$this->db->join('student s', 's.student_id = i.student_id');
		$this->db->join('enroll e', 'e.student_id = i.student_id AND e.year = i.year AND e.term = i.term');
		$this->db->join('class c', 'c.class_id = e.class_id');
		$this->db->where('i.due >', 0);
		$this->db->group_by('i.student_id, i.invoice_code');
		$invoices = $this->db->get()->result_array();
		
		header('Content-Type: text/csv');
		header('Content-Disposition: attachment; filename="aging_report_'.date('Y-m-d').'.csv"');
		
		$output = fopen('php://output', 'w');
		fputcsv($output, ['Student', 'Class', 'Invoice Code', 'Invoice Date', 'Days Outstanding', 'Amount Due', 'Category']);
		
		foreach($invoices as $inv) {
			$days = floor((time() - $inv['creation_timestamp']) / 86400);
			$category = $days <= 30 ? 'Current' : ($days <= 60 ? '31-60 Days' : ($days <= 90 ? '61-90 Days' : 'Over 90 Days'));
			fputcsv($output, [
				$inv['student_name'],
				$inv['class_name'],
				$inv['invoice_code'],
				date('M d, Y', $inv['creation_timestamp']),
				$days,
				number_format($inv['due'], 2),
				$category
			]);
		}
		fclose($output);
	}

	// SMS Automation page
	function sms_automation() {
		$page_data['page_name'] = 'sms_automation';
		$page_data['page_title'] = get_phrase('sms_automation');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	// Get SMS templates
	function get_sms_templates() {
		$templates = $this->db->get('sms_templates')->result_array();
		echo json_encode($templates);
	}

	// Get SMS schedules
	function get_sms_schedules() {
		$this->db->select('s.*, t.name as template_name');
		$this->db->from('sms_schedules s');
		$this->db->join('sms_templates t', 't.code = s.template_code');
		$schedules = $this->db->get()->result_array();
		echo json_encode($schedules);
	}

	// Send bulk payment reminders
	function send_bulk_payment_reminders() {
		$criteria = $this->input->post('criteria');
		$template_code = $this->input->post('template');
		
		$this->db->select('i.student_id, i.invoice_code, i.due, i.creation_timestamp, s.name as student_name, p.name as parent_name, p.phone');
		$this->db->from('invoice i');
		$this->db->join('student s', 's.student_id = i.student_id');
		$this->db->join('parent p', 'p.parent_id = s.parent_id');
		$this->db->where('i.due >', 0);
		
		if($criteria == 'overdue_30') {
			$this->db->where('i.creation_timestamp <', time() - (30 * 86400));
		} elseif($criteria == 'overdue_60') {
			$this->db->where('i.creation_timestamp <', time() - (60 * 86400));
		} elseif($criteria == 'overdue_90') {
			$this->db->where('i.creation_timestamp <', time() - (90 * 86400));
		}
		
		$this->db->group_by('i.student_id');
		$students = $this->db->get()->result_array();
		
		$template = $this->db->get_where('sms_templates', ['code' => $template_code])->row();
		$school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
		
		$sent = 0;
		foreach($students as $student) {
			$message = str_replace(
				['{parent_name}', '{student_name}', '{amount}', '{invoice_code}', '{school_name}', '{days}'],
				[$student['parent_name'], $student['student_name'], number_format($student['due'], 2), $student['invoice_code'], $school_name, floor((time() - $student['creation_timestamp']) / 86400)],
				$template->message
			);
			
			if($this->sms_model->send_sms($message, [$student['phone']])) {
				$sent++;
				$this->db->insert('sms_log', [
					'student_id' => $student['student_id'],
					'phone' => $student['phone'],
					'message' => $message,
					'type' => 'bulk_reminder',
					'sent_at' => time(),
					'status' => 'sent'
				]);
			}
		}
		
		echo json_encode(['status' => 'success', 'message' => $sent.' SMS sent successfully']);
	}

	public function daily_reconciliation() {
		$page_data['page_name'] = 'daily_reconciliation';
		$page_data['page_title'] = get_phrase('daily_reconciliation');
		$this->load->view('backend/main', $page_data);
	}

	public function collection_efficiency() {
		$page_data['page_name'] = 'collection_efficiency';
		$page_data['page_title'] = get_phrase('collection_efficiency');
		$this->load->view('backend/main', $page_data);
	}

	public function financial_alerts() {
		$page_data['page_name'] = 'financial_alerts';
		$page_data['page_title'] = get_phrase('financial_alerts');
		$this->load->view('backend/main', $page_data);
	}

	public function collector_handover() {
		$page_data['page_name'] = 'collector_handover';
		$page_data['page_title'] = get_phrase('collector_handover');
		$this->load->view('backend/main', $page_data);
	}


    public function get_financial_alerts() {
        $alerts = [];
        $currency = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
        
        // Critical outstanding balances
        $this->db->select('s.student_id, s.name, s.student_code, SUM(i.due) as total_due, MIN(i.creation_timestamp) as oldest');
        $this->db->from('invoice i');
        $this->db->join('student s', 's.student_id = i.student_id');
        $this->db->where('i.due >', 0);
        $this->db->where('i.creation_timestamp <', time() - (90 * 86400));
        $this->db->group_by('i.student_id');
        $this->db->having('total_due >', 1000);
        $this->db->limit(3);
        $critical_debts = $this->db->get()->result_array();
        
        foreach ($critical_debts as $debt) {
            $days = floor((time() - $debt['oldest']) / 86400);
            $alert_key = 'debt_' . $debt['student_id'];
            if (!$this->is_alert_resolved($alert_key)) {
                $alerts[] = [
                    'id' => $alert_key,
                    'severity' => 'critical',
                    'title' => 'Critical Outstanding Balance Detected',
                    'description' => "Student {$debt['name']} (ID: {$debt['student_code']}) has outstanding balance of {$currency} " . number_format($debt['total_due'], 2) . " exceeding {$days} days.",
                    'category' => 'Receivables',
                    'timestamp' => floor($days / 30) . ' months ago',
                    'icon' => 'exclamation-triangle'
                ];
            }
        }
        
        // Collection efficiency
        $today_start = strtotime(date('Y-m-d') . ' 00:00:00');
        $today_end = strtotime(date('Y-m-d') . ' 23:59:59');
        $this->db->select('SUM(feeding_amount) + SUM(classes_amount) +  SUM(breakfast_amount) + SUM(water_amount) as total');
        $this->db->where('payment_date >=', $today_start);
        $this->db->where('payment_date <=', $today_end);
        $today_collection = $this->db->get('daily_fee_transactions')->row();
        
        $target = 15000;
        $rate = $target > 0 ? ($today_collection->total / $target) * 100 : 0;
        
        if ($rate < 70 && !$this->is_alert_resolved('efficiency_' . date('Y-m-d'))) {
            $alerts[] = [
                'id' => 'efficiency_' . date('Y-m-d'),
                'severity' => 'high',
                'title' => 'Collection Rate Below Target',
                'description' => "Today's collection efficiency is " . number_format($rate, 1) . "% - below the 70% target threshold.",
                'category' => 'Performance',
                'timestamp' => '3 hours ago',
                'icon' => 'chart-line'
            ];
        }
        
        // Bank reconciliation overdue
        if ($this->db->table_exists('bank_accounts')) {
            $this->db->select('account_name, account_number, last_reconciled');
            $this->db->where('last_reconciled <', time() - (7 * 86400));
            $this->db->or_where('last_reconciled', null);
            $overdue_accounts = $this->db->get('bank_accounts')->result_array();
            
            foreach ($overdue_accounts as $account) {
                $days = $account['last_reconciled'] ? floor((time() - $account['last_reconciled']) / 86400) : 30;
                $alert_key = 'recon_' . $account['account_number'];
                if (!$this->is_alert_resolved($alert_key)) {
                    $alerts[] = [
                        'id' => $alert_key,
                        'severity' => 'high',
                        'title' => 'Bank Reconciliation Overdue',
                        'description' => "Account {$account['account_name']} ({$account['account_number']}) has not been reconciled for {$days} days.",
                        'category' => 'Reconciliation',
                        'timestamp' => $days . ' days ago',
                        'icon' => 'university'
                    ];
                }
            }
        }
        
        // Rapid transaction detection
        $this->db->select('collector_id, COUNT(*) as count, MIN(payment_date) as first, MAX(payment_date) as last');
        $this->db->where('payment_date >=', time() - 600);
        $this->db->group_by('collector_id');
        $this->db->having('count >', 10);
        $rapid_trans = $this->db->get('daily_fee_transactions')->result_array();
        
        foreach ($rapid_trans as $trans) {
            $minutes = floor(($trans['last'] - $trans['first']) / 60);
            $collector = $this->db->get_where('admin', ['admin_id' => $trans['collector_id']])->row();
            $alert_key = 'rapid_' . $trans['collector_id'] . '_' . date('YmdH');
            if (!$this->is_alert_resolved($alert_key) && $collector) {
                $alerts[] = [
                    'id' => $alert_key,
                    'severity' => 'medium',
                    'title' => 'Unusual Transaction Pattern Detected',
                    'description' => "Collector {$collector->name} recorded {$trans['count']} transactions in {$minutes} minutes. Possible data entry anomaly.",
                    'category' => 'Anomaly Detection',
                    'timestamp' => 'Just now',
                    'icon' => 'flag'
                ];
            }
        }
        
        // Success alert
        if ($rate >= 100 && !$this->is_alert_resolved('success_' . date('Y-m-d'))) {
            $alerts[] = [
                'id' => 'success_' . date('Y-m-d'),
                'severity' => 'low',
                'title' => 'Daily Collection Target Achieved',
                'description' => "Congratulations! Daily collection target achieved with " . number_format($rate, 1) . "% efficiency.",
                'category' => 'Success',
                'timestamp' => '2 hours ago',
                'icon' => 'check-circle'
            ];
        }
        
        echo json_encode($alerts);
    }

    private function is_alert_resolved($alert_key) {
        $this->db->where('alert_key', $alert_key);
        $this->db->where('resolved_at >', time() - (7 * 86400)); // 7 days
        return $this->db->count_all_results('financial_alert_resolutions') > 0;
    }

    public function resolve_financial_alert() {
        $alert_id = $this->input->post('alert_id');
        $notes = $this->input->post('notes');
        
        $data = [
            'alert_key' => $alert_id,
            'resolved_by' => $this->session->userdata('login_user_id'),
            'resolved_at' => time(),
            'notes' => $notes
        ];
        
        $this->db->insert('financial_alert_resolutions', $data);
        echo json_encode(['status' => 'success', 'message' => get_phrase('alert_resolved_successfully')]);
    }

    public function alert_history() {
        $page_data['page_name'] = 'alert_history';
        $page_data['page_title'] = get_phrase('alert_history');
        $this->load->view('backend/main', $page_data);
    }

    public function get_alert_history() {
        $this->db->select('r.*, a.name as resolved_by_name');
        $this->db->from('financial_alert_resolutions r');
        $this->db->join('admin a', 'a.admin_id = r.resolved_by');
        $this->db->order_by('r.resolved_at', 'DESC');
        $this->db->limit(100);
        $history = $this->db->get()->result_array();
        echo json_encode($history);
    }

    public function alert_settings($param1 = '') {
        if ($param1 == 'update') {
            $settings = [
                'outstanding_threshold' => $this->input->post('outstanding_threshold'),
                'outstanding_days' => $this->input->post('outstanding_days'),
                'collection_target' => $this->input->post('collection_target'),
                'collection_threshold' => $this->input->post('collection_threshold'),
                'reconciliation_days' => $this->input->post('reconciliation_days'),
                'rapid_transaction_count' => $this->input->post('rapid_transaction_count'),
                'rapid_transaction_minutes' => $this->input->post('rapid_transaction_minutes'),
                'email_notifications' => $this->input->post('email_notifications'),
                'notification_emails' => $this->input->post('notification_emails')
            ];
            
            foreach ($settings as $key => $value) {
                $this->db->where('type', 'alert_' . $key);
                if ($this->db->count_all_results('settings') > 0) {
                    $this->db->where('type', 'alert_' . $key);
                    $this->db->update('settings', ['description' => $value]);
                } else {
                    $this->db->insert('settings', ['type' => 'alert_' . $key, 'description' => $value]);
                }
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Settings updated successfully']);
            return;
        }
        
        $page_data['page_name'] = 'alert_settings';
        $page_data['page_title'] = get_phrase('alert_settings');
        $this->load->view('backend/main', $page_data);
    }

    private function send_alert_email($alert) {
        $email_enabled = $this->db->get_where('settings', ['type' => 'alert_email_notifications'])->row();
        if (!$email_enabled || $email_enabled->description != '1') return;
        
        $emails = $this->db->get_where('settings', ['type' => 'alert_notification_emails'])->row();
        if (!$emails) return;
        
        $email_list = explode(',', $emails->description);
        $school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
        
        $subject = "[{$alert['severity']}] Financial Alert: {$alert['title']}";
        $message = "<h3>{$alert['title']}</h3><p>{$alert['description']}</p><p><strong>Category:</strong> {$alert['category']}<br><strong>Severity:</strong> {$alert['severity']}<br><strong>Time:</strong> {$alert['timestamp']}</p>";
        
        foreach ($email_list as $email) {
            $this->email_model->do_email($message, $subject, trim($email), $school_name);
        }
    }

    // Audit Trail Viewer
    function audit_trail() {
        $page_data['page_name'] = 'audit_trail';
        $page_data['page_title'] = get_phrase('audit_trail');
        $this->load->view('backend/main', $page_data);
    }

    function get_audit_trail() {
        
        $columns = ['audit_id', 'performed_at', 'record_type', 'record_id', 'action', 'performed_by', 'ip_address', 'notes'];
        
        $limit = $this->input->post('length');
        $start = $this->input->post('start');
        $order = $columns[$this->input->post('order')[0]['column']] ?? 'performed_at';
        $dir = $this->input->post('order')[0]['dir'] ?? 'desc';
        $search = $this->input->post('search')['value'] ?? '';
        
        $filter_type = $this->input->post('filter_type');
        $filter_action = $this->input->post('filter_action');
        $filter_date_from = $this->input->post('filter_date_from');
        $filter_date_to = $this->input->post('filter_date_to');
        
        $this->db->select('audit_trail.*, admin.name as performed_by_name');
        $this->db->from('audit_trail');
        $this->db->join('admin', 'admin.admin_id = audit_trail.performed_by', 'left');
        
        if ($filter_type) $this->db->where('record_type', $filter_type);
        if ($filter_action) $this->db->where('action', $filter_action);
        if ($filter_date_from) $this->db->where('DATE(performed_at) >=', $filter_date_from);
        if ($filter_date_to) $this->db->where('DATE(performed_at) <=', $filter_date_to);
        if ($search) {
            $this->db->group_start();
            $this->db->like('admin.name', $search);
            $this->db->or_like('record_type', $search);
            $this->db->or_like('action', $search);
            $this->db->or_like('notes', $search);
            $this->db->group_end();
        }
        
        $totalFiltered = $this->db->count_all_results('', false);
        $this->db->order_by($order, $dir);
        $this->db->limit($limit, $start);
        $query = $this->db->get();
        
        $data = [];
        foreach ($query->result() as $row) {
            $action_class = 'action-' . strtolower($row->action);
            $data[] = [
                'timestamp' => date('Y-m-d H:i:s', strtotime($row->performed_at)),
                'record_type' => '<span class="label label-info">' . ucfirst($row->record_type) . '</span>',
                'record_id' => $row->record_id,
                'action' => '<span class="action-badge ' . $action_class . '">' . ucfirst($row->action) . '</span>',
                'performed_by' => $row->performed_by_name ?? 'System',
                'ip_address' => $row->ip_address ?? 'N/A',
                'notes' => $row->notes ?? '-'
            ];
        }
        
        echo json_encode([
            'draw' => intval($this->input->post('draw')),
            'recordsTotal' => $this->db->count_all('audit_trail'),
            'recordsFiltered' => $totalFiltered,
            'data' => $data
        ]);
    }

    function export_audit_trail() {
        $this->load->dbutil();
        
        $filter_type = $this->input->get('type');
        $filter_action = $this->input->get('action');
        $filter_date_from = $this->input->get('date_from');
        $filter_date_to = $this->input->get('date_to');
        
        $this->db->select('audit_trail.*, admin.name as performed_by_name');
        $this->db->from('audit_trail');
        $this->db->join('admin', 'admin.admin_id = audit_trail.performed_by', 'left');
        
        if ($filter_type) $this->db->where('record_type', $filter_type);
        if ($filter_action) $this->db->where('action', $filter_action);
        if ($filter_date_from) $this->db->where('DATE(performed_at) >=', $filter_date_from);
        if ($filter_date_to) $this->db->where('DATE(performed_at) <=', $filter_date_to);
        
        $this->db->order_by('performed_at', 'DESC');
        $query = $this->db->get();
        
        $delimiter = ",";
        $newline = "\r\n";
        $filename = 'audit_trail_' . date('Y-m-d_His') . '.csv';
        
        $data = $this->dbutil->csv_from_result($query, $delimiter, $newline);
        force_download($filename, $data);
    }

    function get_audit_stats() {
        $this->db->where('action', 'lock');
        $total_locks = $this->db->count_all_results('audit_trail');
        
        $this->db->where('action', 'unlock');
        $total_unlocks = $this->db->count_all_results('audit_trail');
        
        $this->db->where('action', 'edit');
        $total_edits = $this->db->count_all_results('audit_trail');
        
        $this->db->where('DATE(performed_at)', date('Y-m-d'));
        $today_actions = $this->db->count_all_results('audit_trail');
        
        echo json_encode([
            'total_locks' => $total_locks,
            'total_unlocks' => $total_unlocks,
            'total_edits' => $total_edits,
            'today_actions' => $today_actions
        ]);
    }
    // Filter student receipts
    function filter_student_receipts() {
        $student_id = $this->input->post('student_id');
        $start_date = $this->input->post('start_date');
        $end_date = $this->input->post('end_date');
        $year = $this->input->post('year');
        $term = $this->input->post('term');
        $currency = $this->db->get_where('settings', array('type' => 'currency'))->row()->description;
        
        $this->db->where('student_id', $student_id);
        // Exclude daily fee receipts (where invoice_code and invoice_id are NULL)
        $this->db->where('invoice_code IS NOT NULL', NULL, FALSE);
        $this->db->where('invoice_id IS NOT NULL', NULL, FALSE);
        
        if($start_date) {
            $start_timestamp = strtotime(str_replace('-', '/', $start_date));
            $this->db->where('timestamp >=', $start_timestamp);
        }
        
        if($end_date) {
            $end_timestamp = strtotime(str_replace('-', '/', $end_date) . ' 23:59:59');
            $this->db->where('timestamp <=', $end_timestamp);
        }
        
        if($year) $this->db->where('year', $year);
        if($term) $this->db->where('term', $term);
        
        // Group by receipt_code since single payment can cover multiple invoices
        $this->db->group_by('receipt_code');
        $this->db->order_by('timestamp', 'DESC');
        $receipts = $this->db->get('payment')->result_array();
        
        $theme_color = $this->db->get_where('settings', array('type' => 'theme_color'))->row()->description;
        if(strpos($theme_color, '#') !== 0) {
            $theme_color = '#' . $theme_color;
        }
        
        if(count($receipts) > 0) {
            foreach($receipts as $receipt) {
                // Get all invoice codes covered by this receipt
                $invoice_codes = $this->db->select('invoice_code, amount')
                    ->from('payment')
                    ->where('receipt_code', $receipt['receipt_code'])
                    ->where('student_id', $student_id)
                    ->get()
                    ->result_array();
                $invoice_codes_list = array_unique(array_column($invoice_codes, 'invoice_code'));
                $total_amount = array_sum(array_column($invoice_codes, 'amount'));
                $invoice_display = count($invoice_codes_list) > 1 ? 
                    '#' . implode(', #', array_slice($invoice_codes_list, 0, 2)) . (count($invoice_codes_list) > 2 ? '...' : '') : 
                    '#' . $invoice_codes_list[0];
                
                $payment_method = '';
                $method_icon = '';
                $method_color = '';
                if($receipt['payment_method'] == 'cash') {
                    $payment_method = get_phrase('cash');
                    $method_icon = 'fa-money-bill-wave';
                    $method_color = '#10b981';
                } elseif($receipt['payment_method'] == 'cheque') {
                    $payment_method = get_phrase('cheque');
                    $method_icon = 'fa-money-check';
                    $method_color = '#3b82f6';
                } elseif($receipt['payment_method'] == 'card') {
                    $payment_method = get_phrase('card');
                    $method_icon = 'fa-credit-card';
                    $method_color = '#8b5cf6';
                } elseif($receipt['payment_method'] == 'momo') {
                    $payment_method = get_phrase('mobile_money');
                    $method_icon = 'fa-mobile-alt';
                    $method_color = '#f59e0b';
                } else {
                    $payment_method = get_phrase('other');
                    $method_icon = 'fa-wallet';
                    $method_color = '#6b7280';
                }
                
                echo '<tr style="border-bottom: 1px solid #e2e8f0;">';
                echo '<td style="padding: 15px;"><span style="font-weight: 700; color: '.$theme_color.'; font-size: 14px;">#'.$receipt['receipt_code'].'</span></td>';
                echo '<td style="padding: 15px;"><span style="font-weight: 600; color: #4a5568;" title="'.implode(', ', array_map(function($c) { return '#'.$c; }, $invoice_codes_list)).'">';
                echo $invoice_display;
                if(count($invoice_codes_list) > 1) {
                    echo '<span style="background: #3b82f6; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; margin-left: 5px;">'.count($invoice_codes_list).'</span>';
                }
                echo '</span></td>';
                echo '<td style="padding: 15px; text-align: right;"><span style="font-weight: 700; color: #10b981; font-size: 15px;">'.$currency.' '.number_format($total_amount, 2).'</span></td>';
                echo '<td style="padding: 15px;"><span style="color: '.$method_color.'; font-weight: 600;"><i class="fa '.$method_icon.'"></i> Food</span></td>';
                echo '<td style="padding: 15px;"><div style="font-size: 13px; color: #4a5568;"><div style="font-weight: 600;">'.date('M d, Y', $receipt['timestamp']).'</div><div style="font-size: 11px; color: #a0aec0;">'.date('h:i A', $receipt['timestamp']).'</div></div></td>';
                echo '<td style="padding: 15px;"><span style="font-weight: 600; color: #4a5568;">'.$receipt['year'].' | '.$receipt['term'].'</span></td>';
                echo '<td style="padding: 15px; text-align: center;"><button onclick="viewReceiptDetails(\''.$receipt['receipt_code'].'\', \''.$student_id.'\', \''.$total_amount.'\', \''.$receipt['timestamp'].'\')" style="background: linear-gradient(135deg, '.$theme_color.' 0%, '.$theme_color.' 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3); margin-right: 5px;">';
                echo '<i class="fa fa-eye"></i> '.get_phrase('view').'</button>';
                echo '<button onclick="requestModification('.$receipt['payment_id'].')" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 12px; cursor: pointer; transition: all 0.3s; box-shadow: 0 2px 6px rgba(245, 158, 11, 0.3);">';
                echo '<i class="fa fa-edit"></i> '.get_phrase('modify').'</button></td>';
                echo '</tr>';
            }
        } else {
            echo '<tr><td colspan="7" style="padding: 60px 40px; text-align: center; background: #f9fafb;"><div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 15px;">';
            echo '<div style="background: linear-gradient(135deg, '.$theme_color.' 0%, '.$theme_color.' 100%); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);"><i class="fa fa-receipt" style="font-size: 36px; color: white;"></i></div>';
            echo '<div><h4 style="font-size: 18px; font-weight: 700; color: #2d3748; margin: 0 0 8px 0;">'.get_phrase('no_receipts_found').'</h4>';
            echo '<p style="font-size: 14px; color: #718096; margin: 0; max-width: 400px;">'.get_phrase('no_receipts_match_filters').'</p></div></div></td></tr>';
        }
    }

    // Theme Settings
    function theme_settings($param1 = '') {
        if($param1 == 'apply_theme') {
            $theme = $this->input->post('theme');
            $themes = array(
                'default' => array('primary' => '#667eea', 'secondary' => '#764ba2', 'accent' => '#f093fb'),
                'ocean' => array('primary' => '#2E3192', 'secondary' => '#1BFFFF', 'accent' => '#00d4ff'),
                'sunset' => array('primary' => '#f12711', 'secondary' => '#f5af19', 'accent' => '#ff6b6b'),
                'forest' => array('primary' => '#134E5E', 'secondary' => '#71B280', 'accent' => '#38ef7d'),
                'purple' => array('primary' => '#5f27cd', 'secondary' => '#341f97', 'accent' => '#a29bfe'),
                'crimson' => array('primary' => '#c0392b', 'secondary' => '#e74c3c', 'accent' => '#ff7979'),
                'teal' => array('primary' => '#16a085', 'secondary' => '#1abc9c', 'accent' => '#48c9b0'),
                'midnight' => array('primary' => '#2c3e50', 'secondary' => '#34495e', 'accent' => '#3498db'),
            );
            if(isset($themes[$theme])) {
                $this->db->where('type', 'app_theme');
                $this->db->update('settings', array('description' => $theme));
                $this->db->where('type', 'theme_primary');
                $this->db->update('settings', array('description' => $themes[$theme]['primary']));
                $this->db->where('type', 'theme_secondary');
                $this->db->update('settings', array('description' => $themes[$theme]['secondary']));
                $this->db->where('type', 'theme_accent');
                $this->db->update('settings', array('description' => $themes[$theme]['accent']));
            }
            echo json_encode(['status' => 'success', 'message' => get_phrase('theme_applied_successfully')]);
        }
        elseif($param1 == 'save_custom') {
            $this->db->where('type', 'theme_primary');
            $this->db->update('settings', array('description' => $this->input->post('primary_color')));
            $this->db->where('type', 'theme_secondary');
            $this->db->update('settings', array('description' => $this->input->post('secondary_color')));
            $this->db->where('type', 'theme_accent');
            $this->db->update('settings', array('description' => $this->input->post('accent_color')));
            echo json_encode(['status' => 'success', 'message' => get_phrase('custom_theme_applied_successfully')]);
        }
        else {
            $page_data['page_name'] = 'theme_settings';
            $page_data['page_title'] = get_phrase('theme_settings');
            $this->load->view('backend/main', $page_data);
        }
    }

    function bulk_assign_by_class($param1 = '') {
        if($param1 == 'assign') {
            $class_ids = $this->input->post('class_names');
            $profile_ids = $this->input->post('profile_ids');
            
            if(empty($class_ids) || empty($profile_ids)) {
                echo json_encode(array('status' => 'error', 'message' => get_phrase('please_select_classes_and_profiles')));
                return;
            }
            
            $assigned_count = 0;
            $running_year = get_settings('running_year');
            $running_term = get_settings('running_term');
            
            foreach($class_ids as $class_id) {
                $students = $this->db->where('class_id', $class_id)
                    ->where('year', $running_year)
                    ->where('term', $running_term)
                    ->where('mute', '0')
                    ->get('enroll')->result_array();
                    
                foreach($students as $student) {
                    foreach($profile_ids as $profile_id) {
                        $exists = $this->db->where('student_id', $student['student_id'])
                            ->where('profile_id', $profile_id)
                            ->get('student_discount_profiles')->num_rows();
                        if($exists == 0) {
                            $this->db->insert('student_discount_profiles', array(
                                'student_id' => $student['student_id'],
                                'profile_id' => $profile_id,
                                'assigned_date' => date('Y-m-d H:i:s'),
                                'assigned_by' => $this->session->userdata('admin_id')
                            ));
                            $assigned_count++;
                        }
                    }
                }
            }
            
            echo json_encode(array('status' => 'success', 'message' => get_phrase('assigned_successfully') . ' (' . $assigned_count . ')'));
        }
    }

	/**
	 * Log audit trail for benefit category changes
	 * Enterprise-grade audit logging
	 */
	private function log_benefit_category_audit($entity_id, $action, $old_values = null, $new_values = null) {
		$audit_data = array(
			'entity_type' => 'benefit_category',
			'entity_id' => $entity_id,
			'action' => $action,
			'changed_by' => $this->session->userdata('admin_id'),
			'ip_address' => $this->input->ip_address(),
			'user_agent' => substr($this->input->user_agent(), 0, 255)
		);
		
		if ($old_values !== null) {
			$audit_data['old_values'] = json_encode($old_values);
		}
		
		if ($new_values !== null) {
			$audit_data['new_values'] = json_encode($new_values);
		}
		
		$this->db->insert('discount_audit_trail', $audit_data);
	}

	/**
	 * Record discount application with error handling
	 */

	/**
	 * Discount Amount Reports - Enterprise Grade
	 * Shows actual monetary value of discounts applied
	 */
	function discount_amount_reports() {
		$page_data['page_name'] = 'discount_amount_reports';
		$page_data['page_title'] = get_phrase('discount_amount_reports');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}

	/**
	 * Get discount amount report data via AJAX
	 */
	function get_discount_amount_report() {
		
		$filters = [
			'category' => $this->input->get('category'),
			'year' => $this->input->get('year') ?: get_settings('running_year'),
			'term' => $this->input->get('term')
		];
		
		$data = get_discount_applications_report($filters);
		
		$summary = [
			'total_applications' => count($data),
			'total_original_amount' => array_sum(array_column($data, 'original_amount')),
			'total_discount_amount' => array_sum(array_column($data, 'discount_amount')),
			'total_final_amount' => array_sum(array_column($data, 'final_amount')),
			'unique_students' => count(array_unique(array_column($data, 'student_id')))
		];
		
		echo json_encode([
			'status' => 'success',
			'data' => $data,
			'summary' => $summary
		]);
	}

	/**
	 * Export discount amount report to Excel
	 */
	function export_discount_amount_report() {
		
		$filters = [
			'category' => $this->input->get('category'),
			'year' => $this->input->get('year') ?: get_settings('running_year'),
			'term' => $this->input->get('term')
		];
		
		$data = get_discount_applications_report($filters);
		
		$this->load->view('backend/admin/export_discount_report', ['data' => $data]);
	}
	
	/**
	 * Get bill items via AJAX for refresh
	 */
	function get_bill_item() {
		$items = $this->db->get('bill_item')->result_array();
		$allBillCategory = $this->crud_model->getAllBillCategory();
		
		$data = [];
		foreach($items as $item) {
			$category_name = $this->crud_model->getBillCategoryNameById($item['bill_category_id']);
			
			$category_options = '';
			foreach($allBillCategory as $cat) {
				$selected = ($item['bill_category_id'] == $cat['bill_category_id']) ? 'selected' : '';
				$category_options .= '<option value="'.$cat['bill_category_id'].'" '.$selected.'>'.$cat['bill_category_name'].'</option>';
			}
			
			// Get class category options
			$this->db->distinct();
			$this->db->select('category');
			$this->db->from('class');
			$this->db->where('category IS NOT NULL', NULL, FALSE);
			$this->db->where('category !=', '');
			$categories = $this->db->get()->result_array();
			
			$order_map = array('Pre-School' => 1, 'Lower Primary' => 2, 'Upper Primary' => 3, 'JHS' => 4);
			usort($categories, function($a, $b) use ($order_map) {
				$order_a = isset($order_map[$a['category']]) ? $order_map[$a['category']] : 999;
				$order_b = isset($order_map[$b['category']]) ? $order_map[$b['category']] : 999;
				return $order_a - $order_b;
			});
			
			$class_category_options = '<option value="">All Classes</option>';
			foreach($categories as $cat) {
				if(!empty($cat['category'])) {
					$selected = ($item['class_category'] == $cat['category']) ? 'selected' : '';
					$class_category_options .= '<option value="'.$cat['category'].'" '.$selected.'>'.$cat['category'].'</option>';
				}
			}
			
			// Get specific classes display
			$specific_classes_display = '-';
			if(!empty($item['specific_class_ids'])) {
				$class_ids = explode(',', $item['specific_class_ids']);
				$class_names = [];
				foreach($class_ids as $cid) {
					$this->db->select('class.name, class.name_numeric, section.name as section_name');
					$this->db->from('class');
					$this->db->join('section', 'section.class_id = class.class_id', 'left');
					$this->db->where('class.class_id', $cid);
					$class_row = $this->db->get()->row_array();
					if($class_row) {
						$class_names[] = $class_row['name'] . ' ' . $class_row['name_numeric'] . ($class_row['section_name'] ? ' ' . $class_row['section_name'] : '');
					}
				}
				$specific_classes_display = implode(', ', $class_names);
			}
			
			// Get all classes for multi-select
			$this->db->select('class.class_id, class.name, class.name_numeric, section.name as section_name');
			$this->db->from('class');
			$this->db->join('section', 'section.class_id = class.class_id', 'left');
			$all_classes = $this->db->get()->result_array();
			
			$class_order = array('CRECHE' => 1, 'NURSERY' => 2, 'KG' => 3, 'BASIC' => 4, 'JHS' => 5);
			usort($all_classes, function($a, $b) use ($class_order) {
				$order_a = isset($class_order[$a['name']]) ? $class_order[$a['name']] : 999;
				$order_b = isset($class_order[$b['name']]) ? $class_order[$b['name']] : 999;
				if ($order_a === $order_b) {
					return (int)$a['name_numeric'] - (int)$b['name_numeric'];
				}
				return $order_a - $order_b;
			});
			
			$specific_class_ids_array = !empty($item['specific_class_ids']) ? explode(',', $item['specific_class_ids']) : [];
			$specific_classes_options = '';
			foreach($all_classes as $ac) {
				$full_name = $ac['name'] . ' ' . $ac['name_numeric'] . ($ac['section_name'] ? ' ' . $ac['section_name'] : '');
				$selected = in_array($ac['class_id'], $specific_class_ids_array) ? 'selected' : '';
				$specific_classes_options .= '<option value="'.$ac['class_id'].'" '.$selected.'>'.$full_name.'</option>';
			}
			
			$data[] = [
				'id' => $item['id'],
				'title' => $item['title'],
				'bill_category_id' => $item['bill_category_id'],
				'category_name' => $category_name,
				'category_options' => $category_options,
				'class_category' => $item['class_category'],
				'class_category_display' => !empty($item['class_category']) ? $item['class_category'] : 'All Classes',
				'class_category_options' => $class_category_options,
				'specific_class_ids' => $item['specific_class_ids'],
				'specific_classes_display' => $specific_classes_display,
				'specific_classes_options' => $specific_classes_options,
				'amount' => $item['amount'],
				'description' => $item['description']
			];
		}
		
		echo json_encode(['status' => 'success', 'data' => $data]);
	}

	private function notify_super_admins_discount_approval($student_ids, $profile_ids, $assigned_by) {
		$requester = $this->db->where('admin_id', $assigned_by)->get('admin')->row();
		$student_count = count($student_ids);
		$profile_count = count($profile_ids);
		$super_admins = $this->db->where('level', 1)->get('admin')->result();
		
		foreach($super_admins as $admin) {
			$this->db->insert('notifications', [
				'user_id' => $admin->admin_id,
				'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
				'title' => 'Discount Assignment Approval Required',
				'message' => $requester->name . ' requested approval for ' . $student_count . ' student(s) with ' . $profile_count . ' profile(s)',
				'type' => 'discount_approval',
				'is_read' => 0,
				'created_at' => date('Y-m-d H:i:s')
			]);
			
			$active_sms = $this->db->get_where('settings', ['type' => 'active_sms_service'])->row();
			if($active_sms && $active_sms->description != 'disabled' && !empty($admin->phone)) {
				$school_name = get_settings('system_name');
				$sms_message = "[$school_name] Discount approval needed: {$requester->name} requested {$student_count} student discount(s). Review at: " . site_url('admin/discount_approvals');
				$this->sms_model->send_sms($sms_message, [$admin->phone]);
			}
			
			if(!empty($admin->email)) {
				$school_name = get_settings('system_name');
				$subject = "Discount Assignment Approval Required - $school_name";
				$message = "<div style='font-family: Arial, sans-serif; max-width: 600px;'><div style='background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;'><h1 style='color: white; margin: 0;'>Approval Required</h1></div><div style='padding: 30px; background: #f8f9fa;'><p style='font-size: 16px;'>Dear {$admin->name},</p><p>A discount assignment request requires your approval:</p><div style='background: white; padding: 20px; border-radius: 8px; margin: 20px 0;'><p><strong>Requested by:</strong> {$requester->name}</p><p><strong>Students:</strong> {$student_count}</p><p><strong>Profiles:</strong> {$profile_count}</p></div><p style='text-align: center;'><a href='" . site_url('admin/discount_approvals') . "' style='background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;'>Review & Approve</a></p></div></div>";
				$this->email_model->do_email($message, $subject, $admin->email, $school_name);
			}
		}
	}










	/**
	 * Get discount types based on category
	 * Returns bill items for invoice category or enabled daily fees for daily_fees category
	 */
	public function get_discount_types_for_profiles() {
		$category = $this->input->get('category');
		$response = array('status' => 'error', 'message' => 'Invalid category', 'data' => array());
		
		if($category == 'invoice') {
			$this->db->select('id, title');
			$this->db->from('bill_item');
			$this->db->order_by('title', 'ASC');
			$query = $this->db->get();
			
			if($query->num_rows() > 0) {
				$items = array();
				foreach($query->result() as $row) {
					$items[] = array(
						'value' => $row->id,
						'label' => $row->title
					);
				}
				
				array_unshift($items, array(
					'value' => 'all_invoice_items',
					'label' => 'All Invoice Items'
				));
				
				$response = array(
					'status' => 'success',
					'message' => 'Invoice items loaded',
					'data' => $items
				);
			} else {
				$response = array(
					'status' => 'success',
					'message' => 'No bill items found',
					'data' => array()
				);
			}
			
		} elseif($category == 'daily_fees') {
			$items = array();
			$fee_types = array('feeding', 'classes', 'water', 'breakfast', 'transport');
			
			foreach($fee_types as $fee_type) {
				$setting = $this->db->get_where('settings', array(
					'type' => 'fee_module_' . $fee_type
				))->row();
				
				if($setting && $setting->description == '1') {
					$items[] = array(
						'value' => $fee_type,
						'label' => ucfirst($fee_type)
					);
				}
			}
			
			if(count($items) > 0) {
				array_unshift($items, array(
					'value' => 'all_daily_fees',
					'label' => 'All Daily Fees'
				));
			}
			
			$response = array(
				'status' => 'success',
				'message' => 'Daily fees loaded',
				'data' => $items
			);
		}
		
		echo json_encode($response);
	}

		function getDiscountProfileDetails() {
		$profile_id = $this->input->post('profile_id');
		$action = $this->input->post('action');
		$class_id = $this->input->post('class_id');
		
		if(!$profile_id) {
			echo json_encode(['status' => 'error', 'message' => 'Profile ID required']);
			return;
		}
		
		$profile = $this->db->where('profile_id', $profile_id)->get('discount_profiles')->row_array();
		
		if(!$profile) {
			echo json_encode(['status' => 'error', 'message' => 'Profile not found']);
			return;
		}
		
		$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
		$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
		$residence_type = $this->input->post('residence_type');
		
		$items = array();
		$is_all_items = false;
		$item_names = array();
		
		if(!empty($profile['bill_item_ids'])) {
			if($profile['bill_item_ids'] === '*') {
				// Wildcard: applies to ALL bill items
				$is_all_items = true;
				$bill_items = $this->db->get('bill_item')->result_array();
				
				foreach($bill_items as $bill_item) {
					$items[] = array(
						'bill_item_id' => $bill_item['id'],
						'discount_type' => $bill_item['title'],
						'discount_method' => $profile['discount_method'],
						'discount_value' => $profile['discount_value']
					);
					$item_names[] = $bill_item['title'];
				}
			} else {
				// Specific items only
				$is_all_items = false;
				$bill_item_ids = explode(',', $profile['bill_item_ids']);
				foreach($bill_item_ids as $item_id) {
					$item_id = trim($item_id);
					if(!empty($item_id)) {
						$bill_item = $this->db->where('id', $item_id)->get('bill_item')->row_array();
						
						if($bill_item) {
							$items[] = array(
								'bill_item_id' => $bill_item['id'],
								'discount_type' => $bill_item['title'],
								'discount_method' => $profile['discount_method'],
								'discount_value' => $profile['discount_value']
							);
							$item_names[] = $bill_item['title'];
						}
					}
				}
			}
		}
		
		$profile['items'] = $items;
		$profile['is_all_items'] = $is_all_items;
		$profile['item_names'] = $item_names;
		$profile['items_count'] = count($items);
		$profile['currency'] = $this->db->get_where('settings', ['type' => 'currency'])->row()->description;
		
		echo json_encode(['status' => 'success', 'profile' => $profile]);
	}



	function get_student_class_residence() {
		$student_id = $this->input->post('student_id');
		$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
		$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
		
		$enroll = $this->db->where('student_id', $student_id)
			->where('year', $running_year)
			->where('term', $running_term)
			->get('enroll')->row();
		
		if($enroll) {
			echo json_encode([
				'class_id' => $enroll->class_id,
				'residence_type' => $enroll->residence_type
			]);
		} else {
			echo json_encode(['class_id' => null, 'residence_type' => null]);
		}
	}

	// Applies assigns discount profile and applies discount to student's invoice. Approval is required for the actual deductions to take effect if not initiated by super admin
	function assign_profile_to_invoice() {
		$student_id = $this->input->post('student_id');
		$invoice_code = $this->input->post('invoice_code');
		$profile_id = $this->input->post('profile_id');
		$action = $this->input->post('action');

		$is_super_admin = $this->session->userdata('user_type') == 1;
		
		if(!$student_id || !$invoice_code || !$profile_id) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('missing_required_fields')]);
			return;
		}
		
		// Check if there's already a pending approval for this invoice
		$pending_discount = $this->db->where('invoice_code', $invoice_code)
			->where('student_id', $student_id)
			->where('discount_category', 'invoice')
			->where('status', 'pending')
			->get('invoice_discounts')->row();
		
		if($pending_discount) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('pending_approval_exists_for_this_invoice')]);
			return;
		}

		if($action == 'replace') {
			// Get old discount item details to restore exact amounts
			$old_discount = $this->db->where('student_id', $student_id)
				->where('invoice_code', $invoice_code)
				->where('discount_category', 'invoice')
				->where('status', 'approved')
				->get('invoice_discounts')->row();
			
			if($old_discount) {
				// Get per-item discount details
				$discount_items = $this->db->where('discount_id', $old_discount->discount_id)
					->get('invoice_discount_items')->result_array();
				
				if(count($discount_items) > 0) {
					// Restore exact amounts from tracked data
					foreach($discount_items as $disc_item) {
						$this->db->where('invoice_id', $disc_item['invoice_id'])
							->set('amount', 'amount + ' . $disc_item['discount_amount'], FALSE)
							->set('due', 'due + ' . $disc_item['discount_amount'], FALSE)
							->update('invoice');
					}
					// Delete per-item discount records
					$this->db->where('discount_id', $old_discount->discount_id)->delete('invoice_discount_items');
				}
				
				// Financial Hook: Reverse discount in ledger BEFORE deleting
				$this->Finance_model->reverse_discount_ledger($invoice_code, $student_id, $old_discount->discount_amount);
			}
			
			// Delete old discount records
			$this->db->where('student_id', $student_id)
				->where('invoice_code', $invoice_code)
				->where('discount_category', 'invoice')
				->delete('invoice_discounts');
			
			// Set old assignments to inactive
			$this->db->where('student_id', $student_id)
				->where('discount_category', 'invoice')
				->where('is_active', 1)
				->update('student_discount_assignments', ['is_active' => 0]);
		}
		
		$running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
		$running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
		
		$profile = $this->db->where('profile_id', $profile_id)
			->where('is_active', 1)
			->where('discount_category', 'invoice')
			->get('discount_profiles')->row();
		
		if(!$profile) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('profile_not_found')]);
			return;
		}
		
		$user_level = $this->session->userdata('user_type');
		$is_super_admin = ($user_level == 1);
		$discount_status = 'approved';
		$approved_by = $this->session->userdata('login_user_id');
		$approved_at = date('Y-m-d H:i:s');
		
		$existing = $this->db->where('student_id', $student_id)
			->where('profile_id', $profile_id)
			->where('discount_category', 'invoice')
			->where('is_active', 1)
			->get('student_discount_assignments')->row();
		
		if(!$existing) {
			$this->db->insert('student_discount_assignments', [
				'student_id' => $student_id,
				'profile_id' => $profile_id,
				'discount_category' => $profile->discount_category,
				'discount_method' => $profile->discount_method,
				'discount_value' => $profile->discount_value,
				'discount_type' => $profile->discount_type,
				'bill_item_ids' => $profile->bill_item_ids,
				'year' => $running_year,
				'term' => $running_term,
				'assigned_by' => $this->session->userdata('login_user_id'),
				'created_by' => $this->session->userdata('login_user_id'),
				'is_active' => 1,
				'status' => $discount_status,
				'approved_by' => $approved_by,
				'approved_at' => $approved_at,
				'notes' => 'Invoice discount assigned via apply_discount page'
			]);
		}
		
		$invoice_items = $this->db->where('invoice_code', $invoice_code)
			->where('student_id', $student_id)
			->get('invoice')->result_array();
		
		// Get applicable bill items from profile
		$applicable_total = 0;
		$applicable_items = array();
		
		if($profile->bill_item_ids === '*') {
			// Wildcard: apply to ALL invoice items
			foreach($invoice_items as $idx => $item) {
				$applicable_total += $item['amount'];
				$applicable_items[] = $idx;
			}
		} else {
			// Specific items: match by bill_item_id
			$profile_bill_items = explode(',', $profile->bill_item_ids);
			foreach($invoice_items as $idx => $item) {
				// Get bill item details to match by title
				if(isset($item['bill_item_id'])) {
					if(in_array($item['bill_item_id'], $profile_bill_items)) {
						$applicable_total += $item['amount'];
						$applicable_items[] = $idx;
					}
				} else {
					// Match by title if bill_item_id not available
					foreach($profile_bill_items as $bill_item_id) {
						$bill_item = $this->db->where('id', trim($bill_item_id))->get('bill_item')->row();
						if($bill_item && strtolower(trim($item['title'])) == strtolower(trim($bill_item->title))) {
							$applicable_total += $item['amount'];
							$applicable_items[] = $idx;
							break;
						}
					}
				}
			}
		}
		
		$discount_amount = $profile->discount_method == 'percentage' 
			? ($applicable_total * $profile->discount_value) / 100 
			: min($profile->discount_value, $applicable_total);
		
		$this->db->insert('invoice_discounts', [
			'invoice_code' => $invoice_code,
			'student_id' => $student_id,
			'profile_id' => $profile_id,
			'discount_category' => 'invoice',
			'discount_method' => $profile->discount_method,
			'discount_value' => $profile->discount_value,
			'discount_amount' => $discount_amount,
			'reason' => 'Profile: ' . $profile->profile_name,
			'status' => $is_super_admin ? $discount_status : 'pending',
			'applied_by' => $this->session->userdata('login_user_id'),
			'approved_by' => $is_super_admin ? $approved_by : NULL,
			'approved_at' => $is_super_admin ? $approved_at : NULL,
			'year' => $running_year,
			'term' => $running_term
		]);
		
		$discount_id = $this->db->insert_id();
		
		if(count($applicable_items) > 0) {
			if($profile->discount_method == 'percentage') {
				foreach($applicable_items as $idx) {
					$item = $invoice_items[$idx];
					$item_discount = ($item['amount'] * $profile->discount_value) / 100;
					
					$this->db->insert('invoice_discount_items', [
						'discount_id' => $discount_id,
						'invoice_id' => $item['invoice_id'],
						'invoice_code' => $invoice_code,
						'student_id' => $student_id,
						'item_title' => $item['title'],
						'original_amount' => $item['amount'],
						'discount_amount' => $item_discount,
						'discounted_amount' => $item['amount'] - $item_discount
					]);
					
					if($is_super_admin) {
						$this->db->where('invoice_code', $invoice_code)
							->where('title', $item['title'])
							->where('student_id', $student_id)
							->update('invoice', [
								'amount' => $item['amount'] - $item_discount,
								'due' => $item['due'] - $item_discount
							]);
					}
				}
			} else {
				foreach($applicable_items as $idx) {
					$item = $invoice_items[$idx];
					$item_discount = ($item['amount'] / $applicable_total) * $discount_amount;
					
					$this->db->insert('invoice_discount_items', [
						'discount_id' => $discount_id,
						'invoice_id' => $item['invoice_id'],
						'invoice_code' => $invoice_code,
						'student_id' => $student_id,
						'item_title' => $item['title'],
						'original_amount' => $item['amount'],
						'discount_amount' => $item_discount,
						'discounted_amount' => $item['amount'] - $item_discount
					]);

					if($is_super_admin) {
						$this->db->where('invoice_code', $invoice_code)
							->where('title', $item['title'])
							->where('student_id', $student_id)
							->update('invoice', [
								'amount' => $item['amount'] - $item_discount,
								'due' => $item['due'] - $item_discount
							]);
					}
				}
			}
		}
		
		if(!$is_super_admin) {
			$requester = $this->db->where('admin_id', $this->session->userdata('login_user_id'))->get('admin')->row();
			$student = $this->db->where('student_id', $student_id)->get('student')->row();
			$school_name = $this->db->get_where('settings', ['type' => 'system_name'])->row()->description;
			$super_admins = $this->db->where('level', 1)->get('admin')->result();
			
			foreach($super_admins as $admin) {
				$this->db->insert('notifications', [
					'user_id' => $admin->admin_id,
					'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
					'title' => 'Discount Approval Required',
					'message' => $requester->name . ' assigned discount profile to ' . $student->name . ' for invoice ' . $invoice_code,
					'type' => 'discount_approval',
					'created_at' => date('Y-m-d H:i:s')
				]);
			}

			$responseMessage = get_phrase('discount_profile_assignment_is_pending_approval');
		} else {
			$responseMessage = get_phrase('discount_profile_assigned_successfully');
		}
		
		echo json_encode(['status' => 'success', 'message' => $responseMessage]);
	}

	function check_existing_profile() {
		$student_id = $this->input->post('student_id');
		$invoice_code = $this->input->post('invoice_code');
		
		$existing = $this->db->select('dp.profile_name, ida.profile_id')
			->from('invoice_discounts ida')
			->join('discount_profiles dp', 'dp.profile_id = ida.profile_id', 'left')
			->where('ida.student_id', $student_id)
			->where('ida.invoice_code', $invoice_code)
			->where('ida.discount_category', 'invoice')
			->where('ida.status', 'approved')
			->get()->row();
		
		if($existing) {
			echo json_encode([
				'has_profile' => true,
				'profile_id' => $existing->profile_id,
				'profile_name' => $existing->profile_name
			]);
		} else {
			echo json_encode(['has_profile' => false]);
		}
	}

	
	// Notification methods
	function clear_all_notifications() {
		$user_id = $this->session->userdata('login_user_id');
		$user_type = $this->session->userdata('login_type');
		
		if (!$user_id) {
			echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
			return;
		}
		
		$this->db->where('user_id', $user_id);
		$this->db->where('user_type', $user_type);
		$this->db->delete('notifications');
		
		echo json_encode(['status' => 'success', 'message' => 'All notifications cleared successfully']);
	}

	// Bulk invoice modification
	function bulkModifyInvoices() {
		$invoice_codes = $this->input->post('invoice_codes');
		$request_type = $this->input->post('request_type');
		$reason = $this->input->post('reason');
		$items = $this->input->post('items');
		$user_id = $this->session->userdata('login_user_id');
		$admin_level = $this->db->get_where('admin', array('admin_id' => $user_id))->row()->level;
		
		if(empty($invoice_codes)) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('no_invoices_selected')]);
			return;
		}
		
		$modified_count = 0;
		
		foreach($invoice_codes as $invoice_code) {
			$old_invoice_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result_array();
			$old_data = json_encode($old_invoice_items);
			$student_id = $old_invoice_items[0]['student_id'];
			
			if($admin_level == 1) {
				if($request_type == 'edit') {
					$this->apply_invoice_edit($invoice_code, $items[$invoice_code]);
				} else {
					$this->apply_invoice_delete($invoice_code);
				}
				$modified_count++;
			} else {
				$this->db->insert('invoice_modification_requests', [
					'invoice_code' => $invoice_code,
					'student_id' => $student_id,
					'request_type' => $request_type,
					'requested_by' => $user_id,
					'request_reason' => $reason,
					'old_data' => $old_data,
					'new_data' => $request_type == 'edit' ? json_encode($items[$invoice_code]) : null,
					'status' => 'pending',
					'created_at' => date('Y-m-d H:i:s')
				]);
				$modified_count++;
			}
		}
		
		if($admin_level != 1) {
			$requester = $this->db->where('admin_id', $user_id)->get('admin')->row();
			$super_admins = $this->db->where('level', 1)->get('admin')->result();
			
			foreach($super_admins as $admin) {
				$this->db->insert('notifications', [
					'user_id' => $admin->admin_id,
					'user_type' => 'superadmin',
					'title' => 'Bulk Invoice Modification Request',
					'message' => $requester->name . ' requested bulk modification of ' . $modified_count . ' invoices',
					'type' => 'invoice_modification',
					'created_at' => date('Y-m-d H:i:s')
				]);
			}
		}
		
		$message = $admin_level == 1 
			? get_phrase('invoices_modified_successfully') 
			: get_phrase('modification_request_submitted');
			
		echo json_encode(['status' => 'success', 'message' => $message, 'count' => $modified_count]);
	}
	
	private function time_ago($timestamp) {
		if(!is_numeric($timestamp)) {
			$timestamp = strtotime($timestamp);
		}
		$diff = time() - $timestamp;
		if($diff < 0) $diff = 0;
		if($diff < 60) return 'Just now';
		if($diff < 3600) return floor($diff/60) . ' min ago';
		if($diff < 86400) return floor($diff/3600) . ' hr ago';
		return floor($diff/86400) . ' days ago';
	}

	// Print bulk invoices based on filters
	function print_bulk_invoices() {
		$term = $this->input->post('term');
		$year = $this->input->post('year');
		$status = $this->input->post('status');
		$filter = $this->input->post('filter');
		$class_id = $this->input->post('class_id');
		$invoice_codes = $this->input->post('invoice_codes'); // Array of selected invoice codes

		// Build query based on filters
		$this->db->distinct();
		$this->db->select('i.invoice_code, i.student_id, SUM(i.amount) as total_amount, SUM(i.amount_paid) as amount_paid, SUM(i.due) as due');
		$this->db->from('invoice i');
		$this->db->join('enroll e', 'e.student_id = i.student_id AND e.year = i.year AND e.term = i.term', 'left');
		$this->db->where('i.mute', '0');
		$this->db->where('i.can_delete !=', 'trash');
		$this->db->where('i.due >=', 0); // Exclude negative due amounts
		
		// Only filter by term if provided
		if(!empty($term)) {
			$this->db->where('i.term', $term);
		}
		
		// Only filter by year if provided
		if(!empty($year)) {
			$this->db->where('i.year', $year);
		}

		// Apply filters
		if($filter === 'class' && $class_id) {
			$this->db->where('e.class_id', $class_id);
		} elseif($filter === 'boarding') {
			$this->db->where('e.residence_type', 'Boarding');
		} elseif($filter === 'day') {
			$this->db->where('e.residence_type', 'Day');
		}

		// If specific invoice codes provided, filter by them
		if(!empty($invoice_codes) && is_array($invoice_codes)) {
			$this->db->where_in('i.invoice_code', $invoice_codes);
		}

		$this->db->group_by('i.invoice_code, i.student_id');
		
		// Apply status filter using HAVING clause (after grouping)
		if(!empty($status)) {
			if($status === 'paid') {
				$this->db->having('SUM(i.due) =', 0);
			} elseif($status === 'unpaid') {
				$this->db->having('SUM(i.due) > 0 AND SUM(i.amount_paid) =', 0);
			} elseif($status === 'partial') {
				$this->db->having('SUM(i.due) > 0 AND SUM(i.amount_paid) >', 0);
			}
		}
		
		$this->db->order_by('i.invoice_code', 'ASC');

		$invoices = $this->db->get()->result_array();

		if(empty($invoices)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'No invoices found matching the criteria'
			]);
			return;
		}

		// Load print view
		$page_data['invoices'] = $invoices;
		$page_data['term'] = $term;
		$page_data['year'] = $year;
		$page_data['filter'] = $filter;
		$page_data['total_count'] = count($invoices);

		$this->load->view('backend/admin/bulk_invoice_print', $page_data);
	}





	private function apply_discount_to_invoice($assignment, $invoice_code) {
		$profile = $this->db->where('profile_id', $assignment->profile_id)->get('discount_profiles')->row();
		if(!$profile) return;
		
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$invoice_items = $this->db->where('invoice_code', $invoice_code)
			->where('student_id', $assignment->student_id)
			->get('invoice')->result_array();
		
		// Get applicable bill items from profile
		$applicable_total = 0;
		$applicable_items = array();
		
		if($profile->bill_item_ids === '*') {
			// Wildcard: apply to ALL invoice items
			foreach($invoice_items as $idx => $item) {
				$applicable_total += $item['amount'];
				$applicable_items[] = $idx;
			}
		} else {
			// Specific items: match by bill_item_id
			$profile_bill_items = explode(',', $profile->bill_item_ids);
			foreach($invoice_items as $idx => $item) {
				// Get bill item details to match by title
				if(isset($item['bill_item_id'])) {
					if(in_array($item['bill_item_id'], $profile_bill_items)) {
						$applicable_total += $item['amount'];
						$applicable_items[] = $idx;
					}
				} else {
					// Match by title if bill_item_id not available
					foreach($profile_bill_items as $bill_item_id) {
						$bill_item = $this->db->where('id', trim($bill_item_id))->get('bill_item')->row();
						if($bill_item && strtolower(trim($item['title'])) == strtolower(trim($bill_item->title))) {
							$applicable_total += $item['amount'];
							$applicable_items[] = $idx;
							break;
						}
					}
				}
			}
		}
		
		$total_discount = ($profile->discount_method == 'percentage') 
			? ($applicable_total * $profile->discount_value / 100)
			: $profile->discount_value;
		
		$this->db->insert('invoice_discounts', [
			'invoice_code' => $invoice_code,
			'student_id' => $assignment->student_id,
			'profile_id' => $assignment->profile_id,
			'discount_category' => 'invoice',
			'discount_method' => $profile->discount_method,
			'discount_value' => $profile->discount_value,
			'discount_amount' => $total_discount,
			'reason' => 'Profile: ' . $profile->profile_name,
			'status' => 'approved',
			'applied_by' => $this->session->userdata('login_user_id'),
			'approved_by' => $this->session->userdata('login_user_id'),
			'approved_at' => date('Y-m-d H:i:s'),
			'year' => $running_year,
			'term' => $running_term
		]);
		
		$discount_id = $this->db->insert_id();
		
		foreach($applicable_items as $item) {
			$discount_amount = ($profile->discount_method == 'percentage') 
				? ($item['amount'] * $profile->discount_value / 100)
				: ($item['amount'] / $applicable_total) * $total_discount;
			
			$this->db->insert('invoice_discount_items', [
				'discount_id' => $discount_id,
				'invoice_id' => $item['invoice_id'],
				'invoice_code' => $invoice_code,
				'student_id' => $assignment->student_id,
				'item_title' => $item['title'],
				'original_amount' => $item['amount'],
				'discount_amount' => $discount_amount,
				'discounted_amount' => $item['amount'] - $discount_amount
			]);
			
			$this->db->where('invoice_id', $item['invoice_id'])
				->set('amount', 'amount - ' . $discount_amount, FALSE)
				->set('due', 'due - ' . $discount_amount, FALSE)
				->update('invoice');
		}
		
		// Recalculate payment allocation after discount
		$this->recalculate_invoice_payments($invoice_code);
	}
	
	private function apply_discount_to_invoice_direct($discount) {
		$invoice_items = $this->db->where('invoice_code', $discount->invoice_code)
			->where('student_id', $discount->student_id)
			->get('invoice')->result_array();
		
		$profile = $this->db->where('profile_id', $discount->profile_id)->get('discount_profiles')->row();
		
		// Get applicable bill items from profile
		$applicable_total = 0;
		$applicable_items = array();
		
		if($profile->bill_item_ids === '*') {
			// Wildcard: apply to ALL invoice items
			foreach($invoice_items as $idx => $item) {
				$applicable_total += $item['amount'];
				$applicable_items[] = $idx;
			}
		} else {
			// Specific items: match by bill_item_id
			$profile_bill_items = explode(',', $profile->bill_item_ids);
			foreach($invoice_items as $idx => $item) {
				// Get bill item details to match by title
				if(isset($item['bill_item_id'])) {
					if(in_array($item['bill_item_id'], $profile_bill_items)) {
						$applicable_total += $item['amount'];
						$applicable_items[] = $idx;
					}
				} else {
					// Match by title if bill_item_id not available
					foreach($profile_bill_items as $bill_item_id) {
						$bill_item = $this->db->where('id', trim($bill_item_id))->get('bill_item')->row();
						if($bill_item && strtolower(trim($item['title'])) == strtolower(trim($bill_item->title))) {
							$applicable_total += $item['amount'];
							$applicable_items[] = $idx;
							break;
						}
					}
				}
			}
		}
		
		foreach($applicable_items as $item) {
			$discount_amount = ($discount->discount_method == 'percentage') 
				? ($item['amount'] * $discount->discount_value / 100)
				: ($item['amount'] / $applicable_total) * $discount->discount_amount;
			
			$this->db->insert('invoice_discount_items', [
				'discount_id' => $discount->discount_id,
				'invoice_id' => $item['invoice_id'],
				'invoice_code' => $discount->invoice_code,
				'student_id' => $discount->student_id,
				'item_title' => $item['title'],
				'original_amount' => $item['amount'],
				'discount_amount' => $discount_amount,
				'discounted_amount' => $item['amount'] - $discount_amount
			]);
			
			$this->db->where('invoice_id', $item['invoice_id'])
				->set('amount', 'amount - ' . $discount_amount, FALSE)
				->set('due', 'due - ' . $discount_amount, FALSE)
				->update('invoice');
		}
		
		// Recalculate payment allocation after discount
		$this->recalculate_invoice_payments($discount->invoice_code);
	}

	// ============================================
	// BULK ARREARS IMPORT - ENTERPRISE IMPLEMENTATION
	// ============================================

	/**
	 * Show bulk arrears import modal
	 */
	function bulk_arrears_import_modal() {
		$this->load->view('backend/admin/bulk_arrears_import_modal');
	}

	/**
	 * Show student selection for arrears template
	 */
	function bulk_arrears_student_selection() {
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		// Get all class IDs in proper order
		$class_ids = getAllClassList();
		
		$students = [];
		foreach($class_ids as $class_id) {
			$class_students = $this->db->select('s.student_id, s.name, s.student_code, e.class_id')
				->from('student s')
				->join('enroll e', 's.student_id = e.student_id')
				->where('e.class_id', $class_id)
				->where('e.year', $running_year)
				->where('e.term', $running_term)
				->order_by('s.name', 'ASC')
				->get()->result_array();
			
			foreach($class_students as $student) {
				$class_name = $this->crud_model->get_class_name($class_id);
				$class_numeric = $this->crud_model->get_class_name_numeric($class_id);
				$class_section = $this->crud_model->get_class_section($class_id);
				$student['class_name'] = $class_name . ' ' . $class_numeric . ' ' . $class_section;
				$students[] = $student;
			}
		}
		
		$page_data['students'] = $students;
		$this->load->view('backend/admin/bulk_arrears_student_selection', $page_data);
	}

	/**
	 * Generate arrears template data for client-side Excel generation
	 */
	function generate_arrears_template() {
		$student_ids = $this->input->post('student_ids');
		
		if(empty($student_ids)) {
			echo json_encode(['status' => 'error', 'message' => 'No students selected']);
			return;
		}
		
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		$students = [];
		foreach($student_ids as $student_id) {
			$student = $this->db->select('s.student_id, s.name, s.student_code, e.class_id')
				->from('student s')
				->join('enroll e', 's.student_id = e.student_id')
				->where('s.student_id', $student_id)
				->where('e.year', $running_year)
				->where('e.term', $running_term)
				->get()->row_array();
			
			if($student) {
				$class_name = $this->crud_model->get_class_name($student['class_id']);
				$class_numeric = $this->crud_model->get_class_name_numeric($student['class_id']);
				$class_section = $this->crud_model->get_class_section($student['class_id']);
				$student['class'] = $class_name . ' ' . $class_numeric . ' ' . $class_section;
				$students[] = $student;
			}
		}
		
		echo json_encode([
			'status' => 'success',
			'students' => $students,
			'count' => count($students)
		]);
	}

	/**
	 * Process bulk arrears import - receives JSON data from client-side SheetJS
	 */
	function bulk_arrears_import($param1 = '') {
		if($param1 == 'process') {
			$json_data = $this->input->post('arrears_data');
			
			if(empty($json_data)) {
				echo json_encode(['status' => 'error', 'message' => 'No data received']);
				return;
			}
			
			$data = json_decode($json_data, true);
			if(!$data) {
				echo json_encode(['status' => 'error', 'message' => 'Invalid data format']);
				return;
			}
			
			try {
				$running_year = get_settings('running_year');
				$running_term = get_settings('running_term');
				$creation_timestamp = strtotime('now');
				
				$success_count = 0;
				$skip_count = 0;
				$error_count = 0;
				$errors = [];
				
				foreach($data as $index => $row) {
					$row_num = $index + 2; // +2 because index starts at 0 and we skip header
					$student_id = trim($row['Student ID']);
					$amount = floatval($row['Amount Owed']);
					
					if($amount <= 0) {
						$skip_count++;
						continue;
					}
					
					$student = $this->db->where('student_id', $student_id)->get('student')->row();
					if(!$student) {
						$error_count++;
						$errors[] = "Row $row_num: Student ID $student_id not found";
						continue;
					}
					
					$enroll = $this->db->where('student_id', $student_id)
						->where('year', $running_year)
						->where('term', $running_term)
						->get('enroll')->row();
					
					if(!$enroll) {
						$error_count++;
						$errors[] = "Row $row_num: Student not enrolled in current term/year";
						continue;
					}
					
					$residence_type = $this->boarding_model->get_residence_type($student_id);
					
					$existing = $this->db->where('student_id', $student_id)
						->where('title', 'ARREARS')
						->where('year', $running_year)
						->where('term', $running_term)
						->where('can_delete !=', 'trash')
						->get('invoice')->row();
					
					if($existing) {
						$old_amount = $existing->amount;
						$old_due = $existing->due;
						$amount_diff = (floatval($amount) - floatval($old_amount));
						
						$this->db->where('invoice_id', $existing->invoice_id)
							->update('invoice', [
								'amount' => $amount,
								'due' => $old_due + $amount_diff
							]);
						
						$success_count++;
					} else {
						$invoice_code_f = $this->db->get_where('settings', array('type' => 'invoice_number_format'))->row()->description;
						
						$this->db->select('invoice_code');
						$this->db->order_by('invoice_code', 'desc');
						$this->db->limit(1);
						$inv_query = $this->db->get('invoice');
						
						if ($inv_query->num_rows() > 0) {
							$inv_id = $inv_query->row()->invoice_code;
							$invoice_code = $inv_id + 1;
							
							if (substr($inv_id, 0, 1) == 0) {
								$old_len = strlen($inv_id);
								$new_len = strlen($invoice_code);
								$act_len = ($old_len - $new_len);
								$invoice_code = substr($inv_id, 0, $act_len) . $invoice_code;
							}
						} else {
							$inv_id = $invoice_code_f;
							$invoice_code = $inv_id;
							
							if (substr($inv_id, 0, 1) == 0) {
								$old_len = strlen($inv_id);
								$new_len = strlen($invoice_code);
								$act_len = ($old_len - $new_len);
								$invoice_code = substr($inv_id, 0, $act_len) . $invoice_code;
							}
						}
						
						$invoice_data = [
							'invoice_code' => $invoice_code,
							'student_id' => $student_id,
							'class_id' => $enroll->class_id,
							'residence_type' => $residence_type,
							'title' => 'ARREARS',
							'description' => 'Previous term arrears',
							'amount' => $amount,
							'amount_paid' => 0,
							'due' => $amount,
							'status' => 'unpaid',
							'year' => $running_year,
							'term' => $running_term,
							'creation_timestamp' => $creation_timestamp,
							'can_delete' => 'default',
							'can_edit' => 'default'
						];
						
						$this->db->insert('invoice', $invoice_data);
						$success_count++;
					}
				}
				
				$message = "Import completed: $success_count invoice(s) created/updated";
				if($skip_count > 0) {
					$message .= ", $skip_count skipped (zero amount)";
				}
				if($error_count > 0) {
					$message .= ", $error_count error(s)";
				}
				
				echo json_encode([
					'status' => 'success',
					'message' => $message,
					'details' => [
						'success' => $success_count,
						'skipped' => $skip_count,
						'errors' => $error_count,
						'error_messages' => $errors
					]
				]);
				
			} catch(Exception $e) {
				echo json_encode(['status' => 'error', 'message' => 'Error processing data: ' . $e->getMessage()]);
			}
			
			return;
		}
		
		$this->load->view('backend/admin/bulk_arrears_import_modal');
	}

	// ============================================================================
	// RECEIPT MODIFICATION APPROVAL WORKFLOW
	// ============================================================================

	function request_receipt_modification() {
		$receipt_code = $this->input->post('receipt_code');
		$request_type = $this->input->post('request_type');
		$reason = $this->input->post('reason');
		$new_data = $this->input->post('new_data');
		
		$user_id = $this->session->userdata('login_user_id');
		if(!$user_id) {
			echo json_encode(['status' => 'error', 'message' => 'User session expired. Please login again.']);
			return;
		}
		
		$is_super_admin = $this->session->userdata('user_type') == 1;
		
		$payments = $this->db->where('receipt_code', $receipt_code)->get('payment')->result_array();
		if(empty($payments)) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('receipt_not_found')]);
			return;
		}
		
		// Check if there's already a pending request for this receipt
		$existing_request = $this->db->where('receipt_code', $receipt_code)
			->where('status', 'pending')
			->get('receipt_modification_requests')
			->row();
		
		if($existing_request) {
			echo json_encode(['status' => 'error', 'message' => 'A pending modification request already exists for this receipt. Please wait for approval or rejection before submitting a new request.']);
			return;
		}
		
		if($is_super_admin) {
			// Super admin can modify directly without approval
			$this->db->trans_start();
			
			// Create a mock request object for the process methods
			$mock_request = (object)[
				'receipt_code' => $receipt_code,
				'request_type' => $request_type,
				'original_data' => json_encode($payments),
				'new_data' => $new_data
			];
			
			if($request_type == 'delete') {
				$this->process_receipt_deletion($mock_request, $user_id);
			} else {
				$this->process_receipt_edit($mock_request, $user_id);
			}
			
			$this->db->trans_complete();
			
			if($this->db->trans_status() === FALSE) {
				echo json_encode(['status' => 'error', 'message' => 'Transaction failed']);
			} else {
				echo json_encode(['status' => 'success', 'message' => get_phrase('modification_completed')]);
			}
			return;
		}
		
		$request_data = [
			'receipt_code' => $receipt_code,
			'payment_id' => $payments[0]['payment_id'],
			'request_type' => $request_type,
			'requested_by' => $user_id,
			'requested_at' => time(),
			'reason' => $reason,
			'status' => 'pending',
			'original_data' => json_encode($payments),
			'new_data' => $new_data,
			'notification_sent' => 0
		];
		
		$this->db->insert('receipt_modification_requests', $request_data);
		$request_id = $this->db->insert_id();
		
		$this->send_modification_notifications($request_id);
		
		echo json_encode(['status' => 'success', 'message' => get_phrase('modification_request_submitted')]);
	}

	function get_receipt_modification_status() {
		$receipt_code = $this->input->post('receipt_code');
		
		$request = $this->db->where('receipt_code', $receipt_code)
			->where_in('status', ['pending', 'rejected'])
			->order_by('requested_at', 'DESC')
			->get('receipt_modification_requests')
			->row();
		
		if($request) {
			echo json_encode([
				'has_request' => true,
				'status' => $request->status,
				'request_id' => $request->request_id
			]);
		} else {
			echo json_encode(['has_request' => false]);
		}
	}

	function get_receipt_modification_requests() {
		$requests = $this->db->order_by('requested_at', 'DESC')->get('receipt_modification_requests')->result_array();
		
		if(empty($requests)) {
			echo '<div class="empty-state">
				<i class="fa fa-inbox"></i>
				<div>'.get_phrase('no_modification_requests_found').'</div>
			</div>';
			return;
		}
		
		foreach($requests as $request) {
			$payments = json_decode($request['original_data'], true);
			$payment = is_array($payments) && !empty($payments) ? $payments[0] : null;
			if(!$payment) continue;
			
			$student = $this->db->where('student_id', $payment['student_id'])->get('student')->row();
			$requester = $this->db->where('admin_id', $request['requested_by'])->get('admin')->row();
			$total_amount = is_array($payments) ? array_sum(array_column($payments, 'amount')) : 0;
			?>
			<div class="request-card <?php echo $request['status']; ?>" data-status="<?php echo $request['status']; ?>">
				<div class="request-header">
					<div class="request-title">
						<i class="fa fa-<?php echo $request['request_type'] == 'edit' ? 'edit' : 'trash'; ?>"></i>
						<?php echo ucfirst($request['request_type']); ?> Request #<?php echo $request['request_id']; ?>
					</div>
					<span class="request-badge badge-<?php echo $request['status']; ?>">
						<?php echo $request['status']; ?>
					</span>
				</div>

				<div class="request-details">
					<div class="detail-item">
						<div class="detail-label"><?php echo get_phrase('student'); ?></div>
						<div class="detail-value"><?php echo $student->name; ?></div>
					</div>
					<div class="detail-item">
						<div class="detail-label"><?php echo get_phrase('receipt_number'); ?></div>
						<div class="detail-value">#<?php echo $request['receipt_code']; ?></div>
					</div>
					<div class="detail-item">
						<div class="detail-label"><?php echo get_phrase('amount'); ?></div>
						<div class="detail-value">GHS <?php echo number_format($total_amount, 2); ?></div>
					</div>
					<div class="detail-item">
						<div class="detail-label"><?php echo get_phrase('requested_by'); ?></div>
						<div class="detail-value"><?php echo $requester->name; ?></div>
					</div>
					<div class="detail-item">
						<div class="detail-label"><?php echo get_phrase('requested_date'); ?></div>
						<div class="detail-value"><?php echo date('d M Y, H:i', $request['requested_at']); ?></div>
					</div>
				</div>

				<div style="margin-top: 12px; display: flex; align-items: flex-start; gap: 12px;">
					<div style="flex: 1;">
						<div class="detail-label"><?php echo get_phrase('reason'); ?></div>
						<div style="padding: 12px; background: #f9fafb; border-radius: 8px; margin-top: 4px;">
							<?php echo $request['reason']; ?>
						</div>
					</div>
					<div style="display: flex; gap: 12px; align-items: flex-start; padding-top: 24px;">
						<button class="btn-action btn-view" onclick="viewRequestDetails(<?php echo $request['request_id']; ?>)">
							<i class="fa fa-eye"></i> <?php echo get_phrase('view_details'); ?>
						</button>
						<?php if($request['status'] == 'pending' && $this->session->userdata('user_type') == 1): ?>
						<button class="btn-action btn-approve" onclick="approveRequest(<?php echo $request['request_id']; ?>)">
							<i class="fa fa-check"></i> <?php echo get_phrase('approve'); ?>
						</button>
						<button class="btn-action btn-reject" onclick="rejectRequest(<?php echo $request['request_id']; ?>)">
							<i class="fa fa-times"></i> <?php echo get_phrase('reject'); ?>
						</button>
						<?php elseif($request['status'] == 'approved' && $this->session->userdata('user_type') == 1): ?>
						<button class="btn-action btn-reject" onclick="revokeApproval(<?php echo $request['request_id']; ?>)">
							<i class="fa fa-undo"></i> <?php echo get_phrase('revoke_approval'); ?>
						</button>
						<?php endif; ?>
					</div>
				</div>

				<?php if($request['status'] == 'rejected' && $request['rejection_reason']): ?>
				<div style="margin-top: 12px;">
					<div class="detail-label"><?php echo get_phrase('rejection_reason'); ?></div>
					<div style="padding: 12px; background: #fee2e2; border-radius: 8px; margin-top: 4px; color: #991b1b;">
						<?php echo $request['rejection_reason']; ?>
					</div>
				</div>
				<?php endif; ?>
			</div>
			<?php
		}
	}

	function approve_receipt_modification() {
		$request_id = $this->input->post('request_id');
		$user_id = $this->session->userdata('login_user_id');
		
		// Idempotency: Use database lock to prevent concurrent processing
		$this->db->trans_start();
		
		// Lock the row for update to prevent race conditions
		$request = $this->db->where('request_id', $request_id)
			->where('status', 'pending')
			->limit(1)
			->get('receipt_modification_requests')
			->row();
		
		if(!$request) {
			$this->db->trans_rollback();
			
			// Check actual status for better error message
			$existing = $this->db->where('request_id', $request_id)
				->get('receipt_modification_requests')
				->row();
			
			if(!$existing) {
				echo json_encode(['status' => 'error', 'message' => 'Request not found']);
			} else {
				echo json_encode([
					'status' => 'error', 
					'message' => 'Request has already been ' . $existing->status,
					'already_processed' => true
				]);
			}
			return;
		}
		
		// Immediately update status to prevent duplicate processing
		$this->db->where('request_id', $request_id)
			->update('receipt_modification_requests', [
				'status' => 'processing',
				'approved_by' => $user_id,
				'approved_at' => time()
			]);
		
		try {
			// Process modification based on type
			if($request->request_type == 'delete') {
				$this->process_receipt_deletion($request, $user_id);
			} else {
				$this->process_receipt_edit($request, $user_id);
			}
			
			// Mark as approved after successful processing
			$this->db->where('request_id', $request_id)
				->update('receipt_modification_requests', ['status' => 'approved']);
			
			// Log audit trail
			$this->log_modification_audit($request_id, $request->receipt_code, $request->request_type, $user_id);
			
			// Notify requester
			$this->notify_requester($request->requested_by, 'approved', $request_id);
			
			// Complete transaction
			$this->db->trans_complete();
			
			if($this->db->trans_status() === FALSE) {
				throw new Exception('Transaction failed');
			}
			
			echo json_encode([
				'status' => 'success', 
				'message' => get_phrase('request_approved_successfully')
			]);
			
		} catch(Exception $e) {
			$this->db->trans_rollback();
			
			// Revert status back to pending on failure
			$this->db->where('request_id', $request_id)
				->update('receipt_modification_requests', ['status' => 'pending']);
			
			echo json_encode([
				'status' => 'error', 
				'message' => 'Processing failed: ' . $e->getMessage()
			]);
		}
	}
	
	private function process_receipt_deletion($request, $user_id) {
		$payments = json_decode($request->original_data, true);
		
		foreach($payments as $payment) {
			// Reverse financial entries
			$this->Finance_model->reverse_payment_sync($payment['payment_id']);
			
			// Update invoice: reverse amount_paid and restore due
			$this->db->where('invoice_id', $payment['invoice_id']);
			$this->db->set('amount_paid', 'amount_paid - ' . $payment['amount'], FALSE);
			$this->db->set('due', 'due + ' . $payment['amount'], FALSE);
			$this->db->update('invoice');
		}
		
		// Delete payment records
		$this->db->where('receipt_code', $request->receipt_code)->delete('payment');
	}
	
	private function process_receipt_edit($request, $user_id) {
		$old_payments = json_decode($request->original_data, true);
		$new_data = json_decode($request->new_data, true);
		$new_amount = $new_data['amount'];
		$receipt_code = $request->receipt_code;
		$student_id = $old_payments[0]['student_id'];
		
		// Load Credit model for credit handling
		$this->load->model('Credit_model');
		
		// Step 1: Reverse ALL old payments AND delete associated credits
		foreach($old_payments as $payment) {
			$this->Finance_model->reverse_payment_sync($payment['payment_id']);
			
			// Reverse invoice amounts
			$this->db->where('invoice_id', $payment['invoice_id']);
			$this->db->set('amount_paid', 'amount_paid - ' . $payment['amount'], FALSE);
			$this->db->set('due', 'due + ' . $payment['amount'], FALSE);
			$this->db->update('invoice');
		}
		
		// Delete old credit records associated with this receipt
		$old_credits = $this->db->where('source_receipt_code', $receipt_code)
			->where('student_id', $student_id)
			->get('student_credits')->result_array();
		
		if(!empty($old_credits)) {
			foreach($old_credits as $credit) {
				// If credit was already applied to invoices, we need to reverse those applications
				if($credit['applied_amount'] > 0) {
					// Get applications
					$applications = $this->db->where('credit_id', $credit['credit_id'])
						->get('credit_applications')->result_array();
					
					foreach($applications as $app) {
						// Reverse the credit application on the invoice
						$this->db->where('invoice_id', $app['invoice_id']);
						$this->db->set('credit_applied', 'credit_applied - ' . $app['applied_amount'], FALSE);
						$this->db->set('due', 'due + ' . $app['applied_amount'], FALSE);
						$this->db->update('invoice');
						
						// Delete the application record
						$this->db->where('application_id', $app['application_id'])->delete('credit_applications');
					}
				}
			}
			
			// Delete the credit records
			$this->db->where('source_receipt_code', $receipt_code)
				->where('student_id', $student_id)
				->delete('student_credits');
		}
		
		// Step 2: Delete old payment records
		$this->db->where('receipt_code', $receipt_code)->delete('payment');
		
		// Step 3: Get ALL owing invoices for this student (like line 11600)
		$owing_invoice_ids_array = $this->financial_report_model->getAllBillInvoicesIdsOwingByStudentId($student_id);
		$owing_invoice_ids = array_column($owing_invoice_ids_array, 'invoice_id');
		
		if(empty($owing_invoice_ids)) {
			return; // No invoices to pay
		}
		
		// Step 4: Redistribute new amount using exact payment allocation logic from line 11600
		$remaining_amount = $new_amount;
		$payment_template = $old_payments[0]; // Use first payment as template for metadata
		
		foreach($owing_invoice_ids as $invoice_id) {
			if($remaining_amount < 1) break;
			
			// Get invoice details
			$invoice = $this->db->where('invoice_id', $invoice_id)->get('invoice')->row();
			$amount_due = $invoice->due;
			
			// Determine payment amount for this invoice
			if($amount_due > $remaining_amount) {
				$payment_amount = $remaining_amount;
				$remaining_amount = 0;
			} else {
				$payment_amount = $amount_due;
				$remaining_amount -= $amount_due;
			}
			
			// Create new payment record
			$payment_data = [
				'receipt_code' => $receipt_code,
				'student_id' => $payment_template['student_id'],
				'class_id' => $payment_template['class_id'],
				'invoice_id' => $invoice->invoice_id,
				'invoice_code' => $invoice->invoice_code,
				'amount' => $payment_amount,
				'payment_type' => $payment_template['payment_type'],
				'payment_method' => $payment_template['payment_method'],
				'transaction_id' => $payment_template['transaction_id'] ?? null,
				'bank_name' => $payment_template['bank_name'] ?? null,
				'cheque_number' => $payment_template['cheque_number'] ?? null,
				'title' => $invoice->title,
				'description' => $invoice->description,
				'residence_type' => $invoice->residence_type,
				'timestamp' => $payment_template['timestamp'],
				'day_timestamp' => $payment_template['day_timestamp'],
				'year' => $payment_template['year'],
				'term' => $payment_template['term'] ?? null,
				'sem' => $payment_template['sem'] ?? null,
				'issuer_id' => $payment_template['issuer_id'],
				'account_type' => $payment_template['account_type']
			];
			
			$this->db->insert('payment', $payment_data);
			$payment_id = $this->db->insert_id();
			
			// Update invoice (matching line 11600 logic)
			$this->db->where('invoice_id', $invoice->invoice_id);
			$this->db->set('amount_paid', 'amount_paid + ' . $payment_amount, FALSE);
			$this->db->set('due', 'due - ' . $payment_amount, FALSE);
			$this->db->set('payment_timestamp', $payment_data['timestamp']);
			$this->db->set('payment_method', $payment_data['payment_method']);
			$this->db->update('invoice');
			
			// Sync to financial system
			sync_payment_to_accounts($payment_id);
			sync_payment_to_ledger($payment_id);
		}
		
		// Step 5: Update payment.due with total remaining balance (matching line 14850-14854)
		$this->db->select_sum('due');
		$this->db->from('invoice');
		$this->db->where('can_delete !=', 'trash');
		$this->db->where('due !=', 0);
		$this->db->where('student_id', $student_id);
		$bal_due_query = $this->db->get();
		
		if($bal_due_query->num_rows() > 0) {
			$bal_due = $bal_due_query->row()->due;
		} else {
			$bal_due = 0;
		}

		if($bal_due > 0) {
			// Update the last payment record with total remaining balance
			$this->db->where('receipt_code', $receipt_code);
			$this->db->set('due', 'due + ' . $bal_due, FALSE);
			$this->db->limit(1);
			$this->db->update('payment');
		}
		
		// Step 6: Handle overpayment - create credit if remaining_amount > 0
		if($remaining_amount > 0) {
			// Student overpaid - create new credit
			$credit_data = [
				'student_id' => $student_id,
				'credit_amount' => $remaining_amount,
				'source_receipt_code' => $receipt_code,
				'created_by' => $user_id,
				'notes' => "Overpayment from edited receipt #{$receipt_code}. Amount received exceeded total outstanding invoices."
			];
			
			$this->db->insert('student_credits', $credit_data);
			$credit_id = $this->db->insert_id();
			
			// Record the overpayment in payment table for accounting
			$overpayment_record = [
				'receipt_code' => $receipt_code,
				'student_id' => $student_id,
				'class_id' => $payment_template['class_id'],
				'invoice_id' => null,
				'invoice_code' => null,
				'amount' => $remaining_amount,
				'payment_type' => $payment_template['payment_type'],
				'payment_method' => $payment_template['payment_method'],
				'transaction_id' => $payment_template['transaction_id'] ?? null,
				'bank_name' => $payment_template['bank_name'] ?? null,
				'cheque_number' => $payment_template['cheque_number'] ?? null,
				'title' => 'PREPAID CREDIT',
				'description' => 'Overpayment converted to student credit - Credit ID: ' . $credit_id,
				'residence_type' => $payment_template['residence_type'],
				'timestamp' => $payment_template['timestamp'],
				'day_timestamp' => $payment_template['day_timestamp'],
				'year' => $payment_template['year'],
				'term' => $payment_template['term'] ?? null,
				'sem' => $payment_template['sem'] ?? null,
				'issuer_id' => $payment_template['issuer_id'],
				'account_type' => $payment_template['account_type']
			];
			
			$this->db->insert('payment', $overpayment_record);
		}
	}

	function reject_receipt_modification() {
		$request_id = $this->input->post('request_id');
		$reason = $this->input->post('reason');
		$user_id = $this->session->userdata('login_user_id');
		
		$this->db->where('request_id', $request_id)->update('receipt_modification_requests', [
			'status' => 'rejected',
			'approved_by' => $user_id,
			'approved_at' => time(),
			'rejection_reason' => $reason
		]);
		
		$request = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row();
		$this->notify_requester($request->requested_by, 'rejected', $request_id);
		
		echo json_encode(['status' => 'success', 'message' => get_phrase('request_rejected')]);
	}

	function revoke_receipt_approval() {
		$request_id = $this->input->post('request_id');
		$user_id = $this->session->userdata('login_user_id');
		
		if($this->session->userdata('user_type') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Only super admin can revoke approvals']);
			return;
		}
		
		$request = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row();
		
		if(!$request || $request->status != 'approved') {
			echo json_encode(['status' => 'error', 'message' => 'Invalid request or not approved']);
			return;
		}
		
		// Reverse the changes that were made during approval
		if($request->request_type == 'delete') {
			// Restore deleted receipt - recreate payments from original_data
			$original_payments = json_decode($request->original_data, true);
			foreach($original_payments as $payment) {
				$this->db->insert('payment', $payment);
				
				// Update invoice balances
				$this->db->where('invoice_id', $payment['invoice_id'])
					->set('amount_paid', 'amount_paid + ' . $payment['amount'], FALSE)
					->set('due', 'due - ' . $payment['amount'], FALSE)
					->update('invoice');
				
				// Update invoice status
				$invoice = $this->db->where('invoice_id', $payment['invoice_id'])->get('invoice')->row();
				$status = $invoice->due <= 0 ? 'paid' : ($invoice->amount_paid > 0 ? 'partial' : 'unpaid');
				$this->db->where('invoice_id', $payment['invoice_id'])->update('invoice', ['status' => $status]);
			}
		} else {
			// Reverse edit - restore original payment data
			$original_payments = json_decode($request->original_data, true);
			foreach($original_payments as $payment) {
				$this->db->where('payment_id', $payment['payment_id'])->update('payment', $payment);
				
				// Recalculate invoice balances
				$invoice = $this->db->where('invoice_id', $payment['invoice_id'])->get('invoice')->row();
				$total_paid = $this->db->where('invoice_id', $payment['invoice_id'])
					->select_sum('amount')
					->get('payment')->row()->amount ?? 0;
				
				$this->db->where('invoice_id', $payment['invoice_id'])->update('invoice', [
					'amount_paid' => $total_paid,
					'due' => $invoice->amount - $total_paid,
					'status' => ($invoice->amount - $total_paid) <= 0 ? 'paid' : ($total_paid > 0 ? 'partial' : 'unpaid')
				]);
			}
		}
		
		// Update request status
		$this->db->where('request_id', $request_id)->update('receipt_modification_requests', [
			'status' => 'revoked',
			'revoked_by' => $user_id,
			'revoked_at' => time()
		]);
		
		// Log the revocation
		$this->db->insert('receipt_modification_audit', [
			'request_id' => $request_id,
			'receipt_code' => $request->receipt_code,
			'payment_id' => $request->payment_id,
			'action' => 'revoke',
			'performed_by' => $user_id,
			'performed_at' => time(),
			'ip_address' => $this->input->ip_address(),
			'user_agent' => $this->input->user_agent()
		]);
		
		$this->notify_requester($request->requested_by, 'revoked', $request_id);
		
		echo json_encode(['status' => 'success', 'message' => get_phrase('approval_revoked_successfully')]);
	}
	
	function receipt_modification_details($request_id) {
		$request = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row_array();
		$page_data['request'] = $request;
		$this->load->view('backend/admin/receipt_modification_details', $page_data);
	}
	
	function get_payment_by_receipt($receipt_code) {
		$payments = $this->db->where('receipt_code', $receipt_code)->get('payment')->result_array();
		if(!empty($payments)) {
			echo json_encode(['status' => 'success', 'payments' => $payments, 'receipt_code' => $receipt_code]);
		} else {
			echo json_encode(['status' => 'error', 'message' => 'Receipt not found']);
		}
	}


	private function send_modification_notifications($request_id) {
		$request = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row();
		$requester = $this->db->where('admin_id', $request->requested_by)->get('admin')->row();
		
		$super_admins = $this->db->where('level', 1)->get('admin')->result();
		$approval_link = base_url() . 'admin/modification_requests';
		$action = $request->request_type == 'edit' ? 'Edit' : 'Delete';
		$message = $requester->name . ' has requested to ' . strtolower($action) . ' receipt #' . $request->receipt_code . '. <a href="' . $approval_link . '" class="btn btn-sm btn-primary" style="margin-left: 10px;"><i class="fa fa-check-circle"></i> Review Request</a>';
		
		foreach($super_admins as $admin) {
			$this->db->insert('notifications', [
				'user_id' => $admin->admin_id,
				'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
				'type' => 'receipt_modification',
				'title' => 'Receipt Modification Request',
				'message' => $message,
				'is_read' => 0,
				'created_at' => date('Y-m-d H:i:s')
			]);
		}
		
		$this->db->where('request_id', $request_id)->update('receipt_modification_requests', ['notification_sent' => 1]);
	}

	private function notify_requester($user_id, $status, $request_id) {
		$request = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row();
		$view_link = base_url() . 'admin/student_invoice#receipt_modifications';
		$type_label = ucfirst($request->request_type);
		
		$messages = [
			'approved' => 'Your ' . $type_label . ' Receipt request for #' . $request->receipt_code . ' has been approved. <a href="' . $view_link . '" class="btn btn-sm btn-success notification-link" style="margin-left: 10px;" onclick="handleNotificationClick(event, \'receipt_modifications\'); return false;"><i class="fa fa-eye"></i> View Details</a>',
			'rejected' => 'Your ' . $type_label . ' Receipt request for #' . $request->receipt_code . ' has been rejected. <a href="' . $view_link . '" class="btn btn-sm btn-danger notification-link" style="margin-left: 10px;" onclick="handleNotificationClick(event, \'receipt_modifications\'); return false;"><i class="fa fa-eye"></i> View Details</a>',
			'revoked' => 'The approval for your ' . $type_label . ' Receipt request #' . $request->receipt_code . ' has been revoked. <a href="' . $view_link . '" class="btn btn-sm btn-warning notification-link" style="margin-left: 10px;" onclick="handleNotificationClick(event, \'receipt_modifications\'); return false;"><i class="fa fa-eye"></i> View Details</a>'
		];
		
		$message = $messages[$status] ?? 'Your receipt modification request status has changed';
		
		$this->db->insert('notifications', [
			'user_id' => $user_id,
			'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
			'type' => 'receipt_modification_' . $status,
			'title' => $type_label . ' Receipt Request ' . ucfirst($status),
			'message' => $message,
			'is_read' => 0,
			'created_at' => date('Y-m-d H:i:s')
		]);
	}

	private function log_modification_audit($request_id, $receipt_code, $action, $user_id) {
		$request = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row();
		
		$this->db->insert('receipt_modification_audit', [
			'request_id' => $request_id,
			'receipt_code' => $receipt_code,
			'payment_id' => $request->payment_id,
			'action' => $action,
			'performed_by' => $user_id,
			'performed_at' => time(),
			'before_data' => $request->original_data,
			'after_data' => $request->new_data,
			'ip_address' => $this->input->ip_address(),
			'user_agent' => $this->input->user_agent()
		]);
	}


	function invoice_modification_details($request_id) {
		$request = $this->db->where('request_id', $request_id)->get('invoice_modification_requests')->row_array();
		$page_data['request'] = $request;
		$this->load->view('backend/admin/invoice_modification_details', $page_data);
	}

	function get_modification_requests() {
		$status = $this->input->get('status') ?: 'pending';
		$requests = $this->db->where('status', $status)
			->order_by('requested_at', 'DESC')
			->get('receipt_modification_requests')
			->result_array();
		
		echo json_encode(['status' => 'success', 'data' => $requests]);
	}

	function receipt_modification_requests_view() {
		$status = $this->input->get('status') ?: 'pending';
		$page_data['requests'] = $this->db->where('status', $status)
			->order_by('requested_at', 'DESC')
			->get('receipt_modification_requests')
			->result_array();
		$this->load->view('backend/admin/receipt_modification_requests', $page_data);
	}

	function receipt_modification_modal($payment_id) {
		$this->load->view('backend/admin/receipt_modification_modal');
	}



	public function update_arrears_tab_setting() {
		$enable = $this->input->post('enable'); // 'yes' or 'no'
		
		// Check if setting exists
		$exists = $this->db->get_where('settings', array('type' => 'enable_arrears_tab'))->num_rows();
		
		if($exists > 0) {
			// Update existing setting
			$this->db->where('type', 'enable_arrears_tab');
			$this->db->update('settings', array('description' => $enable));
		} else {
			// Insert new setting
			$this->db->insert('settings', array(
				'type' => 'enable_arrears_tab',
				'description' => $enable
			));
		}
		
		echo json_encode(array('status' => 'success'));
	}

	// =================================================================
	// INVOICE MODIFICATION PROCESS & APPROVAL WORK FLOW===
	// ==================================================================
	
	// Invoice Modification Modal
	function invoice_modification_modal($invoice_code = '') {
		$page_data['invoice_code'] = $invoice_code;
		$this->load->view('backend/admin/invoice_modification_modal', $page_data);
	}

	// Request Invoice Modification
	function request_invoice_modification() {
		$invoice_code = $this->input->post('invoice_code');
		$student_id = $this->input->post('student_id');
		$request_type = $this->input->post('request_type');
		$reason = $this->input->post('reason');
		$user_id = $this->session->userdata('login_user_id');
		$admin_level = $this->db->get_where('admin', array('admin_id' => $user_id))->row()->level;
		
		// Check for payments if delete request
		if($request_type == 'delete') {
			$payments = $this->db->where('invoice_code', $invoice_code)->get('payment')->result_array();
			if(!empty($payments)) {
				echo json_encode([
					'status' => 'warning',
					'message' => 'This invoice has payment records. Deleting will affect financial records.',
					'has_payments' => true,
					'payment_count' => count($payments)
				]);
				return;
			}
		}
		
		// Get old invoice data
		$old_invoice_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result_array();
		$old_data = json_encode($old_invoice_items);
		
		// Get new data for edit
		$new_data = null;
		if($request_type == 'edit') {
			$items_json = $this->input->post('items');
			$items = json_decode($items_json, true);
			$new_data = $items_json;
		}
		
		// If super admin, apply changes directly
		if($admin_level == 1) {
			if($request_type == 'edit') {
				$result = $this->apply_invoice_edit($invoice_code, $items);
			} else {
				$result = $this->apply_invoice_delete($invoice_code);
			}
			
			if($result) {
				echo json_encode([
					'status' => 'success',
					'message' => get_phrase('invoice_modified_successfully')
				]);
			} else {
				echo json_encode([
					'status' => 'error',
					'message' => get_phrase('operation_failed')
				]);
			}
			return;
		}
		
		// For non-super admin, create modification request
		$data = array(
			'invoice_code' => $invoice_code,
			'student_id' => $student_id,
			'request_type' => $request_type,
			'requested_by' => $user_id,
			'request_reason' => $reason,
			'old_data' => $old_data,
			'new_data' => $new_data,
			'status' => 'pending',
			'created_at' => date('Y-m-d H:i:s')
		);
		
		$this->db->insert('invoice_modification_requests', $data);
		$request_id = $this->db->insert_id();
		
		// Send notification to super admin
		$this->send_invoice_modification_notification($request_id);
		
		echo json_encode([
			'status' => 'success',
			'message' => get_phrase('modification_request_submitted')
		]);
	}

	// Confirm Invoice Delete with Payments
	function confirm_invoice_delete_with_payments() {
		$invoice_code = $this->input->post('invoice_code');
		$student_id = $this->input->post('student_id');
		$reason = $this->input->post('reason');
		$user_id = $this->session->userdata('login_user_id');
		$admin_level = $this->db->get_where('admin', array('admin_id' => $user_id))->row()->level;
		
		// Get old invoice data
		$old_invoice_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result_array();
		$old_data = json_encode($old_invoice_items);
		
		// If super admin, apply delete directly
		if($admin_level == 1) {
			$result = $this->apply_invoice_delete($invoice_code);
			
			if($result) {
				echo json_encode([
					'status' => 'success',
					'message' => get_phrase('invoice_deleted_successfully')
				]);
			} else {
				echo json_encode([
					'status' => 'error',
					'message' => get_phrase('operation_failed')
				]);
			}
			return;
		}
		
		// For non-super admin, create modification request
		$data = array(
			'invoice_code' => $invoice_code,
			'student_id' => $student_id,
			'request_type' => 'delete',
			'requested_by' => $user_id,
			'request_reason' => $reason,
			'old_data' => $old_data,
			'new_data' => null,
			'status' => 'pending',
			'created_at' => date('Y-m-d H:i:s')
		);
		
		$this->db->insert('invoice_modification_requests', $data);
		$request_id = $this->db->insert_id();
		
		// Send notification to super admin
		$this->send_invoice_modification_notification($request_id);
		
		echo json_encode([
			'status' => 'success',
			'message' => get_phrase('modification_request_submitted')
		]);
	}

	// Apply Invoice Edit
	private function apply_invoice_edit($invoice_code, $items) {
		$this->db->trans_start();
		
		// ============================================
		// CREDIT SYSTEM: Handle credits before invoice edit
		// ============================================
		$this->load->model('Credit_model');
		
		// Get all invoice items for this invoice_code to reverse credits
		$invoice_items_to_update = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result();
		
		foreach($invoice_items_to_update as $inv_item) {
			$invoice_id = $inv_item->invoice_id;
			
			// Step 1: Get old credit applications for this invoice item
			$old_credit_apps = $this->db->where('invoice_id', $invoice_id)->get('credit_applications')->result();
			
			// Step 2: Reverse old credit applications
			foreach($old_credit_apps as $app) {
				$credit = $this->db->get_where('student_credits', ['credit_id' => $app->credit_id])->row();
				if($credit) {
					$new_applied = max(0, $credit->applied_amount - $app->applied_amount);
					$new_status = ($new_applied >= $credit->credit_amount) ? 'fully_applied' : 'active';
					$this->db->where('credit_id', $app->credit_id)
						->update('student_credits', [
							'applied_amount' => $new_applied,
							'status' => $new_status
						]);
				}
			}
			
			// Step 3: Delete old credit application records
			$this->db->where('invoice_id', $invoice_id)->delete('credit_applications');
			
			// Step 4: Reset invoice credit_applied field
			$this->db->where('invoice_id', $invoice_id)->update('invoice', ['credit_applied' => 0]);
		}
		// ============================================
		
		// Get discount info before modification
		$discount = $this->db->where('invoice_code', $invoice_code)
			->where('status', 'approved')
			->get('invoice_discounts')->row();
		
		$has_discount = !empty($discount);
		$discount_profile = null;
		
		if($has_discount) {
			$discount_profile = $this->db->where('profile_id', $discount->profile_id)
				->get('discount_profiles')->row();
		}
		
		// Get existing invoice items
		$existing_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result_array();
		$existing_ids = array_column($existing_items, 'invoice_id');
		$submitted_ids = array();
		
		// Get student_id and other info from first existing item
		$first_item = !empty($existing_items) ? $existing_items[0] : null;
		$student_id = $first_item ? $first_item['student_id'] : null;
		$class_id = $first_item ? $first_item['class_id'] : null;
		$year = $first_item ? $first_item['year'] : null;
		$term = $first_item ? $first_item['term'] : null;
		$creation_timestamp = $first_item ? $first_item['creation_timestamp'] : null;
		
		// Process submitted items (update or insert)
		foreach($items as $item) {
			if(!empty($item['invoice_id'])) {
				// Existing item - update (preserve original creation_timestamp)
				$invoice_id = $item['invoice_id'];
				$submitted_ids[] = $invoice_id;
				
				$current_item = $this->db->where('invoice_id', $invoice_id)->get('invoice')->row();
				$amount_paid = $current_item->amount_paid;
				$new_amount = $item['amount'];
				$new_due = (floatval($new_amount) - floatval($amount_paid));
				
				if($new_due <= 0) {
					$status = 'paid';
				} elseif($amount_paid > 0) {
					$status = 'partial';
				} else {
					$status = 'unpaid';
				}
				
				$this->db->where('invoice_id', $invoice_id)->update('invoice', array(
					'description' => $item['description'],
					'amount' => $new_amount,
					'due' => $new_due,
					'status' => $status
					// creation_timestamp preserved (not updated)
				));
			} else {
				// New item - insert with original invoice creation timestamp
				$insert_data = array(
					'invoice_code' => $invoice_code,
					'student_id' => $student_id,
					'class_id' => $class_id,
					'year' => $year,
					'term' => $term,
					'title' => strtoupper($item['title']),
					'description' => $item['description'],
					'amount' => $item['amount'],
					'amount_paid' => 0,
					'due' => $item['amount'],
					'status' => 'unpaid',
					'creation_timestamp' => $creation_timestamp
				);
				$this->db->insert('invoice', $insert_data);
				$submitted_ids[] = $this->db->insert_id();
			}
		}
		
		// Delete items that were removed
		$items_to_delete = array_diff($existing_ids, $submitted_ids);
		if(!empty($items_to_delete)) {
			$this->db->where_in('invoice_id', $items_to_delete)->delete('invoice');
		}
		
		// Recalculate discount if exists
		if($has_discount && $discount_profile) {
			// Get old invoice items BEFORE modification to compare
			$old_items_map = array();
			foreach($existing_items as $old_item) {
				$old_items_map[$old_item['title']] = $old_item;
			}

			// Get old discount items for comparison
			$old_discount_items = $this->db->where('discount_id', $discount->discount_id)
				->get('invoice_discount_items')->result_array();
			$old_discount_map = array();
			foreach($old_discount_items as $disc_item) {
				$old_discount_map[$disc_item['item_title']] = $disc_item;
			}
			
			// Get current invoice items (still have discount applied)
			$current_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result_array();
			
			// Check if applicable items' amounts changed
			$applicable_changed = false;
			
			if($discount_profile->bill_item_ids === '*') {
				// Wildcard: check ALL items
				foreach($current_items as $item) {
					if(isset($old_items_map[$item['title']])) {
						// Compare current amount (with discount) to old amount (with discount)
						if(abs($item['amount'] - $old_items_map[$item['title']]['amount']) > 0.01) {
							$applicable_changed = true;
							break;
						}
					} else {
						// New item added
						$applicable_changed = true;
						break;
					}
				}
			} else {
				// Specific items: only check items that discount applies to
				$profile_bill_items = explode(',', $discount_profile->bill_item_ids);
				foreach($current_items as $item) {
					$is_applicable = false;
					if(isset($item['bill_item_id']) && in_array($item['bill_item_id'], $profile_bill_items)) {
						$is_applicable = true;
					} else {
						// Match by title
						foreach($profile_bill_items as $bill_item_id) {
							$bill_item = $this->db->where('id', trim($bill_item_id))->get('bill_item')->row();
							if($bill_item && strtolower(trim($item['title'])) == strtolower(trim($bill_item->title))) {
								$is_applicable = true;
								break;
							}
						}
					}
					
					if($is_applicable) {
						if(isset($old_items_map[$item['title']])) {
							// Compare amounts
							if(abs($item['amount'] - $old_items_map[$item['title']]['amount']) > 0.01) {
								$applicable_changed = true;
								break;
							}
						} else {
							// New applicable item added
							$applicable_changed = true;
							break;
						}
					}
				}
			}
			
			// Only recalculate discount if applicable items changed
			if($applicable_changed) {
				// Restore original amounts
				if(count($old_discount_items) > 0) {
					foreach($old_discount_items as $disc_item) {
						$this->db->where('invoice_id', $disc_item['invoice_id'])
							->set('amount', 'amount + ' . $disc_item['discount_amount'], FALSE)
							->set('due', 'due + ' . $disc_item['discount_amount'], FALSE)
							->update('invoice');
					}
				}
				
				// Delete old discount items
				$this->db->where('discount_id', $discount->discount_id)->delete('invoice_discount_items');
				
				// Get updated invoice items (with restored amounts)
				$updated_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result_array();
				
				// Determine applicable items and calculate discount
				$applicable_items = array();
				$applicable_total = 0;
				
				if($discount_profile->bill_item_ids === '*') {
					foreach($updated_items as $idx => $item) {
						$applicable_total += $item['amount'];
						$applicable_items[] = $idx;
					}
				} else {
					$profile_bill_items = explode(',', $discount_profile->bill_item_ids);
					foreach($updated_items as $idx => $item) {
						$is_applicable = false;
						if(isset($item['bill_item_id']) && in_array($item['bill_item_id'], $profile_bill_items)) {
							$is_applicable = true;
						} else {
							foreach($profile_bill_items as $bill_item_id) {
								$bill_item = $this->db->where('id', trim($bill_item_id))->get('bill_item')->row();
								if($bill_item && strtolower(trim($item['title'])) == strtolower(trim($bill_item->title))) {
									$is_applicable = true;
									break;
								}
							}
						}
						if($is_applicable) {
							$applicable_total += $item['amount'];
							$applicable_items[] = $idx;
						}
					}
				}
				
				// Calculate new discount
				$new_discount_amount = ($discount_profile->discount_method == 'percentage') 
					? ($applicable_total * $discount_profile->discount_value / 100)
					: min($discount_profile->discount_value, $applicable_total);
				
				// Update discount record
				$this->db->where('discount_id', $discount->discount_id)->update('invoice_discounts', array(
					'discount_amount' => $new_discount_amount
				));
				
				// Apply discount to items
				if(count($applicable_items) > 0) {
					if($discount_profile->discount_method == 'percentage') {
						foreach($applicable_items as $idx) {
							$item = $updated_items[$idx];
							$item_discount = ($item['amount'] * $discount_profile->discount_value) / 100;
							
							$this->db->insert('invoice_discount_items', array(
								'discount_id' => $discount->discount_id,
								'invoice_id' => $item['invoice_id'],
								'invoice_code' => $invoice_code,
								'student_id' => $item['student_id'],
								'item_title' => $item['title'],
								'original_amount' => $item['amount'],
								'discount_amount' => $item_discount,
								'discounted_amount' => $item['amount'] - $item_discount
							));
							
							$this->db->where('invoice_id', $item['invoice_id'])
								->set('amount', 'amount - ' . $item_discount, FALSE)
								->set('due', 'due - ' . $item_discount, FALSE)
								->update('invoice');
						}
					} else {
						foreach($applicable_items as $idx) {
							$item = $updated_items[$idx];
							$item_discount = ($item['amount'] / $applicable_total) * $new_discount_amount;
							
							$this->db->insert('invoice_discount_items', array(
								'discount_id' => $discount->discount_id,
								'invoice_id' => $item['invoice_id'],
								'invoice_code' => $invoice_code,
								'student_id' => $item['student_id'],
								'item_title' => $item['title'],
								'original_amount' => $item['amount'],
								'discount_amount' => $item_discount,
								'discounted_amount' => $item['amount'] - $item_discount
							));
							
							$this->db->where('invoice_id', $item['invoice_id'])
								->set('amount', 'amount - ' . $item_discount, FALSE)
								->set('due', 'due - ' . $item_discount, FALSE)
								->update('invoice');
						}
					}
				}
			}
			// If applicable items didn't change, discount remains as-is (no action needed)
		}
		
		// Recalculate payment allocation after modification
		$this->recalculate_invoice_payments($invoice_code);
		
		// ============================================
		// CREDIT SYSTEM: Reapply credits after invoice edit
		// ============================================
		// Get updated invoice items and reapply credits
		$updated_invoice_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result();
		
		foreach($updated_invoice_items as $updated_item) {
			// Reapply credits to each invoice item with the new amounts
			$this->Credit_model->apply_credits_to_invoice($updated_item->invoice_id);
		}
		// ============================================
		
		$this->db->trans_complete();
		return $this->db->trans_status();
	}

	// Recalculate Invoice Payments After Modification
	private function recalculate_invoice_payments($invoice_code) {
		$invoice_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result_array();
		if(empty($invoice_items)) return;
		
		$payments = $this->db->where('invoice_code', $invoice_code)->order_by('timestamp', 'asc')->get('payment')->result_array();
		if(empty($payments)) return;
		
		$total_paid = array_sum(array_column($payments, 'amount'));
		$new_invoice_total = array_sum(array_column($invoice_items, 'amount'));
		
		// Reset all items (including credit_applied for clean state)
		foreach($invoice_items as $item) {
			$this->db->where('invoice_id', $item['invoice_id'])->update('invoice', array(
				'amount_paid' => 0, 
				'credit_applied' => 0,
				'due' => $item['amount'], 
				'status' => 'unpaid'
			));
		}
		
		// Reallocate payments proportionally
		$remaining_payment = $total_paid;
		foreach($invoice_items as $item) {
			if($remaining_payment <= 0) break;
			
			$payment_for_item = min($item['amount'], $remaining_payment);
			$new_due = $item['amount'] - $payment_for_item;
			$status = $new_due <= 0 ? 'paid' : ($payment_for_item > 0 ? 'partial' : 'unpaid');
			
			$this->db->where('invoice_id', $item['invoice_id'])->update('invoice', array(
				'amount_paid' => $payment_for_item,
				'due' => max(0, $new_due),
				'status' => $status
			));
			
			$remaining_payment -= $payment_for_item;
		}
	}

	// Apply Invoice Delete
	private function apply_invoice_delete($invoice_code) {
		$this->db->trans_start();
		
		// ============================================
		// CREDIT SYSTEM: Reverse credits before invoice deletion
		// ============================================
		$this->load->model('Credit_model');
		
		// Get all invoice items for this invoice_code
		$invoice_items_to_delete = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result();
		
		foreach($invoice_items_to_delete as $inv_item) {
			$invoice_id = $inv_item->invoice_id;
			
			// Step 1: Get credit applications for this invoice item
			$credit_apps = $this->db->where('invoice_id', $invoice_id)->get('credit_applications')->result();
			
			// Step 2: Reverse each credit application
			foreach($credit_apps as $app) {
				$credit = $this->db->get_where('student_credits', ['credit_id' => $app->credit_id])->row();
				if($credit) {
					// Return the credit back to the student's available pool
					$new_applied = max(0, $credit->applied_amount - $app->applied_amount);
					$new_status = ($new_applied >= $credit->credit_amount) ? 'fully_applied' : 'active';
					
					$this->db->where('credit_id', $app->credit_id)
						->update('student_credits', [
							'applied_amount' => $new_applied,
							'status' => $new_status
						]);
					
					// Log the credit reversal
					$this->Credit_model->log_credit_action(
						'credit_reversed_invoice_deleted', 
						$inv_item->student_id, 
						$app->applied_amount, 
						$invoice_id, 
						'invoice', 
						[
							'credit_id' => $app->credit_id,
							'invoice_code' => $invoice_code,
							'reason' => 'Invoice deleted'
						]
					);
				}
			}
			
			// Step 3: Delete credit application records
			$this->db->where('invoice_id', $invoice_id)->delete('credit_applications');
		}
		// ============================================
		
		// Get invoice and payment data before deletion
		$invoice_item = $this->db->where('invoice_code', $invoice_code)->get('invoice')->row();
		$student_id = $invoice_item ? $invoice_item->student_id : null;
		$payments = $this->db->where('invoice_code', $invoice_code)->get('payment')->result_array();
		
		// Reverse payment ledger entries first (before deleting payments)
		if(!empty($payments) && $student_id) {
			foreach($payments as $payment) {
				$this->Finance_model->reverse_payment_sync($payment['payment_id']);
			}
		}
		
		// Delete payments
		$this->db->where('invoice_code', $invoice_code)->delete('payment');
		
		// Delete discount items
		$discount = $this->db->where('invoice_code', $invoice_code)->get('invoice_discounts')->row();
		if($discount) {
			$this->db->where('discount_id', $discount->discount_id)->delete('invoice_discount_items');
			$this->db->where('invoice_code', $invoice_code)->delete('invoice_discounts');
		}
		
		// Delete invoice items
		$this->db->where('invoice_code', $invoice_code)->delete('invoice');
		
		$this->db->trans_complete();
		
		// Reverse invoice ledger entry after successful deletion
		if($this->db->trans_status() && $student_id) {
			$this->Finance_model->reverse_invoice_ledger($invoice_code, $student_id);
		}
		
		return $this->db->trans_status();
	}

	// Send Invoice Modification Notification
	private function send_invoice_modification_notification($request_id) {
		$request = $this->db->where('request_id', $request_id)->get('invoice_modification_requests')->row();
		$requester = $this->db->where('admin_id', $request->requested_by)->get('admin')->row();
		$student = $this->db->where('student_id', $request->student_id)->get('student')->row();
		
		// Get all super admins
		$super_admins = $this->db->where('level', 1)->get('admin')->result_array();
		
		$action = $request->request_type == 'edit' ? 'Edit' : 'Delete';
		$approval_link = base_url() . 'admin/invoice_modification_requests';
		$message = $requester->name . ' has requested to ' . strtolower($action) . ' invoice #' . $request->invoice_code . ' for student ' . $student->name . '. <a href="' . $approval_link . '" class="btn btn-sm btn-primary" style="margin-left: 10px;"><i class="fa fa-check-circle"></i> Review Request</a>';
		
		foreach($super_admins as $admin) {
			$this->db->insert('notifications', array(
				'user_id' => $admin['admin_id'],
				'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
				'type' => 'invoice_modification',
				'title' => 'Invoice Modification Request',
				'message' => $message,
				'is_read' => 0,
				'created_at' => date('Y-m-d H:i:s')
			));
		}
	}

	// View Invoice Modification Requests (Combined with Receipt Modifications)
	function invoice_modification_requests() {
		// This is now handled in modification_requests page
		redirect(site_url('admin/modification_requests'));
	}

	// Approve/Decline Invoice Modification
	function review_invoice_modification($request_id, $action) {
		$user_id = $this->session->userdata('login_user_id');
		$admin_level = $this->db->get_where('admin', array('admin_id' => $user_id))->row()->level;
		
		if($admin_level != 1) {
			echo json_encode([
				'status' => 'error',
				'message' => get_phrase('unauthorized_access')
			]);
			return;
		}
		
		// Start transaction for idempotency
		$this->db->trans_start();
		
		// Lock row and check status atomically
		$request = $this->db->where('request_id', $request_id)
			->where('status', 'pending')
			->limit(1)
			->get('invoice_modification_requests')
			->row();
		
		if(!$request) {
			$this->db->trans_rollback();
			
			$existing = $this->db->where('request_id', $request_id)
				->get('invoice_modification_requests')
				->row();
			
			if(!$existing) {
				echo json_encode(['status' => 'error', 'message' => get_phrase('request_not_found')]);
			} else {
				echo json_encode([
					'status' => 'error',
					'message' => 'Request has already been ' . $existing->status,
					'already_processed' => true
				]);
			}
			return;
		}
		
		// Immediately mark as processing
		$this->db->where('request_id', $request_id)
			->update('invoice_modification_requests', ['status' => 'processing']);
		
		if($action == 'approve') {
			// Apply the modification
			if($request->request_type == 'edit') {
				$items = json_decode($request->new_data, true);
				$result = $this->apply_invoice_edit($request->invoice_code, $items);
			} else {
				$result = $this->apply_invoice_delete($request->invoice_code);
			}
			
			if($result) {
				// Update request status
				$this->db->where('request_id', $request_id)->update('invoice_modification_requests', array(
					'status' => 'approved',
					'reviewed_by' => $user_id,
					'reviewed_at' => date('Y-m-d H:i:s')
				));
				
				// Financial Hook: Sync modification to ledger
				if($request->request_type == 'edit') {
					sync_invoice_to_ledger($request->invoice_code, $request->student_id);
				} else {
					$this->Finance_model->reverse_invoice_ledger($request->invoice_code, $request->student_id);
				}
				
				// Notify requester
				$this->notify_request_decision($request_id, 'approved');
				
				$this->db->trans_complete();
				
				echo json_encode([
					'status' => 'success',
					'message' => get_phrase('request_approved_successfully'),
					'refresh_bulk_invoices' => true
				]);
			} else {
				$this->db->trans_rollback();
				$this->db->where('request_id', $request_id)
					->update('invoice_modification_requests', ['status' => 'pending']);
				echo json_encode([
					'status' => 'error',
					'message' => get_phrase('operation_failed')
				]);
			}
		} else {
			// Decline request
			$this->db->where('request_id', $request_id)->update('invoice_modification_requests', array(
				'status' => 'declined',
				'reviewed_by' => $user_id,
				'reviewed_at' => date('Y-m-d H:i:s')
			));
			
			// Notify requester
			$this->notify_request_decision($request_id, 'declined');
			
			$this->db->trans_complete();
			
			echo json_encode([
				'status' => 'success',
				'message' => get_phrase('request_declined'),
				'refresh_bulk_invoices' => true
			]);
		}
	}

	// Notify Request Decision
	private function notify_request_decision($request_id, $decision) {
		$request = $this->db->where('request_id', $request_id)->get('invoice_modification_requests')->row();
		$reviewer = $this->db->where('admin_id', $request->reviewed_by)->get('admin')->row();
		$view_link = base_url() . 'admin/student_invoice#receipt_modifications';
		
		$action = $request->request_type == 'edit' ? 'edit' : 'delete';
		$btn_class = $decision == 'approved' ? 'btn-success' : 'btn-danger';
		$message = 'Your request to ' . $action . ' invoice #' . $request->invoice_code . ' has been ' . $decision . ' by ' . $reviewer->name . '. <a href="' . $view_link . '" class="btn btn-sm ' . $btn_class . '" style="margin-left: 10px;" data-dismiss="modal"><i class="fa fa-eye"></i> View Details</a>';
		
		$this->db->insert('notifications', array(
			'user_id' => $request->requested_by,
			'user_type' => $this->session->userdata('user_type') == 1 ? 'superadmin' : 'admin',
			'type' => 'invoice_modification_decision',
			'title' => 'Invoice Modification ' . ucfirst($decision),
			'message' => $message,
			'is_read' => 0,
			'created_at' => date('Y-m-d H:i:s')
		));
	}

	// Export Selected Invoices
	public function export_invoices() {
		$invoice_codes = $this->input->post('invoice_codes');
		
		if(empty($invoice_codes)) {
			echo json_encode(['status' => 'error', 'message' => 'No invoices selected']);
			return;
		}

		// Get school info
		$school_name = $this->db->get_where('settings', array('type' => 'system_name'))->row();
		$school_name = $school_name ? $school_name->description : '';
		
		$school_address = $this->db->get_where('settings', array('type' => 'address'))->row();
		$school_address = $school_address ? $school_address->description : '';
		
		$school_phone = $this->db->get_where('settings', array('type' => 'phone'))->row();
		$school_phone = $school_phone ? $school_phone->description : '';
		
		$school_email = $this->db->get_where('settings', array('type' => 'system_email'))->row();
		$school_email = $school_email ? $school_email->description : '';
		
		$logo_url = $this->db->get_where('settings', array('type' => 'logo'))->row();
		$logo_url = $logo_url ? $logo_url->description : '';

		$this->db->select('invoice.invoice_code, invoice.student_id, invoice.creation_timestamp, student.name as student_name, student.student_code, class.name as class_name, class.name_numeric, section.name as section_name, SUM(invoice.amount) as total_amount, SUM(invoice.amount_paid) as total_paid, SUM(invoice.due) as total_due');
		$this->db->from('invoice');
		$this->db->join('student', 'student.student_id = invoice.student_id');
		$this->db->join('enroll', 'enroll.student_id = student.student_id', 'left');
		$this->db->join('class', 'class.class_id = enroll.class_id', 'left');
		$this->db->join('section', 'section.section_id = enroll.section_id', 'left');
		$this->db->where_in('invoice.invoice_code', $invoice_codes);
		$this->db->group_by('invoice.invoice_code, invoice.student_id, student.name, student.student_code, class.name, class.name_numeric, section.name, invoice.creation_timestamp');
		$this->db->order_by('student.name');
		$invoices = $this->db->get()->result_array();

		$data = [];
		foreach($invoices as $inv) {
			$status = 'Unpaid';
			if($inv['total_due'] <= 0) {
				$status = 'Paid';
			} elseif($inv['total_paid'] > 0) {
				$status = 'Partial';
			}
			
			$data[] = [
				'Invoice Code' => $inv['invoice_code'],
				'Student Name' => $inv['student_name'],
				'Student Code' => $inv['student_code'],
				'Class' => $inv['class_name'] . ' ' . $inv['name_numeric'],
				'Section' => $inv['section_name'],
				'Total Amount' => number_format($inv['total_amount'], 2),
				'Amount Paid' => number_format($inv['total_paid'], 2),
				'Balance Due' => number_format($inv['total_due'], 2),
				'Status' => $status,
				'Date' => date('Y-m-d', $inv['creation_timestamp'])
			];
		}

		echo json_encode([
			'status' => 'success', 
			'data' => $data,
			'school_info' => [
				'name' => $school_name,
				'address' => $school_address,
				'phone' => $school_phone,
				'email' => $school_email,
				'logo' => base_url() . 'uploads/' . $logo_url
			]
		]);
	}


	// ==================== STUDENT LEDGER INTEGRATION ====================
	
	private function update_student_ledger_for_invoice($invoice_code, $student_id) {
		$invoice_items = $this->db->where('invoice_code', $invoice_code)->get('invoice')->result();
		$total_amount = 0;
		foreach($invoice_items as $item) {
			$total_amount += $item->amount;
		}
		
		$current_balance = $this->get_student_ledger_balance($student_id);
		$new_balance = (floatval($current_balance) + floatval($total_amount));
		
		$this->db->insert('student_ledger', [
			'student_id' => $student_id,
			'transaction_date' => date('Y-m-d'),
			'transaction_type' => 'invoice',
			'reference_type' => 'invoice',
			'reference_id' => $invoice_code,
			'description' => 'Invoice created: ' . $invoice_code,
			'debit_amount' => $total_amount,
			'credit_amount' => 0,
			'balance' => $new_balance,
			'year' => get_settings('running_year'),
			'term' => get_settings('running_term'),
			'created_by' => $this->session->userdata('admin_id'),
			'created_at' => time()
		]);
		
		if($this->db->field_exists('synced_to_ledger', 'invoice')) {
			$this->db->where('invoice_code', $invoice_code)
				->update('invoice', ['synced_to_ledger' => 1, 'ledger_entry_id' => $this->db->insert_id()]);
		}
	}
	
	private function update_student_ledger_for_payment($payment_id) {
		$payment = $this->db->where('payment_id', $payment_id)->get('payment')->row();
		if(!$payment) return;
		
		$current_balance = $this->get_student_ledger_balance($payment->student_id);
		$new_balance = $current_balance - $payment->amount;
		
		$this->db->insert('student_ledger', [
			'student_id' => $payment->student_id,
			'transaction_date' => date('Y-m-d', $payment->timestamp),
			'transaction_type' => 'payment',
			'reference_type' => 'payment',
			'reference_id' => $payment_id,
			'description' => 'Payment received - ' . $payment->method,
			'debit_amount' => 0,
			'credit_amount' => $payment->amount,
			'balance' => $new_balance,
			'year' => $payment->year,
			'term' => $payment->term,
			'created_by' => $this->session->userdata('admin_id'),
			'created_at' => time()
		]);
	}
	
	private function get_student_ledger_balance($student_id) {
		if(!$this->db->table_exists('student_ledger')) return 0;
		
		$last_entry = $this->db->where('student_id', $student_id)
			->order_by('ledger_id', 'DESC')
			->limit(1)
			->get('student_ledger')->row();
		return $last_entry ? $last_entry->balance : 0;
	}
	
	private function update_student_ledger_for_discount($invoice_code, $student_id, $discount_amount) {
		$current_balance = $this->get_student_ledger_balance($student_id);
		$new_balance = (floatval($current_balance) - floatval($discount_amount));
		
		$this->db->insert('student_ledger', [
			'student_id' => $student_id,
			'transaction_date' => date('Y-m-d'),
			'transaction_type' => 'discount',
			'reference_type' => 'discount',
			'reference_id' => $invoice_code,
			'description' => 'Discount applied to invoice: ' . $invoice_code,
			'debit_amount' => 0,
			'credit_amount' => $discount_amount,
			'balance' => $new_balance,
			'year' => get_settings('running_year'),
			'term' => get_settings('running_term'),
			'created_by' => $this->session->userdata('admin_id'),
			'created_at' => time()
		]);
	}


	/**
	 * ENTERPRISE-GRADE: My Collections Report
	 * Comprehensive report for cashiers to render daily accounts and reconcile with other collectors
	 */
	function my_collections() {
		
		$page_data['page_name'] = 'my_collections';
		$page_data['page_title'] = get_phrase('my_collections_report');
		$page_data['account_type'] = $this->session->userdata('login_type');
		$this->load->view('backend/main', $page_data);
	}
	
	/**
	 * Get collections data with filters (AJAX endpoint)
	 */
	function get_collections_data() {
		
		$report_type = $this->input->post('report_type') ?: 'detailed';
		
		if($report_type == 'class_summary') {
			$this->get_collections_class_summary();
			return;
		}
		
		$collector_id = $this->input->post('collector_id');
		// If no collector specified: Admin (level < 4) sees all, Cashier (level >= 4) sees only their own
		if(!$collector_id) {
			$admin_id = $this->session->userdata('admin_id');
			$admin = $this->db->get_where('admin', ['admin_id' => $admin_id])->row();
			if(!$admin || $admin->level >= 4) {
				$collector_id = $admin_id; // Cashier: only their own
			}
			// Admin (level < 4): $collector_id stays null = show all
		}
		
		$date_from = strtotime($this->input->post('date_from')) ?: strtotime(date('Y-m-d'));
		$date_to = strtotime($this->input->post('date_to')) ?: strtotime(date('Y-m-d'));
		$class_id = $this->input->post('class_id');
		$payment_method = $this->input->post('payment_method');
		$student_id = $this->input->post('student_id');
		
		$this->db->select('dft.*, s.name as student_name, s.student_code, c.name as class_name, c.name_numeric, sec.name as section_name, a.name as collector_name');
		$this->db->from('daily_fee_transactions dft');
		$this->db->join('student s', 's.student_id = dft.student_id');
		$this->db->join('enroll e', 'e.student_id = dft.student_id AND e.year = dft.year AND e.term = dft.term', 'left');
		$this->db->join('class c', 'c.class_id = e.class_id', 'left');
		$this->db->join('section sec', 'sec.section_id = e.section_id', 'left');
		$this->db->join('admin a', 'a.admin_id = dft.collected_by');
		
		if($collector_id) {
			$this->db->where('dft.collected_by', $collector_id);
		}
		
		$this->db->where('dft.payment_date >=', $date_from);
		$this->db->where('dft.payment_date <=', $date_to);
		
		if($class_id) {
			$this->db->where('e.class_id', $class_id);
		}
		
		if($payment_method && $payment_method != '') {
			$this->db->where('dft.payment_method', $payment_method);
		}
		
		if($student_id && $student_id != '') {
			$this->db->where('dft.student_id', $student_id);
		}
		
		$this->db->order_by('dft.created_at', 'DESC');
		$transactions = $this->db->get()->result_array();
		
		// Add payment method names using helper function
		for($i = 0; $i < count($transactions); $i++) {
			$transactions[$i]['payment_method_name'] = get_payment_method_name($transactions[$i]['payment_method']);
		}
		
		// Calculate totals
		$totals = [
			'feeding' => 0, 'breakfast' => 0, 'classes' => 0, 
			'water' => 0, 'transport' => 0, 'grand_total' => 0, 'count' => count($transactions)
		];
		
		foreach($transactions as $t) {
			$totals['feeding'] += $t['feeding_amount'];
			$totals['breakfast'] += $t['breakfast_amount'];
			$totals['classes'] += $t['classes_amount'];
			$totals['water'] += $t['water_amount'];
			$totals['transport'] += $t['transport_amount'];
			$totals['grand_total'] += $t['total_amount'];
		}
		
		echo json_encode(['status' => 'success', 'transactions' => $transactions, 'totals' => $totals]);
	}
	
	function get_collections_class_summary() {

		$collector_id = $this->input->post('collector_id');
		// If no collector specified: Admin (level < 4) sees all, Cashier (level >= 4) sees only their own
		if(!$collector_id) {
			$admin_id = $this->session->userdata('admin_id');
			$admin = $this->db->get_where('admin', ['admin_id' => $admin_id])->row();
			if(!$admin || $admin->level >= 4) {
				$collector_id = $admin_id; // Cashier: only their own
			}
			// Admin (level < 4): $collector_id stays null = show all
		}


		$date_from = strtotime($this->input->post('date_from')) ?: strtotime(date('Y-m-d'));
		$date_to = strtotime($this->input->post('date_to')) ?: strtotime(date('Y-m-d'));
		$class_id = $this->input->post('class_id');
		$payment_method = $this->input->post('payment_method');
		
		$this->db->select('e.class_id, e.section_id, c.name as class_name, c.name_numeric, sec.name as section_name,
			SUM(dft.feeding_amount) as feeding_total,
			SUM(dft.breakfast_amount) as breakfast_total,
			SUM(dft.classes_amount) as classes_total,
			SUM(dft.water_amount) as water_total,
			SUM(dft.transport_amount) as transport_total,
			SUM(dft.total_amount) as class_total,
			COUNT(DISTINCT dft.student_id) as student_count,
			SUM(CASE WHEN dft.payment_method = 1 THEN dft.total_amount ELSE 0 END) as cash_total,
			SUM(CASE WHEN dft.payment_method = 2 THEN dft.total_amount ELSE 0 END) as bank_total,
			SUM(CASE WHEN dft.payment_method = 3 THEN dft.total_amount ELSE 0 END) as momo_total,
			SUM(CASE WHEN dft.payment_method = 4 THEN dft.total_amount ELSE 0 END) as cheque_total');
		$this->db->from('daily_fee_transactions dft');
		$this->db->join('enroll e', 'e.student_id = dft.student_id AND e.year = dft.year AND e.term = dft.term');
		$this->db->join('class c', 'c.class_id = e.class_id');
		$this->db->join('section sec', 'sec.section_id = e.section_id', 'left');

		if($collector_id) {
			$this->db->where('dft.collected_by', $collector_id);
		}
		
		$this->db->where('dft.payment_date >=', $date_from);
		$this->db->where('dft.payment_date <=', $date_to);
		
		if($class_id) {
			$this->db->where('e.class_id', $class_id);
		}
		
		if($payment_method && $payment_method != '') {
			$this->db->where('dft.payment_method', $payment_method);
		}
		
		$this->db->group_by('e.class_id, e.section_id');
		$this->db->order_by('c.name_numeric', 'ASC');
		$this->db->order_by('sec.name', 'ASC');
		$class_summary = $this->db->get()->result_array();
		
		$totals = [
			'feeding' => 0, 'breakfast' => 0, 'classes' => 0,
			'water' => 0, 'transport' => 0, 'grand_total' => 0,
			'cash' => 0, 'bank' => 0, 'momo' => 0, 'cheque' => 0
		];
		
		foreach($class_summary as $row) {
			$totals['feeding'] += $row['feeding_total'];
			$totals['breakfast'] += $row['breakfast_total'];
			$totals['classes'] += $row['classes_total'];
			$totals['water'] += $row['water_total'];
			$totals['transport'] += $row['transport_total'];
			$totals['grand_total'] += $row['class_total'];
			$totals['cash'] += $row['cash_total'];
			$totals['bank'] += $row['bank_total'];
			$totals['momo'] += $row['momo_total'];
			$totals['cheque'] += $row['cheque_total'];
		}
		
		echo json_encode(['status' => 'success', 'class_summary' => $class_summary, 'totals' => $totals]);
	}
	
	

	// Bulk Approve Modifications
	public function bulk_approve_modifications() {
		$user_id = $this->session->userdata('login_user_id');
		$admin_level = $this->db->get_where('admin', array('admin_id' => $user_id))->row()->level;
		
		if($admin_level != 1) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('unauthorized_access')]);
			return;
		}
		
		$requests_json = $this->input->post('requests');
		$requests = json_decode($requests_json, true);
		
		if(empty($requests)) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('no_requests_selected')]);
			return;
		}
		
		$success_count = 0;
		$failed_count = 0;
		$already_processed = 0;
		
		foreach($requests as $req) {
			$request_id = $req['id'];
			$is_receipt = $req['is_receipt'];
			
			if($is_receipt) {
				// Receipt: Use same logic as approve_receipt_modification
				$this->db->trans_start();
				
				$request = $this->db->where('request_id', $request_id)
					->where('status', 'pending')
					->get('receipt_modification_requests', 1, 0, true)
					->row();
				
				if(!$request) {
					$this->db->trans_rollback();
					$existing = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row();
					if($existing && $existing->status != 'pending') {
						$already_processed++;
					} else {
						$failed_count++;
					}
					continue;
				}
				
				$this->db->where('request_id', $request_id)->update('receipt_modification_requests', [
					'status' => 'processing',
					'approved_by' => $user_id,
					'approved_at' => time()
				]);
				
				try {
					if($request->request_type == 'delete') {
						$this->process_receipt_deletion($request, $user_id);
					} else {
						$this->process_receipt_edit($request, $user_id);
					}
					
					$this->db->where('request_id', $request_id)->update('receipt_modification_requests', ['status' => 'approved']);
					$this->log_modification_audit($request_id, $request->receipt_code, $request->request_type, $user_id);
					$this->notify_requester($request->requested_by, 'approved', $request_id);
					
					$this->db->trans_complete();
					
					if($this->db->trans_status() === FALSE) {
						throw new Exception('Transaction failed');
					}
					$success_count++;
				} catch(Exception $e) {
					$this->db->trans_rollback();
					$this->db->where('request_id', $request_id)->update('receipt_modification_requests', ['status' => 'pending']);
					$failed_count++;
				}
			} else {
				// Invoice: Use same logic as review_invoice_modification
				$request = $this->db->where('request_id', $request_id)
					->where('status', 'pending')
					->get('invoice_modification_requests')
					->row();
				
				if(!$request) {
					$existing = $this->db->where('request_id', $request_id)->get('invoice_modification_requests')->row();
					if($existing && $existing->status != 'pending') {
						$already_processed++;
					} else {
						$failed_count++;
					}
					continue;
				}
				
				if($request->request_type == 'edit') {
					$items = json_decode($request->new_data, true);
					$result = $this->apply_invoice_edit($request->invoice_code, $items);
				} else {
					$result = $this->apply_invoice_delete($request->invoice_code);
				}
				
				if($result) {
					$this->db->where('request_id', $request_id)->update('invoice_modification_requests', [
						'status' => 'approved',
						'reviewed_by' => $user_id,
						'reviewed_at' => date('Y-m-d H:i:s')
					]);
					
					if($request->request_type == 'edit') {
						sync_invoice_to_ledger($request->invoice_code, $request->student_id);
					} else {
						$this->Finance_model->reverse_invoice_ledger($request->invoice_code, $request->student_id);
					}
					$this->notify_request_decision($request_id, 'approved');
					$success_count++;
				} else {
					$failed_count++;
				}
			}
		}
		
		$message = "$success_count " . get_phrase('approved');
		if($failed_count > 0) $message .= ", $failed_count " . get_phrase('failed');
		if($already_processed > 0) $message .= ", $already_processed " . get_phrase('already_processed');
		
		echo json_encode([
			'status' => 'success',
			'message' => $message
		]);
	}
	
	// Bulk Reject Modifications
	public function bulk_reject_modifications() {
		$user_id = $this->session->userdata('login_user_id');
		$admin_level = $this->db->get_where('admin', array('admin_id' => $user_id))->row()->level;
		
		if($admin_level != 1) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('unauthorized_access')]);
			return;
		}
		
		$requests_json = $this->input->post('requests');
		$requests = json_decode($requests_json, true);
		
		if(empty($requests)) {
			echo json_encode(['status' => 'error', 'message' => get_phrase('no_requests_selected')]);
			return;
		}
		
		$success_count = 0;
		$failed_count = 0;
		$already_processed = 0;
		
		foreach($requests as $req) {
			$request_id = $req['id'];
			$is_receipt = $req['is_receipt'];
			
			if($is_receipt) {
				$request = $this->db->where('request_id', $request_id)
					->where('status', 'pending')
					->get('receipt_modification_requests')
					->row();
				
				if(!$request) {
					$existing = $this->db->where('request_id', $request_id)->get('receipt_modification_requests')->row();
					if($existing && $existing->status != 'pending') {
						$already_processed++;
					} else {
						$failed_count++;
					}
					continue;
				}
				
				$result = $this->db->where('request_id', $request_id)->update('receipt_modification_requests', [
					'status' => 'rejected',
					'reviewed_by' => $user_id,
					'reviewed_at' => date('Y-m-d H:i:s'),
					'rejection_reason' => 'Bulk rejection'
				]);
				
				if($result) {
					$success_count++;
				} else {
					$failed_count++;
				}
			} else {
				$request = $this->db->where('request_id', $request_id)
					->where('status', 'pending')
					->get('invoice_modification_requests')
					->row();
				
				if(!$request) {
					$existing = $this->db->where('request_id', $request_id)->get('invoice_modification_requests')->row();
					if($existing && $existing->status != 'pending') {
						$already_processed++;
					} else {
						$failed_count++;
					}
					continue;
				}
				
				$result = $this->db->where('request_id', $request_id)->update('invoice_modification_requests', [
					'status' => 'declined',
					'reviewed_by' => $user_id,
					'reviewed_at' => date('Y-m-d H:i:s')
				]);
				
				if($result) {
					$success_count++;
				} else {
					$failed_count++;
				}
			}
		}
		
		$message = "$success_count " . get_phrase('rejected');
		if($failed_count > 0) $message .= ", $failed_count " . get_phrase('failed');
		if($already_processed > 0) $message .= ", $already_processed " . get_phrase('already_processed');
		
		echo json_encode([
			'status' => 'success',
			'message' => $message
		]);
	}

	// Check for pending invoice modification request
	function check_invoice_modification_request() {
		$invoice_code = $this->input->post('invoice_code');
		$pending = $this->db->where('invoice_code', $invoice_code)
			->where('status', 'pending')
			->get('invoice_modification_requests')
			->row();
		echo json_encode(['has_pending' => !empty($pending)]);
	}

	// Check for pending receipt modification request
	function check_receipt_modification_request() {
		$receipt_code = $this->input->post('receipt_code');
		$pending = $this->db->where('receipt_code', $receipt_code)
			->where('status', 'pending')
			->get('receipt_modification_requests')
			->row();
		echo json_encode(['has_pending' => !empty($pending)]);
	}

	// Get receipt code from payment ID
	function get_payment_receipt_code() {
		$payment_id = $this->input->post('payment_id');
		$payment = $this->db->where('payment_id', $payment_id)->get('payment')->row();
		echo json_encode(['receipt_code' => $payment ? $payment->receipt_code : null]);
	}

	// Send bill reminder SMS to parents - loads the preview
	function send_bill_reminder() {
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$currency = get_settings('currency');
		$school_name = get_settings('system_name');
		
		// Get all parents with their students' outstanding balances
		$parents_data = [];
		
		$students = $this->db->select('s.student_id, s.name, s.parent_id, p.phone, p.name as parent_name')
			->from('student s')
			->join('parent p', 's.parent_id = p.parent_id')
			->join('enroll e', 's.student_id = e.student_id')
			->where('e.year', $running_year)
			->where('e.term', $running_term)
			->where('e.mute', '0')
			->where('p.phone !=', '')
			->order_by('p.name', 'ASC')
			->get()->result_array();
		
		foreach ($students as $student) {
			$balance = $this->db->select('SUM(due) as total_due')
				->where('student_id', $student['student_id'])
				->where('due >', 0)
				->get('invoice')->row();
			
			$owing = $balance ? floatval($balance->total_due) : 0;
			
			if ($owing > 0) {
				$parent_id = $student['parent_id'];
				if (!isset($parents_data[$parent_id])) {
					$parents_data[$parent_id] = [
						'phone' => $student['phone'],
						'parent_name' => $student['parent_name'],
						'students' => []
					];
				}
				$parents_data[$parent_id]['students'][] = [
					'name' => $student['name'],
					'owing' => $owing
				];
			}
		}
		
		$messages = [];
		foreach ($parents_data as $parent_id => $data) {
			$child_word = count($data['students']) > 1 ? 'children' : 'child';
			$bill_word = count($data['students']) > 1 ? 'bills' : 'bill';
			$message = "Bill Reminder from " . $school_name . ". Dear cherished parent, kindly be reminded of your " . $child_word . "'s outstanding " . $bill_word . ": ";
			
			$bills = [];
			$total_owing = 0;
			foreach ($data['students'] as $student) {
				$bills[] = $student['name'] . ": " . $currency . number_format($student['owing'], 2);
				$total_owing += $student['owing'];
			}
			$message .= implode(", ", $bills) . ". Total: " . $currency . number_format($total_owing, 2) . ". Please settle outstanding fees. Thank you.";
			
			$messages[] = [
				'phone' => $data['phone'],
				'parent_name' => $data['parent_name'],
				'message' => $message
			];
		}
		
		if (!empty($messages)) {
			$page_data['messages'] = $messages;
			$page_data['page_name'] = 'bill_reminder_preview';
			$page_data['page_title'] = 'Bill Reminder Preview';
			$this->load->view('backend/main', $page_data);
		} else {
			echo json_encode(['status' => 'error', 'message' => 'No outstanding balances found']);
		}
	}

	// Actually send the bill reminder SMS
	function send_bill_reminder_now() {
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$currency = get_settings('currency');
		$school_name = get_settings('system_name');
		
		$parents_data = [];
		$students = $this->db->select('s.student_id, s.name, s.parent_id, p.phone')
			->from('student s')
			->join('parent p', 's.parent_id = p.parent_id')
			->join('enroll e', 's.student_id = e.student_id')
			->where('e.year', $running_year)
			->where('e.term', $running_term)
			->where('e.mute', '0')
			->where('p.phone !=', '')
			->get()->result_array();
		
		foreach ($students as $student) {
			$balance = $this->db->select('SUM(due) as total_due')
				->where('student_id', $student['student_id'])
				->where('due >', 0)
				->get('invoice')->row();
			
			$owing = $balance ? floatval($balance->total_due) : 0;
			
			if ($owing > 0) {
				$parent_id = $student['parent_id'];
				if (!isset($parents_data[$parent_id])) {
					$parents_data[$parent_id] = [
						'phone' => $student['phone'],
						'students' => []
					];
				}
				$parents_data[$parent_id]['students'][] = [
					'name' => $student['name'],
					'owing' => $owing
				];
			}
		}
		
		$phones = [];
		$messages = [];
		
		foreach ($parents_data as $parent_id => $data) {
			$child_word = count($data['students']) > 1 ? 'children' : 'child';
			$bill_word = count($data['students']) > 1 ? 'bills' : 'bill';
			$message = "Bill Reminder from " . $school_name . ". Dear cherished parent, kindly be reminded of your " . $child_word . "'s outstanding " . $bill_word . ": ";
			
			$bills = [];
			$total_owing = 0;
			foreach ($data['students'] as $student) {
				$bills[] = $student['name'] . ": " . $currency . number_format($student['owing'], 2);
				$total_owing += $student['owing'];
			}
			$message .= implode(", ", $bills) . ". Total: " . $currency . number_format($total_owing, 2) . ". Please settle outstanding fees. Thank you.";
			
			$phones[] = $data['phone'];
			$messages[] = $message;
		}
		
		if (!empty($phones)) {
			// Build personalized recipients array for batch SMS
			$personalizedRecipients = [];
			$i = 0;
			foreach ($parents_data as $data) {
				$personalizedRecipients[] = [
					'Recipient' => $phones[$i],
					'Content' => $messages[$i]
				];
				$i++;
			}
			
			$result = $this->sms_model->send_sms_batch_personalized($personalizedRecipients);
			
			if ($result === 0) {
				$sent_count = count($phones);
				echo json_encode(['status' => 'success', 'message' => "Bill reminders sent to $sent_count parent(s)"]);
			} else if ($result === null) {
				echo json_encode(['status' => 'error', 'message' => 'SMS service is disabled or not configured']);
			} else {
				echo json_encode(['status' => 'error', 'message' => 'SMS sending failed. Status code: ' . $result]);
			}
		} else {
			echo json_encode(['status' => 'error', 'message' => 'No outstanding balances found']);
		}
	}

	// Cron setup page for automated bill reminders
	function cron_setup() {
		$page_data['page_name'] = 'cron_setup';
		$page_data['page_title'] = 'Automated Bill Reminder Setup';
		$this->load->view('backend/main', $page_data);
	}

	// Send test bill reminder SMS
	function send_test_bill_reminder() {
		$test_phones = $this->input->post('test_phones');
		
		if (empty($test_phones)) {
			echo json_encode(['status' => 'error', 'message' => 'No phone numbers provided']);
			return;
		}
		
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		$currency = get_settings('currency');
		$school_name = get_settings('system_name');
		
		// Get parent with actual outstanding balance
		$parents_data = [];
		$students = $this->db->select('s.student_id, s.name, s.parent_id, p.phone, p.name as parent_name')
			->from('student s')
			->join('parent p', 's.parent_id = p.parent_id')
			->join('enroll e', 's.student_id = e.student_id')
			->where('e.year', $running_year)
			->where('e.term', $running_term)
			->where('e.mute', '0')
			->where('p.phone !=', '')
			->get()->result_array();
		
		foreach ($students as $student) {
			$balance = $this->db->select('SUM(due) as total_due')
				->where('student_id', $student['student_id'])
				->where('due >', 0)
				->get('invoice')->row();
			
			$owing = $balance ? floatval($balance->total_due) : 0;
			
			if ($owing > 0) {
				$parent_id = $student['parent_id'];
				if (!isset($parents_data[$parent_id])) {
					$parents_data[$parent_id] = [
						'parent_name' => $student['parent_name'],
						'students' => []
					];
				}
				$parents_data[$parent_id]['students'][] = [
					'name' => $student['name'],
					'owing' => $owing
				];
			}
		}
		
		if (empty($parents_data)) {
			echo json_encode(['status' => 'error', 'message' => 'No students with outstanding balances found']);
			return;
		}
		
		// Get first parent with actual owing
		$first_parent = reset($parents_data);
		$child_word = count($first_parent['students']) > 1 ? 'children' : 'child';
		$bill_word = count($first_parent['students']) > 1 ? 'bills' : 'bill';
		$message = "Bill Reminder from " . $school_name . ". Dear cherished parent, kindly be reminded of your " . $child_word . "'s outstanding " . $bill_word . ": ";
		
		$bills = [];
		$total_owing = 0;
		foreach ($first_parent['students'] as $student) {
			$bills[] = $student['name'] . ": " . $currency . number_format($student['owing'], 2);
			$total_owing += $student['owing'];
		}
		$message .= implode(", ", $bills) . ". Total: " . $currency . number_format($total_owing, 2) . ". Please settle outstanding fees. Thank you.";
		
		// Parse phone numbers
		$phones = array_map('trim', explode(',', $test_phones));
		$phones = array_filter($phones);
		
		if (empty($phones)) {
			echo json_encode(['status' => 'error', 'message' => 'No valid phone numbers provided']);
			return;
		}
		
		// Build personalized recipients array (formatting handled by model)
		$personalizedRecipients = [];
		foreach ($phones as $phone) {
			$personalizedRecipients[] = [
				'Recipient' => $phone,
				'Content' => $message
			];
		}
		
		$result = $this->sms_model->send_sms_batch_personalized($personalizedRecipients);
		
		if ($result === 0) {
			$sent_count = count($phones);
			echo json_encode(['status' => 'success', 'message' => "Test SMS sent to $sent_count number(s)"]);
		} else if ($result === null) {
			echo json_encode(['status' => 'error', 'message' => 'SMS service is disabled or not configured']);
		} else if ($result === 100) {
			echo json_encode(['status' => 'error', 'message' => 'Invalid phone number format. Please use format: 0242345678 or +233242345678']);
		} else {
			echo json_encode(['status' => 'error', 'message' => 'SMS sending failed. Status code: ' . $result]);
		}
	}

	// Get SMS bundle info and cost estimate
	function get_sms_bundle_info() {
		$message_count = $this->input->post('message_count');
		$messages = $this->input->post('messages'); // Array of message texts
		
		$balance_info = $this->sms_model->get_hubtel_balance();
		$cost_info = $this->sms_model->calculate_sms_cost($messages ? $messages : array_fill(0, $message_count, str_repeat('x', 160)));
		
		echo json_encode([
			'balance' => $balance_info,
			'cost' => $cost_info
		]);
	}

	

	public function save_form_preference() {
		$field = $this->input->post('field_name');
		$visible = $this->input->post('is_visible');
		$this->db->replace('form_field_preferences', ['field_name' => $field, 'is_visible' => $visible]);
		echo json_encode(['status' => 'success']);
	}
	public function get_form_preferences() {
		$prefs = $this->db->get('form_field_preferences')->result_array();
		echo json_encode(['status' => 'success', 'preferences' => $prefs]);
	}


	
	/**
	* Enhanced payment processing with credit management
	*/
	public function process_payment_with_credits() {
		$this->load->model('Credit_model');
		
		$payment_data = [
			'student_id' => $this->input->post('student_id'),
			'invoice_id' => $this->input->post('invoice_id'),
			'amount' => $this->input->post('amount'),
			'payment_method' => $this->input->post('payment_method'),
			'receipt_code' => $this->generate_receipt_code()
		];
		
		$this->db->trans_start();
		
		// 1. Process normal payment
		$payment_result = $this->process_normal_payment($payment_data);
		
		if ($payment_result['status'] == 'success') {
			// 2. Check for overpayment and create credit
			$credit_result = $this->Credit_model->process_overpayment($payment_data);
			
			if ($credit_result['status'] == 'success') {
				$payment_result['credit_created'] = $credit_result;
			}
		}
		
		$this->db->trans_complete();
		
		echo json_encode($payment_result);
	}

		
	/**
	 * Enhanced payment processing with credit management
	 * Modify your existing payment method to include this logic
	 */
	public function student_payment_with_credits($param1 = '', $param2 = '', $param3 = '') {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		if($_POST) {
			$student_id = $this->input->post('student_id');
			$invoice_id = $this->input->post('invoice_id');
			$amount_paid = $this->input->post('amount');
			$payment_method = $this->input->post('payment_method');
			
			$this->db->trans_start();
			
			// Generate receipt code
			$receipt_code = 'RCP' . date('Ymd') . rand(1000, 9999);
			
			// Process normal payment first
			$payment_data = array(
				'invoice_id' => $invoice_id,
				'student_id' => $student_id,
				'title' => $this->input->post('title'),
				'amount' => $amount_paid,
				'timestamp' => time(),
				'method' => $payment_method,
				'receipt_code' => $receipt_code,
				'year' => get_settings('running_year'),
				'issuer_id' => $this->session->userdata('login_user_id'),
				'account_type' => 'income'
			);
			
			$this->db->insert('payment', $payment_data);
			$payment_id = $this->db->insert_id();
			
			// Update invoice amount_paid
			$invoice = $this->db->get_where('invoice', ['invoice_id' => $invoice_id])->row();
			$new_amount_paid = $invoice->amount_paid + $amount_paid;
			$new_due = max(0, $invoice->amount - $new_amount_paid - ($invoice->credit_applied ?? 0));
			
			$this->db->where('invoice_id', $invoice_id)
					->update('invoice', [
						'amount_paid' => $new_amount_paid,
						'due' => $new_due,
						'status' => $new_due <= 0 ? 'paid' : 'unpaid'
					]);
			
			// Check for overpayment and create credit
			$credit_data = [
				'student_id' => $student_id,
				'invoice_id' => $invoice_id,
				'amount' => $amount_paid,
				'receipt_code' => $receipt_code,
				'payment_id' => $payment_id
			];
			
			$credit_result = $this->Credit_model->process_overpayment($credit_data);
			
			$this->db->trans_complete();
			
			if($this->db->trans_status() === FALSE) {
				echo json_encode(['status' => 'error', 'message' => 'Payment processing failed']);
			} else {
				$response = ['status' => 'success', 'message' => 'Payment processed successfully'];
				
				if($credit_result['status'] == 'success') {
					$response['credit_created'] = $credit_result;
					$response['message'] .= '. ' . $credit_result['message'];
				}
				
				echo json_encode($response);
			}
		}
	}

	/**
	 * Enhanced invoice creation with automatic credit application
	 */
	public function create_invoice_with_credits() {
		if($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Credit_model');
		
		if($_POST) {
			$this->db->trans_start();
			
			// Create invoice normally (your existing logic)
			$invoice_data = array(
				'student_id' => $this->input->post('student_id'),
				'title' => $this->input->post('title'),
				'amount' => $this->input->post('amount'),
				'due' => $this->input->post('amount'),
				'invoice_code' => $this->generate_invoice_code(),
				'year' => get_settings('running_year'),
				'term' => get_settings('running_term'),
				'timestamp' => time(),
				'status' => 'unpaid'
			);
			
			$this->db->insert('invoice', $invoice_data);
			$invoice_id = $this->db->insert_id();
			
			// Apply available credits automatically
			$credit_result = $this->Credit_model->apply_credits_to_invoice($invoice_id);
			
			$this->db->trans_complete();
			
			if($this->db->trans_status() === FALSE) {
				echo json_encode(['status' => 'error', 'message' => 'Invoice creation failed']);
			} else {
				$response = [
					'status' => 'success',
					'message' => 'Invoice created successfully',
					'invoice_id' => $invoice_id
				];
				
				if($credit_result['credit_applied'] > 0) {
					$response['credit_applied'] = $credit_result;
					$response['message'] .= '. ' . $credit_result['message'];
				}
				
				echo json_encode($response);
			}
		}
	}

	/**
	 * Get student credit information (AJAX)
	 */
	public function get_student_credit_info($student_id = null) {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		if(!$student_id) {
			$student_id = $this->input->post('student_id') ?? $this->input->get('student_id');
		}
		
		$total_credit = $this->Credit_model->get_student_total_credit($student_id);
		$credit_history = $this->Credit_model->get_credit_history($student_id);
		
		echo json_encode([
			'status' => 'success',
			'total_credit' => $total_credit,
			'history' => $credit_history
		]);
	}

	/**
	 * Manual credit adjustment (admin only)
	 */
	public function adjust_student_credit() {
		if($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Credit_model');
		
		$student_id = $this->input->post('student_id');
		$amount = floatval($this->input->post('amount'));
		$reason = $this->input->post('reason');
		$admin_id = $this->session->userdata('login_user_id');
		
		// Validate inputs
		if(!$student_id || !$amount || !$reason) {
			echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
			return;
		}
		
		$result = $this->Credit_model->adjust_credit($student_id, $amount, $reason, $admin_id);
		echo json_encode($result);
	}

	/**
	 * Student credits management page
	 */
	public function student_credits() {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		$page_data['page_name'] = 'student_credits';
		$page_data['page_title'] = get_phrase('student_credits');
		$page_data['students_with_credits'] = $this->Credit_model->get_students_with_credits();
		$page_data['credit_statistics'] = $this->Credit_model->get_credit_statistics();
		
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Credit Statistics Dashboard
	 */
	public function credit_statistics() {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		$page_data['page_name'] = 'credit_statistics';
		$page_data['page_title'] = get_phrase('credit_statistics');
		$page_data['statistics'] = $this->Credit_model->get_credit_statistics();
		
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Transfer credit between students
	 */
	public function transfer_student_credit() {
		if($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Credit_model');
		
		$from_student_id = $this->input->post('from_student_id');
		$to_student_id = $this->input->post('to_student_id');
		$amount = floatval($this->input->post('amount'));
		$reason = $this->input->post('reason');
		$admin_id = $this->session->userdata('login_user_id');
		
		if(!$from_student_id || !$to_student_id || !$amount || !$reason) {
			echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
			return;
		}
		
		if($from_student_id == $to_student_id) {
			echo json_encode(['status' => 'error', 'message' => 'Cannot transfer to the same student']);
			return;
		}
		
		$result = $this->Credit_model->transfer_credit($from_student_id, $to_student_id, $amount, $reason, $admin_id);
		echo json_encode($result);
	}

	/**
	 * Transfer credit to daily fee prepaid account
	 */
	public function transfer_credit_to_daily_fees() {
		if($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Credit_model');
		
		$student_id = $this->input->post('student_id');
		$amount = floatval($this->input->post('amount'));
		$fee_type = $this->input->post('fee_type');
		$reason = $this->input->post('reason');
		$admin_id = $this->session->userdata('login_user_id');
		
		if(!$student_id || !$amount || !$fee_type) {
			echo json_encode(['status' => 'error', 'message' => 'Student, amount, and fee type are required']);
			return;
		}
		
		$result = $this->Credit_model->transfer_credit_to_daily_fees($student_id, $amount, $fee_type, $reason, $admin_id);
		echo json_encode($result);
	}

	/**
	 * Credit history modal content
	 */
	public function credit_history_modal($student_id) {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		$student = $this->db->select('name, student_code')->from('student')->where('student_id', $student_id)->get()->row_array();
		$credit_history = $this->Credit_model->get_credit_history($student_id);
		$total_credit = $this->Credit_model->get_student_total_credit($student_id);
		
		?>
		<style>
		.modal-header-credit-history {
			background: linear-gradient(135deg, #27ae60, #2ecc71);
			color: white;
			padding: 25px 30px;
			border-radius: 8px 8px 0 0;
		}
		.modal-header-credit-history .modal-title {
			font-size: 22px;
			font-weight: 600;
			color: white;
		}
		.credit-history-info {
			background: linear-gradient(135deg, #f8f9fa, #e9ecef);
			padding: 20px 25px;
			border-radius: 10px;
			margin-bottom: 25px;
			border-left: 5px solid #27ae60;
			box-shadow: 0 2px 8px rgba(0,0,0,0.08);
		}
		.credit-history-info .info-label {
			font-size: 15px;
			font-weight: 600;
			color: #495057;
			margin-bottom: 5px;
		}
		.credit-history-info .info-value {
			font-size: 16px;
			color: #212529;
		}
		.credit-history-balance {
			font-size: 24px;
			font-weight: 700;
			color: #27ae60;
		}
		#creditHistoryTable {
			font-size: 14px;
		}
		#creditHistoryTable thead th {
			font-size: 15px;
			font-weight: 600;
			padding: 15px 12px;
		}
		#creditHistoryTable tbody td {
			padding: 12px;
			vertical-align: middle;
			font-size: 14px;
		}
		.modal-footer {
			padding: 20px 30px;
		}
		.modal-footer .btn {
			font-size: 15px;
			padding: 10px 25px;
		}
		</style>
		
		<div class="modal-header modal-header-credit-history">
			<h4 class="modal-title">
				<i class="fa fa-history"></i> Credit History - <?php echo $student['name']; ?>
			</h4>
		</div>
		
		<div class="modal-body" style="padding: 25px 30px;">
			<div class="credit-history-info">
				<div class="row">
					<div class="col-md-6 col-sm-6">
						<div class="info-label">
							<i class="fa fa-id-card"></i> Student Code
						</div>
						<div class="info-value">
							<?php echo $student['student_code']; ?>
						</div>
					</div>
					<div class="col-md-6 col-sm-6 text-right">
						<div class="info-label">
							<i class="fa fa-wallet"></i> Current Balance
						</div>
						<div class="credit-history-balance">
							GH₵ <?php echo number_format($total_credit, 2); ?>
						</div>
					</div>
				</div>
			</div>
			
			<div class="table-responsive">
				<table class="table table-striped table-bordered table-hover" id="creditHistoryTable">
					<thead style="background: #667eea; color: white;">
						<tr>
							<th>Date Created</th>
							<th>Source</th>
							<th>Credit Amount</th>
							<th>Applied Amount</th>
							<th>Remaining</th>
							<th>Status</th>
							<th>Applied To</th>
							<th>Notes</th>
						</tr>
					</thead>
					<tbody>
						<?php if(!empty($credit_history)): ?>
							<?php foreach($credit_history as $item): ?>
							<tr>
								<td><?php echo date('M j, Y g:i A', strtotime($item['created_at'])); ?></td>
								<td><?php echo $item['source_receipt_code'] ?: 'Manual Adjustment'; ?></td>
								<td><strong style="font-size: 15px;">GH₵ <?php echo number_format($item['credit_amount'], 2); ?></strong></td>
								<td>GH₵ <?php echo number_format($item['applied_amount'], 2); ?></td>
								<td>GH₵ <?php echo number_format($item['remaining_amount'], 2); ?></td>
								<td>
									<?php if($item['status'] == 'active'): ?>
										<span class="badge badge-success" style="font-size: 13px; padding: 6px 12px;">Active</span>
									<?php else: ?>
										<span class="badge badge-secondary" style="font-size: 13px; padding: 6px 12px;">Fully Applied</span>
									<?php endif; ?>
								</td>
								<td><?php echo $item['applied_to_invoice'] ?: '-'; ?></td>
								<td><?php echo $item['notes'] ?: ''; ?></td>
							</tr>
							<?php endforeach; ?>
						<?php else: ?>
							<tr>
								<td colspan="8" class="text-center">
									<div style="padding: 30px;">
										<i class="fa fa-info-circle fa-3x" style="color: #ccc;"></i>
										<p style="color: #999; margin-top: 15px; font-size: 16px;">No credit history found</p>
									</div>
								</td>
							</tr>
						<?php endif; ?>
					</tbody>
				</table>
			</div>
		</div>
		
		<div class="modal-footer">
			<button type="button" class="btn btn-secondary" data-dismiss="modal">
				<i class="fa fa-times"></i> Close
			</button>
		</div>
		
		<script>
		$(document).ready(function() {
			$('#creditHistoryTable').DataTable({
				"order": [[ 0, "desc" ]],
				"pageLength": 10,
				"responsive": true,
				"language": {
					"search": "Search history:",
					"lengthMenu": "Show _MENU_ records",
					"info": "Showing _START_ to _END_ of _TOTAL_ records"
				}
			});
		});
		</script>
		<?php
	}

	/**
	 * Credit adjustment modal content
	 */
	public function credit_adjust_modal($student_id = null) {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		$student = null;
		$current_credit = 0;
		
		if($student_id) {
			$student = $this->db->select('name, student_code')->from('student')->where('student_id', $student_id)->get()->row_array();
			$current_credit = $this->Credit_model->get_student_total_credit($student_id);
		}
		
		?>
		<style>
		.modal-dialog { max-width: 550px !important; }
		.compact-modal-header {
			background: linear-gradient(135deg, #f39c12, #e67e22);
			color: white;
			padding: 15px 20px;
			border-radius: 0;
		}
		.compact-modal-header .modal-title {
			font-size: 18px;
			font-weight: 600;
			color: white;
			margin: 0;
		}
		.compact-info-card {
			background: #f8f9fa;
			border-left: 4px solid #ffc107;
			padding: 12px 15px;
			margin-bottom: 20px;
			border-radius: 4px;
		}
		.compact-info-card .student-name {
			font-size: 15px;
			font-weight: 600;
			color: #495057;
			margin-bottom: 3px;
		}
		.compact-info-card .balance {
			font-size: 20px;
			font-weight: 700;
			color: #28a745;
		}
		.compact-form-group {
			margin-bottom: 15px;
		}
		.compact-form-group label {
			font-size: 13px;
			font-weight: 600;
			color: #495057;
			margin-bottom: 5px;
			display: block;
		}
		.compact-form-group label i {
			margin-right: 5px;
			color: #f39c12;
			font-size: 12px;
		}
		.compact-form-control {
			font-size: 14px;
			padding: 8px 12px;
			height: 38px;
			border-radius: 4px;
			border: 1px solid #ced4da;
		}
		.compact-form-control:focus {
			border-color: #f39c12;
			box-shadow: 0 0 0 0.15rem rgba(243, 156, 18, 0.15);
		}
		textarea.compact-form-control {
			resize: vertical;
			min-height: 70px;
			height: auto;
		}
		.compact-modal-body {
			padding: 20px;
		}
		.compact-modal-footer {
			padding: 12px 20px;
			background: #f8f9fa;
			border-top: 1px solid #dee2e6;
		}
		.compact-modal-footer .btn {
			font-size: 14px;
			padding: 8px 20px;
			font-weight: 600;
			border-radius: 4px;
		}
		.form-text-sm {
			font-size: 12px;
			color: #6c757d;
			margin-top: 3px;
		}
		</style>
		
		<div class="modal-header compact-modal-header">
			<h4 class="modal-title">
				<i class="fa fa-edit"></i> Adjust Credit
			</h4>
		</div>
		
		<form id="creditAdjustForm">
			<div class="modal-body compact-modal-body">
				<input type="hidden" id="adjust_student_id" name="student_id" value="<?php echo $student_id; ?>">
				
				<?php if($student): ?>
					<div class="compact-info-card">
						<div class="student-name"><?php echo $student['name']; ?> (<?php echo $student['student_code']; ?>)</div>
						<div style="font-size: 11px; color: #6c757d; margin-bottom: 5px;">Current Balance</div>
						<div class="balance"><sup style="font-size: 12px;">GH₵</sup><?php echo number_format($current_credit, 2); ?></div>
					</div>
				<?php endif; ?>
				
				<div class="row">
					<div class="col-md-6">
						<div class="compact-form-group">
							<label><i class="fa fa-arrows-alt-v"></i> Type</label>
							<select class="form-control compact-form-control" name="adjustment_type" id="adjustment_type">
								<option value="credit">Add Credit (+)</option>
								<option value="debit">Reduce Credit (-)</option>
							</select>
						</div>
					</div>
					
					<div class="col-md-6">
						<div class="compact-form-group">
							<label><i class="fa fa-money-bill-wave"></i> Amount (GH₵)</label>
							<input type="number" class="form-control compact-form-control" name="amount" id="adjustment_amount" 
								   step="0.01" min="0.01" placeholder="0.00" required>
						</div>
					</div>
				</div>
				
				<div class="compact-form-group">
					<label><i class="fa fa-comment-dots"></i> Reason</label>
					<textarea class="form-control compact-form-control" name="reason" rows="3" required 
							  placeholder="Enter reason for adjustment..."></textarea>
					<small class="form-text-sm">
						<i class="fa fa-info-circle"></i> Recorded in audit trail
					</small>
				</div>
			</div>
			
			<div class="modal-footer compact-modal-footer">
				<button type="button" class="btn btn-secondary" data-dismiss="modal">
					<i class="fa fa-times"></i> Cancel
				</button>
				<button type="submit" class="btn btn-warning">
					<i class="fa fa-check"></i> Apply
				</button>
			</div>
		</form>
		
		<script>
		// Handle credit adjustment form
		$('#creditAdjustForm').submit(function(e) {
			e.preventDefault();
			
			const adjustmentType = $('#adjustment_type').val();
			let amount = parseFloat($('#adjustment_amount').val());
			
			if(isNaN(amount) || amount <= 0) {
				showAjaxModal_alert('Please enter a valid amount', 'error');
				return;
			}
			
			// Make amount negative for debit adjustments
			if (adjustmentType === 'debit') {
				amount = -Math.abs(amount);
			}
			
			// Build form data with corrected amount
			const formData = {
				student_id: $('#adjust_student_id').val(),
				amount: amount,
				reason: $('textarea[name="reason"]').val()
			};
			
			showAjaxModal_alert('Processing...', 'loading');
			
			$.post('<?=site_url("admin/adjust_student_credit")?>', formData, function(response) {
				const data = JSON.parse(response);
				
				if (data.status === 'success') {
					showAjaxModal_alert(data.message, 'success');
					$('#createModal').modal('hide');
					setTimeout(() => location.reload(), 2000);
				} else {
					showAjaxModal_alert(data.message, 'error');
				}
			}).fail(function() {
				showAjaxModal_alert('Failed to process adjustment', 'error');
			});
		});
		</script>
		<?php
	}

	/**
	 * Credit transfer modal content
	 */
	public function credit_transfer_modal($from_student_id = null) {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		// Get running year and term
		$running_year = get_settings('running_year');
		$running_term = get_settings('running_term');
		
		// Get all students with credits for the "from" dropdown
		$students_with_credits = $this->Credit_model->get_students_with_credits();
		
		// Get all active students with class information for the "to" dropdown
		$all_students = $this->db->select('s.student_id, s.name, s.student_code, c.name as class_name, c.name_numeric, sec.name as section_name')
								 ->from('student s')
								 ->join('enroll e', 'e.student_id = s.student_id AND e.year = ' . $this->db->escape($running_year) . ' AND e.term = ' . $this->db->escape($running_term) . ' AND e.mute = "0"', 'left')
								 ->join('class c', 'c.class_id = e.class_id', 'left')
								 ->join('section sec', 'sec.section_id = e.section_id', 'left')
								 ->where('s.active_status', 1)
								 ->order_by('s.name')
								 ->get()->result_array();
		
		?>
		<style>
		.modal-dialog { max-width: 600px !important; }
		.compact-transfer-header {
			background: linear-gradient(135deg, #9b59b6, #8e44ad);
			color: white;
			padding: 15px 20px;
			border-radius: 0;
		}
		.compact-transfer-header .modal-title {
			font-size: 18px;
			font-weight: 600;
			color: white;
			margin: 0;
		}
		.transfer-banner {
			background: #f3e5f5;
			border-left: 4px solid #9b59b6;
			padding: 10px 12px;
			border-radius: 4px;
			margin-bottom: 15px;
			font-size: 13px;
			color: #6a1b9a;
		}
		.available-badge {
			display: inline-block;
			padding: 8px 15px;
			background: #d4edda;
			border: 2px solid #28a745;
			border-radius: 4px;
			font-size: 16px;
			font-weight: 700;
			color: #155724;
			margin-top: 5px;
		}
		.select2-container--default .select2-selection--single {
			height: 38px !important;
			padding: 5px 10px !important;
			border: 1px solid #ced4da !important;
			border-radius: 4px !important;
		}
		.select2-container--default .select2-selection--single .select2-selection__rendered {
			line-height: 26px !important;
			font-size: 14px !important;
		}
		.select2-container--default .select2-selection--single .select2-selection__arrow {
			height: 36px !important;
		}
		.select2-container--default.select2-container--focus .select2-selection--single {
			border-color: #9b59b6 !important;
		}
		</style>
		
		<div class="modal-header compact-transfer-header">
			<h4 class="modal-title">
				<i class="fa fa-exchange-alt"></i> Transfer Credit
			</h4>
		</div>
		
		<form id="creditTransferForm">
			<div class="modal-body compact-modal-body">
				<div class="transfer-banner">
					<i class="fa fa-info-circle"></i> Move credit from one student to another
				</div>
				
				<div class="row">
					<div class="col-md-6">
						<div class="compact-form-group">
							<label><i class="fa fa-user-minus"></i> From (Source)</label>
							<select class="form-control compact-form-control select2" name="from_student_id" id="from_student_select" required>
								<option value="">-- Select source --</option>
								<?php foreach($students_with_credits as $student): ?>
									<option value="<?php echo $student['student_id']; ?>" 
											data-credit="<?php echo $student['total_credit']; ?>"
											<?php echo ($from_student_id == $student['student_id']) ? 'selected' : ''; ?>>
										<?php echo $student['name']; ?> (GH₵ <?php echo number_format($student['total_credit'], 2); ?>)
									</option>
								<?php endforeach; ?>
							</select>
						</div>
					</div>
					
					<div class="col-md-6">
						<div class="compact-form-group">
							<label><i class="fa fa-user-plus"></i> To (Destination)</label>
							<select class="form-control compact-form-control select2" name="to_student_id" id="to_student_select" required>
								<option value="">-- Select destination --</option>
								<?php foreach($all_students as $student): ?>
									<option value="<?php echo $student['student_id']; ?>">
										<?php echo $student['name']; ?> (<?php echo $student['student_code']; ?>)
									</option>
								<?php endforeach; ?>
							</select>
						</div>
					</div>
				</div>
				
				<div class="row">
					<div class="col-md-7">
						<div class="compact-form-group">
							<label><i class="fa fa-money-bill-wave"></i> Amount (GH₵) <span style="color: red;">*</span></label>
							<input type="number" class="form-control compact-form-control" name="amount" id="transfer_amount" 
								   step="0.01" min="0.01" placeholder="0.00" required>
						</div>
					</div>
					
					<div class="col-md-5">
						<div class="compact-form-group">
							<label><i class="fa fa-wallet"></i> Available</label>
							<div class="available-badge" id="available_credit" style="width: 100%; text-align: center;">
								<sup style="font-size: 10px;">GH₵</sup>0.00
							</div>
						</div>
					</div>
				</div>
				
				<div class="compact-form-group">
					<label><i class="fa fa-comment-dots"></i> Reason</label>
					<textarea class="form-control compact-form-control" name="reason" rows="3" required 
							  placeholder="Enter transfer reason..."></textarea>
					<small class="form-text-sm">
						<i class="fa fa-info-circle"></i> Recorded in both students' history
					</small>
				</div>
			</div>
			
			<div class="modal-footer compact-modal-footer">
				<button type="button" class="btn btn-secondary" data-dismiss="modal">
					<i class="fa fa-times"></i> Cancel
				</button>
				<button type="submit" class="btn btn-primary" style="background: #9b59b6; border-color: #9b59b6;">
					<i class="fa fa-check"></i> Transfer
				</button>
			</div>
		</form>
		
		<script>
		$(document).ready(function() {
			// Initialize Select2
			$('.select2').select2({
				placeholder: 'Search student...',
				allowClear: true,
				width: '100%',
				dropdownParent: $('#createModal')
			});
			
			// Update available credit on load
			if($('#from_student_select').val()) {
				updateAvailableCredit();
			}
		});

		$('#from_student_select').change(function() {
			updateAvailableCredit();
		});

		function updateAvailableCredit() {
			const selectedOption = $('#from_student_select').find('option:selected');
			const availableCredit = selectedOption.data('credit') || 0;
			$('#available_credit').html('<sup style="font-size: 10px;">GH₵</sup>' + parseFloat(availableCredit).toFixed(2));
			$('#transfer_amount').attr('max', availableCredit);
		}

		// Handle transfer form
		$('#creditTransferForm').submit(function(e) {
			e.preventDefault();
			
			const fromStudentId = $('#from_student_select').val();
			const toStudentId = $('#to_student_select').val();
			const amount = parseFloat($('#transfer_amount').val());
			const availableCredit = parseFloat($('#from_student_select').find('option:selected').data('credit'));
			
			// Validation
			if(!fromStudentId || !toStudentId) {
				showAjaxModal_alert('Please select both students', 'error');
				return;
			}
			
			if(fromStudentId === toStudentId) {
				showAjaxModal_alert('Cannot transfer to same student', 'error');
				return;
			}
			
			if(isNaN(amount) || amount <= 0) {
				showAjaxModal_alert('Please enter valid amount', 'error');
				return;
			}
			
			if(amount > availableCredit) {
				showAjaxModal_alert('Amount (GH₵ ' + amount.toFixed(2) + ') exceeds available credit (GH₵ ' + availableCredit.toFixed(2) + ')', 'error');
				return;
			}
			
			showAjaxModal_alert('Processing...', 'loading');
			
			$.post('<?=site_url("admin/transfer_student_credit")?>', $(this).serialize(), function(response) {
				const data = JSON.parse(response);
				
				if (data.status === 'success') {
					showAjaxModal_alert(data.message, 'success');
					$('#createModal').modal('hide');
					setTimeout(() => location.reload(), 2000);
				} else {
					showAjaxModal_alert(data.message, 'error');
				}
			}).fail(function() {
				showAjaxModal_alert('Network error. Please try again.', 'error');
			});
		});
		</script>
		<?php
	}

	/**
	 * Generate unique invoice code
	 */
	private function generate_invoice_code() {
		$year = date('Y');
		$month = date('m');
		
		// Get last invoice number for this month
		$this->db->select('invoice_code');
		$this->db->like('invoice_code', "INV{$year}{$month}", 'after');
		$this->db->order_by('invoice_id', 'DESC');
		$this->db->limit(1);
		$last_invoice = $this->db->get('invoice')->row();
		
		if($last_invoice) {
			$last_number = intval(substr($last_invoice->invoice_code, -4));
			$new_number = $last_number + 1;
		} else {
			$new_number = 1;
		}
		
		return "INV{$year}{$month}" . str_pad($new_number, 4, '0', STR_PAD_LEFT);
	}

	/**
	 * Credit to daily fees transfer modal
	 */
	public function credit_to_daily_fees_modal($student_id = null) {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$this->load->model('Credit_model');
		
		$student = null;
		$current_credit = 0;
		
		if($student_id) {
			$student = $this->db->select('student_id, name, student_code')->from('student')->where('student_id', $student_id)->get()->row_array();
			$current_credit = $this->Credit_model->get_student_total_credit($student_id);
		}
		
		?>
		<style>
		.modal-dialog { max-width: 650px !important; }
		.compact-daily-header {
			background: linear-gradient(135deg, #f59e0b, #d97706);
			color: white;
			padding: 15px 20px;
			border-radius: 0;
		}
		.compact-daily-header .modal-title {
			font-size: 18px;
			font-weight: 600;
			color: white;
			margin: 0;
		}
		.fee-grid-compact {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: 10px;
			margin-bottom: 15px;
		}
		.fee-option-compact {
			position: relative;
			cursor: pointer;
		}
		.fee-option-compact input[type="radio"] {
			position: absolute;
			opacity: 0;
		}
		.fee-label-compact {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			padding: 12px 8px;
			border: 2px solid #dee2e6;
			border-radius: 6px;
			background: white;
			transition: all 0.2s ease;
			min-height: 75px;
		}
		.fee-option-compact input[type="radio"]:checked + .fee-label-compact {
			border-color: #f59e0b;
			background: linear-gradient(135deg, #fef3c7, #fde68a);
			box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
		}
		.fee-label-compact:hover {
			border-color: #f59e0b;
			transform: translateY(-2px);
		}
		.fee-label-compact i {
			font-size: 20px;
			margin-bottom: 6px;
			color: #f59e0b;
		}
		.fee-label-compact .fee-name-compact {
			font-size: 12px;
			font-weight: 600;
			color: #495057;
		}
		.info-banner-compact {
			background: #fff3cd;
			border-left: 4px solid #ffc107;
			padding: 10px 12px;
			border-radius: 4px;
			margin-bottom: 15px;
			font-size: 13px;
			color: #856404;
		}
		</style>
		
		<div class="modal-header compact-daily-header">
			<h4 class="modal-title">
				<i class="fa fa-utensils"></i> Transfer to Daily Fees
			</h4>
		</div>
		
		<div class="modal-body compact-modal-body">
			<?php if($student): ?>
				<div class="compact-info-card">
					<div class="student-name"><?php echo $student['name']; ?> (<?php echo $student['student_code']; ?>)</div>
					<div style="font-size: 11px; color: #6c757d; margin-bottom: 5px;">Available Credit</div>
					<div class="balance"><sup style="font-size: 12px;">GH₵</sup><?php echo number_format($current_credit, 2); ?></div>
				</div>
			<?php endif; ?>
			
			<div class="info-banner-compact">
				<i class="fa fa-info-circle"></i> Transfer credit to prepaid daily fees account
			</div>
			
			<form id="transfer_daily_fees_form">
				<?php if(!$student): ?>
				<div class="compact-form-group">
					<label><i class="fa fa-user"></i> Student</label>
					<select class="form-control compact-form-control select2" name="student_id" id="student_id_select" required onchange="updateStudentCredit()">
						<option value="">-- Select Student --</option>
						<?php
						$students_with_credits = $this->Credit_model->get_students_with_credits();
						foreach($students_with_credits as $s):
						?>
							<option value="<?php echo $s['student_id']; ?>" data-credit="<?php echo $s['total_credit']; ?>">
								<?php echo $s['name']; ?> (<?php echo $s['student_code']; ?>) - GH₵ <?php echo number_format($s['total_credit'], 2); ?>
							</option>
						<?php endforeach; ?>
					</select>
					<div id="selected_student_credit" style="display: none; margin-top: 5px; font-size: 12px; color: #28a745;">
						Available: GH₵ <span id="credit_amount">0.00</span>
					</div>
				</div>
				<?php else: ?>
				<input type="hidden" name="student_id" value="<?php echo $student_id; ?>">
				<?php endif; ?>
				
				<div class="compact-form-group">
					<label><i class="fa fa-tags"></i> Fee Type <span style="color: red;">*</span></label>
					<div class="fee-grid-compact">
						<div class="fee-option-compact">
							<input type="radio" name="fee_type" id="feeding" value="feeding" required>
							<label class="fee-label-compact" for="feeding">
								<i class="fa fa-utensils"></i>
								<span class="fee-name-compact">Feeding</span>
							</label>
						</div>
						<div class="fee-option-compact">
							<input type="radio" name="fee_type" id="breakfast" value="breakfast" required>
							<label class="fee-label-compact" for="breakfast">
								<i class="fa fa-coffee"></i>
								<span class="fee-name-compact">Breakfast</span>
							</label>
						</div>
						<div class="fee-option-compact">
							<input type="radio" name="fee_type" id="classes" value="classes" required>
							<label class="fee-label-compact" for="classes">
								<i class="fa fa-book"></i>
								<span class="fee-name-compact">Classes</span>
							</label>
						</div>
						<div class="fee-option-compact">
							<input type="radio" name="fee_type" id="water" value="water" required>
							<label class="fee-label-compact" for="water">
								<i class="fa fa-tint"></i>
								<span class="fee-name-compact">Water</span>
							</label>
						</div>
						<div class="fee-option-compact">
							<input type="radio" name="fee_type" id="transport" value="transport" required>
							<label class="fee-label-compact" for="transport">
								<i class="fa fa-bus"></i>
								<span class="fee-name-compact">Transport</span>
							</label>
						</div>
					</div>
				</div>
				
				<div class="row">
					<div class="col-md-6">
						<div class="compact-form-group">
							<label><i class="fa fa-money-bill-wave"></i> Amount (GH₵) <span style="color: red;">*</span></label>
							<input type="number" class="form-control compact-form-control" name="amount" step="0.01" min="0.01" max="<?php echo $current_credit ?: 999999; ?>" required placeholder="0.00">
						</div>
					</div>
					<div class="col-md-6">
						<div class="compact-form-group">
							<label><i class="fa fa-comment"></i> Reason (Optional)</label>
							<input type="text" class="form-control compact-form-control" name="reason" placeholder="Enter reason">
						</div>
					</div>
				</div>
			</form>
		</div>
		
		<div class="modal-footer compact-modal-footer">
			<button type="button" class="btn btn-secondary" data-dismiss="modal">
				<i class="fa fa-times"></i> Cancel
			</button>
			<button type="button" class="btn btn-warning" onclick="submitDailyFeesTransfer()">
				<i class="fa fa-check"></i> Transfer
			</button>
		</div>
		
		<script>
		$(document).ready(function() {
			$('.select2').select2({
				dropdownParent: $('#createModal'),
				width: '100%',
				placeholder: 'Select student'
			});
		});
		
		function updateStudentCredit() {
			var selectedOption = $('#student_id_select option:selected');
			var credit = selectedOption.data('credit');
			
			if(credit) {
				$('#credit_amount').text(parseFloat(credit).toFixed(2));
				$('#selected_student_credit').show();
				$('input[name="amount"]').attr('max', credit);
			} else {
				$('#selected_student_credit').hide();
			}
		}
		
		function submitDailyFeesTransfer() {
			var form = $('#transfer_daily_fees_form');
			
			// Validate form
			if(!form[0].checkValidity()) {
				form[0].reportValidity();
				return;
			}
			
			var formData = form.serialize();
			
			showAjaxModal_alert('Processing transfer...', 'loading');
			
			$.post('<?=site_url("admin/transfer_credit_to_daily_fees")?>', formData, function(response) {
				const data = JSON.parse(response);
				
				if(data.status === 'success') {
					showAjaxModal_alert(data.message, 'success');
					setTimeout(function() {
						location.reload();
					}, 2000);
				} else {
					showAjaxModal_alert(data.message || 'Transfer failed', 'error');
				}
			}).fail(function() {
				showAjaxModal_alert('Network error. Please try again.', 'error');
			});
		}
		</script>
		<?php
	}

	/**
	 * Get credit system dashboard data (for widgets)
	 */
	public function get_credit_dashboard_data() {
		if($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Credit_model');
		
		$statistics = $this->Credit_model->get_credit_statistics();
		echo json_encode(['status' => 'success', 'data' => $statistics]);
	}

	// ============================================
	// TERMINAL BILLS REPORT METHODS
	// Add these methods to your Admin.php controller
	// ============================================

	// 1. Selection page
	public function terminal_bills_selection() {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		$page_data['page_name'] = 'terminal_bills_selection';
		$page_data['page_title'] = 'Terminal Bills Report';
		$this->load->view('backend/index', $page_data);
	}

	// 2. AJAX endpoint to get students by class
	public function get_students_for_terminal_bill_by_class_json() {
		$class_id = $this->input->post('class_id');
		
		if(empty($class_id)) {
			echo json_encode(['status' => 'error', 'message' => 'Class ID required']);
			return;
		}
		
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		
		$this->db->select('s.student_id, s.name, s.student_code');
		$this->db->distinct(); // Prevent duplicate students
		$this->db->from('student s');
		$this->db->join('enroll e', 'e.student_id = s.student_id');
		$this->db->where('e.class_id', $class_id);
		$this->db->where('e.year', $running_year);
		//$this->db->where('s.status', 1); // Active students only
		$this->db->where('e.mute', '0'); // Active students only (not muted)
		$this->db->group_by('s.student_id'); // Group by student_id to avoid duplicates
		$this->db->order_by('s.name', 'ASC');
		
		$students = $this->db->get()->result_array();
		
		echo json_encode([
			'status' => 'success',
			'students' => $students
		]);
	}

	// 3. Generate terminal bills report
	public function terminal_bills_report() {
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		// Load Credit model for fetching student credits
		$this->load->model('Credit_model');
		
		// Get student IDs from POST or GET
		$student_ids = $this->input->post('student_ids') ?: $this->input->get('student_ids');
		
		if(empty($student_ids)) {
			echo '<div style="text-align: center; padding: 50px; font-family: Arial;">
					<h3 style="color: #e74c3c;">No students selected</h3>
					<p>Please go back and select at least one student.</p>
					<button onclick="window.close()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">Close Window</button>
				  </div>';
			return;
		}
		
		if(!is_array($student_ids)) {
			$student_ids = explode(',', $student_ids);
		}
		
		// Get next term and year
		$next_term = $this->input->post('next_term') ?: $this->input->get('next_term');
		$next_year = $this->input->post('next_year') ?: $this->input->get('next_year');
		$fee_category = $this->input->post('fee_category') ?: $this->input->get('fee_category');
		$orientation = $this->input->post('orientation') ?: $this->input->get('orientation');
		
		// Default values
		if(empty($next_term)) {
			$next_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		}
		if(empty($next_year)) {
			$next_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		}
		if(empty($fee_category)) {
			$fee_category = 'all';
		}
		if(empty($orientation)) {
			$orientation = 'portrait';
		}
		
		$students_data = array();
		
		foreach($student_ids as $student_id) {
			// Get student info
			$student = $this->db->get_where('student', array('student_id' => $student_id))->row();
			if(!$student) continue;
			
			// Get class info
			$this->db->order_by('enroll_id', 'desc');
			$this->db->limit(1);
			$enroll = $this->db->get_where('enroll', array('student_id' => $student_id))->row();
			
			if($enroll) {
				$class = $this->db->get_where('class', array('class_id' => $enroll->class_id))->row();
				$section = $this->db->get_where('section', array('section_id' => $enroll->section_id))->row();
				$class_name = $class->name . ' ' . $section->name;
				$class_numeric = $class->name_numeric;
			} else {
				$class_name = 'N/A';
				$class_numeric = '';
			}
			
			// Initialize arrays
			$invoices_owe = array();
			$invoices_next_term = array();
			$feeding_owe = 0;
			$classes_owe = 0;
			$transport_owe = 0;
			
			// Handle fee category filter
			if($fee_category == 'all' || $fee_category == 'billed_invoice') {
				// Get invoices owe (arrears) - ALL invoices EXCLUDING next term and year
				// NOTE: We include ALL invoices (regardless of payment status) to show complete picture
				$this->db->select('*');
				$this->db->from('invoice');
				$this->db->where('student_id', $student_id);
				$this->db->where('can_delete !=', 'trash');
				// Exclude invoices that match BOTH next year AND next term using NOT (year = X AND term = Y)
				$this->db->where("NOT (year = '$next_year' AND term = '$next_term')");
				$this->db->order_by('year', 'ASC');
				$this->db->order_by('term', 'ASC');
				$invoices_owe = $this->db->get()->result_array();
				
				// Get next term invoices - ONLY for selected next term and year
				// NOTE: We include ALL invoices (regardless of payment status)
				$this->db->select('*');
				$this->db->from('invoice');
				$this->db->where('student_id', $student_id);
				$this->db->where('year', $next_year);
				$this->db->where('term', $next_term);
				$this->db->where('can_delete !=', 'trash');
				$invoices_next_term = $this->db->get()->result_array();
				
				// Calculate total credit applied to next term invoices
				$next_term_credit_applied = 0;
				foreach($invoices_next_term as $inv) {
					$next_term_credit_applied += floatval($inv['credit_applied'] ?? 0);
				}
			}
			
			if($fee_category == 'all' || $fee_category == 'daily_fees') {
				// Get daily fee wallet
				$wallet = $this->db->get_where('daily_fee_wallet', array('student_id' => $student_id))->row();
				
				if($wallet) {
					$feeding_owe = $wallet->feeding_arrears > 0 ? $wallet->feeding_arrears : 0;
					$classes_owe = $wallet->classes_arrears > 0 ? $wallet->classes_arrears : 0;
					$transport_owe = $wallet->transport_arrears > 0 ? $wallet->transport_arrears : 0;
				}
			}
			
			// Get student credit balance
			$student_credit = $this->Credit_model->get_student_total_credit($student_id);
			
			$students_data[] = array(
				'student' => $student,
				'class_name' => $class_name,
				'class_numeric' => $class_numeric,
				'invoices_owe' => $invoices_owe,
				'invoices_next_term' => $invoices_next_term,
				'feeding_owe' => $feeding_owe,
				'classes_owe' => $classes_owe,
				'transport_owe' => $transport_owe,
				'next_term' => $next_term,
				'next_year' => $next_year,
				'fee_category' => $fee_category,
				'invoice_code_owe' => !empty($invoices_owe) ? $invoices_owe[0]['invoice_code'] : '',
				'invoice_code_next' => !empty($invoices_next_term) ? $invoices_next_term[0]['invoice_code'] : '',
				'student_credit' => $student_credit, // Credit balance (unused)
				'next_term_credit_applied' => $next_term_credit_applied ?? 0 // Credit applied to next term invoices
			);
		}

		// Professional approach: Include ALL students with financial activity
		// This ensures transparency - showing who owes, who's paid, and who has credit
		$students_data = array_filter($students_data, function($student_data) {
			$has_arrears_invoices = !empty($student_data['invoices_owe']);
			$has_next_term_invoices = !empty($student_data['invoices_next_term']);
			$has_daily_fees = ($student_data['feeding_owe'] + $student_data['classes_owe'] + $student_data['transport_owe']) > 0;
			$has_credit = $student_data['student_credit'] > 0;
			
			// Include student if they have ANY financial activity:
			// - Arrears (owing from past terms)
			// - Next term bills (future obligations)
			// - Daily fees arrears
			// - Credit balance
			// This ensures complete financial transparency
			return $has_arrears_invoices || $has_next_term_invoices || $has_daily_fees || $has_credit;
		});
		
		$page_data['students_data'] = $students_data;
		
		// Load appropriate view based on orientation
		if($orientation == 'landscape') {
			$this->load->view('backend/admin/creche_bill_landscape', $page_data);
		} else {
			$this->load->view('backend/admin/creche_bill', $page_data);
		}
	}


	// ===================================
	// GES LESSON NOTE SYSTEM - CURRICULUM MANAGEMENT
	// ===================================

	/**
	 * Curriculum Strands Management
	 * Requirements: 8.1, 8.5
	 */
	public function curriculum_strands($param1 = '', $param2 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');

		if ($param1 == 'create') {
			$data = array(
				'subject_id' => $this->input->post('subject_id'),
				'class_level' => $this->input->post('class_level'),
				'name' => $this->input->post('name'),
				'description' => $this->input->post('description'),
				'created_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->create_strand($data);
			
			// Check if AJAX request
			if ($this->input->is_ajax_request()) {
				if ($result) {
					echo json_encode(array(
						'success' => true,
						'message' => get_phrase('strand_created_successfully')
					));
				} else {
					echo json_encode(array(
						'success' => false,
						'message' => get_phrase('failed_to_create_strand')
					));
				}
				return;
			}
			
			// Regular request (fallback)
			if ($result) {
				$this->session->set_flashdata('flash_message', get_phrase('strand_created_successfully'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('failed_to_create_strand'));
			}
			redirect(site_url('admin/curriculum_strands'));

		} elseif ($param1 == 'update') {
			$data = array(
				'subject_id' => $this->input->post('subject_id'),
				'class_level' => $this->input->post('class_level'),
				'name' => $this->input->post('name'),
				'description' => $this->input->post('description'),
				'updated_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->update_strand($param2, $data);
			
			// Check if AJAX request
			if ($this->input->is_ajax_request()) {
				if ($result) {
					echo json_encode(array(
						'success' => true,
						'message' => get_phrase('strand_updated_successfully')
					));
				} else {
					echo json_encode(array(
						'success' => false,
						'message' => get_phrase('failed_to_update_strand')
					));
				}
				return;
			}
			
			// Regular request (fallback)
			if ($result) {
				$this->session->set_flashdata('flash_message', get_phrase('strand_updated_successfully'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('failed_to_update_strand'));
			}
			redirect(site_url('admin/curriculum_strands'));

		} elseif ($param1 == 'delete') {
			$result = $this->Curriculum_model->delete_strand($param2);
			
			// Check if AJAX request
			if ($this->input->is_ajax_request()) {
				if ($result) {
					echo json_encode(array(
						'success' => true,
						'message' => get_phrase('strand_deleted_successfully')
					));
				} else {
					echo json_encode(array(
						'success' => false,
						'message' => get_phrase('failed_to_delete_strand')
					));
				}
				return;
			}
			
			// Regular request (fallback)
			if ($result) {
				$this->session->set_flashdata('flash_message', get_phrase('strand_deleted_successfully'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('failed_to_delete_strand'));
			}
			redirect(site_url('admin/curriculum_strands'));
		}

		// Get all strands with subject and class info
		$page_data['strands'] = $this->Curriculum_model->get_all_strands();
		
		// Get sub_strands count for statistics
		$page_data['sub_strands'] = $this->Curriculum_model->get_all_sub_strands();
		
		$page_data['page_name'] = 'curriculum_strands_modern';
		$page_data['page_title'] = get_phrase('curriculum_strands');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * AJAX: Get subjects by class for curriculum strand modal
	 * Requirements: 8.1
	 */
	public function get_subjects_by_class() {
		if ($this->session->userdata('admin_login') != 1) {
			echo json_encode(array('success' => false, 'message' => 'Unauthorized'));
			return;
		}

		$class_id = $this->input->post('class_id');
		
		if (empty($class_id)) {
			echo json_encode(array('success' => false, 'message' => 'Class ID required'));
			return;
		}

		// Get subjects for the selected class
		$subjects = $this->crud_model->get_subjects_by_class($class_id);
		
		echo json_encode(array(
			'success' => true,
			'subjects' => $subjects
		));
	}

	/**
	 * Curriculum Sub-Strands Management
	 * Requirements: 8.2, 8.6
	 */
	public function curriculum_sub_strands($param1 = '', $param2 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');

		if ($param1 == 'create') {
			$data = array(
				'strand_id' => $this->input->post('strand_id'),
				'name' => $this->input->post('name'),
				'description' => $this->input->post('description'),
				'created_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->create_sub_strand($data);
			
			// Return JSON for AJAX
			echo json_encode(array(
				'success' => $result ? true : false,
				'message' => $result ? get_phrase('sub_strand_created_successfully') : get_phrase('failed_to_create_sub_strand')
			));
			return;

		} elseif ($param1 == 'update') {
			$data = array(
				'strand_id' => $this->input->post('strand_id'),
				'name' => $this->input->post('name'),
				'description' => $this->input->post('description'),
				'updated_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->update_sub_strand($param2, $data);
			
			// Return JSON for AJAX
			echo json_encode(array(
				'success' => $result ? true : false,
				'message' => $result ? get_phrase('sub_strand_updated_successfully') : get_phrase('failed_to_update_sub_strand')
			));
			return;

		} elseif ($param1 == 'delete') {
			$result = $this->Curriculum_model->delete_sub_strand($param2);
			
			// Return JSON for AJAX
			echo json_encode(array(
				'success' => $result ? true : false,
				'message' => $result ? get_phrase('sub_strand_deleted_successfully') : get_phrase('failed_to_delete_sub_strand')
			));
			return;
		}

		// Filter by strand if provided
		$strand_filter = $this->input->get('strand_id');
		$page_data['sub_strands'] = $this->Curriculum_model->get_all_sub_strands($strand_filter);
		$page_data['strands'] = $this->Curriculum_model->get_all_strands();
		$page_data['selected_strand'] = $strand_filter;
		$page_data['page_name'] = 'curriculum_sub_strands_modern';
		$page_data['page_title'] = get_phrase('curriculum_sub_strands');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Curriculum Content Standards Management
	 * Requirements: 8.3, 8.7
	 */
	public function curriculum_content_standards($param1 = '', $param2 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');

		if ($param1 == 'create') {
			$data = array(
				'sub_strand_id' => $this->input->post('sub_strand_id'),
				'code' => $this->input->post('code'),
				'description' => $this->input->post('description'),
				'created_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->create_content_standard($data);
			
			// Return JSON for AJAX
			echo json_encode(array(
				'success' => $result ? true : false,
				'message' => $result ? get_phrase('content_standard_created_successfully') : get_phrase('failed_to_create_content_standard')
			));
			return;

		} elseif ($param1 == 'update') {
			$data = array(
				'sub_strand_id' => $this->input->post('sub_strand_id'),
				'code' => $this->input->post('code'),
				'description' => $this->input->post('description'),
				'updated_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->update_content_standard($param2, $data);
			
			// Return JSON for AJAX
			echo json_encode(array(
				'success' => $result ? true : false,
				'message' => $result ? get_phrase('content_standard_updated_successfully') : get_phrase('failed_to_update_content_standard')
			));
			return;

		} elseif ($param1 == 'delete') {
			$result = $this->Curriculum_model->delete_content_standard($param2);
			
			// Return JSON for AJAX
			echo json_encode(array(
				'success' => $result ? true : false,
				'message' => $result ? get_phrase('content_standard_deleted_successfully') : get_phrase('failed_to_delete_content_standard')
			));
			return;
		}

		// Filter by sub-strand if provided
		$sub_strand_filter = $this->input->get('sub_strand_id');
		$page_data['content_standards'] = $this->Curriculum_model->get_all_content_standards($sub_strand_filter);
		$page_data['sub_strands'] = $this->Curriculum_model->get_all_sub_strands();
		$page_data['selected_sub_strand'] = $sub_strand_filter;
		$page_data['page_name'] = 'curriculum_content_standards_modern';
		$page_data['page_title'] = get_phrase('curriculum_content_standards');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Modal: Add Sub-Strand
	 */
	public function modal_sub_strand_add() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');
		$page_data['strands'] = $this->Curriculum_model->get_all_strands();
		$this->load->view('backend/admin/modal_sub_strand_add', $page_data);
	}

	/**
	 * Modal: Edit Sub-Strand
	 */
	public function modal_sub_strand_edit($id) {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');
		$page_data['sub_strand'] = $this->Curriculum_model->get_sub_strand($id);
		$page_data['strands'] = $this->Curriculum_model->get_all_strands();
		$this->load->view('backend/admin/modal_sub_strand_edit', $page_data);
	}

	/**
	 * Modal: Add Content Standard
	 */
	public function modal_content_standard_add() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');
		$page_data['sub_strands'] = $this->Curriculum_model->get_all_sub_strands();
		$page_data['selected_sub_strand'] = $this->input->get('sub_strand_id');
		$this->load->view('backend/admin/modal_content_standard_add', $page_data);
	}

	/**
	 * Modal: Edit Content Standard
	 */
	public function modal_content_standard_edit($id) {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');
		$page_data['content_standard'] = $this->Curriculum_model->get_content_standard($id);
		$page_data['sub_strands'] = $this->Curriculum_model->get_all_sub_strands();
		$this->load->view('backend/admin/modal_content_standard_edit', $page_data);
	}

	/**
	 * Curriculum Learning Indicators Management
	 * Requirements: 8.4, 8.8
	 */
	public function curriculum_learning_indicators($param1 = '', $param2 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');

		if ($param1 == 'create') {
			$data = array(
				'content_standard_id' => $this->input->post('content_standard_id'),
				'code' => $this->input->post('code'),
				'description' => $this->input->post('description'),
				'created_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->create_learning_indicator($data);
			if ($result) {
				$this->session->set_flashdata('flash_message', get_phrase('learning_indicator_created_successfully'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('failed_to_create_learning_indicator'));
			}
			redirect(site_url('admin/curriculum_learning_indicators'));

		} elseif ($param1 == 'update') {
			$data = array(
				'content_standard_id' => $this->input->post('content_standard_id'),
				'code' => $this->input->post('code'),
				'description' => $this->input->post('description'),
				'updated_at' => date('Y-m-d H:i:s')
			);

			$result = $this->Curriculum_model->update_learning_indicator($param2, $data);
			if ($result) {
				$this->session->set_flashdata('flash_message', get_phrase('learning_indicator_updated_successfully'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('failed_to_update_learning_indicator'));
			}
			redirect(site_url('admin/curriculum_learning_indicators'));

		} elseif ($param1 == 'delete') {
			$result = $this->Curriculum_model->delete_learning_indicator($param2);
			if ($result) {
				$this->session->set_flashdata('flash_message', get_phrase('learning_indicator_deleted_successfully'));
			} else {
				$this->session->set_flashdata('error_message', get_phrase('failed_to_delete_learning_indicator'));
			}
			redirect(site_url('admin/curriculum_learning_indicators'));
		}

		// Filter by content standard if provided
		$content_standard_filter = $this->input->get('content_standard_id');
		$page_data['learning_indicators'] = $this->Curriculum_model->get_all_learning_indicators($content_standard_filter);
		$page_data['content_standards'] = $this->Curriculum_model->get_all_content_standards();
		$page_data['selected_content_standard'] = $content_standard_filter;
		$page_data['page_name'] = 'curriculum_learning_indicators';
		$page_data['page_title'] = get_phrase('curriculum_learning_indicators');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Curriculum Bulk Import
	 * Requirements: 8.9, 8.10
	 */
	public function curriculum_import() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Curriculum_model');

		if ($this->input->post('import')) {
			$file = $_FILES['curriculum_file'];

			if ($file['error'] == 0) {
				$file_ext = pathinfo($file['name'], PATHINFO_EXTENSION);

				if (in_array(strtolower($file_ext), array('csv', 'xlsx', 'xls'))) {
					$result = $this->Curriculum_model->import_curriculum_from_file($file);

					if ($result['success']) {
						$this->session->set_flashdata('flash_message', 
							get_phrase('import_completed') . ': ' . 
							$result['imported'] . ' ' . get_phrase('records_imported'));
					} else {
						$this->session->set_flashdata('error_message', $result['message']);
					}
				} else {
					$this->session->set_flashdata('error_message', get_phrase('invalid_file_format'));
				}
			} else {
				$this->session->set_flashdata('error_message', get_phrase('file_upload_error'));
			}
			redirect(site_url('admin/curriculum_import'));
		}

		$page_data['page_name'] = 'curriculum_import';
		$page_data['page_title'] = get_phrase('import_curriculum');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Get strands by subject and class (AJAX)
	 */
	public function get_strands_by_subject_class() {
		$subject_id = $this->input->get('subject_id');
		$class_level = $this->input->get('class_level');

		$this->load->model('Curriculum_model');
		$strands = $this->Curriculum_model->get_strands_by_subject_class($subject_id, $class_level);

		echo json_encode($strands);
	}

	/**
	 * Get sub-strands by strand (AJAX)
	 */
	public function get_sub_strands_by_strand() {
		$strand_id = $this->input->get('strand_id');

		$this->load->model('Curriculum_model');
		$sub_strands = $this->Curriculum_model->get_sub_strands_by_strand($strand_id);

		echo json_encode($sub_strands);
	}

	/**
	 * Get content standards by sub-strand (AJAX)
	 */
	public function get_content_standards_by_sub_strand() {
		$sub_strand_id = $this->input->get('sub_strand_id');

		$this->load->model('Curriculum_model');
		$content_standards = $this->Curriculum_model->get_content_standards_by_sub_strand($sub_strand_id);

		echo json_encode($content_standards);
	}

	// ===================================
	// GES LESSON NOTE SYSTEM - APPROVAL WORKFLOW
	// ===================================

	/**
	 * Pending Lesson Notes for Approval
	 * Requirements: 9.2, 9.8, 9.9
	 */
	public function lesson_notes_pending() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Lesson_note_model');

		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;

		// Get filters
		$filters = array(
			'status' => $this->input->get('status') ?: 'pending',
			'teacher_id' => $this->input->get('teacher_id'),
			'subject_id' => $this->input->get('subject_id'),
			'class_id' => $this->input->get('class_id'),
			'term' => $this->input->get('term') ?: $running_term,
			'week_number' => $this->input->get('week_number')
		);

		$page_data['lesson_notes'] = $this->Lesson_note_model->get_lesson_notes_for_approval($filters);
		$page_data['teachers'] = $this->db->get('teacher')->result();
		$page_data['subjects'] = $this->db->get('subject')->result();
		$page_data['classes'] = $this->db->order_by('name_numeric', 'ASC')->get('class')->result();
		$page_data['filters'] = $filters;
		$page_data['counts'] = $this->Lesson_note_model->get_status_counts($filters);

		$page_data['page_name'] = 'lesson_notes_pending';
		$page_data['page_title'] = get_phrase('lesson_notes_approval');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * View Lesson Note Detail for Review
	 * Requirements: 9.3, 9.4, 9.5, 9.6
	 */
	public function lesson_note_review($lesson_note_id = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		if (empty($lesson_note_id)) {
			redirect(site_url('admin/lesson_notes_pending'));
		}

		$this->load->model(array('Lesson_note_model', 'Curriculum_model'));

		$lesson_note = $this->Lesson_note_model->get_lesson_note($lesson_note_id);

		if (!$lesson_note) {
			$this->session->set_flashdata('error_message', get_phrase('lesson_note_not_found'));
			redirect(site_url('admin/lesson_notes_pending'));
		}

		// Get related data
		$page_data['lesson_note'] = $lesson_note;
		$page_data['learning_indicators'] = $this->Lesson_note_model->get_lesson_note_indicators($lesson_note_id);
		$page_data['core_competencies'] = $this->Lesson_note_model->get_lesson_note_competencies($lesson_note_id);
		$page_data['teaching_resources'] = $this->Lesson_note_model->get_lesson_note_resources($lesson_note_id);
		$page_data['assessment_methods'] = $this->Lesson_note_model->get_lesson_note_assessments($lesson_note_id);
		$page_data['references'] = $this->Lesson_note_model->get_lesson_note_references($lesson_note_id);
		$page_data['revision_history'] = $this->Lesson_note_model->get_revision_history($lesson_note_id);

		$page_data['page_name'] = 'lesson_note_review';
		$page_data['page_title'] = get_phrase('review_lesson_note');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Approve Lesson Note
	 * Requirements: 9.4, 9.7
	 */
	public function lesson_note_approve($lesson_note_id = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		if (empty($lesson_note_id)) {
			redirect(site_url('admin/lesson_notes_pending'));
		}

		$this->load->model('Lesson_note_model');

		$admin_id = $this->session->userdata('admin_id');
		$result = $this->Lesson_note_model->approve_lesson_note($lesson_note_id, $admin_id);

		if ($result) {
			$this->session->set_flashdata('flash_message', get_phrase('lesson_note_approved_successfully'));
		} else {
			$this->session->set_flashdata('error_message', get_phrase('failed_to_approve_lesson_note'));
		}

		redirect(site_url('admin/lesson_notes_pending'));
	}

	/**
	 * Decline Lesson Note
	 * Requirements: 9.5, 9.6, 9.7
	 */
	public function lesson_note_decline($lesson_note_id = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		if (empty($lesson_note_id)) {
			redirect(site_url('admin/lesson_notes_pending'));
		}

		$this->load->model('Lesson_note_model');

		$feedback = $this->input->post('feedback');

		if (empty($feedback)) {
			$this->session->set_flashdata('error_message', get_phrase('feedback_required_for_decline'));
			redirect(site_url('admin/lesson_note_review/' . $lesson_note_id));
		}

		$admin_id = $this->session->userdata('admin_id');
		$result = $this->Lesson_note_model->decline_lesson_note($lesson_note_id, $admin_id, $feedback);

		if ($result) {
			$this->session->set_flashdata('flash_message', get_phrase('lesson_note_declined_successfully'));
		} else {
			$this->session->set_flashdata('error_message', get_phrase('failed_to_decline_lesson_note'));
		}

		redirect(site_url('admin/lesson_notes_pending'));
	}

	/**
	 * Bulk Approve Lesson Notes
	 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
	 */
	public function lesson_notes_bulk_approve() {
		if ($this->session->userdata('admin_login') != 1) {
			echo json_encode(array('status' => 'error', 'message' => 'Unauthorized'));
			return;
		}

		$lesson_note_ids = $this->input->post('lesson_note_ids');

		if (empty($lesson_note_ids) || !is_array($lesson_note_ids)) {
			echo json_encode(array('status' => 'error', 'message' => get_phrase('no_lesson_notes_selected')));
			return;
		}

		// Limit to 50 records
		if (count($lesson_note_ids) > 50) {
			echo json_encode(array('status' => 'error', 'message' => get_phrase('maximum_50_records_allowed')));
			return;
		}

		$this->load->model('Lesson_note_model');

		$admin_id = $this->session->userdata('admin_id');
		$result = $this->Lesson_note_model->bulk_approve_lesson_notes($lesson_note_ids, $admin_id);

		echo json_encode(array(
			'status' => 'success',
			'message' => $result['approved'] . ' ' . get_phrase('lesson_notes_approved'),
			'approved' => $result['approved'],
			'failed' => $result['failed']
		));
	}

	/**
	 * Bulk Decline Lesson Notes
	 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7
	 */
	public function lesson_notes_bulk_decline() {
		if ($this->session->userdata('admin_login') != 1) {
			echo json_encode(array('status' => 'error', 'message' => 'Unauthorized'));
			return;
		}

		$lesson_note_ids = $this->input->post('lesson_note_ids');
		$feedback = $this->input->post('feedback');

		if (empty($lesson_note_ids) || !is_array($lesson_note_ids)) {
			echo json_encode(array('status' => 'error', 'message' => get_phrase('no_lesson_notes_selected')));
			return;
		}

		if (empty($feedback)) {
			echo json_encode(array('status' => 'error', 'message' => get_phrase('feedback_required_for_decline')));
			return;
		}

		// Limit to 50 records
		if (count($lesson_note_ids) > 50) {
			echo json_encode(array('status' => 'error', 'message' => get_phrase('maximum_50_records_allowed')));
			return;
		}

		$this->load->model('Lesson_note_model');

		$admin_id = $this->session->userdata('admin_id');
		$result = $this->Lesson_note_model->bulk_decline_lesson_notes($lesson_note_ids, $admin_id, $feedback);

		echo json_encode(array(
			'status' => 'success',
			'message' => $result['declined'] . ' ' . get_phrase('lesson_notes_declined'),
			'declined' => $result['declined'],
			'failed' => $result['failed']
		));
	}

	/**
	 * Lesson Note Compliance Report
	 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8
	 */
	public function lesson_notes_compliance() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Lesson_note_model');

		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;

		// Get filters
		$filters = array(
			'term' => $this->input->get('term') ?: $running_term,
			'year' => $this->input->get('year') ?: $running_year,
			'teacher_id' => $this->input->get('teacher_id'),
			'subject_id' => $this->input->get('subject_id'),
			'class_id' => $this->input->get('class_id')
		);

		// Get compliance data in the format expected by the view
		$page_data['compliance_data'] = $this->Lesson_note_model->get_teacher_compliance_list($filters);
		$page_data['submission_stats'] = $this->Lesson_note_model->get_submission_summary($filters);
		$page_data['zero_submission_teachers'] = $this->Lesson_note_model->get_zero_submission_teachers($filters);
		$page_data['high_decline_teachers'] = $this->Lesson_note_model->get_high_decline_teachers($filters);
		$page_data['weekly_breakdown'] = $this->Lesson_note_model->get_weekly_breakdown($filters);
		$page_data['trend_data'] = $this->Lesson_note_model->get_compliance_trend($filters);
		
		$page_data['teachers'] = $this->db->get('teacher')->result();
		$page_data['subjects'] = $this->db->get('subject')->result();
		$page_data['classes'] = $this->db->order_by('name_numeric', 'ASC')->get('class')->result();
		$page_data['filters'] = $filters;

		$page_data['page_name'] = 'lesson_notes_compliance';
		$page_data['page_title'] = get_phrase('lesson_notes_compliance_report');
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Export Compliance Report
	 * Requirements: 13.6, 13.7, 13.8
	 */
	public function lesson_notes_compliance_export($format = 'pdf') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$this->load->model('Lesson_note_model');

		$filters = array(
			'term' => $this->input->get('term'),
			'year' => $this->input->get('year'),
			'teacher_id' => $this->input->get('teacher_id'),
			'subject_id' => $this->input->get('subject_id'),
			'class_id' => $this->input->get('class_id')
		);

		$data['compliance_data'] = $this->Lesson_note_model->get_compliance_report($filters);
		$data['submission_stats'] = $this->Lesson_note_model->get_submission_stats($filters);

		if ($format == 'excel') {
			// Generate Excel export
			$this->load->library('excel');
			$this->_generate_compliance_excel($data);
		} elseif ($format == 'csv') {
			// Generate CSV export
			$this->_generate_compliance_csv($data);
		} else {
			// Generate PDF export
			$this->_generate_compliance_pdf($data);
		}
	}

	/**
	 * Lesson Notes Compliance Drilldown
	 * Requirements: 13.7
	 */
	public function lesson_notes_compliance_drilldown() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		$teacher_id = $this->input->get('teacher_id');
		
		if (!$teacher_id) {
			echo '<div class="alert alert-danger">' . get_phrase('teacher_id_required') . '</div>';
			return;
		}

		$this->load->model('Lesson_note_model');

		// Get teacher details
		$teacher = $this->db->get_where('teacher', array('teacher_id' => $teacher_id))->row();
		
		// Get teacher's lesson notes by subject
		$this->db->select('s.name as subject_name, c.name as class_name, c.name_numeric,
			COUNT(ln.id) as total_notes,
			SUM(CASE WHEN ln.status = "approved" THEN 1 ELSE 0 END) as approved,
			SUM(CASE WHEN ln.status = "pending" THEN 1 ELSE 0 END) as pending,
			SUM(CASE WHEN ln.status = "declined" THEN 1 ELSE 0 END) as declined');
		$this->db->from('lesson_notes ln');
		$this->db->join('subject s', 's.subject_id = ln.subject_id', 'left');
		$this->db->join('class c', 'c.class_id = ln.class_id', 'left');
		$this->db->where('ln.teacher_id', $teacher_id);
		$this->db->group_by('ln.subject_id, ln.class_id');
		$subject_breakdown = $this->db->get()->result();

		// Get weekly submission pattern
		$this->db->select('week_number, term,
			COUNT(id) as total,
			SUM(CASE WHEN status = "approved" THEN 1 ELSE 0 END) as approved');
		$this->db->from('lesson_notes');
		$this->db->where('teacher_id', $teacher_id);
		$this->db->group_by('week_number, term');
		$this->db->order_by('term', 'ASC');
		$this->db->order_by('week_number', 'ASC');
		$weekly_pattern = $this->db->get()->result();

		// Get recent submissions
		$this->db->select('ln.*, s.name as subject_name, c.name as class_name');
		$this->db->from('lesson_notes ln');
		$this->db->join('subject s', 's.subject_id = ln.subject_id', 'left');
		$this->db->join('class c', 'c.class_id = ln.class_id', 'left');
		$this->db->where('ln.teacher_id', $teacher_id);
		$this->db->order_by('ln.created_at', 'DESC');
		$this->db->limit(10);
		$recent_submissions = $this->db->get()->result();
		?>
		<div class="row">
			<div class="col-md-12">
				<h4><?php echo $teacher->name; ?></h4>
				<p class="text-muted"><?php echo get_phrase('email'); ?>: <?php echo $teacher->email; ?></p>
			</div>
		</div>

		<!-- Subject Breakdown -->
		<div class="row">
			<div class="col-md-12">
				<h5><?php echo get_phrase('subject_breakdown'); ?></h5>
				<table class="table table-bordered table-striped">
					<thead>
						<tr>
							<th><?php echo get_phrase('subject'); ?></th>
							<th><?php echo get_phrase('class'); ?></th>
							<th><?php echo get_phrase('total'); ?></th>
							<th><?php echo get_phrase('approved'); ?></th>
							<th><?php echo get_phrase('pending'); ?></th>
							<th><?php echo get_phrase('declined'); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php if (!empty($subject_breakdown)): ?>
							<?php foreach ($subject_breakdown as $row): ?>
								<tr>
									<td><?php echo $row->subject_name; ?></td>
									<td><?php echo $row->class_name . ' ' . $row->name_numeric; ?></td>
									<td><?php echo $row->total_notes; ?></td>
									<td><span class="label label-success"><?php echo $row->approved; ?></span></td>
									<td><span class="label label-warning"><?php echo $row->pending; ?></span></td>
									<td><span class="label label-danger"><?php echo $row->declined; ?></span></td>
								</tr>
							<?php endforeach; ?>
						<?php else: ?>
							<tr><td colspan="6" class="text-center"><?php echo get_phrase('no_data_found'); ?></td></tr>
						<?php endif; ?>
					</tbody>
				</table>
			</div>
		</div>

		<!-- Weekly Pattern -->
		<div class="row">
			<div class="col-md-12">
				<h5><?php echo get_phrase('weekly_submission_pattern'); ?></h5>
				<table class="table table-bordered table-striped">
					<thead>
						<tr>
							<th><?php echo get_phrase('term'); ?></th>
							<th><?php echo get_phrase('week'); ?></th>
							<th><?php echo get_phrase('submitted'); ?></th>
							<th><?php echo get_phrase('approved'); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php if (!empty($weekly_pattern)): ?>
							<?php foreach ($weekly_pattern as $row): ?>
								<tr>
									<td><?php echo $row->term; ?></td>
									<td><?php echo $row->week_number; ?></td>
									<td><?php echo $row->total; ?></td>
									<td><?php echo $row->approved; ?></td>
								</tr>
							<?php endforeach; ?>
						<?php else: ?>
							<tr><td colspan="4" class="text-center"><?php echo get_phrase('no_data_found'); ?></td></tr>
						<?php endif; ?>
					</tbody>
				</table>
			</div>
		</div>

		<!-- Recent Submissions -->
		<div class="row">
			<div class="col-md-12">
				<h5><?php echo get_phrase('recent_submissions'); ?></h5>
				<table class="table table-bordered table-striped">
					<thead>
						<tr>
							<th><?php echo get_phrase('title'); ?></th>
							<th><?php echo get_phrase('subject'); ?></th>
							<th><?php echo get_phrase('week'); ?></th>
							<th><?php echo get_phrase('status'); ?></th>
							<th><?php echo get_phrase('date'); ?></th>
						</tr>
					</thead>
					<tbody>
						<?php if (!empty($recent_submissions)): ?>
							<?php foreach ($recent_submissions as $note): ?>
								<tr>
									<td><?php echo $note->title; ?></td>
									<td><?php echo $note->subject_name; ?></td>
									<td><?php echo $note->week_number; ?></td>
									<td>
										<?php
										$status_class = ($note->status == 'approved') ? 'label-success' : 
											(($note->status == 'pending') ? 'label-warning' : 'label-danger');
										?>
										<span class="label <?php echo $status_class; ?>"><?php echo ucfirst($note->status); ?></span>
									</td>
									<td><?php echo date('d M Y', strtotime($note->created_at)); ?></td>
								</tr>
							<?php endforeach; ?>
						<?php else: ?>
							<tr><td colspan="5" class="text-center"><?php echo get_phrase('no_submissions_found'); ?></td></tr>
						<?php endif; ?>
					</tbody>
				</table>
			</div>
		</div>
		<?php
	}

	/**
	 * HOD Subject Assignments Management
	 * Requirements: 10.8
	 */
	public function hod_subject_assignments($param1 = '', $param2 = '') {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}

		if ($param1 == 'create') {
			$data = array(
				'hod_id' => $this->input->post('hod_id'),
				'subject_id' => $this->input->post('subject_id'),
				'created_at' => date('Y-m-d H:i:s')
			);

			$this->db->insert('hod_subjects', $data);
			$this->session->set_flashdata('flash_message', get_phrase('hod_subject_assigned_successfully'));
			redirect(site_url('admin/hod_subject_assignments'));

		} elseif ($param1 == 'delete') {
			$this->db->where('id', $param2);
			$this->db->delete('hod_subjects');
			$this->session->set_flashdata('flash_message', get_phrase('hod_subject_assignment_removed'));
			redirect(site_url('admin/hod_subject_assignments'));
		}

		// Get HODs (teachers with HOD role)
		$page_data['hods'] = $this->db->query(
			"SELECT t.teacher_id, t.name FROM teacher t 
			 WHERE t.is_hod = 1 OR EXISTS (
				 SELECT 1 FROM admin a WHERE a.teacher_id = t.teacher_id
			 )
			 ORDER BY t.name"
		)->result();

		$page_data['subjects'] = $this->db->get('subject')->result();
		$page_data['assignments'] = $this->db->query(
			"SELECT hs.*, t.name as hod_name, s.name as subject_name 
			 FROM hod_subjects hs 
			 JOIN teacher t ON t.teacher_id = hs.hod_id 
			 JOIN subject s ON s.subject_id = hs.subject_id 
			 ORDER BY t.name, s.name"
		)->result();

		$page_data['page_name'] = 'hod_subject_assignments';
		$page_data['page_title'] = get_phrase('hod_subject_assignments');
		$this->load->view('backend/index', $page_data);
	}

	// ===================================
	// LESSON NOTE NOTIFICATIONS =========
	// ===================================
	
	/**
	 * Get lesson note notifications for admin
	 * AJAX endpoint for notification system
	 * 
	 * Requirements: 17.6, 17.7, 20.4
	 */
	function get_lesson_note_notifications() {
		if ($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Lesson_note_model');
		
		$admin_id = $this->session->userdata('admin_id');
		$limit = $this->input->get('limit') ?? 10;
		
		// Get notifications
		$notifications = $this->Lesson_note_model->get_notifications_for_user($admin_id, 'admin', $limit);
		
		// Get unread count
		$unread_count = $this->Lesson_note_model->get_unread_notification_count($admin_id, 'admin');
		
		// Add URLs to notifications
		foreach ($notifications as &$notification) {
			$notification->url = $this->generate_lesson_note_notification_url($notification);
		}
		
		echo json_encode([
			'status' => 'success',
			'notifications' => $notifications,
			'unread_count' => $unread_count
		]);
	}
	
	/**
	 * Mark lesson note notification as read
	 * 
	 * Requirements: 17.7
	 */
	function mark_lesson_note_notification_read() {
		if ($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Lesson_note_model');
		
		$notification_id = $this->input->post('notification_id');
		$admin_id = $this->session->userdata('admin_id');
		
		if (empty($notification_id)) {
			echo json_encode(['status' => 'error', 'message' => 'Notification ID required']);
			return;
		}
		
		$result = $this->Lesson_note_model->mark_notification_read($notification_id, $admin_id, 'admin');
		
		if ($result) {
			echo json_encode(['status' => 'success', 'message' => 'Notification marked as read']);
		} else {
			echo json_encode(['status' => 'error', 'message' => 'Failed to mark notification as read']);
		}
	}
	
	/**
	 * Mark all lesson note notifications as read
	 * 
	 * Requirements: 17.7
	 */
	function mark_all_lesson_note_notifications_read() {
		if ($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		$this->load->model('Lesson_note_model');
		
		$admin_id = $this->session->userdata('admin_id');
		
		$result = $this->Lesson_note_model->mark_all_notifications_read($admin_id, 'admin');
		
		if ($result) {
			echo json_encode(['status' => 'success', 'message' => 'All notifications marked as read']);
		} else {
			echo json_encode(['status' => 'error', 'message' => 'Failed to mark notifications as read']);
		}
	}
	
	/**
	 * View all lesson note notifications page
	 * 
	 * Requirements: 17.7
	 */
	function lesson_note_notifications() {
		if ($this->session->userdata('admin_login') != 1) {
			redirect(base_url());
		}
		
		$this->load->model('Lesson_note_model');
		
		$admin_id = $this->session->userdata('admin_id');
		
		// Get all notifications (paginated)
		$page = $this->input->get('page') ?? 1;
		$per_page = 20;
		$offset = ($page - 1) * $per_page;
		
		$notifications = $this->Lesson_note_model->get_notifications_for_user($admin_id, 'admin', $per_page, $offset);
		$total_count = $this->Lesson_note_model->get_notification_count($admin_id, 'admin');
		
		// Add URLs to notifications
		foreach ($notifications as &$notification) {
			$notification->url = $this->generate_lesson_note_notification_url($notification);
		}
		
		$page_data['notifications'] = $notifications;
		$page_data['total_count'] = $total_count;
		$page_data['current_page'] = $page;
		$page_data['total_pages'] = ceil($total_count / $per_page);
		$page_data['page_name'] = 'lesson_note_notifications';
		$page_data['page_title'] = get_phrase('notifications');
		
		$this->load->view('backend/index', $page_data);
	}
	
	/**
	 * Generate URL for lesson note notification based on type
	 * 
	 * @param object $notification
	 * @return string
	 */
	private function generate_lesson_note_notification_url($notification) {
		$base = base_url();
		
		switch ($notification->reference_type) {
			case 'lesson_note_endorsed':
			case 'lesson_note_submitted':
				return $base . 'admin/lesson_note_review/' . $notification->reference_id;
			
			default:
				return $base . 'admin/lesson_notes_pending';
		}
	}

	public function test_sync_tracking() {
    $student_id = 1;
    $before = $this->db->get_where('student', ['student_id' => $student_id])->row();
    $this->db->where('student_id', $student_id);
    $this->db->update('student', ['name' => $before->name]);
    $after = $this->db->get_where('student', ['student_id' => $student_id])->row();
    
    echo "BEFORE: sync_status={$before->sync_status}, version={$before->version}<br>";
    echo "AFTER: sync_status={$after->sync_status}, version={$after->version}<br>";
    echo ($after->sync_status === 'PENDING' && $after->version > $before->version) 
        ? "<h3 style='color:green;'>✅ WORKING!</h3>" 
        : "<h3 style='color:red;'>❌ NOT WORKING</h3>";
}

	public function check_pending_settings() {
		echo "<h2>Pending Settings Records</h2>";
		
		$pending_settings = $this->db
			->select('settings_id, type, description, sync_status, last_modified_at, device_id')
			->where('sync_status', 'PENDING')
			->order_by('last_modified_at', 'DESC')
			->get('settings')
			->result_array();
		
		if (count($pending_settings) > 0) {
			echo "<p><strong>Found " . count($pending_settings) . " pending settings:</strong></p>";
			echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%;'>";
			echo "<tr style='background: #f0f0f0;'>";
			echo "<th>ID</th><th>Type</th><th>Description</th><th>Sync Status</th><th>Last Modified</th><th>Device ID</th>";
			echo "</tr>";
			
			foreach ($pending_settings as $row) {
				echo "<tr>";
				echo "<td>" . $row['settings_id'] . "</td>";
				echo "<td><strong>" . htmlspecialchars($row['type']) . "</strong></td>";
				echo "<td>" . htmlspecialchars(substr($row['description'], 0, 100)) . "</td>";
				echo "<td>" . $row['sync_status'] . "</td>";
				echo "<td>" . $row['last_modified_at'] . "</td>";
				echo "<td>" . $row['device_id'] . "</td>";
				echo "</tr>";
			}
			
			echo "</table>";
			
			// Analysis
			echo "<hr><h3>Analysis</h3>";
			$sync_metadata_count = 0;
			$other_count = 0;
			
			foreach ($pending_settings as $row) {
				$type = $row['type'];
				if ($type === 'last_sync_time' || 
					$type === 'last_sync_status' || 
					$type === 'last_sync_error' ||
					strpos($type, 'last_pull_sync_') === 0) {
					$sync_metadata_count++;
				} else {
					$other_count++;
				}
			}
			
			echo "<p><strong>Sync Metadata Settings:</strong> $sync_metadata_count</p>";
			echo "<p><strong>Other Settings:</strong> $other_count</p>";
			
			if ($sync_metadata_count > 0 && $other_count === 0) {
				echo "<div style='background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; margin: 10px 0;'>";
				echo "<h4 style='color: #155724; margin-top: 0;'>✅ Expected Behavior</h4>";
				echo "<p>All pending records are sync metadata settings (last_sync_time, last_sync_status, last_pull_sync_*).</p>";
				echo "<p>These settings are updated AFTER the sync completes, so they remain PENDING until the next sync.</p>";
				echo "<p><strong>This is normal and expected behavior.</strong></p>";
				echo "</div>";
			} elseif ($other_count > 0) {
				echo "<div style='background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0;'>";
				echo "<h4 style='color: #856404; margin-top: 0;'>⚠️ Unexpected Settings</h4>";
				echo "<p>There are $other_count non-metadata settings that are PENDING.</p>";
				echo "<p>These should have been synced. Please investigate.</p>";
				echo "</div>";
			}
			
		} else {
			echo "<p style='color: green;'><strong>✅ No pending settings records found.</strong></p>";
		}
		
		echo "<hr>";
		echo "<p><a href='" . site_url('admin/sync_dashboard') . "'>← Back to Sync Dashboard</a></p>";
	}


	/**
	 * Tier 2 Pension Providers Management
	 * Manages CRUD operations for pension providers
	 */
	public function pension_providers($param1 = '', $param2 = '') {
		// Check login
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}

		// Handle CRUD operations
		if ($param1 == 'create') {
			// Validate input
			$this->form_validation->set_rules('provider_name', 'Provider Name', 'required|trim');
			$this->form_validation->set_rules('provider_code', 'Provider Code', 'required|trim|is_unique[pension_tier2_providers.provider_code]');
			
			if ($this->form_validation->run() == FALSE) {
				$ajax_data['message'] = 'failed';
				$ajax_data['errors'] = validation_errors();
				echo json_encode($ajax_data);
				return;
			}

			// Insert new provider
			$data = array(
				'provider_name' => $this->input->post('provider_name'),
				'provider_code' => $this->input->post('provider_code'),
				'description' => $this->input->post('description'),
				'provider_email' => $this->input->post('provider_email'),
				'provider_phone' => $this->input->post('provider_phone'),
				'is_active' => $this->input->post('is_active', TRUE) ? 1 : 0,
				'created_at' => date('Y-m-d H:i:s')
			);

			$this->db->insert('pension_tier2_providers', $data);

			$ajax_data['message'] = 'done';
			$ajax_data['route'] = 'pension_providers';
			echo json_encode($ajax_data);
			return;
		}

		if ($param1 == 'update') {
			$provider_id = $param2;

			// Validate input
			$this->form_validation->set_rules('provider_name', 'Provider Name', 'required|trim');
			
			// Check if provider_code is unique (excluding current record)
			$this->db->where('provider_code', $this->input->post('provider_code'));
			$this->db->where('provider_id !=', $provider_id);
			$existing = $this->db->get('pension_tier2_providers')->num_rows();
			
			if ($existing > 0) {
				$ajax_data['message'] = 'failed';
				$ajax_data['errors'] = 'Provider code already exists';
				echo json_encode($ajax_data);
				return;
			}

			// Update provider
			$data = array(
				'provider_name' => $this->input->post('provider_name'),
				'provider_code' => $this->input->post('provider_code'),
				'description' => $this->input->post('description'),
				'provider_email' => $this->input->post('provider_email'),
				'provider_phone' => $this->input->post('provider_phone'),
				'is_active' => $this->input->post('is_active', TRUE) ? 1 : 0,
				'updated_at' => date('Y-m-d H:i:s')
			);

			$this->db->where('provider_id', $provider_id);
			$this->db->update('pension_tier2_providers', $data);

			$ajax_data['message'] = 'done';
			$ajax_data['route'] = 'pension_providers';
			echo json_encode($ajax_data);
			return;
		}

		if ($param1 == 'toggle_status') {
			$provider_id = $param2;

			// Get current status
			$provider = $this->db->get_where('pension_tier2_providers', array('provider_id' => $provider_id))->row();
			
			// Toggle status
			$new_status = $provider->is_active == 1 ? 0 : 1;
			
			$this->db->where('provider_id', $provider_id);
			$this->db->update('pension_tier2_providers', array(
				'is_active' => $new_status,
				'updated_at' => date('Y-m-d H:i:s')
			));

			$ajax_data['message'] = 'done';
			$ajax_data['new_status'] = $new_status;
			echo json_encode($ajax_data);
			return;
		}

		if ($param1 == 'delete') {
			$provider_id = $param2;

			// Check if provider is assigned to any staff
			$this->db->where('tier2_provider_id', $provider_id);
			$teacher_count = $this->db->get('teacher')->num_rows();

			$this->db->where('tier2_provider_id', $provider_id);
			$admin_count = $this->db->get('admin')->num_rows();

			$this->db->where('tier2_provider_id', $provider_id);
			$staff_count = $this->db->get('non_teaching_staff')->num_rows();

			$total_assigned = $teacher_count + $admin_count + $staff_count;

			if ($total_assigned > 0) {
				$ajax_data['message'] = 'failed';
				$ajax_data['errors'] = "Cannot delete provider. It is assigned to $total_assigned staff member(s).";
				echo json_encode($ajax_data);
				return;
			}

			// Delete provider
			$this->db->where('provider_id', $provider_id);
			$this->db->delete('pension_tier2_providers');

			$ajax_data['message'] = 'done';
			$ajax_data['route'] = 'pension_providers';
			echo json_encode($ajax_data);
			return;
		}

		// Default: Show list view
		$page_data['page_name'] = 'pension_providers';
		$page_data['page_title'] = 'Tier 2 Pension Providers';
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Get single provider for editing (AJAX)
	 */
	public function pension_provider_get($provider_id) {
		$provider = $this->db->get_where('pension_tier2_providers', array('provider_id' => $provider_id))->row();
		echo json_encode($provider);
	}

	
	// ===================================
	// NOTIFICATION SYSTEM METHODS =========
	// ===================================
	
	/**
	 * Get notifications for current user
	 * 
	 * Returns JSON with notifications array and unread count
	 * for the notification polling system
	 * 
	 * Requirements: 3.3, 3.5, 3.9
	 * 
	 * @return void Outputs JSON response
	 */
	public function get_notifications() {
		// Clean any previous output and set JSON header
		if (ob_get_level()) ob_clean();
		header('Content-Type: application/json');
		
		// Get logged-in user ID from session
		$user_id = $this->session->userdata('admin_id');
		
		if (!$user_id) {
			echo json_encode(array(
				'status' => 'error',
				'message' => 'User not authenticated'
			));
			return;
		}
		
		// TEMPORARY FIX: Return empty notifications until model is updated to match table structure
		// The Notification_manager model expects columns (module, event_type, reference_id, read_status)
		// but the notifications table has (type, user_type, is_read) instead
		echo json_encode(array(
			'status' => 'success',
			'notifications' => array(),
			'unread_count' => 0
		));
		return;
		
		// TODO: Fix Notification_manager model to match actual notifications table structure
		// Original code commented out below:
		/*
		// Load Notification_manager model
		$this->load->model('Notification_manager');
		
		try {
			// Get user notifications (10 most recent)
			$notifications = $this->Notification_manager->get_user_notifications($user_id, 10, false);
			
			// Get unread count
			$unread_count = $this->Notification_manager->get_unread_count($user_id);
			
			// Return JSON response
			echo json_encode(array(
				'status' => 'success',
				'notifications' => $notifications,
				'unread_count' => $unread_count
			));
		} catch (Exception $e) {
			echo json_encode(array(
				'status' => 'error',
				'message' => 'Failed to fetch notifications: ' . $e->getMessage()
			));
		}
		*/
	}
	
	/**
	 * Mark single notification as read
	 * 
	 * Requirements: 3.5, 3.9
	 * 
	 * @return void Outputs JSON response
	 */
	public function mark_notification_read() {
		// Clean any previous output and set JSON header
		if (ob_get_level()) ob_clean();
		header('Content-Type: application/json');
		
		// Get notification ID from POST data
		$notification_id = $this->input->post('notification_id');
		
		// Get logged-in user ID from session
		$user_id = $this->session->userdata('admin_id');
		
		if (!$user_id) {
			echo json_encode(array(
				'status' => 'error',
				'message' => 'User not authenticated'
			));
			return;
		}
		
		if (!$notification_id) {
			echo json_encode(array(
				'status' => 'error',
				'message' => 'Notification ID is required'
			));
			return;
		}
		
		// Load Notification_manager model
		$this->load->model('Notification_manager');
		
		try {
			// Mark notification as read
			$result = $this->Notification_manager->mark_as_read($notification_id, $user_id);
			
			echo json_encode(array(
				'status' => $result ? 'success' : 'error',
				'message' => $result ? 'Notification marked as read' : 'Failed to mark notification as read'
			));
		} catch (Exception $e) {
			echo json_encode(array(
				'status' => 'error',
				'message' => 'Error: ' . $e->getMessage()
			));
		}
	}
	
	/**
	 * Mark all notifications as read for current user
	 * 
	 * Requirements: 3.5, 3.9
	 * 
	 * @return void Outputs JSON response
	 */
	public function mark_all_notifications_read() {
		// Get logged-in user ID from session
		$user_id = $this->session->userdata('admin_id');
		
		if (!$user_id) {
			echo json_encode(array(
				'status' => 'error',
				'message' => 'User not authenticated'
			));
			return;
		}
		
		// Load Notification_manager model
		$this->load->model('Notification_manager');
		
		try {
			// Mark all notifications as read
			$result = $this->Notification_manager->mark_all_as_read($user_id);
			
			echo json_encode(array(
				'status' => $result ? 'success' : 'error',
				'message' => $result ? 'All notifications marked as read' : 'Failed to mark notifications as read'
			));
		} catch (Exception $e) {
			echo json_encode(array(
				'status' => 'error',
				'message' => 'Error: ' . $e->getMessage()
			));
		}
	}
	
	/**
	 * Display notification settings page
	 * 
	 * Requirements: 2.1, 2.2, 2.7
	 * 
	 * @return void Loads notification settings view
	 */
	public function notification_settings() {
		// Get logged-in user ID from session
		$user_id = $this->session->userdata('admin_id');
		
		if (!$user_id) {
			redirect(base_url() . 'login', 'refresh');
			return;
		}
		
		// Load User_notification_preferences model
		$this->load->model('User_notification_preferences');
		
		// Get current SMS preference
		$sms_enabled = $this->User_notification_preferences->get_user_sms_preference($user_id);
		
		// Get phone number from admin table
		$user = $this->db->select('phone')->where('admin_id', $user_id)->get('admin')->row();
		$phone_number = $user ? $user->phone : '';
		
		// Set page data
		$page_data['page_name'] = 'notification_settings';
		$page_data['page_title'] = get_phrase('notification_settings');
		$page_data['sms_enabled'] = $sms_enabled;
		$page_data['phone_number'] = $phone_number;
		
		// Load view
		$this->load->view('backend/index', $page_data);
	}
	
	/**
	 * Update notification preferences
	 * 
	 * Requirements: 2.3, 2.4, 2.8
	 * 
	 * @return void Outputs JSON response
	 */
	public function update_notification_preferences() {
		// Get SMS enabled status from POST data
		$sms_enabled = $this->input->post('sms_enabled');
		
		// Get logged-in user ID from session
		$user_id = $this->session->userdata('admin_id');
		
		if (!$user_id) {
			echo json_encode(array(
				'success' => false,
				'message' => 'User not authenticated'
			));
			return;
		}
		
		// Convert to boolean
		$sms_enabled = ($sms_enabled === '1' || $sms_enabled === 'true' || $sms_enabled === true);
		
		// Load User_notification_preferences model
		$this->load->model('User_notification_preferences');
		
		try {
			// Update SMS preference
			$result = $this->User_notification_preferences->set_user_sms_preference($user_id, $sms_enabled);
			
			if ($result['success']) {
				echo json_encode(array(
					'success' => true,
					'message' => get_phrase('notification_preferences_updated_successfully')
				));
			} else {
				echo json_encode(array(
					'success' => false,
					'message' => $result['message']
				));
			}
		} catch (Exception $e) {
			echo json_encode(array(
				'success' => false,
				'message' => 'Error: ' . $e->getMessage()
			));
		}
	}

	/**
	 * PAYROLL FIELD CUSTOMIZATION API ENDPOINTS
	 * Database-driven field visibility preferences
	 */
	
	/**
	 * Get all payroll field preferences
	 * Returns: JSON array of {field_name, is_visible}
	 */
	public function get_payroll_field_preferences() {
		// Authentication check
		if (!$this->session->userdata('admin_login')) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Unauthorized access'
			]);
			return;
		}
		
		$this->db->select('field_name, is_visible');
		$query = $this->db->get('form_field_preferences');
		
		if ($query) {
			echo json_encode([
				'status' => 'success',
				'preferences' => $query->result_array()
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Failed to retrieve preferences'
			]);
		}
	}
	
	/**
	 * Save or update a single field preference
	 * POST parameters: fieldName, isVisible
	 */
	public function save_payroll_field_preference() {
		// Authentication check
		if (!$this->session->userdata('admin_login')) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Unauthorized access'
			]);
			return;
		}
		
		$fieldName = $this->input->post('fieldName');
		$isVisible = (int)$this->input->post('isVisible');
		
		// Define required fields that cannot be hidden
		$requiredFields = ['basicSalary', 'payrollMonth'];
		
		// Validate required field protection
		if (in_array($fieldName, $requiredFields) && $isVisible === 0) {
			echo json_encode([
				'status' => 'error',
				'message' => "Cannot hide required field: $fieldName"
			]);
			return;
		}
		
		// Define allowed fields for validation
		$allowedFields = [
			'basicSalary', 'payrollMonth', 'marketPremium', 'teachingAllowance',
			'responsibilityAllowance', 'extraClasses', 'ruralAllowance', 'otherAllowances',
			'petra', 'incomeTax', 'salaryAdvance', 'loans', 'welfare', 'gnat', 'otherDeductions'
		];
		
		// Validate field name
		if (!in_array($fieldName, $allowedFields)) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Invalid field name'
			]);
			return;
		}
		
		// Validate isVisible value
		if ($isVisible !== 0 && $isVisible !== 1) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Invalid visibility value'
			]);
			return;
		}
		
		// Use INSERT ... ON DUPLICATE KEY UPDATE for upsert operation
		$sql = "INSERT INTO form_field_preferences (field_name, is_visible) 
				VALUES (?, ?) 
				ON DUPLICATE KEY UPDATE is_visible = ?";
		
		$result = $this->db->query($sql, [$fieldName, $isVisible, $isVisible]);
		
		if ($result) {
			echo json_encode([
				'status' => 'success',
				'message' => 'Preference saved',
				'field_name' => $fieldName
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Database error: ' . $this->db->error()['message']
			]);
		}
	}
	
	/**
	 * Reset all field preferences to default (all visible)
	 * Truncates the form_field_preferences table
	 */
	public function reset_payroll_field_preferences() {
		// Authentication check
		if (!$this->session->userdata('admin_login')) {
			echo json_encode([
				'status' => 'error',
				'message' => 'Unauthorized access'
			]);
			return;
		}
		
		$this->db->truncate('form_field_preferences');
		
		// truncate() returns void, check if table is empty after truncate
		$count = $this->db->count_all('form_field_preferences');
		
		if ($count === 0) {
			echo json_encode([
				'status' => 'success',
				'message' => 'All preferences reset to default'
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Reset failed'
			]);
		}
	}
	
	/**
	 * Promotion Status Checker
	 * Shows students who haven't been promoted or repeated yet
	 * Accessible only to admin level 1 and 2
	 */
	public function promotion_status_checker() {
		// Check if user is admin
		if ($this->session->userdata('admin_login') != 1) {
			redirect(site_url('login'));
		}
		
		// Check admin level (only level 1 and 2 can access)
		$admin_id = $this->session->userdata('admin_id');
		$admin_level = $this->db->get_where('admin', array('admin_id' => $admin_id))->row()->level;
		
		if ($admin_level > 2) {
			$this->session->set_flashdata('error_message', 'You do not have permission to access this page.');
			redirect(site_url('admin/dashboard'));
		}
		
		// Load Head Teacher Remarks Model
		$this->load->model('Head_teacher_remarks_model');
		
		// Get current academic year and term
		$running_year = $this->db->get_where('settings', array('type' => 'running_year'))->row()->description;
		$running_term = $this->db->get_where('settings', array('type' => 'running_term'))->row()->description;
		
		// Get the last exam of the current term (exclude portfolio assessments)
		$last_exam = $this->db->where('year', $running_year)
			->where('term', $running_term)
			->where('category_id !=', '1')
			->order_by('date', 'DESC')
			->limit(1)
			->get('exam')
			->row();
		
		// Get all classes
		$classes = $this->db->get('class')->result_array();
		
		$unpromoted_data = array();
		
		foreach ($classes as $class) {
			// Get students enrolled in this class for current year/term
			$enrolled_students = $this->db->where('class_id', $class['class_id'])
				->where('year', $running_year)
				->where('term', $running_term)
				->where('mute', '0')
				->get('enroll')
				->result_array();
			
			if (empty($enrolled_students)) {
				continue; // Skip classes with no students
			}
			
			$unpromoted_students = array();
			
			foreach ($enrolled_students as $enrolled) {
				$student_id = $enrolled['student_id'];
				
				// Check if student has been promoted/repeated in enroll table for next period
				$next_term = ($running_term == '3') ? '1' : ($running_term + 1);
				
				// Calculate next year properly for year format "2025-2026"
				if ($running_term == '3') {
					$year_parts = explode('-', $running_year);
					$next_year = ($year_parts[0] + 1) . '-' . ($year_parts[1] + 1);
				} else {
					$next_year = $running_year;
				}
				
				$promoted_check = $this->db->where('student_id', $student_id)
					->where('year', $next_year)
					->where('term', $next_term)
					->get('enroll')
					->row();
				
				// If student not found in next period, they're unpromoted
				if (!$promoted_check) {
					$student_info = $this->db->get_where('student', array('student_id' => $student_id))->row_array();
					
					// Get exam statistics for this student
					$exam_stats = array(
						'total_subjects' => 0,
						'subjects_written' => 0,
						'average_percentage' => 0,
						'principal_remark' => 'N/A'
					);
					
					if ($last_exam) {
						// Get total subjects for this class
						$total_subjects = $this->db->where('class_id', $class['class_id'])
							->get('subject')
							->num_rows();
						
						// Get subjects with marks for this student
						$marks = $this->db->where('student_id', $student_id)
							->where('exam_id', $last_exam->exam_id)
							->where('class_id', $class['class_id'])
							->where('year', $running_year)
							->where('term', $running_term)
							->get('mark')
							->result_array();
						
						$subjects_written = 0;
						$total_marks_obtained = 0;
						$total_marks_possible = 0;
						
						foreach ($marks as $mark) {
							// Check if mark_obtained is not null and not empty
							if ($mark['mark_obtained'] !== null && $mark['mark_obtained'] !== '') {
								$subjects_written++;
								$total_marks_obtained += floatval($mark['mark_obtained']);
								// Safely convert mark_total to float, default to 0 if not numeric
								$mark_total_value = is_numeric($mark['mark_total']) ? floatval($mark['mark_total']) : 0;
								$total_marks_possible += $mark_total_value;
							}
						}
						
						// Calculate average percentage
						$average_percentage = 0;
						if ($total_marks_possible > 0) {
							$average_percentage = ($total_marks_obtained / $total_marks_possible) * 100;
							$average_percentage = round($average_percentage, 2);
						}
						
						// Get principal remark based on percentage
						$principal_remark = 'N/A';
						if ($average_percentage > 0) {
							$auto_head_remark = $this->Head_teacher_remarks_model->find_by_percentage($average_percentage);
							$principal_remark = $auto_head_remark ? $auto_head_remark->remark_text : 'No remark set for this range';
						}
						
						$exam_stats = array(
							'total_subjects' => $total_subjects,
							'subjects_written' => $subjects_written,
							'average_percentage' => $average_percentage,
							'principal_remark' => $principal_remark
						);
					}
					
					$student_info['exam_stats'] = $exam_stats;
					$unpromoted_students[] = $student_info;
				}
			}
			
			// Only add class to list if it has unpromoted students
			if (!empty($unpromoted_students)) {
				// Get class teacher details
				$teacher_id = $class['teacher_id'];
				$teacher_info = array();
				
				if ($teacher_id && $teacher_id > 0) {
					$teacher = $this->db->get_where('teacher', array('teacher_id' => $teacher_id))->row_array();
					if ($teacher) {
						$teacher_info = array(
							'name' => $teacher['name'],
							'email' => $teacher['email'],
							'phone' => $teacher['phone']
						);
					}
				}
				
				$unpromoted_data[] = array(
					'class' => $class,
					'teacher' => $teacher_info,
					'students' => $unpromoted_students,
					'count' => count($unpromoted_students)
				);
			}
		}
		
		$page_data['unpromoted_data'] = $unpromoted_data;
		$page_data['running_year'] = $running_year;
		$page_data['running_term'] = $running_term;
		$page_data['last_exam'] = $last_exam;
		$page_data['page_name'] = 'promotion_status_checker';
		$page_data['page_title'] = 'Promotion Status Checker';
		
		$this->load->view('backend/main', $page_data);
	}

	/**
	 * Load the import daily fee rates form into the global modal
	 */
	public function import_daily_fee_rates_form() {
		$this->load->view('backend/admin/import_daily_fee_rates_modal');
	}
	
	/**
	 * Get invoice preview data - which bill items apply to which classes
	 * Used for confirmation modal to show accurate per-class breakdown
	 */
	function get_invoice_preview_data() {
		$class_ids = $this->input->post('class_ids');
		$bill_items_data = $this->input->post('bill_items'); // Now contains {title, amount}
		
		if(empty($class_ids) || empty($bill_items_data)) {
			echo json_encode(['success' => false, 'message' => 'Missing data']);
			return;
		}
		
		$result = [];
		
		// For each class, determine which items apply
		foreach($class_ids as $class_id) {
			// Get class details
			$class_row = $this->db->get_where('class', ['class_id' => $class_id])->row();
			if(!$class_row) continue;
			
			$class_category = isset($class_row->category) ? $class_row->category : null;
			$class_name = $class_row->name . ' ' . $class_row->name_numeric;
			
			// Always get and append section name
			$section_row = $this->db->get_where('section', ['class_id' => $class_id])->row();
			if($section_row) {
				$class_name .= ' ' . $section_row->name;
			}
			
			$class_items = [];
			
			// Check each bill item
			foreach($bill_items_data as $item_data) {
				$title = $item_data['title'];
				$user_amount = floatval($item_data['amount']); // Amount from form input
				
				$bill_item = $this->db->get_where('bill_item', ['title' => $title])->row();
				if(!$bill_item) continue;
				
				$specific_class_ids = isset($bill_item->specific_class_ids) ? $bill_item->specific_class_ids : null;
				$bill_class_category = isset($bill_item->class_category) ? $bill_item->class_category : null;
				
				// Apply 3-tier filtering logic
				$applies = false;
				
				if(!empty($specific_class_ids)) {
					// Priority 1: Check specific class IDs
					$specific_classes = array_map('trim', explode(',', $specific_class_ids));
					if(in_array($class_id, $specific_classes)) {
						$applies = true;
					}
				} elseif(!empty($bill_class_category)) {
					// Priority 2: Check class category
					if($bill_class_category == $class_category) {
						$applies = true;
					}
				} else {
					// Priority 3: Global item (both NULL/empty)
					$applies = true;
				}
				
				if($applies) {
					$class_items[] = [
						'title' => $bill_item->title,
						'description' => $bill_item->description,
						'amount' => $user_amount // Use amount from form, not database
					];
				}
			}
			
			$result[] = [
				'class_id' => $class_id,
				'class_name' => $class_name,
				'items' => $class_items
			];
		}
		
		echo json_encode(['success' => true, 'classes' => $result]);
	}

	/**
	 * Payroll Statutory Settings Management Page
	 * 
	 * Allows admins to configure SSNIT, GETFund, NHIL and other statutory percentages
	 * Date: September 5, 2026
	 */
	public function payroll_statutory_settings() {
		// Check authentication
		if($this->session->userdata('admin_login') != 1)
			redirect(site_url('login'), 'refresh');
		
		// Load model
		$this->load->model('Payroll_statutory_model');
		
		// Get all settings
		$page_data['settings'] = $this->Payroll_statutory_model->get_all_settings_full();
		
		// Set page data for navigation
		$page_data['page_name'] = 'payroll_statutory_settings';
		$page_data['page_title'] = get_phrase('statutory_settings');
		
		// Load through main backend layout
		$this->load->view('backend/index', $page_data);
	}

	/**
	 * Update single statutory setting (AJAX)
	 * 
	 * @return JSON response
	 */
	public function payroll_statutory_update() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
			return;
		}
		
		// Check authentication
		if($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		// Load model
		$this->load->model('Payroll_statutory_model');
		
		// Get parameters
		$setting_id = $this->input->post('setting_id');
		$new_value = $this->input->post('new_value');
		$reason = $this->input->post('reason') ?: 'Administrative update';
		$admin_id = $this->session->userdata('login_user_id');
		
		// Validate
		if(empty($setting_id) || !is_numeric($new_value)) {
			echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
			return;
		}
		
		if($new_value < 0 || $new_value > 100) {
			echo json_encode(['status' => 'error', 'message' => 'Rate must be between 0 and 100']);
			return;
		}
		
		// Update setting
		$result = $this->Payroll_statutory_model->update_setting($setting_id, $new_value, $admin_id, $reason);
		
		if($result) {
			echo json_encode([
				'status' => 'success',
				'message' => 'Statutory rate updated successfully'
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Failed to update statutory rate'
			]);
		}
	}

	/**
	 * Bulk update statutory settings (AJAX)
	 * 
	 * @return JSON response
	 */
	public function payroll_statutory_update_bulk() {
		// Verify AJAX request
		if (!$this->input->is_ajax_request()) {
			echo json_encode(['status' => 'error', 'message' => 'Invalid request']);
			return;
		}
		
		// Check authentication
		if($this->session->userdata('admin_login') != 1) {
			echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
			return;
		}
		
		// Load model
		$this->load->model('Payroll_statutory_model');
		
		// Get parameters
		$changes_json = $this->input->post('changes');
		$reason = $this->input->post('reason') ?: 'Bulk administrative update';
		$admin_id = $this->session->userdata('login_user_id');
		
		// Validate
		if(empty($changes_json)) {
			echo json_encode(['status' => 'error', 'message' => 'Invalid parameters']);
			return;
		}
		
		$changes = json_decode($changes_json, true);
		if(!is_array($changes) || empty($changes)) {
			echo json_encode(['status' => 'error', 'message' => 'No changes provided']);
			return;
		}
		
		// Validate all changes before processing
		foreach($changes as $change) {
			// Validate required fields
			if(!isset($change['setting_id']) || !isset($change['new_value'])) {
				echo json_encode(['status' => 'error', 'message' => 'Invalid change format']);
				return;
			}
			
			// Validate numeric value
			if(!is_numeric($change['new_value'])) {
				echo json_encode(['status' => 'error', 'message' => 'Rate must be numeric']);
				return;
			}
			
			// Validate range
			if($change['new_value'] < 0 || $change['new_value'] > 100) {
				echo json_encode(['status' => 'error', 'message' => 'Rate must be between 0 and 100']);
				return;
			}
		}
		
		// Process each change
		$success_count = 0;
		foreach($changes as $change) {
			$result = $this->Payroll_statutory_model->update_setting(
				$change['setting_id'], 
				$change['new_value'], 
				$admin_id, 
				$reason
			);
			
			if($result) {
				$success_count++;
			}
		}
		
		if($success_count > 0) {
			echo json_encode([
				'status' => 'success',
				'message' => "Successfully updated {$success_count} statutory rate(s)"
			]);
		} else {
			echo json_encode([
				'status' => 'error',
				'message' => 'Failed to update statutory rates'
			]);
		}
	}

	/**
	 * Get statutory rates as JSON (for AJAX calls)
	 * 
	 * @return JSON response
	 */
	public function payroll_statutory_get_rates() {
		// Load model
		$this->load->model('Payroll_statutory_model');
		
		// Get rates
		$rates = $this->Payroll_statutory_model->get_all_settings();
		
		echo json_encode([
			'status' => 'success',
			'rates' => $rates
		]);
	}

	// ===================================
	/**
	 * Test GRA PAYE Calculation
	 * 
	 * Tests the payroll system's PAYE calculation against official GRA rates
	 * from the Revised Annual PAYE Schedule (2024).
	 * 
	 * URL: admin/test_gra_paye
	 */
	public function test_gra_paye() {
		// Load required libraries and models
		$this->load->library('Tax_calculator');
		$this->load->model('Payroll_statutory_model');
		
		// Get current SSNIT rates
		$rates = $this->Payroll_statutory_model->get_rates_array();
		$ssnit_tier1_employee_rate = $rates['ssnit_tier1_employee'] / 100;
		$ssnit_tier2_rate = $rates['ssnit_tier2'] / 100;
		
		// IMPORTANT: For PAYE calculation, only Tier 2 is deductible from taxable income
		// Tier 1 is NOT deductible according to GRA rules
		$tax_deductible_ssnit_rate = $ssnit_tier2_rate; // Only Tier 2
		
		// Total SSNIT deducted from employee salary (for payslip display)
		$total_ssnit_employee_rate = $ssnit_tier1_employee_rate + $ssnit_tier2_rate;
		
		// Test cases
		$test_cases = array(
			array(
				'name' => 'Entry Level - Monthly GH¢1,500',
				'monthly_basic' => 1500,
				'monthly_gross' => 1500,
				'description' => 'Entry level salary, should fall in lower tax brackets'
			),
			array(
				'name' => 'Mid Level - Monthly GH¢6,000',
				'monthly_basic' => 6000,
				'monthly_gross' => 6000,
				'description' => 'Common professional salary, used in GRA examples'
			),
			array(
				'name' => 'Senior Level - Monthly GH¢12,000',
				'monthly_basic' => 12000,
				'monthly_gross' => 12000,
				'description' => 'Senior professional salary'
			),
			array(
				'name' => 'Executive Level - Monthly GH¢25,000',
				'monthly_basic' => 25000,
				'monthly_gross' => 25000,
				'description' => 'Executive level salary, higher tax brackets'
			),
			array(
				'name' => 'Top Executive - Monthly GH¢50,000',
				'monthly_basic' => 50000,
				'monthly_gross' => 50000,
				'description' => 'Top tier salary, maximum tax rate'
			)
		);
		
		// Process test cases
		$results = array();
		foreach ($test_cases as $test) {
			$monthly_basic = $test['monthly_basic'];
			$monthly_gross = $test['monthly_gross'];
			
			// Calculate total SSNIT deducted from employee
			$monthly_ssnit_tier1 = $monthly_basic * $ssnit_tier1_employee_rate;
			$monthly_ssnit_tier2 = $monthly_basic * $ssnit_tier2_rate;
			$monthly_total_ssnit = $monthly_ssnit_tier1 + $monthly_ssnit_tier2;
			
			// For PAYE calculation: Only Tier 2 is deductible
			$monthly_ssnit_for_tax = $monthly_ssnit_tier2;
			
			// Calculate PAYE (using only Tier 2 deduction)
			$calculation = $this->tax_calculator->get_detailed_calculation($monthly_gross, $monthly_ssnit_for_tax);
			
			$results[] = array(
				'name' => $test['name'],
				'description' => $test['description'],
				'monthly_basic' => $monthly_basic,
				'monthly_gross' => $monthly_gross,
				'monthly_ssnit_tier1' => $monthly_ssnit_tier1,
				'monthly_ssnit_tier2' => $monthly_ssnit_tier2,
				'monthly_total_ssnit' => $monthly_total_ssnit,
				'monthly_ssnit_for_tax' => $monthly_ssnit_for_tax,
				'monthly_taxable' => $calculation['monthly_taxable'],
				'monthly_paye' => $calculation['monthly_paye'],
				'monthly_net' => $monthly_gross - $monthly_total_ssnit - $calculation['monthly_paye'],
				'annual_gross' => $calculation['annual_gross'],
				'annual_ssnit_tier1' => $monthly_ssnit_tier1 * 12,
				'annual_ssnit_tier2' => $monthly_ssnit_tier2 * 12,
				'annual_total_ssnit' => $monthly_total_ssnit * 12,
				'annual_taxable' => $calculation['annual_taxable'],
				'annual_paye' => $calculation['annual_paye'],
				'annual_net' => $calculation['annual_gross'] - ($monthly_total_ssnit * 12) - $calculation['annual_paye'],
				'breakdown' => $calculation['breakdown'],
				'effective_rate' => ($calculation['annual_paye'] / $calculation['annual_taxable']) * 100
			);
		}
		
		// Prepare page data
		$page_data['test_results'] = $results;
		$page_data['rates'] = $rates;
		$page_data['ssnit_tier1_rate'] = $ssnit_tier1_employee_rate * 100;
		$page_data['ssnit_tier2_rate'] = $ssnit_tier2_rate * 100;
		$page_data['total_ssnit_employee_rate'] = $total_ssnit_employee_rate * 100;
		$page_data['tax_deductible_ssnit_rate'] = $tax_deductible_ssnit_rate * 100;
		$page_data['page_name'] = 'test_gra_paye';
		$page_data['page_title'] = 'GRA PAYE Calculation Test';
		
		// Load view
		$this->load->view('backend/admin/test_gra_paye', $page_data);
	}

	// END OF ALL FUNCTIONS ================
	// ===================================
} // end of controller

	
