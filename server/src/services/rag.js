const pdfParseModule = require('pdf-parse');
const fs = require('fs/promises');
const prisma = require('../../config/prisma');
const { GoogleGenAI } = require('@google/genai');
const path = require('path');

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    apiVersion: 'v1beta'
});

// Model configuration
const EMBEDDING_MODEL = 'gemini-embedding-001';
const GENERATION_MODEL = 'gemini-2.5-flash';

const EMBEDDING_DIMENSIONS = 1536;

// Chunking configuration
const CHUNK_SIZE = 2800;
const CHUNK_OVERLAP = 400;

// Embedding configuration
const EMBEDDING_BATCH_SIZE = 16;
const EMBEDDING_CONCURRENCY = 1;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Determines whether an API error is temporary and can be retried.
 */
const isRetryableError = (error) => {
    const status = Number(
        error.status || error.code || error.response?.status
    );

    if ([408, 429, 500, 502, 503, 504].includes(status)) {
        return true;
    }

    const message = String(error.message || '').toLowerCase();

    return (
        message.includes('rate limit') ||
        message.includes('resource exhausted') ||
        message.includes('temporarily unavailable') ||
        message.includes('internal error') ||
        message.includes('timeout')
    );
};

/**
 * Executes an API operation with exponential backoff.
 */
const retryWithBackoff = async (operation, maxAttempts = 4) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            const shouldRetry = isRetryableError(error);

            if (!shouldRetry || attempt === maxAttempts) {
                throw error;
            }

            // Exponential backoff with jitter.
            const delay = Math.min(
                5000 * (2 ** (attempt - 1)) + Math.random() * 1000,
                60000
            );

            console.warn(
                `API request failed. Retrying in ${Math.round(delay)}ms. ` +
                `Attempt ${attempt}/${maxAttempts}. Error: ${error.message}`
            );

            await sleep(delay);
        }
    }
};

/**
 * Splits oversized text recursively using natural text boundaries.
 * Character counts are used as an approximation of token counts.
 */
const splitOversizedText = (text, maxSize, separators) => {
    if (text.length <= maxSize) {
        return [text];
    }

    if (separators.length === 0) {
        const pieces = [];

        for (let i = 0; i < text.length; i += maxSize) {
            pieces.push(text.slice(i, i + maxSize));
        }

        return pieces;
    }

    const separatorIndex = separators.findIndex(separator =>
        text.includes(separator)
    );

    if (separatorIndex === -1) {
        const characters = Array.from(text);
        const pieces = [];

        for (let i = 0; i < characters.length; i += maxSize) {
            pieces.push(characters.slice(i, i + maxSize).join(''));
        }

        return pieces;
    }

    const separator = separators[separatorIndex];
    const parts = text.split(separator);

    const result = [];

    parts.forEach((part, index) => {
        const piece = index < parts.length - 1
            ? part + separator
            : part;

        if (!piece.trim()) return;

        if (piece.length > maxSize) {
            result.push(
                ...splitOversizedText(
                    piece,
                    maxSize,
                    separators.slice(separatorIndex + 1)
                )
            );
        } else {
            result.push(piece);
        }
    });

    return result;
};

/**
 * Creates overlapping chunks while preserving natural text boundaries.
 */
const createChunks = (
    text,
    chunkSize = CHUNK_SIZE,
    chunkOverlap = CHUNK_OVERLAP
) => {
    const separators = [
        '\n\n',
        '\n',
        '. ',
        '? ',
        '! ',
        '; ',
        ', ',
        ' '
    ];

    const segments = splitOversizedText(
        text,
        chunkSize,
        separators
    );

    const chunks = [];

    let currentSegments = [];
    let currentLength = 0;

    for (const segment of segments) {
        if (
            currentLength + segment.length > chunkSize &&
            currentSegments.length > 0
        ) {
            chunks.push(currentSegments.join('').trim());

            // Retain the previous text tail for contextual overlap.
            let overlapSegments = [];
            let overlapLength = 0;

            for (
                let i = currentSegments.length - 1;
                i >= 0;
                i--
            ) {
                const previousSegment = currentSegments[i];

                if (
                    overlapLength + previousSegment.length >
                    chunkOverlap
                ) {
                    break;
                }

                overlapSegments.unshift(previousSegment);
                overlapLength += previousSegment.length;
            }

            currentSegments = overlapSegments;
            currentLength = overlapLength;
        }

        currentSegments.push(segment);
        currentLength += segment.length;
    }

    if (currentSegments.length > 0) {
        chunks.push(currentSegments.join('').trim());
    }

    return chunks.filter(chunk => chunk.length > 0);
};

/**
 * Extracts raw text from a PDF buffer using pdf-parse (supports v1 function and v2 class API).
 */
const extractPdfText = async (dataBuffer) => {
    if (typeof pdfParseModule === 'function') {
        const result = await pdfParseModule(dataBuffer);
        return result?.text || '';
    }
    if (pdfParseModule?.PDFParse) {
        const parser = new pdfParseModule.PDFParse({ data: dataBuffer });
        try {
            const result = await parser.getText();
            return result?.text || '';
        } finally {
            if (typeof parser.destroy === 'function') {
                await parser.destroy().catch(() => {});
            }
        }
    }
    if (typeof pdfParseModule?.default === 'function') {
        const result = await pdfParseModule.default(dataBuffer);
        return result?.text || '';
    }
    throw new Error('Unsupported pdf-parse module format');
};

