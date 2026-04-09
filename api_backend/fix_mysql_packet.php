<?php
/**
 * Script de Reparo do MySQL - Ajuste de max_allowed_packet
 */
require_once 'db_config.php';

echo "Tentando ajustar o limite do MySQL...\n";

try {
    // Tenta definir como GLOBAL (requer privilégios de super usuário)
    $pdo->exec("SET GLOBAL max_allowed_packet = 16777216"); // 16MB
    echo "Sucesso! O limite max_allowed_packet foi aumentado para 16MB globalmente.\n";
    echo "Isso permitirá que você salve fotos grandes agora.\n";
} catch (PDOException $e) {
    echo "Erro ao tentar ajustar: " . $e->getMessage() . "\n\n";
    echo "--- INSTRUÇÕES MANUAIS ---\n";
    echo "Se este script falhou, você deve fazer isso manualmente:\n";
    echo "1. Abra o painel do XAMPP / WAMP.\n";
    echo "2. Clique no botão 'Config' do MySQL -> 'my.ini'.\n";
    echo "3. Procure a linha 'max_allowed_packet' (geralmente está 1M).\n";
    echo "4. Mude para: max_allowed_packet=16M\n";
    echo "5. Salve o arquivo e REINICIE o MySQL.\n";
}
?>