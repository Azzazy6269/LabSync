
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
        const jobId = `rag-${documentId}`;

        // Check whether a job with the same ID already exists.
        const existingJob = await ragQueue.getJob(jobId);

        if (existingJob) {
            const existingState = await existingJob.getState();

            console.log(
                `Existing RAG job found: ${jobId}, State: ${existingState}`
            );

            // Remove old jobs that cannot be processed again through queue.add().
            if (
                existingState === 'failed' ||
                existingState === 'completed'
            ) {
                await existingJob.remove();

                console.log(`Removed old RAG job: ${jobId}`);
            } else {
                console.log(
                    `RAG job ${jobId} is already ${existingState}.`
                );

                return existingJob;
            }
        }

        // Create a fresh job.
        const job = await ragQueue.add(
            'generate-embeddings',
            {
                projectId,
                documentId
            },
            {
                jobId,
                attempts: 4,
                backoff: {
                    type: 'exponential',
                    delay: 10000
                }
            }
        );

        console.log(`Queued new RAG job: ${job.id}`);

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
