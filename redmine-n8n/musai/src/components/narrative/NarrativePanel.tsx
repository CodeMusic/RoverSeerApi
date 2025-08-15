import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { narrativeApi, NarrativeSummary } from '@/lib/narrativeApi';
import { Sparkles, BookOpen } from 'lucide-react';

interface NarrativePanelProps {
  mode: 'therapy' | 'general' | 'career' | 'code' | 'university';
}

export const NarrativePanel: React.FC<NarrativePanelProps> = ({ mode }) =>
{
  const [seed, setSeed] = useState('');
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [list, setList] = useState<NarrativeSummary[]>([]);

  const load = async () =>
  {
    try { setList(await narrativeApi.listNarratives(mode)); } catch {}
  };

  useEffect(() => { load(); }, [mode]);

  const handleCreate = async () =>
  {
    // This panel no longer creates directly; it lists narratives and provides an open hook.
    // Keeping the UI button for compatibility; disable action.
    return;
  };

  return (
    <div className="h-full p-4 space-y-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Create {mode === 'therapy' ? 'Therapy' : ''} Narrative
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Seed text or idea..." value={seed} onChange={(e) => setSeed(e.target.value)} />
          <Button onClick={handleCreate} disabled title="Creation is handled in MusaiTale flow">Create</Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {list.map(item => (
          <Card key={item.id} className="hover:bg-accent/40 transition-colors">
            <CardContent className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground">{new Date(item.updatedAt).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                // Dispatch a custom event to notify therapy pane to attach narrative
                const evt = new CustomEvent('musai-open-narrative', { detail: { id: item.id } });
                window.dispatchEvent(evt);
              }}>
                <BookOpen className="h-4 w-4 mr-1" /> Open
              </Button>
            </CardContent>
          </Card>
        ))}
        {list.length === 0 && (
          <div className="text-sm text-muted-foreground">No narratives yet.</div>
        )}
      </div>
    </div>
  );
};

export default NarrativePanel;


