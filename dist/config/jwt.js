"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("./logger"));
dotenv_1.default.config();
// Garantir que o segredo JWT está definido
const secret = process.env.JWT_SECRET;
if (!secret) {
    logger_1.default.warn('JWT_SECRET não está definido! Usando um valor padrão inseguro. NÃO use isso em produção!');
}
const jwtConfig = {
    secret: secret || 'umbraeternum_secret_key_ultra_segura',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d'
};
// Exibir informações sobre a configuração JWT (sem expor o segredo)
logger_1.default.info('Configuração JWT carregada:');
logger_1.default.info(`- Secret: ${secret ? secret.substring(0, 3) + '**********' : 'undefined'}`);
logger_1.default.info(`- Expires In: ${jwtConfig.expiresIn}`);
logger_1.default.info(`- Refresh Expires In: ${jwtConfig.refreshExpiresIn}`);
exports.default = jwtConfig;
