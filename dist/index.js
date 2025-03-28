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
const fs_1 = __importDefault(require("fs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("./config/database");
const dbInit_1 = __importDefault(require("./config/dbInit"));
const logger_1 = __importDefault(require("./config/logger"));
const error_middleware_1 = require("./middlewares/error.middleware");
const security_middleware_1 = require("./middlewares/security.middleware");
const validation_middleware_1 = require("./middlewares/validation.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const character_routes_1 = __importDefault(require("./routes/character.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
// Carregar variáveis de ambiente
dotenv_1.default.config();
// Criar diretório de logs se não existir
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
        credentials: true,
    },
});
// Informações de estado do servidor
let onlinePlayers = 0;
const authenticatedSockets = new Map(); // Mapear sockets para dados de usuário
const lastActivity = new Map(); // Registrar última atividade por socket
// Disponibilizar a contagem de jogadores online para as rotas
app.set('onlinePlayers', onlinePlayers);
// Middleware de segurança e configuração
app.use((0, security_middleware_1.corsConfig)(process.env.CORS_ORIGIN || '*'));
app.use((0, security_middleware_1.configureHelmet)());
app.use(security_middleware_1.securityHeaders);
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(validation_middleware_1.sanitizeBody);
// Adicionar middleware de log para todas as requisições HTTP
app.use((req, res, next) => {
    const start = Date.now();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    logger_1.default.info(`[HTTP] ${req.method} ${req.originalUrl} - IP: ${ip}`);
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger_1.default.info(`[HTTP] ${req.method} ${req.originalUrl} - STATUS: ${res.statusCode} - ${duration}ms`);
    });
    next();
});
// Limitador de taxa para API
app.use('/api', security_middleware_1.apiRateLimiter);
// Função para registrar atividade
function logActivity(message, type = 'system') {
    const timestamp = new Date().toISOString();
    logger_1.default.info(`[ATIVIDADE] ${message}`);
    const activityData = {
        message,
        type,
        timestamp,
    };
    // Transmitir para todos os clientes conectados
    io.emit('activity', activityData);
    // Registrar no arquivo de log
    const logFile = path_1.default.join(logDir, `activity_${new Date().toISOString().split('T')[0]}.log`);
    fs_1.default.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
    return activityData;
}
// Verificar token JWT
function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET || 'umbraeternum_dev_secret';
        return jsonwebtoken_1.default.verify(token, secret);
    }
    catch (error) {
        return null;
    }
}
// Função para transmitir contagem de jogadores
function broadcastPlayerCount() {
    io.emit('playerCount', { count: onlinePlayers });
    logger_1.default.info(`Total de jogadores online: ${onlinePlayers}`);
}
// Função para desconectar todos os usuários
function disconnectAllUsers() {
    io.disconnectSockets();
    authenticatedSockets.clear();
    lastActivity.clear();
    onlinePlayers = 0;
    app.set('onlinePlayers', 0);
    logActivity('Todos os usuários foram desconectados pelo sistema', 'system');
}
// Configuração para Socket.IO
io.on('connection', (socket) => {
    logger_1.default.info(`Nova conexão de socket: ${socket.id}`);
    lastActivity.set(socket.id, Date.now());
    // Autenticação do socket
    socket.on('authenticate', async (data) => {
        try {
            if (!data || !data.token) {
                socket.emit('error', { message: 'Token não fornecido' });
                return;
            }
            const decoded = verifyToken(data.token);
            if (!decoded) {
                socket.emit('error', { message: 'Token inválido ou expirado' });
                return;
            }
            // Armazenar informações do usuário
            authenticatedSockets.set(socket.id, {
                userId: decoded.userId,
                username: decoded.username,
                role: decoded.role,
            });
            // Incrementar contador se não estiver já contado
            let isNewPlayer = true;
            authenticatedSockets.forEach((userData, socketId) => {
                if (socketId !== socket.id && userData.userId === decoded.userId) {
                    isNewPlayer = false;
                }
            });
            if (isNewPlayer) {
                onlinePlayers++;
                app.set('onlinePlayers', onlinePlayers);
                broadcastPlayerCount();
                logActivity(`${decoded.username} entrou no jogo`, 'login');
            }
            socket.emit('authenticated', { success: true });
            logger_1.default.info(`Socket ${socket.id} autenticado como ${decoded.username}`);
        }
        catch (error) {
            logger_1.default.error(`Erro na autenticação do socket: ${error.message}`);
            socket.emit('error', { message: 'Erro durante autenticação' });
        }
    });
    // Atividade do jogador
    socket.on('activity', () => {
        lastActivity.set(socket.id, Date.now());
    });
    // Chat
    socket.on('chat', (message) => {
        const userData = authenticatedSockets.get(socket.id);
        if (!userData) {
            socket.emit('error', { message: 'Não autenticado' });
            return;
        }
        const chatMessage = {
            userId: userData.userId,
            username: userData.username,
            message: message.text,
            timestamp: new Date().toISOString(),
        };
        io.emit('chat', chatMessage);
        logger_1.default.info(`Chat: ${userData.username}: ${message.text}`);
    });
    // Desconexão
    socket.on('disconnect', () => {
        const userData = authenticatedSockets.get(socket.id);
        if (userData) {
            // Verificar se o usuário ainda tem outras conexões
            let otherConnections = false;
            authenticatedSockets.forEach((otherUserData, otherSocketId) => {
                if (otherSocketId !== socket.id && otherUserData.userId === userData.userId) {
                    otherConnections = true;
                }
            });
            if (!otherConnections) {
                onlinePlayers--;
                app.set('onlinePlayers', onlinePlayers);
                broadcastPlayerCount();
                logActivity(`${userData.username} saiu do jogo`, 'logout');
            }
        }
        authenticatedSockets.delete(socket.id);
        lastActivity.delete(socket.id);
        logger_1.default.info(`Desconexão de socket: ${socket.id}`);
    });
});
// Verificação periódica de inatividade (a cada 5 minutos)
setInterval(() => {
    const now = Date.now();
    const timeoutDuration = 30 * 60 * 1000; // 30 minutos
    lastActivity.forEach((lastActiveTime, socketId) => {
        if (now - lastActiveTime > timeoutDuration) {
            const socket = io.sockets.sockets.get(socketId);
            if (socket) {
                logger_1.default.info(`Desconectando socket ${socketId} por inatividade`);
                socket.disconnect(true);
            }
            lastActivity.delete(socketId);
        }
    });
}, 5 * 60 * 1000);
// Rotas da API
app.use('/api/auth', auth_routes_1.default);
app.use('/api/characters', character_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
// Rota de status/healthcheck
app.get('/api/status', (req, res) => {
    const dbStatus = database_1.pool ? 'connected' : 'disconnected';
    res.json({
        success: true,
        status: 'online',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        onlinePlayers: onlinePlayers,
        database: dbStatus,
    });
});
// Rota para listar endpoints disponíveis
app.get('/api/endpoints', (req, res) => {
    const endpoints = [
        { path: '/api/status', method: 'GET', description: 'Status do servidor' },
        { path: '/api/endpoints', method: 'GET', description: 'Lista de endpoints disponíveis' },
        { path: '/api/auth/register', method: 'POST', description: 'Registrar novo usuário' },
        { path: '/api/auth/login', method: 'POST', description: 'Login de usuário' },
        { path: '/api/auth/refresh', method: 'POST', description: 'Atualizar token de acesso' },
        { path: '/api/auth/status', method: 'GET', description: 'Status do usuário atual', auth: true },
        { path: '/api/characters', method: 'GET', description: 'Listar personagens do usuário', auth: true },
        { path: '/api/characters', method: 'POST', description: 'Criar novo personagem', auth: true },
        { path: '/api/characters/:id', method: 'GET', description: 'Obter detalhes do personagem', auth: true },
        { path: '/api/characters/:id', method: 'PUT', description: 'Atualizar personagem', auth: true },
        { path: '/api/characters/:id', method: 'DELETE', description: 'Excluir personagem', auth: true },
        { path: '/api/admin/users', method: 'GET', description: 'Listar todos os usuários', auth: true, admin: true },
        { path: '/api/admin/characters', method: 'GET', description: 'Listar todos os personagens', auth: true, admin: true },
        { path: '/api/admin/users/:id/role', method: 'PUT', description: 'Alterar papel do usuário', auth: true, admin: true },
        { path: '/api/admin/users/:id/ban', method: 'PUT', description: 'Banir usuário', auth: true, admin: true },
        { path: '/api/admin/users/:id/unban', method: 'PUT', description: 'Desbanir usuário', auth: true, admin: true },
        { path: '/api/admin/stats', method: 'GET', description: 'Estatísticas do sistema', auth: true, admin: true },
    ];
    res.json({
        success: true,
        count: endpoints.length,
        endpoints,
    });
});
// Middleware para tratar rotas não encontradas
app.use(error_middleware_1.notFoundHandler);
// Middleware para tratamento de erros
app.use(error_middleware_1.errorHandler);
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
            logActivity(`Servidor iniciado na porta ${PORT}`, 'system');
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
// Capturar sinais para desligamento gracioso
process.on('SIGTERM', () => {
    logger_1.default.info('Recebido sinal SIGTERM, desligando servidor...');
    disconnectAllUsers();
    server.close(() => {
        logger_1.default.info('Servidor encerrado');
        process.exit(0);
    });
});
process.on('SIGINT', () => {
    logger_1.default.info('Recebido sinal SIGINT, desligando servidor...');
    disconnectAllUsers();
    server.close(() => {
        logger_1.default.info('Servidor encerrado');
        process.exit(0);
    });
});
// Iniciar o servidor
startServer();
exports.default = server; // Exportar para testes
