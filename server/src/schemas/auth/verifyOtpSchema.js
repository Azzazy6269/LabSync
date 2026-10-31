const Joi = require('joi');

const verifyOtpBody = Joi.object({
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
        .trim()
        .length(6)
        .pattern(/^[0-9]{6}$/)
        .required()
        .messages({
            'string.length': 'OTP must be exactly 6 digits',
            'string.pattern.base': 'OTP must contain numbers only',
            'string.empty': 'OTP is required',
            'any.required': 'OTP is required'
        })
}).required();

const verifyOtpSchema = {
    body: verifyOtpBody
};

module.exports = verifyOtpSchema;