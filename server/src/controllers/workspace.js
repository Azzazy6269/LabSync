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
        res.status(200).json({
            success: true,
            message: response.message,
            data: { id: response.id }
        });
    } catch (error) {
        next(error);
    }
};


module.exports = {
    getWorkspaceOverview,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage
};
