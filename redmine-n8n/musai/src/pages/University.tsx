import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { BaseLayout } from '@/components/common/BaseLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APP_TERMS } from '@/config/constants';
import { RouteUtils } from '@/config/routes';
import { universityApi } from '@/lib/universityApi';
import { MusaiCopilotSummon } from '@/components/common/MusaiCopilotSummon';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';
import type { Course, Lecture, StandaloneLecture } from '@/types/university';
import {
  GraduationCap,
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  BookmarkCheck,
  Target,
  RefreshCcw,
  Calendar
} from 'lucide-react';

interface RecentLectureEntry {
  id: string;
  title: string;
  courseTitle?: string;
  updatedAt: string;
  status: string;
  scope: 'course' | 'standalone' | 'legacy';
  courseId?: string;
}

const buildRecentLectureEntries = (courses: Course[], standalone: StandaloneLecture[], legacy: Lecture[]): RecentLectureEntry[] =>
{
  const entries: RecentLectureEntry[] = [];

  for (const course of courses)
  {
    for (const lecture of course.lectures)
    {
      entries.push({
        id: lecture.id,
        title: lecture.title,
        courseTitle: course.metadata.title,
        updatedAt: lecture.updatedAt || course.metadata.updatedAt || course.metadata.createdAt,
        status: lecture.status ?? 'unlocked',
        scope: 'course',
        courseId: course.metadata.id
      });
    }
  }

  for (const lecture of standalone)
  {
    entries.push({
      id: lecture.id,
      title: lecture.title,
      updatedAt: lecture.updatedAt || lecture.createdAt,
      status: 'complete',
      scope: 'standalone'
    });
  }

  for (const lecture of legacy)
  {
    entries.push({
      id: lecture.id,
      title: lecture.title,
      updatedAt: lecture.updatedAt || lecture.createdAt,
      status: lecture.status,
      scope: 'legacy'
    });
  }

  return entries
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);
};

