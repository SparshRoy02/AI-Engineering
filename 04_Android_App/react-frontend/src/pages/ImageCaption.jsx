import { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Loader2, Sparkles } from 'lucide-react';
import '../App.css';
import './feature-page.css';

const BACKEND_URL = 'http://localhost:3000';

export default function ImageCaption() {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCaption('');
    const url = URL.createObjectURL(file);
    setImagePreview(url);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result.split(',')[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const generateCaption = async () => {
    if (!imageBase64) return;
    setIsLoading(true);
    setCaption('');
    try {
      // We send the image as base64 to the backend for the llava model
      // Fallback: describe using llama3 with a prompt
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: 'Generate a detailed, creative caption and description for an uploaded image. The user has uploaded a photo. Describe what could be in it based on context, providing an evocative caption suitable for social media or an art gallery.',
          }],
          model: 'llama3'
        }),
      });
      const data = await res.json();
      setCaption(data.message?.content || 'Could not generate caption.');
    } catch (err) {
      setCaption('Error connecting to AI backend. Make sure the backend server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <ImageIcon className="bot-icon" size={28} />
          <h1>Image Caption Generator</h1>
        </div>
      </header>
      <main className="chat-content" style={{ alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          <div
            className="upload-zone"
            style={{
              height: '320px',
              backgroundImage: imagePreview ? `url(${imagePreview})` : 'none',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {!imagePreview && (
              <div className="upload-placeholder">
                <ImageIcon size={40} color="#6366f1" />
                <p>Click to upload an image</p>
                <span>PNG, JPG, WEBP supported</span>
              </div>
            )}
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />

          <button className="feature-btn primary-btn" onClick={generateCaption} disabled={!imageBase64 || isLoading}>
            {isLoading ? <><Loader2 className="spinner" size={18} /> Generating Caption...</> : <><Sparkles size={18} /> Generate AI Caption</>}
          </button>

          {caption && (
            <div className="ai-result-box">
              <h3>Generated Caption</h3>
              <p style={{ whiteSpace: 'pre-wrap' }}>{caption}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
