import { useEffect, useMemo, useState } from 'react';
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
import { RouteUtils } from '@/config/routes';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

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
  const { recordLastSession } = useUserPreferences();

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
  }, [courseId, lectureId, lecture?.content]);

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
      const aggregatedStyles = styleDeclarations ? `<style>${styleDeclarations}</style>` : '';
      const bodyHtml = doc.body?.innerHTML ?? '';
      return `${aggregatedStyles}${bodyHtml}`.trim() || raw;
    }
    catch
    {
      return raw;
    }
  }, [lecture?.content]);

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
      <div className="relative flex h-full w-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-full w-full bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 lg:-ml-20 lg:w-[calc(100%+5rem)]">
            <div className="mx-auto w-full max-w-[1600px] px-6 py-8 lg:px-10 xl:px-16 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 text-white">
                <div className="flex items-center gap-4">
                  <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20" onClick={() => navigate(`/university/course/${course!.metadata.id}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Syllabus
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold">{course!.metadata.title}</h1>
                    <p className="text-sm text-white/70">{lecture!.title}</p>
                  </div>
                </div>
                <Badge variant={lecture!.status === 'completed' ? 'default' : 'secondary'} className="bg-white/20 text-white">
                  {lecture!.status === 'completed' ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" /> Completed
                    </>
                  ) : (
                    lecture!.status.replace('_', ' ')
                  )}
                </Badge>
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
                  <Card className="h-[calc(100dvh-220px)] overflow-hidden">
                    <CardHeader className="bg-white/10">
                      <CardTitle className="text-lg text-white">{lecture!.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex h-full flex-col bg-white/5 p-0">
                      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UniversityTab)} className="flex h-full flex-col">
                        <TabsList className="mx-6 mt-2 rounded-full bg-white/10 p-1">
                          <TabsTrigger
                            value="lecture"
                            disabled={isTabLocked('lecture')}
                            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
                          >
                            <BookOpen className="h-4 w-4" /> Lecture
                          </TabsTrigger>
                          <TabsTrigger
                            value="chat"
                            disabled={isTabLocked('chat')}
                            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
                          >
                            <MessageCircle className="h-4 w-4" /> Chat
                          </TabsTrigger>
                          <TabsTrigger
                            value="quiz"
                            disabled={isTabLocked('quiz')}
                            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white transition data-[state=active]:bg-white data-[state=active]:text-slate-900"
                          >
                            {isTabLocked('quiz') ? <Lock className="h-4 w-4" /> : <Brain className="h-4 w-4" />} Quiz
                          </TabsTrigger>
                        </TabsList>
                        <div className="flex-1 px-6 pb-6">
                          <TabsContent value="lecture" className="mt-4 h-full">
                            {renderableLectureHtml ? (
                              <div className="h-full w-full overflow-auto">
                                <div className="prose prose-invert max-w-full" dangerouslySetInnerHTML={{ __html: renderableLectureHtml }} />
                              </div>
                            ) : (
                              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-white/70">
                                <div className="flex items-center justify-center">
                                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-transparent"></div>
                                </div>
                                <p>
                                  {lecture.status === 'in_progress'
                                    ? 'Professor is preparing your lecture. This can take a couple of minutes.'
                                    : 'No content generated yet.'}
                                </p>
                                {lecture.status !== 'in_progress' && (
                                  <Button variant="outline" onClick={() => setActiveTab('quiz')}>
                                    Go to Quiz
                                  </Button>
                                )}
                              </div>
                            )}
                          </TabsContent>
                          <TabsContent value="chat" className="mt-4 h-full">
                            <div className="flex h-full items-center justify-center text-sm text-white/70">Chat coming soon</div>
                          </TabsContent>
                          <TabsContent value="quiz" className="mt-4 h-full">
                            <CourseQuiz
                              lecture={lecture!}
                              onQuizCompleted={async (passed, attempt) => {
                                if (!course) return;
                                const updatedCourse: Course = { ...course };
                                const idx = updatedCourse.lectures.findIndex(l => l.id === lecture!.id);
                                if (idx >= 0)
                                {
                                  const updatedLecture: CourseLecture = {
                                    ...updatedCourse.lectures[idx],
                                    quizAttempts: [...updatedCourse.lectures[idx].quizAttempts, attempt]
                                  };
                                  updatedCourse.lectures[idx] = updatedLecture;
                                  if (passed)
                                  {
                                    updatedCourse.lectures[idx] = {
                                      ...updatedCourse.lectures[idx],
                                      status: 'completed'
                                    };
                                    if (idx + 1 < updatedCourse.lectures.length)
                                    {
                                      const next = updatedCourse.lectures[idx + 1];
                                      if (next.status === 'locked')
                                      {
                                        updatedCourse.lectures[idx + 1] = {
                                          ...next,
                                          status: 'unlocked'
                                        };
                                      }
                                    }
                                    updatedCourse.completedLectures = Math.min(
                                      updatedCourse.lectures.length,
                                      (updatedCourse.lectures.filter(l => l.status === 'completed').length)
                                    );
                                    updatedCourse.overallProgress = Math.round(
                                      (updatedCourse.lectures.filter(l => l.status === 'completed').length / updatedCourse.lectures.length) * 100
                                    );
                                  }
                                  setLecture(updatedCourse.lectures[idx]);
                                }
                                await universityApi.saveCourse(updatedCourse);
                                if (passed)
                                {
                                  setActiveTab('lecture');
                                }
                              }}
                              onGenerateMoreQuestions={async () => {
                                if (!course) return;
                                const more = await universityApi.generateQuiz({
                                  courseId: course!.metadata.id,
                                  lectureId: lecture!.id,
                                  lectureContent: lecture!.content || ''
                                });
                                const updatedCourse: Course = { ...course! };
                                const idx = updatedCourse.lectures.findIndex(l => l.id === lecture!.id);
                                if (idx >= 0)
                                {
                                  updatedCourse.lectures[idx] = {
                                    ...updatedCourse.lectures[idx],
                                    quiz: (updatedCourse.lectures[idx].quiz || []).concat(more)
                                  };
                                  await universityApi.saveCourse(updatedCourse);
                                  setCourse(updatedCourse);
                                  setLecture(updatedCourse.lectures[idx]);
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
      </div>
    );
  };

  return (
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
        navigate(RouteUtils.mainAppWithMode(mode));
      }}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(prev => !prev)}
      renderLeftSidebarOverride={() => null}
    />
  );
};

export default CourseLectureView;
