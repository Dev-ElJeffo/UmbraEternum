const crypto = require('crypto');
const { pool } = require('../config/database');
const { logger } = require('../config/logger');

class RefreshToken {
  constructor(data = {}) {
    this.id = data.id || null;
    this.user_id = data.user_id || null;
    this.token = data.token || '';
    this.expires_at = data.expires_at || null;
    this.created_at = data.created_at || new Date();
  }

  // Criar um novo token de atualização para um usuário
  static async create(userId, expiresIn = '7d') {
    try {
      logger.debug(`Criando token de atualização para usuário ID: ${userId}`);

      // Verificar se a tabela refresh_tokens existe
      const [tables] = await pool.query('SHOW TABLES LIKE "refresh_tokens"');
      if (tables.length === 0) {
        logger.info('Tabela refresh_tokens não encontrada, criando...');
        await pool.query(`
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
        logger.info('Tabela refresh_tokens criada com sucesso');
      }

      // Gerar token aleatório
      const token = crypto.randomBytes(40).toString('hex');

      // Calcular data de expiração
      const expiresInMs = parseExpirationToMs(expiresIn);
      const expiresAt = new Date(Date.now() + expiresInMs);

      // Limpar tokens antigos deste usuário
      await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);

      // Inserir novo token
      const [result] = await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at) 
         VALUES (?, ?, ?)`,
        [userId, token, expiresAt]
      );

      logger.info(`Token de atualização criado com sucesso para usuário ID: ${userId}`);
      return new RefreshToken({
        id: result.insertId,
        user_id: userId,
        token,
        expires_at: expiresAt,
      });
    } catch (error) {
      logger.error(`Erro ao criar token de atualização: ${error.message}`, { error });
      throw error;
    }
  }

  // Verificar se um token é válido
  static async verifyToken(token) {
    try {
      logger.debug(`Verificando token de atualização: ${token.substring(0, 10)}...`);
      const [rows] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
        [token]
      );

      const isValid = rows.length > 0;
      logger.debug(`Token de atualização ${isValid ? 'válido' : 'inválido'}`);
      return isValid;
    } catch (error) {
      logger.error(`Erro ao verificar token de atualização: ${error.message}`, { error });
      return false;
    }
  }

  // Encontrar token pelo valor
  static async findByToken(token) {
    try {
      logger.debug(`Buscando token de atualização: ${token.substring(0, 10)}...`);
      const [rows] = await pool.query('SELECT * FROM refresh_tokens WHERE token = ?', [token]);

      if (rows.length === 0) {
        logger.debug('Token de atualização não encontrado');
        return null;
      }

      logger.debug(`Token de atualização encontrado, ID: ${rows[0].id}`);
      return new RefreshToken(rows[0]);
    } catch (error) {
      logger.error(`Erro ao buscar token de atualização: ${error.message}`, { error });
      throw error;
    }
  }

  // Excluir um token
  static async delete(token) {
    try {
      logger.debug(`Excluindo token de atualização: ${token.substring(0, 10)}...`);
      const [result] = await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);

      const deleted = result.affectedRows > 0;
      logger.debug(`Token de atualização ${deleted ? 'excluído com sucesso' : 'não encontrado'}`);
      return deleted;
    } catch (error) {
      logger.error(`Erro ao excluir token de atualização: ${error.message}`, { error });
      throw error;
    }
  }

  // Excluir tokens expirados (para manutenção)
  static async deleteExpired() {
    try {
      logger.debug('Excluindo tokens de atualização expirados');
      const [result] = await pool.query('DELETE FROM refresh_tokens WHERE expires_at <= NOW()');

      logger.info(`${result.affectedRows} tokens de atualização expirados excluídos`);
      return result.affectedRows;
    } catch (error) {
      logger.error(`Erro ao excluir tokens expirados: ${error.message}`, { error });
      throw error;
    }
  }
}

// Função auxiliar para converter string de expiração para milissegundos
function parseExpirationToMs(expiresIn) {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }

  const match = expiresIn.match(/^(\d+)([smhdw])$/);
  if (!match) {
    return 7 * 24 * 60 * 60 * 1000; // 7 dias por padrão
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000; // segundos
    case 'm':
      return value * 60 * 1000; // minutos
    case 'h':
      return value * 60 * 60 * 1000; // horas
    case 'd':
      return value * 24 * 60 * 60 * 1000; // dias
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000; // semanas
    default:
      return 7 * 24 * 60 * 60 * 1000; // 7 dias por padrão
  }
}

module.exports = RefreshToken;
