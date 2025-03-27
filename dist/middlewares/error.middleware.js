"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Middleware para tratamento de erros
 */
const errorHandler = (err, req, res, next) => {
    // Define o código de status (padrão: 500)
    const statusCode = err.statusCode || 500;
    // Mensagem de erro para o cliente
    let message = 'Erro interno no servidor';
    // Em ambiente de desenvolvimento, mostrar o erro completo
    // Em produção, mostrar mensagens mais genéricas para erros do servidor
    if (process.env.NODE_ENV === 'development' || statusCode < 500) {
        message = err.message;
    }
    // Log do erro
    logger_1.default.error(`${statusCode} - ${err.message}`, err);
    // Resposta para o cliente
    res.status(statusCode).json({
        error: {
            message,
            code: err.code || 'INTERNAL_ERROR',
            // Incluir stack trace apenas em desenvolvimento
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
};
exports.errorHandler = errorHandler;
/**
 * Middleware para tratar rotas não encontradas
 */
const notFoundHandler = (req, res) => {
    logger_1.default.debug(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        error: {
            message: 'Recurso não encontrado',
            code: 'NOT_FOUND'
        }
    });
};
exports.notFoundHandler = notFoundHandler;
/**
 * Função para criar erros personalizados com código de status
 */
const createError = (message, statusCode, code) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    if (code) {
        error.code = code;
    }
    return error;
};
exports.createError = createError;
