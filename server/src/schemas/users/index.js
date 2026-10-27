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

module.exports = {
    signUpSchema,
    signInSchema,
    resendOtpSchema,
    verifyOtpSchema
};