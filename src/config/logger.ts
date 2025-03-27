import winston from 'winston';
import path from 'path';

// Configuração do formato
const { combine, timestamp, printf, colorize } = winston.format;

// Diretório para os logs
const logDir = path.join(process.cwd(), 'logs');

// Formato do log
const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'umbraeternum-api' },
  transports: [
    // Log de erros em arquivo
    new winston.transports.File({ 
      filename: path.join(logDir, 'error.log'), 
      level: 'error' 
    }),
    // Log de todas as informações
    new winston.transports.File({ 
      filename: path.join(logDir, 'combined.log') 
    }),
    // Em desenvolvimento, mostra no console também
    ...(process.env.NODE_ENV !== 'production' 
      ? [new winston.transports.Console({
          format: combine(colorize(), logFormat)
        })]
      : [])
  ]
});

// Exporta um wrapper para facilitar o uso
export default {
  info: (message: string): void => {
    logger.info(message);
  },
  error: (message: string, error?: any): void => {
    if (error) {
      logger.error(`${message}: ${error.message || error}`);
    } else {
      logger.error(message);
    }
  },
  warn: (message: string): void => {
    logger.warn(message);
  },
  debug: (message: string): void => {
    logger.debug(message);
  },
  http: (message: string): void => {
    logger.http(message);
  }
}; 