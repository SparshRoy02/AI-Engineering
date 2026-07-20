const { Ollama } = require('ollama');
const { PDFParse } = require('pdf-parse');
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

// Prompts based on features
const systemPrompts = {
  chat: "You are a helpful AI assistant. Provide concise and accurate answers.",
  blog: "You are an expert copywriter. Write an engaging and SEO-friendly blog post based on the given topic.",
  resume: "You are an HR expert. Analyze the provided resume text and give constructive feedback on how to improve it.",
  pdf: "You are a speed-reading expert. Summarize the provided text extracting the key points.",
  email: "You are an expert communicator. Write a professional and concise reply to the following email.",
  form: "Based on the provided context, complete the missing fields appropriately.",
  faq: "Generate a list of Frequently Asked Questions with answers based on the following topic.",
  docs: "Generate comprehensive technical documentation for the following code or project.",
  project: "Write an appealing and professional project description for the following concept.",
  smart_search: "You are an expert researcher. Synthesize the provided information into a clear and factual answer."
};

exports.chat = async (req, res) => {
  try {
    const { messages, feature = 'chat', temperature = 0.7 } = req.body;
    
    // Setup system prompt if not present
    let finalMessages = [...messages];
    if (finalMessages.length > 0 && finalMessages[0].role !== 'system') {
      finalMessages.unshift({ role: 'system', content: systemPrompts[feature] || systemPrompts['chat'] });
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const response = await ollama.chat({
      model: 'llama3',
      messages: finalMessages,
      stream: true,
      options: {
        temperature: parseFloat(temperature),
      }
    });

    for await (const part of response) {
      res.write(part.message.content);
    }
    res.end();
  } catch (error) {
    console.error('Error in chat:', error.message || error);
    const isOllamaDown = error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED');
    const message = isOllamaDown ? 'Ollama is not running. Start Ollama and try again.' : `Failed to generate response: ${error.message}`;
    if (!res.headersSent) res.status(500).json({ error: message });
  }
};

exports.generate = async (req, res) => {
  try {
    const { prompt, feature = 'chat', temperature = 0.7 } = req.body;
    
    const systemPrompt = systemPrompts[feature] || systemPrompts['chat'];
    const fullPrompt = `${systemPrompt}\n\nUser Request: ${prompt}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const response = await ollama.generate({
      model: 'llama3',
      prompt: fullPrompt,
      stream: true,
      options: {
        temperature: parseFloat(temperature),
      }
    });

    for await (const part of response) {
      res.write(part.response);
    }
    res.end();
  } catch (error) {
    console.error('Error in generate:', error.message || error);
    const isOllamaDown = error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED');
    const message = isOllamaDown ? 'Ollama is not running. Start Ollama and try again.' : `Failed to generate response: ${error.message}`;
    if (!res.headersSent) res.status(500).json({ error: message });
  }
};
exports.uploadAndGenerate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { feature = 'resume' } = req.body;
    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      const parser = new PDFParse({ data: req.file.buffer });
      await parser.load();
      const result = await parser.getText();
      extractedText = result.text || '';
    } else {
      // Plain text files
      extractedText = req.file.buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Could not extract text from the file.' });
    }

    const systemPrompt = systemPrompts[feature] || systemPrompts['resume'];
    const fullPrompt = `${systemPrompt}\n\nResume Content:\n\n${extractedText}`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const response = await ollama.generate({
      model: 'llama3',
      prompt: fullPrompt,
      stream: true,
      options: { temperature: 0.5 }
    });

    for await (const part of response) {
      res.write(part.response);
    }
    res.end();
  } catch (error) {
    console.error('Error in uploadAndGenerate:', error.message || error);
    const isOllamaDown = error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED');
    const message = isOllamaDown ? 'Ollama is not running. Start Ollama and try again.' : `Failed to process file: ${error.message}`;
    if (!res.headersSent) res.status(500).json({ error: message });
  }
};
