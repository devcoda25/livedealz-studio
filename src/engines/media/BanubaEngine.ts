// Banuba WebAR SDK integration for face-based AR effects
// Uses @banuba/webar for professional face tracking and effect rendering

export interface BanubaEffectConfig {
    id: string;
    name: string;
    // Built-in effect type (no zip file needed)
    type: "builtin";
    effectJs: string;
}

export interface BanubaZipEffectConfig {
    id: string;
    name: string;
    // Zip-based effect (needs a .zip file in /public/webar/effects/)
    type: "zip";
    zipUrl: string;
}

type BanubaAnyEffect = BanubaEffectConfig | BanubaZipEffectConfig;

// Built-in Banuba effects that work via evalJs (no zip files needed)
export const BANUBA_EFFECTS: BanubaAnyEffect[] = [
    { id: "none", name: "None", type: "builtin", effectJs: "" },

    // Face beautification
    { id: "beauty_smooth", name: "Smooth Skin", type: "builtin", effectJs: 'FaceMorphing.faceSmooth(0.7)' },
    { id: "beauty_teeth", name: "Teeth Whitening", type: "builtin", effectJs: 'FaceMorphing.teethWhitening(0.5)' },
    { id: "beauty_eyes", name: "Eye Enlargement", type: "builtin", effectJs: 'FaceMorphing.eyeEnlarge(0.3)' },

    // Face distortion effects
    { id: "face_slim", name: "Slim Face", type: "builtin", effectJs: 'FaceMorphing.faceSlim(0.4)' },
    { id: "nose_thin", name: "Thin Nose", type: "builtin", effectJs: 'FaceMorphing.noseThin(0.3)' },
    { id: "chin_length", name: "Long Chin", type: "builtin", effectJs: 'FaceMorphing.chinLength(0.3)' },
    { id: "forehead", name: "Forehead", type: "builtin", effectJs: 'FaceMorphing.forehead(0.2)' },

    // Eye effects
    { id: "eye_color_blue", name: "Blue Eyes", type: "builtin", effectJs: 'Eyes.color("0.15 0.35 0.65")' },
    { id: "eye_color_green", name: "Green Eyes", type: "builtin", effectJs: 'Eyes.color("0.2 0.6 0.3")' },
    { id: "eye_color_amber", name: "Amber Eyes", type: "builtin", effectJs: 'Eyes.color("0.8 0.55 0.2")' },

    // Lip effects
    { id: "lip_red", name: "Red Lips", type: "builtin", effectJs: 'Lips.color("0.7 0.1 0.15")' },
    { id: "lip_pink", name: "Pink Lips", type: "builtin", effectJs: 'Lips.color("0.8 0.35 0.45")' },
    { id: "lip_nude", name: "Nude Lips", type: "builtin", effectJs: 'Lips.color("0.75 0.55 0.5")' },

    // Hair
    { id: "hair_color_ruby", name: "Ruby Hair", type: "builtin", effectJs: 'Hair.color("0.6 0.05 0.15")' },
    { id: "hair_color_platinum", name: "Platinum Hair", type: "builtin", effectJs: 'Hair.color("0.9 0.85 0.75")' },
    { id: "hair_color_midnight", name: "Midnight Hair", type: "builtin", effectJs: 'Hair.color("0.1 0.05 0.25")' },

    // Skin tone
    { id: "skin_warm", name: "Warm Skin", type: "builtin", effectJs: 'Skin.color("1.0 0.9 0.8")' },
    { id: "skin_cool", name: "Cool Skin", type: "builtin", effectJs: 'Skin.color("0.9 0.9 1.0")' },
];

export class BanubaEngine {
    private player: any = null;
    private effect: any = null;
    private activeEffectId: string = "none";
    private isInitialized = false;
    private modulesLoaded = false;
    private input: any = null;
    private static isInitializing = false;

    // Banuba SDK classes (dynamically imported)
    private Player: any = null;
    private Module: any = null;
    private Effect: any = null;
    private Dom: any = null;
    private Webcam: any = null;

    constructor() {
        console.log("[BanubaEngine] Created");
    }

