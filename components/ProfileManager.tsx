
import React, { useState, useRef } from 'react';
import { CandidateProfile, Language } from '../types';
import { t } from '../utils/translations';

interface Props {
  lang: Language;
  profiles: CandidateProfile[];
  activeProfile: CandidateProfile;
  onSetActive: (profile: CandidateProfile) => void;
  onAddProfile: (profile: CandidateProfile) => void;
}

export const ProfileManager: React.FC<Props> = ({ lang, profiles, activeProfile, onSetActive, onAddProfile }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStyle, setNewStyle] = useState('');
  const [newKB, setNewKB] = useState('');
  const [newColor, setNewColor] = useState('#10B981');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newStyle || !newKB) return;

    const newProfile: CandidateProfile = {
      id: Date.now().toString(),
      name: newName,
      role: newRole || 'Candidate',
      styleDescription: newStyle,
      knowledgeBase: newKB,
      avatar: newAvatar,
      themeColor: newColor
    };

    onAddProfile(newProfile);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setNewName('');
    setNewRole('');
    setNewStyle('');
    setNewKB('');
    setNewAvatar(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up pb-20">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
           <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <span className="w-2 h-8 bg-pink-500 rounded-full"></span>
             {t(lang, 'profileTitle')}
           </h1>
           <p className="text-slate-400 mt-2 font-mono text-xs uppercase tracking-wider pl-5">// {t(lang, 'profileSubtitle')}</p>
        </div>
        {!isCreating && (
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all shadow-lg"
          >
            + {t(lang, 'addProfile')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LIST OF PROFILES */}
        <div className="glass-panel p-6 rounded-xl flex flex-col gap-4 max-h-[600px] overflow-y-auto custom-scrollbar">
          <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{t(lang, 'availableProfiles')}</h3>
          
          {profiles.map(profile => (
            <div 
              key={profile.id}
              onClick={() => onSetActive(profile)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                activeProfile.id === profile.id 
                  ? 'bg-white/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden flex-shrink-0">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl" style={{ backgroundColor: profile.themeColor }}>
                      {profile.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                   <h4 className="font-bold text-white text-lg">{profile.name}</h4>
                   <p className="text-xs text-slate-400 font-mono uppercase">{profile.role}</p>
                   {activeProfile.id === profile.id && (
                     <span className="inline-block mt-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                       ACTIVE
                     </span>
                   )}
                </div>
              </div>
              {/* Background accent */}
              <div 
                className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-[50px] opacity-20 transition-opacity"
                style={{ backgroundColor: profile.themeColor }}
              ></div>
            </div>
          ))}
        </div>

        {/* DETAILS / CREATE FORM */}
        <div className="lg:col-span-2">
           {isCreating ? (
             <div className="glass-panel p-8 rounded-xl border-t-4 border-t-emerald-500 animate-float">
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-white uppercase tracking-wider">{t(lang, 'createNewProfile')}</h2>
                 <button onClick={() => setIsCreating(false)} className="text-slate-500 hover:text-white">✕</button>
               </div>
               
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="flex gap-6 items-start">
                     {/* Avatar Upload */}
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-24 h-24 rounded-full border-2 border-dashed border-slate-600 hover:border-emerald-500 cursor-pointer flex items-center justify-center bg-black/20 overflow-hidden relative group"
                     >
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        {newAvatar ? (
                           <img src={newAvatar} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-2xl text-slate-600 group-hover:text-emerald-500">+</span>
                        )}
                        <div className="absolute bottom-0 w-full text-[8px] text-center bg-black/60 text-white py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           UPLOAD PHOTO
                        </div>
                     </div>
                     
                     <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1 block">Name</label>
                              <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full glass-input p-3 rounded text-white text-sm" placeholder="e.g. John Doe" />
                           </div>
                           <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1 block">Role</label>
                              <input value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full glass-input p-3 rounded text-white text-sm" placeholder="e.g. Candidate" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1 block">Tone & Style (System Prompt)</label>
                      <textarea required value={newStyle} onChange={e => setNewStyle(e.target.value)} className="w-full glass-input p-3 rounded text-white text-sm h-24" placeholder="Describe the personality, tone of voice, jargon, and attitude..." />
                  </div>

                  <div>
                      <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1 block">Knowledge Base / Proposals (RAG Context)</label>
                      <textarea required value={newKB} onChange={e => setNewKB(e.target.value)} className="w-full glass-input p-3 rounded text-white text-sm h-40 font-mono text-xs" placeholder="Paste the government plan, key proposals, biography, and past positions here..." />
                  </div>
                  
                  <div className="flex items-center gap-4">
                     <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Theme Color</label>
                     <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="bg-transparent border-none h-8 w-8 cursor-pointer" />
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-3 rounded-lg text-slate-400 font-bold text-xs hover:text-white transition-colors">CANCEL</button>
                     <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold text-xs uppercase tracking-widest shadow-lg">CREATE AGENT</button>
                  </div>
               </form>
             </div>
           ) : (
             <div className="glass-panel p-8 rounded-xl h-full flex flex-col relative overflow-hidden">
               <div className="flex items-center gap-6 mb-8 relative z-10">
                   <div className="w-32 h-32 rounded-xl bg-slate-800 border-2 border-white/10 shadow-2xl overflow-hidden">
                      {activeProfile.avatar ? (
                        <img src={activeProfile.avatar} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl" style={{ backgroundColor: activeProfile.themeColor }}>{activeProfile.name.charAt(0)}</div>
                      )}
                   </div>
                   <div>
                      <h2 className="text-4xl font-black text-white uppercase tracking-tight mb-2">{activeProfile.name}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-900/20 px-2 py-0.5 rounded">
                           {activeProfile.role}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {activeProfile.id}</span>
                      </div>
                   </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="bg-black/20 p-5 rounded-lg border border-white/5">
                     <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-3">Personality Matrix</h3>
                     <p className="text-slate-300 text-sm leading-relaxed italic">
                        "{activeProfile.styleDescription}"
                     </p>
                  </div>
                  <div className="bg-black/20 p-5 rounded-lg border border-white/5 max-h-60 overflow-y-auto custom-scrollbar">
                     <h3 className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-3">Knowledge Base Preview</h3>
                     <p className="text-slate-400 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                        {activeProfile.knowledgeBase.substring(0, 500)}...
                     </p>
                  </div>
               </div>

               <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none" 
                    style={{ background: `radial-gradient(circle at 90% 10%, ${activeProfile.themeColor}, transparent 50%)` }}>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};
