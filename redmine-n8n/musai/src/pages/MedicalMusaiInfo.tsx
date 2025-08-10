import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { Stethoscope, HeartHandshake, ShieldQuestion, Compass, Users, ClipboardList, Network, CalendarClock, Upload, AlertTriangle, Phone, Mic, ShieldCheck, Activity, BadgeCheck, Cpu } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';

const MedicalMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_MEDICAL} />
      {/* Soothing Hero */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-600/10 via-cyan-500/5 to-transparent" />
        <div className="container mx-auto px-4 pt-14 pb-6 max-w-6xl">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
            <div className="text-left md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-cyan-700 bg-clip-text text-transparent">MedicalMusai</h1>
              <p className="text-muted-foreground text-lg">Gentle navigation for complex health journeys.</p>
              <div className="mt-4 text-sm text-muted-foreground">
                Your story matters. We listen first, organize second, and guide with care.
              </div>
                <div className="mt-5 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Privacy‑first, you‑controlled
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Therapy‑informed design
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Research you can understand
                </div>
                  <Button size="sm" className="ml-1" onClick={() => navigate(ROUTES.MEDICAL_MUSAI_DEMO)}>
                    See a 2‑minute demo
                  </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-emerald-500/15 via-cyan-400/10 to-transparent blur-2xl" />
              <div className="relative rounded-2xl border bg-card/70 backdrop-blur p-6 flex items-center justify-center">
                <img
                  src="/medical_musai_logo.svg"
                  alt="MedicalMusai calming logo: soft teal circle with a guiding compass nested in a heart"
                  className="h-28 w-28 object-contain"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                {/* Fallback subtle mark */}
                <div className="absolute right-4 bottom-3 text-xs text-muted-foreground">Your Health • Your Flight Plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">

        {/* Vision */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Stethoscope className="w-5 h-5" /> What Is MedicalMusai?</CardTitle>
            <CardDescription>A meta-copilot above the cockpit—integrates specialist depth, GP breadth, therapy context, and live research into one coherent view.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>Imagine if your health records weren’t just files in a folder, but a living, evolving map of your well‑being.</p>
            <p>MedicalMusai turns charts, specialist notes, and longitudinal tracking into a progressive learning system that works with you.</p>
            <p className="italic">You are the pilot. Doctors, therapists, and coaches are co‑pilots—experts in their lanes. MedicalMusai holds the whole flight plan.</p>

            {/* Local AI & Privacy: Expandable */}
            <Accordion type="single" collapsible className="mt-3 border rounded-md">
              <AccordionItem value="local-ai">
                <AccordionTrigger className="px-3">How AI works here (local-first, you-in-control)</AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs"><Cpu className="w-3.5 h-3.5" /> On-device/private inference where it matters most</div>
                    <div>
                      Summaries and phrasing can run locally when sensitive. Larger research pulls can be cloud-assisted, with clear consent and visible logs.
                    </div>
                    <div className="text-xs text-muted-foreground">Image prompt you can render: “Small lock icon nested in a heart, teal gradient; label: ‘Local AI available’. Minimalist.”</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="consent">
                <AccordionTrigger className="px-3">Consent and sharing (simple, reversible)</AccordionTrigger>
                <AccordionContent className="px-3">
                  <div className="space-y-2">
                    <div>Every source, recipient, and purpose is visible. You can pause or revoke at any time. Exports include a consent receipt.</div>
                    <div className="text-xs text-muted-foreground">Image prompt: “Consent receipt card: gentle violet outline, checkmarks for ‘view’, ‘compute’, ‘share’.”</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Patient-as-Pilot Framing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Patient-as-Pilot: The Framing That Changes Care</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>In the moment, it can feel like you have to just accept what’s said. This reframes it. You are always in the driver’s seat.</p>
            <ul className="list-disc ml-5 space-y-1">
              <li>Your doctor is a co‑pilot: a skilled guide, not the owner of your path.</li>
              <li>Medication is a tool: like any tool, it serves your goals and context.</li>
              <li>Every claim has a confirmation path: we show options and trade‑offs.</li>
            </ul>
            <div className="mt-2 text-xs text-muted-foreground">Image prompt: “Pilot’s view over a calm horizon, soft teal HUD with labels: ‘Co‑pilot’, ‘Tools’, ‘Next steps’.”</div>
          </CardContent>
        </Card>

        {/* The Fragmentation Problem */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> The Fragmentation Problem</CardTitle>
            <CardDescription>Today, your health data is often scattered across systems.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-1">
              <li>CT/MRI results in one place</li>
              <li>X‑ray and diagnostic imaging reports in another silo</li>
              <li>Audiograms somewhere else</li>
              <li>Hospital visits in another system</li>
              <li>Vitals only in your GP’s file</li>
              <li>Therapy notes on yet another platform</li>
            </ul>
            <div className="mt-3">MedicalMusai brings it together over time so your health story stays clear.</div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CalendarClock className="w-5 h-5" /> Unified Health Timeline</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Tracks imaging, labs, vitals, and encounters as a living timeline—not isolated events.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" /> Patient‑Driven Data</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Import from partners automatically or upload/scan yourself. Either way, you stay in control.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Virtual Visits with AI Doctors</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Discuss symptoms, explore plausible explanations, and outline next steps to confirm or rule out conditions.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldQuestion className="w-5 h-5" /> Challenge & Confirm</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Understand the science behind advice, learn traditional paths to increase certainty, and plan better conversations with your doctor.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Doctor Communication Profiles</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Different doctors have different styles—practice communicating so you feel understood.</CardContent>
          </Card>
        </div>

        {/* The Psychology of Better Care */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Human Factors in Care</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Power dynamics, authority bias, and time pressure make appointments hard. Communication styles differ too.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><HeartHandshake className="w-5 h-5" /> TherapyMusai Connection</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Understand likely biases, prepare what you want to say, and practice so you feel confident, clear, and heard.
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.THERAPY_MUSAI)}>Learn about TherapyMusai</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communication & Accountability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Communication & Accountability</CardTitle>
            <CardDescription>Clarity in every interaction—without sacrificing privacy.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground grid md:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 font-medium mb-1"><Phone className="w-4 h-4" /> Multi‑Channel Contact</div>
              <div>Track phone calls, emails, and voice chats associated with visits so context isn’t lost between appointments.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 font-medium mb-1"><Mic className="w-4 h-4" /> Transcription‑Only Companion</div>
              <div>Optional device that does not store audio—only generates on‑device transcripts you control. Privacy first; no raw recordings.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 font-medium mb-1"><Activity className="w-4 h-4" /> Interaction Pattern Analysis</div>
              <div>Finds patterns in how you and your providers interact—missed follow‑ups, rushed endings, or unanswered questions—so habits can improve.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-2 font-medium mb-1"><ShieldCheck className="w-4 h-4" /> Accountability Safeguards</div>
              <div>Transparent summaries make service quality visible. Helps clinicians uphold high standards—especially where it matters most: your health.</div>
            </div>
            <div className="p-3 rounded-lg border bg-card md:col-span-2">
              <div className="flex items-center gap-2 font-medium mb-1"><HeartHandshake className="w-4 h-4" /> Therapy‑Informed Support</div>
              <div>Uses TherapyMusai to surface power‑dynamic risks (e.g., subtle pressure to end a visit) and to coach calm, assertive communication—increasing the chance you’re fully heard.</div>
              <div className="mt-3">
                <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.THERAPY_MUSAI)}>Open TherapyMusai Info</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Before / During / After Visit (Expandable Playbook) */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Visit Playbook</CardTitle>
            <CardDescription>Short guides to stay in the driver’s seat at every step.</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="border rounded-md">
              <AccordionItem value="before">
                <AccordionTrigger className="px-3">Before the visit</AccordionTrigger>
                <AccordionContent className="px-3 text-sm text-muted-foreground">
                  Set your goals, draft a 90‑second brief, and choose 2–3 confirm steps you want discussed. Practice phrasing matched to your doctor’s style.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="during">
                <AccordionTrigger className="px-3">During the visit</AccordionTrigger>
                <AccordionContent className="px-3 text-sm text-muted-foreground">
                  Keep cue cards handy; capture decisions and instructions. If dismissed, use de‑escalation phrasing and ask for confirm‑steps.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="after">
                <AccordionTrigger className="px-3">After the visit</AccordionTrigger>
                <AccordionContent className="px-3 text-sm text-muted-foreground">
                  See your CarePlan and follow‑ups; the insight engine watches for incoming labs/imaging and updates certainty along the way.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Why This Matters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Why This Matters</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <ul className="list-disc ml-5 space-y-1">
              <li>Specialists see parts of the picture—but not always how they connect.</li>
              <li>GPs see the big picture—but may miss fine details between visits.</li>
              <li>You see the whole story—MedicalMusai helps you understand it, question it, and act on it.</li>
            </ul>
            <div className="mt-3 text-xs text-muted-foreground">Image prompt: “Two nested compasses forming a heart; labels: ‘Specialist focus’, ‘GP breadth’, outer ring ‘You • Whole flight plan’.”</div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Network className="w-5 h-5" /> Perspective Layering</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Holds multiple clinical perspectives simultaneously and highlights agreement, uncertainty, and contradiction.</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Assumption Ledger</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Maintains explicit assumptions, evidence levels, and pending differentials; prompts for missing context.</CardContent>
          </Card>
        </div>

        {/* Closing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Compass className="w-5 h-5" /> Final Thought</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Because your health is your flight. Everyone else is a guide—you remain the pilot.
          </CardContent>
        </Card>

        {/* Gentle footer illustration placeholder */}
        <div className="mt-10 rounded-2xl border bg-card p-5">
          <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-6 items-center">
            <div className="relative">
              <img
                src="/medical_musai_flow.svg"
                alt="Diagram: unified timeline connecting imaging, labs, vitals, encounters, and conversations"
                className="w-full h-auto"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="text-base font-medium mb-2">A calming map that grows with you</div>
              <p>
                One place to see what happened, what it means, and what comes next—expressed in language that reduces worry and increases clarity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalMusaiInfo;


