import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validation.middleware';
import { authenticateJWT, requireAdmin } from '../middlewares/auth.middleware';
import { pool } from '../config/database';
import logger from '../config/logger';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = Router();

// Todas as rotas admin requerem autenticação e permissão de administrador
router.use(authenticateJWT);
router.use(requireAdmin);

// Rota para listar todos os usuários
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, username, email, role, active, created_at, updated_at, last_login_at FROM users ORDER BY id'
    );

    res.json({
      success: true,
      count: rows.length,
      users: rows,
    });
  } catch (error) {
    logger.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuários',
    });
  }
});

// Rota para listar todos os personagens
router.get('/characters', async (req, res) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM characters WHERE deleted_at IS NULL ORDER BY id'
    );

    res.json({
      success: true,
      count: rows.length,
      characters: rows,
    });
  } catch (error) {
    logger.error('Erro ao listar personagens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar personagens',
    });
  }
});

// Rota para alterar o papel de um usuário
router.put(
  '/users/:id/role',
  [
    param('id').isInt().withMessage('ID inválido'),
    body('role').isIn(['admin', 'player']).withMessage('Papel deve ser admin ou player'),
    validate,
  ],
  async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;

    try {
      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE users SET role = ? WHERE id = ?',
        [role, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      logger.info(`Papel do usuário ID ${userId} alterado para ${role} por ${req.username || 'admin'}`);

      res.json({
        success: true,
        message: `Papel do usuário alterado para ${role}`,
      });
    } catch (error) {
      logger.error('Erro ao alterar papel do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao alterar papel do usuário',
      });
    }
  }
);

// Rota para banir/desativar um usuário
router.put(
  '/users/:id/ban',
  [param('id').isInt().withMessage('ID inválido'), validate],
  async (req, res) => {
    const userId = parseInt(req.params.id, 10);

    try {
      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE users SET active = FALSE WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      logger.info(`Usuário ID ${userId} desativado por ${req.username || 'admin'}`);

      res.json({
        success: true,
        message: 'Usuário desativado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao desativar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao desativar usuário',
      });
    }
  }
);

// Rota para desbanir/reativar um usuário
router.put(
  '/users/:id/unban',
  [param('id').isInt().withMessage('ID inválido'), validate],
  async (req, res) => {
    const userId = parseInt(req.params.id, 10);

    try {
      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE users SET active = TRUE WHERE id = ?',
        [userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
        });
      }

      logger.info(`Usuário ID ${userId} reativado por ${req.username || 'admin'}`);

      res.json({
        success: true,
        message: 'Usuário reativado com sucesso',
      });
    } catch (error) {
      logger.error('Erro ao reativar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao reativar usuário',
      });
    }
  }
);

// Rota para obter estatísticas do sistema
router.get('/stats', async (req, res) => {
  try {
    const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [activeUserCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE active = TRUE');
    const [characterCount] = await pool.query('SELECT COUNT(*) as count FROM characters WHERE deleted_at IS NULL');

    res.json({
      success: true,
      stats: {
        totalUsers: userCount[0].count,
        activeUsers: activeUserCount[0].count,
        totalCharacters: characterCount[0].count,
        onlinePlayers: req.app.get('onlinePlayers') || 0,
      },
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas do sistema',
    });
  }
});

export default router; 