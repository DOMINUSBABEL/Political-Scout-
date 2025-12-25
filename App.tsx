import React, { useState } from 'react';
import { Nav } from './components/Nav';
import { DefenseMode } from './components/DefenseMode';
import { TranslatorMode } from './components/TranslatorMode';
import { NetworkAnalysisMode } from './components/NetworkAnalysisMode';
import { Login } from './components/Login';
import { AppMode, Language } from './types';
import { t } from './utils/translations';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.DEFENSE);
  const [language, setLanguage] = useState<Language>('ES');

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} lang={language} setLang={setLanguage} />;
  }

  return (
    <div className="flex min-h-screen bg-mariate-dark relative">
      {/* Sidebar Navigation */}
      <Nav 
        currentMode={currentMode} 
        setMode={setCurrentMode} 
        lang={language}
        setLang={setLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-20 md:ml-72 p-4 md:p-8 overflow-y-auto h-screen relative z-10">
        <div className="max-w-7xl mx-auto h-full pb-10">
          {currentMode === AppMode.DEFENSE && <DefenseMode lang={language} />}
          {currentMode === AppMode.TRANSLATOR && <TranslatorMode />}
          {currentMode === AppMode.NETWORK && <NetworkAnalysisMode lang={language} />}
        </div>
        
        {/* Professional Footer Branding */}
        <div className="w-full text-center py-6 text-slate-700 text-[10px] font-medium tracking-widest uppercase border-t border-slate-800/50 mt-auto">
          {t(language, 'footer')}
        </div>
      </main>

      {/* Optional: Simple API Key check warning if not present (handled by geminiService mostly) */}
      {!process.env.API_KEY && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 font-bold text-sm">
          WARNING: process.env.API_KEY is missing.
        </div>
      )}
    </div>
  );
}

export default App;