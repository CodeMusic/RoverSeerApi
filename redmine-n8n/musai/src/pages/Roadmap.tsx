import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ExternalLink, RefreshCcw } from 'lucide-react';
import { AttentionalGatewayHeader } from '@/components/common/AttentionalGatewayHeader';
import { APP_TERMS } from '@/config/constants';
import { InfoFooterNav } from '@/components/common/InfoFooterNav';

type RoadmapItem = { label: string; done: boolean };
type RoadmapPhase = { name: string; items: RoadmapItem[] };
type RoadmapData = {
  updatedAt: string;
  summary: string;
  latestUpdates: { date: string; title: string; details?: string }[];
  phases: RoadmapPhase[];
};

const Roadmap: React.FC = () =>
{
  const [data, setData] = useState<RoadmapData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () =>
  {
    try
    {
      setLoading(true);
      const res = await fetch('/roadmap.json', { cache: 'no-cache' });
      if (!res.ok)
      {
        throw new Error('Failed to load roadmap');
      }
      const json = await res.json();
      setData(json);
      setError(null);
    }
    catch (e: any)
    {
      setError(e?.message || 'Failed to load');
    }
    finally
    {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading)
  {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading roadmap…</div>
      </div>
    );
  }

  if (error || !data)
  {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-3 text-sm text-muted-foreground">{error || 'No data'}</div>
          <Button onClick={fetchData}><RefreshCcw className="w-4 h-4 mr-2" /> Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AttentionalGatewayHeader defaultTabId={APP_TERMS.TAB_SEARCH} />
      <div className="container mx-auto px-4 py-14 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Musai Roadmap</h1>
          <div className="text-sm text-muted-foreground mt-1">Updated {data.updatedAt}</div>
          <p className="mt-3 text-muted-foreground">{data.summary}</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Latest project updates</CardTitle>
            <CardDescription>Recent changes across modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.latestUpdates.map((u, idx) => (
              <div key={idx} className="p-3 rounded-lg border bg-card">
                <div className="text-sm font-medium">{u.title}</div>
                <div className="text-xs text-muted-foreground">{u.date}</div>
                {u.details && <div className="text-sm text-muted-foreground mt-1">{u.details}</div>}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {data.phases.map((phase, i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle>{phase.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {phase.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${it.done ? 'bg-green-500/80 border-green-600 text-white' : 'bg-transparent'}`}>
                        {it.done && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-sm text-foreground/90">{it.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a href="/roadmap.json" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm underline text-muted-foreground hover:text-foreground">
            View raw roadmap data <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
        <InfoFooterNav />
      </div>
    </div>
  );
};

export default Roadmap;


