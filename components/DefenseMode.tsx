import React, { useState, useRef } from 'react';
import { analyzeAndGenerate } from '../services/geminiService';
import { scoutUrl, describeUploadedMedia } from '../services/scoutService';
import { AnalysisResult, Language } from '../types';
import { ResponseCard } from './ResponseCard';
import { t } from '../utils/translations';

interface DefenseModeProps {
  lang: Language;
}

export const DefenseMode: React.FC<DefenseModeProps> = ({ lang }) => {
  const [url, setUrl] = useState('');
  const [postContent, setPostContent] = useState('');
  const [author, setAuthor] = useState('');
  
  // Visual Context
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const [scoutVisualDescription, setScoutVisualDescription] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [scouting, setScouting] = useState(false);
  const [scoutLogs, setScoutLogs] = useState<string[]>([]);
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => setScoutLogs(prev => [...prev, msg]);

  const handleScoutTrigger = async () => {
    if (!url) {
      setError("Please enter a URL for the Scout to investigate.");
      return;
    }
    setScouting(true);
    setScoutLogs([]);
    setError('');
    setScoutVisualDescription('');
    setResult(null);
    // Clear previous fields to avoid confusion if scout fails
    setAuthor('');
    setPostContent('');

    try {
      const data = await scoutUrl(url, addLog);
      
      if (data.content) {
          setAuthor(data.author || "Unknown");
          setPostContent(data.content);
          if (data.mediaDescription) {
            setScoutVisualDescription(data.mediaDescription);
            addLog(`✅ Visual Context Acquired.`);
          }
          addLog("🟢 Scout Mission Complete. Data loaded.");
      } else {
          // Scout failed to get text (Access Denied)
          addLog("⚠️ Content protected. Manual input required.");
      }
      
    } catch (err) {
      addLog("🔴 Scout Failed: Connection refused or anti-bot triggered.");
      setError("Scout failed to retrieve data.");
    } finally {
      setScouting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        const mime = base64String.split(';')[0].split(':')[1];
        
        setSelectedImage(base64Data);
        setImageMime(mime);
        
        // Auto-analyze with Scout Vision upon upload
        addLog("👁️ Analyzing uploaded image with Scout Vision...");
        const desc = await describeUploadedMedia(base64Data, mime);
        setScoutVisualDescription(desc);
        addLog("✅ Image analyzed.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!postContent && !selectedImage && !scoutVisualDescription) || !author) {
      setError('Insufficient Data. Run Scout on a URL or provide Author/Content manually.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const imageContext = selectedImage ? { base64: selectedImage, mimeType: imageMime } : undefined;
      const analysis = await analyzeAndGenerate(
        author, 
        postContent, 
        imageContext, 
        scoutVisualDescription
      );
      setResult(analysis);
    } catch (err) {
      setError('Analysis Protocol Failed. Check API Key.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fillSimulationData = () => {
    // We use the specific "demo-mode" string to trigger the mock logic in scoutService
    setUrl('https://twitter.com/demo-mode/status/123456789');
    setAuthor('');
    setPostContent('');
    setScoutLogs([]);
    setResult(null);
    setScoutVisualDescription('');
    addLog("ℹ️ Simulation URL loaded. Click 'DEPLOY SCOUT' to see the Demo Scenario.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-700/50 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase">
            {t(lang, 'warRoomTitle')} <span className="text-mariate-green">DASHBOARD</span>
          </h1>
          <p className="text-slate-400 mt-1 font-light tracking-wide">{t(lang, 'dashboardSubtitle')}</p>
        </div>
        <button 
          onClick={fillSimulationData}
          className="text-xs text-slate-500 hover:text-mariate-green underline cursor-pointer transition-colors"
        >
          {t(lang, 'loadSimulation')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Input & Scout Controls */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50 shadow-2xl relative overflow-hidden group hover:border-slate-600 transition-all">
           {/* Decorative sheen */}
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>

          <form onSubmit={handleAnalyze} className="space-y-8 relative z-10">
            
            {/* URL & Scout Trigger */}
            <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t(lang, 'targetUrl')}</label>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Link (Twitter, TikTok, Facebook, Instagram, Threads...)"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-mariate-green focus:ring-1 focus:ring-mariate-green outline-none transition-all placeholder-slate-600"
                    />
                    <button 
                      type="button" 
                      onClick={handleScoutTrigger}
                      disabled={scouting || loading}
                      className={`px-5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all border ${
                        scouting 
                          ? 'bg-slate-800 border-slate-700 text-slate-400' 
                          : 'bg-blue-900/30 border-blue-500/50 text-blue-400 hover:bg-blue-900/50 hover:text-white hover:border-blue-400 shadow-lg shadow-blue-900/20'
                      }`}
                    >
                        {scouting ? t(lang, 'scouting') : t(lang, 'scoutBtn')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Manual/Extracted Data */}
               <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t(lang, 'authorHandle')}</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-mariate-green focus:ring-1 focus:ring-mariate-green outline-none transition-all placeholder-slate-600"
                    />
                  </div>
                  <div className="flex flex-col h-full">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {t(lang, 'extractedContent')}
                    </label>
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder={scouting ? "Scouting..." : "Paste content here if Scout is blocked by AuthWall..."}
                      className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:border-mariate-green focus:ring-1 focus:ring-mariate-green outline-none transition-all font-mono text-sm min-h-[120px]"
                    />
                  </div>
               </div>

               {/* Visual Evidence Area */}
               <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                     {t(lang, 'visualScout')}
                  </label>
                  
                  {/* Upload Box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-36 ${selectedImage ? 'border-mariate-green bg-emerald-900/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'}`}
                  >
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                     />
                     {selectedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center">
                           <img 
                              src={`data:${imageMime};base64,${selectedImage}`} 
                              alt="Preview" 
                              className="max-h-full max-w-full object-contain rounded" 
                           />
                           <button 
                             type="button"
                             className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full shadow-md flex items-center justify-center font-bold text-xs" 
                             onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setScoutVisualDescription(''); }}>
                             ×
                           </button>
                        </div>
                     ) : (
                        <>
                           <span className="text-3xl mb-2 opacity-50">📷</span>
                           <span className="text-xs text-slate-500 font-medium text-center">{t(lang, 'uploadPlaceholder')}</span>
                        </>
                     )}
                  </div>

                  {/* Visual Description Text */}
                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 h-32 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-mariate-green animate-pulse"></div>
                        <span className="text-[10px] text-mariate-green font-bold uppercase tracking-wider">Gemini Vision Analysis</span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono leading-relaxed">
                      {scoutVisualDescription || (scouting ? t(lang, 'scouting') : "Waiting for visual input...")}
                    </p>
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="submit"
                disabled={loading || scouting}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-widest text-white shadow-lg transition-all transform hover:scale-[1.01] flex items-center justify-center uppercase ${
                  loading 
                  ? 'bg-slate-700 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-900/40'
                }`}
              >
                {loading ? t(lang, 'analyzing') : `⚡ ${t(lang, 'analyzeBtn')}`}
              </button>
            </div>
          </form>
          {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm text-center font-bold">{error}</div>}
        </div>

        {/* RIGHT COLUMN: Scout Logs */}
        <div className="bg-black/60 backdrop-blur-md rounded-2xl border border-slate-700/50 p-5 font-mono text-xs flex flex-col h-full max-h-[600px] shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
             <h3 className="text-slate-400 font-bold uppercase tracking-wider">{t(lang, 'logsTitle')}</h3>
             <div className="flex space-x-1">
                 <div className="w-2 h-2 rounded-full bg-red-500"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {scoutLogs.length === 0 && <span className="text-slate-600 italic block py-4 text-center">System standby.</span>}
            {scoutLogs.map((log, i) => (
              <div key={i} className="flex gap-3 animate-fade-in border-l-2 border-slate-800 pl-3 py-1 hover:border-slate-600 transition-colors">
                <span className="text-slate-600 select-none">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                <span className={`leading-relaxed ${log.includes("🔴") ? "text-red-400 font-bold" : log.includes("✅") ? "text-emerald-400 font-bold" : "text-blue-300"}`}>
                  {log}
                </span>
              </div>
            ))}
            {(scouting || loading) && (
              <div className="animate-pulse text-mariate-green mt-2 pl-3">_</div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-8 animate-fade-in-up mt-12 border-t border-slate-800 pt-10">
          
          {/* HIGH RISK BANNER */}
          {result.riskLevel === 'High' && (
            <div className="bg-red-950/40 border-l-4 border-red-500 p-8 rounded-r-xl shadow-2xl flex items-start space-x-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
              <span className="text-5xl relative z-10">🚨</span>
              <div className="relative z-10">
                <h3 className="text-red-400 font-black text-2xl tracking-widest uppercase mb-2">{t(lang, 'riskHigh')}</h3>
                <p className="text-red-100 text-lg font-medium leading-relaxed">
                    "{result.warningMessage || "Legal or sensitive topic detected. Consult legal team before responding."}"
                </p>
                <div className="mt-4 inline-block">
                   <span className="bg-red-900/80 border border-red-700 text-red-200 text-xs px-3 py-1.5 rounded uppercase font-bold tracking-wider">{t(lang, 'riskLegal')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Analysis KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center items-center hover:border-slate-600 transition-colors group">
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2 group-hover:text-emerald-500 transition-colors">SENTIMENT</span>
              <span className={`text-2xl font-black tracking-tight ${
                result.sentiment === 'Negative' ? 'text-red-400' : 
                result.sentiment === 'Positive' ? 'text-emerald-400' : 'text-blue-400'
              }`}>
                {result.sentiment.toUpperCase()}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-center items-center hover:border-slate-600 transition-colors group">
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mb-2 group-hover:text-emerald-500 transition-colors">INTENT</span>
              <span className="text-xl font-bold text-white text-center">{result.intent}</span>
            </div>
            <div className={`border rounded-xl p-6 flex flex-col justify-center items-center transition-all ${
              result.riskLevel === 'High' ? 'bg-red-900/20 border-red-500/50' : 
              result.riskLevel === 'Medium' ? 'bg-yellow-900/20 border-yellow-500/50' : 
              'bg-emerald-900/20 border-emerald-500/50'
            }`}>
              <span className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold mb-2">RISK LEVEL</span>
              <span className={`text-2xl font-black tracking-tight ${
                 result.riskLevel === 'High' ? 'text-red-500' : 
                 result.riskLevel === 'Medium' ? 'text-yellow-500' : 
                 'text-emerald-500'
              }`}>
                {result.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-6 py-4">
             <div className="h-px bg-slate-800 flex-1"></div>
             <span className="text-slate-500 text-xs font-bold tracking-[0.25em] uppercase">{t(lang, 'generatedStrategies')}</span>
             <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
            {result.responses.map((response, idx) => (
              <ResponseCard key={idx} response={response} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};