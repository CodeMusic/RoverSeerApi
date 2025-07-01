"""
Character Library Management

Handles saving, loading, and managing reusable character templates.
"""

import json
import os
from typing import List, Dict, Optional, Any
from datetime import datetime
from .models.narrative_models import SavedCharacter, CharacterPersonality, PersonalityTraits, CharacterGroup


class CharacterLibrary:
    """Manages saved character templates and groups"""
    
    def __init__(self, storage_path: str = None):
        if storage_path is None:
            # Default to logs directory
            storage_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)), 
                'logs', 
                'character_library.json'
            )
        self.storage_path = storage_path
        self.characters: Dict[str, SavedCharacter] = {}
        self.groups: Dict[str, CharacterGroup] = {}
        self._load_characters()
    
    def _load_characters(self) -> None:
        """Load characters and groups from storage"""
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                    # Load characters
                    for char_data in data.get('characters', []):
                        character = SavedCharacter.from_dict(char_data)
                        self.characters[character.id] = character
                    
                    # Load groups
                    for group_data in data.get('groups', []):
                        group = CharacterGroup.from_dict(group_data)
                        self.groups[group.id] = group
                        
                print(f"✅ Loaded {len(self.characters)} saved characters and {len(self.groups)} groups")
            except Exception as e:
                print(f"⚠️ Error loading character library: {e}")
                self.characters = {}
                self.groups = {}
    
    def _save_characters(self) -> None:
        """Save characters and groups to storage"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
            
            data = {
                'characters': [char.to_dict() for char in self.characters.values()],
                'groups': [group.to_dict() for group in self.groups.values()],
                'last_updated': datetime.now().isoformat()
            }
            
            with open(self.storage_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Saved {len(self.characters)} characters and {len(self.groups)} groups to library")
        except Exception as e:
            print(f"❌ Error saving character library: {e}")
            raise
    
    def save_character(self, character: SavedCharacter) -> bool:
        """Save a character to the library"""
        try:
            character.updated_at = datetime.now()
            self.characters[character.id] = character
            self._save_characters()
            return True
        except Exception as e:
            print(f"❌ Error saving character {character.name}: {e}")
            return False
    
    def get_character(self, character_id: str) -> Optional[SavedCharacter]:
        """Get a character by ID"""
        return self.characters.get(character_id)
    
    def get_all_characters(self) -> List[SavedCharacter]:
        """Get all saved characters"""
        return list(self.characters.values())
    
    def search_characters(self, query: str = "", tags: List[str] = None) -> List[SavedCharacter]:
        """Search characters by name, description, or tags"""
        results = []
        query_lower = query.lower()
        
        for character in self.characters.values():
            # Check name and description
            if (query_lower in character.name.lower() or 
                query_lower in character.description.lower()):
                results.append(character)
                continue
            
            # Check tags
            if tags:
                if any(tag in character.tags for tag in tags):
                    results.append(character)
                    continue
        
        # Sort by updated date (most recent first)
        results.sort(key=lambda x: x.updated_at, reverse=True)
        return results
    
    def delete_character(self, character_id: str) -> bool:
        """Delete a character from the library"""
        if character_id in self.characters:
            del self.characters[character_id]
            self._save_characters()
            return True
        return False
    
    def update_character(self, character_id: str, updates: Dict[str, Any]) -> bool:
        """Update character fields"""
        if character_id not in self.characters:
            return False
        
        character = self.characters[character_id]
        
        # Update allowed fields
        if 'name' in updates:
            character.name = updates['name']
        if 'description' in updates:
            character.description = updates['description']
        if 'model' in updates:
            character.model = updates['model']
        if 'voice' in updates:
            character.voice = updates['voice']
        if 'system_message' in updates:
            character.system_message = updates['system_message']
        if 'personality_archetype' in updates:
            character.personality_archetype = CharacterPersonality(updates['personality_archetype'])
        if 'personality_traits' in updates:
            character.personality_traits = PersonalityTraits.from_dict(updates['personality_traits'])
        if 'image_path' in updates:
            character.image_path = updates['image_path']
        if 'tags' in updates:
            character.tags = updates['tags']
        if 'group_id' in updates:
            character.group_id = updates['group_id']
        
        character.updated_at = datetime.now()
        self._save_characters()
        return True
    
    def get_character_by_name(self, name: str) -> Optional[SavedCharacter]:
        """Get character by exact name match"""
        for character in self.characters.values():
            if character.name.lower() == name.lower():
                return character
        return None
    
    def get_characters_by_tag(self, tag: str) -> List[SavedCharacter]:
        """Get all characters with a specific tag"""
        results = []
        for character in self.characters.values():
            if tag.lower() in [t.lower() for t in character.tags]:
                results.append(character)
        return results
    
    def get_all_tags(self) -> List[str]:
        """Get all unique tags across all characters"""
        all_tags = set()
        for character in self.characters.values():
            all_tags.update(character.tags)
        return sorted(list(all_tags))
    
    # Group management methods
    def create_group(self, name: str, description: str = "", image_path: str = "") -> CharacterGroup:
        """Create a new character group"""
        group = CharacterGroup(
            name=name,
            description=description,
            image_path=image_path
        )
        self.groups[group.id] = group
        self._save_characters()
        return group
    
    def get_group(self, group_id: str) -> Optional[CharacterGroup]:
        """Get a group by ID"""
        return self.groups.get(group_id)
    
    def get_all_groups(self) -> List[CharacterGroup]:
        """Get all character groups"""
        return list(self.groups.values())
    
    def delete_group(self, group_id: str) -> bool:
        """Delete a group and remove characters from it"""
        if group_id not in self.groups:
            return False
        
        # Remove characters from this group
        for character in self.characters.values():
            if character.group_id == group_id:
                character.group_id = ""
                character.updated_at = datetime.now()
        
        del self.groups[group_id]
        self._save_characters()
        return True
    
    def update_group(self, group_id: str, updates: Dict[str, Any]) -> bool:
        """Update group fields"""
        if group_id not in self.groups:
            return False
        
        group = self.groups[group_id]
        
        if 'name' in updates:
            group.name = updates['name']
        if 'description' in updates:
            group.description = updates['description']
        if 'image_path' in updates:
            group.image_path = updates['image_path']
        
        self._save_characters()
        return True
    
    def add_character_to_group(self, character_id: str, group_id: str) -> bool:
        """Add a character to a group"""
        if character_id not in self.characters or group_id not in self.groups:
            return False
        
        character = self.characters[character_id]
        character.group_id = group_id
        character.updated_at = datetime.now()
        self._save_characters()
        return True
    
    def remove_character_from_group(self, character_id: str) -> bool:
        """Remove a character from its group"""
        if character_id not in self.characters:
            return False
        
        character = self.characters[character_id]
        character.group_id = ""
        character.updated_at = datetime.now()
        self._save_characters()
        return True
    
    def get_characters_in_group(self, group_id: str) -> List[SavedCharacter]:
        """Get all characters in a specific group"""
        return [char for char in self.characters.values() if char.group_id == group_id]
    
    def get_ungrouped_characters(self) -> List[SavedCharacter]:
        """Get all characters not assigned to any group"""
        return [char for char in self.characters.values() if not char.group_id]
    
    def cleanup_empty_groups(self) -> int:
        """Remove groups that have no characters and return count of removed groups"""
        empty_groups = []
        for group_id, group in self.groups.items():
            if not any(char.group_id == group_id for char in self.characters.values()):
                empty_groups.append(group_id)
        
        for group_id in empty_groups:
            del self.groups[group_id]
        
        if empty_groups:
            self._save_characters()
        
        return len(empty_groups)

    def get_library_stats(self) -> Dict[str, Any]:
        """Get statistics about the character library"""
        characters = list(self.characters.values())
        
        if not characters:
            return {
                'total_characters': 0,
                'total_groups': 0,
                'ungrouped_characters': 0,
                'ai_generated': 0,
                'user_created': 0,
                'personality_archetypes': {},
                'total_tags': 0,
                'most_used_tags': []
            }
        
        # Count by archetype
        archetype_counts = {}
        for char in characters:
            archetype = char.personality_archetype.value
            archetype_counts[archetype] = archetype_counts.get(archetype, 0) + 1
        
        # Count tags
        tag_counts = {}
        for char in characters:
            for tag in char.tags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        most_used_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        return {
            'total_characters': len(characters),
            'total_groups': len(self.groups),
            'ungrouped_characters': len(self.get_ungrouped_characters()),
            'ai_generated': sum(1 for char in characters if char.is_ai_generated),
            'user_created': sum(1 for char in characters if not char.is_ai_generated),
            'personality_archetypes': archetype_counts,
            'total_tags': len(tag_counts),
            'most_used_tags': most_used_tags
        }


# Global character library instance
character_library = CharacterLibrary() 