// Background Processor - Background blur, virtual backgrounds, and segmentation
// SelfieSegmentation loaded dynamically
let mpSelfie: typeof import("@mediapipe/selfie_segmentation") | null = null;
import { BackgroundFilterConfig, BACKGROUND_FILTERS } from '../types';

export type BackgroundType = 'none' | 'blur' | 'solid' | 'image' | 'video' | 'ar';

export class BackgroundProcessor {
    private ctx: CanvasRenderingContext2D | null = null;
    private selfieSegmentation: any = null;
    private isInitialized: boolean = false;
    private isProcessing: boolean = false;

    // Background settings
    private backgroundType: BackgroundType = 'none';
    private backgroundSource: HTMLImageElement | HTMLVideoElement | null = null;
    private blurAmount: number = 10;
    private solidColor: string = '#000000';

    // Segmentation mask
    private segmentationMask: ImageBitmap | null = null;
    private maskCanvas: OffscreenCanvas | null = null;
    private maskCtx: OffscreenCanvasRenderingContext2D | null = null;

    constructor() { }

    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        console.log("Initializing BackgroundProcessor with SelfieSegmentation...");

        try {
            // Dynamic import for ESM/CJS compatibility
            if (!mpSelfie) {
                mpSelfie = await import("@mediapipe/selfie_segmentation");
            }
            
            // @ts-ignore - handle different export styles
            const SelfieSegmentationConstructor = mpSelfie?.SelfieSegmentation || mpSelfie?.default?.SelfieSegmentation;

            if (!SelfieSegmentationConstructor) {
                console.warn("SelfieSegmentation not available, background effects disabled");
                this.isInitialized = true; // Mark as initialized (just without segmentation)
                return;
            }

            this.selfieSegmentation = new SelfieSegmentationConstructor({
                locateFile: (file: string) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
                },
            });

            this.selfieSegmentation.setOptions({
                modelSelection: 1, // 1 = landscape/selfie, 0 = general
            });

            this.selfieSegmentation.onResults(this.onSegmentationResults.bind(this));

            // Create mask canvas
            this.maskCanvas = new OffscreenCanvas(256, 256);
            this.maskCtx = this.maskCanvas.getContext('2d');

            this.isInitialized = true;
            console.log("BackgroundProcessor initialized.");
        } catch (error) {
            console.error("Failed to initialize SelfieSegmentation:", error);
            throw error;
        }
    }

    attach(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    private onSegmentationResults(results: any): void {
        if (!results.segmentationMask) return;

        // Create ImageBitmap from segmentation mask
        createImageBitmap(results.segmentationMask).then(bitmap => {
            this.segmentationMask = bitmap;
        });
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

        console.log("Background set to:", this.backgroundType);
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
        if (!this.ctx || !this.isInitialized || this.backgroundType === 'none') {
            // Just draw the video
            this.ctx?.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
            return;
        }

        // Send frame to segmentation
        if (!this.isProcessing) {
            this.isProcessing = true;
            this.selfieSegmentation.send({ image: video }).then(() => {
                this.isProcessing = false;
            }).catch((err: Error) => {
                console.warn("Segmentation error:", err);
                this.isProcessing = false;
            });
        }

        // Apply background effect
        this.applyBackground(video, outputCanvas);
    }

    private applyBackground(video: HTMLVideoElement, outputCanvas: HTMLCanvasElement): void {
        if (!this.ctx) return;

        const width = outputCanvas.width;
        const height = outputCanvas.height;

        switch (this.backgroundType) {
            case 'blur':
                this.applyBlurBackground(video, width, height);
                break;

            case 'solid':
                this.applySolidBackground(video, width, height);
                break;

            case 'image':
            case 'video':
                this.applyMediaBackground(video, width, height);
                break;

            default:
                this.ctx.drawImage(video, 0, 0, width, height);
        }
    }

    private applyBlurBackground(video: HTMLVideoElement, width: number, height: number): void {
        if (!this.ctx || !this.segmentationMask) {
            this.ctx?.drawImage(video, 0, 0, width, height);
            return;
        }

        // Create blurred version
        const blurredCanvas = document.createElement('canvas');
        blurredCanvas.width = width;
        blurredCanvas.height = height;
        const blurredCtx = blurredCanvas.getContext('2d');

        if (!blurredCtx) return;

        // Draw video with blur
        blurredCtx.filter = `blur(${this.blurAmount}px)`;
        blurredCtx.drawImage(video, 0, 0, width, height);
        blurredCtx.filter = 'none';

        // Draw original video
        this.ctx.drawImage(video, 0, 0, width, height);

        // Composite using mask
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-out';

        // Draw the segmentation mask scaled to canvas
        this.ctx.drawImage(this.segmentationMask, 0, 0, width, height);

        this.ctx.restore();

        // Draw blurred background where person is NOT
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-over';
        this.ctx.drawImage(blurredCanvas, 0, 0);
        this.ctx.restore();
    }

    private applySolidBackground(video: HTMLVideoElement, width: number, height: number): void {
        if (!this.ctx || !this.segmentationMask) {
            this.ctx?.drawImage(video, 0, 0, width, height);
            return;
        }

        // Fill background
        this.ctx.fillStyle = this.solidColor;
        this.ctx.fillRect(0, 0, width, height);

        // Draw person on top
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-over';
        this.ctx.drawImage(video, 0, 0, width, height);

        // Use mask
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.drawImage(this.segmentationMask, 0, 0, width, height);
        this.ctx.restore();
    }

    private applyMediaBackground(video: HTMLVideoElement, width: number, height: number): void {
        if (!this.ctx || !this.segmentationMask || !this.backgroundSource) {
            this.ctx?.drawImage(video, 0, 0, width, height);
            return;
        }

        // Draw background media
        this.ctx.drawImage(this.backgroundSource, 0, 0, width, height);

        // Draw person on top using mask
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'destination-over';
        this.ctx.drawImage(video, 0, 0, width, height);

        // Use mask
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.drawImage(this.segmentationMask, 0, 0, width, height);
        this.ctx.restore();
    }

    // Update background blur intensity
    setBlurAmount(amount: number): void {
        this.blurAmount = Math.max(1, Math.min(50, amount));
    }

    getBlurAmount(): number {
        return this.blurAmount;
    }

    // Static methods for filter list
    static getBackgroundFilters(): BackgroundFilterConfig[] {
        return BACKGROUND_FILTERS;
    }

    dispose(): void {
        this.selfieSegmentation = null;
        this.segmentationMask = null;
        this.maskCanvas = null;
        this.maskCtx = null;
        this.backgroundSource = null;
        this.isInitialized = false;
    }
}

export default BackgroundProcessor;
