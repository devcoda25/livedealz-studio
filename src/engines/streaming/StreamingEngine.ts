/**
 * Streaming Engine - Main orchestrator for the video streaming pipeline
 * 
 * Coordinates SceneManager, VideoEncoder, StreamOutput, and StreamHealth
 * to provide a complete streaming solution.
 */

import { 
  StreamConfig, 
  StreamState, 
  StreamQuality,
  DEFAULT_STREAM_CONFIGS,
  StreamingEvent,
  StreamingEventType,
  MediaSource,
} from './types';

import { SceneManager } from './SceneManager';
import { VideoEncoder, AudioEncoder } from './VideoEncoder';
import { StreamOutput, WebRTCViewer } from './StreamOutput';
import { StreamHealthMonitor } from './StreamHealth';
import { StreamRecorder, RecordingOptions } from './StreamRecorder';

import type { Socket } from 'socket.io-client';

type EngineEventCallback = (event: StreamingEvent) => void;

export class StreamingEngine {
  // Core components
  private sceneManager: SceneManager;
  private videoEncoder: VideoEncoder;
  private audioEncoder: AudioEncoder;
  private streamOutput: StreamOutput | null = null;
  private viewer: WebRTCViewer | null = null;
  private healthMonitor: StreamHealthMonitor;
  
  // Configuration
  private config: StreamConfig;
  private state: StreamState = 'idle';
  
  // Output elements
  private canvas: HTMLCanvasElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  
  // Socket.IO for signaling
  private socket: Socket | null = null;
  
  // Event handling
  private eventListeners: Map<StreamingEventType, Set<EngineEventCallback>> = new Map();
  
  // Compositor loop
  private animationFrameId: number | null = null;

  constructor(quality: StreamQuality = 'medium') {
    this.config = DEFAULT_STREAM_CONFIGS[quality];
    this.sceneManager = new SceneManager();
    this.videoEncoder = new VideoEncoder(this.config);
    this.audioEncoder = new AudioEncoder();
    this.healthMonitor = new StreamHealthMonitor();
    
    this.setupEventHandlers();
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    // Forward scene manager events
    this.sceneManager.on('scene:changed', (event) => {
      this.emit('scene:changed', event.data);
    });
    
    this.sceneManager.on('source:added', (event) => {
      this.emit('source:added', event.data);
    });
    
    this.sceneManager.on('source:removed', (event) => {
      this.emit('source:removed', event.data);
    });
    
    this.sceneManager.on('source:updated', (event) => {
      this.emit('source:updated', event.data);
    });
    
    // Health monitor events
    this.healthMonitor.onHealthChangeCallback((health) => {
      this.emit('health:changed', { health });
    });
    
    this.healthMonitor.onWarningCallback((warning) => {
      this.emit('health:warning', { warning });
    });
  }

  // ==========================================
  // Initialization
  // ==========================================

  /**
   * Initialize the engine with output elements
   */
  async initialize(canvas: HTMLCanvasElement, videoElement: HTMLVideoElement): Promise<boolean> {
    this.canvas = canvas;
    this.videoElement = videoElement;
    
    // Initialize canvas
    canvas.width = this.config.resolution.width;
    canvas.height = this.config.resolution.height;
    
    // Initialize scene manager compositor
    this.sceneManager.initializeCompositor(canvas, videoElement);
    
    // Initialize video encoder
    const encoderInitialized = await this.videoEncoder.initialize();
    if (!encoderInitialized) {
      console.warn('Video encoder initialization failed, using fallback');
    }
    
    // Initialize audio encoder
    await this.audioEncoder.initialize();
    
    console.log('StreamingEngine initialized');
    return true;
  }

