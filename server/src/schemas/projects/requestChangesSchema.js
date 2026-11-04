const Joi = require('joi');

const requestChangesParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'string.empty': 'Project ID is required',
            'any.required': 'Project ID is required'
        })
});

const requestChangesBody = Joi.object({
    feedback: Joi.string()
        .trim()
        .min(3)
        .required()
        .messages({
            'string.empty': 'Feedback is required',
            'string.min': 'Feedback must be at least 3 characters',
            'any.required': 'Feedback is required'
        })
}).required();

const requestChangesSchema = {
    params: requestChangesParams,
    body: requestChangesBody
};

module.exports = requestChangesSchema;

