
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Language, CandidateProfile, TargetSegment } from '../types';
import { t } from '../utils/translations';

interface Props {
  lang: Language;
  activeProfile: CandidateProfile;
}

// Data Sets
const medellinComunas = [
  "Comuna 1 - Popular", "Comuna 2 - Santa Cruz", "Comuna 3 - Manrique", "Comuna 4 - Aranjuez",
  "Comuna 5 - Castilla", "Comuna 6 - Doce de Octubre", "Comuna 7 - Robledo", "Comuna 8 - Villa Hermosa",
  "Comuna 9 - Buenos Aires", "Comuna 10 - La Candelaria", "Comuna 11 - Laureles-Estadio",
  "Comuna 12 - La América", "Comuna 13 - San Javier", "Comuna 14 - El Poblado", "Comuna 15 - Guayabal",
  "Comuna 16 - Belén"
];

const medellinCorregimientos = [
  "San Sebastián de Palmitas", "San Cristóbal", 
  "Altavista", "San Antonio de Prado", "Santa Elena"
];

const areaMetropolitana = [
  "Barbosa", "Bello", "Caldas", "Copacabana", "Envigado", "Girardota", "Itagüí", "La Estrella", "Sabaneta"
];

const antioquiaMunicipios = [
  "Abejorral", "Abriaquí", "Alejandría", "Amagá", "Amalfi", "Andes", "Angelópolis", "Angostura", "Anorí", 
  "Santa Fe de Antioquia", "Anzá", "Apartadó", "Arboletes", "Argelia", "Armenia", "Belmira", "Betania", 
  "Betulia", "Ciudad Bolívar", "Briceño", "Buriticá", "Cáceres", "Caicedo", "Campamento", "Cañasgordas", 
  "Caracolí", "Caramanta", "Carepa", "El Carmen de Viboral", "Carolina del Príncipe", "Caucasia", "Chigorodó", 
  "Cisneros", "Cocorná", "Concepción", "Concordia", "Dabeiba", "Donmatías", "Ebéjico", "El Bagre", "Entrerríos", 
  "Fredonia", "Frontino", "Giraldo", "Gómez Plata", "Granada", "Guadalupe", "Guarne", "Guatapé", "Heliconia", 
  "Hispania", "Ituango", "Jardín", "Jericó", "La Ceja", "La Pintada", "La Unión", "Liborina", "Maceo", "Marinilla", 
  "Montebello", "Murindó", "Mutatá", "Nariño", "Necoclí", "Nechí", "Olaya", "Peque", "Pueblorrico", "Puerto Berrío", 
  "Puerto Nare", "Puerto Triunfo", "Remedios", "El Retiro", "Rionegro", "Sabanalarga", "Salgar", "San Andrés de Cuerquia", 
  "San Carlos", "San Francisco", "San Jerónimo", "San José de la Montaña", "San Juan de Urabá", "San Luis", 
  "San Pedro de los Milagros", "San Pedro de Urabá", "San Rafael", "San Roque", "San Vicente", "Santa Bárbara", 
  "Santa Rosa de Osos", "Santo Domingo", "El Santuario", "Segovia", "Sonsón", "Sopetrán", "Támesis", "Tarazá", 
  "Tarso", "Titiribí", "Toledo", "Turbo", "Uramita", "Urrao", "Valdivia", "Valparaíso", "Vegachí", "Venecia", 
  "Vigía del Fuerte", "Yalí", "Yarumal", "Yolombó", "Yondó", "Zaragoza"
];

