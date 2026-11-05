const Joi = require('joi');

const getAllProjectsQuery = Joi.object({
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

    status: Joi.string()
        .valid(
            'PENDING_SUPERVISOR_ACKNOWLEDGEMENT',
            'PENDING_ADMIN_APPROVAL',
            'IN_PROGRESS',
            'PENDING_FINAL_APPROVAL',
            'PUBLISHED',
            'REJECTED'
        )
        .optional()
        .messages({
            'any.only': 'Invalid project status filter'
        }),

    search: Joi.string()
        .trim()
        .optional(),

    field: Joi.string()
        .trim()
        .optional()
});

const getAllProjectsSchema = {
    query: getAllProjectsQuery
};

module.exports = getAllProjectsSchema;

