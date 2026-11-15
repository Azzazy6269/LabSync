const express = require('express');
const validate = require('../middlewares/validate');
const schemas = require('../schemas/workspace');
const workspaceController = require('../controllers/workspace');
const { authenticate } = require('../middlewares/authenticate');
const { uploadWorkspaceAttachment } = require('../middlewares/upload');

const router = express.Router({ mergeParams: true });

// All workspace operations require authenticated user
router.use(authenticate);

module.exports = router;
