import dotenv from 'dotenv';
import '@jest/globals';

// Carrega variáveis de ambiente para testes
dotenv.config({ path: '.env.test' });

// Configuração global para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '34567';

// Variáveis do banco de dados de teste
console.log('Configurações do banco de dados para testes:');
console.log(`Host: ${process.env.DB_HOST}`);
console.log(`User: ${process.env.DB_USER}`);
console.log(`Database: ${process.env.DB_NAME}`);

// Configuração do timeout para testes
jest.setTimeout(30000);

// Configuração global do Jest
beforeAll(() => {
  // Configurações que devem ser executadas antes de todos os testes
  console.log('Iniciando testes...');
});

afterAll(() => {
  // Limpeza após todos os testes
  console.log('Testes concluídos.');
});
