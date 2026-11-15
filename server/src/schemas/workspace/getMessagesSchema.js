const Joi = require('joi');

const getMessagesSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'any.required': 'Project ID is required'
        })
    }),
    query: Joi.object({
        limit: Joi.number().integer().min(1).max(100).optional().messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
        before: Joi.string().uuid().optional().messages({
            'string.guid': 'Invalid before cursor format (UUID required)'
        }),
        after: Joi.string().uuid().optional().messages({
            'string.guid': 'Invalid after cursor format (UUID required)'
        })
    })
};

module.exports = getMessagesSchema;