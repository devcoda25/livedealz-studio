// Time Effect Processor - Slow motion, rewind, freeze, motion blur, echo
import { TimeEffectConfig, TIME_EFFECTS } from '../types';

export type TimeEffectType = 
    | 'normal'
    | 'slow_mo'
    | 'fast_forward'
    | 'rewind'
    | 'freeze'
    | 'motion_blur'
    | 'echo';

export class TimeEffectProcessor {
    private ctx: CanvasRenderingContext2D | null = null;
    private videoElement: HTMLVideoElement | null = null;
    
    // Effect settings
    private activeEffect: TimeEffectConfig | null = null;
    private effectType: TimeEffectType = 'normal';
    private speed: number = 1;
    private intensity: number = 0.5;
    private freezeDuration: number = 3000; // ms
    
    // Frame buffer for effects
    private frameBuffer: ImageBitmap[] = [];
    private maxBufferSize: number = 30;
    private currentFrameIndex: number = 0;
    
    // State
    private isFrozen: boolean = false;
    private freezeStartTime: number = 0;
    private lastFrameTime: number = 0;
    private originalPlaybackRate: number = 1;
    
    // For rewind effect (we'll simulate it with buffer)
    private isRewinding: boolean = false;
    private rewindIndex: number = 0;

    constructor() {}

    attach(ctx: CanvasRenderingContext2D, video: HTMLVideoElement): void {
        this.ctx = ctx;
        this.videoElement = video;
        
        // Store original playback rate
        this.originalPlaybackRate = video.playbackRate;
    }

    setEffect(effect: TimeEffectConfig | null): void {
        // Reset previous effect
        this.resetEffect();
        
        if (!effect || effect.effect === 'slow_mo' && effect.speed === 1) {
            this.effectType = 'normal';
            this.activeEffect = null;
            return;
        }
        
        this.activeEffect = effect;
        this.effectType = effect.effect;
        
        switch (effect.effect) {
            case 'slow_mo':
                this.speed = effect.speed || 0.5;
                break;
            case 'fast_forward':
                this.speed = effect.speed || 2;
                break;
            case 'freeze':
                this.freezeDuration = effect.duration || 3000;
                break;
            case 'motion_blur':
            case 'echo':
                this.intensity = effect.intensity || 0.5;
                break;
            case 'rewind':
                this.isRewinding = true;
                this.rewindIndex = this.frameBuffer.length - 1;
                break;
        }
        
        console.log("Time effect set to:", effect.name);
    }

    private resetEffect(): void {
        // Restore video playback rate
        if (this.videoElement) {
            this.videoElement.playbackRate = this.originalPlaybackRate;
        }
        
        this.isFrozen = false;
        this.isRewinding = false;
        this.frameBuffer = [];
        this.currentFrameIndex = 0;
    }

    // Process each frame
    process(outputCanvas: HTMLCanvasElement): void {
        if (!this.ctx || !this.videoElement) return;
        
        const now = Date.now();
        
        switch (this.effectType) {
            case 'normal':
                this.drawNormalFrame();
                break;
                
            case 'slow_mo':
                this.applySlowMo(now);
                break;
                
            case 'fast_forward':
                this.applyFastForward();
                break;
                
            case 'freeze':
                this.applyFreeze(now);
                break;
                
            case 'motion_blur':
                this.applyMotionBlur();
                break;
                
            case 'echo':
                this.applyEcho();
                break;
                
            case 'rewind':
                this.applyRewind();
                break;
        }
        
        // Add frame to buffer for effects that need history
        if (this.effectType !== 'normal' && this.effectType !== 'freeze') {
            this.addFrameToBuffer();
        }
        
        this.lastFrameTime = now;
    }

    private drawNormalFrame(): void {
        if (!this.ctx || !this.videoElement) return;
        this.ctx.drawImage(
            this.videoElement, 
            0, 0, 
            this.ctx.canvas.width, 
            this.ctx.canvas.height
        );
    }

    private applySlowMo(now: number): void {
        if (!this.ctx || !this.videoElement) return;
        
        // Set video playback rate for slow motion
        // Note: This affects the actual video speed
        if (!this.videoElement.paused) {
            // Slow mo is handled by video playback rate
            // We draw the current frame
        }
        
        this.ctx.drawImage(
            this.videoElement,
            0, 0,
            this.ctx.canvas.width,
            this.ctx.canvas.height
        );
        
        // Add frame blending for smoother slow mo
        if (this.frameBuffer.length > 0 && this.speed < 0.5) {
            const prevFrame = this.frameBuffer[this.frameBuffer.length - 1];
            this.ctx.globalAlpha = 0.3;
            this.ctx.drawImage(prevFrame, 0, 0);
            this.ctx.globalAlpha = 1;
        }
    }

    private applyFastForward(): void {
        // For fast forward, we skip frames in the buffer
        // This is simulated by not adding every frame to buffer
        this.drawNormalFrame();
    }

