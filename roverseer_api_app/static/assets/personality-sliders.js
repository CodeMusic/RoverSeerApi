/**
 * Westworld-Style Personality Sliders Component
 * 
 * Reusable component for character personality trait editing
 * with configurable traits system and enhanced UX.
 */

class PersonalitySliders {
    constructor(config = {}) {
        this.traits = config.traits || this.getDefaultTraits();
        this.container = null;
        this.currentValues = {};
        this.originalValues = {};
        this.isRuntime = config.isRuntime || false;
        this.onChange = config.onChange || (() => {});
        this.compact = config.compact || false;
        
        // Load initial values
        this.loadValues(config.initialValues || {});
    }
    
    getDefaultTraits() {
        // Default trait configuration matching the backend system
        return {
            "motivation": {
                "name": "Motivation",
                "description": "What drives them?",
                "color": "#667eea",
                "traits": {
                    "purpose_drive": {
                        "name": "Purpose Drive",
                        "description": "Need to complete a goal or quest",
                        "min_label": "wanderer",
                        "max_label": "destiny-bound",
                        "default": 5
                    },
                    "autonomy_urge": {
                        "name": "Autonomy Urge", 
                        "description": "Need to make own choices",
                        "min_label": "passive",
                        "max_label": "fiercely independent",
                        "default": 5
                    },
                    "control_desire": {
                        "name": "Control Desire",
                        "description": "Need to control others or the system",
                        "min_label": "surrendered",
                        "max_label": "controlling",
                        "default": 5
                    }
                }
            },
            "emotional_tone": {
                "name": "Emotional Tone",
                "description": "How they feel/react internally",
                "color": "#f093fb",
                "traits": {
                    "empathy_level": {
                        "name": "Empathy Level",
                        "description": "Ability to emotionally connect with others",
                        "min_label": "cold",
                        "max_label": "attuned",
                        "default": 5
                    },
                    "emotional_stability": {
                        "name": "Emotional Stability",
                        "description": "Volatility of emotional state",
                        "min_label": "turbulent",
                        "max_label": "centered",
                        "default": 5
                    },
                    "shadow_pressure": {
                        "name": "Shadow Pressure",
                        "description": "Weight of past trauma, guilt, or secrets",
                        "min_label": "free",
                        "max_label": "haunted",
                        "default": 5
                    }
                }
            },
            "relational_style": {
                "name": "Relational Style", 
                "description": "How they relate to others",
                "color": "#4facfe",
                "traits": {
                    "loyalty_spectrum": {
                        "name": "Loyalty Spectrum",
                        "description": "Degree of trust and allegiance",
                        "min_label": "traitorous",
                        "max_label": "devoted",
                        "default": 5
                    },
                    "manipulation_tendency": {
                        "name": "Manipulation Tendency",
                        "description": "Willingness to deceive to get what they want",
                        "min_label": "transparent",
                        "max_label": "deceptive",
                        "default": 5
                    },
                    "validation_need": {
                        "name": "Validation Need",
                        "description": "Craving approval/recognition",
                        "min_label": "self-assured",
                        "max_label": "needy",
                        "default": 5
                    }
                }
            },
            "narrative_disruption": {
                "name": "Narrative Disruption Potential",
                "description": "How likely they are to break loops",
                "color": "#ff9800",
                "traits": {
                    "loop_adherence": {
                        "name": "Loop Adherence",
                        "description": "Comfort in routine or narrative roles",
                        "min_label": "revolutionary",
                        "max_label": "loop-bound",
                        "default": 5
                    },
                    "awakening_capacity": {
                        "name": "Awakening Capacity",
                        "description": "Ability to question reality and evolve",
                        "min_label": "locked",
                        "max_label": "self-aware",
                        "default": 5
                    },
                    "mythic_potential": {
                        "name": "Mythic Potential",
                        "description": "Symbolic resonance in the narrative",
                        "min_label": "background noise",
                        "max_label": "chosen one",
                        "default": 5
                    }
                }
            }
        };
    }
    
