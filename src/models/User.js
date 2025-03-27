const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { logger } = require('../config/logger');

class User {
  constructor(data = {}) {
    this.id = data.id || null;
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || '';
    this.role = data.role || 'player';
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.created_at || new Date();
    this.updatedAt = data.updated_at || new Date();
  }

  // Buscar usuário pelo ID
  static async findById(id) {
    try {
      logger.debug(`Buscando usuário com ID: ${id}`);
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE id = ? AND active = true',
        [id]
      );
      
      if (rows.length === 0) {
        logger.debug(`Nenhum usuário encontrado com ID: ${id}`);
        return null;
      }
      
      logger.debug(`Usuário encontrado: ${rows[0].username}`);
      return new User(rows[0]);
    } catch (error) {
      logger.error(`Erro ao buscar usuário por ID: ${error.message}`, { error });
      throw error;
    }
  }

  // Buscar usuário pelo nome de usuário
  static async findByUsername(username) {
    try {
      logger.debug(`Buscando usuário com nome: ${username}`);
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      if (rows.length === 0) {
        logger.debug(`Nenhum usuário encontrado com nome: ${username}`);
        return null;
      }
      
      logger.debug(`Usuário encontrado: ${rows[0].username} (ID: ${rows[0].id})`);
      return new User(rows[0]);
    } catch (error) {
      logger.error(`Erro ao buscar usuário por nome: ${error.message}`, { error });
      throw error;
    }
  }

  // Buscar usuário pelo email
  static async findByEmail(email) {
    try {
      logger.debug(`Buscando usuário com email: ${email}`);
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      if (rows.length === 0) {
        logger.debug(`Nenhum usuário encontrado com email: ${email}`);
        return null;
      }
      
      logger.debug(`Usuário encontrado: ${rows[0].username} (ID: ${rows[0].id})`);
      return new User(rows[0]);
    } catch (error) {
      logger.error(`Erro ao buscar usuário por email: ${error.message}`, { error });
      throw error;
    }
  }

  // Verificar senha
  async verifyPassword(password) {
    try {
      logger.debug(`Verificando senha para usuário: ${this.username}`);
      const result = await bcrypt.compare(password, this.password);
      logger.debug(`Resultado da verificação de senha: ${result ? 'válida' : 'inválida'}`);
      return result;
    } catch (error) {
      logger.error(`Erro ao verificar senha: ${error.message}`, { error });
      throw error;
    }
  }

  // Criar um novo usuário
  static async create(userData) {
    try {
      logger.info(`Tentando criar novo usuário: ${userData.username}, email: ${userData.email}`);
      
      // Verificar se a tabela users existe antes de continuar
      try {
        const [tables] = await pool.query('SHOW TABLES LIKE "users"');
        if (tables.length === 0) {
          logger.warn('Tabela de usuários não encontrada, criando automaticamente');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(100) NOT NULL UNIQUE,
              email VARCHAR(255) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL,
              role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
              active BOOLEAN NOT NULL DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
          `);
          logger.info('Tabela de usuários criada com sucesso');
        }
      } catch (tableError) {
        logger.error(`Erro ao verificar/criar tabela de usuários: ${tableError.message}`, { error: tableError });
        throw tableError;
      }
      
      // Hash da senha
      const saltRounds = 10;
      logger.debug('Gerando hash da senha');
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      logger.debug('Hash da senha gerado com sucesso');
      
      logger.debug('Inserindo usuário no banco de dados');
      const [result] = await pool.query(
        `INSERT INTO users (username, email, password, role) 
         VALUES (?, ?, ?, ?)`,
        [userData.username, userData.email, hashedPassword, userData.role || 'player']
      );
      
      if (!result || !result.insertId) {
        throw new Error('Falha ao inserir usuário no banco de dados: Nenhum ID retornado');
      }
      
      logger.info(`Usuário criado com sucesso, ID: ${result.insertId}`);
      const newUser = await User.findById(result.insertId);
      
      if (!newUser) {
        throw new Error(`Usuário criado mas não encontrado após a criação. ID: ${result.insertId}`);
      }
      
      return newUser;
    } catch (error) {
      // Verificar erros específicos de MySQL
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('username')) {
          logger.warn(`Tentativa de criar usuário com nome duplicado: ${userData.username}`);
          const customError = new Error('Nome de usuário já está em uso');
          customError.code = 'USERNAME_EXISTS';
          throw customError;
        } else if (error.message.includes('email')) {
          logger.warn(`Tentativa de criar usuário com email duplicado: ${userData.email}`);
          const customError = new Error('Email já está em uso');
          customError.code = 'EMAIL_EXISTS';
          throw customError;
        }
      } else if (error.code === 'ER_NO_SUCH_TABLE') {
        logger.error('Tabela de usuários não existe. Verificando configuração do banco de dados.', { error });
        
        // Tentar criar a tabela
        try {
          logger.info('Tentando criar tabela de usuários automaticamente');
          await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
              id INT AUTO_INCREMENT PRIMARY KEY,
              username VARCHAR(100) NOT NULL UNIQUE,
              email VARCHAR(255) NOT NULL UNIQUE,
              password VARCHAR(255) NOT NULL,
              role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
              active BOOLEAN NOT NULL DEFAULT TRUE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
          `);
          logger.info('Tabela de usuários criada com sucesso, tentando criar usuário novamente');
          
          // Tentar criar o usuário novamente
          return await User.create(userData);
        } catch (tableError) {
          logger.error(`Erro ao criar tabela de usuários: ${tableError.message}`, { error: tableError });
          throw new Error(`Falha ao criar tabela de usuários: ${tableError.message}`);
        }
      }
      
      logger.error(`Erro ao criar usuário: ${error.message}`, { error });
      throw error;
    }
  }

  // Atualizar usuário
  async update(updates) {
    try {
      logger.debug(`Atualizando usuário: ${this.username} (ID: ${this.id})`);
      
      // Se a senha for atualizada, hash ela primeiro
      if (updates.password) {
        const saltRounds = 10;
        logger.debug('Gerando hash para nova senha');
        updates.password = await bcrypt.hash(updates.password, saltRounds);
      }
      
      // Construir a query dinamicamente com base nos campos a atualizar
      const keys = Object.keys(updates).filter(key => key !== 'id');
      if (keys.length === 0) {
        logger.debug('Nenhum campo para atualizar');
        return this;
      }
      
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = keys.map(key => updates[key]);
      values.push(this.id);
      
      logger.debug(`Executando atualização com campos: ${keys.join(', ')}`);
      await pool.query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = ?`,
        values
      );
      
      // Obter o usuário atualizado
      logger.debug('Obtendo usuário atualizado');
      const updatedUser = await User.findById(this.id);
      return updatedUser;
    } catch (error) {
      logger.error(`Erro ao atualizar usuário: ${error.message}`, { error });
      throw error;
    }
  }

  // Desativar usuário (soft delete)
  async deactivate() {
    try {
      logger.info(`Desativando usuário: ${this.username} (ID: ${this.id})`);
      await pool.query(
        'UPDATE users SET active = false, updated_at = NOW() WHERE id = ?',
        [this.id]
      );
      
      this.active = false;
      logger.info(`Usuário desativado com sucesso: ${this.username}`);
      return this;
    } catch (error) {
      logger.error(`Erro ao desativar usuário: ${error.message}`, { error });
      throw error;
    }
  }

  // Listar todos os usuários
  static async findAll(limit = 100, offset = 0) {
    try {
      logger.debug(`Listando usuários (limit: ${limit}, offset: ${offset})`);
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE active = true ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      );
      
      logger.debug(`${rows.length} usuários encontrados`);
      return rows.map(row => new User(row));
    } catch (error) {
      logger.error(`Erro ao listar usuários: ${error.message}`, { error });
      throw error;
    }
  }

  // Atualizar a data do último login
  static async updateLastLogin(userId) {
    try {
      logger.debug(`Atualizando último login para usuário ID: ${userId}`);
      
      // Verificar se a coluna last_login_at existe
      try {
        const [columns] = await pool.query('SHOW COLUMNS FROM users LIKE "last_login_at"');
        if (columns.length === 0) {
          logger.info('Coluna last_login_at não encontrada, adicionando...');
          await pool.query('ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL');
          logger.info('Coluna last_login_at adicionada com sucesso');
        }
      } catch (error) {
        logger.error(`Erro ao verificar coluna last_login_at: ${error.message}`, { error });
      }
      
      await pool.query(
        'UPDATE users SET last_login_at = NOW() WHERE id = ?',
        [userId]
      );
      
      logger.debug(`Último login atualizado para usuário ID: ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Erro ao atualizar último login: ${error.message}`, { error });
      return false;
    }
  }

  // Verificar a senha diretamente passando o objeto do usuário
  static async verifyPassword(user, password) {
    try {
      logger.debug(`Verificando senha para usuário: ${user.username}`);
      if (!user || !user.password) {
        logger.warn('Tentativa de verificar senha sem usuário ou sem senha armazenada');
        return false;
      }
      
      const result = await bcrypt.compare(password, user.password);
      logger.debug(`Resultado da verificação de senha: ${result ? 'válida' : 'inválida'}`);
      return result;
    } catch (error) {
      logger.error(`Erro ao verificar senha: ${error.message}`, { error });
      return false;
    }
  }
}

module.exports = User; 