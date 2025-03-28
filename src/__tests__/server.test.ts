import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Criar uma instância do Express para testes
const app = express();

// Configurações básicas
app.use(express.json());
app.use(cors());
app.use(helmet());

// Rate limiting para testes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por janela
});
app.use(limiter);

// Rotas de teste
app.get('/', (req, res) => {
  res.status(200).json({ message: 'API funcionando' });
});

app.get('/api/status', (req, res) => {
  res.status(200).json({ status: 'online' });
});

describe('Servidor', () => {
  let server: any;
  const TEST_PORT = 34568; // Porta diferente para testes

  beforeAll(() => {
    server = app.listen(TEST_PORT);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('deve responder na rota raiz', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'API funcionando');
  });

  it('deve responder na rota de status da API', async () => {
    const response = await request(app).get('/api/status');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'online');
  });

  it('deve ter headers de segurança configurados', async () => {
    const response = await request(app).get('/');
    expect(response.headers).toHaveProperty('x-frame-options');
    expect(response.headers).toHaveProperty('x-content-type-options');
    expect(response.headers).toHaveProperty('x-xss-protection');
  });
}); 