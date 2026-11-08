const express = require("express");
const validate = require("../middlewares/validate");
const schemas = require("../schemas/users");
const RAGController = require('../controllers/rag');
const {authenticate} = require('../middlewares/authenticate');
const {restrictTo} = require('../middlewares/restrictTo');

const router = express.Router();

// CRUD
router.post('/', authenticate, RAGController.queryGlobalLabRAG);


module.exports = router;