/**
 * Extracts text from a PDF and splits it into overlapping chunks.
 */
const parseAndChunk = async (
    filePathOrBuffer,
    chunkSize = CHUNK_SIZE,
    chunkOverlap = CHUNK_OVERLAP
) => {
    let dataBuffer;

    if (typeof filePathOrBuffer === 'string') {
        const absolutePath = path.resolve(
            process.cwd(),
            filePathOrBuffer.replace(/^[/\\]+/, '')
        );

        dataBuffer = await fs.readFile(absolutePath);
    } else {
        dataBuffer = filePathOrBuffer;
    }

    const rawText = await extractPdfText(dataBuffer);

    const text = (rawText || '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (!text) return [];

    return createChunks(text, chunkSize, chunkOverlap);
};

/**
 * Splits an array into smaller batches.
 */
const createBatches = (items, batchSize) => {
    const batches = [];

    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
    }

    return batches;
};

/**
 * Runs asynchronous tasks with a limited concurrency.
 */
const runWithConcurrency = async (items, concurrency, operation) => {
    const results = new Array(items.length);
    let nextIndex = 0;

    const workers = Array.from(
        { length: Math.min(concurrency, items.length) },
        async () => {
            while (nextIndex < items.length) {
                const currentIndex = nextIndex++;

                results[currentIndex] = await operation(
                    items[currentIndex],
                    currentIndex
                );
            }
        }
    );

    await Promise.all(workers);

    return results;
};

/**
 * Generates embeddings for multiple text chunks using batch requests.
 */
const generateBatchEmbeddings = async (textChunks) => {
    if (!Array.isArray(textChunks) || textChunks.length === 0) {
        return [];
    }

    const batches = createBatches(
        textChunks,
        EMBEDDING_BATCH_SIZE
    );

    const batchResults = await runWithConcurrency(
        batches,
        EMBEDDING_CONCURRENCY,
        async (batch, batchIndex) => {
            console.log(
                `Generating embeddings for batch ${batchIndex + 1}/${batches.length}`
            );

            const response = await retryWithBackoff(async () => {
                return ai.models.embedContent({
                    model: EMBEDDING_MODEL,
                    contents: batch,
                    config: {
                        taskType: 'RETRIEVAL_DOCUMENT',
                        outputDimensionality: EMBEDDING_DIMENSIONS
                    }
                });
            });

            if (
                !response.embeddings ||
                response.embeddings.length !== batch.length
            ) {
                throw new Error(
                    'Embedding response count does not match input batch size.'
                );
            }

            return response.embeddings.map(embedding => {
                const values = embedding.values;

                if (
                    !values ||
                    values.length !== EMBEDDING_DIMENSIONS
                ) {
                    throw new Error(
                        'Invalid embedding dimensions returned by Gemini.'
                    );
                }

                return values;
            });
        }
    );

    return batchResults.flat();
};

/**
 * Generates an embedding for a user query.
 */
const generateQueryEmbedding = async (userQuery) => {
    const response = await retryWithBackoff(async () => {
        return ai.models.embedContent({
            model: EMBEDDING_MODEL,
            contents: userQuery,
            config: {
                taskType: 'RETRIEVAL_QUERY',
                outputDimensionality: EMBEDDING_DIMENSIONS
            }
        });
    });

    const values = response.embeddings?.[0]?.values;

    if (!values || values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error('Invalid query embedding returned by Gemini.');
    }

    return values;
};

/**
 * Retrieves relevant chunks and generates a context-grounded answer.
 */
const queryGlobalLabRAG = async (userQuery, limit = 5) => {
    if (!userQuery || !userQuery.trim()) {
        throw new Error('A valid user query is required.');
    }

    const queryEmbedding = await generateQueryEmbedding(userQuery);
    const queryVector = JSON.stringify(queryEmbedding);

    const relevantChunks = await prisma.$queryRaw`
        SELECT
            "id",
            "content",
            (1 - ("embedding" <=> ${queryVector}::vector)) AS similarity
        FROM "DocumentChunk"
        WHERE "accessLevel" = 'GLOBAL_LAB'::"RAGAccessLevel"
        ORDER BY "embedding" <=> ${queryVector}::vector ASC
        LIMIT ${limit};
    `;

    if (!relevantChunks.length) {
        return "No information related to your question was found.";
    }

    const contextText = relevantChunks
        .map((chunk, index) =>
            `[Source ${index + 1}]\n${chunk.content}`
        )
        .join('\n\n---\n\n');

    const response = await retryWithBackoff(async () => {
        return ai.models.generateContent({
            model: GENERATION_MODEL,
            contents: `
Context:
${contextText}

Question:
${userQuery}
            `,
            config: {
                systemInstruction: `
You are an AI research assistant for LabSync.

Answer the user's question using only the information
provided in the context.

Do not invent facts or introduce external information.

If the context does not contain enough information,
clearly state that the available documents do not provide
a sufficient answer.

Keep your answers clear, accurate, and relevant.
                `.trim()
            }
        });
    });

    return response.text;
};

module.exports = {
    parseAndChunk,
    generateBatchEmbeddings,
    generateQueryEmbedding,
    queryGlobalLabRAG
};
