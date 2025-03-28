"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
let app;
let server;
(0, globals_1.beforeAll)(() => {
    // Configurar o aplicativo Express
    app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    // Configurar rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // limite de 100 requisições por janela
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use(limiter);
    // Rota raiz
    app.get('/', (req, res) => {
        res.json({ message: 'Bem-vindo ao UmbraEternum API' });
    });
    // Rota de status
    app.get('/api/status', (req, res) => {
        res.json({ status: 'online', timestamp: new Date().toISOString() });
    });
    // Rota para teste de erros
    app.get('/api/error', (req, res) => {
        res.status(500).json({ error: 'Teste de erro interno' });
    });
    // Rota para teste 404
    app.use((req, res) => {
        res.status(404).json({ error: 'Endpoint não encontrado' });
    });
    // Iniciar o servidor na porta 34504 (diferente das portas dos outros testes)
    server = app.listen(34504);
});
(0, globals_1.afterAll)(() => {
    // Fechar o servidor após os testes
    server.close();
});
(0, globals_1.describe)('Testes de API Básica', () => {
    (0, globals_1.it)('Deve responder à rota raiz', async () => {
        const response = await (0, supertest_1.default)(app).get('/');
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty('message', 'Bem-vindo ao UmbraEternum API');
    });
    (0, globals_1.it)('Deve exibir o status online', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/status');
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty('status', 'online');
        (0, globals_1.expect)(response.body).toHaveProperty('timestamp');
    });
    (0, globals_1.it)('Deve retornar 404 para rotas inexistentes', async () => {
        const response = await (0, supertest_1.default)(app).get('/rota-que-nao-existe');
        (0, globals_1.expect)(response.status).toBe(404);
        (0, globals_1.expect)(response.body).toHaveProperty('error', 'Endpoint não encontrado');
    });
    (0, globals_1.it)('Deve retornar código de erro correto para erros internos', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/error');
        (0, globals_1.expect)(response.status).toBe(500);
        (0, globals_1.expect)(response.body).toHaveProperty('error', 'Teste de erro interno');
    });
    (0, globals_1.it)('Deve incluir headers de segurança', async () => {
        const response = await (0, supertest_1.default)(app).get('/');
        (0, globals_1.expect)(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
        (0, globals_1.expect)(response.headers).toHaveProperty('x-xss-protection');
        (0, globals_1.expect)(response.headers).toHaveProperty('content-security-policy');
    });
});
