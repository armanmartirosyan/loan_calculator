<?php
require_once 'config.php';

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get JSON data
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate input
    if (!isset($data['from_currency']) || !isset($data['to_currency']) || !isset($data['rate'])) {
        echo json_encode([
            'success' => false,
            'error' => 'Missing required fields'
        ]);
        exit;
    }
    
    try {
        // Update the currency rate
        $stmt = $pdo->prepare("
            INSERT INTO currency_rates (from_currency, to_currency, rate) 
            VALUES (:from, :to, :rate)
            ON DUPLICATE KEY UPDATE rate = :rate
        ");
        
        $stmt->execute([
            ':from' => $data['from_currency'],
            ':to' => $data['to_currency'],
            ':rate' => $data['rate']
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Currency rate updated successfully'
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to update currency rate: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'error' => 'Only POST requests are allowed'
    ]);
}
