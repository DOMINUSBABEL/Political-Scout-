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
    <div className="flex min-h-screen bg-mariate-dark relative overflow-hidden text-slate-200">
      {/* SOTA Ambient Background Layers */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0 opacity-60"></div>
      <div className="fixed -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse-slow"></div>
      <div className="fixed bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

      {/* Sidebar Navigation */}
      <Nav 
        currentMode={currentMode} 
        setMode={setCurrentMode} 
        lang={language}
        setLang={setLanguage}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-20 md:ml-72 p-4 md:p-8 overflow-y-auto h-screen relative z-10 scroll-smooth">
        <div className="max-w-7xl mx-auto h-full pb-10 flex flex-col">
          <div className="flex-1">
             {currentMode === AppMode.DEFENSE && <DefenseMode lang={language} />}
             {currentMode === AppMode.TRANSLATOR && <TranslatorMode />}
             {currentMode === AppMode.NETWORK && <NetworkAnalysisMode lang={language} />}
          </div>
        
          {/* Professional Footer Branding */}
          <div className="w-full text-center py-8 text-slate-600 text-[10px] font-mono font-medium tracking-[0.3em] uppercase border-t border-white/5 mt-12">
            {t(language, 'footer')} &bull; SYSTEM STATUS: <span className="text-emerald-500">ONLINE</span>
          </div>
        </div>
      </main>

      {!process.env.API_KEY && (
        <div className="fixed bottom-4 right-4 bg-red-600/90 backdrop-blur text-white px-4 py-2 rounded shadow-lg z-50 font-bold text-sm border border-red-400">
          WARNING: process.env.API_KEY is missing.
        </div>
      )}
    </div>
  );
}

export default App;