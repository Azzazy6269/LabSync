const prisma = require('../../config/prisma');
const APIError = require('../../utils/APIError');
const deleteFiles = require('../../utils/deleteFiles');
const { triggerRagEmbeddingJob } = require('../queues/ragQueue')



const submitProposal = async (userId, body, files) => {
    try{
    const { title, description, field } = body;

    const approvalFile = files?.universityApprovalDoc?.[0];
    const receiptFile = files?.feeReceiptDoc?.[0];

    if (!approvalFile || !receiptFile) {
        throw new APIError('Both universityApprovalDoc and feeReceiptDoc PDF files are required.', 400);
    }

    const approvalUrl = `/uploads/documents/${approvalFile.filename}`;
    const receiptUrl = `/uploads/documents/${receiptFile.filename}`;

    const newProject = await prisma.$transaction(async (tx) => {
        // Create project with status PENDING_ADMIN_APPROVAL
        const project = await tx.project.create({
            data: {
                title,
                description,
                field,
                status: 'PENDING_ADMIN_APPROVAL',
                authorId: userId
            }
        });

        // Create university approval document
        const approvalDoc = await tx.document.create({
            data: {
                projectId: project.id,
                uploadedById: userId,
                title: approvalFile.originalname || 'University Approval Document',
                fileUrl: approvalUrl,
                docType: 'UNIVERSITY_APPROVAL',
                version: 1
            }
        });

        // Create fee receipt document
        const receiptDoc = await tx.document.create({
            data: {
                projectId: project.id,
                uploadedById: userId,
                title: receiptFile.originalname || 'Fee Receipt Document',
                fileUrl: receiptUrl,
                docType: 'FEE_RECEIPT',
                version: 1
            }
        });

        return {
            id: project.id,
            title: project.title,
            status: project.status,
            authorId: project.authorId,
            documents: [
                {
                    id: approvalDoc.id,
                    docType: approvalDoc.docType,
                    fileUrl: approvalDoc.fileUrl
                },
                {
                    id: receiptDoc.id,
                    docType: receiptDoc.docType,
                    fileUrl: receiptDoc.fileUrl
                }
            ],
            createdAt: project.createdAt
        };
    });

    return {
        message: 'Project proposal submitted successfully and is under Admin review.',
        data: newProject
    };
    }catch(error){
        await deleteFiles(files);
        throw error;
    }
    
};


