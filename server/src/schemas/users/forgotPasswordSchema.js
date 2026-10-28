const Joi = require('joi');

const forgotPasswordSchema = {
    body: Joi.object({
        email: Joi.string()
            .email()
            .trim()
            .lowercase()
            .required()
            .messages({
                'string.email': 'Please provide a valid email address',
                'string.empty': 'Email is required',
                'any.required': 'Email is required'
            })
    }).required()
};

module.exports = forgotPasswordSchema;