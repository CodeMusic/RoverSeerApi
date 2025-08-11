import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES, RouteUtils } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  Brain,
  BookOpen,
  Mic,
  Target,
  Images,
  Layers,
  GitMerge,
  Sparkles
} from 'lucide-react';
import careerHero from '@/assets/images/careermusai_hero.png';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';

const CareerMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CAREER} />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-purple-500/5 to-transparent" />
        <div className="container mx-auto px-4 pt-14 pb-6 max-w-6xl">
          <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30 mb-6">
                <TrendingUp className="w-10 h-10 text-indigo-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                CareerMusai — A Living Career & Project Navigator
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Building more than workflows — shaping a system that reflects the soul of your work. A personalized navigator grounded in awareness and context that evolves with you.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 md:justify-start justify-center">
                <Button
                  onClick={() => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_CAREER } })}
                  className="rounded-xl"
                >
                  Open CareerMusai
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.EYE_OF_MUSAI)}
                  className="rounded-xl"
                >
                  Eye of Musai
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-purple-400/10 to-transparent blur-2xl" />
              <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
                <img src={careerHero} alt="CareerMusai hero" className="block w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What it is / Key pillars */}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> What Is CareerMusai?</CardTitle>
            <CardDescription>A living, personalized navigator rooted in awareness and context.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            It evolves with you, reflects your values, and learns the rhythm of how you build — so clarity and direction are always within reach.
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> Awareness‑Driven Architecture (CFM)</CardTitle>
              <CardDescription>Human‑like insight loop</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>Contextual Feedback Model where new input reshapes internal understanding.</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Emotions as compressed context (urgent vs. important)</li>
                <li>Bias as hidden influence (surface and rebalance)</li>
                <li>Thought chains as behavioral code (habits → actions)</li>
              </ul>
              <div>Understands why things matter — not just what’s next.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Redmine‑Integrated Memory</CardTitle>
              <CardDescription>Tasks, decisions, and evidence — linked</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-5 space-y-1">
                <li>Identity‑aware subtasks (e.g., [Agent: Music Penguin])</li>
                <li>Status pipelines (New → Ready for Training → Trained)</li>
                <li>Artifacts, notes, run logs for traceability</li>
              </ul>
              <div>Redmine acts as working + long‑term memory with attention‑like recall.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> Narrative Layer</CardTitle>
              <CardDescription>Turn sprints into story beats</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>Sprints → story beats</li>
                <li>Tasks → character actions</li>
                <li>Blockers → plot tension</li>
                <li>Breakthroughs → act climaxes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5" /> Voice & Edge Tools</CardTitle>
              <CardDescription>Hands‑free flow, field‑ready</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>Voice journal & quick capture (Whisper/Piper)</li>
                <li>Portable knowledge agent for on‑site work</li>
                <li>Bridge plans to real‑world action</li>
              </ul>
            </CardContent>
          </Card>
        </div>


        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> How it works</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">1) Sense</div>
              <div>Capture goals, tasks, artifacts, and signals (voice, notes, commits).</div>
            </div>
            <div>
              <div className="font-medium mb-1">2) Reflect</div>
              <div>CFM maps tensions, priorities, and patterns; suggests next best steps.</div>
            </div>
            <div>
              <div className="font-medium mb-1">3) Integrate</div>
              <div>Redmine stores decisions & evidence; your story arc updates for the next sprint.</div>
            </div>
          </CardContent>
        </Card>

        {/* Coming next */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitMerge className="w-5 h-5" /> PerspectiveSync</CardTitle>
              <CardDescription>Dolphin & Penguin decision engine</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Logical depth + creative breadth produce a fused recommendation with pros/cons.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Feedback‑Dream</CardTitle>
              <CardDescription>Nightly digest training</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Summarizes the day’s work, integrates patterns, and primes tomorrow’s focus.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Identity Templates</CardTitle>
              <CardDescription>Archetypes for growth</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Role presets that shape habits, language, and goals.
            </CardContent>
          </Card>
        </div>

        {/* Micro‑FAQ */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Micro‑FAQ</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Does it replace my PM tool?</div>
              <div>No. It augments it. Redmine remains the source of truth; CareerMusai adds awareness, perspective, and narrative.</div>
            </div>
            <div>
              <div className="font-medium mb-1">How does memory work?</div>
              <div>Items are linked with tags/relations. Retrieval uses attention‑like cues so the right context surfaces at the right time.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Can I keep everything local?</div>
              <div>Yes. Local‑first by default; any cloud assist is strictly opt‑in with redaction and caps.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Will it learn my workflow?</div>
              <div>It adapts to your cadence, blockers, and rituals — suggesting gentle improvements, not mandates.</div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center mb-16">
          <div className="mb-4">
            <Badge className="mr-2" variant="secondary">CFM‑aware</Badge>
            <Badge className="mr-2" variant="secondary">Redmine memory</Badge>
            <Badge className="mr-2" variant="secondary">Narrative sprints</Badge>
            <Badge variant="secondary">Voice & edge</Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_CAREER } })} className="rounded-xl">Open CareerMusai</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.FIND_YOUR_MUSE)} className="rounded-xl">Explore Ecosystem</Button>
          </div>
        </div>
        <InfoFooterNav currentRoute={ROUTES.CAREER_MUSAI} />
      </div>
    </div>
  );
};

export default CareerMusaiInfo;
