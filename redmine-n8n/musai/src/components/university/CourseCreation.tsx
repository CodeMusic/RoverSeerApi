import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, Settings, Sparkles, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { universityApi } from '@/lib/universityApi';
import type { CourseCreationRequest, ProcessorFile } from '@/types/university';

interface CourseCreationProps 
{
  initialTopic?: string;
}

const CourseCreation = ({ initialTopic }: CourseCreationProps) => 
{
  const [formData, setFormData] = useState<CourseCreationRequest>({
    title: initialTopic || '',
    description: '',
    instructor: '',
    imagePath: '',
    passThreshold: 50
  });

  const [processorFile, setProcessorFile] = useState<ProcessorFile>({
    teachingStyle: 'interactive',
    persona: 'Alan Watts meets Elon Musk',
    tone: 'conversational'
  });

  const [useProcessorFile, setUseProcessorFile] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: keyof CourseCreationRequest, value: string | number) => 
  {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProcessorChange = (field: keyof ProcessorFile, value: string) => 
  {
    setProcessorFile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => 
  {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.instructor.trim()) 
    {
      alert('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    
    try 
    {
      const request: CourseCreationRequest = {
        ...formData,
        processorFile: useProcessorFile ? processorFile : undefined
      };

      const course = await universityApi.createCourse(request);
      
      // Navigate to the course syllabus view
      navigate(`/university/course/${course.metadata.id}`, {
        state: { 
          course,
          fromCreation: true 
        }
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎓 Create New Course
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
            Design your intelligent, modular course delivery system
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Course Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Course Information
              </CardTitle>
              <CardDescription>
                Define the core details of your course
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Quantum Curiosities"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor/Processor *</Label>
                  <Input
                    id="instructor"
                    value={formData.instructor}
                    onChange={(e) => handleInputChange('instructor', e.target.value)}
                    placeholder="e.g., Dr. Quantum"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Course Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what students will learn in this course..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="imagePath">Course Image (Optional)</Label>
                  <Input
                    id="imagePath"
                    value={formData.imagePath}
                    onChange={(e) => handleInputChange('imagePath', e.target.value)}
                    placeholder="URL to course image"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="passThreshold">Quiz Pass Threshold (%)</Label>
                  <Input
                    id="passThreshold"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passThreshold}
                    onChange={(e) => handleInputChange('passThreshold', parseInt(e.target.value) || 50)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Processor File Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Processor File (Optional)
                  </CardTitle>
                  <CardDescription>
                    Customize the AI's teaching style and persona
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={useProcessorFile}
                    onCheckedChange={setUseProcessorFile}
                  />
                  <Label>Enable Custom Processor</Label>
                </div>
              </div>
            </CardHeader>
            
            {useProcessorFile && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teachingStyle">Teaching Style</Label>
                    <Select
                      value={processorFile.teachingStyle}
                      onValueChange={(value) => handleProcessorChange('teachingStyle', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teaching style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="interactive">Interactive</SelectItem>
                        <SelectItem value="socratic">Socratic</SelectItem>
                        <SelectItem value="lecture">Traditional Lecture</SelectItem>
                        <SelectItem value="workshop">Workshop Style</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tone">Tone</Label>
                    <Select
                      value={processorFile.tone}
                      onValueChange={(value) => handleProcessorChange('tone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="socratic">Socratic</SelectItem>
                        <SelectItem value="poetic">Poetic</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="persona">Persona</Label>
                  <Input
                    id="persona"
                    value={processorFile.persona}
                    onChange={(e) => handleProcessorChange('persona', e.target.value)}
                    placeholder="e.g., Alan Watts meets Elon Musk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                  <Textarea
                    id="customInstructions"
                    value={processorFile.customInstructions || ''}
                    onChange={(e) => handleProcessorChange('customInstructions', e.target.value)}
                    placeholder="Additional instructions for the AI processor..."
                    rows={3}
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Course Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Course Preview
              </CardTitle>
              <CardDescription>
                This is how your course will appear to students
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{formData.title || 'Course Title'}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by {formData.instructor || 'Instructor'}
                    </p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.description || 'Course description will appear here...'}
                </p>
                
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    Pass Threshold: {formData.passThreshold}%
                  </Badge>
                  {useProcessorFile && (
                    <Badge variant="outline">
                      Custom Processor
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/university')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
        </form>
      </div>
    </div>
  );
};

export default CourseCreation; 