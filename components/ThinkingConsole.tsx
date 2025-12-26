
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
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setLines([]);
      setElapsed(0);
      return;
    }

    const timer = setInterval(() => setElapsed(prev => prev + 0.1), 100);

    const baseSteps = STEPS[mode] || STEPS.DEFENSE;
    const effectiveSteps = isDeepResearch 
        ? [...baseSteps.slice(0, 2), ...DEEP_STEPS, ...baseSteps.slice(2)] 
        : baseSteps;

    let stepIndex = 0;
    
    // Add initial line
    setLines([`[${new Date().toLocaleTimeString()}] System Initialized.`]);

    const stepInterval = setInterval(() => {
      if (stepIndex < effectiveSteps.length) {
        setLines(l => [...l, effectiveSteps[stepIndex]]);
        stepIndex++;
      } else {
        // Prevent "Frozen" feeling by adding "Processing..." dots occasionally if it takes too long
        if (Math.random() > 0.7) {
            setLines(l => [...l, "Working on complex reasoning chain..."]);
        }
      }
    }, 2500); // Slower updates to make it readable

    return () => {
        clearInterval(timer);
        clearInterval(stepInterval);
    };
  }, [isVisible, mode, isDeepResearch]);

  if (!isVisible) return null;

  return (
    <div className="w-full glass-panel rounded-lg border border-emerald-500/30 bg-black/60 p-4 font-mono text-[10px] md:text-xs mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] relative overflow-hidden animate-fade-in-up">
      {/* Scanline */}
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20 animate-scan"></div>
      
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-400 font-bold uppercase tracking-widest">
                {isDeepResearch ? "GEMINI 3 PRO // DEEP REASONING" : "GEMINI 3 PRO // ACTIVE"}
            </span>
         </div>
         <div className="text-slate-500 font-mono">
            T+{elapsed.toFixed(1)}s
         </div>
      </div>

      {/* Tools Indicator */}
      {isDeepResearch && (
          <div className="flex gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-900/40 text-blue-300 rounded border border-blue-500/30 text-[9px] animate-pulse">
                  TOOL: GoogleSearch
              </span>
              <span className="px-2 py-0.5 bg-purple-900/40 text-purple-300 rounded border border-purple-500/30 text-[9px]">
                  MODE: Thinking
              </span>
          </div>
      )}

      <div className="space-y-1 h-32 overflow-y-auto custom-scrollbar flex flex-col-reverse">
         {lines.map((line, idx) => {
           if (!line) return null; // Safety check for undefined lines
           return (
             <div key={idx} className="flex gap-2 border-l border-white/5 pl-2">
               <span className="text-slate-600 shrink-0">[{new Date().toLocaleTimeString()}]</span>
               <span className={line.includes("DEEP") ? "text-purple-300 font-bold" : line.includes("Working") ? "text-slate-500 italic" : "text-emerald-100"}>
                 {line.includes("...") ? line : `>> ${line}`}
               </span>
             </div>
           );
         }).reverse()}
      </div>
    </div>
  );
};
