import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import '../App.css';

const BACKEND_URL = 'http://localhost:3000';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // When speech ends, send it to the AI if there's text
        const finalTranscript = document.getElementById('transcript-display')?.innerText;
        if (finalTranscript?.trim()) {
          processVoiceInput(finalTranscript.trim());
        }
      };
    } else {
      setResponse("Speech Recognition API is not supported in this browser. Please use Chrome or Edge.");
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setResponse('');
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const processVoiceInput = async (text) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          model: 'llama3'
        }),
      });

      if (!res.ok) throw new Error('Failed to fetch from backend');
      
      const data = await res.json();
      const aiText = data.message?.content || 'I could not generate a response.';
      
      setResponse(aiText);
      speakResponse(aiText);
    } catch (error) {
      console.error(error);
      setResponse('Error communicating with the AI backend.');
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to find a good English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.lang === 'en-US');
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <Volume2 className="bot-icon" size={28} />
          <h1>AI Voice Assistant</h1>
        </div>
      </header>

      <main className="chat-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div className="voice-status">
          {isProcessing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#a5b4fc' }}>
              <Loader2 className="spinner" size={24} /> Processing your request...
            </div>
          ) : isListening ? (
            <div style={{ color: '#ef4444', fontWeight: 'bold' }}>Listening...</div>
          ) : (
            <div style={{ color: '#94a3b8' }}>Tap the microphone and start speaking</div>
          )}
        </div>

        <button 
          onClick={toggleListening}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            border: 'none',
            background: isListening ? '#ef4444' : 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            margin: '2rem 0',
            boxShadow: isListening ? '0 0 30px rgba(239, 68, 68, 0.6)' : '0 10px 25px rgba(99, 102, 241, 0.4)',
            transition: 'all 0.3s ease',
            transform: isListening ? 'scale(1.1)' : 'scale(1)'
          }}
        >
          {isListening ? <MicOff size={48} /> : <Mic size={48} />}
        </button>

        <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(30, 41, 59, 0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', minHeight: '100px' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>You Said:</h3>
          <p id="transcript-display" style={{ fontSize: '1.1rem', color: '#f8fafc', minHeight: '24px' }}>
            {transcript || '...'}
          </p>
        </div>

        {response && (
          <div style={{ width: '100%', maxWidth: '600px', background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.85rem', color: '#a5b4fc', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Llama 3 Reply:</h3>
            <p style={{ fontSize: '1.1rem', color: '#f8fafc', lineHeight: '1.6' }}>
              {response}
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
