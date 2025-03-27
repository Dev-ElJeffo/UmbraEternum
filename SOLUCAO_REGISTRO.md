# Solução para o Problema de Registro de Usuários

## Problema Identificado

O problema "Resposta inválida do servidor" ao tentar registrar um usuário pode ocorrer por diversos motivos:

1. O servidor Node.js não está em execução ou não está acessível
2. A tabela `users` não existe no banco de dados
3. Problemas de conexão com o banco de dados
4. Inconsistências entre as configurações no arquivo `.env` e nos arquivos de código

## Solução Implementada

Foram implementadas várias correções para solucionar o problema:

1. **Arquivos SQL para criação manual de usuários**:
   - `users_setup.sql`: Script para criar a tabela de usuários e inserir usuários de teste
   - `manual_user_creation.sql`: Instruções detalhadas para gerenciar usuários no MySQL Workbench

2. **Correções no arquivo de configuração do banco de dados** (`src/config/database.js`):
   - Melhor detecção do arquivo `.env`
   - Criação automática da tabela `users` se não existir
   - Logs mais detalhados para diagnosticar problemas

3. **Melhorias no modelo de usuário** (`src/models/User.js`):
   - Tratamento mais robusto de erros específicos como entrada duplicada
   - Logs detalhados para facilitar a depuração
   - Criação automática da tabela se não existir

4. **Melhorias no arquivo de configuração PHP** (`config.php`):
   - Leitura das configurações do banco de dados diretamente do arquivo `.env`
   - Melhoria no tratamento de erros de conexão com o servidor
   - Mensagens de erro mais específicas

## Como Registrar um Usuário Manualmente

Se o problema persistir mesmo após as correções, você pode inserir um usuário diretamente no banco de dados:

1. Abra o MySQL Workbench e conecte-se ao seu servidor MySQL
2. Use as credenciais definidas no arquivo `.env`:
   - Host: `localhost`
   - Porta: `3306`
   - Usuário: `root`
   - Senha: `!Mister4126`

3. Execute o script `users_setup.sql` ou use o seguinte comando:

```sql
USE umbraeternum_new;

-- Verificar se a tabela existe
SHOW TABLES LIKE 'users';

-- Criar a tabela se não existir
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

-- Inserir um usuário (a senha 'senha123' já com hash bcrypt)
INSERT INTO users (username, email, password, role)
VALUES (
  'seu_usuario', 
  'seu_email@example.com', 
  '$2b$10$vPYVs4x.E6jYUX2vbaU23Oe3AAs5Gka0c7G95P2.SfihD8NQPwcVS',  -- senha123
  'player'
);
```

## Verificando o Status do Servidor

Para verificar se o servidor Node.js está em execução:

1. Abra um terminal (PowerShell ou Prompt de Comando)
2. Navegue até a pasta do projeto: `cd C:\wamp64\www\UmbraEternum`
3. Execute o comando: `npm run dev`

Se o servidor não iniciar, verifique os logs de erro para identificar o problema.

## Testando a Conexão com o Banco de Dados

Para verificar se a conexão com o banco de dados está funcionando:

1. No MySQL Workbench, execute:
   ```sql
   SHOW DATABASES;
   USE umbraeternum_new;
   SHOW TABLES;
   ```

2. Verifique se as variáveis de ambiente no arquivo `.env` estão corretas:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=!Mister4126
   DB_NAME=umbraeternum_new
   ```

## Após Resolver o Problema

Depois de implementar as correções, reinicie o servidor Node.js e tente registrar um usuário novamente através da interface web. Se o problema persistir, verifique os logs do servidor para obter mais detalhes sobre o erro. 