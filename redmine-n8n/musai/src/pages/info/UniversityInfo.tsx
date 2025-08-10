import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Brain,
  MessageCircle,
  Code,
  Images,
  Layers,
  Stars,
  FileText,
  Bookmark,
  Quote,
  FlaskConical,
  ShieldCheck,
  Trophy,
  Microscope,
  GitBranch
} from 'lucide-react';
import universityHero from '@/assets/images/musaiuniversity_hero.png';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';

const UniversityInfo = () =>
{
  const navigate = useNavigate();

  const handleStartCourse = () =>
  {
    navigate(ROUTES.UNIVERSITY_COURSE_NEW);
  };

  const handleExploreHowItWorks = () =>
  {
    const target = document.getElementById('how-it-works');
    if (target)
    {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_UNIVERSITY} />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero */}
        <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 items-center mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-slate-300 to-indigo-400 dark:from-slate-200 dark:to-indigo-300 bg-clip-text text-transparent">
              Musai University — The University That Builds Itself Around You
            </h1>
            <p className="text-muted-foreground text-lg">
              Syllabus in seconds. Scholarship in depth. Lectures, examples, labs, and quizzes adapt to your pace, style, and curiosity — then your professor learns you back.
            </p>
            <div className="mt-6 flex gap-3 md:justify-start justify-center">
              <Button size="lg" onClick={handleStartCourse}>
                <GraduationCap className="w-4 h-4" /> Start Your First Course
              </Button>
              <Button size="lg" variant="outline" onClick={handleExploreHowItWorks}>
                <Sparkles className="w-4 h-4" /> Explore How It Works
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-slate-400/10 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
              <img src={universityHero} alt="Musai University hero" className="block w-full h-auto" />
            </div>
          </div>
        </div>

        {/* Hero image prompt for designers */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Images className="w-5 h-5" /> Hero Image Prompt
            </CardTitle>
            <CardDescription>For design/generation teams</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Elegant academic hero: dark slate → deep‑indigo gradient; subtle campus‑crest silhouette; floating cards labeled “Lecture • Professor Chat • Quiz”; thin constellations implying knowledge graphs; soft teal/emerald accents.
          </CardContent>
        </Card>

        {/* What makes it a University */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stars className="w-5 h-5" /> What Makes It A University
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <FileText className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Generative Curriculum</div>
                <div>Any topic becomes a rigorous course with modules, readings, and assessments.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <Brain className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Professor‑in‑Context</div>
                <div>An AI instructor that references your syllabus and history — not generic answers.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <Bookmark className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Scholarly Standards</div>
                <div>Citations, sources, and versioned syllabi; optional academic‑mode rubrics.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <Layers className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Learning Science Inside</div>
                <div>Spaced practice, retrieval, interleaving, and mastery gates — by design.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <div id="how-it-works" className="space-y-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 1) Start With A Topic
              </CardTitle>
              <CardDescription>Type what you want to learn — University drafts the full course.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <ul className="list-disc ml-5 space-y-1">
                <li>Course title & description</li>
                <li>Expert instructor persona</li>
                <li>Discovery tags</li>
                <li>Complete syllabus with modules & lecture topics</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> 2) Learn In The Generative Loop
              </CardTitle>
              <CardDescription>Each module follows a three‑step cycle</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-5 space-y-1">
                <li>📜 Lecture — On‑demand content aligned to your syllabus</li>
                <li>💬 Professor Chat — Ask questions in‑context; get references</li>
                <li>🧪 Quiz — Immediate feedback; unlocks the next step on mastery</li>
              </ul>
              <div className="text-xs text-muted-foreground">Progress is visual and persistent; you always return where you left off.</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> 3) Your Professor Learns You
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <ul className="list-disc ml-5 space-y-1">
                <li>Detects preferred metaphors and modalities (text, diagram, code, audio)</li>
                <li>Adjusts tone, pacing, and problem difficulty</li>
                <li>Adds visuals, musical analogies, or case studies when helpful</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Academic features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Academic Features (Modern, Not Stodgy)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <Quote className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Citation Mode</div>
                <div>Inline citations and a sources drawer per lecture.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <Bookmark className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Reading Ladders</div>
                <div>Beginner → intermediate → expert, with one must‑read each tier.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <FileText className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Scholarly Notes</div>
                <div>Key definitions, theorems, and historical context callouts.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <GitBranch className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Versioned Syllabi</div>
                <div>Track changes across cohorts or iterations.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3 md:col-span-2">
              <MessageCircle className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Office Hours</div>
                <div>Professor Chat with saved threads per module.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Labs & creativity */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Labs & Creativity
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <Code className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Live Code</div>
                <div>Runnable examples via CodeMusai; edit inline, see outputs instantly.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3">
              <Images className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Eye of Musai</div>
                <div>On‑the‑fly diagrams/illustrations for complex concepts.</div>
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card flex items-start gap-3 md:col-span-2">
              <FlaskConical className="w-4 h-4 mt-0.5" />
              <div>
                <div className="font-medium">Interactive Sandboxes</div>
                <div>Small experiments attached to lectures and problem sets.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessments & outcomes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" /> Assessments & Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <ul className="list-disc ml-5 space-y-1">
              <li>Module Quizzes — Frequent, low‑stakes checks for understanding</li>
              <li>Mastery Gates — Retakes encouraged; unlocks only on demonstrated learning</li>
              <li>Coming Soon: Mid‑terms & finals generated from your own course trail</li>
              <li>Capstones & Project Boards — Publish a project; get structured peer & mentor feedback</li>
            </ul>
          </CardContent>
        </Card>

        {/* Why it feels different */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why It Feels Different</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card">• Infinite Curriculum — Any course, born on demand</div>
            <div className="p-4 rounded-lg border bg-card">• Adaptive Teaching — The more you learn, the more it learns you</div>
            <div className="p-4 rounded-lg border bg-card">• Contextual Tutoring — Answers grounded in what you’ve seen already</div>
            <div className="p-4 rounded-lg border bg-card">• Progress You Can Feel — Unlocks, streaks, and mastery indicators that respect rigor</div>
          </CardContent>
        </Card>

        {/* Research‑grade learning */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Microscope className="w-5 h-5" /> Research‑Grade Learning (Optional Depth)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card">• Academic Mode — Prioritizes scholarly sources, DOIs, standards, and methods notes</div>
            <div className="p-4 rounded-lg border bg-card">• Method Boxes — “How we know”: brief summaries of study designs or proofs</div>
            <div className="p-4 rounded-lg border bg-card md:col-span-2">• Debate Frames — Major viewpoints with what would empirically discriminate between them</div>
          </CardContent>
        </Card>

        {/* Coming soon */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-4 rounded-lg border bg-card">• Multi‑Modal Lectures — Auto‑generated video, diagrams, audio briefs</div>
            <div className="p-4 rounded-lg border bg-card">• Collaborative Cohorts — Synchronous study pods with shared milestones</div>
            <div className="p-4 rounded-lg border bg-card md:col-span-2">• Portfolio Export — One‑click export of notes, projects, and reading ladder to share</div>
          </CardContent>
        </Card>

        {/* Micro‑FAQ */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Micro‑FAQ</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Is every course unique?</div>
              <div>Yes — syllabus, lectures, examples, and assessments are generated for your intent and adapted as you learn.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Can I demand citations?</div>
              <div>Enable Academic Mode for inline citations and a sources panel.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Will it remember me?</div>
              <div>Yes — the professor adapts to your style, confusions, and pace across modules and courses.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Can I code inside lectures?</div>
              <div>Yes — CodeMusai powers runnable examples and labs.</div>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center">
          <div className="flex gap-3 justify-center">
            <Button size="lg" onClick={handleStartCourse}>
              <GraduationCap className="w-4 h-4" /> Start Your First Course
            </Button>
            <Button size="lg" variant="outline" onClick={handleExploreHowItWorks}>
              Explore How It Works
            </Button>
          </div>
        </div>
        <InfoFooterNav currentRoute={ROUTES.UNIVERSITY_INFO} />
      </div>
    </div>
  );
};

export default UniversityInfo;


