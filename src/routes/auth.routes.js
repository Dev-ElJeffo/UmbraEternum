const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const { validate, sanitizeBody } = require('../middlewares/validation.middleware');
const { loginRateLimiter } = require('../middlewares/security.middleware');
const UserModel = require('../models/User');
const RefreshTokenModel = require('../models/RefreshToken');
const jwtConfig = require('../config/jwt');
const logger = require('../config/logger');
const { createError } = require('../middlewares/error.middleware');

const router = express.Router();

// Gerar tokens JWT
const generateTokens = async (user) => {
  // Token de acesso
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  // Obter o segredo JWT da configuração
  let secret = jwtConfig.secret;
  if (!secret) {
    logger.error('JWT_SECRET não definido, usando fallback inseguro');
    // Fallback para desenvolvimento - NÃO use em produção!
    secret = 'umbraeternum_dev_secret';
  }

  try {
    // Gerar o token com payload, secret e opções
    const accessToken = jwt.sign(payload, secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    // Token de atualização (refresh)
    const refreshToken = await RefreshTokenModel.create(user.id, jwtConfig.refreshExpiresIn);

    return {
      accessToken,
      refreshToken: refreshToken.token,
      expiresIn: jwtConfig.expiresIn,
    };
  } catch (error) {
    logger.error('Erro ao gerar tokens JWT:', error);
    throw new Error('Falha na geração de tokens');
  }
};

// Validações para registro
const registerValidations = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Nome de usuário deve ter entre 3 e 30 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Nome de usuário pode conter apenas letras, números e sublinhado'),

  body('email').isEmail().withMessage('Email inválido').normalizeEmail(),

  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Senha deve ter no mínimo 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'),
];

// Validações para login
const loginValidations = [body('username').isString().trim(), body('password').isString()];

// Rota de registro
router.post('/register', sanitizeBody, validate(registerValidations), async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // Verificar se username já existe
    const existingUsername = await UserModel.findByUsername(username);
    if (existingUsername) {
      throw createError('Nome de usuário já está em uso', 409, 'USERNAME_TAKEN');
    }

    // Verificar se email já existe
    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      throw createError('Email já está em uso', 409, 'EMAIL_TAKEN');
    }

    // Criar usuário
    const newUser = await UserModel.create({
      username,
      email,
      password,
      role: 'user',
      status: 'active',
    });

    // Gerar tokens
    const tokens = await generateTokens({
      id: newUser.id,
      username: newUser.username,
      role: newUser.role,
    });

    // Atualizar último login
    await UserModel.updateLastLogin(newUser.id);

    logger.info(`Novo usuário registrado: ${username}`);
    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      user: newUser,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

// Rota de login
router.post(
  '/login',
  loginRateLimiter,
  sanitizeBody,
  validate(loginValidations),
  async (req, res, next) => {
    try {
      const { username, password } = req.body;

      // Buscar usuário pelo nome de usuário
      const user = await UserModel.findByUsername(username);
      if (!user) {
        throw createError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      // Verificar status do usuário
      if (user.status !== 'active') {
        throw createError('Conta inativa ou banida', 403, 'ACCOUNT_INACTIVE');
      }

      // Verificar senha
      const isPasswordValid = await UserModel.verifyPassword(user, password);
      if (!isPasswordValid) {
        throw createError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS');
      }

      // Gerar tokens
      const tokens = await generateTokens({
        id: user.id,
        username: user.username,
        role: user.role || 'user',
      });

      // Atualizar último login
      await UserModel.updateLastLogin(user.id);

      logger.info(`Usuário autenticado: ${username}`);
      res.json({
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        ...tokens,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Rota para renovar token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw createError('Token de atualização não fornecido', 400, 'TOKEN_REQUIRED');
    }

    // Verificar se o token é válido
    const isValid = await RefreshTokenModel.verifyToken(refreshToken);
    if (!isValid) {
      throw createError('Token de atualização inválido ou expirado', 401, 'INVALID_TOKEN');
    }

    // Buscar token no banco
    const tokenData = await RefreshTokenModel.findByToken(refreshToken);
    if (!tokenData) {
      throw createError('Token de atualização não encontrado', 401, 'TOKEN_NOT_FOUND');
    }

    // Buscar usuário associado ao token
    const user = await UserModel.findById(tokenData.user_id);
    if (!user) {
      throw createError('Usuário não encontrado', 401, 'USER_NOT_FOUND');
    }

    // Verificar status do usuário
    if (user.status !== 'active') {
      throw createError('Conta inativa ou banida', 403, 'ACCOUNT_INACTIVE');
    }

    // Excluir token atual
    await RefreshTokenModel.delete(refreshToken);

    // Gerar novos tokens
    const tokens = await generateTokens({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    logger.info(`Token renovado para o usuário: ${user.username}`);
    res.json({
      message: 'Token renovado com sucesso',
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

// Rota de logout
router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(204).end(); // Sem conteúdo, não há token para invalidar
    }

    // Tenta remover o token de atualização
    await RefreshTokenModel.delete(refreshToken);
    logger.info('Logout realizado com sucesso');
    return res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
