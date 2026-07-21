const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Ollama } = require('ollama');

const multer = require('multer');
const PDFParser = require('pdf2json');

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const app = express();
const port = process.env.PORT || 3000;

// Initialize Ollama client
// Assuming Ollama is running locally on the default port
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running' });
});

// PDF Extraction Endpoint
app.post('/api/extract-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const text = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, 1);
      pdfParser.on('pdfParser_dataReady', () => {
        resolve(pdfParser.getRawTextContent());
      });
      pdfParser.on('pdfParser_dataError', (err) => {
        reject(err.parserError || new Error('PDF parse error'));
      });
      pdfParser.parseBuffer(req.file.buffer);
    });

    res.json({ text: text.trim() });
  } catch (error) {
    console.error('Error parsing PDF:', error);
    res.status(500).json({ error: `Failed to extract PDF: ${error.message}` });
  }
});

// Basic Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model = 'llama3' } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const response = await ollama.chat({
      model: model,
      messages: messages,
      stream: false,
    });

    res.json(response);
  } catch (error) {
    console.error('Error calling Ollama:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

// Streaming Chat Endpoint
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { messages, model = 'llama3' } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await ollama.chat({
      model: model,
      messages: messages,
      stream: true,
    });

    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error streaming from Ollama:', error);
    res.write(`data: ${JSON.stringify({ error: 'Failed to stream response' })}\n\n`);
    res.end();
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});
