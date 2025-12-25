import { GoogleGenAI, Type } from "@google/genai";
import { ScrapedData } from "../types";

// Simulate network delays for UX pacing
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to extract potential content from URL slugs (common in News/Threads/FB)
 * e.g. facebook.com/user/posts/mariate-is-destroying-the-paramo -> "mariate is destroying the paramo"
 */
const extractHintsFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    // Usually the last segment or the one before ID is the slug
    const potentialSlug = pathSegments.find(s => s.length > 15 && s.includes('-')) || "";
    return potentialSlug.replace(/-/g, ' ');
  } catch (e) {
    return "";
  }
};

/**
 * The Scout Agent now attempts to actually "read" the internet using Gemini's Grounding (Google Search) capabilities.
 */
export const scoutUrl = async (url: string, onStatusUpdate: (status: string) => void): Promise<ScrapedData> => {
  onStatusUpdate("🤖 Scout Agent Initialized (Gemini 3 Pro)...");
  await delay(500);

  // 1. CHECK FOR SIMULATION / DEMO MODE
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
  let hostname = "unknown";
  try {
    hostname = new URL(url).hostname;
  } catch (e) {
    console.warn("Invalid URL");
  }

  onStatusUpdate(`🌐 Connecting to Live Network: ${hostname}...`);
  await delay(800);

  const urlLower = url.toLowerCase();
  const isMeta = urlLower.includes("facebook") || urlLower.includes("instagram") || urlLower.includes("threads");
  const hints = extractHintsFromUrl(url);

  let platformSpecificPrompt = "";

  if (isMeta) {
    onStatusUpdate("🛡️ Meta Network (FB/Threads) detected. Activating heuristic bypass...");
    await delay(500);
    onStatusUpdate("🔍 Parsing URL slug for content clues...");
    
    // Meta platforms often block direct scraping. We ask Gemini to search for the *text* 
    // that might be associated with the URL, rather than the URL itself.
    platformSpecificPrompt = `
      This is a Facebook or Threads URL. Direct scraping is often blocked.
      1. Analyze the URL structure: "${url}".
      2. If the URL contains a text slug (e.g. /my-opinion-on-mining), use that as a search query to find the actual post text on Google.
      3. URL Hint: "${hints}".
      4. Search for recent public posts by the likely author that match this topic.
    `;
  } else {
    onStatusUpdate("🛰️ Engaging Gemini Search Grounding...");
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [{ 
          text: `You are a web scraper agent. Your goal is to extract the content of this specific social media URL: ${url}. 
          
          ${platformSpecificPrompt}

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
    
    if (resultText.includes("ACCESS_DENIED") || resultText.length < 10) {
      onStatusUpdate("🔒 Target is protected by AuthWall (Anti-Scraping Active).");
      onStatusUpdate("⚠️ ACTION REQUIRED: Please paste text manually or upload screenshot.");
      return {
        author: "",
        content: "",
        platform: hostname,
        mediaDescription: "Scout could not bypass login wall. Visual manual upload recommended."
      };
    }

    onStatusUpdate("✅ Content Trace Found.");
    
    return {
      author: "Detected from URL", 
      content: resultText,
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
 * Uses Gemini 3 Pro Vision capabilities to extract FULL data from an image (OCR + Context).
 */
export const extractDataFromImage = async (base64Data: string, mimeType: string): Promise<ScrapedData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: mimeType } },
          { text: `
            Analyze this social media screenshot.
            1. Extract the AUTHOR handle/name exactly as shown (e.g., @username or Name).
            2. Extract the exact TEXT CONTENT of the post (OCR).
            3. Describe the visual context (is it a meme? a news article? a photo? implied sentiment?).
            
            Return JSON.
          ` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            author: { type: Type.STRING },
            content: { type: Type.STRING },
            mediaDescription: { type: Type.STRING },
            platform: { type: Type.STRING },
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return { author: "", content: "", platform: "Unknown" };
    
    return JSON.parse(text) as ScrapedData;

  } catch (e) {
    console.error("Scout Vision Error:", e);
    return { author: "", content: "", platform: "Unknown", mediaDescription: "Failed to extract data." };
  }
};