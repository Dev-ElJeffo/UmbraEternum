import { pool } from '../config/database';
import bcrypt from 'bcrypt';
import logger from '../config/logger';

export interface User {
  id?: number;
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'moderator';
  created_at?: Date;
  updated_at?: Date;
  last_login?: Date | null;
  status?: 'active' | 'inactive' | 'banned';
  avatar_url?: string | null;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: Date;
  status: string;
  avatar_url: string | null;
}

class UserModel {
  /**
   * Cria um novo usuário
   */
  async create(userData: User): Promise<UserResponse> {
    try {
      // Hash da senha com bcrypt
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      
      const [result] = await pool.query(
        `INSERT INTO users (username, email, password, role, status, avatar_url) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userData.username,
          userData.email,
          hashedPassword,
          userData.role || 'user',
          userData.status || 'active',
          userData.avatar_url || null
        ]
      );
      
      // @ts-ignore - Acessando o insertId do MySQL
      const userId = result.insertId;
      
      // Buscar o usuário recém-criado
      const [users]: any = await pool.query(
        'SELECT id, username, email, role, created_at, status, avatar_url FROM users WHERE id = ?',
        [userId]
      );
      
      return users[0] as UserResponse;
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Busca um usuário pelo nome de usuário
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const [users]: any = await pool.query(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );
      
      return users.length > 0 ? users[0] as User : null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por nome de usuário:', error);
      throw error;
    }
  }

  /**
   * Busca um usuário pelo email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const [users]: any = await pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      return users.length > 0 ? users[0] as User : null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  /**
   * Busca um usuário pelo ID
   */
  async findById(id: number): Promise<UserResponse | null> {
    try {
      const [users]: any = await pool.query(
        'SELECT id, username, email, role, created_at, status, avatar_url FROM users WHERE id = ?',
        [id]
      );
      
      return users.length > 0 ? users[0] as UserResponse : null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  /**
   * Atualiza as informações do usuário
   */
  async update(id: number, userData: Partial<User>): Promise<UserResponse | null> {
    try {
      // Se a senha estiver presente, fazer o hash
      if (userData.password) {
        const saltRounds = 10;
        userData.password = await bcrypt.hash(userData.password, saltRounds);
      }
      
      // Construir a query dinamicamente com base nos campos fornecidos
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      // Adicionar ID no final dos valores
      values.push(id);
      
      // Executar a atualização
      await pool.query(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      
      // Retornar o usuário atualizado
      return await this.findById(id);
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Registra o último login do usuário
   */
  async updateLastLogin(id: number): Promise<void> {
    try {
      await pool.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
    } catch (error) {
      logger.error('Erro ao atualizar último login:', error);
      throw error;
    }
  }

  /**
   * Verifica se a senha do usuário está correta
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password);
    } catch (error) {
      logger.error('Erro ao verificar senha:', error);
      throw error;
    }
  }
}

export default new UserModel(); 