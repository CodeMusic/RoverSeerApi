import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, CheckCircle, Clock, Menu } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { universityApi } from '@/lib/universityApi';
import { NavigationBar } from '@/components/common/NavigationBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { LectureStep, Lecture } from '@/types/university';

type PlannerState = 'input' | 'planning' | 'review' | 'generating' | 'complete';

const UniversityNew = () => 
{
  const [state, setState] = useState<PlannerState>('input');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [generatedPlan, setGeneratedPlan] = useState<LectureStep[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();

  // Handle initial topic from navigation state or URL parameters
  useEffect(() => {
    const initialTopic = location.state?.initialTopic || searchParams.get('topic');
    if (initialTopic && !topic) {
      console.log('UniversityNew received initial topic:', initialTopic);
      setTopic(initialTopic);
      
      // If from landing, auto-start the planning process
      if (location.state?.fromLanding) {
        console.log('Auto-starting lecture planning for topic:', initialTopic);
        // Small delay to let the topic state update
        setTimeout(() => {
          handleGeneratePlan();
        }, 100);
      }
    }
  }, [location.state, searchParams, topic]);

  const handleTabChange = (tab: string) => {
    // Handle navigation to different sections
    switch (tab) {
      case "chat":
        navigate("/chat");
        break;
      case "musai-search":
        navigate("/chat", { state: { switchToTab: "musai-search" } });
        break;
      case "code-musai":
        navigate("/chat", { state: { switchToTab: "code-musai" } });
        break;
      case "musai-university":
        navigate("/university");
        break;
      default:
        // Handle other tabs or coming soon features
        break;
    }
  };

  const handleGeneratePlan = async () => 
  {
    if (!topic.trim()) return;

    try 
    {
      setIsLoading(true);
      setState('planning');
      
      const plan = await universityApi.createLecturePlan(topic);
      setGeneratedPlan(plan.steps);
      setState('review');
    } 
    catch (error) 
    {
      console.error('Failed to generate plan:', error);
      setState('input');
    } 
    finally 
    {
      setIsLoading(false);
    }
  };

  const handleApprovePlan = async () => 
  {
    try 
    {
      setIsLoading(true);
      setState('generating');
      
      const lectureContent = await universityApi.generateLectureContent(generatedPlan);
      
      // Create a new lecture object
      const newLecture: Lecture = {
        id: `lecture-${Date.now()}`,
        title: lectureContent.title,
        topic: topic,
        status: 'in_progress',
        steps: generatedPlan.map((step, index) => ({
          title: step.title,
          content: index === 0 ? lectureContent.content : '', // Only first step has content initially
          quiz: index === 0 ? lectureContent.quiz : [],
          chat: [],
          completed: false,
          quizPassed: false
        })),
        currentStep: 0,
        passThreshold: 0.7,
        overallScore: 0,
        exported: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await universityApi.saveLecture(newLecture);
      setState('complete');
      
      // Navigate to the lecture after a brief delay
      setTimeout(() => {
        navigate(`/university/lecture/${newLecture.id}`);
      }, 2000);
      
    } 
    catch (error) 
    {
      console.error('Failed to generate lecture:', error);
      setState('review');
    } 
    finally 
    {
      setIsLoading(false);
    }
  };

  const renderInputState = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Create New Lecture</CardTitle>
        <CardDescription>
          Tell us what you'd like to learn about, and our AI will create a personalized lecture for you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topic">Topic or Question</Label>
          <Input
            id="topic"
            placeholder="e.g., Machine Learning Fundamentals, How does React work?, Python Data Structures"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="text-lg"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Additional Context (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Any specific areas you'd like to focus on, your current knowledge level, or learning goals..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/university')}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button 
            onClick={handleGeneratePlan}
            disabled={!topic.trim() || isLoading}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Learning Plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPlanningState = () => (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="py-12 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-6"></div>
        <h3 className="text-xl font-semibold mb-2">Creating Your Learning Plan</h3>
        <p className="text-gray-600 dark:text-gray-300">
          Our AI is analyzing your topic and designing a personalized curriculum...
        </p>
      </CardContent>
    </Card>
  );

  const renderReviewState = () => (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Review Your Learning Plan</CardTitle>
        <CardDescription>
          Here's the curriculum our AI has designed for "{topic}". You can approve it to generate the full lecture content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {generatedPlan.map((step, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-start gap-4">
                <Badge variant="secondary" className="min-w-fit">
                  Step {index + 1}
                </Badge>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">{step.title}</h4>
                  <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setState('input')}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Modify Topic
          </Button>
          <Button 
            onClick={handleApprovePlan}
            disabled={isLoading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve & Generate Lecture
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderGeneratingState = () => (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="py-12 text-center">
        <div className="animate-pulse">
          <Sparkles className="h-16 w-16 text-purple-600 mx-auto mb-6" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Generating Lecture Content</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Creating personalized content, quizzes, and interactive elements...
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          This may take a moment
        </div>
      </CardContent>
    </Card>
  );

  const renderCompleteState = () => (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="py-12 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
        <h3 className="text-xl font-semibold mb-2">Lecture Created Successfully!</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Your personalized lecture is ready. Redirecting you to start learning...
        </p>
        <div className="animate-pulse text-sm text-gray-500">
          Starting your learning journey...
        </div>
      </CardContent>
    </Card>
  );

  const renderCurrentState = () => 
  {
    switch (state) 
    {
      case 'input': return renderInputState();
      case 'planning': return renderPlanningState();
      case 'review': return renderReviewState();
      case 'generating': return renderGeneratingState();
      case 'complete': return renderCompleteState();
      default: return renderInputState();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      {/* Navigation Sidebar */}
      <NavigationBar
        currentTab="musai-university"
        onTabChange={handleTabChange}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Mobile sidebar toggle */}
      {isMobile && (
        <Button
          variant="ghost"
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      )}

      <div className={cn(
        "container mx-auto px-4 py-8 transition-all duration-300 max-w-4xl",
        isMobile ? "ml-0" : isSidebarExpanded ? "ml-48" : "ml-16"
      )}>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎓 Musai University
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            AI-powered personalized learning
          </p>
        </div>

        {renderCurrentState()}
      </div>
    </div>
  );
};

export default UniversityNew;