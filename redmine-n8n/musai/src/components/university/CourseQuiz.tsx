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
  onGenerationStateChange?: (isGenerating: boolean) => void;
  onQuizStateChange?: (isActive: boolean) => void;
  onCancelRequested?: () => void;
}

const CourseQuiz = ({ lecture, passThreshold, onQuizCompleted, onGenerateMoreQuestions, onGenerationStateChange, onQuizStateChange, onCancelRequested }: CourseQuizProps) => 
{
  const [currentAnswers, setCurrentAnswers] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isGeneratingMore, setIsGeneratingMore] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const autoRequestedRef = useRef(false);
  const [timeLeftSec, setTimeLeftSec] = useState<number>(600);
  const timerRef = useRef<number | null>(null);
  const warned3Ref = useRef<boolean>(false);
  const warned1Ref = useRef<boolean>(false);

  const effectivePassThreshold = Math.max(0.8, passThreshold);

  const deriveLetterGrade = (correct: number, total: number): string =>
  {
    if (total === 0) return '—';
    if (correct === total) return 'A+';
    if (correct === total - 1) return 'A';
    const ratio = correct / total;
    if (ratio >= 0.9) return 'A-';
    if (ratio >= 0.8) return 'B';
    if (ratio >= 0.7) return 'C';
    if (ratio >= 0.6) return 'D';
    return 'F';
  };

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
      setTimeLeftSec(600);
      if (timerRef.current)
      {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      timerRef.current = window.setInterval(() =>
      {
        setTimeLeftSec(prev => Math.max(0, prev - 1));
      }, 1000);
      onQuizStateChange?.(true);
      warned3Ref.current = false;
      warned1Ref.current = false;
    }
    else
    {
      setCurrentAnswers([]);
      setCurrentAttempt(null);
      setShowResults(false);
      if (timerRef.current)
      {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onQuizStateChange?.(false);
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
      const letterGrade = deriveLetterGrade(correctCount, totalQuestions);
      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        answers: [...currentAnswers],
        score,
        passed: score >= effectivePassThreshold,
        timestamp: new Date().toISOString(),
        letterGrade,
        correctCount,
        totalQuestions
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
    setTimeLeftSec(600);
    if (timerRef.current)
    {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    timerRef.current = window.setInterval(() =>
    {
      setTimeLeftSec(prev => Math.max(0, prev - 1));
    }, 1000);
    onQuizStateChange?.(true);
  };

  const handleGenerateMoreQuestions = useCallback(async () => 
  {
    setGenerationError(null);
    setIsGeneratingMore(true);
    autoRequestedRef.current = true;
    onGenerationStateChange?.(true);
    try
    {
      await Promise.resolve(onGenerateMoreQuestions());
      setCurrentAttempt(null);
      setShowResults(false);
      setCurrentAnswers([]);
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
      onGenerationStateChange?.(false);
    }
  }, [onGenerateMoreQuestions, onGenerationStateChange]);

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

  useEffect(() =>
  {
    return () =>
    {
      onGenerationStateChange?.(false);
      if (timerRef.current)
      {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onQuizStateChange?.(false);
    };
  }, [onGenerationStateChange]);

  const forceAutoSubmit = useCallback(async () =>
  {
    if (!lecture.quiz) return;
    if (isSubmitting) return;
    setIsSubmitting(true);
    try
    {
      const totalQuestions = lecture.quiz.length || 1;
      const correctCount = lecture.quiz.reduce((acc, question, index) =>
      {
        return acc + (currentAnswers[index] === question.correctIndex ? 1 : 0);
      }, 0);
      const score = correctCount / totalQuestions;
      const letterGrade = deriveLetterGrade(correctCount, totalQuestions);
      const attempt: QuizAttempt = {
        id: `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        answers: [...currentAnswers],
        score,
        passed: score >= effectivePassThreshold,
        timestamp: new Date().toISOString(),
        letterGrade,
        correctCount,
        totalQuestions
      };
      setCurrentAttempt(attempt);
      setShowResults(true);
      await Promise.resolve(onQuizCompleted(attempt.passed, attempt));
    }
    catch (error)
    {
      console.error('Error auto-submitting quiz:', error);
    }
    finally
    {
      setIsSubmitting(false);
      if (timerRef.current)
      {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      onQuizStateChange?.(false);
    }
  }, [lecture.quiz, currentAnswers, deriveLetterGrade, effectivePassThreshold, isSubmitting, onQuizCompleted, onQuizStateChange]);

  useEffect(() =>
  {
    if (!lecture.quiz || lecture.quiz.length === 0)
    {
      return;
    }
    if (showResults)
    {
      return;
    }
    if (timeLeftSec === 180 && !warned3Ref.current)
    {
      warned3Ref.current = true;
      try { console.warn('3 minutes remaining for the quiz.'); } catch {}
    }
    if (timeLeftSec === 60 && !warned1Ref.current)
    {
      warned1Ref.current = true;
      try { console.warn('1 minute remaining for the quiz.'); } catch {}
    }
    if (timeLeftSec === 0)
    {
      void forceAutoSubmit();
    }
  }, [timeLeftSec, lecture.quiz, showResults, forceAutoSubmit]);

  const formatTime = (sec: number): string =>
  {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => 
  {
    if (score >= effectivePassThreshold) return 'text-emerald-500';
    if (score >= 0.6) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getScoreIcon = (score: number, passed: boolean) => 
  {
    if (passed) return <Trophy className="h-6 w-6 text-emerald-400" />;
    if (score >= 0.6) return <CheckCircle className="h-5 w-5 text-amber-500" />;
    return <XCircle className="h-5 w-5 text-rose-500" />;
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
    const totalQuestions = currentAttempt.totalQuestions ?? lecture.quiz.length;
    const correctCount = currentAttempt.correctCount ?? Math.round(currentAttempt.score * totalQuestions);
    const scorePercent = Math.round(currentAttempt.score * 100);
    const isPass = currentAttempt.passed;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getScoreIcon(currentAttempt.score, isPass)}
            Quiz Results
          </CardTitle>
          <CardDescription>
            Your performance on this quiz
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Score Display */}
          <div className={cn("text-center space-y-3", isPass ? "animate-in fade-in zoom-in" : "animate-in fade-in slide-in-from-top-2") }>
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-slate-900/80 p-3 shadow-lg ring-2 ring-slate-200/40">
                {getScoreIcon(currentAttempt.score, isPass)}
              </div>
              <div className="text-start">
                <div className="text-xs uppercase tracking-wide text-slate-400">Score</div>
                <div className={cn('text-3xl font-semibold', isPass ? 'text-white' : 'text-rose-200')}>
                  {scorePercent}%
                </div>
              </div>
            </div>
            <div className={cn("text-lg font-semibold", getScoreColor(currentAttempt.score))}>
              {isPass ? 'Badge Unlocked!' : 'Keep Going'}
            </div>
            {currentAttempt.letterGrade && (
              <div className="flex items-center justify-center">
                <Badge variant={isPass ? 'default' : 'secondary'} className={cn('px-3 py-1 text-base font-semibold uppercase tracking-wide', isPass ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' : 'bg-rose-500/20 text-rose-300 border-rose-400/40')}>
                  {currentAttempt.letterGrade}
                </Badge>
              </div>
            )}
            <p className="text-xs text-slate-300">
              Required to pass: {Math.round(effectivePassThreshold * 100)}%
            </p>
            <p className={cn('text-sm', isPass ? 'text-emerald-200' : 'text-rose-200')}>
              {isPass
                ? `You answered ${correctCount} of ${totalQuestions} correctly. Keep the momentum going!`
                : `You answered ${correctCount} of ${totalQuestions}. Score at least ${Math.round(effectivePassThreshold * 100)}% to unlock the next lecture.`}
            </p>
          </div>

          {/* Question Review */}
          <div className="space-y-3">
            <h4 className="font-semibold text-slate-200">Question Review:</h4>
            {lecture.quiz.map((question, questionIndex) => {
              const userAnswer = currentAttempt.answers[questionIndex];
              const isCorrect = userAnswer === question.correctIndex;
              const showCorrection = currentAttempt.passed && !isCorrect;
              return (
                <div key={questionIndex} className={cn("rounded-xl border p-3 space-y-2 bg-slate-950/40", isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30')}>
                  <div className="font-medium text-slate-100">
                    {questionIndex + 1}. {question.question}
                  </div>
                  <div className="space-y-1">
                    {question.choices.map((choice, choiceIndex) => (
                      <div
                        key={choiceIndex}
                        className={cn(
                          'flex items-center gap-2 rounded px-2 py-1 text-sm transition-colors',
                          choiceIndex === question.correctIndex && 'bg-emerald-500/15 text-emerald-200',
                          choiceIndex === userAnswer && choiceIndex !== question.correctIndex && 'bg-rose-500/15 text-rose-200'
                        )}
                      >
                        {choiceIndex === question.correctIndex ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : choiceIndex === userAnswer ? (
                          <XCircle className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4" />
                        )}
                        <span>{choice}</span>
                      </div>
                    ))}
                  </div>
                  {showCorrection && (
                    <div className="rounded-md bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                      Correct answer: <span className="font-semibold">{question.choices[question.correctIndex]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              onClick={isPass ? handleRetakeQuiz : handleGenerateMoreQuestions}
              disabled={isGeneratingMore && !isPass}
              className={cn('flex-1 text-white shadow-lg transition',
                isPass
                  ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:from-blue-400 hover:to-purple-400'
                  : 'bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 hover:from-rose-400 hover:to-orange-400')}
            >
              {isPass ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Challenge Yourself Again
                </>
              ) : isGeneratingMore ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Generating new quiz...
                </>
              ) : (
                <>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again with New Questions
                </>
              )}
            </Button>
            <Button
              onClick={handleRetakeQuiz}
              variant="outline"
              className="flex-1 border-slate-500/40 text-slate-200 hover:border-slate-400/60"
            >
              Review Answers
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
        {/* Timer & Controls */}
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Badge variant="outline" className="uppercase tracking-[0.18em]">Timed Quiz</Badge>
          </div>
          <div className={cn(
            "text-lg font-semibold",
            timeLeftSec <= 9 ? 'text-rose-600' : timeLeftSec <= 60 ? 'text-amber-600' : 'text-slate-700'
          )}
          >
            Time Left: {formatTime(timeLeftSec)}
          </div>
        </div>
        {timeLeftSec <= 60 && !showResults && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/30 dark:text-amber-200">
            {timeLeftSec > 9 ? 'Warning: Less than 1 minute remaining.' : `Final seconds: ${timeLeftSec}s`}
          </div>
        )}
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

        {/* Submit/Cancel Row */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleSubmitQuiz}
            disabled={isSubmitting || currentAnswers.some(answer => answer === -1)}
            className="sm:flex-1"
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
          <Button
            variant="outline"
            onClick={() =>
            {
              const ok = window.confirm('Cancel this quiz? Your current answers will be lost.');
              if (!ok)
              {
                return;
              }
              if (timerRef.current)
              {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
              }
              setCurrentAnswers(new Array(lecture.quiz?.length || 0).fill(-1));
              setCurrentAttempt(null);
              setShowResults(false);
              onQuizStateChange?.(false);
              onCancelRequested?.();
            }}
          >
            Cancel Quiz
          </Button>
        </div>

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
