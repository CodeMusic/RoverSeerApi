import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ROUTES, { RouteUtils } from '@/config/routes';
import { 
  BookOpen, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Play, 
  Sparkles, 
  Brain,
  Clock,
  User,
  Settings
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { universityApi } from '@/lib/universityApi';
import { cn } from '@/lib/utils';
import type { Course, CourseLecture, QuizStatus } from '@/types/university';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { BaseLayout } from '@/components/common/BaseLayout';
import { APP_TERMS } from '@/config/constants';

const CourseSyllabus = () => 
{
  const location = useLocation();
  const initialCourse = (location.state as { course?: Course } | undefined)?.course;
  const [course, setCourse] = useState<Course | null>(initialCourse ?? null);
  const [isLoading, setIsLoading] = useState(!initialCourse);
  const [isGeneratingLecture, setIsGeneratingLecture] = useState<string | null>(null);
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const { recordLastSession } = useUserPreferences();
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

  useEffect(() =>
  {
    if (!courseId || !initialCourse)
    {
      return;
    }
    if (initialCourse.metadata.id !== courseId)
    {
      return;
    }
    setCourse(initialCourse);
    setIsLoading(false);
  }, [courseId, initialCourse]);

  const loadCourse = useCallback(async () => 
  {
    if (!courseId)
    {
      return;
    }

    const hasInitial = Boolean(initialCourse && initialCourse.metadata.id === courseId);

    try 
    {
      if (!hasInitial)
      {
        setIsLoading(true);
      }

      const courseData = await universityApi.getCourse(courseId);

      if (courseData)
      {
        setCourse(courseData);
        return;
      }

      if (hasInitial && initialCourse)
      {
        // Fall back to the just-created course passed through navigation state
        setCourse(initialCourse);
        return;
      }

      navigate('/university', { replace: true, state: { missingCourseId: courseId } });
    }
    catch (error) 
    {
      console.error('Failed to load course:', error);

      if (hasInitial && initialCourse)
      {
        setCourse(initialCourse);
        return;
      }

      navigate('/university', { replace: true, state: { missingCourseId: courseId, loadError: String(error) } });
    } 
    finally 
    {
      setIsLoading(false);
    }
  }, [courseId, navigate, initialCourse]);

  useEffect(() => 
  {
    if (courseId) 
    {
      loadCourse();
    }
  }, [courseId, loadCourse]);

  useEffect(() =>
  {
    if (!course)
    {
      return;
    }
    recordLastSession('university', {
      courseId: course.metadata.id,
      view: 'course'
    });
  }, [course, recordLastSession]);

  const getLectureStatusIcon = (lecture: CourseLecture) => 
  {
    switch (lecture.status) 
    {
      case 'locked':
        return <Lock className="h-5 w-5 text-gray-400" />;
      case 'unlocked':
        return <Unlock className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Lock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getQuizStatus = (lecture: CourseLecture): QuizStatus => 
  {
    if (!lecture.quiz) return 'unwritten';
    if (lecture.quizAttempts.length === 0) return 'available';
    
    const lastAttempt = lecture.quizAttempts[lecture.quizAttempts.length - 1];
    return lastAttempt.passed ? 'passed' : 'failed';
  };

  const getQuizStatusIcon = (status: QuizStatus) => 
  {
    switch (status) 
    {
      case 'unwritten':
        return <Sparkles className="h-5 w-5 text-purple-400" />; // Quantum superposition
      case 'available':
        return <Brain className="h-5 w-5 text-blue-500" />;
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <Clock className="h-5 w-5 text-red-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-400" />;
    }
  };

  const handleLectureClick = async (lecture: CourseLecture, index: number) => 
  {
    if (!course)
    {
      return;
    }

    if (lecture.status === 'locked') 
    {
      if (index > 0) 
      {
        const previousLecture = course.lectures[index - 1];
        if (previousLecture?.status !== 'completed') 
        {
          alert('Complete the previous lecture first');
          return;
        }
      }
    }

    const goToLecture = (courseState: Course, lectureState: CourseLecture, shouldGenerate?: boolean) =>
    {
      recordLastSession('university', {
        courseId: courseId!,
        lectureId: lectureState.id,
        view: 'lecture'
      });
      navigate(`/university/course/${courseId}/lecture/${lectureState.id}`, {
        state: shouldGenerate
          ? { course: courseState, lecture: lectureState, shouldGenerate: true }
          : { course: courseState, lecture: lectureState }
      });
    };

    if (lecture.status === 'in_progress')
    {
      setIsGeneratingLecture(lecture.id);
      goToLecture(course, lecture, true);
      return;
    }

    if (!lecture.content) 
    {
      setIsGeneratingLecture(lecture.id);

      const nextCourse: Course = {
        ...course,
        lectures: course.lectures.map((item, idx) => idx === index
          ? { ...item, status: 'in_progress' }
          : item
        )
      };
      nextCourse.currentLectureIndex = index;

      setCourse(nextCourse);
      goToLecture(nextCourse, nextCourse.lectures[index], true);
      universityApi.saveCourse(nextCourse).catch(error => console.error('Failed to mark lecture in progress', error));
      return;
    }

    recordLastSession('university', {
      courseId: courseId!,
      lectureId: lecture.id,
      view: 'lecture'
    });
    navigate(`/university/course/${courseId}/lecture/${lecture.id}`, {
      state: {
        course,
        lecture
      }
    });
  };

  const handleTabChange = (tab: string) =>
  {
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
  };

  const renderMainContent = () =>
  {
    if (isLoading)
    {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading course...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!course)
    {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Course not found
              </h2>
              <Button onClick={() => navigate('/university')}>
                Back to University
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Course Header */}
          <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg">
                  {course.metadata.imagePath ? (
                    <img
                      src={course.metadata.imagePath}
                      alt={`${course.metadata.title} cover`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {course.metadata.title}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    by {course.metadata.instructor}
                  </p>
                </div>
              </div>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
                {course.metadata.description}
              </p>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Course Progress</span>
                  <span className="font-medium">{course.overallProgress}%</span>
                </div>
                <Progress value={course.overallProgress} className="h-2" />
                <div className="flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{course.completedLectures} of {course.lectures.length} lectures completed</span>
                  <span>Pass threshold: {course.metadata.passThreshold}%</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex w-full flex-col gap-2 sm:mt-0 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                onClick={() => navigate('/university')}
                className="w-full sm:w-auto"
              >
                Back to Courses
              </Button>
              {course.metadata.processorFile && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/university/course/${courseId}/settings`)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Lectures Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Exam Actions */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold">Course Exams</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Generate midterm or final covering prior material</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Exam generation will be wired up after lecture workflows stabilize. For now, continue through the syllabus and mark lectures complete to track progress.
              </div>
            </CardHeader>
          </Card>

          {course.lectures.map((lecture, index) => (
            <Card 
              key={lecture.id} 
              className={cn(
                "hover:shadow-lg transition-all duration-200 cursor-pointer",
                lecture.status === 'locked' && "opacity-60"
              )}
              onClick={() => handleLectureClick(lecture, index)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      {getLectureStatusIcon(lecture)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold mb-1 line-clamp-2">
                        {lecture.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 text-sm">
                        {lecture.summary}
                      </CardDescription>
                      {lecture.duration && (
                        <div className="mt-1 text-xs font-medium text-muted-foreground">
                          {lecture.duration}
                        </div>
                      )}
                      {lecture.content && (
                        <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-500 dark:text-emerald-300">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Lecture generated
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <Badge
                      variant={
                        lecture.status === 'completed' || lecture.content ? 'default' :
                        lecture.status === 'in_progress' ? 'secondary' :
                        lecture.status === 'unlocked' ? 'outline' : 'secondary'
                      }
                    >
                      {lecture.content ? 'generated' : lecture.status.replace('_', ' ')}
                    </Badge>
                    
                    {/* Quiz Status */}
                    <div className="flex items-center gap-1">
                      {getQuizStatusIcon(getQuizStatus(lecture))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Generation Status */}
                  {isGeneratingLecture === lecture.id && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>🧑‍🏫 Professor is preparing your lecture...</span>
                    </div>
                  )}
                  
                  {/* Quiz Attempts */}
                  {lecture.quizAttempts.length > 0 && (
                    <div className="flex gap-1">
                      {lecture.quizAttempts.map((attempt, attemptIndex) => (
                        <div
                          key={attempt.id}
                          className={cn(
                            "w-3 h-3 rounded-full",
                            attempt.passed ? "bg-green-500" : "bg-red-500"
                          )}
                          title={`Attempt ${attemptIndex + 1}: ${Math.round(attempt.score * 100)}%`}
                        />
                      ))}
                    </div>
                  )}
                  
                  {/* Action Button */}
                  <Button
                    className="w-full"
                    variant={lecture.status === 'completed' ? 'outline' : 'default'}
                    disabled={lecture.status === 'locked' || isGeneratingLecture === lecture.id}
                  >
                    {lecture.status === 'completed' ? 'Review' :
                     lecture.status === 'locked' ? 'Locked' :
                     lecture.status === 'in_progress' ? 'Open Lecture' :
                     !lecture.content ? 'Generate Lecture' : 'Continue'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
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
      onTabChange={handleTabChange}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(prev => !prev)}
      renderLeftSidebarOverride={() => null}
      hideLeftSidebar
    />
  );
};

export default CourseSyllabus;
