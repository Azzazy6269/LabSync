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



/**
 * 2. Retrieve Conversation Messages with Cursor-Based Pagination
 */
const getMessages = async (projectId, currentUser, query = {}) => {
    await verifyWorkspaceAccess(projectId, currentUser, [
        'IN_PROGRESS',
        'PENDING_FINAL_APPROVAL',
        'PUBLISHED'
    ]);

    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 30));
    const { before, after } = query;

    const includeOptions = {
        user: {
            select: { id: true, fullName: true, role: true, email: true, jobTitle: true }
        },
        attachment: {
            select: {
                id: true,
                title: true,
                fileUrl: true,
                docType: true,
                version: true,
                createdAt: true
            }
        }
    };

    if (after) {
        // Fetch newer messages for incremental polling
        const cursorMsg = await prisma.projectMessage.findUnique({
            where: { id: after }
        });

        if (!cursorMsg || cursorMsg.projectId !== projectId) {
            throw new APIError('Invalid after cursor', 400);
        }

        const messages = await prisma.projectMessage.findMany({
            where: {
                projectId,
                OR: [
                    { createdAt: { gt: cursorMsg.createdAt } },
                    { createdAt: cursorMsg.createdAt, id: { gt: cursorMsg.id } }
                ]
            },
            take: limit + 1,
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
            include: includeOptions
        });

        const hasMore = messages.length > limit;
        const returned = hasMore ? messages.slice(0, limit) : messages;

        return {
            messages: returned,
            pagination: {
                limit,
                count: returned.length,
                hasMore,
                oldestCursor: returned[0]?.id || null,
                newestCursor: returned[returned.length - 1]?.id || null
            }
        };
    }

    if (before) {
        // Fetch older messages for scrolling backwards
        const cursorMsg = await prisma.projectMessage.findUnique({
            where: { id: before }
        });

        if (!cursorMsg || cursorMsg.projectId !== projectId) {
            throw new APIError('Invalid before cursor', 400);
        }

        const messages = await prisma.projectMessage.findMany({
            where: {
                projectId,
                OR: [
                    { createdAt: { lt: cursorMsg.createdAt } },
                    { createdAt: cursorMsg.createdAt, id: { lt: cursorMsg.id } }
                ]
            },
            take: limit + 1,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            include: includeOptions
        });

        const hasMore = messages.length > limit;
        const rawList = hasMore ? messages.slice(0, limit) : messages;
        const returned = rawList.reverse(); // reverse to maintain chronological order

        return {
            messages: returned,
            pagination: {
                limit,
                count: returned.length,
                hasMore,
                oldestCursor: returned[0]?.id || null,
                newestCursor: returned[returned.length - 1]?.id || null
            }
        };
    }

    // Default: fetch the most recent messages
    const messages = await prisma.projectMessage.findMany({
        where: { projectId },
        take: limit + 1,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        include: includeOptions
    });

    const hasMore = messages.length > limit;
    const rawList = hasMore ? messages.slice(0, limit) : messages;
    const returned = rawList.reverse(); // chronological order

    return {
        messages: returned,
        pagination: {
            limit,
            count: returned.length,
            hasMore,
            oldestCursor: returned[0]?.id || null,
            newestCursor: returned[returned.length - 1]?.id || null
        }
    };
};

module.exports = {
    verifyWorkspaceAccess,
    getWorkspaceOverview,
    getMessages
};
