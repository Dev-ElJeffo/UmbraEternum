import { pool } from '../config/database';
import logger from '../config/logger';
import crypto from 'crypto';

export interface RefreshToken {
  id?: number;
  user_id: number;
  token: string;
  expires_at: Date;
  created_at?: Date;
}

class RefreshTokenModel {
  /**
   * Cria um novo token de refresh
   */
  async create(userId: number, expiresIn: string = '7d'): Promise<RefreshToken> {
    try {
      // Gerar token aleatório
      const token = crypto.randomBytes(40).toString('hex');
      
      // Calcular data de expiração
      const expiresAt = new Date();
      const timeUnit = expiresIn.slice(-1);
      const timeValue = parseInt(expiresIn.slice(0, -1), 10);
      
      if (timeUnit === 'd') {
        expiresAt.setDate(expiresAt.getDate() + timeValue);
      } else if (timeUnit === 'h') {
        expiresAt.setHours(expiresAt.getHours() + timeValue);
      } else if (timeUnit === 'm') {
        expiresAt.setMinutes(expiresAt.getMinutes() + timeValue);
      }
      
      const [result] = await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [userId, token, expiresAt]
      );
      
      // @ts-ignore - Acessando o insertId do MySQL
      const tokenId = result.insertId;
      
      // Buscar o token recém-criado
      const [tokens]: any = await pool.query(
        'SELECT * FROM refresh_tokens WHERE id = ?',
        [tokenId]
      );
      
      return tokens[0] as RefreshToken;
    } catch (error) {
      logger.error('Erro ao criar refresh token:', error);
      throw error;
    }
  }

  /**
   * Busca um token pelo valor do token
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const [tokens]: any = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = ?',
        [token]
      );
      
      return tokens.length > 0 ? tokens[0] as RefreshToken : null;
    } catch (error) {
      logger.error('Erro ao buscar refresh token:', error);
      throw error;
    }
  }

  /**
   * Verifica se um token é válido
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      const refreshToken = await this.findByToken(token);
      
      if (!refreshToken) {
        return false;
      }
      
      // Verificar se o token não expirou
      const now = new Date();
      return new Date(refreshToken.expires_at) > now;
    } catch (error) {
      logger.error('Erro ao verificar refresh token:', error);
      throw error;
    }
  }

  /**
   * Deleta um token
   */
  async delete(token: string): Promise<boolean> {
    try {
      const [result]: any = await pool.query(
        'DELETE FROM refresh_tokens WHERE token = ?',
        [token]
      );
      
      // @ts-ignore - Acessando o affectedRows do MySQL
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erro ao deletar refresh token:', error);
      throw error;
    }
  }

  /**
   * Deleta todos os tokens de um usuário
   */
  async deleteAllForUser(userId: number): Promise<boolean> {
    try {
      const [result]: any = await pool.query(
        'DELETE FROM refresh_tokens WHERE user_id = ?',
        [userId]
      );
      
      // @ts-ignore - Acessando o affectedRows do MySQL
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Erro ao deletar tokens do usuário:', error);
      throw error;
    }
  }

  /**
   * Limpa tokens expirados
   */
  async clearExpiredTokens(): Promise<number> {
    try {
      const [result]: any = await pool.query(
        'DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP'
      );
      
      // @ts-ignore - Acessando o affectedRows do MySQL
      return result.affectedRows;
    } catch (error) {
      logger.error('Erro ao limpar tokens expirados:', error);
      throw error;
    }
  }
}

export default new RefreshTokenModel(); 