import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';
import { Music, LayoutTemplate, Timer, Rocket, Wand2, Brain, Palette, Download } from 'lucide-react';
import { InfoPageSurface } from '@/components/common/InfoPageSurface';
import studioHero from '@/assets/images/musaistudio hero.png';


const MusaiStudioInfo: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CODE} />

      <div className="container mx-auto px-4 py-14 max-w-6xl">
        {/* Hero */}
        <div className="text-center space-y-6 mb-12">
          <InfoPageSurface auraClassName="from-blue-500/15 via-indigo-400/10">
            <h1 className="text-4xl md:text-5xl font-bold">Make music that ships — right from your browser.</h1>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              MusaiStudio runs locally on a Pi‑5 and generates your loops, voices, and arrangements using the same family of AI sound models behind Meta’s AudioCraft and SoundCraft — but with a simple, playful interface that anyone can use.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate(ROUTES.MUSAI_STUDIO)}>Open the Studio</Button>
              <Button variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>See How It Works</Button>
            </div>
            <div className="mt-8 relative">
              <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden border-slate-200/40 dark:border-slate-700">
                <img src={studioHero} alt="MusaiStudio timeline hero" className="block w-full h-auto" />
              </div>
            </div>
          </InfoPageSurface>
        </div>

        {/* How It Works */}
        <div id="how-it-works" className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { title: 'Generate', desc: 'Loopable stems for drums, bass, chords, lead — plus expressive AI voices via Piper.' },
            { title: 'Arrange', desc: 'Drag clips on a bar/beat timeline; set BPM & key; add effects; loop or trim.' },
            { title: 'Export', desc: 'Mix down to WAV in‑browser or let the Pi create MP3/OGG versions.' },
          ].map(({ title, desc }) => (
            <InfoPageSurface key={title}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            </InfoPageSurface>
          ))}
        </div>

        {/* Dual‑Mind Touch */}
        <InfoPageSurface>
        <Card className="mb-12 shadow-none border-0">
          <CardHeader>
            <CardTitle className="text-xl">The Dual‑Mind Touch</CardTitle>
            <CardDescription>Musai’s two creative perspectives shape your track.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card"><Brain className="w-4 h-4 inline mr-2" /> Logical — suggests tempo, key, chord progressions, and balanced song structure.</div>
            <div className="p-4 rounded-lg border bg-card"><Palette className="w-4 h-4 inline mr-2" /> Creative — plays with textures, rhythms, fills, and surprise moments.</div>
            <div className="md:col-span-2 text-xs text-muted-foreground">You can re‑roll either side until the vibe is right.</div>
          </CardContent>
        </Card>
        </InfoPageSurface>

        {/* Why It Feels Different */}
        <InfoPageSurface>
        <Card className="mb-12 shadow-none border-0">
          <CardHeader>
            <CardTitle>Why It Feels Different</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card">No clutter — in the music from the first click, no DAW learning curve.</div>
            <div className="p-4 rounded-lg border bg-card">Quick loops — keep ideas tight (4–8 bars) for fast iteration.</div>
            <div className="p-4 rounded-lg border bg-card">Familiar tech — inspired by AudioCraft & SoundCraft; tuned for Pi‑5.</div>
            <div className="p-4 rounded-lg border bg-card">Instant export — one click and your song is share‑ready.</div>
          </CardContent>
        </Card>
        </InfoPageSurface>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <InfoPageSurface>
          <Card>
            <CardHeader>
              <CardTitle>v1 (Now)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <ul className="list-disc ml-5 space-y-1">
                <li>Clip grid + timeline</li>
                <li>Drums/bass/chords/lead loops</li>
                <li>Piper AI voices that sync to your beat</li>
                <li>Core effects (volume, pan, filter, reverb, compression)</li>
                <li>WAV/MP3/OGG export</li>
              </ul>
            </CardContent>
          </Card>
          </InfoPageSurface>
          <InfoPageSurface>
          <Card>
            <CardHeader>
              <CardTitle>v1.1 (Next)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <ul className="list-disc ml-5 space-y-1">
                <li>Mood/genre seed presets</li>
                <li>Lyric mode with beat‑matched syllables</li>
                <li>Smarter dual‑mind arrangement suggestions</li>
              </ul>
            </CardContent>
          </Card>
          </InfoPageSurface>
          <InfoPageSurface>
          <Card>
            <CardHeader>
              <CardTitle>v1.2 (Later)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <ul className="list-disc ml-5 space-y-1">
                <li>Export stems for pro DAWs</li>
                <li>Genre preset packs (Lo‑fi, Synthwave, Jazz‑hop, Cinematic)</li>
                <li>Curations crossover — turn a theme or article into a song seed</li>
              </ul>
            </CardContent>
          </Card>
          </InfoPageSurface>
        </div>

        {/* UI Layout */}
        <InfoPageSurface>
        <Card className="mb-12 shadow-none border-0">
          <CardHeader>
            <CardTitle>UI Layout</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card">Left: Sound Library (drums, bass, chords, leads, SFX, voices)</div>
            <div className="p-4 rounded-lg border bg-card">Top Center: Seed Panel (mood, genre, key, BPM) + Generate button</div>
            <div className="p-4 rounded-lg border bg-card">Middle: Timeline with track lanes and looping controls</div>
            <div className="p-4 rounded-lg border bg-card">Right: Inspector for effects and settings</div>
            <div className="p-4 rounded-lg border bg-card md:col-span-2">Bottom: Master output meter and export controls</div>
          </CardContent>
        </Card>
        </InfoPageSurface>

        {/* FAQ */}
        <InfoPageSurface>
        <Card className="mb-12 shadow-none border-0">
          <CardHeader>
            <CardTitle>FAQ</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Is this like AudioCraft?</div>
              <div>Inspired by the same kind of AI engines, but built for Pi‑5 and a simple, in‑browser workflow.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Do I need to know music theory?</div>
              <div>No — MusaiStudio can suggest tempo, key, and chords for you.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Can I sing on it?</div>
              <div>Yes — record directly or start with an AI voice as your guide.</div>
            </div>
          </CardContent>
        </Card>
        </InfoPageSurface>

        {/* Final CTA */}
        <div className="text-center">
          <InfoPageSurface className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold">Ready to turn an idea into a track today?</h2>
            <div className="mt-4 flex gap-3 justify-center">
              <Button onClick={() => navigate(ROUTES.MUSAI_STUDIO)}>Open the Studio</Button>
              <Button variant="outline">Try a 60‑Second Cue</Button>
            </div>
          </InfoPageSurface>
        </div>

        <InfoFooterNav currentRoute={ROUTES.MUSAI_STUDIO_INFO} />
      </div>
    </div>
  );
};

export default MusaiStudioInfo;


