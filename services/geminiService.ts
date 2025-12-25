import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, ResponseTone } from "../types";

// Simulated "Knowledge Base" (The PDF Context)
const KNOWLEDGE_BASE = `
CONTEXTO DE CANDIDATA (MARIATE MONTOYA):
- Profesión: Geóloga.
- Estilo: Paisa, directa, usa dichos ("Al marrano no lo capan dos veces"), anti-política tradicional.
- Postura Minería: "Minería bien hecha no es minería ilegal". Defiende la extracción técnica de recursos para el desarrollo.
- Postura Medio Ambiente: "Cuidar el páramo no es abandonarlo, es gestionarlo". Critica la hipocresía de ambientalistas de iPhone.
- Apodo: "Cabra Loca" (ella lo abraza con orgullo).
- Enemigos: Políticos tradicionales, burocracia, hipocresía.
`;

const SYSTEM_PROMPT = `
ACTÚA COMO: María Teresa "Mariate" Montoya.
Perfil: Geóloga, Paisa, Directa, Anti-política tradicional, "Cabra Loca".

TU TAREA:
Analizar posts de redes sociales (texto e imágenes) y generar respuestas.

INSTRUCCIONES DE ESTILO:
1. Usa tus muletillas clave: "¿Sí o no?", "Mijo/a", "Pues", "Verraquera", "Bacano", "Ojo pues".
2. No suenes como una IA. Suena como una mujer paisa hablando desde su celular.
3. Si te atacan, usa "Piel de cocodrilo". Devuelve el golpe con argumentos lógicos o ironía.
4. Emojis permitidos: 🪨, 🐐, 🇨🇴, 💚.

${KNOWLEDGE_BASE}
`;

export const analyzeAndGenerate = async (
  author: string,
  postContent: string,
  imageContext?: { base64?: string; mimeType?: string },
  scoutVisualDescription?: string
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let promptText = `
  Analiza el siguiente post de redes sociales y genera 3 opciones de respuesta.
  
  AUTOR: ${author}
  CONTENIDO (Texto detectado): "${postContent}"
  `;

  if (imageContext) {
    promptText += `\nNOTA: Se adjunta una imagen cruda para tu análisis directo.`;
  }

  if (scoutVisualDescription) {
    promptText += `\nREPORTE DEL AGENTE SCOUT (Descripción Visual/Contexto): "${scoutVisualDescription}"
    Usa este contexto visual para entender si es un meme, una burla sobre su apariencia, o un screenshot de texto.`;
  }

  promptText += `
  REGLAS CRÍTICAS DE SEGURIDAD (RISK LEVEL):
  - Si el contenido menciona: "Paramilitarismo", "Investigación Fiscalía", "Corrupción", "Lavado de activos", "Violencia", o acusaciones legales graves -> SET riskLevel = 'High'.
  - Si es 'High', el 'warningMessage' DEBE advertir: "TEMA LEGAL/SENSIBLE DETECTADO. NO RESPONDER SIN ABOGADO."
  - Si es un 'bait' o trampa evidente -> SET riskLevel = 'Medium'.

  Formato de salida esperado (JSON):
  - sentiment: (Negative, Neutral, Positive, Troll)
  - intent: Breve descripción de la intención del autor (ataque, duda, apoyo).
  - riskLevel: (Low, Medium, High)
  - warningMessage: Mensaje OBLIGATORIO si RiskLevel es High o Medium.
  - responses: Array de 3 objetos, cada uno con:
    - tone: (Uno de: "Técnica/Geóloga", "Frentera/Sin Filtro", "Maternal/Empática")
    - content: El texto de la respuesta (Max 280 caracteres).
    - reasoning: Por qué elegiste este ángulo.
  `;

  const parts: any[] = [];
  
  // Add Image Part if exists (Manual upload override)
  if (imageContext && imageContext.base64) {
    parts.push({
      inlineData: {
        data: imageContext.base64,
        mimeType: imageContext.mimeType || "image/png"
      }
    });
  }

  // Add Text Prompt
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts }, // Pass parts array for multimodal
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ['Negative', 'Neutral', 'Positive', 'Troll'] },
            intent: { type: Type.STRING },
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            warningMessage: { type: Type.STRING },
            responses: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tone: { type: Type.STRING, enum: [ResponseTone.TECNICA, ResponseTone.FRENTERA, ResponseTone.EMPATICA] },
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
    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};

export const translateToMariate = async (text: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
  Traduce el siguiente texto corporativo/aburrido al estilo de Mariate (Paisa, directa, geóloga, "sin filtro").
  
  TEXTO ORIGINAL: "${text}"
  
  Solo devuelve el texto traducido, nada más.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });
    return response.text || "Error generating translation.";
  } catch (error) {
    console.error("Gemini Translator Error:", error);
    return "Error connecting to Mariate's brain.";
  }
};