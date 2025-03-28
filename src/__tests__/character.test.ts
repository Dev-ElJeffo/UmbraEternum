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
let authToken: string;

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
  
  // Rotas de personagens
  app.post('/api/characters', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { name, class: characterClass } = req.body;
      const user = (req as any).user;
      
      // Validação básica
      if (!name || !characterClass) {
        return res.status(400).json({ message: 'Nome e classe são obrigatórios' });
      }
      
      // Criar novo personagem
      const result = await mockPool.query(
        'INSERT INTO characters (user_id, name, class) VALUES (?, ?, ?)',
        [user.id, name, characterClass]
      );
      
      // Obter o novo personagem
      const newCharacter = mockCharacters.find(char => char.id === (result as any).insertId);
      
      res.status(201).json({ 
        message: 'Personagem criado com sucesso',
        character: newCharacter
      });
    } catch (error) {
      console.error('Erro ao criar personagem:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.get('/api/characters', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      
      // Buscar personagens do usuário
      const characters = await mockPool.query(
        'SELECT * FROM characters WHERE user_id = ? AND active = true',
        [user.id]
      );
      
      res.status(200).json(characters);
    } catch (error) {
      console.error('Erro ao buscar personagens:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.get('/api/characters/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const characterId = parseInt(req.params.id);
      
      // Buscar personagem específico
      const characters = await mockPool.query(
        'SELECT * FROM characters WHERE id = ? AND user_id = ? AND active = true',
        [characterId, user.id]
      );
      
      if (!characters || (Array.isArray(characters) && characters.length === 0)) {
        return res.status(404).json({ message: 'Personagem não encontrado' });
      }
      
      const character = Array.isArray(characters) ? characters[0] : characters;
      res.status(200).json(character);
    } catch (error) {
      console.error('Erro ao buscar personagem:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.put('/api/characters/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const characterId = parseInt(req.params.id);
      const { name, class: characterClass, level } = req.body;
      
      // Validação básica
      if (!name || !characterClass) {
        return res.status(400).json({ message: 'Nome e classe são obrigatórios' });
      }
      
      // Verificar se o personagem existe e pertence ao usuário
      const characters = await mockPool.query(
        'SELECT * FROM characters WHERE id = ? AND user_id = ? AND active = true',
        [characterId, user.id]
      );
      
      if (!characters || (Array.isArray(characters) && characters.length === 0)) {
        return res.status(404).json({ message: 'Personagem não encontrado' });
      }
      
      // Atualizar o personagem
      await mockPool.query(
        'UPDATE characters SET name = ?, class = ?, level = ? WHERE id = ?',
        [name, characterClass, level || 1, characterId]
      );
      
      // Obter o personagem atualizado
      const updatedCharacters = await mockPool.query(
        'SELECT * FROM characters WHERE id = ?',
        [characterId]
      );
      
      const updatedCharacter = Array.isArray(updatedCharacters) ? updatedCharacters[0] : updatedCharacters;
      res.status(200).json({ 
        message: 'Personagem atualizado com sucesso',
        character: updatedCharacter
      });
    } catch (error) {
      console.error('Erro ao atualizar personagem:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  app.delete('/api/characters/:id', authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const characterId = parseInt(req.params.id);
      
      // Verificar se o personagem existe e pertence ao usuário
      const characters = await mockPool.query(
        'SELECT * FROM characters WHERE id = ? AND user_id = ? AND active = true',
        [characterId, user.id]
      );
      
      if (!characters || (Array.isArray(characters) && characters.length === 0)) {
        return res.status(404).json({ message: 'Personagem não encontrado' });
      }
      
      // Soft delete do personagem
      await mockPool.query(
        'UPDATE characters SET active = false WHERE id = ?',
        [characterId]
      );
      
      res.status(200).json({ message: 'Personagem desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao desativar personagem:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });
  
  // Iniciar o servidor na porta de teste
  server = app.listen(34502);
  
  // Criar token de autenticação para testes
  authToken = jwt.sign(
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

describe('Testes de Personagens', () => {
  it('Deve criar um novo personagem', async () => {
    const newCharacter = {
      name: 'Test Character',
      class: 'Warrior'
    };
    
    const res = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newCharacter);
    
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Personagem criado com sucesso');
    expect(res.body.character).toBeDefined();
    expect(res.body.character.name).toBe(newCharacter.name);
    expect(res.body.character.class).toBe(newCharacter.class);
  });
  
  it('Não deve criar personagem sem token', async () => {
    const newCharacter = {
      name: 'Test Character',
      class: 'Warrior'
    };
    
    const res = await request(app)
      .post('/api/characters')
      .send(newCharacter);
    
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token de autenticação não fornecido');
  });
  
  it('Não deve criar personagem sem nome ou classe', async () => {
    const incompleteCharacter = {
      name: 'Incomplete Character'
      // Sem classe
    };
    
    const res = await request(app)
      .post('/api/characters')
      .set('Authorization', `Bearer ${authToken}`)
      .send(incompleteCharacter);
    
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Nome e classe são obrigatórios');
  });
  
  it('Deve listar os personagens do usuário', async () => {
    const res = await request(app)
      .get('/api/characters')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
  
  it('Deve buscar um personagem específico', async () => {
    // Assumimos que existe um personagem com ID 2 pertencente ao usuário 2
    const res = await request(app)
      .get('/api/characters/2')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.id).toBe(2);
  });
  
  it('Deve atualizar um personagem', async () => {
    const updatedInfo = {
      name: 'Updated Character',
      class: 'Paladin',
      level: 5
    };
    
    const res = await request(app)
      .put('/api/characters/2')
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedInfo);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Personagem atualizado com sucesso');
    expect(res.body.character).toBeDefined();
    expect(res.body.character.name).toBe(updatedInfo.name);
    expect(res.body.character.class).toBe(updatedInfo.class);
    expect(res.body.character.level).toBe(updatedInfo.level);
  });
  
  it('Deve excluir um personagem (soft delete)', async () => {
    // Assumimos que existe um personagem com ID 3 pertencente ao usuário 2
    const res = await request(app)
      .delete('/api/characters/3')
      .set('Authorization', `Bearer ${authToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Personagem desativado com sucesso');
    
    // Verificar se o personagem foi realmente desativado
    const character = mockCharacters.find(char => char.id === 3);
    expect(character).toBeDefined();
    expect(character?.active).toBe(false);
  });
}); 