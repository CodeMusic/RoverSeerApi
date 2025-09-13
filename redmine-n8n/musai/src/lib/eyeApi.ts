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

  public async recognize(payload: EyeRecognizeRequest): Promise<EyeRecognizeResponse>
  {
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

    const contentType = (res.headers.get('Content-Type') || '').toLowerCase();

    // Accept both JSON and plain text. Map any text content to summary.
    if (contentType.includes('application/json') || contentType.includes('text/plain'))
    {
      try
      {
        // Prefer JSON parse; if it fails for text/plain, fall back to text
        const maybeJson = contentType.includes('application/json') ? await res.json() : undefined;
        if (maybeJson && typeof maybeJson === 'object')
        {
          const boxes = Array.isArray((maybeJson as any).boxes) ? (maybeJson as any).boxes : [];
          const summary =
            typeof (maybeJson as any).summary === 'string' ? (maybeJson as any).summary :
            typeof (maybeJson as any).text === 'string' ? (maybeJson as any).text :
            typeof (maybeJson as any).message === 'string' ? (maybeJson as any).message :
            typeof (maybeJson as any).result === 'string' ? (maybeJson as any).result :
            undefined;
          return { boxes, summary } as EyeRecognizeResponse;
        }
      }
      catch
      {
        // ignore and try text path
      }

      try
      {
        const text = await res.text();
        return { boxes: [], summary: text } as EyeRecognizeResponse;
      }
      catch
      {
        // fall through
      }
    }

    // Fallback: attempt JSON; if it fails, throw a helpful error
    try
    {
      const json = await res.json();
      const boxes = Array.isArray((json as any).boxes) ? (json as any).boxes : [];
      const summary = typeof (json as any).summary === 'string' ? (json as any).summary : undefined;
      return { boxes, summary } as EyeRecognizeResponse;
    }
    catch (e)
    {
      throw new Error('Eye recognize returned an unexpected format.');
    }
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

    // If server returned binary directly, normalize blob type so browsers infer the right extension
    if (contentType.startsWith('image/') || contentType.includes('octet-stream'))
    {
      const raw = await res.blob();

      // If the server already marked it as an image/*, return as-is
      if (raw.type && raw.type.startsWith('image/'))
      {
        return raw;
      }

      // Some servers respond as octet-stream; detect magic bytes to set correct type
      try
      {
        const header = await raw.slice(0, 16).arrayBuffer();
        const bytes = new Uint8Array(header);

        const isPng = bytes.length >= 8 &&
          bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47 &&
          bytes[4] === 0x0D && bytes[5] === 0x0A && bytes[6] === 0x1A && bytes[7] === 0x0A;

        const isJpeg = bytes.length >= 3 && bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;

        const isGif = bytes.length >= 6 &&
          bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
          (bytes[4] === 0x39 || bytes[4] === 0x37) && bytes[5] === 0x61; // GIF89a or GIF87a

        const isWebp = bytes.length >= 12 &&
          bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // RIFF
          bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;  // WEBP

        let detected: string | null = null;
        if (isPng) detected = 'image/png';
        else if (isJpeg) detected = 'image/jpeg';
        else if (isGif) detected = 'image/gif';
        else if (isWebp) detected = 'image/webp';

        if (detected)
        {
          return new Blob([raw], { type: detected });
        }
      }
      catch
      {
        // Ignore detection errors and fall through
      }

      // Fallback: return original blob (may save without extension via context menu)
      return raw;
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

  /**
   * MagicEye upload — post the given image to the ComfyUI MagicEye webhook.
   * Server returns a job or image response depending on workflow configuration.
   */
  public async magicEyeUpload(payload: EyeRecognizeRequest, _prompt?: string): Promise<any>
  {
    const url = n8nApi.getEndpointUrl(N8N_ENDPOINTS.EYE.MAGIC_EYE);
    const res = await queuedFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'MagicEye upload',
        params: {
          module: MUSAI_MODULES.EYE,
          debug: true,
          image: payload.image
        }
      })
    }, TIMEOUTS.API_REQUEST);
    if (!res.ok) throw new Error(`MagicEye upload failed: ${res.status}`);
    const contentType = (res.headers.get('Content-Type') || '').toLowerCase();
    if (contentType.includes('application/json') || contentType.includes('text/plain'))
    {
      return res.json();
    }
    // If pipeline returns an image blob directly
    return res.blob();
  }
}

export const eyeApi = new EyeApiService();


