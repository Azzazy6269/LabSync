const path = require('path');
const fs = require('fs');
const prisma = require('../../config/prisma');
const APIError = require('../../utils/APIError');
const deleteFiles = require('../../utils/deleteFiles');



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


/**
 * 3. Send Message (Text and/or Draft Paper Attachment)
 */
const sendMessage = async (projectId, currentUser, body = {}, file = null) => {
    await verifyWorkspaceAccess(projectId, currentUser, ['IN_PROGRESS', 'PENDING_FINAL_APPROVAL']);

    const content = body.content ? String(body.content).trim() : null;

    if (!content && !file) {
        throw new APIError('Message content or an attached file is required', 400);
    }

    return await prisma.$transaction(async (tx) => {
        let attachedDoc = null;

        if (file) {
            // Find current max version for DRAFT_PAPER in this project
            const latestDraft = await tx.document.findFirst({
                where: { projectId, docType: 'DRAFT_PAPER' },
                orderBy: { version: 'desc' }
            });

            const nextVersion = latestDraft ? latestDraft.version + 1 : 1;
            const docTitle = body.title ? String(body.title).trim() : file.originalname || `Draft Paper v${nextVersion}`;

            attachedDoc = await tx.document.create({
                data: {
                    projectId,
                    uploadedById: currentUser.id,
                    title: docTitle,
                    fileUrl: `/uploads/documents/${file.filename}`,
                    docType: 'DRAFT_PAPER',
                    version: nextVersion
                }
            });
        }

        const message = await tx.projectMessage.create({
            data: {
                projectId,
                userId: currentUser.id,
                content: content || null,
                attachmentId: attachedDoc ? attachedDoc.id : null
            },
            include: {
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
            }
        });

        return message;
    });
};


/**
 * 4. Edit Message
 */
const editMessage = async (projectId, messageId, currentUser, body = {}) => {
    await verifyWorkspaceAccess(projectId, currentUser, ['IN_PROGRESS', 'PENDING_FINAL_APPROVAL']);

    const message = await prisma.projectMessage.findUnique({
        where: { id: messageId }
    });

    if (!message || message.projectId !== projectId) {
        throw new APIError('Message not found', 404);
    }

    if (message.userId !== currentUser.id) {
        throw new APIError('You can only edit your own messages', 403);
    }

    const newContent = body.content ? String(body.content).trim() : '';
    if (!newContent) {
        throw new APIError('Message content cannot be empty', 400);
    }

    const updated = await prisma.projectMessage.update({
        where: { id: messageId },
        data: { content: newContent },
        include: {
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
        }
    });

    return updated;
};


/**
 * 5. Delete Message
 */
const deleteMessage = async (projectId, messageId, currentUser) => {
    await verifyWorkspaceAccess(projectId, currentUser, ['IN_PROGRESS', 'PENDING_FINAL_APPROVAL']);

    const message = await prisma.projectMessage.findUnique({
        where: { id: messageId },
        include: { attachment: true }
    });

    if (!message || message.projectId !== projectId) {
        throw new APIError('Message not found', 404);
    }

    const isAuthor = message.userId === currentUser.id;

    if (!isAuthor) {
        throw new APIError('You can only delete your own messages', 403);
    }

    await prisma.$transaction(async (tx) => {
        await tx.projectMessage.delete({ where: { id: messageId } });

        if (message.attachmentId) {
            await tx.document.delete({ where: { id: message.attachmentId } }).catch(() => {});
        }
    });

    // Safely attempt file cleanup if an attachment existed
    if (message.attachment?.fileUrl) {
        try {
            const filename = path.basename(message.attachment.fileUrl);
            const uploadDir = path.resolve(__dirname, '../../uploads/documents');
            const safeFilePath = path.join(uploadDir, filename);
            if (fs.existsSync(safeFilePath) && safeFilePath.startsWith(uploadDir)) {
                fs.unlinkSync(safeFilePath);
            }
        } catch {
            // Ignore file unlink errors
        }
    }

    return {
        message: 'Message deleted successfully',
        id: messageId
    };
};


/**
 * 6. Retrieve Shared Draft Documents
 */
const getSharedDrafts = async (projectId, currentUser) => {
    await verifyWorkspaceAccess(projectId, currentUser, [
        'IN_PROGRESS',
        'PENDING_FINAL_APPROVAL',
        'PUBLISHED'
    ]);

    const drafts = await prisma.document.findMany({
        where: {
            projectId,
            docType: 'DRAFT_PAPER'
        },
        orderBy: { version: 'desc' },
        select: {
            id: true,
            title: true,
            fileUrl: true,
            docType: true,
            version: true,
            createdAt: true,
            uploadedBy: {
                select: { id: true, fullName: true, role: true, email: true }
            }
        }
    });

    return drafts;
};

/**
 * 7. Retrieve Latest Final Paper
 */
const getLatestFinalPaper = async (projectId, currentUser) => {
    const project = await verifyWorkspaceAccess(projectId, currentUser, [
        'IN_PROGRESS',
        'PENDING_FINAL_APPROVAL',
        'PUBLISHED'
    ]);

    const finalPaper = await prisma.document.findFirst({
        where: {
            projectId,
            docType: 'FINAL_PAPER'
        },
        orderBy: { version: 'desc' },
        select: {
            id: true,
            title: true,
            fileUrl: true,
            docType: true,
            version: true,
            createdAt: true,
            uploadedBy: {
                select: { id: true, fullName: true, role: true, email: true }
            }
        }
    });

    return {
        projectStatus: project.status,
        finalPaper
    };
};

/**
 * 8. Secure Document Download
 */
const getDocumentForDownload = async (projectId, documentId, currentUser) => {
    await verifyWorkspaceAccess(projectId, currentUser, [
        'IN_PROGRESS',
        'PENDING_FINAL_APPROVAL',
        'PUBLISHED'
    ]);

    const document = await prisma.document.findUnique({
        where: { id: documentId }
    });

    if (!document || document.projectId !== projectId) {
        throw new APIError('Document not found in this project', 404);
    }

    const filename = path.basename(document.fileUrl);
    const uploadDir = path.resolve(__dirname, '../../uploads/documents');
    const safeFilePath = path.join(uploadDir, filename);

    // Prevent directory traversal
    if (!safeFilePath.startsWith(uploadDir)) {
        throw new APIError('Invalid document path', 400);
    }

    if (!fs.existsSync(safeFilePath)) {
        throw new APIError('Document file not found on disk', 404);
    }

    const ext = path.extname(safeFilePath) || '.pdf';
    const downloadName = `${document.title.replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;

    return {
        filePath: safeFilePath,
        fileName: downloadName,
        document
    };
};

module.exports = {
    verifyWorkspaceAccess,
    getWorkspaceOverview,
    getMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    getSharedDrafts,
    getLatestFinalPaper,
    getDocumentForDownload
};
