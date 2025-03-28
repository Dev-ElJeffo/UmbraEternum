import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

let app: Express;
let server: any;

beforeAll(() => {
  // Configurar o aplicativo Express
  app = express();
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  
  // Configurar rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // limite de 100 requisições por janela
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Rota raiz
  app.get('/', (req, res) => {
    res.json({ message: 'Bem-vindo ao UmbraEternum API' });
  });

  // Rota de status
  app.get('/api/status', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
  });

  // Rota para teste de erros
  app.get('/api/error', (req, res) => {
    res.status(500).json({ error: 'Teste de erro interno' });
  });

  // Rota para teste 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  });

  // Iniciar o servidor na porta 34504 (diferente das portas dos outros testes)
  server = app.listen(34504);
});

afterAll(() => {
  // Fechar o servidor após os testes
  server.close();
});

describe('Testes de API Básica', () => {
  it('Deve responder à rota raiz', async () => {
    const response = await request(app).get('/');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Bem-vindo ao UmbraEternum API');
  });

  it('Deve exibir o status online', async () => {
    const response = await request(app).get('/api/status');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'online');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('Deve retornar 404 para rotas inexistentes', async () => {
    const response = await request(app).get('/rota-que-nao-existe');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Endpoint não encontrado');
  });

  it('Deve retornar código de erro correto para erros internos', async () => {
    const response = await request(app).get('/api/error');
    
    expect(response.status).toBe(500);
    expect(response.body).toHaveProperty('error', 'Teste de erro interno');
  });

  it('Deve incluir headers de segurança', async () => {
    const response = await request(app).get('/');
    
    expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    expect(response.headers).toHaveProperty('x-xss-protection');
    expect(response.headers).toHaveProperty('content-security-policy');
  });
}); 