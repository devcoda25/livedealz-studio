/**
 * Core Streaming Engine Type Definitions
 * 
 * Defines the interfaces for RTMP/RTMPS/WebRTC streaming,
 * scene management, hardware acceleration, and encoding.
 */

// ============================================
// Stream Configuration
// ============================================

export type StreamProtocol = 'rtmp' | 'rtmps' | 'webrtc' | 'hls';
export type VideoCodec = 'h264' | 'h265' | 'vp8' | 'vp9';
export type AudioCodec = 'aac' | 'opus' | 'mp3';
export type HardwareAccelType = 'nvenc' | 'amf' | 'vaapi' | 'videotoolbox' | 'software';
export type StreamQuality = 'low' | 'medium' | 'high' | 'ultra';
export type StreamState = 'idle' | 'connecting' | 'live' | 'reconnecting' | 'stopped' | 'error';

export interface StreamConfig {
  protocol: StreamProtocol;
  ingestUrl?: string;          // RTMP/RTMPS ingest URL
  streamKey?: string;          // Stream key for RTMP
  outputUrl?: string;          // WebRTC/HLS output URL
  
  // Video settings
  resolution: StreamResolution;
  framerate: number;
  bitrate: VideoBitrate;
  codec: VideoCodec;
  hardwareAccel: HardwareAccelType;
  
  // Audio settings
  audioCodec: AudioCodec;
  audioBitrate: number;
  sampleRate: number;
  channels: 1 | 2;
  
  // Advanced
  keyframeInterval: number;    // GOP size in frames
  profile: 'baseline' | 'main' | 'high';
  preset: 'ultrafast' | 'fast' | 'medium' | 'slow' | 'veryslow';
}

export interface StreamResolution {
  width: number;
  height: number;
}

export interface VideoBitrate {
  target: number;              // Target bitrate in kbps
  max: number;                 // Max bitrate in kbps
  min: number;                 // Min bitrate in kbps
}

// ============================================
// Source Types
// ============================================

export type SourceType = 'camera' | 'screen' | 'image' | 'video' | 'rtmp' | 'audio' | 'text';

export interface MediaSource {
  id: string;
  type: SourceType;
  name: string;
  enabled: boolean;
  
  // Media specific
  stream?: MediaStream;        // For camera/screen
  audioStream?: MediaStream;   // Separate audio track
  
  // Transform settings
  transform?: SourceTransform;
  
  // RTMP specific
  rtmpUrl?: string;
  
  // Static content
  imageUrl?: string;
  videoUrl?: string;
  textContent?: string;
  
  // Audio settings
  volume: number;
  muted: boolean;
  
  // State
  isActive: boolean;
  error?: string;
}

export interface SourceTransform {
  // Position & Scale
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;             // degrees
  
  // Effects
  opacity: number;              // 0-1
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Filters
  filter?: string;             // CSS filter string
}

// ============================================
// Scene Management
// ============================================

export type SceneLayout = 'full' | 'split' | 'pip' | 'grid' | 'custom';

export interface Scene {
  id: string;
  name: string;
  description?: string;
  
  // Layout configuration
  layout: SceneLayout;
  
  // Sources in this scene (ordered by z-index)
  sources: SceneSource[];
  
  // Audio mixing
  audioSources: string[];       // Source IDs
  masterVolume: number;
  
  // Output settings
  outputResolution?: StreamResolution;
  
  // Transition
  transition?: SceneTransition;
  
  // State
  isActive: boolean;
  previewEnabled: boolean;
}

export interface SceneSource {
  sourceId: string;
  zIndex: number;
  locked: boolean;              // Lock position/size
  visible: boolean;
}

export interface SceneTransition {
  type: 'cut' | 'fade' | 'slide' | 'wipe';
  duration: number;             // milliseconds
  easing?: 'linear' | 'ease' | 'ease-in' | 'ease-out';
}

// ============================================
// Compositing
// ============================================

export interface CompositorFrame {
  timestamp: number;
  sceneId: string;
  videoData: VideoFrame;
  audioData?: AudioBuffer;
}

export interface VideoFrame {
  width: number;
  height: number;
  data: ImageData | HTMLCanvasElement;
  presentationTime: number;
}

export interface AudioMixerInput {
  sourceId: string;
  volume: number;
  pan: number;                  // -1 (left) to 1 (right)
  muted: boolean;
}

// ============================================
// Stream Health & Monitoring
// ============================================

export type HealthStatus = 'good' | 'degraded' | 'critical' | 'unknown';

export interface StreamHealth {
  status: HealthStatus;
  timestamp: number;
  
  // Video metrics
  video: {
    bitrate: number;            // Current bitrate in kbps
    fps: number;               // Current framerate
    droppedFrames: number;      // Total dropped frames
    droppedFramesPerSecond: number;
    keyframes: number;
    width: number;
    height: number;
  };
  
