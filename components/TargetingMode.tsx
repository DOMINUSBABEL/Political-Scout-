
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Language, CandidateProfile, TargetSegment } from '../types';
import { t } from '../utils/translations';

interface Props {
  lang: Language;
  activeProfile: CandidateProfile;
}

export const TargetingMode: React.FC<Props> = ({ lang, activeProfile }) => {
  const [region, setRegion] = useState('Medellín - General');
  const [isGenerating, setIsGenerating] = useState(false);
  const [segments, setSegments] = useState<TargetSegment[]>([]);
  const [granularity, setGranularity] = useState(2); // 1 = Low, 2 = Medium, 3 = High

  // Simulate or use AI to generate segments based on the "Formula": Gender x Age x Topics x Location
  const generateSegments = async () => {
    setIsGenerating(true);
    setSegments([]);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Construct prompt based on user inputs
    const prompt = `
      Act as a Political Campaign Strategist for Candidate: ${activeProfile.name}.
      
      TASK: Perform a Voter Segmentation Analysis (Audience Targeting).
      REGION: ${region}.
      CONTEXT: The user wants to define specific voter groups by crossing Demographics (Age, Gender) with Location and Thematic Interests.
      
      DATA SOURCES SIMULATION: 
      - DANE (Demographics)
      - Google Ads (Interests)
      - Alcaldía/Planning Dept (Local context like "Comuna 7 Robledo has more families").
      
      Generate ${3 + granularity * 2} distinct, high-value voter segments.
      
      For each segment:
      1. Give it a catchy "Code Name" (e.g. "Eco-Moms Robledo", "Young Techies Poblado").
      2. Define demographics.
      3. Estimate voting affinity (0-100%) for ${activeProfile.name} based on her profile: "${activeProfile.styleDescription}".
      4. List key pain points.
      5. Suggest a specific campaign message.

      Return JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              segments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    demographics: {
                      type: Type.OBJECT,
                      properties: {
                        ageRange: { type: Type.STRING },
                        gender: { type: Type.STRING },
                        location: { type: Type.STRING }
                      }
                    },
                    estimatedSize: { type: Type.NUMBER },
                    affinityScore: { type: Type.NUMBER },
                    topInterests: { type: Type.ARRAY, items: { type: Type.STRING } },
                    painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendedStrategy: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      if (data.segments) {
        setSegments(data.segments);
      }
    } catch (e) {
      console.error(e);
      // Fallback data if AI fails
      setSegments([
        {
          id: '1',
          name: 'Madres Cabeza de Familia',
          demographics: { ageRange: '35-45', gender: 'Female', location: 'Comuna 7 (Robledo)' },
          estimatedSize: 12500,
          affinityScore: 78,
          topInterests: ['Educación', 'Seguridad Alimentaria'],
          painPoints: ['Costo de útiles escolares', 'Inseguridad en parques'],
          recommendedStrategy: 'Hablar de "Geología Social" para proteger escuelas.'
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <span className="w-2 h-8 bg-purple-500 rounded-full"></span>
             {t(lang, 'targetTitle')}
           </h1>
           <p className="text-slate-400 mt-2 font-mono text-xs uppercase tracking-wider pl-5">// {t(lang, 'targetSubtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Controls Panel */}
        <div className="glass-panel p-6 rounded-xl space-y-8 h-fit">
           <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <span className="text-xl">🎛️</span>
              <h3 className="font-bold text-white uppercase tracking-widest text-xs">{t(lang, 'paramsTitle')}</h3>
           </div>

           {/* Region Selector */}
           <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">{t(lang, 'regionSelect')}</label>
              <select 
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full glass-input p-3 rounded text-white text-sm"
              >
                <option value="Medellín - General">Medellín (All)</option>
                <option value="Comuna 1 - Popular">Comuna 1 - Popular</option>
                <option value="Comuna 7 - Robledo">Comuna 7 - Robledo</option>
                <option value="Comuna 14 - El Poblado">Comuna 14 - El Poblado</option>
                <option value="Antioquia - Rural">Antioquia (Rural)</option>
              </select>
           </div>

           {/* Granularity Slider */}
           <div className="space-y-4">
              <div className="flex justify-between">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Specificity</label>
                <span className="text-[10px] font-mono text-emerald-400">{granularity === 1 ? 'LOW (Broad)' : granularity === 2 ? 'MED (Standard)' : 'HIGH (Micro)'}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="1" 
                value={granularity} 
                onChange={(e) => setGranularity(parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-slate-500 italic">
                * Increases criteria (Gender x Age x Topic x Housing x Income)
              </p>
           </div>

           {/* Data Sources Badge */}
           <div className="bg-black/20 p-4 rounded border border-white/5">
              <span className="text-[9px] text-slate-500 uppercase font-bold block mb-2">Connected Data Sources (Simulated)</span>
              <div className="flex flex-wrap gap-2">
                 <span className="px-2 py-1 bg-blue-900/30 text-blue-400 text-[9px] rounded border border-blue-500/20">DANE 2024</span>
                 <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-[9px] rounded border border-yellow-500/20">Google Ads</span>
                 <span className="px-2 py-1 bg-emerald-900/30 text-emerald-400 text-[9px] rounded border border-emerald-500/20">Alcaldía (Planeación)</span>
              </div>
           </div>

           <button 
             onClick={generateSegments}
             disabled={isGenerating}
             className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] uppercase tracking-[0.2em] text-xs transition-all relative overflow-hidden"
           >
             {isGenerating ? (
               <span className="animate-pulse">PROCESSING CENSUS DATA...</span>
             ) : (
               <span>{t(lang, 'genSegments')}</span>
             )}
           </button>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-2 space-y-6">
           {segments.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center glass-panel rounded-xl p-12 text-slate-600 border-dashed border-2 border-slate-700">
                <span className="text-6xl mb-4 opacity-20">🎯</span>
                <p className="text-sm font-mono uppercase tracking-widest">Select region and generate segments</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {segments.map((seg, idx) => (
                 <div key={idx} className="glass-panel p-5 rounded-xl border-l-4 border-l-purple-500 hover:bg-white/5 transition-all group relative overflow-hidden">
                    {/* Background Affinity Gradient */}
                    <div 
                      className="absolute top-0 right-0 h-full w-1/2 opacity-10 pointer-events-none bg-gradient-to-l from-purple-500 to-transparent"
                      style={{ opacity: seg.affinityScore / 500 }}
                    ></div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                       <h3 className="font-bold text-white text-sm uppercase tracking-wider">{seg.name}</h3>
                       <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border ${
                         seg.affinityScore > 75 ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50' :
                         seg.affinityScore > 50 ? 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50' :
                         'bg-red-900/50 text-red-400 border-red-500/50'
                       }`}>
                         {seg.affinityScore}% AFFINITY
                       </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 mb-4 space-y-1 relative z-10">
                       <p>📍 {seg.demographics.location}</p>
                       <p>👥 {seg.demographics.gender}, {seg.demographics.ageRange}</p>
                       <p>📊 Est. Size: {seg.estimatedSize.toLocaleString()}</p>
                    </div>

                    <div className="mb-4 relative z-10">
                       <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Top Interests</p>
                       <div className="flex flex-wrap gap-1">
                          {seg.topInterests.map((int, i) => (
                            <span key={i} className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-slate-300 border border-white/5">{int}</span>
                          ))}
                       </div>
                    </div>

                    <div className="bg-black/30 p-3 rounded border border-white/5 relative z-10">
                       <p className="text-[9px] uppercase font-bold text-purple-400 mb-1">Strategy Tip</p>
                       <p className="text-xs text-slate-200 leading-snug italic">"{seg.recommendedStrategy}"</p>
                    </div>
                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
