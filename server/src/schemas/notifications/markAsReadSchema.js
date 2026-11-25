const Joi = require('joi');

const markAsReadParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid notification ID format (UUID required)',
            'string.empty': 'Notification ID is required',
            'any.required': 'Notification ID is required'
        })
});

const markAsReadSchema = {
    params: markAsReadParams
};

module.exports = markAsReadSchema;
