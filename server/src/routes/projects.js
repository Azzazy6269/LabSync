const express = require('express');
const validate = require('../middlewares/validate');
const schemas = require('../schemas/projects');
const projectsController = require('../controllers/projects');
const { authenticate } = require('../middlewares/authenticate');
const { restrictTo } = require('../middlewares/restrictTo');
const { uploadProposalDocs, uploadFinalPaperDoc } = require('../middlewares/upload');

const router = express.Router();

// 1. Submit New Project Proposal
router.post(
    '/',
    authenticate,
    restrictTo('RESEARCHER'),
    uploadProposalDocs,
    validate(schemas.submitProposalSchema),
    projectsController.submitProposal
);

// 2. Get All Projects (Filtered & Paginated)
router.get(
    '/',
    authenticate,
    restrictTo('ADMIN', 'SUPERVISOR', 'RESEARCHER', 'MEMBER'),
    validate(schemas.getAllProjectsSchema),
    projectsController.getAllProjects
);

// 3. Get Project Details By ID
router.get(
    '/:id',
    authenticate,
    validate(schemas.getProjectByIdSchema),
    projectsController.getProjectById
);

// 4. Admin Verification & Supervisor Assignment
router.patch(
    '/:id/admin-assign',
    authenticate,
    restrictTo('ADMIN'),
    validate(schemas.adminAssignSupervisorSchema),
    projectsController.adminAssignSupervisor
);

// 5. Supervisor Digital Acknowledgement
router.patch(
    '/:id/supervisor-acknowledge',
    authenticate,
    restrictTo('SUPERVISOR'),
    validate(schemas.supervisorAcknowledgeSchema),
    projectsController.supervisorAcknowledge
);

// 6. Submit Final Paper for Approval
router.post(
    '/:id/submit-final',
    authenticate,
    restrictTo('RESEARCHER'),
    uploadFinalPaperDoc,
    validate(schemas.submitFinalPaperSchema),
    projectsController.submitFinalPaper
);

// 7. Supervisor Final Approval & Knowledge Base Publication
router.patch(
    '/:id/final-approval',
    authenticate,
    restrictTo('SUPERVISOR'),
    validate(schemas.finalApprovalSchema),
    projectsController.finalApproval
);

// 8. Admin Proposal Rejection (Permanent Rejection)
router.patch(
    '/:id/admin-reject',
    authenticate,
    restrictTo('ADMIN'),
    validate(schemas.adminRejectSchema),
    projectsController.adminReject
);

// 9. Supervisor Final Paper Revision Request (Revert to IN_PROGRESS)
router.patch(
    '/:id/request-changes',
    authenticate,
    restrictTo('SUPERVISOR'),
    validate(schemas.requestChangesSchema),
    projectsController.requestChanges
);

module.exports = router;

