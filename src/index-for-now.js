const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const Character = require('./models/Character');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sanitizeBody, validate } = require('./middlewares/validation.middleware');
const { body } = require('express-validator');

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

// Middleware de segurança e configuração
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  })
);
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Adicionar middleware de log para todas as requisições HTTP
app.use((req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  console.log(`[${new Date().toISOString()}] [HTTP] ${req.method} ${req.originalUrl} - IP: ${ip}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] [HTTP] ${req.method} ${req.originalUrl} - STATUS: ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// Contador de jogadores online
let onlinePlayers = 0;
const authenticatedSockets = new Map(); // Mapear sockets para dados de usuário
const lastActivity = new Map(); // Registrar última atividade por socket
let dbPool = null; // Pool de conexão com o banco de dados

// Função para registrar atividade
function logActivity(message, type = 'system') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [ATIVIDADE] ${message}`);
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

// Configurar conexão com o banco de dados
async function setupDatabase() {
  try {
    // Configurações de conexão do banco de dados
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '!Mister4126', // Usar a senha do arquivo .env
      database: process.env.DB_NAME || 'umbraeternum_new',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    console.log('Configuração do banco de dados carregada:');
    console.log(`- Host: ${dbConfig.host}`);
    console.log(`- Porta: ${dbConfig.port}`);
    console.log(`- Usuário: ${dbConfig.user}`);
    console.log(`- Banco de dados: ${dbConfig.database}`);
    console.log(`- Ambiente: ${process.env.NODE_ENV || 'development'}`);

    // Criar pool de conexões
    dbPool = mysql.createPool(dbConfig);

    // Testar conexão
    const connection = await dbPool.getConnection();
    console.log('Pool de conexões do banco de dados criado com sucesso');
    logActivity('Conexão com o banco de dados estabelecida', 'system');

    // Verificar se a tabela de usuários existe
    const [tables] = await connection.query('SHOW TABLES LIKE "users"');
    if (tables.length === 0) {
      console.log('Tabela de usuários não encontrada, criando...');
      await connection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role ENUM('admin', 'player') NOT NULL DEFAULT 'player',
          active BOOLEAN NOT NULL DEFAULT TRUE,
          last_login_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
      console.log('Tabela de usuários criada com sucesso');

      // Criar um usuário admin para teste
      const adminPassword = await bcrypt.hash('admin123', 10);
      try {
        await connection.query(
          `
          INSERT INTO users (username, email, password, role, active)
          VALUES ('admin', 'admin@umbraeternum.com', ?, 'admin', true)
        `,
          [adminPassword]
        );
        console.log('Usuário admin criado com sucesso');
      } catch (err) {
        console.log('Admin já existe ou erro ao criar:', err.message);
      }
    } else {
      console.log('Tabela de usuários já existe');

      // Verificar se a coluna last_login_at existe
      try {
        const [columns] = await connection.query('SHOW COLUMNS FROM users LIKE "last_login_at"');
        if (columns.length === 0) {
          console.log('Coluna last_login_at não encontrada, adicionando...');
          await connection.query('ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL');
          console.log('Coluna last_login_at adicionada com sucesso');
        } else {
          console.log('Coluna last_login_at já existe');
        }
      } catch (error) {
        console.error('Erro ao verificar/adicionar coluna last_login_at:', error.message);
      }
    }

    connection.release();

    return true;
  } catch (error) {
    console.error('Erro ao conectar ao banco de dados:', error.message);
    logActivity(`Erro na conexão com o banco de dados: ${error.message}`, 'error');
    return false;
  }
}

// Middleware de autenticação
function authenticate(req, res, next) {
  try {
    // Verificar se existe um token no cabeçalho Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido',
      });
    }

    // Formato esperado: Bearer <token>
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido',
      });
    }

    // Verificar o token JWT
    const secret = process.env.JWT_SECRET || 'umbraeternum_dev_secret';
    const decoded = jwt.verify(token, secret);

    // Adicionar informações do usuário ao objeto de requisição
    req.userId = decoded.userId;
    req.username = decoded.username;
    req.userRole = decoded.role;

    // Continuar para o próximo middleware/rota
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token inválido',
    });
  }
}

