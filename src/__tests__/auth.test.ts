import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { mockPool, mockUsers } from './mocks/db.mock';

// Mock do módulo mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => mockPool)
}));

// Mock do módulo bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn((senha, hash) => Promise.resolve(senha === 'senha_correta')),
  hash: jest.fn((senha) => Promise.resolve('senha_hash'))
}));

// Aplicativo Express e servidor para testes
let app: express.Application;
let server: any;

beforeAll(() => {
  // Configurar o aplicativo Express
  app = express();
  
  // Configurações básicas
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use(limiter);
  
  // Middleware para verificar token JWT
  const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token de autenticação não fornecido' });
    }
    
    try {
      const decoded = jwt.verify(token, 'chave_secreta_teste');
      (req as any).user = decoded;
      next();
    } catch (err) {
      return res.status(403).json({ message: 'Token inválido ou expirado' });
    }
  };
  
  // Middleware para verificar se o usuário é admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if ((req as any).user && (req as any).user.role === 'admin') {
      next();
    } else {
      res.status(403).json({ message: 'Acesso negado. Permissão de administrador necessária.' });
    }
  };
  
  // Rotas de autenticação
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password } = req.body;
      
      // Validação básica
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
      }
      
      // Verificar se o usuário já existe
      const existingUser = mockUsers.find(user => user.username === username);
      if (existingUser) {
        return res.status(409).json({ message: 'Nome de usuário já existe' });
      }
      
      // Criar novo usuário
      const result = await mockPool.query(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, password]
      );
      
      res.status(201).json({ message: 'Usuário registrado com sucesso' });
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      // Validação básica
      if (!username || !password) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios' });
      }
      
      // Buscar usuário
      const user = mockUsers.find(user => user.username === username);
      if (!user) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Comparar senha (usando mock)
      const validPassword = await require('bcrypt').compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
      
      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        'chave_secreta_teste',
        { expiresIn: '1h' }
      );
      
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
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.get('/api/status', (req: Request, res: Response) => {
    res.status(200).json({ status: 'online', version: '1.0.0' });
  });
  
  // Inicie o servidor na porta de teste
  server = app.listen(34501);
});

afterAll(() => {
  // Fechar o servidor após os testes
  if (server) {
    server.close();
  }
});

describe('Testes de Autenticação', () => {
  it('Deve registrar um novo usuário com sucesso', async () => {
    const newUser = {
      username: 'novousuario',
      email: 'novo@example.com',
      password: 'senha123'
    };
    
    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser);
    
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Usuário registrado com sucesso');
  });
  
  it('Não deve registrar usuário com dados incompletos', async () => {
    const incompleteUser = {
      username: 'incompleto',
      // Sem email e senha
    };
    
    const res = await request(app)
      .post('/api/auth/register')
      .send(incompleteUser);
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Todos os campos são obrigatórios');
  });
  
  it('Não deve registrar usuário com mesmo username', async () => {
    // Primeiro, tentamos registrar um usuário com o mesmo username que já existe nos mocks
    const duplicateUser = {
      username: 'admin', // Este username já existe no mock
      email: 'outro@example.com',
      password: 'senha123'
    };
    
    const res = await request(app)
      .post('/api/auth/register')
      .send(duplicateUser);
    
    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Nome de usuário já existe');
  });
  
  it('Deve fazer login com credenciais válidas', async () => {
    // Configurar o mock do bcrypt para retornar true para esta comparação específica
    require('bcrypt').compare.mockImplementationOnce(() => Promise.resolve(true));
    
    const loginData = {
      username: 'admin',
      password: 'senha_correta'
    };
    
    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login bem-sucedido');
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.username).toBe('admin');
  });
  
  it('Não deve fazer login com credenciais inválidas', async () => {
    // Configurar o mock do bcrypt para retornar false para esta comparação específica
    require('bcrypt').compare.mockImplementationOnce(() => Promise.resolve(false));
    
    const loginData = {
      username: 'admin',
      password: 'senha_incorreta'
    };
    
    const res = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
  });
  
  it('Deve retornar o status do servidor', async () => {
    const res = await request(app)
      .get('/api/status');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
  });
}); 