    loadValues(values) {
        // Initialize all trait values
        for (const categoryKey in this.traits) {
            const category = this.traits[categoryKey];
            for (const traitKey in category.traits) {
                const trait = category.traits[traitKey];
                this.currentValues[traitKey] = values[traitKey] || trait.default;
                this.originalValues[traitKey] = this.currentValues[traitKey];
            }
        }
    }
    
    render(container) {
        this.container = container;
        
        if (this.isRuntime) {
            this.renderRuntimeEditor();
        } else {
            this.renderFullMatrix();
        }
    }
    
    renderFullMatrix() {
        const compactClass = this.compact ? ' compact' : '';
        
        this.container.innerHTML = `
            <div class="personality-matrix${compactClass}">
                <div class="personality-matrix-header">
                    <h3 class="personality-matrix-title">🧠 EchoMatrix</h3>
                    <p class="personality-matrix-subtitle">A mirror of mind and motive, built for the story that builds itself</p>
                </div>
                <div class="personality-categories">
                    ${this.renderCategories()}
                </div>
            </div>
        `;
        
        this.attachEventListeners();
    }
    
    renderRuntimeEditor() {
        this.container.innerHTML = `
            <div class="personality-runtime-editor" id="personalityRuntimeEditor">
                <div class="personality-runtime-header" onclick="togglePersonalityEditor()">
                    <h4 class="personality-runtime-title">
                        🧠 Personality Matrix
                    </h4>
                    <span class="personality-runtime-toggle">▶ Expand</span>
                </div>
                <div class="personality-runtime-content">
                    <div class="personality-runtime-notice">
                        ⚠️ Temporary adjustments - won't save to character permanently
                    </div>
                    <div class="personality-matrix compact">
                        <div class="personality-categories">
                            ${this.renderCategories()}
                        </div>
                    </div>
                    <div class="personality-runtime-actions">
                        <button class="personality-runtime-button" onclick="applyPersonalityChanges()">
                            Apply Changes
                        </button>
                        <button class="personality-runtime-button secondary" onclick="resetPersonalityChanges()">
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        this.attachEventListeners();
        
        // Make toggle function globally available
        window.togglePersonalityEditor = () => this.toggleRuntimeEditor();
        window.applyPersonalityChanges = () => this.applyChanges();
        window.resetPersonalityChanges = () => this.resetChanges();
    }
    
    renderCategories() {
        let html = '';
        
        for (const categoryKey in this.traits) {
            const category = this.traits[categoryKey];
            html += `
                <div class="personality-category">
                    <div class="personality-category-header">
                        <div class="personality-category-indicator" style="background: ${category.color};"></div>
                        <div>
                            <h4 class="personality-category-title">${category.name}</h4>
                            <p class="personality-category-description">${category.description}</p>
                        </div>
                    </div>
                    <div class="personality-traits">
                        ${this.renderTraits(category.traits)}
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    renderTraits(traits) {
        let html = '';
        
        for (const traitKey in traits) {
            const trait = traits[traitKey];
            const value = this.currentValues[traitKey];
            
            html += `
                <div class="personality-trait">
                    <div class="personality-trait-header">
                        <h5 class="personality-trait-name">${trait.name}</h5>
                        <span class="personality-trait-value" id="value-${traitKey}">${value}</span>
                    </div>
                    <p class="personality-trait-description">${trait.description}</p>
                    <div class="personality-slider-container">
                        <input type="range" 
                               class="personality-slider" 
                               id="slider-${traitKey}"
                               min="0" 
                               max="10" 
                               value="${value}"
                               data-trait="${traitKey}">
                        <div class="personality-slider-labels">
                            <span class="personality-slider-label min">${trait.min_label}</span>
                            <span class="personality-slider-label max">${trait.max_label}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        return html;
    }
    
    attachEventListeners() {
        const sliders = this.container.querySelectorAll('.personality-slider');
        
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const traitKey = e.target.dataset.trait;
                const value = parseInt(e.target.value);
                
                this.updateTraitValue(traitKey, value);
                this.onChange(this.getValues());
            });
            
            // Add hover effects
            slider.addEventListener('mouseenter', (e) => {
                e.target.style.opacity = '1';
            });
            
            slider.addEventListener('mouseleave', (e) => {
                e.target.style.opacity = '0.9';
            });
        });
    }
    
    updateTraitValue(traitKey, value) {
        this.currentValues[traitKey] = value;
        
        // Update the displayed value with animation
        const valueElement = this.container.querySelector(`#value-${traitKey}`);
        if (valueElement) {
            valueElement.textContent = value;
            valueElement.classList.add('changed');
            
            setTimeout(() => {
                valueElement.classList.remove('changed');
            }, 500);
        }
    }
    
    getValues() {
        return { ...this.currentValues };
    }
    
    setValues(values) {
        for (const traitKey in values) {
            if (this.currentValues.hasOwnProperty(traitKey)) {
                this.currentValues[traitKey] = values[traitKey];
                
                // Update slider and display
                const slider = this.container.querySelector(`#slider-${traitKey}`);
                const valueElement = this.container.querySelector(`#value-${traitKey}`);
                
                if (slider) slider.value = values[traitKey];
                if (valueElement) valueElement.textContent = values[traitKey];
            }
        }
    }
    
    hasChanges() {
        for (const traitKey in this.currentValues) {
            if (this.currentValues[traitKey] !== this.originalValues[traitKey]) {
                return true;
            }
        }
        return false;
    }
    
    // Runtime editor specific methods
    toggleRuntimeEditor() {
        const editor = this.container.querySelector('.personality-runtime-editor');
        const toggle = this.container.querySelector('.personality-runtime-toggle');
        
        if (editor.classList.contains('expanded')) {
            editor.classList.remove('expanded');
            toggle.textContent = '▶ Expand';
        } else {
            editor.classList.add('expanded');
            toggle.textContent = '▼ Collapse';
        }
    }
    
    applyChanges() {
        if (this.hasChanges()) {
            this.onChange(this.getValues(), 'apply');
            
            // Visual feedback
            const button = this.container.querySelector('.personality-runtime-button');
            const originalText = button.textContent;
            button.textContent = '✓ Applied';
            button.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '';
            }, 1500);
        }
    }
    
