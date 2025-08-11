import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Wand2, GitMerge, Cloud, Lock, ShieldCheck, Layers, MonitorPlay, Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { CognitiveThinkingStrip } from '@/components/code/CognitiveThinkingStrip';
import { HybridControlsPanel } from '@/components/code/HybridControlsPanel';
import codeHero from '@/assets/images/CodeMusai_hero.png';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';

const CodeMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CODE} />
      <div className="container mx-auto px-4 py-14 max-w-6xl">
        {/* Hero */}
        <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 items-center mb-12">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent">
              CodeMusai — Two Minds. One Goal. Your Perspective, Expanded.
            </h1>
            <p className="text-muted-foreground text-lg">
              A bicameral local AI with optional hybrid cloud — deeper insight, faster results, smarter decisions.
            </p>
            <div className="mt-6 flex gap-3 md:justify-start justify-center">
              <Button onClick={() => navigate(ROUTES.CODE_PLAYGROUND)}>Try CodeMusai</Button>
              <Button variant="outline" onClick={() => navigate(ROUTES.LOCAL_AI)}>Learn How It Works</Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-yellow-500/15 via-purple-400/10 to-transparent blur-2xl" />
            <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
              <img src={codeHero} alt="CodeMusai hero" className="block w-full h-auto" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground italic text-center md:text-left">
              Why dolphin and penguin? Dolphins map their world with echolocation and coordinated problem‑solving — our cue for depth‑first, precise reasoning. Penguins succeed through social coordination and adaptive navigation in changing seas — our cue for breadth‑first, generative exploration.
            </div>
          </div>
        </div>
        {/* Thinking strip demo */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Thinking Strip (demo)</CardTitle>
            <CardDescription>Logic → Creativity → Fusion → optional Cloud Assist</CardDescription>
          </CardHeader>
          <CardContent>
            <CognitiveThinkingStrip logicalState="running" creativeState="pending" fusionState="pending" cloudState="skipped" />
          </CardContent>
        </Card>

        {/* What is CodeMusai */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What Is CodeMusai?</CardTitle>
            <CardDescription>A dual-minded local system that thinks in parallel</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div className="md:col-span-2 -mt-2 mb-2 text-muted-foreground">
              CodeMusai is a dual-minded AI system running on your machine. It thinks in two complementary ways — logical and creative — and merges them into answers that are faster, deeper, and more balanced.
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Brain className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Logical Mind (Dolphin)</div>
                  <div>Precise, analytical, depth‑first reasoning — inspired by dolphins’ echolocation and tool‑use problem solving.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Wand2 className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Creative Mind (Penguin)</div>
                  <div>Associative, generative, breadth‑first exploration — inspired by penguins’ coordinated foraging and adaptive navigation.</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><GitMerge className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Musai Fusion</div>
                  <div>A synthesis that weighs trade-offs, catches blind spots, and explains why.</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Cloud className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Optional Cloud Assist</div>
                  <div>When you choose, CodeMusai can briefly consult a cloud-based “third mind” for real-time knowledge or heavy lifting — always with granular controls over what’s shared.</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Why two minds */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why Two Minds Are Better Than One</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Depth + Breadth</div>
              <div>Logic digs deep; creativity scans wide — together they cover more ground.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Bias Balancing</div>
              <div>Divergent views reduce tunnel vision.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Explained Thinking</div>
              <div>See where the minds agree, where they differ, and how the final answer was formed.</div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How CodeMusai Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium">1) Request Analysis</div>
              <div>Classifies complexity, sensitivity, and intent to choose the best thinking strategy.</div>
            </div>
            <div>
              <div className="font-medium">2) Bicameral Thinking (Local, Always)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Logical Mind → structured plans and reasoning.</li>
                <li>Creative Mind → analogies, alternatives, edge cases.</li>
                <li>Musai Fusion → reconciles both into a single, actionable answer.</li>
              </ul>
            </div>
            <div>
              <div className="font-medium">3) Smart Routing (Your Choice)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Local Only — private, instant, default.</li>
                <li>Hybrid (Opt‑In) — send specific subtasks to cloud for research, summarization, or long‑form work.</li>
              </ul>
            </div>
            <div>
              <div className="font-medium">4) Memory Integration via Redmine</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Stores past decisions, reasoning, and preferences.</li>
                <li>Tags memories for quick retrieval — like a custom attention system for AI.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Core Architecture */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Core Architecture</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Local AI First (Bicameral)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Runs entirely on your hardware for privacy.</li>
                <li>Two minds in parallel = faster, richer insights.</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Smart Hybrid (Optional)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Per‑task controls: redact, summarize before upload, limit tokens.</li>
                <li>Domain allowlists and complete transparency on what’s shared.</li>
                <li>Cloud consulted only when it adds value you approve.</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Cloud Enhancement (When Allowed)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Latest large models, real‑time knowledge</li>
                <li>Heavy compute for long docs or generation</li>
                <li>100% user‑controlled usage</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Redmine Memory System */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Redmine Memory System</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Long‑term memory</div>
              <div>Past decisions, styles, constraints</div>
            </div>
            <div>
              <div className="font-medium mb-1">Working memory</div>
              <div>Current project state, artifacts, and links</div>
            </div>
            <div>
              <div className="font-medium mb-1">Continuity</div>
              <div>Both minds learn your voice and preferences</div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy First */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Privacy First, Perspective Always</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div className="flex items-start gap-2"><Lock className="w-4 h-4 mt-0.5" /> <span>Local by default; hybrid is opt‑in and scoped</span></div>
            <div className="flex items-start gap-2"><Layers className="w-4 h-4 mt-0.5" /> <span>Local speed, cloud only when beneficial</span></div>
            <div className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5" /> <span>Each interaction improves future fusion</span></div>
          </CardContent>
        </Card>

        {/* Why you'll feel the difference */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Why You’ll Feel the Difference</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <div>CodeMusai doesn’t just give you answers — it shows the synthesis:</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Where Logic and Creativity agreed.</li>
              <li>Where they challenged each other.</li>
              <li>The rationale that emerged.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Hybrid controls demo (read-only) */}
        <div className="mb-10">
          <HybridControlsPanel enabled={false} readOnly />
        </div>

        {/* Playground prompt for designers */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MonitorPlay className="w-5 h-5" /> Playground at a Glance</CardTitle>
            <CardDescription>Split‑view: code left, AI chat right, output docked below.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Image prompt: “Clean split‑view of an editor (dark theme) with code left, chat right, and a console/output pane. Minimal chrome; subtle glow.”
          </CardContent>
        </Card>

        {/* CTA */}
        <InfoFooterNav currentRoute={ROUTES.CODE_MUSAI_INFO} />
      </div>
    </div>
  );
};

export default CodeMusaiInfo;



