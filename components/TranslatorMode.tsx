import React, { useState } from 'react';
import { translateToMariate } from '../services/geminiService';

export const TranslatorMode: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!inputText) return;
    setLoading(true);
    try {
      const result = await translateToMariate(inputText);
      setOutputText(result);
    } catch (error) {
      console.error(error);
      setOutputText("Error: Mariate is taking a nap. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col">
       <div className="mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">MARIATE <span className="text-mariate-green">TRANSLATOR</span></h1>
          <p className="text-slate-400 mt-1">Transform bureaucratic text into political gold.</p>
       </div>

       <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 min-h-0">
          {/* Input Side */}
          <div className="flex flex-col bg-mariate-panel rounded-xl border border-slate-700 shadow-xl overflow-hidden">
             <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Source (Boring/Technical)</span>
                <button 
                  onClick={() => setInputText('')}
                  className="text-xs text-slate-500 hover:text-white"
                >
                  CLEAR
                </button>
             </div>
             <textarea 
               className="flex-1 bg-transparent p-6 text-slate-300 resize-none outline-none focus:bg-slate-800/50 transition-colors text-lg"
               placeholder="Paste the boring text here. e.g., 'We propose a reduction in fiscal pressure for small businesses...'"
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
             />
          </div>

          {/* Action Button (Mobile only usually, but central here) */}
          <div className="md:hidden flex justify-center">
            <button 
               onClick={handleTranslate}
               disabled={loading}
               className="bg-mariate-green text-white p-4 rounded-full shadow-lg"
            >
               {loading ? '⏳' : '⬇️'}
            </button>
          </div>

          {/* Output Side */}
          <div className="flex flex-col bg-gradient-to-br from-mariate-panel to-slate-800 rounded-xl border border-emerald-900/50 shadow-xl overflow-hidden relative">
             <div className="bg-emerald-900/20 p-3 border-b border-emerald-900/30 flex justify-between items-center">
                <span className="text-xs font-bold text-mariate-green uppercase tracking-wider">Output (Mariate Style)</span>
                {outputText && (
                   <button 
                    onClick={() => navigator.clipboard.writeText(outputText)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                   >
                     COPY
                   </button>
                )}
             </div>
             
             <div className="flex-1 p-6 relative">
               {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                     <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mariate-green"></div>
                        <span className="text-mariate-green font-bold animate-pulse">TRANSLATING...</span>
                     </div>
                  </div>
               ) : null}
               
               {outputText ? (
                 <p className="text-xl text-white font-medium leading-relaxed whitespace-pre-wrap">
                    {outputText}
                 </p>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-600 italic">
                    Waiting for input...
                 </div>
               )}
             </div>
          </div>
       </div>

       <div className="mt-6 flex justify-center hidden md:flex">
          <button
             onClick={handleTranslate}
             disabled={loading || !inputText}
             className={`px-12 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${
               loading || !inputText 
                 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                 : 'bg-mariate-green text-white hover:bg-emerald-400 hover:shadow-emerald-500/20'
             }`}
          >
             {loading ? 'MARIATE-IZING...' : '✨ MARIATE-IZE TEXT'}
          </button>
       </div>
    </div>
  );
};