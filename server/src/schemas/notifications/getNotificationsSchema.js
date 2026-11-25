const Joi = require('joi');

const getNotificationsQuery = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .optional()
        .messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be at least 1'
        }),

    limit: Joi.number()
        .integer()
        .min(1)
        .max(50)
        .default(15)
        .optional()
        .messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 50'
        }),

    unreadOnly: Joi.boolean()
        .optional()
        .messages({
            'boolean.base': 'unreadOnly must be a boolean'
        })
});

const getNotificationsSchema = {
    query: getNotificationsQuery
};

module.exports = getNotificationsSchema;
