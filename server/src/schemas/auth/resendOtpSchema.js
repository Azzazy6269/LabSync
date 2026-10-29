const Joi = require('joi');

const resendOtpBody = Joi.object({
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
}).required();

const resendOtpSchema = {
    body: resendOtpBody
};

module.exports = resendOtpSchema;