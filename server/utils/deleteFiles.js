const fs = require('fs/promises');

/**
 * Deletes physically stored files from disk when an operation fails
 * @param {Object|Array|Object} files - req.file or req.files from Multer
 */
const deleteFiles = async (files) => {
    if (!files) return;

    let fileList = [];

    if (Array.isArray(files)) {
        fileList = files;
    } else if (typeof files === 'object' && files.path) {
        fileList = [files];
    } else if (typeof files === 'object') {
        fileList = Object.values(files).flat();
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