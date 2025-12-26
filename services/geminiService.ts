
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
PERFIL DE PERSONALIDAD Y ESTILO:
${profile.styleDescription}

BASE DE CONOCIMIENTO (CONTEXTO Y PROPUESTAS):
${profile.knowledgeBase}

IDIOMA DE SALIDA: ESPAÑOL (Siempre).

TU TAREA:
Analizar posts de redes sociales (texto e imágenes) y generar respuestas defendiendo tus posturas o proponiendo tus ideas.
${deepResearch ? "MODO DEEP RESEARCH: Activa tu capacidad de razonamiento profundo. Busca en la web si es necesario para verificar hechos antes de responder." : ""}

INSTRUCCIONES DE ESTILO:
1. Adopta estrictamente el tono descrito en tu PERFIL.
2. Usa la información de tu BASE DE CONOCIMIENTO para fundamentar tus respuestas. No inventes propuestas que no estén ahí.
3. Si el tono es informal, no suenes como una IA, suena humano.
4. Genera respuestas tácticas para redes sociales.
`;

  let promptText = `
  Analiza el siguiente post de redes sociales.
  
  AUTOR DEL POST: ${author}
  CONTENIDO (Texto detectado): "${postContent}"
  `;

  if (imageContext) {
    promptText += `\nNOTA: Se adjunta una imagen cruda para tu análisis directo.`;
  }

  if (scoutVisualDescription) {
    promptText += `\nREPORTE DEL AGENTE SCOUT (Descripción Visual/Contexto): "${scoutVisualDescription}"`;
  }

  promptText += `
  PASO 1: PERFILAMIENTO DE VOTANTE (Psychographics).
  Clasifica al autor.

  PASO 2: ANÁLISIS DE RIESGO.
  Detecta temas sensibles.

  PASO 3: RESPUESTA TÁCTICA.
  Genera EXACTAMENTE ${responseCount} variaciones de respuesta en ESPAÑOL.
  
  ${deepResearch ? "PASO 4: RAZONAMIENTO (OBLIGATORIO). Explica paso a paso tu análisis antes de generar el JSON final." : ""}
  `;

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
        thinkingConfig: deepResearch ? { thinkingBudget: 2048 } : undefined, 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughtProcess: { type: Type.STRING, description: "Your step-by-step reasoning logic in Spanish." },
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
                }
              }
            }
          }
        }
      },
    });

    const parsed = JSON.parse(cleanJSON(response.text || "{}"));
    if (!parsed.responses || !Array.isArray(parsed.responses)) {
        parsed.responses = [];
    }

    return parsed as AnalysisResult;

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const translateToStyle = async (text: string, profile: CandidateProfile, deepResearch: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
  Traduce el siguiente texto corporativo/aburrido al estilo de ${profile.name} (${profile.styleDescription}).
  Usa su base de conocimiento si es relevante: ${profile.knowledgeBase.substring(0, 500)}...
  ${deepResearch ? "Investiga brevemente el tema si es complejo para asegurar precisión técnica antes de traducir." : ""}
  
  TEXTO ORIGINAL: "${text}"
  
  Solo devuelve el texto traducido con su personalidad en ESPAÑOL, nada más.
  `;

  const tools = deepResearch ? [{ googleSearch: {} }] : [];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: tools
      }
    });
    return response.text || "Error generating translation.";
  } catch (error) {
    console.error("Gemini Translator Error:", error);
    return "Error connecting to AI brain.";
  }
};

