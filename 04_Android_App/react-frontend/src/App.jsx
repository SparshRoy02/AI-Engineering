import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Chat from './pages/Chat';
import VoiceAssistant from './pages/VoiceAssistant';
import OCRScanner from './pages/OCRScanner';
import DocumentSummarizer from './pages/DocumentSummarizer';
import ImageCaption from './pages/ImageCaption';
import AINote from './pages/AINote';
import TaskPlanner from './pages/TaskPlanner';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Chat />} />
            <Route path="/voice" element={<VoiceAssistant />} />
            <Route path="/ocr" element={<OCRScanner />} />
            <Route path="/summarizer" element={<DocumentSummarizer />} />
            <Route path="/caption" element={<ImageCaption />} />
            <Route path="/notes" element={<AINote />} />
            <Route path="/tasks" element={<TaskPlanner />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
