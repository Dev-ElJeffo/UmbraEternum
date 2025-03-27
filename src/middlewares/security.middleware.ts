import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import logger from '../config/logger';

// Limites para tentativas de login
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas por IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Limite de tentativas de login excedido para o IP: ${req.ip}`);
    res.status(429).json({
      error: {
        message: 'Muitas tentativas de login. Tente novamente após 15 minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

// Limites para API geral
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições por IP por minuto
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Limite de requisições da API excedido para o IP: ${req.ip}`);
    res.status(429).json({
      error: {
        message: 'Muitas requisições. Tente novamente em alguns instantes.',
        code: 'RATE_LIMIT_EXCEEDED'
      }
    });
  }
});

// Configura o CORS
export const corsConfig = (allowedOrigins: string | string[]) => {
  return cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 horas
  });
};

// Configura o Helmet para segurança
export const configureHelmet = () => {
  return helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    xssFilter: true,
    noSniff: true,
    hidePoweredBy: true
  });
};

// Adiciona cabeçalhos de segurança personalizados
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Desabilitar o cache para APIs
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Modo estrito de transporte HTTP
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  next();
}; 