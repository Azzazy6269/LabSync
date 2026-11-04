const projectsService = require('../services/projects');

const submitProposal = async (req, res, next) => {
    try {
        const response = await projectsService.submitProposal(req.user.id, req.body, req.files);
        res.status(201).json({
            success: true,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

const getAllProjects = async (req, res, next) => {
    try {
        const response = await projectsService.getAllProjects(req.user, req.query);
        res.status(200).json({
            success: true,
            count: response.count,
            pagination: response.pagination,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

const getProjectById = async (req, res, next) => {
    try {
        const project = await projectsService.getProjectById(req.params.id);
        res.status(200).json({
            success: true,
            data: project
        });
    } catch (error) {
        next(error);
    }
};

const adminAssignSupervisor = async (req, res, next) => {
    try {
        const response = await projectsService.adminAssignSupervisor(req.params.id, req.body.supervisorId);
        res.status(200).json({
            success: true,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

const supervisorAcknowledge = async (req, res, next) => {
    try {
        const response = await projectsService.supervisorAcknowledge(req.user, req.params.id, req.body.action);
        res.status(200).json({
            success: true,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

const submitFinalPaper = async (req, res, next) => {
    try {
        const response = await projectsService.submitFinalPaper(req.user, req.params.id, req.body, req.file);
        res.status(200).json({
            success: true,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

const finalApproval = async (req, res, next) => {
    try {
        const response = await projectsService.finalApproval(req.user, req.params.id, req.body);
        res.status(200).json({
            success: true,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

const adminReject = async (req, res, next) => {
    try {
        const response = await projectsService.adminReject(req.params.id, req.body.rejectionReason);
        res.status(200).json({
            success: true,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

const requestChanges = async (req, res, next) => {
    try {
        const response = await projectsService.requestChanges(req.user, req.params.id, req.body.feedback);
        res.status(200).json({
            success: true,
            message: response.message,
            data: response.data
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitProposal,
    getAllProjects,
    getProjectById,
    adminAssignSupervisor,
    supervisorAcknowledge,
    submitFinalPaper,
    finalApproval,
    adminReject,
    requestChanges
};

