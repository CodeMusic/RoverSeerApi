import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
      "flex gap-1 flex-shrink-0 text-muted-foreground",
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
        <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 hover:bg-sidebar-accent hover:shadow-sm"
        onClick={onStartEdit}
        title="Rename session"
        aria-label="Rename session"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive hover:shadow-sm focus:bg-destructive/20 focus:text-destructive"
            onClick={(e) => e.stopPropagation()}
            title="Delete session"
            aria-label="Delete session"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Press Enter to confirm deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              autoFocus
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