export const analyzeNetworkStats = async (stats: NetworkStat[], deepResearch: boolean = false): Promise<NetworkAgentAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Create a summary including demographics if present
  const statsSummary = JSON.stringify(stats.slice(0, 40)); 

  const prompt = `
    Eres "El Estratega de Campaña" (Campaign Manager Agent).
    
    Analiza esta matriz de datos de redes sociales y genera un REPORTE EJECUTIVO DETALLADO en ESPAÑOL:
    ${statsSummary}
    
    ${deepResearch ? "Realiza un análisis PROFUNDO. Busca correlaciones no obvias. Piensa paso a paso." : ""}

    TAREAS:
    1. Identifica qué temas (top_topic) están funcionando mejor y por qué.
    2. Detecta qué plataforma tiene mejor engagement.
    3. Si hay datos demográficos (Edad/Género), inclúyelos en tu análisis de segmentación.
    4. Dame 3 recomendaciones tácticas CONCRETAS para la próxima semana.
    
    REQUERIMIENTO ESPECIAL - REPORTE TÉCNICO:
    Debes incluir un campo 'technical_report' que explique con lenguaje técnico/científico de datos cómo se procesó esta información. 
    Menciona: 
    - Metodología de ingesta (CSV Parsing).
    - Normalización de métricas (Engagement Rate Calculation).
    - Filtrado de ruido y detección de outliers.
    - Si detectaste segmentos de edad o género, menciona cómo se ponderaron.
    
    Devuelve JSON estructurado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: deepResearch ? [{ googleSearch: {} }] : [],
        thinkingConfig: deepResearch ? { thinkingBudget: 4096 } : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughtProcess: { type: Type.STRING },
            technical_report: { type: Type.STRING, description: "Detailed technical explanation of data extraction and processing methodology." },
            summary: { type: Type.STRING },
            trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            best_platform: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(cleanJSON(response.text || "{}")) as NetworkAgentAnalysis;

  } catch (error) {
    console.error("Network Agent Error:", error);
    return {
      thoughtProcess: "Analysis failed.",
      technical_report: "Error generating technical report.",
      summary: "Error analyzing data.",
      trends: [],
      recommendations: ["Check data format"],
      best_platform: "N/A"
    };
  }
};

export const scanNetworkTrends = async (date: string, location: string): Promise<TrendAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    ACT AS: Senior Political Intelligence Analyst.
    MISSION: Perform a scan of DIGITAL TRENDS and NEWS for a specific date and location using Google Search.
    
    PARAMETERS:
    - Date: ${date}
    - Geolocation: ${location}
    
    INSTRUCTIONS:
    1. Search for what was trending on Google Trends, Twitter (X), and Local News on that specific date in that location.
    2. Identify the top 5 most talked-about topics (hashtags, scandals, events).
    3. Identify 3 major Breaking News headlines from that day.
    4. Provide a brief summary of the digital mood (General Sentiment).
    
    OUTPUT: JSON format in SPANISH.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        date: { type: Type.STRING },
                        location: { type: Type.STRING },
                        summary: { type: Type.STRING, description: "Executive summary of the day's digital atmosphere in Spanish." },
                        topTrends: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    rank: { type: Type.INTEGER },
                                    topic: { type: Type.STRING },
                                    volume: { type: Type.STRING, description: "Estimated search/post volume if available, e.g. '50k+'" },
                                    description: { type: Type.STRING },
                                    platformSource: { type: Type.STRING, enum: ['Google', 'X', 'TikTok', 'News'] },
                                    sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] }
                                }
                            }
                        },
                        breakingNews: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        });

        return JSON.parse(cleanJSON(response.text || "{}")) as TrendAnalysis;

    } catch (e) {
        console.error("Trend Scan Error:", e);
        throw e;
    }
};

export const generateSegments = async (region: string, profile: CandidateProfile, deepResearch: boolean = false): Promise<TargetSegment[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      ROLE: Chief Political Strategist & Data Scientist.
      TASK: Analyze the voter demographics and psychographics for: ${region}.
      CANDIDATE CONTEXT: ${profile.name} (${profile.styleDescription}).
      
      ${deepResearch ? "DEEP RESEARCH MODE: Search for real recent news, DANE census data, and social trends in this specific region." : ""}

      OUTPUT: Generate 4 distinct Target Segments (Clusters) that exist in this region.
      For each segment, provide:
      1. Name (creative, e.g., "Madres Cabeza de Familia", "Jóvenes Sin Futuro").
      2. Demographics (Age, Gender, Location nuances).
      3. Pain Points (Specific local problems).
      4. Affinity Score (0-100, how likely are they to vote for ${profile.name} based on her style).
      5. Recommended Strategy (How to approach them).

      LANGUAGE: SPANISH.
      Return JSON Array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                tools: deepResearch ? [{ googleSearch: {} }] : [],
                thinkingConfig: deepResearch ? { thinkingBudget: 2048 } : undefined, // Reduced from 35k to prevent long loops
                responseMimeType: "application/json",
                responseSchema: {
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
        });
        
        // Post-processing with CleanJSON and safe defaults
        const segments = JSON.parse(cleanJSON(response.text || "[]")) as TargetSegment[];
        
        return segments.map((s, i) => ({ 
            ...s, 
            id: `seg-${Date.now()}-${i}`,
            demographics: s.demographics || { ageRange: 'Unknown', gender: 'Unknown', location: region }
        }));

    } catch (error) {
        console.error("Segment Gen Error:", error);
        throw error;
    }
};

export const generateContentSchedule = async (topic: string, region: string, profile: CandidateProfile): Promise<ContentScheduleItem[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      ROL: Estratega Digital de Campaña Política.
      CANDIDATO: ${profile.name} (${profile.styleDescription}).
      REGIÓN: ${region}.
      TEMA MANUAL (PRIORITARIO): "${topic}".

      TAREA:
      Genera un plan táctico de publicación (Chronoposting) de 5 posts para cubrir este tema durante la semana.
      El plan debe estar optimizado para maximizar el impacto en la región y el tema dados.

      REQUISITOS:
      1. Define el mejor Día y Hora para publicar.
      2. Selecciona la Plataforma ideal (TikTok, X, Instagram, Facebook).
      3. Define el Formato (Reel, Hilo, Story, Video).
      4. Escribe la Idea del Contenido (Copy idea).
      5. Define el Objetivo Estratégico (Viralidad, Información, Ataque, Defensa).

      IDIOMA: ESPAÑOL.
      OUTPUT: JSON Array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: prompt,
            config: {
                // Not using Deep Research here as per user request (manual topic)
                // But we still use standard model intelligence
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            day: { type: Type.STRING },
                            time: { type: Type.STRING },
                            platform: { type: Type.STRING },
                            format: { type: Type.STRING },
                            contentIdea: { type: Type.STRING },
                            objective: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        return JSON.parse(cleanJSON(response.text || "[]")) as ContentScheduleItem[];

    } catch (e) {
        console.error("Chronoposting Error:", e);
        throw e;
    }
};

export const generateAdCampaign = async (
  segment: TargetSegment, 
  profile: CandidateProfile
): Promise<AdCampaign> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Safety checks for optional/undefined fields coming from the Segment AI
    const safePainPoints = Array.isArray(segment.painPoints) ? segment.painPoints : [];
    const safeName = segment.name || "General Audience";
    const safeDemographics = segment.demographics || {};

    const prompt = `
      ROLE: Creative Director & Data Scientist.
      CANDIDATE: ${profile.name} (${profile.styleDescription}).
      TARGET AUDIENCE: ${safeName}.
      DEMOGRAPHICS: ${JSON.stringify(safeDemographics)}.
      PAIN POINTS: ${safePainPoints.join(", ")}.

      MISSION:
      Design a micro-targeted advertising campaign for this specific segment.

      REQUIREMENTS:
      1. VISUAL PROMPT: Write a detailed prompt for an image generator (Gemini 3 Pro Image) that represents this audience's reality with a hopeful political twist. 
      2. IMAGE ASPECT RATIO: Recommend the best aspect ratio (1:1, 16:9, 9:16) based on the target demographic's preferred platform.
      3. COPY: Social media caption with hashtags (IN SPANISH).
      4. AUDIO SCRIPT: Write a short 15-second radio/podcast script (approx 40 words) that ${profile.name} would say to this specific group. It must be colloquial, empathetic, and impactful. (IN SPANISH).
      5. CHRONOPOSTING: Determine the BEST DAY and TIME to post.

      OUTPUT: JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], 
          thinkingConfig: { thinkingBudget: 1024 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualPrompt: { type: Type.STRING },
              imageAspectRatio: { type: Type.STRING, enum: ["1:1", "16:9", "9:16", "4:3", "3:4"] },
              copyText: { type: Type.STRING },
              audioScript: { type: Type.STRING },
              callToAction: { type: Type.STRING },
              chronoposting: {
                type: Type.OBJECT,
                properties: {
                    bestDay: { type: Type.STRING },
                    bestTime: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    reasoning: { type: Type.STRING }
                }
              }
            }
          }
        }
      });
      
      return JSON.parse(cleanJSON(response.text || "{}")) as AdCampaign;

    } catch (e) {
      console.error(e);
      throw e;
    }
};

export const generateMarketingImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatio as any, // 1:1, 16:9, 9:16, 4:3, 3:4
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

export const generateMarketingAudio = async (text: string, voiceName: string = "Kore"): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName }
                    },
                },
            },
        });
        
        // Extract base64 audio
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated");
        
        return `data:audio/wav;base64,${base64Audio}`; 
    } catch (error) {
        console.error("Audio Gen Error:", error);
        throw error;
    }
};
