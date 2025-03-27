# Guia de APIs do UmbraEternum

Este documento descreve as APIs disponíveis no servidor UmbraEternum, incluindo os endpoints, os parâmetros necessários e os formatos de resposta.

## Como Iniciar o Servidor

```bash
# Para iniciar o servidor usando o arquivo index-for-now.js:
npm run dev-socket

# Ou diretamente:
node src/index-for-now.js
```

O servidor será iniciado na porta 34567.

## Endpoints Disponíveis

### Status do Servidor

**Endpoint:** `GET /api/status`

**Descrição:** Retorna o status atual do servidor, incluindo a versão, número de jogadores online e status do banco de dados.

**Exemplo de Resposta:**
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-03-26T18:49:20.402Z",
  "version": "1.0.0",
  "onlinePlayers": 0,
  "database": "connected"
}
```

### Listar Endpoints

**Endpoint:** `GET /api/endpoints`

**Descrição:** Retorna uma lista de todos os endpoints disponíveis no servidor.

**Exemplo de Resposta:**
```json
{
  "success": true,
  "endpoints": [
    { "method": "GET", "path": "/api/status", "description": "Verificar status do servidor" },
    { "method": "GET", "path": "/api/endpoints", "description": "Listar todos os endpoints disponíveis" },
    { "method": "POST", "path": "/api/auth/register", "description": "Registrar novo usuário" },
    { "method": "POST", "path": "/api/auth/login", "description": "Fazer login" }
  ]
}
```

### Registro de Usuário

**Endpoint:** `POST /api/auth/register`

**Descrição:** Registra um novo usuário no sistema.

**Corpo da Requisição:**
```json
{
  "username": "seu_usuario",
  "email": "seu_email@exemplo.com",
  "password": "sua_senha"
}
```

**Regras de Validação:**
- Nome de usuário: mínimo de 3 caracteres
- Senha: mínimo de 6 caracteres
- Email: deve ser um email válido

**Exemplo de Resposta (Sucesso):**
```json
{
  "success": true,
  "message": "Registro realizado com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "seu_usuario",
    "email": "seu_email@exemplo.com",
    "role": "player"
  }
}
```

**Exemplo de Resposta (Erro):**
```json
{
  "success": false,
  "message": "Nome de usuário ou email já está em uso"
}
```

### Login de Usuário

**Endpoint:** `POST /api/auth/login`

**Descrição:** Realiza o login de um usuário existente.

**Corpo da Requisição:**
```json
{
  "username": "seu_usuario",
  "password": "sua_senha"
}
```

**Exemplo de Resposta (Sucesso):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 123,
    "username": "seu_usuario",
    "email": "seu_email@exemplo.com",
    "role": "player"
  }
}
```

**Exemplo de Resposta (Erro):**
```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

## Conexão WebSocket

Além das APIs REST, o servidor também suporta conexões WebSocket para comunicação em tempo real.

**URL:** `ws://localhost:34567`

**Eventos Disponíveis:**

| Evento | Direção | Descrição |
| ------ | ------- | --------- |
| `authenticate` | Cliente → Servidor | Autentica o usuário com um token JWT |
| `system_message` | Servidor → Cliente | Mensagens do sistema para o usuário |
| `players_count` | Servidor → Cliente | Atualização do número de jogadores online |
| `login_notification` | Servidor → Cliente | Notificação quando um usuário faz login |
| `logout_notification` | Servidor → Cliente | Notificação quando um usuário sai |
| `activity` | Servidor → Cliente | Registro de atividades no sistema |
| `ping` | Cliente → Servidor | Usado para medir latência |
| `pong` | Servidor → Cliente | Resposta ao ping do cliente |
| `server_ping` | Servidor → Cliente | Ping periódico do servidor |

## Códigos de Resposta HTTP

| Código | Descrição |
| ------ | --------- |
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Erro na requisição do cliente |
| 401 | Unauthorized - Credenciais inválidas |
| 403 | Forbidden - Acesso negado |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: usuário já existe) |
| 500 | Internal Server Error - Erro no servidor |

## Exemplo de Uso (JavaScript)

```javascript
// Registrar um novo usuário
async function registerUser(username, email, password) {
  const response = await fetch('http://localhost:34567/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      email,
      password
    })
  });
  
  return await response.json();
}

// Fazer login
async function login(username, password) {
  const response = await fetch('http://localhost:34567/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password
    })
  });
  
  return await response.json();
}
``` 