import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CourseCreation from '@/components/university/CourseCreation';
import { BaseLayout } from '@/components/common/BaseLayout';
import { APP_TERMS } from '@/config/constants';
import { RouteUtils } from '@/config/routes';
import type { AllSessions } from '@/types/chat';

const CourseCreationPage = () => 
{
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic');
  const navigate = useNavigate();
  const [isNavigationExpanded, setIsNavigationExpanded] = useState(false);

  const noop = () => {};
  const sessions: AllSessions[] = [];

  const renderMainContent = () => (
    <div className="p-6">
      <CourseCreation initialTopic={initialTopic || undefined} />
    </div>
  );

  const handleTabChange = (tab: string) =>
  {
    const map: Record<string, string> = {
      [APP_TERMS.TAB_CHAT]: 'chat',
      [APP_TERMS.TAB_SEARCH]: 'search',
      [APP_TERMS.TAB_CODE]: 'code',
      [APP_TERMS.TAB_UNIVERSITY]: 'university',
      [APP_TERMS.TAB_NARRATIVE]: 'narrative',
      [APP_TERMS.TAB_CAREER]: 'career',
      [APP_TERMS.TAB_THERAPY]: 'therapy',
      [APP_TERMS.TAB_MEDICAL]: 'medical',
      [APP_TERMS.TAB_TASK]: 'task',
      [APP_TERMS.TAB_EYE]: 'eye'
    };
    const mode = map[tab] || 'chat';
    navigate(RouteUtils.mainAppWithMode(mode));
  };

  return (
    <BaseLayout
      currentTab={APP_TERMS.TAB_UNIVERSITY}
      sessions={sessions}
      currentSessionId=""
      onNewSession={noop}
      onSessionSelect={noop}
      onDeleteSession={noop}
      onRenameSession={noop}
      onToggleFavorite={noop}
      renderMainContent={renderMainContent}
      onTabChange={handleTabChange}
      isNavigationExpanded={isNavigationExpanded}
      onToggleNavigation={() => setIsNavigationExpanded(prev => !prev)}
      renderLeftSidebarOverride={() => null}
    />
  );
};

export default CourseCreationPage;
