// Unified Filter Engine - Exclusively powered by Banuba WebAR SDK
import { BanubaEngine } from './BanubaEngine';

// Import types
import {
    FilterCategory,
    COLOR_FILTERS,
    BEAUTY_FILTERS,
    AR_FACE_FILTERS,
    BACKGROUND_FILTERS,
    GESTURE_FILTERS,
    TIME_EFFECTS,
    CHROMA_KEY_FILTERS,
    ColorFilterConfig,
    BackgroundFilterConfig,
    ChromaKeyConfig,
    GestureFilterConfig,
    TimeEffectConfig
} from './types';

// Legacy filter type for backward compatibility
export type FilterType = "None" | "Soft Glow" | "Warmth" | "Noir" | "Neon" | "Cat Ears" | "Cool Shades" | "Bunny Mask" | "Fox Mask" | "Pixelate" | "Sparkles";

export class FilterEngine {
    // Single source of truth for multimedia
    private banubaEngine: BanubaEngine | null = null;
    
    // Video and canvas refs
    private videoElement: HTMLVideoElement | null = null;
    
    // State
    private isRunning = false;
    
    // Active filters
    private activeColorFilter: ColorFilterConfig | null = null;
    private activeARFilter: string = 'none';
    private activeBackgroundFilter: BackgroundFilterConfig | null = null;
    
    // Filter intensity
    private colorIntensity: number = 100;

    constructor() {}

    public async initialize(): Promise<void> {
        console.log("[FilterEngine] Initializing Banuba exclusively...");
        await this.initializeBanuba();
        console.log("[FilterEngine] Fully initialized.");
    }

    private async initializeBanuba(): Promise<void> {
        if (this.banubaEngine) {
            return;
        }

        try {
            const token = process.env.NEXT_PUBLIC_BANUBA_TOKEN;
            if (!token) {
                console.warn("[FilterEngine] No Banuba token found.");
                return;
            }

            this.banubaEngine = new BanubaEngine();
            await this.banubaEngine.initialize(token);
            if (this.banubaEngine.isReady()) {
                await this.banubaEngine.loadModules();
                console.log("[FilterEngine] Banuba initialized successfully");
            } else {
                console.warn("[FilterEngine] Banuba not ready after init, AR effects unavailable");
                this.banubaEngine = null;
            }
        } catch (e) {
            console.warn("[FilterEngine] Banuba initialization failed");
            this.banubaEngine = null;
        }
    }

    public attach(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
        this.videoElement = video;
        // Note: Canvas is passed but no longer populated manually. Banuba handles WebGL rendering to a separated div Container.
        
        // Connect video stream to Banuba as input
        if (this.banubaEngine?.isReady() && this.videoElement) {
            this.banubaEngine.useVideoElement(this.videoElement);
        }
        
        console.log("[FilterEngine] Attached video source to Banuba.");
    }

    // Get the Banuba engine for direct rendering
    getBanubaEngine(): BanubaEngine | null {
        return this.banubaEngine;
    }

    // Whether Banuba AR is active
    isBanubaActive(): boolean {
        return this.banubaEngine?.isReady() === true && this.activeARFilter !== 'none';
    }

    // ===== Filter Setters =====

    public setColorFilter(filterId: string | null): void {
        if (!filterId || filterId === 'none') {
            this.activeColorFilter = null;
            // Native fallback for unsupported complex cssFilters in Banuba
            if (this.banubaEngine?.isReady()) {
               this.banubaEngine.applyEffect('none');
            }
            return;
        }
        
        const filter = COLOR_FILTERS.find(f => f.id === filterId) || 
                       BEAUTY_FILTERS.find(f => f.id === filterId);
        
        if (filter) {
            this.activeColorFilter = filter;
            if (this.banubaEngine?.isReady()) {
                // If it's a beauty filter mapped to Banuba, route to Banuba AR setter
                if (filter.category === FilterCategory.BEAUTY && filter.id !== 'soft_glam') {
                    // Try to map to Banuba Skin Smooth/Beauty equivalents if they existed
                    this.banubaEngine.applyEffect('beauty_smooth');
                } else {
                    console.log("[FilterEngine] Color presets currently mapped to generic AR clear in Banuba-exclusive mode.");
                }
            }
        }
    }

