import React from 'react';
import { AppMode, Language } from '../types';
import { t } from '../utils/translations';

interface NavProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Nav: React.FC<NavProps> = ({ currentMode, setMode, lang, setLang }) => {
  return (
    <div className="w-20 md:w-72 h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-white/5 bg-slate-950/70 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60 shadow-2xl">
      
      {/* Brand Header */}
      <div className="p-6 flex items-center justify-center md:justify-start gap-4 border-b border-white/5 h-24 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] relative z-10">
          C
        </div>
        <div className="hidden md:block relative z-10">
          <h1 className="font-bold text-lg text-white tracking-[0.2em] leading-none">CANDIDATO.AI</h1>
          <div className="flex items-center gap-2 mt-1">
             <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono">WAR ROOM v3.1</span>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-8 space-y-2 px-3">
        {[
          { id: AppMode.DEFENSE, label: t(lang, 'navDefense'), icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
          { id: AppMode.TRANSLATOR, label: t(lang, 'navTranslator'), icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" },
          { id: AppMode.NETWORK, label: t(lang, 'navNetwork'), icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 group relative overflow-hidden ${
              currentMode === item.id 
                ? 'text-white bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)]' 
                : 'text-slate-500 hover:text-white hover:bg-white/5'
            }`}
          >
            {/* Active Glow Bar */}
            {currentMode === item.id && (
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_10px_#10B981]"></div>
            )}
            
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 md:mr-4 transition-transform duration-300 ${currentMode === item.id ? 'text-emerald-400 scale-110' : 'group-hover:text-emerald-400 group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={currentMode === item.id ? 2.5 : 2} d={item.icon} />
            </svg>
            <span className={`hidden md:block font-medium tracking-wide text-sm ${currentMode === item.id ? 'font-bold' : ''}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Language Selector */}
      <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-sm">
        <p className="hidden md:block text-[10px] font-bold text-slate-500 mb-3 uppercase tracking-widest pl-1 font-mono">System Language</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['ES', 'EN', 'FR', 'DE'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`py-1.5 rounded text-[10px] font-bold border transition-all duration-300 ${
                lang === l 
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                  : 'bg-slate-900/50 border-slate-700/50 text-slate-500 hover:border-slate-500 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};