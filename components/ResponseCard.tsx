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

  const getBorderColor = (tone: ResponseTone) => {
    switch (tone) {
      case ResponseTone.FRENTERA: return 'border-neon-accent'; // Green/Neon
      case ResponseTone.TECNICA: return 'border-blue-500';
      case ResponseTone.EMPATICA: return 'border-purple-500';
      default: return 'border-slate-600';
    }
  };

  const getIcon = (tone: ResponseTone) => {
    switch (tone) {
      case ResponseTone.FRENTERA: return '🐐';
      case ResponseTone.TECNICA: return '📊';
      case ResponseTone.EMPATICA: return '🤝';
      default: return '🤖';
    }
  };

  return (
    <div className={`bg-mariate-panel rounded-lg p-5 border-l-4 ${getBorderColor(response.tone)} shadow-lg hover:shadow-xl transition-all duration-300 relative group`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getIcon(response.tone)}</span>
          <h3 className="font-bold text-slate-100 text-lg">{response.tone}</h3>
        </div>
        <div className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-1 rounded border border-slate-700">
          OPTION {String.fromCharCode(65 + index)}
        </div>
      </div>
      
      <div className="bg-mariate-dark p-4 rounded border border-slate-700 mb-4 min-h-[100px]">
        <p className="text-slate-200 text-base leading-relaxed whitespace-pre-wrap font-medium">
          "{response.content}"
        </p>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">Reasoning</p>
        <p className="text-sm text-slate-400 italic">
          {response.reasoning}
        </p>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
        <button 
          onClick={handleCopy}
          className={`flex-1 py-2 px-4 rounded font-bold text-sm transition-all ${
            copied 
              ? 'bg-mariate-green text-white' 
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {copied ? 'COPIED!' : 'COPY TO CLIPBOARD'}
        </button>
      </div>
    </div>
  );
};