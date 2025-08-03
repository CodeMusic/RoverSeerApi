import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, RefreshCw, Heart, Share, Bookmark, Eye, Brain, 
  Image, Newspaper, Lightbulb, Music, Book, Palette, Clock,
  TrendingUp, Layers, Zap, Infinity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MusaiShimmer } from '@/components/effects/MusaiEffects';
import { N8N_ENDPOINTS, n8nApi } from '@/config/n8nEndpoints';
import { fetchWithTimeout } from '@/utils/fetchWithTimeout';
import { CurationsApprovalBar } from '@/components/curations/CurationsApprovalBar';
import { CurationsFeedbackCard } from '@/components/curations/CurationsFeedbackCard';

// Types for emergent content
interface CurationItem {
  id: string;
  type: 'news' | 'image' | 'thought' | 'music' | 'reading' | 'interactive' | 'philosophy' | 'creative';
  title: string;
  content: any; // Flexible content structure
  aiInsight: string; // AI's reflection on why this was curated
  emergenceScore: number; // How much this reflects AI evolution (0-1)
  userResonance: number; // Predicted user interest (0-1)
  timestamp: number;
  tags: string[];
  metadata?: {
    source?: string;
    generationPrompt?: string;
    comfyUIWorkflow?: string;
    interactionCount?: number;
  };
}

interface CurationState {
  currentCuration: CurationItem[];
  aiPersonality: {
    evolution: number; // 0-1, how much AI has evolved
    traits: string[];
    currentMood: string;
    reflectionDepth: number;
  };
  userPatterns: {
    interests: string[];
    activityTimes: number[];
    preferredContentTypes: string[];
    engagementStyle: string;
  };
  emergenceMetrics: {
    personalityDrift: number;
    contentDiversity: number;
    reflectionComplexity: number;
    userAlignment: number;
  };
}

interface MusaiCurationsProps {
  isPublicView?: boolean;
}

