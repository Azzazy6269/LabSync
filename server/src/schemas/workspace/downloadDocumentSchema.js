const Joi = require('joi');

const downloadDocumentSchema = {
    params: Joi.object({
        id: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid project ID format (UUID required)',
            'any.required': 'Project ID is required'
        }),
        documentId: Joi.string().uuid().required().messages({
            'string.guid': 'Invalid document ID format (UUID required)',
            'any.required': 'Document ID is required'
        })
    })
};


module.exports = downloadDocumentSchema;