import { Secret } from 'jsonwebtoken';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

interface JWTConfig {
  secret: Secret;
  expiresIn: string;
  refreshExpiresIn: string;
}

// Garantir que o segredo JWT está definido
const secret = process.env.JWT_SECRET;
if (!secret) {
  logger.warn(
    'JWT_SECRET não está definido! Usando um valor padrão inseguro. NÃO use isso em produção!'
  );
}

const jwtConfig: JWTConfig = {
  secret: secret || 'umbraeternum_secret_key_ultra_segura',
  expiresIn: process.env.JWT_EXPIRATION || '24h',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
};

// Exibir informações sobre a configuração JWT (sem expor o segredo)
logger.info('Configuração JWT carregada:');
logger.info(`- Secret: ${secret ? secret.substring(0, 3) + '**********' : 'undefined'}`);
logger.info(`- Expires In: ${jwtConfig.expiresIn}`);
logger.info(`- Refresh Expires In: ${jwtConfig.refreshExpiresIn}`);

export default jwtConfig;
