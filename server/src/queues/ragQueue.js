const { Queue } = require('bullmq');
const redisConnection = require('../../config/redis');

let ragQueue = null;

try {
    ragQueue = new Queue('rag-embeddings-queue', { redisConnection });
    ragQueue.on('error', () => {
        // Silently handle redis offline
    });
} catch (error) {
    console.warn('⚠️ Could not initialize BullMQ Queue:', error.message);
}

/**
 * Triggers background worker via BullMQ without blocking the HTTP request
 */
const triggerRagEmbeddingJob = async ({ projectId, documentId }) => {
    // Asynchronously dispatch the job with a 1-second timeout fallback
    Promise.race([
        (async () => {
            if (ragQueue) {
                const job = await ragQueue.add('generate-embeddings', {
                    projectId,
                    documentId
                });
                console.log(`🚀 Queued RAG embeddings job [${job.id}] for project: ${projectId}`);
                return job;
            }
        })(),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Redis connection unavailable or timed out')), 1000)
        )
    ]).catch((err) => {
        console.warn(`⚠️ Background RAG job dispatch note: ${err.message}`);
    });
};

module.exports = {
    ragQueue,
    triggerRagEmbeddingJob
};
