const SOCKET_EVENTS = Object.freeze({
    // (Client -> Server / Broadcast)
    WORKSPACE_JOIN: 'workspace:join',
    WORKSPACE_LEAVE: 'workspace:leave',
    WORKSPACE_TYPING: 'workspace:typing',
    WORKSPACE_ERROR: 'workspace:error',

    // (Server -> Room)
    MESSAGE_NEW: 'message:new',
    MESSAGE_UPDATED: 'message:updated',
    MESSAGE_DELETED: 'message:deleted'
});

module.exports = SOCKET_EVENTS;