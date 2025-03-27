const { validationResult } = require('express-validator');
const { logger } = require('../config/logger');

/**
 * Middleware para validar os dados da requisição
 * @param validations Array de validações do express-validator
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => ({
        field: error.path,
        message: error.msg
      }));
      
      logger.warn('Validação falhou', { errors: errorMessages, body: req.body });
      
      return res.status(400).json({
        success: false,
        message: 'Erro de validação',
        errors: errorMessages
      });
    }
    next();
  };
};

/**
 * Middleware para sanitizar o corpo da requisição
 */
const sanitizeInput = (req, res, next) => {
  // Função simples para sanitizar strings - remover tags HTML
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<[^>]*>/g, '');
  };
  
  // Sanitizar corpo da requisição
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  
  // Sanitizar parâmetros da URL
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    });
  }
  
  // Sanitizar query string
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  
  next();
};

// Middleware para sanitizar o corpo da requisição
const sanitizeBody = (req, res, next) => {
  // Remover espaços em branco extras
  if (req.body.username) req.body.username = req.body.username.trim();
  if (req.body.email) req.body.email = req.body.email.trim().toLowerCase();
  if (req.body.password) req.body.password = req.body.password.trim();
  next();
};

module.exports = {
  validate,
  sanitizeInput,
  sanitizeBody
}; 