// Rota de status/healthcheck
app.get('/api/status', async (req, res) => {
  const dbStatus = dbPool ? 'connected' : 'disconnected';

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
    { method: 'GET', path: '/api/status', description: 'Verificar status do servidor' },
    { method: 'GET', path: '/api/endpoints', description: 'Listar todos os endpoints disponíveis' },
    { method: 'POST', path: '/api/auth/register', description: 'Registrar novo usuário' },
    { method: 'POST', path: '/api/auth/login', description: 'Fazer login' },
    { method: 'POST', path: '/api/auth/logout', description: 'Fazer logout e encerrar sessão' },
    { method: 'POST', path: '/api/auth/refresh-token', description: 'Renovar token de acesso' },
    { method: 'POST', path: '/api/users/change-password', description: 'Alterar senha do usuário' },
    { method: 'GET', path: '/api/characters', description: 'Listar personagens do usuário' },
    { method: 'GET', path: '/api/characters/:id', description: 'Obter detalhes de um personagem' },
    { method: 'POST', path: '/api/characters', description: 'Criar novo personagem' },
    { method: 'PUT', path: '/api/characters/:id', description: 'Atualizar personagem existente' },
    { method: 'DELETE', path: '/api/characters/:id', description: 'Excluir personagem' },
    { method: 'GET', path: '/api/admin/users', description: 'Listar todos os usuários (admin)' },
    { method: 'PUT', path: '/api/admin/users/:id/ban', description: 'Banir usuário (admin)' },
    { method: 'PUT', path: '/api/admin/users/:id/unban', description: 'Desbanir usuário (admin)' },
    {
      method: 'PUT',
      path: '/api/admin/users/:id/promote',
      description: 'Promover usuário a admin',
    },
    {
      method: 'GET',
      path: '/api/admin/characters',
      description: 'Listar todos os personagens (admin)',
    },
    {
      method: 'GET',
      path: '/api/admin/stats',
      description: 'Obter estatísticas do sistema (admin)',
    },
  ];

  res.json({
    success: true,
    endpoints,
  });
});

// Validações para registro
const registerValidations = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Nome de usuário pode conter apenas letras, números e sublinhado'),

  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),

  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
];

// Rota de registro
app.post('/api/auth/register', sanitizeBody, validate(registerValidations), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verificar se usuário já existe
    const [existingUsers] = await dbPool.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Nome de usuário ou email já está em uso',
      });
    }

    // Hash da senha (usando bcrypt)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Inserir usuário no banco de dados
    const [result] = await dbPool.query(
      `INSERT INTO users (username, email, password, role, active) 
         VALUES (?, ?, ?, 'player', true)`,
      [username, email, hashedPassword]
    );

    // Gerar token JWT
    const secret = process.env.JWT_SECRET || 'umbraeternum_dev_secret';
    const token = jwt.sign(
      {
        userId: result.insertId,
        username: username,
        role: 'player',
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRATION || '24h' }
    );

    // Log da ação
    logActivity(`Novo usuário registrado: ${username}`, 'registration');

    return res.status(201).json({
      success: true,
      message: 'Registro realizado com sucesso',
      accessToken: token,
      user: {
        id: result.insertId,
        username,
        email,
        role: 'player',
      },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao registrar usuário',
      error: error.message,
    });
  }
});

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nome de usuário e senha são obrigatórios',
      });
    }

    // Verificar se o usuário existe
    const [rows] = await dbPool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    const user = rows[0];

    // Verificar se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas',
      });
    }

    // Corrigir a função de usuário para admin se o nome de usuário for "admin"
    if (username === 'admin') {
      // Atualizar o papel do usuário para 'admin'
      await dbPool.query('UPDATE users SET role = ? WHERE id = ?', ['admin', user.id]);
      user.role = 'admin';
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET || 'umbraeternum_dev_secret',
      { expiresIn: '24h' }
    );

    // Atualizar data de último login
    try {
      // Verificar se a coluna last_login_at existe
      const [columns] = await dbPool.query('SHOW COLUMNS FROM users LIKE "last_login_at"');
      if (columns.length > 0) {
        await dbPool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
        console.log(`Último login atualizado para o usuário ${username}`);
      } else {
        console.log(`Coluna last_login_at não existe na tabela users`);
      }
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }

    // Registrar login
    logActivity(`Usuário ${username} fez login`, 'login');

    // Enviar resposta
    return res.json({
      success: true,
      message: 'Login realizado com sucesso',
      accessToken: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message,
    });
  }
});

