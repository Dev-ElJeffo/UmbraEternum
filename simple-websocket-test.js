/**
 * Script de teste simplificado para conexões WebSocket
 */

const { io } = require('socket.io-client');

// Configurações
const SOCKET_URL = 'ws://localhost:34567';

// Auxiliar para fazer log com timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Função principal de teste
function testWebSocket() {
  log('Conectando ao servidor WebSocket...');
  
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: true
  });
  
  // Eventos do Socket
  socket.on('connect', () => {
    log(`Conectado ao servidor! ID do socket: ${socket.id}`);
    
    // Enviar evento de autenticação com token string
    log('Enviando string como token...');
    socket.emit('authenticate', 'token_teste_string');
    
    // Depois de 2 segundos, tentar com objeto
    setTimeout(() => {
      log('Enviando objeto como token...');
      socket.emit('authenticate', { token: 'token_teste_objeto' });
    }, 2000);
    
    // Fechar conexão após 10 segundos
    setTimeout(() => {
      log('Fechando conexão...');
      socket.disconnect();
      log('Teste concluído!');
      process.exit(0);
    }, 10000);
  });
  
  socket.on('connect_error', (error) => {
    log(`Erro de conexão: ${error.message}`);
  });
  
  socket.on('disconnect', (reason) => {
    log(`Desconectado: ${reason}`);
  });
  
  socket.on('auth_success', (data) => {
    log(`Autenticação bem-sucedida: ${JSON.stringify(data)}`);
  });
  
  socket.on('auth_error', (data) => {
    log(`Erro de autenticação: ${JSON.stringify(data)}`);
  });
  
  socket.on('system_message', (data) => {
    log(`Mensagem do sistema: ${JSON.stringify(data)}`);
  });
  
  // Log de todos os eventos não tratados específicamente
  socket.onAny((event, ...args) => {
    if (!['connect', 'disconnect', 'auth_success', 'auth_error', 'system_message'].includes(event)) {
      log(`Evento recebido: ${event}, Dados: ${JSON.stringify(args)}`);
    }
  });
}

// Iniciar o teste
log('Iniciando teste simplificado de WebSocket...');
testWebSocket(); 