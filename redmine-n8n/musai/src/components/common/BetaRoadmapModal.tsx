import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type BetaRoadmapModalProps =
{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * BetaRoadmapModal
 *
 * Mirrors the Riddle/Victory aesthetic. Loads a beta-specific roadmap JSON file if present,
 * else shows a short curated list. Intended for early testers who reached the site.
 */
export function BetaRoadmapModal(props: BetaRoadmapModalProps)
{
  const { isOpen, onOpenChange } = props;
  const [items, setItems] = useState<Array<{ title: string; note?: string; date?: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() =>
  {
    if (!isOpen)
    {
      return;
    }
    let cancelled = false;
    (async () =>
    {
      setError(null);
      try
      {
        const res = await fetch('/beta-roadmap.json', { cache: 'no-store' });
        if (!res.ok)
        {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled)
        {
          setItems(Array.isArray(data?.items) ? data.items : []);
        }
      }
      catch
      {
        if (!cancelled)
        {
          setItems([
            { title: 'Stability passes on ChatMusai' },
            { title: 'Activity monitor for local concurrency' },
            { title: 'Agent flow debugging toggle' },
            { title: 'OpenAI key support (frontier), then hybrid' },
          ]);
          setError('Custom beta roadmap not found. Showing default outline.');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-hidden">
        <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-fuchsia-500/20 via-purple-500/20 to-cyan-500/20 blur" />
        <div className="relative">
          <DialogHeader>
            <DialogTitle className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-fuchsia-600 to-cyan-600 bg-clip-text text-transparent">
              Beta Roadmap
            </DialogTitle>
            <DialogDescription className="text-sm">
              What testers can expect as the private beta evolves.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {error && (
              <div className="text-xs text-muted-foreground">{error}</div>
            )}
            <ul className="space-y-2">
              {items.map((it, idx) => (
                <li key={idx} className="rounded-md border p-3 bg-background/70">
                  <div className="text-sm font-medium flex items-center justify-between gap-2">
                    <span>{it.title}</span>
                    {it.date && (
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{it.date}</span>
                    )}
                  </div>
                  {it.note && (
                    <div className="text-xs text-muted-foreground mt-1">{it.note}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BetaRoadmapModal;


