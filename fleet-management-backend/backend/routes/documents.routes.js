const express = require('express');
const router = express.Router();
const { getAllDocuments, updateDocument, deleteDocument } = require('../controllers/documents.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getAllDocuments);
router.put('/:id', requireAuth, updateDocument);
router.delete('/:id', requireAuth, deleteDocument);

module.exports = router;
