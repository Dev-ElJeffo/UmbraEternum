"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBody = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Middleware para validar os dados da requisição
 * @param validations Array de validações do express-validator
 */
const validate = (validations) => {
    return async (req, res, next) => {
        // Executar todas as validações
        await Promise.all(validations.map((validation) => validation.run(req)));
        // Verificar se houve erros
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            next();
            return;
        }
        // Formatar erros para resposta usando any porque a API do express-validator pode variar
        const formattedErrors = errors.array().map((error) => {
            return {
                field: error.path || error.param || error.location,
                message: error.msg,
            };
        });
        logger_1.default.debug(`Erro de validação: ${JSON.stringify(formattedErrors)}`);
        res.status(400).json({ errors: formattedErrors });
    };
};
exports.validate = validate;
/**
 * Middleware para sanitizar o corpo da requisição
 */
const sanitizeBody = (req, res, next) => {
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
exports.sanitizeBody = sanitizeBody;
