
import React, { useState, useEffect } from 'react';

interface Props {
  isVisible: boolean;
  mode?: 'DEFENSE' | 'TARGETING' | 'NETWORK' | 'TRANSLATOR';
  isDeepResearch?: boolean;
}

const STEPS = {
  DEFENSE: [
    "Initializing Defense Protocol...",
    "Scanning content for keywords...",
    "Accessing Candidate Knowledge Base...",
    "Evaluating Sentiment & Intent...",
    "Checking Legal Risk Vectors...",
    "Formulating Strategic Responses...",
    "Finalizing Tone Calibration..."
  ],
  TARGETING: [
    "Connecting to Demographic Data...",
    "Analyzing Regional Parameters...",
    "Cross-referencing Age/Gender Stats...",
    "Identifying Pain Points...",
    "Synthesizing Voter Clusters...",
    "Calculating Affinity Scores...",
    "Generating Strategy Tips..."
  ],
  NETWORK: [
    "Ingesting Data Matrix...",
    "Normalizing Metrics...",
    "Detecting Anomalies in Engagement...",
    "Correlating Topics vs Performance...",
    "Identifying Viral Trends...",
    "Drafting Executive Summary..."
  ],
  TRANSLATOR: [
    "Analyzing Source Text...",
    "Deconstructing Bureaucratic Jargon...",
    "Injecting Persona 'Mariate'...",
    "Applying Regional Dialect...",
    "Polishing for Impact...",
    "Final Review..."
  ]
};

const DEEP_STEPS = [
  "🧠 DEEP RESEARCH ACTIVE: Initializing Google Search Tools...",
  "🌍 SCOUTING WEB: Searching for corroborating sources...",
  "🔍 VERIFYING: Cross-checking facts against external databases...",
  "🤔 REASONING: Analyzing multiple perspectives...",
  "⚖️ EVALUATING: Weighing potential backlash vs impact...",
  "📝 SYNTHESIS: integrating web findings into strategy..."
];

export const ThinkingConsole: React.FC<Props> = ({ isVisible, mode = 'DEFENSE', isDeepResearch = false }) => {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setLines([]);
      setCursor(0);
      return;
    }

    const baseSteps = STEPS[mode] || STEPS.DEFENSE;
    const effectiveSteps = isDeepResearch 
        ? [...baseSteps.slice(0, 2), ...DEEP_STEPS, ...baseSteps.slice(2)] 
        : baseSteps;

    const interval = setInterval(() => {
      setCursor((prev) => {
        if (prev < effectiveSteps.length) {
          setLines(l => [...l, effectiveSteps[prev]]);
          return prev + 1;
        }
        return prev;
      });
    }, 1500); // Add a new line every 1.5s

    return () => clearInterval(interval);
  }, [isVisible, mode, isDeepResearch]);

  if (!isVisible) return null;

  return (
    <div className="w-full glass-panel rounded-lg border border-emerald-500/30 bg-black/60 p-4 font-mono text-[10px] md:text-xs mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden animate-fade-in-up">
      {/* Scanline */}
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 animate-scan"></div>
      
      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
         <span className="text-emerald-400 font-bold uppercase tracking-widest">
            {isDeepResearch ? "GEMINI 3 PRO // DEEP REASONING ENGINE" : "GEMINI 3 PRO // PROCESSING"}
         </span>
      </div>

      <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar flex flex-col-reverse">
         {lines.length === 0 && <span className="text-slate-500 italic">Initializing agent link...</span>}
         {lines.map((line, idx) => (
           <div key={idx} className="flex gap-2">
             <span className="text-slate-600">[{new Date().toLocaleTimeString()}]</span>
             <span className={line.includes("DEEP") ? "text-purple-300 font-bold" : "text-emerald-100"}>
               {line.includes("...") ? line : `>> ${line}`}
             </span>
           </div>
         )).reverse()}
      </div>
    </div>
  );
};
