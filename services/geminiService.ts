
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ResponseTone, NetworkStat, NetworkAgentAnalysis, CandidateProfile, VoterType, TargetSegment, AdCampaign } from "../types";

export const analyzeAndGenerate = async (
  author: string,
  postContent: string,
  profile: CandidateProfile,
  imageContext?: { base64?: string; mimeType?: string },
  scoutVisualDescription?: string,
  deepResearch: boolean = false
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Dynamic System Prompt construction based on selected Profile
  const SYSTEM_PROMPT = `
ACTÚA COMO: ${profile.name}
ROL: ${profile.role}
PERFIL DE PERSONALIDAD Y ESTILO:
${profile.styleDescription}

BASE DE CONOCIMIENTO (CONTEXTO Y PROPUESTAS):
${profile.knowledgeBase}

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
  Genera 5 variaciones.
  
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

  // Config setup
  const tools = deepResearch ? [{ googleSearch: {} }] : [];
  // For Gemini 3, thinkingBudget enables "Thinking" mode.
  const thinkingConfig = deepResearch ? { thinkingBudget: 2048 } : undefined; 

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: tools,
        // thinkingConfig: thinkingConfig, // Note: Uncomment when fully supported by the specific model version if 2.0 Flash Thinking
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughtProcess: { type: Type.STRING, description: "Your step-by-step reasoning logic." },
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

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    let cleanText = text.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(json)?|```$/g, "");
    }
    
    const parsed = JSON.parse(cleanText);
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
  
  Solo devuelve el texto traducido con su personalidad, nada más.
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
  
  const statsSummary = JSON.stringify(stats.slice(0, 30)); 

  const prompt = `
    Eres "El Estratega de Campaña" (Campaign Manager Agent).
    
    Analiza esta matriz de datos de redes sociales y genera un REPORTE EJECUTIVO DETALLADO:
    ${statsSummary}
    
    ${deepResearch ? "Realiza un análisis PROFUNDO. Busca correlaciones no obvias. Piensa paso a paso." : ""}

    1. Identifica qué temas (top_topic) están funcionando mejor y por qué.
    2. Detecta qué plataforma tiene mejor engagement.
    3. Dame 3 recomendaciones tácticas CONCRETAS para la próxima semana.
    
    Devuelve JSON estructurado. INCLUYE un campo 'thoughtProcess' explicando tu lógica.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        tools: deepResearch ? [{ googleSearch: {} }] : [],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thoughtProcess: { type: Type.STRING },
            summary: { type: Type.STRING },
            trends: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            best_platform: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No Data Analysis Returned");
    return JSON.parse(text) as NetworkAgentAnalysis;

  } catch (error) {
    console.error("Network Agent Error:", error);
    return {
      thoughtProcess: "Analysis failed.",
      summary: "Error analyzing data.",
      trends: [],
      recommendations: ["Check data format"],
      best_platform: "N/A"
    };
  }
};

export const generateAdCampaign = async (
  segment: TargetSegment, 
  profile: CandidateProfile
): Promise<AdCampaign> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      ROLE: Creative Director & Data Scientist.
      CANDIDATE: ${profile.name} (${profile.styleDescription}).
      TARGET AUDIENCE: ${segment.name}.
      DEMOGRAPHICS: ${JSON.stringify(segment.demographics)}.
      PAIN POINTS: ${segment.painPoints.join(", ")}.

      MISSION:
      Design a micro-targeted advertising campaign for this specific segment.

      REQUIREMENTS:
      1. VISUAL PROMPT: Write a detailed prompt for an image generator (like Midjourney) that represents this audience's reality but with a hopeful political twist consistent with ${profile.name}'s brand.
      2. COPY: Write a social media caption (Instagram/TikTok style) that speaks directly to their pain points in ${profile.name}'s voice.
      3. CHRONOPOSTING: Determine the BEST DAY and TIME to post for this specific demographic (e.g., Students might be active late night, Workers early morning). Explain why.

      OUTPUT: JSON.
    `;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }], // Use search to verify peak hours for demographics
          thinkingConfig: { thinkingBudget: 1024 }, // Enable reasoning for best times
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              visualPrompt: { type: Type.STRING },
              copyText: { type: Type.STRING },
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
      
      const text = response.text;
      if (!text) throw new Error("Ad Gen Failed");
      return JSON.parse(text) as AdCampaign;

    } catch (e) {
      console.error(e);
      throw e;
    }
};
