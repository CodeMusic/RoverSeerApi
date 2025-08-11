import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Timer, Layers, ShieldCheck, FolderKanban, Mail, SlidersHorizontal, CircleHelp } from 'lucide-react';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';
import curationsHero from '@/assets/images/musai_curations_Card stack gliding into place — deep dive · spark · tool · thread.png';

const MusaiCurationsInfo: React.FC = () =>
{
  const navigate = useNavigate();

  const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  {
    return (
      <span className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-300 dark:text-slate-200">{children}</span>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_SEARCH} />

      <div className="container mx-auto px-4 py-14 max-w-6xl">
        {/* Hero */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold">No search. No scroll holes. Just the right things, right now.</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            MusaiCurations learns your tastes, timing, and tone — then hand‑picks articles, tools, and ideas that fit your creative rhythm.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => navigate(ROUTES.CURATIONS)}>See Today’s Picks</Button>
            <Button variant="outline" onClick={() => document.getElementById('how-it-learns')?.scrollIntoView({ behavior: 'smooth' })}>How It Learns</Button>
          </div>
          <div className="mt-8">
            <img
              src={curationsHero}
              alt="Musai Curations — card stack gliding into place"
              className="w-full rounded-2xl border border-slate-200/40 dark:border-slate-700 shadow-sm"
            />
          </div>
        </div>

        {/* How it works */}
        <div id="how-it-learns" className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { title: 'Signals', desc: 'Opens, finishes, favorites, shares, snoozes.' },
            { title: 'Profile', desc: 'A living map of topics, depth, formats, and vibe.' },
            { title: 'Serendipity', desc: 'Blends pattern and surprise to surface the good stuff.' },
            { title: 'Timing', desc: 'Morning sparks, midday tools, evening deep dives.' },
          ].map(({ title, desc }) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* What you get */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[{ title: 'Daily Deck', lines: ['5–9 items: spark, tool, deep dive, wild card.'] }, { title: 'Threads & Trails', lines: ['Mini‑series and weekend bundles you can finish.'] }, { title: 'Collections', lines: ['Auto‑built folders you can rename or export.'] }].map((c) => (
            <Card key={c.title}>
              <CardHeader>
                <CardTitle className="text-xl">{c.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground list-disc list-inside">
                  {c.lines.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls without typing */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-xl">Tune without typing</CardTitle>
            <CardDescription>You steer with signals, not searches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Pill>More playful</Pill>
              <Pill>More practical</Pill>
              <Pill>Surprise me</Pill>
              <Pill>Quicker hits</Pill>
              <Pill>Deeper dives</Pill>
              <Pill>Mute topic</Pill>
              <Pill>Boost theme</Pill>
              <Pill>Snooze to Saturday</Pill>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Taste Tuning overlay (coming soon): these controls will also be available as a floating sheet so you can adjust vibe and depth without leaving your feed.
            </div>
          </CardContent>
        </Card>

        {/* Inbox & Integrations */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Inbox & Rhythm</CardTitle>
              <CardDescription>Choose Daily, Twice‑Weekly, or Sunday Longform. Cadence controls coming soon.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Skim the email; open the web app when you want the full deck and trails.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Integrations</CardTitle>
              <CardDescription>Notion · Readwise · Pocket · Obsidian · PDF export</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Privacy & Trust */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-xl">Privacy & Trust</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground list-disc list-inside">
              <li>Local‑first taste modeling; minimal metadata.</li>
              <li>Transparent “Why this?” on every card.</li>
              <li>No selling your profile. Ever.</li>
            </ul>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-xl">FAQ</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Why no search?</div>
              <div>Because it’s curation, not retrieval. You guide with taste, not keywords.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Can I still find stuff?</div>
              <div>Yes — everything you’ve saved lives in Collections with smart tags.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Will it get weird?</div>
              <div>Only as weird as you want. Use Nudge and Mute anytime.</div>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold">Let the right ideas find you.</h2>
          <div className="mt-4">
            <Button onClick={() => navigate(ROUTES.CURATIONS)}>See Today’s Picks</Button>
          </div>
        </div>

        <InfoFooterNav currentRoute={ROUTES.CURATIONS_INFO} />
      </div>
    </div>
  );
};

export default MusaiCurationsInfo;


