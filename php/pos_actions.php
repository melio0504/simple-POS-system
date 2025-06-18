<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'get_products':
            $stmt = $pdo->query("SELECT * FROM products ORDER BY name");
            $products = $stmt->fetchAll();
            echo json_encode($products);
            break;

        case 'process_sale':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $pdo->beginTransaction();
            
            try {
                $stmt = $pdo->prepare("INSERT INTO sales (customer_name, customer_id, sale_type, subtotal, discount, total, cash, change_amount) 
                                      VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['customer_name'],
                    $data['customer_id'],
                    $data['sale_type'],
                    $data['subtotal'],
                    $data['discount'],
                    $data['total'],
                    $data['cash'],
                    $data['change_amount']
                ]);
                
                $saleId = $pdo->lastInsertId();
                
                foreach ($data['items'] as $item) {
                    $stmt = $pdo->prepare("INSERT INTO sale_items (sale_id, product_id, quantity, price) 
                                          VALUES (?, ?, ?, ?)");
                    $stmt->execute([$saleId, $item['id'], $item['quantity'], $item['price']]);
                    
                    $stmt = $pdo->prepare("UPDATE products 
                                          SET quantity = quantity - ?, sold = sold + ? 
                                          WHERE id = ?");
                    $stmt->execute([$item['quantity'], $item['quantity'], $item['id']]);
                }
                
                $pdo->commit();
                
                echo json_encode([
                    'success' => true,
                    'sale_id' => $saleId
                ]);
            } catch (Exception $e) {
                $pdo->rollBack();
                throw $e;
            }
            break;

        default:
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage(),
        'trace' => $e->getTraceAsString()
    ]);
}
?>