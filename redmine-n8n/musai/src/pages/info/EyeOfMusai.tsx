import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Sparkles, Box, Target, Brain, Shield, Upload, Image as ImageIcon, ListChecks, Cpu, Feather, Images, GitMerge, Layers, Quote, ShieldCheck, Microscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { APP_TERMS } from '@/config/constants';
import { ROUTES, RouteUtils } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import eyeHero from '@/assets/images/eyeOfMusai_hero.png';
import specimenGrid from '@/assets/images/eyeofmusai_Grid of tasteful “specimen cards” (tools, leaves, dishes) .png';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';

const EyeOfMusai: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_EYE} />
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-600/10 via-indigo-500/5 to-transparent" />
        <div className="container mx-auto px-4 pt-14 pb-6 max-w-6xl">
          <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30 mb-6">
                <Eye className="w-10 h-10 text-cyan-600" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                Eye of Musai — The Inner Vision Engine
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                From pixels to purpose. A compact, context‑aware visual engine that recognizes what things are — and what they’re for. Lightweight for edge devices, smart enough to adapt in real time.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 md:justify-start justify-center">
                <Button
                  onClick={() => navigate(RouteUtils.mainAppWithMode('eye'))}
                  className="rounded-xl"
                >
                  Open Eye
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(ROUTES.FIND_YOUR_MUSE)}
                  className="rounded-xl"
                >
                  Explore Musai Ecosystem
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-cyan-500/15 via-indigo-400/10 to-transparent blur-2xl" />
              <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
                <img src={eyeHero} alt="Eye of Musai hero" className="block w-full h-auto" />
              </div>
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
              <p>Eye of Musai blends a lightweight vision transformer with language understanding, so it can spot structural patterns and read the situation around them. It recognizes objects, relationships, and intent — and can also generate images to communicate what it sees or bootstrap new classes.</p>
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
                  <p className="text-xs text-muted-foreground">Runs on Raspberry Pi, microservers, or laptops; scales up with optional cloud assist.</p>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2 text-foreground mb-1"><ListChecks className="w-4 h-4" /> Live Learning</div>
                  <p className="text-xs text-muted-foreground">Teach new forms in minutes; adapts to your categories, traits, and language.</p>
                </div>
                <div className="p-3 rounded-lg border bg-card sm:col-span-2">
                  <div className="flex items-center gap-2 text-foreground mb-1"><ImageIcon className="w-4 h-4" /> Create on Cue</div>
                  <p className="text-xs text-muted-foreground">Generate examples, diagrams, and synthetic images to explain or extend a class.</p>
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
              <div className="mt-1">
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Use MusaiDex to load, name, and teach the forms that matter to you. Build a bird guide, organize recipes visually, map your toolkit, or label research specimens — Eye will learn to see them the way you do.</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2"><Upload className="w-4 h-4 mt-0.5" /> Capture or upload images to seed a class.</li>
                <li className="flex items-start gap-2"><ImageIcon className="w-4 h-4 mt-0.5" /> Optionally generate images to bootstrap small datasets.</li>
                <li className="flex items-start gap-2"><Feather className="w-4 h-4 mt-0.5" /> Label in your language — traits, variants, usage notes.</li>
                <li className="flex items-start gap-2"><Target className="w-4 h-4 mt-0.5" /> Validate quickly and retrain iteratively.</li>
                <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5" /> Save to Redmine memory with tags/relations so the right items resurface at the right time.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MusaiDex Designer Prompt */}
      <div className="container mx-auto px-4 -mt-6">
        <Card className="mb-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Images className="w-5 h-5" /> MusaiDex Card Prompt</CardTitle>
            <CardDescription>For design/generation teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-card overflow-hidden">
              <img
                src={specimenGrid}
                alt="Grid of tasteful specimen cards with tags and confidence bars"
                className="block w-full h-auto"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* How it works (at a glance) */}
      <div className="container mx-auto px-4 pb-12">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> How it works (at a glance)</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <div>1) See — Eye ingests an image or a live frame.</div>
            <div>2) Parse — The Logical Vision path extracts geometry, parts, and relations; the Creative Vision path tests analogies and category hypotheses.</div>
            <div>3) Fuse — Musai’s Perspective Engine reconciles both views, yielding a labeled scene with confidence and rationale chips.</div>
            <div>4) Understand — Context (neighbor objects, text, prior sessions) refines intent/purpose.</div>
            <div>5) Create — On request, Eye generates illustrative examples, diagrams, or synthetic variants.</div>
            <div>6) Remember — Results, labels, and rationale are linked into Redmine (tags = attention cues) so the right memories surface later.</div>
          </CardContent>
        </Card>

        {/* Why it matters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5 text-purple-600" /> Why it matters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="p-3 rounded-lg border bg-card">Practical & personal — Edge‑based recognition tailored to your life: your gear, your library, your lab bench.</div>
              <div className="p-3 rounded-lg border bg-card">Intuition + precision — Sees with your categories and language, then grounds them in consistent perception.</div>
              <div className="p-3 rounded-lg border bg-card">Index by essence — Not just what it looks like, but what it does and how you use it.</div>
            </div>
          </CardContent>
        </Card>

        {/* Perspective vision (bicameral twist) */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Perspective vision (the bicameral twist)</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="p-3 rounded-lg border bg-card"><Sparkles className="inline w-4 h-4 mr-2" /> Creative Vision (Top‑Down) — breadth‑first, analogy‑friendly; great for few‑shot learning and category discovery.</div>
              <div className="p-3 rounded-lg border bg-card"><Microscope className="inline w-4 h-4 mr-2" /> Logical Vision (Bottom‑Up) — depth‑first, part/geometry‑aware; strong on structure and verification.</div>
              <div className="p-3 rounded-lg border bg-card"><GitMerge className="inline w-4 h-4 mr-2" /> Fusion View — clear labels, confidence, and why it thinks so; flags disagreement for you to review.</div>
            </div>
            <div className="space-y-2">
              <div className="font-medium mb-1">On‑screen cues</div>
              <ul className="list-disc ml-5 space-y-1">
                <li>Agreement band — quick read on Creative ↔ Logical alignment</li>
                <li>Conflict cards — alternate labels with the evidence that would resolve them</li>
                <li>Source chips — link to exemplars you taught in MusaiDex</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Recognition and creation, together */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recognition and creation, together</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-3 rounded-lg border bg-card">• Recognize: classify, detect, and describe scenes.</div>
            <div className="p-3 rounded-lg border bg-card">• Explain: auto‑caption with function‑aware language.</div>
            <div className="p-3 rounded-lg border bg-card">• Generate: illustrative images/diagrams to teach or document a concept.</div>
            <div className="p-3 rounded-lg border bg-card">• Augment: synthesize edge cases (lighting, angle, wear) to harden a class.</div>
          </CardContent>
        </Card>

        {/* Generation prompt descriptor */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Quote className="w-5 h-5" /> Generation Prompt</CardTitle>
            <CardDescription>Descriptor for diagrams/examples</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            “Line‑clean technical sketch of [your class], labeled parts, gentle brass accents; minimal shading; export‑ready for docs.”
          </CardContent>
        </Card>

        {/* Privacy, control, and performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Privacy, control, and performance</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="p-3 rounded-lg border bg-card">• Local first — All recognition and most generation can run on‑device.</div>
            <div className="p-3 rounded-lg border bg-card">• Granular hybrid — When you opt in, specific steps can use cloud (e.g., heavy upscales), with redaction and token caps.</div>
            <div className="p-3 rounded-lg border bg-card">• Transparent memory — Every label and image pair can be traced in Redmine with tags and relations.</div>
          </CardContent>
        </Card>

        {/* Quick starts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick starts</CardTitle>
            <CardDescription>Cards you can drop in</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="p-3 rounded-lg border bg-card">• Inventory your tools — Detect, name, and tag drawers/gear with photos; generate diagram labels for fast onboarding.</div>
            <div className="p-3 rounded-lg border bg-card">• Field guide in a weekend — Few‑shot learn birds/leaves; auto‑caption traits; synthesize rare angles.</div>
            <div className="p-3 rounded-lg border bg-card">• Recipe by sight — Recognize ingredients/steps; generate plating diagrams.</div>
            <div className="p-3 rounded-lg border bg-card">• Research capture — Classify specimen images; attach notes; export labeled boards to lab docs.</div>
            <div className="p-3 rounded-lg border bg-card md:col-span-2">• Accessibility assist — Enrich alt‑text with purpose and affordances, not just appearance.</div>
          </CardContent>
        </Card>

        {/* Micro‑FAQ */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Micro‑FAQ</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6 text-sm text-muted-foreground">
            <div>
              <div className="font-medium mb-1">Can it run on a Pi?</div>
              <div>Yes — compact models are tuned for Raspberry Pi and small servers; heavy tasks can optionally burst to cloud.</div>
            </div>
            <div>
              <div className="font-medium mb-1">How fast is live learning?</div>
              <div>Minutes for few‑shot updates in MusaiDex; you can validate and iterate immediately.</div>
            </div>
            <div>
              <div className="font-medium mb-1">Is generation required?</div>
              <div>No — creation is optional. Use it for diagrams/examples or dataset bootstrapping when helpful.</div>
            </div>
            <div>
              <div className="font-medium mb-1">How do I get my data back out?</div>
              <div>Export classes, tags, and exemplars from Redmine; images and labels can be packaged as datasets.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto text-center">
          <Badge className="mb-4" variant="secondary">Get Started</Badge>
          <h2 className="text-2xl md:text-3xl font-semibold mb-3">Open Eye and start a MusaiDex (Coming Soon)</h2>
          <p className="text-muted-foreground mb-6">Upload an image or craft a prompt to teach your first class. Iterate quickly — Eye will adapt in minutes.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate(RouteUtils.mainAppWithMode('eye'))} className="rounded-xl">Open Eye</Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.FIND_YOUR_MUSE)} className="rounded-xl">Explore Musai Ecosystem</Button>
          </div>
        </div>
        <InfoFooterNav currentRoute={ROUTES.EYE_OF_MUSAI} />
      </div>
    </div>
  );
};

export default EyeOfMusai;



