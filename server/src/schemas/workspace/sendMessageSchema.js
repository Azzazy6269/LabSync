const Joi = require('joi');

const sendMessageSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'any.required': 'Project ID is required'
        })
    }),
    body: Joi.object({
        content: Joi.string().trim().allow('').optional(),
        title: Joi.string().trim().max(255).optional()
    }).unknown()
};


module.exports = sendMessageSchema;