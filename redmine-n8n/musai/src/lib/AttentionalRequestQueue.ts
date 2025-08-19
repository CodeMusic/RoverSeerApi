/*
 * AttentionalRequestQueue
 * Centralized concurrency guard for outbound requests (especially n8n webhooks).
 * - Enforces a maximum number of concurrent requests
 * - Queues overflow
 * - Emits metric events for UI status surfaces
 */

import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { withN8nAuthHeaders } from '@/lib/n8nClient';

export type QueuedRequestMeta =
{
  url: string;
  method?: string;
  label?: string;
  isN8n?: boolean;
  // If provided, the queue will retain the concurrency slot until the named
  // browser event fires. If retainKey is provided, the event's detail.token
  // must match to release the slot.
  retainUntilEvent?: string;
  retainKey?: string;
};

export type QueueMetrics =
{
  activeCount: number;
  queuedCount: number;
  maxConcurrent: number;
  totalStarted: number;
  totalCompleted: number;
  lastLabel?: string;
  // Rolling timing metrics (ms)
  averageDurationMs?: number;
  emaDurationMs?: number;
  lastDurationMs?: number;
  averageDurationByLabelMs?: Record<string, number>;
};

type QueueTask<T> =
{
  run: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  meta: QueuedRequestMeta;
  id: number;
  startedAt?: number;
};

export function getServerMaxConcurrent(): number
{
  try
  {
    const winEnv = (typeof window !== 'undefined' && (window as any).env) ? (window as any).env : undefined;
    const raw = (import.meta as any).env?.VITE_N8N_MAX_CONCURRENCY || winEnv?.VITE_N8N_MAX_CONCURRENCY;
    const parsed = raw ? parseInt(String(raw), 10) : NaN;
    if (!Number.isNaN(parsed) && parsed > 0)
    {
      return parsed;
    }
  }
  catch
  {
    // ignore
  }
  return 3;
}

class AttentionalRequestQueue extends EventTarget
{
  private maxConcurrent: number;
  private activeCount: number;
  private queued: Array<QueueTask<unknown>>;
  private totalStarted: number;
  private totalCompleted: number;
  private lastStartedLabel?: string;
  private taskIdSeq: number;

  // Timing metrics
  private overallDurationSumMs: number;
  private overallDurationCount: number;
  private overallEmaMs?: number;
  private readonly emaAlpha: number;
  private lastDurationMs?: number;
  private labelDurations: Map<string, { sumMs: number; count: number; emaMs?: number }>; 

  public constructor(maxConcurrent: number = getServerMaxConcurrent())
  {
    super();
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
    this.queued = [];
    this.totalStarted = 0;
    this.totalCompleted = 0;
    this.taskIdSeq = 0;

    this.overallDurationSumMs = 0;
    this.overallDurationCount = 0;
    this.overallEmaMs = undefined;
    this.emaAlpha = 0.3;
    this.lastDurationMs = undefined;
    this.labelDurations = new Map();
  }

  public setMaxConcurrent(nextMax: number): void
  {
    this.maxConcurrent = Math.max(1, Math.floor(nextMax));
    this.pump();
    this.emitMetrics();
  }

  public getMetrics(): QueueMetrics
  {
    return {
      activeCount: this.activeCount,
      queuedCount: this.queued.length,
      maxConcurrent: this.maxConcurrent,
      totalStarted: this.totalStarted,
      totalCompleted: this.totalCompleted,
      lastLabel: this.lastStartedLabel,
      averageDurationMs: this.overallDurationCount > 0 ? this.overallDurationSumMs / this.overallDurationCount : undefined,
      emaDurationMs: this.overallEmaMs,
      lastDurationMs: this.lastDurationMs,
      averageDurationByLabelMs: (() => {
        const out: Record<string, number> = {};
        for (const [label, stat] of this.labelDurations.entries())
        {
          if (stat.count > 0)
          {
            out[label] = stat.sumMs / stat.count;
          }
        }
        return out;
      })(),
    };
  }

  public enqueue<T>(runner: () => Promise<T>, meta: QueuedRequestMeta): Promise<T>
  {
    return new Promise<T>((resolve, reject) =>
    {
      const task: QueueTask<T> = { run: runner, resolve, reject, meta, id: ++this.taskIdSeq } as QueueTask<T>;
      this.queued.push(task as QueueTask<unknown>);
      this.pump();
      this.emitMetrics();
    });
  }

