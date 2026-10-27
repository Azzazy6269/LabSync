const Joi = require('joi');

const deleteUserByIdParams = Joi.object({
    id: Joi.string()
        .guid({ version: 'uuidv4' })
        .required()
        .messages({
            'string.guid': 'Invalid user ID format (UUID required)',
            'string.empty': 'User ID is required',
            'any.required': 'User ID is required'
        })
});

const deleteUserByIdSchema = {
    params: deleteUserByIdParams
};

module.exports = deleteUserByIdSchema;