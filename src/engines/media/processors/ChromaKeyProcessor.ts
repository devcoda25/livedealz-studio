// Chroma Key Processor - Green screen / Blue screen background removal
import { ChromaKeyConfig, CHROMA_KEY_FILTERS } from '../types';

export class ChromaKeyProcessor {
    private ctx: CanvasRenderingContext2D | null = null;
    
    // Chroma key settings
    private enabled: boolean = false;
    private keyColor: 'green' | 'blue' | 'custom' = 'green';
    private customHue: number = 120; // 0-360 degrees (green=120, blue=240)
    private hueRange: number = 30; // How much hue variation to include
    private saturationThreshold: number = 0.2;
    private lightnessThreshold: number = 0.1;
    private smoothness: number = 0.5; // Edge smoothing
    
    // Background to replace with
    private backgroundColor: string = '#000000';
    private backgroundImage: HTMLImageElement | null = null;
    
    // Processing canvas
    private processCanvas: OffscreenCanvas | null = null;
    private processCtx: OffscreenCanvasRenderingContext2D | null = null;

    constructor() {}

    attach(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    setFilter(config: ChromaKeyConfig): void {
        if (config.id === 'chroma_off') {
            this.enabled = false;
            return;
        }
        
        this.enabled = true;
        this.keyColor = config.keyColor;
        
        if (config.keyColor === 'green') {
            this.customHue = 120;
        } else if (config.keyColor === 'blue') {
            this.customHue = 240;
        } else if (config.customHue !== undefined) {
            this.customHue = config.customHue;
        }
        
        this.saturationThreshold = config.saturationThreshold;
        this.lightnessThreshold = config.lightnessThreshold;
        this.smoothness = config.smoothness;
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    // Set background color or image
    setBackground(color?: string, image?: HTMLImageElement): void {
        this.backgroundColor = color || '#000000';
        this.backgroundImage = image || null;
    }

    // Set custom key color with hue (0-360)
    setCustomKeyColor(hue: number, range: number = 30): void {
        this.keyColor = 'custom';
        this.customHue = hue;
        this.hueRange = range;
    }

    process(video: HTMLVideoElement, outputCanvas: HTMLCanvasElement): void {
        if (!this.ctx || !this.enabled) {
            // Just draw the video
            this.ctx?.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
            return;
        }
        
        this.applyChromaKey(video, outputCanvas);
    }

    private applyChromaKey(video: HTMLVideoElement, outputCanvas: HTMLCanvasElement): void {
        if (!this.ctx) return;
        
        const width = outputCanvas.width;
        const height = outputCanvas.height;
        
        // Create processing canvas if needed
        if (!this.processCanvas || this.processCanvas.width !== width) {
            this.processCanvas = new OffscreenCanvas(width, height);
            this.processCtx = this.processCanvas.getContext('2d', { willReadFrequently: true });
        }
        
        if (!this.processCtx) return;
        
        // Draw video frame
        this.processCtx.drawImage(video, 0, 0, width, height);
        
        // Get image data
        const imageData = this.processCtx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Convert to HSL
            const { h, s, l } = this.rgbToHsl(r, g, b);
            
            // Check if pixel is within key color range
            const hueDiff = Math.abs(h - this.customHue);
            const normalizedHueDiff = Math.min(hueDiff, 360 - hueDiff); // Handle wrap-around
            
            if (normalizedHueDiff < this.hueRange && s > this.saturationThreshold && l > this.lightnessThreshold) {
                // Calculate alpha based on how close to the key color
                const keyness = 1 - (normalizedHueDiff / this.hueRange);
                const alpha = this.smoothEdge(keyness, s, l);
                
                data[i + 3] = Math.round(alpha * 255);
            }
        }
        
        // Put processed image data back
        this.processCtx.putImageData(imageData, 0, 0);
        
        // Draw background
        if (this.backgroundImage) {
            this.ctx.drawImage(this.backgroundImage, 0, 0, width, height);
        } else {
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, width, height);
        }
        
        // Draw the keyed video on top
        this.ctx.drawImage(this.processCanvas, 0, 0);
    }

    private smoothEdge(keyness: number, saturation: number, lightness: number): number {
        // Apply smoothing based on saturation and lightness
        const baseAlpha = keyness;
        
        // Reduce smoothness for very saturated or very dark/light pixels
        const satFactor = saturation > 0.3 ? 1 : saturation / 0.3;
        const lightFactor = (lightness > 0.2 && lightness < 0.8) ? 1 : 
            (lightness <= 0.2 ? lightness / 0.2 : (1 - lightness) / 0.2);
        
        return baseAlpha * satFactor * lightFactor * (1 - this.smoothness * 0.5);
    }

    private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        
        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                    break;
                case g:
                    h = ((b - r) / d + 2) * 60;
                    break;
                case b:
                    h = ((r - g) / d + 4) * 60;
                    break;
            }
        }
        
        return { h, s, l };
    }

    // Adjust keying parameters
    setHueRange(range: number): void {
        this.hueRange = Math.max(5, Math.min(60, range));
    }

    setSaturationThreshold(threshold: number): void {
        this.saturationThreshold = Math.max(0, Math.min(1, threshold));
    }

    setLightnessThreshold(threshold: number): void {
        this.lightnessThreshold = Math.max(0, Math.min(1, threshold));
    }

    setSmoothness(value: number): void {
        this.smoothness = Math.max(0, Math.min(1, value));
    }

    // Get current settings
    getSettings(): {
        keyColor: 'green' | 'blue' | 'custom';
        hueRange: number;
        saturationThreshold: number;
        lightnessThreshold: number;
        smoothness: number;
    } {
        return {
            keyColor: this.keyColor,
            hueRange: this.hueRange,
            saturationThreshold: this.saturationThreshold,
            lightnessThreshold: this.lightnessThreshold,
            smoothness: this.smoothness,
        };
    }

    // Static method to get available chroma key filters
    static getChromaKeyFilters(): ChromaKeyConfig[] {
        return CHROMA_KEY_FILTERS;
    }

    dispose(): void {
        this.processCanvas = null;
        this.processCtx = null;
        this.backgroundImage = null;
    }
}

export default ChromaKeyProcessor;
