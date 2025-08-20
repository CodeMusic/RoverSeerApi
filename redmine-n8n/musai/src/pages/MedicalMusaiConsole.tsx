import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { useMedicalMusaiOrchestration } from '@/hooks/useMedicalMusaiOrchestration';
import type { Artifact, ConversationPrep, Insight, TimelineEvent } from '@/types/medicalMusai';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useMessageSender } from '@/hooks/useMessageSender';
import { Message } from '@/types/chat';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ClipboardList, FileUp, MessageCircle, Stethoscope, Brain, ShieldQuestion, Info, Mic, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { MysticalTypingIndicator } from '@/components/chat/MysticalTypingIndicator';
import { fileToDataUri } from '@/utils/files';

function getOrCreatePatientId(): string
{
  const key = 'medicalMusai.patientId';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const id = uuidv4();
  localStorage.setItem(key, id);
  return id;
}

function classifyArtifactKind(file: File): Artifact['kind']
{
  if (file.type.includes('pdf')) return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  return 'note';
}

// fileToDataUri imported from utils/files

export default function MedicalMusaiConsole()
{
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const patientId = useMemo(() => getOrCreatePatientId(), []);
  const orchestration = useMedicalMusaiOrchestration(patientId);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [notesInput, setNotesInput] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [conversationPrep, setConversationPrep] = useState<ConversationPrep | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<BlobPart[]>([]);
  const [lastRecordingUrl, setLastRecordingUrl] = useState<string | null>(null);
  const [lastRecordingBlob, setLastRecordingBlob] = useState<Blob | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const sessionIdRef = useRef<string>(uuidv4());

  const updateSession = useCallback((sessionId: string, msgs: Message[]) =>
  {
    if (sessionId !== sessionIdRef.current) return;
    setMessages(msgs);
  }, []);

  const { sendMessage, isTyping, isLoading } = useMessageSender(updateSession, queryClient);

  const handleSendChat = useCallback(async (text: string) =>
  {
    // Seed first turn with medical context
    const hasAnyAssistant = messages.some(m => m.role === 'assistant');
    const contextPrefix = !hasAnyAssistant
      ? `Medical Context — Timeline: ${JSON.stringify(orchestration.timeline).slice(0, 1800)}\nInsights: ${JSON.stringify(orchestration.insights).slice(0, 1800)}\n\nQuestion: `
      : '';
    await sendMessage(`${contextPrefix}${text}`, sessionIdRef.current, messages);
  }, [messages, orchestration.timeline, orchestration.insights, sendMessage]);

  const timelineSeries = useMemo(() =>
  {
    const counts: Record<string, number> = {};
    orchestration.timeline.forEach(ev => { counts[ev.kind] = (counts[ev.kind] || 0) + 1; });
    return Object.entries(counts).map(([kind, count]) => ({ kind, count }));
  }, [orchestration.timeline]);

  const handleFileSelect = useCallback(async (files: FileList | null) =>
  {
    if (!files) return;
    const accepted = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.includes('pdf') || f.type.startsWith('text/'));
    setSelectedFiles(prev => [...prev, ...accepted]);
    if (accepted.length < (files?.length || 0))
    {
      toast({ description: 'Some files were ignored (unsupported type).', variant: 'default' });
    }
  }, [toast]);

  const handleIngest = useCallback(async () =>
  {
    try
    {
      setIsIngesting(true);

      const artifacts: Artifact[] = [];
      for (const file of selectedFiles)
      {
        const uri = await fileToDataUri(file);
        artifacts.push({ id: uuidv4(), kind: classifyArtifactKind(file), uri });
      }
      if (lastRecordingBlob)
      {
        const audioUri = await fileToDataUri(new File([lastRecordingBlob], `voice-${Date.now()}.webm`, { type: lastRecordingBlob.type || 'audio/webm' }));
        artifacts.push({ id: uuidv4(), kind: 'audio', uri: audioUri });
      }
      if (notesInput.trim().length > 0)
      {
        const noteBlob = new Blob([notesInput], { type: 'text/plain' });
        const noteFile = new File([noteBlob], `note-${Date.now()}.txt`, { type: 'text/plain' });
        const dataUri = await fileToDataUri(noteFile);
        artifacts.push({ id: uuidv4(), kind: 'note', uri: dataUri });
      }

      if (artifacts.length === 0)
      {
        toast({ description: 'Add at least one document, image, or note.', variant: 'destructive' });
        return;
      }

      await orchestration.ingestArtifacts(artifacts);
      await orchestration.rebuildTimeline();
      await orchestration.refreshInsights();
      toast({ description: 'Ingestion complete. Timeline and insights updated.' });
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Ingestion failed. Please try again.', variant: 'destructive' });
    }
    finally
    {
      setIsIngesting(false);
    }
  }, [selectedFiles, notesInput, orchestration, toast]);

  const handleChallenge = useCallback(async (insight: Insight) =>
  {
    try
    {
      await orchestration.planChallenge(insight.label, insight.rationaleRefs?.[0]);
      toast({ description: 'Challenge queued. We will refine this claim.' });
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Challenge failed. Try again later.', variant: 'destructive' });
    }
  }, [orchestration, toast]);

  const handlePrep = useCallback(async () =>
  {
    try
    {
      const prep = await orchestration.prepConversation('latest-encounter', 'primary-md', ['clarify diagnosis', 'review next steps']);
      setConversationPrep(prep);
      toast({ description: 'Brief prepared. See Conversation Prep.' });
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Could not prepare conversation.', variant: 'destructive' });
    }
  }, [orchestration, toast]);

  const startRecording = useCallback(async () =>
  {
    if (isRecording) return;
    try
    {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data); };
      mr.onstop = () =>
      {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        setLastRecordingBlob(blob);
        const url = URL.createObjectURL(blob);
        setLastRecordingUrl(url);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      toast({ description: 'Recording started' });
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Mic access denied or unavailable', variant: 'destructive' });
    }
  }, [isRecording, toast]);

  const stopRecording = useCallback(() =>
  {
    if (!isRecording || !mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current = null;
    setIsRecording(false);
    toast({ description: 'Recording stopped' });
  }, [isRecording, toast]);

  const transcribeRecording = useCallback(async () =>
  {
    if (!lastRecordingBlob)
    {
      toast({ description: 'No recording to transcribe', variant: 'destructive' });
      return;
    }
    try
    {
      const dataUri = await fileToDataUri(new File([lastRecordingBlob], `voice-${Date.now()}.webm`, { type: lastRecordingBlob.type || 'audio/webm' }));
      const text = await orchestration.transcribeLocal(dataUri);
      setNotesInput(prev => prev ? `${prev}\n${text}` : text);
      toast({ description: 'Transcribed into notes' });
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Transcription failed', variant: 'destructive' });
    }
  }, [lastRecordingBlob, orchestration, toast]);

  useEffect(() =>
  {
    return () =>
    {
      if (lastRecordingUrl)
      {
        URL.revokeObjectURL(lastRecordingUrl);
      }
    };
  }, [lastRecordingUrl]);

  const downloadPatientSnapshot = useCallback(async () =>
  {
    try
    {
      const snapshot = await orchestration.getPatientSnapshot();
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient-${patientId}-snapshot.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ description: 'Patient snapshot downloaded' });
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Could not fetch snapshot', variant: 'destructive' });
    }
  }, [orchestration, patientId, toast]);

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_MEDICAL} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MedicalMusai — Pilot Console</h1>
            <p className="text-xs text-muted-foreground">Intake, make sense, then converse with your clinician self.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(ROUTES.MEDICAL_MUSAI)}>Info</Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.MEDICAL_MUSAI_DEMO)}>Demo</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileUp className="w-5 h-5" /> Intake — Documents, Images, Notes</CardTitle>
                <CardDescription>Upload visit artifacts. We extract, normalize, and merge into your cognitive timeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input type="file" multiple accept="application/pdf,image/*,text/plain" onChange={(e) => handleFileSelect(e.target.files)} />
                  <Badge variant="secondary">{selectedFiles.length} files</Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Quick note</div>
                  <Input placeholder="Key symptoms, changes, questions" value={notesInput} onChange={(e) => setNotesInput(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant={isRecording ? 'destructive' : 'default'} onClick={isRecording ? stopRecording : startRecording}>
                    <Mic className="w-4 h-4 mr-2" /> {isRecording ? 'Stop' : 'Record voice'}
                  </Button>
                  <Button type="button" variant="outline" onClick={transcribeRecording} disabled={!lastRecordingBlob}>Transcribe to notes</Button>
                  {lastRecordingUrl ? (
                    <audio className="ml-auto" src={lastRecordingUrl} controls />
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleIngest} disabled={isIngesting}>
                    {isIngesting ? 'Ingesting…' : 'Ingest & Refresh'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Timeline</CardTitle>
                <CardDescription>Unified view of encounters, observations, and reports.</CardDescription>
              </CardHeader>
              <CardContent>
                {orchestration.timeline.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No events yet. Ingest artifacts to build your timeline.</div>
                ) : (
                  <div className="space-y-4">
                    <ChartContainer
                      config={{ count: { label: 'Events', color: 'hsl(var(--primary))' } }}
                      className="w-full"
                    >
                      <BarChart data={timelineSeries}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="kind" />
                        <YAxis allowDecimals={false} />
                        <Bar dataKey="count" fill="var(--color-count)" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent />} />
                      </BarChart>
                    </ChartContainer>

                    <div className="space-y-2 max-h-60 overflow-auto rounded border p-3">
                      {orchestration.timeline.map(ev => (
                        <div key={ev.id} className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{ev.ts} — {ev.kind}</div>
                            <div className="text-sm text-muted-foreground">{ev.summary}</div>
                          </div>
                          {ev.evidenceRef?.length ? (
                            <Badge variant="outline">{ev.evidenceRef.length} refs</Badge>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" /> Insights</CardTitle>
                <CardDescription>Emergent impressions and next best actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {orchestration.insights.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No insights yet.</div>
                ) : (
                  orchestration.insights.map(ins => (
                    <div key={ins.id} className="border rounded p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{ins.label}</div>
                          <div className="text-xs text-muted-foreground">Confidence: {(ins.confidence * 100).toFixed(0)}%</div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleSendChat(`Explain this finding: ${ins.label}`)}>
                            <Info className="w-4 h-4 mr-1" /> Understand
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => handleChallenge(ins)}>
                            <ShieldQuestion className="w-4 h-4 mr-1" /> Challenge
                          </Button>
                        </div>
                      </div>
                      {ins.actions?.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ins.actions.map(a => (
                            <Badge key={a.id} variant="outline">{a.label}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Diagnosis Chat</CardTitle>
                <CardDescription>Ask questions grounded in your timeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <Button size="sm" variant="outline" onClick={downloadPatientSnapshot}><Download className="w-4 h-4 mr-1" /> Snapshot JSON</Button>
                </div>
                <div className="h-64 overflow-auto border rounded p-2 bg-muted/30">
                  {messages.map(m => (
                    <div key={m.id} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                      <div className={m.role === 'user' ? 'inline-block bg-primary text-primary-foreground px-2 py-1 rounded mb-1' : 'inline-block bg-background border px-2 py-1 rounded mb-1'}>
                        <div className="text-xs whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  ))}
                  {isTyping || isLoading ? (
                    <div className="flex justify-start mt-2">
                      <MysticalTypingIndicator isDarkMode={false} />
                    </div>
                  ) : null}
                </div>
                <ChatPrompt onSend={handleSendChat} disabled={isTyping || isLoading} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Conversation Prep</CardTitle>
                <CardDescription>Generate a brief (SBAR‑style) for your next visit.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button onClick={handlePrep}>Generate Brief</Button>
                </div>
                {conversationPrep ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Brief</div>
                    <div className="text-sm whitespace-pre-wrap border rounded p-2 bg-muted/30">{conversationPrep.brief}</div>
                    <div className="text-sm font-medium">Goals</div>
                    <div className="flex flex-wrap gap-2">
                      {conversationPrep.goals.map((g, i) => <Badge key={`${g}-${i}`} variant="outline">{g}</Badge>)}
                    </div>
                    <div className="text-sm font-medium">Phrasing</div>
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {conversationPrep.phrasing.map((p, i) => <li key={`${p}-${i}`}>{p}</li>)}
                    </ul>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No brief yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPrompt({ onSend, disabled }: { onSend: (text: string) => void; disabled?: boolean })
{
  const [text, setText] = useState('');
  const handle = () =>
  {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText('');
  };
  return (
    <div className="flex items-center gap-2">
      <Input placeholder="Ask about diagnoses, labs, or next steps…" value={text} onChange={(e) => setText(e.target.value)} disabled={disabled} />
      <Button onClick={handle} disabled={disabled || !text.trim()}>Send</Button>
    </div>
  );
}


