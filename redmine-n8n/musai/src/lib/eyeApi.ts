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
    });
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
      headers: withN8nAuthHeaders({ 'Content-Type': 'application/json' }) as any,
      body: JSON.stringify({ prompt })
    }, TIMEOUTS.API_REQUEST);
    if (!res.ok) throw new Error(`Eye generate failed: ${res.status}`);
    return await res.blob();
  }
}

export const eyeApi = new EyeApiService();


