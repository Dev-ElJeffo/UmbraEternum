const { pool, testConnection, executeQuery } = require('./database');
const { logger } = require('./logger');
const fs = require('fs');
const path = require('path');

// Função para inicializar o banco de dados
const initDb = async () => {
  try {
    console.log('Iniciando inicialização do banco de dados...');
    logger.info('Iniciando inicialização do banco de dados...');

    // Testar conexão com o banco de dados
    await testConnection();

    // Verificar se as tabelas existem
    console.log('Verificando tabelas existentes...');
    const [tables] = await pool.query('SHOW TABLES');
    const tableNames = tables.map((table) => Object.values(table)[0]);

    console.log(
      `Tabelas encontradas (${tableNames.length}): ${tableNames.join(', ') || 'Nenhuma'}`
    );
    logger.info(
      `Tabelas encontradas (${tableNames.length}): ${tableNames.join(', ') || 'Nenhuma'}`
    );

    // Se a tabela de usuários não existir, criar tabelas
    if (!tableNames.includes('users')) {
      console.log('Tabela "users" não encontrada. Criando todas as tabelas...');
      logger.info('Tabela "users" não encontrada. Criando todas as tabelas...');

      // Carregar e executar script SQL para criar tabelas
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      if (fs.existsSync(schemaPath)) {
        console.log(`Arquivo de schema encontrado: ${schemaPath}`);
        logger.info(`Arquivo de schema encontrado: ${schemaPath}`);

        const schema = fs.readFileSync(schemaPath, 'utf8');
        const statements = schema.split(';').filter((stmt) => stmt.trim() !== '');

        console.log(`Executando ${statements.length} comandos SQL...`);
        logger.info(`Executando ${statements.length} comandos SQL...`);

        for (const statement of statements) {
          try {
            await pool.query(statement);
          } catch (err) {
            console.error(`Erro ao executar SQL: ${err.message}`);
            logger.error(`Erro ao executar SQL: ${err.message}`);
            console.error('Comando SQL que causou o erro:');
            console.error(statement);
            // Continuar mesmo com erro
          }
        }

        console.log('Tabelas criadas com sucesso!');
        logger.info('Tabelas criadas com sucesso!');

        // Verificar novamente as tabelas criadas
        const [newTables] = await pool.query('SHOW TABLES');
        const newTableNames = newTables.map((table) => Object.values(table)[0]);
        console.log(`Tabelas após criação (${newTableNames.length}): ${newTableNames.join(', ')}`);
        logger.info(`Tabelas após criação (${newTableNames.length}): ${newTableNames.join(', ')}`);
      } else {
        console.warn(`Arquivo de schema SQL não encontrado: ${schemaPath}`);
        logger.warn(`Arquivo de schema SQL não encontrado: ${schemaPath}`);
      }
    } else {
      console.log('Tabela "users" já existe. Não é necessário criar tabelas.');
      logger.info('Tabela "users" já existe. Não é necessário criar tabelas.');
    }

    // Verificar se já existe um usuário admin
    console.log('Verificando se existe usuário admin...');
    logger.info('Verificando se existe usuário admin...');

    const [admins] = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");

    // Criar usuário admin se não existir
    if (admins.length === 0) {
      console.log('Nenhum usuário admin encontrado. Criando usuário admin padrão...');
      logger.info('Nenhum usuário admin encontrado. Criando usuário admin padrão...');

      const User = require('../models/User');
      await User.create({
        username: 'admin',
        email: 'admin@umbraeternum.com',
        password: 'Admin@123',
        role: 'admin',
      });

      console.log('Usuário admin criado com sucesso!');
      logger.info('Usuário admin criado com sucesso!');
    } else {
      console.log('Usuário admin já existe. ID:', admins[0].id);
      logger.info('Usuário admin já existe.');
    }

    console.log('Inicialização do banco de dados concluída com sucesso!');
    logger.info('Inicialização do banco de dados concluída com sucesso!');
    return true;
  } catch (error) {
    console.error(`Erro ao inicializar o banco de dados: ${error.message}`);
    logger.error(`Erro ao inicializar o banco de dados: ${error.message}`, { error });
    throw error;
  }
};

module.exports = { initDb };
