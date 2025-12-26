
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, ResponseTone, NetworkStat, NetworkAgentAnalysis, CandidateProfile, VoterType, TargetSegment, AdCampaign, TrendAnalysis, ContentScheduleItem } from "../types";

// Helper for Base64 Audio decoding
const decodeAudioData = async (base64: string, ctx: AudioContext): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return await ctx.decodeAudioData(bytes.buffer);
};

// Helper: Clean JSON Markdown wrappers (Fixes the "Stuck/Loop" parsing error)
const cleanJSON = (text: string): string => {
  if (!text) return "{}";
  let clean = text.trim();
  // Remove markdown code blocks ```json ... ```
  clean = clean.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '');
  return clean.trim();
};

export const analyzeAndGenerate = async (
  author: string,
  postContent: string,
  profile: CandidateProfile,
  imageContext?: { base64?: string; mimeType?: string },
  scoutVisualDescription?: string,
  deepResearch: boolean = false,
  responseCount: number = 5
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const SYSTEM_PROMPT = `
ACTÚA COMO: ${profile.name}
ROL: ${profile.role}
PERFIL: ${profile.styleDescription}
CONTEXTO: ${profile.knowledgeBase.substring(0, 1000)}

IDIOMA SALIDA: ESPAÑOL.

TU TAREA:
1. Analizar post de redes sociales.
2. Generar ${responseCount} variaciones de respuesta estratégica.
3. Para CADA respuesta, diseña un "visualPrompt" para generar una imagen que acompañe al texto. 
   - IMPORTANTE: Si la estrategia requiere texto en la imagen (e.g. Meme, Frase), especifica en el visualPrompt: "Text inside image reading: 'TEXTO'".

MODO DEEP RESEARCH: ${deepResearch ? "ON" : "OFF"}.
`;

  let promptText = `
  ANÁLISIS DE POST:
  AUTOR: ${author}
  CONTENIDO: "${postContent}"
  `;

  if (imageContext) {
    promptText += `\n(Imagen adjunta analizada)`;
  }

  if (scoutVisualDescription) {
    promptText += `\nCONTEXTO VISUAL: "${scoutVisualDescription}"`;
  }

  const parts: any[] = [];
  
  if (imageContext && imageContext.base64) {
    parts.push({
      inlineData: {
        data: imageContext.base64,
        mimeType: imageContext.mimeType || "image/png"
      }
    });
  }

  parts.push({ text: promptText });

  const tools = deepResearch ? [{ googleSearch: {} }] : [];
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: tools,
        // Reduced thinking budget slightly to ensure we have room for the larger JSON output without timeout
        thinkingConfig: deepResearch ? { thinkingBudget: 1024 } : undefined, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughtProcess: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['Negative', 'Neutral', 'Positive', 'Troll'] },
            intent: { type: Type.STRING },
            voterClassification: { type: Type.STRING, enum: [
              VoterType.HARD_SUPPORT, VoterType.SOFT_SUPPORT, VoterType.UNDECIDED, 
              VoterType.SOFT_OPPOSITION, VoterType.HARD_OPPOSITION, VoterType.TROLL, VoterType.MEDIA
            ]},
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            warningMessage: { type: Type.STRING },
            followUpSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            responses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tone: { type: Type.STRING, enum: [ResponseTone.TECNICA, ResponseTone.FRENTERA, ResponseTone.EMPATICA, ResponseTone.SATIRICA, ResponseTone.VIRAL] },
                  content: { type: Type.STRING },
                  reasoning: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING, description: "Detailed prompt for an image generator. Include specific instructions for text rendering if needed (e.g. 'A neon sign saying VOTA')." }
                }
              }
            }
          }
        }
      },
    });

    const cleanText = cleanJSON(response.text || "{}");
    const parsed = JSON.parse(cleanText);
    
    // Fallback if array is empty
    if (!parsed.responses || !Array.isArray(parsed.responses)) {
        parsed.responses = [];
    }

    return parsed as AnalysisResult;

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const generateMarketingImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        // Enforce text rendering capability in prompt if it seems to contain text instructions
        let optimizedPrompt = prompt;
        if (prompt.toLowerCase().includes("text") || prompt.toLowerCase().includes("saying") || prompt.toLowerCase().includes("reading")) {
            optimizedPrompt = `High quality, photorealistic or stylized image. ${prompt}. Ensure any text specified is spelled correctly and legible.`;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: optimizedPrompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any, 
                    imageSize: "1K"
                }
            },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated");
    } catch (error) {
        console.error("Image Gen Error:", error);
        throw error;
    }
};

export const generateTrendContent = async (topic: string, platform: string, profile: CandidateProfile): Promise<{ text: string, visualPrompt: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      ACTÚA COMO: ${profile.name} (${profile.styleDescription}).
      TEMA DE TENDENCIA: "${topic}" en la plataforma ${platform}.
      
      TAREA:
      1. Redacta un post corto y viral sobre este tema, usando tu tono.
      2. Diseña un visualPrompt para generar una imagen que atraiga la atención. Si es para Instagram/Facebook, sugiere una imagen con texto superpuesto impactante.
      
      OUTPUT: JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                        visualPrompt: { type: Type.STRING }
                    }
                }
            }
        });
        return JSON.parse(cleanJSON(response.text || "{}"));
    } catch (e) {
        console.error("Trend Content Gen Error", e);
        return { text: "Error generando contenido.", visualPrompt: "Error" };
    }
};

