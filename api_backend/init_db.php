<?php
$sql = file_get_contents(__DIR__ . "/setup.sql");
$pdo = new PDO("mysql:host=localhost", "root", "");
$pdo->exec($sql);
echo "DB created\n";
?>