    async initialize(clientToken: string): Promise<void> {
        if (this.isInitialized || BanubaEngine.isInitializing) {
            console.log("[BanubaEngine] Already initialized or initializing, skipping");
            return;
        }
        BanubaEngine.isInitializing = true;

        console.log("[BanubaEngine] Initializing with token...");

        // Check for WASM threading support (SharedArrayBuffer + crossOriginIsolated)
        const hasSharedArrayBuffer = typeof SharedArrayBuffer !== "undefined";
        const isCrossOriginIsolated = (window as any).crossOriginIsolated === true;
        console.log("[BanubaEngine] SharedArrayBuffer:", hasSharedArrayBuffer, "| crossOriginIsolated:", isCrossOriginIsolated);
        
        if (!isCrossOriginIsolated) {
            console.warn("[BanubaEngine] Page is not cross-origin isolated. Banuba AR requires WASM threading.");
            console.warn("[BanubaEngine] AR effects will be unavailable. Check COOP/COEP headers in Network tab.");
            return;
        }

        try {
            // Import the Banuba SDK (webpack alias redirects to browser ESM bundle)
            console.log("[BanubaEngine] Importing SDK...");
            const sdk = await import("@banuba/webar");
            console.log("[BanubaEngine] SDK imported. Exports:", Object.keys(sdk));
            this.Player = sdk.Player;
            this.Module = sdk.Module;
            this.Effect = sdk.Effect;
            this.Dom = sdk.Dom;
            // @ts-ignore - Webcam may not be typed
            this.Webcam = (sdk as any).Webcam;

            console.log("[BanubaEngine] Creating player with token length:", clientToken.length);

            // Create player - use non-SIMD WASM for broader compatibility
            this.player = await this.Player.create({
                clientToken,
                locateFile: (fileName: string) => {
                    // Force non-SIMD WASM for compatibility
                    if (fileName === "BanubaSDK.simd.wasm") {
                        return "/webar/BanubaSDK.wasm";
                    }
                    return `/webar/${fileName}`;
                },
            });

            console.log("[BanubaEngine] Player created");
            this.isInitialized = true;

        } catch (e: any) {
            BanubaEngine.isInitializing = false;
            const errMsg = e?.message || String(e);
            
            if (errMsg.includes("Failed to fetch") || errMsg.includes("ERR_INSUFFICIENT_RESOURCES")) {
                console.warn("[BanubaEngine] WASM fetch failed - browser resource limit reached.");
                console.warn("[BanubaEngine] This can happen when multiple instances try to load simultaneously.");
                console.warn("[BanubaEngine] AR effects will be unavailable for this session.");
            } else {
                // @ts-ignore - WebAssembly.Exception not in TS lib
                const isWasmException = typeof WebAssembly !== "undefined" && e instanceof (WebAssembly as any).Exception;
                if (isWasmException) {
                    console.warn("[BanubaEngine] WASM initialization failed - threading not available in this environment.");
                } else {
                    console.warn("[BanubaEngine] Initialization failed:", errMsg);
                }
            }
            
            // Don't throw - let the app continue without Banuba
        }
    }

    async loadModules(): Promise<void> {
        if (!this.player || this.modulesLoaded) return;

        console.log("[BanubaEngine] Loading modules...");

        try {
            await this.player.addModule(
                new this.Module("/webar/modules/background.zip"),
                new this.Module("/webar/modules/face_tracker.zip"),
                new this.Module("/webar/modules/hair.zip"),
                new this.Module("/webar/modules/lips.zip"),
                new this.Module("/webar/modules/eyes.zip"),
                new this.Module("/webar/modules/skin.zip"),
            );
            this.modulesLoaded = true;
            console.log("[BanubaEngine] Modules loaded");

            // Always load a blank base effect so we can execute evalJs at any time
            this.effect = new this.Effect("");
            await this.player.applyEffect(this.effect);
        } catch (e) {
            console.error("[BanubaEngine] Failed to load modules:", e);
            throw e;
        }
    }

    // Set webcam as input source
    useWebcam(): void {
        if (!this.player) return;
        if (this.Webcam) {
            this.input = new this.Webcam();
            this.player.use(this.input);
            console.log("[BanubaEngine] Using webcam input");
        }
    }

    // Set a MediaStream as input source (from existing camera)
    useMediaStream(stream: MediaStream): void {
        if (!this.player) return;
        this.player.use(stream);
        console.log("[BanubaEngine] Using MediaStream input");
    }

    // Set an HTMLVideoElement as input source
    useVideoElement(video: HTMLVideoElement): void {
        if (!this.player) return;
        if (video.srcObject instanceof MediaStream) {
            this.player.use(video.srcObject);
        } else {
            this.player.use(video);
        }
        console.log("[BanubaEngine] Using video element input");
    }

