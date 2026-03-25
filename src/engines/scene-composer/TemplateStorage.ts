/**
 * Template Storage
 * 
 * Handles persistence and retrieval of scene templates
 * using localStorage and optional REST API.
 */

import { SceneTemplate, Scene } from '@/types/scene-composer';

const STORAGE_KEY = 'livestudio_scene_templates';
const BUILT_IN_TEMPLATES: SceneTemplate[] = [
    {
        id: 'intro_host',
        name: 'Intro + Host',
        description: 'Single camera view with host',
        category: 'presentation',
        isBuiltIn: true,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        scene: {
            id: 'scene_intro_host',
            name: 'Intro + Host',
            layout: 'full',
            sources: [],
            overlays: [],
            isActive: false,
            isPreview: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    },
    {
        id: 'single_cam',
        name: 'Single Camera',
        description: 'Standard camera view',
        category: 'presentation',
        isBuiltIn: true,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        scene: {
            id: 'scene_single_cam',
            name: 'Single Camera',
            layout: 'full',
            sources: [],
            overlays: [],
            isActive: false,
            isPreview: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    },
    {
        id: 'product_closeup',
        name: 'Product Close-up',
        description: 'Hero overlay with product',
        category: 'product',
        isBuiltIn: true,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        scene: {
            id: 'scene_product_closeup',
            name: 'Product Close-up',
            layout: 'full',
            sources: [],
            overlays: [
                {
                    id: 'hero_overlay',
                    type: 'hero',
                    enabled: true,
                    position: 'bottom-right',
                    content: {},
                    style: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        borderColor: '#ffffff',
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        fontColor: '#ffffff',
                        opacity: 1,
                    },
                },
            ],
            isActive: false,
            isPreview: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    },
    {
        id: 'split_screen',
        name: 'Split Screen',
        description: 'Host + product side by side',
        category: 'product',
        isBuiltIn: true,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        scene: {
            id: 'scene_split_screen',
            name: 'Split Screen',
            layout: 'split',
            layoutConfig: {
                splitConfig: {
                    position: 'left',
                    ratio: 0.5,
                },
            },
            sources: [],
            overlays: [],
            isActive: false,
            isPreview: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    },
    {
        id: 'flash_offer',
        name: 'Flash Offer',
        description: 'High urgency offer layout',
        category: 'product',
        isBuiltIn: true,
        isFavorite: false,
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        scene: {
            id: 'scene_flash_offer',
            name: 'Flash Offer',
            layout: 'pip',
            sources: [],
            overlays: [
                {
                    id: 'flash_deal',
                    type: 'flash_deal',
                    enabled: true,
                    position: 'top-center',
                    content: {},
                    style: {
                        backgroundColor: '#f77f00',
                        borderColor: '#ffffff',
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 14,
                        fontColor: '#ffffff',
                        opacity: 1,
                    },
                },
            ],
            isActive: false,
            isPreview: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        },
    },
];

export class TemplateStorage {
    /**
     * Get all templates (built-in + user-created)
     */
    static getAll(): SceneTemplate[] {
        const userTemplates = this.getUserTemplates();
        return [...BUILT_IN_TEMPLATES, ...userTemplates];
    }

    /**
     * Get built-in templates only
     */
    static getBuiltIn(): SceneTemplate[] {
        return [...BUILT_IN_TEMPLATES];
    }

    /**
     * Get user-created templates only
     */
    static getUserTemplates(): SceneTemplate[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            return JSON.parse(stored) as SceneTemplate[];
        } catch (error) {
            console.error('Failed to load user templates:', error);
            return [];
        }
    }

    /**
     * Get template by ID
     */
    static getById(id: string): SceneTemplate | undefined {
        const all = this.getAll();
        return all.find(t => t.id === id);
    }

    /**
     * Save a new template
     */
    static save(template: SceneTemplate): void {
        const userTemplates = this.getUserTemplates();
        const existingIndex = userTemplates.findIndex(t => t.id === template.id);

        if (existingIndex >= 0) {
            userTemplates[existingIndex] = { ...template, updatedAt: Date.now() };
        } else {
            userTemplates.push({ ...template, createdAt: Date.now(), updatedAt: Date.now() });
        }

        this.saveUserTemplates(userTemplates);
    }

    /**
     * Delete a user template
     */
    static delete(id: string): void {
        const userTemplates = this.getUserTemplates();
        const filtered = userTemplates.filter(t => t.id !== id);
        this.saveUserTemplates(filtered);
    }

    /**
     * Update template usage count
     */
    static incrementUsage(id: string): void {
        const userTemplates = this.getUserTemplates();
        const template = userTemplates.find(t => t.id === id);

        if (template) {
            template.usageCount++;
            template.updatedAt = Date.now();
            this.saveUserTemplates(userTemplates);
        }
    }

    /**
     * Toggle favorite status
     */
    static toggleFavorite(id: string): void {
        const userTemplates = this.getUserTemplates();
        const template = userTemplates.find(t => t.id === id);

        if (template) {
            template.isFavorite = !template.isFavorite;
            template.updatedAt = Date.now();
            this.saveUserTemplates(userTemplates);
        }
    }

    /**
     * Save scene as template
     */
    static saveSceneAsTemplate(scene: Scene, name: string, category: SceneTemplate['category']): SceneTemplate {
        const id = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const template: SceneTemplate = {
            id,
            name,
            description: `Custom template: ${name}`,
            category,
            isBuiltIn: false,
            isFavorite: false,
            usageCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            scene: {
                ...scene,
                name,
            },
        };

        this.save(template);
        return template;
    }

    /**
     * Apply template to create a new scene
     */
    static applyTemplate(templateId: string, sceneId: string): Scene | undefined {
        const template = this.getById(templateId);
        if (!template) return undefined;

        const now = Date.now();
        const newScene: Scene = {
            ...template.scene,
            id: sceneId,
            name: `${template.name} (Copy)`,
            isActive: false,
            isPreview: true,
            createdAt: now,
            updatedAt: now,
        };

        // Increment usage count
        if (!template.isBuiltIn) {
            this.incrementUsage(templateId);
        }

        return newScene;
    }

    /**
     * Get templates by category
     */
    static getByCategory(category: SceneTemplate['category']): SceneTemplate[] {
        return this.getAll().filter(t => t.category === category);
    }

    /**
     * Get favorite templates
     */
    static getFavorites(): SceneTemplate[] {
        return this.getAll().filter(t => t.isFavorite);
    }

    /**
     * Get most used templates
     */
    static getMostUsed(limit: number = 5): SceneTemplate[] {
        const userTemplates = this.getUserTemplates();
        return userTemplates
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, limit);
    }

    /**
     * Save user templates to localStorage
     */
    private static saveUserTemplates(templates: SceneTemplate[]): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
        } catch (error) {
            console.error('Failed to save user templates:', error);
        }
    }

    /**
     * Export templates as JSON
     */
    static exportTemplates(): string {
        const userTemplates = this.getUserTemplates();
        return JSON.stringify(userTemplates, null, 2);
    }

    /**
     * Import templates from JSON
     */
    static importTemplates(json: string): number {
        try {
            const imported = JSON.parse(json) as SceneTemplate[];
            const userTemplates = this.getUserTemplates();

            let count = 0;
            for (const template of imported) {
                if (!template.isBuiltIn) {
                    // Generate new ID to avoid conflicts
                    template.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    template.createdAt = Date.now();
                    template.updatedAt = Date.now();
                    userTemplates.push(template);
                    count++;
                }
            }

            this.saveUserTemplates(userTemplates);
            return count;
        } catch (error) {
            console.error('Failed to import templates:', error);
            return 0;
        }
    }

    /**
     * Clear all user templates
     */
    static clearUserTemplates(): void {
        localStorage.removeItem(STORAGE_KEY);
    }
}

export default TemplateStorage;
