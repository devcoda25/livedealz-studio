// Background Processor - Background blur, virtual backgrounds, and segmentation
// Uses @mediapipe/tasks-vision ImageSegmenter for real-time person segmentation

import { BackgroundFilterConfig, BACKGROUND_FILTERS } from '../types';

export type BackgroundType = 'none' | 'blur' | 'solid' | 'image' | 'video' | 'ar';

// Lazy-loaded tasks-vision module
let visionTasks: typeof import("@mediapipe/tasks-vision") | null = null;

export class BackgroundProcessor {
    private ctx: CanvasRenderingContext2D | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private segmenter: any = null;
    private isInitialized: boolean = false;

    // Background settings
    private backgroundType: BackgroundType = 'none';
    private backgroundSource: HTMLImageElement | HTMLVideoElement | null = null;
    private blurAmount: number = 10;
    private solidColor: string = '#000000';

    // Offscreen canvases for compositing
    private maskCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
    private maskCtx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
    private blurredCanvas: HTMLCanvasElement | null = null;
    private blurredCtx: CanvasRenderingContext2D | null = null;

    // Segmentation result buffer
    private categoryMask: ImageData | null = null;

    constructor() { }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        console.log("[BackgroundProcessor] Initializing ImageSegmenter from tasks-vision...");

