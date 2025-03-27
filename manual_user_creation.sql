-- Este script pode ser executado no MySQL Workbench para criar e gerenciar usuários manualmente

-- 1. Primeiro, conecte-se ao MySQL com suas credenciais
--    Usuário: root
--    Senha: !Mister4126
--    Host: localhost
--    Porta: 3306

-- 2. Selecione o banco de dados correto
USE umbraeternum_new;

-- 3. Verifique se a tabela de usuários existe
SHOW TABLES LIKE 'users';

-- 4. Se a tabela não existir, crie-a
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

-- 5. Para adicionar um novo usuário manualmente, execute o comando abaixo
--    (Substitua 'nome_usuario', 'email@exemplo.com' e hash da senha conforme necessário)
--    A senha abaixo é 'senha123' com hash bcrypt
INSERT INTO users (username, email, password, role)
VALUES (
  'jogador_teste', 
  'jogador_teste@exemplo.com', 
  '$2b$10$vPYVs4x.E6jYUX2vbaU23Oe3AAs5Gka0c7G95P2.SfihD8NQPwcVS',  -- senha123
  'player'
);

-- 6. Para adicionar um administrador
INSERT INTO users (username, email, password, role)
VALUES (
  'admin_teste', 
  'admin_teste@exemplo.com', 
  '$2b$10$vPYVs4x.E6jYUX2vbaU23Oe3AAs5Gka0c7G95P2.SfihD8NQPwcVS',  -- senha123
  'admin'
);

-- 7. Para listar todos os usuários
SELECT id, username, email, role, active, created_at 
FROM users;

-- 8. Para verificar se um usuário específico existe
--    (Substitua 'nome_usuario' pelo nome de usuário desejado)
SELECT id, username, email, role, active, created_at 
FROM users
WHERE username = 'nome_usuario';

-- 9. Para atualizar a senha de um usuário existente
--    (Substitua 'ID_DO_USUARIO' pelo ID do usuário)
--    (A senha abaixo é 'novasenha123' com hash bcrypt)
UPDATE users 
SET password = '$2b$10$vPYVs4x.E6jYUX2vbaU23Oe3AAs5Gka0c7G95P2.SfihD8NQPwcVS' 
WHERE id = ID_DO_USUARIO;

-- 10. Para desativar um usuário
--     (Substitua 'ID_DO_USUARIO' pelo ID do usuário)
UPDATE users 
SET active = FALSE
WHERE id = ID_DO_USUARIO;

-- 11. Para reativar um usuário
--     (Substitua 'ID_DO_USUARIO' pelo ID do usuário)
UPDATE users 
SET active = TRUE
WHERE id = ID_DO_USUARIO; 