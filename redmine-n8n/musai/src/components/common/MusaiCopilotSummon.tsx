import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMusaiDiscovery } from '@/hooks/useMusaiDiscovery';

interface MusaiCopilotSummonProps {
  className?: string;
  placeholder?: string;
  defaultQuery?: string;
}

export const MusaiCopilotSummon: React.FC<MusaiCopilotSummonProps> = ({
  className,
  placeholder,
  defaultQuery = ''
}) =>
{
  const [query, setQuery] = useState(defaultQuery);
  const [perspectiveEnabled, setPerspectiveEnabled] = useState<boolean>(() =>
  {
    try { return (window as any).__musai_perspective_enabled !== false; } catch { return true; }
  });
  const { isDiscovering, runDiscovery } = useMusaiDiscovery();

  const effectivePlaceholder = useMemo(() =>
    placeholder || 'Ask Musai to guide the next move…',
  [placeholder]);

  const handleSubmit = async (e: React.FormEvent) =>
  {
    e.preventDefault();
    await runDiscovery(query);
    setQuery('');
  };

  return (
    <form onSubmit={handleSubmit} className={cn('musai-copilot-dock', className)}>
      <div className="musai-copilot-glow" aria-hidden />
      <div className="musai-copilot-panel">
        <header className="musai-copilot-header">
          <div className="musai-copilot-title">
            <Sparkles className="h-3 w-3" aria-hidden />
            Musai Copilot
          </div>
          <div className="musai-copilot-badge">Navigator</div>
        </header>

        <div className="musai-copilot-controls">
          <div className="flex items-center gap-2">
            <span className="musai-copilot-label">POV</span>
            <div className="musai-copilot-toggle">
              <button
                type="button"
                className={cn('musai-copilot-toggle-button', !perspectiveEnabled && 'is-active')}
                onClick={() =>
                {
                  setPerspectiveEnabled(false);
                  try { (window as any).__musai_perspective_enabled = false; } catch {}
                }}
              >
                Quick
              </button>
              <button
                type="button"
                className={cn('musai-copilot-toggle-button', perspectiveEnabled && 'is-active')}
                onClick={() =>
                {
                  setPerspectiveEnabled(true);
                  try { (window as any).__musai_perspective_enabled = true; } catch {}
                }}
              >
                Perspective
              </button>
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/70">
            Fusion Router
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={effectivePlaceholder}
            className="flex-1 h-12 rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
            disabled={isDiscovering}
          />
          <Button type="submit" className="musai-copilot-send">
            {isDiscovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default MusaiCopilotSummon;