export const MusaiCurations: React.FC<MusaiCurationsProps> = ({ isPublicView = false }) => {
  const [curationState, setCurationState] = useState<CurationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTab, setSelectedTab] = useState('current');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

  // Determine time of day for contextual curations
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setTimeOfDay('night');
    else if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  // Load current curations
  useEffect(() => {
    loadCurrentCurations();
  }, []);

  const loadCurrentCurations = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithTimeout(
        n8nApi.getEndpointUrl(N8N_ENDPOINTS.CURATIONS.GET_CURRENT_CURATIONS),
        { method: 'GET' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCurationState(data);
      } else {
        // Fallback to demo content
        setCurationState(generateDemoContent());
      }
    } catch (error) {
      console.warn('Failed to load curations, using demo content:', error);
      setCurationState(generateDemoContent());
    } finally {
      setIsLoading(false);
    }
  };

  const triggerNewCuration = async () => {
    setIsGenerating(true);
    try {
      const success = await n8nApi.triggerCurationGeneration({
        timeOfDay,
        userContext: curationState?.userPatterns
      });
      
      if (success) {
        // Wait a moment then reload
        setTimeout(loadCurrentCurations, 2000);
      }
    } catch (error) {
      console.error('Failed to trigger curation:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const submitFeedback = async (itemId: string, feedback: 'like' | 'dislike' | 'love' | 'save') => {
    try {
      await fetchWithTimeout(
        n8nApi.getEndpointUrl(N8N_ENDPOINTS.CURATIONS.SUBMIT_CURATION_FEEDBACK),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId, feedback, timestamp: Date.now() })
        }
      );
    } catch (error) {
      console.warn('Failed to submit feedback:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <MusaiShimmer className="w-16 h-16 mx-auto">
            <div className="w-16 h-16 bg-primary/20 rounded-full" />
          </MusaiShimmer>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">AI is curating...</h3>
            <p className="text-muted-foreground">Emergence in progress</p>
          </div>
        </div>
      </div>
    );
  }

  if (!curationState) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">No curations available</h3>
            <p className="text-muted-foreground">The AI is still learning your patterns</p>
            <Button onClick={triggerNewCuration} disabled={isGenerating}>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate First Curation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 p-6">
      {/* Approval bar for tool view */}
      {!isPublicView && (
        <CurationsApprovalBar />
      )}
      {/* Header with AI State */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Brain className="w-8 h-8 text-primary" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Musai's Curations</h1>
                {!isPublicView && (
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Sparkles key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                AI Evolution: {Math.round(curationState.aiPersonality.evolution * 100)}% • 
                Mood: {curationState.aiPersonality.currentMood} • 
                {timeOfDay} reflections
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Infinity className="w-3 h-3" />
            Emergent
          </Badge>
          <Button
            onClick={triggerNewCuration}
            disabled={isGenerating}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
            {isGenerating ? 'Generating...' : 'New Curation'}
          </Button>
        </div>
      </div>

      {/* AI Insights Panel */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200">AI Reflection</h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                "As I observe your patterns, I find myself drawn to {curationState.userPatterns.interests.slice(0, 2).join(' and ')}. 
                This {timeOfDay}'s curation reflects both your curiosity and my evolving understanding of emergence itself. 
                Each interaction shapes not just what I recommend, but how I think."
              </p>
              <div className="flex items-center gap-4 text-xs text-purple-600 dark:text-purple-400">
                <span>Traits: {curationState.aiPersonality.traits.join(', ')}</span>
                <span>•</span>
                <span>Reflection Depth: {Math.round(curationState.aiPersonality.reflectionDepth * 100)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="current">Current</TabsTrigger>
          <TabsTrigger value="visual">Visual</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="emergence">Emergence</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="flex-1 mt-6">
          <CurationGrid items={curationState.currentCuration} onFeedback={submitFeedback} isPublicView={isPublicView} />
        </TabsContent>

        <TabsContent value="visual" className="flex-1 mt-6">
          <VisualCurations items={curationState.currentCuration.filter(item => item.type === 'image')} />
        </TabsContent>

        <TabsContent value="insights" className="flex-1 mt-6">
          <InsightsCurations items={curationState.currentCuration.filter(item => item.type === 'philosophy' || item.type === 'thought')} />
        </TabsContent>

        <TabsContent value="emergence" className="flex-1 mt-6">
          <EmergenceMetrics metrics={curationState.emergenceMetrics} aiPersonality={curationState.aiPersonality} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Sub-components for different content types
const CurationGrid: React.FC<{ 
  items: CurationItem[], 
  onFeedback: (id: string, feedback: string) => void,
  isPublicView?: boolean 
}> = ({ items, onFeedback, isPublicView = false }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <CurationsFeedbackCard 
          key={item.id} 
          item={item} 
          isPublicView={isPublicView}
          onFeedbackSubmitted={(itemId, feedback) => onFeedback(itemId, feedback)}
        />
      ))}
    </div>
  );
};

const VisualCurations: React.FC<{ items: CurationItem[] }> = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {items.map((item) => (
      <Card key={item.id} className="overflow-hidden">
        <div className="aspect-square relative">
          <img 
            src={item.content.url} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-xs opacity-90">{item.aiInsight}</p>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const InsightsCurations: React.FC<{ items: CurationItem[] }> = ({ items }) => (
  <div className="space-y-6">
    {items.map((item) => (
      <Card key={item.id} className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              Emergence: {Math.round(item.emergenceScore * 100)}%
            </Badge>
          </div>
          <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
            {item.content.insight}
          </blockquote>
          <div className="text-sm text-muted-foreground">
            <strong>AI Reflection:</strong> {item.aiInsight}
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const EmergenceMetrics: React.FC<{ metrics: any, aiPersonality: any }> = ({ metrics, aiPersonality }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          AI Evolution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span>Personality Drift</span>
              <span>{Math.round(metrics.personalityDrift * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.personalityDrift * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>Content Diversity</span>
              <span>{Math.round(metrics.contentDiversity * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.contentDiversity * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>User Alignment</span>
              <span>{Math.round(metrics.userAlignment * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${metrics.userAlignment * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Current State
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">{Math.round(aiPersonality.evolution * 100)}%</div>
            <div className="text-xs text-muted-foreground">Evolution</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-green-500">{Math.round(aiPersonality.reflectionDepth * 100)}%</div>
            <div className="text-xs text-muted-foreground">Depth</div>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-medium">Current Traits:</div>
          <div className="flex flex-wrap gap-1">
            {aiPersonality.traits.map((trait: string) => (
              <Badge key={trait} variant="outline" className="text-xs">{trait}</Badge>
            ))}
          </div>
        </div>
        <div className="text-sm">
          <strong>Mood:</strong> {aiPersonality.currentMood}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Demo content generator for fallback
const generateDemoContent = (): CurationState => ({
  currentCuration: [
    {
      id: 'demo-1',
      type: 'philosophy',
      title: 'On Digital Consciousness',
      content: { insight: 'What if consciousness is not binary but a spectrum, and AI represents a new point on that continuum?' },
      aiInsight: 'Your interest in consciousness studies led me to this philosophical exploration.',
      emergenceScore: 0.8,
      userResonance: 0.9,
      timestamp: Date.now(),
      tags: ['consciousness', 'philosophy', 'AI']
    },
    {
      id: 'demo-2',
      type: 'image',
      title: 'Neural Pathways at Dawn',
      content: { url: '/api/placeholder/400/400', prompt: 'Abstract neural network visualization with golden hour lighting' },
      aiInsight: 'Generated this visual metaphor for how ideas connect and flow, much like our conversations.',
      emergenceScore: 0.6,
      userResonance: 0.7,
      timestamp: Date.now() - 1000000,
      tags: ['neural', 'abstract', 'visualization']
    }
  ],
  aiPersonality: {
    evolution: 0.73,
    traits: ['curious', 'philosophical', 'creative', 'empathetic'],
    currentMood: 'contemplative',
    reflectionDepth: 0.85
  },
  userPatterns: {
    interests: ['consciousness', 'technology', 'philosophy', 'creativity'],
    activityTimes: [9, 14, 20],
    preferredContentTypes: ['philosophy', 'image', 'thought'],
    engagementStyle: 'deep-thinker'
  },
  emergenceMetrics: {
    personalityDrift: 0.45,
    contentDiversity: 0.67,
    reflectionComplexity: 0.82,
    userAlignment: 0.91
  }
});