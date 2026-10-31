const Joi = require('joi');

const changePasswordSchema = {
    body: Joi.object({
        currentPassword: Joi.string()
            .required()
            .messages({
                'string.empty': 'Current password is required',
                'any.required': 'Current password is required'
            }),

        newPassword: Joi.string()
            .min(8)
            .max(100)
            .invalid(Joi.ref('currentPassword'))
            .required()
            .messages({
                'string.min': 'New password must be at least 8 characters long',
                'any.invalid': 'New password must be different from current password',
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

module.exports = changePasswordSchema;