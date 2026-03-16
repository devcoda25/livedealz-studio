// Color Filter Processor - TikTok-style color presets and beauty filters
import { ColorFilterConfig, BEAUTY_FILTERS, COLOR_FILTERS } from '../types';

export class ColorFilterProcessor {
    private ctx: CanvasRenderingContext2D | null = null;
    private activeFilter: ColorFilterConfig | null = null;
    private intensity: number = 100; // 0-100

    constructor() { }

    attach(ctx: CanvasRenderingContext2D): void {
        this.ctx = ctx;
    }

    setFilter(filter: ColorFilterConfig | null): void {
        this.activeFilter = filter;
    }

    setIntensity(value: number): void {
        this.intensity = Math.max(0, Math.min(100, value));
    }

    getIntensity(): number {
        return this.intensity;
    }

    getCSSFilter(): string {
        if (!this.activeFilter) return 'none';

        const filter = this.activeFilter.cssFilter;
        const intensity = this.intensity / 100;

        // Apply intensity by blending with none
        if (intensity === 1) return filter;
        if (intensity === 0) return 'none';

        // For CSS filters, intensity is harder to apply directly
        // We'll use a workaround: apply brightness as a multiplier
        if (filter !== 'none') {
            // Parse the filter and adjust based on intensity
            return this.applyIntensityToFilter(filter, intensity);
        }

        return filter;
    }

    private applyIntensityToFilter(filter: string, intensity: number): string {
        // Simple intensity adjustment - increase/decrease brightness based on intensity
        // This is a simplified approach; real implementation would parse the CSS filter
        const brightness = 0.5 + (intensity * 0.5); // 0.5 to 1.0
        return `${filter} brightness(${brightness})`;
    }

    applyToCanvas(sourceCtx: CanvasRenderingContext2D, destCanvas: HTMLCanvasElement): void {
        if (!this.ctx || !this.activeFilter || this.activeFilter.cssFilter === 'none') {
            // Just copy the source
            this.ctx?.drawImage(sourceCtx.canvas, 0, 0);
            return;
        }

        // Apply CSS filter using a temporary canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = destCanvas.width;
        tempCanvas.height = destCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        if (!tempCtx) return;

        // Copy source
        tempCtx.drawImage(sourceCtx.canvas, 0, 0);

        // Apply CSS filter
        const filterString = this.getCSSFilter();
        tempCtx.filter = filterString;
        tempCtx.drawImage(tempCanvas, 0, 0);
        tempCtx.filter = 'none';

        // Draw to destination
        this.ctx.drawImage(tempCanvas, 0, 0);
    }

    // Apply bilateral filter for skin smoothing (beauty effect)
    // This is a simplified version - real implementation would use WebGL for performance
    applySkinSmoothing(ctx: CanvasRenderingContext2D, intensity: number): void {
        // Placeholder for bilateral filter implementation
        // Real implementation would use a proper bilateral filter algorithm
        // or TensorFlow.js face mesh for intelligent skin detection
        console.log('Skin smoothing applied with intensity:', intensity);
    }

    // Get all available color filters
    static getColorFilters(): ColorFilterConfig[] {
        return COLOR_FILTERS;
    }

    // Get all available beauty filters
    static getBeautyFilters(): ColorFilterConfig[] {
        return BEAUTY_FILTERS;
    }

    // Get filter options for UI
    getFilterOptions(): { name: string; icon: string; description?: string }[] {
        if (!this.activeFilter) return [];

        return [{
            name: this.activeFilter.name,
            icon: this.activeFilter.icon,
            description: this.activeFilter.description,
        }];
    }
}

export default ColorFilterProcessor;
