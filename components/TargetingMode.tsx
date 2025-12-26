
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Language, CandidateProfile, TargetSegment, AdCampaign } from '../types';
import { generateAdCampaign, generateMarketingImage, generateMarketingAudio } from '../services/geminiService';
import { t } from '../utils/translations';
import { ThinkingConsole } from './ThinkingConsole';

interface Props {
  lang: Language;
  activeProfile: CandidateProfile;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

// Helper to convert base64 PCM to WAV for playback
const pcmToWav = (base64: string) => {
    // This is a simplified placeholder. In a real app, we'd add a WAV header to the raw PCM data.
    // For this demo, we will use a workaround or assume the browser can handle the stream if we use AudioContext.
    // But to make the <audio> tag work, we really need a WAV header.
    // Since implementing a full WAV encoder here is long, we will use a trick:
    // We will let the component play it using AudioContext instead of <audio src>.
    return base64;
};

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
  const [deepResearch, setDeepResearch] = useState(true); 
  const [analysisReasoning, setAnalysisReasoning] = useState<string>('');
  
  // Ad Campaign Generation States
  const [generatingAdFor, setGeneratingAdFor] = useState<string | null>(null);
  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null);
  const [generatingAudioFor, setGeneratingAudioFor] = useState<string | null>(null);
  
  // Audio State
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [customVoiceFile, setCustomVoiceFile] = useState<string | null>(null);

  // Playback refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);

  const generateSegments = async () => {
    setIsGenerating(true);
    setSearchStatus('INITIALIZING AGENT...');
    setSegments([]);
    setAnalysisReasoning('');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Updated Prompt to enforce Search Grounding (Scouting)
    const prompt = `
      ROLE: Elite Political Data Scout & Strategist.
      CANDIDATE: ${activeProfile.name} (${activeProfile.styleDescription}).
      
      MISSION:
      Perform LIVE WEB RECONNAISSANCE to identify specific voter segments in the region: "${region}".
      
      ${deepResearch ? "MODE: DEEP RESEARCH ENABLED. Search extensively for recent news and stats." : ""}

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
      Return valid JSON containing the segments AND a 'thoughtProcess' field summarizing your findings.
    `;

    try {
      setSearchStatus('SCOUTING WEB DATA (DANE/NEWS)...');
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], // ENABLE WEB SCOUTING
          thinkingConfig: deepResearch ? { thinkingBudget: 2048 } : undefined,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              thoughtProcess: { type: Type.STRING },
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
      
      if (data.segments) {
        setSegments(data.segments);
      }
      if (data.thoughtProcess) {
        setAnalysisReasoning(data.thoughtProcess);
      }
    } catch (e) {
      console.error(e);
      setSegments([]);
    } finally {
      setIsGenerating(false);
      setSearchStatus('');
    }
  };

  const handleGenerateAd = async (segment: TargetSegment) => {
      setGeneratingAdFor(segment.id);
      try {
          const campaign = await generateAdCampaign(segment, activeProfile);
          setSegments(prev => prev.map(s => 
              s.id === segment.id ? { ...s, adCampaign: campaign } : s
          ));
      } catch (err) {
          console.error("Ad Gen Failed", err);
      } finally {
          setGeneratingAdFor(null);
      }
  };

  const handleGenerateImage = async (segment: TargetSegment, aspectRatio: string) => {
    if (!segment.adCampaign?.visualPrompt) return;
    setGeneratingImageFor(segment.id);
    try {
        const imageUrl = await generateMarketingImage(segment.adCampaign.visualPrompt, aspectRatio);
        setSegments(prev => prev.map(s => 
            s.id === segment.id && s.adCampaign
              ? { ...s, adCampaign: { ...s.adCampaign, generatedImageUrl: imageUrl, imageAspectRatio: aspectRatio as any } } 
              : s
        ));
    } catch (err) {
        console.error("Image Gen Failed", err);
        alert("Failed to generate image. Try again.");
    } finally {
        setGeneratingImageFor(null);
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>, segmentId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setSegments(prev => prev.map(s => 
          s.id === segmentId && s.adCampaign
            ? { ...s, adCampaign: { ...s.adCampaign, generatedImageUrl: base64 } } 
            : s
        ));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAudio = async (segment: TargetSegment) => {
      if (!segment.adCampaign?.audioScript) return;
      setGeneratingAudioFor(segment.id);
      try {
          // If a custom voice file is uploaded, in a real scenario we'd clone it.
          // Here, we simulate using the 'custom' context by picking a voice or just using the standard one.
          const audioBase64 = await generateMarketingAudio(segment.adCampaign.audioScript, selectedVoice);
          setSegments(prev => prev.map(s => 
              s.id === segment.id && s.adCampaign
                ? { ...s, adCampaign: { ...s.adCampaign, generatedAudioUrl: audioBase64 } } 
                : s
          ));
      } catch (err) {
          console.error("Audio Gen Failed", err);
      } finally {
          setGeneratingAudioFor(null);
      }
  };

  const playAudio = async (base64Audio: string, id: string) => {
    try {
        if (isPlaying === id) {
            audioSourceRef.current?.stop();
            setIsPlaying(null);
            return;
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start(0);
        audioSourceRef.current = source;
        setIsPlaying(id);
        
        source.onended = () => setIsPlaying(null);

    } catch (e) {
        console.error("Playback error", e);
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
           </div>

           {/* Data Sources Badge & Deep Research */}
           <div className="bg-black/20 p-4 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
              <div className="flex items-center justify-between mb-2">
                 <span className="text-[9px] text-emerald-400 uppercase font-bold block">Live Web Intelligence</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
              
              <div 
                  onClick={() => setDeepResearch(!deepResearch)}
                  className={`mb-3 flex items-center gap-2 p-2 rounded cursor-pointer transition-all border ${deepResearch ? 'bg-purple-900/40 border-purple-500' : 'bg-black/40 border-white/5'}`}
              >
                   <div className={`w-3 h-3 rounded-full border ${deepResearch ? 'bg-purple-500 border-white' : 'border-slate-500'}`}></div>
                   <span className={`text-[9px] font-bold uppercase ${deepResearch ? 'text-white' : 'text-slate-500'}`}>Deep Research Mode</span>
              </div>
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
           <ThinkingConsole isVisible={isGenerating} mode="TARGETING" isDeepResearch={deepResearch} />
           
           {/* REASONING PANEL */}
           {analysisReasoning && !isGenerating && (
              <div className="glass-panel p-4 rounded-lg border-l-4 border-purple-500 bg-purple-900/10 animate-fade-in-up">
                 <h4 className="text-purple-400 font-bold uppercase text-[10px] tracking-widest mb-2 flex items-center gap-2">
                   <span>🧠</span> Segmentation Logic
                 </h4>
                 <p className="text-slate-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                   {analysisReasoning}
                 </p>
              </div>
           )}

           {segments.length === 0 && !isGenerating ? (
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
                      style={{ opacity: (seg.affinityScore || 0) / 500 }}
                    ></div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                       <h3 className="font-bold text-white text-sm uppercase tracking-wider pr-2">{seg.name}</h3>
                       <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded border whitespace-nowrap ${
                         (seg.affinityScore || 0) > 75 ? 'bg-emerald-900/50 text-emerald-400 border-emerald-500/50' :
                         (seg.affinityScore || 0) > 50 ? 'bg-yellow-900/50 text-yellow-400 border-yellow-500/50' :
                         'bg-red-900/50 text-red-400 border-red-500/50'
                       }`}>
                         {seg.affinityScore || 0}% AFFINITY
                       </span>
                    </div>

                    <div className="mb-4 relative z-10">
                       <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">Top Interests & Pain Points</p>
                       <div className="flex flex-wrap gap-1">
                          {(seg.topInterests || []).slice(0, 2).map((int, i) => (
                            <span key={`int-${i}`} className="text-[9px] bg-blue-900/20 px-1.5 py-0.5 rounded text-blue-200 border border-blue-500/20">{int}</span>
                          ))}
                          {(seg.painPoints || []).slice(0, 2).map((pp, i) => (
                            <span key={`pp-${i}`} className="text-[9px] bg-red-900/20 px-1.5 py-0.5 rounded text-red-200 border border-red-500/20">⚠️ {pp}</span>
                          ))}
                       </div>
                    </div>

                    {/* AD CAMPAIGN GENERATOR SECTION */}
                    {seg.adCampaign ? (
                         <div className="space-y-4 relative z-10 animate-fade-in-up">
                            
                            {/* VISUAL STUDIO */}
                            <div className="bg-emerald-900/10 border border-emerald-500/20 rounded p-3">
                                <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span>📸</span> Visual Studio
                                </h4>
                                
                                {/* Image Preview */}
                                <div className={`bg-black border border-white/10 rounded overflow-hidden mb-3 mx-auto shadow-2xl relative group/img ${
                                    seg.adCampaign.imageAspectRatio === "16:9" ? "aspect-video" :
                                    seg.adCampaign.imageAspectRatio === "9:16" ? "aspect-[9/16] max-w-[180px]" : "aspect-square max-w-[280px]"
                                }`}>
                                    {seg.adCampaign.generatedImageUrl ? (
                                        <img src={seg.adCampaign.generatedImageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 text-[10px] text-center p-4 gap-2">
                                            {generatingImageFor === seg.id ? (
                                                <>
                                                 <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                 <span>RENDERING 1K IMAGE...</span>
                                                </>
                                            ) : (
                                                <>
                                                  <span>NO IMAGE</span>
                                                  <span className="text-[8px] opacity-50">Select Ratio & Generate</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/80 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                        <div className="flex gap-1 mb-2">
                                            {["1:1", "16:9", "9:16"].map(ratio => (
                                                <button 
                                                    key={ratio}
                                                    onClick={(e) => { e.stopPropagation(); handleGenerateImage(seg, ratio); }}
                                                    className="px-2 py-1 bg-white/10 hover:bg-white/20 text-[9px] rounded text-white border border-white/10"
                                                >
                                                    {ratio}
                                                </button>
                                            ))}
                                        </div>
                                        <label className="px-3 py-1 bg-emerald-600 text-white rounded text-[9px] font-bold uppercase tracking-wider hover:bg-emerald-500 cursor-pointer">
                                            Upload Own
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => handleCustomImageUpload(e, seg.id)} 
                                            />
                                        </label>
                                    </div>
                                </div>
                                
                                <p className="text-[9px] text-white mb-2 font-medium bg-black/30 p-2 rounded">
                                    <span className="text-emerald-500 font-bold mr-1">COPY:</span>
                                    "{seg.adCampaign.copyText}"
                                </p>
                            </div>

                            {/* AUDIO STUDIO */}
                            <div className="bg-purple-900/10 border border-purple-500/20 rounded p-3">
                                <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span>🎙️</span> Audio Spot Pauta X
                                </h4>
                                
                                <div className="bg-black/30 p-2 rounded mb-3 max-h-20 overflow-y-auto">
                                    <p className="text-[9px] text-slate-300 font-mono whitespace-pre-wrap">
                                        {seg.adCampaign.audioScript}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1">
                                        <label className="text-[8px] uppercase font-bold text-slate-500 block mb-1">Voice Profile</label>
                                        <select 
                                            value={selectedVoice} 
                                            onChange={(e) => setSelectedVoice(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded text-xs text-white p-1"
                                        >
                                            {VOICES.map(v => <option key={v} value={v}>{v}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                         <label className="text-[8px] uppercase font-bold text-slate-500 block mb-1">Reference (Clone)</label>
                                         <label className="w-full bg-black/40 border border-white/10 rounded text-xs text-slate-400 p-1 block text-center cursor-pointer hover:bg-white/5 truncate">
                                             {customVoiceFile ? "Analysis Complete" : "Upload MP3"}
                                             <input type="file" accept="audio/*" className="hidden" onChange={(e) => e.target.files?.[0] && setCustomVoiceFile(e.target.files[0].name)} />
                                         </label>
                                    </div>
                                </div>

                                {seg.adCampaign.generatedAudioUrl ? (
                                    <div className="flex items-center gap-2 bg-purple-500/20 p-2 rounded border border-purple-500/50">
                                        <button 
                                            onClick={() => playAudio(seg.adCampaign?.generatedAudioUrl || "", seg.id)}
                                            className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center hover:bg-purple-400 text-white"
                                        >
                                            {isPlaying === seg.id ? "⏸" : "▶"}
                                        </button>
                                        <div className="flex-1">
                                            <div className="h-1 bg-purple-900/50 rounded-full overflow-hidden">
                                                <div className={`h-full bg-purple-400 ${isPlaying === seg.id ? "animate-pulse" : "w-full"}`}></div>
                                            </div>
                                            <p className="text-[8px] text-purple-300 mt-1 uppercase">Audio Generated successfully</p>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleGenerateAudio(seg)}
                                        disabled={!!generatingAudioFor}
                                        className="w-full py-2 bg-purple-600/20 border border-purple-500/50 text-purple-300 rounded text-[9px] font-bold uppercase hover:bg-purple-600 hover:text-white transition-all"
                                    >
                                        {generatingAudioFor === seg.id ? "Generating Audio..." : "Generate Audio Spot"}
                                    </button>
                                )}
                            </div>

                         </div>
                    ) : (
                        <button 
                            onClick={() => handleGenerateAd(seg)}
                            disabled={!!generatingAdFor}
                            className={`w-full py-2 rounded border border-dashed font-bold text-[10px] uppercase tracking-widest transition-all relative z-10 ${
                                generatingAdFor === seg.id 
                                ? 'bg-slate-800 border-slate-600 text-slate-400 cursor-wait' 
                                : 'bg-transparent border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500'
                            }`}
                        >
                            {generatingAdFor === seg.id ? (
                                <span className="animate-pulse">GENERATING CAMPAIGN...</span>
                            ) : (
                                <span>+ {t(lang, 'genAdBtn')}</span>
                            )}
                        </button>
                    )}

                 </div>
               ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};
