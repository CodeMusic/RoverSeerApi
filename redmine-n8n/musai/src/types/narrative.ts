export interface NarrativeConcept {
  title: string;
  description: string;
  emotionalTone: 'neutral' | 'melancholic' | 'intellectual' | 'intense';
  genre: 'drama' | 'mystery' | 'sci-fi' | 'fantasy' | 'psychological' | 'philosophical';
}

export interface PersonalityTraits {
  courage: number;
  empathy: number;
  logic: number;
  impulsiveness: number;
}

export interface NarrativeCharacter {
  id: string;
  name: string;
  avatar?: string; // data URL
  description?: string;
  personality: PersonalityTraits;
  speechStyle: string;
  coreBeliefs: string;
  systemMessage: string;
}

export interface Scene {
  id: string;
  title: string;
  location: string;
  emotionalTension: string;
  characterPair: [string, string];
  description?: string;
  turns?: number;
}

export interface Act {
  id: string;
  title: string;
  scenes: Scene[];
}

export interface DialogueTurn {
  id: string;
  characterId: string;
  characterName: string;
  content: string;
  timestamp: number;
  influence?: string;
}

export interface Influence {
  id: string;
  type: 'global' | 'character-specific' | 'scene-level';
  target?: string;
  message: string;
  duration: 'scene' | 'persistent' | 'turns';
  turns?: number;
}

export interface NarratorPerspective {
  mode: 'omniscient' | 'emotional-bias' | 'third-party-witness';
  characterId?: string;
  style: string;
}

export interface NarrativeStoryData {
  concept: NarrativeConcept | null;
  coverImage?: string; // data URL
  characters: NarrativeCharacter[];
  acts: Act[];
}