const getAllProjects = async (currentUser, query) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const { status, search, field } = query;

    const andConditions = [];

    // Role-based visibility
    if (currentUser.role === 'ADMIN') {
        // Admins can see all projects
    } else if (currentUser.role === 'SUPERVISOR') {
        // Supervisor views projects assigned to them
        andConditions.push({supervisorId: currentUser.id});
    } else if (currentUser.role === 'RESEARCHER') {
        // Researcher views projects where they are the author
        andConditions.push({ authorId: currentUser.id });
    } else if (currentUser.role === 'MEMBER') {
        // Member views only PUBLISHED projects
        andConditions.push({ status: 'PUBLISHED' });
    }

    // Status filter
    if (status) {
        andConditions.push({ status });
    }

    // Field filter
    if (field && field.trim()) {
        andConditions.push({ field: { equals: field.trim(), mode: 'insensitive' } });
    }

    // Search filter across title, field, description
    if (search && search.trim()) {
        const cleanSearch = search.trim();
        andConditions.push({
            OR: [
                { title: { contains: cleanSearch, mode: 'insensitive' } },
                { field: { contains: cleanSearch, mode: 'insensitive' } },
                { description: { contains: cleanSearch, mode: 'insensitive' } }
            ]
        });
    }

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    const [count, projects] = await Promise.all([
        prisma.project.count({ where }),
        prisma.project.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            select: {
                id: true,
                title: true,
                field: true,
                status: true,
                createdAt: true,
                author: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                supervisor: {
                    select: {
                        fullName: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
    ]);

    const totalPages = Math.ceil(count / limit) || 1;

    return {
        count,
        pagination: {
            page,
            limit,
            totalPages
        },
        data: projects
    };
};


const getProjectById = async (id) => {
    const project = await prisma.project.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            description: true,
            field: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            author: {
                select: {
                    id: true,
                    fullName: true,
                    jobTitle: true,
                    email: true
                }
            },
            supervisor: {
                select: {
                    id: true,
                    fullName: true,
                    jobTitle: true,
                    email: true
                }
            },
            documents: {
                select: {
                    id: true,
                    docType: true,
                    fileUrl: true,
                    version: true,
                    title: true,
                    createdAt: true
                },
                orderBy: { createdAt: 'desc' }
            },
            comments: {
                select: {
                    id: true,
                    content: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    const isAuthor = project.authorId === currentUser.id;
    const isSupervisor = project.supervisorId === currentUser.id;
    const isAdmin = currentUser.role === 'ADMIN';
    const isPublished = project.status === 'PUBLISHED';

    if (!isAdmin && !isAuthor && !isSupervisor && !isPublished) {
        throw new APIError('You do not have permission to view this project', 403);
    }

    return project;
};


const adminAssignSupervisor = async (id, supervisorId) => {
    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    if (project.status !== 'PENDING_ADMIN_APPROVAL') {
        throw new APIError('Project status must be PENDING_ADMIN_APPROVAL to assign a supervisor', 400);
    }

    const supervisor = await prisma.user.findUnique({
        where: { id: supervisorId }
    });

    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
        throw new APIError('Assigned user must exist and have the SUPERVISOR role', 400);
    }

    if (supervisor.status !== 'APPROVED') {
        throw new APIError('Supervisor account is not approved', 400);
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: {
            supervisorId,
            status: 'PENDING_SUPERVISOR_ACKNOWLEDGEMENT'
        },
        select: {
            id: true,
            status: true,
            supervisorId: true,
            updatedAt: true
        }
    });

    return {
        message: 'Supervisor assigned successfully. Project status updated to PENDING_SUPERVISOR_ACKNOWLEDGEMENT.',
        data: updatedProject
    };
};


const supervisorAcknowledge = async (currentUser, id, action) => {
    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    if (project.supervisorId !== currentUser.id) {
        throw new APIError('You are not the assigned supervisor for this project', 403);
    }

    if (project.status !== 'PENDING_SUPERVISOR_ACKNOWLEDGEMENT') {
        throw new APIError('Project is not awaiting supervisor acknowledgement', 400);
    }

    let nextStatus;
    let message;

    if (action === 'ACCEPT') {
        nextStatus = 'IN_PROGRESS';
        message = 'Project workspace activated successfully.';
    } else {
        nextStatus = 'REJECTED';
        message = 'Project proposal rejected by supervisor.';
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: { status: nextStatus },
        select: {
            id: true,
            status: true
        }
    });

    return {
        message,
        data: updatedProject
    };
};


const submitFinalPaper = async (currentUser, id, body, file) => {
    try{
    if (!file) {
        throw new APIError('Final paper PDF document (finalPaperDoc) is required', 400);
    }

    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    if (project.authorId !== currentUser.id) {
        throw new APIError('Only the project author can submit the final paper', 403);
    }

    if (project.status !== 'IN_PROGRESS') {
        throw new APIError('Final paper can only be submitted when project status is IN_PROGRESS', 400);
    }

    // Determine the next version for final paper documents
    const latestDoc = await prisma.document.findFirst({
        where: {
            projectId: id,
            docType: 'FINAL_PAPER'
        },
        orderBy: { version: 'desc' }
    });

    const nextVersion = latestDoc ? latestDoc.version + 1 : 1;
    const fileUrl = `/uploads/documents/${file.filename}`;
    const docTitle = body.title || file.originalname || 'Final Research Paper';

    const result = await prisma.$transaction(async (tx) => {
        const document = await tx.document.create({
            data: {
                projectId: id,
                uploadedById: currentUser.id,
                title: docTitle,
                fileUrl,
                docType: 'FINAL_PAPER',
                version: nextVersion
            }
        });

        const updatedProject = await tx.project.update({
            where: { id },
            data: { status: 'PENDING_FINAL_APPROVAL' }
        });

        return {
            id: updatedProject.id,
            status: updatedProject.status,
            document: {
                id: document.id,
                docType: document.docType,
                fileUrl: document.fileUrl,
                version: document.version
            }
        };
    });

    return {
        message: 'Final paper submitted successfully. Awaiting supervisor approval.',
        data: result
    };
    }catch(error){
        await deleteFiles(files);
        throw error;
    }
    
};


const finalApproval = async (currentUser, id, body) => {
    const { reviewNotes } = body;

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            documents: {
                where: { docType: 'FINAL_PAPER' },
                orderBy: { version: 'desc' },
                take: 1
            }
        }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    if (project.supervisorId !== currentUser.id) {
        throw new APIError('Only the assigned supervisor can approve this project', 403);
    }

    if (project.status !== 'PENDING_FINAL_APPROVAL') {
        throw new APIError('Project is not awaiting final approval', 400);
    }

    const updatedProject = await prisma.$transaction(async (tx) => {
        const updated = await tx.project.update({
            where: { id },
            data: { status: 'PUBLISHED' },
            select: {
                id: true,
                status: true,
                updatedAt: true
            }
        });

        if (reviewNotes && reviewNotes.trim()) {
            await tx.comment.create({
                data: {
                    projectId: id,
                    userId: currentUser.id,
                    content: reviewNotes.trim()
                }
            });
        }

        return updated;
    });

    if (project.documents && project.documents.length > 0) {
        triggerRagEmbeddingJob({ projectId: id, documentId: project.documents[0].id });
    } else {
        console.warn(`⚠️ No final paper document found to trigger RAG for project: ${id}`);
    }

    return {
        message: 'Supervisor approved final paper. Published to laboratory knowledge base.',
        data: updatedProject
    };
};


