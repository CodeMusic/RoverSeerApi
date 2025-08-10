import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import therapyHero from '@/assets/images/therapymusai_hero.png';
import {
  Heart,
  Sparkles,
  Compass,
  Brain,
  Quote,
  Puzzle,
  Network,
  Moon,
  Mic,
  Map,
  BadgeCheck,
  Shield,
  ChartNoAxesGantt,
  Search,
  BookOpen,
  MessageCircleQuestion
} from 'lucide-react';

const TherapyMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  const handleStartSession = (): void =>
  {
    navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_THERAPY } });
  };

  const handleScrollToSection = (sectionId: string): void =>
  {
    const el = document.getElementById(sectionId);
    if (el)
    {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_THERAPY} />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-600/10 via-fuchsia-500/5 to-transparent" />
        <div className="container mx-auto px-4 pt-14 pb-6 max-w-6xl">
          <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                TherapyMusai — Your Contextual Mirror & Emotional Debugger
              </h1>
              <p className="text-muted-foreground text-lg">
                Healing Through Reflection, Growth Through Play. Explore your inner world, reframe experiences, and integrate insights — turning personal growth into a living story you can see unfold.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button size="lg" onClick={handleStartSession}>
                  Start a Session
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleScrollToSection('how-it-works')}
                >
                  See How It Works
                </Button>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-rose-600" /> Privacy‑first
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-rose-600" /> Therapy‑informed
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-rose-500/15 via-fuchsia-400/10 to-transparent blur-2xl" />
              <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
                <img src={therapyHero} alt="TherapyMusai hero" className="block w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* What Is TherapyMusai? */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" /> What Is TherapyMusai?
              </CardTitle>
              <CardDescription>
                Your reflective AI companion — a context‑first listener and emotional debugger that connects past events, present feelings, and future choices.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                It’s not a replacement for therapy — it’s a bridge between sessions. TherapyMusai surfaces patterns and recurring themes, offers symbolic and cognitive reframes, and tracks your growth as a visible life story arc.
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Surfaces patterns and recurring themes</li>
                <li>Offers symbolic and cognitive reframes</li>
                <li>Tracks your growth as a visible life story arc</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* How It Works — Acts in Your Personal Story Arc */}
        <section id="how-it-works" className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Compass className="w-5 h-5" /> Act 1 — Intake
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Define the situation, theme, or challenge</li>
                  <li>Choose your mode: free reflection, guided prompts, or Portable Emergent Narrative</li>
                  <li>Pulls context from your Insight Timeline to connect with prior work</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" /> Act 2 — Exploration
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Step inside a past event and try new approaches with AI roleplay</li>
                  <li>Translate feelings into metaphors with Symbolic Integration</li>
                  <li>Identify distortions in self‑talk through Cognitive Reflection</li>
                  <li>Align thoughts and feelings with Emotional Debugging</li>
                  <li>Hear contrasting perspectives from Dolphin (logical) and Penguin (intuitive) agents with PerspectiveSync</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="w-5 h-5" /> Act 3 — Synthesis & Closure
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Review insights, reframes, and key breakthroughs</li>
                  <li>See shifts in themes and patterns</li>
                  <li>Optional Therapist Bridge: export symbolic summaries for your therapist</li>
                  <li>Update your Insight Timeline with the latest chapter of your growth</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" /> Act 4 — Background Processing (always on)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Analyzes themes across sessions: fears, triggers, identity patterns</li>
                  <li>Detects stuck loops using the Contextual Feedback Model (CFM)</li>
                  <li>Gamifies growth: unlock achievements like Increased Emotional Intelligence or Pattern Breaker</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Core Models & Philosophies */}
        <section id="core-models" className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Puzzle className="w-5 h-5" /> Contextual Feedback Model (CFM)
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Locates and resolves emotional loops where context and belief are out of sync.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Awareness‑First Model
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Transformation begins with noticing, not forcing.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Quote className="w-5 h-5" /> Symbolic Reasoning
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Turns abstract emotions into images, metaphors, and characters.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" /> ProtoConsciousness Engine
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Processes thoughts as content and feelings as context, flagging contradictions with curiosity.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Key Tools & Features */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Key Tools & Features</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border bg-card"><Mic className="w-4 h-4 inline mr-2" /> Voice Companion — Hands‑free reflection on desktop or Pi devices</div>
              <div className="p-3 rounded-lg border bg-card"><Map className="w-4 h-4 inline mr-2" /> Identity Mapping — See which inner parts are speaking</div>
              <div className="p-3 rounded-lg border bg-card"><Brain className="w-4 h-4 inline mr-2" /> Thought Clarifier — Detect distorted self‑talk</div>
              <div className="p-3 rounded-lg border bg-card"><BookOpen className="w-4 h-4 inline mr-2" /> Story Processing — Turn life events into symbolic narratives</div>
              <div className="p-3 rounded-lg border bg-card"><Search className="w-4 h-4 inline mr-2" /> Triggers Map — Identify emotional activators and alternative responses</div>
              <div className="p-3 rounded-lg border bg-card"><ChartNoAxesGantt className="w-4 h-4 inline mr-2" /> Insight Timeline — Visualize your evolving self‑understanding</div>
              <div className="p-3 rounded-lg border bg-card"><Moon className="w-4 h-4 inline mr-2" /> Dream Decoder — Translate dreams into meaningful metaphors</div>
              <div className="p-3 rounded-lg border bg-card"><Shield className="w-4 h-4 inline mr-2" /> Privacy First — Local‑first storage or encrypted cloud</div>
            </CardContent>
          </Card>
        </section>

        {/* Gamified Growth */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gamified Growth</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-5 space-y-1">
                <li>Earn Growth Badges for emotional intelligence, resilience, and self‑compassion</li>
                <li>See progress arcs over weeks and months</li>
                <li>Session streaks and themed quests to focus on recurring patterns</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* In the Future */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>In the Future</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>• SleepSync — Process daily feedback during sleep cycles</div>
              <div>• Therapist Bridge — Share curated session insights with your therapist</div>
              <div>• Model Visualizer — See your evolving inner model as an interactive map</div>
            </CardContent>
          </Card>
        </section>

        {/* Why It’s Different */}
        <section className="mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Why It’s Different</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-3">
              <p>
                TherapyMusai listens like poetry, treats tension as signal, and offers reflection — never judgment.
              </p>
              <p>
                It makes growth visible, tangible, and engaging — turning your personal development into a living, evolving story.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Final CTA */}
        <section className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={handleStartSession}>
              Start Your First Session
            </Button>
            <Button variant="outline" size="lg" onClick={() => handleScrollToSection('core-models')}>
              Learn More About the Models
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">[Arc diagram: Acts 1–4 story flow — Intake → Exploration → Synthesis → Background]</div>
        </section>
      </div>
    </div>
  );
};

export default TherapyMusaiInfo;



