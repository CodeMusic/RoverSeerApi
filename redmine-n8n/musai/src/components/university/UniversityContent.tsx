import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, BookOpen, Clock, CheckCircle, Download, GraduationCap, Sparkles } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { universityApi } from '@/lib/universityApi';
import { cn } from '@/lib/utils';
import type { Lecture, Course, StandaloneLecture } from '@/types/university';
import { PreMusaiPage } from '@/components/common/PreMusaiPage';

export const UniversityContent = () => {
  const [lectures, setLectures] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [standaloneLectures, setStandaloneLectures] = useState<StandaloneLecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');
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

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 border-b-2 border-purple-200 dark:border-purple-800 pb-2">
              🎓 Musai University
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              AI-powered personalized learning experiences
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/university/course/new')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              size="lg"
            >
              <GraduationCap className="mr-2 h-5 w-5" />
              Create Course
            </Button>
            <Button 
              onClick={() => navigate('/university/lecture/new')}
              variant="outline"
              size="lg"
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
              // Navigate to course creation with the topic
              navigate('/university/course/new', { 
                state: { 
                  initialTopic: input,
                  fromPreMusai: true 
                }
              });
            }}
            isLoading={false}
            quickActions={[
              {
                icon: GraduationCap,
                title: "Create Course",
                description: "Build a structured learning path",
                action: () => navigate('/university/course/new')
              },
              {
                icon: BookOpen,
                title: "Create Lecture",
                description: "Design individual lessons",
                action: () => navigate('/university/lecture/new')
              },
              {
                icon: Sparkles,
                title: "Standalone Lecture",
                description: "Independent learning content",
                action: () => navigate('/university/standalone/new')
              }
            ]}
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
                <Card className="text-center py-12">
                  <CardContent>
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first course</p>
                    <Button onClick={() => navigate('/university/course/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Course
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Card key={course.metadata.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <Badge variant="secondary">{course.lectures.length} lectures</Badge>
                        </div>
                        <CardDescription>{course.description}</CardDescription>
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
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => navigate(`/university/course/${course.metadata.id}`)}
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
                    <Button onClick={() => navigate('/university/lecture/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Lecture
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lectures.map((lecture) => (
                    <Card key={lecture.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{lecture.title}</CardTitle>
                          {getStatusBadge(lecture.status)}
                        </div>
                        <CardDescription>{lecture.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <Clock className="mr-2 h-4 w-4" />
                          {lecture.estimatedDuration || '30'} minutes
                        </div>
                        <Button 
                          onClick={() => navigate(`/university/lecture/${lecture.id}`)}
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
                    <Button onClick={() => navigate('/university/standalone/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Content
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {standaloneLectures.map((lecture) => (
                    <Card key={lecture.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader>
                        <CardTitle className="text-lg">{lecture.title}</CardTitle>
                        <CardDescription>{lecture.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                          <Clock className="mr-2 h-4 w-4" />
                          {lecture.estimatedDuration || '30'} minutes
                        </div>
                        <Button 
                          onClick={() => navigate(`/university/standalone/${lecture.id}`)}
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