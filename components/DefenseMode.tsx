import React, { useState, useRef, useEffect } from 'react';
import { analyzeAndGenerate } from '../services/geminiService';
import { scoutUrl, extractDataFromImage } from '../services/scoutService';
import { AnalysisResult, Language } from '../types';
import { ResponseCard } from './ResponseCard';
import { ProgressBar } from './ProgressBar';
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
  const [progress, setProgress] = useState(0);
  const [scouting, setScouting] = useState(false);
  const [scoutLogs, setScoutLogs] = useState<string[]>([]);
  
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [kpiOpen, setKpiOpen] = useState(true);
  const [legalFlagged, setLegalFlagged] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => setScoutLogs(prev => [...prev, msg]);

  useEffect(() => {
    let interval: any;
    if (loading || scouting) {
      setProgress(10);
      interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + Math.random() * 10 : prev));
      }, 500);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
    return () => clearInterval(interval);
  }, [loading, scouting]);

  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

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
        
        setScoutLogs([]);
        addLog("👁️ Analyzing uploaded image (Gemini 3 Pro Vision)...");
        addLog("📤 Extracting Author, Text, and Context...");
        
        try {
          const data = await extractDataFromImage(base64Data, mime);
          
          if (data.author) {
            setAuthor(data.author);
            addLog(`👤 Author Detected: ${data.author}`);
          }
          
          if (data.content) {
            setPostContent(data.content);
            addLog(`📝 Text Extracted: "${data.content.substring(0, 30)}..."`);
          }
          
          if (data.mediaDescription) {
            setScoutVisualDescription(data.mediaDescription);
            addLog(`🖼️ Visual Context: ${data.mediaDescription.substring(0, 30)}...`);
          }
          
          addLog("✅ Image Processing Complete. Ready for Analysis.");
        } catch (err) {
           addLog("⚠️ Visual Extraction partial failure.");
        }
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
    setLegalFlagged(false);
    setKpiOpen(true);

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

  const handleLegalFlag = () => {
    setLegalFlagged(true);
    alert("ALERT: Content flagged for immediate review by Legal Counsel (Dr. Martínez). Protocol suspended until approval.");
  };

  const fillSimulationData = () => {
    setUrl('https://twitter.com/demo-mode/status/123456789');
    setAuthor('');
    setPostContent('');
    setScoutLogs([]);
    setResult(null);
    setScoutVisualDescription('');
    addLog("ℹ️ Simulation URL loaded. Click 'DEPLOY SCOUT' to see the Demo Scenario.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-12 px-2 md:px-0 relative">
      <ProgressBar active={loading || scouting} progress={progress} label={scouting ? t(lang, 'scouting') : t(lang, 'analyzing')} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4 md:gap-0">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
            {t(lang, 'warRoomTitle')}
          </h1>
          <p className="text-slate-400 mt-2 font-light tracking-wide text-xs md:text-sm pl-5 font-mono text-emerald-500/80 uppercase">
             // {t(lang, 'dashboardSubtitle')}
          </p>
        </div>
        <button 
          onClick={fillSimulationData}
          className="text-[10px] text-slate-500 hover:text-emerald-400 bg-white/5 hover:bg-white/10 px-3 py-1 rounded border border-white/5 transition-colors font-mono tracking-widest uppercase"
        >
          {t(lang, 'loadSimulation')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Input & Scout Controls */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden group">
           
          <form onSubmit={handleAnalyze} className="space-y-8 relative z-10">
            
            {/* URL & Scout Trigger */}
            <div className="bg-black/20 p-5 rounded-xl border border-white/5">
               <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                 {t(lang, 'targetUrl')}
               </label>
                <div className="flex flex-col md:flex-row gap-3">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 glass-input rounded-lg p-3 text-white placeholder-slate-600 text-sm font-mono focus:outline-none"
                    />
                    <button 
                      type="button" 
                      onClick={handleScoutTrigger}
                      disabled={scouting || loading}
                      className={`w-full md:w-auto px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all border ${
                        scouting 
                          ? 'bg-slate-800 border-slate-700 text-slate-500' 
                          : 'bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/40 hover:text-white hover:border-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      }`}
                    >
                        {scouting ? t(lang, 'scouting') : t(lang, 'scoutBtn')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
               {/* Manual/Extracted Data */}
               <div className="space-y-5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t(lang, 'authorHandle')}</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="@username"
                      className="w-full glass-input rounded-lg p-3 text-white font-bold placeholder-slate-600 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col h-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {t(lang, 'extractedContent')}
                    </label>
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder={scouting ? "DATA INCOMING..." : "Waiting for text content..."}
                      className="flex-1 w-full glass-input rounded-lg p-4 text-slate-300 focus:text-white placeholder-slate-700 font-mono text-xs leading-relaxed min-h-[120px] focus:outline-none resize-none"
                    />
                  </div>
               </div>

               {/* Visual Evidence Area */}
               <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                     {t(lang, 'visualScout')}
                  </label>
                  
                  {/* Upload Box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-32 md:h-36 relative overflow-hidden ${
                      selectedImage 
                      ? 'border-emerald-500/50 bg-emerald-900/10' 
                      : 'border-slate-700 hover:border-slate-500 hover:bg-white/5'
                    }`}
                  >
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                     />
                     {selectedImage ? (
                        <div className="relative w-full h-full flex items-center justify-center z-10">
                           <img 
                              src={`data:${imageMime};base64,${selectedImage}`} 
                              alt="Preview" 
                              className="max-h-full max-w-full object-contain rounded shadow-lg" 
                           />
                           <button 
                             type="button"
                             className="absolute -top-2 -right-2 bg-red-500/80 hover:bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs backdrop-blur" 
                             onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setScoutVisualDescription(''); setAuthor(''); setPostContent(''); }}>
                             ×
                           </button>
                        </div>
                     ) : (
                        <>
                           <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-2">
                             <span className="text-xl opacity-50">📷</span>
                           </div>
                           <span className="text-[10px] text-slate-500 font-mono text-center uppercase">{t(lang, 'uploadPlaceholder')}</span>
                        </>
                     )}
                     {/* Scanning Grid Effect */}
                     {!selectedImage && <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(16,185,129,0.1)_100%)] bg-[length:100%_20px] animate-pulse pointer-events-none"></div>}
                  </div>

                  {/* Visual Description Text */}
                  <div className="bg-black/30 p-4 rounded-lg border border-white/5 h-28 md:h-32 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center space-x-2 mb-2 sticky top-0 bg-transparent backdrop-blur-sm pb-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Vision Analysis</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                      {scoutVisualDescription || (scouting ? t(lang, 'scouting') : "Awaiting visual input stream...")}
                    </p>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-white/5">
              <button
                type="submit"
                disabled={loading || scouting}
                className={`w-full py-4 rounded-xl font-bold text-sm tracking-[0.25em] text-white shadow-2xl transition-all transform hover:scale-[1.01] flex items-center justify-center uppercase relative overflow-hidden ${
                  loading 
                  ? 'bg-slate-800 cursor-not-allowed text-slate-500' 
                  : 'bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30'
                }`}
              >
                {/* Button Glare Effect */}
                {!loading && <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-float"></div>}
                
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></span>
                      {t(lang, 'analyzing')}
                    </>
                  ) : (
                    <>
                      <span className="text-lg">⚡</span> {t(lang, 'analyzeBtn')}
                    </>
                  )}
                </span>
              </button>
            </div>
          </form>
          {error && <div className="mt-4 p-4 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono text-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">{error}</div>}
        </div>

        {/* RIGHT COLUMN: Scout Logs */}
        <div className="glass-panel rounded-2xl p-0 font-mono text-xs flex flex-col h-64 lg:h-full max-h-[600px] overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
             <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{t(lang, 'logsTitle')}</h3>
             <div className="flex space-x-1.5">
                 <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                 <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                 <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-2 custom-scrollbar bg-black/10">
            {scoutLogs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2">
                 <span className="text-2xl opacity-20">📟</span>
                 <span className="italic">System Standby</span>
              </div>
            )}
            {scoutLogs.map((log, i) => (
              <div key={i} className="flex gap-3 animate-fade-in pl-2 border-l border-white/10 py-1">
                <span className="text-slate-600 select-none text-[10px]">
                  {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                </span>
                <span className={`leading-relaxed ${log.includes("🔴") ? "text-red-400" : log.includes("✅") ? "text-emerald-400" : "text-blue-300"}`}>
                  {log}
                </span>
              </div>
            ))}
            {(scouting || loading) && (
              <div className="animate-pulse text-emerald-500 mt-2 pl-2">_</div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div ref={resultsRef}>
        {result && (
            <div className="space-y-6 md:space-y-8 animate-float mt-12 border-t border-white/5 pt-10">
            
            {/* HIGH RISK BANNER */}
            {result.riskLevel === 'High' && (
                <div className="bg-red-950/30 border border-red-500/30 p-6 md:p-8 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.1)] flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(220,38,38,0.05)_50%,transparent_75%)] bg-[length:20px_20px] animate-pulse"></div>
                  
                  <div className="flex-shrink-0 text-5xl relative z-10 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">🚨</div>
                  
                  <div className="relative z-10 flex-1 text-center md:text-left">
                      <h3 className="text-red-400 font-black text-2xl tracking-widest uppercase mb-2">{t(lang, 'riskHigh')}</h3>
                      <p className="text-red-200/80 font-mono text-sm mb-4">
                          // DETECTED: {result.warningMessage || "Legal Protocol Triggered."}
                      </p>
                      
                      <div className="flex flex-wrap justify-center md:justify-start gap-3">
                        {!legalFlagged ? (
                            <button 
                                onClick={handleLegalFlag}
                                className="bg-red-600 hover:bg-red-500 text-white text-xs px-6 py-3 rounded-lg font-bold uppercase tracking-widest shadow-lg transition-all"
                            >
                                Flag for Legal Review
                            </button>
                        ) : (
                            <span className="text-red-300 font-bold text-xs uppercase border border-red-500/30 bg-red-950/50 px-4 py-3 rounded">
                                Review Pending...
                            </span>
                        )}
                      </div>
                  </div>
                </div>
            )}

            {/* KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               {/* Sentiment */}
               <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Detected Sentiment</p>
                    <p className={`text-2xl font-black ${
                            result.sentiment === 'Negative' ? 'text-red-400' : 
                            result.sentiment === 'Positive' ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                        {result.sentiment?.toUpperCase()}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-xl bg-white/5`}>
                     {result.sentiment === 'Positive' ? '😊' : result.sentiment === 'Negative' ? '😡' : '😐'}
                  </div>
               </div>
               
               {/* Intent */}
               <div className="glass-panel p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">User Intent</p>
                    <p className="text-lg font-bold text-white truncate max-w-[150px]">{result.intent || 'Unknown'}</p>
                  </div>
                  <div className="text-2xl opacity-50">🎯</div>
               </div>

               {/* Risk */}
               <div className={`glass-panel p-4 rounded-xl flex items-center justify-between border ${
                   result.riskLevel === 'High' ? 'border-red-500/30 bg-red-900/10' : 'border-white/10'
               }`}>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Threat Level</p>
                    <p className={`text-2xl font-black ${
                            result.riskLevel === 'High' ? 'text-red-500' : 
                            result.riskLevel === 'Medium' ? 'text-yellow-500' : 
                            'text-emerald-500'
                        }`}>
                        {result.riskLevel?.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-2xl opacity-50">🛡️</div>
               </div>
            </div>

            <div className="flex items-center gap-4 py-4">
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent flex-1"></div>
                <span className="text-emerald-500 text-xs font-mono font-bold tracking-[0.3em] uppercase glow-text">Generated Counter-Measures</span>
                <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent flex-1"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12">
                {result.responses?.map((response, idx) => (
                <ResponseCard key={idx} response={response} index={idx} />
                ))}
            </div>
            </div>
        )}
      </div>
    </div>
  );
};