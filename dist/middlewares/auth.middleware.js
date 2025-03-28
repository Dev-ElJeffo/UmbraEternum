"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireModerator = exports.requireAdmin = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const jwt_1 = __importDefault(require("../config/jwt"));
const User_1 = __importDefault(require("../models/User"));
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Middleware para verificar autenticação JWT
 */
const authenticateJWT = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'Token de autenticação não fornecido' });
            return;
        }
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            res.status(401).json({ message: 'Formato de token inválido' });
            return;
        }
        const token = tokenParts[1];
        try {
            const decoded = jsonwebtoken_1.default.verify(token, jwt_1.default.secret);
            // Verificar se o usuário ainda existe no banco de dados
            const user = await User_1.default.findById(decoded.userId);
            if (!user) {
                res.status(401).json({ message: 'Usuário não encontrado ou inativo' });
                return;
            }
            // Verificar se o usuário está ativo
            if (user.status !== 'active') {
                res.status(403).json({ message: 'Conta de usuário inativa ou banida' });
                return;
            }
            // Adicionar informações do usuário ao objeto de requisição
            req.user = {
                id: decoded.userId,
                username: decoded.username,
                role: decoded.role,
            };
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                res.status(401).json({ message: 'Token expirado' });
            }
            else if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                res.status(401).json({ message: 'Token inválido' });
            }
            else {
                logger_1.default.error('Erro na autenticação JWT:', error);
                res.status(500).json({ message: 'Erro interno no servidor' });
            }
        }
    }
    catch (error) {
        logger_1.default.error('Erro no middleware de autenticação:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
    }
};
exports.authenticateJWT = authenticateJWT;
/**
 * Middleware para verificar permissões de administrador
 */
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Autenticação necessária' });
        return;
    }
    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Acesso negado: permissões de administrador necessárias' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
/**
 * Middleware para verificar permissões de moderador ou administrador
 */
const requireModerator = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ message: 'Autenticação necessária' });
        return;
    }
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
        res.status(403).json({ message: 'Acesso negado: permissões de moderador necessárias' });
        return;
    }
    next();
};
exports.requireModerator = requireModerator;
