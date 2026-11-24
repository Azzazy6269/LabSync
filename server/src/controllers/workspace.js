const workspaceService = require('../services/workspace');

const getWorkspaceOverview = async (req, res, next) => {
    try {
        const data = await workspaceService.getWorkspaceOverview(req.params.id, req.user);
        res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
};

const getMessages = async (req, res, next) => {
    try {
        const result = await workspaceService.getMessages(req.params.id, req.user, req.query);
        res.status(200).json({
            success: true,
            count: result.pagination.count,
            pagination: result.pagination,
            data: result.messages
        });
    } catch (error) {
        next(error);
    }
};

const sendMessage = async (req, res, next) => {
    try {
        const file = req.files?.attachment?.[0] || req.files?.file?.[0] || req.files?.draftDoc?.[0] || req.file || null;
        const message = await workspaceService.sendMessage(req.params.id, req.user, req.body, file);
        
        const io = req.app.get('io');
        io.to(`project:${req.params.id}`).emit('message:new', message);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });
    } catch (error) {
        next(error);
    }
};

const editMessage = async (req, res, next) => {
    try {
        const message = await workspaceService.editMessage(req.params.id, req.params.messageId, req.user, req.body);
        
        const io = req.app.get('io');
        io.to(`project:${req.params.id}`).emit('message:updated', message);

        res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            data: message
        });
    } catch (error) {
        next(error);
    }
};

const deleteMessage = async (req, res, next) => {
    try {
        const response = await workspaceService.deleteMessage(req.params.id, req.params.messageId, req.user);
        
        const io = req.app.get('io');
        io.to(`project:${req.params.id}`).emit('message:deleted', { id: response.id });
        
        res.status(200).json({
            success: true,
            message: response.message,
            data: { id: response.id }
        });
    } catch (error) {
        next(error);
    }
};

const getSharedDrafts = async (req, res, next) => {
    try {
        const drafts = await workspaceService.getSharedDrafts(req.params.id, req.user);
        res.status(200).json({
            success: true,
            count: drafts.length,
            data: drafts
        });
    } catch (error) {
        next(error);
    }
};

const getLatestFinalPaper = async (req, res, next) => {
    try {
        const result = await workspaceService.getLatestFinalPaper(req.params.id, req.user);
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const downloadDocument = async (req, res, next) => {
    try {
        const { filePath, fileName } = await workspaceService.getDocumentForDownload(
            req.params.id,
            req.params.documentId,
            req.user
        );
        res.download(filePath, fileName);
    } catch (error) {
        next(error);
    }
};



module.exports = {
    getWorkspaceOverview,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    getSharedDrafts,
    getLatestFinalPaper,
    downloadDocument
};
