"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const Character_1 = __importDefault(require("../models/Character"));
const logger_1 = __importDefault(require("../config/logger"));
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
// Todas as rotas de personagem requerem autenticação
router.use(auth_middleware_1.authenticateJWT);
// Validações para criação/atualização de personagem
const characterValidations = [
    (0, express_validator_1.body)('name')
        .isString()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Nome do personagem deve ter entre 3 e 30 caracteres'),
    (0, express_validator_1.body)('class')
        .isString()
        .trim()
        .isIn(['guerreiro', 'mago', 'arqueiro', 'sacerdote', 'assassino', 'paladino'])
        .withMessage('Classe do personagem inválida')
];
// Rota para listar personagens do usuário logado
router.get('/', async (req, res, next) => {
    try {
        const userId = req.user.id;
        const characters = await Character_1.default.findByUserId(userId);
        res.json({
            data: characters
        });
    }
    catch (error) {
        next(error);
    }
});
// Rota para obter um personagem específico
router.get('/:id', (0, validation_middleware_1.validate)([(0, express_validator_1.param)('id').isInt().withMessage('ID inválido')]), async (req, res, next) => {
    try {
        const characterId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const character = await Character_1.default.findById(characterId);
        // Verificar se o personagem existe
        if (!character) {
            throw (0, error_middleware_1.createError)('Personagem não encontrado', 404, 'CHARACTER_NOT_FOUND');
        }
        // Verificar se o personagem pertence ao usuário logado
        if (character.user_id !== userId) {
            throw (0, error_middleware_1.createError)('Acesso negado', 403, 'ACCESS_DENIED');
        }
        res.json({
            data: character
        });
    }
    catch (error) {
        next(error);
    }
});
// Rota para criar um novo personagem
router.post('/', validation_middleware_1.sanitizeBody, (0, validation_middleware_1.validate)(characterValidations), async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, class: characterClass } = req.body;
        // Verificar quantidade de personagens (limite de 3 por usuário)
        const existingCharacters = await Character_1.default.findByUserId(userId);
        if (existingCharacters.length >= 3) {
            throw (0, error_middleware_1.createError)('Limite de personagens atingido (máximo: 3)', 400, 'CHARACTER_LIMIT_REACHED');
        }
        // Criar personagem
        const newCharacter = await Character_1.default.create({
            user_id: userId,
            name,
            class: characterClass
        });
        logger_1.default.info(`Novo personagem criado: ${name} para o usuário ID ${userId}`);
        res.status(201).json({
            message: 'Personagem criado com sucesso',
            data: newCharacter
        });
    }
    catch (error) {
        next(error);
    }
});
// Rota para atualizar um personagem
router.put('/:id', validation_middleware_1.sanitizeBody, (0, validation_middleware_1.validate)([
    (0, express_validator_1.param)('id').isInt().withMessage('ID inválido'),
    ...characterValidations
]), async (req, res, next) => {
    try {
        const characterId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        const { name, class: characterClass } = req.body;
        // Verificar se o personagem existe
        const character = await Character_1.default.findById(characterId);
        if (!character) {
            throw (0, error_middleware_1.createError)('Personagem não encontrado', 404, 'CHARACTER_NOT_FOUND');
        }
        // Verificar se o personagem pertence ao usuário logado
        if (character.user_id !== userId) {
            throw (0, error_middleware_1.createError)('Acesso negado', 403, 'ACCESS_DENIED');
        }
        // Atualizar personagem
        const updatedCharacter = await Character_1.default.update(characterId, {
            name,
            class: characterClass
        });
        logger_1.default.info(`Personagem atualizado: ${name} (ID: ${characterId})`);
        res.json({
            message: 'Personagem atualizado com sucesso',
            data: updatedCharacter
        });
    }
    catch (error) {
        next(error);
    }
});
// Rota para excluir um personagem
router.delete('/:id', (0, validation_middleware_1.validate)([(0, express_validator_1.param)('id').isInt().withMessage('ID inválido')]), async (req, res, next) => {
    try {
        const characterId = parseInt(req.params.id, 10);
        const userId = req.user.id;
        // Verificar se o personagem existe
        const character = await Character_1.default.findById(characterId);
        if (!character) {
            throw (0, error_middleware_1.createError)('Personagem não encontrado', 404, 'CHARACTER_NOT_FOUND');
        }
        // Verificar se o personagem pertence ao usuário logado
        if (character.user_id !== userId) {
            throw (0, error_middleware_1.createError)('Acesso negado', 403, 'ACCESS_DENIED');
        }
        // Excluir personagem
        await Character_1.default.delete(characterId);
        logger_1.default.info(`Personagem excluído: ID ${characterId}`);
        res.status(204).end();
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