export const TargetingMode: React.FC<Props> = ({ lang, activeProfile }) => {
  const [region, setRegion] = useState('Medellín - General');
  const [isGenerating, setIsGenerating] = useState(false);
  const [segments, setSegments] = useState<TargetSegment[]>([]);
  const [granularity, setGranularity] = useState(2); // 1 = Low, 2 = Medium, 3 = High
  const [searchStatus, setSearchStatus] = useState('');

  const generateSegments = async () => {
    setIsGenerating(true);
    setSearchStatus('INITIALIZING AGENT...');
    setSegments([]);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Updated Prompt to enforce Search Grounding (Scouting)
    const prompt = `
      ROLE: Elite Political Data Scout & Strategist.
      CANDIDATE: ${activeProfile.name} (${activeProfile.styleDescription}).
      
      MISSION:
      Perform LIVE WEB RECONNAISSANCE to identify specific voter segments in the region: "${region}".
      
      INSTRUCTIONS:
      1. USE GOOGLE SEARCH to find real, up-to-date data. Do not hallucinate.
      2. SEARCH TARGETS:
         - "Demografía DANE ${region} 2023 2024" (Look for age/gender distribution, income levels).
         - "Problemas sociales ${region} noticias recientes" (Identify pain points like security, mobility, hunger).
         - "Plan de Desarrollo ${region}" (To identify neglected zones).
      3. SYNTHESIZE the search results into ${3 + granularity * 2} distinct, high-value voter segments.
      
      SEGMENTATION LOGIC:
      - Cross-reference Demographics (Age/Gender) + Location + Current Events (Pain Points).
      - Example: If news says "Water shortages in ${region}", create a segment "Madres Afectadas por Cortes de Agua".

      OUTPUT REQUIREMENT:
      Return valid JSON containing the segments.
      For each segment, the 'affinityScore' (0-100) must reflect how likely they are to vote for ${activeProfile.name} based on her profile provided.
    `;

    try {
      setSearchStatus('SCOUTING WEB DATA (DANE/NEWS)...');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], // ENABLE WEB SCOUTING
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

      setSearchStatus('PROCESSING INTELLIGENCE...');
      const data = JSON.parse(response.text || "{}");
      
      // Extract grounding metadata if available to show sources (console for now)
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
         console.log("Sources found:", response.candidates[0].groundingMetadata.groundingChunks);
      }

      if (data.segments) {
        setSegments(data.segments);
      }
    } catch (e) {
      console.error(e);
      // Fallback data if AI fails (Network error)
      setSegments([
        {
          id: 'error-fallback',
          name: 'Error de Conexión',
          demographics: { ageRange: 'N/A', gender: 'N/A', location: region },
          estimatedSize: 0,
          affinityScore: 0,
          topInterests: ['Reintentar búsqueda'],
          painPoints: ['No se pudo acceder a datos en vivo'],
          recommendedStrategy: 'Verificar conexión a internet y API Key.'
        }
      ]);
    } finally {
      setIsGenerating(false);
      setSearchStatus('');
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
                className="w-full glass-input p-3 rounded text-white text-sm custom-scrollbar"
              >
                <option value="Medellín - General">Medellín (Todas las zonas)</option>
                <option value="Antioquia - General">Antioquia (Todo el departamento)</option>
                
                <optgroup label="Medellín - Comunas">
                  {medellinComunas.map(c => <option key={c} value={c}>{c}</option>)}
                </optgroup>
                
                <optgroup label="Medellín - Corregimientos">
                  {medellinCorregimientos.map(c => <option key={c} value={`Corregimiento ${c}`}>{c}</option>)}
                </optgroup>

                <optgroup label="Valle de Aburrá (Área Metro)">
                  {areaMetropolitana.map(m => <option key={m} value={m}>{m}</option>)}
                </optgroup>

                <optgroup label="Municipios de Antioquia">
                   {antioquiaMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
                </optgroup>
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
           <div className="bg-black/20 p-4 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] text-emerald-400 uppercase font-bold block">Live Web Intelligence Agent</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                 <span className="px-2 py-1 bg-blue-900/30 text-blue-300 text-[9px] rounded border border-blue-500/20">DANE (Census)</span>
                 <span className="px-2 py-1 bg-purple-900/30 text-purple-300 text-[9px] rounded border border-purple-500/20">Google Trends</span>
                 <span className="px-2 py-1 bg-slate-800 text-slate-300 text-[9px] rounded border border-white/10">Local News</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-2 font-mono leading-tight">
                 * Agent actively scouts external sources for real-time validation.
              </p>
           </div>

           <button 
             onClick={generateSegments}
             disabled={isGenerating}
             className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.3)] uppercase tracking-[0.2em] text-xs transition-all relative overflow-hidden group"
           >
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
             {isGenerating ? (
               <div className="flex items-center justify-center gap-2 relative z-10">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span className="animate-pulse">{searchStatus}</span>
               </div>
             ) : (
               <span className="relative z-10">{t(lang, 'genSegments')}</span>
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
                 <div key={idx} className="glass-panel p-5 rounded-xl border-l-4 border-l-purple-500 hover:bg-white/5 transition-all group relative overflow-hidden animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                    {/* Background Affinity Gradient */}
                    <div 
                      className="absolute top-0 right-0 h-full w-1/2 opacity-10 pointer-events-none bg-gradient-to-l from-purple-500 to-transparent"
                      style={{ opacity: seg.affinityScore / 500 }}
                    ></div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                       <h3 className="font-bold text-white text-sm uppercase tracking-wider pr-2">{seg.name}</h3>
                       <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border whitespace-nowrap ${
                         seg.affinityScore > 75 ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50' :
                         seg.affinityScore > 50 ? 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50' :
                         'bg-red-900/50 text-red-400 border-red-500/50'
                       }`}>
                         {seg.affinityScore}% AFFINITY
                       </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 mb-4 space-y-1 relative z-10">
                       <p className="flex items-center gap-2"><span className="opacity-50">📍</span> {seg.demographics.location}</p>
                       <p className="flex items-center gap-2"><span className="opacity-50">👥</span> {seg.demographics.gender}, {seg.demographics.ageRange}</p>
                       <p className="flex items-center gap-2"><span className="opacity-50">📊</span> Est. Size: {seg.estimatedSize.toLocaleString()}</p>
                    </div>

                    <div className="mb-4 relative z-10">
                       <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Top Interests & Pain Points</p>
                       <div className="flex flex-wrap gap-1">
                          {seg.topInterests.slice(0, 2).map((int, i) => (
                            <span key={`int-${i}`} className="text-[9px] bg-blue-900/20 px-1.5 py-0.5 rounded text-blue-200 border border-blue-500/20">{int}</span>
                          ))}
                          {seg.painPoints.slice(0, 2).map((pp, i) => (
                            <span key={`pp-${i}`} className="text-[9px] bg-red-900/20 px-1.5 py-0.5 rounded text-red-200 border border-red-500/20">⚠️ {pp}</span>
                          ))}
                       </div>
                    </div>

                    <div className="bg-black/30 p-3 rounded border border-white/5 relative z-10">
                       <p className="text-[9px] uppercase font-bold text-purple-400 mb-1 flex items-center gap-1">
                          <span>⚡</span> Strategy Tip
                       </p>
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
