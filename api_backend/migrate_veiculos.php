<?php
require_once 'db_config.php';

try {
    // 1. Criar tabela de vículos
    $pdo->exec("CREATE TABLE IF NOT EXISTS veiculos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        nome VARCHAR(100) NOT NULL,
        placa VARCHAR(20) NOT NULL,
        km_atual INT DEFAULT 0,
        tipo ENUM('proprio', 'alugado') DEFAULT 'proprio',
        cor VARCHAR(30),
        status ENUM('ativo', 'inativo') DEFAULT 'ativo',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // 2. Adicionar veiculo_id em km_registry
    $checkKm = $pdo->query("SHOW COLUMNS FROM km_registry LIKE 'veiculo_id'");
    if (!$checkKm->fetch()) {
        $pdo->exec("ALTER TABLE km_registry ADD COLUMN veiculo_id INT AFTER usuario_id");
        $pdo->exec("ALTER TABLE km_registry ADD CONSTRAINT fk_veiculo_km FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL");
    }

    // 3. Adicionar veiculo_id em maintenance
    $checkMaint = $pdo->query("SHOW COLUMNS FROM maintenance LIKE 'veiculo_id'");
    if (!$checkMaint->fetch()) {
        $pdo->exec("ALTER TABLE maintenance ADD COLUMN veiculo_id INT AFTER usuario_id");
        $pdo->exec("ALTER TABLE maintenance ADD CONSTRAINT fk_veiculo_maint FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL");
    }

    echo json_encode(["success" => true, "message" => "Banco de dados atualizado com sucesso (Tabela de Veículos criada)."]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
