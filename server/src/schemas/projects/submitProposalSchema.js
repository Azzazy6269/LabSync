const Joi = require('joi');

const submitProposalBody = Joi.object({
    title: Joi.string()
        .trim()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.empty': 'Title is required',
            'string.min': 'Title must be at least 3 characters',
            'string.max': 'Title cannot exceed 255 characters',
            'any.required': 'Title is required'
        }),

    description: Joi.string()
        .trim()
        .min(10)
        .required()
        .messages({
            'string.empty': 'Description is required',
            'string.min': 'Description must be at least 10 characters',
            'any.required': 'Description is required'
        }),

    field: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Scientific field is required',
            'any.required': 'Scientific field is required'
        })
});

const submitProposalSchema = {
    body: submitProposalBody
};

module.exports = submitProposalSchema;

