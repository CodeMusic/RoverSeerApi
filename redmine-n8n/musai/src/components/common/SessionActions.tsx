import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionActionsProps
{
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  className?: string;
}

export function SessionActions({
  isFavorite,
  onToggleFavorite,
  onStartEdit,
  onDelete,
  className,
}: SessionActionsProps)
{
  return (
    <div className={cn(
      "flex gap-1 flex-shrink-0",
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 hover:bg-sidebar-accent hover:shadow-sm",
          isFavorite && "text-yellow-500"
        )}
        onClick={onToggleFavorite}
        title="Toggle favorite"
        aria-label="Toggle favorite"
      >
        <Star className="h-3 w-3" fill={isFavorite ? "currentColor" : "none"} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-sidebar-accent hover:shadow-sm"
        onClick={onStartEdit}
        title="Rename session"
        aria-label="Rename session"
      >
        <Pencil className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive hover:shadow-sm focus:bg-destructive/20 focus:text-destructive"
        onClick={onDelete}
        title="Delete session"
        aria-label="Delete session"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}


