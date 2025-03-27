"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testConnection = exports.pool = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '!Mister4126',
    database: process.env.DB_NAME || 'umbraeternum_new',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // Usar SSL/TLS para conexão segura quando em produção
    ...(process.env.NODE_ENV === 'production' && {
        ssl: { rejectUnauthorized: true }
    })
};
// Criar pool de conexões
const pool = promise_1.default.createPool(dbConfig);
exports.pool = pool;
// Testar conexão
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Conexão com o banco de dados estabelecida com sucesso.');
        connection.release();
    }
    catch (error) {
        console.error('Erro ao conectar com o banco de dados:', error);
        process.exit(1);
    }
};
exports.testConnection = testConnection;
exports.default = dbConfig;
