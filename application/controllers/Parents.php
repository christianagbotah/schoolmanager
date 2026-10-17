<?php
if (!defined('BASEPATH'))
    exit('No direct script access allowed');

// *************************************************************************
// *                                                                       *
// * Lisofts School Manager                                                 *
// * Copyright (c) Lightworld Technologies Limited. All Rights Reserved    *
// *                                                                       *
// *************************************************************************
// * @author : Lightworldtech                                              *
// * date        : August 11, 2019                                         *
// * description : For managing different levels of schools                *
// * Email   : softmail@lisofts.com                                         *
// * Website : https://www.lisofts.com                                      *
// * Support : https://www.support.lisofts.com                              *
// *                                                                       *
// *************************************************************************
// *                                                                       *
// * This software is furnished under a license and may be used and copied *
// * only  in  accordance  with  the  terms  of such  license and with the *
// * inclusion of the above copyright notice.                              *
// *                                                                       *
// *************************************************************************

class Parents extends CI_Controller
{


    function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');
        $this->load->model(array('Ajaxdataload_model' => 'ajaxload'));
        /*cache control*/

        $this->output->set_header('Last-Modified: ' . gmdate("D, d M Y H:i:s") . ' GMT');
        $this->output->set_header('Cache-Control: no-store, no-cache, must-revalidate, post-check=0, pre-check=0');
        $this->output->set_header('Pragma: no-cache');
        $this->output->set_header("Expires: Mon, 26 Jul 1997 05:00:00 GMT");


        //load form validation libray
        $this->load->library('form_validation');

        //load encryption library
        $this->load->library('encryption');

        if ($this->session->userdata('parent_login') != 1) {
            redirect(site_url('login'), 'refresh');
            return;
        }

