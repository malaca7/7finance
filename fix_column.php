<?php
require 'api_backend/db_config.php';

try {
    // Tenta adicionar a coluna foto_url na tabela usuarios
    $pdo->exec("ALTER TABLE usuarios ADD COLUMN foto_url LONGTEXT AFTER placa");
    echo json_encode(["success" => true, "message" => "Coluna 'foto_url' adicionada com sucesso."]);
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode(["success" => true, "message" => "A coluna 'foto_url' já existe."]);
    } else {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
}
?>