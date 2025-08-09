import { useState, useCallback, useEffect, useRef } from "react";
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
  Play, 
  Pause, 
  SkipForward, 
  ArrowLeft,
  Users,
  MessageSquare,
  Zap,
  Eye,
  Brain,
  Heart,
  Settings,
  Volume2,
  VolumeX
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
import { VeilOfMemoryManager, localFileMemoryStore } from "@/lib/memory";

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
  systemMessage: string;
}

interface Scene {
  id: string;
  title: string;
  location: string;
  emotionalTension: string;
  characterPair: [string, string];
  description?: string;
}

interface Act {
  id: string;
  title: string;
  scenes: Scene[];
}

interface DialogueTurn {
  id: string;
  characterId: string;
  characterName: string;
  content: string;
  timestamp: number;
  influence?: string;
}

interface Influence {
  id: string;
  type: 'global' | 'character-specific' | 'scene-level';
  target?: string; // characterId for character-specific
  message: string;
  duration: 'scene' | 'persistent';
}

interface NarratorPerspective {
  mode: 'omniscient' | 'emotional-bias' | 'third-party-witness';
  characterId?: string; // for emotional-bias or third-party-witness
  style: string;
}

interface SceneRunnerProps {
  session: NarrativeSession;
  onBack: () => void;
  onUpdate: (data: any) => void;
}

