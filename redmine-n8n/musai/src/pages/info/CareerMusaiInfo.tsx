import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Target, Brain, BookOpen, Mic, Cpu, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';

const CareerMusaiInfo: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CAREER} />
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">CareerMusai</h1>
          <p className="text-muted-foreground text-lg">Building more than AI—shaping systems that reflect the soul of work.</p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(ROUTES.EYE_OF_MUSAI)}>Eye of Musai</Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> What Is Career Musai?</CardTitle>
            <CardDescription>A living, personalized career and project navigator rooted in awareness and context.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>It’s not just a tool to manage your work. It evolves with you, reflects your values, and learns the rhythm of how you build. Where others offer task lists and calendars, Musai offers clarity and direction.</p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> 1. Awareness-Driven Architecture</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Powered by the Contextual Feedback Model (CFM): a loop where input reshapes internal understanding—like human insight.</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Emotions as compressed context</li>
                <li>Bias as hidden influence</li>
                <li>Thought chains as behavioral code</li>
              </ul>
              <p>It doesn’t just manage tasks. It understands why something matters to you.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> 2. Redmine-Integrated Memory + Task Flow</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-5 space-y-1">
                <li>Track training data and AI feedback loops</li>
                <li>Personal tasks, workflows, and priorities</li>
                <li>Identity-aware subtasks (e.g., [Agent: Music Penguin])</li>
                <li>Status pipelines like: New → Ready for Training → Trained</li>
              </ul>
              <p>The system remembers your work as part of your growth arc.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> 3. Narrative Layer for Life & Work</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>Sprints → Story beats</li>
                <li>Tasks → Character actions</li>
                <li>Blockers → Plot tension</li>
                <li>Breakthroughs → Act climaxes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5" /> 4. Voice & Edge Tools</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>Hands-free journal or task assistant (Whisper/Piper)</li>
                <li>Portable knowledge agent for field work</li>
                <li>Bridge between digital tools and real-world action</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5" /> 5. MusaiDex + Eye Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>Visual recognition for tools, docs, and spaces</li>
                <li>Context-aware catalogs you can train quickly</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Why Career Musai?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Because a career isn’t just work—it’s who we are becoming. CareerMusai holds up a mirror to your trajectory, talents, blind spots, and breakthroughs—turning the day into something alive with meaning.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coming Next</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-1">
              <li>PerspectiveSync (Dolphin & Penguin) reflective decision engine</li>
              <li>Feedback-Dream (nightly digest background training)</li>
              <li>Character Archetypes & Identity Templates for growth arcs</li>
            </ul>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
};

export default CareerMusaiInfo;