const adminReject = async (id, rejectionReason) => {
    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    if (project.status !== 'PENDING_ADMIN_APPROVAL') {
        throw new APIError('Only proposals with status PENDING_ADMIN_APPROVAL can be rejected', 400);
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data: {
            status: 'REJECTED',
            rejectionReason: rejectionReason.trim()
        },
        select: {
            id: true,
            status: true,
            rejectionReason: true,
            updatedAt: true
        }
    });

    return {
        message: 'Project proposal has been permanently rejected and author notified.',
        data: updatedProject
    };
};


const requestChanges = async (currentUser, id, feedback) => {
    const project = await prisma.project.findUnique({
        where: { id }
    });

    if (!project) {
        throw new APIError('Project not found', 404);
    }

    if (project.supervisorId !== currentUser.id) {
        throw new APIError('Only the assigned supervisor can request changes on this project', 403);
    }

    if (project.status !== 'PENDING_FINAL_APPROVAL') {
        throw new APIError('Changes can only be requested when project status is PENDING_FINAL_APPROVAL', 400);
    }

    const updatedProject = await prisma.$transaction(async (tx) => {
        const updated = await tx.project.update({
            where: { id },
            data: { status: 'IN_PROGRESS' },
            select: {
                id: true,
                status: true,
                updatedAt: true
            }
        });

        // Automatically adds the feedback as a system comment
        await tx.comment.create({
            data: {
                projectId: id,
                userId: currentUser.id,
                content: feedback.trim()
            }
        });

        return updated;
    });

    return {
        message: 'Final paper returned to researcher for revisions. Status reverted to IN_PROGRESS.',
        data: {
            id: updatedProject.id,
            status: updatedProject.status,
            feedback: feedback.trim(),
            updatedAt: updatedProject.updatedAt
        }
    };
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

