const jwt = require('jsonwebtoken');
const { jwtConfig } = require('../config/jwt');
const { logger } = require('../config/logger');
const User = require('../models/User');
const { createError } = require('./error.middleware');

/**
 * Middleware para verificar autenticação JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Verificar se o token está presente no cabeçalho
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação não fornecido'
      });
    }
    
    // Extrair token do cabeçalho
    const token = authHeader.split(' ')[1];
    
    // Verificar o token
    try {
      const decoded = jwt.verify(token, jwtConfig.secret);
      
      // Verificar se o usuário existe e está ativo
      const user = await User.findById(decoded.userId);
      if (!user || !user.active) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou desativado'
        });
      }
      
      // Guardar dados do usuário no objeto de requisição
      req.userId = decoded.userId;
      req.username = decoded.username;
      req.userRole = decoded.role;
      
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expirado'
        });
      }
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
      
      throw error;
    }
  } catch (error) {
    logger.error(`Erro na autenticação: ${error.message}`, { error });
    return res.status(500).json({
      success: false,
      message: 'Erro na autenticação',
      error: error.message
    });
  }
};

/**
 * Middleware para verificar permissões de administrador
 */
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissão de administrador necessária.'
    });
  }
  
  next();
};

/**
 * Middleware para verificar permissões de Game Master
 */
const requireGameMaster = (req, res, next) => {
  if (req.userRole !== 'admin' && req.userRole !== 'game_master') {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissão de Game Master necessária.'
    });
  }
  
  next();
};

module.exports = {
  authenticate,
  requireAdmin,
  requireGameMaster
}; 