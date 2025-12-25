import React, { useState } from 'react';
import { Nav } from './components/Nav';
import { DefenseMode } from './components/DefenseMode';
import { TranslatorMode } from './components/TranslatorMode';
import { AppMode } from './types';

function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.DEFENSE);

  return (
    <div className="flex min-h-screen bg-mariate-dark">
      {/* Sidebar Navigation */}
      <Nav currentMode={currentMode} setMode={setCurrentMode} />

      {/* Main Content Area */}
      <main className="flex-1 ml-20 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto h-full">
          {currentMode === AppMode.DEFENSE ? (
            <DefenseMode />
          ) : (
            <TranslatorMode />
          )}
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