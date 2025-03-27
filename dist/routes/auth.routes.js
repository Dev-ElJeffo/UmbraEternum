"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validation_middleware_1 = require("../middlewares/validation.middleware");
const security_middleware_1 = require("../middlewares/security.middleware");
const User_1 = __importDefault(require("../models/User"));
const RefreshToken_1 = __importDefault(require("../models/RefreshToken"));
const jwt_1 = __importDefault(require("../config/jwt"));
const logger_1 = __importDefault(require("../config/logger"));
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
// Gerar tokens JWT
const generateTokens = async (user) => {
    // Token de acesso
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role
    };
    // Obter o segredo JWT da configuração
    let secret = jwt_1.default.secret;
    if (!secret) {
        logger_1.default.error('JWT_SECRET não definido, usando fallback inseguro');
        // Fallback para desenvolvimento - NÃO use em produção!
        secret = 'umbraeternum_dev_secret';
    }
    try {
        // Gerar o token com payload, secret e opções
        const accessToken = jsonwebtoken_1.default.sign(payload, secret, {
            expiresIn: jwt_1.default.expiresIn
        });
        // Token de atualização (refresh)
        const refreshToken = await RefreshToken_1.default.create(user.id, jwt_1.default.refreshExpiresIn);
        return {
            accessToken,
            refreshToken: refreshToken.token,
            expiresIn: jwt_1.default.expiresIn
        };
    }
    catch (error) {
        logger_1.default.error('Erro ao gerar tokens JWT:', error);
        throw new Error('Falha na geração de tokens');
    }
};
// Validações para registro
const registerValidations = [
    (0, express_validator_1.body)('username')
        .isString()
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Nome de usuário pode conter apenas letras, números e sublinhado'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .withMessage('Email inválido')
        .normalizeEmail(),
    (0, express_validator_1.body)('password')
        .isString()
        .isLength({ min: 8 })
        .withMessage('Senha deve ter no mínimo 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número')
];
// Validações para login
const loginValidations = [
    (0, express_validator_1.body)('username').isString().trim(),
    (0, express_validator_1.body)('password').isString()
];
// Rota de registro
router.post('/register', validation_middleware_1.sanitizeBody, (0, validation_middleware_1.validate)(registerValidations), async (req, res, next) => {
    try {
        const { username, email, password } = req.body;
        // Verificar se username já existe
        const existingUsername = await User_1.default.findByUsername(username);
        if (existingUsername) {
            throw (0, error_middleware_1.createError)('Nome de usuário já está em uso', 409, 'USERNAME_TAKEN');
        }
        // Verificar se email já existe
        const existingEmail = await User_1.default.findByEmail(email);
        if (existingEmail) {
            throw (0, error_middleware_1.createError)('Email já está em uso', 409, 'EMAIL_TAKEN');
        }
        // Criar usuário
        const newUser = await User_1.default.create({
            username,
            email,
            password,
            role: 'user',
            status: 'active'
        });
        // Gerar tokens
        const tokens = await generateTokens({
            id: newUser.id,
            username: newUser.username,
            role: newUser.role
        });
        // Atualizar último login
        await User_1.default.updateLastLogin(newUser.id);
        logger_1.default.info(`Novo usuário registrado: ${username}`);
        res.status(201).json({
            message: 'Usuário registrado com sucesso',
            user: newUser,
            ...tokens
        });
    }
    catch (error) {
        next(error);
    }
});
// Rota de login
router.post('/login', security_middleware_1.loginRateLimiter, validation_middleware_1.sanitizeBody, (0, validation_middleware_1.validate)(loginValidations), async (req, res, next) => {
    try {
        const { username, password } = req.body;
        // Buscar usuário pelo nome de usuário
        const user = await User_1.default.findByUsername(username);
        if (!user) {
            throw (0, error_middleware_1.createError)('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
        }
        // Verificar status do usuário
        if (user.status !== 'active') {
            throw (0, error_middleware_1.createError)('Conta inativa ou banida', 403, 'ACCOUNT_INACTIVE');
        }
        // Verificar senha
        const isPasswordValid = await User_1.default.verifyPassword(user, password);
        if (!isPasswordValid) {
            throw (0, error_middleware_1.createError)('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
        }
        // Gerar tokens
        const tokens = await generateTokens({
            id: user.id,
            username: user.username,
            role: user.role || 'user'
        });
        // Atualizar último login
        await User_1.default.updateLastLogin(user.id);
        logger_1.default.info(`Usuário autenticado: ${username}`);
        res.json({
            message: 'Login realizado com sucesso',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            ...tokens
        });
    }
    catch (error) {
        next(error);
    }
});
// Rota para renovar token
router.post('/refresh-token', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            throw (0, error_middleware_1.createError)('Token de atualização não fornecido', 400, 'TOKEN_REQUIRED');
        }
        // Verificar se o token é válido
        const isValid = await RefreshToken_1.default.verifyToken(refreshToken);
        if (!isValid) {
            throw (0, error_middleware_1.createError)('Token de atualização inválido ou expirado', 401, 'INVALID_TOKEN');
        }
        // Buscar token no banco
        const tokenData = await RefreshToken_1.default.findByToken(refreshToken);
        if (!tokenData) {
            throw (0, error_middleware_1.createError)('Token de atualização não encontrado', 401, 'TOKEN_NOT_FOUND');
        }
        // Buscar usuário associado ao token
        const user = await User_1.default.findById(tokenData.user_id);
        if (!user) {
            throw (0, error_middleware_1.createError)('Usuário não encontrado', 401, 'USER_NOT_FOUND');
        }
        // Verificar status do usuário
        if (user.status !== 'active') {
            throw (0, error_middleware_1.createError)('Conta inativa ou banida', 403, 'ACCOUNT_INACTIVE');
        }
        // Excluir token atual
        await RefreshToken_1.default.delete(refreshToken);
        // Gerar novos tokens
        const tokens = await generateTokens({
            id: user.id,
            username: user.username,
            role: user.role
        });
        logger_1.default.info(`Token renovado para o usuário: ${user.username}`);
        res.json({
            message: 'Token renovado com sucesso',
            ...tokens
        });
    }
    catch (error) {
        next(error);
    }
});
// Rota de logout separada para contornar problemas de tipagem
router.post('/logout', (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(204).end(); // Sem conteúdo, não há token para invalidar
        }
        // Tenta remover o token de atualização
        RefreshToken_1.default.delete(refreshToken)
            .then(() => {
            logger_1.default.info('Logout realizado com sucesso');
            res.status(204).end();
        })
            .catch(error => {
            next(error);
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
