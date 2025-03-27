"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
const logger_1 = __importDefault(require("./logger"));
/**
 * Inicializa o banco de dados criando as tabelas necessárias caso não existam
 */
const initializeDatabase = async () => {
    try {
        // Tabela de usuários
        await database_1.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
        avatar_url VARCHAR(255) NULL,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        // Tabela de personagens
        await database_1.pool.query(`
      CREATE TABLE IF NOT EXISTS characters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        class VARCHAR(50) NOT NULL,
        level INT DEFAULT 1,
        experience INT DEFAULT 0,
        health INT DEFAULT 100,
        mana INT DEFAULT 100,
        stamina INT DEFAULT 100,
        strength INT DEFAULT 10,
        dexterity INT DEFAULT 10,
        intelligence INT DEFAULT 10,
        wisdom INT DEFAULT 10,
        constitution INT DEFAULT 10,
        charisma INT DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_active TIMESTAMP NULL,
        status ENUM('active', 'inactive', 'dead') DEFAULT 'active',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        // Tabela de tokens de refresh
        await database_1.pool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        logger_1.default.info('Banco de dados inicializado com sucesso.');
    }
    catch (error) {
        logger_1.default.error('Erro ao inicializar o banco de dados:', error);
        throw error;
    }
};
exports.default = initializeDatabase;
