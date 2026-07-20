const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Chat endpoint (streaming)
router.post('/chat', aiController.chat);

// General generate endpoint
router.post('/generate', aiController.generate);

// PDF Upload and generate endpoint
router.post('/upload', upload.single('file'), aiController.uploadAndGenerate);

module.exports = router;
