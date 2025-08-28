import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import { BaseLayout } from '@/components/common/BaseLayout';
import { APP_TERMS } from '@/config/constants';

interface PreviewState 
{
  title: string;
  summary?: string;
  steps?: Array<{ title: string; description: string }>; // optional if provided
}

const CourseLecturePreview = () => 
{
  const navigate = useNavigate();
  const location = useLocation();
  const [html, setHtml] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => 
  {
    const state = (location.state || {}) as PreviewState;
    if (!state?.title)
    {
      setError('No lecture title provided');
      setIsLoading(false);
      return;
    }
    setTitle(state.title);

    const run = async () => 
    {
      try 
      {
        setIsLoading(true);
        // If steps were provided, send them; otherwise synthesize a minimal single step from title/summary
        const steps = state.steps && state.steps.length > 0
          ? state.steps
          : [{ title: state.title, description: state.summary || 'Preview generation from syllabus item' }];
        const generated = await universityApi.generateLectureContent(steps);
        setTitle(generated.title || state.title);
        setHtml(generated.content || '');
      }
      catch (e)
      {
        setError('Failed to generate lecture preview');
      }
      finally 
      {
        setIsLoading(false);
      }
    };

    run();
  }, [location.state]);

  const renderMainContent = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6 flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Syllabus
            </Button>
            <h1 className="text-2xl font-bold">{title || 'Lecture Preview'}</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Lecture Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && (
                <div className="py-10 text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
                  <p className="text-gray-600 dark:text-gray-300">Generating lecture from syllabus item...</p>
                </div>
              )}
              {!isLoading && error && (
                <div className="py-10 text-center text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              {!isLoading && !error && (
                <div className="prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <BaseLayout
      currentTab={APP_TERMS.TAB_UNIVERSITY}
      sessions={[]}
      currentSessionId=""
      onNewSession={() => {}}
      onSessionSelect={() => {}}
      onDeleteSession={() => {}}
      onRenameSession={() => {}}
      onToggleFavorite={() => {}}
      renderMainContent={renderMainContent}
      onTabChange={() => {}}
      isNavigationExpanded={false}
      onToggleNavigation={() => {}}
    />
  );
};

export default CourseLecturePreview;


