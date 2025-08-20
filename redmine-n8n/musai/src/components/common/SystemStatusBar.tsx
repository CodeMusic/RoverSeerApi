import React, { useEffect, useMemo, useState } from 'react';
import { useMusaiStatus } from '@/contexts/MusaiStatusContext';
import { attentionalRequestQueue } from '@/lib/AttentionalRequestQueue';
import { DurationRange, estimateDurationRangeFromMetrics, formatRange, getLocalCapabilities, inferTaskComplexityFromLabel, typicalDurationRangeFor } from '@/lib/SystemVitals';

type LastTask =
{
  label?: string;
  startedAt?: number;
  complexity?: ReturnType<typeof inferTaskComplexityFromLabel>;
  expected?: DurationRange;
};

export function SystemStatusBar()
{
  const { status } = useMusaiStatus();
  const [lastTask, setLastTask] = useState<LastTask | null>(null);
  const caps = useMemo(() => getLocalCapabilities(), []);

  useEffect(() =>
  {
    const onMetrics = (ev: Event) =>
    {
      const detail = (ev as CustomEvent<any>).detail as { activeCount: number; queuedCount: number; maxConcurrent: number; totalStarted: number; totalCompleted: number; lastLabel?: string; averageDurationMs?: number; emaDurationMs?: number; averageDurationByLabelMs?: Record<string, number> };
      const now = Date.now();
      setLastTask(prev =>
      {
        // Start a new clock when a new task begins or when active transitions from 0
        if (!prev || (status.activeRequests || 0) === 0 || detail.lastLabel !== prev.label)
        {
          const complexity = inferTaskComplexityFromLabel(detail.lastLabel);
          const heuristic = typicalDurationRangeFor(complexity);
          const adaptive = estimateDurationRangeFromMetrics({
            emaDurationMs: detail.emaDurationMs,
            averageDurationMs: detail.averageDurationMs,
            averageDurationByLabelMs: detail.averageDurationByLabelMs,
          }, detail.lastLabel, heuristic);
          return { label: detail.lastLabel, startedAt: now, complexity, expected: adaptive };
        }
        return prev;
      });
    };
    attentionalRequestQueue.addEventListener('metrics', onMetrics as EventListener);
    return () => attentionalRequestQueue.removeEventListener('metrics', onMetrics as EventListener);
  }, [status.activeRequests]);

  const etaText = useMemo(() =>
  {
    if (!lastTask || !lastTask.expected) return '—';
    const text = formatRange(lastTask.expected);
    return lastTask.label ? `${text} (${lastTask.label})` : text;
  }, [lastTask]);

  const avgMs = status.averageRequestDurationMs;
  const emaMs = status.emaRequestDurationMs;
  const lastMs = status.lastRequestDurationMs;
  const formatMs = (ms?: number) =>
  {
    if (typeof ms !== 'number') return '—';
    if (ms < 1000) return `${ms|0}ms`;
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(1)}s`;
    const m = s / 60;
    return `${m.toFixed(1)}m`;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] pointer-events-none">
      <div className="mx-auto max-w-5xl">
        <div className="m-2 px-3 py-2 rounded-lg bg-black/60 text-white text-xs flex items-center gap-3 shadow-lg backdrop-blur pointer-events-auto">
          <span className="opacity-80">Requests:</span>
          <span>{status.activeRequests ?? 0} active</span>
          <span>•</span>
          <span>{status.queuedRequests ?? 0} queued</span>
          <span className="opacity-70">(max {status.maxConcurrentRequests ?? 0})</span>
          <span className="mx-2">|</span>
          <span className="opacity-80">ETA:</span>
          <span>typical {etaText}</span>
          <span>•</span>
          <span>avg {formatMs(avgMs)}</span>
          <span>•</span>
          <span>ema {formatMs(emaMs)}</span>
          <span>•</span>
          <span>last {formatMs(lastMs)}</span>
          <span className="mx-2">|</span>
          <span className="opacity-80">Machine:</span>
          <span>{caps.hardwareThreads ? `${caps.hardwareThreads} threads` : 'n/a'}</span>
          <span>•</span>
          <span>{typeof caps.deviceMemoryGb === 'number' ? `${caps.deviceMemoryGb} GB` : 'mem n/a'}</span>
          <span>•</span>
          <span>{caps.networkType || 'net n/a'}{typeof caps.downlinkMbps === 'number' ? ` ${caps.downlinkMbps}Mbps` : ''}{typeof caps.rttMs === 'number' ? ` ~${caps.rttMs}ms` : ''}</span>
        </div>
      </div>
    </div>
  );
}


