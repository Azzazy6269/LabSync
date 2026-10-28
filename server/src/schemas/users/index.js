/*module.exports = {
    signUpSchema: require('./signUpSchema'),
    signInSchema: require('./signInSchema'),
    getAllUsersSchema: require('./getAllUsersSchema'),
    updateUserSchema: require('./updateUserSchema')
}*/

const signUpSchema = require('./signUpSchema'); 
const signInSchema = require('./signInSchema');
const resendOtpSchema = require('./resendOtpSchema');
const verifyOtpSchema = require('./verifyOtpSchema');
const getAllUsersSchema = require('./getAllUsersSchema');
const getUserByIdSchema = require('./getUserByIdSchema');
const updateUserByIdSchema = require('./updateUserByIdSchema');
const deleteUserByIdSchema = require('./deleteUserByIdSchema');
const searchUsersSchema = require('./searchUsersSchema');
const changePasswordSchema = require('./changePasswordSchema');
const forgotPasswordSchema = require('./forgotPasswordSchema');
const resetPasswordSchema = require('./resetPasswordSchema');
const refreshTokenSchema = require('./refreshTokenSchema');

module.exports = {
    signUpSchema,
    signInSchema,
    resendOtpSchema,
    verifyOtpSchema,
    getAllUsersSchema,
    getUserByIdSchema,
    updateUserByIdSchema,
    deleteUserByIdSchema,
    searchUsersSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema
};