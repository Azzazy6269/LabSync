const express = require("express")
const usersController = require('../controllers/users');


const router = express.Router();

router.post('/signup',usersController.signUp);
router.post('/signIn',usersController.signIn);

module.exports = router;