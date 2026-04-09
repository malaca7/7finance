<?php
/**
 * Project: 7finance - PHP/MySQL Backend
 * Database Configuration
 */

// Headers for CORS (Necessary to the React app connect)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

error_reporting(0);
ini_set('display_errors', 0);

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Credentials
$host = "localhost"; // Change to your DB host if not local
$db_name = "malacaco_7finance";
$username = "root"; // Default phpMyAdmin username
$password = "";     // Default phpMyAdmin password (usually empty in XAMPP)

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die(json_encode([
        "success" => false, 
        "error" => "Falha na conexão com o banco de dados: " . $e->getMessage()
    ]));
}
?>
