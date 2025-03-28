const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { testConnection, pool } = require('./config/database');
const { initDb } = require('./config/dbInit');
const { logger, httpLogger } = require('./config/logger');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const {
  corsOptions,
  securityHeaders,
  globalRateLimiter,
} = require('./middlewares/security.middleware');
const { sanitizeInput } = require('./middlewares/validation.middleware');
const authRoutes = require('./routes/auth.routes');
const characterRoutes = require('./routes/character.routes');
const { authenticate } = require('./middlewares/auth.middleware');

// Carregar variáveis de ambiente
dotenv.config();
console.log('Variáveis de ambiente carregadas');
logger.info('Variáveis de ambiente carregadas');

// Criar diretório de logs se não existir
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
  console.log(`Diretório de logs criado: ${logDir}`);
  logger.info(`Diretório de logs criado: ${logDir}`);
} else {
  console.log(`Diretório de logs já existe: ${logDir}`);
  logger.info(`Diretório de logs já existe: ${logDir}`);
}

// Inicializar aplicação Express
const app = express();
const server = http.createServer(app);
console.log('Servidor HTTP criado');
logger.info('Servidor HTTP criado');

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
console.log('Socket.IO configurado');
logger.info('Socket.IO configurado');

// Middleware de segurança e configuração
app.use(corsOptions);
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeInput);
app.use(httpLogger);
console.log('Middlewares aplicados');
logger.info('Middlewares aplicados');

// Limitador de taxa para API
app.use('/api', globalRateLimiter);

// Lista de endpoints disponíveis
const availableEndpoints = [
  { method: 'POST', path: '/api/auth/register', description: 'Registrar novo usuário' },
  { method: 'POST', path: '/api/auth/login', description: 'Login de usuário' },
  { method: 'POST', path: '/api/auth/refresh-token', description: 'Renovar token de acesso' },
  { method: 'POST', path: '/api/auth/logout', description: 'Logout de usuário' },
  { method: 'GET', path: '/api/characters', description: 'Listar personagens do usuário' },
  { method: 'GET', path: '/api/characters/:id', description: 'Obter detalhes de um personagem' },
  { method: 'POST', path: '/api/characters', description: 'Criar novo personagem' },
  { method: 'PUT', path: '/api/characters/:id', description: 'Atualizar personagem' },
  { method: 'DELETE', path: '/api/characters/:id', description: 'Excluir personagem' },
  { method: 'GET', path: '/api/status', description: 'Verificar status do servidor' },
];

console.log('Endpoints disponíveis:');
availableEndpoints.forEach((endpoint) => {
  console.log(`${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
});

// Rotas de API
app.use('/api/auth', authRoutes);
console.log('Rotas de autenticação configuradas');
logger.info('Rotas de autenticação configuradas');

// Rotas protegidas por autenticação
app.use('/api/characters', authenticate, characterRoutes);
console.log('Rotas de personagens configuradas (protegidas por autenticação)');
logger.info('Rotas de personagens configuradas (protegidas por autenticação)');

// Rota para listar endpoints disponíveis
app.get('/api/endpoints', (req, res) => {
  res.json({
    success: true,
    endpoints: availableEndpoints,
  });
});

// Rota de status/healthcheck
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    database: {
      host: process.env.DB_HOST,
      name: process.env.DB_NAME,
    },
  });
});

// Middleware para tratar rotas não encontradas
app.use(notFound);

// Middleware para tratamento de erros
app.use(errorHandler);

// Configuração para Socket.IO
io.on('connection', (socket) => {
  logger.info(`Nova conexão de socket: ${socket.id}`);
  console.log(`Nova conexão de socket: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Desconexão de socket: ${socket.id}`);
    console.log(`Desconexão de socket: ${socket.id}`);
  });

  // Evento para autenticação do socket
  socket.on('authenticate', (token) => {
    console.log(`Tentativa de autenticação de socket: ${socket.id}`);
    logger.info(`Tentativa de autenticação de socket: ${socket.id}`);
    // Aqui você pode implementar a verificação do token
  });

  // Outros eventos do socket podem ser adicionados aqui
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('Iniciando servidor...');
    logger.info('Iniciando servidor...');

    // Testar conexão com o banco de dados
    console.log('Testando conexão com o banco de dados...');
    await testConnection();
    console.log('Conexão com o banco de dados estabelecida com sucesso');

    // Inicializar banco de dados (criar tabelas se não existirem)
    console.log('Inicializando banco de dados...');
    await initDb();
    console.log('Banco de dados inicializado com sucesso');

    // Verificar tabelas existentes
    console.log('Verificando tabelas existentes...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tabelas encontradas no banco de dados:');
    tables.forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });

    // Iniciar o servidor
    server.listen(PORT, () => {
      console.log(`=== SERVIDOR UMBRAETERNUM INICIADO ===`);
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Socket.IO: ws://localhost:${PORT}`);
      console.log(`Banco de dados: ${process.env.DB_NAME} em ${process.env.DB_HOST}`);
      console.log(`Ambiente: ${process.env.NODE_ENV}`);
      console.log(`========================================`);

      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info(`Socket.IO: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Falha ao iniciar o servidor:', error);
    logger.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('Exceção não tratada:', error);
  logger.error('Exceção não tratada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição não tratada:', reason);
  logger.error('Rejeição não tratada:', reason);
});

// Iniciar o servidor
startServer();
