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
const changePasswordSchema = require('./changePasswordSchema');
const forgotPasswordSchema = require('./forgotPasswordSchema');
const resetPasswordSchema = require('./resetPasswordSchema');
const refreshTokenSchema = require('./refreshTokenSchema');
const updateProfileSchema = require('./updateProfileSchema');


module.exports = {
    signUpSchema,
    signInSchema,
    resendOtpSchema,
    verifyOtpSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
    updateProfileSchema
};