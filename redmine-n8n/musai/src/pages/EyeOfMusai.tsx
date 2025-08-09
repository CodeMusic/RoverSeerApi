import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles, Box, Target, Brain, Shield, Upload, Image as ImageIcon, ListChecks, Cpu, Feather } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';

const EyeOfMusai: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_EYE} />
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30 mb-6">
              <Eye className="w-10 h-10 text-cyan-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
              Eye of Musai — The Inner Vision Engine
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              A compact, context-aware visual parser that sees not just what things look like—but what they mean. Lightweight enough for edge devices, smart enough to adapt in real-time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate(ROUTES.FIND_YOUR_MUSE)}
                className="rounded-xl"
              >
                Explore Musai Ecosystem
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* What it is / Key Features */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-cyan-600" /> What it is</CardTitle>
              <CardDescription>
                A visual engine that understands form and context—not just pixels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Eye of Musai blends a lightweight vision transformer with language understanding. It recognizes structural patterns and the subtle relationships that define meaning and purpose.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-foreground mb-1"><Target className="w-4 h-4" /> Form-Aware Perception</div>
                  <p className="text-xs text-muted-foreground">Detects patterns, structure, and relationships beyond appearance.</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-foreground mb-1"><Brain className="w-4 h-4" /> Contextual Insight</div>
                  <p className="text-xs text-muted-foreground">Reads purpose through situational cues; enriches with metadata.</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-foreground mb-1"><Cpu className="w-4 h-4" /> Compact & Energized</div>
                  <p className="text-xs text-muted-foreground">Runs on Raspberry Pi, microcontrollers, or home servers.</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-foreground mb-1"><ListChecks className="w-4 h-4" /> Live Learning</div>
                  <p className="text-xs text-muted-foreground">Teach new forms in minutes; adapts to your world on the fly.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Box className="w-5 h-5 text-indigo-600" /> MusaiDex — Your Personalized Reality Index</CardTitle>
              <CardDescription>
                The front-end where vision becomes personal and practical.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>MusaiDex lets you load, name, and teach the forms that matter to you. Build a bird field guide, organize recipes visually, or map your toolkit with meaning—Eye of Musai will learn to see it like you do.</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2"><Upload className="w-4 h-4 mt-0.5" /> Capture or upload images to seed a class.</li>
                <li className="flex items-start gap-2"><ImageIcon className="w-4 h-4 mt-0.5" /> Optionally generate images from prompts to bootstrap datasets.</li>
                <li className="flex items-start gap-2"><Feather className="w-4 h-4 mt-0.5" /> Label with your language—add traits, variants, or usage notes.</li>
                <li className="flex items-start gap-2"><Target className="w-4 h-4 mt-0.5" /> Validate quickly and retrain iteratively.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Why it matters */}
      <div className="container mx-auto px-4 pb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-purple-600" /> Why it matters</CardTitle>
            <CardDescription>Bridging perceptual intuition with machine accuracy.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium mb-1">Practical & Personal</div>
                <p>Makes edge-based recognition useful for real life—your gear, your doc library, your world.</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium mb-1">Intuition + Precision</div>
                <p>Sees with your categories and language, then grounds it with consistent machine perception.</p>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="font-medium mb-1">Index by Essence</div>
                <p>Redefines how we index: not just by sight, but by function, story, and meaning.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">Get Started</Badge>
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">Open Eye and start a MusaiDex</h2>
          <p className="text-muted-foreground mb-6">Upload an image or craft a prompt to teach your first class. Iterate quickly—Eye will adapt in minutes.</p>
          
        </div>
      </div>
    </div>
  );
};

export default EyeOfMusai;
