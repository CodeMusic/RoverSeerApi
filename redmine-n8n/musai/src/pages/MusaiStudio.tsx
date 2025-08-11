import React from 'react';
import studioHero from '@/assets/images/musaistudio_Timeline UI- 4 lanes — drums, bass, chords, lead; seed .png';

const MusaiStudio: React.FC = () =>
{
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-14 max-w-6xl">
        <div className="text-center space-y-6 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold">Musai Studio</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            A live timeline for composition and synthesis — four lanes in focus: drums, bass, chords, lead.
          </p>
        </div>
        <div>
          <img
            src={studioHero}
            alt="Musai Studio timeline — drums, bass, chords, lead"
            className="w-full rounded-2xl border border-slate-200/40 dark:border-slate-700 shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default MusaiStudio;


