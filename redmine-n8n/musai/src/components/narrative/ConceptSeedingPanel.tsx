import { useState, useCallback } from "react";
import { NarrativeSession } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight,
  Sparkles,
  Lightbulb,
  Heart,
  Brain,
  Zap,
  BookOpen
} from "lucide-react";

interface ConceptSeedingPanelProps {
  session: NarrativeSession;
  onNext: () => void;
  onUpdate: (data: any) => void;
}

const SUGGESTED_CONCEPTS = [
  {
    title: "What if trust was a virus?",
    description: "A world where trust spreads like a disease, affecting relationships and society",
    category: "Philosophical"
  },
  {
    title: "The last conversation on Earth",
    description: "Two people with opposing worldviews must find common ground before humanity ends",
    category: "Apocalyptic"
  },
  {
    title: "Memory as currency",
    description: "In a world where memories can be traded, what would you sacrifice to remember?",
    category: "Sci-Fi"
  },
  {
    title: "The art of forgetting",
    description: "A character who can erase memories must decide what's worth forgetting",
    category: "Psychological"
  },
  {
    title: "Truth in lies",
    description: "When deception reveals more truth than honesty, what defines reality?",
    category: "Mystery"
  },
  {
    title: "The weight of words",
    description: "In a world where words have physical weight, silence becomes a weapon",
    category: "Fantasy"
  }
];

export const ConceptSeedingPanel = ({
  session,
  onNext,
  onUpdate,
}: ConceptSeedingPanelProps) => {
  const [concept, setConcept] = useState({
    title: (session.storyData as any)?.concept?.title || "",
    description: (session.storyData as any)?.concept?.description || "",
    emotionalTone: (session.storyData as any)?.concept?.emotionalTone || "neutral",
    genre: (session.storyData as any)?.concept?.genre || "drama"
  });

  const handleConceptChange = useCallback((field: string, value: string) => {
    const updatedConcept = { ...concept, [field]: value };
    setConcept(updatedConcept);
    onUpdate({ concept: updatedConcept });
  }, [concept, onUpdate]);

  const handleSelectSuggested = useCallback((suggested: typeof SUGGESTED_CONCEPTS[0]) => {
    const updatedConcept = {
      title: suggested.title,
      description: suggested.description,
      emotionalTone: "neutral",
      genre: "drama"
    };
    setConcept(updatedConcept);
    onUpdate({ concept: updatedConcept });
  }, [onUpdate]);

  const handleNext = useCallback(() => {
    if (concept.title.trim() && concept.description.trim()) {
      onNext();
    }
  }, [concept, onNext]);

  const getEmotionalToneIcon = (tone: string) => {
    switch (tone) {
      case 'melancholic':
        return <Heart className="w-4 h-4" />;
      case 'intellectual':
        return <Brain className="w-4 h-4" />;
      case 'intense':
        return <Zap className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Concept Seeding</h1>
            <p className="text-muted-foreground mt-1">
              Start with a theme, question, or poetic prompt. This will guide the character creation and story generation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleNext} disabled={!concept.title.trim() || !concept.description.trim()}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Next: Characters
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Concept Editor */}
          <div className="w-1/2 p-6 border-r border-border/20">
            <div className="space-y-6">
              <div>
                <Label htmlFor="conceptTitle">Concept Title</Label>
                <Input
                  id="conceptTitle"
                  value={concept.title}
                  onChange={(e) => handleConceptChange('title', e.target.value)}
                  placeholder="Enter your concept or theme..."
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="conceptDescription">Description</Label>
                <Textarea
                  id="conceptDescription"
                  value={concept.description}
                  onChange={(e) => handleConceptChange('description', e.target.value)}
                  placeholder="Describe your concept in detail. What emotional or philosophical questions does it explore?"
                  rows={4}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emotionalTone">Emotional Tone</Label>
                  <select
                    id="emotionalTone"
                    value={concept.emotionalTone}
                    onChange={(e) => handleConceptChange('emotionalTone', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="melancholic">Melancholic</option>
                    <option value="intellectual">Intellectual</option>
                    <option value="intense">Intense</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="genre">Genre</Label>
                  <select
                    id="genre"
                    value={concept.genre}
                    onChange={(e) => handleConceptChange('genre', e.target.value)}
                    className="mt-2 w-full px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="drama">Drama</option>
                    <option value="mystery">Mystery</option>
                    <option value="sci-fi">Sci-Fi</option>
                    <option value="fantasy">Fantasy</option>
                    <option value="psychological">Psychological</option>
                    <option value="philosophical">Philosophical</option>
                  </select>
                </div>
              </div>

              {/* Concept Preview */}
              {concept.title && concept.description && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getEmotionalToneIcon(concept.emotionalTone)}
                      Concept Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">{concept.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{concept.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {concept.emotionalTone}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {concept.genre}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Suggested Concepts */}
          <div className="w-1/2 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <h2 className="text-lg font-semibold">Suggested Concepts</h2>
              </div>
              
              <div className="space-y-3">
                {SUGGESTED_CONCEPTS.map((suggested, index) => (
                  <Card 
                    key={index} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleSelectSuggested(suggested)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-sm">{suggested.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {suggested.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{suggested.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-sm">Tips for Great Concepts</h3>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Start with a "What if..." question</li>
                  <li>• Explore emotional or philosophical conflicts</li>
                  <li>• Consider how characters might react differently</li>
                  <li>• Think about the tension between opposing worldviews</li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-sm text-purple-800 dark:text-purple-200">Emergent Narrative</h3>
                </div>
                <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                  Your story doesn't follow a script—it <em>emerges</em> from interactions between characters and your choices. 
                  Each engagement steers the plot. Each insight rewrites the arc.
                </p>
                <div className="space-y-2">
                  <div className="text-xs">
                    <span className="font-medium text-purple-800 dark:text-purple-200">• Feedback Loops:</span>
                    <span className="text-purple-700 dark:text-purple-300 ml-1">Your influences shape character behavior, which affects story direction</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-purple-800 dark:text-purple-200">• Story Becoming:</span>
                    <span className="text-purple-700 dark:text-purple-300 ml-1">What begins as fiction evolves into reflection of your perspectives</span>
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-purple-800 dark:text-purple-200">• Dynamic Evolution:</span>
                    <span className="text-purple-700 dark:text-purple-300 ml-1">Stories unfold organically based on character interactions and your input</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 