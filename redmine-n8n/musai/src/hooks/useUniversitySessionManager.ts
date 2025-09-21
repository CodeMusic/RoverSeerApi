import { useCallback, useMemo } from 'react';
import { useUniversitySessions } from '@/hooks/useUniversitySessions';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { universityApi } from '@/lib/universityApi';

export const useUniversitySessionManager = () =>
{
  const {
    sessions,
    visibleSessions,
    currentSessionId,
    setCurrentSessionId,
    createConceptSession,
    removeSession,
    renameSession,
    toggleFavorite,
    syncFromCatalogue,
  } = useUniversitySessions();

  const { recordLastSession } = useUserPreferences();

  const handleSessionSelect = useCallback((sessionId: string) =>
  {
    const session = visibleSessions.find(s => s.id === sessionId);
    setCurrentSessionId(sessionId);
    if (session)
    {
      recordLastSession('university', {
        sessionId: session.id,
        courseId: session.courseId,
        lectureId: session.lectureId,
        view: session.scope,
      });
    }
  }, [visibleSessions, setCurrentSessionId, recordLastSession]);

  const handleNewSession = useCallback((topic?: string) =>
  {
    const session = createConceptSession(topic);
    return session;
  }, [createConceptSession]);

  const refreshSessions = useCallback(async () =>
  {
    const [courses, standalone] = await Promise.all([
      universityApi.getCourses(),
      universityApi.getStandaloneLectures()
    ]);
    syncFromCatalogue(courses, standalone);
  }, [syncFromCatalogue]);

  return useMemo(() => ({
    sessions,
    visibleSessions,
    currentSessionId,
    setCurrentSessionId,
    createConceptSession,
    removeSession,
    renameSession,
    toggleFavorite,
    syncFromCatalogue,
    handleSessionSelect,
    handleNewSession,
    refreshSessions,
  }), [
    sessions,
    visibleSessions,
    currentSessionId,
    setCurrentSessionId,
    createConceptSession,
    removeSession,
    renameSession,
    toggleFavorite,
    syncFromCatalogue,
    handleSessionSelect,
    handleNewSession,
    refreshSessions,
  ]);
};
