import { useState, useCallback, useRef } from "react";
import { NarrativeSession } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  X, 
  User, 
  Heart, 
  Brain, 
  Zap, 
  MessageSquare,
  Edit3,
  Trash2,
  Save,
  ArrowLeft,
  ArrowRight
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { prepareFileData } from "@/utils/fileOperations";
import { narrativeApi } from "@/lib/narrativeApi";

interface Character {
  id: string;
  name: string;
  avatar?: string;
  personality: {
    courage: number;
    empathy: number;
    logic: number;
    impulsiveness: number;
  };
  speechStyle: string;
  coreBeliefs: string;
  systemMessage: string;
  description?: string;
}

interface CharacterCreationPanelProps {
  session: NarrativeSession;
  onNext: () => void;
  onBack: () => void;
  onUpdate: (data: any) => void;
}

const SPEECH_STYLES = [
  "Poetic and flowing",
  "Blunt and direct", 
  "Fragmented and nervous",
  "Formal and precise",
  "Casual and friendly",
  "Mysterious and cryptic",
  "Passionate and intense",
  "Calm and measured"
];

export const CharacterCreationPanel = ({
  session,
  onNext,
  onBack,
  onUpdate,
}: CharacterCreationPanelProps) => {
  const [characters, setCharacters] = useState<Character[]>(
    (session.storyData as any)?.characters || []
  );
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddCharacter = useCallback(() => {
    const newCharacter: Character = {
      id: `char_${Date.now()}`,
      name: "",
      personality: {
        courage: 50,
        empathy: 50,
        logic: 50,
        impulsiveness: 50,
      },
      speechStyle: SPEECH_STYLES[0],
      coreBeliefs: "",
      systemMessage: "",
    };
    setEditingCharacter(newCharacter);
    setIsDialogOpen(true);
  }, []);

  const handleSaveCharacter = useCallback((character: Character) => {
    if (character.name.trim()) {
      const updatedCharacters = editingCharacter?.id 
        ? characters.map(c => c.id === editingCharacter.id ? character : c)
        : [...characters, character];
      
      setCharacters(updatedCharacters);
      onUpdate({ characters: updatedCharacters });
      setEditingCharacter(null);
      setIsDialogOpen(false);
    }
  }, [characters, editingCharacter, onUpdate]);

  const handleDeleteCharacter = useCallback((characterId: string) => {
    const updatedCharacters = characters.filter(c => c.id !== characterId);
    setCharacters(updatedCharacters);
    onUpdate({ characters: updatedCharacters });
  }, [characters, onUpdate]);

  const handleEditCharacter = useCallback((character: Character) => {
    setEditingCharacter(character);
    setIsDialogOpen(true);
  }, []);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!editingCharacter) return;
    const payload = await prepareFileData(file);
    if (!payload) return;
    // store as data URL for immediate render
    const dataUrl = `data:${payload.mimeType};base64,${payload.data}`;
    setEditingCharacter({ ...editingCharacter, avatar: dataUrl });
  }, [editingCharacter]);

  const handleNext = useCallback(() => {
    onNext();
  }, [onNext]);

  const hasFetchedRef = useRef(false);

  // Fetch suggested characters from framework on first advance into this panel
  const fetchSuggestedCharacters = useCallback(async () => {
    if (hasFetchedRef.current) return;
    try {
      const story: any = session.storyData || {};
      if (!story?.concept?.title || !story?.concept?.description || !Array.isArray(story?.acts)) return;
      const res = await narrativeApi.suggestCharacters({
        title: story.concept.title,
        description: story.concept.description,
        acts: (story.acts || []).map((a: any) => ({ id: a.id, title: a.title, description: a.description, progression: a.progression || [] })),
      });
      if (Array.isArray(res.characters) && res.characters.length > 0) {
        setCharacters(res.characters as any);
        onUpdate({ characters: res.characters });
      }
    } catch (e) {
      console.warn('Failed to fetch suggested characters', e);
    } finally {
      hasFetchedRef.current = true;
    }
  }, [session.storyData, onUpdate]);

  // Kick off suggestions when the panel mounts and there are no characters yet
  useState(() => {
    // Only auto-fetch when concept+acts exist (ensures correct flow: concept → characters)
    const story: any = session.storyData || {};
    const hasFramework = Array.isArray(story.acts) && story.acts.length > 0 && story.concept?.title;
    if (hasFramework && characters.length === 0) {
      void fetchSuggestedCharacters();
    }
  });

  const generateSystemMessage = useCallback((character: Character) => {
    const traits = [];
    if (character.personality.courage > 70) traits.push("bold and courageous");
    if (character.personality.empathy > 70) traits.push("deeply empathetic");
    if (character.personality.logic > 70) traits.push("highly analytical");
    if (character.personality.impulsiveness > 70) traits.push("impulsive and reactive");
    
    if (character.personality.courage < 30) traits.push("cautious and careful");
    if (character.personality.empathy < 30) traits.push("emotionally distant");
    if (character.personality.logic < 30) traits.push("intuitive rather than logical");
    if (character.personality.impulsiveness < 30) traits.push("deliberate and thoughtful");

    return `You are ${character.name}, a character who is ${traits.join(", ")}. You speak in a ${character.speechStyle.toLowerCase()} manner. Your core belief is: "${character.coreBeliefs}". Always stay true to your personality and speak naturally in character.`;
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create Characters</h1>
            <p className="text-muted-foreground mt-1">
              Define your cast of characters. Each character will drive the narrative through their unique personality and interactions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={characters.length < 2}>
              <ArrowRight className="w-4 h-4 mr-2" />
              Next: Story Arc
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Character List */}
          <div className="w-1/2 p-6 border-r border-border/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Characters ({characters.length})</h2>
              <Button onClick={handleAddCharacter} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Character
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100%-4rem)]">
              <div className="space-y-3">
                {characters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No characters created yet</p>
                    <p className="text-xs mt-1">Add at least 2 characters to continue</p>
                  </div>
                ) : (
                  characters.map((character) => (
                    <Card key={character.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-medium">{character.name}</h3>
                              <Badge variant="secondary" className="text-xs">
                                {character.speechStyle.split(' ')[0]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {character.coreBeliefs}
                            </p>
                            <div className="flex gap-1 mt-2">
                              <Badge variant="outline" className="text-xs">
                                Courage: {character.personality.courage}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Empathy: {character.personality.empathy}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Logic: {character.personality.logic}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCharacter(character)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCharacter(character.id)}
                              className="h-6 w-6 p-0 text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Character Editor */}
          <div className="w-1/2 p-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingCharacter?.id ? 'Edit Character' : 'Create Character'}
                  </DialogTitle>
                </DialogHeader>
                
                {editingCharacter && (
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          {editingCharacter.avatar ? (
                            <AvatarImage src={editingCharacter.avatar} alt={editingCharacter.name} />
                          ) : (
                            <AvatarFallback>{(editingCharacter.name || '?').slice(0,1).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <label className="text-xs">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                          />
                        </label>
                      </div>
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={editingCharacter.name}
                          onChange={(e) => setEditingCharacter({
                            ...editingCharacter,
                            name: e.target.value
                          })}
                          placeholder="Enter character name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          value={editingCharacter.description || ""}
                          onChange={(e) => setEditingCharacter({
                            ...editingCharacter,
                            description: e.target.value
                          })}
                          placeholder="Brief physical description or background"
                          rows={3}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Personality Traits */}
                    <div className="space-y-4">
                      <h3 className="font-medium">Personality Traits</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2">
                              <Heart className="w-4 h-4" />
                              Courage
                            </Label>
                            <span className="text-sm text-muted-foreground">
                              {editingCharacter.personality.courage}
                            </span>
                          </div>
                          <Slider
                            value={[editingCharacter.personality.courage]}
                            onValueChange={([value]) => setEditingCharacter({
                              ...editingCharacter,
                              personality: {
                                ...editingCharacter.personality,
                                courage: value
                              }
                            })}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2">
                              <Heart className="w-4 h-4" />
                              Empathy
                            </Label>
                            <span className="text-sm text-muted-foreground">
                              {editingCharacter.personality.empathy}
                            </span>
                          </div>
                          <Slider
                            value={[editingCharacter.personality.empathy]}
                            onValueChange={([value]) => setEditingCharacter({
                              ...editingCharacter,
                              personality: {
                                ...editingCharacter.personality,
                                empathy: value
                              }
                            })}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2">
                              <Brain className="w-4 h-4" />
                              Logic
                            </Label>
                            <span className="text-sm text-muted-foreground">
                              {editingCharacter.personality.logic}
                            </span>
                          </div>
                          <Slider
                            value={[editingCharacter.personality.logic]}
                            onValueChange={([value]) => setEditingCharacter({
                              ...editingCharacter,
                              personality: {
                                ...editingCharacter.personality,
                                logic: value
                              }
                            })}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Impulsiveness
                            </Label>
                            <span className="text-sm text-muted-foreground">
                              {editingCharacter.personality.impulsiveness}
                            </span>
                          </div>
                          <Slider
                            value={[editingCharacter.personality.impulsiveness]}
                            onValueChange={([value]) => setEditingCharacter({
                              ...editingCharacter,
                              personality: {
                                ...editingCharacter.personality,
                                impulsiveness: value
                              }
                            })}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Speech Style */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="speechStyle">Speech Style</Label>
                        <Select
                          value={editingCharacter.speechStyle}
                          onValueChange={(value) => setEditingCharacter({
                            ...editingCharacter,
                            speechStyle: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SPEECH_STYLES.map((style) => (
                              <SelectItem key={style} value={style}>
                                {style}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="coreBeliefs">Core Beliefs</Label>
                        <Textarea
                          id="coreBeliefs"
                          value={editingCharacter.coreBeliefs}
                          onChange={(e) => setEditingCharacter({
                            ...editingCharacter,
                            coreBeliefs: e.target.value
                          })}
                          placeholder="What does this character fundamentally believe? (e.g., 'distrusts authority', 'values family above all')"
                          rows={3}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* System Message Preview */}
                    <div className="space-y-4">
                      <h3 className="font-medium">System Message Preview</h3>
                      <div className="p-3 bg-muted rounded-md text-sm">
                        {generateSystemMessage(editingCharacter)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingCharacter(null);
                          setIsDialogOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => handleSaveCharacter(editingCharacter)}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Character
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <div className="text-center py-8 text-muted-foreground">
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Character Editor</h3>
              <p className="text-sm">
                Click "Add Character" to create your first character, or select an existing character to edit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 