
import React from 'react';
import { AppMode, Language, CandidateProfile } from '../types';
import { t } from '../utils/translations';
import { Logo } from './Logo';

interface NavProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  activeProfile: CandidateProfile;
}

export const Nav: React.FC<NavProps> = ({ currentMode, setMode, lang, setLang, activeProfile }) => {
  return (
    <div className="w-20 md:w-72 h-screen fixed left-0 top-0 z-50 flex flex-col border-r border-white/5 bg-slate-950/60 backdrop-blur-2xl">
      
      {/* Brand Header */}
      <div className="p-6 h-28 flex items-center justify-center md:justify-start relative overflow-hidden border-b border-white/5">
        <div className="hidden md:block">
           <Logo className="w-10 h-10" />
        </div>
        <div className="md:hidden">
            <Logo className="w-10 h-10" showText={false} />
        </div>
        
        {/* Subtle scanline */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent animate-scan"></div>
      </div>

      {/* Active Profile Widget */}
      <div className="px-4 pt-6 pb-6">
        <button 
           onClick={() => setMode(AppMode.PROFILE)}
           className="w-full relative group overflow-hidden rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all p-0.5"
        >
           <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-shimmer"></div>
           <div className="flex items-center gap-3 p-2.5">
               <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 shadow-lg relative">
                  {activeProfile.avatar ? (
                    <img src={activeProfile.avatar} alt={activeProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-white text-xs" style={{ backgroundColor: activeProfile.themeColor }}>
                       {activeProfile.name.charAt(0)}
                    </div>
                  )}
               </div>
               <div className="hidden md:block text-left">
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mb-0.5">Active Unit</p>
                  <p className="text-white font-bold text-xs truncate max-w-[140px] tracking-wide">{activeProfile.name}</p>
               </div>
           </div>
        </button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 space-y-2 px-3">
        {[
          { id: AppMode.DEFENSE, label: t(lang, 'navDefense'), icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
          { id: AppMode.TARGETING, label: t(lang, 'navTargeting'), icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
          { id: AppMode.TRANSLATOR, label: t(lang, 'navTranslator'), icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" },
          { id: AppMode.NETWORK, label: t(lang, 'navNetwork'), icon: "M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" },
          { id: AppMode.PROFILE, label: t(lang, 'navProfile'), icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMode(item.id)}
            className={`w-full flex items-center p-3 rounded-lg transition-all duration-300 group relative overflow-hidden ${
              currentMode === item.id 
                ? 'text-white bg-emerald-900/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            {/* Active Indicator LED */}
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full transition-all duration-300 ${
               currentMode === item.id ? 'bg-emerald-500 shadow-[0_0_12px_#10B981]' : 'bg-transparent w-0'
            }`}></div>
            
            <div className="ml-2 mr-3 relative z-10">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${currentMode === item.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'group-hover:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={currentMode === item.id ? 2 : 1.5} d={item.icon} />
                </svg>
            </div>
            
            <span className={`hidden md:block text-xs uppercase tracking-widest relative z-10 ${currentMode === item.id ? 'font-bold opacity-100' : 'font-medium opacity-70'}`}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Footer / Language */}
      <div className="p-6 border-t border-white/5 bg-black/20">
        <div className="grid grid-cols-2 gap-2">
          {(['ES', 'EN', 'FR', 'DE'] as Language[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`py-1.5 rounded text-[9px] font-bold font-mono transition-all duration-300 ${
                lang === l 
                  ? 'bg-emerald-500 text-slate-900' 
                  : 'bg-white/5 text-slate-500 hover:text-white border border-white/5'
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
