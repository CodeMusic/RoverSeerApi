import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, ThumbsDown, Share2, MessageCircle, ExternalLink, 
  Star, Sparkles, Brain 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { n8nApi } from '@/config/n8nEndpoints';

interface CurationItem {
  id: string;
  type: 'news' | 'image' | 'thought' | 'music' | 'reading' | 'interactive' | 'philosophy' | 'creative';
  title: string;
  content: any;
  aiInsight: string;
  emergenceScore: number;
  userResonance: number;
  timestamp: number;
  tags: string[];
  metadata?: {
    source?: string;
    generationPrompt?: string;
    comfyUIWorkflow?: string;
    interactionCount?: number;
  };
}

interface CurationsFeedbackCardProps {
  item: CurationItem;
  isPublicView?: boolean;
  onFeedbackSubmitted?: (itemId: string, feedback: string) => void;
}

export const CurationsFeedbackCard: React.FC<CurationsFeedbackCardProps> = ({ 
  item, 
  isPublicView = false,
  onFeedbackSubmitted 
}) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);

  const handleQuickFeedback = async (feedback: 'love' | 'like' | 'meh' | 'dislike') => {
    try {
      const success = await n8nApi.submitCurationFeedback(item.id, feedback);
      if (success) {
        setFeedbackSubmitted(true);
        setSelectedFeedback(feedback);
        onFeedbackSubmitted?.(item.id, feedback);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleDetailedFeedback = async (feedback: 'love' | 'like' | 'meh' | 'dislike') => {
    try {
      const success = await n8nApi.submitCurationFeedback(item.id, feedback, feedbackComment);
      if (success) {
        setFeedbackSubmitted(true);
        setSelectedFeedback(feedback);
        setShowFeedbackForm(false);
        setFeedbackComment('');
        onFeedbackSubmitted?.(item.id, `${feedback} with comment: ${feedbackComment}`);
      }
    } catch (error) {
      console.error('Failed to submit detailed feedback:', error);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      {/* Emergency Score & Stars for tool view */}
      {!isPublicView && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "w-3 h-3",
                  i < Math.round(item.emergenceScore * 5) 
                    ? "text-amber-400 fill-amber-400" 
                    : "text-gray-300"
                )} 
              />
            ))}
          </div>
          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700">
            {Math.round(item.emergenceScore * 100)}% emergence
          </Badge>
        </div>
      )}

      <CardContent className="p-6">
        {/* Title and type */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {item.type}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(item.timestamp).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-semibold group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {item.title}
          </h3>
        </div>

        {/* Content */}
        <div className="mb-4">
          <div className="prose prose-sm max-w-none dark:prose-invert mb-3">
            {typeof item.content === 'string' ? (
              <p className="text-muted-foreground leading-relaxed">{item.content}</p>
            ) : (
              <div className="text-muted-foreground leading-relaxed">
                {/* Handle different content types */}
                {item.content.text && <p>{item.content.text}</p>}
                {item.content.description && <p>{item.content.description}</p>}
                {item.content.summary && <p>{item.content.summary}</p>}
              </div>
            )}
          </div>

          {/* AI Insight - only for tool view */}
          {!isPublicView && item.aiInsight && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg border border-purple-200/50 dark:border-purple-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-900 dark:text-purple-100">AI Reflection</span>
              </div>
              <p className="text-sm text-purple-700 dark:text-purple-300 italic">
                "{item.aiInsight}"
              </p>
            </div>
          )}
        </div>

        {/* Metadata links */}
        {item.metadata?.source && (
          <div className="mb-4">
            <a
              href={item.metadata.source}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              View Source
            </a>
          </div>
        )}

        <Separator className="my-4" />

        {/* Feedback Section */}
        <div className="space-y-3">
          {!feedbackSubmitted ? (
            <>
              {/* Quick feedback buttons */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickFeedback('love')}
                    className="text-pink-600 hover:text-pink-700 hover:bg-pink-50 dark:hover:bg-pink-900/30"
                  >
                    <Heart className="w-4 h-4 mr-1" />
                    Love
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickFeedback('like')}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1 rotate-180" />
                    Like
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickFeedback('meh')}
                    className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                  >
                    <span className="w-4 h-4 mr-1">😐</span>
                    Meh
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleQuickFeedback('dislike')}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <ThumbsDown className="w-4 h-4 mr-1" />
                    Dislike
                  </Button>
                </div>

                <div className="flex gap-2">
                  {!isPublicView && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Comment
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Detailed feedback form for tool view */}
              {!isPublicView && showFeedbackForm && (
                <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                  <Textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Help Musai improve by sharing specific feedback about this curation. What resonated with you? What could be better?"
                    className="resize-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDetailedFeedback('love')}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white"
                    >
                      Love with feedback
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDetailedFeedback('like')}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      Like with feedback
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowFeedbackForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Feedback submitted message */
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              <span>
                Thank you for your {selectedFeedback} feedback! This helps Musai learn and evolve.
              </span>
            </div>
          )}

          {/* Tool-specific improvement note */}
          {!isPublicView && !feedbackSubmitted && (
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
              <Sparkles className="w-3 h-3" />
              <span>Your feedback shapes future AI curations and personality evolution</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};