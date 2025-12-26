
import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../utils/translations';
import { BackgroundCanvas } from './BackgroundCanvas';
import { Logo } from './Logo';

interface LoginProps {
  onLogin: (status: boolean) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, lang, setLang }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === 'TALLEYRAND' && pass === 'TALLEYRAND') {
      onLogin(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-mariate-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* 1. Cinematic Noise Overlay (Global Texture) */}
      <div className="bg-noise z-10"></div>
      
      {/* 2. Dynamic 2D Background Animation */}
      <BackgroundCanvas />

      {/* 3. Deep Radial Gradient Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-mariate-dark/80 to-mariate-dark z-0 pointer-events-none"></div>

      {/* Language Toggle Absolute */}
      <div className="absolute top-8 right-8 z-30">
         <div className="flex bg-slate-800/80 rounded-lg p-1 border border-slate-700 backdrop-blur-sm">
            {(['ES', 'EN', 'FR', 'DE'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  lang === l 
                    ? 'bg-mariate-green text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
      </div>

      {/* Login Card */}
      <div className="relative z-20 w-full max-w-md bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-8 transform transition-all hover:border-white/20 hover:shadow-[0_0_70px_rgba(16,185,129,0.1)]">
        
        {/* Top Metallic Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>

        <div className="flex flex-col items-center mb-10 mt-2">
          <div className="transform scale-150 mb-6">
            <Logo showText={false} className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-[0.2em] text-center glow-text">CANDIDATO.AI</h1>
          <p className="text-emerald-500/80 font-mono text-xs mt-3 uppercase tracking-widest">{t(lang, 'loginTitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 group">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1 group-focus-within:text-emerald-400 transition-colors">{t(lang, 'username')}</label>
            <div className="relative">
                <input 
                type="text" 
                value={user}
                onChange={(e) => setUser(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 pl-12 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder-slate-700 font-mono text-sm"
                placeholder="AGENT ID"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            </div>
          </div>
          
          <div className="space-y-2 group">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1 group-focus-within:text-emerald-400 transition-colors">{t(lang, 'password')}</label>
            <div className="relative">
                <input 
                type="password" 
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-4 pl-12 text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all placeholder-slate-700 font-mono text-sm"
                placeholder="ACCESS KEY"
                />
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.01] transition-all transform duration-200 uppercase tracking-[0.2em] text-xs mt-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
            <span className="relative z-10">{t(lang, 'enter')}</span>
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-950/50 border border-red-500/50 rounded text-red-400 text-center text-xs font-mono font-bold animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]">
             >> ERROR: INVALID CREDENTIALS
          </div>
        )}
      </div>

      <div className="absolute bottom-6 text-center z-20 opacity-50">
        <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase">
           Secure Connection // TLS 1.3 // {t(lang, 'footer')}
        </p>
      </div>
    </div>
  );
};
