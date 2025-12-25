import React, { useState, useRef } from 'react';
import { analyzeAndGenerate } from '../services/geminiService';
import { scoutUrl, describeUploadedMedia } from '../services/scoutService';
import { AnalysisResult } from '../types';
import { ResponseCard } from './ResponseCard';

export const DefenseMode: React.FC = () => {
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

    try {
      const data = await scoutUrl(url, addLog);
      setAuthor(data.author);
      setPostContent(data.content);
      if (data.mediaDescription) {
        setScoutVisualDescription(data.mediaDescription);
        addLog(`✅ Visual Context Acquired: "${data.mediaDescription.substring(0, 50)}..."`);
      }
      addLog("🟢 Scout Mission Complete. Ready for Analysis.");
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
    setUrl('https://twitter.com/UsuarioOpositor/status/123456789');
    setAuthor('');
    setPostContent('');
    setScoutLogs([]);
    setResult(null);
    setScoutVisualDescription('');
    addLog("ℹ️ Simulation URL loaded. Click 'Search' to deploy Scout.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">WAR ROOM <span className="text-mariate-green">DASHBOARD</span></h1>
          <p className="text-slate-400 mt-1">Reputation Defense & Crisis Management System</p>
        </div>
        <button 
          onClick={fillSimulationData}
          className="text-xs text-slate-500 hover:text-mariate-green underline cursor-pointer"
        >
          [Load Simulation URL]
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Input & Scout Controls */}
        <div className="lg:col-span-2 bg-mariate-panel rounded-xl p-6 border border-slate-700 shadow-2xl relative overflow-hidden">
          <form onSubmit={handleAnalyze} className="space-y-6 relative z-10">
            
            {/* URL & Scout Trigger */}
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target URL (Scraper Target)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://twitter.com/..."
                        className="flex-1 bg-mariate-dark border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-mariate-green outline-none transition-all"
                    />
                    <button 
                      type="button" 
                      onClick={handleScoutTrigger}
                      disabled={scouting || loading}
                      className={`px-4 rounded font-bold transition-all ${scouting ? 'bg-slate-600 text-slate-400' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'}`}
                      title="Deploy Scout Agent"
                    >
                        {scouting ? '🔍 SCOUTING...' : '🕵️ DEPLOY SCOUT'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Manual/Extracted Data */}
               <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Author Handle</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-mariate-dark border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-mariate-green outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Content (Text)
                    </label>
                    <textarea
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      placeholder="Waiting for Scout extraction..."
                      rows={4}
                      className="w-full bg-mariate-dark border border-slate-600 rounded p-3 text-white focus:ring-2 focus:ring-mariate-green outline-none transition-all font-mono text-sm"
                    />
                  </div>
               </div>

               {/* Visual Evidence Area */}
               <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                     Visual Evidence (Scout Vision)
                  </label>
                  
                  {/* Upload Box */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all h-32 ${selectedImage ? 'border-mariate-green bg-mariate-green/10' : 'border-slate-600 hover:border-slate-400 hover:bg-slate-800'}`}
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
                              className="max-h-full max-w-full object-contain" 
                           />
                           <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); setSelectedImage(null); setScoutVisualDescription(''); }}>X</span>
                        </div>
                     ) : (
                        <>
                           <span className="text-2xl mb-1">📷</span>
                           <span className="text-xs text-slate-400 text-center">Upload Screenshot</span>
                        </>
                     )}
                  </div>

                  {/* Visual Description Text */}
                  <div className="bg-slate-800 p-3 rounded border border-slate-700 h-32 overflow-y-auto">
                    <span className="text-xs text-slate-500 font-bold block mb-1">AI VISUAL ANALYSIS:</span>
                    <p className="text-xs text-slate-300 font-mono">
                      {scoutVisualDescription || (scouting ? "Scout is looking..." : "No visual context yet.")}
                    </p>
                  </div>
               </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading || scouting}
                className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold text-white shadow-lg transition-all transform hover:scale-105 flex items-center justify-center ${
                  loading ? 'bg-slate-600 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                }`}
              >
                {loading ? 'ANALYZING THREAT...' : '⚡ GENERATE RESPONSE STRATEGY'}
              </button>
            </div>
          </form>
          {error && <p className="text-red-400 mt-2 text-sm text-center font-bold bg-red-900/20 p-2 rounded">{error}</p>}
        </div>

        {/* RIGHT COLUMN: Scout Logs */}
        <div className="bg-black/40 rounded-xl border border-slate-700 p-4 font-mono text-xs flex flex-col h-full max-h-[600px]">
          <h3 className="text-slate-400 font-bold mb-3 border-b border-slate-800 pb-2">SYSTEM LOGS [SCOUT AGENT]</h3>
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
            {scoutLogs.length === 0 && <span className="text-slate-600 italic">System ready. Waiting for target...</span>}
            {scoutLogs.map((log, i) => (
              <div key={i} className="flex gap-2 animate-fade-in">
                <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
                <span className={log.includes("🔴") ? "text-red-400" : log.includes("✅") ? "text-mariate-green" : "text-blue-300"}>
                  {log}
                </span>
              </div>
            ))}
            {(scouting || loading) && (
              <div className="animate-pulse text-mariate-green">_ Processing...</div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6 animate-fade-in-up mt-8 border-t border-slate-700 pt-8">
          
          {/* HIGH RISK BANNER */}
          {result.riskLevel === 'High' && (
            <div className="bg-red-900 border-l-8 border-red-500 p-6 rounded shadow-2xl animate-pulse flex items-start space-x-4">
              <span className="text-4xl">🚨</span>
              <div>
                <h3 className="text-red-100 font-extrabold text-xl tracking-wider">CRITICAL RISK DETECTED</h3>
                <p className="text-red-200 mt-1 text-lg font-medium">
                    {result.warningMessage || "Legal or sensitive topic detected. Consult legal team before responding."}
                </p>
                <div className="mt-3">
                   <span className="bg-red-800 text-red-100 text-xs px-2 py-1 rounded font-bold uppercase">Approval Required: Legal Counsel</span>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-mariate-panel border border-slate-700 rounded-lg p-4 flex flex-col justify-center items-center">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">SENTIMENT</span>
              <span className={`text-xl font-bold ${
                result.sentiment === 'Negative' ? 'text-red-400' : 
                result.sentiment === 'Positive' ? 'text-green-400' : 'text-blue-400'
              }`}>
                {result.sentiment.toUpperCase()}
              </span>
            </div>
            <div className="bg-mariate-panel border border-slate-700 rounded-lg p-4 flex flex-col justify-center items-center">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">INTENT</span>
              <span className="text-xl font-bold text-white text-center">{result.intent}</span>
            </div>
            <div className={`border rounded-lg p-4 flex flex-col justify-center items-center ${
              result.riskLevel === 'High' ? 'bg-red-900/40 border-red-500' : 
              result.riskLevel === 'Medium' ? 'bg-yellow-900/30 border-yellow-500' : 
              'bg-green-900/30 border-green-500'
            }`}>
              <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">RISK LEVEL</span>
              <span className={`text-xl font-bold ${
                 result.riskLevel === 'High' ? 'text-red-500' : 
                 result.riskLevel === 'Medium' ? 'text-yellow-500' : 
                 'text-green-500'
              }`}>
                {result.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 py-2">
             <div className="h-px bg-slate-700 flex-1"></div>
             <span className="text-slate-500 text-sm font-mono font-bold tracking-widest">GENERATED STRATEGIES</span>
             <div className="h-px bg-slate-700 flex-1"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {result.responses.map((response, idx) => (
              <ResponseCard key={idx} response={response} index={idx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};