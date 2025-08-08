import { fetchWithTimeout } from '@/utils/fetchWithTimeout';

export type NarrativeMode = 'general' | 'therapy' | 'career' | 'code' | 'university';

export interface CreateNarrativeRequest {
  title?: string;
  seedText?: string;
  mode?: NarrativeMode;
  tags?: string[];
}

export interface NarrativeSummary {
  id: string;
  title: string;
  mode: NarrativeMode;
  createdAt: number;
  updatedAt: number;
}

class NarrativeApiService
{
  private baseUrl: string;

  public constructor()
  {
    this.baseUrl = import.meta.env.VITE_N8N_BASE_URL || '/api/n8n';
  }

  public async createNarrative(payload: CreateNarrativeRequest): Promise<NarrativeSummary>
  {
    const response = await fetchWithTimeout(`${this.baseUrl}/narratives/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 10000);

    if (!response.ok)
    {
      throw new Error(`Failed to create narrative: ${response.status}`);
    }
    return await response.json();
  }

  public async listNarratives(mode?: NarrativeMode): Promise<NarrativeSummary[]>
  {
    const url = mode ? `${this.baseUrl}/narratives/list?mode=${mode}` : `${this.baseUrl}/narratives/list`;
    const response = await fetchWithTimeout(url, { method: 'GET' }, 10000);
    if (!response.ok)
    {
      throw new Error(`Failed to list narratives: ${response.status}`);
    }
    return await response.json();
  }
}

export const narrativeApi = new NarrativeApiService();


