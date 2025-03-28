import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate, sanitizeBody } from '../middlewares/validation.middleware';
import { authenticateJWT } from '../middlewares/auth.middleware';
import CharacterModel, { Character } from '../models/Character';
import logger from '../config/logger';
import { createError } from '../middlewares/error.middleware';

const router = Router();

// Todas as rotas de personagem requerem autenticação
router.use(authenticateJWT);

// Validações para criação/atualização de personagem
const characterValidations = [
  body('name')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Nome do personagem deve ter entre 3 e 30 caracteres'),

  body('class')
    .isString()
    .trim()
    .isIn(['guerreiro', 'mago', 'arqueiro', 'sacerdote', 'assassino', 'paladino'])
    .withMessage('Classe do personagem inválida'),
];

// Rota para listar personagens do usuário logado
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const characters = await CharacterModel.findByUserId(userId);

    res.json({
      data: characters,
    });
  } catch (error) {
    next(error);
  }
});

// Rota para obter um personagem específico
router.get(
  '/:id',
  validate([param('id').isInt().withMessage('ID inválido')]),
  async (req, res, next) => {
    try {
      const characterId = parseInt(req.params.id, 10);
      const userId = req.user!.id;

      const character = await CharacterModel.findById(characterId);

      // Verificar se o personagem existe
      if (!character) {
        throw createError('Personagem não encontrado', 404, 'CHARACTER_NOT_FOUND');
      }

      // Verificar se o personagem pertence ao usuário logado
      if (character.user_id !== userId) {
        throw createError('Acesso negado', 403, 'ACCESS_DENIED');
      }

      res.json({
        data: character,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Rota para criar um novo personagem
router.post('/', sanitizeBody, validate(characterValidations), async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { name, class: characterClass } = req.body;

    // Verificar quantidade de personagens (limite de 3 por usuário)
    const existingCharacters = await CharacterModel.findByUserId(userId);
    if (existingCharacters.length >= 3) {
      throw createError(
        'Limite de personagens atingido (máximo: 3)',
        400,
        'CHARACTER_LIMIT_REACHED'
      );
    }

    // Criar personagem
    const newCharacter = await CharacterModel.create({
      user_id: userId,
      name,
      class: characterClass,
    });

    logger.info(`Novo personagem criado: ${name} para o usuário ID ${userId}`);
    res.status(201).json({
      message: 'Personagem criado com sucesso',
      data: newCharacter,
    });
  } catch (error) {
    next(error);
  }
});

// Rota para atualizar um personagem
router.put(
  '/:id',
  sanitizeBody,
  validate([param('id').isInt().withMessage('ID inválido'), ...characterValidations]),
  async (req, res, next) => {
    try {
      const characterId = parseInt(req.params.id, 10);
      const userId = req.user!.id;
      const { name, class: characterClass } = req.body;

      // Verificar se o personagem existe
      const character = await CharacterModel.findById(characterId);
      if (!character) {
        throw createError('Personagem não encontrado', 404, 'CHARACTER_NOT_FOUND');
      }

      // Verificar se o personagem pertence ao usuário logado
      if (character.user_id !== userId) {
        throw createError('Acesso negado', 403, 'ACCESS_DENIED');
      }

      // Atualizar personagem
      const updatedCharacter = await CharacterModel.update(characterId, {
        name,
        class: characterClass,
      });

      logger.info(`Personagem atualizado: ${name} (ID: ${characterId})`);
      res.json({
        message: 'Personagem atualizado com sucesso',
        data: updatedCharacter,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Rota para excluir um personagem
router.delete(
  '/:id',
  validate([param('id').isInt().withMessage('ID inválido')]),
  async (req, res, next) => {
    try {
      const characterId = parseInt(req.params.id, 10);
      const userId = req.user!.id;

      // Verificar se o personagem existe
      const character = await CharacterModel.findById(characterId);
      if (!character) {
        throw createError('Personagem não encontrado', 404, 'CHARACTER_NOT_FOUND');
      }

      // Verificar se o personagem pertence ao usuário logado
      if (character.user_id !== userId) {
        throw createError('Acesso negado', 403, 'ACCESS_DENIED');
      }

      // Excluir personagem
      await CharacterModel.delete(characterId);

      logger.info(`Personagem excluído: ID ${characterId}`);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
