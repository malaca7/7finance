-- Database creation
CREATE DATABASE IF NOT EXISTS malacaco_7finance;
USE malacaco_7finance;

-- Users table
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    tipo VARCHAR(100) DEFAULT 'app',
    role ENUM('admin', 'usuario', 'user') DEFAULT 'usuario',
    status ENUM('ativo', 'inativo', 'bloqueado', 'pendente', 'problema_financeiro') DEFAULT 'ativo',
    veiculo VARCHAR(100),
    placa VARCHAR(10),
    senha_hash VARCHAR(255),
    google_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Earnings table
CREATE TABLE IF NOT EXISTS earnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('corrida', 'gorjeta', 'dinheiro') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    data DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('abastecimento', 'manutencao', 'lavagem', 'pedagio', 'alimentacao', 'aluguel', 'parcela') NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    descricao TEXT,
    data DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- KM Registry table
CREATE TABLE IF NOT EXISTS km_registry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    km_inicial INT,
    km_final INT,
    km_total INT,
    data DATETIME NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Maintenance table
CREATE TABLE IF NOT EXISTS maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('oleo', 'pneus', 'freios', 'revisao', 'documentacao', 'seguro') NOT NULL,
    km_limite INT,
    data_limite DATETIME,
    status ENUM('pendente', 'urgente', 'atrasado', 'concluido') DEFAULT 'pendente',
    obs TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insert default admin
INSERT IGNORE INTO usuarios (nome, email, telefone, veiculo, role, status, created_at, senha_hash)
VALUES ('malaca', 'malaca@malaca.com.br', '81996138924', 'Fiat Cronos', 'admin', 'ativo', CURRENT_TIMESTAMP, '$2y$10$BYVUJUHgaTbJvebtO0MllOkLXUVmh6lx2UhcVOFniZsnwlmZkEMCm');
