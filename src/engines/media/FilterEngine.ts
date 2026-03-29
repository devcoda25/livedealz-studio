// Enhanced Filter Engine - TikTok-style filter system
// FaceMesh loaded dynamically to avoid SSR issues
let mpFaceMesh: typeof import("@mediapipe/face_mesh") | null = null;
type FaceMeshType = import("@mediapipe/face_mesh").FaceMesh;

// Import processors
import {
    ColorFilterProcessor,
    BackgroundProcessor,
    ChromaKeyProcessor,
    GestureProcessor,
    TimeEffectProcessor
} from './processors';

// Import types
import {
    FilterCategory,
    AnyFilterConfig,
    COLOR_FILTERS,
    BEAUTY_FILTERS,
    AR_FACE_FILTERS,
    BACKGROUND_FILTERS,
    GESTURE_FILTERS,
    TIME_EFFECTS,
    CHROMA_KEY_FILTERS,
    getFilterById,
    ColorFilterConfig,
    BackgroundFilterConfig,
    ChromaKeyConfig,
    GestureFilterConfig,
    TimeEffectConfig
} from './types';

// Legacy filter type for backward compatibility
export type FilterType = "None" | "Soft Glow" | "Warmth" | "Noir" | "Neon" | "Cat Ears" | "Cool Shades" | "Bunny Mask" | "Fox Mask" | "Pixelate" | "Sparkles";

export class FilterEngine {
    // MediaPipe instances
    private faceMesh: FaceMeshType | null = null;
    
    // Processors
    private colorProcessor: ColorFilterProcessor;
    private backgroundProcessor: BackgroundProcessor;
    private chromaKeyProcessor: ChromaKeyProcessor;
    private gestureProcessor: GestureProcessor;
    private timeEffectProcessor: TimeEffectProcessor;
    
    // Video and canvas
    private videoElement: HTMLVideoElement | null = null;
    private canvasElement: HTMLCanvasElement | null = null;
    private canvasCtx: CanvasRenderingContext2D | null = null;
    
    // State
    private isRunning = false;
    private animationFrameId: number | null = null;
    
    // Active filters by category
    private activeColorFilter: ColorFilterConfig | null = null;
    private activeARFilter: string = 'none'; // Legacy AR filter
    private activeBackgroundFilter: BackgroundFilterConfig | null = null;
    private activeChromaKeyFilter: ChromaKeyConfig | null = null;
    private activeGestureFilter: GestureFilterConfig | null = null;
    private activeTimeEffect: TimeEffectConfig | null = null;
    
    // Filter intensity (0-100)
    private colorIntensity: number = 100;

    constructor() {
        // Initialize processors
        this.colorProcessor = new ColorFilterProcessor();
        this.backgroundProcessor = new BackgroundProcessor();
        this.chromaKeyProcessor = new ChromaKeyProcessor();
        this.gestureProcessor = new GestureProcessor();
        this.timeEffectProcessor = new TimeEffectProcessor();
    }

    public async initialize(): Promise<void> {
        console.log("[FilterEngine] Initializing...");
        
        // Initialize FaceMesh for AR overlays
        await this.initializeFaceMesh();
        
        // Initialize background processor (tasks-vision segmentation)
        await this.backgroundProcessor.initialize();
        
        // Initialize gesture processor
        await this.gestureProcessor.initialize();
        
        console.log("[FilterEngine] Fully initialized.");
    }

