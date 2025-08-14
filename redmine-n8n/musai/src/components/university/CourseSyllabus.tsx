import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ROUTES from '@/config/routes';
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
  Settings,
  FileText,
  GraduationCap
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { universityApi } from '@/lib/universityApi';
import { NavigationBar } from '@/components/common/NavigationBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Course, CourseLecture, QuizStatus } from '@/types/university';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

const CourseSyllabus = () => 
{
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingLecture, setIsGeneratingLecture] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const isMobile = useIsMobile();
  const { recordLastSession } = useUserPreferences();

  useEffect(() => 
  {
    if (courseId) 
    {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => 
  {
    if (!courseId) return;
    
    try 
    {
      setIsLoading(true);
      const courseData = await universityApi.getCourse(courseId);
      if (courseData) 
      {
        setCourse(courseData);
      } 
      else 
      {
        navigate('/university');
      }
    } 
    catch (error) 
    {
      console.error('Failed to load course:', error);
      navigate('/university');
    } 
    finally 
    {
      setIsLoading(false);
    }
  };

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
    if (lecture.status === 'locked') 
    {
      // Check if previous lecture is completed
      if (index > 0) 
      {
        const previousLecture = course?.lectures[index - 1];
        if (previousLecture?.status !== 'completed') 
        {
          alert('Complete the previous lecture first');
          return;
        }
      }
    }

    if (!lecture.content) 
    {
      // Generate lecture content
      setIsGeneratingLecture(lecture.id);
      try 
      {
        const generatedLecture = await universityApi.generateLecture({
          courseId: course!.metadata.id,
          lectureIndex: index,
          lectureTitle: lecture.title,
          previousLectureContext: index > 0 ? course?.lectures[index - 1]?.content : undefined,
          processorFile: course?.metadata.processorFile
        });

        // Update course with generated lecture
        const updatedCourse = { ...course! };
        updatedCourse.lectures[index] = {
          ...generatedLecture,
          status: 'unlocked'
        };
        
        await universityApi.saveCourse(updatedCourse);
        setCourse(updatedCourse);
      } 
      catch (error) 
      {
        console.error('Error generating lecture:', error);
        alert('Failed to generate lecture. Please try again.');
      } 
      finally 
      {
        setIsGeneratingLecture(null);
      }
    } 
    else 
    {
      // Navigate to lecture view and record session
      recordLastSession('university', {
        courseId: courseId!,
        lectureId: lecture.id,
        view: 'lecture'
      });
      navigate(`/university/course/${courseId}/lecture/${lecture.id}`);
    }
  };

  const handleTabChange = (tab: string) => 
  {
    switch (tab) 
    {
      case "chat":
        navigate(ROUTES.MAIN_APP);
        break;
      case "musai-search":
        navigate(ROUTES.MAIN_APP, { state: { switchToTab: "musai-search" } });
        break;
      case "code-musai":
        navigate(ROUTES.MAIN_APP, { state: { switchToTab: "code-musai" } });
        break;
      case "musai-university":
        navigate("/university");
        break;
      default:
        break;
    }
  };

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
      {/* Navigation Sidebar */}
      <NavigationBar
        currentTab="musai-university"
        onTabChange={handleTabChange}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      <div className={cn(
        "container mx-auto px-4 py-8 transition-all duration-300 max-w-7xl",
        isMobile ? "ml-0" : isSidebarExpanded ? "ml-48" : "ml-16"
      )}>
        {/* Course Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Course Progress</span>
                  <span className="font-medium">{course.overallProgress}%</span>
                </div>
                <Progress value={course.overallProgress} className="h-2" />
                <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>{course.completedLectures} of {course.lectures.length} lectures completed</span>
                  <span>Pass threshold: {course.metadata.passThreshold}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/university')}
              >
                Back to Courses
              </Button>
              {course.metadata.processorFile && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/university/course/${courseId}/settings`)}
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
                <FileText className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-semibold">Course Exams</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Generate midterm or final covering prior material</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!course) return;
                    const contents = course.lectures
                      .filter((l) => l.content)
                      .map((l) => l.content as string);
                    const exam = await universityApi.generateCourseExam(course.metadata.id, 'midterm', contents.slice(0, Math.ceil(contents.length / 2)));
                    const updatedCourse = { ...course, midtermExam: exam } as Course;
                    await universityApi.saveCourse(updatedCourse);
                    setCourse(updatedCourse);
                    alert('Midterm generated');
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" /> Generate Midterm
                </Button>
                <Button
                  onClick={async () => {
                    if (!course) return;
                    const contents = course.lectures
                      .filter((l) => l.content)
                      .map((l) => l.content as string);
                    const exam = await universityApi.generateCourseExam(course.metadata.id, 'final', contents);
                    const updatedCourse = { ...course, finalExam: exam } as Course;
                    await universityApi.saveCourse(updatedCourse);
                    setCourse(updatedCourse);
                    alert('Final exam generated');
                  }}
                >
                  <GraduationCap className="mr-2 h-4 w-4" /> Generate Final
                </Button>
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
                <div className="flex items-start justify-between gap-3">
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
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Badge 
                      variant={
                        lecture.status === 'completed' ? 'default' :
                        lecture.status === 'in_progress' ? 'secondary' :
                        lecture.status === 'unlocked' ? 'outline' : 'secondary'
                      }
                    >
                      {lecture.status.replace('_', ' ')}
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

export default CourseSyllabus; 