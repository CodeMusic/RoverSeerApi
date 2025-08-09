import { useState, useCallback, useEffect } from "react";
import { NarrativeSession } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  X, 
  Map, 
  Play, 
  Users, 
  Edit3,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  GripVertical
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Character {
  id: string;
  name: string;
  personality: {
    courage: number;
    empathy: number;
    logic: number;
    impulsiveness: number;
  };
  speechStyle: string;
  coreBeliefs: string;
}

interface Scene {
  id: string;
  title: string;
  location: string;
  emotionalTension: string;
  characterPair: [string, string];
  description?: string;
  turns?: number;
}

interface Act {
  id: string;
  title: string;
  scenes: Scene[];
}

interface ArcGenerationPanelProps {
  session: NarrativeSession;
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: any) => void;
}

export const ArcGenerationPanel = ({
  session,
  onNext,
  onBack,
  onUpdate,
}: ArcGenerationPanelProps) => {
  const [acts, setActs] = useState<Act[]>(
    (session.storyData as any)?.acts || []
  );
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const characters = (session.storyData as any)?.characters || [];

  const generateArc = useCallback(async () => {
    if (characters.length < 2) return;
    
    setIsGenerating(true);
    
    // Simulate API call to generate arc
    setTimeout(() => {
      const generatedActs: Act[] = [
        {
          id: `act_${Date.now()}_1`,
          title: "Act I: The Setup",
          scenes: [
            {
              id: `scene_${Date.now()}_1`,
              title: "First Meeting",
              location: "A crowded coffee shop",
              emotionalTension: "Two characters with opposing worldviews must work together",
              characterPair: [characters[0].id, characters[1].id],
              description: "The initial encounter that sets up the central conflict",
              turns: 8,
            }
          ]
        },
        {
          id: `act_${Date.now()}_2`,
          title: "Act II: The Conflict",
          scenes: [
            {
              id: `scene_${Date.now()}_2`,
              title: "The Confrontation",
              location: "A dimly lit alley",
              emotionalTension: "Secrets are revealed, trust is broken",
              characterPair: [characters[0].id, characters[1].id],
              description: "The moment where everything changes",
              turns: 10,
            },
            {
              id: `scene_${Date.now()}_3`,
              title: "The Choice",
              location: "A crossroads",
              emotionalTension: "Each character must decide what they truly value",
              characterPair: [characters[0].id, characters[1].id],
              description: "The pivotal decision that drives the story forward",
              turns: 10,
            }
          ]
        },
        {
          id: `act_${Date.now()}_3`,
          title: "Act III: The Resolution",
          scenes: [
            {
              id: `scene_${Date.now()}_4`,
              title: "The Truth",
              location: "A quiet park bench",
              emotionalTension: "Understanding and acceptance emerge from chaos",
              characterPair: [characters[0].id, characters[1].id],
              description: "The final scene where characters find common ground",
              turns: 8,
            }
          ]
        }
      ];
      
      setActs(generatedActs);
      onUpdate({ acts: generatedActs });
      setIsGenerating(false);
    }, 2000);
  }, [characters, onUpdate]);

  const handleAddScene = useCallback((actId: string) => {
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      title: "New Scene",
      location: "Location",
      emotionalTension: "Emotional tension",
      characterPair: [characters[0]?.id || "", characters[1]?.id || ""],
    };
    
    const updatedActs = acts.map(act => 
      act.id === actId 
        ? { ...act, scenes: [...act.scenes, newScene] }
        : act
    );
    
    setActs(updatedActs);
    onUpdate({ acts: updatedActs });
  }, [acts, characters, onUpdate]);

  const handleEditScene = useCallback((scene: Scene) => {
    setEditingScene(scene);
    setIsDialogOpen(true);
  }, []);

  const handleSaveScene = useCallback((updatedScene: Scene) => {
    const updatedActs = acts.map(act => ({
      ...act,
      scenes: act.scenes.map(scene => 
        scene.id === updatedScene.id ? updatedScene : scene
      )
    }));
    
    setActs(updatedActs);
    onUpdate({ acts: updatedActs });
    setEditingScene(null);
    setIsDialogOpen(false);
  }, [acts, onUpdate]);

  const handleDeleteScene = useCallback((actId: string, sceneId: string) => {
    const updatedActs = acts.map(act => 
      act.id === actId 
        ? { ...act, scenes: act.scenes.filter(scene => scene.id !== sceneId) }
        : act
    );
    
    setActs(updatedActs);
    onUpdate({ acts: updatedActs });
  }, [acts, onUpdate]);

  const getCharacterName = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character?.name || "Unknown";
  }, [characters]);

  useEffect(() => {
    if (acts.length === 0 && characters.length >= 2) {
      generateArc();
    }
  }, [acts.length, characters.length, generateArc]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Story Arc Generation</h1>
            <p className="text-muted-foreground mt-1">
              The system has generated a story structure based on your characters. Review and edit the acts and scenes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={onNext} disabled={acts.length === 0}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Next: Scenes
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-6">
            {isGenerating ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Generating Story Arc</h3>
                <p className="text-muted-foreground">Analyzing character dynamics and creating story structure...</p>
              </div>
            ) : acts.length === 0 ? (
              <div className="text-center py-12">
                <Map className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Story Arc Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Need at least 2 characters to generate a story arc.
                </p>
                <Button onClick={generateArc} disabled={characters.length < 2}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Arc
                </Button>
              </div>
            ) : (
              acts.map((act, actIndex) => (
                <Card key={act.id} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      {act.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {act.scenes.map((scene, sceneIndex) => (
                        <div
                          key={scene.id}
                          className="group p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{scene.title}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  Scene {sceneIndex + 1}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>Location:</strong> {scene.location}
                              </p>
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>Tension:</strong> {scene.emotionalTension}
                              </p>
                              <div className="flex items-center gap-2">
                                <Users className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {getCharacterName(scene.characterPair[0])} & {getCharacterName(scene.characterPair[1])}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditScene(scene)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteScene(act.id, scene.id)}
                                className="h-6 w-6 p-0 text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddScene(act.id)}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Scene to {act.title}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Scene Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Scene</DialogTitle>
          </DialogHeader>
          
          {editingScene && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sceneTitle">Scene Title</Label>
                <Input
                  id="sceneTitle"
                  value={editingScene.title}
                  onChange={(e) => setEditingScene({
                    ...editingScene,
                    title: e.target.value
                  })}
                  placeholder="Enter scene title"
                />
              </div>
              
              <div>
                <Label htmlFor="sceneLocation">Location</Label>
                <Input
                  id="sceneLocation"
                  value={editingScene.location}
                  onChange={(e) => setEditingScene({
                    ...editingScene,
                    location: e.target.value
                  })}
                  placeholder="Where does this scene take place?"
                />
              </div>
              
              <div>
                <Label htmlFor="emotionalTension">Emotional Tension</Label>
                <Textarea
                  id="emotionalTension"
                  value={editingScene.emotionalTension}
                  onChange={(e) => setEditingScene({
                    ...editingScene,
                    emotionalTension: e.target.value
                  })}
                  placeholder="What emotional conflict or tension drives this scene?"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="characterPair">Character Pair</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={editingScene.characterPair[0]}
                    onValueChange={(value) => setEditingScene({
                      ...editingScene,
                      characterPair: [value, editingScene.characterPair[1]]
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select first character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((character) => (
                        <SelectItem key={character.id} value={character.id}>
                          {character.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={editingScene.characterPair[1]}
                    onValueChange={(value) => setEditingScene({
                      ...editingScene,
                      characterPair: [editingScene.characterPair[0], value]
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select second character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters.map((character) => (
                        <SelectItem key={character.id} value={character.id}>
                          {character.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="sceneDescription">Description (Optional)</Label>
                <Textarea
                  id="sceneDescription"
                  value={editingScene.description || ""}
                  onChange={(e) => setEditingScene({
                    ...editingScene,
                    description: e.target.value
                  })}
                  placeholder="Additional scene details or notes"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="sceneTurns">Turns (Optional)</Label>
                <Input
                  id="sceneTurns"
                  type="number"
                  value={editingScene.turns ?? 8}
                  onChange={(e) => setEditingScene({
                    ...editingScene,
                    turns: Math.max(1, parseInt(e.target.value || '1', 10))
                  })}
                  placeholder="Number of turns for this scene"
                />
              </div>
              
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingScene(null);
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleSaveScene(editingScene)}>
                  <Save className="w-4 h-4 mr-2" />
                  Save Scene
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}; 