  // Audio metrics
  audio: {
    bitrate: number;
    sampleRate: number;
    channels: number;
    droppedPackets: number;
  };
  
  // Network metrics
  network: {
    latency: number;            // RTT in ms
    packetLoss: number;         // Percentage
    jitter: number;             // ms
    bandwidth: number;          // Available bandwidth in kbps
  };
  
  // Encoding metrics
  encoding: {
    cpuUsage: number;          // Percentage
    gpuUsage: number;          // Percentage
    encoderName: string;
    droppedFrames: number;
  };
  
  // Warnings
  warnings: HealthWarning[];
}

export interface HealthWarning {
  id: string;
  type: 'bitrate' | 'fps' | 'latency' | 'dropped' | 'network' | 'encoder';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

// ============================================
// Output Handlers
// ============================================

export interface StreamOutput {
  protocol: StreamProtocol;
  state: 'idle' | 'connecting' | 'connected' | 'error';
  
  // Publishers
  rtmpPublisher?: RTMPPublisher;
  webrtcPublisher?: WebRTCPublisher;
  hlsSegmenter?: HLSSegmenter;
}

export interface RTMPPublisher {
  url: string;
  streamKey: string;
  connected: boolean;
  bytesSent: number;
  lastError?: string;
}

export interface WebRTCPublisher {
  peerConnection: RTCPeerConnection;
  connectionState: RTCPeerConnectionState;
  tracks: MediaStreamTrack[];
}

export interface HLSSegmenter {
  manifestUrl: string;
  segmentDuration: number;
  segmentsGenerated: number;
  latestLatency: number;
}

// ============================================
// Hardware Acceleration
// ============================================

export interface HardwareCapability {
  type: HardwareAccelType;
  name: string;
  vendor: string;
  
  // Supported features
  supportsH264: boolean;
  supportsH265: boolean;
  supportsVP9: boolean;
  supports8K: boolean;
  
  // Performance
  maxResolutions: StreamResolution[];
  maxBitrate: number;
  maxFramerate: number;
  
  // Quality
  supportsBFrames: boolean;
  supportsCBR: boolean;
  supportsVBR: boolean;
}

// ============================================
// Events
// ============================================

export type StreamingEventType = 
  | 'stream:started'
  | 'stream:stopped'
  | 'stream:error'
  | 'stream:reconnecting'
  | 'stream:reconnected'
  | 'scene:changed'
  | 'source:added'
  | 'source:removed'
  | 'source:updated'
  | 'health:changed'
  | 'health:warning'
  | 'output:connected'
  | 'output:disconnected'
  | 'state:changed';

export interface StreamingEvent {
  type: StreamingEventType;
  timestamp: number;
  data?: Record<string, unknown>;
}

// ============================================
// Presets
// ============================================

export const DEFAULT_STREAM_CONFIGS: Record<StreamQuality, StreamConfig> = {
  low: {
    protocol: 'webrtc',
    resolution: { width: 854, height: 480 },
    framerate: 24,
    bitrate: { target: 800, max: 1200, min: 400 },
    codec: 'h264',
    hardwareAccel: 'software',
    audioCodec: 'opus',
    audioBitrate: 64,
    sampleRate: 48000,
    channels: 2,
    keyframeInterval: 48,
    profile: 'main',
    preset: 'fast',
  },
  medium: {
    protocol: 'webrtc',
    resolution: { width: 1280, height: 720 },
    framerate: 30,
    bitrate: { target: 2000, max: 3000, min: 1000 },
    codec: 'h264',
    hardwareAccel: 'software',
    audioCodec: 'aac',
    audioBitrate: 96,
    sampleRate: 48000,
    channels: 2,
    keyframeInterval: 60,
    profile: 'main',
    preset: 'medium',
  },
  high: {
    protocol: 'webrtc',
    resolution: { width: 1920, height: 1080 },
    framerate: 30,
    bitrate: { target: 4500, max: 6000, min: 2500 },
    codec: 'h264',
    hardwareAccel: 'software',
    audioCodec: 'aac',
    audioBitrate: 128,
    sampleRate: 48000,
    channels: 2,
    keyframeInterval: 60,
    profile: 'high',
    preset: 'slow',
  },
  ultra: {
    protocol: 'webrtc',
    resolution: { width: 1920, height: 1080 },
    framerate: 60,
    bitrate: { target: 8000, max: 10000, min: 5000 },
    codec: 'h265',
    hardwareAccel: 'nvenc',
    audioCodec: 'aac',
    audioBitrate: 192,
    sampleRate: 48000,
    channels: 2,
    keyframeInterval: 120,
    profile: 'high',
    preset: 'slow',
  },
};
