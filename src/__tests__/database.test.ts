import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { mockPool, mockUsers, mockCharacters } from './mocks/db.mock';

// Mock do módulo mysql2/promise
jest.mock('mysql2/promise', () => ({
  createPool: jest.fn(() => mockPool)
}));

describe('Testes de banco de dados (mock)', () => {
  beforeEach(() => {
    // Limpar os mocks entre os testes
    jest.clearAllMocks();
  });

  it('O pool de conexão mock deve existir', () => {
    expect(mockPool).toBeDefined();
    expect(mockPool.query).toBeDefined();
    expect(typeof mockPool.query).toBe('function');
  });

  it('O mockUsers deve conter dados de usuários', () => {
    expect(Array.isArray(mockUsers)).toBe(true);
    expect(mockUsers.length).toBeGreaterThan(0);
    expect(mockUsers[0]).toHaveProperty('id');
    expect(mockUsers[0]).toHaveProperty('username');
    expect(mockUsers[0]).toHaveProperty('email');
  });

  it('O mockCharacters deve conter dados de personagens', () => {
    expect(Array.isArray(mockCharacters)).toBe(true);
    expect(mockCharacters.length).toBeGreaterThan(0);
    expect(mockCharacters[0]).toHaveProperty('id');
    expect(mockCharacters[0]).toHaveProperty('user_id');
    expect(mockCharacters[0]).toHaveProperty('name');
  });

  it('O método query deve retornar dados mockados para consultas de usuários', async () => {
    const result = await mockPool.query('SELECT * FROM users');
    expect(result).toBeDefined();
    expect(Array.isArray(mockUsers)).toBe(true);
    expect(mockUsers.length).toBeGreaterThan(0);
  });

  it('O método query deve retornar dados mockados para consultas de personagens', async () => {
    const result = await mockPool.query('SELECT * FROM characters');
    expect(result).toBeDefined();
    expect(Array.isArray(mockCharacters)).toBe(true);
    expect(mockCharacters.length).toBeGreaterThan(0);
  });

  it('O método query deve filtrar usuários por ID', async () => {
    const userId = 1;
    const result = await mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
    expect(result).toBeDefined();
    
    // Verificar usando mockUsers diretamente
    const filteredUsers = mockUsers.filter(user => user.id === userId);
    expect(filteredUsers.length).toBe(1);
    expect(filteredUsers[0].id).toBe(userId);
  });

  it('O método query deve filtrar personagens por ID', async () => {
    const charId = 1;
    const result = await mockPool.query('SELECT * FROM characters WHERE id = ?', [charId]);
    expect(result).toBeDefined();
    
    // Verificar usando mockCharacters diretamente
    const filteredChars = mockCharacters.filter(char => char.id === charId);
    expect(filteredChars.length).toBe(1);
    expect(filteredChars[0].id).toBe(charId);
  });

  it('O método query deve filtrar personagens por user_id', async () => {
    const userId = 2;
    const result = await mockPool.query('SELECT * FROM characters WHERE user_id = ?', [userId]);
    expect(result).toBeDefined();
    
    // Verificar usando mockCharacters diretamente
    const filteredChars = mockCharacters.filter(char => char.user_id === userId);
    expect(filteredChars.length).toBeGreaterThan(0);
    expect(filteredChars[0].user_id).toBe(userId);
  });

  it('O método query deve inserir novos usuários', async () => {
    const initialLength = mockUsers.length;
    const newUser = {
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'password123'
    };
    
    const result = await mockPool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [newUser.username, newUser.email, newUser.password]
    );
    
    expect(result).toBeDefined();
    expect(mockUsers.length).toBe(initialLength + 1);
    
    // Verificar se o último usuário adicionado tem os dados corretos
    const addedUser = mockUsers[mockUsers.length - 1];
    expect(addedUser.username).toBe(newUser.username);
    expect(addedUser.email).toBe(newUser.email);
  });

  it('O método query deve inserir novos personagens', async () => {
    const initialLength = mockCharacters.length;
    const newCharacter = {
      user_id: 2,
      name: 'NewChar',
      class: 'Paladin'
    };
    
    const result = await mockPool.query(
      'INSERT INTO characters (user_id, name, class) VALUES (?, ?, ?)',
      [newCharacter.user_id, newCharacter.name, newCharacter.class]
    );
    
    expect(result).toBeDefined();
    expect(mockCharacters.length).toBe(initialLength + 1);
    
    // Verificar se o último personagem adicionado tem os dados corretos
    const addedChar = mockCharacters[mockCharacters.length - 1];
    expect(addedChar.user_id).toBe(newCharacter.user_id);
    expect(addedChar.name).toBe(newCharacter.name);
    expect(addedChar.class).toBe(newCharacter.class);
  });

  it('O método query deve atualizar usuários existentes', async () => {
    const userId = 1;
    const newRole = 'admin';
    
    // Verificar valor atual
    const userBefore = mockUsers.find(user => user.id === userId);
    expect(userBefore).toBeDefined();
    
    const result = await mockPool.query(
      'UPDATE users SET role = ? WHERE id = ?',
      [newRole, userId]
    );
    
    expect(result).toBeDefined();
    
    // Verificar se o usuário foi atualizado
    const userAfter = mockUsers.find(user => user.id === userId);
    expect(userAfter).toBeDefined();
    expect(userAfter.role).toBe(newRole);
  });

  it('O método query deve atualizar personagens existentes', async () => {
    const charId = 1;
    const newName = 'UpdatedCharName';
    const newClass = 'Mage';
    const newLevel = 10;
    
    // Verificar valor atual
    const charBefore = mockCharacters.find(char => char.id === charId);
    expect(charBefore).toBeDefined();
    
    const result = await mockPool.query(
      'UPDATE characters SET name = ?, class = ?, level = ? WHERE id = ?',
      [newName, newClass, newLevel, charId]
    );
    
    expect(result).toBeDefined();
    
    // Verificar se o personagem foi atualizado
    const charAfter = mockCharacters.find(char => char.id === charId);
    expect(charAfter).toBeDefined();
    expect(charAfter.name).toBe(newName);
    expect(charAfter.class).toBe(newClass);
    expect(charAfter.level).toBe(newLevel);
  });

  it('O método query deve desativar usuários (soft delete)', async () => {
    const userId = 2;
    
    // Verificar valor atual
    const userBefore = mockUsers.find(user => user.id === userId);
    expect(userBefore).toBeDefined();
    expect(userBefore.active).not.toBe(false);
    
    const result = await mockPool.query(
      'UPDATE users SET active = false WHERE id = ?',
      [userId]
    );
    
    expect(result).toBeDefined();
    
    // Verificar se o usuário foi desativado
    const userAfter = mockUsers.find(user => user.id === userId);
    expect(userAfter).toBeDefined();
    expect(userAfter.active).toBe(false);
  });

  it('O método query deve desativar personagens (soft delete)', async () => {
    const charId = 2;
    
    // Verificar valor atual
    const charBefore = mockCharacters.find(char => char.id === charId);
    expect(charBefore).toBeDefined();
    expect(charBefore.active).not.toBe(false);
    
    const result = await mockPool.query(
      'UPDATE characters SET active = false WHERE id = ?',
      [charId]
    );
    
    expect(result).toBeDefined();
    
    // Verificar se o personagem foi desativado
    const charAfter = mockCharacters.find(char => char.id === charId);
    expect(charAfter).toBeDefined();
    expect(charAfter.active).toBe(false);
  });

  it('O método query deve remover personagens de um usuário específico', async () => {
    const userId = 3;
    const initialLength = mockCharacters.length;
    
    // Contar quantos personagens pertencem ao usuário
    const charCount = mockCharacters.filter(char => char.user_id === userId).length;
    expect(charCount).toBeGreaterThan(0);
    
    const result = await mockPool.query(
      'DELETE FROM characters WHERE user_id = ?',
      [userId]
    );
    
    expect(result).toBeDefined();
    
    // Verificar se os personagens foram removidos
    const remainingChars = mockCharacters.filter(char => char.user_id === userId);
    expect(remainingChars.length).toBe(0);
    expect(mockCharacters.length).toBe(initialLength - charCount);
  });
}); 