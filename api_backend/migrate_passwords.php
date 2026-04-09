<?php
require_once 'db_config.php';
try {
    $pdo->exec("ALTER TABLE usuarios CHANGE COLUMN senha_hash senha VARCHAR(255) NOT NULL");
    echo "Coluna 'senha_hash' alterada para 'senha' com sucesso!\n";
    $pdo->exec("UPDATE usuarios SET senha = '123456' WHERE email = 'malaca@7finance.com'");
    echo "Sua senha de administrador foi resetada para '123456' em texto puro.\n";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>