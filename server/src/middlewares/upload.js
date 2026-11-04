const multer = require('multer');
const path = require('path');
const fs = require('fs');
const APIError = require('../../utils/APIError');

// Ensure destination directory exists
const uploadDirectory = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirectory);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname).toLowerCase() || '.pdf';
        const sanitizedBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        cb(null, `${sanitizedBaseName}_${uniqueSuffix}${ext}`);
    }
});

// File filter (Only PDF files accepted)
const pdfFileFilter = (req, file, cb) => {
    const isPdfMime = file.mimetype === 'application/pdf';
    const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';

    if (isPdfMime || isPdfExt) {
        cb(null, true);
    } else {
        cb(new APIError(`Invalid file type for field '${file.fieldname}'. Only PDF files are accepted.`, 400), false);
    }
};

const upload = multer({
    storage,
    fileFilter: pdfFileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024 // 25 MB limit
    }
});

// Wrapper to intercept and format Multer errors nicely
const handleUpload = (multerMiddleware) => (req, res, next) => {
    multerMiddleware(req, res, (err) => {
        if (err) {
            if (err instanceof APIError) {
                return next(err);
            }
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new APIError(`File size exceeds 25MB limit: ${err.field || ''}`, 400));
                }
                if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    return next(new APIError(`Unexpected file field: ${err.field}`, 400));
                }
                return next(new APIError(`File upload error: ${err.message}`, 400));
            }
            return next(new APIError(err.message || 'File upload failed', 400));
        }
        next();
    });
};

const uploadProposalDocs = handleUpload(
    upload.fields([
        { name: 'universityApprovalDoc', maxCount: 1 },
        { name: 'feeReceiptDoc', maxCount: 1 }
    ])
);

const uploadFinalPaperDoc = handleUpload(
    upload.single('finalPaperDoc')
);

module.exports = {
    uploadProposalDocs,
    uploadFinalPaperDoc
};

