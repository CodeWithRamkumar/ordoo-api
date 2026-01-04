const express = require('express');
const { upload, uploadSingle, uploadChunk } = require('../controllers/uploadController');
const auth = require('../middleware/auth');

const router = express.Router();

// Single file upload
router.post('/upload', auth, upload.single('file'), uploadSingle);

// Chunked file upload
router.post('/upload-chunk', auth, upload.single('chunk'), uploadChunk);

module.exports = router;