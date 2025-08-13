import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';
import { ArrowDownCircle, ArrowRight, Brain, Cpu, Link as LinkIcon, BookOpen, Sparkles } from 'lucide-react';

const SectionAnchor: React.FC<{ id: string }> = ({ id }) => (
  <span id={id} className="block -mt-24 pt-24" />
);

const Hero: React.FC<{ onExplore: () => void; onRead: () => void }> = ({ onExplore, onRead }) => (
  <div className="grid md:grid-cols-2 gap-8 items-center">
    <div className="space-y-3">
      <h1 className="text-3xl md:text-5xl font-bold leading-tight">The Contextual Feedback Model (CFM)</h1>
      <p className="text-lg text-muted-foreground">A clear, visual way to understand how humans and AI turn input into insight.</p>
      <p className="text-base text-muted-foreground">Content meets context in a continuous loop — shaping meaning, emotion, and growth.</p>
      <div className="flex gap-3 pt-2">
        <Button onClick={onExplore} size="lg" className="gap-2"><ArrowDownCircle className="w-4 h-4" /> Explore the Model</Button>
        <Button onClick={onRead} variant="outline" size="lg" className="gap-2"><BookOpen className="w-4 h-4" /> Read the Full Deep‑Dive</Button>
      </div>
    </div>
    <div className="relative w-full h-56 md:h-72 rounded-xl overflow-hidden border bg-gradient-to-r from-orange-400/20 via-amber-300/10 to-sky-400/20">
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="h-full w-full bg-gradient-to-br from-orange-500/10 to-amber-500/0" />
        <div className="h-full w-full bg-gradient-to-tl from-sky-500/10 to-cyan-500/0" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-md bg-orange-500/20 border text-orange-900 dark:text-orange-200">Content</div>
          <ArrowRight className="w-6 h-6 opacity-70" />
          <div className="px-3 py-1 rounded-md bg-sky-500/20 border text-sky-900 dark:text-sky-200">Context</div>
          <ArrowRight className="w-6 h-6 opacity-70" />
          <div className="px-3 py-1 rounded-md bg-violet-500/20 border text-violet-900 dark:text-violet-200">Feedback</div>
        </div>
      </div>
    </div>
  </div>
);

const CFMInfo: React.FC = () =>
{
  const coreRef = useRef<HTMLDivElement | null>(null);

  const scrollToCore = () => coreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const openBlog = () => window.open('https://blog.codemusic.ca/2025/07/24/the-contextual-feedback-model-cfm-july-2025-edition', '_blank', 'noopener,noreferrer');

  return (
    <div className="min-h-screen">
      <AttentionalGatewayHeader />
      <div className="container mx-auto px-4 py-10 space-y-12">
        {/* Hero */}
        <Hero onExplore={scrollToCore} onRead={openBlog} />

        {/* Section 1 — The Core Idea */}
        <SectionAnchor id="core" />
        <div ref={coreRef} className="space-y-3">
          <h2 className="text-2xl font-bold">The Core Idea</h2>
          <p className="text-muted-foreground">The CFM is a universal pattern for how minds — human or artificial — process information.</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[{
              title: 'Content',
              body: 'New input (sensations, thoughts, data).',
            },{
              title: 'Context',
              body: 'Existing state (memories, emotions, learned models).',
            },{
              title: 'Feedback',
              body: 'The loop where each reshapes the other.',
            }].map(({title, body}) => (
              <Card key={title}>
                <CardContent className="pt-4">
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-muted-foreground">{body}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="rounded-lg border p-4 bg-card">
            <div className="text-sm text-muted-foreground">Content → Context → Feedback → back to Content. Same pattern in humans and AI.</div>
          </div>
        </div>

        {/* Section 2 — The Loop in Action */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">The Loop in Action</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2"><Brain className="w-4 h-4" /><span className="font-semibold">Human</span></div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Content: A friend frowns.</li>
                  <li>Context: Stress from work.</li>
                  <li>Feedback: You interpret it as anger.</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2"><Cpu className="w-4 h-4" /><span className="font-semibold">AI</span></div>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Content: User types a question.</li>
                  <li>Context: Stored chat history.</li>
                  <li>Feedback: AI adjusts reply based on prior context.</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section 3 — Why It Matters */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Why It Matters</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>In People: Explains why perception changes with mood, memory, and beliefs.</li>
            <li>In AI: Serves as a design blueprint for adaptive, emotionally‑aware systems.</li>
          </ul>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary" className="gap-1"><Brain className="w-3 h-3" /> human</Badge>
            <Badge variant="secondary" className="gap-1"><Cpu className="w-3 h-3" /> ai</Badge>
            <Badge variant="secondary" className="gap-1"><Sparkles className="w-3 h-3" /> shared loop</Badge>
          </div>
        </div>

        {/* Section 4 — The Color Analogy */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">The Color Analogy</h2>
          <blockquote className="rounded-lg border p-4 bg-card text-lg">Emotions are to thought what color is to light.</blockquote>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="rounded-lg border p-4 bg-card">Just as color compresses invisible wavelengths into something instantly seen, emotions compress layers of context into intuitive signals.</div>
            <div className="rounded-lg border p-4 bg-card">Spectrum → color and data/context layers → emotion can be visualized as parallel compressions that guide rapid interpretation.</div>
          </div>
        </div>

        {/* Section 5 — Applications */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Applications</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              ['Education','Adaptive learning based on progress + mood.'],
              ['Mental Health','AI tracks & responds to emotional patterns.'],
              ['Ethical AI','Evolves with cultural and moral context.'],
            ].map(([title, desc]) => (
              <Card key={title}>
                <CardContent className="pt-4">
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Section 6 — Read More */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">Read More</h2>
          <p className="text-muted-foreground">Want the deep dive with thought experiments, psychological parallels, and AI design applications?</p>
          <div>
            <Button onClick={openBlog} className="gap-2"><LinkIcon className="w-4 h-4" /> Read the Full July 2025 CFM Article</Button>
          </div>
        </div>

        <div className="pt-6">
          <InfoFooterNav currentRoute={ROUTES.CFM_INFO} />
        </div>
      </div>
    </div>
  );
};

export default CFMInfo;


