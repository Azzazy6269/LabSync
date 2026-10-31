const express = require("express");
const validate = require("../middlewares/validate");
const schemas = require("../schemas/users");
const UsersController = require('../controllers/users');
const {authenticate} = require('../middlewares/authenticate');
const {restrictTo} = require('../middlewares/restrictTo');

const router = express.Router();

// CRUD
router.get('/search', authenticate, restrictTo("ADMIN","SUPERVISOR","RESEARCHER"), validate(schemas.searchUsersSchema), UsersController.searchUsers);
router.get('/', authenticate, restrictTo("ADMIN"), validate(schemas.getAllUsersSchema), UsersController.getAllUsers);
router.get('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.getUserByIdSchema), UsersController.getUserById);
router.patch('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.updateUserByIdSchema) , UsersController.updateUserById);
router.delete('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.deleteUserByIdSchema), UsersController.deleteUserById);
router.patch('/:id/status', authenticate, restrictTo('ADMIN'), validate(schemas.updateUserStatusSchema), UsersController.updateUserStatus);


module.exports = router;