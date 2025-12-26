
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "h-10 w-10", showText = true }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`relative ${className} flex items-center justify-center`}>
        {/* Geometric Container */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 rounded-xl border border-white/10 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] transform rotate-3"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/10 to-transparent rounded-xl border border-white/5 transform -rotate-3"></div>
        
        {/* Vector Icon: Abstract "C" / Shield / Eye Node */}
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-2/3 h-2/3 relative z-10 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="url(#paint0_linear)" strokeWidth="1.5" strokeOpacity="0.5"/>
          <path d="M12 18V15M12 9V6M6 12H9M15 12H18" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="#10B981"/>
          <path d="M17 7L15.5 8.5M7 17L8.5 15.5M17 17L15.5 15.5M7 7L8.5 8.5" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5"/>
          <defs>
            <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" stopOpacity="0.5"/>
              <stop offset="1" stopColor="white" stopOpacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col justify-center">
          <h1 className="font-bold text-lg text-white tracking-[0.2em] leading-none flex items-center gap-1">
            CANDIDATO<span className="text-emerald-500">.AI</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 opacity-70">
            <div className="h-[1px] w-4 bg-emerald-500/50"></div>
            <span className="text-[8px] text-emerald-400 font-mono uppercase tracking-[0.15em] glow-text">War Room Intelligence</span>
          </div>
        </div>
      )}
    </div>
  );
};
