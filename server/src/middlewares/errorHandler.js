const APIError = require('../../utils/APIError');

module.exports = (err, req, res, next) => {
    console.error("❌❌ Error:", err.stack);

    if (err instanceof APIError) {
        return res.status(err.statusCode).json({ message: err.message, success: false, isClientError: err.isClientError })
    }

    if (err.code === '23505') { 
        return res.status(400).json({ message: "Unique constraint failure", success: false, isClientError: true });
    }
    
    if (err.code === '23503') { 
        return res.status(400).json({ message: "Foreign key constraint failure", success: false, isClientError: true });
    }
    res.status(500).json({ message: "an error happend", success: false, isClientError: false })
}