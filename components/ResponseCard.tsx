
import React, { useState } from 'react';
import { GeneratedResponse, ResponseTone } from '../types';

interface Props {
  response: GeneratedResponse;
  index: number;
}

export const ResponseCard: React.FC<Props> = ({ response, index }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStyleParams = (tone: ResponseTone) => {
    switch (tone) {
      case ResponseTone.FRENTERA: 
        return { color: 'text-emerald-400', border: 'border-emerald-500', bg: 'hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]', icon: '🐐' };
      case ResponseTone.TECNICA: 
        return { color: 'text-blue-400', border: 'border-blue-500', bg: 'hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]', icon: '📊' };
      case ResponseTone.EMPATICA: 
        return { color: 'text-purple-400', border: 'border-purple-500', bg: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]', icon: '🤝' };
      case ResponseTone.SATIRICA: 
        return { color: 'text-pink-400', border: 'border-pink-500', bg: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]', icon: '🌶️' };
      case ResponseTone.VIRAL: 
        return { color: 'text-yellow-400', border: 'border-yellow-500', bg: 'hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]', icon: '🔥' };
      default: 
        return { color: 'text-slate-400', border: 'border-slate-500', bg: '', icon: '🤖' };
    }
  };

  const style = getStyleParams(response.tone);

  return (
    <div className={`glass-panel rounded-xl p-0 transition-all duration-500 group flex flex-col h-full relative overflow-hidden ${style.bg} hover:-translate-y-1`}>
      {/* Top Accent Line */}
      <div className={`h-1 w-full bg-gradient-to-r from-transparent via-${style.color.replace('text-', '')} to-transparent opacity-50`}></div>
      
      <div className="p-6 flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-slate-900/80 border border-white/10 flex items-center justify-center text-2xl shadow-inner`}>
              {style.icon}
            </div>
            <div>
              <h3 className={`font-bold ${style.color} text-sm uppercase tracking-wider truncate max-w-[120px]`}>{response.tone.split('/')[0]}</h3>
              <span className="text-[10px] text-slate-500 font-mono">CONFIDENCE: 98%</span>
            </div>
          </div>
          <div className="text-[10px] font-mono text-slate-500 bg-black/40 px-3 py-1 rounded-full border border-white/5">
            OPT-{String.fromCharCode(65 + index)}0{index+1}
          </div>
        </div>
        
        <div className="bg-slate-950/50 p-5 rounded-lg border border-white/5 mb-5 flex-grow relative group-hover:border-white/10 transition-colors">
          <p className="text-slate-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium relative z-10">
            {response.content}
          </p>
          {/* Subtle quote decoration */}
          <div className="absolute top-2 left-2 text-4xl text-white/5 font-serif leading-none">“</div>
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-1 rounded-full bg-slate-500"></div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Strategic Reasoning</p>
          </div>
          <p className="text-xs text-slate-400 font-light leading-relaxed pl-3 border-l border-slate-700">
            {response.reasoning}
          </p>
        </div>

        <div className="mt-auto">
          <button 
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 border ${
              copied 
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'
            }`}
          >
            {copied ? 'COPIED TO CLIPBOARD' : 'COPY RESPONSE'}
          </button>
        </div>
      </div>

      {/* Background decoration */}
      <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-10 ${style.color.replace('text', 'bg')}`}></div>
    </div>
  );
};
