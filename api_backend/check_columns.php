<?php
require_once 'db_config.php';
try {
    $q = $pdo->query("DESCRIBE usuarios");
    while($row = $q->fetch()) {
        echo $row['Field'] . "\n";
    }
} catch (Exception $e) {
    echo $e->getMessage();
}