    private async initializeFaceMesh(): Promise<void> {
        if (this.faceMesh) return;
        
        console.log("[FilterEngine] Initializing FaceMesh...");
        
        try {
            // Dynamic import to handle ESM/CJS properly
            if (!mpFaceMesh) {
                mpFaceMesh = await import("@mediapipe/face_mesh");
            }
            
            // @ts-ignore - handle different export styles between ESM/CJS
            const FaceMeshConstructor = mpFaceMesh?.FaceMesh || (mpFaceMesh as any)?.default?.FaceMesh || (mpFaceMesh as any)?.default;

            if (!FaceMeshConstructor) {
                console.warn("[FilterEngine] FaceMesh constructor not available, skipping AR filters");
                return;
            }

            this.faceMesh = new FaceMeshConstructor({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
                },
            });
        } catch (e) {
            console.warn("[FilterEngine] Failed to initialize FaceMesh, AR filters unavailable:", e);
            return;
        }

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        this.faceMesh.onResults(this.onFaceMeshResults.bind(this));
    }

    public attach(video: HTMLVideoElement, canvas: HTMLCanvasElement): void {
        this.videoElement = video;
        this.canvasElement = canvas;
        this.canvasCtx = canvas.getContext("2d");
        
        // Attach to processors
        if (this.canvasCtx) {
            this.colorProcessor.attach(this.canvasCtx);
            this.backgroundProcessor.attach(this.canvasCtx);
            this.chromaKeyProcessor.attach(this.canvasCtx);
        }
        
        if (this.videoElement && this.canvasCtx) {
            this.timeEffectProcessor.attach(this.canvasCtx, this.videoElement);
        }
        
        console.log("[FilterEngine] Attached to video/canvas.");
    }

    // ===== Filter Setters =====

    public setColorFilter(filterId: string | null): void {
        if (!filterId || filterId === 'none') {
            this.activeColorFilter = null;
            this.colorProcessor.setFilter(null);
            return;
        }
        
        const filter = COLOR_FILTERS.find(f => f.id === filterId) || 
                       BEAUTY_FILTERS.find(f => f.id === filterId);
        
        if (filter) {
            this.activeColorFilter = filter;
            this.colorProcessor.setFilter(filter);
            this.colorProcessor.setIntensity(this.colorIntensity);
            console.log("[FilterEngine] Color filter set to:", filter.name);
        }
    }

    public async setBackgroundFilter(filterId: string | null): Promise<void> {
        if (!filterId || filterId === 'bg_none') {
            this.activeBackgroundFilter = null;
            return;
        }
        
        const filter = BACKGROUND_FILTERS.find(f => f.id === filterId);
        
        if (filter) {
            this.activeBackgroundFilter = filter;
            await this.backgroundProcessor.setBackground(filter);
            console.log("[FilterEngine] Background filter set to:", filter.name);
        }
    }

    public setChromaKeyFilter(filterId: string | null): void {
        if (!filterId || filterId === 'chroma_off') {
            this.activeChromaKeyFilter = null;
            this.chromaKeyProcessor.setEnabled(false);
            return;
        }
        
        const filter = CHROMA_KEY_FILTERS.find(f => f.id === filterId);
        
        if (filter) {
            this.activeChromaKeyFilter = filter;
            this.chromaKeyProcessor.setFilter(filter);
            console.log("[FilterEngine] Chroma key filter set to:", filter.name);
        }
    }

    public setGestureFilter(filterId: string | null): void {
        if (!filterId) {
            this.activeGestureFilter = null;
            this.gestureProcessor.setFilter(null);
            return;
        }
        
        const filter = GESTURE_FILTERS.find(f => f.id === filterId);
        
        if (filter) {
            this.activeGestureFilter = filter;
            this.gestureProcessor.setFilter(filter);
            console.log("[FilterEngine] Gesture filter set to:", filter.name);
        }
    }

    public setTimeEffect(filterId: string | null): void {
        if (!filterId || filterId === 'time_normal') {
            this.activeTimeEffect = null;
            this.timeEffectProcessor.setEffect(null);
            return;
        }
        
        const filter = TIME_EFFECTS.find(f => f.id === filterId);
        
        if (filter) {
            this.activeTimeEffect = filter;
            this.timeEffectProcessor.setEffect(filter);
            console.log("[FilterEngine] Time effect set to:", filter.name);
        }
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
        this.colorProcessor.setIntensity(this.colorIntensity);
        console.log("[FilterEngine] Color intensity set to:", this.colorIntensity);
    }

    public getColorIntensity(): number {
        return this.colorIntensity;
    }

    // Set AR filter by ID (new API)
    public setARFilter(filterId: string | null): void {
        if (!filterId || filterId === 'none') {
            this.activeARFilter = 'none';
            return;
        }
        this.activeARFilter = filterId;
    }

    // ===== Processing =====

    public async start(): Promise<void> {
        if (this.isRunning) return;
        if (!this.faceMesh) await this.initialize();

        this.isRunning = true;
        this.loop();
    }

    public stop(): void {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Clear canvas
        if (this.canvasCtx && this.canvasElement) {
            this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
    }

    private async loop(): Promise<void> {
        if (!this.isRunning || !this.videoElement || !this.canvasElement) return;

        // Wait for video to be ready
        if (this.videoElement.readyState < 2) {
            this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
            return;
        }

        const video = this.videoElement;
        const canvas = this.canvasElement;
        const ctx = this.canvasCtx;

        if (!ctx) {
            this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
            return;
        }

        // Resize canvas to match video if needed
        if (video.videoWidth && video.videoHeight) {
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }
        }

        // Step 1: Draw base frame (background/chroma or raw video)
        if (this.activeBackgroundFilter) {
            this.backgroundProcessor.process(video, canvas);
        } else if (this.activeChromaKeyFilter) {
            this.chromaKeyProcessor.process(video, canvas);
        } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Step 2: Apply color grading via WebGL shaders (reads from canvas)
        if (this.activeColorFilter && this.activeColorFilter.id !== 'none') {
            this.colorProcessor.applyToVideoFrame(canvas);
        }

        // Step 3: Run FaceMesh for AR overlays (uses video for detection, draws to canvas)
        if (this.faceMesh) {
            try {
                await this.faceMesh.send({ image: video });
            } catch (e) {
                // FaceMesh error is non-fatal
            }
        }

        // Step 4: Process gesture detection
        if (this.activeGestureFilter) {
            await this.gestureProcessor.process(video);
        }

        // Step 5: Process time effect
        if (this.timeEffectProcessor.getEffectType() !== 'normal') {
            this.timeEffectProcessor.process(canvas);
        }

        this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    private onFaceMeshResults(results: { multiFaceLandmarks?: unknown[] }): void {
        if (!this.canvasCtx || !this.canvasElement) return;

        const ctx = this.canvasCtx;
        const width = this.canvasElement.width;
        const height = this.canvasElement.height;

        // Draw AR overlays on top of the existing frame
        if (results.multiFaceLandmarks && this.activeARFilter !== "none") {
            for (const landmarks of results.multiFaceLandmarks) {
                this.renderAREffect(ctx, landmarks as any[], width, height);
            }
        }
    }

    private renderAREffect(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number): void {
        const filter = this.activeARFilter;

        if (filter === "cat_ears") {
            this.drawCatEars(ctx, landmarks, width, height);
        } else if (filter === "dog_ears") {
            this.drawDogEars(ctx, landmarks, width, height);
        } else if (filter === "crown") {
            this.drawCrown(ctx, landmarks, width, height);
        } else if (filter === "horns") {
            this.drawHorns(ctx, landmarks, width, height);
        } else if (filter === "butterfly") {
            this.drawButterfly(ctx, landmarks, width, height);
        } else if (filter === "heart_glasses") {
            this.drawHeartGlasses(ctx, landmarks, width, height);
        } else if (filter === "aviators") {
            this.drawAviators(ctx, landmarks, width, height);
        } else if (filter === "pixel_glasses") {
            this.drawPixelGlasses(ctx, landmarks, width, height);
        } else if (filter === "fire") {
            this.drawFire(ctx, landmarks, width, height);
        } else if (filter === "rainbow") {
            this.drawRainbow(ctx, landmarks, width, height);
        } else if (filter === "sparkles") {
            this.drawSparkles(ctx, landmarks, width, height);
        } else if (filter === "hearts") {
            this.drawHearts(ctx, landmarks, width, height);
        } else if (filter === "snow") {
            this.drawSnow(ctx, landmarks, width, height);
        } else if (filter === "bunnymask") {
            this.drawBunnyMask(ctx, landmarks, width, height);
        } else if (filter === "foxmask") {
            this.drawFoxMask(ctx, landmarks, width, height);
        } else if (filter === "neon") {
            this.drawNeonFace(ctx, landmarks, width, height);
        }
    }

    // ===== AR Effect Renderers =====

    private drawCatEars(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const topHead = landmarks[10];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = topHead.x * w;
        const cy = topHead.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2.5;

        ctx.fillStyle = "#FFC0CB";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;

        // Left Ear
        ctx.beginPath();
        ctx.moveTo(cx - scale * 0.4, cy);
        ctx.lineTo(cx - scale * 0.6, cy - scale * 0.5);
        ctx.lineTo(cx - scale * 0.1, cy - scale * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Right Ear
        ctx.beginPath();
        ctx.moveTo(cx + scale * 0.4, cy);
        ctx.lineTo(cx + scale * 0.6, cy - scale * 0.5);
        ctx.lineTo(cx + scale * 0.1, cy - scale * 0.1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    private drawDogEars(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const topHead = landmarks[10];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = topHead.x * w;
        const cy = topHead.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2.5;

        ctx.fillStyle = "#8B4513";
        ctx.strokeStyle = "#5D2906";
        ctx.lineWidth = 3;

        // Floppy dog ears
        ctx.beginPath();
        ctx.ellipse(cx - scale * 0.45, cy - scale * 0.1, scale * 0.15, scale * 0.3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(cx + scale * 0.45, cy - scale * 0.1, scale * 0.15, scale * 0.3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    private drawCrown(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const topHead = landmarks[10];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = topHead.x * w;
        const cy = topHead.y * h - 20;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        ctx.fillStyle = "#FFD700";
        ctx.strokeStyle = "#B8860B";
        ctx.lineWidth = 2;

        // Crown base
        ctx.beginPath();
        ctx.moveTo(cx - scale * 0.4, cy);
        ctx.lineTo(cx - scale * 0.4, cy - scale * 0.25);
        ctx.lineTo(cx - scale * 0.2, cy - scale * 0.15);
        ctx.lineTo(cx, cy - scale * 0.4);
        ctx.lineTo(cx + scale * 0.2, cy - scale * 0.15);
        ctx.lineTo(cx + scale * 0.4, cy - scale * 0.25);
        ctx.lineTo(cx + scale * 0.4, cy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gems
        ctx.fillStyle = "#FF0000";
        ctx.beginPath();
        ctx.arc(cx, cy - scale * 0.25, scale * 0.05, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawHorns(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const topHead = landmarks[10];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = topHead.x * w;
        const cy = topHead.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        ctx.fillStyle = "#8B0000";
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;

        // Left horn
        ctx.beginPath();
        ctx.moveTo(cx - scale * 0.3, cy - scale * 0.1);
        ctx.quadraticCurveTo(cx - scale * 0.5, cy - scale * 0.4, cx - scale * 0.2, cy - scale * 0.5);
        ctx.quadraticCurveTo(cx - scale * 0.1, cy - scale * 0.3, cx - scale * 0.2, cy - scale * 0.1);
        ctx.fill();
        ctx.stroke();

        // Right horn
        ctx.beginPath();
        ctx.moveTo(cx + scale * 0.3, cy - scale * 0.1);
        ctx.quadraticCurveTo(cx + scale * 0.5, cy - scale * 0.4, cx + scale * 0.2, cy - scale * 0.5);
        ctx.quadraticCurveTo(cx + scale * 0.1, cy - scale * 0.3, cx + scale * 0.2, cy - scale * 0.1);
        ctx.fill();
        ctx.stroke();
    }

    private drawButterfly(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const topHead = landmarks[10];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = topHead.x * w;
        const cy = topHead.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        // Wing colors
        const gradient = ctx.createLinearGradient(cx - scale * 0.5, cy, cx + scale * 0.5, cy);
        gradient.addColorStop(0, '#FF69B4');
        gradient.addColorStop(0.5, '#9370DB');
        gradient.addColorStop(1, '#00BFFF');

        ctx.fillStyle = gradient;

        // Left wings
        ctx.beginPath();
        ctx.ellipse(cx - scale * 0.3, cy - scale * 0.15, scale * 0.2, scale * 0.25, -0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(cx - scale * 0.5, cy, scale * 0.2, scale * 0.15, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Right wings
        ctx.beginPath();
        ctx.ellipse(cx + scale * 0.3, cy - scale * 0.15, scale * 0.2, scale * 0.25, 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(cx + scale * 0.5, cy, scale * 0.2, scale * 0.15, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawHeartGlasses(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        ctx.fillStyle = "#FF1493";
        ctx.strokeStyle = "#FF69B4";
        ctx.lineWidth = 2;

        // Left lens (heart)
        this.drawHeart(ctx, cx - scale * 0.25, cy, scale * 0.2);
        
        // Right lens (heart)
        this.drawHeart(ctx, cx + scale * 0.25, cy, scale * 0.2);
    }

    private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
        ctx.beginPath();
        ctx.moveTo(x, y + size * 0.3);
        ctx.bezierCurveTo(x - size * 0.5, y - size * 0.3, x - size * 0.5, y - size * 0.8, x, y - size * 0.5);
        ctx.bezierCurveTo(x + size * 0.5, y - size * 0.8, x + size * 0.5, y - size * 0.3, x, y + size * 0.3);
        ctx.fill();
        ctx.stroke();
    }

    private drawAviators(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        // Lens gradient
        const gradient = ctx.createLinearGradient(cx - scale * 0.4, cy - scale * 0.1, cx + scale * 0.4, cy + scale * 0.1);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(0.5, '#4a4a4a');
        gradient.addColorStop(1, '#1a1a1a');

        ctx.fillStyle = gradient;
        ctx.strokeStyle = "#C0C0C0";
        ctx.lineWidth = 2;

        // Left lens
        ctx.beginPath();
        ctx.ellipse(cx - scale * 0.25, cy, scale * 0.2, scale * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right lens
        ctx.beginPath();
        ctx.ellipse(cx + scale * 0.25, cy, scale * 0.2, scale * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Bridge
        ctx.beginPath();
        ctx.moveTo(cx - scale * 0.05, cy);
        ctx.lineTo(cx + scale * 0.05, cy);
        ctx.stroke();
    }

    private drawPixelGlasses(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 1.8;

        ctx.fillStyle = "#00FF00";
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 1;

        // Pixelated lenses
        const pixelSize = scale * 0.08;
        
        // Left lens
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(cx - scale * 0.35 + i * pixelSize, cy - scale * 0.1 + j * pixelSize, pixelSize - 1, pixelSize - 1);
            }
        }
        
        // Right lens
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                ctx.fillRect(cx + scale * 0.05 + i * pixelSize, cy - scale * 0.1 + j * pixelSize, pixelSize - 1, pixelSize - 1);
            }
        }
    }

    private drawFire(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const chin = landmarks[152];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = chin.x * w;
        const cy = chin.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        // Fire gradient
        const gradient = ctx.createLinearGradient(cx, cy, cx, cy - scale * 0.8);
        gradient.addColorStop(0, '#FF4500');
        gradient.addColorStop(0.5, '#FF8C00');
        gradient.addColorStop(1, '#FFD700');

        ctx.fillStyle = gradient;
        
        // Animated flames
        const time = Date.now() / 100;
        
        for (let i = 0; i < 5; i++) {
            const offsetX = Math.sin(time + i) * scale * 0.1;
            ctx.beginPath();
            ctx.moveTo(cx - scale * 0.2 + i * scale * 0.1 + offsetX, cy);
            ctx.quadraticCurveTo(
                cx - scale * 0.15 + i * scale * 0.1 + offsetX, 
                cy - scale * 0.4, 
                cx - scale * 0.1 + i * scale * 0.1 + offsetX, 
                cy - scale * 0.6 - Math.abs(Math.sin(time * 2 + i)) * scale * 0.2
            );
            ctx.quadraticCurveTo(
                cx + i * scale * 0.1 + offsetX, 
                cy - scale * 0.4, 
                cx + scale * 0.1 + i * scale * 0.1 + offsetX, 
                cy
            );
            ctx.fill();
        }
    }

    private drawRainbow(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 3;

        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        
        // Rainbow arcs around face
        for (let i = 0; i < colors.length; i++) {
            ctx.strokeStyle = colors[i];
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, scale * 0.3 + i * 3, Math.PI, 0);
            ctx.stroke();
        }
    }

    private drawSparkles(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        ctx.fillStyle = "#FFFFFF";
        
        // Random sparkles around face
        const time = Date.now() / 200;
        
        for (let i = 0; i < 15; i++) {
            const angle = (i / 15) * Math.PI * 2 + time;
            const radius = scale * 0.4 + Math.sin(time * 2 + i) * scale * 0.1;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            const size = 2 + Math.sin(time * 3 + i) * 2;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawHearts(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        ctx.fillStyle = "#FF1493";
        
        // Floating hearts
        const time = Date.now() / 500;
        
        for (let i = 0; i < 5; i++) {
            const yOffset = ((time + i * 0.2) % 1) * scale * 0.8;
            const xOffset = Math.sin(time * 2 + i) * scale * 0.2;
            
            const heartY = cy - scale * 0.3 - yOffset;
            const heartX = cx + xOffset + (i - 2) * scale * 0.2;
            const heartSize = scale * 0.08;
            
            if (heartY > cy - scale * 0.8) {
                this.drawHeart(ctx, heartX, heartY, heartSize);
            }
        }
    }

    private drawSnow(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        ctx.fillStyle = "#FFFFFF";
        
        // Falling snowflakes
        const time = Date.now() / 300;
        
        for (let i = 0; i < 20; i++) {
            const x = (i * 37 + cx) % w;
            const y = ((i * 23 + time * 50) % (scale * 1.5)) + cy - scale * 0.5;
            const size = 1 + (i % 3);
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    private drawBunnyMask(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const topHead = landmarks[10];
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        // White bunny mask
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#FFC0CB";
        ctx.lineWidth = 2;

        // Mask shape
        ctx.beginPath();
        ctx.ellipse(cx, cy + scale * 0.05, scale * 0.4, scale * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nose
        ctx.fillStyle = "#FFB6C1";
        ctx.beginPath();
        ctx.ellipse(cx, cy, scale * 0.08, scale * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ears
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#FFC0CB";
        
        // Left ear
        ctx.beginPath();
        ctx.ellipse(cx - scale * 0.15, cy - scale * 0.5, scale * 0.1, scale * 0.35, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Right ear
        ctx.beginPath();
        ctx.ellipse(cx + scale * 0.15, cy - scale * 0.5, scale * 0.1, scale * 0.35, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    private drawFoxMask(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = nose.x * w;
        const cy = nose.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        // Orange fox mask
        ctx.fillStyle = "#FF6600";
        ctx.strokeStyle = "#CC3300";
        ctx.lineWidth = 2;

        // Mask shape
        ctx.beginPath();
        ctx.moveTo(cx - scale * 0.4, cy - scale * 0.2);
        ctx.lineTo(cx - scale * 0.2, cy - scale * 0.3);
        ctx.lineTo(cx, cy + scale * 0.1);
        ctx.lineTo(cx + scale * 0.2, cy - scale * 0.3);
        ctx.lineTo(cx + scale * 0.4, cy - scale * 0.2);
        ctx.lineTo(cx + scale * 0.3, cy + scale * 0.15);
        ctx.lineTo(cx, cy + scale * 0.25);
        ctx.lineTo(cx - scale * 0.3, cy + scale * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White cheeks
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.ellipse(cx - scale * 0.2, cy + scale * 0.05, scale * 0.12, scale * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + scale * 0.2, cy + scale * 0.05, scale * 0.12, scale * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Nose
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(cx, cy + scale * 0.08, scale * 0.04, 0, Math.PI * 2);
        ctx.fill();
    }

    private drawNeonFace(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number): void {
        // Draw neon outline around face
        const jaw = [ landmarks[152], landmarks[377], landmarks[400], landmarks[148], 
                      landmarks[176], landmarks[149], landmarks[150], landmarks[169], 
                      landmarks[135], landmarks[170], landmarks[140], landmarks[171], 
                      landmarks[175], landmarks[396], landmarks[369], landmarks[395], 
                      landmarks[394],364,365,397,288,361,323,454,356,389,251,284,332,297,338,10,109,67,54,21,162,127];
        
        if (jaw.length < 3) return;

        const leftEye = landmarks[33];
        const rightEye = landmarks[263];
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2;

        // Neon glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#FF00FF";
        ctx.strokeStyle = "#FF00FF";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(jaw[0].x * w, jaw[0].y * h);
        for (let i = 1; i < jaw.length; i++) {
            ctx.lineTo(jaw[i].x * w, jaw[i].y * h);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.shadowBlur = 0;
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
        this.colorProcessor.dispose();
        this.backgroundProcessor.dispose();
        this.chromaKeyProcessor.dispose();
        this.gestureProcessor.dispose();
        this.timeEffectProcessor.dispose();
    }
}

export default FilterEngine;
