import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { APP_TERMS } from '@/config/constants';
import { 
  MessageSquare, 
  Search, 
  Code, 
  GraduationCap, 
  Theater, 
  TrendingUp, 
  Bot, 
  Heart,
  Eye
} from 'lucide-react';

const toolConfig = {
  chat: {
    icon: MessageSquare,
    label: APP_TERMS.NAV_CHAT,
    description: APP_TERMS.CHAT_DESCRIPTION,
    badge: APP_TERMS.CHAT_BADGE,
    color: '#FF0000'
  },
  search: {
    icon: Search,
    label: APP_TERMS.NAV_SEARCH,
    description: APP_TERMS.SEARCH_DESCRIPTION,
    badge: APP_TERMS.SEARCH_BADGE,
    color: '#FF7F00'
  },
  eye: {
    icon: Eye,
    label: APP_TERMS.NAV_EYE,
    description: APP_TERMS.EYE_DESCRIPTION,
    badge: APP_TERMS.EYE_BADGE,
    color: '#06B6D4'
  },
  code: {
    icon: Code,
    label: APP_TERMS.NAV_CODE,
    description: APP_TERMS.CODE_DESCRIPTION,
    badge: APP_TERMS.CODE_BADGE,
    color: '#FFFF00'
  },
  university: {
    icon: GraduationCap,
    label: APP_TERMS.NAV_UNIVERSITY,
    description: APP_TERMS.UNIVERSITY_DESCRIPTION,
    badge: APP_TERMS.UNIVERSITY_BADGE,
    color: '#00FF00'
  },
  narrative: {
    icon: Theater,
    label: APP_TERMS.NAV_NARRATIVE,
    description: APP_TERMS.NARRATIVE_DESCRIPTION,
    badge: APP_TERMS.NARRATIVE_BADGE,
    color: '#0000FF'
  },
  career: {
    icon: TrendingUp,
    label: APP_TERMS.NAV_CAREER,
    description: APP_TERMS.CAREER_DESCRIPTION,
    badge: APP_TERMS.CAREER_BADGE,
    color: '#4B0082'
  },
  therapy: {
    icon: Heart,
    label: APP_TERMS.NAV_THERAPY,
    description: APP_TERMS.THERAPY_DESCRIPTION,
    badge: APP_TERMS.THERAPY_BADGE,
    color: '#FF69B4'
  },
  task: {
    icon: Bot,
    label: APP_TERMS.NAV_TASK,
    description: APP_TERMS.TASK_DESCRIPTION,
    badge: APP_TERMS.TASK_BADGE,
    color: '#9400D3'
  }
};

export const ToolVisibilitySettings: React.FC = () => {
  const { preferences, setToolVisibility, isToolVisible } = useUserPreferences();

  const handleToggleTool = (tool: string, visible: boolean) => {
    setToolVisibility(tool as any, visible);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          Tool Visibility
        </CardTitle>
        <CardDescription>
          Choose which Musai tools to display in your navigation. Hidden tools won't appear in the sidebar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(toolConfig).map(([toolKey, config]) => {
          const Icon = config.icon;
          const isVisible = isToolVisible(toolKey as any);
          
          return (
            <div
              key={toolKey}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}20` }}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: config.color }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{config.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {config.badge}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={isVisible}
                onCheckedChange={(checked) => handleToggleTool(toolKey, checked)}
                className="ml-4"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
