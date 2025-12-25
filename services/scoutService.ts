import { GoogleGenAI } from "@google/genai";
import { ScrapedData } from "../types";

// Simulate network delays and processing time
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates the "Scout" agent navigating to a URL, bypassing bot protections,
 * and extracting content. In a real backend, this would use Puppeteer/Playwright.
 */
export const scoutUrl = async (url: string, onStatusUpdate: (status: string) => void): Promise<ScrapedData> => {
  onStatusUpdate("🤖 Scout Agent Initialized...");
  await delay(800);

  onStatusUpdate(`🌐 Navigating to ${new URL(url).hostname}...`);
  await delay(1000);

  // Mock Logic for specific simulation scenarios based on URL keywords
  
  // SCENARIO 1: TikTok Video (Requires Audio/Video transcription simulation)
  if (url.includes("tiktok")) {
    onStatusUpdate("📱 Platform Detected: TikTok");
    await delay(500);
    onStatusUpdate("🛡️ Bypassing anti-scraping captcha...");
    await delay(1200);
    onStatusUpdate("🎥 Extracting video stream...");
    await delay(800);
    onStatusUpdate("🗣️ Transcribing audio content...");
    
    return {
      author: "@InfluencerGenerico",
      content: "Dicen que Mariate no sabe nada de tecnología, miren este video donde se enreda con el micrófono. #Fail #Politica",
      mediaDescription: "Video de una mujer ajustando un micrófono con dificultad en una tarima. Texto superpuesto: 'La abuela no sabe usar Zoom'. El tono es de burla.",
      platform: 'TikTok'
    };
  }

  // SCENARIO 2: Instagram Post (Visual context is key)
  if (url.includes("instagram")) {
    onStatusUpdate("📸 Platform Detected: Instagram");
    await delay(800);
    onStatusUpdate("👁️ Analyzing image context with Gemini Vision...");
    await delay(1500);
    
    return {
      author: "@FashionPolitic",
      content: "El outfit de hoy de la candidata... sin comentarios. 🤡",
      mediaDescription: "Foto de la candidata usando botas pantaneras y un casco de ingeniero mal puesto. Contexto visual: Parece estar en una visita de obra. La imagen sugiere desaliño.",
      platform: 'Instagram'
    };
  }

  // DEFAULT SCENARIO: X (Twitter) - Text based with potential image
  onStatusUpdate("🐦 Platform Detected: X (Twitter)");
  onStatusUpdate("⏳ Waiting for dynamic DOM hydration...");
  await delay(1200);
  onStatusUpdate("📄 Extracting thread context...");

  // Default simulation return
  return {
    author: "@UsuarioOpositor",
    content: "Esa señora @MariateMontoya está loca, quiere acabar con los páramos haciendo huecos. Típica uribista depredadora.",
    // Simulating that no image was found, or just text
    platform: 'Twitter'
  };
};

/**
 * Uses Gemini 3 Vision capabilities to describe an uploaded image.
 * This effectively gives the Scout "eyes" for user-uploaded screenshots.
 */
export const describeUploadedMedia = async (base64Data: string, mimeType: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: "Describe this image in detail. Identify if it's a meme, a screenshot of a tweet, or a photo. If it's a meme, explain the joke/irony. If it contains text, transcribe it precisely." }
        ]
      }
    });
    return response.text || "No description generated.";
  } catch (e) {
    console.error("Scout Vision Error:", e);
    return "Failed to analyze image visually.";
  }
};