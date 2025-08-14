import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, Brain, Lock, MessageCircle, CheckCircle } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import type { Course, CourseLecture, UniversityTab } from '@/types/university';
import LectureContent from '@/components/university/LectureContent';
import LectureChat from '@/components/university/LectureChat';
import CourseQuiz from '@/components/university/CourseQuiz';

const CourseLectureView = () =>
{
  const { courseId, lectureId } = useParams<{ courseId: string; lectureId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lecture, setLecture] = useState<CourseLecture | null>(null);
  const [activeTab, setActiveTab] = useState<UniversityTab>('lecture');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() =>
  {
    const load = async () =>
    {
      if (!courseId || !lectureId) return;
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
      setIsLoading(false);
    };
    load();
  }, [courseId, lectureId, navigate]);

  const updateLecture = async (updatedLectureLegacy: any) =>
  {
    // This view operates on CourseLecture; safeguard in case a legacy component passes a different shape
    if (!course || !lecture) return;
    const updatedCourse: Course = { ...course };
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(`/university/course/${course.metadata.id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Syllabus
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{course.metadata.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">{lecture.title}</p>
            </div>
          </div>
          <Badge variant={lecture.status === 'completed' ? 'default' : 'secondary'}>
            {lecture.status === 'completed' ? (
              <>
                <CheckCircle className="mr-1 h-3 w-3" /> Completed
              </>
            ) : (
              lecture.status.replace('_', ' ')
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Course Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between text-sm mb-2">
                  <span>{course.completedLectures} of {course.lectures.length} completed</span>
                  <span>{getOverallProgress()}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
            <Card className="h-[calc(100dvh-220px)]">
              <CardHeader>
                <CardTitle className="text-lg">{lecture.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as UniversityTab)} className="h-full flex flex-col">
                  <TabsList className="mx-6 mt-2">
                    <TabsTrigger value="lecture" disabled={isTabLocked('lecture')} className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" /> Lecture
                    </TabsTrigger>
                    <TabsTrigger value="chat" disabled={isTabLocked('chat')} className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" /> Chat
                    </TabsTrigger>
                    <TabsTrigger value="quiz" disabled={isTabLocked('quiz')} className="flex items-center gap-2">
                      {isTabLocked('quiz') ? <Lock className="h-4 w-4" /> : <Brain className="h-4 w-4" />} Quiz
                    </TabsTrigger>
                  </TabsList>
                  <div className="flex-1 px-6 pb-6">
                    <TabsContent value="lecture" className="mt-4 h-full">
                      {/* Legacy LectureContent expects a legacy Lecture shape; we render content text if available */}
                      {lecture.content ? (
                        <div className="prose dark:prose-invert max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: lecture.content }} />
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <div className="text-center">
                            <p className="mb-4">No content generated yet.</p>
                            <Button onClick={() => setActiveTab('quiz')}>Go to Quiz</Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="chat" className="mt-4 h-full">
                      {/* Placeholder chat until dedicated course-lecture chat exists */}
                      <div className="h-full flex items-center justify-center text-sm text-gray-500">Chat coming soon</div>
                    </TabsContent>
                    <TabsContent value="quiz" className="mt-4 h-full">
                      <CourseQuiz
                        lecture={lecture}
                        onQuizCompleted={(passed, attempt) => {
                          if (!course) return;
                          // Update lecture status and course progress
                          const updatedCourse: Course = { ...course };
                          const idx = updatedCourse.lectures.findIndex(l => l.id === lecture.id);
                          if (idx >= 0)
                          {
                            // Record attempt locally on the lecture
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
                              // Unlock next lecture if exists
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
                          universityApi.saveCourse(updatedCourse);
                          if (passed)
                          {
                            setActiveTab('lecture');
                          }
                        }}
                        onGenerateMoreQuestions={async () => {
                          if (!course) return;
                          const more = await universityApi.generateQuiz({
                            courseId: course.metadata.id,
                            lectureId: lecture.id,
                            lectureContent: lecture.content || ''
                          });
                          const updatedCourse: Course = { ...course };
                          const idx = updatedCourse.lectures.findIndex(l => l.id === lecture.id);
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
  );
};

export default CourseLectureView;

