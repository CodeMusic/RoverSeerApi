import { N8N_ENDPOINTS, n8nApi } from '@/config/n8nEndpoints';
import { MUSAI_MODULES } from '@/config/constants';
import { queuedFetch } from '@/lib/AttentionalRequestQueue';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { TIMEOUTS } from '@/config/timeouts';

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
        sessionId: undefined,
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
        sessionId: undefined,
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
}

export const eyeApi = new EyeApiService();