const University = () =>
{
  const [courses, setCourses] = useState<Course[]>([]);
  const [legacyLectures, setLegacyLectures] = useState<Lecture[]>([]);
  const [standaloneLectures, setStandaloneLectures] = useState<StandaloneLecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const loadCatalogue = useCallback(async () =>
  {
    try
    {
      setIsLoading(true);
      const [legacyData, courseData, standaloneData] = await Promise.all([
        universityApi.getLectures(),
        universityApi.getCourses(),
        universityApi.getStandaloneLectures()
      ]);
      setLegacyLectures(Array.isArray(legacyData) ? legacyData : []);
      setCourses(Array.isArray(courseData) ? courseData : []);
      setStandaloneLectures(Array.isArray(standaloneData) ? standaloneData : []);
    }
    catch (error)
    {
      console.error('Failed to load Musai University catalogue', error);
    }
    finally
    {
      setIsLoading(false);
    }
  }, []);

  useEffect(() =>
  {
    loadCatalogue();
  }, [loadCatalogue]);

  const startCourseConcept = useCallback((topic?: string) =>
  {
    const query = topic ? `?topic=${encodeURIComponent(topic)}` : '';
    navigate(`/university/course/new${query}`);
  }, [navigate]);

  useEffect(() =>
  {
    const initialTopic = location.state?.initialQuery || searchParams.get('topic');
    if (initialTopic)
    {
      startCourseConcept(initialTopic);
    }
  }, [location.state, searchParams, startCourseConcept]);

  const stats = useMemo(() =>
  {
    const totalCourseLectures = courses.reduce((acc, course) => acc + course.lectures.length, 0);
    const totalCompletedLectures = courses.reduce((acc, course) => acc + course.completedLectures, 0);
    return {
      totalCourses: courses.length,
      totalLectures: totalCourseLectures + legacyLectures.length + standaloneLectures.length,
      completedCourses: courses.filter(course => course.overallProgress === 100).length,
      inProgressCourses: courses.filter(course => course.overallProgress > 0 && course.overallProgress < 100).length,
      completedLectures: totalCompletedLectures + standaloneLectures.length
    };
  }, [courses, legacyLectures.length, standaloneLectures.length]);

  const recentLectures = useMemo(
    () => buildRecentLectureEntries(courses, standaloneLectures, legacyLectures),
    [courses, standaloneLectures, legacyLectures]
  );

  const activeCourses = useMemo(() =>
    courses
      .slice()
      .sort((a, b) => (b.metadata.updatedAt || b.metadata.createdAt).localeCompare(a.metadata.updatedAt || a.metadata.createdAt))
      .slice(0, 4)
  , [courses]);

  const handleOpenCourse = useCallback((courseId: string) =>
  {
    navigate(`/university/course/${courseId}`);
  }, [navigate]);

  const handleOpenLecture = useCallback((lectureId: string) =>
  {
    navigate(`/university/lecture/${lectureId}`);
  }, [navigate]);

  const handleOpenStandalone = useCallback((lectureId: string) =>
  {
    navigate(`/university/standalone/${lectureId}`);
  }, [navigate]);

  const hero = (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white shadow-2xl">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />
      <div className="relative px-6 py-10 sm:px-10 sm:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              Generative Curriculum Studio
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Musai University
            </h1>
            <p className="text-sm sm:text-base text-white/80 max-w-2xl">
              Shape a bespoke syllabus, evolve lectures with AI scholars, and archive every insight in a living academy that grows alongside you.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/70">
              <span className="inline-flex items-center gap-1">
                <BookmarkCheck className="h-4 w-4" />
                {stats.completedCourses} courses completed
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {stats.totalLectures} curated lectures
              </span>
              <span className="inline-flex items-center gap-1">
                <Target className="h-4 w-4" />
                {stats.inProgressCourses} currently in flight
              </span>
            </div>
          </div>
          <div className="grid gap-3 text-sm min-w-[220px]">
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => startCourseConcept()}
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Design a new course
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => navigate('/university/lecture/new')}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Compose a lecture
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMainContent = () =>
  {
    if (isLoading)
    {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-indigo-500" />
            <p>Compiling the faculty records…</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full overflow-y-auto">
        <div className="space-y-10 px-6 py-10 pb-32 md:px-10 lg:px-12">
          {hero}

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="shadow-sm border-none bg-gradient-to-br from-indigo-50 via-white to-white dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-[0.18em]">Active Courses</CardTitle>
                <CardDescription className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.totalCourses}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Programmes generated in this studio
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-gradient-to-br from-emerald-50 via-white to-white dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-300 uppercase tracking-[0.18em]">Courses Completed</CardTitle>
                <CardDescription className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.completedCourses}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Fully mastered journeys
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-gradient-to-br from-amber-50 via-white to-white dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-[0.18em]">Lectures Authored</CardTitle>
                <CardDescription className="text-3xl font-bold text-slate-900 dark:text-white">
                  {stats.totalLectures}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Across courses & standalone studies
              </CardContent>
            </Card>
            <Card className="shadow-sm border-none bg-gradient-to-br from-purple-50 via-white to-white dark:from-slate-900/50 dark:via-slate-950 dark:to-slate-950">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-purple-600 dark:text-purple-300 uppercase tracking-[0.18em]">Legacy Archives</CardTitle>
                <CardDescription className="text-3xl font-bold text-slate-900 dark:text-white">
                  {legacyLectures.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Classic lecture transcripts preserved
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Active Courses</CardTitle>
                  <CardDescription>Continue where you left off or review completed syllabi.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={loadCatalogue} className="gap-2">
                  <RefreshCcw className="h-4 w-4" /> Sync
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeCourses.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-6 py-10 text-center text-muted-foreground">
                    No active courses yet. Draft a new journey with the planner or revisit a completed program.
                  </div>
                ) : (
                  activeCourses.map(course => (
                    <div key={course.metadata.id} className="flex flex-col gap-4 rounded-2xl border bg-card/60 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="uppercase tracking-[0.18em] text-xs">Course</Badge>
                          {course.overallProgress === 100 && (
                            <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-200">Completed</Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold leading-tight">{course.metadata.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{course.metadata.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            Updated {formatDistanceToNow(new Date(course.metadata.updatedAt || course.metadata.createdAt), { addSuffix: true })}
                          </span>
                          <span>
                            {course.completedLectures} / {course.lectures.length} lectures complete
                          </span>
                        </div>
                      </div>
                      <div className="w-full lg:w-auto">
                        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                            style={{ width: `${course.overallProgress}%` }}
                          />
                        </div>
                        <Button className="w-full lg:w-auto" onClick={() => handleOpenCourse(course.metadata.id)}>
                          Resume course
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Recent lectures</CardTitle>
                <CardDescription>Your latest generated lessons and archives.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentLectures.length === 0 ? (
                  <div className="rounded-xl border border-dashed px-4 py-8 text-center text-muted-foreground">
                    Lecture notes will appear here as you author new material.
                  </div>
                ) : (
                  recentLectures.map(entry => (
                    <div key={`${entry.scope}-${entry.id}`} className="rounded-xl border bg-card/60 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {entry.scope === 'course' && <span>Course lecture</span>}
                            {entry.scope === 'standalone' && <span>Standalone</span>}
                            {entry.scope === 'legacy' && <span>Legacy archive</span>}
                          </div>
                          <h4 className="text-sm font-semibold leading-snug">{entry.title}</h4>
                          {entry.courseTitle && (
                            <p className="text-xs text-muted-foreground">{entry.courseTitle}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end text-right text-[11px] text-muted-foreground">
                          <span>{formatDistanceToNow(new Date(entry.updatedAt), { addSuffix: true })}</span>
                          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 uppercase tracking-[0.14em]">
                            <Calendar className="h-3 w-3" />
                            {entry.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-3 text-xs"
                          onClick={() => {
                            if (entry.scope === 'course' && entry.courseId)
                            {
                              handleOpenCourse(entry.courseId);
                            }
                            else if (entry.scope === 'standalone')
                            {
                              handleOpenStandalone(entry.id);
                            }
                            else
                            {
                              handleOpenLecture(entry.id);
                            }
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="rounded-3xl border bg-card/70 p-8 shadow-lg">
            <div className="mb-6 space-y-2">
              <h2 className="text-2xl font-semibold">Draft a new programme</h2>
              <p className="text-sm text-muted-foreground">Invite Musai to architect a syllabus, generate lesson plans, and track your mastery session by session.</p>
            </div>
            <PreMusaiPage
              type="university"
              onSubmit={(topic) => {
                startCourseConcept(topic);
              }}
              isLoading={false}
            />
          </div>

          <div className="mt-12 flex justify-center">
            <MusaiCopilotSummon className="w-full max-w-2xl" />
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
      onNewSession={() => startCourseConcept()}
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
          return;
        }
        navigate(RouteUtils.mainAppWithMode(mode));
      }}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(prev => !prev)}
      renderLeftSidebarOverride={() => null}
      hideLeftSidebar
    />
  );
};

export default University;
