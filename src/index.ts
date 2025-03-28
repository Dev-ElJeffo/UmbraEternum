import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { testConnection } from './config/database';
import initializeDatabase from './config/dbInit';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import {
  corsConfig,
  configureHelmet,
  securityHeaders,
  apiRateLimiter,
} from './middlewares/security.middleware';
import { sanitizeBody } from './middlewares/validation.middleware';
import authRoutes from './routes/auth.routes';
import characterRoutes from './routes/character.routes';

// Carregar variáveis de ambiente
dotenv.config();

// Criar diretório de logs se não existir
import fs from 'fs';
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Inicializar aplicação Express
const app = express();
const server = http.createServer(app);

// Configuração do Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware de segurança e configuração
app.use(corsConfig(process.env.CORS_ORIGIN || '*'));
app.use(configureHelmet());
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeBody);

// Limitador de taxa para API
app.use('/api', apiRateLimiter);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);

// Rota de status/healthcheck
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Middleware para tratar rotas não encontradas
app.use(notFoundHandler);

// Middleware para tratamento de erros
app.use(errorHandler);

// Configuração para Socket.IO
io.on('connection', (socket) => {
  logger.info(`Nova conexão de socket: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Desconexão de socket: ${socket.id}`);
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 34567;

const startServer = async () => {
  try {
    // Testar conexão com o banco de dados
    await testConnection();

    // Inicializar banco de dados (criar tabelas se não existirem)
    await initializeDatabase();

    // Iniciar o servidor
    server.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`API: http://localhost:${PORT}/api`);
      logger.info(`Socket.IO: ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  logger.error('Exceção não tratada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejeição não tratada:', { reason, promise });
});

// Iniciar o servidor
startServer();
