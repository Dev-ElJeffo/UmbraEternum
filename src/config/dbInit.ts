import { pool } from './database';
import mysql from 'mysql2/promise';
import logger from './logger';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Inicializa o banco de dados criando as tabelas necessárias caso não existam
 */
const initializeDatabase = async (): Promise<void> => {
  try {
    // Configurações para conexão sem banco de dados específico
    const connectionConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '!Mister4126',
    };

    // Conexão sem especificar o banco de dados
    const tempConnection = await mysql.createConnection(connectionConfig);
    
    // Criar o banco de dados se não existir
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'umbraeternum_new'}`);
    logger.info(`Banco de dados ${process.env.DB_NAME || 'umbraeternum_new'} verificado/criado`);
    
    // Fechar conexão temporária
    await tempConnection.end();
    
    // Criar tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
        active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    logger.info('Tabela users verificada/criada');

    // Criar tabela de personagens (sem a foreign key por enquanto)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        class VARCHAR(50) NOT NULL,
        level INT DEFAULT 1,
        experience INT DEFAULT 0,
        health INT DEFAULT 100,
        mana INT DEFAULT 100,
        strength INT DEFAULT 10,
        dexterity INT DEFAULT 10,
        intelligence INT DEFAULT 10,
        wisdom INT DEFAULT 10,
        constitution INT DEFAULT 10,
        charisma INT DEFAULT 10,
        gold INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    logger.info('Tabela characters verificada/criada');

    // Adicionar a foreign key separadamente para evitar problemas
    try {
      await pool.query(`
        ALTER TABLE characters
        ADD CONSTRAINT fk_character_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE;
      `);
      logger.info('Foreign key adicionada à tabela characters');
    } catch (err) {
      logger.warn(`Foreign key já existe ou não pôde ser adicionada: ${err}`);
    }

    // Criar tabela de itens dos personagens (sem a foreign key por enquanto)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS character_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        character_id INT NOT NULL,
        item_id INT NOT NULL,
        quantity INT DEFAULT 1,
        equipped BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_character_id (character_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    logger.info('Tabela character_items verificada/criada');

    // Adicionar a foreign key separadamente para evitar problemas
    try {
      await pool.query(`
        ALTER TABLE character_items
        ADD CONSTRAINT fk_item_character
        FOREIGN KEY (character_id) REFERENCES characters(id)
        ON DELETE CASCADE;
      `);
      logger.info('Foreign key adicionada à tabela character_items');
    } catch (err) {
      logger.warn(`Foreign key já existe ou não pôde ser adicionada: ${err}`);
    }

    // Verificar se existe um usuário admin
    const [adminUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      ['admin', 'admin@umbraeternum.com']
    );

    // Se não existir admin, criar um
    if (!Array.isArray(adminUsers) || adminUsers.length === 0) {
      logger.info('Criando usuário admin padrão...');
      
      // Hash da senha
      const saltRounds = 10;
      const adminPassword = await bcrypt.hash('admin123', saltRounds);
      
      // Inserir usuário admin
      await pool.query(
        `INSERT INTO users (username, email, password, role, active)
         VALUES (?, ?, ?, 'admin', true)`,
        ['admin', 'admin@umbraeternum.com', adminPassword]
      );
      logger.info('Usuário admin criado com sucesso');
    } else {
      logger.info('Usuário admin já existe');
    }

    logger.info('Banco de dados inicializado com sucesso');
  } catch (error) {
    logger.error('Erro ao inicializar o banco de dados:', error);
    throw error;
  }
};

export default initializeDatabase;