  /**
   * Set stream configuration
   */
  setConfig(config: Partial<StreamConfig>): void {
    this.config = { ...this.config, ...config };
    this.videoEncoder.updateConfig(this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): StreamConfig {
    return { ...this.config };
  }

  /**
   * Set the Socket.IO instance for signaling (WebRTC, RTMP, HLS)
   */
  setSocket(socket: Socket): void {
    this.socket = socket;
  }

  /**
   * Get the current socket
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  // ==========================================
  // Source Management
  // ==========================================

  /**
   * Add camera source
   */
  async addCamera(
    sourceId: string, 
    name: string, 
    audio: boolean = true
  ): Promise<MediaSource | null> {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: this.config.resolution.width },
        height: { ideal: this.config.resolution.height },
        frameRate: { ideal: this.config.framerate },
      },
      audio: audio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      } : false,
    };
    
    const source = await this.sceneManager.createCameraSource(sourceId, name, constraints);
    return source || null;
  }

  /**
   * Add screen share source
   */
  async addScreenShare(
    sourceId: string, 
    name: string,
    audio: boolean = true
  ): Promise<MediaSource | null> {
    const constraints: DisplayMediaStreamOptions = {
      video: {
        displaySurface: 'monitor',
      },
      audio: audio,
    };
    
    return await this.sceneManager.createScreenShareSource(sourceId, name, constraints);
  }

  /**
   * Add image source
   */
  addImage(sourceId: string, name: string, imageUrl: string): MediaSource {
    return this.sceneManager.createImageSource(sourceId, name, imageUrl);
  }

  /**
   * Add text overlay source
   */
  addText(sourceId: string, name: string, text: string): MediaSource {
    return this.sceneManager.createTextSource(sourceId, name, text);
  }

  /**
   * Get source by ID
   */
  getSource(sourceId: string): MediaSource | undefined {
    return this.sceneManager.getSource(sourceId);
  }

  /**
   * Get all sources
   */
  getSources(): MediaSource[] {
    return this.sceneManager.getSources();
  }

  /**
   * Remove source
   */
  removeSource(sourceId: string): boolean {
    return this.sceneManager.removeSource(sourceId);
  }

  /**
   * Set source volume
   */
  setSourceVolume(sourceId: string, volume: number): boolean {
    return this.sceneManager.setSourceVolume(sourceId, volume);
  }

  /**
   * Set source muted
   */
  setSourceMuted(sourceId: string, muted: boolean): boolean {
    return this.sceneManager.setSourceMuted(sourceId, muted);
  }

  // ==========================================
  // Scene Management
  // ==========================================

  /**
   * Get scene manager
   */
  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  /**
   * Get active scene
   */
  getActiveScene() {
    return this.sceneManager.getActiveScene();
  }

  /**
   * Get all scenes
   */
  getScenes() {
    return this.sceneManager.getScenes();
  }

  /**
   * Set active scene
   */
  setActiveScene(sceneId: string): boolean {
    return this.sceneManager.setActiveScene(sceneId);
  }

  /**
   * Add source to scene
   */
  addSourceToScene(sceneId: string, sourceId: string, zIndex: number = 0): boolean {
    return this.sceneManager.addSourceToScene(sceneId, sourceId, zIndex);
  }

  /**
   * Remove source from scene
   */
  removeSourceFromScene(sceneId: string, sourceId: string): boolean {
    return this.sceneManager.removeSourceFromScene(sceneId, sourceId);
  }

  /**
   * Set source visibility in scene
   */
  setSourceVisible(sceneId: string, sourceId: string, visible: boolean): boolean {
    return this.sceneManager.setSourceVisible(sceneId, sourceId, visible);
  }

  // ==========================================
  // Streaming
  // ==========================================

  /**
   * Start streaming
   */
  async startStream(protocol: 'webrtc' | 'rtmp' | 'hls', outputConfig?: Record<string, unknown>): Promise<boolean> {
    if (this.state === 'live') {
      console.warn('Already streaming');
      return false;
    }

    this.setState('connecting');

    try {
      // Start compositor
      this.sceneManager.startCompositing();
      
      // Get composed stream with configured framerate
      const stream = this.sceneManager.getComposedStream(this.config.framerate);
      if (!stream) {
        throw new Error('Failed to get composed stream');
      }
      
      // Set up encoder with stream
      this.videoEncoder.startEncoding(stream);
      this.audioEncoder.startEncoding(stream);
      
      // Create and start output
      this.streamOutput = new StreamOutput(this.config);
      
      // Generate a unique stream ID
      const streamId = (outputConfig?.streamId as string) || `stream-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      switch (protocol) {
        case 'webrtc':
          await this.streamOutput.startWebRTC({
            streamId,
            iceServers: outputConfig?.iceServers as RTCIceServer[] || undefined,
            socket: this.socket || undefined,
          });
          break;
          
        case 'rtmp':
          // Set socket and streamId before starting RTMP
          if (this.socket) {
            this.streamOutput.setSocket(this.socket);
          }
          await this.streamOutput.startRTMP({
            url: outputConfig?.url as string || 'rtmp://your-server.com/live',
            streamKey: outputConfig?.streamKey as string || 'stream-key',
          });
          break;
          
        case 'hls':
          await this.streamOutput.startHLS({
            streamId,
            segmentDuration: outputConfig?.segmentDuration as number || 6,
            socket: this.socket || undefined,
          });
          break;
      }
      
      // Set local stream
      if (stream) {
        this.streamOutput.setLocalStream(stream);
      }
      
      // Route encoded frames to output
      this.videoEncoder.onFrame((frame) => {
        this.streamOutput?.sendVideoFrame(frame.data, frame.timestamp, frame.type === 'keyframe');
      });

      this.audioEncoder.onFrame((data, timestamp) => {
        this.streamOutput?.sendAudioFrame(data, timestamp);
      });
      
      // Start health monitoring
      this.healthMonitor.startMonitoring();
      
      this.setState('live');
      this.emit('stream:started', { protocol, streamId });
      
      return true;
    } catch (error) {
      console.error('Failed to start stream:', error);
      this.setState('error');
      this.emit('stream:error', { error: (error as Error).message });
      return false;
    }
  }

  /**
   * Stop streaming
   */
  async stopStream(): Promise<void> {
    if (this.state !== 'live' && this.state !== 'reconnecting') {
      return;
    }
    
    // Stop compositor
    this.sceneManager.stopCompositing();
    
    // Stop encoder
    this.videoEncoder.stop();
    this.audioEncoder.stop();
    
    // Stop output
    if (this.streamOutput) {
      await this.streamOutput.stop();
      this.streamOutput = null;
    }
    
    // Stop health monitoring
    this.healthMonitor.stopMonitoring();
    
    this.setState('stopped');
    this.emit('stream:stopped', {});
  }

  /**
   * Switch scene (seamless transition)
   */
  async switchScene(sceneId: string): Promise<boolean> {
    const success = this.sceneManager.setActiveScene(sceneId);
    if (success) {
      this.emit('scene:changed', { sceneId });
      
      // Force keyframe for clean cut
      await this.videoEncoder.forceKeyFrame();
    }
    return success;
  }

  // ==========================================
  // Viewer (for watching streams)
  // ==========================================

  /**
   * Connect as viewer
   */
  async connectViewer(signalingUrl: string, streamId: string): Promise<MediaStream | null> {
    this.viewer = new WebRTCViewer();
    return await this.viewer.connect(signalingUrl, streamId);
  }

  /**
   * Disconnect viewer
   */
  disconnectViewer(): void {
    if (this.viewer) {
      this.viewer.disconnect();
      this.viewer = null;
    }
  }

  /**
   * Get viewer stream
   */
  getViewerStream(): MediaStream | null {
    return this.viewer ? null : null; // Would need to expose from WebRTCViewer
  }

  // ==========================================
  // Health & Monitoring
  // ==========================================

  /**
   * Get health monitor
   */
  getHealthMonitor(): StreamHealthMonitor {
    return this.healthMonitor;
  }

  /**
   * Get current stream health
   */
  getStreamHealth() {
    return this.healthMonitor.getHealth();
  }

  /**
   * Get stream statistics
   */
  getStats() {
    return {
      state: this.state,
      config: this.config,
      encoder: this.videoEncoder.getStats(),
      health: this.healthMonitor.getStats(),
      output: this.streamOutput?.getStats() || null,
    };
  }

  // ==========================================
  // State Management
  // ==========================================

  /**
   * Get current state
   */
  getState(): StreamState {
    return this.state;
  }

  /**
   * Set state
   */
  private setState(state: StreamState): void {
    const previousState = this.state;
    this.state = state;
    
    this.emit('state:changed', { 
      previous: previousState, 
      current: state 
    });
  }

  // ==========================================
  // Event System
  // ==========================================

  /**
   * Subscribe to events
   */
  on(event: StreamingEventType, callback: EngineEventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  off(event: StreamingEventType, callback: EngineEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event
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
   * Destroy the engine
   */
  destroy(): void {
    this.stopStream();
    this.disconnectViewer();
    this.sceneManager.destroy();
    this.healthMonitor.destroy();
    this.eventListeners.clear();
    
    this.canvas = null;
    this.videoElement = null;
    
    console.log('StreamingEngine destroyed');
  }
}

/**
 * Factory function to create a configured streaming engine
 */
export function createStreamingEngine(quality: StreamQuality = 'medium'): StreamingEngine {
  return new StreamingEngine(quality);
}

/**
 * Get available hardware acceleration
 */
export async function getHardwareAcceleration(): Promise<{
  available: boolean;
  type: string;
  name: string;
}[]> {
  const results: { available: boolean; type: string; name: string }[] = [];
  
  // Check for VideoEncoder support
  if (VideoEncoder.isSupported()) {
    const configs = await VideoEncoder.getSupportedConfigs();
    
    // Assume hardware acceleration if supported configs exist
    if (configs.length > 0) {
      results.push({
        available: true,
        type: 'hardware',
        name: 'WebCodecs Hardware Encoder',
      });
    }
  }
  
  // Always allow software fallback
  results.push({
    available: true,
    type: 'software',
    name: 'Software Encoder',
  });
  
  return results;
}
