# API RESTful do UmbraEternum

## Iniciando o Servidor

```bash
# Iniciar o servidor
node src/index-for-now.js

# Ou usando o script npm
npm run dev-socket
```

O servidor será iniciado na porta 34567.

## Endpoints Disponíveis

### Status do Servidor

**Endpoint:** `GET /api/status`

**Descrição:** Verifica o status atual do servidor.

**Resposta de Exemplo:**
```json
{
  "success": true,
  "status": "online",
  "timestamp": "2025-03-26T18:30:00.123Z",
  "version": "1.0.0",
  "onlinePlayers": 3,
  "database": "connected"
}
```

### Listar Endpoints

**Endpoint:** `GET /api/endpoints`

**Descrição:** Lista todos os endpoints disponíveis no servidor.

**Resposta de Exemplo:**
```json
{
  "success": true,
  "endpoints": [
    { "method": "GET", "path": "/api/status", "description": "Verificar status do servidor" },
    { "method": "GET", "path": "/api/endpoints", "description": "Listar todos os endpoints disponíveis" },
    { "method": "POST", "path": "/api/auth/register", "description": "Registrar novo usuário" },
    { "method": "POST", "path": "/api/auth/login", "description": "Fazer login" },
    { "method": "POST", "path": "/api/auth/logout", "description": "Fazer logout e encerrar sessão" },
    { "method": "POST", "path": "/api/auth/refresh-token", "description": "Renovar token de acesso" },
    { "method": "POST", "path": "/api/users/change-password", "description": "Alterar senha do usuário" },
    { "method": "GET", "path": "/api/characters", "description": "Listar personagens do usuário" },
    { "method": "GET", "path": "/api/characters/:id", "description": "Obter detalhes de um personagem" },
    { "method": "POST", "path": "/api/characters", "description": "Criar novo personagem" },
    { "method": "PUT", "path": "/api/characters/:id", "description": "Atualizar personagem existente" },
    { "method": "DELETE", "path": "/api/characters/:id", "description": "Excluir personagem" },
    { "method": "GET", "path": "/api/admin/users", "description": "Listar todos os usuários (admin)" },
    { "method": "PUT", "path": "/api/admin/users/:id/ban", "description": "Banir usuário (admin)" },
    { "method": "PUT", "path": "/api/admin/users/:id/unban", "description": "Desbanir usuário (admin)" },
    { "method": "PUT", "path": "/api/admin/users/:id/promote", "description": "Promover usuário a admin" },
    { "method": "GET", "path": "/api/admin/characters", "description": "Listar todos os personagens (admin)" },
    { "method": "GET", "path": "/api/admin/stats", "description": "Obter estatísticas do sistema (admin)" }
  ]
}
```

### Autenticação

#### POST /api/auth/register
Registra um novo usuário no sistema.

**Corpo da Requisição:**
```json
{
  "username": "string", // 3-30 caracteres, apenas letras, números e sublinhado
  "email": "string",    // email válido
  "password": "string"  // mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
}
```

**Resposta de Sucesso (201):**
```json
{
  "success": true,
  "message": "Registro realizado com sucesso",
  "accessToken": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "player"
  }
}
```

**Resposta de Erro (409 - Conflito):**
```json
{
  "success": false,
  "message": "Nome de usuário ou email já está em uso"
}
```

#### POST /api/auth/login
Realiza login do usuário.

**Corpo da Requisição:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "accessToken": "string",
  "user": {
    "id": "number",
    "username": "string",
    "email": "string",
    "role": "string"
  }
}
```

**Resposta de Erro (401 - Não autorizado):**
```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

