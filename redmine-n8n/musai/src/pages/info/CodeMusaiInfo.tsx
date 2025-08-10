import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Wand2, GitMerge, Cloud, Lock, ShieldCheck, Layers, MonitorPlay } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { CognitiveThinkingStrip } from '@/components/code/CognitiveThinkingStrip';
import { HybridControlsPanel } from '@/components/code/HybridControlsPanel';

const CodeMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CODE} />
      <div className="container mx-auto px-4 py-14 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-yellow-500 to-purple-600 bg-clip-text text-transparent">
            CodeMusai — Two Minds. One Goal. Your Perspective, Expanded.
          </h1>
          <p className="text-muted-foreground text-lg">
            A bicameral local AI with optional hybrid cloud — deeper insight, faster results, smarter decisions.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={() => navigate(ROUTES.CODE_PLAYGROUND)}>Try CodeMusai</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.LOCAL_AI)}>Learn How It Works</Button>
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
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Brain className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Logical Mind (Dolphin)</div>
                  <div>Precise, analytical, depth-first reasoning</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Wand2 className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Creative Mind (Penguin)</div>
                  <div>Associative, generative, breadth-first exploration</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><GitMerge className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Musai Fusion</div>
                  <div>A synthesis that catches blind spots, weighs trade-offs, and explains why</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5"><Cloud className="w-4 h-4" /></div>
                <div>
                  <div className="font-medium">Optional Hybrid</div>
                  <div>When you allow it, a Cloud Mind is consulted for real-time knowledge or heavy lifting — always with granular controls over what’s shared</div>
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
              <div>Logic digs; creativity scans. Together they cover more ground, faster.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Bias Balancing</div>
              <div>Divergent views reduce tunnel vision and overfitting to a single style.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Explained Answers</div>
              <div>See agreement, disagreements, and how the final answer emerges.</div>
            </div>
          </CardContent>
        </Card>

        {/* How it works */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>How the Dual‑Mind System Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium">1) Request Analysis (Local)</div>
              <div>Classifies complexity, sensitivity, and intent. Chooses a thinking strategy.</div>
            </div>
            <div>
              <div className="font-medium">2) Bicameral Thinking (Local, Always)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Logical Mind builds structured steps, proofs, or plans.</li>
                <li>Creative Mind surfaces analogies, alternatives, and edge cases.</li>
                <li>Musai Fusion reconciles both into a single, actionable answer.</li>
              </ul>
            </div>
            <div>
              <div className="font-medium">3) Smart Routing (n8n, Your Call)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Local Only — default for privacy/speed.</li>
                <li>Hybrid (Opt‑In) — route specific sub‑tasks to the Cloud Mind (e.g., “fetch current standards,” “summarize a long PDF”).</li>
                <li>You choose what goes up, how much, and when.</li>
              </ul>
            </div>
            <div>
              <div className="font-medium">4) Memory Integration (Redmine)</div>
              <div>Stores outcomes, preferences, rationales, and artifacts — so future answers are faster, clearer, and more you.</div>
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
                <li>Two complementary minds run on your machine</li>
                <li>Low latency, private by default</li>
                <li>Tuned for your hardware</li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-1">Smart Hybrid (Optional)</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Per‑task, granular send rules (redact, summarize, or block)</li>
                <li>Cloud consulted only when it adds value you approve</li>
                <li>Full audit trail of what was shared and why</li>
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
            <div>CodeMusai doesn’t just answer — it shows the synthesis:</div>
            <ul className="list-disc ml-5 space-y-1">
              <li>Where Logic and Creativity agreed</li>
              <li>Where they challenged each other</li>
              <li>The final fused rationale and next best step</li>
            </ul>
          </CardContent>
        </Card>

        {/* Hybrid controls demo */}
        <div className="mb-10">
          <HybridControlsPanel enabled={false} />
        </div>

        {/* Hero image prompt for designers */}
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
        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate(ROUTES.CODE_PLAYGROUND)}>Try CodeMusai Now</Button>
          <Button variant="outline" onClick={() => navigate(ROUTES.MAIN_APP)}>Explore the Musai Ecosystem</Button>
        </div>
      </div>
    </div>
  );
};

export default CodeMusaiInfo;



