"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const db_mock_1 = require("./mocks/db.mock");
// Mock do módulo mysql2/promise
jest.mock('mysql2/promise', () => ({
    createPool: jest.fn(() => db_mock_1.mockPool)
}));
// Mock JWT Secret
const JWT_SECRET = 'chave_secreta_teste';
// Aplicativo Express e servidor para testes
let app;
let server;
let authToken;
(0, globals_1.beforeAll)(() => {
    // Configurar o aplicativo Express
    app = (0, express_1.default)();
    // Configurações básicas
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use((0, helmet_1.default)());
    // Rate limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false
    });
    app.use(limiter);
    // Middleware para verificar token JWT
    const authenticateToken = (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token de autenticação não fornecido' });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            req.user = decoded;
            next();
        }
        catch (err) {
            return res.status(403).json({ message: 'Token inválido ou expirado' });
        }
    };
    // Rotas de personagens
    app.post('/api/characters', authenticateToken, async (req, res) => {
        try {
            const { name, class: characterClass } = req.body;
            const user = req.user;
            // Validação básica
            if (!name || !characterClass) {
                return res.status(400).json({ message: 'Nome e classe são obrigatórios' });
            }
            // Criar novo personagem
            const result = await db_mock_1.mockPool.query('INSERT INTO characters (user_id, name, class) VALUES (?, ?, ?)', [user.id, name, characterClass]);
            // Obter o novo personagem
            const newCharacter = db_mock_1.mockCharacters.find(char => char.id === result.insertId);
            res.status(201).json({
                message: 'Personagem criado com sucesso',
                character: newCharacter
            });
        }
        catch (error) {
            console.error('Erro ao criar personagem:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.get('/api/characters', authenticateToken, async (req, res) => {
        try {
            const user = req.user;
            // Buscar personagens do usuário
            const characters = await db_mock_1.mockPool.query('SELECT * FROM characters WHERE user_id = ? AND active = true', [user.id]);
            res.status(200).json(characters);
        }
        catch (error) {
            console.error('Erro ao buscar personagens:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.get('/api/characters/:id', authenticateToken, async (req, res) => {
        try {
            const user = req.user;
            const characterId = parseInt(req.params.id);
            // Buscar personagem específico
            const characters = await db_mock_1.mockPool.query('SELECT * FROM characters WHERE id = ? AND user_id = ? AND active = true', [characterId, user.id]);
            if (!characters || (Array.isArray(characters) && characters.length === 0)) {
                return res.status(404).json({ message: 'Personagem não encontrado' });
            }
            const character = Array.isArray(characters) ? characters[0] : characters;
            res.status(200).json(character);
        }
        catch (error) {
            console.error('Erro ao buscar personagem:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.put('/api/characters/:id', authenticateToken, async (req, res) => {
        try {
            const user = req.user;
            const characterId = parseInt(req.params.id);
            const { name, class: characterClass, level } = req.body;
            // Validação básica
            if (!name || !characterClass) {
                return res.status(400).json({ message: 'Nome e classe são obrigatórios' });
            }
            // Verificar se o personagem existe e pertence ao usuário
            const characters = await db_mock_1.mockPool.query('SELECT * FROM characters WHERE id = ? AND user_id = ? AND active = true', [characterId, user.id]);
            if (!characters || (Array.isArray(characters) && characters.length === 0)) {
                return res.status(404).json({ message: 'Personagem não encontrado' });
            }
            // Atualizar o personagem
            await db_mock_1.mockPool.query('UPDATE characters SET name = ?, class = ?, level = ? WHERE id = ?', [name, characterClass, level || 1, characterId]);
            // Obter o personagem atualizado
            const updatedCharacters = await db_mock_1.mockPool.query('SELECT * FROM characters WHERE id = ?', [characterId]);
            const updatedCharacter = Array.isArray(updatedCharacters) ? updatedCharacters[0] : updatedCharacters;
            res.status(200).json({
                message: 'Personagem atualizado com sucesso',
                character: updatedCharacter
            });
        }
        catch (error) {
            console.error('Erro ao atualizar personagem:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    app.delete('/api/characters/:id', authenticateToken, async (req, res) => {
        try {
            const user = req.user;
            const characterId = parseInt(req.params.id);
            // Verificar se o personagem existe e pertence ao usuário
            const characters = await db_mock_1.mockPool.query('SELECT * FROM characters WHERE id = ? AND user_id = ? AND active = true', [characterId, user.id]);
            if (!characters || (Array.isArray(characters) && characters.length === 0)) {
                return res.status(404).json({ message: 'Personagem não encontrado' });
            }
            // Soft delete do personagem
            await db_mock_1.mockPool.query('UPDATE characters SET active = false WHERE id = ?', [characterId]);
            res.status(200).json({ message: 'Personagem desativado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao desativar personagem:', error);
            res.status(500).json({ message: 'Erro interno do servidor' });
        }
    });
    // Iniciar o servidor na porta de teste
    server = app.listen(34502);
    // Criar token de autenticação para testes
    authToken = jsonwebtoken_1.default.sign({ id: 2, username: 'player1', role: 'player' }, JWT_SECRET, { expiresIn: '1h' });
});
(0, globals_1.afterAll)(() => {
    // Fechar o servidor após os testes
    if (server) {
        server.close();
    }
});
(0, globals_1.describe)('Testes de Personagens', () => {
    (0, globals_1.it)('Deve criar um novo personagem', async () => {
        const newCharacter = {
            name: 'Test Character',
            class: 'Warrior'
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/characters')
            .set('Authorization', `Bearer ${authToken}`)
            .send(newCharacter);
        (0, globals_1.expect)(res.status).toBe(201);
        (0, globals_1.expect)(res.body.message).toBe('Personagem criado com sucesso');
        (0, globals_1.expect)(res.body.character).toBeDefined();
        (0, globals_1.expect)(res.body.character.name).toBe(newCharacter.name);
        (0, globals_1.expect)(res.body.character.class).toBe(newCharacter.class);
    });
    (0, globals_1.it)('Não deve criar personagem sem token', async () => {
        const newCharacter = {
            name: 'Test Character',
            class: 'Warrior'
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/characters')
            .send(newCharacter);
        (0, globals_1.expect)(res.status).toBe(401);
        (0, globals_1.expect)(res.body.message).toBe('Token de autenticação não fornecido');
    });
    (0, globals_1.it)('Não deve criar personagem sem nome ou classe', async () => {
        const incompleteCharacter = {
            name: 'Incomplete Character'
            // Sem classe
        };
        const res = await (0, supertest_1.default)(app)
            .post('/api/characters')
            .set('Authorization', `Bearer ${authToken}`)
            .send(incompleteCharacter);
        (0, globals_1.expect)(res.status).toBe(400);
        (0, globals_1.expect)(res.body.message).toBe('Nome e classe são obrigatórios');
    });
    (0, globals_1.it)('Deve listar os personagens do usuário', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/characters')
            .set('Authorization', `Bearer ${authToken}`);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(Array.isArray(res.body)).toBe(true);
    });
    (0, globals_1.it)('Deve buscar um personagem específico', async () => {
        // Assumimos que existe um personagem com ID 2 pertencente ao usuário 2
        const res = await (0, supertest_1.default)(app)
            .get('/api/characters/2')
            .set('Authorization', `Bearer ${authToken}`);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body).toBeDefined();
        (0, globals_1.expect)(res.body.id).toBe(2);
    });
    (0, globals_1.it)('Deve atualizar um personagem', async () => {
        const updatedInfo = {
            name: 'Updated Character',
            class: 'Paladin',
            level: 5
        };
        const res = await (0, supertest_1.default)(app)
            .put('/api/characters/2')
            .set('Authorization', `Bearer ${authToken}`)
            .send(updatedInfo);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.message).toBe('Personagem atualizado com sucesso');
        (0, globals_1.expect)(res.body.character).toBeDefined();
        (0, globals_1.expect)(res.body.character.name).toBe(updatedInfo.name);
        (0, globals_1.expect)(res.body.character.class).toBe(updatedInfo.class);
        (0, globals_1.expect)(res.body.character.level).toBe(updatedInfo.level);
    });
    (0, globals_1.it)('Deve excluir um personagem (soft delete)', async () => {
        // Assumimos que existe um personagem com ID 3 pertencente ao usuário 2
        const res = await (0, supertest_1.default)(app)
            .delete('/api/characters/3')
            .set('Authorization', `Bearer ${authToken}`);
        (0, globals_1.expect)(res.status).toBe(200);
        (0, globals_1.expect)(res.body.message).toBe('Personagem desativado com sucesso');
        // Verificar se o personagem foi realmente desativado
        const character = db_mock_1.mockCharacters.find(char => char.id === 3);
        (0, globals_1.expect)(character).toBeDefined();
        (0, globals_1.expect)(character?.active).toBe(false);
    });
});
