"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./config/database");
const dbInit_1 = __importDefault(require("./config/dbInit"));
const logger_1 = __importDefault(require("./config/logger"));
const error_middleware_1 = require("./middlewares/error.middleware");
const security_middleware_1 = require("./middlewares/security.middleware");
const validation_middleware_1 = require("./middlewares/validation.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const character_routes_1 = __importDefault(require("./routes/character.routes"));
// Carregar variáveis de ambiente
dotenv_1.default.config();
// Criar diretório de logs se não existir
const fs_1 = __importDefault(require("fs"));
const logDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir);
}
// Inicializar aplicação Express
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
// Configuração do Socket.IO
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
// Middleware de segurança e configuração
app.use((0, security_middleware_1.corsConfig)(process.env.CORS_ORIGIN || '*'));
app.use((0, security_middleware_1.configureHelmet)());
app.use(security_middleware_1.securityHeaders);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(validation_middleware_1.sanitizeBody);
// Limitador de taxa para API
app.use('/api', security_middleware_1.apiRateLimiter);
// Rotas da API
app.use('/api/auth', auth_routes_1.default);
app.use('/api/characters', character_routes_1.default);
// Rota de status/healthcheck
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    });
});
// Middleware para tratar rotas não encontradas
app.use(error_middleware_1.notFoundHandler);
// Middleware para tratamento de erros
app.use(error_middleware_1.errorHandler);
// Configuração para Socket.IO
io.on('connection', (socket) => {
    logger_1.default.info(`Nova conexão de socket: ${socket.id}`);
    socket.on('disconnect', () => {
        logger_1.default.info(`Desconexão de socket: ${socket.id}`);
    });
});
// Iniciar o servidor
const PORT = process.env.PORT || 34567;
const startServer = async () => {
    try {
        // Testar conexão com o banco de dados
        await (0, database_1.testConnection)();
        // Inicializar banco de dados (criar tabelas se não existirem)
        await (0, dbInit_1.default)();
        // Iniciar o servidor
        server.listen(PORT, () => {
            logger_1.default.info(`Servidor rodando na porta ${PORT}`);
            logger_1.default.info(`API: http://localhost:${PORT}/api`);
            logger_1.default.info(`Socket.IO: ws://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger_1.default.error('Falha ao iniciar o servidor:', error);
        process.exit(1);
    }
};
// Capturar erros não tratados
process.on('uncaughtException', (error) => {
    logger_1.default.error('Exceção não tratada:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.default.error('Rejeição não tratada:', { reason, promise });
});
// Iniciar o servidor
startServer();