// Função para enviar contagem de jogadores para todos os clientes
function broadcastPlayerCount() {
  console.log(`Total de jogadores online: ${onlinePlayers}`);
  io.emit('players_count', onlinePlayers);
}

// Função para verificar token JWT
function verifyToken(token) {
  if (!token) {
    console.error('Token não fornecido');
    return null;
  }

  // Verificar se o token está em formato Bearer
  if (token.startsWith('Bearer ')) {
    token = token.substring(7);
  }

  // Garantir que o token seja uma string
  if (typeof token !== 'string') {
    console.error('Erro: o token deve ser uma string');
    return null;
  }

  try {
    // Obter o segredo JWT do .env
    const secret = process.env.JWT_SECRET || 'umbraeternum_dev_secret';

    // Verificar o token
    const decoded = jwt.verify(token, secret);
    console.log('Token JWT verificado com sucesso:', decoded);

    // Se chegarmos aqui, o token é válido e decoded contém os dados do payload
    return {
      id: decoded.userId || decoded.id,
      username: decoded.username,
      role: decoded.role || 'user',
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error.message);

    // Para desenvolvimento, criar um usuário simulado
    if (process.env.NODE_ENV === 'development' && token === 'dev_token') {
      console.log('Usando token de desenvolvimento');
      return {
        id: '12345',
        username: 'jogador_teste',
        role: 'user',
      };
    }

    return null;
  }
}

// Função para desconectar todos os usuários
function disconnectAllUsers() {
  console.log(`[${new Date().toISOString()}] [SOCKET] Desconectando todos os usuários...`);

  // Desconectar todos os sockets autenticados
  for (const [socketId, user] of authenticatedSockets.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      console.log(`[${new Date().toISOString()}] [SOCKET] Desconectando usuário: ${user.username}`);
      socket.disconnect(true);
    }
  }

  // Limpar os mapas
  authenticatedSockets.clear();
  lastActivity.clear();

  // Resetar contador de jogadores online
  onlinePlayers = 0;

  // Notificar todos os clientes sobre a desconexão em massa
  io.emit('mass_disconnect', {
    message: 'Todos os usuários foram desconectados pelo servidor',
    timestamp: new Date().toISOString(),
  });

  console.log(`[${new Date().toISOString()}] [SOCKET] Todos os usuários foram desconectados`);
}

