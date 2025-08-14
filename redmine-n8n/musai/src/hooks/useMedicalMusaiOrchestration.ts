import { useCallback, useState } from 'react';
import { n8nApi } from '@/config/n8nEndpoints';
import type { Artifact, ConversationPrep, DoctorStyle, Insight, JobRef, TimelineEvent } from '@/types/medicalMusai';

type AsyncJob<ResultT> = JobRef<ResultT> | null;

export function useMedicalMusaiOrchestration(patientId: string)
{
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  const invoke = useCallback(async (endpoint: string, payload: any) =>
  {
    const url = n8nApi.getEndpointUrl(endpoint);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, ...payload })
    });
    if (!response.ok)
    {
      throw new Error(`n8n invoke failed: ${response.status}`);
    }
    return response.json();
  }, [patientId]);

  async function ingestArtifacts(artifacts: Artifact[])
  {
    return invoke('/doc-intake-extract', { artifacts });
  }

  async function connectFhir(endpointUrl: string, tokens?: any)
  {
    return invoke('/fhir-import-sync', { endpointUrl, tokens });
  }

  async function rebuildTimeline()
  {
    const res = await invoke('/timeline-build-merge', {});
    setTimeline(res.timeline as TimelineEvent[]);
    return res;
  }

  async function refreshInsights()
  {
    const res = await invoke('/insight-engine-refresh', {});
    setInsights(res.insights as Insight[]);
    return res;
  }

  async function prepConversation(encounterId: string, doctorId: string, goals: string[])
  {
    const res = await invoke('/conversation-prep', { encounterId, doctorId, goals });
    return res as ConversationPrep;
  }

  async function planChallenge(claim: string, timelineRef?: string)
  {
    return invoke('/challenge-confirm', { claim, timelineRef });
  }

  async function getDoctorStyle(doctorId: string)
  {
    const res = await invoke('/doctor-style-profile', { doctorId });
    return res as DoctorStyle;
  }

  async function transcribeLocal(audioDataUri: string)
  {
    const res = await invoke('/transcribe-local', { audio: audioDataUri });
    return (res && res.text) as string;
  }

  async function getPatientSnapshot()
  {
    const res = await invoke('/patient-snapshot', {});
    return res as { timeline: TimelineEvent[]; insights: Insight[] };
  }

  return {
    timeline,
    insights,
    ingestArtifacts,
    connectFhir,
    rebuildTimeline,
    refreshInsights,
    prepConversation,
    planChallenge,
    getDoctorStyle,
    transcribeLocal,
    getPatientSnapshot,
  };
}


