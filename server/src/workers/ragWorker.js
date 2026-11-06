const { Worker } = require('bullmq');
const prisma = require('../../config/prisma');
const redisConnection = require('../../config/redis');


const startRagWorker = () => {
    try {
        const worker = new Worker('rag-embeddings-queue', async (job) => {
            const { projectId, documentId } = job.data;
            console.log(`⚙️ Processing RAG worker job ${job.id} for project: ${projectId}`);

            const doc = await prisma.document.findUnique({
                where: { id: documentId }
            });

            if (!doc) {
                console.warn(`Document ${documentId} not found for RAG processing.`);
                return;
            }

            // Extract content and chunk
            const sampleContent = `Document ${doc.title} (${doc.docType}). Published final research paper for project ${projectId}.`;

            // Store chunk with accessLevel = 'GLOBAL_LAB'
            await prisma.documentChunk.create({
                data: {
                    projectId,
                    documentId,
                    content: sampleContent,
                    accessLevel: 'GLOBAL_LAB'
                }
            });

            console.log(`✅ Stored DocumentChunk with accessLevel='GLOBAL_LAB' for document: ${doc.id}`);
        }, { connection:redisConnection });

        worker.on('error', (err) => {
            console.warn('⚠️ BullMQ Worker Redis connection error:', err.message);
        });

        return worker;
    } catch (error) {
        console.warn('⚠️ Could not start BullMQ Worker:', error.message);
    }
};

module.exports = {
    startRagWorker
};

