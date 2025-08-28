import { N8N_ENDPOINTS, n8nApi } from '@/config/n8nEndpoints';
import { MUSAI_MODULES } from '@/config/constants';
import { queuedFetch } from '@/lib/AttentionalRequestQueue';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { TIMEOUTS } from '@/config/timeouts';
import { withN8nAuthHeaders } from '@/lib/n8nClient';

export interface EyeTrainRequest {
  classes?: Array<{ name: string; prompt?: string }>;
  prompt?: string;
  images?: Array<{ data: string; mimeType: string; fileName?: string; className?: string }>;
}

export interface EyeTrainResponse {
  jobId: string;
  modelVersionId?: string;
  status: 'queued' | 'training' | 'ready' | 'failed';
}

export interface EyeRecognizeRequest {
  image: { data: string; mimeType: string; fileName?: string };
  modelVersionId?: string;
  classes?: string[]; // for zero-shot
}

export interface EyeDetectionBox {
  x: number; y: number; width: number; height: number;
  className: string; confidence: number;
}

export interface EyeRecognizeResponse {
  boxes: EyeDetectionBox[];
  summary?: string;
}

class EyeApiService {
  public async train(payload: EyeTrainRequest): Promise<EyeTrainResponse> {
    const url = n8nApi.getEndpointUrl(N8N_ENDPOINTS.EYE.TRAIN);
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Let wrapper inject composite sessionId; no thread id for global training unless supplied by caller
        query: payload?.prompt || 'Train Eye model',
        params: {
          module: MUSAI_MODULES.EYE,
          debug: true,
          ...payload,
        }
      }),
    }, TIMEOUTS.API_REQUEST);
    if (!res.ok) throw new Error(`Eye train failed: ${res.status}`);
    return res.json();
  }

  public async recognize(payload: EyeRecognizeRequest): Promise<EyeRecognizeResponse> {
    const url = n8nApi.getEndpointUrl(N8N_ENDPOINTS.EYE.RECOGNIZE);
    const res = await queuedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No explicit thread id; recognition can be bound to current chat thread if called from chat context
        query: 'Recognize image',
        params: {
          module: MUSAI_MODULES.EYE,
          debug: true,
          ...payload,
        }
      }),
    }, TIMEOUTS.API_REQUEST);
    if (!res.ok) throw new Error(`Eye recognize failed: ${res.status}`);
    return res.json();
  }

  /**
   * Generate an image from a text prompt using the Eye of Musai generator.
   * Returns a Blob (e.g., image/png) which callers can display via object URL.
   */
  public async generateImage(prompt: string): Promise<Blob>
  {
    const url = n8nApi.getEndpointUrl(N8N_ENDPOINTS.EYE.GENERATE);
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: withN8nAuthHeaders({ 'Content-Type': 'application/json', 'Accept': 'image/*,application/octet-stream,application/json' }) as any,
      body: JSON.stringify({ prompt })
    }, TIMEOUTS.API_REQUEST);
    if (!res.ok) throw new Error(`Eye generate failed: ${res.status}`);

    const contentType = (res.headers.get('Content-Type') || '').toLowerCase();

    // If server returned binary directly, pass it through
    if (contentType.startsWith('image/') || contentType.includes('octet-stream'))
    {
      return await res.blob();
    }

    // Resilience: if server returned JSON with base64 payload, convert to Blob
    if (contentType.includes('application/json') || contentType.includes('text/plain'))
    {
      try
      {
        const json = await res.json();
        const data = (json?.data || json?.image?.data) as string | undefined;
        const mimeType = (json?.mimeType || json?.image?.mimeType || 'image/png') as string;

        if (typeof data === 'string' && data.length > 0)
        {
          const toBase64 = (input: string): string =>
          {
            const commaIndex = input.indexOf(',');
            return commaIndex !== -1 ? input.slice(commaIndex + 1) : input;
          };
          const base64 = toBase64(data);
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++)
          {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          return new Blob([byteArray], { type: mimeType });
        }
      }
      catch
      {
        // Fall through to error below
      }
      throw new Error('Eye generate returned JSON without image data');
    }

    // Unknown content type
    throw new Error(`Unexpected content type: ${contentType || 'unknown'}`);
  }
}

export const eyeApi = new EyeApiService();


