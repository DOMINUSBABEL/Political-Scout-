
import React, { useState } from 'react';
import { Nav } from './components/Nav';
import { GeneralAnalysisMode } from './components/GeneralAnalysisMode';
import { TranslatorMode } from './components/TranslatorMode';
import { NetworkAnalysisMode } from './components/NetworkAnalysisMode';
import { ProfileManager } from './components/ProfileManager'; 
import { TargetingMode } from './components/TargetingMode'; 
import { Login } from './components/Login';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { AppMode, Language, CandidateProfile } from './types';
import { t } from './utils/translations';

// Default Profile Data (Mariate)
const INITIAL_PROFILE: CandidateProfile = {
  id: 'mariate-default',
  name: 'Mariate Montoya',
  role: 'Candidate',
  styleDescription: 'Geóloga, Paisa, Directa, Anti-política tradicional, "Cabra Loca". Usa dichos ("Al marrano no lo capan dos veces"), habla desde el territorio, no desde el escritorio.',
  knowledgeBase: `
    CONTEXTO DE CANDIDATA (MARIATE MONTOYA):
    - Profesión: Geóloga.
    - Postura Minería: "Minería bien hecha no es minería ilegal". Defiende la extracción técnica de recursos.
    - Postura Medio Ambiente: "Cuidar el páramo no es abandonarlo, es gestionarlo". Critica la hipocresía de ambientalistas de iPhone.
    - Enemigos: Políticos tradicionales, burocracia.
    - Propuesta Clave: "Geología para la gente": usar la ciencia para ordenamiento territorial real.
  `,
  avatar: null, // Default behavior handles null
  themeColor: '#10B981' // Emerald
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.GENERAL);
  const [language, setLanguage] = useState<Language>('ES');
  
  // Profile Management State
  const [profiles, setProfiles] = useState<CandidateProfile[]>([INITIAL_PROFILE]);
  const [activeProfile, setActiveProfile] = useState<CandidateProfile>(INITIAL_PROFILE);

  const handleAddProfile = (newProfile: CandidateProfile) => {
    setProfiles([...profiles, newProfile]);
    setActiveProfile(newProfile); // Auto-switch to new profile
    setCurrentMode(AppMode.GENERAL); // Go back to defense mode to test it
  };

  if (!isAuthenticated) {
    return <Login onLogin={setIsAuthenticated} lang={language} setLang={setLanguage} />;
  }

  return (
    <div className="flex min-h-screen bg-mariate-dark relative overflow-hidden text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* 1. Cinematic Noise Overlay */}
      <div className="bg-noise z-10"></div>

      {/* 2. Dynamic Background Animation (Replaces static grid) */}
      <BackgroundCanvas />
      
      {/* 3. Dynamic Ambient Glow (Breathing) */}
      <div 
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0 opacity-15 transition-colors duration-1000 animate-pulse-slow mix-blend-screen"
        style={{ backgroundColor: activeProfile.themeColor }} 
      ></div>

      {/* Sidebar Navigation */}
      <Nav 
        currentMode={currentMode} 
        setMode={setCurrentMode} 
        lang={language}
        setLang={setLanguage}
        activeProfile={activeProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 ml-20 md:ml-72 p-4 md:p-8 overflow-y-auto h-screen relative z-10 scroll-smooth">
        <div className="max-w-7xl mx-auto h-full pb-10 flex flex-col">
          <div className="flex-1 animate-fade-in-up">
             {currentMode === AppMode.GENERAL && (
                <GeneralAnalysisMode lang={language} activeProfile={activeProfile} />
             )}
             {currentMode === AppMode.TARGETING && (
                <TargetingMode lang={language} activeProfile={activeProfile} />
             )}
             {currentMode === AppMode.TRANSLATOR && (
                <TranslatorMode activeProfile={activeProfile} />
             )}
             {currentMode === AppMode.NETWORK && (
                <NetworkAnalysisMode lang={language} />
             )}
             {currentMode === AppMode.PROFILE && (
                <ProfileManager 
                  lang={language}
                  profiles={profiles}
                  activeProfile={activeProfile}
                  onSetActive={setActiveProfile}
                  onAddProfile={handleAddProfile}
                />
             )}
          </div>
        
          {/* Footer */}
          <div className="w-full text-center py-8 text-slate-600/50 text-[10px] font-mono font-medium tracking-[0.3em] uppercase mt-12 flex items-center justify-center gap-4">
            <span>{t(language, 'footer')}</span>
            <span className="w-px h-3 bg-slate-700"></span>
            <span className="flex items-center gap-1.5">
              SYSTEM <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> ONLINE
            </span>
          </div>
        </div>
      </main>

      {!process.env.API_KEY && (
        <div className="fixed bottom-4 right-4 bg-red-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg shadow-xl z-50 font-bold text-xs border border-red-400 font-mono">
          [!] SYSTEM ALERT: API_KEY MISSING
        </div>
      )}
    </div>
  );
}

export default App;
