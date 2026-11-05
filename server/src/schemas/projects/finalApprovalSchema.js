const Joi = require('joi');

const finalApprovalParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'string.empty': 'Project ID is required',
            'any.required': 'Project ID is required'
        })
});

const finalApprovalBody = Joi.object({
    decision: Joi.string()
        .valid('APPROVE')
        .required()
        .messages({
            'any.only': 'Decision must be APPROVE',
            'string.empty': 'Decision is required',
            'any.required': 'Decision is required'
        }),

    reviewNotes: Joi.string()
        .trim()
        .optional()
}).required();

const finalApprovalSchema = {
    params: finalApprovalParams,
    body: finalApprovalBody
};

module.exports = finalApprovalSchema;