  private pump(): void
  {
    while (this.activeCount < this.maxConcurrent && this.queued.length > 0)
    {
      const next = this.queued.shift();
      if (!next)
      {
        break;
      }

      this.activeCount += 1;
      this.totalStarted += 1;
      this.lastStartedLabel = next.meta?.label;
      next.startedAt = Date.now();
      this.emitMetrics();

      next.run()
        .then((value) =>
        {
          this.totalCompleted += 1;
          next.resolve(value);
        })
        .catch((err) =>
        {
          this.totalCompleted += 1;
          next.reject(err);
        })
        .finally(() =>
        {
          const release = () =>
          {
            this.activeCount -= 1;
            if (typeof next.startedAt === 'number')
            {
              const durationMs = Math.max(0, Date.now() - next.startedAt);
              this.lastDurationMs = durationMs;
              // overall
              this.overallDurationSumMs += durationMs;
              this.overallDurationCount += 1;
              this.overallEmaMs = typeof this.overallEmaMs === 'number'
                ? (this.emaAlpha * durationMs) + ((1 - this.emaAlpha) * this.overallEmaMs)
                : durationMs;
              // per label
              const label = next.meta?.label || 'unlabeled';
              const prev = this.labelDurations.get(label) || { sumMs: 0, count: 0, emaMs: undefined };
              const nextEma = typeof prev.emaMs === 'number'
                ? (this.emaAlpha * durationMs) + ((1 - this.emaAlpha) * (prev.emaMs as number))
                : durationMs;
              this.labelDurations.set(label, {
                sumMs: prev.sumMs + durationMs,
                count: prev.count + 1,
                emaMs: nextEma,
              });
            }
            this.emitMetrics();
            this.pump();
          };

          const eventName = next.meta?.retainUntilEvent;
          if (eventName)
          {
            const key = next.meta?.retainKey;
            let released = false;
            const onEvent = (ev: Event) =>
            {
              const token = (ev as CustomEvent<any>).detail?.token;
              if (!key || key === token)
              {
                if (!released)
                {
                  released = true;
                  window.removeEventListener(eventName, onEvent as EventListener);
                  release();
                }
              }
            };
            window.addEventListener(eventName, onEvent as EventListener);
            // Safety timeout in case the consumer forgets to emit the event
            window.setTimeout(() =>
            {
              if (!released)
              {
                window.removeEventListener(eventName, onEvent as EventListener);
                release();
              }
            }, 30 * 60 * 1000); // 30 minutes
          }
          else
          {
            release();
          }
        });
    }
  }

  private emitMetrics(): void
  {
    const metrics = this.getMetrics();
    this.dispatchEvent(new CustomEvent<QueueMetrics>('metrics', { detail: metrics }));
  }
}

export const attentionalRequestQueue = new AttentionalRequestQueue();

// Allow UI to tune the queue within the server cap
export function configureQueueMaxConcurrent(clientRequested: number): void
{
  const serverMax = getServerMaxConcurrent();
  const effective = Math.min(Math.max(1, Math.floor(clientRequested)), serverMax);
  attentionalRequestQueue.setMaxConcurrent(effective);
}

// Convenience wrapper specifically for fetch → routes n8n traffic through the queue
export async function queuedFetch(
  url: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<Response>
{
  const isN8n = url.startsWith(N8N_ENDPOINTS.BASE_URL) || url.includes('/webhook/');

  if (!isN8n)
  {
    // Non-n8n traffic bypasses the queue (still use fetchWithTimeout for consistency)
    return fetchWithTimeout(url, options, timeoutMs ?? undefined as any);
  }

  const existingHeaders = (options.headers || {}) as Record<string, string>;
  const clientId = (() => {
    try {
      return window.localStorage.getItem('musai.clientId') || '';
    } catch {
      return '';
    }
  })();
  const identityHeaders: Record<string, string> = {
    'X-Musai-Client-Id': clientId,
    'X-Musai-User-Agent': navigator.userAgent,
  };
  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...withN8nAuthHeaders(existingHeaders),
      ...identityHeaders,
    },
  };

  // Heuristic label for UI expectations
  const inferLabel = (): string =>
  {
    const explicit = (existingHeaders['X-Musai-Task-Label'] || existingHeaders['x-musai-task-label']);
    if (explicit && typeof explicit === 'string')
    {
      return explicit;
    }
    try
    {
      const path = new URL(url, window.location.origin).pathname.toLowerCase();
      if (path.includes('/chat/')) return 'chat-regular';
      if (path.includes('/eye/')) return 'vision';
      if (path.includes('/code/')) return 'code';
      if (path.includes('/medical/')) return 'medical';
      if (path.includes('/narrative/')) return 'narrative';
    }
    catch
    {
      // ignore
    }
    return 'n8n-webhook';
  };

  // Optional stream retention token lets the queue hold the concurrency slot
  const streamToken = (existingHeaders['X-Musai-Stream-Token'] || existingHeaders['x-musai-stream-token']) as string | undefined;

  return attentionalRequestQueue.enqueue<Response>(
    async () =>
    {
      return fetchWithTimeout(url, mergedOptions, timeoutMs ?? undefined as any);
    },
    {
      url,
      method: mergedOptions.method,
      label: inferLabel(),
      isN8n: true,
      retainUntilEvent: streamToken ? 'musai-stream-end' : undefined,
      retainKey: streamToken || undefined,
    }
  );
}


