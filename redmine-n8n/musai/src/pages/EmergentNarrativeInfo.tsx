import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Theater, Sparkles, Layers, Compass, Brain, Mic, Image as ImageIcon, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';

const EmergentNarrativeInfo: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_NARRATIVE} />
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Emergent Narrative (MusaiTale)</h1>
          <p className="text-muted-foreground text-lg">Where story writes itself—through interaction, reflection, and perspective.</p>
          {/* Quick access now lives in the header */}
        </div>

        {/* What Is */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Theater className="w-5 h-5" /> What Is Emergent Narrative?</CardTitle>
            <CardDescription>Story as a mirror, not a script—reactive, contextual, and alive.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Emergent Narrative is a storytelling framework within Musai that weaves intelligent, interactive, and emotionally reactive narratives from user data, agent behavior, and contextual feedback. Rather than rigid branches, MusaiTale adapts in real time—based on your choices, tone, and evolving inner model.</p>
            <p>It doesn’t just unfold. It emerges.</p>
          </CardContent>
        </Card>

        {/* Core Mechanics */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> Character-Driven AI Agents</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Each character runs a perspective model with memories, emotional states, and evolving cognitive biases.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Contextual Memory</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Past choices echo forward. Threads remember—and reframe—what came before.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Symbolic Mapping</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Scenes mirror inner states and abstractions—dream logic grounded in psychological structure.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5" /> Voice & Visual Output</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Narrate via TTS, render displays, or generate symbolic images for reflection.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5" /> Parallel Realities</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Multiple versions can coexist—layered interpretations for recursive insight.</CardContent>
          </Card>
        </div>

        {/* Memory Architecture */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Bounded Memory Architecture</CardTitle>
            <CardDescription>Characters know what they lived; they do not know what others privately thought.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              MusaiTale treats memory as a psychological constraint that fuels emergence. Each agent/character carries
              an episodic record of scenes they participated in and public narration. Private thought streams remain
              inaccessible to others by design.
            </p>
            <ul className="list-disc ml-5 space-y-1">
              <li><span className="font-medium">Agent memory scope</span>: sees shared dialogue and events; never other agents’ inner monologues.</li>
              <li><span className="font-medium">Episode-bound recall</span>: characters only remember interactions they had; new pairings yield new dynamics.</li>
              <li><span className="font-medium">Unknowns-as-signal</span>: ignorance is first-class—gaps create dramatic irony and drive narrative change.</li>
              <li><span className="font-medium">Context composer</span>: generation calls receive a per-agent slice (conversation window + that agent’s memories) to enforce boundaries.</li>
              <li><span className="font-medium">Persistence policy</span>: episodic memories persist per character per scene; private-thought streams remain ephemeral.</li>
            </ul>
            <p>
              Practically, this boundary is enforced where context is composed—so tools like n8n receive only the
              minimal, agent-scoped context needed for a given turn.
            </p>
          </CardContent>
        </Card>

        {/* Why It Matters */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Compass className="w-5 h-5" /> Why It Matters</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-2">
              <li>Simulate past events through symbolic reframing</li>
              <li>Visualize internal conflicts as characters or factions</li>
              <li>Build safe alternate realities for practice and healing</li>
              <li>Generate cohesive narratives for creative work</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmergentNarrativeInfo;
