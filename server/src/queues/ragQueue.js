
const { Queue } = require('bullmq');
const redisConnection = require('../../config/redis');

const QUEUE_NAME = 'rag-embeddings-queue';

let ragQueue = null;

try {
    ragQueue = new Queue(QUEUE_NAME, {
        connection: redisConnection,

        defaultJobOptions: {
            // Allow three retries after the initial attempt.
            attempts: 4,

            // Increase the delay between failed attempts.
            backoff: {
                type: 'exponential',
                delay: 10000
            },

            // Keep a limited number of completed jobs for debugging.
            removeOnComplete: 100,

            // Keep failed jobs for investigation.
            removeOnFail: 500
        }
    });

    ragQueue.on('error', (error) => {
        console.warn(
            `BullMQ queue connection error: ${error.message}`
        );
    });

} catch (error) {
    console.error(
        `Could not initialize BullMQ queue: ${error.message}`
    );
}

/**
 * Dispatches a document indexing job without blocking the HTTP request.
 */
const triggerRagEmbeddingJob = async ({
    projectId,
    documentId
}) => {
    if (!ragQueue) {
        console.error('RAG queue is not initialized.');
        return;
    }

    try {
        const job = await ragQueue.add(
            'generate-embeddings',
            {
                projectId,
                documentId
            },
            {
                // Prevent simultaneous duplicate jobs for the same document.
                jobId: `rag-${documentId}`
            }
        );

        console.log(
            `Queued RAG job ${job.id} for document ${documentId}.`
        );

        return job;

    } catch (error) {
        console.error(
            `Failed to dispatch RAG job: ${error.message}`
        );
    }
};

module.exports = {
    ragQueue,
    triggerRagEmbeddingJob
};
