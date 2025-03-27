import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;
let authenticatedSockets = new Map();
let onlinePlayers = 0;

export function initializeIO(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.IO não foi inicializado');
  }
  return io;
}

export function getAuthenticatedSockets() {
  return authenticatedSockets;
}

export function setAuthenticatedSockets(sockets: Map<string, any>) {
  authenticatedSockets = sockets;
}

export function getOnlinePlayers() {
  return onlinePlayers;
}

export function setOnlinePlayers(count: number) {
  onlinePlayers = count;
}

export function broadcastPlayerCount() {
  if (io) {
    io.emit('players_count', onlinePlayers);
  }
} 