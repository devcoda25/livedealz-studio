/**
 * Canvas Compositor
 * 
 * Handles rendering of scene sources onto an HTML5 Canvas,
 * including video streams, images, text overlays, and widgets.
 */

import { CanvasSource, SourceTransform, Scene, OverlayConfig, ProductWidgetConfig } from '@/types/scene-composer';

export class CanvasCompositor {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private sources: Map<string, CanvasSource> = new Map();
    private videoElements: Map<string, HTMLVideoElement> = new Map();
    private imageElements: Map<string, HTMLImageElement> = new Map();
    private animationFrameId: number | null = null;
    private isRendering = false;

    // Canvas dimensions
    private width: number = 1920;
    private height: number = 1080;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Failed to get 2D context from canvas');
        }
        this.ctx = ctx;
    }

    /**
     * Set canvas dimensions
     */
    setDimensions(width: number, height: number): void {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Register a source for rendering
     */
    registerSource(source: CanvasSource): void {
        this.sources.set(source.id, source);

        // Initialize media element based on type
        if (source.type === 'camera' || source.type === 'screen') {
            this.initializeVideoElement(source);
        } else if (source.type === 'image') {
            this.initializeImageElement(source);
        }
    }

    /**
     * Unregister a source
     */
    unregisterSource(sourceId: string): void {
        // Stop video tracks before removing to prevent memory leaks
        const video = this.videoElements.get(sourceId);
        if (video && video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
        }

        this.sources.delete(sourceId);
        this.videoElements.delete(sourceId);
        this.imageElements.delete(sourceId);
    }

    /**
     * Update a source
     */
    updateSource(source: CanvasSource): void {
        this.sources.set(source.id, source);
    }

    /**
     * Initialize video element for camera/screen source
     */
    private async initializeVideoElement(source: CanvasSource): Promise<void> {
        const video = document.createElement('video');
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        try {
            if (source.type === 'camera') {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: source.deviceId ? { deviceId: source.deviceId } : true,
                    audio: false,
                });
                video.srcObject = stream;
            } else if (source.type === 'screen') {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false,
                });
                video.srcObject = stream;
            }

            await video.play();
            this.videoElements.set(source.id, video);
        } catch (error) {
            console.error(`Failed to initialize ${source.type} source:`, error);
        }
    }

    /**
     * Initialize image element
     */
    private initializeImageElement(source: CanvasSource): void {
        if (!source.imageUrl) return;

        const img = new Image();
        img.src = source.imageUrl;
        img.onload = () => {
            this.imageElements.set(source.id, img);
        };
        this.imageElements.set(source.id, img);
    }

    /**
     * Start the render loop
     */
    start(): void {
        if (this.isRendering) return;
        this.isRendering = true;
        this.render();
    }

    /**
     * Stop the render loop
     */
    stop(): void {
        this.isRendering = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main render loop
     */
    private render = (): void => {
        if (!this.isRendering) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Render background (can be customized)
        this.renderBackground('#000000');

        // Get sorted sources by z-index
        const sortedSources = Array.from(this.sources.values())
            .filter(s => s.visible)
            .sort((a, b) => a.zIndex - b.zIndex);

        // Render each source
        for (const source of sortedSources) {
            this.renderSource(source);
        }

        this.animationFrameId = requestAnimationFrame(this.render);
    };

    /**
     * Render canvas background
     */
    private renderBackground(color: string): void {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Render a single source
     */
    private renderSource(source: CanvasSource): void {
        this.ctx.save();

        // Get transform
        const transform = this.getSourceTransform(source);

        // Apply position
        this.ctx.translate(transform.x, transform.y);

        // Apply rotation around center
        if (transform.rotation) {
            const centerX = transform.width / 2;
            const centerY = transform.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((transform.rotation * Math.PI) / 180);
            this.ctx.translate(-centerX, -centerY);
        }

        // Apply scale
        if (transform.scaleX !== 1 || transform.scaleY !== 1) {
            this.ctx.scale(transform.scaleX, transform.scaleY);
        }

        // Apply opacity
        this.ctx.globalAlpha = transform.opacity;

        // Render based on type
        switch (source.type) {
            case 'camera':
            case 'screen':
                this.renderVideoSource(source, transform);
                break;
            case 'image':
                this.renderImageSource(source, transform);
                break;
            case 'text':
                this.renderTextSource(source, transform);
                break;
            case 'product':
                this.renderProductWidget(source, transform);
                break;
            default:
                this.renderPlaceholder(source, transform);
        }

        // Apply crop if specified
        if (source.crop) {
            // Crop is handled by render functions
        }

        // Apply border
        if (transform.borderWidth && transform.borderWidth > 0) {
            this.ctx.strokeStyle = transform.borderColor || '#ffffff';
            this.ctx.lineWidth = transform.borderWidth;
            const radius = transform.borderRadius || 0;
            if (radius > 0) {
                this.roundRect(0, 0, transform.width, transform.height, radius);
                this.ctx.stroke();
            } else {
                this.ctx.strokeRect(0, 0, transform.width, transform.height);
            }
        }

        this.ctx.restore();
    }

    /**
     * Get effective transform for a source
     */
    private getSourceTransform(source: CanvasSource): SourceTransform {
        return {
            x: source.position.x,
            y: source.position.y,
            width: source.size.width,
            height: source.size.height,
            rotation: source.rotation,
            scaleX: source.scale.x,
            scaleY: source.scale.y,
            opacity: source.opacity,
            borderWidth: source.crop ? undefined : 0,
            borderColor: '#ffffff',
            borderRadius: 0,
        };
    }

    /**
     * Render video source (camera or screen share)
     */
    private renderVideoSource(source: CanvasSource, transform: SourceTransform): void {
        const video = this.videoElements.get(source.id);

        if (!video || video.readyState < 2) {
            // Draw placeholder while video loads
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, transform.width, transform.height);

            // Draw loading text
            this.ctx.fillStyle = '#666666';
            this.ctx.font = '24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading video...', transform.width / 2, transform.height / 2);
            return;
        }

        // Draw video maintaining aspect ratio
        this.drawImageCover(video, 0, 0, transform.width, transform.height);
    }

    /**
     * Render image source
     */
    private renderImageSource(source: CanvasSource, transform: SourceTransform): void {
        const img = this.imageElements.get(source.id);

        if (!img || !img.complete) {
            // Draw placeholder while image loads
            this.ctx.fillStyle = '#1a1a2e';
            this.ctx.fillRect(0, 0, transform.width, transform.height);

            // Draw loading text
            this.ctx.fillStyle = '#666666';
            this.ctx.font = '24px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading image...', transform.width / 2, transform.height / 2);
            return;
        }

        // Draw image maintaining aspect ratio
        this.drawImageCover(img, 0, 0, transform.width, transform.height);
    }

    /**
     * Draw image with cover fit (like CSS object-fit: cover)
     */
    private drawImageCover(
        img: HTMLImageElement | HTMLVideoElement,
        x: number,
        y: number,
        width: number,
        height: number
    ): void {
        let imgRatio: number;
        const videoEl = img as HTMLVideoElement;
        const imageEl = img as HTMLImageElement;
        if (videoEl.videoWidth) {
            imgRatio = videoEl.videoWidth / videoEl.videoHeight;
        } else if (imageEl.width) {
            imgRatio = imageEl.width / imageEl.height;
        } else {
            imgRatio = width / height;
        }
        const containerRatio = width / height;

        let drawWidth: number;
        let drawHeight: number;
        let drawX: number;
        let drawY: number;

        if (imgRatio > containerRatio) {
            drawHeight = height;
            drawWidth = height * imgRatio;
            drawX = (width - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = width;
            drawHeight = width / imgRatio;
            drawX = 0;
            drawY = (height - drawHeight) / 2;
        }

        this.ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    /**
     * Render text source
     */
    private renderTextSource(source: CanvasSource, transform: SourceTransform): void {
        const text = source.text || 'Text Overlay';

        // Draw background if specified
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, transform.width, transform.height);

        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 48px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(text, transform.width / 2, transform.height / 2);
    }

    /**
     * Render product widget
     */
    private renderProductWidget(source: CanvasSource, transform: SourceTransform): void {
        const config = source.productConfig;

        // Draw background
        this.ctx.fillStyle = config?.backgroundColor || 'rgba(0, 0, 0, 0.8)';
        const radius = config?.borderRadius || 12;
        this.roundRect(0, 0, transform.width, transform.height, radius);
        this.ctx.fill();

        // Draw placeholder content
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Product Widget', transform.width / 2, transform.height / 2);

        if (config?.showPrice) {
            this.ctx.font = '24px sans-serif';
            this.ctx.fillText('$99.99', transform.width / 2, transform.height / 2 + 40);
        }
    }

    /**
     * Render placeholder for unsupported types
     */
    private renderPlaceholder(source: CanvasSource, transform: SourceTransform): void {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, transform.width, transform.height);

        this.ctx.fillStyle = '#666666';
        this.ctx.font = '24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${source.type}`, transform.width / 2, transform.height / 2);
    }

    /**
     * Draw rounded rectangle
     */
    private roundRect(
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * Render overlays on top of sources
     */
    renderOverlays(overlays: OverlayConfig[]): void {
        for (const overlay of overlays) {
            if (!overlay.enabled) continue;

            this.ctx.save();

            switch (overlay.type) {
                case 'live_badge':
                case 'badge':
                    this.renderLiveBadge(overlay);
                    break;
                case 'viewer_count':
                    this.renderViewerCount(overlay);
                    break;
                case 'flash_deal':
                case 'offer_card':
                    this.renderFlashDeal(overlay);
                    break;
            }

            this.ctx.restore();
        }
    }

    /**
     * Render live badge overlay
     */
    private renderLiveBadge(overlay: OverlayConfig): void {
        const { position, style } = overlay;
        const pos = this.getOverlayPosition(position, 200, 40);

        this.ctx.fillStyle = style.backgroundColor;
        this.roundRect(pos.x, pos.y, 200, 40, 20);
        this.ctx.fill();

        // LIVE text with pulsing dot
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.arc(pos.x + 20, pos.y + 20, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = style.fontColor;
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('LIVE', pos.x + 35, pos.y + 20);
    }

    /**
     * Render viewer count overlay
     */
    private renderViewerCount(overlay: OverlayConfig): void {
        const { position, style } = overlay;
        const pos = this.getOverlayPosition(position, 120, 30);

        this.ctx.fillStyle = style.backgroundColor;
        this.roundRect(pos.x, pos.y, 120, 30, 15);
        this.ctx.fill();

        this.ctx.fillStyle = style.fontColor;
        this.ctx.font = '12px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('1.2K viewers', pos.x + 60, pos.y + 15);
    }

    /**
     * Render flash deal overlay
     */
    private renderFlashDeal(overlay: OverlayConfig): void {
        const { position, style } = overlay;
        const pos = this.getOverlayPosition(position, 300, 50);

        // Flash deal background
        this.ctx.fillStyle = '#f77f00';
        this.roundRect(pos.x, pos.y, 300, 50, 8);
        this.ctx.fill();

        // Flash icon and text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('⚡ FLASH DEAL -25%', pos.x + 150, pos.y + 25);
    }

    /**
     * Calculate overlay position based on anchor
     */
    private getOverlayPosition(
        position: string,
        width: number,
        height: number
    ): { x: number; y: number } {
        const padding = 16;

        switch (position) {
            case 'top-left':
                return { x: padding, y: padding };
            case 'top-center':
                return { x: (this.width - width) / 2, y: padding };
            case 'top-right':
                return { x: this.width - width - padding, y: padding };
            case 'bottom-left':
                return { x: padding, y: this.height - height - padding };
            case 'bottom-center':
                return { x: (this.width - width) / 2, y: this.height - height - padding };
            case 'bottom-right':
                return { x: this.width - width - padding, y: this.height - height - padding };
            default:
                return { x: padding, y: padding };
        }
    }

    /**
     * Capture current frame as image
     */
    captureFrame(): string {
        return this.canvas.toDataURL('image/png');
    }

    /**
     * Clean up resources
     */
    dispose(): void {
        this.stop();

        // Stop all video streams
        for (const video of this.videoElements.values()) {
            const stream = video.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        }

        this.sources.clear();
        this.videoElements.clear();
        this.imageElements.clear();
    }
}

export default CanvasCompositor;
