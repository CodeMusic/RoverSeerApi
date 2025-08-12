import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, BookOpen, MessageCircle, Brain, Lock, CheckCircle } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import type { Lecture, UniversityTab } from '@/types/university';
import LectureContent from '@/components/university/LectureContent';
import LectureChat from '@/components/university/LectureChat';
import QuizComponent from '@/components/university/QuizComponent';
import TableOfContents from '@/components/university/TableOfContents';

const LectureView = () => 
{
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [activeTab, setActiveTab] = useState<UniversityTab>('lecture');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => 
  {
    if (id) 
    {
      loadLecture(id);
    }
  }, [id]);

  const loadLecture = async (lectureId: string) => 
  {
    try 
    {
      setIsLoading(true);    



      
      const lectures = await universityApi.getLectures();
      const foundLecture = lectures.find(l => l.id === lectureId);
      
      if (foundLecture) 
      {
        setLecture(foundLecture);
      } 
      else 
      {
        navigate('/university');
      }
    } 
    catch (error) 
    {
      console.error('Failed to load lecture:', error);
      navigate('/university');
    } 
    finally 
    {
      setIsLoading(false);
    }
  };

  const updateLecture = async (updatedLecture: Lecture) => 
  {
    setLecture(updatedLecture);
    await universityApi.saveLecture(updatedLecture);
  };

  const isTabLocked = (tab: UniversityTab): boolean => 
  {
    if (!lecture) return true;
    
    const currentStep = lecture.steps[lecture.currentStep];
    if (!currentStep) return true;

    switch (tab) 
    {
      case 'lecture':
        return false; // Lecture tab is always available
      case 'chat':
        return false; // Chat is always available for help
      case 'quiz':
        // Quiz is locked until lecture content is viewed
        return !currentStep.completed;
      default:
        return false;
    }
  };

  const getTabIcon = (tab: UniversityTab) => 
  {
    const locked = isTabLocked(tab);
    
    switch (tab) 
    {
      case 'lecture':
        return <BookOpen className="h-4 w-4" />;
      case 'chat':
        return <MessageCircle className="h-4 w-4" />;
      case 'quiz':
        return locked ? <Lock className="h-4 w-4" /> : <Brain className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getCurrentStepProgress = () => 
  {
    if (!lecture || lecture.steps.length === 0) return 0;
    return Math.round(((lecture.currentStep + 1) / lecture.steps.length) * 100);
  };

  const getOverallProgress = () => 
  {
    if (!lecture || lecture.steps.length === 0) return 0;
    const completedSteps = lecture.steps.filter(step => step.completed).length;
    return Math.round((completedSteps / lecture.steps.length) * 100);
  };

  if (isLoading) 
  {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">Loading lecture...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lecture) 
  {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Lecture not found
            </h2>
            <Button onClick={() => navigate('/university')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to University
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/university')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {lecture.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  {lecture.topic}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge variant={lecture.status === 'complete' ? 'success' : 'default'}>
                {lecture.status === 'complete' ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Complete
                  </>
                ) : (
                  `Step ${lecture.currentStep + 1} of ${lecture.steps.length}`
                )}
              </Badge>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Current Step</span>
                  <span className="font-medium">{getCurrentStepProgress()}%</span>
                </div>
                <Progress value={getCurrentStepProgress()} className="h-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
                  <span className="font-medium">{getOverallProgress()}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table of Contents - Left Sidebar */}
          <div className="lg:col-span-1">
            <TableOfContents 
              lecture={lecture}
              onStepChange={(stepIndex) => {
                const updatedLecture = { ...lecture, currentStep: stepIndex };
                updateLecture(updatedLecture);
              }}
            />
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100dvh-200px)]">
              <CardHeader>
                <CardTitle className="text-lg">
                  Step {lecture.currentStep + 1}: {lecture.steps[lecture.currentStep]?.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs 
                  value={activeTab} 
                  onValueChange={(value) => setActiveTab(value as UniversityTab)}
                  className="h-full flex flex-col"
                >
                  <TabsList className="mx-6 mt-2">
                    <TabsTrigger 
                      value="lecture" 
                      disabled={isTabLocked('lecture')}
                      className="flex items-center gap-2"
                    >
                      {getTabIcon('lecture')}
                      📖 Lecture
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chat" 
                      disabled={isTabLocked('chat')}
                      className="flex items-center gap-2"
                    >
                      {getTabIcon('chat')}
                      💬 Chat
                    </TabsTrigger>
                    <TabsTrigger 
                      value="quiz" 
                      disabled={isTabLocked('quiz')}
                      className="flex items-center gap-2"
                    >
                      {getTabIcon('quiz')}
                      🧪 Quiz
                    </TabsTrigger>
                  </TabsList>

                  <div className="flex-1 px-6 pb-6">
                    <TabsContent value="lecture" className="mt-4 h-full">
                      <LectureContent 
                        lecture={lecture}
                        onLectureUpdate={updateLecture}
                      />
                    </TabsContent>

                    <TabsContent value="chat" className="mt-4 h-full">
                      <LectureChat 
                        lecture={lecture}
                        onLectureUpdate={updateLecture}
                      />
                    </TabsContent>

                    <TabsContent value="quiz" className="mt-4 h-full">
                      <QuizComponent 
                        lecture={lecture}
                        onLectureUpdate={updateLecture}
                        onQuizComplete={(passed) => {
                          if (passed) {
                            setActiveTab('lecture'); // Return to lecture tab after passing quiz
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

export default LectureView;