import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import type { Course, CourseExam } from '@/types/university';

const CourseExamView = () =>
{
  const { courseId, examType } = useParams<{ courseId: string; examType: 'midterm' | 'final' }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [exam, setExam] = useState<CourseExam | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() =>
  {
    const load = async () =>
    {
      if (!courseId || !examType) return;
      const loadedCourse = await universityApi.getCourse(courseId);
      if (!loadedCourse)
      {
        navigate('/university');
        return;
      }
      setCourse(loadedCourse);
      const existing = examType === 'midterm' ? loadedCourse.midtermExam : loadedCourse.finalExam;
      if (existing) setExam(existing);
      else
      {
        const contents = loadedCourse.lectures.map(l => l.content || '').filter(Boolean);
        const generated = await universityApi.generateCourseExam(courseId, examType, contents);
        const updatedCourse: Course = { ...loadedCourse };
        if (examType === 'midterm') updatedCourse.midtermExam = generated; else updatedCourse.finalExam = generated;
        await universityApi.saveCourse(updatedCourse);
        setCourse(updatedCourse);
        setExam(generated);
      }
    };
    load();
  }, [courseId, examType, navigate]);

  const progress = useMemo(() =>
  {
    if (!exam) return 0;
    const total = exam.questions.length || 1;
    const answered = Object.keys(answers).length;
    return Math.round((answered / total) * 100);
  }, [answers, exam]);

  if (!course || !exam)
  {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate(`/university/course/${course.metadata.id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Syllabus
          </Button>
          <div className="text-right">
            <div className="font-semibold">{exam.title}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{course.metadata.title}</div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{exam.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {result && (
              <Alert>
                {result.passed ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>
                  {result.passed ? 'Passed' : 'Not passed'} — Score: {Math.round(result.score * 100)}%
                </AlertDescription>
              </Alert>
            )}

            {exam.questions.map((q, qi) => (
              <Card key={qi}>
                <CardContent className="pt-6">
                  <div className="mb-4 font-medium">{qi + 1}. {q.question}</div>
                  <RadioGroup
                    value={answers[qi]?.toString() || ''}
                    onValueChange={(v) => setAnswers(prev => ({ ...prev, [qi]: parseInt(v) }))}
                  >
                    {q.choices.map((choice, ci) => (
                      <div key={ci} className="flex items-center space-x-2">
                        <RadioGroupItem value={ci.toString()} id={`q${qi}-c${ci}`} />
                        <Label htmlFor={`q${qi}-c${ci}`}>{choice}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}

            <div className="flex gap-4 pt-2">
              <Button
                onClick={async () => {
                  if (!exam || !course) return;
                  const list = exam.questions.map((_, i) => answers[i] ?? -1);
                  if (list.includes(-1)) { alert('Please answer all questions.'); return; }
                  setIsSubmitting(true);
                  const attempt = await universityApi.submitCourseExam(course.metadata.id, exam.id, list);
                  const updatedExam: CourseExam = {
                    ...exam,
                    attempts: [...exam.attempts, attempt],
                    updatedAt: new Date().toISOString()
                  };
                  const updatedCourse: Course = { ...course };
                  if (exam.type === 'midterm') updatedCourse.midtermExam = updatedExam; else updatedCourse.finalExam = updatedExam;
                  await universityApi.saveCourse(updatedCourse);
                  setCourse(updatedCourse);
                  setExam(updatedExam);
                  setResult({ score: attempt.score, passed: attempt.passed });
                  setIsSubmitting(false);
                }}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
              <Button variant="outline" onClick={() => setAnswers({})} className="flex-1">Reset Answers</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourseExamView;

