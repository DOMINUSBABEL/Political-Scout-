import { GoogleGenAI } from "@google/genai";
import { ScrapedData } from "../types";

// Simulate network delays for UX pacing
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * The Scout Agent now attempts to actually "read" the internet using Gemini's Grounding (Google Search) capabilities.
 * If the URL is a "simulation" URL, it returns the demo data.
 * If it's a real URL, it tries to fetch real context.
 */
export const scoutUrl = async (url: string, onStatusUpdate: (status: string) => void): Promise<ScrapedData> => {
  onStatusUpdate("🤖 Scout Agent Initialized...");
  await delay(500);

  // 1. CHECK FOR SIMULATION / DEMO MODE
  // We only return the "Mariate/Minería" fake data if the user explicitly clicked "Load Simulation" 
  // or entered a specific test URL.
  if (url.includes("UsuarioOpositor") || url.includes("simulacion") || url.includes("demo-mode")) {
     onStatusUpdate("⚠️ SIMULATION MODE DETECTED. Loading training scenario...");
     await delay(1000);
     onStatusUpdate("📦 Retrieving mock data from 'Minería' scenario...");
     return {
        author: "@UsuarioOpositor",
        content: "Esa señora @MariateMontoya está loca, quiere acabar con los páramos haciendo huecos. Típica uribista depredadora. #FueraMariate",
        mediaDescription: "No media detected. Pure text tweet.",
        platform: 'Twitter (Simulation)'
      };
  }

  // 2. REAL EXECUTION MODE (GEMINI SEARCH)
  const hostname = new URL(url).hostname;
  onStatusUpdate(`🌐 Connecting to Live Network: ${hostname}...`);
  await delay(800);
  
  onStatusUpdate("🛰️ Engaging Gemini Search Grounding to find post content...");
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // We use a model capable of search grounding to try and "read" the external link
    // Note: Twitter/X often blocks crawlers, but Google Search sometimes has the cached snippet.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [{ 
          text: `You are a web scraper agent. Your goal is to extract the content of this specific social media URL: ${url}. 
          
          Search the web for this post.
          1. Identify the Author.
          2. Extract the main text content of the post/tweet exactly as written.
          3. Describe any image or video thumbnail if mentioned in search results.
          
          If you ABSOLUTELY cannot find the specific text of this post (due to privacy/auth walls), return "ACCESS_DENIED" in the content field. Do NOT hallucinate or invent a tweet.` 
        }]
      },
      config: {
        tools: [{ googleSearch: {} }] // Enable Google Search
      }
    });

    const resultText = response.text || "";
    onStatusUpdate("📥 Processing search results...");
    await delay(500);

    // Naive parsing of the AI's natural language response
    // In a production app, we would force JSON output, but Grounding can be chatty.
    
    if (resultText.includes("ACCESS_DENIED") || resultText.length < 10) {
      onStatusUpdate("🔒 Target is protected by AuthWall (Anti-Scraping Active).");
      onStatusUpdate("⚠️ ACTION REQUIRED: Please paste text manually or upload screenshot.");
      return {
        author: "",
        content: "", // Return empty so user knows to paste it
        platform: hostname,
        mediaDescription: "Scout could not bypass login wall. Visual manual upload recommended."
      };
    }

    onStatusUpdate("✅ Content Trace Found.");
    
    // Attempt to structure the AI response roughly
    return {
      author: "Detected from URL", // Let the user fill this if fuzzy
      content: resultText, // The AI's summary of the tweet
      platform: hostname,
      mediaDescription: "Derived from search context."
    };

  } catch (error) {
    console.error("Scout Error:", error);
    onStatusUpdate("🔴 Connection Failed. Anti-bot systems active.");
    return {
      author: "",
      content: "",
      platform: hostname
    };
  }
};

/**
 * Uses Gemini 3 Vision capabilities to describe an uploaded image.
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