const { logger } = require('../config/logger');

// Middleware para lidar com rotas não encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Middleware para tratamento de erros
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';

  // Logar o erro
  logger.error(`${statusCode} - ${err.message}`, {
    error: err,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Responder com JSON
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    code: errorCode,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

// Função helper para criar erros com código e status
const createError = (message, statusCode = 500, code = 'INTERNAL_ERROR') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

module.exports = {
  notFound,
  errorHandler,
  createError,
};
