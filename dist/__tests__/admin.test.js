"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_mock_1 = require("./mocks/db.mock");
// Mock do módulo mysql2/promise
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(() => db_mock_1.mockPool)
}));
// Mock JWT Secret
const JWT_SECRET = 'chave_secreta_teste';
// Aplicativo Express e servidor para testes
let app;
let server;
let adminToken;
let userToken;
(0, globals_1.beforeAll)(() => {
    // Configurar o aplicativo Express
    app = (0, express_1.default)();
    // Configurações básicas
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(limiter);
    // Middleware para verificar token JWT
    const authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token de autenticação não fornecido' });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado' });
        }
    };
    // Middleware para verificar se o usuário é admin
    const isAdmin = (req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        }
        else {
            res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
        }
    };
    // Rotas administrativas
    app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
        try {
            // Listar todos os usuários
            const users = await db_mock_1.mockPool.query('SELECT * FROM users');
            res.status(200).json(users);
        }
        catch (error) {
            console.error('Erro ao listar usuários:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.get('/api/admin/characters', authenticateToken, isAdmin, async (req, res) => {
        try {
            // Listar todos os personagens
            const characters = await db_mock_1.mockPool.query('SELECT * FROM characters');
            res.status(200).json(characters);
        }
        catch (error) {
            console.error('Erro ao listar personagens:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            const { role } = req.body;
            // Validar role
            if (!role || !['admin', 'player', 'moderator'].includes(role)) {
                return res.status(400).json({ message: 'Role inválido' });
            }
            // Verificar se o usuário existe
            const users = await db_mock_1.mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
            if (!users || (Array.isArray(users) && users.length === 0)) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
            // Atualizar o role do usuário
            await db_mock_1.mockPool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
            // Obter o usuário atualizado
            const updatedUsers = await db_mock_1.mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
            const updatedUser = Array.isArray(updatedUsers) ? updatedUsers[0] : updatedUsers;
            res.status(200).json({
                message: 'Role do usuário atualizado com sucesso',
                user: updatedUser
            });
        }
        catch (error) {
            console.error('Erro ao atualizar role do usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
        try {
            const userId = parseInt(req.params.id);
            // Verificar se o usuário existe
            const users = await db_mock_1.mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
            if (!users || (Array.isArray(users) && users.length === 0)) {
                return res.status(404).json({ message: 'Usuário não encontrado' });
            }
            // Soft delete do usuário
            await db_mock_1.mockPool.query('UPDATE users SET active = false WHERE id = ?', [userId]);
            res.status(200).json({ message: 'Usuário desativado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao desativar usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    // Iniciar o servidor na porta de teste
    server = app.listen(34503);
    // Criar tokens de autenticação para testes
    adminToken = jsonwebtoken_1.default.sign({ id: 1, username: 'admin', role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    userToken = jsonwebtoken_1.default.sign({ id: 2, username: 'player1', role: 'player' }, JWT_SECRET, { expiresIn: '1h' });
});
(0, globals_1.afterAll)(() => {
    // Fechar o servidor após os testes
    if (server) {
        server.close();
    }
});
(0, globals_1.describe)('Testes Administrativos', () => {
    (0, globals_1.it)('Admin deve listar todos os usuários', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(Array.isArray(res.body)).toBe(true);
        (0, globals_1.expect)(res.body.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('Usuário normal não deve acessar lista de usuários', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/admin/users')
            .set('Authorization', `Bearer ${userToken}`);
        (0, globals_1.expect)(res.status).toBe(403);
        (0, globals_1.expect)(res.body.message).toBe('Acesso negado. Permissão de administrador necessária.');
    });
    (0, globals_1.it)('Admin deve listar todos os personagens', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/admin/characters')
            .set('Authorization', `Bearer ${adminToken}`);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(Array.isArray(res.body)).toBe(true);
        (0, globals_1.expect)(res.body.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('Admin deve alterar o role de um usuário', async () => {
        const userId = 2; // ID do usuário player1
        const newRole = 'moderator';
        const res = await (0, supertest_1.default)(app)
            .put(`/api/admin/users/${userId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: newRole });
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.message).toBe('Role do usuário atualizado com sucesso');
        (0, globals_1.expect)(res.body.user).toBeDefined();
        (0, globals_1.expect)(res.body.user.id).toBe(userId);
        (0, globals_1.expect)(res.body.user.role).toBe(newRole);
    });
    (0, globals_1.it)('Admin não deve alterar role com valor inválido', async () => {
        const userId = 2; // ID do usuário player1
        const invalidRole = 'invalid_role';
        const res = await (0, supertest_1.default)(app)
            .put(`/api/admin/users/${userId}/role`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ role: invalidRole });
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.message).toBe('Role inválido');
    });
    (0, globals_1.it)('Admin deve desativar um usuário', async () => {
        const userId = 3; // ID do usuário player2
        const res = await (0, supertest_1.default)(app)
            .delete(`/api/admin/users/${userId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.message).toBe('Usuário desativado com sucesso');
        // Verificar se o usuário foi realmente desativado
        const user = db_mock_1.mockUsers.find(user => user.id === userId);
        (0, globals_1.expect)(user).toBeDefined();
        (0, globals_1.expect)(user?.active).toBe(false);
    });
    (0, globals_1.it)('Admin não deve desativar usuário inexistente', async () => {
        const nonExistentUserId = 999;
        const res = await (0, supertest_1.default)(app)
            .delete(`/api/admin/users/${nonExistentUserId}`)
            .set('Authorization', `Bearer ${adminToken}`);
        (0, globals_1.expect)(res.status).toBe(404);
        (0, globals_1.expect)(res.body.message).toBe('Usuário não encontrado');
    });
});
