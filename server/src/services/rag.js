const pdfParse = require('pdf-parse');
const fs = require('fs/promises');
const prisma = require('../config/prisma');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const parseAndChunk = async (filePathOrBuffer, chunkSize = 500, chunkOverlap = 100) => {
    let dataBuffer = typeof filePathOrBuffer === 'string' 
        ? await fs.readFile(filePathOrBuffer) 
        : filePathOrBuffer;

    const pdfData = await pdfParse(dataBuffer);
    const text = pdfData.text.replace(/\s+/g, ' ').trim();

    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        const chunk = text.slice(start, end).trim();
        if (chunk.length > 0) chunks.push(chunk);
        start += chunkSize - chunkOverlap;
    }
    return chunks;
};

const generateBatchEmbeddings = async (textChunks) => {
    const embeddings = [];
    for (const chunk of textChunks) {
        const response = await ai.models.embedContent({
            model: 'text-embedding-004',
            contents: chunk,
        });
        embeddings.push(response.embedding.values);
    }
    return embeddings;
};

const queryGlobalLabRAG = async (userQuery, limit = 5) => {
    const queryEmbed = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: userQuery,
    });
    const queryVector = JSON.stringify(queryEmbed.embedding.values);

    const relevantChunks = await prisma.$queryRaw`
        SELECT "id", "content", 
               (1 - ("embedding" <=> ${queryVector}::vector)) AS similarity
        FROM "DocumentChunk"
        WHERE "accessLevel" = 'GLOBAL_LAB'::"RAGAccessLevel"
        ORDER BY "embedding" <=> ${queryVector}::vector ASC
        LIMIT ${limit};
    `;

    if (!relevantChunks.length) return "No information related to your question was found.";

    const contextText = relevantChunks.map(c => c.content).join('\n---\n');

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Context:\n${contextText}\n\nQuestion: ${userQuery}`,
        config: {
            systemInstruction: 'You are an AI assistant for laboratory researchers (LabSync). Answer based only on the provided context.'
        }
    });

    return response.text;
};

module.exports = {
    parseAndChunk,
    generateBatchEmbeddings,
    queryGlobalLabRAG
};