
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';
import { NetworkStat, Language, NetworkAgentAnalysis, TrendAnalysis, CandidateProfile } from '../types';
import { analyzeNetworkStats, scanNetworkTrends, generateTrendContent, generateMarketingImage } from '../services/geminiService';
import { ProgressBar } from './ProgressBar';
import { t } from '../utils/translations';

interface Props {
  lang: Language;
}

// Mock profile just for trend content generation context if App doesn't pass one
// Ideally, App should pass activeProfile here too.
const DEFAULT_PROFILE: CandidateProfile = {
    id: 'default', name: 'Agent', role: 'Candidate', styleDescription: 'Professional, engaging', knowledgeBase: '', avatar: null, themeColor: '#10B981'
};

type SentimentFilterType = 'ALL' | '0-50' | '50-75' | '75-100';
type NetworkTab = 'UPLOAD' | 'LIVE';

export const NetworkAnalysisMode: React.FC<Props> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<NetworkTab>('UPLOAD');
  
  // File Upload State
  const [stats, setStats] = useState<NetworkStat[]>([]);
  const [analysis, setAnalysis] = useState<NetworkAgentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Filters
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilterType>('ALL');
  const [filterPlatform, setFilterPlatform] = useState<string | null>(null);
  const [filterAge, setFilterAge] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterInterest, setFilterInterest] = useState<string>('ALL');

  // Available Filter Options (Dynamic)
  const [availableAges, setAvailableAges] = useState<string[]>([]);
  const [availableGenders, setAvailableGenders] = useState<string[]>([]);
  const [availableInterests, setAvailableInterests] = useState<string[]>([]);

  // Live Trend Scan State
  const [trendDate, setTrendDate] = useState(new Date().toISOString().split('T')[0]);
  const [trendLocation, setTrendLocation] = useState('Colombia');
  const [trendResults, setTrendResults] = useState<TrendAnalysis | null>(null);
  
  // Creative Studio State
  const [generatingTrendContent, setGeneratingTrendContent] = useState<number | null>(null); // Index of trend
  const [trendContent, setTrendContent] = useState<{[key: number]: {text: string, image?: string}}>({});

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
      topic: headers.findIndex(h => h.includes('topic') || h.includes('tema') || h.includes('category') || h.includes('categoría')),
      // Demographics
      age: headers.findIndex(h => h.includes('age') || h.includes('edad') || h.includes('rango')),
      gender: headers.findIndex(h => h.includes('gender') || h.includes('género') || h.includes('sexo')),
      interest: headers.findIndex(h => h.includes('interest') || h.includes('interés') || h.includes('gustos'))
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
        
        // Extract Optional Demographics
        const ageVal = colMap.age !== -1 ? row[colMap.age]?.trim().replace(/['"]+/g, '') : undefined;
        const genderVal = colMap.gender !== -1 ? row[colMap.gender]?.trim().replace(/['"]+/g, '') : undefined;
        const interestVal = colMap.interest !== -1 ? row[colMap.interest]?.trim().replace(/['"]+/g, '') : undefined;

        parsed.push({
            date: rawDate,
            platform: platStr || 'Unknown',
            impressions: isNaN(impVal) ? 0 : impVal,
            engagement: isNaN(engVal) ? 0 : engVal,
            sentiment_score: isNaN(sentVal) ? 50 : sentVal,
            top_topic: topicStr || 'General',
            age_group: ageVal,
            gender: genderVal,
            interest_category: interestVal
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
    // Reset filters
    setFilterAge('ALL');
    setFilterGender('ALL');
    setFilterInterest('ALL');

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
        
        // Extract available filters options
        const ages = Array.from(new Set(parsedData.map(d => d.age_group).filter(Boolean))) as string[];
        const genders = Array.from(new Set(parsedData.map(d => d.gender).filter(Boolean))) as string[];
        const interests = Array.from(new Set(parsedData.map(d => d.interest_category).filter(Boolean))) as string[];
        
        setAvailableAges(ages);
        setAvailableGenders(genders);
        setAvailableInterests(interests);

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

  const handleScanTrends = async () => {
      if(!trendLocation) return;
      setLoading(true);
      setTrendResults(null);
      setProgress(20);
      
      try {
          // Simulate progress
          const timer = setInterval(() => setProgress(p => Math.min(p + 5, 90)), 300);
          
          const results = await scanNetworkTrends(trendDate, trendLocation);
          
          clearInterval(timer);
          setTrendResults(results);
          setProgress(100);
      } catch (e) {
          console.error(e);
          setErrorMessage("Failed to scan trends. Please check API Key or try again.");
      } finally {
          setTimeout(() => {
              setLoading(false);
              setProgress(0);
          }, 500);
      }
  };

  const handleCreateTrendContent = async (index: number, topic: string, platform: string) => {
      setGeneratingTrendContent(index);
      try {
          // 1. Generate text and visual prompt
          const content = await generateTrendContent(topic, platform, DEFAULT_PROFILE);
          
          // 2. Generate Image
          let imageUrl = undefined;
          if (content.visualPrompt) {
              imageUrl = await generateMarketingImage(content.visualPrompt);
          }

          setTrendContent(prev => ({
              ...prev,
              [index]: { text: content.text, image: imageUrl }
          }));

      } catch (e) {
          console.error(e);
          alert("Error creating content.");
      } finally {
          setGeneratingTrendContent(null);
      }
  };

  const loadDemoData = async () => {
    setLoading(true);
    setProgress(20);
    setAnalysis(null);
    setErrorMessage(null);
    
    const platforms = ['TikTok', 'Instagram', 'X', 'Facebook'];
    const topics = ['Minería', 'Seguridad', 'Movilidad', 'Educación', 'Salud'];
    const ages = ['18-24', '25-34', '35-44', '45+'];
    const genders = ['M', 'F'];
    const interests = ['Tecnología', 'Política', 'Deportes', 'Música'];
    
    const demoData: NetworkStat[] = Array.from({ length: 40 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (40 - i));
      
      return {
        date: date.toISOString().split('T')[0],
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        impressions: 2000 + Math.floor(Math.random() * 15000),
        engagement: 1.5 + Math.random() * 6.5,
        sentiment_score: 20 + Math.floor(Math.random() * 80),
        top_topic: topics[Math.floor(Math.random() * topics.length)],
        age_group: ages[Math.floor(Math.random() * ages.length)],
        gender: genders[Math.floor(Math.random() * genders.length)],
        interest_category: interests[Math.floor(Math.random() * interests.length)]
      };
    });
    
    setAvailableAges(ages);
    setAvailableGenders(genders);
    setAvailableInterests(interests);

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

      if (sentimentFilter !== 'ALL') {
          filtered = filtered.filter(s => {
            if (sentimentFilter === '0-50') return s.sentiment_score >= 0 && s.sentiment_score <= 50;
            if (sentimentFilter === '50-75') return s.sentiment_score > 50 && s.sentiment_score <= 75;
            if (sentimentFilter === '75-100') return s.sentiment_score > 75 && s.sentiment_score <= 100;
            return true;
        });
      }

      if (filterPlatform) {
          filtered = filtered.filter(s => s.platform === filterPlatform);
      }

      if (filterAge !== 'ALL') {
          filtered = filtered.filter(s => s.age_group === filterAge);
      }
      if (filterGender !== 'ALL') {
          filtered = filtered.filter(s => s.gender === filterGender);
      }
      if (filterInterest !== 'ALL') {
          filtered = filtered.filter(s => s.interest_category === filterInterest);
      }

      return filtered;
  }, [stats, sentimentFilter, filterPlatform, filterAge, filterGender, filterInterest]);

  const handleLegendClick = (e: any) => {
      const platformName = e.value; 
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
      <ProgressBar active={loading} progress={progress} label={activeTab === 'LIVE' ? t(lang, 'scanning') : t(lang, 'analyzingNetwork')} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
             {t(lang, 'netTitle')}
           </h1>
           <p className="text-slate-400 mt-2 font-mono text-xs uppercase tracking-wider pl-5">// {t(lang, 'netSubtitle')}</p>
        </div>
        
        {/* Tab Switcher */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            <button 
                onClick={() => setActiveTab('UPLOAD')}
                className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'UPLOAD' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
            >
                {t(lang, 'tabUpload')}
            </button>
            <button 
                onClick={() => setActiveTab('LIVE')}
                className={`px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeTab === 'LIVE' ? 'bg-pink-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
                }`}
            >
                {t(lang, 'tabLiveScan')}
            </button>
        </div>
      </div>

      {activeTab === 'UPLOAD' ? (
          <>
            {/* ... Existing Upload Logic ... */}
            <div className="flex justify-end gap-3 w-full">
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
                <p className="text-[10px] mt-2 opacity-50 font-mono">CSV: Date, Platform, Impressions, Engagement, Sentiment, Topic (Optional: Age, Gender, Interest)</p>
                </div>
            ) : stats.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-float">
                
                {/* Filters & KPIs */}
                <div className="lg:col-span-3">
                    <div className="glass-panel p-4 rounded-xl mb-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            {/* Sentiment Filter */}
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t(lang, 'filterSentiment')}:</span>
                                <div className="flex gap-1">
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
                            </div>

                            {/* Demographics Filters */}
                            <div className="flex gap-3">
                                {availableAges.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{t(lang, 'filterAge')}</span>
                                        <select 
                                            value={filterAge}
                                            onChange={(e) => setFilterAge(e.target.value)}
                                            className="bg-black/40 text-white text-[10px] border border-white/10 rounded px-2 py-1 outline-none focus:border-blue-500"
                                        >
                                            <option value="ALL">{t(lang, 'filterAll')}</option>
                                            {availableAges.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                )}
                                {availableGenders.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{t(lang, 'filterGender')}</span>
                                        <select 
                                            value={filterGender}
                                            onChange={(e) => setFilterGender(e.target.value)}
                                            className="bg-black/40 text-white text-[10px] border border-white/10 rounded px-2 py-1 outline-none focus:border-blue-500"
                                        >
                                            <option value="ALL">{t(lang, 'filterAll')}</option>
                                            {availableGenders.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                )}
                                 {availableInterests.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">{t(lang, 'filterInterest')}</span>
                                        <select 
                                            value={filterInterest}
                                            onChange={(e) => setFilterInterest(e.target.value)}
                                            className="bg-black/40 text-white text-[10px] border border-white/10 rounded px-2 py-1 outline-none focus:border-blue-500"
                                        >
                                            <option value="ALL">{t(lang, 'filterAll')}</option>
                                            {availableInterests.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-3 border-t border-white/5 pt-2">
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
                            
                            {/* Technical Report Section (New) */}
                            {analysis.technical_report && (
                                <div className="bg-black/30 p-4 rounded-lg border border-slate-700 font-mono">
                                    <h4 className="text-slate-500 font-bold uppercase text-[9px] mb-2 tracking-widest border-b border-slate-700 pb-1 flex items-center gap-2">
                                        <span>⚙️</span> {t(lang, 'technicalReport')}
                                    </h4>
                                    <p className="text-emerald-500/80 leading-relaxed text-[10px] whitespace-pre-wrap">
                                        {analysis.technical_report}
                                    </p>
                                </div>
                            )}

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
                    {/* ... Existing Bar Chart ... */}
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
          </>
      ) : (
          /* LIVE TREND SCANNER TAB */
          <div className="animate-fade-in-up space-y-8">
              {/* ... Existing Scanner UI ... */}
              <div className="glass-panel p-6 rounded-xl border border-pink-500/20 bg-pink-900/5">
                  <h3 className="text-pink-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
                     <span className="text-lg">📡</span> {t(lang, 'scanTitle')}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                      <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">{t(lang, 'scanDate')}</label>
                          <input 
                            type="date" 
                            value={trendDate}
                            onChange={(e) => setTrendDate(e.target.value)}
                            className="w-full glass-input p-3 rounded text-white text-sm"
                          />
                      </div>
                      <div>
                          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-2">{t(lang, 'scanLoc')}</label>
                          <input 
                             type="text" 
                             value={trendLocation} 
                             onChange={(e) => setTrendLocation(e.target.value)}
                             placeholder="e.g. Colombia, Medellín, Bogotá" 
                             className="w-full glass-input p-3 rounded text-white text-sm"
                          />
                      </div>
                      <button 
                         onClick={handleScanTrends}
                         disabled={loading}
                         className="h-[46px] bg-pink-600 hover:bg-pink-500 text-white font-bold uppercase tracking-widest text-xs rounded shadow-[0_0_15px_rgba(219,39,119,0.3)] transition-all flex items-center justify-center gap-2"
                      >
                         {loading ? "SCANNING..." : t(lang, 'scanBtn')}
                      </button>
                  </div>
              </div>

              {trendResults && (
                  <div className="animate-fade-in-up">
                      <div className="flex items-center gap-4 mb-6">
                          <h3 className="text-2xl font-black text-white uppercase">{t(lang, 'trendResults')}</h3>
                          <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-1 rounded font-mono border border-white/10">
                             {trendResults.date} @ {trendResults.location}
                          </span>
                      </div>

                      {/* Executive Summary */}
                      <div className="glass-panel p-6 rounded-xl border-l-4 border-pink-500 mb-8 bg-gradient-to-r from-pink-900/10 to-transparent">
                          <h4 className="text-pink-400 font-bold uppercase text-[10px] mb-2 tracking-widest">Digital Atmosphere Summary</h4>
                          <p className="text-slate-200 leading-relaxed text-sm">{trendResults.summary}</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Top Trends List */}
                          <div className="space-y-4">
                              <h4 className="text-slate-500 font-bold uppercase tracking-widest text-xs border-b border-white/5 pb-2">Top Viral Topics</h4>
                              {trendResults.topTrends.map((trend, i) => (
                                  <div key={i} className="glass-panel p-4 rounded-lg flex flex-col gap-4 hover:bg-white/5 transition-colors group">
                                      <div className="flex items-start gap-4">
                                        <div className="text-3xl font-black text-white/10 group-hover:text-pink-500/50 transition-colors">
                                            0{trend.rank}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h5 className="text-white font-bold text-lg leading-tight mb-1">{trend.topic}</h5>
                                                <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${
                                                    trend.sentiment === 'Positive' ? 'bg-emerald-900/40 text-emerald-400' :
                                                    trend.sentiment === 'Negative' ? 'bg-red-900/40 text-red-400' : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                    {trend.sentiment}
                                                </span>
                                            </div>
                                            <p className="text-slate-400 text-xs mb-2 leading-snug">{trend.description}</p>
                                            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                                    {trend.platformSource}
                                                </span>
                                                {trend.volume && (
                                                    <span className="text-pink-400/80">
                                                        Vol: {trend.volume}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                      </div>

                                      {/* Creative Studio Button */}
                                      <button 
                                        onClick={() => handleCreateTrendContent(i, trend.topic, trend.platformSource)}
                                        disabled={generatingTrendContent === i}
                                        className="w-full bg-slate-800 hover:bg-pink-900/30 border border-white/5 hover:border-pink-500/30 text-slate-300 hover:text-pink-300 py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                      >
                                          {generatingTrendContent === i ? <span className="animate-pulse">GENERATING...</span> : <><span>🎨</span> CREATE POST & IMAGE</>}
                                      </button>

                                      {/* Generated Content Display */}
                                      {trendContent[i] && (
                                          <div className="mt-2 bg-black/40 p-4 rounded border border-pink-500/20 animate-fade-in-up">
                                              <p className="text-xs text-white mb-3 font-medium italic">"{trendContent[i].text}"</p>
                                              {trendContent[i].image ? (
                                                  <img src={trendContent[i].image} alt="Trend Visual" className="w-full rounded border border-white/10" />
                                              ) : (
                                                  <div className="h-24 bg-white/5 rounded flex items-center justify-center text-xs text-slate-500">Image Loading...</div>
                                              )}
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>

                          {/* Breaking News Feed */}
                          <div>
                              <h4 className="text-slate-500 font-bold uppercase tracking-widest text-xs border-b border-white/5 pb-2 mb-4">Headlines & Context</h4>
                              <div className="glass-panel p-0 rounded-xl overflow-hidden">
                                  {trendResults.breakingNews.map((news, i) => (
                                      <div key={i} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors flex gap-3">
                                          <span className="text-slate-600 font-mono text-xs mt-1">[{i+1}]</span>
                                          <p className="text-slate-300 text-sm leading-snug">{news}</p>
                                      </div>
                                  ))}
                              </div>
                              
                              {/* Decorative Element */}
                              <div className="mt-6 p-4 rounded-lg bg-emerald-900/10 border border-emerald-500/20 text-center">
                                  <p className="text-emerald-400 text-[10px] font-mono uppercase tracking-widest mb-1">AI Recommendation</p>
                                  <p className="text-white text-xs">
                                      "Align today's content strategy with topic <strong>#{trendResults.topTrends[0]?.topic || 'Trending'}</strong> to maximize organic reach."
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
