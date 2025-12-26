
import React, { useState } from 'react';
import { GeneratedResponse, ResponseTone } from '../types';
import { generateMarketingImage } from '../services/geminiService';

interface Props {
  response: GeneratedResponse;
  index: number;
}

export const ResponseCard: React.FC<Props> = ({ response, index }) => {
  const [copied, setCopied] = useState(false);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateImage = async () => {
      setGeneratingImg(true);
      try {
          const url = await generateMarketingImage(response.visualPrompt || "A political campaign image representing: " + response.content);
          setImageUrl(url);
      } catch (e) {
          console.error(e);
          alert("Image generation failed.");
      } finally {
          setGeneratingImg(false);
      }
  };

  const getStyleParams = (tone: ResponseTone) => {
    switch (tone) {
      case ResponseTone.FRENTERA: 
        return { color: 'text-emerald-400', border: 'border-emerald-500/30', shadow: 'shadow-emerald-500/10', icon: '🐐', gradient: 'from-emerald-900/20' };
      case ResponseTone.TECNICA: 
        return { color: 'text-blue-400', border: 'border-blue-500/30', shadow: 'shadow-blue-500/10', icon: '📊', gradient: 'from-blue-900/20' };
      case ResponseTone.EMPATICA: 
        return { color: 'text-purple-400', border: 'border-purple-500/30', shadow: 'shadow-purple-500/10', icon: '🤝', gradient: 'from-purple-900/20' };
      case ResponseTone.SATIRICA: 
        return { color: 'text-pink-400', border: 'border-pink-500/30', shadow: 'shadow-pink-500/10', icon: '🌶️', gradient: 'from-pink-900/20' };
      case ResponseTone.VIRAL: 
        return { color: 'text-yellow-400', border: 'border-yellow-500/30', shadow: 'shadow-yellow-500/10', icon: '🔥', gradient: 'from-yellow-900/20' };
      default: 
        return { color: 'text-slate-400', border: 'border-slate-500/30', shadow: 'shadow-slate-500/10', icon: '🤖', gradient: 'from-slate-900/20' };
    }
  };

  const style = getStyleParams(response.tone);

  return (
    <div 
        className={`glass-panel rounded-xl p-0 transition-all duration-300 group flex flex-col h-full relative overflow-hidden hover:-translate-y-1 hover:shadow-2xl ${style.shadow} animate-fade-in-up`}
        style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Dynamic Shine effect on hover */}
      <div className="absolute inset-0 bg-glass-shine opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-20"></div>
      
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${style.gradient} to-transparent opacity-50 z-0`}></div>

      {/* Header */}
      <div className="p-6 pb-2 relative z-10 flex justify-between items-start">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-black/30 border border-white/10 flex items-center justify-center text-lg backdrop-blur-sm">
                {style.icon}
            </div>
            <div>
                <h3 className={`font-bold ${style.color} text-xs uppercase tracking-widest`}>{response.tone.split('/')[0]}</h3>
                <div className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                    <span className="text-[9px] text-slate-500 font-mono">Strategy {String.fromCharCode(65 + index)}</span>
                </div>
            </div>
        </div>
        <div className="text-[9px] font-mono text-slate-600 border border-white/5 rounded px-1.5 py-0.5">
            98% MATCH
        </div>
      </div>
      
      {/* Content Body */}
      <div className="px-6 py-4 flex-grow relative z-10">
        <div className="bg-slate-950/40 p-5 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors relative mb-4">
            {/* Corner Markers for Tech feel */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10"></div>
            
            <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {response.content}
            </p>
        </div>

        {/* Generated Image Preview */}
        {imageUrl && (
            <div className="relative rounded-lg overflow-hidden border border-white/10 mb-4 group/img aspect-square">
                <img src={imageUrl} alt="Generated visual" className="w-full h-full object-cover" />
                <a href={imageUrl} download="strategy-image.png" className="absolute bottom-2 right-2 bg-black/60 text-white p-2 rounded hover:bg-black transition-colors opacity-0 group-hover/img:opacity-100">
                    ⬇️
                </a>
            </div>
        )}
      </div>

      {/* Reasoning & Footer */}
      <div className="px-6 pb-6 relative z-10 mt-auto space-y-4">
        <div>
          <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1.5 font-mono flex items-center gap-2">
             <span className="w-2 h-[1px] bg-slate-600"></span> Reasoning
          </p>
          <p className="text-[10px] text-slate-400 font-light leading-relaxed">
            {response.reasoning}
          </p>
        </div>

        <div className="flex gap-2">
            {/* Create Visual Button */}
            {!imageUrl && (
                <button 
                    onClick={handleGenerateImage}
                    disabled={generatingImg}
                    className="flex-1 py-3 px-2 rounded font-bold text-[9px] uppercase tracking-wider transition-all duration-300 border border-white/5 bg-white/5 text-purple-300 hover:bg-purple-900/20 hover:border-purple-500/50 flex items-center justify-center gap-2"
                >
                    {generatingImg ? <span className="animate-pulse">PAINTING...</span> : <><span>🎨</span> CREATE VISUAL</>}
                </button>
            )}

            {/* Copy Button */}
            <button 
                onClick={handleCopy}
                className={`flex-1 py-3 px-4 rounded font-bold text-[9px] uppercase tracking-wider transition-all duration-300 border relative overflow-hidden group/btn ${
                copied 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
            >
                <span className="relative z-10">{copied ? 'COPIED' : 'COPY TEXT'}</span>
                {copied && <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>}
            </button>
        </div>
      </div>
    </div>
  );
};
