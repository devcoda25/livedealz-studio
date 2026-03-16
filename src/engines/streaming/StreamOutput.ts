/**
 * Stream Output - Handles WebRTC, RTMP, and HLS delivery
 * 
 * Provides multiple output protocols for streaming to viewers
 * and ingest from external sources.
 */

import { 
  StreamConfig, 
  StreamProtocol,
  RTMPPublisher,
  WebRTCPublisher,
  HLSSegmenter,
  StreamState,
} from './types';

interface RTMPConfig {
  url: string;
  streamKey: string;
}

interface WebRTCConfig {
  urls: string | string[];
  iceServers?: RTCIceServer[];
}

interface HLSConfig {
  manifestUrl: string;
  segmentDuration: number;
  maxSegments: number;
}

type OutputEventCallback = (event: { type: string; data?: unknown }) => void;

export class StreamOutput {
  private config: StreamConfig;
  private protocol: StreamProtocol;
  private state: StreamState = 'idle';
  
  // Publishers
  private rtmpPublisher: RTMPPublisher | null = null;
  private webrtcPublisher: WebRTCPublisher | null = null;
  private hlsSegmenter: HLSSegmenter | null = null;
  
  // WebRTC specific
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  
  // Callbacks
  private onEvent: OutputEventCallback | null = null;
  private onStateChange: ((state: StreamState) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;

  // WebSocket for RTMP push (simulated)
  private wsConnection: WebSocket | null = null;

  constructor(config: StreamConfig) {
    this.config = config;
    this.protocol = config.protocol;
  }

  /**
   * Set event callback
   */
  on(eventType: string, callback: OutputEventCallback): void {
    this.onEvent = callback;
  }

  /**
   * Set state change callback
   */
  onState(callback: (state: StreamState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * Set error callback
   */
  onErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Start WebRTC output
   */
  async startWebRTC(config: WebRTCConfig): Promise<boolean> {
    if (this.state === 'live') {
      console.warn('Already streaming');
      return false;
    }

    this.setState('connecting');

    try {
      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: config.iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Handle ICE connection state
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        console.log('ICE connection state:', state);
        
        if (state === 'connected' || state === 'completed') {
          this.setState('live');
        } else if (state === 'disconnected' || state === 'failed') {
          this.setState('reconnecting');
          this.attemptReconnect();
        }
      };

      // Handle incoming tracks
      this.peerConnection.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        this.emit('track:received', { kind: event.track.kind });
      };

      // Create data channel for metadata
      this.dataChannel = this.peerConnection.createDataChannel('metadata', {
        ordered: true,
      });

      this.dataChannel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit('data:received', data);
        } catch (e) {
          console.warn('Failed to parse data channel message');
        }
      };

      // Add local tracks if we have them
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection!.addTrack(track, this.localStream!);
        });
      }

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Connect to SFU/MCU (simulated)
      // In production, this would connect to a real WebRTC infrastructure
      console.log('WebRTC offer created, ready to connect to:', config.urls);

      this.webrtcPublisher = {
        peerConnection: this.peerConnection,
        connectionState: this.peerConnection.connectionState,
        tracks: this.localStream?.getTracks() || [],
      };

      return true;
    } catch (error) {
      console.error('Failed to start WebRTC:', error);
      this.setState('error');
      this.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Start RTMP output (push)
   */
  async startRTMP(config: RTMPConfig): Promise<boolean> {
    if (this.state === 'live') {
      console.warn('Already streaming');
      return false;
    }

    this.setState('connecting');

    // Note: Actual RTMP push requires a native module (e.g., node-rtmp)
    // This is a simulation/placeholder for the browser environment
    
    try {
      // Simulate RTMP connection
      console.log('RTMP connection to:', config.url, 'with stream key:', config.streamKey);
      
      // In a real implementation, this would:
      // 1. Connect to RTMP server
      // 2. Send FLV container with H.264/AAC
      // 3. Handle connection states

      this.rtmpPublisher = {
        url: config.url,
        streamKey: config.streamKey,
        connected: true,
        bytesSent: 0,
      };

      this.setState('live');
      return true;
    } catch (error) {
      console.error('Failed to start RTMP:', error);
      this.setState('error');
      this.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Start HLS output (segmenter)
   */
  async startHLS(config: HLSConfig): Promise<boolean> {
    if (this.state === 'live') {
      console.warn('Already streaming');
      return false;
    }

    this.setState('connecting');

    // Note: HLS segmentation in browser requires MediaSource API
    // and typically a separate segmenter service
    
    try {
      // Simulate HLS segmenter
      console.log('HLS manifest URL:', config.manifestUrl);
      
      this.hlsSegmenter = {
        manifestUrl: config.manifestUrl,
        segmentDuration: config.segmentDuration,
        segmentsGenerated: 0,
        latestLatency: 0,
      };

      this.setState('live');
      return true;
    } catch (error) {
      console.error('Failed to start HLS:', error);
      this.setState('error');
      this.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Set local stream to publish
   */
  setLocalStream(stream: MediaStream): void {
    this.localStream = stream;
    
    // Add tracks to peer connection if already connected
    if (this.peerConnection) {
      stream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, stream);
      });
    }
  }

  /**
   * Send video frame data
   */
  sendVideoFrame(data: ArrayBuffer, timestamp: number, isKeyFrame: boolean): void {
    if (this.state !== 'live') return;

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const message = {
        type: 'video',
        data: Array.from(new Uint8Array(data)),
        timestamp,
        keyFrame: isKeyFrame,
      };
      this.dataChannel.send(JSON.stringify(message));
    }

    if (this.rtmpPublisher) {
      // In real implementation, would push to RTMP server
      this.rtmpPublisher.bytesSent += data.byteLength;
    }
  }

  /**
   * Send audio frame data
   */
  sendAudioFrame(data: ArrayBuffer, timestamp: number): void {
    if (this.state !== 'live') return;

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      const message = {
        type: 'audio',
        data: Array.from(new Uint8Array(data)),
        timestamp,
      };
      this.dataChannel.send(JSON.stringify(message));
    }
  }

  /**
   * Attempt to reconnect
   */
  private attemptReconnect(): void {
    console.log('Attempting to reconnect...');
    
    // In a real implementation, would:
    // 1. Wait a short delay
    // 2. Attempt to reconnect ICE
    // 3. If failed, restart the connection
    
    setTimeout(() => {
      if (this.peerConnection?.iceConnectionState === 'failed') {
        this.peerConnection.restartIce();
      }
    }, 2000);
  }

  /**
   * Stop streaming
   */
  async stop(): Promise<void> {
    // Close WebRTC
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.dataChannel = null;
    this.rtmpPublisher = null;
    this.webrtcPublisher = null;
    this.hlsSegmenter = null;
    this.localStream = null;

    this.setState('stopped');
  }

  /**
   * Get current state
   */
  getState(): StreamState {
    return this.state;
  }

  /**
   * Get output stats
   */
  getStats() {
    return {
      state: this.state,
      protocol: this.protocol,
      rtmp: this.rtmpPublisher ? {
        connected: this.rtmpPublisher.connected,
        bytesSent: this.rtmpPublisher.bytesSent,
      } : null,
      webrtc: this.webrtcPublisher ? {
        connectionState: this.webrtcPublisher.connectionState,
        tracksCount: this.webrtcPublisher.tracks.length,
      } : null,
      hls: this.hlsSegmenter ? {
        segmentsGenerated: this.hlsSegmenter.segmentsGenerated,
        latestLatency: this.hlsSegmenter.latestLatency,
      } : null,
    };
  }

  /**
   * Set output state
   */
  private setState(state: StreamState): void {
    this.state = state;
    this.onStateChange?.(state);
    this.emit('state:changed', { state });
  }

  /**
   * Emit event
   */
  private emit(type: string, data?: unknown): void {
    this.onEvent?.({ type, data });
  }
}

