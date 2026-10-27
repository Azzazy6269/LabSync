const express = require("express");
const validate = require("../middlewares/validate");
const schemas = require("../schemas/users");
const usersController = require('../controllers/users');


const router = express.Router();

// Auth routes
router.post('/signup', validate(schemas.signUpSchema), usersController.signUp);
router.post('/verify-otp', validate(schemas.verifyOtpSchema), usersController.verifyOtp);
router.post('/resend-otp', validate(schemas.resendOtpSchema), usersController.resendOtp);
router.post('/signIn', validate(schemas.signInSchema), usersController.signIn);

router.get('/search', validate(schemas.searchUsersSchema), usersController.searchUsers);
router.get('/', validate(schemas.getAllUsersSchema), usersController.getAllUsers);


router.get('/:id', validate(schemas.getUserByIdSchema), usersController.getUserById);
router.patch('/:id', validate(schemas.updateUserByIdSchema) , usersController.updateUserById);
router.delete('/:id', validate(schemas.deleteUserByIdSchema), usersController.deleteUserById);

module.exports = router;