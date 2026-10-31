const Joi = require('joi');

const updateProfileSchema = {
    body: Joi.object({
        fullName: Joi.string()
            .trim()
            .min(3)
            .max(100)
            .optional()
            .messages({
                'string.min': 'Full name must be at least 3 characters long'
            }),

        phone: Joi.string()
            .trim()
            .pattern(/^01[0125][0-9]{8}$/)
            .optional()
            .messages({
                'string.pattern.base': 'Please enter a valid Egyptian phone number (11 digits starting with 01)'
            }),

        jobTitle: Joi.string()
            .trim()
            .min(2)
            .max(100)
            .optional()
            .messages({
                'string.min': 'Job title must be at least 2 characters long'
            })
    })
    .min(1) // Ensure at least one field is provided for update
    .required()
    .messages({
        'object.min': 'Please provide at least one field to update (fullName, phone, or jobTitle)'
    })
};

module.exports = updateProfileSchema;