import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolHeaderProps {
  icon: LucideIcon;
  title: string;
  badge: string;
  description: string;
  badgeIcon?: LucideIcon;
  className?: string;
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  icon: Icon,
  title,
  badge,
  description,
  badgeIcon: BadgeIcon,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center justify-between p-6 border-b-2 border-purple-200 dark:border-purple-800 bg-sidebar/30",
      className
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Icon className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-lg font-semibold">{title}</h1>
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
              {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
              {badge}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};