const prisma = require('../../config/prisma');
const APIError = require('../../utils/APIError');

/**
 * Creates a notification safely without throwing unhandled exceptions to callers.
 * Supports optional Prisma client/transaction.
 */
const createNotification = async ({ userId, type, title, message, link }, client = null) => {
    try {
        if (!userId) {
            console.warn('⚠️ Cannot create notification: userId is required');
            return null;
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link: link || null
            }
        });

        return notification;
    } catch (error) {
        console.error('⚠️ Failed to create notification:', error);
        return null;
    }
};

/**
 * Retrieves paginated notifications for a user, along with total unread count.
 */
const getUserNotifications = async (userId, query = {}) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 15));
    const unreadOnly = query.unreadOnly === true || query.unreadOnly === 'true';

    const where = {
        userId,
        ...(unreadOnly ? { isRead: false } : {})
    };

    const [unreadCount, total, notifications] = await Promise.all([
        prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        }),
        prisma.notification.count({ where }),
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit
        })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
        unreadCount,
        pagination: {
            page,
            limit,
            total,
            totalPages
        },
        data: notifications
    };
};

/**
 * Marks all unread notifications for a user as read.
 */
const markAllAsRead = async (userId) => {
    const result = await prisma.notification.updateMany({
        where: {
            userId,
            isRead: false
        },
        data: {
            isRead: true
        }
    });

    return {
        updatedCount: result.count
    };
};

/**
 * Marks a single notification as read with IDOR ownership validation.
 */
const markOneAsRead = async (id, userId) => {
    const notification = await prisma.notification.findUnique({
        where: { id }
    });

    if (!notification) {
        throw new APIError('Notification not found', 404);
    }

    if (notification.userId !== userId) {
        throw new APIError('You do not have permission to modify this notification', 403);
    }

    const updatedNotification = await prisma.notification.update({
        where: { id },
        data: { isRead: true }
    });

    return updatedNotification;
};

module.exports = {
    createNotification,
    getUserNotifications,
    markAllAsRead,
    markOneAsRead
};
