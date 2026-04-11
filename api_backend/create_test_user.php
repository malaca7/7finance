<?php
require_once 'db_config.php';
$phone = '88888888888';
$email = $phone . '@7finance.com';
$name = 'Usuario de Teste';
$pass = '123456';

try {
    // 1. Inserir no MySQL para garantir perfil
    $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, telefone, senha, role, status) VALUES (?, ?, ?, ?, 'user', 'ativo')");
    $stmt->execute([$name, $email, $phone, $pass]);
    echo "Usuario criado no MySQL com sucesso!\n";
} catch (Exception $e) {
    echo "Erro MySQL: " . $e->getMessage() . "\n";
}
