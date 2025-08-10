import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Theater,
  Sparkles,
  Layers,
  Compass,
  Brain,
  Mic,
  GitBranch
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi
} from '@/components/ui/carousel';

const EmergentNarrativeInfo: React.FC = () =>
{
  const navigate = useNavigate();
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  // Auto-rotate carousel to invite a sense of living theatre
  useEffect(() =>
  {
    if (!carouselApi)
    {
      return;
    }

    const intervalId = window.setInterval(() =>
    {
      carouselApi.scrollNext();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [carouselApi]);

  const handleBeginStory = useCallback((): void =>
  {
    navigate(ROUTES.MAIN_APP, { state: { switchToTab: APP_TERMS.TAB_NARRATIVE } });
  }, [navigate]);

  const handleScrollToHow = useCallback((): void =>
  {
    const el = document.getElementById('core-features');
    if (el)
    {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_NARRATIVE} />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-blue-500/5 to-transparent" />
        <div className="container mx-auto px-4 pt-14 pb-6 max-w-6xl">
          <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-6 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                MusaiTale — Emergent Narrative
              </h1>
              <p className="text-muted-foreground text-lg">
                A Stage Where Every Choice Changes the Play. Characters carry memories, emotions, and perspectives — and the story evolves based on your interaction, tone, and growth. The narrative doesn’t just unfold. It emerges.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button size="lg" onClick={handleBeginStory}>Begin Your Story</Button>
                <Button variant="outline" size="lg" onClick={handleScrollToHow}>Learn How Emergence Works</Button>
              </div>
            </div>

            {/* Rotating hero carousel */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-indigo-500/15 via-blue-400/10 to-transparent blur-2xl" />
              <div className="relative rounded-2xl border bg-card/70 backdrop-blur p-0 overflow-hidden">
                <Carousel setApi={setCarouselApi} opts={{ loop: true }}>
                  <CarouselContent>
                    {/* Slide 1 — Theatre imagery */}
                    <CarouselItem>
                      <AspectRatio ratio={16/9}>
                        <div className="absolute inset-0">
                          <div className="h-full w-full bg-gradient-to-br from-slate-800 via-indigo-900 to-slate-800">
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.12) 0, transparent 40%)' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex items-center gap-3 text-indigo-100">
                                <Theater className="w-6 h-6" />
                                <div className="text-sm">Stage lights, curtains, silhouettes</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AspectRatio>
                    </CarouselItem>

                    {/* Slide 2 — Emergence imagery */}
                    <CarouselItem>
                      <AspectRatio ratio={16/9}>
                        <div className="absolute inset-0">
                          <div className="h-full w-full bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-950">
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'conic-gradient(from 90deg at 50% 50%, rgba(0,255,255,0.25), transparent 10%, rgba(147,197,253,0.25), transparent 20%)' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex items-center gap-3 text-cyan-100">
                                <Sparkles className="w-6 h-6" />
                                <div className="text-sm">Branching light, neural webs, form emerging</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AspectRatio>
                    </CarouselItem>

                    {/* Slide 3 — Hybrid imagery */}
                    <CarouselItem>
                      <AspectRatio ratio={16/9}>
                        <div className="absolute inset-0">
                          <div className="h-full w-full bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900">
                            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.12) 0, transparent 40%), radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.12) 0, transparent 40%)' }} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="flex items-center gap-3 text-violet-100">
                                <Layers className="w-6 h-6" />
                                <div className="text-sm">Actors casting constellations as shadows</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </AspectRatio>
                    </CarouselItem>
                  </CarouselContent>
                  <CarouselPrevious className="-left-10" />
                  <CarouselNext className="-right-10" />
                </Carousel>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* What Is Emergent Narrative */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Theater className="w-5 h-5" /> What Is Emergent Narrative?
              </CardTitle>
              <CardDescription>Story as a mirror — reactive, contextual, and alive.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                MusaiTale is a living storytelling engine in the Musai ecosystem. Instead of rigid branching paths, it adapts in real time to your choices, your tone, and your evolving inner model.
              </p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Your choices</li>
                <li>Your tone</li>
                <li>Your evolving inner model</li>
              </ul>
              <p>Every story is a mirror of you — not a pre‑written script.</p>
            </CardContent>
          </Card>
        </section>

        {/* Core Features */}
        <section id="core-features" className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> Character‑Driven AI Agents</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>Each character holds a perspective model with:</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Memories</li>
                  <li>Emotional states</li>
                  <li>Evolving cognitive biases</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Contextual Memory</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Past choices echo forward</li>
                  <li>Threads remember, reframe, and reinterpret prior scenes</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5" /> Symbolic Mapping</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Scenes reflect inner states and psychological themes</li>
                  <li>Blends dream logic with grounded structure</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Mic className="w-5 h-5" /> Voice & Visual Output</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Narration via TTS</li>
                  <li>Scene visualization with symbolic imagery</li>
                  <li>Real‑time stage‑like renderings</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5" /> Parallel Realities</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <ul className="list-disc ml-5 space-y-1">
                  <li>Multiple narrative versions can coexist</li>
                  <li>Layered interpretations for recursive insight</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bounded Memory Architecture */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Bounded Memory Architecture</CardTitle>
              <CardDescription>Characters only know what they have experienced — no omniscient narrator.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-5 space-y-1">
                <li><span className="font-medium">Agent Memory Scope</span>: characters recall shared dialogue/events only</li>
                <li><span className="font-medium">Episode‑Bound Recall</span>: memory is scene‑specific; new interactions create new dynamics</li>
                <li><span className="font-medium">Unknowns‑as‑Signal</span>: gaps in knowledge create dramatic irony</li>
                <li><span className="font-medium">Context Composer</span>: each character receives only their personal slice of the scene history</li>
                <li><span className="font-medium">Persistence Policy</span>: episodic memories persist per character; private thoughts vanish after the moment</li>
              </ul>
              <p>
                This fuels authentic emergence — characters change based on experience, not hidden author control.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Why It Matters */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Compass className="w-5 h-5" /> Why It Matters</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>Reframe past events through symbolic storytelling</li>
                <li>Visualize internal conflicts as characters or factions</li>
                <li>Practice new responses in safe alternate realities</li>
                <li>Create cohesive, evolving narratives for art, therapy, or play</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Example Experiences */}
        <section className="mb-10">
          <Card>
            <CardHeader>
              <CardTitle>Example Experiences</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <ul className="list-disc ml-5 space-y-1">
                <li>Replay a real conversation with altered tone to explore different outcomes</li>
                <li>Watch an internal conflict unfold as a staged debate between two characters</li>
                <li>Build a multi‑session narrative that mirrors your growth over weeks or months</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Final CTA */}
        <section className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" onClick={handleBeginStory}>Begin Your Story</Button>
            <Button variant="outline" size="lg" onClick={handleScrollToHow}>See Example Scenes</Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmergentNarrativeInfo;



