import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import therapyHero from '@/assets/images/therapymusai_hero.png';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';
import KnowledgeTerm from '@/components/common/KnowledgeTerm';
import { InfoPageSurface } from '@/components/common/InfoPageSurface';
import { AspectRatio } from '@/components/ui/aspect-ratio';
// Aesthetic preview images
import mobileMock from '@/assets/images/therapymusai_Mobile therapy interface mock.png';
import toolsGrid from '@/assets/images/therapy musai _Grid of therapy tools.png';
import flowDiagram from '@/assets/images/therapy musai_Therapy flow diagram.png';
import therapeuticDashboard from '@/assets/images/therapy musai_Therapeutic dashboard- mood ring.png';
import allianceThreads from '@/assets/images/therapymusai_ Two abstract figures.png';
import iconsSet from '@/assets/images/therapymusai_  Minimal line icons.png';
import valuesGoals from '@/assets/images/therapy musai _  Values and goals cards.png';
import progressChart from '@/assets/images/therapymusai_Therapeutic progress visualization.png';
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
  MessageCircleQuestion,
  Users,
  Image as ImageIcon
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
          <InfoPageSurface auraClassName="from-rose-500/15 via-fuchsia-400/10">
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
                <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
                  <div className="w-full max-w-5xl mx-auto">
                    <img src={therapyHero} alt="TherapyMusai hero" className="block w-full h-auto object-contain" />
                  </div>
                </div>
              </div>
            </div>
          </InfoPageSurface>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* What Is TherapyMusai? */}
        <section className="mb-8">
          <InfoPageSurface>
            <Card className="shadow-none border-0">
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
          </InfoPageSurface>
        </section>

        {/* Session Types */}
        <section className="mb-8">
          <InfoPageSurface>
          <Card className="shadow-none border-0">
            <CardHeader>
              <CardTitle>Session Types</CardTitle>
              <CardDescription>
                TherapyMusai adapts to your needs with multiple session modes — each with its own tone, pacing, and visual theme.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
              {/* Standard Reflection */}
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium mb-1">🌞 Standard Reflection</div>
                <div className="space-y-2">
                  <p>
                    Your default journey — a balanced light/dark interface for open exploration or gentle guidance. Swap between free talk, concise prompts, and symbolic reframing as you go.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Quick check‑ins, mood tagging, and micro‑insights</li>
                    <li>Guided prompts when you want structure</li>
                    <li>Symbolic reframes to see patterns from a new angle</li>
                  </ul>
                </div>
              </div>

              {/* Shadow Integration */}
              <div className="p-3 rounded-lg border bg-card dark:bg-emerald-950/20 border-emerald-700/30">
                <div className="font-medium mb-1">🌑 Shadow Integration (Dark Mode UX)</div>
                <div className="space-y-2">
                  <p>
                    When you’re ready to face the unseen. Explore how the ought self, ideal self, and actual self are shaped by internalized judgment — and how that casts behaviors into shadow.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Shadow ≈ avoided pattern the self resists seeing</li>
                    <li>Why it matters: unattended patterns can grow unchecked</li>
                    <li>Core insight: many “bad” behaviors are misapplied good intentions</li>
                  </ul>
                  <ol className="list-decimal ml-5 space-y-1 mt-1">
                    <li>Identify the root intent behind the behavior</li>
                    <li>Reconnect with the original healthy drive</li>
                    <li>Reintegrate with compassion and clear boundaries</li>
                  </ol>
                </div>
              </div>

              {/* Emergent Narrative — Re‑creatable Situations */}
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium mb-1">🎭 Emergent Narrative (Re‑creatable Situations)</div>
                <div className="space-y-2">
                  <p>
                    Turn moments into repeatable “scenes” you can revisit. Characters, roles, and cues are saved so you can rehearse new responses and compare outcomes over time.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Scene setup: context, roles, goals, and emotional cues</li>
                    <li>Rehearsal: safe practice for CBT/DBT techniques</li>
                    <li>Re‑entry: reload prior branches to test alternatives</li>
                  </ul>
                </div>
              </div>

              {/* Journaling */}
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium mb-1">📝 Journaling</div>
                <div className="space-y-2">
                  <p>
                    Free‑form or prompted writing with light structure. Capture daily reflections, tag themes, and watch micro‑insights accumulate into patterns.
                  </p>
                  <ul className="list-disc ml-5 space-y-1">
                    <li>Daily prompts and streaks to build momentum</li>
                    <li>Tags feed your Insight Timeline and search</li>
                    <li>Voice‑to‑text capture for quick entries</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          </InfoPageSurface>
        </section>

        {/* Visual inserts — Mobile UI and Tools grid */}
        <section className="mb-8">
          <InfoPageSurface>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border bg-card overflow-hidden">
              <AspectRatio ratio={16/9}>
                <img src={mobileMock} alt="Mobile therapy interface mock — single column glass cards" className="block w-full h-full object-contain" />
              </AspectRatio>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
              <AspectRatio ratio={16/9}>
                <img src={toolsGrid} alt="Grid of therapy tools — 5-4-3-2-1, breathing, body scan" className="block w-full h-full object-contain" />
              </AspectRatio>
            </div>
          </div>
          </InfoPageSurface>
        </section>

        {/* How It Works — Acts in Your Personal Story Arc */}
        <section id="how-it-works" className="mb-8">
          <InfoPageSurface>
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
                  <li>Detects stuck loops using the <KnowledgeTerm k="cfm">Contextual Feedback Model (CFM)</KnowledgeTerm></li>
                  <li>Gamifies growth: unlock achievements like Increased Emotional Intelligence or Pattern Breaker</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 rounded-md border bg-card overflow-hidden">
            <AspectRatio ratio={16/9}>
              <img src={flowDiagram} alt="Therapy flow diagram — Thought → Emotion → Behavior → Reframe" className="block w-full h-full object-contain" />
            </AspectRatio>
          </div>
          </InfoPageSurface>
        </section>

        {/* Core Models & Philosophies */}
        <section id="core-models" className="mb-8">
          <InfoPageSurface>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Puzzle className="w-5 h-5" /> <KnowledgeTerm k="cfm">Contextual Feedback Model (CFM)</KnowledgeTerm>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Locates and resolves emotional loops where context and belief are out of sync.
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> <KnowledgeTerm k="awareness-first">Awareness‑First Model</KnowledgeTerm>
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
          </InfoPageSurface>
        </section>

        {/* Visual inserts — Dashboard and Alliance */}
        <section className="mb-8">
          <InfoPageSurface>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border bg-card overflow-hidden">
              <AspectRatio ratio={16/9}>
                <img src={therapeuticDashboard} alt="Therapeutic dashboard — mood ring and safety indicator" className="block w-full h-full object-contain" />
              </AspectRatio>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
              <AspectRatio ratio={16/9}>
                <img src={allianceThreads} alt="Two abstract figures (guide and client) made of flowing light" className="block w-full h-full object-contain" />
              </AspectRatio>
            </div>
          </div>
          </InfoPageSurface>
        </section>

        {/* Key Tools & Features */}
        <section className="mb-8">
          <InfoPageSurface>
          <Card className="shadow-none border-0">
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
              <div className="p-3 rounded-lg border bg-card"><ImageIcon className="w-4 h-4 inline mr-2" /> Symbolic Images (WIP) — Turn emotions into visual symbols to externalize and work with them</div>
              <div className="p-3 rounded-lg border bg-card"><Users className="w-4 h-4 inline mr-2" /> Partner Counseling Images (WIP) — A gentle visual showing how your partner experiences you in tense moments; use it to spark a curious, kind dialogue</div>
            </CardContent>
          </Card>
          </InfoPageSurface>
        </section>

        {/* Visual inserts — Icons and Values */}
        <section className="mb-8">
          <InfoPageSurface>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-md border bg-card overflow-hidden">
              <AspectRatio ratio={16/9}>
                <img src={iconsSet} alt="Minimal line icons on glass chips — breathing, journal, tools" className="block w-full h-full object-contain" />
              </AspectRatio>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
              <AspectRatio ratio={16/9}>
                <img src={valuesGoals} alt="Values and goals cards floating — compass and mountain icons" className="block w-full h-full object-contain" />
              </AspectRatio>
            </div>
          </div>
          </InfoPageSurface>
        </section>

        {/* Gamified Growth */}
        <section className="mb-8">
          <InfoPageSurface>
          <Card className="shadow-none border-0">
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
          </InfoPageSurface>
        </section>

        {/* Visual insert — Progress chart */}
        <section className="mb-8">
          <InfoPageSurface>
          <div className="rounded-md border bg-card overflow-hidden">
            <AspectRatio ratio={16/9}>
              <img src={progressChart} alt="Therapeutic progress visualization — soft curved line chart" className="block w-full h-full object-contain" />
            </AspectRatio>
          </div>
          </InfoPageSurface>
        </section>

        {/* In the Future */}
        <section className="mb-8">
          <InfoPageSurface>
          <Card className="shadow-none border-0">
            <CardHeader>
              <CardTitle>In the Future</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>• SleepSync — Process daily feedback during sleep cycles</div>
              <div>• Therapist Bridge — Share curated session insights with your therapist</div>
              <div>• Model Visualizer — See your evolving inner model as an interactive map</div>
            </CardContent>
          </Card>
          </InfoPageSurface>
        </section>

        {/* Why It’s Different */}
        <section className="mb-10">
          <InfoPageSurface>
          <Card className="shadow-none border-0">
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
          </InfoPageSurface>
        </section>

        {/* Final CTA */}
        <section className="mb-12 text-center">
          <InfoPageSurface className="mx-auto max-w-3xl">
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" onClick={handleStartSession}>
                Start Your First Session
              </Button>
              <Button variant="outline" size="lg" onClick={() => handleScrollToSection('core-models')}>
                Learn More About the Models
              </Button>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">[Arc diagram: Acts 1–4 story flow — Intake → Exploration → Synthesis → Background]</div>
          </InfoPageSurface>
        </section>
        <InfoFooterNav currentRoute={ROUTES.THERAPY_MUSAI} />
      </div>
    </div>
  );
};

export default TherapyMusaiInfo;



