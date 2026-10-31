const Joi = require('joi');

const refreshTokenSchema = {
    body: Joi.object({
        refreshToken: Joi.string()
            .required()
            .messages({
                'string.empty': 'Refresh token is required',
                'any.required': 'Refresh token is required'
            })
    }).required()
};

module.exports = refreshTokenSchema;