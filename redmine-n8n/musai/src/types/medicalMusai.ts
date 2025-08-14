// MedicalMusai core types used by the Pilot Console (frontend)
// Braces on new lines; names are self-documenting and psychology-aware.

export type CommunicationStyle = 'direct' | 'narrative';
export type Neurotype = 'ADHD' | 'Autistic' | null;

export type ConsentScope =
  | 'import:fhir'
  | 'compute:insight'
  | 'share:fhir-drafts'
  | 'transcribe:local'
  | 'export:bundle';

export interface Patient
{
  id: string;
  name: string;
  consents: ConsentScope[];
  preferences: {
    communicationStyle: CommunicationStyle;
    neurotype?: Neurotype;
    riskTolerance?: 'low' | 'medium' | 'high';
  };
}

export interface Artifact
{
  id: string;
  kind: 'pdf' | 'image' | 'fhirBundle' | 'note' | 'audio';
  uri: string;
}

export interface TimelineEvent
{
  id: string;
  ts: string;
  kind: 'Encounter' | 'Observation' | 'DiagnosticReport' | 'Medication' | 'ImagingStudy' | 'Note' | 'Communication';
  summary: string;
  evidenceRef?: string[]; // artifact IDs or FHIR refs
}

export interface ActionSuggestion
{
  id: string;
  label: string;
  confirmStep?: {
    code: string;
    yield: number; // 0..1 expected diagnostic yield
    cost: 'low' | 'med' | 'high';
  };
}

export interface Insight
{
  id: string;
  label: string;
  confidence: number; // 0..1
  rationaleRefs: string[]; // evidence trail nodes
  actions: ActionSuggestion[];
}

export interface DoctorStyle
{
  id: string;
  vector: Record<string, number>; // e.g., { dataFirst: 0.8, narrativeFirst: 0.2, timePressure: 0.7 }
  hints: string[];
}

export interface ConversationPrep
{
  goals: string[];
  phrasing: string[]; // generated, style-aware
  brief: string; // 60–90 sec summary
}

export interface JobRef<ResultT = unknown>
{
  jobId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  result?: ResultT;
}


