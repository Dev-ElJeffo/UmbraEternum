"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const logger_1 = __importDefault(require("../config/logger"));
class UserModel {
    /**
     * Cria um novo usuário
     */
    async create(userData) {
        try {
            // Hash da senha com bcrypt
            const saltRounds = 10;
            const hashedPassword = await bcrypt_1.default.hash(userData.password, saltRounds);
            const [result] = await database_1.pool.query(`INSERT INTO users (username, email, password, role, status, avatar_url) 
         VALUES (?, ?, ?, ?, ?, ?)`, [
                userData.username,
                userData.email,
                hashedPassword,
                userData.role || 'user',
                userData.status || 'active',
                userData.avatar_url || null,
            ]);
            // @ts-ignore - Acessando o insertId do MySQL
            const userId = result.insertId;
            // Buscar o usuário recém-criado
            const [users] = await database_1.pool.query('SELECT id, username, email, role, created_at, status, avatar_url FROM users WHERE id = ?', [userId]);
            return users[0];
        }
        catch (error) {
            logger_1.default.error('Erro ao criar usuário:', error);
            throw error;
        }
    }
    /**
     * Busca um usuário pelo nome de usuário
     */
    async findByUsername(username) {
        try {
            const [users] = await database_1.pool.query('SELECT * FROM users WHERE username = ?', [username]);
            return users.length > 0 ? users[0] : null;
        }
        catch (error) {
            logger_1.default.error('Erro ao buscar usuário por nome de usuário:', error);
            throw error;
        }
    }
    /**
     * Busca um usuário pelo email
     */
    async findByEmail(email) {
        try {
            const [users] = await database_1.pool.query('SELECT * FROM users WHERE email = ?', [email]);
            return users.length > 0 ? users[0] : null;
        }
        catch (error) {
            logger_1.default.error('Erro ao buscar usuário por email:', error);
            throw error;
        }
    }
    /**
     * Busca um usuário pelo ID
     */
    async findById(id) {
        try {
            const [users] = await database_1.pool.query('SELECT id, username, email, role, created_at, status, avatar_url FROM users WHERE id = ?', [id]);
            return users.length > 0 ? users[0] : null;
        }
        catch (error) {
            logger_1.default.error('Erro ao buscar usuário por ID:', error);
            throw error;
        }
    }
    /**
     * Atualiza as informações do usuário
     */
    async update(id, userData) {
        try {
            // Se a senha estiver presente, fazer o hash
            if (userData.password) {
                const saltRounds = 10;
                userData.password = await bcrypt_1.default.hash(userData.password, saltRounds);
            }
            // Construir a query dinamicamente com base nos campos fornecidos
            const fields = [];
            const values = [];
            Object.entries(userData).forEach(([key, value]) => {
                if (key !== 'id' && value !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(value);
                }
            });
            // Adicionar ID no final dos valores
            values.push(id);
            // Executar a atualização
            await database_1.pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
            // Retornar o usuário atualizado
            return await this.findById(id);
        }
        catch (error) {
            logger_1.default.error('Erro ao atualizar usuário:', error);
            throw error;
        }
    }
    /**
     * Registra o último login do usuário
     */
    async updateLastLogin(id) {
        try {
            await database_1.pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [id]);
        }
        catch (error) {
            logger_1.default.error('Erro ao atualizar último login:', error);
            throw error;
        }
    }
    /**
     * Verifica se a senha do usuário está correta
     */
    async verifyPassword(user, password) {
        try {
            return await bcrypt_1.default.compare(password, user.password);
        }
        catch (error) {
            logger_1.default.error('Erro ao verificar senha:', error);
            throw error;
        }
    }
}
exports.default = new UserModel();