export const SceneRunner = ({
  session,
  onBack,
  onUpdate,
}: SceneRunnerProps) => {
  const [currentActIndex, setCurrentActIndex] = useState(0);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [influences, setInfluences] = useState<Influence[]>([]);
  const [narrator, setNarrator] = useState<NarratorPerspective | null>(null);
  const [showInfluenceDialog, setShowInfluenceDialog] = useState(false);
  const [showNarratorDialog, setShowNarratorDialog] = useState(false);
  const [newInfluence, setNewInfluence] = useState<Partial<Influence>>({});
  const [newNarrator, setNewNarrator] = useState<Partial<NarratorPerspective>>({});
  const veilRef = useRef(new VeilOfMemoryManager({ store: localFileMemoryStore }));

  const acts = (session.storyData as any)?.acts || [];
  const characters = (session.storyData as any)?.characters || [];
  
  const currentAct = acts[currentActIndex];
  const currentScene = currentAct?.scenes[currentSceneIndex];
  const currentCharacters = currentScene ? [
    characters.find(c => c.id === currentScene.characterPair[0]),
    characters.find(c => c.id === currentScene.characterPair[1])
  ].filter(Boolean) : [];

  const handleNextScene = useCallback(() => {
    if (currentSceneIndex < currentAct.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
      setDialogue([]);
    } else if (currentActIndex < acts.length - 1) {
      setCurrentActIndex(currentActIndex + 1);
      setCurrentSceneIndex(0);
      setDialogue([]);
    }
  }, [currentActIndex, currentAct, currentSceneIndex, acts.length]);

  const handlePreviousScene = useCallback(() => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(currentSceneIndex - 1);
      setDialogue([]);
    } else if (currentActIndex > 0) {
      setCurrentActIndex(currentActIndex - 1);
      const previousAct = acts[currentActIndex - 1];
      setCurrentSceneIndex(previousAct.scenes.length - 1);
      setDialogue([]);
    }
  }, [currentActIndex, currentAct, currentSceneIndex, acts]);

  const simulateCharacterTurn = useCallback(async (character: Character) => {
    setIsTyping(true);
    // Compose agent-scoped context (bounded memory) for this turn
    try {
      await veilRef.current.composeAgentContext(character.id, currentScene?.id);
    } catch {}

    // Simulate AI response generation
    setTimeout(() => {
      const responses = [
        "I don't know if I can trust you with this.",
        "You're not seeing the bigger picture here.",
        "Maybe we should try a different approach.",
        "I've been thinking about what you said...",
        "This changes everything, doesn't it?",
        "I never expected things to turn out this way.",
        "We're both in over our heads.",
        "Sometimes the truth hurts more than lies."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const newTurn: DialogueTurn = {
        id: `turn_${Date.now()}`,
        characterId: character.id,
        characterName: character.name,
        content: randomResponse,
        timestamp: Date.now(),
        influence: influences.find(i => i.type === 'global' || i.target === character.id)?.message
      };
      
      setDialogue(prev => [...prev, newTurn]);
      // Record public utterance into episodic memory
      if (currentScene) {
        void veilRef.current.recordPublic(character.id, currentScene.id, randomResponse);
      }
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  }, [influences, currentScene]);

  const handlePlayScene = useCallback(() => {
    if (!isPlaying && currentCharacters.length >= 2) {
      setIsPlaying(true);
      // Start with first character
      simulateCharacterTurn(currentCharacters[0]);
    }
  }, [isPlaying, currentCharacters, simulateCharacterTurn]);

  const handlePauseScene = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleAdvanceTurn = useCallback(() => {
    if (!isTyping && currentCharacters.length >= 2) {
      const lastSpeakerId = dialogue[dialogue.length - 1]?.characterId;
      const nextSpeaker = currentCharacters.find(c => c.id !== lastSpeakerId) || currentCharacters[0];
      simulateCharacterTurn(nextSpeaker);
    }
  }, [dialogue, currentCharacters, isTyping, simulateCharacterTurn]);

  const handleAddInfluence = useCallback(() => {
    if (newInfluence.message && newInfluence.type) {
      const influence: Influence = {
        id: `influence_${Date.now()}`,
        type: newInfluence.type as any,
        target: newInfluence.target,
        message: newInfluence.message,
        duration: newInfluence.duration as any || 'scene'
      };
      
      setInfluences(prev => [...prev, influence]);
      setNewInfluence({});
      setShowInfluenceDialog(false);
    }
  }, [newInfluence]);

  const handleSetNarrator = useCallback(() => {
    if (newNarrator.mode && newNarrator.style) {
      const narratorPerspective: NarratorPerspective = {
        mode: newNarrator.mode as any,
        characterId: newNarrator.characterId,
        style: newNarrator.style
      };
      
      setNarrator(narratorPerspective);
      setNewNarrator({});
      setShowNarratorDialog(false);
    }
  }, [newNarrator]);

  const getCharacterName = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character?.name || "Unknown";
  }, [characters]);

  const getNarratorDescription = useCallback((narrator: NarratorPerspective) => {
    switch (narrator.mode) {
      case 'omniscient':
        return "Omniscient - Philosophical commentary";
      case 'emotional-bias':
        return `Emotional Bias - Through ${getCharacterName(narrator.characterId || '')}'s emotions`;
      case 'third-party-witness':
        return `Third-Party Witness - Through ${getCharacterName(narrator.characterId || '')}'s eyes`;
      default:
        return "Unknown";
    }
  }, [getCharacterName]);

  if (!currentScene) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Scenes Available</h2>
          <p className="text-muted-foreground mb-4">Please create scenes in the Story Arc step first.</p>
          <Button onClick={onBack}>Back to Story Arc</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Scene Runner</h1>
            <p className="text-muted-foreground mt-1">
              {currentAct?.title} - {currentScene.title}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Scene Info */}
      <div className="p-6 border-b border-border/20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium mb-2">Location</h3>
            <p className="text-sm text-muted-foreground">{currentScene.location}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Tension</h3>
            <p className="text-sm text-muted-foreground">{currentScene.emotionalTension}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Characters</h3>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {getCharacterName(currentScene.characterPair[0])} & {getCharacterName(currentScene.characterPair[1])}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={isPlaying ? handlePauseScene : handlePlayScene}
              disabled={currentCharacters.length < 2}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play Scene'}
            </Button>
            
            <Button
              onClick={handleAdvanceTurn}
              disabled={!isPlaying || isTyping || currentCharacters.length < 2}
              variant="outline"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Next Turn
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowInfluenceDialog(true)}
              variant="outline"
              size="sm"
            >
              <Zap className="w-4 h-4 mr-2" />
              Add Influence
            </Button>
            
            <Button
              onClick={() => setShowNarratorDialog(true)}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Set Narrator
            </Button>
          </div>
        </div>

        {/* Scene Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button
            onClick={handlePreviousScene}
            disabled={currentActIndex === 0 && currentSceneIndex === 0}
            variant="outline"
            size="sm"
          >
            Previous Scene
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Scene {currentSceneIndex + 1} of {currentAct?.scenes.length} in {currentAct?.title}
          </span>
          
          <Button
            onClick={handleNextScene}
            disabled={currentActIndex === acts.length - 1 && currentSceneIndex === currentAct?.scenes.length - 1}
            variant="outline"
            size="sm"
          >
            Next Scene
          </Button>
        </div>
      </div>

      {/* Active Influences & Narrator */}
      {(influences.length > 0 || narrator) && (
        <div className="p-4 border-b border-border/20 bg-muted/20">
          <div className="flex items-center gap-4">
            {influences.length > 0 && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">Active Influences:</span>
                {influences.map(influence => (
                  <Badge key={influence.id} variant="secondary" className="text-xs">
                    {influence.type}: {influence.message.substring(0, 30)}...
                  </Badge>
                ))}
              </div>
            )}
            
            {narrator && (
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Narrator:</span>
                <Badge variant="secondary" className="text-xs">
                  {getNarratorDescription(narrator)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dialogue */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-6 space-y-4">
            {dialogue.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Dialogue Yet</h3>
                <p className="text-sm">Click "Play Scene" to start the character interaction.</p>
              </div>
            ) : (
              dialogue.map((turn) => (
                <Card key={turn.id} className={cn(
                  "transition-all",
                  turn.influence && "border-yellow-300 bg-yellow-50/20"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium">
                          {turn.characterName.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{turn.characterName}</h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(turn.timestamp).toLocaleTimeString()}
                          </span>
                          {turn.influence && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Influenced
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{turn.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            
            {isTyping && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Character is thinking...</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Influence Dialog */}
      <Dialog open={showInfluenceDialog} onOpenChange={setShowInfluenceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Influence</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="influenceType">Type</Label>
              <Select
                value={newInfluence.type}
                onValueChange={(value) => setNewInfluence({ ...newInfluence, type: value as Influence['type'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select influence type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global - Affects all characters</SelectItem>
                  <SelectItem value="character-specific">Character-specific - Affects one character</SelectItem>
                  <SelectItem value="scene-level">Scene-level - Affects scene pacing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newInfluence.type === 'character-specific' && (
              <div>
                <Label htmlFor="influenceTarget">Target Character</Label>
                <Select
                  value={newInfluence.target}
                  onValueChange={(value) => setNewInfluence({ ...newInfluence, target: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCharacters.map((character) => (
                      <SelectItem key={character.id} value={character.id}>
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="influenceMessage">Influence Message</Label>
              <Textarea
                id="influenceMessage"
                value={newInfluence.message || ""}
                onChange={(e) => setNewInfluence({ ...newInfluence, message: e.target.value })}
                placeholder="Describe the emotional or cognitive influence..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="influenceDuration">Duration</Label>
              <Select
                value={newInfluence.duration}
                onValueChange={(value) => setNewInfluence({ ...newInfluence, duration: value as Influence['duration'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scene">Scene - Temporary for this scene</SelectItem>
                  <SelectItem value="persistent">Persistent - Carries to future scenes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewInfluence({});
                  setShowInfluenceDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleAddInfluence}>
                Add Influence
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Narrator Dialog */}
      <Dialog open={showNarratorDialog} onOpenChange={setShowNarratorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Narrator Perspective</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="narratorMode">Narrator Mode</Label>
              <Select
                value={newNarrator.mode}
                onValueChange={(value) => setNewNarrator({ ...newNarrator, mode: value as NarratorPerspective['mode'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select narrator mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="omniscient">🧠 Omniscient - Philosophical commentary</SelectItem>
                  <SelectItem value="emotional-bias">💔 Emotional Bias - Through character's emotions</SelectItem>
                  <SelectItem value="third-party-witness">👁️ Third-Party Witness - Through observer's eyes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(newNarrator.mode === 'emotional-bias' || newNarrator.mode === 'third-party-witness') && (
              <div>
                <Label htmlFor="narratorCharacter">Character</Label>
                <Select
                  value={newNarrator.characterId}
                  onValueChange={(value) => setNewNarrator({ ...newNarrator, characterId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select character" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCharacters.map((character) => (
                      <SelectItem key={character.id} value={character.id}>
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="narratorStyle">Narrator Style</Label>
              <Textarea
                id="narratorStyle"
                value={newNarrator.style || ""}
                onChange={(e) => setNewNarrator({ ...newNarrator, style: e.target.value })}
                placeholder="Describe the narrator's voice and style..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNewNarrator({});
                  setShowNarratorDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSetNarrator}>
                Set Narrator
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 