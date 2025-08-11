import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { Stethoscope, HeartHandshake, ShieldQuestion, Compass, Users, ClipboardList, Network, CalendarClock, Upload, AlertTriangle, Phone, Mic, ShieldCheck, Activity, BadgeCheck, Cpu, MessageCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import medicalHero from '@/assets/images/medicalmusai_hero.png';
import forkedPathDiagram from '@/assets/images/medical_musai_Forked path diagram.png';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';
import yokeHands from '@/assets/images/medical musai_yolk.png';
import medicalTherapy from '@/assets/images/medicalmusai_medicaltherapy.png';
import cityMap from '@/assets/images/medical_citymap.png';
// Glyphs / placeholders artwork
import notepadTimeline from '@/assets/images/medicalmusai_notepadetimeline.png';
import compassClarity from '@/assets/images/medicalmusai_compass clarity.png';
import runwayChecklist from '@/assets/images/medicalmusai_runawaychecklist.png';
import threeColumns from '@/assets/images/medical musai_ three columns clarity configence connection.png';
import polaroidCards from '@/assets/images/medical musai_Three polaroid‑style cards with captio.png';
import runwayLights from '@/assets/images/medical musai _ runway.png';

const MedicalMusaiInfo: React.FC = () =>
{
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_MEDICAL} />

      {/* 1) Hero — You Are the Pilot */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-600/10 via-cyan-500/5 to-transparent" />
        <div className="container mx-auto px-4 pt-14 pb-6 max-w-6xl">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                You’re the pilot. Your doctor’s the co‑pilot.
              </h1>
              <p className="text-muted-foreground text-lg">
                MedicalMusai helps you understand diagnoses, challenge assumptions, and choose next steps—with a clear plan and the right support.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => navigate(ROUTES.MEDICAL_MUSAI_DEMO)}>Start Your Pre‑Flight</Button>
                <Button variant="outline" onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>See How It Works</Button>
                <Button variant="outline" onClick={() => {
                  const el = document.getElementById('doctor-modeling');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}>Doctor Modeling</Button>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Privacy‑first
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Therapy‑informed
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" /> Research‑grounded
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-gradient-to-tr from-emerald-500/15 via-cyan-400/10 to-transparent blur-2xl" />
              <div className="relative rounded-2xl border bg-card/70 backdrop-blur overflow-hidden">
                <img src={medicalHero} alt="MedicalMusai hero" className="block w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* 2) How it Works — Record → Understand → Act */}
        <section id="how-it-works" className="mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Record',
                desc: 'Bring notes, discharge summaries, lab results, even rough memories. MedicalMusai organizes them into a clean timeline and evidence cards you can trust.',
                img: notepadTimeline,
                alt: 'Notepad turning into timeline',
              },
              {
                title: 'Understand',
                desc: 'We translate jargon into plain language, highlight watch‑outs, show typical vs. atypical, and map possible differentials.',
                img: compassClarity,
                alt: 'Compass revealing clarity highlights',
              },
              {
                title: 'Act',
                desc: 'Generate doctor‑ready questions, next‑visit checklists, and referrals/resources. Export a one‑page Co‑Pilot Brief for your appointment.',
                img: runwayChecklist,
                alt: 'Runway leading to a checklist',
              },
            ].map((s) => (
              <Card key={s.title}>
                <CardHeader>
                  <CardTitle>{s.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>{s.desc}</p>
                  <div className="mt-3 rounded-md border bg-card overflow-hidden">
                    <img src={s.img} alt={s.alt} className="block w-full h-auto" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.THERAPY_MUSAI)}>Open TherapyMusai</Button>
            <Button variant="outline" size="sm" onClick={() => {
              const el = document.getElementById('community');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}>Find Community Resources</Button>
          </div>
        </section>

        {/* 4.5) Doctor Modeling — Speak Your Doctor’s Language */}
        <section id="doctor-modeling" className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Doctor Modeling — translate intent into results</CardTitle>
                <CardDescription>Optional, private profiling of your clinician’s communication style</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Learns from signals you provide: short voice memos after visits, decisions made, portal messages, and follow‑up notes.</div>
                <div>• Builds a light “style map” of preferences: phrasing, level of detail, when to lead with risk vs. benefit, and what gets traction.</div>
                <div>• Generates SBAR‑style briefs tuned to your GP: one clear ask first, supportive context second — not time‑window assertions.</div>
                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs"><Mic className="w-3.5 h-3.5" /> Voice notes</span>
                  <span className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs"><ClipboardList className="w-3.5 h-3.5" /> Decisions</span>
                  <span className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs"><MessageCircle className="w-3.5 h-3.5" /> Portal msgs</span>
                  <span className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs"><CalendarClock className="w-3.5 h-3.5" /> Outcomes</span>
                </div>
                <div className="pt-3"><Button size="sm" variant="outline">Try SBAR Generator</Button></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Control</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Local‑first processing for voice notes and summaries when sensitive</div>
                <div>• Explicit consent when exporting a brief to share; clear audit trail</div>
                <div>• One‑click reset: delete the doctor model at any time</div>
                <div className="pt-2 inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs"><ShieldCheck className="w-3.5 h-3.5" /> Your data, your rules</div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3) What MedicalMusai Does — Clarity / Confidence / Connection */}
        <section className="mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Clarity</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Diagnosis Decoder: plain‑language summaries with related/alternative conditions</div>
                <div>• Evidence Cards: what we know / what’s uncertain / what to ask next</div>
                <div>• Risk Map: side‑effect likelihoods and red‑flag symptoms to monitor</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Confidence</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Appointment Playbooks: prioritized questions, “what to say if pressed for time”</div>
                <div>• Decision Aids: compare options by benefits/risks/burden; see likely paths</div>
                <div>• Second‑Opinion Prep: concise packet with context, labs, and why you’re seeking review</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Connection</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Care Team Sync: export a Co‑Pilot Brief (PDF) for your doctor</div>
                <div>• TherapyMusai Bridge: process fears, stick to plans, celebrate small wins</div>
                <div>• Community Navigator: local services, transportation, benefits (coming online)</div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-3 rounded-md border bg-card overflow-hidden">
            <img
              src={threeColumns}
              alt="Three columns labeled Clarity, Confidence, Connection with miniature UI snippets"
              className="block w-full h-auto"
            />
          </div>
        </section>

        {/* 4) Diagnoses & Decisions — Challenge, Kindly */}
        <section className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Diagnoses & Decisions — “Challenge, Kindly”</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Differential Lens: nearby diagnoses and what would distinguish them</div>
                <div>• What Would Change the Plan?: tests or findings that would meaningfully shift treatment</div>
                <div>• Trial Periods: how to run safe “try‑this‑then‑check” experiments with your clinician</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <img
                  src={forkedPathDiagram}
                  alt="Forked path diagram: Likely / Consider / Rule‑Out"
                  className="block w-full h-auto rounded-md border"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 5) Your Doctor as Co‑Pilot */}
        <section className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Doctor as Co‑Pilot</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Shared Language: one‑page SBAR‑style brief your clinician will love (Situation, Background, Assessment, Recommendation)</div>
                <div>• Time‑Respectful: one clear question, followed by 2–3 backups if time allows</div>
                <div>• Follow‑Through: log agreed actions; get reminders for labs, meds, and red‑flags</div>
                <div className="pt-2"><Button size="sm" variant="outline">Download sample brief</Button></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <img
                  src={yokeHands}
                  alt="Two hands on a yoke — patient lead hand, clinician support hand"
                  className="block w-full h-auto rounded-md border"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 6) TherapyMusai Pairing */}
        <section className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>TherapyMusai Pairing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>When the body needs facts, the mind needs care. TherapyMusai helps you process fear, turn goals into micro‑habits, and stick to follow‑ups.</div>
                <div>MedicalMusai ↔ TherapyMusai is a closed loop: facts shape feelings; feelings shape follow‑through.</div>
                <div className="pt-2"><Button size="sm" onClick={() => navigate(ROUTES.THERAPY_MUSAI)}>Open TherapyMusai</Button></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <img
                  src={medicalTherapy}
                  alt="Two interlocking rings labeled Medical and Therapy with arrows both ways"
                  className="block w-full h-auto rounded-md border"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 7) Community & Resources */}
        <section id="community" className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Community & Resources</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <div>• Local Supports: clinics, transportation, financial aid, caregiver respite</div>
                <div>• Coverage & Forms: PHIPA/PIPEDA basics, consent receipts, leave forms, disability supports</div>
                <div>• Peer Communities: moderated groups for your condition and region</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <img
                  src={cityMap}
                  alt="City map with warm pins for health, transit, and counseling"
                  className="block w-full h-auto rounded-md border"
                />
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 8) Privacy & Trust */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Trust</CardTitle>
              <CardDescription>On‑device posture, consent receipts, clear boundaries</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div>• You own your data. On‑device first; encrypted in transit; minimal cloud where required</div>
              <div>• Consent receipts for shared summaries; clear audit trail of what went where</div>
              <div>• No diagnosis without a clinician. We’re decision support, not a medical provider</div>
              <Accordion type="single" collapsible className="mt-3 border rounded-md">
                <AccordionItem value="local-ai">
                  <AccordionTrigger className="px-3">Local AI options (private inference)</AccordionTrigger>
                  <AccordionContent className="px-3">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs"><Cpu className="w-3.5 h-3.5" /> On‑device where it matters most</div>
                      <div>Summaries and phrasing can run locally when sensitive. Larger research pulls can be cloud‑assisted, with consent and visible logs.</div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* 9) Micro‑Scenes (Success Snapshots) */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Success Snapshots</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              {['The Five‑Minute Visit: You showed a one‑page brief; you left with a plan.', 'The “Maybe It’s Not That” Moment: You asked the differential question; got the right test.', 'The “I Can Do This” Week: TherapyMusai broke it into 10‑minute habits; you did them.'].map((t) => (
                <div key={t} className="rounded-lg border bg-card p-4">{t}</div>
              ))}
              <div className="md:col-span-3 rounded-md border bg-card overflow-hidden">
                <img
                  src={polaroidCards}
                  alt="Three polaroid‑style cards with captions"
                  className="block w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 10) FAQ */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <div><strong>Is it medical advice?</strong> No. It’s structured information and coaching to help you decide with your clinician.</div>
              <div><strong>Will my doctor accept it?</strong> Most appreciate concise, relevant context; that’s how we format it.</div>
              <div><strong>What if I’m overwhelmed?</strong> Start with the Pre‑Flight Checklist. One page. One step at a time.</div>
              <div><strong>Emergency?</strong> Call local emergency services or go to the nearest ER.</div>
            </CardContent>
          </Card>
        </section>

        {/* 11) Final CTA — Pre‑Flight Checklist */}
        <section className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Compass className="w-5 h-5" /> Ready to take back the cockpit?</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(ROUTES.MEDICAL_MUSAI_DEMO)}>Start Your Pre‑Flight</Button>
              <div className="mt-3 rounded-md border bg-card overflow-hidden">
                <img
                  src={runwayLights}
                  alt="Gentle runway lights leading into the horizon"
                  className="block w-full h-auto"
                />
              </div>
            </CardContent>
          </Card>
        </section>
        <InfoFooterNav currentRoute={ROUTES.MEDICAL_MUSAI} />
      </div>
    </div>
  );
};

export default MedicalMusaiInfo;



