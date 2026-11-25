const express = require('express');
const { authenticate } = require('../middlewares/authenticate');
const validate = require('../middlewares/validate');
const schemas = require('../schemas/notifications');
const notificationsController = require('../controllers/notifications');

const router = express.Router();

// Protect all routes globally
router.use(authenticate);

// GET / - Get current user's notifications
router.get('/', validate(schemas.getNotificationsSchema), notificationsController.getNotifications);

// PATCH /read-all - Mark all notifications as read (Defined BEFORE /:id/read)
router.patch('/read-all', notificationsController.markAllAsRead);

// PATCH /:id/read - Mark single notification as read
router.patch('/:id/read', validate(schemas.markAsReadSchema), notificationsController.markAsRead);

module.exports = router;
