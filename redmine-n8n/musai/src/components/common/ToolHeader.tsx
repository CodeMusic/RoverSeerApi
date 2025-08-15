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
  size?: 'default' | 'compact';
}

export const ToolHeader: React.FC<ToolHeaderProps> = ({
  icon: Icon,
  title,
  badge,
  description,
  badgeIcon: BadgeIcon,
  className,
  size = 'default'
}) => {
  return (
    <div className={cn(
      size === 'compact' ? "flex items-center justify-between px-4 py-2 bg-sidebar/30" : "flex items-center justify-between p-6 bg-sidebar/30",
      className
    )}>
      <div className={cn("flex items-center flex-1 min-w-0 rounded-lg", size === 'compact' ? "gap-2 p-1" : "gap-3 p-2") }>
        <Icon className={cn("text-primary flex-shrink-0", size === 'compact' ? "w-4 h-4" : "w-5 h-5")} />
        <div className="min-w-0 flex-1">
          <div className={cn("flex items-center gap-2", size === 'compact' ? "mb-0" : "mb-1") }>
            <h1 className={cn("font-semibold", size === 'compact' ? "text-base" : "text-lg")}>{title}</h1>
            <div className={cn("flex items-center gap-1 bg-primary/10 text-primary rounded-full font-medium", size === 'compact' ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs") }>
              {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
              {badge}
            </div>
          </div>
          {size !== 'compact' && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};