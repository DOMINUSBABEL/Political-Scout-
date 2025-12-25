import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  label?: string;
  active: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, label, active }) => {
  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] pointer-events-none">
      <div className="w-full h-1 bg-slate-800">
        <div 
          className="h-full bg-mariate-green transition-all duration-300 ease-out shadow-[0_0_10px_rgba(16,185,129,0.7)]"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      {label && (
        <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur text-mariate-green text-[10px] font-mono border border-emerald-900/50 px-3 py-1 rounded uppercase tracking-widest animate-pulse">
          {label} {Math.round(progress)}%
        </div>
      )}
    </div>
  );
};