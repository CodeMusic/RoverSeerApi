import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, Edit, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { universityApi } from '@/lib/universityApi';
import type { Course, CourseCreationRequest } from '@/types/university';
import { Textarea } from '@/components/ui/textarea';

interface CourseCreationProps 
{
  initialTopic?: string;
  onComplete?: () => void;
}

interface GeneratedCourseData 
{
  title: string;
  description: string;
  instructor: string;
  syllabus: Array<{
    title: string;
    summary: string;
    duration: string;
  }>;
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

const CourseCreation = ({ initialTopic, onComplete }: CourseCreationProps) => 
{
  const [topic, setTopic] = useState(initialTopic || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<GeneratedCourseData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<GeneratedCourseData | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleGenerateCourse = async () => 
  {
    if (!topic.trim()) return;

    setIsGenerating(true);
    
    try 
    {
      // Call n8n to generate course metadata and syllabus
      const courseData = await universityApi.generateCourseFromTopic(topic);
      setGeneratedData(courseData);
      setEditedData(courseData);
    } 
    catch (error) 
    {
      console.error('Error generating course:', error);
      alert('Failed to generate course. Please try again.');
    } 
    finally 
    {
      setIsGenerating(false);
    }
  };

  const handleEdit = () => 
  {
    setIsEditing(true);
    setEditedData(generatedData);
  };

  const handleSaveEdit = () => 
  {
    if (editedData) 
    {
      setGeneratedData(editedData);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => 
  {
    setIsEditing(false);
    setEditedData(generatedData);
  };

  const handleCreateCourse = async () => 
  {
    if (!generatedData) return;

    setIsCreating(true);
    
    try 
    {
      const request: CourseCreationRequest = {
        title: generatedData.title,
        description: generatedData.description,
        instructor: generatedData.instructor,
        passThreshold: 70
      };

      const course = await universityApi.createCourse(request);
      
      // Call completion callback to return to university dashboard
      if (onComplete) {
        onComplete();
      } else {
        // Fallback: Navigate to the course syllabus view
        navigate(`/university/course/${course.metadata.id}`, {
          state: { 
            course,
            fromCreation: true,
            generatedSyllabus: generatedData.syllabus
          }
        });
      }
    } 
    catch (error) 
    {
      console.error('Error creating course:', error);
      alert('Failed to create course. Please try again.');
    } 
    finally 
    {
      setIsCreating(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => 
  {
    switch (difficulty) 
    {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 border-b-2 border-purple-200 dark:border-purple-800 pb-2">
            🎓 Create New Course
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Enter a topic and let AI generate your course structure
          </p>
        </div>

        {/* Topic Input */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Topic
            </CardTitle>
            <CardDescription>
              Enter the main topic you want to learn about
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">What would you like to learn?</Label>
              <div className="flex gap-2">
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Quantum Physics, Machine Learning, Ancient History..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateCourse()}
                />
                <Button
                  onClick={handleGenerateCourse}
                  disabled={!topic.trim() || isGenerating}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generated Course Preview */}
        {generatedData && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generated Course
                </CardTitle>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEdit}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Course Overview */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          value={editedData?.title || ''}
                          onChange={(e) => setEditedData(prev => prev ? {...prev, title: e.target.value} : null)}
                          className="text-lg font-semibold"
                        />
                        <Input
                          value={editedData?.instructor || ''}
                          onChange={(e) => setEditedData(prev => prev ? {...prev, instructor: e.target.value} : null)}
                          placeholder="Instructor name"
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="font-semibold text-lg">{generatedData.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          by {generatedData.instructor}
                        </p>
                      </>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <Textarea
                    value={editedData?.description || ''}
                    onChange={(e) => setEditedData(prev => prev ? {...prev, description: e.target.value} : null)}
                    placeholder="Course description..."
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {generatedData.description}
                  </p>
                )}
                
                <div className="flex gap-2 flex-wrap">
                  <Badge className={getDifficultyColor(generatedData.difficulty)}>
                    {generatedData.difficulty}
                  </Badge>
                  <Badge variant="secondary">
                    {generatedData.estimatedDuration}
                  </Badge>
                  {generatedData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Syllabus */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg border-b border-gray-200 dark:border-gray-700 pb-2">
                  Course Syllabus
                </h4>
                <div className="space-y-3">
                  {generatedData.syllabus.map((lecture, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-medium text-purple-600 dark:text-purple-300">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium">{lecture.title}</h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {lecture.summary}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {lecture.duration}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {generatedData && (
          <div className="flex gap-4 justify-end mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/university')}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCourse}
              disabled={isCreating}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Course...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCreation; 