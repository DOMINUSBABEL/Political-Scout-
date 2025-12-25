import React, { useState } from 'react';
import { NetworkStat, Language, NetworkAgentAnalysis } from '../types';
import { analyzeNetworkStats } from '../services/geminiService';
import { ProgressBar } from './ProgressBar';
import { t } from '../utils/translations';

interface Props {
  lang: Language;
}

export const NetworkAnalysisMode: React.FC<Props> = ({ lang }) => {
  const [stats, setStats] = useState<NetworkStat[]>([]);
  const [analysis, setAnalysis] = useState<NetworkAgentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Parse CSV function
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(10);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setProgress(40);
      const text = evt.target?.result as string;
      
      // Simple CSV Parse Logic
      try {
        const lines = text.split('\n').filter(l => l.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const parsedData: NetworkStat[] = lines.slice(1).map(line => {
          const values = line.split(',');
          // Mocking/Mapping data structure for demo resilience
          return {
            date: values[0] || new Date().toISOString(),
            platform: values[1] || 'Twitter',
            impressions: parseInt(values[2]) || Math.floor(Math.random() * 5000),
            engagement: parseFloat(values[3]) || Math.random() * 5,
            sentiment_score: parseInt(values[4]) || 50,
            top_topic: values[5] || 'General'
          };
        });

        setStats(parsedData);
        setProgress(70);
        
        // Trigger AI Analysis automatically
        const result = await analyzeNetworkStats(parsedData);
        setAnalysis(result);
        
        setProgress(100);
        setTimeout(() => setLoading(false), 500);

      } catch (err) {
        console.error("Parse Error", err);
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const loadDemoData = async () => {
    setLoading(true);
    setProgress(20);
    // Mock Data Generator
    const demoData: NetworkStat[] = Array.from({ length: 15 }).map((_, i) => ({
      date: `2023-10-${i + 1}`,
      platform: i % 3 === 0 ? 'TikTok' : i % 2 === 0 ? 'Instagram' : 'X',
      impressions: 1000 + Math.random() * 10000,
      engagement: 1 + Math.random() * 8,
      sentiment_score: 30 + Math.random() * 70,
      top_topic: ['Minería', 'Páramos', 'Seguridad', 'Vías'][Math.floor(Math.random() * 4)]
    }));
    
    setProgress(50);
    setStats(demoData);
    
    const result = await analyzeNetworkStats(demoData);
    setAnalysis(result);
    setProgress(100);
    setTimeout(() => setLoading(false), 500);
  };

  const getMaxVal = (field: keyof NetworkStat) => Math.max(...stats.map(s => Number(s[field])));

  return (
    <div className="space-y-6 relative">
      <ProgressBar active={loading} progress={progress} label={t(lang, 'analyzingNetwork')} />
      
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-700 pb-4">
        <div>
           <h1 className="text-3xl font-bold text-white tracking-tight uppercase">
             {t(lang, 'netTitle')}
           </h1>
           <p className="text-slate-400 mt-1">{t(lang, 'netSubtitle')}</p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={loadDemoData}
                className="text-xs text-slate-500 hover:text-white underline"
             >
                [Load Demo CSV]
             </button>
             <label className="bg-mariate-green hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase cursor-pointer transition-all shadow-lg">
                {t(lang, 'uploadStats')}
                <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
             </label>
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="h-64 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/30">
           <span className="text-4xl mb-3">📊</span>
           <p className="font-medium">{t(lang, 'dropFile')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
           
           {/* KPI Cards */}
           <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                 <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t(lang, 'kpiReach')}</h4>
                 <p className="text-2xl font-black text-white">
                    {(stats.reduce((a, b) => a + b.impressions, 0) / 1000).toFixed(1)}k
                 </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                 <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t(lang, 'kpiEng')}</h4>
                 <p className="text-2xl font-black text-emerald-400">
                    {(stats.reduce((a, b) => a + b.engagement, 0) / stats.length).toFixed(1)}%
                 </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                 <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{t(lang, 'kpiSent')}</h4>
                 <div className="flex items-end gap-2">
                    <div className="h-2 flex-1 bg-slate-700 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-blue-500" 
                         style={{ width: `${stats.reduce((a, b) => a + b.sentiment_score, 0) / stats.length}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-bold text-blue-400">
                        {Math.round(stats.reduce((a, b) => a + b.sentiment_score, 0) / stats.length)}/100
                    </span>
                 </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-4 rounded-xl border border-indigo-500/30 relative overflow-hidden">
                 <h4 className="text-indigo-300 text-[10px] uppercase font-bold tracking-wider relative z-10">TOP PLATFORM</h4>
                 <p className="text-xl font-black text-white relative z-10">
                    {analysis?.best_platform || "Calculating..."}
                 </p>
                 <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🏆</div>
              </div>
           </div>

           {/* Visualization Graph (Custom CSS Bars) */}
           <div className="lg:col-span-2 bg-mariate-panel rounded-xl p-6 border border-slate-700 shadow-xl">
              <h3 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-6">{t(lang, 'graphTitle')}</h3>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {stats.slice(0, 8).map((stat, i) => (
                    <div key={i} className="group">
                       <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-slate-400">{stat.platform} - {stat.top_topic}</span>
                          <span className="text-slate-500">{stat.date}</span>
                       </div>
                       <div className="h-8 bg-slate-900 rounded flex overflow-hidden relative">
                          <div 
                            className={`h-full transition-all duration-1000 ${
                                stat.platform === 'TikTok' ? 'bg-pink-600' : 
                                stat.platform === 'X' ? 'bg-white' : 'bg-purple-600'
                            }`}
                            style={{ width: `${(stat.impressions / getMaxVal('impressions')) * 100}%` }}
                          ></div>
                          <span className="absolute left-2 top-2 text-[10px] font-bold text-slate-900 mix-blend-screen">
                             {(stat.impressions / 1000).toFixed(1)}k Views
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* AI Agent Report */}
           <div className="bg-slate-950/50 rounded-xl p-6 border border-slate-700 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center font-bold text-white">AI</div>
                 <div>
                    <h3 className="text-white font-bold text-sm">AGENTE ESTRATEGA</h3>
                    <p className="text-[10px] text-slate-500">Gemini 3 Pro Analysis</p>
                 </div>
              </div>

              {analysis ? (
                 <div className="space-y-4 flex-1 text-xs md:text-sm overflow-y-auto">
                    <p className="text-slate-300 italic">"{analysis.summary}"</p>
                    
                    <div>
                       <h4 className="text-mariate-green font-bold uppercase tracking-wider text-[10px] mb-2">{t(lang, 'trendsTitle')}</h4>
                       <ul className="space-y-1">
                          {analysis.trends.map((t, i) => (
                             <li key={i} className="flex items-start gap-2 text-slate-400">
                                <span className="text-indigo-400">↗</span> {t}
                             </li>
                          ))}
                       </ul>
                    </div>

                    <div>
                       <h4 className="text-mariate-green font-bold uppercase tracking-wider text-[10px] mb-2">{t(lang, 'recTitle')}</h4>
                       <ul className="space-y-2">
                          {analysis.recommendations.map((r, i) => (
                             <li key={i} className="bg-slate-900/50 p-2 rounded border-l-2 border-mariate-green text-slate-300">
                                {r}
                             </li>
                          ))}
                       </ul>
                    </div>
                 </div>
              ) : (
                 <div className="flex-1 flex items-center justify-center flex-col text-slate-600">
                    <span className="animate-spin text-2xl mb-2">💠</span>
                    <p className="text-xs">Waiting for data...</p>
                 </div>
              )}
           </div>

        </div>
      )}
    </div>
  );
};