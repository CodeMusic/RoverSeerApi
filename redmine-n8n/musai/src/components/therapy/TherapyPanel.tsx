import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, NotebookText, Brain, ArrowRight, Tag, Image as ImageIcon } from 'lucide-react';
import { TherapySession } from '@/types/chat';
import { n8nApi, N8N_ENDPOINTS } from '@/config/n8nEndpoints';

interface TherapyPanelProps {
  session: TherapySession | null;
  onUpdateContext: (sessionId: string, ctx: Partial<TherapySession['therapyContext']>) => void;
}

export const TherapyPanel: React.FC<TherapyPanelProps> = ({ session, onUpdateContext }) =>
{
  const [journalText, setJournalText] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState<string>('');

  useEffect(() => {
    const openHandler = (e: Event) => {
      // reserved for future linking to selected narrative
    };
    window.addEventListener('musai-open-narrative', openHandler as EventListener);
    return () => window.removeEventListener('musai-open-narrative', openHandler as EventListener);
  }, []);

  const mode = session?.therapyContext?.sessionMode || 'standard';
  const arc = session?.therapyContext?.sessionArc || 'intake';

  const handleModeChange = (m: 'standard' | 'journal' | 'shadow' | 'metaphor') =>
  {
    if (!session) return;
    onUpdateContext(session.id, { sessionMode: m });
  };

  const handleAdvanceArc = async () =>
  {
    if (!session) return;
    const nextArc = arc === 'intake' ? 'exploration' : arc === 'exploration' ? 'synthesis' : 'synthesis';
    onUpdateContext(session.id, { sessionArc: nextArc });
    try {
      await fetch(n8nApi.getEndpointUrl(N8N_ENDPOINTS.THERAPY.ADVANCE_ARC), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, nextArc })
      });
    } catch {}
  };

  const handleSaveJournal = async () =>
  {
    if (!session || !journalText.trim()) return;
    try {
      await fetch(n8nApi.getEndpointUrl(N8N_ENDPOINTS.THERAPY.SAVE_JOURNAL_ENTRY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: session.id, 
          text: journalText, 
          mood: mood || session.therapyContext?.currentMood, 
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      setJournalText('');
      setTags('');
    } catch {}
  };

  const handleGenerateImage = async () =>
  {
    if (!session) return;
    try {
      await fetch(n8nApi.getEndpointUrl(N8N_ENDPOINTS.THERAPY.GENERATE_SYMBOLIC_IMAGE), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session.id, prompt: `Create a gentle symbolic image for: ${journalText.slice(0, 120)}` })
      });
    } catch {}
  };

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Therapy Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={mode === 'standard' ? 'default' : 'outline'} onClick={() => handleModeChange('standard')}>Standard</Button>
            <Button size="sm" variant={mode === 'journal' ? 'default' : 'outline'} onClick={() => handleModeChange('journal')}>Journal</Button>
            <Button size="sm" variant={mode === 'shadow' ? 'default' : 'outline'} onClick={() => handleModeChange('shadow')}>Shadow Lab</Button>
            <Button size="sm" variant={mode === 'metaphor' ? 'default' : 'outline'} onClick={() => handleModeChange('metaphor')}>Metaphor Lab</Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-muted-foreground">Arc:</div>
            <Badge variant="secondary">{arc}</Badge>
            <Button size="sm" variant="outline" className="ml-auto" onClick={handleAdvanceArc}>
              Advance <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NotebookText className="h-4 w-4" /> Quick Journal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Textarea placeholder="Write freely..." value={journalText} onChange={(e) => setJournalText(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Mood (e.g., anxious, calm)" value={mood} onChange={(e) => setMood(e.target.value)} />
            <Input placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveJournal}><Send className="h-3.5 w-3.5 mr-1" /> Save</Button>
            <Button size="sm" variant="outline" onClick={handleGenerateImage}><ImageIcon className="h-3.5 w-3.5 mr-1" /> Symbolic Image</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4" /> Export to Narrative
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Create or attach an Emergent Narrative scene to rehearse situations.</p>
          <Button size="sm" variant="outline" onClick={() => {
            window.dispatchEvent(new CustomEvent('musai-export-to-narrative'));
          }}>Open Narrative Panel</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TherapyPanel;


