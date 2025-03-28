import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import logger from '../config/logger';

/**
 * Middleware para validar os dados da requisição
 * @param validations Array de validações do express-validator
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Executar todas as validações
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Verificar se houve erros
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    // Formatar erros para resposta usando any porque a API do express-validator pode variar
    const formattedErrors = errors.array().map((error: any) => {
      return {
        field: error.path || error.param || error.location,
        message: error.msg,
      };
    });

    logger.debug(`Erro de validação: ${JSON.stringify(formattedErrors)}`);
    res.status(400).json({ errors: formattedErrors });
  };
};

/**
 * Middleware para sanitizar o corpo da requisição
 */
export const sanitizeBody = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) {
    // Remover espaços em branco antes e depois de strings
    Object.keys(req.body).forEach((key) => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};
