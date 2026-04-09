<?php
require_once 'db_config.php';
try {
    $pdo->exec("UPDATE usuarios SET senha = '123456' WHERE email = 'malaca@7finance.com'");
    echo "Sucesso: Admin resetado.\n";
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>