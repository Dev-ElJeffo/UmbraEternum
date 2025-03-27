import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Interface para definir um erro com código de status HTTP
interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

/**
 * Middleware para tratamento de erros
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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
  logger.error(`${statusCode} - ${err.message}`, err);
  
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

/**
 * Middleware para tratar rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.debug(`Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: {
      message: 'Recurso não encontrado',
      code: 'NOT_FOUND'
    }
  });
};

/**
 * Função para criar erros personalizados com código de status
 */
export const createError = (message: string, statusCode: number, code?: string): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  if (code) {
    error.code = code;
  }
  return error;
}; 