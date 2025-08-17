import { queuedFetch } from '@/lib/AttentionalRequestQueue';
import { MUSAI_MODULES } from '@/config/constants';
import { N8N_ENDPOINTS } from '@/config/n8nEndpoints';

export type NarrativeMode = 'general' | 'therapy' | 'career' | 'code' | 'university';

export interface FrameworkRequest {
  seedText: string;
  mode?: NarrativeMode;
  tone?: string;
  genre?: string;
}

export interface FrameworkResponse {
  title: string;
  description: string;
  acts: Array<{ id: string; title: string; description: string; progression: string[] }>;
}

export interface CharactersFromFrameworkRequest {
  title: string;
  description: string;
  acts: Array<{ id: string; title: string; description: string; progression: string[] }>;
  constraints?: { tone?: string; genre?: string; count?: number; notes?: string };
}

export interface CharacterModel {
  id: string;
  name: string;
  personality: { courage: number; empathy: number; logic: number; impulsiveness: number };
  speechStyle: string;
  coreBeliefs: string;
  systemMessage: string;
  description?: string;
  avatar?: string;
}

export interface CharactersFromFrameworkResponse {
  characters: CharacterModel[];
}

export interface CreateWithScenesRequest {
  title: string;
  description: string;
  mode?: NarrativeMode;
  acts: Array<{ id: string; title: string; description: string; progression: string[]; scenes?: any[] }>;
  characters: CharacterModel[];
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
    this.baseUrl = N8N_ENDPOINTS.BASE_URL;
  }

  public async getFramework(payload: FrameworkRequest): Promise<FrameworkResponse>
  {
    const response = await queuedFetch(`${this.baseUrl}${N8N_ENDPOINTS.NARRATIVE.FRAMEWORK}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No explicit thread id here; callers may pass it via payload in future if needed
        query: payload.seedText,
        params: {
          module: MUSAI_MODULES.NARRATIVE,
          debug: true,
          ...payload
        }
      })
    }, 10000);
    if (!response.ok) throw new Error(`Failed to get framework: ${response.status}`);
    return await response.json();
  }

  public async suggestCharacters(payload: CharactersFromFrameworkRequest): Promise<CharactersFromFrameworkResponse>
  {
    const response = await queuedFetch(`${this.baseUrl}${N8N_ENDPOINTS.NARRATIVE.CHARACTERS_FROM_FRAMEWORK}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No explicit thread id
        query: `Suggest characters for ${payload.title}`,
        params: {
          module: MUSAI_MODULES.NARRATIVE,
          debug: true,
          ...payload
        }
      })
    }, 10000);
    if (!response.ok) throw new Error(`Failed to get characters: ${response.status}`);
    return await response.json();
  }

  public async createWithScenes(payload: CreateWithScenesRequest): Promise<NarrativeSummary>
  {
    const response = await queuedFetch(`${this.baseUrl}${N8N_ENDPOINTS.NARRATIVE.CREATE_WITH_SCENES}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No explicit thread id
        query: `Create narrative ${payload.title}`,
        params: {
          module: MUSAI_MODULES.NARRATIVE,
          debug: true,
          ...payload
        }
      })
    }, 15000);
    if (!response.ok) throw new Error(`Failed to create narrative: ${response.status}`);
    return await response.json();
  }

  public async listNarratives(mode?: NarrativeMode): Promise<NarrativeSummary[]>
  {
    const url = mode ? `${this.baseUrl}/narratives/list?mode=${mode}` : `${this.baseUrl}/narratives/list`;
    const response = await queuedFetch(url, { method: 'GET' }, 10000);
    if (!response.ok)
    {
      throw new Error(`Failed to list narratives: ${response.status}`);
    }
    return await response.json();
  }
}

export const narrativeApi = new NarrativeApiService();


