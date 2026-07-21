import { useState, useRef } from 'react';
import { ScanText, Upload, Loader2, Sparkles, Copy, Check, FileText } from 'lucide-react';
import '../App.css';
import './feature-page.css';

const BACKEND_URL = 'http://localhost:3000';

export default function OCRScanner() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPdfFile(null);
    setExtractedText('');
    setAiAnalysis('');
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPdfFile(file);
    setImage(null);
    setImagePreview(null);
    setExtractedText('');
    setAiAnalysis('');
  };

  const runOCR = async () => {
    if (pdfFile) {
      await runPdfExtraction();
      return;
    }
    if (!image) return;
    setIsOcrLoading(true);
    setOcrProgress(0);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.floor(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(image);
      await worker.terminate();
      setExtractedText(text.trim());
    } catch (err) {
      console.error(err);
      setExtractedText('Error running OCR. Please try a different image.');
    } finally {
      setIsOcrLoading(false);
      setOcrProgress(0);
    }
  };

  const runPdfExtraction = async () => {
    setIsOcrLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      console.log('Uploading PDF:', pdfFile.name, pdfFile.type, pdfFile.size);

      const res = await fetch(`${BACKEND_URL}/api/extract-pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('PDF response:', res.status, data);

      if (!res.ok) {
        setExtractedText(`Server error (${res.status}): ${data.error || 'Unknown error'}`);
        return;
      }

      setExtractedText(data.text?.trim() || 'No text found in PDF.');
    } catch (err) {
      console.error('PDF fetch error:', err);
      setExtractedText(`Connection error: ${err.message}. Is the backend running on port 3000?`);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const analyzeWithAI = async () => {
    if (!extractedText) return;
    setIsAiLoading(true);
    setAiAnalysis('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: `Analyze and explain the following text extracted from an image or PDF. Provide a concise, insightful analysis:\n\n${extractedText}` }],
          model: 'llama3'
        }),
      });
      const data = await res.json();
      setAiAnalysis(data.message?.content || 'Could not analyze.');
    } catch (err) {
      setAiAnalysis('Error connecting to AI backend.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyText = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <ScanText className="bot-icon" size={28} />
          <h1>OCR Scanner</h1>
        </div>
      </header>
      <main className="chat-content">
        <div className="feature-layout">
          {/* Left Panel */}
          <div className="feature-panel">
            <h2 className="panel-title">Upload File</h2>
            <div
              className="upload-zone"
              onClick={() => {
                if (!pdfFile) fileInputRef.current?.click();
              }}
              style={{ 
                backgroundImage: imagePreview ? `url(${imagePreview})` : 'none', 
                backgroundSize: 'cover', 
                backgroundPosition: 'center',
                borderColor: pdfFile ? '#6366f1' : 'rgba(99, 102, 241, 0.4)'
              }}
            >
              {pdfFile ? (
                <div className="upload-placeholder">
                  <FileText size={40} color="#6366f1" />
                  <p>{pdfFile.name}</p>
                  <span>PDF Document Attached</span>
                </div>
              ) : !imagePreview ? (
                <div className="upload-placeholder">
                  <Upload size={40} color="#6366f1" />
                  <p>Click to upload an image</p>
                  <span>PNG, JPG, WEBP supported</span>
                </div>
              ) : null}
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="feature-btn accent-btn" 
                style={{ flex: 1, padding: '0.5rem' }} 
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Image
              </button>
              <button 
                className="feature-btn accent-btn" 
                style={{ flex: 1, padding: '0.5rem' }} 
                onClick={() => pdfInputRef.current?.click()}
              >
                Choose PDF
              </button>
            </div>

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
            <input type="file" accept="application/pdf" ref={pdfInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} />

            <button className="feature-btn primary-btn" onClick={runOCR} disabled={(!image && !pdfFile) || isOcrLoading}>
              {isOcrLoading ? (
                <><Loader2 className="spinner" size={18} /> Processing...</>
              ) : (
                <><ScanText size={18} /> {pdfFile ? 'Extract PDF Text' : 'Extract Image Text'}</>
              )}
            </button>
          </div>

          {/* Right Panel */}
          <div className="feature-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ marginBottom: 0 }}>Extracted Text</h2>
              {extractedText && (
                <button className="icon-btn" onClick={copyText}>
                  {copied ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
                </button>
              )}
            </div>
            <div className="text-result-box">
              {extractedText || <span className="placeholder-text">Extracted text will appear here...</span>}
            </div>
            <button className="feature-btn accent-btn" onClick={analyzeWithAI} disabled={!extractedText || isAiLoading}>
              {isAiLoading ? <><Loader2 className="spinner" size={18} /> Analyzing...</> : <><Sparkles size={18} /> Analyze with AI</>}
            </button>
            {aiAnalysis && (
              <div className="ai-result-box">
                <h3>AI Analysis</h3>
                <p>{aiAnalysis}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
