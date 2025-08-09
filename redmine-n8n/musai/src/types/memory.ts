export type MemoryVisibility = 'public' | 'private';

export interface AgentIdentity
{
  id: string;
  name?: string;
}

export interface SceneIdentity
{
  id: string;
  name?: string;
  actId?: string;
}

export interface MemoryEvent
{
  id: string;
  sceneId: string;
  agentId: string;
  visibility: MemoryVisibility;
  content: string;
  createdAt: number;
}

export interface AgentContextSlice
{
  attentionWindow:
  {
    publicDialogue: MemoryEvent[];
    episodicSelf: MemoryEvent[];
  };
  epistemicBoundary:
  {
    includesPrivateOfOthers: boolean;
  };
}

export interface GenerationPayload
{
  agentId: string;
  sceneId?: string;
  prompt: string;
  // Arbitrary extras from UI; will be filtered by the veil
  context?: Record<string, unknown>;
  // Optional memory fields (will be injected by the manager)
  memory?: Partial<AgentContextSlice>;
}

export interface MemoryStore
{
  writeEvent(event: MemoryEvent): Promise<void>;
  readPublicByScenes(sceneIds: string[], limitPerScene?: number): Promise<MemoryEvent[]>;
  readPrivateByAgent(agentId: string, limit?: number): Promise<MemoryEvent[]>;
  indexAgentParticipation(agentId: string, sceneId: string): Promise<void>;
  getParticipatedScenes(agentId: string): Promise<string[]>;
  prune(beforeTimestampMs: number): Promise<void>;
}


