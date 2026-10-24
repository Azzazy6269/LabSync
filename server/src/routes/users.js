const express = require("express")
const usersController = require('../controllers/users');


const router = express.Router();

router.post('/signup',usersController.signUp);

module.exports = router;