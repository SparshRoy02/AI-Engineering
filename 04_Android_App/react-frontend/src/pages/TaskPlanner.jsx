import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Trash2, Loader2, Sparkles, Check } from 'lucide-react';
import '../App.css';
import './feature-page.css';

const BACKEND_URL = 'http://localhost:3000';
const STORAGE_KEY = 'ai_tasks_v1';

export default function TaskPlanner() {
  const [goal, setGoal] = useState('');
  const [tasks, setTasks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });
  const [newTask, setNewTask] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const generateTasks = async () => {
    if (!goal.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Break down the following goal into clear, actionable, and specific tasks. Return ONLY a numbered list of tasks (e.g., "1. Do this", "2. Do that"), without any extra explanation or headers. Goal: "${goal}"`
          }],
          model: 'llama3'
        }),
      });
      const data = await res.json();
      const result = data.message?.content || '';

      // Parse numbered list
      const lines = result.split('\n').filter(l => l.trim());
      const parsed = lines
        .filter(l => /^\d+[\.\)]/.test(l.trim()))
        .map((l, i) => ({
          id: Date.now().toString() + i,
          text: l.replace(/^\d+[\.\)]\s*/, '').trim(),
          completed: false,
        }));

      if (parsed.length > 0) {
        setTasks(prev => [...parsed, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setGoal('');
    }
  };

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addManualTask = (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    setTasks(prev => [{
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
    }, ...prev]);
    setNewTask('');
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="page-container">
      <header className="page-header">
        <div className="header-content">
          <CheckSquare className="bot-icon" size={28} />
          <h1>AI Task Planner</h1>
        </div>
      </header>
      <main className="chat-content">
        <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* AI Goal Breakdown */}
          <div className="feature-panel">
            <h2 className="panel-title">Break Down a Goal with AI</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input
                className="text-input"
                style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', flex: 1 }}
                value={goal}
                onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Build a full-stack web application"
                onKeyDown={e => e.key === 'Enter' && generateTasks()}
              />
              <button className="feature-btn primary-btn" style={{ flexShrink: 0 }} onClick={generateTasks} disabled={!goal.trim() || isGenerating}>
                {isGenerating ? <><Loader2 className="spinner" size={16} /> Generating...</> : <><Sparkles size={16} /> Generate Tasks</>}
              </button>
            </div>
          </div>

          {/* Manual Add Task */}
          <form onSubmit={addManualTask} style={{ display: 'flex', gap: '1rem' }}>
            <input
              className="text-input"
              style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', flex: 1 }}
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              placeholder="Add a task manually..."
            />
            <button type="submit" className="feature-btn accent-btn" style={{ flexShrink: 0 }}>
              <Plus size={18} /> Add Task
            </button>
          </form>

          {/* Progress */}
          {tasks.length > 0 && (
            <div className="progress-bar-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Progress</span>
                <span style={{ color: '#a5b4fc', fontSize: '0.85rem', fontWeight: 600 }}>{completedCount} / {tasks.length}</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="tasks-list">
            {tasks.length === 0 && (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
                No tasks yet. Enter a goal above or add tasks manually!
              </p>
            )}
            {tasks.map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
                <button className="task-check-btn" onClick={() => toggleTask(task.id)}>
                  {task.completed ? <Check size={16} color="#22c55e" /> : <div className="task-check-empty" />}
                </button>
                <span className="task-text">{task.text}</span>
                <button className="delete-note-btn" onClick={() => deleteTask(task.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
