const Joi = require('joi');

const resetPasswordSchema = {
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
            }),

        otp: Joi.string()
            .length(6)
            .pattern(/^[0-9]+$/)
            .required()
            .messages({
                'string.length': 'OTP must be 6 digits',
                'string.pattern.base': 'OTP must contain numbers only',
                'string.empty': 'OTP is required',
                'any.required': 'OTP is required'
            }),

        newPassword: Joi.string()
            .min(8)
            .max(100)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.empty': 'New password is required',
                'any.required': 'New password is required'
            }),

        repeatNewPassword: Joi.string()
            .valid(Joi.ref('newPassword'))
            .required()
            .messages({
                'any.only': 'Passwords do not match',
                'string.empty': 'Please confirm your new password',
                'any.required': 'Please confirm your new password'
            })
    }).required()
};

module.exports = resetPasswordSchema;