import { AgentContextSlice, GenerationPayload, MemoryEvent, MemoryStore } from '@/types/memory';
import { v4 as uuidv4 } from 'uuid';

export interface VeilOfMemoryOptions
{
  store: MemoryStore;
  publicWindowPerScene?: number;
  privateWindowLimit?: number;
}

export class VeilOfMemoryManager
{
  private readonly store: MemoryStore;
  private readonly publicWindowPerScene: number;
  private readonly privateWindowLimit: number;

  constructor(options: VeilOfMemoryOptions)
  {
    this.store = options.store;
    this.publicWindowPerScene = options.publicWindowPerScene ?? 30;
    this.privateWindowLimit = options.privateWindowLimit ?? 200;
  }

  async composeAgentContext(agentId: string, sceneId?: string): Promise<AgentContextSlice>
  {
    const participated = await this.store.getParticipatedScenes(agentId);
    const sceneScope = sceneId ? Array.from(new Set([sceneId, ...participated])) : participated;
    const publicDialogue = await this.store.readPublicByScenes(sceneScope, this.publicWindowPerScene);
    const episodicSelf = await this.store.readPrivateByAgent(agentId, this.privateWindowLimit);

    return {
      attentionWindow:
      {
        publicDialogue,
        episodicSelf,
      },
      epistemicBoundary:
      {
        includesPrivateOfOthers: false,
      }
    };
  }

  async filterGenerationPayload(input: GenerationPayload): Promise<GenerationPayload>
  {
    const memory = await this.composeAgentContext(input.agentId, input.sceneId);
    // Inject only allowed memory. Filter any pre-attached memory/context just in case.
    return {
      agentId: input.agentId,
      sceneId: input.sceneId,
      prompt: input.prompt,
      context: this.filterContext(input.context),
      memory,
    };
  }

  async recordPublic(agentId: string, sceneId: string, content: string): Promise<void>
  {
    const ev: MemoryEvent =
    {
      id: uuidv4(),
      sceneId,
      agentId,
      visibility: 'public',
      content,
      createdAt: Date.now(),
    };
    await this.store.writeEvent(ev);
    await this.store.indexAgentParticipation(agentId, sceneId);
  }

  async recordPrivate(agentId: string, sceneId: string, content: string): Promise<void>
  {
    const ev: MemoryEvent =
    {
      id: uuidv4(),
      sceneId,
      agentId,
      visibility: 'private',
      content,
      createdAt: Date.now(),
    };
    await this.store.writeEvent(ev);
    await this.store.indexAgentParticipation(agentId, sceneId);
  }

  private filterContext(context?: Record<string, unknown>): Record<string, unknown> | undefined
  {
    if (!context)
    {
      return undefined;
    }
    // Drop any context keys that suggest cross-agent private state.
    const forbiddenKeys = ['otherAgentsPrivate', 'chainOfThought', 'rawReasoning'];
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(context))
    {
      if (forbiddenKeys.includes(k))
      {
        continue;
      }
      result[k] = v;
    }
    return result;
  }
}


