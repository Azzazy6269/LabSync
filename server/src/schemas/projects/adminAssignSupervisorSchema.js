const Joi = require('joi');

const adminAssignSupervisorParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'string.empty': 'Project ID is required',
            'any.required': 'Project ID is required'
        })
});

const adminAssignSupervisorBody = Joi.object({
    supervisorId: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid supervisor ID format (UUID required)',
            'string.empty': 'Supervisor ID is required',
            'any.required': 'Supervisor ID is required'
        })
}).required();

const adminAssignSupervisorSchema = {
    params: adminAssignSupervisorParams,
    body: adminAssignSupervisorBody
};

module.exports = adminAssignSupervisorSchema;