#### POST /api/auth/logout
Realiza logout do usuário e desconecta todos os sockets associados.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso"
}
```

#### POST /api/auth/refresh-token
Renova o token de acesso usando o token de atualização.

**Corpo da Requisição:**
```json
{
  "refreshToken": "token_de_atualizacao"
}
```

**Resposta de Sucesso (200):**
```json
{
  "message": "Token renovado com sucesso",
  "accessToken": "string",
  "refreshToken": "string",
  "expiresIn": "1h"
}
```

### Gerenciamento de Conta

#### POST /api/users/change-password
Altera a senha do usuário logado.

**Headers:**
```
Authorization: Bearer <token>
```

**Corpo da Requisição:**
```json
{
  "currentPassword": "senha_atual",
  "newPassword": "nova_senha"
}
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Senha alterada com sucesso"
}
```

### Personagens

#### GET /api/characters
Lista todos os personagens do usuário autenticado.

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "number",
      "name": "string",
      "class": "string",
      "level": "number",
      "strength": "number",
      "dexterity": "number",
      "constitution": "number",
      "intelligence": "number",
      "wisdom": "number",
      "charisma": "number",
      "backstory": "string"
    }
  ]
}
```

#### POST /api/characters
Cria um novo personagem.

**Headers:**
```
Authorization: Bearer <token>
```

**Corpo da Requisição:**
```json
{
  "name": "string",      // 3-50 caracteres
  "class": "string",     // classe do personagem
  "strength": "number",  // opcional, padrão 10
  "dexterity": "number", // opcional, padrão 10
  "constitution": "number", // opcional, padrão 10
  "intelligence": "number", // opcional, padrão 10
  "wisdom": "number",    // opcional, padrão 10
  "charisma": "number",  // opcional, padrão 10
  "backstory": "string"  // opcional
}
```

### Administração

#### GET /api/admin/users
Lista todos os usuários (apenas admin).

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT /api/admin/users/:id/ban
Bane um usuário (apenas admin).

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT /api/admin/users/:id/unban
Desbane um usuário (apenas admin).

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT /api/admin/users/:id/promote
Promove um usuário a administrador (apenas admin).

**Headers:**
```
Authorization: Bearer <token>
```

#### POST /api/admin/disconnect-all
Desconecta todos os usuários (apenas admin).

**Headers:**
```
Authorization: Bearer <token>
```

### WebSocket

O servidor também fornece uma interface WebSocket para comunicação em tempo real.

**URL:** `ws://localhost:34567`

**Eventos:**
- `authenticate`: Autentica o socket com um token JWT
- `players_count`: Recebe atualização do número de jogadores online
- `logout_notification`: Notifica sobre logout de usuários
- `activity`: Recebe atualizações de atividades do sistema

## Segurança

- Todas as rotas protegidas requerem um token JWT válido no header `Authorization`
- Senhas são hasheadas usando bcrypt
- Implementado rate limiting para tentativas de login
- Validação e sanitização de inputs em todas as rotas
- Proteção contra SQL injection usando prepared statements
- CORS configurado para segurança

## Validações

### Registro
- Username: 3-30 caracteres, apenas letras, números e sublinhado
- Email: formato válido
- Senha: mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número

### Personagens
- Nome: 3-50 caracteres
- Atributos: números entre 1-20

## Logs

O sistema mantém logs detalhados de:
- Registros de usuários
- Logins/Logouts
- Ações administrativas
- Erros e exceções
- Atividades do sistema

Os logs são salvos em arquivos diários no diretório `logs/`.

## Integração com Unreal Engine 5

Para integrar com a Unreal Engine 5, use os seguintes métodos:

### 1. Requisições HTTP

Use o módulo HTTP da Unreal Engine para fazer requisições às APIs:

```c++
// Exemplo em C++ na Unreal Engine 5
#include "HttpModule.h"
#include "Interfaces/IHttpRequest.h"
#include "Interfaces/IHttpResponse.h"

void UYourClass::LoginUser(FString Username, FString Password)
{
    TSharedRef<IHttpRequest, ESPMode::ThreadSafe> Request = FHttpModule::Get().CreateRequest();
    Request->SetURL(TEXT("http://localhost:34567/api/auth/login"));
    Request->SetVerb(TEXT("POST"));
    Request->SetHeader(TEXT("Content-Type"), TEXT("application/json"));
    
    FString JsonPayload = FString::Printf(TEXT("{\"username\":\"%s\",\"password\":\"%s\"}"), 
        *Username, *Password);
    
    Request->SetContentAsString(JsonPayload);
    Request->OnProcessRequestComplete().BindUObject(this, &UYourClass::OnLoginResponse);
    Request->ProcessRequest();
}

void UYourClass::OnLoginResponse(FHttpRequestPtr Request, FHttpResponsePtr Response, bool bWasSuccessful)
{
    if (bWasSuccessful && Response.IsValid() && Response->GetResponseCode() == 200)
    {
        FString ResponseContent = Response->GetContentAsString();
        // Processar o token JWT e armazenar para uso futuro
        // ...
    }
    else
    {
        UE_LOG(LogTemp, Error, TEXT("Falha no login. Código: %d"), 
            Response.IsValid() ? Response->GetResponseCode() : 0);
    }
}
```

