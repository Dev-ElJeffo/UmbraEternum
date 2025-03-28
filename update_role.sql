-- Selecione o banco de dados
USE umbraeternum_new;

-- Atualiza o role do usuário 'jeffo' para 'admin'
UPDATE users 
SET role = 'admin' 
WHERE username = 'jeffo';

-- Verificação (opcional)
SELECT id, username, email, role FROM users WHERE username = 'jeffo'; 