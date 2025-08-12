import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ClipboardList, FileUp, Play, Stethoscope, Brain, CheckCircle, MessageCircle, ArrowRight } from 'lucide-react';
import type { Artifact, ConversationPrep, Insight, TimelineEvent } from '@/types/medicalMusai';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import impressedPhysician from '@/assets/images/medical_musai_impressedphysician_completedpreflight.png';

// Stubbed data for investor demo
const stubArtifacts: Artifact[] = [
  { id: 'art1', kind: 'pdf', uri: '/stubs/mri_report.pdf' },
  { id: 'art2', kind: 'image', uri: '/stubs/lab_panel.png' },
];

const stubTimeline: TimelineEvent[] = [
  { id: 't1', ts: '2025-03-12', kind: 'Encounter', summary: 'GP visit – headaches persisting' },
  { id: 't2', ts: '2025-03-18', kind: 'Observation', summary: 'CBC normal; ESR mildly elevated', evidenceRef: ['obs:esr'] },
  { id: 't3', ts: '2025-03-20', kind: 'DiagnosticReport', summary: 'MRI brain – non-acute; incidental sinus inflammation', evidenceRef: ['dr:mri'] },
];

const stubInsights: Insight[] = [
  { id: 'i1', label: 'Headaches may correlate with med dose increases', confidence: 0.62, rationaleRefs: ['t2','t3'], actions: [ { id: 'a1', label: 'Medication holiday (under supervision)', confirmStep: { code: 'plan:med-hold', yield: 0.4, cost: 'low' } }, { id: 'a2', label: 'Order ESR/CRP repeat', confirmStep: { code: 'LOINC:30522-7', yield: 0.25, cost: 'low' } } ] },
  { id: 'i2', label: 'Consider sinus contribution; ENT referral could clarify', confidence: 0.48, rationaleRefs: ['t3'], actions: [ { id: 'a3', label: 'ENT referral', confirmStep: { code: 'ServReq:ENT', yield: 0.3, cost: 'med' } } ] },
];

const stubPrep: ConversationPrep = {
  goals: [ 'Clarify cause of headaches', 'Discuss non‑sedating options', 'Agree on confirm steps' ],
  phrasing: [
    'I notice headaches worse after dose increases; can we explore that and plan confirm steps?',
    'What would rule in or rule out sinus contribution vs medication effects?',
    'I’d like to leave with 2–3 concrete next steps I can track.'
  ],
  brief: 'Headaches for 6 months; MRI non-acute; ESR mildly up; worse after med changes. Goal: cause clarity + concrete next steps.'
};

export default function MedicalMusaiDemo()
{
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(0);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [prep, setPrep] = useState<ConversationPrep | null>(null);
  

  

  useEffect(() => {
    // Initialize with stub "import" done
    setTimeline(stubTimeline);
  }, []);

  function next()
  {
    setStep((s) => Math.min(s + 1, 4));
  }

  const progress = (step / 4) * 100;

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_MEDICAL} />
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MedicalMusai</h1>
            <p className="text-xs text-muted-foreground">You are the pilot in your life; we are your copilots.</p>
          </div>
          <Button variant="outline" onClick={() => navigate(ROUTES.MEDICAL_MUSAI)}>
            Back to Info
          </Button>
        </div>

        <Progress value={progress} className="mb-6" />

        {step === 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileUp className="w-5 h-5" /> Step 1 — Upload artifacts</CardTitle>
              <CardDescription>We’ll pretend you uploaded a PDF MRI report and a lab panel image.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex flex-wrap gap-3">
                {stubArtifacts.map((a) => (
                  <div key={a.id} className="rounded-lg border bg-card px-3 py-2">
                    <div className="text-xs uppercase text-muted-foreground">{a.kind}</div>
                    <div className="text-sm">{a.uri.split('/').pop()}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button onClick={next}>
                  Run OCR & Extract <Play className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Step 2 — Timeline merge</CardTitle>
              <CardDescription>Documents are parsed into FHIR and stitched into a timeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline.map((t) => (
                  <div key={t.id} className="rounded-lg border bg-card px-3 py-2 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">{t.ts} • {t.kind}</div>
                      <div className="text-sm">{t.summary}</div>
                    </div>
                    <Badge variant="secondary">{t.evidenceRef?.length || 0} refs</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-4"><Button onClick={() => { setInsights(stubInsights); next(); }}>Build Radar <Brain className="w-4 h-4 ml-2" /></Button></div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> Step 3 — Challenge Radar</CardTitle>
              <CardDescription>Top trends and actionable confirm steps, with confidence scores.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {insights.map((i) => (
                  <div key={i.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium">{i.label}</div>
                      <div className="text-xs text-muted-foreground">conf {Math.round(i.confidence * 100)}%</div>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">Evidence: {i.rationaleRefs.join(', ')}</div>
                    <div className="space-y-1">
                      {i.actions.map((a) => (
                        <div key={a.id} className="text-sm flex items-center justify-between">
                          <span>• {a.label}</span>
                          {a.confirmStep && (
                            <span className="text-xs text-muted-foreground">yield {Math.round(a.confirmStep.yield * 100)}% · {a.confirmStep.cost}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4"><Button onClick={() => { setPrep(stubPrep); next(); }}>Prepare Conversation <MessageCircle className="w-4 h-4 ml-2" /></Button></div>
            </CardContent>
          </Card>
        )}

        {step === 3 && prep && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Step 4 — Conversation Prep</CardTitle>
              <CardDescription>Style-aware phrasing and a 90-second brief for the visit.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-card p-3 mb-3">
                <div className="text-xs text-muted-foreground mb-1">90-second brief</div>
                <div className="text-sm">{prep.brief}</div>
              </div>
              <div className="mb-3">
                <div className="text-xs text-muted-foreground mb-1">Goals</div>
                <div className="flex flex-wrap gap-2">
                  {prep.goals.map((g, idx) => (
                    <Badge key={idx} variant="secondary">{g}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Try saying it like this</div>
                <ul className="list-disc ml-5 space-y-1 text-sm">
                  {prep.phrasing.map((p, idx) => (<li key={idx}>{p}</li>))}
                </ul>
              </div>
              <div className="mt-4 flex gap-3">
                <Button variant="outline" onClick={() => navigate(ROUTES.THERAPY_MUSAI)}>TherapyMusai Tips</Button>
                <Button onClick={() => setStep(4)}>
                  Finish Demo <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Demo Complete</CardTitle>
              <CardDescription>Patient stays the pilot: upload → timeline → insights → prep → confident visit.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-md border bg-card overflow-hidden">
                  <AspectRatio ratio={16/9}>
                    <img
                      src={impressedPhysician}
                      alt="Impressed physician reviewing a patient prep brief and challenge radar on a tablet"
                      className="block w-full h-full object-cover"
                    />
                  </AspectRatio>
                </div>

                <div className="rounded-md border bg-card p-3">
                  <div className="text-sm text-muted-foreground mb-2">Impressed Physician — Concept Artwork</div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    The concept image illustrates a physician reviewing a patient’s prep brief and Challenge Radar.
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.MEDICAL_MUSAI)}>
                      Return to MedicalMusai <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


