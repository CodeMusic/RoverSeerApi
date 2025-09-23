import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  CheckCircle, 
  XCircle, 
  RotateCcw, 
  Plus,
  Sparkles,
  Trophy,
  AlertCircle
} from 'lucide-react';
import type { QuizAttempt, CourseLecture } from '@/types/university';
import { cn } from '@/lib/utils';

interface CourseQuizProps 
{
  lecture: CourseLecture;
  passThreshold: number;
  onQuizCompleted: (passed: boolean, attempt: QuizAttempt) => Promise<void> | void;
  onGenerateMoreQuestions: () => Promise<void> | void;
}

const CourseQuiz = ({ lecture, passThreshold, onQuizCompleted, onGenerateMoreQuestions }: CourseQuizProps) => 
{
  const [currentAnswers, setCurrentAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const autoRequestedRef = useRef(false);

  useEffect(() => 
  {
    if (lecture.quiz && lecture.quiz.length > 0)
    {
      setCurrentAnswers(new Array(lecture.quiz.length).fill(-1));
      setCurrentAttempt(null);
      setShowResults(false);
      setGenerationError(null);
      setIsGeneratingMore(false);
      autoRequestedRef.current = false;
    }
    else
    {
      setCurrentAnswers([]);
      setCurrentAttempt(null);
      setShowResults(false);
    }
  }, [lecture.quiz]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => 
  {
    const newAnswers = [...currentAnswers];
    newAnswers[questionIndex] = answerIndex;
    setCurrentAnswers(newAnswers);
  };

  const handleSubmitQuiz = async () => 
  {
    if (!lecture.quiz) return;

    if (currentAnswers.length !== lecture.quiz.length || currentAnswers.some(answer => answer === -1))
    {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);

    try
    {
      const totalQuestions = lecture.quiz.length || 1;
      const correctCount = lecture.quiz.reduce((acc, question, index) =>
      {
        return acc + (currentAnswers[index] === question.correctIndex ? 1 : 0);
      }, 0);
      const score = correctCount / totalQuestions;
      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        answers: [...currentAnswers],
        score,
        passed: score >= passThreshold,
        timestamp: new Date().toISOString()
      };
      setCurrentAttempt(attempt);
      setShowResults(true);
      await Promise.resolve(onQuizCompleted(attempt.passed, attempt));
    }
    catch (error)
    {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
    finally
    {
      setIsSubmitting(false);
    }
  };

  const handleRetakeQuiz = () => 
  {
    setCurrentAnswers(new Array(lecture.quiz?.length || 0).fill(-1));
    setCurrentAttempt(null);
    setShowResults(false);
  };

  const handleGenerateMoreQuestions = useCallback(async () => 
  {
    setGenerationError(null);
    setIsGeneratingMore(true);
    autoRequestedRef.current = true;
    try
    {
      await Promise.resolve(onGenerateMoreQuestions());
    }
    catch (error)
    {
      console.error('Error generating more questions:', error);
      const message = error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.';
      setGenerationError(message);
      autoRequestedRef.current = false;
    }
    finally
    {
      setIsGeneratingMore(false);
    }
  }, [onGenerateMoreQuestions]);

  useEffect(() =>
  {
    if (lecture.quiz && lecture.quiz.length > 0)
    {
      return;
    }
    if (!lecture.content)
    {
      return;
    }
    if (autoRequestedRef.current)
    {
      return;
    }

    autoRequestedRef.current = true;
    void handleGenerateMoreQuestions();
  }, [lecture.quiz, lecture.content, handleGenerateMoreQuestions]);

  const getScoreColor = (score: number) => 
  {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => 
  {
    if (score >= 0.8) return <Trophy className="h-5 w-5 text-green-600" />;
    if (score >= 0.6) return <CheckCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  if (!lecture.quiz || lecture.quiz.length === 0) 
  {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Quiz Not Available
          </CardTitle>
          <CardDescription>
            We'll generate an adaptive quiz from this lecture's content.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {generationError && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{generationError}</span>
            </div>
          )}
          {!generationError && !isGeneratingMore && (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Start the quiz when you're ready—Musai will craft fresh questions from the lecture material.
            </p>
          )}
          {isGeneratingMore && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500/70 border-t-transparent"></div>
              Generating quiz...
            </div>
          )}
          {!lecture.content && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lecture content is still being prepared. The quiz will be available once the lecture is ready.
            </p>
          )}
          <Button
            onClick={handleGenerateMoreQuestions}
            disabled={isGeneratingMore || !lecture.content}
            className="w-full"
          >
            {isGeneratingMore ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating Quiz...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (showResults && currentAttempt) 
  {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getScoreIcon(currentAttempt.score)}
            Quiz Results
          </CardTitle>
          <CardDescription>
            Your performance on this quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Display */}
          <div className="text-center space-y-2">
            <div className="text-3xl font-bold">
              {Math.round(currentAttempt.score * 100)}%
            </div>
            <div className={cn("text-lg font-medium", getScoreColor(currentAttempt.score))}>
              {currentAttempt.passed ? 'Passed!' : 'Failed'}
            </div>
            <Badge 
              variant={currentAttempt.passed ? 'default' : 'destructive'}
              className="text-sm"
            >
              {currentAttempt.passed ? 'Quiz Completed' : 'Retake Required'}
            </Badge>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pass threshold: {Math.round(passThreshold * 100)}%
            </p>
          </div>

          {/* Question Review */}
          <div className="space-y-3">
            <h4 className="font-semibold">Question Review:</h4>
            {lecture.quiz.map((question, questionIndex) => (
              <div key={questionIndex} className="border rounded-lg p-3 space-y-2">
                <div className="font-medium">
                  {questionIndex + 1}. {question.question}
                </div>
                <div className="space-y-1">
                  {question.choices.map((choice, choiceIndex) => (
                    <div
                      key={choiceIndex}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded",
                        choiceIndex === question.correctIndex && "bg-green-100 dark:bg-green-900",
                        choiceIndex === currentAttempt.answers[questionIndex] && 
                        choiceIndex !== question.correctIndex && "bg-red-100 dark:bg-red-900"
                      )}
                    >
                      {choiceIndex === question.correctIndex ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : choiceIndex === currentAttempt.answers[questionIndex] && 
                        choiceIndex !== question.correctIndex ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <span className="text-sm">{choice}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleRetakeQuiz}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake Quiz
            </Button>
            <Button
              onClick={handleGenerateMoreQuestions}
              disabled={isGeneratingMore}
              className="flex-1"
            >
              {isGeneratingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  More Questions
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Lecture Quiz
        </CardTitle>
        <CardDescription>
          Test your understanding of the lecture material
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{currentAnswers.filter(a => a !== -1).length} of {lecture.quiz.length}</span>
          </div>
          <Progress 
            value={(currentAnswers.filter(a => a !== -1).length / lecture.quiz.length) * 100} 
            className="h-2" 
          />
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {lecture.quiz.map((question, questionIndex) => (
            <div key={questionIndex} className="space-y-3">
              <div className="font-medium">
                {questionIndex + 1}. {question.question}
              </div>
              <RadioGroup
                value={currentAnswers[questionIndex]?.toString() || ''}
                onValueChange={(value) => handleAnswerSelect(questionIndex, parseInt(value))}
              >
                {question.choices.map((choice, choiceIndex) => (
                  <div key={choiceIndex} className="flex items-center space-x-2">
                    <RadioGroupItem value={choiceIndex.toString()} id={`q${questionIndex}c${choiceIndex}`} />
                    <Label htmlFor={`q${questionIndex}c${choiceIndex}`} className="text-sm">
                      {choice}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitQuiz}
          disabled={isSubmitting || currentAnswers.some(answer => answer === -1)}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Submit Quiz
            </>
          )}
        </Button>

        {/* Previous Attempts */}
        {lecture.quizAttempts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Previous Attempts:</h4>
            <div className="flex gap-1">
              {lecture.quizAttempts.map((attempt, attemptIndex) => (
                <div
                  key={attempt.id}
                  className={cn(
                    "w-3 h-3 rounded-full",
                    attempt.passed ? "bg-green-500" : "bg-red-500"
                  )}
                  title={`Attempt ${attemptIndex + 1}: ${Math.round(attempt.score * 100)}%`}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseQuiz; 
