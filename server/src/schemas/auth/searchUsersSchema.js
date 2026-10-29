const Joi = require('joi');

const searchUsersQuery = Joi.object({
    searchTerm: Joi.string()
        .trim()
        .min(1)
        .required()
        .messages({
            'string.empty': 'Search term query parameter is required',
            'any.required': 'Search term query parameter is required'
        }),

    page: Joi.number()
        .integer()
        .min(1)
        .optional()
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .optional()
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        })
});

const searchUsersSchema = {
    query: searchUsersQuery
};

module.exports = searchUsersSchema;