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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MedicalFormModal from '@/components/medical/MedicalFormModal';
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

  // Shared SBAR sample data (used by generator preview and download)
  const sbarPatientMeta = {
    Patient: 'Jane Doe',
    DOB: '1988‑04‑02',
    MRN: 'A19‑4472',
    Date: '2025‑08‑11',
    'Visit Type': 'Follow‑up',
    Allergies: 'NKDA',
  } as const;

  const sbarSectionsHtml: { title: string; html: string }[] = [
    {
      title: 'S — Situation',
      html: 'Persistent chest tightness 2–3×/week, worsened by stairs; one near‑syncope last week.'
    },
    {
      title: 'B — Background',
      html: `
        <ul>
          <li>Hx: mild asthma (childhood), borderline hypertension; parent with CAD in 50s</li>
          <li>Meds: amlodipine 5mg QD; albuterol PRN (rarely used)</li>
          <li>Recent: viral URI 4 weeks ago; symptoms started after</li>
        </ul>
      `
    },
    {
      title: 'A — Assessment',
      html: `
        <ul>
          <li>Likely deconditioning vs. reactive airway; rule‑out cardiac contributors given family hx</li>
          <li>Red flags: near‑syncope (single episode), exertional component</li>
        </ul>
      `
    },
    {
      title: 'R — Recommendation',
      html: `
        <ol>
          <li>Baseline workup: vitals, ECG; consider troponin if indicated by ECG/symptoms</li>
          <li>PFTs or peak‑flow to evaluate airway; trial of ICS/LABA if reactive pattern</li>
          <li>Lifestyle: graded activity plan; BP log 2×/day for 2 weeks</li>
          <li>Safety: when to seek urgent care (worsening chest pain, syncope, dyspnea at rest)</li>
        </ol>
      `
    },
  ];

  const sbarVariantsHtml: Array<{ patientMeta: Record<string, string>; sections: { title: string; html: string }[] }> = [
    { patientMeta: { ...sbarPatientMeta }, sections: sbarSectionsHtml },
    {
      patientMeta: { Patient: 'John Patel', DOB: '1976‑09‑12', MRN: 'K22‑1180', Date: '2025‑08‑11', 'Visit Type': 'Initial', Allergies: 'Penicillin' },
      sections: [
        { title: 'S — Situation', html: '3 months of morning cough with occasional wheeze; worse with cold air.' },
        { title: 'B — Background', html: '<ul><li>Hx: seasonal allergies; smoker 10 pack‑years, quit 2015</li><li>Meds: cetirizine PRN</li><li>Recent: mild URI 2 months ago</li></ul>' },
        { title: 'A — Assessment', html: '<ul><li>Likely post‑infectious airway hyperreactivity vs. cough‑variant asthma</li><li>No red flags reported</li></ul>' },
        { title: 'R — Recommendation', html: '<ol><li>Trial low‑dose ICS for 4 weeks</li><li>Peak‑flow diary AM/PM</li><li>Return if hemoptysis, weight loss, or fever</li></ol>' },
      ]
    },
    {
      patientMeta: { Patient: 'Maria Rossi', DOB: '1991‑02‑07', MRN: 'R33‑5521', Date: '2025‑08‑11', 'Visit Type': 'Follow‑up', Allergies: 'NKDA' },
      sections: [
        { title: 'S — Situation', html: 'Episodic palpitations with lightheadedness after coffee; no syncope.' },
        { title: 'B — Background', html: '<ul><li>Hx: anemia (resolved)</li><li>Meds: none</li><li>Family: no premature cardiac disease</li></ul>' },
        { title: 'A — Assessment', html: '<ul><li>Likely benign supraventricular ectopy; low suspicion for structural disease</li></ul>' },
        { title: 'R — Recommendation', html: '<ol><li>Limit caffeine; hydration</li><li>12‑lead ECG; consider Holter if persists</li><li>Return if chest pain or syncope</li></ol>' },
      ]
    },
    {
      patientMeta: { Patient: 'Devin Lee', DOB: '1983‑11‑30', MRN: 'L08‑9034', Date: '2025‑08‑11', 'Visit Type': 'Urgent', Allergies: 'NSAIDs' },
      sections: [
        { title: 'S — Situation', html: 'Acute low back pain after lifting; no bowel/bladder symptoms.' },
        { title: 'B — Background', html: '<ul><li>Hx: none significant</li><li>Meds: ibuprofen allergy (hives)</li><li>Occupation: warehouse</li></ul>' },
        { title: 'A — Assessment', html: '<ul><li>Likely mechanical strain without red flags</li></ul>' },
        { title: 'R — Recommendation', html: '<ol><li>Acetaminophen scheduled × 3 days</li><li>Heat + gentle mobility</li><li>Return if weakness, numbness, or incontinence</li></ol>' },
      ]
    }
  ];

  const openPrintableMedicalForm = (
    formTitle: string,
    patientMeta: Record<string, string>,
    sections: { title: string; html: string }[]
  ): void =>
  {
    const printWindow = window.open('', '_blank', 'width=860,height=1100');
    if (!printWindow)
    {
      return;
    }
    const sectionsHtml = sections.map(s => `
      <div class="section">
        <div class="section-title">${s.title}</div>
        <div class="section-content">${s.html}</div>
      </div>
    `).join('');

    const metaHtml = Object.entries(patientMeta).map(([k, v]) => `
      <div class="cell"><div class="label">${k}</div><div class="value">${v}</div></div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${formTitle}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Inter, sans-serif; padding: 24px; color: #111; }
            .band { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; font-size: 12px; }
            .cell { display: flex; border: 1px solid #ddd; }
            .label { background: #f5f5f5; width: 120px; padding: 6px; font-weight: 600; }
            .value { padding: 6px; flex: 1; }
            .section { border: 1px solid #ddd; margin-top: 12px; }
            .section-title { background: #f7f7f7; padding: 8px 10px; font-weight: 600; font-size: 14px; border-bottom: 1px solid #ddd; }
            .section-content { padding: 10px 12px; font-size: 13px; }
            ul { margin: 6px 0 0 18px; }
            ol { margin: 6px 0 0 18px; }
            @media print { body { padding: 12mm; } }
          </style>
        </head>
        <body>
          <div class="band">
            <div>
              <div style="font-weight:700;">MedicalMusai</div>
              <div style="font-size:12px;color:#666">Patient‑as‑Pilot — For clinical review</div>
            </div>
            <div style="font-size:12px;color:#666">${new Date().toLocaleDateString()}</div>
          </div>
          <div class="grid">${metaHtml}</div>
          ${sectionsHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_MEDICAL} />

      {/* 1) Hero — You Are the Pilot */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-600/10 via-cyan-500/5 to-transparent" />
        <div className="container mx-auto px-4 pt-14 pb-6 max-w-6xl">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-1">
                MedicalMusai
              </h1>
              <p className="text-sm text-muted-foreground mb-3">You are the pilot in your life; we are your copilots.</p>
              <p className="text-muted-foreground text-lg">
                Understand diagnoses, challenge assumptions, and choose next steps—with a clear plan and the right support.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={() => navigate(ROUTES.MEDICAL_MUSAI_DEMO)}>Start Your Pre‑Flight</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Pre‑Flight preview</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Pre‑Flight Checklist (preview)</DialogTitle>
                      <DialogDescription>What you’ll do in 3–5 minutes</DialogDescription>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <ul className="list-disc ml-5 space-y-1">
                        <li>Capture your current concern and goals</li>
                        <li>Add key facts: symptoms, meds, diagnoses, recent tests</li>
                        <li>Flag risks/red‑flags and constraints</li>
                        <li>Draft 1–2 priority questions for your clinician</li>
                        <li>Optional: export a one‑page MedicalMusai Brief</li>
                      </ul>
                      <div className="pt-2">
                        <Button size="sm" onClick={() => navigate(ROUTES.MEDICAL_MUSAI_DEMO)}>Start Pre‑Flight</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
                desc: 'Generate doctor‑ready questions, next‑visit checklists, and referrals/resources. Export a one‑page MedicalMusai Brief for your appointment.',
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
                <div className="pt-3">
                  <MedicalFormModal
                    triggerLabel="Try SBAR Generator"
                    title="SBAR Generator (Preview)"
                    subtitle="Generated draft from your recent visit notes"
                    patientMeta={{
                      "Patient": "Jane Doe",
                      "DOB": "1988‑04‑02",
                      "MRN": "A19‑4472",
                      "Date": "2025‑08‑11",
                      "Visit Type": "Follow‑up",
                      "Allergies": "NKDA"
                    }}
                    sections={[
                      { title: 'S — Situation', content: (<div>Persistent chest tightness 2–3×/week, worsened by stairs; one near‑syncope last week.</div>) },
                      { title: 'B — Background', content: (<ul className="list-disc ml-5 space-y-1"><li>Hx: mild asthma (childhood), borderline hypertension; parent with CAD in 50s</li><li>Meds: amlodipine 5mg QD; albuterol PRN (rarely used)</li><li>Recent: viral URI 4 weeks ago; symptoms started after</li></ul>) },
                      { title: 'A — Assessment', content: (<ul className="list-disc ml-5 space-y-1"><li>Likely deconditioning vs. reactive airway; rule‑out cardiac contributors given family hx</li><li>Red flags: near‑syncope (single episode), exertional component</li></ul>) },
                      { title: 'R — Recommendation', content: (<ol className="list-decimal ml-5 space-y-1"><li>ECG today; consider troponin if indicated</li><li>PFT/peak‑flow; trial ICS/LABA if reactive pattern</li><li>BP log 2×/day × 2 weeks; graded activity plan</li></ol>) }
                    ]}
                    variants={[
                      {
                        patientMeta: { "Patient": "John Patel", "DOB": "1976‑09‑12", "MRN": "K22‑1180", "Date": "2025‑08‑11", "Visit Type": "Initial", "Allergies": "Penicillin" },
                        sections: [
                          { title: 'S — Situation', content: (<div>3 months of morning cough with occasional wheeze; worse with cold air.</div>) },
                          { title: 'B — Background', content: (<ul className="list-disc ml-5 space-y-1"><li>Hx: seasonal allergies; smoker 10 pack‑years, quit 2015</li><li>Meds: cetirizine PRN</li><li>Recent: mild URI 2 months ago</li></ul>) },
                          { title: 'A — Assessment', content: (<ul className="list-disc ml-5 space-y-1"><li>Likely post‑infectious airway hyperreactivity vs. cough‑variant asthma</li><li>No red flags reported</li></ul>) },
                          { title: 'R — Recommendation', content: (<ol className="list-decimal ml-5 space-y-1"><li>Trial low‑dose ICS for 4 weeks</li><li>Peak‑flow diary AM/PM</li><li>Return if hemoptysis, weight loss, or fever</li></ol>) }
                        ]
                      },
                      {
                        patientMeta: { "Patient": "Maria Rossi", "DOB": "1991‑02‑07", "MRN": "R33‑5521", "Date": "2025‑08‑11", "Visit Type": "Follow‑up", "Allergies": "NKDA" },
                        sections: [
                          { title: 'S — Situation', content: (<div>Episodic palpitations with lightheadedness after coffee; no syncope.</div>) },
                          { title: 'B — Background', content: (<ul className="list-disc ml-5 space-y-1"><li>Hx: anemia (resolved)</li><li>Meds: none</li><li>Family: no premature cardiac disease</li></ul>) },
                          { title: 'A — Assessment', content: (<ul className="list-disc ml-5 space-y-1"><li>Likely benign supraventricular ectopy; low suspicion for structural disease</li></ul>) },
                          { title: 'R — Recommendation', content: (<ol className="list-decimal ml-5 space-y-1"><li>Limit caffeine; hydration</li><li>12‑lead ECG; consider Holter if persists</li><li>Return if chest pain or syncope</li></ol>) }
                        ]
                      },
                      {
                        patientMeta: { "Patient": "Devin Lee", "DOB": "1983‑11‑30", "MRN": "L08‑9034", "Date": "2025‑08‑11", "Visit Type": "Urgent", "Allergies": "NSAIDs" },
                        sections: [
                          { title: 'S — Situation', content: (<div>Acute low back pain after lifting; no bowel/bladder symptoms.</div>) },
                          { title: 'B — Background', content: (<ul className="list-disc ml-5 space-y-1"><li>Hx: none significant</li><li>Meds: ibuprofen allergy (hives)</li><li>Occupation: warehouse</li></ul>) },
                          { title: 'A — Assessment', content: (<ul className="list-disc ml-5 space-y-1"><li>Likely mechanical strain without red flags</li></ul>) },
                          { title: 'R — Recommendation', content: (<ol className="list-decimal ml-5 space-y-1"><li>Acetaminophen scheduled × 3 days</li><li>Heat + gentle mobility</li><li>Return if weakness, numbness, or incontinence</li></ol>) }
                        ]
                      }
                    ]}
                  />
                </div>
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
                <div>• Care Team Sync: export a MedicalMusai Brief (PDF) for your doctor</div>
                <div>• TherapyMusai Bridge: process fears, stick to plans, celebrate small wins</div>
                <div>• Community Navigator: local services, transportation, benefits (coming online)</div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-3 rounded-md border bg-card overflow-hidden">
            <div className="w-full max-w-3xl mx-auto">
              <img
                src={threeColumns}
                alt="Three columns labeled Clarity, Confidence, Connection with miniature UI snippets"
                className="block w-full h-auto object-contain max-h-80 md:max-h-96"
              />
            </div>
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
                <div className="pt-2 flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const v = sbarVariantsHtml[Math.floor(Math.random() * sbarVariantsHtml.length)];
                      openPrintableMedicalForm('Sample SBAR Brief', { ...v.patientMeta }, v.sections);
                    }}
                  >
                    Download sample brief
                  </Button>

                  <MedicalFormModal
                    triggerLabel="View MedicalMusai Brief"
                    title="MedicalMusai Brief (Sample)"
                    subtitle="One‑page patient summary for primary care"
                    patientMeta={{
                      "Patient": "Jane Doe",
                      "DOB": "1988‑04‑02",
                      "MRN": "A19‑4472",
                      "Date": "2025‑08‑11",
                      "Primary": "Dr. Smith",
                      "Insurance": "OHIP"
                    }}
                    sections={[
                      {
                        title: 'Chief Concern',
                        content: (
                          <div>Chest tightness on exertion; fatigue after stairs; one near‑syncope.</div>
                        )
                      },
                      {
                        title: 'Pertinent History',
                        content: (
                          <ul className="list-disc ml-5 space-y-1">
                            <li>FHx: CAD (parent in 50s)</li>
                            <li>PMHx: mild asthma (childhood), borderline HTN</li>
                            <li>Meds: amlodipine 5mg QD; albuterol PRN</li>
                          </ul>
                        )
                      },
                      {
                        title: 'Objective (self‑reported)',
                        content: (
                          <ul className="list-disc ml-5 space-y-1">
                            <li>BP home log avg ~136/86 last 2 weeks</li>
                            <li>Pulse 78–96; O2 97–99% at rest</li>
                          </ul>
                        )
                      },
                      {
                        title: 'Plan Request',
                        content: (
                          <ol className="list-decimal ml-5 space-y-1">
                            <li>ECG today; guidance re: troponin if indicated</li>
                            <li>Consider PFT/peak‑flow; trial ICS/LABA if reactive</li>
                            <li>BP log 2×/day × 2 weeks; follow‑up visit after</li>
                          </ol>
                        )
                      }
                    ]}
                  />
                </div>
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
              <div className="mt-3">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">Local AI options (private inference)</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Local vs Hybrid AI — Privacy, IP, and Implicit Learning</DialogTitle>
                      <DialogDescription>How to protect sensitive data while keeping flexibility</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm text-muted-foreground">
                      <div>
                        <div className="font-medium text-foreground">The risk — implicit learning + logs</div>
                        <ul className="list-disc ml-5 space-y-1">
                          <li>Some AI systems log prompts/outputs or further train on them. Secrets can be memorized or pattern‑learned.</li>
                          <li>Unsettled copyright/policy norms mean generated assertions might reflect your private inputs.</li>
                          <li>Result: in theory, sharing a secret could create downstream IP exposure if it reappears elsewhere.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Local AI — containment by default</div>
                        <ul className="list-disc ml-5 space-y-1">
                          <li>Inference runs on your hardware; prompts and artifacts stay on‑device.</li>
                          <li>Ideal for sensitive drafts, PHI/PII, and proprietary designs.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Hybrid AI — best of both worlds</div>
                        <ul className="list-disc ml-5 space-y-1">
                          <li>Opt‑in per task: redact or summarize before upload; restrict domains; keep logs visible.</li>
                          <li>Use cloud only for heavy research or long‑form generation you explicitly approve.</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-medium text-foreground">Practical guardrails</div>
                        <ul className="list-disc ml-5 space-y-1">
                          <li>Avoid raw secrets in prompts. Prefer local runs for anything sensitive.</li>
                          <li>When hybrid is needed, send abstractions (summaries, diffs, masked values).</li>
                          <li>Review provider retention/policy settings; disable training on your data when possible.</li>
                        </ul>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
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
              <div className="mt-3 text-sm text-muted-foreground">
                <div className="font-medium text-foreground mb-1">Pre‑Flight includes:</div>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Define your situation and desired outcome</li>
                  <li>Note symptoms, meds, and relevant history</li>
                  <li>Select 1–2 priority questions for the visit</li>
                  <li>Optional: export a one‑page MedicalMusai Brief</li>
                </ul>
              </div>
              <div className="pt-3 mt-3 w-full rounded-md border bg-card overflow-hidden">
                <div className="relative w-full">
                  <img
                    src={runwayLights}
                    alt="Gentle runway lights leading into the horizon"
                    className="block w-full h-auto"
                  />
                  {/* Subtle atmospheric gradient and runway glow */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />
                  <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-[12%] w-[60%] h-[35%] rounded-full bg-amber-300/15 blur-3xl" />
                </div>
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



