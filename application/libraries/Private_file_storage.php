<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * Private file storage for school documents that must never be web-addressable.
 * Files are stored in a sibling directory outside FCPATH by default.
 */
class Private_file_storage
{
    private $base_path;
    private $allowed_extensions = [
        'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt',
        'jpg', 'jpeg', 'png'
    ];
    private $max_bytes = 10485760; // 10 MiB

    public function __construct()
    {
        $configured = trim((string) getenv('IEDUPRO_PRIVATE_STORAGE'));
        if ($configured === '') {
            $configured = dirname(rtrim(FCPATH, DIRECTORY_SEPARATOR))
                . DIRECTORY_SEPARATOR . 'schoolmanager-private';
        }

        $this->base_path = rtrim($configured, DIRECTORY_SEPARATOR);
    }

    public function store_uploaded_file(array $file, $bucket, $stable_stem = '')
    {
        $this->validate_upload($file);
        $bucket = $this->sanitize_bucket($bucket);
        $original_name = basename((string) $file['name']);
        $extension = strtolower((string) pathinfo($original_name, PATHINFO_EXTENSION));

        $directory = $this->base_path . DIRECTORY_SEPARATOR . $bucket;
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new RuntimeException('Private file storage is not writable.');
        }

        if ($stable_stem !== '') {
            $stem = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $stable_stem);
            if ($stem === '') {
                throw new InvalidArgumentException('Invalid private file identifier.');
            }
        } else {
            $stem = bin2hex(random_bytes(16));
        }

        $stored_name = $stem . '.' . $extension;
        $target = $directory . DIRECTORY_SEPARATOR . $stored_name;

        if (!move_uploaded_file($file['tmp_name'], $target)) {
            throw new RuntimeException('Uploaded file could not be stored securely.');
        }
        @chmod($target, 0640);

        return [
            'storage_key' => 'private://' . $bucket . '/' . $stored_name,
            'original_name' => $original_name,
            'size' => (int) $file['size'],
        ];
    }

    public function named_storage_key($bucket, $stable_stem, $original_name)
    {
        $bucket = $this->sanitize_bucket($bucket);
        $stem = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $stable_stem);
        $extension = strtolower((string) pathinfo(basename((string) $original_name), PATHINFO_EXTENSION));
        if ($stem === '' || !in_array($extension, $this->allowed_extensions, true)) {
            return '';
        }
        return 'private://' . $bucket . '/' . $stem . '.' . $extension;
    }

    public function resolve($storage_key)
    {
        $storage_key = (string) $storage_key;
        if (strpos($storage_key, 'private://') !== 0) {
            return null;
        }

        $relative = substr($storage_key, strlen('private://'));
        $relative = str_replace('\\', '/', $relative);
        if ($relative === '' || preg_match('#(^|/)\.\.(/|$)#', $relative)) {
            return null;
        }

        $parts = explode('/', $relative);
        if (count($parts) !== 2) {
            return null;
        }
        $bucket = $this->sanitize_bucket($parts[0]);
        $file_name = basename($parts[1]);
        if ($file_name !== $parts[1]) {
            return null;
        }

        $candidate = $this->base_path . DIRECTORY_SEPARATOR . $bucket . DIRECTORY_SEPARATOR . $file_name;
        if (!is_file($candidate)) {
            return null;
        }

        $real_base = realpath($this->base_path);
        $real_file = realpath($candidate);
        if ($real_base === false || $real_file === false) {
            return null;
        }
        $prefix = rtrim($real_base, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR;
        if (strpos($real_file, $prefix) !== 0) {
            return null;
        }
        return $real_file;
    }

    public function delete($storage_key)
    {
        $path = $this->resolve($storage_key);
        return $path !== null ? @unlink($path) : false;
    }

    private function validate_upload(array $file)
    {
        if (!isset($file['error'], $file['name'], $file['tmp_name'], $file['size'])) {
            throw new InvalidArgumentException('Invalid uploaded file.');
        }
        if ((int) $file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('File upload did not complete successfully.');
        }
        $size = (int) $file['size'];
        if ($size <= 0 || $size > $this->max_bytes) {
            throw new RuntimeException('File must be between 1 byte and 10 MiB.');
        }
        $original_name = basename((string) $file['name']);
        $extension = strtolower((string) pathinfo($original_name, PATHINFO_EXTENSION));
        if (!in_array($extension, $this->allowed_extensions, true)) {
            throw new RuntimeException('This file type is not allowed.');
        }
        if (!is_uploaded_file($file['tmp_name'])) {
            throw new RuntimeException('Invalid upload source.');
        }
    }

    private function sanitize_bucket($bucket)
    {
        $bucket = preg_replace('/[^A-Za-z0-9_-]/', '', (string) $bucket);
        if ($bucket === '') {
            throw new InvalidArgumentException('Invalid private storage bucket.');
        }
        return $bucket;
    }
}
