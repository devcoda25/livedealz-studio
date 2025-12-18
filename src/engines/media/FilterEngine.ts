import * as mpFaceMesh from "@mediapipe/face_mesh";
import type { FaceMesh, Results } from "@mediapipe/face_mesh";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export type FilterType = "None" | "Soft Glow" | "Warmth" | "Noir" | "Neon" | "Cat Ears" | "Cool Shades" | "Bunny Mask" | "Fox Mask" | "Pixelate" | "Sparkles";

export class FilterEngine {
    private faceMesh: FaceMesh | null = null;
    private videoElement: HTMLVideoElement | null = null;
    private canvasElement: HTMLCanvasElement | null = null;
    private canvasCtx: CanvasRenderingContext2D | null = null;
    private activeFilter: FilterType = "None";
    private isRunning = false;
    private animationFrameId: number | null = null;

    // Assets (images)
    private assets: Record<string, HTMLImageElement> = {};

    constructor() {
        this.createAssets();
    }

    private createAssets() {
        // We can load real images here later. For now, we will draw procedurally or use emojis/shapes?
        // Using canvas primitives for MVP to ensure it works without external 404s.
    }

    public async initialize() {
        if (this.faceMesh) return;

        console.log("Initializing FilterEngine FaceMesh...");
        // Handle CJS/ESM interop
        // @ts-ignore
        const FaceMeshConstructor = mpFaceMesh.FaceMesh || (mpFaceMesh as any).default?.FaceMesh || (mpFaceMesh as any).default;

        if (!FaceMeshConstructor) {
            console.error("Failed to load FaceMesh constructor", mpFaceMesh);
            throw new Error("FaceMesh constructor not found");
        }

        this.faceMesh = new FaceMeshConstructor({
            locateFile: (file: string) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            },
        });

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
        });

        this.faceMesh.onResults(this.onResults.bind(this));
        console.log("FilterEngine initialized.");
    }

    public attach(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        this.videoElement = video;
        this.canvasElement = canvas;
        this.canvasCtx = canvas.getContext("2d");
        console.log("FilterEngine attached to video/canvas.");
    }

    public setFilter(filter: FilterType) {
        console.log("FilterEngine setFilter:", filter);
        this.activeFilter = filter;
    }

    public async start() {
        if (this.isRunning) return;
        if (!this.faceMesh) await this.initialize();

        this.isRunning = true;
        this.loop();
    }

    public stop() {
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

    private async loop() {
        if (!this.isRunning || !this.videoElement || !this.faceMesh) return;

        // Wait for video to be ready
        if (this.videoElement.readyState < 2) {
            this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
            return;
        }

        try {
            await this.faceMesh.send({ image: this.videoElement });
        } catch (e) {
            console.warn("FaceMesh send error:", e);
        }

        // Loop continues in onResults (indirectly? No, faceMesh.send is async but onResults is callback).
        // Actually we should loop AFTER send completes?
        // MediaPipe recommends: await send(), then requestAnimationFrame.
        this.animationFrameId = requestAnimationFrame(this.loop.bind(this));
    }

    private onResults(results: Results) {
        if (!this.canvasCtx || !this.canvasElement) return;

        const ctx = this.canvasCtx;
        const width = this.canvasElement.width;
        const height = this.canvasElement.height;

        // 1. Clear or Draw Background
        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // If we want to draw the video frame ourselves (for "Soft Glow" etc applied to the whole frame):
        // ctx.drawImage(results.image, 0, 0, width, height); // This draws the raw video.
        // BUT usually the <video> element is visible behind the canvas?
        // If we use AR overlay, we only draw the AR items on transparent canvas.
        // If we use "Filter" (color grading), we can use CSS on <video> (faster) OR draw here.

        // Let's assume <video> is visible. We draw ONLY overlays.
        // EXCEPT for filters that require pixel manipulation (Pixelate, Noir if not CSS).
        // Implementation: "Soft Glow", "Warmth", "Noir" are CSS filters in `page.tsx`.
        // "Cat Ears", "Glasses" are AR overlays drawn here.

        if (results.multiFaceLandmarks) {
            for (const landmarks of results.multiFaceLandmarks) {
                this.renderEffect(ctx, landmarks, width, height);
            }
        }
        ctx.restore();
    }

    private renderEffect(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) {
        const filter = this.activeFilter;

        if (filter === "Cat Ears") {
            this.drawCatEars(ctx, landmarks, width, height);
        } else if (filter === "Cool Shades") {
            this.drawGlasses(ctx, landmarks, width, height);
        } else if (filter === "Bunny Mask") {
            this.drawBunnyMask(ctx, landmarks, width, height);
        } else if (filter === "Fox Mask") {
            this.drawFoxMask(ctx, landmarks, width, height);
        } else if (filter === "Sparkles") {
            this.drawSparkles(ctx, landmarks, width, height);
        } else if (filter === "Neon") {
            // Draw neon outline of face
            this.drawNeonFace(ctx, landmarks, width, height);
        }
    }

    // --- Renderers ---

    private drawCatEars(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
        // Landmark 10 is top of forehead.
        // Landmarks 33 (left eye outer) and 263 (right eye outer) give scale/rotation.

        // Simple Triangle Ears
        const topHead = landmarks[10];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = topHead.x * w;
        const cy = topHead.y * h;
        const scale = Math.abs(rightEye.x - leftEye.x) * w * 2.5; // Roughly head width

        ctx.fillStyle = "#FFC0CB"; // Pink
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;

        // Left Ear
        ctx.beginPath();
        ctx.moveTo(cx - scale * 0.4, cy); // Base left
        ctx.lineTo(cx - scale * 0.6, cy - scale * 0.5); // Tip
        ctx.lineTo(cx - scale * 0.1, cy - scale * 0.1); // Base inner
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

    private drawGlasses(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
        // Center between eyes (168)
        const center = landmarks[168];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const cx = center.x * w;
        const cy = center.y * h;
        const faceWidth = Math.abs(rightEye.x - leftEye.x) * w;

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.strokeStyle = "#FFD700"; // Gold
        ctx.lineWidth = 4;

        // Draw two circles
        const radius = faceWidth * 0.3;

        // Left Lens
        ctx.beginPath();
        ctx.arc(cx - radius, cy, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Right Lens
        ctx.beginPath();
        ctx.arc(cx + radius, cy, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Bridge
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.1, cy);
        ctx.lineTo(cx + radius * 0.1, cy);
        ctx.stroke();
    }

    private drawBunnyMask(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
        // Draw a white mask over upper face
        // nose tip: 1
        const nose = landmarks[1];
        const leftEye = landmarks[33];
        const rightEye = landmarks[263];

        const nx = nose.x * w;
        const ny = nose.y * h;
        const width = Math.abs(rightEye.x - leftEye.x) * w * 4;

        // Draw whiskers?
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nx - 20, ny);
        ctx.lineTo(nx - 80, ny - 10);
        ctx.moveTo(nx - 20, ny + 5);
        ctx.lineTo(nx - 80, ny + 20);

        ctx.moveTo(nx + 20, ny);
        ctx.lineTo(nx + 80, ny - 10);
        ctx.moveTo(nx + 20, ny + 5);
        ctx.lineTo(nx + 80, ny + 20);
        ctx.stroke();

        // Draw Ears (Long)
        const topHead = landmarks[10];
        const cx = topHead.x * w;
        const cy = topHead.y * h;

        ctx.fillStyle = "white";
        ctx.strokeStyle = "pink";

        // Left Ear
        ctx.beginPath();
        ctx.ellipse(cx - 30, cy - 80, 20, 60, -0.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Right Ear
        ctx.beginPath();
        ctx.ellipse(cx + 30, cy - 80, 20, 60, 0.2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }

    private drawFoxMask(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
        // Orange mask around eyes
        const center = landmarks[168];
        const cx = center.x * w;
        const cy = center.y * h;

        ctx.fillStyle = "rgba(255, 140, 0, 0.7)"; // Orange transparent
        ctx.beginPath();
        ctx.arc(cx, cy, 80, 0, Math.PI * 2); // Simple circle mask for now
        ctx.fill();
    }

    private drawNeonFace(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
        // Use connectFaceMesh or similar if available, else just dots
        ctx.fillStyle = "#00FF00";
        for (const pt of landmarks) {
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, 1, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    private drawSparkles(ctx: CanvasRenderingContext2D, landmarks: any[], w: number, h: number) {
        // Random sparkles around head
        const topHead = landmarks[10];
        const cx = topHead.x * w;
        const cy = topHead.y * h;

        const time = Date.now() / 200;

        ctx.fillStyle = "yellow";
        for (let i = 0; i < 5; i++) {
            const offset = (i * 50) + (time % 100);
            const angle = i * (Math.PI * 2 / 5) + time;
            const sx = cx + Math.cos(angle) * 100;
            const sy = cy + Math.sin(angle) * 100;

            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}
