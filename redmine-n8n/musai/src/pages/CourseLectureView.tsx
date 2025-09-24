import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, Brain, Lock, MessageCircle, CheckCircle } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import type { Course, CourseLecture, UniversityTab } from '@/types/university';
import CourseQuiz from '@/components/university/CourseQuiz';
import { BaseLayout } from '@/components/common/BaseLayout';
import { APP_TERMS } from '@/config/constants';
import ROUTES, { RouteUtils } from '@/config/routes';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { ChatInterface } from '@/components/common/ChatInterface';
import { Message } from '@/types/chat';
import { useMessageSender } from '@/hooks/useMessageSender';
import { useQueryClient } from '@tanstack/react-query';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CompletionModalState
{
  score: number;
  grade: string;
  correctCount: number;
  totalQuestions: number;
  nextLectureId?: string;
  nextLectureTitle?: string;
}

const CourseLectureView = () =>
{
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as { course?: Course; lecture?: CourseLecture } | undefined;
  const [course, setCourse] = useState<Course | null>(locationState?.course ?? null);
  const [lecture, setLecture] = useState<CourseLecture | null>(locationState?.lecture ?? null);
  const [activeTab, setActiveTab] = useState<UniversityTab>('lecture');
  const [isLoading, setIsLoading] = useState(!(locationState?.course && locationState?.lecture));
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const shouldGenerateFromState = Boolean((locationState as { shouldGenerate?: boolean } | undefined)?.shouldGenerate);
  const { recordLastSession } = useUserPreferences();
  const queryClient = useQueryClient();
  const chatSessionIdRef = useRef<string | null>(null);
  const chatInitKeyRef = useRef<string | null>(null);
  const chatSeededRef = useRef<boolean>(false);
  const pendingChatDisplayRef = useRef<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isQuizGenerating, setIsQuizGenerating] = useState(false);
  const [completionModal, setCompletionModal] = useState<CompletionModalState | null>(null);
  const [isPerspectiveEnabled, setIsPerspectiveEnabled] = useState<boolean>(() =>
  {
    try
    {
      return (window as any).__musai_perspective_enabled !== false;
    }
    catch
    {
      return true;
    }
  });

  const deriveLetterGrade = useCallback((correct: number, total: number): string =>
  {
    if (total <= 0) return '—';
    if (correct === total) return 'A+';
    if (correct === total - 1) return 'A';
    const ratio = correct / total;
    if (ratio >= 0.9) return 'A-';
    if (ratio >= 0.8) return 'B';
    if (ratio >= 0.7) return 'C';
    if (ratio >= 0.6) return 'D';
    return 'F';
  }, []);

  const updateLectureChatSession = useCallback((sessionId: string, msgs: Message[]) =>
  {
    if (sessionId !== chatSessionIdRef.current)
    {
      return;
    }
    let nextMessages = msgs;
    const displayOverride = pendingChatDisplayRef.current;
    if (displayOverride && msgs.length > 0)
    {
      const lastIndex = msgs.length - 1;
      const adjusted = msgs.map((message, idx) =>
      {
        if (idx === lastIndex && message.role === 'user')
        {
          return { ...message, content: displayOverride };
        }
        return message;
      });
      pendingChatDisplayRef.current = null;
      nextMessages = adjusted;
    }
    setChatMessages(nextMessages);
    queryClient.setQueryData(['lecture-chat', sessionId], nextMessages);
  }, [queryClient]);

  const { sendMessage: sendChatMessage, isTyping: isChatTyping, isLoading: isChatLoading } = useMessageSender(updateLectureChatSession, queryClient);

  const chatStorageKey = useMemo(() =>
  {
    if (!courseId || !lectureId)
    {
      return null;
    }
    return `musai-lecture-chat:${courseId}:${lectureId}`;
  }, [courseId, lectureId]);

  const syllabusContext = useMemo(() =>
  {
    if (!course)
    {
      return '';
    }
    return course.lectures
      .map((item, index) => `${index + 1}. ${item.title}${item.summary ? ` — ${item.summary}` : ''}`)
      .join('\n')
      .slice(0, 2000);
  }, [course]);

  const lecturePlainText = useMemo(() =>
  {
    const html = lecture?.content;
    if (!html)
    {
      return '';
    }
    const withoutScripts = html
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    const stripped = withoutScripts.replace(/<[^>]+>/g, ' ');
    return stripped.replace(/\s+/g, ' ').trim().slice(0, 5000);
  }, [lecture?.content]);

  useEffect(() =>
  {
    chatSessionIdRef.current = null;
    chatSeededRef.current = false;
    chatInitKeyRef.current = null;
    setChatMessages([]);
  }, [chatStorageKey]);

  useEffect(() =>
  {
    if (!chatStorageKey)
    {
      return;
    }
    if (chatInitKeyRef.current === chatStorageKey)
    {
      return;
    }

    const saved = localStorage.getItem(chatStorageKey);
    if (saved)
    {
      try
      {
        const parsed = JSON.parse(saved) as { id?: string; messages?: Message[]; seeded?: boolean };
        chatSessionIdRef.current = parsed.id || `lecture-${courseId ?? 'unknown'}-${lectureId ?? 'unknown'}`;
        setChatMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
        chatSeededRef.current = Boolean(parsed.seeded);
        chatInitKeyRef.current = chatStorageKey;
        return;
      }
      catch (error)
      {
        console.warn('Failed to load lecture chat history', error);
      }
    }

    if (!course || !lecture)
    {
      return;
    }

    const sessionId = `lecture-${course.metadata.id}-${lecture.id}`;
    chatSessionIdRef.current = sessionId;
    chatSeededRef.current = false;
    chatInitKeyRef.current = chatStorageKey;

    const instructorName = course.metadata.instructor?.trim();
    const introSpeaker = instructorName ? `Professor ${instructorName}` : 'Your instructor';
    const introContent = `Hello! I'm ${introSpeaker} for **${course.metadata.title}**. Ask me anything about "${lecture.title}" and I'll clarify concepts, offer examples, or help you review.`;

    const introMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: introContent,
      timestamp: Date.now(),
      bubbleColor: 'blue'
    };
    setChatMessages([introMessage]);
  }, [chatStorageKey, course, lecture, courseId, lectureId, syllabusContext, lecturePlainText]);

  useEffect(() =>
  {
    if (!chatStorageKey || !chatSessionIdRef.current)
    {
      return;
    }
    try
    {
      localStorage.setItem(chatStorageKey, JSON.stringify({
        id: chatSessionIdRef.current,
        messages: chatMessages,
        seeded: chatSeededRef.current
      }));
    }
    catch (error)
    {
      console.warn('Failed to persist lecture chat history', error);
    }
  }, [chatMessages, chatStorageKey]);

  useEffect(() =>
  {
    const load = async () =>
    {
      if (!courseId || !lectureId)
      {
        return;
      }

      const hasLocationData = Boolean(
        locationState?.course &&
        locationState?.lecture &&
        locationState.course.metadata.id === courseId &&
        locationState.lecture.id === lectureId
      );

      if (!hasLocationData)
      {
        setIsLoading(true);
        const loadedCourse = await universityApi.getCourse(courseId);
        if (!loadedCourse)
        {
          navigate('/university');
          return;
        }
        const foundLecture = loadedCourse.lectures.find(l => l.id === lectureId) || null;
        setCourse(loadedCourse);
        setLecture(foundLecture);
      }
      setIsLoading(false);
    };
    load();
  }, [courseId, lectureId, navigate, locationState]);

  useEffect(() =>
  {
    if (!courseId || !lectureId) return;
    if (!lecture) return;
    if (lecture.content && lecture.content.trim().length > 0) return;

    let isActive = true;
    let attempts = 0;
    let intervalId: number | undefined;

    const poll = async () =>
    {
      if (!isActive) return;
      attempts += 1;
      try
      {
        const refreshedCourse = await universityApi.getCourse(courseId);
        if (!isActive || !refreshedCourse)
        {
          return;
        }
        const matched = refreshedCourse.lectures.find(l => l.id === lectureId);
        if (matched)
        {
          setCourse(refreshedCourse);
          setLecture(matched);
          if (matched.content && matched.content.trim().length > 0 && intervalId !== undefined)
          {
            window.clearInterval(intervalId);
          }
        }
        if (attempts >= 90 && intervalId !== undefined)
        {
          window.clearInterval(intervalId);
        }
      }
      catch (error)
      {
        console.error('Error polling lecture content', error);
      }
    };

    poll();
    intervalId = window.setInterval(poll, 5000);

    return () =>
    {
      isActive = false;
      if (intervalId !== undefined)
      {
        window.clearInterval(intervalId);
      }
    };
  }, [courseId, lectureId, lecture]);

  useEffect(() =>
  {
    if (!course || !lecture)
    {
      return;
    }
    recordLastSession('university', {
      courseId: course.metadata.id,
      lectureId: lecture.id,
      view: activeTab
    });
  }, [course, lecture, activeTab, recordLastSession]);

  const updateLecture = async (updatedLectureLegacy: Partial<CourseLecture>) =>
  {
    // This view operates on CourseLecture; safeguard in case a legacy component passes a different shape
    if (!course || !lecture) return;
    const updatedCourse: Course = {
      ...course,
      lectures: [...course.lectures]
    };
    const idx = updatedCourse.lectures.findIndex(l => l.id === lecture.id);
    if (idx >= 0)
    {
      updatedCourse.lectures[idx] = {
        ...updatedCourse.lectures[idx],
        ...updatedLectureLegacy
      } as CourseLecture;
      await universityApi.saveCourse(updatedCourse);
      setCourse(updatedCourse);
      setLecture(updatedCourse.lectures[idx]);
    }
  };

  const isTabLocked = (tab: UniversityTab): boolean =>
  {
    if (!lecture) return true;
    switch (tab)
    {
      case 'lecture':
        return false;
      case 'chat':
        return false;
      case 'quiz':
        return !lecture.content;
      default:
        return false;
    }
  };

  const getOverallProgress = () =>
  {
    if (!course) return 0;
    if (course.lectures.length === 0) return 0;
    const completed = course.lectures.filter(l => l.status === 'completed').length;
    return Math.round((completed / course.lectures.length) * 100);
  };

  const quizPassThreshold = useMemo(() =>
  {
    const raw = course?.metadata.passThreshold;
    if (typeof raw === 'number')
    {
      if (raw > 1)
      {
        return Math.min(Math.max(raw / 100, 0), 1);
      }
      if (raw > 0)
      {
        return raw;
      }
    }
    return 0.7;
  }, [course?.metadata.passThreshold]);

  const latestPassingAttempt = useMemo(() =>
  {
    if (!lecture?.quizAttempts || lecture.quizAttempts.length === 0)
    {
      return null;
    }
    const clone = [...lecture.quizAttempts].reverse();
    return clone.find(attempt => attempt.passed) ?? null;
  }, [lecture?.quizAttempts]);

  const latestLetterGrade = useMemo(() =>
  {
    if (!latestPassingAttempt)
    {
      return null;
    }
    const total = latestPassingAttempt.totalQuestions ?? lecture?.quiz?.length ?? 0;
    const correct = latestPassingAttempt.correctCount ?? Math.round(latestPassingAttempt.score * total);
    return latestPassingAttempt.letterGrade ?? deriveLetterGrade(correct, total);
  }, [latestPassingAttempt, lecture?.quiz?.length, deriveLetterGrade]);

  const isInteractionLocked = isGenerating || isQuizGenerating;

  const renderableLectureHtml = useMemo(() =>
  {
    const raw = lecture?.content?.trim();
    if (!raw)
    {
      return '';
    }

    const includesDocumentChrome = /<!doctype/i.test(raw) || /<html[\s>]/i.test(raw);
    if (!includesDocumentChrome)
    {
      return raw;
    }

    if (typeof window === 'undefined' || typeof DOMParser === 'undefined')
    {
      return raw;
    }

    try
    {
      const parser = new DOMParser();
      const doc = parser.parseFromString(raw, 'text/html');
      const styleDeclarations = Array.from(doc.head?.querySelectorAll('style') ?? [])
        .map(styleTag => styleTag.innerHTML)
        .join('\n');

      // Remove rules that target global containers and can break layout/scroll (white pillars, scroll lock)
      const sanitizedStyles = styleDeclarations
        .replace(/(^|})\s*body\s*\{[\s\S]*?\}/gi, '$1')
        .replace(/(^|})\s*html\s*\{[\s\S]*?\}/gi, '$1')
        .replace(/(^|})\s*#root\s*\{[\s\S]*?\}/gi, '$1')
        .replace(/overflow(?:-x|-y)?\s*:\s*[^;]+;?/gi, '')
        .replace(/height\s*:\s*100d?vh\s*;?/gi, '');

      // Scoped safety fixes to keep content responsive inside our container
      const scopedFixes = `
        .musai-lecture-content { max-width: 100%; margin: 0; padding: 0; color: #0f172a; line-height: 1.6; background: transparent; }
        .musai-lecture-content img, .musai-lecture-content video, .musai-lecture-content canvas { max-width: 100%; height: auto; }
        .musai-lecture-content table { width: 100%; border-collapse: collapse; }
        .musai-lecture-content pre, .musai-lecture-content code { white-space: pre-wrap; word-wrap: break-word; }
        .musai-lecture-content * { box-sizing: border-box; color: inherit; }
      `;

      const aggregatedStyles = `<style>${scopedFixes}${sanitizedStyles}</style>`;
      const bodyHtml = doc.body?.innerHTML ?? '';
      return `${aggregatedStyles}${bodyHtml}`.trim() || raw;
    }
    catch
    {
      return raw;
    }
  }, [lecture?.content]);

  const handleSendChat = useCallback(async (text: string, file?: File) =>
  {
    if (!chatSessionIdRef.current || !course || !lecture)
    {
      return;
    }
    const trimmed = text.trim();
    if (!trimmed && !file)
    {
      return;
    }

    const instructorName = course.metadata.instructor?.trim();
    const contextHeader = chatSeededRef.current ? '' : [
      instructorName
        ? `You are Professor ${instructorName}, the instructor for the course "${course.metadata.title}".`
        : `You are the Musai University teaching assistant for the course "${course.metadata.title}".`,
      course.metadata.description ? `Course Description: ${course.metadata.description}` : null,
      `Lecture Title: ${lecture.title}`,
      lecture.summary ? `Lecture Summary: ${lecture.summary}` : null,
      syllabusContext ? `Syllabus Outline:\n${syllabusContext}` : null,
      lecturePlainText ? `Lecture Content:\n${lecturePlainText}` : null,
      'Use the supplied context to answer learner questions, cite relevant sections, and offer supportive study guidance.'
    ].filter(Boolean).join('\n');

    const learnerText = trimmed || (file ? 'Please review the attached file and respond accordingly.' : '');
    let outgoing = learnerText;
    if (!chatSeededRef.current)
    {
      const contextPayload = contextHeader
        ? `${contextHeader}\n\nLearner: ${learnerText}`
        : learnerText;
      outgoing = contextPayload;
      pendingChatDisplayRef.current = learnerText;
    }
    else
    {
      pendingChatDisplayRef.current = null;
    }

    if (!chatSeededRef.current)
    {
      chatSeededRef.current = true;
    }

    await sendChatMessage(outgoing, chatSessionIdRef.current, chatMessages, file);
    pendingChatDisplayRef.current = null;
  }, [chatMessages, course, lecture, lecturePlainText, sendChatMessage, syllabusContext]);

  const handleTogglePerspective = useCallback((enabled: boolean) =>
  {
    setIsPerspectiveEnabled(enabled);
    try
    {
      (window as any).__musai_perspective_enabled = enabled;
    }
    catch
    {
      // no-op
    }
  }, []);

  const startLectureGeneration = useCallback(async () =>
  {
    if (!course || !lecture) return;
    if (isGenerating) return;

    const idx = course.lectures.findIndex(l => l.id === lecture.id);
    if (idx === -1)
    {
      setGenerationError('We could not locate this lecture in the course.');
      return;
    }

    const lectureId = lecture.id;
    const previousLectureContext = idx > 0 ? course.lectures[idx - 1]?.content : undefined;
    const lectureDuration = lecture.duration;

    setGenerationError(null);

    const draftLectures = course.lectures.map((existing, index) =>
      index === idx
        ? { ...existing, status: 'in_progress' }
        : existing
    );

    const draftCourse: Course = {
      ...course,
      lectures: draftLectures,
      currentLectureIndex: idx
    };

    setCourse(draftCourse);
    setLecture(draftCourse.lectures[idx]);

    try
    {
      await universityApi.saveCourse(draftCourse);
    }
    catch (error)
    {
      console.warn('Failed to update lecture state before generation', error);
    }

    setIsGenerating(true);

    try
    {
      const generatedLecture = await universityApi.generateLecture({
        courseId: course.metadata.id,
        lectureIndex: idx,
        lectureTitle: lecture.title,
        lectureSummary: lecture.summary,
        previousLectureContext,
        processorFile: course.metadata.processorFile
      });

      const resolvedLecture: CourseLecture = {
        ...generatedLecture,
        id: lectureId,
        duration: lectureDuration ?? generatedLecture.duration,
        status: 'unlocked'
      };

      const updatedCourse: Course = {
        ...draftCourse,
        lectures: draftCourse.lectures.map((existing, index) =>
          index === idx ? resolvedLecture : existing
        )
      };
      updatedCourse.currentLectureIndex = idx;

      await universityApi.saveCourse(updatedCourse);
      setCourse(updatedCourse);
      setLecture(updatedCourse.lectures[idx]);
    }
    catch (error)
    {
      console.error('Error generating lecture content', error);
      setGenerationError('We couldn’t generate this lecture. Please try again.');

      const rollbackCourse: Course = {
        ...draftCourse,
        lectures: draftCourse.lectures.map((existing, index) =>
          index === idx ? { ...existing, status: 'unlocked' } : existing
        )
      };

      try
      {
        await universityApi.saveCourse(rollbackCourse);
      }
      catch (saveError)
      {
        console.error('Failed to reset lecture status after generation error', saveError);
      }

      setCourse(rollbackCourse);
      setLecture(rollbackCourse.lectures[idx]);
    }
    finally
    {
      setIsGenerating(false);
    }
  }, [course, lecture, isGenerating]);

  useEffect(() =>
  {
    setGenerationError(null);
  }, [lectureId]);

  useEffect(() =>
  {
    if (!course || !lecture) return;
    if (lecture.content && lecture.content.trim().length > 0) return;
    if (isGenerating) return;

    const shouldTrigger = shouldGenerateFromState || lecture.status === 'in_progress';
    if (!shouldTrigger) return;

    startLectureGeneration();
  }, [course, lecture, shouldGenerateFromState, isGenerating, startLectureGeneration]);

  const renderMainContent = () => {
    if (isLoading)
    {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (!course || !lecture)
    {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="mb-4">Lecture not found</p>
            <Button onClick={() => navigate('/university')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 scale-110 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.35),_rgba(30,41,59,0.4)_55%,_rgba(15,23,42,0.95)_100%)] opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950/80 to-purple-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(94,234,212,0.08),_transparent_55%)] opacity-80" />
        </div>
        <div className="relative z-10 w-full px-4 py-8 sm:px-6 lg:px-10 xl:px-16">
          <div className="mx-auto w-full max-w-[1440px] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="bg-white/10 text-white hover:bg-white/20"
                  onClick={() => navigate(`/university/course/${course!.metadata.id}`)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Syllabus
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{course!.metadata.title}</h1>
                  <p className="text-sm text-white/70">{lecture!.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={lecture!.status === 'completed' ? 'default' : 'secondary'} className="bg-white/20 text-white">
                  {lecture!.status === 'completed' ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" /> Completed
                    </>
                  ) : (
                    lecture!.status.replace('_', ' ')
                  )}
                </Badge>
                {latestLetterGrade && (
                  <Badge
                    key={latestLetterGrade}
                    className="animate-in fade-in zoom-in bg-emerald-500/20 text-emerald-200 border border-emerald-400/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  >
                    {latestLetterGrade}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div>
                <Card className="bg-white/10 text-white">
                  <CardHeader>
                    <CardTitle className="text-sm text-white/80">Course Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex justify-between text-sm text-white/80">
                      <span>{course!.completedLectures} of {course!.lectures.length} completed</span>
                      <span>{getOverallProgress()}%</span>
                    </div>
                    <Progress value={getOverallProgress()} className="h-2" />
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="flex flex-col overflow-hidden border border-white/15 bg-slate-900/60 backdrop-blur-xl shadow-2xl">
                  <CardHeader className="bg-white/10 shrink-0">
                    <CardTitle className="text-lg text-white">{lecture!.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col bg-transparent p-0">
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) =>
                      {
                        if (isInteractionLocked)
                        {
                          return;
                        }
                        setActiveTab(v as UniversityTab);
                      }}
                      className="flex flex-col"
                    >
                      <TabsList className="mx-6 mt-2 rounded-full bg-white/10 p-1">
                        <TabsTrigger
                          value="lecture"
                          disabled={isTabLocked('lecture') || isInteractionLocked}
                          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
                        >
                          <BookOpen className="h-4 w-4" /> Lecture
                        </TabsTrigger>
                        <TabsTrigger
                          value="chat"
                          disabled={isTabLocked('chat') || isInteractionLocked}
                          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
                        >
                          <MessageCircle className="h-4 w-4" /> Chat
                        </TabsTrigger>
                        <TabsTrigger
                          value="quiz"
                          disabled={isTabLocked('quiz') || isInteractionLocked}
                          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
                        >
                          {isTabLocked('quiz') ? <Lock className="h-4 w-4" /> : <Brain className="h-4 w-4" />} Quiz
                        </TabsTrigger>
                      </TabsList>
                      <div className="px-6 pb-6">
                        <TabsContent value="lecture" className="mt-4">
                          {renderableLectureHtml ? (
                            <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white px-6 py-6 text-slate-900 shadow-2xl">
                              <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                <div className="prose max-w-full musai-lecture-content" dangerouslySetInnerHTML={{ __html: renderableLectureHtml }} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/15 bg-slate-950/70 px-6 py-8 text-center text-slate-100 shadow-inner">
                              <div className="flex flex-col items-center gap-3">
                                {isGenerating ? (
                                  <>
                                    <div className="flex items-center justify-center">
                                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/40 border-t-transparent"></div>
                                    </div>
                                    <p className="text-sm text-slate-200">
                                      Professor is preparing your lecture. This can take a minute or two.
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <BookOpen className="h-8 w-8 text-slate-200" />
                                    <p className="text-sm text-slate-200">
                                      No content generated yet. Ask Musai to craft this lecture when you’re ready.
                                    </p>
                                  </>
                                )}
                              </div>
                              {generationError && (
                                <div className="w-full max-w-md rounded-lg border border-rose-400/40 bg-rose-500/20 px-4 py-3 text-sm text-rose-100">
                                  {generationError}
                                </div>
                              )}
                              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
                                <Button
                                  className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-blue-400 sm:flex-none sm:px-6"
                                  onClick={startLectureGeneration}
                                  disabled={isInteractionLocked}
                                >
                                  {isGenerating ? 'Generating…' : 'Generate lecture content'}
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1 border-white/40 text-white hover:bg-white/10 sm:flex-none sm:px-6"
                                  onClick={() => setActiveTab('quiz')}
                                  disabled={isInteractionLocked}
                                >
                                  Go to quiz
                                </Button>
                              </div>
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="chat" className="mt-4">
                          <div className="flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-2xl">
                            <div className="flex-1 min-h-0 px-1 pb-1">
                              <ChatInterface
                                messages={chatMessages}
                                isTyping={isChatTyping}
                                isLoading={isChatLoading}
                                onSendMessage={handleSendChat}
                                className="flex-1 min-h-0"
                                placeholder="Ask your professor anything about this lecture..."
                                perspectiveEnabled={isPerspectiveEnabled}
                                onTogglePerspective={handleTogglePerspective}
                              />
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="quiz" className="mt-4">
                          <CourseQuiz
                            lecture={lecture!}
                            passThreshold={Math.max(quizPassThreshold, 0.8)}
                            onGenerationStateChange={setIsQuizGenerating}
                            onQuizCompleted={async (passed, attempt) =>
                            {
                              if (!course) return;
                              const updatedCourse: Course = { ...course, lectures: [...course.lectures] };
                              const idx = updatedCourse.lectures.findIndex(l => l.id === lecture!.id);
                              if (idx >= 0)
                              {
                                const existingLecture = updatedCourse.lectures[idx];
                                const totalQuestions = attempt.totalQuestions ?? existingLecture.quiz?.length ?? 0;
                                const correctCount = attempt.correctCount ?? Math.round(attempt.score * totalQuestions);
                                const grade = attempt.letterGrade ?? deriveLetterGrade(correctCount, totalQuestions);
                                const augmentedAttempt: QuizAttempt = {
                                  ...attempt,
                                  letterGrade: grade,
                                  correctCount,
                                  totalQuestions
                                };

                                const updatedLecture: CourseLecture = {
                                  ...existingLecture,
                                  quizAttempts: [...existingLecture.quizAttempts, augmentedAttempt],
                                  updatedAt: new Date().toISOString()
                                };
                                updatedCourse.lectures[idx] = updatedLecture;

                                if (passed)
                                {
                                  updatedCourse.lectures[idx] = {
                                    ...updatedCourse.lectures[idx],
                                    status: 'completed'
                                  };

                                  let nextUnlocked: CourseLecture | null = null;
                                  if (idx + 1 < updatedCourse.lectures.length)
                                  {
                                    const candidate = updatedCourse.lectures[idx + 1];
                                    if (candidate.status === 'locked')
                                    {
                                      updatedCourse.lectures[idx + 1] = {
                                        ...candidate,
                                        status: 'unlocked'
                                      };
                                      nextUnlocked = updatedCourse.lectures[idx + 1];
                                    }
                                    else
                                    {
                                      nextUnlocked = candidate;
                                    }
                                  }

                                  updatedCourse.completedLectures = Math.min(
                                    updatedCourse.lectures.length,
                                    updatedCourse.lectures.filter(l => l.status === 'completed').length
                                  );
                                  updatedCourse.overallProgress = Math.round(
                                    (updatedCourse.lectures.filter(l => l.status === 'completed').length / updatedCourse.lectures.length) * 100
                                  );

                                  setCompletionModal({
                                    score: attempt.score,
                                    grade,
                                    correctCount,
                                    totalQuestions,
                                    nextLectureId: nextUnlocked?.id,
                                    nextLectureTitle: nextUnlocked?.title
                                  });
                                }

                                setLecture(updatedCourse.lectures[idx]);
                              }

                              setCourse(updatedCourse);
                              await universityApi.saveCourse(updatedCourse);
                            }}
                            onGenerateMoreQuestions={async () =>
                            {
                              if (!course || !lecture)
                              {
                                throw new Error('Course context is not available.');
                              }

                              const contentPayload = lecture.content?.trim()?.length ? lecture.content : lecturePlainText;
                              if (!contentPayload)
                              {
                                throw new Error('Lecture content is not available yet.');
                              }

                              const generatedQuiz = await universityApi.generateQuiz({
                                courseId: course.metadata.id,
                                courseTitle: course.metadata.title,
                                lectureId: lecture.id,
                                lectureTitle: lecture.title,
                                lectureContent: contentPayload,
                                lectureSummary: lecture.summary,
                                processorFile: course.metadata.processorFile
                              });

                              const updatedCourse: Course = { ...course, lectures: [...course.lectures] };
                              const idx = updatedCourse.lectures.findIndex(l => l.id === lecture!.id);
                              if (idx >= 0)
                              {
                                const now = new Date().toISOString();
                                updatedCourse.lectures[idx] = {
                                  ...updatedCourse.lectures[idx],
                                  quiz: (updatedCourse.lectures[idx].quiz || []).concat(generatedQuiz),
                                  quizAttempts: [],
                                  updatedAt: now
                                };
                                await universityApi.saveCourse(updatedCourse);
                                setCourse(updatedCourse);
                                setLecture(updatedCourse.lectures[idx]);
                              }
                              else
                              {
                                throw new Error('Unable to locate lecture for quiz generation.');
                              }
                            }}
                          />
                        </TabsContent>
                      </div>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleCloseCompletionModal = useCallback(() => setCompletionModal(null), []);

  const handleNavigateToNextLecture = useCallback(() =>
  {
    if (!completionModal || !completionModal.nextLectureId || !course)
    {
      setCompletionModal(null);
      return;
    }
    const target = course.lectures.find(l => l.id === completionModal.nextLectureId);
    if (target)
    {
      setCompletionModal(null);
      navigate(`/university/course/${course.metadata.id}/lecture/${target.id}`, {
        state: {
          course,
          lecture: target
        }
      });
    }
    else
    {
      setCompletionModal(null);
    }
  }, [completionModal, course, navigate]);

  const handleReturnToSyllabus = useCallback(() =>
  {
    if (!course)
    {
      setCompletionModal(null);
      return;
    }
    setCompletionModal(null);
    navigate(`/university/course/${course.metadata.id}`);
  }, [course, navigate]);

  return (
    <>
      <BaseLayout
      currentTab={APP_TERMS.TAB_UNIVERSITY}
      sessions={[]}
      currentSessionId=""
      onNewSession={() => {}}
      onSessionSelect={() => {}}
      onDeleteSession={() => {}}
      onRenameSession={() => {}}
      onToggleFavorite={() => {}}
      renderMainContent={renderMainContent}
      onTabChange={(tab) => {
        const map: Record<string, string> = {
          [APP_TERMS.TAB_CHAT]: 'chat',
          [APP_TERMS.TAB_SEARCH]: 'search',
          [APP_TERMS.TAB_CODE]: 'code',
          [APP_TERMS.TAB_UNIVERSITY]: 'university',
          [APP_TERMS.TAB_NARRATIVE]: 'narrative',
          [APP_TERMS.TAB_CAREER]: 'career',
          [APP_TERMS.TAB_THERAPY]: 'therapy',
          [APP_TERMS.TAB_MEDICAL]: 'medical',
          [APP_TERMS.TAB_TASK]: 'task',
          [APP_TERMS.TAB_EYE]: 'eye'
        };
        const mode = map[tab] || 'chat';
        if (tab === APP_TERMS.TAB_UNIVERSITY)
        {
          navigate(ROUTES.UNIVERSITY);
          return;
        }
        navigate(RouteUtils.mainAppWithMode(mode));
      }}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(prev => !prev)}
      renderLeftSidebarOverride={() => null}
      hideLeftSidebar
    />

      <Dialog open={Boolean(completionModal)} onOpenChange={(open) => {
        if (!open)
        {
          handleCloseCompletionModal();
        }
      }}>
        <DialogContent className="bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 text-white">
          {completionModal && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-2xl font-semibold text-white">Lecture Mastery Unlocked</DialogTitle>
                <DialogDescription className="text-slate-300">
                  You scored {Math.round(completionModal.score * 100)}% ({completionModal.correctCount} of {completionModal.totalQuestions}).
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center gap-4">
                <div className="rounded-full bg-emerald-500/20 px-6 py-4 text-center shadow-lg ring-2 ring-emerald-400/30">
                  <span className="text-xs uppercase tracking-wide text-emerald-200">Badge</span>
                  <div className="text-4xl font-bold text-emerald-100">{completionModal.grade}</div>
                </div>
                <div className="max-w-[60%] text-sm text-slate-200">
                  {completionModal.grade === 'A+'
                    ? 'Flawless performance! Every question was spot on.'
                    : 'Fantastic work! Keep the momentum going as you move through the course.'}
                </div>
              </div>
              <DialogFooter>
                <div className="flex w-full flex-col gap-2 sm:flex-row">
                  {completionModal.nextLectureId ? (
                    <Button className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-blue-400" onClick={handleNavigateToNextLecture}>
                      Continue to {completionModal.nextLectureTitle ?? 'next lecture'}
                    </Button>
                  ) : (
                    <Button className="flex-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500 text-white shadow-lg shadow-emerald-500/30 hover:from-emerald-400 hover:to-blue-400" onClick={handleCloseCompletionModal}>
                      Stay in this lecture
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 border-slate-500/40 text-slate-100 hover:border-slate-300/60" onClick={handleReturnToSyllabus}>
                    Return to syllabus
                  </Button>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CourseLectureView;
