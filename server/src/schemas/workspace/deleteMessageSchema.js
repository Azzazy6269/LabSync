const Joi = require('joi');

const deleteMessageSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'any.required': 'Project ID is required'
        }),
        messageId: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid message ID format (UUID required)',
            'any.required': 'Message ID is required'
        })
    })
};

module.exports = deleteMessageSchema;