    public async setBackgroundFilter(filterId: string | null): Promise<void> {
        if (!this.banubaEngine?.isReady()) return;

        if (!filterId || filterId === 'bg_none') {
            this.activeBackgroundFilter = null;
            await this.banubaEngine.clearBackground();
            return;
        }
        
        const filter = BACKGROUND_FILTERS.find(f => f.id === filterId);
        if (filter) {
            this.activeBackgroundFilter = filter;
            if (filter.type === 'blur' && filter.blurAmount) {
                await this.banubaEngine.setBackgroundBlur(filter.blurAmount / 20.0); // Normalize to 0-1
            } else if (filter.type === 'solid' && filter.value) {
                await this.banubaEngine.setBackgroundColor(filter.value);
            }
            console.log("[FilterEngine] Banuba background set to:", filter.name);
        }
    }

    public setChromaKeyFilter(filterId: string | null): void {
        console.warn("[FilterEngine] ChromaKey natively routed via BackgroundFilters in Banuba mode.");
    }

    public setGestureFilter(filterId: string | null): void {
        console.warn("[FilterEngine] Gestures disabled in Banuba-exclusive mode.");
    }

    public setTimeEffect(filterId: string | null): void {
        console.warn("[FilterEngine] Time Effects disabled in Banuba-exclusive mode.");
    }

    // Legacy AR filter setter (for backward compatibility)
    public setFilter(filter: FilterType): void {
        // Map legacy filter names to new AR filters
        const filterMap: Record<string, string> = {
            "Cat Ears": "cat_ears",
            "Cool Shades": "aviators",
            "Bunny Mask": "bunnymask",
            "Fox Mask": "foxmask",
            "Sparkles": "sparkles",
            "Neon": "neon",
        };
        
        if (filter === "None") {
            this.activeARFilter = "none";
            return;
        }
        
        this.activeARFilter = filterMap[filter] || "none";
    }

    public setColorIntensity(intensity: number): void {
        this.colorIntensity = Math.max(0, Math.min(100, intensity));
    }

    public getColorIntensity(): number {
        return this.colorIntensity;
    }

    // Set AR filter by ID (new API) - uses Banuba SDK
    public async setARFilter(filterId: string | null): Promise<void> {
        if (!filterId || filterId === 'none' || filterId === 'ar_none') {
            this.activeARFilter = 'none';
            if (this.banubaEngine?.isReady()) {
                await this.banubaEngine.clearEffect();
            }
            console.log("[FilterEngine] AR filter cleared");
            return;
        }
        this.activeARFilter = filterId;
        if (this.banubaEngine?.isReady()) {
            await this.banubaEngine.applyEffect(filterId);
        }
        console.log("[FilterEngine] AR filter set to:", filterId);
    }

    // ===== Processing =====

    public async start(): Promise<void> {
        if (this.isRunning) return;
        await this.initialize();

        this.isRunning = true;

        if (this.banubaEngine?.isReady()) {
            this.banubaEngine.play();
        }
    }

    public stop(): void {
        this.isRunning = false;
        if (this.banubaEngine) {
            this.banubaEngine.pause();
        }
    }

    // ===== Static Methods =====

    static getColorFilters() { return COLOR_FILTERS; }
    static getBeautyFilters() { return BEAUTY_FILTERS; }
    static getARFilters() { return AR_FACE_FILTERS; }
    static getBackgroundFilters() { return BACKGROUND_FILTERS; }
    static getGestureFilters() { return GESTURE_FILTERS; }
    static getTimeEffects() { return TIME_EFFECTS; }
    static getChromaKeyFilters() { return CHROMA_KEY_FILTERS; }

    dispose(): void {
        this.stop();
        if (this.banubaEngine) {
            this.banubaEngine.destroy();
        }
    }
}

export default FilterEngine;
