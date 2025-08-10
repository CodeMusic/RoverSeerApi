import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Sparkles, BookOpen, Brain, MessageCircle, Code, Images, Layers, Stars } from 'lucide-react';

const UniversityInfo = () =>
{
  const navigate = useNavigate();

  const handleStartCourse = () =>
  {
    navigate(ROUTES.UNIVERSITY_COURSE_NEW);
  };

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_UNIVERSITY} />

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-cyan-700 bg-clip-text text-transparent">
            Musai University — The University That Builds Itself Around You
          </h1>
          <p className="text-muted-foreground text-lg">
            A living, thinking institution that designs every course just for you. Every lecture, every quiz, every professor adapts to your pace, style, and curiosity.
          </p>
          <div className="mt-6">
            <Button size="lg" onClick={handleStartCourse}>
              <GraduationCap className="w-4 h-4" /> Start Your First Course Now
            </Button>
          </div>
        </div>

        {/* Section: World’s First Generative University */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stars className="w-5 h-5" /> World’s First Generative University
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Every course is born the moment you ask for it. Musai designs a full, adaptive learning journey around your intent.</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Designs a full syllabus in seconds</li>
              <li>Generates lectures, examples, and quizzes step-by-step</li>
              <li>Acts as your personal professor, answering questions in context</li>
              <li>Adapts to your style as you learn</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 1 — How It Works */}
        <div className="space-y-6 mb-10">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> 1) Start with a Topic
              </CardTitle>
              <CardDescription>Enter anything you want to learn — University generates the full course.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
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
                <BookOpen className="w-5 h-5" /> 2) Learn in the Generative Loop
              </CardTitle>
              <CardDescription>Each module follows a three-step cycle.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-5 space-y-1">
                <li>📜 Lecture — AI-generated, tailored to your topic</li>
                <li>💬 Professor Chat — Ask your AI instructor anything in context</li>
                <li>🧪 Quiz — Pass to unlock the next step</li>
              </ul>
              <div className="text-xs text-muted-foreground mt-2">
                Progress is visual and persistent — the dashboard remembers where you left off and what’s ahead.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" /> 3) Your Professor Learns You
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-5 space-y-1">
                <li>Tracks your learning style and preferred examples</li>
                <li>Adapts tone, pacing, and complexity</li>
                <li>Brings in visuals, music analogies, or real-world case studies when needed</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Section 2 — Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" /> Key Features
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-card">• Infinite Curriculum — Any topic, anytime</div>
            <div className="p-3 rounded-lg border bg-card">• Adaptive Teaching — Content evolves with you</div>
            <div className="p-3 rounded-lg border bg-card">• Contextual Tutoring — Professors remember your journey</div>
            <div className="p-3 rounded-lg border bg-card">• Progressive Unlocks — Every achievement feels earned</div>
            <div className="p-3 rounded-lg border bg-card md:col-span-2">• Creative Integration — Live code via <span className="font-medium">CodeMusai</span>, art via <span className="font-medium">Eye of Musai</span></div>
          </CardContent>
        </Card>

        {/* Section 3 — Assessments & Projects */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" /> Assessments & Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc ml-5 space-y-1">
              <li>Auto-generated quizzes in every module</li>
              <li>Retakes encouraged — mastery over first-try scores</li>
              <li>Coming Soon: Mid-terms and finals built from your own material</li>
              <li>Coming Soon: Capstone projects and student project boards</li>
            </ul>
          </CardContent>
        </Card>

        {/* Section 4 — Why It’s Different */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why It’s Different</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Musai University isn’t a library of old videos. It’s alive. It shapes itself to you — your goals, your style, and your pace.</p>
            <p>Every course is yours alone. Every professor teaches only you.</p>
          </CardContent>
        </Card>

        {/* Section 5 — Coming Soon */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <div>• Multi-Modal Learning — Generated videos, diagrams, and audio lectures</div>
            <div>• Collaborative Courses — Synchronous generative learning in small groups</div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <div className="text-center">
          <Button size="lg" onClick={handleStartCourse}>
            <GraduationCap className="w-4 h-4" /> Begin Your First Personalized Course Today
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UniversityInfo;


