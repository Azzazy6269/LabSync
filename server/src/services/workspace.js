const path = require('path');
const fs = require('fs');
const prisma = require('../../config/prisma');
const APIError = require('../../utils/APIError');

/**
 * Reusable authorization helper:
 * Verifies project existence, participant ownership (author or supervisor),
 * and project lifecycle status for workspace operations.
 */
const verifyWorkspaceAccess = async (projectId, currentUser, allowedStatuses = ['IN_PROGRESS']) => {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            title: true,
            description: true,
            field: true,
            status: true,
            authorId: true,
            supervisorId: true,
            author: {
                select: { id: true, fullName: true, email: true, jobTitle: true, role: true }
            },
            supervisor: {
                select: { id: true, fullName: true, email: true, jobTitle: true, role: true }
            }
        }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    const isAuthor = project.authorId === currentUser.id;
    const isSupervisor = project.supervisorId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';

    if (!isAuthor && !isSupervisor && !isAdmin) {
        throw new APIError('You do not have permission to access this project workspace', 403);
    }

    if (allowedStatuses && allowedStatuses.length > 0 && !allowedStatuses.includes(project.status)) {
        throw new APIError(
            `Project workspace is only accessible when project status is ${allowedStatuses.join(' or ')}. Current status is ${project.status}`,
            400
        );
    }

    return project;
};

/**
 * 1. Retrieve Workspace Overview
 */
const getWorkspaceOverview = async (projectId, currentUser) => {
    const project = await verifyWorkspaceAccess(projectId, currentUser, [
        'IN_PROGRESS',
        'PENDING_FINAL_APPROVAL',
        'PUBLISHED'
    ]);

    const [totalMessages, totalDrafts, latestFinalPaper] = await Promise.all([
        prisma.projectMessage.count({ where: { projectId } }),
        prisma.document.count({ where: { projectId, docType: 'DRAFT_PAPER' } }),
        prisma.document.findFirst({
            where: { projectId, docType: 'FINAL_PAPER' },
            orderBy: { version: 'desc' },
            select: {
                id: true,
                title: true,
                fileUrl: true,
                version: true,
                createdAt: true,
                uploadedBy: {
                    select: { id: true, fullName: true, role: true }
                }
            }
        })
    ]);

    return {
        project: {
            id: project.id,
            title: project.title,
            description: project.description,
            field: project.field,
            status: project.status
        },
        researcher: project.author,
        supervisor: project.supervisor,
        stats: {
            totalMessages,
            totalDrafts,
            hasFinalPaper: !!latestFinalPaper
        },
        latestFinalPaper
    };
};


module.exports = {
    verifyWorkspaceAccess,
    getWorkspaceOverview
};
