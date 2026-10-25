const express = require("express")
const usersController = require('../controllers/users');


const router = express.Router();

// Auth routes
router.post('/signup', usersController.signUp);
router.post('/signIn', usersController.signIn);

router.get('/search', usersController.searchUsers);
router.get('/', usersController.getAllUsers);


router.get('/:id', usersController.getUserById);
router.put('/:id', usersController.updateUserById);
router.delete('/:id', usersController.deleteUserById);

module.exports = router;