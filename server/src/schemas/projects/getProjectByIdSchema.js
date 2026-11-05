const Joi = require('joi');

const getProjectByIdParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'string.empty': 'Project ID is required',
            'any.required': 'Project ID is required'
        })
});

const getProjectByIdSchema = {
    params: getProjectByIdParams
};

module.exports = getProjectByIdSchema;

