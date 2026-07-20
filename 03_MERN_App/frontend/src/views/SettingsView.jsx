import React, { useState } from 'react';
import { Save } from 'lucide-react';
import './SettingsView.css';

const SettingsView = () => {
  const [model, setModel] = useState('llama3');
  const [temperature, setTemperature] = useState(0.7);

  const handleSave = (e) => {
    e.preventDefault();
    // In a real app, this would save to a context, local storage, or backend.
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-view glass-panel animate-fade-in">
      <header className="settings-header">
        <h2>AI Settings</h2>
      </header>
      
      <div className="settings-content">
        <form onSubmit={handleSave} className="settings-form">
          <div className="form-group">
            <label htmlFor="model">Ollama Model</label>
            <select 
              id="model" 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              className="settings-input"
            >
              <option value="llama3">Llama 3</option>
              <option value="mistral">Mistral</option>
              <option value="gemma">Gemma</option>
              <option value="phi3">Phi-3</option>
            </select>
            <small>Ensure you have pulled the selected model using `ollama run &lt;model&gt;`.</small>
          </div>

          <div className="form-group">
            <label htmlFor="temperature">Temperature: {temperature}</label>
            <input 
              type="range" 
              id="temperature" 
              min="0" 
              max="1" 
              step="0.1" 
              value={temperature} 
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="settings-slider"
            />
            <div className="slider-labels">
              <span>Precise (0.0)</span>
              <span>Creative (1.0)</span>
            </div>
          </div>

          <button type="submit" className="btn-primary btn-save">
            <Save size={18} />
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsView;