// Configuração para Socket.IO
io.on('connection', (socket) => {
  const clientIP = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  console.log(
    `[${new Date().toISOString()}] [SOCKET] Nova conexão: ${socket.id} - IP: ${clientIP}`
  );

  // Registrar a última atividade deste socket
  lastActivity.set(socket.id, Date.now());

  // Enviar contagem atual de jogadores para o novo cliente
  socket.emit('players_count', onlinePlayers);

  // Configurar eventos do socket
  socket.onAny((event, ...args) => {
    if (event !== 'ping' && event !== 'pong') {
      console.log(
        `[${new Date().toISOString()}] [SOCKET] Evento recebido de ${socket.id}: ${event}`
      );
    }
  });

  // Autenticação do socket
  socket.on('authenticate', (data) => {
    console.log(`[${new Date().toISOString()}] [SOCKET] Tentativa de autenticação de ${socket.id}`);
    console.log(
      `[${new Date().toISOString()}] [SOCKET] Dados recebidos:`,
      typeof data,
      data ? (typeof data === 'object' ? 'Objeto' : data.substring(0, 20) + '...') : 'null'
    );

    try {
      // Verificar se o token foi enviado como objeto ou como string
      let tokenString = data;
      if (typeof data === 'object' && data !== null) {
        tokenString = data.token;
        console.log(
          `[${new Date().toISOString()}] [SOCKET] Token extraído do objeto:`,
          tokenString ? tokenString.substring(0, 20) + '...' : 'null'
        );
      }

      // Verificar o token JWT
      const user = verifyToken(tokenString);
      console.log(
        `[${new Date().toISOString()}] [SOCKET] Resultado da verificação do token:`,
        user ? `Usuário autenticado: ${user.username}` : 'Falha na autenticação'
      );

      if (user) {
        // Verificar se o usuário já está conectado em outro socket
        for (const [existingSocketId, existingUser] of authenticatedSockets.entries()) {
          if (existingUser.id === user.id) {
            console.log(
              `[${new Date().toISOString()}] [SOCKET] Usuário ${user.username} já está conectado em outro socket (${existingSocketId})`
            );

            // Desconectar o socket existente
            const existingSocket = io.sockets.sockets.get(existingSocketId);
            if (existingSocket) {
              existingSocket.disconnect(true);
            }

            // Remover do mapa de autenticados
            authenticatedSockets.delete(existingSocketId);
            onlinePlayers = Math.max(0, onlinePlayers - 1);
          }
        }

        console.log(
          `[${new Date().toISOString()}] [SOCKET] Usuário ${user.username} autenticado com sucesso`
        );

        // Armazenar o ID do usuário no objeto do socket
        socket.userId = user.id;
        socket.username = user.username;

        // Adicionar o socket à sala específica do usuário
        socket.join(`user_${user.id}`);

        // Registrar o usuário como online
        authenticatedSockets.set(socket.id, user);
        onlinePlayers++;
        console.log(`[${new Date().toISOString()}] [SOCKET] Jogadores online: ${onlinePlayers}`);
        io.emit('players_count', onlinePlayers);

        // Enviar confirmação de autenticação bem-sucedida
        socket.emit('auth_success', { username: user.username });
      } else {
        console.log(
          `[${new Date().toISOString()}] [SOCKET] Falha na autenticação para socket ${socket.id}`
        );
        socket.emit('auth_error', { message: 'Falha na autenticação. Token inválido.' });
      }
    } catch (error) {
      console.error('Erro durante autenticação:', error);
      socket.emit('system_message', {
        message: 'Erro durante autenticação',
        type: 'error',
      });
    }
  });

  // Lidar com pings do cliente para medir latência
  socket.on('ping', (timestamp) => {
    // Registrar a última atividade
    lastActivity.set(socket.id, Date.now());

    // Responder imediatamente com o mesmo timestamp
    socket.emit('pong', timestamp);
  });

  // Lidar com a desconexão do socket
  socket.on('disconnect', (reason) => {
    console.log(
      `[${new Date().toISOString()}] [SOCKET] Desconexão: ${socket.id} - Motivo: ${reason}`
    );

    // Verificar se o socket estava autenticado
    if (authenticatedSockets.has(socket.id)) {
      const user = authenticatedSockets.get(socket.id);

      // Remover o socket do mapa de autenticados
      authenticatedSockets.delete(socket.id);

      // Decrementar contador de jogadores online
      onlinePlayers = Math.max(0, onlinePlayers - 1);
      broadcastPlayerCount();

      // Log de logout
      logActivity(`Usuário ${user.username} saiu do jogo`, 'logout');

      // Notificar todos os usuários sobre o logout
      io.emit('logout_notification', {
        username: user.username,
        timestamp: new Date().toISOString(),
      });
    }

    // Remover do mapa de atividades
    lastActivity.delete(socket.id);
  });

  socket.on('error', (error) => {
    console.error(`[${new Date().toISOString()}] [SOCKET] Erro no socket ${socket.id}:`, error);
  });
});

// Verificar conexões inativas periodicamente (a cada 5 minutos)
const INACTIVE_TIMEOUT = 15 * 60 * 1000; // 15 minutos em milissegundos
setInterval(
  () => {
    const now = Date.now();
    let inactiveCount = 0;

    for (const [socketId, lastTime] of lastActivity.entries()) {
      if (now - lastTime > INACTIVE_TIMEOUT) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          inactiveCount++;
          console.log(`Desconectando socket inativo: ${socketId}`);
          socket.disconnect(true);
        } else {
          // Socket já não existe, limpar do mapa
          lastActivity.delete(socketId);
        }
      }
    }

    if (inactiveCount > 0) {
      console.log(`Desconectados ${inactiveCount} sockets inativos`);
    }
  },
  5 * 60 * 1000
); // Verificar a cada 5 minutos

