const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do arquivo .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Carregando variáveis de ambiente de: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`Arquivo .env não encontrado em: ${envPath}`);
  dotenv.config();
}

// Carregar configuração do banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'umbraeternum',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Usar SSL/TLS para conexão segura quando em produção
  ...(process.env.NODE_ENV === 'production' && {
    ssl: { rejectUnauthorized: true }
  })
};

console.log(`Configuração do banco de dados carregada:
- Host: ${dbConfig.host}
- Porta: ${dbConfig.port}
- Usuário: ${dbConfig.user}
- Banco de dados: ${dbConfig.database}
- Ambiente: ${process.env.NODE_ENV || 'development'}`);

// Criar pool de conexões
let pool;

try {
  pool = mysql.createPool(dbConfig);
  console.log('Pool de conexões do banco de dados criado com sucesso');
} catch (error) {
  console.error('Erro ao criar pool de conexões:', error.message);
  process.exit(1);
}

// Testar conexão
const testConnection = async () => {
  try {
    console.log('Testando conexão com o banco de dados...');
    const connection = await pool.getConnection();
    console.log(`Conexão com o banco de dados estabelecida com sucesso: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    // Verificar se o banco de dados existe
    const [databases] = await connection.query('SHOW DATABASES');
    const databaseExists = databases.some(db => Object.values(db)[0] === dbConfig.database);
    
    if (!databaseExists) {
      console.log(`Banco de dados '${dbConfig.database}' não encontrado, criando...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log(`Banco de dados '${dbConfig.database}' criado com sucesso`);
    } else {
      console.log(`Banco de dados '${dbConfig.database}' encontrado`);
    }
    
    // Selecionar o banco de dados
    await connection.query(`USE ${dbConfig.database}`);
    console.log(`Usando banco de dados: ${dbConfig.database}`);
    
    // Verificar se a tabela de usuários existe
    try {
      const [tables] = await connection.query('SHOW TABLES LIKE "users"');
      if (tables.length === 0) {
        console.log('Tabela de usuários não encontrada, criando...');
        await connection.query(`
          CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
            active BOOLEAN NOT NULL DEFAULT TRUE,
            last_login_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('Tabela de usuários criada com sucesso');
      } else {
        console.log('Tabela de usuários encontrada');
      }
    } catch (tableError) {
      console.error('Erro ao verificar tabela de usuários:', tableError.message);
    }
    
    // Verificar se a tabela de tokens de atualização existe
    try {
      const [tables] = await connection.query('SHOW TABLES LIKE "refresh_tokens"');
      if (tables.length === 0) {
        console.log('Tabela de tokens de atualização não encontrada, criando...');
        await connection.query(`
          CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (user_id),
            INDEX (token)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('Tabela de tokens de atualização criada com sucesso');
      } else {
        console.log('Tabela de tokens de atualização encontrada');
      }
    } catch (tableError) {
      console.error('Erro ao verificar tabela de tokens de atualização:', tableError.message);
    }
    
    connection.release();
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error.message);
    
    // Verificar erros específicos
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Acesso negado. Verifique o usuário e senha do banco de dados');
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`Não foi possível conectar ao servidor MySQL em ${dbConfig.host}:${dbConfig.port}. Verifique se o servidor está em execução.`);
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error(`Banco de dados '${dbConfig.database}' não existe. Será criado automaticamente.`);
      try {
        const tempConnection = await mysql.createConnection({
          host: dbConfig.host,
          port: dbConfig.port,
          user: dbConfig.user,
          password: dbConfig.password
        });
        
        await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        console.log(`Banco de dados '${dbConfig.database}' criado com sucesso`);
        await tempConnection.end();
        
        // Testar a conexão novamente
        return await testConnection();
      } catch (createError) {
        console.error('Erro ao criar banco de dados:', createError.message);
      }
    }
    
    throw error;
  }
};

// Executar uma query com tratamento de erros
const executeQuery = async (sql, params = []) => {
  try {
    const [result] = await pool.query(sql, params);
    return result;
  } catch (error) {
    console.error(`Erro ao executar query: ${sql}`, error.message);
    throw error;
  }
};

module.exports = { 
  pool, 
  testConnection,
  executeQuery,
  dbConfig
}; 