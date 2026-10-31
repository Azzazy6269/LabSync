const Joi = require('joi');

const getUserByIdParams = Joi.object({
    id: Joi.string()
        .guid({ version: 'uuidv4' })
        .required()
        .messages({
            'string.guid': 'Invalid user ID format (UUID required)',
            'string.empty': 'User ID is required',
            'any.required': 'User ID is required'
        })
});

const getUserByIdSchema = {
    params: getUserByIdParams
};

module.exports = getUserByIdSchema;