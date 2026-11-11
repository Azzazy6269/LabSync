const express = require("express");
const validate = require("../middlewares/validate");
const RAGController = require('../controllers/rag');
const {authenticate} = require('../middlewares/authenticate');
const {restrictTo} = require('../middlewares/restrictTo');
const schemas = require('../schemas/RAG');


const router = express.Router();

// CRUD
router.post('/search', authenticate, validate(schemas.queryGlobalRagSchema), RAGController.queryGlobalLabRAG);


module.exports = router;