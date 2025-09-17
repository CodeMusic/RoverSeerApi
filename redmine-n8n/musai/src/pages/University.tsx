import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, Clock, CheckCircle, Download, GraduationCap, Sparkles } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import ROUTES, { RouteUtils } from '@/config/routes';
import { universityApi } from '@/lib/universityApi';
import { BaseLayout } from '@/components/common/BaseLayout';
import { cn } from '@/lib/utils';
import { APP_TERMS } from '@/config/constants';
import type { Lecture, Course, StandaloneLecture } from '@/types/university';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';
import { MusaiCopilotSummon } from '@/components/common/MusaiCopilotSummon';

const University = () => {
  const [lectures, setLectures] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [standaloneLectures, setStandaloneLectures] = useState<StandaloneLecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  // Handle initial query from landing page navigation or URL parameters
  useEffect(() => {
    const initialQuery = location.state?.initialQuery || searchParams.get('topic');
    if (initialQuery) {
      console.log('University page received initial query:', initialQuery);
      // Auto-navigate to create new course with the query as topic
      // Route into main app framework, University tab, preserving topic
      navigate(`${ROUTES.MAIN_APP}?mode=university&q=${encodeURIComponent(initialQuery)}`, { 
        state: { 
          initialTopic: initialQuery,
          fromLanding: true, 
          switchToTab: 'university'
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

  const getStatusBadge = (status: Lecture['status']) => {
    const variants = {
      planning: { variant: 'secondary' as const, text: 'Planning' },
      in_progress: { variant: 'default' as const, text: 'In Progress' },
      complete: { variant: 'success' as const, text: 'Complete' }
    };
    
    const config = variants[status] || variants.planning;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProgressPercentage = (lecture: Lecture) => {
    if (lecture.steps.length === 0) return 0;
    const completedSteps = lecture.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / lecture.steps.length) * 100);
  };



  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading your lectures...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative p-6 pb-32">
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
                onClick={() => navigate(ROUTES.MAIN_APP, { state: { switchToTab: 'university', initialQuery: 'course:new' } })}
                className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                size="lg"
              >
                <GraduationCap className="mr-2 h-5 w-5" />
                Create Course
              </Button>
              <Button 
                onClick={() => navigate('/university/lecture/new')}
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
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Courses
              </CardTitle>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.length}
              </div>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Lectures
              </CardTitle>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {lectures.length + standaloneLectures.length}
              </div>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                In Progress
              </CardTitle>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.filter(c => c.overallProgress > 0 && c.overallProgress < 100).length}
              </div>
            </CardHeader>
          </Card>
          
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completed
              </CardTitle>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {courses.filter(c => c.overallProgress === 100).length}
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Show PreMusaiPage if everything is empty */}
        {!isLoading && courses.length === 0 && lectures.length === 0 && standaloneLectures.length === 0 ? (
          <div className="mt-8">
            <PreMusaiPage
              type="university"
              onSubmit={(input) => {
                // Navigate to course creation with the topic
                navigate(`/university/course/new?topic=${encodeURIComponent(input)}`);
              }}
              isLoading={false}
            />
          </div>
        ) : (
          <>
            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
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
              <Card className="text-center py-8 sm:py-12">
                <CardContent className="px-4 sm:px-6">
                  <GraduationCap className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No courses yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                    Start your learning journey by creating your first course
                  </p>
                  <Button 
                    onClick={() => navigate('/university/course/new')}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                  >
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {courses.map((course) => (
                  <Card key={course.metadata.id} className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                        onClick={() => navigate(`/university/course/${course.metadata.id}`)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">
                            {course.metadata.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-1 text-sm">
                            by {course.metadata.instructor}
                          </CardDescription>
                        </div>
                        <Badge variant="outline">
                          {course.lectures.length} lectures
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Progress */}
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">Progress</span>
                            <span className="font-medium">{course.overallProgress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${course.overallProgress}%` }}
                            />
                          </div>
                        </div>
                        {/* Meta Information */}
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="mr-1 h-4 w-4" />
                          Created {formatDate(course.metadata.createdAt)}
                        </div>
                        {/* Completion Status */}
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {course.completedLectures} of {course.lectures.length} completed
                          </span>
                          {course.overallProgress === 100 && (
                            <span className="ml-2 text-green-600 dark:text-green-400">
                              <CheckCircle className="inline h-4 w-4 mr-1" />
                              Completed
                            </span>
                          )}
                        </div>
                        {/* Action Button */}
                        <Button 
                          className="w-full text-sm"
                          variant={course.overallProgress === 100 ? 'outline' : 'default'}
                        >
                          {course.overallProgress === 100 ? 'Review' : 'Continue'}
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
              <Card className="text-center py-8 sm:py-12">
                <CardContent className="px-4 sm:px-6">
                  <BookOpen className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No lectures yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                    Start your learning journey by creating your first lecture
                  </p>
                  <Button 
                    onClick={() => navigate('/university/lecture/new')}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create Your First Lecture
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {lectures.map((lecture) => (
                  <Card key={lecture.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">
                            {lecture.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-1 text-sm">
                            {lecture.topic}
                          </CardDescription>
                        </div>
                        {getStatusBadge(lecture.status)}
                      </div>
                    </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="font-medium">{getProgressPercentage(lecture)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${getProgressPercentage(lecture)}%` }}
                          />
                        </div>
                      </div>

                      {/* Meta Information */}
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="mr-1 h-4 w-4" />
                        Created {formatDate(lecture.createdAt)}
                      </div>

                      {/* Steps */}
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {lecture.steps.length} step{lecture.steps.length !== 1 ? 's' : ''}
                        </span>
                        {lecture.status === 'complete' && (
                          <span className="ml-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="inline h-4 w-4 mr-1" />
                            Completed
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button 
                          onClick={() => navigate(`/university/lecture/${lecture.id}`)}
                          className="flex-1 text-sm"
                          variant={lecture.status === 'complete' ? 'outline' : 'default'}
                        >
                          {lecture.status === 'complete' ? 'Review' : 'Continue'}
                        </Button>
                        
                        {lecture.status === 'complete' && !lecture.exported && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="shrink-0"
                            onClick={() => {
                              // TODO: Implement export functionality
                              console.log('Export lecture:', lecture.id);
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>

          {/* Standalone Lectures Tab */}
          <TabsContent value="standalone" className="space-y-6">
            {standaloneLectures.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent className="px-4 sm:px-6">
                  <Sparkles className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No standalone lectures yet
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6">
                    Create individual lectures not tied to a course
                  </p>
                  <Button 
                    onClick={() => navigate('/university/standalone/new')}
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full sm:w-auto"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Standalone Lecture
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {standaloneLectures.map((lecture) => (
                  <Card key={lecture.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg font-semibold mb-2 line-clamp-2">
                            {lecture.title}
                          </CardTitle>
                        </div>
                        <Badge variant="outline">Standalone</Badge>
                      </div>
                    </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      {/* Meta Information */}
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="mr-1 h-4 w-4" />
                        Created {formatDate(lecture.createdAt)}
                      </div>

                      {/* Action Button */}
                      <Button 
                        onClick={() => navigate(`/university/standalone/${lecture.id}`)}
                        className="w-full text-sm"
                      >
                        View Lecture
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-10 flex justify-center">
          <MusaiCopilotSummon className="w-full max-w-2xl" />
        </div>
          </>
        )}
      </div>
    );
  };

  return (
    <BaseLayout
      currentTab={APP_TERMS.TAB_UNIVERSITY}
      sessions={[]} // University doesn't use traditional sessions
      currentSessionId=""
      onNewSession={() => {}} // No-op for university
      onSessionSelect={() => {}} // No-op for university  
      onDeleteSession={() => {}} // No-op for university
      onRenameSession={() => {}} // No-op for university
      onToggleFavorite={() => {}} // No-op for university
      renderMainContent={renderMainContent}
      onTabChange={(tab) => {
        // Allow switching away via the left toolbar by routing through main app with mode
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
      onToggleNavigation={() => setIsNavigationExpanded(!isNavigationExpanded)}
    />
  );
};

export default University;
