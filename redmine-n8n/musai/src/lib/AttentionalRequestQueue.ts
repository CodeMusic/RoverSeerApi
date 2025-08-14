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
};

export type QueueMetrics =
{
  activeCount: number;
  queuedCount: number;
  maxConcurrent: number;
  totalStarted: number;
  totalCompleted: number;
};

type QueueTask<T> =
{
  run: () => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
  meta: QueuedRequestMeta;
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

  public constructor(maxConcurrent: number = getServerMaxConcurrent())
  {
    super();
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
    this.queued = [];
    this.totalStarted = 0;
    this.totalCompleted = 0;
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
    };
  }

  public enqueue<T>(runner: () => Promise<T>, meta: QueuedRequestMeta): Promise<T>
  {
    return new Promise<T>((resolve, reject) =>
    {
      const task: QueueTask<T> = { run: runner, resolve, reject, meta } as QueueTask<T>;
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
          this.activeCount -= 1;
          this.emitMetrics();
          this.pump();
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

  return attentionalRequestQueue.enqueue<Response>(
    async () =>
    {
      return fetchWithTimeout(url, mergedOptions, timeoutMs ?? undefined as any);
    },
    {
      url,
      method: mergedOptions.method,
      label: 'n8n-webhook',
      isN8n: true,
    }
  );
}


