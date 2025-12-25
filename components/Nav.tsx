import React from 'react';
import { AppMode } from '../types';

interface NavProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

export const Nav: React.FC<NavProps> = ({ currentMode, setMode }) => {
  return (
    <div className="w-20 md:w-64 bg-mariate-dark border-r border-slate-700 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-4 flex items-center justify-center md:justify-start space-x-3 border-b border-slate-700 h-16">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center font-bold text-white text-xl">
          C
        </div>
        <span className="hidden md:block font-bold text-lg text-white tracking-wider">CANDIDATO.AI</span>
      </div>

      <div className="flex-1 py-6 space-y-2">
        <button
          onClick={() => setMode(AppMode.DEFENSE)}
          className={`w-full flex items-center p-3 transition-colors ${
            currentMode === AppMode.DEFENSE 
              ? 'bg-mariate-green/20 text-mariate-green border-r-4 border-mariate-green' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.