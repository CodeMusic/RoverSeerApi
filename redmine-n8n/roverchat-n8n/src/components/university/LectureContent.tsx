import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import MarkdownRenderer from '@/components/chat/MarkdownRenderer';
import type { Lecture } from '@/types/university';

interface LectureContentProps 
{
  lecture: Lecture;
  onLectureUpdate: (lecture: Lecture) => void;
}

const LectureContent = ({ lecture, onLectureUpdate }: LectureContentProps) => 
{
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const currentStep = lecture.steps[lecture.currentStep];

  useEffect(() => 
  {
    // If current step has no content, generate it
    if (currentStep && !currentStep.content && lecture.status !== 'planning') 
    {
      generateStepContent();
    }
  }, [lecture.currentStep]);

  const generateStepContent = async () => 
  {
    if (!currentStep) return;

    try 
    {
      setIsGeneratingContent(true);
      
      // In a real implementation, this would call a specific endpoint for step content
      // For now, we'll simulate content generation
      const mockContent = `# ${currentStep.title}

## Introduction

Welcome to this step of your learning journey! This content has been personalized for your learning needs.

## Key Concepts

This section would contain the main concepts and information for this step of the lecture.

### Important Points

- Core concept 1 with detailed explanation
- Core concept 2 with practical examples  
- Core concept 3 with real-world applications

## Examples

Here we would have practical examples and demonstrations.

\`\`\`javascript
// Example code would appear here
function example() {
  console.log("This is an example");
}
\`\`\`

## Summary

This step covers the essential concepts needed to progress in your understanding of ${lecture.topic}.

---

*Ready to test your knowledge? Complete the quiz to unlock the next step!*`;

      // Update the step with generated content
      const updatedSteps = [...lecture.steps];
      updatedSteps[lecture.currentStep] = {
        ...currentStep,
        content: mockContent
      };

      const updatedLecture = {
        ...lecture,
        steps: updatedSteps,
        updatedAt: new Date().toISOString()
      };

      onLectureUpdate(updatedLecture);
    } 
    catch (error) 
    {
      console.error('Failed to generate step content:', error);
    } 
    finally 
    {
      setIsGeneratingContent(false);
    }
  };

  const markStepAsCompleted = () => 
  {
    if (!currentStep) return;

    const updatedSteps = [...lecture.steps];
    updatedSteps[lecture.currentStep] = {
      ...currentStep,
      completed: true
    };

    const updatedLecture = {
      ...lecture,
      steps: updatedSteps,
      updatedAt: new Date().toISOString()
    };

    onLectureUpdate(updatedLecture);
  };

  const navigateToStep = (direction: 'next' | 'previous') => 
  {
    const newStepIndex = direction === 'next' 
      ? Math.min(lecture.currentStep + 1, lecture.steps.length - 1)
      : Math.max(lecture.currentStep - 1, 0);

    if (newStepIndex !== lecture.currentStep) 
    {
      const updatedLecture = {
        ...lecture,
        currentStep: newStepIndex,
        updatedAt: new Date().toISOString()
      };

      onLectureUpdate(updatedLecture);
    }
  };

  const canNavigateNext = () => 
  {
    return lecture.currentStep < lecture.steps.length - 1 && 
           (currentStep?.completed || currentStep?.quizPassed);
  };

  const canNavigatePrevious = () => 
  {
    return lecture.currentStep > 0;
  };

  if (!currentStep) 
  {
    return (
      <div className="h-full flex items-center justify-center">
        <Alert>
          <AlertDescription>
            No content available for this step.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isGeneratingContent) 
  {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
            <h3 className="text-lg font-semibold mb-2">Generating Content</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Creating personalized content for this step...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pr-2">
        {currentStep.content ? (
          <div className="prose dark:prose-invert max-w-none">
            <MarkdownRenderer content={currentStep.content} />
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              No content available for this step yet.
            </p>
            <Button onClick={generateStepContent} className="bg-purple-600 hover:bg-purple-700">
              Generate Content
            </Button>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="mt-6 pt-4 border-t bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigateToStep('previous')}
            disabled={!canNavigatePrevious()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {!currentStep.completed && currentStep.content && (
              <Button
                onClick={markStepAsCompleted}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark as Complete
              </Button>
            )}

            {currentStep.completed && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>

          <Button
            onClick={() => navigateToStep('next')}
            disabled={!canNavigateNext()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Step {lecture.currentStep + 1} of {lecture.steps.length}
          </p>
          {currentStep.quiz.length > 0 && !currentStep.quizPassed && (
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              Complete the quiz to unlock the next step
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LectureContent;