import { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Loader2, Sparkles, X } from 'lucide-react';
import '../App.css';
import './feature-page.css';

const BACKEND_URL = 'http://localhost:3000';
const STORAGE_KEY = 'ai_notes_v1';

export default function AINote() {
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [activeNote, setActiveNote] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  const createNote = () => {
    const note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      tags: [],
      createdAt: new Date().toISOString(),
    };
    setNotes(prev => [note, ...prev]);
    setActiveNote(note);
  };

  const updateNote = (field, value) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    setNotes(prev => prev.map(n => n.id === updated.id ? updated : n));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  const enhanceWithAI = async () => {
    if (!activeNote?.content) return;
    setIsEnhancing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Enhance and improve the following note. Make it cleaner, add structure with headings if appropriate, and also suggest 3-5 short tags (return them on a new line starting with "Tags:"). Here's the note:\n\n${activeNote.content}`
          }],
          model: 'llama3'
        }),
      });
      const data = await res.json();
      const result = data.message?.content || '';
      
      // Extract tags if returned
      const tagsMatch = result.match(/Tags?:\s*(.+)/i);
      const tags = tagsMatch 
        ? tagsMatch[1].split(',').map(t => t.trim().replace(/^#/, ''))
        : [];
      const cleanContent = result.replace(/Tags?:.+$/im, '').trim();

      updateNote('content', cleanContent);
      if (tags.length > 0) updateNote('tags', tags);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <StickyNote className="bot-icon" size={28} />
          <h1>AI Notes</h1>
        </div>
      </header>
      <main style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Notes List */}
        <div className="notes-sidebar">
          <button className="feature-btn primary-btn" style={{ margin: '1rem', width: 'calc(100% - 2rem)' }} onClick={createNote}>
            <Plus size={18} /> New Note
          </button>
          <div className="notes-list">
            {notes.length === 0 && <p style={{ color: '#94a3b8', padding: '0 1rem', fontSize: '0.9rem' }}>No notes yet. Create one!</p>}
            {notes.map(note => (
              <div
                key={note.id}
                className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
                onClick={() => setActiveNote(note)}
              >
                <div className="note-item-title">{note.title}</div>
                <div className="note-item-preview">{note.content.substring(0, 50) || 'Empty note...'}</div>
                <button className="delete-note-btn" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Note Editor */}
        {activeNote ? (
          <div className="note-editor">
            <div className="note-editor-toolbar">
              <input
                className="note-title-input"
                value={activeNote.title}
                onChange={e => updateNote('title', e.target.value)}
                placeholder="Note Title..."
              />
              <button className="feature-btn accent-btn" onClick={enhanceWithAI} disabled={!activeNote.content || isEnhancing}>
                {isEnhancing ? <><Loader2 className="spinner" size={16} /> Enhancing...</> : <><Sparkles size={16} /> Enhance with AI</>}
              </button>
            </div>

            {activeNote.tags?.length > 0 && (
              <div className="note-tags">
                {activeNote.tags.map(tag => (
                  <span key={tag} className="tag-chip">#{tag}</span>
                ))}
              </div>
            )}

            <textarea
              className="note-content-area"
              value={activeNote.content}
              onChange={e => updateNote('content', e.target.value)}
              placeholder="Start writing your note here... You can use AI to enhance it!"
            />
          </div>
        ) : (
          <div className="note-editor" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
            <div style={{ textAlign: 'center' }}>
              <StickyNote size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p>Select a note or create a new one</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