        $this->enforce_parent_record_scope();
    }

    private function enforce_parent_record_scope() {
        $method = isset($this->router) ? (string) $this->router->fetch_method() : '';
        $student_segment_by_method = [
            'academic_syllabus' => 3,
            'marks' => 3,
            'student_marksheet_print_view' => 3,
            'student_results_sheet_print_view' => 3,
            'student_results_sheet_print_view_creche' => 3,
            'class_routine' => 3,
            'class_routine_print_view' => 5,
            'invoice' => 3,
            'attendance_report' => 3,
            'attendance_report_selector' => 3,
            'attendance_report_view' => 7,
            'attendance_report_print_view' => 7,
            'get_marksheet' => 5,
            'get_marksheet_raw_score' => 5,
        ];

        if (!isset($student_segment_by_method[$method])) {
            return;
        }

        $student_id = (int) $this->uri->segment($student_segment_by_method[$method]);
        if ($student_id > 0 && !$this->current_parent_owns_student($student_id)) {
            $this->deny_parent_record_access();
        }
    }

    private function current_parent_owns_student($student_id) {
        $parent_id = (int) $this->session->userdata('parent_id');
        if ($parent_id <= 0 || (int) $student_id <= 0) {
            return false;
        }
        return $this->db
            ->where('student_id', (int) $student_id)
            ->where('parent_id', $parent_id)
            ->count_all_results('student') > 0;
    }

    private function deny_parent_record_access() {
        $this->output->set_status_header(403);
        show_error('You are not authorised to access this student record.', 403);
    }

    /***default functin, redirects to login page if no admin logged in yet***/
    public function index()
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));
        if ($this->session->userdata('parent_login') == 1)
            redirect(site_url('parents/dashboard'));
    }

    /***ADMIN DASHBOARD***/
    function dashboard()
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));
        $page_data['page_name']  = 'dashboard';
        $page_data['page_title'] = get_phrase('parent_dashboard');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }


    /****MANAGE TEACHERS*****/
    function teacher_list($param1 = '', $param2 = '', $param3 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));
        if ($param1 == 'personal_profile') {
            $page_data['personal_profile']   = true;
            $page_data['current_teacher_id'] = $param2;
        }
        $page_data['teachers']   = $this->db->get('teacher')->result_array();
        $page_data['page_name']  = 'teacher';
        $page_data['page_title'] = get_phrase('manage_teacher');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }


    // ACADEMIC SYLLABUS
    function academic_syllabus($student_id = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));

        $page_data['page_name']  = 'academic_syllabus';
        $page_data['page_title'] = get_phrase('academic_syllabus');
        $page_data['student_id']   = $student_id;
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    function download_academic_syllabus($academic_syllabus_code)
    {
        $row = $this->db->get_where('academic_syllabus', array(
            'academic_syllabus_code' => $academic_syllabus_code
        ))->row();
        if (!$row) {
            show_404();
            return;
        }
        $parent_id = (int) $this->session->userdata('parent_id');
        $allowed = $this->db
            ->select('enroll.student_id')
            ->from('enroll')
            ->join('student', 'student.student_id = enroll.student_id')
            ->where('student.parent_id', $parent_id)
            ->where('enroll.class_id', (int) $row->class_id)
            ->where('enroll.year', $row->year)
            ->where('enroll.mute', '0')
            ->limit(1)
            ->get()
            ->num_rows() > 0;
        if (!$allowed) {
            $this->output->set_status_header(403);
            show_error('You are not authorised to download this syllabus.', 403);
            return;
        }
        $this->load->helper('download');
        $this->load->library('Private_file_storage', null, 'private_files');
        $key = $this->private_files->named_storage_key('syllabus', $row->academic_syllabus_code, $row->file_name);
        $path = $this->private_files->resolve($key);
        if ($path === null) {
            show_404();
            return;
        }
        force_download(basename($row->file_name), file_get_contents($path));
    }

    function subject($param1 = '', $param2 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));

        $parent_profile         = $this->db->get_where('parent', array(
            'parent_id' => $this->session->userdata('parent_id')
        ))->row();
        $parent_class_id        = $parent_profile->class_id;
        $page_data['subjects']   = $this->db->get_where('subject', array(
            'class_id' => $parent_class_id
        ))->result_array();
        $page_data['page_name']  = 'subject';
        $page_data['page_title'] = get_phrase('manage_subject');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }



    /****MANAGE EXAM MARKS*****/
    function marks($param1 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));

        $children_ids       = array();
        $children_of_parent = $this->db->get_where('student', array('parent_id' => $this->session->userdata('parent_id')))->result_array();
        foreach($children_of_parent as $row)
            array_push($children_ids, $row['student_id']);

        if(!in_array($param1, $children_ids)) {
            $this->session->set_flashdata('error_message', get_phrase('seems_this_student_is_not_your_child'));
            redirect(site_url('parents/dashboard'));
        }

        $child_name = $this->db->get_where('student', array('student_id' => $param1, 'parent_id' => $this->session->userdata('parent_id')))->row()->name;
        //check if a child owes fees
        $this->db->select_sum('due');
        $this->db->where('can_delete !=', 'trash');
        $sch_fee_due   = $this->db->get_where('invoice', array('student_id' => $param1, 'due  >' => '0'))->row()->due;
        
        // Get daily fees owed from daily_fee_wallet table
        $running_year = get_settings('running_year');
        $running_term = get_settings('running_term');
        
        $wallet = $this->db->get_where('daily_fee_wallet', array(
            'student_id' => $param1,
            'year' => $running_year,
            'term' => $running_term
        ))->row();
        
        $feedign_owe = 0;
        $classes_owe = 0;
        $transport_owe = 0;
        
        if ($wallet) {
            $feedign_owe = ($wallet->feeding_arrears ?? 0) + abs($wallet->feeding_balance ?? 0);
            $classes_owe = ($wallet->classes_arrears ?? 0) + abs($wallet->classes_balance ?? 0);
            $transport_owe = ($wallet->transport_arrears ?? 0) + abs($wallet->transport_balance ?? 0);
        }
        /////////////////////////
        $total_amount_due = $sch_fee_due + $classes_owe + $feedign_owe + $transport_owe; /////////////

        $this->db->where('can_delete !=', 'trash');
        $amount_due_array = $this->db->get_where('invoice', array('student_id' => $param1, 'due  >' => '0'))->result_array();

        $running_year = get_settings('running_year');
        $running_term = get_settings('running_term');

        $explode_running_year = explode('-', $running_year);
        $first_digit_running_year = $explode_running_year[0];

        if($total_amount_due > 0) {

            foreach($amount_due_array as $row2) {
                $invoice_year = $row2['year'];
                $explode_invoice_year = explode('-', $invoice_year);
                $first_digit_invoice_year = $explode_invoice_year[0];

                $invoice_term = $row2['term'];

                /**check and see if both running year and term are lesser than both invoice year and term
                ***If that is true, then it is probably a future billing, so allow else deny
                **/
                if($first_digit_invoice_year <= $first_digit_running_year && $invoice_term <= $running_term) {
                    //deny access to transcript
                    
                    $page_data['amount_due_array'] = $amount_due_array;
                    $page_data['page_title'] = 'Payment Status: Your child '. $child_name. ' owes. Clear the debts first';
                    $page_data['page']       = 'exam marks';
                    $page_data['student_id'] = $param1;
                    $this->load->view('backend/parent/payment_error', $page_data);                    
                }else{

                    //grant access
                    $class_id     = $this->db->get_where('enroll' , array(
                     'student_id' => $param1 , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description
                    ))->row()->class_id;
                    $section_id     = $this->db->get_where('enroll' , array('class_id' => $class_id, 
                        'student_id' => $param1 , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description
                    ))->row()->section_id;
                    $exam_id     = $this->db->get_where('mark' , array('class_id' => $class_id, 'section_id' => $section_id, 'student_id' => $param1, 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description
                    ))->row()->exam_id;

                    $student_name = $this->db->get_where('student' , array('student_id' => $param1))->row()->name;
                    $class_name   = $this->db->get_where('class' , array('class_id' => $class_id))->row()->name;
                    $class_name_numeric   = $this->db->get_where('class' , array('class_id' => $class_id))->row()->name_numeric;

                    $raw_score =  $this->db->get_where('settings' , array('type' => 'raw_score'))->row()->description;
                    if($raw_score == 'Yes') {
                        if($class_name == 'JHSS'){
                        $page_data['page_name'] = 'marks_raw_score';
                    }else{
                        $page_data['page_name'] = 'marks'; };
                    }elseif($raw_score == 'No') {
                        $page_data['page_name'] = 'marks';
                    }

                    $page_data['student_id'] = $param1;
                    $page_data['class_id']   =   $class_id;
                    $page_data['section_id'] =   $section_id;
                    //$page_data['exam_id']    =   $exam_id;
                    $page_data['page_title'] = get_phrase('view_resultsheet');
                    

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
            $this->load->view('backend/main', $page_data);
                }
            }

        }else{
                    $class_id     = $this->db->get_where('enroll' , array(
                     'student_id' => $param1 , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description
                    ))->row()->class_id;
                    $section_id     = $this->db->get_where('enroll' , array('class_id' => $class_id, 
                        'student_id' => $param1 , 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description
                    ))->row()->section_id;
                    $exam_id     = $this->db->get_where('mark' , array('class_id' => $class_id, 'section_id' => $section_id, 'student_id' => $param1, 'year' => $this->db->get_where('settings' , array('type' => 'running_year'))->row()->description, 'term' => $this->db->get_where('settings' , array('type' => 'running_term'))->row()->description
                    ))->row()->exam_id;

                    $student_name = $this->db->get_where('student' , array('student_id' => $param1))->row()->name;
                    $class_name   = $this->db->get_where('class' , array('class_id' => $class_id))->row()->name;
                    $class_name_numeric   = $this->db->get_where('class' , array('class_id' => $class_id))->row()->name_numeric;

                    $raw_score =  $this->db->get_where('settings' , array('type' => 'raw_score'))->row()->description;
                    if($raw_score == 'Yes') {
                        if($class_name == 'JHSS'){
                        $page_data['page_name'] = 'marks_raw_score';
                    }else{
                        $page_data['page_name'] = 'marks'; };
                    }elseif($raw_score == 'No') {
                        $page_data['page_name'] = 'marks';
                    }

                    $page_data['student_id'] = $param1;
                    $page_data['class_id']   =   $class_id;
                    $page_data['section_id'] =   $section_id;
                    //$page_data['exam_id']    =   $exam_id;
                    $page_data['page_title'] = get_phrase('view_resultsheet');
                    

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
                }
    }

    function student_marksheet_print_view($student_id , $exam_id) {
        if ($this->session->userdata('parent_login') != 1)
            redirect('login');

        // Fetch year, term, and sem from exam record instead of system settings
        $exam_record = $this->db->get_where('exam', array('exam_id' => $exam_id))->row();
        $running_year = $exam_record->year;
        $running_term = isset($exam_record->term) ? $exam_record->term : '';
        $running_sem = isset($exam_record->sem) ? $exam_record->sem : '';

        $terminal_report_style = $this->db->get_where('settings' , array('type'=>'terminal_report_style'))->row()->description;

        $class_id     = $this->db->get_where('enroll' , array(
            'student_id' => $student_id , 'year' => $running_year, 'term' => $running_term
        ))->row()->class_id;

        $section_id     = $this->db->get_where('enroll' , array(
            'student_id' => $student_id , 'year' => $running_year, 'term' => $running_term
        ))->row()->section_id;

        $class_name   = $this->db->get_where('class' , array('class_id' => $class_id))->row()->name;

        $page_data['student_id'] =   $student_id;
        $page_data['class_id']   =   $class_id;
        $page_data['section_id'] =   $section_id;
        $page_data['exam_id']    =   $exam_id;
        $page_data['running_year'] = $running_year;
        $page_data['running_term'] = $running_term;
        $page_data['running_sem'] = $running_sem;

        //load the chosen exam report style
                
        if($terminal_report_style == 'style_1') {
            $this->load->view('backend/admin/student_marksheet_print_view', $page_data);
        } elseif($terminal_report_style == 'style_2') {
            $this->load->view('backend/admin/student_marksheet_print_view_2', $page_data);
        } else {
            $this->load->view('backend/admin/student_marksheet_print_view_3', $page_data);
        }
        
    }

    function student_results_sheet_print_view($student_id, $exam_id, $class_id, $term, $year) {
        //if ($this->session->userdata('admin_login') != 1)
        //redirect(site_url('login'));

        //enable database cache
        //$this->db->cache_on();

        $section_id = $this->db->get_where('enroll', array(
            'student_id' => $student_id, 'mute' => '0', 'year' => $year, 'class_id' => $class_id,
        ))->row()->section_id;

        $class_name = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
        $class_name_numeric = $this->db->get_where('class', array('class_id' => $class_id))->row()->name_numeric;

        $page_data['student_id'] = $student_id;
        $page_data['class_id'] = $class_id;
        $page_data['section_id'] = $section_id;
        $page_data['exam_id'] = $exam_id;

        $page_data['term'] = $term;

        $page_data['exam_rows'] = $this->db->get_where('mark', array('class_id' => $data_page['class_id'], 'exam_id' => $data_page['exam_id'], 'year' => $data_page['year'], 'term' => $data_page['term'], 'student_id' => $data_page['student_id']))->num_rows();

        $page_data['year'] = $year;

        if ($exam_id != '' || $exam_id != '' && $class_id != "" || $class_id != "" && $section_id != '' || $section_id != '') {
            $raw_score = $this->db->get_where('settings', array('type' => 'raw_score'))->row()->description;

            $terminal_report_style = $this->db->get_where('settings' , array('type'=>'terminal_report_style'))->row()->description;

            if ($raw_score == 'Yes') {
                if ($class_name == 'JHSS') {
                    $this->load->view('backend/admin/student_raw_score_results_sheet_print_view', $page_data);
                } else {
                    //load the chosen exam report style
                
                    if($terminal_report_style == 'style_1') {
                        $this->load->view('backend/admin/student_marksheet_bulk_print_view', $page_data);
                    } elseif($terminal_report_style == 'style_2') {
                        $this->load->view('backend/admin/student_marksheet_bulk_print_view_2', $page_data);
                    } else {
                        $this->load->view('backend/admin/student_marksheet_bulk_print_view_3', $page_data);
                    }
                }
            } elseif ($raw_score == 'No') {
                //load the chosen exam report style
                
                if($terminal_report_style == 'style_1') {
                    $this->load->view('backend/admin/student_marksheet_bulk_print_view', $page_data);
                } elseif($terminal_report_style == 'style_2') {
                    $this->load->view('backend/admin/student_marksheet_bulk_print_view_2', $page_data);
                } else {
                    $this->load->view('backend/admin/student_marksheet_bulk_print_view_3', $page_data);
                }
            }

        } else {
            $this->session->set_flashdata('error_message', get_phrase('data_not_found!'));
            redirect(site_url('admin/student_results_sheet'), 'refreh');
        }
    }

    function student_results_sheet_print_view_creche($student_id , $exam_id, $class_id, $term, $year) {
        if ($this->session->userdata('teacher_login') != 1)
            redirect(site_url('login'));

        //enable database cache
        //$this->db->cache_on();

        $section_id     = $this->db->get_where('enroll' , array(
            'student_id' => $student_id , 'mute' => '0', 'year' => $year, 'term' => $term, 'class_id' => $class_id
        ))->row()->section_id;

        $class_name   = $this->db->get_where('class' , array('class_id' => $class_id))->row()->name;
        $class_name_numeric   = $this->db->get_where('class' , array('class_id' => $class_id))->row()->name_numeric;

        $page_data['student_id'] =   $student_id;
        $page_data['class_id']   =   $class_id;
        $page_data['section_id'] =   $section_id;
        $page_data['exam_id']    =   $exam_id;
        $page_data['term']       =   $term;
        $page_data['year']       =   $year;

        

        if($exam_id != '' || $exam_id != '' && $class_id != "" || $class_id != "" && $section_id != '' || $section_id != '') {

                $this->load->view('backend/admin/student_results_sheet_print_view_creche', $page_data);
        }else{
            $this->session->set_flashdata('error_message', get_phrase('data_not_found!'));
            redirect(site_url('teacher/student_results_sheet'), 'refreh');
        }
    } //eend of creche


    /**********MANAGING CLASS ROUTINE******************/
    function class_routine($param1 = '', $param2 = '', $param3 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));

        $page_data['student_id'] = $param1;
        $page_data['page_name']  = 'class_routine';
        $page_data['page_title'] = get_phrase('manage_class_time_table');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    function class_routine_print_view($class_id , $section_id, $student_id)
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect('login');
        $page_data['class_id']   =   $class_id;
        $page_data['section_id'] =   $section_id;
        $page_data['student_id'] =   $student_id;
        $this->load->view('backend/parent/class_routine_print_view' , $page_data);
    }

    /******MANAGE BILLING / INVOICES WITH STATUS*****/
    function invoice($student_id = '' , $param1 = '', $param2 = '', $param3 = '')
    {
        $page_data['student_id'] = (int) $student_id;
        $page_data['page_name']  = 'invoice';
        $page_data['page_title'] = get_phrase('manage_invoice/payment');
        $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    function book($param1 = '', $param2 = '', $param3 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect('login');

        $page_data['books']      = $this->db->get('book')->result_array();
        $page_data['page_name']  = 'book';
        $page_data['page_title'] = get_phrase('manage_library_books');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);

    }
    /**********MANAGE TRANSPORT / VEHICLES / ROUTES********************/
    function transport($param1 = '', $param2 = '', $param3 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect('login');

        $page_data['transports'] = $this->db->get('transport')->result_array();
        $page_data['page_name']  = 'transport';
        $page_data['page_title'] = get_phrase('manage_transport');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);

    }
    /**********MANAGE DORMITORY / HOSTELS / ROOMS ********************/
    function dormitory($param1 = '', $param2 = '', $param3 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect('login');

        $page_data['dormitories'] = $this->db->get('dormitory')->result_array();
        $page_data['page_name']   = 'dormitory';
        $page_data['page_title']  = get_phrase('manage_dormitory');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);

    }

    /**********WATCH NOTICEBOARD AND EVENT ********************/
    function noticeboard($param1 = '', $param2 = '', $param3 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect('login');

        $page_data['notices']    = $this->db->get_where('noticeboard',array('status'=>1))->result_array();
        $page_data['page_name']  = 'noticeboard';
        $page_data['page_title'] = get_phrase('noticeboard');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);

    }

    /**********MANAGE DOCUMENT / home work FOR A SPECIFIC CLASS or ALL*******************/
    function document($do = '', $document_id = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect('login');

        $page_data['page_name']  = 'manage_document';
        $page_data['page_title'] = get_phrase('manage_documents');
        $page_data['documents']  = $this->db->get('document')->result_array();
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    /* private messaging */

    function message($param1 = 'message_home', $param2 = '', $param3 = '') {
        if ($this->session->userdata('parent_login') != 1)
            redirect(base_url());
        if ($param1 == 'send_new') {
            $attachment = $this->crud_model->upload_private_message_attachment();
            if (empty($attachment['status'])) {
                $this->session->set_flashdata('error_message', $attachment['message']);
                redirect(site_url('parents/message/message_new'));
                return;
            }
            $message_thread_code = $this->crud_model->send_new_private_message($attachment);
            if (!$message_thread_code) {
                $this->session->set_flashdata('error_message', 'Message could not be sent.');
                redirect(site_url('parents/message/message_new'));
                return;
            }
            $this->session->set_flashdata('flash_message', get_phrase('message_sent!'));
            redirect(site_url('parents/message/message_read/'. $message_thread_code));
        }

        if ($param1 == 'send_reply') {
            if (!$this->crud_model->is_message_thread_participant($param2)) {
                show_error('Message thread not found or access denied.', 403);
                return;
            }
            $attachment = $this->crud_model->upload_private_message_attachment();
            if (empty($attachment['status'])) {
                $this->session->set_flashdata('error_message', $attachment['message']);
                redirect(site_url('parents/message/message_read/' . $param2));
                return;
            }
            $sent = $this->crud_model->send_reply_message($param2, $attachment);
            if (!$sent) {
                $this->session->set_flashdata('error_message', 'Message could not be sent.');
                redirect(site_url('parents/message/message_read/' . $param2));
                return;
            }  //$param2 = message_thread_code
            $this->session->set_flashdata('flash_message', get_phrase('message_sent!'));
            redirect(site_url('parents/message/message_read/'. $param2));
        }

        if ($param1 == 'message_read') {
            if (!$this->crud_model->is_message_thread_participant($param2)) {
                show_error('Message thread not found or access denied.', 403);
                return;
            }
            $page_data['current_message_thread_code'] = $param2;
            $this->crud_model->mark_thread_messages_read($param2);
        }

         if ($param1 == 'delete') {
            if (!$this->crud_model->delete_private_message_thread($param2)) {
                show_error('Message thread not found or access denied.', 403);
                return;
            }
            $this->session->set_flashdata('flash_message' , get_phrase('data_deleted'));
            redirect(site_url('parents/message'));
        }

        $page_data['message_inner_page_name']   = $param1;
        $page_data['page_name']                 = 'message';
        $page_data['page_title']                = get_phrase('private_messaging');
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    //GROUP MESSAGE
    function group_message($param1 = "group_message_home", $param2 = "") {
        if ($this->session->userdata('parent_login') != 1) {
            redirect(site_url('login'), 'refresh');
            return;
        }

        $base_url = 'parents/group_message';
        if ($param1 === 'group_message_read') {
            if (!$this->crud_model->is_group_thread_participant($param2)) {
                $this->session->set_flashdata('error_message', 'You do not have access to that group.');
                redirect(site_url($base_url)); return;
            }
            $page_data['current_message_thread_code'] = trim((string)$param2);
        }
        if ($param1 === 'send_reply') {
            if (strtoupper($this->input->method()) !== 'POST' || !$this->crud_model->is_group_thread_participant($param2)) {
                $this->session->set_flashdata('error_message', 'You do not have access to that group.'); redirect(site_url($base_url)); return;
            }
            $upload = $this->crud_model->upload_group_message_attachment();
            if (empty($upload['status'])) {
                $this->session->set_flashdata('error_message', $upload['message']); redirect(site_url($base_url.'/group_message_read/'.$param2)); return;
            }
            $ok = $this->crud_model->send_reply_group_message($param2, $upload);
            $this->session->set_flashdata($ok ? 'flash_message' : 'error_message', $ok ? get_phrase('message_sent!') : 'Message could not be sent.'); redirect(site_url($base_url.'/group_message_read/'.$param2)); return;
        }
        if ($param1 === 'delete' || $param1 === 'leave') {
            if (strtoupper($this->input->method()) !== 'POST') {
                $this->output->set_status_header(405)->set_content_type('application/json')->set_output(json_encode(['status'=>'error','message'=>'POST request required']));
                return;
            }
            $ok = $this->crud_model->leave_group_thread($param2);
            $this->output->set_content_type('application/json')->set_output(json_encode([
                'status' => $ok ? 'success' : 'error',
                'message' => $ok ? 'You left the group.' : 'Unable to leave this group.'
            ]));
            return;
        }

        $allowed_views = ['group_message_home', 'group_message_read'];
        $page_data['message_inner_page_name'] = in_array($param1, $allowed_views, true) ? $param1 : 'group_message_home';
        $page_data['group_messages'] = $this->crud_model->get_group_threads_for_current_user();
        $page_data['page_name'] = 'group_message';
        $page_data['page_title'] = get_phrase('group_messaging');
        $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    /******MANAGE OWN PROFILE AND CHANGE PASSWORD***/
    function manage_profile($param1 = '', $param2 = '', $param3 = '')
    {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));
        if ($param1 == 'update_profile_info') {
            $data['name']        = strtoupper($this->input->post('name'));
            $data['email']       = strtolower($this->input->post('email'));

            $this->load->helper('email');
              if(!valid_email($data['email'])) {
                $this->session->set_flashdata('error_message' , 'Invalid Email Found!');
                redirect(site_url('parent/manage_profile'));
              }
            $validation = email_validation_for_edit($data['email'], $this->session->userdata('parent_id'), 'parent');
            if ($validation == 1) {
                $this->db->where('parent_id', $this->session->userdata('parent_id'));
                $this->db->update('parent', $data);
                $this->session->set_flashdata('flash_message', get_phrase('account_updated'));
            }
            else{
                $this->session->set_flashdata('error_message', get_phrase('this_email_id_is_not_available'));
            }
            redirect(site_url('parents/manage_profile/'));
        }
        if ($param1 == 'change_password') {
            $data['password']             = $this->input->post('password');
            $data['new_password']         = password_hash($this->input->post('new_password'), PASSWORD_BCRYPT);
            $data['confirm_new_password'] = $this->input->post('confirm_new_password');
            
            $current_password = $this->db->get_where('parent', array(
                'parent_id' => $this->session->userdata('parent_id')
            ))->row()->password;
            if (password_verify($data['password'], $current_password) == 1 && password_verify($data['confirm_new_password'], $data['new_password']) == 1) {
                $this->db->where('parent_id', $this->session->userdata('parent_id'));
                $this->db->update('parent', array(
                    'password' => $data['new_password']
                ));
                $this->session->set_flashdata('flash_message', get_phrase('password_updated_successfully'));
            } else {
                $this->session->set_flashdata('error_message', get_phrase('password_mismatch!'));
            }
            redirect(site_url('parents/manage_profile/'));
        }
        $page_data['page_name']  = 'manage_profile';
        $page_data['page_title'] = get_phrase('manage_profile');
        $page_data['edit_data']  = $this->db->get_where('parent', array(
            'parent_id' => $this->session->userdata('parent_id')
        ))->result_array();
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

  function attendance_report($student_id = ""){
    if ($student_id != "") {
      $student_name = $this->db->get_where('student', array('student_id' => $student_id))->row()->name;
      $page_data['student_id']        = $student_id;
      $page_data['month']             = date('m');
      $page_data['page_name']         = 'attendance_report';
      $page_data['page_title']        = get_phrase('attendance_report_of_') . ' ' . $student_name . ' : ';
      

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }
  }
  function attendance_report_selector($student_id = "")
  {
      if($student_id != ""){
        $running_year       =   $this->db->get_where('settings' , array('type'=>'running_year'))->row()->description;
        //$sessional_year_array = explode("-", $running_year);
        $sessional_year = $this->input->post('sessional_year');
        $array = array(
          'student_id' => $student_id,
          'year'       => $sessional_year
        );
        $class_id               = $this->db->get_where('enroll', $array)->row()->class_id;
        $section_id             = $this->db->get_where('enroll', $array)->row()->section_id;
        $data['class_id']       = $class_id;
        $data['section_id']     = $section_id;
        $data['month']          = $this->input->post('month');
        $data['sessional_year'] = $sessional_year;
        $data['student_id']     = $student_id;
        //print_r($data);
        redirect(site_url('parents/attendance_report_view/' . $data['class_id'] . '/' . $data['section_id'] . '/' . $data['month'] . '/' . $data['sessional_year'] .'/'.$data['student_id']));
      }
  }


  function attendance_report_view($class_id = '', $section_id = '', $month = '', $sessional_year = '', $student_id = '')
  {
      if($this->session->userdata('parent_login')!=1)
         redirect(site_url('login') );
     $student_name = $this->db->get_where('student', array('student_id' => $student_id))->row()->name;
     $class_name                     = $this->db->get_where('class', array('class_id' => $class_id))->row()->name;
     $section_name                   = $this->db->get_where('section', array('section_id' => $section_id))->row()->name;
     $page_data['student_id']        = $student_id;
     $page_data['class_id']          = $class_id;
     $page_data['section_id']        = $section_id;
     $page_data['month']             = $month;
     $page_data['sessional_year']    = $sessional_year;
     $page_data['page_name']         = 'attendance_report_view';
     $page_data['page_title']        = get_phrase('attendance_report_of') . ' '.$student_name;
     

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
  }
  function attendance_report_print_view($class_id ='' , $section_id = '' , $month = '', $sessional_year = '', $student_id = '') {
       if ($this->session->userdata('parent_login') != 1)
         redirect(base_url());

     $page_data['class_id']          = $class_id;
     $page_data['section_id']        = $section_id;
     $page_data['month']             = $month;
     $page_data['sessional_year']    = $sessional_year;
     $page_data['student_id']        = $student_id;
     $this->load->view('backend/parent/attendance_report_print_view' , $page_data);
 }

    function get_teachers() {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));

        $columns = array(
            0 => 'teacher_id',
            1 => 'photo',
            2 => 'name',
            3 => 'email',
            4 => 'phone',
            5 => 'teacher_id'
        );

        $limit = $this->input->post('length');
        $start = $this->input->post('start');
        $order = $columns[$this->input->post('order')[0]['column']];
        $dir   = $this->input->post('order')[0]['dir'];

        $totalData = $this->ajaxload->all_teachers_count();
        $totalFiltered = $totalData;

        if(empty($this->input->post('search')['value'])) {            
            $teachers = $this->ajaxload->all_teachers($limit,$start,$order,$dir);
        }
        else {
            $search = $this->input->post('search')['value']; 
            $teachers =  $this->ajaxload->teacher_search($limit,$start,$search,$order,$dir);
            $totalFiltered = $this->ajaxload->teacher_search_count($search);
        }

        $data = array();
        if(!empty($teachers)) {
            foreach ($teachers as $row) {

                $photo = '<img src="'.$this->crud_model->get_image_url('teacher', $row->teacher_id, $row->sex).'" class="img-circle" width="30" />';

                $nestedData['teacher_id'] = $row->teacher_id;
                $nestedData['photo'] = $photo;
                $nestedData['name'] = $row->name;
                $nestedData['email'] = '<a href="mailto:'.$row->email.'">'.$row->email.'</a>';
                $nestedData['phone'] = $row->phone;
                
                $data[] = $nestedData;
            }
        }
          
        $json_data = array(
            "draw"            => intval($this->input->post('draw')),  
            "recordsTotal"    => intval($totalData),  
            "recordsFiltered" => intval($totalFiltered), 
            "data"            => $data   
        );
            
        echo json_encode($json_data);
    }

    function get_books() {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));

        $columns = array(
            0 => 'book_id',
            1 => 'name',
            2 => 'author',
            3 => 'description',
            4 => 'price',
            5 => 'class',
            6 => 'download',
            7 => 'book_id'
        );

        $limit = $this->input->post('length');
        $start = $this->input->post('start');
        $order = $columns[$this->input->post('order')[0]['column']];
        $dir   = $this->input->post('order')[0]['dir'];

        $totalData = $this->ajaxload->all_books_count();
        $totalFiltered = $totalData;

        if(empty($this->input->post('search')['value'])) {            
            $books = $this->ajaxload->all_books($limit,$start,$order,$dir);
        }
        else {
            $search = $this->input->post('search')['value']; 
            $books =  $this->ajaxload->book_search($limit,$start,$search,$order,$dir);
            $totalFiltered = $this->ajaxload->book_search_count($search);
        }

        $data = array();
        if(!empty($books)) {
            foreach ($books as $row) {
                if ($row->file_name == null)
                    $download = '';
                else
                    $download = '<a href="'.site_url("uploads/document/$row->file_name").'" class="btn btn-blue btn-icon icon-left"><i class="entypo-download"></i>'.get_phrase('download').'</a>';

                $nestedData['book_id'] = $row->book_id;
                $nestedData['name'] = $row->name;
                $nestedData['author'] = $row->author;
                $nestedData['description'] = $row->description;
                $nestedData['price'] = $row->price;
                $nestedData['class'] = $this->db->get_where('class', array('class_id' => $row->class_id))->row()->name.' '.$this->db->get_where('class', array('class_id' => $row->class_id))->row()->name_numeric;
                $nestedData['download'] = $download;
                
                $data[] = $nestedData;
            }
        }
          
        $json_data = array(
            "draw"            => intval($this->input->post('draw')),  
            "recordsTotal"    => intval($totalData),  
            "recordsFiltered" => intval($totalFiltered), 
            "data"            => $data   
        );
            
        echo json_encode($json_data);
    }

    //get marksheet for each student based on the selected year and term
    function get_marksheet($year, $term, $student_id, $exam_id='') {
        $data['year']  = $year;
        $data['term']  = $term;
        $data['student_id3']    = $student_id;
        $data['exam_id3']    = $exam_id;

        $this->load->view('backend/parent/get_marksheet', $data);

    }

    //get marksheet raw score for each student based on the selected year and term
    function get_marksheet_raw_score($year, $term, $student_id, $exam_id='') {
        $data['year']  = $year;
        $data['term']  = $term;
        $data['student_id3']    = $student_id;
        $data['exam_id3']    = $exam_id;

        $this->load->view('backend/parent/get_marksheet_raw_score', $data);

    }

    //payment via mobile money modal launcher


    function class_master() {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));
        $page_data['page_name'] = 'class_masters';
        $page_data['page_title'] = 'Class Master';
        

            $page_data['account_type'] = $this->session->userdata('login_type');
                     $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);

    }

    function subject_teacher($param1 = '') {
        if ($this->session->userdata('parent_login') != 1)
            redirect(site_url('login'));
        

        if($param1 == 'search') {
           
            $page_data['filtered_year'] = $this->input->post('year');
            $page_data['filtered_term'] = $this->input->post('term');
            
            $this->load->view('backend/parent/get_subject_teacher', $page_data);

        } else {
            $page_data['page_name'] = 'subject_teachers';
            $page_data['page_title'] = 'Subject Teacher';

            $page_data['filtered_year'] = get_settings('running_year');
            $page_data['filtered_term'] = get_settings('running_term');

            $page_data['account_type'] = $this->session->userdata('login_type');
            $this->load->view('backend/main', $page_data);
        }
    }

    //all children
    function children_list() {

        $data = $this->input->post('data');


        $page_data['allChildren'] = $data;
        $page_data['page_name'] = 'all_children';
        $page_data['page_title'] = 'All Children';
        $page_data['account_type'] = $this->session->userdata('login_type');

        $this->load->view('backend/parent/all_children', $page_data);
    }

    //get channel logo for momo transaction
}
