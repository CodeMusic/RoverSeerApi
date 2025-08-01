import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, RotateCcw, Trophy, Brain } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import type { Lecture, QuizQuestion } from '@/types/university';

interface QuizComponentProps 
{
  lecture: Lecture;
  onLectureUpdate: (lecture: Lecture) => void;
  onQuizComplete: (passed: boolean) => void;
}

type QuizState = 'ready' | 'taking' | 'completed' | 'retrying';

const QuizComponent = ({ lecture, onLectureUpdate, onQuizComplete }: QuizComponentProps) => 
{
  const [quizState, setQuizState] = useState<QuizState>('ready');
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizResults, setQuizResults] = useState<{ score: number; correct: boolean[]; passed: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentStep = lecture.steps[lecture.currentStep];
  const hasQuiz = currentStep?.quiz && currentStep.quiz.length > 0;

  const startQuiz = () => 
  {
    setQuizState('taking');
    setSelectedAnswers({});
    setQuizResults(null);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number) => 
  {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const submitQuiz = async () => 
  {
    if (!currentStep || !hasQuiz) return;

    const answers = currentStep.quiz.map((_, index) => selectedAnswers[index] ?? -1);
    const allAnswered = answers.every(answer => answer !== -1);

    if (!allAnswered) 
    {
      alert('Please answer all questions before submitting.');
      return;
    }

    try 
    {
      setIsSubmitting(true);
      
      const results = await universityApi.submitQuiz(
        `step-${lecture.currentStep}`,
        answers
      );

      setQuizResults(results);
      setQuizState('completed');

      // Update the lecture with quiz results
      const updatedSteps = [...lecture.steps];
      updatedSteps[lecture.currentStep] = {
        ...currentStep,
        quizPassed: results.passed,
        completed: results.passed || currentStep.completed
      };

      // If quiz passed and this is not the last step, unlock next step
      if (results.passed && lecture.currentStep < lecture.steps.length - 1) 
      {
        // The next step is automatically accessible due to currentStep progression
      }

      // Update overall score
      const totalQuizzes = lecture.steps.filter(s => s.quiz.length > 0).length;
      const passedQuizzes = updatedSteps.filter(s => s.quizPassed).length;
      const overallScore = totalQuizzes > 0 ? passedQuizzes / totalQuizzes : 0;

      // Check if lecture is complete
      const allStepsCompleted = updatedSteps.every(s => s.completed || s.quiz.length === 0);
      const status = allStepsCompleted ? 'complete' : lecture.status;

      const updatedLecture = {
        ...lecture,
        steps: updatedSteps,
        overallScore,
        status,
        updatedAt: new Date().toISOString()
      };

      onLectureUpdate(updatedLecture);
      onQuizComplete(results.passed);
    } 
    catch (error) 
    {
      console.error('Failed to submit quiz:', error);
    } 
    finally 
    {
      setIsSubmitting(false);
    }
  };

  const retryQuiz = () => 
  {
    setQuizState('taking');
    setSelectedAnswers({});
    setQuizResults(null);
  };

  const getScoreColor = (score: number) => 
  {
    if (score >= lecture.passThreshold) return 'text-green-600';
    if (score >= lecture.passThreshold * 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => 
  {
    if (score >= lecture.passThreshold) 
    {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Passed</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  if (!hasQuiz) 
  {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Quiz Available</h3>
            <p className="text-gray-600 dark:text-gray-300">
              This step doesn't have a quiz. Continue to the next step when you're ready.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentStep.quizPassed) 
  {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Quiz Completed!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              You've already passed this quiz. Great job!
            </p>
            <Button variant="outline" onClick={() => setQuizState('taking')}>
              Retake Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizState === 'ready') 
  {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6 text-purple-600" />
              Quiz Ready
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Test your understanding of this step with {currentStep.quiz.length} question{currentStep.quiz.length !== 1 ? 's' : ''}.
            </p>
            <div className="mb-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Pass Threshold: {Math.round(lecture.passThreshold * 100)}%
              </p>
            </div>
            <Button onClick={startQuiz} className="bg-purple-600 hover:bg-purple-700">
              Start Quiz
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizState === 'taking') 
  {
    return (
      <div className="h-full overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Quiz: {currentStep.title}
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentStep.quiz.length} question{currentStep.quiz.length !== 1 ? 's' : ''} • Pass with {Math.round(lecture.passThreshold * 100)}%
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep.quiz.map((question, questionIndex) => (
              <Card key={questionIndex}>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <h4 className="font-medium mb-4">
                      {questionIndex + 1}. {question.question}
                    </h4>
                    <RadioGroup
                      value={selectedAnswers[questionIndex]?.toString() || ''}
                      onValueChange={(value) => handleAnswerChange(questionIndex, parseInt(value))}
                    >
                      {question.choices.map((choice, choiceIndex) => (
                        <div key={choiceIndex} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={choiceIndex.toString()} 
                            id={`q${questionIndex}-a${choiceIndex}`}
                          />
                          <Label 
                            htmlFor={`q${questionIndex}-a${choiceIndex}`}
                            className="cursor-pointer"
                          >
                            {choice}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => setQuizState('ready')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={submitQuiz}
                disabled={isSubmitting || Object.keys(selectedAnswers).length !== currentStep.quiz.length}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (quizState === 'completed' && quizResults) 
  {
    return (
      <div className="h-full overflow-y-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {quizResults.passed ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  Quiz Passed!
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  Quiz Not Passed
                </>
              )}
            </CardTitle>
            <div className="flex items-center justify-center gap-2">
              <span className={`text-2xl font-bold ${getScoreColor(quizResults.score)}`}>
                {Math.round(quizResults.score * 100)}%
              </span>
              {getScoreBadge(quizResults.score)}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {quizResults.passed ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Congratulations! You've passed this quiz and can now proceed to the next step.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  You need {Math.round(lecture.passThreshold * 100)}% to pass. Review the material and try again, or ask questions in the chat.
                </AlertDescription>
              </Alert>
            )}

            {/* Question Results */}
            <div className="space-y-4">
              <h4 className="font-medium">Question Results:</h4>
              {currentStep.quiz.map((question, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      {quizResults.correct[index] ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium mb-2">{question.question}</p>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600 dark:text-gray-300">
                            Your answer: {question.choices[selectedAnswers[index]]}
                          </p>
                          {!quizResults.correct[index] && (
                            <p className="text-green-600">
                              Correct answer: {question.choices[question.correctIndex]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              {!quizResults.passed && (
                <Button
                  onClick={retryQuiz}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Retry Quiz
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setQuizState('ready')}
                className="flex-1"
              >
                Back to Quiz
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default QuizComponent;