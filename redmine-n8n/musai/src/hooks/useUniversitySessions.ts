import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { UniversitySession } from '@/types/chat';
import type { Course, StandaloneLecture } from '@/types/university';
import { computeAndStoreClientIpHash, getStoredClientIpHash } from '@/utils/ip';

const STORAGE_KEY = 'musai_university_sessions_v1';

const sortSessions = (input: UniversitySession[]): UniversitySession[] =>
{
  return [...input].sort((a, b) =>
  {
    if (a.favorite !== b.favorite)
    {
      return a.favorite ? -1 : 1;
    }
    return (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0);
  });
};

export const useUniversitySessions = () =>
{
  const [sessions, setSessions] = useState<UniversitySession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [clientIpHash, setClientIpHash] = useState<string | null>(getStoredClientIpHash());

  useEffect(() =>
  {
    computeAndStoreClientIpHash().then(hash =>
    {
      if (hash) setClientIpHash(hash);
    });
  }, []);

  useEffect(() =>
  {
    try
    {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw)
      {
        setSessions([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed))
      {
        const filtered = clientIpHash
          ? parsed.filter((s: UniversitySession) => !s.clientIpHash || s.clientIpHash === clientIpHash)
          : parsed;
        setSessions(sortSessions(filtered));
      }
    }
    catch (error)
    {
      console.error('Failed to load university sessions', error);
      setSessions([]);
    }
  }, [clientIpHash]);

  const persist = useCallback((next: UniversitySession[]) =>
  {
    try
    {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    catch (error)
    {
      console.warn('Failed to persist university sessions', error);
    }
  }, []);

  const syncFromCatalogue = useCallback((courses: Course[], standaloneLectures: StandaloneLecture[]) =>
  {
    const now = Date.now();
    let shouldClearSelection = false;
    setSessions(prev =>
    {
      const byCourseId = new Map<string, UniversitySession>();
      const byLectureId = new Map<string, UniversitySession>();
      for (const session of prev)
      {
        if (session.courseId)
        {
          byCourseId.set(session.courseId, session);
        }
        if (session.lectureId)
        {
          byLectureId.set(session.lectureId, session);
        }
      }

      const nextSessions: UniversitySession[] = [];

      for (const course of courses)
      {
        const existing = byCourseId.get(course.metadata.id);
        const base: UniversitySession = existing ?? {
          id: uuidv4(),
          type: 'university',
          createdAt: now,
          lastUpdated: now,
          favorite: false,
          scope: 'course',
          clientIpHash: clientIpHash || undefined,
        };
        const next: UniversitySession = {
          ...base,
          name: course.metadata.title || base.name || 'New Course',
          courseId: course.metadata.id,
          scope: 'course',
          progress: course.overallProgress,
          topic: course.metadata.title,
          summary: course.metadata.description,
          lastLectureTitle: course.lectures?.[course.currentLectureIndex ?? 0]?.title,
          favorite: base.favorite,
          archived: base.archived,
          createdAt: base.createdAt ?? now,
          lastUpdated: now,
          clientIpHash: base.clientIpHash ?? clientIpHash ?? undefined,
        };
        nextSessions.push(next);
      }

      for (const lecture of standaloneLectures)
      {
        const existing = byLectureId.get(lecture.id);
        const base: UniversitySession = existing ?? {
          id: uuidv4(),
          type: 'university',
          createdAt: now,
          lastUpdated: now,
          favorite: false,
          scope: 'standalone',
          clientIpHash: clientIpHash || undefined,
        };
        const next: UniversitySession = {
          ...base,
          name: lecture.title || base.name || 'Standalone Lecture',
          lectureId: lecture.id,
          scope: 'standalone',
          topic: lecture.title,
          summary: lecture.content?.slice(0, 260),
          progress: 100,
          favorite: base.favorite,
          archived: base.archived,
          createdAt: base.createdAt ?? now,
          lastUpdated: now,
          clientIpHash: base.clientIpHash ?? clientIpHash ?? undefined,
        };
        nextSessions.push(next);
      }

      const conceptSessions = prev.filter(session => session.scope === 'concept');
      const combined = sortSessions([
        ...nextSessions,
        ...conceptSessions.map(session => ({ ...session, lastUpdated: session.lastUpdated ?? session.createdAt }))
      ]);

      persist(combined);
      if (currentSessionId && !combined.some(s => s.id === currentSessionId && !s.archived))
      {
        shouldClearSelection = true;
      }
      return combined;
    });
    if (shouldClearSelection)
    {
      setCurrentSessionId('');
    }
  }, [clientIpHash, currentSessionId, persist]);

  const createConceptSession = useCallback((topic?: string) =>
  {
    const now = Date.now();
    const session: UniversitySession = {
      id: uuidv4(),
      type: 'university',
      name: topic ? `Concept • ${topic}` : 'New Course Concept',
      topic,
      summary: topic ? `Exploring ${topic}` : undefined,
      scope: 'concept',
      favorite: false,
      createdAt: now,
      lastUpdated: now,
      clientIpHash: clientIpHash || undefined,
    };
    setSessions(prev =>
    {
      const next = sortSessions([session, ...prev]);
      persist(next);
      return next;
    });
    setCurrentSessionId(session.id);
    return session;
  }, [clientIpHash, persist]);

  const removeSession = useCallback((sessionId: string) =>
  {
    setSessions(prev =>
    {
      const target = prev.find(session => session.id === sessionId);
      if (!target)
      {
        return prev;
      }
      const now = Date.now();
      let next: UniversitySession[];
      if (target.scope === 'concept')
      {
        next = prev.filter(session => session.id !== sessionId);
      }
      else
      {
        next = prev.map(session =>
          session.id === sessionId
            ? { ...session, archived: true, lastUpdated: now }
            : session
        );
      }
      persist(next);
      if (currentSessionId === sessionId)
      {
        setCurrentSessionId('');
      }
      return next;
    });
  }, [currentSessionId, persist]);

  const renameSession = useCallback((sessionId: string, newName: string) =>
  {
    setSessions(prev =>
    {
      const next = prev.map(session =>
        session.id === sessionId
          ? { ...session, name: newName, lastUpdated: Date.now() }
          : session
      );
      persist(next);
      return next;
    });
  }, [persist]);

  const toggleFavorite = useCallback((sessionId: string) =>
  {
    setSessions(prev =>
    {
      const next = prev.map(session =>
        session.id === sessionId
          ? { ...session, favorite: !session.favorite, lastUpdated: Date.now() }
          : session
      );
      persist(next);
      return next;
    });
  }, [persist]);

  const visibleSessions = useMemo(() => sessions.filter(session => !session.archived), [sessions]);

  const setSessionId = useCallback((sessionId: string) =>
  {
    setCurrentSessionId(sessionId);
    setSessions(prev =>
    {
      const next = prev.map(session =>
        session.id === sessionId ? { ...session, lastUpdated: Date.now() } : session
      );
      persist(next);
      return next;
    });
  }, [persist]);

  return {
    sessions,
    visibleSessions: sortSessions(visibleSessions),
    currentSessionId,
    setCurrentSessionId: setSessionId,
    createConceptSession,
    removeSession,
    renameSession,
    toggleFavorite,
    syncFromCatalogue,
  };
};

export type UseUniversitySessionsReturn = ReturnType<typeof useUniversitySessions>;
