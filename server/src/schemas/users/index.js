const getAllUsersSchema = require('./getAllUsersSchema');
const getUserByIdSchema = require('./getUserByIdSchema');
const updateUserByIdSchema = require('./updateUserByIdSchema');
const deleteUserByIdSchema = require('./deleteUserByIdSchema');
const searchUsersSchema = require('./searchUsersSchema');
const updateUserStatusSchema = require('./updateUserStatusSchema');


module.exports = {
    getAllUsersSchema,
    getUserByIdSchema,
    updateUserByIdSchema,
    deleteUserByIdSchema,
    searchUsersSchema,
    updateUserStatusSchema
};