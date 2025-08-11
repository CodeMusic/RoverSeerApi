import CourseCreation from '@/components/university/CourseCreation';
import { useSearchParams } from 'react-router-dom';
import { BaseLayout } from '@/components/common/BaseLayout';
import { APP_TERMS } from '@/config/constants';

const CourseCreationPage = () => 
{
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic');

  const renderMainContent = () => {
    return (
      <div className="p-6">
        <CourseCreation initialTopic={initialTopic || undefined} />
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

export default CourseCreationPage; 