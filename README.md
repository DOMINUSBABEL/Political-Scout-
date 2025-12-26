
# 🏛️ Candidato.AI: War Room & Strategic Intelligence System

**Candidato.AI** is a high-level political intelligence platform designed for modern campaign war rooms. It leverages **Google Gemini 3 (Pro Preview)** to orchestrate a multi-agent system capable of analyzing threats, segmenting voters with real-time web data, and generating hyper-personalized advertising campaigns.

Unlike generic chatbots, Candidato.AI implements a **Chain-of-Thought (CoT)** architecture with specialized agents that perform "Deep Research" before answering, ensuring data-grounded political strategies.

---

## 🧠 System Architecture: The Agent Pipeline

The core of the system relies on a sequential agent architecture powered by `gemini-3-pro-preview`.

### 1. The Scout Agent (Ingestion & Vision)
This agent acts as the eyes of the system.
*   **Visual Reconnaissance (Multimodal):** Uses Gemini Vision to analyze screenshots of memes, opposition tweets, or news clippings. It extracts text (OCR), sentiment, and visual context.
*   **Web Grounding:** If a URL is provided, the agent uses the `googleSearch` tool to bypass hallucinations and fetch the *live* content of the web page, verifying the authenticity of attacks or news.

### 2. The Dynamic Persona Engine (Context Layer)
Before generating any output, the system injects the active candidate's "DNA" into the prompt.
*   **Personality Matrix:** Defines tone (e.g., "Technocratic", "Populist", "Combative").
*   **Knowledge Base (RAG-Lite):** Injects key government proposals and biography data to ensure consistency.
*   **Safety Rails:** Filters sensitive topics (legal risks) before they generate public responses.

### 3. The Strategist Agent (Inference Layer)
The brain of the operation. It performs:
*   **Deep Reasoning:** A visible "Thinking Process" where the model evaluates multiple angles before committing to a strategy.
*   **Risk Assessment:** classifies content as Low, Medium, or High risk. High risk triggers a "Legal Review" UI state.
*   **Response Generation:** Creates 5 distinct response variations (Technical, Empathetic, Satirical, Viral, Direct).

---

## 🚀 Modules & Capabilities

### 🛡️ 1. General Analysis Mode (Formerly Defense)
The primary interface for rapid response.
*   **Input:** URL or Image.
*   **Deep Research:** Toggleable mode where the AI searches Google for corroborating facts before analyzing.
*   **Reasoning Console:** Visual terminal showing the AI's step-by-step logic (e.g., "Checking sources...", "Weighing backlash...").
*   **Output:** Sentiment analysis, User Intent, Voter Profiling, and tactical responses.

### 🎯 2. Targeting & Advertising (NEW)
A powerful tool for granular voter segmentation and micro-targeting.
*   **Live Scouting:** Instead of using simulated data, the agent searches DANE (Census), Google Trends, and Local News *in real-time* to build voter clusters for a specific region (e.g., "Comuna 13").
*   **Campaign Generator:**
    *   **Visual Prompting:** Generates detailed prompts for Midjourney/Flux to create imagery specific to that segment's reality.
    *   **Hyper-Local Copy:** Writes captions using local slang and addressing specific pain points found in the news search.
    *   **Chronoposting Agent:** Analyzes the demographic's behavior to recommend the **exact Day and Time** to post for maximum engagement.

### 📊 3. Network Intelligence
Big Data analysis for social media metrics.
*   **Input:** CSV/JSON files (Date, Platform, Impressions, Engagement).
*   **Executive Report:** The "Campaign Manager" agent reads the raw data and writes a human-like summary of performance.
*   **Trend Detection:** Identifies anomalies and viral topics.

### 🗣️ 4. Political Translator
A utility tool to rewrite bureaucratic text.
*   Transforms complex legislative text into the candidate's unique voice and style, making it digestible for social media.

---

## 📖 Operational Guide

### 🔐 Login & Setup
*   **Credentials:** Default `User: TALLEYRAND`, `Pass: TALLEYRAND`.
*   **API Key:** Requires a Google AI Studio key in `.env`.

### 👤 Configuring a Candidate
1.  Go to **Profiles**.
2.  **Add New Candidate**: Upload a photo.
3.  **Define Style**: Be specific (e.g., "Uses local idioms, hates suits, loves data").
4.  **Knowledge Base**: Paste the manifesto. This is crucial for the "Grounding" of the model.

### 📢 Running an Ad Campaign (Targeting Mode)
1.  Select a **Region** (e.g., Medellin - Comuna 1).
2.  Enable **Deep Research** (recommended).
3.  Click **Generate Clusters**. The AI will browse the web for current events in that region.
4.  Once segments appear, click **"DESIGN CAMPAIGN"** on a card.
5.  Review the generated Visual Prompt, Copy, and Posting Schedule.

---

## 🛠 Technical Stack

*   **Core:** React 19, TypeScript.
*   **Styling:** Tailwind CSS (Glassmorphism UI).
*   **AI Model:** `@google/genai` (Gemini 3 Pro Preview).
*   **Tools:** `googleSearch` (Grounding), `thinkingBudget` (Reasoning).
*   **Visualization:** Recharts.

---

## 🔮 Roadmap

*   **Video Generation:** Integration with Veo for instant video responses.
*   **CRM Integration:** Connecting identified segments to WhatsApp API.
*   **Voice Cloning:** TTS integration for audio message generation.

---

**Designed by Consultora Talleyrand.**
*System Online. Protocols Active.*
