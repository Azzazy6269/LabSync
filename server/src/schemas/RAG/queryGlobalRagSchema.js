const Joi = require('joi');

const queryGlobalRagSchema = {
  body: Joi.object({
    query: Joi.string().trim().min(3).max(1000).required()
  })
};

module.exports = queryGlobalRagSchema;