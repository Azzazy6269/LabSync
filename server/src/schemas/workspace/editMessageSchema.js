const Joi = require('joi');

const editMessageSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'any.required': 'Project ID is required'
        }),
        messageId: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid message ID format (UUID required)',
            'any.required': 'Message ID is required'
        })
    }),
    body: Joi.object({
        content: Joi.string().trim().min(1).required().messages({
            'string.empty': 'Message content cannot be empty',
            'any.required': 'Message content is required'
        })
    }).required()
};

module.exports = editMessageSchema;