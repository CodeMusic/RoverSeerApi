import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Sparkles, Loader2 } from 'lucide-react';
import { useMusaiDiscovery } from '@/hooks/useMusaiDiscovery';

interface TopCopilotLauncherProps {
  className?: string;
}

export const TopCopilotLauncher: React.FC<TopCopilotLauncherProps> = ({ className }) =>
{
  const [query, setQuery] = useState('');
  const { isDiscovering, runDiscovery } = useMusaiDiscovery();

  const placeholder = useMemo(() =>
  {
    if (!query.trim())
    {
      return 'Ask Musai to open a world…';
    }
    return 'Press enter to summon the right Muse';
  }, [query]);

  const handleSubmit = useCallback(async (event?: React.FormEvent) =>
  {
    event?.preventDefault();
    await runDiscovery(query);
    setQuery('');
  }, [query, runDiscovery]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('relative group flex-1 w-full min-w-0', className)}
      role="search"
      aria-label="Musai Copilot quick summon"
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-sky-500 opacity-60 blur-xl group-hover:opacity-80 transition-opacity duration-500" aria-hidden />
      <div className="relative flex items-center gap-2 rounded-3xl border border-white/20 bg-slate-950/30 backdrop-blur-xl shadow-lg overflow-hidden w-full px-3 py-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-11 rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none"
          autoComplete="off"
          disabled={isDiscovering}
        />
        <Button
          type="submit"
          size="sm"
          className="h-11 w-11 rounded-2xl bg-white/20 hover:bg-white/30 text-white shadow-lg flex items-center justify-center"
          aria-label="Discover Musai tool"
        >
          {isDiscovering ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
};

export default TopCopilotLauncher;
