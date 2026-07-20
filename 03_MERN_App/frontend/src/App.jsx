import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { MessageSquare, Settings, FileText, Briefcase, Mail, Search, FileQuestion, BookOpen, Presentation } from 'lucide-react';
import ChatView from './views/ChatView';
import SettingsView from './views/SettingsView';
import ResumeView from './views/ResumeView';
import './App.css';

const SidebarItem = ({ icon: Icon, label, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`sidebar-item ${isActive ? 'active' : ''}`}>
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <aside className="sidebar glass-panel">
          <div className="sidebar-header">
            <h2>Antigravity AI</h2>
          </div>
          <nav className="sidebar-nav">
            <SidebarItem to="/" icon={MessageSquare} label="Chat" />
            <SidebarItem to="/search" icon={Search} label="Smart Search" />
            <SidebarItem to="/blog" icon={FileText} label="Blog Writer" />
            <SidebarItem to="/resume" icon={Briefcase} label="Resume Analysis" />
            <SidebarItem to="/email" icon={Mail} label="Email Reply" />
            <SidebarItem to="/faq" icon={FileQuestion} label="FAQ Gen" />
            <SidebarItem to="/docs" icon={BookOpen} label="Docs Gen" />
            <SidebarItem to="/project" icon={Presentation} label="Project Gen" />
          </nav>
          <div className="sidebar-footer">
            <SidebarItem to="/settings" icon={Settings} label="Settings" />
          </div>
        </aside>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ChatView feature="chat" title="AI Chatbot" />} />
            <Route path="/search" element={<ChatView feature="smart_search" title="Smart Search" />} />
            <Route path="/blog" element={<ChatView feature="blog" title="Blog Writer" />} />
            <Route path="/resume" element={<ResumeView />} />
            <Route path="/email" element={<ChatView feature="email" title="Email Reply Generator" />} />
            <Route path="/faq" element={<ChatView feature="faq" title="FAQ Generator" />} />
            <Route path="/docs" element={<ChatView feature="docs" title="Documentation Gen" />} />
            <Route path="/project" element={<ChatView feature="project" title="Project Description Gen" />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
