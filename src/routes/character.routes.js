const express = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middlewares/validation.middleware');
const { logger } = require('../config/logger');
const Character = require('../models/Character');
const { createError } = require('../middlewares/error.middleware');

const router = express.Router();

// Validação para criação/atualização de personagem
const characterValidation = [
  body('name')
    .notEmpty()
    .withMessage('Nome do personagem é obrigatório')
    .isLength({ min: 3, max: 50 })
    .withMessage('Nome deve ter entre 3 e 50 caracteres'),
  body('class')
    .notEmpty()
    .withMessage('Classe do personagem é obrigatória')
    .isIn(['guerreiro', 'mago', 'arqueiro', 'clérigo', 'ladino'])
    .withMessage('Classe inválida'),
  body('strength').optional().isInt({ min: 1, max: 20 }).withMessage('Força deve ser entre 1 e 20'),
  body('dexterity')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Destreza deve ser entre 1 e 20'),
  body('constitution')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Constituição deve ser entre 1 e 20'),
  body('intelligence')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Inteligência deve ser entre 1 e 20'),
  body('wisdom')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Sabedoria deve ser entre 1 e 20'),
  body('charisma')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Carisma deve ser entre 1 e 20'),
];

// Rota para listar todos os personagens do usuário
router.get('/', async (req, res) => {
  try {
    // Na prática, obter o userId do token JWT
    const userId = req.userId || 1; // substituir por autenticação real

    const characters = await Character.findByUserId(userId);

    return res.status(200).json({
      success: true,
      data: characters,
    });
  } catch (error) {
    logger.error(`Erro ao listar personagens: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar personagens',
      error: error.message,
    });
  }
});

// Rota para obter um personagem específico
router.get('/:id', param('id').isInt(), validate, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id, 10);
    const userId = req.userId || 1; // substituir por autenticação real

    const character = await Character.findById(characterId);

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Personagem não encontrado',
      });
    }

    // Verificar se o personagem pertence ao usuário
    if (character.userId !== userId) {
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
    logger.error(`Erro ao buscar personagem: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar personagem',
      error: error.message,
    });
  }
});

// Rota para criar um novo personagem
router.post('/', characterValidation, validate, async (req, res) => {
  try {
    const userId = req.userId || 1; // substituir por autenticação real

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

    // Calcular HP e Mana baseado nas estatísticas
    characterData.maxHp = characterData.constitution * 10;
    characterData.currentHp = characterData.maxHp;
    characterData.maxMana = characterData.intelligence * 5;
    characterData.currentMana = characterData.maxMana;

    const newCharacter = await Character.create(characterData);

    return res.status(201).json({
      success: true,
      message: 'Personagem criado com sucesso',
      data: newCharacter,
    });
  } catch (error) {
    logger.error(`Erro ao criar personagem: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar personagem',
      error: error.message,
    });
  }
});

// Rota para atualizar um personagem
router.put('/:id', param('id').isInt(), characterValidation, validate, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id, 10);
    const userId = req.userId || 1; // substituir por autenticação real

    // Buscar o personagem
    const character = await Character.findById(characterId);

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Personagem não encontrado',
      });
    }

    // Verificar se o personagem pertence ao usuário
    if (character.userId !== userId) {
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

    // Recalcular HP e Mana se necessário
    if (req.body.constitution) {
      updates.maxHp = req.body.constitution * 10;
      // Ajustar HP atual proporcionalmente
      const hpRatio = character.currentHp / character.maxHp;
      updates.currentHp = Math.ceil(updates.maxHp * hpRatio);
    }

    if (req.body.intelligence) {
      updates.maxMana = req.body.intelligence * 5;
      // Ajustar Mana atual proporcionalmente
      const manaRatio = character.currentMana / character.maxMana;
      updates.currentMana = Math.ceil(updates.maxMana * manaRatio);
    }

    // Atualizar personagem
    const updatedCharacter = await character.update(updates);

    return res.status(200).json({
      success: true,
      message: 'Personagem atualizado com sucesso',
      data: updatedCharacter,
    });
  } catch (error) {
    logger.error(`Erro ao atualizar personagem: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar personagem',
      error: error.message,
    });
  }
});

// Rota para excluir (desativar) um personagem
router.delete('/:id', param('id').isInt(), validate, async (req, res) => {
  try {
    const characterId = parseInt(req.params.id, 10);
    const userId = req.userId || 1; // substituir por autenticação real

    // Buscar o personagem
    const character = await Character.findById(characterId);

    if (!character) {
      return res.status(404).json({
        success: false,
        message: 'Personagem não encontrado',
      });
    }

    // Verificar se o personagem pertence ao usuário
    if (character.userId !== userId) {
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
    logger.error(`Erro ao excluir personagem: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Erro ao excluir personagem',
      error: error.message,
    });
  }
});

module.exports = router;
