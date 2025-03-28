"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
// Configuração do formato
const { combine, timestamp, printf, colorize } = winston_1.default.format;
// Diretório para os logs
const logDir = path_1.default.join(process.cwd(), 'logs');
// Formato do log
const logFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});
// Configuração do logger
const logger = winston_1.default.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    defaultMeta: { service: 'umbraeternum-api' },
    transports: [
        // Log de erros em arquivo
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'error.log'),
            level: 'error',
        }),
        // Log de todas as informações
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'combined.log'),
        }),
        // Em desenvolvimento, mostra no console também
        ...(process.env.NODE_ENV !== 'production'
            ? [
                new winston_1.default.transports.Console({
                    format: combine(colorize(), logFormat),
                }),
            ]
            : []),
    ],
});
// Exporta um wrapper para facilitar o uso
exports.default = {
    info: (message) => {
        logger.info(message);
    },
    error: (message, error) => {
        if (error) {
            logger.error(`${message}: ${error.message || error}`);
        }
        else {
            logger.error(message);
        }
    },
    warn: (message) => {
        logger.warn(message);
    },
    debug: (message) => {
        logger.debug(message);
    },
    http: (message) => {
        logger.http(message);
    },
};
