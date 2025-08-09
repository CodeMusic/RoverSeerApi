import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Heart, Sparkles, BookOpen, Compass, Brain, Quote, Puzzle, GitBranch, Map, Shield, Moon, Share2, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';

const TherapyMusaiInfo: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-pink-600 to-fuchsia-600 bg-clip-text text-transparent">TherapyMusai</h1>
          <p className="text-muted-foreground text-lg">A contextual mirror, an emotional debugger, and a compassionate co-navigator.</p>
          <div className="mt-6">
            <Button onClick={() => navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_THERAPY } })}>Open TherapyMusai</Button>
          </div>
        </div>

        {/* What it is */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5" /> What Is TherapyMusai?</CardTitle>
            <CardDescription>Reflective AI for insight, reframing, and integration—built on context-first understanding and symbolic reasoning.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Not a replacement for therapy—TherapyMusai supports the work between sessions, surfacing patterns and connecting threads that run through your inner world.</p>
            <p className="italic">It doesn’t ask “what’s wrong?” It learns to ask: what’s unresolved, what needs reframing, and what’s ready to be integrated?</p>
          </CardContent>
        </Card>

        {/* Core Philosophy */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> Contextual Feedback Model (CFM)</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Models how emotion, perception, and belief interact through feedback loops. When context shifts but beliefs don’t, tension arises—CFM helps locate and resolve these loops.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Awareness-First Model</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Transformation begins with attention. Reality is shaped by perception; perception by awareness. We start with witnessing, not force.</CardContent>
          </Card>
        </div>

        {/* What it does */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Quote className="w-5 h-5" /> Cognitive Reflection</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Identifies distortions and fallacies in self-talk; maps recurring loops to underlying beliefs.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Symbolic Integration</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Turns abstract feelings into images/metaphor; reframes dreams or symbols; integrates with MusaiTale for story processing.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Puzzle className="w-5 h-5" /> Emotional Debugging</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Detects split-signals (logic vs feeling), explores conflicts, and suggests gentle prompts for alignment.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" /> Narrative Processing</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Links events across time; supports timeline repair; lets inner voices appear as symbolic characters.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5" /> Feedback Loop Correction</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Highlights stuck loops where the emotional model hasn’t updated; guides safe reframes and tracks progress.
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> ProtoConsciousness Engine</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Processes thoughts as content and feelings as context; flags contradictions and blind spots with curiosity.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Heart className="w-5 h-5" /> Reflection Mode</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Quiet prompts and pacing—no rush to fix, more space to notice.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Map className="w-5 h-5" /> Theme Tracking</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Parses journals by themes: fears, triggers, identity patterns, longing vs avoidance.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5" /> PerspectiveSync</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Dual agents (Dolphin = logical, Penguin = intuitive) offer contrasting reflections—you complete the triad.</CardContent>
          </Card>
        </div>

        {/* Tools & Features */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tools & Features</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <div className="grid md:grid-cols-2 gap-4">
              <div>🗣️ Voice Companion — Pi/desktop assistant for hands-free reflection</div>
              <div>🧭 Identity Mapping — See which inner parts are speaking</div>
              <div>🧠 Thought Clarifier — Flags distorted self-talk</div>
              <div>📜 Story Processing — Converts events into symbolic stories</div>
              <div>🔍 Triggers Map — Tracks activators and paths to new outcomes</div>
              <div>📈 Insight Timeline — Watch understanding evolve</div>
              <div>🌌 Dream Decoder — Translate dreams into metaphors</div>
              <div>🔐 Privacy — Local-first or user-controlled storage</div>
            </div>
          </CardContent>
        </Card>

        {/* In the Future */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>In the Future</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2"><Moon className="w-4 h-4" /> SleepSync: process daily feedback while you sleep</div>
            <div className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Therapist Bridge: optional symbolic snapshots on your terms</div>
            <div className="flex items-center gap-2"><Network className="w-4 h-4" /> Model Visualizer: view evolving inner-model graphs</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Compass className="w-5 h-5" /> Final Thought</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            TherapyMusai assumes you’ve been adapting. It listens like poetry, treats tension as signal, and offers reflection—not judgment. Healing often begins with witnessing.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TherapyMusaiInfo;
