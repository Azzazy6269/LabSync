const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const socketService = require('../src/services/socket');

const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: process.env.CLIENT_URL, credentials: true }
    });

    // singlton
    socketService.setIO(io);

    // authentication middleware
    io.use(async (socket, next) => {
        try {
            //const authHeader = socket.handshake.headers?.authorization;
            //const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
        
            //const token = socket.handshake.auth?.token || bearerToken;
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Authentication required'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) return next(new Error('User not found'));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error('Invalid token'));
        }
    });

    // delegates socketService to handle events
    io.on('connection', (socket) => {
        socketService.registerHandlers(socket);
    });

    return io;
};

module.exports = initSocket;
