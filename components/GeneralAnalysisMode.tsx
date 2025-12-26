
import React, { useState, useRef, useEffect } from 'react';
import { analyzeAndGenerate } from '../services/geminiService';
import { scoutUrl, extractDataFromImage } from '../services/scoutService';
import { AnalysisResult, Language, CandidateProfile, VoterType } from '../types';
import { ResponseCard } from './ResponseCard';
import { ProgressBar } from './ProgressBar';
import { ThinkingConsole } from './ThinkingConsole';
import { t } from '../utils/translations';

interface GeneralAnalysisModeProps {
  lang: Language;
  activeProfile: CandidateProfile;
}

export const GeneralAnalysisMode: React.FC<GeneralAnalysisModeProps> = ({ lang, activeProfile }) => {
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
  const [legalFlagged, setLegalFlagged] = useState(false);
  
  // NEW: Deep Research State
  const [deepResearch, setDeepResearch] = useState(false);
  
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

    try {
      const imageContext = selectedImage ? { base64: selectedImage, mimeType: imageMime } : undefined;
      // PASS ACTIVE PROFILE TO GEMINI + DEEP RESEARCH FLAG
      const analysis = await analyzeAndGenerate(
        author, 
        postContent, 
        activeProfile,
        imageContext, 
        scoutVisualDescription,
        deepResearch
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
    alert("ALERT: Content flagged for immediate review by Legal Counsel. Protocol suspended until approval.");
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

  const getVoterTypeStyle = (type: VoterType) => {
      switch (type) {
          case VoterType.HARD_SUPPORT: return 'text-emerald-400 border-emerald-500/30';
          case VoterType.SOFT_SUPPORT: return 'text-emerald-200 border-emerald-500/20';
          case VoterType.UNDECIDED: return 'text-blue-200 border-blue-500/30';
          case VoterType.SOFT_OPPOSITION: return 'text-orange-200 border-orange-500/30';
          case VoterType.HARD_OPPOSITION: return 'text-red-400 border-red-500/30';
          case VoterType.TROLL: return 'text-purple-400 border-purple-500/30';
          case VoterType.MEDIA: return 'text-cyan-400 border-cyan-500/30';
          default: return 'text-slate-300 border-slate-500/30';
      }
  };

  const getVoterLabel = (type: VoterType) => {
     switch(type) {
         case VoterType.HARD_SUPPORT: return t(lang, 'voterHardSupport');
         case VoterType.SOFT_SUPPORT: return t(lang, 'voterSoftSupport');
         case VoterType.UNDECIDED: return t(lang, 'voterUndecided');
         case VoterType.SOFT_OPPOSITION: return t(lang, 'voterSoftOpp');
         case VoterType.HARD_OPPOSITION: return t(lang, 'voterHardOpp');
         case VoterType.TROLL: return t(lang, 'voterTroll');
         case VoterType.MEDIA: return t(lang, 'voterMedia');
         default: return type;
     }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 px-2 md:px-0 relative">
      <ProgressBar active={loading || scouting} progress={progress} label={scouting ? t(lang, 'scouting') : t(lang, 'analyzing')} />

      {/* Tactical Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4 md:gap-0 relative">
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
             <span className="w-3 h-8 bg-emerald-500 skew-x-[-12deg] shadow-[0_0_15px_#10B981]"></span>
            {t(lang, 'warRoomTitle')}
          </h1>
          <div className="flex items-center gap-3 mt-3">
             <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest bg-white/5 px-2 py-1 rounded">Protocol: General Analysis</span>
             <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
               Agent: {activeProfile.name}
             </span>
          </div>
        </div>
        <button 
          onClick={fillSimulationData}
          className="relative overflow-hidden group px-4 py-2 bg-white/5 border border-white/10 rounded font-mono text-[10px] uppercase tracking-widest text-slate-400 hover:text-white hover:border-emerald-500/50 transition-all"
        >
          <span className="relative z-10">{t(lang, 'loadSimulation')}</span>
          <div className="absolute inset-0 bg-emerald-500/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Tactical Inputs */}
        <div className="lg:col-span-2 space-y-6">
           
          <form onSubmit={handleAnalyze} className="glass-panel rounded-xl p-1 relative group">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/20"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/20"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/20"></div>

            <div className="bg-mariate-panel/50 rounded-lg p-6 md:p-8 space-y-8 backdrop-blur-sm">
                
                {/* NEW: Thinking Console (Visible when loading) */}
                <ThinkingConsole isVisible={loading} mode="DEFENSE" isDeepResearch={deepResearch} />

                {/* URL Scanner Section */}
                <div>
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                        <span className="w-3 h-[1px] bg-emerald-500"></span>
                        {t(lang, 'targetUrl')}
                    </label>
                    <div className="flex gap-0">
                        <div className="flex-1 relative group/input">
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://x.com/status/..."
                                className="w-full h-12 bg-black/30 border border-white/10 border-r-0 rounded-l text-white placeholder-slate-600 text-sm font-mono px-4 focus:outline-none focus:bg-black/50 focus:border-emerald-500/50 transition-all"
                            />
                            {/* Input Scanline */}
                            <div className="absolute bottom-0 left-0 h-[1px] bg-emerald-500 w-0 group-focus-within/input:w-full transition-all duration-500"></div>
                        </div>
                        <button 
                            type="button" 
                            onClick={handleScoutTrigger}
                            disabled={scouting || loading}
                            className={`px-6 h-12 border border-l-0 border-white/10 rounded-r font-bold text-xs uppercase tracking-widest transition-all ${
                                scouting 
                                ? 'bg-slate-800 text-slate-500 cursor-wait' 
                                : 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            }`}
                        >
                            {scouting ? "SCANNING..." : t(lang, 'scoutBtn')}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Text Data */}
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">{t(lang, 'authorHandle')}</label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder="@username"
                          className="glass-input w-full rounded p-3 text-sm font-bold"
                        />
                      </div>
                      <div className="flex flex-col h-full">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                          {t(lang, 'extractedContent')}
                        </label>
                        <textarea
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          placeholder={scouting ? "Awaiting data stream..." : "Paste text or wait for Scout..."}
                          className="flex-1 w-full glass-input rounded p-4 text-slate-300 font-mono text-xs leading-relaxed min-h-[140px] resize-none"
                        />
                      </div>
                   </div>

                   {/* Visual Data */}
                   <div className="space-y-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-mono">
                         {t(lang, 'visualScout')}
                      </label>
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border border-dashed rounded-lg h-36 relative overflow-hidden transition-all cursor-pointer group/upload ${
                          selectedImage 
                          ? 'border-emerald-500/30 bg-emerald-900/5' 
                          : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                        }`}
                      >
                         <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                         
                         {selectedImage ? (
                            <div className="w-full h-full flex items-center justify-center relative z-10 p-2">
                               <img src={`data:${imageMime};base64,${selectedImage}`} className="max-h-full object-contain rounded shadow-lg" />
                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/upload:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs text-white font-mono uppercase">Replace Image</span>
                               </div>
                            </div>
                         ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 group-hover/upload:text-slate-400">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover/upload:scale-110 transition-transform">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] font-mono uppercase tracking-widest">{t(lang, 'uploadPlaceholder')}</span>
                            </div>
                         )}
                         {/* Scan grid animation */}
                         <div className="absolute inset-0 bg-[linear-gradient(transparent_95%,rgba(16,185,129,0.05)_100%)] bg-[length:100%_20px] animate-scan pointer-events-none opacity-50"></div>
                      </div>

                      <div className="bg-black/40 border border-white/5 p-3 rounded h-24 overflow-y-auto custom-scrollbar">
                         <div className="flex items-center gap-2 sticky top-0 bg-black/40 backdrop-blur pb-1 mb-1 border-b border-white/5">
                            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[9px] font-mono text-blue-400 uppercase">Vision Analysis Log</span>
                         </div>
                         <p className="text-[10px] text-slate-400 font-mono leading-relaxed">
                             {scoutVisualDescription || "// Waiting for visual input..."}
                         </p>
                      </div>
                   </div>
                </div>

                {/* ACTION BAR */}
                <div className="flex flex-col md:flex-row items-center gap-4">
                  {/* Deep Research Toggle */}
                  <div 
                    onClick={() => setDeepResearch(!deepResearch)}
                    className={`flex items-center gap-3 p-3 rounded cursor-pointer border transition-all select-none w-full md:w-auto ${
                      deepResearch 
                      ? 'bg-purple-900/30 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                      : 'bg-black/20 border-white/10 hover:bg-white/5'
                    }`}
                  >
                     <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                       deepResearch ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-600'
                     }`}>
                       {deepResearch && '✓'}
                     </div>
                     <div>
                       <span className={`block text-[10px] font-bold uppercase tracking-widest ${deepResearch ? 'text-purple-400' : 'text-slate-400'}`}>Deep Research</span>
                       <span className="text-[9px] text-slate-500 font-mono">Enable Google Search + Reasoning</span>
                     </div>
                  </div>

                  <button
                      type="submit"
                      disabled={loading || scouting}
                      className="flex-1 w-full group relative overflow-hidden rounded py-4 bg-emerald-600 hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
                  >
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                      <div className="relative z-10 flex items-center justify-center gap-3">
                          {loading ? (
                              <span className="font-mono text-xs font-bold uppercase tracking-widest animate-pulse">{t(lang, 'analyzing')}</span>
                          ) : (
                              <>
                                  <span className="text-lg">⚡</span>
                                  <span className="font-bold text-sm uppercase tracking-[0.25em]">{t(lang, 'analyzeBtn')}</span>
                              </>
                          )}
                      </div>
                  </button>
                </div>
            </div>
          </form>
          
          {error && (
             <div className="glass-panel border-red-500/50 bg-red-950/20 p-4 rounded text-red-300 text-xs font-mono text-center animate-fade-in-up">
                 [ERROR] {error}
             </div>
          )}
        </div>

        {/* RIGHT COLUMN: Terminal Logs */}
        <div className="glass-panel rounded-xl flex flex-col h-64 lg:h-full max-h-[600px] overflow-hidden border-t-2 border-t-emerald-500/50">
          <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
             <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">System Logs</h3>
             <div className="flex gap-1">
                 <div className="w-2 h-2 rounded-full bg-white/10"></div>
                 <div className="w-2 h-2 rounded-full bg-white/10"></div>
             </div>
          </div>
          <div className="flex-1 bg-black/40 p-4 overflow-y-auto custom-scrollbar font-mono text-[10px] space-y-1.5 shadow-inner">
            {scoutLogs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-30">
                    <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <span>IDLE STATE</span>
                </div>
            )}
            {scoutLogs.map((log, i) => (
               <div key={i} className="flex gap-2 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <span className="text-slate-600 shrink-0">
                      {new Date().toLocaleTimeString([], {hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit'})}
                  </span>
                  <span className={`${log.includes("🔴") ? "text-red-400" : log.includes("✅") ? "text-emerald-400" : "text-slate-300"}`}>
                      {log.replace(/^[^\s]+/, '')} {/* Remove emoji for cleaner tech look if desired, or keep */}
                  </span>
               </div>
            ))}
            {(scouting || loading) && <div className="w-2 h-4 bg-emerald-500 animate-pulse"></div>}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div ref={resultsRef}>
        {result && (
            <div className="space-y-8 animate-fade-in-up mt-12 pt-10 border-t border-white/5 relative">
            
            {/* Background Highlight for Results */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>

            {/* REASONING DROPDOWN (NEW) */}
            {result.thoughtProcess && (
              <div className="glass-panel p-4 rounded-lg border-l-4 border-purple-500 bg-purple-900/10">
                 <h4 className="text-purple-400 font-bold uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                   <span>🧠</span> Model Reasoning Process
                 </h4>
                 <p className="text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                   {result.thoughtProcess}
                 </p>
              </div>
            )}

            {/* HIGH RISK BANNER - HUD Style */}
            {result.riskLevel === 'High' && (
                <div className="relative overflow-hidden rounded-xl border border-red-500/50 bg-red-950/20 p-1">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(220,38,38,0.1)_50%,transparent_75%)] bg-[length:20px_20px] animate-shimmer"></div>
                  <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6">
                      <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center bg-red-900/40 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse">
                          <span className="text-3xl">⚠️</span>
                      </div>
                      <div className="text-center md:text-left flex-1">
                          <h3 className="text-red-500 font-black text-2xl tracking-widest uppercase mb-1 glow-text">{t(lang, 'riskHigh')}</h3>
                          <p className="text-red-300 font-mono text-sm border-l-2 border-red-500 pl-3">
                              >> DETECTED THREAT: {result.warningMessage || "Legal Review Protocol Initiated."}
                          </p>
                      </div>
                      <button 
                         onClick={handleLegalFlag}
                         disabled={legalFlagged}
                         className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold uppercase tracking-widest text-xs rounded shadow-lg transition-all"
                      >
                         {legalFlagged ? "FLAGGED" : "ESCALATE TO LEGAL"}
                      </button>
                  </div>
                </div>
            )}

            {/* KPI STRIP - Glass Cards - UPDATED TO 4 COLS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               {/* Sentiment */}
               <div className="glass-panel p-5 rounded-lg flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 font-mono">Sentiment Analysis</p>
                    <p className={`text-2xl font-black ${
                            result.sentiment === 'Negative' ? 'text-red-400' : 
                            result.sentiment === 'Positive' ? 'text-emerald-400' : 'text-blue-400'
                        }`}>
                        {result.sentiment?.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-3xl opacity-20 grayscale group-hover:grayscale-0 transition-all">
                     {result.sentiment === 'Positive' ? '😊' : result.sentiment === 'Negative' ? '😡' : '😐'}
                  </div>
               </div>
               
               {/* Intent */}
               <div className="glass-panel p-5 rounded-lg flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 font-mono">User Intent</p>
                    <p className="text-lg font-bold text-white leading-tight">{result.intent || 'Unknown'}</p>
                  </div>
                  <div className="text-3xl opacity-20 group-hover:opacity-50 transition-all">🎯</div>
               </div>

                {/* NEW: Voter Profile */}
               <div className={`glass-panel p-5 rounded-lg flex items-center justify-between group border-l-2 ${getVoterTypeStyle(result.voterClassification || VoterType.UNDECIDED)} transition-colors`}>
                  <div className="max-w-[80%]">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 font-mono">{t(lang, 'voterProfile')}</p>
                    <p className="text-lg font-bold text-white leading-tight truncate">
                       {getVoterLabel(result.voterClassification || VoterType.UNDECIDED)}
                    </p>
                  </div>
                  <div className="text-3xl opacity-20 group-hover:opacity-50 transition-all">🆔</div>
               </div>

               {/* Risk */}
               <div className={`glass-panel p-5 rounded-lg flex items-center justify-between border-l-4 ${
                   result.riskLevel === 'High' ? 'border-l-red-500' : result.riskLevel === 'Medium' ? 'border-l-yellow-500' : 'border-l-emerald-500'
               }`}>
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-1 font-mono">Risk Assessment</p>
                    <p className={`text-2xl font-black ${
                            result.riskLevel === 'High' ? 'text-red-500' : 
                            result.riskLevel === 'Medium' ? 'text-yellow-500' : 
                            'text-emerald-500'
                        }`}>
                        {result.riskLevel?.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-3xl opacity-20 group-hover:opacity-50 transition-all">🛡️</div>
               </div>
            </div>

            {/* Follow-up Specialist Agent */}
            <div className="glass-panel p-6 rounded-xl border border-blue-500/20 bg-blue-950/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl rotate-12">📡</div>
                <h3 className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                    Tactical Follow-Up Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                    {result.followUpSuggestions?.map((suggestion, idx) => (
                        <div key={idx} className="bg-slate-900/60 p-4 rounded border border-blue-500/10 flex items-start gap-3 hover:bg-slate-900/80 transition-colors">
                            <span className="text-blue-500 font-mono font-bold text-xs">0{idx+1}</span>
                            <p className="text-slate-300 text-xs leading-relaxed">{suggestion}</p>
                        </div>
                    )) || <p className="text-slate-500 italic text-xs">No follow-up actions generated.</p>}
                </div>
            </div>

            <div className="flex items-center gap-4 py-6">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-emerald-500 text-[10px] font-mono font-bold tracking-[0.3em] uppercase glow-text bg-black/50 px-3 py-1 rounded border border-emerald-500/30">
                    Generated Strategies
                </span>
                <div className="h-px bg-white/10 flex-1"></div>
            </div>

            {/* Updated Grid for 5 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-12">
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
