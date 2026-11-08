const ragService = require('../services/rag');

const queryGlobalLabRAG = async (req,res,next) =>{
    try {
            const response = await ragService.queryGlobalLabRAG(req.body.query,5);
            res.status(200).json({ 
                response
            });
        } catch (error) {
            next(error);
        }
}

module.exports = {
    queryGlobalLabRAG
};