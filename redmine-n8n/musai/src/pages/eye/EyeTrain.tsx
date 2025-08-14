import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye } from 'lucide-react';
import { eyeApi, EyeTrainRequest, EyeTrainResponse } from '@/lib/eyeApi';
import { BaseLayout } from '@/components/common/BaseLayout';
import { APP_TERMS } from '@/config/constants';
import { RouteUtils } from '@/config/routes';
import { AllSessions } from '@/types/chat';

type LocationState = {
  payload?: EyeTrainRequest;
  preview?: { data: string; mimeType: string; fileName?: string };
};

export default function EyeTrain()
{
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<EyeTrainResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

  const imageSrc = useMemo(() =>
  {
    if (!state.preview) return null;
    return `data:${state.preview.mimeType};base64,${state.preview.data}`;
  }, [state.preview]);

  const handleConfirm = async () =>
  {
    if (!state.payload) {
      navigate(-1);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await eyeApi.train(state.payload);
      setResult(res);
    } catch (e: any) {
      setError(e?.message || 'Training failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate(-1);

  const emptySessions: AllSessions[] = [];

  const renderContent = () => (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Train Eye of Musai</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!result && (
            <>
              {imageSrc && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Selected image</div>
                  <img src={imageSrc} alt={state.preview?.fileName || 'Selected'} className="max-h-64 rounded-md object-contain" />
                </div>
              )}
              {state.payload?.prompt && (
                <div className="p-3 rounded-md bg-muted/40">
                  <div className="text-xs text-muted-foreground mb-1">Prompt</div>
                  <div className="text-sm whitespace-pre-wrap">{state.payload.prompt}</div>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancel} disabled={isSubmitting} className="rounded-xl">Cancel</Button>
                <Button onClick={handleConfirm} disabled={isSubmitting} className="rounded-xl">Confirm Train</Button>
              </div>
            </>
          )}

          {isSubmitting && (
            <div className="flex items-center justify-center py-8" aria-live="polite" aria-busy="true">
              <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">Training via n8n…</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="text-green-600 font-medium">Training started successfully.</div>
              <div className="text-sm">Job ID: <span className="font-mono">{result.jobId}</span></div>
              {result.modelVersionId && (
                <div className="text-sm">Model Version: <span className="font-mono">{result.modelVersionId}</span></div>
              )}
              <div className="pt-2 flex gap-2 justify-end">
                <Button onClick={() => navigate(-1)} className="rounded-xl">Back</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const handleTabChange = (nextTab: string) => {
    const tabToMode: Record<string, string> = {
      [APP_TERMS.TAB_CHAT]: 'chat',
      [APP_TERMS.TAB_SEARCH]: 'search',
      [APP_TERMS.TAB_CODE]: 'code',
      [APP_TERMS.TAB_UNIVERSITY]: 'university',
      [APP_TERMS.TAB_NARRATIVE]: 'narrative',
      [APP_TERMS.TAB_TASK]: 'task',
      [APP_TERMS.TAB_CAREER]: 'career',
      [APP_TERMS.TAB_THERAPY]: 'therapy',
      [APP_TERMS.TAB_MEDICAL]: 'medical',
      [APP_TERMS.TAB_EYE]: 'eye',
    };
    const mode = tabToMode[nextTab] || 'chat';
    navigate(RouteUtils.mainAppWithMode(mode));
  };

  return (
    <BaseLayout
      currentTab={APP_TERMS.TAB_EYE}
      sessions={emptySessions}
      currentSessionId={""}
      onNewSession={() => {}}
      onSessionSelect={() => {}}
      onDeleteSession={() => {}}
      onRenameSession={() => {}}
      onToggleFavorite={() => {}}
      renderMainContent={renderContent}
      renderRightSidebar={undefined}
      renderLeftSidebarOverride={() => null}
      onTabChange={handleTabChange}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(!isNavigationExpanded)}
    />
  );
}


