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


module.exports = {
    getWorkspaceOverview
};
