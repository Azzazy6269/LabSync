const SOCKET_EVENTS = require('../constants/socketEvents');
const { verifyWorkspaceAccess } = require('./workspace');

let ioInstance = null;

const setIO = (io) => {
    ioInstance = io;
};

const getIO = () => ioInstance;

const getProjectRoom = (projectId) => `project:${projectId}`;

const registerHandlers = (socket) => {
    socket.on(SOCKET_EVENTS.WORKSPACE_JOIN, async (projectId) => {
        try {
            await verifyWorkspaceAccess(projectId, socket.user, [
                'IN_PROGRESS',
                'PENDING_FINAL_APPROVAL',
                'PUBLISHED'
            ]);

            socket.join(getProjectRoom(projectId));
        } catch (error) {
            socket.emit(SOCKET_EVENTS.WORKSPACE_ERROR, { message: error.message });
        }
    });

    socket.on(SOCKET_EVENTS.WORKSPACE_LEAVE, (projectId) => {
        socket.leave(getProjectRoom(projectId));
    });

    socket.on(SOCKET_EVENTS.WORKSPACE_TYPING, ({ projectId, isTyping }) => {
        if (!projectId) return;

        socket.to(getProjectRoom(projectId)).emit(SOCKET_EVENTS.WORKSPACE_TYPING, {
            userId: socket.user.id,
            fullName: socket.user.fullName,
            isTyping
        });
    });
};

const emitToProject = (projectId, event, payload) => {
    if (!ioInstance) return;
    ioInstance.to(getProjectRoom(projectId)).emit(event, payload);
};

const emitNewMessage = (projectId, message) => {
    emitToProject(projectId, SOCKET_EVENTS.MESSAGE_NEW, message);
};

const emitUpdatedMessage = (projectId, message) => {
    emitToProject(projectId, SOCKET_EVENTS.MESSAGE_UPDATED, message);
};

const emitDeletedMessage = (projectId, messageId) => {
    emitToProject(projectId, SOCKET_EVENTS.MESSAGE_DELETED, { id: messageId });
};

module.exports = {
    setIO,
    getIO,
    registerHandlers,
    emitToProject,
    emitNewMessage,
    emitUpdatedMessage,
    emitDeletedMessage
};