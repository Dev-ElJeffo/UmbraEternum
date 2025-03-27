-- Script para criar a tabela de usuários e inserir um usuário de teste

-- Use o banco de dados correto
USE umbraeternum_new;

-- Crie a tabela users se ela não existir
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Inserir um usuário de teste com senha 'senha123'
-- A senha já está com hash usando bcrypt (mas você pode alterá-la no MySQL Workbench)
INSERT INTO users (username, email, password, role)
VALUES (
  'jogador1', 
  'jogador1@example.com', 
  '$2b$10$vPYVs4x.E6jYUX2vbaU23Oe3AAs5Gka0c7G95P2.SfihD8NQPwcVS',  -- senha123
  'player'
);

-- Para criar um usuário administrador
INSERT INTO users (username, email, password, role)
VALUES (
  'admin', 
  'admin@umbraeternum.com', 
  '$2b$10$vPYVs4x.E6jYUX2vbaU23Oe3AAs5Gka0c7G95P2.SfihD8NQPwcVS',  -- senha123
  'admin'
);

-- Verificar os usuários criados
SELECT id, username, email, role, active, created_at FROM users; 