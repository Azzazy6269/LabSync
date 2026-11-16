const express = require('express');
const validate = require('../middlewares/validate');
const schemas = require('../schemas/workspace');
const workspaceController = require('../controllers/workspace');
const { authenticate } = require('../middlewares/authenticate');
const { uploadWorkspaceAttachment } = require('../middlewares/upload');

const router = express.Router({ mergeParams: true });

// All workspace operations require authenticated user
router.use(authenticate);


// 1. Workspace Overview
router.get(
    '/',
    validate(schemas.getWorkspaceSchema),
    workspaceController.getWorkspaceOverview
);

// 2. Conversation Messages (Cursor-based pagination)
router.get(
    '/messages',
    validate(schemas.getMessagesSchema),
    workspaceController.getMessages
);

// 3. Send Message (Text and/or Draft Paper Attachment)
router.post(
    '/messages',
    uploadWorkspaceAttachment,
    validate(schemas.sendMessageSchema),
    workspaceController.sendMessage
);

// 4. Edit Message
router.patch(
    '/messages/:messageId',
    validate(schemas.editMessageSchema),
    workspaceController.editMessage
);

// 5. Delete Message
router.delete(
    '/messages/:messageId',
    validate(schemas.deleteMessageSchema),
    workspaceController.deleteMessage
);

// 6. Shared Draft Documents
router.get(
    '/documents/drafts',
    validate(schemas.getWorkspaceSchema),
    workspaceController.getSharedDrafts
);

// 7. Latest Final Paper
router.get(
    '/documents/final',
    validate(schemas.getWorkspaceSchema),
    workspaceController.getLatestFinalPaper
);

// 8. Secure Document Download
router.get(
    '/documents/:documentId/download',
    validate(schemas.downloadDocumentSchema),
    workspaceController.downloadDocument
);

module.exports = router;
