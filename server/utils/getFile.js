const path = require('path');
const fs = require('fs/promises');
const APIError = require('./APIError');

/**
 * Resolves a safe file path inside the uploads directory, verifies existence,
 * and formats a clean download filename.
 *
 * @param {string} fileUrl - Stored file URL (e.g. "/uploads/documents/file.pdf")
 * @param {Object} [options]
 * @param {string} [options.subDir='documents'] - Subdirectory inside uploads
 * @param {string} [options.title] - Optional custom title for the download filename
 * @param {string} [options.defaultExt='.pdf'] - Fallback extension if none exists
 * @param {boolean} [options.checkExists=true] - Whether to verify file exists on disk
 * @returns {Promise<{ filePath: string, fileName: string, ext: string }>}
 */
const getFile = async (fileUrl, options = {}) => {
    const {
        subDir = 'documents',
        title,
        defaultExt = '.pdf',
        checkExists = true
    } = options;

    if (!fileUrl || typeof fileUrl !== 'string') {
        throw new APIError('Invalid document path', 400);
    }

    const filename = path.basename(fileUrl);
    if (!filename || filename === '.' || filename === '..') {
        throw new APIError('Invalid document path', 400);
    }

    const uploadDir = path.resolve(__dirname, '../uploads', subDir);
    const safeFilePath = path.join(uploadDir, filename);

    // Prevent directory traversal
    if (!safeFilePath.startsWith(uploadDir + path.sep)) {
        throw new APIError('Invalid document path', 400);
    }

    if (checkExists) {
        try {
            await fs.access(safeFilePath);
        } catch {
            throw new APIError('Document file not found on disk', 404);
        }
    }

    const ext = path.extname(safeFilePath) || defaultExt;
    const baseName = title
        ? String(title).replace(/[^a-zA-Z0-9_-]/g, '_')
        : path.basename(safeFilePath, ext);

    return {
        filePath: safeFilePath,
        fileName: `${baseName}${ext}`,
        ext
    };
};

module.exports = getFile;