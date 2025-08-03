import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Clock, Eye, EyeOff, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurationsApproval } from '@/hooks/useCurationsApproval';
import { MusaiShimmer } from '@/components/effects/MusaiEffects';

interface CurationsApprovalBarProps {
  className?: string;
}

/**
 * Approval bar shown at the top of curations tool when content needs approval
 * Allows users to make curations public or keep them private
 */
export const CurationsApprovalBar: React.FC<CurationsApprovalBarProps> = ({ className }) => {
  const { 
    isPublic, 
    pendingApproval, 
    requiresApproval, 
    isLoading, 
    approveCurations,
    checkApprovalStatus 
  } = useCurationsApproval();
  
  const [isApproving, setIsApproving] = useState(false);

  // Don't show if no approval needed or already public
  if (!requiresApproval || (isPublic && !pendingApproval)) {
    return null;
  }

  const handleApprove = async () => {
    setIsApproving(true);
    const success = await approveCurations();
    if (success) {
      await checkApprovalStatus(); // Refresh status
    }
    setIsApproving(false);
  };

  return (
    <Card className={cn(
      "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800/50",
      className
    )}>
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Status indicator */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <MusaiShimmer rounded="full">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  {pendingApproval ? (
                    <Clock className="w-5 h-5 text-white" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-white" />
                  )}
                </div>
              </MusaiShimmer>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  {pendingApproval ? 'Curations Awaiting Approval' : 'Curations Ready for Review'}
                </h3>
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                  {pendingApproval ? 'Pending' : 'Draft'}
                </Badge>
              </div>
              
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {pendingApproval 
                  ? 'New curations are ready but need your approval before becoming public.'
                  : 'AI has generated new curations. Review and approve to make them visible to all users.'
                }
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {/* Current status */}
            <div className="flex items-center gap-2 text-sm">
              {isPublic ? (
                <>
                  <Eye className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-300 font-medium">Public</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-amber-600" />
                  <span className="text-amber-700 dark:text-amber-300 font-medium">Private</span>
                </>
              )}
            </div>

            {/* Approve button */}
            <Button
              onClick={handleApprove}
              disabled={isLoading || isApproving}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {isApproving ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Make Public
                </>
              )}
            </Button>

            {/* Dismiss/Keep Private button */}
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
            >
              <X className="w-4 h-4 mr-1" />
              Keep Private
            </Button>
          </div>
        </div>

        {/* Additional info */}
        {pendingApproval && (
          <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <Sparkles className="w-3 h-3" />
              <span>
                These curations were generated based on your interaction patterns and AI evolution. 
                Your approval helps train future generations.
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};