// Enviar ping periódico para todos os clientes (a cada 30 segundos)
setInterval(() => {
  io.emit('server_ping', {
    timestamp: Date.now(),
    message: 'Ping do servidor',
  });
  console.log(`Enviando ping para ${io.engine.clientsCount} clientes conectados`);
}, 30 * 1000);

// Rotas de personagens (characters)
app.get('/api/characters', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Buscar personagens do usuário
    const characters = await Character.findByUserId(userId);

    return res.status(200).json({
      success: true,
      data: characters,
    });
  } catch (error) {
    console.error('Erro ao listar personagens:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar personagens',
      error: error.message,
    });
  }
});

app.get('/api/characters/:id', authenticate, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id, 10);
    const userId = req.userId;

    // Buscar o personagem
    const character = await Character.findById(characterId);

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Personagem não encontrado',
      });
    }

    // Verificar se o personagem pertence ao usuário
    if (character.userId !== userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este personagem',
      });
    }

    return res.status(200).json({
      success: true,
      data: character,
    });
  } catch (error) {
    console.error('Erro ao buscar personagem:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar personagem',
      error: error.message,
    });
  }
});

app.post('/api/characters', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    // Validação básica
    if (!req.body.name || !req.body.class) {
      return res.status(400).json({
        success: false,
        message: 'Nome e classe do personagem são obrigatórios',
      });
    }

    // Validar comprimento do nome
    if (req.body.name.length < 3 || req.body.name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Nome do personagem deve ter entre 3 e 50 caracteres',
      });
    }

    // Criar dados do personagem
    const characterData = {
      userId,
      name: req.body.name,
      class: req.body.class,
      strength: req.body.strength || 10,
      dexterity: req.body.dexterity || 10,
      constitution: req.body.constitution || 10,
      intelligence: req.body.intelligence || 10,
      wisdom: req.body.wisdom || 10,
      charisma: req.body.charisma || 10,
      backstory: req.body.backstory || '',
    };

    // Criar o personagem
    const newCharacter = await Character.create(characterData);

    return res.status(201).json({
      success: true,
      message: 'Personagem criado com sucesso',
      data: newCharacter,
    });
  } catch (error) {
    console.error('Erro ao criar personagem:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar personagem',
      error: error.message,
    });
  }
});

app.put('/api/characters/:id', authenticate, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id, 10);
    const userId = req.userId;

    // Buscar o personagem
    const character = await Character.findById(characterId);

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Personagem não encontrado',
      });
    }

    // Verificar se o personagem pertence ao usuário
    if (character.userId !== userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este personagem',
      });
    }

    // Preparar dados para atualização
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.class) updates.class = req.body.class;
    if (req.body.strength) updates.strength = req.body.strength;
    if (req.body.dexterity) updates.dexterity = req.body.dexterity;
    if (req.body.constitution) updates.constitution = req.body.constitution;
    if (req.body.intelligence) updates.intelligence = req.body.intelligence;
    if (req.body.wisdom) updates.wisdom = req.body.wisdom;
    if (req.body.charisma) updates.charisma = req.body.charisma;
    if (req.body.backstory) updates.backstory = req.body.backstory;

    // Atualizar personagem
    const updatedCharacter = await character.update(updates);

    return res.status(200).json({
      success: true,
      message: 'Personagem atualizado com sucesso',
      data: updatedCharacter,
    });
  } catch (error) {
    console.error('Erro ao atualizar personagem:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar personagem',
      error: error.message,
    });
  }
});

app.delete('/api/characters/:id', authenticate, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id, 10);
    const userId = req.userId;

    // Buscar o personagem
    const character = await Character.findById(characterId);

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Personagem não encontrado',
      });
    }

    // Verificar se o personagem pertence ao usuário
    if (character.userId !== userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado a este personagem',
      });
    }

    // Desativar personagem (soft delete)
    await character.deactivate();

    return res.status(200).json({
      success: true,
      message: 'Personagem excluído com sucesso',
    });
  } catch (error) {
    console.error('Erro ao excluir personagem:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir personagem',
      error: error.message,
    });
  }
});

// ======== ROTAS DE ADMINISTRAÇÃO ========
// Middleware para verificar se o usuário é administrador
function isAdmin(req, res, next) {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso restrito a administradores',
    });
  }
  next();
}

