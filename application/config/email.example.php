<?php
defined('BASEPATH') OR exit('No direct script access allowed');

$config = array(
    'protocol' => getenv('MAIL_PROTOCOL') ?: 'smtp',
    'smtp_host' => getenv('MAIL_HOST') ?: 'ssl://smtp.googlemail.com',
    'smtp_port' => (int) (getenv('MAIL_PORT') ?: 465),
    'smtp_user' => getenv('MAIL_USERNAME') ?: 'replace_me',
    'smtp_pass' => getenv('MAIL_PASSWORD') ?: 'replace_me',
    'smtp_crypto' => getenv('MAIL_ENCRYPTION') ?: 'ssl',
    'mailtype' => 'text',
    'smtp_timeout' => '4',
    'charset' => 'utf-8',
    'wordwrap' => TRUE
);
