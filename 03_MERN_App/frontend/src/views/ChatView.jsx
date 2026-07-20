import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import './ChatView.css';

const ChatView = ({ feature, title }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset messages when feature changes
  useEffect(() => {
    setMessages([]);
  }, [feature]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          feature,
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          setMessages(prev => {
            const updated = [...prev];
            const lastMessageIndex = updated.length - 1;
            const lastMessage = updated[lastMessageIndex];
            if (lastMessage.role === 'assistant') {
              updated[lastMessageIndex] = {
                ...lastMessage,
                content: lastMessage.content + chunk
              };
            }
            return updated;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please make sure the backend and Ollama are running.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-view glass-panel animate-fade-in">
      <header className="chat-header">
        <h2>{title}</h2>
      </header>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Start a conversation with {title}...</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.role === 'assistant' ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="chat-input"
        />
        <button type="submit" className="btn-primary btn-send" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader className="spin" size={20} /> : <Send size={20} />}
        </button>
      </form>
    </div>
  );
};

export default ChatView;
