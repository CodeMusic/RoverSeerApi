# 🎭 MusaiTale - Emergent Narrative Feature

## Overview

MusaiTale allows users to create character-driven stories that unfold organically through AI-powered character interactions. Where your thoughts become stories. Your emergent narrative engine—shaped by your interactions, perspectives, and decisions. Stories unfold not from a script, but from you.

Each engagement steers the plot. Each insight rewrites the arc. What begins as fiction evolves into reflection.

This isn't just storytelling. It's story becoming.

## Architecture

### Core Components

1. **NarrativeLayout** (`src/components/narrative/NarrativeLayout.tsx`)
   - Main layout component that orchestrates the narrative flow
   - Handles step navigation between concept → characters → arc → scenes

2. **ConceptSeedingPanel** (`src/components/narrative/ConceptSeedingPanel.tsx`)
   - First step: Define the initial theme or concept
   - Provides suggested concepts and emotional tone selection

3. **CharacterCreationPanel** (`src/components/narrative/CharacterCreationPanel.tsx`)
   - Second step: Create characters with personality traits
   - Features personality sliders (courage, empathy, logic, impulsiveness)
   - Speech style selection and core beliefs definition

4. **ArcGenerationPanel** (`src/components/narrative/ArcGenerationPanel.tsx`)
   - Third step: Auto-generate story structure based on characters
   - Creates 3-5 act structure with scenes and character pairings
   - Allows editing of acts and scenes

5. **SceneRunner** (`src/components/narrative/SceneRunner.tsx`)
   - Fourth step: Run scenes with turn-based character interactions
   - Features influence injection and narrator perspective controls
   - Real-time dialogue generation

6. **NarrativeSidebar** (`src/components/narrative/NarrativeSidebar.tsx`)
   - Session management for narratives
   - Step navigation and session organization

### Data Flow

```
Concept → Characters → Story Arc → Scene Execution
   ↓         ↓           ↓              ↓
Theme    Personality   Structure    Dialogue
Input    Traits       Generation   Generation
```

## Key Features

### Character-First Design
- Characters are created with detailed personality profiles
- Each character has unique speech styles and core beliefs
- Characters drive the narrative through their interactions

### Emotional Influence System
- **Global Influences**: Affect all characters in a scene
- **Character-Specific**: Target individual characters
- **Scene-Level**: Control pacing and direction
- **Duration**: Scene (temporary) or Persistent (carries forward)

### Narrator Perspective Control
- **🧠 Omniscient**: Philosophical commentary and foreshadowing
- **💔 Emotional Bias**: Filter through character's emotions
- **👁️ Third-Party Witness**: Observer's perspective for dramatic irony

### Memory System
- Characters only remember scenes they participated in
- Memory affects future interactions and dialogue
- Realistic character consistency across scenes

## Usage Flow

1. **Start with Concept**
   - Enter a theme, question, or poetic prompt
   - Select emotional tone and genre
   - Choose from suggested concepts or create custom

2. **Create Characters**
   - Define at least 2 characters
   - Set personality traits using sliders
   - Choose speech style and core beliefs
   - Preview generated system message

3. **Generate Story Arc**
   - System auto-generates 3-5 act structure
   - Based on character dynamics and concept
   - Edit acts, scenes, and character pairings

4. **Run Scenes**
   - Turn-based character interactions
   - Inject influences during scenes
   - Set narrator perspective
   - Navigate between scenes and acts

## Technical Implementation

### State Management
- Uses `useNarrativeSessions` hook for session management
- LocalStorage persistence for narrative data
- Real-time updates during scene execution

### Integration
- Integrated into existing Musai navigation system
- Uses existing UI components and styling
- Follows established patterns from chat and search features

### Data Structure
```typescript
interface NarrativeSession {
  id: string;
  name: string;
  type: 'narrative';
  storyData: {
    concept: ConceptData;
    characters: Character[];
    acts: Act[];
  };
}
```

## Future Enhancements

1. **AI Integration**
   - Connect to n8n workflows for character generation
   - Real AI-powered dialogue generation
   - Dynamic story progression

2. **Advanced Features**
   - Character memory visualization
   - Multiple narrator voices
   - Scene branching and choices

3. **Collaboration**
   - Multi-user narrative creation
   - Shared character libraries
   - Collaborative scene editing

## File Structure

```
src/components/narrative/
├── NarrativeLayout.tsx      # Main layout
├── NarrativeSidebar.tsx     # Session management
├── ConceptSeedingPanel.tsx  # Concept creation
├── CharacterCreationPanel.tsx # Character creation
├── ArcGenerationPanel.tsx   # Story arc generation
├── SceneRunner.tsx          # Scene execution
└── index.ts                 # Exports

src/hooks/
└── useNarrativeSessions.ts  # Session management hook
```

## Getting Started

1. Navigate to the MusaiTale tab in Musai
2. Click "Begin Emergence" to start
3. Follow the 4-step process: Concept → Characters → Arc → Scenes
4. Use the influence and narrator controls during scene execution
5. Watch how your interactions shape the emerging narrative
6. Experience how each decision influences the story's direction

The feature is designed to be intuitive and follows the established Musai patterns while introducing innovative emergent narrative creation capabilities where stories become through your engagement. 