<?php
/**
 * 7finance - Auth Microservice
 * Handles Login, Registration, and Token Generation
 */
require_once 'db_config.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method !== 'POST') {
    echo json_encode(["success" => false, "error" => "Method Not Allowed"]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(["success" => false, "error" => "No JSON body provided"]);
    exit();
}

function generateToken($user_id) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload = json_encode(['user_id' => $user_id, 'exp' => time() + (86400 * 7)]); // 7 days
    $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, 'secret_key_123', true);
    $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

try {
    switch ($action) {
        case 'login':
            if (!isset($input['telefone']) || !isset($input['password'])) {
                echo json_encode(["success" => false, "error" => "Telefone e senha são obrigatórios"]);
                exit();
            }
            $telefone = preg_replace('/[^0-9]/', '', $input['telefone']);
            
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE telefone = ?");
            $stmt->execute([$telefone]);
            $user = $stmt->fetch();
            
            if ($user && $input['password'] === $user['senha']) {
                unset($user['senha']); // Security: Don't return password string
                $token = generateToken($user['id']);
                echo json_encode(["success" => true, "data" => ["user" => $user, "token" => $token]]);
            } else {
                echo json_encode(["success" => false, "error" => "Telefone ou senha inválidos"]);
            }
            break;

        case 'register':
            $required = ['nome', 'telefone', 'tipo', 'password'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    echo json_encode(["success" => false, "error" => "Campo obrigatório ausente: $field"]);
                    exit();
                }
            }

            $telefone = preg_replace('/[^0-9]/', '', $input['telefone']);
            $email = $input['email'] ?? ($telefone . '@7finance.com.br');

            // Check if phone already exists
            $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE telefone = ?");
            $stmt->execute([$telefone]);
            if ($stmt->fetch()) {
                echo json_encode(["success" => false, "error" => "Este número de telefone já está cadastrado"]);
                exit();
            }

            $password = $input['password'];
            $role = isset($input['role']) ? $input['role'] : 'usuario';
            $status = 'ativo';

            $sql = "INSERT INTO usuarios (nome, email, telefone, tipo, role, status, veiculo, placa, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['nome'],
                $email,
                $telefone, // SALVA O TELEFONE JÁ LIMPO (SOMENTE NÚMEROS)
                $input['tipo'],
                $role,
                $status,
                $input['veiculo'] ?? null,
                $input['placa'] ?? null,
                $password
            ]);

            $new_user_id = $pdo->lastInsertId();
            $token = generateToken($new_user_id);
            
            // Fetch newly created user for return
            $stmt = $pdo->prepare("SELECT id, nome, email, telefone, tipo, role, status, veiculo, placa, created_at FROM usuarios WHERE id = ?");
            $stmt->execute([$new_user_id]);
            $new_user = $stmt->fetch();

            echo json_encode(["success" => true, "data" => ["user" => $new_user, "token" => $token]]);
            break;

        case 'google':
            if (!isset($input['email']) || !isset($input['google_id'])) {
                echo json_encode(["success" => false, "error" => "Missing google payload"]);
                exit();
            }
            $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
            $google_id = $input['google_id'];
            $nome = $input['nome'] ?? 'Google User';
            
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE email = ?");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user) {
                // Update google_id if missing
                if (!$user['google_id']) {
                    $pdo->prepare("UPDATE usuarios SET google_id = ? WHERE id = ?")->execute([$google_id, $user['id']]);
                }
                unset($user['senha']);
                $token = generateToken($user['id']);
                echo json_encode(["success" => true, "data" => ["user" => $user, "token" => $token]]);
            } else {
                // Auto create (Registrar novo usuário via Google)
                $sql = "INSERT INTO usuarios (nome, email, tipo, role, status, google_id, senha) VALUES (?, ?, 'app', 'usuario', 'ativo', ?, 'google_auth_no_pass')";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$nome, $email, $google_id]);
                $new_id = $pdo->lastInsertId();
                
                $token = generateToken($new_id);
                
                $stmt = $pdo->prepare("SELECT id, nome, email, tipo, role, status, created_at FROM usuarios WHERE id = ?");
                $stmt->execute([$new_id]);
                $new_user = $stmt->fetch();
                echo json_encode(["success" => true, "data" => ["user" => $new_user, "token" => $token]]);
            }
            break;

        default:
            echo json_encode(["success" => false, "error" => "Invalid action"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => "Server Error: " . $e->getMessage()]);
}
?>