// Rota para listar todos os usuários (admin)
app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
  try {
    // Buscar todos os usuários
    const [users] = await dbPool.query(`
      SELECT id, username, email, role, active, created_at, last_login_at 
      FROM users 
      ORDER BY id ASC
    `);

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: error.message,
    });
  }
});

// Rota para banir um usuário (admin)
app.put('/api/admin/users/:id/ban', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Verificar se o usuário existe
    const [users] = await dbPool.query('SELECT id, username, role FROM users WHERE id = ?', [
      userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    const user = users[0];

    // Não permitir banir um admin
    if (user.role === 'admin' && user.id !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Não é possível banir outro administrador',
      });
    }

    // Banir usuário (desativar conta)
    await dbPool.query('UPDATE users SET active = FALSE WHERE id = ?', [userId]);

    // Log da ação
    logActivity(`Administrador ${req.username} baniu o usuário ${user.username}`, 'admin');

    return res.status(200).json({
      success: true,
      message: 'Usuário banido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao banir usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao banir usuário',
      error: error.message,
    });
  }
});

// Rota para desbanir um usuário (admin)
app.put('/api/admin/users/:id/unban', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Verificar se o usuário existe
    const [users] = await dbPool.query('SELECT id, username FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    const user = users[0];

    // Desbanir usuário (reativar conta)
    await dbPool.query('UPDATE users SET active = TRUE WHERE id = ?', [userId]);

    // Log da ação
    logActivity(`Administrador ${req.username} desbaniu o usuário ${user.username}`, 'admin');

    return res.status(200).json({
      success: true,
      message: 'Usuário desbanido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desbanir usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao desbanir usuário',
      error: error.message,
    });
  }
});

// Rota para promover um usuário a administrador (admin)
app.put('/api/admin/users/:id/promote', authenticate, isAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    // Verificar se o usuário existe
    const [users] = await dbPool.query('SELECT id, username, role FROM users WHERE id = ?', [
      userId,
    ]);

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado',
      });
    }

    const user = users[0];

    // Verificar se já é admin
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Usuário já é administrador',
      });
    }

    // Promover usuário a administrador
    await dbPool.query('UPDATE users SET role = "admin" WHERE id = ?', [userId]);

    // Log da ação
    logActivity(
      `Administrador ${req.username} promoveu o usuário ${user.username} a administrador`,
      'admin'
    );

    return res.status(200).json({
      success: true,
      message: 'Usuário promovido a administrador com sucesso',
    });
  } catch (error) {
    console.error('Erro ao promover usuário:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao promover usuário',
      error: error.message,
    });
  }
});

// Rota para listar todos os personagens (admin)
app.get('/api/admin/characters', authenticate, isAdmin, async (req, res) => {
  try {
    // Buscar todos os personagens com informações do usuário
    const [characters] = await dbPool.query(`
      SELECT c.id, c.user_id as userId, u.username, c.name, c.class, c.level, c.active, 
             c.created_at as createdAt
      FROM characters c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.id ASC
    `);

    return res.status(200).json({
      success: true,
      data: characters,
    });
  } catch (error) {
    console.error('Erro ao listar personagens:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar personagens',
      error: error.message,
    });
  }
});

