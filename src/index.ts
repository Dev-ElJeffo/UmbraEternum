import express, { Request } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { testConnection, pool } from './config/database';
import initializeDatabase from './config/dbInit';
import logger from './config/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import {
  corsConfig,
  configureHelmet,
  securityHeaders,
  apiRateLimiter,
} from './middlewares/security.middleware';
import { sanitizeBody, validate } from './middlewares/validation.middleware';
import { authenticateJWT as authenticate, requireAdmin as isAdmin } from './middlewares/auth.middleware';
import { body } from 'express-validator';
import authRoutes from './routes/auth.routes';
import characterRoutes from './routes/character.routes';

// Estendendo a interface Request para incluir propriedades do usuário
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      username?: string;
      userRole?: string;
    }
  }
}

// Carregar variáveis de ambiente
dotenv.config();

// Criar diretório de logs se não existir
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

// Informações de estado do servidor
let onlinePlayers = 0;
const authenticatedSockets = new Map(); // Mapear sockets para dados de usuário
const lastActivity = new Map(); // Registrar última atividade por socket

// Middleware de segurança e configuração
app.use(corsConfig(process.env.CORS_ORIGIN || '*'));
app.use(configureHelmet());
app.use(securityHeaders);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(sanitizeBody);

// Adicionar middleware de log para todas as requisições HTTP
app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  logger.info(`[HTTP] ${req.method} ${req.originalUrl} - IP: ${ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `[HTTP] ${req.method} ${req.originalUrl} - STATUS: ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// Limitador de taxa para API
app.use('/api', apiRateLimiter);

// Função para registrar atividade
function logActivity(message: string, type: string = 'system'): { message: string; type: string; timestamp: string } {
  const timestamp = new Date().toISOString();
  logger.info(`[ATIVIDADE] ${message}`);
  const activityData = {
    message,
    type,
    timestamp,
  };

  // Transmitir para todos os clientes conectados
  io.emit('activity', activityData);

  // Registrar no arquivo de log
  const logFile = path.join(logDir, `activity_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);

  return activityData;
}

// Verificar token JWT
function verifyToken(token: string): any {
  try {
    const secret = process.env.JWT_SECRET || 'umbraeternum_dev_secret';
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
}

// Função para transmitir contagem de jogadores
function broadcastPlayerCount(): void {
  io.emit('playerCount', { count: onlinePlayers });
}

// Função para desconectar todos os usuários
function disconnectAllUsers(): void {
  io.disconnectSockets();
  authenticatedSockets.clear();
  lastActivity.clear();
  onlinePlayers = 0;
  logActivity('Todos os usuários foram desconectados pelo sistema', 'system');
}

// Configuração para Socket.IO
io.on('connection', (socket) => {
  logger.info(`Nova conexão de socket: ${socket.id}`);
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
        broadcastPlayerCount();
        logActivity(`${decoded.username} entrou no jogo`, 'login');
      }

      socket.emit('authenticated', { success: true });
      logger.info(`Socket ${socket.id} autenticado como ${decoded.username}`);

    } catch (error) {
      logger.error(`Erro na autenticação do socket: ${error.message}`);
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
    logger.info(`Chat: ${userData.username}: ${message.text}`);
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
        broadcastPlayerCount();
        logActivity(`${userData.username} saiu do jogo`, 'logout');
      }
    }

    authenticatedSockets.delete(socket.id);
    lastActivity.delete(socket.id);
    logger.info(`Desconexão de socket: ${socket.id}`);
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
        logger.info(`Desconectando socket ${socketId} por inatividade`);
        socket.disconnect(true);
      }
      lastActivity.delete(socketId);
    }
  });
}, 5 * 60 * 1000);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/characters', characterRoutes);

// Rota de status/healthcheck
app.get('/api/status', (req, res) => {
  const dbStatus = pool ? 'connected' : 'disconnected';

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
  ];

  res.json({
    success: true,
    count: endpoints.length,
    endpoints,
  });
});

// Rota administrativa para listar todos os usuários
app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT id, username, email, role, active, created_at, updated_at, last_login_at FROM users ORDER BY id'
    );

    res.json({
      success: true,
      count: rows.length,
      users: rows,
    });
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários',
    });
  }
});

// Rota administrativa para listar todos os personagens
app.get('/api/admin/characters', authenticate, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM characters WHERE deleted_at IS NULL ORDER BY id'
    );

    res.json({
      success: true,
      count: rows.length,
      characters: rows,
    });
  } catch (error) {
    logger.error('Erro ao listar personagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar personagens',
    });
  }
});

// Rota administrativa para alterar o papel de um usuário
app.put('/api/admin/users/:id/role', authenticate, isAdmin, [
  body('role').isIn(['admin', 'player']).withMessage('Papel deve ser admin ou player'),
  validate,
], async (req: Request, res) => {
  const userId = parseInt(req.params.id, 10);
  const { role } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [role, userId]
    );

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    logActivity(`Papel do usuário ID ${userId} alterado para ${role} por ${req.user?.username || 'admin'}`, 'admin');

    res.json({
      success: true,
      message: `Papel do usuário alterado para ${role}`,
    });
  } catch (error) {
    logger.error('Erro ao alterar papel do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao alterar papel do usuário',
    });
  }
});

// Rota administrativa para desativar um usuário
app.delete('/api/admin/users/:id', authenticate, isAdmin, async (req: Request, res) => {
  const userId = parseInt(req.params.id, 10);

  try {
    const [result] = await pool.query(
      'UPDATE users SET active = FALSE WHERE id = ?',
      [userId]
    );

    if ((result as mysql.ResultSetHeader).affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    logActivity(`Usuário ID ${userId} desativado por ${req.user?.username || 'admin'}`, 'admin');

    res.json({
      success: true,
      message: 'Usuário desativado com sucesso',
    });
  } catch (error) {
    logger.error('Erro ao desativar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao desativar usuário',
    });
  }
});

// Middleware para tratar rotas não encontradas
app.use(notFoundHandler);

// Middleware para tratamento de erros
app.use(errorHandler);

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
      
      logActivity(`Servidor iniciado na porta ${PORT}`, 'system');
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

// Capturar sinais para desligamento gracioso
process.on('SIGTERM', () => {
  logger.info('Recebido sinal SIGTERM, desligando servidor...');
  disconnectAllUsers();
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('Recebido sinal SIGINT, desligando servidor...');
  disconnectAllUsers();
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

// Iniciar o servidor
startServer();

export default server; // Exportar para testes
