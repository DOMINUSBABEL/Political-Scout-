export enum ResponseTone {
  TECNICA = "Técnica/Geóloga",
  FRENTERA = "Frentera/Sin Filtro",
  EMPATICA = "Maternal/Empática"
}

export interface GeneratedResponse {
  tone: ResponseTone;
  content: string;
  reasoning: string;
}

export interface AnalysisResult {
  sentiment: 'Negative' | 'Neutral' | 'Positive' | 'Troll';
  intent: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  warningMessage?: string;
  legalReviewRequested?: boolean; // New field
  responses: GeneratedResponse[];
}

export interface SocialPost {
  id: string;
  url: string;
  author: string;
  content: string;
  platform: 'X' | 'Instagram' | 'TikTok';
  timestamp: string;
}

export interface ScrapedData {
  author: string;
  content: string;
  mediaDescription?: string;
  platform: string;
}

export enum AppMode {
  DEFENSE = 'defense',
  TRANSLATOR = 'translator'
}

export type Language = 'ES' | 'EN' | 'FR' | 'DE';