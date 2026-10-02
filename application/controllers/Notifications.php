<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Notifications extends CI_Controller {
    
    function __construct() {
        parent::__construct();
        $this->load->library('session');
        $this->load->database();
        if($this->session->userdata('login_type') == '') {
            redirect(site_url('login'), 'refresh');
        }
    }
    
    function get_unread_count() {
        $user_id = $this->session->userdata('login_user_id');
        $count = $this->db->where('user_id', $user_id)
                          ->where('is_read', 0)
                          ->count_all_results('notifications');
        echo json_encode(['count' => $count]);
    }
    
    function get_notifications() {
        $user_id = $this->session->userdata('login_user_id');
        
        $notifications = $this->db->where('user_id', $user_id)
                                   ->order_by('created_at', 'DESC')
                                   ->limit(10)
                                   ->get('notifications')
                                   ->result_array();
        
        $unread_count = 0;
        foreach($notifications as &$notif) {
            $notif['time_ago'] = $this->time_ago($notif['created_at']);
            if($notif['is_read'] == 0) $unread_count++;
        }
        
        echo json_encode([
            'status' => 'success',
            'count' => $unread_count,
            'notifications' => $notifications
        ]);
    }
    
    function get_notification_details($notification_id) {
        $user_id = $this->session->userdata('login_user_id');
        $notification = $this->db->where('notification_id', $notification_id)
                                 ->where('user_id', $user_id)
                                 ->get('notifications')
                                 ->row_array();
        
        if($notification) {
            $notification['time_ago'] = $this->time_ago($notification['created_at']);
            echo json_encode([
                'status' => 'success',
                'notification' => $notification
            ]);
        } else {
            echo json_encode([
                'status' => 'error',
                'message' => 'Notification not found'
            ]);
        }
    }
    
    function mark_as_read($notification_id) {
        $user_id = $this->session->userdata('login_user_id');
        $this->db->where('notification_id', $notification_id)
                 ->where('user_id', $user_id)
                 ->update('notifications', ['is_read' => 1]);
        echo json_encode(['status' => 'success']);
    }
    
    function mark_all_read() {
        $user_id = $this->session->userdata('login_user_id');
        $this->db->where('user_id', $user_id)
                 ->where('is_read', 0)
                 ->update('notifications', ['is_read' => 1]);
        echo json_encode(['status' => 'success']);
    }
    
    private function time_ago($timestamp) {
        $diff = time() - $timestamp;
        if($diff < 60) return 'Just now';
        if($diff < 3600) return floor($diff/60) . ' min ago';
        if($diff < 86400) return floor($diff/3600) . ' hours ago';
        if($diff < 604800) return floor($diff/86400) . ' days ago';
        return date('M d, Y', $timestamp);
    }
}
