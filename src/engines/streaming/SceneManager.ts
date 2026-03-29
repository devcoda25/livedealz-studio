/**
 * Scene Manager - Handles scene composition and source management
 * 
 * Manages multiple scenes with sources, handles transitions,
 * and provides compositing capabilities for the video pipeline.
 */

import { 
  Scene, 
  SceneSource, 
  MediaSource, 
  SourceTransform,
  SourceType,
  SceneLayout,
  SceneTransition,
  StreamingEvent,
  StreamingEventType 
} from './types';

type EventCallback = (event: StreamingEvent) => void;

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private sources: Map<string, MediaSource> = new Map();
  private activeSceneId: string | null = null;
  private previewSceneId: string | null = null;
  private eventListeners: Map<StreamingEventType, Set<EventCallback>> = new Map();
  
  // Canvas for composition
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private outputElement: HTMLVideoElement | null = null;
  
  // Composition loop
  private animationFrameId: number | null = null;
  private isComposing = false;

  constructor() {
    this.initializeDefaultScenes();
  }

  /**
   * Initialize with default scene presets
   */
  private initializeDefaultScenes() {
    const defaultScenes: Omit<Scene, 'sources' | 'audioSources'>[] = [
      {
        id: 'intro_host',
        name: 'Intro + Host',
        description: 'Single camera view',
        layout: 'full',
        masterVolume: 1.0,
        isActive: false,
        previewEnabled: true,
      },
      {
        id: 'single_cam',
        name: 'Single Camera',
        description: 'Standard camera view',
        layout: 'full',
        masterVolume: 1.0,
        isActive: false,
        previewEnabled: true,
      },
      {
        id: 'product_closeup',
        name: 'Product Close-up',
        description: 'Hero overlay with product',
        layout: 'full',
        masterVolume: 1.0,
        isActive: false,
        previewEnabled: true,
      },
      {
        id: 'split_screen',
        name: 'Split Screen',
        description: 'Host + product side by side',
        layout: 'split',
        masterVolume: 1.0,
        isActive: false,
        previewEnabled: true,
      },
      {
        id: 'flash_offer',
        name: 'Flash Offer',
        description: 'High urgency offer layout',
        layout: 'pip',
        masterVolume: 1.0,
        isActive: false,
        previewEnabled: true,
      },
    ];

    defaultScenes.forEach(scene => {
      this.scenes.set(scene.id, {
        ...scene,
        sources: [],
        audioSources: [],
      });
    });

    // Set first scene as active
    this.activeSceneId = 'intro_host';
    const scene = this.scenes.get('intro_host');
    if (scene) scene.isActive = true;
  }

  // ==========================================
  // Scene Operations
  // ==========================================

  /**
   * Create a new scene
   */
  createScene(id: string, name: string, layout: SceneLayout = 'full'): Scene {
    const scene: Scene = {
      id,
      name,
      layout,
      sources: [],
      audioSources: [],
      masterVolume: 1.0,
      isActive: false,
      previewEnabled: true,
    };
    this.scenes.set(id, scene);
    this.emit('source:added', { sceneId: id });
    return scene;
  }

  /**
   * Delete a scene
   */
  deleteScene(id: string): boolean {
    if (id === this.activeSceneId) {
      console.warn('Cannot delete active scene');
      return false;
    }
    const result = this.scenes.delete(id);
    if (result) {
      this.emit('source:removed', { sceneId: id });
    }
    return result;
  }

  /**
   * Get all scenes
   */
  getScenes(): Scene[] {
    return Array.from(this.scenes.values());
  }

  /**
   * Get scene by ID
   */
  getScene(id: string): Scene | undefined {
    return this.scenes.get(id);
  }

  /**
   * Set active scene (the one being streamed)
   */
  setActiveScene(id: string): boolean {
    const scene = this.scenes.get(id);
    if (!scene) return false;

    // Deactivate current scene
    const current = this.scenes.get(this.activeSceneId!);
    if (current) current.isActive = false;

    // Activate new scene
    this.activeSceneId = id;
    scene.isActive = true;

    this.emit('scene:changed', { sceneId: id });
    return true;
  }

  /**
   * Get active scene
   */
  getActiveScene(): Scene | undefined {
    return this.activeSceneId ? this.scenes.get(this.activeSceneId) : undefined;
  }

  /**
   * Set preview scene
   */
  setPreviewScene(id: string): boolean {
    const scene = this.scenes.get(id);
    if (!scene) return false;
    this.previewSceneId = id;
    return true;
  }

  /**
   * Get preview scene
   */
  getPreviewScene(): Scene | undefined {
    return this.previewSceneId ? this.scenes.get(this.previewSceneId) : undefined;
  }

  /**
   * Update scene layout
   */
  updateSceneLayout(id: string, layout: SceneLayout): boolean {
    const scene = this.scenes.get(id);
    if (!scene) return false;
    scene.layout = layout;
    this.emit('source:updated', { sceneId: id });
    return true;
  }

  /**
   * Set scene transition
   */
  setSceneTransition(id: string, transition: SceneTransition): boolean {
    const scene = this.scenes.get(id);
    if (!scene) return false;
    scene.transition = transition;
    return true;
  }

  // ==========================================
  // Source Operations
  // ==========================================

  /**
   * Add a source to a scene
   */
  addSourceToScene(sceneId: string, sourceId: string, zIndex: number = 0): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const source = this.sources.get(sourceId);
    if (!source) return false;

    // Check if already in scene
    const existingIndex = scene.sources.findIndex(s => s.sourceId === sourceId);
    if (existingIndex >= 0) {
      scene.sources[existingIndex].zIndex = zIndex;
    } else {
      scene.sources.push({
        sourceId,
        zIndex,
        locked: false,
        visible: true,
      });
    }

    // Sort by z-index
    scene.sources.sort((a, b) => a.zIndex - b.zIndex);

    this.emit('source:added', { sceneId, sourceId });
    return true;
  }

  /**
   * Remove a source from a scene
   */
  removeSourceFromScene(sceneId: string, sourceId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const index = scene.sources.findIndex(s => s.sourceId === sourceId);
    if (index < 0) return false;

    scene.sources.splice(index, 1);
    this.emit('source:removed', { sceneId, sourceId });
    return true;
  }

  /**
   * Create a camera source
   */
  async createCameraSource(
    id: string, 
    name: string, 
    constraints: MediaStreamConstraints = { video: true, audio: true }
  ): Promise<MediaSource | null> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const source: MediaSource = {
        id,
        type: 'camera',
        name,
        enabled: true,
        stream,
        volume: 1.0,
        muted: false,
        isActive: true,
        transform: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          rotation: 0,
          opacity: 1.0,
        },
      };

      this.sources.set(id, source);
      return source;
    } catch (error) {
      console.error('Failed to create camera source:', error);
      return null;
    }
  }

  /**
   * Create a screen share source
   */
  async createScreenShareSource(
    id: string,
    name: string,
    constraints: DisplayMediaStreamOptions = { video: true, audio: true }
  ): Promise<MediaSource | null> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
      
      const source: MediaSource = {
        id,
        type: 'screen',
        name,
        enabled: true,
        stream,
        volume: 1.0,
        muted: false,
        isActive: true,
        transform: {
          x: 0,
          y: 0,
          width: 1920,
          height: 1080,
          rotation: 0,
          opacity: 1.0,
        },
      };

      this.sources.set(id, source);

      // Listen for screen share stop
      stream.getVideoTracks()[0].onended = () => {
        this.setSourceActive(id, false);
      };

      return source;
    } catch (error) {
      console.error('Failed to create screen share source:', error);
      return null;
    }
  }

  /**
   * Create an image source
   */
  createImageSource(id: string, name: string, imageUrl: string): MediaSource {
    const source: MediaSource = {
      id,
      type: 'image',
      name,
      enabled: true,
      imageUrl,
      volume: 1.0,
      muted: true,
      isActive: false,
      transform: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        rotation: 0,
        opacity: 1.0,
      },
    };

    this.sources.set(id, source);
    return source;
  }

  /**
   * Create a text/overlay source
   */
  createTextSource(id: string, name: string, textContent: string): MediaSource {
    const source: MediaSource = {
      id,
      type: 'text',
      name,
      enabled: true,
      textContent,
      volume: 1.0,
      muted: true,
      isActive: false,
      transform: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080,
        rotation: 0,
        opacity: 1.0,
      },
    };

    this.sources.set(id, source);
    return source;
  }

  /**
   * Get all sources
   */
  getSources(): MediaSource[] {
    return Array.from(this.sources.values());
  }

  /**
   * Get source by ID
   */
  getSource(id: string): MediaSource | undefined {
    return this.sources.get(id);
  }

  /**
   * Update source transform
   */
  updateSourceTransform(id: string, transform: Partial<SourceTransform>): boolean {
    const source = this.sources.get(id);
    if (!source) return false;

    source.transform = { ...source.transform!, ...transform };
    this.emit('source:updated', { sourceId: id });
    return true;
  }

  /**
   * Set source visibility
   */
  setSourceVisible(sceneId: string, sourceId: string, visible: boolean): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const sceneSource = scene.sources.find(s => s.sourceId === sourceId);
    if (!sceneSource) return false;

    sceneSource.visible = visible;
    this.emit('source:updated', { sceneId, sourceId });
    return true;
  }

  /**
   * Set source active state
   */
  setSourceActive(id: string, active: boolean): boolean {
    const source = this.sources.get(id);
    if (!source) return false;

    source.isActive = active;
    this.emit('source:updated', { sourceId: id });
    return true;
  }

  /**
   * Set source volume
   */
  setSourceVolume(id: string, volume: number): boolean {
    const source = this.sources.get(id);
    if (!source) return false;

    source.volume = Math.max(0, Math.min(1, volume));

    // Update audio track volume if applicable
    if (source.stream) {
      source.stream.getAudioTracks().forEach(track => {
        track.enabled = source.volume > 0 && !source.muted;
      });
    }

    return true;
  }

  /**
   * Set source muted state
   */
  setSourceMuted(id: string, muted: boolean): boolean {
    const source = this.sources.get(id);
    if (!source) return false;

    source.muted = muted;

    // Update audio track
    if (source.stream) {
      source.stream.getAudioTracks().forEach(track => {
        track.enabled = source!.volume > 0 && !muted;
      });
    }

    return true;
  }

  /**
   * Remove a source entirely
   */
  removeSource(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;

    // Stop all tracks
    if (source.stream) {
      source.stream.getTracks().forEach(track => track.stop());
    }

    // Remove from all scenes
    this.scenes.forEach(scene => {
      const index = scene.sources.findIndex(s => s.sourceId === id);
      if (index >= 0) {
        scene.sources.splice(index, 1);
      }
    });

    this.sources.delete(id);
    this.emit('source:removed', { sourceId: id });
    return true;
  }

  // ==========================================
  // Audio Mixing
  // ==========================================

  /**
   * Add source to audio mixer
   */
  addAudioSource(sceneId: string, sourceId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    if (!scene.audioSources.includes(sourceId)) {
      scene.audioSources.push(sourceId);
    }
    return true;
  }

  /**
   * Remove source from audio mixer
   */
  removeAudioSource(sceneId: string, sourceId: string): boolean {
    const scene = this.scenes.get(sceneId);
    if (!scene) return false;

    const index = scene.audioSources.indexOf(sourceId);
    if (index >= 0) {
      scene.audioSources.splice(index, 1);
    }
    return true;
  }

  /**
   * Get mixed audio stream for a scene
   */
  getMixedAudio(sceneId: string): MediaStream | null {
    const scene = this.scenes.get(sceneId);
    if (!scene) return null;

    const audioTracks: MediaStreamTrack[] = [];

    scene.audioSources.forEach(sourceId => {
      const source = this.sources.get(sourceId);
      if (source?.stream && !source.muted && source.volume > 0) {
        source.stream.getAudioTracks().forEach(track => {
          audioTracks.push(track);
        });
      }
    });

    if (audioTracks.length === 0) return null;

    return new MediaStream(audioTracks);
  }

  // ==========================================
  // Compositing
  // ==========================================

  /**
   * Initialize compositor with canvas
   */
  initializeCompositor(canvas: HTMLCanvasElement, outputVideo: HTMLVideoElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.outputElement = outputVideo;
  }

  /**
   * Start compositing loop
   */
  startCompositing(): void {
    if (this.isComposing || !this.ctx || !this.canvas) return;
    
    this.isComposing = true;
    this.compositionLoop();
  }

  /**
   * Stop compositing loop
   */
  stopCompositing(): void {
    this.isComposing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main composition loop
   */
  private compositionLoop = (): void => {
    if (!this.isComposing || !this.ctx || !this.canvas) return;

    const scene = this.getActiveScene();
    if (scene) {
      this.composeFrame(scene);
    }

    this.animationFrameId = requestAnimationFrame(this.compositionLoop);
  };

  /**
   * Compose a single frame
   */
  private composeFrame(scene: Scene): void {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply layout
    this.applyLayout(scene, ctx, width, height);

    // Draw each visible source
    scene.sources.forEach(sceneSource => {
      if (!sceneSource.visible) return;

      const source = this.sources.get(sceneSource.sourceId);
      if (!source || !source.isActive) return;

      this.drawSource(source, sceneSource, ctx, width, height);
    });

    // Draw to output video element if available
    if (this.outputElement && typeof this.canvas.captureStream === 'function') {
      // Stream is handled by encoder
    }
  }

  /**
   * Apply scene layout
   */
  private applyLayout(scene: Scene, ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const layout = scene.layout;
    const sources = scene.sources.filter(s => s.visible);

    switch (layout) {
      case 'full':
        // Single source fills the canvas
        break;
        
      case 'split':
        // Split horizontal - left 50% source 1, right 50% source 2
        if (sources.length >= 2) {
          sources[0].sourceId && this.sources.get(sources[0].sourceId) && 
            this.updateSourceTransform(sources[0].sourceId, { x: 0, y: 0, width: width / 2, height });
          sources[1].sourceId && this.sources.get(sources[1].sourceId) && 
            this.updateSourceTransform(sources[1].sourceId, { x: width / 2, y: 0, width: width / 2, height });
        }
        break;
        
      case 'pip':
        // Picture in picture - main source + small overlay
        if (sources.length >= 2) {
          const pipWidth = width * 0.25;
          const pipHeight = height * 0.25;
          const pipMargin = 20;
          sources[0].sourceId && this.sources.get(sources[0].sourceId) && 
            this.updateSourceTransform(sources[0].sourceId, { x: 0, y: 0, width, height });
          sources[1].sourceId && this.sources.get(sources[1].sourceId) && 
            this.updateSourceTransform(sources[1].sourceId, { 
              x: width - pipWidth - pipMargin, 
              y: height - pipHeight - pipMargin, 
              width: pipWidth, 
              height: pipHeight 
            });
        }
        break;
        
      case 'grid':
        // Grid layout for multiple sources
        const cols = Math.ceil(Math.sqrt(sources.length));
        const rows = Math.ceil(sources.length / cols);
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        
        sources.forEach((src, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          this.updateSourceTransform(src.sourceId, {
            x: col * cellWidth,
            y: row * cellHeight,
            width: cellWidth,
            height: cellHeight,
          });
        });
        break;
    }
  }

  /**
   * Draw a source to canvas
   */
  private drawSource(
    source: MediaSource, 
    sceneSource: SceneSource,
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!sceneSource.visible || !source.transform) return;

    const { x, y, width, height, opacity, rotation } = source.transform;

    ctx.save();
    ctx.globalAlpha = opacity;

    // Apply rotation if needed
    if (rotation !== 0) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    // Draw based on source type
    switch (source.type) {
      case 'camera':
      case 'screen':
        if (source.stream) {
          const video = document.createElement('video');
          video.srcObject = source.stream;
          video.muted = true;
          video.playsInline = true;
          
          if (video.readyState >= 2) {
            ctx.drawImage(video, x, y, width, height);
          }
        }
        break;
        
      case 'image':
        // Images would need to be preloaded
        break;
        
      case 'text':
        if (source.textContent) {
          ctx.fillStyle = 'white';
          ctx.font = '48px sans-serif';
          ctx.fillText(source.textContent, x + 20, y + 60);
        }
        break;
    }

    ctx.restore();
  }

  /**
   * Get composed video stream for output
   */
  getComposedStream(framerate: number = 30): MediaStream | null {
    if (!this.canvas) return null;
    return this.canvas.captureStream(framerate);
  }

  // ==========================================
  // Event System
  // ==========================================

  /**
   * Subscribe to events
   */
  on(event: StreamingEventType, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: StreamingEventType, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event
   */
  private emit(type: StreamingEventType, data?: Record<string, unknown>): void {
    const event: StreamingEvent = {
      type,
      timestamp: Date.now(),
      data,
    };

    this.eventListeners.get(type)?.forEach(callback => callback(event));
  }

  // ==========================================
  // Cleanup
  // ==========================================

  /**
   * Destroy all sources and scenes
   */
  destroy(): void {
    this.stopCompositing();
    
    // Stop all source streams
    this.sources.forEach(source => {
      if (source.stream) {
        source.stream.getTracks().forEach(track => track.stop());
      }
    });

    this.sources.clear();
    this.scenes.clear();
    this.eventListeners.clear();
  }
}

export const sceneManager = new SceneManager();
