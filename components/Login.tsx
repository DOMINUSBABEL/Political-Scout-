import React, { useState } from 'react';
import { Language } from '../types';
import { t } from '../utils/translations';

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
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mariate-green/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      {/* Language Toggle Absolute */}
      <div className="absolute top-8 right-8 z-20">
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
      <div className="relative z-10 w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 transform transition-all hover:border-slate-600">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-400 to-emerald-700 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-emerald-900/50">
            T
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest text-center">{t(lang, 'loginTitle')}</h1>
          <p className="text-slate-400 text-sm mt-2">{t(lang, 'loginSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-500 tracking-wider ml-1">{t(lang, 'username')}</label>
            <input 
              type="text" 
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-4 text-white focus:border-mariate-green focus:ring-1 focus:ring-mariate-green outline-none transition-all placeholder-slate-700"
              placeholder="ID"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-slate-500 tracking-wider ml-1">{t(lang, 'password')}</label>
            <input 
              type="password" 
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg p-4 text-white focus:border-mariate-green focus:ring-1 focus:ring-mariate-green outline-none transition-all placeholder-slate-700"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all transform duration-200 uppercase tracking-widest text-sm"
          >
            {t(lang, 'enter')}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-3 bg-red-900/30 border border-red-800 rounded text-red-400 text-center text-sm font-bold animate-pulse">
             ACCESS DENIED
          </div>
        )}
      </div>

      <div className="absolute bottom-6 text-center z-10">
        <p className="text-slate-600 text-xs font-medium tracking-wide">
          {t(lang, 'footer')}
        </p>
      </div>
    </div>
  );
};
