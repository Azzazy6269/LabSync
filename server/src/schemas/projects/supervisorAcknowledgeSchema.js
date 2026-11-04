const Joi = require('joi');

const supervisorAcknowledgeParams = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'string.empty': 'Project ID is required',
            'any.required': 'Project ID is required'
        })
});

const supervisorAcknowledgeBody = Joi.object({
    action: Joi.string()
        .valid('ACCEPT', 'REJECT')
        .required()
        .messages({
            'any.only': 'Action must be either ACCEPT or REJECT',
            'string.empty': 'Action is required',
            'any.required': 'Action is required'
        })
}).required();

const supervisorAcknowledgeSchema = {
    params: supervisorAcknowledgeParams,
    body: supervisorAcknowledgeBody
};

module.exports = supervisorAcknowledgeSchema;

