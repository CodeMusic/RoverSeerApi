/*
 * PresenceService
 * Creates a stable client identity and emits heartbeats to n8n analytics so the backend
 * can count distinct active users by client IP. Also exposes an event for active user counts
 * if the backend returns them via performance endpoint.
 */

import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { queuedFetch } from '@/lib/AttentionalRequestQueue';

export type PresenceEvent =
{
  activeUsers?: number;
};

class PresenceService extends EventTarget
{
  private clientId: string;
  private heartbeatIntervalId: number | null;
  private baseUrl: string;

  public constructor()
  {
    super();
    this.clientId = this.resolveClientId();
    this.heartbeatIntervalId = null;
    this.baseUrl = N8N_ENDPOINTS.BASE_URL;
  }

  public getClientId(): string
  {
    return this.clientId;
  }

  public getClientHeaders(): Record<string, string>
  {
    return {
      'X-Musai-Client-Id': this.clientId,
      'X-Musai-User-Agent': navigator.userAgent,
    };
  }

  public startHeartbeat(periodMs: number = 30000): void
  {
    // Send initial ping immediately
    this.sendHeartbeat().catch(() => void 0);

    if (this.heartbeatIntervalId !== null)
    {
      window.clearInterval(this.heartbeatIntervalId);
    }

    this.heartbeatIntervalId = window.setInterval(() =>
    {
      this.sendHeartbeat().catch(() => void 0);
      this.refreshActiveUsers().catch(() => void 0);
    }, periodMs);
  }

  public stopHeartbeat(): void
  {
    if (this.heartbeatIntervalId !== null)
    {
      window.clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  public async refreshActiveUsers(): Promise<void>
  {
    try
    {
      const response = await queuedFetch(`${this.baseUrl}${N8N_ENDPOINTS.ANALYTICS.PERFORMANCE}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getClientHeaders(),
        }
      }, 10000);

      if (!response.ok)
      {
        return;
      }
      const data = await response.json();
      const activeUsers = typeof data?.activeUsers === 'number' ? data.activeUsers : undefined;
      if (activeUsers !== undefined)
      {
        this.dispatchEvent(new CustomEvent<PresenceEvent>('presence', { detail: { activeUsers } }));
      }
    }
    catch
    {
      // ignore
    }
  }

  private async sendHeartbeat(): Promise<void>
  {
    try
    {
      await queuedFetch(`${this.baseUrl}${N8N_ENDPOINTS.ANALYTICS.TRACK_USER_JOURNEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getClientHeaders(),
        },
        body: JSON.stringify({
          toolType: 'system',
          action: 'presence_ping',
          context: { clientId: this.clientId, ts: Date.now() },
          timestamp: Date.now(),
        })
      }, 8000);
    }
    catch
    {
      // swallow errors
    }
  }

  private resolveClientId(): string
  {
    const key = 'musai.clientId';
    try
    {
      const existing = window.localStorage.getItem(key);
      if (existing && existing.length > 0)
      {
        return existing;
      }
    }
    catch
    {
      // Access to localStorage can fail in some environments (e.g., private mode)
    }

    const createUuid = () =>
    {
      const globalCrypto = typeof globalThis !== 'undefined' ? (globalThis.crypto ?? undefined) : undefined;
      if (globalCrypto)
      {
        if (typeof globalCrypto.randomUUID === 'function')
        {
          return globalCrypto.randomUUID();
        }
        if (typeof globalCrypto.getRandomValues === 'function')
        {
          const bytes = new Uint8Array(16);
          globalCrypto.getRandomValues(bytes);
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          bytes[8] = (bytes[8] & 0x3f) | 0x80;
          const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
          return [
            hex.slice(0, 4).join(''),
            hex.slice(4, 6).join(''),
            hex.slice(6, 8).join(''),
            hex.slice(8, 10).join(''),
            hex.slice(10, 16).join('')
          ].join('-');
        }
      }
      const time = Date.now().toString(36);
      const random = Math.random().toString(36).slice(2, 10);
      return `musai-${time}-${random}`;
    };

    const next = createUuid();

    try
    {
      window.localStorage.setItem(key, next);
    }
    catch
    {
      // Ignore persistence errors; caller will still receive the generated id
    }

    return next;
  }
}

export const presenceService = new PresenceService();

