import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Loader, Briefcase, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ResumeView.css';

const ResumeView = () => {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = (selectedFile) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (!allowed.includes(selectedFile.type)) {
      setError('Only PDF and TXT files are supported.');
      return;
    }
    setError('');
    setFile(selectedFile);
    setResponse('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResponse('');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file && !textInput.trim()) return;
    setIsLoading(true);
    setResponse('');
    setError('');

    try {
      let prompt = '';

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('feature', 'resume');

        const uploadRes = await fetch('http://localhost:3001/api/ai/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed (HTTP ${uploadRes.status})`);
        }

        const reader = uploadRes.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            setResponse(prev => prev + decoder.decode(value, { stream: true }));
          }
        }
      } else {
        // Plain text analysis
        const res = await fetch('http://localhost:3001/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: textInput }],
            feature: 'resume',
            temperature: 0.5,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Analysis failed (HTTP ${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            setResponse(prev => prev + decoder.decode(value, { stream: true }));
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Analysis failed. Make sure the backend and Ollama are running.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="resume-view glass-panel animate-fade-in">
      <header className="resume-header">
        <div className="resume-header-icon">
          <Briefcase size={24} />
        </div>
        <div>
          <h2>Resume Analysis</h2>
          <p>Upload your resume or paste the text for AI-powered feedback</p>
        </div>
      </header>

      <div className="resume-body">
        {/* Left Panel - Input */}
        <div className="resume-input-panel">
          {/* Drop Zone */}
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="file-preview">
                <FileText size={32} className="file-icon" />
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                </div>
                <button className="btn-icon file-remove" onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}>
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="drop-zone-content">
                <Upload size={36} className="upload-icon" />
                <p className="drop-title">Drop your resume here</p>
                <p className="drop-sub">or <span>click to browse</span></p>
                <p className="drop-hint">Supports PDF, TXT</p>
              </div>
            )}
          </div>

          <div className="divider">
            <span>or paste resume text</span>
          </div>

          <textarea
            className="resume-textarea"
            placeholder="Paste your resume content here..."
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={10}
            disabled={!!file}
          />

          {error && <p className="error-message">{error}</p>}

          <button
            className="btn-primary btn-analyze"
            onClick={handleAnalyze}
            disabled={isLoading || (!file && !textInput.trim())}
          >
            {isLoading
              ? <><Loader size={18} className="spin" /> Analyzing...</>
              : <><Send size={18} /> Analyze Resume</>
            }
          </button>
        </div>

        {/* Right Panel - Results */}
        <div className="resume-result-panel">
          <h3>AI Feedback</h3>
          {!response && !isLoading && (
            <div className="result-empty">
              <p>Your AI analysis will appear here...</p>
            </div>
          )}
          {isLoading && !response && (
            <div className="result-empty">
              <Loader size={24} className="spin" />
              <p>Analyzing your resume...</p>
            </div>
          )}
          {response && (
            <div className="result-content">
              <ReactMarkdown>{response}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeView;
