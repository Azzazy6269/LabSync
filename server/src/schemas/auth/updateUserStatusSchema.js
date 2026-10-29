const Joi = require('joi');

const updateUserStatusSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required()
    }),
    body: Joi.object({
        status: Joi.string()
            .valid('APPROVED', 'REJECTED', 'SUSPENDED', 'PENDING_ADMIN_APPROVAL')
            .required()
    }).required()
};

module.exports = updateUserStatusSchema;