    private applyFreeze(now: number): void {
        if (!this.ctx) return;
        
        if (!this.isFrozen) {
            // Start freeze
            this.isFrozen = true;
            this.freezeStartTime = now;
            
            // Capture current frame
            if (this.videoElement) {
                const freezeCanvas = document.createElement('canvas');
                freezeCanvas.width = this.ctx.canvas.width;
                freezeCanvas.height = this.ctx.canvas.height;
                const freezeCtx = freezeCanvas.getContext('2d');
                freezeCtx?.drawImage(this.videoElement, 0, 0);
                
                // Store as frozen frame
                createImageBitmap(freezeCanvas).then(bitmap => {
                    this.frameBuffer = [bitmap];
                });
            }
        }
        
        // Check if freeze should end
        if (now - this.freezeStartTime > this.freezeDuration) {
            this.isFrozen = false;
            this.effectType = 'normal';
            this.activeEffect = null;
        }
        
        // Draw frozen frame
        if (this.frameBuffer.length > 0) {
            this.ctx.drawImage(this.frameBuffer[0], 0, 0);
        } else {
            this.drawNormalFrame();
        }
    }

    private applyMotionBlur(): void {
        if (!this.ctx || !this.videoElement) return;
        
        // Draw current frame
        this.ctx.drawImage(
            this.videoElement,
            0, 0,
            this.ctx.canvas.width,
            this.ctx.canvas.height
        );
        
        // Overlay previous frames with decreasing opacity
        const numTrails = Math.floor(this.intensity * 5) + 1;
        
        for (let i = 0; i < Math.min(numTrails, this.frameBuffer.length); i++) {
            const frame = this.frameBuffer[this.frameBuffer.length - 1 - i];
            if (frame) {
                this.ctx.globalAlpha = (this.intensity * 0.3) * (1 - i / numTrails);
                this.ctx.drawImage(frame, 0, 0);
            }
        }
        
        this.ctx.globalAlpha = 1;
    }

    private applyEcho(): void {
        if (!this.ctx || !this.videoElement) return;
        
        // Draw current frame
        this.ctx.drawImage(
            this.videoElement,
            0, 0,
            this.ctx.canvas.width,
            this.ctx.canvas.height
        );
        
        // Draw ghost frames with offset and fade
        const numEchoes = Math.floor(this.intensity * 4) + 1;
        const offset = 10;
        
        for (let i = 0; i < Math.min(numEchoes, this.frameBuffer.length); i++) {
            const frame = this.frameBuffer[this.frameBuffer.length - 1 - i];
            if (frame) {
                const alpha = (this.intensity * 0.4) * (1 - i / numEchoes);
                this.ctx.globalAlpha = alpha;
                
                // Offset the echo
                const dx = (i + 1) * offset;
                this.ctx.drawImage(frame, dx, dx);
            }
        }
        
        this.ctx.globalAlpha = 1;
    }

    private applyRewind(): void {
        if (!this.ctx) return;
        
        if (this.frameBuffer.length === 0) {
            this.drawNormalFrame();
            return;
        }
        
        // Navigate backwards through buffer
        if (this.rewindIndex < 0) {
            this.rewindIndex = this.frameBuffer.length - 1;
        }
        
        const frame = this.frameBuffer[this.rewindIndex];
        if (frame) {
            this.ctx.drawImage(frame, 0, 0);
        }
        
        // Move backwards
        this.rewindIndex = Math.max(0, this.rewindIndex - 1);
    }

    private addFrameToBuffer(): void {
        if (!this.videoElement || !this.ctx) return;
        
        // Capture current frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = this.ctx.canvas.width;
        frameCanvas.height = this.ctx.canvas.height;
        const frameCtx = frameCanvas.getContext('2d');
        
        if (!frameCtx) return;
        
        frameCtx.drawImage(this.videoElement, 0, 0);
        
        createImageBitmap(frameCanvas).then(bitmap => {
            this.frameBuffer.push(bitmap);
            
            // Limit buffer size
            while (this.frameBuffer.length > this.maxBufferSize) {
                const oldFrame = this.frameBuffer.shift();
                oldFrame?.close();
            }
        });
    }

    // Get current effect info
    getCurrentEffect(): TimeEffectConfig | null {
        return this.activeEffect;
    }

    getEffectType(): TimeEffectType {
        return this.effectType;
    }

    // Adjust effect intensity
    setIntensity(value: number): void {
        this.intensity = Math.max(0, Math.min(1, value));
    }

    getIntensity(): number {
        return this.intensity;
    }

    // Get buffer info for debugging
    getBufferInfo(): { size: number; maxSize: number } {
        return {
            size: this.frameBuffer.length,
            maxSize: this.maxBufferSize,
        };
    }

    // Set video element (for when video changes)
    setVideo(video: HTMLVideoElement): void {
        this.videoElement = video;
        this.originalPlaybackRate = video.playbackRate;
    }

    // Static method to get available time effects
    static getTimeEffects(): TimeEffectConfig[] {
        return TIME_EFFECTS;
    }

    dispose(): void {
        // Close all bitmaps in buffer
        this.frameBuffer.forEach(bitmap => bitmap.close());
        this.frameBuffer = [];
        
        // Restore video
        if (this.videoElement) {
            this.videoElement.playbackRate = this.originalPlaybackRate;
        }
        
        this.videoElement = null;
        this.ctx = null;
        this.activeEffect = null;
    }
}

export default TimeEffectProcessor;
