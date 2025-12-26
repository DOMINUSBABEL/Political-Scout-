
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Language, CandidateProfile, TargetSegment, AdCampaign } from '../types';
import { generateAdCampaign, generateMarketingImage, generateMarketingAudio, generateSegments } from '../services/geminiService';
import { t } from '../utils/translations';
import { ThinkingConsole } from './ThinkingConsole';
import { ProgressBar } from './ProgressBar';

interface Props {
  lang: Language;
  activeProfile: CandidateProfile;
}

const VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];

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
  const [region, setRegion] = useState(medellinComunas[0]);
  const [deepResearch, setDeepResearch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingImageId, setLoadingImageId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const [segments, setSegments] = useState<TargetSegment[]>([]);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);

  const handleGenerateSegments = async () => {
    setLoading(true);
    setError(null);
    setSegments([]);
    
    try {
        const results = await generateSegments(region, activeProfile, deepResearch);
        if (!results || results.length === 0) {
            throw new Error("Analysis yielded no segments. Try disabling Deep Research or changing the region.");
        }
        setSegments(results);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to generate segments.");
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateAd = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment) return;

    setLoading(true);
    setError(null);
    
    try {
        const campaign = await generateAdCampaign(segment, activeProfile);
        
        setSegments(prev => prev.map(s => {
            if (s.id === segmentId) {
                return { ...s, adCampaign: campaign };
            }
            return s;
        }));
        setExpandedSegment(segmentId);
    } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to generate campaign.");
    } finally {
        setLoading(false);
    }
  };

  const handleGenerateImage = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !segment.adCampaign) return;

    setLoadingImageId(segmentId);
    setError(null);
    
    try {
        const imageUrl = await generateMarketingImage(
            segment.adCampaign.visualPrompt, 
            segment.adCampaign.imageAspectRatio
        );
        
        setSegments(prev => prev.map(s => {
            if (s.id === segmentId && s.adCampaign) {
                return { 
                    ...s, 
                    adCampaign: { ...s.adCampaign, generatedImageUrl: imageUrl } 
                };
            }
            return s;
        }));
    } catch (e: any) {
        console.error("Image Gen Failed", e);
        // Don't block whole UI, just show error in console or alert
        alert("Image generation failed. Please try again.");
    } finally {
        setLoadingImageId(null);
    }
  };

  const handleGenerateAudio = async (segmentId: string) => {
    const segment = segments.find(s => s.id === segmentId);
    if (!segment || !segment.adCampaign) return;

    setLoadingAudioId(segmentId);
    try {
        const audioUrl = await generateMarketingAudio(segment.adCampaign.audioScript);
        setSegments(prev => prev.map(s => {
            if (s.id === segmentId && s.adCampaign) {
                return { 
                    ...s, 
                    adCampaign: { ...s.adCampaign, generatedAudioUrl: audioUrl } 
                };
            }
            return s;
        }));
    } catch (e) {
        console.error("Audio Gen Failed", e);
        alert("Audio generation failed.");
    } finally {
        setLoadingAudioId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      <ProgressBar active={loading || !!loadingImageId || !!loadingAudioId} progress={loading ? 40 : 90} label="PROCESSING" estimatedSeconds={deepResearch ? 15 : 8} />

      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-purple-500 skew-x-12"></span>
            {t(lang, 'targetTitle')}
        </h1>
        <p className="text-slate-400 mt-2 font-mono text-xs uppercase tracking-wider pl-5">// {t(lang, 'targetSubtitle')}</p>
      </div>

      {/* Control Panel */}
      <div className="glass-panel p-6 rounded-xl animate-fade-in-up">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">{t(lang, 'paramsTitle')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <label className="block text-xs font-bold text-white mb-2">{t(lang, 'regionSelect')}</label>
                <select 
                    value={region} 
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded p-3 text-sm text-white focus:border-purple-500 outline-none transition-colors"
                >
                    <optgroup label="Medellín - Comunas">
                        {medellinComunas.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="Medellín - Corregimientos">
                        {medellinCorregimientos.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="Área Metropolitana">
                        {areaMetropolitana.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="Antioquia">
                         {antioquiaMunicipios.map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                </select>
            </div>
            
            <div 
                onClick={() => setDeepResearch(!deepResearch)}
                className={`border rounded p-4 cursor-pointer transition-all flex items-center gap-4 ${
                    deepResearch 
                    ? 'bg-purple-900/20 border-purple-500/50' 
                    : 'bg-black/20 border-white/10 hover:bg-white/5'
                }`}
            >
                <div className={`w-6 h-6 rounded flex items-center justify-center border ${deepResearch ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-600 text-transparent'}`}>✓</div>
                <div>
                    <span className="block text-sm font-bold text-white">Enable Deep Research</span>
                    <span className="text-[10px] text-slate-400 font-mono">Real-time Data (News, Census, Trends)</span>
                </div>
            </div>
        </div>

        {error && (
            <div className="mb-6 bg-red-950/30 border border-red-500/50 rounded-lg p-4 flex items-center gap-3 animate-pulse">
                <span className="text-2xl">⚠️</span>
                <span className="text-red-300 font-mono text-xs">{error}</span>
            </div>
        )}

        <ThinkingConsole isVisible={loading} mode="TARGETING" isDeepResearch={deepResearch} />

        <button 
            onClick={handleGenerateSegments}
            disabled={loading}
            className={`w-full font-bold py-4 rounded-lg uppercase tracking-[0.2em] text-xs shadow-lg transition-all ${
                loading 
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
        >
            {loading ? "ANALYZING POPULATION..." : t(lang, 'genSegments')}
        </button>
      </div>

      {/* Results Grid */}
      {segments.length > 0 && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in-up">
              {segments.map((seg, idx) => (
                  <div key={seg.id} className="glass-panel rounded-xl overflow-hidden border border-white/10 relative group">
                      
                      {/* Segment Header Card */}
                      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 relative z-10 bg-black/20">
                          <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                  <span className="text-purple-500 font-mono font-bold text-xs">0{idx+1}</span>
                                  <h3 className="text-2xl font-black text-white uppercase tracking-tight">{seg.name}</h3>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-4">
                                  <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 font-mono border border-white/5">{seg.demographics?.ageRange || 'N/A'}</span>
                                  <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 font-mono border border-white/5">{seg.demographics?.gender || 'N/A'}</span>
                                  <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 font-mono border border-white/5">{seg.demographics?.location || 'N/A'}</span>
                              </div>
                              <p className="text-slate-400 text-sm leading-relaxed mb-4">{seg.recommendedStrategy}</p>
                              
                              <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                                  <span>Affinity: <b className="text-emerald-400">{seg.affinityScore}%</b></span>
                                  <span>Size: <b className="text-blue-400">~{seg.estimatedSize?.toLocaleString() || 'Unknown'}</b></span>
                              </div>
                          </div>

                          <div className="w-full md:w-48 flex flex-col justify-center">
                              {!seg.adCampaign ? (
                                  <button 
                                    onClick={() => handleGenerateAd(seg.id)}
                                    className="w-full py-3 border border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white rounded font-bold text-[10px] uppercase tracking-widest transition-all"
                                  >
                                    {t(lang, 'genAdBtn')}
                                  </button>
                              ) : (
                                  <div className="text-center">
                                      <div className="inline-block p-2 rounded-full bg-emerald-500/20 text-emerald-400 mb-2">
                                          ✓
                                      </div>
                                      <p className="text-[10px] font-mono text-emerald-500 uppercase">Campaign Ready</p>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Campaign Details (Expandable) */}
                      {seg.adCampaign && (
                          <div className="border-t border-white/5 bg-slate-900/50 p-6 md:p-8 animate-fade-in-up">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  
                                  {/* Visuals Column */}
                                  <div className="space-y-4">
                                      <div className="flex justify-between items-center">
                                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t(lang, 'adVisual')}</h4>
                                          <span className="text-[9px] font-mono text-slate-600 bg-white/5 px-2 py-1 rounded">AR: {seg.adCampaign.imageAspectRatio}</span>
                                      </div>
                                      
                                      <div className="aspect-video bg-black/40 rounded-lg border border-white/10 flex items-center justify-center overflow-hidden relative group/img">
                                          {seg.adCampaign.generatedImageUrl ? (
                                              <img src={seg.adCampaign.generatedImageUrl} alt="Campaign" className="w-full h-full object-cover" />
                                          ) : (
                                              <div className="text-center p-6">
                                                  <p className="text-xs text-slate-500 font-mono mb-4 line-clamp-3 italic">
                                                      "{seg.adCampaign.visualPrompt}"
                                                  </p>
                                                  <button 
                                                    onClick={() => handleGenerateImage(seg.id)}
                                                    disabled={!!loadingImageId}
                                                    className="px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg transition-all"
                                                  >
                                                      {loadingImageId === seg.id ? "GENERATING..." : "GENERATE IMAGE"}
                                                  </button>
                                              </div>
                                          )}
                                      </div>
                                  </div>

                                  {/* Copy & Audio Column */}
                                  <div className="space-y-6">
                                      <div>
                                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{t(lang, 'adCopy')}</h4>
                                          <div className="bg-white/5 p-4 rounded border border-white/5 text-sm text-slate-200 leading-relaxed font-medium">
                                              {seg.adCampaign.copyText}
                                          </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-blue-900/10 p-3 rounded border border-blue-500/20">
                                              <h5 className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-1">{t(lang, 'adChrono')}</h5>
                                              <p className="text-white font-bold">{seg.adCampaign.chronoposting.bestDay}</p>
                                              <p className="text-xs text-slate-400">{seg.adCampaign.chronoposting.bestTime}</p>
                                          </div>
                                          <div className="bg-emerald-900/10 p-3 rounded border border-emerald-500/20">
                                              <h5 className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Call to Action</h5>
                                              <p className="text-white text-xs">{seg.adCampaign.callToAction}</p>
                                          </div>
                                      </div>

                                      {/* Audio Gen */}
                                      <div className="pt-2 border-t border-white/5">
                                          <div className="flex justify-between items-center mb-2">
                                              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Audio Script</h4>
                                              {!seg.adCampaign.generatedAudioUrl && (
                                                  <button 
                                                    onClick={() => handleGenerateAudio(seg.id)}
                                                    disabled={!!loadingAudioId}
                                                    className="text-[9px] text-purple-400 hover:text-white uppercase font-bold tracking-widest"
                                                  >
                                                      {loadingAudioId === seg.id ? "GENERATING..." : "GENERATE AUDIO"}
                                                  </button>
                                              )}
                                          </div>
                                          <p className="text-xs text-slate-400 font-mono italic mb-3">"{seg.adCampaign.audioScript}"</p>
                                          
                                          {seg.adCampaign.generatedAudioUrl && (
                                              <audio controls src={seg.adCampaign.generatedAudioUrl} className="w-full h-8 opacity-70 hover:opacity-100 transition-opacity" />
                                          )}
                                      </div>
                                  </div>

                              </div>
                          </div>
                      )}
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
