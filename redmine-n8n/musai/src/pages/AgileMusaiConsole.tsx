import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AppWindow, Bot, CheckCircle2, GitBranch, ListChecks, Play, Rocket, MessageSquare, Square, Workflow } from 'lucide-react';
import { taskMusaiApi, SprintStatus } from '@/lib/taskMusaiApi';
import { useToast } from '@/hooks/use-toast';

type SprintPhase = SprintStatus['phase'];

const phaseLabels: Record<SprintPhase, string> = {
  intake: 'Intake',
  planning: 'Planning',
  building: 'Building',
  demo: 'Demo',
  feedback: 'Feedback',
  complete: 'Complete'
};

export default function AgileMusaiConsole()
{
  const { toast } = useToast();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string>('');
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [status, setStatus] = useState<SprintStatus | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef<number | null>(null);

  const criteriaArray = useMemo(() =>
  {
    return acceptanceCriteria
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  }, [acceptanceCriteria]);

  const startSprint = useCallback(async () =>
  {
    if (!title.trim() || !description.trim())
    {
      toast({ description: 'Provide a title and description to start.', variant: 'destructive' });
      return;
    }
    try
    {
      setIsStarting(true);
      const res = await taskMusaiApi.startSprint({
        title: title.trim(),
        description: description.trim(),
        acceptanceCriteria: criteriaArray,
      });
      setSprintId(res.sprintId);
      toast({ description: 'Sprint started' });
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Failed to start sprint', variant: 'destructive' });
    }
    finally
    {
      setIsStarting(false);
    }
  }, [title, description, criteriaArray, toast]);

  const pollStatus = useCallback(async () =>
  {
    if (!sprintId) return;
    try
    {
      const s = await taskMusaiApi.getSprintStatus(sprintId);
      setStatus(s);
      if (s.phase === 'complete')
      {
        stopPolling();
      }
    }
    catch (err)
    {
      console.error(err);
    }
  }, [sprintId]);

  const startPolling = useCallback(() =>
  {
    if (isPolling || !sprintId) return;
    setIsPolling(true);
    pollStatus();
    pollTimerRef.current = window.setInterval(() => {
      pollStatus();
    }, 5000);
  }, [isPolling, sprintId, pollStatus]);

  const stopPolling = useCallback(() =>
  {
    setIsPolling(false);
    if (pollTimerRef.current)
    {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  useEffect(() =>
  {
    if (sprintId && !isPolling)
    {
      startPolling();
    }
    return () => stopPolling();
  }, [sprintId, isPolling, startPolling, stopPolling]);

  // Bootstrap from initial request (navigate state or ?q=)
  useEffect(() =>
  {
    const stateAny = location.state as any;
    const initial = (stateAny?.initialRequest || searchParams.get('q') || '').trim();
    if (!initial) return;
    // Populate fields if empty and kick off start
    if (!title) {
      const firstSentence = initial.split(/\.|\n/)[0] || initial;
      const inferredTitle = firstSentence.trim().slice(0, 80);
      setTitle(inferredTitle || 'Sprint');
    }
    if (!description) {
      setDescription(initial);
    }
    // Defer a tick to allow state to set, then start
    const t = setTimeout(() => {
      // Only start if we haven't already
      if (!sprintId) {
        startSprint();
      }
    }, 0);
    return () => clearTimeout(t);
  }, [location.state, searchParams]);

  const submitFeedback = useCallback(async (text: string) =>
  {
    if (!sprintId || !text.trim()) return;
    try
    {
      await taskMusaiApi.submitSprintFeedback(sprintId, text.trim());
      toast({ description: 'Feedback submitted' });
      pollStatus();
    }
    catch (err)
    {
      console.error(err);
      toast({ description: 'Failed to submit feedback', variant: 'destructive' });
    }
  }, [sprintId, toast, pollStatus]);

  const progress = status?.progressPct ?? 0;
  const phase = status?.phase ?? 'intake';

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AgileMusai Console</h1>
        <div className="text-muted-foreground">Scrum orchestration via n8n with Redmine memory</div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Rocket className="w-5 h-5" /> Start Sprint</CardTitle>
              <CardDescription>Describe the high-level request. A Redmine subproject + items will be created.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Sprint Title</div>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Build MVP landing with signup" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">High-level Request</div>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the outcome, constraints, and scope" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Acceptance Criteria (one per line)</div>
                <Textarea value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} rows={4} placeholder="- Visitor can subscribe with email\n- Confirmation email is sent\n- Welcome page renders with username" />
              </div>
              <div className="flex gap-2">
                <Button onClick={startSprint} disabled={isStarting}><Play className="w-4 h-4" /> Start</Button>
                {sprintId && !isPolling && <Button variant="outline" onClick={startPolling}><Workflow className="w-4 h-4" /> Resume Polling</Button>}
                {isPolling && <Button variant="outline" onClick={stopPolling}><Square className="w-4 h-4" /> Pause Polling</Button>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5" /> Sprint Status</CardTitle>
              <CardDescription>Live state from n8n/Redmine loop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!sprintId && <div className="text-sm text-muted-foreground">No active sprint yet.</div>}
              {sprintId && (
                <div className="space-y-3">
                  <div className="text-sm">Sprint ID: <span className="font-mono">{sprintId}</span></div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{phaseLabels[phase]}</Badge>
                    <div className="text-xs text-muted-foreground">Updated {status ? new Date(status.updatedAt).toLocaleTimeString() : '—'}</div>
                  </div>
                  <Progress value={progress} />
                  {status?.summary && (
                    <div className="text-sm whitespace-pre-wrap bg-muted rounded p-3">{status.summary}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Sprint Feedback</CardTitle>
              <CardDescription>Agents will adapt plan or produce new items based on comments</CardDescription>
            </CardHeader>
            <CardContent>
              <FeedbackForm onSubmit={submitFeedback} disabled={!sprintId} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Orchestrator</CardTitle>
              <CardDescription>n8n loops tickets → actions</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Redmine holds the plan and artifacts. Each ticket names the agent to run; n8n picks it up, executes, and updates status. When all tickets complete, the sprint is ready to demo.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AppWindow className="w-5 h-5" /> Demo Flow</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              During demo, agents respond with context from work items and describe changes. Your comments become new work — the next sprint plan.
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Spinner overlay while starting sprint */}
      {isStarting && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-20" aria-live="polite" aria-busy="true">
          <div className="flex items-center">
            <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            <span className="ml-3 text-sm text-muted-foreground">Creating plan via n8n…</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackForm({ onSubmit, disabled }: { onSubmit: (text: string) => void; disabled?: boolean })
{
  const [text, setText] = useState('');
  return (
    <div className="space-y-2">
      <Textarea value={text} onChange={e => setText(e.target.value)} rows={3} placeholder="Notes, requests, or corrections for the team" disabled={disabled} />
      <div className="flex gap-2">
        <Button onClick={() => { onSubmit(text); setText(''); }} disabled={disabled || !text.trim()}><CheckCircle2 className="w-4 h-4" /> Submit</Button>
      </div>
    </div>
  );
}


