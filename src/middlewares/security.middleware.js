const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { logger } = require('../config/logger');

// Configuração do helmet para segurança
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' }
});

// Configuração do CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

// Rate limiter para login
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // limitar cada IP a 5 solicitações por janela
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Muitas tentativas de login do IP ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente mais tarde.'
    });
  }
});

// Rate limiter global
const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // limite cada IP a 100 solicitações por minuto
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit excedido para o IP ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Muitas solicitações, tente novamente mais tarde.'
    });
  }
});

module.exports = {
  securityHeaders,
  corsOptions,
  loginRateLimiter,
  globalRateLimiter
}; 