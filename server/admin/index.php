<?php
require_once '../config.php';

// Handle form submission
$message = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Update the currency rate
        $stmt = $pdo->prepare("
            INSERT INTO currency_rates (from_currency, to_currency, rate) 
            VALUES (:from_currency, :to_currency, :rate)
            ON DUPLICATE KEY UPDATE rate = :rate
        ");
        
        $stmt->execute([
            ':from_currency' => $_POST['from_currency'],
            ':to_currency' => $_POST['to_currency'],
            ':rate' => $_POST['rate']
        ]);
        
        $message = 'Currency rate updated successfully!';
    } catch (PDOException $e) {
        $message = 'Error: ' . $e->getMessage();
    }
}

// Get all currency rates
$stmt = $pdo->query("SELECT * FROM currency_rates ORDER BY from_currency, to_currency");
$rates = $stmt->fetchAll();

// Get unique currencies for dropdowns
$currencies = [];
foreach ($rates as $rate) {
    if (!in_array($rate['from_currency'], $currencies)) {
        $currencies[] = $rate['from_currency'];
    }
    if (!in_array($rate['to_currency'], $currencies)) {
        $currencies[] = $rate['to_currency'];
    }
}
sort($currencies);

header('Content-Type: text/html; charset=UTF-8');
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Currency Rates Admin</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #1e1e2e;
            color: #e0e0e0;
        }
        h1 {
            color: #cba6f7;
            text-align: center;
        }
        .container {
            max-width: 1000px;
            margin: 0 auto;
        }
        .message {
            padding: 10px;
            margin-bottom: 20px;
            background-color: #a6e3a1;
            color: #1e1e2e;
            border-radius: 4px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background-color: #313244;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #45475a;
        }
        th {
            background-color: #45475a;
            color: #cba6f7;
        }
        tr:hover {
            background-color: #45475a;
        }
        form {
            background-color: #313244;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            color: #a6e3a1;
        }
        input, select {
            width: 100%;
            padding: 10px;
            background-color: #1e1e2e;
            color: #e0e0e0;
            border: 1px solid #45475a;
            border-radius: 4px;
            font-size: 16px;
            box-sizing: border-box;
        }
        button {
            padding: 10px 15px;
            background-color: #a6e3a1;
            color: #1e1e2e;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
        }
        button:hover {
            background-color: #94e2d5;
        }
        .timestamp {
            font-size: 12px;
            color: #89b4fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Currency Rates Admin</h1>
        
        <?php if ($message): ?>
            <div class="message"><?php echo $message; ?></div>
        <?php endif; ?>
        
        <h2>Update Currency Rate</h2>
        <form method="POST">
            <div class="form-group">
                <label for="from_currency">From Currency</label>
                <select id="from_currency" name="from_currency" required>
                    <?php foreach ($currencies as $currency): ?>
                        <option value="<?php echo $currency; ?>"><?php echo $currency; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="to_currency">To Currency</label>
                <select id="to_currency" name="to_currency" required>
                    <?php foreach ($currencies as $currency): ?>
                        <option value="<?php echo $currency; ?>"><?php echo $currency; ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="form-group">
                <label for="rate">Exchange Rate</label>
                <input type="number" id="rate" name="rate" step="0.000001" min="0.000001" required>
            </div>
            
            <button type="submit">Update Rate</button>
        </form>
        
        <h2>Current Rates</h2>
        <table>
            <thead>
                <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Rate</th>
                    <th>Last Updated</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($rates as $rate): ?>
                    <tr>
                        <td><?php echo $rate['from_currency']; ?></td>
                        <td><?php echo $rate['to_currency']; ?></td>
                        <td><?php echo $rate['rate']; ?></td>
                        <td class="timestamp"><?php echo $rate['last_updated']; ?></td>
                    </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
