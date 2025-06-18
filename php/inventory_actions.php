<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'get_inventory':
            $stmt = $pdo->query("SELECT id, name, price, quantity, sold FROM products ORDER BY name");
            $products = $stmt->fetchAll();
            echo json_encode($products);
            break;

        case 'add_product':
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Invalid JSON data');
            }
            
            if (empty($data['name']) || !is_numeric($data['price']) || !is_numeric($data['quantity'])) {
                throw new Exception('Invalid product data');
            }
            
            $stmt = $pdo->prepare("INSERT INTO products (name, price, quantity) VALUES (?, ?, ?)");
            $success = $stmt->execute([
                trim($data['name']),
                floatval($data['price']),
                intval($data['quantity'])
            ]);
            
            if (!$success) {
                throw new Exception('Failed to insert product');
            }
            
            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
            $stmt->execute([$newId]);
            $newProduct = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'product' => $newProduct
            ]);
            break;

        case 'delete_product':
            $data = json_decode(file_get_contents('php://input'), true);
            
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $success = $stmt->execute([$data['id']]);
            
            echo json_encode(['success' => $success]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage(),
        'trace' => $e->getTrace()
    ]);
}
?>  