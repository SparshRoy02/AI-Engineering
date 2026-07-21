import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  Mic, 
  ScanText, 
  FileText, 
  Image as ImageIcon, 
  StickyNote, 
  CheckSquare 
} from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Chat', path: '/', icon: MessageSquare },
    { name: 'Voice Assistant', path: '/voice', icon: Mic },
    { name: 'OCR Scanner', path: '/ocr', icon: ScanText },
    { name: 'Summarizer', path: '/summarizer', icon: FileText },
    { name: 'Image Caption', path: '/caption', icon: ImageIcon },
    { name: 'AI Notes', path: '/notes', icon: StickyNote },
    { name: 'Task Planner', path: '/tasks', icon: CheckSquare },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">AI</div>
          <h2>Llama 3 Web</h2>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
      
      <div className="sidebar-footer">
        <p>Powered by Ollama</p>
      </div>
    </aside>
  );
}
