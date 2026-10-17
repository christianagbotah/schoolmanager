<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Message_attachment extends CI_Controller
{
    public function __construct()
    {
        parent::__construct();
        $this->load->database();
        $this->load->library('session');
        $this->load->model('Crud_model', 'crud_model');
    }

    public function private_message($message_id = 0)
    {
        $user_key = $this->current_authenticated_user_key();
        if ($user_key === false) return $this->deny();
        $row = $this->db->select('message_id,message_thread_code,attached_file_name,attached_file_storage_key')
            ->get_where('message', array('message_id' => (int)$message_id))->row_array();
        if (!$row || empty($row['attached_file_storage_key'])) return $this->missing();
        if (!$this->crud_model->is_message_thread_participant($row['message_thread_code'], $user_key)) return $this->deny();
        $this->deliver($row['attached_file_storage_key'], $row['attached_file_name']);
    }

    public function group_message($group_message_id = 0)
    {
        $user_key = $this->current_authenticated_user_key();
        if ($user_key === false) return $this->deny();
        $row = $this->db->select('group_message_id,group_message_thread_code,attached_file_name,attached_file_storage_key')
            ->get_where('group_message', array('group_message_id' => (int)$group_message_id))->row_array();
        if (!$row || empty($row['attached_file_storage_key'])) return $this->missing();
        if (!$this->crud_model->is_group_thread_participant($row['group_message_thread_code'], $user_key)) return $this->deny();
        $this->deliver($row['attached_file_storage_key'], $row['attached_file_name']);
    }

    private function current_authenticated_user_key()
    {
        $type = trim((string)$this->session->userdata('login_type'));
        $allowed = array('admin','accountant','librarian','parent','student','teacher');
        if (!in_array($type, $allowed, true) || $this->session->userdata($type . '_login') != 1) return false;
        $id = (int)$this->session->userdata('login_user_id');
        if ($id <= 0) $id = (int)$this->session->userdata($type . '_id');
        return $id > 0 ? $type . '-' . $id : false;
    }

    private function deliver($storage_key, $display_name)
    {
        $this->load->helper('download');
        $this->load->library('Private_file_storage', null, 'private_files');
        $path = $this->private_files->resolve($storage_key);
        if ($path === null) return $this->missing();
        force_download(basename((string)$display_name), file_get_contents($path));
    }

    private function deny()
    {
        $this->output->set_status_header(403);
        show_error('You are not authorised to download this attachment.', 403);
        return null;
    }

    private function missing()
    {
        show_404();
        return null;
    }
}