/**
 * WebRTC Viewer - Handles viewing WebRTC streams
 */
export class WebRTCViewer {
  private peerConnection: RTCPeerConnection | null = null;
  private remoteStream: MediaStream | null = null;
  private onTrack: ((stream: MediaStream) => void) | null = null;
  private onError: ((error: Error) => void) | null = null;

  /**
   * Connect to a WebRTC stream
   */
  async connect(
    signalingUrl: string,
    streamId: string,
    iceServers?: RTCIceServer[]
  ): Promise<MediaStream | null> {
    try {
      this.peerConnection = new RTCPeerConnection({
        iceServers: iceServers || [
          { urls: 'stun:stun.l.google.com:19302' },
        ],
      });

      // Handle incoming tracks
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.onTrack?.(this.remoteStream);
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Send candidate to signaling server
          this.sendSignalingMessage({
            type: 'ice-candidate',
            candidate: event.candidate,
            streamId,
          });
        }
      };

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer to signaling server
      // In production, this would be a real WebSocket connection
      console.log('Viewer connecting to stream:', streamId);

      return this.remoteStream;
    } catch (error) {
      console.error('Failed to connect to WebRTC stream:', error);
      this.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Disconnect from stream
   */
  disconnect(): void {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }

  /**
   * Set track callback
   */
  onTrackCallback(callback: (stream: MediaStream) => void): void {
    this.onTrack = callback;
  }

  /**
   * Set error callback
   */
  onErrorCallback(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Send signaling message (placeholder)
   */
  private sendSignalingMessage(message: unknown): void {
    // In production, this would send via WebSocket to signaling server
    console.log('Signaling message:', message);
  }
}
