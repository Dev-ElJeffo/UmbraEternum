"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeIO = initializeIO;
exports.getIO = getIO;
exports.getAuthenticatedSockets = getAuthenticatedSockets;
exports.setAuthenticatedSockets = setAuthenticatedSockets;
exports.getOnlinePlayers = getOnlinePlayers;
exports.setOnlinePlayers = setOnlinePlayers;
exports.broadcastPlayerCount = broadcastPlayerCount;
const socket_io_1 = require("socket.io");
let io;
let authenticatedSockets = new Map();
let onlinePlayers = 0;
function initializeIO(server) {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error('Socket.IO não foi inicializado');
    }
    return io;
}
function getAuthenticatedSockets() {
    return authenticatedSockets;
}
function setAuthenticatedSockets(sockets) {
    authenticatedSockets = sockets;
}
function getOnlinePlayers() {
    return onlinePlayers;
}
function setOnlinePlayers(count) {
    onlinePlayers = count;
}
function broadcastPlayerCount() {
    if (io) {
        io.emit('players_count', onlinePlayers);
    }
}
