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
// Criar uma instância do Express para testes
const app = (0, express_1.default)();
// Configurações básicas
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
// Rate limiting para testes
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // limite de 100 requisições por janela
});
app.use(limiter);
// Rotas de teste
app.get('/', (req, res) => {
    res.status(200).json({ message: 'API funcionando' });
});
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'online' });
});
(0, globals_1.describe)('Servidor', () => {
    let server;
    const TEST_PORT = 34568; // Porta diferente para testes
    (0, globals_1.beforeAll)(() => {
        server = app.listen(TEST_PORT);
    });
    (0, globals_1.afterAll)((done) => {
        server.close(done);
    });
    (0, globals_1.it)('deve responder na rota raiz', async () => {
        const response = await (0, supertest_1.default)(app).get('/');
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty('message', 'API funcionando');
    });
    (0, globals_1.it)('deve responder na rota de status da API', async () => {
        const response = await (0, supertest_1.default)(app).get('/api/status');
        (0, globals_1.expect)(response.status).toBe(200);
        (0, globals_1.expect)(response.body).toHaveProperty('status', 'online');
    });
    (0, globals_1.it)('deve ter headers de segurança configurados', async () => {
        const response = await (0, supertest_1.default)(app).get('/');
        (0, globals_1.expect)(response.headers).toHaveProperty('x-frame-options');
        (0, globals_1.expect)(response.headers).toHaveProperty('x-content-type-options');
        (0, globals_1.expect)(response.headers).toHaveProperty('x-xss-protection');
    });
});
