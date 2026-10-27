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

module.exports = {
    signUpSchema,
    signInSchema,
    resendOtpSchema,
    verifyOtpSchema,
    getAllUsersSchema,
    getUserByIdSchema,
    updateUserByIdSchema,
    deleteUserByIdSchema,
    searchUsersSchema
};