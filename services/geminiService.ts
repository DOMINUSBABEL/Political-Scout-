
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ResponseTone, NetworkStat, NetworkAgentAnalysis, CandidateProfile, VoterType } from "../types";

export const analyzeAndGenerate = async (
  author: string,
  postContent: string,
  profile: CandidateProfile,
  imageContext?: { base64?: string; mimeType?: string },
  scoutVisualDescription?: string
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
  Clasifica al autor en una de estas categorías según su tono y contenido:
  - "Hard Core Support": Fanático o base sólida.
  - "Soft Supporter": Simpatizante moderado.
  - "Undecided/Swing": Indeciso, hace preguntas genuinas, no ataca.
  - "Soft Opposition": Crítico reflexivo, puede ser persuadido.
  - "Hard Opposition": Hater, oposición radical, insulta.
  - "Troll/Bot": Cuenta falsa, spam, ataque coordinado sin lógica.
  - "Media/Press": Periodista o medio de comunicación.

  PASO 2: ANÁLISIS DE RIESGO.
  - Si el contenido menciona: "Paramilitarismo", "Investigación Fiscalía", "Corrupción", "Lavado de activos", "Violencia", o acusaciones legales graves -> SET riskLevel = 'High'.
  - Si es 'High', el 'warningMessage' DEBE advertir: "TEMA LEGAL/SENSIBLE DETECTADO. NO RESPONDER SIN ABOGADO."
  - Si es un 'bait' o trampa evidente -> SET riskLevel = 'Medium'.

  PASO 3: RESPUESTA TÁCTICA.
  Genera 5 variaciones de respuesta y sugerencias de seguimiento.

  Formato de salida esperado (JSON):
  - sentiment: (Negative, Neutral, Positive, Troll)
  - intent: Breve descripción de la intención del autor.
  - voterClassification: (Hard Core Support, Soft Supporter, Undecided/Swing, Soft Opposition, Hard Opposition, Troll/Bot, Media/Press)
  - riskLevel: (Low, Medium, High)
  - warningMessage: Mensaje OBLIGATORIO si RiskLevel es High o Medium.
  - followUpSuggestions: Array de strings con 3 sugerencias tácticas.
  - responses: Array de 5 objetos, cada uno con:
    - tone: (Uno de: "Técnica/Geóloga", "Frentera/Sin Filtro", "Maternal/Empática", "Satírica/Picante", "Viral/Memeable")
    - content: El texto de la respuesta (Max 280 caracteres).
    - reasoning: Por qué elegiste este ángulo basado en tu perfil.
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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
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

export const translateToStyle = async (text: string, profile: CandidateProfile): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
  Traduce el siguiente texto corporativo/aburrido al estilo de ${profile.name} (${profile.styleDescription}).
  Usa su base de conocimiento si es relevante: ${profile.knowledgeBase.substring(0, 500)}...
  
  TEXTO ORIGINAL: "${text}"
  
  Solo devuelve el texto traducido con su personalidad, nada más.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
    });
    return response.text || "Error generating translation.";
  } catch (error) {
    console.error("Gemini Translator Error:", error);
    return "Error connecting to AI brain.";
  }
};

export const analyzeNetworkStats = async (stats: NetworkStat[]): Promise<NetworkAgentAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const statsSummary = JSON.stringify(stats.slice(0, 30)); 

  const prompt = `
    Eres "El Estratega de Campaña" (Campaign Manager Agent).
    
    Analiza esta matriz de datos de redes sociales y genera un REPORTE EJECUTIVO DETALLADO:
    ${statsSummary}
    
    1. Identifica qué temas (top_topic) están funcionando mejor y por qué.
    2. Detecta qué plataforma tiene mejor engagement.
    3. Dame 3 recomendaciones tácticas CONCRETAS para la próxima semana.
    
    Devuelve JSON estructurado.
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
      summary: "Error analyzing data.",
      trends: [],
      recommendations: ["Check data format"],
      best_platform: "N/A"
    };
  }
};
