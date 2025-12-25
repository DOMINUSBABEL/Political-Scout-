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
    <div className="w-20 md:w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-2xl">
      <div className="p-6 flex items-center justify-center md:justify-start space-x-4 border-b border-slate-800 h-20 bg-slate-950/50">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-900/20">
          C
        </div>
        <div className="hidden md:block">
          <h1 className="font-bold text-lg text-white tracking-widest leading-none">CANDIDATO.AI</h1>
          <span className="text-[10px] text-slate-500 font-mono">WAR ROOM v3.0</span>
        </div>
      </div>

      <div className="flex-1 py-8 space-y-3 px-3">
        <button
          onClick={() => setMode(AppMode.DEFENSE)}
          className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 group ${
            currentMode === AppMode.DEFENSE 
              ? 'bg-gradient-to-r from-emerald-900/40 to-slate-900 text-emerald-400 border border-emerald-900/50 shadow-inner' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="hidden md:block font-medium tracking-wide">{t(lang, 'navDefense')}</span>
        </button>

        <button
          onClick={() => setMode(AppMode.TRANSLATOR)}
          className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 group ${
            currentMode === AppMode.TRANSLATOR 
              ? 'bg-gradient-to-r from-emerald-900/40 to-slate-900 text-emerald-400 border border-emerald-900/50 shadow-inner' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span className="hidden md:block font-medium tracking-wide">{t(lang, 'navTranslator')}</span>
        </button>
        
        <button
          onClick={() => setMode(AppMode.NETWORK)}
          className={`w-full flex items-center p-4 rounded-xl transition-all duration-200 group ${
            currentMode === AppMode.NETWORK 
              ? 'bg-gradient-to-r from-emerald-900/40 to-slate-900 text-emerald-400 border border-emerald-900/50 shadow-inner' 
              : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:mr-3 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <span className="hidden md:block font-medium tracking-wide">{t(lang, 'navNetwork')}</span>
        </button>
      </div>

      {/* Language Selector */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <p className="hidden md:block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider pl-1">Language / Idioma</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {(['ES', 'EN', 'FR', 'DE'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`py-1.5 px-1 rounded text-[10px] md:text-xs font-bold border transition-all ${
                lang === l 
                  ? 'bg-emerald-600 border-emerald-500 text-white' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
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