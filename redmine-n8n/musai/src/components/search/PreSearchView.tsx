import { PreMusaiPage } from "@/components/common/PreMusaiPage";

interface PreSearchViewProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onClose: () => void;
  onViewPreviousSearches?: () => void;
  onShowTrendingTopics?: () => void;
  onQuickAnswers?: () => void;
}

export const PreSearchView = ({ 
  onSearch, 
  isLoading, 
  onClose, 
  onViewPreviousSearches, 
  onShowTrendingTopics,
  onQuickAnswers 
}: PreSearchViewProps) => {
  
  const handleQuickAction = (actionId: string, actionType: string, actionData?: any) => {
    switch (actionId) {
      case 'search-trending':
        if (onShowTrendingTopics) {
          onShowTrendingTopics();
        } else if (actionData) {
          onSearch(actionData);
        }
        break;
      case 'search-recent':
        if (onViewPreviousSearches) {
          onViewPreviousSearches();
        }
        break;
      case 'search-quick':
        if (onQuickAnswers) {
          onQuickAnswers();
        } else if (actionData) {
          onSearch(actionData);
        }
        break;
      default:
        console.log('Unknown search quick action:', actionId, actionType, actionData);
    }
  };

  return (
    <PreMusaiPage
      type="search"
      onSubmit={(input) => onSearch(input)}
      onQuickAction={handleQuickAction}
      isLoading={isLoading}
    />
  );
};