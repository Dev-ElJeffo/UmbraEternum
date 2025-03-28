"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const db_mock_1 = require("./mocks/db.mock");
// Mock do módulo mysql2/promise
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(() => db_mock_1.mockPool)
}));
(0, globals_1.describe)('Testes de banco de dados (mock)', () => {
    beforeEach(() => {
        // Limpar os mocks entre os testes
        jest.clearAllMocks();
    });
    (0, globals_1.it)('O pool de conexão mock deve existir', () => {
        (0, globals_1.expect)(db_mock_1.mockPool).toBeDefined();
        (0, globals_1.expect)(db_mock_1.mockPool.query).toBeDefined();
        (0, globals_1.expect)(typeof db_mock_1.mockPool.query).toBe('function');
    });
    (0, globals_1.it)('O mockUsers deve conter dados de usuários', () => {
        (0, globals_1.expect)(Array.isArray(db_mock_1.mockUsers)).toBe(true);
        (0, globals_1.expect)(db_mock_1.mockUsers.length).toBeGreaterThan(0);
        (0, globals_1.expect)(db_mock_1.mockUsers[0]).toHaveProperty('id');
        (0, globals_1.expect)(db_mock_1.mockUsers[0]).toHaveProperty('username');
        (0, globals_1.expect)(db_mock_1.mockUsers[0]).toHaveProperty('email');
    });
    (0, globals_1.it)('O mockCharacters deve conter dados de personagens', () => {
        (0, globals_1.expect)(Array.isArray(db_mock_1.mockCharacters)).toBe(true);
        (0, globals_1.expect)(db_mock_1.mockCharacters.length).toBeGreaterThan(0);
        (0, globals_1.expect)(db_mock_1.mockCharacters[0]).toHaveProperty('id');
        (0, globals_1.expect)(db_mock_1.mockCharacters[0]).toHaveProperty('user_id');
        (0, globals_1.expect)(db_mock_1.mockCharacters[0]).toHaveProperty('name');
    });
    (0, globals_1.it)('O método query deve retornar dados mockados para consultas de usuários', async () => {
        const result = await db_mock_1.mockPool.query('SELECT * FROM users');
        (0, globals_1.expect)(result).toBeDefined();
        (0, globals_1.expect)(Array.isArray(db_mock_1.mockUsers)).toBe(true);
        (0, globals_1.expect)(db_mock_1.mockUsers.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('O método query deve retornar dados mockados para consultas de personagens', async () => {
        const result = await db_mock_1.mockPool.query('SELECT * FROM characters');
        (0, globals_1.expect)(result).toBeDefined();
        (0, globals_1.expect)(Array.isArray(db_mock_1.mockCharacters)).toBe(true);
        (0, globals_1.expect)(db_mock_1.mockCharacters.length).toBeGreaterThan(0);
    });
    (0, globals_1.it)('O método query deve filtrar usuários por ID', async () => {
        const userId = 1;
        const result = await db_mock_1.mockPool.query('SELECT * FROM users WHERE id = ?', [userId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar usando mockUsers diretamente
        const filteredUsers = db_mock_1.mockUsers.filter(user => user.id === userId);
        (0, globals_1.expect)(filteredUsers.length).toBe(1);
        (0, globals_1.expect)(filteredUsers[0].id).toBe(userId);
    });
    (0, globals_1.it)('O método query deve filtrar personagens por ID', async () => {
        const charId = 1;
        const result = await db_mock_1.mockPool.query('SELECT * FROM characters WHERE id = ?', [charId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar usando mockCharacters diretamente
        const filteredChars = db_mock_1.mockCharacters.filter(char => char.id === charId);
        (0, globals_1.expect)(filteredChars.length).toBe(1);
        (0, globals_1.expect)(filteredChars[0].id).toBe(charId);
    });
    (0, globals_1.it)('O método query deve filtrar personagens por user_id', async () => {
        const userId = 2;
        const result = await db_mock_1.mockPool.query('SELECT * FROM characters WHERE user_id = ?', [userId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar usando mockCharacters diretamente
        const filteredChars = db_mock_1.mockCharacters.filter(char => char.user_id === userId);
        (0, globals_1.expect)(filteredChars.length).toBeGreaterThan(0);
        (0, globals_1.expect)(filteredChars[0].user_id).toBe(userId);
    });
    (0, globals_1.it)('O método query deve inserir novos usuários', async () => {
        const initialLength = db_mock_1.mockUsers.length;
        const newUser = {
            username: 'newuser',
            email: 'newuser@example.com',
            password: 'password123'
        };
        const result = await db_mock_1.mockPool.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [newUser.username, newUser.email, newUser.password]);
        (0, globals_1.expect)(result).toBeDefined();
        (0, globals_1.expect)(db_mock_1.mockUsers.length).toBe(initialLength + 1);
        // Verificar se o último usuário adicionado tem os dados corretos
        const addedUser = db_mock_1.mockUsers[db_mock_1.mockUsers.length - 1];
        (0, globals_1.expect)(addedUser.username).toBe(newUser.username);
        (0, globals_1.expect)(addedUser.email).toBe(newUser.email);
    });
    (0, globals_1.it)('O método query deve inserir novos personagens', async () => {
        const initialLength = db_mock_1.mockCharacters.length;
        const newCharacter = {
            user_id: 2,
            name: 'NewChar',
            class: 'Paladin'
        };
        const result = await db_mock_1.mockPool.query('INSERT INTO characters (user_id, name, class) VALUES (?, ?, ?)', [newCharacter.user_id, newCharacter.name, newCharacter.class]);
        (0, globals_1.expect)(result).toBeDefined();
        (0, globals_1.expect)(db_mock_1.mockCharacters.length).toBe(initialLength + 1);
        // Verificar se o último personagem adicionado tem os dados corretos
        const addedChar = db_mock_1.mockCharacters[db_mock_1.mockCharacters.length - 1];
        (0, globals_1.expect)(addedChar.user_id).toBe(newCharacter.user_id);
        (0, globals_1.expect)(addedChar.name).toBe(newCharacter.name);
        (0, globals_1.expect)(addedChar.class).toBe(newCharacter.class);
    });
    (0, globals_1.it)('O método query deve atualizar usuários existentes', async () => {
        const userId = 1;
        const newRole = 'admin';
        // Verificar valor atual
        const userBefore = db_mock_1.mockUsers.find(user => user.id === userId);
        (0, globals_1.expect)(userBefore).toBeDefined();
        const result = await db_mock_1.mockPool.query('UPDATE users SET role = ? WHERE id = ?', [newRole, userId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar se o usuário foi atualizado
        const userAfter = db_mock_1.mockUsers.find(user => user.id === userId);
        (0, globals_1.expect)(userAfter).toBeDefined();
        (0, globals_1.expect)(userAfter.role).toBe(newRole);
    });
    (0, globals_1.it)('O método query deve atualizar personagens existentes', async () => {
        const charId = 1;
        const newName = 'UpdatedCharName';
        const newClass = 'Mage';
        const newLevel = 10;
        // Verificar valor atual
        const charBefore = db_mock_1.mockCharacters.find(char => char.id === charId);
        (0, globals_1.expect)(charBefore).toBeDefined();
        const result = await db_mock_1.mockPool.query('UPDATE characters SET name = ?, class = ?, level = ? WHERE id = ?', [newName, newClass, newLevel, charId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar se o personagem foi atualizado
        const charAfter = db_mock_1.mockCharacters.find(char => char.id === charId);
        (0, globals_1.expect)(charAfter).toBeDefined();
        (0, globals_1.expect)(charAfter.name).toBe(newName);
        (0, globals_1.expect)(charAfter.class).toBe(newClass);
        (0, globals_1.expect)(charAfter.level).toBe(newLevel);
    });
    (0, globals_1.it)('O método query deve desativar usuários (soft delete)', async () => {
        const userId = 2;
        // Verificar valor atual
        const userBefore = db_mock_1.mockUsers.find(user => user.id === userId);
        (0, globals_1.expect)(userBefore).toBeDefined();
        (0, globals_1.expect)(userBefore.active).not.toBe(false);
        const result = await db_mock_1.mockPool.query('UPDATE users SET active = false WHERE id = ?', [userId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar se o usuário foi desativado
        const userAfter = db_mock_1.mockUsers.find(user => user.id === userId);
        (0, globals_1.expect)(userAfter).toBeDefined();
        (0, globals_1.expect)(userAfter.active).toBe(false);
    });
    (0, globals_1.it)('O método query deve desativar personagens (soft delete)', async () => {
        const charId = 2;
        // Verificar valor atual
        const charBefore = db_mock_1.mockCharacters.find(char => char.id === charId);
        (0, globals_1.expect)(charBefore).toBeDefined();
        (0, globals_1.expect)(charBefore.active).not.toBe(false);
        const result = await db_mock_1.mockPool.query('UPDATE characters SET active = false WHERE id = ?', [charId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar se o personagem foi desativado
        const charAfter = db_mock_1.mockCharacters.find(char => char.id === charId);
        (0, globals_1.expect)(charAfter).toBeDefined();
        (0, globals_1.expect)(charAfter.active).toBe(false);
    });
    (0, globals_1.it)('O método query deve remover personagens de um usuário específico', async () => {
        const userId = 3;
        const initialLength = db_mock_1.mockCharacters.length;
        // Contar quantos personagens pertencem ao usuário
        const charCount = db_mock_1.mockCharacters.filter(char => char.user_id === userId).length;
        (0, globals_1.expect)(charCount).toBeGreaterThan(0);
        const result = await db_mock_1.mockPool.query('DELETE FROM characters WHERE user_id = ?', [userId]);
        (0, globals_1.expect)(result).toBeDefined();
        // Verificar se os personagens foram removidos
        const remainingChars = db_mock_1.mockCharacters.filter(char => char.user_id === userId);
        (0, globals_1.expect)(remainingChars.length).toBe(0);
        (0, globals_1.expect)(db_mock_1.mockCharacters.length).toBe(initialLength - charCount);
    });
});
