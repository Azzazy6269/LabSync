const Joi = require('joi');

const adminRejectParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'string.empty': 'Project ID is required',
            'any.required': 'Project ID is required'
        })
});

const adminRejectBody = Joi.object({
    rejectionReason: Joi.string()
        .trim()
        .min(3)
        .required()
        .messages({
            'string.empty': 'Rejection reason is required',
            'string.min': 'Rejection reason must be at least 3 characters',
            'any.required': 'Rejection reason is required'
        })
}).required();

const adminRejectSchema = {
    params: adminRejectParams,
    body: adminRejectBody
};

module.exports = adminRejectSchema;

