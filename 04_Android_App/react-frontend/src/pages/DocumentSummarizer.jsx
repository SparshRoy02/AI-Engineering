import { useState, useRef } from 'react';
import { FileText, Upload, Loader2, Sparkles } from 'lucide-react';
import '../App.css';
import './feature-page.css';

const BACKEND_URL = 'http://localhost:3000';

export default function DocumentSummarizer() {
  const [docText, setDocText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setSummary('');

    const reader = new FileReader();
    reader.onload = (event) => {
      setDocText(event.target.result);
    };
    reader.readAsText(file);
  };

  const summarize = async () => {
    if (!docText.trim()) return;
    setIsLoading(true);
    setSummary('');
    try {
      const truncated = docText.substring(0, 6000); // Limit context size
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Please summarize the following document in a clear, structured way. Include key points, main topics, and any important conclusions:\n\n---\n${truncated}\n---`
          }],
          model: 'llama3'
        }),
      });
      const data = await res.json();
      setSummary(data.message?.content || 'Could not generate summary.');
    } catch (err) {
      setSummary('Error connecting to AI backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <FileText className="bot-icon" size={28} />
          <h1>Document Summarizer</h1>
        </div>
      </header>
      <main className="chat-content">
        <div className="feature-layout">
          {/* Left: Input */}
          <div className="feature-panel">
            <h2 className="panel-title">Your Document</h2>

            <div className="upload-zone-small" onClick={() => fileInputRef.current?.click()}>
              <Upload size={24} color="#6366f1" />
              <span>{fileName || 'Upload .txt file'}</span>
            </div>
            <input type="file" accept=".txt,.md,.csv" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

            <p className="or-divider">— or paste text below —</p>

            <textarea
              className="doc-textarea"
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste your document content here..."
              rows={12}
            />

            <div className="char-count">{docText.length.toLocaleString()} characters</div>

            <button className="feature-btn primary-btn" onClick={summarize} disabled={!docText.trim() || isLoading}>
              {isLoading ? <><Loader2 className="spinner" size={18} /> Summarizing...</> : <><Sparkles size={18} /> Summarize with AI</>}
            </button>
          </div>

          {/* Right: Summary */}
          <div className="feature-panel">
            <h2 className="panel-title">AI Summary</h2>
            <div className="ai-result-box" style={{ flex: 1, minHeight: '300px' }}>
              {summary ? (
                <p style={{ whiteSpace: 'pre-wrap' }}>{summary}</p>
              ) : (
                <span className="placeholder-text">Your AI-generated summary will appear here...</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
