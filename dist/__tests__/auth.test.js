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
// Mock do módulo bcrypt
jest.mock('bcrypt', () => ({
    compare: jest.fn((senha, hash) => Promise.resolve(senha === 'senha_correta')),
    hash: jest.fn((senha) => Promise.resolve('senha_hash'))
}));
// Aplicativo Express e servidor para testes
let app;
let server;
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
            const decoded = jsonwebtoken_1.default.verify(token, 'chave_secreta_teste');
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
    // Rotas de autenticação
    app.post('/api/auth/register', async (req, res) => {
        try {
            const { username, email, password } = req.body;
            // Validação básica
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
            }
            // Verificar se o usuário já existe
            const existingUser = db_mock_1.mockUsers.find(user => user.username === username);
            if (existingUser) {
                return res.status(409).json({ message: 'Nome de usuário já existe' });
            }
            // Criar novo usuário
            const result = await db_mock_1.mockPool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password]);
            res.status(201).json({ message: 'Usuário registrado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao registrar usuário:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.post('/api/auth/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            // Validação básica
            if (!username || !password) {
                return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios' });
            }
            // Buscar usuário
            const user = db_mock_1.mockUsers.find(user => user.username === username);
            if (!user) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            // Comparar senha (usando mock)
            const validPassword = await require('bcrypt').compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Credenciais inválidas' });
            }
            // Gerar token JWT
            const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, 'chave_secreta_teste', { expiresIn: '1h' });
            res.status(200).json({
                message: 'Login bem-sucedido',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        }
        catch (error) {
            console.error('Erro ao fazer login:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.get('/api/status', (req, res) => {
        res.status(200).json({ status: 'online', version: '1.0.0' });
    });
    // Inicie o servidor na porta de teste
    server = app.listen(34501);
});
(0, globals_1.afterAll)(() => {
    // Fechar o servidor após os testes
    if (server) {
        server.close();
    }
});
(0, globals_1.describe)('Testes de Autenticação', () => {
    (0, globals_1.it)('Deve registrar um novo usuário com sucesso', async () => {
        const newUser = {
            username: 'novousuario',
            email: 'novo@example.com',
            password: 'senha123'
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/register')
            .send(newUser);
        (0, globals_1.expect)(res.status).toBe(201);
        (0, globals_1.expect)(res.body.message).toBe('Usuário registrado com sucesso');
    });
    (0, globals_1.it)('Não deve registrar usuário com dados incompletos', async () => {
        const incompleteUser = {
            username: 'incompleto',
            // Sem email e senha
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/register')
            .send(incompleteUser);
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.message).toBe('Todos os campos são obrigatórios');
    });
    (0, globals_1.it)('Não deve registrar usuário com mesmo username', async () => {
        // Primeiro, tentamos registrar um usuário com o mesmo username que já existe nos mocks
        const duplicateUser = {
            username: 'admin', // Este username já existe no mock
            email: 'outro@example.com',
            password: 'senha123'
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/register')
            .send(duplicateUser);
        (0, globals_1.expect)(res.status).toBe(409);
        (0, globals_1.expect)(res.body.message).toBe('Nome de usuário já existe');
    });
    (0, globals_1.it)('Deve fazer login com credenciais válidas', async () => {
        // Configurar o mock do bcrypt para retornar true para esta comparação específica
        require('bcrypt').compare.mockImplementationOnce(() => Promise.resolve(true));
        const loginData = {
            username: 'admin',
            password: 'senha_correta'
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send(loginData);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.message).toBe('Login bem-sucedido');
        (0, globals_1.expect)(res.body.token).toBeDefined();
        (0, globals_1.expect)(res.body.user).toBeDefined();
        (0, globals_1.expect)(res.body.user.username).toBe('admin');
    });
    (0, globals_1.it)('Não deve fazer login com credenciais inválidas', async () => {
        // Configurar o mock do bcrypt para retornar false para esta comparação específica
        require('bcrypt').compare.mockImplementationOnce(() => Promise.resolve(false));
        const loginData = {
            username: 'admin',
            password: 'senha_incorreta'
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send(loginData);
        (0, globals_1.expect)(res.status).toBe(401);
        (0, globals_1.expect)(res.body.message).toBe('Credenciais inválidas');
    });
    (0, globals_1.it)('Deve retornar o status do servidor', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/status');
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.status).toBe('online');
    });
});
