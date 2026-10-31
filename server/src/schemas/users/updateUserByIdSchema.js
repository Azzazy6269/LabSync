const Joi = require('joi');

const updateUserByIdParams = Joi.object({
    id: Joi.string()
        .guid({ version: 'uuidv4' })
        .required()
        .messages({
            'string.guid': 'Invalid user ID format (UUID required)',
            'string.empty': 'User ID is required',
            'any.required': 'User ID is required'
        })
});

const updateUserByIdBody = Joi.object({
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

    nationalId: Joi.string()
        .trim()
        .length(14)
        .pattern(/^[0-9]+$/)
        .optional()
        .messages({
            'string.length': 'National ID must be exactly 14 digits',
            'string.pattern.base': 'National ID must contain numbers only'
        }),

    jobTitle: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .optional(),

    role: Joi.string()
        .valid('RESEARCHER', 'ADMIN', 'SUPERVISOR')
        .optional()
        .messages({
            'any.only': 'Invalid role specified'
        })
})
    .min(1)
    .messages({
        'object.min': 'At least one field must be provided for update'
    });

const updateUserByIdSchema = {
    params: updateUserByIdParams,
    body: updateUserByIdBody
};

module.exports = updateUserByIdSchema;