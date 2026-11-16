const getWorkspaceSchema = require('./getWorkspaceSchema')  ;
const getMessagesSchema = require('./getMessagesSchema')  ;
const sendMessageSchema = require('./sendMessageSchema')  ;
const editMessageSchema = require('./editMessageSchema')  ;
const deleteMessageSchema = require('./deleteMessageSchema')  ;
const downloadDocumentSchema = require('./downloadDocumentSchema')  ;



module.exports = {
    getWorkspaceSchema,
    getMessagesSchema,
    sendMessageSchema,
    editMessageSchema,
    deleteMessageSchema,
    downloadDocumentSchema
};
