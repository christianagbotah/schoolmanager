<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Discount extends CI_Controller {

    public function __construct() {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');

        if($this->session->userdata('admin_login') != 1) {
            redirect(site_url('login'), 'refresh');
            exit;
        }
    }

    public function index() {
        $page_data['page_name'] = 'discount_management';
        $page_data['page_title'] = 'Discount Management';
        $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    public function get_categories() {
        $categories = $this->db->where('is_active', 1)->get('discount_categories')->result();
        echo json_encode($categories);
    }

    public function get_types_by_category($category_id) {
        $types = $this->db->where('category_id', $category_id)->where('is_active', 1)->order_by('name', 'ASC')->get('discount_types')->result();
        echo json_encode($types);
    }

    public function get_students() {
        $running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
        $running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;

        $students = $this->db->select('s.student_id, s.name, s.student_code')->from('student s')->join('enroll e', 's.student_id = e.student_id')->where('e.year', $running_year)->where('e.term', $running_term)->where('s.mute', 0)->order_by('s.name', 'ASC')->get()->result();
        echo json_encode($students);
    }

    public function create() {
        $this->output->set_status_header(410)->set_content_type('application/json')->set_output(json_encode([
            'status' => 'error',
            'message' => 'This legacy financial action is retired. Use Finance > Discount Approvals / Apply Discount so invoice changes follow the audited approval workflow.'
        ]));
    }

    public function approve() {
        $this->output->set_status_header(410)->set_content_type('application/json')->set_output(json_encode([
            'status' => 'error',
            'message' => 'This legacy financial action is retired. Use Finance > Discount Approvals / Apply Discount so invoice changes follow the audited approval workflow.'
        ]));
    }

    public function reject() {
        $this->output->set_status_header(410)->set_content_type('application/json')->set_output(json_encode([
            'status' => 'error',
            'message' => 'This legacy financial action is retired. Use Finance > Discount Approvals / Apply Discount so invoice changes follow the audited approval workflow.'
        ]));
    }

    public function get_pending_discounts() {
        $current_user_id = $this->session->userdata('login_user_id');
        $user = $this->db->get_where('admin', ['admin_id' => $current_user_id])->row();

        if(!$user || $user->level != 1) {
            echo json_encode([]);
            return;
        }

        $discounts = $this->db->select('id.*, s.name as student_name, s.student_code, a.name as created_by_name')->from('invoice_discounts id')->join('student s', 'id.student_id = s.student_id')->join('admin a', 'id.created_by = a.admin_id')->where('id.status', 'pending')->order_by('id.created_at', 'DESC')->get()->result();
        echo json_encode($discounts);
    }

    public function unassign() {
        $this->output->set_status_header(410)->set_content_type('application/json')->set_output(json_encode([
            'status' => 'error',
            'message' => 'This legacy financial action is retired. Use Finance > Discount Approvals / Apply Discount so invoice changes follow the audited approval workflow.'
        ]));
    }

    public function profiles() {
        $running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
        $running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;

        $page_data['profiles'] = $this->db->where('is_active', 1)->get('discount_profiles')->result_array();
        $page_data['running_year'] = $running_year;
        $page_data['running_term'] = $running_term;
        $page_data['page_name'] = 'discount_profiles';
        $page_data['page_title'] = 'Discount Profiles';
        $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    public function assign_students() {
        $page_data['profiles'] = $this->db->where('is_active', 1)->get('discount_profiles')->result_array();
        $page_data['running_year'] = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
        $page_data['running_term'] = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;
        $page_data['page_name'] = 'assign_student_discounts';
        $page_data['page_title'] = 'Assign Student Discounts';
        $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }

    public function do_assign() {
        if(strtoupper($this->input->method()) !== 'POST') {
            return $this->output->set_status_header(405)->set_content_type('application/json')->set_output(json_encode(['status'=>'error','message'=>'POST request required']));
        }
        $student_ids = array_values(array_filter(array_map('intval',(array)$this->input->post('student_ids'))));
        $profile_ids = array_values(array_filter(array_map('intval',(array)$this->input->post('profile_ids'))));
        $year = trim((string)$this->input->post('year'));
        $term = (int)$this->input->post('term');
        $current_user_id = (int)$this->session->userdata('login_user_id');
        $user = $this->db->get_where('admin', ['admin_id'=>$current_user_id])->row();
        $is_super_admin = ($user && (int)$user->level === 1);

        if(!$student_ids || !$profile_ids || $year === '' || !$term) {
            echo json_encode(['status'=>'error','message'=>'Please select students, profiles, academic year and term']);
            return;
        }
        $profiles = $this->db->where_in('profile_id',$profile_ids)->where('is_active',1)->get('discount_profiles')->result_array();
        if(count($profiles)!==count($profile_ids)) {
            echo json_encode(['status'=>'error','message'=>'One or more selected discount profiles are invalid or inactive']);
            return;
        }
        $profiles_by_id=[]; foreach($profiles as $profile) $profiles_by_id[(int)$profile['profile_id']]=$profile;

        $assigned=0;
        foreach($student_ids as $student_id) {
            foreach($profile_ids as $profile_id) {
                $profile=$profiles_by_id[$profile_id];
                $existing=$this->db->where('student_id',$student_id)->where('profile_id',$profile_id)->where('year',$year)->where('term',$term)->where_in('status',['pending','approved','pending_removal'])->order_by('assignment_id','DESC')->get('student_discount_assignments')->row();
                if($existing) continue;
                $this->db->insert('student_discount_assignments',[
                    'student_id'=>$student_id,'profile_id'=>$profile_id,'discount_category'=>$profile['discount_category'],'discount_method'=>$profile['discount_method'],
                    'discount_value'=>$profile['discount_value'],'discount_type'=>$profile['discount_type'],'bill_item_ids'=>$profile['bill_item_ids'],
                    'year'=>$year,'term'=>$term,'assigned_by'=>$current_user_id,'created_by'=>$current_user_id,
                    'status'=>$is_super_admin?'approved':'pending','is_active'=>$is_super_admin?1:0,
                    'approved_by'=>$is_super_admin?$current_user_id:null,'approved_at'=>$is_super_admin?date('Y-m-d H:i:s'):null
                ]);
                $assigned++;
            }
        }
        if(!$is_super_admin && $assigned>0) {
            foreach($this->db->where('level',1)->get('admin')->result() as $admin) {
                $this->db->insert('notifications',[
                    'user_id'=>$admin->admin_id,'user_type'=>'superadmin','title'=>'Discount Approval Required',
                    'message'=>$assigned.' student discount assignment(s) are awaiting approval','type'=>'discount_approval','created_at'=>date('Y-m-d H:i:s')
                ]);
            }
        }
        echo json_encode(['status'=>'success','message'=>$is_super_admin?"$assigned discount(s) assigned and approved":"$assigned discount(s) assigned, pending approval"]);
    }

    public function remove_assignment($student_id = 0) {
        if(strtoupper($this->input->method()) !== 'POST') {
            return $this->output->set_status_header(405)->set_content_type('application/json')->set_output(json_encode(['status'=>'error','message'=>'POST request required']));
        }
        if($this->session->userdata('user_type') != 1) {
            return $this->output->set_status_header(403)->set_content_type('application/json')->set_output(json_encode(['status'=>'error','message'=>'Only a super administrator can deactivate approved discounts']));
        }
        $student_id=(int)$student_id;
        if(!$student_id) { echo json_encode(['status'=>'error','message'=>'Invalid student']); return; }
        $this->db->where('student_id',$student_id)->where('is_active',1)->update('student_discount_assignments',[
            'is_active'=>0,'deactivated_at'=>time(),'deactivated_by'=>(int)$this->session->userdata('admin_id')
        ]);
        echo json_encode(['status'=>'success','message'=>'Active discount assignments deactivated; financial discount records were preserved for audit.']);
    }

    public function student_list() {
        $running_year = $this->db->get_where('settings', ['type' => 'running_year'])->row()->description;
        $running_term = $this->db->get_where('settings', ['type' => 'running_term'])->row()->description;

        $page_data['running_year'] = $running_year;
        $page_data['running_term'] = $running_term;
        $page_data['page_name'] = 'student_discount_list';
        $page_data['page_title'] = 'Students with Discounts';
        $page_data['account_type'] = $this->session->userdata('login_type');
        $this->load->view('backend/main', $page_data);
    }
}
