const { Worker } = require('bullmq');
const prisma = require('../../config/prisma');
const redisConnection = require('../../config/redis');
const { parseAndChunk, generateBatchEmbeddings } = require('../services/rag');

const startRagWorker = () => {
    try {
        const worker = new Worker('rag-embeddings-queue', async (job) => {
            const { projectId, documentId } = job.data;
            console.log(`⚙️ Processing RAG worker job ${job.id} for project: ${projectId}`);

            const doc = await prisma.document.findUnique({
                where: { id: documentId }
            });

            if (!doc || !doc.fileUrl) {
                console.warn(`⚠️ Document ${documentId} not found or missing fileUrl.`);
                return;
            }

            console.log(`📄 Extracting text chunks from: ${doc.fileUrl}`);
            const chunks = await parseAndChunk(doc.fileUrl);
            if (chunks.length === 0) {
                console.warn(`⚠️ No text extracted from document: ${documentId}`);
                return;
            }

            console.log(`🧠 Generating embeddings for ${chunks.length} chunks...`);
            const embeddings = await generateBatchEmbeddings(chunks);

            console.log(`💾 Saving chunks into database...`);
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                const vectorString = JSON.stringify(embeddings[i]);

                await prisma.$executeRaw`
                    INSERT INTO "DocumentChunk" (
                        "id", 
                        "projectId", 
                        "documentId", 
                        "content", 
                        "embedding", 
                        "accessLevel", 
                        "createdAt"
                    )
                    VALUES (
                        gen_random_uuid(), 
                        ${projectId}, 
                        ${documentId}, 
                        ${chunkText}, 
                        ${vectorString}::vector, 
                        'GLOBAL_LAB'::"RAGAccessLevel", 
                        NOW()
                    );
                `;
            }

            console.log(`✅ Successfully stored ${chunks.length} chunks with embeddings for document: ${doc.id}`);
        }, { 
            connection: redisConnection,
            concurrency: 2
        });

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

