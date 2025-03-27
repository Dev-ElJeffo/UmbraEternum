<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Teste de WebSocket - UmbraEternum</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        
        h1 {
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 10px;
        }
        
        #log {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 10px;
            height: 400px;
            overflow-y: auto;
            font-family: monospace;
            margin-bottom: 20px;
        }
        
        .log-entry {
            margin-bottom: 5px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        .timestamp {
            color: #888;
            font-size: 0.8em;
        }
        
        .success {
            color: green;
        }
        
        .error {
            color: red;
        }
        
        .info {
            color: blue;
        }
        
        button {
            padding: 8px 16px;
            margin-right: 10px;
            border: none;
            border-radius: 4px;
            background-color: #4CAF50;
            color: white;
            cursor: pointer;
        }
        
        button:hover {
            background-color: #45a049;
        }
        
        button#disconnect {
            background-color: #f44336;
        }
        
        button#disconnect:hover {
            background-color: #d32f2f;
        }
    </style>
</head>
<body>
    <h1>Teste de WebSocket - UmbraEternum</h1>
    
    <div id="log"></div>
    
    <div id="controls">
        <button id="connect">Conectar</button>
        <button id="authenticate">Autenticar (String)</button>
        <button id="authenticateObject">Autenticar (Objeto)</button>
        <button id="authenticateInvalid">Autenticar (Inválido)</button>
        <button id="disconnect">Desconectar</button>
    </div>
    
    <script src="https://cdn.socket.io/4.4.1/socket.io.min.js"></script>
    <script>
        // Configurações
        const SOCKET_URL = 'ws://localhost:34567';
        let socket = null;
        
        // Elementos do DOM
        const logElement = document.getElementById('log');
        const connectBtn = document.getElementById('connect');
        const authenticateBtn = document.getElementById('authenticate');
        const authenticateObjectBtn = document.getElementById('authenticateObject');
        const authenticateInvalidBtn = document.getElementById('authenticateInvalid');
        const disconnectBtn = document.getElementById('disconnect');
        
        // Função para adicionar entradas ao log
        function log(message, type = 'info') {
            const timestamp = new Date().toISOString();
            const logEntry = document.createElement('div');
            logEntry.className = `log-entry ${type}`;
            
            const timestampSpan = document.createElement('span');
            timestampSpan.className = 'timestamp';
            timestampSpan.textContent = `[${timestamp}] `;
            
            logEntry.appendChild(timestampSpan);
            logEntry.appendChild(document.createTextNode(message));
            
            logElement.appendChild(logEntry);
            logElement.scrollTop = logElement.scrollHeight; // Rolar para o final
        }
        
        // Conectar ao WebSocket
        connectBtn.addEventListener('click', () => {
            if (socket && socket.connected) {
                log('Já conectado ao servidor', 'info');
                return;
            }
            
            log('Conectando ao servidor WebSocket...', 'info');
            
            socket = io(SOCKET_URL, {
                transports: ['websocket'],
                reconnection: true
            });
            
            // Configurar eventos do socket
            socket.on('connect', () => {
                log(`Conectado ao servidor! ID do socket: ${socket.id}`, 'success');
            });
            
            socket.on('connect_error', (error) => {
                log(`Erro de conexão: ${error.message}`, 'error');
            });
            
            socket.on('disconnect', (reason) => {
                log(`Desconectado: ${reason}`, 'info');
            });
            
            socket.on('auth_success', (data) => {
                log(`Autenticação bem-sucedida: ${JSON.stringify(data)}`, 'success');
            });
            
            socket.on('auth_error', (data) => {
                log(`Erro de autenticação: ${JSON.stringify(data)}`, 'error');
            });
            
            socket.on('system_message', (data) => {
                log(`Mensagem do sistema: ${JSON.stringify(data)}`, 'info');
            });
            
            socket.on('players_count', (count) => {
                log(`Número de jogadores online: ${count}`, 'info');
            });
            
            // Log de todos os eventos não tratados específicamente
            socket.onAny((event, ...args) => {
                if (!['connect', 'disconnect', 'auth_success', 'auth_error', 'system_message', 'players_count'].includes(event)) {
                    log(`Evento recebido: ${event}, Dados: ${JSON.stringify(args)}`, 'info');
                }
            });
        });
        
        // Autenticar (String)
        authenticateBtn.addEventListener('click', () => {
            if (!socket || !socket.connected) {
                log('Não conectado ao servidor. Conecte primeiro.', 'error');
                return;
            }
            
            log('Enviando string como token...', 'info');
            socket.emit('authenticate', 'token_teste_string');
        });
        
        // Autenticar (Objeto)
        authenticateObjectBtn.addEventListener('click', () => {
            if (!socket || !socket.connected) {
                log('Não conectado ao servidor. Conecte primeiro.', 'error');
                return;
            }
            
            log('Enviando objeto como token...', 'info');
            socket.emit('authenticate', { token: 'token_teste_objeto' });
        });
        
        // Autenticar (Inválido)
        authenticateInvalidBtn.addEventListener('click', () => {
            if (!socket || !socket.connected) {
                log('Não conectado ao servidor. Conecte primeiro.', 'error');
                return;
            }
            
            log('Enviando token inválido (null)...', 'info');
            socket.emit('authenticate', null);
        });
        
        // Desconectar
        disconnectBtn.addEventListener('click', () => {
            if (!socket || !socket.connected) {
                log('Não conectado ao servidor', 'info');
                return;
            }
            
            log('Fechando conexão...', 'info');
            socket.disconnect();
            socket = null;
        });
        
        // Mensagem inicial
        log('Página carregada. Clique em "Conectar" para iniciar o teste.', 'info');
    </script>
</body>
</html> 