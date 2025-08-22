import { PreMusaiPage } from "@/components/common/PreMusaiPage";
import { useState } from "react";
import type { SearchMode, SearchSource } from "@/types/search";

interface PreSearchViewProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onClose: () => void;
  onViewPreviousSearches?: () => void;
  onShowTrendingTopics?: () => void;
  onQuickAnswers?: () => void;
  titleNode?: React.ReactNode;
}

export const PreSearchView = ({ 
  onSearch, 
  isLoading, 
  onClose, 
  onViewPreviousSearches, 
  onShowTrendingTopics,
  onQuickAnswers,
  titleNode
}: PreSearchViewProps) => {
  const [mode, setMode] = useState<SearchMode>('standard');
  const [sources, setSources] = useState<SearchSource[]>(['web']);

  const handleQuickAction = (actionId: string, actionType: string, actionData?: any) => {
    switch (actionId) {
      case 'search-chat':
        // Start a new chat session
        console.log('Starting new search chat session');
        break;
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
      titleNode={titleNode}
    />
  );
};