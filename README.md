# UmbraEternum

UmbraEternum é um sistema de gerenciamento de RPG que permite aos usuários criar e gerenciar personagens, campanhas e sessões de jogo.

## Tecnologias

- **Backend**: Node.js, Express, TypeScript
- **Banco de Dados**: MySQL
- **Autenticação**: JWT (JSON Web Tokens)
- **Testes**: Jest, Supertest
- **CI/CD**: GitHub Actions

## Funcionalidades

- Autenticação de usuários (registro, login)
- Gerenciamento de personagens
- Funções administrativas
- API RESTful

## Estrutura do Projeto

```
.
├── dist/               # Código compilado (gerado pelo TypeScript)
├── node_modules/       # Dependências
├── src/                # Código fonte
│   ├── config/         # Configurações
│   ├── middlewares/    # Middlewares Express
│   ├── models/         # Modelos de dados
│   ├── routes/         # Rotas da API
│   ├── __tests__/      # Testes automatizados
│   │   ├── mocks/      # Mocks para os testes
│   │   └── README.md   # Documentação específica de testes
│   └── index.ts        # Ponto de entrada
├── .github/            # Configurações do GitHub
│   ├── workflows/      # Workflows para GitHub Actions
│   └── CI_CD.md        # Documentação de CI/CD
├── .env                # Variáveis de ambiente
├── .env.test           # Variáveis de ambiente para testes
├── package.json        # Dependências e scripts
├── jest.config.js      # Configuração do Jest
└── tsconfig.json       # Configuração do TypeScript
```

## Instalação

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Configure o arquivo `.env` com suas variáveis de ambiente
4. Inicialize o banco de dados:
   ```bash
   npm run db:init
   ```
5. Compile o TypeScript:
   ```bash
   npm run build
   ```
6. Inicie o servidor:
   ```bash
   npm start
   ```

## Scripts

- `npm start`: Inicia o servidor (código compilado)
- `npm run dev`: Inicia o servidor em modo de desenvolvimento
- `npm run build`: Compila o TypeScript
- `npm test`: Executa todos os testes
- `npm run test:basic`: Executa testes básicos (API, servidor e exemplo)
- `npm run test:all`: Executa todos os testes funcionais exceto o teste de banco de dados

## Testes

O projeto inclui testes automatizados para todas as principais funcionalidades. Para mais detalhes, consulte a [documentação de testes](./src/__tests__/README.md).

### Sistema de Testes

O sistema de testes foi projetado para ser:

1. **Isolado**: Os testes não dependem de um banco de dados real ou de serviços externos
2. **Completo**: Cobertura de todas as principais funcionalidades
3. **Independente**: Cada teste usa sua própria porta e servidor para evitar conflitos
4. **Manutenível**: Organizado por funcionalidade e com documentação clara

### Tipos de Testes

- **Testes Unitários**: Verificam o comportamento de componentes isolados
- **Testes de API**: Validam os endpoints e respostas HTTP
- **Testes de Autenticação**: Garantem que o registro e login funcionem corretamente
- **Testes de CRUD**: Verificam operações de criação, leitura, atualização e exclusão

### Mocks

O sistema utiliza mocks para simular:

- **Banco de dados**: Implementação simulada do MySQL com dados iniciais
- **Autenticação**: Simulação de JWT e bcrypt
- **Serviços externos**: Quando necessário

### Cobertura de Testes

Os testes cobrem:
- API básica e servidor
- Autenticação (registro, login)
- Gerenciamento de personagens (CRUD completo)
- Funções administrativas (listar, alterar papéis, desativar usuários)

## Integração Contínua

O projeto utiliza GitHub Actions para automatizar a execução de testes e garantir a qualidade do código. Para mais detalhes, consulte a [documentação de CI/CD](./.github/CI_CD.md).

### Fluxo de CI

1. **Eventos de Gatilho**:
   - Push para branches `main` e `develop`
   - Pull Requests para branches `main` e `develop`

2. **Ambiente de Teste**:
   - Múltiplas versões do Node.js (16.x, 18.x)
   - Banco de dados MySQL dedicado para testes

3. **Execução**:
   - Testes básicos
   - Testes funcionais
   - Geração de relatórios de cobertura

4. **Artefatos**:
   - Relatórios de cobertura de código

### Status da Build

[![UmbraEternum Tests](https://github.com/{username}/UmbraEternum/actions/workflows/tests.yml/badge.svg)](https://github.com/{username}/UmbraEternum/actions/workflows/tests.yml)

## API Endpoints

### Autenticação

- `POST /api/auth/register`: Registro de usuário
- `POST /api/auth/login`: Login de usuário
- `GET /api/auth/status`: Status do usuário atual

### Personagens

- `GET /api/characters`: Lista personagens do usuário
- `POST /api/characters`: Cria um novo personagem
- `GET /api/characters/:id`: Detalhes de um personagem
- `PUT /api/characters/:id`: Atualiza um personagem
- `DELETE /api/characters/:id`: Remove um personagem

### Administração

- `GET /api/admin/users`: Lista todos os usuários
- `GET /api/admin/characters`: Lista todos os personagens
- `PUT /api/admin/users/:id/role`: Altera o papel de um usuário
- `DELETE /api/admin/users/:id`: Desativa um usuário

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Escreva testes para sua funcionalidade
4. Implemente sua funcionalidade
5. Verifique se todos os testes passam (`npm test`)
6. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
7. Envie para a branch (`git push origin feature/nova-funcionalidade`)
8. Abra um Pull Request 