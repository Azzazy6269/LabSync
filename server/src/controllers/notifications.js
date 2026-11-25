const notificationsService = require('../services/notifications');

const getNotifications = async (req, res, next) => {
    try {
        const result = await notificationsService.getUserNotifications(req.user.id, req.query);
        res.status(200).json({
            success: true,
            unreadCount: result.unreadCount,
            pagination: result.pagination,
            data: result.data
        });
    } catch (error) {
        next(error);
    }
};

const markAllAsRead = async (req, res, next) => {
    try {
        const result = await notificationsService.markAllAsRead(req.user.id);
        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            updatedCount: result.updatedCount
        });
    } catch (error) {
        next(error);
    }
};

const markAsRead = async (req, res, next) => {
    try {
        const updatedNotification = await notificationsService.markOneAsRead(req.params.id, req.user.id);
        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            data: updatedNotification
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotifications,
    markAllAsRead,
    markAsRead
};
