const express = require("express");
const validate = require("../middlewares/validate");
const schemas = require("../schemas/users");
const usersController = require('../controllers/users');
const {authenticate} = require('../middlewares/authenticate');
const {restrictTo} = require('../middlewares/restrictTo');

const router = express.Router();

// Auth routes
router.post('/signup', validate(schemas.signUpSchema), usersController.signUp);
router.post('/verify-otp', validate(schemas.verifyOtpSchema), usersController.verifyOtp);
router.post('/resend-otp', validate(schemas.resendOtpSchema), usersController.resendOtp);
router.post('/signIn', validate(schemas.signInSchema), usersController.signIn);
router.post('/forgot-password', validate(schemas.forgotPasswordSchema), usersController.forgotPassword);
router.post('/reset-password', validate(schemas.resetPasswordSchema), usersController.resetPassword);
router.patch('/change-password', authenticate, validate(schemas.changePasswordSchema), usersController.changePassword);
router.post('/refresh-token', validate(schemas.refreshTokenSchema), usersController.refreshToken);

// CRUD
router.get('/search', authenticate, restrictTo("ADMIN","SUPERVISOR","RESEARCHER"), validate(schemas.searchUsersSchema), usersController.searchUsers);
router.get('/', authenticate, restrictTo("ADMIN"), validate(schemas.getAllUsersSchema), usersController.getAllUsers);
router.get('/me',authenticate, usersController.getProfileData);
router.patch('/me',authenticate, validate(schemas.updateProfileSchema), usersController.editProfileData);
router.get('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.getUserByIdSchema), usersController.getUserById);
router.patch('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.updateUserByIdSchema) , usersController.updateUserById);
router.delete('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.deleteUserByIdSchema), usersController.deleteUserById);
router.patch('/:id/status', authenticate, restrictTo('ADMIN'), validate(schemas.updateUserStatusSchema), usersController.updateUserStatus
);

module.exports = router;