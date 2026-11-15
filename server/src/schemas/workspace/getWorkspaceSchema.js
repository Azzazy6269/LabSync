const Joi = require('joi');

const getWorkspaceSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'any.required': 'Project ID is required'
        })
    })
};

module.exports = getWorkspaceSchema;