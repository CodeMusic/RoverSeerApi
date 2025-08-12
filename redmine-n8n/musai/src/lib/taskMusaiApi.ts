import { N8N_ENDPOINTS, n8nApi } from '@/config/n8nEndpoints';
import { queuedFetch } from '@/lib/AttentionalRequestQueue';

export interface StartSprintRequest
{
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  initialStories?: Array<{ title: string; description?: string }>;
}

export interface SprintStatus
{
  sprintId: string;
  phase: 'intake' | 'planning' | 'building' | 'demo' | 'feedback' | 'complete';
  progressPct: number;
  updatedAt: number;
  summary?: string;
}

export const taskMusaiApi =
{
  async startSprint(payload: StartSprintRequest): Promise<{ sprintId: string }>
  {
    const response = await queuedFetch(n8nApi.getEndpointUrl(N8N_ENDPOINTS.TASK.START_SPRINT),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, timestamp: Date.now() }),
    }, 30000);
    if (!response.ok) throw new Error('Failed to start sprint');
    return response.json();
  },

  async getSprintStatus(sprintId: string): Promise<SprintStatus>
  {
    const response = await queuedFetch(n8nApi.getEndpointUrl(N8N_ENDPOINTS.TASK.GET_SPRINT_STATUS),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sprintId, timestamp: Date.now() }),
    }, 15000);
    if (!response.ok) throw new Error('Failed to fetch sprint status');
    return response.json();
  },

  async submitSprintFeedback(sprintId: string, feedback: string): Promise<void>
  {
    await queuedFetch(n8nApi.getEndpointUrl(N8N_ENDPOINTS.TASK.SUBMIT_SPRINT_FEEDBACK),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sprintId, feedback, timestamp: Date.now() }),
    }, 15000);
  },
};


