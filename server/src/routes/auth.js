const express = require("express");
const validate = require("../middlewares/validate");
const schemas = require("../schemas/auth");
const authController = require('../controllers/auth');
const {authenticate} = require('../middlewares/authenticate');
const {restrictTo} = require('../middlewares/restrictTo');

const router = express.Router();

// Auth routes
router.post('/signup', validate(schemas.signUpSchema), authController.signUp);
router.post('/verify-otp', validate(schemas.verifyOtpSchema), authController.verifyOtp);
router.post('/resend-otp', validate(schemas.resendOtpSchema), authController.resendOtp);
router.post('/signIn', validate(schemas.signInSchema), authController.signIn);
router.post('/forgot-password', validate(schemas.forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(schemas.resetPasswordSchema), authController.resetPassword);
router.patch('/change-password', authenticate, validate(schemas.changePasswordSchema), authController.changePassword);
router.post('/refresh-token', validate(schemas.refreshTokenSchema), authController.refreshToken);
router.get('/me',authenticate, authController.getProfileData);
router.patch('/me',authenticate, validate(schemas.updateProfileSchema), authController.editProfileData);

// CRUD
router.get('/search', authenticate, restrictTo("ADMIN","SUPERVISOR","RESEARCHER"), validate(schemas.searchUsersSchema), authController.searchUsers);
router.get('/', authenticate, restrictTo("ADMIN"), validate(schemas.getAllUsersSchema), authController.getAllUsers);
router.get('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.getUserByIdSchema), authController.getUserById);
router.patch('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.updateUserByIdSchema) , authController.updateUserById);
router.delete('/:id', authenticate, restrictTo("ADMIN"), validate(schemas.deleteUserByIdSchema), authController.deleteUserById);
router.patch('/:id/status', authenticate, restrictTo('ADMIN'), validate(schemas.updateUserStatusSchema), authController.updateUserStatus
);

module.exports = router;