// ... existing exports (translateToStyle, analyzeNetworkStats, scanNetworkTrends, generateSegments, generateContentSchedule, generateAdCampaign, generateMarketingAudio) stay exactly the same ...
// Re-exporting them to ensure file continuity in the XML replacement
export const translateToStyle = async (text: string, profile: CandidateProfile, deepResearch: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Traduce al estilo de ${profile.name}: "${text}". Solo texto traducido.`;
  const tools = deepResearch ? [{ googleSearch: {} }] : [];
  try {
    const response = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: prompt, config: { tools } });
    return response.text || "Error.";
  } catch (error) { return "Error."; }
};

export const analyzeNetworkStats = async (stats: NetworkStat[], deepResearch: boolean = false): Promise<NetworkAgentAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const statsSummary = JSON.stringify(stats.slice(0, 40)); 
  const prompt = `Analiza datos de redes. REPORTE TÉCNICO OBLIGATORIO. JSON. ${statsSummary}`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", contents: prompt,
      config: {
        tools: deepResearch ? [{ googleSearch: {} }] : [],
        thinkingConfig: deepResearch ? { thinkingBudget: 4096 } : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT, properties: {
            thoughtProcess: { type: Type.STRING }, technical_report: { type: Type.STRING },
            summary: { type: Type.STRING }, trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }, best_platform: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(cleanJSON(response.text || "{}"));
  } catch (error) { return { thoughtProcess: "", technical_report: "", summary: "Error", trends: [], recommendations: [], best_platform: "" }; }
};

export const scanNetworkTrends = async (date: string, location: string): Promise<TrendAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Scan digital trends for ${date} in ${location}. JSON Output.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", contents: prompt,
            config: {
                tools: [{ googleSearch: {} }], responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT, properties: {
                        date: { type: Type.STRING }, location: { type: Type.STRING }, summary: { type: Type.STRING },
                        topTrends: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { rank: { type: Type.INTEGER }, topic: { type: Type.STRING }, volume: { type: Type.STRING }, description: { type: Type.STRING }, platformSource: { type: Type.STRING }, sentiment: { type: Type.STRING } } } },
                        breakingNews: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });
        return JSON.parse(cleanJSON(response.text || "{}"));
    } catch (e) { throw e; }
};

export const generateSegments = async (region: string, profile: CandidateProfile, deepResearch: boolean = false): Promise<TargetSegment[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze voter segments for ${region}. Candidate: ${profile.name}. JSON Array.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", contents: prompt,
            config: {
                tools: deepResearch ? [{ googleSearch: {} }] : [],
                thinkingConfig: deepResearch ? { thinkingBudget: 2048 } : undefined,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, name: { type: Type.STRING }, demographics: { type: Type.OBJECT, properties: { ageRange: { type: Type.STRING }, gender: { type: Type.STRING }, location: { type: Type.STRING } } }, estimatedSize: { type: Type.NUMBER }, affinityScore: { type: Type.NUMBER }, topInterests: { type: Type.ARRAY, items: { type: Type.STRING } }, painPoints: { type: Type.ARRAY, items: { type: Type.STRING } }, recommendedStrategy: { type: Type.STRING } } }
                }
            }
        });
        const segments = JSON.parse(cleanJSON(response.text || "[]"));
        return segments.map((s: any, i: number) => ({ ...s, id: `seg-${Date.now()}-${i}`, demographics: s.demographics || { ageRange: 'Unknown', gender: 'Unknown', location: region } }));
    } catch (error) { throw error; }
};

export const generateContentSchedule = async (topic: string, region: string, profile: CandidateProfile): Promise<ContentScheduleItem[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Plan 5 social posts for topic "${topic}" in ${region}. Candidate ${profile.name}. JSON.`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview", contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { day: { type: Type.STRING }, time: { type: Type.STRING }, platform: { type: Type.STRING }, format: { type: Type.STRING }, contentIdea: { type: Type.STRING }, objective: { type: Type.STRING } } } }
            }
        });
        return JSON.parse(cleanJSON(response.text || "[]"));
    } catch (e) { throw e; }
};

export const generateAdCampaign = async (segment: TargetSegment, profile: CandidateProfile): Promise<AdCampaign> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const safeName = segment.name || "Audience";
    const prompt = `Design ad campaign for ${safeName}. Candidate ${profile.name}. Include visual prompt with text overlay instructions if needed. JSON.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview", contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], thinkingConfig: { thinkingBudget: 1024 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT, properties: {
              visualPrompt: { type: Type.STRING }, imageAspectRatio: { type: Type.STRING }, copyText: { type: Type.STRING }, audioScript: { type: Type.STRING }, callToAction: { type: Type.STRING },
              chronoposting: { type: Type.OBJECT, properties: { bestDay: { type: Type.STRING }, bestTime: { type: Type.STRING }, frequency: { type: Type.STRING }, reasoning: { type: Type.STRING } } }
            }
          }
        }
      });
      return JSON.parse(cleanJSON(response.text || "{}"));
    } catch (e) { throw e; }
};

export const generateMarketingAudio = async (text: string, voiceName: string = "Kore"): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: text }] }],
            config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } } },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio");
        return `data:audio/wav;base64,${base64Audio}`; 
    } catch (error) { throw error; }
};
