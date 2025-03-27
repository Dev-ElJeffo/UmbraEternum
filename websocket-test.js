/**
 * Script de teste para conexões WebSocket com o servidor UmbraEternum
 */

const { io } = require('socket.io-client');
const axios = require('axios');

// Configurações
const API_URL = 'http://localhost:34567/api';
const SOCKET_URL = 'ws://localhost:34567';
const TEST_USER = {
  username: 'websocket_tester',
  email: 'websocket_tester@test.com',
  password: 'Test123!'
};

// Auxiliar para fazer log com timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Função para registrar ou fazer login do usuário de teste
async function getAuthToken() {
  try {
    // Primeiro tentar login
    log('Tentando fazer login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username: TEST_USER.username,
        password: TEST_USER.password
      });
      
      log('Login bem-sucedido!');
      return loginResponse.data.accessToken;
    } catch (loginError) {
      log('Login falhou, tentando registrar novo usuário...');
      
      const registerResponse = await axios.post(`${API_URL}/auth/register`, TEST_USER);
      
      log('Registro bem-sucedido!');
      return registerResponse.data.accessToken;
    }
  } catch (error) {
    if (error.response) {
      console.error('Erro na resposta da API:', error.response.data);
    } else {
      console.error('Erro ao obter token de autenticação:', error.message);
    }
    throw error;
  }
}

// Testar com token inválido
async function testInvalidToken() {
  log('===== INICIANDO TESTE COM TOKEN INVÁLIDO =====');
  
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: false
  });
  
  // Eventos do Socket
  socket.on('connect', () => {
    log(`Conectado ao servidor para teste de token inválido! ID do socket: ${socket.id}`);
    
    // Enviar token inválido
    log('Enviando token inválido...');
    socket.emit('authenticate', { token: 'token_invalido_para_teste' });
    log('Evento authenticate com token inválido enviado');
    
    // Fechar após 5 segundos
    setTimeout(() => {
      log('Fechando conexão do teste inválido...');
      socket.disconnect();
      log('Teste de token inválido concluído!');
      
      // Iniciar teste normal
      testWebSocket();
    }, 5000);
  });
  
  socket.on('auth_error', (data) => {
    log(`Erro de autenticação recebido (esperado): ${JSON.stringify(data)}`);
  });
  
  socket.on('system_message', (message) => {
    log(`Mensagem do sistema: ${JSON.stringify(message)}`);
  });
  
  socket.on('error', (error) => {
    log(`Erro no socket: ${error}`);
  });
  
  socket.on('disconnect', (reason) => {
    log(`Desconectado do teste de token inválido: ${reason}`);
  });
}

// Conectar ao WebSocket e testar funcionalidades
async function testWebSocket() {
  try {
    // Obter token para autenticação
    const token = await getAuthToken();
    log(`Token obtido: ${token.substring(0, 15)}...`);
    
    // Conectar ao servidor WebSocket
    log('Conectando ao servidor WebSocket...');
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true
    });
    
    // Eventos do Socket
    socket.on('connect', () => {
      log(`Conectado ao servidor! ID do socket: ${socket.id}`);
      
      // Enviar evento de autenticação
      log('Enviando token para autenticação...');
      socket.emit('authenticate', { token });
      log('Evento authenticate enviado');
      
      // Enviar mensagem de chat após 2 segundos
      setTimeout(() => {
        log('Enviando mensagem de chat...');
        socket.emit('chat_message', {
          message: 'Olá de WebSocket Test!',
          timestamp: new Date().toISOString()
        });
      }, 2000);
      
      // Fechar conexão após 10 segundos
      setTimeout(() => {
        log('Fechando conexão...');
        socket.disconnect();
        log('Teste concluído com sucesso!');
        process.exit(0);
      }, 10000);
    });
    
    socket.on('connect_error', (error) => {
      log(`Erro de conexão: ${error.message}`);
    });
    
    socket.on('disconnect', (reason) => {
      log(`Desconectado: ${reason}`);
    });
    
    socket.on('authenticated', (data) => {
      log(`Autenticado com sucesso (evento 'authenticated')! Dados: ${JSON.stringify(data)}`);
    });
    
    socket.on('auth_success', (data) => {
      log(`Autenticado com sucesso (evento 'auth_success')! Dados: ${JSON.stringify(data)}`);
    });
    
    socket.on('auth_error', (data) => {
      log(`Erro de autenticação: ${JSON.stringify(data)}`);
    });
    
    socket.on('system_message', (message) => {
      log(`Mensagem do sistema: ${JSON.stringify(message)}`);
    });
    
    socket.on('players_count', (count) => {
      log(`Número de jogadores online: ${count}`);
    });
    
    socket.on('ping', () => {
      log('Ping recebido do servidor');
      socket.emit('pong', { timestamp: Date.now() });
      log('Pong enviado');
    });
    
    // Outras mensagens
    socket.onAny((event, ...args) => {
      if (!['connect', 'disconnect', 'authenticated', 'system_message', 'players_count', 'ping'].includes(event)) {
        log(`Evento recebido: ${event}, Dados: ${JSON.stringify(args)}`);
      }
    });
    
  } catch (error) {
    console.error('Erro no teste WebSocket:', error.message);
    process.exit(1);
  }
}

// Iniciar o teste
log('Iniciando teste de WebSocket...');
testInvalidToken().catch(error => {
  console.error('Erro fatal no teste de token inválido:', error);
  // Continuar com o teste normal mesmo se o teste inválido falhar
  testWebSocket().catch(error => {
    console.error('Erro fatal no teste principal:', error);
    process.exit(1);
  });
}); 