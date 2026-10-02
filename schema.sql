PRAGMA foreign_keys = ON;

-- ============================================================
-- USUÁRIOS
-- ============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CLIENTES
-- ============================================================

CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cpf_encrypted TEXT NOT NULL UNIQUE,
    cpf_hash TEXT NOT NULL UNIQUE,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- VEÍCULOS
-- ============================================================

CREATE TABLE IF NOT EXISTS veiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    placa TEXT NOT NULL UNIQUE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    ano INTEGER NOT NULL CHECK (ano BETWEEN 1900 AND 2100),
    criado_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_veiculo_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- ORDENS DE SERVIÇO
-- ============================================================

CREATE TABLE IF NOT EXISTS ordens_servico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    veiculo_id INTEGER NOT NULL,
    descricao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ABERTA'
        CHECK (status IN ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA')),
    valor REAL NOT NULL DEFAULT 0 CHECK (valor >= 0),
    aberta_em TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluida_em TEXT,

    CONSTRAINT fk_os_cliente
        FOREIGN KEY (cliente_id)
        REFERENCES clientes(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_os_veiculo
        FOREIGN KEY (veiculo_id)
        REFERENCES veiculos(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_clientes_nome
ON clientes(nome);

CREATE INDEX IF NOT EXISTS idx_clientes_cpf_hash
ON clientes(cpf_hash);

CREATE INDEX IF NOT EXISTS idx_veiculos_cliente
ON veiculos(cliente_id);

CREATE INDEX IF NOT EXISTS idx_os_data
ON ordens_servico(aberta_em DESC);

CREATE INDEX IF NOT EXISTS idx_os_cliente
ON ordens_servico(cliente_id);

CREATE INDEX IF NOT EXISTS idx_os_veiculo
ON ordens_servico(veiculo_id);

-- ============================================================
-- 3 USUÁRIOS DE TESTE
-- senha dos três: 123456
-- ============================================================

INSERT INTO usuarios (nome, email, senha_hash)
VALUES
    ('Administrador', 'admin@oficina.local', hash_password('123456'));

INSERT INTO usuarios (nome, email, senha_hash)
VALUES
    ('João da Silva', 'joao@oficina.local', hash_password('123456'));

INSERT INTO usuarios (nome, email, senha_hash)
VALUES
    ('Maria Oliveira', 'maria@oficina.local', hash_password('123456'));

-- ============================================================
-- 3 CLIENTES DE TESTE
-- Os CPFs são dados fictícios de teste.
-- ============================================================

INSERT INTO clientes
    (nome, cpf_encrypted, cpf_hash, telefone, email, endereco)
VALUES
    (
        'Carlos Henrique',
        encrypt_cpf('11111111111'),
        hash_cpf('11111111111'),
        '(81) 99999-1111',
        'carlos@email.com',
        'Rua A, 100 - Centro'
    );

INSERT INTO clientes
    (nome, cpf_encrypted, cpf_hash, telefone, email, endereco)
VALUES
    (
        'Ana Beatriz',
        encrypt_cpf('22222222222'),
        hash_cpf('22222222222'),
        '(81) 99999-2222',
        'ana@email.com',
        'Rua B, 200 - Maurício de Nassau'
    );

INSERT INTO clientes
    (nome, cpf_encrypted, cpf_hash, telefone, email, endereco)
VALUES
    (
        'Pedro Santos',
        encrypt_cpf('33333333333'),
        hash_cpf('33333333333'),
        '(81) 99999-3333',
        'pedro@email.com',
        'Rua C, 300 - Indianópolis'
    );

-- ============================================================
-- 3 VEÍCULOS DE TESTE
-- ============================================================

INSERT INTO veiculos
    (cliente_id, placa, marca, modelo, ano)
VALUES
    (1, 'ABC1D23', 'Toyota', 'Corolla', 2022);

INSERT INTO veiculos
    (cliente_id, placa, marca, modelo, ano)
VALUES
    (2, 'DEF4G56', 'Honda', 'Civic', 2021);

INSERT INTO veiculos
    (cliente_id, placa, marca, modelo, ano)
VALUES
    (3, 'GHI7J89', 'Chevrolet', 'Onix', 2023);

-- ============================================================
-- 3 ORDENS DE SERVIÇO
-- ============================================================

INSERT INTO ordens_servico
    (cliente_id, veiculo_id, descricao, status, valor, aberta_em, concluida_em)
VALUES
    (
        1,
        1,
        'Troca de óleo e filtros',
        'CONCLUIDA',
        350.00,
        '2026-09-25 08:30:00',
        '2026-09-25 11:00:00'
    );

INSERT INTO ordens_servico
    (cliente_id, veiculo_id, descricao, status, valor, aberta_em)
VALUES
    (
        2,
        2,
        'Revisão completa do sistema de freios',
        'EM_ANDAMENTO',
        780.00,
        '2026-09-28 09:15:00'
    );

INSERT INTO ordens_servico
    (cliente_id, veiculo_id, descricao, status, valor, aberta_em)
VALUES
    (
        3,
        3,
        'Diagnóstico eletrônico e manutenção preventiva',
        'ABERTA',
        250.00,
        '2026-10-01 14:00:00'
    );