### 2. WebSockets para Tempo Real

Para comunicação em tempo real (movimento de personagens, chat, etc.), use WebSockets:

```c++
// Exemplo em C++ na Unreal Engine 5
#include "WebSocketsModule.h"
#include "IWebSocket.h"

TSharedPtr<IWebSocket> WebSocket;

void UYourClass::ConnectWebSocket(FString AuthToken)
{
    // Inicializar módulo de WebSockets
    if (!FModuleManager::Get().IsModuleLoaded("WebSockets"))
    {
        FModuleManager::Get().LoadModule("WebSockets");
    }
    
    WebSocket = FWebSocketsModule::Get().CreateWebSocket(
        TEXT("ws://localhost:34567"), 
        TEXT(""), // Sub-protocolo, vazio neste caso
        TMap<FString, FString>() // Cabeçalhos adicionais
    );
    
    // Configurar callbacks
    WebSocket->OnConnected().AddLambda([this, AuthToken]() {
        UE_LOG(LogTemp, Display, TEXT("WebSocket conectado!"));
        
        // Enviar autenticação após conexão
        FString AuthMessage = FString::Printf(TEXT("{\"event\":\"authenticate\",\"token\":\"%s\"}"), *AuthToken);
        WebSocket->Send(AuthMessage);
    });
    
    WebSocket->OnMessage().AddLambda([this](const FString& Message) {
        UE_LOG(LogTemp, Display, TEXT("Mensagem recebida: %s"), *Message);
        // Processar mensagem recebida
        // ...
    });
    
    WebSocket->OnClosed().AddLambda([this](int32 StatusCode, const FString& Reason, bool bWasClean) {
        UE_LOG(LogTemp, Warning, TEXT("WebSocket fechado. Código: %d, Razão: %s"), StatusCode, *Reason);
    });
    
    WebSocket->OnConnectionError().AddLambda([this](const FString& Error) {
        UE_LOG(LogTemp, Error, TEXT("Erro de conexão WebSocket: %s"), *Error);
    });
    
    // Conectar
    WebSocket->Connect();
}

// Enviar atualização de posição via WebSocket
void UYourClass::SendPositionUpdate(int32 CharacterId, FVector Position, FRotator Rotation)
{
    if (WebSocket && WebSocket->IsConnected())
    {
        FString PositionMessage = FString::Printf(
            TEXT("{\"event\":\"position_update\",\"character_id\":%d,\"position\":{\"x\":%.2f,\"y\":%.2f,\"z\":%.2f},\"rotation\":{\"pitch\":%.2f,\"yaw\":%.2f,\"roll\":%.2f}}"),
            CharacterId, 
            Position.X, Position.Y, Position.Z,
            Rotation.Pitch, Rotation.Yaw, Rotation.Roll
        );
        
        WebSocket->Send(PositionMessage);
    }
}
```

## Scripts de Teste

O sistema inclui vários scripts para testar as funcionalidades:

- `node test-api.js` - Teste geral das APIs
- `node create-admin.js` - Cria um usuário administrador
- `node test-admin-login.js` - Testa o login do administrador
- `node update-admin-role.js` - Atualiza a role do usuário admin para "admin"
- `node create-character.js` - Cria um personagem mago
- `node create-warrior.js` - Cria um personagem guerreiro
- `node update-character.js` - Atualiza um personagem existente
- `node delete-character.js` - Exclui um personagem
- `node summary.js` - Mostra um resumo do sistema (usuários e personagens)

## Base URL
```
http://localhost:34567/api
```

## WebSocket
```
ws://localhost:34567
```

## Autenticação
A maioria dos endpoints requer um token JWT no cabeçalho da requisição:
```
Authorization: Bearer <seu_token_jwt>
```