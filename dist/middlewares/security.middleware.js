"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityHeaders = exports.configureHelmet = exports.corsConfig = exports.apiRateLimiter = exports.loginRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = __importDefault(require("../config/logger"));
// Limites para tentativas de login
exports.loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas por IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn(`Limite de tentativas de login excedido para o IP: ${req.ip}`);
        res.status(429).json({
            error: {
                message: 'Muitas tentativas de login. Tente novamente após 15 minutos.',
                code: 'RATE_LIMIT_EXCEEDED'
            }
        });
    }
});
// Limites para API geral
exports.apiRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // 100 requisições por IP por minuto
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger_1.default.warn(`Limite de requisições da API excedido para o IP: ${req.ip}`);
        res.status(429).json({
            error: {
                message: 'Muitas requisições. Tente novamente em alguns instantes.',
                code: 'RATE_LIMIT_EXCEEDED'
            }
        });
    }
});
// Configura o CORS
const corsConfig = (allowedOrigins) => {
    return (0, cors_1.default)({
        origin: allowedOrigins,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400 // 24 horas
    });
};
exports.corsConfig = corsConfig;
// Configura o Helmet para segurança
const configureHelmet = () => {
    return (0, helmet_1.default)({
        contentSecurityPolicy: process.env.NODE_ENV === 'production',
        xssFilter: true,
        noSniff: true,
        hidePoweredBy: true
    });
};
exports.configureHelmet = configureHelmet;
// Adiciona cabeçalhos de segurança personalizados
const securityHeaders = (req, res, next) => {
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
exports.securityHeaders = securityHeaders;
