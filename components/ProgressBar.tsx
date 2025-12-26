
import React, { useEffect, useState } from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  active: boolean;
  estimatedSeconds?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, active, estimatedSeconds = 20 }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer: any;
    if (active) {
      setElapsed(0);
      timer = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [active]);

  if (!active) return null;

  const remaining = Math.max(0, estimatedSeconds - elapsed);
  const isOvertime = elapsed > estimatedSeconds;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] pointer-events-none transition-opacity duration-500 opacity-100">
      {/* Slim Line */}
      <div className="w-full h-1 bg-slate-900/50 backdrop-blur-sm">
        <div 
          className="h-full bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(16,185,129,0.8)]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Floating Status Pill - Non intrusive */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
        <div className="bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-mono border border-emerald-500/30 px-3 py-1.5 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-3">
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span>{label || "PROCESSING"}</span>
          </div>
          <span className="text-white font-bold">{Math.round(progress)}%</span>
        </div>
        
        {/* Time Estimation */}
        <div className="text-[9px] font-mono font-medium text-slate-500 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
            {isOvertime ? (
                <span className="text-yellow-500 animate-pulse">Finishing complex reasoning... ({elapsed}s)</span>
            ) : (
                <span>Est. Time: {remaining}s</span>
            )}
        </div>
      </div>
    </div>
  );
};
