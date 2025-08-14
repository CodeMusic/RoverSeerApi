import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { useQueryClient } from '@tanstack/react-query';
import { useMessageSender } from '@/hooks/useMessageSender';
import { Message } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Map as MapIcon,
  Compass as CompassIcon,
  Search,
  Bell,
  Send,
  TrendingUp,
  Target,
  Layers,
} from 'lucide-react';
import { CareerScheduler } from '@/components/career/CareerScheduler';
import { CareerAlerts } from '@/components/career/CareerAlerts';
import { n8nApi } from '@/config/n8nEndpoints';
import { MysticalTypingIndicator } from '@/components/chat/MysticalTypingIndicator';

export default function CareerMusaiConsole()
{
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<'map' | 'compass'>('map');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [scheduledSearches, setScheduledSearches] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  const sessionIdRef = useRef<string>(uuidv4());
  const { sendMessage, isTyping, isLoading } = useMessageSender((sessionId, msgs) => {
    if (sessionId !== sessionIdRef.current) return;
    setMessages(msgs);
  }, queryClient);

  // Map — user terrain state
  const [skills, setSkills] = useState<string>('');
  const [projects, setProjects] = useState<string>('');
  const [interests, setInterests] = useState<string>('');

  // Compass — true north state
  const [currentRole, setCurrentRole] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [dream, setDream] = useState('');

  const careerContextText = useMemo(() => {
    return `Career Context\nCurrent Role: ${currentRole || 'Not specified'}\nTarget Role: ${targetRole || 'Not specified'}\nDream: ${dream || 'Not specified'}\nSkills: ${skills || 'Not specified'}\nProjects: ${projects || 'Not specified'}\nInterests: ${interests || 'Not specified'}`;
  }, [currentRole, targetRole, dream, skills, projects, interests]);

  const seedAndSend = useCallback(async (userText: string) =>
  {
    const hasAnyAssistant = messages.some(m => m.role === 'assistant');
    const prefix = hasAnyAssistant ? '' : `${careerContextText}\n\n`;
    await sendMessage(`${prefix}${userText}`, sessionIdRef.current, messages);
  }, [messages, sendMessage, careerContextText]);

  const scheduleSearch = useCallback(async (config: {
    query: string;
    presentation: string;
    email?: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    time?: string;
  }) =>
  {
    const result = await n8nApi.scheduleCareerScout({ ...config, userId: 'current-user' });
    const id = result?.id || uuidv4();
    setScheduledSearches(prev => [...prev, { ...config, id, isActive: true }]);
    setAlerts(prev => [
      {
        id: uuidv4(),
        type: 'schedule_complete',
        title: 'Scout scheduled',
        description: `“${config.query}” — ${config.frequency} @ ${config.time || '09:00'}`,
        timestamp: new Date(),
        isRead: false,
        priority: 'low',
      }
    ]);
  }, []);

  const refreshAlerts = useCallback(async () =>
  {
    const items = await n8nApi.listCareerAlerts('current-user');
    const normalized = items.map(a => ({
      id: a.id,
      type: (a.type as any) || 'trend',
      title: a.title,
      description: a.description,
      timestamp: new Date(a.timestamp),
      isRead: Boolean(a.isRead),
      priority: (a.priority as any) || 'low',
      actionUrl: a.actionUrl,
    }));
    setAlerts(normalized);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_CAREER} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">CareerMusai — Map & Compass</h1>
            <p className="text-xs text-muted-foreground">Know your terrain. Set your true north. Adapt as you grow.</p>
          </div>
          <div className="flex gap-2">
            <Button variant={mode === 'map' ? 'default' : 'outline'} onClick={() => setMode('map')}>
              <MapIcon className="w-4 h-4 mr-2" /> Map
            </Button>
            <Button variant={mode === 'compass' ? 'default' : 'outline'} onClick={() => setMode('compass')}>
              <CompassIcon className="w-4 h-4 mr-2" /> Compass
            </Button>
            <Button variant="outline" onClick={() => navigate(ROUTES.CAREER_MUSAI)}>Info</Button>
          </div>
        </div>

        {mode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Know The Terrain</CardTitle>
                  <CardDescription>Skills, projects, and signals that define your current landscape.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Skills</div>
                    <Input placeholder="React, TypeScript, GraphQL" value={skills} onChange={e => setSkills(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Projects</div>
                    <Input placeholder="Portfolio website, Robotics side project" value={projects} onChange={e => setProjects(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Interests</div>
                    <Input placeholder="Robotics, Rust, Edge AI" value={interests} onChange={e => setInterests(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => seedAndSend('Analyze my terrain and identify strengths, gaps, and near‑term opportunities.')}>Analyze Terrain</Button>
                    <Button variant="outline" onClick={() => seedAndSend('Suggest the top 5 skills to learn next based on market demand and my context.')}>Next Skills</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Nightly Scouts</CardTitle>
                  <CardDescription>Automate searches for roles, skills, or trends. Results appear as alerts or email.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CareerScheduler
                    scheduledSearches={scheduledSearches as any}
                    onScheduleSearch={scheduleSearch}
                    onBack={() => {}}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Alerts</CardTitle>
                  <CardDescription>Notifications from scouts and insights.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{alerts.length} total</Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={refreshAlerts}>Refresh</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsAlertsOpen(true)}>Open</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Conversation</CardTitle>
                  <CardDescription>Ask questions grounded in your context.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChatPrompt onSend={seedAndSend} disabled={isTyping || isLoading} />
                  <div className="mt-3 h-64 overflow-auto border rounded p-2 bg-muted/30">
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
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" /> Set Your True North</CardTitle>
                  <CardDescription>Define where you are aiming. We will chart a course and adapt with you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Current Role</div>
                    <Input placeholder="e.g., Frontend Engineer" value={currentRole} onChange={e => setCurrentRole(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Target Role / Field</div>
                    <Input placeholder="e.g., Staff Engineer — Robotics" value={targetRole} onChange={e => setTargetRole(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Dream (if nothing could stop you)</div>
                    <Textarea placeholder="Describe the dream you’re aiming toward" value={dream} onChange={e => setDream(e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => seedAndSend('Given my True North, propose milestones, skill targets, and checkpoints for the next 6 months. Include measurable criteria.')}>Generate Milestones</Button>
                    <Button variant="outline" onClick={() => seedAndSend('Assess my gaps vs. target role and recommend a weekly practice plan.')}>Gap Analysis</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5" /> Scouts For The Course</CardTitle>
                  <CardDescription>Watch for roles or skills aligned with your bearing.</CardDescription>
                </CardHeader>
                <CardContent>
                  <CareerScheduler
                    scheduledSearches={scheduledSearches as any}
                    onScheduleSearch={scheduleSearch}
                    onBack={() => {}}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Layers className="w-5 h-5" /> Conversation</CardTitle>
                  <CardDescription>Refine your course with dialogue.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChatPrompt onSend={seedAndSend} disabled={isTyping || isLoading} />
                  <div className="mt-3 h-64 overflow-auto border rounded p-2 bg-muted/30">
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
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {isAlertsOpen ? (
          <div className="mt-6">
            <CareerAlerts
              alerts={alerts as any}
              onBack={() => setIsAlertsOpen(false)}
              onDismissAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
            />
          </div>
        ) : null}
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
      <Input placeholder="Ask CareerMusai…" value={text} onChange={(e) => setText(e.target.value)} disabled={disabled} />
      <Button onClick={handle} disabled={disabled || !text.trim()}>
        <Send className="w-4 h-4 mr-1" /> Send
      </Button>
    </div>
  );
}


