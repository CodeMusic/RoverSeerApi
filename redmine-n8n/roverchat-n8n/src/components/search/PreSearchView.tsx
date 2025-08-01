import { PreMusaiPage } from "@/components/common/PreMusaiPage";
import { TrendingUp, Clock, Zap } from "lucide-react";

interface PreSearchViewProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  onClose: () => void;
  onViewPreviousSearches?: () => void;
}

export const PreSearchView = ({ onSearch, isLoading, onClose, onViewPreviousSearches }: PreSearchViewProps) => {
  return (
    <PreMusaiPage
      type="search"
      onSubmit={(input) => onSearch(input)}
      isLoading={isLoading}
      quickActions={[
        { 
          icon: TrendingUp, 
          title: "Trending Topics", 
          description: "Explore what's popular today" 
        },
        { 
          icon: Clock, 
          title: "Recent Searches", 
          description: "Your search history",
          action: onViewPreviousSearches
        },
        { 
          icon: Zap, 
          title: "Quick Answers", 
          description: "Get instant insights" 
        }
      ]}
    />
  );
};