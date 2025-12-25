
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';
import { NetworkStat, Language, NetworkAgentAnalysis } from '../types';
import { analyzeNetworkStats } from '../services/geminiService';
import { ProgressBar } from './ProgressBar';
import { t } from '../utils/translations';

interface Props {
  lang: Language;
}

type SentimentFilterType = 'ALL' | '0-50' | '50-75' | '75-100';

export const NetworkAnalysisMode: React.FC<Props> = ({ lang }) => {
  const [stats, setStats] = useState<NetworkStat[]>([]);
  const [analysis, setAnalysis] = useState<NetworkAgentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilterType>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);

  // Robust CSV Parser
  const parseCSV = (text: string): NetworkStat[] => {
    // Handle different line endings
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) throw new Error("File too short");

    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const delimiter = semiCount > commaCount ? ';' : ',';

    const headers = firstLine.toLowerCase().split(delimiter).map(h => h.trim().replace(/['"]+/g, ''));
    
    // Enhanced Column Mapping with synonyms
    const colMap = {
      date: headers.findIndex(h => h.includes('date') || h.includes('fecha') || h.includes('time') || h.includes('día')),
      platform: headers.findIndex(h => h.includes('platform') || h.includes('plataforma') || h.includes('network') || h.includes('red') || h.includes('source')),
      impressions: headers.findIndex(h => h.includes('impression') || h.includes('impresiones') || h.includes('views') || h.includes('vistas') || h.includes('reach') || h.includes('alcance')),
      engagement: headers.findIndex(h => h.includes('engagement') || h.includes('interacción') || h.includes('likes') || h.includes('me gusta')),
      sentiment: headers.findIndex(h => h.includes('sentiment') || h.includes('sentimiento') || h.includes('score')),
      topic: headers.findIndex(h => h.includes('topic') || h.includes('tema') || h.includes('category') || h.includes('categoría'))
    };

    // Fallback: If no 'date' header found, check if first column of second row looks like a date
    if (colMap.date === -1) {
        const secondLineCols = lines[1].split(delimiter);
        if (secondLineCols.length > 0 && !isNaN(Date.parse(secondLineCols[0].replace(/['"]+/g, '')))) {
            colMap.date = 0;
        } else {
            throw new Error("Missing Column: Date/Fecha (Required)");
        }
    }

    // Allow parsing even if Sentiment is missing (default to 50)
    // We strictly need at least Impressions OR Engagement to make charts useful
    if (colMap.impressions === -1 && colMap.engagement === -1) {
        throw new Error("Missing Data: Need 'Impressions' or 'Engagement' column.");
    }

    const startIndex = 1; 

    const parsed: NetworkStat[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
        const row = lines[i].split(delimiter);
        if (row.length < 2) continue;

        // Extract Date
        const rawDate = row[colMap.date]?.trim().replace(/['"]+/g, '');
        if (!rawDate || isNaN(Date.parse(rawDate))) continue; // Skip invalid dates

        // Extract Platform
        const platStr = colMap.platform !== -1 ? row[colMap.platform]?.trim().replace(/['"]+/g, '') : 'Unknown';
        
        // Extract Metrics (sanitize non-numeric chars)
        let impVal = 0;
        if (colMap.impressions !== -1) {
            impVal = parseInt(row[colMap.impressions]?.replace(/[^0-9]/g, '') || '0');
        }

        let engVal = 0;
        if (colMap.engagement !== -1) {
            engVal = parseFloat(row[colMap.engagement]?.replace(/[^0-9.]/g, '') || '0');
        }

        // Extract Sentiment (Default 50)
        let sentVal = 50;
        if (colMap.sentiment !== -1) {
            const val = row[colMap.sentiment]?.replace(/[^0-9]/g, '');
            sentVal = val ? parseInt(val) : 50;
        }

        const topicStr = colMap.topic !== -1 ? row[colMap.topic]?.trim().replace(/['"]+/g, '') : 'General';

        parsed.push({
            date: rawDate,
            platform: platStr || 'Unknown',
            impressions: isNaN(impVal) ? 0 : impVal,
            engagement: isNaN(engVal) ? 0 : engVal,
            sentiment_score: isNaN(sentVal) ? 50 : sentVal,
            top_topic: topicStr || 'General'
        });
    }

    if (parsed.length === 0) throw new Error("No valid data rows could be parsed.");
    return parsed;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgress(10);
    setAnalysis(null);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setProgress(30);
      const text = evt.target?.result as string;
      
      try {
        let parsedData: NetworkStat[] = [];

        if (file.name.endsWith('.json')) {
            parsedData = JSON.parse(text);
        } else {
            parsedData = parseCSV(text);
        }

        if (parsedData.length === 0) {
            setErrorMessage(t(lang, 'errorNoData'));
            setLoading(false);
            return;
        }

        parsedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setStats(parsedData);
        setProgress(60);
        
        const result = await analyzeNetworkStats(parsedData);
        setAnalysis(result);
        
        setProgress(100);
        setTimeout(() => setLoading(false), 500);

      } catch (err: any) {
        console.error("Parse Error", err);
        setErrorMessage(err.message || t(lang, 'errorFormat'));
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const loadDemoData = async () => {
    setLoading(true);
    setProgress(20);
    setAnalysis(null);
    setErrorMessage(null);
    
    const platforms = ['TikTok', 'Instagram', 'X', 'Facebook'];
    const topics = ['Minería', 'Seguridad', 'Movilidad', 'Educación', 'Salud'];
    
    const demoData: NetworkStat[] = Array.from({ length: 25 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (25 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        impressions: 2000 + Math.floor(Math.random() * 15000),
        engagement: 1.5 + Math.random() * 6.5,
        sentiment_score: 20 + Math.floor(Math.random() * 80),
        top_topic: topics[Math.floor(Math.random() * topics.length)]
      };
    });
    
    setProgress(50);
    setStats(demoData);
    
    const result = await analyzeNetworkStats(demoData);
    setAnalysis(result);
    setProgress(100);
    setTimeout(() => setLoading(false), 500);
  };

  const handleDownload = () => {
      if (stats.length === 0) return;
      const exportData = {
          metadata: { exported_at: new Date().toISOString(), total_records: stats.length, ai_analysis: analysis },
          data: stats
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CandidatoAI_NetworkReport_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const filteredStats = useMemo(() => {
      let filtered = stats;

      // Filter by Sentiment
      if (sentimentFilter !== 'ALL') {
          filtered = filtered.filter(s => {
            if (sentimentFilter === '0-50') return s.sentiment_score >= 0 && s.sentiment_score <= 50;
            if (sentimentFilter === '50-75') return s.sentiment_score > 50 && s.sentiment_score <= 75;
            if (sentimentFilter === '75-100') return s.sentiment_score > 75 && s.sentiment_score <= 100;
            return true;
        });
      }

      // Filter by Platform (Interactive)
      if (filterPlatform) {
          filtered = filtered.filter(s => s.platform === filterPlatform);
      }

      return filtered;
  }, [stats, sentimentFilter, filterPlatform]);

  const handleLegendClick = (e: any) => {
      const platformName = e.value; // The platform name usually comes in 'value' or 'id'
      if (platformName) {
          setFilterPlatform(prev => prev === platformName ? null : platformName);
      }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur border border-emerald-500/30 p-3 rounded shadow-xl text-xs">
          <p className="font-bold text-emerald-400 mb-1 font-mono">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 relative pb-20">
      <ProgressBar active={loading} progress={progress} label={t(lang, 'analyzingNetwork')} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
             {t(lang, 'netTitle')}
           </h1>
           <p className="text-slate-400 mt-2 font-mono text-xs uppercase tracking-wider pl-5">// {t(lang, 'netSubtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
             {stats.length > 0 && (
                 <button 
                    onClick={handleDownload}
                    className="bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2 rounded-lg font-bold text-[10px] uppercase transition-all border border-white/5 flex items-center gap-2"
                 >
                    <span>💾</span> {t(lang, 'downloadData')}
                 </button>
             )}
             <button 
                onClick={loadDemoData}
                className="text-[10px] font-mono text-slate-500 hover:text-white underline w-full md:w-auto text-left md:text-center uppercase"
             >
                [Load Demo Data]
             </button>
             <label className="bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 text-blue-400 hover:text-white px-5 py-2 rounded-lg font-bold text-xs uppercase cursor-pointer transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                <span>📁</span> {t(lang, 'uploadStats')}
                <input type="file" accept=".csv,.json" onChange={handleFileUpload} className="hidden" />
             </label>
        </div>
      </div>

      {errorMessage && (
          <div className="glass-panel border-red-500/50 text-red-300 p-4 rounded-xl flex items-center gap-3 animate-pulse">
              <span className="text-2xl">⚠️</span>
              <span className="font-bold font-mono">{errorMessage}</span>
          </div>
      )}

      {stats.length === 0 && !errorMessage ? (
        <div className="h-64 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-slate-600 bg-black/20 mx-4 md:mx-0">
           <span className="text-5xl mb-4 opacity-20">📊</span>
           <p className="font-medium text-center px-4 tracking-wider uppercase text-xs">{t(lang, 'dropFile')}</p>
           <p className="text-[10px] mt-2 opacity-50 font-mono">CSV: Date, Platform, Impressions, Engagement, Sentiment, Topic</p>
        </div>
      ) : stats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-float">
           
           {/* Filters & KPIs */}
           <div className="lg:col-span-3">
               <div className="flex flex-col md:flex-row gap-4 mb-4 items-center glass-panel p-4 rounded-xl">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(lang, 'filterSentiment')}:</span>
                   <div className="flex gap-2">
                       {(['ALL', '0-50', '50-75', '75-100'] as SentimentFilterType[]).map(filter => (
                           <button
                             key={filter}
                             onClick={() => setSentimentFilter(filter)}
                             className={`px-3 py-1.5 rounded text-[10px] font-bold font-mono transition-all ${
                                 sentimentFilter === filter 
                                 ? 'bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]' 
                                 : 'bg-white/5 text-slate-500 hover:text-white'
                             }`}
                           >
                               {filter === 'ALL' ? t(lang, 'filterAll') : filter}
                           </button>
                       ))}
                   </div>
                   
                   {/* Platform Filter Badge */}
                   {filterPlatform && (
                        <div className="flex items-center gap-2 bg-blue-900/50 px-3 py-1 rounded text-[10px] font-bold border border-blue-500/50 text-blue-300">
                             PLATFORM: {filterPlatform}
                             <button onClick={() => setFilterPlatform(null)} className="hover:text-white">✕</button>
                        </div>
                   )}

                   <div className="ml-auto text-[10px] text-slate-500 font-mono">
                       INDEXING {filteredStats.length} / {stats.length} RECORDS
                   </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="glass-panel p-5 rounded-xl border-t-2 border-t-blue-500">
                        <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t(lang, 'kpiReach')}</h4>
                        <p className="text-2xl font-black text-white">
                            {(filteredStats.reduce((a, b) => a + b.impressions, 0) / 1000).toFixed(1)}k
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border-t-2 border-t-purple-500">
                        <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t(lang, 'kpiEng')}</h4>
                        <p className="text-2xl font-black text-purple-400">
                            {(filteredStats.length > 0 ? (filteredStats.reduce((a, b) => a + b.engagement, 0) / filteredStats.length).toFixed(1) : 0)}%
                        </p>
                    </div>
                    <div className="glass-panel p-5 rounded-xl border-t-2 border-t-emerald-500">
                        <h4 className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">{t(lang, 'kpiSent')}</h4>
                        <p className="text-2xl font-black text-emerald-400">
                            {filteredStats.length > 0 ? Math.round(filteredStats.reduce((a, b) => a + b.sentiment_score, 0) / filteredStats.length) : 0}/100
                        </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/40 to-slate-900 p-5 rounded-xl border border-blue-500/20 relative overflow-hidden backdrop-blur-md">
                        <h4 className="text-blue-300 text-[10px] uppercase font-bold tracking-widest relative z-10">TOP PLATFORM</h4>
                        <p className="text-xl font-black text-white relative z-10 truncate mt-1">
                            {analysis?.best_platform || "ANALYZING..."}
                        </p>
                        <div className="absolute -top-2 -right-2 p-4 opacity-10 text-6xl rotate-12">🏆</div>
                    </div>
               </div>
           </div>

           {/* Chart 1: Impressions Trend (Area Chart) */}
           <div className="lg:col-span-2 glass-panel rounded-xl p-6 shadow-xl h-[350px]">
              <h3 className="text-slate-300 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> IMPRESSIONS TREND
              </h3>
              <ResponsiveContainer width="100%" height="85%">
                <AreaChart data={filteredStats}>
                  <defs>
                    <linearGradient id="colorImp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(str) => str.substring(5)} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="impressions" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorImp)" />
                </AreaChart>
              </ResponsiveContainer>
           </div>

           {/* AI Campaign Manager Report (Side Panel) */}
           <div className="lg:row-span-2 bg-slate-950/40 backdrop-blur-xl rounded-xl p-0 border border-white/5 flex flex-col shadow-2xl relative overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] text-lg">
                        <span className="animate-pulse">📊</span>
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-xs uppercase tracking-widest">Campaign Manager</h3>
                        <p className="text-[9px] text-blue-400 font-mono">AGENT STATUS: ACTIVE</p>
                    </div>
                 </div>
              </div>

              {analysis ? (
                 <div className="space-y-6 flex-1 text-xs p-6 overflow-y-auto custom-scrollbar">
                    
                    {/* Executive Summary Section */}
                    <div className="bg-gradient-to-r from-blue-900/10 to-transparent p-4 rounded-lg border-l-2 border-blue-500">
                      <h4 className="text-blue-400 font-bold uppercase text-[10px] mb-2 tracking-widest">Executive Summary</h4>
                      <p className="text-slate-300 leading-relaxed font-light italic">"{analysis.summary}"</p>
                    </div>
                    
                    {/* Trends Section */}
                    <div>
                       <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2">
                         <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                         {t(lang, 'trendsTitle')}
                       </h4>
                       <ul className="space-y-2">
                          {analysis.trends.map((t, i) => (
                             <li key={i} className="flex items-start gap-3 text-slate-400 border-b border-dashed border-white/5 pb-2">
                                <span className="text-emerald-500 font-mono">0{i+1}</span> 
                                <span className="leading-tight">{t}</span>
                             </li>
                          ))}
                       </ul>
                    </div>

                    {/* Recommendations Section */}
                    <div>
                       <h4 className="text-white font-bold uppercase tracking-widest text-[10px] mb-3 flex items-center gap-2">
                         <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                         {t(lang, 'recTitle')}
                       </h4>
                       <ul className="space-y-2">
                          {analysis.recommendations.map((r, i) => (
                             <li key={i} className="bg-white/5 p-3 rounded text-slate-300 shadow-sm border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                <span className="block text-purple-400 font-bold text-[9px] mb-1">STRATEGY {i+1}</span>
                                {r}
                             </li>
                          ))}
                       </ul>
                    </div>
                 </div>
              ) : (
                 <div className="flex-1 flex items-center justify-center flex-col text-slate-600">
                    <div className="w-12 h-12 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-[10px] font-mono uppercase tracking-widest">Generating Strategic Report...</p>
                 </div>
              )}
           </div>

           {/* Chart 2: Engagement by Platform (Bar Chart) with Interactive Filtering */}
           <div className="lg:col-span-2 glass-panel rounded-xl p-6 shadow-xl h-[350px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-slate-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> ENGAGEMENT BY PLATFORM
                </h3>
                {filterPlatform && (
                    <span className="text-[9px] text-blue-400 uppercase tracking-widest animate-pulse">
                        * Filter Active: {filterPlatform}
                    </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={filteredStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                  <XAxis dataKey="platform" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend 
                    onClick={handleLegendClick} 
                    wrapperStyle={{ cursor: 'pointer', fontSize: '10px', paddingTop: '10px' }} 
                    formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value} {filterPlatform === value ? '(Selected)' : ''}</span>}
                  />
                  <Bar 
                    dataKey="engagement" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]} 
                    name="Engagement" 
                    cursor="pointer" 
                    onClick={(data: any) => setFilterPlatform(prev => prev === (data.platform || data.payload?.platform) ? null : (data.platform || data.payload?.platform))}
                  >
                    {
                      filteredStats.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.platform === 'TikTok' ? '#db2777' : entry.platform === 'X' ? '#94a3b8' : '#8b5cf6'} 
                            opacity={filterPlatform && filterPlatform !== entry.platform ? 0.3 : 1}
                        />
                      ))
                    }
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center text-[9px] text-slate-600 mt-2 font-mono">
                  * Click bars or legend to filter data
              </p>
           </div>

        </div>
      )}
    </div>
  );
};
