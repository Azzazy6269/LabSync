const submitProposalSchema = require('./submitProposalSchema');
const getAllProjectsSchema = require('./getAllProjectsSchema');
const getProjectByIdSchema = require('./getProjectByIdSchema');
const adminAssignSupervisorSchema = require('./adminAssignSupervisorSchema');
const supervisorAcknowledgeSchema = require('./supervisorAcknowledgeSchema');
const submitFinalPaperSchema = require('./submitFinalPaperSchema');
const finalApprovalSchema = require('./finalApprovalSchema');
const adminRejectSchema = require('./adminRejectSchema');
const requestChangesSchema = require('./requestChangesSchema');

module.exports = {
    submitProposalSchema,
    getAllProjectsSchema,
    getProjectByIdSchema,
    adminAssignSupervisorSchema,
    supervisorAcknowledgeSchema,
    submitFinalPaperSchema,
    finalApprovalSchema,
    adminRejectSchema,
    requestChangesSchema
};

