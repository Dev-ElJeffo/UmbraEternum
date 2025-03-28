const fs = require('fs');
const path = require('path');
const winston = require('winston');
const dotenv = require('dotenv');

dotenv.config();

// Garantir que o diretório de logs existe
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logLevel = process.env.LOG_LEVEL || 'info';

// Criar logger
const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    // Log para console
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), logFormat),
    }),
    // Log de erros para arquivo
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
    }),
    // Log combinado para arquivo
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
    }),
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
    }),
  ],
});

// Função de log para requisições HTTP
const httpLogger = (req, res, next) => {
  const start = new Date();
  res.on('finish', () => {
    const duration = new Date() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    logger.info(message);
  });
  next();
};

module.exports = { logger, httpLogger };