        try {
            if (!visionTasks) {
                visionTasks = await import("@mediapipe/tasks-vision");
            }

            const { ImageSegmenter, FilesetResolver } = visionTasks;

            // Load the WASM runtime for vision tasks
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            // Create the ImageSegmenter with selfie model
            this.segmenter = await ImageSegmenter.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite",
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
                outputCategoryMask: true,
                outputConfidenceMasks: false,
            });

            // Create offscreen canvases
            this.maskCanvas = document.createElement('canvas');
            this.maskCtx = this.maskCanvas.getContext('2d');

            this.blurredCanvas = document.createElement('canvas');
            this.blurredCtx = this.blurredCanvas.getContext('2d');

            this.isInitialized = true;
            console.log("[BackgroundProcessor] ImageSegmenter initialized successfully.");
        } catch (error) {
            console.error("[BackgroundProcessor] Failed to initialize ImageSegmenter:", error);
            this.isInitialized = true; // Mark initialized but without segmentation
        }
    }

    attach(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    async setBackground(filter: BackgroundFilterConfig): Promise<void> {
        this.backgroundType = filter.type;

        switch (filter.type) {
            case 'blur':
                this.blurAmount = filter.blurAmount || 10;
                this.backgroundSource = null;
                break;

            case 'solid':
                this.solidColor = filter.value || '#000000';
                this.backgroundSource = null;
                break;

            case 'image':
                if (filter.value) {
                    await this.loadImage(filter.value);
                }
                break;

            case 'video':
                if (filter.value) {
                    await this.loadVideo(filter.value);
                }
                break;

            case 'ar':
            default:
                this.backgroundType = 'none';
                this.backgroundSource = null;
                break;
        }

        console.log("[BackgroundProcessor] Background set to:", this.backgroundType);
    }

    private async loadImage(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this.backgroundSource = img;
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    private async loadVideo(url: string): Promise<void> {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous';
        video.loop = true;
        video.muted = true;

        return new Promise((resolve, reject) => {
            video.onloadeddata = () => {
                video.play();
                this.backgroundSource = video;
                resolve();
            };
            video.onerror = reject;
            video.src = url;
        });
    }

    process(video: HTMLVideoElement, outputCanvas: HTMLCanvasElement): void {
        if (!this.ctx || this.backgroundType === 'none') {
            this.ctx?.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
            return;
        }

        if (!this.segmenter || !this.isInitialized) {
            this.ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
            return;
        }

        const timestampMs = performance.now();

        try {
            // Run segmentation on the video frame
            const result = this.segmenter.segmentForVideo(video, timestampMs);
            const categoryMask = result.categoryMask;

            if (!categoryMask) {
                this.ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
                return;
            }

            // Get mask as canvas element for compositing
            const maskCanvas = categoryMask.getAsCanvasElement();
            this.compositeBackground(video, maskCanvas, outputCanvas);
        } catch (e) {
            console.warn("[BackgroundProcessor] Segmentation error:", e);
            this.ctx.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
        }
    }

    private compositeBackground(
        video: HTMLVideoElement,
        maskCanvas: HTMLCanvasElement | OffscreenCanvas,
        outputCanvas: HTMLCanvasElement
    ): void {
        if (!this.ctx) return;

        const width = outputCanvas.width;
        const height = outputCanvas.height;
        const ctx = this.ctx;

        switch (this.backgroundType) {
            case 'blur':
                this.renderBlurBackground(ctx, video, maskCanvas, width, height);
                break;

            case 'solid':
                this.renderSolidBackground(ctx, video, maskCanvas, width, height);
                break;

            case 'image':
            case 'video':
                this.renderMediaBackground(ctx, video, maskCanvas, width, height);
                break;

            default:
                ctx.drawImage(video, 0, 0, width, height);
        }
    }

    private renderBlurBackground(
        ctx: CanvasRenderingContext2D,
        video: HTMLVideoElement,
        maskCanvas: HTMLCanvasElement | OffscreenCanvas,
        width: number,
        height: number
    ): void {
        // Draw the full video frame first
        ctx.drawImage(video, 0, 0, width, height);

        // Create a blurred version in the offscreen canvas
        if (!this.blurredCanvas || !this.blurredCtx) return;
        this.blurredCanvas.width = width;
        this.blurredCanvas.height = height;

        this.blurredCtx.filter = `blur(${this.blurAmount}px)`;
        this.blurredCtx.drawImage(video, 0, 0, width, height);
        this.blurredCtx.filter = 'none';

        // Use the mask: keep person from original, replace background with blurred
        // The mask is white (255) for person, black (0) for background
        ctx.save();

        // Draw the mask to isolate the person (white = keep)
        // We need to invert: cut out the person area, then put blurred behind
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(maskCanvas, 0, 0, width, height);

        // Now draw blurred video behind what remains (the background area)
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(this.blurredCanvas, 0, 0, width, height);

        ctx.restore();
    }

    private renderSolidBackground(
        ctx: CanvasRenderingContext2D,
        video: HTMLVideoElement,
        maskCanvas: HTMLCanvasElement | OffscreenCanvas,
        width: number,
        height: number
    ): void {
        // Fill with solid color
        ctx.fillStyle = this.solidColor;
        ctx.fillRect(0, 0, width, height);

        // Draw person on top using the mask
        ctx.save();

        // Draw the video behind everything
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(video, 0, 0, width, height);

        // Cut out the background using mask (white = person, black = bg)
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(maskCanvas, 0, 0, width, height);

        ctx.restore();
    }

    private renderMediaBackground(
        ctx: CanvasRenderingContext2D,
        video: HTMLVideoElement,
        maskCanvas: HTMLCanvasElement | OffscreenCanvas,
        width: number,
        height: number
    ): void {
        if (!this.backgroundSource) {
            ctx.drawImage(video, 0, 0, width, height);
            return;
        }

        // Draw background image/video
        ctx.drawImage(this.backgroundSource, 0, 0, width, height);

        ctx.save();

        // Draw video behind
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(video, 0, 0, width, height);

        // Cut out background with mask
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(maskCanvas, 0, 0, width, height);

        ctx.restore();
    }

    // Update background blur intensity
    setBlurAmount(amount: number): void {
        this.blurAmount = Math.max(1, Math.min(50, amount));
    }

    getBlurAmount(): number {
        return this.blurAmount;
    }

    static getBackgroundFilters(): BackgroundFilterConfig[] {
        return BACKGROUND_FILTERS;
    }

    dispose(): void {
        this.segmenter?.close();
        this.segmenter = null;
        this.maskCanvas = null;
        this.maskCtx = null;
        this.blurredCanvas = null;
        this.blurredCtx = null;
        this.backgroundSource = null;
        this.categoryMask = null;
        this.isInitialized = false;
    }
}

export default BackgroundProcessor;
