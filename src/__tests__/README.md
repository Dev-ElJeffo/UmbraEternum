# Testes do UmbraEternum

Este diretório contém testes automatizados para o projeto UmbraEternum, um RPG online.

## Estrutura dos Testes

Os testes estão organizados da seguinte forma:

- **api.test.ts**: Teste básico da API, verificando rotas básicas e comportamento de resposta.
- **server.test.ts**: Testes do servidor Express, incluindo configurações de segurança.
- **auth.test.ts**: Testes das funcionalidades de autenticação (registro, login).
- **character.test.ts**: Testes das operações de personagem (criar, listar, atualizar, excluir).
- **admin.test.ts**: Testes das funcionalidades administrativas.
- **example.test.ts**: Um teste de exemplo simples.
- **database.test.ts**: Testes do banco de dados mockado (atualmente com problemas).

## Mocks

Os mocks para os testes estão localizados em `mocks/`:

- **db.mock.ts**: Implementação de um banco de dados mockado para os testes, simulando o comportamento do MySQL.

## Como Executar os Testes

Você pode executar os testes usando os seguintes comandos:

```bash
# Executar todos os testes
npm test

# Executar apenas os testes básicos (API, servidor e exemplo)
npm run test:basic

# Executar todos os testes exceto o teste de banco de dados
npm run test:all
```

## Cobertura de Código

A configuração atual está configurada para gerar relatórios de cobertura de código. Você pode ver a cobertura no terminal após a execução dos testes.

## Configuração do Jest

A configuração do Jest está no arquivo `jest.config.js` na raiz do projeto. As principais configurações incluem:

- **Ambiente de teste**: Node.js
- **Padrão de arquivos de teste**: `**/__tests__/**/*.test.ts`
- **Arquivos ignorados**: `/node_modules/`, `/dist/`, `jest.setup.ts`, `database.test.ts`
- **Arquivos de configuração**: `./src/__tests__/jest.setup.ts`

## Organização dos Mocks

Para cada teste, foram criados mocks específicos:

- **Banco de dados**: Simulação do MySQL usando um pool de conexão mockado.
- **Autenticação**: Simulação do JWT e bcrypt para testes de autenticação.
- **Requisições HTTP**: Uso do supertest para simular requisições HTTP.

## Boas Práticas

Os testes seguem algumas boas práticas:

1. **Isolamento**: Cada teste deve ser independente dos outros.
2. **Mocks**: Uso de mocks para simular dependências externas.
3. **Assertivas claras**: Cada teste verifica um comportamento específico.
4. **Setup/Teardown**: Uso de `beforeAll` e `afterAll` para configurar e limpar o ambiente.

## Próximos Passos

Algumas melhorias que podem ser feitas:

1. Corrigir os problemas no teste de banco de dados.
2. Aumentar a cobertura de código.
3. Adicionar testes para outras funcionalidades.
4. Implementar testes de integração. 