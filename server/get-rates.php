<?php
require_once 'config.php';
header('Content-Type: application/json');

try {
    // Get all currency rates
    $stmt = $pdo->prepare("SELECT from_currency, to_currency, rate FROM currency_rates");
    $stmt->execute();
    $rates = $stmt->fetchAll();
    
    // Format the rates into a more usable structure for the frontend
    $formattedRates = [];
    foreach ($rates as $rate) {
        if (!isset($formattedRates[$rate['from_currency']])) {
            $formattedRates[$rate['from_currency']] = [];
        }
        $formattedRates[$rate['from_currency']][$rate['to_currency']] = (float)$rate['rate'];
    }
    
    echo json_encode([
        'success' => true,
        'rates' => $formattedRates,
        'timestamp' => time()
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch currency rates: ' . $e->getMessage()
    ]);
}
