import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt';
import UserModel from '../models/User';
import logger from '../config/logger';

// Interface para o conteúdo decodificado do token
interface DecodedToken {
  userId: number;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// Estendendo a interface Request para adicionar o usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware para verificar autenticação JWT
 */
export const authenticateJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      const decoded = jwt.verify(token, jwtConfig.secret) as DecodedToken;
      
      // Verificar se o usuário ainda existe no banco de dados
      const user = await UserModel.findById(decoded.userId);
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
        role: decoded.role
      };
      
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Token expirado' });
      } else if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: 'Token inválido' });
      } else {
        logger.error('Erro na autenticação JWT:', error);
        res.status(500).json({ message: 'Erro interno no servidor' });
      }
    }
  } catch (error) {
    logger.error('Erro no middleware de autenticação:', error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }
};

/**
 * Middleware para verificar permissões de administrador
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Middleware para verificar permissões de moderador ou administrador
 */
export const requireModerator = (req: Request, res: Response, next: NextFunction): void => {
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