import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express, { Request, Response, NextFunction } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { mockPool, mockUsers, mockCharacters } from './mocks/db.mock';

// Mock do módulo mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => mockPool)
}));

// Mock JWT Secret
const JWT_SECRET = 'chave_secreta_teste';

// Aplicativo Express e servidor para testes
let app: express.Application;
let server: any;
let adminToken: string;
let userToken: string;

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
      const decoded = jwt.verify(token, JWT_SECRET);
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
  
  // Rotas administrativas
  app.get('/api/admin/users', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      // Listar todos os usuários
      const users = await mockPool.query('SELECT * FROM users');
      res.status(200).json(users);
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.get('/api/admin/characters', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      // Listar todos os personagens
      const characters = await mockPool.query('SELECT * FROM characters');
      res.status(200).json(characters);
    } catch (error) {
      console.error('Erro ao listar personagens:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.put('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const { role } = req.body;
      
      // Validar role
      if (!role || !['admin', 'player', 'moderator'].includes(role)) {
        return res.status(400).json({ message: 'Role inválido' });
      }
      
      // Verificar se o usuário existe
      const users = await mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
      
      if (!users || (Array.isArray(users) && users.length === 0)) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Atualizar o role do usuário
      await mockPool.query(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, userId]
      );
      
      // Obter o usuário atualizado
      const updatedUsers = await mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
      const updatedUser = Array.isArray(updatedUsers) ? updatedUsers[0] : updatedUsers;
      
      res.status(200).json({
        message: 'Role do usuário atualizado com sucesso',
        user: updatedUser
      });
    } catch (error) {
      console.error('Erro ao atualizar role do usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Verificar se o usuário existe
      const users = await mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
      
      if (!users || (Array.isArray(users) && users.length === 0)) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }
      
      // Soft delete do usuário
      await mockPool.query(
        'UPDATE users SET active = false WHERE id = ?',
        [userId]
      );
      
      res.status(200).json({ message: 'Usuário desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  // Iniciar o servidor na porta de teste
  server = app.listen(34503);
  
  // Criar tokens de autenticação para testes
  adminToken = jwt.sign(
    { id: 1, username: 'admin', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  userToken = jwt.sign(
    { id: 2, username: 'player1', role: 'player' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
});

afterAll(() => {
  // Fechar o servidor após os testes
  if (server) {
    server.close();
  }
});

describe('Testes Administrativos', () => {
  it('Admin deve listar todos os usuários', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
  
  it('Usuário normal não deve acessar lista de usuários', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Acesso negado. Permissão de administrador necessária.');
  });
  
  it('Admin deve listar todos os personagens', async () => {
    const res = await request(app)
      .get('/api/admin/characters')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
  
  it('Admin deve alterar o role de um usuário', async () => {
    const userId = 2; // ID do usuário player1
    const newRole = 'moderator';
    
    const res = await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: newRole });
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Role do usuário atualizado com sucesso');
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.role).toBe(newRole);
  });
  
  it('Admin não deve alterar role com valor inválido', async () => {
    const userId = 2; // ID do usuário player1
    const invalidRole = 'invalid_role';
    
    const res = await request(app)
      .put(`/api/admin/users/${userId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: invalidRole });
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Role inválido');
  });
  
  it('Admin deve desativar um usuário', async () => {
    const userId = 3; // ID do usuário player2
    
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Usuário desativado com sucesso');
    
    // Verificar se o usuário foi realmente desativado
    const user = mockUsers.find(user => user.id === userId);
    expect(user).toBeDefined();
    expect(user?.active).toBe(false);
  });
  
  it('Admin não deve desativar usuário inexistente', async () => {
    const nonExistentUserId = 999;
    
    const res = await request(app)
      .delete(`/api/admin/users/${nonExistentUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Usuário não encontrado');
  });
}); 