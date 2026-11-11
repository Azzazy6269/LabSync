
const { Worker, UnrecoverableError } = require('bullmq');
const { Prisma } = require('@prisma/client');
const path = require('path');

const prisma = require('../../config/prisma');
const redisConnection = require('../../config/redis');

const {
    parseAndChunk,
    generateBatchEmbeddings
} = require('../services/rag');

const INSERT_BATCH_SIZE = 100;

/**
 * Saves all document chunks atomically.
 * Old chunks are preserved if any database operation fails.
 */
const saveDocumentChunks = async ({
    projectId,
    documentId,
    chunks,
    embeddings
}) => {
    if (chunks.length !== embeddings.length) {
        throw new Error(
            'Chunks count does not match embeddings count.'
        );
    }

    await prisma.$transaction(async (tx) => {
        // Remove previously indexed chunks inside the transaction.
        await tx.$executeRaw`
            DELETE FROM "DocumentChunk"
            WHERE "documentId" = ${documentId};
        `;

        // Insert new chunks in smaller SQL batches.
        for (
            let i = 0;
            i < chunks.length;
            i += INSERT_BATCH_SIZE
        ) {
            const batchChunks = chunks.slice(
                i,
                i + INSERT_BATCH_SIZE
            );

            const batchEmbeddings = embeddings.slice(
                i,
                i + INSERT_BATCH_SIZE
            );

            const rows = batchChunks.map((chunk, index) => {
                const vectorString = JSON.stringify(
                    batchEmbeddings[index]
                );

                return Prisma.sql`
                    (
                        gen_random_uuid(),
                        ${projectId},
                        ${documentId},
                        ${chunk},
                        ${vectorString}::vector,
                        'GLOBAL_LAB'::"RAGAccessLevel",
                        NOW()
                    )
                `;
            });

            await tx.$executeRaw(Prisma.sql`
                INSERT INTO "DocumentChunk" (
                    "id",
                    "projectId",
                    "documentId",
                    "content",
                    "embedding",
                    "accessLevel",
                    "createdAt"
                )
                VALUES ${Prisma.join(rows)}
            `);
        }
    }, {
        maxWait: 10000,
        timeout: 60000
    });
};

/**
 * Starts the BullMQ worker responsible for document indexing.
 */
const startRagWorker = () => {
    const worker = new Worker(
        'rag-embeddings-queue',
        async (job) => {
            const { projectId, documentId } = job.data;

            console.log(
                `Processing RAG job ${job.id} for document ${documentId}`
            );

            // Retrieve the document from the database.
            const doc = await prisma.document.findUnique({
                where: { id: documentId }
            });

            if (!doc) {
                throw new UnrecoverableError(
                    `Document ${documentId} does not exist.`
                );
            }

            if (!doc.fileUrl) {
                throw new UnrecoverableError(
                    `Document ${documentId} has no file path.`
                );
            }

            // Extract text and create overlapping chunks.
            console.log(`Extracting text from ${doc.fileUrl}`);
            const relativeFilePath = doc.fileUrl;
            const absolutePath = path.join(process.cwd(), relativeFilePath);
            console.log(`absolutePath: ${absolutePath}`);

            //const chunks = await parseAndChunk(absolutePath);
            const chunks = await parseAndChunk(doc.fileUrl);

            if (chunks.length === 0) {
                throw new UnrecoverableError(
                    `No text could be extracted from document ${documentId}.`
                );
            }

            console.log(
                `Extracted ${chunks.length} chunks from document ${documentId}.`
            );

            // Generate all embeddings before modifying existing database records.
            console.log('Generating document embeddings...');

            const embeddings = await generateBatchEmbeddings(chunks);

            if (embeddings.length !== chunks.length) {
                throw new Error(
                    'Embedding generation returned an incomplete result.'
                );
            }

            console.log(
                `Generated ${embeddings.length} embeddings successfully.`
            );

            // Replace existing chunks in a single database transaction.
            console.log('Saving document chunks transactionally...');

            await saveDocumentChunks({
                projectId,
                documentId,
                chunks,
                embeddings
            });

            console.log(
                `Successfully indexed document ${documentId} ` +
                `with ${chunks.length} chunks.`
            );

            return {
                documentId,
                chunksCount: chunks.length,
                status: 'COMPLETED'
            };
        },
        {
            connection: redisConnection,

            // Keep one indexing job active to protect the free API quota.
            concurrency: 1
        }
    );

    worker.on('ready', () => {
        console.log('RAG Worker is ready and waiting for jobs.');
    });

    worker.on('active', (job) => {
        console.log(`RAG Worker started processing job ${job.id}.`);
    });

    worker.on('completed', (job) => {
        console.log(`RAG job ${job.id} completed.`);
    });

    worker.on('failed', (job, error) => {
        console.error(`RAG job ${job?.id} failed: ${error.message}`);
    });

    worker.on('error', (error) => {
        console.error(`RAG Worker error: ${error.message}`);
    });
        
        worker.on('failed', (job, error) => {
            console.error(
                `RAG job ${job?.id} failed: ${error.message}`
            );
        });

    return worker;
};

module.exports = {
    startRagWorker
};
