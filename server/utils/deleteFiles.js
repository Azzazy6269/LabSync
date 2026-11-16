const fs = require('fs/promises');

/**
 * Deletes physically stored files from disk
 * @param {string|Object|Array} files - File path, req.file, or req.files from Multer
 */
const deleteFiles = async (files) => {
    if (!files) return;

    let fileList = [];

    if (typeof files === 'string') {
        fileList = [{ path: files }];
    } else if (Array.isArray(files)) {
        fileList = files.map((file) => (typeof file === 'string' ? { path: file } : file));
    } else if (typeof files === 'object' && files.path) {
        fileList = [files];
    } else if (typeof files === 'object') {
        fileList = Object.values(files)
            .flat()
            .map((file) => (typeof file === 'string' ? { path: file } : file));
    }

    for (const file of fileList) {
        if (file?.path) {
            try {
                await fs.unlink(file.path);
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    console.error(`⚠️ Failed to delete orphan file: ${file.path}`, err.message);
                }
            }
        }
    }
};

module.exports = deleteFiles;