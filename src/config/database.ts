import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from './logger';

// Carregar variáveis de ambiente
dotenv.config();

interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  ssl?: object;
}

const dbConfig: DBConfig = {
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
    ssl: { rejectUnauthorized: true },
  }),
};

// Criar pool de conexões
const pool = mysql.createPool(dbConfig);

// Testar conexão
const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    logger.info('Configuração do banco de dados:');
    logger.info(`- Host: ${dbConfig.host}`);
    logger.info(`- Porta: ${dbConfig.port}`);
    logger.info(`- Usuário: ${dbConfig.user}`);
    logger.info(`- Banco de dados: ${dbConfig.database}`);
    logger.info(`- Ambiente: ${process.env.NODE_ENV || 'development'}`);
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
    connection.release();
  } catch (error) {
    logger.error('Erro ao conectar com o banco de dados:', error);
    throw error;
  }
};

export { pool, testConnection };
export default dbConfig;
