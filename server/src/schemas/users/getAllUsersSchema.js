const Joi = require('joi');

const getAllUsersQuery = Joi.object({
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
        }),
    role: Joi.string()
        .valid('ADMIN', 'SUPERVISOR', 'RESEARCHER', 'USER')
        .optional(),
    status: Joi.string()
        .valid('PENDING_ADMIN_APPROVAL', 'APPROVED', 'REJECTED','SUSPENDED')
        .optional(),
    searchTerm: Joi.string()
        .trim()
        .optional()
});

const getAllUsersSchema = {
    query: getAllUsersQuery
};

module.exports = getAllUsersSchema;