const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const { verifyWorkspaceAccess } = require('../src/services/workspace');

const initSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: { origin: process.env.CLIENT_URL, credentials: true }
    });

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

    io.on('connection', (socket) => {
        socket.on('workspace:join', async (projectId) => {
            try {
                await verifyWorkspaceAccess(projectId, socket.user, [
                    'IN_PROGRESS',
                    'PENDING_FINAL_APPROVAL',
                    'PUBLISHED'
                ]);

                socket.join(`project:${projectId}`);
            } catch (error) {
                socket.emit('workspace:error', { message: error.message });
            }
        });

        socket.on('workspace:leave', (projectId) => {
            socket.leave(`project:${projectId}`);
        });

        socket.on('workspace:typing', ({ projectId, isTyping }) => {
            socket.to(`project:${projectId}`).emit('workspace:typing', {
                userId: socket.user.id,
                fullName: socket.user.fullName,
                isTyping
            });
        });
    });

    return io;
};

module.exports = initSocket;