// Rota para obter estatísticas do sistema (admin)
app.get('/api/admin/stats', authenticate, isAdmin, async (req, res) => {
  try {
    // Total de usuários
    const [totalUsers] = await dbPool.query('SELECT COUNT(*) as count FROM users');

    // Usuários ativos e banidos
    const [userStats] = await dbPool.query(`
      SELECT active, COUNT(*) as count FROM users GROUP BY active
    `);

    // Total de personagens
    const [totalCharacters] = await dbPool.query('SELECT COUNT(*) as count FROM characters');

    // Personagens ativos
    const [activeCharacters] = await dbPool.query(
      'SELECT COUNT(*) as count FROM characters WHERE active = TRUE'
    );

    // Distribuição de classes
    const [classDistribution] = await dbPool.query(`
      SELECT class, COUNT(*) as count FROM characters WHERE active = TRUE GROUP BY class
    `);

    // Registros hoje
    const today = new Date().toISOString().split('T')[0];
    const [registrationsToday] = await dbPool.query(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = ?',
      [today]
    );

    // Logins hoje
    const [loginsToday] = await dbPool.query(
      'SELECT COUNT(*) as count FROM users WHERE DATE(last_login_at) = ?',
      [today]
    );

    // Formatar as estatísticas
    const activeUsersCount = userStats.find((stat) => stat.active === 1)?.count || 0;
    const bannedUsersCount = userStats.find((stat) => stat.active === 0)?.count || 0;

    const classStats = {};
    classDistribution.forEach((item) => {
      classStats[item.class] = item.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: totalUsers[0].count,
        activeUsers: activeUsersCount,
        bannedUsers: bannedUsersCount,
        totalCharacters: totalCharacters[0].count,
        activeCharacters: activeCharacters[0].count,
        classDistribution: classStats,
        registrationsToday: registrationsToday[0].count,
        loginsToday: loginsToday[0].count,
      },
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas',
      error: error.message,
    });
  }
});

// Endpoint para alterar senha
app.post('/api/users/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    // Validação dos campos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias',
      });
    }

    // Validação da nova senha
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'A nova senha deve ter pelo menos 6 caracteres',
      });
    }

    // Buscar usuário no banco de dados
    const connection = await dbPool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT id, username, password FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      const user = users[0];

      // Verificar a senha atual
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Senha atual incorreta',
        });
      }

      // Gerar hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Atualizar a senha no banco de dados
      await connection.query('UPDATE users SET password = ? WHERE id = ?', [
        hashedPassword,
        userId,
      ]);

      logActivity(`Usuário ${user.username} alterou sua senha`, 'security');

      return res.status(200).json({
        success: true,
        message: 'Senha alterada com sucesso',
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao processar sua solicitação',
    });
  }
});

// Adicionar rota para desconectar todos os usuários (apenas para administradores)
app.post('/api/admin/disconnect-all', authenticate, async (req, res) => {
  try {
    // Verificar se o usuário é administrador
    if (req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas administradores podem executar esta ação.',
      });
    }

    // Desconectar todos os usuários
    disconnectAllUsers();

    return res.status(200).json({
      success: true,
      message: 'Todos os usuários foram desconectados com sucesso',
    });
  } catch (error) {
    console.error('Erro ao desconectar usuários:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao desconectar usuários',
      error: error.message,
    });
  }
});

// Rota de logout
app.post('/api/auth/logout', authenticate, async (req, res) => {
  try {
    const userId = req.userId;
    const username = req.username;

    // Encontrar e desconectar todos os sockets do usuário
    for (const [socketId, user] of authenticatedSockets.entries()) {
      if (user.id === userId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          console.log(
            `[${new Date().toISOString()}] [SOCKET] Desconectando usuário ${username} no socket ${socketId}`
          );
          socket.disconnect(true);

          // Remover do mapa de autenticados
          authenticatedSockets.delete(socketId);

          // Decrementar contador de jogadores online
          onlinePlayers = Math.max(0, onlinePlayers - 1);
          broadcastPlayerCount();

          // Log de logout
          logActivity(`Usuário ${username} fez logout`, 'logout');

          // Notificar outros usuários sobre o logout
          io.emit('logout_notification', {
            username: username,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao fazer logout',
      error: error.message,
    });
  }
});

// Definir a porta do servidor explicitamente
const PORT = 34567;

async function startServer() {
  // Reset online players count on server start
  onlinePlayers = 0;

  // Tentar conectar ao banco de dados
  await setupDatabase();

  // Iniciar o servidor HTTP
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`Socket.IO: ws://localhost:${PORT}`);
    console.log(`Contador de jogadores online resetado: ${onlinePlayers}`);

    // Registrar inicialização nos logs
    logActivity('Servidor iniciado', 'system');
  });
}

// Iniciar o servidor
startServer().catch((error) => {
  console.error('Erro ao iniciar servidor:', error);
  logActivity(`Erro ao iniciar servidor: ${error.message}`, 'error');
});

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('Exceção não tratada:', error);
  logActivity(`Erro crítico: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rejeição não tratada:', reason);
  logActivity(`Erro de promessa não tratada: ${reason}`, 'error');
});
