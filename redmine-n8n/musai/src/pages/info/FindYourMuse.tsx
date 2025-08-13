import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Search,
  Code,
  GraduationCap,
  Bot,
  Sparkles,
  Music,
  Heart,
  Lightbulb,
  Target,
  ArrowRight,
  Play,
  Brain,
  Theater,
  TrendingUp,
  Eye
} from "lucide-react";
import { ROUTES, RouteUtils } from "@/config/routes";
import { APP_TERMS } from "@/config/constants";
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';

const FindYourMuse = () =>
{
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchDepthMode, setSearchDepthMode] = useState<'lighter' | 'deeper'>('lighter');

  const musaiComponents = [
    {
      id: "chat",
      icon: MessageSquare,
      title: "MusaiChat",
      subtitle: "Conversational Reflection",
      description: "Light conversation that helps you explore ideas and find clarity. MusaiChat learns your patterns and preferences, becoming a true reflection of your inner voice.",
      features: [
        "Natural conversation flow",
        "Memory of past interactions",
        "Personalized responses",
        "Reflective questioning"
      ],
      color: "from-blue-500 to-purple-500",
      action: () => navigate(ROUTES.MAIN_APP)
    },
    {
      id: "search",
      icon: Search,
      title: "MusaiSearch",
      subtitle: "Intelligent Discovery",
      description: "Advanced research and discovery mode that finds inspiration, answers, and connections you might not have considered. Perfect for exploring new ideas and finding fresh perspectives.",
      features: [
        "Multi-source research",
        "Inspiration discovery",
        "Trend analysis",
        "Cross-reference insights"
      ],
      color: "from-green-500 to-teal-500",
      action: () => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_SEARCH } })
    },
    {
      id: "code",
      icon: Code,
      title: "CodeMusai",
      subtitle: "Paired AI Programming",
      description: "Collaborative coding experience where Musai becomes your programming partner. Together you create, debug, and innovate - turning ideas into working solutions.",
      features: [
        "Real-time code collaboration",
        "Intelligent debugging",
        "Best practice guidance",
        "Creative problem solving"
      ],
      color: "from-orange-500 to-red-500",
      action: () => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_CODE } })
    },
    {
      id: "university",
      icon: GraduationCap,
      title: "Musai U",
      subtitle: "Generative Emergent Learning",
      description: "Just say what you want to learn and watch as Musai creates a complete learning experience. It generates a syllabus, creates lectures with Q&A, and builds interactive quizzes - all tailored to your learning style.",
      features: [
        "Dynamic syllabus generation",
        "Interactive lectures",
        "Adaptive Q&A sessions",
        "Progress tracking quizzes"
      ],
      color: "from-purple-500 to-indigo-500",
      action: () => navigate(ROUTES.UNIVERSITY_INFO)
    },
    {
      id: "narrative",
      icon: Theater,
      title: "MusaiTale",
      subtitle: "Perspective Thinking",
      description: "Put your abstract ideas into story frameworks where AI characters inhabit and concretize them. This allows you to see your ideas from new perspectives—and even relive experiences to rehearse therapeutic techniques within safe narrative simulations.",
      features: [
        "Making ideas tangible through emergence",
        "Multi-perspective exploration",
        "AI character inhabitation",
        "Perspective-driven insights"
      ],
      color: "from-indigo-500 to-purple-500",
      action: () => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_NARRATIVE } })
    },
    {
      id: "career",
      icon: TrendingUp,
      title: APP_TERMS.NAV_CAREER,
      subtitle: "Career Development",
      description: "Your AI-powered career companion. Track roles, practice interviews, craft applications, and orchestrate scheduled job searches via n8n—with alerts when results arrive.",
      features: [
        "Role targeting and skills mapping",
        "Resume and outreach generation",
        "Interview rehearsal",
        "Scheduled searches + MusaiAlerts"
      ],
      color: "from-indigo-500 to-indigo-700",
      action: () => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_CAREER } })
    },
    {
      id: "therapy",
      icon: Heart,
      title: APP_TERMS.NAV_THERAPY,
      subtitle: "Mental Wellness",
      description: "Reflective dialogue focused on wellness and growth. Combine calm guidance with MusaiTale’s emergent scenes to safely relive experiences and practice CBT/DBT techniques.",
      features: [
        "Supportive reflective chat",
        "Mood tagging and goals",
        "Technique rehearsal via narrative",
        "Privacy-aware exports"
      ],
      color: "from-pink-500 to-fuchsia-500",
      action: () => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_THERAPY } })
    },
    {
      id: "task",
      icon: Bot,
      title: "AgileMusai",
      subtitle: "Orchestrated Achievement",
      description: "Where everything comes together. AgileMusai coordinates all other Musai components to help you achieve high-level goals. It's the conductor of your creative symphony.",
      features: [
        "Multi-component orchestration",
        "Goal decomposition",
        "Progress tracking",
        "Adaptive planning"
      ],
      color: "from-pink-500 to-rose-500",
      action: () => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_TASK } })
    },
    {
      id: "eye",
      icon: Eye,
      title: APP_TERMS.NAV_EYE,
      subtitle: "Contextual Vision",
      description: APP_TERMS.EYE_DESCRIPTION,
      features: [
        "MusaiDex customizable indexing",
        "Vision + language fusion",
        "Fast on-device learning",
        "Context-aware classification"
      ],
      color: "from-cyan-500 to-sky-500",
      action: () => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_EYE } })
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: "Discover Your Voice",
      description: "Start with MusaiChat to explore your thoughts and find clarity. Let the conversation flow naturally as Musai learns your patterns.",
      icon: Heart,
      color: "bg-blue-500"
    },
    {
      step: 2,
      title: "Find Inspiration",
      description: "Use MusaiSearch to discover new ideas, research topics, and find fresh perspectives that resonate with your goals.",
      icon: Lightbulb,
      color: "bg-green-500"
    },
    {
      step: 3,
      title: "Build & Create",
      description: "Collaborate with CodeMusai to turn ideas into reality, or use Musai U to learn new skills and knowledge.",
      icon: Code,
      color: "bg-orange-500"
    },
    {
      step: 4,
      title: "Perspective Thinking",
      description: "Use MusaiTale to put your abstract ideas into story frameworks where AI characters inhabit and concretize them, helping you see your own ideas from new perspectives. Each engagement steers the plot, each insight rewrites the arc—so you can also safely rehearse therapeutic techniques by reliving experiences in narrative.",
      icon: Theater,
      color: "bg-indigo-500"
    },
    {
      step: 5,
      title: "Achieve Together",
      description: "Let AgileMusai orchestrate all components to help you reach your highest goals and dreams.",
      icon: Target,
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_SEARCH} />
      {/* Hero Hub */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-300/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-300/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Find Your Musai
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground">One mind, many forms.</p>
            <p className="mt-4 text-lg text-muted-foreground">Explore. Compare. Click to learn.</p>
            <p className="mt-2 text-base text-muted-foreground">This is the hub where you can browse all Musai forms. MusaiSearch is highlighted below; select any other tile to jump to its info page.</p>

            {/* Luminous hub visual */}
            <div className="relative mx-auto mt-10 mb-6 w-full max-w-3xl h-56">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),rgba(20,184,166,0.02),transparent_70%)]" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 shadow-2xl flex items-center justify-center text-white font-semibold tracking-wide">
                Musai
              </div>
              {/* Spokes */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-28 bg-gradient-to-b from-emerald-400/70 to-transparent origin-bottom" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 w-1 h-28 bg-gradient-to-b from-emerald-400/70 to-transparent origin-bottom" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 w-1 h-28 bg-gradient-to-b from-emerald-400/70 to-transparent origin-bottom" />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 w-1 h-28 bg-gradient-to-b from-emerald-400/70 to-transparent origin-bottom" />
            </div>

            {/* Hub tiles (info pages) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {[
                // Canonical order: Chat → Search → Eye → Code → University → Narrative → Medical → Therapy → Curations → Career → Studio → Task
                {
                  id: 'chat',
                  icon: MessageSquare,
                  label: 'MusaiChat',
                  description: APP_TERMS.CHAT_DESCRIPTION,
                  onClick: () => navigate(ROUTES.MEET_MUSAI),
                },
                {
                  id: 'search',
                  icon: Search,
                  label: 'MusaiSearch',
                  description: APP_TERMS.SEARCH_DESCRIPTION,
                  onClick: () => navigate(ROUTES.FIND_YOUR_MUSE),
                  selected: true,
                },
                {
                  id: 'eye',
                  icon: Eye,
                  label: APP_TERMS.NAV_EYE,
                  description: APP_TERMS.EYE_DESCRIPTION,
                  onClick: () => navigate(ROUTES.EYE_OF_MUSAI),
                },
                {
                  id: 'code',
                  icon: Code,
                  label: 'CodeMusai',
                  description: APP_TERMS.CODE_DESCRIPTION,
                  onClick: () => navigate(ROUTES.CODE_MUSAI_INFO),
                },
                {
                  id: 'university',
                  icon: GraduationCap,
                  label: 'Musai U',
                  description: APP_TERMS.UNIVERSITY_DESCRIPTION,
                  onClick: () => navigate(ROUTES.UNIVERSITY_INFO),
                },
                {
                  id: 'narrative',
                  icon: Theater,
                  label: 'MusaiTale',
                  description: APP_TERMS.NARRATIVE_DESCRIPTION,
                  onClick: () => navigate(ROUTES.EMERGENT_NARRATIVE),
                },
                {
                  id: 'medical',
                  icon: Brain,
                  label: 'MedicalMusai',
                  description: APP_TERMS.MEDICAL_DESCRIPTION,
                  onClick: () => navigate(ROUTES.MEDICAL_MUSAI),
                },
                {
                  id: 'therapy',
                  icon: Heart,
                  label: 'TherapyMusai',
                  description: APP_TERMS.THERAPY_DESCRIPTION,
                  onClick: () => navigate(ROUTES.THERAPY_MUSAI),
                },
                {
                  id: 'curations',
                  icon: Sparkles,
                  label: 'MusaiCurations',
                  description: 'Curate and review AI outputs and evaluations',
                  onClick: () => navigate(ROUTES.CURATIONS_INFO),
                },
                {
                  id: 'task',
                  icon: Bot,
                  label: 'AgileMusai',
                  description: APP_TERMS.TASK_DESCRIPTION,
                  onClick: () => navigate(ROUTES.TASK_MUSAI),
                },
                {
                  id: 'career',
                  icon: TrendingUp,
                  label: APP_TERMS.NAV_CAREER,
                  description: APP_TERMS.CAREER_DESCRIPTION,
                  onClick: () => navigate(ROUTES.CAREER_MUSAI),
                },
                {
                  id: 'studio',
                  icon: Music,
                  label: 'MusaiStudio',
                  description: 'Create, stage, and orchestrate content with Musai',
                  onClick: () => navigate(ROUTES.MUSAI_STUDIO_INFO),
                },
              ].map((tile) => (
                <Button
                  key={(tile as any).id}
                  variant="outline"
                  className={[
                    'justify-start h-auto min-h-[5.75rem] py-5 px-5 border-2 hover:bg-teal-500/10 text-left w-full whitespace-normal break-words',
                    (tile as any).selected ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300' : '',
                  ].join(' ')}
                  onClick={(tile as any).onClick}
                >
                  {'icon' in tile && (tile as any).icon ? (
                    (() => {
                      const Icon = (tile as any).icon as any;
                      return <Icon className="w-4 h-4 mr-2 mt-0.5" />;
                    })()
                  ) : null}
                  <div className="min-w-0">
                    <div className="font-medium">{(tile as any).label}{(tile as any).selected ? ' (selected)' : ''}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2 md:line-clamp-3">{(tile as any).description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MusaiSearch — from quick answers to deep research */}
      <div className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold">MusaiSearch — from quick answers to deep research</h2>
          <p className="text-muted-foreground mt-2">MusaiSearch adapts to your intent. Choose the scope, see the thinking, and keep what matters.</p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant={searchDepthMode === 'lighter' ? 'default' : 'outline'}
            onClick={() => setSearchDepthMode('lighter')}
            className={searchDepthMode === 'lighter' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            Lighter
          </Button>
        
          <Button
            variant={searchDepthMode === 'deeper' ? 'default' : 'outline'}
            onClick={() => setSearchDepthMode('deeper')}
            className={searchDepthMode === 'deeper' ? 'bg-teal-600 hover:bg-teal-700' : ''}
          >
            Deeper
          </Button>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-10 text-sm text-muted-foreground">
          <Card
            className={[
              'transition-colors',
              searchDepthMode === 'lighter'
                ? 'border-emerald-600/60 bg-emerald-500/5'
                : 'border-border'
            ].join(' ')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span
                  className={[
                    'inline-block h-2 w-2 rounded-full',
                    searchDepthMode === 'lighter' ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                  ].join(' ')}
                />
                Lighter
              </CardTitle>
              <CardDescription>Fast web scan for up‑to‑date answers and sources</CardDescription>
            </CardHeader>
            <CardContent>
              Emphasizes speed and recency with concise synthesis.
            </CardContent>
          </Card>
          <Card
            className={[
              'transition-colors',
              searchDepthMode === 'deeper'
                ? 'border-teal-600/60 bg-teal-500/5'
                : 'border-border'
            ].join(' ')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span
                  className={[
                    'inline-block h-2 w-2 rounded-full',
                    searchDepthMode === 'deeper' ? 'bg-teal-500' : 'bg-muted-foreground/40'
                  ].join(' ')}
                />
                Deeper
              </CardTitle>
              <CardDescription>Structured research: academic papers, datasets, standards, cross‑referenced analysis</CardDescription>
            </CardHeader>
            <CardContent>
              Builds a traceable brief with citations and contradictions highlighted.
            </CardContent>
          </Card>
        </div>

        {/* Why this matters */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Why this matters</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              Most search tools hide their reasoning. MusaiSearch shows perspective: two complementary processes (creative/top‑down and logical/bottom‑up) review the same query in parallel, then fuse their views into a clear, cited answer.
            </p>
          </CardContent>
        </Card>

        {/* Perspective you can actually see */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold mb-3">Perspective you can actually see</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>How it thinks (at a glance)</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Creative scan: maps themes, ideas, and connections quickly.</div>
                <div>• Logical scan: checks details, methods, dates, citations, and contradictions.</div>
                <div>• Fusion: merges both into a final brief with highlighted agreements and flagged disagreements.</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>On‑screen cues</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Agreement band: shows how closely the two scans align.</div>
                <div>• Conflict cards: see both sides and “what would confirm/resolve this.”</div>
                <div>• Source drawer: open any claim to preview exact passages used.</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sources chosen to fit the question */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Sources chosen to fit the question</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div>• Academic: journals, preprints, standards, datasets.</div>
            <div>• General: explainers, news, docs, reputable blogs.</div>
            <div>• Specialized (when relevant): guidelines, specs, regulatory notes.</div>
            <div className="mt-2">You can pin or exclude domains, set recency windows, and decide how much of the query may be shared with cloud sources in Deeper mode.</div>
          </CardContent>
        </Card>

        {/* Keep findings you'll actually find again */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Keep findings you’ll actually find again</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div>Musai uses Redmine as a linked memory map. Search results can be saved as issues with tags, relations, and attachments—like an attention system for recall.</div>
            <div>• Tag by topic, project, decision, or confidence.</div>
            <div>• Link related findings across searches.</div>
            <div>• Revisit the exact reasoning trail later.</div>
          </CardContent>
        </Card>

        {/* Privacy and control by default */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Privacy and control by default</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div>• Local first: lighter scans can run locally (where available).</div>
            <div>• Granular hybrid: in deeper mode, you choose what (if anything) can go to cloud—raw text, summaries, or redacted excerpts.</div>
            <div>• Receipts: every result shows when it was fetched, from where, and why it was selected.</div>
          </CardContent>
        </Card>

        {/* Curiosity starters */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-4">Curiosity starters</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              "What are the strongest competing theories about climate sensitivity, and how could I tell them apart?",
              "Summarize the last 18 months of research on LLM safety, then give me 3 consensus points and 3 open questions.",
              "Compare two standards for FHIR vs. HL7 v2. Where do they conflict, and what tests would settle it?",
              "I’m new to reinforcement learning. Build a reading ladder: beginner → intermediate → expert, with one must‑read at each level."
            ].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                className="justify-start h-auto py-3 w-full whitespace-normal break-words text-left"
                onClick={() => navigate(RouteUtils.mainAppWithMode('search', preset), { state: { switchToTab: APP_TERMS.TAB_SEARCH, initialQuery: preset } })}
              >
                {preset}
              </Button>
            ))}
          </div>
        </div>

        {/* Micro‑FAQ */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold mb-4">Micro‑FAQ</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Is this just a meta search?</CardTitle>
              </CardHeader>
              <CardContent>No. It’s a reasoning layer over retrieval. You’ll see agreement, conflict, and evidence.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Can I use only academic sources?</CardTitle>
              </CardHeader>
              <CardContent>Yes — lock to academic and set a recency window (e.g., last 24 months).</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What if sources disagree?</CardTitle>
              </CardHeader>
              <CardContent>You’ll get Conflict cards with side‑by‑side claims and suggested ways to resolve them.</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Will it remember my research trail?</CardTitle>
              </CardHeader>
              <CardContent>If you save it: yes. Redmine tags and links let you return to any insight with context intact.</CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={() => navigate(RouteUtils.mainAppWithMode('search'), { state: { switchToTab: APP_TERMS.TAB_SEARCH } })}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Enter MusaiSearch
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>

        
        <InfoFooterNav currentRoute={ROUTES.FIND_YOUR_MUSE} />
      </div>
    </div>
  );
};

export default FindYourMuse;



