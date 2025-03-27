# Documentação de APIs do UmbraEternum

## Visão Geral
Este documento contém informações sobre os endpoints REST disponíveis na API do UmbraEternum, baseado nos testes realizados.

## Base URL
Todas as APIs são acessíveis a partir de `http://localhost:34567/api`

## WebSocket
Conexão WebSocket disponível em `ws://localhost:34567`

## Autenticação
A maioria dos endpoints requer autenticação usando token JWT. O token deve ser enviado no cabeçalho da requisição no formato:

```
Authorization: Bearer {seu_token_aqui}
```

## Endpoints Disponíveis

### Status do Servidor
- **URL**: `/status`
- **Método**: `GET`
- **Autenticação**: Não requerida
- **Descrição**: Retorna o status atual do servidor, incluindo versão e número de jogadores online
- **Resposta de Exemplo**:
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-03-26T21:43:48.017Z",
  "version": "1.0.0",
  "onlinePlayers": 0,
  "database": "connected"
}
```

### Registro de Usuário
- **URL**: `/auth/register`
- **Método**: `POST`
- **Autenticação**: Não requerida
- **Corpo da Requisição**:
```json
{
  "username": "nome_de_usuario",
  "email": "email@exemplo.com",
  "password": "senha_segura"
}
```
- **Descrição**: Registra um novo usuário no sistema
- **Resposta de Exemplo**:
```json
{
  "success": true,
  "message": "Registro realizado com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 15,
    "username": "nome_de_usuario",
    "email": "email@exemplo.com",
    "role": "player"
  }
}
```

### Login
- **URL**: `/auth/login`
- **Método**: `POST`
- **Autenticação**: Não requerida
- **Corpo da Requisição**:
```json
{
  "username": "nome_de_usuario",
  "password": "senha"
}
```
- **Descrição**: Autentica um usuário existente
- **Resposta de Exemplo**:
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR...",
  "user": {
    "id": 15,
    "username": "nome_de_usuario",
    "email": "email@exemplo.com",
    "role": "player"
  }
}
```

## Endpoints WebSocket

O servidor suporta comunicação em tempo real via WebSocket. Para se conectar, o cliente deve:

1. Estabelecer uma conexão com `ws://localhost:34567`
2. Autenticar-se enviando um evento `authenticate` com o token JWT

### Eventos disponíveis

#### Eventos que você pode enviar:
- `authenticate`: Autentica o usuário na conexão WebSocket
  ```json
  {
    "token": "seu_jwt_token_aqui"
  }
  ```
- `chat_message`: Envia uma mensagem no chat
  ```json
  {
    "message": "Conteúdo da mensagem",
    "timestamp": "2025-03-26T21:43:48.017Z"
  }
  ```
- `pong`: Resposta ao ping do servidor
  ```json
  {
    "timestamp": 1743025428000
  }
  ```

#### Eventos que você pode receber:
- `authenticated`: Confirmação de autenticação
- `system_message`: Mensagens do sistema
- `players_count`: Número atual de jogadores online
- `ping`: Ping periódico do servidor para manter a conexão

## Instruções para Logs

O servidor foi configurado para registrar logs detalhados de todas as requisições HTTP e conexões WebSocket. Estes logs incluem:

- Timestamp da requisição
- Método HTTP e URL
- Endereço IP do cliente
- Código de status da resposta
- Tempo de processamento

Para visualizar estes logs, execute o servidor usando:

```
node src/index-for-now.js
```

### Testes Automatizados

O projeto inclui scripts para testar automaticamente todas as APIs REST e WebSocket:

- `node api-test.js`: Testa os endpoints REST
- `node websocket-test.js`: Testa conexões WebSocket

Estes scripts produzem logs detalhados de cada requisição e resposta, permitindo verificar o funcionamento correto da API. 