    // Render the player output to a container element
    renderTo(container: HTMLElement | string): void {
        if (!this.player || !this.Dom) return;
        this.Dom.render(this.player, container);
    }

    // Apply an effect by ID
    async applyEffect(effectId: string): Promise<void> {
        if (!this.player || !this.modulesLoaded) {
            console.warn("[BanubaEngine] Cannot apply effect - not ready");
            return;
        }

        if (effectId === this.activeEffectId) return;

        // Note: we don't clear the effect completely because we use the base effect for backgrounds/colors
        if (effectId === "none") {
            this.activeEffectId = "none";
            // Instead of clearing the whole effect, just reset the specific morphs/colors
            if (this.effect) {
                try { await this.effect.evalJs('FaceMorphing.clear(); Lips.clear(); Eyes.clear(); Hair.clear(); Skin.clear();'); } catch(e) {}
            }
            return;
        }

        const config = BANUBA_EFFECTS.find(e => e.id === effectId);
        if (!config) {
            console.warn("[BanubaEngine] Unknown effect:", effectId);
            return;
        }

        try {
            if (config.type === "zip") {
                // Load zip-based effect natively
                this.effect = new this.Effect((config as BanubaZipEffectConfig).zipUrl);
                await this.player.applyEffect(this.effect);
            } else {
                // Ensure we have an effect loaded
                if (!this.effect) {
                    this.effect = new this.Effect("");
                    await this.player.applyEffect(this.effect);
                }
                
                // Clear previous morphs first
                try { await this.effect.evalJs('FaceMorphing.clear(); Lips.clear(); Eyes.clear(); Hair.clear(); Skin.clear();'); } catch(e) {}
                
                // Execute the new effect JS
                if ((config as BanubaEffectConfig).effectJs) {
                    try {
                        await this.effect.evalJs((config as BanubaEffectConfig).effectJs);
                    } catch (jsErr) {
                        console.warn("[BanubaEngine] Effect JS evaluation warning:", jsErr);
                    }
                }
            }

            this.activeEffectId = effectId;
            console.log("[BanubaEngine] Effect applied:", config.name);
        } catch (e) {
            console.error("[BanubaEngine] Failed to apply effect:", e);
        }
    }

    // Clear the current effect
    async clearEffect(): Promise<void> {
        if (!this.player) return;
        try {
            // Reset to empty base effect instead of totally clearing to preserve background APIs
            this.effect = new this.Effect("");
            await this.player.applyEffect(this.effect);
        } catch (e) {}
        this.activeEffectId = "none";
    }

    // Banuba Background APIs
    async setBackgroundBlur(radius: number): Promise<void> {
        if (!this.effect) return;
        try {
            await this.effect.evalJs(`Background.blur(${radius})`);
        } catch(e) { console.warn("[BanubaEngine] Background blur err:", e); }
    }

    async setBackgroundColor(rgba: string): Promise<void> {
        if (!this.effect) return;
        try {
            await this.effect.evalJs(`Background.color("${rgba}")`);
        } catch(e) { console.warn("[BanubaEngine] Background color err:", e); }
    }

    async clearBackground(): Promise<void> {
        if (!this.effect) return;
        try {
            await this.effect.evalJs(`Background.clear()`);
        } catch(e) { console.warn("[BanubaEngine] Background clear err:", e); }
    }

    // Start playback
    play(): void {
        if (!this.player) return;
        this.player.play();
    }

    // Pause playback
    pause(): void {
        if (!this.player) return;
        this.player.pause();
    }

    // Get the active effect ID
    getActiveEffectId(): string {
        return this.activeEffectId;
    }

    // Check if engine is ready
    isReady(): boolean {
        return this.isInitialized && this.modulesLoaded;
    }

    // Get the underlying player canvas
    getCanvas(): HTMLCanvasElement | null {
        return this.player?.canvas || null;
    }

    // Destroy the engine and free resources
    async destroy(): Promise<void> {
        await this.clearEffect();
        if (this.input && this.input.stop) {
            this.input.stop();
        }
        if (this.player) {
            await this.player.destroy();
        }
        this.player = null;
        this.effect = null;
        this.input = null;
        this.isInitialized = false;
        this.modulesLoaded = false;
        console.log("[BanubaEngine] Destroyed");
    }
}
