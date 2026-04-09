<?php
/**
 * 7finance - Unified PHP API Endpoint
 */
require_once 'db_config.php';

// Set Server Timezone
date_default_timezone_set('America/Sao_Paulo');

$userId = isset($_GET['userId']) ? (int)$_GET['userId'] : 1;
$method = $_SERVER['REQUEST_METHOD'];
$entity = isset($_GET['entity']) ? $_GET['entity'] : 'summary';

$allowed_entities = ['usuario', 'earnings', 'expenses', 'km', 'maintenance', 'summary', 'admin_dashboard', 'logs', 'veiculos'];

if (!in_array($entity, $allowed_entities)) {
    echo json_encode(["success" => false, "error" => "Entidade inválida: $entity"]);
    exit();
}

// Convert DB timestamp to proper ISO format
function formatToISO($dbDate) {
    if (!$dbDate) return null;
    $dt = new DateTime($dbDate, new DateTimeZone('America/Sao_Paulo'));
    return $dt->format('Y-m-d\TH:i:s');
}

try {
    switch ($method) {
        case 'GET':
            handleGet($entity, $userId, $pdo);
            break;
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($_GET['id'])) {
                handleUpdate($entity, (int)$_GET['id'], $userId, $pdo, $input);
            } else {
                handlePost($entity, $userId, $pdo, $input);
            }
            break;
        case 'DELETE':
            if (isset($_GET['id'])) {
                handleDelete($entity, (int)$_GET['id'], $userId, $pdo);
            } else {
                throw new Exception("ID necessário para exclusão.");
            }
            break;
        default:
            http_response_code(405);
            echo json_encode(["status" => false, "message" => "Método não permitido"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}

function handleUpdate($entity, $id, $userId, $pdo, $data) {
    // Check if current user is admin for sensitive entities
    $isAdmin = false;
    $checkAdmin = $pdo->prepare("SELECT role FROM usuarios WHERE id = ?");
    $checkAdmin->execute([$userId]);
    $role = $checkAdmin->fetchColumn();
    if ($role === 'admin') $isAdmin = true;

    switch ($entity) {
        case 'usuario':
            if (!$isAdmin && $id !== $userId) throw new Exception("Não autorizado.");
            
            // Busca os dados ATUAIS do usuário para comparação
            $getCurrent = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
            $getCurrent->execute([$id]);
            $currentData = $getCurrent->fetch();

            if (!$currentData) throw new Exception("Usuário não encontrado.");

            $updates = [];
            $params = [];

            // Campos permitidos para edição de perfil
            $allowedFields = [
                'nome',
                'email',      // Habilitado e-mail
                'veiculo',
                'placa',
                'tipo',
                'foto_url'
            ];

            // Verifica se houve mudança real em cada campo
            foreach ($allowedFields as $key) {
                // Só adiciona ao UPDATE se o campo veio no JSON E é diferente do que está no banco
                if (isset($data[$key]) && $data[$key] !== $currentData[$key]) {
                    // BLOQUEIO DE TELEFONE: Apenas Admin pode mudar telefone de qualquer um (incluindo o dele)
                    if ($key === 'telefone' && !$isAdmin) continue;
                    
                    $updates[] = "$key = ?";
                    $params[] = $data[$key];
                }
            }

            // CASO ESPECIAL: Telefone (Se for Admin, permite vir no $data)
            if ($isAdmin && isset($data['telefone']) && $data['telefone'] !== $currentData['telefone']) {
                $updates[] = "telefone = ?";
                $params[] = preg_replace('/[^0-9]/', '', $data['telefone']);
            }

            // Senha (tratar separado)
            if (!empty($data['password']) && $data['password'] !== $currentData['senha']) {
                $updates[] = "senha = ?";
                $params[] = $data['password'];
            }

            // Se não houver mudanças, buscamos os dados atuais para retornar (evita sumir dados no front)
            if (empty($updates)) {
                $userData = $pdo->prepare("SELECT id, nome, email, telefone, tipo, role, status, veiculo, placa, foto_url FROM usuarios WHERE id = ?");
                $userData->execute([$id]);
                echo json_encode(["success" => true, "data" => $userData->fetch(), "message" => "Nenhuma alteração detectada."]);
                exit();
            }

            $sql = "UPDATE usuarios SET " . implode(", ", $updates) . " WHERE id = ?";
            $params[] = $id;
            
            $pdo->prepare($sql)->execute($params);

            // BUSCA OS DADOS ATUALIZADOS PARA RETORNAR AO FRONTEND
            $updated = $pdo->prepare("SELECT id, nome, email, telefone, tipo, role, status, veiculo, placa, foto_url FROM usuarios WHERE id = ?");
            $updated->execute([$id]);
            $userData = $updated->fetch();
            
            echo json_encode(["success" => true, "data" => $userData]);
            exit();
            break;
        case 'earnings':
            $sql = "UPDATE earnings SET tipo = ?, valor = ?, descricao = ? WHERE id = ? AND usuario_id = ?";
            $pdo->prepare($sql)->execute([$data['tipo'], $data['valor'], $data['descricao'] ?? '', $id, $userId]);
            break;
        case 'expenses':
            $sql = "UPDATE expenses SET tipo = ?, valor = ?, descricao = ? WHERE id = ? AND usuario_id = ?";
            $pdo->prepare($sql)->execute([$data['tipo'], $data['valor'], $data['descricao'] ?? '', $id, $userId]);
            break;
        case 'km':
            $sql = "UPDATE km_registry SET km_inicial = ?, km_final = ?, data = ? WHERE id = ? AND usuario_id = ?";
            $pdo->prepare($sql)->execute([$data['km_inicial'], $data['km_final'], date('Y-m-d H:i:s', strtotime($data['data'])), $id, $userId]);
            break;
        case 'maintenance':
            $sql = "UPDATE maintenance SET tipo = ?, km_realizada = ?, valor = ?, descricao = ? WHERE id = ? AND usuario_id = ?";
            $pdo->prepare($sql)->execute([$data['tipo'], $data['km_realizada'], $data['valor'], $data['descricao'] ?? '', $id, $userId]);
            break;
    }
    echo json_encode(["success" => true]);
}

function handleDelete($entity, $id, $userId, $pdo) {
    // Check admin
    $isAdmin = false;
    $checkAdmin = $pdo->prepare("SELECT role FROM usuarios WHERE id = ?");
    $checkAdmin->execute([$userId]);
    $role = $checkAdmin->fetchColumn();
    if ($role === 'admin') $isAdmin = true;

    $table = "";
    $extra_clause = " AND usuario_id = ?";
    $params = [$id, $userId];

    switch ($entity) {
        case 'usuario': 
            if (!$isAdmin) throw new Exception("Ação restrita a administradores.");
            $table = "usuarios"; 
            $extra_clause = "";
            $params = [$id];
            break;
        case 'earnings': $table = "earnings"; break;
        case 'expenses': $table = "expenses"; break;
        case 'km': $table = "km_registry"; break;
        case 'maintenance': $table = "maintenance"; break;
    }
    if ($table) {
        $stmt = $pdo->prepare("DELETE FROM $table WHERE id = ?$extra_clause");
        $stmt->execute($params);
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Entidade não removível"]);
    }
}

function handleGet($entity, $userId, $pdo) {
    $filter = isset($_GET['filter']) ? $_GET['filter'] : 'mensal';
    $date_clause = getDateClause($filter);

    // Check admin
    $isAdmin = false;
    $checkAdmin = $pdo->prepare("SELECT role FROM usuarios WHERE id = ?");
    $checkAdmin->execute([$userId]);
    $role = $checkAdmin->fetchColumn();
    if ($role === 'admin') $isAdmin = true;

    switch ($entity) {
        case 'admin_dashboard':
            if (!$isAdmin) throw new Exception("Não autorizado.");
            
            // Total stats
            $totalUsers = $pdo->query("SELECT COUNT(*) FROM usuarios")->fetchColumn();
            $ativos = $pdo->query("SELECT COUNT(*) FROM usuarios WHERE status = 'ativo'")->fetchColumn();
            $totalGanhos = $pdo->query("SELECT SUM(valor) FROM earnings")->fetchColumn() ?: 0;
            
            echo json_encode([
                "success" => true,
                "data" => [
                    "stats" => [
                        "totalUsuarios" => (int)$totalUsers,
                        "usuariosAtivos" => (int)$ativos,
                        "novosUsuarios7Dias" => 0,
                        "totalGanhosGlobal" => (float)$totalGanhos,
                        "lucroMedioPorMotorista" => $totalUsers > 0 ? (float)($totalGanhos / $totalUsers) : 0,
                        "percentualBaixoLucro" => 0,
                        "usuariosInativos" => 0
                    ],
                    "graficoCrescimento" => [],
                    "alerts" => []
                ]
            ]);
            break;

        case 'logs':
            if (!$isAdmin) throw new Exception("Não autorizado.");
            $stmt = $pdo->query("SELECT * FROM audit_logs ORDER BY data DESC LIMIT 50");
            echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
            break;

        case 'summary':
            $stmt_earn = $pdo->prepare("SELECT SUM(valor) as total FROM earnings WHERE usuario_id = ? AND $date_clause");
            $stmt_earn->execute([$userId]);
            $ganhos = $stmt_earn->fetch()['total'] ?? 0;

            $stmt_exp = $pdo->prepare("SELECT SUM(valor) as total FROM expenses WHERE usuario_id = ? AND $date_clause");
            $stmt_exp->execute([$userId]);
            $despesas = $stmt_exp->fetch()['total'] ?? 0;

            // Get current KM
            $stmt_km = $pdo->prepare("SELECT km_final FROM km_registry WHERE usuario_id = ? ORDER BY data DESC, criado_em DESC LIMIT 1");
            $stmt_km->execute([$userId]);
            $km_atual = $stmt_km->fetch()['km_final'] ?? 0;

            echo json_encode([
                "success" => true,
                "data" => [
                    "totalGanhos" => (float)$ganhos,
                    "totalDespesas" => (float)$despesas,
                    "lucroLiquido" => (float)($ganhos - $despesas),
                    "kmRodados" => (int)$km_atual
                ]
            ]);
            break;

        case 'earnings':
            $stmt = $pdo->prepare("SELECT * FROM earnings WHERE usuario_id = ? AND $date_clause ORDER BY data DESC, criado_em DESC");
            $stmt->execute([$userId]);
            $results = $stmt->fetchAll();
            $data = array_map(function($row) {
                $row['data'] = formatToISO($row['data']);
                $row['criado_em'] = formatToISO($row['criado_em']);
                if (isset($row['valor'])) $row['valor'] = (float)$row['valor'];
                return $row;
            }, $results);
            echo json_encode(["success" => true, "data" => $data]);
            break;

        case 'expenses':
            $stmt = $pdo->prepare("SELECT * FROM expenses WHERE usuario_id = ? AND $date_clause ORDER BY data DESC, criado_em DESC");
            $stmt->execute([$userId]);
            $results = $stmt->fetchAll();
            $data = array_map(function($row) {
                $row['data'] = formatToISO($row['data']);
                $row['criado_em'] = formatToISO($row['criado_em']);
                if (isset($row['valor'])) $row['valor'] = (float)$row['valor'];
                return $row;
            }, $results);
            echo json_encode(["success" => true, "data" => $data]);
            break;

        case 'km':
            $stmt = $pdo->prepare("SELECT * FROM km_registry WHERE usuario_id = ? ORDER BY data DESC, criado_em DESC");
            $stmt->execute([$userId]);
            $results = $stmt->fetchAll();
            $data = array_map(function($row) {
                $row['data'] = formatToISO($row['data']);
                $row['criado_em'] = formatToISO($row['criado_em']);
                return $row;
            }, $results);
            echo json_encode(["success" => true, "data" => $data]);
            break;

        case 'maintenance':
            $stmt = $pdo->prepare("SELECT * FROM maintenance WHERE usuario_id = ? ORDER BY data DESC, criado_em DESC");
            $stmt->execute([$userId]);
            $results = $stmt->fetchAll();
            $data = array_map(function($row) {
                $row['data'] = formatToISO($row['data']);
                $row['criado_em'] = formatToISO($row['criado_em']);
                if (isset($row['valor'])) $row['valor'] = (float)$row['valor'];
                return $row;
            }, $results);
            echo json_encode(["success" => true, "data" => $data]);
            break;

        case 'veiculos':
            $stmt = $pdo->prepare("SELECT * FROM veiculos WHERE usuario_id = ? AND status = 'ativo' ORDER BY criado_em DESC");
            $stmt->execute([$userId]);
            echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
            break;
            
        case 'usuario':
            if ($isAdmin) {
                $stmt = $pdo->prepare("SELECT id, nome, email, role, status, telefone, tipo, veiculo, placa FROM usuarios");
                $stmt->execute();
                echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
            } else {
                $stmt = $pdo->prepare("SELECT id, nome, email, role, status FROM usuarios WHERE id = ?");
                $stmt->execute([$userId]);
                echo json_encode(["success" => true, "data" => $stmt->fetch()]);
            }
            break;
    }
}

// Handle CREATE Operations
function handlePost($entity, $userId, $pdo, $data) {
    if (!$data) throw new Exception("Nenhum dado fornecido.");

    // Check admin
    $isAdmin = false;
    $checkAdmin = $pdo->prepare("SELECT role FROM usuarios WHERE id = ?");
    $checkAdmin->execute([$userId]);
    $role = $checkAdmin->fetchColumn();
    if ($role === 'admin') $isAdmin = true;

    // For KM entity, use provided date/time, otherwise use server current time
    if ($entity === 'km' || $entity === 'earnings' || $entity === 'expenses' || $entity === 'maintenance') {
        $datetime = isset($data['data']) ? date('Y-m-d H:i:s', strtotime($data['data'])) : date('Y-m-d H:i:s');
    } else {
        $datetime = date('Y-m-d H:i:s');
    }

    switch ($entity) {
        case 'usuario':
            if (!$isAdmin) throw new Exception("Não autorizado para criar usuários.");
            // Admin user creation uses register-like logic but avoids global auth dependency
            $password = $data['password'] ?? '123456';
            $sql = "INSERT INTO usuarios (nome, email, telefone, tipo, role, status, veiculo, placa, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $data['nome'], $data['email'], $data['telefone'] ?? '', 
                $data['tipo'] ?? 'app', $data['role'] ?? 'usuario', 
                $data['status'] ?? 'ativo', $data['veiculo'] ?? '', 
                $data['placa'] ?? '', $password
            ]);
            
            $new_id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT id, nome, email, role, status FROM usuarios WHERE id = ?");
            $stmt->execute([$new_id]);
            echo json_encode(["success" => true, "data" => $stmt->fetch()]);
            break;

        case 'logs':
            if (!$isAdmin) throw new Exception("Não autorizado.");
            $sql = "INSERT INTO audit_logs (acao, descricao, data) VALUES (?, ?, NOW())";
            $pdo->prepare($sql)->execute([$data['acao'], $data['descricao']]);
            echo json_encode(["success" => true]);
            break;

        case 'earnings':
            $sql = "INSERT INTO earnings (usuario_id, tipo, valor, descricao, data) VALUES (?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, $data['tipo'], $data['valor'], $data['descricao'] ?? '', $datetime]);
            
            // fetch created row
            $new_id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM earnings WHERE id = ?");
            $stmt->execute([$new_id]);
            $row = $stmt->fetch();
            $row['data'] = formatToISO($row['data']);
            $row['criado_em'] = formatToISO($row['criado_em']);
            if (isset($row['valor'])) $row['valor'] = (float)$row['valor'];
            
            echo json_encode(["success" => true, "data" => $row]);
            break;

        case 'expenses':
            $sql = "INSERT INTO expenses (usuario_id, tipo, valor, descricao, data) VALUES (?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, $data['tipo'], $data['valor'], $data['descricao'] ?? '', $datetime]);
            
            $new_id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM expenses WHERE id = ?");
            $stmt->execute([$new_id]);
            $row = $stmt->fetch();
            $row['data'] = formatToISO($row['data']);
            $row['criado_em'] = formatToISO($row['criado_em']);
            if (isset($row['valor'])) $row['valor'] = (float)$row['valor'];
            
            echo json_encode(["success" => true, "data" => $row]);
            break;

        case 'km':
            $sql = "INSERT INTO km_registry (usuario_id, veiculo_id, km_inicial, km_final, data) VALUES (?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$userId, $data['veiculo_id'] ?? null, $data['km_inicial'], $data['km_final'] ?? 0, $datetime]);
            
            // ATUALIZAR KM ATUAL DO VEÍCULO SE FOR KM FINAL
            if (!empty($data['km_final']) && !empty($data['veiculo_id'])) {
                $up = $pdo->prepare("UPDATE veiculos SET km_atual = ? WHERE id = ?");
                $up->execute([(int)$data['km_final'], (int)$data['veiculo_id']]);
            }
            
            $new_id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM km_registry WHERE id = ?");
            $stmt->execute([$new_id]);
            $row = $stmt->fetch();
            $row['data'] = formatToISO($row['data']);
            $row['criado_em'] = formatToISO($row['criado_em']);
            
            echo json_encode(["success" => true, "data" => $row]);
            break;

        case 'maintenance':
            $sql = "INSERT INTO maintenance (usuario_id, veiculo_id, tipo, km_realizada, valor, descricao, data) VALUES (?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $userId,
                $data['veiculo_id'] ?? null,
                $data['tipo'], 
                $data['km_realizada'] ?? ($data['km_limite'] ?? 0), 
                $data['valor'] ?? 0, 
                $data['descricao'] ?? ($data['obs'] ?? ''), 
                $datetime
            ]);
            
            $new_id = $pdo->lastInsertId();
            $stmt = $pdo->prepare("SELECT * FROM maintenance WHERE id = ?");
            $stmt->execute([$new_id]);
            $row = $stmt->fetch();
            $row['data'] = formatToISO($row['data']);
            $row['criado_em'] = formatToISO($row['criado_em']);
            $row['valor'] = (float)($row['valor'] ?? 0);
            
            echo json_encode(["success" => true, "data" => $row]);
            break;

        case 'veiculos':
            $sql = "INSERT INTO veiculos (usuario_id, nome, placa, km_atual, tipo, cor) VALUES (?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $userId, 
                $data['nome'], 
                preg_replace('/[^A-Z0-9]/i', '', $data['placa']),
                (int)$data['km_atual'],
                $data['tipo'] ?? 'proprio',
                $data['cor'] ?? ''
            ]);
            
            echo json_encode(["success" => true, "data" => ["id" => $pdo->lastInsertId()]]);
            break;

        default:
             echo json_encode(["success" => false, "error" => "Não implementado para $entity"]);
             break;
    }
}

function getDateClause($filter) {
    switch ($filter) {
        case 'diario': return "DATE(data) = CURDATE()";
        case 'semanal': return "YEARWEEK(data, 1) = YEARWEEK(CURDATE(), 1)";
        case 'mensal': return "MONTH(data) = MONTH(CURDATE()) AND YEAR(data) = YEAR(CURDATE())";
        default: return "1=1";
    }
}
?>
