import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavigationBar } from '@/components/common/NavigationBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface UniversityLayoutProps
{
  children: ReactNode;
  isSidebarExpanded: boolean;
  onToggleExpanded: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const UniversityLayout = ({ 
  children, 
  isSidebarExpanded, 
  onToggleExpanded,
  isSidebarOpen = false,
  onToggleSidebar 
}: UniversityLayoutProps) => 
{
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleTabChange = (tab: string) => 
  {
    // Handle navigation to different sections
    switch (tab) 
    {
      case "chat":
        navigate("/chat");
        break;
      case "musai-search":
        navigate("/chat", { state: { switchToTab: "musai-search" } });
        break;
      case "code-musai":
        navigate("/chat", { state: { switchToTab: "code-musai" } });
        break;
      case "emergent-narrative":
        navigate("/chat", { state: { switchToTab: "emergent-narrative" } });
        break;
      case "musai-university":
        navigate("/university");
        break;
      case "task-musai":
        navigate("/chat", { state: { switchToTab: "task-musai" } });
        break;
      case "settings":
        navigate("/chat", { state: { switchToTab: "settings" } });
        break;
      default:
        // Handle other tabs or coming soon features
        break;
    }
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100",
      "dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900"
    )}>
      {/* Navigation Sidebar */}
      <NavigationBar
        currentTab="musai-university"
        onTabChange={handleTabChange}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={onToggleExpanded}
      />

      {/* Mobile sidebar toggle */}
      {isMobile && onToggleSidebar && (
        <Button
          variant="ghost"
          className="fixed top-4 left-4 z-40 md:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="w-6 h-6" />
        </Button>
      )}

      {/* Main content area */}
      <div className={cn(
        "container mx-auto px-4 py-8 transition-all duration-300 max-w-7xl",
        isMobile ? "ml-0" : isSidebarExpanded ? "ml-48" : "ml-16"
      )}>
        {children}
      </div>
    </div>
  );
};