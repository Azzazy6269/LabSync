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

module.exports = {
    getWorkspaceOverview,
    getMessages
};
