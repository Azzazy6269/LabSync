const Joi = require('joi');

const submitFinalPaperParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'string.empty': 'Project ID is required',
            'any.required': 'Project ID is required'
        })
});

const submitFinalPaperBody = Joi.object({
    title: Joi.string()
        .trim()
        .max(255)
        .optional()
});

const submitFinalPaperSchema = {
    params: submitFinalPaperParams,
    body: submitFinalPaperBody
};

module.exports = submitFinalPaperSchema;

