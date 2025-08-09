import { MemoryEvent, MemoryStore } from '@/types/memory';

// Local filesystem substitute: in-browser persistence via localStorage.
// Future adapters can target Redmine or PostgreSQL with the same interface.

const LOCAL_KEY_EVENTS = 'musai.memory.events.v1';
const LOCAL_KEY_PARTICIPATION = 'musai.memory.participation.v1';

function readEvents(): MemoryEvent[]
{
  const raw = localStorage.getItem(LOCAL_KEY_EVENTS);
  if (!raw)
  {
    return [];
  }
  try
  {
    return JSON.parse(raw) as MemoryEvent[];
  }
  catch
  {
    return [];
  }
}

function writeEvents(all: MemoryEvent[]): void
{
  localStorage.setItem(LOCAL_KEY_EVENTS, JSON.stringify(all));
}

function readParticipation(): Record<string, string[]>
{
  const raw = localStorage.getItem(LOCAL_KEY_PARTICIPATION);
  if (!raw)
  {
    return {};
  }
  try
  {
    return JSON.parse(raw) as Record<string, string[]>;
  }
  catch
  {
    return {};
  }
}

function writeParticipation(index: Record<string, string[]>): void
{
  localStorage.setItem(LOCAL_KEY_PARTICIPATION, JSON.stringify(index));
}

export class LocalFileMemoryStore implements MemoryStore
{
  async writeEvent(event: MemoryEvent): Promise<void>
  {
    const all = readEvents();
    all.push(event);
    writeEvents(all);
  }

  async readPublicByScenes(sceneIds: string[], limitPerScene = 50): Promise<MemoryEvent[]>
  {
    const all = readEvents();
    const set = new Set(sceneIds);
    const byScene: Record<string, MemoryEvent[]> = {};
    for (const ev of all)
    {
      if (ev.visibility !== 'public')
      {
        continue;
      }
      if (!set.has(ev.sceneId))
      {
        continue;
      }
      if (!byScene[ev.sceneId])
      {
        byScene[ev.sceneId] = [];
      }
      byScene[ev.sceneId].push(ev);
    }
    const result: MemoryEvent[] = [];
    for (const id of sceneIds)
    {
      const arr = (byScene[id] || []).sort((a, b) => a.createdAt - b.createdAt).slice(-limitPerScene);
      result.push(...arr);
    }
    return result;
  }

  async readPrivateByAgent(agentId: string, limit = 200): Promise<MemoryEvent[]>
  {
    const all = readEvents();
    return all
      .filter(ev => ev.agentId === agentId && ev.visibility === 'private')
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-limit);
  }

  async indexAgentParticipation(agentId: string, sceneId: string): Promise<void>
  {
    const index = readParticipation();
    const list = new Set(index[agentId] || []);
    list.add(sceneId);
    index[agentId] = Array.from(list);
    writeParticipation(index);
  }

  async getParticipatedScenes(agentId: string): Promise<string[]>
  {
    const index = readParticipation();
    return index[agentId] || [];
  }

  async prune(beforeTimestampMs: number): Promise<void>
  {
    const all = readEvents();
    const pruned = all.filter(ev => ev.createdAt >= beforeTimestampMs);
    writeEvents(pruned);
  }
}

export const localFileMemoryStore = new LocalFileMemoryStore();


