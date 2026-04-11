<?php
require_once 'db_config.php';
$phone = '88888888888';
$email = '88888888888@7finance.com';
try {
    $stmt = $pdo->prepare("SELECT id, nome, email, telefone, senha FROM usuarios WHERE telefone = ? OR email = ?");
    $stmt->execute([$phone, $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        echo json_encode(["success" => true, "user" => $user]);
    } else {
        echo json_encode(["success" => false, "message" => "Usuario nao encontrado"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
