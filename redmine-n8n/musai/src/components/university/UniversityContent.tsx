import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, BookOpen, Clock, CheckCircle, Download, GraduationCap, Sparkles, ArrowLeft, Trash2, MoreVertical } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { universityApi } from '@/lib/universityApi';
import { cn } from '@/lib/utils';
import type { Lecture, Course, StandaloneLecture } from '@/types/university';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';
import CourseCreation from '@/components/university/CourseCreation';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';

export const UniversityContent = () => {
  const [lectures, setLectures] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [standaloneLectures, setStandaloneLectures] = useState<StandaloneLecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [currentView, setCurrentView] = useState<'dashboard' | 'create-course' | 'create-lecture'>('dashboard');
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { preferences, recordLastSession, getLastSession } = useUserPreferences();

  // Smart auto-navigation: use last session first, fallback to first course
  useEffect(() => {
    if (preferences.autoSelectFirstItem && courses.length > 0 && currentView === 'dashboard') {
      const lastSession = getLastSession('university');
      
      // Priority 1: Navigate to last used course if it exists
      if (lastSession?.courseId) {
        const lastCourse = courses.find(course => course.metadata.id === lastSession.courseId);
        if (lastCourse) {
          console.log('🎓 Navigating to last used course:', lastCourse.metadata.title);
          navigate(`/university/course/${lastSession.courseId}`);
          return;
        }
      }
      
      // Priority 2: Fallback to first course if auto-select is enabled
      console.log('🎓 No last session found, navigating to first course:', courses[0].metadata.title);
      navigate(`/university/course/${courses[0].metadata.id}`);
    }
  }, [preferences.autoSelectFirstItem, courses, currentView, navigate, getLastSession]);

  useEffect(() => {
    loadData();
  }, []);

  // Handle initial query from landing page navigation or URL parameters
  useEffect(() => {
    const initialQuery = location.state?.initialQuery || searchParams.get('topic');
    if (initialQuery) {
      console.log('University content received initial query:', initialQuery);
      // Auto-navigate to create new course with the query as topic
      navigate(`/university/course/new?topic=${encodeURIComponent(initialQuery)}`, { 
        state: { 
          initialTopic: initialQuery,
          fromLanding: true 
        },
        replace: true // Replace current history entry to prevent back button issues
      });
    }
  }, [location.state, searchParams, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [lecturesData, coursesData, standaloneData] = await Promise.all([
        universityApi.getLectures(),
        universityApi.getCourses(),
        universityApi.getStandaloneLectures()
      ]);
      setLectures(lecturesData);
      setCourses(coursesData);
      setStandaloneLectures(standaloneData);
    } 
    catch (error) {
      console.error('Failed to load data:', error);
    } 
    finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      await universityApi.deleteCourse(courseId);
      await loadData(); // Refresh the data
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    try {
      await universityApi.deleteLecture(lectureId);
      await loadData(); // Refresh the data
    } catch (error) {
      console.error('Failed to delete lecture:', error);
    }
  };

  const handleDeleteStandaloneLecture = async (lectureId: string) => {
    try {
      // Using the same delete function for standalone lectures
      await universityApi.deleteLecture(lectureId);
      await loadData(); // Refresh the data
    } catch (error) {
      console.error('Failed to delete standalone lecture:', error);
    }
  };

  const getStatusBadge = (status: Lecture['status']) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-300',
      completed: 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-300'
    };

    return (
      <Badge className={cn('text-xs', statusColors[status])}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Handle different views
  if (currentView === 'create-course') {
    return (
      <div className="p-4 sm:p-6 h-full overflow-auto">
        <div className="mb-6">
          <Button 
            onClick={() => setCurrentView('dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to University
          </Button>
          <h1 className="text-2xl font-bold">Create New Course</h1>
          <p className="text-muted-foreground">Design a structured learning experience</p>
        </div>
        <CourseCreation 
          initialTopic={pendingTopic || searchParams.get('topic') || undefined}
          onComplete={(course) => {
            setPendingTopic(null);
            setCurrentView('dashboard');
            recordLastSession('university', { courseId: course.metadata.id });
            void loadData(); // Refresh the data asynchronously
            navigate(`/university/course/${course.metadata.id}`, {
              state: {
                course,
                fromCreation: true
              },
              replace: true
            });
          }}
        />
      </div>
    );
  }

  if (currentView === 'create-lecture') {
    return (
      <div className="p-4 sm:p-6 h-full overflow-auto">
        <div className="mb-6">
          <Button 
            onClick={() => setCurrentView('dashboard')}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to University
          </Button>
          <h1 className="text-2xl font-bold">Create New Lecture</h1>
          <p className="text-muted-foreground">Design an individual lesson</p>
        </div>
        {/* TODO: Add LectureCreation component here */}
        <div className="text-center py-8">
          <p>Lecture creation coming soon...</p>
          <Button onClick={() => setCurrentView('dashboard')} className="mt-4">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 border-b-2 border-purple-200 dark:border-purple-800 pb-2">
              🎓 Musai U
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              AI-powered personalized learning experiences
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => setCurrentView('create-course')}
              className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
              size="lg"
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Create Course
            </Button>
            <Button 
              onClick={() => setCurrentView('create-lecture')}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Create Lecture
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active learning paths
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lectures</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lectures.length}</div>
            <p className="text-xs text-muted-foreground">
              Available lessons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Standalone</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{standaloneLectures.length}</div>
            <p className="text-xs text-muted-foreground">
              Independent content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lectures.length > 0 ? Math.round((lectures.filter(l => l.status === 'completed').length / lectures.length) * 100) : 0}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: lectures.length > 0 
                    ? `${(lectures.filter(l => l.status === 'completed').length / lectures.length) * 100}%` 
                    : '0%' 
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Show PreMusaiPage if everything is empty */}
      {!isLoading && courses.length === 0 && lectures.length === 0 && standaloneLectures.length === 0 ? (
        <div className="mt-8">
                      <PreMusaiPage
              type="university"
              onSubmit={(input) => {
                // Carry topic into the creation flow and trigger generation there
                setPendingTopic(input);
                setCurrentView('create-course');
              }}
              onQuickAction={(actionId, actionType, actionData) => {
                switch (actionId) {
                  case 'university-chat':
                    // Start a new university chat session
                    console.log('Starting new university chat session');
                    break;
                  case 'uni-browse':
                    // Stay on dashboard to browse courses
                    break;
                  case 'uni-create':
                    setCurrentView('create-course');
                    break;
                  case 'uni-continue':
                    // Smart continue: last session first, then first course
                    const lastSession = getLastSession('university');
                    if (lastSession?.courseId) {
                      const lastCourse = courses.find(course => course.metadata.id === lastSession.courseId);
                      if (lastCourse) {
                        recordLastSession('university', {
                          courseId: lastSession.courseId,
                          view: 'course'
                        });
                        navigate(`/university/course/${lastSession.courseId}`);
                        break;
                      }
                    }
                    // Fallback to first course
                    if (courses.length > 0) {
                      recordLastSession('university', {
                        courseId: courses[0].metadata.id,
                        view: 'course'
                      });
                      navigate(`/university/course/${courses[0].metadata.id}`);
                    }
                    break;
                  default:
                    console.log('University quick action:', actionId, actionType, actionData);
                }
              }}
              isLoading={false}
            />
        </div>
      ) : (
        <>
          {/* Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
              <TabsTrigger value="courses" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Courses
              </TabsTrigger>
              <TabsTrigger value="lectures" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Lectures
              </TabsTrigger>
              <TabsTrigger value="standalone" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Standalone
              </TabsTrigger>
            </TabsList>

            {/* Courses Tab */}
            <TabsContent value="courses" className="space-y-6">
              {courses.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first course</p>
                    <Button onClick={() => setCurrentView('create-course')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.metadata.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{course.metadata?.title || 'Untitled Course'}</CardTitle>
                            <Badge variant="secondary" className="mt-1">{course.lectures?.length || 0} lectures</Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                recordLastSession('university', {
                                  courseId: course.metadata.id,
                                  view: 'course'
                                });
                                navigate(`/university/course/${course.metadata.id}`);
                              }}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                View Course
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Course
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Course</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{course.metadata?.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCourse(course.metadata.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription>{course.metadata?.description || 'No description available'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{Math.round((course.lectures.filter(l => l.status === 'unlocked').length / course.lectures.length) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${(course.lectures.filter(l => l.status === 'unlocked').length / course.lectures.length) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <Button 
                            onClick={() => {
                              recordLastSession('university', {
                                courseId: course.metadata.id,
                                view: 'course'
                              });
                              navigate(`/university/course/${course.metadata.id}`);
                            }}
                            className="flex-1"
                          >
                            View Course
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Lectures Tab */}
            <TabsContent value="lectures" className="space-y-6">
              {lectures.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No lectures yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first lecture to get started</p>
                    <Button onClick={() => setCurrentView('create-lecture')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Lecture
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lectures.map((lecture) => (
                    <Card key={lecture.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{lecture.title}</CardTitle>
                            {getStatusBadge(lecture.status)}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/university/lecture/${lecture.id}`)}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                View Lecture
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Lecture
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Lecture</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{lecture.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteLecture(lecture.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <CardDescription>{lecture.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <Clock className="mr-2 h-4 w-4" />
                          {lecture.estimatedDuration || '30'} minutes
                        </div>
                        <Button 
                          onClick={() => {
                            recordLastSession('university', {
                              lectureId: lecture.id,
                              view: 'lecture'
                            });
                            navigate(`/university/lecture/${lecture.id}`);
                          }}
                          className="w-full"
                        >
                          View Lecture
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Standalone Tab */}
            <TabsContent value="standalone" className="space-y-6">
              {standaloneLectures.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Sparkles className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No standalone content yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Create independent learning content</p>
                    <Button onClick={() => setCurrentView('create-lecture')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Content
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {standaloneLectures.map((lecture) => (
                    <Card key={lecture.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{lecture.title || 'Untitled Lecture'}</CardTitle>
                            <CardDescription>Standalone learning content</CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                recordLastSession('university', {
                                  lectureId: lecture.id,
                                  view: 'standalone'
                                });
                                navigate(`/university/standalone/${lecture.id}`);
                              }}>
                                <BookOpen className="mr-2 h-4 w-4" />
                                View Content
                              </DropdownMenuItem>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Content
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Content</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{lecture.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteStandaloneLecture(lecture.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <Clock className="mr-2 h-4 w-4" />
                          30 minutes
                        </div>
                        <Button 
                          onClick={() => {
                            recordLastSession('university', {
                              lectureId: lecture.id,
                              view: 'standalone'
                            });
                            navigate(`/university/standalone/${lecture.id}`);
                          }}
                          className="w-full"
                        >
                          View Content
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};
