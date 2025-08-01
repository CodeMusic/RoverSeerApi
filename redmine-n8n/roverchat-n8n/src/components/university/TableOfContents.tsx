import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, Lock } from 'lucide-react';
import type { Lecture } from '@/types/university';

interface TableOfContentsProps 
{
  lecture: Lecture;
  onStepChange: (stepIndex: number) => void;
}

const TableOfContents = ({ lecture, onStepChange }: TableOfContentsProps) => 
{
  const getStepIcon = (stepIndex: number) => 
  {
    const step = lecture.steps[stepIndex];
    const isCurrentStep = stepIndex === lecture.currentStep;
    const isCompleted = step?.completed;
    const isAccessible = stepIndex <= lecture.currentStep;

    if (isCompleted) 
    {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } 
    else if (isCurrentStep) 
    {
      return <Clock className="h-4 w-4 text-blue-600" />;
    } 
    else if (isAccessible) 
    {
      return <Circle className="h-4 w-4 text-gray-400" />;
    } 
    else 
    {
      return <Lock className="h-4 w-4 text-gray-300" />;
    }
  };

  const getStepStatus = (stepIndex: number) => 
  {
    const step = lecture.steps[stepIndex];
    const isCurrentStep = stepIndex === lecture.currentStep;
    const isCompleted = step?.completed;
    const isAccessible = stepIndex <= lecture.currentStep;

    if (isCompleted) 
    {
      return { variant: 'success' as const, text: 'Complete' };
    } 
    else if (isCurrentStep) 
    {
      return { variant: 'default' as const, text: 'Current' };
    } 
    else if (isAccessible) 
    {
      return { variant: 'outline' as const, text: 'Available' };
    } 
    else 
    {
      return { variant: 'secondary' as const, text: 'Locked' };
    }
  };

  const canAccessStep = (stepIndex: number) => 
  {
    return stepIndex <= lecture.currentStep;
  };

  return (
    <Card className="h-[calc(100vh-200px)]">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          📋 Table of Contents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto">
          {lecture.steps.map((step, index) => {
            const isCurrentStep = index === lecture.currentStep;
            const canAccess = canAccessStep(index);
            const status = getStepStatus(index);

            return (
              <div key={index} className="px-6 py-3">
                <Button
                  variant={isCurrentStep ? "default" : "ghost"}
                  className={`w-full justify-start text-left h-auto p-3 ${
                    !canAccess ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => canAccess && onStepChange(index)}
                  disabled={!canAccess}
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex-shrink-0 mt-1">
                      {getStepIcon(index)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Step {index + 1}
                        </span>
                        <Badge variant={status.variant} className="text-xs">
                          {status.text}
                        </Badge>
                      </div>
                      <div className="font-medium text-sm leading-tight">
                        {step.title}
                      </div>
                      {step.quiz.length > 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Quiz: {step.quiz.length} question{step.quiz.length !== 1 ? 's' : ''}
                          {step.quizPassed && (
                            <span className="text-green-600 ml-1">✓ Passed</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800/50">
          <div className="text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600 dark:text-gray-400">Progress</span>
              <span className="font-medium">
                {lecture.steps.filter(s => s.completed).length} of {lecture.steps.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                style={{ 
                  width: `${lecture.steps.length > 0 ? (lecture.steps.filter(s => s.completed).length / lecture.steps.length) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TableOfContents;