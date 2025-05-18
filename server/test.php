<?php
// Create a simple test.php file with this content
echo json_encode([
    'success' => true,
    'message' => 'PHP is working!',
    'php_version' => PHP_VERSION,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'timestamp' => time()
]);
?>