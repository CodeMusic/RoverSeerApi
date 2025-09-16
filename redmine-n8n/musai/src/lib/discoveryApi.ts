import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';
import { ensureN8nSessionInBody, withN8nAuthHeaders } from '@/lib/n8nClient';

export const DISCOVERY_TIMEOUT_MS = 30_000;

export type MusaiDiscoverModule =
  | 'chat'
  | 'search'
  | 'research'
  | 'university'
  | 'tale'
  | 'story'
  | 'eye'
  | 'medical'
  | 'therapy'
  | 'agile'
  | 'code'
  | 'career';

const parseModuleCandidate = (raw: string): string | null =>
{
  const trimmed = raw.trim();
  if (!trimmed)
  {
    return null;
  }

  try
  {
    const data = JSON.parse(trimmed) as unknown;
    if (typeof data === 'string')
    {
      return data;
    }
    if (data && typeof data === 'object')
    {
      const record = data as Record<string, unknown>;
      const potentialKeys = ['musaiType', 'module', 'musai', 'tool', 'destination', 'route', 'mode'];
      for (const key of potentialKeys)
      {
        const value = record[key];
        if (typeof value === 'string')
        {
          return value;
        }
      }
    }
  }
  catch
  {
    // If body was plain text, fall through and use the raw string
  }

  return trimmed;
};

const normalizeModule = (value: string): MusaiDiscoverModule =>
{
  const next = value.trim().toLowerCase();
  switch (next)
  {
    case 'chat':
    case 'musai-chat':
    case 'conversation':
      return 'chat';
    case 'search':
    case 'discover':
    case 'find':
      return 'search';
    case 'research':
    case 'researcher':
      return 'research';
    case 'university':
    case 'learning':
    case 'course':
    case 'school':
      return 'university';
    case 'tale':
    case 'narrative':
      return 'tale';
    case 'story':
    case 'storymode':
      return 'story';
    case 'eye':
    case 'vision':
    case 'perceive':
      return 'eye';
    case 'medical':
    case 'health':
      return 'medical';
    case 'therapy':
    case 'wellness':
      return 'therapy';
    case 'agile':
    case 'task':
    case 'taskmusai':
      return 'agile';
    case 'code':
    case 'codemusai':
    case 'developer':
      return 'code';
    case 'career':
    case 'work':
      return 'career';
    default:
      return 'chat';
  }
};

export async function discoverMusaiModule(query: string): Promise<MusaiDiscoverModule>
{
  const url = `${N8N_ENDPOINTS.BASE_URL}${N8N_ENDPOINTS.DISCOVERY.DISCOVER}`;
  const rawBody = JSON.stringify({ query });
  const { updatedBody, headerSessionId } = ensureN8nSessionInBody(rawBody, 'application/json');
  const baseHeaders = withN8nAuthHeaders({ 'Content-Type': 'application/json' });
  const headers = new Headers(baseHeaders as HeadersInit);
  headers.set('Content-Type', 'application/json');
  headers.set('X-Musai-Session-Id', headerSessionId);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);

  try
  {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: updatedBody,
      signal: controller.signal,
    });

    if (!response.ok)
    {
      throw new Error(`Discovery failed with status ${response.status}`);
    }

    const raw = await response.text();
    const candidate = raw ? parseModuleCandidate(raw) : null;
    return candidate ? normalizeModule(candidate) : 'chat';
  }
  catch (error)
  {
    if (process.env.NODE_ENV !== 'production')
    {
      console.warn('Musai discovery request failed', error);
    }
    return 'chat';
  }
  finally
  {
    clearTimeout(timeoutId);
  }
}
