CREATE DATABASE malaca_finance;
USE malaca_finance;

-- =========================
-- TABELA DE USUÁRIOS
-- =========================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    tipo ENUM('particular', 'app') DEFAULT 'app',
    role ENUM('admin', 'usuario') DEFAULT 'usuario',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- GANHOS (RECEITAS)
-- =========================
CREATE TABLE ganhos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('corrida', 'gorjeta', 'extra') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_ganhos_usuario ON ganhos(usuario_id);
CREATE INDEX idx_ganhos_data ON ganhos(data);

-- =========================
-- DESPESAS
-- =========================
CREATE TABLE despesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM(
        'abastecimento',
        'manutencao',
        'lavagem',
        'pedagio',
        'alimentacao',
        'aluguel',
        'parcelas'
    ) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    descricao TEXT,
    data DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_despesas_usuario ON despesas(usuario_id);
CREATE INDEX idx_despesas_data ON despesas(data);

-- =========================
-- REGISTRO DE KM
-- =========================
CREATE TABLE km_registros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    km_inicial INT NOT NULL,
    km_final INT NOT NULL,
    km_total INT GENERATED ALWAYS AS (km_final - km_inicial) STORED,
    data DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_km_usuario ON km_registros(usuario_id);
CREATE INDEX idx_km_data ON km_registros(data);

-- =========================
-- MANUTENÇÕES
-- =========================
CREATE TABLE manutencoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM(
        'oleo',
        'pneus',
        'freios',
        'revisao',
        'documentacao',
        'seguro'
    ) NOT NULL,
    km_limite INT,
    data_limite DATE,
    status ENUM('pendente', 'concluido', 'atrasado') DEFAULT 'pendente',
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_manutencoes_usuario ON manutencoes(usuario_id);

-- =========================
-- LOGS (AUDITORIA)
-- =========================
CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    acao VARCHAR(100),
    descricao TEXT,
    data TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- =========================
-- RESERVAS (COFRINHO)
-- =========================
CREATE TABLE reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo ENUM('entrada', 'saida') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    meta DECIMAL(10,2),
    descricao TEXT,
    data DATE NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE INDEX idx_reservas_usuario ON reservas(usuario_id);

-- =========================
-- CONFIGURAÇÕES DO USUÁRIO
-- =========================
CREATE TABLE configuracoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    notificacoes BOOLEAN DEFAULT TRUE,
    meta_mensal DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- =========================
-- ADMIN PADRÃO (OPCIONAL)
-- =========================
INSERT INTO usuarios (nome, email, telefone, role)
VALUES ('Administrador', 'admin@malaca.com', '000000000', 'admin');