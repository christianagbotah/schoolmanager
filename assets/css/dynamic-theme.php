<?php
// Dynamic Theme CSS Generator
header("Content-type: text/css; charset: UTF-8");

// Database connection
$db_host = 'localhost';
$db_name = 'schoolmanager';
$db_user = 'root';
$db_pass = '';

try {
    $conn = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get theme settings
    $stmt = $conn->prepare("SELECT type, description FROM settings WHERE type IN ('app_theme', 'theme_primary', 'theme_secondary', 'theme_accent')");
    $stmt->execute();
    $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    $theme = $settings['app_theme'] ?? 'default';
    
    // Predefined themes
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
    
    // Use custom colors if theme is 'custom'
    if($theme === 'custom') {
        $primary = $settings['theme_primary'] ?? '#667eea';
        $secondary = $settings['theme_secondary'] ?? '#764ba2';
        $accent = $settings['theme_accent'] ?? '#f093fb';
    } else {
        $primary = $themes[$theme]['primary'] ?? '#667eea';
        $secondary = $themes[$theme]['secondary'] ?? '#764ba2';
        $accent = $themes[$theme]['accent'] ?? '#f093fb';
    }
    
} catch(PDOException $e) {
    // Fallback to default colors
    $primary = '#667eea';
    $secondary = '#764ba2';
    $accent = '#f093fb';
}
?>

/* Dynamic Theme CSS */
:root {
    --theme-primary: <?php echo $primary; ?>;
    --theme-secondary: <?php echo $secondary; ?>;
    --theme-accent: <?php echo $accent; ?>;
}

/* Primary Buttons */
.btn-primary,
.btn-primary:focus {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
    border: none;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.btn-primary:hover,
.btn-primary:active {
    background: var(--theme-accent);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

/* Panel Headers */
.panel-primary > .panel-heading {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
    border: none;
}

/* Modern Modal Headers */
.modern-modal-header,
.modern-modal-header-success,
.modern-modal-header-danger,
.modern-modal-header-warning {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
}

/* Sidebar Active Items */
.sidebar-menu li.active > a,
.sidebar-menu li.active > a:hover {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
}

/* Links */
a {
    color: var(--theme-primary);
}

a:hover {
    color: var(--theme-accent);
}

/* Form Focus */
.form-control:focus {
    border-color: var(--theme-primary);
    box-shadow: 0 0 0 0.2rem rgba(<?php 
        list($r, $g, $b) = sscanf($primary, "#%02x%02x%02x");
        echo "$r, $g, $b";
    ?>, 0.25);
}

/* Progress Bars */
.progress-bar {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
}

/* Badges */
.badge-primary {
    background: var(--theme-primary);
}

/* Pagination */
.pagination > .active > a,
.pagination > .active > span {
    background-color: var(--theme-primary);
    border-color: var(--theme-primary);
}

/* Navbar */
.navbar-default {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
}

/* Cards with Gradient */
.card-gradient {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%);
}

/* Hover Effects */
.hover-primary:hover {
    background-color: var(--theme-primary) !important;
    color: white !important;
}

/* Text Colors */
.text-primary {
    color: var(--theme-primary) !important;
}

/* Border Colors */
.border-primary {
    border-color: var(--theme-primary) !important;
}

/* Background Colors */
.bg-primary {
    background-color: var(--theme-primary) !important;
}

.bg-gradient-primary {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-secondary) 100%) !important;
}
