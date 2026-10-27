const Joi = require('joi');

const signUpBody = Joi.object({
    fullName: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Full name is required',
            'string.min': 'Full name must be at least 3 characters long',
            'any.required': 'Full name is required'
        }),

    email: Joi.string()
        .email()
        .trim()
        .lowercase()
        .required()
        .messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),

    password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .messages({
            'string.min': 'Password must be at least 8 characters long',
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),

    phone: Joi.string()
        .trim()
        .pattern(/^01[0125][0-9]{8}$/)
        .required()
        .messages({
            'string.pattern.base': 'Please enter a valid Egyptian phone number (11 digits starting with 01)',
            'string.empty': 'Phone number is required',
            'any.required': 'Phone number is required'
        }),

    nationalId: Joi.string()
        .trim()
        .length(14)
        .pattern(/^[0-9]+$/)
        .required()
        .messages({
            'string.length': 'National ID must be exactly 14 digits',
            'string.pattern.base': 'National ID must contain numbers only',
            'string.empty': 'National ID is required',
            'any.required': 'National ID is required'
        }),

    jobTitle: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Job title is required',
            'any.required': 'Job title is required'
        }),

    role: Joi.string()
        .valid('RESEARCHER', 'ADMIN', 'SUPERVISOR')
        .optional()
        .messages({
            'any.only': 'Invalid role specified'
        })
}).required();

const signUpSchema = {
    body: signUpBody,
};

module.exports = signUpSchema;