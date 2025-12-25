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
  TRANSLATOR = 'translator',
  NETWORK = 'network'
}

export type Language = 'ES' | 'EN' | 'FR' | 'DE';

export interface NetworkStat {
  date: string;
  platform: string;
  impressions: number;
  engagement: number;
  sentiment_score: number; // 0 to 100
  top_topic: string;
}

export interface NetworkAgentAnalysis {
  summary: string;
  trends: string[];
  recommendations: string[];
  best_platform: string;
}