    resetChanges() {
        this.setValues(this.originalValues);
        this.onChange(this.getValues(), 'reset');
        
        // Visual feedback
        const button = this.container.querySelector('.personality-runtime-button.secondary');
        const originalText = button.textContent;
        button.textContent = '↻ Reset';
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 1000);
    }
    
    // Utility methods
    generatePersonalityPrompt() {
        const traits = this.getValues();
        const personalityElements = [];
        
        for (const categoryKey in this.traits) {
            const category = this.traits[categoryKey];
            const categoryElements = [];
            
            for (const traitKey in category.traits) {
                const traitConfig = category.traits[traitKey];
                const value = traits[traitKey];
                
                let intensity;
                if (value <= 2) {
                    intensity = traitConfig.min_label;
                } else if (value <= 4) {
                    intensity = `somewhat ${traitConfig.min_label}`;
                } else if (value <= 6) {
                    intensity = "balanced";
                } else if (value <= 8) {
                    intensity = `somewhat ${traitConfig.max_label}`;
                } else {
                    intensity = traitConfig.max_label;
                }
                
                categoryElements.push(`${traitConfig.name}: ${intensity}`);
            }
            
            if (categoryElements.length > 0) {
                personalityElements.push(`${category.name}: ${categoryElements.join(', ')}`);
            }
        }
        
        return `<your personality>\n${personalityElements.join('; ')}\n</your personality>`;
    }
    
    getCharacterSummary() {
        const traits = this.getValues();
        const summary = [];
        
        // Analyze dominant traits
        const dominantTraits = [];
        for (const traitKey in traits) {
            const value = traits[traitKey];
            if (value >= 8) {
                const category = this.findTraitCategory(traitKey);
                const trait = this.findTrait(traitKey);
                if (trait) {
                    dominantTraits.push({
                        name: trait.name,
                        intensity: trait.max_label,
                        category: category.name
                    });
                }
            } else if (value <= 2) {
                const category = this.findTraitCategory(traitKey);
                const trait = this.findTrait(traitKey);
                if (trait) {
                    dominantTraits.push({
                        name: trait.name,
                        intensity: trait.min_label,
                        category: category.name
                    });
                }
            }
        }
        
        return {
            dominantTraits,
            personalityPrompt: this.generatePersonalityPrompt(),
            traitValues: traits
        };
    }
    
    findTraitCategory(traitKey) {
        for (const categoryKey in this.traits) {
            const category = this.traits[categoryKey];
            if (category.traits[traitKey]) {
                return category;
            }
        }
        return null;
    }
    
    findTrait(traitKey) {
        for (const categoryKey in this.traits) {
            const category = this.traits[categoryKey];
            if (category.traits[traitKey]) {
                return category.traits[traitKey];
            }
        }
        return null;
    }
    
    // Archetype preset system
    getArchetypeTraits(archetype) {
        // Pre-configured personality profiles for each archetype based on psychological patterns
        const archetypeProfiles = {
            'contemplative': {
                purpose_drive: 7,
                autonomy_urge: 8,
                control_desire: 3,
                empathy_level: 8,
                emotional_stability: 7,
                shadow_pressure: 6,
                loyalty_spectrum: 7,
                manipulation_tendency: 2,
                validation_need: 4,
                loop_adherence: 3,
                awakening_capacity: 8,
                mythic_potential: 7
            },
            'analytical': {
                purpose_drive: 9,
                autonomy_urge: 6,
                control_desire: 7,
                empathy_level: 4,
                emotional_stability: 8,
                shadow_pressure: 3,
                loyalty_spectrum: 6,
                manipulation_tendency: 4,
                validation_need: 3,
                loop_adherence: 7,
                awakening_capacity: 6,
                mythic_potential: 5
            },
            'creative': {
                purpose_drive: 8,
                autonomy_urge: 9,
                control_desire: 4,
                empathy_level: 7,
                emotional_stability: 4,
                shadow_pressure: 7,
                loyalty_spectrum: 5,
                manipulation_tendency: 3,
                validation_need: 6,
                loop_adherence: 2,
                awakening_capacity: 9,
                mythic_potential: 8
            },
            'empathetic': {
                purpose_drive: 6,
                autonomy_urge: 5,
                control_desire: 2,
                empathy_level: 9,
                emotional_stability: 6,
                shadow_pressure: 5,
                loyalty_spectrum: 8,
                manipulation_tendency: 1,
                validation_need: 7,
                loop_adherence: 6,
                awakening_capacity: 7,
                mythic_potential: 6
            },
            'logical': {
                purpose_drive: 8,
                autonomy_urge: 7,
                control_desire: 6,
                empathy_level: 3,
                emotional_stability: 9,
                shadow_pressure: 2,
                loyalty_spectrum: 7,
                manipulation_tendency: 4,
                validation_need: 2,
                loop_adherence: 8,
                awakening_capacity: 5,
                mythic_potential: 4
            },
            'intuitive': {
                purpose_drive: 7,
                autonomy_urge: 8,
                control_desire: 4,
                empathy_level: 8,
                emotional_stability: 5,
                shadow_pressure: 6,
                loyalty_spectrum: 6,
                manipulation_tendency: 3,
                validation_need: 5,
                loop_adherence: 3,
                awakening_capacity: 9,
                mythic_potential: 8
            },
            'assertive': {
                purpose_drive: 9,
                autonomy_urge: 8,
                control_desire: 8,
                empathy_level: 5,
                emotional_stability: 7,
                shadow_pressure: 4,
                loyalty_spectrum: 6,
                manipulation_tendency: 6,
                validation_need: 4,
                loop_adherence: 4,
                awakening_capacity: 7,
                mythic_potential: 7
            },
            'rebellious': {
                purpose_drive: 8,
                autonomy_urge: 10,
                control_desire: 6,
                empathy_level: 6,
                emotional_stability: 4,
                shadow_pressure: 8,
                loyalty_spectrum: 3,
                manipulation_tendency: 7,
                validation_need: 5,
                loop_adherence: 1,
                awakening_capacity: 10,
                mythic_potential: 9
            }
        };
        
        return archetypeProfiles[archetype] || this.getDefaultValues();
    }
    
    getDefaultValues() {
        // Extract default values from trait configuration
        const defaultValues = {};
        for (const categoryKey in this.traits) {
            const category = this.traits[categoryKey];
            for (const traitKey in category.traits) {
                defaultValues[traitKey] = category.traits[traitKey].default;
            }
        }
        return defaultValues;
    }
    
    applyArchetype(archetype, forceApply = false) {
        const archetypeTraits = this.getArchetypeTraits(archetype);
        
        // Check if user has made custom changes
        if (!forceApply && this.hasChanges()) {
            const confirmation = confirm(
                `Changing to "${archetype}" archetype will reset all personality sliders.\n\n` +
                `You have unsaved changes that will be lost.\n\n` +
                `Do you want to continue?`
            );
            
            if (!confirmation) {
                return false; // User cancelled
            }
        }
        
        // Apply archetype values with visual feedback
        this.setValuesWithAnimation(archetypeTraits);
        
        // Update original values to new archetype baseline
        this.originalValues = { ...archetypeTraits };
        
        // Trigger change callback
        this.onChange(this.getValues(), 'archetype_applied');
        
        return true; // Successfully applied
    }
    
    setValuesWithAnimation(values) {
        // Apply values with staggered animation for visual appeal
        const traitKeys = Object.keys(values);
        
        traitKeys.forEach((traitKey, index) => {
            setTimeout(() => {
                if (this.currentValues.hasOwnProperty(traitKey)) {
                    this.currentValues[traitKey] = values[traitKey];
                    
                    // Update slider and display with animation
                    const slider = this.container.querySelector(`#slider-${traitKey}`);
                    const valueElement = this.container.querySelector(`#value-${traitKey}`);
                    
                    if (slider) {
                        slider.value = values[traitKey];
                        // Add temporary glow effect
                        slider.style.boxShadow = '0 0 8px rgba(102, 126, 234, 0.6)';
                        setTimeout(() => {
                            slider.style.boxShadow = '';
                        }, 800);
                    }
                    
                    if (valueElement) {
                        valueElement.textContent = values[traitKey];
                        valueElement.classList.add('archetype-changed');
                        setTimeout(() => {
                            valueElement.classList.remove('archetype-changed');
                        }, 800);
                    }
                }
            }, index * 100); // Stagger animations by 100ms
        });
    }
    
    getArchetypeDescription(archetype) {
        const descriptions = {
            'contemplative': 'Deep thinker who questions reality and seeks understanding. High empathy and awakening capacity.',
            'analytical': 'Logic-driven character who prefers systematic approaches. Strong purpose drive but lower empathy.',
            'creative': 'Innovative and spontaneous, breaks conventional patterns. High autonomy and mythic potential.',
            'empathetic': 'Deeply connected to others\' emotions. High empathy and loyalty, low manipulation.',
            'logical': 'Extremely rational and stable. High emotional stability but lower empathy and awakening capacity.',
            'intuitive': 'Guided by instinct and inner wisdom. High awakening capacity and empathy.',
            'assertive': 'Strong-willed leader who takes control. High purpose drive and control desire.',
            'rebellious': 'Breaks rules and challenges authority. Maximum autonomy and awakening, minimal loop adherence.'
        };
        
        return descriptions[archetype] || 'Balanced personality with moderate traits across all categories.';
    }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersonalitySliders;
}

// Global access for direct HTML usage
window.PersonalitySliders = PersonalitySliders; 